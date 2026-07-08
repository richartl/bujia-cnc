# Architecture Rules: Reglas técnicas absolutas del proyecto

## Propósito

Este documento es una extensión técnica de `docs/design-principles.md`. Define las reglas arquitectónicas absolutas del proyecto y debe leerse antes de proponer cualquier cambio estructural, dependencia, herramienta, módulo o flujo de ejecución.

Estas reglas existen para proteger la portabilidad, longevidad, simplicidad, compatibilidad offline y mantenibilidad del CAM ligero CNC.

Estas reglas nunca deberán romperse sin una aprobación explícita, documentada y excepcional.

## La regla más importante del proyecto

Este software siempre deberá poder ejecutarse simplemente abriendo:

```text
index.html
```

No importa cuánto crezca el proyecto.

No importa cuántos módulos existan.

No importa cuántas operaciones existan.

Siempre deberá funcionar así:

```text
Doble click
↓
index.html
↓
La aplicación funciona
```

Esta regla es innegociable.

El proyecto no debe requerir nada más para su uso básico.

## Tecnologías permitidas

El proyecto deberá utilizar únicamente tecnologías soportadas nativamente por el navegador.

Tecnologías permitidas:

- HTML5.
- CSS3.
- JavaScript ES6 Modules.
- Canvas API.
- SVG.
- LocalStorage.
- IndexedDB.
- Clipboard API.
- Blob API.
- File API.
- Drag & Drop API.
- Web Workers, si alguna vez son necesarios.
- OffscreenCanvas, si alguna vez es útil y compatible con el objetivo de navegadores.
- Fetch API únicamente para leer archivos locales del proyecto cuando sea posible y sin introducir un servidor obligatorio.

Estas tecnologías permiten construir una herramienta poderosa sin sacrificar portabilidad ni simplicidad.

## Tecnologías prohibidas

No se debe depender de herramientas externas para ejecutar la aplicación.

Quedan prohibidos como requisito para usar la aplicación básica:

- NodeJS.
- npm.
- pnpm.
- yarn.
- bun.
- Webpack.
- Vite.
- Rollup.
- Parcel.
- Angular.
- React.
- Vue.
- Svelte.
- Backend.
- Express.
- Docker.
- Base de datos externa.
- Servidor HTTP obligatorio.
- Compilación obligatoria.
- Bundlers.
- Transpiladores.
- Frameworks que impidan abrir `index.html` directamente.
- Minificación obligatoria.
- Instalaciones obligatorias.
- Internet para funcionar.

La aplicación básica debe seguir funcionando aunque el usuario no tenga herramientas de desarrollo instaladas.

## Filosofía técnica

La aplicación debe ser:

- Portable.
- Duradera.
- Simple.
- Fácil de mantener.
- Capaz de ejecutarse dentro de diez años únicamente con un navegador.

La arquitectura debe rechazar cualquier solución que mejore la comodidad del desarrollador a costa de empeorar la experiencia básica del usuario: abrir `index.html` y trabajar.

## Por qué esta decisión es importante

La decisión de funcionar desde `index.html` sin herramientas externas es central para el proyecto.

### Portabilidad

El usuario debe poder copiar la carpeta del proyecto a otra computadora y usarla sin instalación. Un archivo HTML local debe ser suficiente para comenzar a trabajar.

### Longevidad

Las herramientas de frontend cambian constantemente. Los frameworks, bundlers y gestores de paquetes aparecen, desaparecen o rompen compatibilidad. HTML, CSS y JavaScript nativos tienen mucha mayor estabilidad a largo plazo.

### Facilidad de mantenimiento

Un proyecto sin cadena de build es más fácil de entender, depurar y conservar. Menos herramientas significan menos puntos de falla.

### Facilidad para cualquier IA

Una IA que trabaje en este repositorio debe poder leer archivos directos, entender módulos nativos y modificar documentación o código sin reconstruir una cadena compleja de dependencias.

### Facilidad para cualquier computadora

No todas las computadoras de taller tendrán Node, npm, permisos de instalación o internet. La herramienta debe respetar ese contexto.

