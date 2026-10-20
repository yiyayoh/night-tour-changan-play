(()=>{
 'use strict';
 const config=window.CHANGAN_PAGES;if(!config)return;
 if(['borrowed-lantern','paper-door','painted-skin','nie-xiaoqian','cricket'].includes(new URL(location.href).searchParams.get('tale-scene')))return;
 const cloudOrigin='https://changan-voxel-night-k3.y24015354.chatgpt.site',nativeFetch=window.fetch.bind(window),pending=new Map();
 let bridge=null,channel='',ready=false,sequence=0,button=null;
 const response=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 function label(){if(button){button.textContent=ready?'云端已连接':'云端手札';button.title=ready?'保持原站连接页打开，继续使用原来的云端存档':'打开原站连接页，登录并接上原来的云端存档';}}
 function post(type,extra={}){if(bridge&&!bridge.closed)bridge.postMessage({type,channel,...extra},cloudOrigin);}
 function disconnect(){const wasReady=ready;ready=false;label();for(const[id,item]of [...pending]){post('changan-cloud-cancel',{id});item.finish(response(401,{error:'云端连接页已合上，请点「云端手札」重新连接。'}));}if(wasReady)window.dispatchEvent(new Event('changan-cloud-disconnected'));}
 function connect(){
  if(bridge&&!bridge.closed){try{bridge.focus();}catch{}if(!ready)post('changan-cloud-hello');return;}
  disconnect();channel=crypto.randomUUID().replaceAll('-','');
  const hash=new URLSearchParams({origin:location.origin,channel});
  try{bridge=window.open(cloudOrigin+'/github-bridge.html#'+hash,'changan-cloud-'+channel,'popup,width=540,height=640');}catch{bridge=null;}
  if(!bridge){if(button){button.textContent='允许弹窗后连接';button.title='请允许此页打开原站连接窗口，再点一次。';}return;}
  if(button)button.textContent='等待原站登录…';
 }
 window.addEventListener('message',event=>{
  if(event.origin!==cloudOrigin||event.source!==bridge||event.data?.channel!==channel)return;
  const data=event.data;
  if(data.type==='changan-cloud-ready'){
   const newlyConnected=!ready;ready=true;label();window.dispatchEvent(new Event('changan-journal-changed'));
   if(newlyConnected)for(const[retry,signin]of [['bondRetry','bondSignIn'],['mainNightRetry','mainNightSignIn'],['cityStoryRetry','cityStorySignIn']]){const link=document.getElementById(signin),read=document.getElementById(retry);if(link&&!link.hidden&&link.closest('dialog[open]')&&read&&!read.disabled)read.click();}
   return;
  }
  if(['changan-cloud-auth','changan-cloud-unavailable','changan-cloud-disconnected'].includes(data.type)){disconnect();return;}
  if(data.type!=='changan-cloud-response')return;
  const item=pending.get(data.id);if(!item)return;const status=Number.isInteger(data.status)&&data.status>=200&&data.status<=599?data.status:502;
  if(status===401){disconnect();return;}item.finish(response(status,data.body??{error:'暂未读到云端回应。'}));
 });
 window.fetch=async(input,options={})=>{
  const url=new URL(typeof input==='string'||input instanceof URL?String(input):input.url,location.href);
  if(url.origin!==location.origin||!url.pathname.startsWith('/api/'))return nativeFetch(input,options);
  const request=input instanceof Request?input:null,signal=options.signal||request?.signal;
  if(signal?.aborted)throw new DOMException('The operation was aborted.','AbortError');
  if(!bridge||bridge.closed||!ready){disconnect();return response(401,{error:'请点「云端手札」或登录按钮，在原站接上原来的手札。'});}
  const method=String(options.method||request?.method||'GET').toUpperCase();let body=options.body??(request&&method!=='GET'?await request.clone().text():'');
  if(body===null)body='';if(typeof body!=='string'||body.length>65536||!['GET','POST'].includes(method))return response(400,{error:'这项请求暂不支持。'});
  return new Promise((resolve,reject)=>{
   const id='p'+(++sequence),abort=()=>{post('changan-cloud-cancel',{id});finish(null,new DOMException('The operation was aborted.','AbortError'));};
   const timer=setTimeout(()=>{post('changan-cloud-cancel',{id});finish(response(503,{error:'云端连接页暂时没有回应。请确认它仍开着，再重新读取进度。'}));},11000);
   function finish(value,error){if(!pending.has(id))return;pending.delete(id);clearTimeout(timer);signal?.removeEventListener('abort',abort);if(error)reject(error);else resolve(value);}
   pending.set(id,{finish});signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted){abort();return;}
   post('changan-cloud-request',{id,path:url.pathname+url.search,method,body});
  });
 };
 document.addEventListener('click',event=>{const anchor=event.target?.closest?.('a[href]');if(!anchor)return;let url;try{url=new URL(anchor.href,location.href);}catch{return;}if((url.origin===location.origin||url.origin===cloudOrigin)&&url.pathname==='/signin-with-chatgpt'){event.preventDefault();event.stopImmediatePropagation();connect();}},true);
 function mount(){const nav=document.querySelector('.header-nav, .palace-header nav');if(!nav)return;button=document.createElement('button');button.type='button';button.className='pages-cloud-connect';button.id='pagesCloudConnect';button.addEventListener('click',connect);nav.append(button);label();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 window.addEventListener('focus',()=>{if(bridge?.closed)disconnect();});window.addEventListener('pagehide',()=>{disconnect();});
 window.addEventListener('pageshow',event=>{if(event.persisted&&bridge&&!bridge.closed)post('changan-cloud-hello');});
 window.ChanganPagesCloud={connect,state:()=>({ready,windowOpen:!!bridge&&!bridge.closed,pending:pending.size})};
})();
