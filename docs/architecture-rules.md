# Reglas de arquitectura

Este documento define reglas técnicas absolutas para la nueva visión de Bujia CNC como caja de herramientas CNC offline.

## Regla más importante

El software siempre debe poder ejecutarse abriendo:

```text
index.html
```

Flujo obligatorio:

```text
Doble click
↓
index.html
↓
Menú principal
↓
Herramienta independiente
```

Esta regla es innegociable.

## Tecnologías permitidas

Solo tecnologías nativas del navegador:

- HTML5.
- CSS3.
- JavaScript ES Modules.
- Canvas API.
- SVG.
- LocalStorage.
- IndexedDB si alguna herramienta lo justifica.
- Clipboard API.
- Blob API.
- File API.
- Drag & Drop API.
- Web Workers si alguna herramienta pesada lo necesita.

## Tecnologías prohibidas como requisito de ejecución

No se debe requerir:

- NodeJS.
- npm, pnpm, yarn o bun.
- Webpack, Vite, Rollup o Parcel.
- Angular, React, Vue o Svelte.
- Backend.
- Docker.
- Base de datos externa.
- Servidor HTTP obligatorio.
- Compilación obligatoria.
- Bundlers.
- Transpiladores.
- Minificación obligatoria.

## Filosofía técnica

La aplicación debe ser:

- Portable.
- Duradera.
- Simple.
- Fácil de mantener.
- Capaz de ejecutarse dentro de diez años con un navegador común.

## Arquitectura objetivo

```text
index.html
└── pages/
    ├── surfacing.html
    ├── edge.html
    ├── slots.html
    ├── drilling.html
    ├── pockets.html
    └── settings.html
```

`index.html` debe ser un menú principal. Cada página debe funcionar como herramienta independiente.

## Módulos compartidos

Se permiten módulos compartidos únicamente si mantienen la simplicidad:

```text
shared/
├── gcode.js
├── validation.js
├── download.js
├── format.js
└── ui.js
```

Los módulos compartidos no deben convertirse en un núcleo CAM global obligatorio.

## Imports

Si se usan módulos, deben usar:

- `import`.
- `export`.
- ES Modules.

Nunca:

- `require()`.
- CommonJS.
- Bundlers obligatorios.

## Dependencias

La política es JavaScript puro primero.

Una dependencia externa solo podrá proponerse si:

1. Resuelve un problema real.
2. No existe una API nativa razonable.
3. No rompe la ejecución desde `index.html`.
4. No requiere build.
5. Fue aprobada explícitamente.

## Performance

Cada herramienta debe cargar rápido. No se aceptan frameworks ni librerías pesadas para formularios simples.

## Offline

Todo debe funcionar sin internet:

- Aplicación.
- Documentación.
- Páginas de herramientas.
- Descarga de G-code.

## Almacenamiento

Si alguna herramienta necesita preferencias, debe usar tecnologías del navegador:

- LocalStorage para ajustes simples.
- IndexedDB solo si realmente se necesita más estructura.

Nunca base de datos externa.

## Modularidad por herramienta

Cada operación debe vivir como página independiente:

- Surfacing.
- Cantos.
- Ranuras.
- Taladros.
- Cavidades.
- Perfilados.
- Escalas.

Eliminar, modificar o agregar una página no debe romper las demás.

## Generación de G-code

Cada herramienta puede generar su propio G-code si eso mantiene la simplicidad.

No se exige un postprocesador global. Si en el futuro una herramienta necesita dialectos, debe resolverlo localmente o mediante un módulo compartido pequeño y aprobado.

## Simulación

No existe obligación de simulador global. Una herramienta puede incluir vista previa 2D local si aporta valor claro y no complica el uso básico.

## Pruebas

Las herramientas que generen G-code deben tener casos de comparación conocidos.

Reglas:

- Nunca actualizar automáticamente salidas esperadas.
- Siempre mostrar diferencias.
- Siempre explicar diferencias.
- Cambiar una salida aprobada requiere aprobación.

## Architecture Rules for AI Contributors

1. Siempre leer toda la documentación.
2. Nunca modificar código sin entender el proyecto.
3. Nunca romper compatibilidad.
4. Nunca eliminar funcionalidades.
5. Nunca modificar comportamiento existente sin aprobación.
6. Siempre explicar cambios, archivos afectados y riesgos.
7. Siempre proponer primero e implementar después.
8. Siempre mantener compatibilidad con abrir `index.html`.
9. Nunca proponer frameworks para formularios simples.
10. Nunca proponer Node, backend o build como requisito de ejecución.
11. Nunca convertir el proyecto en una SPA dependiente de herramientas externas.
12. Mantener cada herramienta independiente.

## Objetivo final

El proyecto debe poder crecer durante años con muchas páginas de herramientas sin dejar de ser simple para el usuario.
