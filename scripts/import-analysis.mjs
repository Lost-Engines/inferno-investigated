// Optional, explicit import. CI builds only the committed display snapshot.
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.resolve(process.argv[2]||'../inferno-reverse','analysis');
const dest=path.join(root,'public/viewer');
const provenance={format:1,reference:'English retail CD 1.58; retained grids from the compared editions',sources:{}};
async function read(file){const b=await fs.readFile(path.join(source,file));provenance.sources[file]=crypto.createHash('sha256').update(b).digest('hex');return b.toString();}
async function write(file,text){const target=path.join(dest,file);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,text);}
async function data(file,name,adapt=v=>v){const c=vm.createContext({});vm.runInContext(await read(file),c);const d=adapt(vm.runInContext(name,c));await write(file,`const ${name}=${JSON.stringify(d)};\n`);return d;}
function replace(text,from,to){if(!text.includes(from))throw Error('Adapter needs review: '+from.slice(0,90));return text.replace(from,to);}
// Rendering code is separate from game files. No recursive copy from the research tree.
for(const file of ['models/model.js','models/effects.js','models/raster.js','models/preview.js','maps/world.js','shared/textures.js','shared/triangulate.js','shared/scene.js','corridors/geometry.js'])await write(file,await read(file));
const models=await data('models/data.js','INFERNO_DATA',d=>{for(const m of d.models){delete m.path;delete m.parameter_warnings;}return d;});
const world=await data('maps/data.js','INFERNO_WORLD',d=>({environments:d.environments.map(e=>({name:e.name,width:e.width,height:e.height,cell_units:e.cell_units,cells_b64:e.cells_b64,tiles:e.tiles,occupied_cells:e.occupied_cells,config:{mode:e.config.mode,palettes:e.config.palettes,references:e.config.references,night:e.config.night}})),objects:Object.fromEntries(Object.entries(d.objects).map(([id,o])=>[id,{names:o.names,flags:o.flags,anchors:o.anchors,parts:o.parts,draw_parts:o.draw_parts}]))}));
await data('corridors/data.js','INFERNO_CORRIDORS',d=>({profiles:d.profiles.map(p=>({index:p.index,nodes:p.nodes,paths:p.paths,routes:p.routes,camera:p.camera,containment:p.containment,invalid_paths:p.invalid_paths,scenery:p.scenery.map(s=>({names:s.names})),locations:p.locations})),normal_radius:d.normal_radius,small_radius:d.small_radius}));
let viewer=await read('models/viewer.js');
viewer=replace(viewer,'${model.path} · ${model.size.toLocaleString()} bytes · ${model.instructions.length.toLocaleString()} instructions · name: ${model.name_status}','${model.instructions.length.toLocaleString()} drawing commands · ${model.levels.length} detail levels');
viewer=replace(viewer,"let yaw=.65,pitch=.35,zoom=1","let yaw=.65,pitch=.35,zoom=1");
viewer=viewer.replace("'../resources/", "'../models/");
await write('models/viewer.js',viewer);
let corridors=await read('corridors/viewer.js');
corridors=replace(corridors,"link.href='../scenery/index.html#'+name;link.textContent='Inspect scenery program';","const model=InfernoWorld.models.get(InfernoWorld.parts(name)[0]?.name);link.href='../models/'+(model?'#'+model.id:'');link.textContent='Explore the model parts';");
corridors += `\naddEventListener('hashchange',()=>{const n=Number(location.hash.slice(1));if(Number.isInteger(n)&&n>=0&&n<64&&n!==active.index){active=InfernoCorridor.profiles[n];select();}});\n`;
await write('corridors/viewer.js',corridors);
provenance.scope={models:models.models.length,grids:world.environments.length,corridor_profiles:64,description:'Decoded display data and adapted viewers only. No executable, original archive, install media, ROM, source-asset download or exporter.'};
await fs.writeFile(path.join(root,'content/data-provenance.json'),JSON.stringify(provenance,null,2)+'\n');
console.log(`Imported ${models.models.length} display models and ${world.environments.length} grids.`);
