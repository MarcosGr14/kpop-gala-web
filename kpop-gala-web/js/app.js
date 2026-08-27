// ============================================================
//  KPOP GALA — APP.JS · v1.5 Analytics & Detail Views
//  Ranking global + métricas históricas + Top 3
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  inyectarEstilosRankingsV13();
  renderStats();
  renderRanking("all");
  configurarTabs();
  renderRankingArtistas("boy_group");
  configurarTabsArtistas();
  renderRankingAlbumes("all");
  configurarTabsAlbumes();
  renderRankingBsides("all");
  configurarTabsBsides();
  configurarBuscadoresRanking();
  aplicarConfiguracionUI();
});

function renderStats() {
  const registros = cargarRegistros();
  const ranking = calcularRanking();
  const totalPts = registros.reduce((s, r) => s + obtenerPuntajeRegistro(r), 0);
  const ptsP1 = registros.filter(r => r.personaId === "p1").reduce((s, r) => s + obtenerPuntajeRegistro(r), 0);
  const ptsP2 = registros.filter(r => r.personaId === "p2").reduce((s, r) => s + obtenerPuntajeRegistro(r), 0);
  const semanas = [...new Set(registros.map(r => r.semanaId))].length;

  document.getElementById("stat-total").textContent = totalPts.toLocaleString();
  document.getElementById("stat-p1").textContent = ptsP1.toLocaleString();
  document.getElementById("stat-p2").textContent = ptsP2.toLocaleString();
  document.getElementById("stat-semanas").textContent = semanas;
  document.getElementById("stat-canciones").textContent = ranking.filter(r => r.puntajeTotal > 0).length;
}

function obtenerPosicionGlobal(ranking, item) {
  const i = ranking.indexOf(item);
  return i >= 0 ? i + 1 : null;
}

function htmlMovimiento(metrica) {
  if (!metrica || metrica.posicionActual === null) {
    return `<span class="kg-move kg-move-none">—</span>`;
  }
  if (metrica.estadoMovimiento === "new") {
    return `<span class="kg-move kg-move-new">NEW</span>`;
  }
  if (metrica.estadoMovimiento === "up") {
    return `<span class="kg-move kg-move-up">↑ ${metrica.movimiento}</span>`;
  }
  if (metrica.estadoMovimiento === "down") {
    return `<span class="kg-move kg-move-down">↓ ${Math.abs(metrica.movimiento)}</span>`;
  }
  return `<span class="kg-move kg-move-same">—</span>`;
}

function htmlMetricas(metrica) {
  if (!metrica || metrica.posicionActual === null) {
    return `<div class="kg-rank-meta"><span>Peak —</span><span>0 sem.</span>${htmlMovimiento(metrica)}</div>`;
  }
  return `
    <div class="kg-rank-meta" title="Comparación contra la semana anterior de la temporada">
      <span>Peak <strong>#${metrica.peak ?? "—"}</strong></span>
      <span><strong>${metrica.semanasEnRanking}</strong> sem.</span>
      ${htmlMovimiento(metrica)}
    </div>`;
}

