# API de operaciones del CAM ligero

## 1. Propósito

Este documento define cómo deberá construirse cualquier operación nueva del CAM. No implementa operaciones; solo define el contrato que todas deberán seguir para que el sistema sea modular, testeable y retrocompatible.

Operaciones previstas incluyen, entre otras:

- Surfacing.
- Edge Surfacing.
- Pocket.
- Contour.
- Slots.
- Drilling.
- Neck Radius.
- Body Outline.
- Pickup Cavities.
- Control Cavities.
- Jack Hole.
- Bridge Holes.
- String Through.
- Truss Rod.
- Inlays.
- Templates.
- Custom Toolpaths.

## 2. Principio central

Una operación nunca debe generar G-code directamente como modelo principal.

Flujo correcto:

```text
Formulario -> validate() -> Operation -> generateToolpath() -> simulate() -> PostProcessor -> GCode
```

Flujo prohibido:

```text
Operation -> GCode
```

El G-code es solo salida final producida por un `PostProcessor`.

## 3. Contrato conceptual de una operación

Toda operación debe exponer la misma interfaz conceptual:

```text
OperationPlugin
- metadata
- getDefaults(context)
- getInputSchema(context)
- suggest(parameters, context)
- validate(parameters, context)
- generateToolpath(parameters, context)
- estimateTime(toolpath, context)
- simulate(toolpath, context)
- export(result, context)
- getGoldenCases()
```

Este bloque es diseño de API, no implementación.

## 4. Metadata

### Responsabilidad

Describe la operación para UI, documentación, pruebas y compatibilidad.

### Campos

- `id`: identificador estable, por ejemplo `surfacing`.
- `name`: nombre visible.
- `category`: categoría funcional.
- `version`: versión de la operación.
- `description`: descripción corta.
- `supportsSimulation`: si produce datos simulables.
- `supportedPostProcessors`: postprocesadores compatibles.
- `requiredCapabilities`: capacidades necesarias.

### Ejemplo

```json
{
  "id": "surfacing",
  "name": "Surfacing",
  "category": "surface_preparation",
  "version": "1.0.0",
  "description": "Planea una superficie con patrón zig-zag.",
  "supportsSimulation": true,
  "supportedPostProcessors": ["grbl", "fluidnc", "linuxcnc", "mach3", "marlin", "masso", "centroid"],
  "requiredCapabilities": ["linearMoves", "spindle", "dwell", "comments"]
}
```

## 5. Contexto común

Todas las funciones de operación reciben un `context` con información externa.

### Campos esperados

- `project`: proyecto actual.
- `machine`: máquina seleccionada.
- `tool`: herramienta seleccionada.
- `material`: material seleccionado.
- `settings`: configuración activa.
- `postProcessor`: postprocesador previsto.
- `units`: unidades activas.

La operación debe leer contexto, pero no modificarlo de forma destructiva.

## 6. getDefaults(context)

### Responsabilidad

Devuelve valores iniciales seguros y simples para la UI.

### Reglas

- Debe usar `Tool`, `Material`, `Machine` y `Settings` cuando existan.
- Debe preferir seguridad sobre agresividad.
- No debe ocultar valores críticos al usuario si afectan seguridad.

### Salida conceptual

```json
{
  "safeZ": 5,
  "feedRate": 600,
  "plungeRate": 100,
  "spindleRpm": 1000,
  "stepover": 3
}
```

## 7. getInputSchema(context)

### Responsabilidad

Describe los campos que la UI debe mostrar.

### Reglas

- Debe separar campos básicos y avanzados.
- Debe incluir unidades, etiquetas y ayudas.
- Debe permitir una UI simple sin hardcodear cada operación.

### Salida conceptual

```json
{
  "basic": [
    { "name": "widthX", "type": "number", "label": "Ancho X", "units": "mm", "required": true },
    { "name": "lengthY", "type": "number", "label": "Largo Y", "units": "mm", "required": true }
  ],
  "advanced": [
    { "name": "startDirection", "type": "select", "label": "Dirección inicial", "options": ["positiveY", "negativeY"] }
  ]
}
```

## 8. suggest(parameters, context)

### Responsabilidad

Calcula sugerencias automáticas sin sobrescribir silenciosamente valores del usuario.

### Entradas

- Parámetros actuales.
- Máquina.
- Herramienta.
- Material.
- Settings.

### Salidas

- RPM sugeridas.
- Feedrate sugerido.
- Plunge sugerido.
- Stepover sugerido.
- Número de pasadas sugerido.
- Tiempo estimado preliminar.
- Advertencias informativas.

### Reglas

- Las sugerencias deben indicar fuente y razón.
- La UI debe permitir aceptar o ignorar sugerencias.
- Una sugerencia no debe modificar el `Toolpath` si el usuario no la aceptó.

## 9. validate(parameters, context)

### Responsabilidad

Valida si una operación puede generar toolpath de forma segura.

### Salida

Debe devolver un objeto `Validation` con:

- `isValid`.
- `errors`.
- `warnings`.
- `info`.

### Reglas

