// Only serves the isolated test page and data.js; never serves the workspace.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const files={
 '/': ['text/html; charset=utf-8',path.join(__dirname,'browser-smoke.html')],
 '/smoke.js':['text/javascript; charset=utf-8',path.join(__dirname,'browser-smoke.js')],
 '/data.js':['text/javascript; charset=utf-8',path.join(__dirname,'../kpop-gala-web/js/data.js')]
};
const server=http.createServer((req,res)=>{
 const file=files[req.url];
 if(!file){res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':file[0],'Cache-Control':'no-store'});
 res.end(fs.readFileSync(file[1]));
});
server.listen(0,'127.0.0.1',()=>console.log('ISOLATED_TEST_URL=http://127.0.0.1:'+server.address().port));

