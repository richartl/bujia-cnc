(function () {
  // Descriptor de la plantilla Humbucker con orejas de montaje.
  // Misma cavidad principal que templates/humbucker.js, más dos relieves
  // superficiales (geometry.earPockets) para las orejas metálicas de
  // montaje del cuerpo de la pastilla. hasEars=true habilita el campo
  // "Profundidad de orejas" en la página (ver js/ui/template-ui.js).

  const defaults = {
    outerW: 120,
    outerH: 150,
    thickness: 12,
    margin: 20,
    outerRadius: 6,
    cavW: 40,
    cavH: 72,
    cavRadius: 3,
    cavOffsetX: 0,
    cavOffsetY: 0,
    cavRotation: 0,
  };

  const EAR_WIDTH = 48;
  const EAR_HEIGHT = 9;
  const EAR_RADIUS = 3;

  function buildGeometry(p) {
    const cx = Number(p.cavOffsetX) || 0;
    const cy = Number(p.cavOffsetY) || 0;
    const cavH = Number(p.cavH) || 0;
    // Las orejas se apoyan justo en los extremos de la cavidad principal,
    // con una pequeña superposición para que el relieve quede continuo.
    const earOffsetY = (cavH / 2) - (EAR_HEIGHT / 2) + 1.5;

    return {
      piece: {
        cx: 0,
        cy: 0,
        width: Number(p.outerW) || 0,
        height: Number(p.outerH) || 0,
        radius: Number(p.outerRadius) || 0,
      },
      cavity: {
        cx: cx,
        cy: cy,
        width: Number(p.cavW) || 0,
        height: cavH,
        radius: Number(p.cavRadius) || 0,
        rotation: Number(p.cavRotation) || 0,
      },
      earPockets: [
        { cx: cx, cy: cy + earOffsetY, width: EAR_WIDTH, height: EAR_HEIGHT, radius: EAR_RADIUS },
        { cx: cx, cy: cy - earOffsetY, width: EAR_WIDTH, height: EAR_HEIGHT, radius: EAR_RADIUS },
      ],
      guides: { horizontal: true, vertical: true },
      thickness: Number(p.thickness) || 0,
      margin: Number(p.margin) || 0,
    };
  }

  window.BujiaTemplates = window.BujiaTemplates || {};
  window.BujiaTemplates["humbucker-ears"] = {
    id: "humbucker-ears",
    title: "Humbucker (con orejas)",
    category: "Pastillas / Guitarra",
    hasEars: true,
    description: "Ajusta las dimensiones, revisa la previsualización y descarga los tres archivos de G-code más el <code>preview.svg</code>. El corte va por fuera de la línea; la holgura añade separación extra (por ejemplo para copiadora). Misma cavidad principal que un humbucker estándar (aprox. 40 x 72 mm), más dos relieves superficiales para las orejas de montaje (aprox. 48 x 9 mm), cortados en una sola pasada a la profundidad que definas en «Corte de la cavidad». Medidas aproximadas; verifica con tu pastilla real antes de cortar, ya que el relieve de orejas varía según el fabricante.",
    defaults: defaults,
    buildGeometry: buildGeometry,
  };
}());
