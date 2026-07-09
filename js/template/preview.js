(function () {
  const geom = window.BujiaTemplateGeometry;

  // Construye la escena 2D (en mm) a partir de la geometría. Es la única
  // fuente de verdad para el Canvas y para el SVG.
  function buildScene(geometry) {
    const piece = geom.roundedRectPath(geometry.piece, { cornerSegments: 16 });
    const cavity = geom.roundedRectPath(geometry.cavity, { cornerSegments: 16 });
    const halfW = geometry.piece.width / 2;
    const halfH = geometry.piece.height / 2;

    return {
      piece: piece,
      cavity: cavity,
      guides: {
        horizontal: geometry.guides.horizontal !== false,
        vertical: geometry.guides.vertical !== false,
        halfW: halfW,
        halfH: halfH,
      },
      bbox: geom.boundingBox(piece.length ? piece : [{ x: -halfW, y: -halfH }, { x: halfW, y: halfH }]),
      dims: { width: geometry.piece.width, height: geometry.piece.height },
    };
  }

  // ------------------------------------------------------------------ Canvas
  function renderCanvas(canvas, geometry) {
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    const scene = buildScene(geometry);

    const cssWidth = canvas.clientWidth || 640;
    const cssHeight = canvas.clientHeight || 420;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(cssWidth * ratio);
    canvas.height = Math.round(cssHeight * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const styles = getComputedStyle(document.documentElement);
    const colBg = styles.getPropertyValue("--color-app").trim() || "#0e1116";
    const colPiece = styles.getPropertyValue("--color-border-strong").trim() || "#38434f";
    const colCavity = styles.getPropertyValue("--color-accent").trim() || "#4a9eff";
    const colGuide = styles.getPropertyValue("--color-warning").trim() || "#e0a23a";
    const colText = styles.getPropertyValue("--color-muted").trim() || "#8b98a6";

    ctx.fillStyle = colBg;
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    const pad = 40;
    const w = Math.max(1, scene.dims.width);
    const h = Math.max(1, scene.dims.height);
    const scale = Math.min((cssWidth - pad * 2) / w, (cssHeight - pad * 2) / h);
    const cx = cssWidth / 2;
    const cy = cssHeight / 2;

    // Transforma un punto en mm (origen centro, Y arriba) a pixeles de canvas.
    function tx(x) { return cx + x * scale; }
    function ty(y) { return cy - y * scale; }

    function strokePath(points, color, lineWidth) {
      if (!points.length) return;
      ctx.beginPath();
      ctx.moveTo(tx(points[0].x), ty(points[0].y));
      for (let i = 1; i < points.length; i++) ctx.lineTo(tx(points[i].x), ty(points[i].y));
      ctx.closePath();
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = color;
      ctx.stroke();
    }

    strokePath(scene.piece, colPiece, 2);
    strokePath(scene.cavity, colCavity, 2);

    // Guías de centro
    ctx.strokeStyle = colGuide;
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    if (scene.guides.horizontal) {
      ctx.beginPath();
      ctx.moveTo(tx(-scene.guides.halfW), ty(0));
      ctx.lineTo(tx(scene.guides.halfW), ty(0));
      ctx.stroke();
    }
    if (scene.guides.vertical) {
      ctx.beginPath();
      ctx.moveTo(tx(0), ty(-scene.guides.halfH));
      ctx.lineTo(tx(0), ty(scene.guides.halfH));
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Origen / centro
    ctx.fillStyle = colCavity;
    ctx.beginPath();
    ctx.arc(tx(0), ty(0), 3, 0, Math.PI * 2);
    ctx.fill();

    // Cotas
    ctx.fillStyle = colText;
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(scene.dims.width + " mm", cx, ty(scene.guides.halfH) - 10);
    ctx.save();
    ctx.translate(tx(-scene.guides.halfW) - 12, cy);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(scene.dims.height + " mm", 0, 0);
    ctx.restore();
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

    const halfW = scene.guides.halfW;
    const halfH = scene.guides.halfH;
    const parts = [];

    parts.push("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
    parts.push("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"" + vbW + "mm\" height=\"" + vbH + "mm\" viewBox=\"" + (-vbW / 2) + " " + (-vbH / 2) + " " + vbW + " " + vbH + "\">");
    // Y positiva hacia arriba: se invierte el eje Y para todo el dibujo.
    parts.push("<g transform=\"scale(1,-1)\" fill=\"none\" stroke-width=\"0.6\">");
    parts.push("<rect x=\"" + (-vbW / 2) + "\" y=\"" + (-vbH / 2) + "\" width=\"" + vbW + "\" height=\"" + vbH + "\" fill=\"#ffffff\" stroke=\"none\"/>");

    if (scene.piece.length) parts.push("<path d=\"" + pathData(scene.piece) + "\" stroke=\"#1f2933\"/>");
    if (scene.cavity.length) parts.push("<path d=\"" + pathData(scene.cavity) + "\" stroke=\"#2563eb\"/>");

    if (scene.guides.horizontal) parts.push("<line x1=\"" + (-halfW) + "\" y1=\"0\" x2=\"" + halfW + "\" y2=\"0\" stroke=\"#e0a23a\" stroke-dasharray=\"3 2\"/>");
    if (scene.guides.vertical) parts.push("<line x1=\"0\" y1=\"" + (-halfH) + "\" x2=\"0\" y2=\"" + halfH + "\" stroke=\"#e0a23a\" stroke-dasharray=\"3 2\"/>");

    // Cruz de centro / origen
    parts.push("<circle cx=\"0\" cy=\"0\" r=\"1.2\" fill=\"#2563eb\" stroke=\"none\"/>");
    parts.push("</g>");

    // Texto (fuera del grupo invertido para que no quede espejado).
    parts.push("<text x=\"0\" y=\"" + (-h / 2 - pad / 3) + "\" font-family=\"sans-serif\" font-size=\"" + (Math.min(w, h) * 0.05) + "\" fill=\"#1f2933\" text-anchor=\"middle\">" + scene.dims.width + " mm</text>");
    parts.push("<text x=\"" + (-w / 2 - pad / 3) + "\" y=\"0\" font-family=\"sans-serif\" font-size=\"" + (Math.min(w, h) * 0.05) + "\" fill=\"#1f2933\" text-anchor=\"middle\" transform=\"rotate(-90 " + (-w / 2 - pad / 3) + " 0)\">" + scene.dims.height + " mm</text>");

    parts.push("</svg>");
    return parts.join("\n");
  }

  window.BujiaTemplatePreview = {
    buildScene: buildScene,
    renderCanvas: renderCanvas,
    buildSvg: buildSvg,
  };
}());
