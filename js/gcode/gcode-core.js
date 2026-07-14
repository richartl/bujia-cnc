(function () {
  // Núcleo de generación de G-code reutilizable por cualquier herramienta o
  // plantilla. No depende de Surfacing ni de Cantos. Centraliza el formato,
  // la cabecera segura y el cierre para no duplicar código.

  function clean(n) {
    return Number(Number(n).toFixed(4)).toString();
  }

  // Inicia un programa seguro y comentado.
  // meta: { title, description[], rpm, safeZ }
  function startProgram(meta) {
    const lines = [];
    lines.push("%");
    lines.push("( " + (meta.title || "Programa") + " )");
    (meta.description || []).forEach(function (text) {
      lines.push("( " + text + " )");
    });
    lines.push("");
    lines.push("G21");
    lines.push("G90");
    lines.push("G94");
    lines.push("");
    lines.push("M3 S" + clean(meta.rpm));
    lines.push("G4 P3");
    lines.push("");
    lines.push("G0 Z" + clean(meta.safeZ));
    lines.push("");
    return lines;
  }

  // Cierra el programa: sube a Z segura, vuelve al origen, apaga spindle.
  function endProgram(safeZ) {
    return [
      "G90",
      "G0 Z" + clean(safeZ),
      "G0 X0 Y0",
      "M5",
      "M30",
      "%",
    ];
  }

  function comment(text) {
    return "( " + text + " )";
  }

  function rapidZ(z) {
    return "G0 Z" + clean(z);
  }

  function rapidXY(x, y) {
    return "G0 X" + clean(x) + " Y" + clean(y);
  }

  function plunge(z, feed) {
    return "G1 Z" + clean(z) + " F" + clean(feed);
  }

  function feedXY(x, y, feed) {
    var line = "G1 X" + clean(x) + " Y" + clean(y);
    if (feed !== undefined && feed !== null) line += " F" + clean(feed);
    return line;
  }

  // Recorre un contorno cerrado (arreglo de puntos {x,y}) a una profundidad
  // dada. Sube a Z segura, se posiciona, baja, corta el contorno cerrándolo,
  // y vuelve a subir. Devuelve un arreglo de líneas.
  function cutClosedPath(points, params) {
    if (!points.length) return [];
    const lines = [];
    lines.push(rapidZ(params.safeZ));
    lines.push(rapidXY(points[0].x, points[0].y));
    lines.push(plunge(-Math.abs(params.depth), params.plungeFeed));
    lines.push("G1 F" + clean(params.feed));
    for (let i = 1; i < points.length; i++) {
      lines.push(feedXY(points[i].x, points[i].y));
    }
    // Cerrar el contorno regresando al primer punto.
    lines.push(feedXY(points[0].x, points[0].y));
    lines.push(rapidZ(params.safeZ));
    return lines;
  }

  window.BujiaGcodeCore = {
    clean: clean,
    startProgram: startProgram,
    endProgram: endProgram,
    comment: comment,
    rapidZ: rapidZ,
    rapidXY: rapidXY,
    plunge: plunge,
    feedXY: feedXY,
    cutClosedPath: cutClosedPath,
  };
}());
