const test=require('node:test');
const assert=require('node:assert/strict');
const {harness}=require('./helpers/harness.cjs');
const cases=[
 {fn:'guardarEntrada',save:'guardarRegistros',key:'kpop_gala_registros',field:'cancionId',item:'CANCIONES[0].id',select:'cancion',form:'form',edit:'editandoCancionId',person:'personaEditando'},
 {fn:'guardarEntradaAlbum',save:'guardarRegistrosAlbumes',key:'kpop_gala_albumes_registros',field:'albumId',item:'ALBUMES[0].id',select:'album',form:'form-album',edit:'editandoAlbumId',person:'personaEditandoAlbum'},
 {fn:'guardarEntradaArtista',save:'guardarRegistrosArtistas',key:'kpop_gala_artistas_registros',field:'artistaId',item:'ARTISTAS[0].id',select:'artista',form:'form-artista',edit:'editandoArtistaId',person:'personaEditandoArtista'},
 {fn:'guardarEntradaBside',save:'guardarRegistrosBsides',key:'kpop_gala_bsides_registros',field:'bsideId',item:'BSIDES[0].id',select:'bside',form:'form-bside',edit:'editandoBsideId',person:'personaEditandoBside'}
];
function setup(c,pid){
 const h=harness();h.load('registro.js');
 h.document.getElementById('semana-global').value='S01';
 h.document.getElementById(c.select+'-'+pid).value=String(h.run(c.item));
 h.run("globalThis.messages=[];mostrarToast=(text,type)=>messages.push({text,type});globalThis.undo=null;mostrarDeshacer=(msg,fn)=>undo=fn");
 for(const name of ['renderHistorial','renderHistorialAlbumes','renderHistorialArtistas','renderHistorialBsides','actualizarPreview','actualizarPreviewAlbum','actualizarPreviewArtista','actualizarPreviewBside'])h.run(name+'=()=>{}');
 return h;
}
for(const c of cases)for(const pid of ['p1','p2']){
 test(c.fn+' '+pid+': failed create preserves form and can retry',()=>{
  const h=setup(c,pid);h.storage.fail=k=>k===c.key;
  h.run(c.fn+"('"+pid+"')");
  assert.equal(h.document.getElementById(c.form+'-'+pid).resetCount,0);
  assert.equal(h.run("messages.some(x=>x.type==='success')"),false);
  assert.equal(h.storage.getItem(c.key),null);
  h.storage.fail=null;h.run(c.fn+"('"+pid+"')");
  assert.equal(h.document.getElementById(c.form+'-'+pid).resetCount,1);
  assert.equal(JSON.parse(h.storage.getItem(c.key))[0].personaId,pid);
 });
 test(c.fn+' '+pid+': failed edit retains edit state and stored bytes',()=>{
  const h=setup(c,pid);
  h.run(c.save+"([{id:'old',"+c.field+":"+c.item+",personaId:'"+pid+"',semanaId:'S01',puntaje:44}]);"+c.edit+"='old';"+c.person+"='"+pid+"'");
  const before=h.storage.getItem(c.key);h.storage.fail=k=>k===c.key;
  h.run(c.fn+"('"+pid+"')");
  assert.equal(h.storage.getItem(c.key),before);
  assert.equal(h.run(c.edit),'old');
  assert.equal(h.document.getElementById(c.form+'-'+pid).resetCount,0);
  assert.equal(h.run("messages.some(x=>x.type==='success')"),false);
 });
 test(c.fn+' '+pid+': closed season rejects writes',()=>{
  const h=setup(c,pid);h.run("cerrarTemporada('2026')");
  const before=h.storage.getItem(c.key);h.run(c.fn+"('"+pid+"')");
  assert.equal(h.storage.getItem(c.key),before);
  assert.equal(h.document.getElementById(c.form+'-'+pid).resetCount,0);
 });
}
test('failed delete never advertises undo or success; failed undo can retry',()=>{
 const h=setup(cases[0],'p1');
 h.run("guardarRegistros([{id:'old',cancionId:CANCIONES[0].id,semanaId:'S01',puntaje:10}])");
 const before=h.storage.getItem('kpop_gala_registros');
 h.storage.fail=k=>k==='kpop_gala_registros';
 h.run("eliminarRegistro('old')");
 assert.equal(h.storage.getItem('kpop_gala_registros'),before);assert.equal(h.run('undo'),null);
 h.storage.fail=null;h.run("eliminarRegistro('old')");
 assert.equal(h.run('cargarRegistros().length'),0);
 h.storage.fail=k=>k==='kpop_gala_registros';
 assert.equal(h.run('undo()'),false);
 assert.equal(h.run("messages.some(x=>x.type==='success')"),false);
 h.storage.fail=null;h.run('undo()');
 assert.equal(h.storage.getItem('kpop_gala_registros'),before);
});
test('Semanas deletion/undo checks persistence and backup first',()=>{
 const h=harness();h.load('semanas.js');
 h.run("globalThis.undo=null;globalThis.messages=[];mostrarToastSemanas=(text,type)=>messages.push(type);mostrarDeshacer=(text,fn)=>undo=fn;renderOpcionesSemana=()=>{};actualizarVista=()=>{};guardarRegistros([{id:'old'}])");
 const before=h.storage.getItem('kpop_gala_registros');
 h.storage.fail=k=>k==='kpop_gala_backup_last_safety';h.run("eliminarEnSemana('old')");
 assert.equal(h.storage.getItem('kpop_gala_registros'),before);assert.equal(h.run('undo'),null);
 h.storage.fail=null;h.run("eliminarEnSemana('old')");
 h.storage.fail=k=>k==='kpop_gala_registros';assert.equal(h.run('undo()'),false);
 assert.equal(h.run("messages.includes('success')"),false);
});
test('catalog and season modifications stop when prior backup cannot be saved',()=>{
 const h=harness();const before=h.storage.snapshot();
 h.storage.fail=k=>k==='kpop_gala_backup_last_safety';
 assert.throws(()=>h.run("guardarItemCatalogo('canciones',{nombre:'Test'})"),/respaldo/);
 assert.throws(()=>h.run("crearTemporada({anio:2027,inicio:'2027-06-01',fin:'2027-12-06'})"),/respaldo/);
 assert.deepEqual(h.storage.snapshot(),before);
});
test('explicit Hall recalculation cannot erase manual results on failed save',()=>{
 const h=harness();h.load('hall-of-fame.js');
 h.run("guardarHallOfFameManual('2026',{canciones:CANCIONES[0].id});globalThis.messages=[];toastHall=(text,type)=>messages.push(type);renderHall=()=>{}");
 const before=h.storage.getItem('kpop_gala_hall_of_fame_v2');
 h.storage.fail=k=>k==='kpop_gala_hall_of_fame_v2';h.run('usarRankingHall()');
 assert.equal(h.storage.getItem('kpop_gala_hall_of_fame_v2'),before);
 assert.equal(h.run("messages.includes('success')"),false);
});
test('existing save helpers still return boolean failure',()=>{
 const h=harness();h.storage.fail=()=>true;
 for(const fn of ['guardarRegistros','guardarRegistrosArtistas','guardarRegistrosAlbumes','guardarRegistrosBsides','guardarTemporadas','guardarHallOfFame','guardarConfiguracion','guardarCatalogoPersonalizado']){
  assert.equal(h.run(fn+'([])'),false);
 }
});

