// Wiz fan Club – Feed (Startseite)
// Beiträge aller Spieler: Text, Showcase-Bild, KvK-Bilanz, Craft-Upgrade – mit Reaktionen.
// Läuft innerhalb von RokApp (scanner.js); R = geteilter Kontext (window.Rok).
// Supabase: public.feed_posts (id, user_id, kind, body, image, data, created_at)
//           public.feed_reactions (post_id, user_id, emoji, created_at) – ein Eintrag je Spieler und Beitrag
window.RokMods = window.RokMods || {};
window.RokMods.feed = (R) => {
  const $ = R.$, esc = R.esc, A = window.RokAuth;
  const REACTS = [['👍', 'Daumen hoch'], ['👎', 'Daumen runter'], ['🔥', 'Feuer'], ['❤️', 'Herz'], ['😂', 'Lachen'], ['😮', 'Wow'], ['⚔️', 'Kampf'], ['💎', 'Kristall']];
  const KIND = { text: ['💬', 'Beitrag'], showcase: ['🎨', 'Showcase'], kvk: ['🏁', 'KvK-Bilanz'], craft: ['⚒️', 'Craft-Upgrade'], aoo: ['🏛️', 'AoO-Showcase'] };
  const LIMIT = 60;
  const st = { posts: [], reacts: {}, users: {}, loaded: false, loading: false, err: '', noTable: false, attach: null, busy: false, admin: false, craftPick: null };
  const db = () => A.db();
  const me = () => A.userId();
  const root = $('feedView');

  // ---------- Laden ----------
  async function load() {
    if (st.loading) return; st.loading = true; st.err = ''; render();
    try {
      const { data, error } = await db().from('feed_posts').select('*').order('created_at', { ascending: false }).limit(LIMIT);
      if (error) throw error;
      st.posts = data || [];
      const ids = st.posts.map((p) => p.id);
      st.reacts = {};
      if (ids.length) {
        const r = await db().from('feed_reactions').select('*').in('post_id', ids);
        if (!r.error) (r.data || []).forEach((x) => { (st.reacts[x.post_id] = st.reacts[x.post_id] || []).push(x); });
      }
      st.users = await R.users(st.posts.map((p) => p.user_id));
      st.noTable = false;
    } catch (e) { if (R.tableMissing(e)) st.noTable = true; else st.err = A.germanError ? A.germanError(e) : String(e.message || e); }
    st.loading = false; st.loaded = true; render();
  }
  A.isAdmin().then((ok) => { st.admin = !!ok; }).catch(() => {});

  // ---------- Beitrag anlegen ----------
  const dataUrlToBlob = async (u) => (await fetch(u)).blob();
  async function post() {
    const body = ($('feedText')?.value || '').trim();
    if (!body && !st.attach) { msg('Schreib etwas oder häng etwas an.', 'warn'); return; }
    if (st.busy) return; st.busy = true; msg('Wird gepostet …', 'busy'); render();
    try {
      const row = { user_id: me(), kind: st.attach ? st.attach.kind : 'text', body: body.slice(0, 1000), image: null, data: st.attach ? st.attach.data || null : null };
      const { data: ins, error } = await db().from('feed_posts').insert(row).select().single();
      if (error) throw error;
      if (st.attach && st.attach.dataUrl) {   // Bild erst nach dem Anlegen hochladen (Dateiname = Beitrags-ID)
        try {
          const url = await A.uploadImage(await dataUrlToBlob(st.attach.dataUrl), 'feed_' + ins.id);
          await db().from('feed_posts').update({ image: url }).eq('id', ins.id);
        } catch (x) { msg('Beitrag gepostet, aber das Bild konnte nicht hochgeladen werden: ' + (x.message || x), 'warn'); }
      }
      st.attach = null; if ($('feedText')) $('feedText').value = '';
      msg('✓ Gepostet', 'ok');
      await load();
    } catch (e) { msg(R.tableMissing(e) ? 'Die Feed-Tabellen fehlen noch in Supabase (SQL im Chat ausführen).' : 'Posten fehlgeschlagen: ' + (A.germanError ? A.germanError(e) : e.message), 'err'); }
    st.busy = false; render();
  }
  async function del(id) {
    if (!(await window.UI.confirm('Diesen Beitrag löschen?'))) return;
    const { error } = await db().from('feed_posts').delete().eq('id', id);
    if (error) { msg('Löschen fehlgeschlagen: ' + (A.germanError ? A.germanError(error) : error.message), 'err'); return; }
    st.posts = st.posts.filter((p) => p.id !== id); render();
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
    render();
  }

  // ---------- Anhänge ----------
  async function attachShowcase() {
    msg('Showcase wird als Bild erstellt …', 'busy');
    try {
      const { url, title } = await R.showcaseImage({ jpeg: true, pixelRatio: 1.25 });
      st.attach = { kind: 'showcase', dataUrl: url, data: { title } }; msg('', '');
    } catch (e) { msg('Showcase-Bild fehlgeschlagen: ' + (e.message || e), 'err'); }
    render();
  }
  function attachKvk() {
    const img = (A.ownMeta() || {}).kvk_card;
    if (!img) { msg('Noch keine KvK-Bilanz – im KvK-Bereich unter Stats → „Bild für dein Profil“ → „Im Profil zeigen“.', 'warn'); return; }
    st.attach = { kind: 'kvk', dataUrl: img, data: {} }; render();
  }
  function attachAoo() {
    const c = (A.ownMeta() || {}).aoo_card;
    if (!c) { msg('Noch kein AoO-Showcase – unter 🎨 Showcases anlegen.', 'warn'); return; }
    st.attach = { kind: 'aoo', data: c }; render();
  }
  // Craft-Upgrade: Ausrüstung aus den eigenen Showcase-Sets wählen
  const ownGear = () => {
    const out = [], seen = new Set();
    (R.showcaseList ? R.showcaseList() : []).forEach((sc) => (sc.sets || []).forEach((set) => Object.entries(set.gear || {}).forEach(([slot, g]) => {
      if (!g || !g.name) return; const key = g.item || g.name; if (seen.has(key)) return; seen.add(key);
      out.push({ slot, item: g.item, name: g.name, icon: g.icon, rarity: g.rarity, tier: g.tier, refine: g.refine, set: set.name || sc.title });
    })));
    return out;
  };
  function attachCraft(idx) {
    const g = ownGear()[idx]; if (!g) return;
    st.attach = { kind: 'craft', data: g }; st.craftPick = null; render();
  }

  // ---------- Darstellung ----------
  const rarCol = { legendary: 'text-amber-300', epic: 'text-fuchsia-300', elite: 'text-sky-300', advanced: 'text-emerald-300', normal: 'text-slate-300' };
  const tierTxt = (t) => (t ? ` · T${t}` : '');
  const craftTile = (g) => `<div class="flex items-center gap-3 rounded-xl border border-gold-500/30 bg-ink-950/70 p-3">
      ${g.icon ? `<img src="${esc(g.icon)}" alt="" class="w-14 h-14 rounded-lg object-contain bg-ink-900">` : '<span class="w-14 h-14 rounded-lg grid place-items-center text-2xl bg-ink-900">⚒️</span>'}
      <div class="min-w-0"><div class="text-[10px] uppercase tracking-widest text-slate-500">⚒️ Craft-Upgrade</div>
        <div class="font-semibold ${rarCol[g.rarity] || 'text-slate-100'} truncate">${esc(g.name || '?')}</div>
        <div class="text-xs text-slate-400">${esc(g.slot || '')}${tierTxt(g.tier)}${g.refine ? ` · Refine ${esc(String(g.refine))}` : ''}${g.set ? ` · ${esc(g.set)}` : ''}</div></div></div>`;
  const aooTile = (c) => `<div class="rounded-xl border border-sky-400/40 bg-gradient-to-br from-sky-950/60 to-ink-950 p-3">
      <div class="text-[10px] uppercase tracking-widest text-sky-300">🏛️ Ark of Osiris</div>
      <div class="flex flex-wrap gap-x-5 gap-y-1 mt-1 text-sm"><span>🏆 <b>${esc(String(c.wins ?? '–'))}</b> Siege</span>${c.mvp != null ? `<span>⭐ <b>${esc(String(c.mvp))}</b> MVP</span>` : ''}${c.role ? `<span>🎯 ${esc(c.role)}</span>` : ''}</div>
      ${c.motto ? `<div class="text-xs text-slate-300 mt-1 italic">„${esc(c.motto)}“</div>` : ''}</div>`;
  const attachHTML = (p) => {
    if (p.kind === 'craft' && p.data) return craftTile(p.data);
    if (p.kind === 'aoo' && p.data) return aooTile(p.data);
    if (p.image) return `<a href="${esc(p.image)}" target="_blank" rel="noopener" class="block"><img src="${esc(p.image)}" alt="" loading="lazy" class="w-full rounded-xl border border-ink-700 bg-ink-950"></a>`;
    if (p.kind !== 'text') return `<div class="text-xs text-slate-500">(${esc(KIND[p.kind]?.[1] || p.kind)} ohne Bild)</div>`;
    return '';
  };
  const reactBar = (p) => {
    const list = st.reacts[p.id] || [], mine = list.find((x) => x.user_id === me());
    const cnt = {}; list.forEach((x) => { cnt[x.emoji] = (cnt[x.emoji] || 0) + 1; });
    return `<div class="flex flex-wrap items-center gap-1.5 pt-2 border-t border-ink-700/70">${REACTS.map(([e, lab]) => `
      <button type="button" data-react="${esc(p.id)}|${e}" title="${lab}" aria-pressed="${mine && mine.emoji === e}" class="inline-flex items-center gap-1 px-2 py-1 rounded-full border text-sm transition ${mine && mine.emoji === e ? 'border-gold-400 bg-gold-500/15 text-gold-200' : cnt[e] ? 'border-ink-600 bg-ink-900 text-slate-200 hover:border-gold-500/60' : 'border-ink-700 text-slate-500 hover:border-gold-500/60 hover:text-slate-200'}">${e}${cnt[e] ? `<span class="text-[11px] tabular-nums">${cnt[e]}</span>` : ''}</button>`).join('')}</div>`;
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
    </article>`;
  };
  const composer = () => {
    const a = st.attach, gear = ownGear();
    const chip = (ic, lab, attr, on) => `<button type="button" ${attr} class="text-xs px-3 py-1.5 rounded-lg border transition ${on ? 'border-gold-400 bg-gold-500/15 text-gold-200' : 'border-ink-600 hover:border-gold-500/60 hover:text-gold-300'}">${ic} ${lab}</button>`;
    return `<div class="panel rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
      <div class="flex items-center gap-3">${R.userLine({ username: R.PROFILE.name, avatar: (A.ownMeta() || {}).avatar, alliance_tag: (A.ownMeta() || {}).alliance_tag }, 'w-10 h-10 text-base')}<span class="ml-auto text-[11px] uppercase tracking-widest text-slate-500">Neuer Beitrag</span></div>
      <textarea id="feedText" rows="2" maxlength="1000" placeholder="Was gibt's Neues? (optional)" class="w-full bg-ink-950 border border-ink-600 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-gold-500 resize-y"></textarea>
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-[11px] text-slate-500 mr-1">Anhängen:</span>
        ${chip('🎨', 'Showcase', 'data-feed-attach="showcase"', a && a.kind === 'showcase')}
        ${chip('🏁', 'KvK-Bilanz', 'data-feed-attach="kvk"', a && a.kind === 'kvk')}
        ${chip('🏛️', 'AoO', 'data-feed-attach="aoo"', a && a.kind === 'aoo')}
        ${chip('⚒️', 'Craft-Upgrade', 'data-feed-attach="craft"', a && a.kind === 'craft')}
        ${a ? `<button type="button" data-feed-attach="none" class="text-xs px-2.5 py-1.5 rounded-lg border border-ink-700 text-slate-400 hover:text-red-300 hover:border-red-400/60">✕ Anhang entfernen</button>` : ''}
        <button type="button" id="feedPost" ${st.busy ? 'disabled' : ''} class="ml-auto px-5 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-ink-950 font-semibold text-sm disabled:opacity-50">Posten</button>
      </div>
      ${st.craftPick === 'open' ? `<div class="rounded-xl border border-ink-700 bg-ink-950/60 p-3">
        <div class="text-[11px] uppercase tracking-widest text-slate-500 mb-2">⚒️ Welches Teil hast du gecraftet / aufgewertet?</div>
        ${gear.length ? `<div class="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">${gear.map((g, i) => `<button type="button" data-feed-craft="${i}" class="flex items-center gap-2 text-left rounded-lg border border-ink-700 hover:border-gold-500/60 px-2 py-1.5">
          ${g.icon ? `<img src="${esc(g.icon)}" alt="" class="w-9 h-9 rounded object-contain bg-ink-900">` : '<span class="w-9 h-9 rounded grid place-items-center bg-ink-900">⚒️</span>'}
          <span class="min-w-0"><span class="block text-sm truncate ${rarCol[g.rarity] || ''}">${esc(g.name)}</span><span class="block text-[10px] text-slate-500 truncate">${esc(g.slot)}${tierTxt(g.tier)} · ${esc(g.set)}</span></span></button>`).join('')}</div>`
        : `<p class="text-sm text-slate-500">Noch keine Ausrüstung in deinen Showcase-Sets – zuerst unter 🎨 Showcases eintragen.</p>`}</div>` : ''}
      ${a ? `<div class="rounded-xl border border-gold-500/30 bg-ink-950/60 p-2">
        ${a.kind === 'craft' ? craftTile(a.data) : a.kind === 'aoo' ? aooTile(a.data) : `<img src="${esc(a.dataUrl)}" alt="" class="w-full max-h-72 object-contain rounded-lg">`}</div>` : ''}
      <div id="feedMsg" class="text-xs min-h-[1em]"></div>
    </div>`;
  };
  let lastMsg = ['', ''];
  function msg(t, tone) { lastMsg = [t, tone]; const el = $('feedMsg'); if (!el) return; el.textContent = t; el.className = 'text-xs min-h-[1em] ' + ({ ok: 'text-emerald-400', warn: 'text-amber-300', err: 'text-red-300', busy: 'text-slate-300' }[tone] || 'text-slate-500'); }
  function render() {
    if (!root) return;
    const text = $('feedText') ? $('feedText').value : '';
    root.innerHTML = `
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div><h2 class="font-display text-2xl gold-text">📰 Feed</h2><p class="text-xs text-slate-500">Showcases, KvK-Bilanzen und Craft-Upgrades aller Spieler</p></div>
        <button type="button" id="feedReload" class="text-xs px-3 py-1.5 rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300">↻ Aktualisieren</button>
      </div>
      ${composer()}
      ${st.noTable ? `<div class="panel rounded-2xl p-5 text-sm text-amber-300">⚠ Die Feed-Tabellen fehlen noch in Supabase. Bitte das SQL aus dem Chat ausführen – danach erscheint hier der Feed.</div>` : ''}
      ${st.err ? `<div class="panel rounded-2xl p-5 text-sm text-red-300">⚠ ${esc(st.err)}</div>` : ''}
      ${!st.loaded || st.loading ? `<p class="text-sm text-slate-500 text-center py-6">⏳ Feed wird geladen …</p>` : ''}
      <div class="grid gap-4 lg:grid-cols-2 items-start">${st.posts.map(postHTML).join('')}</div>
      ${st.loaded && !st.loading && !st.posts.length && !st.noTable ? `<p class="text-sm text-slate-500 text-center py-6">Noch keine Beiträge – mach den Anfang! 🎉</p>` : ''}`;
    if ($('feedText')) $('feedText').value = text;
    msg(lastMsg[0], lastMsg[1]);
  }
  root.addEventListener('click', (ev) => {
    const t = ev.target;
    if (t.closest('#feedPost')) { post(); return; }
    if (t.closest('#feedReload')) { load(); return; }
    const at = t.closest('[data-feed-attach]');
    if (at) { const k = at.dataset.feedAttach; st.craftPick = null;
      if (k === 'none') { st.attach = null; render(); } else if (k === 'showcase') attachShowcase(); else if (k === 'kvk') attachKvk(); else if (k === 'aoo') attachAoo(); else if (k === 'craft') { st.craftPick = 'open'; render(); }
      return; }
    const cp = t.closest('[data-feed-craft]'); if (cp) { attachCraft(+cp.dataset.feedCraft); return; }
    const rb = t.closest('[data-react]'); if (rb) { const [id, e] = rb.dataset.react.split('|'); react(id, e); return; }
    const dl = t.closest('[data-feed-del]'); if (dl) { del(dl.dataset.feedDel); return; }
    const pr = t.closest('[data-feed-prof]'); if (pr) { R.openProfile(pr.dataset.feedProf); return; }
  });
  // Seite öffnen → laden (einmal, danach über ↻)
  R.viewHooks.feed = () => { if (!st.loaded && !st.loading) load(); else render(); };
  R.feedReload = load;
  render();
};
