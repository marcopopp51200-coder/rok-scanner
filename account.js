// ================= Konto-Einstellungen: Name & Passwort ändern =================
// Öffnet sich über das Benutzermenü (⚙️ Konto). Die Supabase-Aufrufe liegen in auth.js
// (RokAuth.accountInfo / changeName / changePassword).
window.RokAccount = (() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const errText = (e) => (window.RokAuth?.germanError ? RokAuth.germanError(e) : String(e?.message || e));
  const inputCls = 'mt-1 w-full bg-ink-950 border border-ink-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gold-500';
  let root = null, prevOverflow = '', nameDirty = false;

  function pwField(id, label, auto) {
    return `<label class="block text-xs text-slate-400">${label}
      <span class="relative block">
        <input id="${id}" type="password" autocomplete="${auto}" class="${inputCls} pr-11">
        <button type="button" data-eye="${id}" title="Passwort anzeigen" aria-label="Passwort anzeigen" class="absolute right-1.5 top-1/2 -translate-y-[40%] w-8 h-8 grid place-items-center rounded-md text-slate-400 hover:text-gold-300">👁</button>
      </span></label>`;
  }

  function html(info) {
    return `<div class="panel !bg-ink-900 w-full max-w-lg rounded-2xl shadow-2xl ui-pop max-h-[92vh] overflow-y-auto">
      <div class="flex items-center gap-3 px-6 pt-6">
        <div class="w-11 h-11 shrink-0 rounded-xl grid place-items-center text-xl bg-gold-500/15 border border-gold-500/40">⚙️</div>
        <div class="min-w-0 flex-1">
          <h3 class="font-display text-xl gold-text leading-tight">Konto</h3>
          <p class="text-xs text-slate-400">Name und Passwort ändern</p>
        </div>
        <button type="button" data-acc-close aria-label="Schließen" class="w-9 h-9 grid place-items-center rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300">✕</button>
      </div>

      <form id="accNameForm" class="mx-6 mt-5 rounded-xl border border-ink-700 bg-ink-950/50 p-4" novalidate>
        <h4 class="text-sm font-semibold text-slate-100">👤 Name</h4>
        <p class="mt-1 text-xs text-slate-400">So sehen dich andere Spieler in Rangliste, Feed und Profil.</p>
        <label class="mt-3 block text-xs text-slate-400">Neuer Name
          <input id="accName" type="text" maxlength="40" autocomplete="username" class="${inputCls}" value="${esc(info.name)}" translate="no">
        </label>
        <p class="mt-2 text-[11px] text-slate-500">${info.nameAccount
          ? '🔑 Du loggst dich mit deinem Namen ein – nach der Änderung mit dem <b class="text-slate-300">neuen Namen</b>.'
          : `🔑 Du loggst dich weiter mit <b class="text-slate-300" translate="no">${esc(info.login)}</b> ein.`}</p>
        <p id="accNameMsg" class="hidden mt-3 text-sm rounded-lg px-3 py-2"></p>
        <div class="mt-4 flex justify-end">
          <button type="submit" class="px-5 py-2.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-ink-950 font-semibold text-sm disabled:opacity-50">Name speichern</button>
        </div>
      </form>

      <form id="accPwForm" class="mx-6 mt-4 mb-6 rounded-xl border border-ink-700 bg-ink-950/50 p-4" novalidate>
        <h4 class="text-sm font-semibold text-slate-100">🔒 Passwort</h4>
        <input type="text" autocomplete="username" value="${esc(info.login)}" class="hidden" tabindex="-1" aria-hidden="true">
        <div class="mt-3 flex flex-col gap-3">
          ${pwField('accPwOld', 'Aktuelles Passwort', 'current-password')}
          ${pwField('accPwNew', 'Neues Passwort (mind. 6 Zeichen)', 'new-password')}
          ${pwField('accPwNew2', 'Neues Passwort wiederholen', 'new-password')}
        </div>
        <p id="accPwMsg" class="hidden mt-3 text-sm rounded-lg px-3 py-2"></p>
        <div class="mt-4 flex justify-end">
          <button type="submit" class="px-5 py-2.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-ink-950 font-semibold text-sm disabled:opacity-50">Passwort ändern</button>
        </div>
      </form>
    </div>`;
  }

  const $ = (id) => root?.querySelector('#' + id);
  function note(id, text, ok) {
    const el = $(id); if (!el) return;
    el.textContent = text || '';
    el.className = 'mt-3 text-sm rounded-lg px-3 py-2 ' + (ok ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-300' : 'bg-red-500/10 border border-red-500/40 text-red-300');
    el.classList.toggle('hidden', !text);
  }
  async function busy(form, fn) {
    const btn = form.querySelector('button[type=submit]'), label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Bitte warten …';
    try { await fn(); } finally { btn.disabled = false; btn.textContent = label; }
  }

  async function saveName(ev) {
    ev.preventDefault();
    note('accNameMsg', '');
    await busy(ev.target, async () => {
      try {
        const r = await RokAuth.changeName($('accName').value);
        if (!r.changed) return note('accNameMsg', 'Das ist schon dein Name.', true);
        nameDirty = true;
        const top = document.getElementById('userName'); if (top) top.textContent = RokAuth.current().name;
        let t = '✓ Name geändert.';
        if (r.loginChanged) t += ` Ab jetzt loggst du dich mit „${r.login}“ ein.`;
        else if (r.loginPending) t += ' Der Login-Name bleibt vorerst der alte (Supabase verlangt eine E-Mail-Bestätigung – „Confirm email“ ausschalten).';
        note('accNameMsg', t, true);
      } catch (e) { note('accNameMsg', errText(e)); }
    });
  }
  async function savePw(ev) {
    ev.preventDefault();
    note('accPwMsg', '');
    await busy(ev.target, async () => {
      try {
        await RokAuth.changePassword($('accPwOld').value, $('accPwNew').value, $('accPwNew2').value);
        ['accPwOld', 'accPwNew', 'accPwNew2'].forEach((id) => { $(id).value = ''; });
        note('accPwMsg', '✓ Passwort geändert. Beim nächsten Login gilt das neue Passwort.', true);
      } catch (e) {
        $('accPwOld').value = '';
        note('accPwMsg', errText(e));
      }
    });
  }

  function onKey(ev) { if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); close(); } }
  function close() {
    if (!root) return;
    document.removeEventListener('keydown', onKey, true);
    root.remove(); root = null; document.body.style.overflow = prevOverflow;
    if (nameDirty) {                                             // überall den neuen Namen zeigen
      nameDirty = false;
      Promise.resolve(RokAuth.flushNow?.()).catch(() => {}).then(() => location.reload());
    }
  }
  function open() {
    const info = window.RokAuth?.accountInfo?.();
    if (!info) return RokAuth?.showLogin?.();
    if (root) close();
    root = document.createElement('div');
    root.className = 'fixed inset-0 z-[80] grid place-items-center p-4 bg-ink-950/80 backdrop-blur-sm ui-fade';
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Konto');
    root.innerHTML = html(info);
    root.addEventListener('click', (ev) => {
      if (ev.target === root || ev.target.closest('[data-acc-close]')) return close();
      const eye = ev.target.closest('[data-eye]');
      if (eye) { const inp = $(eye.dataset.eye); inp.type = inp.type === 'password' ? 'text' : 'password'; eye.textContent = inp.type === 'password' ? '👁' : '🙈'; }
    });
    $('accNameForm').addEventListener('submit', saveName);
    $('accPwForm').addEventListener('submit', savePw);
    document.addEventListener('keydown', onKey, true);
    prevOverflow = document.body.style.overflow;
    document.body.appendChild(root); document.body.style.overflow = 'hidden';
    setTimeout(() => $('accName')?.focus(), 30);
  }

  // Menüpunkt „⚙️ Konto“ im Benutzermenü
  document.addEventListener('click', (ev) => {
    if (!ev.target.closest('#menuAccount')) return;
    window.Rok?.closeUserMenu?.();
    open();
  });

  return { open, close };
})();
