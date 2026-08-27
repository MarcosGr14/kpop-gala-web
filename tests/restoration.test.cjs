const test=require('node:test');
const assert=require('node:assert/strict');
const {harness}=require('./helpers/harness.cjs');
const {installIDB}=require('./helpers/indexeddb.cjs');
const keys=['kpop_gala_registros','kpop_gala_artistas_registros','kpop_gala_albumes_registros','kpop_gala_bsides_registros','kpop_gala_settings','kpop_gala_catalog_v1','kpop_gala_seasons_v2','kpop_gala_hall_of_fame_v2','kpop_gala_active_season_v2'];
const image=(id,text)=>({id,nombre:id,type:'image/png',dataUrl:'data:image/png;base64,'+Buffer.from(text).toString('base64')});
function setup(){
 const h=harness({kpop_gala_registros:'[ {"id":"old", "puntaje":9} ]'});
 const other=harness();
 other.run("crearTemporada({anio:2027,inicio:'2027-06-01',fin:'2027-12-06'});activarTemporada('2027');guardarRegistros([{id:'new',seasonId:'2027',cancionId:CANCIONES[0].id,semanaId:'S01',puntaje:99}]);guardarConfiguracion({p1:{nombre:'Importado'}});guardarItemCatalogo('canciones',{nombre:'Importada',artista:'Prueba'});guardarHallOfFameManual('2027',{canciones:CANCIONES[0].id})");
 h.context.imported=other.json('crearSnapshotDatos()');
 return h;
}
const state=h=>Object.fromEntries(keys.map(k=>[k,h.storage.getItem(k)]));
for(const key of keys)test('restore rolls back exact previous values when '+key+' fails',()=>{
 const h=setup(),before=state(h);h.storage.fail=k=>k===key;
 assert.throws(()=>h.run('restaurarSnapshotDatos(imported)'),/estado anterior/);
 assert.deepEqual(state(h),before);
 assert.equal(h.run('obtenerUltimoBackupSeguridad().data.canciones[0].id'),'old');
 assert.equal(h.run('CANCIONES.some(x=>x.nombre==="Importada")'),false);
});
test('restore stops if prior backup cannot be stored',async()=>{
 const h=setup();installIDB(h);const before=h.storage.snapshot();
 h.storage.fail=k=>k==='kpop_gala_backup_last_safety';
 await assert.rejects(h.run('restaurarBackupCompleto(imported)'),/respaldo previo/);
 assert.deepEqual(h.storage.snapshot(),before);
});
test('unrecoverable rollback is reported honestly and safety snapshot remains',()=>{
 const h=setup(),raw=h.storage.getItem(keys[0]);
 h.storage.fail=(k,v)=>k===keys[1]||(k===keys[0]&&v===raw);
 let error;try{h.run('restaurarSnapshotDatos(imported)');}catch(e){error=e;}
 assert.match(error.message,/no se pudo recuperar todo/);
 assert.ok(error.clavesSinRecuperar.includes(keys[0]));
 assert.equal(h.run('obtenerUltimoBackupSeguridad().data.canciones[0].id'),'old');
});
test('IDB midway failure commits neither images nor local collections',async()=>{
 const h=setup(),idb=installIDB(h),before=state(h);
 h.context.imported.media={imagenes:[image('one','a'),image('two','b')]};
 idb.failPut=x=>x.id==='two';
 await assert.rejects(h.run('restaurarBackupCompleto(imported)'));
 assert.deepEqual(state(h),before);assert.equal(idb.records.size,0);assert.equal(idb.connections,0);
});
test('IDB commit abort compensates already-written localStorage',async()=>{
 const h=setup(),idb=installIDB(h),before=state(h);
 h.context.imported.media={imagenes:[image('one','a')]};idb.failCommit=true;
 await assert.rejects(h.run('restaurarBackupCompleto(imported)'),/estado anterior/);
 assert.deepEqual(state(h),before);assert.equal(idb.records.size,0);assert.equal(idb.connections,0);
});
test('localStorage failure aborts image transaction including overwritten blobs',async()=>{
 const h=setup(),idb=installIDB(h),before=state(h);
 idb.records.set('one',{id:'one',blob:new Blob(['old'],{type:'image/png'}),type:'image/png'});
 h.context.imported.media={imagenes:[image('one','new'),image('two','new')]};
 h.storage.fail=k=>k===keys[4];
 await assert.rejects(h.run('restaurarBackupCompleto(imported)'),/estado anterior/);
 assert.deepEqual(state(h),before);
 assert.equal(await idb.records.get('one').blob.text(),'old');
 assert.equal(idb.records.has('two'),false);
 assert.equal(idb.connections,0);
});
test('complete restore and previous safety snapshot recover overwritten images',async()=>{
 const h=setup(),idb=installIDB(h),before=state(h);
 idb.records.set('one',{id:'one',blob:new Blob(['old'],{type:'image/png'}),type:'image/png'});
 h.context.imported.media={imagenes:[image('one','new')]};
 const result=await h.run('restaurarBackupCompleto(imported)');
 assert.equal(result.registros.canciones,1);assert.equal(result.imagenes,1);
 assert.equal(await idb.records.get('one').blob.text(),'new');
 h.context.previous=h.json('obtenerUltimoBackupSeguridad()');
 assert.equal(h.context.previous.media.imagenes.length,1);
 await h.run('restaurarBackupCompleto(previous)');
 assert.equal(await idb.records.get('one').blob.text(),'old');
 assert.equal(h.run('cargarRegistros()[0].id'),'old');
});
test('invalid media is rejected before writes, without fetching URLs',async()=>{
 for(const bad of [{id:'x',dataUrl:'https://example.invalid/image.png'},{id:'x',dataUrl:'data:text/html;base64,WA=='},{id:'x',dataUrl:'broken'}]){
  const h=setup();installIDB(h);const before=h.storage.snapshot();
  h.context.imported.media={imagenes:[bad]};
  await assert.rejects(h.run('restaurarBackupCompleto(imported)'));
  assert.deepEqual(h.storage.snapshot(),before);
 }
});
test('image import uses one atomic transaction and invalidates URL cache',async()=>{
 const h=harness(),idb=installIDB(h);
 h.context.images=[image('x','bytes')];
 h.run('kgObjectUrlCache.set("x","blob:obsolete")');
 assert.equal(await h.run('importarImagenesCatalogo(images)'),1);
 assert.equal(h.run('kgObjectUrlCache.has("x")'),false);
 assert.equal(await idb.records.get('x').blob.text(),'bytes');
});
test('Hall-only cover remains included in exported media',async()=>{
 const h=harness(),idb=installIDB(h);
 idb.records.set('historic',{id:'historic',blob:new Blob(['old'],{type:'image/png'}),type:'image/png'});
 h.run("guardarHallOfFame({'2026':{modo:'manual',ganadores:{canciones:{id:1,nombre:'Old',imagenId:'historic'}}}})");
 const images=await h.run('exportarImagenesCatalogo()');
 assert.equal(images.length,1);assert.equal(images[0].id,'historic');
});
test('concurrent complete restore is rejected and lock is released after failure',async()=>{
 const h=setup(),idb=installIDB(h);
 h.context.imported.media={imagenes:[image('x','bytes')]};idb.failPut=()=>true;
 const first=h.run('restaurarBackupCompleto(imported)');
 await assert.rejects(h.run('restaurarBackupCompleto(imported)'),/en curso/);
 await assert.rejects(first);
 idb.failPut=null;await h.run('restaurarBackupCompleto(imported)');
 assert.equal(h.run('kgRestauracionEnCurso'),false);
});
test('failed season close rolls back Hall and status together',()=>{
 const h=harness();const before=state(h);
 h.storage.fail=k=>k==='kpop_gala_seasons_v2';
 assert.throws(()=>h.run("cerrarTemporada('2026')"));
 assert.deepEqual(state(h),before);
});
test('failed season deletion restores season, active id and Hall',()=>{
 const h=setup();h.run('restaurarSnapshotDatos(imported);guardarRegistros([])');
 const before=state(h);h.storage.fail=k=>k==='kpop_gala_active_season_v2';
 assert.throws(()=>h.run("eliminarTemporada('2027')"));
 assert.deepEqual(state(h),before);
});
test('Datos import handler shows no success and re-enables controls after failed restore',async()=>{
 const h=setup();installIDB(h);h.load('backup.js');
 h.run("renderEstadoDatos=()=>{};renderPerfiles=()=>{};aplicarConfiguracionUI=()=>{};globalThis.messages=[];mostrarMensaje=(text,type)=>messages.push(type)");
 h.ready.at(-1)();
 const file={name:'backup.json',text:async()=>JSON.stringify(h.context.imported)};
 h.document.getElementById('input-importar').files=[file];
 await h.document.getElementById('input-importar').emit('change');
 const before=state(h);h.storage.fail=k=>k===keys[1];
 await h.document.getElementById('btn-importar').emit('click');
 assert.deepEqual(state(h),before);
 assert.equal(h.run("messages.includes('success')"),false);
 assert.equal(h.document.getElementById('btn-importar').disabled,false);
});


test('null rows and malformed optional catalog are rejected before replacing data',()=>{
 for(const mutation of [x=>x.data.canciones=[null],x=>x.catalog.canciones=['bad'],x=>x.seasons=[null],x=>x.settings=[]]){
  const h=setup();mutation(h.context.imported);const before=h.storage.snapshot();
  assert.throws(()=>h.run('restaurarSnapshotDatos(imported)'),/inválida/);
  assert.deepEqual(h.storage.snapshot(),before);
 }
});
test('standalone catalog image save rejects on transaction abort and closes database',async()=>{
 const h=harness(),idb=installIDB(h);idb.failCommit=true;
 h.context.file=new Blob(['test'],{type:'image/png'});
 await assert.rejects(h.run('guardarImagenCatalogo(file)'));
 assert.equal(idb.records.size,0);assert.equal(idb.connections,0);
});
test('a backup with no media does not need IndexedDB at all',async()=>{
 const h=setup();
 const result=await h.run('restaurarBackupCompleto(imported)');
 assert.equal(result.imagenes,0);
 assert.equal(h.run('cargarRegistros()[0].id'),'new');
});

