(function(root){
 'use strict';
 const key='changan:palace-night:v1';
 function create(content,storage,clock=()=>Date.now()){
  const ids=new Set(content.evidence.map(e=>e.id));let writable=true,readable=true;
  function ending(choices){return choices[2]==='recheck'?'dawn':choices[0]==='repair'&&choices[1]==='reuse'?'lantern':'records';}
  function normalize(value){
   const seen=Array.isArray(value?.seen)?[...new Set(value.seen.filter(id=>ids.has(id)))]:[],choices=[];
   if(value?.version===1&&value?.storyId===content.id&&Array.isArray(value.choices))for(let i=0;i<3;i++){
    const choice=content.chapters[i].choices.find(c=>c.id===value.choices[i]);if(!choice||!content.chapters[i].needs.every(id=>seen.includes(id)))break;choices.push(choice.id);
   }
   return {version:1,storyId:content.id,seen:value?.version===1&&value.storyId===content.id?seen:[],choices,updatedAt:Number.isFinite(value?.updatedAt)?value.updatedAt:0};
  }
  let current;try{current=normalize(JSON.parse(storage?.getItem(key)||'null'));}catch{readable=false;current=normalize(null);}
  function snapshot(){return {...current,seen:current.seen.slice(),choices:current.choices.slice(),chapter:current.choices.length,complete:current.choices.length===3,ending:current.choices.length===3?ending(current.choices):null,writable,readable};}
  function save(){current.updatedAt=clock();try{storage?.setItem(key,JSON.stringify(current));if(!storage)writable=false;}catch{writable=false;}return snapshot();}
  function inspect(id){if(!ids.has(id))return false;if(!current.seen.includes(id)){current.seen.push(id);save();}return true;}
  function choose(person,id){const chapter=content.chapters[current.choices.length];if(!chapter||chapter.person!==person||!chapter.needs.every(id=>current.seen.includes(id))||!chapter.choices.some(c=>c.id===id))return false;current.choices.push(id);save();return true;}
  function review(){return current.choices.map((id,i)=>({chapter:content.chapters[i].name,...content.chapters[i].choices.find(c=>c.id===id)}));}
  // Explicit replay clears this new story's run only. Original game keys are
  // never read, migrated, rewritten or removed.
  function replay(){current=normalize(null);save();return snapshot();}
  return {snapshot,inspect,choose,review,replay,key};
 }
 root.ChanganPalaceState={create,key};if(typeof module!=='undefined')module.exports=root.ChanganPalaceState;
})(typeof window!=='undefined'?window:globalThis);
