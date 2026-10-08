// Built-in case library (data, not engine). Each case: { id, level, type, title, court, caseNo, names, story, timeline, people, exhibits, laws, turns, correct, explain, lesson }.
import ADALAT from './legacy/adalat-cases.js';

const TYPE_OF = { Theft: 'theft', 'Road accident': 'road', 'Cyber fraud': 'cyber', Cyber: 'cyber' };
export const BUILTIN = ADALAT.CASES.map(c => ({ ...c, id: 'L' + c.level, type: TYPE_OF[c.type] || String(c.type || '').toLowerCase(), caseType: 'criminal', procedure: 'magistrate_warrant_police_report' }));
import { generateCase } from './generator.js';
const GEN = new Map();
/** 'L1'..'L3' = classic hand-written cases; 'G<level>-<seed>' = procedurally generated (rebuilt deterministically). */
export const getBuiltin = (id) => {
  const m = /^G([1-3])-(\d{1,10})$/.exec(String(id || ''));
  if (m) { if (!GEN.has(id)) { if (GEN.size > 200) GEN.clear(); GEN.set(id, generateCase(+m[1], +m[2])); } return GEN.get(id); }
  return BUILTIN.find(c => c.id === id) || null;
};
export { generateCase };
export const STEPS = ADALAT.STEPS;
export const GLOSS = ADALAT.GLOSS;
export const CASE_META = BUILTIN.map(c => ({ id: c.id, level: c.level, type: c.type, title: c.title, oneLine: c.oneLine, levelName: c.levelName, learn: c.learn, caseType: 'criminal', estimatedMinutes: 15 + c.level * 5 }));
