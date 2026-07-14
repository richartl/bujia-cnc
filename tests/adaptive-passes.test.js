const fs = require('fs');
const vm = require('vm');

function loadBrowserScript(filePath, globalName) {
  const context = { window: {}, Number, Math, Object, Array, String, Boolean };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(filePath, 'utf8'), context);
  return context.window[globalName];
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sumDepth(rows) {
  return rows.reduce((sum, row) => sum + row.depth, 0);
}

const adaptive = loadBrowserScript('js/ui/adaptive-passes.js', 'BujiaAdaptivePasses');
const surfacing = loadBrowserScript('js/gcode/surfacing.js', 'BujiaSurfacingGcode');
const edge = loadBrowserScript('js/gcode/edge.js', 'BujiaEdgeGcode');

const uniform = adaptive.distributeDepth(40, 10, 600, 1000);
assert(uniform.length === 10, 'Uniform distribution should create 10 rows.');
assert(uniform.every((row) => Math.abs(row.depth - 4) <= 0.0001), 'Uniform distribution should assign 4mm per row.');

let edited = adaptive.distributeDepth(40, 10, 600, 1000);
edited[0].depth = 1;
edited[0].locked = true;
edited = adaptive.redistributeRows(edited, 40);
assert(Math.abs(edited[1].depth - (39 / 9)) <= 0.0001, 'Redistribution should preserve edited locked depth.');

edited[2].depth = 6;
edited[2].locked = true;
edited = adaptive.redistributeRows(edited, 40);
assert(Math.abs(sumDepth(edited) - 40) <= 0.0001, 'Redistribution should keep total depth equal to target.');

const uneven = adaptive.distributeDepth(10, 3, 600, 1000);
assert(Math.abs(sumDepth(uneven) - 10) <= 0.0001, 'Uneven depth should be corrected to target.');

let overLocked = adaptive.distributeDepth(10, 3, 600, 1000);
overLocked[0].depth = 12;
overLocked[0].locked = true;
overLocked = adaptive.redistributeRows(overLocked, 10);
assert(!adaptive.getValidation(overLocked, 10).isValid, 'Over-locked rows should be invalid.');

const rows = adaptive.distributeDepth(3, 3, 500, 900);
const surfacingGcode = surfacing.generateSurfacingAdaptiveGcode({
  distX: 20,
  distY: 10,
  zPasses: 3,
  totalZ: 3,
  feedRate: 600,
  plungeRate: 100,
  stepX: 5,
  toolDia: 13,
  spindle: 1000,
  safeZ: 5,
  startDirection: 'positive',
}, rows);
assert(surfacingGcode.includes('M3 S900'), 'Surfacing adaptive should use row RPM.');
assert(surfacingGcode.includes('F500'), 'Surfacing adaptive should use row feedrate.');

const edgeGcode = edge.generateEdgeAdaptiveGcode({
  length: 100,
  finalDepth: 3,
  depthPerPass: 1,
  feed: 600,
  plunge: 100,
  rpm: 1000,
  safeZ: 5,
  returnFeed: 1200,
  tool: 'Fresa recta',
  axis: 'x',
  cutDirection: 'conventional',
}, rows);
assert(edgeGcode.includes('M3 S900'), 'Edge adaptive should use row RPM.');
assert(edgeGcode.includes('G1 X100 F500'), 'Edge adaptive should use row feedrate.');

console.log(JSON.stringify({ adaptivePassesTestsPassed: true }));
