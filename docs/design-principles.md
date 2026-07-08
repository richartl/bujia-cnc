# Design Principles: Constitución del proyecto

## Propósito de este documento

Este es el documento más importante del proyecto. Debe ser el primer documento que lea cualquier desarrollador humano o IA antes de proponer, diseñar o modificar cualquier parte del software.

Este documento define la filosofía, los principios y las reglas que no deben romperse. La arquitectura, el código, las pruebas y la interfaz deben obedecer estos principios.

Si existe conflicto entre agregar una función y mantener la simplicidad del proyecto, gana la simplicidad.

## Filosofía del proyecto

Este proyecto será un CAM ligero especializado para CNC, orientado principalmente a luthería, carpintería, prototipado y CNC hobby.

La prioridad del proyecto no es acumular funciones. La prioridad es construir una herramienta extremadamente sencilla de usar, confiable y rápida para operaciones repetitivas.

El software debe ser:

- Extremadamente sencillo para el usuario.
- Poderoso internamente.
- Simple externamente.
- Capaz de pensar por el usuario.
- Capaz de sugerir configuraciones seguras.
- Capaz de crecer sin perder claridad.

La mejor interfaz es aquella donde el usuario llena la menor cantidad posible de datos. Si el software puede calcular, sugerir o inferir un valor de forma segura, no debe obligar al usuario a escribirlo.

El usuario ideal no debe necesitar saber G-code. El usuario debe poder abrir el HTML, seleccionar una operación, revisar pocas opciones, descargar el archivo y trabajar.

## Principios fundamentales

1. **El usuario nunca debería aprender G-code.**
   El G-code es una salida técnica final, no el lenguaje de interacción del usuario.

2. **Nunca pedir información que el software pueda calcular.**
   Si una velocidad, stepover, profundidad por pasada, tiempo o advertencia puede derivarse de máquina, herramienta, material y operación, el software debe sugerirlo.

3. **Siempre sugerir la configuración más segura.**
   Las sugerencias deben ser conservadoras por defecto. La velocidad de trabajo nunca debe tener prioridad sobre seguridad, claridad y previsibilidad.

4. **Nunca complicar la interfaz para resolver casos poco comunes.**
   Los casos avanzados deben existir como opciones avanzadas, no contaminar la experiencia principal.

5. **La simplicidad tiene prioridad sobre agregar funciones.**
   Una función que vuelve la herramienta confusa debe rediseñarse, ocultarse o rechazarse.

6. **El software debe crecer mediante módulos.**
   Cada operación, postprocesador, simulador o biblioteca debe poder agregarse sin romper el núcleo.

7. **Nunca modificar funcionalidades existentes sin aprobación.**
   Cualquier cambio de comportamiento debe explicarse y aprobarse antes de implementarse.

8. **Toda funcionalidad nueva debe estar documentada.**
   Si no está documentada, no está lista.

9. **Todo cambio debe mantener compatibilidad hacia atrás.**
   No se deben romper proyectos, parámetros, comportamiento o G-code existente sin una decisión explícita.

10. **El código debe ser fácil de leer antes que inteligente.**
    El código claro, pequeño y predecible vale más que el código compacto, complejo o ingenioso.

## Filosofía de desarrollo

La documentación forma parte del software. No es un accesorio ni una tarea posterior.

Antes de escribir código debe actualizarse o crearse la documentación correspondiente. Los documentos son la fuente de verdad y el código debe reflejar la documentación, nunca al revés.

El flujo correcto de desarrollo es:

```text
Entender documentación existente
↓
Actualizar o crear documentación de diseño
↓
Explicar cambios propuestos
↓
Recibir aprobación si hay cambios funcionales
↓
Implementar
↓
Probar
↓
Actualizar changelog
```

Ningún cambio importante debe entrar al código sin que antes exista una descripción clara de:

- Qué problema resuelve.
- Qué archivos tocará.
- Qué comportamiento cambiará.
- Qué riesgos existen.
- Qué alternativas se consideraron.
- Cómo se conservará compatibilidad.

## Filosofía de arquitectura

El G-code no es el modelo interno del sistema.

El modelo interno debe ser:

