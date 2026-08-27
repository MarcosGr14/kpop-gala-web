// ============================================================
// KPOP GALA — TEMPORADAS.JS · v2.0
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  renderTemporadas();
  document.getElementById("btn-new-season").addEventListener("click", () => abrirEditorTemporada());
  document.getElementById("season-dialog-close").addEventListener("click", cerrarEditorTemporada);
  document.getElementById("season-cancel").addEventListener("click", cerrarEditorTemporada);
  document.getElementById("season-form").addEventListener("submit", guardarTemporadaDesdeUI);
  document.getElementById("season-list").addEventListener("click", manejarAccionTemporada);
});

function renderTemporadas() {
  const temporadas = cargarTemporadas().slice().sort((a,b)=>b.anio-a.anio);
  const activa = obtenerTemporadaActiva();
  const counts = contarRegistrosTemporada(activa.id);
  const total = Object.values(counts).reduce((s,n)=>s+n,0);
  const semanas = obtenerSemanasTemporada(activa.id).length;
  document.getElementById("active-season-card").innerHTML = `
    <div><div class="active-season-kicker">TEMPORADA ACTIVA</div><h2>${escaparHTML(activa.nombre)}</h2><div class="active-season-meta"><span class="season-pill ${activa.estado === "cerrada" ? "closed" : "open"}">${activa.estado === "cerrada" ? "🔒 Cerrada" : "● Abierta"}</span><span class="season-pill">📅 ${escaparHTML(rangoTemporadaTexto(activa))}</span><span class="season-pill">${semanas} semanas</span></div></div>
    <div class="active-season-stats"><div class="active-season-stat"><strong>${total}</strong><small>REGISTROS</small></div><div class="active-season-stat"><strong>${new Set([...filtrarRegistrosTemporada(cargarRegistros(),activa.id),...filtrarRegistrosTemporada(cargarRegistrosArtistas(),activa.id),...filtrarRegistrosTemporada(cargarRegistrosAlbumes(),activa.id),...filtrarRegistrosTemporada(cargarRegistrosBsides(),activa.id)].map(r=>r.semanaId)).size}</strong><small>SEMANAS ACTIVAS</small></div></div>`;
  document.getElementById("season-count").textContent = `${temporadas.length} temporada${temporadas.length===1?"":"s"}`;
  document.getElementById("season-list").innerHTML = temporadas.map(t => cardTemporada(t, t.id === activa.id)).join("");
}

function cardTemporada(t, activa) {
  const c = contarRegistrosTemporada(t.id); const total=Object.values(c).reduce((s,n)=>s+n,0); const weeks=obtenerSemanasTemporada(t.id).length;
  return `<article class="season-card ${activa?"active":""}" data-season-id="${escaparHTML(t.id)}">
    <div class="season-year">${t.anio}</div>
    <div><h3>${escaparHTML(t.nombre)} ${activa?'<span class="season-pill">ACTIVA</span>':""}</h3><div class="season-card-sub">${escaparHTML(rangoTemporadaTexto(t))}</div><div class="season-card-meta"><span class="season-pill ${t.estado==="cerrada"?"closed":"open"}">${t.estado==="cerrada"?"🔒 Cerrada":"● Abierta"}</span><span class="season-pill">${weeks} sem.</span><span class="season-pill">${total} registros</span><span class="season-pill">🎵 ${c.canciones} · ⭐ ${c.artistas} · 💿 ${c.albumes} · 🎧 ${c.bsides}</span></div></div>
    <div class="season-actions">
      ${activa?"":`<button class="season-btn success" data-action="activate">Usar temporada</button>`}
      <a class="season-btn" href="analytics.html?season=${encodeURIComponent(t.id)}">📊 Analytics</a>
      <a class="season-btn" href="hall-of-fame.html?season=${encodeURIComponent(t.id)}">👑 Hall</a>
      <button class="season-btn" data-action="edit">Editar</button>
      ${t.estado==="cerrada"?`<button class="season-btn success" data-action="reopen">Reabrir</button>`:`<button class="season-btn" data-action="close">Cerrar</button>`}
      ${t.id!==KPOP_GALA_LEGACY_SEASON_ID&&!total?`<button class="season-btn danger" data-action="delete">Eliminar</button>`:""}
    </div></article>`;
}

function abrirEditorTemporada(temp=null) {
  const dialog=document.getElementById("season-dialog");
  const nextYear=Math.max(...cargarTemporadas().map(t=>t.anio),new Date().getFullYear())+1;
  document.getElementById("season-edit-id").value=temp?.id||"";
  document.getElementById("season-year").value=temp?.anio||nextYear;
  document.getElementById("season-year").disabled=Boolean(temp);
  document.getElementById("season-name").value=temp?.nombre||`Temporada ${nextYear}`;
  document.getElementById("season-start").value=temp?.inicio||`${nextYear}-06-01`;
  document.getElementById("season-end").value=temp?.fin||`${nextYear}-12-06`;
  document.getElementById("season-dialog-kicker").textContent=temp?"EDITAR EDICIÓN":"NUEVA EDICIÓN";
  document.getElementById("season-dialog-title").textContent=temp?`Editar ${temp.nombre}`:"Crear temporada";
  dialog.showModal();
}
function cerrarEditorTemporada(){document.getElementById("season-dialog").close()}

function guardarTemporadaDesdeUI(e){
  e.preventDefault();
  try{
    const id=document.getElementById("season-edit-id").value;
    const datos={anio:Number(document.getElementById("season-year").value),nombre:document.getElementById("season-name").value,inicio:document.getElementById("season-start").value,fin:document.getElementById("season-end").value};
    if(id) actualizarTemporada(id,{nombre:datos.nombre,inicio:datos.inicio,fin:datos.fin}); else crearTemporada(datos);
    cerrarEditorTemporada();renderTemporadas();toastTemporada(id?"Temporada actualizada":"Temporada creada","success");
  }catch(err){toastTemporada(err.message||"No se pudo guardar la temporada","error")}
}

function manejarAccionTemporada(e){
  const btn=e.target.closest("[data-action]"); if(!btn)return;
  const card=btn.closest("[data-season-id]"); const id=card?.dataset.seasonId; const temp=obtenerTemporadaPorId(id); if(!temp)return;
  try{
    if(btn.dataset.action==="activate"){activarTemporada(id);location.reload();return}
    if(btn.dataset.action==="edit"){abrirEditorTemporada(temp);return}
    if(btn.dataset.action==="close"){if(!confirm(`Cerrar ${temp.nombre}? Se guardarán automáticamente sus ganadores actuales en el Hall of Fame y se bloquearán nuevos registros.`))return;cerrarTemporada(id);}
    if(btn.dataset.action==="reopen"){if(!confirm(`Reabrir ${temp.nombre}? Volverá a aceptar registros si la activas.`))return;reabrirTemporada(id);}
    if(btn.dataset.action==="delete"){if(!confirm(`Eliminar ${temp.nombre}? Solo se permite porque no contiene registros.`))return;eliminarTemporada(id);}
    renderTemporadas();toastTemporada("Temporada actualizada","success");
  }catch(err){toastTemporada(err.message||"No se pudo completar la acción","error")}
}

function toastTemporada(msg,tipo="success"){
  const el=document.getElementById("season-toast");el.textContent=msg;el.className=`season-toast visible ${tipo}`;clearTimeout(toastTemporada.timer);toastTemporada.timer=setTimeout(()=>el.classList.remove("visible"),4300);
}
