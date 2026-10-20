(function(root){
 'use strict';
 function layout(){
  const boxes=[],targets=[],buildings=[];let serial=0;
  function box(x,y,z,w,h,d,color,solid=true,kind='prop',shape='box'){const b={id:'p'+serial++,x,y,z,w,h,d,color,solid,kind,shape};boxes.push(b);return b;}
  function round(x,y,z,r,h,color,solid=false,kind='detail'){return box(x,y,z,r*2,h,r*2,color,solid,kind,'round');}
  const targetsAt={
   'rain-report':[-31,11],'work-ledger':[-24,10],'wei-zheng':[-27,3],
   'silk-book':[25,1],'plain-sleeve':[33,-2],'empress-zhangsun':[27,-7],
   'court-draft':[-5,-41],'court-map':[5,-41],'li-shimin':[0,-48]
  };
  box(0,-1,80,304,2,520,'ground',false);box(0,.015,80,10,.03,502,'path',false);
  for(const z of[278,246,190,160,95])box(0,.025,z,258,.04,46,'path',false);
  for(let z=-155;z<330;z+=5)box(0,.055,z,9.8,.012,.045,'joint',false);
  for(const x of [-46,46]){box(x,3,-1,2,6,158,'wall',true,'wall');box(x,6.25,-1,2.8,.5,158,'tile',false);}
  for(const x of[-27,27]){box(x,3,-79,40,6,2,'wall',true,'wall');box(x,6.25,-79,42,.5,2.8,'tile',false);}
  for(const x of [-27,27]){box(x,3,77,40,6,2,'wall',true,'wall');box(x,6.25,77,42,.5,2.8,'tile',false);}
  function roof(x,z,w,d,y,color='tile'){
   const W=Math.max(w,d)+7,D=Math.min(w,d)+7,rise=Math.min(6.5,D*.20),b=box(x,y+rise/2,z,W,rise,D,color,false,'roof','hip');if(d>w)b.ry=Math.PI/2;
   const ridge=W-D;for(const side of[-1,1])for(let k=0;k<6;k++)box(x+(d>w?0:side*(ridge/2+k*.11)),y+rise+.25+k*.24,z+(d>w?side*(ridge/2+k*.11):0),d>w?.5:.68-k*.06,.32,d>w?.68-k*.06:.5,'ridge',false,'chiwei');
   box(x,y+rise+.12,z,d>w?.5:ridge+.7,.3,d>w?ridge+.7:.5,'ridge',false,'ridge');
   for(const side of[-1,1])for(let u=-W/2+.3;u<W/2;u+=.85){const cap=round(x+(d>w?side*D/2:u),y-.04,z+(d>w?u:side*D/2),.11,.3,'ridge');if(d>w)cap.rz=Math.PI/2;else cap.rx=Math.PI/2;}
  }
  function bracket(x,y,z,s=1){
   box(x,y,z,.9*s,.32*s,.9*s,'red',false,'dougong');
   for(let i=0;i<3;i++){const span=(1.3+i*.58)*s;box(x,y+(.3+i*.3)*s,z,span,.22*s,.45*s,'wood',false,'dougong');box(x,y+(.43+i*.3)*s,z,.45*s,.22*s,span,'wood',false,'dougong');}
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
    round(x+sx,.53,z+sz,.74,.34,'stone');round(x+sx,4.2,z+sz,.50,8,'red',true,'column');bracket(x+sx,8,z+sz);
   }
   box(x,8.8,z+d/2,w+2,.4,.45,'wood',false,'beam');box(x,8.8,z-d/2,w+2,.4,.45,'wood',false,'beam');roof(x,z,w,d,9.2);
   for(let px=-w/2+w/8;px<w/2;px+=w/4)for(const side of[-1,1])bracket(x+px,8,z+side*d/2,.8);
   for(let px=-w/2;px<=w/2;px+=w/4)box(x+px,8,z,.4,.6,d,'wood',false,'beam');
   // Lattices and low screens leave the front door completely open.
   for(const side of[-1,1])for(let i=0;i<4;i++)box(x+side*(w/2-.6),3.8,z-d/2+2+i*(d-4)/3,.25,3,1.3,'lattice',false);
   const building={title,x,z,w,d,kind:'hall',basis:theme==='audience'?'documented-name/inferred-form':'story-setting'};buildings.push(building);return building;
  }
  const halls=[hall(0,-44,32,24,'两仪殿','audience'),hall(-27,8,19,26,'议事廊·故事陈设','study'),hall(28,-3,19,22,'后苑书阁·故事陈设','garden')];
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
  function largeHall(x,z,w,d,title,{height=8,base=1.08,bays=7}={}){
   box(x,base/2,z,w+6,base,d+6,'stone',true,'platform');
   const n=Math.ceil(base/.18);for(const side of[-1,1])for(let i=0;i<n;i++){const h=base*(i+1)/n;box(x,h/2,z+side*(d/2+3+(n-i-.5)*.65),8,h,.67,'stone',true,'platform');}
   for(let i=0;i<=bays;i++)for(const side of[-1,1]){const px=x-w/2+i*w/bays;round(px,base+.16,z+side*d/2,.70,.32,'stone');round(px,base+height/2,z+side*d/2,.48,height,'red',true,'column');bracket(px,base+height,z+side*d/2);}
   for(const side of[-1,1]){box(x+side*w/2,base+height/2,z,.7,height,d,'plaster',true,'wall');box(x+side*(w/4+2),base+height/2,z-d/2,w/2-4,height,.7,'plaster',true,'wall');box(x,base+height+.8,z+side*d/2,w+2,.45,.50,'wood',false,'beam');}
   // The front wall sits behind the eaves, leaving a real columned porch and open central doors.
   const bay=w/bays,facade=z+d/2-2.2,openSpan=bays>=9?bay*1.5:bay*.5;
   for(let i=0;i<bays;i++){const px=-w/2+(i+.5)*bay;if(Math.abs(px)<openSpan+.01)continue;
    box(x+px,base+.7,facade,bay-.5,1.4,.35,'plaster',true,'wall');box(x+px,base+4,facade,bay-.7,4.7,.25,'window',false,'window');
    for(const side of[-1,1])box(x+px+side*(bay/2-.25),base+4,facade+.22,.22,5.5,.2,'red',false,'window-frame');
    for(const yy of[1.5,3.3,6.4])box(x+px,base+yy,facade+.25,bay-.5,.2,.2,'wood',false,'window-frame');
    for(let j=0;j<7;j++)box(x+px-bay*.38+j*bay*.76/6,base+4,facade+.25,.09,4.6,.14,'lattice',false,'window-lattice');
   }
   for(const side of[-1,1])for(const pz of[-d/4,d/4]){box(x+side*(w/2+.36),base+4,z+pz,.12,3.4,d*.23,'window',false,'window');for(let j=0;j<7;j++)box(x+side*(w/2+.45),base+4,z+pz-d*.10+j*d*.2/6,.1,3.3,.10,'lattice',false,'window-lattice');}
   for(let i=0;i<=bays;i++){const px=x-w/2+i*w/bays;box(px,base+height+.2,z,.45,.7,d,'wood',false,'beam');}
   roof(x,z,w,d,base+height+1.5);const h={x,z,w,d,base,height,title,kind:'hall',basis:'inferred-form-and-dimensions'};halls.push(h);buildings.push(h);return h;
  }
  function gate(z,title,width=44,height=10){
   const gaps=[[-13,6.2],[0,8.5],[13,6.4]];let edge=-width/2;
   for(const[c,w]of gaps){const left=c-w/2;if(left>edge)box((edge+left)/2,height*.4,z,left-edge,height*.8,12,'wall',true,'wall');box(c,height*.8+1.2,z,w,2.4,12,'wall',true,'wall');edge=c+w/2;}
   if(edge<width/2)box((edge+width/2)/2,height*.4,z,width/2-edge,height*.8,12,'wall',true,'wall');
   for(let x=-width/2+1;x<width/2;x+=5)for(const side of[-1,1]){round(x,height+2.4,z+side*5,.35,4.8,'red');bracket(x,height+4.8,z+side*5,.75);}
   roof(0,z,width,13,height+6);buildings.push({title,x:0,z,w:width,d:12,kind:'gate',basis:title==='承天门'?'three-passages-attested/upper-structure-inferred':'inferred-form'});
  }
  function gallery(x,z,length,vertical=true){
   box(x,.15,z,vertical?5:length,.3,vertical?length:5,'stone',true,'platform');
   for(let u=-length/2+2;u<length/2;u+=5.4)for(const side of[-1,1]){const px=x+(vertical?side*1.7:u),pz=z+(vertical?u:side*1.7);round(px,2.8,pz,.22,5.2,'red',true,'column');bracket(px,5.35,pz,.45);}
   roof(x,z,vertical?4:length,vertical?length:4,6.1);
  }
  for(const x of[-150,150]){box(x,4,80,2,8,520,'wall',true,'wall');box(x,8.1,80,2.8,.3,520,'tile',false);}
  box(0,4,-179,302,8,2,'wall',true,'wall');
  for(const x of[-94,94])box(x,5,285,112,10,2,'wall',true,'wall');
  gate(285,'承天门',64,13);gate(222,'太极门',40,8);
  for(const x of[-88,88])box(x,3,222,104,6,2,'wall',true,'wall');
  largeHall(0,125,62,30,'太极殿',{height:10,base:1.8,bays:11});
  // Low seating, screens and floor mats are interpretive furnishings, not a Qing dragon-throne interior.
  box(0,2.1,116,10,.6,5,'wood',true,'platform');box(0,2.68,115,3,.55,1.8,'red',true);box(0,3.2,114.2,3,1.5,.3,'wood',true);box(0,4.15,111,12,4.5,.5,'screen',true,'wall');
  for(const x of[-12,-8,8,12])box(x,1.85,126,2.3,.10,3.2,'silk',false,'mat');
  for(const x of[-18,18]){round(x,2.5,117,.5,1.4,'gold',true);round(x,3.3,117,.8,.24,'gold');}
  largeHall(0,-126,34,20,'甘露殿·位置推定',{height:7.8,base:.9});
  for(const side of[-1,1]){
   largeHall(side*54,292,20,12,'承天门侧楼·推定',{height:6.2,base:6,bays:5});
   largeHall(side*87,252,32,14,(side<0?'西':'东')+'朝堂·推定',{height:6.5,base:.54});
   largeHall(side*83,180,29,15,'前朝配殿·推定',{height:6.5,base:.54,bays:5});
   largeHall(side*84,118,29,15,'前朝廊院·推定',{height:6.5,base:.54,bays:5});
   largeHall(side*92,31,28,15,'内廷配殿·推定',{height:6.5,base:.54,bays:5});
   largeHall(side*92,-56,28,16,'后寝配殿·推定',{height:6.5,base:.54,bays:5});
   largeHall(side*88,-129,28,16,'后苑配殿·推定',{height:6.5,base:.54,bays:5});
   gallery(side*137,80,445);gallery(side*62,28,110);gallery(side*55,290,45,false);
   for(const z of[-151,-99,83,200])tree(side*116,z);
  }
  buildings.push({title:'两仪门·推定',x:0,z:73,w:16,d:7,kind:'gate',basis:'inferred-form'});
  return {boxes,targets,halls,buildings,bounds:{minX:-148,maxX:148,minZ:-177,maxZ:335},spawns:{gate:{x:0,z:320,yaw:Math.PI},outer:{x:0,z:254,yaw:Math.PI},taiji:{x:0,z:165,yaw:Math.PI},west:{x:-27,z:25,yaw:Math.PI},garden:{x:28,z:12,yaw:Math.PI},court:{x:0,z:-23,yaw:Math.PI},rear:{x:0,z:-104,yaw:Math.PI}},routes:{west:[[0,62],[0,29],[-27,29],[-27,24],[-27,11],[-27,6]],garden:[[-27,6],[-27,26],[0,26],[28,26],[28,12],[28,2]],court:[[28,2],[28,13],[0,13],[0,-24],[0,-33],[0,-43]]},interpretation:{type:'source-based-study',period:'Zhenguan story setting',dimensions:'Visitor precinct; unsurveyed hall sizes, spacing and upper structures are inferred'}};
 }
 function physics(world){
  const solid=world.boxes.filter(b=>b.solid),state={x:world.spawns.gate.x,z:world.spawns.gate.z,y:0,velocity:0,grounded:true},radius=.32,height=1.75,cells=new Map(),cellSize=8;
  for(const b of solid)for(let x=Math.floor((b.x-b.w/2-radius)/cellSize);x<=Math.floor((b.x+b.w/2+radius)/cellSize);x++)for(let z=Math.floor((b.z-b.d/2-radius)/cellSize);z<=Math.floor((b.z+b.d/2+radius)/cellSize);z++){const k=x+','+z;if(!cells.has(k))cells.set(k,[]);cells.get(k).push(b);}
  const near=(x,z)=>cells.get(Math.floor(x/cellSize)+','+Math.floor(z/cellSize))||[];
  const overlap=(b,x,z)=>Math.abs(x-b.x)<b.w/2+radius-1e-5&&Math.abs(z-b.z)<b.d/2+radius-1e-5;
  function clear(x,z,y){const a=world.bounds;if(x<a.minX||x>a.maxX||z<a.minZ||z>a.maxZ)return false;return !near(x,z).some(b=>overlap(b,x,z)&&y+height>b.y-b.h/2+.015&&y<b.y+b.h/2-.015);}
  function support(x,z,ceiling,platformOnly=false){let y=0;for(const b of near(x,z))if((!platformOnly||b.kind==='platform')&&overlap(b,x,z)){const top=b.y+b.h/2;if(top<=ceiling+.015)y=Math.max(y,top);}return y;}
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
  function place(spawn){const y=support(spawn.x,spawn.z,9,true);if(!clear(spawn.x,spawn.z,y))throw Error('Unsafe palace landing');Object.assign(state,{x:spawn.x,z:spawn.z,y,grounded:true,velocity:0});return {...state};}
  function sight(x,z,tx,tz){const n=Math.ceil(Math.hypot(tx-x,tz-z)/.35);for(let i=1;i<n;i++){const px=x+(tx-x)*i/n,pz=z+(tz-z)*i/n;if(near(px,pz).some(b=>b.kind==='wall'&&overlap(b,px,pz)&&b.y-b.h/2<2))return false;}return true;}
  return {state,move,tick,jump,place,clear,sight,groundAt:(x,z)=>support(x,z,9,true),spatialCells:cells.size};
 }
 function segment(p,a,b){const n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.24));let last=p.groundAt(...a);for(let i=1;i<=n;i++){const x=a[0]+(b[0]-a[0])*i/n,z=a[1]+(b[1]-a[1])*i/n,h=p.groundAt(x,z);if(Math.abs(h-last)>.43||!p.clear(x,z,h))return false;last=h;}return true;}
 const grids=new WeakMap();
 function route(world,p,start,end){
  if(segment(p,start,end))return[start,end];const step=2;let grid=grids.get(world);if(!grid){const a=world.bounds,nx=Math.floor((a.maxX-a.minX)/step)+1,nz=Math.floor((a.maxZ-a.minZ)/step)+1,valid=new Uint8Array(nx*nz);for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const x=a.minX+i*step,z=a.minZ+j*step;valid[j*nx+i]=p.clear(x,z,p.groundAt(x,z))?1:0;}grid={a,nx,nz,valid};grids.set(world,grid);}
  const{a,nx,nz,valid}=grid,toPoint=k=>[a.minX+(k%nx)*step,a.minZ+Math.floor(k/nx)*step];
  function closest(point){let best=-1,dist=Infinity;const ix=Math.round((point[0]-a.minX)/step),iz=Math.round((point[1]-a.minZ)/step);for(let dz=-3;dz<=3;dz++)for(let dx=-3;dx<=3;dx++){const i=ix+dx,j=iz+dz;if(i<0||i>=nx||j<0||j>=nz)continue;const k=j*nx+i,q=toPoint(k),d=Math.hypot(q[0]-point[0],q[1]-point[1]);if(valid[k]&&d<dist&&segment(p,point,q)){best=k;dist=d;}}return best;}
  const begin=closest(start),goal=closest(end);if(begin<0||goal<0)return[];const came=new Int32Array(nx*nz).fill(-1),cost=new Float32Array(nx*nz).fill(Infinity),closed=new Uint8Array(nx*nz),heap=[],estimate=k=>Math.hypot(k%nx-goal%nx,Math.floor(k/nx)-Math.floor(goal/nx));
  function push(k,f){let i=heap.length;heap.push({k,f});while(i){const parent=(i-1)>>1;if(heap[parent].f<=f)break;heap[i]=heap[parent];i=parent;}heap[i]={k,f};}
  function pop(){const top=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let child=i*2+1;if(child+1<heap.length&&heap[child+1].f<heap[child].f)child++;if(last.f<=heap[child].f)break;heap[i]=heap[child];i=child;}heap[i]=last;}return top.k;}
  cost[begin]=0;push(begin,estimate(begin));while(heap.length){const k=pop();if(closed[k])continue;if(k===goal){const points=[end];for(let at=k;at!==-1;at=came[at])points.push(toPoint(at));points.push(start);points.reverse();const result=[points[0]];for(let i=0;i<points.length-1;){let j=Math.min(points.length-1,i+40);while(j>i+1&&!segment(p,points[i],points[j]))j--;result.push(points[j]);i=j;}return result;}
   closed[k]=1;for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const x=k%nx+dx,z=Math.floor(k/nx)+dz;if(x<0||x>=nx||z<0||z>=nz)continue;const n=z*nx+x;if(!valid[n]||closed[n]||!segment(p,toPoint(k),toPoint(n)))continue;const c=cost[k]+Math.hypot(dx,dz);if(c<cost[n]){cost[n]=c;came[n]=k;push(n,c+estimate(n));}}}
  return[];
 }
 function direction(yaw,forward,right){return {x:Math.sin(yaw)*forward-Math.cos(yaw)*right,z:Math.cos(yaw)*forward+Math.sin(yaw)*right};}
 function roofMesh(b){const vertices=[],colors=[],nu=Math.max(16,Math.min(144,Math.ceil(b.w/.5))),nv=16;function point(face,u,t){const hx=b.w/2-b.d*t/2,hz=b.d*(1-t)/2,x=face<2?u*hx:(face===2?1:-1)*hx,z=face<2?(face===0?1:-1)*hz:u*hz,y=b.h*(.72*t+.28*t*t)+.25*Math.pow(Math.abs(u),10)*Math.pow(1-t,4);return[x/b.w,y/b.h-.5,z/b.d];}for(let face=0;face<4;face++)for(let v=0;v<nv;v++)for(let u=0;u<nu;u++){const a=u/nu*2-1,d=(u+1)/nu*2-1,t=v/nv,next=(v+1)/nv,points=[point(face,a,t),point(face,d,t),point(face,d,next),point(face,a,t),point(face,d,next),point(face,a,next)],shade=(u%2?.91:1.02)*(v%4===0?.93:1);for(const p of points){vertices.push(...p);colors.push(shade,shade,shade);}}return{vertices,colors};}
 root.ChanganPalaceWorld={layout,physics,direction,roofMesh,route,segment};if(typeof module!=='undefined')module.exports=root.ChanganPalaceWorld;
})(typeof window!=='undefined'?window:globalThis);
