// ADALAT legal library. The only source of law references in gameplay.
// status: 'checked_public' = checked against public bare-act sources (India Code mirrors) on 2026-10-08;
// a named human reviewer must confirm on indiacode.nic.in and change it to 'verified'.
// 'needs_review' = not yet checked. 'simplification' = game teaching rule, not a section.
// Keep the act's own modality: "may" stays "may", "shall" stays "shall".

const IC = 'https://www.indiacode.nic.in/';

/** @typedef {{id:string, act:string, actShort:string, section:string|null, title:string,
 *  kind:'offence'|'definition'|'procedure'|'evidence_rule'|'presumption'|'burden'|'punishment'|'court_power'|'principle',
 *  modality:'may'|'shall'|'must_not'|'discretion'|null,
 *  simple:{en:string,hi:string}, legal:{en:string,hi?:string}, punishment?:string,
 *  inRealCourts?:string, source:string, checkedAt:string|null, status:'verified'|'checked_public'|'needs_review'|'simplification'}} LawCard */

/** @type {Record<string, LawCard>} */
export const LAW = {
  'BNS-303': { id: 'BNS-303', act: 'Bharatiya Nyaya Sanhita, 2023', actShort: 'BNS', section: '303', title: 'Theft', kind: 'offence', modality: null,
    simple: { en: 'Taking someone’s movable property dishonestly, without their consent.', hi: 'किसी की चल संपत्ति को बेईमानी से, उसकी सहमति के बिना ले जाना चोरी है।' },
    legal: { en: 's.303(1): whoever, intending to take dishonestly any movable property out of the possession of any person without that person’s consent, moves that property, commits theft. s.303(2): imprisonment up to 3 years, or fine, or both; on a second or subsequent conviction, rigorous imprisonment of 1 to 5 years and fine. For a first conviction where the property is worth under ₹5,000 and is returned or restored, the punishment is community service.' },
    punishment: 'Up to 3 years, or fine, or both', source: IC + ' (BNS 2023, s.303)', checkedAt: '2026-10-08', status: 'checked_public' },
  'BNS-317': { id: 'BNS-317', act: 'Bharatiya Nyaya Sanhita, 2023', actShort: 'BNS', section: '317(2)', title: 'Dishonestly receiving or retaining stolen property', kind: 'offence', modality: null,
    simple: { en: 'Keeping something you know — or have good reason to believe — was stolen.', hi: 'ऐसी चीज़ रखना जिसके बारे में आप जानते हैं, या आपके पास मानने का ठोस कारण है, कि वह चोरी की है।' },
    legal: { en: 's.317(2): whoever dishonestly receives or retains any stolen property, knowing or having reason to believe it to be stolen property, is punishable with imprisonment up to 3 years, or fine, or both. "Reason to believe" can be inferred from circumstances such as a price far below value, no bill, or an unknown seller.' },
    punishment: 'Up to 3 years, or fine, or both', source: IC + ' (BNS 2023, s.317)', checkedAt: '2026-10-08', status: 'checked_public' },
  'BNS-318': { id: 'BNS-318', act: 'Bharatiya Nyaya Sanhita, 2023', actShort: 'BNS', section: '318(4)', title: 'Cheating and dishonestly inducing delivery of property', kind: 'offence', modality: null,
    simple: { en: 'Tricking someone with a lie so that they hand over money or property.', hi: 'झूठ बोलकर किसी को धोखा देना ताकि वह पैसा या संपत्ति सौंप दे।' },
    legal: { en: 's.318(1) defines cheating. s.318(2): up to 3 years, or fine, or both. s.318(4): cheating that dishonestly induces the delivery of property: imprisonment up to 7 years and fine.' },
    punishment: 'Up to 7 years and fine (s.318(4))', source: IC + ' (BNS 2023, s.318)', checkedAt: '2026-10-08', status: 'checked_public' },
  'IT-66C': { id: 'IT-66C', act: 'Information Technology Act, 2000', actShort: 'IT Act', section: '66C', title: 'Identity theft', kind: 'offence', modality: null,
    simple: { en: 'Dishonestly using someone else’s password, OTP or digital signature.', hi: 'किसी और का पासवर्ड, OTP या डिजिटल हस्ताक्षर बेईमानी से इस्तेमाल करना।' },
    legal: { en: 'Whoever fraudulently or dishonestly makes use of the electronic signature, password or any other unique identification feature of any other person: imprisonment up to 3 years, and also liable to a fine of up to ₹1 lakh.' },
    punishment: 'Up to 3 years, and liable to fine up to ₹1 lakh', source: IC + ' (IT Act 2000, s.66C)', checkedAt: '2026-10-08', status: 'checked_public' },
  'IT-66D': { id: 'IT-66D', act: 'Information Technology Act, 2000', actShort: 'IT Act', section: '66D', title: 'Cheating by personation using a computer resource', kind: 'offence', modality: null,
    simple: { en: 'Cheating someone by pretending to be another person, using a phone or the internet.', hi: 'फ़ोन या इंटरनेट से कोई और बनकर किसी को धोखा देना।' },
    legal: { en: 'Whoever, by means of any communication device or computer resource, cheats by personation: imprisonment up to 3 years, and also liable to a fine of up to ₹1 lakh.' },
    punishment: 'Up to 3 years, and liable to fine up to ₹1 lakh', source: IC + ' (IT Act 2000, s.66D)', checkedAt: '2026-10-08', status: 'checked_public' },
  'BSA-23': { id: 'BSA-23', act: 'Bharatiya Sakshya Adhiniyam, 2023', actShort: 'BSA', section: '23', title: 'Confession to police officer', kind: 'evidence_rule', modality: 'must_not',
    simple: { en: 'A confession made to the police cannot be used against the accused in court.', hi: 'पुलिस के सामने किया गया इकबाल अदालत में अभियुक्त के ख़िलाफ़ इस्तेमाल नहीं हो सकता।' },
    legal: { en: 's.23(1): no confession made to a police officer shall be proved against a person accused of any offence. A confession made in police custody cannot be proved unless made in the immediate presence of a Magistrate. Under the proviso, where a fact is discovered as a result of information received from an accused in custody, so much of that information as relates distinctly to the fact discovered may be proved.' },
    inRealCourts: 'Reviewer: confirm the sub-section numbering of the custody rule and the discovery proviso on India Code.',
    source: IC + ' (BSA 2023, s.23)', checkedAt: '2026-10-08', status: 'checked_public' },
  'BSA-119': { id: 'BSA-119', act: 'Bharatiya Sakshya Adhiniyam, 2023', actShort: 'BSA', section: '119', title: 'Court may presume existence of certain facts', kind: 'presumption', modality: 'may',
    simple: { en: 'If someone is found with stolen goods soon after a theft, the court MAY — not must — infer they stole it or knew it was stolen, unless they can explain it.', hi: 'अगर चोरी के कुछ समय बाद किसी के पास चोरी का सामान मिले और वह संतोषजनक कारण न बता सके, तो अदालत यह मान सकती है (ज़रूरी नहीं) कि उसने चोरी की या जानबूझकर रखा।' },
    legal: { en: 's.119(1): the Court may presume the existence of any fact which it thinks likely to have happened, regard being had to the common course of natural events, human conduct and public and private business. Illustration (a) applies this to a person in possession of stolen goods soon after the theft. The presumption is discretionary and rebuttable; it does not automatically establish guilt.' },
    source: IC + ' (BSA 2023, s.119)', checkedAt: '2026-10-08', status: 'checked_public' },
  'BSA-146': { id: 'BSA-146', act: 'Bharatiya Sakshya Adhiniyam, 2023', actShort: 'BSA', section: '146', title: 'Leading questions', kind: 'evidence_rule', modality: 'must_not',
    simple: { en: 'A leading question suggests its own answer. If the other side objects, it is not allowed when questioning your own witness. It is allowed in cross-examination.', hi: 'सूचक प्रश्न वह है जो खुद उत्तर सुझा दे। अपने गवाह से पूछते समय, दूसरा पक्ष आपत्ति करे तो यह मना है। जिरह में यह पूछा जा सकता है।' },
    legal: { en: 's.146(1) defines a leading question. s.146(2): leading questions must not, if objected to by the adverse party, be asked in an examination-in-chief or a re-examination, except with the permission of the Court. s.146(3): the Court shall permit leading questions on matters that are introductory or undisputed, or that have already been sufficiently proved. s.146(4): leading questions may be asked in cross-examination.' },
    source: IC + ' (BSA 2023, s.146)', checkedAt: '2026-10-08', status: 'checked_public' },
  'BNSS-193': { id: 'BNSS-193', act: 'Bharatiya Nagarik Suraksha Sanhita, 2023', actShort: 'BNSS', section: '193', title: 'Police report on completion of investigation', kind: 'procedure', modality: 'shall',
    simple: { en: 'The police’s final report to the court after investigating (the “chargesheet”).', hi: 'जाँच पूरी होने पर पुलिस की अदालत को अंतिम रिपोर्ट (आरोप-पत्र)।' },
    legal: { en: 'Every investigation shall be completed without unnecessary delay. On completion, the officer in charge of the police station forwards a report to the Magistrate empowered to take cognizance.' },
    source: IC + ' (BNSS 2023, s.193)', checkedAt: '2026-10-08', status: 'checked_public' },
  'BNSS-263': { id: 'BNSS-263', act: 'Bharatiya Nagarik Suraksha Sanhita, 2023', actShort: 'BNSS', section: '263', title: 'Framing of charge (warrant case on police report)', kind: 'procedure', modality: 'shall',
    simple: { en: 'The judge decides there is enough material for a trial. This is NOT a finding of guilt.', hi: 'न्यायाधीश तय करते हैं कि मुकदमा चलाने लायक सामग्री है। यह दोषी होने का फ़ैसला नहीं है।' },
    legal: { en: 'If the Magistrate is of opinion that there is ground for presuming that the accused has committed a triable offence, the Magistrate shall frame a written charge within 60 days of the first hearing on charge. The charge is read and explained, and the accused is asked whether they plead guilty or claim to be tried.' },
    inRealCourts: 'Game simplification: in real courts this can take several hearings.', source: IC + ' (BNSS 2023, s.263)', checkedAt: '2026-10-08', status: 'checked_public' },
  'BNS-106-1': { id: 'BNS-106-1', act: 'Bharatiya Nyaya Sanhita, 2023', actShort: 'BNS', section: '106(1)', title: 'Causing death by negligence', kind: 'offence', modality: null,
    simple: { en: 'Causing someone’s death by a rash or careless act, without meaning to kill.', hi: 'लापरवाही या जल्दबाज़ी से किसी की मृत्यु का कारण बनना, बिना मारने के इरादे के।' },
    legal: { en: 'Causing death by a rash or negligent act not amounting to culpable homicide: imprisonment up to 5 years and fine.' },
    punishment: 'Up to 5 years and fine', source: IC + ' (BNS 2023, s.106)', checkedAt: null, status: 'needs_review' },
  'BNS-281': { id: 'BNS-281', act: 'Bharatiya Nyaya Sanhita, 2023', actShort: 'BNS', section: '281', title: 'Rash driving on a public way', kind: 'offence', modality: null,
    simple: { en: 'Driving so rashly or carelessly on a public road that it puts lives in danger.', hi: 'सार्वजनिक सड़क पर इतनी लापरवाही से गाड़ी चलाना कि लोगों की जान ख़तरे में पड़े।' },
    legal: { en: 'Driving or riding on a public way so rashly or negligently as to endanger human life or be likely to cause hurt: imprisonment up to 6 months, or fine up to ₹1,000, or both.' },
    punishment: 'Up to 6 months, or fine up to ₹1,000, or both', source: IC + ' (BNS 2023, s.281)', checkedAt: null, status: 'needs_review' },
  'BNS-125': { id: 'BNS-125', act: 'Bharatiya Nyaya Sanhita, 2023', actShort: 'BNS', section: '125(b)', title: 'Act endangering life — grievous hurt', kind: 'offence', modality: null,
    simple: { en: 'A rash act that endangers life and causes serious (“grievous”) injury.', hi: 'जल्दबाज़ी का ऐसा काम जो जान ख़तरे में डाले और गंभीर चोट पहुँचाए।' },
    legal: { en: 'Doing an act so rashly or negligently as to endanger human life; under clause (b), where grievous hurt is caused: imprisonment up to 3 years, or fine up to ₹10,000, or both.' },
    punishment: 'Up to 3 years, or fine up to ₹10,000, or both', source: IC + ' (BNS 2023, s.125)', checkedAt: null, status: 'needs_review' },
  'MVA-185': { id: 'MVA-185', act: 'Motor Vehicles Act, 1988', actShort: 'MV Act', section: '185', title: 'Driving by a drunken person', kind: 'offence', modality: null,
    simple: { en: 'Driving with more alcohol in the blood than the law allows (30 mg per 100 ml).', hi: 'कानूनी सीमा (30 mg प्रति 100 ml) से ज़्यादा शराब पीकर गाड़ी चलाना।' },
    legal: { en: 'Driving with alcohol in the blood exceeding 30 mg per 100 ml, as detected by a breath analyser or other test: for a first offence, imprisonment up to 6 months, or a fine up to ₹10,000, or both (as amended in 2019).' },
    punishment: 'First offence: up to 6 months and/or fine up to ₹10,000', source: IC + ' (MV Act 1988, s.185)', checkedAt: null, status: 'needs_review' },
  'BURDEN': { id: 'BURDEN', act: 'Principle of criminal law', actShort: 'Principle', section: null, title: 'Burden of proof and reasonable doubt', kind: 'principle', modality: null,
    simple: { en: 'The prosecution has to prove guilt beyond reasonable doubt. The accused does not have to prove innocence.', hi: 'अपराध साबित करने की ज़िम्मेदारी अभियोजन की है, और वह भी उचित संदेह से परे। अभियुक्त को अपनी बेगुनाही साबित नहीं करनी पड़ती। अगर सबूत देखकर एक समझदार व्यक्ति के मन में असली शक बचता है, तो अभियुक्त को दोषी नहीं ठहराया जाता।' },
    legal: { en: '“Beyond reasonable doubt” is a standard laid down by the courts; it is not a single statutory section. The BSA’s burden-of-proof chapter (ss.104 onwards) sets out who must prove which facts.' },
    inRealCourts: 'Game simplification of a judicial standard.', source: IC + ' (BSA 2023, Chapter VII)', checkedAt: null, status: 'simplification' },
  'RECORD': { id: 'RECORD', act: 'Principle of trial procedure', actShort: 'Principle', section: null, title: 'Decide only on the record', kind: 'principle', modality: null,
    simple: { en: 'The judge can only use evidence that was properly brought before the court.', hi: 'न्यायाधीश केवल उसी सबूत पर फ़ैसला कर सकते हैं जो अदालत में ठीक से पेश हुआ।' },
    legal: { en: 'Judgment must rest on evidence on the record; material that was not proved cannot be relied on.' },
    inRealCourts: 'Game simplification.', source: '—', checkedAt: null, status: 'simplification' }
};

