# Roadmap

## Fase 1: Replanteamiento documental

- Cambiar la visión de CAM ligero a caja de herramientas CNC.
- Simplificar arquitectura y dominio.
- Eliminar conceptos globales innecesarios de la documentación.
- Mantener intacto el generador actual.

## Fase 2: Menú principal

- Convertir `index.html` en menú principal.
- Agregar enlaces hacia páginas independientes.
- Mantener acceso al surfacing actual durante la migración.

## Fase 3: Surfacing independiente

- Crear `pages/surfacing.html`.
- Migrar el generador actual sin cambiar su G-code aprobado.
- Comparar salida antes/después.

## Fase 4: Utilidades compartidas mínimas

Extraer solo lo que realmente se repite:

- Copiar al portapapeles.
- Descargar archivo.
- Formatear números.
- Mostrar errores.

## Fase 5: Nuevas herramientas

Agregar páginas independientes:

- Cantos.
- Ranuras.
- Taladros.
- Cavidades.
- Perfilados.
- Escalas.

## Fase 6: Casos de regresión

- Crear salidas esperadas por herramienta.
- Comparar G-code generado contra casos conocidos.
- Nunca actualizar salidas esperadas automáticamente.

## Decisiones aplazadas

- Si se necesita configuración global.
- Si alguna herramienta necesita vista previa 2D.
- Si conviene tener helpers G-code compartidos.
- Si alguna página requiere datos predefinidos locales.

## Riesgos

- Convertir de nuevo el proyecto en un CAM complejo.
- Agregar configuraciones globales antes de necesitarlas.
- Romper el surfacing existente durante la migración.
- Crear archivos gigantes en vez de páginas simples.
