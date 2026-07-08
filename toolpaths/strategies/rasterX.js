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

export const rasterXStrategy = {
  ...zigZagStrategy,
  id: "rasterx",
  name: "RasterX",

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

      let coveredY = 0;
      let pass = 1;
      let dirX = parameters.startDirection === "negative" ? -parameters.distX : parameters.distX;

      while (coveredY < parameters.distY) {
        const remainingY = parameters.distY - coveredY;
        const moveY = Math.min(parameters.stepX, remainingY);

        events.push(comment("Z" + zp + " / PASADA XY " + pass));
        events.push(linearMove({ x: dirX }));
        if (moveY > 0) events.push(linearMove({ y: moveY }));
        events.push(blank());

        coveredY += moveY;
        dirX = -dirX;
        pass++;
      }

      events.push(absoluteMode());
      events.push(rapidMove({ z: parameters.safeZ }));
      events.push(blank());
    }

    return createToolpath({
      id: "surfacing-rasterx",
      name: "Surfacing RasterX",
      strategyId: this.id,
      events,
      metrics: this.estimateDistance({ events }),
    });
  },
};
