// ============================================================
//  KPOP GALA — ANALYTICS.JS · v1.5
//  Dashboard, perfiles de detalle y evolución histórica
// ============================================================

const KG_ANALYTICS = {
  canciones: { icon: "🎵", singular: "Canción", plural: "Canciones", color: "var(--rosa)" },
  artistas:  { icon: "⭐", singular: "Artista", plural: "Artistas", color: "var(--amarillo)" },
  albumes:   { icon: "💿", singular: "Álbum", plural: "Álbumes", color: "var(--violeta)" },
  bsides:    { icon: "🎧", singular: "B-Side", plural: "B-Sides", color: "var(--verde)" },
};

let kgAnalyticsTipo = "resumen";
let kgAnalyticsBusqueda = "";

window.addEventListener("DOMContentLoaded", () => {
  aplicarConfiguracionUI();
  const params = new URLSearchParams(location.search);
  const tipo = params.get("tipo");
  const id = params.get("id");
  if (tipo && KG_ANALYTICS[tipo] && id !== null) renderDetalle(tipo, id);
  else { if (tipo && KG_ANALYTICS[tipo]) kgAnalyticsTipo = tipo; renderDashboard(); }
});

function contextoTipo(tipo, itemEspecifico = null) {
  const map = {
    canciones: { items: CANCIONES, registros: cargarRegistros(), campo: "cancionId" },
    artistas:  { items: ARTISTAS, registros: cargarRegistrosArtistas(), campo: "artistaId" },
    albumes:   { items: ALBUMES, registros: cargarRegistrosAlbumes(), campo: "albumId" },
    bsides:    { items: BSIDES, registros: cargarRegistrosBsides(), campo: "bsideId" },
  };
  const ctx = map[tipo];
  if (!ctx) return null;
  if (tipo === "artistas" && itemEspecifico?.categoria) {
    const ids = new Set(ARTISTAS.filter(a => a.categoria === itemEspecifico.categoria).map(a => String(a.id)));
    return {
      ...ctx,
      items: ARTISTAS.filter(a => ids.has(String(a.id))),
      registros: ctx.registros.filter(r => ids.has(String(r.artistaId))),
    };
  }
  return ctx;
}

function itemPorTipo(tipo, id) {
  return coleccionCatalogo(tipo).find(x => String(x.id) === String(id)) || null;
}

function subtituloItem(tipo, item) {
  if (tipo === "artistas") return String(item.categoria || "").replaceAll("_", " ").toUpperCase();
  return item.artista || "";
}

function registrosDelItem(tipo, id) {
  const ctx = contextoTipo(tipo);
  if (!ctx) return [];
  return ctx.registros.filter(r => String(r[ctx.campo]) === String(id));
}

function rankingAcumulado(tipo, limiteSemana = SEMANAS.length - 1, itemEspecifico = null) {
  const ctx = contextoTipo(tipo, itemEspecifico);
  if (!ctx) return [];
  const totals = new Map(ctx.items.map(x => [String(x.id), { item: x, total: 0, p1: 0, p2: 0 }]));
  ctx.registros.forEach(r => {
    const si = indiceSemanaPorId(r.semanaId);
    if (si < 0 || si > limiteSemana) return;
    const entry = totals.get(String(r[ctx.campo]));
    if (!entry) return;
    const pts = obtenerPuntajeRegistro(r);
    entry.total += pts;
    if ((r.personaId || "p1") === "p1") entry.p1 += pts;
    if (r.personaId === "p2") entry.p2 += pts;
  });
  return [...totals.values()]
    .filter(x => x.total > 0)
    .sort((a,b) => b.total - a.total || String(a.item.nombre).localeCompare(String(b.item.nombre), "es"));
}

function metricasItem(tipo, item) {
  if (!item) return null;
  if (tipo === "canciones") return calcularMetricasCanciones().get(String(item.id));
  if (tipo === "albumes") return calcularMetricasAlbumes().get(String(item.id));
  if (tipo === "bsides") return calcularMetricasBsides().get(String(item.id));
  if (tipo === "artistas") return calcularMetricasArtistas(item.categoria).get(String(item.id));
  return null;
}

