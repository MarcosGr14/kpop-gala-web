// ============================================================
//  KPOP GALA — DATA.JS · v1.5 Analytics & Detail Views
//  Datos, semanas, puntaje y capa segura de almacenamiento
// ============================================================

const KPOP_GALA_APP_VERSION = "2.0.0";
const KPOP_GALA_SCHEMA_VERSION = 2;

// ── Temporadas · v2.0 ─────────────────────────────────────────
// Los registros históricos 2026 NO se migran. Si un registro antiguo no tiene
// seasonId, KPop Gala lo interpreta como perteneciente a 2026.
const KPOP_GALA_LEGACY_SEASON_ID = "2026";
const KPOP_GALA_SEASONS_KEY = "kpop_gala_seasons_v2";
const KPOP_GALA_ACTIVE_SEASON_KEY = "kpop_gala_active_season_v2";
const KPOP_GALA_HOF_KEY = "kpop_gala_hall_of_fame_v2";

const KPOP_GALA_DEFAULT_SEASON = Object.freeze({
  id: "2026",
  anio: 2026,
  nombre: "Temporada 2026",
  inicio: "2026-06-01",
  fin: "2026-12-06",
  estado: "activa",
  createdAt: "2026-01-01T00:00:00.000Z",
});

function kgLeerLocalJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function kgEscribirLocalJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function normalizarFechaISO(valor, fallback) {
  const s = String(valor || "");
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : fallback;
}

function limpiarTextoTemporada(valor, fallback) {
  const txt = String(valor ?? "").trim().replace(/\s+/g, " ");
  return (txt || fallback).slice(0, 60);
}

function normalizarTemporada(raw, fallback = KPOP_GALA_DEFAULT_SEASON) {
  const t = raw && typeof raw === "object" ? raw : {};
  const anio = Number(t.anio) || Number(fallback.anio) || 2026;
  const id = String(t.id || anio);
  const inicio = normalizarFechaISO(t.inicio, fallback.inicio);
  const fin = normalizarFechaISO(t.fin, fallback.fin);
  return {
    id,
    anio,
    nombre: limpiarTextoTemporada(t.nombre, `Temporada ${anio}`),
    inicio,
    fin,
    estado: t.estado === "cerrada" ? "cerrada" : "activa",
    createdAt: t.createdAt || new Date().toISOString(),
    closedAt: t.closedAt || null,
  };
}

function cargarTemporadas() {
  const raw = kgLeerLocalJSON(KPOP_GALA_SEASONS_KEY, []);
  const lista = Array.isArray(raw) ? raw.map(x => normalizarTemporada(x)).filter(Boolean) : [];
  if (!lista.some(x => x.id === KPOP_GALA_LEGACY_SEASON_ID)) lista.unshift({ ...KPOP_GALA_DEFAULT_SEASON });
  return lista.sort((a, b) => a.anio - b.anio || a.nombre.localeCompare(b.nombre, "es"));
}

function guardarTemporadas(temporadas) {
  const lista = Array.isArray(temporadas) ? temporadas.map(x => normalizarTemporada(x)) : [];
  if (!lista.some(x => x.id === KPOP_GALA_LEGACY_SEASON_ID)) lista.unshift({ ...KPOP_GALA_DEFAULT_SEASON });
  return kgEscribirLocalJSON(KPOP_GALA_SEASONS_KEY, lista);
}

function obtenerTemporadaPorId(id) {
  return cargarTemporadas().find(t => String(t.id) === String(id)) || null;
}

function obtenerTemporadaActivaId() {
  const id = String(localStorage.getItem(KPOP_GALA_ACTIVE_SEASON_KEY) || KPOP_GALA_LEGACY_SEASON_ID);
  return obtenerTemporadaPorId(id) ? id : KPOP_GALA_LEGACY_SEASON_ID;
}

function obtenerTemporadaActiva() {
  return obtenerTemporadaPorId(obtenerTemporadaActivaId()) || { ...KPOP_GALA_DEFAULT_SEASON };
}

function runtimeTemporada(temp) {
  const t = normalizarTemporada(temp);
  return {
    ...t,
    inicio: new Date(`${t.inicio}T00:00:00`),
    fin: new Date(`${t.fin}T23:59:59`),
  };
}

const KPOP_GALA_TEMPORADA = runtimeTemporada(obtenerTemporadaActiva());

function activarTemporada(id) {
  const temp = obtenerTemporadaPorId(id);
  if (!temp) throw new Error("La temporada no existe.");
  localStorage.setItem(KPOP_GALA_ACTIVE_SEASON_KEY, temp.id);
  return temp;
}

function temporadaEstaCerrada(id = obtenerTemporadaActivaId()) {
  return obtenerTemporadaPorId(id)?.estado === "cerrada";
}

function obtenerIdTemporadaRegistro(registro) {
  return String(registro?.seasonId || KPOP_GALA_LEGACY_SEASON_ID);
}

function registroPerteneceTemporada(registro, temporadaId = obtenerTemporadaActivaId()) {
  return obtenerIdTemporadaRegistro(registro) === String(temporadaId);
}

function filtrarRegistrosTemporada(registros, temporadaId = obtenerTemporadaActivaId()) {
  return (Array.isArray(registros) ? registros : []).filter(r => registroPerteneceTemporada(r, temporadaId));
}

function crearTemporada({ anio, nombre, inicio, fin }) {
  const year = Number(anio);
  if (!Number.isInteger(year) || year < 2020 || year > 2100) throw new Error("Ingresa un año válido.");
  const id = String(year);
  const temporadas = cargarTemporadas();
  if (temporadas.some(t => t.id === id || t.anio === year)) throw new Error(`Ya existe una temporada para ${year}.`);
  const ini = normalizarFechaISO(inicio, "");
  const end = normalizarFechaISO(fin, "");
  if (!ini || !end) throw new Error("Selecciona una fecha de inicio y una de fin.");
  if (new Date(`${ini}T00:00:00`) > new Date(`${end}T23:59:59`)) throw new Error("La fecha de fin debe ser posterior al inicio.");
  const temp = normalizarTemporada({
    id,
    anio: year,
    nombre: limpiarTextoTemporada(nombre, `Temporada ${year}`),
    inicio: ini,
    fin: end,
    estado: "activa",
    createdAt: new Date().toISOString(),
  }, { ...KPOP_GALA_DEFAULT_SEASON, id, anio: year, inicio: ini, fin: end });
  const semanas = generarSemanas(temp);
  if (!semanas.length || semanas.length > 60) throw new Error("La temporada debe contener entre 1 y 60 semanas.");
  exigirBackupSeguridad("antes_de_crear_temporada");
  temporadas.push(temp);
  if (!guardarTemporadas(temporadas)) throw new Error("No se pudo guardar la temporada.");
  return temp;
}

function actualizarTemporada(id, cambios = {}) {
  const temporadas = cargarTemporadas();
  const idx = temporadas.findIndex(t => t.id === String(id));
  if (idx < 0) throw new Error("Temporada no encontrada.");
  const anterior = temporadas[idx];
  const nueva = normalizarTemporada({ ...anterior, ...cambios, id: anterior.id, anio: anterior.anio }, anterior);
  if (new Date(`${nueva.inicio}T00:00:00`) > new Date(`${nueva.fin}T23:59:59`)) throw new Error("Las fechas de la temporada no son válidas.");
  if (generarSemanas(nueva).length > 60) throw new Error("La temporada no puede superar 60 semanas.");
  exigirBackupSeguridad("antes_de_editar_temporada");
  temporadas[idx] = nueva;
  if (!guardarTemporadas(temporadas)) throw new Error("No se pudo actualizar la temporada.");
  return nueva;
}

function temporadaTieneRegistros(id) {
  return [
    ...cargarRegistros(),
    ...cargarRegistrosArtistas(),
    ...cargarRegistrosAlbumes(),
    ...cargarRegistrosBsides(),
  ].some(r => registroPerteneceTemporada(r, id));
}

function contarRegistrosTemporada(id) {
  return {
    canciones: filtrarRegistrosTemporada(cargarRegistros(), id).length,
    artistas: filtrarRegistrosTemporada(cargarRegistrosArtistas(), id).length,
    albumes: filtrarRegistrosTemporada(cargarRegistrosAlbumes(), id).length,
    bsides: filtrarRegistrosTemporada(cargarRegistrosBsides(), id).length,
  };
}

function cerrarTemporada(id) {
  const temp = obtenerTemporadaPorId(id);
  if (!temp) throw new Error("Temporada no encontrada.");
  return ejecutarCambioLocalSeguro("antes_de_cerrar_temporada", () => {
    guardarHallOfFameAutomatico(id);
    const temporadas = cargarTemporadas();
    const cerrada = { ...temp, estado: "cerrada", closedAt: new Date().toISOString() };
    if (!guardarTemporadas(temporadas.map(t => t.id === temp.id ? cerrada : t))) throw new Error("No se pudo cerrar la temporada.");
    return cerrada;
  });
}

function reabrirTemporada(id) {
  return actualizarTemporada(id, { estado: "activa", closedAt: null });
}

function eliminarTemporada(id) {
  const sid = String(id);
  const eraActiva = obtenerTemporadaActivaId() === sid;
  if (sid === KPOP_GALA_LEGACY_SEASON_ID) throw new Error("La temporada 2026 es la base histórica y no se elimina.");
  if (temporadaTieneRegistros(sid)) throw new Error("Esta temporada tiene registros. Ciérrala para conservar su historial.");
  return ejecutarCambioLocalSeguro("antes_de_eliminar_temporada", () => {
    const temporadas = cargarTemporadas().filter(t => t.id !== sid);
    if (!guardarTemporadas(temporadas)) throw new Error("No se pudo eliminar la temporada.");
    const hof = cargarHallOfFame();
    delete hof[sid];
    if (!guardarHallOfFame(hof)) throw new Error("No se pudo guardar el Hall of Fame.");
    if (eraActiva) activarTemporada(KPOP_GALA_LEGACY_SEASON_ID);
    return true;
  });
}

