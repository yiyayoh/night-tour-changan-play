(function(root){
'use strict';
// Permanent surface geometry: finishes remain present even when images fail.
function create(THREE,world){
 const buffers=new Map(),colorCache=new Map(),specs=[];let tiles=0,mats=0,medallions=0;
 function bucket(name){if(!buffers.has(name))buffers.set(name,{p:[],c:[]});return buffers.get(name);}
 function face(name,points,color,shade=1){const b=bucket(name);let rgb=colorCache.get(color);if(!rgb){const c=new THREE.Color(color);rgb=[c.r,c.g,c.b];colorCache.set(color,rgb);}for(const i of[0,1,2,0,2,3]){b.p.push(...points[i]);b.c.push(rgb[0]*shade,rgb[1]*shade,rgb[2]*shade);}}
 function rect(name,x0,z0,x1,z1,y,color,shade=1){if(x1-x0<.001||z1-z0<.001)return;face(name,[[x0,y,z0],[x0,y,z1],[x1,y,z1],[x1,y,z0]],color,shade);}
 function noise(x,z){const n=Math.sin(x*17.13+z*43.17)*43758.5453;return n-Math.floor(n);}
 const palette={audience:['#7c837e',.80,.80,false],state:['#68757a',.88,.88,false],study:['#7d8076',.92,.60,true],library:['#777c76',.70,.70,false],residence:['#817b6e',.70,.70,true],court:['#758080',1.0,.56,true],office:['#7b8076',.75,.75,false],pavilion:['#7d847e',.86,.60,true],tower:['#717c7b',.85,.60,true]};
 function pave(x0,z0,x1,z1,y,color,tw,td,offset=false){
  rect('joints',x0,z0,x1,z1,y+.002,'#424e51');
  let row=0;for(let z=z0;z<z1-.002;z+=td,row++){const shift=offset&&row%2?tw/2:0;for(let x=x0-shift;x<x1-.002;x+=tw){const a=Math.max(x0,x)+.009,b=Math.min(x1,x+tw)-.009,c=z+.009,d=Math.min(z1,z+td)-.009;if(b<=a||d<=c)continue;rect('paving',a,c,b,d,y+.008,color,.93+noise(x,z)*.13);tiles++;}}
 }
 function band(x0,z0,x1,z1,y,width,color){
  rect('paving',x0,z0,x1,z0+width,y,color);rect('paving',x0,z1-width,x1,z1,y,color);rect('paving',x0,z0+width,x0+width,z1-width,y,color);rect('paving',x1-width,z0+width,x1,z1-width,y,color);
 }
 function woven(x,z,w,d,y,muted=false){
  mats++;const edge=.13,x0=x-w/2,z0=z-d/2,x1=x+w/2,z1=z+d/2;
  rect('woven',x0,z0,x1,z0+edge,y,'#5e5743');rect('woven',x0,z1-edge,x1,z1,y,'#5e5743');rect('woven',x0,z0+edge,x0+edge,z1-edge,y,'#5e5743');rect('woven',x1-edge,z0+edge,x1,z1-edge,y,'#5e5743');
  let row=0;for(let pz=z0+edge;pz<z1-edge;pz+=.14,row++){let col=0;for(let px=x0+edge;px<x1-edge;px+=.44,col++)rect('woven',px,pz,Math.min(x1-edge,px+.44),Math.min(z1-edge,pz+.14),y,muted?'#928873':'#a39a7a',((row+col)%2?.91:1.01)+noise(px,pz)*.025);}
  for(const side of[-1,1])rect('woven',x0+edge*1.5,z+side*(d/2-edge*2)-.015,x1-edge*1.5,z+side*(d/2-edge*2)+.015,y+.0025,'#665d46');
 }
 function lotus(x,z,y){
  medallions++;const a=1.12;rect('paving',x-a,z-a,x+a,z+a,y,'#48565a');rect('paving',x-a+.08,z-a+.08,x+a-.08,z+a-.08,y+.001,'#87908b');
  const b=bucket('woven'),c=new THREE.Color('#5d6d6c');
  function triangle(p,q,r){for(const v of[p,r,q]){b.p.push(...v);b.c.push(c.r,c.g,c.b);}}
  for(let k=0;k<8;k++){const angle=k*Math.PI/4,points=[];for(let j=0;j<=16;j++){const t=j/16*Math.PI*2,u=Math.sin(t)*.17,v=.42-Math.cos(t)*.34;points.push([x+Math.sin(angle)*v+Math.cos(angle)*u,y+.002,z+Math.cos(angle)*v-Math.sin(angle)*u]);}for(let j=1;j<points.length-2;j++)triangle(points[0],points[j],points[j+1]);}
 }
 function trimHall(h,front){
  const y=h.base+.38,half=h.w/2;
  if(h.style!=='pavilion')for(const side of[-1,1]){const x=h.x+side*(half-.38);face('joinery',[[x,y-.30,h.z-h.d/2+.1],[x,y+.30,h.z-h.d/2+.1],[x,y+.30,h.z+h.d/2-.1],[x,y-.30,h.z+h.d/2-.1]],'#635342');}
  if(!['court','study','pavilion'].includes(h.style)){
   const bay=h.w/h.bays,span=h.bays>=9?bay*1.5:bay*.5;
   rect('woven',h.x-span-.15,front-.10,h.x+span+.15,front+.10,h.base+.013,'#645442');
  }
 }
 for(const h of world.halls){
  const p=palette[h.style]||palette.office,outer={x0:h.x-h.w/2-2.86,x1:h.x+h.w/2+2.86,z0:h.z-h.d/2-2.86,z1:h.z+h.d/2+2.86},open=['court','study','pavilion'].includes(h.style),inside={x0:h.x-h.w/2+.42,x1:h.x+h.w/2-.42,z0:h.z-h.d/2+.42,z1:h.z+h.d/2-(open?.42:2.35)},y=h.base;
  // Four veranda strips surround the room without overlapping its finished surface.
  pave(outer.x0,outer.z0,outer.x1,inside.z0,y,'#687578',1.05,.58,true);pave(outer.x0,inside.z1,outer.x1,outer.z1,y,'#687578',1.05,.58,true);pave(outer.x0,inside.z0,inside.x0,inside.z1,y,'#687578',1.05,.58,true);pave(inside.x1,inside.z0,outer.x1,inside.z1,y,'#687578',1.05,.58,true);
  pave(inside.x0,inside.z0,inside.x1,inside.z1,y,p[0],p[1],p[2],p[3]);band(inside.x0,inside.z0,inside.x1,inside.z1,y+.010,.19,'#4c5b5b');band(inside.x0+.22,inside.z0+.22,inside.x1-.22,inside.z1-.22,y+.011,.035,'#9b9e8e');
  const cx=(inside.x0+inside.x1)/2,cz=(inside.z0+inside.z1)/2,iw=inside.x1-inside.x0,id=inside.z1-inside.z0;
  if(h.style==='audience')for(const side of[-1,1])woven(h.x+side*h.w*.235,h.z,Math.min(8.6,iw*.29),Math.min(12,id*.68),y+.015);
  if(h.style==='state')for(const side of[-1,1])woven(h.x+side*h.w*.24,h.z+1,Math.min(9,iw*.22),Math.min(16,id*.60),y+.015,true);
  if(h.style==='study'||h.style==='library')for(const side of[-1,1])woven(h.x+side*h.w*.23,h.z+h.d*.14,Math.min(4.6,iw*.26),Math.min(6.2,id*.32),y+.015,h.style==='library');
  if(h.style==='residence')woven(cx,cz,iw*.64,id*.56,y+.015);
  if(h.style==='office')for(const side of[-1,1])woven(h.x+side*h.w*.32,h.z-h.d*.26,4.5,3.2,y+.015,true);
  if(h.style==='state'||h.style==='audience')lotus(h.x,inside.z1-3.0,y+.012);
  trimHall(h,inside.z1+.15);specs.push({title:h.title,style:h.style,base:h.base,inside,outer,finish:p[0]});
 }
 // Finish the walkable gallery slabs and the existing low seat surfaces as well.
 for(const b of world.boxes){
  if(b.kind==='platform'&&(b.w===5||b.d===5))pave(b.x-b.w/2+.07,b.z-b.d/2+.07,b.x+b.w/2-.07,b.z+b.d/2-.07,b.y+b.h/2,'#717c7b',.95,.55,true);
  if(b.kind==='mat')woven(b.x,b.z,b.w-.03,b.d-.03,b.y+b.h/2+.002,true);
 }
 const group=new THREE.Group();group.name='palace-interior-finishes';const resources=[],meshes={};
 for(const[name,b]of buffers){if(!b.p.length)continue;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(b.c,3));g.computeVertexNormals();g.computeBoundingSphere();const offset=name==='joints'?-1:name==='paving'?-2:-3,mat=new THREE.MeshLambertMaterial({vertexColors:true,side:name==='joinery'?THREE.DoubleSide:THREE.FrontSide,polygonOffset:true,polygonOffsetFactor:offset,polygonOffsetUnits:offset}),mesh=new THREE.Mesh(g,mat);mesh.name='palace-interior-'+name;group.add(mesh);resources.push(g,mat);meshes[name]=mesh;}
 group.userData={hallFinishes:specs,tiles,mats,medallions,usesImages:false};
 return{group,meshes,specs,tiles,mats,medallions,batches:group.children.length,dispose(){for(const r of resources)r.dispose();}};
}
root.ChanganPalaceInteriors={create};
})(typeof window!=='undefined'?window:globalThis);

