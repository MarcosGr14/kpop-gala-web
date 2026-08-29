# KPop Gala - Diseño, Fase 2: App Shell + Navbar

Fecha: 2026-08-28. Fase terminada; no se inicia Fase 3.

## Resumen ejecutivo

Las ocho páginas usan el mismo App Shell y el mismo árbol de navegación. En escritorio se muestran Inicio, Registrar, Semanas y Analytics, con Catálogo, Temporadas, Hall of Fame y Datos dentro de Más. A 900px o menos, la misma estructura se presenta como un panel móvil de pantalla disponible, con los ocho destinos visibles.

La navegación ya no depende de esconder el texto de los enlaces. El menú móvil no añade overflow horizontal, bloquea el scroll del documento mientras está abierto y se cierra mediante el botón, Escape o navegación a otro destino. El dropdown Más utiliza un `button` y funciona mediante click, Enter/Space y Escape.

No se añadieron funciones de producto, métricas, páginas ni dependencias. No se inició la Fase 3.

## Baseline y Git

- Fuente de verdad: carpeta local.
- Base visual de Fase 1 confirmada en `9793e4d`.
- Rama de trabajo: `codex/diseno-fase2-app-shell-navbar`.
- Árbol limpio antes de comenzar.
- Baseline Node: 79/79.
- Baseline nativa de navegador: 5/5; base IndexedDB temporal eliminada.
- Commit de implementación: `da2c412 feat(ui): add responsive shared app shell navigation`.
- No se hizo push.

La Fase 1 no estaba en `main` local durante esta ejecución: estaba presente y limpia en la rama aprobada de diseño. La rama de Fase 2 se creó desde ese estado para no perder la base visual ya aceptada.

## Archivos de producción

- `kpop-gala-web/css/global.css`: App Shell, navegación desktop/compacta, dropdown, panel móvil, utilidades accesibles y adaptación del chip de temporada.
- `kpop-gala-web/css/design-system.css`: retiro de tres overrides de la navbar anterior que ya no aplicaban.
- `kpop-gala-web/js/navigation.js` (nuevo): estado del menú y dropdown, `aria-expanded`, Escape, foco y cierre al navegar/cambiar breakpoint.
- `kpop-gala-web/index.html`
- `kpop-gala-web/registro.html`
- `kpop-gala-web/semanas.html`
- `kpop-gala-web/catalogo.html`
- `kpop-gala-web/analytics.html`
- `kpop-gala-web/datos.html`
- `kpop-gala-web/temporadas.html`
- `kpop-gala-web/hall-of-fame.html`

Las ocho páginas contienen la misma semántica de navegación y cargan `navigation.js` después de `data.js`, antes de su script de página.

## Arquitectura elegida

Se conservó la aplicación multipágina y se normalizó el fragmento `<nav>` en cada HTML. No se creó un sistema de templates ni un runtime de componentes porque habría ampliado el riesgo arquitectónico de esta fase.

El árbol es único:

```text
KPop Gala
├── Inicio
├── Registrar
├── Semanas
├── Analytics
└── Más
    ├── Catálogo
    ├── Temporadas
    ├── Hall of Fame
    └── Datos
```

`data.js` conserva su helper histórico que intenta añadir enlaces ausentes. Como los ocho destinos ya están presentes en cada HTML, el helper no duplica ni reordena nada. No fue necesario modificar `data.js`.

El chip de temporada sigue siendo generado por la UI histórica. CSS lo integra dentro del nuevo `nav-shell`; en móvil conserva un nombre accesible visualmente oculto y presenta una variante compacta.

## Comportamiento desktop

- Navbar sticky de 64px, fondo `surface`, borde inferior sutil y sin sombra pesada.
- Contenedor máximo de 1280px para alinear la navegación con el sistema existente.
- Cuatro destinos primarios y botón Más.
- Un solo enlace tiene `aria-current="page"`.
- En páginas secundarias, Más recibe estado visual mediante `nav-has-current`; no declara falsamente que el botón sea la página actual.
- Dropdown alineado a la derecha, con superficie elevada y cuatro enlaces.
- Click o Enter/Space alterna el dropdown. Escape lo cierra y devuelve el foco a Más.
- Al hacer click fuera se cierra.

## Comportamiento tablet y móvil

Breakpoint compacto: `max-width: 900px`.

- 768px y 900px: botón de menú visible y panel cerrado inicialmente.
- 1024px y 1280px: navegación desktop completa.
- Navbar compacta de 60px.
- Botón semántico con etiqueta Abrir/Cerrar menú y `aria-expanded` sincronizado.
- Panel fijo debajo de la navbar, con los ocho destinos del mismo árbol.
- Altura limitada al viewport dinámico y scroll interno si fuera necesario.
- `body.nav-open` bloquea el scroll de fondo.
- El panel se cierra al navegar y la siguiente página inicia cerrada.
- Escape cierra y devuelve el foco al botón.
- No se crea navegación móvil paralela ni se duplican enlaces mediante JavaScript.

## Accesibilidad

- `<nav aria-label="Navegación principal">`, listas, enlaces y botones reales.
- `aria-current="page"` solamente en el destino real.
- `aria-expanded` y `aria-controls` en ambos controles.
- Botones nativos: Tab, Shift+Tab, Enter y Space sin handlers de teclado artificiales.
- Escape cierra dropdown o menú y restaura foco.
- El label del botón cambia entre Abrir menú y Cerrar menú.
- Foco global cyan de 2px heredado de Fase 1; comprobado en el chip/control de navegación.
- El nombre de la temporada permanece disponible para tecnologías de asistencia en móvil.
- Las transiciones usan los tokens de Fase 1 y respetan `prefers-reduced-motion`.

