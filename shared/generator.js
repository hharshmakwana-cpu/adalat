// Procedural case generator — a brand-new, playable case every time, no AI or network needed.
// Deterministic from (level, seed): the server can rebuild a multiplayer room's case from its stored id.
// Law comes only from the library ids below; facts are fictional.
// Each "plot" fixes the legally correct outcome from the FACTS (not from what the players discover).

function genRng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const FIRST_M = ['Arjun', 'Kabir', 'Rohan', 'Imran', 'Vikram', 'Dev', 'Sameer', 'Anil', 'Farhan', 'Nikhil', 'Joseph', 'Harpreet', 'Tenzing', 'Rahul', 'Manoj', 'Aditya', 'Salim', 'Gaurav', 'Pranav', 'Kiran'];
const FIRST_F = ['Ananya', 'Meher', 'Riya', 'Fatima', 'Lakshmi', 'Neha', 'Priya', 'Sana', 'Divya', 'Kavya', 'Pooja', 'Zoya', 'Ishita', 'Mary', 'Gurleen', 'Asha', 'Nandini', 'Ruksana', 'Tara', 'Simran'];
const LAST = ['Sharma', 'Iyer', 'Khan', 'Das', 'Patil', 'Reddy', 'Nair', 'Singh', 'Mehta', 'Bose', 'Joshi', 'Ansari', 'Kulkarni', 'Pillai', 'Gill', 'Mishra', 'Rao', 'Fernandes', 'Bhatt', 'Chauhan', 'Sethi', 'Thakur', 'Varghese', 'Hegde'];
const CITIES = [['Pune', 'Shivajinagar'], ['Jaipur', 'Malviya Nagar'], ['Kochi', 'Ernakulam'], ['Lucknow', 'Hazratganj'], ['Bhopal', 'MP Nagar'], ['Indore', 'Vijay Nagar'], ['Nagpur', 'Sitabuldi'], ['Patna', 'Boring Road'], ['Chandigarh', 'Sector 17'], ['Surat', 'Adajan'], ['Mysuru', 'Devaraja'], ['Guwahati', 'Paltan Bazaar'], ['Dehradun', 'Rajpur Road'], ['Ranchi', 'Lalpur'], ['Coimbatore', 'RS Puram'], ['Varanasi', 'Lanka']];
const ITEMS = [
  { k: 'phone', name: 'mobile phone', price: 38000, mark: 'IMEI number', icon: 'phone' },
  { k: 'laptop', name: 'laptop', price: 62000, mark: 'serial number', icon: 'laptop' },
  { k: 'cycle', name: 'geared bicycle', price: 24000, mark: 'frame number', icon: 'bike' },
  { k: 'chain', name: 'gold chain', price: 85000, mark: 'jeweller\'s hallmark', icon: 'chain' },
  { k: 'watch', name: 'smartwatch', price: 21000, mark: 'serial number', icon: 'watch' },
  { k: 'camera', name: 'DSLR camera', price: 54000, mark: 'serial number', icon: 'camera' }
];
const PLACES = ['a crowded bus stop', 'a railway platform', 'a college canteen', 'a gym locker room', 'a busy vegetable market', 'a temple fair', 'a metro station exit', 'a wedding hall', 'a hostel common room', 'a hospital waiting area'];
const MONTHS = ['January', 'February', 'March', 'April', 'June', 'July', 'August', 'September', 'October', 'November'];
const CLOTHES = ['a red cap', 'a yellow raincoat', 'a green hoodie', 'a striped shirt', 'a black helmet', 'a blue school-style backpack'];

/** Plots. truth = correct verdict. Each defines the decisive facts the player can uncover. */
const PLOTS = {
  receiver: { truth: 'part', lv: [1, 2], title: 'Bought, or stolen?' },
  misid: { truth: 'acq', lv: [2, 3], title: 'Was it really him?' },
  strong: { truth: 'full', lv: [1, 2, 3], title: 'The camera never blinks' },
  confession: { truth: 'acq', lv: [3], title: 'Only a confession' }
};

