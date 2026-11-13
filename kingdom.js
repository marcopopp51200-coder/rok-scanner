// Wiz fan Club – My Kingdom (Reiter oben über Feed / Rangliste / Craft)
// Der R5 gründet das Königreich und lädt Mitglieder über ihre Governor-ID ein – nur Mitglieder sehen es.
// Beitreten: Spieler sucht sein Königreich (Nummer) und fragt mit seiner Governor-ID an → R4/R5 prüft die ID (Abgleich mit dem Top-300-Scan) und bestätigt.
// Inhalt: KD-Name & Mitglieder (R5–R1), Königreich-Feed, Ereignisse mit Timer, KvK-Planung, Autarch-Liste, Top 300 (RokTracker-Scans).
// Läuft innerhalb von RokApp (scanner.js); R = geteilter Kontext (window.Rok).
// Supabase: kingdoms · kingdom_members (rank 1–5, status invited|member) · kingdom_posts · kingdom_events (kind event|kvk) · kingdom_autarchs · kingdom_scans
window.RokMods = window.RokMods || {};
window.RokMods.kingdom = (R) => {
  const $ = R.$, esc = R.esc, A = window.RokAuth, root = $('kingdomView');
  const db = () => A.db(), me = () => A.userId();
  const RANK = { 5: ['👑', 'R5 – König'], 4: ['⚜️', 'R4 – Offizier'], 3: ['🛡️', 'R3'], 2: ['⚔️', 'R2'], 1: ['🏹', 'R1'] };
  const st = { loaded: false, loading: false, err: '', noTable: false, kd: null, mem: [], invites: [], posts: [], events: [], autarchs: [], users: {}, tab: 'members', search: [], q: '', busy: false, msg: ['', ''], cre: { name: '', number: '' }, join: { q: '', res: [], searched: false, busy: false }, admin: false, area: 'off', myReqs: [], requests: [], verify: null, evForm: { title: '', at: '', kind: 'event', note: '' }, auForm: { name: '', gid: '', kvk: '', note: '' } };
  const myRow = () => st.mem.find((m) => m.user_id === me());
  const myRank = () => (myRow() ? (st.kd && st.kd.owner === me() ? 5 : +myRow().rank || 1) : 0);   // Gründer bleibt immer R5
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
      st.myReqs = rows.filter((r) => r.status === 'requested');
      const active = rows.find((r) => r.status === 'member');
      st.kd = null; st.mem = []; st.requests = []; st.posts = []; st.events = []; st.autarchs = [];
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
        st.requests = (m.data || []).filter((x) => x.status === 'requested');
        st.verify = null;
        if (st.requests.length && canManage()) {   // ID-Abgleich: neuester Top-300-Scan
          try { const v = await db().from('kingdom_scans').select('scanned_at,data').eq('kingdom_id', st.kd.id).order('scanned_at', { ascending: false }).limit(1);
            const sc0 = !v.error && v.data && v.data[0]; if (sc0) st.verify = { date: sc0.scanned_at, by: new Map((sc0.data || []).map((r) => [String(r.id), r])) }; } catch {}
        }
        st.posts = p.data || []; st.events = e.data || []; st.autarchs = a.data || [];
      }
      const ids = [...st.mem.map((x) => x.user_id), ...(st.pending || []).map((x) => x.user_id), ...st.posts.map((x) => x.user_id), ...st.invites.map((x) => x.invited_by), ...st.requests.map((x) => x.user_id), ...Object.values(st.kdById).map((k) => k.owner)];
      st.users = await R.users(ids);
      st.noTable = false;
    } catch (e) { if (R.tableMissing(e)) st.noTable = true; else st.err = A.germanError ? A.germanError(e) : String(e.message || e); }
    st.loading = false; st.loaded = true;
    R.setBadge('[data-kd-badge]', st.invites.length + (canManage() ? st.requests.length : 0));
    render();
    if (st.kd && st.tab === 'scan') { st.sc.loaded = false; loadScans(); }
    if (st.kd && st.tab === 'fights') { st.fi.loaded = false; loadFights(); }
  }
  // Einladungs-Badge auch ohne geöffnete Seite (einmal beim Start, dann alle 5 Minuten)
  async function pollInvites() { try { const r = await db().from('kingdom_members').select('kingdom_id').eq('user_id', me()).eq('status', 'invited'); if (!r.error) R.setBadge('[data-kd-badge]', (r.data || []).length + (st.kd && canManage() ? st.requests.length : 0)); } catch {} }
  setTimeout(pollInvites, 1500); setInterval(pollInvites, 5 * 60000);

  // ---------- Aktionen ----------
  const fail = (e, what) => msg(`${what} fehlgeschlagen: ${R.tableMissing(e) ? 'Tabellen fehlen in Supabase (SQL im Chat)' : (A.germanError ? A.germanError(e) : e.message || e)}`, 'err');
  async function create() {
    if (!st.admin) { msg('Königreiche kann nur ein Admin anlegen.', 'warn'); return; }
    const name = st.cre.name.trim(), number = st.cre.number.replace(/\D/g, '');
    if (!name) { msg('Bitte einen Namen eingeben.', 'warn'); return; }
    if (st.busy) return;
    if (number) { try { const ex = await db().rpc('kd_search', { num: number }); if (!ex.error && (ex.data || []).length && !(await window.UI.confirm(`Königreich #${number} gibt es hier schon („${ex.data[0].name}“). Lieber dort per „Königreich beitreten“ anfragen. Trotzdem ein eigenes gründen?`))) return; } catch {} }
    st.busy = true; render();
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
  // ---------- Beitritt per Anfrage (R4/R5 bestätigen die Governor-ID) ----------
  async function myGovId() {
    let gid = String((A.ownMeta && A.ownMeta().governor_id) || '').replace(/\D/g, '');
    if (!gid) { try { const r = await db().from('leaderboard').select('governor_id').eq('user_id', me()).maybeSingle(); gid = String(r.data?.governor_id || '').replace(/\D/g, ''); } catch {} }
    return gid;
  }
  async function joinSearch() {
    const num = st.join.q.replace(/\D/g, ''); st.join.res = []; st.join.searched = false;
    if (!num) { msg('Bitte die Nummer deines Königreichs eingeben.', 'warn'); render(); return; }
    st.join.busy = true; render();
    try { const { data, error } = await db().rpc('kd_search', { num }); if (error) throw error;
      st.join.res = data || []; st.join.searched = true;
      const own = await R.users(st.join.res.map((k) => k.owner)); Object.assign(st.users, own);
    } catch (e) { fail(e, 'Suche'); }
    st.join.busy = false; render();
  }
  async function requestJoin(kid) {
    if (myRow()) { msg('Du bist schon in einem Königreich – erst dort austreten.', 'warn'); return; }
    if (st.invites.some((i) => i.kingdom_id === kid)) { msg('Du hast von diesem Königreich schon eine Einladung – nimm sie oben an.', 'warn'); return; }
    const gid = await myGovId();
    if (!gid) { msg('Trag zuerst deine Governor-ID im Profil ein – R4/R5 prüfen damit, wer du im Spiel bist.', 'warn'); return; }
    try { const { error } = await db().from('kingdom_members').insert({ kingdom_id: kid, user_id: me(), rank: 1, status: 'requested', governor_id: gid }); if (error) throw error;
      msg('✓ Anfrage gesendet – ein R4 oder R5 muss deine ID bestätigen', 'ok'); st.join = { q: '', res: [], searched: false, busy: false }; await load();
    } catch (e) { fail(e, 'Anfrage'); }
  }
  async function cancelRequest(kid) {
    try { const { error } = await db().from('kingdom_members').delete().eq('kingdom_id', kid).eq('user_id', me()).eq('status', 'requested'); if (error) throw error; await load(); } catch (e) { fail(e, 'Zurückziehen'); }
  }
  async function answerRequest(uid, ok) {
    if (!canManage()) return;
    const rq = st.requests.find((r) => r.user_id === uid); if (!rq) return;
    if (ok && !(await window.UI.confirm(`Governor-ID ${rq.governor_id || '?'} von ${u(uid).username || '?'} bestätigt? Hast du im Spiel geprüft, dass das wirklich dieser Spieler ist?`, { ok: '✓ Aufnehmen', danger: false }))) return;
    try {
      const q0 = db().from('kingdom_members'); const { error } = ok ? await q0.update({ status: 'member' }).eq('kingdom_id', st.kd.id).eq('user_id', uid) : await q0.delete().eq('kingdom_id', st.kd.id).eq('user_id', uid);
      if (error) throw error; msg(ok ? '✓ Aufgenommen' : 'Anfrage abgelehnt', ok ? 'ok' : 'busy'); await load();
    } catch (e) { fail(e, ok ? 'Aufnehmen' : 'Ablehnen'); }
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
    if (st.kd && uid === st.kd.owner) { msg('Der Gründer bleibt immer R5.', 'warn'); render(); return; }
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

  // ---------- 📊 Top 300: Königreichs-Scans aus RokTracker (.xlsx / .csv / .jsonl) ----------
  // Supabase: kingdom_scans (eine Zeile pro Scan, alle Spieler als jsonb in data). Hochladen/Löschen: R4 + R5 · Ansehen: alle Mitglieder
  const sc = st.sc = { list: [], loaded: false, loading: false, err: '', noTable: false, cur: '', cmp: '', rows: {}, sort: 'p', dir: -1, q: '', ally: '', more: false, up: null, busy: false, showAll: false };
  const SC_COLS = [['p', 'Power'], ['kp', 'Kill-Punkte'], ['t45', 'T4+T5 Kills'], ['t4', 'T4 Kills'], ['t5', 'T5 Kills'], ['d', 'Tote'],
    ['t1', 'T1 Kills', 1], ['t2', 'T2 Kills', 1], ['t3', 'T3 Kills', 1], ['r', 'Fernkampf', 1], ['ac', 'Acclaim', 1], ['acm', 'Höchster Acclaim', 1], ['hp', 'Höchste Power', 1], ['g', 'RSS gesammelt', 1], ['as', 'RSS-Hilfe', 1], ['h', 'Hilfen', 1]];
  const SC_MAP = [[/^(governor )?id$/, 'id'], [/^(governor )?name$/, 'n'], [/^alliance( name)?$/, 'a'], [/^power$/, 'p'], [/^(kill ?points|total killpts)$/, 'kp'],
    [/^acclaim$/, 'ac'], [/^highest acclaim$/, 'acm'], [/^highest power$/, 'hp'], [/^(deads?|dead troops)$/, 'd'], [/^t([1-5]) ?(kills|killpts)$/, 't'], [/^ranged( points)?$/, 'r'],
    [/^(rss gathered|gathered rss)$/, 'g'], [/^(rss assistance|sent rss)$/, 'as'], [/^(helps|help times)$/, 'h']];
  const scNum = (v) => { if (v == null || v === '') return null; const n = typeof v === 'number' ? v : +String(v).replace(/[^\d-]/g, ''); return Number.isFinite(n) && n >= 0 && String(v).replace(/[^\d]/g, '') !== '' ? Math.round(n) : null; };
  const scKey = (k) => { const s = String(k || '').toLowerCase().replace(/[_\s]+/g, ' ').trim(); for (const [re, key] of SC_MAP) { const m = s.match(re); if (m) return key === 't' ? 't' + m[1] : key; } return null; };
  const scVal = (r, k) => k === 't45' ? (r.t4 == null && r.t5 == null ? null : (r.t4 || 0) + (r.t5 || 0)) : r[k] == null ? null : r[k];
  const big = (n) => { if (n == null) return '–'; const a = Math.abs(n); return a >= 1e9 ? (n / 1e9).toLocaleString('de-DE', { maximumFractionDigits: 2 }) + ' Mrd.' : a >= 1e6 ? (n / 1e6).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' Mio.' : Math.round(n).toLocaleString('de-DE'); };
  const full = (n) => n == null ? '' : Math.round(n).toLocaleString('de-DE');
  const delta = (n, cls = 'text-[11px]') => n == null ? '' : `<span class="${cls} tabular-nums ${n > 0 ? 'text-emerald-400' : n < 0 ? 'text-red-400' : 'text-slate-500'}" title="${full(n)}">${n > 0 ? '+' : n < 0 ? '−' : '±'}${big(Math.abs(n))}</span>`;
  const scDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '–';
  const today = () => new Date().toISOString().slice(0, 10);

  // Dateien lesen: CSV (eigener Parser), JSONL, Excel (SheetJS wird erst beim ersten Excel-Upload nachgeladen)
  function parseCsv(text) {
    const rows = []; let row = [], cell = '', q = false;
    const sep = (text.split('\n')[0].match(/;/g) || []).length > (text.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
    for (let i = 0; i < text.length; i++) { const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
      else if (ch === '"') q = true; else if (ch === sep) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); cell = ''; if (row.some((c) => c !== '')) rows.push(row); row = []; }
      else cell += ch; }
    row.push(cell); if (row.some((c) => c !== '')) rows.push(row);
    const head = rows.shift() || []; return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
  }
  const loadXlsx = () => window.XLSX ? Promise.resolve(window.XLSX) : new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = () => ok(window.XLSX); s.onerror = () => no(new Error('Der Excel-Leser konnte nicht geladen werden – bitte die CSV-Datei hochladen.')); document.head.appendChild(s); });
  async function readScanFile(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase(); let objs;
    if (ext === 'xlsx' || ext === 'xls') { const X = await loadXlsx(); const wb = X.read(await file.arrayBuffer(), { type: 'array' }); objs = X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' }); }
    else if (ext === 'jsonl' || ext === 'json') { const t = await file.text(); objs = ext === 'json' ? JSON.parse(t) : t.split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l)); }
    else objs = parseCsv((await file.text()).replace(/^﻿/, ''));
    const cols = new Set(), out = [];
    (objs || []).forEach((o) => { const r = {};
      Object.entries(o || {}).forEach(([k, v]) => { const key = scKey(k); if (!key) return; cols.add(key);
        if (key === 'n' || key === 'a') r[key] = String(v ?? '').trim().slice(0, 40); else if (key === 'id') { const d = String(v ?? '').replace(/\D/g, ''); if (d) r.id = d.slice(0, 12); } else { const n = scNum(v); if (n != null) r[key] = n; } });
      if (!r.id && !r.n) return; r.rk = out.length + 1; out.push(r); });
    // Lesefehler bei Allianznamen glätten (z. B. „[S7T9]Saints of 79“ → „[S79]Saints of 79“): seltene Schreibweise → häufigste ähnliche
    const cnt = new Map(); out.forEach((r) => r.a && cnt.set(r.a, (cnt.get(r.a) || 0) + 1));
    const lev = (x, y) => { if (Math.abs(x.length - y.length) > 2) return 9; let pr = Array.from({ length: y.length + 1 }, (_, j) => j);
      for (let i = 1; i <= x.length; i++) { const c = [i]; for (let j = 1; j <= y.length; j++) c[j] = Math.min(pr[j] + 1, c[j - 1] + 1, pr[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1)); pr = c; } return pr[y.length]; };
    const fix = new Map(); [...cnt].forEach(([a, n]) => { if (n > 2) return; const best = [...cnt].filter(([b, m]) => m >= 3 && m > n && lev(a, b) <= 2).sort((x, y) => y[1] - x[1])[0]; if (best) fix.set(a, best[0]); });
    out.forEach((r) => { if (fix.has(r.a)) r.a = fix.get(r.a); });
    if (!out.length) throw new Error('In der Datei wurden keine Spieler gefunden – ist es die Kingdom-Datei aus RokTracker?');
    if (!cols.has('id')) throw new Error('Die Datei hat keine Spalte „ID“ – bitte die Kingdom-Datei aus RokTracker nehmen.');
    const dm = file.name.match(/(20\d\d)[-_.]?(\d\d)[-_.]?(\d\d)/);
    return { name: file.name.replace(/\.[^.]+$/, '').slice(0, 60), date: dm ? `${dm[1]}-${dm[2]}-${dm[3]}` : today(), rows: out.slice(0, 1500), cols: [...cols], file: file.name };
  }

  // Laden / Speichern
  async function scRows(id) {
    if (!id || sc.rows[id]) return;
    const { data, error } = await db().from('kingdom_scans').select('id,data').eq('id', id).maybeSingle(); if (error) throw error;
    sc.rows[id] = Array.isArray(data?.data) ? data.data : [];
  }
  async function loadScans() {
    if (sc.loading || !st.kd) return; sc.loading = true; sc.err = ''; render();
    try {
      const { data, error } = await db().from('kingdom_scans').select('id,name,scanned_at,row_count,user_id,created_at').eq('kingdom_id', st.kd.id).order('scanned_at', { ascending: false }).order('created_at', { ascending: false }).limit(60);
      if (error) throw error;
      sc.list = data || []; sc.noTable = false;
      if (!sc.list.some((x) => x.id === sc.cur)) sc.cur = sc.list[0]?.id || '';
      if (!sc.list.some((x) => x.id === sc.cmp) || sc.cmp === sc.cur) sc.cmp = sc.list.find((x) => x.id !== sc.cur)?.id || '';
      await Promise.all([scRows(sc.cur), scRows(sc.cmp)]);
    } catch (e) { if (R.tableMissing(e)) sc.noTable = true; else sc.err = A.germanError ? A.germanError(e) : String(e.message || e); }
    sc.loading = false; sc.loaded = true; render();
  }
  async function scPick(which, id) {
    sc[which] = id; if (which === 'cur' && sc.cmp === id) sc.cmp = ''; sc.showAll = false;
    try { await scRows(id); } catch (e) { fail(e, 'Laden'); } render();
  }
  async function scFile(file) {
    if (!file || !canManage()) return;
    sc.busy = true; msg('⏳ Datei wird gelesen …', 'busy');
    try { sc.up = await readScanFile(file); msg('', ''); }
    catch (e) { sc.up = null; msg(String(e.message || e), 'err'); }
    sc.busy = false; render();
  }
  async function scSave() {
    const u0 = sc.up; if (!u0 || !canManage() || sc.busy) return;
    const name = (u0.name || '').trim() || 'Scan', date = /^\d{4}-\d\d-\d\d$/.test(u0.date) ? u0.date : today();
    sc.busy = true; render();
    try {
      const { data, error } = await db().from('kingdom_scans').insert({ kingdom_id: st.kd.id, user_id: me(), name: name.slice(0, 60), scanned_at: date, row_count: u0.rows.length, data: u0.rows }).select('id').single();
      if (error) throw error;
      const prev = sc.cur; sc.rows[data.id] = u0.rows; sc.cur = data.id; sc.cmp = prev || ''; sc.up = null; sc.loaded = false;
      msg(`✓ Scan gespeichert · ${u0.rows.length} Spieler`, 'ok'); sc.busy = false; await loadScans(); return;
    } catch (e) { fail(e, 'Speichern'); }
    sc.busy = false; render();
  }
  async function scDelete(id) {
    if (!canManage() || !id) return; const x = sc.list.find((s) => s.id === id);
    if (!(await window.UI.confirm(`Scan „${x?.name || ''}“ vom ${scDate(x?.scanned_at)} löschen?`))) return;
    try { const { error } = await db().from('kingdom_scans').delete().eq('id', id); if (error) throw error; delete sc.rows[id]; if (sc.cur === id) sc.cur = ''; if (sc.cmp === id) sc.cmp = ''; await loadScans(); } catch (e) { fail(e, 'Löschen'); }
  }

  // Darstellung
  const scMemberIds = () => new Set(st.mem.map((m) => String(u(m.user_id).governor_id || '')).filter(Boolean));
  function scView() {
    const cur = sc.rows[sc.cur] || [], old = sc.cmp ? (sc.rows[sc.cmp] || []) : null, oldBy = old ? new Map(old.map((r) => [r.id, r])) : null;
    const curIds = new Set(cur.map((r) => r.id)), gone = old ? old.filter((r) => r.id && !curIds.has(r.id) && (r.rk || 0) <= cur.length) : [];   // nur bis zur Größe des aktuellen Scans (Top 50 vs. Top 300)
    const cols = SC_COLS.filter(([k, , more]) => (!more || sc.more) && cur.some((r) => scVal(r, k) != null));
    const q = sc.q.trim().toLowerCase();
    let list = cur.filter((r) => (!sc.ally || (r.a || '') === sc.ally) && (!q || String(r.n || '').toLowerCase().includes(q) || String(r.id || '').includes(q) || String(r.a || '').toLowerCase().includes(q)));
    const key = sc.sort, isD = key.startsWith('Δ'), k0 = isD ? key.slice(1) : key;
    const sv = (r) => key === 'rk' ? r.rk : key === 'n' ? String(r.n || '').toLowerCase() : isD ? (oldBy && oldBy.get(r.id) && scVal(r, k0) != null && scVal(oldBy.get(r.id), k0) != null ? scVal(r, k0) - scVal(oldBy.get(r.id), k0) : null) : scVal(r, key);
    list = [...list].sort((a, b) => { const x = sv(a), y = sv(b); if (x == null && y == null) return a.rk - b.rk; if (x == null) return 1; if (y == null) return -1; return (x < y ? -1 : x > y ? 1 : 0) * (key === 'n' || key === 'rk' ? -sc.dir : sc.dir) || a.rk - b.rk; });
    return { cur, old, oldBy, gone, cols, list };
  }
  function scSummary(v) {
    const sum = (rows, k) => rows.reduce((a, r) => a + (scVal(r, k) || 0), 0);
    const matched = v.old ? v.cur.filter((r) => v.oldBy.has(r.id)) : [];
    const dsum = (k) => v.old ? matched.reduce((a, r) => { const x = scVal(r, k), y = scVal(v.oldBy.get(r.id), k); return x != null && y != null ? a + x - y : a; }, 0) : null;
    const tile = (lab, val, d, tip) => `<div class="rounded-xl bg-ink-950/60 border border-ink-700 px-3 py-2"><div class="text-[11px] text-slate-500">${lab}</div><div class="font-semibold text-slate-100 tabular-nums" title="${tip || ''}">${val}</div>${d != null ? `<div>${delta(d)}</div>` : ''}</div>`;
    const has = (k) => v.cur.some((r) => scVal(r, k) != null);
    return `<div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
      ${tile('Anzahl Spieler', full(v.cur.length), v.old ? v.cur.length - v.old.length : null)}
      ${tile('Power gesamt', big(sum(v.cur, 'p')), dsum('p'), full(sum(v.cur, 'p')))}
      ${has('kp') ? tile('Kill-Punkte gesamt', big(sum(v.cur, 'kp')), dsum('kp'), full(sum(v.cur, 'kp'))) : ''}
      ${has('t45') ? tile('T4+T5 Kills gesamt', big(sum(v.cur, 't45')), dsum('t45'), full(sum(v.cur, 't45'))) : ''}
      ${has('d') ? tile('Tote gesamt', big(sum(v.cur, 'd')), dsum('d'), full(sum(v.cur, 'd'))) : ''}</div>
      ${v.old ? `<p class="text-[11px] text-slate-500">Veränderung (grün/rot) = nur Spieler, die in beiden Scans sind.</p>` : ''}`;
  }
  function scAllies(v) {
    const g = new Map();
    v.cur.forEach((r) => { const a = r.a || ''; const o = g.get(a) || { a, n: 0, p: 0, kp: 0, d: 0, dkp: 0, dd: 0 };
      o.n++; o.p += r.p || 0; o.kp += r.kp || 0; o.d += r.d || 0;
      const x = v.oldBy && v.oldBy.get(r.id); if (x) { if (r.kp != null && x.kp != null) o.dkp += r.kp - x.kp; if (r.d != null && x.d != null) o.dd += r.d - x.d; }
      g.set(a, o); });
    const rows = [...g.values()].sort((x, y) => y.p - x.p).slice(0, 12);
    if (rows.length < 2 && !rows[0]?.a) return '';
    return `<details class="rounded-xl border border-ink-700 bg-ink-950/40 px-3 py-2" ${sc.ally ? 'open' : ''}><summary class="text-sm font-semibold text-slate-200 cursor-pointer">🛡️ Allianzen</summary>
      <div class="overflow-x-auto mt-2"><table class="w-full text-xs"><thead><tr class="text-[10px] uppercase tracking-widest text-slate-500"><th class="text-left py-1 pr-2 font-medium">Allianz</th><th class="text-right px-2 font-medium">Spieler</th><th class="text-right px-2 font-medium">Power</th><th class="text-right px-2 font-medium">Kill-Punkte</th><th class="text-right px-2 font-medium">Tote</th></tr></thead>
      <tbody>${rows.map((o) => `<tr class="border-t border-ink-700/60 hover:bg-ink-800/50 cursor-pointer ${sc.ally === o.a && sc.ally ? 'bg-gold-500/10' : ''}" data-kd-sc-ally="${esc(o.a)}"><td class="py-1.5 pr-2 font-semibold text-slate-100" ${o.a ? 'translate="no"' : ''}>${o.a ? esc(o.a) : '<span class="text-slate-500 font-normal">ohne Allianz</span>'}</td><td class="text-right px-2 tabular-nums">${o.n}</td><td class="text-right px-2 tabular-nums" title="${full(o.p)}">${big(o.p)}</td><td class="text-right px-2 tabular-nums">${big(o.kp)}${v.old ? `<div>${delta(o.dkp, 'text-[10px]')}</div>` : ''}</td><td class="text-right px-2 tabular-nums">${big(o.d)}${v.old ? `<div>${delta(o.dd, 'text-[10px]')}</div>` : ''}</td></tr>`).join('')}</tbody></table></div>
      <p class="text-[11px] text-slate-500 mt-1">Antippen = Tabelle nach dieser Allianz filtern.</p></details>`;
  }
  function scBodyHTML() {
    const v = scView(), mids = scMemberIds(), dirA = (k) => (k === 'n' || k === 'rk' ? sc.dir > 0 : sc.dir < 0) ? ' ▼' : ' ▲', arrow = (k) => sc.sort === k ? dirA(k) : sc.sort === 'Δ' + k ? ' Δ' + dirA(k) : '';
    const shown = sc.showAll ? v.list : v.list.slice(0, 100);
    const th = (k, lab, right = true) => `<th class="py-1.5 px-2 font-medium ${right ? 'text-right' : 'text-left'} whitespace-nowrap cursor-pointer hover:text-gold-300 ${sc.sort === k || sc.sort === 'Δ' + k ? 'text-gold-300' : ''}" data-kd-sc-sort="${k}">${lab}<span>${arrow(k)}</span></th>`;
    const cell = (r, k) => { const x = scVal(r, k), o = v.oldBy && v.oldBy.get(r.id), d = o && x != null && scVal(o, k) != null ? x - scVal(o, k) : null;
      return `<td class="py-1.5 px-2 text-right tabular-nums whitespace-nowrap" title="${full(x)}">${big(x)}${v.old ? `<div class="leading-tight">${d != null ? delta(d) : '<span class="text-[11px] text-slate-600">–</span>'}</div>` : ''}</td>`; };
    return `<div class="text-[11px] text-slate-500">${v.list.length !== v.cur.length ? `${full(v.list.length)} von ${full(v.cur.length)} Spielern` : `${full(v.cur.length)} Spieler`}</div>
      <div class="overflow-x-auto rounded-xl border border-ink-700"><table class="w-full text-sm">
        <thead class="bg-ink-950/80"><tr class="text-[10px] uppercase tracking-widest text-slate-500">${th('rk', '#', false)}${th('n', 'Statthalter', false)}${v.cols.map(([k, l]) => th(k, l)).join('')}</tr></thead>
        <tbody>${shown.length ? shown.map((r) => { const o = v.oldBy && v.oldBy.get(r.id), site = r.id && mids.has(r.id);
          return `<tr class="border-t border-ink-700/60 hover:bg-ink-800/40 ${site ? 'bg-gold-500/[.04]' : ''}">
            <td class="py-1.5 px-2 text-slate-500 tabular-nums">${r.rk}${o && o.rk !== r.rk ? `<div class="text-[10px] ${o.rk > r.rk ? 'text-emerald-400' : 'text-red-400'}">${o.rk > r.rk ? '▲' : '▼'}${Math.abs(o.rk - r.rk)}</div>` : ''}</td>
            <td class="py-1.5 px-2 min-w-[11rem]"><div class="font-semibold text-slate-100 truncate max-w-[15rem]" translate="no">${esc(r.n || '?')}${site ? ' <span title="Auf der Seite angemeldet">🌐</span>' : ''}${v.old && !o ? ' <span class="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">neu</span>' : ''}</div>
              <div class="text-[11px] text-slate-500"><span class="tabular-nums" translate="no">ID ${esc(r.id || '–')}</span>${r.a ? ` · <span translate="no">${esc(r.a)}</span>` : ''}</div></td>
            ${v.cols.map(([k]) => cell(r, k)).join('')}</tr>`; }).join('') : `<tr><td colspan="${v.cols.length + 2}" class="py-6 text-center text-slate-500">Keine Treffer.</td></tr>`}</tbody></table></div>
      ${v.list.length > 100 && !sc.showAll ? `<div class="text-center">${btn('data-kd-sc-all', `Alle ${full(v.list.length)} zeigen`)}</div>` : ''}
      ${v.gone.length ? `<details class="rounded-xl border border-ink-700 bg-ink-950/40 px-3 py-2"><summary class="text-sm font-semibold text-slate-200 cursor-pointer">🚪 Nicht mehr dabei · ${v.gone.length}</summary>
        <p class="text-[11px] text-slate-500 mt-1">Waren im Vergleichs-Scan, fehlen jetzt (migriert, gesperrt, inaktiv oder aus den Top gefallen).</p>
        <div class="mt-2 flex flex-col">${v.gone.map((r) => `<div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-1 border-b border-ink-700/60 last:border-0 text-xs"><b class="text-slate-200" translate="no">${esc(r.n || '?')}</b><span class="text-slate-500 tabular-nums" translate="no">ID ${esc(r.id)}</span>${r.a ? `<span class="text-slate-500" translate="no">${esc(r.a)}</span>` : ''}<span class="ml-auto tabular-nums text-slate-400">Power ${big(r.p)} · KP ${big(r.kp)}</span></div>`).join('')}</div></details>` : ''}`;
  }
  function scUploadHTML() {
    const u0 = sc.up;
    if (!u0) return `<label class="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border-2 border-dashed border-gold-500/40 bg-gold-500/5 px-4 py-3 cursor-pointer hover:border-gold-400" data-kd-sc-drop>
        <span class="text-2xl">📥</span><span class="min-w-0 flex-1"><b class="text-slate-100 text-sm">RokTracker-Datei hochladen</b><span class="block text-xs text-slate-400">Kingdom-Scan als .xlsx oder .csv – Datei hier reinziehen oder antippen</span></span>
        <span class="text-xs px-3 py-1.5 rounded-lg border border-gold-400 bg-gold-500 text-ink-950 font-semibold">${sc.busy ? '⏳ Lese …' : 'Datei wählen'}</span>
        <input type="file" accept=".xlsx,.xls,.csv,.jsonl,.json" class="hidden" data-kd-sc-file></label>`;
    const prevCols = SC_COLS.filter(([k]) => u0.rows.some((r) => scVal(r, k) != null)).slice(0, 5);
    const missing = ['p', 'kp', 't4', 't5', 'd'].filter((k) => !u0.cols.includes(k)).map((k) => SC_COLS.find((c) => c[0] === k)[1]);
    return `<div class="rounded-xl border border-gold-500/50 bg-gold-500/5 p-3 flex flex-col gap-3">
      <div class="text-sm text-slate-100"><b>📄 <span translate="no">${esc(u0.file)}</span></b> · <span class="text-emerald-300">${full(u0.rows.length)} Spieler erkannt</span></div>
      ${missing.length ? `<div class="text-xs text-amber-300">⚠ Fehlende Spalten: ${missing.join(', ')}</div>` : ''}
      <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_11rem_auto_auto] items-end">
        <label class="text-xs text-slate-400">Name des Scans<input type="text" maxlength="60" data-kd-sc-up="name" value="${esc(u0.name)}" placeholder="z. B. Vor KvK" class="mt-1 ${inp}"></label>
        <label class="text-xs text-slate-400">Scan-Datum<input type="date" data-kd-sc-up="date" value="${esc(u0.date)}" class="mt-1 ${inp} [color-scheme:dark]"></label>
        ${btn('data-kd-sc-save' + (sc.busy ? ' disabled' : ''), sc.busy ? '⏳ Speichere …' : '💾 Speichern', 'gold')}${btn('data-kd-sc-cancel', 'Abbrechen', 'red')}</div>
      <div class="overflow-x-auto"><table class="w-full text-xs"><thead><tr class="text-[10px] uppercase tracking-widest text-slate-500"><th class="text-left py-1 pr-2 font-medium">#</th><th class="text-left px-2 font-medium">Statthalter</th>${prevCols.map(([, l]) => `<th class="text-right px-2 font-medium">${l}</th>`).join('')}</tr></thead>
        <tbody>${u0.rows.slice(0, 5).map((r) => `<tr class="border-t border-ink-700/60"><td class="py-1 pr-2 text-slate-500">${r.rk}</td><td class="px-2"><span class="text-slate-100" translate="no">${esc(r.n || '?')}</span> <span class="text-slate-500 tabular-nums" translate="no">${esc(r.id || '')}</span></td>${prevCols.map(([k]) => `<td class="px-2 text-right tabular-nums">${full(scVal(r, k)) || '–'}</td>`).join('')}</tr>`).join('')}</tbody></table>
        <p class="text-[11px] text-slate-500 mt-1">Vorschau der ersten 5 Zeilen – passt alles, dann speichern.</p></div></div>`;
  }
  function scanHTML() {
    if (sc.noTable) return `<div class="text-sm text-amber-300">⚠ Die Tabelle „kingdom_scans“ fehlt noch in Supabase. Bitte das SQL aus dem Chat ausführen.</div>`;
    if (!sc.loaded) return '<p class="text-sm text-slate-500 text-center py-6">⏳ Wird geladen …</p>';
    const v = sc.rows[sc.cur] ? scView() : null;
    const opt = (x) => `<option value="${esc(x.id)}">${scDate(x.scanned_at)} · ${esc(x.name)} · ${full(x.row_count)} Spieler</option>`;
    const sel = (attr, val, list, none) => `<select ${attr} class="${inp} mt-1">${none ? `<option value="">${none}</option>` : ''}${list.map(opt).join('').replace(`value="${esc(val)}"`, `value="${esc(val)}" selected`)}</select>`;
    const sortOpts = [['rk', 'Platz'], ['n', 'Name'], ...SC_COLS.filter(([, , more]) => !more || sc.more).map(([k, l]) => [k, l]), ...(sc.cmp ? SC_COLS.filter(([, , more]) => !more).map(([k, l]) => ['Δ' + k, `Zuwachs ${l}`]) : [])];
    const allies = [...new Set((sc.rows[sc.cur] || []).map((r) => r.a || ''))].filter(Boolean).sort((a, b) => a.localeCompare(b));
    return `${sc.err ? `<div class="text-sm text-red-300">⚠ ${esc(sc.err)}</div>` : ''}
      ${canManage() ? scUploadHTML() : ''}
      ${!sc.list.length ? `<div class="text-center py-6"><div class="text-4xl mb-2">📊</div><p class="text-sm text-slate-300">Noch kein Scan hochgeladen.</p>
          <p class="text-xs text-slate-500 mt-1">${canManage() ? 'Scanne die Top 300 mit RokTracker (Kingdom-Scan) und lade die Datei oben hoch. Mit zwei Scans (z. B. vor und nach dem KvK) siehst du, wer wie viel gekillt hat und gestorben ist.' : 'Sobald ein R4 oder R5 einen Scan hochlädt, siehst du hier die Top 300 deines Königreichs.'}</p></div>` : `
      <div class="grid gap-2 sm:grid-cols-2 ${sc.view === 'hist' ? 'hidden' : ''}">
        <label class="text-xs text-slate-400">Scan${sel('data-kd-sc-pick="cur"', sc.cur, sc.list)}</label>
        <label class="text-xs text-slate-400">Vergleichen mit${sel('data-kd-sc-pick="cmp"', sc.cmp, sc.list.filter((x) => x.id !== sc.cur), '— kein Vergleich —')}</label></div>
      <div class="grid grid-cols-2 gap-1 p-1 rounded-xl bg-ink-950 border border-ink-700">${[['table', '📋 Tabelle & Vergleich'], ['hist', '📈 Verlauf']].map(([v0, l]) => `<button type="button" data-kd-scview="${v0}" aria-pressed="${sc.view === v0}" class="seg-btn rounded-lg px-2 py-1.5 text-xs sm:text-sm font-semibold border border-ink-600 transition">${l}</button>`).join('')}</div>
      ${sc.view === 'hist' ? histHTML() : !sc.rows[sc.cur] ? '<p class="text-sm text-slate-500 text-center py-4">⏳ Wird geladen …</p>' : `
      ${scSummary(v)}
      ${scAllies(v)}
      <div class="grid gap-2 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-end">
        <label class="text-xs text-slate-400">Suchen<input type="search" data-kd-sc-q value="${esc(sc.q)}" placeholder="Name, ID oder Allianz" class="mt-1 ${inp}"></label>
        <label class="text-xs text-slate-400">Allianz<select data-kd-sc-allysel class="${inp} mt-1"><option value="">Alle Allianzen</option>${allies.map((a) => `<option value="${esc(a)}" ${a === sc.ally ? 'selected' : ''} translate="no">${esc(a)}</option>`).join('')}</select></label>
        <label class="text-xs text-slate-400">Sortieren nach<select data-kd-sc-sortsel class="${inp} mt-1">${sortOpts.map(([k, l]) => `<option value="${k}" ${sc.sort === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        ${btn('data-kd-sc-more', sc.more ? '− Weniger Spalten' : '+ Mehr Spalten')}</div>
      <div id="kdScBody" class="flex flex-col gap-3">${scBodyHTML()}</div>`}
      <div class="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">🌐 = auf der Seite angemeldet · Werte antippen/hovern = genaue Zahl${canManage() ? `<span class="ml-auto">${btn(`data-kd-sc-del="${esc(sc.cur)}"`, '🗑 Diesen Scan löschen', 'red')}</span>` : ''}</div>`}`;
  }
  const scRefreshBody = () => { const b = $('kdScBody'); if (b) b.innerHTML = scBodyHTML(); else render(); };
  root.addEventListener('dragover', (ev) => { if (ev.target.closest?.('[data-kd-sc-drop]')) { ev.preventDefault(); ev.target.closest('[data-kd-sc-drop]').classList.add('drop-active'); } });
  root.addEventListener('dragleave', (ev) => { ev.target.closest?.('[data-kd-sc-drop]')?.classList.remove('drop-active'); });
  root.addEventListener('drop', (ev) => { const z = ev.target.closest?.('[data-kd-sc-drop]'); if (!z) return; ev.preventDefault(); z.classList.remove('drop-active'); scFile(ev.dataTransfer?.files?.[0]); });

  // ---------- 📈 Top 300 – Verlauf: alle Scans nacheinander (z. B. monatlich) → Power/KP-Entwicklung ----------
  sc.view = 'table'; sc.hq = ''; sc.hid = ''; sc.hLoading = false;
  let charts = [];
  const killCharts = () => { charts.forEach((c) => { try { c.destroy(); } catch {} }); charts = []; };
  const chronList = () => [...sc.list].sort((a, b) => String(a.scanned_at).localeCompare(String(b.scanned_at)) || String(a.created_at).localeCompare(String(b.created_at)));
  async function loadAllRows() {
    if (sc.hLoading) return; const miss = sc.list.filter((x) => !sc.rows[x.id]); if (!miss.length) return;
    sc.hLoading = true; render();
    try { const ids = miss.map((x) => x.id); const { data, error } = await db().from('kingdom_scans').select('id,data').in('id', ids); if (error) throw error; (data || []).forEach((r) => { sc.rows[r.id] = Array.isArray(r.data) ? r.data : []; }); }
    catch (e) { fail(e, 'Laden'); }
    sc.hLoading = false; render();
  }
  const sumTop = (rows, k, n = 300) => rows.filter((r) => (r.rk || 0) <= n).reduce((a, r) => a + (scVal(r, k) || 0), 0);
  function histHTML() {
    const list = chronList();
    if (list.length < 2) return '<p class="text-sm text-slate-500 text-center py-6">Für den Verlauf brauchst du mindestens zwei Scans – am besten jeden Monat einen.</p>';
    if (list.some((x) => !sc.rows[x.id])) return '<p class="text-sm text-slate-500 text-center py-6">⏳ Alle Scans werden geladen …</p>';
    const all = new Map(); list.forEach((x) => sc.rows[x.id].forEach((r) => { if (r.id && !all.has(r.id)) all.set(r.id, r); }));
    sc.rows[list[list.length - 1].id].forEach((r) => r.id && all.set(r.id, r));   // neuester Name gewinnt
    const q = sc.hq.trim().toLowerCase();
    const hits = q ? [...all.values()].filter((r) => String(r.n || '').toLowerCase().includes(q) || String(r.id).includes(q)).slice(0, 8) : [];
    const pick = sc.hid ? all.get(sc.hid) : null;
    const n = Math.min(...list.map((x) => (sc.rows[x.id] || []).length));
    const rowsOf = (id) => list.map((x) => ({ s: x, r: (sc.rows[x.id] || []).find((y) => y.id === id) || null }));
    const pr = pick ? rowsOf(pick.id) : [];
    return `<div class="rounded-xl border border-ink-700 bg-ink-950/40 p-3 flex flex-col gap-2">
        <div class="flex flex-wrap items-baseline gap-2"><b class="text-sm text-slate-100">🏰 Königreich gesamt</b><span class="text-[11px] text-slate-500">Summe der Top <span>${n}</span> je Scan</span></div>
        <div class="relative h-56"><canvas id="kdChKd"></canvas></div></div>
      <div class="rounded-xl border border-ink-700 bg-ink-950/40 p-3 flex flex-col gap-2">
        <b class="text-sm text-slate-100">👤 Spieler-Verlauf</b>
        <div class="flex gap-2"><input type="search" data-kd-hq value="${esc(sc.hq)}" placeholder="Name oder Governor-ID" class="${inp}"></div>
        ${hits.length ? `<div class="flex flex-wrap gap-1.5">${hits.map((r) => `<button type="button" data-kd-hpick="${esc(r.id)}" class="text-xs px-2.5 py-1 rounded-lg border ${r.id === sc.hid ? 'border-gold-400 text-gold-300' : 'border-ink-600 text-slate-300 hover:border-gold-500/60'}"><span translate="no">${esc(r.n || '?')}</span> <span class="text-slate-500 tabular-nums" translate="no">${esc(r.id)}</span></button>`).join('')}</div>` : q ? '<p class="text-xs text-slate-500">Keine Treffer.</p>' : ''}
        ${pick ? `<div class="text-sm"><b class="text-slate-100" translate="no">${esc(pick.n || '?')}</b> <span class="text-xs text-slate-500 tabular-nums" translate="no">ID ${esc(pick.id)}${pick.a ? ' · ' + esc(pick.a) : ''}</span></div>
          <div class="relative h-56"><canvas id="kdChGov"></canvas></div>
          <div class="overflow-x-auto"><table class="w-full text-xs"><thead><tr class="text-[10px] uppercase tracking-widest text-slate-500"><th class="text-left py-1 pr-2 font-medium">Scan</th><th class="text-right px-2 font-medium">Platz</th><th class="text-right px-2 font-medium">Power</th><th class="text-right px-2 font-medium">Kill-Punkte</th><th class="text-right px-2 font-medium">T4+T5 Kills</th><th class="text-right px-2 font-medium">Tote</th></tr></thead>
          <tbody>${pr.map((x, i) => { const pv = i ? pr[i - 1].r : null, d = (k) => x.r && pv && scVal(x.r, k) != null && scVal(pv, k) != null ? `<div>${delta(scVal(x.r, k) - scVal(pv, k), 'text-[10px]')}</div>` : '';
            return `<tr class="border-t border-ink-700/60"><td class="py-1.5 pr-2 text-slate-300">${scDate(x.s.scanned_at)} <span class="text-slate-500" translate="no">${esc(x.s.name)}</span></td>${x.r ? `<td class="px-2 text-right tabular-nums">${x.r.rk}</td>${['p', 'kp', 't45', 'd'].map((k) => `<td class="px-2 text-right tabular-nums" title="${full(scVal(x.r, k))}">${big(scVal(x.r, k))}${d(k)}</td>`).join('')}` : '<td colspan="5" class="px-2 text-right text-slate-500">nicht im Scan</td>'}</tr>`; }).join('')}</tbody></table></div>`
        : '<p class="text-xs text-slate-500">Spieler suchen und antippen – dann siehst du seine Power und Kill-Punkte über alle Scans.</p>'}</div>`;
  }
  function drawCharts() {
    killCharts(); if (!window.Chart || st.tab !== 'scan' || sc.view !== 'hist') return;
    const list = chronList(); if (list.length < 2 || list.some((x) => !sc.rows[x.id])) return;
    const n = Math.min(...list.map((x) => (sc.rows[x.id] || []).length)), labels = list.map((x) => scDate(x.scanned_at));
    const opt = (y2) => ({ responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { labels: { color: '#cbd5e1', boxWidth: 12 } }, tooltip: { callbacks: { label: (c) => ` ${c.dataset.label}: ${full(c.raw)}` } } },
      scales: { x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,.08)' } }, y: { position: 'left', ticks: { color: '#f5c542', callback: (v) => big(v) }, grid: { color: 'rgba(148,163,184,.08)' } }, ...(y2 ? { y2: { position: 'right', ticks: { color: '#f87171', callback: (v) => big(v) }, grid: { display: false } } } : {}) } });
    const ds = (label, data, color, axis = 'y') => ({ label, data, borderColor: color, backgroundColor: color + '33', tension: .25, pointRadius: 3, spanGaps: true, yAxisID: axis });
    const c1 = $('kdChKd'); if (c1) charts.push(new window.Chart(c1, { type: 'line', data: { labels, datasets: [ds('Power', list.map((x) => sumTop(sc.rows[x.id], 'p', n)), '#f5c542'), ds('Kill-Punkte', list.map((x) => sumTop(sc.rows[x.id], 'kp', n)), '#f87171', 'y2')] }, options: opt(true) }));
    const c2 = $('kdChGov'); if (c2 && sc.hid) { const pr = list.map((x) => (sc.rows[x.id] || []).find((y) => y.id === sc.hid) || null);
      charts.push(new window.Chart(c2, { type: 'line', data: { labels, datasets: [ds('Power', pr.map((r) => r ? r.p ?? null : null), '#f5c542'), ds('Kill-Punkte', pr.map((r) => r ? r.kp ?? null : null), '#f87171', 'y2')] }, options: opt(true) })); }
  }

  // ---------- ⚔️ KvK: Kämpfe auswerten (Scan vorher ↔ Scan nachher) ----------
  // Supabase: kingdom_fights (kind zone5|altar|pass7|kingsland|kvk|other, scan_before, scan_after)
  const FIGHT = { zone5: ['🔥', 'Zone 5 Fight'], altar: ['⛩️', 'Altar Fight'], pass7: ['🚪', 'Pass 7'], kingsland: ['👑', 'Kingsland'], kvk: ['🏆', 'KvK gesamt'], other: ['⚔️', 'Sonstiger Kampf'] };
  const fi = st.fi = { list: [], loaded: false, loading: false, noTable: false, open: '', form: null, sort: 'Δkp', dir: -1, q: '', busy: false };
  async function loadFights() {
    if (fi.loading || !st.kd) return; fi.loading = true; render();
    try {
      const [f] = await Promise.all([db().from('kingdom_fights').select('*').eq('kingdom_id', st.kd.id).order('fight_date', { ascending: false }).order('created_at', { ascending: false }).limit(100), sc.loaded ? null : loadScansQuiet()]);
      if (f.error) throw f.error; fi.list = f.data || []; fi.noTable = false;
    } catch (e) { if (R.tableMissing(e)) fi.noTable = true; else fail(e, 'Laden'); }
    fi.loading = false; fi.loaded = true; render();
  }
  async function loadScansQuiet() { try { const { data, error } = await db().from('kingdom_scans').select('id,name,scanned_at,row_count,user_id,created_at').eq('kingdom_id', st.kd.id).order('scanned_at', { ascending: false }).limit(60); if (!error) { sc.list = data || []; } } catch {} }
  async function openFight(id) {
    fi.open = fi.open === id ? '' : id; fi.q = ''; render();
    const f = fi.list.find((x) => x.id === id); if (!f || fi.open !== id) return;
    try { await Promise.all([scRows(f.scan_before), scRows(f.scan_after)]); } catch (e) { fail(e, 'Laden'); } render();
  }
  async function saveFight() {
    const f = fi.form; if (!f || !canManage() || fi.busy) return;
    if (!f.before || !f.after || f.before === f.after) { msg('Bitte zwei verschiedene Scans wählen: vor und nach dem Kampf.', 'warn'); return; }
    const b = sc.list.find((x) => x.id === f.before), a = sc.list.find((x) => x.id === f.after);
    if (b && a && String(b.scanned_at) > String(a.scanned_at)) { msg('Der Scan „vorher“ ist neuer als der Scan „nachher“ – bitte tauschen.', 'warn'); return; }
    fi.busy = true; render();
    try { const { error } = await db().from('kingdom_fights').insert({ kingdom_id: st.kd.id, user_id: me(), kind: FIGHT[f.kind] ? f.kind : 'other', title: (f.title || '').trim().slice(0, 60) || null, kvk: (f.kvk || '').trim().slice(0, 40) || null, fight_date: /^\d{4}-\d\d-\d\d$/.test(f.date) ? f.date : (a?.scanned_at || today()), scan_before: f.before, scan_after: f.after, note: (f.note || '').slice(0, 300) || null });
      if (error) throw error; fi.form = null; msg('✓ Kampf gespeichert', 'ok'); fi.busy = false; fi.loaded = false; await loadFights(); return; }
    catch (e) { fail(e, 'Speichern'); }
    fi.busy = false; render();
  }
  async function delFight(id) {
    if (!canManage()) return; if (!(await window.UI.confirm('Diese Kampf-Auswertung löschen? Die Scans bleiben erhalten.'))) return;
    try { const { error } = await db().from('kingdom_fights').delete().eq('id', id); if (error) throw error; if (fi.open === id) fi.open = ''; fi.loaded = false; await loadFights(); } catch (e) { fail(e, 'Löschen'); }
  }
  const FKEYS = [['kp', 'Kill-Punkte'], ['t45', 'T4+T5 Kills'], ['t4', 'T4 Kills'], ['t5', 'T5 Kills'], ['d', 'Tote'], ['p', 'Power']];
  function fightData(f) {
    const B = sc.rows[f.scan_before], A0 = sc.rows[f.scan_after]; if (!B || !A0) return null;
    const by = new Map(B.map((r) => [r.id, r]));
    const rows = A0.filter((r) => r.id && by.has(r.id)).map((r) => { const o = by.get(r.id), x = { id: r.id, n: r.n, a: r.a, rk: r.rk };
      FKEYS.forEach(([k]) => { const v1 = scVal(r, k), v0 = scVal(o, k); x[k] = v1 != null && v0 != null ? v1 - v0 : null; }); x.part = (x.kp || 0) > 0 || (x.d || 0) > 0; return x; });
    return { rows, missing: A0.length - rows.length };
  }
  function fightHTML(f) {
    const D = fightData(f); if (!D) return '<p class="text-sm text-slate-500 text-center py-4">⏳ Wird geladen …</p>';
    if (!D.rows.length) return '<p class="text-sm text-amber-300">⚠ Die beiden Scans haben keine gemeinsamen Spieler (Governor-IDs).</p>';
    const sum = (k) => D.rows.reduce((a, r) => a + (r[k] || 0), 0), part = D.rows.filter((r) => r.part);
    const tile = (lab, v, cls = 'text-slate-100') => `<div class="rounded-xl bg-ink-950/60 border border-ink-700 px-3 py-2"><div class="text-[11px] text-slate-500">${lab}</div><div class="font-semibold tabular-nums ${cls}" ${typeof v === 'number' ? `title="${full(v)}"` : ''}>${typeof v === 'number' ? (v > 0 ? '+' : '') + big(v) : v}</div></div>`;
    const top = (k, lab, ico) => { const t = [...D.rows].filter((r) => (r[k] || 0) > 0).sort((a, b) => b[k] - a[k]).slice(0, 5);
      return `<div class="rounded-xl border border-ink-700 bg-ink-950/40 p-3"><div class="text-xs font-semibold text-slate-200 mb-1">${ico} ${lab}</div>${t.length ? t.map((r, i) => `<div class="flex items-center gap-2 py-0.5 text-xs"><span class="w-4 text-slate-500">${i + 1}</span><span class="min-w-0 flex-1 truncate text-slate-100" translate="no">${esc(r.n || '?')}</span><span class="tabular-nums text-emerald-300">+${big(r[k])}</span></div>`).join('') : '<div class="text-xs text-slate-500">–</div>'}</div>`; };
    const g = new Map(); D.rows.forEach((r) => { const o = g.get(r.a || '') || { a: r.a || '', n: 0, kp: 0, d: 0, t45: 0 }; if (r.part) o.n++; o.kp += r.kp || 0; o.d += r.d || 0; o.t45 += r.t45 || 0; g.set(o.a, o); });
    const allies = [...g.values()].filter((o) => o.kp || o.d).sort((x, y) => y.kp - x.kp).slice(0, 10);
    const q = fi.q.trim().toLowerCase(), key = fi.sort.slice(1);
    const list = D.rows.filter((r) => !q || String(r.n || '').toLowerCase().includes(q) || String(r.id).includes(q) || String(r.a || '').toLowerCase().includes(q))
      .sort((a, b) => key === 'n' ? String(a.n || '').localeCompare(String(b.n || '')) * -fi.dir : ((a[key] ?? -Infinity) - (b[key] ?? -Infinity)) * fi.dir || a.rk - b.rk);
    const th = (k, l) => `<th class="py-1.5 px-2 font-medium text-right whitespace-nowrap cursor-pointer hover:text-gold-300 ${fi.sort === 'Δ' + k ? 'text-gold-300' : ''}" data-kd-fsort="${k}">${l}<span>${fi.sort === 'Δ' + k ? (fi.dir < 0 ? ' ▼' : ' ▲') : ''}</span></th>`;
    return `<div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
        ${tile('Beteiligt', `${part.length} / ${D.rows.length}`)}${tile('Kill-Punkte', sum('kp'), 'text-emerald-300')}${tile('T4+T5 Kills', sum('t45'), 'text-emerald-300')}${tile('Tote', sum('d'), 'text-red-300')}${tile('Power', sum('p'), sum('p') < 0 ? 'text-red-300' : 'text-emerald-300')}</div>
      <p class="text-[11px] text-slate-500">Nur Spieler, die in beiden Scans sind. Beteiligt = Kill-Punkte oder Tote gestiegen.${D.missing ? ` <span>${D.missing}</span> <span>Spieler aus dem Nachher-Scan fehlen im Vorher-Scan.</span>` : ''}</p>
      <div class="grid gap-2 sm:grid-cols-3">${top('kp', 'Top Kill-Punkte', '⚔️')}${top('t45', 'Top T4+T5 Kills', '🗡️')}${top('d', 'Top Tote', '💀')}</div>
      ${allies.length > 1 ? `<div class="overflow-x-auto rounded-xl border border-ink-700"><table class="w-full text-xs"><thead class="bg-ink-950/80"><tr class="text-[10px] uppercase tracking-widest text-slate-500"><th class="text-left py-1.5 px-2 font-medium">Allianz</th><th class="text-right px-2 font-medium">Beteiligt</th><th class="text-right px-2 font-medium">Kill-Punkte</th><th class="text-right px-2 font-medium">T4+T5 Kills</th><th class="text-right px-2 font-medium">Tote</th></tr></thead>
        <tbody>${allies.map((o) => `<tr class="border-t border-ink-700/60"><td class="py-1.5 px-2 font-semibold text-slate-100" ${o.a ? 'translate="no"' : ''}>${o.a ? esc(o.a) : '<span class="text-slate-500 font-normal">ohne Allianz</span>'}</td><td class="px-2 text-right tabular-nums">${o.n}</td><td class="px-2 text-right">${delta(o.kp, 'text-xs')}</td><td class="px-2 text-right">${delta(o.t45, 'text-xs')}</td><td class="px-2 text-right">${delta(o.d, 'text-xs')}</td></tr>`).join('')}</tbody></table></div>` : ''}
      <input type="search" data-kd-fq value="${esc(fi.q)}" placeholder="Name, ID oder Allianz" class="${inp}">
      <div id="kdFiBody" class="overflow-x-auto rounded-xl border border-ink-700"><table class="w-full text-sm"><thead class="bg-ink-950/80"><tr class="text-[10px] uppercase tracking-widest text-slate-500"><th class="py-1.5 px-2 font-medium text-left">#</th><th class="py-1.5 px-2 font-medium text-left cursor-pointer hover:text-gold-300" data-kd-fsort="n">Statthalter</th>${FKEYS.map(([k, l]) => th(k, l)).join('')}</tr></thead>
        <tbody>${list.map((r, i) => `<tr class="border-t border-ink-700/60 hover:bg-ink-800/40 ${r.part ? '' : 'opacity-50'}"><td class="py-1.5 px-2 text-slate-500 tabular-nums">${i + 1}</td>
          <td class="py-1.5 px-2 min-w-[10rem]"><div class="font-semibold text-slate-100 truncate max-w-[14rem]" translate="no">${esc(r.n || '?')}</div><div class="text-[11px] text-slate-500"><span class="tabular-nums" translate="no">ID ${esc(r.id)}</span>${r.a ? ` · <span translate="no">${esc(r.a)}</span>` : ''}</div></td>
          ${FKEYS.map(([k]) => `<td class="py-1.5 px-2 text-right">${r[k] == null ? '<span class="text-slate-600">–</span>' : delta(r[k], 'text-sm')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function fightsHTML() {
    if (fi.noTable) return `<div class="text-sm text-amber-300">⚠ Die Tabelle „kingdom_fights“ fehlt noch in Supabase. Bitte das SQL aus dem Chat ausführen.</div>`;
    if (!fi.loaded) return '<p class="text-sm text-slate-500 text-center py-6">⏳ Wird geladen …</p>';
    const scOpt = (val) => sc.list.map((x) => `<option value="${esc(x.id)}" ${x.id === val ? 'selected' : ''}>${scDate(x.scanned_at)} · ${esc(x.name)}</option>`).join('');
    const f = fi.form;
    const form = !canManage() ? '' : !f ? `<div>${btn('data-kd-fnew', '➕ Kampf auswerten', 'gold')}</div>` : !sc.list.length ? `<div class="text-xs text-amber-300">Lade zuerst unter 🌿 Offseason → 📊 Top 300 die Scans vor und nach dem Kampf hoch.</div>` : `
      <div class="rounded-xl border border-gold-500/50 bg-gold-500/5 p-3 grid gap-2 sm:grid-cols-3 items-end">
        <label class="text-xs text-slate-400">Kampf<select data-kd-ff="kind" class="${inp} mt-1">${Object.entries(FIGHT).map(([k, [i, l]]) => `<option value="${k}" ${f.kind === k ? 'selected' : ''}>${i} ${l}</option>`).join('')}</select></label>
        <label class="text-xs text-slate-400">KvK / Season<input type="text" maxlength="40" data-kd-ff="kvk" value="${esc(f.kvk)}" placeholder="z. B. KvK 3 – Heroic Anthem" class="mt-1 ${inp}"></label>
        <label class="text-xs text-slate-400">Titel (optional)<input type="text" maxlength="60" data-kd-ff="title" value="${esc(f.title)}" placeholder="z. B. gegen 2911" class="mt-1 ${inp}"></label>
        <label class="text-xs text-slate-400">Scan vorher<select data-kd-ff="before" class="${inp} mt-1"><option value="">– wählen –</option>${scOpt(f.before)}</select></label>
        <label class="text-xs text-slate-400">Scan nachher<select data-kd-ff="after" class="${inp} mt-1"><option value="">– wählen –</option>${scOpt(f.after)}</select></label>
        <label class="text-xs text-slate-400">Datum des Kampfs<input type="date" data-kd-ff="date" value="${esc(f.date)}" class="mt-1 ${inp} [color-scheme:dark]"></label>
        <label class="text-xs text-slate-400 sm:col-span-2">Notiz<input type="text" maxlength="300" data-kd-ff="note" value="${esc(f.note)}" class="mt-1 ${inp}"></label>
        <div class="flex gap-2 justify-end">${btn('data-kd-fsave' + (fi.busy ? ' disabled' : ''), fi.busy ? '⏳ Speichere …' : '💾 Speichern', 'gold')}${btn('data-kd-fcancel', 'Abbrechen', 'red')}</div>
        <p class="sm:col-span-3 text-[11px] text-slate-500">So geht's: direkt vor dem Kampf mit RokTracker scannen und hochladen, direkt danach noch einmal – dann hier beide Scans wählen.</p></div>`;
    const groups = new Map(); fi.list.forEach((x) => { const k = x.kvk || ''; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(x); });
    const nameOf = (id) => { const s0 = sc.list.find((x) => x.id === id); return s0 ? `${scDate(s0.scanned_at)} · ${esc(s0.name)}` : '<span class="text-red-300">Scan gelöscht</span>'; };
    return `${form}
      ${!fi.list.length ? `<div class="text-center py-6"><div class="text-4xl mb-2">⚔️</div><p class="text-sm text-slate-300">Noch keine Kampf-Auswertung.</p><p class="text-xs text-slate-500 mt-1">Zone 5, Altar, Pass 7, Kingsland … – jeweils mit einem Scan vorher und nachher. Dann siehst du, wer gekämpft hat.</p></div>` :
      [...groups].map(([kvk, arr]) => `<div class="flex flex-col gap-2"><div class="text-[11px] uppercase tracking-widest text-slate-500 mt-1">${kvk ? `🏆 <span translate="no">${esc(kvk)}</span>` : 'Ohne KvK-Angabe'}</div>
        ${arr.map((x) => { const [ico, lab] = FIGHT[x.kind] || FIGHT.other, open = fi.open === x.id; return `<div class="rounded-xl border ${open ? 'border-gold-500/60' : 'border-ink-700'} bg-ink-950/40">
          <button type="button" data-kd-fopen="${esc(x.id)}" class="w-full flex flex-wrap items-center gap-3 px-3 py-2.5 text-left hover:bg-ink-800/40 rounded-xl">
            <span class="text-2xl">${ico}</span><span class="min-w-0 flex-1"><b class="text-slate-100">${lab}</b>${x.title ? ` · <span class="text-slate-300" translate="no">${esc(x.title)}</span>` : ''}
              <span class="block text-xs text-slate-500">${scDate(x.fight_date)} · ${nameOf(x.scan_before)} → ${nameOf(x.scan_after)}</span>${x.note ? `<span class="block text-xs text-slate-400">${esc(x.note)}</span>` : ''}</span>
            <span class="text-xs text-gold-300">${open ? '▲ zu' : '▼ Auswertung'}</span></button>
          ${open ? `<div class="px-3 pb-3 flex flex-col gap-3">${fightHTML(x)}${canManage() ? `<div class="text-right">${btn(`data-kd-fdel="${esc(x.id)}"`, '🗑 Auswertung löschen', 'red')}</div>` : ''}</div>` : ''}</div>`; }).join('')}</div>`).join('')}`;
  }

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
      ${st.myReqs.length ? card('⏳ Deine Beitrittsanfrage', st.myReqs.map((r) => { const k = st.kdById[r.kingdom_id] || {}; return `<div class="flex flex-wrap items-center gap-3 rounded-xl border border-sky-500/40 bg-sky-500/5 px-3 py-2">
        <span class="min-w-0 flex-1"><b class="text-slate-100">🏰 <span translate="no">${esc(k.name || '?')}</span>${k.number ? ` #${esc(k.number)}` : ''}</b><span class="block text-xs text-slate-400">Wartet auf Bestätigung durch R4/R5 · deine ID <span class="tabular-nums" translate="no">${esc(r.governor_id || '–')}</span></span></span>
        ${btn(`data-kd-unreq="${esc(r.kingdom_id)}"`, 'Zurückziehen', 'red')}</div>`; }).join('')) : ''}
      ${card('🔎 Königreich beitreten', `<p class="text-xs text-slate-500">Such dein Königreich über die Nummer und frag an. Ein R4 oder R5 prüft deine Governor-ID und nimmt dich auf.</p>
        <div class="flex gap-2"><input type="text" inputmode="numeric" maxlength="5" data-kd-jq value="${esc(st.join.q)}" placeholder="z. B. 3079" class="${inp}">${btn('data-kd-jsearch' + (st.join.busy ? ' disabled' : ''), st.join.busy ? '⏳ …' : '🔍 Suchen')}</div>
        ${st.join.res.length ? `<div class="flex flex-col gap-2">${st.join.res.map((k) => { const req = st.myReqs.some((r) => r.kingdom_id === k.id); return `<div class="flex flex-wrap items-center gap-3 rounded-xl border border-ink-600 bg-ink-950/50 px-3 py-2">
          <span class="min-w-0 flex-1"><b class="text-slate-100">🏰 <span translate="no">${esc(k.name)}</span> #${esc(k.number || '')}</b><span class="block text-xs text-slate-400">${+k.members || 0} Mitglieder · R5: <span translate="no">${esc(u(k.owner).username || '?')}</span></span></span>
          ${req ? '<span class="text-xs text-sky-300">⏳ angefragt</span>' : btn(`data-kd-req="${esc(k.id)}"`, '📨 Beitritt anfragen', 'gold')}</div>`; }).join('')}</div>` : st.join.searched ? '<p class="text-xs text-slate-500">Kein Königreich mit dieser Nummer gefunden – vielleicht hat es noch niemand angelegt.</p>' : ''}`)}
      ${!st.admin ? '' : card('🏰 Königreich gründen', `<p class="text-xs text-slate-500">Du wirst R5 und kannst Mitglieder über ihre Governor-ID einladen. Nur Mitglieder sehen das Königreich.</p>
        <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto] items-end">
          <label class="text-xs text-slate-400">Name<input type="text" maxlength="40" data-kd-cre="name" value="${esc(st.cre.name)}" placeholder="z. B. Saints of 79" class="mt-1 ${inp}"></label>
          <label class="text-xs text-slate-400">Königreich-Nr.<input type="text" inputmode="numeric" maxlength="5" data-kd-cre="number" value="${esc(st.cre.number)}" placeholder="1079" class="mt-1 ${inp}"></label>
          ${btn('data-kd-create' + (st.busy ? ' disabled' : ''), '👑 Gründen', 'gold')}
        </div>`)}
      <p class="text-xs text-slate-500">${st.admin ? '' : '<span>Neue Königreiche legt der Admin an.</span> '}Hat dein R5 das Königreich schon angelegt? Dann oben bei „Königreich beitreten“ anfragen – oder er lädt dich direkt über deine Governor-ID ein.</p>`;
  }
  function membersHTML() {
    const groups = [5, 4, 3, 2, 1].map((r) => ({ r, list: st.mem.filter((m) => (m.user_id === st.kd.owner ? 5 : +m.rank || 1) === r) })).filter((g) => g.list.length);
    const row = (m) => { const x = u(m.user_id), own = m.user_id === me(); return `<div class="flex items-center gap-3 py-2 border-b border-ink-700/60 last:border-0">
        <button type="button" data-kd-prof="${esc(m.user_id)}" class="flex items-center gap-2.5 min-w-0 flex-1 text-left rounded-lg hover:bg-ink-800/60 pr-2">${R.userLine(x)}${x.governor_id ? `<span class="ml-auto text-[11px] text-slate-500 tabular-nums">ID ${esc(x.governor_id)}</span>` : ''}</button>
        ${st.kd.owner === m.user_id ? '<span class="text-[11px] px-2 py-1 rounded-lg border border-gold-500/40 text-gold-300 whitespace-nowrap">👑 Gründer</span>' : ''}${canManage() && st.kd.owner !== m.user_id ? `<select data-kd-rank="${esc(m.user_id)}" class="bg-ink-950 border border-ink-600 rounded-lg px-2 py-1 text-xs">${[5, 4, 3, 2, 1].filter((r) => isOwner() || r < 5).map((r) => `<option value="${r}" ${(+m.rank || 1) === r ? 'selected' : ''}>${RANK[r][0]} R${r}</option>`).join('')}</select>
        ${!own ? btn(`data-kd-kick="${esc(m.user_id)}"`, '✕', 'red') : ''}` : ''}</div>`; };
    const vr = (rq) => { const gid = String(rq.governor_id || ''), x = st.verify && st.verify.by.get(gid);
      return !st.verify ? '<span class="text-amber-300">⚠ Kein Top-300-Scan zum Abgleichen – ID im Spiel prüfen</span>'
        : x ? `<span class="text-emerald-300">✓ Im Scan vom ${new Date(st.verify.date + 'T12:00:00').toLocaleDateString('de-DE')}: <b translate="no">${esc(x.n || '?')}</b>${x.a ? ` · <span translate="no">${esc(x.a)}</span>` : ''}${x.p ? ` · Power ${Math.round(x.p).toLocaleString('de-DE')}` : ''}</span>`
        : '<span class="text-amber-300">⚠ ID nicht im letzten Top-300-Scan – genau prüfen</span>'; };
    const reqs = canManage() && st.requests.length ? `<div class="rounded-xl border border-sky-500/40 bg-sky-500/5 p-3 mb-2"><div class="text-[11px] uppercase tracking-widest text-sky-300 mb-1">📝 Beitrittsanfragen · ${st.requests.length}</div>
      ${st.requests.map((rq) => `<div class="flex flex-wrap items-center gap-3 py-2 border-b border-ink-700/60 last:border-0">
        <button type="button" data-kd-prof="${esc(rq.user_id)}" class="flex items-center gap-2.5 min-w-0 text-left rounded-lg hover:bg-ink-800/60 pr-2">${R.userLine(u(rq.user_id))}</button>
        <div class="min-w-0 flex-1 text-xs"><div class="text-slate-300">Governor-ID <b class="tabular-nums text-slate-100" translate="no">${esc(rq.governor_id || '–')}</b></div><div>${vr(rq)}</div></div>
        ${btn(`data-kd-rq="${esc(rq.user_id)}|1"`, '✓ Bestätigen', 'gold')}${btn(`data-kd-rq="${esc(rq.user_id)}|0"`, 'Ablehnen', 'red')}</div>`).join('')}
      <p class="text-[11px] text-slate-500 mt-1">Erst bestätigen, wenn die ID im Spiel zu diesem Spieler gehört (Profil im Spiel öffnen → ID vergleichen).</p></div>` : '';
    return `${reqs}${groups.map((g) => `<div><div class="text-[11px] uppercase tracking-widest text-slate-500 mt-2 mb-1">${RANK[g.r][0]} ${RANK[g.r][1]} · ${g.list.length}</div>${g.list.map(row).join('')}</div>`).join('')}
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
    const k = st.kd, AREAS = { off: [['members', `👥 Mitglieder · ${st.mem.length}${canManage() && st.requests.length ? ` · 📝 ${st.requests.length}` : ''}`], ['feed', '💬 Feed'], ['events', '📅 Ereignisse'], ['scan', '📊 Top 300']],
      kvk: [['kvk', '🗓️ KvK-Planung'], ['fights', '⚔️ Kämpfe'], ['autarch', '👑 Autarchen']] }, tabs = AREAS[st.area] || AREAS.off;
    const next = st.events.filter((e) => new Date(e.starts_at).getTime() > Date.now()).sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))[0];
    return `<div class="panel rounded-2xl p-4 sm:p-5 flex flex-wrap items-center gap-4">
        <div class="w-16 h-16 rounded-2xl grid place-items-center text-3xl bg-gradient-to-br from-gold-300 to-gold-600 text-ink-950 shadow-[0_0_20px_rgba(245,197,66,.35)]">🏰</div>
        <div class="min-w-0 flex-1"><div class="font-display text-2xl gold-text truncate">${esc(k.name)}${k.number ? ` <span class="text-slate-400 text-lg">#${esc(k.number)}</span>` : ''}</div>
          <div class="text-xs text-slate-400">${st.mem.length} Mitglieder · R5: <b class="text-slate-200">${esc(u(k.owner).username || '?')}</b> · du bist ${RANK[myRank()] ? RANK[myRank()][0] + ' R' + myRank() : '–'}</div>
          ${next ? `<div class="mt-1 text-xs"><span class="text-slate-500">Nächstes:</span> <b class="text-gold-300">${next.kind === 'kvk' ? '⚔️' : '📅'} ${esc(next.title)}</b> · ${when(next.starts_at)} · <span data-kd-cd="${esc(next.starts_at)}" class="font-mono text-gold-200">${cd(next.starts_at)}</span></div>` : ''}</div>
        <div class="flex flex-wrap gap-2">${btn('data-kd-reload', '↻')}${isOwner() ? btn('data-kd-delete', '🗑 Löschen', 'red') : btn('data-kd-leave', 'Verlassen', 'red')}</div>
      </div>
      <div class="grid grid-cols-2 gap-2" role="tablist">${[['off', '🌿 Offseason', 'Mitglieder, Feed, Ereignisse, Top 300'], ['kvk', '⚔️ KvK', 'Planung, Kämpfe, Autarchen']].map(([a, l, sub]) => `<button type="button" data-kd-area="${a}" aria-pressed="${st.area === a}" class="seg-btn rounded-xl px-3 py-3 border border-ink-600 bg-ink-950 transition text-left"><span class="block font-display text-lg font-bold">${l}</span><span class="block text-[11px] opacity-70">${sub}</span></button>`).join('')}</div>
      <div class="grid grid-cols-2 ${tabs.length === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-1 p-1 rounded-xl bg-ink-950 border border-ink-700" role="tablist">${tabs.map(([k0, l]) => `<button type="button" data-kd-tab="${k0}" aria-pressed="${st.tab === k0}" class="seg-btn rounded-lg px-2 py-2 text-xs sm:text-sm font-semibold border border-ink-600 transition">${l}</button>`).join('')}</div>
      ${st.tab === 'members' ? card('👥 Mitglieder', membersHTML()) : st.tab === 'feed' ? card('💬 Königreich-Feed', feedHTML()) : st.tab === 'events' ? card('📅 Ereignisse', eventsHTML('event')) : st.tab === 'kvk' ? card('🗓️ KvK-Planung', eventsHTML('kvk')) : st.tab === 'fights' ? card('⚔️ Kämpfe auswerten', fightsHTML()) : st.tab === 'scan' ? card('📊 Top 300 – Königreichs-Scan', scanHTML()) : card('👑 Autarch-Liste', autarchHTML())}`;
  }
  function msg(t, tone) { st.msg = [t, tone]; const el = $('kdMsg'); if (!el) return; el.textContent = t; el.className = 'text-xs min-h-[1em] ' + ({ ok: 'text-emerald-400', warn: 'text-amber-300', err: 'text-red-300', busy: 'text-slate-300' }[tone] || 'text-slate-500'); }
  function render() {
    if (!root) return;
    const act = document.activeElement, focusAttr = act && root.contains(act) ? ['data-kd-hq', 'data-kd-fq', 'data-kd-jq'].find((a) => act.hasAttribute(a)) : null;
    killCharts();
    const keep = {}; root.querySelectorAll('[data-kd-cre],[data-kd-ev],[data-kd-au],[data-kd-q],#kdPostText').forEach((el) => { keep[el.id || el.dataset.kdCre || el.dataset.kdEv || el.dataset.kdAu || 'q'] = el.value; });
    root.innerHTML = `<div class="flex flex-wrap items-end justify-between gap-3"><div><h2 class="font-display text-2xl gold-text">🏰 My Kingdom</h2><p class="text-xs text-slate-500">Nur für Mitglieder deines Königreichs sichtbar</p></div></div>
      <div id="kdMsg" class="text-xs min-h-[1em]"></div>
      ${st.noTable ? `<div class="panel rounded-2xl p-5 text-sm text-amber-300">⚠ Die Königreich-Tabellen fehlen noch in Supabase. Bitte das SQL aus dem Chat ausführen.</div>` : ''}
      ${st.err ? `<div class="panel rounded-2xl p-5 text-sm text-red-300">⚠ ${esc(st.err)}</div>` : ''}
      ${!st.loaded ? '<p class="text-sm text-slate-500 text-center py-6">⏳ Wird geladen …</p>' : st.kd ? kdHTML() : noKdHTML()}`;
    if (keep.q != null) { const q = root.querySelector('[data-kd-q]'); if (q) q.value = keep.q; }
    if (keep.kdPostText != null && $('kdPostText')) $('kdPostText').value = keep.kdPostText;
    msg(st.msg[0], st.msg[1]);
    if (focusAttr) { const el = root.querySelector(`[${focusAttr}]`); if (el) { el.focus(); try { el.setSelectionRange(el.value.length, el.value.length); } catch {} } }
    if (st.tab === 'scan' && sc.view === 'hist') setTimeout(drawCharts, 0);
  }
  root.addEventListener('input', (ev) => { const el = ev.target;
    if (el.dataset.kdCre) st.cre[el.dataset.kdCre] = el.value;
    if (el.dataset.kdEv) st.evForm[el.dataset.kdEv] = el.value;
    if (el.dataset.kdAu) st.auForm[el.dataset.kdAu] = el.value;
    if (el.hasAttribute('data-kd-q')) st.q = el.value;
    if (el.hasAttribute('data-kd-jq')) st.join.q = el.value;
    if (el.hasAttribute('data-kd-hq')) { st.sc.hq = el.value; render(); }
    if (el.hasAttribute('data-kd-fq')) { st.fi.q = el.value; render(); }
    if (el.dataset.kdFf && st.fi.form && el.tagName !== 'SELECT') st.fi.form[el.dataset.kdFf] = el.value;
    if (el.hasAttribute('data-kd-sc-q')) { st.sc.q = el.value; st.sc.showAll = false; scRefreshBody(); }
    if (el.dataset.kdScUp && st.sc.up) st.sc.up[el.dataset.kdScUp] = el.value; });
  root.addEventListener('change', (ev) => { const el = ev.target; if (el.dataset.kdRank) setRank(el.dataset.kdRank, +el.value);
    if (el.dataset.kdScPick) scPick(el.dataset.kdScPick, el.value);
    if (el.dataset.kdFf && st.fi.form && el.tagName === 'SELECT') { st.fi.form[el.dataset.kdFf] = el.value; if (el.dataset.kdFf === 'after') { const x = st.sc.list.find((y) => y.id === el.value); if (x) st.fi.form.date = x.scanned_at; } render(); }
    if (el.hasAttribute('data-kd-sc-allysel')) { st.sc.ally = el.value; st.sc.showAll = false; render(); }
    if (el.hasAttribute('data-kd-sc-sortsel')) { st.sc.sort = el.value; st.sc.dir = -1; render(); }
    if (el.hasAttribute('data-kd-sc-file')) { scFile(el.files && el.files[0]); el.value = ''; } });
  root.addEventListener('keydown', (ev) => { if (ev.key !== 'Enter') return; const el = ev.target; if (el.hasAttribute('data-kd-q')) { ev.preventDefault(); search(); } if (el.hasAttribute('data-kd-jq')) { ev.preventDefault(); joinSearch(); } if (el.id === 'kdPostText') { ev.preventDefault(); postKd(); } });
  root.addEventListener('click', (ev) => {
    const t = ev.target, c = (a) => t.closest(`[${a}]`);
    let b;
    if (c('data-kd-create')) create();
    else if ((b = c('data-kd-inv'))) { const [kid, ok] = b.dataset.kdInv.split('|'); answerInvite(kid, ok === '1'); }
    else if ((b = c('data-kd-area'))) { st.area = b.dataset.kdArea; st.tab = st.area === 'kvk' ? 'kvk' : 'members'; render(); }
    else if ((b = c('data-kd-tab'))) { st.tab = b.dataset.kdTab; render(); if (st.tab === 'scan' && !st.sc.loaded) loadScans(); if (st.tab === 'fights' && !st.fi.loaded) loadFights(); }
    else if ((b = c('data-kd-scview'))) { st.sc.view = b.dataset.kdScview; render(); if (st.sc.view === 'hist') loadAllRows(); }
    else if ((b = c('data-kd-hpick'))) { st.sc.hid = b.dataset.kdHpick; render(); }
    else if ((b = c('data-kd-fsort'))) { const k = 'Δ' + b.dataset.kdFsort; if (st.fi.sort === k) st.fi.dir *= -1; else { st.fi.sort = k; st.fi.dir = -1; } render(); }
    else if (c('data-kd-fnew')) { const L = [...st.sc.list].sort((a, z) => String(z.scanned_at).localeCompare(String(a.scanned_at))); st.fi.form = { kind: 'zone5', kvk: st.fi.list[0]?.kvk || '', title: '', before: L[1]?.id || '', after: L[0]?.id || '', date: L[0]?.scanned_at || today(), note: '' }; render(); }
    else if (c('data-kd-fsave')) saveFight();
    else if (c('data-kd-fcancel')) { st.fi.form = null; render(); }
    else if ((b = c('data-kd-fopen'))) openFight(b.dataset.kdFopen);
    else if ((b = c('data-kd-fdel'))) delFight(b.dataset.kdFdel);
    else if ((b = c('data-kd-sc-sort'))) { const k = b.dataset.kdScSort; if (st.sc.sort === k) st.sc.dir *= -1; else { st.sc.sort = k; st.sc.dir = -1; } render(); }
    else if ((b = c('data-kd-sc-ally'))) { st.sc.ally = st.sc.ally === b.dataset.kdScAlly ? '' : b.dataset.kdScAlly; st.sc.showAll = false; render(); }
    else if (c('data-kd-sc-all')) { st.sc.showAll = true; scRefreshBody(); }
    else if (c('data-kd-sc-more')) { st.sc.more = !st.sc.more; render(); }
    else if (c('data-kd-sc-save')) scSave();
    else if (c('data-kd-sc-cancel')) { st.sc.up = null; render(); }
    else if ((b = c('data-kd-sc-del'))) scDelete(b.dataset.kdScDel);
    else if (c('data-kd-reload')) load();
    else if (c('data-kd-jsearch')) joinSearch();
    else if ((b = c('data-kd-req'))) requestJoin(b.dataset.kdReq);
    else if ((b = c('data-kd-unreq'))) cancelRequest(b.dataset.kdUnreq);
    else if ((b = c('data-kd-rq'))) { const [uid, ok] = b.dataset.kdRq.split('|'); answerRequest(uid, ok === '1'); }
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
  try { A.isAdmin && A.isAdmin().then((ok) => { st.admin = !!ok; if (st.loaded && !st.kd) render(); }).catch(() => {}); } catch {}
  R.viewHooks.kingdom = () => { if (!st.loaded && !st.loading) load(); else render(); };
};
