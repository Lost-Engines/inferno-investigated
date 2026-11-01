'use strict';
const $=id=>document.getElementById(id),all=INFERNO_DATA.models,parameters=Array(257).fill(0);
const textureCache=new Map(),inkCache=new Map();
const InfernoTextures={
  pixels(page){if(!textureCache.has(page))textureCache.set(page,Uint8Array.from(atob(page.pixels),c=>c.charCodeAt(0)));return textureCache.get(page);},
  colours(palette){if(!inkCache.has(palette))inkCache.set(palette,palette.map(rgb=>rgb.map(v=>Math.round(v*255/63))));return inkCache.get(palette);},
  resolve(item){const name=item.textureSource==='global'?INFERNO_DATA.global_textures[item.texture]:item.textureName;return INFERNO_DATA.textures[(name||'').replace(/^!/, '')]||null;}
};
let active=all.find(m=>m.id===location.hash.slice(1)||m.name===decodeURIComponent(location.hash.slice(1)))||all.find(m=>m.name==='epicship')||all[0];
let yaw=.65,pitch=.35,zoom=1,pan=[0,0],bounds,page=0,filtered=all,tiles=[],playing=false,direction=1,last=0,stepTime=0,dirty=true,proceduralMotion=false;
const noise={x:0x1234,y:0x5678},procNoise={seed:0x4321};
const project=v=>InfernoPreview.project(yaw,pitch)(v);
const paletteKey=model=>$('palette').value||model.preferred_palette||INFERNO_DATA.default_palette;
const profile=model=>model.preview;
function geometry(model,options={}){
  const frame=options.frame,canvas=options.canvas||$('preview'),rect=canvas.getBoundingClientRect();
  const scale=frame?Math.min(rect.width,rect.height)*.42/frame.radius*(options.thumbnail?1:zoom):0;
  const projection=options.project||project;
  return InfernoModel.inspect(model,{
    project:projection,screenProject:frame?(v=>projection(v).map((n,i)=>i<2?n*scale:n)):undefined,
    rules:$('rules').checked,parameters,level:Number($('lod').value)||0,
    distance:Number($('draw-distance').value)||1,status:Number($('draw-flags').value)||0,...options
  });
}
const framing=InfernoPreview.framing;
function draw(canvas,g,frame,thumbnail=false,model=active,projection=project){
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);
  const w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  const inks=InfernoTextures.colours(INFERNO_DATA.palettes[paletteKey(model)]);
  const r=InfernoRaster.begin(canvas.getContext('2d'),w,h,[16,23,33],{palette:inks,procedural:procNoise});
  const scale=Math.min(w,h)*.42/frame.radius*(thumbnail?1:zoom),centre=projection(frame.centre);
  const stroke=Math.max(dpr,Math.min(w/320,h/200)*.8);
  let missingTextures=0;
  const screen=v=>{const p=projection(v);return[w/2+(p[0]-centre[0])*scale+(thumbnail?0:pan[0]*dpr),h/2+(p[1]-centre[1])*scale+(thumbnail?0:pan[1]*dpr),p[2]];};
  for(const item of g.primitives){
    const points=(item.kind==='point'?[item.vertex]:item.vertices).map(screen);
    const ink=InfernoRaster.colour($('neutral').checked?[165,179,190]:inks[item.colour&255]);
    if(item.kind==='point'){
      if(item.sprite){
        const sprite=INFERNO_DATA.sprites[item.sprite.name]?.[item.sprite.frame];
        if(sprite)r.sprite(points[0][0],points[0][1],item.sprite.width*scale,item.sprite.height*scale,sprite,inks);
        else missingTextures++;
      }else if(item.pixelSize){
        r.marker(points[0][0],points[0][1],InfernoPreview.pointRadius(item.pixelSize,w,h,dpr),ink);
      }else r.circle(points[0][0],points[0][1],Math.max(1.3*dpr,InfernoEffects.radius(item,scale)),ink,item.mode,item.colour);
    }else if(item.kind==='line')r.line(points,ink,false,1,item.pattern,stroke);
    else{
      const texture=InfernoTextures.resolve(item);
      if(item.textured&&texture&&!$('neutral').checked)r.texture(points,item.uv,texture,inks);
      else if(item.shades?.length===points.length&&!$('neutral').checked)r.shaded(points,item.shades,inks);
      else if(item.rounded)r.rounded(points,ink,item.mode,item.colour);
      else{
        if(item.textured)missingTextures++;
        r.polygon(points,item.textured?InfernoRaster.colour([144,150,158]):ink,item.mode,item.colour);
      }
      if($('edges').checked)r.line(points,InfernoRaster.colour([10,15,22]),true,.7);
    }
  }
  r.finish();return missingTextures;
}
function paletteInfo(){
  const key=paletteKey(active),info=INFERNO_DATA.palette_info[key];
  $('palette-info').textContent=(info?.description||key)+' '+(info?.resource||'');
}
function stateSummary(){
  const values=active.parameters.filter(p=>parameters[p.index]).map(p=>`${p.label} = ${parameters[p.index]}`);
  $('active-states').textContent=values.length?values.join(' · '):active.parameters.length?'All states are zero.':'';
}
function control(){return active.parameters.find(p=>p.index===Number($('state').value));}
function setState(value){
  const c=control();if(!c)return;
  parameters[c.index]=Math.max(0,Math.min(c.max,Math.round(value)));
  $('state-value').value=$('state-slider').value=parameters[c.index];
  $('state-toggle').checked=parameters[c.index]!==c.toggle_states?.[0];
  stateSummary();dirty=true;
}
function stateUI(){
  const c=control();$('states').hidden=!c;$('zero-states').hidden=!c;
  if(!c){stateSummary();return;}
  const toggle=c.playback==='toggle';$('toggle-box').hidden=!toggle;
  for(const id of ['state-slider','state-value','play','reverse','loop','speed'])$(id).hidden=toggle;
  for(const id of ['state-slider','state-value'])$(id).max=c.max;
  $('range').textContent=`${c.index===256?'Initial state · ':''}0–${c.max}`;
  setState(parameters[c.index]);
}
function stop(){playing=false;$('play').textContent='Play once';}
function fit(){
  let g=geometry(active,{rules:false});
  if(!g.primitives.length)g=geometry(active);
  bounds=framing(g);dirty=true;
}
function restorePreview(resetCamera=true){
  stop();const p=profile(active);
  parameters.splice(0,parameters.length,...InfernoPreview.parameters(p.parameters));
  $('draw-distance').value=p.distance;$('draw-flags').value=p.status;$('lod').value=p.level;$('rules').checked=p.rules;
  if(resetCamera){yaw=p.yaw;pitch=p.pitch;zoom=1;pan=[0,0];}
  bounds=p.frame||{centre:[0,0,0],radius:100};
  stateUI();dirty=true;
}
function select(model){
  active=model;
  $('model').value=model.id;history.replaceState(null,'','#'+model.id);
  $('title').textContent=model.name+' · '+model.id;
  $('source').textContent=`${model.instructions.length.toLocaleString()} drawing commands · ${model.levels.length} detail levels`;
  $('lod').replaceChildren(...model.levels.map((l,i)=>new Option(`Level ${i+1} · ${l.distance}`,i)));
  $('state').replaceChildren(...model.parameters.map(p=>new Option(p.label,p.index)));
  restorePreview();paletteInfo();
  $('details').textContent=JSON.stringify({names:model.names,detail_records:model.detail_records,parameters:model.parameters,preview:model.preview,texture_name:model.texture_name,opcodes:model.opcodes},null,2);
  for(const t of tiles)t.button.classList.toggle('active',t.model===model);
}
function list(){
  const q=$('search').value.trim().toLowerCase();
  filtered=all.filter(m=>`${m.name} ${m.id} ${m.names.join(' ')}`.toLowerCase().includes(q));
  $('model').replaceChildren(...filtered.map(m=>new Option(m.name+' · '+m.id,m.id)));
  $('model').value=active.id;page=0;gallery();
}
function gallery(){
  const paging=$('paging').checked,start=paging?page*48:0,shown=filtered.slice(start,paging?start+48:undefined);
  $('gallery').replaceChildren();
  tiles=shown.map(model=>{
    const button=document.createElement('button');button.className='tile'+(model===active?' active':'');button.dataset.model=model.name;
    const preview=document.createElement('span');preview.className='tile-preview';
    const canvas=document.createElement('canvas'),name=document.createElement('strong'),id=document.createElement('small');
    name.textContent=model.name;id.textContent=model.id;preview.append(canvas);
    const p=profile(model),badges=document.createElement('span');badges.className='tile-badges';
    for(const label of p.badges){const badge=document.createElement('span');badge.className='model-badge';badge.textContent=label;badges.append(badge);}
    if(p.empty){const empty=document.createElement('span');empty.className='empty-preview';empty.textContent=p.empty;preview.append(empty);button.title=p.explanation;}
    button.append(preview,name,id,badges);button.onclick=()=>select(model);$('gallery').append(button);
    return {model,button,canvas,bounds:p.frame||{centre:[0,0,0],radius:100},parameters:InfernoPreview.parameters(p.parameters)};
  });
  $('count').textContent=`${filtered.length.toLocaleString()} of ${all.length.toLocaleString()} models`;
  $('page').textContent=paging?`${page+1} / ${Math.max(1,Math.ceil(filtered.length/48))}`:'All models';
  $('prev').disabled=!paging||page===0;$('next').disabled=!paging||start+48>=filtered.length;thumbnails();
}
function thumbnails(){
  for(const t of tiles){
    const rect=t.canvas.getBoundingClientRect();if(rect.top>innerHeight+150||rect.bottom< -150)continue;
    try{
      const p=profile(t.model),projection=InfernoPreview.project(p.yaw,p.pitch);
      const g=geometry(t.model,{...p,canvas:t.canvas,frame:t.bounds,thumbnail:true,parameters:t.parameters,project:projection});
      draw(t.canvas,g,t.bounds,true,t.model,projection);
    }catch(e){t.button.title=e.message;}
  }
}
$('palette').add(new Option('Automatic · model palette',''));
const groups=new Map();
for(const [key,info]of Object.entries(INFERNO_DATA.palette_info).sort((a,b)=>a[1].group.localeCompare(b[1].group)||a[1].label.localeCompare(b[1].label,undefined,{numeric:true}))){
  if(!groups.has(info.group)){const group=document.createElement('optgroup');group.label=info.group;groups.set(info.group,group);$('palette').append(group);}
  groups.get(info.group).append(new Option(info.label,key));
}
$('palette').value='';
$('palette').onchange=()=>{paletteInfo();dirty=true;thumbnails();};
$('search').oninput=list;$('model').onchange=()=>select(all.find(m=>m.id===$('model').value));
$('state').onchange=()=>{stop();stateUI();};
$('state-slider').oninput=e=>{stop();setState(e.target.value);};
$('state-value').onchange=e=>{stop();setState(e.target.value);};
$('state-toggle').onchange=e=>setState(control().toggle_states[e.target.checked?1:0]);
function startAnimation(reverse=false){
  playing=!playing||reverse;direction=reverse?-1:1;stepTime=0;
  if(!reverse&&parameters[control().index]>=control().max)setState(0);
  if(playing){
    const c=control(),old=parameters[c.index],combined={primitives:[]};
    for(const v of c.states){parameters[c.index]=v;combined.primitives.push(...geometry(active,{rules:false}).primitives);}
    parameters[c.index]=old;
    if(combined.primitives.length)bounds=framing(combined);
  }
  $('play').textContent=playing?'Stop':'Play once';dirty=true;
}
$('play').onclick=()=>startAnimation();$('reverse').onclick=()=>startAnimation(true);
$('reset').onclick=()=>{const p=profile(active);yaw=p.yaw;pitch=p.pitch;zoom=1;pan=[0,0];fit();};
$('restore-preview').onclick=()=>restorePreview();
$('zero-states').onclick=()=>{stop();parameters.fill(0);stateUI();dirty=true;};
for(const id of ['rules','edges','neutral','jitter','spin'])$(id).onchange=()=>{dirty=true;thumbnails();};
for(const id of ['lod','draw-distance','draw-flags'])$(id).onchange=()=>{stop();fit();};
$('paging').onchange=()=>{page=0;gallery();};$('prev').onclick=()=>{page--;gallery();};$('next').onclick=()=>{page++;gallery();};
let drag=null;
$('preview').onpointerdown=e=>{drag=[e.clientX,e.clientY];$('preview').setPointerCapture(e.pointerId);};
$('preview').onpointermove=e=>{if(!drag)return;const dx=e.clientX-drag[0],dy=e.clientY-drag[1];drag=[e.clientX,e.clientY];if(e.shiftKey){pan[0]+=dx;pan[1]+=dy;}else{yaw+=dx*.008;pitch=Math.max(-1.5,Math.min(1.5,pitch+dy*.008));}dirty=true;};
$('preview').onpointerup=()=>drag=null;$('preview').onpointercancel=()=>drag=null;
$('preview').onwheel=e=>{e.preventDefault();zoom=Math.max(.1,Math.min(15,zoom*Math.exp(-e.deltaY*.001)));dirty=true;};
addEventListener('resize',()=>dirty=true);addEventListener('scroll',thumbnails,{passive:true});
function tick(time){
  const elapsed=Math.min(.1,(time-last)/1000||0);last=time;
  if($('spin').checked){yaw+=elapsed*.4;dirty=true;}
  if(playing){
    stepTime+=elapsed;
    if(stepTime>=1/Number($('speed').value)){
      stepTime=0;const c=control(),values=c.indexed?c.states:null;
      let value=parameters[c.index]+direction;
      if(values){const index=values.findIndex(v=>v>=parameters[c.index]);value=values[index+direction]??(direction>0?c.max+1:-1);}
      if(value>c.max||value<0){if($('loop').checked){direction=-direction;value=Math.max(0,Math.min(c.max,value));}else{stop();value=Math.max(0,Math.min(c.max,value));}}
      setState(value);
    }
  }
  if(dirty||$('jitter').checked&&(active.opcodes[83]||proceduralMotion)){
    try{
      const g=geometry(active,{frame:bounds,jitter:$('jitter').checked?noise:null});
      const missing=draw($('preview'),g,bounds);
      proceduralMotion=g.primitives.some(p=>p.mode===4);
      $('notes').textContent=[`${g.faces.length} surfaces · ${g.lines.length} lines · ${g.points.length} points`,...g.warnings,...(missing?[`${missing} textured surfaces have unresolved bindings`]:[])].join(' · ');
      $('status').textContent=g.primitives.length?'':profile(active).explanation||'Nothing is drawn with these settings. Restore the preview or try another state.';
    }catch(e){$('status').textContent=e.message;}
    if(dirty)thumbnails();dirty=false;
  }
  requestAnimationFrame(tick);
}
list();select(active);requestAnimationFrame(tick);

addEventListener('hashchange',()=>{const name=decodeURIComponent(location.hash.slice(1));const m=all.find(m=>m.id===name||m.name===name);if(m)select(m);});
