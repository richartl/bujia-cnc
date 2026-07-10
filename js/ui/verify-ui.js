(function () {
  const TOOL_DIAMETER_KEY = "bujia.verify.toolDiameterRef.v1";

  let analysis = null;
  let sourceFileName = "";
  let rewriteResult = null;

  function byId(id) { return document.getElementById(id); }
  function num(id) { const el = byId(id); return el ? Number(el.value) : NaN; }

  function setStatus(message) {
    const el = byId("verifyStatus");
    if (el) el.textContent = message || "";
  }

  function fmt(n) {
    return window.BujiaGcodeVerify.formatNumber(n);
  }

  // ---------------------------------------------------------- Carga de archivo
  function readFile(file) {
    const reader = new FileReader();
    reader.onload = function () {
      byId("pasteArea").value = String(reader.result || "");
      sourceFileName = file.name;
      runAnalysis();
    };
    reader.onerror = function () {
      setStatus("No se pudo leer el archivo.");
    };
    reader.readAsText(file);
  }

  function bindDropZone() {
    const zone = byId("dropZoneInner");
    const input = byId("fileInput");

    input.addEventListener("change", function () {
      if (input.files && input.files[0]) readFile(input.files[0]);
    });

    ["dragenter", "dragover"].forEach(function (evt) {
      zone.addEventListener(evt, function (e) {
        e.preventDefault();
        zone.classList.add("is-dragover");
      });
    });
    ["dragleave", "drop"].forEach(function (evt) {
      zone.addEventListener(evt, function (e) {
        e.preventDefault();
        zone.classList.remove("is-dragover");
      });
    });
    zone.addEventListener("drop", function (e) {
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) readFile(file);
    });
  }

  // -------------------------------------------------------------- Renderizado
  function renderFileChip() {
    const chip = byId("fileChip");
    if (!analysis) { chip.hidden = true; return; }
    chip.hidden = false;
    chip.innerHTML = "<strong>Archivo:</strong>&nbsp;" + (sourceFileName || "pegado manualmente") + " · " + analysis.rawLines.length + " líneas";
  }

  function renderWarnings() {
    const card = byId("warningsCard");
    const list = byId("warningsList");
    if (!analysis.warnings.length) { card.hidden = true; return; }
    card.hidden = false;
    list.innerHTML = analysis.warnings.map(function (w) { return "<li>" + w + "</li>"; }).join("");
  }

  function statusBadge(ok, textOk, textWarn) {
    return "<span class=\"badge " + (ok ? "badge--ok" : "badge--warn") + "\">" + (ok ? textOk : textWarn) + "</span>";
  }

  function renderSummary() {
    const rows = [
      ["Unidades", analysis.units === "in" ? "Pulgadas" : analysis.units === "mm" ? "Milímetros" : "No detectadas (se asume mm)"],
      ["Modo", analysis.motionMode === "incremental" ? "Incremental (G91)" : "Absoluto (G90)"],
      ["Spindle", statusBadge(analysis.spindleOn, "Se enciende (M3/M4)", "Nunca se enciende")],
      ["Fin de programa", statusBadge(analysis.endsProperly, "M30/M2 presente", "No se encontró M30/M2")],
      ["Pasadas detectadas", String(analysis.passCount)],
      ["Patrón de pasada", statusBadge(analysis.passPattern.detected, "Repetible (se puede cambiar el n.° de pasadas)", "No repetible: " + (analysis.passPattern.reason || ""))],
    ];
    byId("summaryList").innerHTML = rows.map(function (row) {
      return "<div class=\"row\"><dt>" + row[0] + "</dt><dd>" + row[1] + "</dd></div>";
    }).join("");
  }

  function renderParamTable(containerId, list, unitLabel) {
    const container = byId(containerId);
    if (!list.length) {
      container.innerHTML = "<div class=\"param-table--empty\">No se detectaron valores.</div>";
      return;
    }
    container.innerHTML = list.map(function (item, index) {
      return [
        "<div class=\"param-row\">",
        "<span class=\"param-row__detected\">" + fmt(item.value) + " " + unitLabel + "</span>",
        "<span class=\"param-row__count\">" + item.count + (item.count === 1 ? " vez" : " veces") + "</span>",
        "<input type=\"number\" step=\"1\" data-param-index=\"" + index + "\" value=\"" + fmt(item.value) + "\">",
        "</div>",
      ].join("");
    }).join("");
  }

  function renderDepths() {
    const hint = byId("depthsHint");
    hint.textContent = analysis.depths.length
      ? "Pasadas detectadas, de la más superficial a la más profunda:"
      : "No se detectaron profundidades de corte.";

    byId("depthsTable").innerHTML = analysis.depths.map(function (d, index) {
      return [
        "<div class=\"param-row\" style=\"grid-template-columns: 1fr auto;\">",
        "<span class=\"param-row__detected\">Pasada " + (index + 1) + ": Z" + fmt(d.value) + " mm</span>",
        "<span class=\"param-row__count\">" + d.count + (d.count === 1 ? " movimiento" : " movimientos") + "</span>",
        "</div>",
      ].join("");
    }).join("");

    const passInput = byId("passCountNew");
    const passHint = byId("passCountHint");
    if (analysis.passPattern.detected) {
      passInput.disabled = false;
      passHint.textContent = "Reparte la profundidad final en partes iguales, repitiendo el mismo recorrido XY detectado.";
    } else {
      passInput.disabled = true;
      passInput.value = analysis.passCount || "";
      passHint.textContent = "Desactivado: " + (analysis.passPattern.reason || "no se detectó un recorrido repetible entre pasadas") + ". El feedrate, RPM, Z segura y la profundidad final sí se pueden ajustar.";
    }
  }

  function renderOriginal() {
    const text = analysis.rawLines.join("\n");
    byId("originalView").value = text;
    byId("originalLines").textContent = analysis.rawLines.length + " líneas";
  }

  // ------------------------------------------------------------- Edición
  function collectEdits() {
    const feedInputs = document.querySelectorAll("#feedsTable [data-param-index]");
    const rpmInputs = document.querySelectorAll("#rpmsTable [data-param-index]");

    const feeds = Array.prototype.map.call(feedInputs, function (input) {
      const index = Number(input.getAttribute("data-param-index"));
      return { oldValue: analysis.feeds[index].value, newValue: Number(input.value) };
    });
    const rpms = Array.prototype.map.call(rpmInputs, function (input) {
      const index = Number(input.getAttribute("data-param-index"));
      return { oldValue: analysis.rpms[index].value, newValue: Number(input.value) };
    });

    const safeZValue = num("safeZNew");
    const finalDepthValue = num("finalDepthNew");
    const passCountValue = byId("passCountNew").disabled ? null : num("passCountNew");

    return {
      feeds: feeds,
      rpms: rpms,
      safeZ: isNaN(safeZValue) ? null : safeZValue,
      finalDepth: isNaN(finalDepthValue) ? null : finalDepthValue,
      passCount: isNaN(passCountValue) || passCountValue === null ? null : passCountValue,
    };
  }

  function applyEdits() {
    if (!analysis) return;
    const edits = collectEdits();

    try {
      rewriteResult = window.BujiaGcodeVerify.rewrite(analysis, edits);
    } catch (error) {
      rewriteResult = null;
      byId("modifiedView").value = "";
      byId("modifiedLines").textContent = "";
      byId("changesList").innerHTML = "";
      byId("changesSummary").textContent = "Error";
      byId("downloadButton").disabled = true;
      setStatus(error.message);
      return;
    }

    byId("modifiedView").value = rewriteResult.text;
    const modifiedLineCount = rewriteResult.text.split("\n").length;
    byId("modifiedLines").textContent = modifiedLineCount + " líneas";
    byId("changesList").innerHTML = rewriteResult.changes.map(function (c) { return "<li>" + c + "</li>"; }).join("");
    byId("changesSummary").textContent = rewriteResult.changes.length
      ? rewriteResult.changes.length + " cambio" + (rewriteResult.changes.length === 1 ? "" : "s")
      : "Sin cambios";
    byId("downloadButton").disabled = false;
    setStatus(rewriteResult.changes.length ? "Listo para descargar." : "Sin cambios respecto al original.");
  }

  // -------------------------------------------------------------- Análisis
  function runAnalysis() {
    const text = byId("pasteArea").value;
    if (!text.trim()) {
      setStatus("Pega o sube un archivo .nc primero.");
      return;
    }

    analysis = window.BujiaGcodeVerify.analyze(text);
    rewriteResult = null;

    renderFileChip();
    renderWarnings();
    renderSummary();
    renderParamTable("feedsTable", analysis.feeds, "mm/min");
    renderParamTable("rpmsTable", analysis.rpms, "RPM");
    renderDepths();
    renderOriginal();

    byId("safeZDetected").value = analysis.safeZ !== null ? fmt(analysis.safeZ) + " mm" : "No detectada";
    byId("safeZNew").value = analysis.safeZ !== null ? fmt(analysis.safeZ) : "";
    byId("finalDepthNew").value = analysis.finalDepth !== null ? fmt(analysis.finalDepth) : "";
    byId("passCountNew").value = analysis.passCount || "";

    const baseName = (sourceFileName || "gcode").replace(/\.[^.]+$/, "");
    byId("outputFileName").value = baseName + "_editado.nc";

    byId("resultsSection").hidden = false;
    byId("modifiedView").value = "";
    byId("changesList").innerHTML = "";
    byId("downloadButton").disabled = true;

    applyEdits();
    setStatus("Archivo analizado. Ajusta los parámetros que necesites.");
  }

  function clearAll() {
    analysis = null;
    rewriteResult = null;
    sourceFileName = "";
    byId("pasteArea").value = "";
    byId("fileInput").value = "";
    byId("resultsSection").hidden = true;
    byId("fileChip").hidden = true;
    setStatus("");
  }

  // ---------------------------------------------------------------- Descarga
  function download() {
    if (!rewriteResult) return;
    const fileName = window.BujiaDownload.ensureFileExtension(
      byId("outputFileName").value,
      "editado.nc",
      ["nc", "gcode", "tap", "txt"],
      "nc"
    );
    window.BujiaDownload.downloadText(rewriteResult.text, fileName);
    setStatus("Archivo descargado: " + fileName);
  }

  // ------------------------------------------------------------ Colapsable
  function toggleView() {
    const body = byId("viewBody");
    const toggle = byId("viewToggle");
    const show = body.hidden;
    body.hidden = !show;
    toggle.setAttribute("aria-expanded", show ? "true" : "false");
  }

  // -------------------------------------------------------- Fresa de referencia
  function restoreToolDiameter() {
    const saved = window.BujiaStorage.loadJson(TOOL_DIAMETER_KEY, null);
    if (saved && saved.value) byId("toolDiameterRef").value = saved.value;
  }

  function saveToolDiameter() {
    window.BujiaStorage.saveJson(TOOL_DIAMETER_KEY, { value: byId("toolDiameterRef").value });
  }

  function bindEvents() {
    byId("analyzeButton").addEventListener("click", runAnalysis);
    byId("clearButton").addEventListener("click", clearAll);
    byId("downloadButton").addEventListener("click", download);
    byId("viewToggle").addEventListener("click", toggleView);
    byId("toolDiameterRef").addEventListener("input", saveToolDiameter);

    const resultsSection = byId("resultsSection");
    resultsSection.addEventListener("input", function (event) {
      if (event.target.id === "toolDiameterRef") return;
      applyEdits();
    });
  }

  function init() {
    bindDropZone();
    bindEvents();
    restoreToolDiameter();
  }

  window.BujiaVerifyUi = { init: init, runAnalysis: runAnalysis };

  document.addEventListener("DOMContentLoaded", init);
}());