const SEC_MAP = [
  [/^BNS 303/, 'BNS-303'], [/^BNS 317/, 'BNS-317'], [/^BNS 318/, 'BNS-318'], [/^BSA §?(s\.)?119/, 'BSA-119'], [/^BSA §?23/, 'BSA-23'],
  [/^BSA §?146/, 'BSA-146'], [/^IT Act s?\.?66C/, 'IT-66C'], [/^IT Act s?\.?66D/, 'IT-66D'], [/^BNS 106/, 'BNS-106-1'], [/^BNS 281/, 'BNS-281'],
  [/^BNS 125/, 'BNS-125'], [/^MV Act s?\.?185/, 'MVA-185']
];
/** Map a legacy law object to a library id. Returns null when it is not in the library. */
export function lawIdFor(legacy) {
  const sec = String(legacy.sec || '');
  for (const [re, id] of SEC_MAP) if (re.test(sec)) return id;
  if (/^Basic rule/i.test(sec)) return /record/i.test(legacy.title || '') ? 'RECORD' : 'BURDEN';
  return null;
}
export const isLawId = (id) => Object.prototype.hasOwnProperty.call(LAW, id);
export const STATUS_LABEL = { verified: 'REAL LAW', checked_public: 'REAL LAW', needs_review: 'REAL LAW · UNDER REVIEW', simplification: 'GAME SIMPLIFICATION' };
/** Allowed ids per AI case type. AI may only reference these. */
export const LAW_IDS_FOR_TYPE = {
  theft: ['BNS-303', 'BNS-317', 'BSA-119', 'BSA-23', 'BSA-146', 'BNSS-193', 'BNSS-263', 'BURDEN', 'RECORD'],
  cyber: ['BNS-318', 'IT-66C', 'IT-66D', 'BSA-23', 'BSA-146', 'BNSS-193', 'BNSS-263', 'BURDEN', 'RECORD'],
  cheating: ['BNS-318', 'BSA-23', 'BSA-146', 'BNSS-193', 'BNSS-263', 'BURDEN', 'RECORD'],
  road: ['BNS-106-1', 'BNS-281', 'BNS-125', 'MVA-185', 'BSA-146', 'BNSS-193', 'BNSS-263', 'BURDEN', 'RECORD']
};
