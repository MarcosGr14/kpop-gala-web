// ============================================================
//  KPOP GALA — REGISTRO.JS · v2.0 Seasons
//  Canciones, Álbumes, Artistas y B-Sides · P1/P2
// ============================================================

let editandoCancionId = null, personaEditando = null;
let editandoAlbumId = null, personaEditandoAlbum = null;
let editandoArtistaId = null, personaEditandoArtista = null;
let editandoBsideId = null, personaEditandoBside = null;

document.addEventListener("DOMContentLoaded", () => {
  const semanaSelect = document.getElementById("semana-global");
  SEMANAS.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.label;
    semanaSelect.appendChild(opt);
  });

  // Abre en la semana actual; fuera de temporada usa la más útil.
  const semanaInicial = obtenerSemanaRecomendada();
  if (semanaInicial) semanaSelect.value = semanaInicial.id;

  semanaSelect.addEventListener("change", () => {
    actualizarChipSemana();
    renderHistorial();
    renderHistorialAlbumes();
    renderHistorialArtistas();
    renderHistorialBsides();
  });
  actualizarChipSemana();

  ["p1", "p2"].forEach(pid => {
    const selCancion = document.getElementById(`cancion-${pid}`);
    if (selCancion) CANCIONES.filter(c => !c.archivado).forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = `${c.nombre} — ${c.artista}`;
      selCancion.appendChild(opt);
    });

    const selAlbum = document.getElementById(`album-${pid}`);
    if (selAlbum) ALBUMES.filter(a => !a.archivado).forEach(a => {
      const opt = document.createElement("option");
      opt.value = a.id;
      opt.textContent = `${a.nombre} — ${a.artista}`;
      selAlbum.appendChild(opt);
    });

    const catSelect = document.getElementById(`categoria-artista-${pid}`);
    const artSelect = document.getElementById(`artista-${pid}`);
    const poblarArt = () => {
      if (!catSelect || !artSelect) return;
      artSelect.innerHTML = "";
      ARTISTAS.filter(a => a.categoria === catSelect.value && !a.archivado).forEach(a => {
        const opt = document.createElement("option");
        opt.value = a.id;
        opt.textContent = a.nombre;
        artSelect.appendChild(opt);
      });
      artSelect.dispatchEvent(new CustomEvent("kg-options-changed"));
    };
    if (catSelect && artSelect) {
      catSelect.addEventListener("change", poblarArt);
      poblarArt();
    }

    const selBside = document.getElementById(`bside-${pid}`);
    if (selBside) BSIDES.filter(b => !b.archivado).forEach(b => {
      const opt = document.createElement("option");
      opt.value = b.id;
      opt.textContent = `${b.nombre} — ${b.artista}`;
      selBside.appendChild(opt);
    });

    ["cancion", "pos-spotify", "pos-instafest", "reproducciones"].forEach(c => {
      const el = document.getElementById(`${c}-${pid}`);
      if (el) el.addEventListener("input", () => actualizarPreview(pid));
    });
    ["album", "pos-spotify-album", "pos-instafest-album", "reproducciones-album"].forEach(c => {
      const el = document.getElementById(`${c}-${pid}`);
      if (el) el.addEventListener("input", () => actualizarPreviewAlbum(pid));
    });
    // Las reproducciones de artista también actualizan el preview.
    ["pos-spotify-artista", "pos-instafest-artista", "reproducciones-artista"].forEach(c => {
      const el = document.getElementById(`${c}-${pid}`);
      if (el) el.addEventListener("input", () => actualizarPreviewArtista(pid));
    });
    ["bside", "pos-spotify-bside", "pos-instafest-bside", "reproducciones-bside"].forEach(c => {
      const el = document.getElementById(`${c}-${pid}`);
      if (el) el.addEventListener("input", () => actualizarPreviewBside(pid));
    });

    const formC = document.getElementById(`form-${pid}`);
    if (formC) formC.addEventListener("submit", e => { e.preventDefault(); guardarEntrada(pid); });
    const formA = document.getElementById(`form-album-${pid}`);
    if (formA) formA.addEventListener("submit", e => { e.preventDefault(); guardarEntradaAlbum(pid); });
    const formArt = document.getElementById(`form-artista-${pid}`);
    if (formArt) formArt.addEventListener("submit", e => { e.preventDefault(); guardarEntradaArtista(pid); });
    const formBside = document.getElementById(`form-bside-${pid}`);
    if (formBside) formBside.addEventListener("submit", e => { e.preventDefault(); guardarEntradaBside(pid); });
  });

  renderHistorial();
  renderHistorialAlbumes();
  renderHistorialArtistas();
  renderHistorialBsides();
  configurarBusquedasRegistro();
  aplicarConfiguracionUI();
  aplicarBloqueoTemporadaCerrada();
});