function movimientoTexto(m) {
  if (!m || m.posicionActual === null) return "—";
  if (m.estadoMovimiento === "new") return "NEW";
  if (m.estadoMovimiento === "up") return `↑ ${m.movimiento}`;
  if (m.estadoMovimiento === "down") return `↓ ${Math.abs(m.movimiento)}`;
  return "—";
}

function todasLasColecciones() {
  return [
    { tipo:"canciones", items:CANCIONES, registros:cargarRegistros(), campo:"cancionId" },
    { tipo:"artistas", items:ARTISTAS, registros:cargarRegistrosArtistas(), campo:"artistaId" },
    { tipo:"albumes", items:ALBUMES, registros:cargarRegistrosAlbumes(), campo:"albumId" },
    { tipo:"bsides", items:BSIDES, registros:cargarRegistrosBsides(), campo:"bsideId" },
  ];
}

function estadisticasGlobales() {
  const colecciones = todasLasColecciones();
  const registros = colecciones.flatMap(x => x.registros);
  const totalPuntos = registros.reduce((s,r) => s + obtenerPuntajeRegistro(r), 0);
  const p1 = registros.filter(r => (r.personaId || "p1") === "p1").reduce((s,r)=>s+obtenerPuntajeRegistro(r),0);
  const p2 = registros.filter(r => r.personaId === "p2").reduce((s,r)=>s+obtenerPuntajeRegistro(r),0);
  const semanas = new Set(registros.map(r => r.semanaId).filter(Boolean)).size;
  const catalogo = colecciones.reduce((s,x)=>s+x.items.filter(i=>!i.archivado).length,0);
  return { registros:registros.length, totalPuntos, p1, p2, semanas, catalogo };
}

function topTipo(tipo, limite = 5) {
  return rankingAcumulado(tipo).slice(0, limite);
}

function topGlobalPorTipo() {
  const out = {};
  Object.keys(KG_ANALYTICS).forEach(tipo => out[tipo] = topTipo(tipo, 1)[0] || null);
  return out;
}

function mayorMovimiento() {
  const candidatos = [];
  CANCIONES.forEach(x => candidatos.push({tipo:"canciones", item:x, m:metricasItem("canciones",x)}));
  ALBUMES.forEach(x => candidatos.push({tipo:"albumes", item:x, m:metricasItem("albumes",x)}));
  BSIDES.forEach(x => candidatos.push({tipo:"bsides", item:x, m:metricasItem("bsides",x)}));
  ARTISTAS.forEach(x => candidatos.push({tipo:"artistas", item:x, m:metricasItem("artistas",x)}));
  return candidatos.filter(x => x.m?.estadoMovimiento === "up").sort((a,b)=>(b.m.movimiento||0)-(a.m.movimiento||0))[0] || null;
}

function veteranoRanking() {
  const candidatos = [];
  Object.keys(KG_ANALYTICS).forEach(tipo => {
    coleccionCatalogo(tipo).forEach(item => candidatos.push({tipo,item,m:metricasItem(tipo,item)}));
  });
  return candidatos.filter(x => x.m?.semanasEnRanking > 0).sort((a,b)=>(b.m.semanasEnRanking||0)-(a.m.semanasEnRanking||0))[0] || null;
}

function renderDashboard() {
  const root = document.getElementById("analytics-root");
  const st = estadisticasGlobales();
  const cfg = cargarConfiguracion();
  root.innerHTML = `
    <header class="analytics-head fade-up">
      <div><div class="analytics-badge">📊 KPOP GALA 2026</div><h1>Analytics</h1><p>Récords, tendencias y evolución de toda la temporada.</p></div>
      <div class="analytics-actions"><a class="analytics-btn" href="index.html">🏆 Ranking</a><a class="analytics-btn" href="semanas.html">📅 Semanas</a></div>
    </header>
    <div class="analytics-tabs fade-up delay-1" id="analytics-tabs">
      ${tabHTML("resumen","✨ Resumen")}
      ${tabHTML("canciones","🎵 Canciones")}
      ${tabHTML("artistas","⭐ Artistas")}
      ${tabHTML("albumes","💿 Álbumes")}
      ${tabHTML("bsides","🎧 B-Sides")}
    </div>
    <div id="analytics-content"></div>`;
  document.getElementById("analytics-tabs").addEventListener("click", e => {
    const btn = e.target.closest("[data-type]"); if(!btn) return;
    kgAnalyticsTipo = btn.dataset.type;
    document.querySelectorAll(".analytics-tab").forEach(x=>x.classList.toggle("active",x===btn));
    renderDashboardContenido(st,cfg);
  });
  renderDashboardContenido(st,cfg);
}