function rangoTemporadaTexto(temp = obtenerTemporadaActiva()) {
  const ini = temp?.inicio instanceof Date ? new Date(temp.inicio) : new Date(`${temp.inicio}T00:00:00`);
  const fin = temp?.fin instanceof Date ? new Date(temp.fin) : new Date(`${temp.fin}T00:00:00`);
  const f = d => d.toLocaleDateString("es-PA", { day: "2-digit", month: "short", year: "numeric" });
  return `${f(ini)} – ${f(fin)}`;
}

const CANCIONES_BASE = [
  { id: 1,  nombre: "Blue Valentine",  artista: "NMIXX",  img: "assets/canciones/NMIXX.jpg"  },
  { id: 2,  nombre: "VOYAGER",  artista: "XDINARY HEROES",  img: "assets/canciones/XDINARYHEROES.png"  },
  { id: 6,  nombre: "Moonwalkin",  artista: "LNGSHOT",  img: "assets/canciones/LNGSHOT.jpg"  },
  { id: 18, nombre: "If I", artista: "TREASURE",  img: "assets/canciones/TREASURE.jpg"},
  { id: 19, nombre: "Lemonade", artista: "AESPA",  img: "assets/canciones/AESPA.jpg" },
  { id: 21, nombre: "LOV3", artista: "SIK-K",  img: "assets/canciones/L3.jpg" },
  { id: 22, nombre: "Ride or Die", artista: "Evan",  img: "assets/canciones/Evan.jpg" },
  { id: 23, nombre: "Ceremony", artista: "QWER",  img: "assets/canciones/CR.jpg" },
  { id: 24, nombre: "Tokyo High", artista: "Jmin, SIK-K",  img: "assets/canciones/Forever.webp" },
  { id: 25, nombre: "Breaking Through", artista: "El Capitxan",  img: "assets/canciones/Break.jpg" },
  { id: 26, nombre: "Pop Off Pop Off", artista: "KIIIKIII",  img: "assets/canciones/KK.webp" },
];

let CANCIONES = [];
let ARTISTAS = [];
let ALBUMES = [];
let BSIDES = [];

// ── Personas participantes ────────────────────────────────────
// Se conservan p1/p2 porque forman parte de los datos existentes.
const PERSONAS = [
  { id: "p1", nombre: "Persona 1", color: "#f472b6" },
  { id: "p2", nombre: "Persona 2", color: "#22d3ee" },
];

// ── Semanas de la temporada 2026 ──────────────────────────────
function fechaISO(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function generarSemanas(temporada = KPOP_GALA_TEMPORADA) {
  const semanas = [];
  const rt = temporada?.inicio instanceof Date ? temporada : runtimeTemporada(temporada);
  const inicio = new Date(rt.inicio);
  const fin = new Date(rt.fin);
  let actual = new Date(inicio);
  let num = 1;

  while (actual <= fin) {
    const lunes = new Date(actual);
    const domingo = new Date(actual);
    domingo.setDate(domingo.getDate() + 6);
    if (domingo > fin) domingo.setTime(fin.getTime());

    const fmtL = lunes.toLocaleDateString("es-PA", { day: "2-digit", month: "short" });
    const fmtD = domingo.toLocaleDateString("es-PA", { day: "2-digit", month: "short" });

    semanas.push({
      id: `S${String(num).padStart(2, "0")}`,
      label: `Semana ${num} · ${fmtL} – ${fmtD}`,
      num,
      inicio: fechaISO(lunes),
      fin: fechaISO(domingo),
    });

    actual.setDate(actual.getDate() + 7);
    num++;
  }
  return semanas;
}
const SEMANAS = generarSemanas();

function obtenerSemanasTemporada(temporadaId = obtenerTemporadaActivaId()) {
  const temp = obtenerTemporadaPorId(temporadaId);
  return temp ? generarSemanas(temp) : [];
}

function semanaParaFecha(fecha = new Date(), temporadaId = obtenerTemporadaActivaId()) {
  const semanas = temporadaId === obtenerTemporadaActivaId() ? SEMANAS : obtenerSemanasTemporada(temporadaId);
  const t = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime();
  return semanas.find(s => {
    const ini = new Date(`${s.inicio}T00:00:00`).getTime();
    const fin = new Date(`${s.fin}T23:59:59`).getTime();
    return t >= ini && t <= fin;
  }) || null;
}

function obtenerSemanaRecomendada() {
  const actual = semanaParaFecha(new Date());
  if (actual) return actual;

  const seasonId = obtenerTemporadaActivaId();
  const idsUsados = new Set([
    ...filtrarRegistrosTemporada(cargarRegistros(), seasonId),
    ...filtrarRegistrosTemporada(cargarRegistrosArtistas(), seasonId),
    ...filtrarRegistrosTemporada(cargarRegistrosAlbumes(), seasonId),
    ...filtrarRegistrosTemporada(cargarRegistrosBsides(), seasonId),
  ].map(r => r.semanaId));

  const usadas = SEMANAS.filter(s => idsUsados.has(s.id));
  if (usadas.length) return usadas[usadas.length - 1];

  const hoy = new Date();
  if (hoy < KPOP_GALA_TEMPORADA.inicio) return SEMANAS[0] || null;
  return SEMANAS[SEMANAS.length - 1] || null;
}

// ── Puntaje total de una entrada ──────────────────────────────
// Mantiene compatibilidad con el formato antiguo (posición + reproducciones).
function calcularPuntajeEntrada(posSpotify, posInstafest, reproducciones) {
  if (reproducciones === undefined) {
    const viejaPos = Number(posSpotify) || 0;
    const viejaRep = Number(posInstafest) || 0;
    const pts = viejaPos >= 1 && viejaPos <= 15 ? (16 - viejaPos) : 0;
    return pts + Math.min(viejaRep, 200);
  }

  const pSpotify = Number(posSpotify) || 0;
  const pInstafest = Number(posInstafest) || 0;
  const reps = Number(reproducciones) || 0;
  const ptsSpot = pSpotify >= 1 && pSpotify <= 15 ? (16 - pSpotify) : 0;
  const ptsInsta = pInstafest >= 1 && pInstafest <= 15 ? (16 - pInstafest) : 0;
  return ptsSpot + ptsInsta + Math.min(reps, 200);
}

function obtenerPuntajeRegistro(registro) {
  if (!registro || typeof registro !== "object") return 0;
  if (registro.posSpotify !== undefined || registro.posInstafest !== undefined) {
    return calcularPuntajeEntrada(registro.posSpotify, registro.posInstafest, registro.reproducciones ?? 0);
  }
  if (registro.posicion !== undefined) {
    return calcularPuntajeEntrada(registro.posicion, registro.reproducciones);
  }
  return Number(registro.puntaje) || 0;
}

// ── Capa segura de localStorage ───────────────────────────────
// IMPORTANTE: estas cuatro claves son las originales y NO se cambian.
const STORAGE_KEY = "kpop_gala_registros";
const STORAGE_ARTISTAS_KEY = "kpop_gala_artistas_registros";
const STORAGE_ALBUMES_KEY = "kpop_gala_albumes_registros";
const STORAGE_BSIDES_KEY = "kpop_gala_bsides_registros";

const KPOP_GALA_STORAGE_KEYS = Object.freeze({
  canciones: STORAGE_KEY,
  artistas: STORAGE_ARTISTAS_KEY,
  albumes: STORAGE_ALBUMES_KEY,
  bsides: STORAGE_BSIDES_KEY,
});

const KPOP_GALA_SCHEMA_KEY = "kpop_gala_schema_version";
const KPOP_GALA_APP_VERSION_KEY = "kpop_gala_app_version";
const KPOP_GALA_SETTINGS_KEY = "kpop_gala_settings";
const KPOP_GALA_CATALOG_KEY = "kpop_gala_catalog_v1";
const KPOP_GALA_INITIAL_BACKUP_KEY = "kpop_gala_backup_v1_1_initial";
const KPOP_GALA_LAST_BACKUP_KEY = "kpop_gala_backup_last_safety";

function leerJSONSeguro(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (error) {
    console.warn(`[KPop Gala] No se pudo leer ${key}. El valor original NO fue sobrescrito.`, error);
    return fallback;
  }
}

function escribirJSONSeguro(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`[KPop Gala] No se pudo guardar ${key}.`, error);
    return false;
  }
}

// Mantiene las APIs booleanas de almacenamiento; la UI decide si puede continuar.
function guardarConFeedback(guardar, valor, notificar) {
  try {
    if (guardar(valor) === true) return true;
  } catch (error) {
    console.error("[KPop Gala] Falló la operación de guardado.", error);
  }
  notificar("No se pudo guardar. Conservamos el formulario y los datos anteriores; intenta de nuevo.", "error");
  return false;
}

function exigirBackupSeguridad(motivo) {
  if (!guardarBackupSeguridad(motivo)) throw new Error("No se pudo crear el respaldo previo. No se realizó la operación.");
}

function cargarRegistros() {
  const value = leerJSONSeguro(STORAGE_KEY, []);
  return Array.isArray(value) ? value : [];
}
function guardarRegistros(registros) { return escribirJSONSeguro(STORAGE_KEY, registros); }

function cargarRegistrosArtistas() {
  const value = leerJSONSeguro(STORAGE_ARTISTAS_KEY, []);
  return Array.isArray(value) ? value : [];
}
function guardarRegistrosArtistas(registros) { return escribirJSONSeguro(STORAGE_ARTISTAS_KEY, registros); }

function cargarRegistrosAlbumes() {
  const value = leerJSONSeguro(STORAGE_ALBUMES_KEY, []);
  return Array.isArray(value) ? value : [];
}
function guardarRegistrosAlbumes(registros) { return escribirJSONSeguro(STORAGE_ALBUMES_KEY, registros); }

function cargarRegistrosBsides() {
  const value = leerJSONSeguro(STORAGE_BSIDES_KEY, []);
  return Array.isArray(value) ? value : [];
}
function guardarRegistrosBsides(registros) { return escribirJSONSeguro(STORAGE_BSIDES_KEY, registros); }

