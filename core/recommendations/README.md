# Recommendations Engine

Este módulo calcula recomendaciones para operaciones CNC sin generar G-code.

## Responsabilidad

El motor recomienda automáticamente:

- RPM.
- Feedrate.
- Plunge.
- Profundidad por pasada.
- Stepover.
- Porcentaje de stepover.
- Número recomendado de pasadas.
- Advertencias.
- Nivel de confianza.
- Explicaciones.

## Entradas

La función principal recibe un objeto con:

- `tool`.
- `material`.
- `machine`.
- `operation`.

Los objetos pueden ser parciales. Si faltan datos, el motor devuelve recomendaciones parciales, advertencias y menor confianza.

## Salida

La salida es un objeto `Recommendation`:

```js
{
  recommendedRPM: number | null,
  recommendedFeed: number | null,
  recommendedPlunge: number | null,
  recommendedDepthPerPass: number | null,
  recommendedStepover: number | null,
  recommendedStepoverPercent: number | null,
  recommendedPasses: number | null,
  warnings: [
    {
      code: string,
      message: string,
      severity: "info" | "warning" | "error"
    }
  ],
  confidence: "low" | "medium" | "high",
  explanation: string[]
}
```

## Uso conceptual

```js
import { getRecommendations } from "./core/recommendations/recommendations.js";

const recommendation = getRecommendations({ tool, material, machine, operation });
```

## Reglas importantes

- No genera G-code.
- No modifica `generateGcode()`.
- No modifica Toolpaths.
- No modifica operaciones.
- No lee ni escribe en el DOM.
- No descarga archivos.
- No copia al portapapeles.
- No usa dependencias externas.
- Usa JavaScript puro y ES Modules.

## Compatibilidad

Este módulo está aislado del generador actual. Prepararlo no cambia el comportamiento existente de `index.html` ni el formato actual del G-code.