function aplicarBloqueoTemporadaCerrada() {
  if (!temporadaEstaCerrada()) return;
  document.querySelectorAll("form input, form select, form button[type='submit']").forEach(el => el.disabled = true);
  const selector = document.getElementById("semana-global");
  if (selector) selector.disabled = false;
  const aviso = document.createElement("div");
  aviso.className = "card";
  aviso.style.cssText = "margin:0 0 1rem;padding:.85rem 1rem;border-color:rgba(167,139,250,.4);background:rgba(167,139,250,.08);color:var(--text-soft);font-weight:700;";
  aviso.innerHTML = `🔒 <strong>${escaparHTML(obtenerTemporadaActiva().nombre)}</strong> está cerrada. Puedes consultar y editar tu catálogo, pero no añadir ni modificar registros semanales.`;
  document.querySelector(".semana-selector")?.insertAdjacentElement("beforebegin", aviso);
}

function num(id) {
  return parseInt(document.getElementById(id)?.value, 10) || 0;
}

function actualizarChipSemana() {
  const s = SEMANAS.find(x => x.id === document.getElementById("semana-global").value);
  const chip = document.getElementById("semana-chip");
  if (chip) chip.textContent = s ? s.label : "—";
}

function actualizarPreview(pid) {
  document.getElementById(`pts-preview-${pid}`).textContent = calcularPuntajeEntrada(
    num(`pos-spotify-${pid}`), num(`pos-instafest-${pid}`), num(`reproducciones-${pid}`)
  );
}
function actualizarPreviewAlbum(pid) {
  document.getElementById(`pts-preview-album-${pid}`).textContent = calcularPuntajeEntrada(
    num(`pos-spotify-album-${pid}`), num(`pos-instafest-album-${pid}`), num(`reproducciones-album-${pid}`)
  );
}
function actualizarPreviewArtista(pid) {
  const preview = document.getElementById(`pts-preview-artista-${pid}`);
  if (!preview) return;
  preview.textContent = calcularPuntajeEntrada(
    num(`pos-spotify-artista-${pid}`), num(`pos-instafest-artista-${pid}`), num(`reproducciones-artista-${pid}`)
  );
}
function actualizarPreviewBside(pid) {
  const preview = document.getElementById(`pts-preview-bside-${pid}`);
  if (!preview) return;
  preview.textContent = calcularPuntajeEntrada(
    num(`pos-spotify-bside-${pid}`), num(`pos-instafest-bside-${pid}`), num(`reproducciones-bside-${pid}`)
  );
}

