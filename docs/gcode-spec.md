# Especificación de G-code

## Alcance

Este documento describe reglas generales para las herramientas que generen G-code dentro de Bujia CNC Toolbox.

La especificación detallada de cada operación debe vivir junto a su herramienta o en un documento específico de esa herramienta.

## Regla general

Cada página independiente que genere G-code debe producir salida:

- Legible.
- Comentada.
- Determinista.
- Segura por defecto.
- Copiable y descargable.

## Surfacing actual

El generador de surfacing existente debe conservarse hasta que se apruebe su migración. Su comportamiento documentado incluye:

- G-code en milímetros con `G21`.
- Coordenadas absolutas iniciales con `G90`.
- Feedrate en mm/min con `G94`.
- Encendido de spindle con `M3 S(valor)`.
- Espera con `G4 P3`.
- Subida a Z seguro antes de moverse.
- Movimiento inicial a `X0 Y0`.
- Patrón zig-zag en Y con avance en X.
- Retorno a Z seguro al finalizar.
- Apagado de spindle con `M5`.
- Fin con `M30`.

## Reglas mínimas de seguridad

- Nunca iniciar corte sin ir primero a Z seguro.
- Nunca moverse a origen cortando.
- Encender spindle antes de bajar en Z si la operación usa spindle.
- Declarar unidades explícitamente.
- Declarar modo absoluto o relativo cuando corresponda.
- Subir a Z seguro antes de regresar al origen.
- Apagar spindle al finalizar si fue encendido.
- Comentar el G-code generado.

## Cambios de formato

Cualquier cambio en el formato de G-code de una herramienta existente requiere aprobación previa y comparación contra salida esperada.
