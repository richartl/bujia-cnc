# Diseño de arquitectura del CAM ligero CNC

## 1. Propósito de este documento

Este documento define la arquitectura completa prevista para convertir el proyecto en un CAM ligero especializado para CNC, orientado principalmente a luthería y carpintería.

Debe servir como referencia para cualquier persona o IA que trabaje en este repositorio durante los próximos años. Antes de implementar cambios funcionales, este diseño debe consultarse junto con `README.md`, el resto de `docs/`, `CHANGELOG.md` y las reglas de compatibilidad del proyecto.

## 2. Visión del producto

El proyecto no debe limitarse a generar G-code para surfacing. La meta es construir una herramienta CAM ligera capaz de generar G-code para operaciones repetitivas sin depender de Aspire, Fusion u otro CAM completo cuando el trabajo sea sencillo y recurrente.

La filosofía principal es:

- Muy poderoso internamente.
- Extremadamente sencillo para el usuario.
- Todo debe funcionar offline.
- Sin servidor.
- Sin dependencias externas.
- HTML + CSS + JavaScript puro.
- Abrir el HTML y comenzar a trabajar.

La simplicidad de uso nunca debe sacrificarse por complejidad interna. Si una decisión técnica hace más difícil usar la app desde un archivo HTML local, esa decisión debe rechazarse o requerir aprobación explícita.

## 3. Estado actual que no debe romperse

La implementación funcional actual vive en `index.html`. Es una página HTML autocontenida con CSS y JavaScript embebidos que genera G-code de surfacing desde el navegador.

Funciones actuales que deben preservarse hasta que exista aprobación explícita para cambiarlas:

- Generación de surfacing CNC en patrón zig-zag.
- Entradas de X, Y, pasadas Z, profundidad Z, feedrate XY, plunge, stepover, diámetro de fresa, spindle, Z seguro, nombre de archivo y dirección inicial.
- Sugerencia de stepover basada en diámetro de herramienta.
- Generación de G-code con `G21`, `G90`, `G94`, `M3 S`, `G4 P3`, movimientos seguros, `M5` y `M30`.
- Visualización del G-code en pantalla.
- Descarga como `.nc`, `.gcode` o `.tap`.
- Copia al portapapeles.
- Validaciones básicas y advertencia si stepover supera el diámetro de la herramienta.

Cualquier refactor, modularización o mejora debe poder demostrar que no cambió el G-code de salida salvo que el cambio haya sido revisado y aprobado.

## 4. Reglas obligatorias antes de cualquier cambio futuro

Antes de modificar archivos, siempre se debe:

1. Leer `README.md`.
2. Leer todos los documentos dentro de `docs/`.
3. Verificar los requerimientos actuales.
4. Revisar la arquitectura.
5. Revisar el roadmap.
6. Revisar `CHANGELOG.md`.
7. Confirmar qué archivos se modificarán.
8. Explicar exactamente qué cambios se harán.
9. Explicar qué funcionalidades podrían verse afectadas.
10. Si se modifica cualquier comportamiento existente, detenerse y solicitar aprobación.

Reglas de compatibilidad:

- Nunca romper compatibilidad sin aprobación.
- Nunca eliminar funcionalidades existentes sin aprobación.
- Nunca cambiar el formato del G-code sin avisar y recibir aprobación.
- Nunca modificar automáticamente Golden Files.
- Nunca introducir dependencias externas sin aprobación explícita.
- Nunca requerir servidor, build step o framework para usar la app básica.

## 5. Principios de experiencia de usuario

La interfaz debe estar diseñada para usuarios de taller, no para expertos en G-code.

Principios:

- El usuario debe llenar la menor cantidad posible de campos.
- La app debe sugerir automáticamente valores seguros cuando sea posible.
- El usuario nunca debe necesitar conocer G-code.
- La lógica compleja debe permanecer escondida detrás de una interfaz simple.
- Las advertencias deben ser claras, accionables y escritas en lenguaje humano.
- Los valores avanzados deben existir, pero no saturar la vista principal.
- Las operaciones repetitivas deben poder configurarse rápido.
- La app debe priorizar seguridad, claridad y repetibilidad.

Sugerencias automáticas esperadas:

- RPM.
- Feedrate.
- Plunge.
- Stepover.
- Número de pasadas.
- Tiempo estimado.
- Advertencias.