function guardarEntrada(pid) {
  const semanaId = document.getElementById("semana-global").value;
  const cancionId = parseInt(document.getElementById(`cancion-${pid}`).value, 10);
  const pS = num(`pos-spotify-${pid}`), pI = num(`pos-instafest-${pid}`), rep = num(`reproducciones-${pid}`);
  if (!semanaId || !cancionId) return;

  if (temporadaEstaCerrada()) return mostrarToast("🔒 Esta temporada está cerrada.", "error");
  const temporadaId = obtenerTemporadaActivaId();
  const cancionActual = CANCIONES.find(c => c.id === cancionId);
  const registros = cargarRegistros();
  const registrosTemporada = filtrarRegistrosTemporada(registros, temporadaId);
  const chequearDups = ignorarId => {
    if (registrosTemporada.find(r => r.semanaId === semanaId && r.personaId === pid && r.cancionId === cancionId && r.id !== ignorarId)) return "❌ Ya registraste esta canción.";
    if (registrosTemporada.find(r => r.semanaId === semanaId && r.personaId === pid && r.id !== ignorarId && CANCIONES.find(x => x.id === r.cancionId)?.artista === cancionActual.artista)) return `❌ Ya registraste una canción de ${cancionActual.artista}.`;
    return null;
  };

  if (editandoCancionId && personaEditando === pid) {
    const error = chequearDups(editandoCancionId); if (error) return mostrarToast(error, "error");
    const idx = registros.findIndex(r => r.id === editandoCancionId);
    if (idx !== -1) registros[idx] = { ...registros[idx], cancionId, posSpotify: pS, posInstafest: pI, reproducciones: rep, puntaje: calcularPuntajeEntrada(pS, pI, rep) };
    guardarRegistros(registros);
    mostrarToast("✨ Canción actualizada", "success");
    editandoCancionId = null; personaEditando = null;
    document.querySelector(`#form-${pid} button[type="submit"]`).innerHTML = "✨ Guardar entrada";
  } else {
    const error = chequearDups(null); if (error) return mostrarToast(error, "error");
    registros.push({ id: `c_${Date.now()}`, seasonId: temporadaId, semanaId, personaId: pid, cancionId, posSpotify: pS, posInstafest: pI, reproducciones: rep, puntaje: calcularPuntajeEntrada(pS, pI, rep), timestamp: Date.now() });
    guardarRegistros(registros);
    mostrarToast("✨ Canción guardada", "success");
  }
  document.getElementById(`form-${pid}`).reset();
  actualizarPreview(pid);
  renderHistorial();
}

function guardarEntradaAlbum(pid) {
  const semanaId = document.getElementById("semana-global").value;
  const albumId = parseInt(document.getElementById(`album-${pid}`).value, 10);
  const pS = num(`pos-spotify-album-${pid}`), pI = num(`pos-instafest-album-${pid}`), rep = num(`reproducciones-album-${pid}`);
  if (!semanaId || !albumId) return;

  if (temporadaEstaCerrada()) return mostrarToast("🔒 Esta temporada está cerrada.", "error");
  const temporadaId = obtenerTemporadaActivaId();
  const albumActual = ALBUMES.find(a => a.id === albumId);
  const registros = cargarRegistrosAlbumes();
  const registrosTemporada = filtrarRegistrosTemporada(registros, temporadaId);
  const chequearDups = ignorarId => {
    if (registrosTemporada.find(r => r.semanaId === semanaId && r.personaId === pid && r.albumId === albumId && r.id !== ignorarId)) return "❌ Ya registraste este álbum.";
    if (registrosTemporada.find(r => r.semanaId === semanaId && r.personaId === pid && r.id !== ignorarId && ALBUMES.find(x => x.id === r.albumId)?.artista === albumActual.artista)) return `❌ Ya registraste un álbum de ${albumActual.artista}.`;
    return null;
  };

  if (editandoAlbumId && personaEditandoAlbum === pid) {
    const error = chequearDups(editandoAlbumId); if (error) return mostrarToast(error, "error");
    const idx = registros.findIndex(r => r.id === editandoAlbumId);
    if (idx !== -1) registros[idx] = { ...registros[idx], albumId, posSpotify: pS, posInstafest: pI, reproducciones: rep, puntaje: calcularPuntajeEntrada(pS, pI, rep) };
    guardarRegistrosAlbumes(registros);
    mostrarToast("💿 Álbum actualizado", "success");
    editandoAlbumId = null; personaEditandoAlbum = null;
    document.querySelector(`#form-album-${pid} button[type="submit"]`).innerHTML = "💿 Guardar Álbum";
  } else {
    const error = chequearDups(null); if (error) return mostrarToast(error, "error");
    registros.push({ id: `a_${Date.now()}`, seasonId: temporadaId, semanaId, personaId: pid, albumId, posSpotify: pS, posInstafest: pI, reproducciones: rep, puntaje: calcularPuntajeEntrada(pS, pI, rep), timestamp: Date.now() });
    guardarRegistrosAlbumes(registros);
    mostrarToast("💿 Álbum guardado", "success");
  }
  document.getElementById(`form-album-${pid}`).reset();
  actualizarPreviewAlbum(pid);
  renderHistorialAlbumes();
}

