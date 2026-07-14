# Requerimientos

## Objetivo del producto

Bujia CNC debe ser una colección de herramientas CNC independientes para operaciones repetitivas de taller.

No es un CAM completo. No debe gestionar proyectos complejos ni obligar al usuario a configurar máquina, material o bibliotecas globales antes de generar G-code.

## Requerimientos principales

1. La aplicación debe abrirse desde `index.html`.
2. `index.html` debe actuar como menú principal.
3. Cada operación debe vivir en una página independiente.
4. Cada herramienta debe pedir la menor cantidad posible de datos.
5. Cada herramienta debe generar una salida clara y descargable.
6. Todo debe funcionar offline.
7. No debe requerir servidor.
8. No debe requerir build.
9. No debe requerir frameworks.
10. No debe romper el surfacing existente.

## Herramientas iniciales y futuras

- Surfacing.
- Cantos.
- Ranuras.
- Taladros.
- Cavidades.
- Perfilados.
- Escalas.

## Requerimientos de interfaz

Cada página debe:

- Ser simple.
- Usar pocos campos.
- Mostrar advertencias claras.
- Permitir visualizar el G-code.
- Permitir copiar el G-code.
- Permitir descargar el archivo.

## Requerimientos técnicos

- HTML5, CSS3 y JavaScript nativo.
- ES Modules solo cuando ayuden a mantener orden.
- Sin dependencias externas obligatorias.
- Sin servidor HTTP obligatorio.
- Sin base de datos externa.
- Preferencias opcionales con LocalStorage.

## Requerimientos de compatibilidad

- Chrome.
- Edge.
- Firefox.
- Safari.

## Requerimientos de seguridad G-code

Cada herramienta que genere G-code debe documentar sus reglas de seguridad. Como mínimo:

- Declarar unidades.
- Declarar modo absoluto o relativo cuando corresponda.
- Subir a Z seguro antes de movimientos rápidos.
- No regresar al origen cortando.
- Apagar spindle al finalizar si la herramienta lo enciende.
- Terminar de forma clara.
- Generar G-code legible y comentado.

## Requerimientos de pruebas

Cada herramienta debe tener casos conocidos para detectar cambios accidentales de salida. Las salidas esperadas no deben actualizarse automáticamente.
