# Esquema JSON del proyecto CAM ligero

## 1. Propósito

Este documento define cómo deberá almacenarse un proyecto del CAM ligero en JSON. No es una implementación de JSON Schema formal todavía; es la especificación documental del formato objetivo.

Todo proyecto debe poder guardarse, cargarse, compartirse y probarse como JSON sin depender de servidor ni base de datos.

## 2. Principios

- El JSON debe ser legible por humanos.
- Debe incluir `schemaVersion`.
- Debe separar datos de proyecto, máquina, herramientas, material, operaciones, toolpaths, simulación y settings.
- El G-code no es el modelo interno.
- El G-code puede guardarse como salida derivada, pero debe poder regenerarse desde `Operation -> Toolpath -> PostProcessor`.
- Los campos que afecten Golden Files deben ser deterministas.

## 3. Estructura raíz propuesta

```json
{
  "schemaVersion": "1.0.0",
  "project": {},
  "machine": {},
  "tools": [],
  "materials": [],
  "operations": [],
  "toolpaths": [],
  "simulations": [],
  "postProcessors": [],
  "settings": {},
  "jobs": [],
  "metadata": {}
}
```

## 4. Proyecto completo de ejemplo

```json
{
  "schemaVersion": "1.0.0",
  "project": {
    "id": "project_surfacing_guitar_body_blank",
    "name": "Planeado de blank para cuerpo",
    "units": "mm",
    "machineId": "machine_3018_grbl",
    "materialId": "material_maple_hardwood",
    "toolIds": ["tool_flat_13mm_2f_carbide"],
    "operationIds": ["op_surfacing_001"],
    "settingsId": "settings_default_grbl",
    "notes": "Proyecto de ejemplo para surfacing de madera."
  },
  "machine": {
    "id": "machine_3018_grbl",
    "name": "CNC 3018 GRBL",
    "controllerType": "grbl",
    "workArea": { "x": 300, "y": 180, "z": 45, "units": "mm" },
    "defaultSafeZ": 5,
    "maxFeedRate": 1200,
    "maxPlungeRate": 300,
    "spindle": { "minRpm": 0, "maxRpm": 10000 },
    "supportedPostProcessors": ["grbl"],
    "notes": "Máquina de escritorio para madera ligera."
  },
  "tools": [
    {
      "id": "tool_flat_13mm_2f_carbide",
      "name": "Fresa plana 13 mm 2F carburo",
      "diameter": 13,
      "type": "flat_endmill",
      "usableLength": 25,
      "flutes": 2,
      "material": "carbide",
      "recommendedRpm": 10000,
      "recommendedFeed": 800,
      "recommendedPlunge": 120,
      "recommendedStepover": 5.2,
      "notes": "Apta para surfacing en madera con pasadas conservadoras."
    }
  ],
  "materials": [
    {
      "id": "material_maple_hardwood",
      "name": "Maple",
      "type": "hardwood",
      "hardness": "hard",
      "recommendedFeed": 600,
      "recommendedRpm": 12000,
      "recommendedPlunge": 100,
      "observations": "Madera dura; usar avances conservadores."
    }
  ],
  "operations": [
    {
      "id": "op_surfacing_001",
      "type": "surfacing",
      "name": "Surfacing superior",
      "enabled": true,
      "toolId": "tool_flat_13mm_2f_carbide",
      "version": "1.0.0",
      "parameters": {
        "widthX": 410,
        "lengthY": 210,
        "totalDepthZ": 0.7,
        "zPasses": 1,
        "stepover": 3,
        "feedRate": 600,
        "plungeRate": 100,
        "spindleRpm": 1000,
        "safeZ": 5,
        "startDirection": "positiveY"
      }
    }
  ],
  "toolpaths": [
    {
      "id": "toolpath_op_surfacing_001",
      "operationId": "op_surfacing_001",
      "units": "mm",
      "coordinateMode": "neutral",
      "moves": [
        { "type": "comment", "text": "Inicio surfacing" },
        { "type": "spindleOn", "rpm": 1000 },
        { "type": "dwell", "seconds": 3 },
        { "type": "rapid", "to": { "z": 5 } },
        { "type": "rapid", "to": { "x": 0, "y": 0 } },
        { "type": "plunge", "to": { "z": -0.7 }, "feedRate": 100 },
        { "type": "cut", "to": { "x": 0, "y": 210, "z": -0.7 }, "feedRate": 600 },
        { "type": "cut", "to": { "x": 3, "y": 210, "z": -0.7 }, "feedRate": 600 },
        { "type": "cut", "to": { "x": 3, "y": 0, "z": -0.7 }, "feedRate": 600 },
        { "type": "retract", "to": { "z": 5 } },
        { "type": "spindleOff" },
        { "type": "end" }
      ],
      "bounds": { "minX": 0, "maxX": 410, "minY": 0, "maxY": 210, "minZ": -0.7, "maxZ": 5 },
      "metrics": { "estimatedSeconds": 120, "cutDistance": 1000, "rapidDistance": 15 },
      "warnings": []
    }
  ],
  "simulations": [
    {
      "id": "simulation_toolpath_op_surfacing_001",
      "toolpathId": "toolpath_op_surfacing_001",
      "type": "2d",
      "segments": [
        { "kind": "cut", "from": { "x": 0, "y": 0 }, "to": { "x": 0, "y": 210 }, "direction": "positiveY" },
        { "kind": "cut", "from": { "x": 3, "y": 210 }, "to": { "x": 3, "y": 0 }, "direction": "negativeY" }
      ],
      "coverage": { "coveredPercent": 100, "overlapPercent": 40, "pendingArea": 0 },
      "startPoint": { "x": 0, "y": 0, "z": 5 },
      "endPoint": { "x": 0, "y": 0, "z": 5 },
      "estimatedTime": { "seconds": 120, "label": "2 min" },
      "remainingTime": { "seconds": 120, "label": "2 min" },
      "warnings": []
    }
  ],
  "postProcessors": [
    {
      "id": "post_grbl_v1",
      "name": "GRBL",
      "controllerType": "grbl",
      "version": "1.0.0",
      "fileExtensions": ["nc", "gcode", "tap"],
      "capabilities": { "units": ["mm"], "spindle": true, "dwell": true, "comments": true },
      "format": { "decimals": 4, "trimTrailingZeros": true, "commentStyle": "parentheses" }
    }
  ],
  "settings": {
    "id": "settings_default_grbl",
    "defaultUnits": "mm",
    "defaultMachineId": "machine_3018_grbl",
    "defaultPostProcessorId": "post_grbl_v1",
    "defaultSafeZ": 5,
    "defaultFileExtension": "nc",
    "decimalPlaces": 4,
    "language": "es",
    "warningLevel": "normal",
    "simulation": { "enabled": true, "type": "2d" }
  },
  "jobs": [
    {
      "id": "job_project_surfacing_001",
      "projectId": "project_surfacing_guitar_body_blank",
      "operationIds": ["op_surfacing_001"],
      "toolpathIds": ["toolpath_op_surfacing_001"],
      "postProcessorId": "post_grbl_v1",
      "status": "ready",
      "validation": { "isValid": true, "errors": [], "warnings": [], "info": [] },
      "outputs": { "gcodeFileName": "surfacing.nc" }
    }
  ],
  "metadata": {
    "createdBy": "bujia-cnc",
    "description": "Ejemplo documental. Las fechas pueden omitirse en Golden Files para mantener determinismo."
  }
}
```

