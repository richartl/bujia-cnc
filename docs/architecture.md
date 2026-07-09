# Arquitectura

## Resumen

Bujia CNC es una caja de herramientas CNC offline. La arquitectura ya no debe orientarse a un CAM completo con proyecto, bibliotecas globales y motor central. Debe orientarse a páginas independientes, cada una dedicada a una operación repetitiva del taller.

## Estado actual

La implementación funcional actual vive en `index.html` y genera G-code de surfacing. Ese comportamiento es existente y no debe romperse.

## Arquitectura objetivo

```text
index.html
└── Menú principal
    └── pages/
        ├── surfacing.html
        ├── edge.html
        ├── slots.html
        ├── drilling.html
        ├── pockets.html
        └── settings.html
```

## Responsabilidades

### `index.html`

- Ser la puerta de entrada.
- Mostrar un menú simple de herramientas.
- No contener lógica compleja de todas las operaciones.

### `pages/*.html`

Cada página:

- Resuelve una operación concreta.
- Tiene su propio formulario.
- Valida sus propios datos.
- Genera su propio G-code o usa módulos compartidos mínimos.
- Permite copiar/descargar su salida.

### `shared/` futuro

Solo debe contener utilidades pequeñas compartidas:

- Descarga de archivos.
- Copia al portapapeles.
- Formateo numérico.
- Validaciones simples.
- Helpers G-code comunes.

No debe convertirse en núcleo CAM global.

## Capa de interfaz (app shell)

La interfaz se presenta como una aplicación de escritorio de pantalla completa, sin frameworks y sin build. Sigue funcionando abriendo `index.html` con `file://` porque todo son scripts clásicos (`window.Bujia*`) enlazados con rutas relativas; no se usan ES Modules con `import` ni `fetch()` de recursos.

Piezas compartidas de UI:

- `css/common.css`: sistema de diseño (tokens de color oscuro/claro, tipografía, botones, badges) y layout del shell (barra superior, menú lateral, área principal, panel derecho, pie de página).
- `css/forms.css`: formularios en grupos con separadores, validación visual y tabla Adaptive Passes tipo hoja de cálculo.
- `css/home.css`: dashboard de `index.html`.
- `js/ui/app-shell.js`: fuente única de la lista de herramientas del menú lateral, marca la herramienta activa (`body[data-tool]`) y aplica el tema (system/light/dark) guardado en Settings. La ruta base se indica con `body[data-shell-base]` (`""` en `index.html`, `"../"` en `pages/`).

Cada página de herramienta mantiene su propio formulario, validación y generación de G-code; el shell solo aporta la navegación y el aspecto común.

## Módulo Plantillas (Template Builder)

Herramienta independiente para generar plantillas (p. ej. cavidad de pastilla Humbucker) sin dibujar: el usuario elige una plantilla, ajusta dimensiones y descarga el G-code. Está diseñada para reutilizarse: lo único que cambia entre plantillas es la **geometría**.

Capas:

- `templates/registry.js`: árbol de categorías del menú de Plantillas.
- `templates/<plantilla>.js`: descriptor de cada plantilla (`defaults` + `buildGeometry(params)`). Único punto específico por plantilla.
- `js/template/geometry.js`: geometría reutilizable (rectángulo redondeado, offset exterior/interior, anillos concéntricos, plan de profundidades Manual/Adaptive).
- `js/gcode/gcode-core.js`: núcleo de G-code compartido (formato, cabecera segura `G21/G90/G94 + M3 + G4 P3`, retracción a Z segura, cierre `M5/M30`). No lo usan Surfacing ni Cantos.
- `js/gcode/template.js`: generadores de Contorno, Cavidad (vaciado) y Guías a partir de la geometría.
- `js/template/preview.js`: dibujo en Canvas en vivo y construcción de `preview.svg` a escala (misma fuente de verdad).
- `js/ui/template-ui.js`: controlador genérico dirigido por `body[data-template]`; reutiliza el componente Adaptive Passes para Contorno y Cavidad.

Convenciones: origen en el centro de la pieza; corte por fuera de la línea con desplazamiento del centro de la fresa = radio + holgura (la holgura permite compensar una copiadora). Toda la plantilla puede rotarse en pasos de 90° (0/90/180/270) alrededor del centro; la rotación se aplica de forma uniforme a los puntos de contorno, cavidad, guías, preview y G-code (`rotatePath` en `js/template/geometry.js`), por lo que todo rota igual. Salidas: `01_Contorno.nc`, `02_Cavidad_<Plantilla>.nc`, `03_Guias.nc` y `preview.svg`.

