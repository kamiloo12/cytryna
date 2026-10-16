/* Silnik odmiany holenderskich czasowników + wyjaśnienia + błędne odpowiedzi do quizu */
(function (global) {
  'use strict';

  const D = global.NLData;
  const VOWELS = 'aeiouy';
  const KOFSCHIP = ['t', 'k', 'f', 's', 'p', 'x'];
  const INSEP = ['ver', 'ont', 'her', 'be', 'ge', 'er'];
  const SEP = ['terug', 'samen', 'thuis', 'binnen', 'buiten', 'langs', 'schoon', 'klaar', 'kapot',
    'mee', 'weg', 'door', 'voor', 'aan', 'uit', 'toe', 'bij', 'neer', 'open', 'dicht', 'vast', 'los',
    'na', 'op', 'af', 'in', 'om'];
  const SEP_FREE = ['terug', 'samen', 'thuis', 'binnen', 'buiten', 'langs', 'schoon', 'klaar',
    'mee', 'weg', 'aan', 'uit', 'toe', 'neer', 'op', 'af'];

  const AUX = {
    h: { inf: 'hebben', pres: ['heb', 'hebt', 'heeft', 'hebben', 'hebben', 'hebben'] },
    z: { inf: 'zijn', pres: ['ben', 'bent', 'is', 'zijn', 'zijn', 'zijn'] }
  };
  const GAAN = ['ga', 'gaat', 'gaat', 'gaan', 'gaan', 'gaan'];
  const PKEY = ['ik', 'jij', 'hij', 'pl', 'pl', 'pl'];

  /* ---------- słowniki ---------- */
  const IRR = {};
  D.IRREGULAR_RAW.trim().split('\n').forEach(function (line) {
    const p = line.split('|');
    IRR[p[0]] = { sg: p[1], pl: p[2], pp: p[3] === '-' ? null : p[3], aux: p[4], tr: p[5] };
  });
  const TOP = {};
  D.TOP_VERBS.forEach(function (v) { TOP[v.inf] = v; });
  const SCHWA = {};
  D.SCHWA_EREN.forEach(function (w) { SCHWA[w] = true; });

  function isVowel(c) { return !!c && VOWELS.indexOf(c) !== -1; }
  function hasVowel(s) { return /[aeiouyëïéè]/.test(s); }
  function known(inf) { return !!(IRR[inf] || TOP[inf] || D.REGULAR_EXTRA[inf]); }
  function translation(inf) {
    if (TOP[inf]) return TOP[inf].pl;
    if (D.REGULAR_EXTRA[inf]) return D.REGULAR_EXTRA[inf];
    if (IRR[inf]) return IRR[inf].tr;
    return '';
  }

  /* przedrostek nierozdzielny (be-, ver-, ...) */
  function insepPrefix(inf) {
    for (let i = 0; i < INSEP.length; i++) {
      const p = INSEP[i];
      if (inf.indexOf(p) !== 0) continue;
      const rest = inf.slice(p.length);
      const restStem = rest.replace(/e?n$/, '');
      if (rest.length < 3 || !hasVowel(restStem)) continue;
      if ((p === 'be' || p === 'ge') && /^[eiuë]/.test(rest)) continue;
      if (p === 'er' && isVowel(rest[0])) continue;
      return p;
    }
    return '';
  }

  /* przedrostek rozdzielny (op-, aan-, ...) */
  function sepPrefix(inf) {
    for (let i = 0; i < SEP.length; i++) {
      const p = SEP[i];
      if (inf.indexOf(p) !== 0) continue;
      const rest = inf.slice(p.length);
      if (rest.length < 3) continue;
      if (known(rest)) return p;
      if (SEP_FREE.indexOf(p) !== -1 && rest.length >= 4 && /en$/.test(rest) &&
          !isVowel(rest[0]) && hasVowel(rest.slice(0, -2)) && !insepPrefix(inf)) return p;
    }
    return '';
  }

  /* temat (stam) + notatki, co się zmieniło */
  function makeStem(inf) {
    const notes = [];
    let raw;
    if (/iëren$/.test(inf)) return { stem: inf.slice(0, -5) + 'ieer', raw: inf.slice(0, -5) + 'ieer', notes: ['eer'] };
    if (/eëren$/.test(inf)) return { stem: inf.slice(0, -5) + 'eëer', raw: inf.slice(0, -5) + 'eëer', notes: ['eer'] };
    if (/(doen|zien)$/.test(inf)) raw = inf.slice(0, -1);
    else if (/[^aeiou]aan$/.test(inf)) raw = inf.slice(0, -2);
    else if (/en$/.test(inf)) raw = inf.slice(0, -2);
    else raw = inf;
    if (/[^aeiou]a$/.test(raw)) return { stem: raw, raw: raw, notes: ['aa'] };

    let stem = raw;
    const n = stem.length;
    const last = stem[n - 1];
    if (n >= 2 && last === stem[n - 2] && !isVowel(last)) {
      stem = stem.slice(0, -1);
      notes.push('double');
    } else if (n >= 2 && !isVowel(last) && last !== 'w' && last !== 'j' && isVowel(stem[n - 2]) &&
               stem[n - 2] !== 'i' && stem[n - 2] !== 'y' && !isVowel(stem[n - 3])) {
      const v = stem[n - 2];
      let schwa = false;
      if (v === 'e') {
        if (SCHWA[inf]) schwa = true;
        else if (/[lnm]/.test(last)) {
          const pre = insepPrefix(inf);
          const before = stem.slice(pre.length, n - 2);
          if (hasVowel(before)) schwa = true;
        }
      }
      if (!schwa) {
        stem = stem.slice(0, n - 1) + v + last;
        notes.push('long');
      }
    }
    if (/v$/.test(stem)) { stem = stem.slice(0, -1) + 'f'; notes.push('vf'); }
    else if (/z$/.test(stem)) { stem = stem.slice(0, -1) + 's'; notes.push('zs'); }
    return { stem: stem, raw: raw, notes: notes };
  }

  function kofschip(raw) {
    return /ch$/.test(raw) || KOFSCHIP.indexOf(raw[raw.length - 1]) !== -1;
  }

  function addGe(stem) {
    if (/^e/.test(stem)) return 'geë' + stem.slice(1);
    if (/^i/.test(stem)) return 'geï' + stem.slice(1);
    return 'ge' + stem;
  }

  function regularForms(inf, s, opts) {
    const kof = kofschip(s.raw);
    const end = kof ? 't' : 'd';
    const ppEnd = /[td]$/.test(s.stem) ? '' : end;
    const pre = opts && opts.noGe ? '' : (insepPrefix(inf) ? '' : 'ge');
    return {
      kof: kof,
      sg: s.stem + (kof ? 'te' : 'de'),
      pl: s.stem + (kof ? 'ten' : 'den'),
      pp: (pre ? addGe(s.stem) : s.stem) + ppEnd,
      flipSg: s.stem + (kof ? 'de' : 'te'),
      flipPl: s.stem + (kof ? 'den' : 'ten'),
      flipPp: (pre ? addGe(s.stem) : s.stem) + (kof ? 'd' : 't'),
      togglePp: (pre ? s.stem : addGe(s.stem)) + ppEnd
    };
  }

  function presentFrom(inf, s, override) {
    if (override) return [override.ik, override.jij, override.hij, override.pl, override.pl, override.pl];
    const t = /t$/.test(s.stem) ? s.stem : (/[^aeiou]a$/.test(s.stem) ? s.stem + 'at' : s.stem + 't');
    return [s.stem, t, t, inf, inf, inf];
  }

  /* ---------- analiza czasownika ---------- */
  function analyze(input) {
    const inf = String(input || '').trim().toLowerCase().replace(/\s+/g, '');
    if (!inf) return null;

    const sep = (!IRR[inf] && !TOP[inf]) ? sepPrefix(inf) : '';
    const base = sep ? inf.slice(sep.length) : inf;
    const info = buildSimple(base);
    info.sep = sep;
    info.inf = inf;
    info.base = base;
    info.tr = translation(inf) || (sep ? '' : info.tr);
    const fullAux = D.REGULAR_AUX[inf];
    if (fullAux) info.aux = fullAux;
    else if (sep && /^(staan|komen|gaan|blijven|vallen|groeien|lopen|rijden|vliegen|springen)$/.test(base)) {
      info.aux = /^(lopen|rijden|vliegen|springen)$/.test(base) ? 'hz' : 'z';
      if (base === 'staan') info.aux = 'z';
    }
    if (sep) info.pp = sep + info.pp;
    info.known = known(inf) || (!!sep && known(base));
    return info;
  }

  function buildSimple(inf) {
    const top = TOP[inf];
    const s = makeStem(inf);
    let irr = IRR[inf];
    let derivedFrom = '';
    const pre = insepPrefix(inf);
    let presOverride = top && top.pres;

    if (!irr && pre) {
      const b = inf.slice(pre.length);
      if (IRR[b] && IRR[b].pp) {
        const bi = IRR[b];
        let pp = bi.pp;
        if (/^ge/.test(pp) && !insepPrefix(b)) pp = pp.slice(2);
        irr = { sg: pre + bi.sg, pl: pre + bi.pl, pp: pre + pp, aux: bi.aux, tr: '' };
        derivedFrom = b;
        if (TOP[b] && TOP[b].pres) {
          const o = TOP[b].pres;
          presOverride = { ik: pre + o.ik, jij: pre + o.jij, hij: pre + o.hij, pl: inf };
        }
      }
    }

    const reg = regularForms(inf, s);
    const info = {
      inf: inf,
      tr: translation(inf),
      stem: s.stem,
      raw: s.raw,
      notes: s.notes,
      prefix: pre,
      present: presentFrom(inf, s, presOverride),
      presIrregular: !!presOverride,
      reg: reg,
      alt: (top && top.alt) || {},
      ovtAlt: (top && top.ovtAlt) || []
    };
    if (irr) {
      info.irregular = true;
      info.derivedFrom = derivedFrom;
      info.sg = irr.sg;
      info.pl = irr.pl;
      info.pp = irr.pp || '';
      info.aux = irr.aux;
      info.ovtIrregular = irr.sg !== reg.sg;
      info.ppIrregular = irr.pp !== reg.pp;
      if (!info.tr && derivedFrom) info.tr = '';
    } else {
      info.irregular = false;
      info.sg = reg.sg;
      info.pl = reg.pl;
      info.pp = reg.pp;
      info.aux = D.REGULAR_AUX[inf] || 'h';
      info.ovtIrregular = false;
      info.ppIrregular = false;
    }
    return info;
  }

  /* ---------- formy ---------- */
  function withSep(form, info) { return info.sep ? form + ' ' + info.sep : form; }

  function form(info, tense, pi) {
    const sg = pi < 3;
    switch (tense) {
      case 'ott': return withSep(info.present[pi], info);
      case 'ovt': return withSep(sg ? info.sg : info.pl, info);
      case 'vtt': return AUX[info.aux[0]].pres[pi] + ' ' + info.pp;
      case 'tt': return GAAN[pi] + ' ' + info.inf;
    }
    return '';
  }

  /* wszystkie poprawne warianty (np. jij kan / jij kunt, heb/ben gelopen) */
  function accepted(info, tense, pi) {
    const out = [form(info, tense, pi)];
    const key = PKEY[pi] === 'pl' ? null : PKEY[pi];
    if (tense === 'ott' && key && info.alt[key]) info.alt[key].forEach(function (f) { out.push(withSep(f, info)); });
    if (tense === 'ovt' && pi < 3) info.ovtAlt.forEach(function (f) { out.push(withSep(f, info)); });
    if (tense === 'vtt' && info.aux.length === 2) out.push(AUX[info.aux[1]].pres[pi] + ' ' + info.pp);
    return out;
  }

  /* ---------- błędne odpowiedzi ---------- */
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function distractors(info, tense, pi, count) {
    count = count || 3;
    const ok = accepted(info, tense, pi);
    const sg = pi < 3;
    const s = info.stem;
    const r = info.reg;
    const sp = function (f) { return withSep(f, info); };
    const c1 = [];
    const c2 = [];

    if (tense === 'ott') {
      info.present.forEach(function (f) { c1.push(sp(f)); });
      if (info.presIrregular) {
        const rs = makeStem(info.base || info.inf).stem;
        if (rs !== info.base && rs !== info.inf) c2.push(sp(rs), sp(rs + 't'));
      } else {
        c1.push(sp(s), sp(s + 't'), sp(info.base || info.inf));
        if (/d$/.test(s)) c1.push(sp(s.slice(0, -1) + 't'), sp(s + 'dt'));
        else if (!/t$/.test(s)) c2.push(sp(s + 'd'));
        if (info.notes.indexOf('long') !== -1) {
          const short = info.raw.replace(/[vz]$/, function (m) { return m === 'v' ? 'f' : 's'; });
          c1.push(sp(short), sp(short + 't'));
        }
        if (info.notes.indexOf('vf') !== -1 || info.notes.indexOf('zs') !== -1) {
          const un = s.slice(0, -1) + (info.notes.indexOf('vf') !== -1 ? 'v' : 'z');
          c1.push(sp(un), sp(un + 't'));
        }
        if (info.notes.indexOf('double') !== -1) c1.push(sp(info.raw), sp(info.raw + 't'));
      }
    } else if (tense === 'ovt') {
      c1.push(sp(sg ? info.pl : info.sg));
      if (info.ovtIrregular) c1.push(sp(sg ? r.sg : r.pl), sp(sg ? r.pl : r.sg));
      else c1.push(sp(sg ? r.flipSg : r.flipPl), sp(sg ? r.flipPl : r.flipSg));
      c2.push(sp(info.present[pi]), sp(r.flipSg), sp(r.flipPl));
    } else if (tense === 'vtt') {
      const a = info.aux[0];
      const other = a === 'h' ? 'z' : 'h';
      const pre = info.sep || '';
      const base = info.base || info.inf;
      const fix = function (p) { return pre && p.indexOf(pre) !== 0 ? pre + p : p; };
      const wrongPP = info.ppIrregular
        ? [fix(regularForms(base, makeStem(base)).pp)]
        : [fix(r.flipPp), fix(r.togglePp)];
      wrongPP.forEach(function (p) { c1.push(AUX[a].pres[pi] + ' ' + p); });
      c1.push(AUX[other].pres[pi] + ' ' + info.pp);
      AUX[a].pres.forEach(function (x) { c1.push(x + ' ' + info.pp); });
      c2.push(AUX[a].pres[pi] + ' ' + info.inf, AUX[other].pres[pi] + ' ' + wrongPP[0]);
    } else if (tense === 'tt') {
      GAAN.forEach(function (g) { c1.push(g + ' ' + info.inf); });
      c1.push(GAAN[pi] + ' ' + info.present[pi], GAAN[pi] + ' ' + info.pp);
      c2.push(GAAN[pi] + ' te ' + info.inf, 'gaan ' + info.present[pi]);
    }

    const seen = {};
    ok.forEach(function (x) { seen[x] = true; });
    const clean = function (arr) {
      return shuffle(arr.filter(function (x) {
        if (!x || seen[x]) return false;
        seen[x] = true;
        return true;
      }));
    };
    let c = clean(c1).concat(clean(c2));
    if (c.length < count) {
      c = c.concat(clean(['ott', 'ovt', 'vtt', 'tt'].filter(function (t) { return t !== tense; })
        .map(function (t) { return form(info, t, pi); })));
    }
    return shuffle(c.slice(0, count));
  }

  /* ---------- wyjaśnienia ---------- */
  function q(x) { return '<b>' + x + '</b>'; }

  function stemExplain(info) {
    const inf = info.base || info.inf;
    const parts = ['Temat: ' + inf + ' → ' + q(info.stem) + '.'];
    if (info.notes.indexOf('long') !== -1) parts.push('Długą samogłoskę piszemy w temacie podwójnie.');
    if (info.notes.indexOf('double') !== -1) parts.push('Podwójną spółgłoskę skracamy do jednej.');
    if (info.notes.indexOf('vf') !== -1) parts.push('Na końcu tematu v zmienia się w f.');
    if (info.notes.indexOf('zs') !== -1) parts.push('Na końcu tematu z zmienia się w s.');
    return parts.join(' ');
  }

  function sepExplain(info) {
    return info.sep ? ' To czasownik rozdzielny: ' + q(info.sep) + ' odrywa się i idzie na koniec zdania.' : '';
  }

  function ppExplain(info) {
    if (info.ppIrregular) {
      return 'Imiesłów ' + q(info.pp) + ' jest nieregularny – trzeba go zapamiętać' +
        (info.derivedFrom ? ' (tak jak w ' + info.derivedFrom + ')' : '') + '.';
    }
    const r = info.reg;
    let t = 'Imiesłów regularny: ';
    if (info.prefix) t += 'czasownik zaczyna się od ' + q(info.prefix + '-') + ', więc nie dodajemy ge-; ';
    else t += q('ge') + ' + temat ' + info.stem + ' + ';
    if (/[td]$/.test(info.stem)) t += 'temat kończy się już na -' + info.stem.slice(-1) + ', więc nic nie dodajemy';
    else t += (r.kof ? q('t') + ' (litera „' + lastLetter(info.raw) + '” jest w ’t kofschip)'
                     : q('d') + ' (litery „' + lastLetter(info.raw) + '” nie ma w ’t kofschip)');
    return t + ' → ' + q(info.pp) + '.';
  }

  function lastLetter(raw) { return /ch$/.test(raw) ? 'ch' : raw.slice(-1); }

  function auxExplain(info) {
    const a = info.aux;
    const inf = info.inf;
    if (a === 'h') return 'Ten czasownik łączy się z ' + q('hebben') + ' – tak jak większość czasowników.';
    if (a === 'z') {
      if (inf === 'zijn' || inf === 'blijven') return q(inf) + ' zawsze łączy się z ' + q('zijn') + '.';
      return 'Ten czasownik oznacza ruch do celu albo zmianę stanu, dlatego łączy się z ' + q('zijn') + '.';
    }
    if (a === 'hz') return 'Zwykle używamy ' + q('hebben') + '. Gdy mówimy, dokąd ktoś dotarł (np. „naar huis”), używamy ' + q('zijn') + '.';
    return 'Zwykle używamy ' + q('zijn') + ' (zapomnieć coś z głowy). Gdy zostawiamy coś w jakimś miejscu, można też użyć ' + q('hebben') + '.';
  }

  const PNAME = ['ik', 'jij', 'hij/zij', 'wij', 'jullie', 'zij'];

  function explain(info, tense, pi) {
    const sg = pi < 3;
    const who = q(PNAME[pi]);
    const f = form(info, tense, pi);
    const main = info.present[pi];

    if (tense === 'ott') {
      if (info.presIrregular && !(pi >= 3)) {
        return q(info.inf) + ' jest nieregularny w czasie teraźniejszym. Dla ' + who + ' forma to ' + q(f) + ' – trzeba ją zapamiętać.' + sepExplain(info);
      }
      if (!sg) return 'W liczbie mnogiej (wij, jullie, zij) forma jest taka sama jak bezokolicznik: ' + q(main) + '.' + sepExplain(info);
      if (pi === 0) return 'Dla ' + who + ' używamy samego tematu. ' + stemExplain(info) + sepExplain(info);
      let t = 'Dla ' + who + ' dodajemy do tematu -t. ' + stemExplain(info) + ' ';
      if (/t$/.test(info.stem)) t += 'Temat kończy się już na -t, więc nie dodajemy drugiego t → ' + q(main) + '.';
      else if (/d$/.test(info.stem)) t += 'Temat kończy się na -d, ale i tak dodajemy -t → ' + q(main) + ' (słychać t, piszemy dt).';
      else t += info.stem + ' + t = ' + q(main) + '.';
      return t + sepExplain(info);
    }

    if (tense === 'ovt') {
      const num = sg ? 'liczby pojedynczej (ik, jij, hij)' : 'liczby mnogiej (wij, jullie, zij)';
      if (info.ovtIrregular) {
        return q(info.inf) + ' jest nieregularny: w czasie przeszłym zmienia się cały wyraz – ' + q(info.sg) + ' / ' + q(info.pl) +
          '. Dla ' + num + ': ' + q(sg ? info.sg : info.pl) + '.' + sepExplain(info);
      }
      const r = info.reg;
      return stemExplain(info) + ' Ostatnia litera tematu w bezokoliczniku to „' + lastLetter(info.raw) + '”. ' +
        (r.kof ? 'Jest w ’t kofschip → dodajemy ' + q(sg ? '-te' : '-ten') : 'Nie ma jej w ’t kofschip → dodajemy ' + q(sg ? '-de' : '-den')) +
        ' (forma ' + num + ') → ' + q(sg ? info.sg : info.pl) + '.' + sepExplain(info);
    }

    if (tense === 'vtt') {
      const a = AUX[info.aux[0]];
      return 'Czas przeszły dokonany = ' + q(a.inf) + ' w czasie teraźniejszym + imiesłów. ' + auxExplain(info) +
        ' Dla ' + who + ': ' + q(a.pres[pi]) + '. ' + ppExplain(info);
    }

    if (tense === 'tt') {
      return 'Czas przyszły = ' + q('gaan') + ' + bezokolicznik. ' + q('gaan') + ' odmieniamy jak w czasie teraźniejszym: dla ' + who +
        ' → ' + q(GAAN[pi]) + '. Drugi czasownik się nie zmienia: ' + q(info.inf) + '.';
    }
    return '';
  }

  /* ---------- odwrotne wyszukiwanie: "liep" → lopen ---------- */
  let FORM_INDEX = null;
  function findInfinitive(word) {
    word = String(word || '').trim().toLowerCase();
    if (!FORM_INDEX) {
      FORM_INDEX = {};
      const all = {};
      Object.keys(IRR).forEach(function (k) { all[k] = 1; });
      Object.keys(TOP).forEach(function (k) { all[k] = 1; });
      Object.keys(D.REGULAR_EXTRA).forEach(function (k) { all[k] = 1; });
      Object.keys(all).forEach(function (inf) {
        if (inf === 'zullen') return;
        const info = analyze(inf);
        const forms = info.present.concat([info.sg, info.pl, info.pp]);
        forms.forEach(function (f) {
          f = f.split(' ')[0];
          if (f && f !== inf && !FORM_INDEX[f]) FORM_INDEX[f] = inf;
        });
      });
    }
    return FORM_INDEX[word] || null;
  }

  function looksLikeInfinitive(word) {
    word = String(word || '').trim().toLowerCase();
    return /^[a-zëïéèöü]+$/.test(word) && (/en$/.test(word) || /^(zijn|gaan|staan|slaan|zien|doen)$/.test(word) ||
      /(gaan|staan|slaan|zien|doen)$/.test(word)) && word.length >= 3;
  }

  global.NL = {
    PERSONS: D.PERSONS,
    TENSES: D.TENSES,
    TOP_VERBS: D.TOP_VERBS,
    AUX: AUX,
    GAAN: GAAN,
    analyze: analyze,
    form: form,
    accepted: accepted,
    distractors: distractors,
    explain: explain,
    findInfinitive: findInfinitive,
    looksLikeInfinitive: looksLikeInfinitive,
    auxExplain: auxExplain,
    isKnown: known,
    shuffle: shuffle
  };
})(typeof window !== 'undefined' ? window : globalThis);
