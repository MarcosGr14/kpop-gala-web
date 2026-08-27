// ============================================================
//  KPOP GALA — DATA.JS · v1.1 Stability Update
//  Datos, semanas, puntaje y capa segura de almacenamiento
// ============================================================

const KPOP_GALA_APP_VERSION = "1.1.0";
const KPOP_GALA_SCHEMA_VERSION = 1;
const KPOP_GALA_TEMPORADA = {
  anio: 2026,
  inicio: new Date(2026, 5, 1),   // Lunes 1 de junio de 2026
  fin: new Date(2026, 11, 6),     // Domingo 6 de diciembre de 2026
};

const CANCIONES = [
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

function generarSemanas() {
  const semanas = [];
  const inicio = new Date(KPOP_GALA_TEMPORADA.inicio);
  const fin = new Date(KPOP_GALA_TEMPORADA.fin);
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

function semanaParaFecha(fecha = new Date()) {
  const t = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime();
  return SEMANAS.find(s => {
    const ini = new Date(`${s.inicio}T00:00:00`).getTime();
    const fin = new Date(`${s.fin}T23:59:59`).getTime();
    return t >= ini && t <= fin;
  }) || null;
}

function obtenerSemanaRecomendada() {
  const actual = semanaParaFecha(new Date());
  if (actual) return actual;

  const idsUsados = new Set([
    ...cargarRegistros(),
    ...cargarRegistrosArtistas(),
    ...cargarRegistrosAlbumes(),
    ...cargarRegistrosBsides(),
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
    motivo,
    exportedAt: new Date().toISOString(),
    origin: typeof location !== "undefined" ? location.origin : "unknown",
    data: {
      canciones: cargarRegistros(),
      artistas: cargarRegistrosArtistas(),
      albumes: cargarRegistrosAlbumes(),
      bsides: cargarRegistrosBsides(),
    },
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
  return normalizado;
}

function restaurarSnapshotDatos(snapshot) {
  const data = normalizarSnapshotDatos(snapshot);
  guardarBackupSeguridad("antes_de_restaurar");

  const resultados = [
    guardarRegistros(data.canciones),
    guardarRegistrosArtistas(data.artistas),
    guardarRegistrosAlbumes(data.albumes),
    guardarRegistrosBsides(data.bsides),
  ];
  if (resultados.some(ok => !ok)) throw new Error("No se pudo completar la restauración. El respaldo de seguridad anterior sigue disponible.");

  return {
    canciones: data.canciones.length,
    artistas: data.artistas.length,
    albumes: data.albumes.length,
    bsides: data.bsides.length,
  };
}

function guardarBackupSeguridad(motivo = "seguridad") {
  try {
    localStorage.setItem(KPOP_GALA_LAST_BACKUP_KEY, JSON.stringify(crearSnapshotDatos(motivo)));
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

function inicializarCapaDatosV11() {
  try {
    if (!localStorage.getItem(KPOP_GALA_INITIAL_BACKUP_KEY)) {
      localStorage.setItem(KPOP_GALA_INITIAL_BACKUP_KEY, JSON.stringify(crearSnapshotDatos("antes_de_v1_1")));
    }
    localStorage.setItem(KPOP_GALA_SCHEMA_KEY, String(KPOP_GALA_SCHEMA_VERSION));
    localStorage.setItem(KPOP_GALA_APP_VERSION_KEY, KPOP_GALA_APP_VERSION);
  } catch (error) {
    // La app continúa funcionando aunque el navegador no permita crear metadata extra.
    console.warn("[KPop Gala] No se pudo inicializar metadata de v1.1.", error);
  }
}

function inyectarNavDatos() {
  const nav = document.querySelector(".nav-links");
  if (!nav || nav.querySelector('a[href="datos.html"]')) return;
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.href = "datos.html";
  a.innerHTML = "💾 <span>Datos</span>";
  if (location.pathname.endsWith("/datos.html") || location.pathname.endsWith("datos.html")) a.classList.add("active");
  li.appendChild(a);
  nav.appendChild(li);
}

// ── Obtener puntaje acumulado por canción ─────────────────────
function calcularRanking() {
  const registros = cargarRegistros();
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

  return Object.values(mapa).sort((a, b) => b.puntajeTotal - a.puntajeTotal);
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
const ARTISTAS = [
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

function calcularRankingArtistas(categoria) {
  const registros = cargarRegistrosArtistas();
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
  return Object.values(mapa).sort((a, b) => b.puntajeTotal - a.puntajeTotal);
}

// ── BASE DE DATOS DE ÁLBUMES ────────────────────────────────
const ALBUMES = [
  { id: 1, nombre: "BLUE VALENTINE", artista: "NMIXX", img: "assets/albumes/NMIXX.jpg" },
  { id: 5, nombre: "SHOT CALLERS", artista: "LNGSHOT", img: "assets/albumes/LNGSHOT.jpg" },
  { id: 10, nombre: "4SHO 4SHO VILLE", artista: "JAY PARK", img: "assets/albumes/JAYPARK.png" },
  { id: 11, nombre: "NEW WAV", artista: "TREASURE", img: "assets/albumes/TREASURE.jpg" },
  { id: 12, nombre: "LEMONADE", artista: "AESPA", img: "assets/albumes/LEMON.jpg" },
  { id: 15, nombre: "II", artista: "RIIZE", img: "assets/albumes/RIIZE7.webp" },
  { id: 16, nombre: "WHY KIIIKIII", artista: "KIIIKIII", img: "assets/albumes/KK.jpg" },
];

function albumPorId(id) { return ALBUMES.find(a => a.id === Number(id)); }

function calcularRankingAlbumes() {
  const registros = cargarRegistrosAlbumes();
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
  return Object.values(mapa).sort((a, b) => b.puntajeTotal - a.puntajeTotal);
}

// ── BASE DE DATOS DE B-SIDES ────────────────────────────────
const BSIDES = [
  { id: 'bs1', nombre: "Zoom Zoom", artista: "Treasure", img: "assets/canciones/TREASURE.jpg" },
  { id: 'bs4', nombre: "4SHO 4SHO", artista: "Jay Park & Lngshot", img: "assets/canciones/JAYPARK.png" },
  { id: 'bs7', nombre: "Never let go", artista: "Lngshot", img: "assets/canciones/LNGSHOT.jpg" },
  { id: 'bs13', nombre: "Camouflage", artista: "Aespa", img: "assets/canciones/AESPA.jpg" },
  { id: 'bs17', nombre: "Amazing", artista: "Jmin, SIK-K", img: "assets/canciones/Forever.webp" },
];

function calcularRankingBsides() {
  const registros = cargarRegistrosBsides();
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
  return Object.values(mapa).sort((a, b) => b.puntajeTotal - a.puntajeTotal);
}

// Inicialización no destructiva de v1.1.
inicializarCapaDatosV11();
if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", inyectarNavDatos);
  else inyectarNavDatos();
}