function crearRankCard({
  pos,
  puntos,
  p1,
  p2,
  nombre,
  subtitulo,
  img,
  imagenId = null,
  placeholder,
  metrica,
  barStyle = "",
  detalleHref = null,
}) {
  const tienePuntos = puntos > 0;
  const topClass = tienePuntos && pos <= 3 ? `pos-${pos} kg-top-${pos}` : "";
  const medal = tienePuntos && pos === 1 ? "🥇" : tienePuntos && pos === 2 ? "🥈" : tienePuntos && pos === 3 ? "🥉" : pos;
  const card = document.createElement("div");
  card.className = `rank-card ${topClass} fade-up`;
  card.dataset.rankPosition = String(pos);
  if (detalleHref) {
    card.classList.add("kg-rank-clickable");
    card.tabIndex = 0;
    card.setAttribute("role", "link");
    card.setAttribute("aria-label", `Ver analytics de ${nombre}`);
    const abrirDetalle = () => { window.location.href = detalleHref; };
    card.addEventListener("click", abrirDetalle);
    card.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrirDetalle(); }
    });
  }
  card.innerHTML = `
    <div class="rank-pos">${medal}</div>
    <div class="rank-img-wrap">
      <img src="${imagenId ? KG_PIXEL_TRANSPARENTE : escaparHTML(img || KG_PIXEL_TRANSPARENTE)}"${imagenId ? ` data-kg-imagen-id="${escaparHTML(imagenId)}"` : ""} alt="${escaparHTML(nombre)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
      <div class="rank-img-placeholder" style="display:none;${placeholder.style || ""}">${placeholder.icon}</div>
    </div>
    <div class="rank-info">
      <div class="song-name">${escaparHTML(nombre)}</div>
      <div class="song-artist">${escaparHTML(subtitulo)}</div>
      ${htmlMetricas(metrica)}
    </div>
    <div class="rank-scores">
      <div class="rank-total">${Number(puntos).toLocaleString()} <small>pts</small></div>
      <div class="rank-persona-scores"><span class="ps p1">P1 ${p1}</span><span class="ps p2">P2 ${p2}</span></div>
    </div>
    <div class="rank-bar-wrap"><div class="rank-bar" style="${barStyle}"></div></div>`;
  return card;
}

function renderRanking(filtro) {
  const ranking = calcularRanking();
  const metricas = calcularMetricasCanciones();
  const container = document.getElementById("ranking-list");
  if (!container) return;
  container.innerHTML = "";

  const maxPts = Math.max(...ranking.map(r => r.puntajeTotal), 1);
  let lista = ranking;
  if (filtro === "con-puntos") lista = ranking.filter(r => r.puntajeTotal > 0);
  if (filtro === "sin-puntos") lista = ranking.filter(r => r.puntajeTotal === 0);

  if (!lista.length) {
    container.innerHTML = `<div class="empty-state"><h3>Sin registros</h3></div>`;
    return;
  }

  lista.forEach((item, idx) => {
    const pos = obtenerPosicionGlobal(ranking, item);
    const pct = ((item.puntajeTotal / maxPts) * 100).toFixed(1);
    const card = crearRankCard({
      pos,
      puntos: item.puntajeTotal,
      p1: item.p1,
      p2: item.p2,
      nombre: item.cancion.nombre,
      subtitulo: item.cancion.artista,
      img: item.cancion.img,
      imagenId: item.cancion.imagenId,
      placeholder: { icon: "🎵" },
      metrica: metricas.get(String(item.cancion.id)),
      barStyle: `width:${pct}%`,
      detalleHref: `analytics.html?tipo=canciones&id=${encodeURIComponent(item.cancion.id)}`,
    });
    card.style.animationDelay = `${Math.min(idx * 0.04, 0.4)}s`;
    container.appendChild(card);
  });
  aplicarImagenesCatalogo(container);
  aplicarBusquedaRanking("ranking-list");
  aplicarConfiguracionUI();
}

function configurarTabs() {
  const tabs = document.querySelectorAll(".tabs:not(#tabs-artistas):not(#tabs-albumes):not(#tabs-bsides) .tab-btn");
  tabs.forEach(tab => tab.addEventListener("click", () => {
    if (!tab.dataset.filtro) return;
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    renderRanking(tab.dataset.filtro);
  }));
}