## 6. Principios técnicos

El software debe crecer durante años sin reescribirse. Para eso, la arquitectura debe separar conceptos y responsabilidades.

Principios técnicos:

- Cada operación debe tener su propio módulo.
- Cada módulo debe ser independiente.
- La lógica de dominio no debe depender directamente del DOM.
- La generación de toolpaths no debe depender del postprocesador.
- El postprocesador no debe conocer detalles de UI.
- El simulador debe consumir toolpaths normalizados, no G-code crudo como única fuente.
- Los módulos deben comunicarse con objetos de datos simples.
- Los valores deben manejarse explícitamente en milímetros y mm/min salvo que una configuración futura indique lo contrario.
- La arquitectura debe permitir varios postprocesadores sin cambiar operaciones.
- La arquitectura debe permitir varias operaciones sin cambiar postprocesadores.
- La arquitectura debe permitir pruebas deterministas.

## 7. Modelo conceptual principal

La arquitectura debe contemplar estos conceptos desde el inicio, aunque no todos estén implementados inicialmente:

- `Machine`
- `Tool`
- `Material`
- `Project`
- `Operation`
- `Toolpath`
- `PostProcessor`
- `GCodeGenerator`
- `Simulation`
- `Settings`

### 7.1 Machine

Representa la máquina CNC objetivo.

Responsabilidades:

- Definir límites de trabajo.
- Definir capacidades del controlador.
- Definir velocidad máxima segura.
- Definir altura Z segura por defecto.
- Definir postprocesador por defecto.
- Definir convenciones de spindle, unidades y comandos soportados.

Campos previstos:

- `id`
- `name`
- `controllerType`
- `workAreaX`
- `workAreaY`
- `workAreaZ`
- `defaultSafeZ`
- `maxFeedRate`
- `maxPlungeRate`
- `spindleMinRpm`
- `spindleMaxRpm`
- `supportedPostProcessors`
- `notes`

### 7.2 Tool

Representa una herramienta de corte disponible.

Campos mínimos:

- `id`
- `name`
- `diameter`
- `type`
- `usableLength`
- `flutes`
- `material`
- `recommendedRpm`
- `recommendedFeed`
- `recommendedPlunge`
- `recommendedStepover`
- `notes`

Tipos previstos:

- Fresa plana.
- Fresa de bola.
- Fresa en V.
- Broca.
- Fresa de desbaste.
- Fresa de acabado.
- Herramienta personalizada.

### 7.3 Material

Representa el material a mecanizar.

Campos mínimos:

- `id`
- `name`
- `type`
- `hardness`
- `recommendedFeed`
- `recommendedRpm`
- `recommendedPlunge`
- `observations`

Tipos previstos:

- Madera blanda.
- Madera dura.
- MDF.
- Contrachapado.
- Plástico.
- Aluminio liviano, si se aprueba en el futuro.
- Material personalizado.

### 7.4 Project

Representa el trabajo que el usuario está preparando.

Responsabilidades:

- Agrupar máquina, material, herramientas y operaciones.
- Mantener unidades y origen de trabajo.
- Mantener metadatos de archivo.
- Servir como contenedor exportable/importable en el futuro.

Campos previstos:

- `id`
- `name`
- `machineId`
- `materialId`
- `operations`
- `units`
- `workOrigin`
- `createdAt`
- `updatedAt`
- `notes`

### 7.5 Operation

Representa una operación CAM concreta.

Responsabilidades:

- Definir parámetros de entrada.
- Validar parámetros.
- Sugerir valores.
- Generar un `Toolpath` neutral.
- Proveer metadatos para UI.
- Proveer advertencias específicas.

Cada operación debe ser independiente. Una operación no debe modificar estado global ni depender de otra operación para generar su toolpath.

Interfaz conceptual:

```text
OperationDefinition
- id
- name
- category
- version
- inputSchema
- defaults
- suggest(context)
- validate(parameters, context)
- generateToolpath(parameters, context)
- estimate(parameters, context)
```

Nota: este bloque es pseudodiseño documental, no implementación.

### 7.6 Toolpath

Representa la trayectoria neutral antes de convertirla a G-code.

Responsabilidades:

