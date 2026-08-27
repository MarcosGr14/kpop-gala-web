# KPop Gala v2.1 — Fase 1

## Alcance y resultados

Fase limitada a baseline, pruebas y seguridad de datos. Sin frameworks,
migraciones de registros, nuevas claves, cambios de scoring, responsive ni rediseño.
La versión de aplicación y schema permanecen sin modificar: esto no declara
terminadas las demás fases de v2.1.

Baseline previa: commit `0a5caf7`, **13/13** pruebas de compatibilidad aprobadas.
Ver [BASELINE-FASE1.md](BASELINE-FASE1.md).

Verificación final el 2026-08-27:

- **79/79** pruebas de Node aprobadas (Node v24.15.0).
- **4/4** pruebas de IndexedDB/DOM nativos aprobadas en Codex In-app Browser.
- Sintaxis de los nueve scripts de producción verificada con `node --check`.
- `git diff --check` sin errores.
- Ningún dato del navegador real de KPop Gala fue leído ni modificado.

## Cómo repetir las pruebas

Desde la raíz del repositorio:

```text
node tests/run.cjs
```

No requiere npm, paquetes externos ni servidor. Cada prueba crea un contexto VM
nuevo y ejecuta los scripts de producción. localStorage y IndexedDB se sustituyen
por dobles en memoria; la red queda deshabilitada. Los dobles de DOM verifican
controladores y HTML generado, no layout.

Para la comprobación nativa complementaria:

```text
node tests/browser-server.cjs
```

Abrir **la URL de prueba que imprime ese comando** y pulsar “Ejecutar pruebas
aisladas”. No abrir la aplicación real ni importar archivos personales. El servidor
solo expone la página de prueba, su controlador y data.js; escucha en loopback
y utiliza un puerto aleatorio.

Antes de cargar data.js, esa página reemplaza localStorage por un Map y redirige
toda apertura de IndexedDB a una base `kpop_gala_test_<UUID>`. Si el aislamiento
falla, no carga la aplicación. El fixture solo usa registros sintéticos y elimina
su base temporal al terminar. Detener el servidor con Ctrl+C.

No se ha realizado una auditoría visual completa ni una matriz de navegadores.

## Cobertura

| Archivo | Casos |
| --- | --- |
| tests/compatibility.test.cjs | 13: scoring moderno y legacy, 2026 implícito sin reescritura, aislamiento de cuatro rankings, temporadas, participantes, catálogo base/overrides/custom, archivado, referencias, backups v1/v2, Hall, métricas y Analytics. |
| tests/persistence.test.cjs | 29: altas y ediciones de las cuatro categorías para P1/P2, fallos de escritura y reintento, temporadas cerradas, eliminación/Undo, respaldo previo, Hall y APIs booleanas. |
| tests/restoration.test.cjs | 25: fallos en cada clave, rollback exacto, rollback fallido, imágenes atómicas, portadas sobrescritas, validación, bloqueo de restauraciones simultáneas, UI de Datos y cierre/eliminación de temporadas. |
| tests/rendering.test.cjs | 12: texto y atributos escapados, cuatro historiales, Semanas, Catálogo, toasts, IDs opacos, acciones delegadas, SVG, Hall y Undo. |
| tests/browser-smoke.js | 4: abortar transacción nativa ante fallo local, commit completo, restaurar imagen previa y renderizado/acciones en DOM nativo. |

`tests/baseline-probes.cjs` conserva las reproducciones simples de los
dos errores originales. Ahora informa: éxito falso = false, resets = 0
y registros originales preservados = true.

## Cambios de producción

| Archivo | Cambio |
| --- | --- |
| kpop-gala-web/js/data.js | Confirmación de guardado; respaldo obligatorio en operaciones protegidas; captura/recuperación de bytes; restauración coordinada; transacción de imágenes; validación estructural; helpers de acciones; recuperación conjunta de temporada/Hall. |
| kpop-gala-web/js/registro.js | No limpiar ni salir de edición ante fallo; eliminar/deshacer comprobando persistencia; escapar datos; sustituir handlers inline con IDs. |
| kpop-gala-web/js/semanas.js | Confirmar eliminación/Undo y escapar el contenido del historial. |
| kpop-gala-web/js/backup.js | Esperar la restauración completa y bloquear controles de importación/exportación durante la operación. |
| kpop-gala-web/js/hall-of-fame.js | Recalcular mediante una sola escritura, sin borrar primero el resultado manual. |
| kpop-gala-web/js/catalogo.js | Escapar el atributo src de las imágenes. |
| kpop-gala-web/js/analytics.js | Escapar etiquetas SVG. |

No se modificaron HTML, CSS ni assets de producción.

## Restauración y compatibilidad

- Los helpers guardarRegistros* siguen devolviendo booleanos.
- restaurarSnapshotDatos mantiene su API síncrona y sus conteos. No importa
  imágenes, igual que antes. La página Datos usa restaurarBackupCompleto, que
  coordina ambas tecnologías y espera la finalización.
- Se conserva el formato exportado y la compatibilidad de backups sin metadatos
  opcionales. Los campos legacy y extensiones de registros no se reescriben.
- Se rechazan estructuras inválidas e imágenes externas/no embebidas antes de
  reemplazar datos. Las imágenes válidas exportadas por la app siguen admitidas.
- Ante fallo de localStorage se intentan recuperar exactamente los valores
  previos, incluidas claves ausentes. Si la recuperación también falla, el error
  lo indica y mantiene el respaldo previo.
- Todas las imágenes importadas se escriben en una transacción. Las escrituras
  locales se realizan antes de su commit; ante error se abortan las imágenes y
  se compensan las escrituras locales.
- Si una importación sobrescribiría una imagen con otro contenido, su preimagen
  se conserva en el respaldo de seguridad mediante el campo media ya existente.
  Las demás imágenes no se borran. Si ese respaldo no cabe, la operación se
  cancela antes de reemplazar datos.
- Se incluyen las portadas referenciadas solo por Hall of Fame al exportar.
- Se mantienen p1/p2, claves, IDs, scoring, desempates actuales y la interpretación
  sin seasonId = 2026. Los resultados manuales no se sobrescriben al cerrar.
  El botón explícito “usar ranking” conserva su intención original.

## Riesgos y trabajo pendiente

- localStorage e IndexedDB no ofrecen una transacción conjunta durable: un cierre
  abrupto del proceso entre las escrituras y el commit sigue siendo un riesgo.
  La compensación probada cubre errores que la aplicación puede capturar.
- El bloqueo de restauración cubre esta página, no escrituras concurrentes de
  otras pestañas. Evitar editar/importar desde varias pestañas simultáneamente.
- Mantener una copia JSON externa antes de desplegar. El respaldo interno sigue
  siendo el último punto de seguridad, no un historial ilimitado.
- La falta de espacio puede impedir tanto la copia previa como el rollback:
  nunca se afirma éxito en esos casos. Preimágenes grandes pueden impedir importar.
- Pendientes: política de empates, fechas de temporadas con historial, ganadores
  sin puntos, rendimiento de Analytics, limpieza de imágenes huérfanas,
  responsive y accesibilidad general.
- No se ha realizado un refactor grande ni iniciado la Fase 2.

## Commits

- 95df0c1 — test: capture isolated v2.0 compatibility baseline
- 6a9ac99 — fix(storage): confirm writes before reporting success
- 7b93b87 — fix(backups): validate restores and recover storage on failure
- 1a6facb — fix(ui): escape dynamic text and delegate record actions

La comprobación nativa, el comando de pruebas y este informe se entregan en
un commit final independiente de verificación.