function tabHTML(tipo,label){return `<button type="button" class="analytics-tab ${kgAnalyticsTipo===tipo?"active":""}" data-type="${tipo}">${label}</button>`}

function renderDashboardContenido(st,cfg) {
  const cont = document.getElementById("analytics-content");
  if (kgAnalyticsTipo !== "resumen") return renderListadoTipo(kgAnalyticsTipo);
  const tops = topGlobalPorTipo();
  const subida = mayorMovimiento();
  const veterano = veteranoRanking();
  const totalDuel = st.p1 + st.p2 || 1;
  const pctP1 = Math.round(st.p1 / totalDuel * 100);
  cont.innerHTML = `
    <section class="analytics-grid fade-up">
      ${statHTML("Puntos totales",st.totalPuntos.toLocaleString(),"Suma de todas las categorías")}
      ${statHTML("Registros",st.registros.toLocaleString(),"Entradas guardadas en la temporada")}
      ${statHTML("Semanas activas",st.semanas,"Con al menos un registro")}
      ${statHTML("Catálogo activo",st.catalogo,"Canciones, artistas, álbumes y B-Sides")}
    </section>

    <section class="analytics-section fade-up">
      <div class="analytics-section-head"><div><h2>👥 ${escaparHTML(cfg.p1.nombre)} vs ${escaparHTML(cfg.p2.nombre)}</h2><p>Comparativa de puntos acumulados en toda la gala.</p></div></div>
      <div class="duel">
        <div class="duel-person"><small>${escaparHTML(cfg.p1.emoji)} ${escaparHTML(cfg.p1.nombre)}</small><strong>${st.p1.toLocaleString()}</strong><small>${pctP1}% de los puntos</small></div>
        <div class="duel-vs">VS</div>
        <div class="duel-person"><small>${escaparHTML(cfg.p2.emoji)} ${escaparHTML(cfg.p2.nombre)}</small><strong>${st.p2.toLocaleString()}</strong><small>${100-pctP1}% de los puntos</small></div>
        <div class="duel-bar" title="Distribución P1/P2"><div style="width:${pctP1}%"></div></div>
      </div>
    </section>

    <section class="analytics-section fade-up">
      <div class="analytics-section-head"><div><h2>🏅 Récords de temporada</h2><p>Se recalculan automáticamente usando tu historial.</p></div></div>
      <div class="analytics-records">
        ${recordHTML("🎵","Canción con más puntos",tops.canciones?.item?.nombre,tops.canciones?`${tops.canciones.total.toLocaleString()} pts · ${tops.canciones.item.artista}`:"Sin datos")}
        ${recordHTML("⭐","Artista con más puntos",tops.artistas?.item?.nombre,tops.artistas?`${tops.artistas.total.toLocaleString()} pts`:"Sin datos")}
        ${recordHTML("💿","Álbum con más puntos",tops.albumes?.item?.nombre,tops.albumes?`${tops.albumes.total.toLocaleString()} pts · ${tops.albumes.item.artista}`:"Sin datos")}
        ${recordHTML("🎧","B-Side con más puntos",tops.bsides?.item?.nombre,tops.bsides?`${tops.bsides.total.toLocaleString()} pts · ${tops.bsides.item.artista}`:"Sin datos")}
        ${recordHTML("🚀","Mayor subida reciente",subida?.item?.nombre,subida?`Subió ${subida.m.movimiento} posiciones · ${KG_ANALYTICS[subida.tipo].singular}`:"Sin movimientos todavía")}
        ${recordHTML("🗓️","Más semanas en ranking",veterano?.item?.nombre,veterano?`${veterano.m.semanasEnRanking} semanas · Peak #${veterano.m.peak}`:"Sin datos")}
      </div>
    </section>

    <div class="analytics-panels fade-up">
      ${panelTop("canciones")}${panelTop("artistas")}${panelTop("albumes")}${panelTop("bsides")}
    </div>`;
  aplicarImagenesCatalogo(cont);
}

function statHTML(label,value,sub){return `<div class="analytics-stat"><small>${label}</small><strong>${value}</strong><span>${sub}</span></div>`}
function recordHTML(icon,label,nombre,sub){return `<div class="record-card"><div class="record-icon">${icon}</div><small>${label}</small><strong>${escaparHTML(nombre||"—")}</strong><p>${escaparHTML(sub||"")}</p></div>`}

function panelTop(tipo) {
  const info=KG_ANALYTICS[tipo], rows=topTipo(tipo,5);
  return `<section class="top-panel"><h3>${info.icon} Top ${info.plural}</h3>${rows.length?rows.map((x,i)=>topRowHTML(tipo,x,i+1)).join(""):`<div class="empty-analytics">Aún no hay registros.</div>`}</section>`;
}

function imagenHTML(item, clase="") {
  const fallback = item?.imagenId ? KG_PIXEL_TRANSPARENTE : (item?.img || KG_PIXEL_TRANSPARENTE);
  return `<img class="${clase}" src="${escaparHTML(fallback)}" ${item?.imagenId?`data-kg-imagen-id="${escaparHTML(item.imagenId)}"`:""} alt="${escaparHTML(item?.nombre||"")}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"><div class="${clase?clase+" ":""}top-ph" style="display:none">${item?.categoria?"⭐":"🎵"}</div>`;
}

function topRowHTML(tipo,x,pos) {
  const item=x.item;
  return `<div class="top-row" role="link" tabindex="0" data-href="analytics.html?tipo=${tipo}&id=${encodeURIComponent(item.id)}"><div class="num">#${pos}</div><div>${imagenHTML(item)}</div><div><strong>${escaparHTML(item.nombre)}</strong><small>${escaparHTML(subtituloItem(tipo,item))}</small></div><div class="pts">${x.total.toLocaleString()} pts</div></div>`;
}

