(function () {
  const core = window.BujiaGcodeCore;
  const geom = window.BujiaTemplateGeometry;

  // Desplazamiento hacia afuera del centro de la fresa: radio + holgura.
  // Corte "por fuera de la línea": el filo queda sobre la línea nominal y la
  // holgura lo aleja aún más (útil para copiadora / guide bushing).
  function outsideOffset(toolDiameter, clearance) {
    return (Math.abs(toolDiameter) / 2) + Math.abs(clearance || 0);
  }

  function clockwiseFor(direction) {
    // Convención: convencional = horario, climb = antihorario.
    return direction === "conventional";
  }

  // -------------------------------------------------------- Recorridos (paths)
  // Estos constructores son la única fuente de verdad: los usan tanto el
  // generador de G-code como el preview, de modo que la vista previa muestra
  // exactamente lo que hará cada archivo (offset por fuera, holgura, rotación
  // y sentido incluidos).
  //
  // La rotación es un giro puro de cuarto de vuelta, así que conserva el
  // sentido del recorrido (climb sigue siendo climb, sin espejo).
  function contourToolpath(geometry, params) {
    const offset = outsideOffset(params.toolDiameter, params.clearance);
    const outerRect = geom.offsetRoundedRect(geometry.piece, offset);
    return geom.rotatePath(geom.roundedRectPath(outerRect, {
      clockwise: clockwiseFor(params.direction),
      cornerSegments: 10,
    }), geometry.rotation);
  }

  // Una plantilla puede tener una sola cavidad (geometry.cavity) o varias
  // (geometry.cavities, p. ej. Precision Bass de bobina partida). Ambas formas
  // conviven: si no hay "cavities" se usa "cavity" como lista de un elemento,
  // así las plantillas existentes no cambian su comportamiento.
  function cavityRectsOf(geometry) {
    if (Array.isArray(geometry.cavities) && geometry.cavities.length) return geometry.cavities;
    return geometry.cavity ? [geometry.cavity] : [];
  }

  function ringsForRect(rect, offset, stepover, params, geometry) {
    const boundary = geom.offsetRoundedRect(rect, offset);
    return geom.concentricRings(boundary, stepover, {
      clockwise: clockwiseFor(params.direction),
      cornerSegments: 8,
    }).map(function (ring) { return geom.rotatePath(ring, geometry.rotation); });
  }

  function cavityToolpaths(geometry, params) {
    const offset = outsideOffset(params.toolDiameter, params.clearance);
    const stepover = params.stepover > 0 ? params.stepover : Math.abs(params.toolDiameter) * 0.4;
    let rings = [];
    cavityRectsOf(geometry).forEach(function (rect) {
      rings = rings.concat(ringsForRect(rect, offset, stepover, params, geometry));
    });
    return rings;
  }

  // Relieves poco profundos para las orejas de montaje (p. ej. Humbucker con
  // orejas). Solo existen si la plantilla define geometry.earPockets.
  function earPocketToolpaths(geometry, params) {
    if (!Array.isArray(geometry.earPockets) || !geometry.earPockets.length) return [];
    const offset = outsideOffset(params.toolDiameter, params.clearance);
    const stepover = params.stepover > 0 ? params.stepover : Math.abs(params.toolDiameter) * 0.4;
    let rings = [];
    geometry.earPockets.forEach(function (rect) {
      rings = rings.concat(ringsForRect(rect, offset, stepover, params, geometry));
    });
    return rings;
  }

  function guideSegments(geometry, params) {
    const halfW = geometry.piece.width / 2;
    const halfH = geometry.piece.height / 2;
    const list = [];
    if (params.horizontal !== false) {
      list.push({ label: "Guia horizontal (centro)", points: geom.rotatePath([{ x: -halfW, y: 0 }, { x: halfW, y: 0 }], geometry.rotation) });
    }
    if (params.vertical !== false) {
      list.push({ label: "Guia vertical (centro)", points: geom.rotatePath([{ x: 0, y: -halfH }, { x: 0, y: halfH }], geometry.rotation) });
    }
    return list;
  }

  function guideToolpaths(geometry, params) {
    return guideSegments(geometry, params).map(function (segment) { return segment.points; });
  }

  // 01 Contorno: corta el perímetro exterior de la pieza por fuera de la línea.
  function generateContourGcode(geometry, params, adaptiveRows) {
    const path = contourToolpath(geometry, params);

    const plan = geom.depthPlan({
      mode: params.mode,
      rows: adaptiveRows,
      passes: params.passes,
      finalDepth: params.finalDepth,
      feed: params.feed,
      rpm: params.rpm,
    });

    const lines = core.startProgram({
      title: "01 Contorno",
      description: [
        "Perimetro exterior por fuera de la linea",
        "Fresa: " + core.clean(params.toolDiameter) + " mm, holgura: " + core.clean(params.clearance) + " mm",
        "Pieza: " + core.clean(geometry.piece.width) + " x " + core.clean(geometry.piece.height) + " mm",
        "Sentido: " + (params.direction === "climb" ? "Climb" : "Conventional") + ", modo: " + params.mode,
      ],
      rpm: plan.length ? plan[0].rpm : params.rpm,
      safeZ: params.safeZ,
    });

    plan.forEach(function (level, index) {
      lines.push("");
      lines.push(core.comment("PASADA " + (index + 1) + " DE " + plan.length + " - Z-" + core.clean(level.z)));
      if (params.mode === "adaptive") lines.push("M3 S" + core.clean(level.rpm));
      core.cutClosedPath(path, {
        safeZ: params.safeZ,
        depth: level.z,
        feed: level.feed,
        plungeFeed: params.plungeFeed || level.feed,
      }).forEach(function (line) { lines.push(line); });
    });

    lines.push("");
    core.endProgram(params.safeZ).forEach(function (line) { lines.push(line); });
    return lines.join("\n");
  }

  // 02 Cavidad: vacía la cavidad centrada con anillos concéntricos, por fuera
  // de la línea (más la holgura para copiadora).
  function generatePocketGcode(geometry, params, adaptiveRows) {
    const stepover = params.stepover > 0 ? params.stepover : Math.abs(params.toolDiameter) * 0.4;
    const rings = cavityToolpaths(geometry, params);
    const cavityCount = cavityRectsOf(geometry).length;
    const earRings = earPocketToolpaths(geometry, params);

    const plan = geom.depthPlan({
      mode: params.mode,
      rows: adaptiveRows,
      passes: params.passes,
      finalDepth: params.finalDepth,
      feed: params.feed,
      rpm: params.rpm,
    });

    // El texto exacto se conserva para el caso de una sola cavidad (plantillas
    // existentes, p. ej. Humbucker) para no cambiar el G-code ya aprobado.
    const description = [
      "Vaciado de cavidad por fuera de la linea",
      "Fresa: " + core.clean(params.toolDiameter) + " mm, holgura: " + core.clean(params.clearance) + " mm, stepover: " + core.clean(stepover) + " mm",
    ];
    if (cavityCount > 1) {
      description.push("Cavidades: " + cavityCount + " (bobina partida), modo: " + params.mode);
    } else {
      description.push("Cavidad: " + core.clean(geometry.cavity.width) + " x " + core.clean(geometry.cavity.height) + " mm");
      description.push("Centro: X" + core.clean(geometry.cavity.cx) + " Y" + core.clean(geometry.cavity.cy) + ", modo: " + params.mode);
    }
    if (earRings.length) description.push("Incluye orejas de montaje, profundidad Z-" + core.clean(params.earDepth) + " mm");

    const lines = core.startProgram({
      title: "02 Cavidad",
      description: description,
      rpm: plan.length ? plan[0].rpm : params.rpm,
      safeZ: params.safeZ,
    });

    plan.forEach(function (level, index) {
      lines.push("");
      lines.push(core.comment("PASADA " + (index + 1) + " DE " + plan.length + " - Z-" + core.clean(level.z)));
      if (params.mode === "adaptive") lines.push("M3 S" + core.clean(level.rpm));
      rings.forEach(function (ring, ringIndex) {
        lines.push(core.comment("Anillo " + (ringIndex + 1) + " de " + rings.length));
        core.cutClosedPath(ring, {
          safeZ: params.safeZ,
          depth: level.z,
          feed: level.feed,
          plungeFeed: params.plungeFeed || level.feed,
        }).forEach(function (line) { lines.push(line); });
      });
    });

    // Orejas de montaje: relieve superficial en una sola pasada, poco
    // profundo, independiente del plan de profundidad de la cavidad principal.
    if (earRings.length && params.earDepth > 0) {
      const earDepth = Math.min(Math.abs(params.earDepth), Math.abs(params.finalDepth || params.earDepth));
      lines.push("");
      lines.push(core.comment("OREJAS DE MONTAJE - Z-" + core.clean(earDepth)));
      if (params.mode === "adaptive") lines.push("M3 S" + core.clean(params.rpm));
      earRings.forEach(function (ring, ringIndex) {
        lines.push(core.comment("Oreja, anillo " + (ringIndex + 1) + " de " + earRings.length));
        core.cutClosedPath(ring, {
          safeZ: params.safeZ,
          depth: earDepth,
          feed: params.feed,
          plungeFeed: params.plungeFeed || params.feed,
        }).forEach(function (line) { lines.push(line); });
      });
    }

    lines.push("");
    core.endProgram(params.safeZ).forEach(function (line) { lines.push(line); });
    return lines.join("\n");
  }

  // 03 Guias: archivo independiente con líneas de centro. Las guías rotan con
  // toda la plantilla, igual que el contorno y la cavidad.
  function generateGuidesGcode(geometry, params) {
    const depth = Math.abs(params.depth);
    const segments = guideSegments(geometry, params);

    const lines = core.startProgram({
      title: "03 Guias",
      description: [
        "Guias de centro horizontal y vertical",
        "Fresa: " + core.clean(params.toolDiameter) + " mm",
        "Profundidad: Z-" + core.clean(depth) + " mm",
        "Rotacion de plantilla: " + core.clean(geometry.rotation || 0) + " grados",
      ],
      rpm: params.rpm,
      safeZ: params.safeZ,
    });

    segments.forEach(function (segment) {
      lines.push("");
      lines.push(core.comment(segment.label));
      lines.push(core.rapidZ(params.safeZ));
      lines.push(core.rapidXY(segment.points[0].x, segment.points[0].y));
      lines.push(core.plunge(-depth, params.feed));
      lines.push(core.feedXY(segment.points[1].x, segment.points[1].y, params.feed));
      lines.push(core.rapidZ(params.safeZ));
    });

    lines.push("");
    core.endProgram(params.safeZ).forEach(function (line) { lines.push(line); });
    return lines.join("\n");
  }

  window.BujiaTemplateGcode = {
    outsideOffset: outsideOffset,
    contourToolpath: contourToolpath,
    cavityToolpaths: cavityToolpaths,
    earPocketToolpaths: earPocketToolpaths,
    guideToolpaths: guideToolpaths,
    generateContourGcode: generateContourGcode,
    generatePocketGcode: generatePocketGcode,
    generateGuidesGcode: generateGuidesGcode,
  };
}());
