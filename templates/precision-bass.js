(function () {
  // Descriptor de la plantilla Precision Bass (bobina partida).
  // A diferencia de las demás plantillas, define geometry.cavities (un
  // arreglo) en vez de geometry.cavity (una sola). El generador de G-code y
  // el preview aceptan ambas formas sin cambios (ver js/gcode/template.js y
  // js/template/preview.js: cavityRectsOf()).
  //
  // El desfase entre las dos mitades es una aproximación fija del layout
  // típico de un Precision Bass; los campos genéricos de offset/rotación
  // mueven y rotan el PAR completo como una sola unidad.

  const HALF_WIDTH = 57.4;
  const HALF_HEIGHT = 27.9;
  const HALF_RADIUS = 6;
  const STAGGER_X = 14;
  const STAGGER_Y = 6.5;

  const defaults = {
    outerW: 130,
    outerH: 80,
    thickness: 12,
    margin: 20,
    outerRadius: 6,
    cavW: HALF_WIDTH,
    cavH: HALF_HEIGHT,
    cavRadius: HALF_RADIUS,
    cavOffsetX: 0,
    cavOffsetY: 0,
    cavRotation: 0,
  };

  function buildGeometry(p) {
    const cx = Number(p.cavOffsetX) || 0;
    const cy = Number(p.cavOffsetY) || 0;
    const width = Number(p.cavW) || 0;
    const height = Number(p.cavH) || 0;
    const radius = Number(p.cavRadius) || 0;

    return {
      piece: {
        cx: 0,
        cy: 0,
        width: Number(p.outerW) || 0,
        height: Number(p.outerH) || 0,
        radius: Number(p.outerRadius) || 0,
      },
      cavities: [
        { cx: cx - STAGGER_X, cy: cy + STAGGER_Y, width: width, height: height, radius: radius },
        { cx: cx + STAGGER_X, cy: cy - STAGGER_Y, width: width, height: height, radius: radius },
      ],
      guides: { horizontal: true, vertical: true },
      thickness: Number(p.thickness) || 0,
      margin: Number(p.margin) || 0,
    };
  }

  window.BujiaTemplates = window.BujiaTemplates || {};
  window.BujiaTemplates["precision-bass"] = {
    id: "precision-bass",
    title: "Precision",
    category: "Pastillas / Bajo",
    description: "Ajusta las dimensiones, revisa la previsualización y descarga los tres archivos de G-code más el <code>preview.svg</code>. El corte va por fuera de la línea; la holgura añade separación extra (por ejemplo para copiadora). Precision Bass de bobina partida: dos cavidades de aprox. 57.4 x 27.9 mm cada una, desfasadas como en un Precision real. Los campos de la cavidad controlan cada mitad; el offset y la rotación mueven el par completo. Medidas aproximadas; confirma con tu pastilla real antes de cortar.",
    defaults: defaults,
    buildGeometry: buildGeometry,
  };
}());
