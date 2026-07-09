(function () {
  // Árbol de categorías de Plantillas. Fuente única para la página de
  // Plantillas. Un item con status "stable" y "page" está implementado; el
  // resto aparece como "Próximamente".

  function leaf(title, status, page) {
    return { title: title, status: status || "soon", page: page || null };
  }

  const nodes = [
    {
      title: "Pastillas",
      children: [
        {
          title: "Guitarra",
          children: [
            leaf("Humbucker", "stable", "template-humbucker.html"),
            leaf("Humbucker (con orejas)", "stable", "template-humbucker-ears.html"),
            leaf("Single Coil", "stable", "template-single-coil.html"),
            leaf("P90", "stable", "template-p90.html"),
            leaf("Filtertron", "stable", "template-filtertron.html"),
            leaf("Mini Humbucker", "stable", "template-mini-humbucker.html"),
            leaf("Wide Range", "stable", "template-wide-range.html"),
            leaf("Personalizada", "stable", "template-custom-guitar.html"),
          ],
        },
        {
          title: "Bajo",
          children: [
            leaf("Jazz Bass", "stable", "template-jazz-bass.html"),
            leaf("Precision", "stable", "template-precision-bass.html"),
            leaf("Music Man", "stable", "template-music-man.html"),
            leaf("Soapbar", "stable", "template-soapbar-bass.html"),
            leaf("EMG35", "stable", "template-emg35.html"),
            leaf("EMG40", "stable", "template-emg40.html"),
            leaf("Personalizada", "stable", "template-custom-bass.html"),
          ],
        },
      ],
    },
    {
      title: "Cavidades",
      children: [
        leaf("Stratocaster"),
        leaf("Telecaster"),
        leaf("Les Paul"),
        leaf("Jazz Bass"),
        leaf("Precision Bass"),
        leaf("Personalizada"),
      ],
    },
    { title: "Neck Pocket", status: "soon" },
    { title: "Pickguards", status: "soon" },
    { title: "Puentes", status: "soon" },
    { title: "Jack", status: "soon" },
    { title: "Controles", status: "soon" },
    { title: "Personalizadas", status: "soon" },
  ];

  window.BujiaTemplateRegistry = {
    nodes: nodes,
  };
}());
