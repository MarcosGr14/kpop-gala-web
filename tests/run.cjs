const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const tests=fs.readdirSync(__dirname).filter(name=>name.endsWith('.test.cjs')).sort().map(name=>path.join(__dirname,name));
const result=spawnSync(process.execPath,['--test',...tests],{stdio:'inherit',shell:false});
process.exit(result.status??1);

