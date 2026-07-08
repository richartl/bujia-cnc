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
import { zigZagStrategy } from "./zigzag.js";

export const oneWayStrategy = {
  ...zigZagStrategy,
  id: "oneway",
  name: "OneWay",

  generate(parameters) {
    const events = [];
    const zIncrement = parameters.totalZ / parameters.zPasses;
    const dirY = parameters.startDirection === "negative" ? -parameters.distY : parameters.distY;

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

      while (coveredX < parameters.distX) {
        const remainingX = parameters.distX - coveredX;
        const moveX = Math.min(parameters.stepX, remainingX);

        events.push(comment("Z" + zp + " / PASADA XY " + pass));
        events.push(linearMove({ y: dirY }));
        if (moveX > 0) events.push(linearMove({ x: moveX }));
        events.push(rapidMove({ y: -dirY }));
        events.push(blank());

        coveredX += moveX;
        pass++;
      }

      events.push(absoluteMode());
      events.push(rapidMove({ z: parameters.safeZ }));
      events.push(blank());
    }

    return createToolpath({
      id: "surfacing-oneway",
      name: "Surfacing OneWay",
      strategyId: this.id,
      events,
      metrics: this.estimateDistance({ events }),
    });
  },
};
