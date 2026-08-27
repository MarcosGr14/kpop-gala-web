const {harness}=require('./helpers/harness.cjs');
const h=harness();
h.load('registro.js');
h.document.getElementById('semana-global').value='S01';
h.document.getElementById('cancion-p1').value=String(h.run('CANCIONES[0].id'));
h.run("globalThis.messages=[];mostrarToast=(msg,type)=>messages.push(type);renderHistorial=()=>{};actualizarPreview=()=>{}");
h.storage.fail=key=>key==='kpop_gala_registros';
h.run("guardarEntrada('p1')");
console.log('Failed save: success toast =',h.run("messages.includes('success')"),'; form resets =',h.document.getElementById('form-p1').resetCount);
const r=harness({kpop_gala_registros:'[{"id":"original"}]',kpop_gala_artistas_registros:'[{"id":"original-artist"}]'});
r.storage.fail=key=>key==='kpop_gala_artistas_registros';
try {r.run("restaurarSnapshotDatos({canciones:[],artistas:[],albumes:[],bsides:[]})");} catch {}
console.log('Failed restore: original songs preserved =',r.storage.getItem('kpop_gala_registros')==='[{"id":"original"}]');

