// ============================================================
//  KPOP GALA — DATA.JS
//  Base de datos de canciones, semanas y lógica de puntaje
// ============================================================

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
const PERSONAS = [
  { id: "p1", nombre: "Persona 1", color: "#f472b6" },  // rosa
  { id: "p2", nombre: "Persona 2", color: "#22d3ee" },  // cyan
];

// ── Semanas: Junio 1 → primera semana de Diciembre 2025 ───────
function generarSemanas() {
  const semanas = [];
  const inicio = new Date(2025, 5, 2); // Lunes 2 de Junio 2025
  const fin    = new Date(2025, 11, 1); // 1 de Diciembre 2025

  let actual = new Date(inicio);
  let num = 1;

  while (actual <= fin) {
    const lunes   = new Date(actual);
    const domingo = new Date(actual);
    domingo.setDate(domingo.getDate() + 6);

    const fmtL = lunes.toLocaleDateString("es-PA", { day: "2-digit", month: "short" });
    const fmtD = (domingo > fin ? fin : domingo).toLocaleDateString("es-PA", { day: "2-digit", month: "short" });

    semanas.push({
      id: `S${String(num).padStart(2, "0")}`,
      label: `Semana ${num} · ${fmtL} – ${fmtD}`,
      num,
    });

    actual.setDate(actual.getDate() + 7);
    num++;
    if (num > 27) break; 
  }
  return semanas;
}
const SEMANAS = generarSemanas();

// ── Puntaje total de una entrada (ACTUALIZADO) ───────────────
function calcularPuntajeEntrada(posSpotify, posInstafest, reproducciones) {
  if (reproducciones === undefined) {
    let viejaPos = posSpotify;
    let viejaRep = posInstafest;
    let pts = viejaPos >= 1 && viejaPos <= 15 ? (16 - viejaPos) : 0;
    return pts + Math.min(Number(viejaRep) || 0, 200);
  }

  let ptsSpot = posSpotify >= 1 && posSpotify <= 15 ? (16 - posSpotify) : 0;
  let ptsInsta = posInstafest >= 1 && posInstafest <= 15 ? (16 - posInstafest) : 0;
  let pRep = Math.min(Number(reproducciones) || 0, 200); 
  
  return ptsSpot + ptsInsta + pRep;
}

// ── localStorage helpers ──────────────────────────────────────
const STORAGE_KEY = "kpop_gala_registros";

function cargarRegistros() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function guardarRegistros(registros) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
}

// ── Obtener puntaje acumulado por canción ───────
function calcularRanking() {
  const registros = cargarRegistros();
  const mapa = {};

  CANCIONES.forEach(c => {
    mapa[c.id] = { cancion: c, puntajeTotal: 0, p1: 0, p2: 0, entradasP1: 0, entradasP2: 0 };
  });

  registros.forEach(r => {
    if (!mapa[r.cancionId]) return;
    let pts = 0;
    if (r.posSpotify !== undefined) {
      pts = calcularPuntajeEntrada(r.posSpotify, r.posInstafest, r.reproducciones);
    } else {
      pts = calcularPuntajeEntrada(r.posicion, r.reproducciones);
    }
    mapa[r.cancionId].puntajeTotal += pts;
    if (r.personaId === "p1") { mapa[r.cancionId].p1 += pts; mapa[r.cancionId].entradasP1++; }
    if (r.personaId === "p2") { mapa[r.cancionId].p2 += pts; mapa[r.cancionId].entradasP2++; }
  });

  return Object.values(mapa).sort((a, b) => b.puntajeTotal - a.puntajeTotal);
}

function cancionPorId(id) {
  return CANCIONES.find(c => c.id === Number(id));
}

// ── Colores neon del tema ─────────────────────────────────────
const NEON = {
  rosa:     "#f472b6",
  cyan:     "#22d3ee",
  amarillo: "#facc15",
  violeta:  "#a78bfa",
  verde:    "#4ade80",
};

