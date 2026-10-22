// Wiz fan Club – News (Reiter neben dem Feed)
// Nur Admins posten Neuigkeiten (Titel, Text, optional Bild, anheften). Alle eingeloggten Spieler lesen.
// Neue News seit dem letzten Besuch erscheinen als rote Zahl am Reiter.
// Läuft innerhalb von RokApp (scanner.js); R = geteilter Kontext (window.Rok).
// Pop-up: News mit popup = true erscheinen jedem Spieler einmal groß über der Seite (gemerkt pro Spieler im Browser).
// Supabase: public.news_posts (id, user_id, title, body, image, pinned, popup, created_at, edited_at)
//           Lesen: alle eingeloggten · Schreiben/Ändern/Löschen: nur feature_access 'admin' (SQL im Chat)
window.RokMods = window.RokMods || {};
window.RokMods.news = (R) => {
  const $ = R.$, esc = R.esc, A = window.RokAuth, root = $('newsView');
  if (!root) return;
  const db = () => A.db(), me = () => A.userId();
  const SEEN_KEY = 'rok_news_seen_' + (me() || ''), LIMIT = 50;
  const INP = 'w-full bg-ink-950 border border-ink-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-gold-500';
  const st = { loaded: false, loading: false, err: '', noTable: false, posts: [], users: {}, admin: false, open: false, busy: false,
    form: { id: null, title: '', body: '', pinned: false, popup: false, dataUrl: '', image: '' }, msg: ['', ''] };

  // Englische Texte (hängen sich an window.I18N an)
  (function newsI18n() {
    const I = window.I18N; if (!I || !I.translations || !I.translations.en) return;
    Object.assign(I.translations.en.texts, {
      '📢 News': '📢 News', 'News': 'News', 'Neuigkeiten rund um den Wiz fan Club': 'News about the Wiz fan Club', '➕ News schreiben': '➕ Write news', 'News bearbeiten': 'Edit news',
      'Neue News': 'New news', 'Titel': 'Title', 'Text': 'Text', 'Oben anheften': 'Pin to top', 'Veröffentlichen': 'Publish', 'Änderungen speichern': 'Save changes', 'Abbrechen': 'Cancel',
      '🖼️ Bild hinzufügen': '🖼️ Add image', '🖼️ Anderes Bild': '🖼️ Other image', '✕ Bild entfernen': '✕ Remove image', 'Angeheftet': 'Pinned', 'bearbeitet': 'edited',
      'Noch keine News.': 'No news yet.', 'News werden geladen …': 'Loading news …', 'Diese News löschen?': 'Delete this news post?', 'Bitte einen Titel eingeben.': 'Please enter a title.',
      '✓ Veröffentlicht': '✓ Published', '✓ Gespeichert': '✓ Saved', 'Wird gespeichert …': 'Saving …', 'Bearbeiten': 'Edit', 'Löschen': 'Delete', 'Nicht mehr anheften': 'Unpin',
      'Nur Admins können News posten.': 'Only admins can post news.', '📣 Als Pop-up allen zeigen': '📣 Show as pop-up to everyone', '📣 Pop-up': '📣 Pop-up', 'Pop-up ansehen': 'View pop-up',
      '📣 Neu im Wiz fan Club': '📣 New in Wiz fan Club', 'Vorschau': 'Preview', '📢 Alle News': '📢 All news', 'OK, verstanden': 'OK, got it',
      '📣 Jeder Spieler sieht diese News einmal groß beim nächsten Öffnen der Seite. Tipp: Zeilen mit „- “ am Anfang werden zu Aufzählungspunkten.': '📣 Every player sees this news once, large, the next time they open the site. Tip: lines starting with “- ” become bullet points.',
      'Für Pop-ups fehlt noch die Spalte „popup“ in Supabase – bitte das SQL aus dem Chat ausführen.': 'The “popup” column is missing in Supabase – please run the SQL from the chat.', 'Neue News': 'New news', 'Lesen →': 'Read →', '🔍 Vergrößern': '🔍 Enlarge', 'Vergrößern': 'Enlarge', '↻ Aktualisieren': '↻ Refresh',
      '⚠ Die News-Tabelle fehlt noch in Supabase. Bitte das SQL aus dem Chat ausführen.': '⚠ The news table is missing in Supabase. Please run the SQL from the chat.',
      '📢 Neue News': '📢 New news', '📰 Feed': '📰 Feed'
    });
    if (I.translations.en.patterns) I.translations.en.patterns.unshift([/^📢 (\d+) neue News$/, '📢 $1 new news']);
  })();

  const seen = () => { try { return +localStorage.getItem(SEEN_KEY) || 0; } catch { return 0; } };
  const setUnread = (n, latest) => { R.newsUnread = n; R.newsLatest = latest || ''; if (R.renderNewsHint) R.renderNewsHint(); else R.setBadge('[data-news-badge]', n); };
  const markSeen = () => { const top = Math.max(0, ...st.posts.map((p) => Date.parse(p.created_at) || 0)); try { localStorage.setItem(SEEN_KEY, String(Math.max(top, Date.now()))); } catch {} setUnread(0); };
  const unread = (list) => { const s = seen(); return list.filter((p) => (Date.parse(p.created_at) || 0) > s && p.user_id !== me()).length; };
  const sorted = () => [...st.posts].sort((a, b) => ((b.pinned === true) - (a.pinned === true)) || (Date.parse(b.created_at) - Date.parse(a.created_at)));
  const fail = (e) => (/popup/i.test(String(e?.message || '')) ? 'Für Pop-ups fehlt noch die Spalte „popup“ in Supabase – bitte das SQL aus dem Chat ausführen.' : R.tableMissing(e) ? 'Die News-Tabelle fehlt noch in Supabase – bitte das SQL aus dem Chat ausführen.' : (A.germanError ? A.germanError(e) : String(e.message || e)));

  // Text: Zeilenumbrüche behalten, Links anklickbar
  const richText = (t) => esc(t).replace(/^[-*•] /gm, '• ').replace(/https?:\/\/[^\s<]+/g, (u) => `<a href="${u}" target="_blank" rel="noopener" class="text-gold-300 underline break-all">${u}</a>`);
  const fmtDate = (ts) => new Date(ts).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // ---------- Laden ----------
  async function load() {
    if (st.loading) return; st.loading = true; st.err = ''; render();
    try {
      const { data, error } = await db().from('news_posts').select('*').order('created_at', { ascending: false }).limit(LIMIT);
      if (error) throw error;
      st.posts = data || []; st.noTable = false;
      st.users = await R.users([...new Set(st.posts.map((p) => p.user_id))]);
    } catch (e) { if (R.tableMissing(e)) st.noTable = true; else st.err = fail(e); }
    st.loading = false; st.loaded = true;
    if (R.view === 'news') markSeen();
    render();
  }
  async function pollBadge() {
    if (R.view === 'news') return;
    try {
      const { data, error } = await db().from('news_posts').select('created_at,user_id,title').order('created_at', { ascending: false }).limit(20);
      if (error) return;
      const s = seen(), fresh = (data || []).filter((p) => (Date.parse(p.created_at) || 0) > s && p.user_id !== me());
      setUnread(fresh.length, fresh[0] ? fresh[0].title : '');
    } catch {}
  }
  setTimeout(pollBadge, 2000); setInterval(() => { if (!document.hidden) pollBadge(); }, 2 * 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pollBadge(); });

  // ---------- Schreiben (nur Admins) ----------
  function openForm(p) {
    st.form = p ? { id: p.id, title: p.title || '', body: p.body || '', pinned: p.pinned === true, popup: p.popup === true, dataUrl: '', image: p.image || '' } : { id: null, title: '', body: '', pinned: false, popup: false, dataUrl: '', image: '' };
    st.open = true; st.msg = ['', '']; render();
    setTimeout(() => { const t = root.querySelector('[data-n="title"]'); if (t) { t.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }, 30);
  }
  async function pickImage(file) {
    if (!file) return;
    if (!/^image\//.test(file.type)) { setMsg('Das ist kein Bild.', 'warn'); return; }
    try { st.form.dataUrl = (await R.prepareImage(file)).dataUrl; renderForm(); }
    catch (e) { setMsg('Bild nicht angehängt: ' + (e.message || e), 'warn'); }
  }
  async function save() {
    if (!st.admin) { setMsg('Nur Admins können News posten.', 'warn'); return; }
    const f = st.form, title = f.title.trim().slice(0, 120), body = f.body.trim().slice(0, 4000);
    if (!title) { setMsg('Bitte einen Titel eingeben.', 'warn'); return; }
    if (st.busy) return; st.busy = true; setMsg('Wird gespeichert …', 'busy'); renderForm();
    try {
      let id = f.id;
      const image = f.dataUrl ? null : (f.image || null);
      if (id) {
        const { data, error } = await db().from('news_posts').update({ title, body, pinned: f.pinned, popup: f.popup, image, edited_at: new Date().toISOString() }).eq('id', id).select('id');
        if (error) throw error;
        if (!(data || []).length) throw new Error('Supabase hat die Änderung abgelehnt (Admin-Regel fehlt?).');
      } else {
        const { data, error } = await db().from('news_posts').insert({ user_id: me(), title, body, pinned: f.pinned, popup: f.popup, image: null }).select().single();
        if (error) throw error;
        id = data.id;
      }
      if (f.dataUrl) {   // Bild nach dem Speichern hochladen (Dateiname = News-ID)
        const url = await A.uploadImage(await (await fetch(f.dataUrl)).blob(), 'news_' + id);
        const { error } = await db().from('news_posts').update({ image: url }).eq('id', id);
        if (error) throw error;
      }
      st.open = false; st.busy = false;
      await load();
      st.msg = [f.id ? '✓ Gespeichert' : '✓ Veröffentlicht', 'ok']; render();
      return;
    } catch (e) { setMsg(fail(e), 'err'); }
    st.busy = false; renderForm();
  }
  async function del(id) {
    if (!(await window.UI.confirm('Diese News löschen?'))) return;
    const { error } = await db().from('news_posts').delete().eq('id', id);
    if (error) { window.UI.alert(fail(error)); return; }
    st.posts = st.posts.filter((p) => p.id !== id); render();
  }
  async function togglePin(id) {
    const p = st.posts.find((x) => x.id === id); if (!p) return;
    const next = p.pinned !== true;
    const { data, error } = await db().from('news_posts').update({ pinned: next }).eq('id', id).select('id');
    if (error || !(data || []).length) { window.UI.alert(error ? fail(error) : 'Supabase hat die Änderung abgelehnt (Admin-Regel fehlt?).'); return; }
    p.pinned = next; render();
  }

  // ---------- Anzeige ----------
  function setMsg(t, tone) { st.msg = [t, tone]; const el = root.querySelector('[data-n-msg]'); if (el) { el.textContent = t; el.className = msgCls(tone); } }
  const msgCls = (tone) => 'text-xs min-h-[1em] flex-1 ' + ({ ok: 'text-emerald-400', warn: 'text-amber-300', err: 'text-red-300', busy: 'text-slate-300' }[tone] || 'text-slate-500');
  const formHTML = () => {
    const f = st.form, img = f.dataUrl || f.image;
    return `<div class="panel rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
      <div class="text-[11px] uppercase tracking-widest text-slate-500">${f.id ? 'News bearbeiten' : 'Neue News'}</div>
      <label class="text-xs text-slate-400 flex flex-col gap-1">Titel<input data-n="title" value="${esc(f.title)}" maxlength="120" class="${INP}"></label>
      <label class="text-xs text-slate-400 flex flex-col gap-1">Text<textarea data-n="body" rows="6" maxlength="4000" class="${INP} resize-y">${esc(f.body)}</textarea></label>
      <div class="flex flex-wrap items-center gap-2">
        <button type="button" data-n-img class="text-xs px-3 py-1.5 rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300">${img ? '🖼️ Anderes Bild' : '🖼️ Bild hinzufügen'}</button>
        ${img ? '<button type="button" data-n-imgx class="text-xs px-2.5 py-1.5 rounded-lg border border-ink-700 text-slate-400 hover:text-red-300 hover:border-red-400/60">✕ Bild entfernen</button>' : ''}
        <span class="ml-auto flex flex-wrap gap-x-4 gap-y-1">
          <label class="inline-flex items-center gap-2 text-sm text-slate-300 cursor-pointer"><input type="checkbox" data-n="popup" ${f.popup ? 'checked' : ''} class="accent-amber-400 w-4 h-4"> 📣 Als Pop-up allen zeigen</label>
          <label class="inline-flex items-center gap-2 text-sm text-slate-300 cursor-pointer"><input type="checkbox" data-n="pinned" ${f.pinned ? 'checked' : ''} class="accent-amber-400 w-4 h-4"> 📌 Oben anheften</label></span>
        <input type="file" id="newsFile" accept="image/*" class="hidden">
      </div>
      ${f.popup ? '<p class="text-[11px] text-slate-500">📣 Jeder Spieler sieht diese News einmal groß beim nächsten Öffnen der Seite. Tipp: Zeilen mit „- “ am Anfang werden zu Aufzählungspunkten.</p>' : ''}
      ${img ? `<img src="${esc(img)}" alt="" class="w-full h-48 object-cover object-top rounded-lg border border-ink-700 bg-ink-950">` : ''}
      <div class="flex flex-wrap items-center gap-3">
        <div data-n-msg class="${msgCls(st.msg[1])}">${esc(st.msg[0])}</div>
        <button type="button" data-n-cancel class="px-4 py-2 rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300 text-sm">Abbrechen</button>
        <button type="button" data-n-save ${st.busy ? 'disabled' : ''} class="px-5 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-ink-950 font-semibold text-sm disabled:opacity-50">${f.id ? 'Änderungen speichern' : 'Veröffentlichen'}</button>
      </div>
    </div>`;
  };
  const postHTML = (p) => {
    const u = st.users[p.user_id] || { username: '?' }, pin = p.pinned === true;
    return `<article class="panel rounded-2xl p-5 sm:p-6 flex flex-col gap-3 ${pin ? 'ring-1 ring-gold-400/50' : ''}">
      ${pin ? '<div class="-mt-1 -mx-1 flex items-center gap-2 rounded-lg bg-gold-500/10 border border-gold-400/30 px-3 py-1.5 text-[11px] text-gold-200"><span>📌</span><span>Angeheftet</span></div>' : ''}
      <div class="flex items-start gap-3">
        <div class="min-w-0 flex-1">
          <h3 class="font-display text-xl sm:text-2xl gold-text leading-tight break-words">${esc(p.title)}</h3>
          <div class="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500"><span translate="no">${esc(u.username || '?')}</span><span>·</span><span>${fmtDate(p.created_at)}</span>${p.edited_at ? '<span>· bearbeitet</span>' : ''}${st.admin && p.popup === true ? '<span class="rounded-full border border-gold-400/40 px-2 py-0.5 text-gold-200">📣 Pop-up</span>' : ''}</div>
        </div>
        ${st.admin ? `<div class="shrink-0 flex gap-1.5">
          <button type="button" data-n-pin="${esc(p.id)}" title="${pin ? 'Nicht mehr anheften' : 'Oben anheften'}" class="w-8 h-8 rounded-lg border ${pin ? 'border-gold-400 bg-gold-500/15 text-gold-200' : 'border-ink-700 text-slate-500 hover:border-gold-500/60 hover:text-gold-300'}">📌</button>
          ${p.popup === true ? `<button type="button" data-n-preview="${esc(p.id)}" title="Pop-up ansehen" class="w-8 h-8 rounded-lg border border-ink-700 text-slate-500 hover:border-gold-500/60 hover:text-gold-300">👁</button>` : ''}
          <button type="button" data-n-edit="${esc(p.id)}" title="Bearbeiten" class="w-8 h-8 rounded-lg border border-ink-700 text-slate-500 hover:border-gold-500/60 hover:text-gold-300">✎</button>
          <button type="button" data-n-del="${esc(p.id)}" title="Löschen" class="w-8 h-8 rounded-lg border border-ink-700 text-slate-500 hover:border-red-400/60 hover:text-red-300">✕</button></div>` : ''}
      </div>
      ${p.image ? (R.zoomImgHTML ? R.zoomImgHTML(p.image, 'w-full h-56 sm:h-64 object-cover object-top') : `<img src="${esc(p.image)}" alt="" loading="lazy" class="w-full h-56 object-cover object-top rounded-xl">`) : ''}
      ${p.body ? `<p class="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap break-words">${richText(p.body)}</p>` : ''}
    </article>`;
  };
  const listHTML = () => {
    if (st.noTable) return '<div class="panel rounded-2xl p-5 text-sm text-amber-300">⚠ Die News-Tabelle fehlt noch in Supabase. Bitte das SQL aus dem Chat ausführen.</div>';
    if (st.err) return `<div class="panel rounded-2xl p-5 text-sm text-red-300">⚠ ${esc(st.err)}</div>`;
    if (!st.loaded || st.loading) return '<p class="text-sm text-slate-500 text-center py-6">⏳ News werden geladen …</p>';
    if (!st.posts.length) return '<p class="text-sm text-slate-500 text-center py-6">Noch keine News.</p>';
    return `<div class="flex flex-col gap-4 max-w-3xl">${sorted().map(postHTML).join('')}</div>`;
  };
  function renderForm() { const el = root.querySelector('[data-n-form]'); if (el) el.innerHTML = st.open ? formHTML() : ''; }
  function render() {
    root.innerHTML = `
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>${R.feedNewsSwitch ? R.feedNewsSwitch('news') : '<h2 class="font-display text-2xl gold-text">📢 News</h2>'}<p class="mt-1.5 text-xs text-slate-500">Neuigkeiten rund um den Wiz fan Club</p></div>
        <div class="flex gap-2">
          <button type="button" data-n-reload class="text-xs px-3 py-2 rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300">↻ Aktualisieren</button>
          ${st.admin && !st.open ? '<button type="button" data-n-new class="text-sm px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-ink-950 font-semibold">➕ News schreiben</button>' : ''}
        </div>
      </div>
      <div data-n-form>${st.open && st.admin ? formHTML() : ''}</div>
      ${!st.open && st.msg[0] ? `<div class="${msgCls(st.msg[1])}">${esc(st.msg[0])}</div>` : ''}
      <div data-n-list>${listHTML()}</div>`;
  }

  // ---------- Ereignisse ----------
  root.addEventListener('click', (ev) => {
    const t = ev.target;
    if (t.closest('[data-n-reload]')) { st.msg = ['', '']; load(); return; }
    if (t.closest('[data-n-new]')) { openForm(null); return; }
    if (t.closest('[data-n-cancel]')) { st.open = false; st.msg = ['', '']; render(); return; }
    if (t.closest('[data-n-save]')) { save(); return; }
    if (t.closest('[data-n-img]')) { const f = $('newsFile'); if (f) f.click(); return; }
    if (t.closest('[data-n-imgx]')) { st.form.dataUrl = ''; st.form.image = ''; renderForm(); return; }
    const ed = t.closest('[data-n-edit]'); if (ed) { const p = st.posts.find((x) => x.id === ed.dataset.nEdit); if (p) openForm(p); return; }
    const dl = t.closest('[data-n-del]'); if (dl) { del(dl.dataset.nDel); return; }
    const pn = t.closest('[data-n-pin]'); if (pn) { togglePin(pn.dataset.nPin); return; }
    const pv = t.closest('[data-n-preview]'); if (pv) { const p = st.posts.find((x) => x.id === pv.dataset.nPreview); if (p) showPopup(p, true); return; }
  });
  root.addEventListener('input', (ev) => {
    const k = ev.target.dataset && ev.target.dataset.n;
    if (k === 'title') st.form.title = ev.target.value;
    else if (k === 'body') st.form.body = ev.target.value;
  });
  root.addEventListener('change', (ev) => {
    const t = ev.target;
    if (t.id === 'newsFile') { const file = t.files && t.files[0]; t.value = ''; pickImage(file); return; }
    if (t.dataset && t.dataset.n === 'pinned') st.form.pinned = t.checked;
    if (t.dataset && t.dataset.n === 'popup') { st.form.popup = t.checked; renderForm(); }
  });

  // ---------- Pop-up: neue Updates einmal groß anzeigen ----------
  const POP_KEY = 'rok_news_popup_' + (me() || '');
  const popSeen = () => { try { return JSON.parse(localStorage.getItem(POP_KEY) || '[]') || []; } catch { return []; } };
  const popMark = (id) => { try { localStorage.setItem(POP_KEY, JSON.stringify([...new Set([...popSeen(), id])].slice(-50))); } catch {} };
  let popOpen = false;
  function showPopup(p, preview) {
    if (popOpen) return; popOpen = true;
    const box = document.createElement('div'), prev = document.body.style.overflow;
    box.className = 'fixed inset-0 z-[92] grid place-items-center p-4 bg-ink-950/85 backdrop-blur-sm ui-fade overflow-y-auto';
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'newsPopTitle');
    box.innerHTML = `<div class="panel !bg-ink-900 w-full max-w-lg rounded-2xl shadow-2xl ui-pop my-auto overflow-hidden">
        <div class="px-6 pt-5 pb-3 bg-gradient-to-b from-gold-500/15 to-transparent border-b border-gold-500/20">
          <div class="flex items-center gap-2 text-[11px] uppercase tracking-widest text-gold-300"><span>📣 Neu im Wiz fan Club</span>${preview ? '<span class="ml-auto normal-case tracking-normal text-slate-400">Vorschau</span>' : ''}</div>
          <h3 id="newsPopTitle" class="mt-1 font-display text-2xl gold-text leading-tight break-words">${esc(p.title)}</h3>
          <div class="mt-0.5 text-[11px] text-slate-500">${fmtDate(p.created_at)}</div>
        </div>
        <div class="px-6 py-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
          ${p.image ? (R.zoomImgHTML ? R.zoomImgHTML(p.image, 'w-full max-h-64 object-contain') : `<img src="${esc(p.image)}" alt="" class="w-full max-h-64 object-contain rounded-xl">`) : ''}
          ${p.body ? `<p class="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap break-words">${richText(p.body)}</p>` : ''}
        </div>
        <div class="px-6 pb-5 pt-1 flex flex-wrap justify-end gap-2">
          <button type="button" data-pop-news class="px-4 py-2.5 rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300 text-sm">📢 Alle News</button>
          <button type="button" data-pop-ok class="px-5 py-2.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-ink-950 font-semibold text-sm">OK, verstanden</button>
        </div></div>`;
    const close = (goNews) => {
      document.removeEventListener('keydown', onKey, true);
      box.remove(); document.body.style.overflow = prev; popOpen = false;
      if (!preview) popMark(p.id);
      if (goNews) R.goView('news'); else if (!preview) setTimeout(checkPopup, 400);   // weitere ungelesene Pop-ups nacheinander
    };
    const onKey = (e) => { if (e.key === 'Escape' && !document.querySelector('[aria-label="Bild"]')) { e.preventDefault(); e.stopPropagation(); close(false); } };
    box.addEventListener('click', (e) => {
      if (e.target.closest('[data-pop-ok]') || e.target === box) return close(false);
      if (e.target.closest('[data-pop-news]')) return close(true);
    });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(box); document.body.style.overflow = 'hidden';
    setTimeout(() => box.querySelector('[data-pop-ok]')?.focus(), 30);
  }
  async function checkPopup() {
    if (popOpen || document.hidden) return;
    try {
      const since = new Date(Date.now() - 30 * 864e5).toISOString();   // nur Pop-ups der letzten 30 Tage
      const { data, error } = await db().from('news_posts').select('*').eq('popup', true).gte('created_at', since).order('created_at', { ascending: true }).limit(10);
      if (error) return;
      const seenIds = new Set(popSeen()), next = (data || []).find((p) => !seenIds.has(p.id) && p.user_id !== me());
      if (next) showPopup(next, false);
    } catch {}
  }
  setTimeout(checkPopup, 1500);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(checkPopup, 800); });

  // ---------- Start ----------
  R.VIEW_EL.news = 'newsView';
  if (!R.MAIN_VIEWS.includes('news')) R.MAIN_VIEWS.push('news');
  R.viewHooks.news = () => { if (!st.loaded && !st.loading) load(); else { markSeen(); render(); } };
  document.addEventListener('rok:view', (e) => { if (e.detail === 'news') document.querySelectorAll('.main-tab[data-view="feed"]').forEach((b) => b.setAttribute('aria-pressed', 'true')); });
  A.isAdmin().then((ok) => { st.admin = !!ok; render(); }).catch(() => {});
  render();
};
