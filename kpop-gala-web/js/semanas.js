// ============================================================
//  KPOP GALA — SEMANAS.JS · v2.0 Seasons
//  Vista de registros por semana con compatibilidad legacy
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  poblarFiltros();

  // Los enlaces existentes ?filtro=p1 / ?filtro=p2 ahora sí funcionan.
  const personaURL = new URLSearchParams(window.location.search).get("filtro");
  if (["p1", "p2"].includes(personaURL)) {
    document.getElementById("filtro-persona").value = personaURL;
  }

  actualizarVista();
  aplicarConfiguracionUI();
});

function renderOpcionesSemana() {
  const selSemana = document.getElementById("filtro-semana");
  const valorActual = selSemana.value || "todas";
  const registros = filtrarRegistrosTemporada(cargarRegistros());
  const semanasUsadas = [...new Set(registros.map(r => r.semanaId))];

  selSemana.innerHTML = `<option value="todas">Todas las semanas</option>`;
  SEMANAS.forEach(s => {
    if (semanasUsadas.includes(s.id)) {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.label;
      selSemana.appendChild(opt);
    }
  });
  selSemana.value = [...selSemana.options].some(o => o.value === valorActual) ? valorActual : "todas";
}

function poblarFiltros() {
  const selSemana = document.getElementById("filtro-semana");
  const selPersona = document.getElementById("filtro-persona");
  renderOpcionesSemana();
  selSemana.addEventListener("change", actualizarVista);
  selPersona.addEventListener("change", actualizarVista);
}

function actualizarVista() {
  const sem = document.getElementById("filtro-semana").value;
  const per = document.getElementById("filtro-persona").value;
  renderResumen(sem, per);
  renderSemanas(sem, per);
}

function renderResumen(semFiltro = "todas", perFiltro = "todas") {
  const registros = filtrarRegistrosTemporada(cargarRegistros()).filter(r => {
    const matchSem = semFiltro === "todas" || r.semanaId === semFiltro;
    const matchPer = perFiltro === "todas" || r.personaId === perFiltro;
    return matchSem && matchPer;
  });

  const ptsP1 = registros.filter(r => r.personaId === "p1").reduce((s, r) => s + obtenerPuntajeRegistro(r), 0);
  const ptsP2 = registros.filter(r => r.personaId === "p2").reduce((s, r) => s + obtenerPuntajeRegistro(r), 0);
  const entP1 = registros.filter(r => r.personaId === "p1").length;
  const entP2 = registros.filter(r => r.personaId === "p2").length;

  document.getElementById("res-pts-p1").textContent = ptsP1.toLocaleString();
  document.getElementById("res-pts-p2").textContent = ptsP2.toLocaleString();
  document.getElementById("res-ent-p1").textContent = `${entP1} entrada${entP1 !== 1 ? "s" : ""}`;
  document.getElementById("res-ent-p2").textContent = `${entP2} entrada${entP2 !== 1 ? "s" : ""}`;
  aplicarConfiguracionUI();
}

function renderSemanas(semFiltro = "todas", perFiltro = "todas") {
  const container = document.getElementById("semanas-container");
  container.innerHTML = "";

  const registros = filtrarRegistrosTemporada(cargarRegistros());
  const semanasAMostrar = semFiltro === "todas"
    ? SEMANAS.filter(s => registros.some(r => r.semanaId === s.id))
    : SEMANAS.filter(s => s.id === semFiltro);

  if (!semanasAMostrar.length) {
    container.innerHTML = `
      <div class="empty-state fade-up">
        <div class="empty-icon">📅</div>
        <h3>Sin registros para este filtro</h3>
        <p>Prueba con otra semana o ve a registrar canciones</p>
        <a href="registro.html" class="btn btn-primary mt-2">✨ Registrar</a>
      </div>`;
    return;
  }

  semanasAMostrar.forEach((semana, idx) => {
    const entradasSemana = registros.filter(r => {
      const matchSem = r.semanaId === semana.id;
      const matchPer = perFiltro === "todas" || r.personaId === perFiltro;
      return matchSem && matchPer;
    });

    const ptsSemana = entradasSemana.reduce((s, r) => s + obtenerPuntajeRegistro(r), 0);
    const bloque = document.createElement("div");
    bloque.className = "semana-bloque fade-up";
    bloque.style.animationDelay = `${idx * 0.06}s`;
    bloque.innerHTML = `
      <div class="semana-header">
        <span class="semana-num-badge">${semana.id}</span>
        <h2>${semana.label}</h2>
        <span class="semana-pts-total">Total: <strong>${ptsSemana.toLocaleString()}</strong> pts</span>
      </div>
      <div class="semana-tabla">${renderTabla(entradasSemana)}</div>`;
    container.appendChild(bloque);
  });
  aplicarConfiguracionUI();
  aplicarImagenesCatalogo(container);
}

