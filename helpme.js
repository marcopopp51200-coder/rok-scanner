// Wiz fan Club – Help Me (Reiter rechts neben Craft)
// Ein Spieler postet bis zu 7 Sets aus seinen Showcases (auf Wunsch gleich auch im Feed). Die Sets werden als Rauten-Brett wie in Showcases/Craft gezeigt.
// Helfer tippen ein Item an und wählen „⚔ Refine“ oder „⬆ T erhöhen“ – bis zu 5 Schritte als Prioritäten-Liste (1 = zuerst).
// Mit „💾 Speichern“ wird die Empfehlung gespeichert (jederzeit änderbar). Der Fragende sieht die Auswertung; neue Antworten
// erscheinen als rote Zahl am Reiter. Läuft innerhalb von RokApp (scanner.js); R = geteilter Kontext (window.Rok).
// Supabase: help_requests (id, user_id, title, sets jsonb, status, created_at) · help_answers (request_id, user_id, picks jsonb, note, created_at)
// picks: ["<set-index>:<slot>:<aktion>", …] – aktion = refine | tier (alte Antworten ohne Aktion = „craften“)
window.RokMods = window.RokMods || {};
window.RokMods.helpme = (R) => {
  const $ = R.$, esc = R.esc, A = window.RokAuth, root = $('helpView');
  const db = () => A.db(), me = () => A.userId();
  const MAX = 5, MAX_SETS = 7, SEEN_KEY = 'rok_help_seen', DRAFT_KEY = 'rok_help_draft';
  const st = { loaded: false, loading: false, err: '', noTable: false, reqs: [], ans: {}, users: {}, pick: {}, note: {}, open: null, choose: null, busy: false, saving: null, msg: ['', ''], compose: false, sel: null, toFeed: true, sharing: null, title: '' };
  const seen = () => { try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}'); } catch { return {}; } };
  const markSeen = (id) => { try { const s = seen(); s[id] = Date.now(); localStorage.setItem(SEEN_KEY, JSON.stringify(s)); } catch {} };
  // Entwurf (noch nicht gespeicherte Auswahl) lokal merken, damit nichts verloren geht
  const drafts = () => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}'); } catch { return {}; } };
  const saveDraft = (rid) => { try { const d = drafts(); if (st.pick[rid]) d[rid] = { picks: st.pick[rid], note: st.note[rid] ?? '' }; else delete d[rid]; localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch {} };
  const RAR = { legendary: 'text-amber-300', epic: 'text-fuchsia-300', elite: 'text-sky-300', advanced: 'text-emerald-300', normal: 'text-slate-300' };
  const SLOTS = R.GEAR_SLOTS || [];
  const SLOT_LABEL = Object.fromEntries(SLOTS.map((s) => [s.k, s.label]));
  const ROMAN = R.ROMAN || ['I', 'II', 'III', 'IV', 'V'];
  const ACT = { refine: { icon: '⚔', label: 'Refine', cls: 'text-red-300' }, tier: { icon: '⬆', label: 'T erhöhen', cls: 'text-sky-300' }, '': { icon: '⚒', label: 'craften', cls: 'text-gold-300' } };

  // ---------- Laden ----------
  async function load() {
    if (st.loading) return; st.loading = true; st.err = ''; render();
    try {
      const { data, error } = await db().from('help_requests').select('*').order('created_at', { ascending: false }).limit(40);
      if (error) throw error;
      st.reqs = data || []; st.ans = {};
      const ids = st.reqs.map((r) => r.id);
      if (ids.length) { const a = await db().from('help_answers').select('*').in('request_id', ids); if (!a.error) (a.data || []).forEach((x) => { (st.ans[x.request_id] = st.ans[x.request_id] || []).push(x); }); }
      const uids = [...st.reqs.map((r) => r.user_id), ...Object.values(st.ans).flat().map((a) => a.user_id)];
      st.users = await R.users(uids);
      st.noTable = false;
      const d = drafts(); Object.keys(d).forEach((rid) => { if (!ids.includes(rid)) return; if (!st.pick[rid]) st.pick[rid] = d[rid].picks || []; if (st.note[rid] == null) st.note[rid] = d[rid].note || ''; });
    } catch (e) { if (R.tableMissing(e)) st.noTable = true; else st.err = A.germanError ? A.germanError(e) : String(e.message || e); }
    st.loading = false; st.loaded = true;
    if (R.view === 'help') st.reqs.filter((r) => r.user_id === me()).forEach((r) => markSeen(r.id));   // Seite ist offen → Antworten gelten als gesehen
    updateBadge(); render();
  }
  // Neue Antworten auf eigene Anfragen (seit dem letzten Öffnen) → Badge
  function newCount() { const s = seen(); let n = 0; st.reqs.filter((r) => r.user_id === me()).forEach((r) => { (st.ans[r.id] || []).forEach((a) => { if (a.user_id !== me() && new Date(a.created_at).getTime() > (s[r.id] || 0)) n++; }); }); return n; }
  const updateBadge = () => R.setBadge('[data-help-badge]', newCount());
  async function pollBadge() { try {
    const r = await db().from('help_requests').select('id').eq('user_id', me()); if (r.error || !(r.data || []).length) return;
    const a = await db().from('help_answers').select('request_id,user_id,created_at').in('request_id', r.data.map((x) => x.id)); if (a.error) return;
    const s = seen(); R.setBadge('[data-help-badge]', (a.data || []).filter((x) => x.user_id !== me() && new Date(x.created_at).getTime() > (s[x.request_id] || 0)).length);
  } catch {} }
  setTimeout(pollBadge, 2000); setInterval(pollBadge, 3 * 60000);

  // ---------- Anfrage erstellen ----------
  const gearOf = (set) => Object.entries(set.gear || {}).filter(([, g]) => g && (g.name || g.item)).map(([slot, g]) => { const it = R.gItem ? R.gItem(g.item) : null;
    return { slot, item: g.item || '', name: g.name || it?.name || '', icon: g.icon || it?.icon || '', rarity: g.rarity || it?.rarity || '', tier: g.tier || 0, refine: g.refine || 0, refType: g.refType || '' }; });
  const ownSets = () => (R.showcaseList ? R.showcaseList() : []).flatMap((sc) => (sc.sets || []).map((set, i) => ({ id: set.id || sc.id + '_' + i, name: set.name || `Set ${i + 1}`, from: sc.title, gear: gearOf(set), gfx: set.gfx || null }))).filter((s) => s.gear.length);
  // Auswahl der Sets: bis zu 7 (Standard = die ersten 7)
  const selIds = () => { const all = ownSets().map((s) => s.id); return (st.sel || all.slice(0, MAX_SETS)).filter((id) => all.includes(id)); };
  function toggleSet(id) {
    const cur = selIds(), i = cur.indexOf(id);
    if (i >= 0) cur.splice(i, 1); else if (cur.length >= MAX_SETS) { msg(`Höchstens ${MAX_SETS} Sets – erst eines abwählen.`, 'warn'); return; } else cur.push(id);
    st.sel = cur; render();
  }
  // Anfrage im Feed teilen (feed.js stellt R.feedShareHelp bereit)
  async function share(req, quiet) {
    if (!R.feedShareHelp) { if (!quiet) msg('Der Feed ist noch nicht geladen – bitte Seite neu laden.', 'warn'); return false; }
    st.sharing = req.id; if (!quiet) render();
    try { await R.feedShareHelp(req); if (!quiet) msg('✓ Im Feed gepostet', 'ok'); st.sharing = null; if (!quiet) render(); return true; }
    catch (e) { msg('Im Feed posten fehlgeschlagen: ' + (A.germanError ? A.germanError(e) : e.message || e), 'err'); }
    st.sharing = null; if (!quiet) render(); return false;
  }
  async function post() {
    const ids = selIds(), sets = ownSets().filter((s) => ids.includes(s.id)).slice(0, MAX_SETS);
    if (!sets.length) { msg(ownSets().length ? 'Wähl mindestens ein Set aus.' : 'Keine Ausrüstung gefunden – zuerst unter 🎨 Showcases Sets mit Gear anlegen.', 'warn'); return; }
    if (st.busy) return; st.busy = true; render();
    try {
      const row = { user_id: me(), title: (st.title || '').trim().slice(0, 100) || 'Was soll ich als Nächstes verbessern?', sets: sets.map((s) => ({ id: s.id, name: s.name, gear: s.gear, gfx: s.gfx })), status: 'open' };
      const { data: ins, error } = await db().from('help_requests').insert(row).select().single(); if (error) throw error;
      st.compose = false; st.title = ''; st.sel = null;
      const fed = st.toFeed && ins ? await share(ins, true) : false;
      msg(fed ? '✓ Anfrage gepostet – auch im Feed' : '✓ Anfrage gepostet', 'ok'); await load();
    } catch (e) { msg(R.tableMissing(e) ? 'Die Help-Me-Tabellen fehlen noch in Supabase (SQL im Chat).' : 'Posten fehlgeschlagen: ' + (A.germanError ? A.germanError(e) : e.message), 'err'); }
    st.busy = false; render();
  }
  async function closeReq(id, del) {
    if (!(await window.UI.confirm(del ? 'Anfrage löschen?' : 'Anfrage schließen?'))) return;
    try { const q = del ? db().from('help_requests').delete().eq('id', id) : db().from('help_requests').update({ status: 'closed' }).eq('id', id); const { error } = await q; if (error) throw error; await load(); } catch (e) { msg(e.message || String(e), 'err'); }
  }

  // ---------- Antworten ----------
  const itemKey = (si, slot) => `${si}:${slot}`;
  const parseKey = (k) => { const [si, slot, act = ''] = String(k).split(':'); return { si: +si, slot, act, item: `${si}:${slot}` }; };
  const findGear = (req, si, slot) => ((req.sets || [])[si]?.gear || []).find((g) => g.slot === slot) || null;
  const isLeg = (g) => ((R.gItem && R.gItem(g.item)?.rarity) || g.rarity || 'legendary') === 'legendary';
  const canRefine = (g) => (+g.refine || 0) < 100;
  const canTier = (g) => isLeg(g) && (+g.tier || 0) < 5;
  const actText = (g, act) => act === 'tier' ? `T${+g.tier || 0} → T${(+g.tier || 0) + 1}` : act === 'refine' ? 'Refine' : 'craften';
  const mineOf = (rid) => (st.ans[rid] || []).find((a) => a.user_id === me());
  const picksOf = (rid) => st.pick[rid] || (mineOf(rid)?.picks || []);
  const ensurePick = (rid) => { if (!st.pick[rid]) { const m = mineOf(rid); st.pick[rid] = m ? [...(m.picks || [])] : []; } return st.pick[rid]; };
  const dirty = (rid) => { if (!st.pick[rid] && st.note[rid] == null) return false; const m = mineOf(rid); return JSON.stringify(st.pick[rid] || m?.picks || []) !== JSON.stringify(m?.picks || []) || (st.note[rid] ?? m?.note ?? '') !== (m?.note || ''); };
  function setAction(rid, item, act) {
    const p = ensurePick(rid), key = `${item}:${act}`, i = p.indexOf(key);
    if (i >= 0) p.splice(i, 1);
    else if (p.length >= MAX) { msg(`Höchstens ${MAX} Schritte – erst einen wieder abwählen.`, 'warn'); return; }
    else p.push(key);
    st.choose = null; saveDraft(rid); render();
  }
  function movePick(rid, idx, d) { const p = ensurePick(rid), j = idx + d; if (j < 0 || j >= p.length) return; [p[idx], p[j]] = [p[j], p[idx]]; saveDraft(rid); render(); }
  function removePick(rid, idx) { ensurePick(rid).splice(idx, 1); saveDraft(rid); render(); }
  async function save(rid) {
    const picks = picksOf(rid); if (!picks.length) { msg('Erst ein Item antippen und „Refine“ oder „T erhöhen“ wählen.', 'warn'); return; }
    if (st.saving) return; st.saving = rid; render();
    try {
      const m = mineOf(rid);
      const { error } = await db().from('help_answers').upsert({ request_id: rid, user_id: me(), picks, note: (st.note[rid] ?? m?.note ?? '').slice(0, 300), created_at: new Date().toISOString() }); if (error) throw error;
      delete st.pick[rid]; delete st.note[rid]; saveDraft(rid);
      msg('✓ Gespeichert – du kannst die Empfehlung jederzeit ändern.', 'ok'); st.saving = null; await load(); return;
    } catch (e) { msg('Speichern fehlgeschlagen: ' + (A.germanError ? A.germanError(e) : e.message), 'err'); }
    st.saving = null; render();
  }
  function discard(rid) { delete st.pick[rid]; delete st.note[rid]; st.choose = null; saveDraft(rid); render(); }
  // Auswertung: Platz 1 = 5 Punkte … Platz 5 = 1 Punkt
  function tally(req) {
    const score = {}, votes = {};
    (st.ans[req.id] || []).forEach((a) => (a.picks || []).forEach((k, i) => { score[k] = (score[k] || 0) + (MAX - i); votes[k] = (votes[k] || 0) + 1; }));
    return Object.keys(score).map((k) => { const p = parseKey(k), g = findGear(req, p.si, p.slot); return { key: k, act: p.act, score: score[k], votes: votes[k], g, set: (req.sets || [])[p.si]?.name || '' }; })
      .filter((x) => x.g).sort((a, b) => b.score - a.score);
  }

  // ---------- Rauten-Brett (wie Showcases / Craft) ----------
  const box = (sl) => `left:${(sl.x + 1) * 25}%;top:${sl.y * 12.5}%;width:50%;height:25%`;
  const gearMap = (set) => Object.fromEntries((set.gear || []).map((g) => [g.slot, { item: g.item, name: g.name, icon: g.icon, rarity: g.rarity || 'legendary', tier: g.tier || 0, refine: g.refine || 0, refType: g.refType || 'infantry' }]));
  function fallbackBoard(map) {   // falls showcase.js (noch) kein R.gearBoardHTML hat: Brett wie im Craft-Bereich
    return SLOTS.map((sl) => { const v = map[sl.k], f = v ? (R.GFILL || {})[v.rarity] || (R.GFILL || {}).legendary : null, full = v && v.refine >= 100;
      return `<div class="gdia absolute" style="${box(sl)}">
        <span class="gdia absolute inset-0" style="background:${full && R.GOLD_RIM ? R.GOLD_RIM : f ? f[0] : '#2e3a55'}"></span>
        <span class="gdia absolute ${full ? 'inset-[10px]' : 'inset-[3px]'}" style="background:${f && R.gFace ? R.gFace(v.rarity) : '#111725'}"></span>
        <span class="relative z-10 h-full w-full flex items-center justify-center">${v?.icon ? `<img src="${esc(v.icon)}" alt="" class="w-[54%] aspect-square object-contain">` : `<span class="text-lg opacity-40">${sl.icon}</span>`}</span>
        ${v && v.tier > 0 ? `<span class="absolute z-10 bottom-[3%] left-1/2 -translate-x-1/2 px-1.5 rounded-md bg-ink-950/85 border border-gold-400/70 text-[10px] font-extrabold text-gold-300 leading-4">${ROMAN[v.tier - 1]}</span>` : ''}
      </div>`; }).join('');
  }
  // Brett eines Sets + klickbare Ebene darüber (Nummern = Priorität, ⚔/⬆ = gewählte Aktion)
  function setBoard(req, si, set, mode, picks, result) {
    const map = gearMap(set);
    let board = ''; try { board = R.gearBoardHTML ? R.gearBoardHTML(map, set.gfx) : fallbackBoard(map); } catch { board = fallbackBoard(map); }
    const layer = SLOTS.map((sl) => {
      const g = map[sl.k]; if (!g) return '';
      const item = itemKey(si, sl.k), mine = picks.map((k, i) => ({ ...parseKey(k), n: i + 1 })).filter((p) => p.item === item);
      const sel = st.choose && st.choose.rid === req.id && st.choose.item === item;
      const votes = mode === 'own' ? result.filter((x) => x.key.startsWith(item + ':') || x.key === item).reduce((a, x) => a + x.votes, 0) : 0;
      const badges = mine.map((p) => `<span class="inline-flex items-center gap-0.5 px-1.5 h-5 rounded-full bg-gold-500 text-ink-950 text-[11px] font-extrabold shadow">${p.n}<span>${ACT[p.act]?.icon || ''}</span></span>`).join('')
        + (votes ? `<span class="inline-flex items-center px-1.5 h-5 rounded-full bg-emerald-500 text-ink-950 text-[11px] font-extrabold shadow" title="${votes} Stimme(n)">${votes}×</span>` : '');
      const inner = `<span class="gdia absolute inset-0 transition ${sel ? 'bg-white/25 ring-2 ring-white' : mine.length ? 'bg-gold-400/15' : mode === 'pick' ? 'hover:bg-white/15' : ''}"></span>
        ${badges ? `<span class="absolute left-1/2 -translate-x-1/2 top-[6%] flex gap-0.5 pointer-events-none">${badges}</span>` : ''}`;
      const title = esc(`${SLOT_LABEL[sl.k] || sl.k}: ${g.name}${g.tier ? ' · T' + g.tier : ''}${g.refine >= 100 ? ' · refined' : ''}`);
      return mode === 'pick'
        ? `<button type="button" data-help-tile="${esc(req.id)}|${esc(item)}" title="${title}" class="absolute z-30 focus:outline-none" style="${box(sl)}">${inner}</button>`
        : `<div class="absolute z-30 pointer-events-none" style="${box(sl)}" title="${title}">${inner}</div>`;
    }).join('');
    return `<div class="flex flex-col items-center gap-1.5">
      <div class="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">${esc(set.name)}</div>
      <div class="relative w-[170px] sm:w-[190px] aspect-[1/2] select-none">${board}${layer}</div>
    </div>`;
  }
  // Auswahl nach dem Antippen eines Items: Refine oder T erhöhen
  function chooserHTML(req, picks) {
    const c = st.choose; if (!c || c.rid !== req.id) return '';
    const p = parseKey(c.item), g = findGear(req, p.si, p.slot); if (!g) return '';
    const has = (act) => picks.includes(`${c.item}:${act}`);
    const opt = (act, ok, why) => { const on = has(act), a = ACT[act];
      return `<button type="button" data-help-act="${esc(req.id)}|${esc(c.item)}|${act}" ${ok || on ? '' : 'disabled'} title="${ok ? '' : esc(why)}"
        class="flex-1 min-w-[9rem] flex flex-col items-center gap-0.5 rounded-xl border px-3 py-2 transition disabled:opacity-40 disabled:cursor-not-allowed ${on ? 'border-gold-400 bg-gold-500/20' : 'border-ink-600 bg-ink-950 hover:border-gold-500/60'}">
        <span class="text-sm font-semibold ${a.cls}">${a.icon} ${a.label}</span>
        <span class="text-[11px] text-slate-400">${on ? '✓ gewählt – nochmal tippen zum Abwählen' : ok ? actText(g, act) : why}</span></button>`; };
    return `<div class="rounded-xl border border-gold-500/40 bg-ink-900/80 p-3 flex flex-col gap-2">
      <div class="flex items-center gap-2">
        ${g.icon ? `<img src="${esc(g.icon)}" alt="" class="w-9 h-9 object-contain">` : ''}
        <div class="min-w-0 flex-1"><div class="text-[10px] uppercase tracking-widest text-slate-500">${esc(SLOT_LABEL[g.slot] || g.slot)} · ${esc((req.sets || [])[p.si]?.name || '')}</div>
          <div class="text-sm font-semibold truncate ${RAR[g.rarity] || 'text-slate-100'}">${esc(g.name)} <span class="text-[11px] text-slate-400">${g.tier ? 'T' + g.tier : 'T0'}${g.refine >= 100 ? ' · refined' : ''}</span></div></div>
        <button type="button" data-help-choose-x class="text-slate-400 hover:text-slate-200 text-sm px-2">✕</button>
      </div>
      <div class="text-xs text-slate-300">Was soll als Nächstes passieren?</div>
      <div class="flex flex-wrap gap-2">${opt('refine', canRefine(g), 'schon refined')}${opt('tier', canTier(g), isLeg(g) ? 'schon T5' : 'nur bei legendären Items')}</div>
    </div>`;
  }
  // Prioritäten-Liste des Helfers (mit Reihenfolge ändern)
  function pickListHTML(req, picks) {
    if (!picks.length) return '';
    return `<ol class="flex flex-col gap-1">${picks.map((k, i) => { const p = parseKey(k), g = findGear(req, p.si, p.slot); if (!g) return ''; const a = ACT[p.act] || ACT[''];
      return `<li class="flex items-center gap-2 rounded-lg bg-ink-950/60 border border-ink-700 px-2 py-1 text-sm">
        <span class="w-5 text-center font-bold text-gold-300">${i + 1}.</span>
        ${g.icon ? `<img src="${esc(g.icon)}" alt="" class="w-6 h-6 object-contain">` : ''}
        <span class="min-w-0 flex-1 truncate ${RAR[g.rarity] || ''}">${esc(g.name)}</span>
        <span class="text-xs whitespace-nowrap ${a.cls}">${a.icon} ${actText(g, p.act)}</span>
        <button type="button" data-help-mv="${esc(req.id)}|${i}|-1" ${i ? '' : 'disabled'} class="px-1 text-slate-400 hover:text-gold-300 disabled:opacity-30" title="höher">▲</button>
        <button type="button" data-help-mv="${esc(req.id)}|${i}|1" ${i < picks.length - 1 ? '' : 'disabled'} class="px-1 text-slate-400 hover:text-gold-300 disabled:opacity-30" title="tiefer">▼</button>
        <button type="button" data-help-rm="${esc(req.id)}|${i}" class="px-1 text-slate-500 hover:text-red-300" title="entfernen">✕</button></li>`; }).join('')}</ol>`;
  }

  // ---------- Darstellung ----------
  const inp = 'w-full bg-ink-950 border border-ink-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-gold-500';
  const btn = (attr, lab, tone) => `<button type="button" ${attr} class="text-xs px-3 py-1.5 rounded-lg border whitespace-nowrap ${tone === 'gold' ? 'border-gold-400 bg-gold-500 text-ink-950 font-semibold hover:bg-gold-400' : tone === 'red' ? 'border-ink-600 text-slate-400 hover:border-red-400/60 hover:text-red-300' : 'border-gold-500/50 text-gold-300 hover:bg-gold-500/10'} disabled:opacity-50">${lab}</button>`;
  const u = (id) => st.users[id] || { username: '?' };
  function reqHTML(req) {
    const own = req.user_id === me(), ans = st.ans[req.id] || [], mine = mineOf(req.id), picks = picksOf(req.id);
    const open = st.open === req.id, closed = req.status === 'closed', result = tally(req);
    const mode = own ? 'own' : closed ? 'view' : 'pick';
    const boards = `<div class="flex flex-wrap justify-center gap-4 rounded-xl bg-ink-950/40 border border-ink-700/60 p-3">${(req.sets || []).map((s, si) => setBoard(req, si, s, mode, own ? [] : picks, result)).join('')}</div>`;
    const resultHTML = result.length ? `<div class="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3"><div class="text-[11px] uppercase tracking-widest text-emerald-300 mb-2">📊 Empfehlung der Community · ${ans.length} Antwort${ans.length === 1 ? '' : 'en'}</div>
        <div class="flex flex-col gap-1">${result.slice(0, 8).map((x, i) => { const a = ACT[x.act] || ACT['']; return `<div class="flex items-center gap-2 text-sm"><span class="w-6 text-center font-bold ${i === 0 ? 'text-gold-300' : 'text-slate-400'}">${i + 1}.</span>${x.g.icon ? `<img src="${esc(x.g.icon)}" alt="" class="w-7 h-7 rounded object-contain bg-ink-900">` : ''}<span class="min-w-0 flex-1 truncate ${RAR[x.g.rarity] || ''}">${esc(x.g.name)} <span class="text-[11px] text-slate-500">${esc(x.set)} · ${esc(SLOT_LABEL[x.g.slot] || x.g.slot)}</span></span><span class="text-xs whitespace-nowrap ${a.cls}">${a.icon} ${actText(x.g, x.act)}</span><span class="text-xs text-slate-400 tabular-nums whitespace-nowrap">${x.votes}× · ${x.score} P.</span></div>`; }).join('')}</div>
        ${ans.filter((a) => a.note).length ? `<div class="mt-2 pt-2 border-t border-ink-700/60 flex flex-col gap-1">${ans.filter((a) => a.note).map((a) => `<div class="text-xs text-slate-300"><b class="text-slate-200">${esc(u(a.user_id).username || '?')}:</b> ${esc(a.note)}</div>`).join('')}</div>` : ''}</div>` : (own ? '<p class="text-xs text-slate-500">Noch keine Antworten.</p>' : '');
    const isDirty = dirty(req.id), saving = st.saving === req.id;
    const helper = !own && !closed ? `<div class="flex flex-col gap-2 rounded-xl border border-gold-500/30 bg-gold-500/5 p-3">
        <div class="text-xs text-slate-300">${picks.length ? `${picks.length}/${MAX} Schritte – Reihenfolge = Priorität (1 = zuerst)` : `Tippe ein Item an und wähle <b class="text-red-300">⚔ Refine</b> oder <b class="text-sky-300">⬆ T erhöhen</b> (bis zu ${MAX} Schritte)`}</div>
        ${chooserHTML(req, picks)}
        ${pickListHTML(req, picks)}
        <input type="text" maxlength="300" data-help-note="${esc(req.id)}" value="${esc(st.note[req.id] ?? (mine ? mine.note || '' : ''))}" placeholder="Kurze Begründung (optional)" class="${inp} !py-1.5">
        <div class="flex flex-wrap items-center justify-end gap-2">
          <span class="mr-auto text-[11px] ${isDirty ? 'text-amber-300' : mine ? 'text-emerald-400' : 'text-slate-500'}">${isDirty ? '● Nicht gespeicherte Änderungen' : mine ? `✓ Gespeichert ${R.timeAgo(mine.created_at)}` : ''}</span>
          ${isDirty ? btn(`data-help-discard="${esc(req.id)}"`, '↺ Verwerfen', 'red') : ''}
          ${btn(`data-help-save="${esc(req.id)}"${saving || (!isDirty && mine) ? ' disabled' : ''}`, saving ? '⏳ Speichert …' : '💾 Speichern', 'gold')}
        </div></div>` : '';
    return `<article data-help-req="${esc(req.id)}" class="panel rounded-2xl p-4 sm:p-5 flex flex-col gap-3 transition-shadow ${closed ? 'opacity-70' : ''}">
      <div class="flex items-center gap-3">
        <button type="button" data-help-prof="${esc(req.user_id)}" class="flex items-center gap-2.5 min-w-0 text-left rounded-lg hover:bg-ink-800/60 pr-2">${R.userLine(u(req.user_id), 'w-10 h-10 text-base')}</button>
        <span class="ml-auto text-[11px] text-slate-500 text-right">${closed ? '✓ geschlossen · ' : ''}${R.timeAgo(req.created_at)}<span class="block">${ans.length} Antwort${ans.length === 1 ? '' : 'en'}</span></span>
        ${own ? `${closed ? '' : btn(`data-help-share="${esc(req.id)}"${st.sharing === req.id ? ' disabled' : ''}`, st.sharing === req.id ? '⏳' : '📰 Im Feed posten')}${closed ? '' : btn(`data-help-close="${esc(req.id)}"`, 'Schließen')}${btn(`data-help-del="${esc(req.id)}"`, '✕', 'red')}` : ''}
      </div>
      <div class="font-semibold text-slate-100">🆘 ${esc(req.title)}</div>
      ${open || own ? `${boards}${helper}${resultHTML}`
        : `<button type="button" data-help-open="${esc(req.id)}" class="text-left text-xs text-gold-300 hover:underline">${(req.sets || []).length} Set${(req.sets || []).length === 1 ? '' : 's'} · ${(req.sets || []).reduce((a, s) => a + (s.gear || []).length, 0)} Teile – ${mine ? 'deine Empfehlung ansehen / ändern' : 'ansehen und empfehlen'} ›</button>`}
    </article>`;
  }
  function composeHTML() {
    const sets = ownSets();
    return `<div class="panel rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
      <div class="flex flex-wrap items-center justify-between gap-2"><h3 class="font-display text-lg gold-text">🆘 Neue Anfrage</h3>${btn('data-help-compose="0"', 'Abbrechen', 'red')}</div>
      ${sets.length ? `<div class="flex flex-col gap-1.5">
        <div class="flex items-baseline justify-between gap-2 text-xs text-slate-400"><span>Welche Sets? (bis zu ${MAX_SETS})</span><span class="tabular-nums ${selIds().length >= MAX_SETS ? 'text-gold-300' : ''}">${selIds().length}/${Math.min(MAX_SETS, sets.length)} gewählt</span></div>
        <div class="grid gap-1.5 sm:grid-cols-2">${sets.map((s) => { const on = selIds().includes(s.id), full = !on && selIds().length >= MAX_SETS;
          return `<button type="button" data-help-set="${esc(s.id)}" aria-pressed="${on}" class="flex items-center gap-2 text-left rounded-lg border px-2.5 py-2 min-w-0 transition ${on ? 'border-gold-400 bg-gold-500/10' : 'border-ink-600 hover:border-gold-500/60'} ${full ? 'opacity-50' : ''}">
            <span class="w-5 h-5 shrink-0 rounded border grid place-items-center text-[11px] font-bold ${on ? 'bg-gold-500 border-gold-400 text-ink-950' : 'border-ink-600'}">${on ? '✓' : ''}</span>
            <span class="flex -space-x-1.5 shrink-0">${s.gear.slice(0, 4).map((g) => g.icon ? `<img src="${esc(g.icon)}" alt="" class="w-6 h-6 rounded bg-ink-900 object-contain ring-1 ring-ink-800">` : '').join('')}</span>
            <span class="min-w-0"><span class="block text-sm font-semibold truncate text-slate-100">${esc(s.name)}</span><span class="block text-[10px] text-slate-500 truncate">${s.gear.length} Teile · ${esc(s.from)}</span></span></button>`; }).join('')}</div>
        ${sets.length > 1 ? `<div class="flex gap-3 text-[11px]"><button type="button" data-help-setall="1" class="text-gold-300 hover:underline">Erste ${Math.min(MAX_SETS, sets.length)} wählen</button><button type="button" data-help-setall="0" class="text-slate-400 hover:underline">Keine</button></div>` : ''}
      </div>
      <label class="text-xs text-slate-400">Frage (optional)<input type="text" maxlength="100" data-help-title value="${esc(st.title)}" placeholder="Was soll ich als Nächstes verbessern?" class="mt-1 ${inp}"></label>
      <div class="flex flex-wrap items-center justify-end gap-3">
        <label class="mr-auto flex items-center gap-2 text-xs text-slate-300 cursor-pointer"><input type="checkbox" data-help-tofeed ${st.toFeed ? 'checked' : ''} class="w-4 h-4 accent-amber-400"> 📰 Auch im Feed posten</label>
        ${btn('data-help-post' + (st.busy || !selIds().length ? ' disabled' : ''), '📨 Posten', 'gold')}</div>` : '<p class="text-sm text-amber-300">Noch keine Sets mit Ausrüstung – zuerst unter 🎨 Showcases eintragen.</p>'}</div>`;
  }
  function msg(t, tone) { st.msg = [t, tone]; const el = $('helpMsg'); if (!el) return; el.textContent = t; el.className = 'text-xs min-h-[1em] ' + ({ ok: 'text-emerald-400', warn: 'text-amber-300', err: 'text-red-300' }[tone] || 'text-slate-500'); }
  function render() {
    if (!root) return;
    const focus = document.activeElement && root.contains(document.activeElement) && document.activeElement.dataset.helpNote ? [document.activeElement.dataset.helpNote, document.activeElement.selectionStart] : null;
    root.innerHTML = `<div class="flex flex-wrap items-end justify-between gap-3">
        <div><h2 class="font-display text-2xl gold-text">🆘 Help Me</h2><p class="text-xs text-slate-500">Zeig dein Set – die Community sagt dir, was du zuerst refinen oder hochstufen solltest</p></div>
        <div class="flex gap-2">${btn('data-help-reload', '↻')}${st.compose ? '' : btn('data-help-compose="1"', '➕ Anfrage stellen', 'gold')}</div></div>
      <div id="helpMsg" class="text-xs min-h-[1em]"></div>
      ${st.compose ? composeHTML() : ''}
      ${st.noTable ? '<div class="panel rounded-2xl p-5 text-sm text-amber-300">⚠ Die Help-Me-Tabellen fehlen noch in Supabase. Bitte das SQL aus dem Chat ausführen.</div>' : ''}
      ${st.err ? `<div class="panel rounded-2xl p-5 text-sm text-red-300">⚠ ${esc(st.err)}</div>` : ''}
      ${!st.loaded || st.loading ? '<p class="text-sm text-slate-500 text-center py-6">⏳ Wird geladen …</p>' : ''}
      <div class="grid gap-4 xl:grid-cols-2 items-start">${st.reqs.map(reqHTML).join('')}</div>
      ${st.loaded && !st.loading && !st.reqs.length && !st.noTable ? '<p class="text-sm text-slate-500 text-center py-6">Noch keine Anfragen.</p>' : ''}`;
    msg(st.msg[0], st.msg[1]);
    if (focus) { const el = root.querySelector(`[data-help-note="${CSS.escape(focus[0])}"]`); if (el) { el.focus(); try { el.setSelectionRange(focus[1], focus[1]); } catch {} } }
  }
  let noteT = null;
  root.addEventListener('input', (ev) => {
    const el = ev.target;
    if (el.dataset.helpNote) { const rid = el.dataset.helpNote; ensurePick(rid); st.note[rid] = el.value; saveDraft(rid);
      clearTimeout(noteT); noteT = setTimeout(() => { const art = root.querySelector(`[data-help-req="${CSS.escape(rid)}"]`); if (art && !art.contains(document.activeElement)) render(); else { const b = art?.querySelector('[data-help-save]'); if (b) b.disabled = !!st.saving || !dirty(rid) && !!mineOf(rid); } }, 250); }
    if (el.hasAttribute('data-help-title')) st.title = el.value;
    if (el.hasAttribute('data-help-tofeed')) st.toFeed = el.checked;
  });
  root.addEventListener('click', (ev) => {
    const t = ev.target, c = (a) => t.closest(`[${a}]`); let b;
    if ((b = c('data-help-compose'))) { st.compose = b.dataset.helpCompose === '1'; render(); }
    else if (c('data-help-post')) post();
    else if ((b = c('data-help-set'))) toggleSet(b.dataset.helpSet);
    else if ((b = c('data-help-setall'))) { st.sel = b.dataset.helpSetall === '1' ? ownSets().map((s) => s.id).slice(0, MAX_SETS) : []; render(); }
    else if ((b = c('data-help-share'))) { const r = st.reqs.find((x) => x.id === b.dataset.helpShare); if (r) share(r); }
    else if (c('data-help-reload')) load();
    else if ((b = c('data-help-open'))) { st.open = b.dataset.helpOpen; render(); }
    else if ((b = c('data-help-tile'))) { const [rid, item] = b.dataset.helpTile.split('|'); st.choose = st.choose && st.choose.rid === rid && st.choose.item === item ? null : { rid, item }; render(); }
    else if ((b = c('data-help-act'))) { if (b.disabled) return; const [rid, item, act] = b.dataset.helpAct.split('|'); setAction(rid, item, act); }
    else if (c('data-help-choose-x')) { st.choose = null; render(); }
    else if ((b = c('data-help-mv'))) { const [rid, i, d] = b.dataset.helpMv.split('|'); movePick(rid, +i, +d); }
    else if ((b = c('data-help-rm'))) { const [rid, i] = b.dataset.helpRm.split('|'); removePick(rid, +i); }
    else if ((b = c('data-help-save'))) save(b.dataset.helpSave);
    else if ((b = c('data-help-discard'))) discard(b.dataset.helpDiscard);
    else if ((b = c('data-help-close'))) closeReq(b.dataset.helpClose, false);
    else if ((b = c('data-help-del'))) closeReq(b.dataset.helpDel, true);
    else if ((b = c('data-help-prof'))) R.openProfile(b.dataset.helpProf);
  });
  // Sprung aus dem Feed: Help Me öffnen, Anfrage aufklappen und hinscrollen
  R.helpOpen = (id) => {
    st.open = id; R.goView('help');
    let tries = 0;
    const go = () => {
      const el = root.querySelector(`[data-help-req="${CSS.escape(id)}"]`);
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); el.classList.add('ring-2', 'ring-gold-400'); setTimeout(() => el.classList.remove('ring-2', 'ring-gold-400'), 2500); return; }
      if ((!st.loaded || st.loading) && tries++ < 40) { setTimeout(go, 250); return; }
      msg('Diese Anfrage gibt es nicht mehr.', 'warn');
    };
    setTimeout(go, 450);
  };
  R.viewHooks.help = () => { if (!st.loaded && !st.loading) { load(); return; } st.reqs.filter((r) => r.user_id === me()).forEach((r) => markSeen(r.id)); updateBadge(); render(); };
};
