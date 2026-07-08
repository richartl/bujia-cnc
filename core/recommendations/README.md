# Nota sobre `core/recommendations`

Este módulo pertenece a una iteración anterior orientada a un Recommendations Engine global.

La visión actual elimina el motor global de recomendaciones como pieza central. Las sugerencias deben ser locales a cada herramienta cuando sean útiles.

## Estado

- No debe expandirse sin aprobación.
- No debe ser requisito para generar G-code.
- No debe obligar a seleccionar máquina, material o biblioteca global.

## Nueva regla

Cada herramienta puede sugerir valores simples y seguros para su operación, pero debe hacerlo sin complicar la interfaz ni crear dependencia global.
