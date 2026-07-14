(function () {
  // Descriptor de la plantilla Humbucker. Para agregar una plantilla nueva se
  // crea otro archivo como este (defaults + buildGeometry) y se marca "stable"
  // en templates/registry.js. La interfaz, el preview y el generador no cambian.

  const defaults = {
    // Pieza / MDF exterior
    outerW: 120,
    outerH: 150,
    thickness: 12,
    margin: 20,
    outerRadius: 6,
    // Cavidad
    cavW: 40,
    cavH: 72,
    cavRadius: 3,
    cavOffsetX: 0,
    cavOffsetY: 0,
    cavRotation: 0,
  };

  // Convierte los valores del formulario en geometría (origen = centro).
  // La rotación se acepta como parámetro pero todavía no se aplica.
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
  window.BujiaTemplates.humbucker = {
    id: "humbucker",
    title: "Humbucker",
    category: "Pastillas / Guitarra",
    description: "Ajusta las dimensiones, revisa la previsualización y descarga los tres archivos de G-code más el <code>preview.svg</code>. El corte va por fuera de la línea; la holgura añade separación extra (por ejemplo para copiadora).",
    defaults: defaults,
    buildGeometry: buildGeometry,
  };
}());