- Describir movimientos sin acoplarse a un controlador específico.
- Distinguir movimientos rápidos, cortes, plunge, retracciones y cambios de modo.
- Permitir simulación 2D.
- Permitir estimación de tiempo.
- Servir como entrada para postprocesadores.

Elementos previstos:

- `rapidMove`
- `linearMove`
- `plungeMove`
- `retractMove`
- `spindleOn`
- `spindleOff`
- `dwell`
- `comment`
- `setUnits`
- `setAbsoluteMode`
- `setRelativeMode`
- `setFeedRate`
- `programEnd`

### 7.7 PostProcessor

Convierte un `Toolpath` neutral en G-code específico para un controlador.

Responsabilidades:

- Emitir comandos compatibles con el controlador.
- Encapsular diferencias entre GRBL, FluidNC, Mach3, LinuxCNC, Marlin, Masso y Centroid.
- Definir formato numérico.
- Definir encabezados y cierres de programa.
- Definir comandos de spindle, dwell, unidades y finalización.

Postprocesadores previstos:

- Inicial: GRBL.
- Futuros: FluidNC, Mach3, LinuxCNC, Marlin, Masso, Centroid.

La arquitectura no debe requerir cambios en operaciones para agregar un nuevo postprocesador.

### 7.8 GCodeGenerator

Orquesta la conversión desde operación hasta texto final.

Responsabilidades:

- Recibir proyecto, operación, máquina, herramienta, material y settings.
- Ejecutar validaciones.
- Generar toolpath neutral.
- Seleccionar postprocesador.
- Producir G-code comentado y legible.
- Adjuntar advertencias y metadatos.
- Mantener salida determinista para Golden Files.

### 7.9 Simulation

Representa la simulación 2D futura.

Responsabilidades:

- Consumir `Toolpath` neutral.
- Mostrar trayectoria de herramienta.
- Mostrar sentido del corte.
- Mostrar área mecanizada.
- Mostrar área pendiente.
- Mostrar cobertura.
- Mostrar traslape.
- Mostrar punto inicial.
- Mostrar punto final.
- Mostrar tiempo estimado.
- Mostrar tiempo restante durante una simulación visual.

La simulación no debe ser 3D inicialmente. Debe mantenerse ligera y funcionar offline.

### 7.10 Settings

Representa preferencias globales.

Campos previstos:

- Unidad por defecto.
- Máquina por defecto.
- Postprocesador por defecto.
- Z seguro por defecto.
- Extensión de archivo por defecto.
- Decimales de salida.
- Idioma de interfaz.
- Preferencias de advertencias.
- Preferencias de simulación.

## 8. Operaciones previstas

La arquitectura debe soportar las siguientes operaciones sin rediseño mayor:

- Surfacing.
- Edge Surfacing.
- Pocket.
- Contour.
- Drilling.
- Slots.
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

### 8.1 Categorías de operación

- Preparación de superficie: `Surfacing`, `Edge Surfacing`.
- Cavidades: `Pocket`, `Pickup Cavities`, `Control Cavities`.
- Perímetros: `Contour`, `Body Outline`, `Templates`.
- Perforaciones: `Drilling`, `Bridge Holes`, `String Through`, `Jack Hole`.
- Canales: `Slots`, `Truss Rod`.
- Luthería especializada: `Neck Radius`, `Inlays`.
- Avanzadas: `Custom Toolpaths`.

### 8.2 Contrato de una operación

Cada operación debe definir:

- Identificador estable.
- Nombre visible.
- Versión de operación.
- Parámetros mínimos para usuario básico.
- Parámetros avanzados opcionales.
- Defaults seguros.
- Reglas de validación.
- Reglas de sugerencia.
- Advertencias.
- Generador de toolpath neutral.
- Estimador de tiempo.
- Casos Golden File.

## 9. Arquitectura de carpetas propuesta

Esta estructura es una propuesta de diseño. No debe implementarse hasta recibir aprobación.

