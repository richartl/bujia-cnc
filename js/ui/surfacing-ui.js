(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function num(id) {
    return Number(byId(id).value);
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
    if (!renderStrategyStatus()) {
      byId("output").value = "Próximamente";
      return;
    }

    byId("output").value = window.BujiaSurfacingGcode.generateSurfacingGcode(getParameters());
  }

  function downloadGcode() {
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
  }

  function copyGcode() {
    if (!byId("output").value.trim()) generateGcode();
    navigator.clipboard.writeText(byId("output").value)
      .then(function () { alert("G-code copiado."); })
      .catch(function () { alert("No se pudo copiar automáticamente."); });
  }

  function bindEvents() {
    byId("generateButton").addEventListener("click", generateGcode);
    byId("downloadButton").addEventListener("click", downloadGcode);
    byId("copyButton").addEventListener("click", copyGcode);
    byId("toolDia").addEventListener("input", updateSuggestion);
    byId("toolDia").addEventListener("change", updateSuggestion);
    byId("strategy").addEventListener("change", function () {
      renderStrategyStatus();
      if (getSelectedStrategy() !== "zigzag") byId("output").value = "Próximamente";
    });
  }

  function initSurfacingUi() {
    bindEvents();
    updateSuggestion();
    renderStrategyStatus();
    generateGcode();
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
