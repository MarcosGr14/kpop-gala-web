const test = require('node:test');
const assert = require('node:assert/strict');
const { harness } = require('./helpers/harness.cjs');

test('modern scoring: all positions, zero/out of range and 200-play cap', () => {
  const h = harness();
  for (let p=1;p<=15;p++) assert.equal(h.run('calcularPuntajeEntrada('+p+',0,0)'),16-p);
  assert.equal(h.run('calcularPuntajeEntrada(1,1,999)'),230);
  assert.equal(h.run('calcularPuntajeEntrada(16,0,20)'),20);
  assert.equal(h.run('calcularPuntajeEntrada("2","3","10")'),37);
});
test('legacy scoring and stored-score fallback', () => {
  const h=harness();
  assert.equal(h.run('calcularPuntajeEntrada(1,250)'),215);
  assert.equal(h.run('obtenerPuntajeRegistro({posicion:2,reproducciones:10})'),24);
  assert.equal(h.run('obtenerPuntajeRegistro({puntaje:77})'),77);
  assert.equal(h.run('obtenerPuntajeRegistro({posSpotify:1,reproducciones:5,puntaje:99})'),20);
});
test('legacy season is interpreted without rewriting original bytes', () => {
  const raw='[ {"id":"legacy", "semanaId":"S01", "cancionId":1, "posicion":1, "reproducciones":5} ]';
  const h=harness({kpop_gala_registros:raw});
  assert.equal(h.run('obtenerIdTemporadaRegistro(cargarRegistros()[0])'),'2026');
  assert.equal(h.run('filtrarRegistrosTemporada(cargarRegistros(),"2026").length'),1);
  assert.equal(h.storage.getItem('kpop_gala_registros'),raw);
});
test('2026/2027 isolation across all four rankings and stable participants', () => {
  const h=harness();
  for (const [save,rank,id] of [
    ['guardarRegistros','calcularRanking','cancionId:CANCIONES[0].id'],
    ['guardarRegistrosAlbumes','calcularRankingAlbumes','albumId:ALBUMES[0].id'],
    ['guardarRegistrosBsides','calcularRankingBsides','bsideId:BSIDES[0].id'],
    ['guardarRegistrosArtistas','calcularRankingArtistasGeneral','artistaId:ARTISTAS[0].id']
  ]) {
    h.run(save+"([{"+id+",personaId:'p1',semanaId:'S01',puntaje:10},{"+id+",personaId:'p2',semanaId:'S01',seasonId:'2027',puntaje:30}])");
    assert.equal(h.run(rank+"('2026')[0].puntajeTotal"),10);
    assert.equal(h.run(rank+"('2027')[0].puntajeTotal"),30);
  }
  h.run("guardarConfiguracion({p1:{nombre:'Nuevo nombre',emoji:'🌸'}})");
  assert.equal(h.run('cargarRegistros()[0].personaId'),'p1');
});
test('season creation, activation, close and reopen preserve 2026', () => {
  const h=harness({kpop_gala_registros:'[{"id":"old","semanaId":"S01","cancionId":1,"puntaje":10}]'});
  const original=h.storage.getItem('kpop_gala_registros');
  h.run("crearTemporada({anio:2027,inicio:'2027-06-01',fin:'2027-12-06'});activarTemporada('2027')");
  assert.equal(h.run('obtenerTemporadaActivaId()'),'2027');
  h.run("cerrarTemporada('2027')");
  assert.equal(h.run("temporadaEstaCerrada('2027')"),true);
  h.run("reabrirTemporada('2027');activarTemporada('2026')");
  assert.equal(h.run("temporadaEstaCerrada('2027')"),false);
  assert.equal(h.storage.getItem('kpop_gala_registros'),original);
  assert.throws(()=>h.run("eliminarTemporada('2026')"));
});
test('catalog combines base, overrides and custom entries with stable ids', () => {
  const h=harness(); const count=h.run('CANCIONES.length');
  h.run("globalThis.custom=guardarItemCatalogo('canciones',{nombre:'Nueva',artista:'Prueba'})");
  const id=h.run('custom.id');
  h.run("guardarItemCatalogo('canciones',{nombre:'Editada',artista:'Prueba'},custom.id)");
  assert.equal(h.run('CANCIONES.length'),count+1);
  assert.equal(h.run("obtenerItemCatalogo('canciones',custom.id).id"),id);
  h.run("guardarItemCatalogo('canciones',{nombre:'Override'},CANCIONES_BASE[0].id)");
  assert.equal(h.run('CANCIONES[0].nombre'),'Override');
  assert.notEqual(h.run('CANCIONES_BASE[0].nombre'),'Override');
});
test('archiving preserves history and referenced items cannot be deleted', () => {
  const h=harness();
  h.run("globalThis.custom=guardarItemCatalogo('canciones',{nombre:'Nueva',artista:'Prueba'});guardarRegistros([{cancionId:custom.id,semanaId:'S01',puntaje:10}]);cambiarArchivoItemCatalogo('canciones',custom.id,true)");
  assert.equal(h.run('CANCIONES.find(x=>x.id===custom.id).archivado'),true);
  assert.equal(h.run('calcularRanking()[0].puntajeTotal'),10);
  assert.throws(()=>h.run("eliminarItemCatalogo('canciones',custom.id)"));
  assert.equal(h.run('cargarRegistros().length'),1);
  h.run("globalThis.artist=guardarItemCatalogo('artistas',{nombre:'Relacionado'});guardarItemCatalogo('albumes',{nombre:'Disco',artista:'Relacionado',artistaId:artist.id})");
  assert.throws(()=>h.run("eliminarItemCatalogo('artistas',artist.id)"));
});
test('v1.x backup alias keeps current optional settings and legacy shape', () => {
  const h=harness(); h.run("guardarConfiguracion({p1:{nombre:'Marcos'}})");
  const result=h.json("restaurarSnapshotDatos({registros:[{id:'old',posicion:1,reproducciones:20}],artistas:[],albumes:[],bsides:[]})");
  assert.equal(result.canciones,1);
  assert.equal(h.run('cargarConfiguracion().p1.nombre'),'Marcos');
  assert.equal(h.run('cargarRegistros()[0].seasonId'),undefined);
});
test('v2 snapshot roundtrip includes catalog, settings, seasons and manual Hall', () => {
  const h=harness();
  h.run("crearTemporada({anio:2027,inicio:'2027-06-01',fin:'2027-12-06'});activarTemporada('2027');guardarItemCatalogo('canciones',{nombre:'Nueva',artista:'Prueba'});guardarHallOfFameManual('2027',{canciones:CANCIONES[0].id});globalThis.snapshot=crearSnapshotDatos();restaurarSnapshotDatos(snapshot)");
  assert.equal(h.run('obtenerTemporadaActivaId()'),'2027');
  assert.equal(h.run('cargarCatalogoPersonalizado().canciones.length'),1);
  assert.equal(h.run("cargarHallOfFame()['2027'].modo"),'manual');
  assert.equal(h.run('obtenerUltimoBackupSeguridad().motivo'),'antes_de_restaurar');
});
test('malformed backup is rejected before any write', () => {
  const h=harness(); const before=h.storage.snapshot();
  assert.throws(()=>h.run('restaurarSnapshotDatos({canciones:[]})'));
  assert.deepEqual(h.storage.snapshot(),before);
});
test('automatic Hall follows leader; manual Hall survives close and recalculation', () => {
  const h=harness();
  h.run("guardarRegistros([{cancionId:CANCIONES[1].id,semanaId:'S01',puntaje:50}]);guardarHallOfFameAutomatico('2026')");
  assert.equal(h.run("cargarHallOfFame()['2026'].ganadores.canciones.id"),h.run('CANCIONES[1].id'));
  h.run("guardarHallOfFameManual('2026',{canciones:CANCIONES[0].id});cerrarTemporada('2026');reabrirTemporada('2026');guardarHallOfFameAutomatico('2026')");
  assert.equal(h.run("cargarHallOfFame()['2026'].ganadores.canciones.id"),h.run('CANCIONES[0].id'));
});
test('metrics: peak, weeks since debut, up/down/new and isolation', () => {
  const h=harness();
  h.run("guardarRegistros([{cancionId:CANCIONES[0].id,semanaId:'S01',puntaje:20},{cancionId:CANCIONES[1].id,semanaId:'S01',puntaje:10},{cancionId:CANCIONES[1].id,semanaId:'S02',puntaje:30},{cancionId:CANCIONES[2].id,semanaId:'S02',puntaje:5},{cancionId:CANCIONES[0].id,semanaId:'S01',seasonId:'2027',puntaje:500}])");
  const m=h.json('Array.from(calcularMetricasCanciones("2026").values()).slice(0,3)');
  assert.equal(m[0].estadoMovimiento,'down'); assert.equal(m[0].peak,1);
  assert.equal(m[0].semanasEnRanking,2); assert.equal(m[1].movimiento,1);
  assert.equal(m[1].posicionActual,1); assert.equal(m[2].estadoMovimiento,'new');
});
test('Analytics reads requested season without changing active season', () => {
  const h=harness();
  h.run("crearTemporada({anio:2027,inicio:'2027-06-01',fin:'2027-12-06'});guardarRegistros([{cancionId:CANCIONES[0].id,semanaId:'S01',puntaje:10},{cancionId:CANCIONES[0].id,semanaId:'S01',seasonId:'2027',puntaje:30}])");
  h.load('analytics.js');
  h.run("kgAnalyticsSeasonId='2027';KG_ANALYTICS_SEMANAS=obtenerSemanasTemporada('2027')");
  assert.equal(h.run("rankingAcumulado('canciones')[0].total"),30);
  assert.equal(h.run('obtenerTemporadaActivaId()'),'2026');
});