## 5. Máquina

```json
{
  "id": "machine_3018_grbl",
  "name": "CNC 3018 GRBL",
  "controllerType": "grbl",
  "workArea": { "x": 300, "y": 180, "z": 45, "units": "mm" },
  "defaultSafeZ": 5,
  "maxFeedRate": 1200,
  "maxPlungeRate": 300,
  "spindle": { "minRpm": 0, "maxRpm": 10000 },
  "supportedPostProcessors": ["grbl"],
  "notes": "Máquina de escritorio para madera ligera."
}
```

## 6. Herramienta

```json
{
  "id": "tool_flat_13mm_2f_carbide",
  "name": "Fresa plana 13 mm 2F carburo",
  "diameter": 13,
  "type": "flat_endmill",
  "usableLength": 25,
  "flutes": 2,
  "material": "carbide",
  "recommendedRpm": 10000,
  "recommendedFeed": 800,
  "recommendedPlunge": 120,
  "recommendedStepover": 5.2,
  "notes": "Apta para surfacing en madera con pasadas conservadoras."
}
```

## 7. Material

```json
{
  "id": "material_maple_hardwood",
  "name": "Maple",
  "type": "hardwood",
  "hardness": "hard",
  "recommendedFeed": 600,
  "recommendedRpm": 12000,
  "recommendedPlunge": 100,
  "observations": "Madera dura; usar avances conservadores."
}
```

