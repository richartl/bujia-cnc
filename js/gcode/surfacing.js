(function () {
  function clean(n) {
    return Number(Number(n).toFixed(4)).toString();
  }

  function validateSurfacingParameters(parameters) {
    const warnings = [];

    if (parameters.distX <= 0 || parameters.distY <= 0) warnings.push("ERROR: X y Y deben ser mayores a 0.");
    if (parameters.stepX <= 0) warnings.push("ERROR: El paso en X debe ser mayor a 0.");
    if (parameters.totalZ <= 0) warnings.push("ERROR: La profundidad Z debe ser mayor a 0.");
    if (parameters.feedRate <= 0 || parameters.plungeRate <= 0) warnings.push("ERROR: Los feedrates deben ser mayores a 0.");
    if (parameters.toolDia > 0 && parameters.stepX > parameters.toolDia) warnings.push("ADVERTENCIA: El paso en X es mayor al diámetro de la fresa.");

    return warnings;
  }

  function generateZigZagBody(parameters) {
    const zIncrement = parameters.totalZ / parameters.zPasses;
    const lines = [];

    for (let zp = 1; zp <= parameters.zPasses; zp++) {
      const depth = zIncrement * zp;

      lines.push("( ============================== )");
      lines.push("( PASADA Z " + zp + " DE " + parameters.zPasses + " - Z-" + clean(depth) + " )");
      lines.push("( ============================== )");
      lines.push("G90");
      lines.push("G0 X0 Y0");
      lines.push("G1 Z-" + clean(depth) + " F" + clean(parameters.plungeRate));
      lines.push("G91");
      lines.push("F" + clean(parameters.feedRate));
      lines.push("");

      let coveredX = 0;
      let pass = 1;
      let dirY = parameters.startDirection === "positive" ? parameters.distY : -parameters.distY;

      while (coveredX < parameters.distX) {
        const remainingX = parameters.distX - coveredX;
        const moveX = Math.min(parameters.stepX, remainingX);

        lines.push("( Z" + zp + " / PASADA XY " + pass + " )");
        lines.push("G1 Y" + clean(dirY));
        if (moveX > 0) lines.push("G1 X" + clean(moveX));
        lines.push("");

        coveredX += moveX;
        dirY = -dirY;
        pass++;
      }

      lines.push("G90");
      lines.push("G0 Z" + clean(parameters.safeZ));
      lines.push("");
    }

    return lines;
  }

  function generateSurfacingGcode(parameters) {
    const normalized = Object.assign({}, parameters, {
      zPasses: Math.max(1, Math.floor(parameters.zPasses)),
    });
    const warnings = validateSurfacingParameters(normalized);

    if (warnings.some(function (warning) { return warning.startsWith("ERROR"); })) {
      return warnings.join("\n");
    }

    const lines = [];

    lines.push("%");
    lines.push("( Surfacing generado en navegador )");
    lines.push("( Area X: " + clean(normalized.distX) + " mm, Y: " + clean(normalized.distY) + " mm )");
    lines.push("( Pasadas Z: " + normalized.zPasses + ", profundidad total: Z-" + clean(normalized.totalZ) + " mm )");
    lines.push("( Step X: " + clean(normalized.stepX) + " mm, Feed XY: F" + clean(normalized.feedRate) + " )");
    lines.push("");

    warnings.forEach(function (warning) { lines.push("( " + warning + " )"); });
    if (warnings.length) lines.push("");

    lines.push("G21");
    lines.push("G90");
    lines.push("G94");
    lines.push("");
    lines.push("M3 S" + clean(normalized.spindle));
    lines.push("G4 P3");
    lines.push("");
    lines.push("G0 Z" + clean(normalized.safeZ));
    lines.push("G0 X0 Y0");
    lines.push("");

    generateZigZagBody(normalized).forEach(function (line) { lines.push(line); });

    lines.push("G90");
    lines.push("G0 Z" + clean(normalized.safeZ));
    lines.push("G0 X0 Y0");
    lines.push("M5");
    lines.push("M30");
    lines.push("%");

    return lines.join("\n");
  }

  window.BujiaSurfacingGcode = {
    clean: clean,
    validateSurfacingParameters: validateSurfacingParameters,
    generateSurfacingGcode: generateSurfacingGcode,
  };
}());
