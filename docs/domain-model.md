# Modelo de dominio

## Enfoque

El modelo de dominio se simplifica para la nueva visión: Bujia CNC es una caja de herramientas independientes, no un CAM completo.

El dominio central ya no es `Project -> Operation -> Toolpath -> PostProcessor`. El dominio central es:

```text
Toolbox
└── Tool Page
    ├── Inputs
    ├── Validation
    ├── G-code Output
    └── Export
```

## Entidades principales

## 1. Toolbox

### Descripción

Conjunto de herramientas CNC disponibles desde el menú principal.

### Responsabilidad

- Mostrar herramientas disponibles.
- Dirigir al usuario a la página correcta.
- No ejecutar lógica compleja.

### Atributos

- `name`.
- `version`.
- `tools[]`.

### Ejemplo

```json
{
  "name": "Bujia CNC Toolbox",
  "version": "0.2.0",
  "tools": ["surfacing", "slots", "drilling"]
}
```

## 2. Tool Page

### Descripción

Página independiente que resuelve una operación CNC.

### Responsabilidad

- Presentar formulario.
- Validar entradas.
- Generar G-code de su operación.
- Permitir copiar o descargar.

### Atributos

- `id`.
- `title`.
- `description`.
- `inputs[]`.
- `outputs[]`.

### Ejemplo

```json
{
  "id": "surfacing",
  "title": "Surfacing",
  "description": "Genera G-code para aplanar una superficie."
}
```

## 3. Input

### Descripción

Dato que una herramienta pide al usuario.

### Responsabilidad

- Capturar un valor necesario.
- Definir unidad y validación básica.

### Atributos

- `id`.
- `label`.
- `type`.
- `unit`.
- `required`.
- `defaultValue`.

### Ejemplo

```json
{
  "id": "widthX",
  "label": "Ancho X",
  "type": "number",
  "unit": "mm",
  "required": true
}
```

## 4. Validation

### Descripción

Resultado de revisar los datos de una herramienta.

### Responsabilidad

- Bloquear errores críticos.
- Mostrar advertencias útiles.

### Atributos

- `valid`.
- `errors[]`.
- `warnings[]`.

### Ejemplo

```json
{
  "valid": false,
  "errors": ["X debe ser mayor que cero"],
  "warnings": []
}
```

## 5. Warning

### Descripción

Mensaje preventivo que no necesariamente bloquea la generación.

### Responsabilidad

- Informar riesgos.
- Sugerir revisión.

### Atributos

- `level`.
- `message`.
- `field`.

### Ejemplo

```json
{
  "level": "warning",
  "field": "stepover",
  "message": "El stepover es mayor al diámetro de la herramienta."
}
```

## 6. G-code Output

### Descripción

Texto final generado por una herramienta.

### Responsabilidad

- Ser legible.
- Ser copiable.
- Ser descargable.

### Atributos

- `fileName`.
- `extension`.
- `content`.

### Ejemplo

```json
{
  "fileName": "surfacing.nc",
  "extension": "nc",
  "content": "G21\nG90\n..."
}
```

## 7. Tool Settings

### Descripción

Preferencias opcionales y locales para una página o para la caja de herramientas.

### Responsabilidad

- Recordar valores útiles sin obligar al usuario a configurar una biblioteca.

### Atributos

- `lastUsedToolId` opcional.
- `lastValues` opcional.
- `preferredExtension` opcional.

## Conceptos removidos del dominio base

Los siguientes conceptos ya no son entidades centrales obligatorias:

- `Machine` global.
- `Material` global.
- `Project` CAM.
- `Job` CAM.
- `Simulation` global.
- `PostProcessor` global.
- `Recommendation` global.
- Bibliotecas globales de herramientas, máquinas o materiales.

Una página puede usar datos locales equivalentes si son necesarios para su operación, pero no deben convertirse en requisito para todo el proyecto.
