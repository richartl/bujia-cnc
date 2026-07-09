(function () {
  // Versión mostrada en el pie de página. Fuente única de verdad.
  const VERSION = "0.2.0";

  // Clave de preferencias compartida con la página Settings.
  const SETTINGS_KEY = "bujia.toolbox.settings.v1";

  // Lista única de herramientas del menú lateral. Agregar una herramienta
  // nueva aquí la publica en la barra lateral de todas las páginas.
  const TOOLS = [
    { id: "home", title: "Inicio", icon: "⌂", page: "index.html", status: "stable" },
    { id: "surfacing", title: "Surfacing", icon: "▦", page: "pages/surfacing.html", status: "stable" },
    { id: "edge", title: "Cantos", icon: "▭", page: "pages/edge.html", status: "stable" },
    { id: "slots", title: "Ranuras", icon: "≡", page: "pages/slots.html", status: "soon" },
    { id: "drilling", title: "Taladros", icon: "◎", page: "pages/drilling.html", status: "soon" },
    { id: "pockets", title: "Cavidades", icon: "▢", page: "pages/pockets.html", status: "soon" },
    { id: "settings", title: "Settings", icon: "⚙", page: "pages/settings.html", status: "stable" },
  ];

  function base() {
    // "" en index.html, "../" dentro de pages/.
    return document.body.getAttribute("data-shell-base") || "";
  }

  function activeTool() {
    return document.body.getAttribute("data-tool") || "";
  }

  function applyTheme() {
    let theme = "dark";
    try {
      const raw = window.localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.theme) theme = saved.theme;
      }
    } catch (error) {
      theme = "dark";
    }

    if (theme === "system") {
      const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
      theme = prefersLight ? "light" : "dark";
    }

    document.documentElement.setAttribute("data-theme", theme === "light" ? "light" : "dark");
  }

  function buildNav() {
    const nav = document.querySelector("[data-shell-nav]");
    if (!nav) return;

    const current = activeTool();
    const prefix = base();
    const items = TOOLS.map(function (tool) {
      const isActive = tool.id === current;
      const isDisabled = tool.status === "soon";
      const classes = ["nav-link"];
      if (isActive) classes.push("is-active");
      if (isDisabled) classes.push("is-disabled");

      const tag = isDisabled ? "<span class=\"nav-link__tag\">Pronto</span>" : "";
      const href = isDisabled ? "#" : prefix + tool.page;

      return [
        "<a class=\"" + classes.join(" ") + "\" href=\"" + href + "\"" + (isActive ? " aria-current=\"page\"" : "") + ">",
        "<span class=\"nav-link__icon\" aria-hidden=\"true\">" + tool.icon + "</span>",
        "<span>" + tool.title + "</span>",
        tag,
        "</a>",
      ].join("");
    });

    nav.innerHTML = [
      "<div class=\"nav-group__title\">Herramientas</div>",
      items.join(""),
    ].join("");
  }

  function fillVersion() {
    document.querySelectorAll("[data-shell-version]").forEach(function (element) {
      element.textContent = "v" + VERSION;
    });
  }

  function init() {
    applyTheme();
    buildNav();
    fillVersion();
  }

  window.BujiaShell = {
    VERSION: VERSION,
    TOOLS: TOOLS,
    init: init,
    applyTheme: applyTheme,
  };

  // Aplicar el tema cuanto antes para reducir el parpadeo.
  applyTheme();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}());
