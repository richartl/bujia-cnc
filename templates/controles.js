(function () {
  // Descriptor de la plantilla Controles. Generado siguiendo el mismo
  // patron que templates/humbucker.js: defaults + buildGeometry. La interfaz,
  // el preview y el generador de G-code se reutilizan sin cambios.

  const defaults = {
    // Pieza / MDF exterior
    outerW: 140,
    outerH: 110,
    thickness: 12,
    margin: 20,
    outerRadius: 6,
    // Cavidad
    cavW: 90,
    cavH: 60,
    cavRadius: 10,
    cavOffsetX: 0,
    cavOffsetY: 0,
    cavRotation: 0,
  };

  function buildGeometry(p) {
    return {
      piece: {
        cx: 0,
        cy: 0,
        width: Number(p.outerW) || 0,
        height: Number(p.outerH) || 0,
        radius: Number(p.outerRadius) || 0,
      },
      cavity: {
        cx: Number(p.cavOffsetX) || 0,
        cy: Number(p.cavOffsetY) || 0,
        width: Number(p.cavW) || 0,
        height: Number(p.cavH) || 0,
        radius: Number(p.cavRadius) || 0,
        rotation: Number(p.cavRotation) || 0,
      },
      guides: { horizontal: true, vertical: true },
      thickness: Number(p.thickness) || 0,
      margin: Number(p.margin) || 0,
    };
  }

  window.BujiaTemplates = window.BujiaTemplates || {};
  window.BujiaTemplates["controles"] = {
    id: "controles",
    title: "Controles",
    category: "Controles",
    description: "Ajusta las dimensiones, revisa la previsualizacion y descarga los tres archivos de G-code mas el <code>preview.svg</code>. El corte va por fuera de la linea; la holgura anade separacion extra (por ejemplo para copiadora). El tamano de la cavidad de controles varia mucho segun el instrumento; estas medidas son solo un punto de partida. Ajusta ancho, alto y offsets a tu diseno de electronica. Medidas aproximadas basadas en referencias de fabricantes y luthieria; confirma con tu pastilla real antes de cortar.",
    defaults: defaults,
    buildGeometry: buildGeometry,
  };
}());
