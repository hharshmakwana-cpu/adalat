// UI strings. Hindi is written for learners, not machine-translated word-for-word. Section ids stay in Latin script.
export type Lang = 'en' | 'hi';
const en = {
  courtNow: 'COURT NO. 4 · NOW IN SESSION', tagline: 'Step into the courtroom.', sub: 'No legal background required. Learn by making the decisions.',
  play: 'PLAY', friends: 'Play with friends', lab: 'Case Lab · AI', sound: 'Sound', voice: 'Voice', on: 'On', off: 'Off', back: 'Back',
  chooseCase: 'Choose a case', locked: 'Finish the previous case to unlock', level: 'Level', beginner: 'Beginner', standard: 'Standard', expert: 'Expert',
  chooseSeat: 'Choose your seat', othersAi: 'Every other seat is played by the court AI.', enterAs: 'Enter court as', spectate: 'Spectate',
  who: 'WHO YOU ARE', what: 'WHAT YOU DO', win: 'HOW YOU PERFORM WELL', learn: 'Learn',
  caseFile: 'CASE FILE', fictional: 'FICTIONAL CASE', story: 'The story', timeline: 'Timeline', people: 'People', exhibits: 'Exhibits', law: 'The law',
  objective: 'Your objective', enterCourt: 'Enter court', enNote: 'Case text is in English; the interface is in Hindi.',
  yourTurn: 'YOUR TURN', speaking: 'SPEAKING', waiting: 'is speaking…', ask: 'Submit', typeOwn: 'Or write your own', choose: 'Choose what to say',
  transcript: 'Transcript', orders: 'Orders', record: 'Court record', noRecord: 'No court record yet. Every question, answer, objection and exhibit will appear here.',
  noExhibits: 'No exhibits marked yet. Documents get numbers like P-1 when shown to the court.', marked: 'MARKED', notMarked: 'NOT YET ON RECORD',
  strong: 'Strong move', okay: 'Okay move', weak: 'Weak move', why: 'Why', better: 'Better move', tryAgain: 'Try again',
  objection: 'OBJECTION!', sustained: 'Objection sustained.', overruled: 'Objection overruled.', exhibitMarked: 'marked as an exhibit.', adjourned: 'Court adjourned.',
  refused: 'Request refused.', judgment: 'JUDGMENT PRONOUNCED', reasoned: 'How the law sees it', caseConcluded: 'CASE CONCLUDED',
  performance: 'Your performance', learned: 'What you learned', keyRule: 'Key legal rule', missed: 'What you missed', next: 'Next case', replay: 'Play again as another role', home: 'Home',
  dims: { legal: 'Legal accuracy', evidence: 'Evidence', procedure: 'Procedure', questions: 'Question quality', reasoning: 'Judicial reasoning', credibility: 'Credibility', time: 'Time' },
  simple: 'Simple', legalRule: 'Legal rule', source: 'Source', close: 'Close', timeLeft: 'seconds left',
  labTitle: 'Case Lab', labSub: 'A brand-new fictional case every time. The AI writes the facts; the law comes only from ADALAT’s checked library.',
  caseType: 'Case type', generate: 'Open a new case file', opening: 'Opening the case file…', steps: ['Drafting the story', 'Reviewing witnesses', 'Preparing exhibits', 'Checking law against the library'], cancel: 'Cancel',
  genFail: 'The case file could not be opened.', genFailSub: 'AI case generation is temporarily unavailable. Your choices are kept.', builtin: 'Play a built-in case',
  types: { theft: 'Theft', cyber: 'Cyber fraud', cheating: 'Cheating', road: 'Road accident' }, comingSoon: 'Civil, consumer and family cases need their own court procedure — coming soon.',
  mpTitle: 'Play with friends', create: 'Create a courtroom', join: 'Join with a code', yourName: 'Your name', code: 'Room code', joinBtn: 'Join', createBtn: 'Create room',
  lobby: 'Courtroom lobby', host: 'HOST', ready: 'Ready', notReady: 'Not ready', openSeat: 'Open seat · AI will play', start: 'Start trial', leave: 'Leave room', copy: 'Copy invite link', copied: 'Link copied', copyFail: 'Couldn’t copy — select the code instead',
  connected: 'CONNECTED', reconnecting: 'RECONNECTING…', lost: 'CONNECTION LOST', resuming: 'RESUMING',
  hostGone: 'The host disconnected. Game paused.', becomeHost: 'Become host', wait: 'Wait', roleTaken: 'Role unavailable', mpOff: 'Multiplayer is not set up on this site yet. The owner needs to add the Supabase settings.',
  aiReview: 'Get a teacher’s review', reviewing: 'Reviewing…', winSide: 'The verdict matches the law and the evidence.', loseSide: 'The verdict went the other way. Your skill score still counts.',
  awards: 'Awards', player: 'Player', role: 'Role', score: 'Score'
};
const hi: typeof en = {
  ...en,
  courtNow: 'अदालत संख्या 4 · कार्यवाही जारी', tagline: 'अदालत में कदम रखिए।', sub: 'कानून की कोई पढ़ाई ज़रूरी नहीं। फ़ैसले लेकर सीखिए।',
  play: 'खेलें', friends: 'दोस्तों के साथ', lab: 'केस लैब · AI', sound: 'ध्वनि', voice: 'आवाज़', on: 'चालू', off: 'बंद', back: 'वापस',
  chooseCase: 'केस चुनें', locked: 'पिछला केस पूरा करने पर खुलेगा', level: 'स्तर', beginner: 'शुरुआती', standard: 'सामान्य', expert: 'विशेषज्ञ',
  chooseSeat: 'अपनी भूमिका चुनें', othersAi: 'बाकी भूमिकाएँ अदालत का AI निभाएगा।', enterAs: 'इस भूमिका में अदालत जाएँ:', spectate: 'सिर्फ़ देखें',
  who: 'आप कौन हैं', what: 'आप क्या करते हैं', win: 'अच्छा प्रदर्शन कैसे करें', learn: 'सीखें',
  caseFile: 'केस फ़ाइल', fictional: 'काल्पनिक केस', story: 'कहानी', timeline: 'घटनाक्रम', people: 'लोग', exhibits: 'प्रदर्श', law: 'कानून',
  objective: 'आपका लक्ष्य', enterCourt: 'अदालत में जाएँ', enNote: 'केस का पाठ अंग्रेज़ी में है; बाकी इंटरफ़ेस हिंदी में।',
  yourTurn: 'आपकी बारी', speaking: 'बोल रहे हैं', waiting: 'बोल रहे हैं…', ask: 'भेजें', typeOwn: 'या खुद लिखें', choose: 'क्या कहना है, चुनें',
  transcript: 'कार्यवाही', orders: 'आदेश', record: 'अदालत का रिकॉर्ड', noRecord: 'अभी कोई रिकॉर्ड नहीं। हर प्रश्न, उत्तर, आपत्ति और प्रदर्श यहाँ दिखेगा।',
  noExhibits: 'अभी कोई प्रदर्श चिह्नित नहीं। अदालत में दिखाए गए दस्तावेज़ों को P-1 जैसे नंबर मिलते हैं।', marked: 'चिह्नित', notMarked: 'अभी रिकॉर्ड पर नहीं',
  strong: 'मज़बूत कदम', okay: 'ठीक कदम', weak: 'कमज़ोर कदम', why: 'क्यों', better: 'बेहतर कदम', tryAgain: 'फिर कोशिश करें',
  objection: 'आपत्ति!', sustained: 'आपत्ति स्वीकार।', overruled: 'आपत्ति अस्वीकार।', exhibitMarked: 'प्रदर्श के रूप में चिह्नित।', adjourned: 'सुनवाई स्थगित।',
  refused: 'अनुरोध अस्वीकार।', judgment: 'फ़ैसला सुनाया गया', reasoned: 'कानून इसे कैसे देखता है', caseConcluded: 'मुकदमा समाप्त',
  performance: 'आपका प्रदर्शन', learned: 'आपने क्या सीखा', keyRule: 'मुख्य कानूनी नियम', missed: 'क्या छूट गया', next: 'अगला केस', replay: 'दूसरी भूमिका में फिर खेलें', home: 'मुख्य पृष्ठ',
  dims: { legal: 'कानूनी सटीकता', evidence: 'साक्ष्य', procedure: 'प्रक्रिया', questions: 'प्रश्नों की गुणवत्ता', reasoning: 'न्यायिक तर्क', credibility: 'विश्वसनीयता', time: 'समय' },
  simple: 'आसान', legalRule: 'कानूनी नियम', source: 'स्रोत', close: 'बंद करें', timeLeft: 'सेकंड बाकी',
  labTitle: 'केस लैब', labSub: 'हर बार एक नया काल्पनिक केस। तथ्य AI लिखता है; कानून सिर्फ़ ADALAT की जाँची हुई लाइब्रेरी से आता है।',
  caseType: 'केस का प्रकार', generate: 'नई केस फ़ाइल खोलें', opening: 'केस फ़ाइल खोली जा रही है…', steps: ['कहानी लिखी जा रही है', 'गवाहों की जाँच', 'प्रदर्श तैयार', 'कानून लाइब्रेरी से मिलाया जा रहा है'], cancel: 'रद्द करें',
  genFail: 'केस फ़ाइल नहीं खुल सकी।', genFailSub: 'AI केस अभी उपलब्ध नहीं है। आपकी पसंद सुरक्षित है।', builtin: 'तैयार केस खेलें',
  types: { theft: 'चोरी', cyber: 'साइबर धोखाधड़ी', cheating: 'धोखाधड़ी', road: 'सड़क दुर्घटना' }, comingSoon: 'दीवानी, उपभोक्ता और पारिवारिक मामलों की अलग प्रक्रिया होती है — जल्द आएँगे।',
  mpTitle: 'दोस्तों के साथ खेलें', create: 'अदालत बनाएँ', join: 'कोड से जुड़ें', yourName: 'आपका नाम', code: 'रूम कोड', joinBtn: 'जुड़ें', createBtn: 'रूम बनाएँ',
  lobby: 'अदालत लॉबी', host: 'होस्ट', ready: 'तैयार', notReady: 'तैयार नहीं', openSeat: 'खाली सीट · AI खेलेगा', start: 'मुकदमा शुरू करें', leave: 'रूम छोड़ें', copy: 'निमंत्रण लिंक कॉपी करें', copied: 'लिंक कॉपी हुआ', copyFail: 'कॉपी नहीं हुआ — कोड चुनकर कॉपी करें',
  connected: 'जुड़ा हुआ', reconnecting: 'फिर से जुड़ रहे हैं…', lost: 'कनेक्शन टूटा', resuming: 'फिर शुरू हो रहा है',
  hostGone: 'होस्ट का कनेक्शन टूट गया। खेल रुका है।', becomeHost: 'होस्ट बनें', wait: 'रुकें', roleTaken: 'भूमिका उपलब्ध नहीं', mpOff: 'इस साइट पर मल्टीप्लेयर अभी सेट नहीं है।',
  aiReview: 'शिक्षक की समीक्षा पाएँ', reviewing: 'समीक्षा हो रही है…', winSide: 'फ़ैसला कानून और साक्ष्य के अनुसार है।', loseSide: 'फ़ैसला दूसरी ओर गया। आपका कौशल स्कोर फिर भी गिना जाता है।',
  awards: 'पुरस्कार', player: 'खिलाड़ी', role: 'भूमिका', score: 'स्कोर'
};
export const STR = { en, hi };
export type Strings = typeof en;