export function generateCase(level, seed) {
  const r = genRng(seed * 7919 + level * 104729); const pick = (a) => a[Math.floor(r() * a.length)];
  const lv = Math.max(1, Math.min(3, level | 0));
  const plotKeys = Object.keys(PLOTS).filter(k => PLOTS[k].lv.includes(lv)); const plotKey = pick(plotKeys); const plot = PLOTS[plotKey];
  const person = (f) => `${pick(f ? FIRST_F : FIRST_M)} ${pick(LAST)}`;
  const vF = r() < 0.5; const victim = person(vF); const accused = person(r() < 0.25); const eye = person(r() < 0.5); const io = (r() < 0.5 ? 'SI ' : 'ASI ') + person(r() < 0.4);
  const judge = (r() < 0.5 ? 'Smt. ' : 'Shri ') + person(false).replace(/^\S+/, s => s[0] + '.') + ', JMFC';
  const pros = 'Adv. ' + person(r() < 0.5) + ', APP'; const def = 'Adv. ' + person(r() < 0.5);
  const [city, area] = pick(CITIES); const item = pick(ITEMS); const place = pick(PLACES); const month = pick(MONTHS); const day = 2 + Math.floor(r() * 24);
  const hour = 6 + Math.floor(r() * 4); const min = ['05', '15', '20', '40', '50'][Math.floor(r() * 5)]; const time = `${hour}:${min} pm`;
  const cloth = pick(CLOTHES); const cheap = Math.round(item.price * (0.1 + r() * 0.1) / 500) * 500; const dist = 25 + Math.floor(r() * 25);
  const surname = accused.split(' ')[1]; const vFirst = victim.split(' ')[0]; const aFirst = accused.split(' ')[0]; const eyeFirst = eye.split(' ')[0];
  const caseNo = `Case No. ${100 + Math.floor(r() * 1800)}/2026`;
  const O = (t, g, c, why, f) => ({ t, g, c, why, ...(f ? { f } : {}) });
  const A = (t) => ({ t });
  const shuffle = (opts) => { const a = opts.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const hard = lv >= 2; const NG = { none: ['guilty'] };

  // ---- facts per plot ----
  const F = {
    receiver: {
      one: `${vFirst}'s ${item.name} vanished at ${place}. Days later it turned up with ${aFirst}, who says he bought it cheap.`,
      eyeSaw: `I saw someone in ${cloth} near ${vFirst}, but I never saw his face.`,
      eyeCross: `No. I cannot say it was the accused. I only saw the back of a person in ${cloth}.`,
      ioSaw: `We traced the ${item.mark} and recovered the ${item.name} from the accused's house two days later.`,
      ioCross: `Yes. The accused told us he bought it for ₹${cheap.toLocaleString('en-IN')} from a stranger. He had no bill.`,
      d1: null,
      p2: 'Recovery memo', p2d: `The ${item.name} was found at ${aFirst}'s home`, p3: 'Purchase bill', p3d: `${vFirst}'s bill showing the ${item.mark}`,
      p4: 'CCTV clip', p4d: `A person in ${cloth} near ${vFirst}; face not visible`,
      crossBest: `Did you see the face of the person who took the ${item.name}?`, crossFlag: 'idWeak',
      accSays: `I bought it for ₹${cheap.toLocaleString('en-IN')} from a man at the weekly market. I did not steal it.`,
      prosBest: `The ${item.name} (P-3) was found with the accused (P-2). He paid only ₹${cheap.toLocaleString('en-IN')} for a ₹${item.price.toLocaleString('en-IN')} item with no bill — he had reason to believe it was stolen.`,
      defBest: 'Nobody saw the accused take it. At most, the prosecution shows possession — not theft.',
      explain: {
        full: 'Not quite. Nobody saw the accused take the item and the CCTV shows no face, so theft (BNS 303) is not proved beyond reasonable doubt.',
        part: `Correct. Theft is not proved — nobody saw him take it. But he kept a ₹${item.price.toLocaleString('en-IN')} item bought for ₹${cheap.toLocaleString('en-IN')} with no bill from an unknown man. He had reason to believe it was stolen: BNS 317(2).`,
        acq: `Too generous. Theft is not proved, but the price, the missing bill and the unknown seller give him reason to believe it was stolen. Retaining it is an offence under BNS 317(2).`
      },
      lesson: { title: 'Possession is not the same as theft', points: ['Being found with stolen goods does not prove you stole them.', 'But a suspicious deal (very low price, no bill, unknown seller) can show you had reason to believe it was stolen.', 'The court MAY presume facts from circumstances (BSA 119) — it does not have to.'] },
      laws: ['BNS-303', 'BNS-317', 'BSA-119', 'BSA-146', 'BURDEN']
    },
    misid: {
      one: `${vFirst}'s ${item.name} was snatched at ${place} after dark. An eyewitness points at ${aFirst} — but from how far away?`,
      eyeSaw: `It was ${aFirst} — the same ${cloth}. I was standing near the tea stall.`,
      eyeCross: `About ${dist} metres. It was after sunset and the lights were dim. I saw ${cloth} more than the face.`,
      ioSaw: `The eyewitness named the accused. We found ${cloth} at his home. The ${item.name} was never recovered.`,
      ioCross: `Yes, ${cloth} like that is sold everywhere in the market. We did not check the accused's alibi.`,
      d1: ['D-1', 'Pharmacy bill and CCTV', `Shows ${aFirst} paying at a pharmacy 4 km away at ${time}`],
      p2: 'Seizure memo', p2d: `${cloth[0].toUpperCase() + cloth.slice(1)} seized from ${aFirst}'s home`, p3: 'Purchase bill', p3d: `${vFirst}'s bill for the ${item.name}`,
      p4: 'Street CCTV', p4d: `A blurry figure in ${cloth}; face not visible in the dark`,
      crossBest: `How far away were you, and how good was the light?`, crossFlag: 'idWeak',
      accSays: `I was at the pharmacy buying medicine for my mother at that time. D-1 shows it.`,
      prosBest: `The eyewitness named the accused and ${cloth} was found at his home (P-2).`,
      defBest: `The only identification was from ${dist} metres in dim light, the CCTV is blurry, the ${item.name} was never found, and D-1 places the accused 4 km away. That is reasonable doubt.`,
      explain: {
        full: `Unsafe. Identification from ${dist} m in poor light, a common piece of clothing, no recovery and an alibi (D-1) leave real doubt. The prosecution must prove guilt beyond reasonable doubt.`,
        part: `There is no lesser offence here — nothing was recovered from him. The question is identity, and it is not proved.`,
        acq: `Correct. Weak identification (${dist} m, dim light), a common piece of clothing, no recovery and a documented alibi (D-1). The accused gets the benefit of doubt.`
      },
      lesson: { title: 'Identification must be reliable', points: ['Ask how far away, how long, and how good the light was.', 'Common clothing does not identify one person.', 'If real doubt remains, the accused must be acquitted.'] },
      laws: ['BNS-303', 'BSA-146', 'BNSS-263', 'BURDEN', 'RECORD']
    },
    strong: {
      one: `A clear CCTV clip shows ${aFirst} taking ${vFirst}'s ${item.name} at ${place}. Is that enough?`,
      eyeSaw: `I saw ${aFirst} lift the ${item.name} from ${vFirst}'s bag. I was two metres away and saw his face clearly.`,
      eyeCross: `Yes, I am sure. I have seen him around the area many times, and the light was good.`,
      ioSaw: `The CCTV shows his face clearly. We recovered the ${item.name}, with the same ${item.mark}, from his bag the same night.`,
      ioCross: `Yes, he also confessed at the police station — but we did not rely on that. The CCTV and the recovery are enough.`,
      d1: null,
      p2: 'Recovery memo', p2d: `The ${item.name} recovered from ${aFirst}'s bag the same night`, p3: 'Purchase bill', p3d: `${vFirst}'s bill matching the ${item.mark}`,
      p4: 'CCTV clip', p4d: `${aFirst}'s face clearly visible taking the ${item.name}`,
      crossBest: `How close were you, and how well could you see his face?`, crossFlag: 'idChecked',
      accSays: `I made a mistake. I am sorry. I have returned it.`,
      prosBest: `The CCTV (P-4) clearly shows the accused, an eyewitness saw his face from two metres, and the ${item.name} with matching ${item.mark} (P-3) was recovered from him (P-2).`,
      defBest: 'The evidence is strong. I ask the court to consider that the item was returned and this is a first offence when sentencing.',
      explain: {
        full: `Correct. A clear CCTV clip, a close and confident eyewitness, and recovery of the same item the same night prove theft (BNS 303) beyond reasonable doubt. The police confession is not used (BSA 23) — and it is not needed.`,
        part: 'The evidence shows he took it himself, not that he only received it. This is theft.',
        acq: 'There is no real doubt here: clear CCTV, a close eyewitness and recovery the same night.'
      },
      lesson: { title: 'Strong evidence is strong — even without a confession', points: ['Clear CCTV + eyewitness + recovery can prove guilt beyond reasonable doubt.', 'A confession made to the police cannot be used against the accused (BSA 23).', 'A good defence lawyer knows when to focus on a fair sentence.'] },
      laws: ['BNS-303', 'BSA-23', 'BSA-146', 'BURDEN']
    },
    confession: {
      one: `The police say ${aFirst} confessed to stealing ${vFirst}'s ${item.name}. Is a confession at the police station enough?`,
      eyeSaw: `I did not see who took it. I only found the ${item.name} missing from my bag.`,
      eyeCross: `No, I never saw the accused near me.`,
      ioSaw: `The accused confessed to me at the police station. He then pointed to a bush in the public park where the ${item.name} was lying.`,
      ioCross: `Yes, the park is open to everyone, all day. Anybody could have left it there. There is no CCTV and no other witness.`,
      d1: null,
      p2: 'Recovery memo', p2d: `${item.name[0].toUpperCase() + item.name.slice(1)} found in a bush in a public park`, p3: 'Purchase bill', p3d: `${vFirst}'s bill for the ${item.name}`,
      p4: 'Police statement', p4d: 'The accused\'s confession, written at the police station',
      crossBest: `The park is open to everyone — could anyone have put the ${item.name} there?`, crossFlag: 'placeOpen',
      accSays: `I was beaten and made to sign. I did not steal anything.`,
      prosBest: `The ${item.name} was found where the accused pointed (P-2), and it matches the bill (P-3).`,
      defBest: 'A confession to the police cannot be used (BSA 23). The only other evidence is an item found in a public park that anyone could reach. That does not prove theft.',
      explain: {
        full: 'Not safe. The confession to the police cannot be proved against him (BSA 23). The only other evidence is an item found in a public park open to all — that alone does not prove he stole it.',
        part: 'There is no evidence he received or kept the item either. Without the confession, nothing links him to it.',
        acq: 'Correct. Confessions to the police are not admissible (BSA 23). A "discovery" from a public place anyone can reach carries little weight. Guilt is not proved beyond reasonable doubt.'
      },
      lesson: { title: 'A police-station confession is not evidence against the accused', points: ['BSA 23: a confession made to a police officer cannot be proved against the accused.', 'Only the part leading to a discovered fact may be proved — and a discovery from a public place is weak.', 'Without independent evidence, the accused gets the benefit of doubt.'] },
      laws: ['BNS-303', 'BSA-23', 'BSA-146', 'BURDEN', 'RECORD']
    }
  }[plotKey];

  // ---- turns ----
  const decoy = (t, why) => O(t, hard ? 1 : 0, 'law', why);
  const turns = [];
  turns.push({ id: 'g1', ph: 0, step: 'filing', role: 'pros', p: 'Which charge fits the facts?', o: shuffle(plotKey === 'receiver'
    ? [O(`Theft (BNS 303), and in the alternative, keeping stolen property (BNS 317)`, 2, 'law', 'Good — the facts may show theft OR knowingly keeping stolen property, so charge both in the alternative.'), O('Robbery', 0, 'law', 'Robbery needs force or fear. Nobody was threatened.'), decoy('Only theft (BNS 303)', 'Possible, but if theft is not proved you have no fallback charge.')]
    : [O(`Theft (BNS 303)`, 2, 'law', 'Right — taking movable property dishonestly without consent is theft.'), O('Robbery', 0, 'law', 'Robbery needs force or fear. Nobody was threatened.'), decoy('Cheating', 'Cheating means tricking someone into handing something over. Here nothing was handed over.')]) });
  turns.push({ id: 'g2', ph: 1, step: 'charges', role: 'judge', p: 'Is there enough material to put the accused on trial?', o: shuffle([O('Yes — frame the charge and read it out to the accused.', 2, 'rsn', 'Framing a charge only means there is enough material for a trial. It is not a finding of guilt.'), O('Declare him guilty now.', 0, 'rsn', 'Guilt can only be decided after the evidence is heard.'), decoy('Ask the police to investigate for six more months first.', 'The chargesheet is already filed; the court should move to trial.')]) });
  turns.push({ id: 'g3', ph: 1, step: 'plea', role: 'accused', p: 'Do you plead guilty or not guilty?', o: [O('Not guilty. I want a trial.', 2, 'law', 'Everyone has the right to a trial. The prosecution must now prove its case.'), O('Guilty.', plotKey === 'strong' ? 2 : 1, 'law', plotKey === 'strong' ? 'You can accept guilt — then there is no trial and the judge moves to sentence.' : 'You can plead guilty, but then the evidence is never tested.', 'guilty')] });
  // PW1 — eyewitness / complainant
  const pw1 = plotKey === 'confession' ? `PW1 ${victim}` : `PW1 ${eye}`;
  const chiefOpts = [O('Tell the court what you saw that evening.', 2, 'wit', 'An open question lets the witness tell their own story.'), O(`You saw ${aFirst} take it, didn't you?`, 0, 'wit', 'That suggests the answer — a leading question. Not allowed when questioning your own witness if the other side objects (BSA 146).', 'lead1'), O(hard ? `Were you scared, and is that why you remember it so well?` : `What did you have for lunch that day?`, 1, 'wit', 'Not useful — it does not help prove what happened.')];
  const chief = shuffle(chiefOpts);
  turns.push({ id: 'g4', ph: 2, step: 'chief', role: 'pros', w: pw1, p: `Ask ${pw1.replace('PW1 ', '')} a good first question.`, cond: NG, o: chief });
  turns.push({ id: 'g5', ph: 2, step: 'objection', role: 'def', p: 'The prosecutor asked a leading question. Stop it?', cond: { all: ['lead1'], none: ['guilty'] }, o: shuffle([O('Objection — that is a leading question.', 2, 'obj', 'Correct. It puts the answer in the witness\'s mouth (BSA 146).', 'obj1'), O('No objection.', 0, 'obj', 'You missed it — the witness was told what to say.'), decoy('Objection — the witness looks nervous.', 'Being nervous is not a ground for objection.')]) });
  turns.push({ id: 'g6', ph: 2, step: 'ruling', role: 'judge', p: 'The defence objects to a leading question. Your ruling?', cond: { all: ['obj1'], none: ['guilty'] }, o: [O('Sustained. Ask an open question instead.', 2, 'rsn', 'Right — leading questions are not allowed in examination-in-chief when objected to.'), O('Overruled. Carry on.', 0, 'rsn', 'The question suggested its own answer; the objection was valid.')] });
  const ansFor = (opts, fact) => opts.map(o => A(o.g === 2 ? fact : o.f === 'lead1' ? (plotKey === 'strong' ? 'Yes.' : `Yes… I think so.`) : o.g === 1 ? 'I don\'t remember anything special.' : 'I don\'t know.'));
  turns.push({ id: 'g7', ph: 2, step: 'answer', role: 'witness', w: pw1, q: 'g4', p: 'Answer truthfully, from what you saw.', cond: NG, o: ansFor(chief, F.eyeSaw) });
  const cross1 = shuffle([O(F.crossBest, 2, 'wit', 'Good — this tests exactly how reliable the witness is.', F.crossFlag), O('You are lying to the court, aren\'t you?', 0, 'wit', 'Insulting the witness achieves nothing and the judge will stop it.'), O(hard ? 'What colour was the victim\'s bag?' : 'Do you like your job?', 1, 'wit', 'Allowed, but it does not test the key point.')]);
  turns.push({ id: 'g8', ph: 2, step: 'cross', role: 'def', w: pw1, p: `Test ${pw1.replace('PW1 ', '')}'s story.`, free: 1, k: plotKey === 'misid' ? ['far', 'light', 'dark', 'metre', 'distance'] : ['face', 'see', 'saw', 'sure', 'public'], cond: NG, o: cross1 });
  turns.push({ id: 'g9', ph: 2, step: 'answer', role: 'witness', w: pw1, q: 'g8', p: 'Answer truthfully.', cond: NG, o: cross1.map(o => A(o.g === 2 ? F.eyeCross : o.g === 0 ? 'No, I am telling the truth.' : 'I don\'t remember.')) });
  turns.push({ id: 'g10', ph: 2, step: 'evidence', role: 'pros', p: 'Which clue do you show the court?', cond: NG, o: shuffle([O(`P-2 ${F.p2} and P-3 ${F.p3}.`, 2, 'evi', 'Good — these link the item to the victim and to where it was found.'), O(plotKey === 'confession' ? 'P-4 the police statement — he confessed!' : 'A neighbour\'s gossip that the accused is "a bad type".', 0, 'evi', plotKey === 'confession' ? 'A confession to the police cannot be proved against the accused (BSA 23).' : 'Gossip about character is not proof of this offence.'), decoy('P-1 the FIR only.', 'The FIR starts the case; it does not prove what happened.')]) });
  turns.push({ id: 'g11', ph: 2, step: 'ruling', role: 'judge', p: 'Should the court admit P-2 and P-3 on record?', cond: NG, o: [O('Admit them — they are relevant and properly proved.', 2, 'evi', 'Relevant documents proved by the right witness go on record.'), O('Reject them — documents are not evidence.', 0, 'evi', 'Documents are evidence when properly proved.')] });
  const pw2 = `PW2 ${io}`;
  const chief2 = shuffle([O('What did your investigation find?', 2, 'wit', 'Open question — the officer explains in their own words.'), O(`You are sure the accused did it, right?`, 0, 'wit', 'Leading — and the officer\'s opinion of guilt is not evidence.', 'lead2'), O('How long have you been in the police?', 1, 'wit', 'Background is fine, but it proves nothing about this case.')]);
  turns.push({ id: 'g12', ph: 2, step: 'chief', role: 'pros', w: pw2, p: `Question the investigating officer.`, cond: NG, o: chief2 });
  turns.push({ id: 'g13', ph: 2, step: 'objection', role: 'def', p: 'Leading again — and asking for an opinion. Stop it?', cond: { all: ['lead2'], none: ['guilty'] }, o: shuffle([O('Objection — leading, and it asks for the officer\'s opinion on guilt.', 2, 'obj', 'Right. Only the court decides guilt.', 'obj2'), O('No objection.', 0, 'obj', 'You let a leading question through.')]) });
  turns.push({ id: 'g14', ph: 2, step: 'ruling', role: 'judge', p: 'The defence objects. Your ruling?', cond: { all: ['obj2'], none: ['guilty'] }, o: [O('Sustained. The officer should state facts, not opinions.', 2, 'rsn', 'Correct — guilt is for the court to decide.'), O('Overruled.', 0, 'rsn', 'The question was leading and asked for an opinion.')] });
  turns.push({ id: 'g15', ph: 2, step: 'answer', role: 'witness', w: pw2, q: 'g12', p: 'Answer truthfully.', cond: NG, o: chief2.map(o => A(o.g === 2 ? F.ioSaw : o.g === 0 ? 'Yes, I am sure.' : 'Twelve years.')) });
  const cross2 = shuffle(plotKey === 'misid'
    ? [O('Is that kind of clothing common in the market, and did you check his alibi?', 2, 'wit', 'Good — tests whether the clothing really points to one person and whether the investigation was complete.', 'alibiGap'), O('Did you take a bribe?', 0, 'wit', 'A baseless accusation. The judge will disallow it.'), O('What time did you reach the spot?', 1, 'wit', 'Fine, but not the key weakness.')]
    : plotKey === 'confession'
      ? [O('Is the park open to everyone, and is there any evidence apart from the confession?', 2, 'wit', 'Exactly — this exposes that nothing but the confession links him.', 'placeOpen2'), O('Did you beat him?', 0, 'wit', 'Serious, but without any basis on record the court will not allow a bare accusation.'), O('How did you write the memo?', 1, 'wit', 'Allowed, but not the key point.')]
      : plotKey === 'receiver'
        ? [O('Did the accused tell you he bought it, and for how much?', 2, 'wit', 'Good — it brings his explanation on record. (A smart prosecutor will use the low price.)', 'priceOut'), O('Did you plant it?', 0, 'wit', 'A baseless accusation. The judge will disallow it.'), O('When did you join this police station?', 1, 'wit', 'Not useful.')]
        : [O('Did you rely on the confession made at the police station?', 2, 'wit', 'Good — checks that inadmissible material is not being used.', 'noConf'), O('Did you plant the CCTV?', 0, 'wit', 'A baseless accusation. The judge will disallow it.'), O('Was the recovery done at night?', 1, 'wit', 'Allowed, but it does not create real doubt.')]);
  turns.push({ id: 'g16', ph: 2, step: 'cross', role: 'def', w: pw2, p: 'Test the officer\'s investigation.', cond: NG, o: cross2 });
  turns.push({ id: 'g17', ph: 2, step: 'answer', role: 'witness', w: pw2, q: 'g16', p: 'Answer truthfully.', cond: NG, o: cross2.map(o => A(o.g === 2 ? F.ioCross : o.g === 0 ? 'No. That is false.' : 'Yes, as per procedure.')) });
  if (F.d1) turns.push({ id: 'g18', ph: 3, step: 'evidence', role: 'def', p: 'Do you have a clue that helps the accused?', cond: NG, o: shuffle([O(`Produce D-1: ${F.d1[1]}.`, 2, 'evi', 'Good — independent evidence that he was elsewhere.', 'd1'), O('Say the accused is a good person.', 0, 'evi', 'Good character alone does not answer the evidence.'), decoy('Produce nothing.', 'You have a strong document; not using it weakens your case.')]) });
  turns.push({ id: 'g19', ph: 3, step: 'statement', role: 'accused', p: 'The judge asks you to explain the evidence against you. What do you say?', cond: NG, o: shuffle([O(F.accSays, 2, 'law', 'Honest and to the point. You do not have to prove innocence, but you can explain.'), O('I refuse to say anything!', 1, 'law', 'You have the right to stay silent — but you lose the chance to explain.'), O(`The victim is lying because ${vF ? 'she hates' : 'he hates'} me.`, 0, 'law', 'An unsupported accusation hurts your credibility.')]) });
  turns.push({ id: 'g20', ph: 4, step: 'args', role: 'pros', p: 'Make your strongest case.', free: 1, k: ['P-2', 'P-3', 'P-4', 'bill', 'recover', 'price', 'clear'], cond: NG, o: shuffle([O(F.prosBest, 2, 'rsn', 'Strong — every point is tied to evidence on record.'), O('The accused looks like a thief.', 0, 'rsn', 'Appearance is not evidence.'), decoy('The accused confessed to the police, so he is guilty.', 'A confession to the police cannot be used against him (BSA 23).')]) });
  turns.push({ id: 'g21', ph: 4, step: 'args', role: 'def', p: 'Make your strongest case.', free: 1, k: ['doubt', 'saw', 'face', 'light', 'D-1', 'public', 'possession', 'confession'], cond: NG, o: shuffle([O(F.defBest, 2, 'rsn', plotKey === 'strong' ? 'Wise — when the evidence is strong, argue for a fair sentence.' : 'Strong — you show exactly where the doubt is.'), O('My client is innocent because he says so.', 0, 'rsn', 'Saying so is not an argument.'), decoy(plotKey === 'strong' ? 'The CCTV must be fake.' : 'The police always lie.', 'Without any basis on record, this convinces no one.')]) });
  turns.push({ id: 'g22', ph: 5, step: 'verdict', role: 'judge', p: 'Make the final call — only on what was proved.', o: [{ t: 'Guilty of theft (BNS 303).', v: 'full' }, { t: plotKey === 'receiver' ? 'Not theft — but guilty of keeping stolen property (BNS 317).' : 'Guilty of a lesser offence only.', v: 'part' }, { t: 'Not guilty — benefit of doubt.', v: 'acq' }] });
  turns.push({ id: 'g23', ph: 5, step: 'sentence', role: 'judge', p: 'Choose a fair outcome.', cond: { verdictNot: 'acq' }, o: shuffle([O('A fine and a short sentence within the legal limit, considering it is a first offence.', 2, 'rsn', 'Proportionate and within the limits set by law.'), O('Ten years in jail.', 0, 'rsn', 'Far above the maximum the law allows for this offence.'), decoy('No punishment at all.', 'A conviction usually needs some sentence; community service or probation may apply in some cases, but a reason must be given.')]) });

  const exhibits = [['P-1', 'FIR', `${vFirst}'s first complaint to the police`], ['P-2', F.p2, F.p2d], ['P-3', F.p3, F.p3d], ['P-4', F.p4, F.p4d]].concat(F.d1 ? [F.d1] : []);
  const story = [
    `On ${day} ${month} 2026, at about ${time}, ${victim} was at ${place} in ${area}, ${city}, with a ${item.name} worth ₹${item.price.toLocaleString('en-IN')}.`,
    plotKey === 'confession' ? `When ${vFirst} checked, the ${item.name} was gone. Nobody saw who took it.` : `${eye} says they saw a person in ${cloth} near ${vFirst} just before it went missing.`,
    F.one
  ];
  return {
    id: `G${lv}-${seed >>> 0}`, level: lv, generated: false, procedural: true, plot: plotKey, type: 'theft', caseType: 'criminal',
    levelName: { en: plot.title, hi: plot.title }, learn: { en: F.lesson.title, hi: F.lesson.title },
    title: `State vs. ${accused}`, court: `Court No. 4, Judicial Magistrate First Class, ${city}`, caseNo,
    names: { judge, pros, def, accused }, oneLine: F.one, story,
    timeline: [[`${day} ${month}, ${time}`, `The ${item.name} goes missing at ${place}`], [`${day} ${month}, later`, 'FIR registered (P-1)'], [`${day + 2} ${month}`, plotKey === 'misid' ? `${cloth[0].toUpperCase() + cloth.slice(1)} seized from ${aFirst}` : `${item.name[0].toUpperCase() + item.name.slice(1)} recovered`]],
    people: [[victim, plotKey === 'confession' ? 'PW1 · Complainant' : 'Complainant', ''], ...(plotKey === 'confession' ? [] : [[eye, 'PW1 · Eyewitness', '']]), [io, 'PW2 · Investigating officer', ''], [accused, 'Accused', '']],
    exhibits, lawIds: F.laws.map(id => ({ id, here: '' })), turns,
    correct: { default: plot.truth, ifFlags: [] }, explain: F.explain, lesson: F.lesson
  };
}

/** Fresh seed for "a new case every time". */
export const newSeed = () => (typeof crypto !== 'undefined' && crypto.getRandomValues ? crypto.getRandomValues(new Uint32Array(1))[0] : Math.floor(Math.random() * 2 ** 32)) >>> 0;