## 8. Operación

```json
{
  "id": "op_surfacing_001",
  "type": "surfacing",
  "name": "Surfacing superior",
  "enabled": true,
  "toolId": "tool_flat_13mm_2f_carbide",
  "version": "1.0.0",
  "parameters": {
    "widthX": 410,
    "lengthY": 210,
    "totalDepthZ": 0.7,
    "zPasses": 1,
    "stepover": 3,
    "feedRate": 600,
    "plungeRate": 100,
    "spindleRpm": 1000,
    "safeZ": 5,
    "startDirection": "positiveY"
  }
}
```

## 9. Toolpath

```json
{
  "id": "toolpath_op_surfacing_001",
  "operationId": "op_surfacing_001",
  "units": "mm",
  "coordinateMode": "neutral",
  "moves": [
    { "type": "comment", "text": "Inicio surfacing" },
    { "type": "spindleOn", "rpm": 1000 },
    { "type": "dwell", "seconds": 3 },
    { "type": "rapid", "to": { "z": 5 } },
    { "type": "rapid", "to": { "x": 0, "y": 0 } },
    { "type": "plunge", "to": { "z": -0.7 }, "feedRate": 100 },
    { "type": "cut", "to": { "x": 0, "y": 210, "z": -0.7 }, "feedRate": 600 }
  ],
  "bounds": { "minX": 0, "maxX": 410, "minY": 0, "maxY": 210, "minZ": -0.7, "maxZ": 5 },
  "metrics": { "estimatedSeconds": 120, "cutDistance": 1000, "rapidDistance": 15 },
  "warnings": []
}
```

## 10. Simulación

```json
{
  "id": "simulation_toolpath_op_surfacing_001",
  "toolpathId": "toolpath_op_surfacing_001",
  "type": "2d",
  "segments": [
    { "kind": "cut", "from": { "x": 0, "y": 0 }, "to": { "x": 0, "y": 210 }, "direction": "positiveY" }
  ],
  "coverage": { "coveredPercent": 100, "overlapPercent": 40, "pendingArea": 0 },
  "startPoint": { "x": 0, "y": 0, "z": 5 },
  "endPoint": { "x": 0, "y": 0, "z": 5 },
  "estimatedTime": { "seconds": 120, "label": "2 min" },
  "remainingTime": { "seconds": 120, "label": "2 min" },
  "warnings": []
}
```

## 11. Validación

```json
{
  "isValid": true,
  "errors": [],
  "warnings": [
    {
      "code": "STEPOVER_GREATER_THAN_TOOL_DIAMETER",
      "level": "warning",
      "message": "El stepover es mayor al diámetro de la herramienta.",
      "relatedField": "parameters.stepover",
      "suggestedAction": "Usar entre 30% y 50% del diámetro."
    }
  ],
  "info": [],
  "source": "surfacing.validate"
}
```

## 12. Reglas de versionado

- `schemaVersion` debe cambiar cuando el formato raíz cambie.
- Cada operación debe tener `version`.
- Cada postprocesador debe tener `version`.
- Los Golden Files deben indicar schema, operación y postprocesador usados.
- Los cambios incompatibles requieren migración documentada y aprobación.

## 13. Golden Files JSON

Un caso Golden File debe poder referenciar:

```json
{
  "id": "surfacing_basic_410x210",
  "schemaVersion": "1.0.0",
  "operationType": "surfacing",
  "operationVersion": "1.0.0",
  "postProcessor": "grbl",
  "parametersFile": "tests/golden/surfacing/basic.params.json",
  "expectedGcodeFile": "tests/golden/surfacing/basic.expected.gcode",
  "notes": "No actualizar automáticamente."
}
```

## 14. Datos derivados

Los siguientes datos pueden guardarse para conveniencia, pero deben considerarse derivados:

- Toolpaths generados.
- Simulaciones.
- Estimaciones.
- G-code final.
- Reportes.

La fuente principal debe seguir siendo:

```text
Project + Machine + Tool + Material + Operation + Settings
```

## 15. Restricciones

- No incluir funciones JavaScript dentro del JSON.
- No depender de URLs externas.
- No incluir fechas dinámicas en Golden Files si rompen determinismo.
- No almacenar G-code como única representación de una operación.
- No cambiar nombres de campos existentes sin migración documentada.
