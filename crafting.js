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
  const newGearSet = (name) => ({ id: R.newId(), name, ist: gEmptySlots(), ziel: gEmptySlots(), dismantle: false, useChests: false, updated: Date.now() });
  function gNormSet(s) {
    const o = newGearSet(String(s?.name || 'Set').slice(0, 40));
    if (s?.id) o.id = String(s.id);
    ['ist', 'ziel'].forEach(side => GEAR_SLOTS.forEach(sl => { const v = s?.[side]?.[sl.k] || {}; o[side][sl.k] = { item: String(v.item || ''), rarity: R.gRar(v.rarity), tier: gTier(v.tier), refine: gRefine(v.refine), refType: gRefType(v.refType) }; }));
    o.dismantle = !!s?.dismantle; o.useChests = !!s?.useChests; o.updated = +s?.updated || Date.now();
    return o;
  }
  let gear = { sets: [], active: null };
  try { const g = JSON.parse(R.LS.get(GEAR_SETS, 'null')); if (g && Array.isArray(g.sets)) gear = { sets: g.sets.map(gNormSet), active: g.active }; } catch {}
  if (!gear.sets.length) gear.sets.push(newGearSet('Infanterie Marsch 1'));
  if (!gear.sets.some(s => s.id === gear.active)) gear.active = gear.sets[0].id;
  const activeSet = () => gear.sets.find(s => s.id === gear.active) || gear.sets[0]; R.activeSet = activeSet;
  const saveGear = () => { activeSet().updated = Date.now(); R.LS.set(GEAR_SETS, JSON.stringify(gear)); };
  let gearOpt = { rate: 50 };
  try { const o = JSON.parse(R.LS.get(GEAR_OPT, '{}')); if (o && o.rate != null) gearOpt.rate = Math.min(100, gNum(o.rate)); } catch {}
  let gearFlags = {};                                 // Scan-Hinweise je Ist-Slot (nur in dieser Sitzung)
  const gearSel = { ist: 'helm', ziel: 'helm' }; R.gearSel = gearSel;      // angetippter Slot je Seite

  // ---- Berechnung ----
  const gZero = () => ({ leather: 0, iron: 0, ebony: 0, bone: 0 });
  function gearCost(v, factor = 1) {
    const it = gItem(v?.item); if (!it) return null;
    const d = v.rarity === 'epic' ? 4 : 1, c = gZero();
    R.MATS.forEach(m => c[m.k] = it[m.k] / d * factor);
    return c;
  }
  const gAdd = (a, b) => { if (b) Object.keys(a).forEach(k => a[k] += b[k] || 0); return a; };
  function gearCalc(set) {
    const key = (v) => gItem(v.item) ? v.item + '|' + v.rarity : '';
    const rows = GEAR_SLOTS.map(sl => ({ sl, a: set.ist[sl.k], z: set.ziel[sl.k], status: 'none', from: null, cost: null, back: null, used: false,
      tierFrom: 0, tierTo: 0, tierMissing: [], needRefine: false }));
    // 1) gleiches Item im gleichen Slot wird behalten
    rows.forEach(r => { if (key(r.z) && key(r.z) === key(r.a)) { r.from = r.a; r.used = true; r.status = 'keep'; } });
    // 2) Accessoires dürfen die Plätze tauschen
    const accs = rows.filter(r => r.sl.cat === 'accessory');
    accs.forEach(r => { if (r.status !== 'none' || !key(r.z)) return; const src = accs.find(o => !o.used && key(o.a) === key(r.z)); if (src) { src.used = true; r.from = src.a; r.status = 'keepswap'; } });
    // 3) Schmiedekosten (neues Item startet bei T0) + Tier-Kosten je Stufe
    const need = gZero(), back = gZero();
    rows.forEach(r => {
      if (!key(r.z)) return;
      const it = gItem(r.z.item), d = r.z.rarity === 'epic' ? 4 : 1, cost = gZero();
      if (r.status === 'none') { r.status = 'craft'; gAdd(cost, gearCost(r.z)); }
      r.tierFrom = r.from ? (r.from.tier || 0) : 0; r.tierTo = r.z.tier || 0;
      for (let t = r.tierFrom + 1; t <= r.tierTo; t++) { const c = it.tiers?.[t]; if (c) R.MATS.forEach(m => cost[m.k] += (c[m.k] || 0) / d); else r.tierMissing.push(t); }
      r.refFrom = r.from && (r.from.refType || 'infantry') === (r.z.refType || 'infantry') ? (r.from.refine || 0) : 0; r.refTo = r.z.refine || 0; r.needRefine = r.refTo > r.refFrom;
      if (r.status !== 'craft') r.status = r.tierTo > r.tierFrom ? 'tierup' : r.needRefine ? 'refine' : r.status === 'keepswap' ? 'swap' : 'same';
      r.cost = R.MATS.some(m => cost[m.k] > 1e-9) ? cost : null;
      gAdd(need, r.cost);
    });
    // 4) Zerlegen: altes Teil wird nicht weiterverwendet und sein Slot neu belegt
    if (set.dismantle) rows.forEach(r => { if (!r.used && key(r.a) && key(r.z)) { r.back = gearCost(r.a, gearOpt.rate / 100); gAdd(back, r.back); } });
    return { rows, need, back };
  }
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
  const gq = (v) => (Math.ceil((v || 0) * 100 - 1e-6) / 100).toLocaleString('de-DE', { maximumFractionDigits: 2 });
  const gCostText = (c) => !c ? '–' : R.MATS.filter(m => c[m.k] > 1e-4).map(m => `${m.icon} ${gq(c[m.k])}`).join(' · ') || '0';
  const GBADGE = { red: 'border-red-400/50 text-red-300', amber: 'border-amber-400/50 text-amber-300', sky: 'border-sky-400/50 text-sky-300', emerald: 'border-emerald-400/50 text-emerald-300', gold: 'border-gold-500/50 text-gold-300', slate: 'border-ink-600 text-slate-400' };
  const GSTATUS = { same: ['✓ identisch', 'emerald'], swap: ['⇄ Platz getauscht', 'emerald'], tierup: ['⬆ Tier erhöhen', 'sky'], refine: ['⚔ Refine', 'red'], craft: ['⚒ craften', 'gold'] };
  const gRefStep = (r) => r.needRefine ? `Refine ${REFTYPES[r.z.refType]?.label || ''} ${gRefTxt(r.refFrom)} → ${gRefTxt(r.refTo)}` : '';
  const gTierTxt = (r) => r.tierTo > r.tierFrom ? `T${r.tierFrom} → T${r.tierTo}` + (r.tierMissing.length ? ` (Kosten für ${r.tierMissing.map(t => 'T' + t).join(', ')} fehlen)` : '') : '';

  // Rauten-Brett (8 Slots wie im Spiel)
  function gearBoard(side, set, calc) {
    return GEAR_SLOTS.map(sl => {
      const v = set[side][sl.k], it = gItem(v.item), rr = it?.rarity || v.rarity, f = it ? GFILL[rr] || GFILL.legendary : null, r = calc.rows.find(x => x.sl.k === sl.k);
      const active = gearSel[side] === sl.k;
      const badge = side === 'ziel' ? { same: ['✓', '#34d399'], swap: ['⇄', '#34d399'], tierup: ['⬆', '#7dd3fc'], refine: ['✦', '#fca5a5'], craft: ['⚒', '#fde68a'] }[r.status]
        : gearFlags[sl.k] ? ['⚠', '#fcd34d'] : r.back ? ['♻', '#7dd3fc'] : null;
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
    const RO = Object.keys(GEAR_RAR), items = R.gearCat.filter(i => i.cat === tab && i.icon).sort((a, b) => RO.indexOf(a.rarity) - RO.indexOf(b.rarity) || a.name.localeCompare(b.name));
    const byRar = Object.entries(GEAR_RAR).map(([r, info]) => [info, items.filter(i => i.rarity === r)]).filter(([, l]) => l.length);
    const tile = (i) => { const on = i.id === v.item, f = GFILL[i.rarity] || GFILL.legendary;
      return `<button type="button" data-side="${side}" data-slot="${sl.k}" data-f="item" data-v="${R.esc(i.id)}" title="${R.esc(i.name)}"
        class="relative aspect-square rounded-lg p-1 border transition ${on ? 'border-gold-400 ring-2 ring-gold-400/60' : 'border-ink-700 hover:border-gold-500/60'}" style="background:radial-gradient(circle at 50% 40%, ${f[1]}55, ${f[2]}44)">
        <img src="${i.icon}" alt="" loading="lazy" class="w-full h-full object-contain"></button>`; };
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
        ${side === 'sc' && it && (it.rarity || v.rarity) !== 'legendary' ? '<span class="text-[10px] text-slate-500" title="Iconic-Stufen gibt es nur bei legendären Items">kein Iconic</span>' : `<select data-side="${side}" data-slot="${sl.k}" data-f="tier" class="${sel}" ${it ? '' : 'disabled'} aria-label="Tier">
          ${[0, 1, 2, 3, 4, 5].map(t => `<option value="${t}"${(v.tier || 0) === t ? ' selected' : ''}>T${t}</option>`).join('')}
        </select>`}
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
    const verdict = !crafts.length ? ['✓ Keine Zusatzkosten – das Ziel-Set entspricht der Ist-Ausrüstung oder ist leer.', 'text-emerald-300']
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
          <div class="grid grid-cols-2 gap-4 text-center">
            <div><div class="text-2xl font-extrabold text-gold-300 tabular-nums">${gq(totalLeg)}</div><div class="text-[11px] text-slate-400">legendäre Materialien</div></div>
            <div><div class="text-2xl font-extrabold text-white tabular-nums">${crafts.length}</div><div class="text-[11px] text-slate-400">Items zu craften</div></div>
          </div>
        </div>
        <div class="mt-3 text-sm font-semibold ${verdict[1]}">${verdict[0]}</div>
        ${(() => { const miss = calc.rows.filter(r => r.tierMissing.length).map(r => `${r.sl.label} ${r.tierMissing.map(t => 'T' + t).join('/')}`); return miss.length ? `<div class="mt-2 text-xs text-amber-300">⚠ Tier-Kosten noch nicht hinterlegt (nicht mitgerechnet): ${R.esc(miss.join(' · '))}</div>` : ''; })()}
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
            <td class="py-2 px-2 text-right tabular-nums whitespace-nowrap text-xs">${r.cost ? gCostText(r.cost) : '–'}</td>
            <td class="py-2 pl-2 text-right tabular-nums whitespace-nowrap text-xs text-sky-300">${r.back ? '+ ' + gCostText(r.back) : '–'}</td></tr>`; }).join('')}</tbody>
      </table></div>`;
  }

  function renderGearCatInfo() {
    const n = gearDb.length;
    R.$('gearCatInfo').innerHTML = R.gearDbState === 'loading' ? 'Lade Katalog aus Supabase …'
      : R.gearDbState === 'error' ? `<span class="text-amber-300">⚠ Katalog aus Supabase nicht geladen (${R.esc(gearDbErr)})${n ? ` – es wird die gespeicherte Kopie mit ${n} Items genutzt.` : '.'}</span>`
      : `☁ ${n} Items aus Supabase (Tabelle <code>gear_items</code>) · ${gearCustom.length} eigene Items`;
  }
  function renderGearCat() {
    renderGearCatInfo();
    const inp = 'w-full bg-ink-950 border border-ink-700 rounded px-1.5 py-1 focus:outline-none focus:border-gold-500 disabled:opacity-60 disabled:border-transparent';
    const row = (i) => { const ro = i.db ? 'disabled' : '';
      return `<tr class="border-b border-ink-800">
        <td class="py-1 pr-1"><input data-cid="${R.esc(i.id)}" data-f="name" value="${R.esc(i.name)}" ${ro} class="${inp} min-w-[170px]"></td>
        <td class="py-1 px-1"><select data-cid="${R.esc(i.id)}" data-f="cat" ${ro} class="${inp}">${Object.entries(GEAR_CATS).map(([k, l]) => `<option value="${k}"${k === i.cat ? ' selected' : ''}>${l}</option>`).join('')}</select></td>
        <td class="py-1 px-1 whitespace-nowrap ${i.db ? 'text-emerald-300' : 'text-gold-300'}">${i.db ? '☁ Supabase' : '✎ eigenes'}</td>
        ${['leather', 'iron', 'ebony', 'bone'].map(k => `<td class="py-1 px-1"><input data-cid="${R.esc(i.id)}" data-f="${k}" type="number" min="0" step="1" value="${i[k]}" ${ro} class="${inp} w-16 text-right tabular-nums"></td>`).join('')}
        <td class="text-right">${i.db ? '' : `<button data-cdel="${R.esc(i.id)}" class="text-slate-500 hover:text-red-400 px-1" title="Item löschen">✕</button>`}</td></tr>`; };
    R.$('gearCatRows').innerHTML = R.gearCat.some(i => !i.lib) ? R.gearCat.filter(i => !i.lib).map(row).join('')
      : '<tr><td colspan="8" class="py-4 text-center text-slate-500">Noch keine Items – Tabelle gear_items in Supabase füllen oder „+ Eigenes Item“.</td></tr>';
  }
  function renderGear() {
    if (R.gearDbState === 'idle') loadGearDb();
    renderGearMain(); renderGearCat();
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
    else if (t.dataset.f === 'refset') { if (t.dataset.v) { v.refType = gRefType(t.dataset.v); v.refine = 100; } else v.refine = 0; }
    else if (t.dataset.f === 'item') { v.item = t.dataset.v ?? t.value; const it = gItem(t.value); if (it) v.rarity = it.rarity; v.tier = 0; v.refine = 0; v.refType = v.refType || 'infantry'; }
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

  // ================= Craft-Verlauf =================
  // Automatisch: jede Änderung an der Ist-Ausrüstung (von Hand oder per Scan) wird protokolliert.
  // Von Hand: eigene Einträge mit Notiz + Screenshots (Bilder → Supabase-Storage, Bucket "showcase").
  // Speicher: Key "rok_scanner_gear_history" → landet über LS.set automatisch in public.user_state.
  const GEAR_HIST = 'rok_scanner_gear_history', HIST_MAX = 400, HIST_MERGE = 15 * 60e3;
  const gSnap = (v) => ({ item: String(v?.item || ''), name: gItem(v?.item)?.name || String(v?.name || ''), rarity: R.gRar(v?.rarity), tier: gTier(v?.tier), refine: gRefine(v?.refine), refType: gRefType(v?.refType) });
  const gSame = (a, b) => a.item === b.item && (!a.item || (a.tier === b.tier && a.refine === b.refine && (!a.refine || a.refType === b.refType)));
  const hNorm = (e) => e && typeof e === 'object' && e.id ? {
    id: String(e.id), ts: +e.ts || Date.now(), kind: e.kind === 'manual' ? 'manual' : 'auto', src: e.src === 'scan' ? 'scan' : 'edit',
    setId: String(e.setId || ''), setName: String(e.setName || '').slice(0, 40), slot: GEAR_SLOTS.some(s => s.k === e.slot) ? e.slot : '',
    from: e.from ? gSnap(e.from) : null, to: e.to ? gSnap(e.to) : null, note: String(e.note || '').slice(0, 500),
    imgs: Array.isArray(e.imgs) ? e.imgs.filter(u => typeof u === 'string' && /^(https:\/\/|data:image\/jpeg;base64,)/.test(u)).slice(0, 6) : [] } : null;
  let chist = [];
  try { const h = JSON.parse(R.LS.get(GEAR_HIST, '[]')); if (Array.isArray(h)) chist = h.map(hNorm).filter(Boolean); } catch {}
  const saveHist = () => { chist.sort((a, b) => b.ts - a.ts); if (chist.length > HIST_MAX) chist.length = HIST_MAX; R.LS.set(GEAR_HIST, JSON.stringify(chist)); };
  // Änderung eines Ist-Slots eintragen; mehrere Klicks am selben Slot innerhalb von 15 Min. werden zu einem Eintrag zusammengefasst
  function logIst(set, slot, before, src) {
    if (!before) return;
    const after = gSnap(set.ist[slot]), now = Date.now();
    const prev = chist.find(e => e.kind === 'auto' && e.setId === set.id && e.slot === slot && now - e.ts < HIST_MERGE);
    if (prev) { prev.to = after; prev.ts = now; prev.setName = set.name; if (src === 'scan') prev.src = 'scan'; if (gSame(prev.from, prev.to)) chist = chist.filter(e => e !== prev); }
    else { if (gSame(before, after)) return; chist.unshift({ id: R.newId(), ts: now, kind: 'auto', src, setId: set.id, setName: set.name, slot, from: before, to: after, note: '', imgs: [] }); }
    saveHist();
  }
  const hSlot = (k) => GEAR_SLOTS.find(s => s.k === k);
  const hIcon = (v) => { const it = gItem(v?.item), f = GFILL[it?.rarity || v?.rarity] || GFILL.legendary;
    return `<span class="relative shrink-0 w-11 h-11 rounded-lg grid place-items-center border border-ink-700" style="background:${it || v?.item ? `radial-gradient(circle at 50% 40%, ${f[1]}55, ${f[2]}44)` : '#111725'}" title="${R.esc(it?.name || v?.name || 'leer')}">
      ${it?.icon ? `<img src="${it.icon}" alt="" loading="lazy" class="w-9 h-9 object-contain">` : `<span class="text-base opacity-50">${v?.item ? '❔' : '∅'}</span>`}
      ${v?.item && v.tier ? `<span class="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1 rounded bg-ink-950/90 border border-gold-400/70 text-[9px] font-extrabold text-gold-300 leading-3">${ROMAN[v.tier - 1]}</span>` : ''}
      ${v?.item && v.refine ? `<img src="${REFTYPES[v.refType]?.img || REFTYPES.infantry.img}" alt="" class="absolute -top-1 -right-1 w-4 h-4">` : ''}</span>`; };
  const hName = (v) => R.esc(gItem(v?.item)?.name || v?.name || 'Item');
  function hChanges(e) {                                      // was hat sich geändert? → [Text, Farbe]
    const a = e.from, b = e.to, out = [];
    if (!b?.item && a?.item) return [[`✕ ${hName(a)} entfernt`, 'text-slate-400']];
    if (b?.item && !a?.item) out.push([`⚒ ${hName(b)} neu geschmiedet`, 'text-gold-300']);
    else if (a?.item !== b?.item) out.push([`⚒ ${hName(a)} → ${hName(b)}`, 'text-gold-300']);
    if (b?.item) {
      const tf = a?.item === b.item ? a.tier : 0;
      if (b.tier > tf) out.push([`⬆ Tier ${tf ? 'T' + tf : 'T0'} → T${b.tier}`, 'text-sky-300']);
      else if (b.tier < tf) out.push([`⬇ Tier T${tf} → T${b.tier}`, 'text-slate-400']);
      const rf = a?.item === b.item ? a.refine : 0;
      if (b.refine && (!rf || a.refType !== b.refType)) out.push([`✦ Refine ${REFTYPES[b.refType]?.label || ''}`, 'text-red-300']);
      else if (!b.refine && rf) out.push(['Refine entfernt', 'text-slate-400']);
    }
    return out.length ? out : [['Geändert', 'text-slate-300']];
  }
  const hDay = (ts) => new Date(ts).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
  const hTime = (ts) => new Date(ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const hf = { set: 'all', kind: 'all', limit: 25 };
  function renderCraftHist() {
    const box = R.$('craftHistList'); if (!box) return;
    const set = activeSet();
    R.$('craftHistSet').innerHTML = `<option value="all">Alle Sets</option><option value="active"${hf.set === 'active' ? ' selected' : ''}>Nur „${R.esc(set.name)}“</option>`;
    R.$('craftHistSlot').innerHTML = `<option value="">– kein bestimmter Slot –</option>` + GEAR_SLOTS.map(s => `<option value="${s.k}">${s.icon} ${s.label}</option>`).join('');
    R.$('craftHistSlot').value = hDraft.slot;
    R.$('craftHistKind').querySelectorAll('[data-hk]').forEach(b => { const on = b.dataset.hk === hf.kind;
      b.className = `px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${on ? 'border-gold-400 bg-gold-500/15 text-gold-200' : 'border-ink-700 text-slate-400 hover:text-gold-300'}`; });
    const list = chist.filter(e => (hf.set === 'all' || e.setId === set.id) && (hf.kind === 'all' || e.kind === hf.kind));
    R.$('craftHistCount').textContent = `${list.length} ${list.length === 1 ? 'Eintrag' : 'Einträge'}`;
    if (!list.length) { box.innerHTML = `<div class="py-8 text-center text-sm text-slate-500">Noch nichts im Verlauf.<br><span class="text-xs">Sobald du an deiner aktuellen Ausrüstung etwas änderst oder oben einen Eintrag mit Screenshot hochlädst, taucht er hier auf.</span></div>`; return; }
    let day = '', html = '';
    list.slice(0, hf.limit).forEach(e => {
      const d = hDay(e.ts); if (d !== day) { day = d; html += `<div class="pt-3 pb-1 text-[11px] uppercase tracking-widest text-slate-500">${d}</div>`; }
      const sl = hSlot(e.slot), head = `<div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-400">
          <span class="tabular-nums text-slate-300">${hTime(e.ts)}</span>
          ${e.setName ? `<span class="px-1.5 rounded border border-ink-600 text-slate-300" translate="no">${R.esc(e.setName)}</span>` : ''}
          ${sl ? `<span>${sl.icon} ${sl.label}</span>` : ''}
          <span class="${e.kind === 'manual' ? 'text-gold-300' : 'text-slate-500'}">${e.kind === 'manual' ? '📷 hochgeladen' : e.src === 'scan' ? '🤖 per Scan' : '✎ am Dashboard geändert'}</span></div>`;
      const body = e.kind === 'auto' ? `<div class="mt-2 flex items-center gap-2">${hIcon(e.from)}<span class="text-slate-500">→</span>${hIcon(e.to)}
          <div class="min-w-0 space-y-0.5">${hChanges(e).map(([t, c]) => `<div class="text-sm font-semibold ${c}">${t}</div>`).join('')}</div></div>` : '';
      const note = e.note ? `<div class="mt-2 text-sm text-slate-200 whitespace-pre-line break-words">${R.esc(e.note)}</div>` : '';
      const imgs = e.imgs.length ? `<div class="mt-2 flex flex-wrap gap-2">${e.imgs.map((u, i) => `<button type="button" data-himg="${R.esc(e.id)}:${i}" class="w-20 h-20 rounded-lg overflow-hidden border border-ink-700 hover:border-gold-500/60"><img src="${R.esc(u)}" alt="Screenshot" loading="lazy" class="w-full h-full object-cover"></button>`).join('')}</div>` : '';
      html += `<div class="rounded-xl border ${e.kind === 'manual' ? 'border-gold-500/30 bg-gold-500/5' : 'border-ink-700 bg-ink-950/40'} p-3">
        <div class="flex items-start justify-between gap-2">${head}
          <div class="flex gap-1 shrink-0">
            <button type="button" data-hnote="${R.esc(e.id)}" class="text-slate-500 hover:text-gold-300 px-1 text-xs" title="Notiz bearbeiten">✎</button>
            <button type="button" data-hdel="${R.esc(e.id)}" class="text-slate-500 hover:text-red-400 px-1 text-xs" title="Eintrag löschen">✕</button></div></div>
        ${body}${note}${imgs}</div>`;
    });
    if (list.length > hf.limit) html += `<button type="button" data-hmore class="w-full mt-2 py-2 rounded-lg border border-ink-700 text-xs text-slate-400 hover:text-gold-300 hover:border-gold-500/60">Ältere anzeigen (${list.length - hf.limit} weitere)</button>`;
    box.innerHTML = html;
  }
  // ---- Neuer Eintrag mit Screenshots ----
  const hDraft = { slot: '', files: [] };
  const hMsg = (t, ok = true) => R.flash(R.$('craftHistMsg'), R.esc(t), ok);
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
  R.$('craftHistOpen').onclick = () => { const f = R.$('craftHistForm'); f.classList.toggle('hidden'); if (!f.classList.contains('hidden')) { R.$('craftHistDate').value = R.$('craftHistDate').dataset.def = hLocalNow(); R.$('craftHistNote').focus(); } };
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
      chist.push({ id, ts, kind: 'manual', src: 'edit', setId: set.id, setName: set.name, slot: hDraft.slot, from: null, to: null, note, imgs });
      saveHist(); RokAuth.saveNow?.('gear');
      hDraft.files.forEach(f => URL.revokeObjectURL(f.url)); hDraft.files = []; hDraft.slot = ''; R.$('craftHistNote').value = '';
      R.$('craftHistForm').classList.add('hidden'); renderHDraft(); renderCraftHist(); hMsg('✓ Eintrag im Craft-Verlauf gespeichert');
    } catch (e) { hMsg(e.message || String(e), false); }
    finally { btn.disabled = false; btn.textContent = '💾 Eintrag speichern'; }
  };
  // ---- Liste: Filter, Löschen, Notiz, Bild groß ----
  R.$('craftHistSet').onchange = () => { hf.set = R.$('craftHistSet').value; hf.limit = 25; renderCraftHist(); };
  R.$('craftHistKind').addEventListener('click', (ev) => { const b = ev.target.closest('[data-hk]'); if (!b) return; hf.kind = b.dataset.hk; hf.limit = 25; renderCraftHist(); });
  R.$('craftHistList').addEventListener('click', async (ev) => {
    const t = ev.target;
    if (t.closest('[data-hmore]')) { hf.limit += 25; renderCraftHist(); return; }
    const im = t.closest('[data-himg]');
    if (im) { const [eid, i] = im.dataset.himg.split(':'), e = chist.find(x => x.id === eid); if (!e) return;
      const ov = document.createElement('div'); ov.className = 'fixed inset-0 z-[100] bg-black/85 grid place-items-center p-4 cursor-zoom-out';
      ov.innerHTML = `<img src="${R.esc(e.imgs[+i])}" alt="" class="max-w-full max-h-full rounded-lg shadow-2xl">`; ov.onclick = () => ov.remove(); document.body.appendChild(ov); return; }
    const nb = t.closest('[data-hnote]');
    if (nb) { const e = chist.find(x => x.id === nb.dataset.hnote); if (!e) return;
      const v = await UI.prompt('Notiz zu diesem Eintrag:', e.note); if (v == null) return;
      e.note = v.trim().slice(0, 500); saveHist(); renderCraftHist(); return; }
    const db = t.closest('[data-hdel]');
    if (db) { const e = chist.find(x => x.id === db.dataset.hdel); if (!e) return;
      if (!(await UI.confirm('Diesen Eintrag aus dem Craft-Verlauf löschen?'))) return;
      chist = chist.filter(x => x !== e); saveHist(); renderCraftHist();
      const base = RokAuth.imgBase?.(), paths = e.imgs.filter(u => base && u.startsWith(base)).map(u => u.slice(base.length).split('?')[0]);
      if (paths.length) try { await RokAuth.db().storage.from('showcase').remove(paths); } catch {}
    }
  });

};
