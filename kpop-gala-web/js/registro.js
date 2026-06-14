// ============================================================
//  KPOP GALA — REGISTRO.JS
//  Lógica de Canciones, Álbumes, Artistas y B-Sides (Unificada con P1 y P2)
// ============================================================

let editandoCancionId = null, personaEditando = null;
let editandoAlbumId = null, personaEditandoAlbum = null;
let editandoArtistaId = null, personaEditandoArtista = null;
let editandoBsideId = null, personaEditandoBside = null;

document.addEventListener("DOMContentLoaded", () => {
  const semanaSelect = document.getElementById("semana-global");
  SEMANAS.forEach(s => { const opt = document.createElement("option"); opt.value = s.id; opt.textContent = s.label; semanaSelect.appendChild(opt); });
  if (SEMANAS.length) semanaSelect.value = SEMANAS[SEMANAS.length - 1].id;

  semanaSelect.addEventListener("change", () => {
    actualizarChipSemana();
    renderHistorial();
    renderHistorialAlbumes();
    renderHistorialArtistas();
    renderHistorialBsides();
  });
  actualizarChipSemana();

  // ── INICIALIZAR P1 Y P2 (CANCIONES, ÁLBUMES, ARTISTAS Y B-SIDES) ──
  ["p1", "p2"].forEach(pid => {
    // Poblar Canciones
    const selCancion = document.getElementById(`cancion-${pid}`);
    if (selCancion) CANCIONES.forEach(c => { const opt = document.createElement("option"); opt.value = c.id; opt.textContent = `${c.nombre} — ${c.artista}`; selCancion.appendChild(opt); });
    
    // Poblar Álbumes
    const selAlbum = document.getElementById(`album-${pid}`);
    if (selAlbum) ALBUMES.forEach(a => { const opt = document.createElement("option"); opt.value = a.id; opt.textContent = `${a.nombre} — ${a.artista}`; selAlbum.appendChild(opt); });

    // Poblar Artistas (Dinámico por categoría)
    const catSelect = document.getElementById(`categoria-artista-${pid}`);
    const artSelect = document.getElementById(`artista-${pid}`);
    const poblarArt = () => {
      if (!catSelect || !artSelect) return;
      artSelect.innerHTML = "";
      ARTISTAS.filter(a => a.categoria === catSelect.value).forEach(a => { const opt = document.createElement("option"); opt.value = a.id; opt.textContent = a.nombre; artSelect.appendChild(opt); });
    };
    if (catSelect && artSelect) { catSelect.addEventListener("change", poblarArt); poblarArt(); }

    // Poblar B-Sides
    const selBside = document.getElementById(`bside-${pid}`);
    if (selBside) BSIDES.forEach(b => { const opt = document.createElement("option"); opt.value = b.id; opt.textContent = `${b.nombre} — ${b.artista}`; selBside.appendChild(opt); });

    // Previews (Cálculo automático de puntos)
    ["cancion", "pos-spotify", "pos-instafest", "reproducciones"].forEach(c => {
      const el = document.getElementById(`${c}-${pid}`); if (el) el.addEventListener("input", () => actualizarPreview(pid));
    });
    ["album", "pos-spotify-album", "pos-instafest-album", "reproducciones-album"].forEach(c => {
      const el = document.getElementById(`${c}-${pid}`); if (el) el.addEventListener("input", () => actualizarPreviewAlbum(pid));
    });
    ["pos-spotify-artista", "pos-instafest-artista"].forEach(c => {
      const el = document.getElementById(`${c}-${pid}`); if (el) el.addEventListener("input", () => actualizarPreviewArtista(pid));
    });
    ["bside", "pos-spotify-bside", "pos-instafest-bside", "reproducciones-bside"].forEach(c => {
      const el = document.getElementById(`${c}-${pid}`); if (el) el.addEventListener("input", () => actualizarPreviewBside(pid));
    });

    // Submits
    const formC = document.getElementById(`form-${pid}`);
    if (formC) formC.addEventListener("submit", (e) => { e.preventDefault(); guardarEntrada(pid); });
    
    const formA = document.getElementById(`form-album-${pid}`);
    if (formA) formA.addEventListener("submit", (e) => { e.preventDefault(); guardarEntradaAlbum(pid); });

    const formArt = document.getElementById(`form-artista-${pid}`);
    if (formArt) formArt.addEventListener("submit", (e) => { e.preventDefault(); guardarEntradaArtista(pid); });

    const formBside = document.getElementById(`form-bside-${pid}`);
    if (formBside) formBside.addEventListener("submit", (e) => { e.preventDefault(); guardarEntradaBside(pid); });
  });

  renderHistorial();
  renderHistorialAlbumes();
  renderHistorialArtistas();
  renderHistorialBsides();
});

