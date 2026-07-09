(function () {
  // Descriptor de la plantilla Personalizada. Generado siguiendo el mismo
  // patron que templates/humbucker.js: defaults + buildGeometry. La interfaz,
  // el preview y el generador de G-code se reutilizan sin cambios.

  const defaults = {
    // Pieza / MDF exterior
    outerW: 130,
    outerH: 80,
    thickness: 12,
    margin: 20,
    outerRadius: 6,
    // Cavidad
    cavW: 80,
    cavH: 40,
    cavRadius: 6,
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
  window.BujiaTemplates["custom-guitar"] = {
    id: "custom-guitar",
    title: "Personalizada",
    category: "Pastillas / Guitarra",
    description: "Ajusta las dimensiones, revisa la previsualizacion y descarga los tres archivos de G-code mas el <code>preview.svg</code>. El corte va por fuera de la linea; la holgura anade separacion extra (por ejemplo para copiadora). Punto de partida en blanco: ajusta todas las medidas a tu pastilla. Medidas aproximadas basadas en referencias de fabricantes y luthieria; confirma con tu pastilla real antes de cortar.",
    defaults: defaults,
    buildGeometry: buildGeometry,
  };
}());
