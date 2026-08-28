# KPop Gala — Diseño, Fase 1: sistema visual

Fecha: 2026-08-27. Fase terminada; no se inicia Fase 2.

## Baseline y alcance

Fuente de verdad: carpeta local. Baseline: `3fee375`, rama anterior `codex/v2.1-fase1-seguridad`; árbol limpio antes de comenzar. Rama de trabajo: `codex/diseno-fase1-sistema-visual`.

Esta es la Fase 1 del roadmap visual, distinta de la fase anterior de seguridad de datos. No se copiaron archivos, componentes ni arquitectura de Spotify Duo Charts. Se mantienen las ocho páginas, sus secciones, navegación y lógica.

Baseline ejecutada antes de editar: 79/79 tests Node y 4/4 comprobaciones nativas de navegador. La nueva regresión de búsqueda falló antes de aplicar la corrección CSS y pasó después.

## Archivos

Producción (rutas relativas a la raíz del repositorio):

- `kpop-gala-web/css/global.css`: tokens, tipografía, base oscura, containers, foco, movimiento reducido y contrato de `hidden`.
- `kpop-gala-web/css/design-system.css` (nuevo): componentes compartidos y adaptación visual de las clases existentes.
- `kpop-gala-web/index.html`, `registro.html`, `semanas.html`, `catalogo.html`, `analytics.html`, `datos.html`, `temporadas.html`, `hall-of-fame.html`: cargan el sistema después de su CSS de página. Registro también traslada estilos de botones e iconos de participantes a CSS.
- `kpop-gala-web/js/app.js`: únicamente colores del placeholder y barra de Artistas.
- `kpop-gala-web/js/analytics.js`: únicamente colores de categoría y selección de ese color para las dos gráficas del perfil. Series, cálculos y firma de la función permanecen iguales.

Verificación/documentación:

- `tests/browser-server.cjs`, `tests/browser-smoke.html`, `tests/browser-smoke.js`: cargar CSS real y probar búsqueda con DOM y layout nativos.
- `tests/visual-server.cjs` (nuevo): servidor local de lectura con fixtures y almacenamiento aislado, permite comparar baseline y versión actual.
- `tests/visual-probe.js` (nuevo): inspección DOM de carga, colores, errores y geometría.
- `docs/DISENO-FASE1.md` (este informe).

## Tokens

73 variables en el bloque raíz, incluyendo aliases de compatibilidad:

| Familia | Definición |
| --- | --- |
| Fondo / superficie / elevada | `--bg: #0B0B0F`, `--surface: #141419`, `--elevated: #1C1C23` |
| Texto | `--text: #F5F5F7`, `--text-muted: #8D8D98`, `--text-soft: #C1C1CE` |
| Roles | song `#F472B6`, artist `#22D3EE`, album `#A78BFA`, bside `#4ADE80`, gala `#FACC15` |
| Participantes | `--p1` rosa, `--p2` cyan; iconos de los ocho formularios verificados |
| Estados | success verde, danger rosa rojizo, focus cyan claro `#67E8F9` |
| Superficies auxiliares | hover, overlay, bordes normal/fuerte, cinco tintes por rol |
| Espaciado | 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px con raíz de 16px |
| Radios | 8 / 12 / 16px; pills 999px |
| Ancho | normal 1200px, Analytics 1280px; gutters 24px / 16px |
| Tipografía | DM Sans + fallbacks del sistema; mono del sistema para labels/datos; números tabulares |
| Movimiento | 150 / 220ms, easing compartido, `prefers-reduced-motion` |
| Sombras | tres niveles negros de intensidad contenida |

Se conservan nombres antiguos como `--rosa`, `--cyan`, `--amarillo`, `--surface2`, `--radius-xl` y `--font-display`. Nunito deja de descargarse; DM Sans es la única familia externa. La app sigue siendo utilizable con fuentes del sistema.

## Componentes unificados

Botones, estados disabled/hover, tabs/pills, inputs/selects, tarjetas y métricas, badges, encabezados, containers, toasts, diálogos y foco visible. Artistas pasa a cyan en tabs, acciones, barras y gráficas; dorado queda principalmente en premios, Hall of Fame y primeros puestos. P1/P2 conserva identificación textual y colores propios.

La hoja nueva utiliza las clases existentes con una especificidad acotada para superar reglas antiguas, incluidas las inyectadas al cargar. No reorganiza grids, formularios ni secciones. Los diálogos conservan dimensiones y comportamiento y comparten superficies oscuras, bordes, radios y centrado.

## Inline y CSS inyectado

40 atributos `style` en los HTML de baseline -> 28 actualmente:

- Se retiraron seis estilos estáticos de botones de categoría y seis de iconos P1/P2. Ahora usan componentes CSS.
- Se mantienen márgenes y algunos bordes de categoría estáticos para evitar una limpieza masiva; el borde de Artistas pasa a su token cyan.
- Se conservan anchos calculados, progreso, visibilidad, imágenes, colores dependientes del contexto y retrasos escalonados de animación en templates JS.
- Se mantienen los tres bloques de CSS inyectado: dos en `data.js` y uno en `app.js`. La nueva capa visual adapta su presentación sin tocar inicialización ni lógica compartida.

## Bug de búsqueda

Regla global: `[hidden]:not([hidden="until-found"]), .hidden { display: none !important; }`.

La prueba usa `crearRankCard` y `crearBuscadorRanking` reales con las hojas reales. Verifica cero coincidencias, coincidencia parcial y búsqueda vacía. Comprueba visibilidad calculada, mensaje vacío y recuperación de `display:flex`. Se conserva el significado nativo de `hidden="until-found"`.

## Aislamiento de datos

