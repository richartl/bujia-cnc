const fs = require('fs');
const vm = require('vm');

// Los módulos de plantillas comparten window, así que se cargan en un mismo
// contexto (a diferencia de un módulo aislado).
const context = { window: {}, Number, Math, Object, Array, String, Boolean };
vm.createContext(context);

function run(path) {
  vm.runInContext(fs.readFileSync(path, 'utf8'), context);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function count(text, needle) {
  return text.split(needle).length - 1;
}

run('js/gcode/gcode-core.js');
run('js/template/geometry.js');
run('js/template/preview.js');
run('js/gcode/template.js');
run('templates/humbucker.js');

const geom = context.window.BujiaTemplateGeometry;
const gcode = context.window.BujiaTemplateGcode;
const preview = context.window.BujiaTemplatePreview;
const humbucker = context.window.BujiaTemplates.humbucker;

// -------------------------------------------------------------- Geometría
const off = geom.offsetRoundedRect({ cx: 0, cy: 0, width: 40, height: 72, radius: 3 }, 5);
assert(off.width === 50 && off.height === 82, 'Offset exterior debe sumar 2*d a cada dimensión.');
assert(off.radius === 8, 'Offset exterior debe sumar d al radio.');

const inRings = geom.concentricRings({ cx: 0, cy: 0, width: 40, height: 40, radius: 0 }, 5, {});
assert(inRings.length >= 3, 'El vaciado debe generar varios anillos concéntricos.');

// ----------------------------------------------------------- Offset por fuera
assert(gcode.outsideOffset(6, 0) === 3, 'Sin holgura, el offset es el radio de la fresa.');
assert(gcode.outsideOffset(6, 3) === 6, 'La holgura se suma al radio de la fresa.');

// -------------------------------------------------------- Geometría Humbucker
const geometry = humbucker.buildGeometry(humbucker.defaults);
assert(geometry.piece.width === 120 && geometry.piece.height === 150, 'La pieza usa las dimensiones exteriores.');
assert(geometry.cavity.cx === 0 && geometry.cavity.cy === 0, 'La cavidad está centrada en el origen por defecto.');

// ------------------------------------------------------------- Contorno (Manual)
const contour = gcode.generateContourGcode(geometry, {
  mode: 'manual', toolDiameter: 6, clearance: 0, passes: 4, finalDepth: 12,
  feed: 800, rpm: 12000, plungeFeed: 200, safeZ: 6, direction: 'climb',
}, null);
assert(contour.startsWith('%') && contour.trim().endsWith('%'), 'El contorno debe abrir y cerrar con %.');
assert(contour.includes('G21') && contour.includes('M30') && contour.includes('M5'), 'El contorno debe ser seguro (G21/M5/M30).');
assert(count(contour, 'PASADA ') === 4, 'El contorno manual debe tener 4 pasadas.');

// Climb vs Conventional invierte el sentido del recorrido.
const contourConv = gcode.generateContourGcode(geometry, {
  mode: 'manual', toolDiameter: 6, clearance: 0, passes: 4, finalDepth: 12,
  feed: 800, rpm: 12000, plungeFeed: 200, safeZ: 6, direction: 'conventional',
}, null);
assert(contour !== contourConv, 'Climb y Conventional deben producir recorridos distintos.');

// ------------------------------------------------------------ Contorno (Adaptive)
const contourAdaptive = gcode.generateContourGcode(geometry, {
  mode: 'adaptive', toolDiameter: 6, clearance: 0, safeZ: 6, direction: 'climb', plungeFeed: 200,
}, [
  { accumulatedDepth: 6, feedrate: 500, rpm: 9000 },
  { accumulatedDepth: 12, feedrate: 550, rpm: 9500 },
]);
assert(count(contourAdaptive, 'PASADA ') === 2, 'El contorno adaptive usa las filas de la tabla.');
assert(contourAdaptive.includes('M3 S9000') && contourAdaptive.includes('F500'), 'El contorno adaptive usa RPM y feed de cada fila.');

// -------------------------------------------------------------- Cavidad (vaciado)
const cavity = gcode.generatePocketGcode(geometry, {
  mode: 'manual', toolDiameter: 6, clearance: 3, stepover: 2.4, passes: 3, finalDepth: 18,
  feed: 700, rpm: 12000, plungeFeed: 150, safeZ: 6, direction: 'climb',
}, null);
assert(cavity.includes('M30') && cavity.startsWith('%'), 'La cavidad debe ser un programa válido.');
assert(count(cavity, 'PASADA ') === 3, 'La cavidad manual debe tener 3 pasadas.');
assert(cavity.includes('Anillo 1'), 'La cavidad debe vaciar con anillos concéntricos.');

// --------------------------------------------------------------------- Guías
const guides = gcode.generateGuidesGcode(geometry, {
  toolDiameter: 3, feed: 500, rpm: 12000, depth: 1, safeZ: 6, horizontal: true, vertical: true,
});
assert(guides.startsWith('%') && guides.trim().endsWith('%'), 'Las guías son un archivo independiente.');
assert(guides.includes('Guia horizontal') && guides.includes('Guia vertical'), 'Deben generarse ambas guías.');
assert(guides.includes('G0 X-60 Y0') && guides.includes('G1 X60 Y0'), 'La guía horizontal recorre el ancho de la pieza.');

// ---------------------------------------------------------------------- SVG
const svg = preview.buildSvg(geometry);
assert(svg.includes('<svg') && svg.includes('viewBox'), 'El SVG debe tener raíz y viewBox.');
assert(svg.includes('mm'), 'El SVG debe estar a escala en mm.');

console.log(JSON.stringify({ templateTestsPassed: true }));
