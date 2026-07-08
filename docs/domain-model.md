# Modelo de dominio del CAM ligero CNC

## 1. Propósito

Este documento define las entidades centrales del sistema. El objetivo es que el proyecto pueda crecer como un CAM ligero, modular y retrocompatible sin convertir el G-code en el modelo interno.

El flujo conceptual obligatorio es:

```text
Usuario
↓
Formulario
↓
Validación
↓
Operation
↓
Toolpath
↓
Simulation
↓
PostProcessor
↓
GCode
```

Nunca debe ser:

```text
Operation
↓
GCode
```

El G-code es una representación final de salida, no la fuente de verdad del sistema.

## 2. Convenciones generales

- Todas las entidades deben poder serializarse como JSON.
- Los identificadores deben ser estables.
- Las unidades deben declararse explícitamente.
- Los valores físicos deben almacenarse como números, no como cadenas con unidades.
- La UI puede mostrar nombres simples, pero el modelo debe conservar metadatos suficientes para validación, simulación, postprocesado y pruebas.
- Ninguna entidad debe depender directamente del DOM.

## 3. Machine

### Descripción

Representa la máquina CNC donde se ejecutará el trabajo.

### Responsabilidad

- Definir límites físicos y capacidades.
- Definir controlador/postprocesador compatible.
- Proveer valores seguros por defecto.
- Ayudar a validar si un trabajo excede capacidades de máquina.

### Atributos

- `id`: identificador estable.
- `name`: nombre visible.
- `controllerType`: tipo de controlador, por ejemplo `grbl`, `fluidnc`, `linuxcnc`, `mach3`, `marlin`, `masso`, `centroid`.
- `workArea`: límites útiles en `x`, `y`, `z`.
- `defaultSafeZ`: altura segura por defecto.
- `maxFeedRate`: avance máximo XY recomendado o soportado.
- `maxPlungeRate`: avance máximo en Z recomendado o soportado.
- `spindle`: configuración mínima y máxima de RPM.
- `supportedPostProcessors`: lista de postprocesadores compatibles.
- `homeBehavior`: notas sobre homing/origen si aplica.
- `notes`: observaciones.

### Relaciones

- Un `Project` referencia una `Machine`.
- Un `PostProcessor` debe ser compatible con la `Machine`.
- `Validation` usa `Machine` para detectar límites excedidos.
- `Simulation` puede usar límites de `Machine` para mostrar área de trabajo.

