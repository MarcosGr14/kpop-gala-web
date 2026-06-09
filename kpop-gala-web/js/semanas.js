// ============================================================
//  KPOP GALA — SEMANAS.JS
//  Vista de registros por semana con filtros
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  poblarFiltros();
  renderResumen();
  renderSemanas("todas");
});

// ── Poblar dropdowns de filtro ──────────────────────────────────
function poblarFiltros() {
  const selSemana  = document.getElementById("filtro-semana");
  const selPersona = document.getElementById("filtro-persona");

  // Semanas con registros existentes
  const registros  = cargarRegistros();
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

  selSemana.addEventListener("change",  actualizarVista);
  selPersona.addEventListener("change", actualizarVista);
}

function actualizarVista() {
  const sem = document.getElementById("filtro-semana").value;
  const per = document.getElementById("filtro-persona").value;
  renderResumen(sem, per);
  renderSemanas(sem, per);
}

// ── Resumen de personas ─────────────────────────────────────────
function renderResumen(semFiltro = "todas", perFiltro = "todas") {
  const registros = cargarRegistros().filter(r => {
    const matchSem = semFiltro === "todas" || r.semanaId === semFiltro;
    const matchPer = perFiltro === "todas" || r.personaId === perFiltro;
    return matchSem && matchPer;
  });

  const ptsP1 = registros.filter(r => r.personaId === "p1").reduce((s, r) => s + r.puntaje, 0);
  const ptsP2 = registros.filter(r => r.personaId === "p2").reduce((s, r) => s + r.puntaje, 0);
  const entP1 = registros.filter(r => r.personaId === "p1").length;
  const entP2 = registros.filter(r => r.personaId === "p2").length;

  document.getElementById("res-pts-p1").textContent = ptsP1.toLocaleString();
  document.getElementById("res-pts-p2").textContent = ptsP2.toLocaleString();
  document.getElementById("res-ent-p1").textContent = `${entP1} entrada${entP1 !== 1 ? "s" : ""}`;
  document.getElementById("res-ent-p2").textContent = `${entP2} entrada${entP2 !== 1 ? "s" : ""}`;
}

// ── Render semanas ──────────────────────────────────────────────
function renderSemanas(semFiltro = "todas", perFiltro = "todas") {
  const container = document.getElementById("semanas-container");
  container.innerHTML = "";

  const registros = cargarRegistros();
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
      </div>
    `;
    return;
  }

  semanasAMostrar.forEach((semana, idx) => {
    const entradasSemana = registros.filter(r => {
      const matchSem = r.semanaId === semana.id;
      const matchPer = perFiltro === "todas" || r.personaId === perFiltro;
      return matchSem && matchPer;
    });

    const ptsSemana = entradasSemana.reduce((s, r) => s + r.puntaje, 0);

    const bloque = document.createElement("div");
    bloque.className = "semana-bloque fade-up";
    bloque.style.animationDelay = `${idx * 0.06}s`;

    bloque.innerHTML = `
      <div class="semana-header">
        <span class="semana-num-badge">${semana.id}</span>
        <h2>${semana.label}</h2>
        <span class="semana-pts-total">Total: <strong>${ptsSemana.toLocaleString()}</strong> pts</span>
      </div>
      <div class="semana-tabla">
        ${renderTabla(entradasSemana, semana.id)}
      </div>
    `;
    container.appendChild(bloque);
  });
}

// ── Render tabla de una semana ──────────────────────────────────
function renderTabla(entradas, semanaId) {
  if (!entradas.length) {
    return `<div class="semana-vacia">Sin registros para esta semana / filtro</div>`;
  }

  const sorted = [...entradas].sort((a, b) => a.posicion - b.posicion);

  const filas = sorted.map(r => {
    const cancion = cancionPorId(r.cancionId);
    if (!cancion) return "";
    const isPid2 = r.personaId === "p2";

    return `
      <div class="semana-tabla-row">
        <span class="str-pos">${r.posicion}</span>
        <div class="str-img">
          <img src="${cancion.img}" alt="${cancion.nombre}"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
          <div class="str-img-placeholder" style="display:none;">🎵</div>
        </div>
        <div class="str-info">
          <div class="str-name">${cancion.nombre}</div>
          <div class="str-artist">${cancion.artista}</div>
        </div>
        <div class="str-persona">
          <span class="${isPid2 ? "badge-p2" : "badge-p1"}">${isPid2 ? "P2" : "P1"}</span>
        </div>
        <span class="str-rep">▶ ${r.reproducciones}x</span>
        <span class="str-pts ${isPid2 ? "p2" : ""}">
          +${r.puntaje}
          <button class="str-del-btn" onclick="eliminarEnSemana('${r.id}', '${semanaId}')" title="Eliminar">✕</button>
        </span>
      </div>
    `;
  }).join("");

  return `
    <div class="semana-tabla-header">
      <span>#Pos</span>
      <span>🎵</span>
      <span>Canción</span>
      <span style="text-align:center">Persona</span>
      <span style="text-align:center">Plays</span>
      <span style="text-align:right">Puntos</span>
    </div>
    ${filas}
  `;
}

// ── Eliminar desde la vista de semanas ──────────────────────────
function eliminarEnSemana(id, semanaId) {
  if (!confirm("¿Eliminar este registro?")) return;
  let registros = cargarRegistros();
  registros = registros.filter(r => r.id !== id);
  guardarRegistros(registros);
  mostrarToastSemanas("Registro eliminado", "success");
  poblarFiltros();
  renderResumen(
    document.getElementById("filtro-semana").value,
    document.getElementById("filtro-persona").value
  );
  renderSemanas(
    document.getElementById("filtro-semana").value,
    document.getElementById("filtro-persona").value
  );
}

// ── Toast ────────────────────────────────────────────────────────
function mostrarToastSemanas(msg, tipo = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${tipo}`;
  toast.innerHTML = `<span>${tipo === "success" ? "✅" : "⚠️"}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
