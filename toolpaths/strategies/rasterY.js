import { zigZagStrategy } from "./zigzag.js";

export const rasterYStrategy = {
  ...zigZagStrategy,
  id: "rastery",
  name: "RasterY",

  generate(parameters) {
    const toolpath = zigZagStrategy.generate(parameters);
    return { ...toolpath, id: "surfacing-rastery", name: "Surfacing RasterY", strategyId: this.id };
  },
};
