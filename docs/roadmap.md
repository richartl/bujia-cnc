# Roadmap

## Fase 1: Surfacing

- Documentar completamente el comportamiento actual del HTML de surfacing.
- Mantener la lógica existente sin cambios hasta contar con aprobación explícita para refactorizar.
- Preservar compatibilidad con ejecución offline, sin servidor, sin build y sin frameworks.
- Añadir pruebas manuales documentadas para validar el G-code generado antes de cualquier cambio funcional.

## Fase 2: Modularización segura

- Proponer una separación gradual de lógica desde `index.html` hacia módulos bajo `js/`.
- Definir pruebas de regresión antes de mover funciones existentes.
- No cambiar nombres de entradas, salida ni formato de G-code sin aprobación.

## Fase 3: Cantos

- Agregar operaciones para cantos cuando la especificación funcional esté definida.
- Mantener documentación separada entre surfacing y nuevas operaciones.

## Fase 4: Biblioteca de herramientas

- Definir una biblioteca de herramientas con diámetro, feeds recomendados y parámetros reutilizables.
- Mantener las recomendaciones como ayuda al usuario, sin reemplazar la validación explícita.

## Fase 5: Visualizador

- Explorar un visualizador simple de trayectorias.
- Evitar dependencias externas salvo aprobación explícita.
- Mantener la app usable como archivo local.

## Deuda técnica identificada

- La espera del spindle está fija en `G4 P3`; el requisito de seguridad indica que debe ser configurable en el futuro.
- La lógica funcional está embebida en `index.html`; modularizarla facilitaría mantenimiento, pero puede introducir riesgos de regresión.
- Los archivos bajo `js/` están preparados como estructura futura, pero aún no implementan la lógica activa.