```text
/
├── index.html
├── README.md
├── CHANGELOG.md
├── docs/
│   ├── architecture.md
│   ├── design.md
│   ├── examples.md
│   ├── gcode-spec.md
│   ├── requirements.md
│   ├── roadmap.md
│   └── tool-library.md
├── css/
│   └── app.css
├── js/
│   ├── app.js
│   ├── core/
│   │   ├── machine.js
│   │   ├── material.js
│   │   ├── operation.js
│   │   ├── project.js
│   │   ├── settings.js
│   │   ├── tool.js
│   │   └── toolpath.js
│   ├── data/
│   │   ├── defaultMachines.js
│   │   ├── defaultMaterials.js
│   │   └── defaultTools.js
│   ├── generator/
│   │   ├── gcodeGenerator.js
│   │   └── operations/
│   │       ├── surfacing.js
│   │       ├── edgeSurfacing.js
│   │       ├── pocket.js
│   │       ├── contour.js
│   │       ├── drilling.js
│   │       └── customToolpath.js
│   ├── postprocessors/
│   │   ├── grbl.js
│   │   ├── fluidnc.js
│   │   ├── mach3.js
│   │   ├── linuxcnc.js
│   │   ├── marlin.js
│   │   ├── masso.js
│   │   └── centroid.js
│   ├── simulation/
│   │   ├── simulator2d.js
│   │   ├── coverage.js
│   │   └── timeEstimator.js
│   ├── ui/
│   │   ├── forms.js
│   │   ├── operationPanel.js
│   │   ├── preview.js
│   │   ├── warnings.js
│   │   └── download.js
│   └── utils/
│       ├── formatting.js
│       ├── geometry.js
│       ├── validation.js
│       └── units.js
└── tests/
    ├── golden/
    │   ├── surfacing/
    │   │   ├── basic.params.json
    │   │   └── basic.expected.gcode
    │   └── pocket/
    ├── runners/
    │   └── goldenRunner.js
    └── reports/
```

## 10. Flujo de datos propuesto

El flujo ideal debe ser:

1. El usuario selecciona una operación.
2. La UI muestra campos mínimos y sugerencias.
3. La app construye un objeto de parámetros.
4. La operación valida parámetros y contexto.
5. La operación genera un `Toolpath` neutral.
6. El simulador consume el `Toolpath` neutral para vista previa.
7. El `GCodeGenerator` envía el `Toolpath` al `PostProcessor` seleccionado.
8. El postprocesador genera G-code final.
9. La UI muestra G-code, advertencias, tiempo estimado y opciones de descarga.
10. Las pruebas Golden File pueden comparar la salida con el resultado esperado.

## 11. Separación UI / dominio / salida

La arquitectura debe separar tres capas:

### 11.1 UI

Responsable de:

- Mostrar formularios.
- Recoger entradas.
- Mostrar sugerencias.
- Mostrar advertencias.
- Mostrar vista previa.
- Descargar/copiar resultados.

No debe contener reglas profundas de G-code ni geometría compleja.

### 11.2 Dominio CAM

Responsable de:

- Validaciones de operación.
- Sugerencias.
- Geometría.
- Toolpaths.
- Estimaciones.

No debe depender del DOM.

### 11.3 Salida / postprocesado

Responsable de:

- Convertir toolpaths en G-code.
- Formatear números.
- Emitir comandos del controlador.
- Mantener salida legible y comentada.

No debe depender de la UI.

## 12. Postprocesadores

### 12.1 GRBL inicial

El postprocesador GRBL debe cubrir el comportamiento actual antes de ampliarse:

- `G21` para milímetros.
- `G90` para absoluto.
- `G91` para relativo cuando la operación lo requiera.
- `G94` para feedrate por minuto.
- `M3 S(valor)` para spindle.
- `G4 P(valor)` para dwell.
- `M5` para apagar spindle.
- `M30` para terminar.

### 12.2 Reglas para nuevos postprocesadores

Para agregar un postprocesador:

- No se deben modificar operaciones existentes.
- No se debe modificar el modelo `Toolpath` salvo necesidad aprobada.
- Debe añadirse una suite Golden File específica.
- Deben documentarse diferencias de dialecto.
- Deben conservarse comentarios legibles cuando el controlador lo permita.

## 13. Simulador 2D previsto

El simulador debe ser liviano y funcionar offline.

Elementos visuales previstos:

- Trayectoria de la herramienta.
- Sentido del corte.
- Área mecanizada.
- Área pendiente.
- Cobertura.
- Traslape.
- Punto inicial.
- Punto final.
- Tiempo estimado.
- Tiempo restante.

### 13.1 Entrada del simulador

El simulador debe consumir `Toolpath`, no depender exclusivamente del texto G-code. Esto evita tener que parsear dialectos diferentes para mostrar trayectorias.

