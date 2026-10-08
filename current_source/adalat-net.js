/* Adalat online multiplayer — Supabase Realtime (broadcast + presence).
   Keys: window.ADALAT_CONFIG = { supabaseUrl, supabaseKey } before this script, or enter them once in the game's lobby. */
(function(){
const DEFAULT={url:'https://pgbftpzfekttizcvhzyl.supabase.co',key:'sb_publishable_96Zgl6AFrqSFa2pFJE6B8A_So9M75Gy'};
const cfg=()=>{const c=window.ADALAT_CONFIG||{};let ls={};try{ls=JSON.parse(localStorage.getItem('adalat-supabase')||'{}');}catch(e){}return {url:c.supabaseUrl||ls.url||DEFAULT.url,key:c.supabaseKey||ls.key||DEFAULT.key};};
// a fresh id for every page load (duplicated tabs must not share an id)
const id=Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-3);
function code(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<4;i++)s+=A[Math.floor(Math.random()*A.length)];return 'ADL-'+s;}
function join({room,me,on}){const c=cfg();if(!c.url||!c.key||!window.supabase)throw new Error('NO_CONFIG');
  // one client (one socket) per join — avoids "cannot add callbacks after subscribe" when re-joining
  const cl=window.supabase.createClient(c.url,c.key,{auth:{persistSession:false,autoRefreshToken:false},realtime:{params:{eventsPerSecond:20}}});
  const key=(me&&me.id)||id;
  const ch=cl.channel('adalat-'+room,{config:{broadcast:{self:false,ack:false},presence:{key}}});
  ['state','case','tick','move','next','resume','hello','kick'].forEach(ev=>ch.on('broadcast',{event:ev},({payload})=>{try{on[ev]&&on[ev](payload||{});}catch(e){console.warn(e);}}));
  ch.on('presence',{event:'sync'},()=>{const st=ch.presenceState();on.peers&&on.peers(Object.values(st).map(a=>a&&a[a.length-1]).filter(Boolean));});
  let meta=me,live=false,closed=false;
  ch.subscribe(async status=>{if(closed)return;if(status==='SUBSCRIBED'){live=true;try{await ch.track(meta);}catch(e){}on.ready&&on.ready();}
    else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){live=false;on.error&&on.error(status);}
    else if(status==='CLOSED'){live=false;on.closed&&on.closed();}});
  return {send:(event,payload)=>{if(!live)return false;try{ch.send({type:'broadcast',event,payload});return true;}catch(e){return false;}},
    update:m=>{meta={...meta,...m};if(live){try{ch.track(meta);}catch(e){}}},
    isLive:()=>live,
    leave:()=>{closed=true;live=false;try{ch.untrack();}catch(e){}try{cl.removeChannel(ch);}catch(e){}try{cl.realtime.disconnect();}catch(e){}}};}
window.AdalatNet={id,cfg,code,join,
  configured:()=>{const c=cfg();return !!(c.url&&c.key);},
  libReady:()=>!!window.supabase,
  save:(url,key)=>{try{localStorage.setItem('adalat-supabase',JSON.stringify({url:url.trim(),key:key.trim()}));}catch(e){}}};
})();
