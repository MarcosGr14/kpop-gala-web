// ============================================================
//  KPOP GALA — CATALOGO.JS · v1.4
// ============================================================

const KG_TIPOS = {
  canciones: { singular: "canción", plural: "Canciones", icon: "🎵", ph: "🎵" },
  artistas: { singular: "artista", plural: "Artistas", icon: "⭐", ph: "🎤" },
  albumes: { singular: "álbum", plural: "Álbumes", icon: "💿", ph: "💿" },
  bsides: { singular: "B-Side", plural: "B-Sides", icon: "🎧", ph: "🎧" },
};

let kgTipoActual = "canciones";
let kgPreviewObjectUrl = null;

document.addEventListener("DOMContentLoaded", () => {
  configurarCatalogo();
  renderCatalogo();
  aplicarConfiguracionUI();
});

function configurarCatalogo() {
  document.getElementById("catalog-tabs").addEventListener("click", e => {
    const btn = e.target.closest("[data-type]");
    if (!btn) return;
    kgTipoActual = btn.dataset.type;
    document.querySelectorAll(".catalog-tab").forEach(x => x.classList.toggle("active", x === btn));
    document.getElementById("catalog-search").value = "";
    renderCatalogo();
  });
  document.getElementById("catalog-search").addEventListener("input", renderCatalogo);
  document.getElementById("catalog-status").addEventListener("change", renderCatalogo);
  document.getElementById("btn-add-catalog").addEventListener("click", () => abrirEditor());
  document.getElementById("catalog-list").addEventListener("click", manejarAccionLista);
  document.getElementById("btn-close-dialog").addEventListener("click", cerrarEditor);
  document.getElementById("btn-cancel-dialog").addEventListener("click", cerrarEditor);
  document.getElementById("catalog-form").addEventListener("submit", guardarDesdeEditor);
  document.getElementById("catalog-image").addEventListener("change", previewArchivoSeleccionado);
  document.getElementById("btn-clear-new-image").addEventListener("click", limpiarArchivoSeleccionado);
  document.getElementById("catalog-album").addEventListener("change", previewPortadaAlbumSiAplica);
  document.getElementById("catalog-use-album-cover").addEventListener("change", previewPortadaAlbumSiAplica);
}

function renderResumenCatalogo() {
  const tipos = ["canciones", "artistas", "albumes", "bsides"];
  const cont = document.getElementById("catalog-summary");
  cont.innerHTML = tipos.map(tipo => {
    const items = coleccionCatalogo(tipo);
    const activos = items.filter(x => !x.archivado).length;
    const custom = items.filter(x => x.origen === "custom").length;
    return `<div class="catalog-summary-card"><span class="icon">${KG_TIPOS[tipo].icon}</span><strong>${activos}</strong><small>${KG_TIPOS[tipo].plural} activas · ${custom} añadidos desde la app</small></div>`;
  }).join("");
}

function renderCatalogo() {
  renderResumenCatalogo();
  const q = normalizarClaveTexto(document.getElementById("catalog-search")?.value || "");
  const estado = document.getElementById("catalog-status")?.value || "activos";
  let items = [...coleccionCatalogo(kgTipoActual)];
  if (estado === "activos") items = items.filter(x => !x.archivado);
  if (estado === "archivados") items = items.filter(x => x.archivado);
  if (q) items = items.filter(x => normalizarClaveTexto(`${x.nombre} ${x.artista || ""} ${x.categoria || ""}`).includes(q));
  items.sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), "es", { sensitivity: "base" }));

  const list = document.getElementById("catalog-list");
  if (!items.length) {
    list.innerHTML = `<div class="catalog-empty"><div class="big">${KG_TIPOS[kgTipoActual].icon}</div><strong>No hay resultados</strong><div>Prueba otro filtro o añade ${KG_TIPOS[kgTipoActual].singular}.</div></div>`;
    return;
  }

  list.innerHTML = items.map(item => cardCatalogo(item)).join("");
  aplicarImagenesCatalogo(list);
}

function subtituloItem(tipo, item) {
  if (tipo === "artistas") return etiquetaCategoria(item.categoria);
  if (tipo === "bsides" && item.albumId) {
    const album = obtenerItemCatalogo("albumes", item.albumId);
    return `${item.artista || "—"}${album ? ` · ${album.nombre}` : ""}`;
  }
  return item.artista || "—";
}

function etiquetaCategoria(cat) {
  return ({ boy_group: "Boy Group", girl_group: "Girl Group", solista_m: "Solista masculino", solista_f: "Solista femenina" })[cat] || cat || "Sin categoría";
}

