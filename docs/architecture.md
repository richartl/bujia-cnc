# Arquitectura

## Estado actual

El proyecto usa HTML, CSS y JavaScript puro. La implementación funcional actual vive en `index.html` como una página autocontenida que puede abrirse directamente en el navegador.

## Especificación del HTML actual

### Objetivo

El HTML actual genera G-code para surfacing CNC desde el navegador, sin backend y sin dependencias externas.

### Componentes actuales

- **Interfaz HTML**: formulario de parámetros, botones de acción y área de texto para visualizar el G-code generado.
- **CSS embebido**: estilos simples para usar la app como herramienta local de taller.
- **JavaScript embebido**:
  - Lectura de valores del formulario.
  - Limpieza/formato de números.
  - Sugerencia de stepover a partir del diámetro de fresa.
  - Validación básica de entradas.
  - Generación de G-code de surfacing.
  - Descarga del archivo generado.
  - Copia del G-code al portapapeles.

## Entradas del formulario actual

- Distancia total en X / ancho a cubrir en mm.
- Distancia en Y / largo de cada pasada en mm.
- Número de pasadas de profundidad Z.
- Profundidad total en Z a recorrer en mm.
- Feedrate de corte XY en mm/min.
- Feedrate de bajada Z en mm/min.
- Distancia que avanza X en cada pasada / stepover en mm.
- Diámetro de fresa en mm.
- RPM / S del spindle.
- Z seguro para movimientos rápidos en mm.
- Nombre del archivo.
- Dirección inicial: primero Y positivo o primero Y negativo.

## Flujo actual

1. Al cargar la página, se calcula la sugerencia de stepover y se genera un G-code inicial con los valores por defecto.
2. El usuario ajusta parámetros del formulario.
3. Al presionar **Generar G-code**, se validan entradas y se actualiza el área de texto.
4. Al presionar **Descargar .nc**, si no hay salida previa se genera el G-code y luego se descarga el archivo.
5. Al presionar **Copiar**, si no hay salida previa se genera el G-code y luego se intenta copiar al portapapeles.

## Requisitos técnicos de arquitectura

- La app debe funcionar offline.
- No debe requerir servidor.
- No debe requerir build.
- No debe usar frameworks.
- Debe poder abrirse como archivo local.
- Debe funcionar en Chrome, Edge, Safari y Firefox.
- Debe mantenerse fácil de modificar.

## Módulos preparados

Existen archivos JavaScript separados bajo `js/` para una arquitectura modular futura, pero actualmente contienen marcadores `TODO`. La lógica activa del generador no debe moverse ni refactorizarse sin confirmación previa porque eso podría modificar o romper comportamiento existente.
