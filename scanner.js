// Wiz fan Club – geteilter Kontext zwischen den Modulen: R (window.Rok)
// Module: scanner.js (Kern, Scanner & Dashboard, Rangliste, Navigation, Start) · profil.js · showcase.js · crafting.js

// Icons: fehlt ein Bild unter /icons/gear/… oder /icons/…, wird einmal der jeweils andere Ort versucht
document.addEventListener('error', (ev) => {
  const img = ev.target;
  if (!(img instanceof HTMLImageElement) || img.dataset.iconFb) return;
  let u; try { u = new URL(img.src, location.href); } catch { return; }
  if (u.origin !== location.origin) return;
  const m = u.pathname.match(/^\/icons\/(gear\/)?([^/]+)$/);
  if (!m) return;
  img.dataset.iconFb = '1';
  img.src = (m[1] ? '/icons/' : '/icons/gear/') + m[2];
}, true);

window.RokMods = window.RokMods || {};
window.RokApp = () => {
  const R = window.Rok = {};   // geteilter Kontext (Variablen und Funktionen, die mehrere Module nutzen)
  R.prepareImage = prepareImage; R.parseJson = parseJson; R.vipNumbers = vipNumbers; R.addHistory = addHistory; R.resetHistoryType = resetHistoryType; R.renderHistory = renderHistory; R.renderResLines = renderResLines; R.parseAmount = parseAmount; R.durText = durText; R.applyMode = applyMode; R.applyView = applyView; R.lbLevel = lbLevel; R.lbNext = lbNext; R.govLatest = govLatest;
  // ---------- Storage helpers ----------
  // ---------- Profil ----------
  const PROFILE = RokAuth.current(); R.PROFILE = PROFILE;
  if (!PROFILE) { RokAuth.showLogin(); return; }   // ohne Login startet die App nicht – keine Daten werden geladen
  document.getElementById('userBox').classList.remove('hidden');
  document.getElementById('userName').textContent = PROFILE.name;
  document.getElementById('logoutBtn').onclick = () => RokAuth.logout();

  // Alle App-Keys "rok_scanner_xyz" landen pro Profil unter "rok_data_<profil>_xyz"
  const NS = RokAuth.nsOf(PROFILE.id);
  const nk = (k) => k.startsWith('rok_scanner_') ? NS + k.slice('rok_scanner_'.length) : k;
  const LS = {
    get(k, d = null) { try { const v = localStorage.getItem(nk(k)); return v === null ? d : v; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(nk(k), v); if (k.startsWith('rok_scanner_')) RokAuth.changed(); return true; } catch { return false; } },
    del(k) { try { localStorage.removeItem(nk(k)); if (k.startsWith('rok_scanner_')) RokAuth.changed(); } catch {} }
  }; R.LS = LS;
  const KEY = 'rok_scanner_api_key', MODEL = 'rok_scanner_model', CUR = 'rok_scanner_current_vip';

  const $ = (id) => document.getElementById(id); R.$ = $;
  const fmt = (n) => (Math.round(n) || 0).toLocaleString('de-DE'); R.fmt = fmt;
  const short = (n) => {
    n = Number(n) || 0;
    const d = (x, f) => x.toLocaleString('de-DE', { maximumFractionDigits: f });
    if (n >= 1e9) return d(n / 1e9, 2) + ' Mrd.';
    if (n >= 1e6) return d(n / 1e6, 2) + ' Mio.';
    if (n >= 1e3) return d(n / 1e3, 1) + ' Tsd.';
    return fmt(n);
  }; R.short = short;
  // Item-Bilder aus /icons/… (fehlt img, wird das Emoji gezeigt)
  const ico = (x, cls = 'w-5 h-5') => x && x.img ? `<img src="icons/${x.img}" alt="" draggable="false" loading="lazy" class="${cls} object-contain inline-block align-middle shrink-0">` : (x?.icon || ''); R.ico = ico;
  const AP_IMG = 'ressourcen/ap.png';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); R.esc = esc;

  // ---------- State ----------
  // Zähler-Bereiche: gleiche Logik für Goldheads, Keys und Armaments (Felder = Anzahl je Item)
  // sum: Felder, die zur Gesamtzahl zählen (fehlt sum → keine Gesamtzahl)
  const COUNTERS = {
    goldheads: { title: 'Goldheads', icon: '🗿', c: '#facc15', unit: 'Goldheads',
      fields: [{ k: 'goldheads', label: 'Universelle legendäre Skulpturen', icon: '🗿', c: '#facc15' }] },
    keys: { title: 'Keys', icon: '🔑', img: 'sonstiges/goldkey.png', c: '#fbbf24', unit: 'Keys',
      fields: [{ k: 'key_gold', label: 'Goldene Schlüssel', icon: '🔑', img: 'sonstiges/goldkey.png', c: '#facc15' },
               { k: 'key_silver', label: 'Silberne Schlüssel', icon: '🗝️', img: 'sonstiges/silverkey.png', c: '#cbd5e1' },
               { k: 'key_material', label: 'Material-Schlüssel', icon: '🧰', img: 'sonstiges/materialkey.png', c: '#a78bfa' },
               { k: 'key_sovereign', label: 'Sovereign-Schlüssel', icon: '🗝️', img: 'sonstiges/sovereignkey.png', c: '#34d399' }] },
    armaments: { title: 'Armaments', icon: '🛡️', img: 'geararnaments/anramentchest.png', c: '#f97316', unit: 'Teile', sumLabel: 'Armaments gesamt',
      sum: ['arm_legendary', 'arm_epic', 'arm_elite', 'arm_advanced', 'arm_normal'],
      fields: [{ k: 'arm_legendary', label: 'Legendär', icon: '🟨', img: 'sonstiges/legendary_background.webp', c: '#f5c542' },
               { k: 'arm_epic', label: 'Episch', icon: '🟪', img: 'sonstiges/epic_background.webp', c: '#a855f7' },
               { k: 'arm_elite', label: 'Elite', icon: '🟦', img: 'sonstiges/elite_background.webp', c: '#38bdf8' },
               { k: 'arm_advanced', label: 'Fortgeschritten', icon: '🟩', img: 'sonstiges/advanced_background.webp', c: '#34d399' },
               { k: 'arm_normal', label: 'Normal', icon: '⬜', img: 'sonstiges/common_background.webp', c: '#94a3b8' },
               { k: 'arm_scrolls', label: 'Schriftrollen', icon: '📜', c: '#fb923c' },
               { k: 'arm_chest', label: 'Armament-Truhen', icon: '🧰', img: 'geararnaments/anramentchest.png', c: '#f59e0b' },
               { k: 'arm_chest2', label: 'Armament-Kisten', icon: '🧰', img: 'geararnaments/img_icon_item_2525.png', c: '#a8a29e' },
               { k: 'arm_coin', label: 'Formations-Münzen', icon: '🪙', img: 'geararnaments/FormationMoney.png', c: '#60a5fa' },
               { k: 'arm_coin_gold', label: 'Goldene Formations-Münzen', icon: '🪙', img: 'geararnaments/FormationMoneyGold.png', c: '#facc15' },
               { k: 'arm_conv', label: 'Umwandlungssteine', icon: '💠', img: 'geararnaments/conversation%20stone.png', c: '#38bdf8' },
               { k: 'arm_conv_frag', label: 'Umwandlungsstein-Fragmente', icon: '💠', img: 'geararnaments/conversionStoneFragment.png', c: '#818cf8' },
               { k: 'arm_crystal', label: 'Kristalle', icon: '🔶', img: 'geararnaments/iconCrystal.png', c: '#fb923c' },
               { k: 'arm_trans_crystal', label: 'Transmutationskristalle', icon: '🔮', img: 'geararnaments/transmutation%20crystal.png', c: '#c084fc' },
               { k: 'arm_trans_stone', label: 'Transmutationssteine', icon: '🔶', img: 'geararnaments/transmutstone.png', c: '#f97316' }] }
  }; R.COUNTERS = COUNTERS;
  const CNT_TYPES = Object.keys(COUNTERS);
  const cntTotal = (m, e) => { const cf = COUNTERS[m]; const ks = cf.sum || (cf.fields.length === 1 ? [cf.fields[0].k] : null); if (!ks) return null; return ks.reduce((a, k) => a + (+e[k] || 0), 0); };
  const MODE_KEY = 'rok_scanner_mode'; R.MODE_KEY = MODE_KEY;
  R.mode = ['speedups', 'resources', 'vip', 'gems', 'ap', 'mats', 'passports', ...CNT_TYPES].includes(LS.get(MODE_KEY, '')) ? LS.get(MODE_KEY) : 'resources';
  let images = []; // {id, name, dataUrl, mediaType, base64}
  let vipItems = [];
  let vipCurrent = null;

  // Feste VIP-Schwellenwerte (kumulierte Punkte) – Ziel-Level
  // EINE gemeinsame VIP-Tabelle für die ganze App (VIP-Rechner, Verlauf, Rangliste)
  const VIP_LEVELS = [
    { level: 0, points: 0 },
    { level: 1, points: 10 },
    { level: 2, points: 100 },
    { level: 3, points: 300 },
    { level: 4, points: 1000 },
    { level: 5, points: 2500 },
    { level: 6, points: 10000 },
    { level: 7, points: 25000 },
    { level: 8, points: 45000 },
    { level: 9, points: 75000 },
    { level: 10, points: 150000 },
    { level: 11, points: 250000 },
    { level: 12, points: 350000 },
    { level: 13, points: 500000 },
    { level: 14, points: 750000 },
    { level: 15, points: 1000000 },
    { level: 16, points: 1500000 },
    { level: 17, points: 2500000 },
    { level: 18, points: 4000000 },
    { level: 19, points: 6000000 },
    { level: 20, points: 9000000 }    // SVIP
  ];
  // Anzeigename: Stufe 20 = SVIP
  const vipName = (l) => +l >= 20 ? 'SVIP' : 'VIP ' + l; R.vipName = vipName;
  // Punkte je Stufe (Index = Stufe)
  const VIP_TABLE = VIP_LEVELS.map(x => x.points);
  // Wählbare Ziel-Level im VIP-Rechner
  const VIP_THRESHOLDS = Object.fromEntries(VIP_LEVELS.filter(x => x.level >= 1).map(x => [x.level, x.points]));

  // ---------- Schmiedematerialien ----------
  // 4:1-Umrechnung: 1 Legendär = 4 Episch = 16 Elite = 64 Fortgeschritten = 256 Normal
  const MATS = [
    { k: 'leather', label: 'Leder',       icon: '🐂', img: 'mats/matleatherorange.png', c: '#d97706' },
    { k: 'iron',    label: 'Eisenerz',    icon: '⛓️', img: 'mats/matstoneorange.png', c: '#94a3b8' },
    { k: 'ebony',   label: 'Ebenholz',    icon: '🪵', img: 'mats/matwoodorange.png', c: '#a16207' },
    { k: 'bone',    label: 'Tierknochen', icon: '🦴', img: 'mats/matbonesorange.png', c: '#e5e7eb' }
  ]; R.MATS = MATS;
  const GRADES = [
    { k: 'white',  label: 'Normal',          short: 'W', c: '#cbd5e1', div: 256 },
    { k: 'green',  label: 'Advanced', short: 'G', c: '#4ade80', div: 64 },
    { k: 'blue',   label: 'Elite',           short: 'B', c: '#60a5fa', div: 16 },
    { k: 'purple', label: 'Episch',          short: 'L', c: '#c084fc', div: 4 },
    { k: 'gold',   label: 'Legendär',        short: 'G', c: '#f97316', div: 1 }
  ];
  const MAT_KEYS = MATS.flatMap(m => GRADES.map(g => m.k + '_' + g.k));
  // Material-Kisten (gleiche 5 Seltenheiten) – werden getrennt ganz oben angezeigt
  const CHEST = { k: 'chest', label: 'Kisten', icon: '📦', img: 'mats/choicematchest.png', c: '#b45309' }; R.CHEST = CHEST;
  const CHEST_KEYS = GRADES.map(g => 'chest_' + g.k);
  const ALL_MAT_KEYS = [...CHEST_KEYS, ...MAT_KEYS];
  // Gesamt-Legendär = Gold + Lila/4 + Blau/16 + Grün/64 + Weiß/256
  const matLeg = (e, m) => GRADES.reduce((a, g) => a + (+e[m + '_' + g.k] || 0) / g.div, 0); R.matLeg = matLeg;
  const matTotal = (e) => MATS.reduce((a, m) => a + matLeg(e, m.k), 0);
  const chestLeg = (e) => matLeg(e, 'chest'); R.chestLeg = chestLeg;
  // Auswahl: welche Materialien in die Gesamtsumme zählen (anklickbar, pro Gerät gemerkt)
  const matSel = (() => { try { const v = JSON.parse(localStorage.getItem('rok_mat_sel') || 'null'); if (v && typeof v === 'object') return v; } catch {} return { leather: true, iron: true, ebony: true, bone: true, chest: false }; })();
  const matSelTotal = (e) => [...MATS.map(m => m.k), 'chest'].reduce((a, k) => a + (matSel[k] ? matLeg(e, k) : 0), 0); R.matSelTotal = matSelTotal;
  const fmtLeg = (v) => (Math.round((v || 0) * 100) / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); R.fmtLeg = fmtLeg;

  // AP-Flaschen im Inventar: feste Größen
  const AP_SIZES = [50, 100, 500, 1000];
  const apTotal = (c) => AP_SIZES.reduce((a, z) => a + (Math.max(0, Math.round(+c['ap_' + z] || 0)) * z), 0);

  // Tages-Punkte werden fest im Hintergrund gerechnet (täglicher Login)
  const DAILY_POINTS = 200;

  const TARGET = 'rok_scanner_target_level';
  let targetLevel = +LS.get(TARGET, 18);
  if (!VIP_THRESHOLDS[targetLevel]) targetLevel = 18;
  $('targetLevel').innerHTML = Object.entries(VIP_THRESHOLDS).sort((a, b) => b[0] - a[0])   // VIP 18 oben
    .map(([lv, pts]) => `<option value="${lv}">${vipName(lv)} – ${fmt(pts)} Punkte</option>`).join('');
  $('targetLevel').value = targetLevel;
  const targetPoints = () => VIP_THRESHOLDS[targetLevel];
  const dailyPoints = () => DAILY_POINTS;
  const refreshVipViews = () => {
    if (!$('vipSection').classList.contains('hidden')) renderVip();
    if (typeof renderHistory === 'function') renderHistory();
  };
  $('targetLevel').addEventListener('change', () => { targetLevel = +$('targetLevel').value; LS.set(TARGET, targetLevel); refreshVipViews(); });

  // "Y Tage (Z Jahre/Monate)"
  function durationText(days) {
    const d = Math.ceil(days);
    if (d < 45) return `${fmt(d)} ${d === 1 ? 'Tag' : 'Tagen'}`;
    const totalMonths = Math.round(d / 30.44);
    const y = Math.floor(totalMonths / 12), m = totalMonths % 12;
    const parts = [];
    if (y) parts.push(`${y} ${y === 1 ? 'Jahr' : 'Jahren'}`);
    if (m) parts.push(`${m} ${m === 1 ? 'Monat' : 'Monaten'}`);
    return `${fmt(d)} Tagen (≈ ${parts.join(' und ')})`;
  }
  function targetDate(days) {
    const t = new Date(); t.setDate(t.getDate() + Math.ceil(days));
    return t.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  // ---------- Settings ----------
  // VIP-Feld: zeigt Tausenderpunkte (1.961.265), gespeichert wird die reine Zahl
  const vipInputNum = () => { const d = $('currentVip').value.replace(/\D/g, ''); return d === '' ? null : +d; };
  const setVipInput = (v) => { const d = String(v ?? '').replace(/\D/g, ''); $('currentVip').value = d === '' ? '' : (+d).toLocaleString('de-DE'); };
  setVipInput(LS.get(CUR, ''));
  $('currentVip').addEventListener('input', () => {
    const el = $('currentVip'), digitsBefore = el.value.slice(0, el.selectionStart ?? el.value.length).replace(/\D/g, '').length;
    const n = vipInputNum();
    setVipInput(n);
    // Cursor hinter dieselbe Ziffer setzen
    let pos = 0, seen = 0; while (pos < el.value.length && seen < digitsBefore) { if (/\d/.test(el.value[pos])) seen++; pos++; }
    try { el.setSelectionRange(pos, pos); } catch {}
    LS.set(CUR, n == null ? '' : String(n));
    vipCurrent = n == null ? vipCurrent : n;
    if (!$('vipSection').classList.contains('hidden')) renderVip();
    else { pushRanking(); renderCredits(); }
  });

  // ---------- Mode ----------
  const hints = {
    auto: 'Claude erkennt selbst, ob es eine Ressourcen-Übersicht oder Inventar mit VIP-Packs ist.',
    resources: 'Liest Proviant, Holz, Stein und Gold – aus der Ressourcenleiste oder dem Ressourcen-Inventar.',
    vip: 'Liest VIP-Punkte-Kacheln aus dem Inventar (Wert × Anzahl) und berechnet den Weg zu deinem Ziel-Level.',
    gems: 'Liest die Anzahl deiner Edelsteine und speichert sie im Verlauf.',
    mats: 'Liest Leder, Eisenerz, Ebenholz und Tierknochen in allen Seltenheiten und rechnet sie in Legendär um.',
    ap: 'Liest deine AP-Flaschen (50, 100, 500, 1.000) aus dem Inventar, füllt die 4 Felder vor und rechnet die Gesamt-AP aus.',
    speedups: 'Liest deine Beschleuniger (Universal, Bau, Forschung, Training, Heilung) aus dem Inventar und rechnet die Gesamtzeit aus.'
  };
  document.querySelectorAll('.seg-btn[data-mode]').forEach(b => b.onclick = () => {
    R.mode = b.dataset.mode;
    LS.set(MODE_KEY, R.mode);
    hideError();
    applyMode();
  });

  // ---------- Upload ----------
  const dz = $('dropzone');
  ['dragenter','dragover'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); dz.classList.add('drop-active'); }));
  ['dragleave','drop'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); dz.classList.remove('drop-active'); }));
  dz.addEventListener('drop', ev => addFiles(ev.dataTransfer.files));
  $('fileInput').addEventListener('change', ev => { addFiles(ev.target.files); ev.target.value = ''; });
  window.addEventListener('paste', ev => {
    const files = [...(ev.clipboardData?.items || [])].filter(i => i.type.startsWith('image/')).map(i => i.getAsFile());
    if (files.length) addFiles(files);
  });

  async function addFiles(fileList) {
    const files = [...fileList].filter(f => f && f.type.startsWith('image/'));
    for (const f of files) {
      if (images.length >= 5) { showError('Maximal 5 Bilder pro Analyse.'); break; }
      try { images.push({ id: crypto.randomUUID?.() || String(Math.random()), name: f.name || 'Screenshot', ...(await prepareImage(f)) }); }
      catch { showError(`„${f.name}" konnte nicht gelesen werden.`); }
    }
    renderThumbs();
  }

  // Bild verkleinern (spart Tokens, max. ~1800px lange Seite) und als JPEG kodieren
  async function prepareImage(file) {
    const img = await hqLoadImage(file);
    const max = 1600, s = Math.min(1, max / Math.max(img.width, img.height));
    const c = hqResize(img, Math.round(img.width * s), Math.round(img.height * s));
    img.close?.();
    const dataUrl = c.toDataURL('image/jpeg', 0.85);
    return { dataUrl, mediaType: 'image/jpeg', base64: dataUrl.split(',')[1] };
  }

  function renderThumbs() {
    $('thumbs').innerHTML = images.map(im => `
      <div class="relative group rounded-lg overflow-hidden border border-ink-600 aspect-video bg-ink-950">
        <img src="${im.dataUrl}" class="w-full h-full object-cover" alt="${esc(im.name)}">
        <button data-id="${im.id}" class="rm absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-xs opacity-0 group-hover:opacity-100 hover:bg-red-600 transition" title="Entfernen">✕</button>
      </div>`).join('');
    $('thumbs').querySelectorAll('.rm').forEach(b => b.onclick = (e) => { e.preventDefault(); images = images.filter(i => i.id !== b.dataset.id); renderThumbs(); });
    updateAnalyzeBtn();
  }
  function updateAnalyzeBtn() { $('analyzeBtn').disabled = !images.length; }

  // ---------- Claude API ----------

  async function analyze() {
    hideError();
    setLoading(true);
    $('discardMsg').classList.add('hidden');
    let content = null, body = null;
    try {
      content = images.map(im => ({ media_type: im.mediaType, data: im.base64 }));
      body = JSON.stringify({ mode: R.mode, images: content });
      content = null;
      if (body.length > 4_200_000) throw new Error('Die Bilder sind zusammen zu groß. Bitte weniger Screenshots auf einmal hochladen.');
      const res = await fetch('/api/scan', { method: 'POST', headers: { 'content-type': 'application/json' }, body });
      body = null;
      const data = await res.json().catch(() => ({}));
      const modeRejected = !res.ok && (res.status === 400 || /modus|mode/i.test(data?.error || ''));
      if (modeRejected && R.mode === 'ap') {
        showResult(await localApScan());                         // Server kennt „ap“ (noch) nicht → lokal auslesen, Felder vorbefüllen
        discardImages();
        return;
      }
      if (modeRejected && COUNTERS[R.mode]) throw new Error(`Der Scan-Server kennt den ${COUNTERS[R.mode].title}-Scan noch nicht – bitte die neue api/scan.js auf Vercel einspielen. Bis dahin kannst du die Anzahl links von Hand eintragen.`);
      if (modeRejected && R.mode === 'passports') throw new Error('Der Scan-Server kennt den Passport-Scan noch nicht – bitte die neue api/scan.js auf Vercel einspielen. Bis dahin kannst du die Anzahl links von Hand eintragen.');
      if (modeRejected && R.mode === 'mats') throw new Error('Der Scan-Server kennt den Material-Scan noch nicht – bitte die neue api/scan.js auf Vercel einspielen. Bis dahin kannst du die Materialien links von Hand eintragen.');
      if (modeRejected && R.mode === 'speedups') {
        $('speedInputs').scrollIntoView({ behavior: 'smooth', block: 'center' });
        throw new Error('Der Scan-Server (/api/scan) kennt den Speedup-Scan noch nicht. Trag deinen Bestand links unter „Speedups eingeben“ ein – das wird normal gespeichert.');
      }
      if (!res.ok) {
        if (res.status === 404) throw new Error('Server-Route /api/scan nicht gefunden. Die Seite muss über Vercel laufen (nicht als lokale Datei).');
        if (res.status === 413) throw new Error('Die Bilder sind zu groß. Bitte weniger Screenshots auf einmal hochladen.');
        if (res.status === 429) throw new Error('Gerade zu viele Anfragen. Kurz warten und erneut versuchen.');
        throw new Error(data?.error || `Serverfehler ${res.status}`);
      }
      const text = String(data.text || '');
      const parsed = parseJson(text);
      if (!parsed) throw new Error('Die Antwort konnte nicht ausgelesen werden. Bitte erneut versuchen.');
      showResult(parsed);
      discardImages(); // erfolgreich ausgelesen → Bilder sofort verwerfen
      setAreaTab('dash');   // Ergebnis anzeigen
    } catch (e) {
      showError(e.message === 'Failed to fetch' ? 'Netzwerkfehler – keine Verbindung zur API. Prüfe Internet/Adblocker.' : e.message);
      $('emptyState').classList.toggle('hidden', !$('resSection').classList.contains('hidden') || !$('vipSection').classList.contains('hidden'));
    } finally { content = null; body = null; setLoading(false); applyMode(); }
  }

  // ---------- Lokale Texterkennung für AP (Tesseract.js, läuft komplett im Browser) ----------
  let tessP = null;
  const loadTesseract = () => tessP || (tessP = new Promise((resolve, reject) => {
    if (window.Tesseract) return resolve(window.Tesseract);
    const sc = document.createElement('script');
    sc.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    sc.onload = () => resolve(window.Tesseract);
    sc.onerror = () => { tessP = null; reject(new Error('Texterkennung (Tesseract) konnte nicht geladen werden. Trag deine AP links unter „AP eingeben“ ein.')); };
    document.head.appendChild(sc);
  })); R.loadTesseract = loadTesseract;
  const toInt = (t) => +String(t).replace(/[^\d]/g, '');
  // Erkennt Flaschen-Kacheln: „1.000 AP … x12“ / „500 AP … ×3“; sonst Paare aus Größen- und Mengenangaben in Lesereihenfolge
  function parseApBottles(text) {
    const t = String(text || '').replace(/[Oo](?=\d)|(?<=\d)[Oo]/g, '0');
    const sizeOf = (v) => { v = toInt(v); return AP_SIZES.includes(v) ? v : null; };
    const c = {}; let hits = 0;
    const add = (z, q) => { if (z && q >= 0 && q < 1e6) { c['ap_' + z] = (c['ap_' + z] || 0) + q; hits++; } };
    for (const line of t.split(/\n+/)) {
      const m = line.match(/\b(1[.,]?000|500|100|50)\s*(?:AP|Aktionspunkte|Action\s*Points?)\b.*?[x×]\s*(\d[\d.,]*)/i);
      if (m) add(sizeOf(m[1]), toInt(m[2]));
    }
    // Gegenstandsliste: „Stelle 50 Aktionspunkte wieder her. Du besitzt: 4.656“ / „Restores 50 AP … Owned: 4,656“
    if (!hits) for (const m of t.matchAll(/(?:Stelle|Restores?)\s+(1[.,]?000|500|100|50)\s*(?:Aktionspunkte|AP|Action\s*Points?)[\s\S]{0,120}?(?:besitzt|Owned|Own)\s*:?\s*(\d[\d.,]*)/gi)) add(sizeOf(m[1]), toInt(m[2]));
    if (!hits) {
      const sizes = [...t.matchAll(/\b(1[.,]?000|500|100|50)\s*(?:AP|Aktionspunkte|Action)/gi)].map(m => sizeOf(m[1]));
      const qty = [...t.matchAll(/[x×]\s*(\d[\d.,]*)/g)].map(m => toInt(m[1]));
      if (sizes.length && sizes.length === qty.length) sizes.forEach((z, i) => add(z, qty[i]));
    }
    return hits ? c : null;
  }
  async function localApScan() {
    $('analyzeLabel').textContent = 'Lese AP lokal …';
    const T = await loadTesseract();
    for (const im of images) {
      const { data } = await T.recognize(im.dataUrl, 'eng');
      const c = parseApBottles(data?.text);
      if (c) return { ...c, confidence: 'OCR lokal' };
    }
    throw new Error('Der Scan-Server kennt den AP-Scan noch nicht (die neue api/scan.js ist nicht deployt), und die Notfall-Erkennung im Browser hat die Flaschen nicht sicher erkannt. Bitte die neue api/scan.js auf Vercel einspielen – bis dahin die Anzahl je Flaschengröße links eintragen.');
  }

  // Entfernt alle Bilddaten aus der Seite: Array-Referenzen, Base64-Strings, <img>-Elemente, Datei-Input.
  // Danach hält die Seite keine Referenz mehr – der Browser gibt den Speicher bei der nächsten Garbage Collection frei.
  function discardImages() {
    images.forEach(im => { im.base64 = null; im.dataUrl = null; });
    images.length = 0;
    images = [];
    $('thumbs').querySelectorAll('img').forEach(img => { img.removeAttribute('src'); img.remove(); });
    $('thumbs').innerHTML = '';
    $('fileInput').value = '';
    $('discardMsg').classList.remove('hidden');
    updateAnalyzeBtn();
  }
  $('analyzeBtn').onclick = analyze;

  function parseJson(t) {
    try { return JSON.parse(t); } catch {}
    const m = t.match(/\{[\s\S]*\}/); if (!m) return null;
    try { return JSON.parse(m[0]); } catch { return null; }
  }

  function setLoading(on) {
    $('analyzeBtn').disabled = on || !images.length;
    $('analyzeLabel').textContent = on ? 'Analysiere …' : (R.mode === 'mats' ? 'Materialien scannen' : 'Analysieren');
    $('loadingState').classList.toggle('hidden', !on);
    if (on) { ['emptyState','resSection','vipSection','gemsSection','speedSection','apSection','passSection','cntSection'].forEach(id => $(id).classList.add('hidden')); }
  }
  function showError(m) { $('errorBox').textContent = m; $('errorBox').classList.remove('hidden'); }
  function hideError() { $('errorBox').classList.add('hidden'); }

  // ---------- Results ----------
  function showResult(r) {
    let type = R.mode;
    $('emptyState').classList.add('hidden');
    if (type === 'speedups') {
      const raw = r.speedups || r, sp = { ...raw, healing: raw.healing ?? raw.heal }, ts = Date.now(), e = {};
      SPEED.forEach(c => e[c.k] = Math.max(0, Math.round(num(sp[c.k]) || 0)));
      e.total = SPEED.reduce((a, c) => a + e[c.k], 0);
      if (!e.total) throw new Error('Keine Speedups im Screenshot erkannt.');
      renderSpeedups(e, ts);
      addHistory({ id: newId(), ts, type: 'speedups', ...e, confidence: r.confidence || null });
      saveLastScan({ type: 'speedups', ts, ...e });
      RokAuth.saveNow('speedups');
    } else if (type === 'mats') {
      prefillMats(r);                                            // sofort auswerten, Felder zum Korrigieren füllen
    } else if (COUNTERS[type]) {
      prefillCnt(type, r);
    } else if (type === 'passports') {
      prefillPass(r);
    } else if (type === 'ap') {
      prefillAp(r);                                              // nicht sofort speichern: Nutzer prüft die 4 Felder
    } else if (type === 'gems') {
      const hand = num(r.gems_hand), bag = num(r.gems_bag), ts = Date.now();
      const g = (hand != null || bag != null) ? (hand || 0) + (bag || 0) : num(r.gems);
      if (g == null) throw new Error('Keine Edelsteine im Screenshot erkannt.');
      const ge = { gems: g, gemsHand: hand ?? (bag == null ? g : null), gemsBag: bag };
      renderGems(ge, ts);
      addHistory({ id: newId(), ts, type: 'gems', ...ge, confidence: r.confidence || null });
      saveLastScan({ type: 'gems', ts, ...ge });
    } else if (type === 'resources') {
      const vals = renderResources(r);
      const entry = { id: newId(), ts: Date.now(), type: 'resources', confidence: r.confidence || null };
      vals.forEach(v => { entry[v.k] = v.total; entry[BK[v.k]] = v.inv || 0; });
      entry.total = vals.reduce((a, v) => a + v.total, 0);
      Object.assign(entry, farmSnapshot());
      addHistory(entry);
      renderFarms();
      saveLastScan({ type: 'resources', ts: entry.ts, confidence: r.confidence || null, notes: r.notes || '',
        resources: normRes(r.resources) });
    } else {
      vipItems = (r.vip?.items || []).map(i => ({ name: i.name || `${i.points_each} VIP-Punkte`, points: +i.points_each || 0, qty: +i.quantity || 0 }));
      const manual = vipInputNum();
      let cur = manual != null ? manual : r.vip?.current_points;
      if ((cur === null || cur === undefined) && r.vip?.current_level != null && r.vip?.progress_in_level != null) {
        cur = (VIP_TABLE[r.vip.current_level] || 0) + (+r.vip.progress_in_level || 0);
      }
      vipCurrent = cur ?? null;
      if (manual == null && vipCurrent != null) setVipInput(vipCurrent);
      activeVipEntryId = newId();
      vipScanLoaded = true;
      addHistory({ id: activeVipEntryId, ts: Date.now(), type: 'vip', confidence: r.confidence || null, ...vipNumbers() });
      renderVip(r);
      pushRanking(true);   // neuer Scan → Rangliste
    }
  }
  let activeVipEntryId = null;
  let vipScanLoaded = false, hasRes = false, hasVip = false, hasGems = false, hasSpeed = false, hasAp = false, hasMats = false, hasPass = false;
  const LAST = 'rok_scanner_last_scan';
  const saveLastScan = (data) => LS.set(LAST + '_' + data.type, JSON.stringify(data));
  const newId = () => (crypto.randomUUID?.() || String(Date.now() + Math.random())); R.newId = newId;
  // Rangliste: aktuelle VIP-Punkte + VIP durch Gegenstände (Rucksack)
  function pushRanking(force = false) {
    const n = vipNumbers();
    if (n.current == null && !n.inventory) return;
    RokAuth.pushVip(n.after, lbLevel(n.after), force);
  }
  function vipNumbers() {
    const inventory = vipItems.reduce((a, i) => a + i.points * i.qty, 0);
    const current = vipCurrent ?? null;
    return { current, inventory, after: (current ?? 0) + inventory };
  }

  const RES = [
    { k: 'food',  label: 'Proviant', icon: '🌾', img: 'ressourcen/corn.png', from: '#fbbf24', to: '#d97706' },
    { k: 'wood',  label: 'Holz',     icon: '🪵', img: 'ressourcen/wood.png', from: '#a3e635', to: '#65a30d' },
    { k: 'stone', label: 'Stein',    icon: '🪨', img: 'ressourcen/stone.png', from: '#cbd5e1', to: '#64748b' },
    { k: 'gold',  label: 'Gold',     icon: '🪙', img: 'ressourcen/gold.png', from: '#fde047', to: '#ca8a04' },
  ];

  // {food:{rucksack,aufHand,gesamt}} → {bar:{food:gesamt}, inventory:{food:rucksack}}; Auf Hand = Gesamt − Rucksack
  function normRes(res) {
    res = res || {};
    if (res.bar || res.inventory) return { bar: res.bar || {}, inventory: res.inventory || {} };
    const bar = {}, inventory = {};
    ['food', 'wood', 'stone', 'gold'].forEach(k => {
      const o = res[k] || {}, rs = num(o.rucksack), hand = num(o.aufHand);
      let g = num(o.gesamt);
      if (g == null && hand != null) g = hand + (rs || 0);
      bar[k] = g; inventory[k] = rs;
    });
    return { bar, inventory };
  }

  let lastResR = null;
  function renderResources(r) {
    lastResR = r;
    const nr = normRes(r.resources), bar = nr.bar, inv = nr.inventory;
    const raw = RES.map(x => ({ ...x, bar: num(bar[x.k]), inv: num(inv[x.k]) }))
                    // Leiste = Gesamtressourcen (inkl. Inventar) → nicht addieren; Inventar nur als Ersatz, wenn keine Leiste sichtbar
                    .map(x => ({ ...x, total: x.bar ?? x.inv ?? 0 }));
    // Anzeige: optional + Farmen (gespeichert wird immer der reine Main-Wert)
    const withFarm = typeof resCardFarm !== 'undefined' && resCardFarm;
    const vals = raw.map(x => { const f = withFarm ? farmSum(x.k) : 0; return { ...x, farm: f, total: x.total + f }; });
    const max = Math.max(1, ...vals.map(v => v.total));
    const sum = vals.reduce((a, v) => a + v.total, 0);
    $('resCards').innerHTML = vals.map(v => `
      <div class="panel rounded-2xl p-5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-xl grid place-items-center text-2xl" style="background:linear-gradient(135deg,${v.from}33,${v.to}22);border:1px solid ${v.from}55">${ico(v, 'w-9 h-9')}</div>
            <div>
              <div class="text-xs uppercase tracking-widest text-slate-400">${v.label}</div>
              <div class="text-2xl font-bold text-white">${v.total ? short(v.total) : '–'}</div>
            </div>
          </div>
          <div class="text-right text-xs text-slate-500">${sum ? Math.round(v.total / sum * 100) + ' %' : ''}</div>
        </div>
        <div class="mt-4 h-2.5 rounded-full bg-ink-950 overflow-hidden">
          <div class="bar h-full rounded-full" style="width:0;background:linear-gradient(90deg,${v.from},${v.to})" data-w="${v.total / max * 100}"></div>
        </div>
        <div class="mt-4 grid grid-cols-3 gap-2 text-center">
          <div class="rounded-lg bg-ink-950/60 border border-ink-700 px-2 py-2">
            <div class="text-[10px] uppercase tracking-wider text-slate-500">Gesamt</div>
            <div class="text-sm font-semibold text-white tabular-nums">${v.total ? short(v.total) : '–'}</div>
          </div>
          <div class="rounded-lg bg-ink-950/60 border border-ink-700 px-2 py-2">
            <div class="text-[10px] uppercase tracking-wider text-slate-500">Rucksack</div>
            <div class="text-sm font-semibold text-sky-300 tabular-nums">${v.inv != null ? short(v.inv) : '–'}</div>
          </div>
          <div class="rounded-lg bg-ink-950/60 border border-gold-500/30 px-2 py-2">
            <div class="text-[10px] uppercase tracking-wider text-slate-500">Auf Hand</div>
            <div class="text-sm font-semibold text-gold-300 tabular-nums">${v.total ? short(Math.max(0, v.total - (v.inv || 0))) : '–'}</div>${v.farm ? `<div class="text-[10px] text-orange-300 tabular-nums">inkl. ${short(v.farm)} Farms</div>` : ''}
          </div>
        </div>
      </div>`).join('');
    // Gesamt = nur Main · Farm Gesamt = alle Farmen · Main + Farm Gesamt = beides
    const mainSum = raw.reduce((a, v) => a + v.total, 0), farmAll = RES.reduce((a, r) => a + farmSum(r.k), 0);
    $('resTotal').textContent = fmt(mainSum);
    $('resFarmTotal').textContent = fmt(farmAll);
    $('resAllTotal').textContent = fmt(mainSum + farmAll);
    $('resSource').textContent = r.confidence ? `Erkennungssicherheit: ${r.confidence}` : '';
    $('resSection').classList.remove('hidden');
    hasRes = true;
    animateBars();
    return raw;
  }
  const num = (v) => (v === null || v === undefined || v === '' || isNaN(+v)) ? null : +v; R.num = num;

  function levelFor(points) { let l = 0; VIP_TABLE.forEach((t, i) => { if (points >= t) l = i; }); return l; }

  // 100 VIP-Punkte = 50.000 Bündnis-Credits → 500 Credits je VIP-Punkt
  const CREDITS_PER_VIP = 500;
  function renderCredits() {
    const box = $('creditSection');
    const n = vipNumbers(), show = R.mode === 'vip' && (n.current != null || n.inventory > 0);
    box.classList.toggle('hidden', !show);
    if (!show) return;
    const p = n.after, nx = lbNext(p);
    const line = (label, miss) => `<div class="rounded-xl bg-ink-950/60 border border-ink-700 px-4 py-3">
        <div class="text-[10px] uppercase tracking-widest text-slate-400">${label}</div>
        <div class="mt-1 text-sm text-slate-300"><b class="text-white tabular-nums">${fmt(miss)}</b> Punkte fehlen → <b class="text-gold-300 tabular-nums">${fmt(miss * CREDITS_PER_VIP)}</b> Bündnis-Credits benötigt</div>
      </div>`;
    const toTarget = targetPoints() - p;
    box.innerHTML = `
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 shrink-0 rounded-2xl grid place-items-center text-3xl" style="background:linear-gradient(135deg,#f5c54233,#b7830f22);border:1px solid #f5c54255">🤝</div>
        <div class="min-w-0">
          <div class="text-xs uppercase tracking-widest text-slate-400">Benötigte Bündnis-Credits${nx.max ? '' : ` · bis ${vipName(nx.next)}`}</div>
          <div class="text-3xl sm:text-4xl font-extrabold text-gold-300 tabular-nums">${nx.max ? '–' : fmt(nx.need * CREDITS_PER_VIP)}</div>
          <div class="text-sm text-slate-300 mt-0.5">${nx.max ? 'Max Level erreicht 👑' : `<b class="text-white tabular-nums">${fmt(nx.need)}</b> Punkte fehlen bis ${vipName(nx.next)} → <b class="text-gold-300 tabular-nums">${fmt(nx.need * CREDITS_PER_VIP)}</b> Bündnis-Credits benötigt`}</div>
        </div>
      </div>
      ${toTarget > 0 && (nx.max || targetLevel > nx.next) ? `<div class="mt-4">${line(`Bis zum Ziel ${vipName(targetLevel)}`, toTarget)}</div>` : ''}
      <p class="mt-3 text-[11px] text-slate-500">Grundlage: 100 VIP-Punkte = 50.000 Bündnis-Credits (500 Credits je Punkt). Gerechnet mit ${fmt(p)} VIP-Punkten inkl. Gegenständen.</p>`;
  }

  function renderVip(r) {
    const inv = vipItems.reduce((a, i) => a + i.points * i.qty, 0);
    const cur = vipCurrent ?? 0;
    const after = cur + inv;
    $('vipCurrent').textContent = vipCurrent == null ? 'unbekannt' : fmt(cur);
    $('vipInv').textContent = '+' + fmt(inv);
    $('vipAfter').textContent = fmt(after);

    $('vipTargets').innerHTML = targetCard(cur, after);

    // Erkannte Items (linke Spalte) – Punkte/Stk. fest, nur Anzahl änderbar
    vipItems.sort((a, b) => a.points - b.points);   // kleinster Token oben, größter unten
    $('vipRows').innerHTML = vipItems.length ? vipItems.map((i, idx) => `
      <tr class="border-b border-ink-800">
        <td class="py-1.5 pr-1"><span class="inline-flex items-center gap-1 font-semibold text-slate-200"><span class="text-gold-400">◆</span>${fmt(i.points)}</span></td>
        <td class="py-1.5 px-1"><input data-i="${idx}" type="number" min="0" value="${i.qty}" aria-label="Anzahl ${fmt(i.points)}er Tokens"
              class="w-16 ml-auto block text-right bg-ink-950/60 border border-ink-700 rounded px-1.5 py-1 focus:outline-none focus:border-gold-500"></td>
        <td class="py-1.5 pl-1 text-right font-semibold text-gold-300 whitespace-nowrap tabular-nums">${fmt(i.points * i.qty)}</td>
        <td class="text-right"><button data-del="${idx}" class="text-slate-500 hover:text-red-400 px-1" title="Entfernen">✕</button></td>
      </tr>`).join('')
      : `<tr><td colspan="4" class="py-4 text-center text-slate-500">Keine VIP-Items erkannt.</td></tr>`;
    $('vipRowsTotal').textContent = fmt(inv);
    $('vipItemsBox').classList.remove('hidden');

    $('vipRows').querySelectorAll('input').forEach(inp => inp.addEventListener('change', () => {
      vipItems[+inp.dataset.i].qty = Math.max(0, Math.round(+inp.value || 0));
      renderVip();
    }));
    $('vipRows').querySelectorAll('[data-del]').forEach(b => b.onclick = () => { vipItems.splice(+b.dataset.del, 1); renderVip(); });

    $('vipSection').classList.remove('hidden');
    $('emptyState').classList.add('hidden');
    hasVip = true;
    animateBars();
    if (vipScanLoaded) saveLastScan({ type: 'vip', ts: Date.now(), entryId: activeVipEntryId, current: vipCurrent,
      items: vipItems.map(i => ({ name: i.name, points: i.points, qty: i.qty })) });
    // Korrekturen in der Tabelle / am aktuellen Stand übernehmen den letzten VIP-Scan im Verlauf
    if (activeVipEntryId) updateHistory(activeVipEntryId, vipNumbers());
    pushRanking();
    renderCredits();
  }
  const pct = (v) => v.toFixed(1).replace('.', ',');

  // Große Ziel-Karte: Fortschritt, fehlende Punkte, Hochrechnung in Tagen, Zwischenstufen
  function targetCard(cur, after) {
    const target = targetPoints(), daily = dailyPoints();
    const missing = Math.max(0, target - after);
    const done = missing === 0;
    const pCur = Math.min(100, cur / target * 100), pAfter = Math.min(100, after / target * 100);
    const days = daily > 0 ? missing / daily : Infinity;

    // Nur noch nicht erreichte Zwischenstufen
    const open = Object.entries(VIP_THRESHOLDS).filter(([lv, pts]) => +lv <= targetLevel && after < pts);

    const ticks = open.filter(([lv]) => +lv < targetLevel).map(([lv, pts]) => {
      const left = pts / target * 100;
      return `<div class="absolute inset-y-0 w-px bg-white/25" style="left:${left}%"></div>
              <div class="absolute top-full mt-1 -translate-x-1/2 text-[10px] text-slate-500" style="left:${left}%">${+lv >= 20 ? 'S' : lv}</div>`;
    }).join('');

    const headline = done
      ? `<div class="text-2xl sm:text-3xl font-bold text-emerald-300">${vipName(targetLevel)} erreicht! 🎉</div>`
      : `<div class="grid grid-cols-2 gap-4">
           <div>
             <div class="text-xs uppercase tracking-widest text-slate-400">Fehlende Punkte</div>
             <div class="text-3xl sm:text-4xl font-extrabold text-white mt-1 tabular-nums">${fmt(missing)}</div>
           </div>
           <div>
             <div class="text-xs uppercase tracking-widest text-slate-400">Benötigte Tage</div>
             <div class="text-3xl sm:text-4xl font-extrabold text-gold-300 mt-1 tabular-nums">${fmt(Math.ceil(days))}</div>
           </div>
         </div>`;

    const milestones = open.filter(([lv]) => +lv < targetLevel).map(([lv, pts]) => {
      const miss = pts - after;
      return `<div class="rounded-lg border border-ink-700 bg-ink-950/50 px-3 py-2">
        <div class="text-xs font-semibold text-slate-200">${vipName(lv)}</div>
        <div class="text-[11px] mt-0.5 text-slate-400 tabular-nums">${fmt(miss)} Pkt.</div>
        <div class="text-[11px] text-gold-300/80 tabular-nums">${fmt(Math.ceil(miss / daily))} Tage</div>
      </div>`;
    }).join('');

    return `
    <div class="panel rounded-2xl p-6 ${done ? 'ring-1 ring-emerald-500/40' : 'ring-1 ring-gold-500/30'}">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div class="font-display text-2xl ${done ? 'text-emerald-300' : 'gold-text'}">Ziel: ${vipName(targetLevel)}</div>
        <div class="text-sm text-slate-400">${fmt(target)} Punkte</div>
      </div>
      ${headline}
      <div class="mt-6 mb-6">
        <div class="relative h-5 rounded-full bg-ink-950 border border-ink-700">
          <div class="absolute inset-0 rounded-full overflow-hidden">
            <div class="bar absolute inset-y-0 left-0 bg-gradient-to-r from-sky-400/40 to-sky-500/40" style="width:0" data-w="${pAfter}"></div>
            <div class="bar absolute inset-y-0 left-0 bg-gradient-to-r from-gold-400 to-gold-600" style="width:0" data-w="${pCur}"></div>
          </div>
          ${ticks}
        </div>
      </div>
      <div class="flex flex-wrap justify-between gap-2 text-xs">
        <span class="flex items-center gap-1.5 text-slate-400"><i class="inline-block w-3 h-3 rounded-sm bg-gold-500"></i>Aktueller Stand ${pct(pCur)} %</span>
        <span class="flex items-center gap-1.5 text-slate-400"><i class="inline-block w-3 h-3 rounded-sm bg-sky-500/60"></i>+ Rucksack-VIP → <b class="text-white">${pct(pAfter)} %</b></span>
      </div>
    </div>`;
  }

  $('showVipCalc').onclick = () => {
    if (vipCurrent == null && vipInputNum() != null) vipCurrent = vipInputNum();
    $('emptyState').classList.add('hidden');
    renderVip();
    $('vipSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };


  function animateBars() {
    requestAnimationFrame(() => requestAnimationFrame(() =>
      document.querySelectorAll('.bar[data-w]').forEach(b => b.style.width = b.dataset.w + '%')));
  }

  // ---------- Verlauf (nur Zahlen, keine Bilder) ----------
  const HIST = 'rok_scanner_history_v1';
  R.history = [];
  try { R.history = JSON.parse(LS.get(HIST, '[]')) || []; } catch { R.history = []; }
  // Altdaten-Schutz: nur bekannte Zahlenfelder übernehmen
  const sanitize = (e) => {
    const out = { id: String(e.id), ts: +e.ts || Date.now(), type: ['vip', 'gems', 'speedups', 'ap', 'governor', 'materials', 'passports', ...CNT_TYPES].includes(e.type) ? e.type : 'resources', confidence: e.confidence ?? null };
    const keys = COUNTERS[out.type] ? COUNTERS[out.type].fields.map(f => f.k) : out.type === 'vip' ? ['current', 'inventory', 'after'] : out.type === 'passports' ? ['passports', 'required'] : out.type === 'gems' ? ['gems', 'gemsHand', 'gemsBag'] : out.type === 'ap' ? ['ap_50', 'ap_100', 'ap_500', 'ap_1000', 'total_ap'] : out.type === 'materials' ? [...ALL_MAT_KEYS, 'total_leg'] : out.type === 'governor' ? ['kill_points', 'highest_merit', 'acclaim', 'energy', 'deads', 'ark_wins', 'lk_autarch', 'lk_participated', 'units_killed', 'units_lost', 'units_healed', 'governor_id']
      : out.type === 'speedups' ? ['universal', 'building', 'research', 'training', 'healing', 'total']
      : ['food', 'wood', 'stone', 'gold', 'total', 'farmFood', 'farmWood', 'farmStone', 'farmGold', 'bagFood', 'bagWood', 'bagStone', 'bagGold'];
    keys.forEach(k => out[k] = (e[k] === null || e[k] === undefined || isNaN(+e[k])) ? null : +e[k]);
    if (out.type === 'ap' && out.total_ap == null && e.ap != null && !isNaN(+e.ap)) out.total_ap = +e.ap;   // ältere AP-Einträge
    if (out.type === 'governor' && e.src === 'manual') out.src = 'manual';                                  // von Hand eingetragen
    return out;
  }; R.sanitize = sanitize;
  R.history = R.history.filter(e => e && e.id).map(sanitize);

  let histTab = 'resources', chartType = 'line', chart = null;
  R.onHistoryChange = null;   // wird vom Game Profil gesetzt (Live-Aktualisierung)
  const saveHistory = () => { if (!LS.set(HIST, JSON.stringify(R.history))) showError('Verlauf konnte nicht gespeichert werden (LocalStorage blockiert oder voll).'); if (R.onHistoryChange) R.onHistoryChange(); }; R.saveHistory = saveHistory;
  function addHistory(entry) {
    R.history.push(sanitize(entry)); saveHistory();
    histTab = entry.type; syncTabs(); renderHistory();
  }
  function updateHistory(id, patch) {
    const i = R.history.findIndex(e => e.id === id); if (i < 0) return;
    R.history[i] = sanitize({ ...R.history[i], ...patch }); saveHistory(); renderHistory();
  }
  function deleteEntry(id) {
    RokAuth.markDeleted([id]);
    R.history = R.history.filter(e => e.id !== id);
    if (id === activeVipEntryId) activeVipEntryId = null;
    saveHistory(); renderHistory();
  }
  // Ein Diagramm (= alle Scans eines Typs) löschen – mit Sicherheitsabfrage
  const TYPE_LABEL = { resources: 'Ressourcen', speedups: 'Speedups', vip: 'VIP', gems: 'Gems', ap: 'AP', governor: 'Statthalter', materials: 'Materialien', passports: 'Passports', goldheads: 'Goldheads', keys: 'Keys', armaments: 'Armaments' }; R.TYPE_LABEL = TYPE_LABEL;
  async function resetHistoryType(type) {
    const n = R.history.filter(e => e.type === type).length;
    if (!n) { UI.alert(`Im ${TYPE_LABEL[type]}-Diagramm sind keine Einträge.`); return false; }
    if (!(await UI.confirm(`⚠ ${TYPE_LABEL[type]}-Diagramm wirklich zurücksetzen?\n\nAlle ${n} gespeicherten ${TYPE_LABEL[type]}-Scans werden unwiderruflich gelöscht – auch in der Cloud. Die anderen Diagramme bleiben erhalten.`))) return false;
    RokAuth.markDeleted(R.history.filter(e => e.type === type).map(e => e.id));
    R.history = R.history.filter(e => e.type !== type);
    if (type === 'vip') activeVipEntryId = null;
    LS.del(LAST + '_' + type);
    if (type === 'resources') hasRes = false; else if (type === 'gems') hasGems = false;
    else if (type === 'speedups') hasSpeed = false; else if (type === 'ap') hasAp = false; else if (type === 'materials') hasMats = false; else if (type === 'passports') hasPass = false;   // Ergebnis-Karte des Typs ausblenden
    saveHistory(); applyMode();
    return true;
  }
  $('resetChart').onclick = () => resetHistoryType(histTab);
  $('resetHistory').onclick = async () => {
    if (!R.history.length) return;
    if (!(await UI.confirm('Gesamten Verlauf (alle gespeicherten Scans) unwiderruflich löschen?'))) return;
    RokAuth.markDeleted(R.history.map(e => e.id));
    R.history = []; activeVipEntryId = null; saveHistory(); renderHistory();
  };

  function syncTabs() {
    document.querySelectorAll('.hist-tab').forEach(b => b.setAttribute('aria-pressed', b.dataset.tab === histTab));
    document.querySelectorAll('.ctype').forEach(b => b.setAttribute('aria-pressed', b.dataset.ctype === chartType));
  }
  document.querySelectorAll('.hist-tab').forEach(b => b.onclick = () => { histTab = b.dataset.tab; syncTabs(); renderHistory(); });
  document.querySelectorAll('.ctype').forEach(b => b.onclick = () => { chartType = b.dataset.ctype; syncTabs(); renderHistory(); });

  const dateLabel = (ts) => new Date(ts).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }); R.dateLabel = dateLabel;

  if (window.Chart) {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(46,58,85,.6)';
    Chart.defaults.font.family = 'Inter, system-ui, sans-serif';
  }

  function renderHistory() {
    const list = R.history.filter(e => e.type === histTab).sort((a, b) => a.ts - b.ts);
    const labels = list.map(e => dateLabel(e.ts));
    const isLine = chartType === 'line';
    let datasets = [];

    if (histTab === 'resources') {
      datasets = RES.map(r => ({
        label: r.label, data: list.map(e => resPart(e, r.k, resView)),
        backgroundColor: isLine ? r.from + '33' : r.from + 'cc', borderColor: r.from, borderWidth: isLine ? 2.5 : 0, borderRadius: 4,
        tension: .3, pointRadius: 4, pointBackgroundColor: r.to, spanGaps: true, fill: false }));
    } else if (histTab === 'speedups') {
      const ev = currentEvent();
      const lines = [...SPEED.map(c => ({ ...c, val: (e) => e[c.k] })),
      ];
      datasets = lines.filter(l => speedLines[l.k]).map(l => ({
        label: l.label, data: list.map(e => e.total == null ? null : l.val(e) / 1440),
        backgroundColor: isLine ? l.c + '33' : l.c + 'cc', borderColor: l.c, borderWidth: isLine ? (l.k === 'combined' ? 3.5 : 2.5) : 0,
        borderDash: l.k === 'combined' && isLine ? [8, 5] : undefined,
        borderRadius: 4, tension: .3, pointRadius: 4, pointHoverRadius: 6, pointBackgroundColor: l.c, spanGaps: true, fill: false }));
    } else if (histTab === 'materials') {
      datasets = [...MATS.map(m => ({ k: m.k, label: m.label, data: list.map(e => Math.round(matLeg(e, m.k) * 100) / 100), c: m.c })),
                  { k: 'chest', label: 'Kisten', data: list.map(e => Math.round(chestLeg(e) * 100) / 100), c: CHEST.c },
                  { k: 'total', label: 'Gesamt (Legendär)', data: list.map(e => Math.round(matSelTotal(e) * 100) / 100), c: '#facc15', dash: true }]
        .filter(d => R.speedUi.matLines[d.k])
        .map(d => ({ __k: d.k, label: d.label, data: d.data, backgroundColor: isLine ? d.c + '33' : d.c + 'cc', borderColor: d.c, borderWidth: isLine ? (d.dash ? 3.5 : 2.5) : 0,
          borderDash: d.dash && isLine ? [8, 5] : undefined, borderRadius: 4, tension: .3, pointRadius: 4, pointBackgroundColor: d.c, spanGaps: true, fill: false }));
    } else if (histTab === 'ap') {
      datasets = [{ label: 'AP gesamt', data: list.map(e => e.total_ap), backgroundColor: isLine ? '#34d39933' : '#34d399cc', borderColor: '#34d399',
        borderWidth: isLine ? 2.5 : 0, borderRadius: 4, tension: .3, pointRadius: 4, pointBackgroundColor: '#34d399', spanGaps: true, fill: false }];
    } else if (COUNTERS[histTab]) {
      const cf = COUNTERS[histTab], ds = (label, data, c, dash) => ({ label, data, backgroundColor: isLine ? c + '33' : c + 'cc', borderColor: c,
        borderWidth: isLine ? (dash ? 3.5 : 2.5) : 0, borderDash: dash && isLine ? [8, 5] : undefined, borderRadius: 4, tension: .3, pointRadius: 4, pointBackgroundColor: c, spanGaps: true, fill: false });
      datasets = cf.fields.map(f => ds(f.label, list.map(e => e[f.k]), f.c));
      if (cf.sum) datasets.push(ds(cf.sumLabel, list.map(e => cntTotal(histTab, e)), '#facc15', true));
    } else if (histTab === 'passports') {
      datasets = [{ label: 'Passseiten', data: list.map(e => e.passports), backgroundColor: isLine ? '#818cf833' : '#818cf8cc', borderColor: '#818cf8',
        borderWidth: isLine ? 2.5 : 0, borderRadius: 4, tension: .3, pointRadius: 4, pointBackgroundColor: '#818cf8', spanGaps: true, fill: false }];
    } else if (histTab === 'gems') {
      const gs = (label, key, c) => ({ label, data: list.map(e => e[key]), backgroundColor: isLine ? c + '33' : c + 'cc', borderColor: c,
        borderWidth: isLine ? 2.5 : 0, borderRadius: 4, tension: .3, pointRadius: 4, pointBackgroundColor: c, spanGaps: true, fill: false });
      datasets = [gs('Gesamt', 'gems', '#f472b6'), gs('Auf Hand', 'gemsHand', '#38bdf8'), gs('Im Rucksack', 'gemsBag', '#a78bfa')];
    } else {
      datasets = [
        { label: 'Aktuelle Punkte', data: list.map(e => e.current), backgroundColor: isLine ? '#f5c54233' : '#e0a91bcc', borderColor: '#f5c542', borderWidth: isLine ? 2.5 : 0, borderRadius: 4, tension: .3, pointRadius: 4, spanGaps: true, order: 2 },
        { label: 'Nach Einlösen', data: list.map(e => e.after), backgroundColor: isLine ? '#38bdf833' : '#38bdf899', borderColor: '#38bdf8', borderWidth: isLine ? 2.5 : 0, borderRadius: 4, tension: .3, pointRadius: 4, spanGaps: true, order: 2 },
      ];
    }


    // ausgeblendete Linien (Klick auf die Legende) wiederherstellen
    datasets.forEach((d, i) => { d.__k = d.__k || d.label || i; if (histHidden.has(histTab + ':' + d.__k)) d.hidden = true; });
    // Chart
    const empty = $('chartEmpty');
    if (!window.Chart) {
      empty.textContent = 'Chart.js konnte nicht geladen werden (keine Internetverbindung?). Die Tabelle funktioniert trotzdem.';
    } else {
      empty.textContent = list.length ? '' : ({ speedups: 'Noch keine Speedup-Scans gespeichert.', resources: 'Noch keine Ressourcen-Scans gespeichert.', vip: 'Noch keine VIP-Scans gespeichert.', gems: 'Noch keine Edelstein-Scans gespeichert.', passports: 'Noch keine Passport-Scans gespeichert.', goldheads: 'Noch keine Goldhead-Scans gespeichert.', keys: 'Noch keine Key-Scans gespeichert.', armaments: 'Noch keine Armament-Scans gespeichert.', ap: 'Noch keine AP-Scans gespeichert.', materials: 'Noch keine Material-Scans gespeichert.' })[histTab];
      if (chart) chart.destroy();
      chart = new Chart($('historyChart'), {
        type: chartType,
        data: { labels, datasets: list.length ? datasets : [] },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { labels: { boxWidth: 12, usePointStyle: true },
              onHover: (ev) => { if (ev.native?.target) ev.native.target.style.cursor = 'pointer'; },
              onLeave: (ev) => { if (ev.native?.target) ev.native.target.style.cursor = ''; },
              onClick: (ev, item, legend) => {
                const ch = legend.chart, i = item.datasetIndex, key = histTab + ':' + (datasets[i]?.__k || i);
                const vis = !ch.isDatasetVisible(i); ch.setDatasetVisibility(i, vis); ch.update();
                if (vis) histHidden.delete(key); else histHidden.add(key);
                try { localStorage.setItem('rok_hist_hidden', JSON.stringify([...histHidden])); } catch {}
              } },
            tooltip: { backgroundColor: '#0c1019', borderColor: 'rgba(245,197,66,.3)', borderWidth: 1,
                       callbacks: { label: (c) => `${c.dataset.label}: ${c.raw == null ? '–' : histTab === 'speedups' ? durText(c.raw * 1440) : fmt(c.raw)}` } }
          },
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, ticks: { callback: (v) => histTab === 'speedups' ? (+v).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' T' : short(v) },
                 title: { display: histTab === 'speedups', text: 'Tage', color: '#94a3b8' } }
          }
        }
      });
    }

    // Tabelle (neueste zuerst)
    const rows = [...list].reverse();
    const th_ = 'py-2 px-2 font-medium text-right';
    if (histTab === 'resources') {
      $('histHead').innerHTML = `<tr class="border-b border-ink-700"><th class="py-2 pr-2 font-medium text-left">Datum</th>
        ${RES.map(r => `<th class="${th_}">${ico(r, 'w-4 h-4')} ${r.label}</th>`).join('')}<th class="${th_}">Summe</th><th class="w-8"></th></tr>`;
      const tot = (e) => sumPart(e, resView);
      // Zelle: nur der Wert der gewählten Ansicht (Gesamt / Ohne Rucksack / Mit Farms)
      const cell = (get) => { const v = get(resView); return v == null ? '–' : `<span class="font-semibold text-white" title="${fmt(v)}">${short(v)}</span>`; };
      $('histRows').innerHTML = rows.map((e, i) => {
        return `<tr class="border-b border-ink-800 hover:bg-ink-850">
          <td class="py-2 pr-2 whitespace-nowrap text-slate-300">${dateLabel(e.ts)}</td>
          ${RES.map(r => `<td class="py-2 px-2 text-right tabular-nums whitespace-nowrap align-top">${cell(p => resPart(e, r.k, p))}</td>`).join('')}
          <td class="py-2 px-2 text-right font-semibold text-gold-300 tabular-nums whitespace-nowrap align-top">${cell(p => sumPart(e, p))}</td>
          <td class="text-right"><button data-hdel="${e.id}" class="text-slate-500 hover:text-red-400 px-1" title="Eintrag löschen">✕</button></td>
        </tr>`;
      }).join('');
    } else if (histTab === 'speedups') {
      $('histHead').innerHTML = `<tr class="border-b border-ink-700"><th class="py-2 pr-2 font-medium text-left">Datum</th>
        ${SPEED.map(c => `<th class="${th_}">${ico(c, 'w-4 h-4')} ${c.label}</th>`).join('')}<th class="${th_}">Gesamt</th><th class="w-8"></th></tr>`;
      $('histRows').innerHTML = rows.map((e, i) => {
        const prev = rows[i + 1], d = prev && prev.total != null && e.total != null ? e.total - prev.total : null;
        return `<tr class="border-b border-ink-800 hover:bg-ink-850">
          <td class="py-2 pr-2 whitespace-nowrap text-slate-300">${dateLabel(e.ts)}</td>
          ${SPEED.map(c => `<td class="py-2 px-2 text-right tabular-nums whitespace-nowrap">${e[c.k] != null ? durText(e[c.k], true) : '–'}</td>`).join('')}
          <td class="py-2 px-2 text-right font-semibold text-sky-300 tabular-nums whitespace-nowrap">${e.total != null ? durText(e.total, true) : '–'}
            ${d ? `<span class="block text-[11px] font-normal ${d >= 0 ? 'text-emerald-400' : 'text-red-400'}">${d >= 0 ? '+' : '−'}${durText(Math.abs(d), true)}</span>` : ''}</td>
          <td class="text-right"><button data-hdel="${e.id}" class="text-slate-500 hover:text-red-400 px-1" title="Eintrag löschen">✕</button></td>
        </tr>`;
      }).join('');
    } else if (histTab === 'materials') {
      $('histHead').innerHTML = `<tr class="border-b border-ink-700"><th class="py-2 pr-2 font-medium text-left">Datum</th>
        ${MATS.map(m => `<th class="${th_}">${ico(m, 'w-4 h-4')} ${m.label}</th>`).join('')}<th class="${th_}">⚒️ Gesamt (Legendär)</th><th class="${th_}">📦 Kisten</th><th class="w-8"></th></tr>`;
      $('histRows').innerHTML = rows.map(e => `<tr class="border-b border-ink-800 hover:bg-ink-850">
          <td class="py-2 pr-2 whitespace-nowrap text-slate-300">${dateLabel(e.ts)}</td>
          ${MATS.map(m => `<td class="py-2 px-2 text-right tabular-nums">${fmtLeg(matLeg(e, m.k))}</td>`).join('')}
          <td class="py-2 px-2 text-right tabular-nums font-semibold text-gold-300">${fmtLeg(matTotal(e))}</td>
          <td class="py-2 px-2 text-right tabular-nums text-slate-300">${fmtLeg(chestLeg(e))}</td>
          <td class="text-right"><button data-hdel="${e.id}" class="text-slate-500 hover:text-red-400 px-1" title="Eintrag löschen">✕</button></td>
        </tr>`).join('');
    } else if (histTab === 'ap') {
      $('histHead').innerHTML = `<tr class="border-b border-ink-700"><th class="py-2 pr-2 font-medium text-left">Datum</th>
        <th class="${th_}">50er</th><th class="${th_}">100er</th><th class="${th_}">500er</th><th class="${th_}">1.000er</th><th class="${th_}">⚡ AP gesamt</th><th class="${th_}">Veränderung</th><th class="w-8"></th></tr>`;
      $('histRows').innerHTML = rows.map((e, i) => {
        const prev = rows[i + 1], d = prev && prev.total_ap != null && e.total_ap != null ? e.total_ap - prev.total_ap : null;
        return `<tr class="border-b border-ink-800 hover:bg-ink-850">
          <td class="py-2 pr-2 whitespace-nowrap text-slate-300">${dateLabel(e.ts)}</td>
          ${AP_SIZES.map(z => `<td class="py-2 px-2 text-right tabular-nums text-slate-300">${e['ap_' + z] != null ? fmt(e['ap_' + z]) : '–'}</td>`).join('')}
          <td class="py-2 px-2 text-right tabular-nums font-semibold text-emerald-300">${e.total_ap != null ? fmt(e.total_ap) : '–'}</td>
          <td class="py-2 px-2 text-right tabular-nums ${d == null ? 'text-slate-500' : d >= 0 ? 'text-emerald-400' : 'text-red-400'}">${d == null ? '–' : (d >= 0 ? '+' : '−') + fmt(Math.abs(d))}</td>
          <td class="text-right"><button data-hdel="${e.id}" class="text-slate-500 hover:text-red-400 px-1" title="Eintrag löschen">✕</button></td>
        </tr>`;
      }).join('');
    } else if (COUNTERS[histTab]) {
      const cf = COUNTERS[histTab], main = cf.sum || [cf.fields[0].k];
      $('histHead').innerHTML = `<tr class="border-b border-ink-700"><th class="py-2 pr-2 font-medium text-left">Datum</th>
        ${cf.fields.map(f => `<th class="${th_}">${ico(f, 'w-4 h-4')} ${f.label}</th>`).join('')}${cf.sum ? `<th class="${th_}">Gesamt</th>` : ''}<th class="${th_}">Veränderung</th><th class="w-8"></th></tr>`;
      const val = (e) => main.reduce((a, k) => a + (+e[k] || 0), 0);
      $('histRows').innerHTML = rows.map((e, i) => {
        const prev = rows[i + 1], d = prev ? val(e) - val(prev) : null;
        return `<tr class="border-b border-ink-800 hover:bg-ink-850">
          <td class="py-2 pr-2 whitespace-nowrap text-slate-300">${dateLabel(e.ts)}</td>
          ${cf.fields.map((f, j) => `<td class="py-2 px-2 text-right tabular-nums ${j === 0 && !cf.sum ? 'font-semibold text-gold-300' : ''}">${e[f.k] != null ? fmt(e[f.k]) : '–'}</td>`).join('')}
          ${cf.sum ? `<td class="py-2 px-2 text-right tabular-nums font-semibold text-gold-300">${fmt(cntTotal(histTab, e))}</td>` : ''}
          <td class="py-2 px-2 text-right tabular-nums ${d == null ? 'text-slate-500' : d >= 0 ? 'text-emerald-400' : 'text-red-400'}">${d == null ? '–' : (d >= 0 ? '+' : '−') + fmt(Math.abs(d))}</td>
          <td class="text-right"><button data-hdel="${e.id}" class="text-slate-500 hover:text-red-400 px-1" title="Eintrag löschen">✕</button></td>
        </tr>`;
      }).join('');
    } else if (histTab === 'passports') {
      $('histHead').innerHTML = `<tr class="border-b border-ink-700"><th class="py-2 pr-2 font-medium text-left">Datum</th>
        <th class="${th_}">🛂 Passseiten</th><th class="${th_}">Benötigt</th><th class="${th_}">Veränderung</th><th class="w-8"></th></tr>`;
      $('histRows').innerHTML = rows.map((e, i) => {
        const prev = rows[i + 1], d = prev && prev.passports != null && e.passports != null ? e.passports - prev.passports : null;
        return `<tr class="border-b border-ink-800 hover:bg-ink-850">
          <td class="py-2 pr-2 whitespace-nowrap text-slate-300">${dateLabel(e.ts)}</td>
          <td class="py-2 px-2 text-right tabular-nums font-semibold text-indigo-300">${e.passports != null ? fmt(e.passports) : '–'}</td>
          <td class="py-2 px-2 text-right tabular-nums text-slate-300">${e.required != null ? fmt(e.required) : '–'}</td>
          <td class="py-2 px-2 text-right tabular-nums ${d == null ? 'text-slate-500' : d >= 0 ? 'text-emerald-400' : 'text-red-400'}">${d == null ? '–' : (d >= 0 ? '+' : '−') + fmt(Math.abs(d))}</td>
          <td class="text-right"><button data-hdel="${e.id}" class="text-slate-500 hover:text-red-400 px-1" title="Eintrag löschen">✕</button></td>
        </tr>`;
      }).join('');
    } else if (histTab === 'gems') {
      $('histHead').innerHTML = `<tr class="border-b border-ink-700"><th class="py-2 pr-2 font-medium text-left">Datum</th>
        <th class="${th_}">Auf Hand</th><th class="${th_}">Im Rucksack</th><th class="${th_}">💎 Gesamt</th><th class="${th_}">Veränderung</th><th class="w-8"></th></tr>`;
      $('histRows').innerHTML = rows.map((e, i) => {
        const prev = rows[i + 1], d = prev && prev.gems != null && e.gems != null ? e.gems - prev.gems : null;
        return `<tr class="border-b border-ink-800 hover:bg-ink-850">
          <td class="py-2 pr-2 whitespace-nowrap text-slate-300">${dateLabel(e.ts)}</td>
          <td class="py-2 px-2 text-right tabular-nums">${e.gemsHand != null ? fmt(e.gemsHand) : '–'}</td>
          <td class="py-2 px-2 text-right tabular-nums">${e.gemsBag != null ? fmt(e.gemsBag) : '–'}</td>
          <td class="py-2 px-2 text-right tabular-nums font-semibold text-pink-300">${e.gems != null ? fmt(e.gems) : '–'}</td>
          <td class="py-2 px-2 text-right tabular-nums ${d == null ? 'text-slate-500' : d >= 0 ? 'text-emerald-400' : 'text-red-400'}">${d == null ? '–' : (d >= 0 ? '+' : '−') + fmt(Math.abs(d))}</td>
          <td class="text-right"><button data-hdel="${e.id}" class="text-slate-500 hover:text-red-400 px-1" title="Eintrag löschen">✕</button></td>
        </tr>`;
      }).join('');
    } else {
      $('histHead').innerHTML = `<tr class="border-b border-ink-700"><th class="py-2 pr-2 font-medium text-left">Datum</th>
        <th class="${th_}">Aktuell</th><th class="${th_}">Inventar</th><th class="${th_}">Nach Einlösen</th><th class="${th_}">Stufe</th><th class="w-8"></th></tr>`;
      $('histRows').innerHTML = rows.map(e => `<tr class="border-b border-ink-800 hover:bg-ink-850">
          <td class="py-2 pr-2 whitespace-nowrap text-slate-300">${dateLabel(e.ts)}</td>
          <td class="py-2 px-2 text-right tabular-nums">${e.current != null ? fmt(e.current) : '–'}</td>
          <td class="py-2 px-2 text-right tabular-nums text-gold-300">+${fmt(e.inventory)}</td>
          <td class="py-2 px-2 text-right tabular-nums font-semibold">${fmt(e.after)}</td>
          <td class="py-2 px-2 text-right whitespace-nowrap">${e.current != null ? `${vipName(levelFor(e.current))} → ${vipName(levelFor(e.after))}` : `→ ${vipName(levelFor(e.after))}`}</td>
          <td class="text-right"><button data-hdel="${e.id}" class="text-slate-500 hover:text-red-400 px-1" title="Eintrag löschen">✕</button></td>
        </tr>`).join('');
    }
    if (!rows.length) $('histRows').innerHTML = `<tr><td colspan="7" class="py-6 text-center text-slate-500">Keine Einträge.</td></tr>`;
    $('histRows').querySelectorAll('[data-hdel]').forEach(b => b.onclick = () => deleteEntry(b.dataset.hdel));

    const n = (t) => R.history.filter(e => e.type === t).length;
    $('histCount').textContent = `${R.history.length} Scans gespeichert (${n('speedups')} Speedups, ${n('resources')} Ressourcen, ${n('vip')} VIP, ${n('gems')} Gems, ${n('ap')} AP, ${n('materials')} Mats, ${n('passports')} Passports, ${n('goldheads')} Goldheads, ${n('keys')} Keys, ${n('armaments')} Armaments) · nur Zahlenwerte, keine Bilder`;
    $('resetChart').textContent = `🗑 ${TYPE_LABEL[histTab] || ''}-Diagramm zurücksetzen`;
    $('resetChart').disabled = !list.length; $('resetChart').classList.toggle('opacity-40', !list.length);
    $('resetHistory').disabled = !R.history.length;
    $('resetHistory').classList.toggle('opacity-40', !R.history.length);
  }

  // ---------- Farmen ----------
  const FARMS = 'rok_scanner_farms', OPTS = 'rok_scanner_hist_opts';
  const FK = { food: 'farmFood', wood: 'farmWood', stone: 'farmStone', gold: 'farmGold' };
  let farms = [];
  try { farms = (JSON.parse(LS.get(FARMS, '[]')) || []).map(f => ({ id: String(f.id || newId()), name: String(f.name || 'Farm'),
    food: +f.food || 0, wood: +f.wood || 0, stone: +f.stone || 0, gold: +f.gold || 0 })); } catch { farms = []; }
  // Linien im Ressourcen-Diagramm (Häkchen): Main = auf Hand · Main + Rucksack · + Farms
  const RES_LINES = [['hand', 'Main', '#34d399'], ['total', 'Main + Rucksack', '#f5c542'], ['farm', 'Main + Rucksack + Farms', '#fb923c']]; R.RES_LINES = RES_LINES;
  let resLines = { hand: true, total: true, farm: false };
  try { const o = JSON.parse(LS.get(OPTS, '{}')); if (o.lines) resLines = { ...resLines, ...o.lines }; } catch {}
  const saveOpts = () => LS.set(OPTS, JSON.stringify({ lines: resLines }));
  function renderResLines(el, state, onChange) {
    el.innerHTML = '<span class="text-slate-500">Linien:</span>' + RES_LINES.map(([k, l, c]) =>
      `<label class="inline-flex items-center gap-1.5 cursor-pointer"><input type="checkbox" data-rl="${k}" ${state[k] ? 'checked' : ''} class="w-4 h-4" style="accent-color:${c}">${k === 'farm' ? '+ Farms' : l}</label>`).join('');
    el.querySelectorAll('input').forEach(i => i.onchange = () => { state[i.dataset.rl] = i.checked; onChange(); });
  }
  // Scanner-Verlauf: 3 Reiter (eine Ansicht gleichzeitig)
  const RES_VIEWS = [['total', 'Gesamt'], ['hand', 'Ohne Rucksack'], ['farm', 'Mit Farms']];
  let resView = 'total', resCardFarm = false;
  try { const o = JSON.parse(LS.get(OPTS, '{}')); if (RES_VIEWS.some(([k]) => k === o.view)) resView = o.view; resCardFarm = !!o.cardFarm; } catch {}
  const saveResOpts = () => LS.set(OPTS, JSON.stringify({ lines: resLines, view: resView, cardFarm: resCardFarm }));
  function renderResViewTabs() {
    $('resLines').innerHTML = RES_VIEWS.map(([k, l]) => `<button type="button" data-rv="${k}" aria-pressed="${k === resView}" class="seg-btn rounded-lg px-4 py-1.5 text-xs font-semibold transition">${l}</button>`).join('');
    $('resLines').querySelectorAll('[data-rv]').forEach(b => b.onclick = () => { resView = b.dataset.rv; saveResOpts(); renderResViewTabs(); renderHistory(); });
  }
  renderResViewTabs();
  function rerenderResCards() { if (!lastResR) return; const src = $('resSource').textContent; renderResources(lastResR); $('resSource').textContent = src; }
  $('resCardFarm').checked = resCardFarm;
  $('resCardFarm').onchange = () => { resCardFarm = $('resCardFarm').checked; saveResOpts(); rerenderResCards(); };

  // "12,5M", "850K", "12.500.000" → Zahl
  function parseAmount(v) {
    let t = String(v ?? '').trim().toLowerCase().replace(/\s/g, '');
    if (!t) return 0;
    const m = t.match(/^([\d.,]+)(k|tsd|m|mio|b|mrd)?$/);
    if (!m) return NaN;
    const mult = { k: 1e3, tsd: 1e3, m: 1e6, mio: 1e6, b: 1e9, mrd: 1e9 }[m[2]] || 1;
    let n = m[1];
    n = mult > 1 ? n.replace(',', '.') : n.replace(/[.,]/g, '');
    return Math.round(parseFloat(n) * mult);
  }
  const farmSum = (k) => farms.reduce((a, f) => a + (f[k] || 0), 0);
  function farmSnapshot() { const o = {}; RES.forEach(r => o[FK[r.k]] = farmSum(r.k)); return o; }
  const BK = { food: 'bagFood', wood: 'bagWood', stone: 'bagStone', gold: 'bagGold' };
  // Wert je Ressource nach Häkchen: Main (auf Hand oder inkl. Rucksack) + optional Farms
  // part: 'bag' = Rucksack, 'hand' = Auf Hand (Gesamt − Rucksack), 'total' = Gesamt. Farms zählen zu Auf Hand/Gesamt.
  // part: 'hand' = Main (auf Hand), 'bag' = Rucksack, 'total' = Main + Rucksack, 'farm' = Main + Rucksack + Farms
  function resPart(e, k, part) {
    const g = num(e[k]), bag = num(e[BK[k]]) || 0, farm = num(e[FK[k]]) || 0;
    if (part === 'farm') return g == null && !farm ? null : (g || 0) + farm;
    if (g == null) return null;
    return part === 'bag' ? bag : part === 'hand' ? Math.max(0, g - bag) : g;
  }
  const sumPart = (e, part) => RES.reduce((a, r) => a + (resPart(e, r.k, part) || 0), 0); R.sumPart = sumPart;
  function latestResEntry() { return R.history.filter(e => e.type === 'resources').sort((a, b) => b.ts - a.ts)[0] || null; }

  function saveFarms() {
    LS.set(FARMS, JSON.stringify(farms));
    rerenderResCards();                      // Karten + Summen (Farm Gesamt) aktualisieren
    const last = latestResEntry();          // aktuelle Farmwerte gelten für den letzten Ressourcen-Scan
    if (last) updateHistory(last.id, farmSnapshot()); else renderHistory();
  }
  function renderFarms() {
    const inp = 'w-full min-w-[84px] text-right bg-ink-950/60 border border-ink-700 rounded px-2 py-1.5 tabular-nums focus:outline-none focus:border-gold-500';
    $('farmRows').innerHTML = farms.length ? farms.map(f => `
      <tr class="border-b border-ink-800">
        <td class="py-1.5 pr-2"><input data-id="${f.id}" data-k="name" value="${esc(f.name)}" class="w-full min-w-[90px] bg-ink-950/60 border border-ink-700 rounded px-2 py-1.5 focus:outline-none focus:border-gold-500"></td>
        ${RES.map(r => `<td class="py-1.5 px-1"><input data-id="${f.id}" data-k="${r.k}" inputmode="decimal" value="${f[r.k] ? fmt(f[r.k]) : ''}" placeholder="0" class="${inp}"></td>`).join('')}
        <td class="text-right"><button data-fdel="${f.id}" class="text-slate-500 hover:text-red-400 px-1" title="Farm löschen">✕</button></td>
      </tr>`).join('')
      : `<tr><td colspan="6" class="py-4 text-center text-slate-500">Noch keine Farmen – „+ Farm“ klicken.</td></tr>`;
    const main = latestResEntry();
    const row = (label, vals, cls) => `<tr class="${cls}"><td class="py-1.5 pr-2">${label}</td>${RES.map(r => `<td class="py-1.5 px-1 text-right tabular-nums">${vals(r.k)}</td>`).join('')}<td></td></tr>`;
    $('farmFoot').innerHTML =
      row('Summe Farmen', k => short(farmSum(k)), 'text-slate-300 border-t border-ink-700') +
      row('Main (letzter Scan)', k => main && main[k] != null ? short(main[k]) : '–', 'text-slate-400') +
      row('<b>Gesamt</b>', k => `<b class="text-gold-300">${short((main?.[k] || 0) + farmSum(k))}</b>`, 'border-t border-ink-700');
    $('farmRows').querySelectorAll('input[data-id]').forEach(i => i.addEventListener('change', () => {
      const f = farms.find(x => x.id === i.dataset.id); if (!f) return;
      if (i.dataset.k === 'name') f.name = i.value.trim() || 'Farm';
      else { const v = parseAmount(i.value); if (isNaN(v)) { i.classList.add('border-red-500'); return; } f[i.dataset.k] = v; }
      saveFarms(); renderFarms();
    }));
    $('farmRows').querySelectorAll('[data-fdel]').forEach(b => b.onclick = async () => {
      const f = farms.find(x => x.id === b.dataset.fdel);
      if (!(await UI.confirm(`Farm „${f?.name}“ löschen?`))) return;
      farms = farms.filter(x => x.id !== b.dataset.fdel); saveFarms(); renderFarms();
    });
  }
  $('addFarm').onclick = () => {
    farms.push({ id: newId(), name: `Farm ${farms.length + 1}`, food: 0, wood: 0, stone: 0, gold: 0 });
    saveFarms(); renderFarms();
    $('farmRows').querySelector('tr:last-child input')?.select();
  };

  // ---------- Speedups ----------
  const SPEED = [
    { k: 'universal', label: 'Universal', icon: '⏱️', img: 'sonstiges/SpeedUniversal.png', c: '#f5c542' },
    { k: 'training',  label: 'Training',  icon: '⚔️', img: 'sonstiges/SpeedTraining.png', c: '#f87171' },
    { k: 'healing',   label: 'Heilung',   icon: '❤️', img: 'sonstiges/SpeedHealing.png', c: '#34d399' },
    { k: 'research',  label: 'Forschung', icon: '📘', img: 'sonstiges/SpeedResearch.png', c: '#38bdf8' },
    { k: 'building',  label: 'Bau',       icon: '🔨', img: 'sonstiges/SpeedBuilding.png', c: '#fb923c' }
  ]; R.SPEED = SPEED;
  // Minuten → "12 T 5 Std 30 Min" (kurz: "12T 5h 30m")
  function durText(min, compact = false) {
    min = Math.round(min || 0);
    const d = Math.floor(min / 1440), h = Math.floor(min % 1440 / 60), m = min % 60;
    const parts = compact ? [d && `${fmt(d)}T`, h && `${h}h`, m && `${m}m`] : [d && `${fmt(d)} ${d === 1 ? 'Tag' : 'Tage'}`, h && `${h} Std.`, m && `${m} Min.`];
    return parts.filter(Boolean).join(compact ? ' ' : ', ') || (compact ? '0m' : '0 Min.');
  }
  // ---------- Event-Rechner ----------
  const EVENTS = [
    { id: 'zenith', label: 'Zenith / Truppentraining', short: 'Training + Universal', keys: ['training', 'universal'] },
    { id: 'kvk',    label: 'KvK Krieg / Heilung',      short: 'Heilung + Universal',  keys: ['healing', 'universal'] },
    { id: 'train',  label: 'Reines Training',          short: 'Training',             keys: ['training'] },
    { id: 'heal',   label: 'Reine Heilung',            short: 'Heilung',              keys: ['healing'] },
    { id: 'all',    label: 'Gesamt-Vorrat',            short: 'Alle Speedups',        keys: ['universal', 'building', 'research', 'training', 'healing'] }
  ];
  const SPEED_UI = 'rok_scanner_speed_ui';
  R.speedUi = { event: 'zenith', ppm: {}, lines: { training: true, healing: true, universal: true, combined: true, research: false, building: false } };
  try { const u = JSON.parse(LS.get(SPEED_UI, '{}')); R.speedUi = { ...R.speedUi, ...u, ppm: { ...(u.ppm || {}) }, lines: { ...R.speedUi.lines, ...(u.lines || {}) } }; } catch {}
  const speedLines = R.speedUi.lines;
  const histHidden = new Set((() => { try { return JSON.parse(localStorage.getItem('rok_hist_hidden') || '[]'); } catch { return []; } })());
  const saveSpeedUi = () => LS.set(SPEED_UI, JSON.stringify(R.speedUi)); R.saveSpeedUi = saveSpeedUi;
  // Material-Linien (Scanner-Verlauf + Profil teilen sich die Auswahl)
  R.speedUi.matLines = { leather: true, iron: true, ebony: true, bone: true, chest: true, total: true, ...(R.speedUi.matLines || {}) };
  const MAT_LINES = () => [...MATS.map(m => [m.k, ico(m, 'w-4 h-4') + ' ' + m.label, m.c]), ['chest', ico(CHEST, 'w-4 h-4') + ' ' + CHEST.label, CHEST.c], ['total', '⚒️ Gesamt', '#facc15']];
  function renderMatLines(el, onChange) {
    el.innerHTML = '<span class="text-slate-500">Linien:</span>' + MAT_LINES().map(([k, l, c]) =>
      `<label class="inline-flex items-center gap-1.5 cursor-pointer"><input type="checkbox" data-ml="${k}" ${R.speedUi.matLines[k] ? 'checked' : ''} class="w-4 h-4" style="accent-color:${c}">${l}</label>`).join('');
    el.querySelectorAll('input').forEach(i => i.onchange = () => { R.speedUi.matLines[i.dataset.ml] = i.checked; saveSpeedUi(); onChange(); });
  }
  const currentEvent = () => EVENTS.find(x => x.id === R.speedUi.event) || EVENTS[0];
  R.curSpeed = null;
  const days = (min) => (min / 1440).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); R.days = days;

  function renderEvent() {
    if (!$('eventBtns')) return;                                      // Event-Rechner ist aus dem Layout entfernt
    const ev = currentEvent();
    $('eventBtns').innerHTML = EVENTS.map(x => `<button class="ev-btn seg-btn rounded-lg px-3 py-1.5 text-xs font-semibold transition" data-ev="${x.id}" aria-pressed="${x.id === ev.id}">${x.label}</button>`).join('');
    $('eventBtns').querySelectorAll('.ev-btn').forEach(b => b.onclick = () => { R.speedUi.event = b.dataset.ev; saveSpeedUi(); renderEvent(); renderSpeedOpts(); renderHistory(); });
    const label = (k) => SPEED.find(c => c.k === k);
    $('eventFormula').innerHTML = 'Berechnung: ' + ev.keys.map(k => `<span class="text-slate-200">${ico(label(k), 'w-4 h-4')} ${label(k).label}</span>`).join(' + ');
    const ppm = R.speedUi.ppm[ev.id];
    if (document.activeElement !== $('eventPpm')) $('eventPpm').value = ppm ?? '';
    const e = R.curSpeed || {};
    const min = ev.keys.reduce((a, k) => a + (e[k] || 0), 0);
    const pts = ppm ? Math.round(min * ppm) : null;
    const uni = ev.keys.includes('universal') && ev.keys.length > 1 ? (e.universal || 0) : null;
    $('eventKpis').innerHTML = `
      <div class="rounded-xl bg-ink-950/60 border border-gold-500/30 p-4">
        <div class="text-[10px] uppercase tracking-widest text-slate-400">Gesamtdauer</div>
        <div class="text-3xl font-extrabold text-white tabular-nums mt-1">${days(min)} <span class="text-base font-semibold text-slate-400">Tage</span></div>
        <div class="text-xs text-slate-400 mt-1">${durText(min)}</div>
      </div>
      <div class="rounded-xl bg-ink-950/60 border border-ink-700 p-4">
        <div class="text-[10px] uppercase tracking-widest text-slate-400">Punkte-Potenzial</div>
        <div class="text-3xl font-extrabold tabular-nums mt-1 ${pts != null ? 'text-gold-300' : 'text-slate-500'}">${pts != null ? fmt(pts) : '–'}</div>
        <div class="text-xs text-slate-400 mt-1">${pts != null ? `${fmt(min)} Min. × ${String(ppm).replace('.', ',')} Punkte` : 'Punkte pro Minute unten eintragen'}</div>
      </div>
      <div class="rounded-xl bg-ink-950/60 border border-ink-700 p-4">
        <div class="text-[10px] uppercase tracking-widest text-slate-400">${uni != null ? 'Davon Universal' : 'Minuten gesamt'}</div>
        <div class="text-3xl font-extrabold text-white tabular-nums mt-1">${uni != null ? days(uni) + ' <span class="text-base font-semibold text-slate-400">Tage</span>' : fmt(min)}</div>
        <div class="text-xs text-slate-400 mt-1">${uni != null ? (min ? Math.round(uni / min * 100) : 0) + ' % des Event-Vorrats' : 'für die Punkte-Rechnung'}</div>
      </div>`;
  }
  $('eventPpm')?.addEventListener('input', () => {
    const v = $('eventPpm').value === '' ? null : Math.max(0, +$('eventPpm').value);
    if (v == null || isNaN(v)) delete R.speedUi.ppm[R.speedUi.event]; else R.speedUi.ppm[R.speedUi.event] = v;
    saveSpeedUi(); renderEvent();
  });

  function renderSpeedOpts() {
    const ev = currentEvent();
    const opts = [['training', '⚔️ Training', '#f87171'], ['healing', '❤️ Heilung', '#34d399'], ['universal', '⏱️ Universal', '#f5c542'],
                  ['research', '📘 Forschung', '#38bdf8'], ['building', '🔨 Bau', '#fb923c']];
    $('speedOpts').innerHTML = '<span class="text-slate-500">Linien:</span>' + opts.map(([k, l, c]) =>
      `<label class="inline-flex items-center gap-1.5 cursor-pointer"><input type="checkbox" data-line="${k}" ${speedLines[k] ? 'checked' : ''} class="w-4 h-4" style="accent-color:${c}">${l}</label>`).join('');
    $('speedOpts').querySelectorAll('input').forEach(i => i.onchange = () => { speedLines[i.dataset.line] = i.checked; saveSpeedUi(); renderHistory(); });
  }

  // ---------- Manuelle Eingabe ----------
  function renderSpeedInputs() { $('speedInputRows').innerHTML = speedGridHtml(R.curSpeed || {}); if (typeof updateSpeedSum === 'function') updateSpeedSum(); }
  // Liest ein Raster aus Tage/Std./Min.-Feldern (data-sk, data-u) in Minuten je Typ
  function readSpeedGrid(container) {
    const e = {}; SPEED.forEach(c => e[c.k] = 0);
    container.querySelectorAll('input[data-sk]').forEach(i => { e[i.dataset.sk] += Math.max(0, Math.round((+i.value || 0) * +i.dataset.u)); });
    e.total = SPEED.reduce((a, c) => a + e[c.k], 0);
    return e;
  }
  function speedGridHtml(e) {
    const inp = 'w-full bg-ink-950 border border-ink-600 rounded-lg px-1.5 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:border-gold-500';
    return SPEED.map(c => {
      const m = e?.[c.k] || 0, d = Math.floor(m / 1440), h = Math.floor(m % 1440 / 60), mi = m % 60;
      return `<span class="text-slate-300 whitespace-nowrap">${ico(c, 'w-5 h-5')} ${c.label}</span>
        <input data-sk="${c.k}" data-u="1440" type="number" min="0" step="1" value="${d || ''}" placeholder="0" class="${inp}">
        <input data-sk="${c.k}" data-u="60" type="number" min="0" step="1" value="${h || ''}" placeholder="0" class="${inp}">
        <input data-sk="${c.k}" data-u="1" type="number" min="0" step="1" value="${mi || ''}" placeholder="0" class="${inp}">`;
    }).join('');
  }
  function saveSpeedEntry(e) {
    const ts = Date.now();
    renderSpeedups(e, ts);
    addHistory({ id: newId(), ts, type: 'speedups', ...e, confidence: 'manuell' });
    saveLastScan({ type: 'speedups', ts, ...e });
    applyMode();
  }
  $('speedSave').onclick = async () => {
    const e = readSpeedGrid($('speedInputRows'));
    if (!e.total) { showError('Bitte mindestens einen Speedup-Wert eintragen.'); return; }
    hideError();
    $('speedSave').disabled = true;
    try { saveSpeedEntry(e); flash($('speedSaveMsg'), savedText(await RokAuth.saveNow('speedups')), true); }
    finally { $('speedSave').disabled = false; }
  };

  function renderSpeedups(e, ts) {
    R.curSpeed = { ...e };
    $('speedTotal').textContent = durText(e.total);
    const prev = R.history.filter(x => x.type === 'speedups' && x.ts < ts && x.total != null).sort((a, b) => b.ts - a.ts)[0];
    const d = prev ? e.total - prev.total : null;
    $('speedDelta').innerHTML = (d == null ? 'Erster Scan' :
      `<span class="${d >= 0 ? 'text-emerald-400' : 'text-red-400'}">${d >= 0 ? '+' : '−'}${durText(Math.abs(d))}</span> seit ${dateLabel(prev.ts)}`)
      + ` · ≈ ${fmt(Math.round(e.total / 1440))} Tage`;
    const max = Math.max(1, ...SPEED.map(c => e[c.k] || 0));
    $('speedCards').innerHTML = SPEED.map(c => `
      <div class="panel rounded-2xl p-5">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl grid place-items-center text-2xl" style="background:${c.c}22;border:1px solid ${c.c}55">${ico(c, 'w-9 h-9')}</div>
          <div class="min-w-0">
            <div class="text-xs uppercase tracking-widest text-slate-400">${c.label}</div>
            <div class="text-xl font-bold text-white tabular-nums">${durText(e[c.k] || 0)}</div>
          </div>
          <div class="ml-auto text-xs text-slate-500 tabular-nums">${e.total ? Math.round((e[c.k] || 0) / e.total * 100) : 0} %</div>
        </div>
        <div class="mt-4 h-2.5 rounded-full bg-ink-950 overflow-hidden">
          <div class="bar h-full rounded-full" style="width:0;background:${c.c}" data-w="${(e[c.k] || 0) / max * 100}"></div>
        </div>
      </div>`).join('');
    $('speedSource').textContent = `Letzter Scan: ${dateLabel(ts)}`;
    hasSpeed = true;
    renderEvent(); renderSpeedInputs();
    animateBars();
  }

  // ---------- Gems ----------
  function renderGems(ge, ts) {
    const g = ge.gems;
    $('gemsValue').textContent = fmt(g);
    $('gemsHand').textContent = ge.gemsHand != null ? fmt(ge.gemsHand) : '–';
    $('gemsBag').textContent = ge.gemsBag != null ? fmt(ge.gemsBag) : '–';
    const prev = R.history.filter(e => e.type === 'gems' && e.ts < ts && e.gems != null).sort((a, b) => b.ts - a.ts)[0];
    const d = prev ? g - prev.gems : null;
    $('gemsDelta').innerHTML = d == null ? 'Erster Scan' :
      `<span class="${d >= 0 ? 'text-emerald-400' : 'text-red-400'}">${d >= 0 ? '+' : '−'}${fmt(Math.abs(d))}</span> seit ${dateLabel(prev.ts)}`;
    $('gemsSource').textContent = `Letzter Scan: ${dateLabel(ts)}`;
    hasGems = true;
  }

  // ---------- AP (Aktionspunkte) – 4 Flaschengrößen ----------
  function readApFields() {
    const c = {};
    AP_SIZES.forEach(z => c['ap_' + z] = Math.max(0, Math.round(+$('ap' + z).value || 0)));
    c.total_ap = apTotal(c);
    return c;
  }
  function fillApFields(c) {
    AP_SIZES.forEach(z => { const v = c?.['ap_' + z]; $('ap' + z).value = v ? v : ''; });
    updateApSum();
  }
  function updateApSum() { $('apSum').textContent = fmt(readApFields().total_ap) + ' AP'; }
  document.querySelectorAll('.ap-in').forEach(i => i.addEventListener('input', () => { i.classList.remove('border-amber-400'); updateApSum(); }));

  function renderAp(c, ts) {
    const total = c.total_ap ?? apTotal(c);
    $('apValue').textContent = fmt(total) + ' AP';
    const prev = R.history.filter(e => e.type === 'ap' && e.ts < ts && e.total_ap != null).sort((a, b) => b.ts - a.ts)[0];
    const d = prev ? total - prev.total_ap : null;
    $('apDelta').innerHTML = d == null ? 'Erster Scan' :
      `<span class="${d >= 0 ? 'text-emerald-400' : 'text-red-400'}">${d >= 0 ? '+' : '−'}${fmt(Math.abs(d))}</span> seit ${dateLabel(prev.ts)}`;
    $('apBreak').innerHTML = AP_SIZES.map(z => {
      const n = +c['ap_' + z] || 0;
      return `<div class="panel rounded-2xl p-4">
        <div class="text-[10px] uppercase tracking-widest text-slate-400">${ico({ img: AP_IMG }, 'w-4 h-4')} ${fmt(z)}er Flaschen</div>
        <div class="text-xl font-bold text-white tabular-nums mt-1">${fmt(n)} <span class="text-sm font-medium text-slate-400">Stk.</span></div>
        <div class="text-xs text-emerald-300 tabular-nums">= ${fmt(n * z)} AP</div>
      </div>`;
    }).join('');
    $('apSource').textContent = `Letzter Scan: ${dateLabel(ts)}`;
    hasAp = true;
  }
  const flash = (el, html, ok) => { el.innerHTML = html; el.className = 'mt-2 text-xs ' + (ok ? 'text-emerald-400' : 'text-amber-300'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.add('hidden'), 6000); }; R.flash = flash;
  const savedText = (r) => r.where === 'scans' ? '✓ Gespeichert · in Supabase (scans)'
    : r.where === 'user_state' ? '✓ Gespeichert · im Profil-Speicher (für public.scans fehlt noch das SQL-Update)'
    : '✓ Lokal gespeichert · Cloud gerade nicht erreichbar, wird automatisch nachgeholt';
  // Letzter AP-Eintrag: Korrekturen innerhalb von 30 Minuten überschreiben ihn statt einen neuen anzulegen
  let activeAp = null;   // { id, ts }
  async function saveApEntry(c, confidence) {
    const entry = { ...c, total_ap: apTotal(c) };
    const fresh = activeAp && Date.now() - activeAp.ts < 30 * 60000 && R.history.some(e => e.id === activeAp.id);
    const ts = fresh ? activeAp.ts : Date.now();
    if (fresh) updateHistory(activeAp.id, { ...entry, confidence });
    else { activeAp = { id: newId(), ts }; addHistory({ id: activeAp.id, ts, type: 'ap', ...entry, confidence }); }
    renderAp(entry, ts);
    saveLastScan({ type: 'ap', ts, ...entry });
    applyMode();
    return RokAuth.saveNow('ap');
  }
  // Anzahl robust lesen: "4.656" / "4,656" / 4656 → 4656
  const toCount = (v) => { if (v == null || v === '') return null; if (typeof v === 'number') return isFinite(v) ? Math.max(0, Math.round(v)) : null; const d = String(v).replace(/[^\d]/g, ''); return d === '' ? null : +d; };
  $('apSave').onclick = async () => {
    const c = readApFields();
    if (!c.total_ap) { showError('Bitte mindestens eine Flaschen-Anzahl eintragen.'); return; }
    hideError();
    AP_SIZES.forEach(z => $('ap' + z).classList.remove('border-amber-400'));
    $('apSave').disabled = true;
    try { flash($('apSaveMsg'), savedText(await saveApEntry(c, 'manuell')), true); }
    finally { $('apSave').disabled = false; }
  };
  // Scan-Ergebnis → sofort auswerten (Karte + Verlauf + Supabase) und die 4 Felder zum Korrigieren füllen
  function prefillAp(r) {
    const c = {}; let found = 0;
    const src = r.ap && typeof r.ap === 'object' ? r.ap : r;
    AP_SIZES.forEach(z => { const v = toCount(src['ap_' + z] ?? src['ap' + z] ?? src[String(z)]); if (v != null) { c['ap_' + z] = v; found++; } });
    (r.items || r.ap_items || src.items || []).forEach(i => { const z = toCount(i.points_each ?? i.size); const q = toCount(i.quantity) ?? 0; if (AP_SIZES.includes(z)) { c['ap_' + z] = (c['ap_' + z] || 0) + q; found++; } });
    if (!found) throw new Error('Keine AP-Flaschen im Screenshot erkannt. Bitte die Anzahl links von Hand eintragen.');
    fillApFields(c);
    AP_SIZES.forEach(z => $('ap' + z).classList.toggle('border-amber-400', c['ap_' + z] != null));
    activeAp = null;                                                  // neuer Scan = neuer Verlaufseintrag
    $('apPrefillMsg').textContent = `✓ Ausgewertet (${r.confidence || 'Scan'}): ${fmt(apTotal(c))} AP. Falls eine Zahl nicht stimmt: Feld korrigieren und „AP speichern“ – das überschreibt diesen Scan.`;
    $('apPrefillMsg').classList.remove('hidden');
    saveApEntry(c, r.confidence || 'Scan').then(res => flash($('apSaveMsg'), savedText(res), true)).catch(e => showError(e.message || String(e)));
  }

  // ---------- Passports (Passseiten für die Migration) ----------
  const PASS_GOAL = 'rok_scanner_pass_goal';
  const passGoalNum = () => { const v = toCount($('passGoal').value); return v ? v : null; };
  try { const g = LS.get(PASS_GOAL, ''); if (g) $('passGoal').value = g; } catch {}
  function renderPass(e, ts) {
    const n = e.passports;
    $('passValue').textContent = fmt(n);
    const prev = R.history.filter(x => x.type === 'passports' && x.ts < ts && x.passports != null).sort((a, b) => b.ts - a.ts)[0];
    const d = prev ? n - prev.passports : null;
    $('passDelta').innerHTML = d == null ? 'Erster Scan' :
      `<span class="${d >= 0 ? 'text-emerald-400' : 'text-red-400'}">${d >= 0 ? '+' : '−'}${fmt(Math.abs(d))}</span> seit ${dateLabel(prev.ts)}`;
    $('passSource').textContent = `Letzter Scan: ${dateLabel(ts)}`;
    renderPassGoal(n);
    hasPass = true;
  }
  function renderPassGoal(n) {
    const goal = passGoalNum(), card = $('passGoalCard');
    card.classList.toggle('hidden', !goal);
    if (!goal) return;
    const have = n ?? 0, miss = Math.max(0, goal - have), pct = Math.min(100, have / goal * 100);
    card.innerHTML = `<div class="flex items-center justify-between gap-3">
        <div class="text-xs uppercase tracking-widest text-slate-400">Migration</div>
        <div class="text-xs text-slate-400 tabular-nums">${fmt(have)} / ${fmt(goal)}</div>
      </div>
      <div class="mt-1 text-lg font-bold ${miss ? 'text-white' : 'text-emerald-400'}">${miss ? `Noch <span class="text-indigo-300 tabular-nums">${fmt(miss)}</span> Passseiten fehlen` : 'Genug Passseiten für die Migration ✓'}</div>
      <div class="mt-3 h-2 rounded-full bg-ink-950 overflow-hidden"><div class="h-full rounded-full" style="width:${pct}%;background:linear-gradient(90deg,#818cf8,#6366f1)"></div></div>`;
  }
  $('passGoal').addEventListener('input', () => {
    const g = passGoalNum(); LS.set(PASS_GOAL, g ? String(g) : '');
    const last = R.history.filter(x => x.type === 'passports').sort((a, b) => b.ts - a.ts)[0];
    renderPassGoal(last?.passports ?? toCount($('passIn').value));
  });
  $('passIn').addEventListener('input', () => $('passIn').classList.remove('border-amber-400'));
  $('passGoal').addEventListener('input', () => { if (passiveReady && R.mode === 'passports') renderPassiveOut('passports'); });
  let activePass = null;   // Korrekturen innerhalb von 30 Minuten überschreiben den letzten Eintrag
  async function savePassEntry(n, confidence, required) {
    const entry = { passports: n, required: required ?? passGoalNum() };
    const fresh = activePass && Date.now() - activePass.ts < 30 * 60000 && R.history.some(e => e.id === activePass.id);
    const ts = fresh ? activePass.ts : Date.now();
    if (fresh) updateHistory(activePass.id, { ...entry, confidence });
    else { activePass = { id: newId(), ts }; addHistory({ id: activePass.id, ts, type: 'passports', ...entry, confidence }); }
    renderPass(entry, ts);
    saveLastScan({ type: 'passports', ts, ...entry });
    applyMode();
    return RokAuth.saveNow('passports');
  }
  $('passSave').onclick = async () => {
    const n = toCount($('passIn').value);
    if (n == null) { showError('Bitte die Anzahl deiner Passseiten eintragen.'); return; }
    hideError();
    $('passIn').classList.remove('border-amber-400');
    $('passSave').disabled = true;
    try { flash($('passSaveMsg'), savedText(await savePassEntry(n, 'manuell')), true); }
    catch (e) { showError(e.message || String(e)); }
    finally { $('passSave').disabled = false; }
  };
  function prefillPass(r) {
    const src = r.passports && typeof r.passports === 'object' ? r.passports : r;
    const n = toCount(src.passports ?? src.passport_pages ?? src.count ?? (typeof r.passports !== 'object' ? r.passports : null));
    if (n == null) throw new Error('Keine Passports im Screenshot erkannt. Bitte die Anzahl links von Hand eintragen.');
    const req = toCount(src.required ?? r.required);
    $('passIn').value = n; $('passIn').classList.add('border-amber-400');
    if (req && !passGoalNum()) { $('passGoal').value = req; LS.set(PASS_GOAL, String(req)); }
    activePass = null;                                               // neuer Scan = neuer Verlaufseintrag
    $('passPrefillMsg').textContent = `✓ Ausgewertet (${r.confidence || 'Scan'}): ${fmt(n)} Passseiten. Falls die Zahl nicht stimmt: Feld korrigieren und „Passports speichern“ – das überschreibt diesen Scan.`;
    $('passPrefillMsg').classList.remove('hidden');
    savePassEntry(n, r.confidence || 'Scan', req).then(res => flash($('passSaveMsg'), savedText(res), true)).catch(e => showError(e.message || String(e)));
  }

  // ---------- Zähler-Bereiche (Goldheads, Keys, Armaments) ----------
  const cntLast = (m) => R.history.filter(e => e.type === m).sort((a, b) => b.ts - a.ts)[0];
  function renderCntInputs(m) {
    const cf = COUNTERS[m], last = cntLast(m);
    $('cntInputs').innerHTML = `<h2 class="font-display text-lg text-gold-300 mb-1">2 · ${cf.title} eingeben</h2>
      <p class="text-xs text-slate-400 mb-3">Anzahl aus dem Inventar. Ein Scan füllt die Felder – kurz prüfen, dann speichern.</p>
      <div class="space-y-2">${cf.fields.map(f => `<label class="grid grid-cols-[1fr_110px] items-center gap-2 text-sm"><span class="text-slate-300">${ico(f, 'w-5 h-5')} ${f.label}</span>
        <input data-cnt="${f.k}" type="number" min="0" step="1" placeholder="0" value="${last && last[f.k] != null ? last[f.k] : ''}" class="cnt-in w-full bg-ink-950 border border-ink-600 rounded-lg px-2 py-2 text-sm text-right tabular-nums focus:outline-none focus:border-gold-500"></label>`).join('')}</div>
      ${cf.sum ? `<div class="mt-3 rounded-lg border border-gold-500/30 bg-gold-500/5 px-3 py-2 flex items-center justify-between"><span class="text-xs uppercase tracking-widest text-slate-400">Gesamt</span><span id="cntSum" class="text-lg font-extrabold text-gold-300 tabular-nums"></span></div>` : ''}
      <div id="cntPrefillMsg" class="hidden mt-2 text-xs text-amber-300"></div>
      <button id="cntSave" class="mt-3 w-full py-2.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-ink-950 font-semibold text-sm">${cf.title} speichern</button>
      <div id="cntSaveMsg" class="hidden mt-2 text-xs"></div>`;
    makeFold($('cntInputs'), 'cnt:' + m);
    const upd = () => { if ($('cntSum')) $('cntSum').textContent = fmt(cntTotal(m, readCntFields(m))) + ' ' + cf.unit; };
    $('cntInputs').querySelectorAll('.cnt-in').forEach(i => i.addEventListener('input', () => { i.classList.remove('border-amber-400'); upd(); }));
    upd();
    $('cntSave').onclick = async () => {
      const e = readCntFields(m);
      if (!cf.fields.some(f => e[f.k])) { showError('Bitte mindestens eine Anzahl eintragen.'); return; }
      hideError(); $('cntSave').disabled = true;
      try { flash($('cntSaveMsg'), savedText(await saveCntEntry(m, e, 'manuell')), true); }
      catch (er) { showError(er.message || String(er)); }
      finally { if ($('cntSave')) $('cntSave').disabled = false; }
    };
  }
  function readCntFields(m) {
    const e = {};
    COUNTERS[m].fields.forEach(f => { const el = $('cntInputs').querySelector(`[data-cnt="${f.k}"]`); e[f.k] = el ? Math.max(0, Math.round(+el.value || 0)) : 0; });
    return e;
  }
  function renderCnt(m) {
    const cf = COUNTERS[m], list = R.history.filter(e => e.type === m).sort((a, b) => b.ts - a.ts), e = list[0], prev = list[1];
    if (!e) { $('cntSection').innerHTML = ''; return false; }
    const delta = (a, b) => b == null || a == null ? '' : `<span class="${a - b >= 0 ? 'text-emerald-400' : 'text-red-400'}">${a - b >= 0 ? '+' : '−'}${fmt(Math.abs(a - b))}</span>`;
    const big = (icon, c, label, value, d) => `<div class="panel rounded-2xl p-6 flex items-center gap-5">
        <div class="w-16 h-16 shrink-0 rounded-2xl grid place-items-center text-4xl" style="background:linear-gradient(135deg,${c}33,${c}11);border:1px solid ${c}55">${icon}</div>
        <div><div class="text-xs uppercase tracking-widest text-slate-400">${label}</div>
          <div class="text-4xl font-extrabold text-white tabular-nums">${value}</div>
          <div class="text-sm mt-1 text-slate-400">${prev ? `${d} seit ${dateLabel(prev.ts)}` : 'Erster Scan'}</div></div></div>`;
    let html = `<div class="flex items-end justify-between"><h2 class="font-display text-2xl gold-text">${cf.title}</h2><span class="text-xs text-slate-400">Letzter Scan: ${dateLabel(e.ts)}</span></div>`;
    if (cf.fields.length === 1) {
      const f = cf.fields[0];
      html += big(ico(f, 'w-12 h-12'), f.c, f.label, fmt(e[f.k]), delta(e[f.k], prev?.[f.k]));
    } else {
      if (cf.sum) html += big(ico(cf, 'w-12 h-12'), cf.c, cf.sumLabel, fmt(cntTotal(m, e)), delta(cntTotal(m, e), prev ? cntTotal(m, prev) : null));
      const tot = cntTotal(m, e) || 0;
      html += `<div class="grid grid-cols-2 ${cf.fields.length > 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-3'} gap-3">${cf.fields.map(f => {
        const v = +e[f.k] || 0, inSum = cf.sum?.includes(f.k), pct = inSum && tot ? Math.round(v / tot * 100) : null;
        return `<div class="panel rounded-2xl p-4">
          <div class="flex items-center justify-between gap-2"><div class="text-[10px] uppercase tracking-widest text-slate-400 truncate">${ico(f, 'w-4 h-4')} ${f.label}</div>${pct != null ? `<div class="text-[10px] text-slate-500 tabular-nums">${pct} %</div>` : ''}</div>
          <div class="text-2xl font-bold tabular-nums mt-1" style="color:${f.c}">${fmt(v)}</div>
          <div class="text-xs tabular-nums mt-0.5">${prev ? delta(v, +prev[f.k] || 0) || '' : ''}</div>
          ${pct != null ? `<div class="mt-2 h-1.5 rounded-full bg-ink-950 overflow-hidden"><div class="h-full rounded-full" style="width:${pct}%;background:${f.c}"></div></div>` : ''}
        </div>`; }).join('')}</div>`;
    }
    $('cntSection').innerHTML = html;
    return true;
  }
  let activeCnt = {};   // je Bereich: Korrekturen innerhalb von 30 Minuten überschreiben den letzten Eintrag
  async function saveCntEntry(m, entry, confidence) {
    const a = activeCnt[m], fresh = a && Date.now() - a.ts < 30 * 60000 && R.history.some(e => e.id === a.id);
    const ts = fresh ? a.ts : Date.now();
    if (fresh) updateHistory(a.id, { ...entry, confidence });
    else { activeCnt[m] = { id: newId(), ts }; addHistory({ id: activeCnt[m].id, ts, type: m, ...entry, confidence }); }
    saveLastScan({ type: m, ts, ...entry });
    applyMode();
    return RokAuth.saveNow(m);
  }
  function prefillCnt(m, r) {
    const cf = COUNTERS[m], src = r.counts && typeof r.counts === 'object' ? r.counts : r, e = {}; let found = 0;
    cf.fields.forEach(f => { const v = toCount(src[f.k]); if (v != null) found++; e[f.k] = v ?? 0; });
    if (!found) throw new Error(`Keine ${cf.title} im Screenshot erkannt. Bitte die Anzahl links von Hand eintragen.`);
    activeCnt[m] = null;                                              // neuer Scan = neuer Verlaufseintrag
    saveCntEntry(m, e, r.confidence || 'Scan').then(res => {
      cf.fields.forEach(f => { const el = $('cntInputs').querySelector(`[data-cnt="${f.k}"]`); if (el && toCount(src[f.k]) != null) el.classList.add('border-amber-400'); });
      $('cntPrefillMsg').textContent = `✓ Ausgewertet (${r.confidence || 'Scan'}). Falls eine Zahl nicht stimmt: Feld korrigieren und „${cf.title} speichern“ – das überschreibt diesen Scan.`;
      $('cntPrefillMsg').classList.remove('hidden');
      flash($('cntSaveMsg'), savedText(res), true);
    }).catch(er => showError(er.message || String(er)));
  }

  // ---------- Materialien: Eingabe, Auswertung, Karten ----------
  $('matsGrid').innerHTML = '<span></span>' + GRADES.map(g => `<span class="text-center" title="${g.label}"><i class="inline-block w-3 h-3 rounded-sm" style="background:${g.c}"></i></span>`).join('')
    + [CHEST, ...MATS].map(m => `<span class="text-slate-300 whitespace-nowrap truncate">${ico(m, 'w-4 h-4')} ${m.label}</span>` + GRADES.map(g =>
      `<input id="m_${m.k}_${g.k}" type="number" min="0" step="1" placeholder="0" title="${m.label} · ${g.label}"
         class="mat-in w-full bg-ink-950 border rounded-md px-1 py-1.5 text-xs text-right tabular-nums focus:outline-none focus:border-gold-500" style="border-color:${g.c}55">`).join('')).join('');
  function readMatFields() { const e = {}; ALL_MAT_KEYS.forEach(k => e[k] = Math.max(0, Math.round(+$('m_' + k).value || 0))); e.total_leg = matTotal(e); return e; }
  function fillMatFields(e) { ALL_MAT_KEYS.forEach(k => { $('m_' + k).value = e?.[k] ? e[k] : ''; }); }
  document.querySelectorAll('.mat-in').forEach(i => i.addEventListener('input', () => i.classList.remove('ring-1', 'ring-amber-400')));

  function renderMats(e, ts) {
    const total = matTotal(e), chestEq = chestLeg(e);
    $('matsChests').innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div class="flex items-center gap-2"><span class="text-2xl">📦</span><span class="text-sm font-semibold text-white">Material-Kisten</span></div>
        <div class="text-sm text-slate-300">Äquivalent in Legendär: <b class="text-gold-300 tabular-nums">${fmtLeg(chestEq)}</b></div>
      </div>
      <div class="grid grid-cols-5 gap-1.5">
        ${GRADES.map(g => `<div class="rounded-lg bg-ink-950/60 px-1 py-2 text-center border" style="border-color:${g.c}66" title="${g.label}">
          <div class="text-[10px] font-semibold" style="color:${g.c}">${g.label}</div>
          <div class="text-sm font-bold text-white tabular-nums">${fmt(+e['chest_' + g.k] || 0)}</div></div>`).join('')}
      </div>`;
    const sel = matSelTotal(e), nSel = [...MATS.map(m => m.k), 'chest'].filter(k => matSel[k]).length;
    const tile = (k, icon, label, v) => `<button type="button" data-msel="${k}" aria-pressed="${!!matSel[k]}" title="Antippen: in Gesamtsumme zählen / nicht zählen"
        class="rounded-lg bg-ink-950/60 px-3 py-2 text-center border-2 transition ${matSel[k] ? 'border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.25)]' : 'border-ink-700 opacity-50 hover:opacity-80'}">
        <div class="text-[10px] uppercase tracking-wider whitespace-nowrap ${matSel[k] ? 'text-emerald-300' : 'text-slate-500'}">${icon} ${label}</div>
        <div class="text-sm font-bold text-white tabular-nums">${fmtLeg(v)}</div></button>`;
    $('matsSum').innerHTML = `
      <div class="flex flex-wrap items-center gap-5">
        <div class="w-14 h-14 shrink-0 rounded-2xl grid place-items-center text-3xl" style="background:linear-gradient(135deg,#facc1533,#b7830f22);border:1px solid #facc1555">⚒️</div>
        <div class="flex-1 min-w-[180px]">
          <div class="text-xs uppercase tracking-widest text-slate-400">Gesamt · Äquivalent in Legendär</div>
          <div class="text-4xl font-extrabold text-gold-300 tabular-nums">${fmtLeg(sel)}</div>
          <div class="text-xs text-slate-400 mt-0.5">${nSel} von 5 ausgewählt – Kachel antippen zum Ein-/Ausschließen</div>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full sm:w-auto">
          ${MATS.map(m => tile(m.k, ico(m, 'w-4 h-4'), m.label, matLeg(e, m.k))).join('')}
          ${tile('chest', ico(CHEST, 'w-4 h-4'), CHEST.label, chestEq)}
        </div>
      </div>`;
    $('matsSum').querySelectorAll('[data-msel]').forEach(b => b.onclick = () => {
      matSel[b.dataset.msel] = !matSel[b.dataset.msel];
      try { localStorage.setItem('rok_mat_sel', JSON.stringify(matSel)); } catch {}
      renderMats(e, ts);
      if (histTab === 'materials') renderHistory();
    });
    $('matsCards').innerHTML = MATS.map(m => {
      const leg = matLeg(e, m.k), full = Math.floor(leg + 1e-9), pct = Math.round((leg - full) * 100);
      return `<div class="panel rounded-2xl p-5">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl grid place-items-center text-2xl" style="background:${m.c}22;border:1px solid ${m.c}55">${ico(m, 'w-9 h-9')}</div>
          <div class="min-w-0">
            <div class="text-xs uppercase tracking-widest text-slate-400">${m.label}</div>
            <div class="text-sm text-slate-300">Äquivalent in Legendär: <b class="text-xl text-gold-300 tabular-nums">${fmtLeg(leg)}</b></div>
          </div>
        </div>
        <div class="mt-4 grid grid-cols-5 gap-1.5">
          ${GRADES.map(g => `<div class="rounded-lg bg-ink-950/60 px-1 py-2 text-center border" style="border-color:${g.c}66" title="${g.label}">
            <div class="text-[10px] font-semibold" style="color:${g.c}">${g.label}</div>
            <div class="text-sm font-bold text-white tabular-nums">${fmt(+e[m.k + '_' + g.k] || 0)}</div></div>`).join('')}
        </div>
        <div class="mt-4 h-2.5 rounded-full bg-ink-950 overflow-hidden" title="${pct} % zum nächsten legendären Material">
          <div class="bar h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-600" style="width:0" data-w="${pct}"></div>
        </div>
        <div class="mt-1.5 flex justify-between text-[11px] text-slate-400"><span>${fmt(full)} volle legendäre herstellbar</span><span>${pct} % zum nächsten</span></div>
      </div>`;
    }).join('');
    $('matsSource').textContent = ts ? `Letzter Scan: ${dateLabel(ts)}` : '';
    hasMats = true;
    animateBars();
  }
  // Speichern: Korrekturen innerhalb von 30 Minuten überschreiben den letzten Eintrag
  let activeMats = null;
  async function saveMatsEntry(e, confidence) {
    const entry = { ...e, total_leg: matTotal(e) };
    const fresh = activeMats && Date.now() - activeMats.ts < 30 * 60000 && R.history.some(x => x.id === activeMats.id);
    const ts = fresh ? activeMats.ts : Date.now();
    if (fresh) updateHistory(activeMats.id, { ...entry, confidence });
    else { activeMats = { id: newId(), ts }; addHistory({ id: activeMats.id, ts, type: 'materials', ...entry, confidence }); }
    renderMats(entry, ts);
    saveLastScan({ type: 'materials', ts, ...entry });
    applyMode();
    return RokAuth.saveNow('materials');
  }
  $('matsSave').onclick = async () => {
    const e = readMatFields();
    if (!ALL_MAT_KEYS.some(k => e[k] > 0)) { showError('Bitte mindestens ein Material eintragen.'); return; }
    hideError(); $('matsSave').disabled = true;
    try { flash($('matsSaveMsg'), savedText(await saveMatsEntry(e, 'manuell')), true); }
    finally { $('matsSave').disabled = false; }
  };
  function prefillMats(r) {
    const src = r.materials || r, e = {}; let found = 0;
    MATS.forEach(m => GRADES.forEach(g => { const v = toCount(src?.[m.k]?.[g.k]); if (v != null) { e[m.k + '_' + g.k] = v; found++; } }));
    const ch = r.chests || src.chests;
    GRADES.forEach(g => { const v = toCount(ch?.[g.k]); if (v != null) { e['chest_' + g.k] = v; found++; } });
    if (!found) throw new Error('Keine Materialien im Screenshot erkannt. Bitte die Anzahl links von Hand eintragen.');
    ALL_MAT_KEYS.forEach(k => { if (e[k] == null) e[k] = 0; });
    fillMatFields(e);
    activeMats = null;
    saveMatsEntry(e, r.confidence || 'Scan').then(res => flash($('matsSaveMsg'), savedText(res), true)).catch(x => showError(x.message || String(x)));
  }

  // ---------- Speedups: Live-Summe der Eingabe ----------
  function updateSpeedSum() {
    const e = readSpeedGrid($('speedInputRows'));
    $('speedSum').textContent = e.total ? `${durText(e.total)} · ${days(e.total)} Tage` : '0 Min.';
  }
  $('speedInputRows').addEventListener('input', updateSpeedSum);

  // Getrennte Seiten: Ressourcen | VIP | Gems | Speedups | AP
  function applyMode() {
    const has = { speedups: hasSpeed, resources: hasRes, vip: hasVip, gems: hasGems, ap: hasAp, mats: hasMats, passports: hasPass }[R.mode] ?? (COUNTERS[R.mode] ? renderCnt(R.mode) : false);
    document.querySelectorAll('.seg-btn[data-mode]').forEach(x => x.setAttribute('aria-pressed', x.dataset.mode === R.mode));
    $('vipInputs').classList.toggle('hidden', R.mode !== 'vip');
    $('resSection').classList.toggle('hidden', R.mode !== 'resources' || !hasRes);
    $('resTotals').classList.toggle('hidden', R.mode !== 'resources' || !hasRes);
    $('vipSection').classList.toggle('hidden', R.mode !== 'vip' || !hasVip);
    $('gemsSection').classList.toggle('hidden', R.mode !== 'gems' || !hasGems);
    $('apSection').classList.toggle('hidden', R.mode !== 'ap' || !hasAp);
    $('apInputs').classList.toggle('hidden', R.mode !== 'ap');
    $('passSection').classList.toggle('hidden', R.mode !== 'passports' || !hasPass);
    $('passInputs').classList.toggle('hidden', R.mode !== 'passports');
    const isCnt = !!COUNTERS[R.mode];
    $('cntInputs').classList.toggle('hidden', !isCnt);
    $('cntSection').classList.toggle('hidden', !isCnt || !has);
    if (isCnt && $('cntInputs').dataset.m !== R.mode) { renderCntInputs(R.mode); $('cntInputs').dataset.m = R.mode; }
    if (passiveReady) renderStats(R.mode); else if ($('passiveInputs')) $('passiveInputs').classList.add('hidden');
    $('speedSection').classList.toggle('hidden', R.mode !== 'speedups' || !hasSpeed);
    $('speedInputs').classList.toggle('hidden', R.mode !== 'speedups');
    $('speedOpts').classList.toggle('hidden', R.mode !== 'speedups');
    $('matOpts').classList.toggle('hidden', R.mode !== 'mats');
    if (R.mode === 'mats') renderMatLines($('matOpts'), () => renderHistory());
    $('farmSection').classList.toggle('hidden', R.mode !== 'resources');
    $('resLines').classList.toggle('hidden', R.mode !== 'resources');
    $('matsSection').classList.toggle('hidden', R.mode !== 'mats' || !hasMats);
    $('matsInputs').classList.toggle('hidden', R.mode !== 'mats');
    if ($('loadingState').classList.contains('hidden')) $('analyzeLabel').textContent = R.mode === 'mats' ? 'Materialien scannen' : 'Analysieren';
    renderCredits();
    $('emptyState').classList.toggle('hidden', !!has);
    $('emptyState').querySelector('p').textContent = {
      resources: 'Lade einen Screenshot der Ressourcen deines Main-Accounts hoch und klicke auf „Analysieren“.',
      vip: 'Lade einen Screenshot deines Inventars mit VIP-Punkte-Items hoch und klicke auf „Analysieren“ – oder nutze „Rechner ohne Scan öffnen“.',
      gems: 'Lade einen Screenshot hoch, auf dem deine Edelsteine zu sehen sind, und klicke auf „Analysieren“.',
      ap: 'Lade einen Screenshot deiner AP-Flaschen aus dem Inventar hoch und klicke auf „Analysieren“ – oder trag die Anzahl je Flaschengröße links ein.',
      speedups: 'Lade Screenshots deiner Beschleuniger aus dem Inventar hoch und klicke auf „Analysieren“ – oder trag deinen Bestand links unter „Speedups eingeben“ ein.',
      mats: 'Lade Screenshots deiner Schmiedematerialien aus dem Rucksack hoch und klicke auf „Materialien scannen“ – oder trag die Anzahl links von Hand ein.',
      passports: 'Lade einen Screenshot deiner Passseiten aus dem Inventar hoch und klicke auf „Analysieren“ – oder trag die Anzahl links von Hand ein.',
      goldheads: 'Lade einen Screenshot deiner universellen legendären Skulpturen (Goldheads) hoch und klicke auf „Analysieren“ – oder trag die Anzahl links von Hand ein.',
      keys: 'Lade einen Screenshot deiner Schlüssel aus dem Inventar hoch und klicke auf „Analysieren“ – oder trag die Anzahl links von Hand ein.',
      armaments: 'Lade Screenshots deiner Armaments und Schriftrollen hoch und klicke auf „Analysieren“ – oder trag die Anzahl links von Hand ein.'
    }[R.mode];
    histTab = R.mode === 'mats' ? 'materials' : R.mode; syncTabs(); renderHistory();
    renderHub();
    renderAreaTabs();
  }


  // ---------- Klappbare Felder (Zustand pro Gerät + Cloud über user_state) ----------
  var FOLD_KEY = 'rok_scanner_fold', folds;   // var: makeFold kann schon vor dieser Zeile laufen
  function loadFolds() { if (!folds) { try { folds = JSON.parse(LS.get('rok_scanner_fold', '{}')) || {}; } catch { folds = {}; } } return folds; }
  function makeFold(sec, key) {
    if (!sec) return;
    loadFolds();
    const h = sec.querySelector(':scope > h2'); if (!h) return;
    let body = sec.querySelector(':scope > .fold-body');
    if (!body) {
      body = document.createElement('div');
      body.className = 'fold-body mt-3' + (sec.classList.contains('space-y-4') ? ' space-y-4' : '');
      [...sec.children].filter(c => c !== h).forEach(c => body.appendChild(c));
      sec.appendChild(body);
      sec.classList.remove('space-y-4');
      h.classList.remove('mb-1', 'mb-3');
      h.classList.add('flex', 'items-center', 'justify-between', 'gap-3', 'cursor-pointer', 'select-none');
      const t = document.createElement('span'); while (h.firstChild) t.appendChild(h.firstChild); h.appendChild(t);
      const chev = document.createElement('span');
      chev.className = 'fold-chev shrink-0 w-7 h-7 rounded-lg grid place-items-center border border-ink-600 text-slate-400 transition-transform';
      chev.innerHTML = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>';
      h.appendChild(chev);
      h.setAttribute('role', 'button'); h.tabIndex = 0;
      const toggle = () => { loadFolds(); folds[sec.dataset.fold] = !folds[sec.dataset.fold]; LS.set('rok_scanner_fold', JSON.stringify(folds)); applyFold(sec); };
      h.onclick = toggle;
      h.onkeydown = (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggle(); } };
    }
    sec.dataset.fold = key;
    applyFold(sec);
  }
  function applyFold(sec) {
    const closed = !!loadFolds()[sec.dataset.fold], body = sec.querySelector(':scope > .fold-body'), h = sec.querySelector(':scope > h2');
    if (body) body.hidden = closed;
    if (h) { h.setAttribute('aria-expanded', String(!closed)); h.title = closed ? 'Aufklappen' : 'Zuklappen'; }
    const ch = sec.querySelector(':scope > h2 .fold-chev'); if (ch) ch.style.transform = closed ? 'rotate(-90deg)' : '';
  }

  // ---------- Passive Income: was regelmäßig dazukommt (Events, Truhen, Allianz, Farmen …) ----------
  var passiveReady = false;
  const PASSIVE_KEY = 'rok_scanner_passive';
  let passive = {}; try { passive = JSON.parse(LS.get(PASSIVE_KEY, '{}')) || {}; } catch { passive = {}; }
  const PERIODS = { day: { label: 'pro Tag', d: 1 }, week: { label: 'pro Woche', d: 7 }, month: { label: 'pro Monat', d: 30 } };
  function passiveFields(m) {
    if (m === 'ap') return [{ k: 'ap', label: 'AP', icon: '⚡', img: AP_IMG, c: '#34d399' }];
    if (m === 'speedups') return SPEED.map(c => ({ ...c, unit: 'Std.' }));
    if (m === 'gems') return [{ k: 'gems', label: 'Gems', icon: '💎', img: 'ressourcen/gems.png', c: '#f472b6' }];
    if (m === 'resources') return RES.map(r => ({ ...r, c: r.from, text: true }));
    if (m === 'mats') return MATS.map(x => ({ ...x, unit: 'Legendär', dec: true }));
    if (m === 'passports') return [{ k: 'passports', label: 'Passseiten', icon: '🛂', img: 'sonstiges/passport.webp', c: '#818cf8' }];
    if (COUNTERS[m] && m !== 'keys') return COUNTERS[m].fields;
    return null;
  }
  // aktueller Bestand je Feld (aus dem letzten Scan) – Grundlage für die Hochrechnung
  function passiveNow(m) {
    const last = (t) => R.history.filter(e => e.type === t).sort((a, b) => b.ts - a.ts)[0];
    if (m === 'ap') { const e = last('ap'); return e ? { ap: e.total_ap } : {}; }
    if (m === 'gems') { const e = last('gems'); return e ? { gems: e.gems } : {}; }
    if (m === 'passports') { const e = last('passports'); return e ? { passports: e.passports } : {}; }
    if (m === 'speedups') { const e = last('speedups'); return e || {}; }
    if (m === 'resources') { const e = last('resources'); return e || {}; }
    if (m === 'mats') { const e = last('materials'); return e ? Object.fromEntries(MATS.map(x => [x.k, matLeg(e, x.k)])) : {}; }
    return last(m) || {};
  }
  const pState = (m) => (passive[m] = passive[m] || { period: 'week', vals: {} });
  const pPerDay = (m, f) => { const st = pState(m), v = +st.vals[f.k] || 0; return v / PERIODS[st.period].d * (m === 'speedups' ? 60 : 1); };   // Speedups: Minuten
  const pFmt = (m, f, v) => m === 'speedups' ? durText(Math.round(v)) : f.dec ? fmtLeg(v) : f.text ? short(v) : fmt(v);
  function renderPassive(m) {
    const fields = passiveFields(m), sec = $('passiveInputs');
    sec.classList.toggle('hidden', !fields);
    if (!fields) return;
    if (sec.dataset.m !== m) {
      const st = pState(m);
      const inp = 'w-full bg-ink-950 border border-ink-600 rounded-lg px-2 py-2 text-sm text-right tabular-nums focus:outline-none focus:border-gold-500';
      sec.innerHTML = `<h2 class="font-display text-lg text-gold-300">Passive Income</h2>
        <p class="text-xs text-slate-400 mb-3">Was regelmäßig dazukommt (Events, Truhen, Allianz-Shop, Farmen …). Wird automatisch gespeichert und hochgerechnet.</p>
        <div class="grid grid-cols-3 gap-1 p-1 rounded-xl bg-ink-950 border border-ink-700 mb-3" role="group">
          ${Object.entries(PERIODS).map(([k, p]) => `<button type="button" data-pper="${k}" aria-pressed="${st.period === k}" class="seg-btn rounded-lg py-1.5 text-xs font-semibold transition">${p.label}</button>`).join('')}
        </div>
        <div class="space-y-2">${fields.map(f => `<label class="grid grid-cols-[1fr_110px] items-center gap-2 text-sm">
            <span class="text-slate-300 min-w-0 truncate">${ico(f, 'w-5 h-5')} ${f.label}${f.unit ? ` <span class="text-slate-500 text-xs">(${f.unit})</span>` : ''}</span>
            <input data-pin="${f.k}" ${f.text ? 'type="text" inputmode="decimal"' : `type="number" min="0" step="${f.dec || m === 'speedups' ? 'any' : '1'}"`} placeholder="0" value="${st.vals[f.k] ?? ''}" class="${inp}"></label>`).join('')}</div>
        <div class="mt-4">${horizonCtl()}</div>
        <div id="passiveOut" class="mt-3"></div>`;
      sec.dataset.m = m;
      sec.querySelectorAll('[data-pper]').forEach(b => b.onclick = () => {
        pState(m).period = b.dataset.pper; LS.set(PASSIVE_KEY, JSON.stringify(passive));
        sec.querySelectorAll('[data-pper]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        renderPassiveOut(m);
      });
      sec.querySelectorAll('[data-pin]').forEach(i => i.addEventListener('input', () => {
        const f = fields.find(x => x.k === i.dataset.pin);
        const v = i.value.trim() === '' ? null : f.text ? parseAmount(i.value) : +i.value;
        if (v == null || isNaN(v)) delete pState(m).vals[f.k]; else pState(m).vals[f.k] = Math.max(0, v);
        clearTimeout(renderPassive._t); renderPassive._t = setTimeout(() => LS.set(PASSIVE_KEY, JSON.stringify(passive)), 400);
        renderPassiveOut(m);
      }));
      bindHorizonCtl(sec, () => renderPassiveOut(m));
      makeFold(sec, 'passive:' + m);
    }
    renderPassiveOut(m);
  }
  // ---------- Zeiträume für die Hochrechnung: 7 T · 30 T · eigene Tage · bis KvK-Start ----------
  const hState = () => (passive._h = passive._h || { custom: 14, sel: 'now' });
  function kvkStartDate() { try { const d = RokAuth.ownMeta?.()?.kvk_start; return /^\d{4}-\d{2}-\d{2}$/.test(d || '') ? d : null; } catch { return null; } }
  function horizons() {
    const st = hState(), n = Math.max(1, Math.min(999, Math.round(+st.custom || 14)));
    const H = [{ k: '7', days: 7, label: '7 Tage' }, { k: '30', days: 30, label: '30 Tage' }, { k: 'custom', days: n, label: `${n} Tage` }];
    const kd = kvkStartDate();
    if (kd) { const ms = Date.parse(kd + 'T00:00:00Z') - Date.now(); if (ms > 0) H.push({ k: 'kvk', days: ms / 86400000, label: 'bis KvK' }); }
    return H;
  }
  const savePassive = () => { clearTimeout(savePassive._t); savePassive._t = setTimeout(() => LS.set(PASSIVE_KEY, JSON.stringify(passive)), 400); };
  // Eingabe für eigene Tage + Hinweis zum KvK-Start
  function horizonCtl() {
    const kd = kvkStartDate();
    return `<div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
      <label class="inline-flex items-center gap-2">Eigener Zeitraum <input data-hcustom type="number" min="1" max="999" step="1" value="${hState().custom}" class="w-16 bg-ink-950 border border-ink-600 rounded-lg px-2 py-1 text-right tabular-nums text-slate-200 focus:outline-none focus:border-gold-500"> Tage</label>
      <span>${kd ? `KvK-Start: <b class="text-slate-200">${kd.split('-').reverse().join('.')}</b>` : 'KvK-Start nicht festgelegt (unter KvK → Get Ready)'}</span></div>`;
  }
  function bindHorizonCtl(root, rerender) {
    root.querySelectorAll('[data-hcustom]').forEach(i => i.addEventListener('input', () => {
      const v = Math.round(+i.value); if (!(v >= 1)) return;
      hState().custom = Math.min(999, v); savePassive(); rerender();
    }));
  }

  // ---------- AP: Statistik (was kann ich machen) + aktivierbare Passive-Quellen ----------
  const AP_PER_FORT = (430 + 237) * 50 / (720 + 373);   // 720 Forts ≈ 430×50er, 373 Forts ≈ 237×50er → Ø ≈ 30,5 AP
  const AP_PER_BARB = 915 * 100 / 7000;                 // 7.000 Barbaren ≈ 915×100er → Ø ≈ 13,1 AP
  const f1 = (v) => (+v).toLocaleString('de-DE', { maximumFractionDigits: 1 });
  const AP_COSTS = [
    { k: 'barbOff', label: 'Barbaren (Offseason)', def: 40, icon: '🪓', hint: '50 AP, je Folgeangriff −2 bis 40' },
    { k: 'barbKvk', label: 'Barbaren (KvK)', def: 40, icon: '⚔️' },
    { k: 'fortOff', label: 'Forts (Offseason)', def: 150, icon: '🏰' },
    { k: 'fortKvk', label: 'Forts (KvK)', def: 150, icon: '🏯' },
    { k: 'maraud', label: 'Marodeure (KvK)', def: 50, icon: '🐎' }
  ];
  const AP_SRC = [
    { k: 'daily', label: 'Daily', desc: '100 AP jeden Tag', perDay: () => 100 },
    { k: 'monday', label: 'Montags-Belohnung', desc: '3.000 AP jeden Montag', perDay: () => 3000 / 7, inc: (s, days) => 3000 * mondays(days) },
    { k: 'afort', label: 'Allianz-Forts', desc: '100 % = 7.000 AP pro Woche', pct: true, perDay: (s) => 7000 * (s.pct || 100) / 100 / 7 },
    { k: 'forts', label: 'Eigene Forts', desc: `Ø ${f1(AP_PER_FORT)} AP pro Fort (720 Forts ≈ 430×50er · 373 ≈ 237×50er)`, input: { label: 'Forts pro Woche (Ø)', ph: 'z. B. 35' }, perDay: (s) => (+s.w || 0) * AP_PER_FORT / 7 },
    { k: 'barbs', label: 'Baulurs', desc: `Ø ${f1(AP_PER_BARB)} AP pro Baulur (7.000 Baulurs = 915×100er = 91.500 AP)`, input: { label: 'Baulurs pro Tag', def: 108 }, perDay: (s) => (s.n ?? 108) * AP_PER_BARB },
    { k: 'bundle', label: 'Daily Bundle', desc: '500 AP pro Kauf', input: { label: 'Käufe pro Tag', def: 1 }, perDay: (s) => (s.n ?? 1) * 500 }
  ];
  function mondays(days) { let c = 0; const d = new Date(); for (let i = 1; i <= Math.floor(days); i++) { d.setDate(d.getDate() + 1); if (d.getDay() === 1) c++; } return c; }
  const apSrc = (k) => { const a = (passive.apSrc = passive.apSrc || {}); return (a[k] = a[k] || { on: false }); };
  const apCost = (k) => { const c = (passive.apCost = passive.apCost || {}); const d = AP_COSTS.find(x => x.k === k).def; return +c[k] > 0 ? +c[k] : d; };
  const apIncome = (days) => AP_SRC.reduce((a, x) => { const s = apSrc(x.k); return a + (s.on ? (x.inc ? x.inc(s, days) : x.perDay(s) * days) : 0); }, 0);
  const apPerDay = () => AP_SRC.reduce((a, x) => a + (apSrc(x.k).on ? x.perDay(apSrc(x.k)) : 0), 0);
  const apNow = () => { const e = R.history.filter(x => x.type === 'ap' && x.total_ap != null).sort((a, b) => b.ts - a.ts)[0]; return e ? +e.total_ap : null; };
  const toggleBtn = (attr, on) => `<button type="button" ${attr} role="switch" aria-checked="${on}" class="ap-tog relative shrink-0 w-11 h-6 rounded-full border border-ink-600 bg-ink-800 transition"><span class="absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-slate-400 transition-transform"></span></button>`;
  function renderApStats() {
    const top = $('statsTop');
    const inp = 'w-20 bg-ink-950 border border-ink-600 rounded-lg px-2 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:border-gold-500';
    top.innerHTML = `
      <section id="apCanDo" class="panel rounded-2xl p-5">
        <h2 class="font-display text-lg text-gold-300">Was kannst du mit deinen AP machen?</h2>
        <div id="apChips" class="flex flex-wrap gap-1 p-1 rounded-xl bg-ink-950 border border-ink-700 mb-4" role="group"></div>
        <div id="apCanDoOut"></div>
        <details class="mt-4 group">
          <summary class="cursor-pointer select-none text-xs text-slate-400 hover:text-gold-300">⚙ AP-Kosten anpassen</summary>
          <div class="mt-3 grid sm:grid-cols-2 gap-2">${AP_COSTS.map(c => `<label class="flex items-center justify-between gap-2 text-sm"><span class="text-slate-300">${c.icon} ${c.label}</span>
            <span class="inline-flex items-center gap-1"><input data-apcost="${c.k}" type="number" min="1" step="1" value="${passive.apCost?.[c.k] ?? ''}" placeholder="${c.def}" class="${inp}"><span class="text-xs text-slate-500">AP</span></span></label>`).join('')}</div>
          <p class="mt-2 text-[11px] text-slate-500">Barbaren: 50 AP, je Angriff ohne Rückkehr −2 bis 40 (mit Talent „Einsicht“ weniger). Forts und Marodeure sind Schätzwerte – trag hier deine echten Kosten ein.</p>
        </details>
      </section>`;
    $('passTop').innerHTML = `
      <section id="apPassive" class="panel rounded-2xl p-5">
        <h2 class="font-display text-lg text-gold-300">Passive AP</h2>
        <p class="text-xs text-slate-400 mb-3">Aktiviere, was auf dich zutrifft – wird automatisch gespeichert und hochgerechnet.</p>
        <div class="space-y-2">${AP_SRC.map(x => { const s = apSrc(x.k); return `
          <div class="ap-src rounded-xl border border-ink-700 bg-ink-950/40 px-3 py-2.5" data-on="${!!s.on}" data-src="${x.k}">
            <div class="flex items-center gap-3">
              ${toggleBtn(`data-aptog="${x.k}"`, !!s.on)}
              <div class="ap-src-body min-w-0 flex-1">
                <div class="text-sm font-semibold text-white">${ico({ img: AP_IMG }, 'w-4 h-4')} ${x.label}</div>
                <div class="text-[11px] text-slate-400">${x.desc}</div>
              </div>
              <div class="ap-src-body text-right text-xs tabular-nums text-emerald-400 whitespace-nowrap" data-apday="${x.k}"></div>
            </div>
            ${x.pct ? `<div class="ap-src-body mt-2 grid grid-cols-4 gap-1 p-1 rounded-lg bg-ink-950 border border-ink-700">${[25, 50, 75, 100].map(p => `<button type="button" data-appct="${p}" data-k="${x.k}" aria-pressed="${(s.pct || 100) === p}" class="seg-btn rounded-md py-1 text-xs font-semibold transition">${p} %</button>`).join('')}</div>` : ''}
            ${x.input ? `<label class="ap-src-body mt-2 flex items-center justify-between gap-2 text-xs text-slate-300">${x.input.label}<input data-apn="${x.k}" type="number" min="0" step="any" value="${s[x.k === 'forts' ? 'w' : 'n'] ?? x.input.def ?? ''}" placeholder="${x.input.ph || ''}" class="${inp}"></label>` : ''}
          </div>`; }).join('')}</div>
        <div class="mt-4">${horizonCtl()}</div>
        <div id="apPassiveOut" class="mt-3"></div>
        <div class="mt-5">
          <div class="text-xs uppercase tracking-widest text-slate-400 mb-2">AP-Verlauf</div>
          <div id="apLineSel" class="flex flex-wrap gap-x-4 gap-y-2 mb-3 text-xs text-slate-300"></div>
          <div id="apChartWrap" class="h-64"></div>
        </div>
      </section>
      <section id="apDay" class="panel rounded-2xl p-5">
        <h2 class="font-display text-lg text-gold-300">Was schaffst du pro Tag?</h2>
        <p class="text-xs text-slate-400 mb-3">Nur deine AP-Regeneration – ohne Flaschen und ohne Passive.</p>
        <div class="space-y-2">
          <label class="flex items-center justify-between gap-3 text-sm text-slate-300"><span>⏱ 1 AP alle … Sekunden</span>
            <span class="inline-flex items-center gap-1"><input data-apsec type="number" min="1" step="any" value="${apDay().sec ?? ''}" placeholder="23" class="${inp}"><span class="text-xs text-slate-500">Sek.</span></span></label>
          <div class="flex items-center justify-between gap-3 text-sm text-slate-300"><span>🎁 Gratis-AP einsammeln <span class="text-xs text-slate-500">(+500 AP pro Tag)</span></span>${toggleBtn('data-apfree', apDay().free !== false)}</div>
          <div class="flex items-center justify-between gap-3 text-sm text-slate-300"><span>🧭 Travel abziehen <span class="text-xs text-slate-500">(−400 AP pro Tag)</span></span>${toggleBtn('data-aparm', !!apDay().arm)}</div>
        </div>
        <div id="apDayOut" class="mt-4"></div>
      </section>`;
    makeFold($('apCanDo'), 'apstats:cando');
    makeFold($('apPassive'), 'apstats:passive');
    renderApChips();
    const pt = $('passTop');
    top.querySelectorAll('[data-apcost]').forEach(i => i.addEventListener('input', () => { const c = (passive.apCost = passive.apCost || {}); if (+i.value > 0) c[i.dataset.apcost] = +i.value; else delete c[i.dataset.apcost]; savePassive(); renderApStatsOut(); }));
    pt.querySelectorAll('[data-aptog]').forEach(b => b.onclick = () => { const s = apSrc(b.dataset.aptog); s.on = !s.on; b.setAttribute('aria-checked', String(s.on)); b.closest('.ap-src').dataset.on = String(s.on); savePassive(); renderApStatsOut(); });
    pt.querySelectorAll('[data-appct]').forEach(b => b.onclick = () => { const s = apSrc(b.dataset.k); s.pct = +b.dataset.appct; pt.querySelectorAll(`[data-appct][data-k="${b.dataset.k}"]`).forEach(x => x.setAttribute('aria-pressed', String(x === b))); savePassive(); renderApStatsOut(); });
    pt.querySelectorAll('[data-apn]').forEach(i => i.addEventListener('input', () => { const s = apSrc(i.dataset.apn); s[i.dataset.apn === 'forts' ? 'w' : 'n'] = i.value === '' ? null : Math.max(0, +i.value); savePassive(); renderApStatsOut(); }));
    // Klappfeld 2: Was schaffst du pro Tag? (nur AP-Regeneration, Armament-Daily abziehbar)
    pt.querySelectorAll('[data-apsec]').forEach(i => i.addEventListener('input', () => { const d = apDay(); d.sec = +i.value > 0 ? +i.value : null; savePassive(); renderApDayOut(); }));
    pt.querySelectorAll('[data-apfree]').forEach(b => b.onclick = () => { const d = apDay(); d.free = d.free === false; b.setAttribute('aria-checked', String(d.free)); savePassive(); renderApDayOut(); });
    pt.querySelectorAll('[data-aparm]').forEach(b => b.onclick = () => { const d = apDay(); d.arm = !d.arm; b.setAttribute('aria-checked', String(d.arm)); savePassive(); renderApDayOut(); });
    makeFold($('apDay'), 'apstats:day');
    renderApDayOut();
    bindHorizonCtl(pt, () => { renderApChips(); renderApStatsOut(); });
    renderApStatsOut();
  }
  const apDay = () => (passive.apDay = passive.apDay || { sec: 23, arm: true });
  function renderApDayOut() {
    const out = $('apDayOut'); if (!out) return;
    const d = apDay(), sec = +d.sec > 0 ? +d.sec : 23, regen = 86400 / sec, free = d.free !== false ? 500 : 0, net = Math.max(0, regen + free - (d.arm ? 400 : 0));
    out.innerHTML = `<div class="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm">
        <div class="flex justify-between gap-3"><span class="text-slate-300">AP-Regeneration pro Tag</span><b class="tabular-nums text-emerald-300">+${fmt(regen)}</b></div>
        ${free ? `<div class="flex justify-between gap-3"><span class="text-slate-300">Gratis-AP</span><b class="tabular-nums text-emerald-300">+500</b></div>` : ''}
        ${d.arm ? `<div class="flex justify-between gap-3"><span class="text-slate-300">Travel</span><b class="tabular-nums text-red-300">−400</b></div>` : ''}
        <div class="flex justify-between gap-3 border-t border-ink-700 mt-1 pt-1"><span class="text-slate-200 font-semibold">Pro Tag verfügbar</span><b class="tabular-nums text-gold-300">${fmt(net)} AP</b></div></div>
      <div class="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">${AP_COSTS.map(c => { const cost = apCost(c.k); return `
        <div class="rounded-xl border border-ink-700 bg-ink-950/50 p-3">
          <div class="text-[10px] uppercase tracking-widest text-slate-400 truncate">${c.icon} ${c.label}</div>
          <div class="text-2xl font-bold text-gold-300 tabular-nums mt-1">${fmt(Math.floor(net / cost))} <span class="text-xs font-medium text-slate-400">/ Tag</span></div>
          <div class="text-[11px] text-slate-500 tabular-nums">à ${fmt(cost)} AP</div></div>`; }).join('')}</div>`;
  }
  // Linien-Dashboard in Passive: AP gesamt, Passiv gesamt und jede aktive Quelle zum Ankreuzen
  let apChart = null;
  const AP_LINE_COL = { total: '#facc15', passive: '#34d399', daily: '#38bdf8', monday: '#a78bfa', afort: '#f97316', forts: '#f472b6', barbs: '#e2e8f0', bundle: '#ef4444' };
  const apLines = () => (passive.apLines = passive.apLines || { total: true, passive: true });
  function renderApChart() {
    const wrap = $('apChartWrap'), selEl = $('apLineSel'); if (!wrap || !selEl) return;
    const H = horizons(), now = apNow(), on = AP_SRC.filter(x => apSrc(x.k).on), L = apLines();
    const opts = [...(now != null ? [{ k: 'total', label: 'AP gesamt' }] : []), { k: 'passive', label: 'Passiv gesamt' }, ...on.map(x => ({ k: x.k, label: x.label }))];
    selEl.innerHTML = opts.map(o => `<label class="inline-flex items-center gap-1.5 cursor-pointer select-none"><input type="checkbox" data-apline="${o.k}" ${L[o.k] ? 'checked' : ''} class="accent-emerald-500">
      <i class="inline-block w-3 h-1 rounded" style="background:${AP_LINE_COL[o.k]}"></i>${o.label}</label>`).join('');
    selEl.querySelectorAll('[data-apline]').forEach(c => c.onchange = () => { apLines()[c.dataset.apline] = c.checked; savePassive(); renderApChart(); });
    const maxD = Math.max(7, Math.ceil(Math.max(...H.map(h => h.days))));
    const step = maxD > 90 ? Math.ceil(maxD / 90) : 1, days = [];
    for (let d = 0; d <= maxD; d += step) days.push(d);
    if (days[days.length - 1] !== maxD) days.push(maxD);
    const labels = days.map(d => new Date(Date.now() + d * 864e5).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }));
    const inc = (x, d) => x.inc ? x.inc(apSrc(x.k), d) : x.perDay(apSrc(x.k)) * d;
    const series = opts.filter(o => L[o.k]).map(o => ({ k: o.k, label: o.label,
      data: days.map(d => Math.round(o.k === 'total' ? now + apIncome(d) : o.k === 'passive' ? apIncome(d) : inc(AP_SRC.find(x => x.k === o.k), d))) }));
    if (apChart) { try { apChart.destroy(); } catch {} apChart = null; }
    if (!series.length) { wrap.innerHTML = '<div class="h-full grid place-items-center text-xs text-slate-500">Mindestens eine Linie ankreuzen.</div>'; return; }
    if (!window.Chart) { wrap.innerHTML = '<div class="h-full grid place-items-center text-xs text-slate-500">Diagramm konnte nicht geladen werden.</div>'; return; }
    wrap.innerHTML = '<canvas id="apProjChart"></canvas>';
    apChart = new Chart($('apProjChart'), {
      type: 'line',
      data: { labels, datasets: series.map(sr => ({ label: sr.label, data: sr.data, borderColor: AP_LINE_COL[sr.k], backgroundColor: AP_LINE_COL[sr.k] + '22',
        borderWidth: sr.k === 'total' ? 3 : 2, borderDash: sr.k === 'passive' ? [6, 4] : undefined, tension: .25, pointRadius: 0, pointHoverRadius: 5, fill: false })) },
      options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${fmt(c.raw)} AP` } } },
        scales: { y: { beginAtZero: !L.total, ticks: { callback: (v) => short(v) } }, x: { ticks: { maxTicksLimit: 8 } } } }
    });
  }
  function renderApChips() {
    const el = $('apChips'); if (!el) return;
    const H = [{ k: 'now', label: 'Jetzt' }, ...horizons()], st = hState();
    if (!H.some(h => h.k === st.sel)) st.sel = 'now';
    el.innerHTML = H.map(h => `<button type="button" data-hsel="${h.k}" aria-pressed="${st.sel === h.k}" class="seg-btn rounded-lg px-3 py-1.5 text-xs font-semibold transition">${h.label}</button>`).join('');
    el.querySelectorAll('[data-hsel]').forEach(b => b.onclick = () => { hState().sel = b.dataset.hsel; savePassive(); renderApChips(); renderApStatsOut(); });
  }
  function renderApStatsOut() {
    const H = horizons(), st = hState(), now = apNow();
    const h = [{ k: 'now', label: 'Jetzt', days: 0 }, ...H].find(x => x.k === st.sel) || { k: 'now', days: 0, label: 'Jetzt' };
    const ap = (now || 0) + apIncome(h.days);
    const out = $('apCanDoOut');
    if (out) out.innerHTML = `
      <div class="flex items-center gap-4 mb-4">
        <div class="w-14 h-14 shrink-0 rounded-2xl grid place-items-center" style="background:linear-gradient(135deg,#34d39933,#10b98111);border:1px solid #34d39955">${ico({ img: AP_IMG }, 'w-10 h-10')}</div>
        <div><div class="text-xs uppercase tracking-widest text-slate-400">${h.k === 'now' ? 'AP jetzt' : `AP ${h.k === 'kvk' ? 'zum KvK-Start' : 'in ' + h.label}`}</div>
          <div class="text-3xl font-extrabold text-white tabular-nums">${fmt(ap)} AP</div>
          <div class="text-xs text-slate-400">${now == null ? 'Noch kein AP-Scan – nur Passive gerechnet' : h.k === 'now' ? 'aus deinem letzten Scan' : `${fmt(now)} jetzt + ${fmt(ap - now)} passiv`}</div></div>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">${AP_COSTS.map(c => { const cost = apCost(c.k), n = Math.floor(ap / cost); return `
        <div class="rounded-xl border border-ink-700 bg-ink-950/50 p-3">
          <div class="text-[10px] uppercase tracking-widest text-slate-400 truncate">${c.icon} ${c.label}</div>
          <div class="text-2xl font-bold text-gold-300 tabular-nums mt-1">${fmt(n)} <span class="text-xs font-medium text-slate-400">${c.unit || '×'}</span></div>
          <div class="text-[11px] text-slate-500 tabular-nums">à ${fmt(cost)} AP</div></div>`; }).join('')}</div>`;
    // Passive-Quellen: pro Tag je Quelle + Hochrechnung
    AP_SRC.forEach(x => { const el = document.querySelector(`[data-apday="${x.k}"]`); if (el) el.textContent = `+${fmt(x.perDay(apSrc(x.k)))} / Tag`; });
    const po = $('apPassiveOut'); if (!po) return;
    const on = AP_SRC.filter(x => apSrc(x.k).on);
    renderApChart();
    if (!on.length) { po.innerHTML = '<div class="text-xs text-slate-500">Aktiviere oben mindestens eine Quelle – dann siehst du hier, wie viel AP in 7 Tagen, 30 Tagen, deinem eigenen Zeitraum und bis zum KvK dazukommen.</div>'; renderAreaTabs(); return; }
    const th = 'py-1.5 px-2 text-right font-medium whitespace-nowrap';
    const inc = (x, d) => x.inc ? x.inc(apSrc(x.k), d) : x.perDay(apSrc(x.k)) * d;
    po.innerHTML = `<div class="overflow-x-auto rounded-lg border border-emerald-500/30 bg-emerald-500/5"><table class="w-full text-xs">
      <thead class="text-[10px] uppercase tracking-wider text-slate-400"><tr class="border-b border-ink-700"><th class="py-1.5 px-2 text-left font-medium">Quelle</th><th class="${th}">pro Tag</th>${H.map(h => `<th class="${th}">${h.label}</th>`).join('')}</tr></thead>
      <tbody>${on.map(x => `<tr class="border-b border-ink-800"><td class="py-1.5 px-2 text-slate-300 whitespace-nowrap">${x.label}</td><td class="py-1.5 px-2 text-right tabular-nums text-emerald-400">+${fmt(x.perDay(apSrc(x.k)))}</td>${H.map(h => `<td class="py-1.5 px-2 text-right tabular-nums text-emerald-400">+${fmt(inc(x, h.days))}</td>`).join('')}</tr>`).join('')}
        <tr class="border-b border-ink-800 font-semibold"><td class="py-1.5 px-2 text-slate-200">Passiv gesamt</td><td class="py-1.5 px-2 text-right tabular-nums text-emerald-300">+${fmt(apPerDay())}</td>${H.map(h => `<td class="py-1.5 px-2 text-right tabular-nums text-emerald-300">+${fmt(apIncome(h.days))}</td>`).join('')}</tr>
        ${now != null ? `<tr class="font-bold"><td class="py-2 px-2 text-gold-300">AP gesamt</td><td class="py-2 px-2 text-right tabular-nums text-slate-400">${fmt(now)}</td>${H.map(h => `<td class="py-2 px-2 text-right tabular-nums text-gold-300">${fmt(now + apIncome(h.days))}</td>`).join('')}</tr>` : ''}
      </tbody></table></div>`;
    renderAreaTabs();
  }

  // ---------- Allgemeine Passive-Hochrechnung (alle anderen Bereiche) ----------
  function renderPassiveOut(m) {
    const out = $('passiveOut'); if (!out) return;
    const fields = passiveFields(m), now = passiveNow(m), H = horizons();
    const rows = fields.map(f => ({ f, d: pPerDay(m, f) })).filter(r => r.d > 0);
    if (!rows.length) { out.innerHTML = '<div class="text-xs text-slate-500">Trag ein, wie viel du regelmäßig bekommst – dann siehst du hier, was in 7 Tagen, 30 Tagen, deinem eigenen Zeitraum und bis zum KvK dazukommt.</div>'; renderAreaTabs(); return; }
    const th = 'py-1.5 px-2 text-right font-medium whitespace-nowrap';
    const cell = (r, days) => { const has = now[r.f.k] != null; return has ? pFmt(m, r.f, (+now[r.f.k] || 0) + r.d * days) : '+' + pFmt(m, r.f, r.d * days); };
    let extra = '';
    if (m === 'passports') {
      const goal = toCount($('passGoal')?.value), have = +now.passports || 0, d = rows[0]?.d || 0;
      if (goal && d > 0) extra = `<div class="mt-2 text-xs ${have >= goal ? 'text-emerald-400' : 'text-slate-300'}">${have >= goal ? 'Ziel schon erreicht ✓' : `🎯 Migrations-Ziel in ca. <b class="text-indigo-300 tabular-nums">${fmt(Math.ceil((goal - have) / d))}</b> Tagen erreicht`}</div>`;
    }
    out.innerHTML = `<div class="overflow-x-auto rounded-lg border border-emerald-500/30 bg-emerald-500/5"><table class="w-full text-xs">
      <thead class="text-[10px] uppercase tracking-wider text-slate-400"><tr class="border-b border-ink-700"><th class="py-1.5 px-2 text-left font-medium"></th><th class="${th}">pro Woche</th>${H.map(h => `<th class="${th}">${h.label}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr class="border-b border-ink-800 last:border-b-0"><td class="py-1.5 px-2 text-slate-300 whitespace-nowrap">${ico(r.f, 'w-4 h-4')} ${r.f.label}</td>
        <td class="py-1.5 px-2 text-right tabular-nums text-emerald-400">+${pFmt(m, r.f, r.d * 7)}</td>${H.map(h => `<td class="py-1.5 px-2 text-right tabular-nums font-semibold text-gold-300">${cell(r, h.days)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
      <div class="mt-1 text-[11px] text-slate-500">Gold = Bestand aus dem letzten Scan + Passive · „+“ = nur Passive (noch kein Scan)</div>${extra}`;
    renderAreaTabs();
  }
  passiveReady = true;

  // ---------- Bereichs-Kacheln: Statistics (links) · Dashboard (Mitte, Start) · Scan (rechts) ----------
  R.areaTab = 'dash';
  function passiveSummary(m) {
    if (!passiveReady) return null;
    if (m === 'ap') { const d = apPerDay(); return d > 0 ? `+${fmt(d)} AP / Tag` : null; }
    const fields = passiveFields(m); if (!fields) return null;
    const rows = fields.map(f => ({ f, d: pPerDay(m, f) })).filter(r => r.d > 0);
    if (!rows.length) return null;
    if (rows.length === 1) return `+${pFmt(m, rows[0].f, rows[0].d * 7)} / Woche`;
    return `${rows.length} Werte · pro Woche`;
  }
  function renderStats(m) {
    const top = $('statsTop'), sec = $('passiveInputs');
    if (m === 'ap') { sec.classList.add('hidden'); if (!top.querySelector('#apCanDo')) renderApStats(); else renderApStatsOut(); return; }
    $('passTop').innerHTML = '';
    top.innerHTML = `<section class="panel rounded-2xl p-6 text-center text-sm text-slate-400">Für diesen Bereich gibt es noch keine Statistik – kommt als Nächstes.</section>`;
    if (passiveFields(m)) renderPassive(m); else sec.classList.add('hidden');
  }
  function renderAreaTabs() {
    const el = $('areaTabs'); if (!el || typeof HUB === 'undefined' || !HUB) return;
    const h = HUB.find(x => x.m === R.mode) || {}, m = R.mode;
    const lastTs = (() => { const t = m === 'mats' ? 'materials' : m; const e = R.history.filter(x => x.type === t).sort((a, b) => b.ts - a.ts)[0]; return e ? e.ts : null; })();
    const upIcon = '<svg class="w-9 h-9 text-gold-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4m0 0l-4 4m4-4l4 4"/><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"/></svg>';
    const statIcon = '<svg class="w-9 h-9 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16"/><path d="M7 16v-5M12 16V7M17 16v-8"/></svg>';
    const tile = (k, icon, c, title, sub, ph, dis) => `<button type="button" class="hub-tile panel !min-h-[7.5rem] sm:!min-h-[9.5rem]" data-atab="${k}" role="tab" aria-pressed="${R.areaTab === k}" ${dis ? 'aria-disabled="true"' : ''}>
        <span class="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl grid place-items-center text-3xl sm:text-4xl" style="background:linear-gradient(135deg,${c}33,${c}11);border:1px solid ${c}55">${icon}</span>
        <span class="font-display text-sm sm:text-lg text-white tracking-wide leading-tight">${title}</span>
        <span class="text-[10px] sm:text-xs tabular-nums ${sub ? 'text-slate-300' : 'text-slate-500'} leading-tight">${sub || ph}</span>
      </button>`;
    const statSub = m === 'ap' && apNow() != null ? `≈ ${fmt(Math.floor(apNow() / apCost('barbOff')))} Barbaren` : null;
    const hasP = m === 'ap' || !!passiveFields(m), pSub = passiveSummary(m);
    const dashSub = [hubValue(m), lastTs ? `Scan: ${dateLabel(lastTs)}` : null].filter(Boolean).join(' · ');
    el.innerHTML = tile('stats', statIcon, '#34d399', 'Statistics', statSub, 'Was kann ich damit machen?')
      + tile('dash', ico(h, 'w-9 h-9 sm:w-12 sm:h-12'), h.c || '#f5c542', h.label || 'Dashboard', dashSub, 'Scan & Dashboard')
      + tile('passive', ico({ img: 'sonstiges/calendar.BYQ908Wv.webp', icon: '📈' }, 'w-9 h-9 sm:w-12 sm:h-12'), '#34d399', 'Passive', pSub, hasP ? 'noch nichts aktiviert' : 'nicht verfügbar', !hasP);
    el.querySelectorAll('[data-atab]').forEach(b => b.onclick = () => { if (b.getAttribute('aria-disabled') === 'true') return; setAreaTab(b.dataset.atab); });
  }
  // Links Statistics · Mitte Scan + Dashboard (wie früher nebeneinander) · rechts Passive
  function setAreaTab(t) {
    if (t === 'scan') t = 'dash';
    if (t === 'passive' && R.mode !== 'ap' && !passiveFields(R.mode)) t = 'dash';
    R.areaTab = t;
    const aside = $('areaAside'), main = $('results'), stats = $('statsArea');
    delete aside.dataset.tab;
    $('areaGrid').className = t === 'dash' ? 'grid lg:grid-cols-[380px_1fr] gap-6' : 'grid gap-6';
    aside.classList.toggle('hidden', t !== 'dash');
    main.classList.toggle('hidden', t !== 'dash');
    stats.classList.toggle('hidden', t === 'dash');
    $('statsTop').classList.toggle('hidden', t !== 'stats');
    $('passArea').classList.toggle('hidden', t !== 'passive');
    if (t !== 'dash' && passiveReady) renderStats(R.mode);
    renderAreaTabs();
    if (t === 'dash' && chart) setTimeout(() => chart?.resize?.(), 0);
  }
  R.setAreaTab = setAreaTab;

  // ---------- Dashboard-Startseite: Kacheln je Bereich ----------
  var HUB = [   // var: applyMode() kann schon vor dieser Zeile laufen
    { m: 'ap', icon: '⚡', img: AP_IMG, label: 'AP', c: '#34d399' },
    { m: 'speedups', icon: '⏱️', img: 'sonstiges/SpeedUniversal.png', label: 'Speedups', c: '#38bdf8' },
    { m: 'vip', icon: '👑', img: 'sonstiges/svip._LSdqpwn.webp', label: 'VIP', c: '#f5c542' },
    { m: 'gems', icon: '💎', img: 'ressourcen/gemsmore.png', label: 'Gems', c: '#f472b6' },
    { m: 'resources', icon: '🌾', img: 'ressourcen/cornmore.png', label: 'Ressourcen', c: '#fb923c' },
    { m: 'mats', icon: '🧱', img: 'mats/choicematchest.png', label: 'Mats', c: '#a78bfa' },
    { m: 'passports', icon: '🛂', img: 'sonstiges/passport.webp', label: 'Passports', c: '#818cf8' },
    ...CNT_TYPES.map(m => ({ m, icon: COUNTERS[m].icon, img: COUNTERS[m].img, label: COUNTERS[m].title, c: COUNTERS[m].c }))
  ];
  const hubLast = (t, ok) => R.history.filter(e => e.type === t && ok(e)).sort((a, b) => b.ts - a.ts)[0];
  function hubValue(m) {
    if (m === 'ap') { const e = hubLast('ap', x => x.total_ap != null); return e ? fmt(e.total_ap) + ' AP' : null; }
    if (m === 'speedups') { const e = hubLast('speedups', x => x.total != null); return e ? fmt(Math.floor(e.total / 1440)) + ' Tage' : null; }
    if (m === 'vip') { const e = hubLast('vip', x => x.after != null || x.current != null); return e ? vipName(levelFor(e.current ?? e.after)) : null; }
    if (m === 'gems') { const e = hubLast('gems', x => x.gems != null); return e ? short(e.gems) : null; }
    if (m === 'resources') { const e = hubLast('resources', x => x.total != null); return e ? short(e.total) : null; }
    if (m === 'mats') { const e = hubLast('materials', x => x.total_leg != null); return e ? fmt(Math.floor(e.total_leg)) + ' Legendär' : null; }
    if (m === 'passports') { const e = hubLast('passports', x => x.passports != null); return e ? fmt(e.passports) : null; }
    if (m === 'keys') { const e = hubLast('keys', () => true); return e ? `${fmt(e.key_gold || 0)} Gold · ${fmt(e.key_silver || 0)} Silber` : null; }
    if (COUNTERS[m]) { const e = hubLast(m, () => true); return e ? fmt(cntTotal(m, e)) + ' ' + COUNTERS[m].unit : null; }
    return null;
  }
  function renderHub() {
    const grid = $('hubGrid'); if (!grid || !HUB) return;
    grid.innerHTML = HUB.map(h => {
      const v = hubValue(h.m);
      return `<button type="button" class="hub-tile panel" data-hub="${h.m}" aria-label="${h.label} öffnen">
        <span class="w-16 h-16 rounded-2xl grid place-items-center text-4xl" style="background:linear-gradient(135deg,${h.c}33,${h.c}11);border:1px solid ${h.c}55">${ico(h, 'w-12 h-12')}</span>
        <span class="font-display text-base sm:text-lg text-white tracking-wide">${h.label}</span>
        <span class="text-xs tabular-nums ${v ? 'text-slate-300' : 'text-slate-500'}">${v || 'noch kein Scan'}</span>
      </button>`;
    }).join('');
    grid.querySelectorAll('[data-hub]').forEach(b => b.onclick = () => {
      R.mode = b.dataset.hub; LS.set(MODE_KEY, R.mode); hideError();
      showHub(false); setAreaTab('dash'); applyMode(); window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  // true = Kachel-Startseite, false = gewählter Bereich (Upload, Ergebnis, Verlauf)
  R.scanHub = true;
  function showHub(on) {
    R.scanHub = !!on;
    $('scanHub').classList.toggle('hidden', !R.scanHub);
    $('scanArea').classList.toggle('hidden', R.scanHub);
    $('scanBack').textContent = R.scanHub ? '← Zurück' : '← Alle Bereiche';
    if (R.scanHub) renderHub(); else if (chart) setTimeout(() => chart?.resize?.(), 0);
  }
  R.showHub = showHub;

  // Browser bitten, den lokalen Zwischenspeicher nicht automatisch aufzuräumen
  try { navigator.storage?.persist?.(); } catch {}

  // ---------- Haupt-Reiter: Scanner & Dashboard | Rangliste ----------
  R.view = 'feed';   // Startseite = Feed; Scanner & Dashboard über das Profil-Menü
  let lastMainView = 'feed';
  // Seiten: view → Element · Module ergänzen R.VIEW_EL / R.MAIN_VIEWS / R.viewHooks (Funktion beim Öffnen)
  R.VIEW_EL = { scanner: 'scannerView', rank: 'rankView', profile: 'profileView', craft: 'craftView', kvk: 'kvkView', feed: 'feedView', kingdom: 'kingdomView', help: 'helpView', showcases: 'showcasesView' };
  R.MAIN_VIEWS = ['kingdom', 'feed', 'rank', 'craft', 'help'];   // mit Haupt-Reitern oben
  R.viewHooks = {};
  // Verlauf der Seiten für die Zurück-Buttons (Startseite = Rangliste)
  let shownView = null; R.navStack = []; R.navBack = false;
  let craftAllowed = false;   // Spoilerschutz: Craft nur für freigeschaltete Accounts
  function applyView() {
    if (R.view === 'craft' && !craftAllowed) R.view = 'rank';
    if (R.view !== shownView) { if (shownView && !R.navBack) R.navStack.push(shownView); shownView = R.view; }
    R.navBack = false;
    if (!R.VIEW_EL[R.view] || !$(R.VIEW_EL[R.view])) R.view = 'feed';
    $('scanBackBar').classList.toggle('hidden', R.view !== 'scanner');
    document.querySelectorAll('.main-tab').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === R.view));
    Object.entries(R.VIEW_EL).forEach(([v, id]) => { const el = $(id); if (el) el.classList.toggle('hidden', R.view !== v); });
    $('mainNav').classList.toggle('hidden', !R.MAIN_VIEWS.includes(R.view));      // Haupt-Reiter nur auf den Startseiten
    if (R.view !== 'profile') { lastMainView = R.view; try { localStorage.setItem('rok_view', R.view); } catch {} }
    if (R.view === 'rank') loadRanking();
    if (R.view === 'profile') R.loadGameProfile(); else R.closeProfEdit?.();
    if (R.view === 'craft') R.renderGear();
    if (R.viewHooks[R.view]) { try { R.viewHooks[R.view](); } catch (e) { console.warn('Seite', R.view, e); } }
    document.dispatchEvent(new CustomEvent('rok:view', { detail: R.view }));
  }
  R.goView = (v) => { R.view = v; applyView(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  document.querySelectorAll('.main-tab').forEach(b => b.onclick = () => { R.view = b.dataset.view; applyView(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  $('rankRefresh').onclick = () => loadRanking();

  // VIP-Stufen der Rangliste (kumulierte Punkte, Index = Stufe)
  const LB_VIP = VIP_TABLE;   // dieselbe Tabelle wie im VIP-Rechner
  const LB_MAX = LB_VIP.length - 1;   // VIP 18
  function lbLevel(p) { let l = 0; for (let i = 1; i <= LB_MAX; i++) if (p >= LB_VIP[i]) l = i; return l; }
  function lbNext(p) {
    const lvl = lbLevel(p);
    if (lvl >= LB_MAX) return { max: true, lvl };
    const from = LB_VIP[lvl], to = LB_VIP[lvl + 1];
    return { max: false, lvl, next: lvl + 1, need: to - p, pct: Math.max(0, Math.min(100, (p - from) / (to - from) * 100)) };
  }
  function nextCell(p) {
    const n = lbNext(p);
    if (n.max) return `<span class="font-semibold text-gold-300 whitespace-nowrap">Max Level erreicht 👑</span>
      <div class="mt-1.5 h-1.5 rounded-full bg-gradient-to-r from-gold-400 to-gold-600"></div>`;
    return `<div class="text-xs text-slate-300 whitespace-nowrap">Noch <b class="text-white tabular-nums">${fmt(n.need)}</b> bis ${vipName(n.next)}</div>
      <div class="mt-1.5 flex items-center gap-2">
        <div class="flex-1 h-1.5 rounded-full bg-ink-950 border border-ink-700 overflow-hidden" title="${n.pct.toFixed(1).replace('.', ',')} % von ${vipName(n.lvl)} bis ${vipName(n.next)}">
          <div class="h-full rounded-full bg-gradient-to-r from-sky-400 to-gold-400" style="width:${n.pct}%"></div>
        </div>
        <span class="text-[10px] text-slate-500 tabular-nums w-8 text-right">${Math.floor(n.pct)} %</span>
      </div>`;
  }

  const MEDALS = {
    1: { icon: '👑', badge: 'bg-gradient-to-br from-yellow-300 to-amber-500 text-ink-950 shadow-[0_0_18px_rgba(245,197,66,.55)]', name: 'text-gold-300' },
    2: { icon: '🥈', badge: 'bg-gradient-to-br from-slate-100 to-slate-400 text-ink-950', name: 'text-slate-100' },
    3: { icon: '🥉', badge: 'bg-gradient-to-br from-amber-500 to-orange-800 text-white', name: 'text-amber-300' }
  };
  let rankLoading = false;
  // Statthalter-Ranglisten: Spalte, Beschriftung, Symbol
  const RANK_STAT = {
    kills: { col: 'kill_points',   label: 'Kill-Punkte', icon: '⚔️', sub: 'Kill-Punkten' },
    merit: { col: 'highest_merit', label: 'Verdienst',   icon: '🏅', sub: 'höchstem Verdienst' }
  };
  let rankSort = 'kills';   // beim Öffnen der Seite immer Kill-Punkte (Umschalten gilt nur bis zum Neuladen)
  let rankRows = [];
  document.querySelectorAll('.rank-tab').forEach(b => b.onclick = () => {
    rankSort = b.dataset.sort;
    renderRanking(rankRows);
  });
  // Zuwachs seit dem letzten Scan (grün +, rot −, grau ±0)
  function gainParts(r, col) {
    const g = r?._g?.[col]; if (!g || g.d == null || !isFinite(+g.d)) return null;
    const d = Math.round(+g.d);
    return { d, txt: (d > 0 ? '+' : d < 0 ? '−' : '±') + fmt(Math.abs(d)), cls: d > 0 ? 'text-emerald-400' : d < 0 ? 'text-red-300' : 'text-slate-500' };
  }
  const gainHtml = (r, col) => { const g = gainParts(r, col); return g ? `<div class="text-[11px] font-semibold tabular-nums ${g.cls}" title="Zuwachs seit dem letzten Scan">${g.txt}</div>` : ''; };
  const gainLine = (r, col) => { const g = gainParts(r, col); return g ? `<div class="text-xs tabular-nums"><span class="font-semibold ${g.cls}">${g.txt}</span> <span class="text-slate-500">seit dem letzten Scan</span></div>` : ''; };
  // neuester eigener Statthalter-Wert je Feld (auch aus älteren Scans, falls der neueste ihn nicht enthält)
  function govLatest(k, list) {
    const l = (list || R.history).filter(e => e.type === 'governor' && e[k] != null).sort((a, b) => b.ts - a.ts);
    return l.length ? +l[0][k] : null;
  }
  async function loadRanking() {
    if (rankLoading) return;
    rankLoading = true;
    $('rankState').classList.remove('hidden'); $('rankState').textContent = 'Lade Rangliste …';
    try {
      const rows = (await RokAuth.loadLeaderboard())
        .map(r => { const o = { ...r, vip_points: +r.vip_points || 0, _g: r._g || {} }; ['kill_points', 'highest_merit', 'energy', 'deads', 'ark_wins', 'lk_autarch', 'units_killed', 'units_lost', 'units_healed'].forEach(k => { o[k] = r[k] == null ? null : +r[k]; }); return o; });
      const me = rows.find(r => r.user_id === RokAuth.userId());
      if (me) { ['kill_points', 'highest_merit'].forEach(k => { if (me[k] == null) { const g = govLatest(k); if (g != null) me[k] = g; } }); me._g = { ...me._g, ...RokAuth.ownGains() }; }
      rankRows = rows;
      renderRanking(rows);
    } catch (e) {
      $('rankTable').classList.add('hidden'); $('rankMe').classList.add('hidden');
      $('rankState').textContent = 'Rangliste konnte nicht geladen werden: ' + (e.message || e);
    } finally { rankLoading = false; }
  }
  function renderRanking(all) {
    const me = RokAuth.userId(), stat = RANK_STAT[rankSort] || null, kills = !!stat;
    document.querySelectorAll('.rank-tab').forEach(b => b.setAttribute('aria-pressed', b.dataset.sort === rankSort));
    const byName = (a, b) => String(a.username).localeCompare(b.username);
    const rows = [...all].sort(kills
      ? (a, b) => ((b[stat.col] ?? -1) - (a[stat.col] ?? -1)) || byName(a, b)       // ohne Wert ans Ende
      : (a, b) => (b.vip_points - a.vip_points) || (new Date(a.updated_at) - new Date(b.updated_at)) || byName(a, b));
    const th = (t, cls = 'text-left') => `<th class="py-2 px-3 ${cls} font-medium whitespace-nowrap">${t}</th>`;
    const ex = kills ? stat.extra : null;
    $('rankHead').innerHTML = '<tr>' + th('Platz', 'text-left w-20') + th('Spieler') + (kills
      ? th(`${stat.icon} ${stat.label}`, 'text-right') + (ex ? th(`${ex.icon} ${ex.label}`, 'text-right') : '') + th('Zuletzt aktualisiert', 'text-right')
      : th('VIP-Punkte', 'text-right') + th('VIP-Stufe', 'text-center')
        + th('Bis zum nächsten VIP', 'text-left min-w-[190px]') + th('Zuletzt aktualisiert', 'text-right')) + '</tr>';
    $('rankStamp').textContent = `Stand: ${dateLabel(Date.now())} · ${rows.length} Spieler`;
    if (!rows.length) {
      $('rankTable').classList.add('hidden'); $('rankMe').classList.add('hidden');
      $('rankState').textContent = 'Noch niemand in der Rangliste. Scanne dein VIP oder trag deine aktuellen VIP-Punkte im VIP-Bereich ein.';
      return;
    }
    $('rankState').classList.add('hidden'); $('rankTable').classList.remove('hidden');
    $('rankRows').innerHTML = rows.map((r, i) => {
      const noKp = kills && r[stat.col] == null;
      const place = i + 1, m = noKp ? null : MEDALS[place], isMe = r.user_id === me;
      const rowCls = isMe ? 'bg-gold-500/15 outline outline-2 outline-gold-500/70' : (m ? 'bg-ink-850' : 'bg-ink-900/60');
      return `<tr class="${rowCls}">
        <td class="py-3 px-3 rounded-l-xl">
          ${m ? `<span class="inline-flex items-center gap-1.5"><span class="w-9 h-9 rounded-full grid place-items-center text-lg ${m.badge}">${m.icon}</span><span class="font-bold ${m.name}">${place}</span></span>`
              : `<span class="inline-grid place-items-center w-9 h-9 rounded-full bg-ink-800 text-slate-300 font-semibold">${noKp ? '–' : place}</span>`}
        </td>
        <td class="py-3 px-3">
          <button data-profile="${esc(r.user_id)}" class="group inline-flex items-center gap-3 text-left" title="Game Profil öffnen">
            ${R.avatarHtml(r.username, r.avatar, 'w-10 h-10 text-base')}
            <span class="font-semibold group-hover:text-gold-300 group-hover:underline underline-offset-4 ${m ? m.name : 'text-white'}" translate="no">${esc(r.username)}</span>
            ${r.alliance_tag ? `<span class="px-2 py-0.5 rounded-md bg-ink-950 border border-gold-500/30 text-gold-300 font-semibold text-xs">[${esc(r.alliance_tag)}]</span>` : ''}
          </button>
        </td>
        ${kills ? `<td class="py-3 px-3 text-right font-bold tabular-nums ${noKp ? 'text-slate-500' : m ? m.name : 'text-white'}">${noKp ? 'noch kein Scan' : fmt(r[stat.col]) + gainHtml(r, stat.col)}</td>`
          + (ex ? `<td class="py-3 px-3 text-right font-semibold tabular-nums ${r[ex.col] == null ? 'text-slate-500' : 'text-slate-200'}">${r[ex.col] == null ? '–' : fmt(r[ex.col]) + gainHtml(r, ex.col)}</td>` : '') : `
        <td class="py-3 px-3 text-right font-bold tabular-nums ${m ? m.name : 'text-white'}" title="${fmt(r.vip_points)}">${fmt(r.vip_points)}${gainHtml(r, 'vip_points')}</td>
        <td class="py-3 px-3 text-center"><span class="inline-block px-2.5 py-1 rounded-lg bg-ink-950 border border-gold-500/30 text-gold-300 font-semibold text-xs">${vipName(lbLevel(r.vip_points))}</span></td>
        <td class="py-3 px-3">${nextCell(r.vip_points)}</td>`}
        <td class="py-3 px-3 text-right text-slate-400 whitespace-nowrap rounded-r-xl">${r.updated_at ? dateLabel(new Date(r.updated_at).getTime()) : '–'}</td>
      </tr>`;
    }).join('');
    $('rankRows').querySelectorAll('[data-profile]').forEach(b => b.onclick = () => R.openProfile(b.dataset.profile));
    // Eigene Platzierung
    const idx = rows.findIndex(r => r.user_id === me), box = $('rankMe');
    if (kills) {
      const ranked = rows.filter(r => r[stat.col] != null), k = ranked.findIndex(r => r.user_id === me);
      if (k < 0) box.innerHTML = `<div class="text-sm text-slate-300">Für dich ist noch kein ${stat.label}-Wert gespeichert. Öffne dein <b>Game Profil</b> und tippe auf <b>„📷 Statthalter-Profil scannen“</b>.</div>`;
      else {
        const meRow = ranked[k], above = ranked[k - 1];
        box.innerHTML = `<div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl grid place-items-center text-2xl font-extrabold ${MEDALS[k + 1]?.badge || 'bg-ink-800 text-gold-300'}">${MEDALS[k + 1]?.icon || '#' + (k + 1)}</div>
            <div>
              <div class="text-xs uppercase tracking-widest text-slate-400">Dein Platz · ${stat.label}</div>
              <div class="text-2xl font-extrabold text-white">#${k + 1} <span class="text-sm font-medium text-slate-400">von ${ranked.length}</span></div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-lg font-bold text-gold-300 tabular-nums">${stat.icon} ${fmt(meRow[stat.col])} ${stat.label}</div>
            ${gainLine(meRow, stat.col)}${ex && meRow[ex.col] != null ? `<div class="text-xs text-slate-300 tabular-nums">${ex.icon} ${fmt(meRow[ex.col])} ${ex.label}</div>` : ''}
            <div class="text-xs text-slate-400">${above ? `Noch ${fmt(above[stat.col] - meRow[stat.col] + 1)} ${stat.label} bis Platz ${k} (${esc(above.username)})` : `Du führst die ${stat.label}-Rangliste an! ${stat.icon}`}</div>
          </div>
        </div>`;
      }
    } else if (idx < 0) {
      box.innerHTML = `<div class="text-sm text-slate-300">Du bist noch nicht in der Rangliste. Scanne dein VIP oder trag unter <b>Scanner &amp; Dashboard → VIP</b> deine aktuellen VIP-Punkte ein.</div>`;
    } else {
      const meRow = rows[idx], above = rows[idx - 1];
      const gap = above ? above.vip_points - meRow.vip_points : 0;
      box.innerHTML = `<div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl grid place-items-center text-2xl font-extrabold ${MEDALS[idx + 1]?.badge || 'bg-ink-800 text-gold-300'}">${MEDALS[idx + 1]?.icon || '#' + (idx + 1)}</div>
          <div>
            <div class="text-xs uppercase tracking-widest text-slate-400">Dein Platz</div>
            <div class="text-2xl font-extrabold text-white">#${idx + 1} <span class="text-sm font-medium text-slate-400">von ${rows.length}</span></div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-lg font-bold text-gold-300 tabular-nums">${fmt(meRow.vip_points)} Punkte · ${vipName(lbLevel(meRow.vip_points))}</div>
          ${gainLine(meRow, 'vip_points')}
          <div class="text-xs text-slate-400">${above ? `Noch ${fmt(gap + 1)} Punkte bis Platz ${idx} (${esc(above.username)})` : 'Du führst die Rangliste an! 👑'}</div>
        </div>
      </div>`;
    }
    if (kills && RokAuth.missingCols().includes(stat.col))
      box.insertAdjacentHTML('beforeend', `<div class="mt-3 text-xs text-amber-300">⚠ In Supabase fehlt die Spalte <code>${stat.col}</code> – Werte werden vorerst aus den Scans gelesen und nicht dauerhaft in der Rangliste gespeichert.</div>`);
    box.classList.remove('hidden');
  }


  // ---------- Gemeinsame Helfer für die Bereiche (Feed, My Kingdom, Help Me, Showcases) ----------
  const userCache = new Map();                      // user_id → { username, avatar, alliance_tag, kingdom, governor_id }
  R.users = async (ids) => {                        // Profile mehrerer Spieler (aus der Rangliste), mit Zwischenspeicher
    const need = [...new Set((ids || []).filter(Boolean))].filter((id) => !userCache.has(id));
    if (need.length) { try { (await RokAuth.kvkUsers(need)).forEach((u) => userCache.set(u.user_id, u)); } catch (e) { console.warn('users', e); } need.forEach((id) => { if (!userCache.has(id)) userCache.set(id, { user_id: id, username: '?' }); }); }
    const me = RokAuth.userId(), meta = RokAuth.ownMeta() || {};
    const out = {}; (ids || []).forEach((id) => { out[id] = id === me ? { user_id: id, username: PROFILE.name, avatar: meta.avatar, alliance_tag: meta.alliance_tag, kingdom: meta.kingdom, governor_id: meta.governor_id } : userCache.get(id) || { user_id: id, username: '?' }; });
    return out;
  };
  R.userCacheClear = () => userCache.clear();
  R.timeAgo = (ts) => { const d = (Date.now() - new Date(ts).getTime()) / 1000;
    if (d < 60) return 'gerade eben'; if (d < 3600) return `vor ${Math.floor(d / 60)} Min.`; if (d < 86400) return `vor ${Math.floor(d / 3600)} Std.`;
    if (d < 7 * 86400) return `vor ${Math.floor(d / 86400)} Tag${Math.floor(d / 86400) === 1 ? '' : 'en'}`; return dateLabel(new Date(ts).getTime()); };
  R.tableMissing = (e) => /relation|does not exist|schema cache|Could not find the table/i.test(String(e?.message || e || ''));
  R.userLine = (u, cls = 'w-8 h-8 text-sm') => `${R.avatarHtml(u.username, u.avatar, cls)}<span class="min-w-0"><span class="font-semibold text-slate-100 truncate block" translate="no">${esc(u.username || '?')}${u.alliance_tag ? ` <span class="font-normal text-slate-400">[${esc(u.alliance_tag)}]</span>` : ''}</span>${u.kingdom ? `<span class="text-[11px] text-slate-500">🏰 #${esc(u.kingdom)}</span>` : ''}</span>`;
  R.setBadge = (sel, n) => { document.querySelectorAll(sel).forEach((b) => { b.textContent = n > 9 ? '9+' : String(n); b.style.display = n > 0 ? '' : 'none'; }); };

  // ---------- Module laden (Reihenfolge wichtig) ----------
  window.RokMods.profil(R);
  window.RokMods.showcase(R);
  window.RokMods.crafting(R);
  // Neue Bereiche (je eine Datei) – fehlt eine Datei, läuft der Rest trotzdem
  ['feed', 'showcases', 'kingdom', 'helpme'].forEach((m) => { if (window.RokMods[m]) { try { window.RokMods[m](R); } catch (e) { console.error('Modul ' + m, e); } } });

  // Init
  R.renderHeaderAvatar();
  $('mainNav').classList.replace('hidden', 'grid');
  RokAuth.hasFeature('craft').then(ok => {
    craftAllowed = ok;
    $('craftTab').classList.toggle('hidden', !ok);
    $('mainNav').classList.toggle('grid-cols-4', ok); $('mainNav').classList.toggle('grid-cols-3', !ok);
  });
  syncTabs();
  renderHistory();
  $('vipInputs').classList.toggle('hidden', R.mode === 'resources');
  updateAnalyzeBtn();

  // Letzten Scan je Seite wiederherstellen (nur Zahlen, keine Bilder)
  const readLast = (type) => {
    try {
      const v = JSON.parse(LS.get(LAST + '_' + type, 'null'));
      if (v) return v;
      const old = JSON.parse(LS.get(LAST, 'null'));   // ältere Version: ein gemeinsamer Eintrag
      return old?.type === type ? old : null;
    } catch { return null; }
  };
  const lastRes = readLast('resources');
  if (lastRes) {
    renderResources({ resources: lastRes.resources, confidence: lastRes.confidence, notes: lastRes.notes });
    $('resSource').textContent = `Letzter Scan: ${dateLabel(lastRes.ts)}` + (lastRes.confidence ? ` · Sicherheit: ${lastRes.confidence}` : '');
  }
  const lastVip = readLast('vip');
  if (lastVip) {
    vipScanLoaded = true;
    vipItems = (lastVip.items || []).map(i => ({ name: String(i.name || ''), points: +i.points || 0, qty: +i.qty || 0 }));
    if (vipInputNum() == null && lastVip.current != null) setVipInput(lastVip.current);
    vipCurrent = vipInputNum() ?? (lastVip.current ?? null);
    activeVipEntryId = lastVip.entryId || null;
    renderVip();
  }
  const lastSpeed = readLast('speedups');
  if (lastSpeed?.total != null) renderSpeedups(lastSpeed, lastSpeed.ts);
  else { renderSpeedInputs(); renderEvent(); }
  renderSpeedOpts();
  const lastMats = readLast('materials');
  if (lastMats) { renderMats(lastMats, lastMats.ts); fillMatFields(lastMats); }
  const lastAp = readLast('ap');
  if (lastAp && (lastAp.total_ap != null || lastAp.ap != null)) { const c = { ...lastAp, total_ap: lastAp.total_ap ?? +lastAp.ap }; renderAp(c, lastAp.ts); fillApFields(c); }
  else updateApSum();
  const lastPass = readLast('passports');
  if (lastPass?.passports != null) { renderPass({ passports: +lastPass.passports, required: lastPass.required ?? null }, lastPass.ts); $('passIn').value = lastPass.passports; }
  const lastGems = readLast('gems');
  if (lastGems?.gems != null) renderGems({ gems: +lastGems.gems, gemsHand: lastGems.gemsHand ?? null, gemsBag: lastGems.gemsBag ?? null }, lastGems.ts);
  renderFarms();
  ['resTotals', 'speedInputs', 'apInputs', 'passInputs', 'matsInputs', 'vipInputs'].forEach(id => makeFold($(id), id));
  applyMode();
  showHub(true);
  { const g = R.history.filter(e => e.type === 'governor').sort((a, b) => b.ts - a.ts)[0];
    if (g) RokAuth.pushGov(g); }
  applyView();
};
