(function () {
  // Renderiza el árbol de categorías de Plantillas desde el registry.
  // Los items "stable" con page son enlaces; el resto se muestra "Próximamente".

  function iconFor(title) {
    const icons = {
      "Pastillas": "🎸",
      "Guitarra": "🎸",
      "Bajo": "🎵",
      "Cavidades": "▢",
      "Humbucker": "▤",
      "Humbucker (con orejas)": "▤",
      "Single Coil": "▬",
      "P90": "▬",
      "Filtertron": "▤",
      "Mini Humbucker": "▤",
      "Wide Range": "▤",
      "Jazz Bass": "▬",
      "Precision": "▥",
      "Music Man": "▤",
      "Soapbar": "▬",
      "EMG35": "▬",
      "EMG40": "▬",
      "Neck Pocket": "▭",
      "Pickguards": "◳",
      "Puentes": "⧉",
      "Jack": "●",
      "Controles": "⊙",
      "Personalizadas": "✎",
      "Personalizada": "✎",
    };
    return icons[title] || "🧩";
  }

  function renderLeaf(leaf) {
    const icon = iconFor(leaf.title);
    if (leaf.status === "stable" && leaf.page) {
      return [
        "<a class=\"tool-card\" href=\"" + leaf.page + "\">",
        "<span class=\"tool-card__icon\" aria-hidden=\"true\">" + icon + "</span>",
        "<span class=\"tool-card__title\">" + leaf.title + "</span>",
        "<p class=\"tool-card__desc\">Configura dimensiones y genera el G-code.</p>",
        "</a>",
      ].join("");
    }
    return [
      "<div class=\"tool-card is-soon\">",
      "<span class=\"tool-card__tag badge\">Pronto</span>",
      "<span class=\"tool-card__icon\" aria-hidden=\"true\">" + icon + "</span>",
      "<span class=\"tool-card__title\">" + leaf.title + "</span>",
      "</div>",
    ].join("");
  }

  function isLeaf(node) {
    return !node.children;
  }

  function renderNode(node, depth) {
    // Nodo hoja de nivel superior (p. ej. Neck Pocket) → tarjeta directa.
    if (isLeaf(node)) return renderLeaf(node);

    const label = depth === 0
      ? "<h2 class=\"section-label\">" + node.title + "</h2>"
      : "<h3 class=\"section-sublabel\">" + node.title + "</h3>";

    const leafChildren = node.children.filter(isLeaf);
    const groupChildren = node.children.filter(function (child) { return !isLeaf(child); });

    const parts = [label];

    if (leafChildren.length) {
      parts.push("<section class=\"tool-grid\">" + leafChildren.map(renderLeaf).join("") + "</section>");
    }

    groupChildren.forEach(function (child) {
      parts.push("<div class=\"template-group\">" + renderNode(child, depth + 1) + "</div>");
    });

    return parts.join("");
  }

  function render(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !window.BujiaTemplateRegistry) return;

    // Separa las hojas de nivel superior para agruparlas en una sola rejilla.
    const nodes = window.BujiaTemplateRegistry.nodes;
    const topLeaves = nodes.filter(isLeaf);
    const topCategories = nodes.filter(function (node) { return !isLeaf(node); });

    const parts = [];
    topCategories.forEach(function (node) {
      parts.push(renderNode(node, 0));
    });

    if (topLeaves.length) {
      parts.push("<h2 class=\"section-label\">Otras plantillas</h2>");
      parts.push("<section class=\"tool-grid\">" + topLeaves.map(renderLeaf).join("") + "</section>");
    }

    container.innerHTML = parts.join("");
  }

  window.BujiaTemplatesMenu = { render: render };

  document.addEventListener("DOMContentLoaded", function () {
    render("templatesTree");
  });
}());
