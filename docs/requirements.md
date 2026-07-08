# Requisitos

## Alcance actual

El proyecto debe mantener compatibilidad hacia atrás con el generador de surfacing existente en `index.html`. La funcionalidad actual es un generador de G-code CNC que corre completamente en el navegador y está orientado a operaciones repetitivas de luthería y carpintería.

## Especificación del HTML actual

### Objetivo

El HTML actual genera G-code para surfacing CNC desde el navegador, sin backend y sin dependencias externas.

### Entradas del formulario

El formulario actual del generador de surfacing incluye las siguientes entradas:

- **Distancia total en X / ancho a cubrir en mm**: ancho total del área que se va a cubrir sobre el eje X.
- **Distancia en Y / largo de cada pasada en mm**: longitud de cada recorrido de corte sobre el eje Y.
- **Número de pasadas de profundidad Z**: cantidad de niveles de profundidad que se ejecutarán hasta alcanzar la profundidad total.
- **Profundidad total en Z a recorrer en mm**: profundidad final de corte, expresada como valor positivo en el formulario y emitida como `Z-valor` en el G-code.
- **Feedrate de corte XY en mm/min**: velocidad de avance para movimientos de corte en X/Y.
- **Feedrate de bajada Z en mm/min**: velocidad de avance para entrar en material sobre el eje Z.
- **Distancia que avanza X en cada pasada / stepover en mm**: incremento lateral en X entre recorridos sucesivos en Y.
- **Diámetro de fresa en mm**: diámetro de la herramienta usado para sugerir stepover y advertir configuraciones peligrosas.
- **RPM / S del spindle**: valor `S` usado al encender el spindle con `M3`.
- **Z seguro para movimientos rápidos en mm**: altura usada para movimientos rápidos sin corte.
- **Nombre del archivo**: nombre de descarga del G-code generado.
- **Dirección inicial**: permite elegir si la primera pasada de Y va en dirección positiva o negativa.

### Validaciones actuales

El HTML actual valida errores básicos antes de generar el G-code:

- X e Y deben ser mayores a `0`.
- El stepover debe ser mayor a `0`.
- La profundidad total Z debe ser mayor a `0`.
- Los feedrates de corte XY y bajada Z deben ser mayores a `0`.
- Si el stepover es mayor al diámetro de la herramienta, se genera una advertencia, pero no se bloquea la salida.

## Requisitos técnicos

- La app debe funcionar offline.
- No debe requerir servidor.
- No debe requerir build.
- No debe usar frameworks.
- Debe poder abrirse como archivo local.
- Debe funcionar en Chrome, Edge, Safari y Firefox.
- Debe mantenerse fácil de modificar.

## Reglas de compatibilidad

- No se debe cambiar una funcionalidad existente sin documentar primero el archivo, función, comportamiento afectado, riesgo y alternativa propuesta.
- La lógica actual del generador de surfacing debe conservarse hasta que se apruebe explícitamente cualquier cambio funcional.
- La documentación debe distinguir entre comportamiento existente, requisitos deseados y trabajo futuro.
