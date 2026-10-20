(function(root){
 'use strict';
 function layout(){
  const boxes=[],targets=[];let serial=0;
  function box(x,y,z,w,h,d,color,solid=true,kind='prop'){const b={id:'p'+serial++,x,y,z,w,h,d,color,solid,kind};boxes.push(b);return b;}
  const targetsAt={
   'rain-report':[-31,11],'work-ledger':[-24,10],'wei-zheng':[-27,3],
   'silk-book':[25,1],'plain-sleeve':[33,-2],'empress-zhangsun':[27,-7],
   'court-draft':[-5,-41],'court-map':[5,-41],'li-shimin':[0,-48]
  };
  box(0,-1,-1,96,2,158,'ground',false);box(0,.015,6,9,.03,126,'path',false);
  for(const x of [-46,46]){box(x,3,-1,2,6,158,'wall',true,'wall');box(x,6.25,-1,2.8,.5,158,'tile',false);}
  box(0,3,-79,94,6,2,'wall',true,'wall');box(0,6.25,-79,96,.5,2.8,'tile',false);
  for(const x of [-27,27]){box(x,3,77,40,6,2,'wall',true,'wall');box(x,6.25,77,42,.5,2.8,'tile',false);}
  function roof(x,z,w,d,y,color='tile',double=false){
   for(let i=0;i<12;i++)box(x,y+i*.34,z,w+7-i*.6,.38,Math.max(1.4,d+7-i*2),color,false);
   box(x,y+4.25,z,w+.6,.5,1.1,'ridge',false);
   for(const side of[-1,1]){box(x+side*(w/2+3),y+.5,z,1.3,.55,d+8,'ridge',false);box(x+side*(w/2+3),y+1,z+d/2+3,1.3,1.2,1.3,'ridge',false);box(x+side*(w/2+3),y+1,z-d/2-3,1.3,1.2,1.3,'ridge',false);}
   if(double)roof(x,z,w-6,d-5,y+6,'upperTile');
  }
  function hall(x,z,w,d,title,theme){
   box(x,.18,z,w+3,.36,d+3,'stone',true,'platform');
   // The central southern stair and the open six-unit doorway share one path.
   for(let i=0;i<2;i++)box(x,.065+i*.07,z+d/2+2.5-i*.65,8,.13+i*.14,1.4,'stone',true,'platform');
   for(const side of[-1,1])box(x+side*w/2,3.9,z,1,7.1,d,'wall',true,'wall');
   box(x,3.9,z-d/2,w,7.1,1,'wall',true,'wall');
   for(const side of[-1,1])box(x+side*(w/4+1.75),3.9,z+d/2,w/2-3.5,7.1,1,'wall',true,'wall');
   box(x,7.2,z+d/2,w,.9,1,'wood',true,'wall');
   for(const sx of[-w/2,-w/4,w/4,w/2])for(const sz of[-d/2,d/2]){
    box(x+sx,4.2,z+sz,1.05,8,1.05,'red',true,'column');
    box(x+sx,7.7,z+sz,2.2,.55,1.4,'gold',false);box(x+sx,8.1,z+sz,1.4,.45,2.3,'red',false);
   }
   box(x,8.45,z,w+2,.6,d+2,'wood',false);roof(x,z,w,d,8.9,'tile',theme==='audience');
   // Lattices and low screens leave the front door completely open.
   for(const side of[-1,1])for(let i=0;i<4;i++)box(x+side*(w/2-.6),3.8,z-d/2+2+i*(d-4)/3,.25,3,1.3,'lattice',false);
   return {title,x,z,w,d};
  }
  const halls=[hall(0,-44,32,24,'两仪殿意象','audience'),hall(-27,8,19,26,'议事廊','study'),hall(28,-3,19,22,'后苑书阁','garden')];
  roof(0,73,16,7,8.5);for(const x of[-7,7])box(x,4.2,73,1.3,8.4,1.3,'red',true,'column');
  // Sheltered connecting galleries, with distinct rear garden and court.
  for(const x of[-40,40]){box(x,6.5,36,4,.45,41,'tile',false);for(const z of[18,30,42,54])box(x,3.2,z,.7,6.4,.7,'red',true,'column');}
  function tree(x,z){box(x,2.2,z,1,4.4,1,'wood',true,'tree');for(let i=0;i<3;i++)box(x+i*.3,5+i*.8,z,5.5-i*.7,1.5,4.4-i*.6,'leaf',false);}
  for(const p of[[-35,44],[35,44],[-17,34],[17,34],[-38,-24],[38,-24],[-16,-66],[16,-66]])tree(...p);
  for(const x of[-21,21]){box(x,.25,41,8,.5,12,'stone',true,'platform');box(x,.56,41,6.7,.12,10.8,'water',false);for(const z of[36,46])box(x,.75,z,7,.7,.65,'stone',true);}
  function desk(x,z,color='wood'){box(x,.86,z,3.2,.3,1.8,color,true);for(const dx of[-1.2,1.2])box(x+dx,.48,z,.25,.8,1.4,color,true);}
  for(const id of['rain-report','work-ledger','silk-book','court-draft','court-map']){const[x,z]=targetsAt[id];desk(x,z);box(x,1.04,z,2,.05,1.2,'paper',false);for(let i=0;i<3;i++)box(x-.55+i*.45,1.075,z,.06,.015,.75,'ink',false);}
  box(-5,1.13,-41,.35,.12,.35,'red',false).echo='seal';
  for(const x of[-6,-4])box(x,1.18,-41,.4,.25,1.2,'paper',false).echo='records';
  box(5,1.13,-41,.8,.13,1.1,'gold',false).echo='dawn';
  box(33,1.5,-2,2.8,.3,.6,'wood',true);for(const x of[31.8,34.2])box(x,.85,-2,.2,1.7,.3,'wood',true);box(33,1.05,-2,1.7,1.3,.15,'silk',false);
  box(0,2.2,-54,10,4,1,'screen',true,'wall');for(const x of[-4,-2,0,2,4])box(x,2.2,-53.4,.12,3.6,.1,'gold',false);
  for(const x of[-33,-21])for(const z of[-2,16]){box(x,1.1,z,2,2.2,1,'wood',true);for(let i=0;i<5;i++)box(x,0.5+i*.35,z+.55,1.65,.15,.2,i%2?'paper':'ink',false);}
  for(const x of[-10,10]){box(x,.5,-48,2.2,1,1.3,'red',true);box(x,.9,-49,2.2,1.8,.3,'wood',true);}
  function person(id,cloth){const[x,z]=targetsAt[id];box(x,.75,z,.9,1.5,.55,cloth,true,'actor');box(x,1.8,z,.65,.65,.6,'skin',false);box(x,2.18,z,.8,.2,.7,'ink',false);box(x,2.35,z,.5,.25,.5,id==='empress-zhangsun'?'gold':'ink',false);for(const side of[-1,1]){box(x+side*.59,1,z,.28,.85,.35,cloth,false);box(x+side*.14,1.9,z+.32,.07,.07,.05,'ink',false);box(x+side*.23,.15,z+.05,.3,.3,.5,'ink',false);}if(id!=='empress-zhangsun')box(x,1.5,z+.35,.3,.4,.1,'ink',false);box(x,1.09,z,.95,.12,.62,'gold',false);}
  person('wei-zheng','purple');person('empress-zhangsun','teal');person('li-shimin','ochre');
  for(const[x,z]of[[-7,66],[7,66],[-12,27],[12,27],[-34,22],[-20,22],[21,9],[35,9],[-12,-28],[12,-28]]){box(x,3.5,z,.2,3,.2,'wood',true,'column');box(x,4.6,z,1.1,1.45,1.1,'lamp',false);box(x,5.4,z,1.4,.22,1.4,'red',false);}
  for(const[id,[x,z]]of Object.entries(targetsAt))targets.push({id,x,z,kind:['wei-zheng','empress-zhangsun','li-shimin'].includes(id)?'person':'evidence'});
  return {boxes,targets,halls,bounds:{minX:-44.4,maxX:44.4,minZ:-77.3,maxZ:74.7},spawns:{gate:{x:0,z:62,yaw:Math.PI},west:{x:-27,z:25,yaw:Math.PI},garden:{x:28,z:12,yaw:Math.PI},court:{x:0,z:-23,yaw:Math.PI}},routes:{west:[[0,62],[0,29],[-27,29],[-27,24],[-27,11],[-27,6]],garden:[[-27,6],[-27,26],[0,26],[28,26],[28,12],[28,2]],court:[[28,2],[28,13],[0,13],[0,-24],[0,-33],[0,-43]]}};
 }
 function physics(world){
  const solid=world.boxes.filter(b=>b.solid),state={x:0,z:62,y:0,velocity:0,grounded:true},radius=.32,height=1.75;
  const overlap=(b,x,z)=>Math.abs(x-b.x)<b.w/2+radius-1e-5&&Math.abs(z-b.z)<b.d/2+radius-1e-5;
  function clear(x,z,y){const a=world.bounds;if(x<a.minX||x>a.maxX||z<a.minZ||z>a.maxZ)return false;return !solid.some(b=>overlap(b,x,z)&&y+height>b.y-b.h/2+.015&&y<b.y+b.h/2-.015);}
  function support(x,z,ceiling){let y=0;for(const b of solid)if(overlap(b,x,z)){const top=b.y+b.h/2;if(top<=ceiling+.015)y=Math.max(y,top);}return y;}
  function axis(dx,dz){const x=state.x+dx,z=state.z+dz,foot=state.grounded?support(x,z,state.y+.43):state.y;if(clear(x,z,foot)){state.x=x;state.z=z;if(state.grounded)state.y=foot;return true;}return false;}
  function move(dx,dz){const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.16));for(let i=0;i<n;i++){axis(dx/n,0);axis(0,dz/n);}return {...state};}
  function tick(dt,dx=0,dz=0){const n=Math.max(1,Math.ceil(Math.min(.15,Math.max(0,dt))/.016));dt=Math.min(.15,Math.max(0,dt))/n;for(let i=0;i<n;i++){
   move(dx*dt,dz*dt);const floor=support(state.x,state.z,state.y+.02);if(state.grounded&&floor<state.y-.08)state.grounded=false;
   if(!state.grounded){const before=state.y;state.velocity-=14.4*dt;let next=state.y+state.velocity*dt;
    if(state.velocity<=0){const landing=support(state.x,state.z,before);if(next<=landing){next=landing;state.velocity=0;state.grounded=true;}}
    if(!clear(state.x,state.z,next)&&next>before){state.velocity=0;next=before;}state.y=Math.max(0,next);
   }
  }return {...state};}
  function jump(){if(!state.grounded)return false;state.grounded=false;state.velocity=6.8;return true;}
  function place(spawn){const y=support(spawn.x,spawn.z,1);if(!clear(spawn.x,spawn.z,y))throw Error('Unsafe palace landing');Object.assign(state,{x:spawn.x,z:spawn.z,y,grounded:true,velocity:0});return {...state};}
  function sight(x,z,tx,tz){const n=Math.ceil(Math.hypot(tx-x,tz-z)/.35);for(let i=1;i<n;i++)if(solid.some(b=>b.kind==='wall'&&overlap(b,x+(tx-x)*i/n,z+(tz-z)*i/n)&&b.y-b.h/2<2))return false;return true;}
  return {state,move,tick,jump,place,clear,sight,groundAt:(x,z)=>support(x,z,.5)};
 }
 function direction(yaw,forward,right){return {x:Math.sin(yaw)*forward-Math.cos(yaw)*right,z:Math.cos(yaw)*forward+Math.sin(yaw)*right};}
 root.ChanganPalaceWorld={layout,physics,direction};if(typeof module!=='undefined')module.exports=root.ChanganPalaceWorld;
})(typeof window!=='undefined'?window:globalThis);
