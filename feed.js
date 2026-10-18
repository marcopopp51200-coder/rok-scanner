// Wiz fan Club – Feed (Startseite)
// Beiträge aller Spieler: Text, Foto vom Gerät, Showcase-Bild, KvK-Bilanz, AoO, Craft-Upgrade,
// Pass-Start, Bestand (Rss / Speedups / AP – auch einzeln), VIP-Stufe, KvK-Karte, Help-Me-Anfrage und
// Kill-Punkte & Verdienst je Pass/Altar – mit Reaktionen und Kommentaren.
// Läuft innerhalb von RokApp (scanner.js); R = geteilter Kontext (window.Rok).
// Supabase: public.feed_posts (id, user_id, kind, body, image, data, created_at)
//           public.feed_reactions (post_id, user_id, emoji, created_at) – ein Eintrag je Spieler und Beitrag
//           public.feed_comments (id, post_id, user_id, body, created_at)
// kind ist freier Text – neue Arten brauchen kein SQL.
window.RokMods = window.RokMods || {};
window.RokMods.feed = (R) => {
  const $ = R.$, esc = R.esc, A = window.RokAuth;
  const REACTS = [['👍', 'Daumen hoch'], ['👎', 'Daumen runter'], ['🔥', 'Feuer'], ['❤️', 'Herz'], ['😂', 'Lachen'], ['😮', 'Wow'], ['⚔️', 'Kampf'], ['💎', 'Kristall']];
  const KIND = {
    text: ['💬', 'Beitrag'], photo: ['📷', 'Foto / GIF'], showcase: ['🎨', 'Showcase'], kvk: ['🏁', 'KvK-Bilanz'], aoo: ['🏛️', 'AoO-Showcase'],
    craft: ['⚒️', 'Craft-Upgrade'], pass: ['🚪', 'Pass-Start'], stock: ['📦', 'Bestand'], kvkpts: ['⚔️', 'Kill-Punkte & Verdienst'],
    vip: ['👑', 'VIP-Stufe'], kvkmap: ['🗺️', 'KvK-Karte'], help: ['🆘', 'Help Me']
  };
  // Filter: Art des Beitrags (Name-Suche kommt zusätzlich)
  const FILTERS = [['all', 'Alle', null], ['mine', '⭐ Meine', null], ['photo', '📷 Fotos', ['photo']], ['showcase', '🎨 Showcases', ['showcase', 'aoo']],
    ['craft', '⚒️ Craft', ['craft']], ['help', '🆘 Help Me', ['help']], ['pass', '🚪 Pass-Start', ['pass']], ['kvkpts', '⚔️ KP & Verdienst', ['kvkpts']],
    ['kvk', '🏁 KvK-Bilanz & Karte', ['kvk', 'kvkmap']], ['stock', '📦 Bestand', ['stock']], ['vip', '👑 VIP', ['vip']], ['text', '💬 Text', ['text']]];
  const LIMIT = 40, POLL_MS = 20000;
  const st = { posts: [], pending: [], reacts: {}, users: {}, loaded: false, loading: false, polling: false, err: '', noTable: false,
    attach: null, busy: false, admin: false, text: '', filter: 'all', q: '', hasMore: false, moreBusy: false, gq: '', lastSync: 0,
    comments: {}, cmOpen: new Set(), cmDraft: {}, cmBusy: false, noCm: false, deferRender: false };
  const db = () => A.db();
  const me = () => A.userId();
  const root = $('feedView');
  if (!root) return;
  const short = (n) => (R.short ? R.short(n) : R.fmt(n));
  const fmt = (n) => R.fmt(n);
  const days = (min) => ((+min || 0) / 1440).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const num = (v) => { const n = R.parseAmount ? R.parseAmount(v) : +String(v).replace(/[^\d]/g, ''); return Number.isFinite(n) ? n : 0; };
  const signed = (n) => (n > 0 ? '+' : n < 0 ? '−' : '±') + short(Math.abs(n));
  const toLocalInput = (ts) => (ts ? new Date(ts - new Date(ts).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
  const fromLocalInput = (v) => { const t = new Date(v).getTime(); return Number.isFinite(t) ? t : null; };
  const dateTxt = (ts) => new Date(ts).toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  // ======================================================================
  // Laden · Auto-Aktualisieren · Ältere laden
  // ======================================================================
  async function fetchReacts(ids) {
    const out = {};
    if (!ids.length) return out;
    const r = await db().from('feed_reactions').select('*').in('post_id', ids);
    if (!r.error) (r.data || []).forEach((x) => { (out[x.post_id] = out[x.post_id] || []).push(x); });
    return out;
  }
  async function fetchComments(ids) {
    const out = {};
    if (!ids.length || st.noCm) return out;
    const r = await db().from('feed_comments').select('*').in('post_id', ids).order('created_at', { ascending: true });
    if (r.error) { if (R.tableMissing(r.error)) st.noCm = true; return out; }
    (r.data || []).forEach((x) => { (out[x.post_id] = out[x.post_id] || []).push(x); });
    return out;
  }
  async function addUsers(posts) {
    const miss = [...new Set(posts.map((p) => p.user_id))].filter((id) => !st.users[id]);
    if (miss.length) st.users = { ...st.users, ...(await R.users(miss)) };
  }
  async function load() {
    if (st.loading) return; st.loading = true; st.err = ''; renderList();
    try {
      const { data, error } = await db().from('feed_posts').select('*').order('created_at', { ascending: false }).limit(LIMIT);
      if (error) throw error;
      st.posts = data || []; st.pending = []; st.hasMore = st.posts.length === LIMIT;
      const ids = st.posts.map((p) => p.id);
      [st.reacts, st.comments] = await Promise.all([fetchReacts(ids), fetchComments(ids)]);
      st.users = {}; await addUsers([...st.posts, ...Object.values(st.comments).flat()]);
      st.noTable = false; st.lastSync = Date.now();
    } catch (e) { if (R.tableMissing(e)) st.noTable = true; else st.err = A.germanError ? A.germanError(e) : String(e.message || e); }
    st.loading = false; st.loaded = true; renderList();
  }
  const sig = () => JSON.stringify([st.posts.map((p) => p.id + (p.image || '')), st.pending.length, Object.entries(st.reacts).map(([k, v]) => k + v.map((x) => x.user_id + x.emoji).join()), Object.values(st.comments).flat().map((c) => c.id)]);
  const typing = () => { const l = $('feedList'), a = document.activeElement; return !!(l && a && l.contains(a) && a.tagName === 'INPUT'); };
  const scrolledDown = () => { const l = $('feedList'); return !!l && l.getBoundingClientRect().top < -150; };
  // Leise im Hintergrund: neue Beiträge, gelöschte Beiträge und Reaktionen abgleichen
  async function poll() {
    if (st.polling || st.loading || st.noTable || !st.loaded) return;
    st.polling = true;
    try {
      const all = [...st.pending, ...st.posts];
      const win = all.slice(0, LIMIT), cutoff = win.length ? win[win.length - 1].created_at : null;
      let q = db().from('feed_posts').select('*').order('created_at', { ascending: false });
      q = cutoff ? q.gte('created_at', cutoff).limit(200) : q.limit(LIMIT);
      const { data, error } = await q;
      if (error) throw error;
      const fresh = data || [], shown = new Set(st.posts.map((p) => p.id));
      const older = cutoff ? st.posts.filter((p) => p.created_at < cutoff) : [];
      const before = sig();
      await addUsers(fresh);
      const newOnes = fresh.filter((p) => !shown.has(p.id) && p.user_id !== me());
      if (newOnes.length && scrolledDown()) {           // weiter unten am Lesen → nicht verschieben, nur Hinweis zeigen
        st.pending = newOnes;
        st.posts = [...fresh.filter((p) => shown.has(p.id) || p.user_id === me()), ...older];
      } else { st.pending = []; st.posts = [...fresh, ...older]; }
      const ids = [...st.pending, ...st.posts].map((p) => p.id);
      [st.reacts, st.comments] = await Promise.all([fetchReacts(ids), fetchComments(ids)]);
      await addUsers(Object.values(st.comments).flat());
      st.lastSync = Date.now();
      if (sig() === before) renderSync();
      else if (typing()) { st.deferRender = true; renderSync(); }   // gerade am Kommentieren → nicht stören, später zeichnen
      else renderList();
    } catch (e) { /* stilles Nachladen – Fehler erst beim nächsten Versuch erneut */ }
    st.polling = false;
  }
  function showPending() {
    st.posts = [...st.pending, ...st.posts]; st.pending = []; renderList();
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  async function more() {
    if (st.moreBusy || !st.posts.length) return;
    st.moreBusy = true; renderList();
    try {
      const oldest = st.posts[st.posts.length - 1].created_at;
      const { data, error } = await db().from('feed_posts').select('*').order('created_at', { ascending: false }).lt('created_at', oldest).limit(LIMIT);
      if (error) throw error;
      const add = data || [];
      await addUsers(add);
      const ids = add.map((p) => p.id), [rx, cm] = await Promise.all([fetchReacts(ids), fetchComments(ids)]);
      Object.assign(st.reacts, rx); Object.assign(st.comments, cm); await addUsers(Object.values(cm).flat());
      st.posts = [...st.posts, ...add]; st.hasMore = add.length === LIMIT;
    } catch (e) { msg('Ältere Beiträge konnten nicht geladen werden: ' + (e.message || e), 'err'); }
    st.moreBusy = false; renderList();
  }
  A.isAdmin().then((ok) => { st.admin = !!ok; if (st.loaded) renderList(); }).catch(() => {});

  // ======================================================================
  // Beitrag anlegen · löschen · reagieren
  // ======================================================================
  const dataUrlToBlob = async (u) => (await fetch(u)).blob();
  function checkAttach(a) {
    if (!a) return '';
    const d = a.data || {};
    if (a.kind === 'craft') { if (!d.item && !d.name) return 'Wähl zuerst das Ausrüstungsteil.'; if (!d.crafted && !d.ic && !d.exp && !(d.note || '').trim()) return 'Gib an, was verbessert wurde (neu gecraftet, Iconic, Expertise oder eigene Angabe).'; }
    if (a.kind === 'pass' && !d.ts) return 'Trag ein, wann dein Pass öffnet.';
    if (a.kind === 'stock' && !d.res && !d.speed && !d.ap) return 'Wähl mindestens Ressourcen, Speedups oder AP aus.';
    if (a.kind === 'kvkpts' && !d.kp && !d.acclaim && !d.deads) return 'Trag Kill-Punkte oder Verdienst ein.';
    if (a.kind === 'help' && !d.rid) return 'Wähl die Help-Me-Anfrage aus.';
    if (a.kind === 'vip' && !(d.lv >= 1)) return d.mode === 'status' ? 'Für den VIP-Status fehlt ein VIP-Scan.' : 'Trag deine neue VIP-Stufe ein (1–20).';
    return '';
  }
  async function post() {
    const body = st.text.trim(), a = st.attach;
    if (!body && !a) { msg('Schreib etwas oder häng etwas an.', 'warn'); return; }
    const bad = checkAttach(a); if (bad) { msg(bad, 'warn'); return; }
    if (st.busy) return; st.busy = true; msg('Wird gepostet …', 'busy'); renderComposer();
    try {
      const row = { user_id: me(), kind: a ? a.kind : 'text', body: body.slice(0, 1000), image: null, data: a ? cleanData(a) : null };
      const { data: ins, error } = await db().from('feed_posts').insert(row).select().single();
      if (error) throw error;
      if (a && a.dataUrl) {   // Bild erst nach dem Anlegen hochladen (Dateiname = Beitrags-ID)
        try {
          const url = await A.uploadImage(await dataUrlToBlob(a.dataUrl), 'feed_' + ins.id);
          await db().from('feed_posts').update({ image: url }).eq('id', ins.id);
        } catch (x) { msg('Beitrag gepostet, aber das Bild konnte nicht hochgeladen werden: ' + (x.message || x), 'warn'); }
      }
      st.attach = null; st.text = '';
      msg('✓ Gepostet', 'ok');
      await load();
    } catch (e) { msg(R.tableMissing(e) ? 'Die Feed-Tabellen fehlen noch in Supabase (SQL im Chat ausführen).' : 'Posten fehlgeschlagen: ' + (A.germanError ? A.germanError(e) : e.message), 'err'); }
    st.busy = false; renderComposer();
  }
  // nur die Werte speichern, die der Beitrag zeigt (keine Formular-Hilfsfelder)
  function cleanData(a) {
    const d = { ...(a.data || {}) };
    delete d._segs; delete d.opt;
    return Object.keys(d).length ? d : null;
  }
  async function del(id) {
    if (!(await window.UI.confirm('Diesen Beitrag löschen?'))) return;
    const { error } = await db().from('feed_posts').delete().eq('id', id);
    if (error) { msg('Löschen fehlgeschlagen: ' + (A.germanError ? A.germanError(error) : error.message), 'err'); return; }
    st.posts = st.posts.filter((p) => p.id !== id); renderList();
  }
  async function sendComment(postId) {
    const body = String(st.cmDraft[postId] || '').trim().slice(0, 500);
    if (!body || st.cmBusy) return;
    st.cmBusy = true;
    try {
      const { data, error } = await db().from('feed_comments').insert({ post_id: postId, user_id: me(), body }).select().single();
      if (error) throw error;
      (st.comments[postId] = st.comments[postId] || []).push(data);
      delete st.cmDraft[postId]; await addUsers([data]);
    } catch (e) { msg(R.tableMissing(e) ? 'Die Kommentar-Tabelle fehlt noch in Supabase (SQL im Chat ausführen).' : 'Kommentar fehlgeschlagen: ' + (A.germanError ? A.germanError(e) : e.message), 'err'); if (R.tableMissing(e)) st.noCm = true; }
    st.cmBusy = false; renderList();
    const inp = root.querySelector(`[data-cm-in="${CSS.escape(postId)}"]`); if (inp) inp.focus();
  }
  async function delComment(postId, id) {
    if (!(await window.UI.confirm('Diesen Kommentar löschen?'))) return;
    const { error } = await db().from('feed_comments').delete().eq('id', id);
    if (error) { msg('Löschen fehlgeschlagen: ' + (A.germanError ? A.germanError(error) : error.message), 'err'); return; }
    st.comments[postId] = (st.comments[postId] || []).filter((c) => c.id !== id); renderList();
  }
  async function react(postId, emoji) {
    const mine = (st.reacts[postId] || []).find((x) => x.user_id === me());
    try {
      if (mine && mine.emoji === emoji) {
        await db().from('feed_reactions').delete().eq('post_id', postId).eq('user_id', me());
        st.reacts[postId] = (st.reacts[postId] || []).filter((x) => x.user_id !== me());
      } else {
        const { error } = await db().from('feed_reactions').upsert({ post_id: postId, user_id: me(), emoji });
        if (error) throw error;
        st.reacts[postId] = [...(st.reacts[postId] || []).filter((x) => x.user_id !== me()), { post_id: postId, user_id: me(), emoji }];
      }
    } catch (e) { msg('Reaktion fehlgeschlagen: ' + (e.message || e), 'err'); }
    renderList();
  }

  // ======================================================================
  // Foto vom Gerät + Nacktbild-Filter (läuft im Browser, nichts wird vorher hochgeladen)
  // ======================================================================
  const NSFW_CDN = 'https://cdn.jsdelivr.net/npm/nsfwjs@4.4.0/dist/';
  const NSFW_SRC = ['https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js',
    NSFW_CDN + 'models/mobilenet_v2/model.min.js', NSFW_CDN + 'models/mobilenet_v2/group1-shard1of1.min.js', NSFW_CDN + 'browser/nsfwjs.min.js'];
  let nsfwP = null;
  const loadScript = (src) => new Promise((ok, no) => {
    if (document.querySelector(`script[data-nsfw="${src}"]`)) { ok(); return; }
    const s = document.createElement('script'); s.src = src; s.async = false; s.dataset.nsfw = src;
    s.onload = ok; s.onerror = () => { s.remove(); no(new Error('Bildprüfung konnte nicht geladen werden')); };
    document.head.appendChild(s);
  });
  function nsfwModel() {
    if (!nsfwP) nsfwP = (async () => {
      for (const src of NSFW_SRC) await loadScript(src);
      if (!window.nsfwjs) throw new Error('Bildprüfung nicht verfügbar');
      return window.nsfwjs.load('MobileNetV2');
    })().catch((e) => { nsfwP = null; throw e; });
    return nsfwP;
  }
  // true = in Ordnung · wirft bei anstößigem Bild oder wenn die Prüfung nicht läuft
  async function checkImage(dataUrl) {
    const model = await nsfwModel();
    const img = new Image(); img.src = dataUrl; await img.decode();
    const pr = Object.fromEntries((await model.classify(img)).map((x) => [x.className, x.probability]));
    const porn = (pr.Porn || 0) + (pr.Hentai || 0);
    if (porn >= 0.6 || (pr.Sexy || 0) >= 0.85) { const e = new Error('BLOCK'); e.block = true; throw e; }
    return true;
  }
  const readDataUrl = (file) => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => no(new Error('Datei konnte nicht gelesen werden')); r.readAsDataURL(file); });
  const GIF_MAX = 8 * 1024 * 1024;
  async function pickPhoto(file) {
    if (!file) return;
    if (!/^image\//.test(file.type)) { msg('Das ist kein Bild.', 'warn'); return; }
    const gif = file.type === 'image/gif';
    if (gif && file.size > GIF_MAX) { msg(`Das GIF ist zu groß (${(file.size / 1048576).toFixed(1)} MB) – höchstens 8 MB.`, 'warn'); return; }
    st.busy = true; msg(gif ? 'GIF wird geprüft …' : 'Foto wird geprüft …', 'busy'); renderComposer();
    try {
      // GIF unverändert lassen (sonst bewegt es sich nicht mehr) – geprüft wird das erste Bild
      const dataUrl = gif ? await readDataUrl(file) : (await R.prepareImage(file)).dataUrl;
      await checkImage(dataUrl);
      st.attach = { kind: 'photo', dataUrl, gif, data: gif ? { gif: true } : null }; msg('', '');
    } catch (e) {
      st.attach = null;
      msg(e.block ? '🚫 Dieses Bild ist im Feed nicht erlaubt.' : 'Bild nicht angehängt: ' + (e.message || e) + ' – bitte später nochmal versuchen.', e.block ? 'err' : 'warn');
    }
    st.busy = false; renderComposer();
  }

  // ======================================================================
  // Anhänge
  // ======================================================================
  async function attachShowcase() {
    msg('Showcase wird als Bild erstellt …', 'busy');
    try {
      const { url, title } = await R.showcaseImage({ jpeg: true, pixelRatio: 1.25 });
      st.attach = { kind: 'showcase', dataUrl: url, data: { title } }; msg('', '');
    } catch (e) { msg('Showcase-Bild fehlgeschlagen: ' + (e.message || e), 'err'); }
    renderComposer();
  }
  function attachKvk() {
    const img = (A.ownMeta() || {}).kvk_card;
    if (!img) { msg('Noch keine KvK-Bilanz – im KvK-Bereich unter Stats → „Bild für dein Profil“ → „Im Profil zeigen“.', 'warn'); return; }
    st.attach = { kind: 'kvk', dataUrl: img, data: {} }; renderComposer();
  }
  function attachAoo() {
    const c = (A.ownMeta() || {}).aoo_card;
    if (!c) { msg('Noch kein AoO-Showcase – unter 🎨 Showcases anlegen.', 'warn'); return; }
    st.attach = { kind: 'aoo', data: c }; renderComposer();
  }

  // ---------- Craft-Upgrade: Teil wählen + was genau verbessert wurde ----------
  const CAT_LABEL = { helm: 'Helm', chest: 'Brust', weapon: 'Waffe', gloves: 'Handschuhe', legs: 'Beine', boots: 'Stiefel', accessory: 'Accessoire' };
  const ROMAN = R.ROMAN || ['I', 'II', 'III', 'IV', 'V'];
  const REFT = R.REFTYPES || {};
  const ownGear = () => {
    const out = [], seen = new Set();
    (R.showcaseList ? R.showcaseList() : []).forEach((sc) => (sc.sets || []).forEach((set) => Object.entries(set.gear || {}).forEach(([slot, g]) => {
      if (!g || !(g.item || g.name)) return;
      const it = R.gItem ? R.gItem(g.item) : null, key = g.item || g.name; if (seen.has(key)) return; seen.add(key);
      const sl = (R.GEAR_SLOTS || []).find((s) => s.k === slot);
      out.push({ item: g.item || '', name: g.name || it?.name || '?', icon: g.icon || it?.icon || '', rarity: g.rarity || it?.rarity || 'legendary',
        slot: sl ? sl.label : slot, tier: +g.tier || 0, refType: g.refType || '' });
    })));
    return out;
  };
  const gearSearch = (q) => {
    const cat = R.gearCat || [], t = q.trim().toLowerCase();
    if (!t) return [];
    return cat.filter((i) => i.name && ['legendary', 'epic'].includes(i.rarity) && i.name.toLowerCase().includes(t)).slice(0, 16)
      .map((i) => ({ item: i.id, name: i.name, icon: i.icon || '', rarity: i.rarity, slot: CAT_LABEL[i.cat] || i.cat || '', tier: 0, refType: '' }));
  };
  function attachCraft() {
    if (R.gearDbState === 'idle' && R.loadGearDb) R.loadGearDb();
    st.attach = { kind: 'craft', data: { item: '', name: '', icon: '', rarity: 'legendary', slot: '', crafted: false, ic: null, exp: false, refType: '', note: '' } };
    st.gq = ''; renderComposer();
  }
  function pickGear(g) {
    const d = st.attach.data;
    Object.assign(d, { item: g.item, name: g.name, icon: g.icon, rarity: g.rarity, slot: g.slot });
    if (g.rarity !== 'legendary') d.ic = null;
    else if (g.tier > 0 && !d.ic) d.ic = [g.tier - 1, g.tier];   // Showcase-Stand = nachher
    if (g.refType && !d.refType) d.refType = g.refType;
    st.gq = ''; renderComposer();
  }

  // ---------- Pass-Start ----------
  function passPlan() {
    try { const p = window.KvKCalc && window.KvKCalc.passTimes ? window.KvKCalc.passTimes() : null; return p && p.start != null ? p.passes : []; } catch { return []; }
  }
  function attachPass() {
    const plan = passPlan(), now = Date.now();
    const next = plan.filter((p) => p.ts > now - 3600000).sort((x, y) => x.ts - y.ts)[0] || plan[0];   // nächster anstehender Pass
    st.attach = { kind: 'pass', data: { n: next ? next.n : 4, ts: next ? next.ts : null } };
    renderComposer();
  }

  // ---------- Bestand: letzte Scans von Ressourcen, Speedups, AP ----------
  const RES_K = [['food', '🌾', 'Proviant'], ['wood', '🪵', 'Holz'], ['stone', '🪨', 'Stein'], ['gold', '🪙', 'Gold']];
  const SPD_K = [['universal', '⏱️', 'Universal'], ['training', '⚔️', 'Training'], ['healing', '❤️', 'Heilung'], ['research', '📘', 'Forschung'], ['building', '🔨', 'Bau']];
  const BAG = { food: 'bagFood', wood: 'bagWood', stone: 'bagStone', gold: 'bagGold' };
  const latest = (type, ok) => (R.history || []).filter((e) => e.type === type && (!ok || ok(e))).sort((a, b) => b.ts - a.ts)[0] || null;
  function stockSrc() {
    const res = latest('resources', (e) => RES_K.some(([k]) => e[k] != null));
    const spd = latest('speedups', (e) => SPD_K.some(([k]) => e[k] != null));
    const ap = latest('ap', (e) => e.total_ap != null || e.ap_50 != null);
    return { res, spd, ap };
  }
  // Auswahl: einzelne Ressourcen / Speedup-Arten, „Uni + Heilung“ als gemeinsame Zahl, AP gesamt
  // opt-Schlüssel: r_food … r_gold, bag, s_universal … s_building, uh, ap
  const STOCK_PRESETS = [['all', 'Alles'], ['res', 'Nur Rss'], ['speed', 'Nur Speedups'], ['uh', 'Uni + Heilung'], ['ap', 'Nur AP']];
  function stockPreset(p) {
    const s = stockSrc(), o = { bag: true };
    RES_K.forEach(([k]) => { o['r_' + k] = !!s.res && (p === 'all' || p === 'res'); });
    SPD_K.forEach(([k]) => { o['s_' + k] = !!s.spd && (p === 'all' || p === 'speed'); });
    o.uh = !!s.spd && p === 'uh';
    o.ap = !!s.ap && (p === 'all' || p === 'ap');
    return o;
  }
  function stockBuild(opt) {
    const s = stockSrc(), d = { opt };
    const rk = RES_K.map(([k]) => k).filter((k) => opt['r_' + k]);
    if (s.res && rk.length) {
      const x = { bag: !!opt.bag, ts: s.res.ts };
      rk.forEach((k) => { const g = +s.res[k] || 0, bag = +s.res[BAG[k]] || 0; x[k] = opt.bag ? g : Math.max(0, g - bag); });
      d.res = x;
    }
    const sk = SPD_K.map(([k]) => k).filter((k) => opt['s_' + k]);
    if (s.spd && (sk.length || opt.uh)) {
      const x = { ts: s.spd.ts };
      sk.forEach((k) => { x[k] = +s.spd[k] || 0; });
      if (opt.uh) x.uh = (+s.spd.universal || 0) + (+s.spd.healing || 0);
      d.speed = x;
    }
    if (opt.ap && s.ap) {
      const e = s.ap, total = e.total_ap ?? (50 * (e.ap_50 || 0) + 100 * (e.ap_100 || 0) + 500 * (e.ap_500 || 0) + 1000 * (e.ap_1000 || 0));
      d.ap = { total, ts: e.ts };   // nur die Gesamtzahl
    }
    return d;
  }
  function attachStock() {
    const s = stockSrc();
    if (!s.res && !s.spd && !s.ap) { msg('Noch keine Scans – zuerst Ressourcen, Speedups oder AP im Scanner erfassen.', 'warn'); return; }
    st.attach = { kind: 'stock', data: stockBuild(stockPreset('all')) };
    renderComposer();
  }

  // ---------- VIP: Stufe + wie weit bis zur nächsten ----------
  const VIP_PTS = [0, 10, 100, 300, 1000, 2500, 10000, 25000, 45000, 75000, 150000, 250000, 350000, 500000, 750000, 1000000, 1500000, 2500000, 4000000, 6000000, 9000000];
  const vipLv = (p) => { let l = 0; VIP_PTS.forEach((t, i) => { if (p >= t) l = i; }); return l; };
  const vipName = (l) => (R.vipName ? R.vipName(l) : +l >= 20 ? 'SVIP' : 'VIP ' + l);
  const vipSrc = () => latest('vip', (e) => e.current != null || e.after != null);
  // Status: immer inkl. Rucksack, mit Abstand zur nächsten Stufe · Neue Stufe: nur die Stufe (selbst eingeben)
  function vipBuild(mode, lv) {
    const e = vipSrc();
    if (mode === 'new') {
      const auto = e ? vipLv(Math.round(e.after ?? e.current ?? 0)) : 1;
      return { mode: 'new', lv: Math.max(1, Math.min(20, Math.round(+lv || auto || 1))) };
    }
    if (!e) return null;
    const pts = Math.round(e.after ?? e.current ?? 0), l = vipLv(pts);
    return { mode: 'status', bag: true, pts, lv: l, next: VIP_PTS[l + 1] ?? null, ts: e.ts };
  }
  function attachVip() {
    st.attach = { kind: 'vip', data: vipBuild('new') }; renderComposer();
  }

  // ---------- KvK-Karte (aus KvK → Karte) ----------
  function attachMap() {
    const K = window.KvKCalc;
    if (!K || !K.mapData || !K.openMapModal) { msg('Der KvK-Bereich ist noch nicht geladen.', 'warn'); return; }
    let map = null, s = null; try { map = K.mapData(); s = K.getState(); } catch { map = null; }
    if (!map || !(map.kds || []).some((x) => x && x.length)) { msg('Noch keine Karte – unter KvK → Karte die Camps mit ihren Königreichen eintragen.', 'warn'); return; }
    const names = [0, 1, 2, 3].map((i) => String((((s || {}).mid || {}).camps || [])[i]?.name || '').slice(0, 30));
    st.attach = { kind: 'kvkmap', data: { map, names, start: (s && s.startDate) || '', kingdom: String((A.ownMeta() || {}).kingdom || '') } };
    renderComposer();
  }
  function openMap(d) {
    if (!d || !d.map || !window.KvKCalc || !window.KvKCalc.openMapModal) { msg('Die Karte kann gerade nicht geöffnet werden.', 'warn'); return; }
    window.KvKCalc.openMapModal(d.map, { kingdom: d.kingdom || '', startDate: d.start || '' });
  }

  // ---------- Help Me: eigene Anfrage teilen, mit Sprung zum Beitrag ----------
  async function attachHelp() {
    msg('Deine Help-Me-Anfragen werden geladen …', 'busy');
    try {
      const { data, error } = await db().from('help_requests').select('id,title,sets,status,created_at').eq('user_id', me()).order('created_at', { ascending: false }).limit(10);
      if (error) throw error;
      const list = (data || []).filter((r) => r.status !== 'closed').map((r) => ({ rid: r.id, title: r.title || 'Was soll ich als Nächstes craften?',
        sets: (r.sets || []).length, items: (r.sets || []).reduce((a, x) => a + (x.gear || []).length, 0), at: r.created_at,
        icons: (r.sets || []).flatMap((x) => (x.gear || []).map((g) => ({ icon: g.icon || '', rarity: g.rarity || '' }))).slice(0, 8) }));
      if (!list.length) { msg('Keine offene Help-Me-Anfrage – zuerst unter 🆘 Help Me eine stellen.', 'warn'); return; }
      const f = list[0];
      st.attach = { kind: 'help', data: { rid: f.rid, title: f.title, sets: f.sets, items: f.items, icons: f.icons }, list };
      msg('', '');
    } catch (e) { msg(R.tableMissing(e) ? 'Die Help-Me-Tabellen fehlen noch in Supabase.' : 'Help-Me-Anfragen nicht geladen: ' + (e.message || e), 'err'); }
    renderComposer();
  }
  function goHelp(rid) {
    if (R.helpOpen) R.helpOpen(rid); else if (R.goView) R.goView('help');
  }

  // ---------- Kill-Punkte & Verdienst je Pass (aus KvK → Stats) ----------
  // Abschnitte wie in der KvK-Timeline: Pass 4 · Altäre · Pass 7 · Pass 8 · KvK gesamt.
  // Zahlen für die Pässe und das ganze KvK kommen aus KvK → Stats (Zwischenstände), Altäre trägt man selbst ein.
  const dd = (ts) => new Date(ts).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  function kvkSegs() {
    let s = null, tl = [];
    try { s = window.KvKCalc && window.KvKCalc.getState ? window.KvKCalc.getState() : null; } catch { s = null; }
    try { tl = window.KvKCalc && window.KvKCalc.timeline ? window.KvKCalc.timeline() || [] : []; } catch { tl = []; }
    const pick = (o) => ({ kp: +(o || {}).kp || 0, acclaim: +(o || {}).acclaim || 0, deads: +(o || {}).deads || 0 });
    const st0 = s || {}, start = { kp: +(st0.stats || {}).kp || 0, acclaim: 0, deads: +(st0.stats || {}).deads || 0 };
    const pp = ((st0.end || {}).pp) || {}, P = { 4: pick(pp[4]), 7: pick(pp[7]), 8: pick(pp[8]) };
    const end = pick((st0.end || {}).now), now = pick((st0.mid || {}).now);
    const has = (o) => o.kp > 0 || o.acclaim > 0;
    const diff = (cur, prev, k) => { if (!(cur[k] > 0)) return 0; if (k === 'acclaim') return Math.max(0, cur[k] - (prev[k] || 0)); return prev[k] > 0 ? Math.max(0, cur[k] - prev[k]) : 0; };
    const vals = (cur, prev) => ({ kp: diff(cur, prev, 'kp'), acclaim: diff(cur, prev, 'acclaim'), deads: diff(cur, prev, 'deads') });
    const passVals = (n) => { if (!has(P[n])) return { kp: 0, acclaim: 0, deads: 0 }; const prev = [8, 7, 4].filter((m) => m < n).map((m) => P[m]).find(has) || start; return vals(P[n], prev); };
    const out = [], seen = new Set(), t = Date.now();
    let altar = 0;
    tl.forEach((e) => {
      if (e.kind === 'altar') { altar++; if (e.ts <= t + 864e5) out.push({ id: 'a' + altar, label: `Altar ${altar} · ${dd(e.ts)}`, ts: e.ts, kp: 0, acclaim: 0, deads: 0 }); return; }
      if (seen.has(e.n)) return; seen.add(e.n);
      out.push({ id: 'p' + e.n, label: `Pass ${e.n} · ${dd(e.ts)}`, ts: e.ts, ...passVals(e.n) });
    });
    if (!tl.length) {   // ohne KvK-Startdatum: feste Abschnitte
      out.push({ id: 'p4', label: 'Pass 4', ...passVals(4) }, { id: 'a1', label: 'Altar', kp: 0, acclaim: 0, deads: 0 }, { id: 'p7', label: 'Pass 7', ...passVals(7) }, { id: 'p8', label: 'Pass 8', ...passVals(8) });
    }
    const cur = has(end) ? end : [now, P[8], P[7], P[4]].find(has);
    out.push({ id: 'kvk', label: has(end) ? 'KvK gesamt' : 'KvK gesamt (bisher)', ...(cur ? vals(cur, start) : { kp: 0, acclaim: 0, deads: 0 }) });
    return out;
  }
  function attachKvkPts() {
    const segs = kvkSegs(), t = Date.now();
    const def = [...segs].reverse().find((x) => x.ts && x.ts <= t && (x.kp || x.acclaim)) || [...segs].reverse().find((x) => x.ts && x.ts <= t) || segs[segs.length - 1];
    st.attach = { kind: 'kvkpts', data: { seg: def.id, label: def.label, kp: def.kp, acclaim: def.acclaim, deads: def.deads, _segs: segs } };
    renderComposer();
  }

  // ======================================================================
  // Darstellung der Anhänge (im Beitrag und als Vorschau)
  // ======================================================================
  const rarCol = { legendary: 'text-amber-300', epic: 'text-fuchsia-300', elite: 'text-sky-300', advanced: 'text-emerald-300', normal: 'text-slate-300' };
  const icoBox = (src, cls, fallback) => (src ? `<img src="${esc(src)}" alt="" class="${cls} rounded-lg object-contain bg-ink-900">` : `<span class="${cls} rounded-lg grid place-items-center text-2xl bg-ink-900">${fallback}</span>`);
  const craftTile = (g) => {
    const lines = [];
    if (g.crafted) lines.push(['🆕', 'Neu gecraftet']);
    if (Array.isArray(g.ic)) lines.push(['🏅', `Iconic ${g.ic[0] > 0 ? ROMAN[g.ic[0] - 1] : '–'} → <b class="text-gold-200">${ROMAN[g.ic[1] - 1] || '?'}</b>`]);
    if (g.exp) lines.push(['✦', `Expertise freigeschaltet${g.refType && REFT[g.refType] ? ` · ${esc(REFT[g.refType].label)}` : ''}`]);
    if (g.note) lines.push(['📝', esc(g.note)]);
    const old = !lines.length && (g.tier || g.refine || g.set)   // ältere Beiträge (nur Stand)
      ? `<div class="text-xs text-slate-400">${g.tier ? `Iconic ${ROMAN[g.tier - 1]}` : ''}${g.refine ? ' · Refine fertig' : ''}${g.set ? ` · ${esc(g.set)}` : ''}</div>` : '';
    return `<div class="flex items-start gap-3 rounded-xl border border-gold-500/30 bg-ink-950/70 p-3">
      ${icoBox(g.icon, 'w-14 h-14 shrink-0', '⚒️')}
      <div class="min-w-0 flex-1"><div class="text-[10px] uppercase tracking-widest text-slate-500">⚒️ Craft-Upgrade${g.slot ? ` · ${esc(g.slot)}` : ''}</div>
        <div class="font-semibold ${rarCol[g.rarity] || 'text-slate-100'} truncate">${esc(g.name || '?')}</div>
        ${lines.length ? `<ul class="mt-1 space-y-0.5 text-sm text-slate-200">${lines.map(([i, t]) => `<li class="flex gap-1.5"><span class="w-5 shrink-0 text-center">${i}</span><span class="min-w-0 break-words">${t}</span></li>`).join('')}</ul>` : old}
      </div></div>`;
  };
  const aooTile = (c) => `<div class="rounded-xl border border-sky-400/40 bg-gradient-to-br from-sky-950/60 to-ink-950 p-3">
      <div class="text-[10px] uppercase tracking-widest text-sky-300">🏛️ Ark of Osiris</div>
      <div class="flex flex-wrap gap-x-5 gap-y-1 mt-1 text-sm"><span>🏆 <b>${esc(String(c.wins ?? '–'))}</b> Siege</span>${c.mvp != null ? `<span>⭐ <b>${esc(String(c.mvp))}</b> MVP</span>` : ''}${c.role ? `<span>🎯 ${esc(c.role)}</span>` : ''}</div>
      ${c.motto ? `<div class="text-xs text-slate-300 mt-1 italic">„${esc(c.motto)}“</div>` : ''}</div>`;
  const cdText = (ts) => {
    const d = ts - Date.now(), a = Math.abs(d), dd = Math.floor(a / 864e5), h = Math.floor(a % 864e5 / 36e5), m = Math.floor(a % 36e5 / 6e4);
    const t = [dd && `${dd} T`, (dd || h) && `${h} Std`, !dd && `${m} Min`].filter(Boolean).join(' ') || 'gleich';
    return d > 0 ? `öffnet in ${t}` : a < 6 * 36e5 ? `seit ${t} offen` : 'ist offen';
  };
  const passTile = (d) => `<div class="rounded-xl border border-gold-500/40 bg-gradient-to-br from-amber-950/50 to-ink-950 p-4 flex items-center gap-4">
      <span class="w-14 h-14 shrink-0 rounded-xl grid place-items-center bg-gold-500/15 border border-gold-500/40 text-2xl">🚪</span>
      <div class="min-w-0"><div class="text-[10px] uppercase tracking-widest text-gold-300">Mein Pass startet</div>
        <div class="font-display text-xl text-slate-100">Pass ${esc(String(d.n || '?'))}</div>
        ${d.ts ? `<div class="text-sm text-slate-300">${esc(dateTxt(d.ts))} Uhr <span class="text-slate-500">(deine Zeit)</span></div>
        <div class="text-sm font-semibold text-gold-200" data-cd="${+d.ts}">${cdText(+d.ts)}</div>` : ''}</div></div>`;
  const statCell = (ico, lab, val, sub) => `<div class="rounded-lg bg-ink-900/70 border border-ink-700 px-2.5 py-1.5 min-w-0"><div class="text-[10px] text-slate-500 truncate">${ico} ${lab}</div><div class="font-semibold text-slate-100 tabular-nums">${val}</div>${sub ? `<div class="text-[10px] text-slate-500 truncate">${sub}</div>` : ''}</div>`;
  const stockTile = (d) => {
    const sec = (t, sub, body) => `<div><div class="flex items-baseline justify-between gap-2 mb-1.5"><span class="text-[11px] uppercase tracking-widest text-slate-400">${t}</span>${sub ? `<span class="text-[10px] text-slate-500">${sub}</span>` : ''}</div>${body}</div>`;
    const grid = (cells) => `<div class="grid grid-cols-2 ${cells.length >= 4 ? 'sm:grid-cols-' + Math.min(5, cells.length) : 'sm:grid-cols-4'} gap-1.5">${cells.join('')}</div>`;
    const parts = [];
    if (d.res) {
      const ks = RES_K.filter(([k]) => d.res[k] != null), tot = ks.reduce((a, [k]) => a + (+d.res[k] || 0), 0);
      parts.push(sec('🌾 Ressourcen', `${d.res.bag ? 'inkl. Rucksack' : 'ohne Rucksack'}${ks.length > 1 ? ` · Σ ${short(tot)}` : ''}`,
        grid(ks.map(([k, i, l]) => statCell(i, l, short(d.res[k]))))));
    }
    if (d.speed) {
      const ks = SPD_K.filter(([k]) => d.speed[k] != null), tot = ks.reduce((a, [k]) => a + (+d.speed[k] || 0), 0);
      const cells = [...(d.speed.uh != null ? [statCell('⏱️❤️', 'Uni + Heilung', days(d.speed.uh) + ' T')] : []), ...ks.map(([k, i, l]) => statCell(i, l, days(d.speed[k]) + ' T'))];
      parts.push(sec('⏱️ Speedups', ks.length > 1 ? `Σ ${days(tot)} Tage` : '', grid(cells)));
    }
    if (d.ap) parts.push(sec('🧪 AP', '', grid([statCell('🧪', 'AP gesamt', fmt(d.ap.total))])));
    const ts = Math.max(0, ...[d.res, d.speed, d.ap].filter(Boolean).map((x) => +x.ts || 0));
    return `<div class="rounded-xl border border-emerald-400/30 bg-gradient-to-br from-emerald-950/40 to-ink-950 p-3 flex flex-col gap-3">
      <div class="flex items-baseline justify-between gap-2"><span class="text-[10px] uppercase tracking-widest text-emerald-300">📦 Mein Bestand</span>${ts ? `<span class="text-[10px] text-slate-500">Scan vom ${esc(R.dateLabel ? R.dateLabel(ts) : new Date(ts).toLocaleDateString('de-DE'))}</span>` : ''}</div>
      ${parts.join('') || '<p class="text-sm text-slate-500">nichts ausgewählt</p>'}</div>`;
  };
  const vipTile = (d) => {
    const lv = +d.lv || 0, isNew = d.mode === 'new';
    const head = `<div class="flex items-center gap-4">
        <span class="w-14 h-14 shrink-0 rounded-xl grid place-items-center bg-gold-500/15 border border-gold-500/40 text-2xl">👑</span>
        <div class="min-w-0"><div class="text-[10px] uppercase tracking-widest text-gold-300">${isNew ? '🎉 Neue VIP-Stufe erreicht' : 'Mein VIP-Status'}</div>
          <div class="font-display text-2xl text-slate-100">${esc(vipName(lv))}</div>
          ${!isNew && d.pts != null ? `<div class="text-xs text-slate-400 tabular-nums">${fmt(d.pts)} VIP-Punkte inkl. Rucksack</div>` : ''}</div></div>`;
    if (isNew) return `<div class="rounded-xl border border-gold-500/40 bg-gradient-to-br from-amber-950/50 to-ink-950 p-4">${head}</div>`;
    const base = VIP_PTS[lv] || 0, next = d.next, pct = next ? Math.max(0, Math.min(100, Math.round((d.pts - base) / (next - base) * 100))) : 100;
    return `<div class="rounded-xl border border-gold-500/40 bg-gradient-to-br from-amber-950/50 to-ink-950 p-4 flex flex-col gap-3">${head}
      ${next ? `<div><div class="flex justify-between text-[11px] text-slate-400 mb-1"><span>${esc(vipName(lv))}</span><span class="text-gold-200 font-semibold">${pct} %</span><span>${esc(vipName(lv + 1))}</span></div>
        <div class="h-2.5 rounded-full bg-ink-800 overflow-hidden"><div class="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-300" style="width:${pct}%"></div></div>
        <div class="mt-1.5 text-sm text-slate-200">Noch <b class="text-gold-200 tabular-nums">${fmt(next - d.pts)}</b> Punkte bis ${esc(vipName(lv + 1))}</div></div>`
      : '<div class="text-sm text-gold-200">Höchste Stufe erreicht 👑</div>'}
    </div>`;
  };
  const mapTile = (d, pid) => {
    const m = d.map || {}, kds = m.kds || [], names = d.names || [];
    const camp = (i) => { const list = (kds[i] || []).map(String), my = +m.my === i + 1, ally = +m.ally === i + 1;
      return `<div class="rounded-lg border ${my ? 'border-gold-400/70 bg-gold-500/10' : ally ? 'border-sky-400/50 bg-sky-500/5' : 'border-ink-700 bg-ink-900/60'} px-2.5 py-2 min-w-0">
        <div class="flex items-center justify-between gap-2 text-xs"><span class="font-semibold text-slate-200 truncate">${esc(names[i] || 'Camp ' + (i + 1))}</span><span class="shrink-0 text-[10px] ${my ? 'text-gold-300' : 'text-sky-300'}">${my ? '⭐ mein Camp' : ally ? '🤝 verbündet' : ''}</span></div>
        <div class="text-[11px] text-slate-400 mt-0.5 break-words">${list.length ? list.slice(0, 8).map((k) => `#${esc(k)}`).join(' · ') + (list.length > 8 ? ` · +${list.length - 8}` : '') : '–'}</div></div>`; };
    return `<div class="rounded-xl border border-sky-400/30 bg-gradient-to-br from-sky-950/40 to-ink-950 p-3 flex flex-col gap-2.5">
      <div class="flex items-center justify-between gap-2"><span class="text-[10px] uppercase tracking-widest text-sky-300">🗺️ Meine KvK-Karte${d.start ? ` · Start ${esc(new Date(d.start + 'T00:00:00Z').toLocaleDateString('de-DE'))}` : ''}</span>
        <button type="button" data-feed-map="${esc(pid)}" class="text-xs px-3 py-1.5 rounded-lg bg-sky-500/15 border border-sky-400/50 text-sky-200 hover:bg-sky-500/25">🗺️ Karte öffnen</button></div>
      <div class="grid grid-cols-2 gap-1.5">${[0, 1, 2, 3].map(camp).join('')}</div></div>`;
  };
  const helpTile = (d) => `<div class="rounded-xl border border-rose-400/30 bg-gradient-to-br from-rose-950/40 to-ink-950 p-3 flex flex-col gap-2.5">
      <div class="text-[10px] uppercase tracking-widest text-rose-300">🆘 Help Me – was soll ich craften?</div>
      <div class="font-semibold text-slate-100">${esc(d.title || '')}</div>
      ${(d.icons || []).length ? `<div class="flex flex-wrap gap-1">${d.icons.map((g) => g.icon ? `<img src="${esc(g.icon)}" alt="" class="w-9 h-9 rounded bg-ink-900 object-contain">` : '<span class="w-9 h-9 rounded bg-ink-900 grid place-items-center text-sm">⚒️</span>').join('')}</div>` : ''}
      <div class="flex flex-wrap items-center justify-between gap-2"><span class="text-xs text-slate-400">${+d.sets || 0} Set${+d.sets === 1 ? '' : 's'} · ${+d.items || 0} Teile</span>
        <button type="button" data-feed-help="${esc(d.rid || '')}" class="text-xs px-3 py-1.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-ink-950 font-semibold">Zum Help-Me-Beitrag →</button></div></div>`;
  const kvkptsTile = (d) => `<div class="rounded-xl border border-red-400/30 bg-gradient-to-br from-red-950/40 to-ink-950 p-3">
      <div class="text-[10px] uppercase tracking-widest text-red-300">⚔️ ${esc(d.label || 'KvK')}</div>
      <div class="grid grid-cols-2 ${d.deads ? 'sm:grid-cols-3' : ''} gap-1.5 mt-2">
        ${statCell('⚔️', 'Kill-Punkte', d.kp ? '+' + short(d.kp) : '–', d.kp ? fmt(d.kp) : '')}
        ${statCell('🏅', 'Verdienst', d.acclaim ? '+' + short(d.acclaim) : '–', d.acclaim ? fmt(d.acclaim) : '')}
        ${d.deads ? statCell('💀', 'Deads', short(d.deads), fmt(d.deads)) : ''}
      </div></div>`;
  const imgHTML = (src) => `<a href="${esc(src)}" target="_blank" rel="noopener" class="block"><img src="${esc(src)}" alt="" loading="lazy" class="w-full max-h-[34rem] object-contain rounded-xl border border-ink-700 bg-ink-950"></a>`;
  const attachHTML = (p) => {
    const d = p.data;
    if (p.kind === 'craft' && d) return craftTile(d);
    if (p.kind === 'aoo' && d) return aooTile(d);
    if (p.kind === 'pass' && d) return passTile(d);
    if (p.kind === 'stock' && d) return stockTile(d);
    if (p.kind === 'kvkpts' && d) return kvkptsTile(d);
    if (p.kind === 'vip' && d) return vipTile(d);
    if (p.kind === 'kvkmap' && d) return mapTile(d, p.id);
    if (p.kind === 'help' && d) return helpTile(d);
    if (p.image) return imgHTML(p.image);
    if (p.kind !== 'text') return `<div class="text-xs text-slate-500">(${esc(KIND[p.kind]?.[1] || p.kind)} ohne Bild)</div>`;
    return '';
  };
  const previewHTML = (a) => {
    if (!a) return '';
    if (a.kind === 'craft') return craftTile(a.data);
    if (a.kind === 'aoo') return aooTile(a.data);
    if (a.kind === 'pass') return passTile(a.data);
    if (a.kind === 'stock') return stockTile(a.data);
    if (a.kind === 'kvkpts') return kvkptsTile(a.data);
    if (a.kind === 'vip') return vipTile(a.data);
    if (a.kind === 'kvkmap') return mapTile(a.data, '__prev');
    if (a.kind === 'help') return helpTile(a.data);
    return `<img src="${esc(a.dataUrl)}" alt="" class="w-full max-h-72 object-contain rounded-lg">`;
  };
  const reactBar = (p) => {
    const list = st.reacts[p.id] || [], mine = list.find((x) => x.user_id === me());
    const cnt = {}; list.forEach((x) => { cnt[x.emoji] = (cnt[x.emoji] || 0) + 1; });
    return `<div class="flex flex-wrap items-center gap-1.5 pt-2 border-t border-ink-700/70">${REACTS.map(([e, lab]) => `
      <button type="button" data-react="${esc(p.id)}|${e}" title="${lab}" aria-pressed="${mine && mine.emoji === e}" class="inline-flex items-center gap-1 px-2 py-1 rounded-full border text-sm transition ${mine && mine.emoji === e ? 'border-gold-400 bg-gold-500/15 text-gold-200' : cnt[e] ? 'border-ink-600 bg-ink-900 text-slate-200 hover:border-gold-500/60' : 'border-ink-700 text-slate-500 hover:border-gold-500/60 hover:text-slate-200'}">${e}${cnt[e] ? `<span class="text-[11px] tabular-nums">${cnt[e]}</span>` : ''}</button>`).join('')}</div>`;
  };
  const commentsHTML = (p) => {
    const list = st.comments[p.id] || [], open = st.cmOpen.has(p.id), n = list.length;
    const one = (c) => { const u = st.users[c.user_id] || { username: '?' }, mine = c.user_id === me();
      return `<div class="flex items-start gap-2 min-w-0">
        <button type="button" data-feed-prof="${esc(c.user_id)}" class="shrink-0">${R.avatarHtml ? R.avatarHtml(u.username, u.avatar, 'w-7 h-7 text-xs') : ''}</button>
        <div class="min-w-0 flex-1 rounded-xl bg-ink-900/80 border border-ink-700/70 px-3 py-1.5">
          <div class="flex items-baseline gap-2 text-[11px]"><b class="text-slate-200 truncate" translate="no">${esc(u.username || '?')}</b><span class="text-slate-500 shrink-0">${R.timeAgo(c.created_at)}</span>
            ${mine || st.admin ? `<button type="button" data-cm-del="${esc(p.id)}|${esc(c.id)}" title="Kommentar löschen" class="ml-auto text-slate-600 hover:text-red-300">✕</button>` : ''}</div>
          <p class="text-sm text-slate-100 whitespace-pre-wrap break-words">${esc(c.body)}</p></div></div>`; };
    if (!open) {
      const last = list[n - 1];
      return `<div class="flex flex-col gap-2">
        ${last ? one(last) : ''}
        <button type="button" data-cm-toggle="${esc(p.id)}" class="self-start text-xs text-slate-400 hover:text-gold-300">💬 ${n > 1 ? `Alle ${n} Kommentare · antworten` : n ? 'Antworten' : 'Kommentieren'}</button></div>`;
    }
    return `<div class="flex flex-col gap-2">
      ${list.map(one).join('')}
      ${st.noCm ? '<p class="text-xs text-amber-300">⚠ Kommentare: Die Tabelle fehlt noch in Supabase (SQL im Chat ausführen).</p>' : `<div class="flex items-center gap-2">
        <input type="text" maxlength="500" data-cm-in="${esc(p.id)}" value="${esc(st.cmDraft[p.id] || '')}" placeholder="Kommentar schreiben …" class="${INP} flex-1 min-w-0 !rounded-full !px-3.5">
        <button type="button" data-cm-send="${esc(p.id)}" ${st.cmBusy ? 'disabled' : ''} class="shrink-0 px-3.5 py-1.5 rounded-full bg-gold-500 hover:bg-gold-400 text-ink-950 text-xs font-semibold disabled:opacity-50">Senden</button></div>`}
      <button type="button" data-cm-toggle="${esc(p.id)}" class="self-start text-[11px] text-slate-500 hover:text-slate-300">Einklappen</button></div>`;
  };
  const postHTML = (p) => {
    const u = st.users[p.user_id] || { username: '?' }, own = p.user_id === me(), k = KIND[p.kind] || KIND.text;
    return `<article class="panel rounded-2xl p-4 sm:p-5 flex flex-col gap-3" data-post="${esc(p.id)}">
      <div class="flex items-center gap-3">
        <button type="button" data-feed-prof="${esc(p.user_id)}" class="flex items-center gap-2.5 min-w-0 text-left rounded-lg hover:bg-ink-800/60 pr-2">${R.userLine(u, 'w-10 h-10 text-base')}</button>
        <span class="ml-auto shrink-0 text-[11px] text-slate-500 text-right"><span class="block">${k[0]} ${k[1]}</span>${R.timeAgo(p.created_at)}</span>
        ${own || st.admin ? `<button type="button" data-feed-del="${esc(p.id)}" title="Löschen" class="shrink-0 w-8 h-8 rounded-lg border border-ink-700 text-slate-500 hover:border-red-400/60 hover:text-red-300">✕</button>` : ''}
      </div>
      ${p.body ? `<p class="text-sm text-slate-100 whitespace-pre-wrap break-words">${esc(p.body)}</p>` : ''}
      ${attachHTML(p)}
      ${reactBar(p)}
      ${commentsHTML(p)}
    </article>`;
  };

  // ======================================================================
  // Formulare für die Anhänge (im Beitrag-Fenster)
  // ======================================================================
  const INP = 'bg-ink-950 border border-ink-600 rounded-lg px-2.5 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-gold-500';
  const segBtn = (attr, on, txt) => `<button type="button" ${attr} aria-pressed="${!!on}" class="seg-btn rounded-lg px-3 py-1.5 text-xs font-semibold border border-ink-600 transition">${txt}</button>`;
  const box = (title, body) => `<div class="rounded-xl border border-ink-700 bg-ink-950/60 p-3 flex flex-col gap-2.5"><div class="text-[11px] uppercase tracking-widest text-slate-500">${title}</div>${body}</div>`;
  function craftForm(d) {
    const own = ownGear(), hits = gearSearch(st.gq);
    const gearBtn = (g, i, src) => `<button type="button" data-gpick="${src}:${i}" class="flex items-center gap-2 text-left rounded-lg border border-ink-700 hover:border-gold-500/60 px-2 py-1.5 min-w-0">
        ${icoBox(g.icon, 'w-9 h-9 shrink-0', '⚒️')}
        <span class="min-w-0"><span class="block text-sm truncate ${rarCol[g.rarity] || ''}">${esc(g.name)}</span><span class="block text-[10px] text-slate-500 truncate">${esc(g.slot)}${g.tier ? ` · Iconic ${ROMAN[g.tier - 1]}` : ''}</span></span></button>`;
    const pickArea = `
      <input type="search" data-f="gq" value="${esc(st.gq)}" placeholder="🔍 Teil suchen (z. B. Dragon, Hope …)" class="${INP} w-full">
      <div data-ghits class="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">${hits.map((g, i) => gearBtn(g, i, 's')).join('')}</div>
      ${own.length ? `<div class="text-[10px] text-slate-500">Aus deinen Showcase-Sets:</div><div class="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3 max-h-60 overflow-y-auto">${own.map((g, i) => gearBtn(g, i, 'o')).join('')}</div>` : ''}
      ${!st.gq && !own.length ? `<p class="text-xs text-slate-500">Tipp: Namen eintippen – oder Sets unter 🎨 Showcases anlegen, dann stehen deine Teile hier.</p>` : ''}`;
    const chosen = d.name ? `<div class="flex items-center gap-2">${icoBox(d.icon, 'w-10 h-10', '⚒️')}<div class="min-w-0"><div class="text-sm font-semibold truncate ${rarCol[d.rarity] || ''}">${esc(d.name)}</div><div class="text-[10px] text-slate-500">${esc(d.slot)}</div></div>
        <button type="button" data-f-act="regear" class="ml-auto text-xs px-2.5 py-1 rounded-lg border border-ink-600 hover:border-gold-500/60">ändern</button></div>` : '';
    const leg = d.rarity === 'legendary', ic = d.ic || [0, 1];
    const opts = (from, to, sel) => Array.from({ length: to - from + 1 }, (_, i) => from + i).map((v) => `<option value="${v}" ${v === sel ? 'selected' : ''}>${v ? ROMAN[v - 1] : 'keins'}</option>`).join('');
    const what = `
      <label class="flex items-center gap-2 text-sm"><input type="checkbox" data-f="crafted" ${d.crafted ? 'checked' : ''} class="w-4 h-4 accent-amber-400"> 🆕 Neu gecraftet</label>
      ${leg ? `<div class="flex flex-wrap items-center gap-2 text-sm"><label class="flex items-center gap-2"><input type="checkbox" data-f="icOn" ${d.ic ? 'checked' : ''} class="w-4 h-4 accent-amber-400"> 🏅 Iconic</label>
        <select data-f="icFrom" ${d.ic ? '' : 'disabled'} class="${INP} !py-1">${opts(0, 4, ic[0])}</select><span class="text-slate-500">→</span>
        <select data-f="icTo" ${d.ic ? '' : 'disabled'} class="${INP} !py-1">${opts(1, 5, ic[1])}</select></div>` : '<p class="text-[11px] text-slate-500">Iconic gibt es nur bei legendären Teilen.</p>'}
      <div class="flex flex-wrap items-center gap-2 text-sm"><label class="flex items-center gap-2"><input type="checkbox" data-f="exp" ${d.exp ? 'checked' : ''} class="w-4 h-4 accent-amber-400"> ✦ Expertise freigeschaltet</label>
        <select data-f="refType" class="${INP} !py-1"><option value="">Typ …</option>${Object.entries(REFT).map(([k, v]) => `<option value="${k}" ${d.refType === k ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}</select></div>
      <input type="text" data-f="note" maxlength="120" value="${esc(d.note || '')}" placeholder="Sonst noch? z. B. „endlich 5/5 Set“" class="${INP} w-full">`;
    return box('⚒️ Welches Teil – und was wurde verbessert?', d.name ? chosen + what : pickArea);
  }
  function passForm(d) {
    const plan = passPlan();
    const btns = [4, 5, 6, 7, 8].map((n) => { const p = plan.find((x) => x.n === n); return segBtn(`data-f-pass="${n}"`, d.n === n, `Pass ${n}${p ? `<span class="block text-[10px] font-normal opacity-80">${esc(new Date(p.ts).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }))}</span>` : ''}`); }).join('');
    return box('🚪 Welcher Pass öffnet?', `<div class="flex flex-wrap gap-1.5">${btns}</div>
      <label class="flex flex-wrap items-center gap-2 text-sm text-slate-300">Öffnet am <input type="datetime-local" data-f="passTs" value="${esc(toLocalInput(d.ts))}" class="${INP}"> <span class="text-[11px] text-slate-500">deine Zeit</span></label>
      <p class="text-[11px] text-slate-500">${plan.length ? 'Zeit kommt aus deinem KvK-Kalender – bei Bedarf anpassen.' : 'Kein KvK-Startdatum gesetzt – Zeit bitte eintragen (oder unter KvK → Get Ready das Startdatum festlegen).'}</p>`);
  }
  function stockForm(d) {
    const s = stockSrc(), o = d.opt || {};
    const when = (e) => (e ? 'Scan ' + (R.dateLabel ? R.dateLabel(e.ts) : '') : 'kein Scan');
    const chip = (k, lab, has) => `<label class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border ${o[k] && has ? 'border-gold-400 bg-gold-500/15 text-gold-200' : 'border-ink-600 text-slate-300'} ${has ? 'cursor-pointer' : 'opacity-40'}"><input type="checkbox" data-f="so_${k}" ${o[k] && has ? 'checked' : ''} ${has ? '' : 'disabled'} class="w-3.5 h-3.5 accent-amber-400">${lab}</label>`;
    const row = (title, sub, body) => `<div class="flex flex-col gap-1.5"><div class="flex items-baseline justify-between gap-2"><span class="text-xs text-slate-300">${title}</span><span class="text-[10px] text-slate-500">${sub}</span></div><div class="flex flex-wrap gap-1.5">${body}</div></div>`;
    return box('📦 Was zeigen? (alles einzeln wählbar)', `
      <div class="flex flex-wrap gap-1.5">${STOCK_PRESETS.map(([k, l]) => segBtn(`data-f-preset="${k}"`, false, l)).join('')}</div>
      ${row('🌾 Ressourcen', when(s.res), RES_K.map(([k, i, l]) => chip('r_' + k, `${i} ${l}`, !!s.res)).join('') + (s.res ? chip('bag', '🎒 inkl. Rucksack', true) : ''))}
      ${row('⏱️ Speedups', when(s.spd), chip('uh', '⏱️❤️ Uni + Heilung zusammen', !!s.spd) + SPD_K.map(([k, i, l]) => chip('s_' + k, `${i} ${l}`, !!s.spd)).join(''))}
      ${row('🧪 AP', when(s.ap), chip('ap', '🧪 AP gesamt', !!s.ap))}
      <p class="text-[11px] text-slate-500">Werte aus deinen letzten Scans – sie werden beim Posten festgehalten.</p>`);
  }
  function vipForm(d) {
    const e = vipSrc();
    const body = d.mode === 'new'
      ? `<label class="flex flex-wrap items-center gap-2 text-sm text-slate-300">Neue Stufe: VIP <input type="number" inputmode="numeric" min="1" max="20" data-f="vipLv" value="${+d.lv || ''}" class="${INP} w-20 text-center tabular-nums"> <span class="text-[11px] text-slate-500">20 = SVIP</span></label>`
      : e ? `<p class="text-[11px] text-slate-500">Punkte inkl. Rucksack aus deinem letzten VIP-Scan (${esc(R.dateLabel ? R.dateLabel(e.ts) : '')}).</p>`
        : `<p class="text-sm text-amber-300">Noch kein VIP-Scan – für den Status zuerst im Scanner unter VIP erfassen.</p>`;
    return box('👑 VIP', `<div class="flex flex-wrap gap-1.5">${segBtn('data-f-vip="new"', d.mode === 'new', '🎉 Neue Stufe erreicht')}${segBtn('data-f-vip="status"', d.mode === 'status', '📊 Status')}</div>${body}`);
  }
  function helpForm(a) {
    const list = a.list || [];
    if (list.length < 2) return '';
    return box('🆘 Welche Anfrage?', `<div class="flex flex-col gap-1.5">${list.map((r) => `<button type="button" data-f-help="${esc(r.rid)}" aria-pressed="${a.data.rid === r.rid}" class="seg-btn text-left rounded-lg border border-ink-600 px-3 py-2 text-sm"><span class="font-semibold">${esc(r.title)}</span> <span class="text-[11px] opacity-75">· ${r.sets} Set${r.sets === 1 ? '' : 's'} · ${R.timeAgo(r.at)}</span></button>`).join('')}</div>`);
  }
  function kvkptsForm(d) {
    const segs = d._segs || [], t = Date.now();
    const btns = segs.map((s) => segBtn(`data-f-seg="${s.id}"`, d.seg === s.id, `${s.id[0] === 'a' ? '⛩️' : s.id === 'kvk' ? '🏁' : '🚪'} ${esc(s.label)}${s.ts && s.ts > t ? ' <span class="opacity-60">(bald)</span>' : ''}`)).join('') + segBtn('data-f-seg="own"', d.seg === 'own', '✏️ Eigene Angabe');
    const inp = (k, lab) => `<label class="flex flex-col gap-1 text-[11px] text-slate-400">${lab}<input type="text" inputmode="decimal" data-f="kv_${k}" value="${d[k] ? esc(fmt(d[k])) : ''}" placeholder="0" class="${INP} text-right tabular-nums"></label>`;
    const isAltar = String(d.seg || '')[0] === 'a';
    return box('⚔️ Welcher Abschnitt? (aus deiner KvK-Timeline)', `<div class="flex flex-wrap gap-1.5">${btns}</div>
      ${d.seg === 'own' ? `<input type="text" data-f="kv_label" maxlength="40" value="${esc(d.label || '')}" placeholder="z. B. Ruine, Kampftag 3 …" class="${INP} w-full">` : ''}
      <div class="grid grid-cols-3 gap-2">${inp('kp', '⚔️ Kill-Punkte')}${inp('acclaim', '🏅 Verdienst')}${inp('deads', '💀 Deads (optional)')}</div>
      <p class="text-[11px] text-slate-500">${isAltar ? 'Für Altäre gibt es keine gespeicherten Zwischenstände – bitte Zahlen eintragen.' : 'Pässe und KvK gesamt kommen aus KvK → Stats (Zwischenstände je Pass) – Zahlen kannst du anpassen.'}</p>`);
  }
  const formHTML = (a) => (!a ? '' : a.kind === 'craft' ? craftForm(a.data) : a.kind === 'pass' ? passForm(a.data) : a.kind === 'stock' ? stockForm(a.data)
    : a.kind === 'kvkpts' ? kvkptsForm(a.data) : a.kind === 'vip' ? vipForm(a.data) : a.kind === 'help' ? helpForm(a) : '');

  // ======================================================================
  // Seite: Kopf · Beitrag-Fenster · Filter · Liste
  // ======================================================================
  const composerHTML = () => {
    const a = st.attach;
    const chip = (ic, lab, k) => `<button type="button" data-feed-attach="${k}" ${st.busy ? 'disabled' : ''} class="text-xs px-3 py-1.5 rounded-lg border transition disabled:opacity-50 ${a && a.kind === k ? 'border-gold-400 bg-gold-500/15 text-gold-200' : 'border-ink-600 hover:border-gold-500/60 hover:text-gold-300'}">${ic} ${lab}</button>`;
    const showPrev = a && !(a.kind === 'craft' && !a.data.name);
    return `<div class="panel rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
      <div class="flex items-center gap-3">${R.userLine({ username: R.PROFILE.name, avatar: (A.ownMeta() || {}).avatar, alliance_tag: (A.ownMeta() || {}).alliance_tag }, 'w-10 h-10 text-base')}<span class="ml-auto text-[11px] uppercase tracking-widest text-slate-500">Neuer Beitrag</span></div>
      <textarea id="feedText" rows="2" maxlength="1000" placeholder="Was gibt's Neues? (optional)" class="w-full bg-ink-950 border border-ink-600 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-gold-500 resize-y">${esc(st.text)}</textarea>
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-[11px] text-slate-500 mr-1">Anhängen:</span>
        ${chip('📷', 'Foto', 'photo')}${chip('🎨', 'Showcase', 'showcase')}${chip('🏁', 'KvK-Bilanz', 'kvk')}${chip('🏛️', 'AoO', 'aoo')}
        ${chip('⚒️', 'Craft-Upgrade', 'craft')}${chip('🆘', 'Help Me', 'help')}${chip('🚪', 'Pass-Start', 'pass')}${chip('🗺️', 'KvK-Karte', 'kvkmap')}${chip('⚔️', 'KP & Verdienst', 'kvkpts')}
        ${chip('📦', 'Bestand', 'stock')}${chip('👑', 'VIP', 'vip')}
        ${a ? `<button type="button" data-feed-attach="none" class="text-xs px-2.5 py-1.5 rounded-lg border border-ink-700 text-slate-400 hover:text-red-300 hover:border-red-400/60">✕ Anhang entfernen</button>` : ''}
        <input type="file" id="feedFile" accept="image/*" class="hidden">
      </div>
      ${formHTML(a)}
      ${showPrev ? `<div><div class="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Vorschau</div><div data-feed-prev class="rounded-xl border border-gold-500/30 bg-ink-950/60 p-2">${previewHTML(a)}</div></div>` : ''}
      <div class="flex items-center gap-3">
        <div id="feedMsg" class="text-xs min-h-[1em] flex-1"></div>
        <button type="button" id="feedPost" ${st.busy ? 'disabled' : ''} class="shrink-0 px-5 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-ink-950 font-semibold text-sm disabled:opacity-50">Posten</button>
      </div>
    </div>`;
  };
  const matchFilter = (p, k) => { const f = FILTERS.find((x) => x[0] === k); if (!f || k === 'all') return true; if (k === 'mine') return p.user_id === me(); return f[2].includes(p.kind); };
  const filterHTML = () => {
    const cnt = (k) => st.posts.filter((p) => matchFilter(p, k)).length;
    return `<div class="flex flex-col gap-2">
      <div class="flex items-center gap-2"><span class="text-[11px] uppercase tracking-widest text-slate-500 shrink-0">Filter</span>
        <input type="search" id="feedSearch" value="${esc(st.q)}" placeholder="🔍 Spieler oder Allianz-Tag" class="${INP} ml-auto w-full sm:w-64"></div>
      <div class="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">${FILTERS.map(([k, l]) => { const n = cnt(k); return k !== 'all' && k !== st.filter && !n ? '' :
        `<button type="button" data-feed-filter="${k}" aria-pressed="${st.filter === k}" class="seg-btn shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold border border-ink-600 transition">${l} <span class="opacity-60 tabular-nums">${n}</span></button>`; }).join('')}</div>
    </div>`;
  };
  function visiblePosts() {
    const q = st.q.trim().toLowerCase();
    return st.posts.filter((p) => {
      if (!matchFilter(p, st.filter)) return false;
      if (!q) return true;
      const u = st.users[p.user_id] || {};
      return String(u.username || '').toLowerCase().includes(q) || String(u.alliance_tag || '').toLowerCase().includes(q);
    });
  }
  const syncTxt = () => (st.lastSync ? `● Live · aktualisiert ${new Date(st.lastSync).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}` : '');
  function listHTML() {
    const vis = visiblePosts(), filtered = st.filter !== 'all' || st.q.trim();
    return `
      ${st.noTable ? `<div class="panel rounded-2xl p-5 text-sm text-amber-300">⚠ Die Feed-Tabellen fehlen noch in Supabase. Bitte das SQL aus dem Chat ausführen – danach erscheint hier der Feed.</div>` : ''}
      ${st.err ? `<div class="panel rounded-2xl p-5 text-sm text-red-300">⚠ ${esc(st.err)}</div>` : ''}
      ${st.pending.length ? `<div class="sticky top-2 z-20 flex justify-center"><button type="button" data-feed-pending class="px-4 py-2 rounded-full bg-gold-500 text-ink-950 text-sm font-semibold shadow-lg hover:bg-gold-400">⬆ ${st.pending.length} neue${st.pending.length === 1 ? 'r Beitrag' : ' Beiträge'}</button></div>` : ''}
      ${!st.loaded || st.loading ? `<p class="text-sm text-slate-500 text-center py-6">⏳ Feed wird geladen …</p>` : ''}
      ${filtered && st.loaded && !st.loading ? `<p class="text-[11px] text-slate-500">${vis.length} von ${st.posts.length} geladenen Beiträgen</p>` : ''}
      <div class="grid gap-4 lg:grid-cols-2 items-start">${vis.map(postHTML).join('')}</div>
      ${st.loaded && !st.loading && !st.posts.length && !st.noTable ? `<p class="text-sm text-slate-500 text-center py-6">Noch keine Beiträge – mach den Anfang! 🎉</p>` : ''}
      ${st.loaded && !st.loading && st.posts.length && !vis.length ? `<p class="text-sm text-slate-500 text-center py-6">Keine passenden Beiträge${st.hasMore ? ' – ältere laden?' : ''}</p>` : ''}
      ${st.hasMore && !st.loading ? `<div class="flex justify-center"><button type="button" data-feed-more ${st.moreBusy ? 'disabled' : ''} class="text-xs px-4 py-2 rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300 disabled:opacity-50">${st.moreBusy ? '⏳ Lade …' : '⬇ Ältere Beiträge laden'}</button></div>` : ''}`;
  }

  let lastMsg = ['', ''];
  function msg(t, tone) { lastMsg = [t, tone]; const el = $('feedMsg'); if (!el) return; el.textContent = t; el.className = 'text-xs min-h-[1em] flex-1 ' + ({ ok: 'text-emerald-400', warn: 'text-amber-300', err: 'text-red-300', busy: 'text-slate-300' }[tone] || 'text-slate-500'); }
  function renderComposer() { const el = $('feedComposer'); if (!el) return; el.innerHTML = composerHTML(); msg(lastMsg[0], lastMsg[1]); }
  function renderPreview() { const el = root.querySelector('[data-feed-prev]'); if (el && st.attach) el.innerHTML = previewHTML(st.attach); else renderComposer(); }
  function renderList() {
    st.deferRender = false;
    const el = $('feedList'); if (el) el.innerHTML = listHTML();
    const fl = $('feedFilter'); if (fl && !(document.activeElement && document.activeElement.id === 'feedSearch')) fl.innerHTML = filterHTML();
    renderSync();
  }
  function renderSync() { const el = $('feedSync'); if (el) el.textContent = syncTxt(); }
  function render() {
    root.innerHTML = `
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div><h2 class="font-display text-2xl gold-text">📰 Feed</h2><p class="text-xs text-slate-500">Showcases, KvK, Craft-Upgrades und Bestände aller Spieler</p></div>
        <div class="flex items-center gap-3"><span id="feedSync" class="text-[11px] text-emerald-400/80"></span>
          <button type="button" id="feedReload" class="text-xs px-3 py-1.5 rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300">↻ Aktualisieren</button></div>
      </div>
      <div id="feedComposer"></div>
      <div id="feedFilter">${filterHTML()}</div>
      <div id="feedList" class="space-y-4"></div>`;
    renderComposer(); renderList();
  }

  // ======================================================================
  // Ereignisse
  // ======================================================================
  root.addEventListener('click', (ev) => {
    const t = ev.target;
    if (t.closest('#feedPost')) { post(); return; }
    if (t.closest('#feedReload')) { load(); return; }
    if (t.closest('[data-feed-pending]')) { showPending(); return; }
    if (t.closest('[data-feed-more]')) { more(); return; }
    const fl = t.closest('[data-feed-filter]');
    if (fl) { st.filter = fl.dataset.feedFilter; $('feedFilter').innerHTML = filterHTML(); renderList(); return; }
    const at = t.closest('[data-feed-attach]');
    if (at) {
      const k = at.dataset.feedAttach;
      if (k !== 'photo' && st.attach && st.attach.kind === k) { st.attach = null; renderComposer(); return; }   // nochmal = abwählen
      msg('', '');
      ({ none: () => { st.attach = null; renderComposer(); }, photo: () => $('feedFile') && $('feedFile').click(), showcase: attachShowcase, kvk: attachKvk, aoo: attachAoo,
        craft: attachCraft, pass: attachPass, stock: attachStock, kvkpts: attachKvkPts, vip: attachVip, kvkmap: attachMap, help: attachHelp }[k] || (() => {}))();
      return;
    }
    const gp = t.closest('[data-gpick]');
    if (gp && st.attach && st.attach.kind === 'craft') { const [src, i] = gp.dataset.gpick.split(':'); const g = (src === 'o' ? ownGear() : gearSearch(st.gq))[+i]; if (g) pickGear(g); return; }
    const fa = t.closest('[data-f-act]');
    if (fa && fa.dataset.fAct === 'regear' && st.attach) { Object.assign(st.attach.data, { item: '', name: '', icon: '', ic: null }); renderComposer(); return; }
    const fp = t.closest('[data-f-pass]');
    if (fp && st.attach && st.attach.kind === 'pass') { const n = +fp.dataset.fPass, p = passPlan().find((x) => x.n === n); st.attach.data = { n, ts: p ? p.ts : st.attach.data.ts }; renderComposer(); return; }
    const fs = t.closest('[data-f-seg]');
    if (fs && st.attach && st.attach.kind === 'kvkpts') {
      const d = st.attach.data, s = (d._segs || []).find((x) => x.id === fs.dataset.fSeg);
      Object.assign(d, s ? { seg: s.id, label: s.label, kp: s.kp, acclaim: s.acclaim, deads: s.deads } : { seg: 'own', label: '' });
      renderComposer(); return;
    }
    const pre = t.closest('[data-f-preset]');
    if (pre && st.attach && st.attach.kind === 'stock') { st.attach.data = stockBuild(stockPreset(pre.dataset.fPreset)); renderComposer(); return; }
    const fv = t.closest('[data-f-vip]');
    if (fv && st.attach && st.attach.kind === 'vip') { st.attach.data = vipBuild(fv.dataset.fVip, st.attach.data && st.attach.data.lv) || { mode: 'status' }; renderComposer(); return; }
    const fh = t.closest('[data-f-help]');
    if (fh && st.attach && st.attach.kind === 'help') { const r = (st.attach.list || []).find((x) => x.rid === fh.dataset.fHelp); if (r) st.attach.data = { rid: r.rid, title: r.title, sets: r.sets, items: r.items, icons: r.icons }; renderComposer(); return; }
    const mp = t.closest('[data-feed-map]');
    if (mp) { const id = mp.dataset.feedMap; openMap(id === '__prev' ? (st.attach || {}).data : (st.posts.find((p) => p.id === id) || {}).data); return; }
    const hp = t.closest('[data-feed-help]'); if (hp) { goHelp(hp.dataset.feedHelp); return; }
    const ct = t.closest('[data-cm-toggle]');
    if (ct) { const id = ct.dataset.cmToggle; if (st.cmOpen.has(id)) st.cmOpen.delete(id); else st.cmOpen.add(id); renderList(); if (st.cmOpen.has(id)) { const i = root.querySelector(`[data-cm-in="${CSS.escape(id)}"]`); if (i) i.focus(); } return; }
    const cs = t.closest('[data-cm-send]'); if (cs) { sendComment(cs.dataset.cmSend); return; }
    const cd = t.closest('[data-cm-del]'); if (cd) { const [pid, cid] = cd.dataset.cmDel.split('|'); delComment(pid, cid); return; }
    const rb = t.closest('[data-react]'); if (rb) { const [id, e] = rb.dataset.react.split('|'); react(id, e); return; }
    const dl = t.closest('[data-feed-del]'); if (dl) { del(dl.dataset.feedDel); return; }
    const pr = t.closest('[data-feed-prof]'); if (pr) { R.openProfile(pr.dataset.feedProf); return; }
  });
  // Tippen / Auswählen in den Formularen – nur Vorschau neu zeichnen, damit der Fokus bleibt
  root.addEventListener('input', (ev) => {
    const t = ev.target;
    if (t.id === 'feedText') { st.text = t.value; return; }
    if (t.id === 'feedSearch') { st.q = t.value; renderList(); return; }
    if (t.dataset && t.dataset.cmIn) { st.cmDraft[t.dataset.cmIn] = t.value; return; }
    const f = t.dataset && t.dataset.f, a = st.attach; if (!f || !a) return;
    const d = a.data;
    if (f === 'gq') { st.gq = t.value; const h = root.querySelector('[data-ghits]'); if (!st.gq || !h) { renderComposer(); const s = root.querySelector('[data-f="gq"]'); if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); } } else h.innerHTML = gearSearch(st.gq).map((g, i) => `<button type="button" data-gpick="s:${i}" class="flex items-center gap-2 text-left rounded-lg border border-ink-700 hover:border-gold-500/60 px-2 py-1.5 min-w-0">${icoBox(g.icon, 'w-9 h-9 shrink-0', '⚒️')}<span class="min-w-0"><span class="block text-sm truncate ${rarCol[g.rarity] || ''}">${esc(g.name)}</span><span class="block text-[10px] text-slate-500 truncate">${esc(g.slot)}</span></span></button>`).join('') || '<p class="text-xs text-slate-500">Nichts gefunden.</p>'; return; }
    if (f === 'note') { d.note = t.value.slice(0, 120); renderPreview(); return; }
    if (f === 'vipLv') { const v = Math.round(+t.value); if (v >= 1 && v <= 20) { d.lv = v; renderPreview(); } return; }
    if (f === 'kv_label') { d.label = t.value.slice(0, 40); renderPreview(); return; }
    if (f.startsWith('kv_')) { d[f.slice(3)] = num(t.value); renderPreview(); return; }
  });
  root.addEventListener('change', (ev) => {
    const t = ev.target;
    if (t.id === 'feedFile') { const file = t.files && t.files[0]; t.value = ''; pickPhoto(file); return; }
    const f = t.dataset && t.dataset.f, a = st.attach; if (!f || !a) return;
    const d = a.data;
    if (f === 'crafted' || f === 'exp') { d[f] = t.checked; renderPreview(); return; }
    if (f === 'icOn') { d.ic = t.checked ? [0, 1] : null; renderComposer(); return; }
    if (f === 'icFrom' || f === 'icTo') {
      let [a0, b0] = d.ic || [0, 1];
      if (f === 'icFrom') { a0 = +t.value; if (b0 <= a0) b0 = a0 + 1; } else { b0 = +t.value; if (a0 >= b0) a0 = b0 - 1; }
      d.ic = [a0, b0]; renderComposer(); return;
    }
    if (f === 'refType') { d.refType = t.value; if (t.value) d.exp = true; renderComposer(); return; }
    if (f === 'passTs') { d.ts = fromLocalInput(t.value); renderPreview(); return; }
    if (f.startsWith('so_')) { const o = { ...(d.opt || {}), [f.slice(3)]: t.checked }; a.data = stockBuild(o); renderComposer(); return; }
    if (f.startsWith('kv_')) { const el = root.querySelector(`[data-f="${f}"]`); if (el && f !== 'kv_label' && d[f.slice(3)]) el.value = fmt(d[f.slice(3)]); }
  });

  root.addEventListener('keydown', (ev) => { const t = ev.target; if (ev.key === 'Enter' && !ev.shiftKey && t.dataset && t.dataset.cmIn) { ev.preventDefault(); sendComment(t.dataset.cmIn); } });
  // aufgeschobenes Neuzeichnen nachholen, sobald niemand mehr in der Liste tippt
  root.addEventListener('focusout', () => { setTimeout(() => { if (st.deferRender && !typing()) renderList(); }, 300); });
  // Auto-Aktualisieren: alle 20 s, solange der Feed offen und der Tab sichtbar ist · Countdown der Pässe läuft mit
  const feedOpen = () => R.view === 'feed' && !document.hidden;
  setInterval(() => { if (feedOpen()) poll(); }, POLL_MS);
  setInterval(() => { root.querySelectorAll('[data-cd]').forEach((el) => { el.textContent = cdText(+el.dataset.cd); }); }, 15000);
  document.addEventListener('visibilitychange', () => { if (feedOpen() && Date.now() - st.lastSync > 5000) poll(); });

  // Seite öffnen → laden (einmal, danach automatisch und über ↻)
  R.viewHooks.feed = () => { if (!st.loaded && !st.loading) load(); else { renderList(); if (Date.now() - st.lastSync > 5000) poll(); } };
  R.feedReload = load;
  render();
};
