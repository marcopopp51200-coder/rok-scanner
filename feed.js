// Wiz fan Club – Feed (Startseite)
// Beiträge aller Spieler: Text, Foto vom Gerät, Showcase, Set, KvK-Bilanz, AoO, Gear-Upgrade (Teil, ganzes Set, Armament),
// Pass-Start, Bestand (Rss / Speedups / AP – auch einzeln), VIP-Stufe, KvK-Karte, Help-Me-Anfrage und
// Kill-Punkte & Verdienst je Pass/Altar – mit Reaktionen und Kommentaren.
// Läuft innerhalb von RokApp (scanner.js); R = geteilter Kontext (window.Rok).
// Supabase: public.feed_posts (id, user_id, kind, body, image, data, created_at)
//           public.feed_reactions (post_id, user_id, emoji, created_at) – ein Eintrag je Spieler und Beitrag
//           public.feed_comments (id, post_id, user_id, body, image, mentions, edited_at, created_at) – image = GIF (keine Fotos)
//           public.notifications (id, user_id, from_user, kind, post_id, comment_id, body, read, created_at) – @-Erwähnungen
//           public.feed_votes (post_id, user_id, opt, created_at) – Umfragen: eine Stimme je Spieler und Umfrage
// feed_posts.mentions / edited_at: [{ id, name, t }] = markierte Spieler (t = Text nach dem @), Zeitpunkt der letzten Bearbeitung
// kind ist freier Text – neue Arten brauchen kein SQL.
window.RokMods = window.RokMods || {};
window.RokMods.feed = (R) => {
  const $ = R.$, esc = R.esc, A = window.RokAuth;
  const REACTS = [['👍', 'Daumen hoch'], ['👎', 'Daumen runter'], ['🔥', 'Feuer'], ['❤️', 'Herz'], ['😂', 'Lachen'], ['😮', 'Wow'], ['⚔️', 'Kampf'], ['💎', 'Kristall']];
  const KIND = {
    text: ['💬', 'Beitrag'], photo: ['📷', 'Foto / GIF'], showcase: ['🎨', 'Showcase'], kvk: ['🏁', 'KvK-Bilanz'], aoo: ['🏛️', 'AoO-Showcase'],
    craft: ['⚒️', 'Gear-Upgrade'], pass: ['🚪', 'Pass-Start'], stock: ['🌽', 'Rss'], kvkpts: ['⚔️', 'Kill-Punkte & Verdienst'],
    vip: ['👑', 'VIP-Stufe'], kvkmap: ['🗺️', 'KvK-Karte'], help: ['🆘', 'Help Me'], poll: ['📊', 'Umfrage'], set: ['⚔️', 'Set']
  };
  // Filter: Art des Beitrags (Name-Suche kommt zusätzlich)
  const FILTERS = [['all', 'Alle', null], ['mine', '⭐ Meine', null], ['photo', '📷 Fotos', ['photo']], ['showcase', '🎨 Showcases', ['showcase', 'aoo']], ['set', '⚔️ Sets', ['set']],
    ['craft', '⚒️ Gear', ['craft']], ['help', '🆘 Help Me', ['help']], ['pass', '🚪 Pass-Start', ['pass']], ['kvkpts', '⚔️ KP & Verdienst', ['kvkpts']],
    ['kvk', '🏁 KvK-Bilanz & Karte', ['kvk', 'kvkmap']], ['stock', '🌽 Rss', ['stock']], ['vip', '👑 VIP', ['vip']], ['poll', '📊 Umfragen', ['poll']], ['text', '💬 Text', ['text']]];
  const LIMIT = 40, POLL_MS = 20000;
  const st = { posts: [], pending: [], reacts: {}, users: {}, loaded: false, loading: false, polling: false, err: '', noTable: false,
    attach: null, busy: false, admin: false, text: '', filter: 'all', q: '', hasMore: false, moreBusy: false, gq: '', lastSync: 0,
    comments: {}, cmOpen: new Set(), cmDraft: {}, cmBusy: false, noCm: false, deferRender: false,
    cmGif: {}, cmMsg: {}, gifFor: null, edit: null, editBusy: false, notifs: [], nOpen: false, noNotif: false, flash: null,
    gset: 'all', gmode: 'gear', gsetOpen: false, fOpen: false, pollChange: new Set(), pollDur: 24, votes: {}, noVotes: false, pollAnim: new Set(), pollSeen: new Set(), reactBump: null };
  const db = () => A.db();
  const me = () => A.userId();
  const root = $('feedView');
  if (!root) return;

  // ======================================================================
  // Effekte (CSS-Keyframes + kleine JS-Helfer) – alles dezent, Partikel werden nach der Animation entfernt
  // ======================================================================
  const REDUCE = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  (function injectFx() {
    if (document.getElementById('feedFxCss')) return;
    const css = document.createElement('style'); css.id = 'feedFxCss';
    css.textContent = `
      .fx-layer{position:absolute;inset:0;overflow:hidden;pointer-events:none;border-radius:inherit;z-index:0}
      .fx-body{position:relative;z-index:1}
      .fx-vip .fx-layer::before{content:"";position:absolute;top:-50%;bottom:-50%;left:-40%;width:45%;background:linear-gradient(100deg,rgba(255,236,170,0) 0%,rgba(255,236,170,.10) 35%,rgba(255,246,210,.38) 50%,rgba(255,236,170,.10) 65%,rgba(255,236,170,0) 100%);transform:translateX(-120%) skewX(-12deg);animation:fxSweep 6s ease-in-out infinite}
      @keyframes fxSweep{0%,12%{transform:translateX(-120%) skewX(-12deg)}55%,100%{transform:translateX(420%) skewX(-12deg)}}
      .fx-gold{position:absolute;bottom:-8px;width:var(--sz,4px);height:var(--sz,4px);border-radius:50%;background:radial-gradient(circle,#fffbe6 0,#f5c542 45%,rgba(245,197,66,0) 72%);box-shadow:0 0 6px rgba(245,197,66,.65);opacity:0;animation:fxFloat var(--t,7s) linear infinite;animation-delay:var(--d,0s)}
      .fx-gold.fx-flake{border-radius:1px;width:3px;height:6px;background:linear-gradient(180deg,#fff3c4,#e0a91b)}
      @keyframes fxFloat{0%{transform:translate(0,0) rotate(0);opacity:0}12%{opacity:.85}80%{opacity:.5}100%{transform:translate(var(--dx,10px),-170px) rotate(220deg);opacity:0}}
      .fx-pass .fx-layer::after{content:"";position:absolute;left:0;right:0;bottom:0;height:45%;background:radial-gradient(80% 100% at 50% 100%,rgba(255,110,20,.22),rgba(255,110,20,0) 70%);animation:fxGlow 3.2s ease-in-out infinite}
      @keyframes fxGlow{0%,100%{opacity:.55}50%{opacity:1}}
      .fx-ember{position:absolute;bottom:-6px;width:var(--sz,3px);height:var(--sz,3px);border-radius:50%;background:radial-gradient(circle,#fff1c2 0,#ffb020 40%,#ff5a00 75%,rgba(255,60,0,0) 100%);box-shadow:0 0 6px 1px rgba(255,110,20,.7);opacity:0;animation:fxEmber var(--t,3.6s) ease-in infinite;animation-delay:var(--d,0s)}
      @keyframes fxEmber{0%{transform:translate(0,0) scale(1);opacity:0}10%{opacity:1}60%{opacity:.8}100%{transform:translate(var(--dx,6px),-110px) scale(.25);opacity:0}}
      .fx-forge{position:relative;animation:fxForge 2.6s ease-in-out infinite}
      @keyframes fxForge{0%,100%{box-shadow:0 0 0 1px rgba(255,140,40,.30),0 0 14px -2px rgba(255,100,20,.25)}50%{box-shadow:0 0 0 1px rgba(255,170,60,.65),0 0 24px 0 rgba(255,110,20,.45)}}
      .fx-spark{position:absolute;width:var(--sz,3px);height:var(--sz,3px);border-radius:50%;background:#ffe2a0;box-shadow:0 0 6px 1px #ff7a18,0 0 2px #fff;pointer-events:none;z-index:5;animation:fxSpark var(--t,.9s) cubic-bezier(.15,.7,.3,1) forwards}
      .fx-spark.fx-streak2{width:9px;height:2px;border-radius:2px;background:linear-gradient(90deg,rgba(255,200,90,0),#ffd27a,#fff);transform-origin:0 50%}
      @keyframes fxSpark{0%{transform:translate(0,0) rotate(var(--a,0deg)) scale(1);opacity:1}100%{transform:translate(var(--tx),var(--ty)) rotate(var(--a,0deg)) scale(.2);opacity:0}}
      .fx-rocket{position:absolute;width:2px;height:10px;border-radius:2px;background:linear-gradient(180deg,#fff,#ffd27a 40%,rgba(255,120,30,0));box-shadow:0 0 6px #ffb020;pointer-events:none;z-index:6;animation:fxRocket var(--t,.55s) cubic-bezier(.3,.6,.4,1) forwards}
      @keyframes fxRocket{0%{transform:translate(0,0);opacity:1}100%{transform:translate(var(--tx,0px),var(--ty,-60px));opacity:.9}}
      .fx-fw{position:absolute;width:var(--sz,3px);height:var(--sz,3px);border-radius:50%;background:var(--c,#ffd27a);box-shadow:0 0 6px 1px var(--c,#ffd27a);pointer-events:none;z-index:6;animation:fxFw var(--t,1s) cubic-bezier(.12,.75,.3,1) forwards}
      @keyframes fxFw{0%{transform:translate(0,0) scale(1.2);opacity:1}70%{opacity:.9}100%{transform:translate(var(--tx),calc(var(--ty) + 14px)) scale(.2);opacity:0}}
      .fx-skull{position:absolute;top:-20px;font-size:var(--fs,13px);line-height:1;opacity:0;filter:drop-shadow(0 0 4px rgba(239,68,68,.55));animation:fxSkull var(--t,6s) linear infinite;animation-delay:var(--d,0s)}
      @keyframes fxSkull{0%{transform:translate(0,0) rotate(0);opacity:0}10%{opacity:.6}85%{opacity:.45}100%{transform:translate(var(--dx,0px),230px) rotate(var(--r,160deg));opacity:0}}
      .fx-res{position:absolute;top:-40px;font-size:var(--fs,14px);line-height:1;opacity:0;animation:fxRain var(--t,8s) linear infinite;animation-delay:var(--d,0s)}
      @keyframes fxRain{
        0%{top:-40px;transform:rotate(0deg);opacity:0;animation-timing-function:cubic-bezier(.5,0,1,1)}
        4%{opacity:.95}
        22%{top:calc(100% - var(--fs,22px) - var(--y,0px));transform:rotate(var(--r,20deg));animation-timing-function:ease-out}
        26%{top:calc(100% - var(--fs,22px) - var(--y,0px) - 7px);transform:rotate(calc(var(--r,20deg) * .7));animation-timing-function:ease-in}
        30%{top:calc(100% - var(--fs,22px) - var(--y,0px));transform:rotate(var(--r,20deg))}
        80%{top:calc(100% - var(--fs,22px) - var(--y,0px));opacity:.9}
        100%{top:calc(100% - var(--fs,22px) - var(--y,0px));transform:rotate(var(--r,20deg)) scale(.85);opacity:0}}
      .fx-helper{animation:fxBob 2.6s ease-in-out infinite}
      @keyframes fxBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
      .fx-flag{transform-box:fill-box;transform-origin:0% 50%;animation:fxFlag 1.1s ease-in-out infinite}
      @keyframes fxFlag{0%,100%{transform:skewY(0deg) scaleX(1)}50%{transform:skewY(-9deg) scaleX(.86)}}
      .fx-arm{transform-box:fill-box;transform-origin:0% 100%;animation:fxArm 2.2s ease-in-out infinite}
      @keyframes fxArm{0%,100%{transform:rotate(0deg)}50%{transform:rotate(-6deg)}}
      .fx-pop{animation:fxPop .5s cubic-bezier(.34,1.56,.64,1)}
      @keyframes fxPop{0%{transform:scale(1)}30%{transform:scale(1.35)}65%{transform:scale(.94)}100%{transform:scale(1)}}
      .fx-count{display:inline-block;animation:fxCount .4s ease-out}
      @keyframes fxCount{from{transform:translateY(7px);opacity:0}to{transform:none;opacity:1}}
      .fx-rp{position:fixed;z-index:70;pointer-events:none;transform:translate(-50%,-50%);will-change:transform,opacity}
      .fx-flame{width:6px;height:9px;border-radius:50% 50% 45% 45%;background:radial-gradient(circle at 50% 70%,#fff3b0 0,#ffb020 40%,#ff5a00 75%,rgba(255,60,0,0) 100%);box-shadow:0 0 7px #ff7a18;animation:fxFlame .85s ease-out forwards}
      @keyframes fxFlame{0%{transform:translate(-50%,-50%) scale(.6);opacity:1}100%{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(.15);opacity:0}}
      .fx-flash{width:34px;height:34px;border-radius:50%;background:radial-gradient(circle,#fff 0,rgba(225,238,255,.9) 22%,rgba(180,200,255,0) 70%);animation:fxFlash .32s ease-out forwards}
      @keyframes fxFlash{0%{transform:translate(-50%,-50%) scale(.2);opacity:1}100%{transform:translate(-50%,-50%) scale(1.5);opacity:0}}
      .fx-steel{width:15px;height:2px;border-radius:2px;background:linear-gradient(90deg,rgba(255,255,255,0),#fff,#ffe9a8);transform-origin:0 50%;animation:fxSteel .38s ease-out forwards}
      @keyframes fxSteel{0%{transform:translate(0,-50%) rotate(var(--a)) translateX(3px) scaleX(.3);opacity:1}100%{transform:translate(0,-50%) rotate(var(--a)) translateX(20px) scaleX(1);opacity:0}}
      .fx-glint{font-size:11px;line-height:1;color:#d6f3ff;text-shadow:0 0 6px #7dd3fc,0 0 2px #fff;animation:fxGlint .75s ease-out forwards}
      @keyframes fxGlint{0%{transform:translate(-50%,-50%) scale(0) rotate(0);opacity:0}30%{opacity:1;transform:translate(calc(-50% + var(--dx) * .6),calc(-50% + var(--dy) * .6)) scale(1.25) rotate(45deg)}100%{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(.2) rotate(90deg);opacity:0}}
      .fx-heart{font-size:15px;line-height:1;animation:fxHeart 1.15s ease-out forwards}
      @keyframes fxHeart{0%{transform:translate(-50%,-50%) scale(.5);opacity:0}20%{opacity:1;transform:translate(-50%,-110%) scale(1.1)}100%{transform:translate(calc(-50% + var(--dx)),-330%) scale(.85);opacity:0}}
      .fx-bar{transition:width 1s cubic-bezier(.2,.8,.2,1)}
      .fx-barshine{position:absolute;inset:0;overflow:hidden;border-radius:inherit;pointer-events:none}
      .fx-barshine::before{content:"";position:absolute;top:0;bottom:0;left:0;width:40%;background:linear-gradient(100deg,rgba(255,240,190,0),rgba(255,240,190,.18) 35%,rgba(255,250,225,.55) 50%,rgba(255,240,190,.18) 65%,rgba(255,240,190,0));transform:translateX(-110%) skewX(-14deg);animation:fxShine 2.8s ease-in-out infinite}
      @keyframes fxShine{0%,10%{transform:translateX(-110%) skewX(-14deg)}70%,100%{transform:translateX(270%) skewX(-14deg)}}
      .fx-res img{width:var(--fs,22px);height:var(--fs,22px);object-fit:contain;filter:drop-shadow(0 2px 3px rgba(0,0,0,.5))}
      .fx-pollopt{transition:transform .15s ease,border-color .15s ease,background-color .15s ease}
      .fx-pollopt:hover{transform:translateY(-1px)}
      @media (prefers-reduced-motion: reduce){.fx-layer,.fx-spark,.fx-rp,.fx-rocket,.fx-fw{display:none!important}.fx-forge,.fx-pop,.fx-count,.fx-helper,.fx-flag,.fx-arm{animation:none!important}.fx-bar{transition:none!important}}`;
    document.head.appendChild(css);
  })();
  // feste „Zufalls“-Werte je Index (gleiches Bild bei jedem Neuzeichnen)
  const rnd = (i, k = 1) => { const x = Math.sin((i + 1) * 12.9898 * k) * 43758.5453; return x - Math.floor(x); };
  const goldLayer = (n = 12) => `<div class="fx-layer">${Array.from({ length: n }, (_, i) => `<span class="fx-gold${i % 3 === 2 ? ' fx-flake' : ''}" style="left:${(rnd(i, 1) * 96 + 2).toFixed(1)}%;--sz:${(2 + rnd(i, 2) * 3).toFixed(1)}px;--t:${(5.5 + rnd(i, 3) * 4).toFixed(2)}s;--d:${(-rnd(i, 4) * 9).toFixed(2)}s;--dx:${((rnd(i, 5) - .5) * 40).toFixed(0)}px"></span>`).join('')}</div>`;
  const emberLayer = (n = 14) => `<div class="fx-layer">${Array.from({ length: n }, (_, i) => `<span class="fx-ember" style="left:${(rnd(i, 7) * 96 + 2).toFixed(1)}%;--sz:${(2 + rnd(i, 8) * 2.5).toFixed(1)}px;--t:${(2.6 + rnd(i, 9) * 2.6).toFixed(2)}s;--d:${(-rnd(i, 10) * 5).toFixed(2)}s;--dx:${((rnd(i, 11) - .5) * 36).toFixed(0)}px"></span>`).join('')}</div>`;
  const skullLayer = (n = 9) => `<div class="fx-layer">${Array.from({ length: n }, (_, i) => `<span class="fx-skull" style="left:${(rnd(i, 21) * 92 + 2).toFixed(1)}%;--fs:${(10 + rnd(i, 22) * 7).toFixed(0)}px;--t:${(5 + rnd(i, 23) * 4).toFixed(2)}s;--d:${(-rnd(i, 24) * 9).toFixed(2)}s;--dx:${((rnd(i, 25) - .5) * 40).toFixed(0)}px;--r:${((rnd(i, 26) - .5) * 360).toFixed(0)}deg">💀</span>`).join('')}</div>`;
  const resLayer = (icons, n = 12) => { const ic = icons.length ? icons : ['🪙'];
    return `<div class="fx-layer">${Array.from({ length: n }, (_, i) => { const x = ic[i % ic.length], img = /\.(png|webp|jpe?g)$/i.test(x);
      return `<span class="fx-res" style="left:${(rnd(i, 31) * 94 + 1).toFixed(1)}%;--fs:${((img ? 20 : 14) + rnd(i, 32) * (img ? 12 : 8)).toFixed(0)}px;--t:${(6 + rnd(i, 33) * 5).toFixed(2)}s;--d:${(-rnd(i, 34) * 11).toFixed(2)}s;--y:${(rnd(i, 37) * 12).toFixed(0)}px;--r:${((rnd(i, 36) - .5) * 70).toFixed(0)}deg">${img ? `<img src="${esc(x)}" alt="" loading="lazy">` : x}</span>`; }).join('')}</div>`; };
  // Feuerwerk über der Craft-Karte: Rakete steigt auf und zerplatzt in bunte Funken
  const FW_COL = ['#ffd27a', '#ffb020', '#ff7a18', '#fde68a', '#fff', '#f87171', '#fca5a5', '#7dd3fc'];
  function fireworkBurst(el) {
    if (!el || !el.isConnected || REDUCE()) return;
    const w = el.offsetWidth; if (!w) return;
    const x0 = w * (.12 + Math.random() * .76), tx = (Math.random() - .5) * 40, ty = -(38 + Math.random() * 40), rk = document.createElement('span');
    rk.className = 'fx-rocket'; rk.style.cssText = `left:${x0.toFixed(0)}px;top:-4px;--tx:${tx.toFixed(0)}px;--ty:${ty.toFixed(0)}px;--t:${(.45 + Math.random() * .2).toFixed(2)}s`;
    const pop = () => { rk.remove(); if (!el.isConnected) return;
      const n = 16 + Math.floor(Math.random() * 8), c1 = FW_COL[Math.floor(Math.random() * FW_COL.length)], c2 = FW_COL[Math.floor(Math.random() * FW_COL.length)];
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + Math.random() * .3, d = 22 + Math.random() * 26, sp = document.createElement('span');
        sp.className = 'fx-fw'; sp.style.cssText = `left:${(x0 + tx).toFixed(0)}px;top:${(ty - 4).toFixed(0)}px;--tx:${(Math.cos(a) * d).toFixed(0)}px;--ty:${(Math.sin(a) * d).toFixed(0)}px;--c:${i % 2 ? c1 : c2};--t:${(.8 + Math.random() * .5).toFixed(2)}s;--sz:${(2 + Math.random() * 2).toFixed(1)}px`;
        sp.addEventListener('animationend', () => sp.remove(), { once: true }); setTimeout(() => sp.remove(), 2200); el.appendChild(sp); } };
    rk.addEventListener('animationend', pop, { once: true }); setTimeout(() => { if (rk.isConnected) pop(); }, 900);
    el.appendChild(rk);
  }
  // Craft-Upgrade: Funken sprühen außen um die Karte (Schmiedefeuer) – beim Erscheinen und dann alle paar Sekunden, solange sichtbar
  function forgeBurst(el, n = 14) {
    if (!el || !el.isConnected || REDUCE()) return;
    const w = el.offsetWidth, h = el.offsetHeight; if (!w || !h) return;
    for (let i = 0; i < n; i++) {
      const side = Math.floor(Math.random() * 4), t = Math.random();
      const x = side === 0 ? t * w : side === 1 ? w : side === 2 ? t * w : 0, y = side === 0 ? 0 : side === 1 ? t * h : side === 2 ? h : t * h;
      const nx = side === 1 ? 1 : side === 3 ? -1 : (Math.random() - .5) * .8, ny = side === 0 ? -1 : side === 2 ? 1 : (Math.random() - .5) * .8;
      const dist = 18 + Math.random() * 34, sp = document.createElement('span');
      sp.className = 'fx-spark' + (Math.random() < .35 ? ' fx-streak2' : '');
      sp.style.cssText = `left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;--tx:${(nx * dist).toFixed(0)}px;--ty:${(ny * dist - 8).toFixed(0)}px;--t:${(.6 + Math.random() * .6).toFixed(2)}s;--sz:${(2 + Math.random() * 2).toFixed(1)}px;--a:${(Math.atan2(ny, nx) * 180 / Math.PI).toFixed(0)}deg;animation-delay:${(Math.random() * .25).toFixed(2)}s`;
      sp.addEventListener('animationend', () => sp.remove(), { once: true }); setTimeout(() => sp.remove(), 2000);
      el.appendChild(sp);
    }
  }
  const forgeSeen = new WeakSet();
  const forgeIO = 'IntersectionObserver' in window ? new IntersectionObserver((ents) => ents.forEach((e) => {
    const el = e.target; el._fxVis = e.isIntersecting;
    if (e.isIntersecting && !el._fxT) { if (!forgeSeen.has(el)) { forgeSeen.add(el); forgeBurst(el, 26); fireworkBurst(el); setTimeout(() => fireworkBurst(el), 350); setTimeout(() => fireworkBurst(el), 800); }
      el._fxT = setInterval(() => { if (!el.isConnected) { clearInterval(el._fxT); forgeIO.unobserve(el); return; }
        if (el._fxVis && !document.hidden) { forgeBurst(el, 16); fireworkBurst(el); if (Math.random() < .6) setTimeout(() => fireworkBurst(el), 400 + Math.random() * 500); } }, 2600); }
    if (!e.isIntersecting && el._fxT) { clearInterval(el._fxT); el._fxT = null; }
  }), { threshold: 0.4 }) : null;
  function fxScan(scope) {
    if (R.showcaseFeedFix && (scope || root).querySelector('[data-sc-feed]')) requestAnimationFrame(() => R.showcaseFeedFix(scope || root));
    (scope || root).querySelectorAll('.fx-forge').forEach((el) => { if (el._fxObs) return; el._fxObs = true; if (forgeIO) forgeIO.observe(el); else { forgeBurst(el, 22); fireworkBurst(el); } });
    // Umfrage-Balken: von 0 auf den Wert wachsen lassen
    (scope || root).querySelectorAll('[data-bar-w]').forEach((b) => { const w = b.dataset.barW; b.removeAttribute('data-bar-w'); requestAnimationFrame(() => requestAnimationFrame(() => { b.style.width = w + '%'; })); });
  }
  // Reaktionen: Pop + Partikel je Emoji
  function reactFx(btn, emoji) {
    if (!btn) return;
    btn.classList.remove('fx-pop'); void btn.offsetWidth; btn.classList.add('fx-pop');
    if (REDUCE()) return;
    const r = btn.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const spawn = (cls, html, vars, delay) => { const e = document.createElement('span'); e.className = 'fx-rp ' + cls; if (html) e.textContent = html;
      e.style.left = cx + 'px'; e.style.top = cy + 'px'; Object.entries(vars || {}).forEach(([k, v]) => e.style.setProperty(k, v)); if (delay) e.style.animationDelay = delay + 'ms';
      e.addEventListener('animationend', () => e.remove(), { once: true }); setTimeout(() => e.remove(), 2200); document.body.appendChild(e); };
    const rr = (a, b) => a + Math.random() * (b - a);
    if (emoji === '🔥') { const n = 3 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) spawn('fx-flame', '', { '--dx': rr(-14, 14).toFixed(0) + 'px', '--dy': (-rr(26, 48)).toFixed(0) + 'px' }, i * 55); }
    else if (emoji === '⚔️') { spawn('fx-flash'); for (let i = 0; i < 6; i++) spawn('fx-steel', '', { '--a': (i * 60 + rr(-12, 12)).toFixed(0) + 'deg' }); }
    else if (emoji === '💎') { for (let i = 0; i < 4; i++) { const a = (i * 90 + 45 + rr(-20, 20)) * Math.PI / 180, d = rr(14, 22); spawn('fx-glint', '✦', { '--dx': (Math.cos(a) * d).toFixed(0) + 'px', '--dy': (Math.sin(a) * d).toFixed(0) + 'px' }, i * 70); } }
    else if (emoji === '❤️') spawn('fx-heart', '❤️', { '--dx': rr(-10, 10).toFixed(0) + 'px' });
  }
  // ---------- Englische Texte für den Feed (hängen sich an window.I18N an – i18n.js muss dafür nicht geändert werden) ----------
  (function feedI18n() {
    const I = window.I18N; if (!I || !I.translations || !I.translations.en) return;
    Object.assign(I.translations.en.texts, {
      'Gear-Upgrade': 'Gear upgrade', 'Rss': 'Rss', 'Meine Rss': 'My Rss', 'Umfrage': 'Poll', 'Umfragen': 'Polls', 'Set': 'Set', 'Sets': 'Sets', 'Gear': 'Gear', 'Meine': 'Mine',
      'Showcases, KvK, Gear-Upgrades und Bestände aller Spieler': 'Showcases, KvK, gear upgrades and Rss of all players',
      "Was gibt's Neues? (optional) · @ zum Markieren": "What's new? (optional) · @ to tag",
      'Anzeigen:': 'Show:', '🔍 Spieler oder Allianz-Tag': '🔍 Player or alliance tag', 'Erwähnungen': 'Mentions', 'Alle als gelesen markieren': 'Mark all as read',
      'hat dich in einem Beitrag erwähnt': 'mentioned you in a post', 'hat dich in einem Kommentar erwähnt': 'mentioned you in a comment',
      'Noch keine Erwähnungen. Wenn dich jemand mit @ markiert, erscheint es hier.': 'No mentions yet. When someone tags you with @, it shows up here.',
      '⚠ Die Tabelle „notifications“ fehlt noch in Supabase (SQL im Chat ausführen).': '⚠ The “notifications” table is missing in Supabase (run the SQL from the chat).',
      'Kommentieren': 'Comment', 'Antworten': 'Reply', 'Einklappen': 'Collapse', 'Senden': 'Send', 'Kommentar schreiben … (@ zum Markieren)': 'Write a comment … (@ to tag)',
      'GIF anhängen (nur GIFs)': 'Attach GIF (GIFs only)', 'GIF entfernen': 'Remove GIF', '🚫 Nur GIFs erlaubt – keine Fotos.': '🚫 GIFs only – no photos.', 'GIF wird geprüft …': 'Checking GIF …', 'GIF wird hochgeladen …': 'Uploading GIF …',
      '🚫 Dieses GIF ist im Feed nicht erlaubt.': '🚫 This GIF is not allowed in the feed.',
      'Kommentar bearbeiten': 'Edit comment', 'Kommentar löschen': 'Delete comment', 'Text bearbeiten': 'Edit text', 'Löschen': 'Delete', 'bearbeitet': 'edited',
      '@ zum Markieren · Strg+Enter speichert': '@ to tag · Ctrl+Enter saves', 'Abbrechen': 'Cancel', 'Wird gespeichert …': 'Saving …',
      'Der Text darf nicht leer sein – sonst lieber löschen (✕).': 'The text can’t be empty – delete the post instead (✕).',
      'Name oder Governor-ID tippen …': 'Type a name or governor ID …', 'Suche …': 'Searching …',
      'Dieser Beitrag wurde gelöscht.': 'This post was deleted.', 'Diese Umfrage ist schon beendet.': 'This poll has already ended.',
      'Allianz-Umfrage': 'Alliance poll', 'Umfrage beendet': 'Poll ended', 'Ergebnis steht fest': 'Result is final', 'Gewonnen:': 'Winner:', 'Niemand hat abgestimmt.': 'Nobody voted.',
      'Du hast abgestimmt': 'You voted', 'Stimme ändern': 'Change vote', 'Neue Antwort antippen': 'Tap a new answer', 'deine Stimme': 'your vote', 'Vorschau': 'Preview',
      'Tippe auf eine Antwort – du kannst sie später noch ändern.': 'Tap an answer – you can change it later.',
      'Frage, z. B. „Wann starten wir die Ark?“': 'Question, e.g. “When do we start Ark?”', '+ Antwort': '+ Answer', 'Antwort entfernen': 'Remove answer', 'Höchstens 4 Antworten.': 'At most 4 answers.',
      'Wie lange läuft die Umfrage?': 'How long should the poll run?', 'Unbegrenzt': 'Unlimited', '1 Tag': '1 day', '3 Tage': '3 days', '7 Tage': '7 days',
      'Wenn sie endet, rückt sie mit dem Ergebnis wieder nach oben im Feed.': 'When it ends, it moves back to the top of the feed with the result.',
      'Ohne Ende – Abstimmen geht dauerhaft.': 'No end – voting stays open.', 'Frage …': 'Question …',
      'Schreib eine Frage für die Umfrage.': 'Write a question for the poll.', 'Die Umfrage braucht mindestens 2 Antworten.': 'The poll needs at least 2 answers.',
      'Stimme nur auf diesem Gerät gespeichert – die Tabelle „feed_votes“ fehlt noch in Supabase (SQL im Chat).': 'Vote saved on this device only – the “feed_votes” table is missing in Supabase (SQL in the chat).',
      'Showcase aus deinem Profil': 'Showcase from your profile', 'Sieht genauso aus wie dein Showcase im Profil. Einzelne Sets postest du über': 'Looks exactly like your showcase in your profile. Post single sets with',
      'Showcase kann nicht angezeigt werden.': 'Showcase can’t be shown.', 'Showcase nicht gefunden.': 'Showcase not found.',
      'Der Showcase-Bereich ist noch nicht geladen – Seite neu laden.': 'The showcase section isn’t loaded yet – reload the page.',
      'Noch kein Showcase – zuerst unter 🎨 Showcases anlegen.': 'No showcase yet – create one under 🎨 Showcases first.',
      'Noch kein Showcase mit Sets – zuerst unter 🎨 Showcases anlegen.': 'No showcase with sets yet – create one under 🎨 Showcases first.',
      'Das Showcase fehlt – bitte nochmal auf „Showcase“ tippen.': 'The showcase is missing – tap “Showcase” again.',
      'Welches Showcase?': 'Which showcase?', 'Sets laden – welche sollen in den Beitrag?': 'Load sets – which ones go into the post?', 'Alle laden': 'Load all', 'Keine': 'None',
      'Wähl mindestens ein Set aus.': 'Select at least one set.', 'Set ohne Ausrüstung': 'Set without gear', 'Keine Sets ausgewählt': 'No sets selected',
      'Mein Set': 'My set', 'Mein Showcase': 'My showcase', 'Showcase': 'Showcase',
      'Welches KvK-Ergebnis?': 'Which KvK result?', 'KvK-Bild aus dem Profil': 'KvK image from your profile', 'Ergebnis-Zahlen': 'Result numbers', 'KvK-Ergebnis': 'KvK result',
      'Noch kein KvK-Bild – im KvK-Bereich unter Stats → „Bild für dein Profil“ erstellen.': 'No KvK image yet – create one in KvK → Stats → “Image for your profile”.',
      'Abschnitt (aus deiner KvK-Timeline)': 'Section (from your KvK timeline)', 'Welcher Abschnitt? (aus deiner KvK-Timeline)': 'Which section? (from your KvK timeline)',
      'Pässe': 'Passes', 'Altäre': 'Altars', 'Gesamt': 'Total', 'KvK gesamt': 'KvK total', 'KvK gesamt (bisher)': 'KvK total (so far)', 'bisher': 'so far', 'Eigene': 'Custom', 'Eigene Angabe': 'Custom entry',
      'Ehre': 'Honor', 'Kristalle': 'Crystals', 'Zahlen kommen aus KvK → Stats.': 'Numbers come from KvK → Stats.', 'Verdienst': 'Acclaim', 'Deads': 'Deads', 'Deads (optional)': 'Deads (optional)',
      'Kill-Punkte & Verdienst': 'Kill points & acclaim', 'KP & Verdienst': 'KP & acclaim',
      'Pässe und KvK gesamt kommen aus KvK → Stats (Zwischenstände je Pass) – Zahlen kannst du anpassen.': 'Passes and KvK total come from KvK → Stats (snapshots per pass) – you can adjust the numbers.',
      'Für Altäre gibt es keine gespeicherten Zwischenstände – bitte Zahlen eintragen.': 'There are no saved snapshots for altars – please enter the numbers.',
      'Für diesen Abschnitt gibt es noch keine Zahlen – anderen Abschnitt wählen oder Werte im KvK-Bereich eintragen.': 'No numbers for this section yet – choose another section or enter values in the KvK section.',
      'z. B. Ruine, Kampftag 3 …': 'e.g. ruins, battle day 3 …',
      'Was zeigen?': 'What to show?', 'AoO-Showcase (Profil)': 'AoO showcase (profile)', 'Match-Ergebnis': 'Match result', 'Sieg': 'Victory', 'Niederlage': 'Defeat',
      'Gegner (Allianz)': 'Opponent (alliance)', 'Datum': 'Date', 'Unsere Punkte': 'Our points', 'Punkte Gegner': 'Opponent points', 'Punkte': 'Points', 'Rolle …': 'Role …', 'gegen': 'vs', 'Wähl Sieg oder Niederlage.': 'Choose victory or defeat.',
      'Noch kein AoO-Showcase – unter 🎨 Showcases anlegen.': 'No AoO showcase yet – create one under 🎨 Showcases.',
      'Gear-Upgrade – welches Teil, und was wurde verbessert?': 'Gear upgrade – which piece, and what was improved?', 'Ausrüstung': 'Equipment', 'Armament': 'Armament',
      'Armament posten': 'Post armament', 'Armaments aus deinen Showcase-Sets:': 'Armaments from your showcase sets:', 'Mein Armament': 'My armament', 'Neues Armament': 'New armament',
      'Noch kein Armament – im Showcase bei einem Set die Rüstung (Inschriften) eintragen.': 'No armament yet – add the armament (inscriptions) to a set in your showcase.',
      'Neu / verbessert': 'New / improved', 'Armament kann nicht angezeigt werden.': 'Armament can’t be shown.', 'Wähl ein Armament aus.': 'Choose an armament.',
      'Aus deinen Showcase-Sets': 'From your showcase sets', 'Set wählen → ganzes Set posten': 'Choose a set → post the whole set', 'Ganzes Set posten': 'Post whole set', 'Alle Sets': 'All sets', 'Set:': 'Set:',
      'Neues Set gecraftet': 'New set crafted', 'Neu gecraftet / fertig': 'Newly crafted / done', 'Dieses Set hat keine Ausrüstung.': 'This set has no gear.',
      '🔍 Teil suchen (z. B. Dragon, Hope …)': '🔍 Search a piece (e.g. Dragon, Hope …)', 'ändern': 'change', 'Neu gecraftet': 'Newly crafted', 'Expertise freigeschaltet': 'Expertise unlocked', 'Typ …': 'Type …',
      'Iconic gibt es nur bei legendären Teilen.': 'Iconic only exists on legendary pieces.', 'Sonst noch? z. B. „endlich 5/5 Set“': 'Anything else? e.g. “finally 5/5 set”',
      'Sonst noch? z. B. „endlich komplett Iconic V“': 'Anything else? e.g. “finally all Iconic V”', 'Sonst noch? z. B. „endlich 4× Rot“': 'Anything else? e.g. “finally 4× red”',
      'Wähl zuerst das Ausrüstungsteil.': 'Choose the piece first.', 'Gib an, was verbessert wurde (neu gecraftet, Iconic, Expertise oder eigene Angabe).': 'Say what was improved (newly crafted, Iconic, expertise or your own note).',
      'Help Me – was soll ich verbessern?': 'Help Me – what should I improve?', 'Zum Help-Me-Beitrag →': 'Go to the Help Me post →', 'Was soll ich als Nächstes craften?': 'What should I craft next?', 'Was soll ich als Nächstes verbessern?': 'What should I improve next?',
      'Mein Pass startet': 'My pass opens', 'deine Zeit': 'your time', '(deine Zeit)': '(your time)', 'Welcher Pass öffnet?': 'Which pass opens?', 'Öffnet am': 'Opens on', 'Trag ein, wann dein Pass öffnet.': 'Enter when your pass opens.',
      'Zeit kommt aus deinem KvK-Kalender – bei Bedarf anpassen.': 'Time comes from your KvK calendar – adjust if needed.',
      'Kein KvK-Startdatum gesetzt – Zeit bitte eintragen (oder unter KvK → Get Ready das Startdatum festlegen).': 'No KvK start date set – enter the time (or set the start date under KvK → Get Ready).',
      'Neue VIP-Stufe erreicht': 'New VIP level reached', 'Mein VIP-Status': 'My VIP status', 'Höchste Stufe erreicht 👑': 'Highest level reached 👑', 'Neue Stufe erreicht': 'New level reached', 'Status': 'Status',
      'Neue Stufe: VIP': 'New level: VIP', '20 = SVIP': '20 = SVIP', 'Trag deine neue VIP-Stufe ein (1–20).': 'Enter your new VIP level (1–20).', 'Für den VIP-Status fehlt ein VIP-Scan.': 'A VIP scan is missing for the VIP status.',
      'Noch kein VIP-Scan – für den Status zuerst im Scanner unter VIP erfassen.': 'No VIP scan yet – scan VIP in the scanner first.',
      'Was zeigen? (alles einzeln wählbar)': 'What to show? (each item selectable)', 'Alles': 'All', 'Nur Rss': 'Rss only', 'Nur Speedups': 'Speedups only', 'Uni + Heilung': 'Uni + healing', 'Nur AP': 'AP only',
      'Uni + Heilung zusammen': 'Uni + healing combined', 'AP gesamt': 'AP total', 'inkl. Rucksack': 'incl. backpack', 'ohne Rucksack': 'without backpack', 'Proviant': 'Food', 'Holz': 'Wood', 'Stein': 'Stone', 'Gold': 'Gold',
      'Universal': 'Universal', 'Training': 'Training', 'Heilung': 'Healing', 'Forschung': 'Research', 'Bau': 'Building', 'nichts ausgewählt': 'nothing selected', 'kein Scan': 'no scan',
      'Werte aus deinen letzten Scans – sie werden beim Posten festgehalten.': 'Values from your latest scans – they are fixed when you post.',
      'Wähl mindestens Ressourcen, Speedups oder AP aus.': 'Choose at least resources, speedups or AP.', 'Noch keine Scans – zuerst Ressourcen, Speedups oder AP im Scanner erfassen.': 'No scans yet – scan resources, speedups or AP in the scanner first.',
      'Meine KvK-Karte': 'My KvK map', 'Karte öffnen': 'Open map', 'mein Camp': 'my camp', 'verbündet': 'allied',
      'Noch keine Karte – unter KvK → Karte die Camps mit ihren Königreichen eintragen.': 'No map yet – enter the camps with their kingdoms under KvK → Map.',
      'Die Karte kann gerade nicht geöffnet werden.': 'The map can’t be opened right now.', 'Der KvK-Bereich ist noch nicht geladen.': 'The KvK section isn’t loaded yet.',
      'Welche Anfrage?': 'Which request?', 'Wähl die Help-Me-Anfrage aus.': 'Choose the Help Me request.', 'Deine Help-Me-Anfragen werden geladen …': 'Loading your Help Me requests …',
      'Keine offene Help-Me-Anfrage – zuerst unter 🆘 Help Me eine stellen.': 'No open Help Me request – create one under 🆘 Help Me first.',
      'Schreib etwas oder häng etwas an.': 'Write something or attach something.', 'Das ist kein Bild.': 'That is not an image.', '✓ Im Feed gepostet': '✓ Posted to the feed',
      'Der Feed ist noch nicht geladen – bitte Seite neu laden.': 'The feed isn’t loaded yet – please reload the page.', '✓ Gepostet': '✓ Posted', 'Wird gepostet …': 'Posting …',
      'Höchstens 7 Sets – erst eines abwählen.': 'At most 7 sets – deselect one first.', 'Nichts gefunden.': 'Nothing found.',
      'Beitrag': 'Post', 'Foto / GIF': 'Photo / GIF', 'KvK-Bilanz': 'KvK result', 'AoO-Showcase': 'AoO showcase', 'Pass-Start': 'Pass start', 'VIP-Stufe': 'VIP level', 'KvK-Karte': 'KvK map',
      'Fotos': 'Photos', 'KvK-Bilanz & Karte': 'KvK result & map', 'Text': 'Text', 'Alle': 'All', 'Anhängen:': 'Attach:', 'Anhang entfernen': 'Remove attachment',
      'Stimme(n)': 'vote(s)', 'Foto': 'Photo', '⬆ Ältere Beiträge laden': '⬆ Load older posts', 'Ältere Beiträge laden': 'Load older posts', 'Lade …': 'Loading …', 'Feed wird geladen …': 'Loading feed …'
    });
    const un = (x) => String(x).replace(/(\d+) Std\.?/g, '$1 h').replace(/(\d+) Min\.?/g, '$1 min').replace(/(\d+) Tagen?\b/g, (m, n) => `${n} day${n === '1' ? '' : 's'}`).replace(/(\d+) Tage\b/g, '$1 days');
    const SLOT = { Helm: 'Helmet', Brust: 'Chest', Waffe: 'Weapon', Handschuhe: 'Gloves', Beine: 'Legs', Stiefel: 'Boots', Accessoire: 'Accessory' };
    const TROOP = { Infanterie: 'Infantry', Kavallerie: 'Cavalry', 'Bogenschützen': 'Archers', Belagerung: 'Siege', Integration: 'Integration', 'Führung': 'Leadership' };
    I.translations.en.patterns.unshift(
      [/^vor (.+?)( · bearbeitet)?$/, (m, a, e) => `${un(a)} ago${e ? ' · edited' : ''}`],
      [/^((?:.* · )?)(Helm|Brust|Waffe|Handschuhe|Beine|Stiefel|Accessoire)((?: \d)?)((?: · |: ).*|)$/, (m, a, sl, n, b) => `${a}${SLOT[sl]}${n}${b.replace(/^ · Iconic/, ' · Iconic')}`],
      [/^Refine (\S+) (Voll|\d+%)$/, (m, t, v) => `Refine ${TROOP[t] || t} ${v === 'Voll' ? 'full' : v}`],
      [/^Antwort (\d)$/, 'Answer $1'], [/^● Live · aktualisiert (.+)$/, '● Live · updated $1'], [/^Live · aktualisiert (.+)$/, 'Live · updated $1'], [/^Gewonnen$/, 'Winner'],
      [/^(\d+) Stimmen?$/, (m, n) => `${n} vote${n === '1' ? '' : 's'}`],
      [/^(\d+) Antwort(en)?$/, (m, n) => `${n} answer${n === '1' ? '' : 's'}`],
      [/^noch (.+)$/, (m, a) => `ends in ${un(a)}`], [/^öffnet in (.+)$/, (m, a) => `opens in ${un(a)}`],
      [/^(\d+) Teile? · (\d+)× Expertise$/, '$1 pieces · $2× expertise'], [/^(\d+) Teile?$/, '$1 pieces'], [/^(\d+) Set(s?) · (\d+) Teile?$/, '$1 set$2 · $3 pieces'],
      [/^(.+) · (\d+) Inschriften(.*)$/, '$1 · $2 inscriptions$3'],
      [/^Umfrage beendet vor (.+) – das Ergebnis steht fest$/, (m, a) => `Poll ended ${un(a)} ago – the result is final`],
      [/^Meine (\d+) Sets$/, 'My $1 sets'], [/^Showcase · (\d+) Sets?$/, 'Showcase · $1 sets'],
      [/^(.+) VIP-Punkte inkl\. Rucksack$/, '$1 VIP points incl. backpack'], [/^Punkte bis (.+)$/, 'points to $1'], [/^Noch$/, 'Still'],
      [/^Scan vom (.+)$/, 'Scan from $1'], [/^Meine KvK-Karte · Start (.+)$/, 'My KvK map · start $1'],
      [/^(Abstimmen|Speichern|Löschen|Reaktion|Kommentar|Im Feed posten|Posten|Showcase-Bild) fehlgeschlagen: (.*)$/, (m, a, e) => `${({ Abstimmen: 'Voting', Speichern: 'Saving', 'Löschen': 'Deleting', Reaktion: 'Reaction', Kommentar: 'Comment', 'Im Feed posten': 'Posting to the feed', Posten: 'Posting', 'Showcase-Bild': 'Showcase image' })[a] || a} failed: ${e}`],
      [/^Höchstens (\d+) Sets – erst eines abwählen\.$/, 'At most $1 sets – deselect one first.'],
      [/^Kein Spieler „(.+)“ gefunden$/, 'No player “$1” found'],
      [/^(.+) · (\d+) Sets$/, '$1 · $2 sets'], [/^(\d+) Stimme\(n\)$/, '$1 vote(s)']
    );
  })();
  const tt = (x) => { try { return window.I18N && I18N.lang && I18N.lang() === 'en' ? I18N.tr(x) : x; } catch { return x; } };
  window.addEventListener('langchange', () => { try { renderComposer(); renderList(); } catch {} });
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
  async function fetchVotes(posts) {
    const out = {}, ids = posts.filter((p) => p.kind === 'poll').map((p) => p.id);
    if (!ids.length || st.noVotes) return out;
    const r = await db().from('feed_votes').select('*').in('post_id', ids);
    if (r.error) { if (R.tableMissing(r.error)) st.noVotes = true; return out; }
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
      await addEndedPolls();
      const ids = st.posts.map((p) => p.id);
      [st.reacts, st.comments, st.votes] = await Promise.all([fetchReacts(ids), fetchComments(ids), fetchVotes(st.posts)]);
      st.users = {}; await addUsers([...st.posts, ...Object.values(st.comments).flat()]);
      st.noTable = false; st.lastSync = Date.now();
    } catch (e) { if (R.tableMissing(e)) st.noTable = true; else st.err = A.germanError ? A.germanError(e) : String(e.message || e); }
    st.loading = false; st.loaded = true; renderList();
  }
  // Umfragen, die in den letzten 7 Tagen geendet haben, kommen mit dem Ergebnis wieder nach oben – auch wenn sie älter als die geladenen Beiträge sind
  async function addEndedPolls() {
    try {
      const now = new Date(), from = new Date(Date.now() - 7 * 864e5);
      const { data, error } = await db().from('feed_posts').select('*').eq('kind', 'poll').gte('data->>ends', from.toISOString()).lte('data->>ends', now.toISOString()).limit(20);
      if (error || !data) return;
      const have = new Set(st.posts.map((p) => p.id));
      data.filter((p) => !have.has(p.id)).forEach((p) => { p._bump = true; st.posts.push(p); });
    } catch {}
  }
  let pollEndSeen = new Set();
  setInterval(() => {   // läuft eine Umfrage ab, während der Feed offen ist → neu sortieren
    if (R.view !== 'feed' || document.hidden) return;
    let changed = false;
    st.posts.forEach((p) => { if (pollOver(p) && !pollEndSeen.has(p.id)) { pollEndSeen.add(p.id); changed = true; } });
    root.querySelectorAll('[data-poll-left]').forEach((el) => { const p = st.posts.find((x) => x.id === el.dataset.pollLeft), e = pollEnds(p); if (e && e > Date.now()) el.textContent = `⏳ noch ${leftTxt(e - Date.now())}`; });
    if (changed && !typing()) renderList();
  }, 30000);
  const sig = () => JSON.stringify([st.posts.map((p) => p.id + (p.image || '') + (p.edited_at || '')), st.pending.length, Object.entries(st.reacts).map(([k, v]) => k + v.map((x) => x.user_id + x.emoji).join()), Object.values(st.comments).flat().map((c) => c.id + (c.image || '') + (c.edited_at || '')), Object.entries(st.votes).map(([k, v]) => k + v.length)]);
  const typing = () => { const l = $('feedList'), a = document.activeElement; return !!(l && a && l.contains(a) && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA')) || !!st.edit; };
  const scrolledDown = () => { const l = $('feedList'); return !!l && l.getBoundingClientRect().top < -150; };
  // Leise im Hintergrund: neue Beiträge, gelöschte Beiträge und Reaktionen abgleichen
  async function poll() {
    if (st.polling || st.loading || st.noTable || !st.loaded) return;
    st.polling = true;
    try {
      const all = [...st.pending, ...st.posts.filter((p) => !p._bump)];
      const win = all.slice(0, LIMIT), cutoff = win.length ? win[win.length - 1].created_at : null;
      let q = db().from('feed_posts').select('*').order('created_at', { ascending: false });
      q = cutoff ? q.gte('created_at', cutoff).limit(200) : q.limit(LIMIT);
      const { data, error } = await q;
      if (error) throw error;
      const fresh = data || [], shown = new Set(st.posts.map((p) => p.id));
      const fids = new Set((data || []).map((p) => p.id));
      const older = st.posts.filter((p) => !fids.has(p.id) && (p._bump || (cutoff && p.created_at < cutoff)));
      const before = sig();
      await addUsers(fresh);
      const newOnes = fresh.filter((p) => !shown.has(p.id) && p.user_id !== me());
      if (newOnes.length && scrolledDown()) {           // weiter unten am Lesen → nicht verschieben, nur Hinweis zeigen
        st.pending = newOnes;
        st.posts = [...fresh.filter((p) => shown.has(p.id) || p.user_id === me()), ...older];
      } else { st.pending = []; st.posts = [...fresh, ...older]; }
      const ids = [...st.pending, ...st.posts].map((p) => p.id);
      [st.reacts, st.comments, st.votes] = await Promise.all([fetchReacts(ids), fetchComments(ids), fetchVotes([...st.pending, ...st.posts])]);
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
      const reg = st.posts.filter((p) => !p._bump), oldest = (reg[reg.length - 1] || st.posts[st.posts.length - 1]).created_at;
      const { data, error } = await db().from('feed_posts').select('*').order('created_at', { ascending: false }).lt('created_at', oldest).limit(LIMIT);
      if (error) throw error;
      const add = data || [];
      await addUsers(add);
      const ids = add.map((p) => p.id), [rx, cm, vt] = await Promise.all([fetchReacts(ids), fetchComments(ids), fetchVotes(add)]);
      Object.assign(st.reacts, rx); Object.assign(st.comments, cm); Object.assign(st.votes, vt); await addUsers(Object.values(cm).flat());
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
    if (a.kind === 'craft' && d.mode === 'set') { if (!Object.keys(d.gear || {}).length) return 'Dieses Set hat keine Ausrüstung.'; }
    else if (a.kind === 'craft' && d.mode === 'arm') { if (!d.arm) return 'Wähl ein Armament aus.'; }
    else if (a.kind === 'craft') { if (!d.item && !d.name) return 'Wähl zuerst das Ausrüstungsteil.'; if (!d.crafted && !d.ic && !d.exp && !(d.note || '').trim()) return 'Gib an, was verbessert wurde (neu gecraftet, Iconic, Expertise oder eigene Angabe).'; }
    if (a.kind === 'pass' && !d.ts) return 'Trag ein, wann dein Pass öffnet.';
    if (a.kind === 'stock' && !d.res && !d.speed && !d.ap) return 'Wähl mindestens Ressourcen, Speedups oder AP aus.';
    if (a.kind === 'kvkpts' && !d.kp && !d.acclaim && !d.deads) return 'Trag Kill-Punkte oder Verdienst ein.';
    if (a.kind === 'help' && !d.rid) return 'Wähl die Help-Me-Anfrage aus.';
    if (a.kind === 'set' && !(d.sets || []).length) return 'Wähl mindestens ein Set aus.';
    if (a.kind === 'showcase' && !(d.entry)) return 'Das Showcase fehlt – bitte nochmal auf „Showcase“ tippen.';
    if (a.kind === 'kvk' && d.mode === 'stats' && !d.kp && !d.acclaim && !d.deads && !d.honor && !d.crystal) return 'Für diesen Abschnitt gibt es noch keine Zahlen – anderen Abschnitt wählen oder Werte im KvK-Bereich eintragen.';
    if (a.kind === 'aoo' && d.mode === 'match' && !d.res) return 'Wähl Sieg oder Niederlage.';
    if (a.kind === 'poll') { if (!String(d.q || '').trim()) return 'Schreib eine Frage für die Umfrage.'; if ((d.opts || []).filter((o) => String(o).trim()).length < 2) return 'Die Umfrage braucht mindestens 2 Antworten.'; }
    if (a.kind === 'vip' && !(d.lv >= 1)) return d.mode === 'status' ? 'Für den VIP-Status fehlt ein VIP-Scan.' : 'Trag deine neue VIP-Stufe ein (1–20).';
    return '';
  }
  async function post() {
    const body = st.text.trim(), a = st.attach;
    if (!body && !a) { msg('Schreib etwas oder häng etwas an.', 'warn'); return; }
    const bad = checkAttach(a); if (bad) { msg(bad, 'warn'); return; }
    if (st.busy) return; st.busy = true; msg('Wird gepostet …', 'busy'); renderComposer();
    try {
      const ments = await resolveMentions(body);
      const row = { user_id: me(), kind: a ? a.kind : 'text', body: body.slice(0, 1000), image: null, data: a ? cleanData(a) : null };
      let r = await db().from('feed_posts').insert(ments.length ? { ...row, mentions: ments } : row).select().single();
      if (r.error && ments.length && colMissing(r.error)) r = await db().from('feed_posts').insert(row).select().single();   // Spalte mentions fehlt noch
      const { data: ins, error } = r;
      if (error) throw error;
      notify(ments, { kind: 'post', post_id: ins.id, body: body.slice(0, 140) });
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
    delete d._segs; delete d.opt; delete d._kx;
    if (a.kind === 'poll') { d.q = String(d.q || '').trim().slice(0, 140); d.opts = (d.opts || []).map((o) => String(o).trim().slice(0, 60)).filter(Boolean).slice(0, 4);
      const h = +d.dur || 0; d.dur = h; d.ends = h ? new Date(Date.now() + h * 3600e3).toISOString() : null; }
    return Object.keys(d).length ? d : null;
  }
  async function del(id) {
    if (!(await window.UI.confirm('Diesen Beitrag löschen?'))) return;
    const { error } = await db().from('feed_posts').delete().eq('id', id);
    if (error) { msg('Löschen fehlgeschlagen: ' + (A.germanError ? A.germanError(error) : error.message), 'err'); return; }
    st.posts = st.posts.filter((p) => p.id !== id); renderList();
  }
  const colMissing = (e) => /column/i.test(String(e?.message || e || ''));   // z. B. „Could not find the 'mentions' column …“
  const GIF_ONLY = '🎞️';   // Platzhalter-Text, falls die Datenbank leere Kommentare ablehnt
  const cmMsg = (pid, t, tone) => { st.cmMsg[pid] = t ? [t, tone] : null; const el = root.querySelector(`[data-cm-msg="${CSS.escape(pid)}"]`); if (el) { el.textContent = t || ''; el.className = 'text-[11px] ' + ({ ok: 'text-emerald-400', warn: 'text-amber-300', err: 'text-red-300', busy: 'text-slate-300' }[tone] || 'text-slate-500'); } };
  async function sendComment(postId) {
    const body = String(st.cmDraft[postId] || '').trim().slice(0, 500), gif = st.cmGif[postId];
    if ((!body && !gif) || st.cmBusy) return;
    st.cmBusy = true; if (gif) cmMsg(postId, 'GIF wird hochgeladen …', 'busy');
    try {
      const ments = await resolveMentions(body);
      const base = { post_id: postId, user_id: me(), body };
      let r = await db().from('feed_comments').insert(ments.length ? { ...base, mentions: ments } : base).select().single();
      if (r.error && ments.length && colMissing(r.error)) r = await db().from('feed_comments').insert(base).select().single();
      if (r.error && !body && /check|violat|null/i.test(r.error.message || '')) r = await db().from('feed_comments').insert({ ...base, body: GIF_ONLY }).select().single();
      if (r.error) throw r.error;
      const data = r.data;
      if (gif) {   // GIF unverändert hochladen (Dateiname = Kommentar-ID)
        try {
          const url = await A.uploadImage(await dataUrlToBlob(gif.dataUrl), 'cm_' + data.id);
          const u = await db().from('feed_comments').update({ image: url }).eq('id', data.id);
          if (u.error) throw u.error;
          data.image = url;
        } catch (x) { cmMsg(postId, colMissing(x) ? 'Kommentar gesendet – für GIFs fehlt noch die Spalte „image“ (SQL im Chat).' : 'Kommentar gesendet, aber das GIF konnte nicht hochgeladen werden: ' + (x.message || x), 'warn'); }
      }
      (st.comments[postId] = st.comments[postId] || []).push(data);
      delete st.cmDraft[postId]; delete st.cmGif[postId]; await addUsers([data]);
      if (!st.cmMsg[postId] || st.cmMsg[postId][1] === 'busy') st.cmMsg[postId] = null;
      notify(ments, { kind: 'comment', post_id: postId, comment_id: data.id, body: body.slice(0, 140) });
    } catch (e) { msg(R.tableMissing(e) ? 'Die Kommentar-Tabelle fehlt noch in Supabase (SQL im Chat ausführen).' : 'Kommentar fehlgeschlagen: ' + (A.germanError ? A.germanError(e) : e.message), 'err'); if (R.tableMissing(e)) st.noCm = true; else cmMsg(postId, 'Kommentar fehlgeschlagen: ' + (A.germanError ? A.germanError(e) : e.message), 'err'); }
    st.cmBusy = false; renderList();
    const inp = root.querySelector(`[data-cm-in="${CSS.escape(postId)}"]`); if (inp) inp.focus();
  }
  // GIF für einen Kommentar wählen – nur GIFs, keine Fotos
  async function pickCmGif(postId, file) {
    if (!file || !postId) return;
    if (file.type !== 'image/gif' && !/\.gif$/i.test(file.name || '')) { cmMsg(postId, '🚫 Nur GIFs erlaubt – keine Fotos.', 'warn'); return; }
    if (file.size > GIF_MAX) { cmMsg(postId, `Das GIF ist zu groß (${(file.size / 1048576).toFixed(1)} MB) – höchstens 8 MB.`, 'warn'); return; }
    cmMsg(postId, 'GIF wird geprüft …', 'busy');
    try {
      const dataUrl = await readDataUrl(file);
      if (!/^data:image\/gif/i.test(dataUrl)) { cmMsg(postId, '🚫 Nur GIFs erlaubt – keine Fotos.', 'warn'); return; }
      await checkImage(dataUrl);
      st.cmGif[postId] = { dataUrl }; st.cmMsg[postId] = null; st.cmOpen.add(postId); renderList();
      const inp = root.querySelector(`[data-cm-in="${CSS.escape(postId)}"]`); if (inp) inp.focus();
    } catch (e) { cmMsg(postId, e.block ? '🚫 Dieses GIF ist im Feed nicht erlaubt.' : 'GIF nicht angehängt: ' + (e.message || e), e.block ? 'err' : 'warn'); }
  }

  // ---------- Bearbeiten (eigene Beiträge und Kommentare) ----------
  function startEdit(kind, id, pid) {
    const src = kind === 'post' ? st.posts.find((p) => p.id === id) : (st.comments[pid] || []).find((c) => c.id === id);
    if (!src) return;
    (src.mentions || []).forEach((m) => { if (m && m.name) mt.map[String(m.t || m.name).toLowerCase()] = m; });
    st.edit = { kind, id, pid, text: src.body === GIF_ONLY ? '' : src.body || '' }; renderList();
    const el = root.querySelector('[data-edit-in]'); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  }
  function cancelEdit() { st.edit = null; renderList(); }
  async function saveEdit() {
    const e = st.edit; if (!e || st.editBusy) return;
    const isPost = e.kind === 'post', tbl = isPost ? 'feed_posts' : 'feed_comments';
    const src = isPost ? st.posts.find((p) => p.id === e.id) : (st.comments[e.pid] || []).find((c) => c.id === e.id);
    if (!src) { st.edit = null; renderList(); return; }
    let body = e.text.trim().slice(0, isPost ? 1000 : 500);
    if (!body && (isPost ? src.kind === 'text' && !src.image : !src.image)) { flashEdit('Der Text darf nicht leer sein – sonst lieber löschen (✕).', 'warn'); return; }
    if (!body && !isPost) body = GIF_ONLY;
    st.editBusy = true; flashEdit('Wird gespeichert …', 'busy');
    try {
      const ments = await resolveMentions(body), now = new Date().toISOString();
      let r = await db().from(tbl).update({ body, edited_at: now, mentions: ments.length ? ments : null }).eq('id', e.id).select();
      if (r.error && colMissing(r.error)) r = await db().from(tbl).update({ body }).eq('id', e.id).select();   // Spalten fehlen noch → nur Text
      if (r.error) throw r.error;
      if (!(r.data || []).length) throw new Error('Keine Berechtigung zum Bearbeiten – bitte das SQL aus dem Chat ausführen.');
      const old = new Set((src.mentions || []).map((m) => m.id));
      Object.assign(src, r.data[0]);
      notify(ments.filter((m) => !old.has(m.id)), isPost ? { kind: 'post', post_id: e.id, body: body.slice(0, 140) } : { kind: 'comment', post_id: e.pid, comment_id: e.id, body: body.slice(0, 140) });
      st.edit = null;
    } catch (x) { st.editBusy = false; flashEdit('Speichern fehlgeschlagen: ' + (A.germanError ? A.germanError(x) : x.message || x), 'err'); return; }
    st.editBusy = false; renderList();
  }
  function flashEdit(t, tone) { const el = root.querySelector('[data-edit-msg]'); if (el) { el.textContent = t; el.className = 'text-[11px] mr-auto ' + ({ ok: 'text-emerald-400', warn: 'text-amber-300', err: 'text-red-300', busy: 'text-slate-300' }[tone] || 'text-slate-500'); } }

  // ---------- @-Erwähnungen: Spieler über Name oder Governor-ID markieren ----------
  const mt = { box: null, el: null, start: 0, q: '', list: [], i: 0, t: null, seq: 0, map: {} };   // map: kleingeschriebener Text nach @ → { id, name, t }
  async function mentionSearch(q) {
    const t = String(q || '').trim().replace(/[%_,()]/g, ''); if (!t) return [];
    const run = (cols) => /^\d{5,}$/.test(t) ? db().from('leaderboard').select(cols).eq('governor_id', t).limit(6)
      : db().from('leaderboard').select(cols).ilike('username', '%' + t + '%').limit(12);
    let r = await run('user_id,username,avatar,alliance_tag,governor_id');
    if (r.error) r = await run('user_id,username,avatar,alliance_tag');
    if (r.error) return [];
    const lo = t.toLowerCase();
    return (r.data || []).filter((u) => u.user_id && u.username && u.user_id !== me())
      .sort((a, b) => (String(b.username).toLowerCase().startsWith(lo) ? 1 : 0) - (String(a.username).toLowerCase().startsWith(lo) ? 1 : 0)).slice(0, 6);
  }
  // Alle @-Markierungen im Text: gewählte aus der Liste + getippte Namen/IDs, die genau passen
  async function resolveMentions(text) {
    const out = new Map(), lo = String(text || '').toLowerCase();
    if (!lo.includes('@')) return [];
    Object.values(mt.map).forEach((m) => { if (m.id !== me() && lo.includes('@' + String(m.t).toLowerCase())) out.set(m.id, { id: m.id, name: m.name, t: m.t }); });
    const covered = (tk) => [...out.values()].some((m) => String(m.t).toLowerCase().startsWith(tk.toLowerCase()));
    const toks = [...new Set([...String(text).matchAll(/(^|\s)@([^\s@,.!?;:()]{2,30})/g)].map((x) => x[2]))].filter((tk) => !covered(tk)).slice(0, 5);
    for (const tk of toks) {
      try {
        const hit = (await mentionSearch(tk)).find((u) => /^\d+$/.test(tk) ? String(u.governor_id) === tk : String(u.username).toLowerCase() === tk.toLowerCase());
        if (hit && hit.user_id !== me()) out.set(hit.user_id, { id: hit.user_id, name: hit.username, t: tk });
      } catch {}
    }
    return [...out.values()].slice(0, 10);
  }
  function mentionClose() { if (mt.box) mt.box.remove(); mt.box = null; mt.el = null; mt.list = []; clearTimeout(mt.t); }
  function mentionDraw() {
    if (!mt.el || !document.body.contains(mt.el)) { mentionClose(); return; }
    if (!mt.box) { mt.box = document.createElement('div'); mt.box.className = 'fixed z-[60] w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-gold-500/40 bg-ink-900 shadow-2xl p-1 text-sm'; document.body.appendChild(mt.box);
      mt.box.addEventListener('mousedown', (ev) => { ev.preventDefault(); const b = ev.target.closest('[data-mpick]'); if (b) mentionPick(+b.dataset.mpick); }); }
    const r = mt.el.getBoundingClientRect(), below = window.innerHeight - r.bottom > 230;
    mt.box.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 296)) + 'px';
    mt.box.style.top = below ? r.bottom + 4 + 'px' : ''; mt.box.style.bottom = below ? '' : window.innerHeight - r.top + 4 + 'px';
    mt.box.innerHTML = !mt.q ? '<div class="px-3 py-2 text-xs text-slate-400">Name oder Governor-ID tippen …</div>'
      : mt.list === null ? '<div class="px-3 py-2 text-xs text-slate-400">⏳ Suche …</div>'
      : !mt.list.length ? `<div class="px-3 py-2 text-xs text-slate-400">Kein Spieler „${esc(mt.q)}“ gefunden</div>`
      : mt.list.map((u, i) => `<button type="button" data-mpick="${i}" class="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left ${i === mt.i ? 'bg-gold-500/15' : 'hover:bg-ink-800'}">
          ${R.avatarHtml ? R.avatarHtml(u.username, u.avatar, 'w-7 h-7 text-xs') : ''}<span class="min-w-0 flex-1"><span class="block truncate font-semibold text-slate-100" translate="no">${esc(u.username)}${u.alliance_tag ? ` <span class="font-normal text-slate-400">[${esc(u.alliance_tag)}]</span>` : ''}</span>${u.governor_id ? `<span class="block text-[10px] text-slate-500">ID ${esc(u.governor_id)}</span>` : ''}</span></button>`).join('');
  }
  function mentionInput(el) {
    const pos = el.selectionStart ?? el.value.length, before = el.value.slice(0, pos);
    const m = /(^|\s)@([^\s@]{0,30})$/.exec(before);
    if (!m) { if (mt.el === el) mentionClose(); return; }
    mt.el = el; mt.start = pos - m[2].length - 1; mt.q = m[2]; mt.i = 0;
    clearTimeout(mt.t);
    if (!mt.q) { mt.list = []; mentionDraw(); return; }
    mt.list = null; mentionDraw();
    const seq = ++mt.seq;
    mt.t = setTimeout(async () => { const l = await mentionSearch(mt.q); if (seq !== mt.seq || mt.el !== el) return; mt.list = l; mt.i = 0; mentionDraw(); }, 220);
  }
  function mentionPick(i) {
    const u = (mt.list || [])[i], el = mt.el; if (!u || !el) return;
    const pos = el.selectionStart ?? el.value.length, ins = '@' + u.username + ' ';
    el.value = el.value.slice(0, mt.start) + ins + el.value.slice(pos);
    const c = mt.start + ins.length; el.setSelectionRange(c, c);
    mt.map[String(u.username).toLowerCase()] = { id: u.user_id, name: u.username, t: u.username };
    mentionClose(); el.dispatchEvent(new Event('input', { bubbles: true })); el.focus();
  }
  // Text mit klickbaren @Namen
  function richText(body, ments) {
    let h = esc(body || ''); const ph = [];
    (Array.isArray(ments) ? ments : []).filter((m) => m && m.id && (m.t || m.name)).sort((a, b) => String(b.t || b.name).length - String(a.t || a.name).length).forEach((m) => {
      const needle = esc('@' + (m.t || m.name)); if (!h.includes(needle)) return;
      ph.push(`<button type="button" data-feed-prof="${esc(m.id)}" title="${esc(m.name)}" class="inline font-semibold text-gold-300 hover:underline" translate="no">@${esc(m.t || m.name)}</button>`);
      h = h.split(needle).join('\u0000' + (ph.length - 1) + '\u0000');
    });
    return h.replace(/\u0000(\d+)\u0000/g, (_, i) => ph[+i]);
  }

  // ---------- Benachrichtigungen (@-Erwähnungen) ----------
  async function notify(ments, info) {
    if (!ments || !ments.length || st.noNotif) return;
    const rows = ments.filter((m) => m.id && m.id !== me()).map((m) => ({ user_id: m.id, from_user: me(), kind: info.kind, post_id: String(info.post_id || ''), comment_id: info.comment_id ? String(info.comment_id) : null, body: info.body || '' }));
    if (!rows.length) return;
    try { const { error } = await db().from('notifications').insert(rows); if (error) throw error; }
    catch (e) { if (R.tableMissing(e)) st.noNotif = true; console.warn('notify', e); }
  }
  const unread = () => st.notifs.filter((n) => !n.read).length;
  function feedBadge() {
    let b = document.querySelector('[data-feed-badge]');
    if (!b) { const tab = document.querySelector('.main-tab[data-view="feed"]'); if (tab) { tab.classList.add('relative'); tab.insertAdjacentHTML('beforeend', '<span data-feed-badge style="display:none" class="absolute -top-1.5 -right-1.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold grid place-items-center"></span>'); } }
    R.setBadge('[data-feed-badge]', unread());
    const bell = $('feedBell'); if (bell) bell.outerHTML = bellHTML();
  }
  async function loadNotifs() {
    if (st.noNotif || !me()) return;
    try {
      const { data, error } = await db().from('notifications').select('*').eq('user_id', me()).order('created_at', { ascending: false }).limit(30);
      if (error) throw error;
      st.notifs = data || []; await addUsers(st.notifs.map((n) => ({ user_id: n.from_user })));
    } catch (e) { if (R.tableMissing(e)) st.noNotif = true; }
    feedBadge(); if (st.nOpen) renderNotifs();
  }
  async function markRead(ids) {
    const list = st.notifs.filter((n) => !n.read && (!ids || ids.includes(n.id))); if (!list.length) return;
    list.forEach((n) => { n.read = true; }); feedBadge();
    try { await db().from('notifications').update({ read: true }).in('id', list.map((n) => n.id)); } catch {}
  }
  const bellHTML = () => { const n = unread();
    return `<button type="button" id="feedBell" data-feed-bell aria-expanded="${st.nOpen}" title="Erwähnungen" class="relative text-xs px-3 py-1.5 rounded-lg border ${st.nOpen ? 'border-gold-400 text-gold-200 bg-gold-500/10' : 'border-ink-600 hover:border-gold-500/60 hover:text-gold-300'}">🔔<span class="hidden sm:inline"> Erwähnungen</span>${n ? `<span class="absolute -top-1.5 -right-1.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold grid place-items-center">${n > 9 ? '9+' : n}</span>` : ''}</button>`; };
  function notifsHTML() {
    if (!st.nOpen) return '';
    const one = (n) => { const u = st.users[n.from_user] || { username: '?' };
      return `<button type="button" data-notif="${esc(n.id)}" class="w-full flex items-start gap-2.5 text-left rounded-xl px-2.5 py-2 transition ${n.read ? 'hover:bg-ink-800/60' : 'bg-gold-500/10 hover:bg-gold-500/15'}">
        ${R.avatarHtml ? R.avatarHtml(u.username, u.avatar, 'w-8 h-8 text-xs shrink-0') : ''}
        <span class="min-w-0 flex-1"><span class="block text-sm text-slate-200"><b translate="no">${esc(u.username || '?')}</b> hat dich ${n.kind === 'comment' ? 'in einem Kommentar' : 'in einem Beitrag'} erwähnt</span>
          ${n.body ? `<span class="block text-xs text-slate-400 truncate">„${esc(n.body)}“</span>` : ''}<span class="block text-[10px] text-slate-500">${R.timeAgo(n.created_at)}</span></span>
        ${n.read ? '' : '<span class="mt-1.5 w-2 h-2 rounded-full bg-red-500 shrink-0"></span>'}</button>`; };
    return `<div class="panel rounded-2xl p-3 flex flex-col gap-1">
      <div class="flex items-center justify-between gap-2 px-1 pb-1"><span class="text-[11px] uppercase tracking-widest text-slate-500">🔔 Erwähnungen</span>
        ${unread() ? '<button type="button" data-notif-all class="text-[11px] text-gold-300 hover:underline">Alle als gelesen markieren</button>' : ''}</div>
      ${st.noNotif ? '<p class="text-xs text-amber-300 px-1">⚠ Die Tabelle „notifications“ fehlt noch in Supabase (SQL im Chat ausführen).</p>'
        : st.notifs.length ? st.notifs.map(one).join('') : '<p class="text-xs text-slate-500 px-1 py-2">Noch keine Erwähnungen. Wenn dich jemand mit @ markiert, erscheint es hier.</p>'}</div>`;
  }
  function renderNotifs() { const el = $('feedNotifs'); if (el) el.innerHTML = notifsHTML(); const b = $('feedBell'); if (b) b.outerHTML = bellHTML(); }
  // Zum Beitrag springen (lädt ihn nach, falls er nicht in der Liste ist)
  async function openPost(postId, commentId) {
    if (R.view !== 'feed' && R.goView) R.goView('feed');
    if (!st.loaded && !st.loading) await load();
    let p = st.posts.find((x) => x.id === postId);
    if (!p && postId) {
      try {
        const { data } = await db().from('feed_posts').select('*').eq('id', postId).maybeSingle();
        if (data) { p = data; st.posts = [...st.posts, data].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
          const [rx, cm] = await Promise.all([fetchReacts([data.id]), fetchComments([data.id])]); Object.assign(st.reacts, rx); Object.assign(st.comments, cm);
          await addUsers([data, ...Object.values(cm).flat()]); }
      } catch {}
    }
    if (!p) { msg('Dieser Beitrag wurde gelöscht.', 'warn'); return; }
    if (commentId) st.cmOpen.add(postId);
    st.filter = 'all'; st.q = ''; st.flash = commentId || postId; renderList(); const fl = $('feedFilter'); if (fl) fl.innerHTML = filterHTML();
    setTimeout(() => { const el = root.querySelector(commentId ? `[data-cm="${CSS.escape(commentId)}"]` : `[data-post="${CSS.escape(postId)}"]`) || root.querySelector(`[data-post="${CSS.escape(postId)}"]`);
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('ring-2', 'ring-gold-400'); setTimeout(() => { el.classList.remove('ring-2', 'ring-gold-400'); st.flash = null; }, 2600); } }, 350);
  }
  R.feedOpenPost = openPost;
  // Help Me → Feed: Anfrage als Beitrag teilen (aus helpme.js aufgerufen)
  R.feedShareHelp = async (req) => {
    const sets = req.sets || [];
    const data = { rid: req.id, title: req.title || 'Was soll ich als Nächstes verbessern?', sets: sets.length, items: sets.reduce((a, x) => a + (x.gear || []).length, 0),
      icons: sets.flatMap((x) => (x.gear || []).map((g) => ({ icon: g.icon || '', rarity: g.rarity || '' }))).slice(0, 8) };
    const { error } = await db().from('feed_posts').insert({ user_id: me(), kind: 'help', body: '', image: null, data });
    if (error) throw error;
    if (st.loaded) load();
    return true;
  };
  async function delComment(postId, id) {
    if (!(await window.UI.confirm('Diesen Kommentar löschen?'))) return;
    const { error } = await db().from('feed_comments').delete().eq('id', id);
    if (error) { msg('Löschen fehlgeschlagen: ' + (A.germanError ? A.germanError(error) : error.message), 'err'); return; }
    st.comments[postId] = (st.comments[postId] || []).filter((c) => c.id !== id); renderList();
  }
  async function react(postId, emoji) {
    const before = [...(st.reacts[postId] || [])], mine = before.find((x) => x.user_id === me()), off = mine && mine.emoji === emoji;
    // sofort zeigen (mit Animation), dann speichern – bei Fehler zurücksetzen
    st.reacts[postId] = off ? before.filter((x) => x.user_id !== me()) : [...before.filter((x) => x.user_id !== me()), { post_id: postId, user_id: me(), emoji }];
    st.reactBump = off ? null : postId + '|' + emoji; renderList(); st.reactBump = null;
    if (!off) reactFx(root.querySelector(`[data-react="${CSS.escape(postId + '|' + emoji)}"]`), emoji);
    try {
      if (off) { const { error } = await db().from('feed_reactions').delete().eq('post_id', postId).eq('user_id', me()); if (error) throw error; }
      else { const { error } = await db().from('feed_reactions').upsert({ post_id: postId, user_id: me(), emoji }); if (error) throw error; }
    } catch (e) { st.reacts[postId] = before; msg('Reaktion fehlgeschlagen: ' + (e.message || e), 'err'); renderList(); }
  }
  // ---------- Umfragen: abstimmen (eine Stimme je Spieler) ----------
  const VOTE_KEY = 'rok_poll_votes';
  const localVotes = () => { try { return JSON.parse(localStorage.getItem(VOTE_KEY) || '{}'); } catch { return {}; } };
  const pollEnds = (p) => { const e = p && p.kind === 'poll' && p.data && p.data.ends ? Date.parse(p.data.ends) : NaN; return Number.isFinite(e) ? e : null; };
  const pollOver = (p) => { const e = pollEnds(p); return e != null && e <= Date.now(); };
  const leftTxt = (ms) => { const m = Math.max(1, Math.round(ms / 60000)); return m < 60 ? `${m} Min.` : m < 48 * 60 ? `${Math.round(m / 60)} Std.` : `${Math.round(m / 1440)} Tage`; };
  const sortTs = (p) => (pollOver(p) ? pollEnds(p) : Date.parse(p.created_at) || 0);   // beendete Umfrage rückt mit dem Ende nach oben
  const myVote = (pid) => { const v = (st.votes[pid] || []).find((x) => x.user_id === me()); if (v) return +v.opt; const l = localVotes()[pid]; return l == null ? null : +l; };
  async function vote(pid, i) {
    const p = st.posts.find((x) => x.id === pid); if (!p || !p.data || !(p.data.opts || [])[i]) return;
    if (pollOver(p)) { msg('Diese Umfrage ist schon beendet.', 'warn'); renderList(); return; }
    const old = myVote(pid), change = old != null;
    st.pollChange.delete(pid);
    if (old === i) { renderList(); return; }
    const list = (st.votes[pid] = (st.votes[pid] || []).filter((v) => v.user_id !== me()));
    list.push({ post_id: pid, user_id: me(), opt: i, created_at: new Date().toISOString() });
    try { const l = localVotes(); l[pid] = i; localStorage.setItem(VOTE_KEY, JSON.stringify(l)); } catch {}
    st.pollAnim.add(pid); renderList();
    if (st.noVotes) { msg('Stimme nur auf diesem Gerät gespeichert – die Tabelle „feed_votes“ fehlt noch in Supabase (SQL im Chat).', 'warn'); return; }
    try {
      const { error } = change ? await db().from('feed_votes').upsert({ post_id: pid, user_id: me(), opt: i }, { onConflict: 'post_id,user_id' })
        : await db().from('feed_votes').insert({ post_id: pid, user_id: me(), opt: i });
      if (error) throw error;
    }
    catch (e) {
      if (R.tableMissing(e)) { st.noVotes = true; msg('Stimme nur auf diesem Gerät gespeichert – die Tabelle „feed_votes“ fehlt noch in Supabase (SQL im Chat).', 'warn'); }
      else if (!/duplicate|unique/i.test(String(e.message || e))) msg('Abstimmen fehlgeschlagen: ' + (e.message || e), 'err');
    }
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
  // ---------- Showcase: welches Showcase + welche Sets (Sets laden, bis zu 7) – als echte Karte statt Bild ----------
  const SC_MAX = 7;
  const scDocList = () => { try { const d = R.ownShowcase ? R.ownShowcase() : null; return ((d && d.list) || []).filter((x) => (x.sets || []).length); } catch { return []; } };
  const scImgUrl = (v) => (typeof v === 'string' && v.length < 600 && /^(https:\/\/|\/icons\/)[A-Za-z0-9/_.:?=&%()+ -]+$/.test(v) ? v : '');
  const scSetFilled = (x) => x.mode === 'shot' ? !!scImgUrl(x.shot) : Object.values(x.gear || {}).some((g) => g && (g.item || g.name));
  function scBuild(sc, sel) {
    const sets = (sc.sets || []).map((x, i) => ({ x, i })).filter(({ x, i }) => sel.includes(i) && scSetFilled(x)).slice(0, SC_MAX).map(({ x, i }) => {
      const gear = {}; Object.entries(x.gear || {}).forEach(([k, g]) => { if (g && (g.item || g.name)) gear[k] = { item: g.item || '', name: g.name || '', icon: g.icon || '', rarity: g.rarity || 'legendary', tier: +g.tier || 0, refine: +g.refine || 0, refType: g.refType || '' }; });
      return { name: String(x.name || `Set ${i + 1}`).slice(0, 30), gear, gfx: x.gfx || null, cmd: (x.cmd || []).filter((c) => c && c.id).slice(0, 2).map((c) => ({ id: c.id, exp: !!c.exp })), shot: x.mode === 'shot' ? scImgUrl(x.shot) : '' };
    });
    const b = sc.bg || {};
    return { title: String(sc.title || 'Showcase').slice(0, 60), bg: b.type === 'img' ? { type: 'img', src: scImgUrl(b.src) } : b.type === 'lib' ? { type: 'lib', id: String(b.id || '') } : { type: 'preset', id: String(b.id || 'none') }, sets };
  }
  // ---------- Showcase: genau wie im Profil (Bühne mit Hintergrund) – als echtes HTML, kein Bild-Export mehr ----------
  function attachShowcase(active) {
    if (!R.showcaseFeedData || !R.showcaseStageHTML) { msg('Der Showcase-Bereich ist noch nicht geladen – Seite neu laden.', 'warn'); return; }
    let doc = null; try { doc = R.ownShowcase ? R.ownShowcase() : null; } catch {}
    if (!doc || !(doc.list || []).length) { msg('Noch kein Showcase – zuerst unter 🎨 Showcases anlegen.', 'warn'); return; }
    const fd = R.showcaseFeedData(active); if (!fd) { msg('Showcase nicht gefunden.', 'warn'); return; }
    st.attach = { kind: 'showcase', data: { sid: fd.entry.id, title: fd.entry.title || '', entry: fd.entry, stats: fd.stats } }; msg('', '');
    renderComposer();
  }
  const showcaseStage = (d) => { let h = ''; try { h = R.showcaseStageHTML ? R.showcaseStageHTML(d.entry, d.stats) : ''; } catch { h = ''; }
    return h || '<div class="py-8 text-center text-xs text-slate-500">Showcase kann nicht angezeigt werden.</div>'; };
  // ---------- Set posten: Sets aus dem Showcase als Rauten (bis zu 7) ----------
  function attachSet() {
    const list = scDocList();
    if (!list.length) { msg('Noch kein Showcase mit Sets – zuerst unter 🎨 Showcases anlegen.', 'warn'); return; }
    let doc = null; try { doc = R.ownShowcase(); } catch {}
    const sc = list.find((x) => x.id === (doc && doc.active)) || list[0];
    const sel = (sc.sets || []).map((x, i) => (scSetFilled(x) ? i : -1)).filter((i) => i >= 0).slice(0, SC_MAX);
    st.attach = { kind: 'set', pick: { sid: sc.id, sel }, data: scBuild(sc, sel) }; renderComposer();
  }
  function scRepick(fn) {
    const a = st.attach; if (!a || a.kind !== 'set') return;
    const list = scDocList(), sc = list.find((x) => x.id === a.pick.sid) || list[0]; if (!sc) return;
    fn(a.pick, sc); a.pick.sid = sc.id === a.pick.sid ? sc.id : a.pick.sid;
    const sc2 = list.find((x) => x.id === a.pick.sid) || sc;
    a.data = scBuild(sc2, a.pick.sel); renderComposer();
  }
  // ---------- KvK: gespeichertes Bild oder Ergebnis-Zahlen je Abschnitt ----------
  function kvkExtra() { try { const k = window.KvKCalc && window.KvKCalc.kvkStats ? window.KvKCalc.kvkStats() : null; return { honor: +(k && k.honor) || 0, crystal: +(k && k.crystal) || 0 }; } catch { return { honor: 0, crystal: 0 }; } }
  function kvkStatsData(segId, opt) {
    const segs = kvkSegs(), t = Date.now();
    const s = segs.find((x) => x.id === segId) || [...segs].reverse().find((x) => x.kp || x.acclaim) || segs[segs.length - 1];
    const ex = kvkExtra(), o = opt || { honor: s.id === 'kvk' && ex.honor > 0, crystal: s.id === 'kvk' && ex.crystal > 0 };
    return { mode: 'stats', seg: s.id, label: s.label, kp: s.kp || 0, acclaim: s.acclaim || 0, deads: s.deads || 0, honor: o.honor ? ex.honor : 0, crystal: o.crystal ? ex.crystal : 0, _segs: segs, _kx: { ...o, ex }, soon: !!(s.ts && s.ts > t) };
  }
  function attachKvk(mode) {
    const img = (A.ownMeta() || {}).kvk_card;
    if ((mode || (img ? 'img' : 'stats')) === 'img' && img) st.attach = { kind: 'kvk', dataUrl: img, data: { mode: 'img' } };
    else st.attach = { kind: 'kvk', data: kvkStatsData('kvk') };
    renderComposer();
  }
  // ---------- AoO: Showcase-Karte aus dem Profil oder ein Match-Ergebnis ----------
  const AOO_ROLES = ['Rally-Lead', 'Garnison', 'Feld / Open Field', 'Flanke & Support', 'Fresh / Fresh-Lead', 'Scout'];
  function attachAoo(mode) {
    const c = (A.ownMeta() || {}).aoo_card;
    if ((mode || (c ? 'card' : 'match')) === 'card' && c) st.attach = { kind: 'aoo', data: { ...c, mode: 'card' } };
    else st.attach = { kind: 'aoo', data: { mode: 'match', res: 'win', vs: '', us: '', them: '', mvp: false, role: '', date: new Date().toISOString().slice(0, 10) } };
    renderComposer();
  }
  // ---------- Umfrage ----------
  function attachPoll() { st.attach = { kind: 'poll', data: { q: '', opts: ['', ''], dur: st.pollDur } }; renderComposer(); setTimeout(() => { const q = root.querySelector('[data-f="pq"]'); if (q) q.focus(); }, 30); }

  // ---------- Craft-Upgrade: Teil wählen + was genau verbessert wurde ----------
  const CAT_LABEL = { helm: 'Helm', chest: 'Brust', weapon: 'Waffe', gloves: 'Handschuhe', legs: 'Beine', boots: 'Stiefel', accessory: 'Accessoire' };
  const ROMAN = R.ROMAN || ['I', 'II', 'III', 'IV', 'V'];
  const REFT = R.REFTYPES || {};
  // alle Showcase-Sets mit Ausrüstung (für Filter „Alle / Set 1 / Set 2 …“ und „Ganzes Set posten“)
  const gearSets = () => {
    const out = [];
    (R.showcaseList ? R.showcaseList() : []).forEach((sc) => (sc.sets || []).forEach((set, i) => {
      if (!Object.values(set.gear || {}).some((g) => g && (g.item || g.name))) return;
      out.push({ key: String(set.id || (sc.id + '_' + i)), name: String(set.name || '').trim() || `Set ${out.length + 1}`, from: sc.title || '', set });
    }));
    return out;
  };
  const ownGear = (only) => {
    const out = [], seen = new Set();
    const sets = only && only !== 'all' ? gearSets().filter((x) => x.key === only).map((x) => x.set) : (R.showcaseList ? R.showcaseList() : []).flatMap((sc) => sc.sets || []);
    sets.forEach((set) => Object.entries(set.gear || {}).forEach(([slot, g]) => {
      if (!g || !(g.item || g.name)) return;
      const it = R.gItem ? R.gItem(g.item) : null, key = g.item || g.name; if (seen.has(key)) return; seen.add(key);
      const sl = (R.GEAR_SLOTS || []).find((s) => s.k === slot);
      out.push({ item: g.item || '', name: g.name || it?.name || '?', icon: g.icon || it?.icon || '', rarity: g.rarity || it?.rarity || 'legendary',
        slot: sl ? sl.label : slot, tier: +g.tier || 0, refType: g.refType || '' });
    }));
    return out;
  };
  // Armament (Rüstung) eines Sets posten
  function pickArmament(key) {
    const x = (R.armamentList ? R.armamentList() : []).find((y) => y.key === key); if (!x || !st.attach) return;
    st.attach.data = { mode: 'arm', name: x.name, arm: x.arm, note: '', crafted: false }; renderComposer();
  }
  // ganzes Set als Gear-Upgrade posten
  function pickWholeSet(key) {
    const x = gearSets().find((y) => y.key === key); if (!x || !st.attach) return;
    const gear = {}; Object.entries(x.set.gear || {}).forEach(([k, g]) => { if (g && (g.item || g.name)) { const it = R.gItem ? R.gItem(g.item) : null;
      gear[k] = { item: g.item || '', name: g.name || it?.name || '', icon: g.icon || it?.icon || '', rarity: g.rarity || it?.rarity || 'legendary', tier: +g.tier || 0, refine: +g.refine || 0, refType: g.refType || '' }; } });
    st.attach.data = { mode: 'set', name: x.name, set: x.name, gear, gfx: x.set.gfx || null, cmd: (x.set.cmd || []).filter((c) => c && c.id).slice(0, 2).map((c) => ({ id: c.id, exp: !!c.exp })), crafted: false, note: '' };
    renderComposer();
  }
  const gearSearch = (q) => {
    const cat = R.gearCat || [], t = q.trim().toLowerCase();
    if (!t) return [];
    return cat.filter((i) => i.name && ['legendary', 'epic'].includes(i.rarity) && i.name.toLowerCase().includes(t)).slice(0, 16)
      .map((i) => ({ item: i.id, name: i.name, icon: i.icon || '', rarity: i.rarity, slot: CAT_LABEL[i.cat] || i.cat || '', tier: 0, refType: '' }));
  };
  function attachCraft() {
    if (R.gearDbState === 'idle' && R.loadGearDb) R.loadGearDb();
    st.attach = { kind: 'craft', data: { item: '', name: '', icon: '', rarity: 'legendary', slot: '', crafted: false, ic: null, exp: false, refType: '', note: '' } };
    st.gq = ''; st.gset = 'all'; st.gmode = 'gear'; renderComposer();
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
    { const p7 = out.find((x) => x.id === 'p7');   // Altäre nach Pass 7 braucht niemand → weglassen
      if (p7 && p7.ts) for (let i = out.length - 1; i >= 0; i--) if (out[i].id[0] === 'a' && out[i].ts && out[i].ts >= p7.ts) out.splice(i, 1); }
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
  const armTile = (d) => { let h = ''; try { h = R.armamentHTML ? R.armamentHTML(d.arm, 13) : ''; } catch { h = ''; }
    return `<div class="fx-forge rounded-xl border border-orange-400/40 bg-gradient-to-br from-orange-950/40 via-ink-950/80 to-ink-950 p-3 flex flex-col gap-2.5">
      <div class="flex items-center justify-between gap-2"><span class="text-[10px] uppercase tracking-widest text-orange-300">🛡️ ${d.crafted ? 'Neues Armament' : 'Mein Armament'}</span><span class="font-display text-base text-slate-100 truncate">${esc(d.name || '')}</span></div>
      <div class="flex justify-center py-1 overflow-x-auto">${h || '<span class="text-xs text-slate-500 py-4">Armament kann nicht angezeigt werden.</span>'}</div>
      ${d.note ? `<div class="text-sm text-slate-200">📝 ${esc(d.note)}</div>` : ''}</div>`; };
  const craftSetTile = (d) => {
    const n = Object.keys(d.gear || {}).length, cmds = (d.cmd || []).map((c) => R.cmdImg ? `<img src="${esc(R.cmdImg(c.id, c.exp))}" alt="" loading="lazy" class="w-9 h-9 rounded-full object-cover border border-gold-400/60 bg-ink-900">` : '').join('');
    let board = ''; try { board = R.gearBoardHTML ? R.gearBoardHTML(d.gear || {}, d.gfx) : ''; } catch { board = ''; }
    return `<div class="fx-forge rounded-xl border border-orange-400/40 bg-gradient-to-br from-orange-950/40 via-ink-950/80 to-ink-950 p-3 flex flex-col sm:flex-row items-center gap-4">
      <div class="relative w-[140px] sm:w-[150px] aspect-[1/2] shrink-0">${board || Object.values(d.gear || {}).map((g) => g.icon ? `<img src="${esc(g.icon)}" alt="" class="inline-block w-1/2 aspect-square object-contain">` : '').join('')}</div>
      <div class="min-w-0 flex-1 self-stretch flex flex-col justify-center gap-1.5">
        <div class="text-[10px] uppercase tracking-widest text-orange-300">⚒️ ${d.crafted ? 'Neues Set gecraftet' : 'Mein Set'}</div>
        <div class="font-display text-xl text-slate-100 break-words">${esc(d.name || 'Set')}</div>
        ${cmds ? `<div class="flex -space-x-2">${cmds}</div>` : ''}
        <div class="text-xs text-slate-400">${n} Teil${n === 1 ? '' : 'e'}${Object.values(d.gear || {}).some((g) => g.refine >= 100) ? ` · ${Object.values(d.gear || {}).filter((g) => g.refine >= 100).length}× Expertise` : ''}</div>
        ${d.note ? `<div class="text-sm text-slate-200">📝 ${esc(d.note)}</div>` : ''}
      </div></div>`;
  };
  const craftTile = (g) => {
    const lines = [];
    if (g.crafted) lines.push(['🆕', 'Neu gecraftet']);
    if (Array.isArray(g.ic)) lines.push(['🏅', `Iconic ${g.ic[0] > 0 ? ROMAN[g.ic[0] - 1] : '–'} → <b class="text-gold-200">${ROMAN[g.ic[1] - 1] || '?'}</b>`]);
    if (g.exp) lines.push(['✦', `Expertise freigeschaltet${g.refType && REFT[g.refType] ? ` · ${esc(REFT[g.refType].label)}` : ''}`]);
    if (g.note) lines.push(['📝', esc(g.note)]);
    const old = !lines.length && (g.tier || g.refine || g.set)   // ältere Beiträge (nur Stand)
      ? `<div class="text-xs text-slate-400">${g.tier ? `Iconic ${ROMAN[g.tier - 1]}` : ''}${g.refine ? ' · Refine fertig' : ''}${g.set ? ` · ${esc(g.set)}` : ''}</div>` : '';
    return `<div class="fx-forge flex items-start gap-3 rounded-xl border border-orange-400/40 bg-gradient-to-br from-orange-950/40 via-ink-950/80 to-ink-950 p-3">
      ${icoBox(g.icon, 'w-14 h-14 shrink-0', '⚒️')}
      <div class="min-w-0 flex-1"><div class="text-[10px] uppercase tracking-widest text-slate-500">⚒️ Gear-Upgrade${g.slot ? ` · ${esc(g.slot)}` : ''}</div>
        <div class="font-semibold ${rarCol[g.rarity] || 'text-slate-100'} truncate">${esc(g.name || '?')}</div>
        ${lines.length ? `<ul class="mt-1 space-y-0.5 text-sm text-slate-200">${lines.map(([i, t]) => `<li class="flex gap-1.5"><span class="w-5 shrink-0 text-center">${i}</span><span class="min-w-0 break-words">${t}</span></li>`).join('')}</ul>` : old}
      </div></div>`;
  };
  // Showcase-Karte: Hintergrund + Sets als Rauten wie im Showcase
  const SC_BG = { none: 'radial-gradient(120% 90% at 50% 0%, rgba(245,197,66,.16), transparent 60%), linear-gradient(180deg,#111725,#07090f)',
    gold: 'radial-gradient(120% 85% at 50% 0%, rgba(245,197,66,.42), transparent 62%), linear-gradient(180deg,#3a2706,#0c1019)',
    night: 'radial-gradient(110% 80% at 50% 0%, rgba(56,189,248,.32), transparent 60%), linear-gradient(180deg,#0b1d3a,#07090f)',
    blood: 'radial-gradient(110% 80% at 50% 0%, rgba(239,68,68,.40), transparent 60%), linear-gradient(180deg,#330c0c,#07090f)',
    forest: 'radial-gradient(110% 80% at 50% 0%, rgba(74,222,128,.30), transparent 60%), linear-gradient(180deg,#0c2a17,#07090f)',
    royal: 'radial-gradient(110% 80% at 50% 0%, rgba(192,132,252,.38), transparent 60%), linear-gradient(180deg,#26103d,#07090f)',
    desert: 'radial-gradient(120% 85% at 50% 0%, rgba(251,191,36,.30), transparent 60%), linear-gradient(180deg,#5a3a17,#1a1208)' };
  const scBgCss = (b) => { b = b || {};
    if (b.type === 'img' && scImgUrl(b.src)) return `url("${scImgUrl(b.src).replace(/"/g, '')}") center/cover no-repeat, #07090f`;
    if (b.type === 'lib' && /^[A-Za-z0-9() _.-]{1,80}\.(webp|png|jpe?g)$/i.test(b.id || '')) return `url("/icons/showcase%20pictures/${encodeURIComponent(b.id)}") center/cover no-repeat, #07090f`;
    return SC_BG[b.id] || SC_BG.none; };
  const scSetCol = (x) => {
    const cmds = (x.cmd || []).filter((c) => c && c.id).map((c) => { const m = (R.COMMANDERS || []).find((k) => k.id === c.id);
      return R.cmdImg ? `<img src="${esc(R.cmdImg(c.id, c.exp))}" alt="" title="${esc(m ? m.name : c.id)}" loading="lazy" class="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-gold-400/60 bg-ink-900 shadow">` : ''; }).join('');
    let board = '';
    if (x.shot) board = `<img src="${esc(x.shot)}" alt="" loading="lazy" class="w-full rounded-lg border border-ink-700 object-contain">`;
    else { try { board = R.gearBoardHTML ? R.gearBoardHTML(x.gear || {}, x.gfx) : ''; } catch { board = ''; }
      board = `<div class="relative w-full aspect-[1/2]">${board || Object.values(x.gear || {}).map((g) => g.icon ? `<img src="${esc(g.icon)}" alt="" class="inline-block w-1/2 aspect-square object-contain">` : '').join('')}</div>`; }
    return `<div class="flex flex-col items-center gap-1 w-[104px] sm:w-[120px] min-w-0">
      ${cmds ? `<div class="flex -space-x-2">${cmds}</div>` : ''}
      <div class="max-w-full truncate text-[11px] font-semibold text-slate-100 [text-shadow:0_1px_2px_#000]" translate="no">${esc(x.name || '')}</div>${board}</div>`;
  };
  const showcaseCard = (d, isSet) => { const gic = isSet ? [...new Set((d.sets || []).flatMap((x) => Object.values(x.gear || {}).map((g) => g.icon)).filter((u) => /\.(png|webp|jpe?g)$/i.test(u || '')))] : [];
    return `<div class="relative overflow-hidden rounded-xl border border-gold-500/35" style="background:${isSet ? "#120d08 url('/icons/feed/set-vault.webp') center / cover no-repeat" : scBgCss(d.bg)}">
      <div class="absolute inset-0 bg-gradient-to-b from-ink-950/35 via-ink-950/5 to-ink-950/70 pointer-events-none"></div>
      ${gic.length ? resLayer(gic, 14) : ''}
      <div class="fx-body p-3 ${gic.length ? 'pb-10' : ''} flex flex-col gap-2.5">
        <div class="flex items-center justify-between gap-2"><span class="text-[10px] uppercase tracking-widest text-gold-300">${isSet ? `⚔️ ${(d.sets || []).length === 1 ? 'Mein Set' : `Meine ${(d.sets || []).length} Sets`}` : `🎨 Showcase · ${(d.sets || []).length} Set${(d.sets || []).length === 1 ? '' : 's'}`}</span><span class="font-display text-base gold-text truncate">${esc(d.title || '')}</span></div>
        <div class="flex flex-wrap justify-center gap-x-3 gap-y-4">${(d.sets || []).map(scSetCol).join('') || '<span class="text-xs text-slate-400 py-4">Keine Sets ausgewählt</span>'}</div>
      </div></div>`; };
  // KvK-Ergebnis (Zahlen)
  const kvkResTile = (d) => { const cells = [statCell('⚔️', 'Kill-Punkte', d.kp ? '+' + short(d.kp) : '–', d.kp ? fmt(d.kp) : ''), statCell('🏅', 'Verdienst', d.acclaim ? '+' + short(d.acclaim) : '–', d.acclaim ? fmt(d.acclaim) : '')];
    if (d.deads) cells.push(statCell('💀', 'Deads', short(d.deads), fmt(d.deads)));
    if (d.honor) cells.push(statCell('🎖️', 'Ehre', short(d.honor), fmt(d.honor)));
    if (d.crystal) cells.push(statCell('💠', 'Kristalle', short(d.crystal), fmt(d.crystal)));
    return `<div class="relative overflow-hidden rounded-xl border border-red-400/35 bg-gradient-to-br from-red-950/50 via-ink-950 to-ink-950 p-3">${d.kp ? skullLayer(9) : ''}<div class="fx-body">
      <div class="flex items-center justify-between gap-2"><span class="text-[10px] uppercase tracking-widest text-red-300">🏁 KvK-Ergebnis</span><span class="font-display text-sm text-slate-100">${esc(d.label || 'KvK')}</span></div>
      <div class="grid grid-cols-2 ${cells.length > 2 ? 'sm:grid-cols-' + Math.min(5, cells.length) : ''} gap-1.5 mt-2">${cells.join('')}</div></div></div>`; };
  // AoO-Match
  const aooMatchTile = (d) => { const win = d.res === 'win';
    return `<div class="relative overflow-hidden rounded-xl border ${win ? 'border-gold-400/50' : 'border-red-400/40'} p-4" style="background:${win ? 'linear-gradient(135deg,#0b2a4a,#0c1019 55%,#3a2706)' : 'linear-gradient(135deg,#2a0b10,#0c1019 60%)'}">
      ${win ? goldLayer(8) : ''}
      <div class="fx-body flex items-start justify-between gap-3">
        <div class="min-w-0"><div class="text-[10px] uppercase tracking-[.25em] text-sky-300">🏛️ Ark of Osiris${d.date ? ` · ${esc(new Date(d.date + 'T12:00:00').toLocaleDateString('de-DE'))}` : ''}</div>
          <div class="font-display text-2xl ${win ? 'gold-text' : 'text-red-300'}">${win ? '🏆 Sieg' : '⚔️ Niederlage'}</div>
          ${d.vs ? `<div class="text-sm text-slate-300 truncate">gegen <b class="text-slate-100" translate="no">${esc(d.vs)}</b></div>` : ''}</div>
        ${d.us !== '' || d.them !== '' ? `<div class="text-right shrink-0"><div class="text-[10px] uppercase tracking-widest text-slate-400">Punkte</div><div class="font-display text-xl tabular-nums text-slate-100">${esc(short(num(d.us)))} <span class="text-slate-500">:</span> ${esc(short(num(d.them)))}</div></div>` : ''}
      </div>
      ${d.mvp || d.role ? `<div class="fx-body mt-2 flex flex-wrap gap-1.5 text-xs">${d.mvp ? '<span class="px-2 py-0.5 rounded-full bg-gold-500/20 border border-gold-400/60 text-gold-200 font-semibold">⭐ MVP</span>' : ''}${d.role ? `<span class="px-2 py-0.5 rounded-full bg-ink-950/60 border border-sky-400/40 text-sky-200">🎯 ${esc(d.role)}</span>` : ''}</div>` : ''}
    </div>`; };
  // Umfrage im RoK-Stil: erst Buttons, nach der Stimme animierte Prozentbalken
  const pollTile = (p, preview) => {
    const d = p.data || {}, opts = d.opts || [], votes = preview ? [] : st.votes[p.id] || [], mine = preview ? null : myVote(p.id);
    const ends = preview ? (d.dur ? Date.now() + d.dur * 3600e3 : null) : pollEnds(p), over = !preview && pollOver(p), changing = !over && st.pollChange.has(p.id);
    const cnt = opts.map((_, i) => votes.filter((v) => +v.opt === i).length);
    if (mine != null && !votes.some((v) => v.user_id === me())) cnt[mine] = (cnt[mine] || 0) + 1;   // nur lokal gespeicherte Stimme mitzählen
    const total = cnt.reduce((a, b) => a + b, 0), showRes = (mine != null || over) && !changing, max = Math.max(...cnt, 0);
    const anim = showRes && (st.pollAnim.has(p.id) || !st.pollSeen.has(p.id)); if (showRes && !preview) { st.pollSeen.add(p.id); st.pollAnim.delete(p.id); }
    const L = 'ABCD';
    const rows = opts.map((o, i) => { const pct = total ? Math.round(cnt[i] / total * 100) : 0, me1 = mine === i, top = showRes && cnt[i] === max && max > 0;
      if (!showRes) return `<button type="button" ${preview ? 'disabled' : `data-poll="${esc(p.id)}|${i}"`} class="fx-pollopt w-full flex items-center gap-3 rounded-lg border ${me1 ? 'border-gold-400 bg-gold-500/10' : 'border-gold-500/30 bg-ink-950/70'} hover:border-gold-400 hover:bg-gold-500/10 px-3 py-2 text-left disabled:cursor-default">
          <span class="w-6 h-6 shrink-0 rounded-md grid place-items-center text-[11px] font-extrabold ${me1 ? 'bg-gold-500 text-ink-950' : 'bg-gold-500/15 border border-gold-500/50 text-gold-200'}">${me1 ? '✓' : L[i]}</span><span class="text-sm text-slate-100 min-w-0 break-words">${esc(o)}</span>${me1 ? '<span class="ml-auto text-[10px] text-gold-300 whitespace-nowrap">deine Stimme</span>' : ''}</button>`;
      return `<div class="relative overflow-hidden rounded-lg border ${me1 ? 'border-gold-400' : 'border-ink-600'} bg-ink-950/70 px-3 py-2">
          <div class="fx-bar absolute inset-y-0 left-0 overflow-hidden ${top ? 'bg-gradient-to-r from-gold-600/55 to-gold-400/35' : 'bg-gradient-to-r from-slate-500/30 to-slate-400/15'}" style="width:${anim ? 0 : pct}%"${anim ? ` data-bar-w="${pct}"` : ''}>${top ? '<span class="fx-barshine"></span>' : ''}</div>
          <div class="relative flex items-center gap-3"><span class="w-6 h-6 shrink-0 rounded-md grid place-items-center text-[11px] font-extrabold ${me1 ? 'bg-gold-500 text-ink-950' : over && top ? 'bg-gold-500/30 text-gold-100 border border-gold-400' : 'bg-ink-800 text-slate-300 border border-ink-600'}">${me1 ? '✓' : over && top ? '👑' : L[i]}</span>
            <span class="text-sm text-slate-100 min-w-0 flex-1 break-words">${esc(o)}</span><span class="text-[11px] text-slate-400 tabular-nums whitespace-nowrap">${cnt[i]} Stimme${cnt[i] === 1 ? '' : 'n'}</span><span class="w-12 text-right font-bold tabular-nums whitespace-nowrap ${top ? 'text-gold-200' : 'text-slate-200'}">${pct} %</span></div></div>`; }).join('');
    return `<div class="relative overflow-hidden rounded-xl border border-gold-500/40 p-3.5 flex flex-col gap-2.5" style="background:radial-gradient(120% 80% at 50% 0%, rgba(245,197,66,.14), transparent 60%), linear-gradient(180deg,#161e2f,#0c1019)">
      <div class="flex items-center justify-between gap-2"><span class="text-[10px] uppercase tracking-[.25em] ${over ? 'text-emerald-300' : 'text-gold-300'}">${over ? '🏁 Umfrage beendet' : '📊 Allianz-Umfrage'}</span>
        <span class="text-[11px] text-slate-500 tabular-nums text-right">${preview ? 'Vorschau' : `${total} Stimme${total === 1 ? '' : 'n'}`}${ends ? `<span class="block ${over ? 'text-emerald-400/80' : 'text-gold-300/80'}" data-poll-left="${esc(p.id)}">${over ? 'Ergebnis steht fest' : `⏳ noch ${leftTxt(ends - Date.now())}`}</span>` : ''}</span></div>
      <div class="font-display text-lg text-slate-100 leading-snug break-words">${esc(d.q || 'Frage …')}</div>
      <div class="flex flex-col gap-1.5">${rows}</div>
      ${over ? `<div class="text-[11px] text-slate-400">${total ? `🏆 Gewonnen: <b class="text-gold-200">${esc(opts[cnt.indexOf(max)] || '')}</b>` : 'Niemand hat abgestimmt.'}${mine != null ? ` · deine Stimme: ${esc(opts[mine] || '')}` : ''}</div>`
        : changing ? `<div class="flex items-center justify-between gap-2 text-[11px] text-slate-400"><span>Neue Antwort antippen</span><button type="button" data-poll-keep="${esc(p.id)}" class="text-slate-400 hover:text-slate-200">Abbrechen</button></div>`
        : showRes ? `<div class="flex items-center justify-between gap-2 text-[11px] text-slate-500"><span>✓ Du hast abgestimmt</span><button type="button" data-poll-change="${esc(p.id)}" class="px-2.5 py-1 rounded-lg border border-gold-500/40 text-gold-300 hover:bg-gold-500/10">↺ Stimme ändern</button></div>`
        : preview ? '' : '<div class="text-[11px] text-slate-500">Tippe auf eine Antwort – du kannst sie später noch ändern.</div>'}</div>`;
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
  const passTile = (d) => `<div class="fx-pass relative overflow-hidden rounded-xl border border-orange-400/40 bg-gradient-to-br from-amber-950/50 to-ink-950 p-4">${emberLayer(16)}<div class="fx-body flex items-center gap-4">
      <span class="w-14 h-14 shrink-0 rounded-xl grid place-items-center bg-gold-500/15 border border-gold-500/40 text-2xl">🚪</span>
      <div class="min-w-0"><div class="text-[10px] uppercase tracking-widest text-gold-300">Mein Pass startet</div>
        <div class="font-display text-xl text-slate-100">Pass ${esc(String(d.n || '?'))}</div>
        ${d.ts ? `<div class="text-sm text-slate-300">${esc(dateTxt(d.ts))} Uhr <span class="text-slate-500">(deine Zeit)</span></div>
        <div class="text-sm font-semibold text-gold-200" data-cd="${+d.ts}">${cdText(+d.ts)}</div>` : ''}</div></div></div>`;
  const statCell = (ico, lab, val, sub) => `<div class="rounded-lg bg-ink-900/70 border border-ink-700 px-2.5 py-1.5 min-w-0"><div class="text-[10px] text-slate-500 truncate">${ico} ${lab}</div><div class="font-semibold text-slate-100 tabular-nums">${val}</div>${sub ? `<div class="text-[10px] text-slate-500 truncate">${sub}</div>` : ''}</div>`;
  // echte Spiel-Icons (icons/ressourcen + icons/sonstiges)
  const RES_IMG = { food: ['/icons/ressourcen/corn.png', '/icons/ressourcen/cornmore.png'], wood: ['/icons/ressourcen/wood.png', '/icons/ressourcen/woodmore.png'], stone: ['/icons/ressourcen/stone.png', '/icons/ressourcen/stonemore.png'], gold: ['/icons/ressourcen/gold.png', '/icons/ressourcen/goldMore.png'] };
  const SPD_IMG = { universal: '/icons/sonstiges/SpeedUniversal.png', training: '/icons/sonstiges/SpeedTraining.png', healing: '/icons/sonstiges/SpeedHealing.png', research: '/icons/sonstiges/SpeedResearch.png', building: '/icons/sonstiges/SpeedBuilding.png' };
  const AP_IMG = '/icons/ressourcen/ap.png';
  const icoImg = (src, fb) => `<img src="${esc(src)}" alt="" class="inline-block -mt-0.5 object-contain align-middle" style="width:16px;height:16px" onerror="this.replaceWith(document.createTextNode('${fb}'))">`;
  const stockTile = (d) => {
    const sec = (t, sub, body) => `<div><div class="flex items-baseline justify-between gap-2 mb-1.5"><span class="text-[11px] uppercase tracking-widest text-slate-400">${t}</span>${sub ? `<span class="text-[10px] text-slate-500">${sub}</span>` : ''}</div>${body}</div>`;
    const grid = (cells) => `<div class="grid grid-cols-2 ${cells.length >= 4 ? 'sm:grid-cols-' + Math.min(5, cells.length) : 'sm:grid-cols-4'} gap-1.5">${cells.join('')}</div>`;
    const parts = [];
    if (d.res) {
      const ks = RES_K.filter(([k]) => d.res[k] != null), tot = ks.reduce((a, [k]) => a + (+d.res[k] || 0), 0);
      parts.push(sec('🌾 Ressourcen', `${d.res.bag ? 'inkl. Rucksack' : 'ohne Rucksack'}${ks.length > 1 ? ` · Σ ${short(tot)}` : ''}`,
        grid(ks.map(([k, i, l]) => statCell(icoImg(RES_IMG[k][0], i), l, short(d.res[k]))))));
    }
    if (d.speed) {
      const ks = SPD_K.filter(([k]) => d.speed[k] != null), tot = ks.reduce((a, [k]) => a + (+d.speed[k] || 0), 0);
      const cells = [...(d.speed.uh != null ? [statCell(icoImg(SPD_IMG.universal, '⏱️') + icoImg(SPD_IMG.healing, '❤️'), 'Uni + Heilung', days(d.speed.uh) + ' T')] : []), ...ks.map(([k, i, l]) => statCell(icoImg(SPD_IMG[k], i), l, days(d.speed[k]) + ' T'))];
      parts.push(sec('⏱️ Speedups', ks.length > 1 ? `Σ ${days(tot)} Tage` : '', grid(cells)));
    }
    if (d.ap) parts.push(sec('🧪 AP', '', grid([statCell(icoImg(AP_IMG, '🧪'), 'AP gesamt', fmt(d.ap.total))])));
    const ts = Math.max(0, ...[d.res, d.speed, d.ap].filter(Boolean).map((x) => +x.ts || 0));
    const icons = [...(d.res ? RES_K.filter(([k]) => d.res[k] != null).flatMap(([k]) => RES_IMG[k]) : []),
      ...(d.speed ? [...SPD_K.filter(([k]) => d.speed[k] != null).map(([k]) => SPD_IMG[k]), ...(d.speed.uh != null ? [SPD_IMG.universal, SPD_IMG.healing] : [])] : []),
      ...(d.ap ? [AP_IMG, AP_IMG] : [])];
    return `<div class="fx-stock relative overflow-hidden rounded-xl border border-emerald-400/30 p-3 pb-12" style="background:#0b1d2a url('/icons/feed/landscape-waterfall.webp') center 40% / cover no-repeat">
      <div class="absolute inset-0 pointer-events-none" style="background:linear-gradient(180deg,rgba(7,9,15,.55),rgba(7,9,15,.35) 45%,rgba(7,9,15,.75))"></div>${resLayer(icons, 26)}<div class="fx-body flex flex-col gap-3">
      <div class="flex items-baseline justify-between gap-2"><span class="text-[10px] uppercase tracking-widest text-emerald-300 inline-flex items-center gap-1"><img src="/icons/ressourcen/corn.png" alt="" style="width:14px;height:14px" class="object-contain"> Meine Rss</span>${ts ? `<span class="text-[10px] text-slate-500">Scan vom ${esc(R.dateLabel ? R.dateLabel(ts) : new Date(ts).toLocaleDateString('de-DE'))}</span>` : ''}</div>
      ${parts.join('') || '<p class="text-sm text-slate-500">nichts ausgewählt</p>'}</div></div>`;
  };
  const vipTile = (d) => {
    const lv = +d.lv || 0, isNew = d.mode === 'new';
    const head = `<div class="flex items-center gap-4">
        <span class="w-14 h-14 shrink-0 rounded-xl grid place-items-center bg-gold-500/15 border border-gold-500/40 text-2xl">👑</span>
        <div class="min-w-0"><div class="text-[10px] uppercase tracking-widest text-gold-300">${isNew ? '🎉 Neue VIP-Stufe erreicht' : 'Mein VIP-Status'}</div>
          <div class="font-display text-2xl text-slate-100">${esc(vipName(lv))}</div>
          ${!isNew && d.pts != null ? `<div class="text-xs text-slate-400 tabular-nums">${fmt(d.pts)} VIP-Punkte inkl. Rucksack</div>` : ''}</div></div>`;
    if (isNew) return `<div class="fx-vip relative overflow-hidden rounded-xl border border-gold-400/60 bg-gradient-to-br from-amber-950/60 via-ink-950 to-amber-950/30 p-4 shadow-[inset_0_0_24px_rgba(245,197,66,.12)]">${goldLayer(14)}<div class="fx-body">${head}</div></div>`;
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
      <div class="text-[10px] uppercase tracking-widest text-rose-300">🆘 Help Me – was soll ich verbessern?</div>
      <div class="font-semibold text-slate-100">${esc(d.title || '')}</div>
      ${(d.icons || []).length ? `<div class="flex flex-wrap gap-1">${d.icons.map((g) => g.icon ? `<img src="${esc(g.icon)}" alt="" class="w-9 h-9 rounded bg-ink-900 object-contain">` : '<span class="w-9 h-9 rounded bg-ink-900 grid place-items-center text-sm">⚒️</span>').join('')}</div>` : ''}
      <div class="flex flex-wrap items-end justify-between gap-2"><span class="text-xs text-slate-400">${+d.sets || 0} Set${+d.sets === 1 ? '' : 's'} · ${+d.items || 0} Teile</span>
        <div class="flex flex-col items-center">${helperSvg}
          <button type="button" data-feed-help="${esc(d.rid || '')}" class="text-xs px-3 py-1.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-ink-950 font-semibold">Zum Help-Me-Beitrag →</button></div></div></div>`;
  // kleiner Krieger mit wehender Fahne (über dem Help-Me-Button)
  const helperSvg = `<svg viewBox="0 0 44 46" class="fx-helper w-[76px] h-[80px] -mb-1" aria-hidden="true">
      <ellipse cx="17" cy="44" rx="9" ry="1.6" fill="rgba(0,0,0,.45)"/>
      <path d="M17 32 L12.5 43" stroke="#64748b" stroke-width="2.6" stroke-linecap="round"/><path d="M17 32 L21 43" stroke="#64748b" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M17 21 L17 32" stroke="#b7830f" stroke-width="6.5" stroke-linecap="round"/><path d="M14.2 25 h5.6" stroke="#fde68a" stroke-width="1.2"/>
      <path d="M16.5 23 L10.5 28.5" stroke="#f5d0a9" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="29" y1="4" x2="29" y2="43" stroke="#cbd5e1" stroke-width="1.6" stroke-linecap="round"/><circle cx="29" cy="3.6" r="1.4" fill="#f5c542"/>
      <g class="fx-arm"><path d="M17.5 23 L28.4 19" stroke="#f5d0a9" stroke-width="2.2" stroke-linecap="round"/></g>
      <path class="fx-flag" d="M29.8 5 Q34.5 3.2 38.5 5.2 Q42 7 43 6 L43 14.5 Q41.5 15.6 38.5 13.8 Q34.5 11.8 29.8 13.6 Z" fill="#f43f5e" stroke="#be123c" stroke-width=".6"/>
      <text x="36.4" y="11.8" text-anchor="middle" font-size="5.2" font-weight="800" fill="#fff" font-family="Inter,system-ui,sans-serif" class="fx-flag">SOS</text>
      <circle cx="17" cy="16.2" r="4.4" fill="#f5d0a9"/><path d="M12.4 15.8 Q12.6 10.6 17 10.4 Q21.4 10.6 21.6 15.8 Z" fill="#e0a91b" stroke="#8f5a03" stroke-width=".6"/><path d="M17 10.2 L17 7.6" stroke="#f43f5e" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="15.6" cy="17" r=".55" fill="#1e293b"/><circle cx="18.4" cy="17" r=".55" fill="#1e293b"/>
    </svg>`;
  const kvkptsTile = (d) => `<div class="relative overflow-hidden rounded-xl border border-red-400/30 bg-gradient-to-br from-red-950/40 to-ink-950 p-3">${skullLayer(9)}<div class="fx-body">
      <div class="text-[10px] uppercase tracking-widest text-red-300">⚔️ ${esc(d.label || 'KvK')}</div>
      <div class="grid grid-cols-2 ${d.deads ? 'sm:grid-cols-3' : ''} gap-1.5 mt-2">
        ${statCell('⚔️', 'Kill-Punkte', d.kp ? '+' + short(d.kp) : '–', d.kp ? fmt(d.kp) : '')}
        ${statCell('🏅', 'Verdienst', d.acclaim ? '+' + short(d.acclaim) : '–', d.acclaim ? fmt(d.acclaim) : '')}
        ${d.deads ? statCell('💀', 'Deads', short(d.deads), fmt(d.deads)) : ''}
      </div></div></div>`;
  const imgHTML = (src) => `<a href="${esc(src)}" target="_blank" rel="noopener" class="block"><img src="${esc(src)}" alt="" loading="lazy" class="w-full max-h-[34rem] object-contain rounded-xl border border-ink-700 bg-ink-950"></a>`;
  const attachHTML = (p) => {
    const d = p.data;
    if (p.kind === 'craft' && d) return d.mode === 'set' ? craftSetTile(d) : d.mode === 'arm' ? armTile(d) : craftTile(d);
    if (p.kind === 'aoo' && d && d.mode !== 'match') return R.aooCardHTML ? R.aooCardHTML(d) : aooTile(d);
    if (p.kind === 'pass' && d) return passTile(d);
    if (p.kind === 'stock' && d) return stockTile(d);
    if (p.kind === 'kvkpts' && d) return kvkptsTile(d);
    if (p.kind === 'vip' && d) return vipTile(d);
    if (p.kind === 'kvkmap' && d) return mapTile(d, p.id);
    if (p.kind === 'help' && d) return helpTile(d);
    if (p.kind === 'poll' && d) return pollTile(p);
    if (p.kind === 'showcase' && d && d.entry) return showcaseStage(d);
    if ((p.kind === 'set' || p.kind === 'showcase') && d && Array.isArray(d.sets)) return showcaseCard(d, p.kind === 'set');
    if (p.kind === 'kvk' && d && d.mode === 'stats') return kvkResTile(d);
    if (p.kind === 'aoo' && d && d.mode === 'match') return aooMatchTile(d);
    if (p.image) return imgHTML(p.image);
    if (p.kind !== 'text') return `<div class="text-xs text-slate-500">(${esc(KIND[p.kind]?.[1] || p.kind)} ohne Bild)</div>`;
    return '';
  };
  const previewHTML = (a) => {
    if (!a) return '';
    if (a.kind === 'craft') return a.data.mode === 'set' ? craftSetTile(a.data) : a.data.mode === 'arm' ? armTile(a.data) : craftTile(a.data);
    if (a.kind === 'poll') return pollTile({ id: '__prev', data: a.data }, true);
    if (a.kind === 'set') return showcaseCard(a.data, true);
    if (a.kind === 'showcase' && a.data && a.data.entry) return showcaseStage(a.data);
    if (a.kind === 'kvk' && a.data && a.data.mode === 'stats') return kvkResTile(a.data);
    if (a.kind === 'aoo') return a.data.mode === 'match' ? aooMatchTile(a.data) : R.aooCardHTML ? R.aooCardHTML(a.data) : aooTile(a.data);
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
      <button type="button" data-react="${esc(p.id)}|${e}" title="${lab}" aria-pressed="${mine && mine.emoji === e}" class="inline-flex items-center gap-1 px-2 py-1 rounded-full border text-sm transition-colors ${mine && mine.emoji === e ? 'border-gold-400 bg-gold-500/15 text-gold-200' : cnt[e] ? 'border-ink-600 bg-ink-900 text-slate-200 hover:border-gold-500/60' : 'border-ink-700 text-slate-500 hover:border-gold-500/60 hover:text-slate-200'}"><span class="inline-block">${e}</span>${cnt[e] ? `<span class="text-[11px] tabular-nums${st.reactBump === p.id + '|' + e ? ' fx-count' : ''}">${cnt[e]}</span>` : ''}</button>`).join('')}</div>`;
  };
  const commentsHTML = (p) => {
    const list = st.comments[p.id] || [], open = st.cmOpen.has(p.id), n = list.length;
    const one = (c) => { const u = st.users[c.user_id] || { username: '?' }, mine = c.user_id === me(), ed = st.edit && st.edit.kind === 'cm' && st.edit.id === c.id;
      const text = c.body && !(c.body === GIF_ONLY && c.image) ? `<p class="text-sm text-slate-100 whitespace-pre-wrap break-words">${richText(c.body, c.mentions)}</p>` : '';
      return `<div class="flex items-start gap-2 min-w-0 rounded-xl transition-shadow" data-cm="${esc(c.id)}">
        <button type="button" data-feed-prof="${esc(c.user_id)}" class="shrink-0">${R.avatarHtml ? R.avatarHtml(u.username, u.avatar, 'w-7 h-7 text-xs') : ''}</button>
        <div class="min-w-0 flex-1 rounded-xl bg-ink-900/80 border border-ink-700/70 px-3 py-1.5">
          <div class="flex items-baseline gap-2 text-[11px]"><b class="text-slate-200 truncate" translate="no">${esc(u.username || '?')}</b><span class="text-slate-500 shrink-0">${R.timeAgo(c.created_at)}${c.edited_at ? ' · bearbeitet' : ''}</span>
            <span class="ml-auto flex items-center gap-2">${mine && !ed ? `<button type="button" data-cm-edit="${esc(p.id)}|${esc(c.id)}" title="Kommentar bearbeiten" class="text-slate-500 hover:text-gold-300">✎</button>` : ''}
            ${mine || st.admin ? `<button type="button" data-cm-del="${esc(p.id)}|${esc(c.id)}" title="Kommentar löschen" class="text-slate-600 hover:text-red-300">✕</button>` : ''}</span></div>
          ${ed ? editBoxHTML(500, 2) : text}
          ${c.image ? `<a href="${esc(c.image)}" target="_blank" rel="noopener" class="block mt-1"><img src="${esc(c.image)}" alt="GIF" loading="lazy" class="max-h-56 max-w-full rounded-lg border border-ink-700 bg-ink-950"></a>` : ''}</div></div>`; };
    if (!open) {
      const last = list[n - 1];
      return `<div class="flex flex-col gap-2">
        ${last ? one(last) : ''}
        <button type="button" data-cm-toggle="${esc(p.id)}" class="self-start text-xs text-slate-400 hover:text-gold-300">💬 ${n > 1 ? `Alle ${n} Kommentare · antworten` : n ? 'Antworten' : 'Kommentieren'}</button></div>`;
    }
    return `<div class="flex flex-col gap-2">
      ${list.map(one).join('')}
      ${st.noCm ? '<p class="text-xs text-amber-300">⚠ Kommentare: Die Tabelle fehlt noch in Supabase (SQL im Chat ausführen).</p>' : `${st.cmGif[p.id] ? `<div class="relative self-start ml-9"><img src="${esc(st.cmGif[p.id].dataUrl)}" alt="GIF" class="max-h-32 rounded-lg border border-gold-500/40"><button type="button" data-cm-gifx="${esc(p.id)}" title="GIF entfernen" class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-ink-950 border border-red-500/60 text-red-300 text-xs grid place-items-center">✕</button></div>` : ''}
      <div class="flex items-center gap-2">
        <button type="button" data-cm-gif="${esc(p.id)}" title="GIF anhängen (nur GIFs)" class="shrink-0 h-8 px-2.5 rounded-full border text-[11px] font-extrabold tracking-wide ${st.cmGif[p.id] ? 'border-gold-400 text-gold-200 bg-gold-500/15' : 'border-ink-600 text-slate-400 hover:border-gold-500/60 hover:text-gold-300'}">GIF</button>
        <input type="text" maxlength="500" data-cm-in="${esc(p.id)}" data-mention value="${esc(st.cmDraft[p.id] || '')}" placeholder="Kommentar schreiben … (@ zum Markieren)" class="${INP} flex-1 min-w-0 !rounded-full !px-3.5">
        <button type="button" data-cm-send="${esc(p.id)}" ${st.cmBusy ? 'disabled' : ''} class="shrink-0 px-3.5 py-1.5 rounded-full bg-gold-500 hover:bg-gold-400 text-ink-950 text-xs font-semibold disabled:opacity-50">Senden</button></div>
      <div data-cm-msg="${esc(p.id)}" class="text-[11px] ${st.cmMsg[p.id] ? ({ ok: 'text-emerald-400', warn: 'text-amber-300', err: 'text-red-300', busy: 'text-slate-300' }[st.cmMsg[p.id][1]] || '') : ''}">${st.cmMsg[p.id] ? esc(st.cmMsg[p.id][0]) : ''}</div>`}
      <button type="button" data-cm-toggle="${esc(p.id)}" class="self-start text-[11px] text-slate-500 hover:text-slate-300">Einklappen</button></div>`;
  };
  const editBoxHTML = (max, rows) => `<div class="flex flex-col gap-1.5 mt-1">
      <textarea data-edit-in data-mention rows="${rows}" maxlength="${max}" class="w-full bg-ink-950 border border-gold-500/50 rounded-lg px-2.5 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-gold-400 resize-y">${esc(st.edit ? st.edit.text : '')}</textarea>
      <div class="flex flex-wrap items-center justify-end gap-2"><span data-edit-msg class="text-[11px] mr-auto text-slate-500">@ zum Markieren · Strg+Enter speichert</span>
        <button type="button" data-edit-cancel class="text-xs px-3 py-1 rounded-lg border border-ink-600 text-slate-400 hover:text-slate-200">Abbrechen</button>
        <button type="button" data-edit-save ${st.editBusy ? 'disabled' : ''} class="text-xs px-3 py-1 rounded-lg bg-gold-500 hover:bg-gold-400 text-ink-950 font-semibold disabled:opacity-50">💾 Speichern</button></div></div>`;
  const postHTML = (p) => {
    const u = st.users[p.user_id] || { username: '?' }, own = p.user_id === me(), k = KIND[p.kind] || KIND.text, ed = st.edit && st.edit.kind === 'post' && st.edit.id === p.id;
    return `<article class="panel rounded-2xl p-4 sm:p-5 flex flex-col gap-3" data-post="${esc(p.id)}">
      ${pollOver(p) ? `<div class="-mt-1 -mx-1 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-400/30 px-3 py-1.5 text-[11px] text-emerald-200"><span>🏁</span><span>Umfrage beendet ${R.timeAgo(new Date(pollEnds(p)).toISOString())} – das Ergebnis steht fest</span></div>` : ''}
      <div class="flex items-center gap-3">
        <button type="button" data-feed-prof="${esc(p.user_id)}" class="flex items-center gap-2.5 min-w-0 text-left rounded-lg hover:bg-ink-800/60 pr-2">${R.userLine(u, 'w-10 h-10 text-base')}</button>
        <span class="ml-auto shrink-0 text-[11px] text-slate-500 text-right"><span class="block">${k[0]} ${k[1]}</span>${R.timeAgo(p.created_at)}${p.edited_at ? ' · bearbeitet' : ''}</span>
        ${own && !ed ? `<button type="button" data-feed-edit="${esc(p.id)}" title="Text bearbeiten" class="shrink-0 w-8 h-8 rounded-lg border border-ink-700 text-slate-500 hover:border-gold-500/60 hover:text-gold-300">✎</button>` : ''}
        ${own || st.admin ? `<button type="button" data-feed-del="${esc(p.id)}" title="Löschen" class="shrink-0 w-8 h-8 rounded-lg border border-ink-700 text-slate-500 hover:border-red-400/60 hover:text-red-300">✕</button>` : ''}
      </div>
      ${ed ? editBoxHTML(1000, 3) : p.body ? `<p class="text-sm text-slate-100 whitespace-pre-wrap break-words">${richText(p.body, p.mentions)}</p>` : ''}
      ${attachHTML(p)}
      ${reactBar(p)}
      ${p.kind === 'help' ? '' : commentsHTML(p)}
    </article>`;
  };

  // ======================================================================
  // Formulare für die Anhänge (im Beitrag-Fenster)
  // ======================================================================
  const INP = 'bg-ink-950 border border-ink-600 rounded-lg px-2.5 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-gold-500';
  const segBtn = (attr, on, txt) => `<button type="button" ${attr} aria-pressed="${!!on}" class="seg-btn rounded-lg px-3 py-1.5 text-xs font-semibold border border-ink-600 transition">${txt}</button>`;
  const box = (title, body) => `<div class="rounded-xl border border-ink-700 bg-ink-950/60 p-3 flex flex-col gap-2.5"><div class="text-[11px] uppercase tracking-widest text-slate-500">${title}</div>${body}</div>`;
  function craftForm(d) {
    if (d.mode === 'arm') return box('🛡️ Armament posten', `<div class="flex items-center gap-2"><span class="text-sm font-semibold text-slate-100 truncate">🛡️ ${esc(d.name || 'Set')}</span>
        <button type="button" data-f-act="regear" class="ml-auto text-xs px-2.5 py-1 rounded-lg border border-ink-600 hover:border-gold-500/60">ändern</button></div>
      <label class="flex items-center gap-2 text-sm"><input type="checkbox" data-f="crafted" ${d.crafted ? 'checked' : ''} class="w-4 h-4 accent-amber-400"> 🆕 Neu / verbessert</label>
      <input type="text" data-f="note" maxlength="120" value="${esc(d.note || '')}" placeholder="Sonst noch? z. B. „endlich 4× Rot“" class="${INP} w-full">`);
    if (st.gmode === 'arm') { const arms = R.armamentList ? R.armamentList() : [];
      return box('⚒️ Gear-Upgrade', `<div class="flex flex-wrap gap-1.5">${segBtn('data-f-gmode="gear"', false, '⚒️ Ausrüstung')}${segBtn('data-f-gmode="arm"', true, '🛡️ Armament')}</div>
        ${arms.length ? `<div class="text-[10px] text-slate-500">Armaments aus deinen Showcase-Sets:</div><div class="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3 max-h-60 overflow-y-auto">${arms.map((x) => `<button type="button" data-f-arm="${esc(x.key)}" class="flex flex-col items-start rounded-lg border border-ink-700 hover:border-gold-500/60 px-2.5 py-1.5 text-left min-w-0">
          <span class="text-sm font-semibold text-slate-100 truncate max-w-full">🛡️ ${esc(x.name)}</span><span class="text-[10px] text-slate-500 truncate max-w-full">${esc(x.from)} · ${(x.arm.insc || []).filter((i) => i.t).length} Inschriften${x.arm.formation ? ` · ${esc(x.arm.formation)}` : ''}</span></button>`).join('')}</div>`
          : '<p class="text-xs text-slate-500">Noch kein Armament – im Showcase bei einem Set die Rüstung (Inschriften) eintragen.</p>'}`); }
    if (d.mode === 'set') return box('⚒️ Ganzes Set posten', `<div class="flex items-center gap-2"><span class="text-sm font-semibold text-slate-100 truncate">📦 ${esc(d.name || 'Set')}</span><span class="text-[11px] text-slate-500">${Object.keys(d.gear || {}).length} Teile</span>
        <button type="button" data-f-act="regear" class="ml-auto text-xs px-2.5 py-1 rounded-lg border border-ink-600 hover:border-gold-500/60">ändern</button></div>
      <label class="flex items-center gap-2 text-sm"><input type="checkbox" data-f="crafted" ${d.crafted ? 'checked' : ''} class="w-4 h-4 accent-amber-400"> 🆕 Neu gecraftet / fertig</label>
      <input type="text" data-f="note" maxlength="120" value="${esc(d.note || '')}" placeholder="Sonst noch? z. B. „endlich komplett Iconic V“" class="${INP} w-full">`);
    const sets = gearSets(); if (st.gset !== 'all' && !sets.some((x) => x.key === st.gset)) st.gset = 'all';
    const own = ownGear(st.gset), hits = gearSearch(st.gq), cur = sets.find((x) => x.key === st.gset);
    const fitem = (k, lab, sub) => `<button type="button" data-f-gset="${esc(k)}" class="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${st.gset === k ? 'bg-gold-500/20 text-gold-100' : 'text-slate-200 hover:bg-ink-800'}"><span class="truncate">${esc(lab)}</span>${sub ? `<span class="text-[10px] text-slate-500 truncate">${esc(sub)}</span>` : ''}</button>`;
    const filter = sets.length > 1 ? `<div class="relative">
        <button type="button" data-f-gsetopen aria-expanded="${st.gsetOpen}" class="w-full inline-flex items-center justify-between gap-3 rounded-lg border ${st.gsetOpen ? 'border-gold-400 bg-gold-500/10' : 'border-ink-600 hover:border-gold-500/60'} bg-ink-950 px-3 py-1.5 text-sm">
          <span><span class="text-slate-400">Set:</span> <b class="text-slate-100">${esc(cur ? cur.name : 'Alle')}</b></span><span class="text-gold-300 ${st.gsetOpen ? 'rotate-180' : ''}">▾</span></button>
        ${st.gsetOpen ? `<div class="absolute z-30 left-0 right-0 mt-1 rounded-xl border border-gold-500/40 bg-ink-900 shadow-2xl p-1.5 grid sm:grid-cols-2 gap-1 max-h-64 overflow-y-auto">${fitem('all', 'Alle Sets', '')}${sets.map((x, i) => fitem(x.key, x.name || `Set ${i + 1}`, x.from)).join('')}</div>` : ''}</div>` : '';
    const gearBtn = (g, i, src) => `<button type="button" data-gpick="${src}:${i}" class="flex items-center gap-2 text-left rounded-lg border border-ink-700 hover:border-gold-500/60 px-2 py-1.5 min-w-0">
        ${icoBox(g.icon, 'w-9 h-9 shrink-0', '⚒️')}
        <span class="min-w-0"><span class="block text-sm truncate ${rarCol[g.rarity] || ''}">${esc(g.name)}</span><span class="block text-[10px] text-slate-500 truncate">${esc(g.slot)}${g.tier ? ` · Iconic ${ROMAN[g.tier - 1]}` : ''}</span></span></button>`;
    const pickArea = `
      <input type="search" data-f="gq" value="${esc(st.gq)}" placeholder="🔍 Teil suchen (z. B. Dragon, Hope …)" class="${INP} w-full">
      <div data-ghits class="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">${hits.map((g, i) => gearBtn(g, i, 's')).join('')}</div>
      ${own.length || sets.length ? `<div class="flex flex-wrap items-center justify-between gap-2"><span class="text-[10px] text-slate-500">Aus deinen Showcase-Sets${cur ? `: <b class="text-slate-300">${esc(cur.name)}</b>` : ''}</span>
        ${cur ? `<button type="button" data-f-wholeset="${esc(cur.key)}" class="text-xs px-3 py-1.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-ink-950 font-semibold">📦 Ganzes Set posten</button>` : sets.length === 1 ? `<button type="button" data-f-wholeset="${esc(sets[0].key)}" class="text-xs px-3 py-1.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-ink-950 font-semibold">📦 Ganzes Set posten</button>` : '<span class="text-[10px] text-slate-500">Set wählen → ganzes Set posten</span>'}</div>
        ${filter}
        <div class="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3 max-h-60 overflow-y-auto">${own.map((g, i) => gearBtn(g, i, 'o')).join('')}</div>` : ''}
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
    return box('⚒️ Gear-Upgrade – welches Teil, und was wurde verbessert?', d.name ? chosen + what : `<div class="flex flex-wrap gap-1.5">${segBtn('data-f-gmode="gear"', true, '⚒️ Ausrüstung')}${segBtn('data-f-gmode="arm"', false, '🛡️ Armament')}</div>` + pickArea);
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
    return box('🌽 Was zeigen? (alles einzeln wählbar)', `
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
  // Abschnitte übersichtlich: Pässe · Altäre (kompakt, nummeriert) · Gesamt
  function segPicker(segs, sel, attr, own) {
    const t = Date.now(), part = (s) => { const [a, b] = String(s.label || '').split(' · '); return [a || '', b || '']; };
    const chip = (s, main, sub, cls) => { const on = sel === s.id, soon = s.ts && s.ts > t;
      return `<button type="button" ${attr}="${esc(s.id)}" aria-pressed="${on}" title="${esc(s.label)}${soon ? ' (bald)' : ''}" class="${cls} flex flex-col items-center justify-center rounded-lg border transition ${on ? 'border-gold-400 bg-gold-500 text-ink-950 shadow-[0_0_14px_rgba(245,197,66,.35)]' : 'border-ink-600 bg-ink-950 text-slate-200 hover:border-gold-500/60'} ${soon && !on ? 'opacity-50' : ''}">
        <span class="text-xs font-bold leading-tight">${main}</span>${sub ? `<span class="text-[10px] leading-tight ${on ? 'text-ink-950/70' : 'text-slate-500'}">${esc(sub)}</span>` : ''}</button>`; };
    const row = (ico, lab, body) => body ? `<div class="flex items-start gap-2"><span class="w-20 shrink-0 pt-2 text-[10px] uppercase tracking-widest text-slate-500 whitespace-nowrap">${ico} ${lab}</span><div class="flex flex-wrap gap-1.5 min-w-0">${body}</div></div>` : '';
    const passes = segs.filter((s) => s.id[0] === 'p'), altars = segs.filter((s) => s.id[0] === 'a'), tot = segs.filter((s) => s.id === 'kvk');
    return `<div class="flex flex-col gap-2">
      ${row('🚪', 'Pässe', passes.map((s) => { const [a, b] = part(s); return chip(s, esc(a), b, 'px-3 py-1.5 min-w-[4.5rem]'); }).join(''))}
      ${row('⛩️', 'Altäre', altars.map((s) => { const [, b] = part(s); return chip(s, esc(String(s.id).slice(1)), b, 'w-12 py-1.5'); }).join(''))}
      ${row('🏁', 'Gesamt', tot.map((s) => chip(s, 'KvK gesamt', s.label.includes('bisher') ? 'bisher' : '', 'px-3 py-1.5')).join('') + (own ? chip({ id: 'own', label: 'Eigene Angabe' }, '✏️ Eigene', '', 'px-3 py-1.5') : ''))}
    </div>`;
  }
  function kvkptsForm(d) {
    const segs = d._segs || [], t = Date.now();
    const btns = segs.map((s) => segBtn(`data-f-seg="${s.id}"`, d.seg === s.id, `${s.id[0] === 'a' ? '⛩️' : s.id === 'kvk' ? '🏁' : '🚪'} ${esc(s.label)}${s.ts && s.ts > t ? ' <span class="opacity-60">(bald)</span>' : ''}`)).join('') + segBtn('data-f-seg="own"', d.seg === 'own', '✏️ Eigene Angabe');
    const inp = (k, lab) => `<label class="flex flex-col gap-1 text-[11px] text-slate-400">${lab}<input type="text" inputmode="decimal" data-f="kv_${k}" value="${d[k] ? esc(fmt(d[k])) : ''}" placeholder="0" class="${INP} text-right tabular-nums"></label>`;
    const isAltar = String(d.seg || '')[0] === 'a';
    return box('⚔️ Welcher Abschnitt? (aus deiner KvK-Timeline)', `${segPicker(segs, d.seg, 'data-f-seg', true)}
      ${d.seg === 'own' ? `<input type="text" data-f="kv_label" maxlength="40" value="${esc(d.label || '')}" placeholder="z. B. Ruine, Kampftag 3 …" class="${INP} w-full">` : ''}
      <div class="grid grid-cols-3 gap-2">${inp('kp', '⚔️ Kill-Punkte')}${inp('acclaim', '🏅 Verdienst')}${inp('deads', '💀 Deads (optional)')}</div>
      <p class="text-[11px] text-slate-500">${isAltar ? 'Für Altäre gibt es keine gespeicherten Zwischenstände – bitte Zahlen eintragen.' : 'Pässe und KvK gesamt kommen aus KvK → Stats (Zwischenstände je Pass) – Zahlen kannst du anpassen.'}</p>`);
  }
  function showcaseForm(a) {
    const list = scDocList(), sc = list.find((x) => x.id === a.pick.sid) || list[0]; if (!sc) return '';
    const sel = a.pick.sel, n = sel.length;
    const chip = (x, i) => { const ok = scSetFilled(x), on = sel.includes(i), full = !on && n >= SC_MAX, ic = Object.values(x.gear || {}).filter((g) => g && g.icon).slice(0, 3);
      return `<button type="button" data-f-scset="${i}" ${ok ? '' : 'disabled'} aria-pressed="${on}" title="${ok ? '' : 'Set ohne Ausrüstung'}" class="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left min-w-0 transition ${on ? 'border-gold-400 bg-gold-500/15' : 'border-ink-600 hover:border-gold-500/60'} ${full || !ok ? 'opacity-45' : ''} disabled:cursor-not-allowed">
        <span class="w-4 h-4 shrink-0 rounded border grid place-items-center text-[10px] font-bold ${on ? 'bg-gold-500 border-gold-400 text-ink-950' : 'border-ink-500'}">${on ? '✓' : ''}</span>
        <span class="flex -space-x-1.5 shrink-0">${ic.map((g) => `<img src="${esc(g.icon)}" alt="" class="w-5 h-5 rounded bg-ink-900 object-contain ring-1 ring-ink-800">`).join('')}</span>
        <span class="text-xs font-semibold truncate text-slate-100">${esc(x.name || `Set ${i + 1}`)}</span></button>`; };
    return box('🎨 Welches Showcase?', `${list.length > 1 ? `<select data-f="scSel" class="${INP} w-full">${list.map((x) => `<option value="${esc(x.id)}" ${x.id === sc.id ? 'selected' : ''}>${esc(x.title || 'Showcase')} · ${(x.sets || []).length} Sets</option>`).join('')}</select>` : `<div class="text-sm font-semibold text-slate-100">${esc(sc.title || 'Showcase')}</div>`}
      <div class="flex items-baseline justify-between gap-2"><span class="text-xs text-slate-300">⚔️ Sets laden – welche sollen in den Beitrag?</span><span class="text-[11px] tabular-nums ${n >= SC_MAX ? 'text-gold-300' : 'text-slate-500'}">${n}/${Math.min(SC_MAX, (sc.sets || []).length)}</span></div>
      <div class="grid gap-1.5 grid-cols-2 sm:grid-cols-3">${(sc.sets || []).map(chip).join('')}</div>
      <div class="flex gap-3 text-[11px]"><button type="button" data-f-scall="1" class="text-gold-300 hover:underline">Alle laden</button><button type="button" data-f-scall="0" class="text-slate-400 hover:underline">Keine</button></div>`);
  }
  function showcaseImgForm(a) {
    let doc = null; try { doc = R.ownShowcase ? R.ownShowcase() : null; } catch {}
    const list = (doc && doc.list) || [];
    return box('🎨 Showcase aus deinem Profil', `${list.length > 1 ? `<select data-f="scImg" class="${INP} w-full">${list.map((x) => `<option value="${esc(x.id)}" ${x.id === a.data.sid ? 'selected' : ''}>${esc(x.title || 'Showcase')}</option>`).join('')}</select>` : ''}
      <p class="text-[11px] text-slate-500">Sieht genauso aus wie dein Showcase im Profil. Einzelne Sets postest du über <b class="text-slate-300">⚔️ Set</b>.</p>`);
  }
  function kvkForm(a) {
    const img = (A.ownMeta() || {}).kvk_card, d = a.data || {}, mode = a.dataUrl ? 'img' : 'stats';
    const modes = `<div class="flex flex-wrap gap-1.5">${segBtn(`data-f-kmode="img" ${img ? '' : 'disabled'}`, mode === 'img', '🖼️ KvK-Bild aus dem Profil')}${segBtn('data-f-kmode="stats"', mode === 'stats', '📊 Ergebnis-Zahlen')}</div>${img ? '' : '<p class="text-[11px] text-slate-500">Noch kein KvK-Bild – im KvK-Bereich unter Stats → „Bild für dein Profil“ erstellen.</p>'}`;
    if (mode === 'img') return box('🏁 Welches KvK-Ergebnis?', modes);
    const segs = d._segs || [], kx = d._kx || { ex: {} }, t = Date.now();
    const chk = (k, lab, v) => `<label class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border ${kx[k] && v ? 'border-gold-400 bg-gold-500/15 text-gold-200' : 'border-ink-600 text-slate-300'} ${v ? 'cursor-pointer' : 'opacity-40'}"><input type="checkbox" data-f="kx_${k}" ${kx[k] && v ? 'checked' : ''} ${v ? '' : 'disabled'} class="w-3.5 h-3.5 accent-amber-400">${lab}${v ? ` <span class="opacity-70 tabular-nums">${short(v)}</span>` : ''}</label>`;
    return box('🏁 Welches KvK-Ergebnis?', `${modes}
      <div class="text-xs text-slate-300">Abschnitt (aus deiner KvK-Timeline)</div>
      ${segPicker(segs, d.seg, 'data-f-kseg', false)}
      <div class="flex flex-wrap gap-1.5">${chk('honor', '🎖️ Ehre', kx.ex.honor)}${chk('crystal', '💠 Kristalle', kx.ex.crystal)}</div>
      <p class="text-[11px] text-slate-500">Zahlen kommen aus KvK → Stats.</p>`);
  }
  function aooForm(a) {
    const c = (A.ownMeta() || {}).aoo_card, d = a.data || {}, mode = d.mode === 'match' ? 'match' : 'card';
    const modes = `<div class="flex flex-wrap gap-1.5">${segBtn(`data-f-amode="card" ${c ? '' : 'disabled'}`, mode === 'card', '🏛️ AoO-Showcase (Profil)')}${segBtn('data-f-amode="match"', mode === 'match', '🏆 Match-Ergebnis')}</div>${c ? '' : '<p class="text-[11px] text-slate-500">Noch kein AoO-Showcase – unter 🎨 Showcases anlegen.</p>'}`;
    if (mode === 'card') return box('🏛️ Was zeigen?', modes);
    const inp = (k, lab, ph, type = 'text') => `<label class="flex flex-col gap-1 text-[11px] text-slate-400">${lab}<input type="${type}" data-f="am_${k}" value="${esc(d[k] ?? '')}" placeholder="${ph}" ${type === 'text' ? 'maxlength="40"' : ''} class="${INP}"></label>`;
    return box('🏛️ Was zeigen?', `${modes}
      <div class="flex flex-wrap gap-1.5">${segBtn('data-f-ares="win"', d.res === 'win', '🏆 Sieg')}${segBtn('data-f-ares="loss"', d.res === 'loss', '⚔️ Niederlage')}</div>
      <div class="grid grid-cols-2 gap-2">${inp('vs', 'Gegner (Allianz)', 'z. B. [ABC] Name')}${inp('date', 'Datum', '', 'date')}${inp('us', 'Unsere Punkte', 'z. B. 1.250.000')}${inp('them', 'Punkte Gegner', 'z. B. 980.000')}</div>
      <div class="flex flex-wrap items-center gap-3"><label class="flex items-center gap-2 text-sm"><input type="checkbox" data-f="am_mvp" ${d.mvp ? 'checked' : ''} class="w-4 h-4 accent-amber-400"> ⭐ MVP</label>
        <select data-f="am_role" class="${INP} !py-1"><option value="">Rolle …</option>${AOO_ROLES.map((r) => `<option ${d.role === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div>`);
  }
  const POLL_DUR = [[1, '1 Std.'], [6, '6 Std.'], [12, '12 Std.'], [24, '1 Tag'], [72, '3 Tage'], [168, '7 Tage'], [0, 'Unbegrenzt']];
  function pollForm(d) {
    const opts = d.opts || [];
    return box('📊 Umfrage', `<input type="text" data-f="pq" maxlength="140" value="${esc(d.q || '')}" placeholder="Frage, z. B. „Wann starten wir die Ark?“" class="${INP} w-full">
      <div class="flex flex-col gap-1.5">${opts.map((o, i) => `<div class="flex items-center gap-2"><span class="w-6 h-6 shrink-0 rounded-md grid place-items-center text-[11px] font-extrabold bg-gold-500/15 border border-gold-500/50 text-gold-200">${'ABCD'[i]}</span>
        <input type="text" data-f="po_${i}" maxlength="60" value="${esc(o)}" placeholder="Antwort ${i + 1}" class="${INP} flex-1 min-w-0">
        ${opts.length > 2 ? `<button type="button" data-f-pdel="${i}" title="Antwort entfernen" class="w-7 h-7 shrink-0 rounded-lg border border-ink-600 text-slate-500 hover:text-red-300 hover:border-red-400/60">✕</button>` : ''}</div>`).join('')}</div>
      ${opts.length < 4 ? '<button type="button" data-f-padd class="self-start text-xs px-3 py-1.5 rounded-lg border border-dashed border-gold-500/50 text-gold-300 hover:bg-gold-500/10">+ Antwort</button>' : '<p class="text-[11px] text-slate-500">Höchstens 4 Antworten.</p>'}
      <div class="text-xs text-slate-300">⏳ Wie lange läuft die Umfrage?</div>
      <div class="flex flex-wrap gap-1.5">${POLL_DUR.map(([h, l]) => segBtn(`data-f-pdur="${h}"`, (d.dur ?? 24) === h, l)).join('')}</div>
      <p class="text-[11px] text-slate-500">${d.dur ? 'Wenn sie endet, rückt sie mit dem Ergebnis wieder nach oben im Feed.' : 'Ohne Ende – Abstimmen geht dauerhaft.'}</p>`);
  }
  const formHTML = (a) => (!a ? '' : a.kind === 'set' && a.pick ? showcaseForm(a) : a.kind === 'showcase' ? showcaseImgForm(a) : a.kind === 'kvk' ? kvkForm(a) : a.kind === 'aoo' ? aooForm(a) : a.kind === 'poll' ? pollForm(a.data)
    : a.kind === 'craft' ? craftForm(a.data) : a.kind === 'pass' ? passForm(a.data) : a.kind === 'stock' ? stockForm(a.data)
    : a.kind === 'kvkpts' ? kvkptsForm(a.data) : a.kind === 'vip' ? vipForm(a.data) : a.kind === 'help' ? helpForm(a) : '');

  // ======================================================================
  // Seite: Kopf · Beitrag-Fenster · Filter · Liste
  // ======================================================================
  const composerHTML = () => {
    const a = st.attach;
    const chip = (ic, lab, k) => `<button type="button" data-feed-attach="${k}" ${st.busy ? 'disabled' : ''} class="text-xs px-3 py-1.5 rounded-lg border transition disabled:opacity-50 ${a && a.kind === k ? 'border-gold-400 bg-gold-500/15 text-gold-200' : 'border-ink-600 hover:border-gold-500/60 hover:text-gold-300'}">${ic} ${lab}</button>`;
    const showPrev = a && !(a.kind === 'craft' && !a.data.name && a.data.mode !== 'set' && a.data.mode !== 'arm');
    return `<div class="panel rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
      <div class="flex items-center gap-3">${R.userLine({ username: R.PROFILE.name, avatar: (A.ownMeta() || {}).avatar, alliance_tag: (A.ownMeta() || {}).alliance_tag }, 'w-10 h-10 text-base')}<span class="ml-auto text-[11px] uppercase tracking-widest text-slate-500">Neuer Beitrag</span></div>
      <textarea id="feedText" data-mention rows="2" maxlength="1000" placeholder="${esc(tt("Was gibt's Neues? (optional) · @ zum Markieren"))}" class="w-full bg-ink-950 border border-ink-600 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-gold-500 resize-y">${esc(st.text)}</textarea>
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-[11px] text-slate-500 mr-1">Anhängen:</span>
        ${chip('📷', 'Foto', 'photo')}${chip('🎨', 'Showcase', 'showcase')}${chip('⚔️', 'Set', 'set')}${chip('🏁', 'KvK-Bilanz', 'kvk')}${chip('🏛️', 'AoO', 'aoo')}
        ${chip('⚒️', 'Gear-Upgrade', 'craft')}${chip('🆘', 'Help Me', 'help')}${chip('🚪', 'Pass-Start', 'pass')}${chip('🗺️', 'KvK-Karte', 'kvkmap')}${chip('⚔️', 'KP & Verdienst', 'kvkpts')}
        ${chip('<img src="/icons/ressourcen/corn.png" alt="" style="width:16px;height:16px" class="inline-block -mt-0.5 object-contain">', 'Rss', 'stock')}${chip('👑', 'VIP', 'vip')}${chip('📊', 'Umfrage', 'poll')}
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
      <div class="relative" data-fbox>
        <button type="button" data-feed-fopen aria-expanded="${st.fOpen}" class="w-full sm:w-auto inline-flex items-center justify-between gap-3 rounded-xl border ${st.fOpen ? 'border-gold-400 bg-gold-500/10' : 'border-ink-600 hover:border-gold-500/60'} bg-ink-950 px-3.5 py-2 text-sm">
          <span><span class="text-slate-400">Anzeigen:</span> <b class="text-slate-100">${(FILTERS.find((f) => f[0] === st.filter) || FILTERS[0])[1]}</b> <span class="text-slate-500 tabular-nums">${cnt(st.filter)}</span></span>
          <span class="text-gold-300 transition-transform ${st.fOpen ? 'rotate-180' : ''}">▾</span></button>
        ${st.fOpen ? `<div class="absolute z-30 left-0 right-0 sm:right-auto sm:w-[26rem] mt-1.5 rounded-xl border border-gold-500/40 bg-ink-900 shadow-2xl p-1.5 grid grid-cols-2 gap-1">${FILTERS.map(([k, l]) => { const n = cnt(k), on = st.filter === k;
          return `<button type="button" data-feed-filter="${k}" ${!n && k !== 'all' && !on ? 'disabled' : ''} class="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${on ? 'bg-gold-500/20 text-gold-100' : 'text-slate-200 hover:bg-ink-800'} disabled:opacity-35 disabled:cursor-default"><span class="truncate">${l}</span><span class="text-[11px] tabular-nums ${on ? 'text-gold-200' : 'text-slate-500'}">${n}</span></button>`; }).join('')}</div>` : ''}
      </div>
    </div>`;
  };
  function visiblePosts() {
    const q = st.q.trim().toLowerCase();
    st.posts.forEach((p) => { if (pollOver(p)) pollEndSeen.add(p.id); });
    return [...st.posts].sort((a, b) => sortTs(b) - sortTs(a)).filter((p) => {
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
  function renderComposer() { const el = $('feedComposer'); if (!el) return; el.innerHTML = composerHTML(); msg(lastMsg[0], lastMsg[1]); fxScan(el); }
  function renderPreview() { const el = root.querySelector('[data-feed-prev]'); if (el && st.attach) { el.innerHTML = previewHTML(st.attach); fxScan(el); } else renderComposer(); }
  function renderList() {
    st.deferRender = false;
    const el = $('feedList'); if (el) { el.innerHTML = listHTML(); fxScan(el); }
    const fl = $('feedFilter'); if (fl && !(document.activeElement && document.activeElement.id === 'feedSearch')) fl.innerHTML = filterHTML();
    renderSync();
  }
  function renderSync() { const el = $('feedSync'); if (el) el.textContent = syncTxt(); }
  function render() {
    root.innerHTML = `
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div><h2 class="font-display text-2xl gold-text">📰 Feed</h2><p class="text-xs text-slate-500">Showcases, KvK, Gear-Upgrades und Bestände aller Spieler</p></div>
        <div class="flex items-center gap-3"><span id="feedSync" class="text-[11px] text-emerald-400/80"></span>
          ${bellHTML()}
          <button type="button" id="feedReload" class="text-xs px-3 py-1.5 rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300">↻ Aktualisieren</button></div>
      </div>
      <div id="feedNotifs">${notifsHTML()}</div>
      <div id="feedComposer"></div>
      <input type="file" id="feedCmFile" accept="image/gif,.gif" class="hidden">
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
    if (t.closest('#feedReload')) { load(); loadNotifs(); return; }
    if (t.closest('[data-feed-bell]')) { st.nOpen = !st.nOpen; renderNotifs(); if (st.nOpen) loadNotifs(); return; }
    if (t.closest('[data-notif-all]')) { markRead(); renderNotifs(); return; }
    const nf = t.closest('[data-notif]'); if (nf) { const n = st.notifs.find((x) => x.id === nf.dataset.notif); if (n) { markRead([n.id]); st.nOpen = false; renderNotifs(); openPost(n.post_id, n.comment_id); } return; }
    const fe = t.closest('[data-feed-edit]'); if (fe) { startEdit('post', fe.dataset.feedEdit); return; }
    const ce = t.closest('[data-cm-edit]'); if (ce) { const [pid, cid] = ce.dataset.cmEdit.split('|'); startEdit('cm', cid, pid); return; }
    if (t.closest('[data-edit-save]')) { saveEdit(); return; }
    if (t.closest('[data-edit-cancel]')) { cancelEdit(); return; }
    const cg = t.closest('[data-cm-gif]'); if (cg) { st.gifFor = cg.dataset.cmGif; const f = $('feedCmFile'); if (f) f.click(); return; }
    const cgx = t.closest('[data-cm-gifx]'); if (cgx) { delete st.cmGif[cgx.dataset.cmGifx]; renderList(); return; }
    if (t.closest('[data-feed-pending]')) { showPending(); return; }
    if (t.closest('[data-feed-more]')) { more(); return; }
    const fl = t.closest('[data-feed-filter]');
    if (fl) { st.filter = fl.dataset.feedFilter; st.fOpen = false; $('feedFilter').innerHTML = filterHTML(); renderList(); return; }
    if (t.closest('[data-feed-fopen]')) { st.fOpen = !st.fOpen; $('feedFilter').innerHTML = filterHTML(); return; }
    const at = t.closest('[data-feed-attach]');
    if (at) {
      const k = at.dataset.feedAttach;
      if (k !== 'photo' && st.attach && st.attach.kind === k) { st.attach = null; renderComposer(); return; }   // nochmal = abwählen
      msg('', '');
      ({ none: () => { st.attach = null; renderComposer(); }, photo: () => $('feedFile') && $('feedFile').click(), kvk: attachKvk, aoo: attachAoo,
        craft: attachCraft, pass: attachPass, stock: attachStock, kvkpts: attachKvkPts, vip: attachVip, kvkmap: attachMap, help: attachHelp, poll: attachPoll, set: attachSet, showcase: () => attachShowcase() }[k] || (() => {}))();
      return;
    }
    const gp = t.closest('[data-gpick]');
    if (gp && st.attach && st.attach.kind === 'craft') { const [src, i] = gp.dataset.gpick.split(':'); const g = (src === 'o' ? ownGear(st.gset) : gearSearch(st.gq))[+i]; if (g) pickGear(g); return; }
    const gs = t.closest('[data-f-gset]'); if (gs && st.attach && st.attach.kind === 'craft') { st.gset = gs.dataset.fGset; st.gsetOpen = false; renderComposer(); return; }
    if (t.closest('[data-f-gsetopen]') && st.attach && st.attach.kind === 'craft') { st.gsetOpen = !st.gsetOpen; renderComposer(); return; }
    const gm = t.closest('[data-f-gmode]'); if (gm && st.attach && st.attach.kind === 'craft') { st.gmode = gm.dataset.fGmode; renderComposer(); return; }
    const fa2 = t.closest('[data-f-arm]'); if (fa2 && st.attach && st.attach.kind === 'craft') { pickArmament(fa2.dataset.fArm); return; }
    const ws = t.closest('[data-f-wholeset]'); if (ws && st.attach && st.attach.kind === 'craft') { pickWholeSet(ws.dataset.fWholeset); return; }
    const fa = t.closest('[data-f-act]');
    if (fa && fa.dataset.fAct === 'regear' && st.attach) { if (st.attach.data.mode === 'set' || st.attach.data.mode === 'arm') { const gm0 = st.attach.data.mode === 'arm' ? 'arm' : 'gear'; attachCraft(); st.gmode = gm0; renderComposer(); return; } Object.assign(st.attach.data, { item: '', name: '', icon: '', ic: null }); renderComposer(); return; }
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
    const a0 = st.attach;
    const scs = t.closest('[data-f-scset]');
    if (scs && a0 && a0.kind === 'set') { if (scs.disabled) return; const i = +scs.dataset.fScset; scRepick((pk) => { const j = pk.sel.indexOf(i); if (j >= 0) pk.sel.splice(j, 1); else if (pk.sel.length >= SC_MAX) msg(`Höchstens ${SC_MAX} Sets – erst eines abwählen.`, 'warn'); else { pk.sel.push(i); pk.sel.sort((x, y) => x - y); } }); return; }
    const sca = t.closest('[data-f-scall]');
    if (sca && a0 && a0.kind === 'set') { scRepick((pk, sc) => { pk.sel = sca.dataset.fScall === '1' ? (sc.sets || []).map((x, i) => (scSetFilled(x) ? i : -1)).filter((i) => i >= 0).slice(0, SC_MAX) : []; }); return; }
    const km = t.closest('[data-f-kmode]'); if (km && a0 && a0.kind === 'kvk') { if (km.disabled) return; attachKvk(km.dataset.fKmode); return; }
    const ks = t.closest('[data-f-kseg]'); if (ks && a0 && a0.kind === 'kvk') { const o = (a0.data._kx || {}); a0.data = kvkStatsData(ks.dataset.fKseg, { honor: !!o.honor, crystal: !!o.crystal }); renderComposer(); return; }
    const am = t.closest('[data-f-amode]'); if (am && a0 && a0.kind === 'aoo') { if (am.disabled) return; attachAoo(am.dataset.fAmode); return; }
    const ar = t.closest('[data-f-ares]'); if (ar && a0 && a0.kind === 'aoo') { a0.data.res = ar.dataset.fAres; renderComposer(); return; }
    if (t.closest('[data-f-padd]') && a0 && a0.kind === 'poll') { if (a0.data.opts.length < 4) a0.data.opts.push(''); renderComposer(); const l = root.querySelector(`[data-f="po_${a0.data.opts.length - 1}"]`); if (l) l.focus(); return; }
    const pd = t.closest('[data-f-pdel]'); if (pd && a0 && a0.kind === 'poll') { if (a0.data.opts.length > 2) a0.data.opts.splice(+pd.dataset.fPdel, 1); renderComposer(); return; }
    const pv = t.closest('[data-poll]'); if (pv) { const [pid, i] = pv.dataset.poll.split('|'); vote(pid, +i); return; }
    const pc = t.closest('[data-poll-change]'); if (pc) { st.pollChange.add(pc.dataset.pollChange); renderList(); return; }
    const pk = t.closest('[data-poll-keep]'); if (pk) { st.pollChange.delete(pk.dataset.pollKeep); renderList(); return; }
    const pdu = t.closest('[data-f-pdur]'); if (pdu && a0 && a0.kind === 'poll') { a0.data.dur = +pdu.dataset.fPdur; st.pollDur = a0.data.dur; renderComposer(); return; }
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
    if (t.dataset && t.dataset.mention !== undefined) mentionInput(t);
    if (t.hasAttribute && t.hasAttribute('data-edit-in')) { if (st.edit) st.edit.text = t.value; return; }
    if (t.id === 'feedText') { st.text = t.value; return; }
    if (t.id === 'feedSearch') { st.q = t.value; renderList(); return; }
    if (t.dataset && t.dataset.cmIn) { st.cmDraft[t.dataset.cmIn] = t.value; return; }
    const f = t.dataset && t.dataset.f, a = st.attach; if (!f || !a) return;
    const d = a.data;
    if (f === 'gq') { st.gq = t.value; const h = root.querySelector('[data-ghits]'); if (!st.gq || !h) { renderComposer(); const s = root.querySelector('[data-f="gq"]'); if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); } } else h.innerHTML = gearSearch(st.gq).map((g, i) => `<button type="button" data-gpick="s:${i}" class="flex items-center gap-2 text-left rounded-lg border border-ink-700 hover:border-gold-500/60 px-2 py-1.5 min-w-0">${icoBox(g.icon, 'w-9 h-9 shrink-0', '⚒️')}<span class="min-w-0"><span class="block text-sm truncate ${rarCol[g.rarity] || ''}">${esc(g.name)}</span><span class="block text-[10px] text-slate-500 truncate">${esc(g.slot)}</span></span></button>`).join('') || '<p class="text-xs text-slate-500">Nichts gefunden.</p>'; return; }
    if (f === 'note') { d.note = t.value.slice(0, 120); renderPreview(); return; }
    if (f === 'pq') { d.q = t.value.slice(0, 140); renderPreview(); return; }
    if (f.startsWith('po_')) { d.opts[+f.slice(3)] = t.value.slice(0, 60); renderPreview(); return; }
    if (f === 'am_vs' || f === 'am_us' || f === 'am_them') { d[f.slice(3)] = t.value.slice(0, 40); renderPreview(); return; }
    if (f === 'vipLv') { const v = Math.round(+t.value); if (v >= 1 && v <= 20) { d.lv = v; renderPreview(); } return; }
    if (f === 'kv_label') { d.label = t.value.slice(0, 40); renderPreview(); return; }
    if (f.startsWith('kv_')) { d[f.slice(3)] = num(t.value); renderPreview(); return; }
  });
  root.addEventListener('change', (ev) => {
    const t = ev.target;
    if (t.id === 'feedFile') { const file = t.files && t.files[0]; t.value = ''; pickPhoto(file); return; }
    if (t.id === 'feedCmFile') { const file = t.files && t.files[0]; t.value = ''; pickCmGif(st.gifFor, file); return; }
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
    if (f === 'scImg' && a.kind === 'showcase') { attachShowcase(t.value); return; }
    if (f === 'scSel' && a.kind === 'set') { const sc = scDocList().find((x) => x.id === t.value); if (sc) { a.pick = { sid: sc.id, sel: (sc.sets || []).map((x, i) => (scSetFilled(x) ? i : -1)).filter((i) => i >= 0).slice(0, SC_MAX) }; a.data = scBuild(sc, a.pick.sel); renderComposer(); } return; }
    if ((f === 'kx_honor' || f === 'kx_crystal') && a.kind === 'kvk') { const o = { ...(d._kx || {}), [f.slice(3)]: t.checked }; a.data = kvkStatsData(d.seg, { honor: !!o.honor, crystal: !!o.crystal }); renderComposer(); return; }
    if (f === 'am_mvp') { d.mvp = t.checked; renderPreview(); return; }
    if (f === 'am_role' || f === 'am_date') { d[f.slice(3)] = t.value; renderPreview(); return; }
    if (f.startsWith('so_')) { const o = { ...(d.opt || {}), [f.slice(3)]: t.checked }; a.data = stockBuild(o); renderComposer(); return; }
    if (f.startsWith('kv_')) { const el = root.querySelector(`[data-f="${f}"]`); if (el && f !== 'kv_label' && d[f.slice(3)]) el.value = fmt(d[f.slice(3)]); }
  });

  document.addEventListener('click', (ev) => {
    if (st.fOpen && !ev.target.closest('[data-fbox]')) { st.fOpen = false; const f = $('feedFilter'); if (f) f.innerHTML = filterHTML(); }
    if (st.gsetOpen && !ev.target.closest('[data-f-gsetopen]') && !ev.target.closest('[data-f-gset]')) { st.gsetOpen = false; renderComposer(); }
  });
  // @-Liste mit Pfeiltasten / Enter / Tab bedienen (vor dem Senden mit Enter)
  root.addEventListener('keydown', (ev) => {
    if (!mt.box || mt.el !== ev.target) return;
    const n = (mt.list || []).length;
    if (ev.key === 'Escape') { ev.preventDefault(); ev.stopImmediatePropagation(); mentionClose(); return; }
    if (!n) return;
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); ev.stopImmediatePropagation(); mt.i = (mt.i + (ev.key === 'ArrowDown' ? 1 : n - 1)) % n; mentionDraw(); }
    else if (ev.key === 'Enter' || ev.key === 'Tab') { ev.preventDefault(); ev.stopImmediatePropagation(); mentionPick(mt.i); }
  }, true);
  root.addEventListener('keydown', (ev) => { const t = ev.target;
    if (ev.key === 'Enter' && !ev.shiftKey && t.dataset && t.dataset.cmIn) { ev.preventDefault(); sendComment(t.dataset.cmIn); }
    else if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey) && t.hasAttribute('data-edit-in')) { ev.preventDefault(); saveEdit(); }
    else if (ev.key === 'Escape' && t.hasAttribute('data-edit-in')) cancelEdit(); });
  root.addEventListener('focusout', (ev) => { if (mt.el === ev.target) setTimeout(() => { if (mt.el && document.activeElement !== mt.el) mentionClose(); }, 150); });
  window.addEventListener('scroll', () => { if (mt.box) mentionDraw(); }, { passive: true });
  // aufgeschobenes Neuzeichnen nachholen, sobald niemand mehr in der Liste tippt
  root.addEventListener('focusout', () => { setTimeout(() => { if (st.deferRender && !typing()) renderList(); }, 300); });
  // Auto-Aktualisieren: alle 20 s, solange der Feed offen und der Tab sichtbar ist · Countdown der Pässe läuft mit
  const feedOpen = () => R.view === 'feed' && !document.hidden;
  setInterval(() => { if (feedOpen()) poll(); }, POLL_MS);
  setInterval(() => { root.querySelectorAll('[data-cd]').forEach((el) => { el.textContent = cdText(+el.dataset.cd); }); }, 15000);
  document.addEventListener('visibilitychange', () => { if (feedOpen() && Date.now() - st.lastSync > 5000) poll(); });

  // Seite öffnen → laden (einmal, danach automatisch und über ↻)
  R.viewHooks.feed = () => { if (!st.loaded && !st.loading) load(); else { renderList(); if (Date.now() - st.lastSync > 5000) poll(); } loadNotifs(); };
  // Erwähnungen: gleich beim Start und dann jede Minute (rote Zahl am Feed-Reiter)
  setTimeout(loadNotifs, 1500); setInterval(() => { if (!document.hidden) loadNotifs(); }, 60000);
  R.feedReload = load;
  render();
};