### Ejemplo

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
  "homeBehavior": "Usar origen de trabajo definido por el operador.",
  "notes": "Máquina de escritorio para madera ligera."
}
```

## 4. Tool

### Descripción

Representa una herramienta de corte.

### Responsabilidad

- Definir geometría básica de herramienta.
- Definir recomendaciones de corte.
- Alimentar sugerencias automáticas y validaciones.

### Atributos

- `id`: identificador estable.
- `name`: nombre visible.
- `diameter`: diámetro en mm.
- `type`: tipo de herramienta.
- `usableLength`: longitud útil en mm.
- `flutes`: número de filos.
- `material`: material de la herramienta.
- `recommendedRpm`: RPM recomendadas.
- `recommendedFeed`: avance XY recomendado.
- `recommendedPlunge`: avance Z recomendado.
- `recommendedStepover`: stepover recomendado.
- `notes`: observaciones.

### Relaciones

- Una `Operation` usa una `Tool`.
- `Material` y `Tool` combinados alimentan sugerencias.
- `Validation` usa `Tool` para detectar stepover excesivo, profundidad por pasada peligrosa o longitud útil insuficiente.
- `Simulation` puede usar diámetro de `Tool` para representar cobertura y traslape.

### Ejemplo

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

## 5. Material

### Descripción

Representa el material a mecanizar.

### Responsabilidad

- Definir propiedades generales del material.
- Proveer recomendaciones de avance, RPM y plunge.
- Ayudar a producir advertencias conservadoras.

### Atributos

- `id`: identificador estable.
- `name`: nombre visible.
- `type`: categoría del material.
- `hardness`: dureza cualitativa o numérica.
- `recommendedFeed`: avance XY recomendado.
- `recommendedRpm`: RPM recomendadas.
- `recommendedPlunge`: avance Z recomendado.
- `observations`: notas de mecanizado.

### Relaciones

- Un `Project` referencia un `Material`.
- `Operation` usa `Material` para sugerencias.
- `Validation` usa `Material` para advertencias.

### Ejemplo

```json
{
  "id": "material_maple_hardwood",
  "name": "Maple",
  "type": "hardwood",
  "hardness": "hard",
  "recommendedFeed": 600,
  "recommendedRpm": 12000,
  "recommendedPlunge": 100,
  "observations": "Madera dura; usar avances conservadores y herramienta afilada."
}
```

## 6. Project

### Descripción

Representa el archivo de trabajo del usuario.

### Responsabilidad

- Agrupar máquina, material, herramientas, operaciones y configuración.
- Ser la unidad principal de guardado/carga JSON.
- Mantener metadatos del trabajo.

### Atributos

- `id`: identificador estable.
- `schemaVersion`: versión del JSON.
- `name`: nombre del proyecto.
- `units`: unidades del proyecto.
- `machine`: referencia o snapshot de máquina.
- `material`: referencia o snapshot de material.
- `tools`: herramientas disponibles o usadas.
- `operations`: lista ordenada de operaciones.
- `settings`: configuración del proyecto.
- `metadata`: autor, fecha opcional, notas.

### Relaciones

- Contiene `Operation`.
- Referencia `Machine`, `Material`, `Tool` y `Settings`.
- Genera uno o más `Job`.

### Ejemplo

```json
{
  "id": "project_surfacing_guitar_body_blank",
  "schemaVersion": "1.0.0",
  "name": "Planeado de blank para cuerpo",
  "units": "mm",
  "machineId": "machine_3018_grbl",
  "materialId": "material_maple_hardwood",
  "toolIds": ["tool_flat_13mm_2f_carbide"],
  "operationIds": ["op_surfacing_001"],
  "settingsId": "settings_default_grbl",
  "metadata": { "notes": "Preparación de superficie antes de contorno." }
}
```

## 7. Operation

### Descripción

Representa una operación CAM concreta, como Surfacing, Pocket, Contour, Slots o Drilling.

### Responsabilidad

- Definir parámetros de entrada.
- Validar parámetros.
- Generar un `Toolpath` neutral.
- Estimar tiempo.
- Producir datos para simulación.
- Exportar resultado neutral para postprocesado.

### Atributos

- `id`: identificador estable.
- `type`: tipo de operación.
- `name`: nombre visible.
- `enabled`: si participa en el job.
- `toolId`: herramienta usada.
- `parameters`: parámetros específicos.
- `defaults`: valores por defecto usados.
- `version`: versión del contrato de operación.
- `notes`: observaciones.

### Relaciones

- Pertenece a un `Project`.
- Usa una `Tool`.
- Usa contexto de `Machine`, `Material` y `Settings`.
- Produce `Validation`, `Warning`, `Toolpath` y `Simulation`.

### Ejemplo

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
  },
  "notes": "Debe generar toolpath neutral, no G-code directo."
}
```

## 8. Toolpath

### Descripción

Representa la trayectoria neutral de mecanizado antes de postprocesar a G-code.

### Responsabilidad

- Describir movimientos de máquina en forma independiente del controlador.
- Ser la fuente para simulación 2D.
- Ser la entrada del `PostProcessor`.
- Mantener salida determinista para pruebas.

### Atributos

- `id`: identificador estable.
- `operationId`: operación que lo generó.
- `units`: unidades.
- `coordinateMode`: absoluto, relativo o mixto conceptual.
- `moves`: lista ordenada de movimientos/eventos.
- `bounds`: área cubierta.
- `metrics`: distancia total, distancia de corte, distancia rápida, tiempo estimado.
- `warnings`: advertencias asociadas.

### Relaciones

