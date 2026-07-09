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

  // 01 Contorno: corta el perímetro exterior de la pieza por fuera de la línea.
  function generateContourGcode(geometry, params, adaptiveRows) {
    const offset = outsideOffset(params.toolDiameter, params.clearance);
    const outerRect = geom.offsetRoundedRect(geometry.piece, offset);
    const path = geom.rotatePath(geom.roundedRectPath(outerRect, {
      clockwise: clockwiseFor(params.direction),
      cornerSegments: 10,
    }), geometry.rotation);

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
    const offset = outsideOffset(params.toolDiameter, params.clearance);
    const boundary = geom.offsetRoundedRect(geometry.cavity, offset);
    const stepover = params.stepover > 0 ? params.stepover : Math.abs(params.toolDiameter) * 0.4;
    const rings = geom.concentricRings(boundary, stepover, {
      clockwise: clockwiseFor(params.direction),
      cornerSegments: 8,
    }).map(function (ring) { return geom.rotatePath(ring, geometry.rotation); });

    const plan = geom.depthPlan({
      mode: params.mode,
      rows: adaptiveRows,
      passes: params.passes,
      finalDepth: params.finalDepth,
      feed: params.feed,
      rpm: params.rpm,
    });

    const lines = core.startProgram({
      title: "02 Cavidad",
      description: [
        "Vaciado de cavidad por fuera de la linea",
        "Fresa: " + core.clean(params.toolDiameter) + " mm, holgura: " + core.clean(params.clearance) + " mm, stepover: " + core.clean(stepover) + " mm",
        "Cavidad: " + core.clean(geometry.cavity.width) + " x " + core.clean(geometry.cavity.height) + " mm",
        "Centro: X" + core.clean(geometry.cavity.cx) + " Y" + core.clean(geometry.cavity.cy) + ", modo: " + params.mode,
      ],
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

    lines.push("");
    core.endProgram(params.safeZ).forEach(function (line) { lines.push(line); });
    return lines.join("\n");
  }

  // 03 Guias: archivo independiente con líneas de centro. Las guías rotan con
  // toda la plantilla, igual que el contorno y la cavidad.
  function generateGuidesGcode(geometry, params) {
    const halfW = geometry.piece.width / 2;
    const halfH = geometry.piece.height / 2;
    const depth = Math.abs(params.depth);
    const rotation = geometry.rotation;

    // Segmentos en coordenadas locales, luego rotados.
    const hSeg = geom.rotatePath([{ x: -halfW, y: 0 }, { x: halfW, y: 0 }], rotation);
    const vSeg = geom.rotatePath([{ x: 0, y: -halfH }, { x: 0, y: halfH }], rotation);

    const lines = core.startProgram({
      title: "03 Guias",
      description: [
        "Guias de centro horizontal y vertical",
        "Fresa: " + core.clean(params.toolDiameter) + " mm",
        "Profundidad: Z-" + core.clean(depth) + " mm",
        "Rotacion de plantilla: " + core.clean(rotation || 0) + " grados",
      ],
      rpm: params.rpm,
      safeZ: params.safeZ,
    });

    function cutSegment(label, segment) {
      lines.push("");
      lines.push(core.comment(label));
      lines.push(core.rapidZ(params.safeZ));
      lines.push(core.rapidXY(segment[0].x, segment[0].y));
      lines.push(core.plunge(-depth, params.feed));
      lines.push(core.feedXY(segment[1].x, segment[1].y, params.feed));
      lines.push(core.rapidZ(params.safeZ));
    }

    if (params.horizontal !== false) cutSegment("Guia horizontal (centro)", hSeg);
    if (params.vertical !== false) cutSegment("Guia vertical (centro)", vSeg);

    lines.push("");
    core.endProgram(params.safeZ).forEach(function (line) { lines.push(line); });
    return lines.join("\n");
  }

  window.BujiaTemplateGcode = {
    outsideOffset: outsideOffset,
    generateContourGcode: generateContourGcode,
    generatePocketGcode: generatePocketGcode,
    generateGuidesGcode: generateGuidesGcode,
  };
}());