function crearSnapshotDatos(motivo = "exportacion") {
  return {
    app: "KPop Gala",
    appVersion: KPOP_GALA_APP_VERSION,
    schemaVersion: KPOP_GALA_SCHEMA_VERSION,
    season: KPOP_GALA_TEMPORADA.anio,
    activeSeasonId: obtenerTemporadaActivaId(),
    seasons: cargarTemporadas(),
    hallOfFame: cargarHallOfFame(),
    motivo,
    exportedAt: new Date().toISOString(),
    origin: typeof location !== "undefined" ? location.origin : "unknown",
    data: {
      canciones: cargarRegistros(),
      artistas: cargarRegistrosArtistas(),
      albumes: cargarRegistrosAlbumes(),
      bsides: cargarRegistrosBsides(),
    },
    settings: cargarConfiguracion(),
    catalog: cargarCatalogoPersonalizado(),
  };
}

function normalizarSnapshotDatos(snapshot) {
  if (!snapshot || typeof snapshot !== "object") throw new Error("El archivo no contiene un respaldo válido.");
  const data = snapshot.data || snapshot;
  const normalizado = {
    canciones: data.canciones ?? data.registros,
    artistas: data.artistas,
    albumes: data.albumes,
    bsides: data.bsides,
  };

  for (const [nombre, valor] of Object.entries(normalizado)) {
    if (!Array.isArray(valor)) throw new Error(`El respaldo no contiene una colección válida de ${nombre}.`);
  }
  const esObjeto = x => x !== null && typeof x === "object" && !Array.isArray(x);
  const validarFilas = (filas, nombre) => {
    if (!Array.isArray(filas) || filas.some(x => !esObjeto(x))) throw new Error("Estructura inválida en " + nombre + ".");
  };
  for (const [nombre, filas] of Object.entries(normalizado)) validarFilas(filas, nombre);
  for (const nombre of ["settings", "catalog", "hallOfFame"]) {
    if (snapshot[nombre] != null && !esObjeto(snapshot[nombre])) throw new Error("Estructura inválida en " + nombre + ".");
  }
  if (snapshot.seasons != null) validarFilas(snapshot.seasons, "seasons");
  if (snapshot.catalog) {
    const catalogo = snapshot.catalog;
    if (catalogo.overrides != null && !esObjeto(catalogo.overrides)) throw new Error("Overrides de catálogo inválidos.");
    for (const tipo of ["canciones", "artistas", "albumes", "bsides"]) {
      if (catalogo[tipo] != null) validarFilas(catalogo[tipo], tipo);
      const overrides = catalogo.overrides?.[tipo];
      if (overrides != null && (!esObjeto(overrides) || Object.values(overrides).some(x => !esObjeto(x)))) throw new Error("Overrides de catálogo inválidos.");
    }
  }
  // Solo validación estructural: los campos legacy y extensiones se conservan.
  return normalizado;
}

// localStorage no tiene transacciones: conservamos sus bytes y compensamos fallos.
// No incluye backups ni metadata de versión, que no se reemplazan al importar.
function capturarEstadoLocal() {
  return new Map([
    ...Object.values(KPOP_GALA_STORAGE_KEYS), KPOP_GALA_SETTINGS_KEY,
    KPOP_GALA_CATALOG_KEY, KPOP_GALA_SEASONS_KEY, KPOP_GALA_ACTIVE_SEASON_KEY,
    KPOP_GALA_HOF_KEY,
  ].map(key => [key, localStorage.getItem(key)]));
}

function recuperarEstadoLocal(estado) {
  const fallos = [];
  for (const [key, raw] of estado) {
    try {
      if (localStorage.getItem(key) === raw) continue;
      if (raw === null) localStorage.removeItem(key);
      else localStorage.setItem(key, raw);
    } catch { fallos.push(key); }
  }
  // Tras liberar claves nuevas, un segundo intento puede recuperar espacio.
  for (const key of fallos.slice()) {
    try {
      const raw = estado.get(key);
      if (raw === null) localStorage.removeItem(key);
      else localStorage.setItem(key, raw);
      fallos.splice(fallos.indexOf(key), 1);
    } catch { /* Se informa al usuario; no afirmar una recuperación inexistente. */ }
  }
  reconstruirCatalogos();
  return fallos;
}

function errorRestauracion(error, estado) {
  const fallos = recuperarEstadoLocal(estado);
  const mensaje = fallos.length
    ? "Falló la operación y no se pudo recuperar todo el estado anterior. Conserva el respaldo previo y exporta tus datos antes de continuar."
    : "No se completó la operación. Se recuperó el estado anterior; el respaldo previo sigue disponible.";
  const resultado = new Error(mensaje);
  resultado.cause = error;
  resultado.clavesSinRecuperar = fallos;
  return resultado;
}

function ejecutarCambioLocalSeguro(motivo, accion) {
  const anterior = capturarEstadoLocal();
  exigirBackupSeguridad(motivo);
  try { return accion(); }
  catch (error) { throw errorRestauracion(error, anterior); }
}

// Parte síncrona compartida. No cambia la forma ni los campos de los registros.
function aplicarSnapshotDatos(snapshot, data) {
  const exigir = ok => { if (!ok) throw new Error("Falló una escritura del respaldo."); };
  exigir(guardarRegistros(data.canciones));
  exigir(guardarRegistrosArtistas(data.artistas));
  exigir(guardarRegistrosAlbumes(data.albumes));
  exigir(guardarRegistrosBsides(data.bsides));
  if (snapshot.settings && typeof snapshot.settings === "object") exigir(guardarConfiguracion(snapshot.settings));
  if (snapshot.catalog && typeof snapshot.catalog === "object") exigir(guardarCatalogoPersonalizado(snapshot.catalog));
  if (Array.isArray(snapshot.seasons)) exigir(guardarTemporadas(snapshot.seasons));
  if (snapshot.hallOfFame && typeof snapshot.hallOfFame === "object") exigir(guardarHallOfFame(snapshot.hallOfFame));
  const seasonToActivate = snapshot.activeSeasonId || (snapshot.season ? String(snapshot.season) : null);
  if (seasonToActivate && obtenerTemporadaPorId(seasonToActivate)) activarTemporada(seasonToActivate);
  return Object.fromEntries(Object.entries(data).map(([tipo, registros]) => [tipo, registros.length]));
}

function restaurarSnapshotDatos(snapshot) {
  const data = normalizarSnapshotDatos(snapshot);
  return ejecutarCambioLocalSeguro("antes_de_restaurar", () => {
    const resultado = aplicarSnapshotDatos(snapshot, data);
    reconstruirCatalogos();
    return resultado;
  });
}

let kgRestauracionEnCurso = false;

// API asíncrona para Datos. La API histórica síncrona anterior se conserva.
async function restaurarBackupCompleto(snapshot) {
  if (kgRestauracionEnCurso) throw new Error("Ya hay una restauración en curso.");
  kgRestauracionEnCurso = true;
  let anterior = null;
  let escriturasIniciadas = false;
  try {
    const data = normalizarSnapshotDatos(snapshot);
    const imagenes = prepararImagenesCatalogo(snapshot.media?.imagenes ?? []);
    // Solo imágenes que serán sobrescritas con otros bytes necesitan preimagen:
    // el resto de IndexedDB no se borra y seguirá disponible en el respaldo.
    const preimagenes = [];
    for (const img of imagenes) {
      const previa = await obtenerRegistroImagen(img.id);
      if (!previa?.blob) continue;
      const anteriorUrl = await blobADataURL(previa.blob);
      if (anteriorUrl !== await blobADataURL(img.blob)) {
        preimagenes.push({ id: previa.id, nombre: previa.nombre, type: previa.type, dataUrl: anteriorUrl });
      }
    }
    anterior = capturarEstadoLocal();
    const respaldo = crearSnapshotDatos("antes_de_restaurar");
    if (preimagenes.length) respaldo.media = { imagenes: preimagenes };
    if (!guardarBackupSeguridad("antes_de_restaurar", respaldo)) {
      throw new Error("No se pudo conservar el respaldo previo (incluidas las imágenes que cambiarían). No se restauró nada.");
    }
    let resultado;
    const aplicar = () => {
      escriturasIniciadas = true;
      resultado = aplicarSnapshotDatos(snapshot, data);
    };
    if (imagenes.length) await escribirImagenesCatalogo(imagenes, aplicar);
    else aplicar();
    reconstruirCatalogos();
    return { registros: resultado, imagenes: imagenes.length };
  } catch (error) {
    if (escriturasIniciadas && anterior) throw errorRestauracion(error, anterior);
    throw error;
  } finally {
    kgRestauracionEnCurso = false;
  }
}

function guardarBackupSeguridad(motivo = "seguridad", snapshot = null) {
  try {
    localStorage.setItem(KPOP_GALA_LAST_BACKUP_KEY, JSON.stringify(snapshot || crearSnapshotDatos(motivo)));
    return true;
  } catch (error) {
    console.warn("[KPop Gala] No se pudo crear el respaldo de seguridad.", error);
    return false;
  }
}

function obtenerBackupInicial() {
  return leerJSONSeguro(KPOP_GALA_INITIAL_BACKUP_KEY, null);
}

function obtenerUltimoBackupSeguridad() {
  return leerJSONSeguro(KPOP_GALA_LAST_BACKUP_KEY, null);
}

function inicializarCapaDatos() {
  try {
    if (!localStorage.getItem(KPOP_GALA_INITIAL_BACKUP_KEY)) {
      localStorage.setItem(KPOP_GALA_INITIAL_BACKUP_KEY, JSON.stringify(crearSnapshotDatos("antes_de_v1_1")));
    }
    if (!localStorage.getItem(KPOP_GALA_SEASONS_KEY)) guardarTemporadas([{ ...KPOP_GALA_DEFAULT_SEASON }]);
    if (!localStorage.getItem(KPOP_GALA_ACTIVE_SEASON_KEY)) localStorage.setItem(KPOP_GALA_ACTIVE_SEASON_KEY, KPOP_GALA_LEGACY_SEASON_ID);
    localStorage.setItem(KPOP_GALA_SCHEMA_KEY, String(KPOP_GALA_SCHEMA_VERSION));
    localStorage.setItem(KPOP_GALA_APP_VERSION_KEY, KPOP_GALA_APP_VERSION);
  } catch (error) {
    // La app continúa funcionando aunque el navegador no permita crear metadata extra.
    console.warn("[KPop Gala] No se pudo inicializar metadata de KPop Gala.", error);
  }
}

