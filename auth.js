// ================= Supabase: Login + Cloud-Speicher =================
// Die App arbeitet wie bisher mit einem lokalen Zwischenspeicher (localStorage, pro Nutzer).
// Jede Änderung wird automatisch in Supabase gespeichert:
//   • Verlaufseinträge (Scans)    → Tabelle public.scans      (eine Zeile pro Scan)
//   • alles andere (Farmen, letzte Auswertung, Ziel-Level, Filter …) → Tabelle public.user_state
// Beim Login werden die Daten aus der Cloud geladen – auf jedem Gerät dieselben.
window.RokAuth = (() => {
  const SUPABASE_URL = 'https://tqkhnicaiokyckiqwvpw.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxa2huaWNhaW9reWNraXF3dnB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1Nzg0NjcsImV4cCI6MjEwNzE1NDQ2N30.8bNhMl2ewyIKh_PqSvGKf34stNIbXfXiOhEPFXDOev0';
  // Accounts nur mit Benutzernamen bekommen intern diese Ersatz-E-Mail (wird nie angeschrieben).
  const USERNAME_DOMAIN = 'users.rok-scanner.app';
  const HIST = 'history_v1';
  const DELQ = 'delete_queue';   // nur hier gemerkte IDs werden in der Cloud gelöscht (= vom Nutzer selbst gelöscht)
  const UNSYNCED = 'unsynced_scans';   // Scans, die public.scans (noch) nicht annimmt

  const $ = (id) => document.getElementById(id);
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch { return false; } };
  const lsDel = (k) => { try { localStorage.removeItem(k); } catch {} };
  const lsKeys = (prefix) => { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(prefix)) out.push(k); } } catch {} return out; };
  try { localStorage.removeItem('rok_scanner_api_key'); } catch {}

  let sb = null;
  try { sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } }); } catch {}

  let user = null, profile = null, NS = '', PENDING = '';
  let speedWarn = false, lastFailedTypes = [];
  let synced = new Map(), lastState = '{}', timer = null, retryTimer = null, queue = Promise.resolve(), hasPending = false;
  const nsOf = (id) => 'rok_cloud_' + id + '_';

  // ---------- Hilfsfunktionen ----------
  const usernameToEmail = (name) => {
    const local = name.trim().toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9._-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '');
    return local ? `${local}@${USERNAME_DOMAIN}` : '';
  };
  const toEmail = (id) => id.includes('@') ? id.trim().toLowerCase() : usernameToEmail(id);
  const displayName = (u) => u?.user_metadata?.username || (u?.email || '').split('@')[0] || 'Spieler';
  function germanError(e) {
    const m = String(e?.message || e || '');
    if (/invalid login credentials/i.test(m)) return 'Benutzername oder Passwort ist falsch.';
    if (/already registered|already exists/i.test(m)) return 'Diesen Account gibt es schon – bitte einloggen.';
    if (/email not confirmed/i.test(m)) return 'Bitte bestätige zuerst deine E-Mail-Adresse (Link im Postfach).';
    if (/password should be at least/i.test(m)) return 'Das Passwort ist zu kurz (mind. 6 Zeichen).';
    if (/email.*invalid|invalid.*email/i.test(m)) return 'Diese E-Mail-Adresse wird nicht akzeptiert. Bei reinen Benutzernamen: siehe Hinweis zur Einrichtung (E-Mail-Bestätigung ausschalten).';
    if (/not authorized|signups not allowed/i.test(m)) return 'Registrierung ist in Supabase gerade nicht erlaubt (Auth-Einstellungen prüfen).';
    if (/rate limit|too many/i.test(m)) return 'Zu viele Versuche – bitte kurz warten.';
    if (/failed to fetch|network/i.test(m)) return 'Keine Verbindung zur Cloud. Internet prüfen.';
    if (/relation .* does not exist|could not find the table/i.test(m)) return 'Die Datenbank-Tabellen fehlen – bitte das SQL im Supabase SQL Editor ausführen.';
    return m || 'Unbekannter Fehler.';
  }

  // ---------- Overlay ----------
  const msg = (id, m) => { $(id).textContent = m || ''; $(id).classList.toggle('hidden', !m); };
  function showLoading(text, retry) {
    $('authOverlay').classList.remove('hidden'); document.body.style.overflow = 'hidden';
    $('authLoading').classList.remove('hidden'); $('authForms').classList.add('hidden');
    $('authLoadingText').textContent = text;
    $('authRetry').classList.toggle('hidden', !retry);
    $('authRetry').onclick = retry || null;
  }
  function setTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(b => b.setAttribute('aria-pressed', b.dataset.tab === tab));
    $('loginForm').classList.toggle('hidden', tab !== 'login');
    $('registerForm').classList.toggle('hidden', tab !== 'register');
    msg('authError', '');
    setTimeout(() => (tab === 'login' ? ($('loginUser').value ? $('loginPass') : $('loginUser')) : $('regUser')).focus(), 30);
  }
  function showLogin(tab = 'login') {
    $('authOverlay').classList.remove('hidden'); document.body.style.overflow = 'hidden';
    $('authLoading').classList.add('hidden'); $('authForms').classList.remove('hidden');
    setTab(tab);
  }
  function hideOverlay() { $('authOverlay').classList.add('hidden'); document.body.style.overflow = ''; }

  // ---------- Sync-Anzeige ----------
  function status(kind, text) {
    const el = $('syncStatus'); if (!el) return;
    el.textContent = text;
    el.className = 'text-[10px] ' + ({ ok: 'text-emerald-400', busy: 'text-slate-400', err: 'text-amber-300' }[kind] || 'text-slate-500');
  }

  // ---------- Löschen nur auf ausdrücklichen Wunsch ----------
  // Früher galt: „fehlt lokal → in der Cloud löschen“. Das ist gefährlich (z. B. leerer Browser-Speicher).
  // Jetzt löscht die Cloud ausschließlich IDs, die der Nutzer selbst über ✕ / Zurücksetzen entfernt hat.
  const readDelQ = () => { try { return (JSON.parse(lsGet(NS + DELQ) || '[]') || []).map(String); } catch { return []; } };
  function markDeleted(ids) {
    if (!user || !ids?.length) return;
    const q = new Set(readDelQ()); ids.forEach(id => q.add(String(id)));
    lsSet(NS + DELQ, JSON.stringify([...q]));
  }

  // ---------- Cloud → lokal ----------
  function readLocalHistory() { try { return JSON.parse(lsGet(NS + HIST) || '[]').filter(e => e && e.id); } catch { return []; } }
  function readLocalState() {
    const st = {};
    lsKeys(NS).forEach(k => { const sfx = k.slice(NS.length); if (sfx !== HIST && sfx !== DELQ) st[sfx] = lsGet(k); });
    return st;
  }
  // Datenstruktur in public.scans
  //   ap:       data = { ap_50, ap_100, ap_500, ap_1000, total_ap }        (Anzahl Flaschen bzw. Summe AP)
  //   speedups: data = { training, heal, universal, building, research, total }   (alles in Minuten)
  //   andere Typen: wie bisher
  const n0 = (v) => Math.max(0, Math.round(+v || 0));
  function dataOf(e) {
    if (e.type === 'ap') return { ap_50: n0(e.ap_50), ap_100: n0(e.ap_100), ap_500: n0(e.ap_500), ap_1000: n0(e.ap_1000), total_ap: n0(e.total_ap) };
    if (e.type === 'materials') {                                     // data = { leather: {white,green,blue,purple,gold}, …, total_legendary }
      const d = {}; ['leather', 'iron', 'ebony', 'bone'].forEach(m => { d[m] = {}; ['white', 'green', 'blue', 'purple', 'gold'].forEach(g => d[m][g] = n0(e[m + '_' + g])); });
      d.chests = {}; ['white', 'green', 'blue', 'purple', 'gold'].forEach(g => d.chests[g] = n0(e['chest_' + g]));
      d.total_legendary = Math.round((+e.total_leg || 0) * 100) / 100;
      return d;
    }
    if (e.type === 'governor') { const nn = (v) => v == null || v === '' || isNaN(+v) ? null : n0(v);
      return { kill_points: nn(e.kill_points), highest_merit: nn(e.highest_merit), energy: nn(e.energy), deads: nn(e.deads), lk_participated: nn(e.lk_participated), acclaim: nn(e.acclaim), ark_wins: nn(e.ark_wins), lk_autarch: nn(e.lk_autarch), units_killed: nn(e.units_killed), units_lost: nn(e.units_lost), units_healed: nn(e.units_healed),
               ...(e.governor_id ? { governor_id: String(e.governor_id) } : {}), ...(e.src ? { src: String(e.src).slice(0, 10) } : {}) }; }
    if (e.type === 'speedups') return { training: n0(e.training), heal: n0(e.healing), universal: n0(e.universal),
                                        building: n0(e.building), research: n0(e.research), total: n0(e.total) };
    return e;
  }
  const rowOf = (e) => ({ id: String(e.id), user_id: user.id, type: e.type, scanned_at: new Date(+e.ts || Date.now()).toISOString(), data: dataOf(e) });
  // Zeile aus public.scans → Verlaufseintrag der App
  function entryOf(r) {
    const d = r.data || {}, e = { ...d, id: String(r.id ?? d.id ?? r.scanned_at), type: r.type, ts: +d.ts || Date.parse(r.scanned_at) };
    if (r.type === 'speedups' && e.healing == null && d.heal != null) e.healing = +d.heal;
    if (r.type === 'ap' && e.total_ap == null && d.ap != null) e.total_ap = +d.ap;      // ältere AP-Einträge
    if (r.type === 'materials') {                                     // verschachtelt → flach (leather_white …)
      ['leather', 'iron', 'ebony', 'bone'].forEach(m => ['white', 'green', 'blue', 'purple', 'gold'].forEach(g => { const v = d[m]?.[g]; if (v != null) e[m + '_' + g] = +v; }));
      ['white', 'green', 'blue', 'purple', 'gold'].forEach(g => { const v = d.chests?.[g]; if (v != null) e['chest_' + g] = +v; });
      if (d.total_legendary != null) e.total_leg = +d.total_legendary;
    }
    return e;
  }

  async function loadCloud() {
    const [scans, state] = await Promise.all([
      sb.from('scans').select('id,type,scanned_at,data').eq('user_id', user.id).order('scanned_at', { ascending: true }),   // nur eigene Zeilen
      sb.from('user_state').select('data').maybeSingle()
    ]);
    if (scans.error) throw scans.error;
    if (state.error) throw state.error;
    const delQ = new Set(readDelQ());                            // noch nicht übertragene Löschungen behalten
    lsKeys(NS).forEach(k => { if (k !== NS + DELQ) lsDel(k); }); // lokalen Zwischenspeicher durch Cloud-Stand ersetzen
    const hist = (scans.data || []).map(entryOf).filter(e => !delQ.has(String(e.id)));
    const st = state.data?.data || {};
    let saved = [];
    try { saved = (JSON.parse(st[UNSYNCED] || '[]') || []).filter(e => e && e.id && !hist.some(h => String(h.id) === String(e.id))); } catch {}
    lsSet(NS + HIST, JSON.stringify([...hist, ...saved].sort((a, b) => (+a.ts || 0) - (+b.ts || 0))));
    synced = new Map(hist.map(e => [String(e.id), JSON.stringify(e)]));   // gesicherte Scans gelten als „noch nicht in scans“ → erneuter Versuch
    Object.entries(st).forEach(([k, v]) => { if (typeof v === 'string' && k !== HIST) lsSet(NS + k, v); });
    lastState = JSON.stringify(readLocalState());
    return { scans: hist.length, stateKeys: Object.keys(st).length };
  }

  // ---------- lokal → Cloud ----------
  async function pushChanges(full = false) {
    const hist = readLocalHistory();
    const cur = new Map(hist.map(e => [String(e.id), JSON.stringify(e)]));
    const up = [...cur].filter(([id, j]) => full || synced.get(id) !== j).map(([, j]) => rowOf(JSON.parse(j)))
      .filter(r => ['resources', 'vip', 'gems', 'speedups', 'ap', 'governor', 'materials'].includes(r.type));
    const delIds = readDelQ().filter(id => !cur.has(id));        // nur selbst gelöschte Einträge
    // Speedups getrennt senden: fehlt das SQL-Update, blockiert das nicht die übrigen Daten
    const isExtra = (r) => ['speedups', 'ap', 'governor', 'materials'].includes(r.type);
    const core = up.filter(r => !isExtra(r)), extra = up.filter(isExtra), failed = [];
    if (core.length) { const { error } = await sb.from('scans').upsert(core, { onConflict: 'user_id,id' }); if (error) throw error; }
    speedWarn = false;
    for (const t of ['speedups', 'ap', 'governor', 'materials']) {                         // je Typ einzeln: lehnt die DB einen Typ ab, blockiert er den anderen nicht
      const rows = extra.filter(r => r.type === t);
      if (!rows.length) continue;
      const { error } = await sb.from('scans').upsert(rows, { onConflict: 'user_id,id' });
      if (error) { console.warn(`Scans vom Typ "${t}" von public.scans abgelehnt – werden im Profil-Speicher (user_state) gesichert`, error); speedWarn = true; failed.push(...rows.map(r => r.id)); }
    }
    // Abgelehnte Scans gehen nicht verloren: sie liegen zusätzlich in user_state und werden beim Laden wieder eingefügt
    lastFailedTypes = [...new Set(extra.filter(r => failed.includes(r.id)).map(r => r.type))];
    const failedRows = hist.filter(e => failed.includes(String(e.id)));
    if (failedRows.length) lsSet(NS + UNSYNCED, JSON.stringify(failedRows)); else lsDel(NS + UNSYNCED);
    if (delIds.length) {
      const { error } = await sb.from('scans').delete().in('id', delIds); if (error) throw error;
      const rest = readDelQ().filter(id => !delIds.includes(id));
      if (rest.length) lsSet(NS + DELQ, JSON.stringify(rest)); else lsDel(NS + DELQ);
      delIds.forEach(id => synced.delete(id));
    }
    const st = readLocalState(), stJson = JSON.stringify(st);
    if (full || stJson !== lastState) {
      const { error } = await sb.from('user_state').upsert({ user_id: user.id, data: st, updated_at: new Date().toISOString() });
      if (error) throw error;
    }
    synced = cur; lastState = stJson;
    failed.forEach(id => synced.delete(id));   // beim nächsten Speichern erneut versuchen
  }
  // Sofort an Supabase senden und melden, ob der Typ in public.scans gelandet ist
  async function saveNow(type) {
    hasPending = true;
    await flushNow();
    if (hasPending) return { ok: false, where: 'none' };              // Netz/Cloud-Fehler → wird automatisch erneut versucht
    return lastFailedTypes.includes(type) ? { ok: true, where: 'user_state' } : { ok: true, where: 'scans' };
  }
  async function pullScans() {
    if (!user) return [];
    await flushNow();                                                 // erst eigene Änderungen hochladen (auch Löschungen)
    const { data, error } = await sb.from('scans').select('id,type,scanned_at,data').eq('user_id', user.id).order('scanned_at', { ascending: true });
    if (error) throw error;
    const have = new Set(readLocalHistory().map(e => String(e.id)));
    const dq = new Set(readDelQ());
    return (data || []).map(entryOf).filter(e => !have.has(String(e.id)) && !dq.has(String(e.id)));
  }
  function flushNow() {
    clearTimeout(timer); clearTimeout(retryTimer);
    if (!user || !hasPending) return queue;
    status('busy', '☁ speichert …');
    queue = queue.then(() => pushChanges()).then(() => {
      hasPending = false; lsDel(PENDING);
      status('ok', speedWarn ? '☁ gespeichert (Profil-Speicher)' : '☁ in der Cloud gespeichert');
    }).catch((e) => {
      console.error('Cloud-Sync fehlgeschlagen', e);
      status('err', '⚠ nicht gespeichert – neuer Versuch …');
      retryTimer = setTimeout(flushNow, 15000);
    });
    return queue;
  }
  // Wird von der App bei jeder Änderung aufgerufen
  function changed() {
    if (!user) return;
    hasPending = true; lsSet(PENDING, '1');
    status('busy', '☁ ungespeichert …');
    clearTimeout(timer); timer = setTimeout(flushNow, 800);
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushNow(); });
  window.addEventListener('beforeunload', (e) => { if (hasPending) { flushNow(); e.preventDefault(); e.returnValue = ''; } });

  // ---------- Daten aus der Version ohne Cloud übernehmen ----------
  async function offerLegacyImport() {
    const flag = 'rok_cloud_legacy_done_' + user.id;
    if (lsGet(flag)) return;
    if (readLocalHistory().length || Object.keys(readLocalState()).length) { lsSet(flag, '1'); return; }   // Cloud hat schon Daten
    const sources = [];
    try { (JSON.parse(lsGet('rok_profiles') || '[]') || []).forEach(p => p?.id && sources.push({ ns: 'rok_data_' + p.id + '_', name: p.name })); } catch {}
    sources.push({ ns: 'rok_scanner_', name: 'ohne Login' });
    const withData = sources.map(src => {
      let n = 0; try { n = JSON.parse(lsGet(src.ns + HIST) || '[]').length; } catch {}
      return { ...src, n, keys: lsKeys(src.ns).filter(k => k !== 'rok_scanner_api_key') };
    }).filter(src => src.keys.length);
    lsSet(flag, '1');
    if (!withData.length) return;
    const me = profile.name.toLowerCase();
    const src = withData.find(x => (x.name || '').toLowerCase() === me) || withData.sort((a, b) => b.n - a.n)[0];
    if (!(await UI.confirm(`In diesem Browser liegen noch Daten aus der alten Version (Profil „${src.name}“, ${src.n} Scans).\n\nIn deinen Cloud-Account übernehmen?`))) return;
    src.keys.forEach(k => lsSet(NS + k.slice(src.ns.length), lsGet(k)));
    await pushChanges(true);
  }

  // ---------- Anmelden / Start ----------
  async function enter(u) {
    user = u; profile = { id: u.id, name: displayName(u), email: u.email };
    NS = nsOf(u.id); PENDING = 'rok_cloud_pending_' + u.id;
    showLoading('Lade deine Daten aus der Cloud …');
    try {
      if (lsGet(PENDING)) {                                      // offline gespeicherte Änderungen zuerst hochladen
        showLoading('Lade ungespeicherte Änderungen hoch …');
        synced = new Map(); lastState = '';
        await pushChanges(true); lsDel(PENDING);
      }
      await loadCloud();
      await offerLegacyImport();
      try { await loadOwnRank(); } catch (e) { console.warn('Rangliste nicht erreichbar', e); }
    } catch (e) {
      console.error(e);
      if (lsKeys(NS).length) {                                   // offline: mit lokalem Stand weiterarbeiten
        status('err', '⚠ offline – lokaler Stand');
      } else {
        return showLoading(germanError(e), () => enter(u));
      }
    }
    hideOverlay();
    if (!$('syncStatus').textContent) status('ok', '☁ synchronisiert');
    window.RokApp();
    refreshInvites().catch(() => {});                             // Einladungen in KvK-Gruppen → Zahl am Menü
    clearInterval(enter._inv); enter._inv = setInterval(() => { if (document.visibilityState === 'visible') refreshInvites().catch(() => {}); }, 120000);
  }

  async function login(id, pw) {
    const email = toEmail(id);
    if (!email) throw new Error('Bitte Benutzernamen eingeben.');
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });
    if (error) throw error;
    await enter(data.user);
  }
  async function register(id, pw, pw2) {
    id = String(id).trim();
    const isMail = id.includes('@');
    const username = isMail ? id.split('@')[0] : id.replace(/\s+/g, ' ');
    if (!isMail && username.length < 2) throw new Error('Der Benutzername muss mindestens 2 Zeichen haben.');
    if (isMail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id)) throw new Error('Bitte eine gültige E-Mail-Adresse eingeben.');
    if (pw.length < 6) throw new Error('Das Passwort muss mindestens 6 Zeichen haben.');
    if (pw !== pw2) throw new Error('Die Passwörter stimmen nicht überein.');
    const email = toEmail(id);
    const { data, error } = await sb.auth.signUp({ email, password: pw, options: { data: { username } } });
    if (error) throw error;
    if (data.user && Array.isArray(data.user.identities) && !data.user.identities.length) throw new Error('Diesen Account gibt es schon – bitte einloggen.');
    if (data.session) return enter(data.user);
    if (!isMail) throw new Error('Supabase verlangt eine E-Mail-Bestätigung. Für Accounts mit Benutzernamen bitte in Supabase unter Authentication → Sign In / Providers → Email die Option „Confirm email“ ausschalten – oder mit E-Mail registrieren.');
    setTab('login'); $('loginUser').value = id;
    msg('authInfo', `Fast geschafft! Wir haben eine Bestätigungs-Mail an ${id} geschickt. Klicke auf den Link und logge dich dann ein.`);
  }
  async function logout() {
    try { await flushNow(); } catch {}
    try { await sb.auth.signOut(); } catch {}
    if (NS) lsKeys(NS).forEach(lsDel);                           // keine Daten im Browser zurücklassen
    user = null;
    location.reload();
  }

  async function busy(form, fn) {
    const btn = form.querySelector('button[type=submit]'), label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Bitte warten …'; msg('authError', ''); msg('authInfo', '');
    try { await fn(); }
    catch (e) { showLogin(form.id === 'loginForm' ? 'login' : 'register'); msg('authError', germanError(e)); }
    finally { btn.disabled = false; btn.textContent = label; }
  }
  document.querySelectorAll('.auth-tab').forEach(b => b.onclick = () => { msg('authInfo', ''); setTab(b.dataset.tab); });
  $('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    busy($('loginForm'), async () => {
      try { await login($('loginUser').value, $('loginPass').value); }
      catch (x) { $('loginPass').value = ''; throw x; }
    });
  });
  $('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    busy($('registerForm'), () => register($('regUser').value, $('regPass').value, $('regPass2').value));
  });

  async function boot() {
    if (!sb) return showLoading('Die Cloud-Bibliothek (Supabase) konnte nicht geladen werden. Internetverbindung oder Adblocker prüfen.', () => location.reload());
    showLoading('Verbinde …');
    try {
      const { data } = await sb.auth.getSession();
      if (data?.session?.user) return enter(data.session.user);
    } catch (e) { console.error(e); }
    showLogin('login');
  }
  // In einem anderen Tab abgemeldet → hier ebenfalls
  try { sb?.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_OUT' && user) location.reload(); }); } catch {}

  document.addEventListener('DOMContentLoaded', boot);
  // ---------- Rangliste (Tabelle public.leaderboard) ----------
  // Jeder eingeloggte Spieler darf alle Zeilen lesen, aber nur seine eigene schreiben.
  let lbLast = null, lbTimer = null, ownMeta = { alliance_tag: '', avatar: '', city_skin: '' };
  async function loadOwnRank() {
    const { data, error } = await sb.from('leaderboard').select('*').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    lbLast = data ? +data.vip_points : null;
    lbKills = data?.kill_points != null ? +data.kill_points : null;
    lbMerit = data?.highest_merit != null ? +data.highest_merit : null;
    lbEnergy = data?.energy != null ? +data.energy : null;
    lbDeads = data?.deads != null ? +data.deads : null;
    lbArk = data?.ark_wins != null ? +data.ark_wins : null;
    lbLk = data?.lk_autarch != null ? +data.lk_autarch : null;
    lbUk = data?.units_killed != null ? +data.units_killed : null; lbUl = data?.units_lost != null ? +data.units_lost : null; lbUh = data?.units_healed != null ? +data.units_healed : null;
    ownGains = data?.gains && typeof data.gains === 'object' ? data.gains : {};
    ownMeta = { alliance_tag: data?.alliance_tag || '', avatar: data?.avatar || '', city_skin: data?.city_skin || '', prof_bg: data?.prof_bg || '', prof_order: data?.prof_order || '', kvk_card: data?.kvk_card || '', aoo_card: data?.aoo_card && typeof data.aoo_card === 'object' ? data.aoo_card : null, kvk_stats: data?.kvk_stats || null, is_private: !!data?.is_private, governor_id: data?.governor_id || '', showcase: data?.showcase || null, kingdom: data?.kingdom || '', alliance_name: data?.alliance_name || '', kvk_start: data?.kvk_start || '', kvk_map: data?.kvk_map || null };
  }
  // Aktuellen VIP-Stand melden. force = neuer Scan (immer aktualisieren), sonst nur bei geänderter Punktzahl.
  // Kill-Punkte aus dem Statthalter-Scan in die Rangliste schreiben (Spalte kill_points)
  // Statthalter-Werte in die Rangliste schreiben: kill_points und highest_merit (je eigene Spalte, einzeln gesendet)
  let lbKills = null, lbMerit = null, lbEnergy = null, lbDeads = null, lbArk = null, lbLk = null, lbUk = null, lbUl = null, lbUh = null, ownGains = {};
  // Zuwachs seit dem letzten Scan (Spalte leaderboard.gains, jsonb: { kill_points: { d, at }, … })
  async function saveGains(patch) {
    if (!user || missingCols.has('gains') || !Object.keys(patch).length) return;
    const next = { ...ownGains, ...patch };
    const { error } = await sb.from('leaderboard').upsert({ user_id: user.id, username: profile.name.slice(0, 40), gains: next });
    if (error) { console.warn('Zuwachs nicht gespeichert (Spalte gains in Supabase anlegen)', error); if (/gains|column|schema/i.test(error.message || '')) missingCols.add('gains'); return; }
    ownGains = next;
  }
  async function pushStat(col, v, cur) {
    if (!user || v == null || !isFinite(v) || v < 0) return cur;               // kein Wert im Scan → bisherigen Stand behalten
    v = Math.round(v);
    if (v === cur) return v;
    const row = { user_id: user.id, username: profile.name.slice(0, 40), [col]: v, updated_at: new Date().toISOString() };
    if (lbLast == null) { row.vip_points = 0; row.vip_level = 0; }
    const { error } = await sb.from('leaderboard').upsert(row);
    if (error) { console.warn(`${col} nicht in der Rangliste gespeichert (Spalte in Supabase anlegen)`, error); if (/column|schema/i.test(error.message || '')) missingCols.add(col); return cur; }
    if (lbLast == null) lbLast = 0;
    return v;
  }
  const govCur = () => ({ kill_points: lbKills, highest_merit: lbMerit, energy: lbEnergy, ark_wins: lbArk, lk_autarch: lbLk });   // Deads bleiben privat (nur im eigenen Verlauf)
  // fresh = neuer Scan bzw. neue Eingabe → Zuwachs gegenüber dem bisherigen Stand merken
  async function pushGov(g, fresh = false) {
    const before = govCur();
    lbKills = await pushStat('kill_points', g?.kill_points, lbKills);
    lbMerit = await pushStat('highest_merit', g?.highest_merit, lbMerit);
    lbEnergy = await pushStat('energy', g?.energy, lbEnergy);
    lbArk = await pushStat('ark_wins', g?.ark_wins, lbArk);
    lbLk = await pushStat('lk_autarch', g?.lk_autarch, lbLk);
    if (!missingCols.has('units_killed')) lbUk = await pushStat('units_killed', g?.units_killed, lbUk);
    if (!missingCols.has('units_lost')) lbUl = await pushStat('units_lost', g?.units_lost, lbUl);
    if (!missingCols.has('units_healed')) lbUh = await pushStat('units_healed', g?.units_healed, lbUh);
    if (!fresh) return;
    const after = govCur(), at = Date.now(), patch = {};
    Object.keys(after).forEach(k => { if (g?.[k] != null && before[k] != null && after[k] === Math.round(+g[k])) patch[k] = { d: after[k] - before[k], at }; });
    await saveGains(patch);
  }
  function pushVip(points, level, force = false) {
    if (!user || points == null || !isFinite(points) || points < 0) return;
    points = Math.round(points);
    if (!force && points === lbLast) return;
    clearTimeout(lbTimer);
    lbTimer = setTimeout(async () => {
      const prev = lbLast;
      const { error } = await sb.from('leaderboard').upsert({
        user_id: user.id, username: profile.name.slice(0, 40), vip_points: points, vip_level: level || 0,
        updated_at: new Date().toISOString()
      });
      if (error) { console.error('Rangliste nicht aktualisiert', error); return; }
      lbLast = points;
      if (force && prev != null && prev > 0) saveGains({ vip_points: { d: points - prev, at: Date.now() } });   // neuer VIP-Scan → Zuwachs
    }, 600);
  }
  const missingCols = new Set();   // Spalten, die in public.leaderboard (noch) fehlen
  async function loadLeaderboard() {
    // ohne city_skin laden (Bilder nur im Profil) – Fallback '*', falls Spalten fehlen
    const q = (cols) => sb.from('leaderboard').select(cols).order('vip_points', { ascending: false }).limit(500);
    // fehlt eine Spalte, meldet Supabase „column leaderboard.x does not exist“ → ohne diese Spalte erneut laden
    let cols = ['user_id', 'username', 'vip_points', 'vip_level', 'updated_at', 'alliance_tag', 'avatar', 'kill_points', 'highest_merit', 'energy', 'ark_wins', 'lk_autarch', 'gains'], r;
    for (let i = 0; i < 12; i++) {
      r = await q(cols.join(','));
      if (!r.error) break;
      const m = /column\s+(?:\w+\.)?"?(\w+)"?\s+does not exist/i.exec(r.error.message || '');
      if (!m || !cols.includes(m[1]) || cols.indexOf(m[1]) < 7) break;
      missingCols.add(m[1]); cols = cols.filter(c => c !== m[1]);
    }
    if (r.error) r = await q('*');
    if (r.error) throw new Error(germanError(r.error));
    const rows = r.data || [];
    const GOV = ['kill_points', 'highest_merit', 'energy', 'ark_wins', 'lk_autarch'];
    rows.forEach(x => { x._g = x.gains && typeof x.gains === 'object' ? { ...x.gains } : {}; });
    // Fehlende Werte und Zuwachs aus den letzten beiden Scans des Spielers ergänzen (falls lesbar)
    const needGov = rows.some(x => GOV.slice(0, 3).some(k => x[k] == null || x._g[k] == null));
    const needVip = rows.some(x => x._g.vip_points == null);
    const [g, v] = await Promise.all([
      needGov ? sb.from('scans').select('user_id,scanned_at,data').eq('type', 'governor').order('scanned_at', { ascending: false }).limit(2000) : null,
      needVip ? sb.from('scans').select('user_id,scanned_at,data').eq('type', 'vip').order('scanned_at', { ascending: false }).limit(2000) : null]);
    const lastTwo = (res) => { const m = new Map(); for (const sc of (res && !res.error ? res.data : null) || []) { const l = m.get(sc.user_id) || []; if (l.length < 2) { l.push(sc); m.set(sc.user_id, l); } } return m; };
    const gm = lastTwo(g), vm = lastTwo(v);
    rows.forEach(row => {
      const [a, b] = gm.get(row.user_id) || [];
      if (a) GOV.forEach(k => {
        const da = a.data || {}, db = b?.data || {};
        if (row[k] == null && da[k] != null) row[k] = +da[k];
        if (row._g[k] == null && b && da[k] != null && db[k] != null && +row[k] === +da[k]) row._g[k] = { d: +da[k] - +db[k], at: Date.parse(a.scanned_at) };
      });
      const [va, vb] = vm.get(row.user_id) || [];
      if (row._g.vip_points == null && va && vb && va.data?.after != null && vb.data?.after != null) row._g.vip_points = { d: +va.data.after - +vb.data.after, at: Date.parse(va.scanned_at) };
    });
    return rows;
  }

  // ---------- Game Profil ----------
  // Profil-Kopf (Allianz-Tag, Profilbild) liegt in public.leaderboard.
  async function saveMeta(meta, points) {
    const row = { user_id: user.id, username: profile.name.slice(0, 40), alliance_tag: meta.alliance_tag || null, avatar: meta.avatar || null };
    if (lbLast == null) { row.vip_points = Math.max(0, Math.round(points || 0)); row.vip_level = 0; row.updated_at = new Date().toISOString(); }
    const extra = {};
    if ('kingdom' in meta) extra.kingdom = String(meta.kingdom || '').replace(/\D/g, '').slice(0, 5) || null;
    if ('alliance_name' in meta) extra.alliance_name = String(meta.alliance_name || '').trim().slice(0, 40) || null;
    let { error } = await sb.from('leaderboard').upsert({ ...row, ...extra });
    let extraSaved = true;
    if (error && Object.keys(extra).length && /kingdom|alliance_name|column|schema/i.test(error.message || '')) {
      missingCols.add('kingdom'); extraSaved = false;
      ({ error } = await sb.from('leaderboard').upsert(row));            // Spalten fehlen noch → wenigstens Tag + Bild
    }
    if (error) {
      if (/alliance_tag|avatar|column/i.test(error.message || '')) throw new Error('Allianz-Tag/Profilbild: bitte zuerst profile.sql in Supabase ausführen.');
      throw new Error(germanError(error));
    }
    ownMeta = { ...ownMeta, alliance_tag: row.alliance_tag || '', avatar: row.avatar || '', ...(extraSaved ? { kingdom: extra.kingdom ?? ownMeta.kingdom ?? '', alliance_name: extra.alliance_name ?? ownMeta.alliance_name ?? '' } : {}) };
    if (lbLast == null) lbLast = row.vip_points;
    return { extraSaved };
  }
  // City-Skin in public.leaderboard.city_skin (für andere sichtbar). false = Spalte fehlt noch.
  async function saveSkin(skin, points) {
    const row = { user_id: user.id, username: profile.name.slice(0, 40), city_skin: skin || null };
    if (lbLast == null) { row.vip_points = Math.max(0, Math.round(points || 0)); row.vip_level = 0; row.updated_at = new Date().toISOString(); }
    const { error } = await sb.from('leaderboard').upsert(row);
    if (error) {
      if (/city_skin|column/i.test(error.message || '')) return false;
      throw new Error(germanError(error));
    }
    ownMeta = { ...ownMeta, city_skin: skin || '' };
    if (lbLast == null) lbLast = row.vip_points;
    return true;
  }
  // Hintergrundbild im Profilkopf in public.leaderboard.prof_bg (für andere sichtbar). false = Spalte fehlt noch.
  async function saveProfBg(img, points) {
    const row = { user_id: user.id, username: profile.name.slice(0, 40), prof_bg: img || null };
    if (lbLast == null) { row.vip_points = Math.max(0, Math.round(points || 0)); row.vip_level = 0; row.updated_at = new Date().toISOString(); }
    const { error } = await sb.from('leaderboard').upsert(row);
    if (error) {
      if (/prof_bg|column/i.test(error.message || '')) return false;
      throw new Error(germanError(error));
    }
    ownMeta = { ...ownMeta, prof_bg: img || '' };
    if (lbLast == null) lbLast = row.vip_points;
    return true;
  }
  // KvK-Bilanz-Bild im Profil in public.leaderboard.kvk_card (JPEG als Data-URL, für andere sichtbar). false = Spalte fehlt noch.
  async function saveKvkCard(img) {
    if (!user) return false;
    const row = { user_id: user.id, username: profile.name.slice(0, 40), kvk_card: img || null };
    if (lbLast == null) { row.vip_points = 0; row.vip_level = 0; row.updated_at = new Date().toISOString(); }
    const { error } = await sb.from('leaderboard').upsert(row);
    if (error) {
      if (/kvk_card/i.test(error.message || '')) { missingCols.add('kvk_card'); return false; }   // Spalte fehlt (sonst echten Fehler zeigen)
      throw new Error(germanError(error));
    }
    ownMeta = { ...ownMeta, kvk_card: img || '' };
    if (lbLast == null) lbLast = 0;
    return true;
  }
  // AoO-Showcase (Karte) in public.leaderboard.aoo_card (jsonb, für andere sichtbar). false = Spalte fehlt noch.
  async function saveAooCard(card) {
    if (!user) return false;
    const row = { user_id: user.id, username: profile.name.slice(0, 40), aoo_card: card || null };
    if (lbLast == null) { row.vip_points = 0; row.vip_level = 0; row.updated_at = new Date().toISOString(); }
    const { error } = await sb.from('leaderboard').upsert(row);
    if (error) { if (/aoo_card/i.test(error.message || '')) { missingCols.add('aoo_card'); return false; } throw new Error(germanError(error)); }
    ownMeta = { ...ownMeta, aoo_card: card || null };
    if (lbLast == null) lbLast = 0;
    return true;
  }
  // Reihenfolge der Profil-Kacheln in public.leaderboard.prof_order (Text, mit Komma). false = Spalte fehlt noch.
  async function saveProfOrder(order) {
    if (!user || lbLast == null) return false;
    const { error } = await sb.from('leaderboard').upsert({ user_id: user.id, username: profile.name.slice(0, 40), prof_order: order || null });
    if (error) { if (/prof_order|column/i.test(error.message || '')) return false; throw new Error(germanError(error)); }
    ownMeta = { ...ownMeta, prof_order: order || '' };
    return true;
  }
  // Öffentliches Profil eines Spielers: Kopfzeile + VIP-/Speedup-Verlauf
  async function loadProfile(uid, opts = {}) {
    const lb = await sb.from('leaderboard').select('*').eq('user_id', uid).maybeSingle();
    if (lb.error) throw new Error(germanError(lb.error));
    // Privates Profil eines anderen Spielers: Verlauf gar nicht erst abrufen (nur die Kopfzeile ist sichtbar) – Admins bekommen nur die Speedups
    if (uid !== user?.id) return { row: lb.data, scans: [], scansError: false, isPrivate: !!lb.data?.is_private };   // fremde Profile: nur Kopf + Showcase
    const sc = await sb.from('scans').select('id,type,scanned_at,data').eq('user_id', uid).in('type', ['vip', 'speedups', 'gems', 'ap', 'resources', 'governor', 'materials']).order('scanned_at', { ascending: true });
    return { row: lb.data, scans: sc.error ? [] : (sc.data || []).map(entryOf), scansError: !!sc.error, isPrivate: !!lb.data?.is_private };
  }
  // Governor ID (Spalte leaderboard.governor_id, Text)
  async function saveGovId(id) {
    id = String(id || '').replace(/\D/g, '').slice(0, 12);
    const row = { user_id: user.id, username: profile.name.slice(0, 40), governor_id: id || null };
    if (lbLast == null) { row.vip_points = 0; row.vip_level = 0; row.updated_at = new Date().toISOString(); }
    const { error } = await sb.from('leaderboard').upsert(row);
    if (error) {
      if (/governor_id|column|schema/i.test(error.message || '')) { missingCols.add('governor_id'); throw new Error('Governor ID: bitte zuerst die Spalte governor_id in Supabase anlegen (SQL siehe Anleitung).'); }
      throw new Error(germanError(error));
    }
    ownMeta = { ...ownMeta, governor_id: id };
    if (lbLast == null) lbLast = 0;
    return id;
  }
  // Profil privat / öffentlich schalten (Spalte leaderboard.is_private)
  async function setPrivate(on) {
    const row = { user_id: user.id, username: profile.name.slice(0, 40), is_private: !!on };
    if (lbLast == null) { row.vip_points = 0; row.vip_level = 0; row.updated_at = new Date().toISOString(); }
    const { error } = await sb.from('leaderboard').upsert(row);
    if (error) {
      if (/is_private|column/i.test(error.message || '')) throw new Error('Privat-Schalter: bitte zuerst die Spalte is_private in Supabase anlegen (SQL siehe Anleitung).');
      throw new Error(germanError(error));
    }
    ownMeta = { ...ownMeta, is_private: !!on };
    if (lbLast == null) lbLast = 0;
  }

  // Showcase (Spalte leaderboard.showcase, jsonb – für andere Spieler lesbar). false = Spalte fehlt noch.
  async function saveShowcase(sc) {
    if (!user) return false;
    const row = { user_id: user.id, username: profile.name.slice(0, 40), showcase: sc };
    if (lbLast == null) { row.vip_points = 0; row.vip_level = 0; row.updated_at = new Date().toISOString(); }
    const { error } = await sb.from('leaderboard').upsert(row);
    if (error) {
      if (/showcase|column|schema/i.test(error.message || '')) { missingCols.add('showcase'); return false; }
      throw new Error(germanError(error));
    }
    ownMeta = { ...ownMeta, showcase: sc };
    if (lbLast == null) lbLast = 0;
    return true;
  }

  // Showcase-Bilder in Supabase-Storage (öffentlicher Bucket "showcase", Ordner = eigene User-ID)
  const IMG_BASE = SUPABASE_URL + '/storage/v1/object/public/showcase/';
  async function uploadImage(blob, key) {
    if (!sb || !user) throw new Error('Nicht eingeloggt.');
    const path = `${user.id}/${String(key).replace(/[^A-Za-z0-9_-]+/g, '_')}.jpg`;
    const { error } = await sb.storage.from('showcase').upload(path, blob, { upsert: true, contentType: 'image/jpeg', cacheControl: '3600' });
    if (error) throw error;
    return IMG_BASE + path + '?v=' + Date.now();
  }

  // Freischaltung einzelner Bereiche (Tabelle public.feature_access – jeder sieht nur seine eigenen Zeilen)
  async function hasFeature(name) {
    if (!sb || !user) return false;
    try {
      const { data, error } = await sb.from('feature_access').select('feature').eq('user_id', user.id).eq('feature', name).maybeSingle();
      return !error && !!data;
    } catch { return false; }
  }

  // KvK-Startdatum im Profil (Spalte leaderboard.kvk_start, Text JJJJ-MM-TT) – für andere im Profil sichtbar
  async function saveKvkStart(d) {
    if (!user || missingCols.has('kvk_start')) return false;
    d = /^\d{4}-\d{2}-\d{2}$/.test(d || '') ? d : null;
    if ((d || '') === (ownMeta.kvk_start || '')) return true;
    const row = { user_id: user.id, username: profile.name.slice(0, 40), kvk_start: d };
    if (lbLast == null) { row.vip_points = 0; row.vip_level = 0; row.updated_at = new Date().toISOString(); }
    const { error } = await sb.from('leaderboard').upsert(row);
    if (error) { console.warn('KvK-Start nicht im Profil gespeichert (Spalte kvk_start in Supabase anlegen)', error); if (/kvk_start|column|schema/i.test(error.message || '')) missingCols.add('kvk_start'); return false; }
    ownMeta = { ...ownMeta, kvk_start: d || '' };
    if (lbLast == null) lbLast = 0;
    return true;
  }

  // KvK-Karte im Profil (Spalte leaderboard.kvk_map, jsonb { kds: [[…]×4], my, ally }) – für andere im Profil sichtbar
  async function saveKvkMap(m) {
    if (!user || missingCols.has('kvk_map')) return false;
    const has = m && Array.isArray(m.kds) && (m.kds.some(k => k && k.length) || m.my > 0);
    const val = has ? { kds: m.kds.map(k => (k || []).slice(0, 60)), my: +m.my || 0, ally: +m.ally || 0, style: /^[a-z]{1,12}$/.test(m.style || '') ? m.style : 'battle', layout: /^[a-z0-9_-]{1,20}$/.test(m.layout || '') ? m.layout : 'schema', layout: /^[a-z0-9_-]{1,20}$/.test(m.layout || '') ? m.layout : 'schema',
      ev: Array.isArray(m.ev) ? m.ev.slice(0, 40) : [], days: +m.days || 60, tier: m.tier && typeof m.tier === 'object' ? m.tier : {}, pa: m.pa && typeof m.pa === 'object' ? m.pa : {}, au: m.au === 2 ? 2 : 1 } : null;                      // ev: Ruinen/Altäre für Timer + Karte bei Besuchern
    if (JSON.stringify(val) === JSON.stringify(ownMeta.kvk_map || null)) return true;
    const row = { user_id: user.id, username: profile.name.slice(0, 40), kvk_map: val };
    if (lbLast == null) { row.vip_points = 0; row.vip_level = 0; row.updated_at = new Date().toISOString(); }
    const { error } = await sb.from('leaderboard').upsert(row);
    if (error) { console.warn('KvK-Karte nicht im Profil gespeichert (Spalte kvk_map in Supabase anlegen)', error); if (/kvk_map|column|schema/i.test(error.message || '')) missingCols.add('kvk_map'); return false; }
    ownMeta = { ...ownMeta, kvk_map: val };
    if (lbLast == null) lbLast = 0;
    return true;
  }

  // ---- KvK-Freunde: Einladungen in public.kvk_friends, eigene KvK-Werte in leaderboard.kvk_stats ----
  async function saveKvkStats(st) {
    if (!user || missingCols.has('kvk_stats') || !st) return false;
    if (JSON.stringify(st) === JSON.stringify(ownMeta.kvk_stats || null)) return true;
    const row = { user_id: user.id, username: profile.name.slice(0, 40), kvk_stats: st };
    if (lbLast == null) { row.vip_points = 0; row.vip_level = 0; row.updated_at = new Date().toISOString(); }
    const { error } = await sb.from('leaderboard').upsert(row);
    if (error) { if (/kvk_stats|column|schema/i.test(error.message || '')) missingCols.add('kvk_stats'); return false; }
    ownMeta = { ...ownMeta, kvk_stats: st };
    if (lbLast == null) lbLast = 0;
    return true;
  }
  const KVK_USER_COLS = 'user_id,username,avatar,alliance_tag,kingdom,governor_id,kvk_start,kvk_stats';
  // fehlt eine Spalte (z. B. kingdom oder kvk_stats), ohne sie erneut abfragen
  async function kvkUserQuery(build) {
    let cols = KVK_USER_COLS.split(','), r;
    for (let i = 0; i < 6; i++) {
      r = await build(cols.join(','));
      if (!r.error) break;
      const m = /column\s+(?:\w+\.)?"?(\w+)"?\s+does not exist|Could not find the '(\w+)' column/i.exec(r.error.message || '');
      const c = m && (m[1] || m[2]);
      if (!c || !cols.includes(c) || c === 'user_id') break;
      missingCols.add(c); cols = cols.filter((x) => x !== c);
    }
    if (r.error) throw new Error(germanError(r.error));
    return r.data || [];
  }
  // Spieler mit demselben KvK-Start (jedes KvK startet für alle gleichzeitig)
  async function kvkPeers(d) {
    if (!user || !d) return [];
    return (await kvkUserQuery((c) => sb.from('leaderboard').select(c).eq('kvk_start', d).limit(300))).filter((x) => x.user_id !== user.id);
  }
  const kvkUsers = async (ids) => (ids && ids.length ? kvkUserQuery((c) => sb.from('leaderboard').select(c).in('user_id', ids)) : []);
  // Spieler über die Governor-ID finden (auch aus anderen KvKs)
  async function kvkFindId(gid) {
    const g = String(gid || '').replace(/\D/g, '');
    if (!user || g.length < 5) return [];
    return (await kvkUserQuery((c) => sb.from('leaderboard').select(c).eq('governor_id', g).limit(5))).filter((x) => x.user_id !== user.id);
  }
  // ---- KvK-Gruppen: public.kvk_groups (Name, öffentlich/privat) + public.kvk_group_members (invited | member) ----
  const tblErr = (e) => { const m = String(e?.message || e || ''); return /kvk_group|relation|schema cache|does not exist/i.test(m) ? new Error('NO_TABLE') : new Error(germanError(e)); };
  async function kvkGroups(d) {
    if (!user) return { groups: [], members: [], pub: [] };
    const mine = await sb.from('kvk_group_members').select('group_id,user_id,status,invited_by').eq('user_id', user.id);
    if (mine.error) throw tblErr(mine.error);
    const ids = [...new Set((mine.data || []).map((m) => m.group_id))];
    const [g, mem, pub] = await Promise.all([
      ids.length ? sb.from('kvk_groups').select('*').in('id', ids) : { data: [] },
      ids.length ? sb.from('kvk_group_members').select('group_id,user_id,status,invited_by').in('group_id', ids) : { data: [] },
      d ? sb.from('kvk_groups').select('*').eq('is_public', true).eq('kvk_start', d).limit(50) : { data: [] }]);
    if (g.error) throw tblErr(g.error);
    const members = [...(mem.data || [])];
    (mine.data || []).forEach((m) => { if (!members.some((x) => x.group_id === m.group_id && x.user_id === m.user_id)) members.push(m); });
    const pubIds = (pub.data || []).filter((x) => !ids.includes(x.id)).map((x) => x.id);
    if (pubIds.length) { const pm = await sb.from('kvk_group_members').select('group_id,user_id,status,invited_by').in('group_id', pubIds); (pm.data || []).forEach((m) => members.push(m)); }
    return { groups: g.data || [], members, pub: (pub.data || []).filter((x) => !ids.includes(x.id)) };
  }
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }));
  async function kvkGroupCreate(name, isPublic, d) {
    const id = uuid();
    let r = await sb.from('kvk_groups').upsert({ id, owner: user.id, name: String(name || '').trim().slice(0, 40) || 'KvK-Gruppe', is_public: !!isPublic, kvk_start: d || null });
    if (r.error) throw tblErr(r.error);
    r = await sb.from('kvk_group_members').upsert({ group_id: id, user_id: user.id, status: 'member', invited_by: user.id });
    if (r.error) throw tblErr(r.error);
    return id;
  }
  async function kvkGroupPublic(id, isPublic) { const r = await sb.from('kvk_groups').update({ is_public: !!isPublic }).eq('id', id); if (r.error) throw tblErr(r.error); }
  async function kvkGroupInvite(id, uid) {
    const r = await sb.from('kvk_group_members').upsert({ group_id: id, user_id: uid, status: 'invited', invited_by: user.id });
    if (r.error) throw tblErr(r.error);
  }
  async function kvkGroupJoin(id) {                                   // Einladung annehmen (Zeile ändern) oder öffentlicher Gruppe beitreten (neue Zeile)
    const ex = await sb.from('kvk_group_members').select('status').eq('group_id', id).eq('user_id', user.id).maybeSingle();
    const r = ex.data ? await sb.from('kvk_group_members').update({ status: 'member' }).eq('group_id', id).eq('user_id', user.id)
      : await sb.from('kvk_group_members').upsert({ group_id: id, user_id: user.id, status: 'member' });
    if (r.error) throw tblErr(r.error);
    refreshInvites();
  }
  async function kvkGroupLeave(id, uid) {                             // eigene Zeile = verlassen/ablehnen, fremde = entfernen (Ersteller)
    const r = await sb.from('kvk_group_members').delete().eq('group_id', id).eq('user_id', uid || user.id);
    if (r.error) throw tblErr(r.error);
    refreshInvites();
  }
  async function kvkGroupDelete(id) { const r = await sb.from('kvk_groups').delete().eq('id', id); if (r.error) throw tblErr(r.error); await sb.from('kvk_group_members').delete().eq('group_id', id); refreshInvites(); }
  // offene Einladungen zählen → kleine Zahl am Menü, Profil und KvK
  let inviteN = 0;
  async function refreshInvites() {
    if (!user) return 0;
    const r = await sb.from('kvk_group_members').select('group_id,status').eq('user_id', user.id).eq('status', 'invited');
    inviteN = r.error ? 0 : (r.data || []).length;
    window.dispatchEvent(new CustomEvent('kvk:invites', { detail: inviteN }));
    return inviteN;
  }

  // Admin (Tabelle feature_access, feature = 'admin') – einmal pro Sitzung abfragen
  let adminP = null;
  const isAdmin = () => adminP || (adminP = hasFeature('admin'));

  // Item-Katalog des Crafting-Planers (Tabelle public.gear_items, für alle lesbar)
  async function loadGearItems() {
    const q = (cols) => sb.from('gear_items').select(cols).order('slot').order('name');
    let r = await q('id,name,slot,rarity,set_name,cost_leather,cost_iron,cost_ebony,cost_bone,icon,tier_costs');
    if (r.error) r = await q('id,name,slot,rarity,set_name,cost_leather,cost_iron,cost_ebony,cost_bone,icon');   // Spalte tier_costs fehlt noch
    if (r.error) r = await q('id,name,slot,rarity,set_name,cost_leather,cost_iron,cost_ebony,cost_bone');        // Spalte icon fehlt noch
    if (r.error) throw new Error(germanError(r.error));
    return r.data || [];
  }

  return { db: () => sb, germanError, pending: () => hasPending, hasFeature, isAdmin, saveKvkStart, saveKvkMap, saveKvkStats, kvkPeers, kvkUsers, kvkFindId, kvkGroups, kvkGroupCreate, kvkGroupPublic, kvkGroupInvite, kvkGroupJoin, kvkGroupLeave, kvkGroupDelete, refreshInvites, invites: () => inviteN, myId: () => user?.id || null, ownGains: () => ownGains, loadGearItems, saveShowcase, uploadImage, imgBase: () => IMG_BASE, current: () => profile, userId: () => user?.id, showLogin: () => showLogin('login'), logout, nsOf, changed, flushNow,
           pushVip, pushGov, loadLeaderboard, ownMeta: () => ownMeta, saveMeta, saveSkin, saveProfBg, saveProfOrder, saveKvkCard, saveAooCard, loadProfile, govNow: () => ({ energy: lbEnergy, kill_points: lbKills, deads: lbDeads, ark_wins: lbArk, lk_autarch: lbLk }), setPrivate, saveGovId, saveNow, pullScans, markDeleted, missingCols: () => [...missingCols] };
})();
