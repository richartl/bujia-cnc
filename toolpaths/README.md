# Nota sobre `toolpaths`

Este módulo pertenece a una iteración previa que separaba estrategias de recorrido dentro de una arquitectura más cercana a CAM.

La nueva visión prioriza páginas independientes por herramienta. Un módulo de recorridos puede seguir siendo útil para una herramienta concreta, pero no debe convertirse en núcleo global obligatorio.

## Regla actual

- Surfacing puede usar estrategias si se aprueba.
- Otras herramientas no deben depender de `toolpaths/` salvo necesidad clara.
- El proyecto debe seguir siendo una caja de herramientas simple.