function cardCatalogo(item) {
  const registros = contarRegistrosItem(kgTipoActual, item.id);
  const custom = item.origen === "custom";
  const puedeEliminar = custom && registros === 0 && !itemEstaReferenciadoCatalogo(kgTipoActual, item.id);
  return `<article class="catalog-item ${item.archivado ? "archived" : ""}" data-id="${escaparHTML(item.id)}">
    <div class="catalog-thumb">
      <img src="${srcImagenItem(item)}"${atributoImagenItem(item)} alt="${escaparHTML(item.nombre)}" onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
      <span class="ph" style="display:${item.imagenId || item.img ? "none" : "block"}">${KG_TIPOS[kgTipoActual].ph}</span>
    </div>
    <div class="catalog-main">
      <h3>${escaparHTML(item.nombre)}</h3>
      <div class="catalog-sub">${escaparHTML(subtituloItem(kgTipoActual, item))}</div>
      <div class="catalog-badges">
        <span class="catalog-badge">${registros} registro${registros === 1 ? "" : "s"}</span>
        <span class="catalog-badge ${custom ? "custom" : ""}">${custom ? "Añadido en app" : "Catálogo base"}</span>
        ${item.archivado ? '<span class="catalog-badge arch">Archivado</span>' : ""}
      </div>
    </div>
    <div class="catalog-actions">
      <button data-action="edit">✏️ Editar</button>
      <button data-action="archive">${item.archivado ? "↩️ Reactivar" : "📦 Archivar"}</button>
      ${puedeEliminar ? '<button data-action="delete" class="danger">🗑 Eliminar</button>' : ""}
    </div>
  </article>`;
}

async function manejarAccionLista(e) {
  const btn = e.target.closest("button[data-action]");
  const card = e.target.closest("[data-id]");
  if (!btn || !card) return;
  const id = card.dataset.id;
  const item = obtenerItemCatalogo(kgTipoActual, id);
  if (!item) return;
  try {
    if (btn.dataset.action === "edit") return abrirEditor(id);
    if (btn.dataset.action === "archive") {
      cambiarArchivoItemCatalogo(kgTipoActual, id, !item.archivado);
      toastCatalogo(item.archivado ? "Elemento reactivado." : "Elemento archivado. Su historial se conserva.");
      return renderCatalogo();
    }
    if (btn.dataset.action === "delete") {
      if (!confirm(`Eliminar definitivamente “${item.nombre}”? Esta acción solo se permite porque no tiene historial.`)) return;
      eliminarItemCatalogo(kgTipoActual, id);
      toastCatalogo("Elemento eliminado.");
      renderCatalogo();
    }
  } catch (error) {
    toastCatalogo(error.message || "No se pudo completar la acción.", "error");
  }
}

function poblarSelectArtistas(item = null) {
  const sel = document.getElementById("catalog-artist");
  const artistas = ARTISTAS.filter(a => !a.archivado).sort((a,b) => a.nombre.localeCompare(b.nombre, "es"));
  sel.innerHTML = `<option value="">Selecciona un artista...</option>` + artistas.map(a => `<option value="${escaparHTML(a.id)}">${escaparHTML(a.nombre)}</option>`).join("");
  if (!item) return;
  let value = item.artistaId && artistas.some(a => String(a.id) === String(item.artistaId)) ? String(item.artistaId) : "";
  if (!value && item.artista) {
    const match = artistas.find(a => normalizarClaveTexto(a.nombre) === normalizarClaveTexto(item.artista));
    if (match) value = String(match.id);
    else {
      const legacyValue = `legacy:${item.artista}`;
      const opt = document.createElement("option"); opt.value = legacyValue; opt.textContent = `Mantener: ${item.artista}`; sel.appendChild(opt); value = legacyValue;
    }
  }
  sel.value = value;
}

function poblarSelectAlbumes(item = null) {
  const sel = document.getElementById("catalog-album");
  const albumes = ALBUMES.filter(a => !a.archivado).sort((a,b) => a.nombre.localeCompare(b.nombre, "es"));
  sel.innerHTML = `<option value="">Sin álbum</option>` + albumes.map(a => `<option value="${escaparHTML(a.id)}">${escaparHTML(a.nombre)} — ${escaparHTML(a.artista)}</option>`).join("");
  if (item?.albumId && albumes.some(a => String(a.id) === String(item.albumId))) sel.value = String(item.albumId);
}

async function abrirEditor(id = null) {
  const item = id !== null ? obtenerItemCatalogo(kgTipoActual, id) : null;
  const meta = KG_TIPOS[kgTipoActual];
  document.getElementById("catalog-edit-id").value = item?.id ?? "";
  document.getElementById("catalog-name").value = item?.nombre ?? "";
  document.getElementById("catalog-category").value = item?.categoria || "boy_group";
  document.getElementById("dialog-kicker").textContent = item ? "EDITAR" : "NUEVO";
  document.getElementById("dialog-title").textContent = `${item ? "Editar" : "Añadir"} ${meta.singular}`;
  document.getElementById("field-category").style.display = kgTipoActual === "artistas" ? "block" : "none";
  document.getElementById("field-artist").style.display = kgTipoActual === "artistas" ? "none" : "block";
  document.getElementById("field-album").style.display = kgTipoActual === "bsides" ? "block" : "none";
  poblarSelectArtistas(item);
  poblarSelectAlbumes(item);
  document.getElementById("catalog-use-album-cover").checked = false;
  limpiarArchivoSeleccionado(false);
  await mostrarPreviewItem(item);
  document.getElementById("catalog-dialog").showModal();
  setTimeout(() => document.getElementById("catalog-name").focus(), 50);
}

