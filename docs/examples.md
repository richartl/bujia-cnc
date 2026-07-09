# Ejemplos de herramientas

Estos ejemplos reflejan la nueva visión de caja de herramientas independientes.

## Surfacing

Página futura:

```text
pages/surfacing.html
```

Objetivo: aplanar una superficie usando pocos parámetros.

Entradas típicas:

- Ancho X.
- Largo Y.
- Profundidad total.
- Número de pasadas.
- Stepover.
- Feedrate.
- Z seguro.

## Ranuras

Página futura:

```text
pages/slots.html
```

Objetivo: generar ranuras simples con largo, ancho, profundidad y herramienta.

## Taladros

Página futura:

```text
pages/drilling.html
```

Objetivo: generar ciclos simples de perforación o puntos de taladro.

## Cavidades

Página futura:

```text
pages/pockets.html
```

Objetivo: generar cavidades rectangulares o simples para carpintería/luthería.

## Plantillas (Template Builder)

Páginas:

```text
pages/templates.html                  (menú de plantillas por categorías)
pages/template-<id>.html              (constructor por plantilla, mismo esqueleto genérico)
```

Objetivo: elegir una plantilla, ajustar dimensiones y descargar el G-code sin dibujar. Genera `01_Contorno.nc`, `02_Cavidad_<Plantilla>.nc`, `03_Guias.nc` y `preview.svg`, con previsualización 2D en Canvas. Reutilizable: una plantilla nueva solo aporta su geometría (`templates/<id>.js`).

Implementado — Pastillas de guitarra:

- Humbucker, Humbucker (con orejas), Single Coil, P90, Filtertron, Mini Humbucker, Wide Range, Personalizada.

Implementado — Pastillas de bajo:

- Jazz Bass, Precision (bobina partida, dos cavidades), Music Man, Soapbar, EMG35, EMG40, Personalizada.

Pendiente («Próximamente»): Cavidades de cuerpo completo (Stratocaster, Telecaster, Les Paul, Jazz Bass, Precision Bass, Personalizada), Neck Pocket, Pickguards, Puentes, Jack, Controles, Personalizadas.

Las dimensiones de cada plantilla de pastilla son aproximaciones basadas en referencias públicas de fabricantes y luthiería; cada descriptor documenta su fuente y recomienda verificar contra la pastilla real antes de cortar.
