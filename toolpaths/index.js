import { oneWayStrategy } from "./strategies/oneWay.js";
import { rasterXStrategy } from "./strategies/rasterX.js";
import { rasterYStrategy } from "./strategies/rasterY.js";
import { zigZagStrategy } from "./strategies/zigzag.js";

export const DEFAULT_STRATEGY_ID = "zigzag";

const STRATEGIES = [
  zigZagStrategy,
  oneWayStrategy,
  rasterXStrategy,
  rasterYStrategy,
];

export function getStrategies() {
  return [...STRATEGIES];
}

export function getStrategy(id = DEFAULT_STRATEGY_ID) {
  return STRATEGIES.find((strategy) => strategy.id === id) || zigZagStrategy;
}

export function generateToolpath(strategyId, parameters) {
  return getStrategy(strategyId).generate(parameters);
}