// ── BASE DE DATOS DE ARTISTAS ────────────────────────────────
const ARTISTAS = [
  // Solistas Masculinos
  { id: 'sm1', nombre: 'Jay Park', categoria: 'solista_m', img: 'assets/artistas/Jaebeom.jpg' },
  { id: 'sm2', nombre: 'B.I', categoria: 'solista_m', img: 'assets/artistas/BI.jpg' },
  { id: 'sm4', nombre: 'Sik-k', categoria: 'solista_m', img: 'assets/artistas/Sikk.jpg' },
  { id: 'sm5', nombre: 'Osun', categoria: 'solista_m', img: 'assets/artistas/Osun.jpg' },
  { id: 'sm8', nombre: 'Evan', categoria: 'solista_m', img: 'assets/artistas/Ev.webp' },
  { id: 'sm9', nombre: 'Jmin', categoria: 'solista_m', img: 'assets/artistas/jmin.webp' },

  
  // Solistas Femeninos
  { id: 'sf1', nombre: 'Yves', categoria: 'solista_f', img: 'assets/artistas/Yves.jpg' },
  { id: 'sf5', nombre: 'Jihyo', categoria: 'solista_f', img: 'assets/artistas/Jihyo.jpg' },
  
  // Boy Groups
  
  { id: 'bg2', nombre: 'BTS', categoria: 'boy_group', img: 'assets/artistas/bts.jpg' },
  { id: 'bg3', nombre: 'SEVENTEEN', categoria: 'boy_group', img: 'assets/artistas/svt.jpg' },
  { id: 'bg6', nombre: 'LNGSHOT', categoria: 'boy_group', img: 'assets/artistas/LNGS.jpg' },
  { id: 'bg7', nombre: 'RIIZE', categoria: 'boy_group', img: 'assets/artistas/RZZ.jpg' },
  { id: 'bg9', nombre: 'TREASURE', categoria: 'boy_group', img: 'assets/artistas/treasure.jpg' },
  { id: 'bg13', nombre: 'XDINARY HEROES', categoria: 'boy_group', img: 'assets/artistas/xdh.jpg' },

  // Girl Groups
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

const STORAGE_ARTISTAS_KEY = "kpop_gala_artistas_registros";

function cargarRegistrosArtistas() {
  try { return JSON.parse(localStorage.getItem(STORAGE_ARTISTAS_KEY)) || []; } 
  catch { return []; }
}

function guardarRegistrosArtistas(registros) {
  localStorage.setItem(STORAGE_ARTISTAS_KEY, JSON.stringify(registros));
}

function calcularRankingArtistas(categoria) {
  const registros = cargarRegistrosArtistas();
  const mapa = {};

  ARTISTAS.filter(a => a.categoria === categoria).forEach(a => {
    mapa[a.id] = { artista: a, puntajeTotal: 0, p1: 0, p2: 0, entradasP1: 0, entradasP2: 0 };
  });

  registros.forEach(r => {
    if (mapa[r.artistaId]) {
      mapa[r.artistaId].puntajeTotal += r.puntaje;
      const persona = r.personaId || "p1";
      if (persona === "p1") { mapa[r.artistaId].p1 += r.puntaje; mapa[r.artistaId].entradasP1++; }
      if (persona === "p2") { mapa[r.artistaId].p2 += r.puntaje; mapa[r.artistaId].entradasP2++; }
    }
  });

  return Object.values(mapa).sort((a, b) => b.puntajeTotal - a.puntajeTotal);
}

// ── BASE DE DATOS DE ÁLBUMES ────────────────────────────────
const ALBUMES = [
  { id: 1, nombre: "BLUE VALENTINE", artista: "NMIXX", img: "assets/albumes/NMIXX.jpg" },
  { id: 5, nombre: "SHOT CALLERS", artista: "LNGSHOT", img: "assets/albumes/LNGSHOT.jpg" },
  { id: 7, nombre: "ARIRANG", artista: "ARIRANG", img: "assets/albumes/BTS.jpg" },
  { id: 10, nombre: "4SHO 4SHO VILLE", artista: "JAY PARK", img: "assets/albumes/JAYPARK.png" },
  { id: 11, nombre: "NEW WAV", artista: "TREASURE", img: "assets/albumes/TREASURE.jpg" },
  { id: 12, nombre: "LEMONADE", artista: "AESPA", img: "assets/albumes/LEMON.jpg" },
  { id: 15, nombre: "II", artista: "RIIZE", img: "assets/albumes/RIIZE7.webp" },
];

const STORAGE_ALBUMES_KEY = "kpop_gala_albumes_registros";

function cargarRegistrosAlbumes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_ALBUMES_KEY)) || []; } 
  catch { return []; }
}

