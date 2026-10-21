(function(root){
'use strict';
const key='changan:palace-garden:v1';
const sources=[{title:'西安市志·城市基础设施（宫苑池沼记述）',url:'https://dfz.shaanxi.gov.cn/zslm/fzzlk/xbsxsxz/xbsxz/xas_16198/201405/P020240923626369225675.pdf'},{title:'中国国家博物馆：含光殿“毬场”石志',url:'https://www.chnmuseum.cn/zp/zpml/kgfjp/202111/t20211116_252283.shtml'},{title:'中国国家博物馆：催马战犹酣',url:'https://www.chnmuseum.cn/yj/xscg/xslw/201812/t20181224_33164.shtml'}];
const views=[['garden-pine','松石径',-111,-96,'松影隔开了墙与小径，石罅里留着一点夜凉。绕到石后，再看殿角，才知道高处也有安静的一面。'],['garden-flowers','花圃',-43,-157,'花圃不争殿前的阔大。沿着土埂走来，细叶与白花低低地伏在月色里，宫城也有属于四时的小地方。'],['garden-water-view','池上小桥',-46,-126,'站在桥心，水将廊影分成两半。来时只见重门，走到这里，才听见这一夜的水声。']];
function layout(){
 const boxes=[],targets=[],areas=[{id:'pond',title:'池苑 · 理水',x:-46,z:-125,w:42,d:66},{id:'ballcourt',title:'小毬场 · 步打',x:96,z:78,w:42,d:40},{id:'rockery',title:'松石径 · 寻景',x:-108,z:-96,w:34,d:31}],spawns={pond:{x:-24,z:-105,yaw:-Math.PI/2},ballcourt:{x:96,z:95,yaw:Math.PI},rockery:{x:-111,z:-92,yaw:Math.PI}};
 function box(x,y,z,w,h,d,color,solid=false,kind='garden-detail',shape='box',tag){const b={id:'g'+boxes.length,x,y,z,w,h,d,color,solid,kind,shape};if(tag)b.gardenTag=tag;boxes.push(b);return b;}
 function pine(x,z,scale=1){box(x,1.8*scale,z,.7*scale,3.6*scale,.7*scale,'wood',true,'tree');for(let i=0;i<3;i++)box(x+(i%2?.6:-.4)*scale,(3.4+i*.65)*scale,z,(5.8-i)*scale,.65*scale,(4.2-i*.5)*scale,'leaf');}
 // The pond occupies an unused rear precinct. Its bridge and coping have real collision.
 box(-46,.10,-126,30,.12,38,'water',false,'garden-water');
 for(const x of[-61.4,-30.6])box(x,.40,-126,.8,.8,39.8,'stone',true,'pond-edge');
 for(const z of[-145.4,-106.6])box(-46,.40,z,30,.8,.8,'stone',true,'pond-edge');
 // East/west openings are filled by a low, traversable bridge deck, never a water reset.
 for(const b of boxes.slice(-4,-2)){b.d=17.5;b.z=-136.7;box(b.x,.40,-115.3,.8,.8,17.5,'stone',true,'pond-edge');}
 box(-46,.12,-126,34,.24,3.6,'stone',true,'platform');
 for(const z of[-128.05,-123.95]){box(-46,.68,z,33,.16,.18,'wood',true,'garden-rail');for(let x=-61;x<=-31;x+=5)box(x,.40,z,.18,.8,.18,'wood',true,'garden-rail');}
 for(let i=0;i<15;i++){const x=-58+(i*7%25),z=-141+(i*11%29);if(Math.abs(z+126)<3)continue;box(x,.19,z,1.5,.06,1.1,'lotusLeaf');if(i%3===0)box(x,.40,z,.45,.30,.45,'lotusFlower',false,'garden-flower','box','lotus');}
 for(const[x,z]of[[-65,-147],[-26,-143],[-66,-111]])pine(x,z);
 for(let i=0;i<3;i++){box(-29,.31,-103-i*2,2,.18,1.8,'stone');box(-29,.42,-103-i*2,1.4,.06,1.25,'water',false,'garden-channel','box','channel-'+i);box(-27.7,.65,-103-i*2,.3,.65,.3,'wood');}
 box(-27,.43,-105,1,.86,1,'wood',true,'garden-console');box(-27,.88,-105,1.4,.08,1.4,'paper');
 targets.push({id:'garden-water',title:'池苑理水',x:-27,z:-105,kind:'garden'});
 // A modest practice ground, not a reconstructed full royal polo stadium.
 for(const x of[76.4,115.6])box(x,.10,78,.35,.20,36,'stone');for(const z of[60.2,96])box(96,.10,z,39,.20,.35,'stone');
 for(const x of[89.5,102.5])box(x,1.55,62,1,3.1,.7,'wood',true,'garden-goal');box(96,3.0,62,14,.5,.7,'wood',true,'garden-goal');
 // Four timber panels leave a genuine opening at ground level.
 for(const x of[92,100])box(x,1.0,62,4,2,.45,'screen',true,'garden-goal');box(96,2.2,62,4,.5,.45,'screen',true,'garden-goal');
 for(const x of[80,112]){box(x,.40,87,3,.8,1.2,'wood',true,'bench');box(x,1.4,91,.28,2.8,.28,'wood',true,'garden-rack');for(let i=0;i<3;i++){box(x+(i-1)*.45,1.3,91,.10,2.6,.10,'wood');box(x+(i-1)*.45+.22,.20,91,.50,.18,.18,'wood');}}
 box(96,.24,90,.48,.48,.48,'ball',false,'garden-ball','ball','ball');
 targets.push({id:'garden-ball',title:'步打试球',x:96,z:92,kind:'garden'});
 // Pine/rock path and low flower beds have different silhouettes from the halls.
 for(const[x,z,s]of[[-121,-103,1.1],[-102,-104,.85],[-120,-86,.8]])pine(x,z,s);
 for(const[x,z,w,h]of[[-113,-101,5,3.8],[-107,-99,4,2.5],[-117,-96,3.8,2.1],[-101,-89,3,2]]){box(x,h/2,z,w,h,w*.72,'rock',true,'garden-rock','garden-rock');}
 for(const side of[-1,1]){const x=-43+side*8;box(x,.14,-158,4,.28,16,'earthBed');for(let i=0;i<9;i++){box(x+(i%2?-.6:.6),.48,-165+i*1.7,.12,.7,.12,'leaf');box(x+(i%2?-.6:.6),.82,-165+i*1.7,.55,.2,.55,i%3?'lotusFlower':'lotusLeaf');}}
 for(const[id,title,x,z]of views){if(id!=='garden-water-view'){box(x,.32,z,1.2,.64,.7,'stone',true,'garden-marker');box(x,.68,z,1.2,.08,.75,'paper');}targets.push({id,title,x,z,kind:'garden'});}
 return{boxes,targets,areas,spawns,views};
}
function state(storage){let raw;try{raw=JSON.parse(storage?.getItem(key)||'null');}catch{}let record={version:1,water:raw?.version===1&&raw.water===true,best:Number.isInteger(raw?.best)?Math.max(0,Math.min(3,raw.best)):0,seen:Array.isArray(raw?.seen)?[...new Set(raw.seen.filter(id=>views.some(v=>v[0]===id)))]:[]},writable=true;
 function save(){try{if(!storage)throw Error('No storage');storage.setItem(key,JSON.stringify(record));}catch{writable=false;}}
 return{snapshot:()=>({...record,seen:[...record.seen],writable}),water(){record.water=true;save();},score(n){if(Number.isInteger(n)&&n>=0&&n<=3){record.best=Math.max(record.best,n);save();}},see(id){if(!views.some(v=>v[0]===id))return false;if(!record.seen.includes(id)){record.seen.push(id);save();}return true;}};
}
function connected(turns){return turns.length===3&&[0,1,2,3].includes(turns[0])&&turns[0]===2&&turns[1]===0&&(turns[2]===1||turns[2]===3);}
function shot(angle,power,round){if(!Number.isFinite(angle)||!Number.isFinite(power)||!Number.isInteger(round)||round<0||round>2)return null;angle=Math.max(-30,Math.min(30,angle));power=Math.max(35,Math.min(100,power));const wind=[-4,5,-2][round],r=angle*Math.PI/180,range=power*.5,reach=range*Math.cos(r),cross=28*Math.tan(r)+wind*.32,goal=reach>=28&&Math.abs(cross)<=1.85;return{goal,x:Math.max(-18,Math.min(18,goal?cross:range*Math.sin(r)+wind*.32)),z:goal?28:Math.min(33,reach),cross,wind};}
function surfaces(THREE){const p=[],c=[],cache=new Map();let patches=0;function rect(x0,z0,x1,z1,y,color,shade=1){if(x1<=x0||z1<=z0)return;let rgb=cache.get(color);if(!rgb){const v=new THREE.Color(color);rgb=[v.r,v.g,v.b];cache.set(color,rgb);}for(const i of[0,1,2,0,2,3]){const q=[[x0,y,z0],[x0,y,z1],[x1,y,z1],[x1,y,z0]][i];p.push(...q);c.push(...rgb.map(v=>v*shade));}patches++;}
 // Quiet packed-earth courts and gravel margins, with jointed stone reserved for routes.
 for(let x=-152;x<152;x+=8)for(let z=-180;z<340;z+=8)rect(x,z,Math.min(152,x+8),Math.min(340,z+8),.012,'#77786a',.98+(Math.sin(x*3+z*7)+1)*.012);
 rect(-65,80,65,280,.019,'#858477');rect(-130,293,130,337,.019,'#858477');rect(-44,-78,44,76,.019,'#7e8376');
 // Seeded fine gravel breaks up broad earth without another repeated texture.
 let seed=63021;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<19000;i++){const x=-149+random()*298,z=-176+random()*510,w=.055+random()*.14,d=.035+random()*.12;rect(x,z,x+w,z+d,.021,random()>.5?'#8c8978':'#777568',.98+random()*.04);}
 let pavedLevel=0;function pave(x0,z0,x1,z1,y=.032){y+=pavedLevel++*.00025;rect(x0,z0,x1,z1,y,'#747c70');let row=0;for(let z=z0;z<z1;z+=1.25,row++)for(let x=x0-(row%2?.8:0);x<x1;x+=1.6)rect(Math.max(x0,x)+.009,z+.009,Math.min(x1,x+1.6)-.009,Math.min(z1,z+1.25)-.009,y+.003,'#8d9388',.985+(Math.sin(x*7+z*9)+1)*.012);}
 pave(-4.5,-171,4.5,332,.045);for(const z of[275,212,141,84,-87,-151])pave(-129,z,129,z+3.8);for(const x of[-67,67])pave(x-1.8,-151,x+1.8,276);
 for(const x of[-40,40])pave(x-2.3,-77,x+2.3,75);pave(-64,-109,-27,-103);pave(-113,-95,-67,-91);pave(-45,-170,-41,-144);pave(70,94,116,98);
 pave(-63,-127.8,-29,-124.2,.242);
 rect(77,61,115,95,.051,'#967f5e');for(const z of[62,90])rect(88,z-.025,104,z+.025,.054,'#b3a686');
 // Organic, stepped planting areas rather than a giant green rectangle.
 for(const[x,z,w,d]of[[-120,-102,18,24],[-106,-99,15,12],[-65,-151,17,13],[-28,-147,9,11],[-58,-160,14,18],[-30,-160,13,18]])rect(x-w/2,z-d/2,x+w/2,z+d/2,.023,'#52614b');
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.computeVertexNormals();g.computeBoundingSphere();const material=new THREE.MeshLambertMaterial({vertexColors:true,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),mesh=new THREE.Mesh(g,material);mesh.name='palace-exterior-surfaces';mesh.userData={patches,usesImages:false,quietCourts:true};return{mesh,batches:1,dispose(){g.dispose();material.dispose();}};
}
function createUI({storage,open,close,canReach,go,listen,dialog,onChange}){
 const book=state(storage);let current=null,turns=[0,1,0],shots=[],message='';const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const boundary='<p class="dialog-note">宫苑池沼和唐代球戏有文献及文物参考；此处位置、池桥、花木、理水谜题与步打规则均为游戏创作。含光殿石志属于大明宫，不能据此认定贞观太极宫此处原有同形球场。</p>';
 function status(){return book.snapshot().writable?'游苑进度只记在此网址本机，不改变人物缘分或宫中奏议。':'本机暂时无法保存，当前仍可游玩；离开后可能不能续接。';}
 function catalog(){current=null;const s=book.snapshot();open('宫苑闲游','暂搁奏议，也可自成一游','<p>宫图可移步，亲自走近池台、毬场或景物后再玩。三处闲游没有强制先后。</p><div class="palace-rooms">'+[['pond','池苑理水','转动三道渠闸，令水从渠首走到荷池。',s.water?'水路已通':'尚待理水'],['ballcourt','小毬场步打','看风向，调方向与力道，三球记一次成绩。','最好 '+s.best+' / 3'],['rockery','松石寻景','走过松石径、池桥和花圃，收齐三则原创景笺。',s.seen.length+' / 3 景']].map(([id,title,text,count])=>'<article class="palace-room"><h3>'+title+'</h3><p>'+text+'</p><small>'+count+'</small><button data-garden-go="'+id+'">移步游玩</button></article>').join('')+'</div><p>'+status()+'</p>'+boundary+'<details><summary>文献与文物参考</summary><ul class="source-list">'+sources.map(s=>'<li><a href="'+s.url+'" target="_blank" rel="noopener noreferrer">'+s.title+'</a></li>').join('')+'</ul></details>');}
 function waterSVG(){const cells=[[70,60,0],[70,180,1],[190,180,2]];return '<svg class="garden-water-plan" viewBox="0 0 300 240" role="img" aria-label="渠首在左上，依次经过上闸、下闸、右闸至右下荷池"><path d="M10 60H30M70 100V140M110 180H150M230 180H276" stroke="#729c9a" stroke-width="9" fill="none"/>'+cells.map(([x,y,i])=>'<rect x="'+(x-40)+'" y="'+(y-40)+'" width="80" height="80" rx="7" fill="#263b39" stroke="#b7a174"/><g transform="translate('+x+' '+y+') rotate('+turns[i]*90+')"><path d="'+(i===2?'M0 -40V40':'M0 -40V0H40')+'" fill="none" stroke="'+(book.snapshot().water?'#a0c6b2':'#b9b79e')+'" stroke-width="10"/></g><text x="'+x+'" y="'+(y+7)+'" text-anchor="middle" fill="#172b2d" font-size="16">'+['一','二','三'][i]+'</text>').join('')+'<circle cx="280" cy="180" r="14" fill="#819d83"/></svg>';}
 function water(){current='garden-water';open('池苑理水','使渠首与荷池相通','<p>浅色线是石渠：从左上进水，经一、二、三闸，流向右下荷池。点按钮，每次转四分之一圈，再试着引水。</p>'+waterSVG()+'<div class="garden-actions">'+[0,1,2].map(i=>'<button data-garden-turn="'+i+'">转动'+['一','二','三'][i]+'闸</button>').join('')+'</div><button data-garden-release class="primary">引水入池</button><p class="garden-result" role="status" aria-live="polite">'+escape(message|| (book.snapshot().water?'这处水路曾经接通，可再试一种转法。':'先找上闸向下的出口。'))+'</p><p>'+status()+'</p><button data-close>合笺，看看池水</button>');}
 function ball(){current='garden-ball';const r=shots.length,s=book.snapshot(),last=shots.at(-1),wind=r<3?[-4,5,-2][r]:0;open('小毬场 · 步打试球','三球一局 · 原创练习','<p>用木杖在地面试球。方向向左为负，向右为正；力道至少过半才足以到门。'+(r<3?'此球风偏'+(wind<0?'左':'右')+'，可稍向另一侧修正。':'本局已毕。')+'</p><svg class="garden-ball-plan" viewBox="0 0 240 230" role="img" aria-label="上方为球门，下方为发球处"><rect x="15" y="12" width="210" height="204" rx="4" fill="#826e51"/><path d="M102 26H138" stroke="#e6d2a5" stroke-width="7"/><path d="M120 204L'+(120+(last?.x||0)*5)+' '+(204-(last?.z||0)*6)+'" stroke="#e3c895" stroke-width="2" stroke-dasharray="5 5"/><circle cx="'+(120+(last?.x||0)*5)+'" cy="'+(204-(last?.z||0)*6)+'" r="5" fill="#f4ddaa"/></svg>'+(r<3?'<div class="garden-sliders"><label>方向 <output id="gardenAngleValue">0°</output><input aria-label="击球方向" id="gardenAngle" type="range" min="-30" max="30" step="1" value="0"></label><label>力道 <output id="gardenPowerValue">65</output><input aria-label="击球力道" id="gardenPower" type="range" min="35" max="100" step="1" value="65"></label></div><button data-garden-hit class="primary">击出第'+(r+1)+'球</button>':'<button data-garden-round>再试三球</button>')+'<p class="garden-result" role="status" aria-live="polite">'+escape(message||'调好方向和力道，再出手。')+'</p><p>本局 '+shots.filter(s=>s.goal).length+' / '+r+'，本机最好 '+s.best+' / 3。</p><p>'+status()+'</p><button data-close>回到毬场</button>');}
 function scenic(id){const v=views.find(v=>v[0]===id);if(!v)return;current=id;const s=book.snapshot();open(v[1]+' · 景笺','停一停，看宫苑的另一面','<p class="garden-prose">'+v[4]+'</p>'+(s.seen.includes(id)?'<p>这一景已收在本机游苑笺中。</p>':'<button data-garden-keep="'+id+'">收下此景</button>')+'<p>三景 '+s.seen.length+' / 3：松石径、池上小桥、花圃。</p>'+(s.seen.length===3?'<h3>苑游一页 · 原创</h3><p>从殿前走到水边，宫城不再只有高处的屋脊。松石留凉，花圃留香，桥下留一段缓缓的水。今夜暂不问奏议，且记这一程。</p>':'')+'<p>'+status()+'</p><button data-garden-list>看看其余闲游</button>');}
 function enter(id){if(!['garden-water','garden-ball',...views.map(v=>v[0])].includes(id)||!canReach(id))return false;message='';if(id==='garden-water')water();else if(id==='garden-ball'){shots=[];ball();}else scenic(id);return true;}
 listen(dialog,'input',e=>{if(current!=='garden-ball')return;const id=e.target.id;if(id==='gardenAngle'||id==='gardenPower'){const out=dialog.querySelector('#'+id+'Value');if(out)out.textContent=e.target.value+(id==='gardenAngle'?'°':'');}});
 listen(dialog,'click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-garden-list')){catalog();return;}if(b.dataset.gardenGo){const id=b.dataset.gardenGo;if(go(id)){if(id==='pond')enter('garden-water');else if(id==='ballcourt')enter('garden-ball');else enter('garden-pine');}return;}if(!current||!canReach(current))return;
  if(b.hasAttribute('data-garden-turn')&&current==='garden-water'){const i=Number(b.dataset.gardenTurn);if(Number.isInteger(i)&&i>=0&&i<3){turns[i]=(turns[i]+1)%4;message='';water();}}
  else if(b.hasAttribute('data-garden-release')&&current==='garden-water'){if(connected(turns)){book.water();message='水路通了。荷池接到了活水，池边花色也亮了一点。';onChange();}else message='水仍停在断开的渠口。沿浅线看一遍，每一段入口与出口都要相接。';water();}
  else if(b.hasAttribute('data-garden-hit')&&current==='garden-ball'&&shots.length<3){const a=Number(dialog.querySelector('#gardenAngle')?.value),p=Number(dialog.querySelector('#gardenPower')?.value),hit=shot(a,p,shots.length);if(!hit)return;shots.push(hit);message=hit.goal?'穿门入毬。':'这一球'+(hit.z<28?'力短，尚未到门。':'偏出了球门，下一球再校方向。');if(shots.length===3)book.score(shots.filter(s=>s.goal).length);onChange(hit);ball();}
  else if(b.hasAttribute('data-garden-round')&&current==='garden-ball'){shots=[];message='新一局开始，最好成绩保留。';ball();}
  else if(b.dataset.gardenKeep===current){book.see(current);scenic(current);onChange();}
 });
 return{catalog,enter,suspend(){current=null;},snapshot:()=>({...book.snapshot(),current}),dispose(){current=null;}};
}
const api={layout,state,connected,shot,surfaces,createUI,key,sources};root.ChanganPalaceGarden=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