function actualizarChipSemana() {
  const s = SEMANAS.find(x => x.id === document.getElementById("semana-global").value);
  const chip = document.getElementById("semana-chip"); if (chip) chip.textContent = s ? s.label : "—";
}

// ── ACTUALIZAR PREVIEWS ──
function actualizarPreview(pid) {
  document.getElementById(`pts-preview-${pid}`).textContent = calcularPuntajeEntrada(
    parseInt(document.getElementById(`pos-spotify-${pid}`).value)||0, parseInt(document.getElementById(`pos-instafest-${pid}`).value)||0, parseInt(document.getElementById(`reproducciones-${pid}`).value)||0
  );
}
function actualizarPreviewAlbum(pid) {
  document.getElementById(`pts-preview-album-${pid}`).textContent = calcularPuntajeEntrada(
    parseInt(document.getElementById(`pos-spotify-album-${pid}`).value)||0, parseInt(document.getElementById(`pos-instafest-album-${pid}`).value)||0, parseInt(document.getElementById(`reproducciones-album-${pid}`).value)||0
  );
}
function actualizarPreviewArtista(pid) {
  document.getElementById(`pts-preview-artista-${pid}`).textContent = calcularPuntajeEntrada(
    parseInt(document.getElementById(`pos-spotify-artista-${pid}`).value)||0, parseInt(document.getElementById(`pos-instafest-artista-${pid}`).value)||0, 0
  );
}
function actualizarPreviewBside(pid) {
  const preview = document.getElementById(`pts-preview-bside-${pid}`);
  if (preview) {
    preview.textContent = calcularPuntajeEntrada(
      parseInt(document.getElementById(`pos-spotify-bside-${pid}`).value)||0, 
      parseInt(document.getElementById(`pos-instafest-bside-${pid}`).value)||0, 
      parseInt(document.getElementById(`reproducciones-bside-${pid}`).value)||0
    );
  }
}

// ── GUARDAR CANCIONES ──
function guardarEntrada(pid) {
  const semanaId = document.getElementById("semana-global").value;
  const cancionId = parseInt(document.getElementById(`cancion-${pid}`).value);
  const pS = parseInt(document.getElementById(`pos-spotify-${pid}`).value)||0, pI = parseInt(document.getElementById(`pos-instafest-${pid}`).value)||0, rep = parseInt(document.getElementById(`reproducciones-${pid}`).value)||0;
  if (!semanaId || !cancionId) return;

  const cancionActual = CANCIONES.find(c => c.id === cancionId);
  const registros = cargarRegistros();

  const chequearDups = (ignorarId) => {
    if (registros.find(r => r.semanaId === semanaId && r.personaId === pid && r.cancionId === cancionId && r.id !== ignorarId)) return `❌ Ya registraste esta canción.`;
    if (registros.find(r => r.semanaId === semanaId && r.personaId === pid && r.id !== ignorarId && CANCIONES.find(x => x.id === r.cancionId)?.artista === cancionActual.artista)) return `❌ Ya registraste una canción de ${cancionActual.artista}.`;
    return null;
  };

  if (editandoCancionId && personaEditando === pid) {
    const error = chequearDups(editandoCancionId); if (error) { mostrarToast(error, "error"); return; }
    const idx = registros.findIndex(r => r.id === editandoCancionId);
    if (idx !== -1) { registros[idx] = { ...registros[idx], cancionId, posSpotify: pS, posInstafest: pI, reproducciones: rep, puntaje: calcularPuntajeEntrada(pS, pI, rep) }; }
    guardarRegistros(registros); mostrarToast("✨ Canción actualizada", "success");
    editandoCancionId = null; document.querySelector(`#form-${pid} button[type="submit"]`).innerHTML = "✨ Guardar entrada";
  } else {
    const error = chequearDups(null); if (error) { mostrarToast(error, "error"); return; }
    registros.push({ id: `c_${Date.now()}`, semanaId, personaId: pid, cancionId, posSpotify: pS, posInstafest: pI, reproducciones: rep, puntaje: calcularPuntajeEntrada(pS, pI, rep), timestamp: Date.now() });
    guardarRegistros(registros); mostrarToast("✨ Canción guardada", "success");
  }
  document.getElementById(`form-${pid}`).reset(); actualizarPreview(pid); renderHistorial();
}