function guardarEntradaArtista(pid) {
  const semanaId = document.getElementById("semana-global").value;
  const artistaId = document.getElementById(`artista-${pid}`).value;
  const pS = num(`pos-spotify-artista-${pid}`), pI = num(`pos-instafest-artista-${pid}`), rep = num(`reproducciones-artista-${pid}`);
  if (!semanaId || !artistaId) return;

  if (temporadaEstaCerrada()) return mostrarToast("🔒 Esta temporada está cerrada.", "error");
  const temporadaId = obtenerTemporadaActivaId();
  const registros = cargarRegistrosArtistas();
  const registrosTemporada = filtrarRegistrosTemporada(registros, temporadaId);
  const chequearDups = ignorarId => registrosTemporada.find(r => r.semanaId === semanaId && r.personaId === pid && r.artistaId === artistaId && r.id !== ignorarId)
    ? "❌ Ya registraste a este artista." : null;

  if (editandoArtistaId && personaEditandoArtista === pid) {
    const error = chequearDups(editandoArtistaId); if (error) return mostrarToast(error, "error");
    const idx = registros.findIndex(r => r.id === editandoArtistaId);
    if (idx !== -1) registros[idx] = { ...registros[idx], artistaId, posSpotify: pS, posInstafest: pI, reproducciones: rep, puntaje: calcularPuntajeEntrada(pS, pI, rep) };
    guardarRegistrosArtistas(registros);
    mostrarToast("⭐ Artista actualizado", "success");
    editandoArtistaId = null; personaEditandoArtista = null;
    document.querySelector(`#form-artista-${pid} button[type="submit"]`).innerHTML = "⭐ Guardar Artista";
  } else {
    const error = chequearDups(null); if (error) return mostrarToast(error, "error");
    registros.push({ id: `art_${Date.now()}`, seasonId: temporadaId, semanaId, personaId: pid, artistaId, posSpotify: pS, posInstafest: pI, reproducciones: rep, puntaje: calcularPuntajeEntrada(pS, pI, rep), timestamp: Date.now() });
    guardarRegistrosArtistas(registros);
    mostrarToast("⭐ Artista guardado", "success");
  }
  document.getElementById(`form-artista-${pid}`).reset();
  actualizarPreviewArtista(pid);
  renderHistorialArtistas();
}

function guardarEntradaBside(pid) {
  const semanaId = document.getElementById("semana-global").value;
  const bsideId = document.getElementById(`bside-${pid}`).value;
  const pS = num(`pos-spotify-bside-${pid}`), pI = num(`pos-instafest-bside-${pid}`), rep = num(`reproducciones-bside-${pid}`);
  if (!semanaId || !bsideId) return;

  if (temporadaEstaCerrada()) return mostrarToast("🔒 Esta temporada está cerrada.", "error");
  const temporadaId = obtenerTemporadaActivaId();
  const registros = cargarRegistrosBsides();
  const registrosTemporada = filtrarRegistrosTemporada(registros, temporadaId);
  const chequearDups = ignorarId => registrosTemporada.find(r => r.semanaId === semanaId && r.personaId === pid && r.bsideId === bsideId && r.id !== ignorarId)
    ? "❌ Ya registraste este B-Side." : null;

  if (editandoBsideId && personaEditandoBside === pid) {
    const error = chequearDups(editandoBsideId); if (error) return mostrarToast(error, "error");
    const idx = registros.findIndex(r => r.id === editandoBsideId);
    if (idx !== -1) registros[idx] = { ...registros[idx], bsideId, posSpotify: pS, posInstafest: pI, reproducciones: rep, puntaje: calcularPuntajeEntrada(pS, pI, rep) };
    guardarRegistrosBsides(registros);
    mostrarToast("🎧 B-Side actualizado", "success");
    editandoBsideId = null; personaEditandoBside = null;
    document.querySelector(`#form-bside-${pid} button[type="submit"]`).innerHTML = "🎧 Guardar B-Side";
  } else {
    const error = chequearDups(null); if (error) return mostrarToast(error, "error");
    registros.push({ id: `bs_${Date.now()}`, seasonId: temporadaId, semanaId, personaId: pid, bsideId, posSpotify: pS, posInstafest: pI, reproducciones: rep, puntaje: calcularPuntajeEntrada(pS, pI, rep), timestamp: Date.now() });
    guardarRegistrosBsides(registros);
    mostrarToast("🎧 B-Side guardado", "success");
  }
  document.getElementById(`form-bside-${pid}`).reset();
  actualizarPreviewBside(pid);
  renderHistorialBsides();
}


