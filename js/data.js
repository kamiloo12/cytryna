/* Dane: osoby, czasy, 70 najczęstszych czasowników i lista czasowników nieregularnych */
(function (global) {
  'use strict';

  const PERSONS = [
    { id: 'ik', nl: 'ik', pl: 'ja' },
    { id: 'jij', nl: 'jij', pl: 'ty' },
    { id: 'hij', nl: 'hij/zij', pl: 'on / ona' },
    { id: 'wij', nl: 'wij', pl: 'my' },
    { id: 'jullie', nl: 'jullie', pl: 'wy' },
    { id: 'zij', nl: 'zij', pl: 'oni / one' }
  ];

  const TENSES = [
    {
      id: 'ott',
      short: 'Teraźniejszy',
      nl: 'Onvoltooid tegenwoordige tijd (OTT)',
      pl: 'Czas teraźniejszy',
      when: 'Mówimy o tym, co dzieje się teraz albo co robimy zawsze lub często.',
      example: 'Ik speel nu met mijn hond. – Teraz bawię się z psem.',
      formula: 'temat (stam) + końcówka',
      steps: [
        'Weź bezokolicznik i odetnij <b>-en</b>: <i>werken → werk</i>. To jest <b>temat</b> (stam).',
        'Jeśli w bezokoliczniku jest długa samogłoska w otwartej sylabie, w temacie piszemy ją podwójnie: <i>maken → maak</i>, <i>wonen → woon</i>.',
        'Podwójną spółgłoskę skracamy: <i>zitten → zit</i>, <i>bellen → bel</i>.',
        'Na końcu tematu nie może stać <b>v</b> ani <b>z</b>: <i>leven → leef</i>, <i>lezen → lees</i>.',
        '<b>ik</b> = sam temat. <b>jij, hij/zij</b> = temat + <b>t</b>. <b>wij, jullie, zij</b> = bezokolicznik.',
        'Jeśli temat już kończy się na <b>-t</b>, nie dodajemy drugiego: <i>hij zit</i>. Gdy kończy się na <b>-d</b>, i tak dodajemy t: <i>hij wordt</i>.'
      ],
      tip: 'Kilka czasowników trzeba zapamiętać: <i>zijn</i> (ben, bent, is), <i>hebben</i> (heb, hebt, heeft), <i>kunnen</i> (kan, kunt), <i>mogen</i> (mag), <i>willen</i> (wil, wilt), <i>komen</i> (kom).',
      demo: ['werken', 'maken', 'zijn']
    },
    {
      id: 'ovt',
      short: 'Przeszły prosty',
      nl: 'Onvoltooid verleden tijd (OVT)',
      pl: 'Czas przeszły prosty',
      when: 'Opowiadamy, co działo się kiedyś – jak w bajce albo w opowiadaniu.',
      example: 'Gisteren speelde ik in de tuin. – Wczoraj bawiłem się w ogrodzie.',
      formula: 'temat + -te / -de  (l. mn. -ten / -den)',
      steps: [
        'Znajdź temat, tak jak w czasie teraźniejszym: <i>werken → werk</i>.',
        'Sprawdź ostatnią literę tematu w bezokoliczniku. Czy jest w słowie <b>’t kofschip</b> (t, k, f, s, ch, p)?',
        'TAK → dodaj <b>-te</b> (l. poj.) albo <b>-ten</b> (l. mn.): <i>werkte, werkten</i>.',
        'NIE → dodaj <b>-de</b> albo <b>-den</b>: <i>speelde, speelden</i>.',
        'Uwaga: przy <i>leven</i> i <i>reizen</i> patrzymy na <b>v</b> i <b>z</b> z bezokolicznika – nie ma ich w kofschip, więc: <i>leefde, reisde</i>.',
        'Czasowniki nieregularne zmieniają cały wyraz: <i>lopen → liep / liepen</i>. Te formy trzeba zapamiętać.'
      ],
      tip: 'W tym czasie są tylko dwie formy: jedna dla <b>ik, jij, hij</b> i jedna dla <b>wij, jullie, zij</b>.',
      demo: ['werken', 'spelen', 'lopen']
    },
    {
      id: 'vtt',
      short: 'Przeszły dokonany',
      nl: 'Voltooid tegenwoordige tijd (VTT)',
      pl: 'Czas przeszły dokonany',
      when: 'Mówimy, że coś już się stało. W mowie Holendrzy używają go najczęściej!',
      example: 'Ik heb mijn huiswerk gemaakt. – Zrobiłem pracę domową.',
      formula: 'hebben / zijn (w czasie teraźniejszym) + imiesłów',
      steps: [
        'Wybierz czasownik posiłkowy: prawie zawsze <b>hebben</b> (heb, hebt, heeft, hebben).',
        '<b>zijn</b> (ben, bent, is, zijn) używamy przy ruchu do celu i przy zmianie stanu: <i>gaan, komen, vallen, worden, blijven, beginnen</i>.',
        'Zrób imiesłów (voltooid deelwoord) regularny: <b>ge + temat + t/d</b>. Znów pomaga <b>’t kofschip</b>: <i>gewerkt</i>, ale <i>gespeeld</i>.',
        'Jeśli temat już kończy się na -t lub -d, nic nie dodajemy: <i>gepraat, geantwoord</i>.',
        'Gdy czasownik zaczyna się od <b>be-, ge-, ver-, ont-, her-, er-</b>, nie dodajemy <b>ge-</b>: <i>betaald, vergeten</i>.',
        'Imiesłowy nieregularne trzeba zapamiętać: <i>gegeven, gelopen, gegaan</i>.'
      ],
      tip: 'Imiesłów zwykle stoi na końcu zdania: <i>Ik heb gisteren een appel <b>gegeten</b>.</i>',
      demo: ['werken', 'spelen', 'gaan']
    },
    {
      id: 'tt',
      short: 'Przyszły',
      nl: 'Toekomende tijd (gaan + infinitief)',
      pl: 'Czas przyszły',
      when: 'Mówimy o tym, co zrobimy albo co się wydarzy.',
      example: 'Morgen ga ik zwemmen. – Jutro będę pływać.',
      formula: 'gaan (jak w teraźniejszym) + bezokolicznik',
      steps: [
        'Odmień <b>gaan</b> tak samo jak w czasie teraźniejszym: ik <b>ga</b>, jij <b>gaat</b>, hij <b>gaat</b>, wij/jullie/zij <b>gaan</b>.',
        'Dodaj czasownik w bezokoliczniku – bez żadnych zmian: <i>ik ga werken</i>, <i>wij gaan spelen</i>.',
        'Bezokolicznik stoi na końcu zdania: <i>Wij gaan morgen naar oma <b>fietsen</b>.</i>'
      ],
      tip: 'Odmienia się tylko <b>gaan</b> – drugi czasownik zawsze zostaje taki sam. Można też użyć samego czasu teraźniejszego: <i>Morgen werk ik.</i>',
      demo: ['werken', 'zijn']
    }
  ];

  /*
   * 70 najczęstszych czasowników.
   * pres: nieregularne formy teraźniejsze {ik, jij, hij, pl}
   * alt:  inne poprawne formy (nie mogą być błędnymi odpowiedziami)
   * Formy przeszłe i imiesłowy czasowników nieregularnych pochodzą z listy IRREGULAR niżej.
   */
  const TOP_VERBS = [
    { inf: 'zijn', pl: 'być', pres: { ik: 'ben', jij: 'bent', hij: 'is', pl: 'zijn' } },
    { inf: 'hebben', pl: 'mieć', pres: { ik: 'heb', jij: 'hebt', hij: 'heeft', pl: 'hebben' }, },
    { inf: 'worden', pl: 'stawać się' },
    { inf: 'kunnen', pl: 'móc, umieć', pres: { ik: 'kan', jij: 'kunt', hij: 'kan', pl: 'kunnen' }, alt: { jij: ['kan'] } },
    { inf: 'moeten', pl: 'musieć' },
    { inf: 'willen', pl: 'chcieć', pres: { ik: 'wil', jij: 'wilt', hij: 'wil', pl: 'willen' }, alt: { jij: ['wil'] }, ovtAlt: ['wou'] },
    { inf: 'mogen', pl: 'móc (wolno)', pres: { ik: 'mag', jij: 'mag', hij: 'mag', pl: 'mogen' } },
    { inf: 'gaan', pl: 'iść' },
    { inf: 'komen', pl: 'przychodzić', pres: { ik: 'kom', jij: 'komt', hij: 'komt', pl: 'komen' } },
    { inf: 'doen', pl: 'robić' },
    { inf: 'maken', pl: 'robić, tworzyć' },
    { inf: 'zeggen', pl: 'powiedzieć' },
    { inf: 'zien', pl: 'widzieć' },
    { inf: 'weten', pl: 'wiedzieć' },
    { inf: 'krijgen', pl: 'dostawać' },
    { inf: 'geven', pl: 'dawać' },
    { inf: 'staan', pl: 'stać' },
    { inf: 'liggen', pl: 'leżeć' },
    { inf: 'zitten', pl: 'siedzieć' },
    { inf: 'nemen', pl: 'brać' },
    { inf: 'vinden', pl: 'znaleźć, uważać' },
    { inf: 'denken', pl: 'myśleć' },
    { inf: 'laten', pl: 'pozwalać, zostawiać' },
    { inf: 'houden', pl: 'trzymać, lubić (houden van)', alt: { ik: ['hou'], jij: ['houd'] } },
    { inf: 'blijven', pl: 'zostawać' },
    { inf: 'lopen', pl: 'chodzić, iść pieszo' },
    { inf: 'spreken', pl: 'mówić (językiem)' },
    { inf: 'praten', pl: 'rozmawiać' },
    { inf: 'werken', pl: 'pracować' },
    { inf: 'wonen', pl: 'mieszkać' },
    { inf: 'leven', pl: 'żyć' },
    { inf: 'eten', pl: 'jeść' },
    { inf: 'drinken', pl: 'pić' },
    { inf: 'slapen', pl: 'spać' },
    { inf: 'lezen', pl: 'czytać' },
    { inf: 'schrijven', pl: 'pisać' },
    { inf: 'spelen', pl: 'bawić się, grać' },
    { inf: 'leren', pl: 'uczyć się' },
    { inf: 'kopen', pl: 'kupować' },
    { inf: 'betalen', pl: 'płacić' },
    { inf: 'vragen', pl: 'pytać, prosić' },
    { inf: 'antwoorden', pl: 'odpowiadać' },
    { inf: 'horen', pl: 'słyszeć' },
    { inf: 'kijken', pl: 'patrzeć, oglądać' },
    { inf: 'zoeken', pl: 'szukać' },
    { inf: 'brengen', pl: 'przynosić' },
    { inf: 'rijden', pl: 'jechać' },
    { inf: 'fietsen', pl: 'jeździć rowerem' },
    { inf: 'zwemmen', pl: 'pływać' },
    { inf: 'vallen', pl: 'upadać, padać' },
    { inf: 'beginnen', pl: 'zaczynać' },
    { inf: 'stoppen', pl: 'zatrzymać się, przestać' },
    { inf: 'helpen', pl: 'pomagać' },
    { inf: 'bellen', pl: 'dzwonić' },
    { inf: 'wachten', pl: 'czekać' },
    { inf: 'openen', pl: 'otwierać' },
    { inf: 'sluiten', pl: 'zamykać' },
    { inf: 'koken', pl: 'gotować' },
    { inf: 'lachen', pl: 'śmiać się' },
    { inf: 'huilen', pl: 'płakać' },
    { inf: 'dansen', pl: 'tańczyć' },
    { inf: 'zingen', pl: 'śpiewać' },
    { inf: 'luisteren', pl: 'słuchać' },
    { inf: 'kennen', pl: 'znać' },
    { inf: 'begrijpen', pl: 'rozumieć' },
    { inf: 'vergeten', pl: 'zapominać' },
    { inf: 'wassen', pl: 'myć, prać' },
    { inf: 'tekenen', pl: 'rysować' },
    { inf: 'gebruiken', pl: 'używać' },
    { inf: 'vliegen', pl: 'latać' }
  ];

  /*
   * Czasowniki nieregularne i mieszane:
   * bezokolicznik | OVT l.poj. | OVT l.mn. | imiesłów | posiłkowy (h, z, hz) | tłumaczenie
   * h = hebben, z = zijn; hz = zwykle hebben, ale zijn przy ruchu do celu;
   * zh = zwykle zijn, ale hebben też jest poprawne
   */
  const IRREGULAR_RAW = `
bakken|bakte|bakten|gebakken|h|piec
barsten|barstte|barstten|gebarsten|z|pękać
bederven|bedierf|bedierven|bedorven|hz|psuć
bedriegen|bedroog|bedrogen|bedrogen|h|oszukiwać
beginnen|begon|begonnen|begonnen|z|zaczynać
begrijpen|begreep|begrepen|begrepen|h|rozumieć
bevelen|beval|bevalen|bevolen|h|rozkazywać
bewegen|bewoog|bewogen|bewogen|h|ruszać się
bidden|bad|baden|gebeden|h|modlić się
bieden|bood|boden|geboden|h|oferować
bijten|beet|beten|gebeten|h|gryźć
binden|bond|bonden|gebonden|h|wiązać
blazen|blies|bliezen|geblazen|h|dmuchać
blijken|bleek|bleken|gebleken|z|okazywać się
blijven|bleef|bleven|gebleven|z|zostawać
blinken|blonk|blonken|geblonken|h|błyszczeć
braden|braadde|braadden|gebraden|h|smażyć, piec
breken|brak|braken|gebroken|hz|łamać
brengen|bracht|brachten|gebracht|h|przynosić
buigen|boog|bogen|gebogen|h|zginać
denken|dacht|dachten|gedacht|h|myśleć
doen|deed|deden|gedaan|h|robić
dragen|droeg|droegen|gedragen|h|nosić
drijven|dreef|dreven|gedreven|h|unosić się na wodzie
dringen|drong|drongen|gedrongen|hz|przepychać się
drinken|dronk|dronken|gedronken|h|pić
duiken|dook|doken|gedoken|hz|nurkować
dwingen|dwong|dwongen|gedwongen|h|zmuszać
eten|at|aten|gegeten|h|jeść
fluiten|floot|floten|gefloten|h|gwizdać
gaan|ging|gingen|gegaan|z|iść
gelden|gold|golden|gegolden|h|obowiązywać
genezen|genas|genazen|genezen|z|wyzdrowieć
genieten|genoot|genoten|genoten|h|cieszyć się
geven|gaf|gaven|gegeven|h|dawać
gieten|goot|goten|gegoten|h|lać
glijden|gleed|gleden|gegleden|hz|ślizgać się
graven|groef|groeven|gegraven|h|kopać
grijpen|greep|grepen|gegrepen|h|chwytać
hangen|hing|hingen|gehangen|h|wisieć
hebben|had|hadden|gehad|h|mieć
heffen|hief|hieven|geheven|h|podnosić
helpen|hielp|hielpen|geholpen|h|pomagać
heten|heette|heetten|geheten|h|nazywać się
houden|hield|hielden|gehouden|h|trzymać, lubić
jagen|joeg|joegen|gejaagd|h|polować
kiezen|koos|kozen|gekozen|h|wybierać
kijken|keek|keken|gekeken|h|patrzeć
klimmen|klom|klommen|geklommen|hz|wspinać się
klinken|klonk|klonken|geklonken|h|brzmieć
knijpen|kneep|knepen|geknepen|h|szczypać
komen|kwam|kwamen|gekomen|z|przychodzić
kopen|kocht|kochten|gekocht|h|kupować
krijgen|kreeg|kregen|gekregen|h|dostawać
krimpen|kromp|krompen|gekrompen|z|kurczyć się
kruipen|kroop|kropen|gekropen|hz|czołgać się
kunnen|kon|konden|gekund|h|móc, umieć
lachen|lachte|lachten|gelachen|h|śmiać się
laden|laadde|laadden|geladen|h|ładować
laten|liet|lieten|gelaten|h|pozwalać
lezen|las|lazen|gelezen|h|czytać
liegen|loog|logen|gelogen|h|kłamać
liggen|lag|lagen|gelegen|h|leżeć
lijden|leed|leden|geleden|h|cierpieć
lijken|leek|leken|geleken|h|wydawać się
lopen|liep|liepen|gelopen|hz|chodzić
malen|maalde|maalden|gemalen|h|mielić
melken|melkte|melkten|gemolken|h|doić
meten|mat|maten|gemeten|h|mierzyć
moeten|moest|moesten|gemoeten|h|musieć
mogen|mocht|mochten|gemogen|h|móc (wolno)
nemen|nam|namen|genomen|h|brać
prijzen|prees|prezen|geprezen|h|chwalić
raden|raadde|raadden|geraden|h|zgadywać
rijden|reed|reden|gereden|hz|jechać
rijzen|rees|rezen|gerezen|z|wznosić się
roepen|riep|riepen|geroepen|h|wołać
ruiken|rook|roken|geroken|h|wąchać, pachnieć
scheiden|scheidde|scheidden|gescheiden|hz|rozdzielać
schelden|schold|scholden|gescholden|h|przeklinać, besztać
schenken|schonk|schonken|geschonken|h|nalewać, darować
scheppen|schiep|schiepen|geschapen|h|tworzyć
scheren|schoor|schoren|geschoren|h|golić
schieten|schoot|schoten|geschoten|h|strzelać
schijnen|scheen|schenen|geschenen|h|świecić
schrijven|schreef|schreven|geschreven|h|pisać
schrikken|schrok|schrokken|geschrokken|z|przestraszyć się
schuiven|schoof|schoven|geschoven|hz|przesuwać
slaan|sloeg|sloegen|geslagen|h|bić, uderzać
slapen|sliep|sliepen|geslapen|h|spać
slijpen|sleep|slepen|geslepen|h|ostrzyć
sluipen|sloop|slopen|geslopen|hz|skradać się
sluiten|sloot|sloten|gesloten|h|zamykać
smelten|smolt|smolten|gesmolten|z|topnieć
snijden|sneed|sneden|gesneden|h|kroić
spijten|speet|speten|gespeten|h|żałować
spinnen|spon|sponnen|gesponnen|h|prząść, mruczeć
spreken|sprak|spraken|gesproken|h|mówić
springen|sprong|sprongen|gesprongen|hz|skakać
spuiten|spoot|spoten|gespoten|h|pryskać
staan|stond|stonden|gestaan|h|stać
steken|stak|staken|gestoken|h|kłuć
stelen|stal|stalen|gestolen|h|kraść
sterven|stierf|stierven|gestorven|z|umierać
stijgen|steeg|stegen|gestegen|z|wznosić się
stinken|stonk|stonken|gestonken|h|śmierdzieć
stoten|stootte|stootten|gestoten|h|uderzać
strijden|streed|streden|gestreden|h|walczyć
strijken|streek|streken|gestreken|h|prasować
treden|trad|traden|getreden|z|wstępować
trekken|trok|trokken|getrokken|hz|ciągnąć
vallen|viel|vielen|gevallen|z|upadać
vangen|ving|vingen|gevangen|h|łapać
varen|voer|voeren|gevaren|hz|płynąć statkiem
vechten|vocht|vochten|gevochten|h|walczyć, bić się
verbieden|verbood|verboden|verboden|h|zakazywać
verdwijnen|verdween|verdwenen|verdwenen|z|znikać
vergelijken|vergeleek|vergeleken|vergeleken|h|porównywać
vergeten|vergat|vergaten|vergeten|zh|zapominać
verliezen|verloor|verloren|verloren|h|gubić, przegrywać
vermijden|vermeed|vermeden|vermeden|h|unikać
verraden|verried|verrieden|verraden|h|zdradzać
verschijnen|verscheen|verschenen|verschenen|z|pojawiać się
vertrekken|vertrok|vertrokken|vertrokken|z|wyjeżdżać
verzinnen|verzon|verzonnen|verzonnen|h|wymyślać
vinden|vond|vonden|gevonden|h|znaleźć, uważać
vliegen|vloog|vlogen|gevlogen|hz|latać
vouwen|vouwde|vouwden|gevouwen|h|składać
vragen|vroeg|vroegen|gevraagd|h|pytać
vriezen|vroor|vroren|gevroren|h|marznąć
wassen|waste|wasten|gewassen|h|myć
wegen|woog|wogen|gewogen|h|ważyć
werpen|wierp|wierpen|geworpen|h|rzucać
werven|wierf|wierven|geworven|h|werbować
weten|wist|wisten|geweten|h|wiedzieć
wijken|week|weken|geweken|z|ustępować
wijzen|wees|wezen|gewezen|h|wskazywać
willen|wilde|wilden|gewild|h|chcieć
winden|wond|wonden|gewonden|h|nawijać
winnen|won|wonnen|gewonnen|h|wygrywać
worden|werd|werden|geworden|z|stawać się
wreken|wreekte|wreekten|gewroken|h|mścić się
wrijven|wreef|wreven|gewreven|h|trzeć
zeggen|zei|zeiden|gezegd|h|powiedzieć
zenden|zond|zonden|gezonden|h|wysyłać
zien|zag|zagen|gezien|h|widzieć
zijn|was|waren|geweest|z|być
zingen|zong|zongen|gezongen|h|śpiewać
zinken|zonk|zonken|gezonken|z|tonąć
zitten|zat|zaten|gezeten|h|siedzieć
zoeken|zocht|zochten|gezocht|h|szukać
zuigen|zoog|zogen|gezogen|h|ssać
zullen|zou|zouden|-|h|będzie (posiłkowy)
zwemmen|zwom|zwommen|gezwommen|hz|pływać
zweren|zwoer|zwoeren|gezworen|h|przysięgać
zwijgen|zweeg|zwegen|gezwegen|h|milczeć
`;

  /* Czasowniki regularne z „zijn” (lub z oboma posiłkowymi) */
  const REGULAR_AUX = {
    gebeuren: 'z', groeien: 'z', verhuizen: 'z', landen: 'z', slagen: 'z', zakken: 'z',
    verdwalen: 'z', ontsnappen: 'z', emigreren: 'z', verschuiven: 'z', stoppen: 'z',
    veranderen: 'hz', reizen: 'hz', wandelen: 'hz', fietsen: 'hz', rennen: 'hz',
    trouwen: 'hz', zeilen: 'hz', roeien: 'hz', verbeteren: 'hz', sterven: 'z',
    springen: 'hz', verhongeren: 'z', ontwaken: 'z', opgroeien: 'z', overlijden: 'z'
  };

  /* Popularne czasowniki regularne – słownik do rozpoznawania i tłumaczeń */
  const REGULAR_EXTRA = {
    maken: 'robić', praten: 'rozmawiać', werken: 'pracować', wonen: 'mieszkać', leven: 'żyć',
    spelen: 'bawić się, grać', leren: 'uczyć się', betalen: 'płacić', antwoorden: 'odpowiadać',
    horen: 'słyszeć', fietsen: 'jeździć rowerem', stoppen: 'przestać', bellen: 'dzwonić',
    wachten: 'czekać', openen: 'otwierać', koken: 'gotować', huilen: 'płakać', dansen: 'tańczyć',
    luisteren: 'słuchać', kennen: 'znać', tekenen: 'rysować', gebruiken: 'używać',
    rennen: 'biegać', vertellen: 'opowiadać', zetten: 'stawiać', leggen: 'kłaść',
    sturen: 'wysyłać', hopen: 'mieć nadzieję', geloven: 'wierzyć', proberen: 'próbować',
    studeren: 'studiować', reizen: 'podróżować', wandelen: 'spacerować', poetsen: 'myć (zęby)',
    douchen: 'brać prysznic', kloppen: 'pukać', knippen: 'strzyc, wycinać', plakken: 'kleić',
    missen: 'tęsknić, brakować', groeien: 'rosnąć', gebeuren: 'dziać się', veranderen: 'zmieniać',
    verhuizen: 'przeprowadzać się', bouwen: 'budować', branden: 'palić się', regenen: 'padać (deszcz)',
    sneeuwen: 'padać (śnieg)', schaatsen: 'jeździć na łyżwach', tellen: 'liczyć', delen: 'dzielić',
    verdienen: 'zarabiać', verkopen: 'sprzedawać', bezoeken: 'odwiedzać', ontmoeten: 'spotykać',
    herhalen: 'powtarzać', herinneren: 'przypominać', vertalen: 'tłumaczyć', oefenen: 'ćwiczyć',
    rekenen: 'liczyć', schilderen: 'malować', fluisteren: 'szeptać', verbeteren: 'poprawiać',
    trouwen: 'brać ślub', zeilen: 'żeglować', kussen: 'całować', knuffelen: 'przytulać',
    duwen: 'pchać', trappen: 'kopać', gooien: 'rzucać', pakken: 'brać, łapać',
    zwaaien: 'machać', draaien: 'kręcić', strikken: 'wiązać kokardę', zorgen: 'dbać',
    noemen: 'nazywać', tonen: 'pokazywać', durven: 'odważyć się', blaffen: 'szczekać',
    mailen: 'mailować', chatten: 'czatować', fotograferen: 'fotografować', telefoneren: 'telefonować',
    landen: 'lądować', slagen: 'zdać (egzamin)', zakken: 'oblać (egzamin)', ontbijten: 'jeść śniadanie',
    lunchen: 'jeść lunch', verstoppen: 'chować', zoenen: 'całować', wensen: 'życzyć',
    plannen: 'planować', redden: 'ratować', haten: 'nienawidzić', opruimen: 'sprzątać',
    opstaan: 'wstawać', opbellen: 'dzwonić do kogoś', aankomen: 'przybywać', meenemen: 'zabierać ze sobą',
    uitnodigen: 'zapraszać', afwassen: 'zmywać naczynia', aankleden: 'ubierać', uitleggen: 'wyjaśniać',
    terugkomen: 'wracać', weggaan: 'odchodzić', opschrijven: 'zapisywać', meedoen: 'brać udział',
    nadenken: 'zastanawiać się', voorlezen: 'czytać na głos', thuisblijven: 'zostać w domu',
    schoonmaken: 'sprzątać', klaarmaken: 'przygotowywać', binnenkomen: 'wchodzić', buitenspelen: 'bawić się na dworze',
    ontvangen: 'otrzymywać', onthouden: 'zapamiętywać', vergeven: 'wybaczać', bekijken: 'oglądać',
    bestaan: 'istnieć', verstaan: 'rozumieć (słyszeć)', ontstaan: 'powstawać', verdelen: 'rozdzielać'
  };

  /* Czasowniki z akcentem nieakcentowanym -er (temat bez podwajania samogłoski) */
  const SCHWA_EREN = [
    'luisteren', 'veranderen', 'herinneren', 'fluisteren', 'verbeteren', 'bewonderen', 'verminderen',
    'vermeerderen', 'hinderen', 'verhinderen', 'plunderen', 'schitteren', 'klapperen', 'bibberen',
    'flikkeren', 'hamsteren', 'kletteren', 'dobberen', 'slenteren', 'stotteren', 'opperen', 'schilderen',
    'verhongeren', 'wateren', 'donderen', 'hameren', 'poederen', 'beteren', 'kateren',
    'sputteren', 'snorkelen', 'ijveren', 'twijfelen', 'peuteren', 'klauteren', 'kakelen', 'babbelen', 'wapperen', 'fladderen', 'schateren', 'tetteren', 'sidderen', 'huiveren',
    'leveren', 'verzekeren', 'herinneren', 'wandelen', 'onderhandelen',
    'bevorderen', 'vorderen', 'vergaderen', 'ademen', 'hinderen', 'zegenen',
    'regenen', 'tekenen', 'rekenen', 'openen', 'oefenen', 'betekenen', 'ondertekenen'
  ];

  global.NLData = {
    PERSONS: PERSONS,
    TENSES: TENSES,
    TOP_VERBS: TOP_VERBS,
    IRREGULAR_RAW: IRREGULAR_RAW,
    REGULAR_AUX: REGULAR_AUX,
    REGULAR_EXTRA: REGULAR_EXTRA,
    SCHWA_EREN: SCHWA_EREN
  };
})(typeof window !== 'undefined' ? window : globalThis);