// ── GUARDAR ÁLBUMES ──
function guardarEntradaAlbum(pid) {
  const semanaId = document.getElementById("semana-global").value;
  const albumId = parseInt(document.getElementById(`album-${pid}`).value);
  const pS = parseInt(document.getElementById(`pos-spotify-album-${pid}`).value)||0, pI = parseInt(document.getElementById(`pos-instafest-album-${pid}`).value)||0, rep = parseInt(document.getElementById(`reproducciones-album-${pid}`).value)||0;
  if (!semanaId || !albumId) return;

  const albumActual = ALBUMES.find(a => a.id === albumId);
  const registros = cargarRegistrosAlbumes();

  const chequearDups = (ignorarId) => {
    if (registros.find(r => r.semanaId === semanaId && r.personaId === pid && r.albumId === albumId && r.id !== ignorarId)) return `❌ Ya registraste este álbum.`;
    if (registros.find(r => r.semanaId === semanaId && r.personaId === pid && r.id !== ignorarId && ALBUMES.find(x => x.id === r.albumId)?.artista === albumActual.artista)) return `❌ Ya registraste un álbum de ${albumActual.artista}.`;
    return null;
  };

  if (editandoAlbumId && personaEditandoAlbum === pid) {
    const error = chequearDups(editandoAlbumId); if (error) { mostrarToast(error, "error"); return; }
    const idx = registros.findIndex(r => r.id === editandoAlbumId);
    if (idx !== -1) { registros[idx] = { ...registros[idx], albumId, posSpotify: pS, posInstafest: pI, reproducciones: rep, puntaje: calcularPuntajeEntrada(pS, pI, rep) }; }
    guardarRegistrosAlbumes(registros); mostrarToast("💿 Álbum actualizado", "success");
    editandoAlbumId = null; document.querySelector(`#form-album-${pid} button[type="submit"]`).innerHTML = "💿 Guardar Álbum";
  } else {
    const error = chequearDups(null); if (error) { mostrarToast(error, "error"); return; }
    registros.push({ id: `a_${Date.now()}`, semanaId, personaId: pid, albumId, posSpotify: pS, posInstafest: pI, reproducciones: rep, puntaje: calcularPuntajeEntrada(pS, pI, rep), timestamp: Date.now() });
    guardarRegistrosAlbumes(registros); mostrarToast("💿 Álbum guardado", "success");
  }
  document.getElementById(`form-album-${pid}`).reset(); actualizarPreviewAlbum(pid); renderHistorialAlbumes();
}

// ── GUARDAR ARTISTAS ──
function guardarEntradaArtista(pid) {
  const semanaId = document.getElementById("semana-global").value;
  const artistaId = document.getElementById(`artista-${pid}`).value;
  const pS = parseInt(document.getElementById(`pos-spotify-artista-${pid}`).value)||0, pI = parseInt(document.getElementById(`pos-instafest-artista-${pid}`).value)||0;
  if (!semanaId || !artistaId) return;
  const registros = cargarRegistrosArtistas();

  const chequearDups = (ignorarId) => {
    if (registros.find(r => r.semanaId === semanaId && r.personaId === pid && r.artistaId === artistaId && r.id !== ignorarId)) return `❌ Ya registraste a este artista.`;
    return null;
  };

  if (editandoArtistaId && personaEditandoArtista === pid) {
    const error = chequearDups(editandoArtistaId); if (error) { mostrarToast(error, "error"); return; }
    const idx = registros.findIndex(r => r.id === editandoArtistaId);
    if (idx !== -1) { registros[idx] = { ...registros[idx], artistaId, posSpotify: pS, posInstafest: pI, puntaje: calcularPuntajeEntrada(pS, pI, 0) }; }
    guardarRegistrosArtistas(registros); mostrarToast("⭐ Artista actualizado", "success");
    editandoArtistaId = null; document.querySelector(`#form-artista-${pid} button[type="submit"]`).innerHTML = "⭐ Guardar Artista";
  } else {
    const error = chequearDups(null); if (error) { mostrarToast(error, "error"); return; }
    registros.push({ id: `art_${Date.now()}`, semanaId, personaId: pid, artistaId, posSpotify: pS, posInstafest: pI, puntaje: calcularPuntajeEntrada(pS, pI, 0), timestamp: Date.now() });
    guardarRegistrosArtistas(registros); mostrarToast("⭐ Artista guardado", "success");
  }
  document.getElementById(`form-artista-${pid}`).reset(); actualizarPreviewArtista(pid); renderHistorialArtistas();
}

