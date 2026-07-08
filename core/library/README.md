# Nota sobre `core/library`

Este módulo pertenece a una iteración anterior orientada a bibliotecas globales de herramientas, materiales y máquinas.

La visión actual del proyecto cambió: Bujia CNC será una caja de herramientas independientes. Por lo tanto, una biblioteca global ya no forma parte de la arquitectura objetivo.

## Estado

- No debe expandirse sin aprobación.
- No debe convertirse en requisito para usar ninguna herramienta.
- No debe condicionar la futura migración a `pages/`.

## Nueva regla

Cada página puede tener presets locales y opcionales si aportan valor, pero no debe requerir una biblioteca global para funcionar.
