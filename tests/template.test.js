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

// ------------------------------------------------------------------ Rotación
assert(geom.rotatePointQuarter({ x: 60, y: 0 }, 90).x === 0 && geom.rotatePointQuarter({ x: 60, y: 0 }, 90).y === 60, 'Rotar 90° lleva (60,0) a (0,60).');
assert(geom.rotatePointQuarter({ x: 60, y: 0 }, 180).x === -60, 'Rotar 180° lleva (60,0) a (-60,0).');
assert(geom.rotatePointQuarter({ x: 60, y: 0 }, 270).y === -60, 'Rotar 270° lleva (60,0) a (0,-60).');

const rotatedGeometry = humbucker.buildGeometry(humbucker.defaults);
rotatedGeometry.rotation = 90;

// Las guías rotan con la plantilla: la horizontal pasa a recorrer el eje Y.
const guidesRot = gcode.generateGuidesGcode(rotatedGeometry, {
  toolDiameter: 3, feed: 500, rpm: 12000, depth: 1, safeZ: 6, horizontal: true, vertical: true,
});
assert(guidesRot.includes('G0 X0 Y-60') && guidesRot.includes('G1 X0 Y60'), 'Con rotación 90° la guía horizontal recorre el eje Y.');
assert(!guidesRot.includes('G1 X60 Y0'), 'Con rotación 90° ya no debe existir el recorrido horizontal original.');

// El contorno rotado difiere del sin rotar.
const contourRot = gcode.generateContourGcode(rotatedGeometry, {
  mode: 'manual', toolDiameter: 6, clearance: 0, passes: 4, finalDepth: 12,
  feed: 800, rpm: 12000, plungeFeed: 200, safeZ: 6, direction: 'climb',
}, null);
assert(contourRot !== contour, 'El contorno rotado 90° debe diferir del contorno sin rotar.');

// El sentido del corte NO debe cambiar al rotar: el área firmada (signo =
// horario/antihorario) del recorrido debe conservarse en 0/90/180/270.
function signedArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
}
function geoRot(angle) {
  const g = humbucker.buildGeometry(humbucker.defaults);
  g.rotation = angle;
  return g;
}
function contourSign(angle, direction) {
  return Math.sign(signedArea(gcode.contourToolpath(geoRot(angle), { toolDiameter: 6, clearance: 0, direction: direction })));
}
const senseClimb = contourSign(0, 'climb');
assert(senseClimb !== 0, 'El contorno cerrado debe tener área distinta de cero.');
assert(contourSign(90, 'climb') === senseClimb, 'Rotar 90° conserva el sentido del corte.');
assert(contourSign(180, 'climb') === senseClimb, 'Rotar 180° conserva el sentido del corte.');
assert(contourSign(270, 'climb') === senseClimb, 'Rotar 270° conserva el sentido del corte.');
assert(contourSign(0, 'conventional') === -senseClimb, 'Climb y Conventional tienen sentidos opuestos.');

// La cavidad también conserva el sentido al rotar.
const cavitySign0 = Math.sign(signedArea(gcode.cavityToolpaths(geoRot(0), { toolDiameter: 6, clearance: 0, stepover: 3, direction: 'climb' })[0]));
const cavitySign90 = Math.sign(signedArea(gcode.cavityToolpaths(geoRot(90), { toolDiameter: 6, clearance: 0, stepover: 3, direction: 'climb' })[0]));
assert(cavitySign0 === cavitySign90 && cavitySign0 !== 0, 'La cavidad conserva el sentido al rotar.');

// ---------------------------------------------------------------------- SVG
const svg = preview.buildSvg(geometry);
assert(svg.includes('<svg') && svg.includes('viewBox'), 'El SVG debe tener raíz y viewBox.');
assert(svg.includes('mm'), 'El SVG debe estar a escala en mm.');

console.log(JSON.stringify({ templateTestsPassed: true }));