// ── GUARDAR B-SIDES ──
function guardarEntradaBside(pid) {
  const semanaId = document.getElementById("semana-global").value;
  const bsideId = document.getElementById(`bside-${pid}`).value;
  const pS = parseInt(document.getElementById(`pos-spotify-bside-${pid}`).value)||0;
  const pI = parseInt(document.getElementById(`pos-instafest-bside-${pid}`).value)||0; 
  const rep = parseInt(document.getElementById(`reproducciones-bside-${pid}`).value)||0;
  
  if (!semanaId || !bsideId) return;

  const bsideActual = BSIDES.find(b => b.id === bsideId);
  const registros = cargarRegistrosBsides();

  const chequearDups = (ignorarId) => {
    if (registros.find(r => r.semanaId === semanaId && r.personaId === pid && r.bsideId === bsideId && r.id !== ignorarId)) return `❌ Ya registraste este B-Side.`;
    if (registros.find(r => r.semanaId === semanaId && r.personaId === pid && r.id !== ignorarId && BSIDES.find(x => x.id === r.bsideId)?.artista === bsideActual.artista)) return `❌ Ya registraste un B-Side de ${bsideActual.artista}.`;
    return null;
  };

  if (editandoBsideId && personaEditandoBside === pid) {
    const error = chequearDups(editandoBsideId); if (error) { mostrarToast(error, "error"); return; }
    const idx = registros.findIndex(r => r.id === editandoBsideId);
    if (idx !== -1) { registros[idx] = { ...registros[idx], bsideId, posSpotify: pS, posInstafest: pI, reproducciones: rep, puntaje: calcularPuntajeEntrada(pS, pI, rep) }; }
    guardarRegistrosBsides(registros); mostrarToast("🎧 B-Side actualizado", "success");
    editandoBsideId = null; document.querySelector(`#form-bside-${pid} button[type="submit"]`).innerHTML = "🎧 Guardar B-Side";
  } else {
    const error = chequearDups(null); if (error) { mostrarToast(error, "error"); return; }
    registros.push({ id: `bs_${Date.now()}`, semanaId, personaId: pid, bsideId, posSpotify: pS, posInstafest: pI, reproducciones: rep, puntaje: calcularPuntajeEntrada(pS, pI, rep), timestamp: Date.now() });
    guardarRegistrosBsides(registros); mostrarToast("🎧 B-Side guardado", "success");
  }
  document.getElementById(`form-bside-${pid}`).reset(); actualizarPreviewBside(pid); renderHistorialBsides();
}