function inyectarEstilosTemporadaV20() {
  if (document.getElementById("kg-season-v20-styles")) return;
  const style = document.createElement("style");
  style.id = "kg-season-v20-styles";
  style.textContent = `
    .kg-season-chip{display:inline-flex;align-items:center;gap:.38rem;margin-left:.7rem;padding:.32rem .68rem;border-radius:999px;border:1.5px solid var(--border);background:rgba(255,255,255,.72);color:var(--text-soft);font-size:.72rem;font-weight:900;white-space:nowrap;transition:.18s ease}
    .kg-season-chip:hover{border-color:var(--violeta);color:#7c3aed;transform:translateY(-1px)}
    .kg-season-chip.closed{opacity:.78}
    .kg-season-chip .dot{width:7px;height:7px;border-radius:50%;background:var(--verde);box-shadow:0 0 0 3px var(--verde-glow)}
    .kg-season-chip.closed .dot{background:var(--text-muted);box-shadow:none}
    .kg-season-banner{max-width:1200px;margin:.6rem auto 0;padding:0 1.5rem;position:relative;z-index:2}
    .kg-season-closed-note{display:flex;align-items:center;justify-content:space-between;gap:.7rem;padding:.65rem .85rem;border:1.5px solid rgba(167,139,250,.35);background:rgba(167,139,250,.09);border-radius:14px;color:var(--text-soft);font-size:.8rem;font-weight:700}
    .kg-season-closed-note a{font-weight:900;color:#7c3aed}
    @media(max-width:900px){.kg-season-chip{margin-left:.25rem;padding:.28rem .5rem}.kg-season-chip .kg-season-name{display:none}}
    @media(max-width:640px){.kg-season-chip{position:absolute;left:50%;transform:translateX(-50%);top:72px;margin:0;z-index:20}.kg-season-chip:hover{transform:translateX(-50%) translateY(-1px)}}
  `;
  document.head.appendChild(style);
}

function aplicarTemporadaUI() {
  inyectarEstilosTemporadaV20();
  const temp = obtenerTemporadaActiva();
  const navbar = document.querySelector(".navbar");
  const logo = navbar?.querySelector(".nav-logo");
  if (navbar && logo && !navbar.querySelector(".kg-season-chip")) {
    const chip = document.createElement("a");
    chip.href = "temporadas.html";
    chip.className = `kg-season-chip ${temp.estado === "cerrada" ? "closed" : ""}`;
    chip.title = `Cambiar temporada · ${rangoTemporadaTexto(temp)}`;
    chip.innerHTML = `<span class="dot"></span><span class="kg-season-name">${escaparHTML(temp.nombre)}</span><span>▾</span>`;
    logo.insertAdjacentElement("afterend", chip);
  }

  // Ajustes de texto sin exigir cambios en los HTML históricos.
  if (document.getElementById("ranking-list")) {
    const badge = document.querySelector(".page-header .emoji-badge");
    const p = document.querySelector(".page-header p");
    if (badge) badge.textContent = `🎶 ${temp.nombre.toUpperCase()}`;
    if (p) p.textContent = `Puntaje acumulado · ${rangoTemporadaTexto(temp)}`;
  }
  if (document.getElementById("semana-global")) {
    const p = document.querySelector(".page-header p");
    if (p) p.textContent = `Registra tus puntuaciones semanales · ${temp.nombre}`;
  }
  if (document.getElementById("semanas-container")) {
    const p = document.querySelector(".page-header p");
    if (p) p.textContent = `Consulta y filtra todos los registros · ${rangoTemporadaTexto(temp)}`;
  }

  if (temp.estado === "cerrada" && !document.querySelector(".kg-season-closed-note") &&
      !location.pathname.endsWith("temporadas.html") && !location.pathname.endsWith("hall-of-fame.html")) {
    const note = document.createElement("div");
    note.className = "kg-season-banner";
    note.innerHTML = `<div class="kg-season-closed-note"><span>🔒 Estás viendo <strong>${escaparHTML(temp.nombre)}</strong>, una temporada cerrada. Su historial permanece disponible.</span><a href="temporadas.html">Cambiar temporada</a></div>`;
    document.querySelector(".navbar")?.insertAdjacentElement("afterend", note);
  }
}

function inyectarNavDatos() {
  const nav = document.querySelector(".nav-links");
  if (!nav) return;

  const agregar = (href, html, antesDeDatos = false) => {
    if (nav.querySelector(`a[href="${href}"]`)) return;
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = href;
    a.innerHTML = html;
    if (location.pathname.endsWith(`/${href}`) || location.pathname.endsWith(href)) a.classList.add("active");
    li.appendChild(a);
    const datosLi = nav.querySelector('a[href="datos.html"]')?.closest("li");
    if (antesDeDatos && datosLi) nav.insertBefore(li, datosLi); else nav.appendChild(li);
  };

  agregar("analytics.html", "📊 <span>Analytics</span>", true);
  agregar("catalogo.html", "📚 <span>Catálogo</span>", true);
  agregar("datos.html", "💾 <span>Datos</span>");
}



// ── Preferencias y UX compartida · v1.2 ──────────────────────
const KPOP_GALA_DEFAULT_SETTINGS = Object.freeze({
  p1: { nombre: "Persona 1", emoji: "🌸" },
  p2: { nombre: "Persona 2", emoji: "💙" },
});

function limpiarTextoCorto(valor, fallback, max = 28) {
  const texto = String(valor ?? "").trim().replace(/\s+/g, " ");
  return (texto || fallback).slice(0, max);
}

function cargarConfiguracion() {
  const raw = leerJSONSeguro(KPOP_GALA_SETTINGS_KEY, {});
  const cfg = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  return {
    p1: {
      nombre: limpiarTextoCorto(cfg.p1?.nombre, KPOP_GALA_DEFAULT_SETTINGS.p1.nombre),
      emoji: limpiarTextoCorto(cfg.p1?.emoji, KPOP_GALA_DEFAULT_SETTINGS.p1.emoji, 4),
    },
    p2: {
      nombre: limpiarTextoCorto(cfg.p2?.nombre, KPOP_GALA_DEFAULT_SETTINGS.p2.nombre),
      emoji: limpiarTextoCorto(cfg.p2?.emoji, KPOP_GALA_DEFAULT_SETTINGS.p2.emoji, 4),
    },
  };
}

function guardarConfiguracion(configuracion) {
  const anterior = cargarConfiguracion();
  const cfg = configuracion && typeof configuracion === "object" ? configuracion : {};
  const normalizada = {
    p1: {
      nombre: limpiarTextoCorto(cfg.p1?.nombre, anterior.p1.nombre),
      emoji: limpiarTextoCorto(cfg.p1?.emoji, anterior.p1.emoji, 4),
    },
    p2: {
      nombre: limpiarTextoCorto(cfg.p2?.nombre, anterior.p2.nombre),
      emoji: limpiarTextoCorto(cfg.p2?.emoji, anterior.p2.emoji, 4),
    },
  };
  return escribirJSONSeguro(KPOP_GALA_SETTINGS_KEY, normalizada);
}

function obtenerPersonaUI(personaId) {
  const cfg = cargarConfiguracion();
  const id = personaId === "p2" ? "p2" : "p1";
  return { id, ...cfg[id], abreviatura: id.toUpperCase() };
}

