(function(root){
 'use strict';
 function layout(){
  const boxes=[],targets=[],buildings=[],halls=[],signs=[];let serial=0;
  function box(x,y,z,w,h,d,color,solid=true,kind='prop',shape='box'){const b={id:'p'+serial++,x,y,z,w,h,d,color,solid,kind,shape};boxes.push(b);return b;}
  function round(x,y,z,r,h,color,solid=false,kind='detail'){return box(x,y,z,r*2,h,r*2,color,solid,kind,'round');}
  const targetsAt={
   'rain-report':[-31,11],'work-ledger':[-24,10],'wei-zheng':[-27,3],
   'silk-book':[25,1],'plain-sleeve':[33,-2],'empress-zhangsun':[27,-7],
   'court-draft':[-5,-41],'court-map':[5,-41],'li-shimin':[0,-48]
  };
  box(0,-1,80,304,2,520,'ground',false);
  box(0,.005,80,304,.01,520,'earth',false,'ground-surface','earth');
  for(const [z,d,w]of[[180.5,203,260],[315,46,260],[287,10,260],[-1,154,90]])box(0,.025,z,w,.02,d,'paving',false,'court-paving','paving');
  box(0,.055,80,9,.02,502,'path',false,'processional-path','paving');
  const plaqueNames=['承天門','太極門','兩儀門','太極殿','兩儀殿','甘露殿','議事廊','書閣','東朝堂','西朝堂','東廊','西廊'];
  function plaque(text,x,y,z,width=5.8){z+=.35;const slot=plaqueNames.indexOf(text);if(slot<0)return;const height=width/3.2,board=box(x,y,z,width+.18,height+.16,.24,'signwood',false,'signboard'),mount=box(x,y+.25,z-.32,width+1,.28,.50,'wood',false,'sign-mount');for(const side of[-1,1]){box(x,y+side*(height/2+.035),z+.13,width+.18,.09,.08,'wood',false,'plaque-frame');box(x+side*(width/2+.045),y,z+.13,.09,height,.08,'wood',false,'plaque-frame');}signs.push({text,slot,x,y,z:z+.132,w:width,h:height,boardId:board.id,mountId:mount.id});}

  for(const x of [-46,46]){box(x,3,-1,2,6,158,'wall',true,'wall');box(x,6.25,-1,2.8,.5,158,'tile',false);}
  for(const x of[-27,27]){box(x,3,-79,40,6,2,'wall',true,'wall');box(x,6.25,-79,42,.5,2.8,'tile',false);}
  for(const x of [-27,27]){box(x,3,77,40,6,2,'wall',true,'wall');box(x,6.25,77,42,.5,2.8,'tile',false);}
  function roof(x,z,w,d,y,color='tile',form='hip'){
   const W=Math.max(w,d)+7,D=Math.min(w,d)+7,rise=Math.min(6.5,D*.20),b=box(x,y+rise/2,z,W,rise,D,color,false,'roof',form);if(d>w)b.ry=Math.PI/2;
   const ridge=W-D*(form==='gable'?.35:1);for(const side of[-1,1])for(let k=0;k<6;k++)box(x+(d>w?0:side*(ridge/2+k*.11)),y+rise+.25+k*.24,z+(d>w?side*(ridge/2+k*.11):0),d>w?.5:.68-k*.06,.32,d>w?.68-k*.06:.5,'ridge',false,'chiwei');
   box(x,y+rise+.12,z,d>w?.5:ridge+.7,.3,d>w?ridge+.7:.5,'ridge',false,'ridge');
   for(const side of[-1,1])for(let u=-W/2+.3;u<W/2;u+=.85){const cap=round(x+(d>w?side*D/2:u),y-.04,z+(d>w?u:side*D/2),.11,.3,'ridge');if(d>w)cap.rz=Math.PI/2;else cap.rx=Math.PI/2;}
  }
  function bracket(x,y,z,s=1){
   box(x,y,z,.9*s,.32*s,.9*s,'red',false,'dougong');
   for(let i=0;i<3;i++){const span=(1.3+i*.58)*s;box(x,y+(.3+i*.3)*s,z,span,.22*s,.45*s,'wood',false,'dougong');box(x,y+(.43+i*.3)*s,z,.45*s,.22*s,span,'wood',false,'dougong');}
  }
  function hall(x,z,w,d,title,theme){return largeHall(x,z,w,d,title,{height:theme==='study'?6.2:theme==='garden'?6.8:8,base:.36,bays:theme==='audience'?7:5,style:theme==='study'?'study':theme==='garden'?'library':'audience',sign:theme==='study'?'議事廊':theme==='garden'?'書閣':'兩儀殿'});}
  hall(0,-44,32,24,'两仪殿','audience');hall(-27,8,19,26,'议事廊·故事陈设','study');hall(28,-3,19,22,'后苑书阁·故事陈设','garden');
  roof(0,73,16,7,8.5);for(const x of[-7,7])box(x,4.2,73,1.3,8.4,1.3,'red',true,'column');box(0,8.35,73,16,.4,1,'wood',false,'beam');plaque('兩儀門',0,7.55,73.6,5.0);
  // Sheltered connecting galleries, with distinct rear garden and court.
  for(const x of[-40,40]){box(x,6.5,36,4,.45,41,'tile',false);for(const z of[18,30,42,54])box(x,3.2,z,.7,6.4,.7,'red',true,'column');}
  function hangingLamp(x,y,z){box(x,y+1.1,z,.08,2.2,.08,'wood',false,'lamp-chain');box(x,y,z,.62,.86,.62,'lamp',false,'hanging-lantern');for(const side of[-1,1]){box(x+side*.33,y,z,.07,.9,.7,'wood',false,'lantern-frame');box(x,y+side*.45,z,.74,.08,.74,'wood',false,'lantern-frame');}box(x,y-.65,z,.08,.4,.08,'red',false,'tassel');}
  function tree(x,z){box(x,2.2,z,1,4.4,1,'wood',true,'tree');for(let i=0;i<3;i++)box(x+i*.3,5+i*.8,z,5.5-i*.7,1.5,4.4-i*.6,'leaf',false);}
  for(const p of[[-35,44],[35,44],[-17,34],[17,34],[-38,-24],[38,-24],[-16,-66],[16,-66]])tree(...p);
  for(const x of[-21,21]){box(x,.25,41,8,.5,12,'stone',true,'platform');box(x,.56,41,6.7,.12,10.8,'water',false);for(const z of[36,46])box(x,.75,z,7,.7,.65,'stone',true);}
  function desk(x,z,color='wood'){box(x,.86,z,3.2,.3,1.8,color,true);for(const dx of[-1.2,1.2])box(x+dx,.44,z,.25,.88,1.4,color,true);}
  for(const id of['rain-report','work-ledger','silk-book','court-draft','court-map']){const[x,z]=targetsAt[id];desk(x,z);box(x,1.04,z,2,.05,1.2,'paper',false);for(let i=0;i<3;i++)box(x-.55+i*.45,1.075,z,.06,.015,.75,'ink',false);}
  box(-5,1.13,-41,.35,.12,.35,'red',false).echo='seal';
  for(const x of[-6,-4])box(x,1.18,-41,.4,.25,1.2,'paper',false).echo='records';
  box(5,1.13,-41,.8,.13,1.1,'gold',false).echo='dawn';
  box(33,1.5,-2,2.8,.3,.6,'wood',true);for(const x of[31.8,34.2])box(x,.85,-2,.2,1.7,.3,'wood',true);box(33,1.05,-2,1.7,1.3,.15,'silk',false);
  box(0,2.1,-54,10,4.2,1,'screen',true,'wall');for(const x of[-4,-2,0,2,4])box(x,2.2,-53.4,.12,3.6,.1,'gold',false);
  for(const x of[-33,-21])for(const z of[-2,16]){box(x,1.1,z,2,2.2,1,'wood',true);for(let i=0;i<5;i++)box(x,0.5+i*.35,z+.55,1.65,.15,.2,i%2?'paper':'ink',false);}
  for(const x of[-10,10]){box(x,.5,-48,2.2,1,1.3,'red',true);box(x,.9,-49,2.2,1.8,.3,'wood',true);}
  function person(id,cloth){const[x,z]=targetsAt[id];box(x,.75,z,.9,1.5,.55,cloth,true,'actor');box(x,1.8,z,.65,.65,.6,'skin',false);box(x,2.18,z,.8,.2,.7,'ink',false);box(x,2.35,z,.5,.25,.5,id==='empress-zhangsun'?'gold':'ink',false);for(const side of[-1,1]){box(x+side*.59,1,z,.28,.85,.35,cloth,false);box(x+side*.14,1.9,z+.32,.07,.07,.05,'ink',false);box(x+side*.23,.15,z+.05,.3,.3,.5,'ink',false);}if(id!=='empress-zhangsun')box(x,1.5,z+.35,.3,.4,.1,'ink',false);box(x,1.09,z,.95,.12,.62,'gold',false);}
  person('wei-zheng','purple');person('empress-zhangsun','teal');person('li-shimin','ochre');
  for(const b of boxes)if(['prop','actor'].includes(b.kind)&&halls.slice(0,3).some(h=>Math.abs(b.x-h.x)<h.w/2&&Math.abs(b.z-h.z)<h.d/2))b.y+=.36;
  for(const[id,[x,z]]of Object.entries(targetsAt))targets.push({id,x,z,kind:['wei-zheng','empress-zhangsun','li-shimin'].includes(id)?'person':'evidence'});
  function largeHall(x,z,w,d,title,{height=8,base=1.08,bays=7,style='office',sign=null}={}){
   const openFront=['court','study','pavilion'].includes(style),openSides=style==='pavilion',form=['study','library','court','pavilion','office'].includes(style)?'gable':'hip',wallColor=['residence','library'].includes(style)?'cream':'plaster';
   box(x,base/2,z,w+6,base,d+6,'stone',true,'platform');box(x,.11,z,w+6.5,.22,d+6.5,'foundation',true,'platform');
   // Stone courses and stair nosings read at walking height, without new collision barriers.
   for(const side of[-1,1]){box(x,base-.06,z+side*(d/2+3.04),w+6.1,.12,.18,'foundation',false,'plinth-coping');box(x,base*.45,z+side*(d/2+3.03),w+5.9,.045,.08,'joint',false,'stone-course');for(let px=-w/2-2;px<w/2+3;px+=2.8)box(x+px,base*.68,z+side*(d/2+3.045),.025,base*.5,.025,'joint',false,'stone-joint');}
   const n=Math.ceil(base/.18);for(const side of[-1,1])for(let i=0;i<n;i++){const h=base*(i+1)/n;box(x,h/2,z+side*(d/2+3+(n-i-.5)*.65),8,h,.67,'stone',true,'platform');box(x,h-.035,z+side*(d/2+3+(n-i-.5)*.65)+side*.32,8.1,.07,.12,'foundation',false,'stair-nosing');}
   for(let i=0;i<=bays;i++)for(const side of[-1,1]){const px=x-w/2+i*w/bays;round(px,base+.16,z+side*d/2,.76,.32,'stone',false,'column-base').shape='base';round(px,base+.36,z+side*d/2,.57,.10,'stone',false,'base-ring');round(px,base+height/2,z+side*d/2,style==='state'?.55:.42,height,'red',true,'column').shape='column';bracket(px,base+height,z+side*d/2);}
   for(const side of[-1,1]){
    if(!openSides)box(x+side*w/2,base+height/2,z,.7,height,d,wallColor,true,'wall');
    if(!openSides)box(x+side*(w/4+2),base+height/2,z-d/2,w/2-4,height,.7,wallColor,true,'wall');
    box(x,base+height+.8,z+side*d/2,w+2,.45,.50,'wood',false,'beam');box(x,base+height+1.30,z+side*d/2,w+3,.42,.7,'wood',false,'roof-bearing-beam');
   }
   const bay=w/bays,facade=z+d/2-2.2,openSpan=bays>=9?bay*1.5:bay*.5,windowHeight=Math.min(4.2,height-2.1),windowY=base+1.5+windowHeight/2;
   if(!openFront)for(let i=0;i<bays;i++){const px=-w/2+(i+.5)*bay;if(Math.abs(px)<openSpan+.01)continue;
    box(x+px,base+.7,facade,bay-.5,1.4,.35,wallColor,true,'wall');box(x+px,windowY,facade,bay-.7,windowHeight,.25,'window',false,'window');
    for(const side of[-1,1])box(x+px+side*(bay/2-.25),windowY,facade+.22,.22,windowHeight+.4,.2,'red',false,'window-frame');
    for(const yy of[1.5,1.5+windowHeight/2,1.5+windowHeight])box(x+px,base+yy,facade+.25,bay-.5,.16,.2,'wood',false,'window-frame');
    const bars=style==='residence'?5:7;for(let j=0;j<bars;j++)box(x+px-bay*.38+j*bay*.76/(bars-1),windowY,facade+.25,.09,windowHeight,.14,'lattice',false,'window-lattice');
   }
   if(!openFront){const doorWidth=Math.min(3.1,bay*.72),doorZ=facade+.18;for(const side of[-1,1]){const door=box(x+side*(openSpan+doorWidth*.32),base+2.3,doorZ-.65,doorWidth,4.6,.20,'screen',false,'open-door');door.ry=side*.80;for(const yy of[.8,2.5,4])box(x+side*(openSpan+.18),base+yy,doorZ,.12,.12,.12,'gold',false,'door-stud');box(x+side*(openSpan+.17),base+2.4,doorZ+.13,.28,.38,.08,'gold',false,'door-handle','ring');}box(x,base+5,facade+.2,openSpan*2+1,.4,.38,'wood',false,'door-lintel');}
   if(!openSides)for(const side of[-1,1])for(const pz of[-d/4,d/4]){box(x+side*(w/2+.36),base+3.5,z+pz,.12,2.8,d*.23,'window',false,'window');for(let j=0;j<5;j++)box(x+side*(w/2+.45),base+3.5,z+pz-d*.10+j*d*.2/4,.1,2.7,.10,'lattice',false,'window-lattice');}
   for(let i=0;i<=bays;i++){const px=x-w/2+i*w/bays;box(px,base+height+.2,z,.45,.7,d,'wood',false,'beam');}
   box(x,base+height+.73,z,w-.3,.16,d-.3,'ceiling',false,'ceiling');
   for(let pz=-d/2+2.5;pz<d/2;pz+=3.2)box(x,base+height+.60,z+pz,w-.5,.22,.22,'wood',false,'ceiling-joist');
   for(const side of[-1,1]){for(let px=-w/2-2;px<w/2+2;px+=1.2){const r=box(x+px,base+height+1.08,z+side*(d/2+1.2),.17,.18,3.6,'ceiling',false,'eave-rafter');r.rx=side*.14;}for(const px of[-w*.29,w*.29])hangingLamp(x+px,base+height-1.35,z+side*(d/2-1));}
   if(style==='library')for(const side of[-1,1]){const sx=x+side*(w/2-1.5);box(sx,base+1.35,z-d*.17,1.2,2.7,d*.5,'wood',true,'bookcase');for(let j=0;j<5;j++)for(let k=0;k<4;k++)box(sx-side*.65,base+.35+j*.47,z-d*.36+k*d*.12,.22,.24,.8,k%2?'paper':'silk',false,'scroll-stack');}
   if(style==='study'||style==='office')for(const side of[-1,1]){box(x+side*w*.32,base+.65,z-d*.26,3,.20,1.7,'wood',true,'writing-desk');for(const dx of[-1,1])box(x+side*w*.32+dx,base+.32,z-d*.26,.18,.64,1.3,'wood',true,'desk-leg');box(x+side*w*.32,base+.78,z-d*.26,1.7,.05,.9,'paper',false,'scroll');}
   if(style==='residence'){box(x,base+2.4,z-d*.30,w*.56,4.8,.13,'silk',false,'inner-curtain');for(let k=0;k<9;k++)box(x-w*.25+k*w*.5/8,base+2.4,z-d*.30+.08,.07,4.6,.08,'screen',false,'curtain-fold');}
   if(style==='court')for(let i=-1;i<=1;i+=2){box(x+i*w*.30,base+.46,z,7,.22,1.2,'wood',true,'bench');for(const p of[-2.7,2.7])box(x+i*w*.30+p,base+.21,z,.25,.42,.8,'wood',true,'bench');}
   if(style==='residence')for(const px of[-w*.30,w*.30]){box(x+px,base+.22,z,5,.44,4,'wood',true,'furniture');box(x+px,base+.46,z,4.7,.07,3.7,'silk',false,'mat');}
   if(style==='pavilion')for(const side of[-1,1]){box(x+side*(w/2-.6),base+.55,z,.2,1.1,d-2,'wood',true,'railing');box(x,base+.55,z-d/2+.6,w-2,1.1,.2,'wood',true,'railing');}
   roof(x,z,w,d,base+height+1.5,style==='residence'?'resTile':'tile',form);if(sign)plaque(sign,x,base+height-.65,z+d/2+.30,style==='state'?6.2:4.8);
   const h={x,z,w,d,base,height,bays,style,roofForm:form,title,kind:'hall',basis:'inferred-form-and-dimensions'};halls.push(h);buildings.push(h);return h;
  }
  function gate(z,title,width=44,height=10){
   const gaps=[[-13,6.2],[0,8.5],[13,6.4]],pierTop=height*.8,deckTop=pierTop+2.4,columnHeight=title==='承天门'?4.8:3.4;let edge=-width/2;
   for(const[c,w]of gaps){const left=c-w/2;if(left>edge)box((edge+left)/2,pierTop/2,z,left-edge,pierTop,12,'wall',true,'wall');edge=c+w/2;
    for(const side of[-1,1])box(c+side*(w/2-.09),pierTop/2,z+6.06,.18,pierTop,.18,'red',false,'door-frame');
   }
   if(edge<width/2)box((edge+width/2)/2,pierTop/2,z,width/2-edge,pierTop,12,'wall',true,'wall');
   // A continuous header and floor receive every upper-storey post, including those above piers.
   box(0,pierTop+1.2,z,width,2.4,12,'wall',true,'gate-deck');box(0,deckTop-.08,z,width+.8,.28,12.8,'stone',false,'gate-coping');box(0,deckTop+.06,z,width,.12,11.5,'wood',false,'floor');
   for(let x=-width/2+1;x<width/2;x+=5)for(const side of[-1,1]){round(x,deckTop+columnHeight/2,z+side*5,.35,columnHeight,'red',false,'column');bracket(x,deckTop+columnHeight,z+side*5,.75);}
   for(const side of[-1,1])box(0,deckTop+columnHeight+1.1,z+side*5,width+2,.4,.6,'wood',false,'roof-bearing-beam');
   box(0,deckTop+columnHeight+.6,z,width,.2,11.4,'ceiling',false,'ceiling');
   for(const side of[-1,1]){box(0,deckTop+.95,z+side*5.9,width,.20,.20,'wood',false,'gate-rail');box(0,deckTop+.35,z+side*5.9,width,.18,.20,'wood',false,'gate-rail');for(let px=-width/2+.6;px<width/2;px+=1.25)box(px,deckTop+.58,z+side*5.9,.12,1.12,.12,'red',false,'baluster');for(let px=-width/2-1;px<width/2+1;px+=1.2)box(px,deckTop+columnHeight+1.05,z+side*6.5,.18,.20,3.0,'wood',false,'eave-rafter');for(const px of[-20,-7,7,20].filter(v=>Math.abs(v)<width/2-1))hangingLamp(px,pierTop-.85,z+side*5.6);}
   for(const side of[-1,1])for(let yy=.7;yy<pierTop;yy+=.72){for(const[c,gap]of gaps)for(const sx of[-1,1])box(c+sx*(gap/2+.40),yy,z+side*6.02,.75,.045,.035,'joint',false,'gate-masonry-joint');}roof(0,z,width,13,deckTop+columnHeight+1.25,'tile',title==='承天门'?'hip':'gable');plaque(title==='承天门'?'承天門':'太極門',0,pierTop+1.2,z+6.12,title==='承天门'?6.4:5.2);
   buildings.push({title,x:0,z,w:width,d:12,deckTop,columnHeight,kind:'gate',style:title==='承天门'?'monumental-gate':'inner-gate',basis:title==='承天门'?'three-passages-attested/upper-structure-inferred':'inferred-form'});
  }
  function gallery(x,z,length,vertical=true){
   box(x,.15,z,vertical?5:length,.3,vertical?length:5,'stone',true,'platform');
   for(let u=-length/2+2;u<length/2;u+=5.4)for(const side of[-1,1]){const px=x+(vertical?side*1.7:u),pz=z+(vertical?u:side*1.7);round(px,2.8,pz,.22,5.2,'red',true,'column');bracket(px,5.35,pz,.45);}
   box(x,6.0,z,vertical?4:length,.24,vertical?length:4,'wood',false,'roof-bearing-beam');roof(x,z,vertical?4:length,vertical?length:4,6.1,'tile','gable');
  }
  for(const x of[-150,150]){box(x,4,80,2,8,520,'wall',true,'wall');box(x,8.1,80,2.8,.3,520,'tile',false);}
  box(0,4,-179,302,8,2,'wall',true,'wall');
  for(const x of[-94,94])box(x,5,285,112,10,2,'wall',true,'wall');
  gate(285,'承天门',64,13);gate(222,'太极门',40,8);
  for(const x of[-88,88])box(x,3,222,104,6,2,'wall',true,'wall');
  largeHall(0,125,62,30,'太极殿',{height:10,base:1.8,bays:11,style:'state',sign:'太極殿'});
  // Low seating, screens and floor mats are interpretive furnishings, not a Qing dragon-throne interior.
  box(0,2.1,116,10,.6,5,'wood',true,'platform');box(0,2.68,115,3,.55,1.8,'red',true);box(0,3.2,114.2,3,1.5,.3,'wood',true);box(0,4.15,111,12,4.5,.5,'screen',true,'wall');
  for(const x of[-12,-8,8,12])box(x,1.85,126,2.3,.10,3.2,'silk',false,'mat');
  for(const x of[-18,18]){round(x,2.5,117,.5,1.4,'gold',true);round(x,3.3,117,.8,.24,'gold');}
  largeHall(0,-126,34,20,'甘露殿·位置推定',{height:7.8,base:.9,style:'residence',sign:'甘露殿'});
  for(const side of[-1,1]){
   largeHall(side*54,292,20,12,'承天门侧楼·推定',{height:6.2,base:6,bays:5,style:'tower'});
   largeHall(side*87,252,38,12,(side<0?'西':'东')+'朝堂·推定',{height:5.8,base:.54,bays:9,style:'court',sign:side<0?'西朝堂':'東朝堂'});
   largeHall(side*83,180,25,20,'前朝配殿·推定',{height:7.4,base:.72,bays:5,style:'library'});
   largeHall(side*84,118,32,12,'前朝廊院·推定',{height:5.8,base:.54,bays:7,style:'court',sign:side<0?'西廊':'東廊'});
   largeHall(side*92,31,28,15,'内廷配殿·推定',{height:6.4,base:.54,bays:5,style:'office'});
   largeHall(side*92,-56,25,19,'后寝配殿·推定',{height:7.0,base:.72,bays:5,style:'residence'});
   largeHall(side*88,-129,22,17,'后苑配殿·推定',{height:5.6,base:.54,bays:3,style:'pavilion'});
   gallery(side*137,80,445);gallery(side*62,28,110);gallery(side*55,290,45,false);
   for(const z of[-151,-99,83,200])tree(side*116,z);
  }
  buildings.push({title:'两仪门·推定',x:0,z:73,w:16,d:7,kind:'gate',basis:'inferred-form'});
  const garden=(root.ChanganPalaceGarden||(typeof require==='function'?require('./changan-palace-garden.js'):null)).layout();boxes.push(...garden.boxes);
  return {garden,boxes,targets,halls,buildings,signs,bounds:{minX:-148,maxX:148,minZ:-177,maxZ:335},spawns:{gate:{x:0,z:320,yaw:Math.PI},outer:{x:0,z:254,yaw:Math.PI},taiji:{x:0,z:165,yaw:Math.PI},west:{x:-27,z:25,yaw:Math.PI},garden:{x:28,z:12,yaw:Math.PI},court:{x:0,z:-23,yaw:Math.PI},rear:{x:0,z:-104,yaw:Math.PI}},routes:{west:[[0,62],[0,29],[-27,29],[-27,24],[-27,11],[-27,6]],garden:[[-27,6],[-27,26],[0,26],[28,26],[28,12],[28,2]],court:[[28,2],[28,13],[0,13],[0,-24],[0,-33],[0,-43]]},interpretation:{type:'source-based-study',period:'Zhenguan story setting',dimensions:'Visitor precinct; unsurveyed hall sizes, spacing and upper structures are inferred'}};
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
 function roofMesh(b){const vertices=[],colors=[],nu=Math.max(16,Math.min(144,Math.ceil(b.w/.5))),nv=16;function point(face,u,t){const hx=b.w/2-b.d*(b.shape==='gable'?Math.min(t,.35):t)/2,hz=b.d*(1-t)/2,x=face<2?u*hx:(face===2?1:-1)*hx,z=face<2?(face===0?1:-1)*hz:u*hz,y=b.h*(.72*t+.28*t*t)+.25*Math.pow(Math.abs(u),10)*Math.pow(1-t,4)+.05*Math.pow(Math.sin((u+1)*Math.PI*Math.round(b.w/.85)/2),2)*Math.pow(1-t,.45);return[x/b.w,y/b.h-.5,z/b.d];}for(let face=0;face<4;face++)for(let v=0;v<nv;v++)for(let u=0;u<nu;u++){const a=u/nu*2-1,d=(u+1)/nu*2-1,t=v/nv,next=(v+1)/nv,points=[point(face,a,t),point(face,d,t),point(face,d,next),point(face,a,t),point(face,d,next),point(face,a,next)],shade=(u%2?.91:1.02)*(v%4===0?.93:1);for(const p of points){vertices.push(...p);const gable=b.shape==='gable'&&face>=2&&v/nv>=.35;colors.push(gable?shade*1.2:shade,gable?shade*.70:shade,gable?shade*.45:shade);}}return{vertices,colors};}
 root.ChanganPalaceWorld={layout,physics,direction,roofMesh,route,segment};if(typeof module!=='undefined')module.exports=root.ChanganPalaceWorld;
})(typeof window!=='undefined'?window:globalThis);
