// Uruchom: node tests/conjugate.test.js
require('../js/data.js');
require('../js/conjugate.js');
const NL = globalThis.NL;
const assert = require('assert');

const cases = [
  ['werken', 'ott', 1, 'werkt'], ['maken', 'ott', 0, 'maak'], ['zijn', 'ott', 2, 'is'],
  ['gaan', 'ott', 1, 'gaat'], ['worden', 'ott', 2, 'wordt'], ['zitten', 'ott', 2, 'zit'],
  ['leven', 'ovt', 0, 'leefde'], ['fietsen', 'ovt', 3, 'fietsten'], ['lopen', 'ovt', 0, 'liep'],
  ['spelen', 'vtt', 0, 'heb gespeeld'], ['gaan', 'vtt', 1, 'bent gegaan'], ['betalen', 'vtt', 2, 'heeft betaald'],
  ['antwoorden', 'vtt', 3, 'hebben geantwoord'], ['opstaan', 'vtt', 0, 'ben opgestaan'],
  ['opbellen', 'ott', 0, 'bel op'], ['verkopen', 'ovt', 0, 'verkocht'], ['luisteren', 'ott', 0, 'luister'],
  ['studeren', 'ott', 0, 'studeer'], ['werken', 'tt', 2, 'gaat werken']
];
cases.forEach(([v, t, p, want]) => assert.strictEqual(NL.form(NL.analyze(v), t, p), want, `${v} ${t} ${p}`));

NL.TOP_VERBS.forEach(v => {
  const info = NL.analyze(v.inf);
  NL.TENSES.forEach(t => {
    for (let p = 0; p < 6; p++) {
      const d = NL.distractors(info, t.id, p, 3);
      assert.strictEqual(d.length, 3, `${v.inf} ${t.id} ${p}: za mało błędnych odpowiedzi`);
      NL.accepted(info, t.id, p).forEach(ok => assert.ok(!d.includes(ok), `${v.inf} ${t.id} ${p}: poprawna forma wśród błędnych`));
      assert.ok(NL.explain(info, t.id, p).length > 20);
    }
  });
});
assert.strictEqual(NL.TOP_VERBS.length, 70);
console.log('OK – wszystkie testy przeszły');
