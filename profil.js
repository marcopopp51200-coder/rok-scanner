// Wiz fan Club – Game Profil (Kopf, Kacheln, Scans, Countdown, KvK-Bilanz, Bearbeiten)
// Läuft innerhalb von RokApp (scanner.js); R = geteilter Kontext (window.Rok)
window.RokMods = window.RokMods || {};
window.RokMods.profil = (R) => {
  R.avatarHtml = avatarHtml; R.renderHeaderAvatar = renderHeaderAvatar; R.openProfile = openProfile; R.closeProfEdit = closeProfEdit; R.loadGameProfile = loadGameProfile; R.renderGameProfile = renderGameProfile;
  // ================= Game Profil =================
  const AVATARS = ['', '👑', '⚔️', '🛡️', '🏹', '⭐', '💎'];
  const isImgAv = (av) => typeof av === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(av); R.isImgAv = isImgAv;
  function avatarHtml(name, av, cls = 'w-8 h-8 text-sm') {
    if (isImgAv(av)) return `<span class="${cls} shrink-0 inline-block rounded-xl overflow-hidden border border-gold-500/50 bg-ink-800"><img src="${av}" alt="" class="w-full h-full object-cover object-center"></span>`;
    if (av && av.length > 8) av = '';                                   // unbekanntes Format → Anfangsbuchstabe
    const inner = av ? R.esc(av) : R.esc(String(name || '?').charAt(0).toUpperCase());
    return `<span class="${cls} shrink-0 inline-grid place-items-center rounded-xl font-bold ${av ? 'bg-ink-800 border border-gold-500/40' : 'bg-gradient-to-br from-gold-400 to-gold-600 text-ink-950'}">${inner}</span>`;
  }
  // Icon oben rechts (Wiz fan Club) – fest eingebettet, rund
  const WIZ_ICON = 'data:image/jpeg;base64,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';
  function renderHeaderAvatar() {
    const av = RokAuth.ownMeta().avatar;
    const src = isImgAv(av) ? av : (av ? '' : WIZ_ICON);
    R.$('userAvatar').innerHTML = src
      ? `<img src="${src}" alt="" class="block w-10 h-10 rounded-full object-cover object-center ring-2 ring-gold-400/80 shadow-[0_0_14px_rgba(245,197,66,.45)]">`
      : `<span class="w-10 h-10 rounded-full grid place-items-center text-xl bg-ink-800 ring-2 ring-gold-400/80 shadow-[0_0_14px_rgba(245,197,66,.45)]">${R.esc(av)}</span>`;   // gewähltes Symbol
  }

  // Dropdown
  const closeMenu = () => { R.$('userMenu').classList.add('hidden'); R.$('userMenuBtn').setAttribute('aria-expanded', 'false'); };
  R.$('userMenuBtn').onclick = (ev) => { ev.stopPropagation(); const open = R.$('userMenu').classList.toggle('hidden') === false; R.$('userMenuBtn').setAttribute('aria-expanded', String(open)); };
  document.addEventListener('click', (ev) => { if (!R.$('userBox').contains(ev.target)) closeMenu(); });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeMenu(); });
  R.$('menuProfile').onclick = () => { closeMenu(); openProfile(RokAuth.userId()); };
  R.$('menuScanner').onclick = () => { closeMenu(); R.view = 'scanner'; R.applyView(); R.showHub?.(true); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  R.$('profInvNote').onclick = () => { R.view = 'kvk'; R.applyView(); const K = window.KvKCalc; if (K) { const s = K.getState(); s.tab = 'friends'; K.setState(s); K.render(); } window.scrollTo({ top: 0, behavior: 'smooth' }); };
  R.$('menuKvk').onclick = () => { closeMenu(); R.view = 'kvk'; R.applyView(); window.KvKCalc?.render(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  R.$('menuShowcases').onclick = () => { closeMenu(); R.goView('showcases'); };
  R.closeUserMenu = closeMenu;

  let profileUid = null; R.lastProfileP = null; let profRefreshT = null;
  const ownProfileOpen = () => R.view === 'profile' && profileUid && profileUid === RokAuth.userId();
  const ownEntries = () => R.history.map(e => ({ ...e })).sort((a, b) => a.ts - b.ts);
  // Dashboard → Game Profil: Änderungen sofort übernehmen (Diagramm, Speedups, Statthalter-Werte)
  function refreshOwnProfile() {
    if (!ownProfileOpen() || !R.lastProfileP?.own) return;
    renderGameProfile({ ...R.lastProfileP, entries: ownEntries(), isPrivate: !!RokAuth.ownMeta().is_private });
  }
  R.onHistoryChange = () => { clearTimeout(profRefreshT); profRefreshT = setTimeout(refreshOwnProfile, 250); };
  // Cloud → lokal: Scans von anderen Geräten nachladen
  let syncBusy = false;
  async function syncOwnHistory() {
    if (syncBusy) return false; syncBusy = true;
    try {
      const fresh = await RokAuth.pullScans();
      if (!fresh.length) return false;
      fresh.forEach(e => R.history.push(R.sanitize(e)));
      R.saveHistory(); R.renderHistory();
      return true;
    } catch (e) { console.warn('Verlauf-Sync fehlgeschlagen', e); return false; }
    finally { syncBusy = false; }
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && ownProfileOpen()) syncOwnHistory(); });
  setInterval(() => { if (document.visibilityState === 'visible' && ownProfileOpen()) syncOwnHistory(); }, 60000);
  const SKIN = 'rok_scanner_city_skin';   // eigener City-Skin (lokal + Cloud user_state)
  const safeSkin = (v) => typeof v === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v) ? v : '';
  const ownSkin = () => safeSkin(R.LS.get(SKIN, null) ?? RokAuth.ownMeta().city_skin);
  // Reihenfolge der Werte-Kacheln im Profilkopf (lokal + leaderboard.prof_order, damit Freunde sie auch so sehen)
  const PROF_ORDER_DEF = ['kill_points', 'highest_merit', 'energy', 'ark_wins', 'units_killed', 'units_healed', 'units_lost', 'lk_autarch', 'deads'];
  const PROF_ORDER = 'rok_scanner_prof_order';
  let profTileEdit = false;
  const profOrder = (v) => { const a = String(v || '').split(',').map((x) => x.trim()).filter((x, i, l) => PROF_ORDER_DEF.includes(x) && l.indexOf(x) === i);
    return [...a, ...PROF_ORDER_DEF.filter((x) => !a.includes(x))]; };
  const ownProfOrder = () => R.LS.get(PROF_ORDER, null) ?? RokAuth.ownMeta().prof_order ?? '';
  const PROF_BG = 'rok_scanner_prof_bg';    // eigenes Hintergrundbild für den Profilkopf (lokal + leaderboard.prof_bg)
  const ownProfBg = () => safeSkin(R.LS.get(PROF_BG, null) ?? RokAuth.ownMeta().prof_bg);
  // Bild auf max. 1280 px Breite verkleinern, als JPEG (unter ~350 KB, damit es schnell lädt)
  async function shrinkBg(file) {
    const img = await hqLoadImage(file);
    const k = Math.min(1, 1280 / img.width, 720 / img.height * 1.6);
    const c = hqResize(img, Math.round(img.width * k), Math.round(img.height * k));
    img.close?.();
    let q = 0.78, url = c.toDataURL('image/jpeg', q);
    while (url.length > 350000 && q > 0.4) { q -= 0.1; url = c.toDataURL('image/jpeg', q); }
    return url;
  }
  // Bild mittig quadratisch zuschneiden (leicht gezoomt) und als kleines JPEG speichern
  async function cropSquare(file, size = 192, zoom = 0.8) {
    const img = await hqLoadImage(file);
    const side = Math.min(img.width, img.height) * zoom;
    const sx = (img.width - side) / 2, sy = (img.height - side) / 2;
    const c = hqResize(img, size, size, sx, sy, side, side);
    img.close?.();
    return c.toDataURL('image/jpeg', 0.82);
  }
  const PROF_EV = [
    { id: 'zenith', label: 'Universal + Train', short: 'Universal + Training', keys: ['universal', 'training'] },
    { id: 'kvk',    label: 'Universal + Heal',  short: 'Universal + Heilung',  keys: ['universal', 'healing'] }
  ];
  R.speedUi.profEv = R.speedUi.profEv || 'zenith';

  // KvK-Countdown im Profil: dieselbe Feuer-Uhr wie im KvK-Bereich (aus kvk-calculator.js)
  // Jeder Spieler trägt sein Datum selbst ein (KvK-Bereich) → steht in seinem Profil, auch für Besucher sichtbar
  const kvkDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d || '').slice(0, 10)) ? String(d).slice(0, 10) : '';
  function mountProfKvk(own, row) {
    const el = R.$('profKvkTimer'), hide = () => { el.classList.add('hidden'); el.innerHTML = ''; mountProfMap(own, row); };   // ohne Timer: Karte direkt zeigen
    const mapEl = R.$('profKvkMap'); if (mapEl) { mapEl.classList.add('hidden'); mapEl.innerHTML = ''; }                       // mit Timer: Karte über „Karte zeigen“
    const editMap = () => { const s = window.KvKCalc.getState(); s.tab = 'map'; s.open.mapCamps = true; window.KvKCalc.setState(s); R.view = 'kvk'; R.applyView(); window.KvKCalc.render(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    if (!window.KvKCalc?.mountTimer) return hide();
    try {
      if (own) {
        const d = kvkDate(window.KvKCalc.getState?.()?.startDate);
        if (d !== kvkDate(RokAuth.ownMeta().kvk_start)) RokAuth.saveKvkStart(d);      // bisheriges Datum ins Profil übernehmen
        el.classList.remove('hidden');
        RokAuth.saveKvkMap(window.KvKCalc.mapData());                                   // Karte fürs Profil aktuell halten
        window.KvKCalc.mountTimer(el, { onOpen: () => { R.view = 'kvk'; R.applyView(); window.KvKCalc?.render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }, map: null, onMapEdit: editMap });
      } else {
        const d = kvkDate(row?.kvk_start);
        if (!d) return hide();                                                         // Spieler hat (noch) kein Datum eingetragen
        el.classList.remove('hidden');
        window.KvKCalc.mountTimer(el, { startDate: d, events: row?.kvk_map?.ev || [], days: row?.kvk_map?.days, map: row?.kvk_map || {}, kingdom: row?.kingdom || '' });
      }
    } catch (e) { console.warn('KvK-Countdown nicht verfügbar', e); hide(); }
  }
  // KvK-Bilanz-Bild (eigenes aus ownMeta, fremdes aus leaderboard.kvk_card) zwischen Countdown und Showcase
  let profCardCtx = null;
  function mountProfCard(own, row) {
    profCardCtx = { own, row };
    const el = R.$('profKvkCard'); if (!el) return;
    const img = safeSkin(own ? RokAuth.ownMeta().kvk_card : row?.kvk_card);
    const aoo = own ? RokAuth.ownMeta().aoo_card : (row?.aoo_card && typeof row.aoo_card === 'object' ? row.aoo_card : null);
    if (!img && !aoo) { el.classList.add('hidden'); el.innerHTML = ''; return; }
    el.className = 'flex flex-col gap-6';
    const aooHtml = aoo && R.aooCardHTML ? `<div class="panel rounded-2xl p-4 sm:p-5"><div class="flex items-center justify-between gap-3 mb-3"><h3 class="font-display text-lg gold-text">🏛️ AoO Showcase</h3>${own ? '<button type="button" data-aoo-edit class="text-xs px-3 py-1.5 rounded-lg border border-gold-500/50 text-gold-300 hover:bg-gold-500/10">✎ Bearbeiten</button>' : ''}</div>${R.aooCardHTML(aoo, true)}</div>` : '';
    if (!img) { el.innerHTML = aooHtml; const ae = el.querySelector('[data-aoo-edit]'); if (ae) ae.onclick = () => R.goView('showcases'); return; }
    el.innerHTML = `<div class="panel rounded-2xl p-4 sm:p-5"><div class="flex items-center justify-between gap-3 mb-3">
        <h3 class="font-display text-lg gold-text">🏁 KvK-Bilanz</h3>
        <div class="flex gap-2">
          <a href="${img}" download="kvk-bilanz.jpg" class="text-xs px-3 py-1.5 rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300">⬇ Download</a>
          ${own ? '<button type="button" data-card-edit class="text-xs px-3 py-1.5 rounded-lg border border-gold-500/50 text-gold-300 hover:bg-gold-500/10">✎ Bearbeiten</button>' : ''}
        </div></div>
      <img src="${img}" alt="KvK-Bilanz" class="w-full rounded-xl border border-gold-500/30 shadow-2xl"></div>${aooHtml}`;
    const ae = el.querySelector('[data-aoo-edit]'); if (ae) ae.onclick = () => R.goView('showcases');
    const ed = el.querySelector('[data-card-edit]');
    if (ed) ed.onclick = () => { const s = window.KvKCalc.getState(); s.tab = 'end'; s.open.endImg = true; window.KvKCalc.setState(s); R.view = 'kvk'; R.applyView(); window.KvKCalc.render(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  }
  window.addEventListener('kvk:card', () => { if (profCardCtx && profCardCtx.own) mountProfCard(true, profCardCtx.row); });
  // KvK-Karte unter dem Countdown: eigene aus dem KvK-Bereich, fremde aus dem Profil (leaderboard.kvk_map)
  function mountProfMap(own, row) {
    const el = R.$('profKvkMap');
    if (!el) return;
    let shown = false;
    try {
      if (!window.KvKCalc?.mountMap) shown = false;
      else if (own) {
        RokAuth.saveKvkMap(window.KvKCalc.mapData());                                   // bisherige Karte ins Profil übernehmen
        shown = window.KvKCalc.mountMap(el, null, { onOpen: () => { const s = window.KvKCalc.getState(); s.tab = 'map'; s.open.mapCamps = true; window.KvKCalc.setState(s); R.view = 'kvk'; R.applyView(); window.KvKCalc.render(); window.scrollTo({ top: 0, behavior: 'smooth' }); } });
      } else shown = window.KvKCalc.mountMap(el, row?.kvk_map || {}, { kingdom: row?.kingdom || '', startDate: kvkDate(row?.kvk_start) });
    } catch (e) { console.warn('KvK-Karte nicht verfügbar', e); shown = false; }
    el.classList.toggle('hidden', !shown);
    if (!shown) el.innerHTML = '';
  }
  // Datum im KvK-Bereich geändert → im Profil speichern
  let kvkMapT = null;
  // Einladungen in KvK-Gruppen: kleine Zahl am Menü, Hinweis im eigenen Profil, Reiter Friends im KvK
  window.addEventListener('kvk:invites', (ev) => {
    const n = +ev.detail || 0;
    document.querySelectorAll('[data-inv-badge]').forEach((b) => { b.textContent = n > 9 ? '9+' : String(n); b.style.display = n ? 'grid' : 'none'; });
    const note = R.$('profInvNote');
    if (note) { note.style.display = n && profileUid === RokAuth.userId() ? 'flex' : 'none'; note.querySelector('[data-inv-n]').textContent = n === 1 ? '1 Einladung' : n + ' Einladungen'; }
    window.KvKCalc?.setInvites?.(n);
  });
  window.addEventListener('kvkcalc:change', (ev) => {
    const d = kvkDate(ev.detail?.startDate); if (d !== kvkDate(RokAuth.ownMeta().kvk_start)) RokAuth.saveKvkStart(d);
    clearTimeout(kvkMapT); kvkMapT = setTimeout(() => {
      if (window.KvKCalc?.mapData) RokAuth.saveKvkMap(window.KvKCalc.mapData());   // Karte gesammelt speichern (Tippen)
      if (window.KvKCalc?.kvkStats) RokAuth.saveKvkStats(window.KvKCalc.kvkStats()); // Werte für den Freunde-Vergleich
    }, 1500);
  });

  function openProfile(uid) {
    if (!uid) return;
    profileUid = uid; R.view = 'profile'; R.applyView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  // Zurück: vorherige Seite (Rangliste, Game Profil oder Scanner)
  function goBack() {
    let v; do { v = R.navStack.pop(); } while (v === R.view);
    R.navBack = true; R.view = v || 'feed'; R.applyView(); window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  const goRank = () => { R.view = 'feed'; R.navStack = []; R.applyView(); window.scrollTo({ top: 0, behavior: 'smooth' }); };   // Startseite = Feed
  R.$('profBack').onclick = goRank;
  R.$('scanBack').onclick = () => { if (R.view === 'scanner' && R.scanHub === false) { R.showHub(true); window.scrollTo({ top: 0, behavior: 'smooth' }); } else goRank(); };   // im Bereich → zurück zu den Kacheln
  R.$('kvkBack').onclick = goRank;
  R.$('brandHome').onclick = goRank;
  R.$('brandHome').onkeydown = (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); goRank(); } };

  function setModeBadge(own, priv) {
    const b = R.$('profModeBadge');
    b.textContent = own ? '✎ Dein Profil · ' + (priv ? '🔒 privat' : 'öffentlich') : '👁 Nur Ansicht';
    b.className = 'text-xs px-2.5 py-1 rounded-full border transition ' + (own ? 'border-gold-500/50 text-gold-300 bg-gold-500/5' : 'border-ink-600 text-slate-400');
    b.disabled = !own; b.title = own ? 'Profil bearbeiten' : '';
    b.setAttribute('aria-haspopup', own ? 'dialog' : 'false');
  }
  // Profil bearbeiten: eigenes Fenster
  function editOpen() { return !R.$('profEditModal').classList.contains('hidden'); }
  function openProfEdit() {
    if (!ownProfileOpen()) return;
    R.$('profEditModal').classList.remove('hidden'); document.body.style.overflow = 'hidden';
    setTimeout(() => R.$('profEditClose').focus(), 30);
  }
  function closeProfEdit() {
    if (!editOpen()) return;
    R.$('profEditModal').classList.add('hidden'); document.body.style.overflow = '';
    R.$('profEditModal').querySelectorAll('[data-gov]').forEach(i => { delete i.dataset.dirty; });
    if (R.lastProfileP?.own) refreshOwnProfile();
  }
  document.body.appendChild(R.$('profEditModal'));                // außerhalb des Profil-Inhalts (bleibt beim Neuladen offen)
  R.$('profModeBadge').onclick = () => openProfEdit();
  R.$('profEditClose').onclick = () => closeProfEdit();
  R.$('profEditModal').addEventListener('mousedown', (ev) => { if (ev.target === R.$('profEditModal')) closeProfEdit(); });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && editOpen()) closeProfEdit(); });
  R.$('profEditModal').addEventListener('input', (ev) => { if (ev.target.dataset?.gov) ev.target.dataset.dirty = '1'; });

  async function loadGameProfile() {
    const uid = profileUid, own = uid === RokAuth.userId();
    setModeBadge(own, RokAuth.ownMeta().is_private);
    if (!own) closeProfEdit();
    R.$('profBody').classList.add('hidden');
    R.$('profState').classList.remove('hidden'); R.$('profState').textContent = 'Lade Game Profil …';
    try {
      const [p, all] = await Promise.all([RokAuth.loadProfile(uid), RokAuth.loadLeaderboard().catch(() => [])]);
      if (uid !== profileUid) return;                         // inzwischen anderes Profil geöffnet
      let entries;
      if (own) { await syncOwnHistory(); entries = ownEntries(); }
      else entries = p.scans.map(e => ({ ...e }));
      entries.sort((a, b) => a.ts - b.ts);
      const row = p.row || (own ? { username: R.PROFILE.name, vip_points: null } : null);
      if (!row) throw new Error('Dieses Profil wurde nicht gefunden.');
      const sorted = all.map(r => ({ ...r, vip_points: +r.vip_points || 0 }))
        .sort((a, b) => (b.vip_points - a.vip_points) || (new Date(a.updated_at) - new Date(b.updated_at)) || String(a.username).localeCompare(b.username));
      const place = sorted.findIndex(r => r.user_id === uid) + 1;
      renderGameProfile({ own, row, entries, place, players: sorted.length, scansError: p.scansError, isPrivate: own ? !!RokAuth.ownMeta().is_private : !!p.isPrivate });
      R.$('profState').classList.add('hidden'); R.$('profBody').classList.remove('hidden');
      mountProfKvk(own, row);
      mountProfCard(own, row);
      if (own) RokAuth.refreshInvites().catch(() => {}); else R.$('profInvNote').style.display = 'none';
    } catch (e) {
      R.$('profState').textContent = 'Profil konnte nicht geladen werden: ' + (e.message || e);
    }
  }

  function renderGameProfile(P) {
    R.lastProfileP = P;
    const { own, row, entries } = P;
    const meta = own ? { ...RokAuth.ownMeta(), ...profExtra(), city_skin: ownSkin() }
      : { alliance_tag: row.alliance_tag || '', avatar: row.avatar || '', city_skin: safeSkin(row.city_skin), governor_id: row.governor_id || '', kingdom: row.kingdom || '', alliance_name: row.alliance_name || '' };
    const vipEntries = entries.filter(e => e.type === 'vip');
    const speedEntries = entries.filter(e => e.type === 'speedups' && e.total != null);
    // VIP-Punkte inkl. Gegenstände (wie in der Rangliste)
    let points = row.vip_points != null ? +row.vip_points : null;
    if (own) { const n = R.vipNumbers(); if (n.current != null || n.inventory) points = n.after; }
    if (points == null && vipEntries.length) points = vipEntries[vipEntries.length - 1].after;
    const sp = own && R.curSpeed ? R.curSpeed : (speedEntries[speedEntries.length - 1] || null);
    const spTs = own ? (speedEntries[speedEntries.length - 1]?.ts) : sp?.ts;

    // ---- Kopf ----
    const govEntries = entries.filter(e => e.type === 'governor');
    // Statthalter-Werte: je Feld der neueste Scan, der es enthält – sonst (z. B. private Profile) aus der Rangliste
    const GOV_KEYS = ['kill_points', 'highest_merit', 'energy', 'deads', 'ark_wins', 'lk_autarch', 'lk_participated', 'units_killed', 'units_lost', 'units_healed'];
    const gov = (() => {
      const o = { ts: govEntries.length ? govEntries[govEntries.length - 1].ts : null }; let any = false;
      GOV_KEYS.forEach(k => { const v = R.govLatest(k, govEntries); o[k] = v != null ? v : (row[k] != null ? +row[k] : null); if (o[k] != null) any = true; });
      return any ? o : null;
    })();
    if (!meta.governor_id) { const gi = [...govEntries].reverse().find(x => x.governor_id); if (gi) meta.governor_id = String(gi.governor_id); }
    const lvl = points != null ? R.lbLevel(points) : null, nx = points != null ? R.lbNext(points) : null;
    // Speedups gesamt: nur für den Spieler selbst und Admins
    const canSpeed = own;                                             // Speedups, Deads, AP, Gems und Verlauf: nur im eigenen Profil
    const spTotal = sp ? (sp.total != null ? +sp.total : R.SPEED.reduce((a, c) => a + (+sp[c.k] || 0), 0)) : null;
    const dv = gov?.deads;
    // Speedups nur Universal / Heilung / Training (privat), Deads als eigene Kachel
    const spv = (k) => sp ? (+sp[k] || (k === 'healing' ? +sp.heal || 0 : 0)) : null;
    const spParts = [['⏱️', 'Universal', 'universal', 'text-sky-300'], ['❤️', 'Heilung', 'healing', 'text-rose-300'], ['⚔️', 'Training', 'training', 'text-amber-300']];
    const spSum = sp ? spParts.reduce((a, [, , k]) => a + spv(k), 0) : null;
    const spTile = canSpeed ? `<div class="col-span-2 sm:col-span-9 rounded-xl bg-gradient-to-br from-sky-950/60 to-ink-950/70 border border-sky-500/30 px-3 py-2.5">
            <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div class="min-w-[9rem]">
                <div class="text-[10px] uppercase tracking-wide sm:tracking-widest text-sky-200/80 truncate">⏱ Speedups <span class="normal-case tracking-normal text-slate-500">· 🔒 nur für dich</span></div>
                <div class="text-[15px] sm:text-2xl font-extrabold text-white tabular-nums">${spSum != null ? `${R.days(spSum)} <span class="text-sm font-semibold text-slate-400">Tage</span>` : '–'}</div>
              </div>
              <div class="flex-1 min-w-[14rem] grid grid-cols-3 gap-1.5">${spParts.map(([ic, lab, k, col]) => `
                <div class="min-w-0 rounded-lg bg-ink-950/60 border border-ink-700 px-2 py-1.5">
                  <div class="text-[10px] text-slate-400 truncate">${ic} ${lab}</div>
                  <div class="text-sm font-bold tabular-nums ${col}">${sp ? R.days(spv(k)) : '–'} <span class="text-[10px] font-medium text-slate-500">T</span></div>
                </div>`).join('')}</div>
            </div>
          </div>` : '';
    // Werte-Kacheln (gleicher Stil für alle, auch Deads) · Reihenfolge frei wählbar (Felder 1 … n)
    const TILE_DEF = {
      kill_points: ['⚔️', 'Kill-Punkte', '', 'bg-red-400/80'], highest_merit: ['🏅', 'Höchster Verdienst', '', 'bg-amber-400/80'], energy: ['⚡', 'Energie', '', 'bg-yellow-300/80'],
      ark_wins: ['🏛️', 'Truhe des Osiris', 'Siege', 'bg-sky-400/80'], units_killed: ['🗡️', 'Most Units Killed', '', 'bg-rose-400/80'], units_healed: ['💚', 'Most Units Healed', '', 'bg-emerald-400/80'],
      units_lost: ['🩸', 'Most Units Lost', '', 'bg-slate-400/80'], lk_autarch: ['👑', 'Verlorenes Königreich', '× Alleinherrscher', 'bg-gold-400/90'], deads: ['💀', 'Deads', '', 'bg-red-600/80'] };
    const order = profOrder(own ? ownProfOrder() : row.prof_order).filter((k) => k !== 'deads' || canSpeed);   // Deads nur für dich
    const editT = own && profTileEdit;
    const statTile = (k, idx) => { const [ic, label, unit, acc] = TILE_DEF[k], v = gov && gov[k] != null ? gov[k] : null; return `
          <div class="${idx === 8 ? 'col-span-2 ' : ''}sm:col-span-3 min-w-0 relative overflow-hidden rounded-xl bg-ink-950/70 border ${editT ? 'border-gold-500/50' : 'border-ink-700'} pl-3.5 pr-2 sm:pr-3 py-3">
            <span class="absolute inset-y-0 left-0 w-1 ${acc}"></span>
            ${editT ? `<div class="flex items-center gap-1.5 mb-1.5"><span class="shrink-0 w-6 h-6 rounded-md grid place-items-center text-[11px] font-bold bg-gold-500 text-ink-950">${idx + 1}</span>
              <select data-prof-slot="${idx}" class="min-w-0 flex-1 bg-ink-950 border border-ink-600 rounded-md px-1.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-gold-500">${order.map((o) => `<option value="${o}" ${o === k ? 'selected' : ''}>${TILE_DEF[o][0]} ${TILE_DEF[o][1]}</option>`).join('')}</select></div>` : ''}
            <div class="text-[10px] uppercase tracking-wide sm:tracking-widest text-slate-400 truncate">${ic} ${label}${k === 'deads' ? ' <span class="normal-case tracking-normal text-slate-500">· 🔒</span>' : ''}</div>
            <div class="text-[15px] sm:text-2xl font-extrabold text-white tabular-nums mt-0.5 truncate">${v != null ? R.fmt(v) + (unit ? ` <span class="text-xs font-semibold text-slate-400">${unit}</span>` : '') : '–'}</div>
            ${k === 'lk_autarch' && gov && gov.lk_participated != null ? `<div class="text-[11px] text-slate-400 tabular-nums">🎟️ ${R.fmt(gov.lk_participated)}× teilgenommen</div>` : ''}
          </div>`; };
    // eigenes Hintergrundbild im Profilkopf (für alle sichtbar, Spalte leaderboard.prof_bg)
    const pBg = own ? ownProfBg() : safeSkin(row.prof_bg);
    R.$('profHead').style.background = pBg ? `linear-gradient(180deg,rgba(7,9,15,.72),rgba(7,9,15,.9)),url("${pBg}") center/cover no-repeat` : '';
    R.$('profHead').innerHTML = `
      <div class="flex flex-wrap items-center gap-5">
        ${avatarHtml(row.username, meta.avatar, 'w-20 h-20 text-4xl rounded-2xl')}
        <div class="flex-1 min-w-[200px]">
          <div class="flex flex-wrap items-baseline gap-x-3">
            <h2 class="font-display text-3xl gold-text" translate="no">${R.esc(row.username)}</h2>
            ${meta.alliance_tag ? `<span class="text-lg font-semibold text-slate-300">[${R.esc(meta.alliance_tag)}]</span>` : (own ? '<span class="text-xs text-slate-500">kein Allianz-Tag</span>' : '')}
            ${meta.alliance_name ? `<span class="text-sm text-slate-400" translate="no">${R.esc(meta.alliance_name)}</span>` : ''}
            ${meta.kingdom ? `<span class="px-2 py-0.5 rounded-md bg-ink-950 border border-gold-500/30 text-gold-300 text-xs font-semibold tabular-nums" translate="no">🏰 #${R.esc(meta.kingdom)}</span>` : ''}
          </div>
          <div class="mt-2 flex flex-wrap items-center gap-2 text-sm">
            ${lvl != null ? `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-ink-950 bg-gradient-to-br from-gold-300 to-gold-600 shadow-[0_0_16px_rgba(245,197,66,.35)]">👑 ${R.vipName(lvl)}</span>` : '<span class="text-slate-500">Noch kein VIP-Stand</span>'}
            ${meta.governor_id ? `<span class="px-2 py-0.5 rounded-md bg-ink-950 border border-ink-600 text-slate-300 text-xs tabular-nums" translate="no">ID ${R.esc(meta.governor_id)}</span>` : ''}
            ${row.updated_at ? `<span class="text-xs text-slate-500">aktualisiert ${R.dateLabel(new Date(row.updated_at).getTime())}</span>` : ''}
          </div>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-12 gap-2 sm:gap-3 w-full">
          ${order.map(statTile).join('')}
          ${spTile}
          <div class="col-span-2 sm:col-span-12 flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-[11px] text-slate-500">
            ${editT ? `<span class="text-gold-300">Feld 1 – ${order.length}: wähle, was in welches Feld kommt</span><button type="button" data-prof-order-reset class="px-2 py-1 rounded-md border border-ink-600 hover:text-slate-200">↺ Standard</button>` : ''}
            ${own ? `<button type="button" data-prof-order-edit class="px-2.5 py-1 rounded-md border ${editT ? 'border-gold-400 bg-gold-500 text-ink-950 font-semibold' : 'border-ink-600 hover:border-gold-500/60 hover:text-gold-300'}">${editT ? '✓ Fertig' : '✎ Felder anordnen'}</button>` : ''}
            <span>${gov ? (gov.ts ? `Statthalter-Profil vom ${R.dateLabel(gov.ts)}` : '') : (own ? 'Noch kein Scan – „📷 Statthalter-Profil scannen“' : 'Noch kein Statthalter-Scan')}</span>
          </div>
        </div>
      </div>
      ${nx ? `<div class="mt-5">
        <div class="flex justify-between text-xs mb-1.5">
          <span class="text-slate-400">${nx.max ? 'Höchste VIP-Stufe erreicht' : `Fortschritt zu ${R.vipName(nx.next)}`}</span>
          <span class="${nx.max ? 'text-gold-300 font-semibold' : 'text-slate-300'}">${nx.max ? 'Max Level erreicht 👑' : `noch ${R.fmt(nx.need)} Punkte · ${Math.floor(nx.pct)} %`}</span>
        </div>
        <div class="h-3 rounded-full bg-ink-950 border border-ink-700 overflow-hidden">
          <div class="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-600" style="width:${nx.max ? 100 : nx.pct}%"></div>
        </div>
      </div>` : ''}`;

    // Felder anordnen: Feld n bekommt den gewählten Wert, der bisherige rutscht auf dessen alten Platz
    if (own) {
      R.$('profHead').onclick = (ev) => {
        if (ev.target.closest('[data-prof-order-edit]')) {
          profTileEdit = !profTileEdit;
          if (!profTileEdit) RokAuth.saveProfOrder(profOrder(ownProfOrder()).join(',')).catch(() => {});
          renderGameProfile(R.lastProfileP); return;
        }
        if (ev.target.closest('[data-prof-order-reset]')) { R.LS.set(PROF_ORDER, PROF_ORDER_DEF.join(',')); renderGameProfile(R.lastProfileP); }
      };
      R.$('profHead').onchange = (ev) => {
        const sel = ev.target.closest('[data-prof-slot]'); if (!sel) return;
        const cur = profOrder(ownProfOrder()), vis = cur.filter((k) => k !== 'deads' || canSpeed);
        const a = vis[+sel.dataset.profSlot], b = sel.value, ia = cur.indexOf(a), ib = cur.indexOf(b);
        if (ia < 0 || ib < 0 || a === b) return;
        cur[ia] = b; cur[ib] = a;
        R.LS.set(PROF_ORDER, cur.join(','));
        renderGameProfile(R.lastProfileP);
      };
    } else { R.$('profHead').onclick = null; R.$('profHead').onchange = null; }

    // ---- Speedups / AP / Gems (Umschalter oben im Feld, wird pro Gerät gemerkt) ----
    const onlySpeed = false;
    let pm = (() => { try { return localStorage.getItem('rok_prof_panel') || 'speed'; } catch { return 'speed'; } })();
    if (!canSpeed && pm === 'speed') pm = 'ap';
    if (onlySpeed) pm = 'speed';
    R.$('profSpeedMode').querySelectorAll('[data-pm]').forEach(b => { b.setAttribute('aria-pressed', String(b.dataset.pm === pm)); b.classList.toggle('hidden', b.dataset.pm === 'speed' ? !canSpeed : onlySpeed); });
    const nBtn = canSpeed ? (onlySpeed ? 1 : 3) : 2;
    R.$('profSpeedMode').classList.toggle('grid-cols-3', nBtn === 3); R.$('profSpeedMode').classList.toggle('grid-cols-2', nBtn === 2); R.$('profSpeedMode').classList.toggle('grid-cols-1', nBtn === 1);
    R.$('profSpeedTitle').textContent = pm === 'ap' ? 'Aktionspunkte' : pm === 'gems' ? 'Gems' : 'Speedups';
    R.$('profScanSpeed').classList.toggle('hidden', !own || pm !== 'speed');
    if (pm !== 'speed') {
      const last = (t, f) => { const l = entries.filter(e => e.type === t && f(e)); return l[l.length - 1] || null; };
      const tile = (icon, label, val, sub) => `<div class="rounded-xl bg-ink-950/60 border border-ink-700 p-4">
        <div class="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400"><span class="text-lg">${icon}</span>${label}</div>
        <div class="text-2xl font-extrabold text-white tabular-nums mt-1">${val}</div>${sub ? `<div class="text-xs text-slate-400">${sub}</div>` : ''}</div>`;
      if (pm === 'ap') {
        const e = last('ap', x => x.total_ap != null || x.ap_50 != null);
        R.$('profSpeed').innerHTML = tile('🧪', 'Gesamt-AP', e ? R.fmt(e.total_ap ?? (50 * (e.ap_50 || 0) + 100 * (e.ap_100 || 0) + 500 * (e.ap_500 || 0) + 1000 * (e.ap_1000 || 0))) : '–', e ? '' : 'keine Daten')
          + tile('🍶', '50 / 100 AP', e ? `${R.fmt(e.ap_50 || 0)} / ${R.fmt(e.ap_100 || 0)}` : '–', 'Flaschen')
          + tile('🏺', '500 / 1000 AP', e ? `${R.fmt(e.ap_500 || 0)} / ${R.fmt(e.ap_1000 || 0)}` : '–', 'Flaschen');
        R.$('profSpeedMinor').innerHTML = ''; R.$('profSpeedStamp').textContent = e?.ts ? `Stand: ${R.dateLabel(e.ts)}` : '';
      } else {
        const e = last('gems', x => x.gems != null);
        R.$('profSpeed').innerHTML = tile('💎', 'Gems gesamt', e ? R.fmt(e.gems) : '–', e ? '' : 'keine Daten')
          + tile('👛', 'Auf der Hand', e && e.gemsHand != null ? R.fmt(e.gemsHand) : '–', '') + tile('🎒', 'Im Rucksack', e && e.gemsBag != null ? R.fmt(e.gemsBag) : '–', '');
        R.$('profSpeedMinor').innerHTML = ''; R.$('profSpeedStamp').textContent = e?.ts ? `Stand: ${R.dateLabel(e.ts)}` : '';
      }
    } else {
    const main = [['universal', 'Universal'], ['training', 'Training'], ['healing', 'Heilung']];
    R.$('profSpeed').innerHTML = main.map(([k, label]) => {
      const c = R.SPEED.find(x => x.k === k), m = sp?.[k] || 0;
      return `<div class="rounded-xl bg-ink-950/60 border border-ink-700 p-4">
        <div class="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400"><span class="text-lg">${R.ico ? R.ico(c, 'w-5 h-5') : c.icon}</span>${label}</div>
        <div class="text-2xl font-extrabold text-white tabular-nums mt-1">${sp ? R.days(m) : '–'} <span class="text-sm font-semibold text-slate-400">Tage</span></div>
        <div class="text-xs text-slate-400">${sp ? R.durText(m) : 'keine Daten'}</div>
      </div>`;
    }).join('');
    R.$('profSpeedMinor').innerHTML = sp ? ['research', 'building'].map(k => { const c = R.SPEED.find(x => x.k === k); return `<span>${R.ico ? R.ico(c, 'w-5 h-5') : c.icon} ${c.label}: <b class="text-slate-200">${R.durText(sp[k] || 0)}</b></span>`; }).join('') : '';
    R.$('profSpeedStamp').textContent = spTs ? `Stand: ${R.dateLabel(spTs)}` : '';
    }

    // ---- Bearbeiten ----
    R.$('profScanSpeed').classList.toggle('hidden', !own || pm !== 'speed');
    if (!own) closeProfEdit();
    if (own) {
      profGov = gov ? { ...gov } : null;
      // Statthalter-Werte vorbelegen (nicht überschreiben, während man tippt)
      R.$('profEditModal').querySelectorAll('[data-gov]').forEach(i => {
        if (i.dataset.dirty || document.activeElement === i) return;
        const v = gov?.[i.dataset.gov]; i.value = v != null ? R.fmt(v) : '';
      });
      R.$('profTag').value = meta.alliance_tag || '';
      R.$('profKd').value = meta.kingdom || '';
      R.$('profAlly').value = meta.alliance_name || '';
      R.$('profGovId').value = meta.governor_id || '';
      let chosen = meta.avatar || '', skin = meta.city_skin || '', customAv = isImgAv(meta.avatar) ? meta.avatar : '';
      R.$('profAvatarFile').onchange = async (ev) => {
        const f = ev.target.files?.[0]; ev.target.value = '';
        if (!f || !f.type.startsWith('image/')) return;
        try {
          customAv = chosen = await cropSquare(f, 160, 1);            // mittig quadratisch, ganzer Bildausschnitt
          drawAv();
          R.$('profMsg').textContent = 'Profilbild bereit – „Profil speichern“ klicken.'; R.$('profMsg').className = 'text-sm text-slate-300';
        } catch { R.$('profMsg').textContent = 'Bild konnte nicht gelesen werden.'; R.$('profMsg').className = 'text-sm text-red-300'; }
      };
      const drawAv = () => {
        const own = isImgAv(chosen) ? chosen : (isImgAv(customAv) ? customAv : '');
        R.$('profAvatars').innerHTML =
          `<label for="profAvatarFile" title="Eigenes Bild hochladen" class="cursor-pointer w-9 h-9 rounded-xl grid place-items-center border border-dashed border-gold-500/60 bg-ink-950 text-lg hover:border-gold-400">📷</label>` +
          (own ? `<button data-av="custom" title="Eigenes Bild" class="rounded-xl ${chosen === own ? 'ring-2 ring-gold-400' : 'opacity-70 hover:opacity-100'}">${avatarHtml(row.username, own, 'w-9 h-9')}</button>` : '') +
          AVATARS.map(a => `<button data-av="${a}" title="${a ? a : 'Anfangsbuchstabe'}" class="rounded-xl ${a === chosen ? 'ring-2 ring-gold-400' : 'opacity-70 hover:opacity-100'}">${avatarHtml(row.username, a, 'w-9 h-9 text-base')}</button>`).join('');
        R.$('profAvatars').querySelectorAll('[data-av]').forEach(b => b.onclick = () => { chosen = b.dataset.av === 'custom' ? own : b.dataset.av; drawAv(); });
      };
      drawAv();
      // Hintergrundbild: sofort speichern (lokal + Rangliste, damit Freunde es sehen)
      const drawBg = () => { const b = ownProfBg(); R.$('profBgPrev').style.backgroundImage = b ? `url("${b}")` : ''; R.$('profBgLbl').textContent = b ? '⬆ Bild ändern' : '⬆ Bild hochladen'; R.$('profBgDel').classList.toggle('hidden', !b); };
      const putBg = async (img) => {
        R.LS.set(PROF_BG, img || '');
        drawBg();
        R.$('profHead').style.background = img ? `linear-gradient(180deg,rgba(7,9,15,.72),rgba(7,9,15,.9)),url("${img}") center/cover no-repeat` : '';
        try {
          const ok = await RokAuth.saveProfBg(img, R.vipNumbers().after);
          R.$('profMsg').textContent = ok ? (img ? '✓ Hintergrundbild gespeichert' : '✓ Hintergrundbild entfernt') : '✓ Lokal gespeichert · für andere erst sichtbar, wenn die Spalte prof_bg in Supabase angelegt ist';
          R.$('profMsg').className = 'text-sm ' + (ok ? 'text-emerald-400' : 'text-amber-300');
        } catch (x) { R.$('profMsg').textContent = x.message || String(x); R.$('profMsg').className = 'text-sm text-red-300'; }
      };
      R.$('profBgFile').onchange = async (ev) => {
        const f = ev.target.files?.[0]; ev.target.value = '';
        if (!f || !f.type.startsWith('image/')) return;
        try { await putBg(await shrinkBg(f)); } catch { R.$('profMsg').textContent = 'Bild konnte nicht gelesen werden.'; R.$('profMsg').className = 'text-sm text-red-300'; }
      };
      R.$('profBgDel').onclick = () => putBg('');
      drawBg();
      R.$('profSave').onclick = () => saveOwnProfile(() => chosen);
    }

    // ---- Diagramme ----
    // Privat: andere sehen nur den Kopf
    const hideBody = !own && P.isPrivate;
    R.$('profPrivNote').classList.toggle('hidden', !hideBody);
    R.$('profSpeedPanel').classList.toggle('hidden', !own);              // Speedups / AP / Gems: nur im eigenen Profil
    R.$('profChartsPanel').classList.toggle('hidden', !own);             // Verlauf: nur im eigenen Profil
    R.$('profShowcase').classList.toggle('hidden', hideBody);
    if (!hideBody) R.renderShowcase(own, row, { name: row.username, avatar: meta.avatar, tag: meta.alliance_tag || '', ally: meta.alliance_name || '', kd: meta.kingdom || '', vip: lvl, power: gov?.energy ?? null, kp: gov?.kill_points ?? null, merit: gov?.highest_merit ?? null });
    if (own) {
      const sw = R.$('profPrivate');
      sw.setAttribute('aria-checked', String(!!P.isPrivate));
      sw.onclick = async () => {
        const next = sw.getAttribute('aria-checked') !== 'true';
        sw.disabled = true;
        try {
          await RokAuth.setPrivate(next);
          sw.setAttribute('aria-checked', String(next));
          R.$('profMsg').textContent = next ? '🔒 Profil ist jetzt privat' : '🌐 Profil ist jetzt öffentlich'; R.$('profMsg').className = 'text-sm text-emerald-400';
          setModeBadge(true, next);
        } catch (e) { R.$('profMsg').textContent = e.message || String(e); R.$('profMsg').className = 'text-sm text-red-300'; }
        finally { sw.disabled = false; }
      };
    }
    if (!own) return;
    R.renderProfileCharts(entries, P);
  }

  const PROF_EXTRA = 'rok_scanner_prof_extra';
  const profExtra = () => { let x = {}; try { x = JSON.parse(R.LS.get(PROF_EXTRA, '{}')) || {}; } catch {} const om = RokAuth.ownMeta();
    return { kingdom: String(om.kingdom || x.kingdom || ''), alliance_name: String(om.alliance_name || x.alliance_name || '') }; };
  const saveProfExtra = (kingdom, alliance_name) => R.LS.set(PROF_EXTRA, JSON.stringify({ kingdom, alliance_name }));
  async function saveOwnProfile(getAvatar) {
    const msg = (t, ok) => { R.$('profMsg').textContent = t; R.$('profMsg').className = 'text-sm ' + (ok ? 'text-emerald-400' : 'text-red-300'); };
    R.$('profSave').disabled = true; msg('Speichere …', true);
    try {
      const gv = await saveManualGov(R.$('profGovId').value.replace(/\D/g, '').slice(0, 12));
      if (gv.bad) { msg('Bitte nur Zahlen eintragen, z. B. 85.141.754 oder 85,1M: ' + gv.bad, false); return; }
      // Allianz-Tag + Profilbild
      const meta = { alliance_tag: R.$('profTag').value.trim().toUpperCase().slice(0, 6), avatar: getAvatar(),
                     kingdom: R.$('profKd').value.replace(/\D/g, '').slice(0, 5), alliance_name: R.$('profAlly').value.trim().slice(0, 40) };
      const old = { ...RokAuth.ownMeta(), ...profExtra() };
      saveProfExtra(meta.kingdom, meta.alliance_name);
      if (meta.alliance_tag !== (old.alliance_tag || '') || meta.avatar !== (old.avatar || '') || meta.kingdom !== old.kingdom || meta.alliance_name !== old.alliance_name) {
        const r = await RokAuth.saveMeta(meta, R.vipNumbers().after); renderHeaderAvatar();
        if (r && !r.extraSaved) { msg('✓ Gespeichert · Königreich/Allianz-Name sind für andere erst nach dem SQL-Update sichtbar', true); R.$('profMsg').className = 'text-sm text-amber-300'; setTimeout(() => { if (R.view === 'profile') loadGameProfile(); }, 900); return; }
      }
      const gid = R.$('profGovId').value.replace(/\D/g, '').slice(0, 12);
      let warn = '';
      if (gid !== (old.governor_id || '')) { try { await RokAuth.saveGovId(gid); } catch (x) { warn = x.message; } }
      if (warn) { R.$('profMsg').textContent = '✓ Gespeichert · ' + warn; R.$('profMsg').className = 'text-sm text-amber-300'; return; }
      msg(gv.changed ? '✓ Gespeichert · Statthalter-Werte übernommen' : '✓ Gespeichert', true);
      setTimeout(() => { if (R.view === 'profile') { closeProfEdit(); loadGameProfile(); } }, 900);
    } catch (e) { msg(e.message || String(e), false); }
    finally { R.$('profSave').disabled = false; }
  }
  // Statthalter-Werte von Hand: geänderte Felder → neuer Statthalter-Eintrag (zählt wie ein Scan, inkl. Zuwachs)
  let profGov = null;                                        // angezeigte eigene Statthalter-Werte (Vergleich beim Speichern)
  const GOV_LABEL = { energy: 'Energie', kill_points: 'Kill-Punkte', highest_merit: 'Höchster Verdienst', deads: 'Deads', ark_wins: 'Truhe des Osiris', lk_autarch: 'Verlorenes Königreich', units_killed: 'Most Units Killed', units_lost: 'Most Units Lost', units_healed: 'Most Units Healed' };
  async function saveManualGov(gid) {
    const cur = {}, next = {}, bad = [];
    let changed = false;
    R.$('profEditModal').querySelectorAll('[data-gov]').forEach(i => {
      const k = i.dataset.gov, c = profGov ? profGov[k] ?? null : R.govLatest(k); cur[k] = c;
      const t = i.value.trim();
      if (!t) { next[k] = c; return; }
      const v = R.parseAmount(t);
      if (isNaN(v) || v < 0) { bad.push(GOV_LABEL[k]); i.classList.add('border-red-500'); return; }
      i.classList.remove('border-red-500');
      next[k] = v; if (v !== c) changed = true;
    });
    if (bad.length) return { bad: bad.join(', ') };
    if (!changed) return { changed: false };
    const e = { id: R.newId(), ts: Date.now(), type: 'governor', ...next, governor_id: gid ? +gid : null, confidence: 'manuell', src: 'manual' };
    R.addHistory(e);
    await RokAuth.saveNow('governor');
    await RokAuth.pushGov(next, true);
    R.$('profEditModal').querySelectorAll('[data-gov]').forEach(i => { delete i.dataset.dirty; });
    return { changed: true };
  }
  // Statthalter-Profil (Kill-Punkte, Höchster Verdienst, Energie) direkt aus dem Profil scannen
  // Statthalter-Profil: Server-Scan (KI) + Texterkennung im Browser als Ergänzung für ID, Allianz-Tag und Werte
  const govBig = (v) => { if (v == null || v === '') return null; if (typeof v === 'number') return isFinite(v) ? Math.round(v) : null; const d = String(v).replace(/[^\d]/g, ''); return d ? +d : null; };
  const govTag = (v) => {                                     // "[S79]Saints of 79" → "S79" · "S79" → "S79"
    const t = String(v ?? '').trim(); if (!t) return '';
    const m = t.match(/\[\s*([A-Za-z0-9]{1,6})\s*\]/); if (m) return m[1].toUpperCase();
    return /^[A-Za-z0-9]{1,6}$/.test(t) ? t.toUpperCase() : '';
  };
  // Bild für die Texterkennung vorbereiten: 2× vergrößert, nur helle/weiße Schrift bleibt (schwarz auf weiß) – der bunte Hintergrund verschwindet
  function govPrep(dataUrl) {
    return new Promise((resolve, reject) => {
      const im = new Image(); im.onerror = reject;
      im.onload = () => {
        const k = Math.min(2, 2400 / Math.max(im.width, im.height)), c = document.createElement('canvas');
        c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        const ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(im, 0, 0, c.width, c.height);
        const px = ctx.getImageData(0, 0, c.width, c.height), d = px.data;
        for (let i = 0; i < d.length; i += 4) {
          const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
          const v = mn > 175 && mx - mn < 60 ? 0 : 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
        }
        ctx.putImageData(px, 0, 0); resolve(c.toDataURL('image/png'));
      };
      im.src = dataUrl;
    });
  }
  // Statthalter-Werte aus Wort-Positionen (Texterkennung): funktioniert für das eigene Profil (Werte untereinander:
  // Energie, Kill-Punkte, Verdienst, Höchster Verdienst) und für fremde Profile (Werte unter der Beschriftung in Spalten)
  function govParseWords(words) {
    const W = (words || []).map(w => ({ t: String(w.text || '').trim(), x0: +w.bbox?.x0, x1: +w.bbox?.x1, y0: +w.bbox?.y0, y1: +w.bbox?.y1 }))
      .filter(w => w.t && isFinite(w.x0) && isFinite(w.y0));
    W.forEach(w => { w.cx = (w.x0 + w.x1) / 2; w.cy = (w.y0 + w.y1) / 2; w.h = Math.max(1, w.y1 - w.y0); });
    const out = {};
    const sameRow = (a, b) => Math.abs(a.cy - b.cy) < Math.max(a.h, b.h) * 0.7;
    const digit = (t) => +String(t).replace(/[OoDQ]/g, '0').replace(/[^\d]/g, '');
    const leftOf = (lab, re) => W.filter(w => w !== lab && sameRow(w, lab) && w.x1 <= lab.x0 + lab.h && w.x1 > lab.x0 - lab.h * 4 && re.test(w.t)).sort((a, b) => b.x1 - a.x1)[0];
    // Abzeichen: „9 Wins“ / „9 Siege“ · „4x Autarch“
    const win = W.find(w => /^(Wins?|Siege?|Victor(y|ies))$/i.test(w.t));
    if (win) { const n = leftOf(win, /^[0-9OoDQ]{1,4}$/); if (n) out.ark_wins = digit(n.t); }
    const aut = W.find(w => /Autar|Alleinherr/i.test(w.t));
    if (aut) {
      const inl = aut.t.match(/^([0-9OoDQ]{1,4})\s*[x×X]/);
      const n = inl ? null : leftOf(aut, /^[0-9OoDQ]{1,4}\s*[x×X]?$/);
      if (inl) out.lk_autarch = digit(inl[1]); else if (n) out.lk_autarch = digit(n.t.replace(/[x×X]/g, ''));
    }
    // Werte: Zahlen mit Tausenderpunkt (keine AP-Leiste „1,001/1,700“) + einzelne Nullen in derselben Spalte
    const isBig = (t) => /^\(?\d{1,3}(?:[.,]\d{3})+\)?$/.test(t);
    const bigs = W.filter(w => isBig(w.t) && !w.t.includes('/'));
    if (!bigs.length) return out;
    const yMax = Math.max(...bigs.map(b => b.y1)), hAvg = bigs.reduce((a, b) => a + b.h, 0) / bigs.length;
    const zeros = W.filter(w => /^[0O]$/.test(w.t) && w.y0 < yMax + hAvg * 2 && bigs.some(b => Math.abs(b.x0 - w.x0) < hAvg * 3 || Math.abs(b.x1 - w.x1) < hAvg * 3));
    const nums = [...bigs, ...zeros].map(w => ({ ...w, v: isBig(w.t) ? +w.t.replace(/[^\d]/g, '') : 0 }));
    const rows = [];
    nums.sort((a, b) => a.cy - b.cy).forEach(n => { const r = rows.find(r => sameRow(r[0], n)); r ? r.push(n) : rows.push([n]); });
    rows.forEach(r => r.sort((a, b) => a.cx - b.cx));
    const wide = rows.find(r => r.filter(n => n.v > 0).length >= 2);
    if (wide) {                                                   // fremdes Profil: [Kill-Punkte, Energie] darüber, [Verdienst, Höchster Verdienst] darunter
      const r1 = wide.filter(n => n.v > 0), kp = r1[0], pw = r1[r1.length - 1];
      out.kill_points = kp.v; out.energy = pw.v;
      const below = rows.filter(r => r[0].cy > kp.cy + kp.h * 0.7).flat();
      const hm = below.filter(n => Math.abs(n.cx - pw.cx) < Math.abs(n.cx - kp.cx)).sort((a, b) => a.cy - b.cy)[0];
      if (hm && hm.v > 0) out.highest_merit = hm.v;
      const ac = below.filter(n => Math.abs(n.cx - kp.cx) <= Math.abs(n.cx - pw.cx)).sort((a, b) => a.cy - b.cy)[0];
      if (ac) out.acclaim = ac.v;                                   // aktueller Verdienst (oft 0)
    } else {                                                      // eigenes Profil: untereinander
      const col = rows.map(r => r[r.length - 1]).filter(n => n.v > 0);
      if (col[0]) out.energy = col[0].v;
      if (col[1]) out.kill_points = col[1].v;
      if (col.length >= 3) out.highest_merit = col[col.length - 1].v;
      if (col.length >= 4) out.acclaim = col[2].v; else if (col.length === 3) out.acclaim = 0;   // Verdienst steht zwischen Kill-Punkten und Höchstem Verdienst
    }
    return out;
  }
  async function govOcr(dataUrl) {
    const T = await R.loadTesseract();
    const { data } = await T.recognize(await govPrep(dataUrl), 'eng');
    const text = String(data?.text || ''), lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
    const out = { id: (text.match(/I\s*D\s*[:：.;]?\s*(\d{6,12})/i) || [])[1] || '' };
    // Bild „Most Units“ (Times Named Autarch · Times Participated · Most Units Killed/Lost/Healed) – eigener Bildtyp
    if (/Most\s*Units|Times\s*(Named|Participated)|Meiste\s+\S+\s+Einheiten|Teilnahmen/i.test(text)) {
      const BIG = /(\d{1,3}(?:[.,]\d{3})+|\d+)/g, nums = (l) => (l.match(BIG) || []).map(govBig);
      const lab = (re) => { const l = lines.find(x => re.test(x)); const m = l && nums(l); return m && m.length ? m[m.length - 1] : null; };
      out.lkStats = true;
      out.units_lost = lab(/Lost|verloren/i); out.units_healed = lab(/Heal|geheilt/i);
      const hi = lines.findIndex(l => /Autarch|Alleinherr|Participated|Teilnahm/i.test(l));
      const row = hi >= 0 ? [lines[hi], lines[hi + 1] || ''].map(nums).find(a => a.length >= 2) || [] : [];
      if (row.length >= 3) { out.lk_autarch = row[0]; out.lk_participated = row[1]; }
      const big = row.filter(v => v >= 1000); if (big.length) out.units_killed = Math.max(...big);   // Most Units Killed = große Zahl in der Kachel-Reihe
      if (out.units_killed == null) out.units_killed = lab(/Killed|get.tet/i);
      return out;
    }
    // Allianz-Tag = Text in [ ] (Zeile "Bündnis" bevorzugt) · „$“ wird oft statt „S“ erkannt
    const allianceLine = lines.find(l => /B.?ndnis|Bundnis|Alliance|Allianz/i.test(l) && /[\[(|{]/.test(l)) || '';
    const tm = (allianceLine || text).match(/[\[(|{]\s*([A-Za-z0-9$]{1,6})\s*[\])|}]/);
    out.tag = tm && !/^ID$/i.test(tm[1]) ? tm[1].replace(/\$/g, 'S').toUpperCase() : '';
    const tagLine = lines.find(l => /\[\s*[A-Za-z0-9$]{1,6}\s*\]/.test(l)) || '';
    out.ally = tagLine.replace(/^.*?\]\s*/, '').replace(/[^\p{L}\p{N} .'&-]/gu, '').trim().slice(0, 40);
    // Werte: zuerst über die Beschriftung, sonst in fester Reihenfolge unter dem Bündnis (Energie, Kill-Punkte, …, Höchster Verdienst)
    const NUM = /(\d{1,3}(?:[.,]\d{3})+)/g;
    const byLabel = (re) => { const l = lines.find(x => re.test(x)); const m = l && l.match(NUM); return m ? govBig(m[m.length - 1]) : null; };
    out.energy = byLabel(/Energie|Power/i);
    out.kill_points = byLabel(/Kill/i);
    out.highest_merit = byLabel(/H.?chster|Hochster|Highest/i);
    const start = Math.max(0, lines.findIndex(l => /\[\s*[A-Za-z0-9]{1,6}\s*\]/.test(l)));
    const seq = lines.slice(start + 1).map(l => (l.match(NUM) || []).pop()).filter(Boolean).map(govBig);
    if (out.energy == null && seq[0] != null) out.energy = seq[0];
    if (out.kill_points == null && seq[1] != null) out.kill_points = seq[1];
    if (out.highest_merit == null && seq.length >= 3) out.highest_merit = seq[seq.length - 1];
    // Positionen der Wörter (zuverlässiger als die Zeilen-Reihenfolge) – überschreiben die Schätzung oben
    const words = data?.words?.length ? data.words : (data?.blocks || []).flatMap(b => (b.paragraphs || []).flatMap(p => (p.lines || []).flatMap(l => l.words || [])));
    const pos = govParseWords(words);
    out.layout = pos.energy != null && pos.kill_points != null && pos.highest_merit != null;   // alle drei Werte sicher zugeordnet
    Object.entries(pos).forEach(([k, v]) => { if (v != null) out[k] = v; });
    return out;
  }
  R.$('profGovFile').onchange = async (ev) => {
    const f = ev.target.files?.[0]; ev.target.value = '';
    if (!f || !f.type.startsWith('image/')) return;
    const msg = (t, cls) => { R.$('profMsg').textContent = t; R.$('profMsg').className = 'text-sm ' + cls; };
    msg('Lese Statthalter-Profil …', 'text-slate-300');
    let img = null;
    try {
      img = await R.prepareImage(f);
      let r = {}, raw = '', serverErr = '';
      try {
        const res = await fetch('/api/scan', { method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ mode: 'governor', images: [{ media_type: img.mediaType, data: img.base64 }] }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(res.status === 400 && /modus/i.test(data?.error || '') ? 'Der Scan-Server kennt den Statthalter-Scan noch nicht – bitte die neue api/scan.js einspielen.' : (data?.error || `Serverfehler ${res.status}`));
        raw = String(data.text || ''); r = R.parseJson(raw) || {};
      } catch (x) { serverErr = x.message === 'Failed to fetch' ? 'Netzwerkfehler – keine Verbindung zum Scan-Server.' : x.message; }
      const e = { kill_points: govBig(r.kill_points ?? r.killpoints), highest_merit: govBig(r.highest_merit ?? r.highest_acclaim ?? r.highestMerit), energy: govBig(r.energy ?? r.power),
                  deads: govBig(r.deads ?? r.dead), ark_wins: govBig(r.ark_wins ?? r.ark), lk_autarch: govBig(r.lk_autarch ?? r.autarch),
                  units_killed: govBig(r.units_killed), units_lost: govBig(r.units_lost), units_healed: govBig(r.units_healed), acclaim: govBig(r.acclaim ?? r.current_acclaim),
                  lk_participated: govBig(r.lk_participated ?? r.times_participated) };
      // Bild „Most Units“ (Lost-Kingdom-Statistik): nur Autarch, Teilnahmen und Most Units – nie Kill-Punkte/Macht/Verdienst
      let lkStats = r.view === 'lk_stats';
      const GK = ['kill_points', 'highest_merit', 'acclaim', 'energy', 'deads', 'ark_wins', 'lk_autarch', 'lk_participated', 'units_killed', 'units_lost', 'units_healed'], hasVal = () => GK.some(k => e[k] != null);
      const LK_ONLY = ['lk_autarch', 'lk_participated', 'units_killed', 'units_lost', 'units_healed'];
      let gid = String(r.governor_id ?? r.governorId ?? r.id ?? '').replace(/\D/g, '').slice(0, 12);
      if (!gid) { const m = raw.match(/ID\s*[:：]?\s*(\d{5,12})/i); if (m) gid = m[1]; }
      let ally = String(r.alliance_name ?? r.allianceName ?? (String(r.alliance ?? '').includes(']') ? String(r.alliance).replace(/^\s*\[[^\]]*\]\s*/, '') : '')).trim().slice(0, 40);
      let tag = govTag(r.alliance_tag ?? r.allianceTag ?? r.tag) || govTag(r.alliance ?? r.alliance_name ?? r.buendnis) || govTag((raw.match(/\[\s*[A-Za-z0-9]{1,6}\s*\]/) || [])[0]);
      // Zur Kontrolle immer auch die Texterkennung im Browser (Bild bleibt dabei auf dem Gerät)
      let diff = [];
      msg('Prüfe Werte …', 'text-slate-300');
      try {
        const o = await govOcr(img.dataUrl);
        if (o.lkStats) lkStats = true;
        if (lkStats) GK.filter(k => !LK_ONLY.includes(k)).forEach(k => { o[k] = null; e[k] = null; });
        if (!gid && o.id) gid = o.id.slice(0, 12);
        if (!tag && o.tag) tag = o.tag;
        if (!ally && o.ally) ally = o.ally;
        GK.forEach(k => {
          if (o[k] == null) return;
          if (e[k] == null) { e[k] = o[k]; return; }
          // Werte sicher zugeordnet (alle drei gefunden) und anders als die KI → Texterkennung gewinnt, Feld zum Prüfen markieren
          if (o.layout && +o[k] !== +e[k] && ['kill_points', 'highest_merit', 'energy'].includes(k)) { diff.push(k); e[k] = o[k]; }
        });
      } catch (x) { console.warn('Texterkennung (Statthalter) fehlgeschlagen', x); }
      if (lkStats) GK.filter(k => !LK_ONLY.includes(k)).forEach(k => { e[k] = null; });
      if (!hasVal() && !gid && !tag) throw new Error(serverErr || 'Keine Werte im Screenshot erkannt.');
      // Anderer Statthalter als im Profil gespeichert? (z. B. Screenshot eines Farm-Accounts)
      const savedGid = String(RokAuth.ownMeta().governor_id || R.$('profGovId').value || '').replace(/\D/g, '');
      if (gid && savedGid && gid !== savedGid && !confirm(`Der Screenshot zeigt die ID ${gid}, in deinem Profil steht die ID ${savedGid}.\n\nWerte trotzdem übernehmen?`)) {
        msg('Abgebrochen – nichts übernommen.', 'text-amber-300'); return;
      }
      let gidErr = '';
      if (gid) { R.$('profGovId').value = gid; if (gid !== (RokAuth.ownMeta().governor_id || '')) { try { await RokAuth.saveGovId(gid); } catch (x) { gidErr += ' · ' + x.message; } } }
      if (tag || ally) {
        const om = { ...RokAuth.ownMeta(), ...profExtra() };
        if (tag) R.$('profTag').value = tag;
        if (ally) R.$('profAlly').value = ally;
        if ((tag && tag !== (om.alliance_tag || '')) || (ally && ally !== om.alliance_name)) {
          saveProfExtra(om.kingdom, ally || om.alliance_name);
          try { await RokAuth.saveMeta({ alliance_tag: tag || om.alliance_tag || '', avatar: om.avatar || '', kingdom: om.kingdom, alliance_name: ally || om.alliance_name }, R.vipNumbers().after); } catch (x) { gidErr += ' · ' + x.message; }
        }
      }
      const found = [gid && `ID ${gid}`, tag && `[${tag}]`].filter(Boolean).join(' · ');
      if (hasVal() || gid) {
        R.addHistory({ id: R.newId(), ts: Date.now(), type: 'governor', ...e, governor_id: gid ? +gid : null, confidence: r.confidence || (serverErr ? 'OCR lokal' : null) });
      }
      const saved = await RokAuth.saveNow('governor');                 // ID steht so auch im Scan (falls Spalte governor_id fehlt)
      if (hasVal()) await RokAuth.pushGov(e, true);                    // Ranglisten + Zuwachs seit dem letzten Scan
      R.$('profEditModal').querySelectorAll('[data-gov]').forEach(i => { delete i.dataset.dirty; i.classList.toggle('border-amber-400', diff.includes(i.dataset.gov)); });
      msg((saved.where === 'scans' ? '✓ Statthalter-Profil gespeichert' : saved.where === 'user_state' ? '✓ Gespeichert (Profil-Speicher – SQL-Update für public.scans fehlt)' : '✓ Lokal gespeichert, Cloud folgt')
        + (found ? ` · ${found}` : '') + gidErr + (diff.length ? ' · ⚠ Bitte prüfen: ' + diff.map(k => GOV_LABEL[k]).join(', ') : ''), gidErr || diff.length ? 'text-amber-300' : 'text-emerald-400');
      loadGameProfile();
    } catch (e2) { msg(e2.message === 'Failed to fetch' ? 'Netzwerkfehler – keine Verbindung zum Scan-Server.' : e2.message, 'text-red-300'); }
    finally { if (img) { img.base64 = null; img.dataUrl = null; } }   // Bild sofort verwerfen
  };
};
