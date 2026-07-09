# Changelog

## Unreleased

### Added

- Nuevo módulo **Plantillas / Template Builder** (🧩) totalmente independiente de Surfacing y Cantos. El usuario no dibuja: elige una plantilla, ajusta dimensiones y descarga el G-code.
- Página `pages/templates.html` con el árbol de categorías (Pastillas, Cavidades, Neck Pocket, Pickguards, Puentes, Jack, Controles, Personalizadas). Solo *Pastillas › Guitarra › Humbucker* está disponible; el resto aparece como «Próximamente».
- Página `pages/template-humbucker.html`: dimensiones de pieza y cavidad (centrada en el origen), corte del contorno y vaciado de la cavidad con modo Manual/Adaptive independientes, y guías de centro como archivo aparte.
- Corte **por fuera de la línea** con parámetro de **holgura** por sección (radio de fresa + holgura), pensado para copiadora/guide bushing.
- Previsualización 2D en **Canvas** en tiempo real (contorno, cavidad, guías, centro/origen y cotas). Origen en el centro de la pieza.
- Descargas: `01_Contorno.nc`, `02_Cavidad_Humbucker.nc`, `03_Guias.nc` y `preview.svg` a escala.
- Arquitectura reutilizable: núcleo de G-code compartido (`js/gcode/gcode-core.js`), geometría (`js/template/geometry.js`), generadores (`js/gcode/template.js`), preview (`js/template/preview.js`), UI genérica (`js/ui/template-ui.js`) y descriptores por plantilla (`templates/*.js`). Una plantilla nueva solo aporta geometría.
- Casos de regresión en `tests/template.test.js` (geometría, offset por fuera, contorno/cavidad/guías y SVG).

### Changed

- Añadida la entrada «Plantillas» al menú lateral compartido y una tarjeta en el dashboard, sin alterar el comportamiento de Surfacing ni de Cantos.
- Rediseñada por completo la interfaz para sentirse como una aplicación de escritorio profesional para CNC: tema oscuro sobrio, layout de pantalla completa con barra superior, menú lateral, área principal, panel derecho (acciones, resumen, vista previa) y pie de página con versión. Sin frameworks, sin Node, sin build; sigue funcionando abriendo `index.html` con `file://`.
- Convertido `index.html` en un dashboard con tarjetas de herramientas (Disponibles y Próximamente).
- Añadido el módulo compartido `js/ui/app-shell.js` que inyecta el menú lateral desde una única lista de herramientas, marca la herramienta activa y aplica el tema (system/light/dark) guardado en Settings.
- Reescrito el sistema de diseño en `css/common.css`, `css/forms.css` y `css/home.css` (tokens de color, tipografía, formularios en grupos con separadores y validación visual).
- Ampliada la tabla Adaptive Passes: botones separados «Auto distribuir profundidad», «Auto distribuir Feed», «Auto distribuir RPM», «Redistribuir» y «Reset»; resumen estadístico (pasadas, feed máx/mín, RPM máx/mín, profundidad máx/mín, tiempo estimado como placeholder) además del bloque de validación de profundidad objetivo.
- Reemplazadas las ventanas emergentes de Surfacing por mensajes de estado en el panel; resumen de parámetros en vivo en Surfacing y Cantos.
- Agregado modo Adaptive Passes reutilizable para Surfacing y Cantos, con tabla editable, redistribución, bloqueo de filas, validación de profundidad y persistencia en LocalStorage, manteniendo Manual sin cambios de G-code.
- Implementada la página Settings para guardar preferencias simples en LocalStorage: carpeta, estrategia, feed, plunge, spindle, safe Z, herramienta y tema, sin usuarios, base de datos ni sincronización.
- Implementada la herramienta de Cantos en `pages/edge.html`, con generación en `js/gcode/edge.js`, lógica de formulario en `js/ui/edge-ui.js`, selección de eje X/Y, sentido en contra/a favor y retorno rápido configurable a Z segura.
- Migrada la interfaz funcional de Surfacing a `pages/surfacing.html`, separando generación en `js/gcode/surfacing.js` y lógica de formulario en `js/ui/surfacing-ui.js`, sin cambiar el G-code Zig Zag esperado.
- Creada la estructura base de carpetas y archivos para futuras páginas independientes (`pages/`, `css/`, `gcode/`, `ui/`) sin migrar código ni modificar el generador actual.
- Replanteada la visión del proyecto: de CAM ligero a caja de herramientas CNC offline.
- Simplificada la arquitectura documental hacia `index.html` como menú principal y páginas independientes bajo `pages/`.
- Eliminados de la arquitectura objetivo los conceptos globales obligatorios de Machine Library, Material Library y Recommendation Engine.
- Simplificados los documentos de dominio, API y JSON para enfocarse en herramientas independientes, formularios locales y G-code descargable.

### Preserved

- El rediseño de interfaz no cambia ningún G-code: la salida Manual de Surfacing y Cantos es idéntica byte a byte a la verificada antes del cambio.
- El G-code Zig Zag de Surfacing se mantiene igual al comportamiento anterior verificado.
- Las opciones One Way, Raster X, Raster Y y Smart Surfacing quedan solo como interfaz pendiente, sin afectar la salida Zig Zag.