function formatoPosiciones(r) {
  // Registro nuevo: Spotify + Instafest. Registro antiguo: posición única.
  if (r.posSpotify !== undefined || r.posInstafest !== undefined) {
    const spot = Number(r.posSpotify) > 0 ? `S#${r.posSpotify}` : "S—";
    const insta = Number(r.posInstafest) > 0 ? `I#${r.posInstafest}` : "I—";
    return `${spot}<br><small>${insta}</small>`;
  }
  return r.posicion ? `#${r.posicion}<br><small>legacy</small>` : "—";
}

function posicionOrden(r) {
  const pos = Number(r.posSpotify ?? r.posicion ?? 999);
  return pos > 0 ? pos : 999;
}

function renderTabla(entradas) {
  if (!entradas.length) return `<div class="semana-vacia">Sin registros para esta semana / filtro</div>`;

  const sorted = [...entradas].sort((a, b) => posicionOrden(a) - posicionOrden(b));
  const filas = sorted.map(r => {
    const cancion = cancionPorId(r.cancionId);
    if (!cancion) return "";
    const isPid2 = r.personaId === "p2";
    const puntos = obtenerPuntajeRegistro(r);

    return `
      <div class="semana-tabla-row">
        <span class="str-pos">${formatoPosiciones(r)}</span>
        <div class="str-img">
          <img src="${srcImagenItem(cancion)}"${atributoImagenItem(cancion)} alt="${escaparHTML(cancion.nombre)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
          <div class="str-img-placeholder" style="display:none;">🎵</div>
        </div>
        <div class="str-info">
          <div class="str-name">${cancion.nombre}</div>
          <div class="str-artist">${cancion.artista}</div>
        </div>
        <div class="str-persona"><span class="${isPid2 ? "badge-p2" : "badge-p1"}">${isPid2 ? "P2" : "P1"}</span></div>
        <span class="str-rep">▶ ${Number(r.reproducciones) || 0}x</span>
        <span class="str-pts ${isPid2 ? "p2" : ""}">
          +${puntos}
          ${temporadaEstaCerrada() ? "" : `<button class="str-del-btn" onclick="eliminarEnSemana('${r.id}')" title="Eliminar">✕</button>`}
        </span>
      </div>`;
  }).join("");

  return `
    <div class="semana-tabla-header">
      <span>Pos.</span>
      <span>🎵</span>
      <span>Canción</span>
      <span style="text-align:center">Persona</span>
      <span style="text-align:center">Plays</span>
      <span style="text-align:right">Puntos</span>
    </div>
    ${filas}`;
}

function eliminarEnSemana(id) {
  if (temporadaEstaCerrada()) {
    mostrarToastSemanas("Esta temporada está cerrada; su historial está protegido.", "error");
    return;
  }
  const registros = cargarRegistros();
  const index = registros.findIndex(r => r.id === id);
  if (index === -1) return;

  const eliminado = registros[index];
  guardarBackupSeguridad("antes_de_eliminar_registro");
  registros.splice(index, 1);
  guardarRegistros(registros);
  renderOpcionesSemana();
  actualizarVista();

  mostrarDeshacer("Registro eliminado", () => {
    const actuales = cargarRegistros();
    if (!actuales.some(r => r.id === eliminado.id)) {
      actuales.splice(Math.min(index, actuales.length), 0, eliminado);
      guardarRegistros(actuales);
    }
    renderOpcionesSemana();
    actualizarVista();
    mostrarToastSemanas("Registro restaurado", "success");
  });
}

function mostrarToastSemanas(msg, tipo = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${tipo}`;
  toast.innerHTML = `<span>${tipo === "success" ? "✅" : "⚠️"}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
