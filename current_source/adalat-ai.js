/* Adalat AI adapter.
   - Inside the design tool preview it uses window.claude.complete.
   - On your live website it POSTs {prompt} to an endpoint (default /api/adalat-ai) that returns {text}.
     Override with: window.ADALAT_CONFIG = { endpoint: 'https://your-site.com/api/adalat-ai' } before this script. */
(function(){
const cfg=Object.assign({endpoint:null},window.ADALAT_CONFIG||{});
const hasClaude=()=>!!(window.claude&&window.claude.complete);
if(!cfg.endpoint&&!hasClaude()&&/^https?:$/.test(location.protocol))cfg.endpoint='/api/adalat-ai';

async function complete(prompt){
  if(hasClaude())return window.claude.complete(prompt);
  if(cfg.endpoint){
    const ac=new AbortController();const tm=setTimeout(()=>ac.abort(),55000);let r;
    try{r=await fetch(cfg.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt}),signal:ac.signal});}finally{clearTimeout(tm);}
    if(!r.ok)throw new Error('AI_SERVER_'+r.status);
    const j=await r.json();return j.text||'';
  }
  throw new Error('NO_AI');
}
function repair(s){let out='',st=[],inS=false,esc=false;for(const ch of s){out+=ch;if(inS){if(esc)esc=false;else if(ch==='\\')esc=true;else if(ch==='"')inS=false;continue;}
  if(ch==='"')inS=true;else if(ch==='{'||ch==='[')st.push(ch==='{'?'}':']');else if(ch==='}'||ch===']')st.pop();}
  if(inS)out+='"';out=out.replace(/,\s*$/,'').replace(/,\s*"[^"]*"\s*:?\s*$/,'').replace(/:\s*$/,':""');while(st.length)out+=st.pop();return out;}
function parseJSON(t){t=String(t||'').replace(/```(?:json)?/gi,'');const a=t.indexOf('{');if(a<0)throw new Error('BAD_JSON');
  const clean=x=>x.replace(/[\u201C\u201D]/g,"'").replace(/,\s*([}\]])/g,'$1');
  const b=t.lastIndexOf('}');if(b>a){try{return JSON.parse(clean(t.slice(a,b+1)));}catch(e){}}
  return JSON.parse(clean(repair(t.slice(a))));}
async function json(prompt,tries){
  const ask=prompt+'\n\nReply with ONLY one compact, valid JSON object (no markdown fences, no commentary). Never use double quotes inside string values — use single quotes instead. Keep the whole reply under 2,000 characters.';
  let last;for(let i=0;i<(tries||2);i++){try{return parseJSON(await complete(ask));}catch(e){last=e;}}
  throw last||new Error('BAD_JSON');
}
const LANG=l=>l==='hi'?'simple Hindi (Devanagari script; keep section numbers like "BNS 303" in Latin letters)':'simple, plain English';
const RNAME={judge:'trial judge',pros:'public prosecutor',def:'defence advocate',accused:'accused',witness:'witness'};
const brief=c=>`CASE: ${c.title} — ${c.court}, ${c.caseNo}
STORY: ${(c.story||[]).join(' ')}
EXHIBITS: ${(c.exhibits||[]).map(x=>`${x[0]} ${x[1]} (${x[2]})`).join('; ')}
LAW: ${(c.laws||[]).map(l=>`${l.sec} ${l.title}: ${l.plain} Punishment: ${l.punish}`).join(' | ')}
PEOPLE: judge ${c.names.judge}; prosecutor ${c.names.pros}; defence ${c.names.def}; accused ${c.names.accused}; witnesses: ${(c.witnesses||[]).map(w=>`${w.id} ${w.name} (${w.role})`).join('; ')}`;
const tx=log=>(log||[]).slice(-26).map(e=>e.kind==='clerk'?`[${e.text}]`:`${e.who}: ${e.text}`).join('\n')||'(nothing yet)';
const COURT='Speak exactly as a real participant in an Indian trial court would — formal but plain ("Your Honour"), short and natural. Use only facts from the case file. Mention exhibit numbers (P-1, D-1) and section numbers where a real lawyer or judge would.';

const CITIES=['Pune','Jaipur','Kochi','Lucknow','Bhopal','Guwahati','Indore','Nagpur','Patna','Coimbatore','Chandigarh','Surat','Vadodara','Mysuru','Ranchi','Dehradun','Visakhapatnam','Madurai','Raipur','Amritsar','Shillong','Varanasi','Kolkata','Hyderabad','Bengaluru','Ahmedabad','Thiruvananthapuram','Bhubaneswar','Jodhpur','Panaji'];
const SETTINGS=['a crowded railway station','a housing society','a small family shop','a college hostel','a wedding function','a construction site','a hospital','a local market','an online marketplace','a gym','a bank branch','a school','a farm village','a factory','an auto-rickshaw ride','a festival fair','a restaurant kitchen','a delivery app job','a rented flat','a mobile repair shop'];
const TWISTS=['a CCTV clip that is unclear','a witness who is a relative of the complainant','a delay in filing the FIR','a document whose signature is disputed','a mobile phone location record','a medical report that only partly fits the story','an alibi from a friend','money traced through UPI','a confession made to police (not admissible)','an item recovered at the accused pointing it out','two witnesses who disagree on the time','a WhatsApp chat','an independent witness who turned hostile','a forensic report that came late'];
const pick=a=>a[Math.floor(Math.random()*a.length)];
async function genCase({type,level,lang,truth,onStep,avoid}){
  const seed=`UNIQUE SETUP (must use): city ${pick(CITIES)}; setting ${pick(SETTINGS)}; key evidence twist: ${pick(TWISTS)}; month ${pick(['January','February','March','April','May','June','July','August','September','October','November','December'])} 2026. Case id #${Math.random().toString(36).slice(2,8)}.`;
  const avoidTxt=(avoid&&avoid.length)?`\nThe player has ALREADY played these cases — create something completely different (different names, city, story and twist): ${avoid.map(x=>`${x.t} (${x.a}) — ${x.o||''}`).join(' | ')}`:'';const step=n=>{try{onStep&&onStep(n);}catch(e){}};step(1);
  const diff={1:'Level 1 (beginner): simple facts, clear evidence, one main offence.',2:'Level 2 (intermediate): mixed evidence; one piece of evidence or a weak identification changes the result.',3:'Level 3 (advanced): subtle; tests "beyond reasonable doubt"; strong suspicion but gaps in proof are possible.'}[level]||'';
  const LAWS=`Use India's current criminal laws: Bharatiya Nyaya Sanhita 2023 (BNS), Bharatiya Nagarik Suraksha Sanhita 2023 (BNSS), Bharatiya Sakshya Adhiniyam 2023 (BSA), and special laws where relevant (IT Act 2000, Motor Vehicles Act 1988, Dowry Prohibition Act). Only use section numbers you are confident are correct.`;
  const OUT=`Write in ${LANG(lang)}, very simple words; explain any legal term in brackets.`;
  const truthTxt={full:'guilty as charged',part:'guilty only of a lesser offence',acq:'not guilty — benefit of doubt'}[truth];
  // Part A: the story
  const a=await json(`You are an expert Indian criminal lawyer writing an original, realistic criminal trial case for a law-learning game. Players have NO legal background.
Case type: ${type}. ${diff}
${seed}${avoidTxt}
Invent fresh, uncommon Indian names (mix of regions and communities); avoid overused names like Kavya, Sunny, Rahul or Priya.
${LAWS} If the type is usually civil (property dispute, divorce/family, consumer complaint), choose a criminal angle that leads to a criminal trial (e.g. criminal trespass, cruelty, cheating by a seller).
The legally correct outcome on full evidence must be: ${truthTxt}. Build the facts (including doubtful points) so that is right.
Realistic Indian names, a real Indian city, dates in 2026. ${OUT}
Return: {"title":"State vs. NAME","court":"Court of the ..., CITY","caseNo":"... No. ####/2026","oneLine":"one-sentence hook","names":{"judge":"Shri/Smt ..., designation","pros":"Adv. ..., APP","def":"Adv. ...","accused":"NAME"},"story":["4 short paragraphs, max 45 words each"],"timeline":[["date, time","what happened"]]}
Timeline: 4 items, max 10 words each.`);
  const ctx=`CASE SO FAR: ${a.title} — ${a.court}. Accused: ${a.names&&a.names.accused}. STORY: ${(a.story||[]).join(' ')}\nCorrect outcome on full evidence: ${truthTxt}.`;
  // Part B1: evidence + law
  step(2);
  const C_PROMPT=`You are an expert Indian criminal lawyer and teacher. ${ctx}\n${LAWS} Name the BNS/special-law sections that fit this story.
${OUT}
Return: {"verdicts":{"full":"Guilty — sections","part":"Guilty — lesser section only","acq":"Not guilty"},"truth":{"v":"${truth}","reason":"3 plain sentences (max 70 words): why this is the correct result under law"},"lesson":{"title":"one-line lesson","points":["4 real-life lessons, max 20 words each"]}}`;
  const b1P=json(`You are an expert Indian criminal lawyer. ${ctx}
${LAWS} ${OUT}
Return: {"exhibits":[["P-1","short name (max 5 words)","what it shows (max 15 words)"]],"laws":[{"sec":"BNS ###","title":"max 5 words","plain":"meaning (max 20 words)","punish":"max 15 words","here":"question it raises here (max 20 words)"}]}
4–5 exhibits (P-1, P-2…), 3 laws. Respect the word limits strictly.`);
  // Part B2: witnesses
  const b2P=json(`You are an expert Indian criminal lawyer. ${ctx}
${OUT}
Return: {"witnesses":[{"id":"PW1","name":"full name","side":"pros","role":"who they are (max 8 words)","knows":"what they personally know, incl. weak points they'd admit (max 40 words)","manner":"max 8 words"}]}
Exactly 3 witnesses: PW1 and PW2 with side "pros", DW1 with side "def".`);
  const cP=json(C_PROMPT);
  const [b1,b2,c]=await Promise.all([b1P,b2P,cP]);step(3);
  const b={exhibits:b1.exhibits||[],laws:b1.laws||[],witnesses:(b2.witnesses||[]).slice(0,3).map((w,i)=>Object.assign({},w,{id:w.id||['PW1','PW2','DW1'][i],side:(/def/i.test(w.side||'')||/^DW/i.test(w.id||''))?'def':'pros'}))};
  const ws=b.witnesses||[];
  return Object.assign({},a,b,c,{truth:Object.assign({v:truth,reason:''},c.truth||{},{v:truth}),
    people:ws.map(w=>[w.name,`${w.id} · ${w.role}`,'']).concat([[a.names&&a.names.accused||'',lang==='hi'?'अभियुक्त':'Accused','']])});
}

const STEP={
  filing:()=>'As the prosecutor, file the chargesheet: state the offences with section numbers and the core reason, in 2 sentences.',
  charges:()=>'As the judge, frame the charges: say there is enough material for trial and list the sections, in 1–2 sentences.',
  chief:(w,qn)=>`Ask ${w.id} ${w.name} ONE open, non-leading question in examination-in-chief (question ${qn+1}; build on earlier answers, do not repeat).`,
  cross:(w,qn)=>`Ask ${w.id} ${w.name} ONE sharp cross-examination question that tests a weak point in their story (question ${qn+1}; leading questions are allowed).`,
  args:(w,qn,role)=>`Give final arguments for the ${role==='pros'?'prosecution':'defence'} in 3–5 sentences: the facts proved, the exhibits, and the sections.`
};
async function speak({c,role,step,w,log,lang,skill,qn}){
  const who=c.names[role]||RNAME[role];
  const sk=skill==='Easy'?'You are an average lawyer who sometimes misses the strongest point.':skill==='Fair'?'You are a competent lawyer.':'You are an excellent, sharp lawyer.';
  const t=await complete(`You are ${who}, the ${RNAME[role]}, in a realistic Indian criminal trial. ${brief(c)}
TRANSCRIPT SO FAR:
${tx(log)}
NOW: ${(STEP[step]||(()=>'Speak.'))(w,qn||0,role)}
${COURT} ${role!=='judge'?sk:''}
Write in ${LANG(lang)}. Output only the spoken words — no name label, no quotation marks.`);
  return t.trim().replace(/^["“]|["”]$/g,'');
}
async function witness({c,w,q,log,lang}){
  const t=await complete(`You are ${w.name}, ${w.role}, a witness in an Indian criminal trial. You have taken the oath to tell the truth.
What you personally know: ${w.knows||(c.story||[]).join(' ')}
Your manner: ${w.manner||'an ordinary, slightly nervous person'}.
Recent transcript:
${tx(log)}
You were just asked: "${q}"
Answer as this person would, in 1–3 short sentences, in ${LANG(lang)}. Stay truthful to what you know; if you don't know, say so; admit weak points if the question is fair. Output only your answer, no label.`);
  return t.trim().replace(/^["“]|["”]$/g,'');
}
async function assess({c,role,step,w,text,log,lang}){
  const r=await json(`You are an experienced Indian trial judge and a patient law teacher. A learner with NO legal background is playing the ${RNAME[role]} at the "${step}" stage${w?` (witness: ${w.id||''} ${w.name})`:''}.
${brief(c)}
TRANSCRIPT:
${tx(log)}
The learner said: "${text}"
Grade it like a real court would. Return:
{"g":0|1|2,"c":"law"|"evi"|"wit"|"obj"|"rsn","why":"1–2 very simple sentences explaining the grade","better":"what a skilled ${RNAME[role]} would say instead, 1–2 sentences (empty string if g is 2)","improper":null|"leading"|"insulting"|"irrelevant"}
g: 2 = strong (correct law/evidence, fair and relevant), 1 = okay, 0 = weak or wrong. c: law = sections/legal basis, evi = use of exhibits, wit = witness questioning, rsn = judicial reasoning.
"improper" is ONLY for questions put to a witness: leading is improper only in examination-in-chief (allowed in cross); insulting or irrelevant questions are improper anywhere.
Write "why" and "better" in ${LANG(lang)}.`);
  r.g=Math.max(0,Math.min(2,parseInt(r.g,10)||0));return r;
}
async function verdict({c,log,lang}){
  const r=await json(`You are ${c.names.judge}, the trial judge. ${brief(c)}
TRANSCRIPT:
${tx(log)}
On the full evidence the legally correct outcome is "${c.truth.v}" because: ${c.truth.reason}
Deliver the judgment as a real Indian judge, deciding only on the record. Options: full = "${c.verdicts.full}", part = "${c.verdicts.part}", acq = "${c.verdicts.acq}".
Return {"v":"full"|"part"|"acq","judgment":"3–4 sentence oral judgment in ${LANG(lang)} citing exhibits and sections","sentence":"if convicted, one sentence within legal limits; otherwise empty"}`);
  if(!['full','part','acq'].includes(r.v))r.v=c.truth.v;return r;
}
async function suggest({c,role,step,w,log,lang,qn}){
  const r=await json(`You coach a learner (no legal background) playing the ${RNAME[role]} in an Indian criminal trial. ${brief(c)}
TRANSCRIPT:
${tx(log)}
NOW: ${(STEP[step]||(()=>'Speak.'))(w,qn||0,role)}
Give three possible things they could say: one strong, one okay, one weak (e.g. leading in chief, irrelevant, or not linked to evidence). Shuffle the order and don't label quality. Each 1–2 sentences, in ${LANG(lang)}.
Return {"options":["...","...","..."]}`);
  return (r.options||[]).slice(0,3);
}
async function review({c,role,log,lang}){
  return complete(`You are a friendly Indian law teacher reviewing a learner's mock trial. The learner has NO legal background — use very simple words. Case: ${c.title}. Learner's role: ${RNAME[role]}. Transcript:
${tx(log)}
In ${LANG(lang)}, write 5 short sentences: one thing they did well, the most important legal idea to remember from this case, one mistake to avoid, and one real-life tip. No headings, no bullets.`);
}
window.AdalatAI={cfg,available:()=>hasClaude()||!!cfg.endpoint,complete,json,genCase,speak,witness,assess,verdict,suggest,review};

/* ---- Sound & voice ---- */
let ctx=null;
const FX={
  ttsOK:typeof window!=='undefined'&&'speechSynthesis' in window,
  micOK:!!(window.SpeechRecognition||window.webkitSpeechRecognition),
  say(text,lang){if(!this.ttsOK)return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=lang==='hi'?'hi-IN':'en-IN';
    const v=speechSynthesis.getVoices().find(v=>v.lang===u.lang)||speechSynthesis.getVoices().find(v=>v.lang.startsWith(lang==='hi'?'hi':'en'));if(v)u.voice=v;u.rate=0.95;speechSynthesis.speak(u);}catch(e){}},
  stop(){try{this.ttsOK&&speechSynthesis.cancel();}catch(e){}},
  gavel(){try{ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();[0,0.22].forEach(d=>{const o=ctx.createOscillator(),g=ctx.createGain();const t=ctx.currentTime+d;
    o.type='triangle';o.frequency.setValueAtTime(180,t);o.frequency.exponentialRampToValueAtTime(55,t+0.12);g.gain.setValueAtTime(0.5,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.16);
    o.connect(g).connect(ctx.destination);o.start(t);o.stop(t+0.18);});}catch(e){}},
  mic(lang,onText,onEnd){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return null;const r=new SR();r.lang=lang==='hi'?'hi-IN':'en-IN';r.continuous=true;r.interimResults=false;
    r.onresult=e=>{let s='';for(let i=e.resultIndex;i<e.results.length;i++)if(e.results[i].isFinal)s+=e.results[i][0].transcript;if(s)onText(s.trim());};
    r.onend=()=>onEnd&&onEnd();r.onerror=()=>onEnd&&onEnd();try{r.start();}catch(e){return null;}return ()=>{try{r.stop();}catch(e){}};}
};
window.AdalatFX=FX;
})();
