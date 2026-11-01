import fs from 'node:fs/promises';import path from 'node:path';import vm from 'node:vm';import {fileURLToPath} from 'node:url';import {parse} from 'parse5';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
async function files(dir){const out=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isSymbolicLink())throw Error('Symlink in publication: '+f);out.push(...e.isDirectory()?await files(f):[f]);}return out;}
function* nodes(n){yield n;for(const c of n.childNodes||[])yield* nodes(c);}
const all=await files(root),pages=new Map(),errors=[];let total=0,links=0;
for(const file of all){const rel=path.relative(root,file),size=(await fs.stat(file)).size;total+=size;
 if(!/\.(html|js|css|json|svg|jpg|png|ogg|xml)$/.test(file)&&rel!=='.nojekyll')errors.push('Unapproved publication type: '+rel);
 if(size>20*1024*1024)errors.push('Unexpected large file: '+rel);
 if(file.endsWith('.js')){const text=await fs.readFile(file,'utf8');try{new vm.Script(text,{filename:rel});}catch(e){errors.push(e.message);}if(/\.download\s*=|createObjectURL|extracted\/|install media|\.bin\b|\.cue\b|\.rom\b/i.test(text))errors.push('Resource/export boundary violation: '+rel);}
 if(!file.endsWith('.html'))continue;
 const text=await fs.readFile(file,'utf8'),tree=parse(text),ids=new Set(),refs=[];
 if(/[\u2014]|&mdash;|&#8212;/i.test(text))errors.push('Em dash in public copy: '+rel);
 if(/\bthe user\b|not a claim that/i.test(text))errors.push('Internal or unwanted prose: '+rel);
 for(const n of nodes(tree)){const a=new Map((n.attrs||[]).map(x=>[x.name,x.value]));if(a.has('download'))errors.push('Download control: '+rel);if(a.has('id')){if(ids.has(a.get('id')))errors.push('Duplicate ID '+a.get('id')+' in '+rel);ids.add(a.get('id'));}for(const k of ['href','src','poster'])if(a.has(k))refs.push(a.get(k));}
 pages.set(rel,{ids,refs});
}
if(total>40*1024*1024)errors.push('Publication exceeds the reviewed 40 MiB budget');
for(const[file,{refs}]of pages)for(const ref of refs){if(!ref||/^(https?:|mailto:|data:)/.test(ref))continue;const url=new URL(ref,'https://local/'+file);let target=path.join(root,decodeURIComponent(url.pathname));if(!target.startsWith(root+path.sep)&&target!==root){errors.push('Escaping path: '+ref);continue;}try{if((await fs.stat(target)).isDirectory())target=path.join(target,'index.html');await fs.stat(target);links++;const rel=path.relative(root,target),hash=decodeURIComponent(url.hash.slice(1));if(hash&&!/^(models|maps|corridors)\//.test(rel)&&pages.has(rel)&&!pages.get(rel).ids.has(hash))errors.push('Missing fragment '+ref+' from '+file);}catch{errors.push('Missing link '+ref+' from '+file);}}
const context=vm.createContext({});for(const[f,n]of [['models','INFERNO_DATA'],['maps','INFERNO_WORLD'],['corridors','INFERNO_CORRIDORS']]){vm.runInContext(await fs.readFile(path.join(root,'viewer',f,'data.js'),'utf8'),context);const d=vm.runInContext(n,context);if(f==='models'&&(d.models.length!==1691||d.models.some(m=>m.path)))errors.push('Wrong model snapshot scope');if(f==='maps'&&(d.environments.length!==31||d.missions||d.environments.some(e=>Buffer.from(e.cells_b64,'base64').length!==80000||e.config.text)))errors.push('Wrong world snapshot scope');if(f==='corridors'&&d.profiles.length!==64)errors.push('Wrong corridor snapshot scope');}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`Checked ${pages.size} pages, ${links} local links, scripts and publication scope (${(total/1048576).toFixed(1)} MiB).`);