function renderRankingArtistas(categoria) {
  const ranking = calcularRankingArtistas(categoria);
  const metricas = calcularMetricasArtistas(categoria);
  const container = document.getElementById("ranking-artistas-list");
  if (!container) return;
  container.innerHTML = "";

  if (!ranking.length) {
    container.innerHTML = `<div class="empty-state"><h3>Sin artistas en esta categoría</h3></div>`;
    return;
  }

  const maxPts = Math.max(...ranking.map(r => r.puntajeTotal), 1);
  ranking.forEach((item, idx) => {
    const pos = idx + 1;
    const pct = ((item.puntajeTotal / maxPts) * 100).toFixed(1);
    const card = crearRankCard({
      pos,
      puntos: item.puntajeTotal,
      p1: item.p1,
      p2: item.p2,
      nombre: item.artista.nombre,
      subtitulo: item.artista.categoria.replaceAll("_", " ").toUpperCase(),
      img: item.artista.img,
      imagenId: item.artista.imagenId,
      placeholder: { icon: "🎤", style: "background:linear-gradient(135deg,var(--amarillo-glow),#f9731633);" },
      metrica: metricas.get(String(item.artista.id)),
      barStyle: `width:${pct}%;background:linear-gradient(90deg,var(--amarillo),#f59e0b)`,
      detalleHref: `analytics.html?tipo=artistas&id=${encodeURIComponent(item.artista.id)}`,
    });
    card.style.animationDelay = `${Math.min(idx * 0.04, 0.4)}s`;
    container.appendChild(card);
  });
  aplicarImagenesCatalogo(container);
  aplicarBusquedaRanking("ranking-artistas-list");
  aplicarConfiguracionUI();
}

function configurarTabsArtistas() {
  const tabs = document.querySelectorAll("#tabs-artistas .tab-btn");
  tabs.forEach(tab => tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    renderRankingArtistas(tab.dataset.cat);
  }));
}

function renderRankingAlbumes(filtro) {
  const ranking = calcularRankingAlbumes();
  const metricas = calcularMetricasAlbumes();
  const container = document.getElementById("ranking-albumes-list");
  if (!container) return;
  container.innerHTML = "";

  const maxPts = Math.max(...ranking.map(r => r.puntajeTotal), 1);
  let lista = ranking;
  if (filtro === "con-puntos") lista = ranking.filter(r => r.puntajeTotal > 0);
  if (filtro === "sin-puntos") lista = ranking.filter(r => r.puntajeTotal === 0);
  if (!lista.length) { container.innerHTML = `<div class="empty-state"><h3>Sin registros</h3></div>`; return; }

  lista.forEach((item, idx) => {
    const pos = obtenerPosicionGlobal(ranking, item);
    const pct = ((item.puntajeTotal / maxPts) * 100).toFixed(1);
    const card = crearRankCard({
      pos,
      puntos: item.puntajeTotal,
      p1: item.p1,
      p2: item.p2,
      nombre: item.album.nombre,
      subtitulo: item.album.artista,
      img: item.album.img,
      imagenId: item.album.imagenId,
      placeholder: { icon: "💿", style: "background:linear-gradient(135deg,var(--violeta-glow),var(--rosa-glow));" },
      metrica: metricas.get(String(item.album.id)),
      barStyle: `width:${pct}%;background:linear-gradient(90deg,var(--violeta),var(--rosa))`,
      detalleHref: `analytics.html?tipo=albumes&id=${encodeURIComponent(item.album.id)}`,
    });
    card.style.animationDelay = `${Math.min(idx * 0.04, 0.4)}s`;
    container.appendChild(card);
  });
  aplicarImagenesCatalogo(container);
  aplicarBusquedaRanking("ranking-albumes-list");
  aplicarConfiguracionUI();
}

function configurarTabsAlbumes() {
  const tabs = document.querySelectorAll("#tabs-albumes .tab-btn");
  tabs.forEach(tab => tab.addEventListener("click", () => {
    if (!tab.dataset.filtro) return;
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    renderRankingAlbumes(tab.dataset.filtro);
  }));
}