// ── CARGAR EDICIONES ──
function cargarEdicion(id) {
  const r = cargarRegistros().find(x => x.id === id); if (!r) return;
  editandoCancionId = id; personaEditando = r.personaId;
  document.getElementById(`cancion-${r.personaId}`).value = r.cancionId;
  document.getElementById(`pos-spotify-${r.personaId}`).value = r.posSpotify || 0;
  document.getElementById(`pos-instafest-${r.personaId}`).value = r.posInstafest || 0;
  document.getElementById(`reproducciones-${r.personaId}`).value = r.reproducciones || 0;
  actualizarPreview(r.personaId); document.querySelector(`#form-${r.personaId} button[type="submit"]`).innerHTML = "✏️ Actualizar"; window.scrollTo({ top: 0, behavior: 'smooth' });
}
function cargarEdicionAlbum(id) {
  const r = cargarRegistrosAlbumes().find(x => x.id === id); if (!r) return;
  editandoAlbumId = id; personaEditandoAlbum = r.personaId;
  document.getElementById(`album-${r.personaId}`).value = r.albumId;
  document.getElementById(`pos-spotify-album-${r.personaId}`).value = r.posSpotify || 0;
  document.getElementById(`pos-instafest-album-${r.personaId}`).value = r.posInstafest || 0;
  document.getElementById(`reproducciones-album-${r.personaId}`).value = r.reproducciones || 0;
  actualizarPreviewAlbum(r.personaId); document.querySelector(`#form-album-${r.personaId} button[type="submit"]`).innerHTML = "✏️ Actualizar"; window.scrollTo({ top: 0, behavior: 'smooth' });
}
function cargarEdicionArtista(id) {
  const r = cargarRegistrosArtistas().find(x => x.id === id); if (!r) return;
  editandoArtistaId = id; personaEditandoArtista = r.personaId || "p1";
  const a = ARTISTAS.find(x => x.id === r.artistaId);
  if (a) { document.getElementById(`categoria-artista-${personaEditandoArtista}`).value = a.categoria; document.getElementById(`categoria-artista-${personaEditandoArtista}`).dispatchEvent(new Event("change")); document.getElementById(`artista-${personaEditandoArtista}`).value = r.artistaId; }
  document.getElementById(`pos-spotify-artista-${personaEditandoArtista}`).value = r.posSpotify || 0; 
  document.getElementById(`pos-instafest-artista-${personaEditandoArtista}`).value = r.posInstafest || 0; 
  actualizarPreviewArtista(personaEditandoArtista); 
  document.querySelector(`#form-artista-${personaEditandoArtista} button[type='submit']`).innerHTML = "✏️ Actualizar"; window.scrollTo({ top: 0, behavior: 'smooth' });
}
function cargarEdicionBside(id) {
  const r = cargarRegistrosBsides().find(x => x.id === id); if (!r) return;
  editandoBsideId = id; personaEditandoBside = r.personaId;
  document.getElementById(`bside-${r.personaId}`).value = r.bsideId;
  document.getElementById(`pos-spotify-bside-${r.personaId}`).value = r.posSpotify || 0;
  document.getElementById(`pos-instafest-bside-${r.personaId}`).value = r.posInstafest || 0;
  document.getElementById(`reproducciones-bside-${r.personaId}`).value = r.reproducciones || 0;
  actualizarPreviewBside(r.personaId); document.querySelector(`#form-bside-${r.personaId} button[type="submit"]`).innerHTML = "✏️ Actualizar"; window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── RENDERIZAR HISTORIALES ──
function renderHistorial() {
  const registros = cargarRegistros().filter(r => r.semanaId === document.getElementById("semana-global").value).sort((a,b) => b.puntaje - a.puntaje);
  const container = document.getElementById("historial-list"); if (!container) return;
  container.innerHTML = registros.length ? "" : "<p style='text-align:center;color:var(--text-muted);font-size:0.85rem;'>Vacío</p>";
  registros.forEach(r => {
    const c = CANCIONES.find(x => x.id === r.cancionId); if (!c) return;
    const div = document.createElement("div"); div.className = `historial-item ${r.personaId === "p2" ? "p2-item" : ""}`;
    div.innerHTML = `<div style="font-size:0.75rem; color:var(--text-muted);">🟢${r.posSpotify||0}<br>🎪${r.posInstafest||0}</div><span class="${r.personaId==="p2"?"badge-p2":"badge-p1"}">${r.personaId.toUpperCase()}</span><span class="hi-name">${c.nombre}<br><span style="font-size:0.7rem;color:var(--text-muted);">${c.artista}</span></span><span class="hi-rep">▶ ${r.reproducciones||0}x</span><span class="hi-pts">+${r.puntaje} pts</span><div class="historial-actions"><button class="btn-edit" onclick="cargarEdicion('${r.id}')">✏️</button><button class="btn-delete" onclick="eliminarRegistro('${r.id}')">✕</button></div>`;
    container.appendChild(div);
  });
}
function renderHistorialAlbumes() {
  const registros = cargarRegistrosAlbumes().filter(r => r.semanaId === document.getElementById("semana-global").value).sort((a,b) => b.puntaje - a.puntaje);
  const container = document.getElementById("historial-albumes-list"); if (!container) return;
  container.innerHTML = registros.length ? "" : "<p style='text-align:center;color:var(--text-muted);font-size:0.85rem;'>Vacío</p>";
  registros.forEach(r => {
    const a = ALBUMES.find(x => x.id === r.albumId); if (!a) return;
    const div = document.createElement("div"); div.className = `historial-item ${r.personaId === "p2" ? "p2-item" : ""}`;
    div.innerHTML = `<div style="font-size:0.75rem; color:var(--text-muted);">🟢${r.posSpotify||0}<br>🎪${r.posInstafest||0}</div><span class="${r.personaId==="p2"?"badge-p2":"badge-p1"}">${r.personaId.toUpperCase()}</span><span class="hi-name">💿 ${a.nombre}<br><span style="font-size:0.7rem;color:var(--text-muted);">${a.artista}</span></span><span class="hi-rep">▶ ${r.reproducciones||0}x</span><span class="hi-pts">+${r.puntaje} pts</span><div class="historial-actions"><button class="btn-edit" onclick="cargarEdicionAlbum('${r.id}')">✏️</button><button class="btn-delete" onclick="eliminarRegistroAlbum('${r.id}')">✕</button></div>`;
    container.appendChild(div);
  });
}
function renderHistorialArtistas() {
  const registros = cargarRegistrosArtistas().filter(r => r.semanaId === document.getElementById("semana-global").value).sort((a,b) => b.puntaje - a.puntaje);
  const container = document.getElementById("historial-artistas-list"); if (!container) return;
  container.innerHTML = registros.length ? "" : "<p style='text-align:center;color:var(--text-muted);font-size:0.85rem;'>Vacío</p>";
  registros.forEach(r => {
    const a = ARTISTAS.find(x => x.id === r.artistaId); if (!a) return;
    const personaId = r.personaId || "p1"; // Compatibilidad con viejos
    const div = document.createElement("div"); div.className = `historial-item ${personaId === "p2" ? "p2-item" : ""}`;
    div.innerHTML = `<div style="font-size:0.75rem; color:var(--text-muted);">🟢${r.posSpotify||0}<br>🎪${r.posInstafest||0}</div><span class="${personaId==="p2"?"badge-p2":"badge-p1"}">${personaId.toUpperCase()}</span><span class="hi-name">${a.nombre}<br><span style="font-size:0.7rem;color:var(--text-muted);">${a.categoria.replace('_', ' ').toUpperCase()}</span></span><span class="hi-pts">+${r.puntaje} pts</span><div class="historial-actions"><button class="btn-edit" onclick="cargarEdicionArtista('${r.id}')">✏️</button><button class="btn-delete" onclick="eliminarRegistroArtista('${r.id}')">✕</button></div>`;
    container.appendChild(div);
  });
}
function renderHistorialBsides() {
  const registros = cargarRegistrosBsides().filter(r => r.semanaId === document.getElementById("semana-global").value).sort((a,b) => b.puntaje - a.puntaje);
  const container = document.getElementById("historial-bsides-list"); if (!container) return;
  container.innerHTML = registros.length ? "" : "<p style='text-align:center;color:var(--text-muted);font-size:0.85rem;'>Vacío</p>";
  registros.forEach(r => {
    const b = BSIDES.find(x => x.id === r.bsideId); if (!b) return;
    const div = document.createElement("div"); div.className = `historial-item ${r.personaId === "p2" ? "p2-item" : ""}`;
    div.innerHTML = `<div style="font-size:0.75rem; color:var(--text-muted);">🟢${r.posSpotify||0}<br>🎪${r.posInstafest||0}</div><span class="${r.personaId==="p2"?"badge-p2":"badge-p1"}">${r.personaId.toUpperCase()}</span><span class="hi-name">🎧 ${b.nombre}<br><span style="font-size:0.7rem;color:var(--text-muted);">${b.artista}</span></span><span class="hi-rep">▶ ${r.reproducciones||0}x</span><span class="hi-pts">+${r.puntaje} pts</span><div class="historial-actions"><button class="btn-edit" onclick="cargarEdicionBside('${r.id}')">✏️</button><button class="btn-delete" onclick="eliminarRegistroBside('${r.id}')">✕</button></div>`;
    container.appendChild(div);
  });
}

// ── ELIMINAR ──
function eliminarRegistro(id) { if(confirm("¿Eliminar?")) { guardarRegistros(cargarRegistros().filter(r => r.id !== id)); renderHistorial(); } }
function eliminarRegistroAlbum(id) { if(confirm("¿Eliminar álbum?")) { guardarRegistrosAlbumes(cargarRegistrosAlbumes().filter(r => r.id !== id)); renderHistorialAlbumes(); } }
function eliminarRegistroArtista(id) { if(confirm("¿Eliminar artista?")) { guardarRegistrosArtistas(cargarRegistrosArtistas().filter(r => r.id !== id)); renderHistorialArtistas(); } }
function eliminarRegistroBside(id) { if(confirm("¿Eliminar B-Side?")) { guardarRegistrosBsides(cargarRegistrosBsides().filter(r => r.id !== id)); renderHistorialBsides(); } }

function mostrarToast(msg, tipo = "success") {
  const container = document.getElementById("toast-container"); if (!container) return;
  const toast = document.createElement("div"); toast.className = `toast ${tipo}`; toast.innerHTML = `<span>${tipo === "success" ? "✅" : "⚠️"}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = "0"; toast.style.transform = "translateY(20px)"; setTimeout(() => toast.remove(), 300); }, 4000);
}