export const ROLE_INFO: Record<string, { color: string; name: Record<Lang, string>; who: Record<Lang, string>; what: Record<Lang, string>; win: Record<Lang, string>; learn: Record<Lang, string>; skills: string[] }> = {
  def: { color: 'var(--color-defence)', name: { en: 'Defence Counsel', hi: 'बचाव पक्ष अधिवक्ता' }, who: { en: 'The accused person’s lawyer. You protect their right to a fair trial.', hi: 'अभियुक्त के वकील। आप निष्पक्ष सुनवाई के अधिकार की रक्षा करते हैं।' }, what: { en: 'Cross-examine witnesses, object to unfair questions, argue reasonable doubt.', hi: 'गवाहों से जिरह, अनुचित प्रश्नों पर आपत्ति, और उचित संदेह की बहस।' }, win: { en: 'Find real gaps in the evidence — not tricks.', hi: 'सबूतों की असली कमियाँ ढूँढें — चालें नहीं।' }, learn: { en: 'Reasonable doubt', hi: 'उचित संदेह' }, skills: ['Cross-examination', 'Objections', 'Arguments'] },
  pros: { color: 'var(--color-prosecution)', name: { en: 'Public Prosecutor', hi: 'लोक अभियोजक' }, who: { en: 'The State’s lawyer.', hi: 'राज्य के वकील।' }, what: { en: 'Prove the charge beyond reasonable doubt using witnesses and exhibits.', hi: 'गवाहों और प्रदर्शों से आरोप को उचित संदेह से परे साबित करें।' }, win: { en: 'Ask open questions and link every claim to evidence.', hi: 'खुले प्रश्न पूछें और हर बात को सबूत से जोड़ें।' }, learn: { en: 'Burden of proof', hi: 'साबित करने का भार' }, skills: ['Chief examination', 'Exhibits', 'Arguments'] },
  judge: { color: 'var(--color-judge)', name: { en: 'Judge', hi: 'न्यायाधीश' }, who: { en: 'The Magistrate in charge of the hearing.', hi: 'सुनवाई चलाने वाले मजिस्ट्रेट।' }, what: { en: 'Frame charges, rule on objections and requests, decide only on the record.', hi: 'आरोप तय करें, आपत्तियों पर निर्णय दें, और केवल रिकॉर्ड पर फ़ैसला करें।' }, win: { en: 'Apply the law fairly to what was proved.', hi: 'जो साबित हुआ उस पर निष्पक्ष रूप से कानून लागू करें।' }, learn: { en: 'Judicial reasoning', hi: 'न्यायिक तर्क' }, skills: ['Rulings', 'Evidence', 'Judgment'] },
  witness: { color: 'var(--color-witness)', name: { en: 'Witness', hi: 'गवाह' }, who: { en: 'A person who saw or knows something about the case.', hi: 'जिसने केस से जुड़ा कुछ देखा या जाना।' }, what: { en: 'Answer questions truthfully from what you personally know.', hi: 'जो आप खुद जानते हैं, उसी से सच्चे उत्तर दें।' }, win: { en: 'Stay truthful and consistent — lying is never rewarded.', hi: 'सच्चे और एक-जैसे रहें — झूठ का कभी इनाम नहीं।' }, learn: { en: 'Credibility', hi: 'विश्वसनीयता' }, skills: ['Truthful testimony', 'Memory'] },
  accused: { color: 'var(--color-accused)', name: { en: 'Accused', hi: 'अभियुक्त' }, who: { en: 'The person charged with the offence.', hi: 'जिस पर अपराध का आरोप है।' }, what: { en: 'Enter your plea and respond to the evidence against you.', hi: 'अपनी दलील दें और अपने ख़िलाफ़ सबूतों का जवाब दें।' }, win: { en: 'Know your rights — you do not have to prove innocence.', hi: 'अपने अधिकार जानें — आपको बेगुनाही साबित नहीं करनी।' }, learn: { en: 'Rights of the accused', hi: 'अभियुक्त के अधिकार' }, skills: ['Plea', 'Explanation'] }
};
export const ROLE_ORDER = ['def', 'pros', 'judge', 'witness', 'accused'];
export const PHASES = { en: ['Filing', 'Charges', 'Prosecution evidence', 'Defence evidence', 'Final arguments', 'Judgment'], hi: ['दाखिला', 'आरोप', 'अभियोजन साक्ष्य', 'बचाव साक्ष्य', 'अंतिम बहस', 'फ़ैसला'] };
export const ERRORS: Record<string, Record<Lang, string>> = {
  AI_UNAVAILABLE: { en: 'AI case generation is temporarily unavailable.', hi: 'AI अभी उपलब्ध नहीं है।' },
  AI_INVALID: { en: 'The AI wrote a case that failed our quality checks. Please try again.', hi: 'AI का केस जाँच में पास नहीं हुआ। फिर कोशिश करें।' },
  RATE_LIMITED: { en: 'Too many attempts. Try again in a minute.', hi: 'बहुत ज़्यादा प्रयास। एक मिनट बाद कोशिश करें।' },
  ROOM_NOT_FOUND: { en: 'That room code doesn’t exist or has expired.', hi: 'यह रूम कोड मौजूद नहीं या समाप्त हो गया है।' },
  ROOM_EXPIRED: { en: 'This courtroom has closed.', hi: 'यह अदालत बंद हो चुकी है।' },
  ROOM_FULL: { en: 'This courtroom is full. You can watch as a spectator.', hi: 'अदालत भर चुकी है। आप दर्शक बनकर देख सकते हैं।' },
  ROLE_TAKEN: { en: 'That seat is taken.', hi: 'वह सीट भर चुकी है।' },
  NOT_READY: { en: 'Waiting for everyone to be ready.', hi: 'सबके तैयार होने की प्रतीक्षा।' },
  STALE: { en: 'The court moved on — refreshing.', hi: 'कार्यवाही आगे बढ़ गई — ताज़ा कर रहे हैं।' },
  NOT_YOUR_TURN: { en: 'It isn’t your turn.', hi: 'अभी आपकी बारी नहीं है।' },
  MP_NOT_CONFIGURED: { en: 'Multiplayer is not set up on this site yet.', hi: 'इस साइट पर मल्टीप्लेयर अभी सेट नहीं है।' },
  NET: { en: 'Connection lost. Reconnecting…', hi: 'कनेक्शन टूटा। फिर से जुड़ रहे हैं…' },
  INVALID_INPUT: { en: 'Please check what you entered.', hi: 'कृपया जो लिखा उसे जाँचें।' },
  UNKNOWN: { en: 'Something went wrong. Please try again.', hi: 'कुछ गड़बड़ हुई। फिर कोशिश करें।' }
};
export const errText = (code: string, lang: Lang) => (ERRORS[code] || ERRORS.UNKNOWN)[lang];