```text
Project
↓
Operations
↓
Toolpaths
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

Las operaciones generan `Toolpath` neutral. Los postprocesadores convierten ese `Toolpath` a G-code específico para GRBL, FluidNC, LinuxCNC, Mach3, Marlin, Masso, Centroid u otros controladores futuros.

Esta separación es obligatoria porque permite:

- Simular sin parsear G-code.
- Cambiar postprocesador sin reescribir operaciones.
- Probar la salida con Golden Files.
- Mantener operaciones independientes.
- Agregar nuevas máquinas y controladores sin romper el núcleo.

## Filosofía de la interfaz

La interfaz debe ser:

- Simple.
- Rápida.
- Intuitiva.
- Con pocos botones.
- Con pocos parámetros visibles.
- Con buenas sugerencias.
- Con advertencias claras.
- Capaz de abrirse como archivo local.

El usuario nunca debe sentirse abrumado. La pantalla principal debe enfocarse en la operación actual y mostrar solamente lo necesario para trabajar con seguridad.

Las opciones avanzadas deben permanecer ocultas hasta que el usuario las necesite. El modo básico debe ser suficiente para la mayoría de trabajos repetitivos.

Cada mensaje de la interfaz debe responder una pregunta práctica:

- Qué está pasando.
- Qué riesgo existe.
- Qué valor se recomienda.
- Qué debe hacer el usuario.

## Filosofía del cálculo automático

Siempre que sea posible, el software deberá calcular o sugerir automáticamente:

- RPM.
- Feedrate.
- Plunge.
- Stepover.
- Número de pasadas.
- Tiempo estimado.
- Advertencias.
- Cobertura.

El usuario solamente modificará estos valores si desea hacerlo.

Las sugerencias deben ser transparentes. Cuando el software sugiera un valor, debe poder explicar la razón de forma simple, por ejemplo:

- Basado en el diámetro de la herramienta.
- Basado en el material.
- Basado en la máquina.
- Basado en una regla conservadora.
- Basado en seguridad.

Una sugerencia nunca debe sobrescribir silenciosamente un valor que el usuario ya editó.

## Filosofía de modularidad

Cada operación debe ser completamente independiente.

Agregar una operación nueva nunca debe requerir modificar otras operaciones. Surfacing, Pocket, Contour, Slots, Edge Surfacing, Drilling y cualquier operación futura deben implementar la misma API conceptual.

Cada operación debe encargarse de:

- Definir sus parámetros.
- Proveer defaults seguros.
- Sugerir valores.
- Validar parámetros.
- Generar un Toolpath neutral.
- Proveer datos para simulación.
- Definir casos Golden File.

Cada operación no debe:

- Generar G-code final directamente.
- Leer o escribir directamente en el DOM.
- Descargar archivos.
- Modificar configuraciones globales sin acción explícita.
- Romper operaciones existentes.

## Filosofía del código

El código debe ser:

- Pequeño.
- Modular.
- Legible.
- Documentado.
- Con nombres claros.
- Sin duplicación.
- Sin funciones gigantes.
- Sin archivos gigantes.

El código debe optimizarse para mantenimiento de largo plazo. Una persona o IA debe poder leer un archivo y entender rápidamente:

- Qué hace.
- Qué entradas recibe.
- Qué salida produce.
- Qué no debe hacer.
- Qué riesgos tiene.

Reglas generales:

- Preferir funciones pequeñas con una responsabilidad clara.
- Preferir nombres explícitos sobre nombres cortos.
- Preferir estructuras simples sobre abstracciones innecesarias.
- Evitar lógica duplicada.
- Evitar efectos secundarios ocultos.
- Evitar acoplar UI, dominio, simulación y postprocesado.

## Filosofía de documentación

Todo cambio importante debe reflejarse primero en la documentación correspondiente.

Los documentos principales son:

- `README.md`.
- `docs/requirements.md`.
- `docs/architecture.md`.
- `docs/design.md`.
- `docs/design-principles.md`.
- `docs/domain-model.md`.
- `docs/plugin-api.md`.
- `docs/json-schema.md`.
- `docs/gcode-spec.md`.
- `docs/roadmap.md`.
- `CHANGELOG.md`.

La documentación debe explicar el porqué, no solo el qué.

Una funcionalidad nueva no está terminada hasta que estén documentados:

- Objetivo.
- Parámetros.
- Validaciones.
- Comportamiento esperado.
- Riesgos.
- Compatibilidad.
- Pruebas.
- Cambios en G-code, si existen.

## Filosofía de pruebas

Nunca asumir que un cambio es correcto.

Todo cambio que afecte generación, validación, postprocesado o simulación debe poder compararse contra pruebas deterministas.

La estrategia principal será Golden Files:

- Cada operación tendrá parámetros conocidos.
- Cada operación tendrá salida G-code esperada.
- Cada cambio deberá regenerar la salida.
- Si la salida cambia, se debe mostrar exactamente qué cambió.
- Toda diferencia debe explicarse.
- Nunca se deben actualizar Golden Files automáticamente.

Actualizar un Golden File significa aceptar formalmente un cambio de comportamiento. Por eso debe ser explícito, revisado y documentado.

Las pruebas deben proteger especialmente:

- Formato de G-code.
- Orden de comandos.
- Unidades.
- Modos absoluto/relativo.
- Movimientos a Z seguro.
- Encendido y apagado de spindle.
- Comentarios relevantes.
- Compatibilidad con postprocesadores.

## Filosofía del usuario

El objetivo no es construir un software para ingenieros. El objetivo es construir una herramienta que cualquier persona con una CNC pueda usar en pocos minutos.

El software debe enseñar sin obligar. Debe ayudar al usuario a tomar mejores decisiones, pero no debe exigirle entender todos los detalles internos.

Principios para el usuario:

- Mostrar pocos campos al inicio.
- Sugerir valores seguros.
- Explicar advertencias en lenguaje simple.
- Permitir control avanzado solo cuando se necesite.
- Evitar jerga técnica innecesaria.
- Mantener el flujo de trabajo rápido.

La experiencia ideal es:

```text
Abrir
↓
Seleccionar operación
↓
Revisar valores sugeridos
↓
Generar
↓
Simular o revisar
↓
Descargar G-code
```

## Filosofía del proyecto a largo plazo

Este proyecto debe poder crecer durante muchos años sin reescribirse.

No se debe diseñar para una sola operación. Surfacing es el primer módulo, no el destino final.

El proyecto debe poder agregar en el futuro:

- Nuevas operaciones.
- Nuevos postprocesadores.
- Nuevas máquinas.
- Nuevas herramientas.
- Nuevos materiales.
- Nuevos simuladores.
- Nuevas formas de validación.
- Nuevas estrategias de prueba.

Todo debe diseñarse pensando en agregar módulos sin afectar el núcleo.

No se debe romper compatibilidad para avanzar más rápido. Un proyecto que obliga a reescribir todo cada pocos meses ha fallado en su arquitectura.

## Reglas que nunca deben romperse

- Nunca romper compatibilidad sin aprobación explícita.
- Nunca eliminar funcionalidades existentes sin aprobación explícita.
- Nunca modificar el formato del G-code sin aviso, explicación y aprobación.
- Nunca convertir el G-code en el modelo interno.
- Nunca introducir servidor obligatorio.
- Nunca introducir build obligatorio.
- Nunca introducir frameworks obligatorios.
- Nunca depender de internet para usar la app básica.
- Nunca actualizar Golden Files automáticamente.
- Nunca priorizar una función sobre la simplicidad del usuario.

## Rules for AI Contributors

Estas reglas son obligatorias para cualquier IA que trabaje en este repositorio.

1. **Siempre leer toda la documentación antes de modificar código.**
   Como mínimo: `README.md`, todos los documentos en `docs/`, `CHANGELOG.md`, arquitectura, roadmap, requerimientos, modelo de dominio, API de operaciones, JSON schema y estrategia de pruebas cuando exista.

2. **Nunca modificar funcionalidades sin aprobación.**
   Si un cambio altera comportamiento, G-code, UI, validaciones, defaults, descargas o compatibilidad, detenerse y pedir aprobación.

3. **Siempre explicar los archivos que cambiarán.**
   Antes de implementar, indicar qué archivos se tocarán y por qué.

4. **Siempre explicar los riesgos.**
   Incluir riesgos de compatibilidad, regresión, salida G-code, usabilidad y mantenimiento.

5. **Siempre explicar las alternativas.**
   Proponer al menos una alternativa cuando haya riesgo o cambio funcional.

6. **Siempre actualizar la documentación.**
   La documentación debe cambiar antes o junto con el código, nunca después como idea secundaria.

7. **Nunca romper compatibilidad.**
   Si parece necesario romper compatibilidad, debe documentarse y solicitar aprobación explícita.

8. **Nunca eliminar funcionalidades.**
   Extender siempre es preferible a reemplazar. Eliminar requiere aprobación explícita.

9. **Siempre proponer primero. Implementar después.**
   Para cambios funcionales, primero presentar análisis, plan, riesgos y alternativas. Solo implementar después de aprobación.

10. **Nunca asumir que el cambio es seguro.**
    Verificar con pruebas, Golden Files o comparación manual documentada según corresponda.

11. **Nunca modificar `index.html` o la lógica actual sin protección de regresión.**
    El generador actual de surfacing es comportamiento existente y debe protegerse antes de refactorizarse.

12. **Nunca hacer el sistema más difícil de usar para demostrar arquitectura.**
    La arquitectura existe para preservar simplicidad, no para impresionar.

## Criterio final de decisión

Ante cualquier duda, elegir la opción que mantenga:

1. Mayor simplicidad para el usuario.
2. Mayor compatibilidad hacia atrás.
3. Mayor claridad documental.
4. Menor riesgo sobre G-code existente.
5. Mayor facilidad de mantenimiento a largo plazo.

Si una propuesta no cumple estos criterios, debe rediseñarse antes de implementarse.
