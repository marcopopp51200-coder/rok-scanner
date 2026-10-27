// Wiz fan Club – Materialien & Crafting-Planer (Gear-Planer, Ausrüstungs-Scan)
// Läuft innerhalb von RokApp (scanner.js); R = geteilter Kontext (window.Rok)
window.RokMods = window.RokMods || {};
window.RokMods.crafting = (R) => {
  R.loadGearDb = loadGearDb; R.gearPickEvent = gearPickEvent; R.gearEditor = gearEditor; R.renderGear = renderGear; R.gearRarity = gearRarity; R.gearByRef = gearByRef; R.gearMatch = gearMatch;
  // ================= Materialien & Crafting-Planer (Multi-Set Gear-Planer) =================
  // Item-Katalog: Supabase-Tabelle public.gear_items (Kopie im localStorage für offline) + eigene Items des Spielers.
  // Sets und eigene Items: Keys "rok_scanner_gear_*" → landen über LS.set automatisch in public.user_state (+ localStorage).
  const GEAR_SETS = 'rok_scanner_gear_sets', GEAR_CUSTOM = 'rok_scanner_gear_custom', GEAR_OPT = 'rok_scanner_gear_opts', GEAR_CACHE = 'rok_gear_items_cache';
  // Rauten-Anordnung wie im Spiel: x = Spalte (−1 links, 0 Mitte, 1 rechts), y = Höhe in halben Rautenhöhen
  const GEAR_SLOTS = [
    { k: 'helm',   label: 'Helm',         icon: '⛑️', cat: 'helm',      x: 0,  y: 0 },
    { k: 'chest',  label: 'Brust',        icon: '🛡️', cat: 'chest',     x: 0,  y: 2 },
    { k: 'weapon', label: 'Waffe',        icon: '🗡️', cat: 'weapon',    x: -1, y: 3 },
    { k: 'gloves', label: 'Handschuhe',   icon: '🧤', cat: 'gloves',    x: 1,  y: 3 },
    { k: 'legs',   label: 'Beine',        icon: '👖', cat: 'legs',      x: 0,  y: 4 },
    { k: 'acc1',   label: 'Accessoire 1', icon: '💍', cat: 'accessory', x: -1, y: 5 },
    { k: 'acc2',   label: 'Accessoire 2', icon: '📿', cat: 'accessory', x: 1,  y: 5 },
    { k: 'boots',  label: 'Stiefel',      icon: '🥾', cat: 'boots',     x: 0,  y: 6 }
  ]; R.GEAR_SLOTS = GEAR_SLOTS;
  const GEAR_CATS = { helm: 'Helm', chest: 'Brust', weapon: 'Waffe', gloves: 'Handschuhe', legs: 'Beine', boots: 'Stiefel', accessory: 'Accessoire' };
  // Episch = gleiche Anzahl lila Materialien → ¼ legendär (4:1)
  const GEAR_RAR = { legendary: { label: 'Legendär', c: '#f97316', div: 1 }, epic: { label: 'Episch', c: '#c084fc', div: 4 }, elite: { label: 'Elite', c: '#60a5fa', div: 16 }, normal: { label: 'Normal', c: '#94a3b8', div: 64 } };
  const GFILL = { legendary: ['#fde68a', '#f59e0b', '#9a5b07'], epic: ['#e9d5ff', '#a855f7', '#581c87'], elite: ['#dbeafe', '#3b82f6', '#1e3a8a'], normal: ['#e2e8f0', '#94a3b8', '#475569'] }; R.GFILL = GFILL;

  const gNum = (v) => Math.max(0, Math.round(+v || 0));
  const gNorm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/['’`´]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  // Tier-Kosten je Stufe: { "2": { leather: 5, iron: 25 } } = Kosten für den Schritt T1 → T2
  const gNormTiers = (t) => { const o = {}; if (t && typeof t === 'object') for (let n = 1; n <= 5; n++) { const c = t[n] ?? t[String(n)]; if (c && typeof c === 'object') o[n] = { leather: gNum(c.leather), iron: gNum(c.iron), ebony: gNum(c.ebony), bone: gNum(c.bone) }; } return o; };
  const gNormItem = (i) => ({ id: String(i.id), name: String(i.name || 'Item').slice(0, 60), cat: GEAR_CATS[i.cat] ? i.cat : 'helm',
    set: String(i.set || '').slice(0, 40), rarity: R.gRar(i.rarity),
    leather: gNum(i.leather), iron: gNum(i.iron), ebony: gNum(i.ebony), bone: gNum(i.bone), db: !!i.db,
    tiers: gNormTiers(i.tiers),
    icon: typeof i.icon === 'string' && i.icon.length < 200000 && (/^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(i.icon) || (/^\/icons\/[A-Za-z0-9_./-]+\.(webp|png|jpe?g)$/.test(i.icon) && !i.icon.includes('..'))) ? i.icon : '' });
  const gFromDb = (r) => gNormItem({ id: r.id, name: r.name, cat: r.slot, set: r.set_name || '', rarity: r.rarity,
    leather: r.cost_leather, iron: r.cost_iron, ebony: r.cost_ebony, bone: r.cost_bone, icon: R.gearIconFor(r.icon, r.name, r.rarity), tiers: r.tier_costs, db: true });

  // ---- Eigene Ausrüstungsdaten: Craft-, Refine- und Awaken-Kosten je Item ----
  // Datei /gear-data.json im Repo (selbst gepflegt). Mengen gelten in der Qualität des Items (legendäres Item = legendäre Materialien).
  // Fehlt eine Stufe in der Datei, wird sie als „Kosten fehlen“ markiert und nicht mitgerechnet.
  // Zuordnung zum Katalog über den Bildnamen (icons/gear/<id>.webp) oder den Namen.
  const EQ_URL = '/gear-data.json';
  const EQ_QM = { common: 1, advanced: 4, elite: 16, epic: 64, legendary: 256 };          // Wert in normalen Materialien
  const EQ_SLOT = { helmet: 'helm', helm: 'helm', chest: 'chest', weapon: 'weapon', gloves: 'gloves', legs: 'legs', boots: 'boots', accessory: 'accessory' };
  const EQ_RAR = { legendary: 'legendary', epic: 'epic', elite: 'elite', advanced: 'normal', common: 'normal' };
  const EQ_STAGES = ['craft', 'refine', 'awaken_1', 'awaken_2', 'awaken_3', 'awaken_4', 'awaken_5'];
  const eqKey = (s) => gNorm(String(s || '').replace(/_(purple|blue|grey|gray|green)$/, '').replace(/[_-]+/g, ' ')).replace(/ /g, '');
  const EQ = { list: [], map: new Map(), sets: [], setOf: new Map(), state: 'idle' };
  R.EQ = EQ;
  async function loadEq() {
    if (EQ.state === 'loading' || EQ.state === 'ok') return;
    EQ.state = 'loading';
    try {
      const r = await fetch(EQ_URL, { cache: 'default' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      EQ.list = (d.items || []).filter(i => i && i.id && EQ_SLOT[i.slot]);
      EQ.sets = Array.isArray(d.sets) ? d.sets : [];
      EQ.map = new Map(); EQ.list.forEach(i => { EQ.map.set(eqKey(i.id), i); EQ.map.set(eqKey(i.name), i); });
      EQ.setOf = new Map(); EQ.sets.forEach(s => (s.pieces || []).forEach(p => EQ.setOf.set(p, s)));
      EQ.byId = new Map(EQ.list.map(i => [i.id, i]));
      EQ.state = 'ok';
      await loadCostDb();
    } catch (e) { console.warn('gear-data.json nicht geladen', e); EQ.state = 'error'; }
    rebuildGearCat(); renderGear();
  }
  // Kosten aus der Eingabemaske: Supabase-Tabelle public.gear_costs (item_id, costs) – überschreibt gear-data.json je Item
  const COST_FIELDS = ['leather', 'iron', 'ebony', 'bone', 'gold', 'blueprint', 'iconic_crystal'];
  function cleanCosts(c) {
    const out = {};
    EQ_STAGES.forEach(st => { const s = c?.[st]; if (!s || typeof s !== 'object') return;
      const o = {}; COST_FIELDS.forEach(f => { const n = Math.round(+s[f]); if (Number.isFinite(n) && n > 0) o[f] = n; });
      if (Object.keys(o).length || s._set) out[st] = o; });
    return out;
  }
  EQ.dbCosts = new Set(); EQ.dbErr = '';
  async function loadCostDb() {
    try {
      const r = await RokAuth.db()?.from('gear_costs').select('item_id,costs');
      if (!r || r.error) { EQ.dbErr = r?.error ? (R.tableMissing(r.error) ? 'missing' : r.error.message) : ''; return; }
      EQ.dbErr = '';
      (r.data || []).forEach(row => { const e = EQ.byId.get(String(row.item_id)); if (e) { e.costs = cleanCosts(row.costs); EQ.dbCosts.add(e.id); } });
    } catch (e) { EQ.dbErr = e.message || String(e); }
  }
  let gAdmin = false;
  try { RokAuth.isAdmin?.().then(ok => { gAdmin = !!ok; if (R.view === 'craft') renderGearCat(); }).catch(() => {}); } catch {}
  const eqFind = (it) => EQ.map.get(eqKey(R.gearIconStem(it.icon))) || EQ.map.get(eqKey(it.name)) || null;
  // Katalog-Item mit den eigenen Daten anreichern (Kosten, Seltenheit, Set)
  function eqApply(it, e) {
    it.eq = e; it.qm = EQ_QM[e.quality] || 256; it.rarity = EQ_RAR[e.quality] || it.rarity; it.cat = EQ_SLOT[e.slot] || it.cat;
    const c = e.costs?.craft;                                  // nur überschreiben, wenn in der Datei Craft-Kosten stehen
    if (c) { it.leather = gNum(c.leather); it.iron = gNum(c.iron); it.ebony = gNum(c.ebony); it.bone = gNum(c.bone); }
    const s = EQ.setOf.get(e.id); if (s) it.set = s.name;
    return it;
  }

  // ---- Katalog: Supabase + eigene Items ----
  let gearDb = (() => { try { const c = JSON.parse(localStorage.getItem(GEAR_CACHE) || '[]'); return Array.isArray(c) ? c.map(i => gNormItem({ ...i, icon: R.gearIconFor(i.icon, i.name, i.rarity), db: true })) : []; } catch { return []; } })();
  let gearCustom = (() => {
    try { const c = JSON.parse(R.LS.get(GEAR_CUSTOM, 'null')); if (Array.isArray(c)) return c.map(gNormItem); } catch {}
    try { const old = JSON.parse(R.LS.get('rok_scanner_gear_catalog', '[]')); if (Array.isArray(old)) return old.filter(i => String(i?.id).startsWith('c_')).map(gNormItem); } catch {}   // eigene Items der Vorversion
    return [];
  })();
  R.gearCat = [];
  const rebuildGearCat = () => {
    R.gearCat = [...gearDb, ...gearCustom.map(i => ({ ...i, db: false }))];
    const have = new Set(R.gearCat.map(i => R.gearIconStem(i.icon)).filter(Boolean));   // Bilder ohne Katalog-Eintrag als eigene Items (ohne Kosten)
    R.GEAR_FILES.filter(f => !have.has(f)).forEach(f => R.gearCat.push({ ...gNormItem({ id: 'lib_' + f, name: R.gearFileName(f), cat: R.GEAR_FILE_CAT[f], rarity: R.gearFileRar(f), icon: `/icons/gear/${f}.webp` }), lib: true }));
    // eigene Daten zuordnen; Items ohne Bild trotzdem wählbar machen
    if (EQ.state === 'ok') {
      const used = new Set();
      R.gearCat.forEach(it => { if (it.db === false && !it.lib) return; const e = eqFind(it); if (e) { eqApply(it, e); used.add(e.id); if (it.lib) it.name = e.name; } });
      EQ.list.filter(e => !used.has(e.id)).forEach(e => {
        const rar = EQ_RAR[e.quality] || 'legendary';
        R.gearCat.push({ ...eqApply(gNormItem({ id: 'eq_' + e.id, name: e.name, cat: EQ_SLOT[e.slot], rarity: rar, icon: R.gearIconFor('', e.name, rar) }), e), lib: true });
      });
    }
  };
  rebuildGearCat();
  // Neue Bilder in icons/gear/ automatisch erkennen (GitHub-Ordnerliste, 6 h zwischengespeichert) – Typ wird am Namen geraten
  const gearGuessCat = (f) => ([['helm', /helm|visage|mask|diadem|headscarf|plume|crown|hat|hood/], ['chest', /plate|armor|armour|robe|cloak|mail|vest/],
    ['gloves', /glove|gauntlet|vambrace|armband|grips|claws|bracer/], ['legs', /tasset|breeches|chausses|greaves|leggings|pants/],
    ['boots', /boots|treads|sabatons|racers|crushers|shoes|sandals/], ['weapon', /bow|sword|blade|hilt|lance|spear|hammer|axe|scepter|staff|shield|crossbow|mace|blast|glaive|halberd|katana|saber|sabre|dagger_of|arbalest/]]
    .find(([, rx]) => rx.test(f)) || ['accessory'])[0];
  (async function syncGearFiles() {
    let list = null;
    try { const c = JSON.parse(localStorage.getItem('rok_gear_files') || 'null'); if (c && Date.now() - c.t < 6 * 3600e3 && Array.isArray(c.list)) list = c.list; } catch {}
    if (!list) {
      try {
        const r = await fetch('https://api.github.com/repos/marcopopp51200-coder/rok-scanner/contents/icons/gear', { headers: { accept: 'application/vnd.github+json' } });
        if (!r.ok) return;
        list = (await r.json()).map(x => String(x?.name || '')).filter(n => /^[a-z0-9_]+\.webp$/.test(n)).map(n => n.slice(0, -5));
        try { localStorage.setItem('rok_gear_files', JSON.stringify({ t: Date.now(), list })); } catch {}
      } catch { return; }
    }
    const NOT_GEAR = new Set(['infantry', 'cavalry', 'archer', 'siege', 'damage', 'attack', 'defense', 'health', 'speed']);
    const neu = list.filter(f => !R.GEAR_FILE_CAT[f] && !NOT_GEAR.has(f)); if (!neu.length) return;
    neu.forEach(f => { R.GEAR_FILE_CAT[f] = gearGuessCat(f); });
    R.GEAR_FILES = Object.keys(R.GEAR_FILE_CAT).sort(); R.GEAR_FILE_SET = new Set(R.GEAR_FILES); delete R.refCache.gear; delete R.refCache.gear2;
    rebuildGearCat();
  })();
  const saveGearCustom = () => R.LS.set(GEAR_CUSTOM, JSON.stringify(gearCustom));
  const gItem = (id) => id ? R.gearCat.find(i => i.id === id) || null : null; R.gItem = gItem;
  R.gearDbState = 'idle'; let gearDbErr = '';
  async function loadGearDb() {
    if (R.gearDbState === 'loading') return;
    R.gearDbState = 'loading'; renderGearCatInfo();
    try {
      gearDb = (await RokAuth.loadGearItems()).map(gFromDb);
      try { localStorage.setItem(GEAR_CACHE, JSON.stringify(gearDb)); } catch {}
      R.gearDbState = 'ok';
    } catch (e) { console.warn('gear_items nicht geladen', e); R.gearDbState = 'error'; gearDbErr = e.message || String(e); }
    rebuildGearCat(); renderGear();
  }

  // ---- Sets ----
  const gEmptySlots = () => Object.fromEntries(GEAR_SLOTS.map(s => [s.k, { item: '', rarity: 'legendary', tier: 0, refine: 0, refType: 'infantry' }]));
  const ROMAN = ['I', 'II', 'III', 'IV', 'V']; R.ROMAN = ROMAN;
  const REFINE = [0, 25, 50, 75, 100];
  // Refine-Fortschritt: 0 | 25 | 50 | 75 | 100 (= voll, rotes Symbol). Alte Sets: true → 100
  // Refine-Fortschritt in 25er-Schritten (0 | 25 | 50 | 75 | 100) – jeder Schritt = ein Refine mit vollen Kosten
  const gRefine = (v) => (v === true || /^\s*(true|voll|full)\s*$/i.test(String(v))) ? 100 : Math.max(0, Math.min(100, Math.round((parseFloat(v) || 0) / 25) * 25)); R.gRefine = gRefine;
  const gScanRefine = (info) => {                         // "refine_full" vom Scan hat Vorrang vor der Prozentschätzung
    if (info?.refine_full === true) return 100;
    if (info?.refine_full === false) return 0;
    return gRefine(info?.refine);
  }; R.gScanRefine = gScanRefine;
  const gRefTxt = (v) => v >= 100 ? 'Voll' : v + '%';
  // Refine-Typ (Symbol unten rechts auf dem Item)
  // Refine-Symbole in /icons/gear/ (Dateinamen wie in GitHub)
  const REFTYPES = {
    infantry:    { label: 'Infanterie',    img: '/icons/gear/Infantry%20(1).webp' },
    cavalry:     { label: 'Kavallerie',    img: '/icons/gear/Cavalry.webp' },
    archer:      { label: 'Bogenschützen', img: '/icons/gear/Archer.webp' },
    engineering: { label: 'Belagerung',    img: '/icons/gear/Engineering.webp' },
    integration: { label: 'Integration',   img: '/icons/gear/Integration.webp' },
    leadership:  { label: 'Führung',       img: '/icons/gear/Leadership.webp' }
  }; R.REFTYPES = REFTYPES;
  const gRefType = (v) => { const t = String(v || '').toLowerCase(); return /arch|bog|bow/.test(t) ? 'archer' : /cav|kav|horse|pferd/.test(t) ? 'cavalry' : /engin|siege|belager|gear|zahnrad/.test(t) ? 'engineering' : /integr|mix|gemischt/.test(t) ? 'integration' : /lead|führ|fuehr|flag|fahne/.test(t) ? 'leadership' : 'infantry'; }; R.gRefType = gRefType;
  // Symbol: voll = farbig; teilweise = grau, von unten farbig gefüllt
  const gRefIcon = (v, cls) => `<span class="relative inline-block ${cls}" title="Refine ${REFTYPES[v.refType]?.label || ''} ${gRefTxt(v.refine)}">
      <img src="${REFTYPES[v.refType]?.img || REFTYPES.infantry.img}" alt="" class="absolute inset-0 w-full h-full ${v.refine >= 100 ? '' : 'grayscale brightness-75'}">
      ${v.refine > 0 && v.refine < 100 ? `<img src="${REFTYPES[v.refType]?.img || REFTYPES.infantry.img}" alt="" class="absolute inset-0 w-full h-full" style="clip-path:inset(${100 - v.refine}% 0 0 0)">` : ''}
    </span>`; R.gRefIcon = gRefIcon;
  const gTier = (v) => { if (typeof v === 'string' && /^\s*[ivx]+\s*$/i.test(v)) return Math.min(5, ROMAN.indexOf(v.trim().toUpperCase()) + 1); const n = Math.round(+v); return Number.isFinite(n) ? Math.min(5, Math.max(0, n)) : 0; }; R.gTier = gTier;
  // goal: Ziel des Sets – mode 'ziel' (Ziel-Ausrüstung) | 'max' (alles Max), date = Zieldatum JJJJ-MM-TT, on = im Gesamtziel mitrechnen
  const gNormGoal = (g) => ({ mode: g?.mode === 'max' ? 'max' : 'ziel', date: /^\d{4}-\d{2}-\d{2}$/.test(String(g?.date || '')) ? g.date : '', on: g?.on !== false });
  const newGearSet = (name) => ({ id: R.newId(), name, ist: gEmptySlots(), ziel: gEmptySlots(), dismantle: false, useChests: false, goal: gNormGoal(), updated: Date.now() });
  function gNormSet(s) {
    const o = newGearSet(String(s?.name || 'Set').slice(0, 40));
    if (s?.id) o.id = String(s.id);
    ['ist', 'ziel'].forEach(side => GEAR_SLOTS.forEach(sl => { const v = s?.[side]?.[sl.k] || {}; o[side][sl.k] = { item: String(v.item || ''), rarity: R.gRar(v.rarity), tier: gTier(v.tier), refine: gRefine(v.refine), refType: gRefType(v.refType) }; }));
    // histBase = Ist-Stand beim letzten „In History speichern“ – Unterschied dazu = noch nicht gespeicherte Änderungen
    o.histBase = Object.fromEntries(GEAR_SLOTS.map(sl => { const v = (s?.histBase || o.ist)[sl.k] || {}; return [sl.k, { item: String(v.item || ''), rarity: R.gRar(v.rarity), tier: gTier(v.tier), refine: gRefine(v.refine), refType: gRefType(v.refType) }]; }));
    o.dismantle = !!s?.dismantle; o.useChests = !!s?.useChests; o.goal = gNormGoal(s?.goal); o.updated = +s?.updated || Date.now();
    o.sc = s?.sc?.scId && s?.sc?.setId ? { scId: String(s.sc.scId), setId: String(s.sc.setId) } : null;   // verbundenes Showcase-Set
    return o;
  }
  let gear = { sets: [], active: null };
  try { const g = JSON.parse(R.LS.get(GEAR_SETS, 'null')); if (g && Array.isArray(g.sets)) gear = { sets: g.sets.map(gNormSet), active: g.active }; } catch {}
  if (!gear.sets.length) gear.sets.push(newGearSet('Infanterie Marsch 1'));
  if (!gear.sets.some(s => s.id === gear.active)) gear.active = gear.sets[0].id;
  const activeSet = () => gear.sets.find(s => s.id === gear.active) || gear.sets[0]; R.activeSet = activeSet;
  const saveGear = () => { activeSet().updated = Date.now(); R.LS.set(GEAR_SETS, JSON.stringify(gear)); };
  let gearOpt = { rate: 50, gold: null, crystal: null };      // gold/crystal = eigener Bestand (für Ziele), null = nicht angegeben
  try { const o = JSON.parse(R.LS.get(GEAR_OPT, '{}'));
    if (o && o.rate != null) gearOpt.rate = Math.min(100, gNum(o.rate));
  } catch {}
  const saveGearOpt = () => R.LS.set(GEAR_OPT, JSON.stringify(gearOpt));
  let gearFlags = {};                                 // Scan-Hinweise je Ist-Slot (nur in dieser Sitzung)
  const gearSel = { ist: 'helm', ziel: 'helm' }; R.gearSel = gearSel;      // angetippter Slot je Seite
  let craftPane = 'plan';                              // Fenster im Craft-Tab: plan | goal | hist

  // ---- Berechnung ----
  // Materialien immer in legendären Einheiten (1 legendär = 4 episch = 16 Elite …); dazu Gold, Blaupausen (bp) und Iconic-Kristalle (crystal)
  const gZero = () => ({ leather: 0, iron: 0, ebony: 0, bone: 0, gold: 0, bp: 0, crystal: 0 });
  const gAdd = (a, b) => { if (b) Object.keys(a).forEach(k => a[k] += b[k] || 0); return a; };
  const gMatSum = (c) => c ? R.MATS.reduce((a, m) => a + (c[m.k] || 0), 0) : 0;
  const gAny = (c) => !!c && Object.keys(gZero()).some(k => (c[k] || 0) > 1e-9);
  // Kosten einer Stufe ('craft' | 'refine' | 'awaken_1' … 'awaken_5') – null = Kosten unbekannt bzw. Stufe gibt es nicht
  function stageCost(it, stage, rarity) {
    if (!it) return null;
    const c = gZero();
    const s = it.eq?.costs?.[stage];
    if (s) {
      R.MATS.forEach(m => c[m.k] = (s[m.k] || 0) * it.qm / 256);
      c.gold = s.gold || 0; c.bp = s.blueprint || 0; c.crystal = s.iconic_crystal || 0;
      return c;
    }
    const d = (rarity || it.rarity) === 'epic' ? 4 : 1;     // alte Katalog-Items: legendäre Mengen, episch = ¼
    if (stage === 'craft') { if (!R.MATS.some(m => it[m.k] > 0)) return null; R.MATS.forEach(m => c[m.k] = (it[m.k] || 0) / d); return c; }   // keine Mengen = unbekannt
    const t = /^awaken_(\d)$/.exec(stage); const tc = t ? it.tiers?.[+t[1]] : null;
    if (tc) { R.MATS.forEach(m => c[m.k] = (tc[m.k] || 0) / d); return c; }
    return null;
  }
  R.stageCost = stageCost;
  // höchste Iconic-Stufe: stehen Awaken-Stufen in gear-data.json, zählen die; sonst legendär = 5 (Kosten fehlen dann)
  const eqTiers = (it) => it?.eq ? EQ_STAGES.slice(2).filter(s => it.eq.costs?.[s]).length : 0;
  const maxTier = (it) => !it ? 0 : eqTiers(it) || (it.rarity === 'legendary' ? 5 : 0);
  const canRefine = (it) => !!it;
  R.gearMaxTier = maxTier;
  const TROOP_REF = { infantry: 'infantry', cavalry: 'cavalry', archer: 'archer' };
  // Slot auf Maximum: gleiches Item, höchste Tier-Stufe, voll refined
  const gMaxSlot = (z, ist) => {                       // z = Ziel-Slot, ist = Ist-Slot (falls im Ziel nichts gewählt ist)
    const base = gItem(z?.item) ? z : ist, it = gItem(base?.item);
    if (!it) return { item: '', rarity: 'legendary', tier: 0, refine: 0, refType: 'infantry' };
    const refType = base.refine ? base.refType                                    // Refine-Typ behalten, wenn schon gewählt
      : ist?.refine && ist.item === base.item ? ist.refType
      : TROOP_REF[it.eq?.main_troop] || base.refType || 'infantry';               // sonst Haupttruppe des Items
    return { item: base.item, rarity: it.rarity || base.rarity, tier: Math.max(maxTier(it), base.tier || 0), refine: canRefine(it) ? 100 : base.refine || 0, refType };
  };
  const gMaxSlots = (set) => Object.fromEntries(GEAR_SLOTS.map(sl => [sl.k, gMaxSlot(set.ziel[sl.k], set.ist[sl.k])]));
  R.gMaxSlots = gMaxSlots;
  function gearCalc(set, zielOverride) {
    const ziel = zielOverride || set.ziel;
    const key = (v) => gItem(v.item) ? v.item + '|' + (gItem(v.item).eq ? '' : v.rarity) : '';
    const rows = GEAR_SLOTS.map(sl => ({ sl, a: set.ist[sl.k], z: ziel[sl.k], status: 'none', from: null, cost: null, back: null, used: false,
      tierFrom: 0, tierTo: 0, tierMissing: [], needRefine: false, refMissing: false, craftMissing: false, parts: [] }));
    // 1) gleiches Item im gleichen Slot wird behalten
    rows.forEach(r => { if (key(r.z) && key(r.z) === key(r.a)) { r.from = r.a; r.used = true; r.status = 'keep'; } });
    // 2) Accessoires dürfen die Plätze tauschen
    const accs = rows.filter(r => r.sl.cat === 'accessory');
    accs.forEach(r => { if (r.status !== 'none' || !key(r.z)) return; const src = accs.find(o => !o.used && key(o.a) === key(r.z)); if (src) { src.used = true; r.from = src.a; r.status = 'keepswap'; } });
    // 3) Schmieden (neues Item startet bei T0) + Tier-Stufen + Refine
    const need = gZero(), back = gZero();
    rows.forEach(r => {
      if (!key(r.z)) return;
      const it = gItem(r.z.item), cost = gZero();
      const part = (label, c, meta) => { if (c && gAny(c)) { r.parts.push([label, c, meta]); gAdd(cost, c); } };
      if (r.status === 'none') { r.status = 'craft'; const c = stageCost(it, 'craft', r.z.rarity); if (c) part('Craften', c, { k: 'craft' }); else { r.craftMissing = true; r.parts.push(['Craften', null, { k: 'craft' }]); } }
      r.tierFrom = r.from ? (r.from.tier || 0) : 0; r.tierTo = r.z.tier || 0;
      for (let t = r.tierFrom + 1; t <= r.tierTo; t++) { const c = stageCost(it, 'awaken_' + t, r.z.rarity); if (c) part('Tier ' + ROMAN[t - 1], c, { k: 'tier', t }); else { r.tierMissing.push(t); r.parts.push(['Tier ' + ROMAN[t - 1], null, { k: 'tier', t }]); } }
      r.refFrom = r.from && (r.from.refType || 'infantry') === (r.z.refType || 'infantry') ? (r.from.refine || 0) : 0; r.refTo = r.z.refine || 0; r.needRefine = r.refTo > r.refFrom;
      if (r.needRefine) { const c = stageCost(it, 'refine', r.z.rarity);                       // je 25 % ein Refine
        for (let p = r.refFrom + 25; p <= r.refTo; p += 25) { if (c) part('Refine ' + (p >= 100 ? 'Voll' : p + '%'), c, { k: 'refine', p }); else r.parts.push(['Refine ' + (p >= 100 ? 'Voll' : p + '%'), null, { k: 'refine', p }]); }
        if (!c) r.refMissing = true; }
      if (r.status !== 'craft') r.status = r.tierTo > r.tierFrom ? 'tierup' : r.needRefine ? 'refine' : r.status === 'keepswap' ? 'swap' : 'same';
      r.cost = gAny(cost) ? cost : null;
      gAdd(need, r.cost);
    });
    return { rows, need, back };
  }
  R.gearCalc = gearCalc;
  function gearStock() {
    const e = R.history.filter(x => x.type === 'materials').sort((a, b) => b.ts - a.ts)[0] || null;
    return { mats: e ? Object.fromEntries(R.MATS.map(m => [m.k, R.matLeg(e, m.k)])) : null, chests: e ? R.chestLeg(e) : 0, ts: e?.ts };
  }
  function gearBalance(calc, st, useChests) {
    const lines = R.MATS.map(m => {
      const gross = calc.need[m.k], stock = st.mats ? st.mats[m.k] : 0, back = calc.back[m.k];
      return { m, gross, stock, back, chest: 0, deficit: Math.max(0, gross - stock - back), surplus: Math.max(0, stock + back - gross) };
    });
    if (useChests && st.chests > 0) {                  // Wahl-Kisten auf die größten Lücken verteilen
      let left = st.chests;
      [...lines].sort((a, b) => b.deficit - a.deficit).forEach(l => { const t = Math.min(left, l.deficit); l.chest = t; l.deficit -= t; left -= t; });
    }
    return lines;
  }

  // ---- Darstellung ----
  const gq = (v) => (Math.ceil((v || 0) * 100 - 1e-6) / 100 + 0).toLocaleString('de-DE', { maximumFractionDigits: 2 });
  const gGold = (n) => { n = +n || 0; const f = (x, d) => x.toLocaleString('de-DE', { maximumFractionDigits: d });
    return n >= 1e9 ? f(n / 1e9, 2) + ' Mrd.' : n >= 1e6 ? f(n / 1e6, 1) + ' Mio.' : n >= 1e3 ? f(n / 1e3, 0) + ' Tsd.' : f(n, 0); };
  R.gGold = gGold;
  const GX = [{ k: 'gold', icon: '🪙', label: 'Gold', f: gGold }, { k: 'crystal', icon: '💎', label: 'Iconic-Kristalle', f: (v) => gq(v) }, { k: 'bp', icon: '📜', label: 'Blaupausen', f: (v) => gq(v) }];
  const gCostText = (c, mats = true) => !c ? '–' : [...(mats ? R.MATS.filter(m => c[m.k] > 1e-4).map(m => `${m.icon} ${gq(c[m.k])}`) : []),
    ...GX.filter(x => (c[x.k] || 0) > 1e-4).map(x => `${x.icon} ${x.f(c[x.k])}`)].join(' · ') || '0';
  const GBADGE = { red: 'border-red-400/50 text-red-300', amber: 'border-amber-400/50 text-amber-300', sky: 'border-sky-400/50 text-sky-300', emerald: 'border-emerald-400/50 text-emerald-300', gold: 'border-gold-500/50 text-gold-300', slate: 'border-ink-600 text-slate-400' };
  const GSTATUS = { same: ['✓ identisch', 'emerald'], swap: ['⇄ Platz getauscht', 'emerald'], tierup: ['⬆ Tier erhöhen', 'sky'], refine: ['⚔ Refine', 'red'], craft: ['⚒ craften', 'gold'] };
  const gRefStep = (r) => r.needRefine ? `Refine ${REFTYPES[r.z.refType]?.label || ''} ${gRefTxt(r.refFrom)} → ${gRefTxt(r.refTo)}` + (r.refMissing ? ' (Kosten fehlen)' : '') : '';
  const gTierTxt = (r) => r.tierTo > r.tierFrom ? `T${r.tierFrom} → T${r.tierTo}` + (r.tierMissing.length ? ` (Kosten für ${r.tierMissing.map(t => 'T' + t).join(', ')} fehlen)` : '') : '';

  // Rauten-Brett (8 Slots wie im Spiel)
  function gearBoard(side, set, calc, opt = {}) {
    return GEAR_SLOTS.map(sl => {
      const v = set[side][sl.k], it = gItem(v.item), rr = it?.rarity || v.rarity, f = it ? GFILL[rr] || GFILL.legendary : null, r = calc.rows.find(x => x.sl.k === sl.k);
      const active = (opt.sel !== undefined ? opt.sel : gearSel[side]) === sl.k;
      const badge = opt.badge ? opt.badge(sl) : side === 'ziel' ? { same: ['✓', '#34d399'], swap: ['⇄', '#34d399'], tierup: ['⬆', '#7dd3fc'], refine: ['✦', '#fca5a5'], craft: ['⚒', '#fde68a'] }[r.status]
        : side !== 'ist' ? null : gearFlags[sl.k] ? ['⚠', '#fcd34d'] : r?.back ? ['♻', '#7dd3fc'] : null;
      return `<button type="button" data-tile="${sl.k}" data-side="${side}" title="${R.esc(sl.label + (it ? ': ' + it.name : ''))}"
          class="gdia absolute focus:outline-none" style="left:${(sl.x + 1) * 25}%;top:${sl.y * 12.5}%;width:50%;height:25%">
        <span class="gdia absolute inset-0" style="background:${active ? '#ffffff' : R.gFull(it, v) ? R.GOLD_RIM : f ? f[0] : '#2e3a55'}"></span>
        ${R.gFull(it, v) ? '<span class="gdia absolute inset-[10px]" style="background:linear-gradient(180deg,#5a3200,#2e1900)"></span>' : ''}
        <span class="gdia absolute ${R.gFull(it, v) ? 'inset-[12px]' : 'inset-[3px]'}" style="background:${f ? R.gFace(rr) : '#111725'}"></span>
        <span class="relative z-10 h-full w-full flex flex-col items-center justify-center text-center px-[17%] pt-[4%] pointer-events-none">
          ${it?.icon ? `<img src="${it.icon}" alt="" draggable="false" class="w-[84%] aspect-square object-contain [filter:drop-shadow(0_2px_3px_rgba(0,0,0,.45))]">`
            : `<span class="text-xl sm:text-2xl leading-none ${it ? '' : 'opacity-40'}">${sl.icon}</span>`}
          ${it?.icon ? '' : `<span class="mt-1 text-[9px] sm:text-[10px] font-bold leading-tight line-clamp-2 ${it ? 'text-white [text-shadow:0_1px_2px_#000]' : 'text-slate-500'}">${it ? R.esc(it.name) : sl.label}</span>`}
          ${badge ? `<span class="absolute top-[13%] left-1/2 -translate-x-1/2 text-sm font-extrabold leading-none [text-shadow:0_1px_2px_#000]" style="color:${badge[1]}">${badge[0]}</span>` : ''}
        </span>
        ${it && v.tier > 0 ? `<span class="absolute z-10 bottom-[3%] left-1/2 -translate-x-1/2 px-1.5 rounded-md bg-ink-950/85 border border-gold-400/70 text-[10px] font-extrabold text-gold-300 leading-4 pointer-events-none">${ROMAN[v.tier - 1]}</span>` : ''}
        ${it && v.refine > 0 ? `<span class="absolute z-10 right-[33%] bottom-[11%] w-[18%] aspect-square pointer-events-none [filter:drop-shadow(0_1px_2px_rgba(0,0,0,.6))]">${gRefIcon(v, 'w-full h-full')}</span>
          ${v.refine < 100 ? `<span class="absolute z-10 right-[21%] bottom-[16%] text-[9px] font-extrabold text-white [text-shadow:0_1px_2px_#000] pointer-events-none">${v.refine}%</span>` : ''}` : ''}
      </button>`;
    }).join('');
  }
  // Bearbeiten des angetippten Slots
  // ---- Item von Hand aus den Bildern wählen: Reiter je Typ, sortiert nach Seltenheit und Name ----
  const gearPickTab = {}, gearPickOpen = {};
  function gearPickerHtml(side, sl, v) {
    const key = side + ':' + sl.k, tab = gearPickTab[key] || sl.cat, open = gearPickOpen[key] || !gItem(v.item);
    const RO = Object.keys(GEAR_RAR), items = R.gearCat.filter(i => i.cat === tab && (i.icon || i.eq)).sort((a, b) => RO.indexOf(a.rarity) - RO.indexOf(b.rarity) || a.name.localeCompare(b.name));
    const byRar = Object.entries(GEAR_RAR).map(([r, info]) => [info, items.filter(i => i.rarity === r)]).filter(([, l]) => l.length);
    const tile = (i) => { const on = i.id === v.item, f = GFILL[i.rarity] || GFILL.legendary;
      return `<button type="button" data-side="${side}" data-slot="${sl.k}" data-f="item" data-v="${R.esc(i.id)}" title="${R.esc(i.name + (i.set ? ' · ' + i.set : ''))}"
        class="relative aspect-square rounded-lg p-1 border transition ${on ? 'border-gold-400 ring-2 ring-gold-400/60' : 'border-ink-700 hover:border-gold-500/60'}" style="background:radial-gradient(circle at 50% 40%, ${f[1]}55, ${f[2]}44)">
        ${i.icon ? `<img src="${i.icon}" alt="" loading="lazy" class="w-full h-full object-contain">`
          : `<span class="absolute inset-0 grid place-items-center p-0.5 text-[8px] leading-[1.05] font-bold text-white text-center [text-shadow:0_1px_2px_#000] overflow-hidden" translate="no">${R.esc(i.name)}</span>`}</button>`; };
    return `<div class="mt-3 rounded-lg border border-ink-700 bg-ink-950/40" data-gpick="${key}">
      <div class="px-3 pt-2 pb-2 text-xs font-semibold text-gold-300">🖼 Item wählen</div>
      <div class="px-3 pb-3">
        <div class="flex flex-wrap gap-1 mb-2">${Object.entries(GEAR_CATS).map(([k, l]) => `<button type="button" data-side="${side}" data-slot="${sl.k}" data-f="gtab" data-v="${k}"
          class="px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${k === tab ? 'border-gold-400 bg-gold-500/15 text-gold-200' : 'border-ink-700 text-slate-400 hover:text-gold-300'}">${l}${k === sl.cat ? ' ★' : ''}</button>`).join('')}</div>
        <div class="max-h-72 overflow-y-auto pr-1 space-y-2">
          ${byRar.length ? byRar.map(([info, l]) => `<div><div class="text-[10px] uppercase tracking-widest mb-1" style="color:${info.c}">${info.label} · ${l.length}</div>
            <div class="grid grid-cols-6 sm:grid-cols-8 gap-1.5">${l.map(tile).join('')}</div></div>`).join('')
            : '<div class="py-4 text-center text-xs text-slate-500">Keine Bilder für diesen Typ.</div>'}
        </div>
        ${tab !== sl.cat ? '<div class="mt-2 text-[11px] text-amber-300">Hinweis: anderer Typ als dieser Slot – nur wählen, wenn das Item falsch einsortiert ist.</div>' : ''}
      </div></div>`;
  }
  function gearPickEvent(t) {                                // true = Ereignis war ein Reiter-Wechsel (nichts speichern)
    const key = t.dataset.side + ':' + t.dataset.slot;
    if (t.dataset.f === 'gtab') { gearPickTab[key] = t.dataset.v; gearPickOpen[key] = true; return true; }
    if (t.dataset.f === 'item' && t.dataset.v != null) delete gearPickOpen[key];
    return false;
  }
  function gearEditor(side, set, calc) {
    const sl = GEAR_SLOTS.find(s => s.k === gearSel[side]) || GEAR_SLOTS[0], v = set[side][sl.k], it = gItem(v.item);
    const r = calc.rows.find(x => x.sl.k === sl.k);
    const note = side === 'ist' ? (gearFlags[sl.k] ? ['⚠ ' + gearFlags[sl.k], 'amber'] : r.back ? ['♻ wird zerlegt: + ' + gCostText(r.back), 'sky'] : null)
      : r.status === 'craft' ? ['⚒ craften: ' + (r.craftMissing ? 'Kosten fehlen' : gCostText(r.cost)) + (gTierTxt(r) ? ' · inkl. ' + gTierTxt(r) : '') + (r.needRefine ? ' · + ' + gRefStep(r) : ''), 'gold']
      : r.status === 'tierup' ? ['⬆ ' + gTierTxt(r) + (r.cost ? ': ' + gCostText(r.cost) : '') + (r.needRefine ? ' · + ' + gRefStep(r) : ''), 'sky']
      : r.status === 'refine' ? ['⚔ ' + gRefStep(r), 'red'] : GSTATUS[r.status] || null;
    const sel = 'min-w-0 bg-ink-950 border border-ink-600 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-gold-500 disabled:opacity-40';
    const rb = (on) => `flex items-center gap-1 px-2 py-1 rounded-lg border ${on ? 'border-gold-400 bg-gold-500/15 text-gold-200' : 'border-ink-600 bg-ink-950 text-slate-400 hover:text-gold-300'}`;
    const hasRef = it && v.refine > 0;
    return `<div class="rounded-xl border border-ink-700 bg-ink-950/60 p-3">
      <div class="flex flex-wrap items-center gap-2 mb-2">
        ${it?.icon ? `<img src="${it.icon}" alt="" class="w-9 h-9 object-contain">` : `<span class="text-xl">${sl.icon}</span>`}
        <div class="min-w-0 flex-1">
          <div class="text-[10px] uppercase tracking-widest text-slate-500">${sl.label}</div>
          <div class="text-sm font-semibold truncate ${it ? 'text-white' : 'text-slate-500'}" translate="no">${it ? R.esc(it.name) : '– leer – unten ein Bild antippen'}</div>
        </div>
        ${(side === 'sc' || it?.eq) && it && !maxTier(it) ? '<span class="text-[10px] text-slate-500" title="Iconic-Stufen gibt es nur bei legendären Items">kein Iconic</span>' : `<select data-side="${side}" data-slot="${sl.k}" data-f="tier" class="${sel}" ${it ? '' : 'disabled'} aria-label="Tier">
          ${[0, 1, 2, 3, 4, 5].filter(t => !it?.eq || t <= Math.max(maxTier(it), v.tier || 0)).map(t => `<option value="${t}"${(v.tier || 0) === t ? ' selected' : ''}>T${t}</option>`).join('')}
        </select>`}
        ${it && side === 'ziel' ? `<button type="button" data-side="${side}" data-slot="${sl.k}" data-f="max" title="Dieses Item auf Maximum: höchste Tier-Stufe + voll refined" class="px-2 py-1.5 rounded-lg border border-gold-500/50 text-gold-300 hover:border-gold-400 text-xs font-semibold">⇧ Max</button>` : ''}
        ${it ? `<button type="button" data-side="${side}" data-slot="${sl.k}" data-f="clear" title="Slot leeren" class="px-2 py-1.5 rounded-lg border border-ink-600 text-slate-400 hover:border-red-500/50 hover:text-red-300 text-xs">✕</button>` : ''}
      </div>
      <div class="flex flex-wrap items-center gap-1.5 text-xs ${it ? '' : 'opacity-40'}">
        <span class="text-slate-400 mr-1">Refine</span>
        <button type="button" data-side="${side}" data-slot="${sl.k}" data-f="refset" data-v="" ${it ? '' : 'disabled'} class="${rb(!hasRef)}">Kein</button>
        ${Object.entries(REFTYPES).map(([k, t]) => `<button type="button" data-side="${side}" data-slot="${sl.k}" data-f="refset" data-v="${k}" ${it ? '' : 'disabled'} title="${t.label}" class="${rb(hasRef && v.refType === k)}">
          <img src="${t.img}" alt="" class="w-5 h-5 ${hasRef && v.refType === k ? '' : 'grayscale opacity-70'}"><span class="hidden sm:inline">${t.label}</span></button>`).join('')}
      </div>
      ${hasRef ? `<div class="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs"><span class="text-slate-400 mr-1">Fortschritt</span>
        ${[25, 50, 75, 100].map(p => `<button type="button" data-side="${side}" data-slot="${sl.k}" data-f="refine" data-v="${p}" class="${rb(v.refine === p)} font-semibold tabular-nums">${p >= 100 ? 'Voll' : p + '%'}</button>`).join('')}
        <span class="text-[10px] text-slate-500">je 25 % = 1 Refine</span></div>` : ''}
      ${it?.eq && (side === 'ziel' || side === 'ist') ? `<div class="mt-2 text-[11px] ${Object.keys(it.eq.costs || {}).length < 7 && maxTier(it) ? 'text-amber-300' : 'text-slate-500'}">
        ${(() => { const n = CE_ROWS.filter(([st]) => it.eq.costs?.[st]).length, need = it.rarity === 'legendary' || n > 2 ? 7 : 2; return n >= need ? '✓ Kosten eingetragen' : `⚠ Kosten: ${n} von ${need} Stufen eingetragen`; })()}
        <button type="button" data-cedit-slot="${R.esc(it.eq.id)}" class="ml-1 underline hover:text-gold-300">${gAdmin ? 'eintragen/ändern' : 'ansehen'}</button></div>` : ''}
      ${gearPickerHtml(side, sl, v)}
      ${note ? `<div class="mt-2 inline-block max-w-full text-[11px] px-2 py-0.5 rounded-full border ${GBADGE[note[1]]}">${R.esc(note[0])}</div>` : ''}
    </div>`;
  }

  function renderGearMain() {
    const set = activeSet();
    renderCraftHist();
    R.$('gearSetSel').innerHTML = gear.sets.map(s => `<option value="${R.esc(s.id)}"${s.id === set.id ? ' selected' : ''}>${R.esc(s.name)}</option>`).join('');
    renderScLink(set);
    renderHistBar(set);
    const calc = gearCalc(set), st = gearStock(), lines = gearBalance(calc, st, set.useChests);

    R.$('gearIstBoard').innerHTML = gearBoard('ist', set, calc);
    R.$('gearZielBoard').innerHTML = gearBoard('ziel', set, calc);
    R.$('gearIstEdit').innerHTML = gearEditor('ist', set, calc);
    R.$('gearZielEdit').innerHTML = gearEditor('ziel', set, calc);

    // Ergebnis-Dashboard
    const crafts = calc.rows.filter(r => r.status === 'craft');
    const totalLeg = R.MATS.reduce((a, m) => a + calc.need[m.k], 0);
    const missing = st.mats ? lines.filter(l => l.deficit > 0.005).length : 0;
    const maxCalc = gearCalc(set, gMaxSlots(set)), maxLeg = gMatSum(maxCalc.need);
    const zielIsMax = Math.abs(maxLeg - totalLeg) < 0.01 && Math.abs(maxCalc.need.gold - calc.need.gold) < 1;
    const steps = { tiers: calc.rows.reduce((a, r) => a + Math.max(0, r.tierTo - r.tierFrom), 0), refines: calc.rows.filter(r => r.needRefine).length };
    const unknown = calc.rows.filter(r => r.craftMissing || r.tierMissing.length || r.refMissing).map(r => `${r.sl.label}${r.craftMissing ? ' Craften' : ''}${r.tierMissing.length ? ' ' + r.tierMissing.map(t => 'T' + t).join('/') : ''}${r.refMissing ? ' Refine' : ''}`);
    const xStock = { gold: null, crystal: null, bp: null };          // Bestand an Gold/Kristallen wird nicht erfasst
    const verdict = !gAny(calc.need) && unknown.length ? ['⚠ Für dieses Ziel sind noch keine Kosten eingetragen (gear-data.json).', 'text-amber-300']
      : !gAny(calc.need) ? ['✓ Keine Zusatzkosten – das Ziel-Set entspricht der Ist-Ausrüstung oder ist leer.', 'text-emerald-300']
      : !st.mats ? ['⚠ Bestand unbekannt – bitte zuerst deine Materialien scannen.', 'text-amber-300']
      : missing ? [`🔴 ${missing} von 4 Materialien reichen noch nicht.`, 'text-red-300'] : ['🟢 Alles vorhanden – das Set kann geschmiedet werden.', 'text-emerald-300'];
    // Mitte zwischen Ist und Ziel: nur die Materialien, die gebraucht werden
    const bar = (have, need) => `<div class="mt-1.5 h-1.5 rounded-full bg-ink-800 overflow-hidden"><div class="h-full rounded-full ${have >= need - 0.005 ? 'bg-emerald-400' : 'bg-gradient-to-r from-gold-600 to-gold-400'}" style="width:${need > 0 ? Math.round(Math.min(1, have / need) * 100) : 100}%"></div></div>`;
    const matRow = (l) => { const have = l.stock + l.back + l.chest, known = !!st.mats || l.back > 0;
      return `<div class="rounded-xl border ${!known ? 'border-ink-700' : l.deficit > 0.005 ? 'border-red-500/40' : 'border-emerald-500/40'} bg-ink-950/50 px-3 py-2">
        <div class="flex items-center gap-2"><span class="text-lg leading-none">${l.m.icon}</span><span class="text-xs text-slate-300 flex-1">${l.m.label}</span>
          <span class="text-base font-extrabold tabular-nums text-white">${gq(l.gross)}</span></div>
        ${known ? bar(have, l.gross) : ''}
        <div class="mt-1 flex justify-between gap-2 text-[11px] tabular-nums">
          <span class="text-slate-500">${known ? `hast ${gq(have)}${l.back > 1e-4 ? ' (inkl. ♻ ' + gq(l.back) + ')' : ''}${l.chest > 1e-4 ? ' (inkl. 📦 ' + gq(l.chest) + ')' : ''}` : 'Bestand ?'}</span>
          <span class="font-semibold ${!known ? 'text-slate-500' : l.deficit > 0.005 ? 'text-red-300' : 'text-emerald-300'}">${!known ? '' : l.deficit > 0.005 ? 'fehlt ' + gq(l.deficit) : '✓ genug'}</span></div></div>`; };
    const xRow = (x) => { const n = calc.need[x.k] || 0, have = xStock[x.k], miss = have == null ? null : Math.max(0, n - have);
      return `<div class="rounded-xl border ${miss == null ? 'border-ink-700' : miss > 0 ? 'border-red-500/40' : 'border-emerald-500/40'} bg-ink-950/50 px-3 py-2">
        <div class="flex items-center gap-2"><span class="text-lg leading-none">${x.icon}</span><span class="text-xs text-slate-300 flex-1">${x.label}</span>
          <span class="text-base font-extrabold tabular-nums text-white">${x.f(n)}</span></div>
        ${miss != null ? `${bar(have, n)}<div class="mt-1 flex justify-between gap-2 text-[11px] tabular-nums"><span class="text-slate-500">hast ${x.f(have)}</span>
          <span class="font-semibold ${miss > 0 ? 'text-red-300' : 'text-emerald-300'}">${miss > 0 ? 'fehlt ' + x.f(miss) : '✓ genug'}</span></div>` : ''}</div>`; };
    const needMats = lines.filter(l => l.gross > 0.005), needX = GX.filter(x => (calc.need[x.k] || 0) > 0.005);
    R.$('gearMid').innerHTML = `
      <div class="text-center">
        <div class="text-[10px] uppercase tracking-widest text-slate-400">Benötigt für das Ziel</div>
        <div class="font-display text-lg gold-text truncate" translate="no">${R.esc(set.name)}</div>
        <div class="mt-1 text-3xl font-extrabold text-gold-300 tabular-nums">${gq(totalLeg)}</div>
        <div class="text-[11px] text-slate-400">legendäre Materialien</div>
        <div class="mt-2 flex justify-center gap-3 text-[11px] text-slate-300"><span title="Items zu craften">⚒ ${crafts.length}</span><span class="text-sky-300" title="Tier-Stufen">⬆ ${steps.tiers}</span><span class="text-red-300" title="Refines">✦ ${steps.refines}</span></div>
      </div>
      <div class="mt-3 space-y-2">${needMats.map(matRow).join('')}${needX.map(xRow).join('')}
        ${!needMats.length && !needX.length ? `<div class="py-4 text-center text-xs ${verdict[1]}">${verdict[0]}</div>` : ''}</div>
      ${needMats.length || needX.length ? `<div class="mt-3 text-xs font-semibold text-center ${verdict[1]}">${verdict[0]}</div>` : ''}
      ${unknown.length ? `<div class="mt-2 text-[11px] text-amber-300">⚠ Kosten fehlen (nicht mitgerechnet): ${R.esc(unknown.join(' · '))}</div>` : ''}
      ${maxLeg > 0.005 ? `<div class="mt-3 rounded-xl border ${zielIsMax ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-gold-500/30 bg-gold-500/5'} px-3 py-2 text-[11px]">
        <div class="font-semibold ${zielIsMax ? 'text-emerald-300' : 'text-gold-300'}">${zielIsMax ? '🎯 Ziel ist bereits alles Max' : '🎯 Bis alles Max'}</div>
        <div class="tabular-nums text-slate-300 mt-0.5">${gq(maxLeg)} leg. Mats · ${gCostText(maxCalc.need, false)}</div>
        ${zielIsMax ? '' : '<button type="button" data-gmax class="mt-1.5 w-full px-2.5 py-1 rounded-lg border border-gold-500/50 text-gold-300 hover:border-gold-400">Als Ziel setzen</button>'}</div>` : ''}
      ${st.chests > 0 ? `<label class="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-300 cursor-pointer"><input id="gearUseChests" type="checkbox" ${set.useChests ? 'checked' : ''} class="w-4 h-4 accent-yellow-500">📦 Material-Kisten (≈ ${gq(st.chests)}) zum Auffüllen nutzen</label>` : ''}
      <div class="mt-2 text-[11px] text-slate-500 text-center">${st.mats ? `Rucksack aus Scan vom ${R.dateLabel(st.ts)}`
        : `⚠ Kein Material-Scan – <button data-goscan="mats" class="underline text-gold-300 hover:text-gold-400">Materialien scannen</button>`}</div>`;
    R.$('gearResult').innerHTML = '';

    // Prio-Liste: nur offene Schritte, günstigste zuerst (je Teil bleibt die Reihenfolge Craften → Tier → Refine)
    renderPrio(set, calc, st);
  }

  // ---- Prio-Liste ----
  const stepScore = (c) => c ? gMatSum(c) + (c.gold || 0) / 1e8 : Infinity;
  function gearSteps(calc) {
    const queues = calc.rows.filter(r => r.parts.length).map(r => r.parts.map(([label, cost, meta]) => ({ r, label, cost, meta })));
    const out = [];
    while (queues.some(q => q.length)) {                    // immer den günstigsten nächsten Schritt nehmen
      let best = null;
      queues.forEach(q => { if (q.length && (!best || stepScore(q[0].cost) < stepScore(best[0].cost))) best = q; });
      out.push(best.shift());
    }
    return out;
  }
  const stepIcon = (v, cls = 'w-12 h-12') => { const it = gItem(v?.item), f = GFILL[it?.rarity || v?.rarity] || GFILL.legendary;
    return `<span class="relative shrink-0 ${cls} rounded-xl grid place-items-center border-2" style="border-color:${f[1]};background:radial-gradient(circle at 50% 40%, ${f[1]}66, ${f[2]}55)">
      ${it?.icon ? `<img src="${it.icon}" alt="" loading="lazy" class="w-[86%] h-[86%] object-contain [filter:drop-shadow(0_2px_2px_rgba(0,0,0,.5))]">` : `<span class="text-[9px] font-bold text-white text-center leading-tight px-0.5">${R.esc(it?.name || '?')}</span>`}</span>`; };
  function renderPrio(set, calc, st) {
    const steps = gearSteps(calc), box = R.$('gearPlan');
    if (!steps.length) { box.innerHTML = `<h3 class="font-display text-xl gold-text">Prio-Liste</h3><div class="mt-3 py-6 text-center text-sm text-emerald-300">✓ Nichts mehr zu tun – Ist und Ziel sind gleich.</div>`; return; }
    const run = gZero(); let ok = !!st.mats;
    const rows = steps.map((x, i) => {
      if (x.cost) gAdd(run, x.cost);
      const lack = st.mats && x.cost ? R.MATS.filter(m => run[m.k] > st.mats[m.k] + 1e-6) : [];
      if (!x.cost || lack.length) ok = false;
      const kind = x.meta.k === 'craft' ? ['⚒', 'text-gold-300'] : x.meta.k === 'tier' ? ['⬆', 'text-sky-300'] : ['✦', 'text-red-300'];
      return `<div class="flex items-center gap-3 rounded-xl border ${ok ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-ink-700 bg-ink-950/40'} p-2.5">
        <span class="w-6 text-center text-sm font-bold text-slate-500 tabular-nums">${i + 1}</span>
        ${stepIcon(x.r.z)}
        <div class="min-w-0 flex-1 text-center">
          <div class="text-base font-bold ${kind[1]}">${kind[0]} ${R.esc(x.label)}</div>
          <div class="text-xs text-slate-300 truncate" translate="no">${R.esc(gItem(x.r.z.item)?.name || '')} <span class="text-slate-500">· ${x.r.sl.label}</span></div>
          <div class="mt-0.5 text-xs tabular-nums ${x.cost ? 'text-slate-200' : 'text-amber-300'}">${x.cost ? gCostText(x.cost) : '⚠ Kosten fehlen'}</div>
        </div>
        <div class="shrink-0 flex flex-col items-end gap-1">
          ${ok ? '<span class="text-[11px] font-semibold text-emerald-300">✓ machbar</span>' : st.mats && lack.length ? `<span class="text-[11px] text-red-300">fehlt ${lack.map(m => m.icon).join('')}</span>` : ''}
          <button type="button" data-step="${i}" class="px-2.5 py-1.5 rounded-lg border border-ink-600 hover:border-emerald-400 hover:text-emerald-300 text-xs font-semibold" title="Schritt erledigt – Ist-Ausrüstung wird angepasst">✓ Erledigt</button>
        </div></div>`;
    }).join('');
    box.innerHTML = `<div class="flex flex-wrap items-end justify-between gap-2 mb-3">
        <div><h3 class="font-display text-xl gold-text">Prio-Liste</h3>
          <p class="text-xs text-slate-400">${steps.length} ${steps.length === 1 ? 'Schritt' : 'Schritte'} offen · günstigste zuerst · grün = mit deinem Rucksack machbar (der Reihe nach)</p></div>
      </div>
      <div class="space-y-2">${rows}</div>`;
    box._steps = steps;
  }
  // Schritt erledigt → Ist-Ausrüstung anpassen (landet erst mit „In History speichern“ in der History)
  R.$('gearPlan').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-step]'); if (!b) return;
    const x = R.$('gearPlan')._steps?.[+b.dataset.step]; if (!x) return;
    const set = activeSet(), k = x.r.sl.k, z = x.r.z;
    if (x.r.from && x.r.from !== set.ist[k]) {                  // Accessoire kommt aus dem anderen Slot → Plätze tauschen
      const src = GEAR_SLOTS.find(sl => set.ist[sl.k] === x.r.from);
      if (src) { const t = set.ist[k]; set.ist[k] = set.ist[src.k]; set.ist[src.k] = t; }
    }
    const v = set.ist[k];
    if (x.meta.k === 'craft') set.ist[k] = { item: z.item, rarity: z.rarity, tier: 0, refine: 0, refType: z.refType };
    else if (x.meta.k === 'tier') v.tier = x.meta.t;
    else if (x.meta.k === 'refine') { if (v.refType !== z.refType) v.refine = 0; v.refType = z.refType; v.refine = x.meta.p; }
    delete gearFlags[k]; saveGear(); renderGearMain();
  });

  function renderGearCatInfo() {
    const n = gearDb.length;
    R.$('gearCatInfo').innerHTML = (R.gearDbState === 'loading' ? 'Lade Katalog aus Supabase …'
      : R.gearDbState === 'error' ? `<span class="text-amber-300">⚠ Katalog aus Supabase nicht geladen (${R.esc(gearDbErr)})${n ? ` – es wird die gespeicherte Kopie mit ${n} Items genutzt.` : '.'}</span>`
      : `☁ ${n} Items aus Supabase (Tabelle <code>gear_items</code>) · ${gearCustom.length} eigene Items`)
      + (EQ.state === 'ok' ? ` · 📘 Kosten eingetragen bei <b class="text-gold-300">${EQ.list.filter(e => e.costs && Object.keys(e.costs).length).length} von ${EQ.list.length}</b> Items` : EQ.state === 'error' ? ' · <span class="text-amber-300">⚠ gear-data.json nicht geladen</span>' : '')
      + (gAdmin && EQ.dbErr === 'missing' ? '<div class="mt-1 text-amber-300">⚠ Tabelle gear_costs fehlt noch – bitte das SQL im Supabase SQL Editor ausführen, sonst kann die Eingabe nicht speichern.</div>' : '');
  }
  function renderGearCat() {
    renderGearCatInfo();
    const inp = 'w-full bg-ink-950 border border-ink-700 rounded px-1.5 py-1 focus:outline-none focus:border-gold-500 disabled:opacity-60 disabled:border-transparent';
    const row = (i) => { const ro = i.db || i.eq ? 'disabled' : '';
      return `<tr class="border-b border-ink-800">
        <td class="py-1 pr-1"><input data-cid="${R.esc(i.id)}" data-f="name" value="${R.esc(i.name)}" ${ro} class="${inp} min-w-[170px]"></td>
        <td class="py-1 px-1"><select data-cid="${R.esc(i.id)}" data-f="cat" ${ro} class="${inp}">${Object.entries(GEAR_CATS).map(([k, l]) => `<option value="${k}"${k === i.cat ? ' selected' : ''}>${l}</option>`).join('')}</select></td>
        <td class="py-1 px-1 whitespace-nowrap ${i.eq ? 'text-sky-300' : i.db ? 'text-emerald-300' : 'text-gold-300'}">${i.eq ? '📘 gear-data' : i.db ? '☁ Supabase' : '✎ eigenes'}</td>
        ${['leather', 'iron', 'ebony', 'bone'].map(k => `<td class="py-1 px-1"><input data-cid="${R.esc(i.id)}" data-f="${k}" type="number" min="0" step="1" value="${i[k]}" ${ro} class="${inp} w-16 text-right tabular-nums"></td>`).join('')}
        <td class="py-1 px-1 text-right tabular-nums whitespace-nowrap text-gold-300" title="Craften + Refine + alle Tier-Stufen, in legendären Materialien">${(() => { const t = gZero(); EQ_STAGES.forEach(st => gAdd(t, stageCost(i, st))); return gMatSum(t) > 0 ? gq(gMatSum(t)) + (t.gold ? ' · 🪙 ' + gGold(t.gold) : '') : '–'; })()}</td>
        <td class="text-right whitespace-nowrap">${i.eq ? `<button data-cedit="${R.esc(i.eq.id)}" class="text-[11px] px-2 py-1 rounded-md border ${Object.keys(i.eq.costs || {}).length ? 'border-ink-600 text-slate-300' : 'border-gold-500/60 text-gold-300'} hover:border-gold-400 hover:text-gold-300" title="Kosten ansehen/eintragen">${gAdmin ? '✎ Kosten' : '👁 Kosten'}</button>`
          : i.db ? '' : `<button data-cdel="${R.esc(i.id)}" class="text-slate-500 hover:text-red-400 px-1" title="Item löschen">✕</button>`}</td></tr>`; };
    R.$('gearCatMissing').className = `text-xs px-3 py-2 rounded-lg border ${catMissing ? 'border-gold-400 bg-gold-500/15 text-gold-200' : 'border-ink-600 hover:border-gold-500/60 hover:text-gold-300'}`;
    const RO = ['legendary', 'epic', 'elite', 'normal'], list = R.gearCat.filter(i => (!i.lib || i.eq) && (!catMissing || (i.eq && !Object.keys(i.eq.costs || {}).length)))
      .sort((a, b) => RO.indexOf(a.rarity) - RO.indexOf(b.rarity) || Object.keys(GEAR_CATS).indexOf(a.cat) - Object.keys(GEAR_CATS).indexOf(b.cat) || a.name.localeCompare(b.name));
    R.$('gearCatRows').innerHTML = list.length ? list.map(row).join('')
      : '<tr><td colspan="9" class="py-4 text-center text-slate-500">Noch keine Items – Tabelle gear_items in Supabase füllen oder „+ Eigenes Item“.</td></tr>';
  }
  function renderGear() {
    if (R.gearDbState === 'idle') loadGearDb();
    if (EQ.state === 'idle') loadEq();
    renderGearMain(); renderGearCat();
    if (craftPane === 'goal') renderGoals();
  }

  // ---- Ereignisse: Brett + Slot-Editor ----
  ['gearIstBoard', 'gearZielBoard'].forEach(id => R.$(id).addEventListener('click', (ev) => {
    const t = ev.target.closest('[data-tile]'); if (!t) return;
    gearSel[t.dataset.side] = t.dataset.tile; renderGearMain();
  }));
  const gearEdit = (ev) => {
    const ce = ev.type === 'click' && ev.target.closest('[data-cedit-slot]'); if (ce) { openCostEditor(ce.dataset.ceditSlot); return; }
    const t = ev.target.closest('[data-slot]'); if (!t || t.disabled) return;
    const isBtn = t.tagName === 'BUTTON';
    if (ev.type === 'click' && !isBtn) return;     // Klick nur für Buttons (Refine, Bild-Auswahl)
    if (ev.type === 'change' && isBtn) return;
    if (gearPickEvent(t)) { renderGearMain(); return; }
    const v = activeSet()[t.dataset.side][t.dataset.slot];
    if (t.dataset.f === 'clear') { v.item = ''; v.tier = 0; v.refine = 0; }
    else if (t.dataset.f === 'max') Object.assign(v, gMaxSlot(v, activeSet().ist[t.dataset.slot]));
    else if (t.dataset.f === 'refset') { if (t.dataset.v) { v.refType = gRefType(t.dataset.v); if (!v.refine) v.refine = 100; } else v.refine = 0; }
    else if (t.dataset.f === 'item') { v.item = t.dataset.v ?? t.value; const it = gItem(v.item); if (it) v.rarity = it.rarity; v.tier = 0; v.refine = 0; v.refType = v.refType || 'infantry'; }
    else if (t.dataset.f === 'refine') v.refine = gRefine(t.dataset.v);
    else if (t.dataset.f === 'refType') v.refType = gRefType(t.dataset.v);
    else v.tier = gTier(t.value);
    if (t.dataset.side === 'ist') delete gearFlags[t.dataset.slot];
    saveGear(); renderGearMain();
  };
  ['gearIstEdit', 'gearZielEdit'].forEach(id => { R.$(id).addEventListener('change', gearEdit); R.$(id).addEventListener('click', gearEdit); });
  R.$('gearCopyIst').onclick = async () => {
    const s = activeSet();
    if (GEAR_SLOTS.some(sl => gItem(s.ziel[sl.k].item)) && !(await UI.confirm('Ziel-Ausrüstung mit der Ist-Ausrüstung überschreiben?'))) return;
    GEAR_SLOTS.forEach(sl => s.ziel[sl.k] = { ...s.ist[sl.k] });
    saveGear(); renderGearMain();
  };
  // Alles auf Max: Ziel-Items (oder sonst die Ist-Items) auf höchste Tier-Stufe + voll refined
  async function gearSetMax() {
    const s = activeSet();
    if (!GEAR_SLOTS.some(sl => gItem(s.ziel[sl.k].item) || gItem(s.ist[sl.k].item))) { await UI.alert('Wähle zuerst Items in der Ist- oder Ziel-Ausrüstung – dann kann ich sie auf Max setzen.'); return; }
    s.ziel = gMaxSlots(s); saveGear(); renderGearMain();
  }
  R.$('gearMaxAll').onclick = gearSetMax;
  R.$('gearMid').addEventListener('click', (ev) => { if (ev.target.closest('[data-gmax]')) gearSetMax(); const b = ev.target.closest('[data-goscan]'); if (b) R.goScan(b.dataset.goscan); });
  R.$('gearMid').addEventListener('change', (ev) => { if (ev.target.id === 'gearUseChests') { activeSet().useChests = ev.target.checked; saveGear(); renderGearMain(); } });
  R.$('gearResult').addEventListener('click', (ev) => { const b = ev.target.closest('[data-goscan]'); if (b) R.goScan(b.dataset.goscan); });

  // ---- Verbindung zum Showcase: Set laden (Showcase → Planer) und übertragen (Planer → Showcase) ----
  const scSets = () => { try { return R.scGearSets ? R.scGearSets() : []; } catch (e) { console.warn('Showcase nicht lesbar', e); return []; } };
  // Showcase-Slot → Planer-Slot (Item über ID, Bild oder Name finden)
  function scToSlot(v) {
    let it = gItem(v?.item);
    if (!it && v?.icon) { const st = R.gearIconStem(v.icon); it = R.gearCat.find(i => st && R.gearIconStem(i.icon) === st) || null; }
    if (!it && v?.name) it = R.gearCat.find(i => gNorm(i.name) === gNorm(v.name)) || null;
    return it ? { item: it.id, rarity: it.rarity, tier: gTier(v.tier), refine: gRefine(v.refine), refType: gRefType(v.refType) } : { item: '', rarity: 'legendary', tier: 0, refine: 0, refType: 'infantry' };
  }
  const scSlots = (gearObj) => Object.fromEntries(GEAR_SLOTS.map(sl => [sl.k, scToSlot(gearObj?.[sl.k])]));
  const slotsFilled = (slots) => GEAR_SLOTS.some(sl => gItem(slots[sl.k]?.item));
  function renderScLink(set) {
    const box = R.$('gearScLink'); if (!box) return;
    const all = scSets(), linked = set.sc && all.find(x => x.scId === set.sc.scId && x.setId === set.sc.setId);
    const btn = 'px-2.5 py-1.5 rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300';
    box.innerHTML = linked
      ? `<span class="text-slate-400">🔗 Verbunden mit</span><span class="font-semibold text-gold-200" translate="no">${R.esc(linked.scTitle)} › ${R.esc(linked.setName)}</span>
         <button type="button" data-scl="pull" class="${btn}" title="Ausrüstung aus dem Showcase-Set als Ist-Ausrüstung laden">⇩ Ist aus Showcase</button>
         <button type="button" data-scl="push" class="${btn}" title="Ist-Ausrüstung in dieses Showcase-Set übertragen">⇧ Ist ins Showcase</button>
         <button type="button" data-scl="pick:load" class="${btn}">Anderes Set / Ziel …</button>
         <button type="button" data-scl="unlink" class="text-slate-500 hover:text-red-300 px-1" title="Verbindung lösen">✕</button>`
      : `<span class="text-slate-400">🖼 Showcase:</span>
         <button type="button" data-scl="pick:load" class="${btn}">⇩ Set aus Showcase laden</button>
         <button type="button" data-scl="pick:send" class="${btn}">⇧ In Showcase übertragen</button>`;
  }
  async function scLoadInto(set, side, src) {
    const slots = scSlots(src.gear);
    if (!slotsFilled(slots)) { await UI.alert(`„${src.setName}“ hat noch keine Ausrüstung.`); return false; }
    if (slotsFilled(set[side]) && !(await UI.confirm(`${side === 'ist' ? 'Ist' : 'Ziel'}-Ausrüstung von „${set.name}“ mit „${src.scTitle} › ${src.setName}“ überschreiben?`))) return false;
    set[side] = slots; set.sc = { scId: src.scId, setId: src.setId };
    gearFlags = {}; saveGear(); renderGearMain();
    gearMsg(`✓ ${side === 'ist' ? 'Ist' : 'Ziel'} aus „${src.scTitle} › ${src.setName}“ geladen`);
    return true;
  }
  async function scSendFrom(set, side, dst) {
    if (!slotsFilled(set[side])) { await UI.alert(`Die ${side === 'ist' ? 'Ist' : 'Ziel'}-Ausrüstung ist leer – nichts zu übertragen.`); return false; }
    if (GEAR_SLOTS.some(sl => dst.gear?.[sl.k]?.item || dst.gear?.[sl.k]?.name) && !(await UI.confirm(`Ausrüstung im Showcase-Set „${dst.scTitle} › ${dst.setName}“ mit der ${side === 'ist' ? 'Ist' : 'Ziel'}-Ausrüstung von „${set.name}“ überschreiben?`))) return false;
    const ok = await R.scPutGear?.(dst.scId, dst.setId, set[side], set.name);
    if (!ok) { gearMsg('Showcase-Set nicht gefunden.', false); return false; }
    set.sc = { scId: dst.scId, setId: dst.setId }; saveGear(); renderGearMain();
    gearMsg(`✓ ${side === 'ist' ? 'Ist' : 'Ziel'} ins Showcase „${dst.scTitle} › ${dst.setName}“ übertragen`);
    return true;
  }
  // Auswahl-Fenster: Showcase-Set wählen, dazu Ist oder Ziel
  function openScPicker(mode0) {
    let mode = mode0 === 'send' ? 'send' : 'load';
    const set = activeSet(), all = scSets();
    const prevOverflow = document.body.style.overflow, root = document.createElement('div');
    root.className = 'fixed inset-0 z-[90] grid place-items-center p-2 sm:p-4 bg-ink-950/80 backdrop-blur-sm ui-fade';
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true');
    let side = 'ist';
    const groups = [...new Map(all.map(x => [x.scId, x.scTitle]))];
    const draw = () => {
      const chip = (v, l) => `<button type="button" data-sp-side="${v}" class="${hChip(side === v)}">${l}</button>`;
      const mchip = (v, l) => `<button type="button" data-sp-mode="${v}" class="${hChip(mode === v)}">${l}</button>`;
      root.innerHTML = `<div class="panel !bg-ink-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-6 shadow-2xl ui-pop">
        <div class="flex items-start justify-between gap-3">
          <div><h3 class="font-display text-xl gold-text">${mode === 'load' ? '⇩ Set aus Showcase laden' : '⇧ In Showcase übertragen'}</h3>
            <p class="text-xs text-slate-400 mt-1">${mode === 'load' ? `Ausrüstung eines Showcase-Sets in „${R.esc(set.name)}“ laden.` : `Ausrüstung von „${R.esc(set.name)}“ in ein Showcase-Set schreiben.`}</p></div>
          <button type="button" data-sp="close" class="text-slate-400 hover:text-white text-xl leading-none px-1">✕</button></div>
        <div class="mt-3 flex flex-wrap items-center gap-2 text-xs">${mchip('load', '⇩ Showcase → Planer')}${mchip('send', '⇧ Planer → Showcase')}</div>
        <div class="mt-2 flex flex-wrap items-center gap-2 text-xs"><span class="text-slate-400">${mode === 'load' ? 'Laden als' : 'Übertragen wird die'}:</span>
          ${chip('ist', 'Ist-Ausrüstung')}${chip('ziel', 'Ziel-Ausrüstung')}</div>
        <div class="mt-4 space-y-4">${groups.length ? groups.map(([id, title]) => `<div>
          <div class="text-[11px] uppercase tracking-widest text-slate-500 mb-1.5" translate="no">${R.esc(title)}</div>
          <div class="space-y-1.5">${all.filter(x => x.scId === id).map(x => { const slots = scSlots(x.gear), on = set.sc?.scId === x.scId && set.sc?.setId === x.setId;
            return `<button type="button" data-sp-pick="${R.esc(x.scId)}|${R.esc(x.setId)}" class="w-full flex items-center gap-3 rounded-xl border ${on ? 'border-gold-400 bg-gold-500/10' : 'border-ink-700 hover:border-gold-500/60'} bg-ink-950/40 p-2 text-left">
              <span class="w-28 shrink-0 text-sm font-semibold text-slate-100 truncate" translate="no">${R.esc(x.setName)}${on ? ' 🔗' : ''}</span>
              <span class="flex flex-wrap gap-1">${GEAR_SLOTS.map(sl => hIcon(slots[sl.k])).join('')}</span></button>`; }).join('')}</div></div>`).join('')
          : '<div class="py-6 text-center text-sm text-slate-500">Noch kein Showcase – im Profil einen Showcase anlegen.</div>'}</div>
      </div>`;
    };
    const close = () => { document.removeEventListener('keydown', onKey, true); root.remove(); document.body.style.overflow = prevOverflow; };
    const onKey = (ev) => { if (ev.key === 'Escape') { ev.preventDefault(); close(); } };
    root.addEventListener('click', async (ev) => {
      if (ev.target === root || ev.target.closest('[data-sp="close"]')) return close();
      const sd = ev.target.closest('[data-sp-side]'); if (sd) { side = sd.dataset.spSide; draw(); return; }
      const md = ev.target.closest('[data-sp-mode]'); if (md) { mode = md.dataset.spMode; draw(); return; }
      const pk = ev.target.closest('[data-sp-pick]'); if (!pk) return;
      const [scId, setId] = pk.dataset.spPick.split('|'), x = all.find(y => y.scId === scId && y.setId === setId); if (!x) return;
      close();
      if (mode === 'load') await scLoadInto(set, side, x); else await scSendFrom(set, side, x);
    });
    document.addEventListener('keydown', onKey, true);
    draw(); document.body.appendChild(root); document.body.style.overflow = 'hidden';
  }
  R.$('gearScLink').addEventListener('click', async (ev) => {
    const b = ev.target.closest('[data-scl]'); if (!b) return;
    const set = activeSet(), act = b.dataset.scl;
    if (act.startsWith('pick:')) return openScPicker(act.slice(5));
    if (act === 'unlink') { set.sc = null; saveGear(); renderGearMain(); return; }
    const x = set.sc && scSets().find(y => y.scId === set.sc.scId && y.setId === set.sc.setId); if (!x) return;
    if (act === 'pull') await scLoadInto(set, 'ist', x); else if (act === 'push') await scSendFrom(set, 'ist', x);
  });

  // ---- Ereignisse: Set-Verwaltung ----
  let gearFormMode = null;
  const gearMsg = (t, ok = true) => R.flash(R.$('gearMsg'), R.esc(t), ok);
  function openGearForm(m) {
    gearFormMode = m;
    R.$('gearNameLabel').textContent = m === 'new' ? 'Name des neuen Sets' : 'Neuer Name für das Set';
    R.$('gearNameInput').value = m === 'rename' ? activeSet().name : '';
    R.$('gearNameForm').classList.remove('hidden'); R.$('gearNameInput').focus(); R.$('gearNameInput').select();
  }
  const closeGearForm = () => { gearFormMode = null; R.$('gearNameForm').classList.add('hidden'); };
  R.$('gearNew').onclick = () => openGearForm('new');
  R.$('gearRename').onclick = () => openGearForm('rename');
  R.$('gearNameCancel').onclick = closeGearForm;
  R.$('gearNameForm').onsubmit = (ev) => {
    ev.preventDefault();
    const name = R.$('gearNameInput').value.trim().replace(/\s+/g, ' ').slice(0, 40);
    if (!name) return;
    if (gear.sets.some(s => s.name.toLowerCase() === name.toLowerCase() && (gearFormMode === 'new' || s.id !== gear.active))) { gearMsg('Ein Set mit diesem Namen gibt es schon.', false); return; }
    if (gearFormMode === 'new') { const s = newGearSet(name); gear.sets.push(s); gear.active = s.id; gearFlags = {}; gearMsg(`✓ Set „${name}“ erstellt`); }
    else { activeSet().name = name; gearMsg(`✓ Set umbenannt in „${name}“`); }
    closeGearForm(); saveGear(); renderGearMain();
  };
  R.$('gearSetSel').onchange = () => { gear.active = R.$('gearSetSel').value; gearFlags = {}; closeGearForm(); R.LS.set(GEAR_SETS, JSON.stringify(gear)); renderGearMain(); };
  R.$('gearDelete').onclick = async () => {
    const s = activeSet();
    if (!(await UI.confirm(`Set „${s.name}“ wirklich löschen? Das kann nicht rückgängig gemacht werden.`))) return;
    gear.sets = gear.sets.filter(x => x.id !== s.id);
    if (!gear.sets.length) gear.sets.push(newGearSet('Neues Set'));
    gear.active = gear.sets[0].id; gearFlags = {}; closeGearForm();
    saveGear(); renderGearMain(); gearMsg(`🗑 Set „${s.name}“ gelöscht`);
  };
  R.$('gearSave').onclick = async () => {
    saveGear(); R.$('gearSave').disabled = true;
    try {
      const r = await RokAuth.saveNow('gear');
      gearMsg(r.ok ? '✓ Set gespeichert · in der Cloud (user_state)' : '✓ Lokal gespeichert · Cloud gerade nicht erreichbar, wird automatisch nachgeholt');
    } finally { R.$('gearSave').disabled = false; }
  };

  // ---- Ereignisse: Katalog (eigene Items; Supabase-Items nur in Supabase änderbar) ----
  R.$('gearCatRows').addEventListener('change', (ev) => {
    const t = ev.target.closest('[data-cid]'); if (!t) return;
    const it = gearCustom.find(i => i.id === t.dataset.cid), f = t.dataset.f; if (!it) return;
    if (f === 'name') it.name = t.value.trim().slice(0, 60) || 'Item';
    else if (f === 'cat') it.cat = GEAR_CATS[t.value] ? t.value : it.cat;
    else { it[f] = gNum(t.value); t.value = it[f]; }
    saveGearCustom(); rebuildGearCat(); renderGearMain();
  });
  R.$('gearCatRows').addEventListener('click', async (ev) => {
    const ce = ev.target.closest('[data-cedit]'); if (ce) { openCostEditor(ce.dataset.cedit); return; }
    const b = ev.target.closest('[data-cdel]'); if (!b) return;
    const it = gearCustom.find(i => i.id === b.dataset.cdel); if (!it) return;
    const used = gear.sets.some(s => GEAR_SLOTS.some(sl => s.ist[sl.k].item === it.id || s.ziel[sl.k].item === it.id));
    if (!(await UI.confirm(`Item „${it.name}“ löschen?` + (used ? '\n\nEs wird in mindestens einem Set verwendet – dieser Slot gilt danach als leer.' : '')))) return;
    gearCustom = gearCustom.filter(i => i.id !== it.id); saveGearCustom(); rebuildGearCat(); renderGear();
  });
  R.$('gearCatAdd').onclick = () => {
    gearCustom.push(gNormItem({ id: 'c_' + R.newId(), name: 'Neues Item', cat: 'helm' }));
    saveGearCustom(); rebuildGearCat(); renderGear();
    R.$('gearCatBox').open = true;
    const inputs = R.$('gearCatRows').querySelectorAll('input[data-f="name"]:not([disabled])'), last = inputs[inputs.length - 1];
    if (last) { last.focus(); last.select(); }
  };
  R.$('gearCatReload').onclick = () => loadGearDb();
  let catMissing = false;
  R.$('gearCatMissing').onclick = () => { catMissing = !catMissing; renderGearCat(); };

  // ---- Kosten-Eingabe: Tabelle Stufen × Materialien je Item (speichern nur für Admins, Tabelle gear_costs) ----
  const CE_ROWS = [['craft', '⚒ Craften'], ['refine', '✦ Refine'], ['awaken_1', 'Tier I'], ['awaken_2', 'Tier II'], ['awaken_3', 'Tier III'], ['awaken_4', 'Tier IV'], ['awaken_5', 'Tier V']];
  const CE_COLS = [['leather', '🐂', 'Leder'], ['iron', '⛓️', 'Erz'], ['ebony', '🪵', 'Ebenholz'], ['bone', '🦴', 'Knochen'], ['gold', '🪙', 'Gold'], ['blueprint', '📜', 'Blaupause'], ['iconic_crystal', '💎', 'Kristall']];
  const Q_LABEL = { legendary: 'legendäre', epic: 'epische (lila)', elite: 'Elite- (blaue)', advanced: 'fortgeschrittene (grüne)', common: 'normale (graue)' };
  // „20 Mio“, „20m“, „1,5 Mrd“, „20.000.000“, „250k“ → Zahl · leer → null · ungültig → NaN
  function ceParse(v) {
    let t = String(v ?? '').trim().toLowerCase().replace(/\s+/g, ''); if (!t) return null;
    let mult = 1; const u = t.match(/(mrd|mio|tsd|b|m|k)\.?$/);
    if (u) { mult = { mrd: 1e9, b: 1e9, mio: 1e6, m: 1e6, tsd: 1e3, k: 1e3 }[u[1]]; t = t.slice(0, u.index); }
    t = mult > 1 ? t.replace(',', '.') : t.replace(/[.,](?=\d{3}(?:[.,]|$))/g, '').replace(',', '.');
    if (!/^\d+(\.\d+)?$/.test(t)) return NaN;
    return Math.round(parseFloat(t) * mult);
  }
  const ceShow = (k, n) => n == null ? '' : k === 'gold' && n >= 1e6 && n % 1e5 === 0 ? (n / 1e6).toLocaleString('de-DE') + ' Mio' : String(n);
  function openCostEditor(eqId) {
    const e = EQ.byId?.get(eqId); if (!e) return;
    const it = R.gearCat.find(i => i.eq === e), canEdit = gAdmin;
    const prevOverflow = document.body.style.overflow, root = document.createElement('div');
    root.className = 'fixed inset-0 z-[90] grid place-items-center p-2 sm:p-4 bg-ink-950/80 backdrop-blur-sm ui-fade';
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true');
    const others = EQ.list.filter(x => x.id !== e.id && x.costs && Object.keys(x.costs).length && EQ_SLOT[x.slot] === EQ_SLOT[e.slot])
      .sort((a, b) => (a.quality === e.quality ? 0 : 1) - (b.quality === e.quality ? 0 : 1) || a.name.localeCompare(b.name));
    const inp = 'w-full min-w-[56px] bg-ink-950 border border-ink-600 rounded-md px-1.5 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:border-gold-500 disabled:opacity-70 disabled:border-transparent';
    root.innerHTML = `<div class="panel !bg-ink-900 w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl p-4 sm:p-6 shadow-2xl ui-pop">
      <div class="flex items-start gap-3">
        ${it?.icon ? `<img src="${it.icon}" alt="" class="w-12 h-12 object-contain shrink-0">` : ''}
        <div class="min-w-0 flex-1">
          <h3 class="font-display text-xl gold-text leading-tight" translate="no">${R.esc(e.name)}</h3>
          <p class="text-xs text-slate-400 mt-1">Zahlen genau wie im Spiel abschreiben – Materialien sind <b class="text-slate-200">${Q_LABEL[e.quality] || 'legendäre'}</b>. Leer = noch unbekannt (wird nicht mitgerechnet). Gold geht auch als „20 Mio“.</p>
        </div>
        <button type="button" data-ce="close" class="text-slate-400 hover:text-white text-xl leading-none px-1" title="Schließen">✕</button>
      </div>
      ${canEdit && others.length ? `<div class="mt-3 flex flex-wrap items-center gap-2 text-xs"><span class="text-slate-400">Kosten übernehmen von</span>
        <select data-ce="copyfrom" class="bg-ink-950 border border-ink-600 rounded-lg px-2 py-1 text-xs max-w-[220px]"><option value="">– Item wählen –</option>${others.map(x => `<option value="${R.esc(x.id)}">${R.esc(x.name)}</option>`).join('')}</select>
        <span class="text-slate-500">(danach anpassen)</span></div>` : ''}
      <div class="mt-4 overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="text-[11px] text-slate-400"><tr><th></th>${CE_COLS.map(([, ic, l]) => `<th class="px-1 pb-1 font-medium text-center whitespace-nowrap">${ic}<div class="text-[10px]">${l}</div></th>`).join('')}</tr></thead>
          <tbody>${CE_ROWS.map(([st, label]) => `<tr>
            <td class="pr-2 py-1 whitespace-nowrap font-semibold ${st === 'craft' ? 'text-gold-300' : st === 'refine' ? 'text-red-300' : 'text-sky-300'}">${label}</td>
            ${CE_COLS.map(([k]) => `<td class="px-0.5 py-1"><input data-st="${st}" data-k="${k}" inputmode="decimal" autocomplete="off" ${canEdit ? '' : 'disabled'} value="${R.esc(ceShow(k, e.costs?.[st]?.[k] ?? (e.costs?.[st] ? 0 : null)))}" class="${inp}"></td>`).join('')}
          </tr>`).join('')}</tbody>
        </table>
      </div>
      <div data-ce="sum" class="mt-3 text-xs text-slate-400"></div>
      <div data-ce="msg" class="mt-2 text-xs"></div>
      <div class="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" data-ce="json" class="px-3 py-2 rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300 text-xs" title="Kosten dieses Items als JSON für gear-data.json kopieren">📋 Als JSON kopieren</button>
        <button type="button" data-ce="close" class="px-4 py-2 rounded-lg border border-ink-600 hover:border-gold-500/60 text-sm">${canEdit ? 'Abbrechen' : 'Schließen'}</button>
        ${canEdit ? '<button type="button" data-ce="save" class="px-5 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-ink-950 text-sm font-semibold disabled:opacity-50">💾 Speichern</button>' : ''}
      </div>
      ${canEdit ? '' : '<div class="mt-2 text-[11px] text-slate-500 text-right">Nur Admins können Kosten ändern.</div>'}
    </div>`;
    const $q = (s) => root.querySelector(s), inputs = [...root.querySelectorAll('input[data-st]')];
    // eingetippte Werte → costs-Objekt; ungültige Felder rot
    const read = () => { const c = {}; let bad = 0;
      inputs.forEach(i => { const n = ceParse(i.value); i.classList.toggle('!border-red-500', Number.isNaN(n)); if (Number.isNaN(n)) { bad++; return; }
        if (n == null) return; (c[i.dataset.st] = c[i.dataset.st] || { _set: 1 })[i.dataset.k] = n; });
      return { costs: cleanCosts(c), bad }; };
    const upd = () => { const { costs, bad } = read(), done = CE_ROWS.filter(([st]) => costs[st]).length;
      const tmp = { eq: { costs }, qm: EQ_QM[e.quality] || 256 }, t = gZero(); EQ_STAGES.forEach(st => gAdd(t, stageCost(tmp, st)));
      $q('[data-ce="sum"]').innerHTML = `${done} von ${CE_ROWS.length} Stufen ausgefüllt · bis Max: <b class="text-gold-300">${gq(gMatSum(t))}</b> legendäre Mats${t.gold ? ' · 🪙 ' + gGold(t.gold) : ''}${t.crystal ? ' · 💎 ' + gq(t.crystal) : ''}${t.bp ? ' · 📜 ' + gq(t.bp) : ''}`;
      if ($q('[data-ce="save"]')) $q('[data-ce="save"]').disabled = bad > 0;
      $q('[data-ce="msg"]').innerHTML = bad ? `<span class="text-red-300">⚠ ${bad} ${bad === 1 ? 'Feld ist' : 'Felder sind'} keine gültige Zahl.</span>` : '';
      return { costs, bad }; };
    const close = () => { document.removeEventListener('keydown', onKey, true); root.remove(); document.body.style.overflow = prevOverflow; };
    const onKey = (ev) => { if (ev.key === 'Escape') { ev.preventDefault(); close(); } };
    root.addEventListener('input', upd);
    root.addEventListener('change', (ev) => {
      if (ev.target.dataset.ce !== 'copyfrom' || !ev.target.value) return;
      const src = EQ.byId.get(ev.target.value); if (!src) return;
      inputs.forEach(i => { const v = src.costs?.[i.dataset.st]?.[i.dataset.k]; i.value = ceShow(i.dataset.k, v ?? (src.costs?.[i.dataset.st] ? 0 : null)); });
      upd();
    });
    root.addEventListener('click', async (ev) => {
      if (ev.target === root) return close();
      const b = ev.target.closest('[data-ce]'); if (!b || b.tagName === 'SELECT') return;
      const act = b.dataset.ce;
      if (act === 'close') return close();
      if (act === 'json') {
        const txt = JSON.stringify({ id: e.id, costs: upd().costs });
        try { await navigator.clipboard.writeText(txt); $q('[data-ce="msg"]').innerHTML = '<span class="text-emerald-300">✓ Kopiert</span>'; }
        catch { $q('[data-ce="msg"]').innerHTML = `<code class="break-all text-slate-300">${R.esc(txt)}</code>`; }
        return;
      }
      if (act === 'save') {
        const { costs, bad } = upd(); if (bad) return;
        b.disabled = true; b.textContent = 'Speichert …';
        try {
          const { error } = await RokAuth.db().from('gear_costs').upsert({ item_id: e.id, costs, updated_at: new Date().toISOString() }, { onConflict: 'item_id' });
          if (error) throw error;
          e.costs = costs; EQ.dbCosts.add(e.id); EQ.dbErr = '';
          rebuildGearCat(); renderGear(); close();
        } catch (err) {
          $q('[data-ce="msg"]').innerHTML = `<span class="text-red-300">⚠ ${R.esc(R.tableMissing(err) ? 'Die Tabelle gear_costs fehlt noch – bitte zuerst das SQL im Supabase SQL Editor ausführen.' : (RokAuth.germanError ? RokAuth.germanError(err) : err.message || err))}</span>`;
          b.disabled = false; b.textContent = '💾 Speichern';
        }
      }
    });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(root); document.body.style.overflow = 'hidden';
    upd(); setTimeout(() => (inputs.find(i => !i.disabled && !i.value) || inputs[0])?.focus(), 30);
  }
  R.openCostEditor = openCostEditor;

  // ---- KI-Scan der Ist-Ausrüstung (Modus "gear" in /api/scan, Katalog kommt dort aus gear_items) ----
  function gearRarity(v) { const t = gNorm(v); if (!t) return null; return /legend|gold|orange/.test(t) ? 'legendary' : /elite|blau|blue/.test(t) ? 'elite' : /normal|grau|grey|gray|grun|green|advanced/.test(t) ? 'normal' : 'epic'; }
  function gearByRef(cat, info) {                            // Nummer von der Referenztafel → Katalog-Item (oder nur Bild + Name)
    const order = R.gearRefOrder(), slotCat = cat;
    const cands = [info?.ref, info?.ref2, info?.ref3].map(r => order[R.refNum(r, order.length) - 1]).filter(Boolean);
    if (!cands.length) return null;
    // Feldfarbe = Seltenheit: ein oranges (legendäres) Feld kann nie ein lila Item sein – und umgekehrt
    const rar = gearRarity(info?.rarity), catOk = (x) => (R.GEAR_FILE_CAT[x] || 'accessory') === slotCat, rarOk = (x) => !rar || R.gearFileRar(x) === rar;
    const f = cands.find(x => catOk(x) && rarOk(x)) || (rar ? null : cands.find(catOk) || cands[0]);
    if (!f) return { reject: true, why: `Farbe/Typ passt nicht (${rar === 'legendary' ? 'orange' : rar === 'epic' ? 'lila' : rar})` };
    const it = R.gearCat.find(i => i.cat === cat && R.gearIconStem(i.icon) === f) || R.gearCat.find(i => R.gearIconStem(i.icon) === f);
    return it || { file: f };
  }
  function gearMatch(cat, info) {
    const text = gNorm([info.name, info.description].filter(Boolean).join(' '));
    if (!text) return null;
    let best = null, score = 0;
    R.gearCat.filter(i => i.cat === cat).forEach(i => {
      const n = gNorm(i.name);
      const s = n === gNorm(info.name) ? 100 : (n.length > 3 && text.includes(n) ? 10 + n.length : 0);
      if (s > score) { score = s; best = i; }
    });
    return best;
  }
  function applyGearScan(r) {
    const src = r.slots || r.equipment || r, set = activeSet();
    gearFlags = {}; let hit = 0, seen = 0;
    GEAR_SLOTS.forEach(sl => {
      let info = src[sl.k];
      if (!info || typeof info !== 'object') return;
      seen++;
      const byRef = gearByRef(sl.cat, info);
      if (byRef?.reject) { set.ist[sl.k] = { item: '', rarity: gearRarity(info.rarity) || 'legendary', tier: 0, refine: 0, refType: 'infantry' }; gearFlags[sl.k] = byRef.why + ' – bitte von Hand wählen'; return; }
      let it = byRef && !byRef.file ? byRef : (info.item_id ? gItem(String(info.item_id)) : null);
      if (it && it.cat !== sl.cat && !it.lib) it = null;
      if (!it && !byRef) it = gearMatch(sl.cat, info);
      if (!it && byRef?.file) info = { ...info, name: R.gearFileName(byRef.file) };
      const rar = gearRarity(info.rarity);
      if (it) {
        set.ist[sl.k] = { item: it.id, rarity: it.rarity || rar || 'legendary', tier: gTier(info.tier), refine: gScanRefine(info), refType: gRefType(info.refine_type) }; hit++;
      } else {
        set.ist[sl.k] = { item: '', rarity: rar || 'legendary', tier: 0, refine: 0, refType: 'infantry' };
        gearFlags[sl.k] = 'nicht im Katalog: ' + String(info.name || info.description || 'unbekanntes Item').slice(0, 60);
      }
    });
    if (!seen) throw new Error('Keine Ausrüstung im Screenshot erkannt. Bitte die Slots von Hand wählen.');
    const firstFlag = GEAR_SLOTS.find(sl => gearFlags[sl.k]);
    if (firstFlag) gearSel.ist = firstFlag.k;
    saveGear(); renderGearMain();
    return { hit, seen };
  }
  const gearScanMsg = (t, cls) => { const el = R.$('gearScanMsg'); el.textContent = t; el.className = 'mt-2 text-xs ' + cls; };
  let gearScanning = false;
  async function gearScan(fileList) {
    const files = [...(fileList || [])].filter(f => f && f.type.startsWith('image/')).slice(0, 2);
    if (!files.length || gearScanning) return;
    gearScanning = true;
    const imgs = [];
    gearScanMsg('Claude liest deine Ausrüstung …', 'text-slate-300');
    try {
      for (const f of files) imgs.push(await R.prepareImage(f));
      const res = await fetch('/api/scan', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: 'gear', images: imgs.map(i => ({ media_type: i.mediaType, data: i.base64 })), refs: await R.scanRefs(['gear', 'gear2']) }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 400 && /modus|mode/i.test(data?.error || '')) throw new Error('Der Scan-Server kennt den Ausrüstungs-Scan noch nicht – bitte die neue api/scan.js einspielen. Bis dahin die Slots von Hand wählen.');
        if (res.status === 404) throw new Error('Server-Route /api/scan nicht gefunden. Die Seite muss über Vercel laufen (nicht als lokale Datei).');
        if (res.status === 413) throw new Error('Die Bilder sind zu groß. Bitte weniger Screenshots auf einmal hochladen.');
        throw new Error(data?.error || `Serverfehler ${res.status}`);
      }
      const r = R.parseJson(String(data.text || ''));
      if (!r) throw new Error('Die Antwort konnte nicht ausgelesen werden. Bitte erneut versuchen.');
      const { hit, seen } = applyGearScan(r);
      gearScanMsg(`✓ ${hit} von ${seen} Slots erkannt` + (hit < seen ? ' – markierte Slots bitte von Hand wählen.' : '') + (r.confidence ? ` · Sicherheit: ${r.confidence}` : ''),
        hit < seen ? 'text-amber-300' : 'text-emerald-400');
    } catch (e) {
      gearScanMsg(e.message === 'Failed to fetch' ? 'Netzwerkfehler – keine Verbindung zum Scan-Server.' : (e.message || String(e)), 'text-red-300');
    } finally { imgs.forEach(i => { i.base64 = null; i.dataUrl = null; }); imgs.length = 0; gearScanning = false; }   // Bilder sofort verwerfen
  }
  const gDrop = R.$('gearIstPanel');
  ['dragenter', 'dragover'].forEach(e => gDrop.addEventListener(e, ev => { ev.preventDefault(); gDrop.classList.add('drop-active'); }));
  ['dragleave', 'drop'].forEach(e => gDrop.addEventListener(e, ev => { ev.preventDefault(); if (e === 'drop' || !gDrop.contains(ev.relatedTarget)) gDrop.classList.remove('drop-active'); }));
  gDrop.addEventListener('drop', ev => gearScan(ev.dataTransfer.files));
  R.$('gearFile').addEventListener('change', ev => { gearScan(ev.target.files); ev.target.value = ''; });

  // ================= Ziele (eigenes Fenster im Craft-Tab) =================
  // Je Set: Ziel = Ziel-Ausrüstung oder „alles Max“, optional Zieldatum. Fortschritt = wie viel des Bedarfs der Rucksack schon deckt.
  const gDays = (date) => { if (!date) return null; const d = new Date(date + 'T23:59:59'); return Math.max(0, Math.ceil((d - Date.now()) / 864e5)); };
  function goalCalc(set, st) {
    const target = set.goal.mode === 'max' ? gMaxSlots(set) : set.ziel;
    const calc = gearCalc(set, target), lines = gearBalance(calc, st, set.useChests);
    const gross = gMatSum(calc.need), covered = lines.reduce((a, l) => a + Math.min(l.gross, l.stock + l.back + l.chest), 0);
    const unknown = calc.rows.some(r => r.craftMissing || r.tierMissing.length || r.refMissing);
    return { calc, lines, gross, pct: gross > 0.005 ? (st.mats || lines.some(l => l.back > 0) ? covered / gross : null) : unknown ? null : 1,
      days: gDays(set.goal.date), unknown };
  }
  const gBar = (pct) => pct == null ? '<div class="h-2 rounded-full bg-ink-800"></div>'
    : `<div class="h-2 rounded-full bg-ink-800 overflow-hidden"><div class="h-full rounded-full ${pct >= 0.999 ? 'bg-emerald-400' : 'bg-gradient-to-r from-gold-600 to-gold-400'}" style="width:${Math.round(Math.min(1, pct) * 100)}%"></div></div>`;
  const gPct = (pct) => pct == null ? '?' : Math.floor(Math.min(1, pct) * 100) + ' %';
  // Tabelle Bedarf / Bestand / fehlt / pro Tag
  function goalTable(lines, need, days, hasStock, unknown) {
    const row = (icon, label, n, have, miss, f, plain) => `<tr class="border-b border-ink-800 last:border-0">
      <td class="py-1 pr-2 whitespace-nowrap text-slate-300">${icon} ${label}</td>
      <td class="py-1 px-2 text-right tabular-nums whitespace-nowrap text-white">${f(n)}</td>
      <td class="py-1 px-2 text-right tabular-nums whitespace-nowrap text-slate-400">${plain ? '' : have == null ? '?' : f(have)}</td>
      <td class="py-1 px-2 text-right tabular-nums whitespace-nowrap font-semibold ${miss == null ? 'text-slate-500' : miss > 0.005 ? 'text-red-300' : 'text-emerald-300'}">${plain ? '' : miss == null ? '?' : miss > 0.005 ? f(miss) : '✓'}</td>
      ${days != null ? `<td class="py-1 pl-2 text-right tabular-nums whitespace-nowrap text-sky-300">${miss == null || miss <= 0.005 ? '–' : f(miss / Math.max(1, days))}</td>` : ''}</tr>`;
    const mats = lines.filter(l => l.gross > 0.005).map(l => row(l.m.icon, l.m.label, l.gross, hasStock || l.back > 0 ? l.stock + l.back + l.chest : null, hasStock ? l.deficit : null, gq));
    const xs = GX.filter(x => need[x.k] > 0.005).map(x => row(x.icon, x.label, need[x.k], null, null, x.f, true));
    if (!mats.length && !xs.length) return unknown ? '<div class="text-xs text-amber-300">Noch keine Kosten eingetragen – in gear-data.json ergänzen.</div>' : '<div class="text-xs text-emerald-300">✓ Nichts mehr zu tun – Ziel erreicht.</div>';
    return `<table class="w-full text-xs"><thead class="text-[10px] uppercase tracking-wider text-slate-500"><tr>
      <th class="py-1 pr-2 text-left font-medium"></th><th class="py-1 px-2 text-right font-medium">Bedarf</th><th class="py-1 px-2 text-right font-medium">Hast du</th><th class="py-1 px-2 text-right font-medium">Fehlt</th>
      ${days != null ? '<th class="py-1 pl-2 text-right font-medium">pro Tag</th>' : ''}</tr></thead><tbody>${mats.join('')}${xs.join('')}</tbody></table>
      <div class="mt-1 text-[10px] text-slate-500">Materialien in legendären Einheiten (1 legendär = 4 episch = 16 Elite)${GX.some(x => need[x.k] > 0) ? ' · Gold, Kristalle und Blaupausen: nur Bedarf' : ''}</div>`;
  }
  // große, gut sichtbare Item-Symbole (Rahmen in Seltenheitsfarbe, Tier und Refine als Abzeichen)
  const gBigIcon = (v) => { const it = gItem(v?.item);
    if (!it) return '<span class="w-14 h-14 shrink-0 rounded-xl grid place-items-center border-2 border-dashed border-ink-700 text-slate-600 text-lg">∅</span>';
    return `<span class="relative shrink-0" title="${R.esc(it.name)}${v.tier ? ' · T' + v.tier : ''}${v.refine ? ' · Refine ' + gRefTxt(v.refine) : ''}">${stepIcon(v, 'w-14 h-14')}
      ${v.tier ? `<span class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 rounded-md bg-ink-950 border border-gold-400 text-[11px] font-extrabold text-gold-300 leading-4">${ROMAN[v.tier - 1]}</span>` : ''}
      ${v.refine ? `<span class="absolute -top-1.5 -right-1.5 w-6 h-6">${gRefIcon(v, 'w-6 h-6')}</span>` : ''}</span>`; };
  const gMini = (slots) => `<div class="flex flex-wrap gap-1.5 pb-1.5">${GEAR_SLOTS.map(sl => gBigIcon(slots[sl.k])).join('')}</div>`;
  function renderGoals() {
    const box = R.$('goalSets'); if (!box) return;
    const st = gearStock();
    R.$('goalMatStock').innerHTML = st.mats ? `<div class="text-xs text-slate-400 mb-2">📦 Dein Rucksack (legendäre Einheiten) · Scan vom <b class="text-slate-200">${R.dateLabel(st.ts)}</b></div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">${R.MATS.map(m => `<div class="rounded-xl border border-ink-700 bg-ink-950/50 px-4 py-3 flex items-center gap-3">
        <span class="w-12 h-12 shrink-0 rounded-xl grid place-items-center text-3xl" style="background:${m.c}22;border:1px solid ${m.c}66">${m.icon}</span>
        <div><div class="text-2xl font-extrabold tabular-nums text-white leading-tight">${gq(st.mats[m.k])}</div><div class="text-xs text-slate-400">${m.label}</div></div></div>`).join('')}</div>`
      : `<div class="text-sm text-amber-300">⚠ Noch kein Material-Scan – Fortschritt kann nicht berechnet werden. <button data-goscan="mats" class="underline text-gold-300 hover:text-gold-400">Materialien scannen</button></div>`;
    const res = gear.sets.map(s => ({ s, g: goalCalc(s, st) }));
    // Gesamtziel: alle markierten Sets zusammen, Rucksack zählt nur einmal
    const on = res.filter(x => x.s.goal.on), total = gZero(), back = gZero();
    on.forEach(x => { gAdd(total, x.g.calc.need); gAdd(back, x.g.calc.back); });
    const tLines = gearBalance({ need: total, back }, st, on.some(x => x.s.useChests));
    const tUnknown = on.some(x => x.g.unknown), tGross = gMatSum(total), tPct = tGross > 0.005 ? (st.mats ? tLines.reduce((a, l) => a + Math.min(l.gross, l.stock + l.back + l.chest), 0) / tGross : null) : tUnknown ? null : 1;
    const dated = on.map(x => x.g.days).filter(d => d != null), tDays = dated.length ? Math.min(...dated) : null;
    R.$('goalTotal').innerHTML = `<div class="panel rounded-2xl p-5 ring-1 ring-gold-500/30">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div><div class="text-xs uppercase tracking-widest text-slate-400">Gesamtziel</div>
          <div class="font-display text-2xl gold-text">${on.length} von ${res.length} ${res.length === 1 ? 'Set' : 'Sets'}</div>
          <div class="text-[11px] text-slate-500">Sets mit Häkchen „im Gesamtziel“ · dein Rucksack wird nur einmal gezählt</div></div>
        <div class="text-right"><div class="text-3xl font-extrabold tabular-nums ${tPct != null && tPct >= 0.999 ? 'text-emerald-300' : 'text-gold-300'}">${gPct(tPct)}</div>
          <div class="text-[11px] text-slate-400">der Materialien vorhanden${tDays != null ? ` · nächstes Zieldatum in <b class="text-sky-300">${tDays} ${tDays === 1 ? 'Tag' : 'Tagen'}</b>` : ''}</div></div>
      </div>
      <div class="mt-3">${gBar(tPct)}</div>
      <div class="mt-4 overflow-x-auto">${on.length ? goalTable(tLines, total, tDays, !!st.mats, tUnknown) + (tUnknown ? '<div class="mt-1 text-[11px] text-amber-300">⚠ In manchen Sets fehlen noch Kosten – nicht mitgerechnet.</div>' : '') : '<div class="text-xs text-slate-500">Kein Set ausgewählt.</div>'}</div>
    </div>`;
    box.innerHTML = res.map(({ s, g }) => {
      const c = g.calc, crafts = c.rows.filter(r => r.status === 'craft').length, tiers = c.rows.reduce((a, r) => a + Math.max(0, r.tierTo - r.tierFrom), 0), refs = c.rows.filter(r => r.needRefine).length;
      const target = s.goal.mode === 'max' ? gMaxSlots(s) : s.ziel, emptyZiel = s.goal.mode === 'ziel' && !GEAR_SLOTS.some(sl => gItem(s.ziel[sl.k].item));
      const btn = (m, l) => `<button type="button" data-gmode="${R.esc(s.id)}:${m}" class="${hChip(s.goal.mode === m)}">${l}</button>`;
      return `<section class="panel rounded-2xl p-4 ${s.goal.on ? '' : 'opacity-70'}">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0"><div class="font-display text-lg gold-text truncate" translate="no">${R.esc(s.name)}</div>
            <div class="text-[11px] text-slate-400">${crafts} craften · ${tiers} Tier-Stufen · ${refs} Refines</div></div>
          <div class="text-right"><div class="text-xl font-extrabold tabular-nums ${g.pct != null && g.pct >= 0.999 ? 'text-emerald-300' : 'text-white'}">${gPct(g.pct)}</div>
            ${g.days != null ? `<div class="text-[11px] ${g.days <= 3 ? 'text-red-300' : 'text-sky-300'}">noch ${g.days} ${g.days === 1 ? 'Tag' : 'Tage'}</div>` : ''}</div>
        </div>
        <div class="mt-2">${gBar(g.pct)}</div>
        <div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span class="text-slate-400">Ziel:</span>${btn('ziel', '🎯 Ziel-Ausrüstung')}${btn('max', '⇧ Alles Max')}
          <label class="inline-flex items-center gap-1 text-slate-400">📅 <input type="date" data-gdate="${R.esc(s.id)}" value="${s.goal.date}" class="bg-ink-950 border border-ink-600 rounded-lg px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-gold-500"></label>
          ${s.goal.date ? `<button type="button" data-gdate-clear="${R.esc(s.id)}" class="text-slate-500 hover:text-red-300" title="Zieldatum entfernen">✕</button>` : ''}
          <label class="inline-flex items-center gap-1.5 cursor-pointer text-slate-300 ml-auto"><input type="checkbox" data-gon="${R.esc(s.id)}" ${s.goal.on ? 'checked' : ''} class="w-4 h-4 accent-yellow-500">im Gesamtziel</label>
        </div>
        <div class="mt-3 space-y-1">
          <div class="text-[10px] uppercase tracking-widest text-slate-500">Ist</div>${gMini(s.ist)}
          <div class="pt-1 text-[10px] uppercase tracking-widest text-gold-300">${s.goal.mode === 'max' ? 'Alles Max' : 'Ziel'}</div>${gMini(target)}
        </div>
        <div class="mt-3 overflow-x-auto">${emptyZiel ? '<div class="text-xs text-amber-300">Noch keine Ziel-Ausrüstung – im Planer festlegen oder oben „Alles Max“ wählen.</div>' : goalTable(g.lines, c.need, g.days, !!st.mats, g.unknown)}</div>
        ${g.unknown ? '<div class="mt-1 text-[11px] text-amber-300">⚠ Für manche Stufen fehlen Kosten – nicht mitgerechnet.</div>' : ''}
        <div class="mt-3 flex justify-end"><button type="button" data-gopen="${R.esc(s.id)}" class="text-xs px-3 py-1.5 rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300">⚒ Im Planer öffnen</button></div>
      </section>`;
    }).join('');
  }
  R.$('craftGoalPane').addEventListener('click', (ev) => {
    const t = ev.target, b = (a) => t.closest(`[data-${a}]`);
    if (b('goscan')) { R.goScan(b('goscan').dataset.goscan); return; }
    const setBy = (id) => gear.sets.find(s => s.id === id);
    if (b('gmode')) { const [id, m] = b('gmode').dataset.gmode.split(':'), s = setBy(id); if (s) { s.goal.mode = m === 'max' ? 'max' : 'ziel'; R.LS.set(GEAR_SETS, JSON.stringify(gear)); renderGoals(); } return; }
    if (b('gdate-clear')) { const s = setBy(b('gdate-clear').dataset.gdateClear); if (s) { s.goal.date = ''; R.LS.set(GEAR_SETS, JSON.stringify(gear)); renderGoals(); } return; }
    if (b('gopen')) { const s = setBy(b('gopen').dataset.gopen); if (s) { gear.active = s.id; gearFlags = {}; R.LS.set(GEAR_SETS, JSON.stringify(gear)); craftPane = 'plan'; renderCraftPanes(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }
  });
  R.$('craftGoalPane').addEventListener('change', (ev) => {
    const t = ev.target, setBy = (id) => gear.sets.find(s => s.id === id);
    if (t.dataset.gdate) { const s = setBy(t.dataset.gdate); if (s) { s.goal = gNormGoal({ ...s.goal, date: t.value }); R.LS.set(GEAR_SETS, JSON.stringify(gear)); renderGoals(); } }
    else if (t.dataset.gon) { const s = setBy(t.dataset.gon); if (s) { s.goal.on = t.checked; R.LS.set(GEAR_SETS, JSON.stringify(gear)); renderGoals(); } }
  });

  // ================= Craft-Verlauf (eigenes Fenster im Craft-Tab) =================
  // Seite 1 „History“: eigene History-Einträge (Set wählen → Item antippen → Tier/Refine frei setzen → hinzufügen),
  //   dazu automatische Einträge bei Änderungen der Ist-Ausrüstung im Planer und Screenshot-Einträge.
  // Seite 2 „Gespeicherte Sets“: alle Sets mit Datum sichern, später ansehen, mit heute vergleichen oder wieder laden.
  // Speicher: Keys "rok_scanner_gear_history" / "rok_scanner_gear_snaps" → landen über LS.set automatisch in public.user_state.
  const GEAR_HIST = 'rok_scanner_gear_history', GEAR_SNAPS = 'rok_scanner_gear_snaps', HIST_MAX = 400, SNAP_MAX = 60, HIST_MERGE = 15 * 60e3;
  const gSnap = (v) => ({ item: String(v?.item || ''), name: gItem(v?.item)?.name || String(v?.name || ''), rarity: R.gRar(v?.rarity), tier: gTier(v?.tier), refine: gRefine(v?.refine), refType: gRefType(v?.refType) });
  const gSame = (a, b) => a.item === b.item && (!a.item || (a.tier === b.tier && a.refine === b.refine && (!a.refine || a.refType === b.refType)));
  const hNormCh = (c) => c && GEAR_SLOTS.some(s => s.k === c.slot) ? { slot: c.slot, from: gSnap(c.from || {}), to: gSnap(c.to || {}) } : null;
  const hNorm = (e) => e && typeof e === 'object' && e.id ? {
    id: String(e.id), ts: +e.ts || Date.now(), kind: ['auto', 'manual', 'hist'].includes(e.kind) ? e.kind : 'auto', src: e.src === 'scan' ? 'scan' : 'edit',
    setId: String(e.setId || ''), setName: String(e.setName || '').slice(0, 40), slot: GEAR_SLOTS.some(s => s.k === e.slot) ? e.slot : '',
    changes: (Array.isArray(e.changes) ? e.changes : e.slot && (e.from || e.to) ? [{ slot: e.slot, from: e.from, to: e.to }] : []).map(hNormCh).filter(Boolean),
    note: String(e.note || '').slice(0, 500),
    imgs: Array.isArray(e.imgs) ? e.imgs.filter(u => typeof u === 'string' && /^(https:\/\/|data:image\/jpeg;base64,)/.test(u)).slice(0, 6) : [] } : null;
  let chist = [];
  try { const h = JSON.parse(R.LS.get(GEAR_HIST, '[]')); if (Array.isArray(h)) chist = h.map(hNorm).filter(Boolean); } catch {}
  const saveHist = () => { chist.sort((a, b) => b.ts - a.ts); if (chist.length > HIST_MAX) chist.length = HIST_MAX; R.LS.set(GEAR_HIST, JSON.stringify(chist)); };
  const cloudSave = () => { try { RokAuth.saveNow?.('gear'); } catch {} };
  // Änderung eines Ist-Slots im Planer eintragen; mehrere Klicks am selben Slot innerhalb von 15 Min. = ein Eintrag
  function logIst(set, slot, before, src) {
    if (!before) return;
    const after = gSnap(set.ist[slot]), now = Date.now();
    const prev = chist.find(e => e.kind === 'auto' && e.setId === set.id && e.slot === slot && now - e.ts < HIST_MERGE && e.changes.length === 1);
    if (prev) { prev.changes[0].to = after; prev.ts = now; prev.setName = set.name; if (src === 'scan') prev.src = 'scan'; if (gSame(prev.changes[0].from, after)) chist = chist.filter(e => e !== prev); }
    else { if (gSame(before, after)) return; chist.unshift({ id: R.newId(), ts: now, kind: 'auto', src, setId: set.id, setName: set.name, slot, changes: [{ slot, from: before, to: after }], note: '', imgs: [] }); }
    saveHist();
  }

  // Noch nicht gespeicherte Änderungen der Ist-Ausrüstung (seit dem letzten „In History speichern“)
  const histPending = (set) => GEAR_SLOTS.map(sl => ({ slot: sl.k, from: gSnap(set.histBase[sl.k]), to: gSnap(set.ist[sl.k]) })).filter(c => !gSame(c.from, c.to));
  function renderHistBar(set) {
    const box = R.$('gearHistBar'); if (!box) return;
    const ch = histPending(set);
    box.innerHTML = ch.length ? `<div class="flex flex-wrap items-center gap-2 rounded-lg border border-gold-500/40 bg-gold-500/5 px-2.5 py-1.5 text-xs">
        <span class="text-gold-200">✎ ${ch.length} ${ch.length === 1 ? 'Änderung' : 'Änderungen'} noch nicht in der History</span>
        <button type="button" data-hb="save" class="ml-auto px-2.5 py-1 rounded-lg bg-gold-500 hover:bg-gold-400 text-ink-950 font-semibold">📜 In History speichern</button>
        <button type="button" data-hb="undo" class="px-2 py-1 rounded-lg border border-ink-600 hover:border-red-500/50 hover:text-red-300" title="Ist-Ausrüstung auf den letzten gespeicherten Stand zurücksetzen">↺</button></div>` : '';
  }
  R.$('gearHistBar').addEventListener('click', async (ev) => {
    const b = ev.target.closest('[data-hb]'); if (!b) return;
    const set = activeSet(), ch = histPending(set); if (!ch.length) return;
    if (b.dataset.hb === 'save') {
      chist.unshift({ id: R.newId(), ts: Date.now(), kind: 'auto', src: 'edit', setId: set.id, setName: set.name, slot: '', changes: ch, note: '', imgs: [] });
      set.histBase = JSON.parse(JSON.stringify(set.ist)); saveHist(); saveGear(); cloudSave(); renderGearMain();
      gearMsg(`✓ ${ch.length} ${ch.length === 1 ? 'Änderung' : 'Änderungen'} in der History gespeichert`);
    } else if (b.dataset.hb === 'undo') {
      if (!(await UI.confirm(`Ist-Ausrüstung auf den letzten gespeicherten Stand zurücksetzen?\n\n${ch.length} ${ch.length === 1 ? 'Änderung geht' : 'Änderungen gehen'} verloren.`))) return;
      set.ist = JSON.parse(JSON.stringify(set.histBase)); gearFlags = {}; saveGear(); renderGearMain();
    }
  });

  // ---- Darstellung: kleine Item-Symbole und Änderungstexte ----
  const hSlot = (k) => GEAR_SLOTS.find(s => s.k === k);
  const hIcon = (v) => { const it = gItem(v?.item), f = GFILL[it?.rarity || v?.rarity] || GFILL.legendary;
    return `<span class="relative shrink-0 w-11 h-11 rounded-lg grid place-items-center border border-ink-700" style="background:${it || v?.item ? `radial-gradient(circle at 50% 40%, ${f[1]}55, ${f[2]}44)` : '#111725'}" title="${R.esc(it?.name || v?.name || 'leer')}">
      ${it?.icon ? `<img src="${it.icon}" alt="" loading="lazy" class="w-9 h-9 object-contain">` : `<span class="text-base opacity-50">${v?.item ? '❔' : '∅'}</span>`}
      ${v?.item && v.tier ? `<span class="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1 rounded bg-ink-950/90 border border-gold-400/70 text-[9px] font-extrabold text-gold-300 leading-3">${ROMAN[v.tier - 1]}</span>` : ''}
      ${v?.item && v.refine ? `<img src="${REFTYPES[v.refType]?.img || REFTYPES.infantry.img}" alt="" class="absolute -top-1 -right-1 w-4 h-4">` : ''}</span>`; };
  const hName = (v) => R.esc(gItem(v?.item)?.name || v?.name || 'Item');
  function hChanges(a, b) {                                   // was hat sich geändert? → [[Text, Farbe], …]
    const out = [];
    if (!b?.item && a?.item) return [[`✕ ${hName(a)} entfernt`, 'text-slate-400']];
    if (b?.item && !a?.item) out.push([`⚒ ${hName(b)} neu`, 'text-gold-300']);
    else if (a?.item !== b?.item) out.push([`⚒ ${hName(a)} → ${hName(b)}`, 'text-gold-300']);
    if (b?.item) {
      const tf = a?.item === b.item ? a.tier : 0;
      if (b.tier > tf) out.push([`⬆ Tier T${tf} → T${b.tier}`, 'text-sky-300']);
      else if (b.tier < tf) out.push([`⬇ Tier T${tf} → T${b.tier}`, 'text-slate-400']);
      const rf = a?.item === b.item ? a.refine : 0;
      if (b.refine && (!rf || a.refType !== b.refType)) out.push([`✦ Refine ${REFTYPES[b.refType]?.label || ''}`, 'text-red-300']);
      else if (!b.refine && rf) out.push(['Refine entfernt', 'text-slate-400']);
    }
    return out.length ? out : [['Geändert', 'text-slate-300']];
  }
  const hChangeRow = (c) => { const sl = hSlot(c.slot);
    return `<div class="flex items-center gap-2 py-1">
      <span class="w-20 shrink-0 text-[11px] text-slate-400 leading-tight">${sl.icon} ${sl.label}</span>
      ${hIcon(c.from)}<span class="text-slate-500">→</span>${hIcon(c.to)}
      <div class="min-w-0 space-y-0.5">${hChanges(c.from, c.to).map(([t, cl]) => `<div class="text-sm font-semibold ${cl} truncate">${t}</div>`).join('')}</div></div>`; };
  const hDay = (ts) => new Date(ts).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
  const hTime = (ts) => new Date(ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const hChip = (on) => `px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${on ? 'border-gold-400 bg-gold-500/15 text-gold-200' : 'border-ink-700 text-slate-400 hover:text-gold-300'}`;

  // ---- Fenster umschalten: Planer | Craft-Verlauf, und darin Seite History | Gespeicherte Sets ----
  let chPage = 'hist';
  function renderCraftPanes() {
    R.$('craftPlanPane').classList.toggle('hidden', craftPane !== 'plan');
    R.$('craftHistPane').classList.toggle('hidden', craftPane !== 'hist');
    R.$('craftGoalPane').classList.toggle('hidden', craftPane !== 'goal');
    document.querySelectorAll('[data-cpane]').forEach(b => { const on = b.dataset.cpane === craftPane;
      b.className = `px-4 py-2 rounded-lg text-sm font-semibold transition ${on ? 'bg-gold-500 text-ink-950' : 'text-slate-300 hover:text-gold-300'}`; });
    R.$('chPageHist').classList.toggle('hidden', chPage !== 'hist');
    R.$('chPageSnaps').classList.toggle('hidden', chPage !== 'snaps');
    document.querySelectorAll('[data-chpage]').forEach(b => { const on = b.dataset.chpage === chPage;
      b.className = `px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${on ? 'border-gold-400 bg-gold-500/15 text-gold-200' : 'border-transparent text-slate-400 hover:text-gold-300'}`; });
    if (craftPane === 'hist') { renderCraftHist(); renderHistEditor(); renderSnaps(); }
    if (R.view === 'craft' && craftPane === 'goal') renderGoals();
    if (R.view === 'craft' && craftPane === 'plan') renderGearMain();
  }
  document.querySelectorAll('[data-cpane]').forEach(b => b.onclick = () => { craftPane = b.dataset.cpane; renderCraftPanes(); });
  document.querySelectorAll('[data-chpage]').forEach(b => b.onclick = () => { chPage = b.dataset.chpage; renderCraftPanes(); });

  // ---- Seite 1: Liste ----
  const hf = { set: 'all', kind: 'all', limit: 25 };
  const HKIND = { hist: ['⚒ History', 'border-gold-500/30 bg-gold-500/5'], auto: ['✎ Dashboard', 'border-ink-700 bg-ink-950/40'], manual: ['📷 Screenshot', 'border-sky-500/25 bg-sky-500/5'] };
  function renderCraftHist() {
    const box = R.$('craftHistList'); if (!box) return;
    R.$('craftHistSet').innerHTML = `<option value="all">Alle Sets</option>` + gear.sets.map(s => `<option value="${R.esc(s.id)}"${hf.set === s.id ? ' selected' : ''}>${R.esc(s.name)}</option>`).join('');
    if (hf.set !== 'all' && !gear.sets.some(s => s.id === hf.set)) hf.set = 'all';
    R.$('craftHistSet').value = hf.set;
    R.$('craftHistKind').querySelectorAll('[data-hk]').forEach(b => { b.className = hChip(b.dataset.hk === hf.kind); });
    const list = chist.filter(e => (hf.set === 'all' || e.setId === hf.set) && (hf.kind === 'all' || e.kind === hf.kind));
    R.$('craftHistCount').textContent = `${list.length} ${list.length === 1 ? 'Eintrag' : 'Einträge'}`;
    if (!list.length) { box.innerHTML = `<div class="py-8 text-center text-sm text-slate-500">Noch nichts in der History.<br><span class="text-xs">Mit „+ Neue History“ ein Set wählen, Item antippen, Tier/Refine einstellen und hinzufügen.</span></div>`; return; }
    let day = '', html = '';
    list.slice(0, hf.limit).forEach(e => {
      const d = hDay(e.ts); if (d !== day) { day = d; html += `<div class="pt-3 pb-1 text-[11px] uppercase tracking-widest text-slate-500">${d}</div>`; }
      const k = HKIND[e.kind], sl = hSlot(e.slot);
      html += `<div class="rounded-xl border ${k[1]} p-3">
        <div class="flex items-start justify-between gap-2">
          <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-400">
            <span class="tabular-nums text-slate-200 font-semibold">${hTime(e.ts)}</span>
            ${e.setName ? `<span class="px-1.5 rounded border border-ink-600 text-slate-300" translate="no">${R.esc(e.setName)}</span>` : ''}
            ${e.kind === 'manual' && sl ? `<span>${sl.icon} ${sl.label}</span>` : ''}
            <span class="${e.kind === 'hist' ? 'text-gold-300' : e.kind === 'manual' ? 'text-sky-300' : 'text-slate-500'}">${e.kind === 'auto' && e.src === 'scan' ? '🤖 per Scan' : k[0]}</span></div>
          <div class="flex gap-1 shrink-0">
            <button type="button" data-hnote="${R.esc(e.id)}" class="text-slate-500 hover:text-gold-300 px-1 text-xs" title="Notiz bearbeiten">✎</button>
            <button type="button" data-hdel="${R.esc(e.id)}" class="text-slate-500 hover:text-red-400 px-1 text-xs" title="Eintrag löschen">✕</button></div></div>
        ${e.changes.length ? `<div class="mt-1 divide-y divide-ink-800">${e.changes.map(hChangeRow).join('')}</div>` : ''}
        ${e.note ? `<div class="mt-2 text-sm text-slate-200 whitespace-pre-line break-words">${R.esc(e.note)}</div>` : ''}
        ${e.imgs.length ? `<div class="mt-2 flex flex-wrap gap-2">${e.imgs.map((u, i) => `<button type="button" data-himg="${R.esc(e.id)}:${i}" class="w-20 h-20 rounded-lg overflow-hidden border border-ink-700 hover:border-gold-500/60"><img src="${R.esc(u)}" alt="Screenshot" loading="lazy" class="w-full h-full object-cover"></button>`).join('')}</div>` : ''}
      </div>`;
    });
    if (list.length > hf.limit) html += `<button type="button" data-hmore class="w-full mt-2 py-2 rounded-lg border border-ink-700 text-xs text-slate-400 hover:text-gold-300 hover:border-gold-500/60">Ältere anzeigen (${list.length - hf.limit} weitere)</button>`;
    box.innerHTML = html;
  }
  R.$('craftHistSet').onchange = () => { hf.set = R.$('craftHistSet').value; hf.limit = 25; renderCraftHist(); };
  R.$('craftHistKind').addEventListener('click', (ev) => { const b = ev.target.closest('[data-hk]'); if (!b) return; hf.kind = b.dataset.hk; hf.limit = 25; renderCraftHist(); });
  const hLightbox = (src) => { const ov = document.createElement('div'); ov.className = 'fixed inset-0 z-[100] bg-black/85 grid place-items-center p-4 cursor-zoom-out';
    ov.innerHTML = `<img src="${R.esc(src)}" alt="" class="max-w-full max-h-full rounded-lg shadow-2xl">`; ov.onclick = () => ov.remove(); document.body.appendChild(ov); };
  R.$('craftHistList').addEventListener('click', async (ev) => {
    const t = ev.target;
    if (t.closest('[data-hmore]')) { hf.limit += 25; renderCraftHist(); return; }
    const im = t.closest('[data-himg]');
    if (im) { const [eid, i] = im.dataset.himg.split(':'), e = chist.find(x => x.id === eid); if (e) hLightbox(e.imgs[+i]); return; }
    const nb = t.closest('[data-hnote]');
    if (nb) { const e = chist.find(x => x.id === nb.dataset.hnote); if (!e) return;
      const v = await UI.prompt('Notiz zu diesem Eintrag:', e.note); if (v == null) return;
      e.note = v.trim().slice(0, 500); saveHist(); renderCraftHist(); return; }
    const db = t.closest('[data-hdel]');
    if (db) { const e = chist.find(x => x.id === db.dataset.hdel); if (!e) return;
      if (!(await UI.confirm('Diesen Eintrag aus der History löschen?'))) return;
      chist = chist.filter(x => x !== e); saveHist(); renderCraftHist();
      const base = RokAuth.imgBase?.(), paths = e.imgs.filter(u => base && u.startsWith(base)).map(u => u.slice(base.length).split('?')[0]);
      if (paths.length) try { await RokAuth.db().storage.from('showcase').remove(paths); } catch {}
    }
  });

  // ---- Seite 1: Neue History (Set wählen → Item antippen → Tier/Refine → hinzufügen) ----
  const hd = { open: false, setId: '', slots: null };
  const hdSet = () => gear.sets.find(s => s.id === hd.setId) || null;
  const hdLoad = (id) => { const s = gear.sets.find(x => x.id === id) || activeSet(); hd.setId = s.id; hd.slots = JSON.parse(JSON.stringify(s.ist)); gearSel.hist = gearSel.hist || 'helm'; };
  const hdChanges = () => { const s = hdSet(); return s && hd.slots ? GEAR_SLOTS.map(sl => ({ slot: sl.k, from: gSnap(s.ist[sl.k]), to: gSnap(hd.slots[sl.k]) })).filter(c => !gSame(c.from, c.to)) : []; };
  const hMsg = (t, ok = true) => R.flash(R.$('craftHistMsg'), R.esc(t), ok);
  function renderHistEditor() {
    R.$('chNew').classList.toggle('hidden', !hd.open);
    R.$('chNewBtn').classList.toggle('hidden', hd.open);
    if (!hd.open) return;
    if (!hdSet()) hdLoad(gear.active);
    R.$('chSet').innerHTML = gear.sets.map(s => `<option value="${R.esc(s.id)}"${s.id === hd.setId ? ' selected' : ''}>${R.esc(s.name)}</option>`).join('');
    const ch = hdChanges(), changed = new Set(ch.map(c => c.slot)), hset = { hist: hd.slots };
    R.$('chBoard').innerHTML = gearBoard('hist', hset, { rows: [] }, { badge: (sl) => changed.has(sl.k) ? ['✎', '#fde68a'] : null });
    R.$('chEdit').innerHTML = gearEditor('hist', hset, { rows: GEAR_SLOTS.map(sl => ({ sl, status: 'none' })) });
    R.$('chDiff').innerHTML = ch.length ? `<div class="text-[11px] uppercase tracking-widest text-slate-500 mb-1">Wird eingetragen (${ch.length})</div><div class="divide-y divide-ink-800">${ch.map(hChangeRow).join('')}</div>`
      : '<div class="text-xs text-slate-500">Noch keine Änderung – tippe ein Item an und stell Tier oder Refine ein.</div>';
    R.$('chAdd').disabled = !ch.length;
  }
  R.$('chNewBtn').onclick = () => { hd.open = true; hdLoad(gear.active); renderHistEditor(); };
  R.$('chCancel').onclick = () => { hd.open = false; renderHistEditor(); };
  R.$('chReset').onclick = () => { hdLoad(hd.setId); renderHistEditor(); };
  R.$('chSet').onchange = async () => {
    if (hdChanges().length && !(await UI.confirm('Set wechseln? Die noch nicht hinzugefügten Änderungen gehen verloren.'))) { R.$('chSet').value = hd.setId; return; }
    hdLoad(R.$('chSet').value); renderHistEditor();
  };
  R.$('chBoard').addEventListener('click', (ev) => { const t = ev.target.closest('[data-tile]'); if (!t) return; gearSel.hist = t.dataset.tile; renderHistEditor(); });
  const hdEdit = (ev) => {
    const t = ev.target.closest('[data-slot]'); if (!t || t.disabled) return;
    const isBtn = t.tagName === 'BUTTON';
    if ((ev.type === 'click' && !isBtn) || (ev.type === 'change' && isBtn)) return;
    if (gearPickEvent(t)) { renderHistEditor(); return; }
    const v = hd.slots[t.dataset.slot]; if (!v) return;
    if (t.dataset.f === 'clear') { v.item = ''; v.tier = 0; v.refine = 0; }
    else if (t.dataset.f === 'refset') { if (t.dataset.v) { v.refType = gRefType(t.dataset.v); if (!v.refine) v.refine = 100; } else v.refine = 0; }
    else if (t.dataset.f === 'refine') v.refine = gRefine(t.dataset.v);
    else if (t.dataset.f === 'item') { v.item = t.dataset.v ?? t.value; const it = gItem(v.item); if (it) v.rarity = it.rarity; v.tier = 0; v.refine = 0; v.refType = v.refType || 'infantry'; }
    else if (t.dataset.f === 'tier') v.tier = gTier(t.value);
    renderHistEditor();
  };
  R.$('chEdit').addEventListener('change', hdEdit); R.$('chEdit').addEventListener('click', hdEdit);
  R.$('chAdd').onclick = () => {
    const s = hdSet(), ch = hdChanges(); if (!s || !ch.length) return;
    chist.unshift({ id: R.newId(), ts: Date.now(), kind: 'hist', src: 'edit', setId: s.id, setName: s.name, slot: '', changes: ch, note: R.$('chNote').value.trim().slice(0, 500), imgs: [] });
    saveHist();
    if (R.$('chApply').checked) { GEAR_SLOTS.forEach(sl => { s.ist[sl.k] = { ...hd.slots[sl.k] }; }); s.histBase = JSON.parse(JSON.stringify(s.ist)); s.updated = Date.now(); R.LS.set(GEAR_SETS, JSON.stringify(gear)); }
    cloudSave();
    R.$('chNote').value = ''; hd.open = false; hf.kind = hf.kind === 'auto' || hf.kind === 'manual' ? 'all' : hf.kind;
    renderGearMain(); renderHistEditor();
    hMsg(`✓ ${ch.length} ${ch.length === 1 ? 'Änderung' : 'Änderungen'} am ${hDay(Date.now())} um ${hTime(Date.now())} zur History hinzugefügt`);
  };

  // ---- Seite 1: Screenshot-Eintrag ----
  const hDraft = { slot: '', files: [] };
  const hLocalNow = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
  function hShrink(file, max) {                             // Bild verkleinern → JPEG-Blob
    return new Promise((ok, bad) => { const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        c.toBlob(b => b ? ok(b) : bad(new Error('Bild konnte nicht umgewandelt werden.')), 'image/jpeg', 0.85); };
      img.onerror = () => { URL.revokeObjectURL(url); bad(new Error('Bild konnte nicht gelesen werden.')); }; img.src = url; });
  }
  function renderHDraft() {
    R.$('craftHistPrev').innerHTML = hDraft.files.map((f, i) => `<span class="relative w-16 h-16 rounded-lg overflow-hidden border border-ink-700"><img src="${f.url}" alt="" class="w-full h-full object-cover">
      <button type="button" data-hrm="${i}" class="absolute top-0 right-0 w-5 h-5 grid place-items-center rounded-bl bg-ink-950/90 text-[11px] text-slate-300 hover:text-red-400">✕</button></span>`).join('');
  }
  const hAddFiles = (fl) => { [...(fl || [])].filter(f => f && f.type.startsWith('image/')).forEach(f => { if (hDraft.files.length < 6) hDraft.files.push({ file: f, url: URL.createObjectURL(f) }); }); renderHDraft(); };
  R.$('craftHistFile').addEventListener('change', (ev) => { hAddFiles(ev.target.files); ev.target.value = ''; });
  const hDrop = R.$('craftHistForm');
  ['dragenter', 'dragover'].forEach(e => hDrop.addEventListener(e, ev => { ev.preventDefault(); hDrop.classList.add('drop-active'); }));
  ['dragleave', 'drop'].forEach(e => hDrop.addEventListener(e, ev => { ev.preventDefault(); if (e === 'drop' || !hDrop.contains(ev.relatedTarget)) hDrop.classList.remove('drop-active'); }));
  hDrop.addEventListener('drop', ev => hAddFiles(ev.dataTransfer.files));
  R.$('craftHistPrev').addEventListener('click', (ev) => { const b = ev.target.closest('[data-hrm]'); if (!b) return; const [f] = hDraft.files.splice(+b.dataset.hrm, 1); if (f) URL.revokeObjectURL(f.url); renderHDraft(); });
  R.$('craftHistSlot').onchange = () => { hDraft.slot = R.$('craftHistSlot').value; };
  R.$('craftHistOpen').onclick = () => { const f = R.$('craftHistForm'); f.classList.toggle('hidden');
    if (!f.classList.contains('hidden')) { R.$('craftHistSlot').innerHTML = `<option value="">– kein bestimmter Slot –</option>` + GEAR_SLOTS.map(s => `<option value="${s.k}">${s.icon} ${s.label}</option>`).join(''); R.$('craftHistSlot').value = hDraft.slot;
      R.$('craftHistDate').value = R.$('craftHistDate').dataset.def = hLocalNow(); R.$('craftHistNote').focus(); } };
  R.$('craftHistCancel').onclick = () => { R.$('craftHistForm').classList.add('hidden'); };
  R.$('craftHistForm').onsubmit = async (ev) => {
    ev.preventDefault();
    const note = R.$('craftHistNote').value.trim().slice(0, 500), btn = R.$('craftHistSave');
    if (!note && !hDraft.files.length) { hMsg('Bitte einen Screenshot hinzufügen oder eine Notiz schreiben.', false); return; }
    const dv = R.$('craftHistDate').value, ts = dv === R.$('craftHistDate').dataset.def ? Date.now() : Date.parse(dv) || Date.now(), set = activeSet(), id = R.newId(), imgs = [];
    btn.disabled = true; btn.textContent = hDraft.files.length ? 'Lädt hoch …' : 'Speichert …';
    try {
      for (let i = 0; i < hDraft.files.length; i++) {
        const blob = await hShrink(hDraft.files[i].file, 1600);
        try { imgs.push(await RokAuth.uploadImage(blob, `crafthist_${id}_${i}`)); }
        catch (e) { throw new Error(/eingeloggt/i.test(e.message || '') ? 'Zum Hochladen von Screenshots bitte einloggen.' : 'Upload fehlgeschlagen: ' + (RokAuth.germanError ? RokAuth.germanError(e) : e.message || e)); }
      }
      chist.push({ id, ts, kind: 'manual', src: 'edit', setId: set.id, setName: set.name, slot: hDraft.slot, changes: [], note, imgs });
      saveHist(); cloudSave();
      hDraft.files.forEach(f => URL.revokeObjectURL(f.url)); hDraft.files = []; hDraft.slot = ''; R.$('craftHistNote').value = '';
      R.$('craftHistForm').classList.add('hidden'); renderHDraft(); renderCraftHist(); hMsg('✓ Screenshot-Eintrag gespeichert');
    } catch (e) { hMsg(e.message || String(e), false); }
    finally { btn.disabled = false; btn.textContent = '💾 Eintrag speichern'; }
  };

  // ---- Seite 2: Gespeicherte Sets (Sicherungen mit Datum) ----
  const snNorm = (x) => x && x.id && Array.isArray(x.sets) ? { id: String(x.id), ts: +x.ts || Date.now(), name: String(x.name || '').slice(0, 50), sets: x.sets.map(gNormSet) } : null;
  let snaps = [];
  try { const s = JSON.parse(R.LS.get(GEAR_SNAPS, '[]')); if (Array.isArray(s)) snaps = s.map(snNorm).filter(Boolean); } catch {}
  const saveSnaps = () => { snaps.sort((a, b) => b.ts - a.ts); if (snaps.length > SNAP_MAX) snaps.length = SNAP_MAX; R.LS.set(GEAR_SNAPS, JSON.stringify(snaps)); };
  const snTake = (name) => ({ id: R.newId(), ts: Date.now(), name, sets: gear.sets.map(s => gNormSet(JSON.parse(JSON.stringify(s)))) });
  const snUi = { open: '', set: {} };
  // Fortschritt eines Sets zwischen damals (a) und heute (b)
  function snProgress(a, b) {
    const p = { tiers: 0, items: 0, refines: 0, changes: [] };
    if (!a || !b) return p;
    GEAR_SLOTS.forEach(sl => {
      const x = gSnap(a.ist[sl.k]), y = gSnap(b.ist[sl.k]); if (gSame(x, y)) return;
      p.changes.push({ slot: sl.k, from: x, to: y });
      if (!y.item) return;
      const same = x.item === y.item;
      if (!same) p.items++;
      p.tiers += Math.max(0, y.tier - (same ? x.tier : 0));
      if (y.refine && !(same && x.refine && x.refType === y.refType)) p.refines++;
    });
    return p;
  }
  const snSum = (p) => [p.tiers ? `+${p.tiers} Tier-${p.tiers === 1 ? 'Stufe' : 'Stufen'}` : '', p.items ? `${p.items} ${p.items === 1 ? 'neues Item' : 'neue Items'}` : '', p.refines ? `${p.refines} Refine` : ''].filter(Boolean).join(' · ');
  const snBoard = (slots, changed) => `<div class="relative mx-auto w-full max-w-[220px] aspect-[1/2] pointer-events-none">${gearBoard('snap', { snap: slots }, { rows: [] }, { sel: null, badge: (sl) => changed?.has(sl.k) ? ['⬆', '#7dd3fc'] : null })}</div>`;
  function renderSnaps() {
    const box = R.$('chSnapList'); if (!box) return;
    if (!snaps.length) { box.innerHTML = `<div class="panel rounded-2xl p-8 text-center text-sm text-slate-500">Noch keine Sicherung.<br><span class="text-xs">„💾 Alle Sets sichern“ speichert alle deine Sets mit Datum – später kannst du sie wieder laden und deinen Fortschritt sehen.</span></div>`; return; }
    box.innerHTML = snaps.map(sn => {
      const total = { tiers: 0, items: 0, refines: 0 };
      sn.sets.forEach(s => { const p = snProgress(s, gear.sets.find(x => x.id === s.id)); total.tiers += p.tiers; total.items += p.items; total.refines += p.refines; });
      const sum = snSum(total), open = snUi.open === sn.id;
      let detail = '';
      if (open) {
        const selId = sn.sets.some(s => s.id === snUi.set[sn.id]) ? snUi.set[sn.id] : sn.sets[0]?.id, then = sn.sets.find(s => s.id === selId), now = gear.sets.find(s => s.id === selId);
        const p = snProgress(then, now), changed = new Set(p.changes.map(c => c.slot));
        detail = `<div class="mt-4 border-t border-ink-700 pt-4">
          <div class="flex flex-wrap gap-1.5">${sn.sets.map(s => `<button type="button" data-snset="${R.esc(sn.id)}:${R.esc(s.id)}" class="${hChip(s.id === selId)}" translate="no">${R.esc(s.name)}</button>`).join('')}</div>
          ${then ? `<div class="mt-4 grid grid-cols-2 gap-3">
            <div><div class="text-center text-[11px] uppercase tracking-widest text-slate-400 mb-2">Damals · ${R.dateLabel(sn.ts)}</div>${snBoard(then.ist)}</div>
            <div><div class="text-center text-[11px] uppercase tracking-widest text-slate-400 mb-2">Heute</div>${now ? snBoard(now.ist, changed) : '<div class="h-full grid place-items-center text-xs text-slate-500 text-center px-2">Dieses Set gibt es im Planer nicht mehr.</div>'}</div>
          </div>
          ${now ? `<div class="mt-3">${p.changes.length ? `<div class="text-sm font-semibold text-emerald-300 mb-1">Fortschritt seitdem: ${snSum(p) || 'geändert'}</div><div class="divide-y divide-ink-800">${p.changes.map(hChangeRow).join('')}</div>` : '<div class="text-sm text-slate-400">Seitdem keine Änderung an diesem Set.</div>'}</div>` : ''}
          <div class="mt-3 flex flex-wrap gap-2">
            <button type="button" data-sncopy="${R.esc(sn.id)}:${R.esc(then.id)}" class="text-xs px-3 py-2 rounded-lg border border-gold-500/50 text-gold-300 hover:border-gold-400">⤓ Dieses Set als Kopie in den Planer laden</button>
          </div>` : ''}
        </div>`;
      }
      return `<section class="panel rounded-2xl p-4 ${open ? 'ring-1 ring-gold-500/30' : ''}">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <button type="button" data-snopen="${R.esc(sn.id)}" class="min-w-0 flex-1 text-left">
            <div class="flex flex-wrap items-baseline gap-x-2"><span class="font-display text-lg gold-text">${R.esc(sn.name || 'Sicherung')}</span><span class="text-xs text-slate-400 tabular-nums">${hDay(sn.ts)} · ${hTime(sn.ts)}</span></div>
            <div class="text-xs text-slate-400 mt-0.5">${sn.sets.length} ${sn.sets.length === 1 ? 'Set' : 'Sets'} · ${sum ? `<span class="text-emerald-300 font-semibold">seitdem ${sum}</span>` : 'seitdem kein Fortschritt'} <span class="text-gold-300 ml-1">${open ? '▲ zuklappen' : '▼ ansehen'}</span></div>
          </button>
          <div class="flex gap-2">
            <button type="button" data-snrestore="${R.esc(sn.id)}" class="text-xs px-3 py-2 rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300" title="Alle Sets aus dieser Sicherung wieder in den Planer laden">↺ Wiederherstellen</button>
            <button type="button" data-sndel="${R.esc(sn.id)}" class="text-xs px-2 py-2 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10" title="Sicherung löschen">🗑</button>
          </div>
        </div>${detail}</section>`;
    }).join('');
  }
  const snMsg = (t, ok = true) => R.flash(R.$('chSnapMsg'), R.esc(t), ok);
  R.$('chSnapForm').onsubmit = (ev) => {
    ev.preventDefault();
    const sn = snTake(R.$('chSnapName').value.trim().replace(/\s+/g, ' ').slice(0, 50));
    snaps.unshift(sn); saveSnaps(); cloudSave();
    R.$('chSnapName').value = ''; snUi.open = sn.id; renderSnaps();
    snMsg(`✓ ${sn.sets.length} ${sn.sets.length === 1 ? 'Set' : 'Sets'} gesichert am ${hDay(sn.ts)} um ${hTime(sn.ts)}`);
  };
  R.$('chSnapList').addEventListener('click', async (ev) => {
    const t = ev.target, b = (a) => t.closest(`[data-${a}]`);
    if (b('snopen')) { const id = b('snopen').dataset.snopen; snUi.open = snUi.open === id ? '' : id; renderSnaps(); return; }
    if (b('snset')) { const [sid, setId] = b('snset').dataset.snset.split(':'); snUi.set[sid] = setId; renderSnaps(); return; }
    if (b('sncopy')) {
      const [sid, setId] = b('sncopy').dataset.sncopy.split(':'), sn = snaps.find(x => x.id === sid), s = sn?.sets.find(x => x.id === setId); if (!s) return;
      let name = `${s.name} (${new Date(sn.ts).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })})`.slice(0, 40), n = 2;
      while (gear.sets.some(x => x.name.toLowerCase() === name.toLowerCase())) name = `${s.name.slice(0, 32)} (${n++})`;
      const c = gNormSet({ ...JSON.parse(JSON.stringify(s)), id: R.newId(), name }); gear.sets.push(c); gear.active = c.id;
      R.LS.set(GEAR_SETS, JSON.stringify(gear)); cloudSave(); renderGearMain();
      snMsg(`✓ Set „${name}“ in den Planer geladen`); return;
    }
    if (b('snrestore')) {
      const sn = snaps.find(x => x.id === b('snrestore').dataset.snrestore); if (!sn) return;
      if (!(await UI.confirm(`Alle Sets aus der Sicherung vom ${hDay(sn.ts)} wiederherstellen?\n\nDeine jetzigen Sets werden vorher automatisch gesichert.`))) return;
      snaps.unshift(snTake('Automatisch vor Wiederherstellen'));
      gear.sets = sn.sets.map(s => gNormSet(JSON.parse(JSON.stringify(s)))); gear.active = gear.sets[0]?.id; if (!gear.sets.length) { gear.sets.push(newGearSet('Neues Set')); gear.active = gear.sets[0].id; }
      gearFlags = {}; R.LS.set(GEAR_SETS, JSON.stringify(gear)); saveSnaps(); cloudSave(); renderGearMain(); renderSnaps();
      snMsg(`✓ Sets vom ${hDay(sn.ts)} wiederhergestellt`); return;
    }
    if (b('sndel')) {
      const sn = snaps.find(x => x.id === b('sndel').dataset.sndel); if (!sn) return;
      if (!(await UI.confirm(`Sicherung vom ${hDay(sn.ts)} löschen?`))) return;
      snaps = snaps.filter(x => x !== sn); saveSnaps(); renderSnaps();
    }
  });
  renderCraftPanes();

};
