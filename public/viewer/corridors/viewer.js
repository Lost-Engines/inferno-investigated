'use strict';
const $=id=>document.getElementById(id);
let active=InfernoCorridor.profiles[Math.max(0,Math.min(63,Number(location.hash.slice(1))||0))],scene;
try{scene=new InfernoScene($('scene'));}catch(e){$('status').textContent=e.message;}
for(const p of InfernoCorridor.profiles)$('profile').add(new Option(`${p.index} · ${p.containment} · ${p.nodes.length} nodes${p.invalid_paths.length?' · placeholder':''}`,p.index));
$('palette').add(new Option('Automatic · scenery colours',''));
for(const name of Object.keys(INFERNO_DATA.palettes).sort())$('palette').add(new Option(name,name));
function paletteKey(name){
 if($('palette').value)return $('palette').value;
 const names=[name,...InfernoWorld.parts(name).map(p=>p.name)];
 if(names.some(n=>/^(?:rex|rx|rc_|rcemp)/.test(n)))return 'rexc1';
 if(names.some(n=>/^(?:fed|fc_|fcor)/.test(n)))return 'fedc1';
 return INFERNO_DATA.default_palette;
}
function sceneryLinks(name){
 const target=$('scenery-link');target.replaceChildren();
 if(!name)return;
 const programBase=target.dataset.programBase;
 if(programBase){const link=document.createElement('a');link.href=programBase+name;link.textContent='Scenery program';target.append(link,' · ');}
 const parts=[...new Set(InfernoWorld.parts(name).map(p=>p.name))];
 target.append('Model parts: ');
 for(const [index,part]of parts.entries()){
  if(index)target.append(', ');
  const model=InfernoWorld.models.get(part);
  if(!model){target.append(part+' (unresolved)');continue;}
  const link=document.createElement('a');link.href='../models/index.html#'+model.id;link.textContent=part;target.append(link);
 }
}
function render(reset=false){
 const rotation=+$('rotation').value,radius=+$('radius').value,name=$('object').value;
 const preview=InfernoCorridor.scenery(name,active,rotation,$('drawing-context').value);
 const visible=$('surfaces').checked,mesh=visible?preview.mesh:{faces:[],lines:[],points:[],warnings:new Set()};
 const description=[];
 if(!name)description.push('No scenery is assigned to this profile.');
 else if(!visible)description.push('Scenery is hidden. Enable Scenery surfaces to show it.');
 else if(preview.count)description.push(`${preview.mesh.faces.length} surfaces · ${preview.mesh.lines.length} lines · ${preview.mesh.points.length} points. Drawing from a ${preview.context}.`);
 else if(preview.alternative)description.push(`This scenery draws from a ${preview.alternative}. Choose Automatic or From a ${preview.alternative}.`);
 else description.push('This profile assignment has no static scenery preview. Its model parts are linked above.');
 if(visible&&mesh.warnings.size)description.push([...mesh.warnings].join('; '));
 $('scenery-status').textContent=description.join(' ');
 InfernoCorridor.append(mesh,active,[0,0,0],rotation,radius,$('cage').checked);
 const probe=['x','y','z'].map(id=>Number($(id).value)||0),result=InfernoCorridor.contains(active,probe,rotation,radius);
 $('result').textContent=$('probe').checked?result===null?'Unavailable placeholder route':result===0?'Outside':result===2?'Inside · node sphere':result===3?'Inside · connecting tube':'Inside · room':'';
 if($('probe').checked)mesh.points.push({vertex:probe.map(v=>v/2048),radius:28/2048,colour:result?254:255});
 try{scene?.setMesh(mesh,InfernoCorridor.palette(INFERNO_DATA.palettes[paletteKey(name)]),reset);if(scene)$('status').textContent='';}
 catch(e){$('status').textContent=e.message;}
 sceneryLinks(name);
}
function select(){
 history.replaceState(null,'','#'+active.index);$('profile').value=active.index;
 $('title').textContent=`Profile ${active.index} · ${active.containment==='tube'?'tunnel paths':'open room'}`;
 const available=[],other=[];
 for(const object of active.scenery){
  const option=new Option(object.names.join(' / '),object.names[0]);
  if(InfernoCorridor.scenery(option.value,active).count)available.push(option);
  else{option.textContent+=' · no static preview';other.push(option);}
 }
 $('object').replaceChildren();
 if(available.length)$('object').append(...available);
 if(other.length){const group=document.createElement('optgroup');group.label='Other profile assignments';group.append(...other);$('object').append(group);}
 $('object').disabled=!active.scenery.length;
 $('routes').textContent=active.paths.map((p,i)=>`${String(i).padStart(2,' ')}  ${p}`).join('\n');
 $('nodes').replaceChildren(...active.nodes.map((n,i)=>{
  const tr=document.createElement('tr'),button=document.createElement('button');button.textContent=i<9?String(i+1):String.fromCharCode(65+i-9);
  button.onclick=()=>{const p=InfernoCorridor.rotate(n,+$('rotation').value);['x','y','z'].forEach((id,j)=>$(id).value=p[j]);$('probe').checked=true;render();};
  const td=document.createElement('td');td.append(button);tr.append(td);
  for(const value of n){const cell=document.createElement('td');cell.textContent=value;tr.append(cell);}return tr;
 }));
 $('notes').textContent=active.invalid_paths.length?'This is a placeholder profile. Its “00” routes reference an unavailable node and reach the original error handler if used for corridor containment. Its scenery assignments have other uses.':`${active.scenery.length} scenery definitions use this profile. Native camera anchor: ${active.camera?.join(', ')??'none'}.`;
 $('locations').replaceChildren(...active.locations.map(w=>{
  const p=document.createElement('p');p.append(`${w.name}: ${w.count} cells · `);
  for(const[x,z]of w.first_cells.slice(0,6)){const a=document.createElement('a');a.textContent=`(${x}, ${z}) `;a.href=`../maps/index.html#${w.name}/${x}/${z}`;p.append(a);}return p;
 }));
 if(!$('locations').children.length)$('locations').textContent='No direct stored-world placement found.';
 render(true);
}
$('profile').onchange=()=>{active=InfernoCorridor.profiles[+$('profile').value];select();};
for(const id of ['rotation','radius','cage','palette','probe','x','y','z'])$(id).onchange=()=>render();
$('object').onchange=()=>{$('surfaces').checked=true;render(true);};
$('surfaces').onchange=$('drawing-context').onchange=()=>render(true);
$('cutaway').onchange=()=>{if(scene){scene.cutaway=$('cutaway').checked;scene.render();}};
$('reset').onclick=()=>scene?.reset();
addEventListener('hashchange',()=>{const n=Number(location.hash.slice(1));if(Number.isInteger(n)&&n>=0&&n<64&&n!==active.index){active=InfernoCorridor.profiles[n];select();}});
select();
