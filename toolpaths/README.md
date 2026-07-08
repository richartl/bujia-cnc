# Toolpath Strategies

Este módulo separa la estrategia de recorrido del generador de G-code.

## Regla principal

Las estrategias generan Toolpaths neutrales. No generan G-code.

El flujo correcto es:

```text
Strategy -> Toolpath -> G-code renderer
```

Nunca:

```text
Strategy -> G-code
```

## Estrategias iniciales

- `zigzag`: estrategia por defecto; conserva el recorrido actual.
- `oneway`: recorrido inicial de una sola orientación.
- `rasterx`: raster con eje principal X conceptual.
- `rastery`: raster con eje principal Y conceptual.

## Interfaz obligatoria

Cada estrategia debe implementar:

- `generate(parameters)`
- `estimateTime(toolpath, context)`
- `estimateDistance(toolpath, context)`
- `validate(parameters, context)`

## Compatibilidad

`zigzag` debe seguir existiendo y debe conservar el comportamiento actual por defecto.