### Independencia de internet

La app debe poder funcionar en un taller sin conexión. La documentación también debe poder consultarse offline.

### Independencia de paquetes externos

No depender de paquetes externos reduce riesgos de seguridad, abandono, cambios incompatibles y fallas por versiones.

## Arquitectura modular obligatoria

Aunque todo funcione desde `index.html`, internamente el proyecto deberá crecer mediante módulos.

Nunca debe crecer mediante archivos enormes.

La arquitectura objetivo deberá parecerse a:

```text
index.html
↓
js/app.js
↓
core/
↓
operations/
↓
toolpaths/
↓
postprocessors/
↓
simulation/
↓
ui/
↓
utils/
```

Cada carpeta deberá tener una única responsabilidad.

Cada módulo debe poder crecer de forma independiente.

La modularidad debe permitir agregar:

- Nuevas operaciones.
- Nuevos toolpaths.
- Nuevos postprocesadores.
- Nuevos componentes de UI.
- Nuevos simuladores.
- Nuevas bibliotecas de herramientas.
- Nuevas bibliotecas de materiales.
- Nuevas validaciones.
- Nuevas estrategias de prueba.

Sin convertir el proyecto en una aplicación dependiente de herramientas externas.

## Reglas de imports

Todos los módulos JavaScript deberán usar únicamente ES Modules nativos:

- `import`.
- `export`.
- ES Modules.

Nunca se permite:

- `require()`.
- CommonJS.
- Bundlers obligatorios.
- Transformaciones obligatorias.
- Código que solo funcione después de compilarse.

Los módulos deben poder ser entendidos como archivos JavaScript estándar del navegador.

## Dependencias externas

La política del proyecto será:

```text
JavaScript puro primero.
```

Si existe una API nativa del navegador para resolver un problema, deberá utilizarse.

Agregar una dependencia externa deberá ser la última opción.

Si alguna IA o desarrollador considera necesario agregar una dependencia, deberá justificar:

- Qué problema resuelve.
- Por qué JavaScript puro no es suficiente.
- Qué ventajas aporta.
- Qué impacto tiene.
- Cuánto pesa.
- Qué riesgo introduce.
- Cómo afecta el uso offline.
- Cómo afecta la longevidad del proyecto.
- Qué alternativa sin dependencia se evaluó.
- Cómo se preservará el funcionamiento abriendo `index.html`.

Nunca se deben agregar dependencias sin aprobación.

Una dependencia nunca debe convertir el proyecto en una app que requiera instalación, build o servidor.

## Estructura y crecimiento

El proyecto debe poder crecer hasta cientos de archivos sin perder simplicidad.

Toda nueva funcionalidad deberá agregarse como un módulo nuevo o como una extensión clara de un módulo existente.

No se debe crecer mediante:

- Archivos gigantes.
- Funciones gigantes.
- Objetos globales difíciles de rastrear.
- Lógica duplicada.
- Mezcla de UI, dominio, toolpaths y postprocesadores en el mismo archivo.

El objetivo es que cada archivo tenga una responsabilidad clara.

## Performance

El proyecto debe iniciar muy rápido.

No se quieren tiempos largos de carga.

No se quieren megabytes innecesarios.

No se permiten frameworks gigantes ni librerías de varios megabytes para resolver problemas que pueden resolverse con APIs nativas.

La aplicación debe seguir siendo ligera aunque existan cientos de módulos.

Principios de performance:

- Cargar solo lo necesario.
- Mantener archivos razonables.
- Evitar dependencias pesadas.
- Evitar trabajo innecesario al iniciar.
- Preferir cálculos claros y deterministas.
- Usar Web Workers solo si una tarea pesada lo justifica.
- Usar OffscreenCanvas solo si aporta valor real y no rompe compatibilidad.

La arquitectura debe permitir crecer sin hacer que abrir `index.html` sea lento.

## Compatibilidad de navegador

La aplicación debe funcionar sin modificaciones en:

- Chrome.
- Edge.
- Firefox.
- Safari.

Toda decisión técnica debe considerar compatibilidad real con estos navegadores.

