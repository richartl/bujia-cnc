# Architecture Rules: Reglas absolutas del proyecto

## Propósito

Este documento define las reglas absolutas de arquitectura del proyecto. Estas reglas existen para proteger la portabilidad, longevidad, simplicidad y mantenibilidad del CAM ligero CNC.

Ninguna decisión técnica debe romper estas reglas sin una aprobación explícita, documentada y excepcional.

## Regla más importante

Este software siempre deberá ejecutarse únicamente abriendo `index.html`.

El flujo obligatorio de uso es:

```text
Doble click
↓
index.html
↓
La aplicación funciona
```

El proyecto no debe requerir nada más para su uso básico.

## Prohibiciones absolutas

No se debe convertir el proyecto en una aplicación que dependa de:

- NodeJS.
- npm.
- pnpm.
- yarn.
- Vite.
- Webpack.
- Rollup.
- Parcel.
- Angular.
- React.
- Vue.
- Svelte.
- Backend.
- Docker.
- Servidor HTTP.
- Base de datos externa.
- Compilación.
- Build.
- Bundling.
- Minificación obligatoria.
- Instalaciones obligatorias.
- Internet para funcionar.

La app básica debe seguir funcionando aunque el usuario no tenga herramientas de desarrollo instaladas.

## Tecnologías permitidas

El proyecto debe desarrollarse utilizando tecnologías soportadas de forma nativa por navegadores modernos.

Tecnologías permitidas y preferidas:

- HTML5.
- CSS3.
- JavaScript moderno.
- JavaScript ES6 Modules.
- `import`.
- `export`.
- Canvas API.
- SVG.
- LocalStorage.
- IndexedDB.
- Web Workers, si alguna vez son necesarios.
- File API.
- Blob API.
- Clipboard API.
- Drag & Drop API.

Estas tecnologías permiten construir una herramienta poderosa sin sacrificar portabilidad ni simplicidad.

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

## Modularidad obligatoria

Aunque todo funcione desde `index.html`, el proyecto debe estar internamente modularizado.

La arquitectura objetivo debe seguir esta dirección:

```text
index.html
↓
js/app.js
↓
core
↓
operations
↓
toolpaths
↓
postprocessors
↓
ui
```

Cada módulo debe poder crecer de forma independiente.

La modularidad debe permitir agregar:

- Nuevas operaciones.
- Nuevos toolpaths.
- Nuevos postprocesadores.
- Nuevos componentes de UI.
- Nuevos simuladores.
- Nuevas bibliotecas de herramientas.
- Nuevas bibliotecas de materiales.

Sin convertir el proyecto en una aplicación dependiente de herramientas externas.

## Reglas de imports

Todos los módulos JavaScript deberán usar exclusivamente ES Modules nativos:

- `import`.
- `export`.

No se permite:

- CommonJS.
- `require()`.
- Bundlers obligatorios.
- Transformaciones obligatorias.
- Código que solo funcione después de compilarse.

Los módulos deben poder ser entendidos como archivos JavaScript estándar del navegador.

## Dependencias externas

La regla general es: no usar dependencias externas.

Si una funcionalidad puede desarrollarse utilizando JavaScript puro y APIs nativas del navegador, debe preferirse esa solución.

Agregar una dependencia solo puede considerarse si existe una justificación muy fuerte, documentada y aprobada. La justificación debe explicar:

- Qué problema resuelve.
- Por qué no puede resolverse razonablemente con JavaScript puro.
- Cuánto pesa.
- Qué riesgo introduce.
- Cómo afecta el uso offline.
- Cómo afecta la longevidad del proyecto.
- Qué alternativa sin dependencia se evaluó.
- Cómo se preservará el funcionamiento abriendo `index.html`.

Una dependencia nunca debe convertir el proyecto en una app que requiera instalación, build o servidor.

## Estructura y crecimiento

El proyecto debe poder crecer hasta cientos de archivos sin perder simplicidad.

Toda nueva funcionalidad debe agregarse como un módulo nuevo o como una extensión clara de un módulo existente.

No se debe crecer mediante:

- Archivos gigantes.
- Funciones gigantes.
- Objetos globales difíciles de rastrear.
- Lógica duplicada.
- Mezcla de UI, dominio, toolpaths y postprocesadores en el mismo archivo.

