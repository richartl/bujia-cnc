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

El repositorio contiene un generador funcional de surfacing. Ese comportamiento existente debe conservarse hasta que se apruebe explícitamente cualquier migración hacia `pages/surfacing.html`.

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
