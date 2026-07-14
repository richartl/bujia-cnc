const fs = require('fs');
const vm = require('vm');
const path = require('path');

const context = { window: {}, Number, Math, Object, Array, String, Boolean };
vm.createContext(context);

function run(relPath) {
  vm.runInContext(fs.readFileSync(relPath, 'utf8'), context);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

run('js/gcode/gcode-core.js');
run('js/template/geometry.js');
run('js/gcode/template.js');
run('js/template/preview.js');
run('templates/registry.js');

// Cargar todos los descriptores de templates/ (cualquier *.js excepto registry.js).
fs.readdirSync('templates')
  .filter(function (name) { return name.endsWith('.js') && name !== 'registry.js'; })
  .forEach(function (name) { run(path.join('templates', name)); });

const geom = context.window.BujiaTemplateGeometry;
const gcode = context.window.BujiaTemplateGcode;
const preview = context.window.BujiaTemplatePreview;
const templates = context.window.BujiaTemplates;

// Recorre el árbol de categorías y recolecta todas las hojas "stable" con page.
function collectStableLeaves(nodes) {
  const leaves = [];
  nodes.forEach(function (node) {
    if (node.children) {
      leaves.push.apply(leaves, collectStableLeaves(node.children));
    } else if (node.status === 'stable' && node.page) {
      leaves.push(node);
    }
  });
  return leaves;
}

const leaves = collectStableLeaves(context.window.BujiaTemplateRegistry.nodes);
assert(leaves.length >= 15, 'El catálogo debe tener al menos 15 plantillas estables (encontradas: ' + leaves.length + ').');

const cutParams = {
  mode: 'manual', toolDiameter: 6, clearance: 0, stepover: 2.4, passes: 3, finalDepth: 12,
  feed: 700, rpm: 12000, plungeFeed: 150, safeZ: 6, direction: 'climb',
};
const guideParams = { toolDiameter: 3, feed: 500, rpm: 12000, depth: 1, safeZ: 6, horizontal: true, vertical: true };

leaves.forEach(function (leaf) {
  const id = leaf.page.replace(/^template-/, '').replace(/\.html$/, '');
  const descriptor = templates[id];
  assert(descriptor, 'Falta el descriptor "' + id + '" para la página ' + leaf.page + '.');
  assert(descriptor.title === leaf.title, 'El título del descriptor "' + id + '" no coincide con el registry.');

  const geometry = descriptor.buildGeometry(descriptor.defaults);
  geometry.rotation = 0;

  const contour = gcode.generateContourGcode(geometry, cutParams, null);
  assert(contour.startsWith('%') && contour.trim().endsWith('%'), id + ': contorno debe ser un programa válido.');
  assert(contour.includes('M30') && contour.includes('M5'), id + ': contorno debe cerrar de forma segura.');

  const cavity = gcode.generatePocketGcode(geometry, cutParams, null);
  assert(cavity.startsWith('%') && cavity.includes('M30'), id + ': cavidad debe ser un programa válido.');

  const guides = gcode.generateGuidesGcode(geometry, guideParams);
  assert(guides.startsWith('%') && guides.includes('M30'), id + ': guías deben ser un programa válido.');

  const svg = preview.buildSvg(geometry);
  assert(svg.includes('<svg') && svg.includes('viewBox'), id + ': preview.svg debe generarse.');

  // 90° gira todo, pero el sentido del corte (signo del área) no debe cambiar.
  function signedArea(points) {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      area += a.x * b.y - b.x * a.y;
    }
    return area / 2;
  }
  const geoRot = descriptor.buildGeometry(descriptor.defaults);
  geoRot.rotation = 90;
  const signBefore = Math.sign(signedArea(gcode.contourToolpath(geometry, cutParams)));
  const signAfter = Math.sign(signedArea(gcode.contourToolpath(geoRot, cutParams)));
  assert(signBefore !== 0 && signBefore === signAfter, id + ': el sentido del contorno debe conservarse al rotar.');
});

// Precision Bass: dos cavidades independientes (bobina partida).
const precision = templates['precision-bass'];
const precisionGeometry = precision.buildGeometry(precision.defaults);
assert(Array.isArray(precisionGeometry.cavities) && precisionGeometry.cavities.length === 2, 'Precision Bass debe tener 2 cavidades.');
const precisionRings = gcode.cavityToolpaths(precisionGeometry, cutParams);
assert(precisionRings.length > 0, 'Precision Bass debe generar anillos de vaciado para ambas cavidades.');

// Humbucker con orejas: cuerpo + 2 orejas como cavidades independientes,
// todas cortadas a la misma profundidad (sin relieve superficial aparte).
// Medidas de referencia: Seymour Duncan / Gibson (cuerpo 74x24, total con
// orejas 92x42).
const ears = templates['humbucker-ears'];
const earsGeometry = ears.buildGeometry(ears.defaults);
assert(Array.isArray(earsGeometry.cavities) && earsGeometry.cavities.length === 3, 'Humbucker con orejas debe tener 3 cavidades (cuerpo + 2 orejas).');

const [earsBody] = earsGeometry.cavities;
assert(earsBody.width === 74 && earsBody.height === 24, 'El cuerpo del Humbucker con orejas debe medir 74 x 24 mm.');

const earsOutline = earsGeometry.cavities.reduce(function (points, rect) {
  return points.concat(geom.roundedRectPath(rect, { cornerSegments: 8 }));
}, []);
const earsBbox = geom.boundingBox(earsOutline);
const earsTotalWidth = earsBbox.maxX - earsBbox.minX;
const earsTotalHeight = earsBbox.maxY - earsBbox.minY;
assert(Math.abs(earsTotalWidth - 92) < 0.01, 'El ancho total con orejas debe ser 92 mm (obtenido: ' + earsTotalWidth + ').');
assert(Math.abs(earsTotalHeight - 42) < 0.01, 'El alto total con orejas debe ser 42 mm (obtenido: ' + earsTotalHeight + ').');

const earsCavityGcode = gcode.generatePocketGcode(earsGeometry, cutParams, null);
assert(earsCavityGcode.includes('Cavidades: 3'), 'El G-code de cavidad debe indicar las 3 cavidades cortadas a la misma profundidad.');

console.log(JSON.stringify({ templateCatalogTestsPassed: true, templatesChecked: leaves.length }));
