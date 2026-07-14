const fs = require('fs');
const vm = require('vm');

const context = { window: {}, Number, Math, Object, Array, String, Boolean, isNaN, parseFloat };
vm.createContext(context);
function run(path) { vm.runInContext(fs.readFileSync(path, 'utf8'), context); }

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

run('js/gcode/gcode-core.js');
run('js/template/geometry.js');
run('js/gcode/template.js');
run('templates/humbucker.js');
run('js/gcode/gcode-verify.js');

const verify = context.window.BujiaGcodeVerify;
const gcode = context.window.BujiaTemplateGcode;
const humbucker = context.window.BujiaTemplates.humbucker;

function extractXY(text) {
  return text.replace(/\([^)]*\)/g, ' ').split('\n').map(function (line) {
    const words = {};
    const re = /([A-Za-z])(-?\d*\.?\d+)/g;
    let m;
    while ((m = re.exec(line))) words[m[1].toUpperCase()] = parseFloat(m[2]);
    return { x: words.X, y: words.Y };
  }).filter(function (p) { return p.x !== undefined || p.y !== undefined; });
}

// -------------------------------------------------- Caso real: cavidad Humbucker
const geometry = humbucker.buildGeometry(humbucker.defaults);
geometry.rotation = 0;
const realGcode = gcode.generatePocketGcode(geometry, {
  mode: 'manual', toolDiameter: 6, clearance: 0, stepover: 2.4, passes: 3, finalDepth: 18,
  feed: 700, rpm: 12000, plungeFeed: 150, safeZ: 6, direction: 'climb',
}, null);

const analysis = verify.analyze(realGcode);
assert(analysis.passCount === 3, 'Debe detectar 3 pasadas (obtenido: ' + analysis.passCount + ').');
assert(Math.abs(analysis.finalDepth + 18) < 0.001, 'La profundidad final detectada debe ser -18 (obtenido: ' + analysis.finalDepth + ').');
assert(Math.abs(analysis.safeZ - 6) < 0.001, 'La Z segura detectada debe ser 6 (obtenido: ' + analysis.safeZ + ').');
assert(analysis.feeds.some(function (f) { return Math.abs(f.value - 700) < 0.001; }), 'Debe detectar el feedrate 700.');
assert(analysis.rpms.some(function (r) { return Math.abs(r.value - 12000) < 0.001; }), 'Debe detectar el RPM 12000.');
assert(analysis.spindleOn, 'Debe detectar que el spindle se enciende.');
assert(analysis.endsProperly, 'Debe detectar M30 al final.');
assert(analysis.passPattern.detected, 'El G-code de nuestra propia herramienta debe tener patrón de pasada repetible detectable.');

// ---------------------------------------------- Reescritura idéntica (idempotente)
const noOpEdits = {
  feeds: analysis.feeds.map(function (f) { return { oldValue: f.value, newValue: f.value }; }),
  rpms: analysis.rpms.map(function (r) { return { oldValue: r.value, newValue: r.value }; }),
  safeZ: analysis.safeZ,
  finalDepth: analysis.finalDepth,
  passCount: analysis.passCount,
};
const noOpResult = verify.rewrite(analysis, noOpEdits);
assert(noOpResult.text === realGcode, 'Reescribir sin cambios reales debe producir un archivo idéntico byte a byte.');
assert(noOpResult.changes.length === 0, 'No debe reportar cambios cuando los valores nuevos son iguales a los detectados.');

// --------------------------------------------------------- Cambiar feed/RPM/Z segura
const paramEdits = {
  feeds: [{ oldValue: 700, newValue: 500 }],
  rpms: [{ oldValue: 12000, newValue: 9000 }],
  safeZ: 8,
  finalDepth: null,
  passCount: null,
};
const paramResult = verify.rewrite(analysis, paramEdits);
assert(paramResult.text.includes('F500') && !paramResult.text.includes('F700'), 'El feedrate debe cambiar de 700 a 500 en todo el archivo.');
assert(paramResult.text.includes('S9000') && !paramResult.text.includes('S12000'), 'El RPM debe cambiar de 12000 a 9000 en todo el archivo.');
assert(paramResult.text.includes('Z8') , 'La Z segura debe cambiar a 8.');
const xyBefore1 = extractXY(realGcode);
const xyAfter1 = extractXY(paramResult.text);
assert(JSON.stringify(xyBefore1) === JSON.stringify(xyAfter1), 'Las coordenadas XY no deben cambiar al editar feed/RPM/Z segura.');
assert(paramResult.changes.length === 3, 'Debe reportar 3 cambios (feed, rpm, safeZ) — obtenido: ' + paramResult.changes.length);

// ------------------------------------------------------------- Reescalar profundidad
const rescaleResult = verify.rewrite(analysis, {
  feeds: [], rpms: [], safeZ: null, finalDepth: -9, passCount: null,
});
const rescaleAnalysis = verify.analyze(rescaleResult.text);
assert(Math.abs(rescaleAnalysis.finalDepth + 9) < 0.001, 'La profundidad final reescalada debe ser -9 (obtenido: ' + rescaleAnalysis.finalDepth + ').');
assert(rescaleAnalysis.passCount === 3, 'El reescalado no debe cambiar el número de pasadas.');
const xyBefore2 = extractXY(realGcode);
const xyAfter2 = extractXY(rescaleResult.text);
assert(JSON.stringify(xyBefore2) === JSON.stringify(xyAfter2), 'Las coordenadas XY no deben cambiar al reescalar la profundidad.');

