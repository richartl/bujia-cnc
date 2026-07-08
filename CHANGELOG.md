# Changelog

## Unreleased

### Changed

- Implementada la página Settings para guardar preferencias simples en LocalStorage: carpeta, estrategia, feed, plunge, spindle, safe Z, herramienta y tema, sin usuarios, base de datos ni sincronización.
- Implementada la herramienta de Cantos en `pages/edge.html`, con generación en `js/gcode/edge.js`, lógica de formulario en `js/ui/edge-ui.js`, selección de eje X/Y, sentido en contra/a favor y retorno rápido configurable a Z segura.
- Migrada la interfaz funcional de Surfacing a `pages/surfacing.html`, separando generación en `js/gcode/surfacing.js` y lógica de formulario en `js/ui/surfacing-ui.js`, sin cambiar el G-code Zig Zag esperado.
- Creada la estructura base de carpetas y archivos para futuras páginas independientes (`pages/`, `css/`, `gcode/`, `ui/`) sin migrar código ni modificar el generador actual.
- Replanteada la visión del proyecto: de CAM ligero a caja de herramientas CNC offline.
- Simplificada la arquitectura documental hacia `index.html` como menú principal y páginas independientes bajo `pages/`.
- Eliminados de la arquitectura objetivo los conceptos globales obligatorios de Machine Library, Material Library y Recommendation Engine.
- Simplificados los documentos de dominio, API y JSON para enfocarse en herramientas independientes, formularios locales y G-code descargable.

### Preserved

- El G-code Zig Zag de Surfacing se mantiene igual al comportamiento anterior verificado.
- Las opciones One Way, Raster X, Raster Y y Smart Surfacing quedan solo como interfaz pendiente, sin afectar la salida Zig Zag.
