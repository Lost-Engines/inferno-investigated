/* Inspection presets. Keep these separate from the model drawing interpreter. */
(function(root) {
  'use strict';
  const project = (yaw = .65, pitch = .35) => ([x,y,z]) => {
    const h=x*Math.cos(yaw)-z*Math.sin(yaw), d=x*Math.sin(yaw)+z*Math.cos(yaw);
    return [-h,y*Math.cos(pitch)+d*Math.sin(pitch),-y*Math.sin(pitch)+d*Math.cos(pitch)];
  };
  const parameters = values => {
    const result=Array(257).fill(0);
    for(const [index,value] of Object.entries(values || {})) result[index]=value;
    return result;
  };
  function framing(g) {
    const vertices=[];
    for(const p of g.primitives) {
      if(p.kind!=='point') { vertices.push(...p.vertices); continue; }
      const radius=p.pixelSize?0:Math.abs(p.radius||0);
      const extent=p.sprite?[p.sprite.width/2,p.sprite.height/2,0]:[radius,radius,radius];
      for(const sign of [-1,1]) vertices.push(p.vertex.map((v,i)=>v+sign*extent[i]));
    }
    if(!vertices.length)return {centre:[0,0,0],radius:100};
    const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
    for(const v of vertices) for(let i=0;i<3;i++) {lo[i]=Math.min(lo[i],v[i]);hi[i]=Math.max(hi[i],v[i]);}
    const centre=lo.map((v,i)=>(v+hi[i])/2);
    let radius=1;
    for(const v of vertices) radius=Math.max(radius,Math.hypot(...v.map((n,i)=>n-centre[i])));
    return {centre,radius};
  }
  function badges(model) {
    const result=[];
    if(model.parameters.length)result.push(model.parameters.every(p=>p.playback==='toggle')?'State switch':'Animation');
    if(model.opcodes[83])result.push('Vertex motion');
    return result;
  }
  function* states(model) {
    yield {};
    for(const p of model.parameters)for(const value of p.states.filter(v=>v>0))yield {[p.index]:value};
    // Effects can need an animation frame and a separate activation/position byte.
    for(let i=0;i<model.parameters.length;i++)for(const b of model.parameters.slice(i+1)) {
      const a=model.parameters[i];
      for(const av of a.states.filter(v=>v>0))for(const bv of b.states.filter(v=>v>0))yield {[a.index]:av,[b.index]:bv};
    }
    yield Object.fromEntries(model.parameters.filter(p=>p.index!==7).map(p=>[p.index,p.states.find(v=>v>0)||0]));
  }
  function find(model) {
    const base={parameters:{},distance:1,status:0,level:0,yaw:.65,pitch:.35,rules:true,badges:badges(model)};
    const flags=new Set([0,2]);
    for(const [,op,args]of model.instructions) if(op>=63&&op<=70)flags.add(args[0]);
    for(const flag of [...flags]) {flags.add(flag|2);flags.add(flag|1);}
    const distances=new Set([1]);
    for(const [,op,args]of model.instructions)if([38,39,40,41].includes(op)) {
      const n=args[0]<<16>>16;
      for(const value of [n-1,n,n+1])if(value>0&&value<32767)distances.add(value);
    }
    const drawingOps=[1,2,3,4,26,27,28,31,47,50,51,52,56,57,62,77,79,80,81,90,91,92,93,94,95,96,113,114,115,116,121];
    if(!drawingOps.some(op=>model.opcodes[op]))return {...base,empty:'Vertices only',explanation:'This file defines vertices but has no drawing commands.'};
    const entries=model.levels.map(l=>model.instructions.find(i=>i[0]===l.entry));
    if(entries.every(i=>[0,65535].includes(i[1])))return {...base,empty:'Drawing disabled',explanation:'Each detail level immediately returns before reaching the drawing commands.'};
    let trials=0;
    // Try intact geometry in its drawing contexts before trying damage or animation states.
    for(const values of states(model)) {
      for(let level=0;level<model.levels.length;level++)for(const distance of distances)for(const status of flags) {
        if(++trials>12000)break;
        const options={parameters:parameters(values),distance,status,level,rules:false};
        const g=InfernoModel.inspect(model,options);
        const preset={...base,parameters:values,distance,status,level,frame:framing(g)};
        for(const [yaw,pitch]of [[.65,.35],[.65,-.35],[.65+Math.PI,.35],[.65+Math.PI,-.35]]) {
          const seen=InfernoModel.inspect(model,{...options,rules:true,project:project(yaw,pitch)});
          if(seen.primitives.length)return {...preset,yaw,pitch,frame:framing(g.primitives.length?g:seen)};
        }
        if(g.primitives.length)return {...preset,rules:false};
      }
      if(trials>12000)break;
    }
    return {...base,empty:'Needs game context',explanation:'This drawing program needs additional inputs from the game.'};
  }
  function pointRadius(pixelSize,width,height,dpr=1) {
    return Math.max(1.25*dpr,pixelSize*Math.min(width/320,height/200)/2);
  }
  root.InfernoPreview={project,parameters,framing,badges,find,pointRadius};
})(globalThis);