function asegurarOpcionSeleccionable(select, value, label) {
  if (!select || value === undefined || value === null) return;
  const existe = [...select.options].some(o => String(o.value) === String(value));
  if (!existe) {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = `${label} · archivado`;
    select.appendChild(opt);
  }
}

function cargarEdicion(id) {
  if (temporadaEstaCerrada()) return mostrarToast("🔒 Esta temporada está cerrada.", "error");
  const r = cargarRegistros().find(x => x.id === id); if (!r) return;
  editandoCancionId = id; personaEditando = r.personaId;
  const item = cancionPorId(r.cancionId);
  asegurarOpcionSeleccionable(document.getElementById(`cancion-${r.personaId}`), r.cancionId, item ? `${item.nombre} — ${item.artista}` : "Canción");
  document.getElementById(`cancion-${r.personaId}`).value = r.cancionId;
  document.getElementById(`pos-spotify-${r.personaId}`).value = r.posSpotify ?? r.posicion ?? 0;
  document.getElementById(`pos-instafest-${r.personaId}`).value = r.posInstafest ?? 0;
  document.getElementById(`reproducciones-${r.personaId}`).value = r.reproducciones ?? 0;
  actualizarPreview(r.personaId);
  document.querySelector(`#form-${r.personaId} button[type="submit"]`).innerHTML = "✏️ Actualizar";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function cargarEdicionAlbum(id) {
  if (temporadaEstaCerrada()) return mostrarToast("🔒 Esta temporada está cerrada.", "error");
  const r = cargarRegistrosAlbumes().find(x => x.id === id); if (!r) return;
  editandoAlbumId = id; personaEditandoAlbum = r.personaId;
  const item = albumPorId(r.albumId);
  asegurarOpcionSeleccionable(document.getElementById(`album-${r.personaId}`), r.albumId, item ? `${item.nombre} — ${item.artista}` : "Álbum");
  document.getElementById(`album-${r.personaId}`).value = r.albumId;
  document.getElementById(`pos-spotify-album-${r.personaId}`).value = r.posSpotify ?? 0;
  document.getElementById(`pos-instafest-album-${r.personaId}`).value = r.posInstafest ?? 0;
  document.getElementById(`reproducciones-album-${r.personaId}`).value = r.reproducciones ?? 0;
  actualizarPreviewAlbum(r.personaId);
  document.querySelector(`#form-album-${r.personaId} button[type="submit"]`).innerHTML = "✏️ Actualizar";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function cargarEdicionArtista(id) {
  if (temporadaEstaCerrada()) return mostrarToast("🔒 Esta temporada está cerrada.", "error");
  const r = cargarRegistrosArtistas().find(x => x.id === id); if (!r) return;
  editandoArtistaId = id; personaEditandoArtista = r.personaId || "p1";
  const a = ARTISTAS.find(x => x.id === r.artistaId);
  if (a) {
    document.getElementById(`categoria-artista-${personaEditandoArtista}`).value = a.categoria;
    document.getElementById(`categoria-artista-${personaEditandoArtista}`).dispatchEvent(new Event("change"));
    asegurarOpcionSeleccionable(document.getElementById(`artista-${personaEditandoArtista}`), r.artistaId, a.nombre);
    document.getElementById(`artista-${personaEditandoArtista}`).value = r.artistaId;
  }
  document.getElementById(`pos-spotify-artista-${personaEditandoArtista}`).value = r.posSpotify ?? 0;
  document.getElementById(`pos-instafest-artista-${personaEditandoArtista}`).value = r.posInstafest ?? 0;
  const repInput = document.getElementById(`reproducciones-artista-${personaEditandoArtista}`);
  if (repInput) repInput.value = r.reproducciones ?? 0;
  actualizarPreviewArtista(personaEditandoArtista);
  document.querySelector(`#form-artista-${personaEditandoArtista} button[type='submit']`).innerHTML = "✏️ Actualizar";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function cargarEdicionBside(id) {
  if (temporadaEstaCerrada()) return mostrarToast("🔒 Esta temporada está cerrada.", "error");
  const r = cargarRegistrosBsides().find(x => x.id === id); if (!r) return;
  editandoBsideId = id; personaEditandoBside = r.personaId;
  const item = BSIDES.find(x => String(x.id) === String(r.bsideId));
  asegurarOpcionSeleccionable(document.getElementById(`bside-${r.personaId}`), r.bsideId, item ? `${item.nombre} — ${item.artista}` : "B-Side");
  document.getElementById(`bside-${r.personaId}`).value = r.bsideId;
  document.getElementById(`pos-spotify-bside-${r.personaId}`).value = r.posSpotify ?? 0;
  document.getElementById(`pos-instafest-bside-${r.personaId}`).value = r.posInstafest ?? 0;
  document.getElementById(`reproducciones-bside-${r.personaId}`).value = r.reproducciones ?? 0;
  actualizarPreviewBside(r.personaId);
  document.querySelector(`#form-bside-${r.personaId} button[type="submit"]`).innerHTML = "✏️ Actualizar";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function posicionesHTML(r) {
  if (r.posSpotify !== undefined || r.posInstafest !== undefined) return `🟢${r.posSpotify || 0}<br>🎪${r.posInstafest || 0}`;
  return `📊${r.posicion || 0}<br><small>legacy</small>`;
}

function renderHistorial() {
  const registros = filtrarRegistrosTemporada(cargarRegistros())
    .filter(r => r.semanaId === document.getElementById("semana-global").value)
    .sort((a, b) => obtenerPuntajeRegistro(b) - obtenerPuntajeRegistro(a));
  const container = document.getElementById("historial-list"); if (!container) return;
  container.innerHTML = registros.length ? "" : "<p style='text-align:center;color:var(--text-muted);font-size:0.85rem;'>Vacío</p>";
  registros.forEach(r => {
    const c = CANCIONES.find(x => x.id === r.cancionId); if (!c) return;
    const pid = r.personaId || "p1";
    const div = document.createElement("div"); div.className = `historial-item ${pid === "p2" ? "p2-item" : ""}`;
    div.innerHTML = `<div style="font-size:0.75rem;color:var(--text-muted);">${posicionesHTML(r)}</div><span class="${pid === "p2" ? "badge-p2" : "badge-p1"}">${pid.toUpperCase()}</span><span class="hi-name">${c.nombre}<br><span style="font-size:0.7rem;color:var(--text-muted);">${c.artista}</span></span><span class="hi-rep">▶ ${r.reproducciones || 0}x</span><span class="hi-pts">+${obtenerPuntajeRegistro(r)} pts</span><div class="historial-actions"><button class="btn-edit" onclick="cargarEdicion('${r.id}')">✏️</button><button class="btn-delete" onclick="eliminarRegistro('${r.id}')">✕</button></div>`;
    container.appendChild(div);
  });
  aplicarConfiguracionUI();
}

function renderHistorialAlbumes() {
  const registros = filtrarRegistrosTemporada(cargarRegistrosAlbumes()).filter(r => r.semanaId === document.getElementById("semana-global").value).sort((a, b) => obtenerPuntajeRegistro(b) - obtenerPuntajeRegistro(a));
  const container = document.getElementById("historial-albumes-list"); if (!container) return;
  container.innerHTML = registros.length ? "" : "<p style='text-align:center;color:var(--text-muted);font-size:0.85rem;'>Vacío</p>";
  registros.forEach(r => {
    const a = ALBUMES.find(x => x.id === r.albumId); if (!a) return;
    const pid = r.personaId || "p1";
    const div = document.createElement("div"); div.className = `historial-item ${pid === "p2" ? "p2-item" : ""}`;
    div.innerHTML = `<div style="font-size:0.75rem;color:var(--text-muted);">${posicionesHTML(r)}</div><span class="${pid === "p2" ? "badge-p2" : "badge-p1"}">${pid.toUpperCase()}</span><span class="hi-name">💿 ${a.nombre}<br><span style="font-size:0.7rem;color:var(--text-muted);">${a.artista}</span></span><span class="hi-rep">▶ ${r.reproducciones || 0}x</span><span class="hi-pts">+${obtenerPuntajeRegistro(r)} pts</span><div class="historial-actions"><button class="btn-edit" onclick="cargarEdicionAlbum('${r.id}')">✏️</button><button class="btn-delete" onclick="eliminarRegistroAlbum('${r.id}')">✕</button></div>`;
    container.appendChild(div);
  });
  aplicarConfiguracionUI();
}

function renderHistorialArtistas() {
  const registros = filtrarRegistrosTemporada(cargarRegistrosArtistas()).filter(r => r.semanaId === document.getElementById("semana-global").value).sort((a, b) => obtenerPuntajeRegistro(b) - obtenerPuntajeRegistro(a));
  const container = document.getElementById("historial-artistas-list"); if (!container) return;
  container.innerHTML = registros.length ? "" : "<p style='text-align:center;color:var(--text-muted);font-size:0.85rem;'>Vacío</p>";
  registros.forEach(r => {
    const a = ARTISTAS.find(x => x.id === r.artistaId); if (!a) return;
    const pid = r.personaId || "p1";
    const div = document.createElement("div"); div.className = `historial-item ${pid === "p2" ? "p2-item" : ""}`;
    div.innerHTML = `<div style="font-size:0.75rem;color:var(--text-muted);">${posicionesHTML(r)}</div><span class="${pid === "p2" ? "badge-p2" : "badge-p1"}">${pid.toUpperCase()}</span><span class="hi-name">${a.nombre}<br><span style="font-size:0.7rem;color:var(--text-muted);">${a.categoria.replace('_', ' ').toUpperCase()}</span></span><span class="hi-rep">▶ ${r.reproducciones || 0}x</span><span class="hi-pts">+${obtenerPuntajeRegistro(r)} pts</span><div class="historial-actions"><button class="btn-edit" onclick="cargarEdicionArtista('${r.id}')">✏️</button><button class="btn-delete" onclick="eliminarRegistroArtista('${r.id}')">✕</button></div>`;
    container.appendChild(div);
  });
  aplicarConfiguracionUI();
}

function renderHistorialBsides() {
  const registros = filtrarRegistrosTemporada(cargarRegistrosBsides()).filter(r => r.semanaId === document.getElementById("semana-global").value).sort((a, b) => obtenerPuntajeRegistro(b) - obtenerPuntajeRegistro(a));
  const container = document.getElementById("historial-bsides-list"); if (!container) return;
  container.innerHTML = registros.length ? "" : "<p style='text-align:center;color:var(--text-muted);font-size:0.85rem;'>Vacío</p>";
  registros.forEach(r => {
    const b = BSIDES.find(x => x.id === r.bsideId); if (!b) return;
    const pid = r.personaId || "p1";
    const div = document.createElement("div"); div.className = `historial-item ${pid === "p2" ? "p2-item" : ""}`;
    div.innerHTML = `<div style="font-size:0.75rem;color:var(--text-muted);">${posicionesHTML(r)}</div><span class="${pid === "p2" ? "badge-p2" : "badge-p1"}">${pid.toUpperCase()}</span><span class="hi-name">🎧 ${b.nombre}<br><span style="font-size:0.7rem;color:var(--text-muted);">${b.artista}</span></span><span class="hi-rep">▶ ${r.reproducciones || 0}x</span><span class="hi-pts">+${obtenerPuntajeRegistro(r)} pts</span><div class="historial-actions"><button class="btn-edit" onclick="cargarEdicionBside('${r.id}')">✏️</button><button class="btn-delete" onclick="eliminarRegistroBside('${r.id}')">✕</button></div>`;
    container.appendChild(div);
  });
  aplicarConfiguracionUI();
}

function eliminarConDeshacer(cargar, guardar, render, id, motivo, etiqueta) {
  if (temporadaEstaCerrada()) return mostrarToast("🔒 Esta temporada está cerrada; su historial está protegido.", "error");
  const registros = cargar();
  const index = registros.findIndex(r => r.id === id);
  if (index === -1) return;

  const eliminado = registros[index];
  guardarBackupSeguridad(motivo);
  registros.splice(index, 1);
  guardar(registros);
  render();

  mostrarDeshacer(`${etiqueta} eliminado`, () => {
    const actuales = cargar();
    if (!actuales.some(r => r.id === eliminado.id)) {
      actuales.splice(Math.min(index, actuales.length), 0, eliminado);
      guardar(actuales);
    }
    render();
    mostrarToast("↩️ Registro restaurado", "success");
  });
}
function eliminarRegistro(id) { eliminarConDeshacer(cargarRegistros, guardarRegistros, renderHistorial, id, "antes_de_eliminar_cancion", "Canción"); }
function eliminarRegistroAlbum(id) { eliminarConDeshacer(cargarRegistrosAlbumes, guardarRegistrosAlbumes, renderHistorialAlbumes, id, "antes_de_eliminar_album", "Álbum"); }
function eliminarRegistroArtista(id) { eliminarConDeshacer(cargarRegistrosArtistas, guardarRegistrosArtistas, renderHistorialArtistas, id, "antes_de_eliminar_artista", "Artista"); }
function eliminarRegistroBside(id) { eliminarConDeshacer(cargarRegistrosBsides, guardarRegistrosBsides, renderHistorialBsides, id, "antes_de_eliminar_bside", "B-Side"); }

function mostrarToast(msg, tipo = "success") {
  const container = document.getElementById("toast-container"); if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${tipo}`;
  toast.innerHTML = `<span>${tipo === "success" ? "✅" : "⚠️"}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}


// ── Búsqueda dentro de selectores · v1.2 ─────────────────────
function instalarBuscadorSelect(selectId, placeholder) {
  const select = document.getElementById(selectId);
  if (!select || select.dataset.kgSearch === "1") return;
  select.dataset.kgSearch = "1";

  const input = document.createElement("input");
  input.type = "search";
  input.autocomplete = "off";
  input.className = "kg-select-search";
  input.placeholder = placeholder;
  input.setAttribute("aria-label", placeholder);
  select.parentNode.insertBefore(input, select);

  let base = [];
  const capturar = () => {
    base = [...select.options].map(o => ({ value: o.value, text: o.textContent, disabled: o.disabled }));
  };

  const filtrar = () => {
    const query = input.value.trim().toLowerCase();
    const seleccionado = select.value;
    const opciones = base.filter((o, idx) => idx === 0 && o.value === "" || !query || o.text.toLowerCase().includes(query));
    select.innerHTML = "";

    if (!opciones.length) {
      const vacia = document.createElement("option");
      vacia.value = "";
      vacia.textContent = "Sin coincidencias";
      vacia.disabled = true;
      vacia.selected = true;
      select.appendChild(vacia);
      return;
    }

    opciones.forEach(o => {
      const opt = document.createElement("option");
      opt.value = o.value;
      opt.textContent = o.text;
      opt.disabled = o.disabled;
      select.appendChild(opt);
    });
    if ([...select.options].some(o => o.value === seleccionado)) select.value = seleccionado;
  };

  capturar();
  input.addEventListener("input", filtrar);
  select.addEventListener("kg-options-changed", () => { capturar(); filtrar(); });
}

function configurarBusquedasRegistro() {
  ["p1", "p2"].forEach(pid => {
    instalarBuscadorSelect(`cancion-${pid}`, "🔎 Buscar canción o artista...");
    instalarBuscadorSelect(`album-${pid}`, "🔎 Buscar álbum o artista...");
    instalarBuscadorSelect(`bside-${pid}`, "🔎 Buscar B-Side o artista...");
    instalarBuscadorSelect(`artista-${pid}`, "🔎 Buscar artista...");
  });
}
