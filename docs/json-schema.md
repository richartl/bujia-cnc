# Formatos JSON

## Propósito

La nueva arquitectura no requiere almacenar proyectos CAM completos. JSON debe usarse solo para datos simples que aporten valor a una caja de herramientas independiente.

## Principio

No crear esquemas globales antes de necesitarlos.

Cada herramienta puede definir archivos JSON locales o preferencias simples si eso reduce duplicación o mejora la experiencia, pero no debe imponer un modelo global.

## Manifest opcional de herramientas

Un menú principal podría usar un manifest simple:

```json
{
  "schemaVersion": "toolbox-manifest-1",
  "name": "Bujia CNC Toolbox",
  "tools": [
    {
      "id": "surfacing",
      "title": "Surfacing",
      "description": "Aplanado de superficies",
      "page": "pages/surfacing.html",
      "status": "stable"
    },
    {
      "id": "slots",
      "title": "Ranuras",
      "description": "Generación de ranuras simples",
      "page": "pages/slots.html",
      "status": "planned"
    }
  ]
}
```

## Preferencias opcionales

Preferencias simples pueden guardarse en LocalStorage:

```json
{
  "schemaVersion": "toolbox-preferences-1",
  "preferredExtension": "nc",
  "lastToolId": "surfacing",
  "toolValues": {
    "surfacing": {
      "widthX": 410,
      "lengthY": 210,
      "safeZ": 5
    }
  }
}
```

## Caso esperado de salida

Para pruebas de regresión puede usarse un JSON simple:

```json
{
  "schemaVersion": "gcode-case-1",
  "id": "surfacing_basic_410x210",
  "toolId": "surfacing",
  "inputFile": "tests/surfacing/basic.input.json",
  "expectedOutputFile": "tests/surfacing/basic.expected.nc",
  "notes": "No actualizar automáticamente."
}
```

## Conceptos eliminados del esquema base

El esquema base ya no debe modelar obligatoriamente:

- Proyecto CAM completo.
- Máquina global.
- Material global.
- Toolpath global.
- Simulación global.
- Postprocesador global.
- Job global.
- Motor global de recomendaciones.

Si una herramienta necesita alguno de esos conceptos de forma local, debe documentarlo dentro de esa herramienta.
