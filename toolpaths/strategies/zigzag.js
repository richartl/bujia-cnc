import {
  absoluteMode,
  blank,
  comment,
  createToolpath,
  feedRate,
  linearMove,
  rapidMove,
  relativeMode,
} from "../toolpath.js";

export const zigZagStrategy = {
  id: "zigzag",
  name: "ZigZag",

  validate(parameters) {
    const errors = [];
    if (parameters.distX <= 0 || parameters.distY <= 0) errors.push("X y Y deben ser mayores a 0.");
    if (parameters.stepX <= 0) errors.push("El paso en X debe ser mayor a 0.");
    if (parameters.totalZ <= 0) errors.push("La profundidad Z debe ser mayor a 0.");
    if (parameters.feedRate <= 0 || parameters.plungeRate <= 0) errors.push("Los feedrates deben ser mayores a 0.");
    return { isValid: errors.length === 0, errors, warnings: [] };
  },

  generate(parameters) {
    const events = [];
    const zIncrement = parameters.totalZ / parameters.zPasses;

    for (let zp = 1; zp <= parameters.zPasses; zp++) {
      const depth = zIncrement * zp;

      events.push(comment("=============================="));
      events.push(comment("PASADA Z " + zp + " DE " + parameters.zPasses + " - Z-" + parameters.clean(depth)));
      events.push(comment("=============================="));
      events.push(absoluteMode());
      events.push(rapidMove({ x: 0, y: 0 }));
      events.push(linearMove({ z: -depth, feed: parameters.plungeRate }));
      events.push(relativeMode());
      events.push(feedRate(parameters.feedRate));
      events.push(blank());

      let coveredX = 0;
      let pass = 1;
      let dirY = parameters.startDirection === "positive" ? parameters.distY : -parameters.distY;

      while (coveredX < parameters.distX) {
        const remainingX = parameters.distX - coveredX;
        const moveX = Math.min(parameters.stepX, remainingX);

        events.push(comment("Z" + zp + " / PASADA XY " + pass));
        events.push(linearMove({ y: dirY }));
        if (moveX > 0) events.push(linearMove({ x: moveX }));
        events.push(blank());

        coveredX += moveX;
        dirY = -dirY;
        pass++;
      }

      events.push(absoluteMode());
      events.push(rapidMove({ z: parameters.safeZ }));
      events.push(blank());
    }

    return createToolpath({
      id: "surfacing-zigzag",
      name: "Surfacing ZigZag",
      strategyId: this.id,
      events,
      metrics: this.estimateDistance({ events }),
    });
  },

  estimateDistance(toolpath) {
    return toolpath.events.reduce((metrics, event) => {
      if (event.type !== "linear" && event.type !== "rapid") return metrics;
      const distance = Math.abs(event.x || 0) + Math.abs(event.y || 0) + Math.abs(event.z || 0);
      if (event.type === "rapid") metrics.rapidDistance += distance;
      if (event.type === "linear") metrics.cutDistance += distance;
      metrics.totalDistance += distance;
      return metrics;
    }, { totalDistance: 0, cutDistance: 0, rapidDistance: 0 });
  },

  estimateTime(toolpath, context = {}) {
    const feedRateValue = context.feedRate || 1;
    const distance = this.estimateDistance(toolpath);
    return distance.cutDistance / feedRateValue;
  },
};
