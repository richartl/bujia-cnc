(function () {
  let adaptiveController = null;
  const MODE_STORAGE_KEY = "bujia.surfacing.passMode.v1";

  function byId(id) {
    return document.getElementById(id);
  }

  function num(id) {
    return Number(byId(id).value);
  }

  function setStatus(message) {
    const el = byId("surfacingStatus");
    if (el) el.textContent = message || "";
  }

  function clean(value) {
    return window.BujiaSurfacingGcode.clean(value);
  }

  function renderSummary() {
    const el = byId("paramSummary");
    if (!el) return;

    const p = getParameters();
    const passes = isAdaptiveMode() && adaptiveController
      ? adaptiveController.readRows().length
      : Math.max(1, Math.floor(p.zPasses));

    const rows = [
      ["Área X × Y", clean(p.distX) + " × " + clean(p.distY) + " mm"],
      ["Pasadas Z", String(passes)],
      ["Profundidad total", "Z-" + clean(p.totalZ) + " mm"],
      ["Feed XY", "F" + clean(p.feedRate)],
      ["Plunge Z", "F" + clean(p.plungeRate)],
      ["Stepover", clean(p.stepX) + " mm"],
      ["Spindle", "S" + clean(p.spindle)],
      ["Safe Z", clean(p.safeZ) + " mm"],
    ];

    el.innerHTML = rows.map(function (row) {
      return "<div class=\"row\"><dt>" + row[0] + "</dt><dd>" + row[1] + "</dd></div>";
    }).join("");
  }

  function updateModeChip() {
    const chip = byId("modeChip");
    if (chip) chip.innerHTML = "<strong>Modo:</strong>&nbsp;" + (isAdaptiveMode() ? "Adaptive Passes" : "Manual");
  }

  function getParameters() {
    return {
      distX: num("distX"),
      distY: num("distY"),
      zPasses: num("zPasses"),
      totalZ: num("totalZ"),
      feedRate: num("feedRate"),
      plungeRate: num("plungeRate"),
      stepX: num("stepX"),
      toolDia: num("toolDia"),
      spindle: num("spindle"),
      safeZ: num("safeZ"),
      startDirection: byId("startDirection").value,
    };
  }

  function updateSuggestion() {
    const dia = num("toolDia");
    const el = byId("stepSuggestion");
    if (!dia || dia <= 0) {
      el.textContent = "";
      return;
    }

    const low = dia * 0.30;
    const mid = dia * 0.40;
    const high = dia * 0.50;
    el.innerHTML = "Sugerencia: " + window.BujiaSurfacingGcode.clean(low) + " a " + window.BujiaSurfacingGcode.clean(high) + " mm. Conservador: " + window.BujiaSurfacingGcode.clean(mid) + " mm.";
  }

  function getSelectedStrategy() {
    return byId("strategy").value;
  }

  function getPassMode() {
    return byId("passMode").value;
  }

  function isAdaptiveMode() {
    return getPassMode() === "adaptive";
  }

  function renderStrategyStatus() {
    const strategy = getSelectedStrategy();
    const status = byId("strategyStatus");

    if (strategy === "zigzag") {
      status.textContent = "Zig Zag activo.";
      return true;
    }

    status.textContent = "Próximamente";
    return false;
  }

  function generateGcode() {
    renderSummary();

    if (!renderStrategyStatus()) {
      byId("output").value = "Próximamente";
      setStatus("Estrategia no disponible todavía.");
      return;
    }

    if (isAdaptiveMode()) {
      if (!adaptiveController.isValid()) {
        byId("output").value = "Adaptive Passes no coincide con la profundidad objetivo. Corrige la tabla antes de generar G-code.";
        setStatus("Corrige la tabla Adaptive antes de generar.");
        return;
      }

      byId("output").value = window.BujiaSurfacingGcode.generateSurfacingAdaptiveGcode(getParameters(), adaptiveController.readRows());
      setStatus("G-code generado (Adaptive).");
      return;
    }

    byId("output").value = window.BujiaSurfacingGcode.generateSurfacingGcode(getParameters());
    setStatus("G-code generado (Manual).");
  }

  function downloadGcode() {
    if (isAdaptiveMode() && !adaptiveController.isValid()) {
      byId("output").value = "Adaptive Passes no coincide con la profundidad objetivo. No se permite descargar.";
      return;
    }

    if (!byId("output").value.trim()) generateGcode();
    if (byId("output").value.trim() === "Próximamente") return;

    let fileName = byId("fileName").value.trim() || "surfacing.nc";
    if (!fileName.match(/\.(nc|gcode|tap)$/i)) fileName += ".nc";

    const blob = new Blob([byId("output").value], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus("Archivo preparado: " + fileName);
  }

  function copyGcode() {
    if (!byId("output").value.trim()) generateGcode();
    navigator.clipboard.writeText(byId("output").value)
      .then(function () { setStatus("G-code copiado al portapapeles."); })
      .catch(function () { setStatus("No se pudo copiar automáticamente."); });
  }

  function updateModeVisibility() {
    byId("adaptivePanel").hidden = !isAdaptiveMode();
    updateModeChip();
    window.BujiaStorage.saveJson(MODE_STORAGE_KEY, { mode: getPassMode() });
    generateGcode();
  }

  function restoreMode() {
    const savedMode = window.BujiaStorage.loadJson(MODE_STORAGE_KEY, { mode: "manual" });
    if (savedMode.mode === "adaptive" || savedMode.mode === "manual") byId("passMode").value = savedMode.mode;
  }

  function bindEvents() {
    byId("generateButton").addEventListener("click", generateGcode);
    byId("downloadButton").addEventListener("click", downloadGcode);
    byId("copyButton").addEventListener("click", copyGcode);
    byId("toolDia").addEventListener("input", updateSuggestion);
    byId("toolDia").addEventListener("change", updateSuggestion);
    byId("passMode").addEventListener("change", updateModeVisibility);
    byId("strategy").addEventListener("change", function () {
      renderStrategyStatus();
      if (getSelectedStrategy() !== "zigzag") byId("output").value = "Próximamente";
    });

    const form = document.querySelector(".tool-form");
    if (form) form.addEventListener("input", renderSummary);
  }

  function initSurfacingUi() {
    adaptiveController = window.BujiaAdaptivePasses.createAdaptivePassesController({
      storageKey: "bujia.surfacing.adaptive.v1",
      containerId: "adaptivePassesContainer",
      finalDepthInputId: "totalZ",
      passCountInputId: "zPasses",
      defaultFeedInputId: "feedRate",
      defaultRpmInputId: "spindle",
    });
    adaptiveController.init();
    restoreMode();
    bindEvents();
    updateSuggestion();
    renderStrategyStatus();
    updateModeChip();
    renderSummary();
    updateModeVisibility();
  }

  window.BujiaSurfacingUi = {
    getParameters: getParameters,
    generateGcode: generateGcode,
    downloadGcode: downloadGcode,
    copyGcode: copyGcode,
    initSurfacingUi: initSurfacingUi,
  };

  document.addEventListener("DOMContentLoaded", initSurfacingUi);
}());
