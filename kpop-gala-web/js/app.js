// ============================================================
//  KPOP GALA — APP.JS · v1.1
//  Lógica del ranking global
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  renderStats();
  renderRanking("all");
  configurarTabs();
  renderRankingArtistas("boy_group");
  configurarTabsArtistas();
  renderRankingAlbumes("all");
  configurarTabsAlbumes();
  renderRankingBsides("all");
  configurarTabsBsides();
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

function renderRanking(filtro) {
  const ranking = calcularRanking();
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
    const pos = idx + 1;
    const posClass = pos <= 3 ? `pos-${pos}` : "";
    const pct = ((item.puntajeTotal / maxPts) * 100).toFixed(1);
    const medal = pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : pos;
    const card = document.createElement("div");
    card.className = `rank-card ${posClass} fade-up`;
    card.style.animationDelay = `${Math.min(idx * 0.04, 0.4)}s`;
    card.innerHTML = `
      <div class="rank-pos">${medal}</div>
      <div class="rank-img-wrap">
        <img src="${item.cancion.img}" alt="${item.cancion.nombre}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
        <div class="rank-img-placeholder" style="display:none;">🎵</div>
      </div>
      <div class="rank-info"><div class="song-name">${item.cancion.nombre}</div><div class="song-artist">${item.cancion.artista}</div></div>
      <div class="rank-scores">
        <div class="rank-total">${item.puntajeTotal.toLocaleString()} <small>pts</small></div>
        <div class="rank-persona-scores"><span class="ps p1">P1 ${item.p1}</span><span class="ps p2">P2 ${item.p2}</span></div>
      </div>
      <div class="rank-bar-wrap"><div class="rank-bar" style="width:${pct}%"></div></div>`;
    container.appendChild(card);
  });
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
    const posClass = pos <= 3 ? `pos-${pos}` : "";
    const pct = ((item.puntajeTotal / maxPts) * 100).toFixed(1);
    const medal = pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : pos;
    const card = document.createElement("div");
    card.className = `rank-card ${posClass} fade-up`;
    card.style.animationDelay = `${Math.min(idx * 0.04, 0.4)}s`;
    card.innerHTML = `
      <div class="rank-pos">${medal}</div>
      <div class="rank-img-wrap">
        <img src="${item.artista.img}" alt="${item.artista.nombre}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
        <div class="rank-img-placeholder" style="display:none;background:linear-gradient(135deg,var(--amarillo-glow),#f9731633);">🎤</div>
      </div>
      <div class="rank-info"><div class="song-name">${item.artista.nombre}</div><div class="song-artist">${item.artista.categoria.replace('_', ' ').toUpperCase()}</div></div>
      <div class="rank-scores">
        <div class="rank-total">${item.puntajeTotal.toLocaleString()} <small>pts</small></div>
        <div class="rank-persona-scores"><span class="ps p1">P1 ${item.p1}</span><span class="ps p2">P2 ${item.p2}</span></div>
      </div>
      <div class="rank-bar-wrap"><div class="rank-bar" style="width:${pct}%;background:linear-gradient(90deg,var(--amarillo),#f59e0b);"></div></div>`;
    container.appendChild(card);
  });
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
  const container = document.getElementById("ranking-albumes-list");
  if (!container) return;
  container.innerHTML = "";
  const maxPts = Math.max(...ranking.map(r => r.puntajeTotal), 1);
  let lista = ranking;
  if (filtro === "con-puntos") lista = ranking.filter(r => r.puntajeTotal > 0);
  if (filtro === "sin-puntos") lista = ranking.filter(r => r.puntajeTotal === 0);
  if (!lista.length) { container.innerHTML = `<div class="empty-state"><h3>Sin registros</h3></div>`; return; }

  lista.forEach((item, idx) => {
    const pos = idx + 1;
    const posClass = pos <= 3 ? `pos-${pos}` : "";
    const pct = ((item.puntajeTotal / maxPts) * 100).toFixed(1);
    const medal = pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : pos;
    const card = document.createElement("div");
    card.className = `rank-card ${posClass} fade-up`;
    card.style.animationDelay = `${Math.min(idx * 0.04, 0.4)}s`;
    card.innerHTML = `
      <div class="rank-pos">${medal}</div>
      <div class="rank-img-wrap"><img src="${item.album.img}" alt="${item.album.nombre}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"><div class="rank-img-placeholder" style="display:none;background:linear-gradient(135deg,var(--violeta-glow),var(--rosa-glow));">💿</div></div>
      <div class="rank-info"><div class="song-name">${item.album.nombre}</div><div class="song-artist">${item.album.artista}</div></div>
      <div class="rank-scores"><div class="rank-total">${item.puntajeTotal.toLocaleString()} <small>pts</small></div><div class="rank-persona-scores"><span class="ps p1">P1 ${item.p1}</span><span class="ps p2">P2 ${item.p2}</span></div></div>
      <div class="rank-bar-wrap"><div class="rank-bar" style="width:${pct}%;background:linear-gradient(90deg,var(--violeta),var(--rosa));"></div></div>`;
    container.appendChild(card);
  });
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
  const container = document.getElementById("ranking-bsides-list");
  if (!container) return;
  container.innerHTML = "";
  const maxPts = Math.max(...ranking.map(r => r.puntajeTotal), 1);
  let lista = ranking;
  if (filtro === "con-puntos") lista = ranking.filter(r => r.puntajeTotal > 0);
  if (filtro === "sin-puntos") lista = ranking.filter(r => r.puntajeTotal === 0);
  if (!lista.length) { container.innerHTML = `<div class="empty-state"><h3>Sin registros</h3></div>`; return; }

  lista.forEach((item, idx) => {
    const pos = idx + 1;
    const posClass = pos <= 3 ? `pos-${pos}` : "";
    const pct = ((item.puntajeTotal / maxPts) * 100).toFixed(1);
    const medal = pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : pos;
    const card = document.createElement("div");
    card.className = `rank-card ${posClass} fade-up`;
    card.style.animationDelay = `${Math.min(idx * 0.04, 0.4)}s`;
    card.innerHTML = `
      <div class="rank-pos">${medal}</div>
      <div class="rank-img-wrap"><img src="${item.bside.img}" alt="${item.bside.nombre}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"><div class="rank-img-placeholder" style="display:none;background:linear-gradient(135deg,var(--verde-glow),#10b981);">🎧</div></div>
      <div class="rank-info"><div class="song-name">${item.bside.nombre}</div><div class="song-artist">${item.bside.artista}</div></div>
      <div class="rank-scores"><div class="rank-total">${item.puntajeTotal.toLocaleString()} <small>pts</small></div><div class="rank-persona-scores"><span class="ps p1">P1 ${item.p1}</span><span class="ps p2">P2 ${item.p2}</span></div></div>
      <div class="rank-bar-wrap"><div class="rank-bar" style="width:${pct}%;background:linear-gradient(90deg,#10b981,#34d399);"></div></div>`;
    container.appendChild(card);
  });
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
