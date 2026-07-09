# Bujia CNC Toolbox

Bujia CNC ya no se define como un CAM ligero completo. La visión del proyecto es una **caja de herramientas CNC offline**: una colección de páginas independientes para resolver operaciones repetitivas de taller con la menor complejidad posible.

## Visión

El usuario debe poder abrir el proyecto, elegir una herramienta concreta, llenar pocos datos y descargar G-code seguro para esa operación.

Ejemplos de herramientas futuras:

- Surfacing.
- Cantos / edge surfacing.
- Ranuras.
- Taladros.
- Cavidades.
- Perfilados.
- Escalas.
- Plantillas.

Cada herramienta debe hacer una sola operación y debe poder evolucionar sin convertir el proyecto en un generador enorme.

## Regla principal

La aplicación debe funcionar siempre así:

```text
Doble click
↓
index.html
↓
Menú principal
↓
Página independiente de herramienta
```

No debe requerir servidor, build, backend, base de datos, npm, frameworks ni conexión a internet.

## Arquitectura objetivo

```text
index.html
└── Menú principal
    └── pages/
        ├── surfacing.html
        ├── edge.html
        ├── slots.html
        ├── drilling.html
        ├── pockets.html
        └── settings.html
```

Cada página debe ser entendible de forma aislada. La lógica compartida solo debe existir cuando reduzca duplicación sin volver rígidas las herramientas.

## Estado actual

`index.html` es un dashboard que enlaza a herramientas independientes bajo `pages/`. Están operativas Surfacing (`pages/surfacing.html`), Cantos (`pages/edge.html`), Settings (`pages/settings.html`) y Plantillas (`pages/templates.html`, con el catálogo completo de pastillas de guitarra y bajo, más Neck Pocket, Puentes, Jack, Controles y Personalizadas); Ranuras y Taladros aparecen como «Próximamente». Dentro de Plantillas, Pickguards y las siluetas de cuerpo completo en Cavidades también son «Próximamente» (requieren contornos orgánicos reales, ver `docs/architecture.md`).

La interfaz usa un layout de aplicación de escritorio (tema oscuro, barra superior, menú lateral, panel derecho) construido solo con HTML, CSS y JavaScript nativo, sin frameworks ni build, y funciona abriendo `index.html` con `file://`.

El G-code Manual de Surfacing y Cantos es funcionalidad existente verificada y no debe cambiarse sin aprobación explícita. Surfacing y Cantos comparten el componente Adaptive Passes (`js/ui/adaptive-passes.js`).

## Principios

- Simplicidad para el usuario antes que ambición técnica.
- Una página por herramienta.
- Una herramienta por operación.
- Sin bibliotecas globales obligatorias de máquina/material.
- Sin motor global de recomendaciones obligatorio.
- Sin proyectos CAM complejos.
- Sin dependencia de internet ni instalaciones.
- Compatibilidad hacia atrás para el surfacing existente.

## Documentación principal

Antes de modificar el proyecto, leer:

1. `docs/design-principles.md`
2. `docs/architecture-rules.md`
3. `docs/architecture.md`
4. `docs/requirements.md`
5. `docs/domain-model.md`
6. `docs/plugin-api.md`
7. `docs/json-schema.md`
8. `docs/roadmap.md`
9. `CHANGELOG.md`