### Catálogo de plantillas de pastillas

Cada plantilla nueva de pastilla (guitarra o bajo) debe seguir exactamente el patrón de `templates/humbucker.js`:

1. Crear `templates/<id>.js` con `id`, `title`, `category`, `description` (HTML simple, texto fijo definido por nosotros) y `defaults` + `buildGeometry(params)`.
2. Crear `pages/template-<id>.html` como copia del esqueleto genérico (mismo HTML que `template-humbucker.html`, sin duplicar lógica) cambiando únicamente `body[data-template]`, el `<title>` inicial y el `<script src="../templates/<id>.js">`. Todo el resto del texto visible (título, descripción, chip, pie de página, nombre del archivo de cavidad) se rellena en tiempo de carga desde el descriptor mediante `[data-bind]` y `applyDescriptorText()` en `js/ui/template-ui.js`.
3. Marcar la hoja correspondiente como `stable` con su `page` en `templates/registry.js`.
4. Añadir el caso al smoke test `tests/template-catalog.test.js` (se detecta automáticamente si el registry apunta a un descriptor válido).

**Geometría con varias cavidades.** Una plantilla puede tener una sola cavidad (`geometry.cavity`) o varias (`geometry.cavities`, un arreglo), todas cortadas a la misma profundidad dentro del mismo archivo `02_Cavidad_<Plantilla>.nc`. El generador de G-code y el preview normalizan ambas formas (`cavityRectsOf()` en `js/gcode/template.js` y `js/template/preview.js`); si no hay `cavities`, se trata `cavity` como una lista de un elemento, así que las plantillas existentes no cambian su salida. Dos usos actuales:

- **Precision Bass**: bobina partida, dos cavidades independientes desfasadas.
- **Humbucker con orejas**: cuerpo + dos orejas de montaje como tres cavidades independientes que comparten la misma profundidad (sin relieve superficial aparte; el corte real de una pastilla con orejas es un único bolsillo con esa forma, no dos niveles distintos).

**Medidas de referencia.** Las dimensiones de cavidad de cada plantilla son aproximaciones basadas en referencias públicas de fabricantes y luthiería, documentadas en el campo `description` de cada descriptor. No sustituyen la verificación contra la pastilla real antes de cortar.

### Límite actual: solo rectángulos redondeados

Toda la geometría de Plantillas (pieza, cavidad, orejas) se construye a partir de rectángulos redondeados (`roundedRectPath`), incluyendo casos degenerados como un círculo (ancho = alto, radio = mitad de ambos, ver plantilla Jack) o una cápsula (radio = mitad del alto, ver Single Coil). Esto cubre bien pastillas, bolsillos de mástil, relieves de puente y cavidades de electrónica.

**No cubre** contornos orgánicos reales: la silueta de un pickguard o el contorno completo de un cuerpo de guitarra (Stratocaster, Telecaster, Les Paul, etc.) no son rectángulos, y aproximarlos como tales produciría una forma incorrecta. Por eso `Pickguards` y los ítems de silueta de cuerpo dentro de `Cavidades` permanecen como «Próximamente» en `templates/registry.js` en vez de implementarse con geometría equivocada. Soportarlos correctamente requeriría:

1. Un tipo de geometría nuevo (contorno arbitrario: polilínea o curvas, no solo rectángulo+radio).
2. Datos de contorno reales (coordenadas digitalizadas de una plantilla o plano conocido), no solo dos medidas.
3. Extender `js/template/geometry.js`, `js/gcode/template.js` y `js/template/preview.js` para aceptar ese tipo de geometría junto al rectángulo redondeado existente, sin romper las plantillas actuales.

Es un esfuerzo mayor y deliberadamente aparte del catálogo de pastillas y hardware simple.

## Herramientas previstas

- Surfacing.
- Cantos.
- Ranuras.
- Taladros.
- Cavidades.
- Perfilados.
- Escalas.
- Plantillas.

## Conceptos eliminados de la arquitectura objetivo

Los siguientes conceptos no forman parte de la nueva arquitectura base:

- CAM completo.
- Proyecto global obligatorio.
- Machine Library global.
- Material Library global.
- Recommendation Engine global.
- Simulador global.
- PostProcessor global obligatorio.
- Plugin API pesada.

Pueden existir helpers locales o datos mínimos por herramienta si aportan valor sin complicar el flujo.

## Compatibilidad

La migración debe hacerse por fases. El surfacing actual debe conservar su salida hasta que exista comparación contra salidas esperadas y aprobación explícita para cualquier cambio.
