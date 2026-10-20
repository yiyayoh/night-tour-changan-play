(function(root){
 'use strict';
 const followKey='changan:palace-follow:v1';
 function create(options){
  const {content,dialog,open,close,notice,canReach,onChange,onFollow,listen}=options;
  const people=new Map(content.characters.map(p=>[p.id,p])),records=new Map();
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const source=(label,url)=>{try{if(new URL(url).protocol!=='https:')return '';}catch{return '';}return '<a target="_blank" rel="noopener noreferrer" href="'+esc(url)+'">'+esc(label||'查看依据')+'</a>';};
  const tabs=[['bio','人物小传'],['talk','识人六问'],['letters','知音手札'],['quest','个人托付'],['meet','灯下相约']];
  let current=null,tab='bio',epoch=0,controller=null,pending=false,disposed=false,message='',signIn=false,question=0,reply=null,meeting=null,tracked=null,timeout=0,refreshNeeded=false;
  let storage;try{storage=root.localStorage||localStorage;const saved=JSON.parse(storage?.getItem(followKey)||'null');if(people.has(saved?.id))tracked=saved.id;}catch{}
  const character=id=>people.get(id),data=()=>records.get(current),trackedData=()=>records.get(tracked);
  function changed(){onChange?.();}
  function saveFollow(){try{storage?.setItem(followKey,JSON.stringify(tracked?{id:tracked}:null));}catch{}}
  function stop(){tracked=null;saveFollow();changed();}
  function cancel(){epoch++;controller?.abort();controller=null;clearTimeout(timeout);timeout=0;pending=false;}
  function validate(value){
   const text=s=>typeof s==='string'&&s.length>0,j=value?.journey,p=value?.progress;
   if(!value||!text(value.name)||!text(value.greeting)||!Array.isArray(value.questions)||value.questions.length!==6||value.questions.some(q=>!text(q.id)||!text(q.prompt)||!Array.isArray(q.options)||q.options.length!==3||q.options.some(o=>!text(o)))||!p||!Number.isFinite(p.score)||p.score<0||p.score>60||!p.answers||typeof p.answers!=='object'||Array.isArray(p.answers)||!text(p.stage)||!Array.isArray(value.rewards)||value.rewards.length!==3||value.rewards.some(r=>!text(r.title)||!Number.isFinite(r.threshold)||typeof r.unlocked!=='boolean'||r.unlocked&&(!text(r.text)||!text(r.basis)||!text(r.sourceLabel)||!text(r.sourceUrl)))||!j?.state||!Number.isInteger(j.state.completedSteps)||j.state.completedSteps<0||j.state.completedSteps>3||typeof j.state.complete!=='boolean'||!text(j.quest?.title)||!text(j.quest?.intro)||!Array.isArray(j.quest.steps)||j.quest.steps.length!==3||j.quest.steps.some(s=>!text(s.id)||!text(s.title)||!text(s.clue)||!text(s.target)||!text(s.actionLabel))||!text(j.conversation?.prompt)||!Array.isArray(j.conversation.choices)||j.conversation.choices.length!==2||j.conversation.choices.some(c=>!text(c.id)||!text(c.label))||j.state.branch&&!text(j.conversation.selected?.response)||j.state.complete&&(!text(j.ending?.title)||!text(j.ending?.text))||typeof j.vignette?.available!=='boolean'||!text(j.vignette.title)||j.vignette.available&&(!Array.isArray(j.vignette.lines)||j.vignette.lines.length!==3||j.vignette.lines.some(l=>!text(l))||!text(j.vignette.closing)))throw Error('人物志回应不完整，请重新读取。');
   return value;
  }
  async function api(id,body,signal){
   const response=await root.fetch('/api/'+(body?'journeys/':'relationships/')+id,{method:body?'POST':'GET',credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,signal});
   let value;try{value=await response.json();}catch{throw Error('人物志暂未读到，请重新展开。');}
   if(!response.ok){const error=Error(value.error||'这一笔尚未确认保存，请重试。');error.signIn=response.status===401;throw error;}
   return validate(value);
  }
  function login(){return '<a class="dossier-login" href="/signin-with-chatgpt?return_to='+encodeURIComponent('/palace.html?person='+current)+'">登录后接着写人物志</a>';}
  function status(){return '<p id="palaceDossierStatus" class="dossier-status" role="status" aria-live="polite">'+esc(message)+'</p>'+(signIn?login():!data()&&!pending?'<button data-dossier-retry>重新读取人物志</button>':'');}
  function meter(){const d=data(),score=d?.progress.score;return '<section class="dossier-progress" aria-label="与人物的相识进度"><span>'+(d?esc(d.progress.stage):'待展开')+' · '+(d?score:'—')+' / 60</span><progress max="60" value="'+(score||0)+'" aria-label="相识进度"></progress><small>初识 10 · 相知 30 · 知音 60；这里记下信任与理解。</small></section>';}
  function questionHTML(){
   const d=data();if(!d)return '<p>登录同一账号，继续与你相识的六问。史料小传可先自由阅读。</p>';
   const q=d.questions[question],best=d.progress.answers[q.id]?.best||0;
   return '<p>'+esc(d.greeting)+'</p><p class="eyebrow">第 '+(question+1)+' / 6 问 · '+(best===10?'已相契':best?'已记 4 点，可重答':'尚未作答')+'</p><h3>'+esc(q.prompt)+'</h3><div class="choices">'+q.options.map((label,index)=>'<button data-dossier-answer="'+index+'"'+(pending?' disabled':'')+'>'+esc(label)+'</button>').join('')+'</div>'+(reply?'<section class="reply" tabindex="-1" id="palaceDossierReply"><p>'+esc(reply.text)+'</p>'+source(reply.sourceLabel,reply.sourceUrl)+'</section>':'')+'<div class="dossier-actions"><button data-dossier-page="-1"'+(pending||question===0?' disabled':'')+'>上一问</button><button data-dossier-page="1"'+(pending||question===5?' disabled':'')+'>下一问</button></div><p class="dialog-note">问题依据见答后出处；人物口吻为原创。答对一问 10 点，初次答错 4 点；重答只补差额，关系最多 60 点。托付可另记最多 20 点。</p>';
  }
  function lettersHTML(){const d=data();if(!d)return '<p>与故人对谈后，三封原创手札会随相识进度展开。</p>';return '<p>这些书信是本作的文学创作。读到一封，云端游记便留下一页。</p><div class="dossier-letters">'+d.rewards.map(r=>'<article data-locked="'+!r.unlocked+'"><span class="eyebrow">'+r.threshold+' 点 · '+(r.unlocked?'已展开':'待相识')+'</span><h3>'+esc(r.title)+'</h3><p>'+esc(r.unlocked?r.text:'再积 '+Math.max(0,r.threshold-d.progress.score)+' 点，展开这一封。')+'</p>'+(r.unlocked?'<p class="dossier-basis">'+esc(r.basis)+'</p>'+source(r.sourceLabel,r.sourceUrl):'<button data-dossier-tab="talk">去灯下相谈</button>')+'</article>').join('')+'</div>';}
  function followButton(label){return '<button class="primary" data-dossier-follow'+(pending?' disabled':'')+'>'+esc(label)+'</button>';}
  function questHTML(){
   const d=data(),j=d?.journey;if(!j)return '<p>每位故人有自己的三站托付。展开人物志后，可赴宫中相谈。</p>';
   const selected=j.state.branch,near=canReach(current),ended=j.state.complete;
   return '<span class="eyebrow">独立支线 · 不改写修缮议</span><h3>'+esc(j.quest.title)+'</h3><p>'+esc(j.quest.intro)+'</p><p>'+esc(j.conversation.prompt)+'</p>'+(selected?'<p class="reply">'+esc(j.conversation.selected.response)+'</p>':'<div class="choices">'+j.conversation.choices.map(c=>'<button data-dossier-branch="'+esc(c.id)+'"'+(pending||!near?' disabled':'')+'>'+esc(c.label)+'</button>').join('')+'</div>'+(!near?'<p>请先走近'+esc(character(current).name)+'，再当面接下托付。</p>':''))+'<ol class="dossier-steps">'+j.quest.steps.map((s,i)=>'<li data-done="'+(i<j.state.completedSteps)+'"><strong>'+(i<j.state.completedSteps?'已记 · ':String(i+1)+' · ')+esc(s.title)+'</strong><p>'+esc(i<j.state.completedSteps?s.foundText:s.clue)+'</p></li>').join('')+'</ol>'+(ended?'<section class="reply"><h3>'+esc(j.ending.title)+'</h3><p>'+esc(j.ending.text)+'</p></section><button data-dossier-tab="meet">看看灯下相约</button>':followButton(selected?'循灯，接着这一程':'循灯，前往相谈'))+'<p class="dialog-note">首次取舍与每站各记 5 点，最多 20 点；重复操作不加分。一个账号保留第一次取舍。这段托付与结尾为原创演绎。</p>';
  }
  function meetingHTML(){
   const d=data(),j=d?.journey;if(!j)return '<p>完成个人托付，并相识至知音，便可展开一段专属相约。</p>';
   if(!j.vignette.available)return '<h3>'+esc(j.vignette.title)+'</h3><p>完成三站托付，并达到知音（60 点）后解锁。</p><p>托付 '+j.state.completedSteps+' / 3 · 相识 '+d.progress.score+' / 60</p><div class="dossier-actions"><button data-dossier-tab="quest">接着个人托付</button><button data-dossier-tab="talk">接着灯下对谈</button></div>';
   if(meeting?.id===current)return '<span class="eyebrow">原创相约 · 第 '+(meeting.index+1)+' / 3 幕</span><h3>'+esc(j.vignette.title)+'</h3><p class="dossier-scene">'+esc(j.vignette.lines[meeting.index])+'</p>'+(meeting.index===2?'<p>'+esc(j.vignette.closing)+'</p>':'')+'<button class="primary" data-dossier-scene-next'+(pending?' disabled':'')+'>'+(meeting.index===2?'读完此夜，记入游记':'接着听')+'</button><p class="dialog-note">随时合卷即可暂别；读完并确认保存后才会记入云端游记。</p>';
   return '<h3>'+esc(j.vignette.title)+'</h3><p>'+esc(j.state.vignetteSeen?'这一场相约已入游记，也可再次重读。':'托付已成，知音已识。回到本人身旁，留一段从容的灯下相约。')+'</p>'+(canReach(current)?'<button class="primary" data-dossier-scene-start'+(pending?' disabled':'')+'>赴这一场相约</button>':followButton('循灯，赴约'))+'<p class="dialog-note">三幕静读，无倒计时；人物言语与相逢均为原创，不是历史实录。</p>';
  }
  function render(preserve=false){
   if(disposed||!current||!dialog.open)return;const p=character(current);if(!p)return;
   const top=dialog.scrollTop,focus=dialog.ownerDocument.activeElement,focusKey=focus?.getAttribute?.('data-dossier-tab');
   const body=tab==='bio'?options.biography(current):tab==='talk'?questionHTML():tab==='letters'?lettersHTML():tab==='quest'?questHTML():meetingHTML();
   open(p.name,p.role+' · 人物志',meter()+'<nav class="dossier-tabs" aria-label="人物志篇目">'+tabs.map(([id,label])=>'<button data-dossier-tab="'+id+'" aria-pressed="'+(tab===id)+'">'+label+'</button>').join('')+'</nav>'+status()+'<section class="dossier-body" aria-label="'+tabs.find(t=>t[0]===tab)[1]+'">'+body+'</section><p class="dialog-note">人物志随当前登录账号保存，可在两个网址接续。原宫中修缮议仍单独记在此网址本机；重游修缮议不重置人物志。</p>');
   if(preserve){dialog.scrollTop=top;if(focusKey)dialog.querySelector('[data-dossier-tab="'+focusKey+'"]')?.focus({preventScroll:true});}
  }
  async function load(id,{quiet=false}={}){
   if(disposed||!character(id))return;cancel();const version=epoch;controller=new AbortController();let timedOut=false;
   timeout=setTimeout(()=>{timedOut=true;controller?.abort();},12000);pending=true;signIn=false;message='正在展开云端人物志…';if(!quiet)render(true);
   try{
    const incoming=await api(id,null,controller.signal);if(disposed||version!==epoch)return;records.set(id,incoming);message='已接上当前账号的人物志。';if(current===id){question=Math.max(0,incoming.questions.findIndex(q=>(incoming.progress.answers[q.id]?.best||0)<10));reply=null;}changed();
   }catch(error){if(disposed||version!==epoch||error.name==='AbortError'&&!timedOut)return;if(error.signIn){records.clear();signIn=true;changed();}message=timedOut?'人物志回应得慢了些，请重新读取。':error.message;}
   finally{if(version===epoch){pending=false;controller=null;clearTimeout(timeout);timeout=0;if(!quiet)render(true);}}
  }
  function show(id,nextTab='bio'){
   if(disposed||!character(id))return;cancel();current=id;tab=tabs.some(t=>t[0]===nextTab)?nextTab:'bio';question=0;reply=null;meeting=null;message='';signIn=false;
   open(character(id).name,character(id).role+' · 人物志','');render();load(id);
  }
  async function mutate(body,{questionId=null}={}){
   if(disposed||pending||!current||!data())return false;const id=current;
   if(body.action==='choose'&&!canReach(id)){message='请走近本人再接下托付。';render(true);return false;}
   const j=data().journey,step=j.quest.steps[j.state.completedSteps];
   if(body.action==='collect'&&(!step||body.stepId!==step.id||!canReach(step.target))){message='请走近这一站的物件，再记下行动。';render(true);return false;}
   if(body.action==='vignette'&&(!canReach(id)||!j.vignette.available||meeting?.index!==2)){message='请在本人身旁读完这场相约。';render(true);return false;}
   cancel();const version=epoch;controller=new AbortController();let timedOut=false;timeout=setTimeout(()=>{timedOut=true;controller?.abort();},12000);pending=true;signIn=false;message='正在把这一笔记入云端…';render(true);
   try{
    let incoming;
    if(questionId){
     const response=await root.fetch('/api/relationships/'+id,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({questionId,choice:body.choice}),signal:controller.signal});let value;try{value=await response.json();}catch{throw Error('这一问尚未确认保存，请重试。');}if(!response.ok){const error=Error(value.error||'这一问尚未确认保存，请重试。');error.signIn=response.status===401;throw error;}incoming=validate(value);
    }else incoming=await api(id,body,controller.signal);
    if(disposed||version!==epoch)return false;records.set(id,incoming);message=incoming.gained?'相识 +'+incoming.gained+'，已保存。':'这一笔已保存，重复相谈不另加分。';
    if(incoming.newlyUnlocked?.length)message+=' 手札已展开：'+incoming.newlyUnlocked.join('、')+'。';
    if(questionId)reply=incoming.reply;
    if(body.action==='choose'){tracked=id;saveFollow();}
    if(body.action==='collect'){tab='quest';message=incoming.journeyReply+' '+message;}
    if(body.action==='vignette'){meeting=null;message='这一场相约已记入云端游记。';if(tracked===id){tracked=null;saveFollow();}}
    changed();root.dispatchEvent(new CustomEvent('changan-journal-changed',{detail:{palaceDossier:true}}));return true;
   }catch(error){if(disposed||version!==epoch||error.name==='AbortError'&&!timedOut)return false;if(error.signIn){records.clear();signIn=true;changed();}message=(timedOut?'云端回应得慢了些。':error.message)+' 这次保存尚未确认，可重试；重复提交不会重复加分。';return false;}
   finally{if(version===epoch){pending=false;controller=null;clearTimeout(timeout);timeout=0;render(true);}}
  }
  function objective(){
   const d=trackedData();if(!tracked||!d)return null;const j=d.journey,step=j.quest.steps[j.state.completedSteps];
   return {id:j.state.active?step.target:tracked,owner:tracked,title:d.name+' · '+j.quest.title,text:j.state.active?'第 '+(j.state.completedSteps+1)+' / 3 站 · '+step.clue:j.state.complete?'回到'+d.name+'身旁，继续对谈或赴灯下相约。':'走近'+d.name+'，当面选择这次托付。',action:j.state.active?step.actionLabel:j.state.complete?'重访 · '+d.name:'相谈 · '+d.name};
  }
  function follow(){if(!data()||pending)return;const id=current,name=data().name;if(onFollow?.()===false)return;tracked=id;saveFollow();close();changed();notice('正循灯前往'+name+'的人物支线；可在左上暂搁，接回修缮议。');}
  function interact(id){
   const goal=objective();if(!goal||goal.id!==id||!canReach(id))return false;
   const d=trackedData(),j=d.journey;cancel();current=tracked;tab='quest';meeting=null;message='';signIn=false;
   if(!j.state.active){tab=j.state.complete?(j.vignette.available?'meet':'talk'):'quest';open(character(current).name,character(current).role+' · 人物志','');render();load(current);return true;}
   const step=j.quest.steps[j.state.completedSteps];open(step.title,d.name+' · 个人托付','<span class="eyebrow">第 '+(j.state.completedSteps+1)+' / 3 站</span><p>'+esc(step.clue)+'</p><button class="primary" data-dossier-collect="'+esc(step.id)+'">'+esc(step.actionLabel)+'</button><p class="dialog-note">此处行动属于个人支线，不代替查看修缮议物证。确认后记入云端，可稍后接着走。</p>');return true;
  }
  listen(dialog,'click',event=>{
   const b=event.target.closest('button');if(!b||b.disabled||disposed)return;
   if(b.hasAttribute('data-dossier-tab')){meeting=null;tab=b.dataset.dossierTab;reply=null;render();}
   else if(b.hasAttribute('data-dossier-retry'))load(current);
   else if(b.hasAttribute('data-dossier-answer')){const q=data()?.questions[question];if(q)mutate({choice:Number(b.dataset.dossierAnswer)},{questionId:q.id});}
   else if(b.hasAttribute('data-dossier-page')){if(!pending){question=Math.max(0,Math.min(5,question+Number(b.dataset.dossierPage)));reply=null;render(true);}}
   else if(b.hasAttribute('data-dossier-branch'))mutate({action:'choose',choice:b.dataset.dossierBranch});
   else if(b.hasAttribute('data-dossier-follow'))follow();
   else if(b.hasAttribute('data-dossier-collect'))mutate({action:'collect',stepId:b.dataset.dossierCollect});
   else if(b.hasAttribute('data-dossier-scene-start')){if(data()?.journey.vignette.available&&canReach(current)){meeting={id:current,index:0};render();}}
   else if(b.hasAttribute('data-dossier-scene-next')){if(!pending&&meeting){if(meeting.index<2){meeting.index++;render();}else mutate({action:'vignette'});}}
  });
  listen(dialog,'close',()=>{cancel();current=null;meeting=null;message='';});
  function refreshAccount(){cancel();records.clear();reply=null;meeting=null;changed();if(current&&dialog.open)load(current);else if(tracked)load(tracked,{quiet:true});}
  listen(root,'changan-journal-changed',event=>{if(!event.detail?.palaceDossier)refreshAccount();});
  listen(root,'changan-cloud-disconnected',()=>{cancel();records.clear();reply=null;meeting=null;signIn=true;message='云端连接已合上。请重新连接，再展开当前账号的人物志。';changed();render(true);});
  listen(root,'focus',refreshAccount);
  listen(dialog.ownerDocument,'visibilitychange',()=>{if(!dialog.ownerDocument.hidden)refreshAccount();});
  listen(root,'pagehide',()=>{cancel();refreshNeeded=true;});
  listen(root,'pageshow',event=>{if(event.persisted||refreshNeeded){refreshNeeded=false;records.clear();changed();if(current&&dialog.open)load(current);else if(tracked)load(tracked,{quiet:true});}});
  function suspend(){cancel();current=null;meeting=null;message='';}
  function dispose(){disposed=true;suspend();records.clear();}
  if(tracked)load(tracked,{quiet:true});
  return {open:show,objective,interact,stop,suspend,dispose,snapshot:()=>({current,tab,tracked,pending,signIn,question,meeting:meeting?{...meeting}:null,score:data()?.progress.score??null,questSteps:data()?.journey.state.completedSteps??null,recordCount:records.size})};
 }
 root.ChanganPalaceDossier={create,followKey};if(typeof module!=='undefined')module.exports=root.ChanganPalaceDossier;
})(typeof window!=='undefined'?window:globalThis);
