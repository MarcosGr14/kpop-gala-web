(() => {
  const results=document.getElementById('results');
  const button=document.getElementById('run');
  const memory=new Map();
  let failKey=null;
  const isolatedStorage={
    getItem:key=>memory.get(String(key))??null,
    setItem(key,value){if(key===failKey)throw new Error('Fallo simulado');memory.set(String(key),String(value));},
    removeItem:key=>memory.delete(String(key))
  };
  const nativeIDB=window.indexedDB;
  const database='kpop_gala_test_'+crypto.randomUUID();
  // If either override fails, do not load production code.
  try {
    Object.defineProperty(window,'localStorage',{value:isolatedStorage});
    Object.defineProperty(window,'indexedDB',{value:{
      open(name,version){
        if(name!=='kpop_gala_media')throw new Error('Base inesperada');
        return nativeIDB.open(database,version);
      }
    }});
    if(window.localStorage!==isolatedStorage)throw new Error('Aislamiento no disponible');
  } catch(e){results.textContent='ERROR de aislamiento: '+e.message;return;}
  const source=document.createElement('script');source.src='/data.js';
  source.onload=()=>{results.textContent='Aislamiento listo. No se accede al almacenamiento real de KPop Gala.';button.disabled=false;};
  source.onerror=()=>{results.textContent='ERROR al cargar data.js';};
  document.head.appendChild(source);
  button.addEventListener('click',async()=>{
    button.disabled=true;results.textContent='';
    const log=text=>{results.textContent+=text+'\n';};
    const assert=(condition,message)=>{if(!condition)throw new Error(message);};
    const img=(id,content)=>({id,type:'image/png',dataUrl:'data:image/png;base64,'+btoa(content)});
    const incoming={data:{canciones:[{id:'new',cancionId:1,semanaId:'S01',puntaje:9}],artistas:[],albumes:[],bsides:[]},media:{imagenes:[img('native','new')]}};
    try{
      guardarRegistros([{id:'original'}]);
      await importarImagenesCatalogo([img('native','old')]);
      const before=localStorage.getItem('kpop_gala_registros');
      failKey='kpop_gala_artistas_registros';
      let rejected=false;
      try{await restaurarBackupCompleto(incoming);}catch{rejected=true;}
      failKey=null;
      assert(rejected,'La restauración fallida no fue rechazada');
      assert(localStorage.getItem('kpop_gala_registros')===before,'Registros no recuperados');
      assert(await (await obtenerRegistroImagen('native')).blob.text()==='old','Imagen no recuperada tras aborto');
      log('PASS · Fallo de localStorage aborta la transacción nativa y recupera registros e imagen.');
      const result=await restaurarBackupCompleto(incoming);
      assert(result.registros.canciones===1,'Resultado inválido');
      assert(await (await obtenerRegistroImagen('native')).blob.text()==='new','Commit de imagen ausente');
      log('PASS · Restauración completa confirma datos e imágenes.');
      const previous=obtenerUltimoBackupSeguridad();
      await restaurarBackupCompleto(previous);
      assert(cargarRegistros()[0].id==='original','Respaldo previo no recuperó registros');
      assert(await (await obtenerRegistroImagen('native')).blob.text()==='old','Respaldo previo no recuperó imagen');
      log('PASS · Respaldo previo recupera también una portada sobrescrita.');
      const host=document.createElement('div');
      const payload='<img src=x onerror="window.__unsafe=true">';
      host.innerHTML=escaparHTML(payload)+htmlBotonAccion('edit',payload,'btn-edit','✏️','Editar');
      assert(host.querySelector('img')===null,'Se interpretó HTML inyectado');
      assert(host.querySelector('button').dataset.kgId===payload,'ID alterado');
      assert(!host.querySelector('button').hasAttribute('onclick'),'Handler inline');
      let received=null;conectarAccionesDatos(host,{edit:id=>received=id});
      host.querySelector('button').click();
      assert(received===payload,'Acción no recibió el ID');
      log('PASS · DOM nativo conserva texto e IDs sin ejecutar HTML; acción delegada funciona.');
      results.dataset.status='passed';
      log('4/4 pruebas nativas aprobadas.');
    }catch(e){results.dataset.status='failed';log('FAIL · '+e.message);}
    finally{
      await new Promise((resolve,reject)=>{
        const request=nativeIDB.deleteDatabase(database);
        request.onsuccess=resolve;request.onerror=()=>reject(request.error);
        request.onblocked=()=>reject(new Error('Base de prueba bloqueada'));
      }).then(()=>log('Base temporal eliminada.'),e=>{results.dataset.status='failed';log('FAIL limpieza: '+e.message);});
    }
  });
})();
