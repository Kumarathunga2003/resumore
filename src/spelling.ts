import { englishWords } from "./englishWords.ts";

const careerWords =
  "achievement achievements administration administrator analysis analyst analytics application applications architecture assessment automation backend budgeting business collaboration communication computer configuration coordination customer cybersecurity database debugging deployment design developer development documentation education engineering environment experience expertise financial framework frontend implementation improvement infrastructure integration internship leadership maintenance management marketing mobile monitoring networking organisation organisation's organisational organization optimization performance portfolio presentation production professional programming project qualification quality recruitment reliability research resource responsibility responsibilities scheduling security software stakeholder strategy successful successfully support teamwork technical technician technology testing training troubleshooting university usability validation visualization volunteer workflow "
    .trim()
    .split(/\s+/);
const skills =
  "Python JavaScript TypeScript React Flutter Kotlin PostgreSQL MySQL MongoDB Docker Kubernetes GitHub GitLab Linux Excel Tableau Firebase Django Node.js PowerPoint WordPress Android Figma DevOps SQL HTML CSS".split(
    " ",
  );
const vocabulary = new Set(englishWords.split(" "));
const preferred = new Map(
  [...careerWords, ...skills].map((w) => [w.toLowerCase(), w]),
);
const accepted = new Set(
  "theatre theatres metre metres litre litres neighbour neighbours labour behaviour behaviours colour colours favourite honours behaviour analyse analysed analysing organise organised organising standardise standardised specialise specialised specialising optimisation modelling programme programmes centre centres licence licences travelled travelling practised visualisation visualisations customisation teamwork coursework github linkedin backend frontend fullstack cybersecurity kubernetes".split(
    " ",
  ),
);
const cache = new Map<string, string | null>();

function nearby(word: string) {
  const forms = new Set<string>();
  for (let i = 0; i <= word.length; i++) {
    const a = word.slice(0, i),
      b = word.slice(i);
    if (b) forms.add(a + b.slice(1));
    if (b.length > 1) forms.add(a + b[1] + b[0] + b.slice(2));
    for (const ch of "abcdefghijklmnopqrstuvwxyz") {
      forms.add(a + ch + b);
      if (b) forms.add(a + ch + b.slice(1));
    }
  }
  return forms;
}

export function needsSpellingReview(token: string) {
  return /^[a-z]{2,}$/i.test(token) && token !== token.toUpperCase() && !vocabulary.has(token.toLowerCase())
    && !preferred.has(token.toLowerCase()) && !accepted.has(token.toLowerCase());
}

export function spellingHint(token: string) {
  if (!/^[A-Za-z]{5,24}$/.test(token) || token === token.toUpperCase()) return;
  const word = token.toLowerCase();
  if (vocabulary.has(word) || preferred.has(word) || accepted.has(word)) return;
  if (cache.has(token)) return cache.get(token) || undefined;
  const near = nearby(word);
  const career = [...near].filter((w) => preferred.has(w));
  const general =
    career.length || token !== word
      ? []
      : [...near].filter((w) => vocabulary.has(w));
  let hint =
    career.length === 1
      ? preferred.get(career[0])
      : general.length === 1
        ? general[0]
        : undefined;
  if (hint && token[0] !== word[0] && hint === hint.toLowerCase())
    hint = hint[0].toUpperCase() + hint.slice(1);
  if (cache.size >= 2000) cache.clear();
  cache.set(token, hint ?? null);
  return hint;
}
