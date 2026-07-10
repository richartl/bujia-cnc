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
- Plantillas (Template Builder): módulo independiente y reutilizable. Implementado el catálogo completo de pastillas de guitarra (Humbucker, Humbucker con orejas, Single Coil, P90, Filtertron, Mini Humbucker, Wide Range, Personalizada), de bajo (Jazz Bass, Precision, Music Man, Soapbar, EMG35, EMG40, Personalizada) y de hardware simple (Neck Pocket, Puentes, Jack, Controles, Personalizadas), todas sobre la misma interfaz, lógica y generador. Pendiente, y deliberadamente aparte por requerir contornos orgánicos reales: Pickguards y las siluetas de cuerpo completo en Cavidades (Stratocaster, Telecaster, Les Paul, Jazz Bass, Precision Bass, Personalizada) — ver `docs/architecture.md`.
- Verificación: herramienta independiente para revisar y corregir parámetros (feedrate, RPM, Z segura, profundidad final, número de pasadas) de un archivo `.nc` ya generado externamente, sin modificar su trayectoria X/Y. Implementada.

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
