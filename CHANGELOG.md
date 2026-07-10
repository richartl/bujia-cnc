# Changelog

## Unreleased

### Added

- Nuevo módulo **Verificación** (🔍), independiente de Plantillas/Surfacing/Cantos: permite subir o pegar un archivo `.nc` ya generado (por ejemplo desde Aspire), analizar sus parámetros (feedrate, RPM, Z segura, profundidades, número de pasadas) y corregirlos para descargar un archivo nuevo, **sin modificar nunca las coordenadas X/Y**.
  - `js/gcode/gcode-verify.js`: analizador y reescritor de G-code. Detecta unidades, modo absoluto/incremental, si el spindle se enciende, si el programa termina correctamente, todos los valores F y S distintos (con conteo de uso), la Z segura, las profundidades de corte y si existe un **patrón de pasada repetible** (mismo recorrido XY a distintas profundidades).
  - Cambiar feedrate, RPM o Z segura: sustitución dirigida de esos valores en todo el archivo, preservando comentarios y coordenadas.
  - Cambiar la profundidad final: reescala todas las profundidades detectadas proporcionalmente, mismo número de pasadas.
  - Cambiar el número de pasadas: **solo si se detecta un patrón de pasada repetible**; en ese caso clona el bloque de la pasada a nuevas profundidades (repartidas en partes iguales). Si no se detecta el patrón, la opción se desactiva con una explicación en vez de arriesgar la trayectoria.
  - El diámetro de fresa es un campo de referencia que el usuario escribe (el G-code no lo contiene); no se valida ni se escribe en el archivo.
  - Página `pages/verify.html`: carga por arrastrar/soltar, selector de archivo o pegado directo; resumen de lo detectado con advertencias (spindle nunca encendido, falta M30, feed no positivo, etc.); tabla de parámetros con valor detectado y nuevo valor editable; vista comparativa del G-code original y el modificado; descarga.
  - `tests/gcode-verify.test.js`: valida contra G-code real generado por nuestra propia herramienta (patrón repetible garantizado), reescritura idempotente cuando no hay cambios, sustitución de feed/RPM/Z segura sin alterar XY, reescalado de profundidad, cambio de número de pasadas, el caso negativo (patrón no detectado → error explícito), y tolerancia a estilos de G-code sin espacios (tipo Aspire).

### Fixed

- Corregida la plantilla **Humbucker (con orejas)**, que tenía proporciones y concepto equivocados. Ahora usa medidas de referencia reales (Seymour Duncan / Gibson): cuerpo 74 × 24 mm, orejas de 10 mm que llevan el total a 92 × 42 mm, radio de esquinas 4 mm, profundidad recomendada 16.5 mm con fresa mínima de 6 mm. Se corrigió también el concepto de corte: **todo el bolsillo (cuerpo + orejas) se corta a una sola profundidad uniforme** dentro del mismo archivo de cavidad, no como un relieve superficial aparte a una profundidad distinta. Se modela con `geometry.cavities` (cuerpo + 2 orejas, reutilizando la misma mecánica de Precision Bass) en vez del mecanismo `earPockets`/`hasEars` anterior, que se retiró del código por quedar sin uso (`js/gcode/template.js`, `js/template/preview.js`, `js/ui/template-ui.js`, y el campo «Profundidad de orejas» eliminado de las 20 páginas de plantillas).

### Added

