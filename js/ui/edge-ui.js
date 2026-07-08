(function () {
  let adaptiveController = null;
  const STORAGE_KEY = "bujia.edge.form.v1";

  function byId(id) {
    return document.getElementById(id);
  }

  function getParameters() {
    return {
      passMode: getPassMode(),
      length: window.BujiaCommon.numberValue("length"),
      finalDepth: window.BujiaCommon.numberValue("finalDepth"),
      depthPerPass: window.BujiaCommon.numberValue("depthPerPass"),
      feed: window.BujiaCommon.numberValue("feed"),
      plunge: window.BujiaCommon.numberValue("plunge"),
      rpm: window.BujiaCommon.numberValue("rpm"),
      safeZ: window.BujiaCommon.numberValue("safeZ"),
      returnFeed: window.BujiaCommon.numberValue("returnFeed"),
      tool: window.BujiaCommon.textValue("tool"),
      axis: window.BujiaCommon.textValue("axis"),
      cutDirection: window.BujiaCommon.textValue("cutDirection"),
    };
  }

  function getPassMode() {
    return byId("passMode").value;
  }

  function isAdaptiveMode() {
    return getPassMode() === "adaptive";
  }

  function saveCurrentValues() {
    window.BujiaStorage.saveJson(STORAGE_KEY, getParameters());
  }

  function restoreValues() {
    const savedValues = window.BujiaStorage.loadJson(STORAGE_KEY, null);
    if (savedValues) window.BujiaCommon.setValues(savedValues);
  }

  function renderStatus(message) {
    window.BujiaCommon.setText("edgeStatus", message);
  }

  function generateGcode() {
    let gcode;

    if (isAdaptiveMode()) {
      if (!adaptiveController.isValid()) {
        byId("output").value = "Adaptive Passes no coincide con la profundidad objetivo. Corrige la tabla antes de generar G-code.";
        renderStatus("Adaptive Passes no válido.");
        return;
      }

      gcode = window.BujiaEdgeGcode.generateEdgeAdaptiveGcode(getParameters(), adaptiveController.readRows());
    } else {
      gcode = window.BujiaEdgeGcode.generateEdgeGcode(getParameters());
    }

    byId("output").value = gcode;
    saveCurrentValues();
    renderStatus("G-code generado.");
  }

  function downloadGcode() {
    if (isAdaptiveMode() && !adaptiveController.isValid()) {
      byId("output").value = "Adaptive Passes no coincide con la profundidad objetivo. No se permite descargar.";
      renderStatus("Corrige Adaptive Passes antes de descargar.");
      return;
    }

    if (!byId("output").value.trim()) generateGcode();

    const fileName = window.BujiaDownload.ensureFileExtension(
      byId("fileName").value,
      "edge.nc",
      ["nc", "gcode", "tap"],
      "nc"
    );

    window.BujiaDownload.downloadText(byId("output").value, fileName);
    renderStatus("Archivo preparado para descarga.");
  }

  function copyGcode() {
    if (!byId("output").value.trim()) generateGcode();

    navigator.clipboard.writeText(byId("output").value)
      .then(function () { renderStatus("G-code copiado."); })
      .catch(function () { renderStatus("No se pudo copiar automáticamente."); });
  }

  function updateModeVisibility() {
    const isAdaptive = isAdaptiveMode();
    byId("adaptivePanel").hidden = !isAdaptive;
    byId("adaptivePassCountField").hidden = !isAdaptive;
    generateGcode();
  }

  function bindEvents() {
    byId("generateButton").addEventListener("click", generateGcode);
    byId("downloadButton").addEventListener("click", downloadGcode);
    byId("copyButton").addEventListener("click", copyGcode);
    byId("passMode").addEventListener("change", updateModeVisibility);
  }

  function initEdgeUi() {
    restoreValues();
    adaptiveController = window.BujiaAdaptivePasses.createAdaptivePassesController({
      storageKey: "bujia.edge.adaptive.v1",
      containerId: "adaptivePassesContainer",
      finalDepthInputId: "finalDepth",
      passCountInputId: "adaptivePassCount",
      defaultFeedInputId: "feed",
      defaultRpmInputId: "rpm",
    });
    adaptiveController.init();
    bindEvents();
    updateModeVisibility();
  }

  window.BujiaEdgeUi = {
    getParameters: getParameters,
    generateGcode: generateGcode,
    downloadGcode: downloadGcode,
    copyGcode: copyGcode,
    initEdgeUi: initEdgeUi,
  };

  document.addEventListener("DOMContentLoaded", initEdgeUi);
}());
