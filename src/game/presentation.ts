// Game-facing presentation layer: short, friendly copy on top of the full legal engine.
// The engine, case data and law library are unchanged; this only decides what the player SEES first.
import type { Lang } from '../i18n';

type L = Record<Lang, string>;
/** Step → [game headline, legal term]. The legal term is shown small, secondary. */
export const STEP_GAME: Record<string, { head: L; term: L; icon: string }> = {
  filing: { head: { en: 'Start the case', hi: 'केस शुरू करें' }, term: { en: 'Filing', hi: 'दाखिला' }, icon: '📂' },
  charges: { head: { en: 'Choose the charges', hi: 'आरोप चुनें' }, term: { en: 'Framing charges', hi: 'आरोप तय करना' }, icon: '📜' },
  plea: { head: { en: 'Guilty or not guilty?', hi: 'दोषी या निर्दोष?' }, term: { en: 'Plea', hi: 'दलील' }, icon: '🙋' },
  chief: { head: { en: 'Ask the witness', hi: 'गवाह से पूछें' }, term: { en: 'Examination-in-chief', hi: 'मुख्य परीक्षा' }, icon: '❓' },
  objection: { head: { en: 'Stop that question?', hi: 'वह प्रश्न रोकें?' }, term: { en: 'Objection', hi: 'आपत्ति' }, icon: '✋' },
  ruling: { head: { en: 'Judge decides', hi: 'न्यायाधीश तय करें' }, term: { en: 'Ruling', hi: 'निर्णय' }, icon: '⚖️' },
  answer: { head: { en: 'Tell the truth', hi: 'सच बताएँ' }, term: { en: 'Witness answer', hi: 'गवाह का उत्तर' }, icon: '👁️' },
  cross: { head: { en: 'Test the story', hi: 'कहानी परखें' }, term: { en: 'Cross-examination', hi: 'जिरह' }, icon: '🔍' },
  evidence: { head: { en: 'Show the clue', hi: 'सुराग दिखाएँ' }, term: { en: 'Evidence on record', hi: 'साक्ष्य' }, icon: '🧩' },
  summon: { head: { en: 'Get the missing clue', hi: 'छूटा सुराग मँगाएँ' }, term: { en: 'Summons & adjournment', hi: 'समन और स्थगन' }, icon: '📨' },
  args: { head: { en: 'Make your strongest case', hi: 'अपनी सबसे मज़बूत बात रखें' }, term: { en: 'Final arguments', hi: 'अंतिम बहस' }, icon: '🗣️' },
  verdict: { head: { en: 'Make the final call', hi: 'अंतिम फ़ैसला करें' }, term: { en: 'Judgment', hi: 'फ़ैसला' }, icon: '⚖️' },
  sentence: { head: { en: 'Choose the outcome', hi: 'परिणाम चुनें' }, term: { en: 'Sentence', hi: 'सज़ा' }, icon: '📜' }
};
export const stepHead = (step: string, lang: Lang) => (STEP_GAME[step] || STEP_GAME.args).head[lang];
export const stepTerm = (step: string, lang: Lang) => (STEP_GAME[step] || STEP_GAME.args).term[lang];

/** First sentence only — keeps feedback to one line; the full text stays behind "Learn why". */
export const firstSentence = (s: string) => { const m = String(s || '').match(/^.*?[.!?।](\s|$)/); return (m ? m[0] : String(s || '')).trim(); };

export function clueIcon(name: string) {
  const n = String(name || '').toLowerCase();
  if (/phone|mobile|imei|sim/.test(n)) return '📱';
  if (/cctv|video|camera|footage/.test(n)) return '🎥';
  if (/bill|invoice|receipt|purchase/.test(n)) return '🧾';
  if (/tower|location|gps|map/.test(n)) return '📍';
  if (/bank|upi|account|statement|transaction/.test(n)) return '🏦';
  if (/medical|injury|hospital|mlc/.test(n)) return '🩺';
  if (/chat|whatsapp|message|sms|email/.test(n)) return '💬';
  if (/vehicle|car|bike|scooter|truck/.test(n)) return '🚗';
  if (/breath|alcohol|blood/.test(n)) return '🧪';
  if (/fir|complaint|report|memo|statement/.test(n)) return '📄';
  return '🗂️';
}

export const ROLE_GAME: Record<string, { icon: string; name: L; line: L }> = {
  def: { icon: '🛡️', name: { en: 'Defence Lawyer', hi: 'बचाव वकील' }, line: { en: 'Find the weak spot.', hi: 'कमज़ोरी ढूँढें।' } },
  pros: { icon: '📣', name: { en: 'Prosecutor', hi: 'अभियोजक' }, line: { en: 'Prove what happened.', hi: 'साबित करें क्या हुआ।' } },
  judge: { icon: '⚖️', name: { en: 'Judge', hi: 'न्यायाधीश' }, line: { en: 'You decide.', hi: 'फ़ैसला आपका।' } },
  witness: { icon: '👁️', name: { en: 'Witness', hi: 'गवाह' }, line: { en: 'Tell what you saw.', hi: 'जो देखा, वो बताएँ।' } },
  accused: { icon: '🙋', name: { en: 'Accused', hi: 'अभियुक्त' }, line: { en: 'Know your rights.', hi: 'अपने अधिकार जानें।' } }
};

