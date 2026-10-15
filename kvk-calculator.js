/*!
 * kvk-calculator.js – „KvK Start“ (KvK-Vorbereitung) für das Wiz fan Club Dashboard
 *
 * Aufbau:
 *   KvK Start (Titel)
 *   [ Zeit: Countdown mittig · Phase · Start-Datum (KvK startet immer 00:00 UTC) ]
 *   [ AP ]                [ Speed ]
 *   [ Crystal – volle Breite: Bestand, Kisten, Ertrag, Ziele | Bundle-Kaufmenü | Statistik ]
 *   [ Resources – volle Breite ]
 *
 * Einbinden:  <script src="kvk-calculator.js" defer></script>
 * Erwartet:   #kvkRoot (in #kvkView, Umschalten über applyView in index.html) – optional Popup-Modus mit #kvkModal.
 * Daten:      pro Account unter dem Cloud-Schlüssel des Profils (RokAuth → user_state). Ohne RokAuth: localStorage 'kvkCalc.v2'.
 * Scanner:    übernimmt die letzten Scans (AP, Speedups, Ressourcen).
 * API:        window.KvKCalc.render() / .open() / .close() / .getState() / .setState(obj) / .reset()
 * Event:      window 'kvkcalc:change' (detail = State)
 */
(function () {
  'use strict';

  /* ================================================================== *
   * Kristall-Bundles (Echtgeld) – Werte aus der Bundle-Tabelle.
   * kind 'once'  = jede Stufe einmal kaufbar (Häkchen)
   * kind 'repeat' = wiederholbar (Anzahl, z. B. Tage oder Pass-Öffnungen)
   * perDay/days  = Kristalle kommen täglich statt sofort
   * ================================================================== */
  const CHEST_CRYSTALS = 100000;
  // Hintergrund des Countdown-Felds (eingebettet, damit nur diese eine Datei nötig ist)
  const TIMER_BG = 'data:image/webp;base64,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';
  const BUNDLES = [
    {
      id: 'psup', name: 'Premium Season Crystal Supply', kind: 'once',
      info: { de: '50 Tage · 60.000 Kristalle pro Tag · +50 % Kristallminen-Arbeitstempo', en: '50 days · 60,000 crystals per day · +50% crystal mine work speed' },
      tiers: [{ id: 'psup', label: { de: 'Einmalkauf', en: 'One-time purchase' }, usd: 4.99, cr: 3000000, perDay: 60000, days: 50, mineBoost: 0.5 }]
    },
    {
      id: 'fcfs', name: 'First Come, First Served', kind: 'once',
      info: { de: 'Bedingung: Mine & Forschungszentrum erreichen', en: 'Conditional: reach Mine & Research Center level' },
      tiers: [
        { id: 'fcfs1', label: 'Mine 5 · RC 5', usd: 2.99, cr: 300000 },
        { id: 'fcfs2', label: 'Mine 15 · RC 10/15', usd: 4.99, cr: 550000 },
        { id: 'fcfs3', label: 'Mine 20 · RC 18', usd: 9.99, cr: 1300000 },
        { id: 'fcfs4', label: 'Mine 22', usd: 14.99, cr: 2000000 },
        { id: 'fcfs5', label: 'Mine 25 · RC 25', usd: 19.99, cr: 2750000 }
      ]
    },
    {
      id: 'sci', name: 'Scientific Pioneer', kind: 'once',
      info: { de: 'Bedingung: Technologien erforschen', en: 'Conditional: research technologies' },
      tiers: [
        { id: 'sci1', label: 'Culture Exchange II / Treaties II', usd: 4.99, cr: 550000 },
        { id: 'sci2', label: 'Skillful Operations II', usd: 7.99, cr: 1000000 }
      ]
    },
    {
      id: 'mw', name: 'Mountain Warfare', kind: 'repeat', unit: { de: 'Pässe', en: 'passes' },
      info: { de: '12 Std vor Pass-Öffnungen', en: '12h before pass openings' },
      tiers: [
        { id: 'mw1', label: 'Stone', usd: 4.99, cr: 250000 },
        { id: 'mw2', label: 'Bronze', usd: 9.99, cr: 500000 },
        { id: 'mw3', label: 'Iron', usd: 19.99, cr: 800000 },
        { id: 'mw4', label: 'Silver', usd: 49.99, cr: 2500000 },
        { id: 'mw5', label: 'Gold', usd: 99.99, cr: 5000000 }
      ]
    },
    {
      id: 'cw', name: "Conquer's Will", kind: 'repeat', unit: { de: 'Tage', en: 'days' },
      info: { de: 'Tägliches Bundle', en: 'Daily bundle' },
      tiers: [
        { id: 'cw1', label: 'Stone', usd: 4.99, cr: 150000 },
        { id: 'cw2', label: 'Bronze', usd: 9.99, cr: 350000 },
        { id: 'cw3', label: 'Iron', usd: 19.99, cr: 650000 }
      ]
    }
  ];
  const ALL_TIERS = BUNDLES.flatMap((b) => b.tiers.map((t) => ({ ...t, bundle: b })));

  // Bewertung nach $ pro 1 Mio Kristalle (wie im Sheet: MUST · GREAT · OK'ish · BAD)
  const RATINGS = [
    { max: 5, key: 'MUST', cls: 'bg-emerald-600 text-white', bar: '#059669' },
    { max: 10, key: 'GREAT', cls: 'bg-emerald-400/90 text-ink-950', bar: '#34d399' },
    { max: 25, key: "OK'ish", cls: 'bg-amber-300/90 text-ink-950', bar: '#fcd34d' },
    { max: Infinity, key: 'BAD', cls: 'bg-red-400/90 text-ink-950', bar: '#f87171' }
  ];
  const perMil = (usd, cr) => (cr > 0 ? (usd / cr) * 1e6 : Infinity);
  const rating = (pm) => RATINGS.find((r) => pm <= r.max);

  /* ================================================================== *
   * Texte (DE/EN – folgt der Sprachumschaltung der Seite)
   * ================================================================== */
  const I18N = {
    de: {
      title: 'KvK Start', sub: 'Vorbereitung',
      startLabel: 'KvK-Start (Datum)', utcNote: 'KvK startet immer um 00:00 UTC', localIs: 'bei dir',
      countdown: 'KvK Countdown', edit: 'Bearbeiten', calTitle: 'KvK-Kalender', done: 'Fertig', startShort: 'Start',
      tabs: { start: 'Start', mid: 'Mid', end: 'End' },
      calc: 'Berechnung', calcHint: 'Kisten, Bundles, Kosten Mine & Kristall-Tech-Gebäude', costMine: 'Kosten Kristallmine', costTech: 'Kosten Kristall-Tech-Gebäude',
      income: 'Ertrag pro Tag', avail: 'Verfügbar', need: 'Benötigt', diff: 'Differenz', chestsNeed: 'Kisten nötig', chestsUnit: 'Kisten',
      enough: 'Reicht', missingTxt: 'Fehlen', availTotal: 'Verfügbar gesamt', inclSupply: 'inkl. Premium Supply', mineTech: 'Mine + Tech', bundlesFold: 'Bundles', bundlesHint: 'Echtgeld-Angebote, Statistik & Budget-Planer',
      soon: { mid: 'Hier entsteht die Planung für die Mitte des KvK.', end: 'Hier entsteht die Planung für das Ende des KvK.' }, soonSub: 'Kommt als Nächstes',
      noStart: 'Start-Datum festlegen', pre: 'Pre-KvK', day: 'Tag', untilStart: 'bis zum Start', sinceStart: 'seit Start',
      u: { d: 'Tage', h: 'Std', m: 'Min', s: 'Sek' },
      apTitle: 'AP', apHint: 'Aus deinem letzten AP-Scan', noData: 'Noch kein Scan – im Scanner scannen oder „Aus Scan“ klicken', bottles: 'er Flaschen', apPerDay: 'Geplant pro Tag',
      total: 'Gesamt', lasts: 'Reicht für', days: 'Tage', dayOne: 'Tag',
      speedTitle: 'Speed', speedHint: 'Aus deinem letzten Speedup-Scan',
      cats: { universal: 'Universal', training: 'Ausbildung', healing: 'Heilung', research: 'Forschung', building: 'Bau' },
      trainU: 'Ausbildung + Universal', healU: 'Heilung + Universal',
      crTitle: 'Crystal', crHint: 'Kisten, Echtgeld-Bundles, Kosten · AP & Speed',
      stock: 'Bestand & Ertrag', crStart: 'Kristalle (Bestand)', crChests: 'Kristall-Kisten', chestNote: 'je 100.000',
      crMarch: 'Kristalle pro Sammelmarsch', crMarches: 'Sammelmärsche pro Tag', crOther: 'Sonstiges pro Tag',
      boostOn: '+50 % Minen-Tempo aktiv (Premium Supply)',
      crNow: 'Sofort verfügbar', crDaily: 'Ertrag pro Tag', crDay1: 'Budget Tag 1', crGoal: 'Ziel (aktive Ziele)', crDays: 'Tage bis Ziel',
      crReached: 'Ziel erreicht', crNoIncome: 'Ertrag eintragen', crNoGoal: 'Kosten eintragen',
      fromChests: 'aus Kisten', fromBundles: 'aus Bundles', fromSupply: 'Supply pro Tag',
      goals: 'Kristall-Ziele', goalName: 'z. B. Kristall-Tech', goalCost: 'Kristalle', addGoal: '+ Ziel hinzufügen',
      noGoals: 'Noch keine Ziele. Füge Kristallgebäude oder Technologien mit ihren Kosten hinzu.',
      shop: 'Echtgeld-Bundles', shopHint: 'Haken setzen bzw. Anzahl eintragen, was du kaufst',
      perMil: '$/Mio', times: '×', perDayShort: '/Tag',
      stats: 'Statistik', statsHint: 'Preis pro 1 Mio Kristalle (alle Stufen eines Bundles) – kürzer ist besser',
      maxed: 'Komplett', sel: 'Deine Auswahl', spend: 'Ausgaben', crystals: 'Kristalle', avg: 'Ø Preis',
      best: 'Bestes Angebot', worst: 'Schlechtestes Angebot', nothing: 'Noch nichts ausgewählt',
      budget: 'Budget-Planer', budgetHint: 'Bester Mix für dein Budget (jede Stufe einmal, günstigster $/Mio zuerst)',
      budgetLabel: 'Budget in $', budgetGet: 'Damit bekommst du', budgetLeft: 'Rest', apply: 'Auswahl übernehmen',
      resTitle: 'Resources', resHint: 'Ressourcen-Vorrat (Gesamt)',
      res: { food: 'Nahrung', wood: 'Holz', stone: 'Stein', gold: 'Gold' },
      scan: '↻ Aus Scan', scanFrom: 'Letzter Scan', noScan: 'Noch kein Scan im Scanner',
      reset: 'Alle KvK-Eingaben zurücksetzen', confirmReset: 'Wirklich alle KvK-Eingaben zurücksetzen?', remove: 'Entfernen',
      clearShop: 'Auswahl leeren'
    },
    en: {
      title: 'KvK Start', sub: 'Preparation',
      startLabel: 'KvK start (date)', utcNote: 'KvK always starts at 00:00 UTC', localIs: 'for you',
      countdown: 'KvK Countdown', edit: 'Edit', calTitle: 'KvK calendar', done: 'Done', startShort: 'Start',
      tabs: { start: 'Start', mid: 'Mid', end: 'End' },
      calc: 'Calculation', calcHint: 'Chests, bundles, mine & crystal tech building cost', costMine: 'Crystal mine cost', costTech: 'Crystal tech building cost',
      income: 'Income per day', avail: 'Available', need: 'Needed', diff: 'Difference', chestsNeed: 'Chests needed', chestsUnit: 'chests',
      enough: 'Enough', missingTxt: 'Missing', availTotal: 'Available total', inclSupply: 'incl. Premium Supply', mineTech: 'Mine + tech', bundlesFold: 'Bundles', bundlesHint: 'Real-money offers, statistics & budget planner',
      soon: { mid: 'Planning for the middle of KvK will live here.', end: 'Planning for the end of KvK will live here.' }, soonSub: 'Coming next',
      noStart: 'Set start date', pre: 'Pre-KvK', day: 'Day', untilStart: 'until start', sinceStart: 'since start',
      u: { d: 'Days', h: 'Hrs', m: 'Min', s: 'Sec' },
      apTitle: 'AP', apHint: 'From your last AP scan', noData: 'No scan yet – scan in the scanner or click “From scan”', bottles: ' potions', apPerDay: 'Planned per day',
      total: 'Total', lasts: 'Lasts', days: 'days', dayOne: 'day',
      speedTitle: 'Speed', speedHint: 'From your last speedup scan',
      cats: { universal: 'Universal', training: 'Training', healing: 'Healing', research: 'Research', building: 'Building' },
      trainU: 'Training + Universal', healU: 'Healing + Universal',
      crTitle: 'Crystal', crHint: 'Chests, real-money bundles, costs · AP & speed',
      stock: 'Stock & income', crStart: 'Crystals (stock)', crChests: 'Crystal chests', chestNote: '100,000 each',
      crMarch: 'Crystals per gathering march', crMarches: 'Gathering marches per day', crOther: 'Other per day',
      boostOn: '+50% mine speed active (Premium Supply)',
      crNow: 'Available now', crDaily: 'Income per day', crDay1: 'Day 1 budget', crGoal: 'Goal (active goals)', crDays: 'Days to goal',
      crReached: 'Goal reached', crNoIncome: 'Enter income', crNoGoal: 'Enter costs',
      fromChests: 'from chests', fromBundles: 'from bundles', fromSupply: 'supply per day',
      goals: 'Crystal goals', goalName: 'e.g. crystal tech', goalCost: 'Crystals', addGoal: '+ Add goal',
      noGoals: 'No goals yet. Add crystal buildings or technologies with their cost.',
      shop: 'Real-money bundles', shopHint: 'Tick or enter how many you buy',
      perMil: '$/M', times: '×', perDayShort: '/day',
      stats: 'Statistics', statsHint: 'Price per 1M crystals (all tiers of a bundle) – shorter is better',
      maxed: 'Maxed', sel: 'Your selection', spend: 'Spend', crystals: 'Crystals', avg: 'Avg. price',
      best: 'Best deal', worst: 'Worst deal', nothing: 'Nothing selected yet',
      budget: 'Budget planner', budgetHint: 'Best mix for your budget (each tier once, cheapest $/M first)',
      budgetLabel: 'Budget in $', budgetGet: 'You get', budgetLeft: 'Left', apply: 'Apply selection',
      resTitle: 'Resources', resHint: 'Resource stock (total)',
      res: { food: 'Food', wood: 'Wood', stone: 'Stone', gold: 'Gold' },
      scan: '↻ From scan', scanFrom: 'Last scan', noScan: 'No scan in the scanner yet',
      reset: 'Reset all KvK inputs', confirmReset: 'Really reset all KvK inputs?', remove: 'Remove',
      clearShop: 'Clear selection'
    }
  };
  const lang = () => { try { return localStorage.getItem('lang') === 'en' ? 'en' : 'de'; } catch (e) { return 'de'; } };
  const t = () => I18N[lang()];
  const tx = (v) => (v && typeof v === 'object' ? v[lang()] || v.de : v);
  const locale = () => (lang() === 'en' ? 'en-US' : 'de-DE');

  /* ================================================================== *
   * Konstanten
   * ================================================================== */
  const AP_SIZES = [50, 100, 500, 1000];
  const SPEED_CATS = [
    { k: 'universal', icon: '⏱️' }, { k: 'training', icon: '⚔️' }, { k: 'healing', icon: '❤️' },
    { k: 'research', icon: '📘' }, { k: 'building', icon: '🔨' }
  ];
  const RES = [{ k: 'food', icon: '🌾' }, { k: 'wood', icon: '🪵' }, { k: 'stone', icon: '🪨' }, { k: 'gold', icon: '🪙' }];
  const INPUT = 'w-full bg-ink-950 border border-ink-600 rounded-lg px-2 py-2 text-sm text-right tabular-nums focus:outline-none focus:border-gold-500';
  const INPUT_SM = INPUT.replace('py-2', 'py-1.5');

  /* ================================================================== *
   * State & Speicherung
   * ================================================================== */
  const clone = (o) => JSON.parse(JSON.stringify(o));
  function freshState() {
    return {
      v: 3,
      startDate: '',
      tab: 'start',                                                               // start | mid | end                                                              // YYYY-MM-DD (UTC-Tag, Start 00:00 UTC)
      ap: { b50: 0, b100: 0, b500: 0, b1000: 0, perDay: 0 },
      speed: { universal: 0, training: 0, healing: 0, research: 0, building: 0 },   // Minuten
      crystal: { start: 0, chests: 0, costMine: 0, costTech: 0, perMarch: 0, marches: 0, other: 0 },
      open: { calc: true, bundles: false },                                       // eingeklappte Fenster
      buy: {},                                                                    // Stufen-ID → Anzahl
      budget: 0,
      res: { food: 0, wood: 0, stone: 0, gold: 0 },
      goals: [],
      src: { ap: 0, speed: 0, res: 0 }
    };
  }
  function mergeInto(base, src) {
    if (!src || typeof src !== 'object') return base;
    Object.keys(base).forEach((k) => {
      if (!(k in src)) return;
      const b = base[k], s = src[k];
      if (Array.isArray(b)) { if (Array.isArray(s)) base[k] = s; }
      else if (k === 'buy') { if (s && typeof s === 'object') base[k] = s; }
      else if (b && typeof b === 'object') mergeInto(b, s);
      else if (typeof b === typeof s) base[k] = s;
    });
    return base;
  }

  function ns() {
    try {
      const A = window.RokAuth, p = A && A.current && A.current();
      return p && p.id && A.nsOf ? A.nsOf(p.id) : null;
    } catch (e) { return null; }
  }
  const storageKey = () => { const n = ns(); return n ? n + 'kvk' : 'kvkCalc.v2'; };

  function load() {
    try {
      const raw = localStorage.getItem(storageKey());
      const parsed = raw ? JSON.parse(raw) : null;
      const st = mergeInto(freshState(), parsed);
      // Alte Version: Startzeit als datetime → nur das Datum übernehmen
      if (!st.startDate && parsed && typeof parsed.start === 'string' && /^\d{4}-\d{2}-\d{2}/.test(parsed.start)) st.startDate = parsed.start.slice(0, 10);
      st.goals = (st.goals || []).filter((g) => g && typeof g === 'object').map((g) => ({
        id: String(g.id || uid()), name: String(g.name || ''), cost: +g.cost || 0, on: g.on !== false
      }));
      Object.keys(st.buy).forEach((k) => { st.buy[k] = Math.max(0, +st.buy[k] || 0); if (!st.buy[k]) delete st.buy[k]; });
      return st;
    } catch (e) { return freshState(); }
  }

  let state = freshState();
  let notifyT = null;
  function save() {
    try { localStorage.setItem(storageKey(), JSON.stringify(state)); } catch (e) { /* voll/blockiert */ }
    clearTimeout(notifyT);
    notifyT = setTimeout(() => {
      try { if (ns() && window.RokAuth && window.RokAuth.changed) window.RokAuth.changed(); } catch (e) { /* ignorieren */ }
      window.dispatchEvent(new CustomEvent('kvkcalc:change', { detail: clone(state) }));
    }, 400);
  }

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
  function setPath(o, p, v) {
    const ks = p.split('.'), last = ks.pop();
    const tgt = ks.reduce((a, k) => (a[k] == null ? (a[k] = {}) : a[k]), o);
    tgt[last] = v;
  }

  /* ================================================================== *
   * Scanner-Daten
   * ================================================================== */
  function lastScan(type) {
    const n = ns();
    if (!n) return null;
    try { const v = JSON.parse(localStorage.getItem(n + 'last_scan_' + type) || 'null'); return v && typeof v === 'object' ? v : null; }
    catch (e) { return null; }
  }
  const SCAN_TYPE = { ap: 'ap', speed: 'speedups', res: 'resources' };

  function importScan(part) {
    const s = lastScan(SCAN_TYPE[part]);
    if (!s) return false;
    if (part === 'ap') AP_SIZES.forEach((z) => (state.ap['b' + z] = Math.max(0, Math.round(+s['ap_' + z] || 0))));
    if (part === 'speed') SPEED_CATS.forEach((c) => (state.speed[c.k] = Math.max(0, Math.round(+s[c.k] || 0))));
    if (part === 'res') {
      const bar = (s.resources && s.resources.bar) || {};
      RES.forEach((r) => (state.res[r.k] = Math.max(0, Math.round(+bar[r.k] || 0))));
    }
    state.src[part] = +s.ts || Date.now();
    return true;
  }
  function autoImport() {
    let changed = false;
    ['ap', 'speed'].forEach((p) => {
      const s = lastScan(SCAN_TYPE[p]);
      if (s && (+s.ts || 0) > (state.src[p] || 0) && importScan(p)) changed = true;
    });
    const empty = {
      ap: AP_SIZES.every((z) => !state.ap['b' + z]),
      speed: SPEED_CATS.every((c) => !state.speed[c.k]),
      res: RES.every((r) => !state.res[r.k])
    };
    Object.keys(empty).forEach((p) => { if (empty[p] && !state.src[p] && importScan(p)) changed = true; });
    if (changed) save();
  }

  /* ================================================================== *
   * Zahlen
   * ================================================================== */
  function parseNum(raw) {
    if (raw == null) return 0;
    const s = String(raw).trim().toLowerCase().replace(/\s+/g, '').replace(/^\$/, '')
      .replace(/mio\.?$/, 'm').replace(/mrd\.?$/, 'b').replace(/%$/, '');
    if (!s) return 0;
    const m = s.match(/^([\d.,]+)([kmb])?$/);
    if (!m) return 0;
    let num = m[1];
    const suf = m[2];
    if (/[.,]/.test(num)) {
      const i = Math.max(num.lastIndexOf('.'), num.lastIndexOf(','));
      const head = num.slice(0, i).replace(/[.,]/g, ''), tail = num.slice(i + 1);
      num = (!suf && tail.length === 3) ? head + tail : head + '.' + tail;
    }
    let v = parseFloat(num);
    if (!Number.isFinite(v)) return 0;
    v *= suf === 'k' ? 1e3 : suf === 'm' ? 1e6 : suf === 'b' ? 1e9 : 1;
    return Math.max(0, v);
  }
  const fmt = (n, d = 0) => (Number.isFinite(n) ? n.toLocaleString(locale(), { maximumFractionDigits: d }) : '∞');
  const usd = (n) => '$' + (Number.isFinite(n) ? n.toLocaleString(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '∞');
  function short(n) {
    if (!Number.isFinite(n)) return '∞';
    const en = lang() === 'en';
    if (n >= 1e9) return fmt(n / 1e9, 2) + (en ? ' B' : ' Mrd.');
    if (n >= 1e6) return fmt(n / 1e6, 2) + (en ? ' M' : ' Mio.');
    if (n >= 1e5) return fmt(n / 1e3, 0) + (en ? ' K' : ' Tsd.');
    return fmt(n);
  }
  function dur(min) {
    if (!Number.isFinite(min)) return '∞';
    min = Math.round(Math.max(0, min));
    const d = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60), m = min % 60;
    const en = lang() === 'en';
    if (d) return en ? `${fmt(d)}d ${h}h` : `${fmt(d)} T ${h} Std`;
    if (h) return en ? `${h}h ${m}m` : `${h} Std ${m} Min`;
    return en ? `${m}m` : `${m} Min`;
  }
  const dateLabel = (ts) => new Date(ts).toLocaleString(locale(), { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inVal = (n, d = 0) => (n ? fmt(n, d) : '');

  /* ================================================================== *
   * Zeit: KvK startet immer 00:00 UTC am gewählten Datum
   * ================================================================== */
  function startTs() {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(state.startDate || '');
    return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], 0, 0, 0) : null;
  }
  function phase() {
    const ts = startTs();
    if (ts == null) return null;
    const diff = ts - Date.now();
    return { ts, before: diff > 0, ms: Math.abs(diff), day: diff > 0 ? 0 : Math.floor(-diff / 86400000) + 1 };
  }

  /* ================================================================== *
   * Berechnungen
   * ================================================================== */
  function shopCalc(buy) {
    let usdSum = 0, crNow = 0, supplyPerDay = 0, supplyTotal = 0, mineBoost = 0, items = 0;
    ALL_TIERS.forEach((tr) => {
      const q = buy[tr.id] || 0;
      if (!q) return;
      items += q;
      usdSum += tr.usd * q;
      if (tr.perDay) { supplyPerDay += tr.perDay * q; supplyTotal += tr.cr * q; mineBoost = Math.max(mineBoost, tr.mineBoost || 0); }
      else crNow += tr.cr * q;
    });
    const crTotal = crNow + supplyTotal;
    return { usd: usdSum, crNow, supplyPerDay, supplyTotal, crTotal, mineBoost, items, perMil: perMil(usdSum, crTotal) };
  }

  function bundleStats() {
    return BUNDLES.map((b) => {
      const u = b.tiers.reduce((a, x) => a + x.usd, 0), c = b.tiers.reduce((a, x) => a + x.cr, 0);
      return { b, usd: u, cr: c, pm: perMil(u, c) };
    }).sort((a, z) => a.pm - z.pm);
  }

  // Budget-Planer: Stufen nach $/Mio sortiert, jede einmal, solange das Budget reicht
  function budgetPlan(budget) {
    const sorted = ALL_TIERS.slice().sort((a, z) => perMil(a.usd, a.cr) - perMil(z.usd, z.cr));
    let left = budget, cr = 0;
    const pick = {};
    sorted.forEach((tr) => { if (tr.usd <= left + 1e-9) { left -= tr.usd; cr += tr.cr; pick[tr.id] = 1; } });
    return { pick, cr, spent: budget - left, left, count: Object.keys(pick).length };
  }

  function calc() {
    const ap = state.ap;
    const apTotal = AP_SIZES.reduce((a, z) => a + (ap['b' + z] || 0) * z, 0);
    const apDays = ap.perDay > 0 ? apTotal / ap.perDay : null;

    const sp = state.speed;
    const spTotal = SPEED_CATS.reduce((a, c) => a + (sp[c.k] || 0), 0);

    const c = state.crystal;
    const shop = shopCalc(state.buy);
    const chestCr = c.chests * CHEST_CRYSTALS;
    const mine = c.perMarch * c.marches * (1 + shop.mineBoost);
    const daily = mine + c.other + shop.supplyPerDay;
    const now = chestCr + shop.crTotal;
    const goal = (c.costMine || 0) + (c.costTech || 0);
    const remaining = Math.max(0, goal - now);
    const daysToGoal = goal <= 0 ? null : remaining === 0 ? 0 : daily > 0 ? Math.ceil(remaining / daily) : Infinity;

    return {
      apTotal, apDays,
      spTotal, trainU: sp.training + sp.universal, healU: sp.healing + sp.universal,
      shop, chestCr, mine, daily, now, day1: now + daily, goal, remaining, daysToGoal,
      diff: now - goal, chestsNeeded: Math.ceil(remaining / CHEST_CRYSTALS),
      crPct: goal > 0 ? Math.min(100, (now / goal) * 100) : 0
    };
  }

  /* ================================================================== *
   * Bausteine
   * ================================================================== */
  const row = (label, path, val, opts = {}) => `
    <label class="grid grid-cols-[1fr_120px] items-center gap-2 text-sm">
      <span class="text-slate-300">${label}</span>
      <input type="text" inputmode="decimal" autocomplete="off" data-path="${path}" ${opts.unit ? `data-unit="${opts.unit}"` : ''}
             value="${esc(val)}" placeholder="0" class="${INPUT}">
    </label>`;

  const sumBox = (label, value, sub) => `
    <div class="rounded-lg border border-gold-500/30 bg-gold-500/5 px-3 py-2">
      <div class="flex items-center justify-between gap-3">
        <span class="text-xs uppercase tracking-widest text-slate-400">${label}</span>
        <span class="text-lg font-extrabold text-gold-300 tabular-nums">${value}</span>
      </div>
      ${sub ? `<div class="text-xs text-slate-400 text-right mt-0.5">${sub}</div>` : ''}
    </div>`;

  const line = (label, value, cls = 'text-slate-100') => `
    <div class="flex items-center justify-between gap-3 text-sm py-1 border-b border-ink-700/60 last:border-0">
      <span class="text-slate-400">${label}</span><span class="font-semibold tabular-nums text-right ${cls}">${value}</span>
    </div>`;

  const kpi = (label, value, sub) => `
    <div class="rounded-xl bg-ink-950 border border-ink-700 px-3 py-2.5">
      <div class="text-[10px] uppercase tracking-widest text-slate-500">${label}</div>
      <div class="text-lg font-extrabold text-slate-100 tabular-nums mt-0.5">${value}</div>
      ${sub ? `<div class="text-xs text-slate-500">${sub}</div>` : ''}
    </div>`;

  const ratingBadge = (pm) => {
    const r = rating(pm);
    return `<span class="inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${r.cls}">${r.key}</span>`;
  };

  const subTitle = (txt) => `<div class="text-xs uppercase tracking-widest text-slate-400">${txt}</div>`;

  function tileHead(icon, title, hint, scanPart) {
    let scan = '';
    if (scanPart) {
      const has = !!lastScan(SCAN_TYPE[scanPart]);
      const src = state.src[scanPart];
      scan = `<button type="button" data-scan="${scanPart}" ${has ? '' : 'disabled'} title="${has ? '' : t().noScan}"
                class="shrink-0 text-xs px-2.5 py-1 rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300 disabled:opacity-40 disabled:pointer-events-none">${t().scan}</button>`;
      hint += src ? ` · <span class="text-slate-500">${t().scanFrom}: ${dateLabel(src)}</span>` : '';
    }
    return `
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="font-display text-lg text-gold-300">${icon} ${title}</h3>
            <p data-hint class="text-xs text-slate-400 mt-0.5">${hint}</p>
          </div>
          ${scan}
        </div>`;
  }

  /* ================================================================== *
   * Ansicht
   * ================================================================== */
  function viewHTML() {
    const L = t();

    // ---- Zeit (kompakt, LED-Uhr) ----
    const timePanel = `
      <section class="kvk-time panel relative overflow-hidden rounded-2xl px-4 pt-4 sm:pt-5 pb-[72px] sm:pb-20">
        <div class="kvk-flame-glow" aria-hidden="true"></div>
        <canvas data-flames class="kvk-flames" aria-hidden="true"></canvas>
        <div class="relative z-10 flex flex-col items-center text-center gap-2.5">
          <div class="font-display text-sm sm:text-base uppercase tracking-[.3em] text-gold-300/90">${L.countdown}</div>
          <div data-phase></div>
          <div data-countdown class="max-w-full overflow-x-auto"></div>
          <div data-startline class="text-xs text-slate-500"></div>
        </div>
      </section>`;

    // ---- Kalender-Editor (über den Edit-Knopf) ----
    const editor = `
      <div data-editor class="${editOpen ? '' : 'hidden'} absolute right-0 top-11 z-30 w-72 max-w-[calc(100vw-2rem)] panel !bg-ink-900 rounded-xl p-4 text-left shadow-2xl ui-pop">
        <div class="text-xs uppercase tracking-widest text-gold-300 mb-2">📅 ${L.calTitle}</div>
        <label class="flex flex-col gap-1.5 text-xs text-slate-400">
          <span>${L.startLabel}</span>
          <input type="date" data-path="startDate" data-kind="raw" value="${esc(state.startDate)}"
                 class="w-full bg-ink-950 border border-ink-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-gold-500 [color-scheme:dark]">
          <span data-utc class="text-slate-500 leading-snug"></span>
        </label>
        <button type="button" data-edit-done class="mt-3 w-full py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-ink-950 font-semibold text-sm">${L.done}</button>
      </div>`;

    // ---- Seiten-Umschalter ----
    const TAB_ICONS = { start: '🚀', mid: '⚔️', end: '🏁' };
    const tabs = `
      <div class="grid grid-cols-3 gap-1 p-1 rounded-xl bg-ink-950 border border-ink-700" role="tablist">
        ${['start', 'mid', 'end'].map((k) => `<button type="button" role="tab" data-ktab="${k}" aria-pressed="${state.tab === k}"
            class="seg-btn rounded-lg py-3 px-1 text-sm sm:text-base font-semibold transition">${TAB_ICONS[k]} ${L.tabs[k]}</button>`).join('')}
      </div>`;

    // ---- Klappfenster ----
    const fold = (key, icon, title, hint, body) => `
      <details data-fold="${key}" class="kvk-fold rounded-xl border border-ink-700 bg-ink-950/50" ${state.open[key] ? 'open' : ''}>
        <summary class="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer list-none">
          <span class="min-w-0">
            <span class="block font-semibold text-slate-100">${icon} ${title}</span>
            <span class="block text-xs text-slate-500 truncate">${hint}</span>
          </span>
          <span data-fsum="${key}" class="ml-auto shrink-0 text-xs sm:text-sm font-semibold tabular-nums text-right"></span>
        </summary>
        <div class="px-4 pb-4 pt-1 border-t border-ink-700/70">${body}</div>
      </details>`;

    // ---- AP / Speed (unten im Crystal-Feld) ----
    const card = (inner) => `<div class="rounded-xl border border-ink-700 bg-ink-950/50 p-4 flex flex-col gap-4">${inner}</div>`;
    const apTile = card(`${tileHead('🧪', L.apTitle, L.apHint, 'ap')}<div data-out="ap" class="mt-auto"></div>`);
    const speedTile = card(`${tileHead('⏱️', L.speedTitle, L.speedHint, 'speed')}<div data-out="speed" class="mt-auto"></div>`);

    // ---- Berechnung ----
    const field = (label, path, val) => `
      <label class="flex flex-col gap-1 text-xs text-slate-400">
        <span>${label}</span>
        <input type="text" inputmode="decimal" autocomplete="off" data-path="${path}" value="${esc(val)}" placeholder="0" class="${INPUT}">
      </label>`;
    const calcBody = `
      <div class="flex flex-col gap-4 pt-3">
        <div class="grid gap-3 sm:grid-cols-3">
          ${field(`📦 ${L.crChests} <span class="text-slate-500">× ${L.chestNote}</span>`, 'crystal.chests', inVal(state.crystal.chests))}
          ${field('⛏️ ' + L.costMine, 'crystal.costMine', inVal(state.crystal.costMine))}
          ${field('🏛️ ' + L.costTech, 'crystal.costTech', inVal(state.crystal.costTech))}
        </div>
        <div data-out="crystal"></div>
      </div>`;

    // ---- Bundles ----
    const bundlesBody = `
      <div class="flex flex-col gap-4 pt-3">
        <div class="flex items-end justify-between gap-3">
          <p class="text-xs text-slate-500">${L.shopHint}</p>
          <button type="button" data-shop-clear class="text-xs text-slate-500 hover:text-red-300 underline shrink-0">${L.clearShop}</button>
        </div>
        <div class="kvk-masonry">${BUNDLES.map(bundleCard).join('')}</div>
        <div data-out="shop"></div>
        <div class="border-t border-ink-700 pt-4 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div class="flex flex-col gap-3">
            <div>${subTitle('📊 ' + L.stats)}<p class="text-xs text-slate-500 mt-0.5">${L.statsHint}</p></div>
            <div data-out="stats"></div>
          </div>
          <div class="flex flex-col gap-3">
            <div>${subTitle('🧮 ' + L.budget)}<p class="text-xs text-slate-500 mt-0.5">${L.budgetHint}</p></div>
            ${row('💵 ' + L.budgetLabel, 'budget', state.budget ? fmt(state.budget, 2) : '')}
            <div data-out="budget"></div>
          </div>
        </div>
      </div>`;

    // ---- Crystal (volle Breite): Berechnung · Bundles · AP/Speed ----
    const crystalTile = `
      <section class="panel rounded-2xl p-5 flex flex-col gap-4">
        ${tileHead('💎', L.crTitle, L.crHint, null)}
        ${fold('calc', '🧮', L.calc, L.calcHint, calcBody)}
        ${fold('bundles', '🛒', L.bundlesFold, L.bundlesHint, bundlesBody)}
        <div class="grid gap-4 md:grid-cols-2">
          ${apTile}
          ${speedTile}
        </div>
      </section>`;

    // ---- Resources (volle Breite) ----
    const resTile = `
      <section class="panel rounded-2xl p-5 flex flex-col gap-4">
        ${tileHead('📦', L.resTitle, L.resHint, 'res')}
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          ${RES.map((r) => `
            <label class="flex flex-col gap-1 text-xs text-slate-400">
              <span>${r.icon} ${L.res[r.k]}</span>
              <input type="text" inputmode="decimal" autocomplete="off" data-path="res.${r.k}" value="${esc(inVal(state.res[r.k]))}" placeholder="0" class="${INPUT}">
            </label>`).join('')}
        </div>
      </section>`;

    return `
      <div class="space-y-5">
        <header class="relative text-center py-1 px-12 sm:px-28">
          <h2 class="wiz-title font-display text-3xl sm:text-4xl font-extrabold tracking-wide">${L.title}</h2>
          <p class="text-[11px] uppercase tracking-[.35em] text-slate-500 mt-1">${L.sub}</p>
          <button type="button" data-edit aria-expanded="${editOpen}" title="${L.edit}" aria-label="${L.edit}"
            class="absolute right-0 top-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300 text-xs sm:text-sm">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>
            <span class="hidden sm:inline">${L.edit}</span>
          </button>
          ${editor}
        </header>
        ${timePanel}
        ${tabs}
        ${state.tab === 'start' ? `
        ${crystalTile}
        ${resTile}
        <div class="text-right">
          <button type="button" data-reset class="text-xs text-slate-500 hover:text-red-300 underline">${L.reset}</button>
        </div>` : `
        <section class="panel rounded-2xl p-10 text-center">
          <div class="text-4xl mb-3">${TAB_ICONS[state.tab]}</div>
          <h3 class="font-display text-xl text-gold-300">KvK ${L.tabs[state.tab]}</h3>
          <p class="text-sm text-slate-400 mt-2">${L.soon[state.tab]}</p>
          <p class="text-[11px] uppercase tracking-widest text-slate-600 mt-4">${L.soonSub}</p>
        </section>`}
      </div>`;
  }

  function bundleCard(b) {
    const L = t();
    const tiersHTML = b.tiers.map((tr) => {
      const q = state.buy[tr.id] || 0, pm = perMil(tr.usd, tr.cr);
      const ctrl = b.kind === 'repeat'
        ? `<input type="text" inputmode="numeric" data-buy="${tr.id}" value="${q || ''}" placeholder="0" title="${tx(b.unit)}" class="${INPUT_SM} !w-16">`
        : `<input type="checkbox" data-buy="${tr.id}" ${q ? 'checked' : ''} class="w-4 h-4 accent-[#e0a91b]">`;
      const crTxt = tr.perDay ? `${short(tr.perDay)}${L.perDayShort} · ${short(tr.cr)}` : short(tr.cr);
      return `
        <label class="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-ink-800/60 cursor-pointer ${q ? 'bg-gold-500/5' : ''}">
          ${ctrl}
          <span class="min-w-0">
            <span class="block text-sm text-slate-200 truncate">${esc(tx(tr.label))}</span>
            <span class="block text-xs text-slate-500 tabular-nums">${usd(tr.usd)} · ${crTxt} 💎</span>
          </span>
          <span class="text-right">
            <span class="block text-xs tabular-nums text-slate-300">${usd(pm)} <span class="text-slate-500">/ Mio</span></span>
            ${ratingBadge(pm)}
          </span>
        </label>`;
    }).join('');
    return `
      <details class="rounded-xl border border-ink-700 bg-ink-950/60 open:border-ink-600" ${b.tiers.some((x) => state.buy[x.id]) || b.id === 'psup' ? 'open' : ''}>
        <summary class="flex items-center justify-between gap-3 px-3 py-2.5 cursor-pointer list-none">
          <span class="min-w-0">
            <span class="block text-sm font-semibold text-slate-100">${esc(b.name)}</span>
            <span class="block text-xs text-slate-500 truncate">${esc(tx(b.info))}${b.kind === 'repeat' ? ` · ${L.times} ${tx(b.unit)}` : ''}</span>
          </span>
          <span data-bsum="${b.id}" class="shrink-0 text-xs text-gold-300 tabular-nums"></span>
        </summary>
        <div class="px-1.5 pb-2 space-y-0.5">${tiersHTML}</div>
      </details>`;
  }

  /* ----- Ausgaben ----- */
  function outputs(r) {
    const L = t();

    // Crystal-Berechnung
    const ok = r.goal > 0 && r.diff >= 0;
    const diffTxt = r.goal <= 0 ? '—' : `<span class="${ok ? 'text-emerald-400' : 'text-red-300'}">${ok ? '+' : '−'}${short(Math.abs(r.diff))}</span>`;
    const chestTxt = r.goal <= 0 ? '—' : r.chestsNeeded === 0 ? `<span class="text-emerald-400">✓ 0</span>` : `<span class="text-red-300">${fmt(r.chestsNeeded)}</span>`;
    const crBar = r.goal > 0 ? `
      <div class="mt-2 h-2 rounded-full bg-ink-800 overflow-hidden" title="${fmt(r.crPct, 1)} %">
        <div class="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-300 transition-all" style="width:${r.crPct.toFixed(1)}%"></div>
      </div>` : '';
    const crystal = `
      <div class="grid gap-2 grid-cols-2">
        ${kpi('📦 ' + L.fromChests, short(r.chestCr), `${fmt(state.crystal.chests)} × ${L.chestNote}`)}
        ${kpi('🛒 ' + L.fromBundles, short(r.shop.crTotal), r.shop.supplyTotal ? L.inclSupply : '')}
        <div class="col-span-2">${sumBox('💎 ' + L.availTotal, short(r.now) + ' 💎')}</div>
      </div>
      <div class="grid gap-2 grid-cols-3 mt-3">
        ${kpi('🏛️ ' + L.need, r.goal > 0 ? short(r.goal) : '—', L.mineTech)}
        ${kpi('⚖️ ' + L.diff, diffTxt, r.goal > 0 ? (ok ? L.enough : L.missingTxt) : '')}
        ${kpi('📦 ' + L.chestsNeed, chestTxt, `× ${L.chestNote}`)}
      </div>
      ${crBar}`;

    // Kurzinfo in den Klappfenster-Köpfen (sichtbar auch eingeklappt)
    const fsum = {
      calc: r.goal <= 0 ? `<span class="text-slate-500">${short(r.now)} 💎</span>`
        : ok ? `<span class="text-emerald-400">✓ ${L.enough} · +${short(r.diff)}</span>`
        : `<span class="text-red-300">${L.missingTxt} ${short(-r.diff)} · ${fmt(r.chestsNeeded)} ${L.chestsUnit}</span>`,
      bundles: r.shop.items ? `<span class="text-gold-300">${usd(r.shop.usd)} · ${short(r.shop.crTotal)} 💎</span>` : ''
    };

    // Auswahl-Zusammenfassung
    const s = r.shop;
    const shop = s.items
      ? `<div class="grid grid-cols-3 gap-2">
           ${kpi(L.spend, usd(s.usd))}
           ${kpi(L.crystals, short(s.crTotal), s.supplyTotal ? `${short(s.supplyPerDay)}${L.perDayShort}` : '')}
           ${kpi(L.avg, `${usd(s.perMil)}`, `/ Mio · ${rating(s.perMil).key}`)}
         </div>`
      : `<p class="text-xs text-slate-500 text-center py-2">${L.nothing}</p>`;

    // Statistik: $/Mio je Bundle (komplett), sortiert
    const st = bundleStats();
    const maxPm = Math.max(...st.map((x) => x.pm));
    const stats = `
      <div class="space-y-2.5" role="list">
        ${st.map((x) => {
          const rt = rating(x.pm), w = Math.max(3, (x.pm / maxPm) * 100);
          const selCr = x.b.tiers.reduce((a, tr) => a + (state.buy[tr.id] || 0) * tr.cr, 0);
          const tip = `${x.b.name}: ${usd(x.usd)} → ${fmt(x.cr)} 💎 = ${usd(x.pm)} / Mio (${rt.key})`;
          return `
          <div role="listitem" class="group" title="${esc(tip)}">
            <div class="flex items-baseline justify-between gap-3 text-sm">
              <span class="text-slate-200 truncate">${esc(x.b.name)}</span>
              <span class="shrink-0 tabular-nums text-slate-300 font-semibold">${usd(x.pm)} <span class="text-xs text-slate-500 font-normal">/ Mio</span> ${ratingBadge(x.pm)}</span>
            </div>
            <div class="mt-1 h-2.5 rounded bg-ink-800 overflow-hidden">
              <div class="h-full rounded transition-all group-hover:brightness-110" style="width:${w.toFixed(1)}%;background:${rt.bar}"></div>
            </div>
            <div class="mt-0.5 text-[11px] text-slate-500 tabular-nums">${L.maxed}: ${usd(x.usd)} → ${short(x.cr)} 💎${selCr ? ` · <span class="text-gold-300">${L.sel}: ${short(selCr)}</span>` : ''}</div>
          </div>`;
        }).join('')}
      </div>
      <div class="grid grid-cols-2 gap-2 mt-3">
        ${kpi('🏆 ' + L.best, esc(st[0].b.name), `${usd(st[0].pm)} / Mio`)}
        ${kpi('⚠️ ' + L.worst, esc(st[st.length - 1].b.name), `${usd(st[st.length - 1].pm)} / Mio`)}
      </div>`;

    // Budget-Planer
    let budget = '';
    if (state.budget > 0) {
      const p = budgetPlan(state.budget);
      budget = `
        ${line(L.budgetGet, `${short(p.cr)} 💎`, 'text-gold-300')}
        ${line(L.spend, `${usd(p.spent)} · ${p.count}×`)}
        ${line(L.budgetLeft, usd(p.left), 'text-slate-400')}
        ${line(L.avg, `${usd(perMil(p.spent, p.cr))} / Mio`)}
        <button type="button" data-budget-apply ${p.count ? '' : 'disabled'}
          class="mt-2 w-full py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-ink-950 font-semibold text-sm disabled:opacity-40">${L.apply}</button>`;
    }

    return {
      ap: state.src.ap || r.apTotal ? sumBox(L.total, `${short(r.apTotal)} AP`) : `<p class="text-xs text-slate-500">${L.noData}</p>`,
      speed: state.src.speed || r.spTotal
        ? `${line(L.trainU, dur(r.trainU))}${line(L.healU, dur(r.healU))}<div class="mt-3">${sumBox(L.total, dur(r.spTotal))}</div>`
        : `<p class="text-xs text-slate-500">${L.noData}</p>`,
      crystal, shop, stats, budget, _fsum: fsum
    };
  }

  /* ----- Countdown & Phase ----- */
  function renderClock() {
    if (!root) return;
    const L = t(), ph = phase();
    const phEl = root.querySelector('[data-phase]'), cdEl = root.querySelector('[data-countdown]');
    const utcEl = root.querySelector('[data-utc]'), lineEl = root.querySelector('[data-startline]');
    if (!phEl || !cdEl) return;
    const badge = (txt, cls) => `<span class="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full border ${cls}">${txt}</span>`;

    if (!ph) {
      phEl.innerHTML = badge('🕒 ' + L.noStart, 'border-ink-600 text-slate-400');
      fireClock(cdEl, 0, true);
      if (utcEl) utcEl.textContent = L.utcNote;
      if (lineEl) lineEl.textContent = L.utcNote;
      return;
    }
    phEl.innerHTML = ph.before
      ? badge('⏳ ' + L.pre, 'border-gold-500/40 text-gold-300 bg-gold-500/5')
      : badge(`⚔️ KvK · ${L.day} ${fmt(ph.day)}`, 'border-red-400/40 text-red-300 bg-red-500/10');
    fireClock(cdEl, ph.ms, false);
    const local = new Date(ph.ts).toLocaleString(locale(), { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    if (lineEl) lineEl.innerHTML = `${ph.before ? L.untilStart : L.sinceStart} · ${L.startShort}: <span class="text-slate-300">${local}</span> (00:00 UTC)`;
    if (utcEl) {
      const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return ''; } })();
      utcEl.innerHTML = `00:00 UTC = <span class="text-slate-300">${local}</span> ${L.localIs}${tz ? ` (${esc(tz)})` : ''}`;
    }
  }

  // Feuer-Countdown: 4 Kacheln. Aufbau einmalig, danach nur Zahlen tauschen –
  // so laufen die Flacker-Animationen ohne Neustart jede Sekunde weiter.
  function fireClock(el, ms, dim) {
    const L = t(), s = Math.floor(ms / 1000);
    const vals = [Math.floor(s / 86400), Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60]
      .map((v) => String(v).padStart(2, '0'));
    const labs = [L.u.d, L.u.h, L.u.m, L.u.s];
    let wrap = el.querySelector('.kvk-fire-wrap');
    if (!wrap || wrap.dataset.lang !== lang()) {
      el.innerHTML = `<div class="kvk-fire-wrap" role="timer" data-lang="${lang()}">${labs.map((lab, i) => `
        <div class="kvk-fire-tile">
          <span class="kvk-fire" data-v=""></span>
          <span class="kvk-fire-lab">${lab}</span>
        </div>`).join('')}</div>`;
      wrap = el.querySelector('.kvk-fire-wrap');
    }
    wrap.classList.toggle('is-dim', !!dim);
    wrap.setAttribute('aria-label', vals.map((v, i) => `${+v} ${labs[i]}`).join(', '));
    wrap.querySelectorAll('.kvk-fire').forEach((n, i) => {
      if (n.dataset.v !== vals[i]) { n.dataset.v = vals[i]; n.textContent = vals[i]; }
    });
  }

  /* ================================================================== *
   * Rendering & Events
   * ================================================================== */
  let root = null, modal = null, lastFocus = null, clock = null, editOpen = false;

  function render() {
    if (!root) return;
    state = load();
    autoImport();
    rerender();
    startClock();
  }
  function rerender() {
    if (!root) return;
    if (!['start', 'mid', 'end'].includes(state.tab)) state.tab = 'start';
    root.setAttribute('translate', 'no');      // eigene DE/EN-Texte – nicht vom Seiten-Übersetzer anfassen
    root.innerHTML = viewHTML();
    refresh();
    renderClock();
  }
  function refresh() {
    if (!root) return;
    const out = outputs(calc());
    Object.keys(out).forEach((k) => { const el = root.querySelector(`[data-out="${k}"]`); if (el) el.innerHTML = out[k]; });
    Object.keys(out._fsum).forEach((k) => { const el = root.querySelector(`[data-fsum="${k}"]`); if (el) el.innerHTML = out._fsum[k]; });
    // Summe je Bundle in der Kopfzeile
    BUNDLES.forEach((b) => {
      const el = root.querySelector(`[data-bsum="${b.id}"]`);
      if (!el) return;
      const u = b.tiers.reduce((a, tr) => a + (state.buy[tr.id] || 0) * tr.usd, 0);
      const c = b.tiers.reduce((a, tr) => a + (state.buy[tr.id] || 0) * tr.cr, 0);
      el.innerHTML = u ? `${usd(u)} · ${short(c)} 💎` : '';
    });
  }

  const visible = () => root && root.offsetParent !== null;
  function startClock() {
    if (clock) return;
    clock = setInterval(() => { if (visible()) renderClock(); }, 1000);
    startFlames();
  }

  /* ----- Flammen am unteren Rand des Timer-Felds (Canvas-Partikel) ----- */
  let flamesOn = false, parts = [], lastT = 0;
  const SPRITES = {};
  function sprite(rgb) {
    if (SPRITES[rgb]) return SPRITES[rgb];
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(0.35, `rgba(${rgb},.55)`); g.addColorStop(1, `rgba(${rgb},0)`);
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return (SPRITES[rgb] = c);
  }
  // Farbe je nach Lebensalter: weiß-heiß an der Basis → gelb → orange → dunkelrot an der Spitze
  const STAGES = [[0.1, '255,244,214'], [0.28, '255,206,72'], [0.5, '255,140,22'], [0.75, '235,72,4'], [1, '150,24,0']];
  // Glatte Pseudo-Zufallskurve (Summe von Sinuswellen) für unruhiges, aber weiches Flackern
  const noise = (t, sd) => 0.5 + 0.22 * Math.sin(t * 1.7 + sd) + 0.16 * Math.sin(t * 3.3 + sd * 1.7) + 0.12 * Math.sin(t * 7.9 + sd * 2.3);
  let emitters = [], emW = 0;
  function setupEmitters(w) {
    const n = Math.max(6, Math.round(w / 38));
    emitters = Array.from({ length: n }, (_, i) => ({
      x: ((i + 0.5) * w) / n + (Math.random() - 0.5) * 18, sd: Math.random() * 1000, size: 0.7 + Math.random() * 0.75
    }));
    emW = w;
  }

  function startFlames() {
    if (flamesOn) return;
    try { if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) { /* egal */ }
    flamesOn = true;
    const tick = (ts) => {
      const cv = root && root.querySelector('canvas[data-flames]');
      if (!cv || !visible() || document.hidden) { parts = []; lastT = 0; setTimeout(() => requestAnimationFrame(tick), 400); return; }
      drawFlames(cv, ts);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function drawFlames(cv, ts) {
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    if (Math.abs(emW - w) > 8) setupEmitters(w);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const dt = lastT ? Math.min(3, (ts - lastT) / 16.7) : 1;
    lastT = ts;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);

    const ph = phase();
    const heat = !ph ? 0.3 : ph.before ? 1 : 1.2;   // ohne Datum nur Glut, im KvK stärker
    const sc = h / 90, t = ts / 1000;
    const gust = Math.sin(t * 0.7) * 0.5 + Math.sin(t * 1.9) * 0.25;   // gemeinsamer Luftzug

    // Jede Flammenzunge hat ihr eigenes Flacker-Tempo → die Flammen „ticken“ unabhängig
    for (const e of emitters) {
      const it = Math.max(0, noise(t * 1.6, e.sd)) * heat;
      e.it = it;
      const n = it * 2.2 * dt;
      for (let k = 0; k < n; k++) {
        if (k + 1 > n && Math.random() > n % 1) break;
        const off = (Math.random() + Math.random() - 1) * 26 * sc;
        parts.push({ ex: e.x + off * 0.35, x: e.x + off, y: h + 3 * sc,
          vx: (Math.random() - 0.5) * 0.25, vy: -(0.9 + Math.random() * 1.1) * sc * (0.65 + it * 0.7),
          r: (10 + Math.random() * 9) * sc * e.size * (0.8 + it * 0.4), life: 0, dur: 26 + Math.random() * 22 + it * 14, spark: false });
      }
      // Funken aus besonders heißen Zungen
      if (it > 0.75 && Math.random() < 0.035 * dt) {
        parts.push({ ex: e.x, x: e.x, y: h - 6 * sc, vx: (Math.random() - 0.5) * 0.8, vy: -(1.8 + Math.random() * 1.8) * sc,
          r: (1.1 + Math.random() * 1.4) * sc, life: 0, dur: 60 + Math.random() * 60, spark: true });
      }
    }

    ctx.globalCompositeOperation = 'lighter';
    // Glutbett am Boden
    const bed = ctx.createLinearGradient(0, h, 0, h - 16 * sc);
    bed.addColorStop(0, `rgba(255,120,20,${0.55 * Math.min(1, heat)})`); bed.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = bed; ctx.fillRect(0, h - 16 * sc, w, 16 * sc);

    const keep = [];
    for (const p of parts) {
      p.life += dt / p.dur;
      if (p.life >= 1 || p.y < -20) continue;
      const up = 1 - p.y / h;                                     // weiter oben = mehr Verwirbelung
      if (p.spark) {
        p.vx += (Math.sin(t * 3 + p.ex) * 0.04 + gust * 0.01) * dt;
      } else {
        p.vx += ((p.ex - p.x) * 0.0045 + gust * 0.014 * up) * dt;  // zur Zungenmitte ziehen → spitze Flammen
        p.vy -= 0.012 * sc * dt;                                   // heiße Luft beschleunigt nach oben
      }
      p.x += (p.vx + Math.sin(t * 6 + p.y * 0.09 + p.ex) * 0.35 * up) * dt;
      p.y += p.vy * dt;
      const k = 1 - p.life;
      if (p.spark) {
        ctx.globalAlpha = Math.min(1, k * 1.5) * (0.7 + Math.random() * 0.3);
        const r = p.r * 2.2;
        ctx.drawImage(sprite('255,190,80'), p.x - r, p.y - r, r * 2, r * 2);
      } else {
        const stage = STAGES.find((st) => p.life <= st[0])[1];
        const rw = p.r * Math.pow(k, 0.7) + 0.5;                  // nach oben schmaler
        const rh = rw * (1.5 + p.life * 1.4);                      // und länger gezogen
        ctx.globalAlpha = Math.pow(k, 1.4) * 0.42 * (0.85 + Math.random() * 0.3);
        ctx.drawImage(sprite(stage), p.x - rw, p.y - rh * 0.65, rw * 2, rh * 2);
      }
      keep.push(p);
    }
    parts = keep.length > 1100 ? keep.slice(-1100) : keep;
    ctx.globalAlpha = 1;
  }

  function onInput(e) {
    const el = e.target;
    // Bundle-Auswahl
    if (el.dataset && el.dataset.buy) {
      const q = el.type === 'checkbox' ? (el.checked ? 1 : 0) : Math.floor(parseNum(el.value));
      if (q) state.buy[el.dataset.buy] = q; else delete state.buy[el.dataset.buy];
      const lab = el.closest('label');
      if (lab) lab.classList.toggle('bg-gold-500/5', !!q);
      save(); refresh();
      return;
    }
    // Ziele
    const gRow = el.closest('[data-goal]');
    if (gRow && el.dataset.goalField) {
      const g = state.goals.find((x) => x.id === gRow.dataset.goal);
      if (!g) return;
      const f = el.dataset.goalField;
      g[f] = f === 'on' ? el.checked : f === 'cost' ? parseNum(el.value) : el.value;
      save(); refresh();
      return;
    }
    if (!el.dataset || !el.dataset.path) return;
    let v;
    if (el.dataset.kind === 'raw') v = el.value;
    else {
      v = parseNum(el.value);
      if (el.dataset.unit === 'days') v = Math.round(v * 1440);   // Tage → Minuten
    }
    setPath(state, el.dataset.path, v);
    const part = el.dataset.path.split('.')[0];
    if (part in state.src && state.src[part]) {
      state.src[part] = 0;
      const hint = el.closest('section') && el.closest('section').querySelector('[data-hint]');
      if (hint) hint.innerHTML = hint.innerHTML.split(' · ')[0];
    }
    save(); refresh();
    if (el.dataset.path === 'startDate') renderClock();
  }

  function onBlur(e) {
    const el = e.target;
    if (!el.matches || !el.matches('input[type="text"]')) return;
    if (el.dataset.buy) { el.value = state.buy[el.dataset.buy] || ''; return; }
    if (el.dataset.goalField === 'cost') {
      const g = state.goals.find((x) => x.id === el.closest('[data-goal]').dataset.goal);
      if (g) el.value = inVal(g.cost);
    } else if (el.dataset.path && el.dataset.kind !== 'raw') {
      const v = getPath(state, el.dataset.path);
      el.value = el.dataset.unit === 'days' ? inVal(v / 1440, 1) : el.dataset.path === 'budget' ? (v ? fmt(v, 2) : '') : inVal(v);
    }
  }

  function onClick(e) {
    const tabBtn = e.target.closest('[data-ktab]');
    if (tabBtn) { state.tab = tabBtn.dataset.ktab; save(); rerender(); return; }
    if (e.target.closest('[data-edit]') || e.target.closest('[data-edit-done]')) {
      editOpen = !editOpen && !e.target.closest('[data-edit-done]');
      const ed = root.querySelector('[data-editor]'), btn = root.querySelector('[data-edit]');
      if (ed) ed.classList.toggle('hidden', !editOpen);
      if (btn) btn.setAttribute('aria-expanded', String(editOpen));
      if (editOpen) { const inp = ed && ed.querySelector('input'); if (inp) inp.focus(); }
      return;
    }
    const scanBtn = e.target.closest('[data-scan]');
    if (scanBtn) { if (importScan(scanBtn.dataset.scan)) { save(); rerender(); } return; }

    if (e.target.closest('[data-goal-add]')) {
      state.goals.push({ id: uid(), name: '', cost: 0, on: true });
      save(); rerender();
      const rows = root.querySelectorAll('[data-goal] input[data-goal-field="name"]');
      if (rows.length) rows[rows.length - 1].focus();
      return;
    }
    const del = e.target.closest('[data-goal-del]');
    if (del) {
      const id = del.closest('[data-goal]').dataset.goal;
      state.goals = state.goals.filter((g) => g.id !== id);
      save(); rerender();
      return;
    }
    if (e.target.closest('[data-shop-clear]')) { state.buy = {}; save(); rerender(); return; }
    if (e.target.closest('[data-budget-apply]')) {
      state.buy = budgetPlan(state.budget).pick;
      save(); rerender();
      return;
    }
    if (e.target.closest('[data-reset]')) {
      if (window.confirm(t().confirmReset)) { state = freshState(); save(); rerender(); }
    }
  }

  /* ================================================================== *
   * Popup-Modus (nur wenn #kvkModal existiert)
   * ================================================================== */
  function open() {
    if (!root) init();
    if (!root) return;
    render();
    if (modal) {
      lastFocus = document.activeElement;
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  }
  function close() {
    if (!modal || modal.classList.contains('hidden')) return;
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function injectStyles() {
    if (document.getElementById('kvk-styles')) return;
    const st = document.createElement('style');
    st.id = 'kvk-styles';
    st.textContent = `
#kvkModal { position:fixed; inset:0; z-index:70; display:flex; align-items:flex-start; justify-content:center; padding:24px 16px; overflow-y:auto; background:rgba(3,6,12,.75); backdrop-filter:blur(4px); }
#kvkModal.hidden { display:none !important; }
#kvkModal > .kvk-window { width:100%; max-width:1040px; }
#kvkRoot input::placeholder { color:#475569; }
#kvkRoot details > summary::-webkit-details-marker { display:none; }
#kvkRoot details > summary::after { content:'▾'; color:#64748b; margin-left:.5rem; transition:transform .15s; }
#kvkRoot details[open] > summary::after { transform:rotate(180deg); }
#kvkRoot .kvk-fold[open] { border-color:#2e3a55; }
#kvkRoot .kvk-masonry { column-gap:12px; }
#kvkRoot .kvk-masonry > * { break-inside:avoid; margin-bottom:12px; }
@media (min-width:1024px) { #kvkRoot .kvk-masonry { columns:2; } }
#kvkRoot .grid > * { min-width:0; }
#kvkRoot .kvk-flames { position:absolute; left:0; right:0; bottom:0; width:100%; height:clamp(70px, 12vw, 100px); pointer-events:none; z-index:1; }
#kvkRoot .kvk-flame-glow { position:absolute; left:0; right:0; bottom:0; height:60px; pointer-events:none; z-index:0;
  background:radial-gradient(60% 100% at 50% 100%, rgba(255,90,0,.28), rgba(255,40,0,.08) 60%, transparent 100%);
  animation:kvk-glow 2.6s ease-in-out infinite; }
#kvkRoot .kvk-time { border-bottom-color:rgba(255,106,0,.45);
  background:linear-gradient(180deg, rgba(7,9,15,.62) 0%, rgba(7,9,15,.38) 45%, rgba(7,9,15,.72) 100%), url(${TIMER_BG}) center 60% / cover no-repeat, #0c1019; }
@keyframes kvk-glow { 0%, 100% { opacity:.75; } 50% { opacity:1; } }
@media (prefers-reduced-motion: reduce) { #kvkRoot .kvk-flame-glow { animation:none; } }
#kvkRoot .kvk-fire-wrap { display:flex; justify-content:center; gap:clamp(6px, 2vw, 14px); }
#kvkRoot .kvk-fire-tile { position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center;
  width:clamp(68px, 19vw, 124px); padding:clamp(10px, 2.4vw, 16px) 6px clamp(8px, 1.8vw, 12px); border-radius:14px; overflow:hidden;
  background:radial-gradient(120% 70% at 50% 115%, rgba(255,90,0,.22), rgba(255,60,0,.06) 45%, transparent 70%), #0c1019;
  border:1px solid rgba(255,106,0,.28);
  box-shadow:inset 0 0 20px rgba(0,0,0,.9), inset 0 -12px 26px -8px rgba(255,90,0,.28), 0 0 0 1px rgba(0,0,0,.5), 0 8px 24px -10px rgba(255,60,0,.35);
  animation:kvk-ember 3.2s ease-in-out infinite; animation-delay:var(--d, 0s); }
#kvkRoot .kvk-fire { position:relative; display:inline-block; color:transparent; -webkit-text-fill-color:transparent;
  font-family:Cinzel, Georgia, serif; font-weight:800; line-height:1; letter-spacing:.02em;
  font-size:clamp(2.1rem, 8.5vw, 4.1rem); font-variant-numeric:tabular-nums; }
/* Ebene 1 (unten): Glut – nur Schatten, flackert */
#kvkRoot .kvk-fire::before { content:attr(data-v); position:absolute; inset:0; z-index:0;
  color:transparent; -webkit-text-fill-color:transparent;
  text-shadow:0 0 4px #ffe600, 0 -2px 10px #ff6a00, 0 -8px 20px #ff3300, 0 -15px 40px #aa0000;
  animation:fire-flicker 1.7s ease-in-out infinite; animation-delay:var(--d, 0s); }
/* Ebene 2 (oben): Magma-Verlauf gelb → orange → rot */
#kvkRoot .kvk-fire::after { content:attr(data-v); position:absolute; inset:0; z-index:1;
  background:linear-gradient(to bottom, #ffe600 20%, #ff6a00 50%, #e01a00 90%);
  background-size:100% 125%; background-position:50% 0%;
  -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; color:transparent;
  animation:kvk-magma 4s ease-in-out infinite alternate; animation-delay:var(--d, 0s); }
#kvkRoot .kvk-fire-lab { margin-top:8px; font-size:10px; letter-spacing:.22em; text-transform:uppercase; color:#fdba74; opacity:.75; }
@keyframes fire-flicker {
  0%, 100% { text-shadow:0 0 4px rgba(255,230,0,.9), 0 -3px 12px rgba(255,106,0,.8), 0 -8px 22px rgba(255,51,0,.7), 0 -18px 45px rgba(200,0,0,.6); filter:brightness(1); }
  50% { text-shadow:0 0 6px rgba(255,230,0,1), 0 -1px 10px rgba(255,106,0,.9), 0 -10px 25px rgba(255,51,0,.8), 0 -14px 38px rgba(180,0,0,.5); filter:brightness(1.1) contrast(1.1); }
  70% { text-shadow:0 0 3px rgba(255,230,0,.8), 0 -4px 14px rgba(255,106,0,.7), 0 -7px 18px rgba(255,51,0,.6), 0 -20px 48px rgba(220,0,0,.6); }
}
@keyframes kvk-magma { 0% { background-position:50% 0%; } 100% { background-position:50% 100%; } }
@keyframes kvk-ember {
  0%, 100% { box-shadow:inset 0 0 20px rgba(0,0,0,.9), inset 0 -12px 26px -8px rgba(255,90,0,.24), 0 0 0 1px rgba(0,0,0,.5), 0 8px 24px -10px rgba(255,60,0,.3); }
  50% { box-shadow:inset 0 0 20px rgba(0,0,0,.9), inset 0 -14px 30px -8px rgba(255,110,0,.38), 0 0 0 1px rgba(0,0,0,.5), 0 8px 28px -10px rgba(255,80,0,.45); }
}
/* Kein Datum gesetzt: erloschene Glut */
#kvkRoot .kvk-fire-wrap.is-dim .kvk-fire::after { background:linear-gradient(to bottom, #64748b, #334155); -webkit-background-clip:text; background-clip:text; animation:none; }
#kvkRoot .kvk-fire-wrap.is-dim .kvk-fire::before { text-shadow:none; animation:none; }
#kvkRoot .kvk-fire-wrap.is-dim .kvk-fire-tile { animation:none; border-color:#212b40; background:#0c1019; }
#kvkRoot .kvk-fire-wrap.is-dim .kvk-fire-lab { color:#64748b; }
@media (prefers-reduced-motion: reduce) {
  #kvkRoot .kvk-fire::after, #kvkRoot .kvk-fire::before, #kvkRoot .kvk-fire-tile { animation:none; }
}`;
    document.head.appendChild(st);
  }

  /* ================================================================== *
   * Initialisierung
   * ================================================================== */
  function init() {
    if (root) return;
    root = document.getElementById('kvkRoot');
    if (!root) return;
    modal = document.getElementById('kvkModal');
    if (!modal) root.classList.remove('panel', 'rounded-2xl', 'p-5');   // ältere index.html: Container ohne eigenen Rahmen
    injectStyles();

    root.addEventListener('input', onInput);
    root.addEventListener('change', (e) => { if (e.target.type === 'checkbox' || e.target.dataset.kind === 'raw') onInput(e); });
    root.addEventListener('focusout', onBlur);
    root.addEventListener('click', onClick);
    root.addEventListener('toggle', (e) => {
      const d = e.target;
      if (!d || !d.dataset || !d.dataset.fold) return;
      if (state.open[d.dataset.fold] !== d.open) { state.open[d.dataset.fold] = d.open; save(); }
    }, true);
    window.addEventListener('langchange', () => { if (root.innerHTML) rerender(); });

    if (modal) {
      modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('[data-kvk-close]')) close(); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
      const btn = document.getElementById('menuKvk');
      if (btn) btn.addEventListener('click', () => {
        const menu = document.getElementById('userMenu');
        if (menu) menu.classList.add('hidden');
        open();
      });
    }
  }

  window.KvKCalc = {
    render: () => { if (!root) init(); render(); },
    open,
    close,
    getState: () => clone(state),
    setState(obj) { state = mergeInto(freshState(), obj); save(); rerender(); },
    reset() { state = freshState(); save(); rerender(); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
