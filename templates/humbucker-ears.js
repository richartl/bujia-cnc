(function () {
  // Descriptor de la plantilla Humbucker con orejas de montaje (mounting
  // ears). A diferencia de un humbucker estándar, TODA la cavidad (cuerpo +
  // las dos orejas) se corta a una sola profundidad uniforme: no hay relieve
  // superficial aparte. Se modela como geometry.cavities (3 rectángulos: uno
  // para el cuerpo y uno por cada oreja), la misma mecánica que usa Precision
  // Bass para su bobina partida — el generador y el preview ya la soportan
  // sin cambios.
  //
  // Medidas de referencia: Seymour Duncan / Gibson (ver imagen aportada por
  // el usuario). Las esquinas interiores reales (donde van los tornillos) no
  // se redondean; aquí se aproximan con el mismo radio del cuerpo en las 4
  // esquinas por simplicidad (limitación conocida del rectángulo redondeado
  // uniforme). Verifica siempre contra la pastilla física antes de fabricar.

  const BODY_WIDTH = 74;
  const BODY_HEIGHT = 24;
  const BODY_RADIUS = 4;
  const EAR_WIDTH = 10;
  const EAR_HEIGHT = 42;
  const EAR_RADIUS = 4;
  // Cuánto se mete la oreja dentro del cuerpo, para que el hueco quede
  // continuo (sin una línea intermedia) en vez de dos rectángulos que solo
  // se tocan en un punto.
  const EAR_OVERLAP = 1;

  const defaults = {
    outerW: 140,
    outerH: 90,
    thickness: 12,
    margin: 20,
    outerRadius: 6,
    cavW: BODY_WIDTH,
    cavH: BODY_HEIGHT,
    cavRadius: BODY_RADIUS,
    cavOffsetX: 0,
    cavOffsetY: 0,
    cavRotation: 0,
  };

  function buildGeometry(p) {
    const cx = Number(p.cavOffsetX) || 0;
    const cy = Number(p.cavOffsetY) || 0;
    const bodyW = Number(p.cavW) || 0;
    const bodyH = Number(p.cavH) || 0;
    const bodyR = Number(p.cavRadius) || 0;
    const earOffsetX = (bodyW / 2) - EAR_OVERLAP + (EAR_WIDTH / 2);

    return {
      piece: {
        cx: 0,
        cy: 0,
        width: Number(p.outerW) || 0,
        height: Number(p.outerH) || 0,
        radius: Number(p.outerRadius) || 0,
      },
      cavities: [
        { cx: cx, cy: cy, width: bodyW, height: bodyH, radius: bodyR },
        { cx: cx - earOffsetX, cy: cy, width: EAR_WIDTH, height: EAR_HEIGHT, radius: EAR_RADIUS },
        { cx: cx + earOffsetX, cy: cy, width: EAR_WIDTH, height: EAR_HEIGHT, radius: EAR_RADIUS },
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
    description: "Ajusta las dimensiones, revisa la previsualización y descarga los tres archivos de G-code más el <code>preview.svg</code>. El corte va por fuera de la línea; la holgura añade separación extra (por ejemplo para copiadora). Cavidad de humbucker con orejas de montaje: cuerpo de 74 x 24 mm más dos orejas de 10 mm que llevan el alto total a 42 mm y el ancho total a 92 mm, todo a una sola profundidad (recomendada 16.5 mm, fresa mínima 6 mm). Referencia: Seymour Duncan / Gibson. Las esquinas interiores donde van los tornillos normalmente no se redondean; esta plantilla las aproxima con el mismo radio de 4 mm por simplicidad. Medidas aproximadas; verifica siempre contra la pastilla física antes de fabricar.",
    defaults: defaults,
    buildGeometry: buildGeometry,
  };
}());
