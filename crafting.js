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

  // ---- Ausrüstungsdaten (Codex Helper): Werte, Craft-, Refine- und Awaken-Kosten aller Items ----
  // Datei /rok-equipment.json im Repo. Mengen gelten in der Qualität des Items (legendäres Item = legendäre Materialien).
  // Zuordnung zum Katalog über den Bildnamen (icons/gear/<id>.webp) oder den Namen.
  const EQ_URL = '/rok-equipment.json';
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
      EQ.state = 'ok';
    } catch (e) { console.warn('rok-equipment.json nicht geladen', e); EQ.state = 'error'; }
    rebuildGearCat(); renderGear();
  }
  const eqFind = (it) => EQ.map.get(eqKey(R.gearIconStem(it.icon))) || EQ.map.get(eqKey(it.name)) || null;
  // Katalog-Item mit Codex-Daten anreichern (Kosten, Seltenheit, Set)
  function eqApply(it, e) {
    it.eq = e; it.qm = EQ_QM[e.quality] || 256; it.rarity = EQ_RAR[e.quality] || it.rarity; it.cat = EQ_SLOT[e.slot] || it.cat;
    const c = e.costs?.craft || {};
    it.leather = gNum(c.leather); it.iron = gNum(c.iron); it.ebony = gNum(c.ebony); it.bone = gNum(c.bone);
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
    // Codex-Daten zuordnen; Items ohne Bild trotzdem wählbar machen
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
  const gRefine = (v) => (v === true || /^\s*(true|voll|full)\s*$/i.test(String(v)) || (parseFloat(v) || 0) >= 100) ? 100 : 0; R.gRefine = gRefine;   // nur fertig (100) oder keins (0) – nichts Halbes
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
    o.dismantle = !!s?.dismantle; o.useChests = !!s?.useChests; o.goal = gNormGoal(s?.goal); o.updated = +s?.updated || Date.now();
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
    ['gold', 'crystal'].forEach(k => { if (o && o[k] != null && o[k] !== '') gearOpt[k] = gNum(o[k]); }); } catch {}
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
    if (it.eq) {
      const s = it.eq.costs?.[stage]; if (!s) return null;
      R.MATS.forEach(m => c[m.k] = (s[m.k] || 0) * it.qm / 256);
      c.gold = s.gold || 0; c.bp = s.blueprint || 0; c.crystal = s.iconic_crystal || 0;
      return c;
    }
    const d = (rarity || it.rarity) === 'epic' ? 4 : 1;     // alte Katalog-Items: legendäre Mengen, episch = ¼
    if (stage === 'craft') { R.MATS.forEach(m => c[m.k] = (it[m.k] || 0) / d); return c; }
    const t = /^awaken_(\d)$/.exec(stage); const tc = t ? it.tiers?.[+t[1]] : null;
    if (tc) { R.MATS.forEach(m => c[m.k] = (tc[m.k] || 0) / d); return c; }
    return null;
  }
  R.stageCost = stageCost;
  // höchste Iconic-Stufe des Items (Codex: welche Awaken-Stufen es gibt; sonst legendär = 5)
  const maxTier = (it) => !it ? 0 : it.eq ? EQ_STAGES.slice(2).filter(s => it.eq.costs?.[s]).length : it.rarity === 'legendary' ? 5 : 0;
  const canRefine = (it) => !!it && (!it.eq || !!it.eq.costs?.refine);
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
      tierFrom: 0, tierTo: 0, tierMissing: [], needRefine: false, refMissing: false, parts: [] }));
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
      const part = (label, c) => { if (c && gAny(c)) { r.parts.push([label, c]); gAdd(cost, c); } };
      if (r.status === 'none') { r.status = 'craft'; part('Craften', stageCost(it, 'craft', r.z.rarity)); }
      r.tierFrom = r.from ? (r.from.tier || 0) : 0; r.tierTo = r.z.tier || 0;
      for (let t = r.tierFrom + 1; t <= r.tierTo; t++) { const c = stageCost(it, 'awaken_' + t, r.z.rarity); if (c) part('Tier ' + ROMAN[t - 1], c); else r.tierMissing.push(t); }
      r.refFrom = r.from && (r.from.refType || 'infantry') === (r.z.refType || 'infantry') ? (r.from.refine || 0) : 0; r.refTo = r.z.refine || 0; r.needRefine = r.refTo > r.refFrom;
      if (r.needRefine) { const c = stageCost(it, 'refine', r.z.rarity); if (c) part('Refine', c); else r.refMissing = true; }
      if (r.status !== 'craft') r.status = r.tierTo > r.tierFrom ? 'tierup' : r.needRefine ? 'refine' : r.status === 'keepswap' ? 'swap' : 'same';
      r.cost = gAny(cost) ? cost : null;
      gAdd(need, r.cost);
    });
    // 4) Zerlegen: altes Teil wird nicht weiterverwendet und sein Slot neu belegt (nur Materialien)
    if (set.dismantle) rows.forEach(r => { if (!r.used && key(r.a) && key(r.z)) {
      const c = stageCost(gItem(r.a.item), 'craft', r.a.rarity); if (!c) return;
      r.back = gZero(); R.MATS.forEach(m => r.back[m.k] = c[m.k] * gearOpt.rate / 100); gAdd(back, r.back); } });
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
      : r.status === 'craft' ? ['⚒ craften: ' + gCostText(r.cost) + (gTierTxt(r) ? ' · inkl. ' + gTierTxt(r) : '') + (r.needRefine ? ' · + ' + gRefStep(r) : ''), 'gold']
      : r.status === 'tierup' ? ['⬆ ' + gTierTxt(r) + (r.cost ? ': ' + gCostText(r.cost) : '') + (r.needRefine ? ' · + ' + gRefStep(r) : ''), 'sky']
      : r.status === 'refine' ? ['⚔ ' + gRefStep(r), 'red'] : GSTATUS[r.status] || null;
    const sel = 'min-w-0 bg-ink-950 border border-ink-600 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-gold-500 disabled:opacity-40';
    const rb = (on) => `flex items-center gap-1 px-2 py-1 rounded-lg border ${on ? 'border-gold-400 bg-gold-500/15 text-gold-200' : 'border-ink-600 bg-ink-950 text-slate-400 hover:text-gold-300'}`;
    const hasRef = it && v.refine >= 100;
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
      ${gearPickerHtml(side, sl, v)}
      ${note ? `<div class="mt-2 inline-block max-w-full text-[11px] px-2 py-0.5 rounded-full border ${GBADGE[note[1]]}">${R.esc(note[0])}</div>` : ''}
    </div>`;
  }

  function renderGearMain() {
    const set = activeSet();
    renderCraftHist();
    R.$('gearSetSel').innerHTML = gear.sets.map(s => `<option value="${R.esc(s.id)}"${s.id === set.id ? ' selected' : ''}>${R.esc(s.name)}</option>`).join('');
    R.$('gearDismantle').checked = set.dismantle; R.$('gearUseChests').checked = set.useChests;
    R.$('gearDisRate').value = gearOpt.rate; R.$('gearDisRate').disabled = !set.dismantle;
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
    const unknown = calc.rows.filter(r => r.tierMissing.length || r.refMissing).map(r => `${r.sl.label}${r.tierMissing.length ? ' ' + r.tierMissing.map(t => 'T' + t).join('/') : ''}${r.refMissing ? ' Refine' : ''}`);
    const xStock = { gold: gearOpt.gold, crystal: gearOpt.crystal, bp: null };
    const xTile = (x) => { const n = calc.need[x.k] || 0, have = xStock[x.k], miss = have == null ? null : Math.max(0, n - have);
      return `<div class="rounded-xl border border-ink-700 bg-ink-950/40 px-3 py-2">
        <div class="text-[11px] text-slate-400">${x.icon} ${x.label}</div>
        <div class="text-lg font-extrabold tabular-nums ${n > 0 ? 'text-white' : 'text-slate-500'}">${x.f(n)}</div>
        ${n > 0 && have != null && have > 0 ? `<div class="text-[11px] ${miss > 0 ? 'text-red-300' : 'text-emerald-300'}">${miss > 0 ? 'fehlt ' + x.f(miss) : '✓ genug (' + x.f(have) + ')'}</div>` : ''}</div>`; };
    const verdict = !gAny(calc.need) ? ['✓ Keine Zusatzkosten – das Ziel-Set entspricht der Ist-Ausrüstung oder ist leer.', 'text-emerald-300']
      : !st.mats ? ['⚠ Bestand unbekannt – bitte zuerst deine Materialien scannen.', 'text-amber-300']
      : missing ? [`🔴 ${missing} von 4 Materialien reichen noch nicht.`, 'text-red-300'] : ['🟢 Alles vorhanden – das Set kann geschmiedet werden.', 'text-emerald-300'];
    const mcard = (l, rows, status, tone) => `<div class="panel rounded-2xl p-4 ${tone === 'red' ? 'ring-1 ring-red-500/50' : tone === 'green' ? 'ring-1 ring-emerald-500/40' : ''}">
        <div class="flex items-center gap-3"><span class="w-10 h-10 shrink-0 rounded-xl grid place-items-center text-xl" style="background:${l.m.c}22;border:1px solid ${l.m.c}55">${l.m.icon}</span>
          <div class="text-xs uppercase tracking-widest text-slate-400">${l.m.label}</div></div>
        <div class="mt-3 space-y-1 text-xs">${rows.map(([k, v, cls]) => `<div class="flex justify-between gap-2"><span class="text-slate-400">${k}</span><span class="tabular-nums font-semibold ${cls || 'text-white'}">${v}</span></div>`).join('')}</div>
        <div class="mt-3 text-sm font-semibold ${{ red: 'text-red-300', green: 'text-emerald-300', amber: 'text-amber-300' }[tone] || 'text-slate-500'}">${status}</div>
      </div>`;
    const cards = lines.map(l => {
      const rows = [['Bedarf (legendär)', gq(l.gross)], ['Rucksack', st.mats ? gq(l.stock) : '?']];
      if (l.back > 1e-4) rows.push(['+ Zerlegen', '+' + gq(l.back), 'text-sky-300']);
      if (l.chest > 1e-4) rows.push(['+ aus Kisten', '+' + gq(l.chest), 'text-amber-300']);
      if (l.gross < 0.005) return mcard(l, rows, '⚪ Nicht benötigt', '');
      if (!st.mats && l.back < l.gross) return mcard(l, rows, '⚠ Bestand unbekannt', 'amber');
      if (l.deficit > 0.005) return mcard(l, rows, `🔴 Es fehlen noch ${gq(l.deficit)} legendäre ${l.m.label}`, 'red');
      rows.push(['Überschuss', gq(l.surplus), 'text-emerald-300']);
      return mcard(l, rows, `🟢 Genug ${l.m.label} vorhanden`, 'green');
    }).join('');
    R.$('gearResult').innerHTML = `
      <div class="panel rounded-2xl p-5 ring-1 ring-gold-500/30">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="text-xs uppercase tracking-widest text-slate-400">Gesamtbedarf</div>
            <div class="font-display text-2xl gold-text" translate="no">${R.esc(set.name)}</div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div><div class="text-2xl font-extrabold text-gold-300 tabular-nums">${gq(totalLeg)}</div><div class="text-[11px] text-slate-400">legendäre Materialien</div></div>
            <div><div class="text-2xl font-extrabold text-white tabular-nums">${crafts.length}</div><div class="text-[11px] text-slate-400">Items zu craften</div></div>
            <div><div class="text-2xl font-extrabold text-sky-300 tabular-nums">${steps.tiers}</div><div class="text-[11px] text-slate-400">Tier-Stufen</div></div>
            <div><div class="text-2xl font-extrabold text-red-300 tabular-nums">${steps.refines}</div><div class="text-[11px] text-slate-400">Refines</div></div>
          </div>
        </div>
        <div class="mt-4 grid grid-cols-3 gap-2">${GX.map(xTile).join('')}</div>
        <div class="mt-3 text-sm font-semibold ${verdict[1]}">${verdict[0]}</div>
        ${unknown.length ? `<div class="mt-2 text-xs text-amber-300">⚠ Kosten nicht bekannt (nicht mitgerechnet): ${R.esc(unknown.join(' · '))}</div>` : ''}
        ${maxLeg > 0.005 ? `<div class="mt-3 rounded-xl border ${zielIsMax ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-gold-500/30 bg-gold-500/5'} px-3 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span class="font-semibold ${zielIsMax ? 'text-emerald-300' : 'text-gold-300'}">${zielIsMax ? '🎯 Dein Ziel ist bereits alles Max' : '🎯 Bis alles Max'}</span>
          <span class="tabular-nums text-slate-200">${gq(maxLeg)} legendäre Mats · ${gCostText(maxCalc.need, false)}</span>
          ${zielIsMax ? '' : `<button type="button" data-gmax class="ml-auto px-2.5 py-1 rounded-lg border border-gold-500/50 text-gold-300 hover:border-gold-400">Als Ziel setzen</button>`}</div>` : ''}
        <div class="mt-2 text-xs text-slate-400">${st.mats ? `📦 Rucksack-Bestand aus Material-Scan vom <b class="text-slate-200">${R.dateLabel(st.ts)}</b>${st.chests > 0 ? ` · Kisten ≈ ${gq(st.chests)} legendär` : ''}`
          : `⚠ Noch kein Material-Scan – Rucksack-Bestand unbekannt. <button data-goscan="mats" class="underline text-gold-300 hover:text-gold-400">Materialien scannen</button>`}</div>
      </div>
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">${cards}</div>`;

    // Slot-Vergleich
    const nm = (v) => { const it = gItem(v.item); return it ? `${R.esc(it.name)} <span class="text-[10px] font-semibold text-gold-300">T${v.tier || 0}</span>${v.refine ? ` <span class="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-300"><img src="${REFTYPES[v.refType].img}" alt="" class="w-3.5 h-3.5">${gRefTxt(v.refine)}</span>` : ''}` : '<span class="text-slate-500">–</span>'; };
    R.$('gearPlan').innerHTML = `<h3 class="font-display text-xl gold-text mb-3">Slot-Vergleich</h3>
      <div class="overflow-x-auto"><table class="w-full text-sm">
        <thead class="text-xs uppercase tracking-wider text-slate-400"><tr class="border-b border-ink-700">
          <th class="py-2 pr-2 text-left font-medium">Slot</th><th class="py-2 px-2 text-left font-medium">Ist</th><th class="py-2 px-2 text-left font-medium">Ziel</th>
          <th class="py-2 px-2 text-left font-medium">Status</th><th class="py-2 px-2 text-right font-medium">Kosten</th><th class="py-2 pl-2 text-right font-medium">Zerlegen</th></tr></thead>
        <tbody>${calc.rows.map(r => { const s = GSTATUS[r.status] || [gItem(r.z.item) ? '' : 'kein Ziel', 'slate'];
          return `<tr class="border-b border-ink-800">
            <td class="py-2 pr-2 whitespace-nowrap text-slate-300">${r.sl.icon} ${r.sl.label}</td>
            <td class="py-2 px-2">${nm(r.a)}</td><td class="py-2 px-2">${nm(r.z)}</td>
            <td class="py-2 px-2 whitespace-nowrap">${s[0] ? `<span class="text-[11px] px-2 py-0.5 rounded-full border ${GBADGE[s[1]]}">${s[0]}</span>` : ''}${gTierTxt(r) ? `<div class="mt-1 text-[10px] text-sky-300">${gTierTxt(r)}</div>` : ''}${gRefStep(r) ? `<div class="mt-1 text-[10px] text-red-300">${gRefStep(r)}</div>` : ''}</td>
            <td class="py-2 px-2 text-right tabular-nums text-xs">${r.cost ? `<div class="whitespace-nowrap font-semibold text-slate-100">${gCostText(r.cost)}</div>
              ${r.parts.length > 1 ? r.parts.map(([l, c]) => `<div class="whitespace-nowrap text-[10px] text-slate-500">${l}: ${gCostText(c)}</div>`).join('') : ''}` : '–'}</td>
            <td class="py-2 pl-2 text-right tabular-nums whitespace-nowrap text-xs text-sky-300">${r.back ? '+ ' + gCostText(r.back) : '–'}</td></tr>`; }).join('')}</tbody>
      </table></div>`;
  }

  function renderGearCatInfo() {
    const n = gearDb.length;
    R.$('gearCatInfo').innerHTML = (R.gearDbState === 'loading' ? 'Lade Katalog aus Supabase …'
      : R.gearDbState === 'error' ? `<span class="text-amber-300">⚠ Katalog aus Supabase nicht geladen (${R.esc(gearDbErr)})${n ? ` – es wird die gespeicherte Kopie mit ${n} Items genutzt.` : '.'}</span>`
      : `☁ ${n} Items aus Supabase (Tabelle <code>gear_items</code>) · ${gearCustom.length} eigene Items`)
      + (EQ.state === 'ok' ? ` · 📘 ${EQ.list.length} Items mit Craft-, Refine- und Tier-Kosten (Daten: codexhelper.com)` : EQ.state === 'error' ? ' · <span class="text-amber-300">⚠ rok-equipment.json nicht geladen</span>' : '');
  }
  function renderGearCat() {
    renderGearCatInfo();
    const inp = 'w-full bg-ink-950 border border-ink-700 rounded px-1.5 py-1 focus:outline-none focus:border-gold-500 disabled:opacity-60 disabled:border-transparent';
    const row = (i) => { const ro = i.db || i.eq ? 'disabled' : '';
      return `<tr class="border-b border-ink-800">
        <td class="py-1 pr-1"><input data-cid="${R.esc(i.id)}" data-f="name" value="${R.esc(i.name)}" ${ro} class="${inp} min-w-[170px]"></td>
        <td class="py-1 px-1"><select data-cid="${R.esc(i.id)}" data-f="cat" ${ro} class="${inp}">${Object.entries(GEAR_CATS).map(([k, l]) => `<option value="${k}"${k === i.cat ? ' selected' : ''}>${l}</option>`).join('')}</select></td>
        <td class="py-1 px-1 whitespace-nowrap ${i.eq ? 'text-sky-300' : i.db ? 'text-emerald-300' : 'text-gold-300'}">${i.eq ? '📘 Codex' : i.db ? '☁ Supabase' : '✎ eigenes'}</td>
        ${['leather', 'iron', 'ebony', 'bone'].map(k => `<td class="py-1 px-1"><input data-cid="${R.esc(i.id)}" data-f="${k}" type="number" min="0" step="1" value="${i[k]}" ${ro} class="${inp} w-16 text-right tabular-nums"></td>`).join('')}
        <td class="py-1 px-1 text-right tabular-nums whitespace-nowrap text-gold-300" title="Craften + Refine + alle Tier-Stufen, in legendären Materialien">${(() => { const t = gZero(); EQ_STAGES.forEach(st => gAdd(t, stageCost(i, st))); return gMatSum(t) > 0 ? gq(gMatSum(t)) + (t.gold ? ' · 🪙 ' + gGold(t.gold) : '') : '–'; })()}</td>
        <td class="text-right">${i.db ? '' : `<button data-cdel="${R.esc(i.id)}" class="text-slate-500 hover:text-red-400 px-1" title="Item löschen">✕</button>`}</td></tr>`; };
    const RO = ['legendary', 'epic', 'elite', 'normal'], list = R.gearCat.filter(i => !i.lib || i.eq)
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
    const t = ev.target.closest('[data-slot]'); if (!t || t.disabled) return;
    const isBtn = t.tagName === 'BUTTON';
    if (ev.type === 'click' && !isBtn) return;     // Klick nur für Buttons (Refine, Bild-Auswahl)
    if (ev.type === 'change' && isBtn) return;
    if (gearPickEvent(t)) { renderGearMain(); return; }
    const v = activeSet()[t.dataset.side][t.dataset.slot], before = t.dataset.side === 'ist' ? gSnap(v) : null;
    if (t.dataset.f === 'clear') { v.item = ''; v.tier = 0; v.refine = 0; }
    else if (t.dataset.f === 'max') Object.assign(v, gMaxSlot(v, activeSet().ist[t.dataset.slot]));
    else if (t.dataset.f === 'refset') { if (t.dataset.v) { v.refType = gRefType(t.dataset.v); v.refine = 100; } else v.refine = 0; }
    else if (t.dataset.f === 'item') { v.item = t.dataset.v ?? t.value; const it = gItem(v.item); if (it) v.rarity = it.rarity; v.tier = 0; v.refine = 0; v.refType = v.refType || 'infantry'; }
    else if (t.dataset.f === 'refine') v.refine = gRefine(t.dataset.v);
    else if (t.dataset.f === 'refType') v.refType = gRefType(t.dataset.v);
    else v.tier = gTier(t.value);
    if (t.dataset.side === 'ist') { delete gearFlags[t.dataset.slot]; logIst(activeSet(), t.dataset.slot, before, 'edit'); }
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
  R.$('gearResult').addEventListener('click', (ev) => { if (ev.target.closest('[data-gmax]')) gearSetMax(); });
  R.$('gearDismantle').onchange = () => { activeSet().dismantle = R.$('gearDismantle').checked; saveGear(); renderGearMain(); };
  R.$('gearUseChests').onchange = () => { activeSet().useChests = R.$('gearUseChests').checked; saveGear(); renderGearMain(); };
  R.$('gearDisRate').onchange = () => { gearOpt.rate = Math.min(100, gNum(R.$('gearDisRate').value)); R.LS.set(GEAR_OPT, JSON.stringify(gearOpt)); renderGearMain(); };
  R.$('gearResult').addEventListener('click', (ev) => { const b = ev.target.closest('[data-goscan]'); if (b) R.goScan(b.dataset.goscan); });

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
    const src = r.slots || r.equipment || r, set = activeSet(), before = Object.fromEntries(GEAR_SLOTS.map(sl => [sl.k, gSnap(set.ist[sl.k])]));
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
    GEAR_SLOTS.forEach(sl => logIst(set, sl.k, before[sl.k], 'scan'));
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
    return { calc, lines, gross, pct: gross > 0.005 ? (st.mats || lines.some(l => l.back > 0) ? covered / gross : null) : 1,
      days: gDays(set.goal.date), unknown: calc.rows.some(r => r.tierMissing.length || r.refMissing) };
  }
  const gBar = (pct) => pct == null ? '<div class="h-2 rounded-full bg-ink-800"></div>'
    : `<div class="h-2 rounded-full bg-ink-800 overflow-hidden"><div class="h-full rounded-full ${pct >= 0.999 ? 'bg-emerald-400' : 'bg-gradient-to-r from-gold-600 to-gold-400'}" style="width:${Math.round(Math.min(1, pct) * 100)}%"></div></div>`;
  const gPct = (pct) => pct == null ? '?' : Math.floor(Math.min(1, pct) * 100) + ' %';
  // Tabelle Bedarf / Bestand / fehlt / pro Tag
  function goalTable(lines, need, days, hasStock) {
    const row = (icon, label, n, have, miss, f) => `<tr class="border-b border-ink-800 last:border-0">
      <td class="py-1 pr-2 whitespace-nowrap text-slate-300">${icon} ${label}</td>
      <td class="py-1 px-2 text-right tabular-nums whitespace-nowrap text-white">${f(n)}</td>
      <td class="py-1 px-2 text-right tabular-nums whitespace-nowrap text-slate-400">${have == null ? '?' : f(have)}</td>
      <td class="py-1 px-2 text-right tabular-nums whitespace-nowrap font-semibold ${miss == null ? 'text-slate-500' : miss > 0.005 ? 'text-red-300' : 'text-emerald-300'}">${miss == null ? '?' : miss > 0.005 ? f(miss) : '✓'}</td>
      ${days != null ? `<td class="py-1 pl-2 text-right tabular-nums whitespace-nowrap text-sky-300">${miss == null || miss <= 0.005 ? '–' : f(miss / Math.max(1, days))}</td>` : ''}</tr>`;
    const mats = lines.filter(l => l.gross > 0.005).map(l => row(l.m.icon, l.m.label, l.gross, hasStock || l.back > 0 ? l.stock + l.back + l.chest : null, hasStock ? l.deficit : null, gq));
    const xs = GX.filter(x => need[x.k] > 0.005).map(x => { const have = x.k === 'bp' ? null : gearOpt[x.k]; return row(x.icon, x.label, need[x.k], have, have == null ? null : Math.max(0, need[x.k] - have), x.f); });
    if (!mats.length && !xs.length) return '<div class="text-xs text-emerald-300">✓ Nichts mehr zu tun – Ziel erreicht.</div>';
    return `<table class="w-full text-xs"><thead class="text-[10px] uppercase tracking-wider text-slate-500"><tr>
      <th class="py-1 pr-2 text-left font-medium"></th><th class="py-1 px-2 text-right font-medium">Bedarf</th><th class="py-1 px-2 text-right font-medium">Hast du</th><th class="py-1 px-2 text-right font-medium">Fehlt</th>
      ${days != null ? '<th class="py-1 pl-2 text-right font-medium">pro Tag</th>' : ''}</tr></thead><tbody>${mats.join('')}${xs.join('')}</tbody></table>
      <div class="mt-1 text-[10px] text-slate-500">Materialien in legendären Einheiten (1 legendär = 4 episch = 16 Elite)${GX.some(x => x.k === 'bp' && need.bp > 0) ? ' · Blaupausen: Bestand wird nicht erfasst' : ''}</div>`;
  }
  const gMini = (slots) => `<div class="flex flex-wrap gap-1">${GEAR_SLOTS.map(sl => hIcon(slots[sl.k])).join('')}</div>`;
  function renderGoals() {
    const box = R.$('goalSets'); if (!box) return;
    const st = gearStock();
    R.$('goalMatStock').innerHTML = st.mats ? `📦 Materialien aus deinem Scan vom <b class="text-slate-200">${R.dateLabel(st.ts)}</b><div class="mt-1 text-slate-200 tabular-nums">${R.MATS.map(m => `${m.icon} ${gq(st.mats[m.k])}`).join(' · ')}</div>`
      : `⚠ Noch kein Material-Scan – Fortschritt kann nicht berechnet werden. <button data-goscan="mats" class="underline text-gold-300 hover:text-gold-400">Materialien scannen</button>`;
    if (document.activeElement !== R.$('goalGold')) R.$('goalGold').value = gearOpt.gold ?? '';
    if (document.activeElement !== R.$('goalCrystal')) R.$('goalCrystal').value = gearOpt.crystal ?? '';
    const res = gear.sets.map(s => ({ s, g: goalCalc(s, st) }));
    // Gesamtziel: alle markierten Sets zusammen, Rucksack zählt nur einmal
    const on = res.filter(x => x.s.goal.on), total = gZero(), back = gZero();
    on.forEach(x => { gAdd(total, x.g.calc.need); gAdd(back, x.g.calc.back); });
    const tLines = gearBalance({ need: total, back }, st, on.some(x => x.s.useChests));
    const tGross = gMatSum(total), tPct = tGross > 0.005 ? (st.mats ? tLines.reduce((a, l) => a + Math.min(l.gross, l.stock + l.back + l.chest), 0) / tGross : null) : 1;
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
      <div class="mt-4 overflow-x-auto">${on.length ? goalTable(tLines, total, tDays, !!st.mats) : '<div class="text-xs text-slate-500">Kein Set ausgewählt.</div>'}</div>
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
        <div class="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 items-center">
          <span class="text-[10px] uppercase tracking-widest text-slate-500">Ist</span>${gMini(s.ist)}
          <span class="text-[10px] uppercase tracking-widest text-slate-500">${s.goal.mode === 'max' ? 'Max' : 'Ziel'}</span>${gMini(target)}
        </div>
        <div class="mt-3 overflow-x-auto">${emptyZiel ? '<div class="text-xs text-amber-300">Noch keine Ziel-Ausrüstung – im Planer festlegen oder oben „Alles Max“ wählen.</div>' : goalTable(g.lines, c.need, g.days, !!st.mats)}</div>
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
    else if (t.id === 'goalGold' || t.id === 'goalCrystal') { const k = t.id === 'goalGold' ? 'gold' : 'crystal'; gearOpt[k] = t.value === '' ? null : gNum(t.value); saveGearOpt(); renderGoals(); }
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
    else if (t.dataset.f === 'refset') { if (t.dataset.v) { v.refType = gRefType(t.dataset.v); v.refine = 100; } else v.refine = 0; }
    else if (t.dataset.f === 'item') { v.item = t.dataset.v ?? t.value; const it = gItem(v.item); if (it) v.rarity = it.rarity; v.tier = 0; v.refine = 0; v.refType = v.refType || 'infantry'; }
    else if (t.dataset.f === 'tier') v.tier = gTier(t.value);
    renderHistEditor();
  };
  R.$('chEdit').addEventListener('change', hdEdit); R.$('chEdit').addEventListener('click', hdEdit);
  R.$('chAdd').onclick = () => {
    const s = hdSet(), ch = hdChanges(); if (!s || !ch.length) return;
    chist.unshift({ id: R.newId(), ts: Date.now(), kind: 'hist', src: 'edit', setId: s.id, setName: s.name, slot: '', changes: ch, note: R.$('chNote').value.trim().slice(0, 500), imgs: [] });
    saveHist();
    if (R.$('chApply').checked) { GEAR_SLOTS.forEach(sl => { s.ist[sl.k] = { ...hd.slots[sl.k] }; }); s.updated = Date.now(); R.LS.set(GEAR_SETS, JSON.stringify(gear)); }
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