function escaparHTML(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function inyectarEstilosUXV12() {
  if (document.getElementById("kg-ux-v12-styles")) return;
  const style = document.createElement("style");
  style.id = "kg-ux-v12-styles";
  style.textContent = `
    .kg-select-search,.kg-ranking-search{width:100%;border:1.5px solid var(--border);background:rgba(255,255,255,.92);color:var(--text);border-radius:12px;padding:.68rem .85rem;font-family:var(--font-body);outline:none;transition:border-color .18s,box-shadow .18s;margin-bottom:.55rem}
    .kg-select-search:focus,.kg-ranking-search:focus{border-color:var(--rosa);box-shadow:0 0 0 3px var(--rosa-glow)}
    .kg-ranking-tools{display:flex;align-items:center;gap:.65rem;margin:.1rem 0 1rem}
    .kg-ranking-tools .kg-ranking-search{margin:0;max-width:520px}
    .kg-search-count{font-size:.78rem;color:var(--text-muted);white-space:nowrap;font-weight:700}
    .kg-no-results{padding:1.25rem;text-align:center;color:var(--text-muted);border:1.5px dashed var(--border);border-radius:var(--radius-md);background:rgba(255,255,255,.55)}
    .kg-undo-toast{position:fixed;left:50%;bottom:24px;transform:translate(-50%,20px);opacity:0;z-index:1000;display:flex;align-items:center;gap:.8rem;min-width:min(92vw,420px);justify-content:space-between;background:rgba(255,255,255,.97);border:1.5px solid var(--border);box-shadow:var(--shadow-lg);border-radius:999px;padding:.72rem .78rem .72rem 1rem;transition:all .22s var(--ease-out);font-size:.85rem;font-weight:700}
    .kg-undo-toast.visible{opacity:1;transform:translate(-50%,0)}
    .kg-undo-toast button{border-radius:999px;padding:.5rem .8rem;background:var(--text);color:white;font-weight:800}
    .kg-undo-toast .kg-close{background:transparent;color:var(--text-muted);padding:.35rem .45rem}
    .kg-input-helper{font-size:.72rem;color:var(--text-muted);margin:-.25rem 0 .5rem}
    .kg-v12-badge{display:inline-flex;align-items:center;padding:.2rem .55rem;border-radius:999px;background:rgba(167,139,250,.13);color:#7c3aed;font-size:.68rem;font-weight:900;letter-spacing:.03em;margin-left:.35rem;vertical-align:middle}
    @media(max-width:640px){.kg-ranking-tools{align-items:stretch;flex-direction:column}.kg-ranking-tools .kg-ranking-search{max-width:none}.kg-search-count{padding-left:.15rem}.kg-undo-toast{border-radius:18px}}
  `;
  document.head.appendChild(style);
}

function aplicarConfiguracionUI() {
  const cfg = cargarConfiguracion();
  const reemplazos = [
    ["p1", cfg.p1], ["p2", cfg.p2],
  ];

  // Textos que ya existen en el HTML original.
  document.querySelectorAll(".form-card-title h2").forEach(el => {
    const original = el.textContent;
    if (original.includes("Persona 1")) el.textContent = original.replace(/Persona 1/g, cfg.p1.nombre);
    else if (original.includes("Persona 2")) el.textContent = original.replace(/Persona 2/g, cfg.p2.nombre);
  });

  const rp1 = document.querySelector(".rp1 .rp-name");
  const rp2 = document.querySelector(".rp2 .rp-name");
  if (rp1) rp1.textContent = `${cfg.p1.emoji} ${cfg.p1.nombre}`;
  if (rp2) rp2.textContent = `${cfg.p2.emoji} ${cfg.p2.nombre}`;

  const statP1 = document.getElementById("stat-p1")?.closest(".stat-chip")?.querySelector(".stat-label");
  const statP2 = document.getElementById("stat-p2")?.closest(".stat-chip")?.querySelector(".stat-label");
  if (statP1) statP1.textContent = `${cfg.p1.emoji} ${cfg.p1.nombre}`;
  if (statP2) statP2.textContent = `${cfg.p2.emoji} ${cfg.p2.nombre}`;

  const filtro = document.getElementById("filtro-persona");
  if (filtro) {
    const o1 = filtro.querySelector('option[value="p1"]');
    const o2 = filtro.querySelector('option[value="p2"]');
    if (o1) o1.textContent = `${cfg.p1.emoji} ${cfg.p1.nombre}`;
    if (o2) o2.textContent = `${cfg.p2.emoji} ${cfg.p2.nombre}`;
  }

  document.querySelectorAll('a[href="semanas.html?filtro=p1"]').forEach(a => a.innerHTML = `${escaparHTML(cfg.p1.emoji)} ${escaparHTML(cfg.p1.nombre)}`);
  document.querySelectorAll('a[href="semanas.html?filtro=p2"]').forEach(a => a.innerHTML = `${escaparHTML(cfg.p2.emoji)} ${escaparHTML(cfg.p2.nombre)}`);

  // Mantiene P1/P2 como etiqueta compacta, pero añade el nombre al tooltip.
  reemplazos.forEach(([id, persona]) => {
    document.querySelectorAll(id === "p1" ? ".badge-p1,.ps.p1" : ".badge-p2,.ps.p2").forEach(el => {
      el.title = `${persona.emoji} ${persona.nombre}`;
    });
  });
}

let kgUndoTimer = null;
function mostrarDeshacer(mensaje, accionDeshacer, duracion = 6500) {
  document.querySelector(".kg-undo-toast")?.remove();
  if (kgUndoTimer) clearTimeout(kgUndoTimer);

  const toast = document.createElement("div");
  toast.className = "kg-undo-toast";
  toast.innerHTML = `<span>${escaparHTML(mensaje)}</span><span><button type="button" class="kg-undo-btn">Deshacer</button><button type="button" class="kg-close" aria-label="Cerrar">✕</button></span>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("visible"));

  const cerrar = () => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 230);
  };

  toast.querySelector(".kg-undo-btn").addEventListener("click", () => {
    if (accionDeshacer?.() !== false) cerrar();
  });
  toast.querySelector(".kg-close").addEventListener("click", cerrar, { once: true });
  kgUndoTimer = setTimeout(cerrar, duracion);
}

function inicializarUXV12() {
  inyectarEstilosUXV12();
  aplicarConfiguracionUI();
}

// ── Obtener puntaje acumulado por canción ─────────────────────
function calcularRanking(temporadaId = obtenerTemporadaActivaId()) {
  const registros = filtrarRegistrosTemporada(cargarRegistros(), temporadaId);
  const mapa = {};

  CANCIONES.forEach(c => {
    mapa[c.id] = { cancion: c, puntajeTotal: 0, p1: 0, p2: 0, entradasP1: 0, entradasP2: 0 };
  });

  registros.forEach(r => {
    if (!mapa[r.cancionId]) return;
    const pts = obtenerPuntajeRegistro(r);
    mapa[r.cancionId].puntajeTotal += pts;
    if (r.personaId === "p1") { mapa[r.cancionId].p1 += pts; mapa[r.cancionId].entradasP1++; }
    if (r.personaId === "p2") { mapa[r.cancionId].p2 += pts; mapa[r.cancionId].entradasP2++; }
  });

  return Object.values(mapa).filter(x => !x.cancion.archivado || x.puntajeTotal > 0).sort((a, b) => b.puntajeTotal - a.puntajeTotal);
}

function cancionPorId(id) { return CANCIONES.find(c => c.id === Number(id)); }

// ── Colores neon del tema ─────────────────────────────────────
const NEON = {
  rosa: "#f472b6",
  cyan: "#22d3ee",
  amarillo: "#facc15",
  violeta: "#a78bfa",
  verde: "#4ade80",
};

// ── BASE DE DATOS DE ARTISTAS ────────────────────────────────
const ARTISTAS_BASE = [
  { id: 'sm1', nombre: 'Jay Park', categoria: 'solista_m', img: 'assets/artistas/Jaebeom.jpg' },
  { id: 'sm2', nombre: 'B.I', categoria: 'solista_m', img: 'assets/artistas/BI.jpg' },
  { id: 'sm4', nombre: 'Sik-k', categoria: 'solista_m', img: 'assets/artistas/Sikk.jpg' },
  { id: 'sm5', nombre: 'Osun', categoria: 'solista_m', img: 'assets/artistas/Osun.jpg' },
  { id: 'sm8', nombre: 'Evan', categoria: 'solista_m', img: 'assets/artistas/Ev.webp' },
  { id: 'sm9', nombre: 'Jmin', categoria: 'solista_m', img: 'assets/artistas/jmin.webp' },
  { id: 'sf1', nombre: 'Yves', categoria: 'solista_f', img: 'assets/artistas/Yves.jpg' },
  { id: 'sf5', nombre: 'Jihyo', categoria: 'solista_f', img: 'assets/artistas/Jihyo.jpg' },
  { id: 'bg3', nombre: 'SEVENTEEN', categoria: 'boy_group', img: 'assets/artistas/svt.jpg' },
  { id: 'bg6', nombre: 'LNGSHOT', categoria: 'boy_group', img: 'assets/artistas/LNGS.jpg' },
  { id: 'bg7', nombre: 'RIIZE', categoria: 'boy_group', img: 'assets/artistas/RZZ.jpg' },
  { id: 'bg9', nombre: 'TREASURE', categoria: 'boy_group', img: 'assets/artistas/treasure.jpg' },
  { id: 'bg13', nombre: 'XDINARY HEROES', categoria: 'boy_group', img: 'assets/artistas/xdh.jpg' },
  { id: 'gg1', nombre: 'TWICE', categoria: 'girl_group', img: 'assets/artistas/twice.jpg' },
  { id: 'gg2', nombre: 'LE SSERAFIM', categoria: 'girl_group', img: 'assets/artistas/lesserafim.jpg' },
  { id: 'gg3', nombre: 'KIIIKIII', categoria: 'girl_group', img: 'assets/artistas/kk.jpg' },
  { id: 'gg5', nombre: 'AESPA', categoria: 'girl_group', img: 'assets/artistas/aespa.jpg' },
  { id: 'gg6', nombre: 'XG', categoria: 'girl_group', img: 'assets/artistas/xg.jpg' },
  { id: 'gg8', nombre: 'NMIXX', categoria: 'girl_group', img: 'assets/artistas/nmixx.jpg' },
  { id: 'gg9', nombre: 'Red Velvet', categoria: 'girl_group', img: 'assets/artistas/redvelvet.jpg' },
  { id: 'gg10', nombre: 'QWER', categoria: 'girl_group', img: 'assets/artistas/qwer.jpg' },
  { id: 'gg11', nombre: 'NIZIU', categoria: 'girl_group', img: 'assets/artistas/niziu.jpg' },
  { id: 'gg13', nombre: 'H2H', categoria: 'girl_group', img: 'assets/artistas/H2HH.jpg' },
  { id: 'gg14', nombre: 'YOUNG POSSE', categoria: 'girl_group', img: 'assets/artistas/YP.jpg' },
];

function calcularRankingArtistas(categoria, temporadaId = obtenerTemporadaActivaId()) {
  const registros = filtrarRegistrosTemporada(cargarRegistrosArtistas(), temporadaId);
  const mapa = {};
  ARTISTAS.filter(a => a.categoria === categoria).forEach(a => {
    mapa[a.id] = { artista: a, puntajeTotal: 0, p1: 0, p2: 0, entradasP1: 0, entradasP2: 0 };
  });
  registros.forEach(r => {
    if (!mapa[r.artistaId]) return;
    const pts = obtenerPuntajeRegistro(r);
    mapa[r.artistaId].puntajeTotal += pts;
    const persona = r.personaId || "p1";
    if (persona === "p1") { mapa[r.artistaId].p1 += pts; mapa[r.artistaId].entradasP1++; }
    if (persona === "p2") { mapa[r.artistaId].p2 += pts; mapa[r.artistaId].entradasP2++; }
  });
  return Object.values(mapa).filter(x => !x.artista.archivado || x.puntajeTotal > 0).sort((a, b) => b.puntajeTotal - a.puntajeTotal);
}

// ── BASE DE DATOS DE ÁLBUMES ────────────────────────────────
const ALBUMES_BASE = [
  { id: 1, nombre: "BLUE VALENTINE", artista: "NMIXX", img: "assets/albumes/NMIXX.jpg" },
  { id: 5, nombre: "SHOT CALLERS", artista: "LNGSHOT", img: "assets/albumes/LNGSHOT.jpg" },
  { id: 10, nombre: "4SHO 4SHO VILLE", artista: "JAY PARK", img: "assets/albumes/JAYPARK.png" },
  { id: 11, nombre: "NEW WAV", artista: "TREASURE", img: "assets/albumes/TREASURE.jpg" },
  { id: 12, nombre: "LEMONADE", artista: "AESPA", img: "assets/albumes/LEMON.jpg" },
  { id: 15, nombre: "II", artista: "RIIZE", img: "assets/albumes/RIIZE7.webp" },
  { id: 16, nombre: "WHY KIIIKIII", artista: "KIIIKIII", img: "assets/albumes/KK.jpg" },
];

function albumPorId(id) { return ALBUMES.find(a => a.id === Number(id)); }

function calcularRankingAlbumes(temporadaId = obtenerTemporadaActivaId()) {
  const registros = filtrarRegistrosTemporada(cargarRegistrosAlbumes(), temporadaId);
  const mapa = {};
  ALBUMES.forEach(a => {
    mapa[a.id] = { album: a, puntajeTotal: 0, p1: 0, p2: 0, entradasP1: 0, entradasP2: 0 };
  });
  registros.forEach(r => {
    if (!mapa[r.albumId]) return;
    const pts = obtenerPuntajeRegistro(r);
    mapa[r.albumId].puntajeTotal += pts;
    if (r.personaId === "p1") { mapa[r.albumId].p1 += pts; mapa[r.albumId].entradasP1++; }
    if (r.personaId === "p2") { mapa[r.albumId].p2 += pts; mapa[r.albumId].entradasP2++; }
  });
  return Object.values(mapa).filter(x => !x.album.archivado || x.puntajeTotal > 0).sort((a, b) => b.puntajeTotal - a.puntajeTotal);
}

// ── BASE DE DATOS DE B-SIDES ────────────────────────────────
const BSIDES_BASE = [
  { id: 'bs1', nombre: "Zoom Zoom", artista: "Treasure", img: "assets/canciones/TREASURE.jpg" },
  { id: 'bs4', nombre: "4SHO 4SHO", artista: "Jay Park & Lngshot", img: "assets/canciones/JAYPARK.png" },
  { id: 'bs7', nombre: "Never let go", artista: "Lngshot", img: "assets/canciones/LNGSHOT.jpg" },
  { id: 'bs13', nombre: "Camouflage", artista: "Aespa", img: "assets/canciones/AESPA.jpg" },
  { id: 'bs17', nombre: "Amazing", artista: "Jmin, SIK-K", img: "assets/canciones/Forever.webp" },
];

// ── Catálogo editable · v1.4 ─────────────────────────────────
const KPOP_GALA_CATALOG_DEFAULT = Object.freeze({
  version: 1,
  canciones: [], artistas: [], albumes: [], bsides: [],
  overrides: { canciones: {}, artistas: {}, albumes: {}, bsides: {} },
});

function normalizarCatalogo(raw) {
  const c = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const overrides = c.overrides && typeof c.overrides === "object" ? c.overrides : {};
  return {
    version: 1,
    canciones: Array.isArray(c.canciones) ? c.canciones : [],
    artistas: Array.isArray(c.artistas) ? c.artistas : [],
    albumes: Array.isArray(c.albumes) ? c.albumes : [],
    bsides: Array.isArray(c.bsides) ? c.bsides : [],
    overrides: {
      canciones: overrides.canciones && typeof overrides.canciones === "object" ? overrides.canciones : {},
      artistas: overrides.artistas && typeof overrides.artistas === "object" ? overrides.artistas : {},
      albumes: overrides.albumes && typeof overrides.albumes === "object" ? overrides.albumes : {},
      bsides: overrides.bsides && typeof overrides.bsides === "object" ? overrides.bsides : {},
    },
  };
}

function cargarCatalogoPersonalizado() {
  return normalizarCatalogo(leerJSONSeguro(KPOP_GALA_CATALOG_KEY, KPOP_GALA_CATALOG_DEFAULT));
}

function guardarCatalogoPersonalizado(catalogo) {
  return escribirJSONSeguro(KPOP_GALA_CATALOG_KEY, normalizarCatalogo(catalogo));
}

function aplicarOverridesBase(base, overrides = {}) {
  return base.map(item => ({ ...item, ...(overrides[String(item.id)] || {}), origen: "base" }));
}

function reconstruirCatalogos() {
  const c = cargarCatalogoPersonalizado();
  CANCIONES = [...aplicarOverridesBase(CANCIONES_BASE, c.overrides.canciones), ...c.canciones.map(x => ({ ...x, origen: "custom" }))];
  ARTISTAS = [...aplicarOverridesBase(ARTISTAS_BASE, c.overrides.artistas), ...c.artistas.map(x => ({ ...x, origen: "custom" }))];
  ALBUMES = [...aplicarOverridesBase(ALBUMES_BASE, c.overrides.albumes), ...c.albumes.map(x => ({ ...x, origen: "custom" }))];
  BSIDES = [...aplicarOverridesBase(BSIDES_BASE, c.overrides.bsides), ...c.bsides.map(x => ({ ...x, origen: "custom" }))];
  if (typeof document !== "undefined") document.dispatchEvent(new CustomEvent("kg-catalog-changed"));
}

function coleccionCatalogo(tipo) {
  if (tipo === "canciones") return CANCIONES;
  if (tipo === "artistas") return ARTISTAS;
  if (tipo === "albumes") return ALBUMES;
  if (tipo === "bsides") return BSIDES;
  return [];
}

function baseCatalogo(tipo) {
  if (tipo === "canciones") return CANCIONES_BASE;
  if (tipo === "artistas") return ARTISTAS_BASE;
  if (tipo === "albumes") return ALBUMES_BASE;
  if (tipo === "bsides") return BSIDES_BASE;
  return [];
}

function obtenerItemCatalogo(tipo, id) {
  return coleccionCatalogo(tipo).find(x => String(x.id) === String(id)) || null;
}

function normalizarClaveTexto(valor) {
  return String(valor ?? "").trim().toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function generarIdCatalogo(tipo) {
  if (tipo === "canciones" || tipo === "albumes") {
    const nums = coleccionCatalogo(tipo).map(x => Number(x.id)).filter(Number.isFinite);
    return Math.max(999, ...nums) + 1;
  }
  const pref = tipo === "artistas" ? "usr_art" : "usr_bs";
  return `${pref}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function itemTieneRegistros(tipo, id) {
  const sid = String(id);
  if (tipo === "canciones") return cargarRegistros().some(r => String(r.cancionId) === sid);
  if (tipo === "artistas") return cargarRegistrosArtistas().some(r => String(r.artistaId) === sid);
  if (tipo === "albumes") return cargarRegistrosAlbumes().some(r => String(r.albumId) === sid);
  if (tipo === "bsides") return cargarRegistrosBsides().some(r => String(r.bsideId) === sid);
  return false;
}

function contarRegistrosItem(tipo, id) {
  const sid = String(id);
  if (tipo === "canciones") return cargarRegistros().filter(r => String(r.cancionId) === sid).length;
  if (tipo === "artistas") return cargarRegistrosArtistas().filter(r => String(r.artistaId) === sid).length;
  if (tipo === "albumes") return cargarRegistrosAlbumes().filter(r => String(r.albumId) === sid).length;
  if (tipo === "bsides") return cargarRegistrosBsides().filter(r => String(r.bsideId) === sid).length;
  return 0;
}

function existeDuplicadoCatalogo(tipo, datos, ignorarId = null) {
  const nombre = normalizarClaveTexto(datos.nombre);
  const artista = normalizarClaveTexto(datos.artista || "");
  return coleccionCatalogo(tipo).some(item => {
    if (String(item.id) === String(ignorarId)) return false;
    if (normalizarClaveTexto(item.nombre) !== nombre) return false;
    if (tipo === "artistas") return true;
    return normalizarClaveTexto(item.artista || "") === artista;
  });
}

function sanitizarItemCatalogo(tipo, datos, anterior = {}) {
  const nombre = limpiarTextoCorto(datos.nombre, anterior.nombre || "Sin nombre", 80);
  const base = { ...anterior, nombre, archivado: Boolean(datos.archivado ?? anterior.archivado), updatedAt: new Date().toISOString() };
  if (datos.imagenId !== undefined) base.imagenId = datos.imagenId || null;
  if (datos.img !== undefined) base.img = datos.img || "";
  if (tipo === "artistas") {
    base.categoria = ["solista_m","solista_f","boy_group","girl_group"].includes(datos.categoria) ? datos.categoria : (anterior.categoria || "boy_group");
  } else {
    base.artista = limpiarTextoCorto(datos.artista, anterior.artista || "", 80);
    if (datos.artistaId !== undefined) base.artistaId = datos.artistaId || null;
    if (tipo === "bsides" && datos.albumId !== undefined) base.albumId = datos.albumId || null;
  }
  return base;
}

function guardarItemCatalogo(tipo, datos, id = null) {
  if (!["canciones","artistas","albumes","bsides"].includes(tipo)) throw new Error("Tipo de catálogo inválido.");
  const existente = id !== null ? obtenerItemCatalogo(tipo, id) : null;
  const limpio = sanitizarItemCatalogo(tipo, datos, existente || {});
  if (existeDuplicadoCatalogo(tipo, limpio, id)) throw new Error("Ya existe un elemento con ese nombre y artista.");

  exigirBackupSeguridad("antes_de_editar_catalogo");
  const c = cargarCatalogoPersonalizado();
  if (!existente) {
    limpio.id = generarIdCatalogo(tipo);
    limpio.createdAt = new Date().toISOString();
    limpio.origen = "custom";
    c[tipo].push(limpio);
  } else if (existente.origen === "custom") {
    const idx = c[tipo].findIndex(x => String(x.id) === String(id));
    if (idx === -1) throw new Error("No se encontró el elemento personalizado.");
    c[tipo][idx] = { ...c[tipo][idx], ...limpio, id: c[tipo][idx].id };
  } else {
    c.overrides[tipo][String(id)] = { ...(c.overrides[tipo][String(id)] || {}), ...limpio };
    delete c.overrides[tipo][String(id)].id;
    delete c.overrides[tipo][String(id)].origen;
  }
  if (!guardarCatalogoPersonalizado(c)) throw new Error("No se pudo guardar el catálogo.");
  reconstruirCatalogos();
  return obtenerItemCatalogo(tipo, limpio.id ?? id);
}

function cambiarArchivoItemCatalogo(tipo, id, archivado = true) {
  const item = obtenerItemCatalogo(tipo, id);
  if (!item) throw new Error("Elemento no encontrado.");
  return guardarItemCatalogo(tipo, { ...item, archivado }, id);
}

function itemEstaReferenciadoCatalogo(tipo, id) {
  const sid = String(id);
  if (tipo === "artistas") {
    return [...CANCIONES, ...ALBUMES, ...BSIDES].some(x => String(x.artistaId || "") === sid);
  }
  if (tipo === "albumes") return BSIDES.some(x => String(x.albumId || "") === sid);
  return false;
}

function eliminarItemCatalogo(tipo, id) {
  const item = obtenerItemCatalogo(tipo, id);
  if (!item) throw new Error("Elemento no encontrado.");
  if (item.origen !== "custom") throw new Error("Los elementos base se archivan, no se eliminan.");
  if (itemTieneRegistros(tipo, id)) throw new Error("Este elemento tiene historial y no puede eliminarse. Archívalo.");
  if (itemEstaReferenciadoCatalogo(tipo, id)) throw new Error("Este elemento está relacionado con otro contenido del catálogo. Archívalo en lugar de eliminarlo.");
  exigirBackupSeguridad("antes_de_eliminar_catalogo");
  const c = cargarCatalogoPersonalizado();
  c[tipo] = c[tipo].filter(x => String(x.id) !== String(id));
  if (!guardarCatalogoPersonalizado(c)) throw new Error("No se pudo actualizar el catálogo.");
  reconstruirCatalogos();
  return true;
}

// ── Imágenes en IndexedDB ─────────────────────────────────────
const KPOP_GALA_MEDIA_DB = "kpop_gala_media";
const KPOP_GALA_MEDIA_STORE = "imagenes";
const KG_PIXEL_TRANSPARENTE = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
const kgObjectUrlCache = new Map();

function abrirDBImagenes() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB no está disponible."));
    const req = indexedDB.open(KPOP_GALA_MEDIA_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(KPOP_GALA_MEDIA_STORE)) db.createObjectStore(KPOP_GALA_MEDIA_STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("No se pudo abrir IndexedDB."));
  });
}

