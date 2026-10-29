// Wiz fan Club – Showcases (Seite im Profil-Menü zwischen KvK und Language)
// Drei Bereiche: 1. Gear Showcase (der Showcase-Editor aus showcase.js) · 2. KvK Showcase (KvK-Bilanz-Bild) · 3. AoO Showcase (Ark-of-Osiris-Karte)
// Alles hier bearbeiten und ins Profil laden. Läuft innerhalb von RokApp (scanner.js); R = geteilter Kontext (window.Rok).
// Supabase: leaderboard.kvk_card (text) · leaderboard.aoo_card (jsonb)
window.RokMods = window.RokMods || {};
window.RokMods.showcases = (R) => {
  const $ = R.$, esc = R.esc, A = window.RokAuth, root = $('showcasesView');
  const AOO_ROLES = ['Rally-Lead', 'Garnison', 'Feld / Open Field', 'Flanke & Support', 'Fresh / Fresh-Lead', 'Scout'];
  const AOO_BG = { nile: 'linear-gradient(135deg,#0b2a4a,#0c1019 60%,#3a2706)', gold: 'linear-gradient(135deg,#5a3d08,#0c1019 65%)', jade: 'linear-gradient(135deg,#0d3b2e,#0c1019 65%)', blood: 'linear-gradient(135deg,#5a0f15,#0c1019 65%)', night: 'linear-gradient(135deg,#1e1b4b,#0c1019 65%)' };
  const st = { tab: 'gear', aoo: null, msg: ['', ''], busy: false };
  let placeholder = null;   // Platz von #profShowcase im Profil (wird hierher verschoben und zurückgelegt)

  // ---------- Gear Showcase: Editor hierher holen / zurücklegen ----------
  function takeShowcase() {
    const sh = $('profShowcase'), host = $('scsGearHost'); if (!sh || !host || sh.parentElement === host) return;
    if (!placeholder) { placeholder = document.createComment('profShowcase'); sh.parentElement.insertBefore(placeholder, sh); }
    host.appendChild(sh); sh.classList.remove('hidden');
    const meta = A.ownMeta() || {}, g = A.govNow ? A.govNow() : {};
    R.renderShowcase(true, null, { name: R.PROFILE.name, avatar: meta.avatar, tag: meta.alliance_tag || '', ally: meta.alliance_name || '', kd: meta.kingdom || '', vip: null, power: g.energy ?? null, kp: g.kill_points ?? null, merit: null });
  }
  function giveBack() {
    const sh = $('profShowcase'); if (!sh || !placeholder || !placeholder.parentElement) return;
    if (sh.parentElement !== placeholder.parentElement) { placeholder.parentElement.insertBefore(sh, placeholder); }
  }
  document.addEventListener('rok:view', (ev) => { if (ev.detail !== 'showcases') giveBack(); });

  // ---------- AoO Showcase ----------
  const aooDefault = () => ({ wins: ((A.govNow && A.govNow().ark_wins) ?? (A.ownMeta() || {}).ark_wins) ?? null, mvp: null, role: '', cmds: [], motto: '', bg: 'nile' });
  const aooCur = () => st.aoo || (st.aoo = { ...aooDefault(), ...((A.ownMeta() || {}).aoo_card || {}) });
  const cmdOpt = (sel) => `<option value="">–</option>${R.COMMANDERS.filter((c) => c.r === 'legendary').map((c) => `<option value="${c.id}" ${sel === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}`;
  R.aooCardHTML = (c, big) => {   // auch im Profil und im Feed genutzt
    if (!c) return '';
    const cmds = (c.cmds || []).filter(Boolean).map((id) => { const m = R.COMMANDERS.find((x) => x.id === id); return m ? `<span class="inline-flex items-center gap-1.5 rounded-lg bg-ink-950/60 border border-sky-400/30 px-2 py-1"><img src="${R.cmdImg(id, true)}" alt="" class="w-7 h-7 rounded-full object-cover"><span class="text-xs">${esc(m.name)}</span></span>` : ''; }).join('');
    return `<div class="relative overflow-hidden rounded-2xl border border-sky-400/40 p-4 sm:p-5 text-slate-100" style="background:${AOO_BG[c.bg] || AOO_BG.nile}">
      <div class="flex items-start justify-between gap-3">
        <div><div class="text-[10px] uppercase tracking-[.3em] text-sky-300">Ark of Osiris</div><div class="font-display ${big ? 'text-2xl' : 'text-xl'} gold-text">🏛️ AoO Showcase</div></div>
        <div class="text-right"><div class="text-[10px] uppercase tracking-widest text-slate-400">Siege</div><div class="font-display text-3xl text-gold-300 tabular-nums">${c.wins != null ? R.fmt(+c.wins) : '–'}</div></div>
      </div>
      <div class="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
        ${c.mvp != null && c.mvp !== '' ? `<span>⭐ <b class="tabular-nums">${R.fmt(+c.mvp)}</b> × MVP</span>` : ''}
        ${c.role ? `<span>🎯 ${esc(c.role)}</span>` : ''}
      </div>
      ${cmds ? `<div class="mt-3 flex flex-wrap gap-1.5">${cmds}</div>` : ''}
      ${c.motto ? `<div class="mt-3 text-sm italic text-slate-200">„${esc(c.motto)}“</div>` : ''}
      <div class="mt-3 text-[10px] text-slate-500">⚔️ Wiz fan Club</div>
    </div>`;
  };
  async function saveAoo(remove) {
    if (st.busy) return; st.busy = true; msg(remove ? 'Wird entfernt …' : 'Wird gespeichert …', 'busy');
    try {
      const c = remove ? null : aooCur();
      const ok = await A.saveAooCard(c);
      msg(ok ? (remove ? '✓ Aus dem Profil entfernt' : '✓ Im Profil gespeichert') : 'Lokal gespeichert · für andere erst sichtbar, wenn die Spalte aoo_card in Supabase angelegt ist', ok ? 'ok' : 'warn');
      if (remove) st.aoo = { ...aooDefault() };
    } catch (e) { msg('Speichern fehlgeschlagen: ' + (e.message || e), 'err'); }
    st.busy = false; render();
  }

  // ---------- Darstellung ----------
  const tabBtn = (k, lab) => `<button type="button" data-scs-tab="${k}" aria-pressed="${st.tab === k}" class="seg-btn rounded-lg px-4 py-2 text-sm font-semibold border border-ink-600 transition">${lab}</button>`;
  const inp = 'w-full bg-ink-950 border border-ink-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-gold-500';
  function kvkSection() {
    const img = (A.ownMeta() || {}).kvk_card;
    return `<div class="panel rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div><h3 class="font-display text-lg gold-text">🏁 KvK Showcase</h3><p class="text-xs text-slate-500">Dein KvK-Bilanz-Bild – wird im Profil zwischen Countdown und Showcase gezeigt</p></div>
        <div class="flex flex-wrap gap-2">
          <button type="button" data-scs-kvk-edit class="text-xs px-3 py-1.5 rounded-lg border border-gold-500/50 text-gold-300 hover:bg-gold-500/10">✎ Bearbeiten (KvK → Stats → Bild)</button>
          ${img ? `<button type="button" data-scs-kvk-feed class="text-xs px-3 py-1.5 rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300">📰 Im Feed posten</button>
          <button type="button" data-scs-kvk-del class="text-xs px-3 py-1.5 rounded-lg border border-ink-600 text-slate-400 hover:border-red-400/60 hover:text-red-300">✕ Aus Profil entfernen</button>` : ''}
        </div></div>
      ${img ? `<img src="${esc(img)}" alt="KvK-Bilanz" class="w-full rounded-xl border border-gold-500/30">` : `<p class="text-sm text-slate-400 rounded-xl border border-dashed border-ink-600 p-6 text-center">Noch kein Bild. Im KvK-Bereich unter <b>Stats → Bild für dein Profil</b> gestalten und mit „Im Profil zeigen“ speichern.</p>`}
    </div>`;
  }
  function aooSection() {
    const c = aooCur(), saved = !!(A.ownMeta() || {}).aoo_card;
    return `<div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start">
      <div class="panel rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
        <div><h3 class="font-display text-lg gold-text">🏛️ AoO Showcase bearbeiten</h3><p class="text-xs text-slate-500">Ark of Osiris – Siege, Rolle, Lieblings-Kommandanten und Motto</p></div>
        <div class="grid grid-cols-2 gap-3">
          <label class="text-xs text-slate-400">🏆 Siege<input type="number" min="0" data-aoo="wins" value="${c.wins ?? ''}" class="mt-1 ${inp} text-right tabular-nums"></label>
          <label class="text-xs text-slate-400">⭐ MVP (Anzahl)<input type="number" min="0" data-aoo="mvp" value="${c.mvp ?? ''}" class="mt-1 ${inp} text-right tabular-nums"></label>
          <label class="text-xs text-slate-400 col-span-2">🎯 Rolle<select data-aoo="role" class="mt-1 ${inp}"><option value="">–</option>${AOO_ROLES.map((r) => `<option ${c.role === r ? 'selected' : ''}>${r}</option>`).join('')}</select></label>
          <label class="text-xs text-slate-400">Kommandant 1<select data-aoo="cmd0" class="mt-1 ${inp}">${cmdOpt((c.cmds || [])[0])}</select></label>
          <label class="text-xs text-slate-400">Kommandant 2<select data-aoo="cmd1" class="mt-1 ${inp}">${cmdOpt((c.cmds || [])[1])}</select></label>
          <label class="text-xs text-slate-400 col-span-2">💬 Motto<input type="text" maxlength="80" data-aoo="motto" value="${esc(c.motto || '')}" placeholder="z. B. Erst die Ark, dann der Rest" class="mt-1 ${inp}"></label>
          <div class="col-span-2 text-xs text-slate-400">🖼️ Hintergrund<div class="mt-1 flex flex-wrap gap-1.5">${Object.keys(AOO_BG).map((k) => `<button type="button" data-aoo-bg="${k}" aria-pressed="${c.bg === k}" class="w-12 h-8 rounded-lg border-2 ${c.bg === k ? 'border-gold-400' : 'border-ink-600'}" style="background:${AOO_BG[k]}" title="${k}"></button>`).join('')}</div></div>
        </div>
        <div class="flex flex-wrap gap-2 pt-2 border-t border-ink-700">
          <button type="button" data-aoo-save ${st.busy ? 'disabled' : ''} class="px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-ink-950 font-semibold text-sm disabled:opacity-50">👤 Im Profil speichern</button>
          ${saved ? `<button type="button" data-aoo-feed class="text-xs px-3 py-2 rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300">📰 Im Feed posten</button>
          <button type="button" data-aoo-del class="text-xs px-3 py-2 rounded-lg border border-ink-600 text-slate-400 hover:border-red-400/60 hover:text-red-300">✕ Aus Profil entfernen</button>` : ''}
        </div>
        <div id="scsMsg" class="text-xs min-h-[1em]"></div>
      </div>
      <div id="scsAooPreview"><div class="text-[10px] uppercase tracking-widest text-slate-500 mb-2">👁 Vorschau</div>${R.aooCardHTML(c, true)}</div>
    </div>`;
  }
  // ---------- 🧍 Charakter Showcase: jedes Set als Bild mit Charakter, Hintergrund und Runensäulen ----------
  function charSection() {
    const list = R.scProfSets ? R.scProfSets().filter((p) => (R.GEAR_SLOTS || []).some((sl) => p.gear?.[sl.k]?.item)) : [];
    if (!R.charBoardHTML) return '<p class="panel rounded-2xl p-6 text-sm text-slate-500 text-center">Der Craft-Bereich ist noch nicht geladen.</p>';
    if (!list.length) return '<p class="panel rounded-2xl p-6 text-sm text-slate-500 text-center">Noch keine Sets mit Ausrüstung – zuerst im ⚔️ Gear Showcase Ausrüstung eintragen.</p>';
    const fi = 'w-full bg-ink-950 border border-ink-600 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-gold-500';
    const AT = { flag: '🚩', emblem: '🛡', scroll: '📜', instrument: '📯' };
    return `<p class="text-xs text-slate-500">Jedes Set aus deinem Gear Showcase als Charakter-Bild. Armaments (Runensäulen) trägst du im ⚔️ Gear Showcase unter „Rüstung“ ein.</p>
      <div class="grid gap-5 md:grid-cols-2">${list.map((p) => { const id = esc(p.scId + '|' + p.setId), parts = Object.keys(AT).filter((k) => p.arm?.arms?.[k]);
        return `<section class="panel rounded-2xl p-4 flex flex-col gap-3" data-scp="${id}">
          <div class="flex items-baseline justify-between gap-2"><div class="font-display text-xl gold-text truncate" translate="no">${esc(p.name)}</div><span class="text-[11px] text-slate-500 truncate">${esc(p.scTitle || '')}</span></div>
          <div class="relative mx-auto w-full max-w-[460px] aspect-square">${R.charBoardHTML(p.gear, R.scProfCtxOf(p))}</div>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <label class="text-slate-400">Charakter<select data-scp-f="char" class="${fi} mt-1"><option value="">🔄 automatisch</option>${(R.charList?.() || []).map((c) => `<option value="${esc(c.id)}"${p.prof.char === c.id ? ' selected' : ''}>🧍 ${esc(c.name)}</option>`).join('')}</select></label>
            <label class="text-slate-400">Hintergrund<select data-scp-f="bg" class="${fi} mt-1">${(R.charBgList?.() || []).map(([k, l]) => `<option value="${k}"${p.prof.bg === k ? ' selected' : ''}>${l}</option>`).join('')}</select></label></div>
          <div class="flex flex-wrap items-center gap-1.5 text-xs">
            <label class="inline-flex items-center gap-1.5 text-slate-300 cursor-pointer mr-auto"><input type="checkbox" data-scp-f="stones" ${p.prof.stones ? 'checked' : ''} class="w-4 h-4 accent-yellow-500">🪨 Runensäulen</label>
            ${parts.map((k) => `<button type="button" data-scp-flip="${k}" title="Säule neigen" class="px-2 py-1 rounded-md border ${p.prof.flip[k] ? 'border-gold-400 text-gold-200' : 'border-ink-600 text-slate-300'}">${AT[k]} ${p.prof.flip[k] < 0 ? '↖' : p.prof.flip[k] > 0 ? '↗' : '⬆'}</button>`).join('')}
            <button type="button" data-scp-feed class="px-3 py-1.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-ink-950 font-semibold">📰 Im Feed posten</button></div>
        </section>`; }).join('')}</div>`;
  }
  const scpOf = (el) => { const box = el.closest('[data-scp]'); if (!box) return null; const [scId, setId] = box.dataset.scp.split('|'); return (R.scProfSets?.() || []).find((p) => p.scId === scId && p.setId === setId) || null; };
  root.addEventListener('change', async (ev) => { const t = ev.target, f = t.dataset?.scpF; if (!f) return; const p = scpOf(t); if (!p) return;
    await R.scProfPut(p.scId, p.setId, { [f]: f === 'stones' ? t.checked : t.value }); render(); });
  root.addEventListener('click', async (ev) => {
    const fb = ev.target.closest('[data-scp-flip]'); if (fb) { const p = scpOf(fb); if (!p) return; const k = fb.dataset.scpFlip, v = p.prof.flip[k] || 0;
      await R.scProfPut(p.scId, p.setId, { flip: { [k]: v === 0 ? -8 : v === -8 ? 8 : 0 } }); render(); return; }
    const pb = ev.target.closest('[data-scp-feed]'); if (!pb) return; const p = scpOf(pb); if (!p) return;
    if (!R.feedShareSet) { msg('Der Feed ist noch nicht geladen – bitte Seite neu laden.', 'warn'); return; }
    const note = await window.UI.prompt(`„${p.name}“ als Charakter-Bild im Feed posten.\n\nText dazu (optional):`, '', { title: '📰 Im Feed posten', ok: 'Posten' }); if (note === null) return;
    const gear = Object.fromEntries((R.GEAR_SLOTS || []).map((sl) => { const v = p.gear?.[sl.k], it = R.gItem?.(v?.item); return [sl.k, v?.item ? { item: v.item, name: it?.name || '', icon: it?.icon || '', rarity: it?.rarity || v.rarity, tier: v.tier || 0, refine: v.refine || 0, refType: v.refType } : null]; }));
    const ctx = R.scProfCtxOf(p);
    try { await R.feedShareSet({ name: p.name, gear, char: p.prof.char || R.charOf?.(gear, { name: p.name })?.id || '', bg: ctx.bg, arm: ctx.arm, note: note.trim() }); msg('✓ Im Feed gepostet', 'ok'); }
    catch (e) { msg('Posten fehlgeschlagen: ' + (e.message || e), 'err'); }
  });
  function msg(t, tone) { st.msg = [t, tone]; const el = $('scsMsg'); if (!el) return; el.textContent = t; el.className = 'text-xs min-h-[1em] ' + ({ ok: 'text-emerald-400', warn: 'text-amber-300', err: 'text-red-300', busy: 'text-slate-300' }[tone] || 'text-slate-500'); }
  function render() {
    if (!root) return;
    giveBack();
    root.innerHTML = `
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div><h2 class="font-display text-2xl gold-text">🎨 Showcases</h2><p class="text-xs text-slate-500">Gear, KvK und Ark of Osiris – hier bearbeiten und ins Profil laden</p></div>
        <button type="button" id="scsBack" class="text-xs px-3 py-1.5 rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300">← Zurück</button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-xl bg-ink-950 border border-ink-700" role="tablist">${tabBtn('gear', '⚔️ Gear Showcase')}${tabBtn('char', '🧍 Charakter Showcase')}${tabBtn('kvk', '🏁 KvK Showcase')}${tabBtn('aoo', '🏛️ AoO Showcase')}</div>
      ${st.tab === 'char' ? charSection() : ''}
      ${st.tab === 'gear' ? `<div class="flex flex-col gap-3"><p class="text-xs text-slate-500">Dein Showcase-Editor – alles, was du hier änderst, steht so auch in deinem Profil. Mit ✎ oben rechts öffnest du die Werkzeuge.</p><div id="scsGearHost"></div></div>` : ''}
      ${st.tab === 'kvk' ? kvkSection() : ''}
      ${st.tab === 'aoo' ? aooSection() : ''}`;
    if (st.tab === 'gear') takeShowcase();
    msg(st.msg[0], st.msg[1]);
  }
  root.addEventListener('click', (ev) => {
    const t = ev.target;
    const tb = t.closest('[data-scs-tab]'); if (tb) { st.tab = tb.dataset.scsTab; render(); return; }
    if (t.closest('#scsBack')) { R.goView('feed'); return; }
    if (t.closest('[data-scs-kvk-edit]')) { const K = window.KvKCalc; if (K) { const s = K.getState(); s.tab = 'end'; s.open.endImg = true; K.setState(s); } R.goView('kvk'); K?.render(); return; }
    if (t.closest('[data-scs-kvk-del]')) { A.saveKvkCard(null).then(() => { window.dispatchEvent(new CustomEvent('kvk:card')); msg('✓ Aus dem Profil entfernt', 'ok'); render(); }).catch((e) => msg(e.message || String(e), 'err')); return; }
    if (t.closest('[data-scs-kvk-feed]') || t.closest('[data-aoo-feed]')) { R.goView('feed'); setTimeout(() => document.querySelector(t.closest('[data-aoo-feed]') ? '[data-feed-attach="aoo"]' : '[data-feed-attach="kvk"]')?.click(), 300); return; }
    const bg = t.closest('[data-aoo-bg]'); if (bg) { aooCur().bg = bg.dataset.aooBg; render(); return; }
    if (t.closest('[data-aoo-save]')) { saveAoo(false); return; }
    if (t.closest('[data-aoo-del]')) { saveAoo(true); return; }
  });
  root.addEventListener('input', (ev) => {
    const el = ev.target, k = el.dataset && el.dataset.aoo; if (!k) return;
    const c = aooCur();
    if (k === 'cmd0' || k === 'cmd1') { c.cmds = c.cmds || []; c.cmds[+k.slice(3)] = el.value; }
    else if (k === 'wins' || k === 'mvp') c[k] = el.value === '' ? null : Math.max(0, Math.round(+el.value || 0));
    else c[k] = el.value;
    const box = $('scsAooPreview');   // Vorschau neu zeichnen
    if (box) box.innerHTML = `<div class="text-[10px] uppercase tracking-widest text-slate-500 mb-2">👁 Vorschau</div>${R.aooCardHTML(c, true)}`;
  });
  R.viewHooks.showcases = () => { st.aoo = null; render(); };
};
