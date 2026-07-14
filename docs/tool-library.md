# Herramientas y presets

## Estado en la nueva arquitectura

La nueva visión elimina la biblioteca global obligatoria de herramientas, máquinas y materiales.

Bujia CNC debe funcionar como caja de herramientas independientes. Cada página puede tener presets locales si ayudan al usuario, pero no debe existir una configuración global requerida para poder usar el software.

## Regla

Una herramienta puede incluir presets simples como:

- Diámetros comunes de fresa.
- Extensiones de archivo comunes.
- Valores seguros por defecto.

Pero esos presets deben ser opcionales y locales a la herramienta.

## Qué se elimina

- Machine Library global.
- Material Library global.
- Recommendation Engine global.
- Flujo obligatorio basado en seleccionar herramienta/material/máquina antes de operar.
