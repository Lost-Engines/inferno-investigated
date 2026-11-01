'use strict';
const InfernoCorridor=(()=>{
 const profiles=INFERNO_CORRIDORS.profiles;
 const rotate=(v,r)=>{const[x,y,z]=v;return[[x,y,z],[z,y,-x],[-x,y,-z],[-z,y,x]][r&3];};
 function routeContains(p,route,point,rotation,radius){const nodes=p.nodes.map(v=>rotate(v,rotation)),squared=v=>v.reduce((s,n)=>s+n*n,0),distance=n=>squared(n.map((v,i)=>v*256-point[i]));if(route.some(i=>i>=nodes.length))return null;for(const i of route)if(distance(nodes[i])<=radius*radius)return 2;for(let i=1;i<route.length;i++){const a=nodes[route[i-1]],b=nodes[route[i]],da=distance(a),db=distance(b),length=Math.floor(Math.sqrt(squared(a.map((n,j)=>n-b[j]))))*256;if(!length)continue;const along=Math.trunc((length+Math.trunc(Math.abs(db-da)/length))/2);if(along<=length&&Math.max(da,db)-along*along<=radius*radius)return 3;}return 0;}
 function contains(p,position,rotation=0,radius=85){const point=position.map(n=>Math.trunc(n*256));if(p.containment==='room')return point.every(n=>Math.abs(n)<=262144)?-1:0;for(let i=p.routes.length-2;i>=0;i-=2){const result=routeContains(p,p.routes[i],point,rotation,radius*256);if(result===null)return null;if(result)return result;}return 0;}
 function append(mesh,p,offset=[0,0,0],rotation=0,radius=85,cage=true){
  const place=v=>rotate(v,rotation).map((n,i)=>n/2048+offset[i]),line=(vs,c=252)=>mesh.lines.push({vertices:vs.map(place),colour:c}),sphere=(v,r,c)=>mesh.points.push({vertex:place(v),radius:r/2048,colour:c});
  for(const node of p.nodes)sphere(node,18,252);
  if(p.containment==='room'){if(cage)for(let a=0;a<3;a++)for(const b of[-1024,1024])for(const c of[-1024,1024]){const v=[0,0,0],w=[0,0,0];v[a]=-1024;w[a]=1024;v[(a+1)%3]=w[(a+1)%3]=b;v[(a+2)%3]=w[(a+2)%3]=c;line([v,w],253);}}
  const edges=new Set();
  for(let j=0;j<p.routes.length;j+=2){const route=p.routes[j];if(route.some(i=>i>=p.nodes.length))continue;line(route.map(i=>p.nodes[i]));if(!cage||p.containment!=='tube')continue;for(let k=1;k<route.length;k++){const aa=route[k-1],bb=route[k],key=[aa,bb].sort((a,b)=>a-b).join(':');if(edges.has(key))continue;edges.add(key);const a=p.nodes[aa],b=p.nodes[bb],d=b.map((v,i)=>v-a[i]),length=Math.hypot(...d);if(!length)continue;const axis=d.map(v=>v/length),seed=Math.abs(axis[1])<.9?[0,1,0]:[1,0,0],cross=(u,v)=>[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],raw=cross(axis,seed),u=raw.map(v=>v/Math.hypot(...raw)),v=cross(axis,u),rings=[];for(const centre of[a,b]){const ring=Array.from({length:13},(_,i)=>centre.map((n,j)=>n+radius*(Math.cos(i*Math.PI/6)*u[j]+Math.sin(i*Math.PI/6)*v[j])));line(ring,253);rings.push(ring);}for(let i=0;i<12;i+=3)line([rings[0][i],rings[1][i]],253);}}
 }

 // The game sets drawing bit 1 when the camera occupies a room. Corridor
 // pieces can test either sense of that bit, independently of containment.
 // An inspection camera can show either context, including older variants.
 function scenery(name,profile,rotation=0,context='auto'){
  const build=mode=>{
   const mesh={faces:[],lines:[],points:[],warnings:new Set()};
   if(name)InfernoWorld.append(mesh,name,[0,0,0],rotation*16384,mode==='room'?6:4,1);
   return mesh;
  };
  const count=mesh=>mesh.faces.length+mesh.lines.length+mesh.points.length;
  const preferred=profile.containment==='room'?'room':'tunnel';
  let mode=context==='auto'?preferred:context,mesh=build(mode);
  const other=mode==='room'?'tunnel':'room',alternative=count(mesh)?null:build(other);
  if(context==='auto'&&!count(mesh)&&count(alternative)){mode=other;mesh=alternative;}
  return {mesh,context:mode,count:count(mesh),alternative:alternative&&count(alternative)?other:null};
 }
 function palette(source){const out=source.map(c=>c.slice());out[252]=[63,47,18];out[253]=[20,52,63];out[254]=[25,63,35];out[255]=[63,20,25];return out;}
 return{profiles,rotate,contains,append,scenery,palette};
})();
