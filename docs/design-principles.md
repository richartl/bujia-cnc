# Principios de diseño

Este documento es la constitución del proyecto. Cualquier cambio debe respetarlo antes que cualquier preferencia técnica.

## Nueva visión del proyecto

Bujia CNC es una **caja de herramientas CNC offline**, no un CAM completo.

El objetivo no es modelar proyectos complejos, administrar bibliotecas globales ni competir con Fusion, Aspire u otros CAM. El objetivo es resolver operaciones repetitivas de taller de la forma más rápida y simple posible.

## Filosofía del proyecto

- El software debe ser extremadamente sencillo para el usuario.
- Internamente puede usar módulos, pero externamente debe sentirse como una herramienta simple.
- La mejor interfaz es aquella donde el usuario llena la menor cantidad posible de datos.
- Cada página debe resolver una sola operación.
- El usuario no debe aprender G-code para usar la herramienta.
- La herramienta debe enseñar sin abrumar.

## Principios fundamentales

1. **Una herramienta, una operación.**
   Surfacing, cantos, ranuras, taladros y cavidades deben vivir como herramientas independientes.

2. **El menú principal no es un CAM.**
   `index.html` debe servir como entrada simple hacia herramientas independientes, no como pantalla de proyecto complejo.

3. **Nunca pedir datos innecesarios.**
   Si una herramienta puede funcionar con pocos campos, no debe agregar controles avanzados por defecto.

4. **No crear complejidad global.**
   No debe existir una biblioteca global obligatoria de máquinas, materiales o recomendaciones si una página puede resolver su operación localmente.

5. **La simplicidad tiene prioridad sobre agregar funciones.**
   Una función que complica el uso común debe rediseñarse, ocultarse o rechazarse.

6. **Cada herramienta debe ser independiente.**
   Agregar o eliminar una herramienta no debe romper otra.

7. **Nunca modificar comportamiento existente sin aprobación.**
   El surfacing actual es funcionalidad existente y debe protegerse.

8. **Toda funcionalidad nueva debe documentarse primero.**
   La documentación guía al código, no al revés.

9. **Todo cambio debe mantener compatibilidad hacia atrás.**
   La migración a páginas independientes debe conservar el G-code aprobado.

10. **El código debe ser fácil de leer antes que inteligente.**
    Archivos pequeños, nombres claros y lógica directa.

## Filosofía de desarrollo

Antes de escribir código se debe actualizar la documentación relevante.

La documentación forma parte del software. Si el código contradice la documentación, el cambio está incompleto.

## Filosofía de arquitectura

El proyecto debe crecer como colección de páginas:

```text
index.html
↓
Menú principal
↓
pages/<tool>.html
↓
Formulario local
↓
Validación local
↓
Generación local de G-code
↓
Descarga / copia
```

No se debe convertir en un flujo CAM global como `Project -> Operations -> Simulation -> PostProcessor` salvo que una herramienta específica lo necesite internamente y sin exponer esa complejidad al usuario.

## Filosofía de interfaz

La interfaz debe ser:

- Simple.
- Rápida.
- Intuitiva.
- Con pocos botones.
- Con pocos parámetros.
- Con advertencias claras.
- Sin pantallas de configuración obligatorias.

Las opciones avanzadas deben estar ocultas hasta que el usuario las necesite.

## Filosofía de cálculo automático

Cada herramienta puede sugerir valores útiles para su operación, por ejemplo:

- Stepover.
- Profundidad por pasada.
- Feedrate.
- RPM.
- Número de pasadas.
- Advertencias de seguridad.

Estas sugerencias deben ser locales a la herramienta. No debe existir un motor global obligatorio de recomendaciones si eso complica el proyecto.

## Filosofía de modularidad

La modularidad principal es por página:

```text
pages/surfacing.html
pages/edge.html
pages/slots.html
pages/drilling.html
pages/pockets.html
```

La lógica compartida debe vivir en módulos pequeños solo cuando aporte valor claro.

## Filosofía del código

El código debe ser:

- Pequeño.
- Modular.
- Legible.
- Documentado.
- Con nombres claros.
- Sin duplicación innecesaria.
- Sin funciones gigantes.
- Sin archivos gigantes.

## Filosofía de documentación

Todo cambio importante deberá reflejarse primero en:

- README.
- Requirements.
- Architecture.
- Domain Model.
- Plugin API.
- JSON Schema.
- Roadmap.
- Changelog.

Después podrá modificarse el código.

## Filosofía de pruebas

Nunca asumir que un cambio es correcto.

Las herramientas que generen G-code deben poder compararse contra salidas conocidas. Si cambia una salida aprobada, debe explicarse exactamente qué cambió, dónde cambió y por qué cambió.

Nunca se deben actualizar automáticamente salidas esperadas.

## Filosofía del usuario

El objetivo no es construir software para ingenieros CAM. El objetivo es construir herramientas que cualquier persona con una CNC pueda usar en pocos minutos.

## Filosofía de largo plazo

El proyecto debe poder crecer durante años agregando páginas independientes, no acumulando todo en un único generador.

## Rules for AI Contributors

1. Siempre leer toda la documentación antes de modificar código.
2. Nunca modificar funcionalidades sin aprobación.
3. Siempre explicar los archivos que cambiarán.
4. Siempre explicar los riesgos.
5. Siempre explicar alternativas.
6. Siempre actualizar la documentación antes del código.
7. Nunca romper compatibilidad.
8. Nunca eliminar funcionalidades existentes sin aprobación.
9. Siempre proponer primero e implementar después.
10. Nunca convertir el proyecto en un CAM global complejo si una herramienta independiente resuelve el problema.
