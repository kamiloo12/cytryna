/* Widoki aplikacji: czasy, teoria, quiz, podsumowanie, sprawdzanie czasownika */
(function () {
  'use strict';

  const app = document.getElementById('app');
  const P = NL.PERSONS;
  const TENSE = {};
  NL.TENSES.forEach(function (t, i) { t.index = i + 1; TENSE[t.id] = t; });

  let quiz = null;
  let lastResult = null;
  let lookupState = { verb: '', person: 'all' };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function personLabel(pi) { return P[pi].nl; }

  /* ---------- router ---------- */
  function route() {
    const h = location.hash.replace(/^#\/?/, '');
    const parts = h.split('/');
    let nav = 'home';
    if (parts[0] === 'czas' && TENSE[parts[1]]) renderTense(TENSE[parts[1]]);
    else if (parts[0] === 'quiz' && quiz) renderQuestion();
    else if (parts[0] === 'wynik' && lastResult) renderSummary();
    else if (parts[0] === 'sprawdz') { nav = 'lookup'; renderLookup(); }
    else renderHome();
    document.querySelectorAll('[data-nav]').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-nav') === nav);
    });
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  /* ---------- strona główna ---------- */
  function renderHome() {
    document.title = 'Cytryna · holenderskie czasowniki';
    const cards = NL.TENSES.map(function (t) {
      return '<a class="card tense-card t-' + t.id + '" href="#/czas/' + t.id + '">' +
        '<span class="num">' + t.index + '</span>' +
        '<h3>' + t.pl + '</h3>' +
        '<span class="nl">' + t.nl + '</span>' +
        '<p>' + t.when + '</p>' +
        '<span class="ex">' + exampleOf(t.id) + '</span>' +
        '</a>';
    }).join('');
    app.innerHTML =
      '<section class="hero">' +
        '<span class="eyebrow">Hallo!</span>' +
        '<h1>Odmieniamy holenderskie czasowniki</h1>' +
        '<p class="lead">Wybierz czas. Najpierw przeczytaj krótkie wyjaśnienie, a potem poćwicz na 70 najczęstszych czasownikach.</p>' +
      '</section>' +
      '<div class="grid">' + cards + '</div>' +
      '<a class="card lookup-card" href="#/sprawdz">' +
        '<div><h3>Sprawdź czasownik</h3><p>Wpisz dowolny czasownik, także nieregularny, wybierz osobę i zobacz poprawną formę we wszystkich czasach.</p></div>' +
        '<span class="arrow" aria-hidden="true">→</span>' +
      '</a>';
  }

  function exampleOf(tid) {
    const i = NL.analyze('spelen');
    return 'ik ' + NL.form(i, tid, 0) + ' · wij ' + NL.form(i, tid, 3);
  }

  /* ---------- strona czasu ---------- */
  let quizLength = 20;

  function conjTable(inf, tid) {
    const i = NL.analyze(inf);
    const rows = P.map(function (p, pi) {
      return '<tr><td>' + p.nl + '</td><td>' + esc(NL.form(i, tid, pi)) + '</td></tr>';
    }).join('');
    return '<div class="card"><table class="conj"><caption>' + inf + '<small>' + esc(i.tr) + '</small></caption>' + rows + '</table></div>';
  }

  function renderTense(t) {
    document.title = t.pl + ' · Cytryna';
    const kof = (t.id === 'ovt' || t.id === 'vtt')
      ? '<div class="section card"><h2>’t kofschip</h2><p class="muted" style="margin:0">Jeśli ostatnia litera tematu jest w tym słowie, wybieramy <b>t</b>. Jeśli nie – <b>d</b>.</p>' +
        '<div class="kof">' + "'t kofschip".split('').map(function (c) {
          if (c === ' ') return '<span class="space"></span>';
          return '<span class="' + (/[tkfspch]/.test(c) ? 'hit' : '') + '">' + c + '</span>';
        }).join('') + '</div><p class="hint">t · k · f · s · ch · p</p></div>'
      : '';

    app.innerHTML =
      '<div class="t-' + t.id + '">' +
      '<a class="btn btn-ghost back" href="#/">← Wszystkie czasy</a>' +
      '<section class="tense-head">' +
        '<span class="eyebrow">Czas ' + t.index + ' z ' + NL.TENSES.length + ' · ' + t.nl + '</span>' +
        '<h1>' + t.pl + '</h1>' +
        '<p class="when">' + t.when + '</p>' +
        '<div class="example">' + t.example + '</div>' +
        '<span class="formula">' + t.formula + '</span>' +
      '</section>' +
      '<div class="section card"><h2>Jak to zrobić?</h2><ol class="steps">' +
        t.steps.map(function (s) { return '<li><span>' + s + '</span></li>'; }).join('') +
      '</ol><div class="tip">' + t.tip + '</div></div>' +
      kof +
      '<div class="section"><h2 style="margin-bottom:14px">Przykłady</h2><div class="tables">' +
        t.demo.map(function (v) { return conjTable(v, t.id); }).join('') +
      '</div></div>' +
      '<div class="section card practice"><h2>Ćwiczenie</h2>' +
        '<p>70 najczęstszych czasowników, każdy w 2 różnych osobach, w losowej kolejności. Wybierz jedną z 4 odpowiedzi. Gdy się pomylisz, możesz spróbować jeszcze raz.</p>' +
        '<div class="seg" role="group" aria-label="Liczba pytań">' +
          [[20, '20 pytań'], [40, '40 pytań'], [70, '70 pytań'], [140, 'Wszystkie (140)']].map(function (o) {
            return '<button type="button" data-len="' + o[0] + '" aria-pressed="' + (quizLength === o[0]) + '">' + o[1] + '</button>';
          }).join('') +
        '</div>' +
        '<div><button class="btn btn-accent" id="start">Zaczynamy →</button></div>' +
      '</div></div>';

    app.querySelectorAll('[data-len]').forEach(function (b) {
      b.addEventListener('click', function () {
        quizLength = Number(b.getAttribute('data-len'));
        app.querySelectorAll('[data-len]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      });
    });
    document.getElementById('start').addEventListener('click', function () { startQuiz(t.id, quizLength); });
  }

  /* ---------- quiz ---------- */
  function buildItems(tid) {
    const items = [];
    NL.TOP_VERBS.forEach(function (v) {
      const persons = NL.shuffle([0, 1, 2, 3, 4, 5]).slice(0, 2);
      persons.forEach(function (pi) { items.push({ inf: v.inf, tense: tid, pi: pi }); });
    });
    return NL.shuffle(items);
  }

  function startQuiz(tid, len, presetItems) {
    let items = presetItems ? NL.shuffle(presetItems.slice()) : buildItems(tid);
    if (!presetItems && len < items.length) {
      // przy krótszej sesji: różne czasowniki, losowa osoba
      const seen = {};
      items = items.filter(function (it) { if (seen[it.inf]) return false; seen[it.inf] = true; return true; })
        .concat(items).filter(function (it, idx, arr) { return arr.indexOf(it) === idx; }).slice(0, len);
      items = NL.shuffle(items);
    }
    quiz = { tense: tid, items: items, idx: 0, firstTry: 0, mistakes: [], wrongNow: [], locked: false };
    quiz.items.forEach(function (it) {
      const info = NL.analyze(it.inf);
      it.answer = NL.form(info, it.tense, it.pi);
      it.options = NL.shuffle([it.answer].concat(NL.distractors(info, it.tense, it.pi, 3)));
    });
    if (location.hash === '#/quiz') renderQuestion();
    else location.hash = '#/quiz';
  }

  function renderQuestion() {
    const t = TENSE[quiz.tense];
    const it = quiz.items[quiz.idx];
    const info = NL.analyze(it.inf);
    const total = quiz.items.length;
    document.title = 'Ćwiczenie · ' + t.pl;
    quiz.wrongNow = [];
    quiz.locked = false;

    app.innerHTML =
      '<div class="t-' + t.id + '">' +
      '<div class="quiz-top"><a class="btn btn-ghost" href="#/czas/' + t.id + '">✕ Zakończ</a>' +
        '<span class="counter">' + (quiz.idx + 1) + ' / ' + total + '</span></div>' +
      '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + quiz.idx + '">' +
        '<div style="width:' + (quiz.idx / total * 100) + '%"></div></div>' +
      '<div class="card question">' +
        '<div class="q-tags"><span class="tag accent">' + t.pl + '</span>' +
          '<span class="tag">' + personLabel(it.pi) + ' = ' + P[it.pi].pl + '</span></div>' +
        '<div class="q-verb">' + esc(it.inf) + '</div>' +
        '<div class="q-tr">' + esc(info.tr) + '</div>' +
        '<div class="q-sentence">' + personLabel(it.pi) + ' <span class="gap">?</span></div>' +
      '</div>' +
      '<div class="options">' +
        it.options.map(function (o, k) {
          return '<button class="opt" data-k="' + k + '">' + esc(o) + '</button>';
        }).join('') +
      '</div>' +
      '<div class="feedback" aria-live="polite"></div>' +
      '</div>';

    app.querySelectorAll('.opt').forEach(function (b) {
      b.addEventListener('click', function () { answer(b, it); });
    });
    app.focus({ preventScroll: true });
  }

  const PRAISE = ['Super!', 'Brawo!', 'Świetnie!', 'Goed zo!', 'Doskonale!', 'Tak trzymaj!', 'Heel goed!'];
  const RETRY = ['Prawie! Spróbuj jeszcze raz.', 'Jeszcze jedna próba!', 'Nie szkodzi – spróbuj ponownie.'];

  function answer(btn, it) {
    if (quiz.locked) return;
    const val = it.options[Number(btn.getAttribute('data-k'))];
    const fb = app.querySelector('.feedback');
    if (val === it.answer) {
      quiz.locked = true;
      btn.classList.add('right');
      app.querySelectorAll('.opt').forEach(function (b) { b.disabled = true; });
      app.querySelector('.gap').textContent = it.answer;
      if (quiz.wrongNow.length === 0) {
        quiz.firstTry++;
        fb.className = 'feedback good';
        fb.textContent = PRAISE[Math.floor(Math.random() * PRAISE.length)];
      } else {
        quiz.mistakes.push({ inf: it.inf, tense: it.tense, pi: it.pi, wrong: quiz.wrongNow.slice(), answer: it.answer });
        fb.className = 'feedback good';
        fb.textContent = 'Dobrze! Teraz już wiesz.';
      }
      setTimeout(next, quiz.wrongNow.length ? 1300 : 800);
    } else {
      btn.classList.add('wrong');
      btn.disabled = true;
      if (quiz.wrongNow.indexOf(val) === -1) quiz.wrongNow.push(val);
      fb.className = 'feedback bad';
      fb.textContent = RETRY[Math.floor(Math.random() * RETRY.length)];
    }
  }

  function next() {
    if (!quiz) return;
    quiz.idx++;
    if (quiz.idx >= quiz.items.length) {
      lastResult = {
        tense: quiz.tense,
        total: quiz.items.length,
        firstTry: quiz.firstTry,
        mistakes: quiz.mistakes
      };
      quiz = null;
      location.hash = '#/wynik';
    } else {
      renderQuestion();
    }
  }

  /* ---------- podsumowanie ---------- */
  function renderSummary() {
    const r = lastResult;
    const t = TENSE[r.tense];
    const pct = Math.round(r.firstTry / r.total * 100);
    const C = 2 * Math.PI * 64;
    let msg;
    if (pct === 100) msg = 'Perfekcyjnie! Jesteś mistrzem!';
    else if (pct >= 90) msg = 'Fantastycznie!';
    else if (pct >= 75) msg = 'Bardzo dobrze!';
    else if (pct >= 50) msg = 'Dobra robota – ćwicz dalej!';
    else msg = 'Dobry początek! Przeczytaj wyjaśnienie i spróbuj jeszcze raz.';
    document.title = 'Wynik ' + pct + '% · Cytryna';

    const mistakes = r.mistakes.map(function (m) {
      const info = NL.analyze(m.inf);
      return '<div class="card mistake">' +
        '<div class="mistake-top"><div class="mistake-q">' + personLabel(m.pi) + ' · ' + esc(m.inf) +
          ' <span class="muted">(' + esc(info.tr) + ')</span></div>' +
          '<span class="tag">' + P[m.pi].pl + '</span></div>' +
        '<div class="answers">' +
          m.wrong.map(function (w) { return '<span class="ans bad">' + esc(w) + '</span>'; }).join('') +
          '<span class="ans good">' + personLabel(m.pi) + ' ' + esc(m.answer) + '</span>' +
        '</div>' +
        '<div class="why">' + NL.explain(info, m.tense, m.pi) + '</div>' +
      '</div>';
    }).join('');

    app.innerHTML =
      '<div class="t-' + t.id + '">' +
      '<section class="summary-head">' +
        '<div class="ring" role="img" aria-label="Wynik ' + pct + ' procent">' +
          '<svg viewBox="0 0 150 150"><circle cx="75" cy="75" r="64" fill="none" stroke="var(--surface-2)" stroke-width="12"/>' +
          '<circle cx="75" cy="75" r="64" fill="none" stroke="var(--accent)" stroke-width="12" stroke-linecap="round" ' +
          'stroke-dasharray="' + C + '" stroke-dashoffset="' + (C * (1 - pct / 100)) + '"/></svg>' +
          '<div class="val">' + pct + '%</div></div>' +
        '<div><span class="eyebrow">' + t.pl + ' · podsumowanie</span><h1>' + msg + '</h1>' +
          '<div class="stats"><span class="stat"><b>' + r.firstTry + '</b> z ' + r.total + ' za pierwszym razem</span>' +
          '<span class="stat"><b>' + r.mistakes.length + '</b> ' + plural(r.mistakes.length) + '</span></div></div>' +
      '</section>' +
      '<div class="btn-row">' +
        (r.mistakes.length ? '<button class="btn btn-accent" id="again-mistakes">Powtórz błędy</button>' : '') +
        '<button class="btn btn-primary" id="again">Nowe ćwiczenie</button>' +
        '<a class="btn" href="#/czas/' + t.id + '">Wyjaśnienie</a>' +
        '<a class="btn btn-ghost" href="#/">Wszystkie czasy</a>' +
      '</div>' +
      '<div class="section"><h2 style="margin:28px 0 14px">' + (r.mistakes.length ? 'Twoje błędy i wyjaśnienia' : 'Bez błędów') + '</h2>' +
        (r.mistakes.length ? '<div class="mistakes">' + mistakes + '</div>'
          : '<div class="card perfect">Wszystkie odpowiedzi były dobre za pierwszym razem. Goed gedaan!</div>') +
      '</div></div>';

    const am = document.getElementById('again-mistakes');
    if (am) am.addEventListener('click', function () {
      startQuiz(r.tense, 0, r.mistakes.map(function (m) { return { inf: m.inf, tense: m.tense, pi: m.pi }; }));
    });
    document.getElementById('again').addEventListener('click', function () { startQuiz(r.tense, r.total > 140 ? 140 : r.total); });
  }

  function plural(n) {
    if (n === 1) return 'błąd';
    const d = n % 10, h = n % 100;
    if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return 'błędy';
    return 'błędów';
  }

  /* ---------- sprawdzanie czasownika ---------- */
  function renderLookup() {
    document.title = 'Sprawdź czasownik · Cytryna';
    const examples = ['lopen', 'zijn', 'hebben', 'eten', 'opstaan', 'vergeten', 'fietsen', 'schrijven'];
    const opts = [{ v: 'all', l: 'Wszystkie' }].concat(P.map(function (p, i) { return { v: String(i), l: p.nl }; }));
    app.innerHTML =
      '<section class="hero"><span class="eyebrow">Słownik odmiany</span><h1>Sprawdź czasownik</h1>' +
      '<p class="lead">Wpisz bezokolicznik (np. <i>lopen</i>) albo formę (np. <i>liep</i>), wybierz osobę – pokażę poprawną formę we wszystkich 4 czasach.</p></section>' +
      '<form class="card lookup-form" id="lf" autocomplete="off">' +
        '<div class="field"><label for="verb">Czasownik</label>' +
          '<div class="input-row"><input id="verb" name="verb" list="verbs" placeholder="np. lopen" value="' + esc(lookupState.verb) + '" autocapitalize="off" spellcheck="false">' +
          '<button class="btn btn-primary" type="submit">Sprawdź</button></div>' +
          '<datalist id="verbs">' + verbList().map(function (v) { return '<option value="' + v + '">'; }).join('') + '</datalist>' +
          '<div class="chips">' + examples.map(function (e) { return '<button type="button" class="chip" data-ex="' + e + '">' + e + '</button>'; }).join('') + '</div>' +
        '</div>' +
        '<div class="field"><label>Osoba</label><div class="seg" role="group" aria-label="Osoba">' +
          opts.map(function (o) {
            return '<button type="button" data-p="' + o.v + '" aria-pressed="' + (lookupState.person === o.v) + '">' + o.l + '</button>';
          }).join('') +
        '</div></div>' +
      '</form>' +
      '<div id="result" aria-live="polite"></div>';

    const form = document.getElementById('lf');
    const input = document.getElementById('verb');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      lookupState.verb = input.value;
      showResult();
    });
    app.querySelectorAll('[data-p]').forEach(function (b) {
      b.addEventListener('click', function () {
        lookupState.person = b.getAttribute('data-p');
        app.querySelectorAll('[data-p]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        if (lookupState.verb.trim()) { lookupState.verb = input.value; showResult(); }
      });
    });
    app.querySelectorAll('[data-ex]').forEach(function (b) {
      b.addEventListener('click', function () {
        input.value = b.getAttribute('data-ex');
        lookupState.verb = input.value;
        showResult();
      });
    });
    if (lookupState.verb.trim()) showResult();
    else input.focus();
  }

  let VERB_LIST = null;
  function verbList() {
    if (!VERB_LIST) {
      const s = {};
      NL.TOP_VERBS.forEach(function (v) { s[v.inf] = 1; });
      NLData.IRREGULAR_RAW.trim().split('\n').forEach(function (l) { s[l.split('|')[0]] = 1; });
      Object.keys(NLData.REGULAR_EXTRA).forEach(function (k) { s[k] = 1; });
      delete s.zullen;
      VERB_LIST = Object.keys(s).sort();
    }
    return VERB_LIST;
  }

  function showResult() {
    const out = document.getElementById('result');
    let word = lookupState.verb.trim().toLowerCase().replace(/^(te|to)\s+/, '');
    if (!word) { out.innerHTML = ''; return; }
    if (!/^[a-zëïéèöü]+$/.test(word)) {
      out.innerHTML = '<div class="notice error">Wpisz jedno słowo, tylko litery – np. <i>werken</i>.</div>';
      return;
    }
    let pre = '';
    if (!NL.isKnown(word)) {
      const found = NL.findInfinitive(word);
      if (found && found !== word) {
        pre = '<div class="notice">„' + esc(word) + '” to forma czasownika <b>' + found + '</b>. Oto jego odmiana:</div>';
        word = found;
      } else if (!NL.looksLikeInfinitive(word)) {
        out.innerHTML = '<div class="notice error">Nie znam takiego czasownika. Wpisz bezokolicznik – zwykle kończy się na <i>-en</i>, np. <i>spelen</i>.</div>';
        return;
      }
    }
    const info = NL.analyze(word);
    if (word === 'zullen') {
      out.innerHTML = '<div class="notice">„zullen” to czasownik posiłkowy: ik zal, jij zult, hij zal, wij/jullie/zij zullen; czas przeszły: zou / zouden.</div>';
      return;
    }
    const badges = [];
    if (info.irregular) badges.push('<span class="badge irr">nieregularny</span>');
    else badges.push('<span class="badge reg">regularny</span>');
    if (info.sep) badges.push('<span class="badge">rozdzielny: ' + info.sep + '-</span>');
    if (info.prefix && !info.sep) badges.push('<span class="badge">przedrostek ' + info.prefix + '-</span>');
    badges.push('<span class="badge">' + (info.aux[0] === 'z' ? 'zijn' : 'hebben') + (info.aux.length === 2 ? ' / ' + (info.aux[1] === 'z' ? 'zijn' : 'hebben') : '') + '</span>');

    let note = '';
    if (!info.known) {
      note = '<div class="notice">Tego czasownika nie ma w moim słowniku, więc odmieniam go według reguł dla czasowników regularnych. Sprawdź w słowniku, czy na pewno jest regularny.</div>';
    }
    if (info.aux.length === 2) note += '<div class="notice">' + NL.auxExplain(info) + '</div>';

    let body;
    if (lookupState.person === 'all') {
      body = '<div class="card table-scroll" style="margin-top:16px"><table class="full-table"><thead><tr><th>Osoba</th>' +
        NL.TENSES.map(function (t) { return '<th>' + t.pl + '</th>'; }).join('') + '</tr></thead><tbody>' +
        P.map(function (p, pi) {
          return '<tr><td>' + p.nl + '</td>' + NL.TENSES.map(function (t) {
            return '<td>' + esc(NL.form(info, t.id, pi)) + '</td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody></table></div>' +
        '<p class="hint">Wybierz konkretną osobę, aby zobaczyć wyjaśnienie każdej formy.</p>';
    } else {
      const pi = Number(lookupState.person);
      body = '<div class="forms">' + NL.TENSES.map(function (t) {
        return '<div class="card form-row t-' + t.id + '">' +
          '<div class="tname">' + t.pl + '<small>' + t.nl + '</small></div>' +
          '<div><div class="fval"><span class="who">' + P[pi].nl + '</span>' + esc(NL.form(info, t.id, pi)) + '</div>' +
          '<div class="fexp">' + NL.explain(info, t.id, pi) + '</div></div>' +
        '</div>';
      }).join('') + '</div>';
    }

    out.innerHTML = pre +
      '<div class="result-head"><h2>' + esc(info.inf) + '</h2>' +
        (info.tr ? '<span class="muted">' + esc(info.tr) + '</span>' : '') + '</div>' +
      '<div class="badges">' + badges.join('') + '</div>' + note + body;
  }

  route();
})();
