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
  feed: 700, rpm: 12000, plungeFeed: 150, safeZ: 6, direction: 'climb', earDepth: 3,
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

// Humbucker con orejas: cavidad principal + relieves de orejas independientes.
const ears = templates['humbucker-ears'];
const earsGeometry = ears.buildGeometry(ears.defaults);
assert(Array.isArray(earsGeometry.earPockets) && earsGeometry.earPockets.length === 2, 'Humbucker con orejas debe definir 2 relieves de orejas.');
const earsCavityGcode = gcode.generatePocketGcode(earsGeometry, cutParams, null);
assert(earsCavityGcode.includes('OREJAS DE MONTAJE'), 'El G-code de cavidad debe incluir el corte de las orejas.');
const earsGcodeNoDepth = gcode.generatePocketGcode(earsGeometry, Object.assign({}, cutParams, { earDepth: 0 }), null);
assert(!earsGcodeNoDepth.includes('OREJAS DE MONTAJE'), 'Sin earDepth no debe cortarse el relieve de orejas.');

console.log(JSON.stringify({ templateCatalogTestsPassed: true, templatesChecked: leaves.length }));
