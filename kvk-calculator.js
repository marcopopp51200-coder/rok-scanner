/*!
 * kvk-calculator.js – Modul „KvK-Vorbereitung“ (KvK Prep / Crystal Calculator)
 * für das Wiz fan Club Dashboard.
 *
 * Einbinden:   <script src="kvk-calculator.js" defer></script>
 * Erwartet:    #kvkRoot (Pflicht). Seiten-Modus: #kvkRoot liegt in #kvkView (Umschalten über applyView).
 *              Popup-Modus: #kvkRoot liegt in #kvkModal (+ optional #menuKvk).
 * API:         window.KvKCalc.open() / .render() / .close() / .getState() / .setState(obj) / .reset()
 * Event:       window 'kvkcalc:change' (detail = aktueller State) – z. B. für Supabase-Sync
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Konstanten & Standardwerte
   * ------------------------------------------------------------------ */
  const STORAGE_KEY = 'kvkCalc.v1';

  const TABS = [
    { id: 'overview', label: 'Übersicht', icon: '🧭' },
    { id: 'speedups', label: 'Speedups', icon: '⏱️' },
    { id: 'troops', label: 'Truppen', icon: '⚔️' },
    { id: 'crystals', label: 'Kristalle', icon: '💎' }
  ];

  const TYPES = [
    { id: 'inf', label: 'Infanterie', icon: '🛡️' },
    { id: 'cav', label: 'Kavallerie', icon: '🐎' },
    { id: 'arch', label: 'Bogenschützen', icon: '🏹' },
    { id: 'siege', label: 'Belagerung', icon: '🎯' }
  ];
  const TIERS = ['t4', 't5'];

  const RES = [
    { id: 'food', label: 'Nahrung', icon: '🌽' },
    { id: 'wood', label: 'Holz', icon: '🪵' },
    { id: 'stone', label: 'Stein', icon: '🪨' },
    { id: 'gold', label: 'Gold', icon: '🪙' }
  ];

  const SPEED_CATS = [
    { id: 'universal', label: 'Universal', icon: '⏱️' },
    { id: 'training', label: 'Ausbildung', icon: '⚔️' },
    { id: 'healing', label: 'Heilung', icon: '❤️' },
    { id: 'research', label: 'Forschung', icon: '🔬' },
    { id: 'building', label: 'Bau', icon: '🏗️' }
  ];

  // Basiswerte pro Truppe (ohne Boni) – im Tab „Truppen → Basiswerte“ anpassbar.
  const DEFAULTS = {
    costs: {
      t4: {
        inf: { food: 300, wood: 300, stone: 0, gold: 20 },
        cav: { food: 300, wood: 0, stone: 300, gold: 20 },
        arch: { food: 0, wood: 300, stone: 300, gold: 20 },
        siege: { food: 200, wood: 200, stone: 200, gold: 20 }
      },
      t5: {
        inf: { food: 800, wood: 800, stone: 0, gold: 400 },
        cav: { food: 800, wood: 0, stone: 800, gold: 400 },
        arch: { food: 0, wood: 800, stone: 800, gold: 400 },
        siege: { food: 500, wood: 500, stone: 500, gold: 400 }
      }
    },
    time: { t4: 80, t5: 120 }, // Sekunden pro Truppe
    power: { t4: 10, t5: 20 }  // Macht pro Truppe
  };

  /* ------------------------------------------------------------------ *
   * State
   * ------------------------------------------------------------------ */
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const zeroTypes = () => Object.fromEntries(TYPES.map((t) => [t.id, 0]));

  function freshState() {
    return {
      v: 1,
      tab: 'overview',
      kvkStart: '',
      speed: Object.fromEntries(SPEED_CATS.map((c) => [c.id, { d: 0, h: 0, m: 0 }])),
      troops: {
        target: { t4: zeroTypes(), t5: zeroTypes() },
        trainingBonus: 0,
        costReduction: 0,
        useUniversal: true,
        inventory: { food: 0, wood: 0, stone: 0, gold: 0 },
        costs: clone(DEFAULTS.costs),
        time: clone(DEFAULTS.time)
      },
      crystals: {
        current: 0, goal: 0, days: 0,
        perMarch: 0, marchesPerDay: 0,
        perFort: 0, fortsPerDay: 0,
        otherPerDay: 0
      }
    };
  }

  // Übernimmt nur Schlüssel, die im Standard-State existieren (robust gegen alte Versionen)
  function mergeInto(base, src) {
    if (!src || typeof src !== 'object') return base;
    Object.keys(base).forEach((k) => {
      if (!(k in src)) return;
      const b = base[k], s = src[k];
      if (b && typeof b === 'object' && !Array.isArray(b)) mergeInto(b, s);
      else if (typeof b === typeof s) base[k] = s;
    });
    return base;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? mergeInto(freshState(), JSON.parse(raw)) : freshState();
    } catch (e) {
      return freshState();
    }
  }

  let state = load();
  let saveTimer = null;

  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignorieren */ }
      window.dispatchEvent(new CustomEvent('kvkcalc:change', { detail: clone(state) }));
    }, 250);
  }

  const getPath = (obj, p) => p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  function setPath(obj, p, v) {
    const keys = p.split('.');
    const last = keys.pop();
    const target = keys.reduce((o, k) => (o[k] == null ? (o[k] = {}) : o[k]), obj);
    target[last] = v;
  }

  /* ------------------------------------------------------------------ *
   * Zahlen: Eingabe & Formatierung
   * Akzeptiert: 1500000 · 1.500.000 · 1,5m · 1.5M · 250k · 2b · 3 Mio
   * ------------------------------------------------------------------ */
  function parseNum(raw) {
    if (raw == null) return 0;
    let s = String(raw).trim().toLowerCase().replace(/\s+/g, '')
      .replace(/mio\.?$/, 'm').replace(/mrd\.?$/, 'b').replace(/%$/, '');
    if (!s) return 0;
    const m = s.match(/^([\d.,]+)([kmb])?$/);
    if (!m) return 0;
    let num = m[1];
    const suf = m[2];
    const seps = (num.match(/[.,]/g) || []).length;

    if (seps > 0) {
      const lastIdx = Math.max(num.lastIndexOf('.'), num.lastIndexOf(','));
      const head = num.slice(0, lastIdx).replace(/[.,]/g, '');
      const tail = num.slice(lastIdx + 1);
      // Mit Suffix ist das letzte Trennzeichen immer Dezimal; ohne Suffix sind 3 Ziffern = Tausender
      num = (!suf && tail.length === 3) ? head + tail : head + '.' + tail;
    }
    let v = parseFloat(num);
    if (!Number.isFinite(v)) return 0;
    v *= suf === 'k' ? 1e3 : suf === 'm' ? 1e6 : suf === 'b' ? 1e9 : 1;
    return Math.max(0, v);
  }

  const nf = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });
  const cf = new Intl.NumberFormat('de-DE', { notation: 'compact', maximumFractionDigits: 1 });

  const fmt = (n) => (Number.isFinite(n) ? nf.format(Math.round(n)) : '∞');
  const fmtC = (n) => (!Number.isFinite(n) ? '∞' : Math.abs(n) >= 1e5 ? cf.format(n) : fmt(n));
  const fmtInput = (n) => (!n ? '' : Number.isInteger(n) ? nf.format(n) : nf1.format(n));

  function fmtDur(min) {
    if (!Number.isFinite(min)) return '∞';
    min = Math.round(Math.max(0, min));
    const d = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60), m = min % 60;
    if (d) return `${fmt(d)} T ${h} Std`;
    if (h) return `${h} Std ${m} Min`;
    return `${m} Min`;
  }

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ------------------------------------------------------------------ *
   * Berechnungen
   * ------------------------------------------------------------------ */
  function calc() {
    // Speedups (in Minuten)
    const sp = { total: 0 };
    SPEED_CATS.forEach((c) => {
      const o = state.speed[c.id];
      sp[c.id] = o.d * 1440 + o.h * 60 + o.m;
      sp.total += sp[c.id];
    });

    // Truppen
    const t = state.troops;
    const speedMult = 1 + t.trainingBonus / 100;
    const costMult = 1 - Math.min(t.costReduction, 100) / 100;
    const tr = { count: 0, power: 0, baseMin: 0, effMin: 0, need: {}, missing: {}, anyMissing: false };
    RES.forEach((r) => (tr.need[r.id] = 0));

    TIERS.forEach((tier) => TYPES.forEach((tp) => {
      const n = t.target[tier][tp.id] || 0;
      if (!n) return;
      tr.count += n;
      tr.power += n * DEFAULTS.power[tier];
      tr.baseMin += (n * t.time[tier]) / 60;
      RES.forEach((r) => (tr.need[r.id] += n * t.costs[tier][tp.id][r.id] * costMult));
    }));

    tr.effMin = tr.baseMin / speedMult;
    tr.available = sp.training + (t.useUniversal ? sp.universal : 0);
    tr.universalUsed = t.useUniversal ? Math.min(sp.universal, Math.max(0, tr.effMin - sp.training)) : 0;
    tr.deficitMin = Math.max(0, tr.effMin - tr.available);
    tr.surplusMin = Math.max(0, tr.available - tr.effMin);
    RES.forEach((r) => {
      tr.missing[r.id] = Math.max(0, tr.need[r.id] - t.inventory[r.id]);
      if (tr.missing[r.id] > 0) tr.anyMissing = true;
    });

    // Kristalle
    const c = state.crystals;
    const cr = {};
    cr.daily = c.perMarch * c.marchesPerDay + c.perFort * c.fortsPerDay + c.otherPerDay;
    cr.remaining = Math.max(0, c.goal - c.current);
    cr.daysNeeded = cr.remaining === 0 ? 0 : cr.daily > 0 ? Math.ceil(cr.remaining / cr.daily) : Infinity;
    cr.projected = c.current + cr.daily * c.days;
    cr.neededDaily = c.days > 0 ? cr.remaining / c.days : null;
    cr.pct = c.goal > 0 ? Math.min(100, (c.current / c.goal) * 100) : 0;
    cr.reachable = c.goal > 0 && c.days > 0 ? cr.projected >= c.goal : null;

    // Countdown
    let countdown = null;
    if (state.kvkStart) {
      const ts = new Date(state.kvkStart).getTime();
      if (Number.isFinite(ts)) countdown = (ts - Date.now()) / 60000;
    }

    return { sp, tr, cr, countdown };
  }

  /* ------------------------------------------------------------------ *
   * UI-Bausteine
   * ------------------------------------------------------------------ */
  function numField(path, label, hint) {
    return `<label class="kvk-field">
      <span>${label}</span>
      <input type="text" inputmode="decimal" autocomplete="off" data-path="${path}"
             value="${esc(fmtInput(getPath(state, path)))}" placeholder="0">
      ${hint ? `<small>${hint}</small>` : ''}
    </label>`;
  }

  function dhmFields(base, label) {
    const parts = [['d', 'T'], ['h', 'Std'], ['m', 'Min']];
    return `<div class="kvk-dhm">${parts.map(([k, suf]) => `
      <label class="kvk-suffix" data-suffix="${suf}">
        <input type="text" inputmode="numeric" autocomplete="off" data-path="${base}.${k}"
               aria-label="${label} ${suf}" value="${esc(fmtInput(getPath(state, base + '.' + k)))}" placeholder="0">
      </label>`).join('')}</div>`;
  }

  const stat = (label, value, sub, cls = '') =>
    `<div class="kvk-stat ${cls}"><div class="kvk-stat-k">${label}</div><div class="kvk-stat-v">${value}</div>${sub ? `<div class="kvk-stat-s">${sub}</div>` : ''}</div>`;

  const bar = (pct, cls = '') =>
    `<div class="kvk-bar ${cls}"><i style="width:${Math.max(0, Math.min(100, pct)).toFixed(1)}%"></i></div>`;

  const badge = (ok, text) => `<span class="kvk-badge ${ok ? 'is-ok' : 'is-bad'}">${ok ? '✓' : '!'} ${text}</span>`;

  /* ------------------------------------------------------------------ *
   * Ansichten (Eingaben) – werden nur beim Tab-Wechsel neu gerendert
   * ------------------------------------------------------------------ */
  const VIEWS = {
    overview() {
      return `
        <div class="kvk-card">
          <label class="kvk-field">
            <span>KvK-Start (deine Ortszeit)</span>
            <input type="datetime-local" data-path="kvkStart" data-kind="raw" value="${esc(state.kvkStart)}">
          </label>
        </div>
        <div data-kvk-results></div>
        <p class="kvk-note">Werte trägst du in den Tabs <b>Speedups</b>, <b>Truppen</b> und <b>Kristalle</b> ein.
          Zahlen gehen auch als <code>250k</code>, <code>1,5m</code> oder <code>2b</code>.
          Alles wird automatisch in diesem Browser gespeichert.</p>`;
    },

    speedups() {
      return `
        <div class="kvk-grid">
          ${SPEED_CATS.map((c) => `
            <div class="kvk-card">
              <div class="kvk-card-title">${c.icon} ${c.label}</div>
              ${dhmFields('speed.' + c.id, c.label)}
            </div>`).join('')}
        </div>
        <div data-kvk-results></div>`;
    },

    troops() {
      const t = state.troops;
      return `
        <div class="kvk-card">
          <div class="kvk-card-title">🎯 Ausbildungsziel (Anzahl Truppen)</div>
          <div class="kvk-table-wrap"><table class="kvk-table">
            <thead><tr><th>Typ</th><th>T4</th><th>T5</th></tr></thead>
            <tbody>${TYPES.map((tp) => `
              <tr><td>${tp.icon} ${tp.label}</td>
                ${TIERS.map((tier) => `<td><input type="text" inputmode="decimal" autocomplete="off"
                  data-path="troops.target.${tier}.${tp.id}" aria-label="${tp.label} ${tier.toUpperCase()}"
                  value="${esc(fmtInput(t.target[tier][tp.id]))}" placeholder="0"></td>`).join('')}
              </tr>`).join('')}
            </tbody>
          </table></div>
        </div>

        <div class="kvk-grid">
          <div class="kvk-card">
            <div class="kvk-card-title">⚙️ Boni</div>
            ${numField('troops.trainingBonus', 'Ausbildungsgeschwindigkeit (%)', 'Summe aller Boni aus Profil → Details')}
            ${numField('troops.costReduction', 'Kostenreduktion Ausbildung (%)')}
            <label class="kvk-check">
              <input type="checkbox" data-path="troops.useUniversal" ${t.useUniversal ? 'checked' : ''}>
              <span>Universal-Speedups mit einrechnen</span>
            </label>
          </div>
          <div class="kvk-card">
            <div class="kvk-card-title">📦 Vorhandene Ressourcen</div>
            <div class="kvk-grid kvk-grid-2">
              ${RES.map((r) => numField('troops.inventory.' + r.id, `${r.icon} ${r.label}`)).join('')}
            </div>
          </div>
        </div>

        <div data-kvk-results></div>

        <details class="kvk-card kvk-details">
          <summary>🔧 Basiswerte anpassen (Kosten &amp; Zeit pro Truppe)</summary>
          <div class="kvk-grid kvk-grid-2">
            ${TIERS.map((tier) => numField(`troops.time.${tier}`, `Ausbildungszeit ${tier.toUpperCase()} (Sek./Truppe)`)).join('')}
          </div>
          ${TIERS.map((tier) => `
            <div class="kvk-sub">${tier.toUpperCase()} – Kosten pro Truppe</div>
            <div class="kvk-table-wrap"><table class="kvk-table">
              <thead><tr><th>Typ</th>${RES.map((r) => `<th>${r.icon}</th>`).join('')}</tr></thead>
              <tbody>${TYPES.map((tp) => `
                <tr><td>${tp.icon} ${tp.label}</td>
                  ${RES.map((r) => `<td><input type="text" inputmode="decimal" autocomplete="off"
                    data-path="troops.costs.${tier}.${tp.id}.${r.id}" aria-label="${tp.label} ${tier} ${r.label}"
                    value="${esc(fmtInput(t.costs[tier][tp.id][r.id]))}" placeholder="0"></td>`).join('')}
                </tr>`).join('')}
              </tbody>
            </table></div>`).join('')}
          <button type="button" class="kvk-btn" data-action="reset-defaults">Standardwerte wiederherstellen</button>
        </details>`;
    },

    crystals() {
      return `
        <div class="kvk-grid">
          <div class="kvk-card">
            <div class="kvk-card-title">💎 Bestand &amp; Ziel</div>
            ${numField('crystals.current', 'Aktuelle Kristalle')}
            ${numField('crystals.goal', 'Ziel (Kristalle)', 'z. B. Summe der geplanten Kristall-Technologien')}
            ${numField('crystals.days', 'Zeitraum (Tage)', 'Wie viele Tage du noch Kristalle sammeln kannst')}
          </div>
          <div class="kvk-card">
            <div class="kvk-card-title">⛏️ Einnahmen pro Tag</div>
            <div class="kvk-grid kvk-grid-2">
              ${numField('crystals.perMarch', 'Kristalle pro Sammelmarsch')}
              ${numField('crystals.marchesPerDay', 'Sammelmärsche pro Tag')}
              ${numField('crystals.perFort', 'Kristalle pro Barbarenfestung')}
              ${numField('crystals.fortsPerDay', 'Festungen pro Tag')}
            </div>
            ${numField('crystals.otherPerDay', 'Sonstiges pro Tag', 'Events, Ruinen, Belohnungen …')}
          </div>
        </div>
        <div data-kvk-results></div>`;
    }
  };

  /* ------------------------------------------------------------------ *
   * Ergebnisse – werden bei jeder Eingabe neu gerendert
   * ------------------------------------------------------------------ */
  const RESULTS = {
    overview(r) {
      let cd;
      if (r.countdown == null) cd = stat('Countdown', '—', 'KvK-Start oben eintragen');
      else if (r.countdown > 0) cd = stat('Bis KvK-Start', fmtDur(r.countdown), new Date(state.kvkStart).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' }), 'is-gold');
      else cd = stat('KvK', 'läuft', 'Startzeit liegt in der Vergangenheit', 'is-gold');

      const tr = r.tr;
      const trStat = tr.count === 0
        ? stat('Truppen-Ziel', '—', 'Im Tab „Truppen“ festlegen')
        : stat('Truppen-Ziel', fmtC(tr.count), `+${fmtC(tr.power)} Macht · ${fmtDur(tr.effMin)} Ausbildung`);

      const spStatus = tr.count === 0 ? '' : tr.deficitMin > 0
        ? badge(false, `Es fehlen ${fmtDur(tr.deficitMin)} Speedups`)
        : badge(true, `Speedups reichen (+${fmtDur(tr.surplusMin)} übrig)`);

      const resStatus = tr.count === 0 ? '' : tr.anyMissing
        ? badge(false, 'Fehlt: ' + RES.filter((x) => tr.missing[x.id] > 0).map((x) => `${x.icon} ${fmtC(tr.missing[x.id])}`).join(' · '))
        : badge(true, 'Ressourcen reichen');

      const cr = r.cr, c = state.crystals;
      const crStat = c.goal > 0
        ? stat('Kristalle', `${fmtC(c.current)} / ${fmtC(c.goal)}`, cr.remaining === 0 ? 'Ziel erreicht 🎉' : `noch ${fmtC(cr.remaining)} · ${Number.isFinite(cr.daysNeeded) ? cr.daysNeeded + ' Tage' : 'keine Einnahmen eingetragen'}`)
        : stat('Kristalle', fmtC(c.current), 'Ziel im Tab „Kristalle“ festlegen');

      return `
        <div class="kvk-stats">
          ${cd}
          ${stat('Speedups gesamt', fmtDur(r.sp.total), `davon Universal ${fmtDur(r.sp.universal)}`)}
          ${trStat}
          ${crStat}
        </div>
        ${spStatus || resStatus ? `<div class="kvk-badges">${spStatus}${resStatus}</div>` : ''}
        ${c.goal > 0 ? bar(cr.pct, 'is-crystal') : ''}`;
    },

    speedups(r) {
      const max = Math.max(1, ...SPEED_CATS.map((c) => r.sp[c.id]));
      return `
        <div class="kvk-stats">
          ${stat('Gesamt', fmtDur(r.sp.total), `${fmt(r.sp.total / 60)} Stunden`, 'is-gold')}
          ${stat('Für Ausbildung nutzbar', fmtDur(r.sp.training + r.sp.universal), 'Ausbildung + Universal')}
          ${stat('Für Heilung nutzbar', fmtDur(r.sp.healing + r.sp.universal), 'Heilung + Universal')}
        </div>
        <div class="kvk-card">
          ${SPEED_CATS.map((c) => `
            <div class="kvk-barrow">
              <span>${c.icon} ${c.label}</span>
              ${bar((r.sp[c.id] / max) * 100)}
              <b>${fmtDur(r.sp[c.id])}</b>
            </div>`).join('')}
        </div>`;
    },

    troops(r) {
      const tr = r.tr;
      if (tr.count === 0) return `<p class="kvk-note">Trag oben ein, wie viele Truppen du ausbilden willst.</p>`;
      const ok = tr.deficitMin === 0;
      return `
        <div class="kvk-stats">
          ${stat('Truppen', fmt(tr.count), `+${fmt(tr.power)} Macht`, 'is-gold')}
          ${stat('Ausbildungszeit', fmtDur(tr.effMin), `Basis ohne Boni: ${fmtDur(tr.baseMin)}`)}
          ${stat('Verfügbare Speedups', fmtDur(tr.available), state.troops.useUniversal ? `davon Universal genutzt: ${fmtDur(tr.universalUsed)}` : 'ohne Universal')}
          ${stat(ok ? 'Überschuss' : 'Es fehlen', fmtDur(ok ? tr.surplusMin : tr.deficitMin),
                 ok ? 'Speedups reichen ✓' : `≈ ${fmt(tr.deficitMin / tr.effMin * tr.count)} Truppen nicht abgedeckt`,
                 ok ? 'is-ok' : 'is-bad')}
        </div>
        <div class="kvk-card">
          <div class="kvk-card-title">Ressourcenbedarf</div>
          <div class="kvk-table-wrap"><table class="kvk-table kvk-table-res">
            <thead><tr><th>Ressource</th><th>Benötigt</th><th>Vorhanden</th><th>Fehlt</th></tr></thead>
            <tbody>${RES.map((x) => `
              <tr>
                <td>${x.icon} ${x.label}</td>
                <td>${fmtC(tr.need[x.id])}</td>
                <td>${fmtC(state.troops.inventory[x.id])}</td>
                <td class="${tr.missing[x.id] > 0 ? 'is-bad' : 'is-ok'}">${tr.missing[x.id] > 0 ? fmtC(tr.missing[x.id]) : '✓'}</td>
              </tr>`).join('')}
            </tbody>
          </table></div>
        </div>`;
    },

    crystals(r) {
      const cr = r.cr, c = state.crystals;
      const reach = cr.reachable == null ? '' : cr.reachable
        ? badge(true, `Ziel im Zeitraum erreichbar (Prognose ${fmtC(cr.projected)})`)
        : badge(false, `Im Zeitraum fehlen ${fmtC(c.goal - cr.projected)} Kristalle`);
      return `
        <div class="kvk-stats">
          ${stat('Einnahmen / Tag', fmtC(cr.daily), '', 'is-gold')}
          ${stat('Noch benötigt', c.goal > 0 ? fmtC(cr.remaining) : '—', c.goal > 0 ? `${nf1.format(cr.pct)} % erreicht` : 'Ziel eintragen')}
          ${stat('Tage bis Ziel', c.goal > 0 ? (Number.isFinite(cr.daysNeeded) ? fmt(cr.daysNeeded) : '∞') : '—', cr.daily > 0 ? 'bei aktuellem Tempo' : 'Einnahmen eintragen')}
          ${stat('Nötig pro Tag', cr.neededDaily != null && c.goal > 0 ? fmtC(Math.ceil(cr.neededDaily)) : '—', c.days > 0 ? `um das Ziel in ${fmt(c.days)} Tagen zu schaffen` : 'Zeitraum eintragen')}
        </div>
        ${c.goal > 0 ? bar(cr.pct, 'is-crystal') : ''}
        ${reach ? `<div class="kvk-badges">${reach}</div>` : ''}`;
    }
  };

  /* ------------------------------------------------------------------ *
   * Rendering & Events
   * ------------------------------------------------------------------ */
  let root = null;
  let modal = null;
  let lastFocus = null;

  function render() {
    if (!root) return;
    if (!VIEWS[state.tab]) state.tab = 'overview';
    root.innerHTML = `
      <nav class="kvk-tabs" role="tablist">
        ${TABS.map((t) => `<button type="button" role="tab" data-tab="${t.id}"
            aria-selected="${state.tab === t.id}" class="kvk-tab${state.tab === t.id ? ' is-active' : ''}">
            <span>${t.icon}</span> ${t.label}</button>`).join('')}
      </nav>
      <div class="kvk-body">${VIEWS[state.tab]()}</div>
      <div class="kvk-foot">
        <button type="button" class="kvk-link" data-action="reset-all">Alle Eingaben zurücksetzen</button>
      </div>`;
    refresh();
  }

  function refresh() {
    const out = root && root.querySelector('[data-kvk-results]');
    if (out) out.innerHTML = RESULTS[state.tab](calc());
  }

  function onInput(e) {
    const el = e.target.closest('[data-path]');
    if (!el) return;
    const path = el.dataset.path;
    let value;
    if (el.type === 'checkbox') value = el.checked;
    else if (el.dataset.kind === 'raw') value = el.value;
    else value = parseNum(el.value);
    setPath(state, path, value);
    save();
    refresh();
  }

  function onBlur(e) {
    const el = e.target;
    if (!el.matches || !el.matches('input[data-path]') || el.type === 'checkbox' || el.dataset.kind === 'raw') return;
    el.value = fmtInput(getPath(state, el.dataset.path));
  }

  function onClick(e) {
    const tab = e.target.closest('[data-tab]');
    if (tab) {
      state.tab = tab.dataset.tab;
      save();
      render();
      return;
    }
    const act = e.target.closest('[data-action]');
    if (!act) return;
    if (act.dataset.action === 'reset-defaults') {
      state.troops.costs = clone(DEFAULTS.costs);
      state.troops.time = clone(DEFAULTS.time);
      save();
      render();
      const d = root.querySelector('.kvk-details');
      if (d) d.open = true;
    } else if (act.dataset.action === 'reset-all') {
      if (window.confirm('Wirklich alle KvK-Eingaben zurücksetzen?')) {
        state = freshState();
        save();
        render();
      }
    }
  }

  /* ------------------------------------------------------------------ *
   * Fenster öffnen / schließen
   * ------------------------------------------------------------------ */
  function open() {
    if (!root) init();
    if (!root) return;
    render();
    if (modal) {
      lastFocus = document.activeElement;
      modal.classList.remove('hidden');
      document.body.classList.add('kvk-lock');
      const first = modal.querySelector('.kvk-tab.is-active') || modal.querySelector('button, input');
      if (first) first.focus();
    }
  }

  function close() {
    if (!modal || modal.classList.contains('hidden')) return;
    modal.classList.add('hidden');
    document.body.classList.remove('kvk-lock');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ------------------------------------------------------------------ *
   * Styles (eigenständig, unabhängig vom Tailwind-Build)
   * ------------------------------------------------------------------ */
  function injectStyles() {
    if (document.getElementById('kvk-styles')) return;
    const css = `
#kvkModal, .kvk-scope {
  --kvk-bg:#0b111d; --kvk-panel:#111a2a; --kvk-panel-2:#16213a; --kvk-line:rgba(255,255,255,.08);
  --kvk-text:#e5e7eb; --kvk-muted:#94a3b8; --kvk-gold:#f5d27a; --kvk-gold-2:#d4a944;
  --kvk-ok:#34d399; --kvk-bad:#f87171; --kvk-crystal:#7dd3fc;
}
#kvkModal { position:fixed; inset:0; z-index:70; display:flex; align-items:center; justify-content:center; padding:16px; }
#kvkModal.hidden { display:none !important; }
.kvk-backdrop { position:absolute; inset:0; background:rgba(3,6,12,.72); backdrop-filter:blur(4px); }
.kvk-window { position:relative; width:100%; max-width:980px; max-height:calc(100vh - 32px); display:flex; flex-direction:column;
  background:var(--kvk-bg); color:var(--kvk-text); border:1px solid var(--kvk-line); border-radius:16px;
  box-shadow:0 25px 60px rgba(0,0,0,.6); overflow:hidden; }
.kvk-head { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 18px; border-bottom:1px solid var(--kvk-line); }
.kvk-head h2 { margin:0; font-size:1.1rem; font-weight:700; color:var(--kvk-gold); }
.kvk-x { background:none; border:0; color:var(--kvk-muted); font-size:1.1rem; cursor:pointer; padding:6px 10px; border-radius:8px; }
.kvk-x:hover { background:var(--kvk-panel-2); color:var(--kvk-text); }
#kvkModal #kvkRoot { overflow-y:auto; }
.kvk-scope { color:var(--kvk-text); }
body.kvk-lock { overflow:hidden; }

.kvk-tabs { position:sticky; top:0; z-index:2; display:flex; gap:4px; padding:8px 12px 0; background:var(--kvk-bg);
  border-bottom:1px solid var(--kvk-line); overflow-x:auto; }
.kvk-tab { background:none; border:0; border-bottom:2px solid transparent; color:var(--kvk-muted); padding:10px 12px;
  font-size:.9rem; cursor:pointer; white-space:nowrap; }
.kvk-tab:hover { color:var(--kvk-text); }
.kvk-tab.is-active { color:var(--kvk-gold); border-bottom-color:var(--kvk-gold); font-weight:600; }
.kvk-body { padding:16px; display:flex; flex-direction:column; gap:12px; }
.kvk-foot { padding:0 16px 16px; text-align:right; }

.kvk-grid { display:grid; gap:12px; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); }
.kvk-grid-2 { grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:10px; }
.kvk-card { background:var(--kvk-panel); border:1px solid var(--kvk-line); border-radius:12px; padding:14px; display:flex; flex-direction:column; gap:10px; min-width:0; }
.kvk-card-title { font-weight:600; font-size:.9rem; }
.kvk-sub { margin-top:6px; font-size:.8rem; color:var(--kvk-muted); text-transform:uppercase; letter-spacing:.05em; }

.kvk-field { display:flex; flex-direction:column; gap:4px; font-size:.8rem; color:var(--kvk-muted); }
.kvk-field small { font-size:.72rem; opacity:.8; }
.kvk-scope input[type=text], .kvk-scope input[type=datetime-local] {
  width:100%; box-sizing:border-box; background:var(--kvk-bg); color:var(--kvk-text); border:1px solid var(--kvk-line);
  border-radius:8px; padding:8px 10px; font-size:.9rem; font-variant-numeric:tabular-nums; color-scheme:dark; }
.kvk-scope input:focus { outline:none; border-color:var(--kvk-gold-2); box-shadow:0 0 0 2px rgba(245,210,122,.18); }
.kvk-dhm { display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; }
.kvk-suffix { position:relative; display:block; }
.kvk-suffix input { padding-right:34px !important; }
.kvk-suffix::after { content:attr(data-suffix); position:absolute; right:9px; top:50%; transform:translateY(-50%);
  font-size:.72rem; color:var(--kvk-muted); pointer-events:none; }
.kvk-check { display:flex; align-items:center; gap:8px; font-size:.85rem; cursor:pointer; }
.kvk-check input { accent-color:var(--kvk-gold-2); width:16px; height:16px; }

.kvk-table-wrap { overflow-x:auto; }
.kvk-table { width:100%; border-collapse:collapse; font-size:.85rem; }
.kvk-table th { text-align:left; color:var(--kvk-muted); font-weight:500; padding:6px; border-bottom:1px solid var(--kvk-line); }
.kvk-table td { padding:6px; border-bottom:1px solid var(--kvk-line); white-space:nowrap; }
.kvk-table tr:last-child td { border-bottom:0; }
.kvk-table td input { min-width:80px; }
.kvk-table-res td:not(:first-child), .kvk-table-res th:not(:first-child) { text-align:right; font-variant-numeric:tabular-nums; }

.kvk-stats { display:grid; gap:10px; grid-template-columns:repeat(auto-fit, minmax(190px, 1fr)); }
.kvk-stat { background:var(--kvk-panel); border:1px solid var(--kvk-line); border-radius:12px; padding:12px 14px; }
.kvk-stat-k { font-size:.72rem; text-transform:uppercase; letter-spacing:.06em; color:var(--kvk-muted); }
.kvk-stat-v { font-size:1.35rem; font-weight:700; margin-top:2px; font-variant-numeric:tabular-nums; }
.kvk-stat-s { font-size:.75rem; color:var(--kvk-muted); margin-top:2px; }
.kvk-stat.is-gold .kvk-stat-v { color:var(--kvk-gold); }
.kvk-stat.is-ok { border-color:rgba(52,211,153,.35); } .kvk-stat.is-ok .kvk-stat-v { color:var(--kvk-ok); }
.kvk-stat.is-bad { border-color:rgba(248,113,113,.35); } .kvk-stat.is-bad .kvk-stat-v { color:var(--kvk-bad); }
.kvk-scope td.is-ok { color:var(--kvk-ok); } .kvk-scope td.is-bad { color:var(--kvk-bad); font-weight:600; }

.kvk-bar { height:8px; border-radius:99px; background:var(--kvk-panel-2); overflow:hidden; flex:1; }
.kvk-bar i { display:block; height:100%; border-radius:inherit; background:linear-gradient(90deg, var(--kvk-gold-2), var(--kvk-gold)); transition:width .25s; }
.kvk-bar.is-crystal i { background:linear-gradient(90deg, #38bdf8, var(--kvk-crystal)); }
.kvk-barrow { display:grid; grid-template-columns:120px 1fr 110px; align-items:center; gap:10px; font-size:.85rem; }
.kvk-barrow b { text-align:right; font-weight:600; font-variant-numeric:tabular-nums; }

.kvk-badges { display:flex; flex-wrap:wrap; gap:8px; }
.kvk-badge { font-size:.8rem; padding:6px 10px; border-radius:99px; border:1px solid; }
.kvk-badge.is-ok { color:var(--kvk-ok); border-color:rgba(52,211,153,.35); background:rgba(52,211,153,.08); }
.kvk-badge.is-bad { color:var(--kvk-bad); border-color:rgba(248,113,113,.35); background:rgba(248,113,113,.08); }

.kvk-details summary { cursor:pointer; font-weight:600; font-size:.9rem; }
.kvk-btn { align-self:flex-start; background:var(--kvk-panel-2); color:var(--kvk-text); border:1px solid var(--kvk-line);
  border-radius:8px; padding:8px 12px; font-size:.85rem; cursor:pointer; }
.kvk-btn:hover { border-color:var(--kvk-gold-2); color:var(--kvk-gold); }
.kvk-link { background:none; border:0; color:var(--kvk-muted); font-size:.78rem; cursor:pointer; text-decoration:underline; }
.kvk-link:hover { color:var(--kvk-bad); }
.kvk-note { font-size:.8rem; color:var(--kvk-muted); margin:0; line-height:1.5; }
.kvk-note code { background:var(--kvk-panel-2); padding:1px 5px; border-radius:4px; }

/* Seiten-Modus (eigene Ansicht wie Scanner/Profil) */
.kvk-page .kvk-tabs { position:static; background:transparent; padding:0; }
.kvk-page .kvk-body { padding:16px 0 0; }
.kvk-page .kvk-foot { padding:12px 0 0; }

@media (max-width: 640px) {
  #kvkModal { padding:0; }
  .kvk-window { max-height:100vh; height:100%; border-radius:0; border:0; }
  .kvk-barrow { grid-template-columns:96px 1fr 88px; font-size:.8rem; }
  .kvk-stat-v { font-size:1.15rem; }
}`;
    const style = document.createElement('style');
    style.id = 'kvk-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ------------------------------------------------------------------ *
   * Initialisierung
   * ------------------------------------------------------------------ */
  function init() {
    if (root) return;
    root = document.getElementById('kvkRoot');
    if (!root) return;
    modal = document.getElementById('kvkModal');
    injectStyles();
    root.classList.add('kvk-scope');
    if (!modal) root.classList.add('kvk-page');

    root.addEventListener('input', onInput);
    root.addEventListener('change', onInput);
    root.addEventListener('focusout', onBlur);
    root.addEventListener('click', onClick);

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target.closest('[data-kvk-close]')) close();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
      });
    } else {
      render(); // Ohne Modal: direkt im Container anzeigen
    }

    // Menüpunkt nur im Popup-Modus selbst verdrahten – im Seiten-Modus macht das die index.html
    const menuBtn = modal && document.getElementById('menuKvk');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        const menu = document.getElementById('userMenu');
        if (menu) menu.classList.add('hidden');
        open();
      });
    }
  }

  window.KvKCalc = {
    open,
    close,
    render: () => { if (!root) init(); render(); },
    getState: () => clone(state),
    setState(obj) { state = mergeInto(freshState(), obj); save(); render(); },
    reset() { state = freshState(); save(); render(); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