document.addEventListener("click", e => {
  const row=e.target.closest("[data-href]"); if(row) location.href=row.dataset.href;
});
document.addEventListener("keydown", e => {
  const row=e.target.closest?.("[data-href]"); if(row && (e.key==="Enter"||e.key===" ")){e.preventDefault();location.href=row.dataset.href;}
});

function renderListadoTipo(tipo) {
  const cont=document.getElementById("analytics-content");
  const info=KG_ANALYTICS[tipo];
  const ranking=rankingAcumulado(tipo);
  const rankPos=new Map(ranking.map((x,i)=>[String(x.item.id),i+1]));
  let items=[...coleccionCatalogo(tipo)].filter(x=>!x.archivado || registrosDelItem(tipo,x.id).length);
  items.sort((a,b)=>(rankPos.get(String(a.id))??9999)-(rankPos.get(String(b.id))??9999)||String(a.nombre).localeCompare(String(b.nombre),"es"));
  cont.innerHTML=`
    <section class="analytics-section fade-up">
      <div class="analytics-section-head"><div><h2>${info.icon} ${info.plural}</h2><p>Abre cualquier elemento para ver su evolución completa.</p></div></div>
      <div class="analytics-searchbar"><input id="analytics-search" type="search" placeholder="Buscar ${info.plural.toLowerCase()}..." autocomplete="off"><span id="analytics-count"></span></div>
      <div class="analytics-list" id="analytics-list"></div>
    </section>`;
  const input=document.getElementById("analytics-search");
  input.value=kgAnalyticsBusqueda;
  const pintar=()=>{
    kgAnalyticsBusqueda=input.value.trim();
    const q=normalizarClaveTexto(kgAnalyticsBusqueda);
    const filtered=items.filter(x=>!q||normalizarClaveTexto(`${x.nombre} ${subtituloItem(tipo,x)}`).includes(q));
    document.getElementById("analytics-count").textContent=`${filtered.length} elemento${filtered.length===1?"":"s"}`;
    document.getElementById("analytics-list").innerHTML=filtered.length?filtered.map(item=>analyticsItemHTML(tipo,item,rankPos.get(String(item.id))||null)).join(""):`<div class="empty-analytics">No encontramos coincidencias.</div>`;
    aplicarImagenesCatalogo(document.getElementById("analytics-list"));
  };
  input.addEventListener("input",pintar);pintar();
}

