(function () {
  // Geometría reutilizable para plantillas. Es lo único que cambia entre una
  // plantilla y otra; la interfaz, el preview y el generador son genéricos.
  //
  // Sistema de coordenadas: origen (0,0) en el CENTRO de la pieza.
  // Ejes en milímetros, Y positiva hacia arriba (convención CNC).

  const HALF_PI = Math.PI / 2;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  // Desplaza un rectángulo redondeado {cx,cy,width,height,radius} una distancia
  // d (positiva = hacia afuera, negativa = hacia adentro). Al desplazar, cada
  // dimensión cambia 2*d y el radio cambia d.
  function offsetRoundedRect(rect, d) {
    const width = rect.width + 2 * d;
    const height = rect.height + 2 * d;
    const maxRadius = Math.min(width, height) / 2;
    const radius = clamp((rect.radius || 0) + d, 0, Math.max(0, maxRadius));
    return {
      cx: rect.cx,
      cy: rect.cy,
      width: width,
      height: height,
      radius: radius,
    };
  }

  // Genera los puntos de un rectángulo redondeado como polilínea cerrada.
  // opts: { clockwise, cornerSegments }
  // Devuelve [] si el rectángulo no tiene área positiva.
  function roundedRectPath(rect, opts) {
    const options = opts || {};
    const segments = Math.max(1, options.cornerSegments || 8);
    const width = rect.width;
    const height = rect.height;

    if (width <= 0 || height <= 0) return [];

    const halfW = width / 2;
    const halfH = height / 2;
    const radius = clamp(rect.radius || 0, 0, Math.min(halfW, halfH));
    const cx = rect.cx;
    const cy = rect.cy;

    // Centros de los cuatro arcos de esquina (sentido antihorario desde la
    // esquina inferior derecha).
    const corners = [
      { cx: cx + halfW - radius, cy: cy - halfH + radius, start: -HALF_PI },
      { cx: cx + halfW - radius, cy: cy + halfH - radius, start: 0 },
      { cx: cx - halfW + radius, cy: cy + halfH - radius, start: HALF_PI },
      { cx: cx - halfW + radius, cy: cy - halfH + radius, start: Math.PI },
    ];

    const points = [];
    corners.forEach(function (corner) {
      if (radius <= 0) {
        // Esquina viva: un solo punto en la esquina real.
        const angle = corner.start + HALF_PI / 2;
        points.push({
          x: corner.cx + Math.cos(angle) * 0,
          y: corner.cy + Math.sin(angle) * 0,
        });
        // Para radio 0, el centro del arco ES la esquina.
        points[points.length - 1] = { x: corner.cx, y: corner.cy };
        return;
      }
      for (let i = 0; i <= segments; i++) {
        const angle = corner.start + (i / segments) * HALF_PI;
        points.push({
          x: corner.cx + Math.cos(angle) * radius,
          y: corner.cy + Math.sin(angle) * radius,
        });
      }
    });

    if (options.clockwise) points.reverse();
    return points;
  }

  function boundingBox(points) {
    if (!points.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    points.forEach(function (point) {
      if (point.x < minX) minX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.x > maxX) maxX = point.x;
      if (point.y > maxY) maxY = point.y;
    });
    return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
  }

  // Genera una serie de anillos concéntricos hacia adentro (para vaciar una
  // cavidad). Empieza en el rectángulo dado y reduce por stepover hasta que
  // deja de tener área útil.
  function concentricRings(outerRect, stepover, opts) {
    const rings = [];
    const step = Math.max(0.01, stepover);
    let current = outerRect;
    let guard = 0;

    while (current.width > 0 && current.height > 0 && guard < 2000) {
      const path = roundedRectPath(current, opts);
      if (!path.length) break;
      rings.push(path);
      current = offsetRoundedRect(current, -step);
      guard++;
    }

    return rings;
  }

  // Plan de profundidades. En modo manual reparte finalDepth en N pasadas con
  // feed/rpm constantes. En modo adaptive usa las filas de la tabla Adaptive.
  // Devuelve [{ z, feed, rpm }] con z acumulada (positiva).
  function depthPlan(config) {
    const plan = [];

    if (config.mode === "adaptive" && Array.isArray(config.rows) && config.rows.length) {
      config.rows.forEach(function (row) {
        plan.push({
          z: Math.abs(row.accumulatedDepth),
          feed: row.feedrate || config.feed,
          rpm: row.rpm || config.rpm,
        });
      });
      return plan;
    }

    const passes = Math.max(1, Math.floor(config.passes || 1));
    const finalDepth = Math.abs(config.finalDepth || 0);
    const step = finalDepth / passes;

    for (let i = 1; i <= passes; i++) {
      const z = i === passes ? finalDepth : step * i;
      plan.push({ z: z, feed: config.feed, rpm: config.rpm });
    }

    return plan;
  }

  // Rotación exacta de un punto en múltiplos de 90° alrededor del origen
  // (centro de la pieza). Se usan valores exactos para no introducir ruido de
  // coma flotante en el G-code.
  function rotatePointQuarter(point, angle) {
    const a = ((Math.round(angle / 90) * 90) % 360 + 360) % 360;
    if (a === 90) return { x: -point.y, y: point.x };
    if (a === 180) return { x: -point.x, y: -point.y };
    if (a === 270) return { x: point.y, y: -point.x };
    return { x: point.x, y: point.y };
  }

  // Rota una polilínea completa. Devuelve el mismo arreglo si el ángulo es 0.
  function rotatePath(points, angle) {
    const a = ((Math.round((angle || 0) / 90) * 90) % 360 + 360) % 360;
    if (a === 0) return points;
    return points.map(function (point) { return rotatePointQuarter(point, a); });
  }

  window.BujiaTemplateGeometry = {
    offsetRoundedRect: offsetRoundedRect,
    roundedRectPath: roundedRectPath,
    boundingBox: boundingBox,
    concentricRings: concentricRings,
    depthPlan: depthPlan,
    clamp: clamp,
    rotatePointQuarter: rotatePointQuarter,
    rotatePath: rotatePath,
  };
}());
