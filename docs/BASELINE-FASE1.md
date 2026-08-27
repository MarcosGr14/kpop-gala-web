# Baseline — Fase 1, 2026-08-27

- Commit de aplicación: `0a5caf7` (v2.0), árbol limpio antes de empezar.
- Rama: `codex/v2.1-fase1-seguridad`.
- Runtime de pruebas: Node v24.15.0; Node solo se usa para desarrollo.
- Comando: `node --test tests/compatibility.test.cjs`.
- Resultado previo a cambios de producción: **13/13 pruebas aprobadas**.
- No se abrió un navegador, servidor ni perfil real. Cada prueba carga los scripts
  originales en un contexto VM nuevo, con localStorage propio en memoria.
  Red deshabilitada. Los dobles de DOM no equivalen a pruebas visuales.
- Cobertura: scoring moderno/legacy, bytes legacy sin seasonId, cuatro rankings
  aislados, temporadas, catálogo/overrides, archivado/referencias, backups v1/v2,
  Hall manual/automático, métricas y selección de temporada en Analytics.
- No se cambian reglas de desempate, scoring, IDs, claves ni formato legacy.

## Reproducciones antes de corregir

Comando: `node tests/baseline-probes.cjs`.

- Una escritura rechazada de canciones muestra éxito y resetea el formulario.
- Un fallo en la segunda colección de una restauración deja canciones reemplazadas.

Estos probes registran defectos de v2.0; las regresiones nuevas exigirán el
comportamiento seguro. No son parte de las 13 pruebas de compatibilidad.

## Límites de esta baseline

No valida el navegador, IndexedDB nativo, navegación visual, descarga real ni
responsive. Se incorporarán dobles de transacciones y pruebas de controladores
para esta fase; una revisión visual aislada sigue siendo complementaria.

