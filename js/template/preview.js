(function () {
  const geom = window.BujiaTemplateGeometry;

  // Una plantilla puede tener una o varias cavidades (p. ej. Precision Bass de
  // bobina partida, o Humbucker con orejas: cuerpo + orejas como cavidades
  // independientes cortadas a la misma profundidad). Se normaliza aquí para
  // que el resto del preview no necesite distinguir casos.
  function cavityRectsOf(geometry) {
    if (Array.isArray(geometry.cavities) && geometry.cavities.length) return geometry.cavities;
    return geometry.cavity ? [geometry.cavity] : [];
  }

  // Construye la escena 2D (en mm) a partir de la geometría. Es la única
  // fuente de verdad para el Canvas y para el SVG.
  function buildScene(geometry) {
    const rotation = geometry.rotation || 0;
    const piece = geom.rotatePath(geom.roundedRectPath(geometry.piece, { cornerSegments: 16 }), rotation);
    const cavities = cavityRectsOf(geometry).map(function (rect) {
      return geom.rotatePath(geom.roundedRectPath(rect, { cornerSegments: 16 }), rotation);
    });
    const halfW = geometry.piece.width / 2;
    const halfH = geometry.piece.height / 2;

    // Las guías de centro rotan con toda la plantilla.
    const hSeg = geom.rotatePath([{ x: -halfW, y: 0 }, { x: halfW, y: 0 }], rotation);
    const vSeg = geom.rotatePath([{ x: 0, y: -halfH }, { x: 0, y: halfH }], rotation);

    const fallback = [{ x: -halfW, y: -halfH }, { x: halfW, y: halfH }];
    const bbox = geom.boundingBox(piece.length ? piece : fallback);

    return {
      piece: piece,
      cavities: cavities,
      guides: {
        horizontal: geometry.guides.horizontal !== false,
        vertical: geometry.guides.vertical !== false,
        hSeg: hSeg,
        vSeg: vSeg,
      },
      bbox: bbox,
      dims: {
        width: bbox.maxX - bbox.minX,
        height: bbox.maxY - bbox.minY,
      },
    };
  }

  function colors() {
    const s = getComputedStyle(document.documentElement);
    function v(name, fallback) { return s.getPropertyValue(name).trim() || fallback; }
    return {
      bg: v("--color-app", "#0e1116"),
      piece: v("--color-border-strong", "#38434f"),
      accent: v("--color-accent", "#4a9eff"),
      guide: v("--color-warning", "#e0a23a"),
      text: v("--color-muted", "#8b98a6"),
      faint: v("--color-faint", "#6b7785"),
      success: v("--color-success", "#3fb765"),
    };
  }

  // Prepara el canvas y devuelve un encuadre (origen centrado, Y hacia arriba)
  // que encaja el rectángulo "extent" (en mm). Compartido por todas las vistas
  // para que dibujo y recorridos usen la misma escala.
  function setupView(canvas, extent) {
    const ctx = canvas.getContext("2d");
    const cssWidth = canvas.clientWidth || 640;
    const cssHeight = canvas.clientHeight || 420;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(cssWidth * ratio);
    canvas.height = Math.round(cssHeight * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const col = colors();
    ctx.fillStyle = col.bg;
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    const pad = 42;
    const halfX = Math.max(1, Math.max(Math.abs(extent.minX), Math.abs(extent.maxX)));
    const halfY = Math.max(1, Math.max(Math.abs(extent.minY), Math.abs(extent.maxY)));
    const scale = Math.min((cssWidth / 2 - pad) / halfX, (cssHeight / 2 - pad) / halfY);
    const cx = cssWidth / 2;
    const cy = cssHeight / 2;

    return {
      ctx: ctx,
      col: col,
      cssWidth: cssWidth,
      cssHeight: cssHeight,
      cx: cx,
      cy: cy,
      scale: scale,
      tx: function (x) { return cx + x * scale; },
      ty: function (y) { return cy - y * scale; },
    };
  }

  function strokePolyline(view, points, color, lineWidth, close) {
    if (!points.length) return;
    const ctx = view.ctx;
    ctx.beginPath();
    ctx.moveTo(view.tx(points[0].x), view.ty(points[0].y));
    for (let i = 1; i < points.length; i++) ctx.lineTo(view.tx(points[i].x), view.ty(points[i].y));
    if (close) ctx.closePath();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.setLineDash([]);
    ctx.stroke();
  }

  function drawGuides(view, scene, color, width) {
    const ctx = view.ctx;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash([6, 4]);
    function seg(s) {
      ctx.beginPath();
      ctx.moveTo(view.tx(s[0].x), view.ty(s[0].y));
      ctx.lineTo(view.tx(s[1].x), view.ty(s[1].y));
      ctx.stroke();
    }
    if (scene.guides.horizontal) seg(scene.guides.hSeg);
    if (scene.guides.vertical) seg(scene.guides.vSeg);
    ctx.setLineDash([]);
  }

  // ------------------------------------------------------------ Vista diseño
  function renderCanvas(canvas, geometry) {
    if (!canvas || !canvas.getContext) return;
    const scene = buildScene(geometry);
    const view = setupView(canvas, scene.bbox);
    const ctx = view.ctx;
    const col = view.col;

    strokePolyline(view, scene.piece, col.piece, 2, true);
    scene.cavities.forEach(function (cavity) { strokePolyline(view, cavity, col.accent, 2, true); });
    drawGuides(view, scene, col.guide, 1);

    // Origen / centro
    ctx.fillStyle = col.accent;
    ctx.beginPath();
    ctx.arc(view.tx(0), view.ty(0), 3, 0, Math.PI * 2);
    ctx.fill();

    // ------------------------------------------------------------- Cotas
    const colDim = col.faint;
    function fmt(value) { return (Math.round(value * 100) / 100) + " mm"; }
    function fmtNum(value) { return String(Math.round(value * 100) / 100); }

    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    const bb = scene.bbox;

    // Cota de ancho (arriba)
    const topY = view.ty(bb.maxY) - 14;
    ctx.strokeStyle = colDim;
    ctx.fillStyle = colDim;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(view.tx(bb.minX), topY);
    ctx.lineTo(view.tx(bb.maxX), topY);
    ctx.moveTo(view.tx(bb.minX), topY - 4); ctx.lineTo(view.tx(bb.minX), topY + 4);
    ctx.moveTo(view.tx(bb.maxX), topY - 4); ctx.lineTo(view.tx(bb.maxX), topY + 4);
    ctx.stroke();
    ctx.fillStyle = col.text;
    ctx.fillText(fmt(bb.maxX - bb.minX), view.cx, topY - 5);

    // Cota de alto (izquierda)
    const leftX = view.tx(bb.minX) - 14;
    ctx.strokeStyle = colDim;
    ctx.fillStyle = colDim;
    ctx.beginPath();
    ctx.moveTo(leftX, view.ty(bb.minY));
    ctx.lineTo(leftX, view.ty(bb.maxY));
    ctx.moveTo(leftX - 4, view.ty(bb.minY)); ctx.lineTo(leftX + 4, view.ty(bb.minY));
    ctx.moveTo(leftX - 4, view.ty(bb.maxY)); ctx.lineTo(leftX + 4, view.ty(bb.maxY));
    ctx.stroke();
    ctx.save();
    ctx.translate(leftX - 5, view.cy);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = col.text;
    ctx.fillText(fmt(bb.maxY - bb.minY), 0, 0);
    ctx.restore();

    // Cota de cada cavidad
    ctx.textBaseline = "middle";
    scene.cavities.forEach(function (cavity) {
      if (!cavity.length) return;
      const cbb = geom.boundingBox(cavity);
      const ccx = (cbb.minX + cbb.maxX) / 2;
      const ccy = (cbb.minY + cbb.maxY) / 2;
      const label = fmtNum(cbb.maxX - cbb.minX) + " × " + fmtNum(cbb.maxY - cbb.minY) + " mm";
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = col.bg;
      ctx.fillRect(view.tx(ccx) - tw / 2 - 5, view.ty(ccy) - 9, tw + 10, 18);
      ctx.fillStyle = col.accent;
      ctx.fillText(label, view.tx(ccx), view.ty(ccy));
    });
    ctx.textBaseline = "alphabetic";
  }

  // ------------------------------------------------ Vista de recorrido (G-code)
  // Dibuja el recorrido real de un archivo (contorno, cavidad o guías) con la
  // pieza como referencia, el punto de inicio y una flecha de sentido, para
  // confirmar que el sentido del corte se conserva al rotar.
  function renderToolpaths(canvas, geometry, paths, colorKey) {
    if (!canvas || !canvas.getContext) return;
    const scene = buildScene(geometry);

    // Encuadre que abarca la pieza y todos los recorridos (pueden salir por
    // fuera de la pieza debido al offset y la holgura).
    let all = scene.piece.slice();
    paths.forEach(function (p) { all = all.concat(p); });
    const extent = geom.boundingBox(all.length ? all : scene.piece);
    const view = setupView(canvas, extent);
    const ctx = view.ctx;
    const col = view.col;

    const pathColor = colorKey === "guides" ? col.guide : (colorKey === "cavity" ? col.success : col.accent);

    // Pieza y guías como referencia tenue.
    ctx.globalAlpha = 0.35;
    strokePolyline(view, scene.piece, col.piece, 1.5, true);
    drawGuides(view, scene, col.faint, 1);
    ctx.globalAlpha = 1;

    // Origen
    ctx.fillStyle = col.faint;
    ctx.beginPath();
    ctx.arc(view.tx(0), view.ty(0), 2.5, 0, Math.PI * 2);
    ctx.fill();

    paths.forEach(function (points) {
      if (!points.length) return;
      const closed = points.length > 2;
      strokePolyline(view, points, pathColor, 2, closed);

      // Punto de inicio
      ctx.fillStyle = col.success;
      ctx.beginPath();
      ctx.arc(view.tx(points[0].x), view.ty(points[0].y), 4, 0, Math.PI * 2);
      ctx.fill();

      // Flecha de sentido: del punto de inicio al siguiente distinto.
      let next = null;
      for (let i = 1; i < points.length; i++) {
        if (points[i].x !== points[0].x || points[i].y !== points[0].y) { next = points[i]; break; }
      }
      if (next) drawArrow(view, points[0], next, pathColor);
    });
  }

  function drawArrow(view, from, to, color) {
    const ctx = view.ctx;
    const x0 = view.tx(from.x);
    const y0 = view.ty(from.y);
    const x1 = view.tx(to.x);
    const y1 = view.ty(to.y);
    const angle = Math.atan2(y1 - y0, x1 - x0);
    // Punta a corta distancia del inicio, para ver la dirección de avance.
    const dist = 22;
    const hx = x0 + Math.cos(angle) * dist;
    const hy = y0 + Math.sin(angle) * dist;
    const size = 7;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx - Math.cos(angle - 0.4) * size, hy - Math.sin(angle - 0.4) * size);
    ctx.lineTo(hx - Math.cos(angle + 0.4) * size, hy - Math.sin(angle + 0.4) * size);
    ctx.closePath();
    ctx.fill();
  }

  // -------------------------------------------------------------------- SVG
  function buildSvg(geometry) {
    const scene = buildScene(geometry);
    const w = Math.max(1, scene.dims.width);
    const h = Math.max(1, scene.dims.height);
    const pad = Math.max(10, Math.min(w, h) * 0.15);
    const vbW = w + pad * 2;
    const vbH = h + pad * 2;

    function pathData(points) {
      if (!points.length) return "";
      return points.map(function (point, index) {
        return (index === 0 ? "M" : "L") + point.x.toFixed(3) + " " + point.y.toFixed(3);
      }).join(" ") + " Z";
    }

    const hSeg = scene.guides.hSeg;
    const vSeg = scene.guides.vSeg;
    const parts = [];

    parts.push("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
    parts.push("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"" + vbW + "mm\" height=\"" + vbH + "mm\" viewBox=\"" + (-vbW / 2) + " " + (-vbH / 2) + " " + vbW + " " + vbH + "\">");
    // Y positiva hacia arriba: se invierte el eje Y para todo el dibujo.
    parts.push("<g transform=\"scale(1,-1)\" fill=\"none\" stroke-width=\"0.6\">");
    parts.push("<rect x=\"" + (-vbW / 2) + "\" y=\"" + (-vbH / 2) + "\" width=\"" + vbW + "\" height=\"" + vbH + "\" fill=\"#ffffff\" stroke=\"none\"/>");

    if (scene.piece.length) parts.push("<path d=\"" + pathData(scene.piece) + "\" stroke=\"#1f2933\"/>");
    scene.cavities.forEach(function (cavity) {
      if (cavity.length) parts.push("<path d=\"" + pathData(cavity) + "\" stroke=\"#2563eb\"/>");
    });

    if (scene.guides.horizontal) parts.push("<line x1=\"" + hSeg[0].x + "\" y1=\"" + hSeg[0].y + "\" x2=\"" + hSeg[1].x + "\" y2=\"" + hSeg[1].y + "\" stroke=\"#e0a23a\" stroke-dasharray=\"3 2\"/>");
    if (scene.guides.vertical) parts.push("<line x1=\"" + vSeg[0].x + "\" y1=\"" + vSeg[0].y + "\" x2=\"" + vSeg[1].x + "\" y2=\"" + vSeg[1].y + "\" stroke=\"#e0a23a\" stroke-dasharray=\"3 2\"/>");

    // Cruz de centro / origen
    parts.push("<circle cx=\"0\" cy=\"0\" r=\"1.2\" fill=\"#2563eb\" stroke=\"none\"/>");
    parts.push("</g>");

    // Texto (fuera del grupo invertido para que no quede espejado).
    parts.push("<text x=\"0\" y=\"" + (-h / 2 - pad / 3) + "\" font-family=\"sans-serif\" font-size=\"" + (Math.min(w, h) * 0.05) + "\" fill=\"#1f2933\" text-anchor=\"middle\">" + scene.dims.width + " mm</text>");
    parts.push("<text x=\"" + (-w / 2 - pad / 3) + "\" y=\"0\" font-family=\"sans-serif\" font-size=\"" + (Math.min(w, h) * 0.05) + "\" fill=\"#1f2933\" text-anchor=\"middle\" transform=\"rotate(-90 " + (-w / 2 - pad / 3) + " 0)\">" + scene.dims.height + " mm</text>");

    // Cota de cada cavidad (texto en su centro; se niega la Y por el flip).
    scene.cavities.forEach(function (cavity) {
      if (!cavity.length) return;
      const cbb = geom.boundingBox(cavity);
      const ccx = (cbb.minX + cbb.maxX) / 2;
      const ccy = (cbb.minY + cbb.maxY) / 2;
      const cavLabel = (Math.round((cbb.maxX - cbb.minX) * 100) / 100) + " × " + (Math.round((cbb.maxY - cbb.minY) * 100) / 100) + " mm";
      parts.push("<text x=\"" + ccx + "\" y=\"" + (-ccy) + "\" font-family=\"sans-serif\" font-size=\"" + (Math.min(w, h) * 0.045) + "\" fill=\"#2563eb\" text-anchor=\"middle\" dominant-baseline=\"middle\">" + cavLabel + "</text>");
    });

    parts.push("</svg>");
    return parts.join("\n");
  }

  window.BujiaTemplatePreview = {
    buildScene: buildScene,
    renderCanvas: renderCanvas,
    renderToolpaths: renderToolpaths,
    buildSvg: buildSvg,
  };
}());
