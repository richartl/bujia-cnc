# Diseño general

## Objetivo

Bujia CNC será una caja de herramientas CNC offline para operaciones repetitivas del taller.

La prioridad es que el usuario abra el proyecto, elija una herramienta, llene pocos datos y obtenga G-code útil.

## No objetivo

No se busca construir un CAM completo.

No se busca administrar proyectos complejos, bibliotecas globales, simuladores generales ni postprocesadores extensibles como requisito inicial.

## Arquitectura de alto nivel

```text
index.html
↓
Menú principal
↓
pages/<herramienta>.html
↓
Formulario mínimo
↓
Validación
↓
G-code
↓
Copiar / descargar
```

## Herramientas previstas

- `pages/surfacing.html`.
- `pages/edge.html`.
- `pages/slots.html`.
- `pages/drilling.html`.
- `pages/pockets.html`.
- `pages/profiles.html`.
- `pages/scales.html`.
- `pages/settings.html` opcional.

## Estado actual

El surfacing actual está en `index.html`. Debe migrarse con cuidado a `pages/surfacing.html` solo después de aprobar una estrategia de compatibilidad.

## Diseño por página

Cada página debe contener o importar solo lo necesario para su operación.

Estructura conceptual:

```text
pages/surfacing.html
├── formulario
├── validación local
├── generación local
├── vista de salida
└── descarga
```

## Utilidades compartidas

Se permitirán utilidades compartidas pequeñas cuando exista duplicación real:

```text
shared/download.js
shared/clipboard.js
shared/format.js
shared/validation.js
```

No deben convertirse en un núcleo CAM general.

## Datos

No habrá bibliotecas globales obligatorias de máquina o material.

Si una herramienta necesita defaults o presets, deben ser locales, simples y opcionales.

## Recomendaciones

No habrá motor global de recomendaciones obligatorio.

Cada herramienta podrá sugerir valores específicos si eso ayuda al usuario sin complicar la interfaz.

## G-code

Cada herramienta es responsable de documentar su formato de salida y reglas de seguridad.

Cambiar salida existente requiere aprobación.

## Pruebas

Cada herramienta que genere G-code debe tener entradas conocidas y salida esperada para comparación.

## Migración recomendada

1. Mantener `index.html` funcional.
2. Crear menú principal.
3. Crear `pages/surfacing.html` copiando comportamiento aprobado.
4. Comparar salida con el surfacing actual.
5. Agregar nuevas herramientas una por una.