- Ampliado el catálogo de **Plantillas de hardware** (fuera de pastillas), siguiendo el mismo patrón genérico: **Neck Pocket** (bolsillo de mástil atornillado tipo Fender, 55.6 × 76.2 mm), **Puentes** (relieve de montaje para puente fijo/hardtail tipo string-through, 78 × 41 mm), **Jack** (salida circular de 7/8", 22.2 mm de diámetro — la cavidad redondeada con radio = mitad del ancho/alto forma un círculo), **Controles** (cavidad de electrónica genérica, tamaño de referencia ajustable) y **Personalizadas** (plantilla en blanco, sin sesgo de forma, para cualquier cavidad rectangular que no encaje en las demás categorías).
- **Decisión de alcance documentada**: *Pickguards* y las siluetas de cuerpo completo dentro de *Cavidades* (Stratocaster, Telecaster, Les Paul, Jazz Bass, Precision Bass) requieren contornos orgánicos reales (curvas, no rectángulos redondeados) que el motor de geometría actual no soporta. Forzarlos como rectángulo redondeado produciría una forma incorrecta y potencialmente engañosa para una herramienta que corta madera real, así que se dejan explícitamente como «Próximamente» con un comentario en `templates/registry.js` explicando el motivo, en vez de aproximarlos mal.
- Poblado el catálogo de **Plantillas de pastillas** con 14 plantillas nuevas siguiendo el mismo patrón que Humbucker (descriptor `templates/<id>.js` + página dedicada, sin cambiar interfaz, lógica ni generador):
  - Guitarra: Single Coil, P90, Filtertron, Mini Humbucker, Wide Range, **Humbucker (con orejas)**, Personalizada.
  - Bajo: Jazz Bass, Precision, Music Man, Soapbar, EMG35, EMG40, Personalizada.
  - Las medidas de cavidad son aproximaciones basadas en referencias públicas de fabricantes y luthiería (StewMac, Fralin, EMG, foros especializados); cada plantilla incluye una nota de advertencia y se recomienda verificar contra la pastilla real antes de cortar.
- **Humbucker con orejas**: nueva página con la misma cavidad principal que el Humbucker estándar, más dos relieves superficiales para las orejas de montaje, cortados en una sola pasada a una profundidad independiente (nuevo campo «Profundidad de orejas», solo visible en esta plantilla).
- **Precision Bass**: primera plantilla con **bobina partida** (dos cavidades independientes desfasadas). Se generalizó el generador y el preview para aceptar `geometry.cavities` (varias cavidades) además de `geometry.cavity` (una sola), sin cambiar el comportamiento de las plantillas existentes.
- Sistema de **texto genérico por descriptor**: título, descripción, chip de la barra superior, pie de página y nombre del archivo de cavidad se rellenan en tiempo de carga desde el descriptor de la plantilla (`data-bind` + `js/ui/template-ui.js`), de modo que el HTML de cada página de pastilla es idéntico salvo el identificador de plantilla.
- Nuevo módulo **Plantillas / Template Builder** (🧩) totalmente independiente de Surfacing y Cantos. El usuario no dibuja: elige una plantilla, ajusta dimensiones y descarga el G-code.
- Página `pages/templates.html` con el árbol de categorías (Pastillas, Cavidades, Neck Pocket, Pickguards, Puentes, Jack, Controles, Personalizadas). Ahora todas las pastillas de guitarra y bajo están disponibles; el resto de categorías (Cavidades de cuerpo, Neck Pocket, Pickguards, Puentes, Jack, Controles) sigue como «Próximamente».
- Página `pages/template-humbucker.html`: dimensiones de pieza y cavidad (centrada en el origen), corte del contorno y vaciado de la cavidad con modo Manual/Adaptive independientes, y guías de centro como archivo aparte.
- Corte **por fuera de la línea** con parámetro de **holgura** por sección (radio de fresa + holgura), pensado para copiadora/guide bushing.
- Previsualización 2D en **Canvas** en tiempo real (contorno, cavidad, guías, centro/origen y cotas). Origen en el centro de la pieza.
- Rotación de **toda la plantilla** (0/90/180/270) alrededor del centro: rota de forma conjunta contorno, cavidad, offsets, guías, previsualización, `preview.svg` y los tres archivos de G-code (rotaciones exactas de cuarto de vuelta, sin ruido de coma flotante).
- El preview del constructor se reubica al panel derecho y queda **fijo (sticky) abajo a la derecha**, siempre visible mientras se editan los parámetros, con actualización en vivo.
- El preview (Canvas y `preview.svg`) ahora muestra **cotas**: ancho y alto de la pieza con líneas de cota y medida de la cavidad.
- Vista previa **por cada G-code** (Diseño / Contorno / Cavidad / Guías): muestra el recorrido real de cada archivo (con offset por fuera, holgura, rotación y sentido), punto de inicio y flecha de dirección. Los recorridos se calculan con constructores compartidos (`contourToolpath`, `cavityToolpaths`, `guideToolpaths`), única fuente de verdad para G-code y preview.
- Sección **colapsable** «Código de cada G-code (.nc)» que muestra a la vez el texto del G-code generado de los tres archivos (Contorno, Cavidad, Guías) en bloques de solo lectura con contador de líneas; se puede mostrar u ocultar para no tapar el resto y se actualiza en vivo mientras está abierta.
- Verificado que al rotar la plantilla **no cambia el sentido del corte**: la rotación es un giro rígido de cuarto de vuelta (sin espejo), por lo que climb sigue siendo climb; se añadió una prueba que comprueba que el área firmada del recorrido conserva su signo en 0/90/180/270.
- Descargas: `01_Contorno.nc`, `02_Cavidad_Humbucker.nc`, `03_Guias.nc` y `preview.svg` a escala.
- Arquitectura reutilizable: núcleo de G-code compartido (`js/gcode/gcode-core.js`), geometría (`js/template/geometry.js`), generadores (`js/gcode/template.js`), preview (`js/template/preview.js`), UI genérica (`js/ui/template-ui.js`) y descriptores por plantilla (`templates/*.js`). Una plantilla nueva solo aporta geometría.
- Casos de regresión en `tests/template.test.js` (geometría, offset por fuera, contorno/cavidad/guías y SVG).
- Nuevo `tests/template-catalog.test.js`: recorre automáticamente todas las plantillas «stable» del registry (15 en total) y verifica que cada una genera G-code válido y seguro para contorno, cavidad y guías, que `preview.svg` se construye correctamente y que el sentido del corte se conserva al rotar 90°. Incluye casos específicos para Precision Bass (dos cavidades) y Humbucker con orejas (relieve de orejas condicionado a `earDepth`).

### Fixed

- Corregido un bug de CSS donde el atributo `hidden` no ocultaba realmente elementos con clase `.form-field` (u otras con `display` propio) por empate de especificidad con la regla del navegador; afectaba, por ejemplo, al campo de número de pasadas Adaptive de Cantos, que quedaba visible en modo Manual. Se agregó `[hidden] { display: none !important; }` en `css/common.css`.

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