El objetivo es que cada archivo tenga una responsabilidad clara.

## Performance

La aplicación debe cargar rápido.

No se permiten frameworks gigantes ni librerías de varios megabytes para resolver problemas que pueden resolverse con APIs nativas.

Principios de performance:

- Cargar solo lo necesario.
- Mantener archivos razonables.
- Evitar dependencias pesadas.
- Evitar trabajo innecesario al iniciar.
- Preferir cálculos claros y deterministas.
- Usar Web Workers solo si una tarea pesada lo justifica.

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

Toda la aplicación debe funcionar sin internet.

Esto incluye:

- Generación de G-code.
- Formularios.
- Sugerencias.
- Validaciones.
- Simulación futura.
- Bibliotecas locales.
- Configuración.
- Documentación.

La documentación del proyecto debe poder consultarse offline desde los archivos del repositorio.

No se deben cargar scripts, estilos, fuentes, datos o documentación desde CDNs o servicios externos para el funcionamiento básico.

## Almacenamiento

Toda configuración debe guardarse utilizando tecnologías soportadas por el navegador.

Opciones preferidas:

- LocalStorage.
- IndexedDB.

No se permite requerir una base de datos externa para el uso básico.

Reglas de almacenamiento:

- Los datos deben poder exportarse cuando sea posible.
- El formato debe ser documentado.
- Los datos importantes deben poder representarse como JSON.
- El usuario debe poder trabajar offline.
- El almacenamiento local no debe ocultar información crítica que impida reproducir un trabajo.

## Objetivo de diez años

Este proyecto debe poder seguir funcionando exactamente igual dentro de diez años.

Debe seguir siendo posible abrir:

```text
index.html
```

y comenzar a trabajar.

Esto debe seguir siendo cierto aunque el proyecto tenga:

- Cientos de módulos.
- Decenas de operaciones.
- Simulador 2D.
- Biblioteca de herramientas.
- Biblioteca de materiales.
- Múltiples postprocesadores.
- Golden Files.
- Configuraciones locales.
- Exportación e importación de proyectos.

El crecimiento del proyecto nunca debe romper la experiencia básica de doble click.

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
- ¿Requiere Node, npm, build o servidor?
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

1. **Nunca proponer frameworks.**
   No proponer React, Vue, Angular, Svelte ni frameworks similares para la app básica.

2. **Nunca proponer Node como requisito.**
   NodeJS no debe ser necesario para usar, ejecutar o abrir la aplicación.

3. **Nunca proponer npm, pnpm o yarn como requisito.**
   El usuario no debe instalar paquetes para usar la app básica.

4. **Nunca proponer un backend obligatorio.**
   La aplicación debe seguir siendo local, offline y sin servidor.

5. **Nunca romper el funcionamiento desde `index.html`.**
   Si el usuario no puede abrir `index.html` y trabajar, la propuesta viola la arquitectura.

6. **Nunca convertir el proyecto en una SPA dependiente de herramientas externas.**
   Puede ser modular e interactivo, pero no debe depender de bundlers, builds o toolchains.

7. **Siempre mantener compatibilidad offline.**
   No usar CDNs, APIs remotas, fuentes remotas o servicios externos para funciones básicas.

8. **Siempre mantener ES Modules.**
   Usar `import` y `export` nativos. No usar CommonJS ni `require()`.

9. **Siempre mantener JavaScript puro.**
   Preferir APIs nativas del navegador antes que paquetes externos.

10. **Siempre justificar cualquier dependencia nueva.**
    Si se propone una dependencia, explicar por qué es imprescindible, qué riesgo introduce, cuánto pesa y cómo mantiene funcionamiento local.

11. **Siempre preferir módulos pequeños.**
    No resolver crecimiento agregando más lógica a un archivo gigante.

12. **Siempre proteger compatibilidad de navegador.**
    Considerar Chrome, Edge, Firefox y Safari antes de usar una API.

13. **Siempre proteger la simplicidad del usuario.**
    Ninguna decisión técnica debe hacer más difícil abrir la app y trabajar.

14. **Siempre proponer antes de implementar cambios arquitectónicos.**
    Los cambios que afecten estructura, carga de módulos, dependencias o ejecución deben aprobarse antes de implementarse.

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
