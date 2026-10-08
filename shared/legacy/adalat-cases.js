/* Built-in cases (migrated from v6). Legal corrections applied: BSA 2023 → BSA §23; BSA s.119 → BSA §119. */
(function(){
const O=(t,g,c,why,x)=>Object.assign({t,g,c,why},x||{});
const A=t=>({t});
const ng=f=>!f.guilty;
const sentence=(id,a,b,c)=>({id,ph:5,step:'sentence',role:'judge',cond:f=>f.v&&f.v!=='acq',p:'Pronounce the sentence.',o:[a,b,c]});

const STEPS={
 filing:{en:['Filing the case','After the police investigate, the prosecutor files a "chargesheet" — a report saying which laws the accused broke.'],hi:['मुकदमा दाखिल करना','पुलिस जाँच के बाद अभियोजक "आरोप-पत्र" दाखिल करता है — इसमें बताया जाता है कि अभियुक्त ने कौन-से कानून तोड़े।']},
 charges:{en:['Framing charges','The judge checks if there is enough material to hold a trial. This is NOT a decision on guilt.'],hi:['आरोप तय करना','न्यायाधीश देखते हैं कि मुकदमा चलाने लायक सामग्री है या नहीं। यह दोषी होने का फ़ैसला नहीं है।']},
 plea:{en:['Plea','The accused says "guilty" or "not guilty". "Not guilty" means the trial begins.'],hi:['दलील','अभियुक्त "दोषी" या "निर्दोष" कहता है। "निर्दोष" कहने पर मुकदमा शुरू होता है।']},
 chief:{en:['Examination-in-chief','The side that called the witness asks first. Questions must be open — you cannot suggest the answer.'],hi:['मुख्य परीक्षा','जिस पक्ष ने गवाह बुलाया, वह पहले पूछता है। प्रश्न खुले होने चाहिए — उत्तर सुझाया नहीं जा सकता।']},
 objection:{en:['Objection','A lawyer can stop an improper question — for example a leading or insulting one.'],hi:['आपत्ति','वकील गलत प्रश्न रोक सकता है — जैसे सूचक या अपमानजनक प्रश्न।']},
 ruling:{en:['Ruling','The judge decides. "Sustained" = objection accepted. "Overruled" = objection rejected.'],hi:['निर्णय','न्यायाधीश तय करते हैं। "स्वीकार" = आपत्ति मानी गई। "अस्वीकार" = आपत्ति नहीं मानी गई।']},
 answer:{en:['Witness speaks','A witness should say only what they personally saw or know — not guesses.'],hi:['गवाह का उत्तर','गवाह को केवल वही बताना चाहिए जो उसने खुद देखा या जाना — अनुमान नहीं।']},
 cross:{en:['Cross-examination','The other side questions the witness to test their story. Leading questions ARE allowed here.'],hi:['जिरह','दूसरा पक्ष गवाह की कहानी परखने के लिए प्रश्न पूछता है। यहाँ सूचक प्रश्न पूछे जा सकते हैं।']},
 evidence:{en:['Putting evidence on record','Documents and objects shown to the court get a number — P-1, P-2 for the prosecution, D-1 for the defence.'],hi:['साक्ष्य रिकॉर्ड पर लाना','अदालत में दिखाए गए दस्तावेज़ों को नंबर मिलता है — अभियोजन के P-1, P-2, बचाव के D-1।']},
 summon:{en:['Summons & adjournment','A side can ask the court to order a document or person to be brought. This may need an adjournment — a new date.'],hi:['समन और स्थगन','कोई पक्ष अदालत से दस्तावेज़ या व्यक्ति मंगाने को कह सकता है। इसके लिए नई तारीख (स्थगन) लग सकती है।']},
 args:{en:['Final arguments','Each side sums up: which facts were proved, which exhibits prove them, and which law applies.'],hi:['अंतिम बहस','हर पक्ष सार बताता है: कौन-से तथ्य सिद्ध हुए, किन प्रदर्शों से, और कौन-सा कानून लागू होता है।']},
 verdict:{en:['Judgment','The judge decides guilty or not guilty — only on the evidence on record. Any reasonable doubt helps the accused.'],hi:['फ़ैसला','न्यायाधीश केवल रिकॉर्ड के साक्ष्य पर दोषी या निर्दोष तय करते हैं। उचित संदेह का लाभ अभियुक्त को मिलता है।']},
 sentence:{en:['Sentence','If guilty, the judge chooses a punishment within the limits the law sets.'],hi:['सज़ा','दोषी होने पर न्यायाधीश कानून की सीमा के भीतर सज़ा तय करते हैं।']}
};

const GLOSS={en:[
 ['FIR','First Information Report — the first complaint written down by the police.'],
 ['Chargesheet','The police report sent to court saying what crime was committed and by whom.'],
 ['Prosecutor','The government\'s lawyer who tries to prove the accused is guilty.'],
 ['Defence advocate','The accused person\'s lawyer.'],
 ['Exhibit','A document or object shown in court as proof, given a number like P-1 or D-1.'],
 ['Leading question','A question that suggests its own answer ("You saw him, didn\'t you?").'],
 ['Objection','A lawyer asking the judge to stop an unfair or improper question.'],
 ['Adjournment','Postponing the hearing to another date.'],
 ['Reasonable doubt','A real, sensible doubt about guilt. If it exists, the accused must be acquitted.'],
 ['Conviction / Acquittal','Found guilty / found not guilty.']],
hi:[
 ['FIR','प्रथम सूचना रिपोर्ट — पुलिस द्वारा लिखी गई पहली शिकायत।'],
 ['आरोप-पत्र','पुलिस की रिपोर्ट जो अदालत को बताती है कि अपराध क्या हुआ और किसने किया।'],
 ['अभियोजक','सरकारी वकील जो अभियुक्त को दोषी सिद्ध करने का प्रयास करता है।'],
 ['बचाव पक्ष अधिवक्ता','अभियुक्त का वकील।'],
 ['प्रदर्श','सबूत के रूप में दिखाया गया दस्तावेज़ या वस्तु, जैसे P-1 या D-1।'],
 ['सूचक प्रश्न','ऐसा प्रश्न जो खुद उत्तर सुझा दे ("आपने उसे देखा था, है ना?")।'],
 ['आपत्ति','वकील द्वारा अनुचित प्रश्न रोकने का अनुरोध।'],
 ['स्थगन','सुनवाई को अगली तारीख तक टालना।'],
 ['उचित संदेह','दोष पर वास्तविक, समझदार संदेह। ऐसा होने पर अभियुक्त बरी होता है।'],
 ['दोषसिद्धि / दोषमुक्ति','दोषी पाया जाना / निर्दोष पाया जाना।']]};

const CASES=[
/* ---------------- LEVEL 1 ---------------- */
{level:1,levelName:{en:'First day in court',hi:'अदालत में पहला दिन'},learn:{en:'How a criminal trial works, step by step',hi:'आपराधिक मुकदमा कदम-दर-कदम कैसे चलता है'},
 type:'Theft',title:'State vs. Sunny Verma',court:'Court of the Judicial Magistrate, Saket, New Delhi',caseNo:'Case No. 1207/2026',
 names:{judge:'Shri R. K. Malhotra, Magistrate',pros:'Adv. Meera Joshi, APP',def:'Adv. Kunal Sethi',accused:'Sunny Verma'},
 oneLine:'A student\'s phone vanishes in a bus-stop crowd. Two days later it turns up at a stranger\'s home.',
 story:[
  'On Sunday, 2 August 2026, around 7:15 in the evening, Kavya Iyer (24), a college student, was waiting at the Malviya Nagar bus stop in Delhi. Her new ₹42,000 phone was in the side pocket of her backpack.',
  'When the bus arrived there was a big rush. A man wearing a red cap pushed past her from behind. A minute later, Kavya noticed her phone was gone.',
  'Harish Gupta, who runs a shop next to the bus stop, says he saw a man in a red cap slip something out of a girl\'s bag and walk quickly towards the market.',
  'Kavya complained to the police from a friend\'s phone. Every phone has a unique number called an IMEI — like a fingerprint. Using it, the police traced the phone and, two days later, found it at the home of Sunny Verma (27) in Khirki Extension. A red cap was also found there.',
  'Sunny says he bought the phone for ₹5,000 from a stranger at a second-hand market and did not know it was stolen. He has no bill and cannot name the seller.',
  'The bus-stop CCTV camera shows a man in a red cap close to Kavya, but his face is partly hidden by the cap.'],
 timeline:[['2 Aug, 7:15 pm','Bus arrives; rush at the stop'],['2 Aug, 7:16 pm','Kavya finds her phone missing'],['2 Aug, 7:40 pm','FIR registered at Malviya Nagar police station'],['4 Aug, 11:00 am','Phone and red cap found at Sunny\'s home']],
 people:[['Kavya Iyer','PW1 · Complainant','Student whose phone was taken'],['SI Neha Rawat','PW2 · Investigating officer','Traced and recovered the phone'],['Harish Gupta','PW3 · Eyewitness','Shopkeeper next to the bus stop'],['Sunny Verma','Accused','Says he bought the phone second-hand']],
 exhibits:[['P-1','FIR','The first written complaint'],['P-2','Recovery memo','Police record that the phone was found at Sunny\'s home'],['P-3','Purchase bill','Kavya\'s bill showing the phone\'s IMEI number'],['P-4','Bus-stop CCTV','Man in red cap near Kavya; face partly hidden'],['P-5','Red cap','Seized from Sunny\'s home']],
 laws:[
  {sec:'BNS 303(2)',title:'Theft',plain:'Dishonestly taking someone\'s movable property (like a phone) out of their possession without their consent.',punish:'Up to 3 years in jail, or fine, or both.',here:'Did Sunny himself take the phone from Kavya\'s bag?'},
  {sec:'BNS 317(2)',title:'Keeping stolen property',plain:'Receiving or keeping something when you know — or have reason to believe — it was stolen.',punish:'Up to 3 years in jail, or fine, or both.',here:'Even if he didn\'t take it, should Sunny have suspected a ₹42,000 phone sold for ₹5,000 without a bill?'},
  {sec:'BSA §119',title:'Recent possession',plain:'If someone is found with stolen goods soon after a theft and cannot explain it, the court may presume they are the thief or knew the goods were stolen.',punish:'A rule of evidence, not a punishment.',here:'The phone was found just two days after the theft.'},
  {sec:'BSA §23',title:'Confession to police',plain:'A confession made to a police officer cannot be used as evidence against the accused.',punish:'—',here:'The prosecutor cannot rely on what Sunny told the police.'},
  {sec:'Basic rule',title:'Burden of proof',plain:'The prosecution must prove guilt beyond reasonable doubt. The accused does not have to prove innocence.',punish:'—',here:'Is there any real doubt about who took the phone?'}],
 verdicts:{full:'Guilty of theft — BNS 303(2)',part:'Guilty of keeping stolen property — BNS 317(2)',acq:'Not guilty'},
 correct:f=>f.guilty?'full':(f.idWeak?'part':'full'),
 explain:{
  full:'The phone (IMEI matched with the bill) was found with Sunny just two days after the theft, along with the red cap seen on CCTV, and he could not show a bill or name a seller. The law lets the court presume he is the thief. Theft under BNS 303(2) is proved.',
  part:'The shopkeeper admitted he saw the man only from behind, and the CCTV hides the face — so it is not certain Sunny took the phone himself. But a ₹42,000 phone for ₹5,000 with no bill: he had reason to believe it was stolen. Keeping stolen property under BNS 317(2) is proved.',
  acq:'—'},
 lesson:{title:'Being caught with stolen goods soon after a theft speaks loudly.',points:[
  'Theft = dishonestly taking someone\'s movable property without consent (BNS 303).',
  'If you are found with stolen goods soon after a theft and can\'t explain how you got them, the court may presume you are the thief.',
  'Buying something far below its price with no bill is risky — you can be guilty of keeping stolen property (BNS 317).',
  'Never ask your own witness a leading question. A confession made to the police is not evidence in court.']},
 turns:[
  {id:'a1',ph:0,step:'filing',role:'pros',free:1,k:['303','theft','consent','dishonest','phone'],p:'File the case. Which offence fits what happened to Kavya?',o:[
   O('Theft under BNS 303(2) — he took her phone without her consent.',2,'law','Taking a movable thing out of someone\'s possession dishonestly and without consent is exactly what theft means.'),
   O('Robbery — he attacked her.',0,'law','Robbery needs force or a threat. Nobody hurt or threatened Kavya, so this charge would fail.'),
   O('Cheating — he tricked her.',0,'law','Cheating needs a lie that makes someone hand over property. Kavya never handed anything over.')]},
  {id:'a2',ph:1,step:'charges',role:'judge',p:'The chargesheet is before you. Frame the charges.',o:[
   O('There is enough material for a trial. Charge framed: theft under BNS 303(2), with an alternative charge of keeping stolen property under BNS 317(2).',2,'rsn','At this stage the judge only checks if a trial is needed. The alternative charge covers Sunny\'s "I bought it" story.'),
   O('He is clearly guilty. Convict him now.',0,'rsn','No one can be convicted before a trial. Framing charges only decides whether a trial should happen.'),
   O('Discharge him — he says he bought it.',0,'rsn','The accused\'s story is tested during the trial, not simply accepted at the start.')]},
  {id:'a3',ph:1,step:'plea',role:'accused',p:'The charges are read out to you. How do you plead?',o:[
   O('Not guilty. I claim trial.',2,'law','Pleading not guilty means the prosecution must now prove its case.'),
   O('I plead guilty and ask for mercy.',2,'law','A guilty plea ends the trial — the judge moves straight to sentencing.',{f:'guilty'})]},
  {id:'a4',ph:2,step:'chief',role:'pros',cond:ng,p:'Examination-in-chief of PW1 Kavya Iyer. Ask your first question.',o:[
   O('Please tell the court what happened at the bus stop that evening.',2,'wit','An open question lets the witness tell her story in her own words — exactly what examination-in-chief needs.'),
   O('The man in the red cap — the accused sitting there — stole your phone, right?',0,'wit','This puts the answer in her mouth. Leading questions are not allowed when questioning your own witness.',{f:'lead1'}),
   O('How much did your phone cost?',1,'wit','Relevant to the value of the property, but it does not show who took it.')]},
  {id:'a4o',ph:2,step:'objection',role:'def',cond:f=>ng(f)&&f.lead1,p:'The prosecutor asked her own witness a leading question. Do you object?',o:[
   O('Objection, Your Honour — the prosecutor is leading the witness.',2,'obj','Correct. Leading your own witness is not allowed; objecting protects your client.',{f:'obj1'}),
   O('No objection.',0,'obj','You let the prosecutor put words in the witness\'s mouth.')]},
  {id:'a4r',ph:2,step:'ruling',role:'judge',cond:f=>ng(f)&&f.obj1,p:'Defence objects that the question is leading. Your ruling?',o:[
   O('Sustained. Ask the question again without suggesting the answer.',2,'rsn','The question did suggest its answer, so the objection is right.'),
   O('Overruled. The witness may answer.',0,'rsn','The question was leading, so the objection should have been accepted.')]},
  {id:'a5',ph:2,step:'answer',role:'witness',w:'PW1 Kavya Iyer',q:'a4',cond:ng,p:'As Kavya, answer the prosecutor.',o:[
   A('There was a big rush when the bus came. A man in a red cap pushed me from behind. A minute later my phone was gone from my bag.'),
   A('Yes… it must have been him.'),
   A('It cost ₹42,000. I bought it in June — here is the bill.')]},
  {id:'a6',ph:2,step:'cross',role:'def',free:1,k:['face','see','saw','crowd','push','behind'],cond:ng,p:'Cross-examine PW1 Kavya.',o:[
   O('You never actually saw the man\'s face, did you? You only felt a push in a crowd.',2,'wit','Cross-examination tests what the witness really saw. She felt a push — she did not see the theft.'),
   O('Students like you are always careless with phones, aren\'t you?',0,'wit','This insults the witness and proves nothing. Judges dislike it.'),
   O('No questions.',0,'wit','You lose your chance to test her story.')]},
  {id:'a7',ph:2,step:'answer',role:'witness',w:'PW1 Kavya Iyer',q:'a6',cond:ng,p:'As Kavya, answer the defence.',o:[
   A('No, I didn\'t see his face. I only saw the red cap when I turned around.'),
   A('That\'s not fair. My bag was closed.'),
   A('(The witness is not questioned.)')]},
  {id:'a8',ph:2,step:'evidence',role:'pros',free:1,k:['imei','p-2','p-3','bill','recover','match'],cond:ng,p:'Examine PW2 SI Neha Rawat and put the key evidence on record.',o:[
   O('Officer, look at P-2 and P-3: does the IMEI of the phone found at the accused\'s house match Kavya\'s bill?',2,'evi','The IMEI is the phone\'s fingerprint. Matching it with the bill proves this is Kavya\'s phone.'),
   O('Officer, does the accused have a criminal look?',0,'evi','Opinions about how someone looks are not evidence.'),
   O('Officer, did the accused confess to you?',0,'evi','A confession made to a police officer cannot be used as evidence against the accused.')]},
  {id:'a9',ph:2,step:'answer',role:'witness',w:'PW2 SI Neha Rawat',q:'a8',cond:ng,p:'As the officer, answer.',o:[
   A('Yes. The phone recovered on 4 August has the same IMEI as Kavya\'s bill. We also seized a red cap.'),
   A('I can\'t comment on that.'),
   A('He said he bought it. In any case, a statement to the police is not evidence.')]},
  {id:'a10',ph:2,step:'chief',role:'pros',cond:ng,p:'Examination-in-chief of PW3 Harish Gupta, the shopkeeper.',o:[
   O('What did you see near the bus stop at about 7:15 pm on 2 August?',2,'wit','Open question — the witness tells the court what he saw.'),
   O('You saw the accused steal the phone, didn\'t you?',0,'wit','Leading again. You cannot suggest the answer to your own witness.',{f:'lead2'}),
   O('How long has your shop been there?',1,'wit','Shows he knows the spot well, but doesn\'t prove the theft.')]},
  {id:'a10o',ph:2,step:'objection',role:'def',cond:f=>ng(f)&&f.lead2,p:'Another leading question from the prosecutor. Object?',o:[
   O('Objection — leading question.',2,'obj','Right again — the question suggested the answer.',{f:'obj2'}),
   O('No objection.',0,'obj','The witness was allowed to simply say "yes".')]},
  {id:'a10r',ph:2,step:'ruling',role:'judge',cond:f=>ng(f)&&f.obj2,p:'Defence objects: leading question. Your ruling?',o:[
   O('Sustained. Please rephrase.',2,'rsn','Correct — the question was leading.'),
   O('Overruled.',0,'rsn','The question was leading; the objection was valid.')]},
  {id:'a11',ph:2,step:'answer',role:'witness',w:'PW3 Harish Gupta',q:'a10',cond:ng,p:'As Harish, answer.',o:[
   A('I saw a man in a red cap take something out of a girl\'s bag and walk fast towards the market.'),
   A('Yes, sir.'),
   A('Fifteen years. I know that bus stop very well.')]},
  {id:'a12',ph:2,step:'cross',role:'def',free:1,k:['behind','face','crowd','evening','dark','swear'],cond:ng,p:'Cross-examine PW3 Harish.',o:[
   O('It was evening, there was a crowd, and you saw him only from behind — can you swear it was this man?',2,'wit','This shows the identification is weak. It creates doubt about who actually took the phone.',{f:'idWeak'}),
   O('Are the police paying you?',0,'wit','An accusation with no basis hurts your own credibility.'),
   O('What colour was the girl\'s bag?',1,'wit','Testing details can help, but it misses the key point — identification.')]},
  {id:'a13',ph:2,step:'answer',role:'witness',w:'PW3 Harish Gupta',q:'a12',cond:ng,p:'As Harish, answer.',o:[
   A('From behind… I saw the red cap and his build. I cannot swear about the face.'),
   A('No sir! I am an honest shopkeeper.'),
   A('Blue, I think.')]},
  {id:'a14',ph:3,step:'summon',role:'def',cond:ng,p:'Your client says he bought the phone from a stranger for ₹5,000, with no bill. What do you do?',o:[
   O('Accept the phone was found with him, but argue the prosecution hasn\'t proved he was the man at the bus stop.',2,'evi','Smart: separate "having the phone" from "taking it". At most, it may be keeping stolen property.'),
   O('Ask for an adjournment to find the seller — no name, no address.',0,'evi','Adjournments need a real reason. A seller with no name or address cannot be summoned.',{f:'adjBad'}),
   O('Just say he is innocent.',1,'evi','His word counts, but without any supporting point it is weak.')]},
  {id:'a14r',ph:3,step:'ruling',role:'judge',cond:f=>ng(f)&&f.adjBad,p:'Defence wants time to find an unnamed seller. Your ruling?',o:[
   O('Refused. No details of the seller are given; the trial will continue.',2,'rsn','Courts adjourn only for genuine reasons. There is nobody to summon.'),
   O('Granted. Take four weeks.',0,'rsn','Delaying without a real reason wastes court time and hurts the victim.')]},
  {id:'a15',ph:4,step:'args',role:'pros',free:1,k:['imei','p-2','p-3','p-4','p-5','303','119','cap','bill','two days','recent'],cond:ng,p:'Final arguments for the prosecution.',o:[
   O('Kavya\'s phone (IMEI match, P-2 and P-3) was found with the accused two days later, with the red cap seen on CCTV (P-4, P-5). He has no bill. The law lets the court presume he is the thief (BSA s.119). Convict under BNS 303(2).',2,'law','Uses each exhibit and the correct legal presumption.'),
   O('He looks like a thief.',0,'law','Arguments must rest on evidence, not appearance.'),
   O('The phone was expensive, so punish him strictly.',0,'law','The value matters for the sentence, not for proving guilt.')]},
  {id:'a16',ph:4,step:'args',role:'def',free:1,k:['face','p-4','cctv','317','behind','doubt','bought','identif'],cond:ng,p:'Final arguments for the defence.',o:[
   O('Nobody saw my client\'s face. The CCTV is unclear (P-4) and the shopkeeper saw only a back. At most, this is keeping stolen property under BNS 317 — not theft.',2,'law','Honest and sharp: attacks the weak link (identification) and offers the right lesser offence.'),
   O('My client is poor; please be kind.',0,'law','Sympathy matters for the sentence, not for deciding guilt.'),
   O('The police planted the phone.',0,'law','A serious claim with no evidence behind it.')]},
  {id:'a17',ph:5,step:'verdict',role:'judge',p:'Deliver your judgment, based only on the evidence on record.',o:[
   {t:'Guilty of theft under BNS 303(2).',v:'full'},
   {t:'Theft not proved, but guilty of keeping stolen property under BNS 317(2).',v:'part'},
   {t:'Not guilty of any offence.',v:'acq'}]},
  sentence('a18',
   O('Simple imprisonment of 6 months and a fine of ₹10,000. The phone is returned to Kavya.',2,'rsn','Within the legal limit (up to 3 years), fair for a first offence, and the property goes back to its owner.'),
   O('Five years in jail.',0,'rsn','That is more than the law allows for this offence — the maximum is 3 years.'),
   O('A warning only; the phone stays with the court.',1,'rsn','Leniency is possible for a first offender, but the phone must be returned to its owner.'))]},

/* ---------------- LEVEL 2 ---------------- */
{level:2,levelName:{en:'Evidence matters',hi:'साक्ष्य ही सब कुछ'},learn:{en:'How exhibits, objections and adjournments change the result',hi:'प्रदर्श, आपत्तियाँ और स्थगन नतीजा कैसे बदलते हैं'},
 type:'Road accident',title:'State of Maharashtra vs. Rohan Mehra',court:'Court of the Judicial Magistrate First Class, Pune',caseNo:'RCC No. 418/2026',
 names:{judge:'Smt. A. R. Deshpande, JMFC',pros:'Adv. Vikram Rao, APP',def:'Adv. Priya Nair',accused:'Rohan Mehra'},
 oneLine:'A late-night crash at a junction kills a schoolteacher. Was the SUV driver rash — or was the signal to blame?',
 story:[
  'On Friday, 14 March 2026, at about 11:40 pm, Rohan Mehra (29), a businessman, was driving his white SUV home along FC Road, Pune, after a friend\'s birthday dinner.',
  'At the Goodluck Chowk junction his SUV hit a motorcycle crossing the road. Riding it were Anil Kulkarni (34), a schoolteacher, and his wife Sunita (31), sitting behind him.',
  'Anil was thrown against the road divider and died on the way to Sassoon Hospital from a head injury. Sunita\'s arm was broken. Anil wore a helmet; Sunita did not.',
  'Police found skid marks 14 metres long. Longer skid marks usually mean a vehicle was going faster. The speed limit at this junction is 40 km/h.',
  'Rohan admits he had one drink at dinner. His blood test was done only at 2:45 am — three hours later — and showed 0.02% alcohol. The legal limit is 0.03%.',
  'The junction\'s CCTV shows the SUV entering at 11:41:07 pm, but 4 seconds are missing exactly at the moment of the crash.',
  'Shopkeepers say the traffic signal had been faulty all day, only blinking yellow. A blinking yellow light means "slow down and cross carefully". The city corporation (PMC) keeps a repair log for every signal.'],
 timeline:[['14 Mar, 11:40 pm','Collision at Goodluck Chowk'],['14 Mar, 11:58 pm','Anil declared dead at Sassoon Hospital'],['15 Mar, 12:30 am','Police measure 14 m skid marks'],['15 Mar, 2:45 am','Rohan\'s blood sample taken: 0.02%']],
 people:[['Sunita Kulkarni','PW1 · Injured rider','Wife of the deceased'],['HC Ganesh Pawar','PW2 · Investigating officer','Prepared the spot report'],['Rohan Mehra','Accused','Driver of the SUV']],
 exhibits:[['P-1','FIR','The first written complaint'],['P-2','Spot report (panchnama)','14 m skid marks measured at the scene'],['P-3','Post-mortem report','Anil died of a head injury'],['P-4','Junction CCTV','SUV enters at 11:41:07; 4 seconds missing at the crash'],['P-5','Blood alcohol report','0.02%, taken 3 hours later'],['D-1','PMC signal repair log','Shows whether the signal was faulty — must be summoned',1]],
 laws:[
  {sec:'BNS 106(1)',title:'Causing death by negligence',plain:'Causing someone\'s death by a rash or careless act, without meaning to kill.',punish:'Up to 5 years in jail and fine.',here:'Was Rohan\'s rash driving the cause of Anil\'s death?'},
  {sec:'BNS 281',title:'Rash driving',plain:'Driving on a public road so rashly or carelessly that it puts people\'s lives in danger.',punish:'Up to 6 months, or fine up to ₹1,000, or both.',here:'Was he driving too fast for a junction at night?'},
  {sec:'BNS 125(b)',title:'Endangering life — serious injury',plain:'A rash act that puts life in danger and causes serious ("grievous") injury, like a broken bone.',punish:'Up to 3 years, or fine up to ₹10,000, or both.',here:'Sunita\'s broken arm.'},
  {sec:'MV Act s.185',title:'Drunk driving',plain:'Driving with more than 30 mg of alcohol per 100 ml of blood (0.03%).',punish:'Jail up to 6 months and/or fine up to ₹10,000 for a first offence.',here:'Rohan\'s test showed 0.02% — below the limit.'},
  {sec:'Basic rule',title:'Only evidence on record counts',plain:'The judge can decide only on what has been properly brought before the court.',punish:'—',here:'The signal log (D-1) counts only if the defence summons it.'}],
 verdicts:{full:'Guilty — BNS 106(1), 281 & 125(b)',part:'Guilty — BNS 281 & 125(b) only',acq:'Not guilty'},
 correct:f=>f.guilty?'full':(f.d1?'part':'full'),
 explain:{
  full:'On the record there is no proof the signal was faulty. 14 m skid marks show high speed in a 40 km/h zone at night, and the CCTV places the SUV in the junction at the crash time. Rash driving that caused Anil\'s death is proved.',
  part:'D-1 proves the signal was only blinking yellow, and the CCTV misses the crash moment — so it is doubtful that Rohan\'s rashness alone caused Anil\'s death. But speeding through a blinking junction at night still endangered life and broke Sunita\'s arm: BNS 281 and 125(b) are proved.',
  acq:'—'},
 lesson:{title:'Courts decide only on evidence that is on the record.',points:[
  'Causing death by rash or careless driving is BNS 106(1) — up to 5 years in jail.',
  'Skid marks, CCTV and medical reports are evidence; what someone believes is not enough on its own.',
  'Drinking and driving is an offence only above 0.03% blood alcohol — don\'t claim "drunk" without proof.',
  'If useful evidence (like the signal log) isn\'t brought to court in time, the judge cannot use it.']},
 turns:[
  {id:'b1',ph:0,step:'filing',role:'pros',free:1,k:['106','281','125','rash','negligen','death'],p:'File the chargesheet. Which offences do you charge?',o:[
   O('BNS 106(1) for causing death by negligence, BNS 281 for rash driving, and BNS 125(b) for Sunita\'s serious injury.',2,'law','Covers the death, the dangerous driving and the injury — each with the right section.'),
   O('Murder under BNS 103 — he killed Anil.',0,'law','Murder needs an intention to kill. Nobody suggests Rohan wanted to kill anyone.'),
   O('Only drunk driving under MV Act 185.',0,'law','His alcohol level (0.02%) was below the legal limit, and this ignores the death completely.')]},
  {id:'b2',ph:1,step:'charges',role:'judge',p:'The chargesheet is before you. Frame the charges.',o:[
   O('There is enough material. Charges framed under BNS 106(1), 281 and 125(b); read out to the accused.',2,'rsn','The judge only checks if a trial is justified — and here it is.'),
   O('Frame a murder charge as well.',0,'rsn','There is no material at all suggesting an intention to kill.'),
   O('Discharge him — the signal may have been faulty.',0,'rsn','That is a defence to be tested at trial, not a reason to stop the case.')]},
  {id:'b3',ph:1,step:'plea',role:'accused',p:'The charges are read out. How do you plead?',o:[
   O('Not guilty. I claim trial.',2,'law','The prosecution must now prove everything.'),
   O('I plead guilty.',2,'law','The trial ends and the judge moves to sentence.',{f:'guilty'})]},
  {id:'b4',ph:2,step:'chief',role:'pros',cond:ng,p:'Examination-in-chief of PW1 Sunita Kulkarni.',o:[
   O('Tell the court, in your own words, what happened at the junction that night.',2,'wit','Open question — the witness tells her story.'),
   O('The SUV was speeding and jumped the red light — isn\'t that right?',0,'wit','Leading your own witness. Also, the signal may not even have been red.',{f:'lead1'}),
   O('Where were you and your husband going that night?',1,'wit','Fine background, but it doesn\'t prove rash driving.')]},
  {id:'b4o',ph:2,step:'objection',role:'def',cond:f=>ng(f)&&f.lead1,p:'The prosecutor asked a leading question. Object?',o:[
   O('Objection, Your Honour — leading question in examination-in-chief.',2,'obj','Correct and important: it stops the witness from simply agreeing.',{f:'obj1'}),
   O('No objection.',0,'obj','You let damaging words go on record.')]},
  {id:'b4r',ph:2,step:'ruling',role:'judge',cond:f=>ng(f)&&f.obj1,p:'Defence objects to a leading question. Your ruling?',o:[
   O('Sustained. The question is struck off; please rephrase.',2,'rsn','It was a leading question.'),
   O('Overruled.',0,'rsn','The objection was valid.')]},
  {id:'b5',ph:2,step:'answer',role:'witness',w:'PW1 Sunita Kulkarni',q:'b4',cond:ng,p:'As Sunita, answer the prosecutor.',o:[
   A('We were crossing slowly. A white SUV came very fast from the left, no horn, and hit us. My husband fell against the divider.'),
   A('Yes… it was very fast. I think their light was red.'),
   A('We were coming home from my sister\'s house in Kothrud.')]},
  {id:'b6',ph:2,step:'cross',role:'def',free:1,k:['helmet','signal','amber','yellow','blink','speedometer'],cond:ng,p:'Cross-examine PW1 Sunita.',o:[
   O('You weren\'t wearing a helmet, and the signal was only blinking yellow that night — correct?',2,'wit','Tests her account and brings out the faulty-signal point.'),
   O('Isn\'t it true your husband was drunk and had a criminal record?',0,'wit','An insulting question with no basis — expect an objection.',{f:'ins1'}),
   O('You never saw the SUV\'s speedometer, did you?',1,'wit','Fair point — she can\'t know the exact speed.')]},
  {id:'b6o',ph:2,step:'objection',role:'pros',cond:f=>ng(f)&&f.ins1,p:'Defence attacked the dead man\'s character with no basis. Object?',o:[
   O('Objection — the question is irrelevant and only meant to insult the deceased.',2,'obj','Courts must protect witnesses from insulting questions.',{f:'obj2'}),
   O('No objection.',0,'obj','You let the witness be insulted for no reason.')]},
  {id:'b6r',ph:2,step:'ruling',role:'judge',cond:f=>ng(f)&&f.obj2,p:'Prosecution objects to an insulting question. Your ruling?',o:[
   O('Sustained. The question is not allowed.',2,'rsn','Irrelevant and insulting questions are disallowed.'),
   O('Overruled.',0,'rsn','The question had no basis and should have been stopped.')]},
  {id:'b7',ph:2,step:'answer',role:'witness',w:'PW1 Sunita Kulkarni',q:'b6',cond:ng,p:'As Sunita, answer the defence.',o:[
   A('My helmet was under the seat… I don\'t remember the signal properly.'),
   A('No! He never drank. He was a schoolteacher.'),
   A('No, but I heard the engine roaring. It was very fast.')]},
  {id:'b8',ph:2,step:'evidence',role:'pros',free:1,k:['p-2','p-4','skid','cctv','14','panchnama'],cond:ng,p:'Examine PW2 HC Ganesh Pawar and put your evidence on record.',o:[
   O('Officer, explain P-2 — the skid marks — and identify P-4, the CCTV clip.',2,'evi','Skid marks and CCTV are hard, objective evidence of speed and timing.'),
   O('Officer, P-5 proves the accused was drunk — confirm it.',0,'evi','P-5 shows 0.02%, below the legal limit. Overstating evidence damages your case.'),
   O('In your opinion, officer, is the accused guilty?',0,'evi','Whether he is guilty is for the judge to decide, not the police.')]},
  {id:'b9',ph:2,step:'answer',role:'witness',w:'PW2 HC Ganesh Pawar',q:'b8',cond:ng,p:'As the officer, answer.',o:[
   A('Skid marks of 14 metres were measured at 12:30 am. The CCTV shows the SUV entering the junction at 11:41:07 pm.'),
   A('Sir, the report shows 0.02%. That is below the legal limit.'),
   A('Sir, that is for the court to decide.')]},
  {id:'b10',ph:2,step:'cross',role:'def',free:1,k:['p-5','0.02','three hours','p-4','gap','4 second','custody'],cond:ng,p:'Cross-examine PW2.',o:[
   O('The blood test was taken three hours late and still shows only 0.02%, below the limit. And the CCTV is missing 4 seconds at the crash. Correct?',2,'evi','Two strong doubts in one question: no proof of drunkenness, and no footage of the actual crash.'),
   O('Officer, you have falsely trapped my client.',0,'evi','A wild accusation with nothing to support it.'),
   O('How many years have you been in the police?',1,'evi','Harmless, but it gains nothing.')]},
  {id:'b11',ph:2,step:'answer',role:'witness',w:'PW2 HC Ganesh Pawar',q:'b10',cond:ng,p:'As the officer, answer.',o:[
   A('Yes, the sample was taken at 2:45 am, 0.02%. The 4 seconds are missing in the copy we got from the PMC control room.'),
   A('No sir, the investigation was fair.'),
   A('Eighteen years, sir.')]},
  {id:'b12',ph:3,step:'summon',role:'def',cond:ng,p:'The PMC signal repair log (D-1) is not on record. What do you do?',o:[
   O('Ask for an adjournment to summon D-1, the signal repair log, from PMC.',2,'evi','This is a specific public record that can prove the signal was faulty — a genuine reason to adjourn.',{f:'adjReq'}),
   O('Carry on without it.',0,'evi','Without D-1 the court cannot consider the faulty-signal argument at all.')]},
  {id:'b12r',ph:3,step:'ruling',role:'judge',cond:f=>ng(f)&&f.adjReq,p:'Defence asks for time to summon a specific public record (D-1). Your ruling?',o:[
   O('Granted. Summons to PMC for D-1. The case is adjourned.',2,'rsn','A relevant, specific document — a fair trial needs it.',{f:'d1',adj:1}),
   O('Refused. The trial will proceed.',0,'rsn','Refusing relevant evidence can make the trial unfair.')]},
  {id:'b13',ph:4,step:'args',role:'pros',free:1,k:['p-2','p-4','skid','14','40','106','281','125','speed','slow'],cond:ng,p:'Final arguments for the prosecution.',o:[
   O('14 m skid marks (P-2) and the CCTV timing (P-4) prove speed far above 40 km/h. Even at a blinking signal a driver must slow down. Convict under BNS 106(1), 281 and 125(b).',2,'law','Ties the evidence to every section charged.'),
   O('The accused is rich and arrogant. Make an example of him.',0,'law','Personal attacks are not arguments.'),
   O('A man has died. That alone proves guilt.',0,'law','A death alone does not prove the driver was rash.')]},
  {id:'b14',ph:4,step:'args',role:'def',free:1,k:['d-1','signal','p-5','0.02','p-4','gap','helmet','doubt'],cond:ng,p:'Final arguments for the defence.',o:[
   O('The signal was faulty (D-1), alcohol was below the limit (P-5), the CCTV misses the crash (P-4), and the pillion wore no helmet. Causing death by rashness is not proved beyond reasonable doubt.',2,'law','Collects every doubt. Note: the signal point only counts if D-1 is on record.',{needD1:1}),
   O('My client is a respected businessman.',0,'law','Reputation is not evidence.'),
   O('The dead man was drunk.',0,'law','There is no evidence of that at all.')]},
  {id:'b15',ph:5,step:'verdict',role:'judge',p:'Deliver your judgment, based only on the evidence on record.',o:[
   {t:'Guilty under BNS 106(1), 281 and 125(b).',v:'full'},
   {t:'Guilty under BNS 281 and 125(b) only; benefit of doubt on causing death.',v:'part'},
   {t:'Not guilty on all charges.',v:'acq'}]},
  sentence('b16',
   O('Simple imprisonment within the legal limit and a fine, plus compensation to Sunita and Anil\'s family.',2,'rsn','Proportionate, and the court also thinks of the victims.'),
   O('The maximum punishment on every charge, one after another.',0,'rsn','Maximum sentences are for the worst cases. This was not deliberate.'),
   O('Only a warning.',0,'rsn','Someone was killed or seriously hurt; a warning is far too light.'))]},

/* ---------------- LEVEL 3 ---------------- */
{level:3,levelName:{en:'Beyond reasonable doubt',hi:'उचित संदेह से परे'},learn:{en:'Why suspicion is not proof — and how cyber fraud works',hi:'संदेह सबूत क्यों नहीं — और साइबर धोखाधड़ी कैसे होती है'},
 type:'Cyber fraud',title:'State vs. Vivek Rao',court:'Court of the Additional Chief Judicial Magistrate, Bengaluru',caseNo:'C.C. No. 2291/2026',
 names:{judge:'Shri M. S. Hegde, ACJM',pros:'Adv. Kavitha Rao, APP',def:'Adv. Farhan Siddiqui',accused:'Vivek Rao'},
 oneLine:'A retired teacher loses her savings to a fake "bank" call. The money lands in a young delivery worker\'s account.',
 story:[
  'On 10 June 2026, Lakshmi Prasad (61), a retired teacher in Bengaluru, got a phone call from a man who said he was from her bank. He told her that her account would be blocked unless she "verified" it immediately.',
  'He sent her a link by SMS. She opened it and read out the OTP (one-time password) that came to her phone. Within ten minutes, ₹2,40,000 — her pension savings — was gone.',
  'The money went into a bank account in the name of Vivek Rao (22), a food-delivery worker in Mysuru. That same night it was withdrawn from ATMs in Kolkata.',
  'Vivek says that in April he sold his "account kit" — passbook, ATM card and SIM — to a man who promised him ₹3,000 a month for "using his account for business". He says he never made any calls.',
  'On 10 June he says he was delivering food in Mysuru all evening. The delivery company keeps location records of every rider.',
  'The call to Lakshmi came from a SIM registered at a fake address. Police have no recording of the caller\'s voice. The person at the Kolkata ATMs wore a mask.',
  'Vivek was arrested because the money landed in his account.'],
 timeline:[['April 2026','Vivek hands his account kit to a stranger'],['10 Jun, 4:02 pm','Fake "bank" call to Lakshmi'],['10 Jun, 4:12 pm','₹2,40,000 credited to Vivek\'s account'],['10 Jun, 9–11 pm','Cash withdrawn at Kolkata ATMs'],['10 Jun, 4:30 pm','Lakshmi reports on helpline 1930']],
 people:[['Lakshmi Prasad','PW1 · Complainant','Retired teacher who lost ₹2.4 lakh'],['Insp. Kiran Shetty','PW2 · Cyber police','Investigating officer'],['Vivek Rao','Accused','Delivery worker whose account received the money']],
 exhibits:[['P-1','Cyber complaint','Complaint on helpline 1930'],['P-2','Bank statement','₹2,40,000 credited to Vivek\'s account at 4:12 pm'],['P-3','Call records','Caller\'s SIM registered at a fake address'],['P-4','ATM CCTV, Kolkata','Masked man withdrawing cash'],['D-1','Delivery-app location log','Where Vivek was that evening — must be summoned',1]],
 laws:[
  {sec:'BNS 318(4)',title:'Cheating',plain:'Tricking someone with a lie so that they hand over money or property.',punish:'Up to 7 years in jail and fine.',here:'Did Vivek himself trick Lakshmi, or knowingly take part?'},
  {sec:'IT Act s.66D',title:'Cheating by pretending, using a phone or computer',plain:'Cheating someone by pretending to be another person (like a bank officer) using a phone, computer or the internet.',punish:'Up to 3 years in jail and fine up to ₹1 lakh.',here:'Was Vivek the "bank officer" on the call?'},
  {sec:'IT Act s.66C',title:'Identity theft',plain:'Dishonestly using someone else\'s password, OTP or digital signature.',punish:'Up to 3 years in jail and fine up to ₹1 lakh.',here:'Who used Lakshmi\'s OTP?'},
  {sec:'Basic rule',title:'Beyond reasonable doubt',plain:'Strong suspicion is not enough. The prosecution must prove the accused did it, leaving no reasonable doubt.',punish:'—',here:'Money in his account is suspicious — but is it proof he made the call?'}],
 verdicts:{full:'Guilty — BNS 318(4) & IT Act 66D',part:'Guilty — IT Act 66C only',acq:'Not guilty — benefit of doubt'},
 correct:f=>f.guilty?'full':'acq',
 explain:{
  full:'The accused pleaded guilty, so the court proceeds on his admission.',
  part:'—',
  acq:'To convict for cheating, the court must be sure Vivek himself tricked Lakshmi, or knowingly joined the plan. There is no voice proof, the calling SIM isn\'t his, and the ATM man\'s face is hidden (and if D-1 is on record, it puts him in Mysuru). Money in his account raises suspicion — but suspicion is not proof. The benefit of doubt goes to the accused.'},
 lesson:{title:'Suspicion, however strong, is not proof.',points:[
  'Cheating (BNS 318) means tricking someone into handing over money. IT Act 66D covers doing it by phone or internet while pretending to be someone else.',
  'The prosecution must prove the accused did it, beyond reasonable doubt. Gaps in the evidence help the accused.',
  'Never sell or rent out your bank account, ATM card or SIM. Fraudsters use these "mule accounts" — and you can land in a criminal case.',
  'Never share an OTP — banks never ask for it. Report cyber fraud fast on 1930 or cybercrime.gov.in.']},
 turns:[
  {id:'c1',ph:0,step:'filing',role:'pros',free:1,k:['318','66d','cheat','pretend','personat'],p:'File the chargesheet. Which offences fit this fraud?',o:[
   O('Cheating under BNS 318(4), and cheating by pretending to be a bank officer over the phone under IT Act 66D.',2,'law','Lakshmi was tricked by a lie into giving the OTP — that is cheating, done by impersonation over the phone.'),
   O('Theft under BNS 303 — he took her money.',0,'law','She was tricked into sharing the OTP — that is cheating, not theft.'),
   O('Extortion — he threatened her.',0,'law','Extortion needs a threat of harm. A false warning about a "blocked account" is a trick.')]},
  {id:'c2',ph:1,step:'charges',role:'judge',p:'The chargesheet is before you. Frame the charges.',o:[
   O('There is enough material for a trial. Charges framed under BNS 318(4) and IT Act 66D.',2,'rsn','The money trail justifies a trial. Guilt is decided later.'),
   O('The money is in his account. Convict him now.',0,'rsn','No conviction is possible without a trial.'),
   O('Discharge him — he says he sold his account.',0,'rsn','His explanation must be tested at trial.')]},
  {id:'c3',ph:1,step:'plea',role:'accused',p:'The charges are read out. How do you plead?',o:[
   O('Not guilty. I never called anyone.',2,'law','The prosecution must now prove its case.'),
   O('I plead guilty.',2,'law','The trial ends and the judge moves to sentence.',{f:'guilty'})]},
  {id:'c4',ph:2,step:'chief',role:'pros',cond:ng,p:'Examination-in-chief of PW1 Lakshmi Prasad.',o:[
   O('Please tell the court about the call you received on 10 June.',2,'wit','An open question — she tells the story herself.'),
   O('The accused called you pretending to be from the bank, didn\'t he?',0,'wit','Leading — and she has never even heard the accused\'s voice.',{f:'lead1'}),
   O('How much money did you lose?',1,'wit','Relevant to the loss, but not to who did it.')]},
  {id:'c4o',ph:2,step:'objection',role:'def',cond:f=>ng(f)&&f.lead1,p:'The prosecutor is leading her own witness. Object?',o:[
   O('Objection, Your Honour — leading question.',2,'obj','Correct. It would have put your client\'s name in her mouth.',{f:'obj1'}),
   O('No objection.',0,'obj','A very damaging "yes" goes on record.')]},
  {id:'c4r',ph:2,step:'ruling',role:'judge',cond:f=>ng(f)&&f.obj1,p:'Defence objects to a leading question. Your ruling?',o:[
   O('Sustained. Please rephrase.',2,'rsn','It was a leading question.'),
   O('Overruled.',0,'rsn','The objection was valid.')]},
  {id:'c5',ph:2,step:'answer',role:'witness',w:'PW1 Lakshmi Prasad',q:'c4',cond:ng,p:'As Lakshmi, answer.',o:[
   A('A man said he was from my bank and my account would be blocked. He knew my name. I shared the OTP. In ten minutes ₹2,40,000 was gone.'),
   A('Yes… it must have been him.'),
   A('₹2,40,000 — all my pension savings.')]},
  {id:'c6',ph:2,step:'cross',role:'def',free:1,k:['voice','never','seen','met','heard'],cond:ng,p:'Cross-examine PW1 Lakshmi.',o:[
   O('You have never seen or heard my client. Can you say the voice on the phone was his?',2,'wit','Gets the key admission: the victim cannot identify the caller.'),
   O('Only a foolish person shares an OTP, isn\'t it?',0,'wit','Blaming the victim proves nothing and insults her.',{f:'ins1'}),
   O('No questions.',0,'wit','You miss the most important point in the defence case.')]},
  {id:'c6o',ph:2,step:'objection',role:'pros',cond:f=>ng(f)&&f.ins1,p:'Defence is insulting the victim. Object?',o:[
   O('Objection — the question is insulting and irrelevant.',2,'obj','Witnesses must be protected from insulting questions.',{f:'obj2'}),
   O('No objection.',0,'obj','You let your own witness be insulted.')]},
  {id:'c6r',ph:2,step:'ruling',role:'judge',cond:f=>ng(f)&&f.obj2,p:'Prosecution objects to an insulting question. Your ruling?',o:[
   O('Sustained. The question is not allowed.',2,'rsn','Insulting questions are not permitted.'),
   O('Overruled.',0,'rsn','The question only insulted the witness.')]},
  {id:'c7',ph:2,step:'answer',role:'witness',w:'PW1 Lakshmi Prasad',q:'c6',cond:ng,p:'As Lakshmi, answer the defence.',o:[
   A('No, I have never met him. I can\'t say whose voice it was.'),
   A('They knew my name and my account number! I trusted them.'),
   A('(The witness is not questioned.)')]},
  {id:'c8',ph:2,step:'evidence',role:'pros',free:1,k:['p-2','statement','credit','account','4:12'],cond:ng,p:'Examine PW2 Inspector Kiran Shetty and put evidence on record.',o:[
   O('Officer, produce P-2: the bank statement showing ₹2.4 lakh going into the accused\'s account.',2,'evi','This is your strongest real evidence — the money trail.'),
   O('Officer, the accused is part of a big gang, isn\'t he?',0,'evi','Saying "gang" without proof is only suspicion.'),
   O('Officer, play the recording of the accused\'s voice.',0,'evi','There is no voice recording. You cannot rely on evidence that doesn\'t exist.')]},
  {id:'c9',ph:2,step:'answer',role:'witness',w:'PW2 Insp. Kiran Shetty',q:'c8',cond:ng,p:'As the officer, answer.',o:[
   A('Yes. P-2 shows ₹2,40,000 credited to Vivek Rao\'s account at 4:12 pm, withdrawn in Kolkata by 11 pm.'),
   A('We suspect so, but we have no proof yet.'),
   A('Sir, we do not have any recording.')]},
  {id:'c10',ph:2,step:'cross',role:'def',free:1,k:['p-3','sim','fake','p-4','mask','kolkata'],cond:ng,p:'Cross-examine PW2.',o:[
   O('The calling SIM (P-3) is registered at a fake address, not to my client. And the ATM CCTV (P-4) shows a masked man in Kolkata, not him — correct?',2,'evi','Breaks the link between your client and both the call and the cash.'),
   O('Did you torture my client?',0,'evi','A baseless accusation weakens your credibility.'),
   O('Did you search my client\'s house?',1,'evi','Useful if nothing was found — but it\'s not the central point.')]},
  {id:'c11',ph:2,step:'answer',role:'witness',w:'PW2 Insp. Kiran Shetty',q:'c10',cond:ng,p:'As the officer, answer.',o:[
   A('Yes, the SIM is under a fake name. The ATM person\'s face is covered. We cannot say it is Vivek.'),
   A('No sir.'),
   A('We searched it. Nothing related to the fraud was found.')]},
  {id:'c12',ph:3,step:'summon',role:'def',cond:ng,p:'Your client says he was delivering food in Mysuru all evening. The delivery-app location log (D-1) isn\'t on record. What do you do?',o:[
   O('Ask for an adjournment to summon D-1, the delivery company\'s location records.',2,'evi','Independent records are far stronger than your client\'s word.',{f:'adjReq'}),
   O('Rely only on the accused\'s word.',1,'evi','His word helps, but an independent record is much stronger.')]},
  {id:'c12r',ph:3,step:'ruling',role:'judge',cond:f=>ng(f)&&f.adjReq,p:'Defence asks for time to summon the delivery-app records (D-1). Your ruling?',o:[
   O('Granted. Summons to the delivery company for D-1.',2,'rsn','A specific, relevant record — fairness requires it.',{f:'d1',adj:1}),
   O('Refused.',0,'rsn','Refusing relevant evidence can make the trial unfair.')]},
  {id:'c13',ph:4,step:'args',role:'pros',free:1,k:['p-2','account','sold','knowing','318','66d'],cond:ng,p:'Final arguments for the prosecution.',o:[
   O('P-2 shows the money reached his account within minutes, and he admits handing his account to a stranger for money. The court should find he knowingly took part in the fraud.',2,'law','The best argument on the record — it links him to the money. Whether it is enough is for the judge.'),
   O('Old people are cheated every day. Someone must be punished.',0,'law','Punishing "someone" is not justice. The court must find the person who did it.'),
   O('He is young and greedy.',0,'law','Character attacks are not evidence.')]},
  {id:'c14',ph:4,step:'args',role:'def',free:1,k:['voice','p-3','sim','p-4','mask','d-1','mysuru','doubt','suspicion'],cond:ng,p:'Final arguments for the defence.',o:[
   O('No one heard his voice, the SIM (P-3) isn\'t his, the ATM man (P-4) is masked, and D-1 puts him in Mysuru. Money in his account doesn\'t prove he cheated anyone. Benefit of doubt.',2,'law','Shows each gap clearly. The D-1 point only counts if it was summoned.',{needD1:1}),
   O('He is just a poor delivery boy.',0,'law','Sympathy is not a legal defence.'),
   O('The victim was careless.',0,'law','The victim\'s carelessness doesn\'t excuse fraud.')]},
  {id:'c15',ph:5,step:'verdict',role:'judge',p:'Deliver your judgment, based only on the evidence on record.',o:[
   {t:'Guilty under BNS 318(4) and IT Act 66D.',v:'full'},
   {t:'Guilty only of identity theft under IT Act 66C.',v:'part'},
   {t:'Not guilty — the prosecution has not proved he made the call or knew of the fraud.',v:'acq'}]},
  sentence('c16',
   O('Imprisonment within the legal limit and a fine, plus an order to repay Lakshmi from the frozen account.',2,'rsn','Proportionate, and it puts the victim first.'),
   O('Ten years in jail.',0,'rsn','More than the law allows for these offences.'),
   O('A warning only.',0,'rsn','Far too light for a fraud that wiped out someone\'s savings.'))]}
];
globalThis.ADALAT={CASES,STEPS,GLOSS};
})();

export default globalThis.ADALAT;
