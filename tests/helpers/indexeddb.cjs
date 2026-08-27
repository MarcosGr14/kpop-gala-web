// Minimal transactional IndexedDB double, entirely in memory. Not a browser emulator.
class MemoryIndexedDB {
  constructor() { this.records=new Map(); this.failPut=null; this.failCommit=false; this.failOpen=false; this.connections=0; }
  open() {
    const req={};
    setImmediate(()=>{
      if(this.failOpen){req.error=new Error('Simulated IDB open failure');req.onerror?.();return;}
      this.connections++;
      const owner=this;
      const db={
        objectStoreNames:{contains:()=>true},
        close(){owner.connections--;},
        transaction(store,mode){
          const staged=new Map(owner.records);const queue=[];let ended=false;
          const tx={error:null};
          tx.abort=()=>{
            if(ended)return;ended=true;
            setImmediate(()=>tx.onabort?.());
          };
          tx.objectStore=()=>({
            get(id){const r={};queue.push(()=>{r.result=staged.has(id)?structuredClone(staged.get(id)):undefined;r.onsuccess?.();});return r;},
            put(value){
              const r={};queue.push(()=>{
                if(owner.failPut?.(value)){tx.error=new Error('Simulated IDB write failure');r.error=tx.error;r.onerror?.();tx.onerror?.();tx.abort();return;}
                staged.set(value.id,structuredClone(value));r.result=value.id;r.onsuccess?.();
              });return r;
            }
          });
          const pump=()=>{
            if(ended)return;
            if(queue.length){queue.shift()();setImmediate(pump);return;}
            if(mode==='readwrite'&&owner.failCommit){tx.error=new Error('Simulated commit abort');tx.abort();return;}
            ended=true;
            if(mode==='readwrite')owner.records=staged;
            tx.oncomplete?.();
          };
          setImmediate(pump);return tx;
        }
      };
      req.result=db;req.onsuccess?.();
    });
    return req;
  }
}
function installIDB(h) {
  const idb=new MemoryIndexedDB();
  h.context.indexedDB=idb;
  h.context.FileReader=class {
    readAsDataURL(blob){
      blob.arrayBuffer().then(bytes=>{
        this.result='data:'+blob.type+';base64,'+Buffer.from(bytes).toString('base64');
        this.onload?.();
      },()=>this.onerror?.());
    }
  };
  return idb;
}
module.exports={MemoryIndexedDB,installIDB};

