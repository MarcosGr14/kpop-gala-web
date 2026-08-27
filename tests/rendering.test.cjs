const test=require('node:test');
const assert=require('node:assert/strict');
const {harness,element}=require('./helpers/harness.cjs');
const payload='<img src=x onerror=alert(1)>';
const badId="x');alert(1);//\"<svg>";
test('HTML helper escapes text and both attribute delimiters without changing source',()=>{
 const h=harness();h.context.value='A&B<>"\'';
 assert.equal(h.run('escaparHTML(value)'),'A&amp;B&lt;&gt;&quot;&#039;');
 assert.equal(h.context.value,'A&B<>"\'');
});
for(const [type,collection,save,field,render,id]of [
 ['song','CANCIONES','guardarRegistros','cancionId','renderHistorial','historial-list'],
 ['album','ALBUMES','guardarRegistrosAlbumes','albumId','renderHistorialAlbumes','historial-albumes-list'],
 ['artist','ARTISTAS','guardarRegistrosArtistas','artistaId','renderHistorialArtistas','historial-artistas-list'],
 ['bside','BSIDES','guardarRegistrosBsides','bsideId','renderHistorialBsides','historial-bsides-list']
])test(type+' history escapes catalog, fields and ids; no inline action code',()=>{
 const h=harness();h.load('registro.js');h.context.payload=payload;h.context.badId=badId;
 h.document.getElementById('semana-global').value='S01';
 h.run(collection+'[0].nombre=payload;'+collection+'[0].artista=payload;'+collection+'[0].categoria=payload');
 h.run(save+"([{id:badId,"+field+":"+collection+"[0].id,personaId:payload,semanaId:'S01',posSpotify:payload,reproducciones:payload}]);"+render+"()");
 const html=h.document.getElementById(id).children.at(-1).innerHTML;
 assert.ok(html.includes('&lt;img'));
 assert.equal(html.includes(payload),false);assert.equal(html.includes(badId),false);
 assert.equal(html.includes('onclick='),false);assert.ok(html.includes('data-kg-id='));
 assert.ok(html.includes('btn-edit'));assert.ok(html.includes('btn-delete'));
 assert.equal(h.run(collection+'[0].nombre'),payload);
});
test('Semanas escapes legacy positions, titles, artist and image attributes',()=>{
 const h=harness();h.load('semanas.js');h.context.payload=payload;h.context.badId=badId;
 h.run('CANCIONES[0].nombre=payload;CANCIONES[0].artista=payload;CANCIONES[0].img=payload');
 const html=h.run("renderTabla([{id:badId,cancionId:CANCIONES[0].id,posicion:payload}])");
 assert.equal(html.includes(payload),false);assert.equal(html.includes(badId),false);
 assert.equal(html.includes('onclick='),false);assert.ok(html.includes('&lt;img'));
 assert.ok(html.includes('str-del-btn'));
});
test('catalog image source cannot inject a new attribute',()=>{
 const h=harness();h.load('catalogo.js');h.context.payload='x" onload="alert(1)';
 h.run('CANCIONES[0].img=payload;CANCIONES[0].nombre=payload');
 const html=h.run('cardCatalogo(CANCIONES[0])');
 assert.equal(html.includes(' onload="'),false);
 assert.ok(html.includes('&quot;'));
});
test('toasts treat messages as text in Registrar and Semanas',()=>{
 for(const [file,fn]of [['registro.js','mostrarToast'],['semanas.js','mostrarToastSemanas']]){
  const h=harness();h.load(file);h.context.payload=payload;h.run(fn+'(payload)');
  const html=h.document.getElementById('toast-container').children.at(-1).innerHTML;
  assert.equal(html.includes(payload),false);assert.ok(html.includes('&lt;img'));
 }
});
test('delegated actions pass opaque IDs unchanged and install once',async()=>{
 const h=harness();h.context.root=element();h.context.received=[];h.context.actions={edit:id=>h.context.received.push(id)};
 h.run('conectarAccionesDatos(root,actions);conectarAccionesDatos(root,actions)');
 const button=element();button.dataset={kgAccion:'edit',kgId:badId};h.context.root.appendChild(button);
 await h.context.root.emit('click',{target:{closest:()=>button}});
 assert.deepEqual(h.context.received,[badId]);
 button.dataset.kgAccion='constructor';
 await h.context.root.emit('click',{target:{closest:()=>button}});
 assert.deepEqual(h.context.received,[badId]);
});
test('Analytics SVG labels and existing card renderers escape user content',()=>{
 const h=harness();h.load('analytics.js');h.context.payload=payload;
 assert.equal(h.run('graficaSVG([{label:payload,value:10}])').includes(payload),false);
 h.run('CANCIONES[0].nombre=payload;CANCIONES[0].artista=payload');
 assert.equal(h.run("analyticsItemHTML('canciones',CANCIONES[0],1)").includes(payload),false);
});
test('Hall and season cards retain escaping of user-supplied text',()=>{
 const h=harness();h.context.payload=payload;h.load('hall-of-fame.js');h.load('temporadas.js');
 assert.equal(h.run("cardGanador('canciones',{nombre:payload,subtitulo:payload,img:payload})").includes(payload),false);
 assert.equal(h.run("cardTemporada({...obtenerTemporadaActiva(),nombre:payload},true)").includes(payload),false);
});
test('Undo action remains retryable after callback returns false',async()=>{
 const h=harness();h.run("globalThis.attempts=0;mostrarDeshacer('Test',()=>++attempts>1)");
 const toast=h.document.body.children.at(-1),button=toast.querySelector('.kg-undo-btn');
 await button.emit('click');await button.emit('click');
 assert.equal(h.run('attempts'),2);
});

