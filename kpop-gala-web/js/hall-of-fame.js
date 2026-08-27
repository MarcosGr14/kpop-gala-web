// ============================================================
// KPOP GALA — HALL-OF-FAME.JS · v2.0
// ============================================================
const HOF_META={canciones:{award:"SONG OF THE YEAR",icon:"🎵"},artistas:{award:"ARTIST OF THE YEAR",icon:"⭐"},albumes:{award:"ALBUM OF THE YEAR",icon:"💿"},bsides:{award:"B-SIDE OF THE YEAR",icon:"🎧"}};
let hofSeasonId=obtenerTemporadaActivaId();

document.addEventListener("DOMContentLoaded",()=>{
  const q=new URLSearchParams(location.search).get("season");if(q&&obtenerTemporadaPorId(q))hofSeasonId=q;
  poblarTemporadasHall();renderHall();
  document.getElementById("hof-season").addEventListener("change",e=>{hofSeasonId=e.target.value;history.replaceState(null,"",`hall-of-fame.html?season=${encodeURIComponent(hofSeasonId)}`);renderHall()});
  document.getElementById("hof-save").addEventListener("click",guardarManualHall);
  document.getElementById("hof-auto").addEventListener("click",usarRankingHall);
});

function poblarTemporadasHall(){const sel=document.getElementById("hof-season");sel.innerHTML=cargarTemporadas().slice().sort((a,b)=>b.anio-a.anio).map(t=>`<option value="${escaparHTML(t.id)}">${escaparHTML(t.nombre)}</option>`).join("");sel.value=hofSeasonId}

function renderHall(){
  const temp=obtenerTemporadaPorId(hofSeasonId);if(!temp)return;
  const hall=obtenerHallOfFameTemporada(hofSeasonId,true);
  const mode=hall.provisional?"PROVISIONAL":hall.modo==="manual"?"PERSONALIZADO":temp.estado==="cerrada"?"GUARDADO AL CIERRE":"GUARDADO DEL RANKING";
  document.getElementById("hof-status").textContent=`${temp.estado==="cerrada"?"🔒 Cerrada":"● Abierta"} · ${mode}`;
  document.getElementById("hof-analytics-link").href=`analytics.html?season=${encodeURIComponent(hofSeasonId)}`;
  document.getElementById("hof-hero").innerHTML=`<small>👑 ${mode}</small><h2>${escaparHTML(temp.nombre)}</h2><p>${escaparHTML(rangoTemporadaTexto(temp))} · ${hall.provisional?"Los líderes cambian automáticamente mientras la temporada siga avanzando.":`Guardado ${hall.savedAt?new Date(hall.savedAt).toLocaleString("es-PA"):""}.`}</p>`;
  document.getElementById("hof-winners").innerHTML=["canciones","artistas","albumes","bsides"].map(tipo=>cardGanador(tipo,hall.ganadores?.[tipo])).join("");
  poblarEditorHall(hall.ganadores||{});aplicarImagenesCatalogo(document.getElementById("hof-winners"));
}

function cardGanador(tipo,w){const m=HOF_META[tipo];if(!w)return `<div class="hof-empty"><div><div style="font-size:2rem">${m.icon}</div><strong>${m.award}</strong><div>Sin ganador todavía</div></div></div>`;const src=w.imagenId?KG_PIXEL_TRANSPARENTE:(w.img||KG_PIXEL_TRANSPARENTE);return `<article class="hof-card"><div><img class="hof-cover" src="${escaparHTML(src)}" ${w.imagenId?`data-kg-imagen-id="${escaparHTML(w.imagenId)}"`:""} alt="${escaparHTML(w.nombre)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"><div class="hof-cover" style="display:none">${m.icon}</div></div><div class="hof-card-body"><span class="hof-award">${m.award}</span><h3>${escaparHTML(w.nombre)}</h3><p>${escaparHTML(w.subtitulo||"")}</p><span class="hof-points">${Number(w.puntos||0).toLocaleString()} pts</span></div></article>`}

function opcionesTipo(tipo){const items=coleccionCatalogo(tipo).slice().sort((a,b)=>String(a.nombre).localeCompare(String(b.nombre),"es"));return `<option value="">— Sin ganador —</option>`+items.map(x=>`<option value="${escaparHTML(x.id)}">${escaparHTML(x.nombre)}${tipo==="artistas"?"":` — ${escaparHTML(x.artista||"")}`}</option>`).join("")}
function poblarEditorHall(ganadores){["canciones","artistas","albumes","bsides"].forEach(tipo=>{const sel=document.getElementById(`hof-${tipo}`);sel.innerHTML=opcionesTipo(tipo);if(ganadores[tipo]?.id!==undefined&&ganadores[tipo]?.id!==null)sel.value=String(ganadores[tipo].id)})}
function seleccionesHall(){return {canciones:document.getElementById("hof-canciones").value,artistas:document.getElementById("hof-artistas").value,albumes:document.getElementById("hof-albumes").value,bsides:document.getElementById("hof-bsides").value}}
function guardarManualHall(){try{guardarHallOfFameManual(hofSeasonId,seleccionesHall());renderHall();toastHall("Hall of Fame guardado","success")}catch(e){toastHall(e.message||"No se pudo guardar","error")}}
function usarRankingHall(){try{guardarBackupSeguridad("antes_de_recalcular_hall");const hall=cargarHallOfFame();delete hall[hofSeasonId];guardarHallOfFame(hall);guardarHallOfFameAutomatico(hofSeasonId);renderHall();toastHall("Ganadores actualizados según el ranking","success")}catch(e){toastHall(e.message||"No se pudo recalcular","error")}}
function toastHall(msg,tipo="success"){const el=document.getElementById("hof-toast");el.textContent=msg;el.className=`hof-toast visible ${tipo}`;clearTimeout(toastHall.timer);toastHall.timer=setTimeout(()=>el.classList.remove("visible"),4300)}
