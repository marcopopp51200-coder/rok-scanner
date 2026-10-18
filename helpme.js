// Wiz fan Club – Help Me (Reiter rechts neben Craft)
// Ein Spieler postet ein Set (oder alle Sets) aus seinen Showcases. Andere tippen bis zu 5 Ausrüstungsteile an
// und geben so eine Prioritäten-Liste ab (1 = zuerst craften). Der Fragende sieht die Auswertung; neue Antworten
// erscheinen als rote Zahl am Reiter. Läuft innerhalb von RokApp (scanner.js); R = geteilter Kontext (window.Rok).
// Supabase: help_requests (id, user_id, title, sets jsonb, status, created_at) · help_answers (request_id, user_id, picks jsonb, note, created_at)
window.RokMods = window.RokMods || {};
window.RokMods.helpme = (R) => {
  const $ = R.$, esc = R.esc, A = window.RokAuth, root = $('helpView');
  const db = () => A.db(), me = () => A.userId();
  const MAX = 5, SEEN_KEY = 'rok_help_seen';
  const st = { loaded: false, loading: false, err: '', noTable: false, reqs: [], ans: {}, users: {}, pick: {}, note: {}, open: null, busy: false, msg: ['', ''], compose: false, sel: 'all', title: '' };
  const seen = () => { try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}'); } catch { return {}; } };
  const markSeen = (id) => { try { const s = seen(); s[id] = Date.now(); localStorage.setItem(SEEN_KEY, JSON.stringify(s)); } catch {} };
  const RAR = { legendary: 'text-amber-300', epic: 'text-fuchsia-300', elite: 'text-sky-300', advanced: 'text-emerald-300', normal: 'text-slate-300' };
  const SLOT_LABEL = Object.fromEntries((R.GEAR_SLOTS || []).map((s) => [s.k, s.label]));

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
  const gearOf = (set) => Object.entries(set.gear || {}).filter(([, g]) => g && g.name).map(([slot, g]) => ({ slot, item: g.item || '', name: g.name, icon: g.icon || '', rarity: g.rarity || '', tier: g.tier || 0, refine: g.refine || 0 }));
  const ownSets = () => (R.showcaseList ? R.showcaseList() : []).flatMap((sc) => (sc.sets || []).map((set, i) => ({ id: set.id || sc.id + '_' + i, name: set.name || `Set ${i + 1}`, from: sc.title, gear: gearOf(set) }))).filter((s) => s.gear.length);
  async function post() {
    const sets = ownSets().filter((s) => st.sel === 'all' || s.id === st.sel);
    if (!sets.length) { msg('Keine Ausrüstung gefunden – zuerst unter 🎨 Showcases Sets mit Gear anlegen.', 'warn'); return; }
    if (st.busy) return; st.busy = true; render();
    try {
      const row = { user_id: me(), title: (st.title || '').trim().slice(0, 100) || 'Was soll ich als Nächstes craften?', sets: sets.map((s) => ({ id: s.id, name: s.name, gear: s.gear })), status: 'open' };
      const { error } = await db().from('help_requests').insert(row); if (error) throw error;
      st.compose = false; st.title = ''; msg('✓ Anfrage gepostet', 'ok'); await load();
    } catch (e) { msg(R.tableMissing(e) ? 'Die Help-Me-Tabellen fehlen noch in Supabase (SQL im Chat).' : 'Posten fehlgeschlagen: ' + (A.germanError ? A.germanError(e) : e.message), 'err'); }
    st.busy = false; render();
  }
  async function closeReq(id, del) {
    if (!(await window.UI.confirm(del ? 'Anfrage löschen?' : 'Anfrage schließen?'))) return;
    try { const q = del ? db().from('help_requests').delete().eq('id', id) : db().from('help_requests').update({ status: 'closed' }).eq('id', id); const { error } = await q; if (error) throw error; await load(); } catch (e) { msg(e.message || String(e), 'err'); }
  }
  // ---------- Antworten ----------
  const gearKey = (si, g) => `${si}:${g.slot}`;
  function togglePick(rid, key) {
    const p = (st.pick[rid] = st.pick[rid] || []);
    const i = p.indexOf(key); if (i >= 0) p.splice(i, 1); else if (p.length < MAX) p.push(key); else { msg(`Höchstens ${MAX} Teile – eines wieder abwählen.`, 'warn'); return; }
    render();
  }
  async function send(rid) {
    const picks = st.pick[rid] || []; if (!picks.length) { msg('Erst Teile antippen (1 = zuerst craften).', 'warn'); return; }
    try {
      const { error } = await db().from('help_answers').upsert({ request_id: rid, user_id: me(), picks, note: (st.note[rid] || '').slice(0, 300), created_at: new Date().toISOString() }); if (error) throw error;
      msg('✓ Empfehlung gesendet', 'ok'); delete st.pick[rid]; await load();
    } catch (e) { msg('Senden fehlgeschlagen: ' + (A.germanError ? A.germanError(e) : e.message), 'err'); }
  }
  // Auswertung: Platz 1 = 5 Punkte … Platz 5 = 1 Punkt
  function tally(req) {
    const score = {}, votes = {};
    (st.ans[req.id] || []).forEach((a) => (a.picks || []).forEach((k, i) => { score[k] = (score[k] || 0) + (MAX - i); votes[k] = (votes[k] || 0) + 1; }));
    const items = {}; (req.sets || []).forEach((s, si) => (s.gear || []).forEach((g) => { items[gearKey(si, g)] = { ...g, set: s.name }; }));
    return Object.keys(score).map((k) => ({ key: k, score: score[k], votes: votes[k], g: items[k] })).filter((x) => x.g).sort((a, b) => b.score - a.score);
  }

  // ---------- Darstellung ----------
  const inp = 'w-full bg-ink-950 border border-ink-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-gold-500';
  const btn = (attr, lab, tone) => `<button type="button" ${attr} class="text-xs px-3 py-1.5 rounded-lg border whitespace-nowrap ${tone === 'gold' ? 'border-gold-400 bg-gold-500 text-ink-950 font-semibold hover:bg-gold-400' : tone === 'red' ? 'border-ink-600 text-slate-400 hover:border-red-400/60 hover:text-red-300' : 'border-gold-500/50 text-gold-300 hover:bg-gold-500/10'} disabled:opacity-50">${lab}</button>`;
  const u = (id) => st.users[id] || { username: '?' };
  const gearTile = (g, extra = '', cls = '') => `<div class="${cls} relative flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left min-w-0">
      ${g.icon ? `<img src="${esc(g.icon)}" alt="" class="w-10 h-10 rounded object-contain bg-ink-900 shrink-0">` : '<span class="w-10 h-10 rounded grid place-items-center bg-ink-900 shrink-0">⚒️</span>'}
      <span class="min-w-0"><span class="block text-xs font-semibold truncate ${RAR[g.rarity] || 'text-slate-100'}">${esc(g.name)}</span><span class="block text-[10px] text-slate-500 truncate">${esc(SLOT_LABEL[g.slot] || g.slot)}${g.tier ? ` · T${esc(String(g.tier))}` : ''}${g.refine ? ` · R${esc(String(g.refine))}` : ''}</span></span>${extra}</div>`;
  function reqHTML(req) {
    const own = req.user_id === me(), ans = st.ans[req.id] || [], mine = ans.find((a) => a.user_id === me()), picks = st.pick[req.id] || (mine ? mine.picks : []);
    const open = st.open === req.id, closed = req.status === 'closed', result = tally(req);
    const sets = (req.sets || []).map((s, si) => `<div><div class="text-[11px] uppercase tracking-widest text-slate-500 mb-1">${esc(s.name)}</div>
      <div class="grid gap-1.5 grid-cols-2 sm:grid-cols-4">${(s.gear || []).map((g) => { const k = gearKey(si, g), pos = picks.indexOf(k);
        const badge = pos >= 0 ? `<span class="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-gold-500 text-ink-950 text-[11px] font-bold grid place-items-center">${pos + 1}</span>` : '';
        return own || closed ? gearTile(g, '', 'border-ink-700 bg-ink-950/50') : `<button type="button" data-help-pick="${esc(req.id)}|${esc(k)}" class="contents">${gearTile(g, badge, pos >= 0 ? 'border-gold-400 bg-gold-500/10' : 'border-ink-700 bg-ink-950/50 hover:border-gold-500/60')}</button>`; }).join('')}</div></div>`).join('');
    const resultHTML = result.length ? `<div class="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3"><div class="text-[11px] uppercase tracking-widest text-emerald-300 mb-2">📊 Empfehlung der Community · ${ans.length} Antwort${ans.length === 1 ? '' : 'en'}</div>
        <div class="flex flex-col gap-1">${result.slice(0, 8).map((x, i) => `<div class="flex items-center gap-2 text-sm"><span class="w-6 text-center font-bold ${i === 0 ? 'text-gold-300' : 'text-slate-400'}">${i + 1}.</span>${x.g.icon ? `<img src="${esc(x.g.icon)}" alt="" class="w-7 h-7 rounded object-contain bg-ink-900">` : ''}<span class="min-w-0 flex-1 truncate ${RAR[x.g.rarity] || ''}">${esc(x.g.name)} <span class="text-[11px] text-slate-500">${esc(x.g.set)} · ${esc(SLOT_LABEL[x.g.slot] || x.g.slot)}</span></span><span class="text-xs text-slate-400 tabular-nums">${x.votes}× · ${x.score} P.</span></div>`).join('')}</div>
        ${ans.filter((a) => a.note).length ? `<div class="mt-2 pt-2 border-t border-ink-700/60 flex flex-col gap-1">${ans.filter((a) => a.note).map((a) => `<div class="text-xs text-slate-300"><b class="text-slate-200">${esc(u(a.user_id).username || '?')}:</b> ${esc(a.note)}</div>`).join('')}</div>` : ''}</div>` : (own ? '<p class="text-xs text-slate-500">Noch keine Antworten.</p>' : '');
    return `<article data-help-req="${esc(req.id)}" class="panel rounded-2xl p-4 sm:p-5 flex flex-col gap-3 transition-shadow ${closed ? 'opacity-70' : ''}">
      <div class="flex items-center gap-3">
        <button type="button" data-help-prof="${esc(req.user_id)}" class="flex items-center gap-2.5 min-w-0 text-left rounded-lg hover:bg-ink-800/60 pr-2">${R.userLine(u(req.user_id), 'w-10 h-10 text-base')}</button>
        <span class="ml-auto text-[11px] text-slate-500 text-right">${closed ? '✓ geschlossen · ' : ''}${R.timeAgo(req.created_at)}<span class="block">${ans.length} Antwort${ans.length === 1 ? '' : 'en'}</span></span>
        ${own ? `${closed ? '' : btn(`data-help-close="${esc(req.id)}"`, 'Schließen')}${btn(`data-help-del="${esc(req.id)}"`, '✕', 'red')}` : ''}
      </div>
      <div class="font-semibold text-slate-100">🆘 ${esc(req.title)}</div>
      ${open || own ? `<div class="flex flex-col gap-3">${sets}</div>
        ${!own && !closed ? `<div class="flex flex-wrap items-center gap-2 rounded-xl border border-gold-500/30 bg-gold-500/5 px-3 py-2">
          <span class="text-xs text-slate-300">${picks.length ? `${picks.length}/${MAX} gewählt – Reihenfolge = Priorität` : `Tippe bis zu ${MAX} Teile an (1 = zuerst craften)`}</span>
          <input type="text" maxlength="300" data-help-note="${esc(req.id)}" value="${esc(st.note[req.id] ?? (mine ? mine.note || '' : ''))}" placeholder="Kurze Begründung (optional)" class="${inp} flex-1 min-w-[12rem] !py-1.5">
          ${btn(`data-help-send="${esc(req.id)}"`, mine ? '↻ Empfehlung ändern' : '📨 Empfehlung senden', 'gold')}</div>` : ''}
        ${resultHTML}` : `<button type="button" data-help-open="${esc(req.id)}" class="text-left text-xs text-gold-300 hover:underline">${(req.sets || []).length} Set${(req.sets || []).length === 1 ? '' : 's'} · ${(req.sets || []).reduce((a, s) => a + (s.gear || []).length, 0)} Teile – ${mine ? 'deine Empfehlung ansehen / ändern' : 'ansehen und empfehlen'} ›</button>`}
    </article>`;
  }
  function composeHTML() {
    const sets = ownSets();
    return `<div class="panel rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
      <div class="flex flex-wrap items-center justify-between gap-2"><h3 class="font-display text-lg gold-text">🆘 Neue Anfrage</h3>${btn('data-help-compose="0"', 'Abbrechen', 'red')}</div>
      ${sets.length ? `<label class="text-xs text-slate-400">Welche Sets?<select data-help-sel class="mt-1 ${inp}"><option value="all" ${st.sel === 'all' ? 'selected' : ''}>Alle Sets (${sets.length})</option>${sets.map((s) => `<option value="${esc(s.id)}" ${st.sel === s.id ? 'selected' : ''}>${esc(s.name)} · ${s.gear.length} Teile (${esc(s.from)})</option>`).join('')}</select></label>
      <label class="text-xs text-slate-400">Frage (optional)<input type="text" maxlength="100" data-help-title value="${esc(st.title)}" placeholder="Was soll ich als Nächstes craften?" class="mt-1 ${inp}"></label>
      <div class="flex justify-end">${btn('data-help-post' + (st.busy ? ' disabled' : ''), '📨 Posten', 'gold')}</div>` : '<p class="text-sm text-amber-300">Noch keine Sets mit Ausrüstung – zuerst unter 🎨 Showcases eintragen.</p>'}</div>`;
  }
  function msg(t, tone) { st.msg = [t, tone]; const el = $('helpMsg'); if (!el) return; el.textContent = t; el.className = 'text-xs min-h-[1em] ' + ({ ok: 'text-emerald-400', warn: 'text-amber-300', err: 'text-red-300' }[tone] || 'text-slate-500'); }
  function render() {
    if (!root) return;
    root.innerHTML = `<div class="flex flex-wrap items-end justify-between gap-3">
        <div><h2 class="font-display text-2xl gold-text">🆘 Help Me</h2><p class="text-xs text-slate-500">Zeig dein Set – die Community sagt dir, was du zuerst craften solltest</p></div>
        <div class="flex gap-2">${btn('data-help-reload', '↻')}${st.compose ? '' : btn('data-help-compose="1"', '➕ Anfrage stellen', 'gold')}</div></div>
      <div id="helpMsg" class="text-xs min-h-[1em]"></div>
      ${st.compose ? composeHTML() : ''}
      ${st.noTable ? '<div class="panel rounded-2xl p-5 text-sm text-amber-300">⚠ Die Help-Me-Tabellen fehlen noch in Supabase. Bitte das SQL aus dem Chat ausführen.</div>' : ''}
      ${st.err ? `<div class="panel rounded-2xl p-5 text-sm text-red-300">⚠ ${esc(st.err)}</div>` : ''}
      ${!st.loaded || st.loading ? '<p class="text-sm text-slate-500 text-center py-6">⏳ Wird geladen …</p>' : ''}
      <div class="grid gap-4 lg:grid-cols-2 items-start">${st.reqs.map(reqHTML).join('')}</div>
      ${st.loaded && !st.loading && !st.reqs.length && !st.noTable ? '<p class="text-sm text-slate-500 text-center py-6">Noch keine Anfragen.</p>' : ''}`;
    msg(st.msg[0], st.msg[1]);
  }
  root.addEventListener('input', (ev) => { const el = ev.target; if (el.dataset.helpNote) st.note[el.dataset.helpNote] = el.value; if (el.hasAttribute('data-help-title')) st.title = el.value; if (el.hasAttribute('data-help-sel')) st.sel = el.value; });
  root.addEventListener('click', (ev) => {
    const t = ev.target, c = (a) => t.closest(`[${a}]`); let b;
    if ((b = c('data-help-compose'))) { st.compose = b.dataset.helpCompose === '1'; render(); }
    else if (c('data-help-post')) post();
    else if (c('data-help-reload')) load();
    else if ((b = c('data-help-open'))) { st.open = b.dataset.helpOpen; render(); }
    else if ((b = c('data-help-pick'))) { const [rid, key] = b.dataset.helpPick.split('|'); if (!st.pick[rid]) { const mine = (st.ans[rid] || []).find((a) => a.user_id === me()); st.pick[rid] = mine ? [...(mine.picks || [])] : []; } togglePick(rid, key); }
    else if ((b = c('data-help-send'))) send(b.dataset.helpSend);
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
