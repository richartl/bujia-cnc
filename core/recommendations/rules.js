const DEFAULT_STEPOVER_PERCENT = 40;
const MIN_STEPOVER_PERCENT = 30;
const MAX_STEPOVER_PERCENT = 50;
const DEFAULT_DEPTH_PER_PASS_PERCENT = 25;
const DEFAULT_CONFIDENCE = "low";

export function toPositiveNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
}

export function round(value, decimals = 4) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return null;
  const factor = 10 ** decimals;
  return Math.round(numberValue * factor) / factor;
}

export function readFirstPositiveNumber(source, fieldNames) {
  if (!source || typeof source !== "object") return null;

  for (const fieldName of fieldNames) {
    const value = toPositiveNumber(source[fieldName]);
    if (value !== null) return value;
  }

  return null;
}

export function createWarning(code, message, severity = "warning") {
  return { code, message, severity };
}

export function chooseConservativeValue(values) {
  const validValues = values
    .map((value) => toPositiveNumber(value))
    .filter((value) => value !== null);

  if (validValues.length === 0) return null;
  return Math.min(...validValues);
}

export function calculateRecommendedRPM(tool, material, machine, warnings, explanation) {
  const toolRPM = readFirstPositiveNumber(tool, ["recommendedRPM", "recommendedRpm", "rpm", "spindleRpm"]);
  const materialRPM = readFirstPositiveNumber(material, ["recommendedRPM", "recommendedRpm", "rpm", "spindleRpm"]);
  const machineMaxRPM = readFirstPositiveNumber(machine?.spindle, ["maxRpm", "maxRPM"])
    ?? readFirstPositiveNumber(machine, ["spindleMaxRpm", "spindleMaxRPM", "maxRpm", "maxRPM"]);

  let recommendedRPM = chooseConservativeValue([toolRPM, materialRPM]);

  if (recommendedRPM === null) {
    warnings.push(createWarning(
      "MISSING_RPM_DATA",
      "No hay suficientes datos de herramienta, material o máquina para recomendar RPM."
    ));
    explanation.push("RPM no recomendadas porque faltan datos confiables.");
    return null;
  }

  if (machineMaxRPM !== null && recommendedRPM > machineMaxRPM) {
    recommendedRPM = machineMaxRPM;
    warnings.push(createWarning(
      "RPM_LIMITED_BY_MACHINE",
      "Las RPM recomendadas fueron limitadas por el máximo de la máquina."
    ));
  }

  explanation.push("RPM recomendadas usando el valor conservador disponible entre herramienta, material y máquina.");
  return Math.round(recommendedRPM);
}

export function calculateRecommendedFeed(tool, material, machine, warnings, explanation) {
  const toolFeed = readFirstPositiveNumber(tool, ["recommendedFeed", "feed", "feedRate"]);
  const materialFeed = readFirstPositiveNumber(material, ["recommendedFeed", "feed", "feedRate"]);
  const machineMaxFeed = readFirstPositiveNumber(machine, ["maxFeedRate", "maximumFeedRate"]);

  let recommendedFeed = chooseConservativeValue([toolFeed, materialFeed]);

  if (recommendedFeed === null) {
    warnings.push(createWarning(
      "MISSING_FEED_DATA",
      "No hay suficientes datos de herramienta, material o máquina para recomendar feedrate."
    ));
    explanation.push("Feedrate no recomendado porque faltan datos confiables.");
    return null;
  }

  if (machineMaxFeed !== null && recommendedFeed > machineMaxFeed) {
    recommendedFeed = machineMaxFeed;
    warnings.push(createWarning(
      "FEED_LIMITED_BY_MACHINE",
      "El feedrate recomendado fue limitado por el máximo de la máquina."
    ));
  }

  explanation.push("Feedrate recomendado usando el valor conservador disponible entre herramienta, material y máquina.");
  return Math.round(recommendedFeed);
}

export function calculateRecommendedPlunge(tool, material, machine, recommendedFeed, warnings, explanation) {
  const toolPlunge = readFirstPositiveNumber(tool, ["recommendedPlunge", "plunge", "plungeRate"]);
  const materialPlunge = readFirstPositiveNumber(material, ["recommendedPlunge", "plunge", "plungeRate"]);
  const machineMaxPlunge = readFirstPositiveNumber(machine, ["maxPlungeRate", "maximumPlungeRate"]);
  const feedBasedFallback = recommendedFeed === null ? null : recommendedFeed * 0.35;

  let recommendedPlunge = chooseConservativeValue([toolPlunge, materialPlunge, feedBasedFallback]);

  if (recommendedPlunge === null) {
    warnings.push(createWarning(
      "MISSING_PLUNGE_DATA",
      "No hay suficientes datos para recomendar plunge."
    ));
    explanation.push("Plunge no recomendado porque faltan datos confiables.");
    return null;
  }

  if (machineMaxPlunge !== null && recommendedPlunge > machineMaxPlunge) {
    recommendedPlunge = machineMaxPlunge;
    warnings.push(createWarning(
      "PLUNGE_LIMITED_BY_MACHINE",
      "El plunge recomendado fue limitado por el máximo de la máquina."
    ));
  }

  explanation.push("Plunge recomendado de forma conservadora usando herramienta, material, máquina y feedrate cuando aplica.");
  return Math.round(recommendedPlunge);
}

