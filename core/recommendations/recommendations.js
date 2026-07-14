import {
  calculateConfidence,
  calculateRecommendedDepthPerPass,
  calculateRecommendedFeed,
  calculateRecommendedPlunge,
  calculateRecommendedRPM,
  calculateRecommendedStepover,
  createWarning,
} from "./rules.js";

export function createEmptyRecommendation() {
  return {
    recommendedRPM: null,
    recommendedFeed: null,
    recommendedPlunge: null,
    recommendedDepthPerPass: null,
    recommendedStepover: null,
    recommendedStepoverPercent: null,
    recommendedPasses: null,
    warnings: [],
    confidence: "low",
    explanation: [],
  };
}

export function getRecommendations({ tool = null, material = null, machine = null, operation = null } = {}) {
  const recommendation = createEmptyRecommendation();

  if (!tool) {
    recommendation.warnings.push(createWarning(
      "MISSING_TOOL",
      "No se recibió herramienta; las recomendaciones serán parciales."
    ));
  }

  if (!material) {
    recommendation.warnings.push(createWarning(
      "MISSING_MATERIAL",
      "No se recibió material; las recomendaciones serán parciales."
    ));
  }

  if (!machine) {
    recommendation.warnings.push(createWarning(
      "MISSING_MACHINE",
      "No se recibió máquina; no se podrán aplicar límites de máquina."
    ));
  }

  if (!operation) {
    recommendation.warnings.push(createWarning(
      "MISSING_OPERATION",
      "No se recibió operación; no se podrán considerar parámetros específicos de operación."
    ));
  }

  recommendation.recommendedRPM = calculateRecommendedRPM(
    tool,
    material,
    machine,
    recommendation.warnings,
    recommendation.explanation
  );

  recommendation.recommendedFeed = calculateRecommendedFeed(
    tool,
    material,
    machine,
    recommendation.warnings,
    recommendation.explanation
  );

  recommendation.recommendedPlunge = calculateRecommendedPlunge(
    tool,
    material,
    machine,
    recommendation.recommendedFeed,
    recommendation.warnings,
    recommendation.explanation
  );

  const stepoverRecommendation = calculateRecommendedStepover(
    tool,
    operation,
    recommendation.warnings,
    recommendation.explanation
  );
  recommendation.recommendedStepover = stepoverRecommendation.recommendedStepover;
  recommendation.recommendedStepoverPercent = stepoverRecommendation.recommendedStepoverPercent;

  const depthRecommendation = calculateRecommendedDepthPerPass(
    tool,
    operation,
    recommendation.warnings,
    recommendation.explanation
  );
  recommendation.recommendedDepthPerPass = depthRecommendation.recommendedDepthPerPass;
  recommendation.recommendedPasses = depthRecommendation.recommendedPasses;

  recommendation.confidence = calculateConfidence(recommendation);

  if (recommendation.explanation.length === 0) {
    recommendation.explanation.push("No se generaron recomendaciones porque faltan datos de entrada suficientes.");
  }

  return recommendation;
}