function analyticsItemHTML(tipo,item,pos){
  const regs=registrosDelItem(tipo,item.id); const total=regs.reduce((s,r)=>s+obtenerPuntajeRegistro(r),0); const m=metricasItem(tipo,item);
  const imgsrc=item.imagenId?KG_PIXEL_TRANSPARENTE:(item.img||KG_PIXEL_TRANSPARENTE);
  return `<article class="analytics-item" data-href="analytics.html?tipo=${tipo}&id=${encodeURIComponent(item.id)}"><div><img src="${escaparHTML(imgsrc)}" ${item.imagenId?`data-kg-imagen-id="${escaparHTML(item.imagenId)}"`:""} alt="${escaparHTML(item.nombre)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"><div class="ai-ph" style="display:none">${KG_ANALYTICS[tipo].icon}</div></div><div><h3>${escaparHTML(item.nombre)}</h3><p>${escaparHTML(subtituloItem(tipo,item))}</p><div class="ai-meta"><span class="analytics-pill">${pos?`#${pos}`:"Sin rank"}</span><span class="analytics-pill">Peak ${m?.peak?`#${m.peak}`:"—"}</span><span class="analytics-pill">${m?.semanasEnRanking||0} sem.</span><span class="analytics-pill">${movimientoTexto(m)}</span></div></div><div class="ai-score"><strong>${total.toLocaleString()}</strong><small>pts · ${regs.length} registros</small></div></article>`;
}

function datosHistoricosDetalle(tipo,item) {
  const ctx=contextoTipo(tipo,item); const regs=ctx.registros.filter(r=>String(r[ctx.campo])===String(item.id));
  if(!regs.length) return [];
  const indices=regs.map(r=>indiceSemanaPorId(r.semanaId)).filter(x=>x>=0); if(!indices.length)return[];
  const debut=Math.min(...indices); const ultimoGlobal=Math.max(...ctx.registros.map(r=>indiceSemanaPorId(r.semanaId)).filter(x=>x>=0));
  const hasta=Math.max(debut,ultimoGlobal);
  let acumulado=0;
  return SEMANAS.slice(debut,hasta+1).map((sem,offset)=>{
    const si=debut+offset; const semRegs=regs.filter(r=>r.semanaId===sem.id);
    const p1=semRegs.filter(r=>(r.personaId||"p1")==="p1").reduce((s,r)=>s+obtenerPuntajeRegistro(r),0);
    const p2=semRegs.filter(r=>r.personaId==="p2").reduce((s,r)=>s+obtenerPuntajeRegistro(r),0);
    const semanal=p1+p2; acumulado+=semanal;
    const ranking=rankingAcumulado(tipo,si,item); const pos=ranking.findIndex(x=>String(x.item.id)===String(item.id));
    return {semana:sem, p1,p2,semanal,acumulado,posicion:pos>=0?pos+1:null,entradas:semRegs.length};
  });
}

