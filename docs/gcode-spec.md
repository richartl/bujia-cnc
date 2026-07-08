# Especificación G-code

## Especificación del HTML actual

### Objetivo

El HTML actual genera G-code para surfacing CNC desde el navegador, sin backend y sin dependencias externas.

## Funciones actuales

El generador de surfacing actual:

- Calcula la profundidad por pasada dividiendo la profundidad total entre el número de pasadas Z.
- Sugiere el stepover usando el diámetro de la fresa.
- Sugiere un rango de 30% a 50% del diámetro.
- Marca como conservador el 40% del diámetro.
- Genera G-code en milímetros con `G21`.
- Usa `G90` para coordenadas absolutas al inicio.
- Usa `G94` para feedrate en mm/min.
- Enciende el spindle con `M3 S(valor)`.
- Espera 3 segundos con `G4 P3`.
- Sube a Z seguro antes de moverse.
- Va a `X0 Y0` antes de iniciar.
- Para cada pasada en Z, baja a la profundidad correspondiente.
- Cambia a `G91` para hacer el recorrido relativo.
- Hace un patrón zig-zag en Y.
- Avanza en X según el stepover.
- Alterna dirección en Y en cada pasada.
- Al terminar cada pasada Z, vuelve a `G90`.
- Sube a Z seguro.
- Al final vuelve a `X0 Y0`.
- Apaga el spindle con `M5`.
- Termina con `M30`.
- Permite visualizar el G-code generado.
- Permite descargar el archivo como `.nc`, `.gcode` o `.tap`.
- Permite copiar el G-code al portapapeles.
- Valida errores básicos de X, Y, Z, stepover y feedrates.
- Advierte si el stepover es mayor al diámetro de la herramienta.

## Secuencia actual de salida

La salida de G-code actual sigue esta estructura general:

1. Inicio del programa con `%`.
2. Comentarios descriptivos sobre área, pasadas Z, profundidad, stepover y feedrate.
3. Advertencias, si existen.
4. Declaración de unidades con `G21`.
5. Declaración de coordenadas absolutas con `G90`.
6. Declaración de feedrate por minuto con `G94`.
7. Encendido de spindle con `M3 S(valor)`.
8. Espera fija con `G4 P3`.
9. Movimiento rápido a Z seguro con `G0 Z(valor)`.
10. Movimiento rápido al origen de trabajo con `G0 X0 Y0`.
11. Repetición por cada pasada Z:
    - Comentario de inicio de pasada Z.
    - Modo absoluto con `G90`.
    - Movimiento a `X0 Y0`.
    - Bajada a profundidad con `G1 Z-valor Fvalor`.
    - Modo relativo con `G91`.
    - Feedrate de corte XY.
    - Movimientos zig-zag alternando `Y` positivo y negativo.
    - Avances laterales en `X` según stepover.
    - Regreso a `G90`.
    - Subida a Z seguro.
12. Cierre en modo absoluto con `G90`.
13. Subida a Z seguro.
14. Regreso a `X0 Y0`.
15. Apagado de spindle con `M5`.
16. Fin de programa con `M30`.
17. Cierre con `%`.

## Reglas de seguridad del G-code

- Nunca debe iniciar un corte sin ir primero a Z seguro.
- Nunca debe moverse a `X0 Y0` cortando.
- El spindle debe encender antes de bajar en Z.
- Debe existir una espera configurable después de encender el spindle.
- Las unidades deben declararse explícitamente.
- El modo absoluto o relativo debe declararse explícitamente.
- Al finalizar debe subir a Z seguro antes de regresar al origen.
- Al finalizar debe apagar el spindle.
- Todo G-code generado debe ser legible y comentado.

## Observación sobre comportamiento actual y requisitos futuros

La espera posterior al encendido del spindle existe actualmente como `G4 P3`, pero todavía no es configurable desde el formulario. Convertirla en configurable sería una mejora funcional futura y debe aprobarse antes de modificar la lógica del generador.