### 13.2 Salida del simulador

La salida puede ser inicialmente un canvas 2D o SVG generado con JavaScript puro. No debe requerir librerías externas.

## 14. Biblioteca de herramientas

La biblioteca de herramientas debe poder existir como datos locales editables.

Cada herramienta debe contener como mínimo:

- Nombre.
- Diámetro.
- Tipo.
- Longitud útil.
- Número de filos.
- Material.
- RPM recomendadas.
- Feed recomendado.
- Plunge recomendado.
- Stepover recomendado.
- Notas.

### 14.1 Uso de la biblioteca

La biblioteca no debe imponer valores de forma opaca. Debe sugerirlos y permitir que el usuario los revise.

Uso previsto:

- Seleccionar herramienta.
- Poblar campos recomendados.
- Calcular stepover sugerido.
- Calcular número de pasadas sugerido.
- Mostrar advertencias si la herramienta parece inadecuada.

## 15. Biblioteca de materiales

La biblioteca de materiales debe almacenar recomendaciones por material.

Cada material debe contener:

- Nombre.
- Tipo.
- Dureza.
- Feed recomendado.
- RPM recomendadas.
- Plunge recomendado.
- Observaciones.

### 15.1 Uso de la biblioteca

La biblioteca de materiales debe combinarse con herramienta y máquina para producir sugerencias, no decisiones obligatorias.

Ejemplo conceptual:

- Material duro + herramienta pequeña = feed más conservador.
- Material blando + herramienta grande = stepover más agresivo permitido.
- Máquina limitada = advertencia si feed excede capacidades.

## 16. Sistema de sugerencias

El sistema de sugerencias debe ser una capa separada de la UI.

Entradas:

- Máquina.
- Herramienta.
- Material.
- Operación.
- Parámetros actuales.
- Settings.

Salidas:

- RPM sugeridas.
- Feedrate sugerido.
- Plunge sugerido.
- Stepover sugerido.
- Pasadas Z sugeridas.
- Tiempo estimado.
- Advertencias.

Regla importante: una sugerencia no debe sobrescribir silenciosamente un valor editado por el usuario.

## 17. Validación y advertencias

La validación debe producir mensajes estructurados.

Niveles:

- `error`: bloquea generación.
- `warning`: permite generación, pero advierte riesgo.
- `info`: ayuda contextual.

Ejemplos:

- Error: X o Y menor o igual a cero.
- Error: feedrate menor o igual a cero.
- Warning: stepover mayor que diámetro de herramienta.
- Warning: profundidad por pasada alta para material/herramienta.
- Info: stepover recomendado entre 30% y 50% del diámetro.

## 18. Seguridad del G-code

Reglas globales:

- Declarar unidades explícitamente.
- Declarar modo absoluto o relativo explícitamente.
- Subir a Z seguro antes de movimientos rápidos XY.
- No moverse a origen cortando.
- Encender spindle antes de bajar en Z.
- Esperar después de encender spindle.
- Subir a Z seguro antes de volver al origen al final.
- Apagar spindle al finalizar.
- Generar G-code legible y comentado.

Estas reglas deben vivir en validaciones, postprocesadores y pruebas Golden File.

## 19. Golden Files

El proyecto debe prepararse para pruebas Golden File para evitar regresiones.

### 19.1 Objetivo

Cada operación tendrá conjuntos de parámetros conocidos. Al correr pruebas, la app debe generar G-code nuevamente y compararlo con un archivo esperado.

Si el resultado cambia, debe indicarse:

- Qué cambió.
- Dónde cambió.
- Por qué cambió, si se conoce.

### 19.2 Regla crítica

Nunca modificar automáticamente los Golden Files.

Actualizar un Golden File debe ser una acción manual, explícita y revisada porque implica aceptar un cambio en el G-code.

### 19.3 Estructura conceptual de un caso Golden File

```text
tests/golden/<operation>/<case>.params.json
tests/golden/<operation>/<case>.expected.gcode
tests/golden/<operation>/<case>.meta.json
```

### 19.4 Reporte de diferencias

El reporte debe mostrar:

- Operación.
- Caso.
- Postprocesador.
- Primera línea diferente.
- Bloque esperado.
- Bloque generado.
- Resumen de líneas agregadas, eliminadas o modificadas.

