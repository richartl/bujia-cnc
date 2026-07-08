export function createToolpath({ id, name, strategyId, units = "mm", events = [], metrics = {}, warnings = [] }) {
  return { id, name, strategyId, units, events, metrics, warnings };
}

export function comment(text) {
  return { type: "comment", text };
}

export function blank() {
  return { type: "blank" };
}

export function absoluteMode() {
  return { type: "absoluteMode" };
}

export function relativeMode() {
  return { type: "relativeMode" };
}

export function rapidMove(coordinates) {
  return { type: "rapid", ...coordinates };
}

export function linearMove(coordinates) {
  return { type: "linear", ...coordinates };
}

export function feedRate(value) {
  return { type: "feedRate", value };
}
