(function () {
  // Controlador genérico del constructor de plantillas. No conoce ninguna
  // plantilla en concreto: toma el descriptor indicado en body[data-template]
  // (defaults + buildGeometry) y usa geometría, preview y generadores
  // compartidos. Una plantilla futura reutiliza todo esto sin cambios.

  let descriptor = null;
  let contourController = null;
  let cavityController = null;
  let previewView = "design";

  function byId(id) { return document.getElementById(id); }
  function num(id) { const el = byId(id); return el ? Number(el.value) : 0; }
  function val(id) { const el = byId(id); return el ? el.value : ""; }
  function checked(id) { const el = byId(id); return el ? el.checked : false; }

  function setStatus(message) {
    const el = byId("templateStatus");
    if (el) el.textContent = message || "";
  }

  // ---------------------------------------------------------- Parámetros
  function geometryParams() {
    return {
      outerW: num("outerW"),
      outerH: num("outerH"),
      thickness: num("thickness"),
      margin: num("margin"),
      outerRadius: num("outerRadius"),
      cavW: num("cavW"),
      cavH: num("cavH"),
      cavRadius: num("cavRadius"),
      cavOffsetX: num("cavOffsetX"),
      cavOffsetY: num("cavOffsetY"),
      cavRotation: num("cavRotation"),
    };
  }

  function buildGeometry() {
    const geometry = descriptor.buildGeometry(geometryParams());
    // Rotación de TODA la plantilla (0/90/180/270) alrededor del centro.
    geometry.rotation = num("templateRotation") || 0;
    return geometry;
  }

  function contourParams() {
    return {
      mode: val("contourMode"),
      toolDiameter: num("contourTool"),
      clearance: num("contourClearance"),
      passes: num("contourPasses"),
      finalDepth: num("contourFinalDepth"),
      feed: num("contourFeed"),
      rpm: num("contourRpm"),
      plungeFeed: num("contourPlunge"),
      safeZ: num("contourSafeZ"),
      direction: val("contourDirection"),
    };
  }

  function cavityParams() {
    return {
      mode: val("cavityMode"),
      toolDiameter: num("cavityTool"),
      clearance: num("cavityClearance"),
      stepover: num("cavityStepover"),
      passes: num("cavityPasses"),
      finalDepth: num("cavityFinalDepth"),
      feed: num("cavityFeed"),
      rpm: num("cavityRpm"),
      plungeFeed: num("cavityPlunge"),
      safeZ: num("cavitySafeZ"),
      direction: val("cavityDirection"),
    };
  }

  function guidesParams() {
    return {
      toolDiameter: num("guidesTool"),
      feed: num("guidesFeed"),
      rpm: num("guidesRpm"),
      depth: num("guidesDepth"),
      safeZ: num("guidesSafeZ"),
      horizontal: checked("guidesHorizontal"),
      vertical: checked("guidesVertical"),
    };
  }

  // ---------------------------------------------------------- Generación
  function generateContour() {
    const params = contourParams();
    let rows = null;
    if (params.mode === "adaptive") {
      if (!contourController.isValid()) return null;
      rows = contourController.readRows();
    }
    return window.BujiaTemplateGcode.generateContourGcode(buildGeometry(), params, rows);
  }

  function generateCavity() {
    const params = cavityParams();
    let rows = null;
    if (params.mode === "adaptive") {
      if (!cavityController.isValid()) return null;
      rows = cavityController.readRows();
    }
    return window.BujiaTemplateGcode.generatePocketGcode(buildGeometry(), params, rows);
  }

  function generateGuides() {
    const geoParams = guidesParams();
    return window.BujiaTemplateGcode.generateGuidesGcode(buildGeometry(), geoParams);
  }

  function buildSvg() {
    return window.BujiaTemplatePreview.buildSvg(buildGeometry());
  }

  // ---------------------------------------------------------- Descargas
  function download(kind) {
    let content = null;
    let fileName = "";

    if (kind === "contour") {
      content = generateContour();
      fileName = "01_Contorno.nc";
      if (content === null) { setStatus("Contorno: corrige la tabla Adaptive antes de descargar."); return false; }
    } else if (kind === "cavity") {
      content = generateCavity();
      fileName = "02_Cavidad_" + (descriptor.title || "Plantilla") + ".nc";
      if (content === null) { setStatus("Cavidad: corrige la tabla Adaptive antes de descargar."); return false; }
    } else if (kind === "guides") {
      content = generateGuides();
      fileName = "03_Guias.nc";
    } else if (kind === "svg") {
      content = buildSvg();
      fileName = "preview.svg";
    }

    if (content === null) return false;
    window.BujiaDownload.downloadText(content, fileName);
    setStatus("Archivo preparado: " + fileName);
    return true;
  }

  function downloadAll() {
    const order = ["contour", "cavity", "guides", "svg"];
    let index = 0;
    // Descargas escalonadas para evitar que el navegador bloquee múltiples.
    function next() {
      if (index >= order.length) { setStatus("Generados 3 archivos .nc + preview.svg."); return; }
      const ok = download(order[index]);
      index++;
      if (ok) window.setTimeout(next, 350);
    }
    next();
  }

  // ---------------------------------------------------------- Preview
  function renderPreview() {
    const canvas = byId("previewCanvas");
    const geometry = buildGeometry();
    const preview = window.BujiaTemplatePreview;
    const gcode = window.BujiaTemplateGcode;

    if (previewView === "contour") {
      preview.renderToolpaths(canvas, geometry, [gcode.contourToolpath(geometry, contourParams())], "contour");
    } else if (previewView === "cavity") {
      preview.renderToolpaths(canvas, geometry, gcode.cavityToolpaths(geometry, cavityParams()), "cavity");
    } else if (previewView === "guides") {
      preview.renderToolpaths(canvas, geometry, gcode.guideToolpaths(geometry, guidesParams()), "guides");
    } else {
      preview.renderCanvas(canvas, geometry);
    }

    renderGcodePreviews();
  }

  function setPreviewView(view) {
    previewView = view;
    document.querySelectorAll("[data-preview-view]").forEach(function (button) {
      button.classList.toggle("is-active", button.getAttribute("data-preview-view") === view);
    });
    renderPreview();
  }

  // Sección colapsable con la previsualización de los tres G-code a la vez.
  function renderGcodePreviews() {
    const body = byId("gcodePreviewsBody");
    if (!body || body.hidden) return; // No dibujar mientras está oculta.

    const geometry = buildGeometry();
    const preview = window.BujiaTemplatePreview;
    const gcode = window.BujiaTemplateGcode;

    preview.renderToolpaths(byId("previewContour"), geometry, [gcode.contourToolpath(geometry, contourParams())], "contour");
    preview.renderToolpaths(byId("previewCavity"), geometry, gcode.cavityToolpaths(geometry, cavityParams()), "cavity");
    preview.renderToolpaths(byId("previewGuides"), geometry, gcode.guideToolpaths(geometry, guidesParams()), "guides");
  }

  function toggleGcodePreviews() {
    const body = byId("gcodePreviewsBody");
    const toggle = byId("gcodePreviewsToggle");
    const show = body.hidden;
    body.hidden = !show;
    if (toggle) toggle.setAttribute("aria-expanded", show ? "true" : "false");
    if (show) renderGcodePreviews();
  }

  // ------------------------------------------------------------ Modo
  function updateContourMode() {
    byId("contourAdaptivePanel").hidden = val("contourMode") !== "adaptive";
  }

  function updateCavityMode() {
    byId("cavityAdaptivePanel").hidden = val("cavityMode") !== "adaptive";
  }

  function fillDefaults() {
    const defaults = descriptor.defaults || {};
    Object.keys(defaults).forEach(function (key) {
      const el = byId(key);
      if (el && (el.value === "" || el.value === undefined)) el.value = defaults[key];
    });
  }

  function bindEvents() {
    const form = document.querySelector(".tool-form");
    if (form) form.addEventListener("input", renderPreview);

    byId("contourMode").addEventListener("change", updateContourMode);
    byId("cavityMode").addEventListener("change", updateCavityMode);

    byId("downloadContour").addEventListener("click", function () { download("contour"); });
    byId("downloadCavity").addEventListener("click", function () { download("cavity"); });
    byId("downloadGuides").addEventListener("click", function () { download("guides"); });
    byId("downloadSvg").addEventListener("click", function () { download("svg"); });
    byId("downloadAll").addEventListener("click", downloadAll);

    document.querySelectorAll("[data-preview-view]").forEach(function (button) {
      button.addEventListener("click", function () {
        setPreviewView(button.getAttribute("data-preview-view"));
      });
    });

    const previewsToggle = byId("gcodePreviewsToggle");
    if (previewsToggle) previewsToggle.addEventListener("click", toggleGcodePreviews);

    window.addEventListener("resize", renderPreview);
  }

  function init() {
    const templateId = document.body.getAttribute("data-template");
    descriptor = window.BujiaTemplates && window.BujiaTemplates[templateId];
    if (!descriptor) { setStatus("Plantilla no encontrada."); return; }

    fillDefaults();

    contourController = window.BujiaAdaptivePasses.createAdaptivePassesController({
      storageKey: "bujia.template." + templateId + ".contour.adaptive.v1",
      containerId: "contourAdaptiveContainer",
      finalDepthInputId: "contourFinalDepth",
      passCountInputId: "contourPasses",
      defaultFeedInputId: "contourFeed",
      defaultRpmInputId: "contourRpm",
    });
    contourController.init();

    cavityController = window.BujiaAdaptivePasses.createAdaptivePassesController({
      storageKey: "bujia.template." + templateId + ".cavity.adaptive.v1",
      containerId: "cavityAdaptiveContainer",
      finalDepthInputId: "cavityFinalDepth",
      passCountInputId: "cavityPasses",
      defaultFeedInputId: "cavityFeed",
      defaultRpmInputId: "cavityRpm",
    });
    cavityController.init();

    bindEvents();
    updateContourMode();
    updateCavityMode();
    renderPreview();
    setStatus("Ajusta las dimensiones y descarga los archivos.");
  }

  window.BujiaTemplateUi = {
    init: init,
    generateContour: generateContour,
    generateCavity: generateCavity,
    generateGuides: generateGuides,
    buildSvg: buildSvg,
  };

  document.addEventListener("DOMContentLoaded", init);
}());
