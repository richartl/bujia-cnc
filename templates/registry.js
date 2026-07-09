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
            leaf("Single Coil"),
            leaf("P90"),
            leaf("Filtertron"),
            leaf("Mini Humbucker"),
            leaf("Wide Range"),
            leaf("Personalizada"),
          ],
        },
        {
          title: "Bajo",
          children: [
            leaf("Jazz Bass"),
            leaf("Precision"),
            leaf("Music Man"),
            leaf("Soapbar"),
            leaf("EMG35"),
            leaf("EMG40"),
            leaf("Personalizada"),
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
