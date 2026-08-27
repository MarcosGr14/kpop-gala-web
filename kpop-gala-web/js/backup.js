// ============================================================
//  KPOP GALA — BACKUP.JS · v1.2
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("input-importar");
  const btnImportar = document.getElementById("btn-importar");
  let archivoSeleccionado = null;

  renderEstadoDatos();
  renderPerfiles();

  document.getElementById("btn-guardar-perfiles")?.addEventListener("click", guardarPerfilesDesdeUI);
  document.getElementById("btn-exportar").addEventListener("click", exportarDatos);

  input.addEventListener("change", () => {
    archivoSeleccionado = input.files?.[0] || null;
    document.getElementById("import-file-name").textContent = archivoSeleccionado?.name || "Ningún archivo seleccionado";
    btnImportar.disabled = !archivoSeleccionado;
  });

  btnImportar.addEventListener("click", async () => {
    if (!archivoSeleccionado) return;
    try {
      const texto = await archivoSeleccionado.text();
      const snapshot = JSON.parse(texto);
      const data = normalizarSnapshotDatos(snapshot); // valida antes de preguntar
      const total = Object.values(data).reduce((s, arr) => s + arr.length, 0);
      if (!confirm(`Se restaurarán ${total} registros desde ${archivoSeleccionado.name}. ¿Continuar?`)) return;
      const resultado = restaurarSnapshotDatos(snapshot);
      mostrarMensaje(`✅ Restauración completa: ${sumarResultado(resultado)} registros.`, "success");
      renderEstadoDatos();
      renderPerfiles();
      aplicarConfiguracionUI();
    } catch (error) {
      mostrarMensaje(`⚠️ ${error.message || "No se pudo importar el archivo."}`, "error");
    }
  });

  document.getElementById("btn-restaurar-ultimo").addEventListener("click", () => restaurarBackupLocal("ultimo"));
  document.getElementById("btn-restaurar-inicial").addEventListener("click", () => restaurarBackupLocal("inicial"));
});

function sumarResultado(resultado) {
  return Object.values(resultado).reduce((s, n) => s + Number(n || 0), 0);
}

function renderEstadoDatos() {
  const counts = {
    canciones: cargarRegistros().length,
    artistas: cargarRegistrosArtistas().length,
    albumes: cargarRegistrosAlbumes().length,
    bsides: cargarRegistrosBsides().length,
  };
  document.getElementById("count-canciones").textContent = counts.canciones;
  document.getElementById("count-artistas").textContent = counts.artistas;
  document.getElementById("count-albumes").textContent = counts.albumes;
  document.getElementById("count-bsides").textContent = counts.bsides;

  const inicial = obtenerBackupInicial();
  const ultimo = obtenerUltimoBackupSeguridad();
  const inicialTxt = inicial?.exportedAt ? new Date(inicial.exportedAt).toLocaleString("es-PA") : "no disponible";
  const ultimoTxt = ultimo?.exportedAt ? new Date(ultimo.exportedAt).toLocaleString("es-PA") : "aún no creado";
  document.getElementById("backup-status").textContent = `Copia inicial: ${inicialTxt} · Último punto: ${ultimoTxt}`;

  document.getElementById("btn-restaurar-inicial").disabled = !inicial;
  document.getElementById("btn-restaurar-ultimo").disabled = !ultimo;
}

function exportarDatos() {
  try {
    const snapshot = crearSnapshotDatos("exportacion_manual");
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const ahora = new Date();
    const stamp = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}_${String(ahora.getHours()).padStart(2, "0")}${String(ahora.getMinutes()).padStart(2, "0")}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `kpop-gala-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
    mostrarMensaje("✅ Copia de seguridad descargada. Guárdala en un lugar seguro.", "success");
  } catch (error) {
    mostrarMensaje("⚠️ No se pudo crear la copia de seguridad.", "error");
  }
}

function restaurarBackupLocal(tipo) {
  try {
    const snapshot = tipo === "inicial" ? obtenerBackupInicial() : obtenerUltimoBackupSeguridad();
    if (!snapshot) return mostrarMensaje("No hay un respaldo disponible para restaurar.", "error");
    const nombre = tipo === "inicial" ? "la copia automática anterior a v1.1" : "el último punto de restauración";
    if (!confirm(`Vas a restaurar ${nombre}. Antes se guardará el estado actual. ¿Continuar?`)) return;
    const resultado = restaurarSnapshotDatos(snapshot);
    mostrarMensaje(`✅ Respaldo restaurado: ${sumarResultado(resultado)} registros.`, "success");
    renderEstadoDatos();
    renderPerfiles();
    aplicarConfiguracionUI();
  } catch (error) {
    mostrarMensaje(`⚠️ ${error.message || "No se pudo restaurar el respaldo."}`, "error");
  }
}


function renderPerfiles() {
  const cfg = cargarConfiguracion();
  const nombre1 = document.getElementById("perfil-p1-nombre");
  const nombre2 = document.getElementById("perfil-p2-nombre");
  const emoji1 = document.getElementById("perfil-p1-emoji");
  const emoji2 = document.getElementById("perfil-p2-emoji");
  if (nombre1) nombre1.value = cfg.p1.nombre;
  if (nombre2) nombre2.value = cfg.p2.nombre;
  if (emoji1) emoji1.value = cfg.p1.emoji;
  if (emoji2) emoji2.value = cfg.p2.emoji;
}

function guardarPerfilesDesdeUI() {
  const cfg = {
    p1: {
      nombre: document.getElementById("perfil-p1-nombre")?.value,
      emoji: document.getElementById("perfil-p1-emoji")?.value,
    },
    p2: {
      nombre: document.getElementById("perfil-p2-nombre")?.value,
      emoji: document.getElementById("perfil-p2-emoji")?.value,
    },
  };

  if (!guardarConfiguracion(cfg)) {
    mostrarMensaje("⚠️ No se pudieron guardar los nombres.", "error");
    return;
  }
  renderPerfiles();
  aplicarConfiguracionUI();
  mostrarMensaje("✅ Participantes actualizados. Tus registros siguen usando p1 y p2 internamente.", "success");
}

function mostrarMensaje(texto, tipo = "success") {
  const el = document.getElementById("data-message");
  el.textContent = texto;
  el.className = `data-message visible ${tipo}`;
  clearTimeout(mostrarMensaje.timer);
  mostrarMensaje.timer = setTimeout(() => el.classList.remove("visible"), 5500);
}
