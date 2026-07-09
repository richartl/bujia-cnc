(function () {
  const STORAGE_KEY = "bujia.toolbox.settings.v1";
  const FIELD_IDS = [
    "lastFolder",
    "lastStrategy",
    "lastFeed",
    "lastPlunge",
    "lastSpindle",
    "lastSafeZ",
    "lastTool",
    "theme",
  ];
  const DEFAULT_SETTINGS = {
    lastFolder: "",
    lastStrategy: "zigzag",
    lastFeed: "600",
    lastPlunge: "100",
    lastSpindle: "1000",
    lastSafeZ: "5",
    lastTool: "Fresa recta",
    theme: "system",
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function readSettings() {
    return FIELD_IDS.reduce(function (settings, id) {
      settings[id] = byId(id).value;
      return settings;
    }, {});
  }

  function writeSettings(settings) {
    window.BujiaCommon.setValues(Object.assign({}, DEFAULT_SETTINGS, settings));
  }

  function setStatus(message) {
    window.BujiaCommon.setText("settingsStatus", message);
  }

  function loadSettings() {
    const settings = window.BujiaStorage.loadJson(STORAGE_KEY, DEFAULT_SETTINGS);
    writeSettings(settings);
    setStatus("Preferencias cargadas desde LocalStorage.");
  }

  function applyTheme() {
    if (window.BujiaShell && window.BujiaShell.applyTheme) window.BujiaShell.applyTheme();
  }

  function saveSettings() {
    const saved = window.BujiaStorage.saveJson(STORAGE_KEY, readSettings());
    applyTheme();
    setStatus(saved ? "Preferencias guardadas localmente." : "No se pudieron guardar las preferencias.");
  }

  function resetSettings() {
    window.BujiaStorage.saveJson(STORAGE_KEY, DEFAULT_SETTINGS);
    writeSettings(DEFAULT_SETTINGS);
    applyTheme();
    setStatus("Preferencias limpiadas.");
  }

  function bindEvents() {
    byId("saveButton").addEventListener("click", saveSettings);
    byId("resetButton").addEventListener("click", resetSettings);
    // Vista previa inmediata del tema: guarda y aplica al cambiar el selector.
    byId("theme").addEventListener("change", saveSettings);
  }

  function initSettingsUi() {
    bindEvents();
    loadSettings();
  }

  window.BujiaSettingsUi = {
    loadSettings: loadSettings,
    saveSettings: saveSettings,
    resetSettings: resetSettings,
    readSettings: readSettings,
    initSettingsUi: initSettingsUi,
  };

  document.addEventListener("DOMContentLoaded", initSettingsUi);
}());
