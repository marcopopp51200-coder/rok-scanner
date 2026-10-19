// Wiz fan Club – My Kingdom (Reiter oben über Feed / Rangliste / Craft)
// Der R5 gründet das Königreich und lädt Mitglieder über ihre Governor-ID ein – nur Mitglieder sehen es.
// Inhalt: KD-Name & Mitglieder (R5–R1), Königreich-Feed, Ereignisse mit Timer, KvK-Planung, Autarch-Liste.
// Läuft innerhalb von RokApp (scanner.js); R = geteilter Kontext (window.Rok).
// Supabase: kingdoms · kingdom_members (rank 1–5, status invited|member) · kingdom_posts · kingdom_events (kind event|kvk) · kingdom_autarchs
window.RokMods = window.RokMods || {};
window.RokMods.kingdom = (R) => {
  const $ = R.$, esc = R.esc, A = window.RokAuth, root = $('kingdomView');
  const db = () => A.db(), me = () => A.userId();
  const RANK = { 5: ['👑', 'R5 – König'], 4: ['⚜️', 'R4 – Offizier'], 3: ['🛡️', 'R3'], 2: ['⚔️', 'R2'], 1: ['🏹', 'R1'] };
  const st = { loaded: false, loading: false, err: '', noTable: false, kd: null, mem: [], invites: [], posts: [], events: [], autarchs: [], users: {}, tab: 'members', search: [], q: '', busy: false, msg: ['', ''], cre: { name: '', number: '' }, evForm: { title: '', at: '', kind: 'event', note: '' }, auForm: { name: '', gid: '', kvk: '', note: '' } };
  const myRow = () => st.mem.find((m) => m.user_id === me());
  const myRank = () => (myRow() ? +myRow().rank || 1 : 0);
  const canManage = () => myRank() >= 4;
  const isOwner = () => st.kd && st.kd.owner === me();

  // ---------- Laden ----------
  async function load() {
    if (st.loading) return; st.loading = true; st.err = ''; render();
    try {
      const mine = await db().from('kingdom_members').select('*').eq('user_id', me());
      if (mine.error) throw mine.error;
      const rows = mine.data || [];
      st.invites = rows.filter((r) => r.status === 'invited');
      const active = rows.find((r) => r.status === 'member');
      st.kd = null; st.mem = []; st.posts = []; st.events = []; st.autarchs = [];
      const kdIds = [...new Set(rows.map((r) => r.kingdom_id))];
      const kds = kdIds.length ? await db().from('kingdoms').select('*').in('id', kdIds) : { data: [] };
      st.kdById = Object.fromEntries((kds.data || []).map((k) => [k.id, k]));
      if (active) {
        st.kd = st.kdById[active.kingdom_id] || { id: active.kingdom_id, name: '?', number: '' };
        const [m, p, e, a] = await Promise.all([
          db().from('kingdom_members').select('*').eq('kingdom_id', st.kd.id),
          db().from('kingdom_posts').select('*').eq('kingdom_id', st.kd.id).order('created_at', { ascending: false }).limit(50),
          db().from('kingdom_events').select('*').eq('kingdom_id', st.kd.id).order('starts_at', { ascending: true }).limit(100),
          db().from('kingdom_autarchs').select('*').eq('kingdom_id', st.kd.id).order('created_at', { ascending: false }).limit(100)]);
        st.mem = (m.data || []).filter((x) => x.status === 'member').sort((x, y) => (+y.rank || 0) - (+x.rank || 0));
        st.pending = (m.data || []).filter((x) => x.status === 'invited');
        st.posts = p.data || []; st.events = e.data || []; st.autarchs = a.data || [];
      }
      const ids = [...st.mem.map((x) => x.user_id), ...(st.pending || []).map((x) => x.user_id), ...st.posts.map((x) => x.user_id), ...st.invites.map((x) => x.invited_by), ...Object.values(st.kdById).map((k) => k.owner)];
      st.users = await R.users(ids);
      st.noTable = false;
    } catch (e) { if (R.tableMissing(e)) st.noTable = true; else st.err = A.germanError ? A.germanError(e) : String(e.message || e); }
    st.loading = false; st.loaded = true;
    R.setBadge('[data-kd-badge]', st.invites.length);
    render();
  }
  // Einladungs-Badge auch ohne geöffnete Seite (einmal beim Start, dann alle 5 Minuten)
  async function pollInvites() { try { const r = await db().from('kingdom_members').select('kingdom_id').eq('user_id', me()).eq('status', 'invited'); if (!r.error) R.setBadge('[data-kd-badge]', (r.data || []).length); } catch {} }
  setTimeout(pollInvites, 1500); setInterval(pollInvites, 5 * 60000);

  // ---------- Aktionen ----------
  const fail = (e, what) => msg(`${what} fehlgeschlagen: ${R.tableMissing(e) ? 'Tabellen fehlen in Supabase (SQL im Chat)' : (A.germanError ? A.germanError(e) : e.message || e)}`, 'err');
  async function create() {
    const name = st.cre.name.trim(), number = st.cre.number.replace(/\D/g, '');
    if (!name) { msg('Bitte einen Namen eingeben.', 'warn'); return; }
    if (st.busy) return; st.busy = true; render();
    try {
      const { data: kd, error } = await db().from('kingdoms').insert({ name: name.slice(0, 40), number, owner: me() }).select().single();
      if (error) throw error;
      const m = await db().from('kingdom_members').insert({ kingdom_id: kd.id, user_id: me(), rank: 5, status: 'member', invited_by: me() });
      if (m.error) throw m.error;
      msg('✓ Königreich gegründet – du bist R5', 'ok'); st.cre = { name: '', number: '' };
      await load();
    } catch (e) { fail(e, 'Gründen'); }
    st.busy = false; render();
  }
  async function answerInvite(kid, accept) {
    try {
      if (accept) {
        if (myRow()) { msg('Du bist schon in einem Königreich – erst dort austreten.', 'warn'); return; }
        const { error } = await db().from('kingdom_members').update({ status: 'member' }).eq('kingdom_id', kid).eq('user_id', me()); if (error) throw error;
      } else { const { error } = await db().from('kingdom_members').delete().eq('kingdom_id', kid).eq('user_id', me()); if (error) throw error; }
      await load();
    } catch (e) { fail(e, 'Antwort'); }
  }
  async function search() {
    const q = st.q.trim(); st.search = [];
    if (!q) { render(); return; }
    try { st.search = /^\d{5,}$/.test(q) ? await A.kvkFindId(q) : (await A.loadLeaderboard().catch(() => [])).filter((u) => u.user_id !== me() && String(u.username || '').toLowerCase().includes(q.toLowerCase())).slice(0, 8); }
    catch (e) { fail(e, 'Suche'); }
    render();
  }
  async function invite(uid) {
    if (!canManage() || !st.kd) return;
    try {
      const { error } = await db().from('kingdom_members').upsert({ kingdom_id: st.kd.id, user_id: uid, rank: 1, status: 'invited', invited_by: me() }); if (error) throw error;
      msg('✓ Einladung gesendet', 'ok'); st.q = ''; st.search = []; await load();
    } catch (e) { fail(e, 'Einladen'); }
  }
  async function setRank(uid, rank) {
    if (!canManage()) return;
    try { const { error } = await db().from('kingdom_members').update({ rank }).eq('kingdom_id', st.kd.id).eq('user_id', uid); if (error) throw error; await load(); } catch (e) { fail(e, 'Rang ändern'); }
  }
  async function kick(uid) {
    if (!canManage()) return;
    if (!(await window.UI.confirm(uid === me() ? 'Königreich verlassen?' : 'Mitglied entfernen?'))) return;
    try { const { error } = await db().from('kingdom_members').delete().eq('kingdom_id', st.kd.id).eq('user_id', uid); if (error) throw error; await load(); } catch (e) { fail(e, 'Entfernen'); }
  }
  async function leave() {
    if (isOwner()) { msg('Als R5 kannst du nicht austreten – gib den Rang 5 erst an jemand anderen (Rang ändern) oder lösche das Königreich.', 'warn'); return; }
    if (!(await window.UI.confirm('Königreich verlassen?'))) return;
    try { const { error } = await db().from('kingdom_members').delete().eq('kingdom_id', st.kd.id).eq('user_id', me()); if (error) throw error; await load(); } catch (e) { fail(e, 'Verlassen'); }
  }
  async function deleteKd() {
    if (!isOwner()) return;
    if (!(await window.UI.confirm(`Königreich „${st.kd.name}“ mit allen Mitgliedern, Beiträgen und Ereignissen löschen?`))) return;
    try { const { error } = await db().from('kingdoms').delete().eq('id', st.kd.id); if (error) throw error; await load(); } catch (e) { fail(e, 'Löschen'); }
  }
  async function postKd() {
    const body = ($('kdPostText')?.value || '').trim(); if (!body) return;
    try { const { error } = await db().from('kingdom_posts').insert({ kingdom_id: st.kd.id, user_id: me(), body: body.slice(0, 1000) }); if (error) throw error; await load(); } catch (e) { fail(e, 'Posten'); }
  }
  async function delPost(id) { try { const { error } = await db().from('kingdom_posts').delete().eq('id', id); if (error) throw error; st.posts = st.posts.filter((p) => p.id !== id); render(); } catch (e) { fail(e, 'Löschen'); } }
  async function addEvent() {
    const f = st.evForm, ts = f.at ? new Date(f.at) : null;
    if (!f.title.trim() || !ts || isNaN(ts)) { msg('Titel und Datum/Uhrzeit angeben.', 'warn'); return; }
    try { const { error } = await db().from('kingdom_events').insert({ kingdom_id: st.kd.id, user_id: me(), title: f.title.trim().slice(0, 80), kind: f.kind === 'kvk' ? 'kvk' : 'event', starts_at: ts.toISOString(), note: (f.note || '').slice(0, 300) }); if (error) throw error;
      st.evForm = { title: '', at: '', kind: f.kind, note: '' }; msg('✓ Ereignis angelegt', 'ok'); await load(); } catch (e) { fail(e, 'Anlegen'); }
  }
  async function delEvent(id) { try { const { error } = await db().from('kingdom_events').delete().eq('id', id); if (error) throw error; st.events = st.events.filter((x) => x.id !== id); render(); } catch (e) { fail(e, 'Löschen'); } }
  async function addAutarch() {
    const f = st.auForm; if (!f.name.trim()) { msg('Name angeben.', 'warn'); return; }
    try { const { error } = await db().from('kingdom_autarchs').insert({ kingdom_id: st.kd.id, user_id: me(), name: f.name.trim().slice(0, 40), governor_id: f.gid.replace(/\D/g, '').slice(0, 12) || null, kvk: (f.kvk || '').slice(0, 40), note: (f.note || '').slice(0, 200) }); if (error) throw error;
      st.auForm = { name: '', gid: '', kvk: '', note: '' }; await load(); } catch (e) { fail(e, 'Hinzufügen'); }
  }
  async function delAutarch(id) { try { const { error } = await db().from('kingdom_autarchs').delete().eq('id', id); if (error) throw error; st.autarchs = st.autarchs.filter((x) => x.id !== id); render(); } catch (e) { fail(e, 'Löschen'); } }

  // ---------- Timer ----------
  const cd = (ts) => { let d = Math.round((new Date(ts).getTime() - Date.now()) / 1000); const past = d < 0; d = Math.abs(d);
    const D = Math.floor(d / 86400), H = Math.floor(d % 86400 / 3600), M = Math.floor(d % 3600 / 60), S = d % 60;
    const txt = D > 0 ? `${D} T ${H} h` : H > 0 ? `${H} h ${M} min` : `${M}:${String(S).padStart(2, '0')}`; return past ? `vor ${txt}` : `in ${txt}`; };
  setInterval(() => { root.querySelectorAll('[data-kd-cd]').forEach((el) => { el.textContent = cd(el.dataset.kdCd); }); }, 1000);
  const when = (ts) => new Date(ts).toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  // ---------- Darstellung ----------
  const inp = 'w-full bg-ink-950 border border-ink-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-gold-500';
  const btn = (attr, lab, tone) => `<button type="button" ${attr} class="text-xs px-3 py-1.5 rounded-lg border whitespace-nowrap ${tone === 'gold' ? 'border-gold-400 bg-gold-500 text-ink-950 font-semibold hover:bg-gold-400' : tone === 'red' ? 'border-ink-600 text-slate-400 hover:border-red-400/60 hover:text-red-300' : 'border-gold-500/50 text-gold-300 hover:bg-gold-500/10'}">${lab}</button>`;
  const card = (title, body, extra = '') => `<div class="panel rounded-2xl p-4 sm:p-5 flex flex-col gap-3"><div class="flex flex-wrap items-center justify-between gap-2"><h3 class="font-display text-lg gold-text">${title}</h3>${extra}</div>${body}</div>`;
  const u = (id) => st.users[id] || { username: '?' };
  function noKdHTML() {
    return `${st.invites.length ? card('📨 Einladungen', st.invites.map((i) => { const k = st.kdById[i.kingdom_id] || {}; return `<div class="flex flex-wrap items-center gap-3 rounded-xl border border-gold-500/40 bg-gold-500/5 px-3 py-2">
        <span class="min-w-0 flex-1"><b class="text-slate-100">🏰 ${esc(k.name || '?')}${k.number ? ` #${esc(k.number)}` : ''}</b><span class="block text-xs text-slate-400">eingeladen von ${esc(u(i.invited_by).username || '?')}</span></span>
        ${btn(`data-kd-inv="${esc(i.kingdom_id)}|1"`, '✓ Annehmen', 'gold')}${btn(`data-kd-inv="${esc(i.kingdom_id)}|0"`, 'Ablehnen', 'red')}</div>`; }).join('')) : ''}
      ${card('🏰 Königreich gründen', `<p class="text-xs text-slate-500">Du wirst R5 und kannst Mitglieder über ihre Governor-ID einladen. Nur Mitglieder sehen das Königreich.</p>
        <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto] items-end">
          <label class="text-xs text-slate-400">Name<input type="text" maxlength="40" data-kd-cre="name" value="${esc(st.cre.name)}" placeholder="z. B. Saints of 79" class="mt-1 ${inp}"></label>
          <label class="text-xs text-slate-400">Königreich-Nr.<input type="text" inputmode="numeric" maxlength="5" data-kd-cre="number" value="${esc(st.cre.number)}" placeholder="1079" class="mt-1 ${inp}"></label>
          ${btn('data-kd-create' + (st.busy ? ' disabled' : ''), '👑 Gründen', 'gold')}
        </div>`)}
      <p class="text-xs text-slate-500">Wenn dein R5 schon ein Königreich angelegt hat: Er muss dich über deine Governor-ID einladen – die Einladung erscheint dann hier.</p>`;
  }
  function membersHTML() {
    const groups = [5, 4, 3, 2, 1].map((r) => ({ r, list: st.mem.filter((m) => (+m.rank || 1) === r) })).filter((g) => g.list.length);
    const row = (m) => { const x = u(m.user_id), own = m.user_id === me(); return `<div class="flex items-center gap-3 py-2 border-b border-ink-700/60 last:border-0">
        <button type="button" data-kd-prof="${esc(m.user_id)}" class="flex items-center gap-2.5 min-w-0 flex-1 text-left rounded-lg hover:bg-ink-800/60 pr-2">${R.userLine(x)}${x.governor_id ? `<span class="ml-auto text-[11px] text-slate-500 tabular-nums">ID ${esc(x.governor_id)}</span>` : ''}</button>
        ${canManage() && !(st.kd.owner === m.user_id && !isOwner()) ? `<select data-kd-rank="${esc(m.user_id)}" class="bg-ink-950 border border-ink-600 rounded-lg px-2 py-1 text-xs">${[5, 4, 3, 2, 1].filter((r) => isOwner() || r < 5).map((r) => `<option value="${r}" ${(+m.rank || 1) === r ? 'selected' : ''}>${RANK[r][0]} R${r}</option>`).join('')}</select>
        ${!own ? btn(`data-kd-kick="${esc(m.user_id)}"`, '✕', 'red') : ''}` : ''}</div>`; };
    return `${groups.map((g) => `<div><div class="text-[11px] uppercase tracking-widest text-slate-500 mt-2 mb-1">${RANK[g.r][0]} ${RANK[g.r][1]} · ${g.list.length}</div>${g.list.map(row).join('')}</div>`).join('')}
      ${(st.pending || []).length ? `<div class="text-[11px] uppercase tracking-widest text-slate-500 mt-3 mb-1">⏳ Eingeladen · ${st.pending.length}</div>${st.pending.map((m) => `<div class="flex items-center gap-3 py-1.5 text-sm text-slate-400">${R.userLine(u(m.user_id))}${canManage() ? `<span class="ml-auto">${btn(`data-kd-kick="${esc(m.user_id)}"`, 'Zurückziehen', 'red')}</span>` : ''}</div>`).join('')}` : ''}
      ${canManage() ? `<div class="mt-3 pt-3 border-t border-ink-700"><div class="text-xs text-slate-400 mb-1.5">➕ Einladen – Governor-ID oder Name</div>
        <div class="flex gap-2"><input type="text" data-kd-q value="${esc(st.q)}" placeholder="z. B. 148759624" class="${inp}">${btn('data-kd-search', '🔍 Suchen')}</div>
        ${st.search.length ? `<div class="mt-2 flex flex-col">${st.search.map((x) => `<div class="flex items-center gap-3 py-1.5 border-b border-ink-700/60 last:border-0">${R.userLine(x)}<span class="ml-auto">${st.mem.some((m) => m.user_id === x.user_id) || (st.pending || []).some((m) => m.user_id === x.user_id) ? '<span class="text-xs text-slate-500">schon dabei</span>' : btn(`data-kd-invite="${esc(x.user_id)}"`, '📨 Einladen', 'gold')}</span></div>`).join('')}</div>` : st.q ? '<p class="mt-2 text-xs text-slate-500">Niemand gefunden – der Spieler muss sich hier angemeldet und seine Governor-ID im Profil eingetragen haben.</p>' : ''}</div>` : ''}`;
  }
  function feedHTML() {
    return `<div class="flex gap-2"><input id="kdPostText" type="text" maxlength="1000" placeholder="Nachricht ans Königreich …" class="${inp}">${btn('data-kd-post', 'Senden', 'gold')}</div>
      <div class="flex flex-col">${st.posts.length ? st.posts.map((p) => `<div class="flex items-start gap-3 py-2.5 border-b border-ink-700/60 last:border-0">${R.avatarHtml(u(p.user_id).username, u(p.user_id).avatar)}
        <div class="min-w-0 flex-1"><div class="text-xs text-slate-400"><b class="text-slate-200">${esc(u(p.user_id).username || '?')}</b> · ${R.timeAgo(p.created_at)}</div><div class="text-sm text-slate-100 whitespace-pre-wrap break-words">${esc(p.body)}</div></div>
        ${p.user_id === me() || canManage() ? btn(`data-kd-delpost="${esc(p.id)}"`, '✕', 'red') : ''}</div>`).join('') : '<p class="text-sm text-slate-500 py-4 text-center">Noch keine Beiträge.</p>'}</div>`;
  }
  function eventsHTML(kind) {
    const list = st.events.filter((e) => (e.kind === 'kvk') === (kind === 'kvk')), now = Date.now();
    const f = st.evForm;
    const row = (e) => { const past = new Date(e.starts_at).getTime() < now; return `<div class="flex flex-wrap items-center gap-3 rounded-xl border ${past ? 'border-ink-700 opacity-60' : kind === 'kvk' ? 'border-red-400/40 bg-red-500/5' : 'border-gold-500/30 bg-ink-950/50'} px-3 py-2">
        <div class="min-w-0 flex-1"><div class="font-semibold text-slate-100 ${past ? 'line-through' : ''}">${kind === 'kvk' ? '⚔️' : '📅'} ${esc(e.title)}</div><div class="text-xs text-slate-400">${when(e.starts_at)}${e.note ? ` · ${esc(e.note)}` : ''} · <span class="text-slate-500">von ${esc(u(e.user_id).username || '?')}</span></div></div>
        <div data-kd-cd="${esc(e.starts_at)}" class="font-mono tabular-nums text-sm font-bold ${past ? 'text-slate-500' : kind === 'kvk' ? 'text-red-300' : 'text-gold-300'}">${cd(e.starts_at)}</div>
        ${e.user_id === me() || canManage() ? btn(`data-kd-delev="${esc(e.id)}"`, '✕', 'red') : ''}</div>`; };
    return `<div class="flex flex-col gap-2">${list.length ? list.map(row).join('') : `<p class="text-sm text-slate-500 py-3 text-center">Noch nichts geplant.</p>`}</div>
      ${canManage() ? `<div class="mt-2 pt-3 border-t border-ink-700 grid gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-end">
        <label class="text-xs text-slate-400">Titel<input type="text" maxlength="80" data-kd-ev="title" value="${esc(f.title)}" placeholder="${kind === 'kvk' ? 'z. B. Pass 4 Rally' : 'z. B. MGE Sammeln'}" class="mt-1 ${inp}"></label>
        <label class="text-xs text-slate-400">Datum & Uhrzeit<input type="datetime-local" data-kd-ev="at" value="${esc(f.at)}" class="mt-1 ${inp} [color-scheme:dark]"></label>
        <label class="text-xs text-slate-400">Notiz<input type="text" maxlength="300" data-kd-ev="note" value="${esc(f.note)}" class="mt-1 ${inp}"></label>
        ${btn(`data-kd-addev="${kind}"`, '➕ Planen', 'gold')}</div>` : '<p class="text-[11px] text-slate-500">Planen können R4 und R5.</p>'}`;
  }
  function autarchHTML() {
    const f = st.auForm;
    return `<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-[10px] uppercase tracking-widest text-slate-500"><th class="text-left py-1 pr-2 font-medium">Autarch</th><th class="text-left py-1 px-2 font-medium">Governor-ID</th><th class="text-left py-1 px-2 font-medium">KvK / Season</th><th class="text-left py-1 px-2 font-medium">Notiz</th><th></th></tr></thead>
      <tbody>${st.autarchs.length ? st.autarchs.map((a) => `<tr class="border-t border-ink-700/60"><td class="py-1.5 pr-2 font-semibold text-gold-300">👑 ${esc(a.name)}</td><td class="py-1.5 px-2 tabular-nums text-slate-300">${esc(a.governor_id || '–')}</td><td class="py-1.5 px-2 text-slate-300">${esc(a.kvk || '–')}</td><td class="py-1.5 px-2 text-slate-400">${esc(a.note || '')}</td><td class="py-1.5 pl-2 text-right">${canManage() ? btn(`data-kd-delau="${esc(a.id)}"`, '✕', 'red') : ''}</td></tr>`).join('') : '<tr><td colspan="5" class="py-4 text-center text-slate-500">Noch keine Einträge.</td></tr>'}</tbody></table></div>
      ${canManage() ? `<div class="mt-2 pt-3 border-t border-ink-700 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,.8fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-end">
        <label class="text-xs text-slate-400">Name<input type="text" maxlength="40" data-kd-au="name" value="${esc(f.name)}" class="mt-1 ${inp}"></label>
        <label class="text-xs text-slate-400">Governor-ID<input type="text" inputmode="numeric" data-kd-au="gid" value="${esc(f.gid)}" class="mt-1 ${inp}"></label>
        <label class="text-xs text-slate-400">KvK / Season<input type="text" maxlength="40" data-kd-au="kvk" value="${esc(f.kvk)}" placeholder="z. B. Heroic Anthem 2026" class="mt-1 ${inp}"></label>
        <label class="text-xs text-slate-400">Notiz<input type="text" maxlength="200" data-kd-au="note" value="${esc(f.note)}" class="mt-1 ${inp}"></label>
        ${btn('data-kd-addau', '➕ Eintragen', 'gold')}</div>` : ''}`;
  }
  function kdHTML() {
    const k = st.kd, tabs = [['members', `👥 Mitglieder · ${st.mem.length}`], ['feed', '💬 Feed'], ['events', '📅 Ereignisse'], ['kvk', '⚔️ KvK-Planung'], ['autarch', '👑 Autarchen']];
    const next = st.events.filter((e) => new Date(e.starts_at).getTime() > Date.now()).sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))[0];
    return `<div class="panel rounded-2xl p-4 sm:p-5 flex flex-wrap items-center gap-4">
        <div class="w-16 h-16 rounded-2xl grid place-items-center text-3xl bg-gradient-to-br from-gold-300 to-gold-600 text-ink-950 shadow-[0_0_20px_rgba(245,197,66,.35)]">🏰</div>
        <div class="min-w-0 flex-1"><div class="font-display text-2xl gold-text truncate">${esc(k.name)}${k.number ? ` <span class="text-slate-400 text-lg">#${esc(k.number)}</span>` : ''}</div>
          <div class="text-xs text-slate-400">${st.mem.length} Mitglieder · R5: <b class="text-slate-200">${esc(u(k.owner).username || '?')}</b> · du bist ${RANK[myRank()] ? RANK[myRank()][0] + ' R' + myRank() : '–'}</div>
          ${next ? `<div class="mt-1 text-xs"><span class="text-slate-500">Nächstes:</span> <b class="text-gold-300">${next.kind === 'kvk' ? '⚔️' : '📅'} ${esc(next.title)}</b> · ${when(next.starts_at)} · <span data-kd-cd="${esc(next.starts_at)}" class="font-mono text-gold-200">${cd(next.starts_at)}</span></div>` : ''}</div>
        <div class="flex flex-wrap gap-2">${btn('data-kd-reload', '↻')}${isOwner() ? btn('data-kd-delete', '🗑 Löschen', 'red') : btn('data-kd-leave', 'Verlassen', 'red')}</div>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-1 p-1 rounded-xl bg-ink-950 border border-ink-700" role="tablist">${tabs.map(([k0, l]) => `<button type="button" data-kd-tab="${k0}" aria-pressed="${st.tab === k0}" class="seg-btn rounded-lg px-2 py-2 text-xs sm:text-sm font-semibold border border-ink-600 transition">${l}</button>`).join('')}</div>
      ${st.tab === 'members' ? card('👥 Mitglieder', membersHTML()) : st.tab === 'feed' ? card('💬 Königreich-Feed', feedHTML()) : st.tab === 'events' ? card('📅 Ereignisse', eventsHTML('event')) : st.tab === 'kvk' ? card('⚔️ KvK-Planung', eventsHTML('kvk')) : card('👑 Autarch-Liste', autarchHTML())}`;
  }
  function msg(t, tone) { st.msg = [t, tone]; const el = $('kdMsg'); if (!el) return; el.textContent = t; el.className = 'text-xs min-h-[1em] ' + ({ ok: 'text-emerald-400', warn: 'text-amber-300', err: 'text-red-300', busy: 'text-slate-300' }[tone] || 'text-slate-500'); }
  function render() {
    if (!root) return;
    const keep = {}; root.querySelectorAll('[data-kd-cre],[data-kd-ev],[data-kd-au],[data-kd-q],#kdPostText').forEach((el) => { keep[el.id || el.dataset.kdCre || el.dataset.kdEv || el.dataset.kdAu || 'q'] = el.value; });
    root.innerHTML = `<div class="flex flex-wrap items-end justify-between gap-3"><div><h2 class="font-display text-2xl gold-text">🏰 My Kingdom</h2><p class="text-xs text-slate-500">Nur für Mitglieder deines Königreichs sichtbar</p></div></div>
      <div id="kdMsg" class="text-xs min-h-[1em]"></div>
      ${st.noTable ? `<div class="panel rounded-2xl p-5 text-sm text-amber-300">⚠ Die Königreich-Tabellen fehlen noch in Supabase. Bitte das SQL aus dem Chat ausführen.</div>` : ''}
      ${st.err ? `<div class="panel rounded-2xl p-5 text-sm text-red-300">⚠ ${esc(st.err)}</div>` : ''}
      ${!st.loaded ? '<p class="text-sm text-slate-500 text-center py-6">⏳ Wird geladen …</p>' : st.kd ? kdHTML() : noKdHTML()}`;
    if (keep.q != null) { const q = root.querySelector('[data-kd-q]'); if (q) q.value = keep.q; }
    if (keep.kdPostText != null && $('kdPostText')) $('kdPostText').value = keep.kdPostText;
    msg(st.msg[0], st.msg[1]);
  }
  root.addEventListener('input', (ev) => { const el = ev.target;
    if (el.dataset.kdCre) st.cre[el.dataset.kdCre] = el.value;
    if (el.dataset.kdEv) st.evForm[el.dataset.kdEv] = el.value;
    if (el.dataset.kdAu) st.auForm[el.dataset.kdAu] = el.value;
    if (el.hasAttribute('data-kd-q')) st.q = el.value; });
  root.addEventListener('change', (ev) => { const el = ev.target; if (el.dataset.kdRank) setRank(el.dataset.kdRank, +el.value); });
  root.addEventListener('keydown', (ev) => { if (ev.key !== 'Enter') return; const el = ev.target; if (el.hasAttribute('data-kd-q')) { ev.preventDefault(); search(); } if (el.id === 'kdPostText') { ev.preventDefault(); postKd(); } });
  root.addEventListener('click', (ev) => {
    const t = ev.target, c = (a) => t.closest(`[${a}]`);
    let b;
    if (c('data-kd-create')) create();
    else if ((b = c('data-kd-inv'))) { const [kid, ok] = b.dataset.kdInv.split('|'); answerInvite(kid, ok === '1'); }
    else if ((b = c('data-kd-tab'))) { st.tab = b.dataset.kdTab; render(); }
    else if (c('data-kd-reload')) load();
    else if (c('data-kd-delete')) deleteKd();
    else if (c('data-kd-leave')) leave();
    else if (c('data-kd-search')) search();
    else if ((b = c('data-kd-invite'))) invite(b.dataset.kdInvite);
    else if ((b = c('data-kd-kick'))) kick(b.dataset.kdKick);
    else if ((b = c('data-kd-prof'))) R.openProfile(b.dataset.kdProf);
    else if (c('data-kd-post')) postKd();
    else if ((b = c('data-kd-delpost'))) delPost(b.dataset.kdDelpost);
    else if ((b = c('data-kd-addev'))) { st.evForm.kind = b.dataset.kdAddev; addEvent(); }
    else if ((b = c('data-kd-delev'))) delEvent(b.dataset.kdDelev);
    else if (c('data-kd-addau')) addAutarch();
    else if ((b = c('data-kd-delau'))) delAutarch(b.dataset.kdDelau);
  });
  R.viewHooks.kingdom = () => { if (!st.loaded && !st.loading) load(); else render(); };
};