async function guardarImagenCatalogo(file) {
  if (!file || !String(file.type || "").startsWith("image/")) throw new Error("Selecciona una imagen válida.");
  if (file.size > 8 * 1024 * 1024) throw new Error("La imagen supera 8 MB. Usa una imagen más ligera.");
  const id = "img_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  await escribirImagenesCatalogo([{ id, blob: file, nombre: file.name || "imagen", type: file.type, savedAt: new Date().toISOString() }]);
  return id;
}

async function obtenerRegistroImagen(id) {
  if (!id) return null;
  const db = await abrirDBImagenes();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(KPOP_GALA_MEDIA_STORE, "readonly");
      const req = tx.objectStore(KPOP_GALA_MEDIA_STORE).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
      tx.onabort = () => reject(tx.error || new Error("Se abortó la lectura de imagen."));
    });
  } finally { db.close(); }
}
async function obtenerUrlImagenCatalogo(id) {
  if (!id) return null;
  if (kgObjectUrlCache.has(id)) return kgObjectUrlCache.get(id);
  const reg = await obtenerRegistroImagen(id);
  if (!reg?.blob) return null;
  const url = URL.createObjectURL(reg.blob);
  kgObjectUrlCache.set(id, url);
  return url;
}

function srcImagenItem(item) {
  return item?.imagenId ? KG_PIXEL_TRANSPARENTE : (item?.img || KG_PIXEL_TRANSPARENTE);
}

