(function () {
  // Analizador y reescritor de parámetros de G-code, para verificar un
  // archivo .nc ya generado (por ejemplo en Aspire) y corregir parámetros
  // (feedrate, RPM, Z segura, profundidad final, número de pasadas) SIN
  // tocar la trayectoria XY.
  //
  // Filosofía: es una herramienta de "mejor esfuerzo" con análisis
  // conservador. Si algo no se puede detectar con confianza (p. ej. un
  // patrón de pasada repetible), esa edición específica se desactiva con una
  // advertencia en vez de arriesgar una salida incorrecta. Siempre se
  // recomienda revisar el archivo resultante antes de maquinar.

  const TOLERANCE = 0.001;

  function round(n) {
    return Number(Number(n).toFixed(4));
  }

  function sameValue(a, b) {
    return Math.abs(a - b) <= TOLERANCE;
  }

  function formatNumber(n) {
    return Number(Number(n).toFixed(4)).toString();
  }

  // Quita comentarios (paréntesis y ";") para poder extraer valores sin
  // confundir números que aparecen dentro de un comentario, p. ej.
  // "( PASADA 1 - Z-3.0 )" no debe leerse como una palabra Z real.
  function stripComments(line) {
    return line.replace(/\([^)]*\)/g, ' ').replace(/;.*/g, '');
  }

  // Extrae todas las palabras letra+número de la parte de código (sin
  // comentarios) de una línea. Si una letra aparece más de una vez se
  // conserva la última ocurrencia (poco común en G-code real).
  function extractWords(line) {
    const code = stripComments(line);
    const words = {};
    const re = /([A-Za-z])(-?\d*\.?\d+)/g;
    let match;
    while ((match = re.exec(code))) {
      const letter = match[1].toUpperCase();
      const value = parseFloat(match[2]);
      if (!isNaN(value)) words[letter] = value;
    }
    return words;
  }

  function classify(words) {
    if (words.G === 0) return "G0";
    if (words.G === 1) return "G1";
    if (words.G === 2) return "G2";
    if (words.G === 3) return "G3";
    if (words.M === 3 || words.M === 4) return "spindleOn";
    if (words.M === 5) return "spindleOff";
    if (words.M === 30 || words.M === 2) return "end";
    return null;
  }

  // ---------------------------------------------------------------- Análisis
  function analyze(text) {
    const rawLines = text.replace(/\r\n/g, "\n").split("\n");
    const warnings = [];

    let units = null;
    let motionMode = null;
    let spindleOn = false;
    let sawEnd = false;

    let currentZ = 0;
    let lastMotion = null; // "G0" | "G1" | ...

    const feedCounts = {}; // value -> { value, count, lines: [] }
    const rpmCounts = {};
    const safeZCounts = {}; // G0 Z targets
    const depthEvents = []; // { lineIndex, value } for G1 Z targets (candidatas a profundidad)

    rawLines.forEach(function (line, index) {
      const words = extractWords(line);
      if (words.G === 20) units = "in";
      if (words.G === 21) units = "mm";
      if (words.G === 90) motionMode = "absolute";
      if (words.G === 91) motionMode = "incremental";

      const kind = classify(words);
      if (kind === "spindleOn") spindleOn = true;
      if (kind === "end") sawEnd = true;

      if (typeof words.F === "number" && words.F > 0) {
        const key = round(words.F);
        if (!feedCounts[key]) feedCounts[key] = { value: key, count: 0, lines: [] };
        feedCounts[key].count++;
        feedCounts[key].lines.push(index);
      } else if (typeof words.F === "number" && words.F <= 0) {
        warnings.push("Línea " + (index + 1) + ": feedrate F" + words.F + " no es positivo.");
      }

      if (typeof words.S === "number" && words.S > 0) {
        const key = round(words.S);
        if (!rpmCounts[key]) rpmCounts[key] = { value: key, count: 0, lines: [] };
        rpmCounts[key].count++;
        rpmCounts[key].lines.push(index);
      }

      if (typeof words.Z === "number") {
        // Resuelve Z absoluta (soporte básico para G91 incremental).
        const z = motionMode === "incremental" ? currentZ + words.Z : words.Z;
        currentZ = z;

        if (kind === "G0") {
          const key = round(z);
          if (!safeZCounts[key]) safeZCounts[key] = { value: key, count: 0, lines: [] };
          safeZCounts[key].count++;
          safeZCounts[key].lines.push(index);
        } else if (kind === "G1") {
          depthEvents.push({ lineIndex: index, value: round(z) });
        }
      }

      if (kind) lastMotion = kind;
    });

    if (units === null) warnings.push("No se encontró G20/G21: unidades no confirmadas (se asume mm).");
    if (motionMode === "incremental") warnings.push("Se detectó G91 (modo incremental): el análisis de profundidad es menos confiable que en G90.");
    if (!spindleOn) warnings.push("No se encontró M3/M4: el archivo nunca enciende el spindle.");
    if (!sawEnd) warnings.push("No se encontró M30/M2: el archivo no parece terminar el programa.");

    function topList(counts) {
      return Object.keys(counts)
        .map(function (key) { return counts[key]; })
        .sort(function (a, b) { return b.count - a.count; });
    }

    const feeds = topList(feedCounts);
    const rpms = topList(rpmCounts);
    const safeZList = topList(safeZCounts);
    const safeZ = safeZList.length ? safeZList[0].value : null;

    if (safeZList.length > 1 && safeZList[1].count >= safeZList[0].count * 0.4) {
      warnings.push("Se detectaron varias alturas de retracción distintas (Z" + safeZList[0].value + " y Z" + safeZList[1].value + "); se usará la más frecuente como Z segura.");
    }

    // Profundidades de corte: valores Z de movimientos G1, excluyendo lo que
    // coincide con la Z segura detectada (para no confundir un tránsito por
    // esa altura con una pasada real).
    const depthMap = {};
    depthEvents.forEach(function (event) {
      if (safeZ !== null && sameValue(event.value, safeZ)) return;
      const key = event.value;
      if (!depthMap[key]) depthMap[key] = { value: key, count: 0, firstLine: event.lineIndex };
      depthMap[key].count++;
    });
    const depths = Object.keys(depthMap)
      .map(function (key) { return depthMap[key]; })
      .sort(function (a, b) { return Math.abs(a.value) - Math.abs(b.value); });

    const finalDepth = depths.length ? depths[depths.length - 1].value : null;
    const passCount = depths.length;

    if (!depths.length) warnings.push("No se detectaron profundidades de corte (movimientos G1 con Z).");

    const passPattern = detectPassPattern(rawLines, depths, safeZ);
    if (depths.length > 1 && !passPattern.detected) {
      warnings.push("Las pasadas no repiten exactamente el mismo recorrido XY; no se puede cambiar el número de pasadas de forma segura para este archivo (sí se puede reescalar la profundidad final, y ajustar feed/RPM/Z segura).");
    }

    if (!sameStep(depths)) {
      warnings.push("Las profundidades detectadas no están espaciadas de forma uniforme; revisa la lista antes de confiar en el reescalado.");
    }

    return {
      rawLines: rawLines,
      units: units,
      motionMode: motionMode,
      spindleOn: spindleOn,
      endsProperly: sawEnd,
      feeds: feeds,
      rpms: rpms,
      safeZ: safeZ,
      safeZList: safeZList,
      depths: depths,
      finalDepth: finalDepth,
      passCount: passCount,
      passPattern: passPattern,
      warnings: warnings,
    };
  }

  function sameStep(depths) {
    if (depths.length < 3) return true;
    const magnitudes = depths.map(function (d) { return Math.abs(d.value); });
    const step0 = magnitudes[0];
    for (let i = 1; i < magnitudes.length; i++) {
      const step = magnitudes[i] - magnitudes[i - 1];
      if (Math.abs(step - step0) > Math.max(0.05, step0 * 0.2)) return false;
    }
    return true;
  }

  // ------------------------------------------------- Detección de patrón
  // Busca, para cada profundidad detectada, el rango de líneas donde el
  // corte se mantiene en esa Z (el "bloque" de esa pasada), y compara la
  // secuencia de movimientos XY (tipo + X + Y, ignorando Z/F/S) entre
  // pasadas. Si todas coinciden, el patrón es repetible y es seguro cambiar
  // el número de pasadas regenerando ese bloque a nuevas profundidades.
  function detectPassPattern(rawLines, depths, safeZ) {
    if (depths.length < 1) return { detected: false, reason: "Sin profundidades detectadas." };

    const depthValues = depths.map(function (d) { return d.value; });
    const segments = [];
    let currentDepthIndex = -1;
    let segmentStart = null;
    let currentZ = 0;
    let motionMode = "absolute";

    function closeSegment(endLine) {
      if (segmentStart !== null && currentDepthIndex >= 0) {
        segments.push({ depthIndex: currentDepthIndex, start: segmentStart, end: endLine });
      }
    }

    for (let i = 0; i < rawLines.length; i++) {
      const words = extractWords(rawLines[i]);
      if (words.G === 90) motionMode = "absolute";
      if (words.G === 91) motionMode = "incremental";
      const kind = classify(words);

      if (typeof words.Z === "number") {
        const z = motionMode === "incremental" ? currentZ + words.Z : words.Z;
        currentZ = z;

        if (kind === "G1") {
          const idx = depthValues.findIndex(function (v) { return sameValue(v, z); });
          if (idx >= 0 && idx !== currentDepthIndex) {
            closeSegment(i - 1);
            currentDepthIndex = idx;
            segmentStart = i;
          }
        }
      }
    }
    closeSegment(rawLines.length - 1);

    // El último segmento llega hasta el final del archivo, así que se traga
    // el pie de página (retorno a Z segura, X0 Y0, M5, M30...). Si hay al
    // menos dos pasadas, usamos la longitud de la primera (que sí está
    // acotada correctamente por el inicio de la siguiente) como referencia
    // para recortar el último segmento al mismo tamaño.
    if (segments.length >= 2) {
      const last = segments[segments.length - 1];
      const expectedLength = segments[0].end - segments[0].start + 1;
      const trimmedEnd = last.start + expectedLength - 1;
      if (trimmedEnd < last.end) last.end = trimmedEnd;
    }

    if (segments.length !== depthValues.length) {
      return { detected: false, reason: "No se pudo aislar un bloque por cada profundidad detectada." };
    }

    // Firma de un segmento: secuencia de (tipo, X, Y) de sus movimientos,
    // ignorando la propia Z de profundidad, F y S (pueden variar legítimamente
    // por pasada, p. ej. en modo Adaptive).
    function signature(segment) {
      const moves = [];
      for (let i = segment.start; i <= segment.end; i++) {
        const words = extractWords(rawLines[i]);
        const kind = classify(words);
        if (kind === "G0" || kind === "G1" || kind === "G2" || kind === "G3") {
          moves.push({
            kind: kind,
            x: typeof words.X === "number" ? round(words.X) : null,
            y: typeof words.Y === "number" ? round(words.Y) : null,
          });
        }
      }
      return moves;
    }

    const signatures = segments.map(signature);
    const template = signatures[0];

    function movesEqual(a, b) {
      if (a.kind !== b.kind) return false;
      if (a.x !== null && b.x !== null && !sameValue(a.x, b.x)) return false;
      if (a.y !== null && b.y !== null && !sameValue(a.y, b.y)) return false;
      return true;
    }

    // La última pasada no tiene una pasada siguiente de la cual "heredar" su
    // línea de aproximación (retracción + reposicionamiento antes del
    // siguiente plunge), así que en su lugar arrastra el pie de página del
    // archivo (retorno a X0 Y0, etc.). Por eso se tolera un pequeño desajuste
    // al final de cada pasada (máximo ALLOWED_TAIL_MISMATCH movimientos) sin
    // dejar de considerar el patrón como repetible: lo importante es que
    // coincida el recorrido de corte real, no ese remate ambiguo.
    const ALLOWED_TAIL_MISMATCH = 2;

    for (let s = 1; s < signatures.length; s++) {
      const sig = signatures[s];
      if (sig.length !== template.length) {
        return { detected: false, reason: "Las pasadas tienen distinto número de movimientos." };
      }
      let commonPrefix = 0;
      while (commonPrefix < sig.length && movesEqual(template[commonPrefix], sig[commonPrefix])) commonPrefix++;
      if (commonPrefix < sig.length - ALLOWED_TAIL_MISMATCH) {
        return { detected: false, reason: "Las coordenadas XY difieren entre pasadas." };
      }
    }

    return {
      detected: true,
      segments: segments,
      preambleEnd: segments[0].start - 1,
      footerStart: segments[segments.length - 1].end + 1,
    };
  }

  // -------------------------------------------------------------- Reescritura
  // Reemplaza SOLO la ocurrencia de "letter<oldValue>" en una línea (fuera de
  // comentarios) por "letter<newValue>", preservando todo lo demás tal cual
  // (incluidos comentarios y otras palabras de la misma línea).
  function replaceWord(line, letter, oldValue, newValue) {
    const commentMatches = [];
    const re = /\([^)]*\)/g;
    let m;
    while ((m = re.exec(line))) commentMatches.push([m.index, m.index + m[0].length]);

    function insideComment(pos) {
      return commentMatches.some(function (range) { return pos >= range[0] && pos < range[1]; });
    }

    const wordRe = new RegExp("([A-Za-z])(-?\\d*\\.?\\d+)", "g");
    let result = "";
    let lastIndex = 0;
    let match;
    while ((match = wordRe.exec(line))) {
      if (insideComment(match.index)) continue;
      const lineLetter = match[1].toUpperCase();
      const value = parseFloat(match[2]);
      if (lineLetter === letter.toUpperCase() && !isNaN(value) && sameValue(value, oldValue)) {
        result += line.slice(lastIndex, match.index);
        result += match[1] + formatNumber(newValue);
        lastIndex = match.index + match[0].length;
      }
    }
    result += line.slice(lastIndex);
    return result;
  }

  // Aplica una lista de sustituciones { letter, oldValue, newValue } a un
  // arreglo de líneas, devolviendo un arreglo nuevo.
  function applySubstitutions(lines, substitutions) {
    if (!substitutions.length) return lines.slice();
    return lines.map(function (line) {
      let result = line;
      substitutions.forEach(function (sub) {
        result = replaceWord(result, sub.letter, sub.oldValue, sub.newValue);
      });
      return result;
    });
  }

  // Reescala todas las profundidades detectadas por un factor común,
  // preservando la proporción original entre pasadas (mismo número de
  // pasadas, mismo reparto relativo, distinta profundidad final).
  function rescaleDepths(lines, depths, scale) {
    const substitutions = depths.map(function (d) {
      return { letter: "Z", oldValue: d.value, newValue: round(d.value * scale) };
    });
    return applySubstitutions(lines, substitutions);
  }

  // Regenera el bloque de pasada repetible a un nuevo número de pasadas,
  // distribuyendo la profundidad final en partes iguales (mismo criterio que
  // "Auto distribuir profundidad" en Adaptive Passes). Solo se llama si
  // analysis.passPattern.detected es true.
  function regeneratePasses(analysis, newPassCount, newFinalDepth) {
    const lines = analysis.rawLines;
    const pattern = analysis.passPattern;
    const templateSegment = pattern.segments[0];
    const templateDepth = analysis.depths[0].value;
    const sign = templateDepth < 0 ? -1 : 1;
    const finalAbs = Math.abs(newFinalDepth);
    const count = Math.max(1, Math.floor(newPassCount));

    const preamble = lines.slice(0, pattern.preambleEnd + 1);
    const footer = lines.slice(pattern.footerStart);
    const templateLines = lines.slice(templateSegment.start, templateSegment.end + 1);

    const step = finalAbs / count;
    const newLines = preamble.slice();

    for (let i = 0; i < count; i++) {
      const isLast = i === count - 1;
      const depthAbs = isLast ? finalAbs : step * (i + 1);
      const newDepth = sign * round(depthAbs);
      const cloned = templateLines.map(function (line) {
        let result = replaceWord(line, "Z", templateDepth, newDepth);
        // Actualiza el texto "PASADA N DE M" si existe, para no dejar un
        // comentario desactualizado.
        result = result.replace(/PASADA\s+\d+\s+DE\s+\d+/i, "PASADA " + (i + 1) + " DE " + count);
        return result;
      });
      newLines.push.apply(newLines, cloned);
    }

    newLines.push.apply(newLines, footer);
    return newLines;
  }

  // edits: { feeds: [{oldValue,newValue}], rpms: [{oldValue,newValue}],
  //          safeZ: newValue|null, finalDepth: newValue|null, passCount: newValue|null }
  function rewrite(analysis, edits) {
    let lines = analysis.rawLines;
    const changes = [];

    const passCountChanged = edits.passCount && edits.passCount !== analysis.passCount;

    if (passCountChanged) {
      if (!analysis.passPattern.detected) {
        throw new Error("No se puede cambiar el número de pasadas: " + (analysis.passPattern.reason || "patrón no detectado") + ".");
      }
      const targetFinal = edits.finalDepth !== null && edits.finalDepth !== undefined ? edits.finalDepth : analysis.finalDepth;
      lines = regeneratePasses(analysis, edits.passCount, targetFinal);
      changes.push("Pasadas: " + analysis.passCount + " → " + Math.floor(edits.passCount) + " (profundidad final " + formatNumber(targetFinal) + " mm, repartida en partes iguales).");
    } else if (edits.finalDepth !== null && edits.finalDepth !== undefined && analysis.finalDepth !== null && !sameValue(edits.finalDepth, analysis.finalDepth)) {
      const scale = edits.finalDepth / analysis.finalDepth;
      lines = rescaleDepths(lines, analysis.depths, scale);
      changes.push("Profundidad final: " + formatNumber(analysis.finalDepth) + " mm → " + formatNumber(edits.finalDepth) + " mm (todas las pasadas reescaladas proporcionalmente).");
    }

    const substitutions = [];

    (edits.feeds || []).forEach(function (edit) {
      if (!sameValue(edit.oldValue, edit.newValue)) {
        substitutions.push({ letter: "F", oldValue: edit.oldValue, newValue: edit.newValue });
        changes.push("Feedrate F" + formatNumber(edit.oldValue) + " → F" + formatNumber(edit.newValue) + ".");
      }
    });

    (edits.rpms || []).forEach(function (edit) {
      if (!sameValue(edit.oldValue, edit.newValue)) {
        substitutions.push({ letter: "S", oldValue: edit.oldValue, newValue: edit.newValue });
        changes.push("RPM S" + formatNumber(edit.oldValue) + " → S" + formatNumber(edit.newValue) + ".");
      }
    });

    if (edits.safeZ !== null && edits.safeZ !== undefined && analysis.safeZ !== null && !sameValue(edits.safeZ, analysis.safeZ)) {
      substitutions.push({ letter: "Z", oldValue: analysis.safeZ, newValue: edits.safeZ });
      changes.push("Z segura: " + formatNumber(analysis.safeZ) + " mm → " + formatNumber(edits.safeZ) + " mm.");
    }

    lines = applySubstitutions(lines, substitutions);

    return {
      text: lines.join("\n"),
      changes: changes,
    };
  }

  window.BujiaGcodeVerify = {
    analyze: analyze,
    rewrite: rewrite,
    formatNumber: formatNumber,
  };
}());
