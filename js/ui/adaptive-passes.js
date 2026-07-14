(function () {
  const TOLERANCE = 0.0001;

  function toNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function formatNumber(value) {
    return Number(Number(value).toFixed(4)).toString();
  }

  function createRow(index, depth, feedrate, rpm, locked, comment) {
    return {
      passNumber: index + 1,
      feedrate: toNumber(feedrate),
      rpm: toNumber(rpm),
      depth: toNumber(depth),
      accumulatedDepth: 0,
      remainingDepth: 0,
      locked: Boolean(locked),
      comment: comment || "",
    };
  }

  function distributeDepth(totalDepth, count, feedrate, rpm) {
    const rows = [];
    if (count <= 0) return rows;

    const baseDepth = totalDepth / count;
    let usedDepth = 0;

    for (let index = 0; index < count; index++) {
      const isLast = index === count - 1;
      const depth = isLast ? totalDepth - usedDepth : baseDepth;
      usedDepth += depth;
      rows.push(createRow(index, depth, feedrate, rpm, false, ""));
    }

    return recalculateRows(rows, totalDepth);
  }

  function recalculateRows(rows, totalDepth) {
    let accumulatedDepth = 0;

    rows.forEach(function (row, index) {
      row.passNumber = index + 1;
      row.depth = toNumber(row.depth);
      row.feedrate = toNumber(row.feedrate);
      row.rpm = toNumber(row.rpm);
      accumulatedDepth += row.depth;
      row.accumulatedDepth = accumulatedDepth;
      row.remainingDepth = totalDepth - accumulatedDepth;
    });

    return rows;
  }

  function redistributeRows(rows, totalDepth) {
    const lockedRows = rows.filter(function (row) { return row.locked; });
    const unlockedRows = rows.filter(function (row) { return !row.locked; });
    const lockedDepth = lockedRows.reduce(function (sum, row) { return sum + toNumber(row.depth); }, 0);
    const remainingDepth = totalDepth - lockedDepth;

    if (!unlockedRows.length) return recalculateRows(rows, totalDepth);

    if (remainingDepth < 0) {
      unlockedRows.forEach(function (row) { row.depth = 0; });
      return recalculateRows(rows, totalDepth);
    }

    const baseDepth = remainingDepth / unlockedRows.length;
    let assignedDepth = 0;

    unlockedRows.forEach(function (row, index) {
      const isLast = index === unlockedRows.length - 1;
      row.depth = isLast ? remainingDepth - assignedDepth : baseDepth;
      assignedDepth += row.depth;
    });

    return recalculateRows(rows, totalDepth);
  }

  function getValidation(rows, totalDepth) {
    const calculatedDepth = rows.reduce(function (sum, row) { return sum + toNumber(row.depth); }, 0);
    const difference = totalDepth - calculatedDepth;
    const isValid = Math.abs(difference) <= TOLERANCE;
    let status = "✔ Correcto";

    if (!isValid && difference > 0) status = "⚠ Faltan " + formatNumber(difference) + " mm";
    if (!isValid && difference < 0) status = "⚠ Sobran " + formatNumber(Math.abs(difference)) + " mm";

    return {
      targetDepth: totalDepth,
      calculatedDepth: calculatedDepth,
      difference: difference,
      isValid: isValid,
      status: status,
    };
  }

  function createAdaptivePassesController(config) {
    let rows = [];
    const container = document.getElementById(config.containerId);

    function targetDepth() {
      return toNumber(document.getElementById(config.finalDepthInputId).value);
    }

    function passCount() {
      return Math.max(1, Math.floor(toNumber(document.getElementById(config.passCountInputId).value)));
    }

    function defaultFeedrate() {
      return toNumber(document.getElementById(config.defaultFeedInputId).value);
    }

    function defaultRpm() {
      return toNumber(document.getElementById(config.defaultRpmInputId).value);
    }

    function save() {
      window.BujiaStorage.saveJson(config.storageKey, {
        rows: rows,
        targetDepth: targetDepth(),
        passCount: passCount(),
      });
    }

    function load() {
      const saved = window.BujiaStorage.loadJson(config.storageKey, null);
      if (saved && Array.isArray(saved.rows) && saved.rows.length === passCount()) {
        rows = recalculateRows(saved.rows.map(function (row, index) {
          return createRow(index, row.depth, row.feedrate, row.rpm, row.locked, row.comment);
        }), targetDepth());
        return true;
      }
      return false;
    }

    function ensureRows() {
      if (!rows.length) rows = distributeDepth(targetDepth(), passCount(), defaultFeedrate(), defaultRpm());
    }

    // Reparte la profundidad objetivo por igual según el número de pasadas
    // del formulario, conservando feedrate, RPM y comentarios por índice.
    // Desbloquea todas las filas.
    function autoDistributeDepth() {
      const total = targetDepth();
      const count = passCount();
      const previous = rows;
      const feed = defaultFeedrate();
      const rpm = defaultRpm();
      const baseDepth = total / count;
      const built = [];
      let used = 0;

      for (let index = 0; index < count; index++) {
        const isLast = index === count - 1;
        const depth = isLast ? total - used : baseDepth;
        used += depth;
        const source = previous[index];
        built.push(createRow(
          index,
          depth,
          source ? source.feedrate : feed,
          source ? source.rpm : rpm,
          false,
          source ? source.comment : ""
        ));
      }

      rows = recalculateRows(built, total);
      save();
      render();
    }

    // Aplica el feedrate por defecto a todas las filas.
    function autoDistributeFeed() {
      ensureRows();
      const feed = defaultFeedrate();
      rows.forEach(function (row) { row.feedrate = feed; });
      save();
      render();
    }

    // Aplica las RPM por defecto a todas las filas.
    function autoDistributeRpm() {
      ensureRows();
      const rpm = defaultRpm();
      rows.forEach(function (row) { row.rpm = rpm; });
      save();
      render();
    }

    function redistribute() {
      ensureRows();
      rows = redistributeRows(rows, targetDepth());
      save();
      render();
    }

    function reset() {
      rows = distributeDepth(targetDepth(), passCount(), defaultFeedrate(), defaultRpm());
      save();
      render();
    }

    function readRows() {
      return rows.map(function (row) {
        return Object.assign({}, row);
      });
    }

    function validate() {
      return getValidation(rows, targetDepth());
    }

    function updateFromInput(index, field, value) {
      const row = rows[index];
      if (!row) return;

      if (field === "depth") {
        row.depth = toNumber(value);
        row.locked = true;
        redistributeRows(rows, targetDepth());
      }

      if (field === "feedrate") row.feedrate = toNumber(value);
      if (field === "rpm") row.rpm = toNumber(value);
      if (field === "locked") row.locked = Boolean(value);
      if (field === "comment") row.comment = value;

      save();
      render();
    }

    function renderValidation() {
      const validation = validate();
      const statusClass = validation.isValid ? "badge--ok" : "badge--warn";
      return [
        "<div class=\"adaptive-validation\">",
        "<div class=\"metric\"><span>Objetivo</span><strong>" + formatNumber(validation.targetDepth) + " mm</strong></div>",
        "<div class=\"metric\"><span>Calculado</span><strong>" + formatNumber(validation.calculatedDepth) + " mm</strong></div>",
        "<div class=\"metric\"><span>Diferencia</span><strong>" + formatNumber(validation.difference) + " mm</strong></div>",
        "<div class=\"metric metric--status\"><span>Estado</span><strong><span class=\"badge " + statusClass + "\">" + validation.status + "</span></strong></div>",
        "</div>",
      ].join("");
    }

    function stat(list, pick) {
      if (!list.length) return 0;
      return pick === "max" ? Math.max.apply(null, list) : Math.min.apply(null, list);
    }

    function renderStats() {
      const feeds = rows.map(function (row) { return toNumber(row.feedrate); });
      const rpms = rows.map(function (row) { return toNumber(row.rpm); });
      const depths = rows.map(function (row) { return toNumber(row.depth); });

      const tiles = [
        ["Pasadas", String(rows.length)],
        ["Feed máx", formatNumber(stat(feeds, "max"))],
        ["Feed mín", formatNumber(stat(feeds, "min"))],
        ["RPM máx", formatNumber(stat(rpms, "max"))],
        ["RPM mín", formatNumber(stat(rpms, "min"))],
        ["Prof. máx", formatNumber(stat(depths, "max")) + " mm"],
        ["Prof. mín", formatNumber(stat(depths, "min")) + " mm"],
        ["Tiempo estimado", "—"],
      ];

      return [
        "<div class=\"adaptive-summary\">",
        tiles.map(function (tile) {
          return "<div class=\"tile\"><span>" + tile[0] + "</span><strong>" + tile[1] + "</strong></div>";
        }).join(""),
        "</div>",
      ].join("");
    }

    function render() {
      if (!container) return;

      rows = recalculateRows(rows, targetDepth());
      container.innerHTML = [
        "<div class=\"adaptive-actions\">",
        "<button type=\"button\" class=\"btn btn--sm\" data-adaptive-action=\"auto-depth\">Auto distribuir profundidad</button>",
        "<button type=\"button\" class=\"btn btn--sm\" data-adaptive-action=\"auto-feed\">Auto distribuir Feed</button>",
        "<button type=\"button\" class=\"btn btn--sm\" data-adaptive-action=\"auto-rpm\">Auto distribuir RPM</button>",
        "<button type=\"button\" class=\"btn btn--sm\" data-adaptive-action=\"redistribute\">Redistribuir</button>",
        "<button type=\"button\" class=\"btn btn--sm\" data-adaptive-action=\"reset\">Reset</button>",
        "</div>",
        "<div class=\"adaptive-table-wrap\">",
        "<table class=\"adaptive-table\">",
        "<thead><tr>",
        "<th>Pasada</th>",
        "<th>Feedrate</th>",
        "<th>RPM</th>",
        "<th>Profundidad</th>",
        "<th>Acumulado</th>",
        "<th>Restante</th>",
        "<th>Bloquear</th>",
        "<th>Comentarios</th>",
        "</tr></thead>",
        "<tbody>",
        rows.map(function (row, index) {
          return [
            "<tr class=\"" + (row.locked ? "is-locked" : "") + "\">",
            "<td class=\"cell-index\">" + row.passNumber + "</td>",
            "<td><input data-row=\"" + index + "\" data-field=\"feedrate\" type=\"number\" step=\"1\" value=\"" + formatNumber(row.feedrate) + "\"></td>",
            "<td><input data-row=\"" + index + "\" data-field=\"rpm\" type=\"number\" step=\"1\" value=\"" + formatNumber(row.rpm) + "\"></td>",
            "<td><input data-row=\"" + index + "\" data-field=\"depth\" type=\"number\" step=\"0.0001\" value=\"" + formatNumber(row.depth) + "\"></td>",
            "<td class=\"cell-num\">" + formatNumber(row.accumulatedDepth) + "</td>",
            "<td class=\"cell-num\">" + formatNumber(row.remainingDepth) + "</td>",
            "<td class=\"cell-lock\"><input data-row=\"" + index + "\" data-field=\"locked\" type=\"checkbox\" " + (row.locked ? "checked" : "") + "></td>",
            "<td><input data-row=\"" + index + "\" data-field=\"comment\" type=\"text\" value=\"" + String(row.comment).replace(/\"/g, "&quot;") + "\"></td>",
            "</tr>",
          ].join("");
        }).join(""),
        "</tbody></table></div>",
        renderValidation(),
        renderStats(),
      ].join("");
    }

    function bindEvents() {
      if (!container) return;

      container.addEventListener("input", function (event) {
        const rowIndex = Number(event.target.getAttribute("data-row"));
        const field = event.target.getAttribute("data-field");
        if (!field || field === "locked") return;
        updateFromInput(rowIndex, field, event.target.value);
      });

      container.addEventListener("change", function (event) {
        const rowIndex = Number(event.target.getAttribute("data-row"));
        const field = event.target.getAttribute("data-field");
        if (field === "locked") updateFromInput(rowIndex, field, event.target.checked);
      });

      container.addEventListener("click", function (event) {
        const action = event.target.getAttribute("data-adaptive-action");
        if (action === "auto-depth") autoDistributeDepth();
        if (action === "auto-feed") autoDistributeFeed();
        if (action === "auto-rpm") autoDistributeRpm();
        if (action === "redistribute") redistribute();
        if (action === "reset") reset();
      });

      [config.finalDepthInputId, config.passCountInputId, config.defaultFeedInputId, config.defaultRpmInputId].forEach(function (id) {
        const input = document.getElementById(id);
        if (!input) return;
        input.addEventListener("input", function () {
          rows = redistributeRows(rows.length ? rows : distributeDepth(targetDepth(), passCount(), defaultFeedrate(), defaultRpm()), targetDepth());
          save();
          render();
        });
      });
    }

    function init() {
      if (!load()) rows = distributeDepth(targetDepth(), passCount(), defaultFeedrate(), defaultRpm());
      bindEvents();
      render();
    }

    return {
      init: init,
      autoDistributeDepth: autoDistributeDepth,
      autoDistributeFeed: autoDistributeFeed,
      autoDistributeRpm: autoDistributeRpm,
      redistribute: redistribute,
      reset: reset,
      readRows: readRows,
      validate: validate,
      isValid: function () { return validate().isValid; },
    };
  }

  window.BujiaAdaptivePasses = {
    createAdaptivePassesController: createAdaptivePassesController,
    distributeDepth: distributeDepth,
    redistributeRows: redistributeRows,
    recalculateRows: recalculateRows,
    getValidation: getValidation,
    formatNumber: formatNumber,
  };
}());