// ------------------------------------------------------------- Cambiar n° de pasadas
const passResult = verify.rewrite(analysis, {
  feeds: [], rpms: [], safeZ: null, finalDepth: -18, passCount: 5,
});
const passAnalysis = verify.analyze(passResult.text);
assert(passAnalysis.passCount === 5, 'Debe haber 5 pasadas tras el cambio (obtenido: ' + passAnalysis.passCount + ').');
assert(Math.abs(passAnalysis.finalDepth + 18) < 0.001, 'La profundidad final debe seguir siendo -18 con 5 pasadas.');
assert(passAnalysis.passPattern.detected, 'El archivo regenerado con 5 pasadas debe seguir teniendo patrón detectable.');

// Cada pasada regenerada debe usar EXACTAMENTE la misma secuencia XY que la
// pasada original (verificado indirectamente: incluir 5 repeticiones del
// número total de líneas por pasada de la plantilla original).
const originalPassLines = analysis.passPattern.segments[0].end - analysis.passPattern.segments[0].start + 1;
const newPassLines = passAnalysis.passPattern.segments[0].end - passAnalysis.passPattern.segments[0].start + 1;
assert(originalPassLines === newPassLines, 'El bloque de cada pasada regenerada debe tener el mismo número de líneas que el original.');

// ------------------------------------------------- Patrón NO repetible (negativo)
const irregularGcode = [
  '%',
  '( Irregular )',
  'G21',
  'G90',
  'M3 S1000',
  'G0 Z5',
  'G0 X0 Y0',
  'G1 Z-2 F100',
  'G1 X10 Y0 F500',
  'G1 X10 Y10',
  'G0 Z5',
  'G1 Z-4 F100',
  'G1 X20 Y0 F500',
  'G0 Z5',
  'G90',
  'G0 Z5',
  'M5',
  'M30',
  '%',
].join('\n');
const irregularAnalysis = verify.analyze(irregularGcode);
assert(!irregularAnalysis.passPattern.detected, 'Un archivo con distinta trayectoria XY por pasada no debe detectar patrón repetible.');
let threw = false;
try {
  verify.rewrite(irregularAnalysis, { feeds: [], rpms: [], safeZ: null, finalDepth: null, passCount: 3 });
} catch (e) {
  threw = true;
}
assert(threw, 'Intentar cambiar el número de pasadas sin patrón detectado debe fallar explícitamente (no generar una trayectoria arriesgada).');
// Pero feed/rpm/Z segura y reescalado de profundidad sí deben funcionar.
const irregularParamResult = verify.rewrite(irregularAnalysis, { feeds: [{ oldValue: 500, newValue: 600 }], rpms: [], safeZ: null, finalDepth: null, passCount: null });
assert(irregularParamResult.text.includes('F600'), 'Aun sin patrón de pasadas, debe poder cambiarse el feedrate.');

// ---------------------------------------------------- Estilo Aspire (sin espacios)
const aspireStyle = [
  '(Generated by Aspire)',
  'G20',
  'G90',
  'M3S18000',
  'G0Z0.25',
  'G0X0Y0',
  'G1Z-0.1F20',
  'G1X1Y0F60',
  'G1X1Y1',
  'G1X0Y1',
  'G1X0Y0',
  'G0Z0.25',
  'M5',
  'M30',
].join('\n');
const aspireAnalysis = verify.analyze(aspireStyle);
assert(aspireAnalysis.units === 'in', 'Debe detectar G20 (pulgadas).');
assert(aspireAnalysis.feeds.some(function (f) { return Math.abs(f.value - 60) < 0.001; }), 'Debe detectar F60 aunque no haya espacios.');
assert(aspireAnalysis.rpms.some(function (r) { return Math.abs(r.value - 18000) < 0.001; }), 'Debe detectar S18000 pegado a M3.');
assert(Math.abs(aspireAnalysis.safeZ - 0.25) < 0.001, 'Debe detectar Z0.25 como Z segura.');
assert(Math.abs(aspireAnalysis.finalDepth + 0.1) < 0.001, 'Debe detectar -0.1 como profundidad.');

// --------------------------------------------------------------------- Warnings
const noSpindleGcode = ['G21', 'G90', 'G0 Z5', 'G1 Z-1 F100', 'G1 X10 F500', 'M30'].join('\n');
const noSpindleAnalysis = verify.analyze(noSpindleGcode);
assert(!noSpindleAnalysis.spindleOn, 'Debe detectar que el spindle nunca se enciende.');
assert(noSpindleAnalysis.warnings.some(function (w) { return w.indexOf('M3/M4') >= 0; }), 'Debe advertir que falta M3/M4.');

const noEndGcode = ['G21', 'G90', 'M3 S1000', 'G0 Z5', 'G1 Z-1 F100'].join('\n');
const noEndAnalysis = verify.analyze(noEndGcode);
assert(!noEndAnalysis.endsProperly, 'Debe detectar que falta M30/M2.');

console.log(JSON.stringify({ gcodeVerifyTestsPassed: true }));