Si una API nativa no está soportada de forma consistente, debe documentarse el riesgo antes de usarla.

## Offline

Todo debe funcionar sin internet.

Esto incluye:

- Toda la aplicación.
- Toda la documentación.
- Generación de G-code.
- Formularios.
- Sugerencias.
- Validaciones.
- Simulación futura.
- Bibliotecas locales.
- Configuración.
- Importación y exportación de proyectos locales.

No se deben cargar scripts, estilos, fuentes, datos o documentación desde CDNs o servicios externos para el funcionamiento básico.

## Almacenamiento

Las configuraciones del usuario deberán guardarse utilizando únicamente tecnologías del navegador.

Opciones preferidas:

- LocalStorage.
- IndexedDB.

Nunca se debe depender de una base de datos externa para el uso básico.

Reglas de almacenamiento:

- Los datos deben poder exportarse cuando sea posible.
- El formato debe ser documentado.
- Los datos importantes deben poder representarse como JSON.
- El usuario debe poder trabajar offline.
- El almacenamiento local no debe ocultar información crítica que impida reproducir un trabajo.

## Modularidad de operaciones

Cada operación deberá ser independiente.

Ejemplos de operaciones futuras:

- Surfacing.
- Edge Surfacing.
- Pocket.
- Contour.
- Slots.
- Drilling.
- Neck Radius.
- Pickup Cavities.
- Control Cavities.
- Bridge Holes.
- String Through.

Cada una deberá implementarse como un módulo independiente.

Eliminar, deshabilitar o modificar una operación nunca deberá romper otra.

Cada operación deberá implementar la misma API conceptual documentada en `docs/plugin-api.md`.

## Postprocesadores

El núcleo del proyecto nunca deberá conocer el formato final del G-code.

El flujo obligatorio deberá ser:

```text
Operation
↓
Toolpath
↓
PostProcessor
↓
GCode
```

Nunca deberá ser:

```text
Operation
↓
GCode
```

Inicialmente existirá soporte para:

- GRBL.

Pero la arquitectura deberá poder soportar en el futuro:

- FluidNC.
- LinuxCNC.
- Mach3.
- Marlin.
- Masso.
- Centroid.

Sin modificar el núcleo del software.

Cada postprocesador deberá ser un módulo independiente que traduzca Toolpaths neutrales a un dialecto específico de G-code.

## Simulador

El simulador será otro módulo independiente.

Inicialmente será 2D.

No dependerá del generador de G-code.

No dependerá del postprocesador.

Consumirá únicamente Toolpaths.

Esto permitirá:

- Simulación.
- Visualización.
- Estimación de tiempo.
- Cobertura.
- Trayectoria.
- Sentido de corte.
- Punto inicial.
- Punto final.
- Área mecanizada.
- Área pendiente.

Sin conocer el formato final de G-code.

## Pruebas

Todo cambio deberá poder compararse contra Golden Files.

Reglas absolutas:

- Nunca modificar automáticamente los Golden Files.
- Siempre mostrar diferencias.
- Siempre explicar diferencias.
- Siempre detenerse si el G-code cambia sin aprobación.
- Siempre mantener salidas deterministas.

Las pruebas deben proteger:

- Formato de G-code.
- Orden de comandos.
- Unidades.
- Modos absoluto/relativo.
- Movimientos a Z seguro.
- Encendido y apagado de spindle.
- Dwell del spindle.
- Comentarios relevantes.
- Compatibilidad con postprocesadores.

## Objetivo final

Este proyecto debe poder crecer durante muchos años.

Debe poder contener:

- Cientos de módulos.
- Decenas de operaciones.
- Múltiples simuladores.
- Múltiples postprocesadores.
- Biblioteca de herramientas.
- Biblioteca de materiales.
- Golden Files.
- Configuraciones locales.
- Exportación e importación de proyectos.

Debe seguir siendo extremadamente sencillo para el usuario.

Y siempre deberá poder abrirse simplemente haciendo doble click sobre:

```text
index.html
```

## Relación con la arquitectura modular

La restricción de abrir `index.html` no significa escribir un HTML gigante.