- Producido por `Operation`.
- Consumido por `Simulation`.
- Consumido por `PostProcessor`.
- Referenciado por `Job`.

### Ejemplo

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

## 9. Simulation

### Descripción

Representa el resultado de analizar un `Toolpath` para visualización 2D y estimación.

### Responsabilidad

- Mostrar trayectoria.
- Mostrar sentido.
- Mostrar cobertura y traslape.
- Mostrar área mecanizada y pendiente.
- Mostrar punto inicial y final.
- Mostrar tiempo estimado y restante.

### Atributos

- `id`: identificador estable.
- `toolpathId`: toolpath simulado.
- `type`: inicialmente `2d`.
- `segments`: segmentos visuales.
- `coverage`: información de cobertura.
- `startPoint`: punto inicial.
- `endPoint`: punto final.
- `estimatedTime`: tiempo estimado.
- `remainingTime`: tiempo restante durante reproducción.
- `warnings`: advertencias de simulación.

### Relaciones

- Consume `Toolpath`.
- Puede usar `Tool` para diámetro y cobertura.
- Puede usar `Machine` para límites de mesa.
- Produce información visual para UI.

### Ejemplo

```json
{
  "id": "simulation_toolpath_op_surfacing_001",
  "toolpathId": "toolpath_op_surfacing_001",
  "type": "2d",
  "segments": [
    { "kind": "rapid", "from": { "x": 0, "y": 0 }, "to": { "x": 0, "y": 0 } },
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

## 10. PostProcessor

### Descripción

Convierte `Toolpath` neutral en G-code final para un controlador específico.

### Responsabilidad

- Traducir eventos neutrales a comandos del dialecto correspondiente.
- Mantener formato numérico determinista.
- Emitir encabezado, comentarios y cierre del programa.
- Aislar diferencias entre GRBL, FluidNC, LinuxCNC, Mach3, Marlin, Masso y Centroid.

### Atributos

- `id`: identificador estable.
- `name`: nombre visible.
- `controllerType`: controlador objetivo.
- `version`: versión del postprocesador.
- `fileExtensions`: extensiones compatibles.
- `capabilities`: comandos soportados.
- `format`: reglas de decimales y comentarios.

### Relaciones

- Seleccionado por `Settings`, `Machine` o `Job`.
- Consume `Toolpath`.
- Produce G-code.
- Debe tener Golden Files por operación relevante.

### Ejemplo

```json
{
  "id": "post_grbl_v1",
  "name": "GRBL",
  "controllerType": "grbl",
  "version": "1.0.0",
  "fileExtensions": ["nc", "gcode", "tap"],
  "capabilities": {
    "units": ["mm"],
    "spindle": true,
    "dwell": true,
    "comments": true
  },
  "format": { "decimals": 4, "trimTrailingZeros": true, "commentStyle": "parentheses" }
}
```

## 11. Settings

### Descripción

Representa preferencias globales o de proyecto.

### Responsabilidad

- Definir defaults.
- Controlar formato y comportamiento general.
- Evitar que la UI repita parámetros técnicos innecesarios.

### Atributos

- `id`: identificador estable.
- `defaultUnits`: unidades por defecto.
- `defaultMachineId`: máquina por defecto.
- `defaultPostProcessorId`: postprocesador por defecto.
- `defaultSafeZ`: Z seguro por defecto.
- `defaultFileExtension`: extensión de salida por defecto.
- `decimalPlaces`: decimales para salida.
- `language`: idioma.
- `warningLevel`: nivel de advertencias.
- `simulation`: preferencias de simulador.

### Relaciones

- Usado por `Project`.
- Usado por `GCodeGenerator` y `PostProcessor`.
- Usado por UI para defaults.

### Ejemplo

```json
{
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
}
```

## 12. Job

### Descripción

Representa una ejecución exportable de una o más operaciones de un proyecto.

### Responsabilidad

- Ordenar operaciones habilitadas.
- Asociar toolpaths, simulaciones y salida G-code.
- Registrar advertencias y validaciones del conjunto.
- Ser la unidad que se descarga o se prueba con Golden Files.

### Atributos

- `id`: identificador estable.
- `projectId`: proyecto origen.
- `operationIds`: operaciones incluidas.
- `toolpathIds`: toolpaths generados.
- `postProcessorId`: postprocesador usado.
- `status`: estado del job.
- `validation`: resultado global de validación.
- `warnings`: advertencias globales.
- `outputs`: referencias a G-code o reportes.

### Relaciones

- Pertenece a `Project`.
- Agrupa `Operation` y `Toolpath`.
- Usa `PostProcessor`.
- Produce G-code final.

### Ejemplo

```json
{
  "id": "job_project_surfacing_001",
  "projectId": "project_surfacing_guitar_body_blank",
  "operationIds": ["op_surfacing_001"],
  "toolpathIds": ["toolpath_op_surfacing_001"],
  "postProcessorId": "post_grbl_v1",
  "status": "ready",
  "validation": { "isValid": true, "errors": [], "warnings": [] },
  "warnings": [],
  "outputs": { "gcodeFileName": "surfacing.nc" }
}
```

## 13. Warning

### Descripción

Representa una advertencia no bloqueante.

### Responsabilidad

- Comunicar riesgos al usuario.
- Permitir generación cuando el riesgo no es fatal.
- Ser visible en UI, simulación y reportes.

### Atributos

- `id`: identificador estable.
- `code`: código legible para pruebas.
- `level`: normalmente `warning` o `info`.
- `message`: texto para usuario.
- `source`: entidad o módulo que la produjo.
- `relatedField`: campo relacionado si aplica.
- `suggestedAction`: acción recomendada.

### Relaciones

- Puede pertenecer a `Validation`, `Operation`, `Toolpath`, `Simulation` o `Job`.

### Ejemplo

```json
{
  "id": "warn_stepover_gt_tool_diameter",
  "code": "STEPOVER_GREATER_THAN_TOOL_DIAMETER",
  "level": "warning",
  "message": "El stepover es mayor al diámetro de la herramienta.",
  "source": "surfacing.validate",
  "relatedField": "parameters.stepover",
  "suggestedAction": "Usar entre 30% y 50% del diámetro de la fresa."
}
```

## 14. Validation

### Descripción

Representa el resultado estructurado de validar parámetros y contexto.

### Responsabilidad

- Bloquear generación si hay errores.
- Agrupar errores, advertencias e información.
- Ser determinista para pruebas.

### Atributos

- `isValid`: booleano.
- `errors`: lista de errores bloqueantes.
- `warnings`: lista de advertencias.
- `info`: lista de mensajes informativos.
- `source`: módulo que validó.
- `checkedAt`: opcional; no debe usarse en Golden Files si rompe determinismo.

### Relaciones

- Producida por `Operation.validate()`.
- Consumida por UI y `GCodeGenerator`.
- Integrada en `Job`.

### Ejemplo

```json
{
  "isValid": false,
  "errors": [
    {
      "code": "INVALID_X_DISTANCE",
      "message": "La distancia X debe ser mayor a 0.",
      "relatedField": "parameters.widthX"
    }
  ],
  "warnings": [],
  "info": [],
  "source": "surfacing.validate"
}
```

## 15. Relaciones globales resumidas

```text
Project
├── Machine
├── Material
├── Settings
├── Tools
└── Operations
    └── Operation.validate() -> Validation + Warning
    └── Operation.generateToolpath() -> Toolpath
        ├── Simulation
        └── PostProcessor -> GCode

Job
├── Project
├── Operations
├── Toolpaths
├── Validation
├── Warnings
└── Outputs
```

## 16. Reglas de evolución del modelo

- Agregar atributos debe preferirse a reemplazar atributos existentes.
- Eliminar atributos requiere migración documentada y aprobación.
- Cambiar significado de un atributo requiere nueva versión de schema.
- Cambiar la salida G-code requiere revisión Golden File.
- Todo cambio debe preservar la posibilidad de abrir el HTML localmente y trabajar offline.
