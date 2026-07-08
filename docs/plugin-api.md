# API de herramientas

## Propósito

Este documento reemplaza la idea de una API pesada de operaciones CAM. La nueva arquitectura usa páginas independientes de herramientas.

Una herramienta no es un plugin complejo. Es una página autónoma con una interfaz mínima y predecible.

## Contrato conceptual de una herramienta

Cada herramienta debe poder describirse con:

```text
ToolPage
├── metadata
├── inputs
├── validate()
├── generateGcode()
├── renderOutput()
└── exportFile()
```

## Metadata

Debe incluir:

- `id` estable.
- `title` visible.
- `description` breve.
- `page` relativa.

Ejemplo:

```json
{
  "id": "surfacing",
  "title": "Surfacing",
  "description": "Aplanado de superficies",
  "page": "pages/surfacing.html"
}
```

## inputs

Cada herramienta define sus propios campos. No debe heredar un formulario global.

Un input debe documentar:

- `id`.
- `label`.
- `type`.
- `unit`.
- `required`.
- `defaultValue` si aplica.

## validate(values)

Valida únicamente los datos de la herramienta actual.

Debe devolver:

```json
{
  "valid": true,
  "errors": [],
  "warnings": []
}
```

## generateGcode(values)

Genera el G-code de la herramienta.

Reglas:

- Debe ser determinista.
- Debe ser legible.
- Debe comentar secciones importantes.
- Debe respetar las reglas de seguridad de la herramienta.
- No debe depender de bibliotecas globales obligatorias.

## renderOutput(result)

Muestra la salida de forma clara para el usuario.

Debe permitir:

- Ver el G-code.
- Copiarlo.
- Descargarlo.

## exportFile(result)

Descarga el archivo usando APIs nativas del navegador.

## Cómo agregar una herramienta nueva

1. Crear `pages/<tool>.html`.
2. Diseñar un formulario mínimo.
3. Documentar entradas y reglas de seguridad.
4. Implementar validación local.
5. Implementar generación local de G-code.
6. Agregar enlace en el menú principal.
7. Agregar casos de comparación de salida si genera G-code.

## Qué no debe hacer una herramienta

- No debe requerir un proyecto CAM global.
- No debe requerir biblioteca global de máquina.
- No debe requerir biblioteca global de material.
- No debe depender de un motor global de recomendaciones.
- No debe modificar otras herramientas.
- No debe agregar frameworks.

## Compatibilidad

Si una herramienta reemplaza una funcionalidad existente, primero debe demostrarse que conserva la salida aprobada o debe pedirse aprobación explícita para cambiarla.
