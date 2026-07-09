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