function renderRankingBsides(filtro) {
  const ranking = calcularRankingBsides();
  const metricas = calcularMetricasBsides();
  const container = document.getElementById("ranking-bsides-list");
  if (!container) return;
  container.innerHTML = "";

  const maxPts = Math.max(...ranking.map(r => r.puntajeTotal), 1);
  let lista = ranking;
  if (filtro === "con-puntos") lista = ranking.filter(r => r.puntajeTotal > 0);
  if (filtro === "sin-puntos") lista = ranking.filter(r => r.puntajeTotal === 0);
  if (!lista.length) { container.innerHTML = `<div class="empty-state"><h3>Sin registros</h3></div>`; return; }

  lista.forEach((item, idx) => {
    const pos = obtenerPosicionGlobal(ranking, item);
    const pct = ((item.puntajeTotal / maxPts) * 100).toFixed(1);
    const card = crearRankCard({
      pos,
      puntos: item.puntajeTotal,
      p1: item.p1,
      p2: item.p2,
      nombre: item.bside.nombre,
      subtitulo: item.bside.artista,
      img: item.bside.img,
      imagenId: item.bside.imagenId,
      placeholder: { icon: "🎧", style: "background:linear-gradient(135deg,var(--verde-glow),#10b981);" },
      metrica: metricas.get(String(item.bside.id)),
      barStyle: `width:${pct}%;background:linear-gradient(90deg,#10b981,#34d399)`,
      detalleHref: `analytics.html?tipo=bsides&id=${encodeURIComponent(item.bside.id)}`,
    });
    card.style.animationDelay = `${Math.min(idx * 0.04, 0.4)}s`;
    container.appendChild(card);
  });
  aplicarImagenesCatalogo(container);
  aplicarBusquedaRanking("ranking-bsides-list");
  aplicarConfiguracionUI();
}

function configurarTabsBsides() {
  const tabs = document.querySelectorAll("#tabs-bsides .tab-btn");
  tabs.forEach(tab => tab.addEventListener("click", () => {
    if (!tab.dataset.filtro) return;
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    renderRankingBsides(tab.dataset.filtro);
  }));
}

// ── Estilos visuales del ranking · v1.3 ──────────────────────
function inyectarEstilosRankingsV13() {
  if (document.getElementById("kg-rankings-v13-styles")) return;
  const style = document.createElement("style");
  style.id = "kg-rankings-v13-styles";
  style.textContent = `
    .kg-rank-meta{display:flex;align-items:center;gap:.42rem;flex-wrap:wrap;margin-top:.42rem;font-size:.68rem;color:var(--text-muted);font-weight:700}
    .kg-rank-meta>span{display:inline-flex;align-items:center;gap:.15rem;padding:.18rem .42rem;border-radius:999px;background:rgba(255,255,255,.72);border:1px solid var(--border)}
    .kg-rank-meta strong{color:var(--text-soft);font-weight:900}
    .kg-move{min-width:44px;justify-content:center!important;font-weight:900!important}
    .kg-move-up{color:#15803d!important;background:rgba(74,222,128,.13)!important;border-color:rgba(74,222,128,.35)!important}
    .kg-move-down{color:#be123c!important;background:rgba(244,114,182,.12)!important;border-color:rgba(244,114,182,.34)!important}
    .kg-move-new{color:#6d28d9!important;background:rgba(167,139,250,.14)!important;border-color:rgba(167,139,250,.38)!important;letter-spacing:.03em}
    .kg-move-same,.kg-move-none{color:var(--text-muted)!important}
    .rank-card.kg-top-1,.rank-card.kg-top-2,.rank-card.kg-top-3{position:relative;overflow:hidden;isolation:isolate}
    .rank-card.kg-top-1::before,.rank-card.kg-top-2::before,.rank-card.kg-top-3::before{content:"";position:absolute;inset:0;pointer-events:none;z-index:-1;opacity:.7}
    .rank-card.kg-top-1::before{background:radial-gradient(circle at 8% 50%,rgba(250,204,21,.20),transparent 36%)}
    .rank-card.kg-top-2::before{background:radial-gradient(circle at 8% 50%,rgba(34,211,238,.13),transparent 36%)}
    .rank-card.kg-top-3::before{background:radial-gradient(circle at 8% 50%,rgba(244,114,182,.13),transparent 36%)}
    .rank-card.kg-top-1{transform:translateY(-2px);box-shadow:0 10px 34px rgba(250,204,21,.14),var(--shadow-sm)}
    .rank-card.kg-top-1 .rank-pos{font-size:1.55rem}
    .rank-card.kg-top-1 .rank-img-wrap{transform:scale(1.06)}
    .rank-card.kg-top-1 .song-name{font-weight:900}
    .rank-card.kg-rank-clickable{cursor:pointer;transition:transform .2s var(--ease-out),box-shadow .2s var(--ease-out),border-color .2s}
    .rank-card.kg-rank-clickable:hover{transform:translateY(-2px);box-shadow:var(--shadow-md);border-color:rgba(244,114,182,.42)}
    .rank-card.kg-rank-clickable:focus-visible{outline:3px solid rgba(167,139,250,.45);outline-offset:3px}
    .rank-card.kg-rank-clickable.kg-top-1:hover{transform:translateY(-4px)}
    @media(max-width:640px){
      .kg-rank-meta{gap:.28rem}
      .kg-rank-meta>span{padding:.14rem .34rem}
      .rank-card.kg-top-1{transform:none}
    }
  `;
  document.head.appendChild(style);
}

