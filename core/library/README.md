# Library Module

Este módulo carga catálogos locales para herramientas, materiales, máquinas, estrategias y defaults.

## Archivos de configuración

Los datos viven en:

- `config/tools.json`
- `config/materials.json`
- `config/machines.json`
- `config/strategies.json`
- `config/defaults.json`

Los JSON originales son de solo lectura para la aplicación. Las preferencias del usuario se guardan en LocalStorage.

## Responsabilidades

- Cargar catálogos.
- Buscar elementos por `id`.
- Filtrar herramientas, materiales y máquinas.
- Actualizar selección activa.
- Guardar preferencias del usuario en LocalStorage.
- Entregar el contexto seleccionado para el Recommendations Engine.

## Restricciones

- No genera G-code.
- No modifica `generateGcode()`.
- No modifica los JSON originales.
- No requiere servidor.
- No requiere build.
- No usa dependencias externas.

## Nota sobre carga local

Cuando `index.html` se abre con doble click, algunos navegadores pueden bloquear `fetch()` hacia archivos JSON locales por políticas de seguridad. El módulo devuelve un `loadError` controlado para que la aplicación siga funcionando y pueda mostrar una advertencia sin romper el generador actual.