- Node: harness con almacenamiento y dependencias simuladas.
- Pruebas nativas: `localStorage` sustituido por un Map; IndexedDB redirigido a una base temporal exclusiva con identificador aleatorio, eliminada al finalizar. Nunca se abre la base real de KPop Gala.
- Revisión visual: servidor en loopback y puerto aleatorio. Antes de ejecutar scripts de la app, sustituye `localStorage` por un Map con datos ficticios y bloquea IndexedDB. Si el aislamiento falla, no ejecuta los scripts de la app. Las recargas vuelven a los fixtures.
- El servidor visual sólo lee archivos permitidos; no modifica el repositorio ni exporta almacenamiento del navegador.
- No se inspeccionó ni modificó almacenamiento del navegador habitual del usuario. Las operaciones de registro durante smoke tests fueron exclusivamente sobre el Map.

## Resultados

| Comprobación | Antes | Después |
| --- | --- | --- |
| Suite Node existente | 79/79 | 79/79 |
| Suite nativa existente | 4/4 | 4/4 |
| Nueva regresión búsqueda | Falla por tarjetas visibles | Pasa |
| Total suite nativa | 4/4 | 5/5; base temporal eliminada |
| Sintaxis JS/CJS | Sin cambios necesarios | Archivos de producción y harness verificados |
| `git diff --check` | Limpio | Sin errores de whitespace |

Revisión de carga y geometría: ocho páginas por 320, 375, 768 y 1280px. Se compararon 32 casos baseline con 32 actuales y se repitieron los 32 al cerrar. Todos los casos finales tuvieron aislamiento activo, encabezado y cero errores JavaScript detectados por la sonda. Los anchos son los del iframe; la scrollbar existente consume hasta 6px del viewport de contenido.

La sonda enumera rectángulos fuera del viewport, incluso elementos dentro de áreas de scroll intencionales; no equivale a una auditoría responsive completa. No aparecieron nuevas zonas de desbordamiento. Persisten los casos previos de navbar, Registrar a 320px y tabla de Semanas en móvil. Hubo variaciones pequeñas por tipografía (por ejemplo unos 3px en Semanas), y los tabs desplazables del Catálogo variaron de anchura. A 768/1280px la sonda no registró elementos fuera del viewport en las ocho páginas.

También se cargaron las ocho páginas a 375px con Google Fonts bloqueado mediante CSP: encabezados presentes y sin errores JavaScript detectados. Analytics vacío se comprobó a 320px.

Smoke interactivo adicional:

- Registro: Spotify 1 + Instafest 2 + 10 reproducciones = 39 puntos; guardado, mensaje y reset correctos sobre datos ficticios.
- Foco por Tab: outline cyan de 2px en control activo.
- Catálogo: abrir y cancelar diálogo; superficies oscuras y campos legibles.
- Temporadas: abrir y cancelar diálogo de creación.
- Semanas: filtro P1 muestra seis filas del participante en el fixture.
- Perfil Artista: Jay Park, dos gráficas cyan y dos semanas de historial.
- P1/P2: los ocho iconos de Registrar alternan rosa/cyan según participante.

## Reproducir

Desde la raíz del repositorio:

```powershell
node tests/run.cjs
node tests/browser-server.cjs
```

Abrir la URL `ISOLATED_TEST_URL` que imprima el segundo comando y pulsar «Ejecutar pruebas aisladas». Detener con Ctrl+C.

Para inspección visual independiente:

```powershell
node tests/visual-server.cjs
```

Abrir la URL `VISUAL_TEST_URL` con, por ejemplo, `/?page=index.html&width=375&version=current`. Cambiar `page` por cualquiera de las ocho páginas y `width` por 320, 375, 768 o 1280. `version=baseline` lee el commit `3fee375`; `system=1` bloquea fuentes externas y `empty=1` usa datos vacíos. El informe DOM aparece debajo del iframe. Este harness ayuda a repetir la inspección: no es una suite automática de regresión de píxeles.

## Capturas y evidencia local

Las capturas contienen datos ficticios. No se añadieron imágenes de QA al repositorio. Carpeta:

`C:/Users/Usuario/.codex/visualizations/2026/08/27/01a04560-2bb0-73a3-953b-25e2fae3524e/design-phase1/`

Archivos: `index-1280.png`, `index-375.png`, `registro-1280.png`, `registro-375.png`, `semanas-1280.png`, `catalogo-1280.png`, `analytics-1280.png`, `datos-1280.png`, `temporadas-1280.png`, `hall-of-fame-1280.png`, `catalogo-dialog.png`, `temporadas-dialog.png`, `analytics-artist.png`, `system-fonts-375.png`. `verification.json` conserva los informes DOM locales. Las capturas del wrapper muestran el viewport de 1000px de altura del iframe, no toda la longitud de la página interior.

## Compatibilidad y riesgos pendientes

Sin cambios en scoring, datos, claves, formatos, migraciones, IDs, APIs, temporadas, backups ni lógica de Hall of Fame. `data.js`, `backup.js` y los handlers de registro/temporadas/Hall permanecen intactos. Se preservan las diferencias existentes entre totales de Inicio (canciones) y Analytics (cuatro categorías).

Pendiente para fases posteriores: responsive de navegación/Registrar/Semanas, auditoría completa de contraste y teclado, y eliminación gradual del CSS duplicado/inyectado. `prefers-reduced-motion` está implementado y revisado en CSS, pero no se probó cambiando la preferencia del sistema operativo. No se verificaron todos los navegadores ni todas las combinaciones de estados/datos reales. La capa de overrides deberá mantenerse ordenada conforme se renueven páginas.

No se implementaron Overview, Gala Race, búsqueda global ni métricas nuevas. No se publicaron cambios en GitHub desde esta fase.