- Errores bloquean generación.
- Advertencias permiten generación, pero deben mostrarse.
- Las validaciones deben ser deterministas.
- Deben validarse límites de máquina, herramienta, material y operación.

### Ejemplo de errores

- Distancia X menor o igual a cero.
- Feedrate menor o igual a cero.
- Profundidad mayor que longitud útil.
- Operación fuera del área de trabajo.

## 10. generateToolpath(parameters, context)

### Responsabilidad

Genera un `Toolpath` neutral.

### Reglas

- No debe generar G-code final.
- Debe producir movimientos/eventos neutrales.
- Debe incluir comentarios conceptuales cuando aporten claridad.
- Debe ser determinista.
- Debe respetar reglas de seguridad como Z seguro antes de movimientos rápidos.

### Eventos mínimos esperados

- `comment`.
- `setUnits`.
- `spindleOn`.
- `dwell`.
- `rapid`.
- `plunge`.
- `cut`.
- `retract`.
- `spindleOff`.
- `end`.

## 11. estimateTime(toolpath, context)

### Responsabilidad

Calcula tiempo estimado a partir del `Toolpath`, no del G-code.

### Debe considerar

- Distancia de movimientos de corte.
- Distancia de movimientos rápidos.
- Feedrates.
- Plunge rates.
- Dwell.
- Penalizaciones o límites de máquina si se definen.

### Salida conceptual

```json
{
  "seconds": 142,
  "label": "2 min 22 s",
  "breakdown": {
    "rapid": 5,
    "cut": 130,
    "plunge": 4,
    "dwell": 3
  }
}
```

## 12. simulate(toolpath, context)

### Responsabilidad

Produce datos para el simulador 2D.

### Debe poder mostrar

- Trayectoria.
- Sentido.
- Cobertura.
- Traslape.
- Tiempo estimado.
- Tiempo restante.
- Punto inicial.
- Punto final.
- Área mecanizada.
- Área pendiente.

### Reglas

- No debe depender del texto G-code.
- Debe consumir `Toolpath` neutral.
- Debe ser liviano y compatible con uso offline.

## 13. export(result, context)

### Responsabilidad

Entrega un paquete neutral para que el resto del sistema lo use.

### Contenido esperado

- `operation`.
- `validation`.
- `toolpath`.
- `simulation`.
- `estimates`.
- `warnings`.
- `metadata`.

`export()` no debe saltarse el `PostProcessor`. Si se necesita G-code, el paquete se envía al postprocesador seleccionado.

## 14. getGoldenCases()

### Responsabilidad

Enumera casos de prueba conocidos para Golden Files.

### Reglas

- Cada operación debe tener al menos un caso básico.
- Los casos deben ser pequeños, deterministas y legibles.
- No deben actualizar Golden Files automáticamente.

### Caso conceptual

```json
{
  "id": "surfacing_basic_410x210",
  "description": "Surfacing básico con valores actuales del HTML",
  "parametersFile": "tests/golden/surfacing/basic.params.json",
  "expectedGcodeFile": "tests/golden/surfacing/basic.expected.gcode",
  "postProcessor": "grbl"
}
```

## 15. Ciclo completo de una operación

```text
1. UI pide defaults: getDefaults(context)
2. UI renderiza campos: getInputSchema(context)
3. UI solicita sugerencias: suggest(parameters, context)
4. Usuario confirma parámetros
5. Operación valida: validate(parameters, context)
6. Si hay errores, se detiene
7. Si solo hay advertencias, se muestran y se permite continuar
8. Operación genera Toolpath: generateToolpath(parameters, context)
9. Sistema estima tiempo: estimateTime(toolpath, context)
10. Sistema simula: simulate(toolpath, context)
11. PostProcessor genera G-code final
12. Golden Files comparan salida cuando aplica
```

## 16. Requisitos para agregar una operación nueva

Antes de implementar una operación nueva se debe documentar:

- Objetivo.
- Parámetros básicos.
- Parámetros avanzados.
- Defaults.
- Validaciones.
- Sugerencias.
- Toolpath esperado.
- Reglas de simulación.
- Golden Files necesarios.
- Riesgos de seguridad.
- Impacto en compatibilidad.

## 17. Retrocompatibilidad

- Una operación nueva debe extender el sistema, no reemplazar operaciones existentes.
- Cambiar el contrato de operación requiere versionado.
- Cambiar salida G-code requiere aprobación y revisión Golden File.
- La operación de Surfacing actual debe protegerse antes de refactorizarse.

## 18. Postprocesadores soportados por la API

La API debe permitir que cualquier operación genere el mismo `Toolpath` neutral y que los siguientes postprocesadores lo traduzcan sin cambiar el núcleo:

- GRBL inicial.
- FluidNC.
- LinuxCNC.
- Mach3.
- Marlin.
- Masso.
- Centroid.

## 19. Lo que una operación no debe hacer

Una operación no debe:

- Leer directamente campos del DOM.
- Escribir directamente en el textarea de salida.
- Descargar archivos.
- Copiar al portapapeles.
- Emitir G-code final como modelo interno.
- Modificar Golden Files.
- Cambiar settings globales sin acción explícita del usuario.