### 19.5 Determinismo

Para que las pruebas sean confiables:

- El orden de comentarios debe ser estable.
- Los decimales deben ser estables.
- No debe incluirse fecha/hora en G-code probado, salvo que pueda desactivarse.
- Los defaults deben versionarse.
- El postprocesador debe tener salida determinista.

## 20. Estrategia de migración desde el HTML actual

La migración debe ser gradual y segura.

### 20.1 Fase A: Documentación

- Documentar comportamiento actual.
- Documentar arquitectura objetivo.
- Documentar riesgos.
- No cambiar lógica.

### 20.2 Fase B: Pruebas de regresión

- Capturar parámetros actuales.
- Capturar salida G-code actual.
- Crear primer Golden File de surfacing.
- Crear runner simple sin dependencias externas.

### 20.3 Fase C: Extracción sin cambio funcional

- Extraer helpers puros.
- Extraer validación.
- Extraer generación de surfacing.
- Comparar con Golden Files.
- No cambiar UI ni salida.

### 20.4 Fase D: Toolpath neutral

- Introducir representación neutral.
- Mantener salida GRBL idéntica mediante Golden Files.
- Conectar simulador 2D al toolpath.

### 20.5 Fase E: Nuevas operaciones

- Agregar operaciones una por una.
- Cada operación debe tener Golden Files.
- Cada operación debe documentarse antes de implementarse.

## 21. Riesgos principales

### 21.1 Riesgo: perder simplicidad

Mitigación:

- Mantener modo básico por defecto.
- Ocultar opciones avanzadas.
- Preservar abrir HTML y trabajar.

### 21.2 Riesgo: cambiar G-code accidentalmente

Mitigación:

- Golden Files.
- Revisión explícita.
- No tocar postprocesador sin pruebas.

### 21.3 Riesgo: acoplar UI con lógica CAM

Mitigación:

- Dominio sin DOM.
- Objetos simples.
- Pruebas sobre funciones puras.

### 21.4 Riesgo: arquitectura demasiado grande

Mitigación:

- Diseñar para crecer, implementar por fases.
- No crear módulos vacíos innecesarios sin propósito inmediato.
- Priorizar surfacing estable antes de nuevas operaciones.

### 21.5 Riesgo: dependencias externas

Mitigación:

- JavaScript puro.
- Canvas/SVG nativo.
- Tests con scripts simples compatibles con entorno local.

## 22. Criterios para aceptar cambios futuros

Un cambio futuro debe responder:

- ¿Qué archivo cambia?
- ¿Qué función cambia?
- ¿Qué comportamiento cambia?
- ¿Qué riesgo existe?
- ¿Qué alternativa se propone?
- ¿Cambia el G-code generado?
- ¿Requiere actualizar Golden Files?
- ¿Mantiene ejecución offline?
- ¿Mantiene uso sin servidor?
- ¿Mantiene uso sin build?

Si la respuesta indica cambio funcional o cambio de G-code, se debe pedir aprobación antes de implementarlo.

## 23. Definición de terminado para nuevas operaciones

Una operación nueva no debe considerarse completa hasta tener:

- Documento de especificación.
- Parámetros básicos y avanzados definidos.
- Validaciones.
- Sugerencias.
- Toolpath neutral.
- Postprocesado GRBL.
- Golden Files.
- Advertencias de seguridad.
- UI simple.
- Ejemplo de uso.
- Entrada en changelog.

## 24. Decisiones pendientes

Antes de implementar la arquitectura, se deben decidir o aprobar:

- Si la lógica seguirá embebida temporalmente en `index.html` o se moverá a archivos `js/` por fases.
- El formato exacto de los objetos de datos.
- El primer formato de Golden Files.
- Si las bibliotecas de herramientas y materiales se guardarán inicialmente en JavaScript, JSON local o almacenamiento del navegador.
- Cómo se gestionarán presets del usuario sin servidor.
- Qué nivel de soporte se dará a navegadores antiguos.

## 25. Próximo paso recomendado

El próximo paso no debe ser implementar nuevas operaciones. El próximo paso recomendado es aprobar este diseño y luego crear un plan de migración mínimo para proteger el surfacing actual con Golden Files antes de refactorizar cualquier lógica.

Hasta recibir aprobación, no se debe escribir código de implementación ni modificar la lógica existente del generador.