La regla correcta es:

```text
Un punto de entrada simple
+
Módulos internos claros
+
Sin herramientas externas obligatorias
```

El proyecto debe evitar dos extremos:

1. Un único archivo enorme imposible de mantener.
2. Una aplicación moderna dependiente de toolchains externas.

La solución correcta es una aplicación modular con tecnologías nativas del navegador.

## Reglas para cambios futuros

Antes de aceptar cualquier cambio arquitectónico, se debe responder:

- ¿Sigue funcionando con doble click en `index.html`?
- ¿Requiere Node, npm, pnpm, yarn, bun, build o servidor?
- ¿Agrega alguna dependencia externa?
- ¿Funciona offline?
- ¿Funciona en Chrome, Edge, Firefox y Safari?
- ¿Mantiene ES Modules nativos?
- ¿Mantiene JavaScript puro?
- ¿Hace la interfaz más simple o más compleja?
- ¿Afecta compatibilidad hacia atrás?
- ¿Puede mantenerse durante diez años?

Si alguna respuesta pone en riesgo la regla de `index.html`, el cambio debe rechazarse o rediseñarse.

## Architecture Rules for AI Contributors

Estas reglas son obligatorias para cualquier IA que trabaje en este proyecto.

1. **Siempre leer toda la documentación.**
   Como mínimo: `README.md`, todos los documentos en `docs/`, `CHANGELOG.md`, arquitectura, reglas de arquitectura, principios de diseño, roadmap, requerimientos, modelo de dominio, API de operaciones, JSON schema y estrategia de pruebas cuando exista.

2. **Nunca modificar código sin entender el proyecto.**
   Antes de editar, entender el estado actual, la visión, las restricciones offline y la regla de `index.html`.

3. **Nunca romper compatibilidad.**
   Si un cambio puede romper comportamiento existente, detenerse y pedir aprobación.

4. **Nunca eliminar funcionalidades.**
   Extender siempre es preferible a reemplazar. Eliminar requiere aprobación explícita.

5. **Nunca modificar el comportamiento existente sin aprobación.**
   Esto incluye G-code, UI, validaciones, defaults, descargas, simulación, postprocesadores y almacenamiento.

6. **Siempre explicar los cambios.**
   Describir qué se hará, por qué se hará y qué comportamiento se espera.

7. **Siempre indicar los archivos afectados.**
   Antes de implementar, listar los archivos que cambiarán.

8. **Siempre indicar riesgos.**
   Incluir riesgos de compatibilidad, regresión, salida G-code, usabilidad, performance y mantenimiento.

9. **Siempre proponer primero. Implementar después.**
   Para cambios funcionales o arquitectónicos, presentar análisis, plan, riesgos y alternativas antes de escribir código.

10. **Siempre mantener el proyecto compatible con `index.html`.**
    Si el usuario no puede abrir `index.html` y trabajar, la propuesta viola la arquitectura.

11. **Nunca convertir este proyecto en una aplicación dependiente de herramientas externas.**
    No proponer frameworks, Node, backend, bundlers, transpiladores ni servidores obligatorios para la app básica.

12. **Siempre mantener compatibilidad offline.**
    No usar CDNs, APIs remotas, fuentes remotas o servicios externos para funciones básicas.

13. **Siempre mantener ES Modules.**
    Usar `import` y `export` nativos. No usar CommonJS ni `require()`.

14. **Siempre mantener JavaScript puro.**
    Preferir APIs nativas del navegador antes que paquetes externos.

15. **Siempre justificar cualquier dependencia nueva.**
    Si se propone una dependencia, explicar por qué es imprescindible, qué riesgo introduce, cuánto pesa y cómo mantiene funcionamiento local.

16. **Siempre proteger la simplicidad del usuario.**
    Ninguna decisión técnica debe hacer más difícil abrir la app y trabajar.

## Criterio final

La arquitectura correcta es aquella que permite que el proyecto crezca durante años sin sacrificar el principio central:

```text
Doble click
↓
index.html
↓
La aplicación funciona
```

Si una propuesta técnica rompe este principio, no pertenece a este proyecto.
