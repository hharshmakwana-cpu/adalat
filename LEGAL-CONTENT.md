# ADALAT v7 — Legal Content Layer

Rules:
1. Use the **real law** exactly. Keep "may" as "may" and "shall" as "shall". Never upgrade "generally" to "always", "inadmissible" to "irrelevant", or "prima facie" to "proved".
2. Every card carries `status`:
   - `verified`: checked against the bare act on India Code by a named reviewer, with a date.
   - `needs_review`
   - `simplification`: game-only, and must include an "In real courts…" line.
3. AI may **not** add a section. It can only reference ids from this library.
4. Case facts are always fictional and labelled so.
5. Primary source for every card: India Code (indiacode.nic.in) bare acts — BNS 2023, BNSS 2023, BSA 2023, IT Act 2000, MV Act 1988.

## Schema (`src/legal/sections/*.json`)
```json
{
  "id": "BSA-119",
  "act": "Bharatiya Sakshya Adhiniyam, 2023", "actShort": "BSA", "section": "119", "subsection": null,
  "title": "Court may presume existence of certain facts",
  "kind": "presumption",            // definition | offence | punishment | procedure | evidence_rule | presumption | burden | court_power
  "modality": "may",                // may | shall | must_not | discretion
  "simple": { "en": "…≤30 words…", "hi": "…" },
  "legal":  { "en": "…precise paraphrase…", "hi": "…" },
  "elements": [ { "id": "recent", "en": "Found with goods soon after the theft" } ],
  "exceptions": [], "examples": [],
  "statutoryTextExcerpt": null,     // only verbatim short excerpts, marked as such
  "source": "https://www.indiacode.nic.in/  (BSA 2023, s.119)",
  "verifiedAt": "YYYY-MM-DD", "verifiedBy": "<reviewer>", "status": "needs_review"
}
```
The UI shows `statutoryTextExcerpt` as **STATUTORY TEXT**, `legal` as **EDUCATIONAL EXPLANATION**, and anything with `status: simplification` as **GAME SIMPLIFICATION**.

## Library seed (checked against public bare-act sources; a human reviewer must confirm on India Code before setting `verified`)