function guardarRegistrosAlbumes(registros) {
  localStorage.setItem(STORAGE_ALBUMES_KEY, JSON.stringify(registros));
}

function albumPorId(id) {
  return ALBUMES.find(a => a.id === Number(id));
}

function calcularRankingAlbumes() {
  const registros = cargarRegistrosAlbumes();
  const mapa = {};

  ALBUMES.forEach(a => {
    mapa[a.id] = { album: a, puntajeTotal: 0, p1: 0, p2: 0, entradasP1: 0, entradasP2: 0 };
  });

  registros.forEach(r => {
    if (!mapa[r.albumId]) return;
    const pts = calcularPuntajeEntrada(r.posSpotify, r.posInstafest, r.reproducciones);
    mapa[r.albumId].puntajeTotal += pts;
    if (r.personaId === "p1") { mapa[r.albumId].p1 += pts; mapa[r.albumId].entradasP1++; }
    if (r.personaId === "p2") { mapa[r.albumId].p2 += pts; mapa[r.albumId].entradasP2++; }
  });

  return Object.values(mapa).sort((a, b) => b.puntajeTotal - a.puntajeTotal);
}

// ── BASE DE DATOS DE B-SIDES ────────────────────────────────
const BSIDES = [
  // Pon aquí tus B-Sides reales, esto es un ejemplo:
  { id: 'bs1', nombre: "Zoom Zoom", artista: "Treasure", img: "assets/canciones/TREASURE.jpg" },
  { id: 'bs4', nombre: "4SHO 4SHO", artista: "Jay Park & Lngshot", img: "assets/canciones/JAYPARK.png" },
  { id: 'bs7', nombre: "Never let go", artista: "Lngshot", img: "assets/canciones/LNGSHOT.jpg" },
  { id: 'bs11', nombre: "One More Night", artista: "BTS", img: "assets/canciones/BTS.jpg" },
  { id: 'bs13', nombre: "Camouflage", artista: "Aespa", img: "assets/canciones/AESPA.jpg" },
  { id: 'bs17', nombre: "Amazing", artista: "Jmin, SIK-K", img: "assets/canciones/Forever.webp" },

];

const STORAGE_BSIDES_KEY = "kpop_gala_bsides_registros";

function cargarRegistrosBsides() {
  try { return JSON.parse(localStorage.getItem(STORAGE_BSIDES_KEY)) || []; } 
  catch { return []; }
}

function guardarRegistrosBsides(registros) {
  localStorage.setItem(STORAGE_BSIDES_KEY, JSON.stringify(registros));
}

function calcularRankingBsides() {
  const registros = cargarRegistrosBsides();
  const mapa = {};

  BSIDES.forEach(b => {
    mapa[b.id] = { bside: b, puntajeTotal: 0, p1: 0, p2: 0, entradasP1: 0, entradasP2: 0 };
  });

  registros.forEach(r => {
    if (!mapa[r.bsideId]) return;
    const pts = calcularPuntajeEntrada(r.posSpotify, r.posInstafest, r.reproducciones);
    
    mapa[r.bsideId].puntajeTotal += pts;
    if (r.personaId === "p1") { mapa[r.bsideId].p1 += pts; mapa[r.bsideId].entradasP1++; }
    if (r.personaId === "p2") { mapa[r.bsideId].p2 += pts; mapa[r.bsideId].entradasP2++; }
  });

  return Object.values(mapa).sort((a, b) => b.puntajeTotal - a.puntajeTotal);
}