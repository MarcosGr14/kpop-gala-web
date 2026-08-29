const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'../kpop-gala-web');
const pages=['index','registro','semanas','analytics','catalogo','temporadas','hall-of-fame','datos'];
const hrefs=pages.map(x=>x+'.html');

test('the eight pages share one complete app-shell navigation contract',()=>{
 for(const page of pages){
  const html=fs.readFileSync(path.join(root,page+'.html'),'utf8');
  const nav=html.match(/<nav class="navbar"[\s\S]*?<\/nav>/)?.[0];
  assert.ok(nav,`${page}: navbar missing`);
  assert.match(nav,/aria-label="Navegación principal"/);
  assert.match(nav,/class="nav-menu-toggle"[^>]+aria-expanded="false"[^>]+aria-controls="primary-navigation"/);
  assert.match(nav,/class="nav-more-toggle"[^>]+aria-expanded="false"[^>]+aria-controls="secondary-navigation"/);
  const actual=[...nav.matchAll(/class="nav-link" href="([^"]+)"/g)].map(x=>x[1]);
  assert.deepEqual(actual,hrefs,`${page}: destinations/order`);
  const currents=[...nav.matchAll(/<a class="nav-link" href="([^"]+)" aria-current="page">/g)].map(x=>x[1]);
  assert.deepEqual(currents,[page+'.html'],`${page}: aria-current`);
  if(['catalogo','temporadas','hall-of-fame','datos'].includes(page))assert.match(nav,/nav-more nav-has-current/);
  const scripts=[...html.matchAll(/<script src="js\/([^"]+)"><\/script>/g)].map(x=>x[1]);
  assert.ok(scripts.includes('navigation.js'),`${page}: navigation.js missing`);
  assert.ok(scripts.indexOf('data.js')<scripts.indexOf('navigation.js'),`${page}: shared UI order`);
 }
});

test('navigation module is independent from persistent storage and domain state',()=>{
 const js=fs.readFileSync(path.join(root,'js/navigation.js'),'utf8');
 assert.doesNotMatch(js,/localStorage|indexedDB|seasonId|puntaje|ranking/i);
 assert.match(js,/aria-expanded/);
 assert.match(js,/event\.key !== "Escape"/);
});