function atributoImagenItem(item) {
  return item?.imagenId ? ` data-kg-imagen-id="${escaparHTML(item.imagenId)}"` : "";
}

async function aplicarImagenesCatalogo(root = document) {
  const imgs = [...root.querySelectorAll("img[data-kg-imagen-id]")];
  await Promise.all(imgs.map(async img => {
    const id = img.dataset.kgImagenId;
    try {
      const url = await obtenerUrlImagenCatalogo(id);
      if (url && img.isConnected) img.src = url;
      else if (img.nextElementSibling) { img.style.display = "none"; img.nextElementSibling.style.display = "flex"; }
    } catch {
      if (img.nextElementSibling) { img.style.display = "none"; img.nextElementSibling.style.display = "flex"; }
    }
  }));
}

function blobADataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function exportarImagenesCatalogo() {
  const c = cargarCatalogoPersonalizado();
  const ids = new Set();
  ["canciones","artistas","albumes","bsides"].forEach(tipo => {
    c[tipo].forEach(x => x.imagenId && ids.add(x.imagenId));
    Object.values(c.overrides[tipo] || {}).forEach(x => x.imagenId && ids.add(x.imagenId));
  });
  Object.values(cargarHallOfFame()).forEach(hall => {
    Object.values(hall.ganadores || {}).forEach(x => x?.imagenId && ids.add(x.imagenId));
  });
  const out = [];
  for (const id of ids) {
    const reg = await obtenerRegistroImagen(id);
    if (!reg?.blob) continue;
    out.push({ id, nombre: reg.nombre, type: reg.type, dataUrl: await blobADataURL(reg.blob) });
  }
  return out;
}

function prepararImagenesCatalogo(imagenes = []) {
  if (!Array.isArray(imagenes)) throw new Error("La colección de imágenes no es válida.");
  const ids = new Set();
  return imagenes.map(img => {
    if (!img || typeof img.id !== "string" || !img.id || ids.has(img.id)) throw new Error("ID de imagen inválido o duplicado.");
    ids.add(img.id);
    // No fetch de URLs de un backup: únicamente imágenes embebidas, como exporta la app.
    const match = typeof img.dataUrl === "string" && /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\r\n]+)$/i.exec(img.dataUrl);
    if (!match || match[2].length > 12 * 1024 * 1024) throw new Error("El respaldo contiene una imagen inválida o demasiado grande.");
    let bytes;
    try { bytes = Uint8Array.from(atob(match[2]), c => c.charCodeAt(0)); }
    catch { throw new Error("No se pudo decodificar una imagen del respaldo."); }
    if (bytes.length > 8 * 1024 * 1024) throw new Error("La imagen del respaldo supera 8 MB.");
    return { id: img.id, blob: new Blob([bytes], { type: match[1] }), nombre: img.nombre || "imagen", type: match[1], savedAt: new Date().toISOString() };
  });
}

// Un solo commit de IndexedDB para todas las imágenes. Si el callback local
// falla, abortamos antes del commit; si IndexedDB aborta, el llamador compensa LS.
async function escribirImagenesCatalogo(imagenes, antesDeCommit = () => {}) {
  if (!imagenes.length) { antesDeCommit(); return 0; }
  const db = await abrirDBImagenes();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(KPOP_GALA_MEDIA_STORE, "readwrite");
      let errorLocal = null;
      tx.oncomplete = resolve;
      tx.onabort = () => reject(errorLocal || tx.error || new Error("Se abortó el guardado de imágenes."));
      tx.onerror = () => { /* El error aborta la transacción; se espera onabort. */ };
      try {
        let pendientes = imagenes.length;
        imagenes.forEach(img => {
          const req = tx.objectStore(KPOP_GALA_MEDIA_STORE).put(img);
          req.onsuccess = () => {
            if (--pendientes !== 0) return;
            try { antesDeCommit(); }
            catch (error) { errorLocal = error; tx.abort(); }
          };
        });
      } catch (error) {
        errorLocal = error;
        tx.abort();
      }
    });
    imagenes.forEach(img => {
      const url = kgObjectUrlCache.get(img.id);
      if (url) URL.revokeObjectURL(url);
      kgObjectUrlCache.delete(img.id);
    });
    return imagenes.length;
  } finally { db.close(); }
}

async function importarImagenesCatalogo(imagenes = []) {
  return escribirImagenesCatalogo(prepararImagenesCatalogo(imagenes));
}

function calcularRankingBsides(temporadaId = obtenerTemporadaActivaId()) {
  const registros = filtrarRegistrosTemporada(cargarRegistrosBsides(), temporadaId);
  const mapa = {};
  BSIDES.forEach(b => {
    mapa[b.id] = { bside: b, puntajeTotal: 0, p1: 0, p2: 0, entradasP1: 0, entradasP2: 0 };
  });
  registros.forEach(r => {
    if (!mapa[r.bsideId]) return;
    const pts = obtenerPuntajeRegistro(r);
    mapa[r.bsideId].puntajeTotal += pts;
    if (r.personaId === "p1") { mapa[r.bsideId].p1 += pts; mapa[r.bsideId].entradasP1++; }
    if (r.personaId === "p2") { mapa[r.bsideId].p2 += pts; mapa[r.bsideId].entradasP2++; }
  });
  return Object.values(mapa).filter(x => !x.bside.archivado || x.puntajeTotal > 0).sort((a, b) => b.puntajeTotal - a.puntajeTotal);
}


// ── Hall of Fame · v2.0 ─────────────────────────────────────
function cargarHallOfFame() {
  const raw = leerJSONSeguro(KPOP_GALA_HOF_KEY, {});
  return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
}

function guardarHallOfFame(hall) {
  return escribirJSONSeguro(KPOP_GALA_HOF_KEY, hall && typeof hall === "object" ? hall : {});
}

function calcularRankingArtistasGeneral(temporadaId = obtenerTemporadaActivaId()) {
  const registros = filtrarRegistrosTemporada(cargarRegistrosArtistas(), temporadaId);
  const mapa = {};
  ARTISTAS.forEach(a => {
    mapa[a.id] = { artista: a, puntajeTotal: 0, p1: 0, p2: 0 };
  });
  registros.forEach(r => {
    const item = mapa[r.artistaId];
    if (!item) return;
    const pts = obtenerPuntajeRegistro(r);
    item.puntajeTotal += pts;
    const persona = r.personaId || "p1";
    if (persona === "p1") item.p1 += pts;
    if (persona === "p2") item.p2 += pts;
  });
  return Object.values(mapa)
    .filter(x => !x.artista.archivado || x.puntajeTotal > 0)
    .sort((a,b) => b.puntajeTotal - a.puntajeTotal || xNombre(a.artista).localeCompare(xNombre(b.artista), "es"));
}