| id | Rule (precise) | Simple (EN) | Notes for the game |
|---|---|---|---|
| BNS-303 | s.303(1) defines theft: intending to take dishonestly movable property out of a person's possession without consent, moves it. s.303(2): imprisonment up to 3 years, or fine, or both; second or subsequent conviction is RI of at least 1 year and up to 5 years plus fine; first conviction where the value is under ₹5,000 and the property is returned or restored → community service. | Taking someone's movable property dishonestly, without their consent. | Elements: dishonest intention · movable property · out of possession · without consent · moved. |
| BNS-317 | s.317(1) defines "stolen property". s.317(2): dishonestly receiving or retaining stolen property, knowing or **having reason to believe** it is stolen → up to 3 years, or fine, or both. (317(3) dacoity, 317(4) habitual dealing, 317(5) assisting concealment.) | Keeping something you know, or have good reason to think, was stolen. | "Reason to believe" is the key element: price far below value, no bill, unknown seller. |
| BNS-318 | s.318(1) defines cheating. 318(2): up to 3 years, or fine, or both. 318(4): cheating that dishonestly induces delivery of property → up to 7 years and fine. | Tricking someone with a lie so they hand over money or property. | Keep the sub-section in the card; v6 used 318(4), which is correct for delivery of money. |
| IT-66C | Fraudulently or dishonestly using another person's electronic signature, password or other unique identification feature → imprisonment up to 3 years **and** liable to fine up to ₹1 lakh. | Dishonestly using someone else's password, OTP or digital signature. | |
| IT-66D | Cheating by personation by means of any communication device or computer resource → imprisonment up to 3 years **and** liable to fine up to ₹1 lakh. | Cheating someone by pretending to be another person, using a phone or the internet. | Often charged with BNS 318/319. |
| BSA-23 | s.23(1): no confession made to a police officer shall be proved against an accused. s.23(2): a confession made while in police custody cannot be proved unless made in the immediate presence of a Magistrate; **proviso**: where a fact is discovered in consequence of information received from an accused in custody, so much of that information as relates distinctly to the fact discovered may be proved. | A confession to the police can't be used against the accused, but information that led police to find something can be. | **Correction:** v6 labels this card "BSA 2023". It must be "BSA §23". Add the discovery proviso as an Advanced-layer note. Reviewer must confirm the proviso placement. |
| BSA-119 | The Court **may** presume the existence of any fact it thinks likely to have happened, having regard to the common course of natural events, human conduct and business; illustration (a): a person in possession of stolen goods soon after the theft may be presumed to be the thief or to have received them knowingly, unless they can account for the possession. | If someone is found with stolen goods soon after a theft, the court **may** — not must — infer they stole it or knew it was stolen, unless they explain it. | **Wording fix:** v6 says "the court may presume…", which is correct; keep "may" and add "not must". It is a rebuttable, discretionary presumption, not proof. |
| BSA-146 | 146(1) defines a leading question. 146(2): leading questions must not, **if objected to by the adverse party**, be asked in examination-in-chief or re-examination, except with the Court's permission. 146(3): the Court **shall** permit them on introductory, undisputed or already sufficiently proved matters. 146(4): they may be asked in cross-examination. | A question that suggests its own answer. Not allowed in the first questioning if the other side objects; allowed in cross. | The objection mechanic must apply 146(2) only on objection; the engine must not auto-forbid. 146(3) exceptions apply to introductory questions (name, occupation). |
| BNSS-193 | Police report on completion of investigation, forwarded to the Magistrate empowered to take cognizance (the "chargesheet"). | The police's final report to the court after investigation. | Use for the FILING phase. |
| BNSS-262 | Discharge in warrant cases instituted on a police report; discharge application within 60 days from the supply of documents under s.230. | Before trial, the accused can ask to be let off if there's no case. | Optional step (Standard and Expert). |
| BNSS-263 | Framing of charge in warrant cases on a police report: if there is ground for presuming the accused committed the offence, the Magistrate shall frame a written charge within 60 days of the first hearing on charge; the charge is read and explained, and the accused is asked to plead guilty or claim trial. | The judge decides there is enough material for a trial. This is **not** a finding of guilt. | CHARGE_STAGE and PLEA. Simplification label: "In real courts this can take several hearings." |
| BNS-106-1 | Causing death by a rash or negligent act not amounting to culpable homicide → up to 5 years and fine. | Causing a death by carelessness, without meaning to kill. | Built-in level 2. |
| BNS-281 | Rash driving or riding on a public way so as to endanger human life → up to 6 months, or fine up to ₹1,000, or both. | Driving so carelessly that it puts lives in danger. | |
| BNS-125 | Act endangering life or personal safety; (a) causing hurt, (b) causing grievous hurt → (b) up to 3 years, or fine up to ₹10,000, or both. | A rash act that puts life in danger and causes injury. | Reviewer: confirm the (a)/(b) amounts. |
| MVA-185 | Driving by a drunken person (over 30 mg alcohol per 100 ml blood); first offence → up to 6 months and/or fine up to ₹10,000 (as amended 2019). | Driving with more alcohol in your blood than the law allows. | Special law; confirm the amended figures. |
| BURDEN | **Simplification + principle.** Prosecution must prove guilt beyond reasonable doubt; the accused is presumed innocent. (BSA ss.104–106 deal with burden of proof generally; s.106 places the burden of facts especially within a person's knowledge on that person.) | The prosecution has to prove guilt. The accused does not have to prove innocence. | Status `simplification`. Do not cite a single section as "the" source of "beyond reasonable doubt"; it is a judicial standard. |
| RECORD | **Simplification.** The court decides only on evidence properly brought on record. | The judge can only use what was properly shown in court. | `simplification`. |

## Objection grounds (game mapping)
| Ground | Status | Basis shown |
|---|---|---|
| Leading (chief/re-exam) | REAL LAW | BSA §146(2)–(3) |
| Irrelevant | REAL LAW | Relevancy provisions of the BSA. Reviewer: add exact section refs (questions, and the Court's power to disallow) before marking verified. |
| Insulting / annoying / scandalous | needs_review | BSA provisions on indecent, scandalous and insulting questions. Reviewer to cite exact sections. |
| Argumentative, Assumes facts, Repetitive, Speculative | GAME SIMPLIFICATION | "In real Indian courts, the judge controls questioning under general powers; these labels are teaching shorthand." |

## Corrections to v6 `adalat-cases.js`
1. Level 1, law card `sec:'BSA 2023'` (confession) → `BSA §23`, with the discovery proviso added to Advanced.
2. Level 1, `BSA s.119` card → add "may (not must)" and "unless they can explain it"; kind = presumption.
3. Level 1, the `Basic rule` cards → status `simplification`, with an "In real courts…" line.
4. Level 2, `BNS 125(b)` and `MV Act s.185` → status `needs_review` until confirmed on India Code.
5. Level 3, `IT Act s.66C/66D` → punishment text "up to 3 years **and** liable to fine up to ₹1 lakh" (v6 says "and fine up to ₹1 lakh" for 66C; keep "liable to").
6. All verdict strings ("Guilty — BNS 318(4) & IT Act 66D") → reference outcome `lawRefs` ids, rendered from the library.
7. AI generator → remove the free-text "Only use section numbers you are confident are correct" instruction. Pass the allowed id list and reject unknown ids.
8. AI types "Property dispute", "Divorce / family" and "Consumer complaint" → remove from the criminal generator (ARCHITECTURE §4).

## Hindi
- Hindi content is written, not machine-translated. Every concept has a simple Hindi explanation, not just the term.
- Example: "उचित संदेह — अगर सबूत देखकर एक समझदार व्यक्ति के मन में असली शक बचता है कि अभियुक्त ने अपराध किया या नहीं, तो उसे दोषी नहीं ठहराया जाता।"
- Keep section ids in Latin script: "BNS §303", "BSA §23".