function renderDetalle(tipo,id) {
  const root=document.getElementById("analytics-root"); const item=itemPorTipo(tipo,id); const info=KG_ANALYTICS[tipo];
  if(!item){root.innerHTML=`<div class="empty-analytics"><h2>No encontramos este elemento</h2><p>Puede haber sido eliminado del catálogo.</p><a class="analytics-btn" href="analytics.html">← Volver a Analytics</a></div>`;return;}
  const regs=registrosDelItem(tipo,item.id); const history=datosHistoricosDetalle(tipo,item); const m=metricasItem(tipo,item);
  const total=regs.reduce((s,r)=>s+obtenerPuntajeRegistro(r),0); const p1=regs.filter(r=>(r.personaId||"p1")==="p1").reduce((s,r)=>s+obtenerPuntajeRegistro(r),0); const p2=regs.filter(r=>r.personaId==="p2").reduce((s,r)=>s+obtenerPuntajeRegistro(r),0);
  const ranking=rankingAcumulado(tipo,SEMANAS.length-1,item); const pos=ranking.findIndex(x=>String(x.item.id)===String(item.id));
  const best=history.filter(x=>x.semanal>0).sort((a,b)=>b.semanal-a.semanal)[0]||null;
  const imgsrc=item.imagenId?KG_PIXEL_TRANSPARENTE:(item.img||KG_PIXEL_TRANSPARENTE);
  root.innerHTML=`
    <header class="analytics-head fade-up"><div><div class="analytics-badge">${info.icon} PERFIL DE ${info.singular.toUpperCase()}</div></div><div class="analytics-actions"><a class="analytics-btn" href="analytics.html?tipo=${tipo}">← ${info.plural}</a><a class="analytics-btn" href="index.html">🏆 Ranking</a></div></header>
    <section class="detail-hero fade-up"><div><img class="detail-cover" src="${escaparHTML(imgsrc)}" ${item.imagenId?`data-kg-imagen-id="${escaparHTML(item.imagenId)}"`:""} alt="${escaparHTML(item.nombre)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"><div class="detail-cover" style="display:none">${info.icon}</div></div><div><h1>${escaparHTML(item.nombre)}</h1><div class="sub">${escaparHTML(subtituloItem(tipo,item))}</div><div class="detail-badges"><span class="detail-badge">${item.archivado?"📦 Archivado":"🟢 Activo"}</span><span class="detail-badge">${item.origen==="custom"?"Añadido desde la app":"Catálogo base"}</span>${best?`<span class="detail-badge">🔥 Mejor semana: ${best.semana.id}</span>`:""}</div></div></section>
    <section class="detail-kpis fade-up">
      ${detailKpi("Ranking actual",pos>=0?`#${pos+1}`:"—")}${detailKpi("Puntos",total.toLocaleString())}${detailKpi("Peak",m?.peak?`#${m.peak}`:"—")}${detailKpi("Semanas",m?.semanasEnRanking||0)}${detailKpi("Movimiento",movimientoTexto(m))}${detailKpi("Registros",regs.length)}
    </section>
    <section class="analytics-section fade-up"><div class="analytics-section-head"><div><h2>👥 Reparto de puntos</h2><p>Contribución acumulada de cada participante.</p></div></div>${duelDetalle(p1,p2)}</section>
    <section class="analytics-section fade-up"><div class="analytics-section-head"><div><h2>📈 Evolución</h2><p>La posición usa el ranking acumulado al cierre de cada semana.</p></div></div><div class="chart-grid"><div class="chart-card"><h3>Posición en ranking</h3><p>Más arriba = mejor posición.</p>${graficaSVG(history.map(x=>({label:x.semana.id,value:x.posicion})),true,"var(--violeta)")}</div><div class="chart-card"><h3>Puntos por semana</h3><p>Puntos obtenidos durante cada semana.</p>${graficaSVG(history.map(x=>({label:x.semana.id,value:x.semanal})),false,"var(--rosa)")}</div></div></section>
    <section class="analytics-section fade-up"><div class="analytics-section-head"><div><h2>📋 Historial semanal</h2><p>${history.length?`${history.length} semanas desde el debut.`:"Aún no hay historial para mostrar."}</p></div></div>${tablaHistorial(history)}</section>`;
  aplicarImagenesCatalogo(root); aplicarConfiguracionUI();
}

function detailKpi(label,value){return `<div class="detail-kpi"><small>${label}</small><strong>${value}</strong></div>`}
function duelDetalle(p1,p2){const cfg=cargarConfiguracion();const total=p1+p2||1;const pct=Math.round(p1/total*100);return `<div class="duel"><div class="duel-person"><small>${escaparHTML(cfg.p1.emoji)} ${escaparHTML(cfg.p1.nombre)}</small><strong>${p1.toLocaleString()}</strong><small>${pct}%</small></div><div class="duel-vs">VS</div><div class="duel-person"><small>${escaparHTML(cfg.p2.emoji)} ${escaparHTML(cfg.p2.nombre)}</small><strong>${p2.toLocaleString()}</strong><small>${100-pct}%</small></div><div class="duel-bar"><div style="width:${pct}%"></div></div></div>`}

function graficaSVG(datos,invertir=false,color="var(--violeta)") {
  const validos=datos.filter(x=>Number.isFinite(x.value)); if(!validos.length)return `<div class="chart-empty">Aún no hay suficientes datos.</div>`;
  const W=620,H=240,pad={l:42,r:18,t:20,b:34}; const vals=validos.map(x=>x.value); let min=Math.min(...vals),max=Math.max(...vals); if(min===max){min=Math.max(0,min-1);max=max+1;}
  if(!invertir) min=Math.min(0,min);
  const xAt=i=>pad.l+(i/Math.max(datos.length-1,1))*(W-pad.l-pad.r);
  const yVal=v=>{const t=(v-min)/(max-min||1);return invertir?pad.t+t*(H-pad.t-pad.b):H-pad.b-t*(H-pad.t-pad.b)};
  const pts=datos.map((d,i)=>Number.isFinite(d.value)?`${xAt(i).toFixed(1)},${yVal(d.value).toFixed(1)}`:null).filter(Boolean);
  const grid=[0,.25,.5,.75,1].map(t=>{const y=pad.t+t*(H-pad.t-pad.b);const value=invertir?min+t*(max-min):max-t*(max-min);return `<line class="kg-gridline" x1="${pad.l}" y1="${y}" x2="${W-pad.r}" y2="${y}"/><text class="kg-label" x="4" y="${y+3}">${Math.round(value)}</text>`}).join("");
  const every=Math.max(1,Math.ceil(datos.length/7)); const labels=datos.map((d,i)=>i%every===0||i===datos.length-1?`<text class="kg-label" text-anchor="middle" x="${xAt(i)}" y="${H-10}">${d.label}</text>`:"").join("");
  const dots=datos.map((d,i)=>Number.isFinite(d.value)?`<circle class="kg-dot" cx="${xAt(i)}" cy="${yVal(d.value)}" r="4"><title>${d.label}: ${d.value}</title></circle>`:"").join("");
  const area=pts.length>1?`${pts[0].split(',')[0]},${H-pad.b} ${pts.join(' ')} ${pts[pts.length-1].split(',')[0]},${H-pad.b}`:"";
  return `<svg class="kg-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfica de evolución" style="color:${color}">${grid}${area?`<polygon class="kg-area" points="${area}" fill="currentColor"/>`:""}<polyline class="kg-line" points="${pts.join(' ')}"/>${dots}${labels}</svg>`;
}

function tablaHistorial(history){if(!history.length)return `<div class="empty-analytics">Aún no hay registros para este elemento.</div>`;return `<div class="history-wrap"><table class="history-table"><thead><tr><th>Semana</th><th class="num">P1</th><th class="num">P2</th><th class="num">Semana</th><th class="num">Acumulado</th><th class="num">Ranking</th></tr></thead><tbody>${history.slice().reverse().map(x=>`<tr><td><strong>${x.semana.id}</strong><br><small>${escaparHTML(x.semana.label.replace(/^Semana \d+ · /,""))}</small></td><td class="num">${x.p1}</td><td class="num">${x.p2}</td><td class="num">+${x.semanal}</td><td class="num">${x.acumulado}</td><td class="num">${x.posicion?`#${x.posicion}`:"—"}</td></tr>`).join("")}</tbody></table></div>`}