function xNombre(item) {
  return String(item?.nombre || "");
}

function rankingTipoTemporada(tipo, temporadaId) {
  if (tipo === "canciones") return calcularRanking(temporadaId).map(x => ({ item: x.cancion, puntos: x.puntajeTotal }));
  if (tipo === "artistas") return calcularRankingArtistasGeneral(temporadaId).map(x => ({ item: x.artista, puntos: x.puntajeTotal }));
  if (tipo === "albumes") return calcularRankingAlbumes(temporadaId).map(x => ({ item: x.album, puntos: x.puntajeTotal }));
  if (tipo === "bsides") return calcularRankingBsides(temporadaId).map(x => ({ item: x.bside, puntos: x.puntajeTotal }));
  return [];
}

function snapshotGanador(tipo, item, puntos = 0) {
  if (!item) return null;
  return {
    tipo,
    id: item.id,
    nombre: item.nombre,
    subtitulo: tipo === "artistas" ? String(item.categoria || "").replaceAll("_", " ").toUpperCase() : (item.artista || ""),
    puntos: Number(puntos) || 0,
    img: item.img || "",
    imagenId: item.imagenId || null,
  };
}

function calcularGanadoresTemporada(temporadaId) {
  const out = {};
  ["canciones","artistas","albumes","bsides"].forEach(tipo => {
    const top = rankingTipoTemporada(tipo, temporadaId)[0] || null;
    out[tipo] = top ? snapshotGanador(tipo, top.item, top.puntos) : null;
  });
  return out;
}

function guardarHallOfFameAutomatico(temporadaId, reemplazarManual = false) {
  const sid = String(temporadaId);
  const hall = cargarHallOfFame();
  // Si el usuario ya personalizó los ganadores, cerrar/reabrir no los pisa.
  if (hall[sid]?.modo === "manual" && !reemplazarManual) return hall[sid];
  hall[sid] = {
    temporadaId: sid,
    modo: "automatico",
    savedAt: new Date().toISOString(),
    ganadores: calcularGanadoresTemporada(sid),
  };
  if (!guardarHallOfFame(hall)) throw new Error("No se pudo guardar el Hall of Fame.");
  return hall[sid];
}

function guardarHallOfFameManual(temporadaId, selecciones = {}) {
  const sid = String(temporadaId);
  if (!obtenerTemporadaPorId(sid)) throw new Error("Temporada no encontrada.");
  exigirBackupSeguridad("antes_de_editar_hall_of_fame");
  const hall = cargarHallOfFame();
  const ganadores = {};
  ["canciones","artistas","albumes","bsides"].forEach(tipo => {
    const id = selecciones[tipo];
    if (id === null || id === undefined || id === "") {
      ganadores[tipo] = null;
      return;
    }
    const item = obtenerItemCatalogo(tipo, id);
    if (!item) throw new Error(`No se encontró el ganador de ${tipo}.`);
    const rank = rankingTipoTemporada(tipo, sid).find(x => String(x.item.id) === String(id));
    ganadores[tipo] = snapshotGanador(tipo, item, rank?.puntos || 0);
  });
  hall[sid] = {
    temporadaId: sid,
    modo: "manual",
    savedAt: new Date().toISOString(),
    ganadores,
  };
  if (!guardarHallOfFame(hall)) throw new Error("No se pudo guardar el Hall of Fame.");
  return hall[sid];
}

function obtenerHallOfFameTemporada(temporadaId, provisional = true) {
  const sid = String(temporadaId);
  const guardado = cargarHallOfFame()[sid];
  if (guardado) return { ...guardado, provisional: false };
  if (!provisional) return null;
  return {
    temporadaId: sid,
    modo: "provisional",
    savedAt: null,
    ganadores: calcularGanadoresTemporada(sid),
    provisional: true,
  };
}


// ── Métricas históricas de ranking · v1.3 ────────────────────
// Se calculan en memoria a partir de los registros existentes.
// No se crean nuevas claves ni se modifica el historial guardado.
function indiceSemanaPorId(semanaId, temporadaId = obtenerTemporadaActivaId()) {
  const semanas = temporadaId === obtenerTemporadaActivaId() ? SEMANAS : obtenerSemanasTemporada(temporadaId);
  return semanas.findIndex(s => s.id === semanaId);
}

function calcularMetricasHistoricas(items, registros, obtenerIdItem, obtenerIdRegistro, temporadaId = obtenerTemporadaActivaId()) {
  const semanas = temporadaId === obtenerTemporadaActivaId() ? SEMANAS : obtenerSemanasTemporada(temporadaId);
  const ids = items.map(item => String(obtenerIdItem(item)));
  const idSet = new Set(ids);
  const ordenBase = new Map(ids.map((id, index) => [id, index]));
  const registrosValidos = registros
    .map(r => ({ registro: r, semanaIndex: indiceSemanaPorId(r.semanaId, temporadaId) }))
    .filter(x => x.semanaIndex >= 0 && idSet.has(String(obtenerIdRegistro(x.registro))));

  const ultimoIndice = registrosValidos.length
    ? Math.max(...registrosValidos.map(x => x.semanaIndex))
    : -1;

  const metricas = new Map(ids.map(id => [id, {
    posicionActual: null,
    posicionAnterior: null,
    movimiento: null,
    estadoMovimiento: "none",
    peak: null,
    semanasEnRanking: 0,
    debutSemanaId: null,
    ultimaSemanaId: ultimoIndice >= 0 ? semanas[ultimoIndice]?.id || null : null,
  }]));

  if (ultimoIndice < 0) return metricas;

  const construirRankingHasta = (limiteSemana) => {
    const totales = new Map(ids.map(id => [id, 0]));
    registrosValidos.forEach(({ registro, semanaIndex }) => {
      if (semanaIndex > limiteSemana) return;
      const id = String(obtenerIdRegistro(registro));
      totales.set(id, (totales.get(id) || 0) + obtenerPuntajeRegistro(registro));
    });

    const ranking = ids
      .map(id => ({ id, puntos: totales.get(id) || 0 }))
      .filter(x => x.puntos > 0)
      .sort((a, b) => {
        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
        return (ordenBase.get(a.id) || 0) - (ordenBase.get(b.id) || 0);
      });

    return new Map(ranking.map((x, index) => [x.id, index + 1]));
  };

  const rankingActual = construirRankingHasta(ultimoIndice);
  const rankingAnterior = ultimoIndice > 0 ? construirRankingHasta(ultimoIndice - 1) : new Map();

  // Peak histórico: mejor posición alcanzada al cierre de cada semana.
  for (let semanaIndex = 0; semanaIndex <= ultimoIndice; semanaIndex++) {
    const rankingSemana = construirRankingHasta(semanaIndex);
    rankingSemana.forEach((posicion, id) => {
      const m = metricas.get(id);
      if (!m) return;
      m.peak = m.peak === null ? posicion : Math.min(m.peak, posicion);
    });
  }

  // Debut y semanas acumuladas en el ranking.
  ids.forEach(id => {
    const indicesItem = registrosValidos
      .filter(({ registro }) => String(obtenerIdRegistro(registro)) === id)
      .map(x => x.semanaIndex);

    const m = metricas.get(id);
    if (!m || !indicesItem.length) return;

    const debutIndex = Math.min(...indicesItem);
    m.debutSemanaId = semanas[debutIndex]?.id || null;
    m.semanasEnRanking = Math.max(0, ultimoIndice - debutIndex + 1);

    m.posicionActual = rankingActual.get(id) ?? null;
    m.posicionAnterior = rankingAnterior.get(id) ?? null;

    if (m.posicionActual !== null && m.posicionAnterior === null) {
      m.estadoMovimiento = "new";
      m.movimiento = null;
    } else if (m.posicionActual !== null && m.posicionAnterior !== null) {
      const delta = m.posicionAnterior - m.posicionActual;
      m.movimiento = delta;
      m.estadoMovimiento = delta > 0 ? "up" : delta < 0 ? "down" : "same";
    }
  });

  return metricas;
}

function calcularMetricasCanciones(temporadaId = obtenerTemporadaActivaId()) {
  return calcularMetricasHistoricas(
    CANCIONES,
    filtrarRegistrosTemporada(cargarRegistros(), temporadaId),
    item => item.id,
    registro => registro.cancionId,
    temporadaId
  );
}

function calcularMetricasAlbumes(temporadaId = obtenerTemporadaActivaId()) {
  return calcularMetricasHistoricas(
    ALBUMES,
    filtrarRegistrosTemporada(cargarRegistrosAlbumes(), temporadaId),
    item => item.id,
    registro => registro.albumId,
    temporadaId
  );
}

function calcularMetricasBsides(temporadaId = obtenerTemporadaActivaId()) {
  return calcularMetricasHistoricas(
    BSIDES,
    filtrarRegistrosTemporada(cargarRegistrosBsides(), temporadaId),
    item => item.id,
    registro => registro.bsideId,
    temporadaId
  );
}

function calcularMetricasArtistas(categoria, temporadaId = obtenerTemporadaActivaId()) {
  const items = ARTISTAS.filter(a => a.categoria === categoria);
  const ids = new Set(items.map(a => String(a.id)));
  const registros = filtrarRegistrosTemporada(cargarRegistrosArtistas(), temporadaId).filter(r => ids.has(String(r.artistaId)));
  return calcularMetricasHistoricas(
    items,
    registros,
    item => item.id,
    registro => registro.artistaId,
    temporadaId
  );
}

// Inicialización no destructiva.
reconstruirCatalogos();
inicializarCapaDatos();
if (typeof document !== "undefined") {
  const iniciarUICompartida = () => { inyectarNavDatos(); inicializarUXV12(); aplicarTemporadaUI(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciarUICompartida);
  else iniciarUICompartida();
}
