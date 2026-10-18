// ================= Dialoge im Stil der Seite (statt confirm/alert/prompt des Browsers) =================
// UI.confirm(text) → Promise<true|false> · UI.alert(text) → Promise · UI.prompt(text, vorgabe) → Promise<string|null>
window.UI = (() => {
  const tr = (s) => (window.I18N ? I18N.tr(s) : s);
  function open({ msg, title, input, def, ok, cancel, danger }) {
    return new Promise((resolve) => {
      const prevFocus = document.activeElement, prevOverflow = document.body.style.overflow;
      const root = document.createElement('div');
      root.className = 'fixed inset-0 z-[90] grid place-items-center p-4 bg-ink-950/80 backdrop-blur-sm ui-fade';
      root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true');
      const icon = danger ? '⚠️' : (input ? '✎' : (cancel ? '❔' : 'ℹ️'));
      root.innerHTML = `<div class="panel !bg-ink-900 w-full max-w-md rounded-2xl p-6 shadow-2xl ui-pop">
          <div class="flex items-start gap-4">
            <div class="w-11 h-11 shrink-0 rounded-xl grid place-items-center text-xl ${danger ? 'bg-red-500/15 border border-red-500/40' : 'bg-gold-500/15 border border-gold-500/40 text-gold-300'}">${icon}</div>
            <div class="min-w-0 flex-1">
              <h3 class="ui-title font-display text-xl gold-text leading-tight"></h3>
              <p class="ui-msg mt-2 text-sm text-slate-300 whitespace-pre-line break-words"></p>
            </div>
          </div>
          ${input ? '<input class="ui-in mt-5 w-full bg-ink-950 border border-ink-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gold-500" maxlength="60">' : ''}
          <div class="mt-6 flex flex-wrap justify-end gap-2">
            ${cancel ? '<button type="button" class="ui-no px-4 py-2.5 rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300 text-sm"></button>' : ''}
            <button type="button" class="ui-ok px-5 py-2.5 rounded-lg font-semibold text-sm ${danger ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-gold-500 hover:bg-gold-400 text-ink-950'}"></button>
          </div>
        </div>`;
      root.querySelector('.ui-title').textContent = title;
      root.querySelector('.ui-msg').textContent = tr(String(msg ?? '')).replace(/^⚠️?\s*/, '');
      root.querySelector('.ui-ok').textContent = ok;
      if (cancel) root.querySelector('.ui-no').textContent = cancel;
      const inp = root.querySelector('.ui-in');
      if (inp) inp.value = def ?? '';
      const done = (v) => {
        document.removeEventListener('keydown', onKey, true);
        root.remove(); document.body.style.overflow = prevOverflow;
        try { prevFocus?.focus?.(); } catch {}
        resolve(v);
      };
      const yes = () => done(inp ? inp.value : true), no = () => done(inp ? null : (cancel ? false : true));
      const onKey = (ev) => {
        if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); no(); }
        else if (ev.key === 'Enter' && (inp ? document.activeElement === inp : true)) { ev.preventDefault(); ev.stopPropagation(); yes(); }
      };
      root.querySelector('.ui-ok').onclick = yes;
      if (cancel) root.querySelector('.ui-no').onclick = no;
      root.addEventListener('click', (ev) => { if (ev.target === root) no(); });
      document.addEventListener('keydown', onKey, true);
      document.body.appendChild(root); document.body.style.overflow = 'hidden';
      setTimeout(() => { if (inp) { inp.focus(); inp.select(); } else root.querySelector(danger && cancel ? '.ui-no' : '.ui-ok').focus(); }, 30);
    });
  }
  const isDanger = (m) => /⚠|lösch|zurücksetzen|entfernen|überschreiben|unwiderruflich/i.test(String(m));
  return {
    confirm: (msg, o = {}) => open({ msg, title: o.title || 'Bitte bestätigen', ok: o.ok || 'Bestätigen', cancel: o.cancel || 'Abbrechen', danger: o.danger ?? isDanger(msg) }),
    alert: (msg, o = {}) => open({ msg, title: o.title || 'Hinweis', ok: o.ok || 'OK', cancel: '' }),
    prompt: (msg, def = '', o = {}) => open({ msg, title: o.title || 'Eingabe', input: true, def, ok: o.ok || 'Übernehmen', cancel: o.cancel || 'Abbrechen' })
  };
})();
