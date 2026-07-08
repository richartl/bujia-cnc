(function () {
  function clean(n) {
    return Number(Number(n).toFixed(4)).toString();
  }

  function validateEdgeParameters(parameters) {
    const messages = [];

    if (parameters.length <= 0) messages.push("ERROR: La longitud debe ser mayor a 0.");
    if (parameters.finalDepth <= 0) messages.push("ERROR: La profundidad final debe ser mayor a 0.");
    if (parameters.depthPerPass <= 0) messages.push("ERROR: La profundidad por pasada debe ser mayor a 0.");
    if (parameters.feed <= 0) messages.push("ERROR: El feed debe ser mayor a 0.");
    if (parameters.plunge <= 0) messages.push("ERROR: El plunge debe ser mayor a 0.");
    if (parameters.rpm <= 0) messages.push("ERROR: Las RPM deben ser mayores a 0.");
    if (parameters.safeZ <= 0) messages.push("ERROR: Z segura debe ser mayor a 0.");
    if (parameters.returnFeed <= 0) messages.push("ERROR: La velocidad de regreso debe ser mayor a 0.");
    if (parameters.depthPerPass > parameters.finalDepth) messages.push("ADVERTENCIA: La profundidad por pasada es mayor que la profundidad final; se usará una sola pasada.");

    return messages;
  }

  function getCutDistance(parameters) {
    const sign = parameters.cutDirection === "climb" ? -1 : 1;
    return parameters.length * sign;
  }

  function getCutMove(parameters) {
    const distance = clean(getCutDistance(parameters));
    return parameters.axis === "y" ? "Y" + distance : "X" + distance;
  }

  function generateDepths(finalDepth, depthPerPass) {
    const depths = [];
    let currentDepth = 0;

    while (currentDepth < finalDepth) {
      currentDepth = Math.min(currentDepth + depthPerPass, finalDepth);
      depths.push(currentDepth);
    }

    return depths;
  }

  function generateEdgeGcode(parameters) {
    const normalized = Object.assign({}, parameters, {
      axis: parameters.axis === "y" ? "y" : "x",
      cutDirection: parameters.cutDirection === "climb" ? "climb" : "conventional",
      returnMode: "rapid-to-start",
    });
    const messages = validateEdgeParameters(normalized);

    if (messages.some(function (message) { return message.startsWith("ERROR"); })) {
      return messages.join("\n");
    }

    const axisLabel = normalized.axis.toUpperCase();
    const directionLabel = normalized.cutDirection === "climb" ? "A favor" : "En contra";
    const depths = generateDepths(normalized.finalDepth, normalized.depthPerPass);
    const lines = [];

    lines.push("%");
    lines.push("( Cantos generado en navegador )");
    lines.push("( Eje: " + axisLabel + ", longitud: " + clean(normalized.length) + " mm )");
    lines.push("( Profundidad final: Z-" + clean(normalized.finalDepth) + " mm, profundidad por pasada: " + clean(normalized.depthPerPass) + " mm )");
    lines.push("( Sentido de corte: " + directionLabel + " )");
    lines.push("( Herramienta: " + normalized.tool + " )");
    lines.push("");

    messages.forEach(function (message) { lines.push("( " + message + " )"); });
    if (messages.length) lines.push("");

    lines.push("G21");
    lines.push("G90");
    lines.push("G94");
    lines.push("");
    lines.push("M3 S" + clean(normalized.rpm));
    lines.push("G4 P3");
    lines.push("");
    lines.push("G0 Z" + clean(normalized.safeZ));
    lines.push("G0 X0 Y0");
    lines.push("");

    depths.forEach(function (depth, index) {
      lines.push("( ============================== )");
      lines.push("( PASADA " + (index + 1) + " DE " + depths.length + " - Z-" + clean(depth) + " )");
      lines.push("( ============================== )");
      lines.push("G1 Z-" + clean(depth) + " F" + clean(normalized.plunge));
      lines.push("G1 " + getCutMove(normalized) + " F" + clean(normalized.feed));
      lines.push("G0 Z" + clean(normalized.safeZ));
      lines.push("G0 X0 Y0 F" + clean(normalized.returnFeed));
      lines.push("");
    });

    lines.push("G90");
    lines.push("G0 Z" + clean(normalized.safeZ));
    lines.push("G0 X0 Y0");
    lines.push("M5");
    lines.push("M30");
    lines.push("%");

    return lines.join("\n");
  }

  window.BujiaEdgeGcode = {
    clean: clean,
    validateEdgeParameters: validateEdgeParameters,
    generateEdgeGcode: generateEdgeGcode,
  };
}());