export const LEVEL_GAME: Record<number, { name: L; line: L; icon: string }> = {
  1: { name: { en: 'Learn', hi: 'सीखें' }, line: { en: 'Spot the obvious clue.', hi: 'साफ़ सुराग पहचानें।' }, icon: '🌱' },
  2: { name: { en: 'Think', hi: 'सोचें' }, line: { en: 'Some clues are misleading.', hi: 'कुछ सुराग भटकाते हैं।' }, icon: '🧠' },
  3: { name: { en: 'Master', hi: 'महारत' }, line: { en: 'Now the real challenge begins.', hi: 'अब असली चुनौती।' }, icon: '🏆' }
};

export const starsFor = (score: number | null | undefined) => (score == null ? 0 : score >= 85 ? 3 : score >= 65 ? 2 : score >= 40 ? 1 : 0);

export const G = {
  en: { tagline: 'Can you make the right call?', play: 'PLAY', friends: 'PLAY WITH FRIENDS', settings: 'Settings', more: 'More', practice: 'Case Lab (AI practice)',
    level: 'Level', locked: 'Finish the level before', start: 'START', seeCase: 'See full case', changeRole: 'Change role', who: 'WHO?', what: 'WHAT HAPPENED?', job: 'YOUR JOB',
    yourMove: 'YOUR MOVE', waiting: 'is thinking…', checking: 'Checking…', great: 'GREAT MOVE', ok: 'NOT BAD', weak: 'NOT THE BEST', learnWhy: 'Learn why', tryAgain: 'Try again',
    clues: 'Clues', learn: 'Learn', record: 'Record', noClues: 'No clues yet.', useClue: 'Use clue', close: 'Close', onRecord: 'On record', notYet: 'Not shown yet', writeOwn: 'Write your own', say: 'Say it',
    youWon: 'YOU WON', goodTry: 'GOOD TRY', lesson: 'Key lesson', nextLevel: 'PLAY NEXT LEVEL', again: 'PLAY AGAIN', home: 'HOME', details: 'Detailed performance', unlocked: 'New level unlocked!',
    exit: 'Exit', connected: 'Connected', reconnecting: 'Reconnecting…', yourName: 'Your name', create: 'Create room', join: 'Join', code: 'Room code', options: 'Room options', best: 'Best',
    otherMoves: 'makes a move…', finalCall: 'See the verdict', legalIdea: 'Legal idea', fullCase: 'Full case file', language: 'Language', sound: 'Sound', voice: 'Voice (reads key lines)', reducedAudio: 'Quieter sounds' },
  hi: { tagline: 'क्या आप सही फ़ैसला कर सकते हैं?', play: 'खेलें', friends: 'दोस्तों के साथ खेलें', settings: 'सेटिंग्स', more: 'और', practice: 'केस लैब (AI अभ्यास)',
    level: 'स्तर', locked: 'पहले पिछला स्तर पूरा करें', start: 'शुरू करें', seeCase: 'पूरा केस देखें', changeRole: 'भूमिका बदलें', who: 'कौन?', what: 'क्या हुआ?', job: 'आपका काम',
    yourMove: 'आपकी बारी', waiting: 'सोच रहे हैं…', checking: 'जाँच रहे हैं…', great: 'बढ़िया कदम', ok: 'ठीक है', weak: 'सबसे अच्छा नहीं', learnWhy: 'क्यों? जानें', tryAgain: 'फिर कोशिश करें',
    clues: 'सुराग', learn: 'सीखें', record: 'रिकॉर्ड', noClues: 'अभी कोई सुराग नहीं।', useClue: 'सुराग इस्तेमाल करें', close: 'बंद करें', onRecord: 'रिकॉर्ड पर', notYet: 'अभी नहीं दिखाया', writeOwn: 'खुद लिखें', say: 'बोलें',
    youWon: 'आप जीते', goodTry: 'अच्छी कोशिश', lesson: 'मुख्य सीख', nextLevel: 'अगला स्तर खेलें', again: 'फिर खेलें', home: 'होम', details: 'विस्तृत प्रदर्शन', unlocked: 'नया स्तर खुला!',
    exit: 'बाहर', connected: 'जुड़ा हुआ', reconnecting: 'फिर जुड़ रहे हैं…', yourName: 'आपका नाम', create: 'रूम बनाएँ', join: 'जुड़ें', code: 'रूम कोड', options: 'रूम विकल्प', best: 'सर्वश्रेष्ठ',
    otherMoves: 'चाल चल रहे हैं…', finalCall: 'फ़ैसला देखें', legalIdea: 'कानूनी विचार', fullCase: 'पूरी केस फ़ाइल', language: 'भाषा', sound: 'ध्वनि', voice: 'आवाज़ (मुख्य पंक्तियाँ)', reducedAudio: 'धीमी ध्वनि' }
};
