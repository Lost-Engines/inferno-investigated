'use strict';
const InfernoWorld=(()=>{
 const models=new Map(),objects=new Map(),geometryCache=new Map(),variants=new WeakMap();
 for(const m of INFERNO_DATA.models){models.set(m.name,m);for(const n of m.names)models.set(n.split('/').at(-1).replace(/\.3$/,''),m);}
 for(const o of Object.values(INFERNO_WORLD.objects))for(const n of o.names)objects.set(n,o);
 for(const e of INFERNO_WORLD.environments){const b=Uint8Array.from(atob(e.cells_b64),c=>c.charCodeAt(0));e.cells=Array.from({length:40000},(_,i)=>b[2*i]+256*b[2*i+1]);}
 function geometry(name,status=0,distance=0){const key=name+':'+status+':'+distance;if(!geometryCache.has(key)){const m=models.get(name);geometryCache.set(key,m?InfernoModel.inspect(m,{rules:false,referenceScale:1,status,distance}):{faces:[],lines:[],points:[],warnings:['Missing model '+name]});}return geometryCache.get(key);}
 function parts(name){const o=objects.get(name);if(!o)return[{name,rotation:[0,0,0],offset:[0,0,0]}];return o.draw_parts.map(d=>{const p=o.parts.find(p=>p.slot===d.slot);return p?{...p,offset:o.anchors[d.anchor]||[0,0,0]}:null;}).filter(Boolean);}
 function quarter(v,angle){switch((angle>>>14)&3){case 1:return[v[2],v[1],-v[0]];case 2:return[-v[0],v[1],-v[2]];case 3:return[-v[2],v[1],v[0]];default:return v;}}
 function choices(e){if(variants.has(e))return variants.get(e);let low=0x5926,high=0x3141;const out=Array(40000);for(let z=199;z>=0;z--)for(let x=0;x<200;x++){const i=z*200+x,t=e.tiles[e.cells[i]];if(!t?.variants.length)continue;const sum=high+low;high=sum&65535;low=(low+high+(sum>65535?1:0))&65535;out[i]=t.variants[high%t.variants.length];}variants.set(e,out);return out;}
 function append(mesh,name,offset=[0,0,0],angle=0,status=0,distance=0){
  for(const part of parts(name)){const g=geometry(part.name,status,distance),rotation=InfernoModel.rotation(part.rotation||[0,0,0]);const place=v=>{const a=rotation.map(row=>row.reduce((s,n,i)=>s+n*v[i],0)).map((v,i)=>v+part.offset[i]),q=quarter(a,angle);return q.map((v,i)=>v/2048+offset[i]);};for(const f of g.faces)mesh.faces.push({...f,vertices:f.vertices.map(place),component:part.name});for(const l of g.lines)mesh.lines.push({...l,vertices:l.vertices.map(place)});for(const p of g.points)mesh.points.push({...p,vertex:place(p.vertex),radius:p.radius/2048,sprite:p.sprite?{...p.sprite,width:p.sprite.width/2048,height:p.sprite.height/2048}:undefined});for(const w of g.warnings)mesh.warnings.add(w);}
 }
 function assemble(e,x,z,radius,status=0){const mesh={faces:[],lines:[],points:[],warnings:new Set(),cells:0};for(let row=Math.max(0,z-radius);row<=Math.min(199,z+radius);row++)for(let col=Math.max(0,x-radius);col<=Math.min(199,x+radius);col++){const tile=e.tiles[e.cells[row*200+col]],name=choices(e)[row*200+col];if(!tile||!name)continue;mesh.cells++;append(mesh,name,[col-x,0,row-z],tile.rotation,status);}mesh.warnings=[...mesh.warnings];return mesh;}
 return{models,objects,parts,geometry,quarter,choices,assemble,append};
})();
