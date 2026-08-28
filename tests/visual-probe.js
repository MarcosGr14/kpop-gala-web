// DOM-only probes for the isolated visual frame. No browser storage is read.
(() => {
 const errors=[];
 addEventListener('error',e=>{if(e.message)errors.push(e.message);});
 addEventListener('unhandledrejection',e=>errors.push(String(e.reason)));
 const report=()=>{
  const width=document.documentElement.clientWidth;
  const visible=el=>{
   const rect=el.getBoundingClientRect();if(!rect.width||!rect.height)return false;
   for(let n=el;n&&n!==document;n=n.parentElement){const s=getComputedStyle(n);if(s.display==='none'||s.visibility==='hidden'||s.opacity==='0')return false;}
   return true;
  };
  const overflow=[...document.querySelectorAll('body *')].filter(visible).map(el=>({el,rect:el.getBoundingClientRect()})).filter(x=>x.rect.right>width+2||x.rect.left< -2).map(x=>({selector:x.el.id?'#'+x.el.id:x.el.tagName.toLowerCase()+'.'+[...x.el.classList].join('.'),right:Math.round(x.rect.right)}));
  const surfaces=[...document.querySelectorAll('.form-card,.rank-card,.catalog-item,.data-card,.analytics-stat,.season-card,.hof-card')].slice(0,3).map(el=>({class:el.className,background:getComputedStyle(el).backgroundColor}));
  const result={page:location.pathname,width,isolated:document.documentElement.dataset.isolated==='true',heading:document.querySelector('h1')?.textContent||'',background:getComputedStyle(document.body).backgroundColor,errors,surfaces,overflow,forms:document.forms.length,images:document.images.length};
  document.documentElement.dataset.visualReady='true';
  parent.postMessage({kind:'visual-report',report:result},location.origin);
 };
 addEventListener('load',()=>document.fonts.ready.then(()=>setTimeout(report,650)),{once:true});
})();
