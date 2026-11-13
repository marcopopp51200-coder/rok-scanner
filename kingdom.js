// Wiz fan Club – My Kingdom (Reiter oben über Feed / Rangliste / Craft)
// Der R5 gründet das Königreich und lädt Mitglieder über ihre Governor-ID ein – nur Mitglieder sehen es.
// Inhalt: KD-Name & Mitglieder (R5–R1), Königreich-Feed, Ereignisse mit Timer, KvK-Planung, Autarch-Liste, Top 300 (RokTracker-Scans).
// Läuft innerhalb von RokApp (scanner.js); R = geteilter Kontext (window.Rok).
// Supabase: kingdoms · kingdom_members (rank 1–5, status invited|member) · kingdom_posts · kingdom_events (kind event|kvk) · kingdom_autarchs · kingdom_scans
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
    if (st.kd && st.tab === 'scan') { st.sc.loaded = false; loadScans(); }
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
      <div class="grid gap-2 sm:grid-cols-2">
        <label class="text-xs text-slate-400">Scan${sel('data-kd-sc-pick="cur"', sc.cur, sc.list)}</label>
        <label class="text-xs text-slate-400">Vergleichen mit${sel('data-kd-sc-pick="cmp"', sc.cmp, sc.list.filter((x) => x.id !== sc.cur), '— kein Vergleich —')}</label></div>
      ${!sc.rows[sc.cur] ? '<p class="text-sm text-slate-500 text-center py-4">⏳ Wird geladen …</p>' : `
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
    const k = st.kd, tabs = [['members', `👥 Mitglieder · ${st.mem.length}`], ['feed', '💬 Feed'], ['events', '📅 Ereignisse'], ['kvk', '⚔️ KvK-Planung'], ['autarch', '👑 Autarchen'], ['scan', '📊 Top 300']];
    const next = st.events.filter((e) => new Date(e.starts_at).getTime() > Date.now()).sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))[0];
    return `<div class="panel rounded-2xl p-4 sm:p-5 flex flex-wrap items-center gap-4">
        <div class="w-16 h-16 rounded-2xl grid place-items-center text-3xl bg-gradient-to-br from-gold-300 to-gold-600 text-ink-950 shadow-[0_0_20px_rgba(245,197,66,.35)]">🏰</div>
        <div class="min-w-0 flex-1"><div class="font-display text-2xl gold-text truncate">${esc(k.name)}${k.number ? ` <span class="text-slate-400 text-lg">#${esc(k.number)}</span>` : ''}</div>
          <div class="text-xs text-slate-400">${st.mem.length} Mitglieder · R5: <b class="text-slate-200">${esc(u(k.owner).username || '?')}</b> · du bist ${RANK[myRank()] ? RANK[myRank()][0] + ' R' + myRank() : '–'}</div>
          ${next ? `<div class="mt-1 text-xs"><span class="text-slate-500">Nächstes:</span> <b class="text-gold-300">${next.kind === 'kvk' ? '⚔️' : '📅'} ${esc(next.title)}</b> · ${when(next.starts_at)} · <span data-kd-cd="${esc(next.starts_at)}" class="font-mono text-gold-200">${cd(next.starts_at)}</span></div>` : ''}</div>
        <div class="flex flex-wrap gap-2">${btn('data-kd-reload', '↻')}${isOwner() ? btn('data-kd-delete', '🗑 Löschen', 'red') : btn('data-kd-leave', 'Verlassen', 'red')}</div>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 p-1 rounded-xl bg-ink-950 border border-ink-700" role="tablist">${tabs.map(([k0, l]) => `<button type="button" data-kd-tab="${k0}" aria-pressed="${st.tab === k0}" class="seg-btn rounded-lg px-2 py-2 text-xs sm:text-sm font-semibold border border-ink-600 transition">${l}</button>`).join('')}</div>
      ${st.tab === 'members' ? card('👥 Mitglieder', membersHTML()) : st.tab === 'feed' ? card('💬 Königreich-Feed', feedHTML()) : st.tab === 'events' ? card('📅 Ereignisse', eventsHTML('event')) : st.tab === 'kvk' ? card('⚔️ KvK-Planung', eventsHTML('kvk')) : st.tab === 'scan' ? card('📊 Top 300 – Königreichs-Scan', scanHTML()) : card('👑 Autarch-Liste', autarchHTML())}`;
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
    if (el.hasAttribute('data-kd-q')) st.q = el.value;
    if (el.hasAttribute('data-kd-sc-q')) { st.sc.q = el.value; st.sc.showAll = false; scRefreshBody(); }
    if (el.dataset.kdScUp && st.sc.up) st.sc.up[el.dataset.kdScUp] = el.value; });
  root.addEventListener('change', (ev) => { const el = ev.target; if (el.dataset.kdRank) setRank(el.dataset.kdRank, +el.value);
    if (el.dataset.kdScPick) scPick(el.dataset.kdScPick, el.value);
    if (el.hasAttribute('data-kd-sc-allysel')) { st.sc.ally = el.value; st.sc.showAll = false; render(); }
    if (el.hasAttribute('data-kd-sc-sortsel')) { st.sc.sort = el.value; st.sc.dir = -1; render(); }
    if (el.hasAttribute('data-kd-sc-file')) { scFile(el.files && el.files[0]); el.value = ''; } });
  root.addEventListener('keydown', (ev) => { if (ev.key !== 'Enter') return; const el = ev.target; if (el.hasAttribute('data-kd-q')) { ev.preventDefault(); search(); } if (el.id === 'kdPostText') { ev.preventDefault(); postKd(); } });
  root.addEventListener('click', (ev) => {
    const t = ev.target, c = (a) => t.closest(`[${a}]`);
    let b;
    if (c('data-kd-create')) create();
    else if ((b = c('data-kd-inv'))) { const [kid, ok] = b.dataset.kdInv.split('|'); answerInvite(kid, ok === '1'); }
    else if ((b = c('data-kd-tab'))) { st.tab = b.dataset.kdTab; render(); if (st.tab === 'scan' && !st.sc.loaded) loadScans(); }
    else if ((b = c('data-kd-sc-sort'))) { const k = b.dataset.kdScSort; if (st.sc.sort === k) st.sc.dir *= -1; else { st.sc.sort = k; st.sc.dir = -1; } render(); }
    else if ((b = c('data-kd-sc-ally'))) { st.sc.ally = st.sc.ally === b.dataset.kdScAlly ? '' : b.dataset.kdScAlly; st.sc.showAll = false; render(); }
    else if (c('data-kd-sc-all')) { st.sc.showAll = true; scRefreshBody(); }
    else if (c('data-kd-sc-more')) { st.sc.more = !st.sc.more; render(); }
    else if (c('data-kd-sc-save')) scSave();
    else if (c('data-kd-sc-cancel')) { st.sc.up = null; render(); }
    else if ((b = c('data-kd-sc-del'))) scDelete(b.dataset.kdScDel);
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