No se añadió focus trap: no es necesario para un panel de navegación que permanece dentro del `<nav>`, pero se mantiene como posibilidad si una auditoría futura convierte el panel en diálogo modal.

## Tests y harness

Archivos de prueba:

- `tests/navigation.test.cjs` (nuevo): contrato de las ocho páginas, orden/hrefs, página actual, script compartido y ausencia de acceso a persistencia en `navigation.js`.
- `tests/browser-smoke.html`: fixture de la navegación real.
- `tests/browser-smoke.js`: abre/cierra menú y dropdown, comprueba ocho hrefs, `aria-expanded` y Escape.
- `tests/browser-server.cjs`: expone `navigation.js` únicamente dentro de su allowlist.
- `tests/visual-server.cjs`: baseline visual pasa a `9793e4d` y admite 1024px.

| Suite | Baseline | Final |
| --- | ---: | ---: |
| Node | 79/79 | 81/81 |
| Navegador nativo | 5/5 | 6/6 |
| Sintaxis JS/CJS | OK | OK |
| `git diff --check` | Limpio | Limpio |

El nuevo test nativo usa el mismo aislamiento: `localStorage` en memoria e IndexedDB redirigido a una base temporal aleatoria, eliminada al terminar. La matriz visual usa `localStorage` en memoria, IndexedDB bloqueado y fixtures ficticios. No se abrió ni modificó el almacenamiento real del navegador.

## QA responsive

Se cargaron las ocho páginas con datos ficticios en 320, 375, 768, 1024 y 1280px: 40 comprobaciones finales.

- Aislamiento activo: 40/40.
- Encabezados presentes: 40/40.
- Errores JavaScript detectados: 0.
- Overflow detectado a 768/1024/1280: 0 en las ocho páginas.
- Navbar/App Shell: 0 overflow en 320 y 375 en las ocho páginas.
- El contenido comienza después de la navbar: 60px en móvil y sin solapamiento.
- Navegación real desde Inicio a Analytics verificada; la página destino inicia cerrada y Analytics queda como único `aria-current`.
- Menú móvil abierto: ancho del documento igual al viewport, `body` bloqueado y ocho enlaces visibles.
- Dropdown desktop: visible con `aria-expanded=true`; Escape lo devuelve a false y conserva foco.

Conteos de elementos fuera del viewport reportados por la sonda actual (incluye hijos de zonas con scroll intencional):

| Ancho | Inicio | Registrar | Semanas | Catálogo | Analytics | Datos | Temporadas | HOF |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 320 | 0 | 102 | 52 | 2 | 0 | 0 | 0 | 0 |
| 375 | 0 | 0 | 40 | 2 | 0 | 0 | 0 | 0 |
| 768 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 1024 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 1280 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Los elementos restantes corresponden al formulario de Registrar a 320px, la tabla de Semanas en móvil y los tabs desplazables del Catálogo. Eran deuda conocida y no son producidos por el App Shell. La navegación anterior contribuía a los conteos móviles; su eliminación explica la reducción en las demás páginas.

## Capturas

Todas usan datos ficticios y se guardaron fuera del repositorio:

`C:/Users/Usuario/.codex/visualizations/2026/08/27/01a04560-2bb0-73a3-953b-25e2fae3524e/design-phase2/`

- `index-1280.png`
- `index-375.png`
- `registro-375.png`
- `analytics-375.png`
- `menu-mobile-open.png`
- `dropdown-desktop.png`

## Preservación y cosas no realizadas

Sin cambios en scoring, rankings, cálculos, `seasonId`, claves de localStorage, IndexedDB, backups, migraciones, catálogo ni Hall of Fame. No se modificaron `data.js`, `backup.js`, `registro.js`, `semanas.js`, `catalogo.js`, `analytics.js`, `temporadas.js` ni `hall-of-fame.js`.

No se rediseñaron ranking, Top 3, Overview, tarjetas, formularios, tabla de Semanas, Analytics, Catálogo, Temporadas ni Hall of Fame. No se añadieron Overview, Gala Race, búsqueda global, métricas, routing SPA, framework, bundler o dependencia.

## Deuda y riesgos pendientes

- Registrar a 320px y Semanas en móvil siguen pendientes para sus fases específicas.
- Los tabs de Catálogo conservan scroll horizontal intencional.
- El HTML del App Shell está repetido en ocho páginas; esto evita un refactor de arquitectura, pero exige mantener el fragmento sincronizado. El test Node reduce ese riesgo.
- `data.js` aún contiene estilos e inyección histórica de navegación por compatibilidad, aunque ya no añade destinos. Una limpieza futura debe hacerse con cobertura específica.
- Falta una auditoría completa de accesibilidad con lectores de pantalla y varios navegadores reales.
- La prueba visual es geométrica y funcional, no una regresión automática de píxeles.

## Reproducción

```powershell
node tests/run.cjs
node tests/browser-server.cjs
node tests/visual-server.cjs
```

El segundo comando imprime `ISOLATED_TEST_URL`; abrirla y ejecutar las pruebas. El tercero imprime `VISUAL_TEST_URL`; admite `page`, `width`, `version`, `system` y `empty`. Detener servidores con Ctrl+C.