function cerrarEditor() {
  limpiarArchivoSeleccionado(false);
  document.getElementById("catalog-dialog").close();
}

async function mostrarPreviewItem(item) {
  const img = document.getElementById("catalog-image-preview");
  const ph = document.getElementById("catalog-image-placeholder");
  img.style.display = "none"; ph.style.display = "block"; img.removeAttribute("src");
  if (!item) return;
  let src = item.img || null;
  if (item.imagenId) src = await obtenerUrlImagenCatalogo(item.imagenId);
  if (src) { img.src = src; img.style.display = "block"; ph.style.display = "none"; }
}

function previewArchivoSeleccionado() {
  const file = document.getElementById("catalog-image").files?.[0];
  if (!file) return;
  if (kgPreviewObjectUrl) URL.revokeObjectURL(kgPreviewObjectUrl);
  kgPreviewObjectUrl = URL.createObjectURL(file);
  const img = document.getElementById("catalog-image-preview");
  img.src = kgPreviewObjectUrl; img.style.display = "block";
  document.getElementById("catalog-image-placeholder").style.display = "none";
}

function limpiarArchivoSeleccionado(restaurar = true) {
  const input = document.getElementById("catalog-image");
  if (input) input.value = "";
  if (kgPreviewObjectUrl) { URL.revokeObjectURL(kgPreviewObjectUrl); kgPreviewObjectUrl = null; }
  if (restaurar) {
    const id = document.getElementById("catalog-edit-id")?.value;
    mostrarPreviewItem(id ? obtenerItemCatalogo(kgTipoActual, id) : null);
  }
}

async function previewPortadaAlbumSiAplica() {
  if (kgTipoActual !== "bsides" || !document.getElementById("catalog-use-album-cover").checked) return;
  if (document.getElementById("catalog-image").files?.length) return;
  const album = obtenerItemCatalogo("albumes", document.getElementById("catalog-album").value);
  if (album) await mostrarPreviewItem(album);
}

async function guardarDesdeEditor(e) {
  e.preventDefault();
  const btn = document.getElementById("btn-save-catalog");
  const idRaw = document.getElementById("catalog-edit-id").value;
  const id = idRaw === "" ? null : idRaw;
  const existente = id !== null ? obtenerItemCatalogo(kgTipoActual, id) : null;
  const nombre = document.getElementById("catalog-name").value.trim();
  if (!nombre) return toastCatalogo("Escribe un nombre.", "error");

  const datos = { nombre };
  if (kgTipoActual === "artistas") {
    datos.categoria = document.getElementById("catalog-category").value;
  } else {
    const valor = document.getElementById("catalog-artist").value;
    if (!valor && !existente) return toastCatalogo("Selecciona un artista. Si aún no existe, agrégalo primero.", "error");
    if (valor.startsWith("legacy:")) {
      datos.artista = valor.slice(7); datos.artistaId = null;
    } else if (valor) {
      const artista = obtenerItemCatalogo("artistas", valor);
      if (!artista) return toastCatalogo("El artista seleccionado ya no está disponible.", "error");
      datos.artista = artista.nombre; datos.artistaId = artista.id;
    } else if (existente) {
      datos.artista = existente.artista; datos.artistaId = existente.artistaId || null;
    }
    if (kgTipoActual === "bsides") datos.albumId = document.getElementById("catalog-album").value || null;
  }

  btn.disabled = true; btn.textContent = "Guardando...";
  try {
    const file = document.getElementById("catalog-image").files?.[0];
    if (file) {
      datos.imagenId = await guardarImagenCatalogo(file);
      datos.img = "";
    } else if (kgTipoActual === "bsides" && document.getElementById("catalog-use-album-cover").checked) {
      const album = obtenerItemCatalogo("albumes", document.getElementById("catalog-album").value);
      if (!album) throw new Error("Selecciona un álbum para usar su portada.");
      datos.imagenId = album.imagenId || null;
      datos.img = album.img || "";
    }

    const saved = guardarItemCatalogo(kgTipoActual, datos, id);
    cerrarEditor();
    renderCatalogo();
    toastCatalogo(`${KG_TIPOS[kgTipoActual].icon} ${saved.nombre} guardado correctamente.`);
  } catch (error) {
    toastCatalogo(error.message || "No se pudo guardar.", "error");
  } finally {
    btn.disabled = false; btn.textContent = "Guardar";
  }
}

function toastCatalogo(texto, tipo = "success") {
  const toast = document.getElementById("catalog-toast");
  toast.textContent = texto; toast.className = `catalog-toast ${tipo} visible`;
  clearTimeout(toastCatalogo.timer);
  toastCatalogo.timer = setTimeout(() => toast.classList.remove("visible"), 4200);
}
