// Read-only visual harness. App storage exists only in each frame's Map.
// Run: node tests/visual-server.cjs. Baseline defaults to the audited commit.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {harness}=require('./helpers/harness.cjs');
const root=path.resolve(__dirname,'../kpop-gala-web');
const pages=['index','registro','semanas','catalogo','analytics','datos','temporadas','hall-of-fame'].map(x=>x+'.html');
const sources=new Set([...pages,...['css','js'].flatMap(dir=>fs.readdirSync(path.join(root,dir)).map(f=>dir+'/'+f))]);
const baseline='3fee375',cache=new Map();
const h=harness();
for(const [save,list,id] of [['guardarRegistros','CANCIONES','cancionId'],['guardarRegistrosAlbumes','ALBUMES','albumId'],['guardarRegistrosBsides','BSIDES','bsideId'],['guardarRegistrosArtistas','ARTISTAS','artistaId']]) {
 h.run(`${save}(${list}.slice(0,3).flatMap((x,i)=>['p1','p2'].flatMap((p,j)=>['S01','S02'].map((s,k)=>({id:'visual_'+p+'_'+s+'_'+i,${id}:x.id,personaId:p,semanaId:s,posSpotify:i+1,posInstafest:i+2,reproducciones:80-i*15+j*8+k*5})))));`);
}
const seed=h.storage.snapshot();
function read(version,relative){
 if(version==='current'||relative.startsWith('assets/'))return fs.readFileSync(path.join(root,relative));
 if(!cache.has(relative))cache.set(relative,execFileSync('git',['show',baseline+':kpop-gala-web/'+relative],{cwd:path.dirname(root),maxBuffer:4*1024*1024}));
 return cache.get(relative);
}
function isolate(html,empty){
 const scripts=[...html.matchAll(/<script src="js\/[^"<>]+"><\/script>/g)].map(x=>x[0]).join('');
 html=html.replace(/<script src="js\/[^"<>]+"><\/script>/g,'');
 const bootstrap=`<script>
 try {
  const values=new Map(Object.entries(${JSON.stringify(empty?{}:seed)}));
  const memory={getItem:k=>values.get(String(k))??null,setItem:(k,v)=>values.set(String(k),String(v)),removeItem:k=>values.delete(String(k)),clear:()=>values.clear(),key:i=>[...values.keys()][i]??null,get length(){return values.size}};
  Object.defineProperty(window,'localStorage',{value:memory});
  Object.defineProperty(window,'indexedDB',{value:{open(){throw new Error('IndexedDB disabled in visual tests')}}});
  if(window.localStorage!==memory)throw new Error('Isolation failed');
  document.documentElement.dataset.isolated='true';
  document.write(${JSON.stringify(scripts).replaceAll('</script>','<\\/script>')});
 } catch(e) { document.body.textContent='ISOLATION ERROR: '+e.message; }
 </script><script src="/visual-probe.js"></script>`;
 return html.replace('</body>',bootstrap+'</body>');
}
const server=http.createServer((req,res)=>{
 try {
  const u=new URL(req.url,'http://127.0.0.1');
  if(u.pathname==='/'){
   const page=u.searchParams.get('page')||'index.html',version=u.searchParams.get('version')==='baseline'?'baseline':'current';
   const width=Number(u.searchParams.get('width'))||1280;
   if(!pages.includes(page)||![320,375,768,1280].includes(width)){res.writeHead(400).end();return;}
   const options=new URLSearchParams();for(const k of ['empty','system','tipo','id'])if(u.searchParams.has(k))options.set(k,u.searchParams.get(k));
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
   res.end(`<!doctype html><html><meta charset="utf-8"><title>Visual QA</title><body style="margin:0;background:#09090c;color:#ddd;font:12px system-ui"><p style="margin:8px">DATOS FICTICIOS · ${version} · ${page} · ${width}px</p><iframe title="KPop Gala aislado" src="/${version}/${page}?${options}" style="width:${width}px;height:1000px;border:0;display:block"></iframe><pre id="report" style="white-space:pre-wrap">Cargando…</pre><script>addEventListener('message',e=>{if(e.source===document.querySelector('iframe').contentWindow&&e.origin===location.origin&&e.data.kind==='visual-report'){document.getElementById('report').textContent=JSON.stringify(e.data.report);document.body.dataset.ready='true';}})</script></body></html>`);return;
  }
  if(u.pathname==='/visual-probe.js'){res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store'}).end(fs.readFileSync(path.join(__dirname,'visual-probe.js')));return;}
  const match=u.pathname.match(/^\/(current|baseline)\/(.+)$/);if(!match){res.writeHead(404).end();return;}
  const [,version,relative]=match;
  const target=path.resolve(root,relative);
  if(!target.startsWith(root+path.sep)||(!sources.has(relative)&&!/^assets\/[\w /().-]+\.(png|jpg|jpeg|webp|svg)$/i.test(relative))){res.writeHead(404).end();return;}
  const type={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'}[path.extname(relative)];
  if(!type){res.writeHead(404).end();return;}
  let content=read(version,relative);
  if(relative.endsWith('.html'))content=isolate(content.toString('utf8'),u.searchParams.has('empty'));
  const headers={'Content-Type':type,'Cache-Control':'no-store'};
  if(u.searchParams.has('system'))headers['Content-Security-Policy']="font-src 'none'; style-src 'self' 'unsafe-inline'";
  res.writeHead(200,headers).end(content);
 }catch(e){res.writeHead(404).end('Not available');}
});
server.listen(0,'127.0.0.1',()=>console.log('VISUAL_TEST_URL=http://127.0.0.1:'+server.address().port));