// ── Buscadores de rankings · v1.2/v1.3 ───────────────────────
const KG_RANKING_SEARCH = {};

function crearBuscadorRanking(containerId, placeholder) {
  const container = document.getElementById(containerId);
  if (!container || document.querySelector(`[data-ranking-search="${containerId}"]`)) return;

  const tools = document.createElement("div");
  tools.className = "kg-ranking-tools";
  tools.dataset.rankingSearch = containerId;
  tools.innerHTML = `
    <input class="kg-ranking-search" type="search" autocomplete="off" placeholder="${escaparHTML(placeholder)}" aria-label="${escaparHTML(placeholder)}">
    <span class="kg-search-count"></span>`;
  container.parentNode.insertBefore(tools, container);

  const input = tools.querySelector("input");
  input.addEventListener("input", () => {
    KG_RANKING_SEARCH[containerId] = input.value.trim().toLowerCase();
    aplicarBusquedaRanking(containerId);
  });
  aplicarBusquedaRanking(containerId);
}

function aplicarBusquedaRanking(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const query = KG_RANKING_SEARCH[containerId] || "";
  const cards = [...container.querySelectorAll(".rank-card")];
  let visibles = 0;

  cards.forEach(card => {
    const texto = card.textContent.toLowerCase();
    const mostrar = !query || texto.includes(query);
    card.hidden = !mostrar;
    if (mostrar) visibles++;
  });

  const tools = document.querySelector(`[data-ranking-search="${containerId}"]`);
  const count = tools?.querySelector(".kg-search-count");
  if (count) count.textContent = query ? `${visibles} resultado${visibles === 1 ? "" : "s"}` : `${cards.length} elementos`;

  let empty = container.querySelector(".kg-no-results");
  if (query && cards.length && visibles === 0) {
    if (!empty) {
      empty = document.createElement("div");
      empty.className = "kg-no-results";
      container.appendChild(empty);
    }
    empty.textContent = `No encontramos coincidencias para “${query}”.`;
  } else {
    empty?.remove();
  }
}

function configurarBuscadoresRanking() {
  crearBuscadorRanking("ranking-list", "Buscar canción o artista...");
  crearBuscadorRanking("ranking-bsides-list", "Buscar B-Side o artista...");
  crearBuscadorRanking("ranking-albumes-list", "Buscar álbum o artista...");
  crearBuscadorRanking("ranking-artistas-list", "Buscar artista...");
}