export function calculateRecommendedStepover(tool, operation, warnings, explanation) {
  const toolDiameter = readFirstPositiveNumber(tool, ["diameter", "toolDiameter", "toolDia"]);
  const requestedStepover = readFirstPositiveNumber(operation?.parameters ?? operation, ["stepover", "stepX"]);

  if (toolDiameter === null) {
    warnings.push(createWarning(
      "MISSING_TOOL_DIAMETER",
      "No hay diámetro de herramienta para recomendar stepover."
    ));
    explanation.push("Stepover no recomendado porque falta el diámetro de la herramienta.");
    return { recommendedStepover: null, recommendedStepoverPercent: null };
  }

  const toolRecommendedStepover = readFirstPositiveNumber(tool, ["recommendedStepover", "stepover"]);
  const defaultStepover = toolDiameter * (DEFAULT_STEPOVER_PERCENT / 100);
  let recommendedStepover = toolRecommendedStepover ?? defaultStepover;
  let recommendedStepoverPercent = (recommendedStepover / toolDiameter) * 100;

  if (recommendedStepoverPercent < MIN_STEPOVER_PERCENT || recommendedStepoverPercent > MAX_STEPOVER_PERCENT) {
    recommendedStepoverPercent = DEFAULT_STEPOVER_PERCENT;
    recommendedStepover = defaultStepover;
    warnings.push(createWarning(
      "STEPOVER_OUTSIDE_RECOMMENDED_RANGE",
      "El stepover disponible está fuera del rango recomendado; se sugiere 40% del diámetro."
    ));
  }

  if (requestedStepover !== null && requestedStepover > toolDiameter) {
    warnings.push(createWarning(
      "REQUESTED_STEPOVER_GREATER_THAN_TOOL_DIAMETER",
      "El stepover configurado es mayor que el diámetro de la herramienta."
    ));
  }

  explanation.push("Stepover recomendado usando el diámetro de herramienta con rango conservador de 30% a 50%.");

  return {
    recommendedStepover: round(recommendedStepover),
    recommendedStepoverPercent: round(recommendedStepoverPercent, 2),
  };
}

export function calculateRecommendedDepthPerPass(tool, operation, warnings, explanation) {
  const toolDiameter = readFirstPositiveNumber(tool, ["diameter", "toolDiameter", "toolDia"]);
  const toolUsableLength = readFirstPositiveNumber(tool, ["usableLength", "cuttingLength"]);
  const operationParameters = operation?.parameters ?? operation;
  const totalDepth = readFirstPositiveNumber(operationParameters, ["totalDepthZ", "totalZ", "depth", "depthZ"]);
  const requestedPasses = readFirstPositiveNumber(operationParameters, ["zPasses", "passes"]);
  const explicitDepthPerPass = readFirstPositiveNumber(operationParameters, ["depthPerPass", "stepdown"]);

  let recommendedDepthPerPass = explicitDepthPerPass;

  if (recommendedDepthPerPass === null && toolDiameter !== null) {
    recommendedDepthPerPass = toolDiameter * (DEFAULT_DEPTH_PER_PASS_PERCENT / 100);
  }

  if (recommendedDepthPerPass === null && totalDepth !== null && requestedPasses !== null) {
    recommendedDepthPerPass = totalDepth / Math.max(1, Math.ceil(requestedPasses));
  }

  if (recommendedDepthPerPass === null) {
    warnings.push(createWarning(
      "MISSING_DEPTH_DATA",
      "No hay suficientes datos para recomendar profundidad por pasada."
    ));
    explanation.push("Profundidad por pasada no recomendada porque faltan datos de profundidad o herramienta.");
    return { recommendedDepthPerPass: null, recommendedPasses: null };
  }

  if (toolUsableLength !== null && recommendedDepthPerPass > toolUsableLength) {
    recommendedDepthPerPass = toolUsableLength;
    warnings.push(createWarning(
      "DEPTH_LIMITED_BY_TOOL_LENGTH",
      "La profundidad por pasada fue limitada por la longitud útil de la herramienta."
    ));
  }

  if (totalDepth !== null && recommendedDepthPerPass > totalDepth) {
    recommendedDepthPerPass = totalDepth;
  }

  const recommendedPasses = totalDepth === null
    ? null
    : Math.max(1, Math.ceil(totalDepth / recommendedDepthPerPass));

  explanation.push("Profundidad por pasada recomendada de forma conservadora usando diámetro de herramienta, profundidad total y longitud útil cuando están disponibles.");

  return {
    recommendedDepthPerPass: round(recommendedDepthPerPass),
    recommendedPasses,
  };
}

export function calculateConfidence(recommendation) {
  const recommendedFields = [
    recommendation.recommendedRPM,
    recommendation.recommendedFeed,
    recommendation.recommendedPlunge,
    recommendation.recommendedDepthPerPass,
    recommendation.recommendedStepover,
    recommendation.recommendedPasses,
  ];

  const availableCount = recommendedFields.filter((value) => value !== null && value !== undefined).length;
  const warningPenalty = recommendation.warnings.filter((warning) => warning.severity !== "info").length;
  const score = availableCount - warningPenalty;

  if (score >= 5) return "high";
  if (score >= 3) return "medium";
  return DEFAULT_CONFIDENCE;
}
