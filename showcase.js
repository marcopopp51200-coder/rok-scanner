// Wiz fan Club – Showcase (Bühne, Sets, Kommandanten, Ausrüstung, Hintergründe)
// Läuft innerhalb von RokApp (scanner.js); R = geteilter Kontext (window.Rok)
window.RokMods = window.RokMods || {};
window.RokMods.showcase = (R) => {
  R.gearIconFor = gearIconFor; R.scanRefs = scanRefs; R.renderShowcase = renderShowcase; R.goScan = goScan; R.renderProfileCharts = renderProfileCharts;
  // ================= Showcase: mehrere Showcases, je bis zu 7 Sets frei auf einer Bühne =================
  // Kommandanten-Katalog – Bilder: /icons/comander/<id>.webp · mit Expertise: /icons/comanderexpertise/<id>.webp
  // ex: 1 = Expertise-Bild vorhanden · nb: 1 = es gibt nur das Expertise-Bild · Namen dürfen frei geändert werden
  const COMMANDERS = [
    { id: 'achilles', r: 'legendary', name: 'Achilles', ex: 1 },
    { id: 'afonso', r: 'legendary', name: 'Afonso I.', ex: 1 },
    { id: 'alex', r: 'legendary', name: 'Alexander der Große', ex: 1 },
    { id: 'nevsky', r: 'legendary', name: 'Alexander Newski', ex: 1 },
    { id: 'alp', r: 'legendary', name: 'Alp Arslan', ex: 1 },
    { id: 'amani', r: 'legendary', name: 'Amanitore', ex: 1 },
    { id: 'archimedes', r: 'legendary', name: 'Archimedes', ex: 1 },
    { id: 'art', r: 'legendary', name: 'Artemisia I.', ex: 1 },
    { id: 'arthur', r: 'legendary', name: 'Arthur Pendragon', ex: 1 },
    { id: 'ash', r: 'legendary', name: 'Assurbanipal', ex: 1 },
    { id: 'attila', r: 'legendary', name: 'Attila', ex: 1 },
    { id: 'babur', r: 'legendary', name: 'Babur', ex: 1 },
    { id: 'bq', r: 'legendary', name: 'Bai Qi', ex: 1 },
    { id: 'beli', r: 'legendary', name: 'Belisarius', ex: 1 },
    { id: 'bert', r: 'legendary', name: 'Bertrand du Guesclin', ex: 1 },
    { id: 'bjorn', r: 'legendary', name: 'Björn Eisenseite', ex: 1 },
    { id: 'boudica', r: 'legendary', name: 'Boudica', ex: 1 },
    { id: 'cc', r: 'legendary', name: 'Cao Cao', ex: 1 },
    { id: 'chandra', r: 'legendary', name: 'Chandragupta Maurya', ex: 1 },
    { id: 'cj', r: 'legendary', name: 'Cheok Jun-gyeong', ex: 1 },
    { id: 'cy', r: 'legendary', name: 'Cy', ex: 1 },
    { id: 'david', r: 'legendary', name: 'David IV.', ex: 1 },
    { id: 'dido', r: 'legendary', name: 'Dido', ex: 1 },
    { id: 'khan', r: 'legendary', name: 'Dschingis Khan', ex: 1 },
    { id: 'edward', r: 'legendary', name: 'Edward von Woodstock', ex: 1 },
    { id: 'cid', r: 'legendary', name: 'El Cid', ex: 1 },
    { id: 'eleanor', r: 'legendary', name: 'Eleonore von Aquitanien', ex: 1 },
    { id: 'elizabeth', r: 'legendary', name: 'Elisabeth I.', ex: 1 },
    { id: 'eulji', r: 'legendary', name: 'Eulji Mundeok', nb: 1, ex: 1 },
    { id: 'flav', r: 'legendary', name: 'Flavius Aetius', ex: 1 },
    { id: 'fred', r: 'legendary', name: 'Friedrich I.', ex: 1 },
    { id: 'gajah', r: 'legendary', name: 'Gajah Mada', ex: 1 },
    { id: 'gamchan', r: 'legendary', name: 'Gang Gam-chan', ex: 1 },
    { id: 'gilga', r: 'legendary', name: 'Gilgamesch', ex: 1 },
    { id: 'gonzalo', r: 'legendary', name: 'Gonzalo de Córdoba', ex: 1 },
    { id: 'gorgo', r: 'legendary', name: 'Gorgo', ex: 1 },
    { id: 'guan', r: 'legendary', name: 'Guan Yu', ex: 1 },
    { id: 'barca', r: 'legendary', name: 'Hannibal Barca', ex: 1 },
    { id: 'harald', r: 'legendary', name: 'Harald Hardrada', ex: 1 },
    { id: 'hayam', r: 'legendary', name: 'Hayam Wuruk', ex: 1 },
    { id: 'henry', r: 'legendary', name: 'Heinrich V.', ex: 1 },
    { id: 'hector', r: 'legendary', name: 'Hektor', ex: 1 },
    { id: 'hera', r: 'legendary', name: 'Herakleios', ex: 1 },
    { id: 'hermann', r: 'legendary', name: 'Hermann', ex: 1 },
    { id: 'honda', r: 'legendary', name: 'Honda Tadakatsu', ex: 1 },
    { id: 'huo', r: 'legendary', name: 'Huo Qubing', ex: 1 },
    { id: 'ishida', r: 'legendary', name: 'Ishida Mitsunari', ex: 1 },
    { id: 'ivar', r: 'legendary', name: 'Ivar', ex: 1 },
    { id: 'ivan', r: 'legendary', name: 'Iwan III.', ex: 1 },
    { id: 'jad', r: 'legendary', name: 'Jadwiga', ex: 1 },
    { id: 'jan', r: 'legendary', name: 'Jan Žižka', ex: 1 },
    { id: 'joan', r: 'legendary', name: 'Jeanne d’Arc', ex: 1 },
    { id: 'john', r: 'legendary', name: 'Johann Hunyadi', ex: 1 },
    { id: 'caesar', r: 'legendary', name: 'Julius Caesar', ex: 1 },
    { id: 'justinian', r: 'legendary', name: 'Justinian I.', ex: 1 },
    { id: 'charlemagne', r: 'legendary', name: 'Karl der Große', ex: 1 },
    { id: 'cm', r: 'legendary', name: 'Karl Martell', ex: 1 },
    { id: 'casimir', r: 'legendary', name: 'Kasimir III.', ex: 1 },
    { id: 'cleo', r: 'legendary', name: 'Kleopatra VII.', ex: 1 },
    { id: 'const', r: 'legendary', name: 'Konstantin der Große', ex: 1 },
    { id: 'cyrus', r: 'legendary', name: 'Kyros der Große', ex: 1 },
    { id: 'lapu', r: 'legendary', name: 'Lapu-Lapu', ex: 1 },
    { id: 'leo', r: 'legendary', name: 'Leonidas', ex: 1 },
    { id: 'liu', r: 'legendary', name: 'Liu Che', ex: 1 },
    { id: 'lohar', r: 'legendary', name: 'Lohar', ex: 1 },
    { id: 'lubu', r: 'legendary', name: 'Lü Bu', ex: 1 },
    { id: 'margaret', r: 'legendary', name: 'Margarete I.', ex: 1 },
    { id: 'mary', r: 'legendary', name: 'Maria I.', ex: 1 },
    { id: 'matthias', r: 'legendary', name: 'Matthias Corvinus', ex: 1 },
    { id: 'mehmed', r: 'legendary', name: 'Mehmed II.', ex: 1 },
    { id: 'mina', r: 'legendary', name: 'Minamoto no Yoshitsune', ex: 1 },
    { id: 'mocte', r: 'legendary', name: 'Moctezuma I.', ex: 1 },
    { id: 'mulan', r: 'legendary', name: 'Mulan', ex: 1 },
    { id: 'nebu', r: 'legendary', name: 'Nebukadnezar II.', ex: 1 },
    { id: 'osman', r: 'legendary', name: 'Osman I.', ex: 1 },
    { id: 'pakal', r: 'legendary', name: 'Pakal der Große', ex: 1 },
    { id: 'philip', r: 'legendary', name: 'Philipp II.', ex: 1 },
    { id: 'pepin', r: 'legendary', name: 'Pippin der Jüngere', ex: 1 },
    { id: 'pyrrhus', r: 'legendary', name: 'Pyrrhus', ex: 1 },
    { id: 'qin', r: 'legendary', name: 'Qin Shi Huang', ex: 1 },
    { id: 'ragnarold', r: 'legendary', name: 'Ragnar (alt)', ex: 1 },
    { id: 'ragnar', r: 'legendary', name: 'Ragnar Lodbrok', ex: 1 },
    { id: 'ramesses', r: 'legendary', name: 'Ramses II.', ex: 1 },
    { id: 'richard', r: 'legendary', name: 'Richard I.', ex: 1 },
    { id: 'saladin', r: 'legendary', name: 'Saladin', ex: 1 },
    { id: 'sargon', r: 'legendary', name: 'Sargon der Große', ex: 1 },
    { id: 'sa', r: 'legendary', name: 'Sa', ex: 1 },
    { id: 'scipio', r: 'legendary', name: 'Scipio Africanus', ex: 1 },
    { id: 'seondeok', r: 'legendary', name: 'Seondeok', ex: 1 },
    { id: 'shajar', r: 'legendary', name: 'Shajar al-Durr', ex: 1 },
    { id: 'shapur', r: 'legendary', name: 'Shapur I.', ex: 1 },
    { id: 'siyaj', r: 'legendary', name: 'Siyaj Chan', ex: 1 },
    { id: 'stephen', r: 'legendary', name: 'Stephan I.', ex: 1 },
    { id: 'subutai', r: 'legendary', name: 'Subutai', ex: 1 },
    { id: 'sun', r: 'legendary', name: 'Sun Tzu', ex: 1 },
    { id: 'suleiman', r: 'legendary', name: 'Süleyman I.', ex: 1 },
    { id: 'takeda', r: 'legendary', name: 'Takeda Shingen', ex: 1 },
    { id: 'tariq', r: 'legendary', name: 'Tariq ibn Ziyad', ex: 1 },
    { id: 'theo', r: 'legendary', name: 'Theodora', ex: 1 },
    { id: 'thutmose', r: 'legendary', name: 'Thutmosis III.', ex: 1 },
    { id: 'toku', r: 'legendary', name: 'Tokugawa Ieyasu', ex: 1 },
    { id: 'tomy', r: 'legendary', name: 'Tomyris', ex: 1 },
    { id: 'trajan', r: 'legendary', name: 'Trajan', ex: 1 },
    { id: 'verci', r: 'legendary', name: 'Vercingetorix', ex: 1 },
    { id: 'william', r: 'legendary', name: 'Wilhelm I.', ex: 1 },
    { id: 'marshal', r: 'legendary', name: 'William Marshal', ex: 1 },
    { id: 'wallace', r: 'legendary', name: 'William Wallace', ex: 1 },
    { id: 'wu', r: 'legendary', name: 'Wu Zetian', ex: 1 },
    { id: 'xy', r: 'legendary', name: 'Xiang Yu', ex: 1 },
    { id: 'ysg', r: 'legendary', name: 'Yi Seong-gye', ex: 1 },
    { id: 'yss', r: 'legendary', name: 'Yi Sun-sin', ex: 1 },
    { id: 'zeno', r: 'legendary', name: 'Zenobia', ex: 1 },
    { id: 'zl', r: 'legendary', name: 'Zhuge Liang', ex: 1 },
    { id: 'aethel', r: 'legendary', name: 'Æthelflæd', ex: 1 },
    { id: 'baibars', r: 'epic', name: 'Baibars', ex: 1 },
    { id: 'beliepic', r: 'epic', name: 'Belisarius (Episch)', ex: 1 },
    { id: 'boudicaepic', r: 'epic', name: 'Boudica (Episch)', ex: 1 },
    { id: 'diaochan', r: 'epic', name: 'Diaochan', ex: 1 },
    { id: 'hermannepic', r: 'epic', name: 'Hermann (Episch)', ex: 1 },
    { id: 'imhotep', r: 'epic', name: 'Imhotep', ex: 1 },
    { id: 'joanepic', r: 'epic', name: 'Jeanne d’Arc (Episch)', ex: 1 },
    { id: 'catherine', r: 'epic', name: 'Katharina', ex: 1 },
    { id: 'keira', r: 'epic', name: 'Keira', ex: 1 },
    { id: 'kuso', r: 'epic', name: 'Kusunoki Masashige', ex: 1 },
    { id: 'wak', r: 'epic', name: 'Lady Six Sky', ex: 1 },
    { id: 'matilda', r: 'epic', name: 'Mathilde von Flandern', ex: 1 },
    { id: 'narses', r: 'epic', name: 'Narses', ex: 1 },
    { id: 'pelagius', r: 'epic', name: 'Pelagius', ex: 1 },
    { id: 'pericles', r: 'epic', name: 'Perikles', ex: 1 },
    { id: 'scipioepic', r: 'epic', name: 'Scipio (Episch)', ex: 1 },
    { id: 'sunepic', r: 'epic', name: 'Sun Tzu (Episch)', ex: 1 },
    { id: 'tamar', r: 'epic', name: 'Tamar', ex: 1 },
    { id: 'constance', r: 'elite', name: 'Constance' },
    { id: 'gaius', r: 'elite', name: 'Gaius Marius' },
    { id: 'lancelot', r: 'elite', name: 'Lancelot' },
    { id: 'tomoe', r: 'elite', name: 'Tomoe Gozen' },
    { id: 'sarka', r: 'elite', name: 'Šárka' },
    { id: 'dragonlancer', r: 'advanced', name: 'Drachenlanzer' },
    { id: 'markswoman', r: 'advanced', name: 'Schützin' },
    { id: 'citykeeper', r: 'advanced', name: 'Stadtwächter' },
    { id: 'centurion', r: 'advanced', name: 'Zenturio' }
  ];
  const CMD_BY_ID = Object.fromEntries(COMMANDERS.map(c => [c.id, c]));
  R.COMMANDERS = COMMANDERS; R.cmdImg = (id, exp) => cmdImg(id, exp);
  const cmdImg = (id, exp) => { const m = CMD_BY_ID[id]; return (m && m.ex && (exp || m.nb) ? '/icons/comanderexpertise/' : '/icons/comander/') + id + '.webp'; };
  // Ausrüstungs-Bilder in /icons/gear/ (Dateiname ohne .webp) – Grundlage für den Bild-Abgleich beim Screenshot-Scan
  // Typ (Slot) je Bild in /icons/gear/ – für die Auswahl von Hand und als Katalog-Ersatz, solange ein Item nicht in gear_items steht
  const GEAR_FILE_CAT = {"abyssal_visage_purple":"helm","ancestral_mask_of_night":"helm","ancient_stratagems_purple":"accessory","armband_of_the_hellish_wasteland":"gloves","ash_of_the_dawn":"legs","boots_of_the_hellish_wasteland":"boots","call_of_the_loyal_blue":"accessory","chausses_of_the_glorious_goddess":"legs","claws_of_the_forest_guardian_purple":"gloves","cloth_gloves_grey":"gloves","cloud_racers_purple":"boots","commanders_boots":"boots","concealed_dagger":"accessory","crimson_ring_purple":"accessory","dark_lords_blessing_purple":"chest","delanes_amulet_purple":"accessory","diadem_of_the_glorious_goddess":"helm","dragons_breath_boots":"boots","dragons_breath_bow":"weapon","dragons_breath_helm":"helm","dragons_breath_plate":"chest","dragons_breath_tassets":"legs","dragons_breath_vambraces":"gloves","eternal_night":"legs","fanatics_tassets_purple":"legs","fierce_wolfs_helmet":"helm","flame_treads_purple":"boots","frost_treads_purple":"boots","gauntlets_of_the_glorious_goddess":"gloves","gladiator_purple":"legs","gold_helm_of_the_eternal_empire":"helm","golden_age_purple":"weapon","greatest_glory":"accessory","greaves_of_the_eternal_empire":"legs","greaves_of_the_glorious_goddess":"boots","hammer_of_the_sun_and_moon":"weapon","harvester_boots_blue":"boots","harvester_breeches_blue":"legs","harvester_robes_blue":"chest","harvesters_headscarf_blue":"helm","heart_of_the_saint_purple":"weapon","heavy_armor_of_the_hellish_wasteland":"chest","helm_of_the_conqueror":"helm","heros_hilt":"accessory","hope_cloak":"chest","horn_of_fury":"accessory","ians_choice":"gloves","immolating_plume":"accessory","isets_sufferance_purple":"gloves","karuaks_humility_purple":"legs","karuaks_war_drums":"accessory","knights_battleworn_gauntlets_purple":"gloves","knights_oathsworn_bow_purple":"weapon","knights_steel_diadem_purple":"helm","knights_triumphant_tassets_purple":"legs","knights_valorous_cloak_purple":"chest","knights_winter_sabatons_purple":"boots","lance_of_the_hellish_wasteland":"weapon","lohars_bone_necklace_blue":"accessory","lone_wolfs_leather_tassets":"legs","mask_of_the_forest_guardian_purple":"helm","moras_web":"accessory","mountain_crushers":"boots","navars_control":"gloves","pendant_of_eternal_night":"accessory","peters_sickle_purple":"accessory","plate_of_the_eternal_empire":"chest","plate_of_the_glorious_goddess":"chest","pride_of_the_khan":"helm","quinns_soul_purple":"chest","revival_gauntlets_purple":"gloves","revival_helm_purple":"helm","revival_plate_purple":"chest","ring_of_doom":"accessory","roaring_wolfs_claws":"boots","robe_of_the_forest_guardian_purple":"chest","sacred_dominion":"weapon","sacred_grips":"gloves","saddle_of_a_thousand_blessings":"accessory","sakura_fubuki_purple":"weapon","savage_totem_blue":"accessory","scepter_of_the_forest_guardian_purple":"weapon","scepter_of_the_glorious_goddess":"weapon","scolas_lucky_coin":"accessory","seths_brutality_purple":"gloves","seths_call":"accessory","shadow_legions_retribution":"chest","sharp_longsword_grey":"weapon","shield_of_the_eternal_empire":"weapon","shios_return":"boots","silent_trial_purple":"accessory","sturdy_boots_of_the_eternal_empire":"boots","tassets_of_the_hellish_wasteland":"legs","tassets_of_the_war_god":"legs","the_bards_pendant_purple":"accessory","the_hydras_blast":"weapon","the_milky_way":"chest","timeless_amber":"accessory","twilight_epiphany":"weapon","vambraces_of_the_eternal_empire":"gloves","vengeance":"accessory","vigilant_wolfs_leather_armor":"chest","wailing_wolfs_gauntlets":"gloves","war_helm_of_the_hellish_wasteland":"helm","wind_scars_purple":"accessory","witchs_lineage_purple":"helm"}; R.GEAR_FILE_CAT = GEAR_FILE_CAT;
  R.GEAR_FILES = Object.keys(GEAR_FILE_CAT).sort();
  R.GEAR_FILE_SET = new Set(R.GEAR_FILES);
  const gearFileName = (f) => f.replace(/_(purple|blue|grey|green)$/, '').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '); R.gearFileName = gearFileName;
  const gearFileRar = (f) => /_purple$/.test(f) ? 'epic' : /_blue$/.test(f) ? 'elite' : /_(grey|gray|green)$/.test(f) ? 'normal' : 'legendary'; R.gearFileRar = gearFileRar;
  const gearIconStem = (icon) => { const m = String(icon || '').match(/^\/icons\/(?:gear\/)?([A-Za-z0-9_-]+)\.(?:webp|png|jpe?g)$/); return m ? m[1] : ''; }; R.gearIconStem = gearIconStem;
  function gearIconFor(icon, name, rarity) {            // passendes Bild aus /icons/gear/ (auch wenn in gear_items kein oder ein alter Pfad steht)
    const st = gearIconStem(icon); if (st && R.GEAR_FILE_SET.has(st)) return `/icons/gear/${st}.webp`;
    const slug = String(name || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/['’`´]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const hit = [rarity === 'epic' ? slug + '_purple' : '', slug, slug + '_purple'].find(x => x && R.GEAR_FILE_SET.has(x));
    return hit ? `/icons/gear/${hit}.webp` : (icon || '');
  }
  // ---- Referenztafeln für den Screenshot-Abgleich: alle Bilder nummeriert auf einem Blatt, Claude vergleicht damit ----
  const refCache = {}; R.refCache = refCache;
  const GEAR_REF_CATS = ['helm', 'chest', 'weapon', 'gloves', 'legs', 'accessory', 'boots'];
  const GEAR_REF_LABEL = { helm: 'HELM → Feld helm', chest: 'BRUST / CHEST → Feld chest', weapon: 'WAFFE / WEAPON → Feld weapon', gloves: 'HANDSCHUHE / GLOVES → Feld gloves',
    legs: 'BEINE / LEGS → Feld legs', accessory: 'ACCESSOIRE → Felder acc1 + acc2', boots: 'STIEFEL / BOOTS → Feld boots' };
  const GEAR_RAR_ORDER = ['legendary', 'epic', 'elite', 'normal'];
  const gearRefOrder = () => GEAR_REF_CATS.flatMap(c => R.GEAR_FILES.filter(f => (GEAR_FILE_CAT[f] || 'accessory') === c)
    .sort((a, b) => GEAR_RAR_ORDER.indexOf(gearFileRar(a)) - GEAR_RAR_ORDER.indexOf(gearFileRar(b)) || a.localeCompare(b))); R.gearRefOrder = gearRefOrder;
  const REF_BG = { legendary: ['#ffc845', '#e0700a'], epic: ['#c58cff', '#6a1fb0'], elite: ['#8ec5ff', '#1d4ed8'], normal: ['#cbd5e1', '#64748b'] };
  function refSheet(kind) {
    if (refCache[kind]) return refCache[kind];
    return (refCache[kind] = (async () => {
      const gearK = kind === 'gear' || kind === 'gear2', part2 = kind === 'gear2';   // Ausrüstung auf 2 Tafeln, damit die Bilder groß genug bleiben
      const load = (src) => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
      let cv, ctx, note = '', count = 0, yEnd = 0;
      if (gearK) {
        // Ausrüstung: Abschnitte je Slot-Typ, große Kacheln mit Nummer und Name – so kann Claude nur innerhalb des passenden Typs wählen
        const order = gearRefOrder(), cols = 12, cell = 104, lab = 14, head = 26;
        const imgs = await Promise.all(order.map(f => load(`/icons/gear/${f}.webp`)));
        if (!imgs.some(Boolean)) { delete refCache[kind]; return null; }
        const cats = part2 ? ['legs', 'accessory', 'boots'] : ['helm', 'chest', 'weapon', 'gloves'];
        const groups = GEAR_REF_CATS.filter(c => cats.includes(c)).map(c => [c, order.map((f, n) => [f, n]).filter(([f]) => (GEAR_FILE_CAT[f] || 'accessory') === c)]).filter(([, l]) => l.length);
        const H = groups.reduce((h, [, l]) => h + head + Math.ceil(l.length / cols) * (cell + lab), 0) + (part2 ? 160 : 0);
        cv = document.createElement('canvas'); cv.width = cols * cell; cv.height = H;
        ctx = cv.getContext('2d'); ctx.fillStyle = '#1b2233'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.textBaseline = 'top';
        let y = 0; const parts = [];
        groups.forEach(([c, l]) => {
          ctx.fillStyle = '#0d1220'; ctx.fillRect(0, y, cv.width, head);
          ctx.fillStyle = '#7dd3fc'; ctx.font = 'bold 16px sans-serif'; ctx.fillText(`${GEAR_REF_LABEL[c]}   (Nr. ${l[0][1] + 1}–${l[l.length - 1][1] + 1})`, 8, y + 5);
          parts.push(`${c}: Nr. ${l[0][1] + 1}–${l[l.length - 1][1] + 1}`);
          y += head;
          l.forEach(([f, n], k) => {
            const x = (k % cols) * cell, yy = y + Math.floor(k / cols) * (cell + lab);
            ctx.strokeStyle = '#3a4560'; ctx.strokeRect(x + .5, yy + .5, cell - 1, cell + lab - 1);
            const bg = REF_BG[gearFileRar(f)], g = ctx.createLinearGradient(0, yy + 4, 0, yy + cell - 4); g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1]);
            ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x + cell / 2, yy + 3); ctx.lineTo(x + cell - 3, yy + cell / 2); ctx.lineTo(x + cell / 2, yy + cell - 3); ctx.lineTo(x + 3, yy + cell / 2); ctx.closePath(); ctx.fill();
            if (imgs[n]) ctx.drawImage(imgs[n], x + 14, yy + 14, cell - 28, cell - 28);
            ctx.fillStyle = '#000'; ctx.fillRect(x + 1, yy + 1, 32, 18);
            ctx.fillStyle = '#ffe066'; ctx.font = 'bold 15px sans-serif'; ctx.fillText(String(n + 1), x + 3, yy + 3);
            ctx.fillStyle = '#e2e8f0'; ctx.font = '10px sans-serif'; ctx.fillText(gearFileName(f), x + 3, yy + cell + 1, cell - 6);
          });
          y += Math.ceil(l.length / cols) * (cell + lab);
        });
        note = parts.join('; '); count = order.length; yEnd = y;
      } else {
        const list = COMMANDERS.map(c => ({ src: cmdImg(c.id), label: c.name }));
        const cols = 14, cell = 90, lab = 15, rows = Math.ceil(list.length / cols);
        const imgs = await Promise.all(list.map(x => load(x.src)));
        if (!imgs.some(Boolean)) { delete refCache[kind]; return null; }
        cv = document.createElement('canvas'); cv.width = cols * cell; cv.height = rows * (cell + lab);
        ctx = cv.getContext('2d'); ctx.fillStyle = '#1b2233'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.textBaseline = 'top';
        imgs.forEach((im, i) => {
          const x = (i % cols) * cell, y = Math.floor(i / cols) * (cell + lab);
          ctx.strokeStyle = '#3a4560'; ctx.strokeRect(x + .5, y + .5, cell - 1, cell + lab - 1);
          if (im) ctx.drawImage(im, x + 6, y + 6, cell - 12, cell - 12);
          ctx.fillStyle = '#000'; ctx.fillRect(x + 1, y + 1, 30, 18);
          ctx.fillStyle = '#ffe066'; ctx.font = 'bold 15px sans-serif'; ctx.fillText(String(i + 1), x + 3, y + 3);
          ctx.fillStyle = '#ffffff'; ctx.font = '11px sans-serif'; ctx.fillText(list[i].label, x + 3, y + cell + 1, cell - 6);
        });
        count = list.length;
      }
      const refImgs = part2 ? await Promise.all(Object.values(R.REFTYPES).map(t => load(t.img))) : [];   // Legende: Refine voll vs. nicht voll
      if (part2) {
        const y0 = yEnd + 8, keys = Object.keys(R.REFTYPES);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 15px sans-serif';
        ctx.fillText('REFINE-LEGENDE  (Symbol unten rechts im Feld)', 8, y0);
        [['FERTIG = refine_full true (komplett rot)', ''], ['NICHT FERTIG = false (grau / teilweise rot)', 'grayscale(1) brightness(.75)']].forEach(([txt, flt], row) => {
          const y = y0 + 24 + row * 60;
          ctx.fillStyle = row ? '#cbd5e1' : '#fca5a5'; ctx.font = 'bold 13px sans-serif'; ctx.fillText(txt, 8, y + 18);
          refImgs.forEach((im, i) => { if (!im) return; ctx.filter = flt || 'none'; ctx.drawImage(im, 330 + i * 120, y, 48, 48); ctx.filter = 'none';
            ctx.fillStyle = '#94a3b8'; ctx.font = '11px sans-serif'; ctx.fillText(keys[i], 382 + i * 120, y + 18); });
        });
      }
      const url = cv.toDataURL('image/jpeg', 0.82);
      return { kind, media_type: 'image/jpeg', data: url.split(',')[1], count, note };
    })());
  }
  async function scanRefs(kinds) { const out = []; for (const k of kinds) { try { const r = await refSheet(k); if (r) out.push(r); } catch {} } return out; }
  const refNum = (v, n) => { const x = Math.round(+v); return Number.isFinite(x) && x >= 1 && x <= n ? x : 0; }; R.refNum = refNum;
  function cmdFromScan(c) {                                // { ref, name, expertise } → Kommandant aus dem Katalog
    if (!c || typeof c !== 'object') return null;
    let m = COMMANDERS[refNum(c.ref, COMMANDERS.length) - 1] || null;
    if (!m && c.name) { const k = scKey(c.name); m = COMMANDERS.find(x => scKey(x.name) === k) || COMMANDERS.find(x => k.length > 3 && scKey(x.name).includes(k)) || null; }
    return m ? scCmdNorm({ id: m.id, exp: !!c.expertise }) : null;
  }
  const SC_RAR = {
    legendary: { label: 'Legendär',        c: '#f5c542' },
    epic:      { label: 'Episch',          c: '#c084fc' },
    elite:     { label: 'Elite',           c: '#60a5fa' },
    advanced:  { label: 'Fortgeschritten', c: '#4ade80' }
  };
  const scInt = (v, lo, hi, d) => { if (v == null || v === '') return d; const n = Math.round(+String(v).replace(/[^\d.-]/g, '')); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
  const scSkills = (v) => { let a = Array.isArray(v) ? v : (String(v ?? '').match(/\d/g) || []); a = a.slice(0, 4).map(x => scInt(x, 0, 5, 1)); while (a.length < 4) a.push(1); return a; };
  const scKey = (n) => String(n || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '');
  const gRar = (v) => ['legendary', 'epic', 'elite', 'normal'].includes(v) ? v : 'legendary'; R.gRar = gRar;
  const scIconOk = (v) => typeof v === 'string' && /^\/icons\/[A-Za-z0-9_./-]+\.(webp|png|jpe?g)$/.test(v) ? v : '';
  const scCmdNorm = (c) => c && CMD_BY_ID[c.id] ? { id: c.id, exp: !!(CMD_BY_ID[c.id].ex && (c.exp || CMD_BY_ID[c.id].nb)), level: scInt(c.level, 1, 60, 60), skills: scSkills(c.skills), awakened: !!c.awakened } : null;
  const scGearNorm = (g) => Object.fromEntries(R.GEAR_SLOTS.map(sl => { const v = g?.[sl.k] || {};
    return [sl.k, { item: String(v.item || ''), name: String(v.name || '').slice(0, 60), icon: scIconOk(v.icon), rarity: gRar(v.rarity),
      tier: R.gTier(v.tier), refine: R.gRefine(v.refine), refType: R.gRefType(v.refType) }]; }));
  // Hintergründe: Vorlagen (Farbverläufe) oder ein eigenes, verkleinertes Bild (JPEG als data-URL)
  const SC_BGS = {
    none:   { label: 'Standard',  css: '' },
    gold:   { label: 'Gold',      css: 'radial-gradient(120% 85% at 50% 0%, rgba(245,197,66,.42), transparent 62%), linear-gradient(180deg,#3a2706,#0c1019)' },
    night:  { label: 'Nacht',     css: 'radial-gradient(110% 80% at 50% 0%, rgba(56,189,248,.32), transparent 60%), linear-gradient(180deg,#0b1d3a,#07090f)' },
    blood:  { label: 'Blut',      css: 'radial-gradient(110% 80% at 50% 0%, rgba(239,68,68,.40), transparent 60%), linear-gradient(180deg,#330c0c,#07090f)' },
    forest: { label: 'Wald',      css: 'radial-gradient(110% 80% at 50% 0%, rgba(74,222,128,.30), transparent 60%), linear-gradient(180deg,#0c2a17,#07090f)' },
    royal:  { label: 'Königlich', css: 'radial-gradient(110% 80% at 50% 0%, rgba(192,132,252,.38), transparent 60%), linear-gradient(180deg,#26103d,#07090f)' },
    desert: { label: 'Wüste',     css: 'radial-gradient(120% 85% at 50% 0%, rgba(251,191,36,.30), transparent 60%), linear-gradient(180deg,#5a3a17,#1a1208)' }
  };
  // Datenmodell (Spalte leaderboard.showcase + Kopie im user_state):
  // { v: 3, active, list: [ { id, title, bg, h, grid, els: { avatar|name|tag|vip|power|kp|merit: {on,x,y,s,color,box,shadow} },
  //   sets: [ { id, name, mode: 'manual'|'shot', shot, cmd:[2], gear:{…}, x, y, s, arm: { on, x, y, s, formation, insc:[{t,c}], troop, atk, def, hp, spd } } ] } ], updated }
  // Bilder (Hintergrund, Set-Screenshots) liegen im Supabase-Storage (Bucket "showcase"), sonst als verkleinertes JPEG direkt im Showcase.
  const SC_KEY = 'rok_scanner_showcase';
  const SC_SLOTS = ['Primär', 'Sekundär'];
  // Raster: 1 Kästchen = SC_G (cqw). Bei 100 %: Gear-Set 4 × 9 Kästchen, Rüstung 4 breit, City-Skin 3 × 3, Profilbild 2 × 2, Werte 5 × 2
  const SC_HEAD_H = 4;                                       // Kopfzeile: immer 4 Kästchen reserviert
  const SC_SET_TOP = 1;                                      // Standard: Set-Oberkante so viele Kästchen unter der Kopfzeile (Full Sync = 100 %)
  const SC_G = 100 / 36, SC_MAX = 7,   // 36 Kästchen Breite: 7 Sets à 4 + 6 Lücken à 1 + Rand 1 links/rechts
   SC_COLS = 7, SC_MAX_LIST = 5, SC_SET_W = 4 * SC_G, SC_SHOT_W = 17, SC_STEP = SC_G / 2;
  const SC_IMG_BASE = RokAuth.imgBase();
  const scImgOk = (v) => typeof v === 'string' && ((v.length < 400 && v.startsWith(SC_IMG_BASE) && /^[A-Za-z0-9/_.:?=&-]+$/.test(v))
    || (v.length < 520000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(v)));
  const SC_PICS = ["burning-harbor-standoff.webp", "dolphin-coral-reef (1).webp", "frontier-camp-brawl.webp", "hillside-cavalry-charge.webp", "jungle-temple-guardians.webp", "pharaoh-triumph-parade.webp", "sky-whale-frozen-lake.webp", "smoldering-castle-siege.webp", "spartan-battle-fury.webp", "spartan-desert-charge.webp", "sun-moon-stained-glass.webp", "supporter-amethyst-aurora.webp", "violet-lightning-tree.webp", "war-table-braziers.webp", "warriors-face-off.webp"];   // Vorlagen in /icons/showcase pictures/
  const SC_PIC_DIR = 'showcase%20pictures';                 // GitHub-Ordner icons/showcase pictures
  const scPicUrl = (id) => `/icons/${SC_PIC_DIR}/` + encodeURIComponent(id);
  const SC_GAL_MAX = 10;
  const scBgNorm = (b) => b?.type === 'lib' && /^[a-z0-9() _.-]{1,80}\.(webp|png|jpe?g)$/i.test(b.id || '') ? { type: 'lib', id: b.id } : b?.type === 'img' && scImgOk(b.src) ? { type: 'img', src: b.src } : { type: 'preset', id: SC_BGS[b?.id] ? b.id : 'none' };
  const SC_HEIGHTS = { compact: { label: 'Kompakt', h: 60 }, normal: { label: 'Normal', h: 75 }, tall: { label: 'Hoch', h: 95 }, xl: { label: 'Sehr hoch', h: 120 }, xxl: { label: 'Extra hoch', h: 150 } };
  const SC_ELS = {
    avatar: { label: 'Profilbild',  icon: '🖼', w: 8 },
    name:   { label: 'Name',        icon: '✒️', w: 22 },
    tag:    { label: 'Allianz-Tag', icon: '🏷', w: 10 },
    kd:     { label: 'Königreich',  icon: '🏰', w: 13 },
    vip:    { label: 'VIP',         icon: '👑', w: 11 },
    skin:   { label: 'City-Skin',   icon: '🏯', w: 8 },
    power:  { label: 'Energie',     icon: '⚡', w: 16 },
    kp:     { label: 'Kill-Punkte', icon: '⚔️', w: 16 },
    merit:  { label: 'Verdienst',   icon: '🏅', w: 16 }
  };
  const SC_TROOPS = { infantry: 'Infanterie', cavalry: 'Kavallerie', archer: 'Bogenschützen', siege: 'Belagerung', all: 'Alle Truppen' };
  const SC_ARM_STATS = [['atk', 'Angriff'], ['def', 'Verteidigung'], ['hp', 'Leben'], ['spd', 'Marschgeschw.'], ['dmg', 'Gesamtschaden']];   // dmg = „All Damage“ (gilt für alle Truppen)
  const SC_INSC = {
    gold: { label: 'Gold',  bg: 'linear-gradient(180deg,#fde68a,#f8b62c 55%,#e58a0e)', fg: '#7a2e08', bd: '#fff3c4' },
    blue: { label: 'Blau',  bg: 'linear-gradient(180deg,#e0e7ff,#aab6fb 55%,#7f8ef0)', fg: '#1f2f80', bd: '#f0f3ff' },
    gray: { label: 'Grau',  bg: 'linear-gradient(180deg,#f1f5f9,#cbd5e1 55%,#94a3b8)', fg: '#1f2937', bd: '#f8fafc' }
  };
  const scH = (d) => SC_HEIGHTS[d.h].h;
  const SC_GRID_C = { gold: { label: 'Gold', c: 'rgba(245,197,66,.22)', m: 'rgba(245,197,66,.7)' }, white: { label: 'Weiß', c: 'rgba(255,255,255,.35)', m: 'rgba(255,255,255,.85)' },
    orange: { label: 'Orange', c: 'rgba(249,115,22,.45)', m: 'rgba(249,115,22,.95)' }, black: { label: 'Schwarz', c: 'rgba(0,0,0,.45)', m: 'rgba(0,0,0,.85)' } };
  const scGridSnap = (v) => Math.sign(v) * Math.round(Math.abs(v) / SC_STEP) * SC_STEP;   // symmetrisch zur Mitte
  const scPos = (v, max) => { if (v == null || v === '') return null; const n = +v; return Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : null; };
  const scScale = (v) => { const n = +v; return Number.isFinite(n) && n > 0 ? Math.min(4, Math.max(0.3, n)) : 1; };
  const scColor = (v) => /^#[0-9a-f]{6}$/i.test(v || '') ? v.toLowerCase() : '';
  const scNum1 = (v) => { if (v == null || v === '') return null; const n = Math.round(parseFloat(String(v).replace(',', '.')) * 10) / 10; return Number.isFinite(n) ? Math.min(999, Math.max(-999, n)) : null; };
  const scRot = (v) => { let n = Math.round(+v || 0) % 360; if (n > 180) n -= 360; if (n < -180) n += 360; return n; };   // Drehung −180 … +180°
  const scElNorm = (w) => { const off = w?.box === false;                 // altes "box: false" = ohne Füllung und Rand
    const fo = w?.fillO == null || w?.fillO === '' ? NaN : +w.fillO;
    return { free: !!w?.free, on: !!w?.on, x: scPos(w?.x, 100), y: scPos(w?.y, 200), s: scScale(w?.s), color: scColor(w?.color), shadow: w?.shadow !== false,
      fill: w?.fill === 'none' || (off && w?.fill == null) ? 'none' : scColor(w?.fill), fillO: Number.isFinite(fo) ? Math.min(100, Math.max(0, Math.round(fo))) : 75,
      border: w?.border === 'none' || (off && w?.border == null) ? 'none' : scColor(w?.border), bw: Math.min(10, Math.max(0, Math.round(+w?.bw || 0))), r: scRot(w?.r), ni: !!w?.ni, round: !!w?.round, fz: scInt(w?.fz, 70, 150, 100), frame: typeof w?.frame === 'string' && /^[a-z0-9() _-]{1,60}$/i.test(w.frame) ? w.frame : '', text: '' }; };   // ni = ohne Symbol (Königreich / VIP)
  // eigene Texte im Showcase (ohne Box als Standard) · City-Skin: Katalog-Bild oder eigenes Bild
  const scTxNorm = (t) => ({ ...scElNorm({ ...t, on: true, fill: t?.fill ?? 'none', border: t?.border ?? 'none' }), id: String(t?.id || R.newId()), text: String(t?.text ?? 'Text').slice(0, 80) });
  const scSkinFix = (v) => v === '/icons/skins/skin_01.webp' || v === '/icons/city%20skins/Hawa%20Mahal.png' ? '/icons/city%20skins/hawa-mahal.webp' : v;   // alte Dateinamen umleiten
  const scSkinOk = (v) => typeof v === 'string' && v.length < 200 && /^\/icons\/city%20skins\/[A-Za-z0-9_.%()-]+\.(png|webp|jpe?g)$/i.test(v);   // nur RoK-Skins aus dem Katalog
  const scRgba = (h, a) => `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;

  // ---- Rüstungs-Daten (Armaments): Inschriften je Typ + Rüstungen je Formation (gold = besondere, blau = seltene, grau = normale Inschrift) ----
  const ARM_TYPES = { flag: { label: 'Flagge', icon: '🚩' }, emblem: { label: 'Emblem', icon: '🛡' }, scroll: { label: 'Schriftrolle', icon: '📜' }, instrument: { label: 'Instrument', icon: '📯' } };
  const ARM_POOL = {
    flag: ['Spiked', 'Metallics', 'Vitality', 'Galloping', 'Cleanser', 'Striker', 'Rebuff', 'Brawler', 'Warflames', 'Eclipsed', 'Brave', 'Strategic', 'Desperado', 'Cohesive', 'Pursuer', 'Assertive', 'Wary', 'Siegework', 'Sentries', 'Ballistics'],
    emblem: ['Infamy', 'Shielded', 'Hardy', 'Haste', 'Pacifier', 'Militant', 'Resistant', 'Daring', 'Elite', 'Evasive', 'Smite', 'Enduring', 'Artisan', 'Rapacious', 'Guardians', 'Counterer', 'Deflecter', 'Watchmen', 'Lineshot'],
    scroll: ['Warcry', 'Well Clad', 'Robust', 'Swift', 'Payback', 'Onslaught', 'Retaliator', 'Enraged', 'Valiant', 'Iron Wall', 'Bellicose', 'Pulverize', 'Breaker', 'Furious', 'Ward', 'Phalanx', 'Hurried', 'Tremors', 'Calm', 'Loosed'],
    instrument: ['Brutal', 'Armored', 'Fit', 'Fine Horse', 'Annexer', 'Warhunger', 'Alert', 'Devious', 'Fearsome', 'Evasive', 'Requital', 'Respite', 'Guarded', 'Embattled', 'Vengeful', 'Patronage', 'Primed', 'Uplifting', 'Spirited', 'Bluster']
  };
  const ARM_FORMATIONS = {
    Pincer: [
      { id: 'banner_nine', type: 'flag',       name: 'Banner of the Nine Cauldrons', gold: 'Airtight',    blue: 'Hardheaded' },
      { id: 'banner_tiger', type: 'flag',      name: 'Tiger Tally Banner',           gold: 'Bulwark',     blue: 'Bolstered' },
      { id: 'seal_nine', type: 'emblem',       name: 'Seal of the Nine Cauldrons',   gold: 'Thundering',  blue: 'Rattling' },
      { id: 'seal_tiger', type: 'emblem',      name: 'Tiger Tally Seal',             gold: 'Tidebreaker', blue: 'Vigor' },
      { id: 'annals_nine', type: 'scroll',     name: 'Annals of the Nine Cauldrons', gold: 'Toppler',     blue: 'Imploder' },
      { id: 'edict_tiger', type: 'scroll',     name: 'Tiger Tally Edict',            gold: 'Dominate',    blue: 'Bludgeon' },
      { id: 'rite_nine', type: 'instrument',   name: 'Rite of the Nine Cauldrons',   gold: 'Demolisher',  blue: 'Raider' },
      { id: 'horn_tiger', type: 'instrument',  name: 'Tiger Tally Horn',             gold: 'Cleaver',     blue: 'Charge' }
    ],
    Delta: [
      { id: 'leonine_rampant', type: 'flag',       name: 'Leonine Rampant',   gold: 'Steelskin',        blue: 'Determined' },
      { id: 'leonine_crest', type: 'emblem',       name: 'Leonine Crest',     gold: 'Flurry',           blue: 'Relentless' },
      { id: 'leonine_chronicle', type: 'scroll',   name: 'Leonine Chronicle', gold: 'Thrasher',         blue: 'Pummeler' },
      { id: 'leonine_pibroch', type: 'instrument', name: 'Leonine Pibroch',   gold: 'Butterfly Effect', blue: 'Causative' }
    ],
    Wedge: [
      { id: 'herald_ensign', type: 'flag',          name: "Herald's Ensign",        gold: 'Maneuver Warfare',  blue: 'Ballista' },
      { id: 'pantheon_banner', type: 'flag',        name: 'Banner of the Pantheon', gold: 'Balanced',          blue: 'Defiant' },
      { id: 'herald_mark', type: 'emblem',          name: "Herald's Mark",          gold: 'Horseback Archery', blue: 'Divine Strength' },
      { id: 'pantheon_honors', type: 'emblem',      name: 'Honors of the Pantheon', gold: 'Intrepid',          blue: 'Focus Fire' },
      { id: 'herald_message', type: 'scroll',       name: "Herald's Message",       gold: 'Advantageous',      blue: 'Fury' },
      { id: 'olympia_epics', type: 'scroll',        name: 'Epics of Olympia',       gold: 'Hunter',            blue: 'Crazed' },
      { id: 'herald_instrument', type: 'instrument', name: "Herald's Instrument",   gold: 'Indomitable',       blue: 'Soar' },
      { id: 'olympia_chorus', type: 'instrument',   name: "Olympia's Chorusmaster", gold: 'Unstoppable',       blue: 'Boiling Blood' }
    ]
  };
  const ARM_BY_ID = Object.fromEntries(Object.values(ARM_FORMATIONS).flat().map(x => [x.id, x]));
  const ARM_ORDER = { gold: 0, blue: 1, gray: 2 };
  const scInscKey = (t) => String(t || '').toLowerCase().replace(/[^a-z]/g, '');
  const ARM_KNOWN = (() => { const m = {};
    Object.values(ARM_POOL).flat().forEach(t => { m[scInscKey(t)] = { t, c: 'gray' }; });
    Object.values(ARM_FORMATIONS).flat().forEach(x => { m[scInscKey(x.gold)] = { t: x.gold, c: 'gold' }; m[scInscKey(x.blue)] = { t: x.blue, c: 'blue' }; });
    return m; })();
  const scInscKnown = (t) => { const k = scInscKey(t); if (!k) return null;      // auch abgeschnittene Namen ("Retaliato…")
    return ARM_KNOWN[k] || (k.length >= 4 ? Object.entries(ARM_KNOWN).find(([n]) => n.startsWith(k))?.[1] : null) || null; };
  const scInscSort = (l) => l.sort((x, y) => (ARM_ORDER[x.c] ?? 3) - (ARM_ORDER[y.c] ?? 3));
  const scArmNorm = (a) => ({ free: !!a?.free, cols: a?.cols === 2 ? 2 : 1, on: !!a?.on, fsep: !!a?.fsep, fpos: ['above', 'hidden'].includes(a?.fpos) ? a.fpos : 'below', fm: { x: scPos(a?.fm?.x, 100), y: scPos(a?.fm?.y, 200), s: scScale(a?.fm?.s), r: scRot(a?.fm?.r) }, x: scPos(a?.x, 100), y: scPos(a?.y, 200), s: scScale(a?.s), r: scRot(a?.r), formation: String(a?.formation || '').slice(0, 30),
    insc: (Array.isArray(a?.insc) ? a.insc : []).slice(0, 12).map(i => ({ t: String(i?.t || '').slice(0, 24), c: SC_INSC[i?.c] ? i.c : 'gold' })),
    arms: Object.fromEntries(Object.keys(ARM_TYPES).map(k => [k, ARM_BY_ID[a?.arms?.[k]]?.type === k ? a.arms[k] : ''])),
    troop: SC_TROOPS[a?.troop] ? a.troop : 'infantry', ...Object.fromEntries(SC_ARM_STATS.map(([k]) => [k, scNum1(a?.[k])])) });
  R.armData = { TYPES: ARM_TYPES, POOL: ARM_POOL, FORMATIONS: ARM_FORMATIONS, BY_ID: ARM_BY_ID, INSC: SC_INSC, STATS: SC_ARM_STATS, TROOPS: SC_TROOPS, known: (t) => scInscKnown(t) };   // für Craft → Charakter bearbeiten
  const scArmHas = (a) => a.insc.some(i => i.t) || !!a.formation || SC_ARM_STATS.some(([k]) => a[k]);
  const scArmVis = (a) => a.insc.some(i => i.t) || !!a.formation;                  // Rüstungs-Element (Inschriften + Formation)
  const scStHas = (a) => SC_ARM_STATS.some(([k]) => a[k]);                          // Werte-Element (Angriff, Verteidigung …)
  const SC_AL = { left: '⬅ Links', center: '↔ Mitte', right: '➡ Rechts' };
  const scStNorm = (t, a) => ({ free: !!t?.free, on: t ? !!t.on : !!a?.on, x: scPos(t?.x, 100), y: scPos(t?.y, 200), s: t ? scScale(t.s) : scScale(a?.s), r: scRot(t?.r),
    al: SC_AL[t?.al] ? t.al : 'left', nt: !!t?.nt });                                // al = Ausrichtung der Schrift · nt = ohne Truppentyp („Attack“ statt „Archer Attack“)
  // Expertise-Rahmen und Iconic-Stufe je Set: fr = Gold-Rahmen, fp = Lila-Rahmen (episch), fs = Rahmengröße, r* = Refine-Symbol, t* = Iconic-Symbol (alles in % der Raute)
  const SC_GFX_DEF = { pt: true, fw: 50, fh: 0, fr: '', fp: '', fs: 100, rx: 64, ry: 70, rs: 16, tx: 50, ty: 91, ts: 44 };
  const scGfxNorm = (g) => { const n = (k, lo, hi) => scInt(g?.[k], lo, hi, SC_GFX_DEF[k]), id = (v) => typeof v === 'string' && /^[A-Za-z0-9_. ()-]{1,80}$/.test(v) ? v : '';
    return { pt: g?.pt !== false, fw: n('fw', 0, 100), fh: n('fh', -100, 100), fr: id(g?.fr), fp: id(g?.fp), fs: n('fs', 60, 150), rx: n('rx', 0, 100), ry: n('ry', 0, 100), rs: n('rs', 8, 40), tx: n('tx', 0, 100), ty: n('ty', 0, 100), ts: n('ts', 15, 90) }; };
  // Freies Set: Kommandanten (c), Namen (n) und Ausrüstung (g) als eigene Elemente auf der Bühne
  const SY_KEYS = [['c', '👤 Kommandanten'], ['n', '🔤 Namen'], ['g', '🛡 Ausrüstung'], ['arm', '⚔ Rüstung'], ['fm', '🔰 Formation'], ['st', '📊 Werte']];
  const scSyNorm = (o) => Object.fromEntries(SY_KEYS.map(([k]) => [k, o?.[k] !== false]));
  // syncMode: 'full' | 'partial' | 'free' · sy = Checkboxen · dock = relative Position abgedockter Teile zur Haupt-Gruppe
  const SC_MODES = ['full', 'partial', 'free'];
  const scModeOf = (x) => SC_MODES.includes(x?.syncMode) ? x.syncMode : (x?.lock === false || (x?.lock == null && x?.split)) ? 'free' : x?.split ? 'partial' : 'full';
  const scDockNorm = (o) => Object.fromEntries(Object.entries(o && typeof o === 'object' ? o : {})
    .filter(([k, v]) => SY_KEYS.some(([q]) => q === k) && isFinite(+v?.dx) && isFinite(+v?.dy)).map(([k, v]) => [k, { dx: +v.dx, dy: +v.dy }]));
  const scBound = (x, k) => x.syncMode === 'full' || (x.syncMode === 'partial' && !!x.sy?.[k]);   // je Modul eigene Abfrage
  const scPartsNorm = (p) => Object.fromEntries(['c', 'n', 'g'].map(k => [k, { x: scPos(p?.[k]?.x, 100), y: scPos(p?.[k]?.y, 200), s: scScale(p?.[k]?.s), r: scRot(p?.[k]?.r) }]));
  // Charakter-Profil (Bild mit Charakter, Hintergrund und Runensäulen) je Set
  const scProfNum = (v, lo, hi, d) => { const n = +v; return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n * 10) / 10)) : d; };
  const scProfNorm = (p) => ({ char: String(p?.char || '').slice(0, 40), bg: typeof p?.bg === 'string' ? p.bg.slice(0, 40) : 'img:lava', stones: p?.stones !== false,
    bgY: scProfNum(p?.bgY, -12, 12, 0), chY: scProfNum(p?.chY, -20, 20, 0), chS: scProfNum(p?.chS, 0.7, 1.25, 1),
    pts: Object.fromEntries(Object.entries(p?.pts || {}).filter(([k, v]) => R.GEAR_SLOTS?.some(sl => sl.k === k) && Array.isArray(v)).map(([k, v]) => [k, [scProfNum(v[0], 0, 100, 50), scProfNum(v[1], 0, 100, 50)]])),
    flip: Object.fromEntries(['flag', 'emblem', 'scroll', 'instrument'].map(k => [k, [-8, 0, 8].includes(+p?.flip?.[k]) ? +p.flip[k] : 0])),
    lines: p?.lines !== false,   // Linien vom Feld zum Körper
    order: [...new Set((Array.isArray(p?.order) ? p.order : []).filter(k => ['flag', 'emblem', 'scroll', 'instrument'].includes(k)))],   // Säulen links → rechts
    gfx: p?.gfx && typeof p.gfx === 'object' ? { ...(typeof p.gfx.fr === 'string' ? { fr: p.gfx.fr.slice(0, 60) } : {}), ...(typeof p.gfx.fp === 'string' ? { fp: p.gfx.fp.slice(0, 60) } : {}), ...(typeof p.gfx.pt === 'boolean' ? { pt: p.gfx.pt } : {}) } : {} });   // eigene Rahmen/Partikel nur für dieses Bild
  const scSetNorm = (x) => scStMigrate(x, { id: String(x?.id || R.newId()), name: String(x?.name || '').trim().slice(0, 30), mode: 'manual',
    shot: scImgOk(x?.shot) ? x.shot : '', cmd: [0, 1].map(i => scCmdNorm(x?.cmd?.[i])), gear: scGearNorm(x?.gear),
    x: scPos(x?.x, 100), y: scPos(x?.y, 200), s: scScale(x?.s), r: scRot(x?.r), arm: scArmNorm(x?.arm), priv: false, cg: scInt(x?.cg, 0, 70, 32),
    st: scStNorm(x?.st, x?.arm), gfx: scGfxNorm(x?.gfx), free: !!x?.free,
    heads: !!x?.heads, hideEmpty: !!x?.hideEmpty, gearOn: !!x?.gearOn,
    cm: x?.cm !== false, cn: x?.cn !== false, nc: scColor(x?.nc), split: !!x?.split, parts: scPartsNorm(x?.parts), sy: scSyNorm(x?.sy), syncMode: scModeOf(x), lock: scModeOf(x) !== 'free', dock: scDockNorm(x?.dock),
    prof: scProfNorm(x?.prof),
    link: (Array.isArray(x?.link) ? x.link : []).map(String).slice(0, 20), kind: ['garrison', 'rally'].includes(x?.kind) ? x.kind : '' });   // kind: Garnison / Rally (nur 2 Kommandanten)   // heads = nur Kommandanten (Garnison) · hideEmpty = leere Slots ausblenden   // cg = Überlappung der Kommandanten in %

  function scStMigrate(raw, o) {                            // alte Sets: Werte steckten in der Rüstung → Rüstung wird kürzer, obere Kante bleibt
    if (!raw?.st && o.arm.y != null && scStHas(o.arm) && scArmVis(o.arm)) o.arm.y -= (SC_ARM_STATS.filter(([k]) => o.arm[k]).length * 1.25 + 0.2) * o.arm.s / 2;
    return o;
  }
  // Standard-Anordnung ("Symmetrisch anordnen"):
  //   oben links Profilbild, rechts daneben Allianz-Tag (oben) und VIP (darunter), Name oben mittig,
  //   alle Sets in einer Reihe mit ihrer Rüstung direkt darunter, Energie / Kill-Punkte / Verdienst unten nebeneinander.
  const scSetCells = (x) => x.kind ? (x.gearOn ? 10 : 4) : x.heads ? 3 : 9;
  const scNormal = (d) => d.sets.map((x, i) => [x, i]).filter(([x]) => !x.kind);   // normale Sets (ohne Garnison/Rally)
  const SC_KIND = { garrison: '🛡 Garnison', rally: '🚩 Rally' }, SC_KIND_MAX = 3;
  const scKindNo = (d, x) => d.sets.filter(y => y.kind === x.kind).indexOf(x);   // 0, 1, 2                       // Höhe eines Sets in Kästchen (Breite immer 4)
  const scSetH = (x) => scSetCells(x) * SC_G;
  const scFmAuto = (a) => !!a.formation && a.fpos !== 'hidden' && !a.fsep;          // Formation sitzt automatisch über/unter den Inschriften
  const scArmBlk = (a) => (a.on && a.insc.some(i => i.t)) || scFmAuto(a);            // Rüstungs-Block sichtbar?
  const scArmH = (a) => scArmBlk(a) ? Math.ceil((a.on ? a.insc.filter(i => i.t).length : 0) / (a.cols === 2 ? 2 : 1)) * 2.7 + (a.formation && !a.fsep && a.fpos !== 'hidden' ? 1.5 : 0) + 0.3 : 0;   // cols 2 = Inschriften in 2 Spalten
  const scStH = (x) => x.st.on && scStHas(x.arm) ? SC_ARM_STATS.filter(([k]) => x.arm[k]).length * 1.3 + 0.3 : 0;
  const scUnderH = (x) => (scArmBlk(x.arm) ? SC_G + scArmH(x.arm) : 0) + (scStH(x) ? (scArmBlk(x.arm) ? SC_G / 2 : SC_G) + scStH(x) : 0);   // Platz unter dem Set
  // Sets einer Reihe von links nach rechts: … 5 3 1 2 4 6 … – die Gruppe wird immer um die Mittellinie zentriert
  function scRowX(n, j) {                          // n = Sets in der Reihe, j = Index in der Reihe → x-Mitte
    const order = [...Array.from({ length: n }, (_, k) => k).filter(k => k % 2 === 0).reverse(), ...Array.from({ length: n }, (_, k) => k).filter(k => k % 2 === 1)];
    // 4 Kästchen Set + 1 Kästchen Abstand; bei gerader Anzahl 2 Kästchen Abstand an der Mitte → alle Kanten liegen auf Linien
    const pos = order.indexOf(j), even = n % 2 === 0, mid = n / 2;
    const tot = n * 5 - 1 + (even ? 1 : 0), left = pos * 5 + (even && pos >= mid ? 1 : 0);
    return 50 + (left + 2 - tot / 2) * SC_G;
  }
  // City-Skins: 3 pro Reihe von rechts nach links (1 2 3 / 4 5 6), je 3×3 Kästchen mit 1 Kästchen Abstand
  const scSkinPos = (i, s = 1) => ({ x: 100 - SC_G - (1.5 * s + (i % 3) * (3 * s + 1)) * SC_G, y: SC_G + (1.5 * s + Math.floor(i / 3) * (3 * s + 1)) * SC_G });
  // Einrasten: Kanten liegen auf den Rasterlinien (gerade Breite → Mitte auf einer Linie, ungerade → Mitte zwischen zwei Linien)
  const scSnapC = (v, cells, from) => { const off = cells != null && Math.round(cells) % 2 ? SC_G / 2 : 0; const st = cells != null ? SC_G : SC_STEP;
    return from + off + Math.round((v - from - off) / st) * st; };
  function scCells(key, o) {                                         // [Breite, Höhe] in Kästchen bei der aktuellen Größe – nur wenn ganzzahlig
    const [t, k] = key.split(':');
    let wh = null;
    if (t === 'set') wh = [4, scSetCells(o)];
    else if (t === 'arm') wh = [4, null];
    else if (t === 'st') wh = [4, null];
    else if (t === 'xs' || (t === 'w' && k === 'skin')) wh = [3, 3];
    else if (t === 'w' && k === 'avatar') wh = [3, 3];
    else if (t === 'w' && ['power', 'kp', 'merit'].includes(k)) wh = [5, 2];
    else if (t === 'w' && ['tag', 'vip', 'kd'].includes(k)) wh = [null, 1];
    if (!wh) return [null, null];
    const f = (n) => { if (n == null) return null; const v = n * (o.s || 1); return Math.abs(v - Math.round(v)) < .08 ? Math.round(v) : null; };
    return [f(wh[0]), f(wh[1])];
  }
  function scSnapObj(key, o) { if (o?.x == null || o?.y == null) return; const [w, h] = scCells(key, o); o.x = scSnapC(o.x, w, 50); o.y = scSnapC(o.y, h, 0); }
  function scSnapAll(d) {
    d.sets.forEach((x, i) => { scSnapObj('set:' + i, x); if (x.arm.on) scSnapObj('arm:' + i, x.arm); if (x.st.on) scSnapObj('st:' + i, x.st); });
    Object.entries(d.els).forEach(([k, w]) => { if (w.on) scSnapObj('w:' + k, w); });
    (d.xskins || []).forEach(x => scSnapObj('xs:' + x.id, x));
  }
  // Rüstung direkt unter ihr Set, gleich breit wie das Set (4 Kästchen)
  function scArmShow(x) {                                   // Rüstung einblenden → gleich groß wie das Set, direkt darunter (Werte darunter)
    x.arm.on = true; x.arm.s = x.s; x.arm.r = 0; drawStage(); scArmUnder(x); drawStage();
    if (x.st.on) { scStUnder(x); drawStage(); }
    const d = D(); if (!x.kind) scSyncAfter(d, 'set:' + d.sets.indexOf(x));
  }
  function scStShow(x) {                                    // Werte einblenden → unter der Rüstung (bzw. unter dem Set)
    x.st.on = true; x.st.s = x.s; x.st.r = 0; drawStage(); scStUnder(x); drawStage();
    const d = D(); if (!x.kind) scSyncAfter(d, 'st:' + d.sets.indexOf(x));
  }
  function scSetBox(x, i) {                                  // sichtbare Box des Sets: aufgeteilt → Vereinigung der Teile (Container ist dann unsichtbar/veraltet)
    if (i < 0) return null;
    if (!x.split) return scBox('set:' + i, x);
    const bs = [['pc', 'c', x.cm], ['pn', 'n', x.cn], ['pg', 'g', scGearShown(x)]].filter(([, , v]) => v).map(([t, k]) => scBox(t + ':' + i, x.parts[k])).filter(Boolean);
    if (!bs.length) return null;
    const l = Math.min(...bs.map(b => b.l)), r = Math.max(...bs.map(b => b.r)), t = Math.min(...bs.map(b => b.t)), b = Math.max(...bs.map(b => b.b));
    return { l, r, t, b, w: r - l, h: b - t, cx: (l + r) / 2, cy: (t + b) / 2 };
  }
  const scLineUp = (v, from) => from + Math.ceil((v - from) / SC_G - 0.02) * SC_G;   // nächste Rasterlinie darunter
  function scStUnder(x, keep) {                             // Werte direkt unter die Rüstung (ohne Rüstung: 1 Kästchen unter das Set)
    const i = sc.doc ? D().sets.indexOf(x) : -1, armOn = scArmBlk(x.arm);
    if (!keep) x.st.s = x.s;
    const sb = i >= 0 ? scSetBox(x, i) : null; x.st.x = armOn ? x.arm.x : sb ? sb.cx : x.x; const _u = 0, ab = i >= 0 && armOn ? scBox('arm:' + i, x.arm) : null, tb = i >= 0 ? scBox('st:' + i, x.st) : null;
    const top = armOn ? (ab ? ab.b : x.arm.y + scArmH(x.arm) * x.arm.s / 2) + SC_G * x.s / 2 : (sb ? sb.b : x.y + scSetH(x) * x.s / 2) + SC_G * x.s;
    x.st.y = scLineUp(top, 0) + (tb ? tb.h : scStH(x) * x.st.s) / 2;
  }
  // Reihenfolge immer: Kommandanten → Gear (Set) → Rüstung → Werte. Überlappt etwas, wird es darunter gesetzt (Größe bleibt).
  function scFixStacks(d) {
    const hit = (a, b) => a && b && a.r > b.l + 0.2 && a.l < b.r - 0.2;
    let ch = false;
    d.sets.forEach((x, i) => { if (x.kind && !x.gearOn) return;
      if (scArmBlk(x.arm) && !x.arm.free && !x.free && !x.split && scBound(x, 'arm')) { const sb = scBox('set:' + i, x), ab = scBox('arm:' + i, x.arm);
        if (sb && ab && hit(ab, sb) && ab.t < sb.b - 0.1) { scArmUnder(x, true); ch = true; } } });
    if (ch) drawStage();
    let ch2 = false;
    d.sets.forEach((x, i) => { if ((x.kind && !x.gearOn) || !x.st.on || !scStHas(x.arm) || x.st.free || x.free || x.split || x.arm.free || !scBound(x, 'st')) return;
      const tb = scBox('st:' + i, x.st), armOn = scArmBlk(x.arm), ob = armOn ? scBox('arm:' + i, x.arm) : scBox('set:' + i, x);
      if (tb && ob && hit(tb, ob) && tb.t < ob.b - 0.1) { scStUnder(x, true); ch2 = true; } });
    if (ch2) drawStage();
    {                                                        // passt ein Set / eine Rüstung / Werte nicht mehr auf die Bühne → Bühne automatisch höher
      const maxB = Math.max(...d.sets.flatMap((x, i) => [scBox('set:' + i, x), x.arm.on ? scBox('arm:' + i, x.arm) : null, x.st.on ? scBox('st:' + i, x.st) : null]).filter(Boolean).map(b => b.b));
      if (false && maxB > scH(d) - 0.2) { /* Höhe springt nicht mehr automatisch – bleibt wie gewählt */ }
    }
    return ch || ch2;
  }
  function scArmCols(x, n) {                                // Inschriften in 1 oder 2 Spalten – obere Kante bleibt, Werte rücken nach
    if (!x) return; const i = D().sets.indexOf(x), b0 = scBox('arm:' + i, x.arm);
    x.arm.cols = n === 2 ? 2 : 1; drawStage();
    const b1 = scBox('arm:' + i, x.arm); if (b0 && b1) x.arm.y = b0.t + b1.h / 2;
    drawStage(); if (x.st.on) { scStUnder(x, true); drawStage(); }
    scSyncAfter(D(), 'arm:' + i); drawArm(); drawProps(); scSaveSoon();
  }
  function scStack(x) { if (x.arm.on) scArmUnder(x); if (x.st.on) { drawStage(); scStUnder(x); } }   // Rüstung + Werte unter ihr Set
  function scArmUnder(x, keep) {                           // keep = eigene Größe der Rüstung behalten
    if (!keep) x.arm.s = x.s;
    const i = sc.doc ? D().sets.indexOf(x) : -1, sb = i >= 0 ? scSetBox(x, i) : null; x.arm.x = sb ? sb.cx : x.x; const _u = 0, ab = i >= 0 ? scBox('arm:' + i, x.arm) : null;
    const top = (sb ? sb.b : x.y + scSetH(x) * x.s / 2) + SC_G * x.s;                  // 1 Kästchen unter dem Set
    x.arm.y = scLine(top, 0) + (ab ? ab.h : scArmH({ ...x.arm, on: true }) * x.arm.s) / 2;   // obere Kante auf einer Linie
  }
  function scLayoutPos(d, Hforce) {
    const E = d.els, on = (k) => E[k].on, wp = {}, sp = [], ap = [], tp = [], anch = {}, G = SC_G;
    // Kopfzeile wie im Spiel-Profil: Profilbild 3×3 oben links, VIP rechts daneben, darunter Königreich + Allianz-Tag, Name mittig, City-Skins oben rechts
    const av = 3 * G * E.avatar.s;
    if (on('avatar')) wp.avatar = { x: G + av / 2, y: G + av / 2 };
    const ax = on('avatar') ? G + av + G : G;
    // Reihe 1 (oben, rechts neben dem Profilbild): VIP, direkt daneben der Allianz-Tag
    if (on('vip')) { wp.vip = { x: ax + 3 * G, y: G + G / 2 }; anch['w:vip'] = { left: ax }; }
    if (on('tag')) { wp.tag = { x: ax + 9 * G, y: G + G / 2 }; anch['w:tag'] = on('vip') ? { after: 'w:vip', gap: G } : { left: ax }; }
    // Reihe 2 (unten, bündig mit der Unterkante des Profilbilds): Königreich
    const row2 = on('avatar') ? G + av - G / 2 : (on('vip') || on('tag') ? 3 * G : 1.5 * G);
    if (on('kd')) { wp.kd = { x: ax + 4 * G, y: row2 }; anch['w:kd'] = { left: ax }; }
    if (on('name')) wp.name = { x: 50, y: 2 * G };
    const nSkins = (on('skin') && d.skin ? 1 : 0) + (d.xskins || []).length;
    if (on('skin')) wp.skin = scSkinPos(0, E.skin.s);
    const skinBottom = nSkins ? G + (Math.ceil(nSkins / 3) * 4 - 1) * G : 0;
    const top0 = Math.max(on('avatar') ? G + av : 0, on('kd') || on('tag') ? row2 + G / 2 : 0, skinBottom, on('name') ? 3 * G : 0, SC_HEAD_H * G) + SC_SET_TOP * G;   // Set-Oberkante 1 Kästchen unter der Kopfzeile
    // Sets: max. 7 pro Reihe, um die Mitte zentriert
    const NS = scNormal(d), n = NS.length, rows = Math.max(1, Math.ceil(n / SC_COLS));
    const stats = ['kp', 'power', 'merit'].filter(on), bottom = stats.length ? 4 * G : G;
    const H = Hforce || scH(d), avail = Math.max(6, H - top0 - bottom);
    const rowH = (r) => { const l = NS.slice(r * SC_COLS, (r + 1) * SC_COLS).map(([x]) => x); return l.length ? Math.max(...l.map(x => scSetH(x) + scUnderH(x))) : 0; };
    const block = Array.from({ length: rows }, (_, r) => rowH(r)).reduce((a, b) => a + b, 0) + (rows - 1) * G;
    const f = block > avail ? Math.max(0.3, Math.floor(avail / block * 4) / 4) : 1;
    let y = scLine(top0, 0);   // Sets starten oben bündig am Startpunkt
    for (let r = 0; r < rows; r++) {
      const l = NS.slice(r * SC_COLS, (r + 1) * SC_COLS);
      l.forEach(([x, i], k) => {
        const xc = 50 + (scRowX(l.length, k) - 50) * f;
        sp[i] = { x: xc, y: y + scSetH(x) * f / 2, s: f };
        ap[i] = { x: xc, y: y + (scSetH(x) + G) * f + scArmH({ ...x.arm, on: true }) * f / 2, s: f };
        const aH = scArmBlk(x.arm) ? G + scArmH(x.arm) + G / 2 : G;
        tp[i] = { x: xc, y: y + (scSetH(x) + aH) * f + scStH({ ...x, st: { ...x.st, on: true } }) * f / 2, s: f };
      });
      y += (rowH(r) + G) * f;
    }
    // Werte unten nebeneinander (je 5×2 Kästchen, 1 Kästchen Abstand), Mitte = Mittellinie
    const tot = stats.length * 5 + Math.max(0, stats.length - 1);
    stats.forEach((k, i) => { wp[k] = { x: 50 + (i * 6 + 2.5 - tot / 2) * G, y: H - G - G }; });
    d.sets.forEach((x, i) => { if (x.kind) { const k = scKindNo(d, x), h = scSetH(x);   // Garnison unten links, Rally unten rechts – nebeneinander
      const below = d.sets.filter(y => y.kind === x.kind).slice(0, k).reduce((a, y) => a + scSetH(y) + G, 0);   // weitere übereinander nach oben
      sp[i] = { x: x.kind === 'garrison' ? 3 * G : 100 - 3 * G, y: H - G - below - h / 2, s: 1 }; ap[i] = { ...sp[i] }; tp[i] = { ...sp[i] }; } });
    return { wp, sp, ap, tp, anch, need: top0 + block + bottom };
  }
  function scRecenter(d, keep) {                           // Sets jeder Reihe gleichmäßig verteilen – um die Mitte bzw. um das gezogene Set
    const NS = scNormal(d).map(([x]) => x);
    for (let r = 0; r * SC_COLS < NS.length; r++) {
      const l = NS.slice(r * SC_COLS, (r + 1) * SC_COLS);
      const off = keep && l.includes(keep) ? keep.x - (50 + (scRowX(l.length, l.indexOf(keep)) - 50) * (keep.s || 1)) : 0;
      l.forEach((x, k) => { const nx = 50 + off + (scRowX(l.length, k) - 50) * (x.s || 1);
        if (x.arm.x != null && Math.abs(x.arm.x - x.x) < 0.5) x.arm.x = nx; if (x.st.x != null && Math.abs(x.st.x - x.x) < 0.5) x.st.x = nx; x.x = nx; });
    }
  }
  function scAutoLayout(d, onlyMissing) {
    const L = scLayoutPos(d, scH(d));                        // gewählte Höhe bleibt – Sets/Rüstungen werden bei Bedarf kleiner
    const pick = (o, p) => onlyMissing ? { x: p.x, y: p.y } : p;
    d.sets.forEach((x, i) => {
      if (!onlyMissing || x.x == null || x.y == null) Object.assign(x, pick(x, L.sp[i]));
      if (!onlyMissing || x.arm.x == null || x.arm.y == null) { if (onlyMissing) scArmUnder(x); else Object.assign(x.arm, L.ap[i]); }
      if (!onlyMissing || x.st.x == null || x.st.y == null) { if (onlyMissing) scStUnder(x); else Object.assign(x.st, L.tp[i]); }
    });
    Object.entries(L.wp).forEach(([k, p]) => { const w = d.els[k]; if (!onlyMissing || w.x == null || w.y == null) { Object.assign(w, p); if (L.anch['w:' + k]) scPendingAnch['w:' + k] = L.anch['w:' + k]; } });
    if (!onlyMissing) (d.xskins || []).forEach((x, i) => Object.assign(x, scSkinPos(i + (d.els.skin.on && d.skin ? 1 : 0), x.s)));
    d.sets.forEach(x => { if (x.arm.x != null) scSnapObj('arm:', x.arm); if (x.st.x != null) scSnapObj('st:', x.st); });
  }
  // ---- Maße aus der Bühne (cqw, ohne Größe/Drehung) → exakte Kanten fürs Raster ----
  let scPendingAnch = {};
  function scElSize(key) {
    const el = R.$('scEls').querySelector(`[data-el="${key}"]`), W = R.$('scStage').getBoundingClientRect().width;
    if (!el || !W) return null; const f = 100 / W; return [el.offsetWidth * f, el.offsetHeight * f];
  }
  function scBox(key, o) {                                  // aktuelle Außenkanten eines Elements
    const sz = scElSize(key); if (!sz) return null;
    const rot = Math.round((o.r || 0) / 90) % 2 === 1 && (o.r || 0) % 90 === 0, w = (rot ? sz[1] : sz[0]) * o.s, h = (rot ? sz[0] : sz[1]) * o.s;
    return { w, h, l: o.x - w / 2, r: o.x + w / 2, t: o.y - h / 2, b: o.y + h / 2, cx: o.x, cy: o.y };
  }
  const scLine = (v, from) => from + Math.round((v - from) / SC_G) * SC_G;
  // Raster: wahlweise linke/rechte Kante, Mitte – oben/untere Kante, Mitte; das Nächstliegende gewinnt
  function scGridFit(key, o, x, y) {
    const b = scBox(key, { ...o, x, y }); if (!b) return [x, y];
    const half = (v, f) => f + Math.round((v - f) / (SC_G / 2)) * (SC_G / 2);
    const cx = [scLine(b.l, 50) + b.w / 2, scLine(b.r, 50) - b.w / 2, half(x, 50)], cy = [scLine(b.t, 0) + b.h / 2, scLine(b.b, 0) - b.h / 2, half(y, 0)];
    const near = (l, v) => l.reduce((m, c) => Math.abs(c - v) < Math.abs(m - v) ? c : m);
    return [near(cx, x), near(cy, y)];
  }
  // ---- Sync: mehrere Optionen, frei kombinierbar ----
  //   set  = Set-Einheit: Set, Rüstung und Werte gleich groß und bewegen sich zusammen
  //   gear = alle Gear-Sets einer Reihe gleich groß, gleiche Höhe (Gruppe nach links/rechts verschiebbar)
  //   arm  = alle Rüstungen einer Reihe gleich groß, gleiche Höhe · st = alle Werte (auch gleiche Schrift-Ausrichtung)
  //   skin = alle City-Skins gleich groß, gleiche Höhe je Reihe · val = Energie / Kill-Punkte / Verdienst gleich groß, gleiche Höhe
  const SC_SYNCS = {
    set:  ['🔗 Set-Einheit', 'Set, Rüstung und Werte bewegen sich zusammen – Rüstung und Werte bleiben unter ihrem Set'],
    gear: ['🛡 Alle Gear-Sets', 'Alle Sets einer Reihe gleich groß und auf gleicher Höhe'],
    arm:  ['⚔ Alle Rüstungen', 'Alle Rüstungen einer Reihe gleich groß und auf gleicher Höhe'],
    st:   ['📊 Alle Werte', 'Alle Werte-Blöcke gleich groß, gleiche Höhe und gleiche Schrift-Ausrichtung'],
    skin: ['🏯 Alle City-Skins', 'Alle City-Skins gleich groß und je Reihe auf gleicher Höhe'],
    val:  ['⚡ Energie · KP · Verdienst', 'Die drei Werte-Kästen gleich groß und auf gleicher Höhe']
  };
  const scSyncsNorm = (d) => { const o = d?.syncs && typeof d.syncs === 'object' ? d.syncs : null, def = d?.sync !== false;   // altes „Sync an/aus“ übernehmen
    return Object.fromEntries(Object.keys(SC_SYNCS).map(k => [k, o ? !!o[k] : false])); };   // Standard: alles aus
  const scSyncOn = (d) => Object.values(d.syncs || {}).some(Boolean);
  const scObjOf = (x, t) => t === 'set' ? x : t === 'arm' ? x.arm : x.st;
  const scVisOf = (x, t) => t === 'set' ? true : t === 'arm' ? scArmBlk(x.arm) : x.st.on && scStHas(x.arm);
  function scRowSets(d, i0) {                               // normale Sets in derselben Reihe wie Set i0 → [[set, index]]
    const NS = scNormal(d), ri = NS.findIndex(([, i]) => i === i0); if (ri < 0) return [];
    return NS.filter((_, k) => Math.floor(k / SC_COLS) === Math.floor(ri / SC_COLS));
  }
  const scPick = (A, b) => A === 'top' ? b.t : A === 'bottom' ? b.b : b.cy;
  const scPut = (A, o, b, v) => { o.y = A === 'top' ? v + b.h / 2 : A === 'bottom' ? v - b.h / 2 : v; };
  function scAlignRow(d, t, i0) {                           // Elemente vom Typ t in der Reihe von Set i0: gleiche Größe + Ausrichtung
    const row = scRowSets(d, i0).filter(([x, j]) => scVisOf(x, t) && ((!scObjOf(x, t).free && (t === 'set' || x.syncMode !== 'partial' || x.sy[t])) || j === i0)); if (!row.length) return;   // frei platzierte bleiben, wo sie sind
    const refE = row.find(([, i]) => i === i0) || row[0], ref = scObjOf(refE[0], t), A = d.syncA || 'top';
    const sizeChanged = row.some(([x]) => scObjOf(x, t).s !== ref.s);
    row.forEach(([x]) => { scObjOf(x, t).s = ref.s; if (t === 'st') x.st.al = ref.al; });
    if (t === 'set' && sizeChanged) scRecenter(d, refE[0]);   // nur bei Größenänderung neu verteilen – Verschieben nach links/rechts bleibt
    drawStage(); if (A === 'none') return;
    const rb = scBox(t + ':' + refE[1], ref); if (!rb) return;
    // Rüstungen / Werte oben ausrichten: an der tiefsten oberen Kante – so überdeckt nichts das Element darüber
    const v = A === 'top' && t !== 'set' ? Math.max(...row.map(([x, i]) => scBox(t + ':' + i, scObjOf(x, t))?.t ?? -1e9)) : scPick(A, rb);
    row.forEach(([x, i]) => { const o = scObjOf(x, t), b = scBox(t + ':' + i, o); if (b) scPut(A, o, b, v); });
    drawStage();
  }
  function scSkinObjs(d) { return [...(d.els.skin.on && d.skin ? [['w:skin', d.els.skin]] : []), ...(d.xskins || []).map(x => ['xs:' + x.id, x])]; }
  function scSyncSkins(d, key) {
    const all = scSkinObjs(d), refE = all.find(([k]) => k === key) || all[0]; if (!refE) return;
    const ref = refE[1], A = d.syncA || 'top'; all.forEach(([, o]) => { o.s = ref.s; }); drawStage(); if (A === 'none') return;
    const rb = scBox(refE[0], ref); if (!rb) return;
    all.forEach(([k, o]) => { const b = scBox(k, o); if (b && Math.abs(b.cy - rb.cy) < rb.h * 0.6) scPut(A, o, b, scPick(A, rb)); });
    drawStage();
  }
  function scSyncVals(d, key) {
    const all = ['power', 'kp', 'merit'].filter(k => d.els[k].on).map(k => ['w:' + k, d.els[k]]), refE = all.find(([k]) => k === key) || all[0]; if (!refE) return;
    const ref = refE[1], A = d.syncA || 'top'; all.forEach(([, o]) => { o.s = ref.s; }); drawStage(); if (A === 'none') return;
    const rb = scBox(refE[0], ref); if (!rb) return;
    all.forEach(([k, o]) => { const b = scBox(k, o); if (b) scPut(A, o, b, scPick(A, rb)); });
    drawStage();
  }
  // nach Verschieben / Vergrößern eines Elements: alle eingeschalteten Sync-Regeln anwenden
  function scSyncAfter(d, key) {
    const [t, k] = String(key || '').split(':'), S = d.syncs || {};
    if (t === 'xs' || (t === 'w' && k === 'skin')) { if (S.skin) scSyncSkins(d, key); return; }
    if (t === 'w' && ['power', 'kp', 'merit'].includes(k)) { if (S.val) scSyncVals(d, key); return; }
    if (!['set', 'arm', 'st'].includes(t)) return;
    const i = +k, x = d.sets[i]; if (!x || x.kind) return;
    if (S.gear) scAlignRow(d, 'set', i); else drawStage();
    const row = scRowSets(d, i), touched = row.filter(([y]) => y === x || S.gear);
    if (S.set) touched.forEach(([y]) => { if (y.arm.on && !y.arm.free && !y.split && scBound(y, 'arm')) { drawStage(); scArmUnder(y, true); } });   // Set-Einheit: Rüstung bleibt unter dem Set (Größe bleibt eigenständig)
    if (S.arm) { const r = row.find(([y, j]) => j === i && scVisOf(y, 'arm')) || row.find(([y]) => scVisOf(y, 'arm')); if (r) scAlignRow(d, 'arm', r[1]); }
    if (S.set) row.filter(([y]) => y === x || S.gear || S.arm).forEach(([y]) => { if (y.st.on && !y.st.free && !y.split && scBound(y, 'st')) { drawStage(); scStUnder(y, true); } });
    if (S.st) { const r = row.find(([y, j]) => j === i && scVisOf(y, 'st')) || row.find(([y]) => scVisOf(y, 'st')); if (r) scAlignRow(d, 'st', r[1]); }
    drawStage();
  }
  function scSyncAll(d) {                                   // nach dem Einschalten einer Option: alles einmal angleichen
    const NS = scNormal(d);
    for (let r = 0; r * SC_COLS < NS.length; r++) scSyncAfter(d, 'set:' + NS[r * SC_COLS][1]);
    if (d.syncs.skin) scSyncSkins(d); if (d.syncs.val) scSyncVals(d);
  }
  // Zeilen ohne Überlappung: Königreich + Allianz-Tag nebeneinander, VIP neben dem Profilbild, Werte unten mittig nebeneinander
  function scFitSets(d, onlyIfNeeded, noScale) {                    // Turm (alle Sets) zwischen Kopfzeile und unteren Kacheln zentrieren, notfalls verkleinern
    drawStage();
    const G = SC_G, H = scH(d), bxs = (l) => l.map(([k, o]) => o && o.x != null ? scBox(k, o) : null).filter(Boolean);
    const head = bxs([...['avatar', 'vip', 'kd', 'tag', 'name', 'skin'].filter(k => d.els[k].on).map(k => ['w:' + k, d.els[k]]), ...(d.xskins || []).map(x => ['xs:' + x.id, x])]);
    const foot = bxs(['kp', 'power', 'merit'].filter(k => d.els[k].on).map(k => ['w:' + k, d.els[k]]));
    const top = Math.max(head.length ? Math.max(...head.map(b => b.b)) : 0, SC_HEAD_H * G) + SC_SET_TOP * G,   // Oberkante der Sets: SC_SET_TOP Kästchen unter der Kopfzeile
      bot = (foot.length ? Math.min(...foot.map(b => b.t)) : H) - G / 2;
    const sets = d.sets.map((x, i) => [x, i]).filter(([x]) => !x.kind && x.mode !== 'shot');
    if (!sets.length || bot - top < 2 * G) return;
    const keysOf = (x, i) => [['set:' + i, x], ['pc:' + i, x.parts.c], ['pn:' + i, x.parts.n], ['pg:' + i, x.parts.g], ['arm:' + i, x.arm], ['st:' + i, x.st], ['fm:' + i, x.arm.fm]];
    const union = () => { const b = sets.flatMap(([x, i]) => bxs(keysOf(x, i).filter(([k]) => !(k.startsWith('set:') && x.split)))); if (!b.length) return null;
      return { t: Math.min(...b.map(q => q.t)), b: Math.max(...b.map(q => q.b)), l: Math.min(...b.map(q => q.l)), r: Math.max(...b.map(q => q.r)) }; };
    let U = union(); if (!U) return false;
    if (onlyIfNeeded && Math.abs(U.t - top) < SC_G / 2 && U.b <= bot + SC_G) return false;   // liegt schon frei → eigene Anordnung behalten
    const avail = bot - top;
    if (!noScale && U.b - U.t > avail) {                                  // zu hoch → alles gleichmäßig verkleinern
      const f = Math.max(0.3, Math.floor(avail / (U.b - U.t) * 20) / 20);
      sets.forEach(([x, i]) => { const cx = x.x, seen = new Set();
        keysOf(x, i).forEach(([, o]) => { if (!o || o.x == null || seen.has(o)) return; seen.add(o); o.s = scScale(o.s * f); o.x = cx + (o.x - cx) * f; o.y = U.t + (o.y - U.t) * f; }); });
      drawStage(); U = union(); if (!U) return;
    }
    const dy = top - U.t, dx = 50 - (U.l + U.r) / 2;
    sets.forEach(([x, i]) => { const seen = new Set();
      keysOf(x, i).forEach(([, o]) => { if (!o || o.x == null || seen.has(o)) return; seen.add(o); o.x += dx; o.y += dy; }); });
    drawStage();
  return true;
  }
  function scFlowRows(d) {
    drawStage();
    const E = d.els, G = SC_G, bx = (k) => E[k].on ? scBox('w:' + k, E[k]) : null;
    const av = bx('avatar');
    if (E.vip.on && av) { const b = bx('vip'); if (b) { E.vip.x = scLine(av.r + G, 50) + b.w / 2; E.vip.y = av.t + b.h / 2; } }
    if (av) {                                                // Tag direkt rechts neben VIP, Königreich rechts neben dem Profilbild (unten)
      drawStage();
      const vb = bx('vip'), tb = bx('tag'), kb = bx('kd');
      if (tb) { const l = vb ? scLineUp(vb.r + G, 50) : scLineUp(av.r + G, 50); E.tag.x = l + tb.w / 2; E.tag.y = (vb ? vb.t : av.t) + tb.h / 2; }
      if (kb) { E.kd.x = scLineUp(av.r + G, 50) + kb.w / 2; E.kd.y = av.b - kb.h / 2; }
    }
    const st = ['kp', 'power', 'merit'].filter(k => E[k].on).map(k => [k, bx(k)]).filter(([, b]) => b);
    if (st.length) { const tot = st.reduce((a, [, b]) => a + b.w, 0) + G * (st.length - 1), bot = Math.max(...st.map(([, b]) => b.b));
      let l = 50 - tot / 2; st.forEach(([k, b]) => { E[k].x = l + b.w / 2; E[k].y = bot - b.h / 2; l += b.w + G; }); }
    drawStage();
  }
  function scFixAnchors() {                                 // linke Kanten (VIP, Königreich, Tag) nach dem Zeichnen exakt setzen
    const d = D(), keys = Object.keys(scPendingAnch); if (!keys.length) return;
    keys.forEach(key => { const a = scPendingAnch[key], o = scSelObj(key); if (!o) return;
      const b = scBox(key, o); if (!b) return;
      let left = a.left; if (a.after) { const ao = scSelObj(a.after), ab = ao && scBox(a.after, ao); left = ab ? ab.r + a.gap : left ?? SC_G; }
      if (left != null) o.x = scLine(left, 50) + b.w / 2;
      o.y = scLine(o.y - b.h / 2, 0) + b.h / 2; });
    scPendingAnch = {}; drawStage();
  }
  // nach dem Zeichnen: alle Elemente mit der oberen Kante auf eine Rasterlinie (nur bei „Symmetrisch anordnen“)
  function scSnapTops() {
    const d = D();
    const all = [...d.sets.map((x, i) => ['set:' + i, x]), ...d.sets.map((x, i) => ['arm:' + i, x.arm]).filter(([, a]) => a.on), ...d.sets.map((x, i) => ['st:' + i, x.st]).filter(([, a]) => a.on),
      ...Object.entries(d.els).filter(([, w]) => w.on).map(([k, w]) => ['w:' + k, w]), ...(d.xskins || []).map(x => ['xs:' + x.id, x])];
    all.forEach(([k, o]) => { const b = scBox(k, o); if (b) o.y = scLine(b.t, 0) + b.h / 2; });
    drawStage();
  }
  function scNorm(d, i = 0, allowEmpty = false) {
    let sets = Array.isArray(d?.sets) ? d.sets : (d?.cmd || d?.gear ? [{ cmd: d.cmd, gear: d.gear }] : []);   // ganz altes Format = 1 Set
    if (!sets.length && !allowEmpty) sets = [{}];
    const old = d?.widgets || {};                                                                            // Format v2
    const o = { id: String(d?.id || R.newId()), title: String(d?.title || `Showcase ${i + 1}`).trim().slice(0, 30) || `Showcase ${i + 1}`,
      sets: sets.slice(0, 21).map(scSetNorm).filter((x, i, a) => !x.kind || a.slice(0, i).filter(y => y.kind === x.kind).length < SC_KIND_MAX), bg: scBgNorm(d?.bg), h: SC_HEIGHTS[d?.h] ? d.h : 'normal', grid: d?.grid !== false,
      gridC: SC_GRID_C[d?.gridC] ? d.gridC : 'gold', syncs: d?.syncV === 2 ? scSyncsNorm(d) : Object.fromEntries(Object.keys(SC_SYNCS).map(k => [k, false])), syncV: 2, gfxAll: d?.gfxAll !== false, syncA: ['top', 'center', 'bottom', 'none'].includes(d?.syncA) ? d.syncA : 'top', guides: d?.guides !== false, bgB: scInt(d?.bgB, 20, 160, 100), bgC: scInt(d?.bgC, 40, 200, 100),
      els: Object.fromEntries(Object.keys(SC_ELS).map(k => [k, scElNorm(k === 'kd' && d?.els?.ally?.on && !d?.els?.kd?.on ? { ...d.els.ally, text: '' } : (d?.els?.[k] || old[k]))])),   // altes Allianz-Feld → Königreich
      texts: (Array.isArray(d?.texts) ? d.texts : []).slice(0, 12).map(scTxNorm),
      xskins: (Array.isArray(d?.xskins) ? d.xskins : []).map(x => ({ ...x, src: scSkinFix(x?.src) })).filter(x => scSkinOk(x?.src)).slice(0, 6).map(x => ({ ...scElNorm({ ...x, on: true }), id: String(x.id || R.newId()), src: x.src })), skin: scSkinOk(scSkinFix(d?.skin)) ? scSkinFix(d.skin) : '' };
    if (d?.gfxAll == null && o.sets.length > 1) { const g = o.sets.find(x => !x.kind)?.gfx || o.sets[0].gfx; o.sets.forEach(x => { x.gfx = { ...g }; }); }   // bisher pro Set → einmalig vereinheitlichen
    scAutoLayout(o, true);
    return o;
  }
  // show: 'all' = alle Showcases im Profil, '<id>' = nur dieser, 'none' = alles privat · set.priv = Set nur für mich
  function scDocNorm(raw) {
    const pub = !!raw?.pub;                                   // öffentliche Fassung aus der Rangliste (private Teile schon entfernt)
    let list = Array.isArray(raw?.list) ? raw.list : (raw && (raw.sets || raw.cmd || raw.gear) ? [raw] : []);
    if (!list.length) list = [{}];
    list = list.slice(0, SC_MAX_LIST).map((x, i) => scNorm(x, i, pub));
    const show = raw?.show === 'none' ? 'none' : list.some(x => x.id === raw?.show) ? raw.show : 'all';   // im Profil: alle, nur einer oder keiner (privat)
    // eigene Hintergrundbilder (max. 10) – bleiben gespeichert, auch wenn gerade ein anderer Hintergrund gewählt ist
    const gallery = (Array.isArray(raw?.gallery) ? raw.gallery : []).filter(g => scImgOk(g?.src)).map(g => ({ id: String(g.id || R.newId()), src: g.src, t: +g.t || 0 }));
    if (!pub) list.forEach(x => { if (x.bg.type === 'img' && !gallery.some(g => g.src === x.bg.src)) gallery.push({ id: R.newId(), src: x.bg.src, t: 0 }); });   // bisher genutzte eigene Bilder übernehmen
    return { v: 3, pub, show, detPriv: !!raw?.detPriv, list, gallery: gallery.slice(0, SC_GAL_MAX), active: list.some(x => x.id === raw?.active) ? raw.active : list[0].id, updated: +raw?.updated || 0 };
  }
  // Was andere sehen dürfen: nur gewählte Showcases, ohne private Sets. null = gar nichts.
  function scPublicDoc(doc) {                               // show: alle / nur einer / keiner · detPriv: andere sehen nur das Bild
    if (doc.show === 'none') return null;
    const list = doc.list.filter(x => doc.show === 'all' || !doc.show || x.id === doc.show).map(x => ({ ...x, sets: x.sets.map(s => ({ ...s, priv: false })) }));
    if (!list.length) return null;
    return { v: 3, pub: true, detPriv: !!doc.detPriv, list, active: list.some(x => x.id === doc.active) ? doc.active : list[0].id, updated: doc.updated };
  }
  // Item für die Anzeige: aus dem Katalog, sonst aus der gespeicherten Kopie (Name/Icon) – wichtig für fremde Profile
  const scItem = (v) => R.gItem(v?.item) || (v?.name ? { name: v.name, icon: v.icon, rarity: v.rarity } : null);
  const scSnap = (v, it) => { v.name = it ? it.name : ''; v.icon = it ? scIconOk(it.icon) : ''; };
  function ownShowcase() {
    let loc = null; try { loc = JSON.parse(R.LS.get(SC_KEY, 'null')); } catch {}
    const cloud = RokAuth.ownMeta().showcase;
    const a = loc ? scDocNorm(loc) : null, b = cloud ? scDocNorm(cloud) : null;
    return (a && (!b || b.pub || a.updated >= b.updated)) ? a : (b ? { ...b, pub: false } : scDocNorm(null));   // die öffentliche Fassung nie der vollständigen vorziehen
  }
  let scRepub = false;
  let sc = { own: false, doc: null, si: 0, gsel: null, sel: null, busy: false, edit: false, exporting: false, stats: {} };
  const D = () => sc.doc.list.find(x => x.id === sc.doc.active) || sc.doc.list[0];
  const scSet = () => { const d = D(); return d.sets.length ? d.sets[Math.min(sc.si, d.sets.length - 1)] : null; };
  let scOpen = (() => { try { return localStorage.getItem('rok_showcase_open') !== '0'; } catch { return true; } })();
  function renderShowcase(own, row, stats) {
    if (!own && !row?.showcase) { R.$('profShowcase').classList.add('hidden'); sc = { ...sc, own, doc: null }; return; }   // Showcase privat / keiner freigegeben
    const keep = own && sc.own && sc.doc;                    // eigenes Profil neu gezeichnet → laufende Bearbeitung behalten
    sc = { ...sc, own, stats: stats || {}, doc: keep ? sc.doc : (own ? ownShowcase() : scDocNorm(row?.showcase)),
           si: keep ? sc.si : 0, gsel: keep ? sc.gsel : null, sel: keep ? sc.sel : null, edit: keep ? sc.edit : false };
    if (sc.si >= D().sets.length) sc.si = 0;
    drawShowcase();
    if (!keep) scFitOnLoad();
    if (own && !keep && !scRepub) { scRepub = true; setTimeout(() => scSave(null, true), 1500); }   // öffentliche Fassung einmal neu hochladen (frühere Privat-Einstellungen aufheben)
    if (R.gearDbState === 'idle') R.loadGearDb().then(() => { if (R.view === 'profile') drawShowcase(); });
  }
  function scFitOnLoad() {                                   // nach dem Sichtbarwerden der Bühne messen (zwei Frames später)
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!sc.doc || R.$('scBody').classList.contains('hidden') || !R.$('scStage').getBoundingClientRect().width) return;
      if (scFitSets(D(), true)) { drawShowcase(); if (sc.own) scSaveSoon(); }
    }));
  }
  // Showcase-Leiste (Titel, Knöpfe, Liste) standardmäßig aus → nur das Bild; Mini-Knopf ✎ oben rechts blendet sie ein
  let scBar = false;
  const scBarEff = () => scBar || !!sc.edit;
  function scApplyBar() {
    const on = scBarEff();
    R.$('scHead').classList.toggle('hidden', !on);
    R.$('scListBar').classList.toggle('hidden', !on);
    if (!on) { R.$('scBgPick').classList.add('hidden'); R.$('scHint').classList.add('hidden'); }
    R.$('scBody').classList.toggle('pt-5', !on);
    R.$('scBarBtn').setAttribute('aria-expanded', String(on));
    R.$('scBarBtn').classList.toggle('hidden', !!sc.edit);                 // im Bearbeitungsmodus gibt es „✓ Fertig“
    R.$('scBarLbl').textContent = on ? 'Schließen' : (sc.own ? 'Bearbeiten' : 'Optionen');
    R.$('scBarBtn').title = on ? 'Leiste ausblenden' : (sc.own ? 'Showcase bearbeiten' : 'Showcase-Optionen');
  }
  R.$('scBarBtn').onclick = () => { scBar = !scBar; drawShowcase(); if (!scBarEff()) scFitOnLoad(); };
  function scApplyOpen() {
    scApplyBar();
    if (!scBarEff()) { R.$('scBody').classList.remove('hidden'); return; }   // ohne Leiste kein Zuklappen → Bild immer sichtbar
    R.$('scBody').classList.toggle('hidden', !scOpen);
    R.$('scToggle').setAttribute('aria-expanded', String(scOpen));
    R.$('scChevron').classList.toggle('-rotate-90', !scOpen);
  }
  R.$('scToggle').onclick = () => { scOpen = !scOpen; try { localStorage.setItem('rok_showcase_open', scOpen ? '1' : '0'); } catch {} scApplyOpen(); if (scOpen) scFitOnLoad(); };
  function scMsg(t, tone) {
    const el = R.$('scMsg'); el.textContent = t;
    el.className = 'mb-3 text-xs ' + ({ ok: 'text-emerald-400', warn: 'text-amber-300', err: 'text-red-300', busy: 'text-slate-300' }[tone] || 'text-slate-300');
    clearTimeout(el._t); if (tone !== 'busy') el._t = setTimeout(() => el.classList.add('hidden'), 8000);
  }
  const scSkillSquares = (skills, cls = 'w-7 h-7 text-xs') => skills.map((s, i) => `<span title="Skill ${i + 1}" class="${cls} rounded-md grid place-items-center font-bold tabular-nums border ${s >= 5 ? 'text-ink-950 border-gold-400' : 'text-slate-200 border-ink-600 bg-ink-900'}"${s >= 5 ? ' style="background:linear-gradient(180deg,#fde68a,#e0a91b)"' : ''}>${s}</span>`).join('');

  // ---- Kommandanten-Plätze: Primär groß vorne, Sekundär kleiner und leicht dahinter (wie im Spiel) ----
  const SC_CG = [8, 20, 32, 44, 56];                        // Abstand-Stufen 1 (weit) … 5 (eng) = Überlappung in %
  function scCmdsHtml(cmds, cg = 32) {
    const one = (i) => {
      const c = cmds[i], m = c && CMD_BY_ID[c.id], click = sc.own || !!m, main = i === 0;
      const named = !!m?.name;
      return `<div class="relative flex flex-col items-center ${main ? 'z-10 w-36 sm:w-40' : 'z-0 w-28 sm:w-32 translate-y-1'}"${main ? '' : ` style="margin-left:-${(cg * 0.075).toFixed(2)}rem"`}>
        <div class="w-full mb-1 truncate text-center ${main ? 'pr-7 sm:pr-8' : 'pl-7 sm:pl-8'} ${named ? 'text-sm font-semibold text-white [text-shadow:0_1px_3px_#000]' : 'text-[10px] uppercase tracking-widest text-slate-400'}">${R.esc(named ? m.name : SC_SLOTS[i])}</div>
        <button type="button" data-cmdslot="${i}" ${click ? '' : 'disabled'} title="${m ? (sc.own ? 'Kommandant ändern' : 'Kommandant ansehen') : 'Kommandant wählen'}"
            class="relative w-full aspect-square flex items-center justify-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 rounded-xl ${click ? 'cursor-pointer' : 'cursor-default'}">
          ${m ? `<img src="${cmdImg(m.id, c.exp)}" alt="${R.esc(m.name)}" class="w-full h-full object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,.6)] transition-transform group-hover:scale-[1.04]">`
            : `<span class="ghex w-[78%] aspect-[166/192] grid place-items-center transition ${sc.own ? 'bg-gold-500/50 group-hover:bg-gold-400' : 'bg-ink-600'}">
                 <span class="ghex w-[calc(100%-6px)] h-[calc(100%-6px)] grid place-items-center bg-ink-950 text-4xl font-light ${sc.own ? 'text-gold-400/80 group-hover:text-gold-300' : 'text-ink-600'}">${sc.own ? '+' : ''}</span></span>`}
        </button>
      </div>`;
    };
    return one(0) + one(1);
  }
  // ---- Ausrüstung (Rauten wie im Spiel) ----
  // Fertig refined (100 %): dicker, leuchtend goldener Rahmen um die Raute
  // Glitzer-Punkte (statisch) liegen genau auf den Kanten der Raute
  const GOLD_SPARK = [[50, 4.5], [62, 16], [80, 33], [95.5, 50], [86, 62], [68, 79], [50, 95.5], [38, 85], [21, 67], [4.5, 50], [14, 38], [32, 21], [74, 27], [26, 73]]
    .map(([x, y], i) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,${i % 3 ? .95 : 1}) 0, rgba(255,255,255,.9) ${i % 2 ? 1 : 1.5}%, rgba(255,246,200,.45) ${i % 2 ? 2.2 : 3}%, transparent ${i % 2 ? 3 : 4.2}%)`).join(',');
  const GOLD_RIM = GOLD_SPARK + ',conic-gradient(from 20deg at 50% 50%,#fff6c8,#ffd23f 9%,#b87808 18%,#ffe98a 27%,#fffbe0 33%,#e3a512 42%,#8f5a03 50%,#ffd84a 58%,#fff3b0 66%,#c98a06 75%,#ffe27a 84%,#9c6304 92%,#fff6c8)'; R.GOLD_RIM = GOLD_RIM;
  // Flächen: kräftiger Verlauf mit Lichtkante oben (Legendär orange, Episch lila, Elite blau, Normal grau)
  const GFACE = {
    legendary: 'radial-gradient(120% 95% at 50% 16%, #fff0b8 0%, #ffc845 24%, #f7961a 52%, #cf640b 80%, #8a3a04 100%)',
    epic:      'radial-gradient(120% 95% at 50% 16%, #f6eaff 0%, #cf9bff 26%, #9d45f0 55%, #6a1fb0 82%, #3d0f6b 100%)',
    elite:     'radial-gradient(120% 95% at 50% 16%, #e6f1ff 0%, #8ec5ff 26%, #3b82f6 55%, #1d4ed8 82%, #112a6b 100%)',
    normal:    'radial-gradient(120% 95% at 50% 16%, #f8fafc 0%, #cbd5e1 28%, #94a3b8 58%, #64748b 85%, #334155 100%)'
  };
  // Farbton der orangen Fläche (legendär): fh −100 = dunkler orange · 0 = Standard · +100 = gelblicher
  const GF_TONE = { base: ['#fff0b8', '#ffc845', '#f7961a', '#cf640b', '#8a3a04'], yel: ['#fffbd6', '#ffe36b', '#ffc423', '#e39d0c', '#9c6406'], dark: ['#f6c58a', '#ee8d2a', '#c4560b', '#8a3606', '#4a1b02'] };
  const gMix = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');
  const gLegFace = (fh) => { const t = Math.min(1, Math.abs(fh || 0) / 100), to = (fh || 0) > 0 ? GF_TONE.yel : GF_TONE.dark, c = GF_TONE.base.map((x, i) => gMix(x, to[i], t));
    return `radial-gradient(120% 95% at 50% 16%, ${c[0]} 0%, ${c[1]} 24%, ${c[2]} 52%, ${c[3]} 80%, ${c[4]} 100%)`; };
  const gFace = (r, fh = 0) => 'linear-gradient(160deg, rgba(255,255,255,.32) 0%, rgba(255,255,255,.08) 30%, rgba(255,255,255,0) 46%),'
    + 'radial-gradient(70% 55% at 50% 100%, rgba(0,0,0,.28), transparent 70%),' + (r === 'legendary' || !GFACE[r] ? gLegFace(fh) : GFACE[r]); R.gFace = gFace;
  const gFull = (it, v) => !!it && v.refine >= 100; R.gFull = gFull;
  // ---- Expertise-Rahmen (GitHub: icons/frames/*.webp, Ersatz: Original-JPG aus icons/gear) und Iconic-Stufen (icons/gear/iconic-1…5.webp) ----
  const GEAR_FRAMES = [
    { id: 'frame-gold-1', c: 'gold' }, { id: 'frame-gold-2', c: 'gold' }, { id: 'frame-gold-3', c: 'gold' }, { id: 'frame-gold-4', c: 'gold' },
    { id: 'frame-purple-1', c: 'purple' }
  ];   // Bilder liegen in icons/gear/ (frame-….webp) – icons/frames/ geht auch
  const gfById = (id) => GEAR_FRAMES.find(f => f.id === id) || null;
  const gfSrc = (f) => `/icons/${f.dir || 'gear'}/` + encodeURIComponent(f.id + (f.ext || '.webp'));
  const gfList = (c) => GEAR_FRAMES.filter(f => f.c === c);
  (async function syncGearFrames() {                       // weitere Rahmen automatisch übernehmen: frame-….webp in icons/gear/ oder alles in icons/frames/ (lila = „purple“/„lila“/„epic“ im Namen)
    let list = null;
    try { const c = JSON.parse(localStorage.getItem('rok_gframe_files2') || 'null'); if (c && Date.now() - c.t < 3600e3 && Array.isArray(c.list)) list = c.list; } catch {}
    if (!list) { list = [];
      for (const dir of ['gear', 'frames']) {
        try { const r = await fetch('https://api.github.com/repos/marcopopp51200-coder/rok-scanner/contents/icons/' + dir, { headers: { accept: 'application/vnd.github+json' } });
          if (!r.ok) continue;
          (await r.json()).map(x => String(x?.name || '')).filter(n => /\.(webp|png)$/i.test(n) && (dir === 'frames' || /^frame[-_ ]/i.test(n))).forEach(n => list.push([dir, n]));
        } catch {} }
      try { localStorage.setItem('rok_gframe_files2', JSON.stringify({ t: Date.now(), list })); } catch {} }
    list.forEach(([dir, n]) => { const id = n.replace(/\.(webp|png)$/i, ''), ext = n.slice(id.length);
      const f = gfById(id); if (f) { f.dir = dir; f.ext = ext; return; }
      if (/particle|spark|partikel/i.test(id)) return;                 // Partikel-Ebene ist kein eigener Rahmen
      GEAR_FRAMES.push({ id, ext, dir, c: /purple|lila|epic|violet/i.test(id) ? 'purple' : 'gold' }); });
  })();
  const gfImg = (f, cls, style) => `<img src="${gfSrc(f)}" alt="" draggable="false" class="${cls}" style="${style}" onerror="if(!this.dataset.fb){this.dataset.fb=1;this.src=this.src.replace('/icons/gear/','/icons/frames/')}else this.style.visibility='hidden'">`;
  const ICONIC = (t) => `/icons/gear/iconic-${t}.webp`;
  // Glitzer-Partikel (aus dem 1. Gold-Rahmen) – auf Wunsch über jeden Gold-Rahmen legen
  const gfParticles = (style) => `<img src="/icons/gear/frame-particles.webp" alt="" draggable="false" class="absolute pointer-events-none max-w-none" style="${style}" onerror="if(!this.dataset.fb){this.dataset.fb=1;this.src='/icons/frames/frame-particles.webp'}else this.remove()">`;
  // welcher Rahmen: nur bei Expertise (100 % refined) · legendär = Gold-Rahmen des Sets, episch = Lila-Rahmen · 'css' = alter goldener Rand, 'none' = keiner
  function gfFor(it, v, rr, fx) {
    if (!it || !gFull(it, v)) return null;
    if (rr === 'epic') { if (fx.fp === 'none') return 'none'; if (fx.fp === 'css') return 'css'; const f = gfById(fx.fp) || gfList('purple')[0]; return f || 'css'; }
    if (rr !== 'legendary') return 'css';
    if (fx.fr === 'none' || fx.fr === 'css') return fx.fr; return gfById(fx.fr) || gfList('gold')[0] || 'css';
  }
  // Symbol innerhalb der Raute halten (Mitte x/y und Größe in % der Kachel)
  function gInDia(x, y, size) { const R = Math.max(0, 50 - size * 0.6 - 2); let dx = x - 50, dy = y - 50; const m = Math.abs(dx) + Math.abs(dy); if (m > R && m > 0) { dx *= R / m; dy *= R / m; } return [50 + dx, 50 + dy]; }
  function gIconicBox(fx) { const w = fx.ts, h = w * 96 / 220; return [Math.min(100 - w / 2, Math.max(w / 2, fx.tx)), Math.min(100 - h / 2, Math.max(h / 2, fx.ty)), w, h]; }
  // Refine-Symbol und Iconic-Stufe (eigene Ebene über allen Kacheln, damit nichts verdeckt wird)
  function gDecoHtml(v, it, fx, big, rr) {
    if (!it) return '';
    let h = '';
    if (v.refine > 0) { const [x, y] = gInDia(fx.rx, fx.ry, fx.rs);
      h += `<span class="absolute block pointer-events-none" style="left:${x - fx.rs / 2}%;top:${y - fx.rs / 2}%;width:${fx.rs}%;height:${fx.rs}%;line-height:0;font-size:0;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))">${R.gRefIcon(v, 'w-full h-full align-top')}</span>`;   // feste Höhe → Position überall gleich (Bühne und Bearbeitung)
      if (big && v.refine < 100) h += `<span class="absolute text-[9px] font-extrabold text-white [text-shadow:0_1px_2px_#000] pointer-events-none" style="left:${x + fx.rs / 2}%;top:${y}%;transform:translateY(-50%)">${v.refine}%</span>`; }
    if (v.tier > 0 && (rr || 'legendary') === 'legendary') { const [x, y, w, hh] = gIconicBox(fx);   // epische Items haben keine Iconic-Stufe
      h += `<img src="${ICONIC(v.tier)}" alt="${R.ROMAN[v.tier - 1]}" title="Iconic ${R.ROMAN[v.tier - 1]}" draggable="false" class="absolute pointer-events-none [filter:drop-shadow(0_1px_2px_rgba(0,0,0,.7))]" style="left:${x - w / 2}%;top:${y - hh / 2}%;width:${w}%;height:${hh}%"
        onerror="this.outerHTML='<span class=&quot;absolute -translate-x-1/2 -translate-y-1/2 px-1 rounded bg-ink-950/85 border border-gold-400/70 font-extrabold text-gold-300 pointer-events-none&quot; style=&quot;left:${x}%;top:${y}%;font-size:${big ? '10px' : 'max(6px,.75cqw)'};line-height:1.25&quot;>${R.ROMAN[v.tier - 1]}</span>'">`; }
    return h;
  }
  // eine Raute: Rand/Fläche bzw. Expertise-Rahmen + Item-Bild
  function gTileBody(v, it, rr, fx, big, active) {
    const f = it ? R.GFILL[rr] || R.GFILL.legendary : null, fr = gfFor(it, v, rr, fx);
    let h = '';
    if (fr && typeof fr === 'object') {                       // Rahmen-Bild: Fläche bis an den Innenrand, Rahmen darüber
      const fi = Math.max(0, 50 - 40.5 * fx.fs / 100);       // etwas unter den Ring gezogen → keine durchsichtige Lücke
      h += `<span class="gdia absolute" style="inset:${fi}%;background:${gFace(rr, fx.fh)}"></span>`;   // das Rahmen-Bild selbst liegt in einer eigenen Ebene (gFrameHtml)
    } else if (fr === 'css') {                                 // alter goldener Glitzer-Rand
      h += `<span class="gdia absolute inset-0" style="background:${active ? '#ffffff' : GOLD_RIM}"></span>`
        + (big ? '<span class="gdia absolute inset-[10px]" style="background:linear-gradient(180deg,#5a3200,#2e1900)"></span>' : '')
        + `<span class="gdia absolute ${big ? 'inset-[12px]' : 'inset-[3px]'}" style="background:${gFace(rr, fx.fh)}"></span>`;
    } else {
      h += `<span class="gdia absolute inset-0" style="background:${active ? '#ffffff' : f ? f[0] : big ? '#2e3a55' : 'rgba(46,58,85,.85)'}"></span>`
        + `<span class="gdia absolute ${big ? 'inset-[3px]' : 'inset-[1.5px]'}" style="background:${f ? gFace(rr, fx.fh) : big ? '#111725' : 'rgba(17,23,37,.85)'}"></span>`;
    }
    return h;
  }
  // Rahmen-Dicke (fw): 50 = Original · kleiner = dünner (Fläche deckt den inneren Teil des Rings ab) · größer = dicker (goldenes Band nach innen)
  function gThickHtml(rr, fx, gold) {
    const t = fx.fw ?? 50; if (t === 50) return '';
    const sc = fx.fs / 100, kIn = 12 - (t < 50 ? (50 - t) / 50 * 4.5 : 0);           // Innenkante des Rings (Inset in % der Kachel)
    const side = (50 - kIn) * 1.4142 * sc, band = t > 50 ? (t - 50) / 50 * 11 : 0;     // Band in % der Seitenlänge
    const rim = gold ? 'linear-gradient(135deg,#fff3c4,#e8b23a 30%,#9c6304 55%,#ffd96b 75%,#b77a10)' : 'linear-gradient(135deg,#f3e3ff,#b46cf2 35%,#5b1d9c 60%,#d6a8ff 80%,#7a35c0)';
    return `<div class="absolute pointer-events-none overflow-hidden" style="left:${50 - side / 2}%;top:${50 - side / 2}%;width:${side}%;height:${side}%;transform:rotate(45deg);border-radius:14%;background:${rim};${t < 50 ? 'box-shadow:0 0 0 1px rgba(255,235,170,.55)' : ''}">
      <div class="absolute overflow-hidden" style="inset:${t > 50 ? band : 0}%;border-radius:12%;${t > 50 ? 'box-shadow:inset 0 0 3px rgba(0,0,0,.45)' : ''}">
        <div class="absolute" style="inset:-21%;transform:rotate(-45deg);background:${gFace(rr, fx.fh)}"></div></div></div>`;
  }
  function gFrameHtml(v, it, rr, fx, active, big) {
    const fr = gfFor(it, v, rr, fx); if (!fr || typeof fr !== 'object') return '';
    const box = `left:${50 - fx.fs / 2}%;top:${50 - fx.fs / 2}%;width:${fx.fs}%;height:${fx.fs}%;`;
    return gfImg(fr, 'absolute pointer-events-none max-w-none', box + (active ? 'filter:drop-shadow(0 0 2px #fff) drop-shadow(0 0 4px #fff);' : ''))
      + (fx.pt && fr.c === 'gold' ? gfParticles(box) : '')
      + gThickHtml(rr, fx, fr.c !== 'purple')
      + (it?.icon ? `<img src="${it.icon}" alt="" draggable="false" class="absolute object-contain pointer-events-none" style="left:23%;top:23%;width:54%;height:54%;${big ? 'filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))' : ''}">` : '');   // Item über dem Rahmen
  }
  const gHasFrame = (v, it, rr, fx) => { const f = gfFor(it, v, rr, fx); return !!f && typeof f === 'object'; };
  // Gear-Brett im Detail: Rauten oder rund um den Charakter (Umschalter gilt überall)
  function scDrawGearBoard(x) {
    const co = { name: x.name || '' }, on = false, el = R.$('scGearBoard');   // Charakter-Ansicht nur im „🧍 Charakter-Profil“ unten
    R.charFrame?.(el, on); const w = R.$('scGearWrap'); if (w) w.style.maxWidth = on ? '320px' : '';
    el.innerHTML = scGearBoard(x.gear, false, false, x.gfx, on ? co : false);
    const bar = R.$('scViewBar'); if (bar) bar.innerHTML = '';
  }
  function scGearBoard(g, mini = false, hideEmpty = false, fxIn = null, ch = false) {
    const fx = fxIn || SC_GFX_DEF, box = (sl) => ch ? R.charBox(sl.k, ch === true ? {} : ch) : `left:${(sl.x + 1) * 25}%;top:${sl.y * 12.5}%;width:50%;height:25%`;
    const rows = R.GEAR_SLOTS.map(sl => { const v = g[sl.k], it = scItem(v); return { sl, v, it, rr: R.gItem(v.item)?.rarity || v.rarity }; });
    const frames = rows.map(({ sl, v, it, rr }) => { const h = gFrameHtml(v, it, rr, fx, !mini && sc.own && sc.gsel === sl.k, !mini); return h ? `<div class="absolute pointer-events-none z-[15]" style="${box(sl)}">${h}</div>` : ''; }).join('');
    const deco = frames + rows.map(({ sl, v, it, rr }) => it && !(hideEmpty && !it) ? `<div class="absolute pointer-events-none z-20" style="${box(sl)}">${gDecoHtml(v, it, fx, !mini, rr)}</div>` : '').join('');
    if (mini) return (ch ? R.charBack(g, ch === true ? {} : ch) : '') + rows.map(({ sl, v, it, rr }) => {
      if (hideEmpty && !it) return '';
      return `<div class="absolute pointer-events-none" style="${box(sl)}">
        ${gTileBody(v, it, rr, fx, false, false)}
        ${it?.icon && !gHasFrame(v, it, rr, fx) ? `<img src="${it.icon}" alt="" draggable="false" class="absolute object-contain" style="left:23%;top:23%;width:54%;height:54%">` : ''}
      </div>`;
    }).join('') + deco;
    return (ch ? R.charBack(g, ch === true ? {} : ch) : '') + rows.map(({ sl, v, it, rr }) => {
      const active = sc.own && sc.gsel === sl.k;
      return `<button type="button" data-sctile="${sl.k}" ${sc.own ? '' : 'tabindex="-1"'} title="${R.esc(sl.label + (it ? ': ' + it.name : ''))}"
          class="gdia absolute focus:outline-none ${sc.own ? '' : 'cursor-default'}" style="${box(sl)}">
        ${gTileBody(v, it, rr, fx, true, active)}
        ${it?.icon ? (gHasFrame(v, it, rr, fx) ? '' : `<img src="${it.icon}" alt="" draggable="false" class="absolute z-10 object-contain pointer-events-none" style="left:23%;top:23%;width:54%;height:54%;filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))">`)
          : `<span class="relative z-10 h-full w-full flex flex-col items-center justify-center text-center px-[17%] pointer-events-none">
              <span class="text-xl sm:text-2xl leading-none ${it ? '' : 'opacity-40'}">${sl.icon}</span>
              <span class="mt-1 text-[9px] sm:text-[10px] font-bold leading-tight line-clamp-2 ${it ? 'text-white [text-shadow:0_1px_2px_#000]' : 'text-slate-500'}">${it ? R.esc(it.name) : sl.label}</span></span>`}
      </button>`;
    }).join('') + deco;
  }
  // ---- Bilder speichern (Supabase-Storage, sonst verkleinert direkt im Showcase) ----
  async function scCompress(file, maxW, maxH, maxLen) {
    const img = await hqLoadImage(file);
    const k = Math.min(1, maxW / img.width, maxH / img.height);
    const c = hqResize(img, Math.round(img.width * k), Math.round(img.height * k));
    img.close?.();
    const fmt = 'image/jpeg';                            // Storage-Bucket erwartet JPEG
    let q = 0.92, out = c.toDataURL(fmt, q);
    while (out.length > maxLen && q > 0.35) { q -= 0.06; out = c.toDataURL(fmt, q); }
    const blob = await (await fetch(out)).blob();
    return { dataUrl: out, blob };
  }
  let scStorageWarned = false;
  async function scStoreImage(file, key, maxW, maxH, maxLen = 330000) {
    const { dataUrl, blob } = await scCompress(file, maxW, maxH, maxLen);
    try { return await RokAuth.uploadImage(blob, key); }
    catch (e) {
      console.warn('Supabase-Storage nicht verfügbar – Bild wird direkt im Showcase gespeichert', e);
      if (!scStorageWarned) { scStorageWarned = true; setTimeout(() => scMsg('Bild direkt im Showcase gespeichert – für kürzere Ladezeiten das Storage-SQL ausführen (Bucket „showcase“).', 'warn'), 1500); }
      if (dataUrl.length > 400000) return (await scCompress(file, 1600, 1200, 330000)).dataUrl;   // ohne Storage klein halten
      return dataUrl;
    }
  }

  // ---- Hintergrund ----
  ['scBgB', 'scBgC'].forEach(id => R.$(id).addEventListener('input', () => {
    if (!sc.own) return; const d = D();
    d.bgB = scInt(R.$('scBgB').value, 20, 160, 100); d.bgC = scInt(R.$('scBgC').value, 40, 200, 100);
    R.$('scBgBv').textContent = d.bgB + ' %'; R.$('scBgCv').textContent = d.bgC + ' %'; scApplyBg(); scSaveSoon();
  }));
  R.$('scBgR').addEventListener('click', () => { if (!sc.own) return; const d = D(); d.bgB = 100; d.bgC = 100; drawBgPick(); scApplyBg(); scSaveSoon(); });
  function scApplyBg() {
    const d = D(), b = d.bg, el = R.$('scStageBg');
    el.style.backgroundImage = b.type === 'img' ? `url("${b.src}")` : b.type === 'lib' ? `url("${scPicUrl(b.id)}")` : (SC_BGS[b.id]?.css || '');
    el.style.filter = (d.bgB ?? 100) !== 100 || (d.bgC ?? 100) !== 100 ? `brightness(${d.bgB ?? 100}%) contrast(${d.bgC ?? 100}%)` : '';
    R.$('scStageShade').classList.toggle('hidden', b.type !== 'img' && b.type !== 'lib');
    R.$('scStage').classList.toggle('bg-ink-950/40', b.type !== 'img' && b.id === 'none');
  }
  function drawBgPick() {
    { const d = D(); R.$('scBgB').value = d.bgB ?? 100; R.$('scBgBv').textContent = (d.bgB ?? 100) + ' %'; R.$('scBgC').value = d.bgC ?? 100; R.$('scBgCv').textContent = (d.bgC ?? 100) + ' %'; }
    const b = D().bg, gal = sc.doc.gallery || [], sw = 'relative w-20 h-12 rounded-lg overflow-hidden border-2 transition';
    const presets = Object.entries(SC_BGS).map(([k, v]) => { const on = b.type === 'preset' && b.id === k;
      return `<button type="button" data-bg="${k}" aria-pressed="${on}" title="${v.label}" class="${sw} ${on ? 'border-gold-400' : 'border-ink-600 hover:border-gold-500/60'}"
          style="background:${v.css || '#0c1019'}"><span class="absolute inset-x-0 bottom-0 text-[9px] font-semibold text-white bg-black/45 leading-4">${v.label}</span></button>`; }).join('');
    const own = gal.map(g => { const on = b.type === 'img' && b.src === g.src;
      return `<div class="relative group"><button type="button" data-gal="${R.esc(g.id)}" aria-pressed="${on}" title="Eigenes Bild" class="${sw} block ${on ? 'border-gold-400' : 'border-ink-600 hover:border-gold-500/60'}" style="background:url('${g.src}') center/cover"></button>
        <button type="button" data-galdel="${R.esc(g.id)}" title="Bild löschen" class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-ink-950 border border-red-500/60 text-red-300 text-[10px] leading-none grid place-items-center hover:bg-red-500/20">✕</button></div>`; }).join('');
    const add = gal.length < SC_GAL_MAX ? `<label for="scBgFile" title="Eigenes Bild hochladen" class="cursor-pointer ${sw} border-dashed border-gold-500/60 hover:border-gold-400 grid place-items-center bg-ink-900 text-[10px] text-gold-300 font-semibold">📷 Hochladen</label>` : '';
    R.$('scBgList').innerHTML = `<div class="w-full">
        <div class="mb-1.5 text-[10px] uppercase tracking-widest text-slate-500">Farbverläufe</div>
        <div class="flex flex-wrap gap-2">${presets}</div>
        <div class="mt-3 mb-1.5 text-[10px] uppercase tracking-widest text-slate-500">Deine Bilder · ${gal.length}/${SC_GAL_MAX}</div>
        <div class="flex flex-wrap gap-2 pt-1.5">${own}${add}</div>
        ${gal.length >= SC_GAL_MAX ? '<p class="mt-1 text-[11px] text-amber-300">Maximal 10 Bilder – zum Hochladen erst eins löschen (✕).</p>' : ''}
      </div>`;
  }
  R.$('scBgBtn').onclick = () => {
    const open = R.$('scBgPick').classList.toggle('hidden') === false;
    R.$('scBgBtn').setAttribute('aria-expanded', String(open));
    if (open) { scOpen = true; scApplyOpen(); drawBgPick(); }
  };
  R.$('scBgList').addEventListener('click', async (ev) => {
    if (!sc.own) return;
    const del = ev.target.closest('[data-galdel]');
    if (del) {
      if (!(await UI.confirm('Dieses Bild aus deinen Hintergründen löschen?\n\nShowcases, die es gerade nutzen, behalten es.'))) return;
      sc.doc.gallery = (sc.doc.gallery || []).filter(g => g.id !== del.dataset.galdel); drawBgPick(); scSave('🗑 Bild gelöscht'); return;
    }
    const g = ev.target.closest('[data-gal]');
    if (g) { const it = (sc.doc.gallery || []).find(x => x.id === g.dataset.gal); if (it) { D().bg = { type: 'img', src: it.src }; scApplyBg(); drawBgPick(); scSave('✓ Hintergrund gespeichert'); } return; }
    const b = ev.target.closest('[data-bg]'); if (!b) return;
    D().bg = { type: 'preset', id: b.dataset.bg }; scApplyBg(); drawBgPick(); scSave('✓ Hintergrund gespeichert');
  });
  R.$('scBgFile').onchange = async (ev) => {
    const f = ev.target.files?.[0]; ev.target.value = '';
    if (!f || !f.type.startsWith('image/') || !sc.own) return;
    sc.doc.gallery = sc.doc.gallery || [];
    if (sc.doc.gallery.length >= SC_GAL_MAX) { scMsg('Maximal 10 eigene Bilder – bitte erst eins löschen.', 'warn'); return; }
    scMsg('Lade Hintergrund hoch …', 'busy');
    try {
      const id = R.newId(), src = await scStoreImage(f, `bg_${id}`.replace(/\./g, '_'), 2560, 1440, 1500000);   // eigener Dateiname je Bild → nichts wird überschrieben
      sc.doc.gallery.push({ id, src, t: Date.now() });
      D().bg = { type: 'img', src }; scApplyBg(); drawBgPick(); scSave('✓ Bild gespeichert und als Hintergrund gesetzt');
    } catch (e) { scMsg(e.message || 'Bild konnte nicht gelesen werden.', 'err'); }
  };

  // ---- Bühne ----
  const SC_SWORD = '<svg viewBox="0 0 24 24" style="width:1em;height:1em;flex:none" fill="#5aa9f5"><path d="M21 3v3.2l-9.6 9.6-3.2-3.2L17.8 3H21zM7.5 13.3l3.2 3.2-1.4 1.4-1-1-2.6 2.6.9.9-1.4 1.4-3.2-3.2 1.4-1.4.9.9 2.6-2.6-1-1z"/></svg>';
  const SC_FORM_DOTS = {
    Pincer: [[4, 5], [3.6, 9.2], [4.6, 13.2], [7.4, 16.3], [12, 17.6], [16.6, 16.3], [19.4, 13.2], [20.4, 9.2], [20, 5]],
    Wedge:  [[12, 6], [7.5, 11], [12, 11], [16.5, 11], [3, 16], [7.5, 16], [16.5, 16], [21, 16]],
    Delta:  [[2, 7], [6, 7], [10, 7], [14, 7], [18, 7], [22, 7], [6, 12], [10, 12], [14, 12], [18, 12], [8, 17], [12, 17], [16, 17]]
  };
  const scFormIcon = (f) => '<svg viewBox="0 0 24 24" style="width:1.35em;height:1.35em;flex:none" fill="#facc15" stroke="#6b5200" stroke-width=".5">'
    + (SC_FORM_DOTS[f] || SC_FORM_DOTS.Pincer).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${f === 'Delta' ? 1.8 : 2.1}"/>`).join('') + '</svg>';
  const SC_RING = scFormIcon('Pincer');
  // Symbole vor den Rüstungs-Werten (Dateien in /icons/gear/): blau Infanterie, grün Kavallerie, rot Bogenschützen, orange Gesamtschaden
  const ARM_STAT_ICON = { infantry: '/icons/gear/infantry.webp', cavalry: '/icons/gear/cavalry%20(1).webp', archer: '/icons/gear/archer%20(1).webp', dmg: '/icons/gear/damage.webp' };
  const scStatIcon = (troop, k) => { const src = k === 'dmg' ? ARM_STAT_ICON.dmg : ARM_STAT_ICON[troop];
    return src ? `<img src="${src}" alt="" draggable="false" style="width:1.15em;height:1.15em;object-fit:contain;flex:none">` : SC_SWORD; };
  const scPct = (v) => (v > 0 ? '+' : '') + v.toLocaleString('de-DE', { maximumFractionDigits: 1 }) + '%';
  // Rüstung wie im Spiel: Inschriften als Schilder, Formation, Werte (L = Längen-Einheit: Bühne in cqw, Vorschau in px)
  // gemessene Textbreite in „em“ (Inter), damit Inschriften und Werte genau in 4 Kästchen passen
  const scMeasure = document.createElement('canvas').getContext('2d'), scTwCache = {};
  const scTextW = (t, bold) => { const k = (bold ? 'b|' : 'n|') + t; if (scTwCache[k] != null) return scTwCache[k];
    scMeasure.font = `${bold ? 800 : 400} 100px Inter, system-ui, sans-serif`; return (scTwCache[k] = scMeasure.measureText(String(t)).width / 100 * 1.04); };
  // part: 'all' = Vorschau (alles), 'arm' = nur Inschriften + Formation, 'st' = nur Werte (st = Einstellungen: al Ausrichtung, nt ohne Truppentyp)
  const scStatLbl = (a, k, l, nt) => k === 'dmg' || nt ? l : `${SC_TROOPS[a.troop]} ${l}`;
  const scStatLines = (a, nt) => SC_ARM_STATS.filter(([k]) => a[k]).map(([k, l]) => I18N.tr(scStatLbl(a, k, l, nt)) + ' ' + scPct(a[k]));
  const SC_STAT_FS = 0.95;                                  // Werte dürfen etwas breiter als das Set sein (bis knapp 5 Kästchen)
  function scStatFs(a, nt) { const l = scStatLines(a, nt); return l.length ? Math.min(SC_STAT_FS, ...l.map(t => (SC_SET_W + SC_G * 0.8 - 1.4) / Math.max(.5, scTextW(t, false)))) : SC_STAT_FS; }
  function scStatFsAll(d) {                                 // eine Schriftgröße für alle Werte-Blöcke → überall gleich groß
    const l = d.sets.filter(x => x.st.on && scStHas(x.arm)).map(x => scStatFs(x.arm, x.st.nt));
    return l.length ? Math.min(...l) : SC_STAT_FS;
  }
  // eine Schriftgröße für ALLE Inschriften im Showcase → überall gleich groß (die längste Inschrift bestimmt die Größe)
  const scPillW = (a) => a.cols === 2 ? SC_SET_W * 0.75 - 0.15 : SC_SET_W - 1.4;
  const scPillFs = (a) => { const l = a.insc.filter(i => i.t); return l.length ? Math.min(1.15, ...l.map(i => (scPillW(a) - 1.1) / Math.max(.5, scTextW(I18N.tr(i.t), true)))) : 1.15; };
  function scArmFsAll(d) { const l = d.sets.filter(x => scArmBlk(x.arm) && !(x.kind && !x.gearOn)).map(x => scPillFs(x.arm)); return l.length ? Math.min(...l) : 1.15; }
  function scArmHtml(a, L, part = 'all', st = null, sfsIn = null, pfsIn = null) {
    const W = SC_SET_W, fit = (txt, w, max, bold = true) => Math.min(max, w / Math.max(.5, scTextW(txt, bold)));   // Schriftgröße so, dass der Text in 1 Zeile passt
    const insc = part === 'arm' && !a.on ? [] : a.insc.filter(i => i.t), nt = !!st?.nt, al = st?.al || 'left';
    const two = a.cols === 2, PW = two ? W * 0.75 - 0.15 : W - 1.4;   // Breite einer Inschrift (2 Spalten: zusammen 1,5 × Set-Breite)
    const pfs = pfsIn || scPillFs(a);
    const pill = (i) => { const c = SC_INSC[i.c], fs = pfs;   // alle Inschriften gleich groß
      return `<div style="background:${c.bd};padding:${L(0.17)};clip-path:polygon(7% 0,93% 0,100% 50%,93% 100%,7% 100%,0 50%)">
        <div class="grid place-items-center font-extrabold whitespace-nowrap overflow-hidden" style="width:${L(PW)};height:${L(2.15)};font-size:${L(fs)};color:${c.fg};background:${c.bg};clip-path:polygon(7% 0,93% 0,100% 50%,93% 100%,7% 100%,0 50%)">${R.esc(i.t || '–')}</div></div>`; };
    const sfs = sfsIn || scStatFs(a, nt);
    const stats = SC_ARM_STATS.filter(([k]) => a[k]).map(([k, l]) => `<div class="flex items-center whitespace-nowrap" style="gap:.3em;font-size:${L(sfs)}">${scStatIcon(a.troop, k)}
        <span class="text-slate-100 [text-shadow:0_1px_2px_#000]">${scStatLbl(a, k, l, nt)}</span><span class="font-bold text-emerald-400 [text-shadow:0_1px_2px_#000]">${scPct(a[k])}</span></div>`).join('');
    const statsBox = stats ? `<div class="flex flex-col ${al === 'center' ? 'items-center' : al === 'right' ? 'items-end' : 'items-start'}" style="${part === 'st' ? `min-width:${L(W)};width:max-content;` : ''}gap:${L(0.08)}">${stats}</div>` : '';
    if (part === 'st') return statsBox;
    const pills = scInscSort(insc.slice()).map((i, n, l) => two && l.length % 2 && n === l.length - 1 ? `<div style="grid-column:1 / -1">${pill(i)}</div>` : pill(i)).join('');   // ungerade Anzahl: letzte mittig
    const formH = a.formation && a.fpos !== 'hidden' && !(part === 'arm' && a.fsep) ? `<div data-fpart ${part === 'arm' ? 'data-fslot' : ''} class="flex items-center text-slate-300 [text-shadow:0_1px_2px_#000]" style="${part === 'arm' ? 'visibility:hidden;' : ''}gap:.35em;font-size:${L(1)};${a.fpos === 'above' ? 'margin-bottom' : 'margin-top'}:${L(0.2)}">${scFormIcon(a.formation)}${R.esc(a.formation)}</div>` : '';
    return `<div class="flex flex-col items-center" style="width:${L(two && part !== 'all' ? W * 1.5 : W)};gap:${L(0.3)}">
      ${a.fpos === 'above' ? formH : ''}
      ${two && part !== 'all' ? `<div class="grid grid-cols-2 justify-items-center" style="gap:${L(0.3)} ${L(0.3)}">${pills}</div>` : pills}
      ${a.fpos !== 'above' ? formH : ''}
      ${part === 'all' ? statsBox : ''}
    </div>`;
  }
  // ---- Freies / Fixes Set und einzelne Formation ----
  function scPartCmd(x) {
    const hide = x.hideEmpty;
    const cmd = (c, main) => { const m = c && CMD_BY_ID[c.id];
      return `<div class="relative flex items-center justify-center" style="width:${(main ? 1.8 : 1.5) * SC_G}cqw;aspect-ratio:1;z-index:${main ? 1 : 0};${main ? '' : `margin-left:-${(1.5 * SC_G * x.cg / 100).toFixed(2)}cqw;transform:translateY(.25cqw)`}">
        ${m ? `<img src="${cmdImg(m.id, c.exp)}" alt="" draggable="false" class="w-full h-full object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,.6)]">` : '<span class="ghex w-[78%] aspect-[166/192] bg-ink-600/70"></span>'}</div>`; };
    const showC = (k) => !hide || !!(x.cmd[k] && CMD_BY_ID[x.cmd[k].id]);
    return `<div class="flex items-end justify-center">${showC(0) ? cmd(x.cmd[0], true) : ''}${showC(1) ? cmd(x.cmd[1], false) : ''}</div>`;
  }
  function scPartNames(x) {
    const cn = (k) => { const m = x.cmd[k] && CMD_BY_ID[x.cmd[k].id]; return m ? m.name : ''; };
    if (!cn(0) && !cn(1)) return '';
    const c = x.nc ? `color:${x.nc};` : '';
    return `<div class="flex flex-col items-center text-center leading-tight [text-shadow:0_1px_3px_#000]">
      ${cn(0) ? `<div class="font-bold ${x.nc ? '' : 'text-white'} whitespace-nowrap" style="${c}font-size:max(7px,1.05cqw)">${R.esc(cn(0))}</div>` : ''}
      ${cn(1) ? `<div class="${x.nc ? '' : 'text-slate-300'} whitespace-nowrap" style="${c}${x.nc ? 'opacity:.85;' : ''}font-size:max(6px,.88cqw)">${R.esc(cn(1))}</div>` : ''}</div>`;
  }
  const scGearShown = (x) => !(x.heads || (x.kind && !x.gearOn));
  const scPartGear = (x) => `<div class="relative" style="width:${2.9 * SC_G}cqw;aspect-ratio:1/2">${scGearBoard(x.gear, true, x.hideEmpty, x.gfx)}</div>`;
  const scFmHtml = (a) => `<div class="flex items-center text-slate-300 [text-shadow:0_1px_2px_#000] whitespace-nowrap" style="gap:.35em;font-size:1cqw">${scFormIcon(a.formation)}${R.esc(a.formation)}</div>`;
  function scSetOfSel(key = sc.sel) {
    if (!key || !sc.doc) return null; const [t, k] = key.split(':');
    return ['set', 'pc', 'pn', 'pg', 'fm', 'arm', 'st'].includes(t) ? D().sets[+k] || null : null;
  }
  function scMeasureEl(sel) {                                // Mitte eines Elements auf der Bühne in cqw
    const st = R.$('scStage'), el = R.$('scEls').querySelector(sel); if (!el) return null;
    const sr = st.getBoundingClientRect(), r = el.getBoundingClientRect(); if (!sr.width || !r.width) return null;
    const Z = st.classList.contains('sc-zoom') ? sc.zoom : { z: 1, x: 0, y: 0 }, f = 100 / sr.width;
    return { x: ((r.left + r.width / 2 - sr.left) - Z.x) / Z.z * f, y: ((r.top + r.height / 2 - sr.top) - Z.y) / Z.z * f };
  }
  function scFmOverlay(d) {                                   // eigenen Formations-Knoten genau auf seinen Platz im Rüstungs-Block legen
    d.sets.forEach((x, i) => {
      const fe = R.$('scEls').querySelector(`[data-fma="${i}"]`); if (!fe) return;
      const m = scMeasureEl(`[data-el="arm:${i}"] [data-fslot]`); if (!m) { fe.style.visibility = 'hidden'; return; }
      fe.style.left = m.x + 'cqw'; fe.style.top = m.y + 'cqw';
      fe.style.transform = `translate(-50%,-50%) rotate(${x.arm.r || 0}deg) scale(${x.arm.s})`; fe.style.visibility = '';
    });
  }
  function scSplit(x, i, on) {                               // Freies Set an/aus – Teile starten genau dort, wo sie im Set lagen
    if (on && !x.split) {
      drawStage();
      ['c', 'n', 'g'].forEach(k => { const m = scMeasureEl(`[data-el="set:${i}"] [data-part="${k}"]`);
        x.parts[k] = m ? { x: m.x, y: m.y, s: x.s, r: x.r || 0 } : { x: x.x, y: x.y, s: x.s, r: 0 }; });
      x.split = true;
    } else if (!on) x.split = false;
    drawStage();
  }
  function scFmPlace(x, i) {                                 // einzelne Formation direkt über / unter die Rüstung
    const a = x.arm; a.fm.s = a.s; a.fm.r = 0;
    if (a.fm.x == null) { a.fm.x = a.x ?? x.x; a.fm.y = a.y ?? x.y; }
    drawStage();
    const ab = scBox('arm:' + i, a), fb = scBox('fm:' + i, a.fm), h = fb ? fb.h : 1.5 * a.s;
    if (!ab) return;
    const gap = SC_G * a.s / 4;
    a.fm.x = ab.cx; a.fm.y = a.fpos === 'above' ? ab.t - gap - h / 2 : ab.b + gap + h / 2;
  }
  function scFmSep(x, i, on) {                               // Formation aus der Rüstung lösen / wieder einfügen
    if (!x) return; const a = x.arm; if (on === !!a.fsep) return;
    const b0 = scBox('arm:' + i, a);
    if (on) { const m = scMeasureEl(`[data-el="arm:${i}"] [data-fpart]`); a.fsep = true;
      a.fm = m ? { x: m.x, y: m.y, s: a.s, r: a.r || 0 } : { x: null, y: null, s: a.s, r: 0 }; }
    else a.fsep = false;
    drawStage();
    const b1 = scBox('arm:' + i, a);
    if (b0 && b1) a.y = a.fpos === 'above' ? b0.b - b1.h / 2 : b0.t + b1.h / 2;   // die andere Kante der Rüstung bleibt stehen
    drawStage();
    if (on && !m0(a)) { scFmPlace(x, i); drawStage(); }
    function m0(o) { return o.fm && o.fm.x != null; }
  }
  function scFmPos(x, i, v) {
    if (!x || !sc.own) return; const a = x.arm, b0 = a.fsep ? null : scBox('arm:' + i, a);
    a.fpos = ['above', 'hidden'].includes(v) ? v : 'below'; drawStage();
    if (b0) { const b1 = scBox('arm:' + i, a); if (b1) { a.y = b0.t + b1.h / 2; drawStage(); } }   // obere Kante der Rüstung bleibt
    if (a.fsep && a.fpos !== 'hidden') { scFmPlace(x, i); drawStage(); }
    drawArm(); drawProps(); scSaveSoon();
  }
  function scFmCtlHtml(a, sm) {
    if (!a?.formation) return '';
    return `<span class="basis-full h-0"></span><span class="text-slate-400">Formation</span>
      <span class="inline-flex rounded-lg border border-ink-600 overflow-hidden">${[['above', '⬆ Über'], ['below', '⬇ Unter']].map(([v, l], n) => `<button type="button" data-armfpos="${v}" aria-pressed="${a.fpos === v}" class="${sm ? 'px-2.5 py-1 text-xs' : 'px-2.5 py-1.5'} ${a.fpos === v ? 'bg-gold-500/25 text-gold-200' : 'hover:text-gold-300'} ${n ? 'border-l border-ink-600' : ''}">${l}</button>`).join('')}</span>
      <label class="inline-flex items-center gap-1.5 cursor-pointer"><input type="checkbox" data-fsep ${a.fsep ? 'checked' : ''} class="w-4 h-4 accent-yellow-500">Formation einzeln (frei bewegen)</label>`;
  }
  const scSetLabel = (d, x) => x.kind ? SC_KIND[x.kind] + (d.sets.filter(y => y.kind === x.kind).length > 1 ? ' ' + (scKindNo(d, x) + 1) : '')
    : (x.name || 'Set ' + (scNormal(d).findIndex(([y]) => y === x) + 1));
  function scSelSet(i) {                                     // Set auswählen → Einstellungen unten
    const x = D().sets[i]; if (!x) return;
    sc.sel = x.split && x.mode !== 'shot' ? (x.cm ? 'pc:' : x.cn ? 'pn:' : 'pg:') + i : 'set:' + i;
    sc.si = i; sc.gsel = null; drawStage(); drawProps(); drawSetBar(); drawDetail();
  }
  // Welche Teile eines Sets zusammengehören (Auswahl „Sync Set“) – [Schlüssel, Objekt]
  function scMemberKeys(y, j) {
    const l = [], sy = y.syncMode === 'full' ? scSyNorm({}) : y.syncMode === 'free' ? {} : y.sy;   // Full = alles, Free = nichts
    if (y.syncMode === 'free') return l;
    if (!y.split) l.push(['set:' + j, y]); else [['pc', 'c'], ['pn', 'n'], ['pg', 'g']].forEach(([t, k]) => { if (sy[k]) l.push([t + ':' + j, y.parts[k]]); });
    if (sy.arm) l.push(['arm:' + j, y.arm]);
    if (sy.st) l.push(['st:' + j, y.st]);
    if (sy.fm && y.arm.fsep) l.push(['fm:' + j, y.arm.fm]);
    return l;
  }
  const scMembers = (y) => scMemberKeys(y, 0).map(([, o]) => o);
  // Sync-Gruppen: alle Sets, die (auch über Umwege) verknüpft sind, bilden EINE feste Gruppe – in beide Richtungen
  function scGroupOf(d, x) {
    const seen = new Set([x]), q = [x];
    while (q.length) { const y = q.pop(); d.sets.forEach(z => { if (!seen.has(z) && ((y.link || []).includes(z.id) || (z.link || []).includes(y.id))) { seen.add(z); q.push(z); } }); }
    return d.sets.filter(z => seen.has(z));
  }
  const scGroupWrite = (g) => g.forEach(y => { y.link = g.length > 1 ? g.filter(z => z !== y).map(z => z.id) : []; });
  const scLinked = (d, x) => scGroupOf(d, x).filter(y => y !== x);
  function scLinkSet(d, x, y, on) {
    if (on) scGroupWrite([...new Set([...scGroupOf(d, x), ...scGroupOf(d, y)])]);
    else { const g = scGroupOf(d, y).filter(z => z !== y); y.link = []; scGroupWrite(g); }
  }
  const scUnlinkAll = (d) => d.sets.forEach(y => { y.link = []; });   // nur Verknüpfungen lösen – keine Position ändert sich
  function scSyncOne(x, i, all) {                            // angehakte (bzw. alle) Teile zusammenpacken und untereinander aufreihen
    const sy = all ? scSyNorm({}) : x.sy, s0 = x.s, G = SC_G, a = x.arm, st = x.st, gap = 0.4 * s0;
    x.lock = true; x.free = false; a.free = false; st.free = false;
    const fmShown = !!a.formation && a.fpos !== 'hidden';
    if (sy.fm && sy.arm && a.fsep) a.fsep = false;                                  // Formation zurück in die Rüstung
    if (!sy.fm && fmShown && !a.fsep) { drawStage(); scFmSep(x, i, true); }   // Formation bleibt frei beweglich
    let cx = x.x, bottom = null;
    drawStage();
    if (sy.c && sy.n && sy.g) {
      if (x.split) {
        const bs = [['pc', 'c'], ['pn', 'n'], ['pg', 'g']].map(([t, k]) => [k, scBox(t + ':' + i, x.parts[k])]).filter(([, b]) => b);
        const top = bs.length ? Math.min(...bs.map(([, b]) => b.t)) : null; if (bs.length) cx = bs[0][1].cx;
        x.split = false; drawStage();
        const cb = scBox('set:' + i, x); if (cb && top != null) { x.x = cx; x.y = top + cb.h / 2; }
      }
      x.r = 0; drawStage(); const cb = scBox('set:' + i, x); if (cb) { bottom = cb.b; cx = x.x; }
    } else {
      if (!x.split) scSplit(x, i, true);
      const ps = [['pc', 'c', x.cm], ['pn', 'n', x.cn], ['pg', 'g', scGearShown(x)]].filter(([, k, vis]) => sy[k] && vis);
      const bs = ps.map(([t, k]) => scBox(t + ':' + i, x.parts[k])).filter(Boolean);
      if (bs.length) {
        let top = Math.min(...bs.map(b => b.t)); cx = x.parts[ps[0][1]].x;
        ps.forEach(([t, k]) => { const pp = x.parts[k]; pp.r = 0; pp.x = cx; drawStage(); const b = scBox(t + ':' + i, pp); if (!b) return; pp.y = top + b.h / 2; top += b.h + gap; });
        bottom = top - gap;
      }
    }
    drawStage();
    let armIn = false;
    if (sy.arm && scArmBlk(a)) {
      a.r = 0; drawStage();
      const ab = scBox('arm:' + i, a); if (ab && bottom != null) { a.x = cx; a.y = scLine(bottom + G * s0, 0) + ab.h / 2; }
      drawStage(); const nb = scBox('arm:' + i, a); if (nb) { bottom = nb.b; cx = a.x; armIn = true; }
    }
    if (sy.fm && a.fsep && fmShown && bottom != null) {                        // Formation ohne Rüstung: direkt darunter
      a.fm.r = 0; a.fm.x = cx; drawStage();
      const fb = scBox('fm:' + i, a.fm); if (fb) { a.fm.y = bottom + G * s0 / 4 + fb.h / 2; bottom = a.fm.y + fb.h / 2; }
    }
    if (sy.st && st.on && scStHas(a) && bottom != null) {
      st.r = 0; st.x = cx; drawStage();
      const tb = scBox('st:' + i, st); if (tb) st.y = scLineUp(bottom + G * s0 * (armIn ? 0.5 : 1), 0) + tb.h / 2;
    }
    drawStage();
  }
  // Abgedockte Teile: Position relativ zum ersten Teil der Gruppe merken / wiederherstellen
  const scDockEls = (x) => ({ c: x.split ? x.parts.c : null, n: x.split ? x.parts.n : null, g: x.split ? x.parts.g : null, arm: x.arm, fm: x.arm.fsep ? x.arm.fm : null, st: x.st });
  const scAnchor = (x, i) => { const m = scMemberKeys(x, i)[0]; return m ? m[1] : null; };
  function scDockSave(x, i) {
    const A = scAnchor(x, i); if (!A || A.x == null) return; x.dock = x.dock || {};
    Object.entries(scDockEls(x)).forEach(([k, o]) => { if (o && !x.sy[k] && o.x != null) x.dock[k] = { dx: o.x - A.x, dy: o.y - A.y }; });
  }
  function scDockRestore(x, i) {
    const A = scAnchor(x, i); if (!A || A.x == null) return;
    Object.entries(scDockEls(x)).forEach(([k, o]) => { const p = x.dock?.[k]; if (o && !x.sy[k] && p) { o.x = A.x + p.dx; o.y = A.y + p.dy; } });
  }
  function scDecouple(x, i) {                                // Partial: flache Elemente, jedes behält seine exakte Position
    if (!x.split) scSplit(x, i, true);
    const a = x.arm; if (!x.sy.fm && a.formation && a.fpos !== 'hidden' && !a.fsep) scFmSep(x, i, true);
    x.lock = true; drawStage();
  }
  function scScaleGroup(x, i, ns) {                         // Full Sync: alle Module gemeinsam auf Größe ns
    const k = ns / (x.s || 1); if (!isFinite(k) || Math.abs(k - 1) < 1e-4) return;
    const tops = scMemberKeys(x, i).map(([key, o]) => scBox(key, o)?.t).filter(v => v != null);
    const top = tops.length ? Math.min(...tops) : x.y, cx = x.x, seen = new Set();
    [x, x.parts.c, x.parts.n, x.parts.g, x.arm, x.st, x.arm.fm].forEach(o => { if (!o || seen.has(o)) return; seen.add(o);
      o.s = scScale((o.s || 1) * k); if (o.x != null) { o.x = cx + (o.x - cx) * k; o.y = top + (o.y - top) * k; } });
    x.s = ns;
  }
  function scSetAllSize(x, i, ns) {                         // alle Module eines Sets auf genau ns – Oberkanten bleiben stehen
    const mods = [['set:' + i, x], ['pc:' + i, x.parts.c], ['pn:' + i, x.parts.n], ['pg:' + i, x.parts.g], ['arm:' + i, x.arm], ['st:' + i, x.st], ['fm:' + i, x.arm.fm]];
    drawStage();
    const seen = new Set(), list = mods.filter(([k, o]) => o && !seen.has(o) && seen.add(o) && (x.split ? !k.startsWith('set:') : !/^p[cng]:/.test(k))).map(([k, o]) => ({ k, o, b0: scBox(k, o) })).filter(m => m.b0).sort((a, b) => a.b0.t - b.b0.t);
    mods.forEach(([, o]) => { if (o) o.s = ns; });
    drawStage();
    // feste Reihenfolge: jedes Modul startet frühestens (neue Unterkante des darüberliegenden + ursprünglicher Abstand) → nie Überlappung
    const ov = (a, b) => a.r > b.l + 0.2 && a.l < b.r - 0.2;
    list.forEach((m, n) => { const b1 = scBox(m.k, m.o); if (!b1) return; let top = m.b0.t;
      for (let q = 0; q < n; q++) { const p = list[q]; if (!p.nb || !ov(p.b0, m.b0) || p.b0.t >= m.b0.t - 0.05) continue;
        top = Math.max(top, p.nb.b + Math.max(SC_G * 0.15, m.b0.t - p.b0.b)); }
      m.o.y = top + b1.h / 2; drawStage(); m.nb = scBox(m.k, m.o); });
    drawStage();
    if (x.syncMode === 'full') { scSyncOne(x, i, true); drawStage(); }   // Full Sync: wieder sauber untereinander
  }
  function scSetMode(x, i, mode) {                           // Umschalten der drei Modi
    if (x.syncMode === 'partial') scDockSave(x, i);
    x.syncMode = SC_MODES.includes(mode) ? mode : 'full';
    if (mode === 'free') {
      if (!x.split) scSplit(x, i, true);
      const a = x.arm; if (a.formation && a.fpos !== 'hidden' && !a.fsep) scFmSep(x, i, true);
      x.lock = false;
    } else {
      if (mode === 'partial') { scDecouple(x, i); scDockRestore(x, i); }   // Partial: nichts springt, nur gemerkte Positionen
      else { scSyncSet(x, i); scFitSets(D(), false, true); }                                  // Full: alles schnappt zentriert untereinander zusammen
      x.lock = true;
    }
    drawStage();
  }
  // Eine Sync-Gruppe hat immer EINEN Modus (und im Partial Sync dieselben Haken) – sonst springt die Anzeige beim Anklicken eines anderen Sets
  function scGroupMode(d, x, md, only) {
    const i = d.sets.indexOf(x); if (x.syncMode !== md) scSetMode(x, i, md);
    (only || scLinked(d, x)).forEach(y => { if (y.kind) return; const j = d.sets.indexOf(y);
      if (md === 'partial') { y.sy = { ...x.sy }; Object.keys(y.sy).forEach(k => { if (y.sy[k] && y.dock) delete y.dock[k]; }); }
      if (y.syncMode !== md) scSetMode(y, j, md); else if (md === 'partial') { scDecouple(y, j); scDockSave(y, j); } });
  }
  function scSetDefault(x, i) {                              // „Standard“: alles, was zum Gear gehört, wie bei einem neuen Showcase
    const d = D(), p = scLayoutPos(d, scH(d)).sp[i], a = x.arm;
    const top = p ? p.y - scSetH(x) * p.s / 2 : (scSetBox(x, i)?.t ?? x.y - scSetH(x) * x.s / 2);
    x.split = false; a.fsep = false; x.dock = {}; x.syncMode = 'full'; x.lock = true;
    [x, x.parts.c, x.parts.n, x.parts.g, a, x.st, a.fm].forEach(o => { if (!o) return; o.s = 1; o.r = 0; o.free = false; });
    if (p) x.x = p.x; x.y = top + scSetH(x) / 2;
    drawStage(); scSyncOne(x, i, true); drawStage();
  }
  function scSyncSet(x, i) {                                 // Sync Set: auch verknüpfte Sets gleich groß und auf gleiche Höhe
    const d = D(); scSyncOne(x, i, x.syncMode === 'full');
    const topOf = (y, j) => { const t = scMemberKeys(y, j).map(([k, o]) => scBox(k, o)?.t).filter(v => v != null); return t.length ? Math.min(...t) : null; };
    const t0 = topOf(x, i);
    scLinked(d, x).forEach(y => {
      const j = d.sets.indexOf(y);
      if (y.syncMode === 'free') return;                         // Free Mode: nichts verbunden
      if (y.syncMode === 'full') scSyncOne(y, j, true);         // nur Full Sync wird neu gestapelt – Partial behält seine Anordnung
      const t1 = topOf(y, j) ?? scSetBox(y, j)?.t;
      if (t0 != null && t1 != null) { const dy = t0 - t1, seen = new Set();   // ganzes Set starr verschieben → nichts überlappt
        [y, y.parts.c, y.parts.n, y.parts.g, y.arm, y.st, y.arm.fm].forEach(o => { if (o && !seen.has(o) && o.y != null) { seen.add(o); o.y += dy; } }); }
    });
    drawStage();
  }
  function scMiniSet(x, i) {
    const sel = !sc.edit && !sc.exporting && i === sc.hl;          // oranger Rahmen nur, solange das Set angetippt ist
    const lock = sc.own && x.priv && !sc.exporting ? '<span class="absolute -top-1 -right-1 z-10 rounded-full bg-ink-950/90 border border-amber-400/60 leading-none" style="font-size:max(9px,1.1cqw);padding:.25cqw" title="Privat – nur für dich sichtbar">🔒</span>' : '';
    const name = '' + (false ? `<div class="w-full truncate text-center font-semibold text-white [text-shadow:0_1px_3px_#000]" style="font-size:max(9px,1.15cqw)" translate="no">${R.esc(x.name)}</div>` : '');
    if (x.mode === 'shot') return `<div class="relative flex flex-col items-center rounded-lg ${sc.own && x.priv && !sc.exporting ? 'opacity-60' : ''} ${sel ? 'ring-2 ring-gold-400/80 bg-gold-500/10' : ''}" style="padding:.4cqw">${name}
      ${x.shot ? `<img src="${x.shot}" alt="" draggable="false" class="w-full rounded-md border border-gold-500/40 shadow-[0_4px_14px_rgba(0,0,0,.6)]">`
               : '<div class="w-full aspect-[4/3] rounded-md border border-dashed border-ink-600 grid place-items-center text-slate-500" style="font-size:max(9px,1.2cqw)">📷</div>'}</div>`;
    return `<div class="relative flex flex-col items-center ${x.heads || x.kind ? 'justify-center' : ''} rounded-lg overflow-visible ${sel ? 'ring-2 ring-gold-400/80 bg-gold-500/10' : ''}" style="height:${scSetH(x)}cqw;padding:.35cqw 0">${name}
      ${x.kind ? `<div class="font-display font-bold gold-text whitespace-nowrap" style="font-size:max(8px,1.2cqw);margin-bottom:.2cqw">${SC_KIND[x.kind]}</div>` : ''}
      ${x.cm ? `<div data-part="c">${scPartCmd(x)}</div>` : ''}
      ${x.cn && scPartNames(x) ? `<div data-part="n" style="margin-top:.35cqw">${scPartNames(x)}</div>` : ''}
      ${scGearShown(x) ? `<div data-part="g" style="margin-top:.4cqw">${scPartGear(x)}</div>` : ''}
    </div>`;
  }
  const SC_DEF_COLOR = { name: '#f5c542', tag: '#fde68a', kd: '#fde68a', vip: '#f5c542', power: '#ffffff', kp: '#ffffff', merit: '#ffffff' };
  const scBoxSt = (w) => (w.fill === 'none' ? '' : `background:${scRgba(w.fill || '#07090f', w.fillO / 100)};`) + (w.border === 'none' ? '' : `border:${w.bw || 1}px solid ${w.border || 'rgba(224,169,27,.4)'};`);
  function scTxHtml(o) {                                    // eigener Text
    const box = scBoxSt(o);
    return `<div class="rounded-lg font-bold whitespace-pre text-center" style="color:${o.color || '#ffffff'};${o.shadow ? 'filter:drop-shadow(0 2px 3px rgba(0,0,0,.85));' : ''}${box ? box + 'padding:.5cqw 1.2cqw;' : ''}font-size:max(11px,2.2cqw)">${R.esc(o.text) || '&nbsp;'}</div>`;
  }
  // Avatar-Rahmen aus /icons/avatar/ – je Rahmen: Mitte x, Mitte y, Radius (in % der Bildbreite) – aus dem Bild gemessen, sodass das Foto das Loch ganz ausfüllt (keine Lücken)
  const AV_FRAMES = {"a-heros-ways":[50.2,52.4,23.8],"ace-in-the-hole":[49.6,53.3,22.6],"aegean-origins":[49.9,50.3,22.3],"all-out-rumble":[50.8,48.8,26.5],"amun-ra-the-supreme":[49.7,47.6,25.0],"ancient-city-fireworks":[49.8,48.2,22.7],"ancient-torc":[50.6,49.5,23.7],"angkor-dreams":[47.5,47.2,27.1],"anniversary-letter":[49.7,47.2,26.2],"asgard":[50.3,51.0,19.5],"autumnal-bounty":[51.8,50.2,23.3],"autumnal-splendor":[51.2,51.0,27.1],"avatar-of-bast":[49.7,53.5,24.9],"babylonian-gardens":[48.0,48.7,26.6],"banquet-regalia":[49.7,53.1,25.8],"barbarian-incursion":[49.7,49.8,23.0],"beneath-a-starry-night":[48.6,47.7,23.0],"beneath-autumns-eternal-moon":[51.1,50.7,24.3],"birthday-bash":[51.3,45.6,24.1],"black-falcon":[50.1,46.8,21.0],"blazing-star":[48.0,50.2,24.7],"bon-voyage":[50.6,48.6,25.2],"briar-rose":[50.5,56.2,19.8],"brilliant-dome":[49.7,50.2,18.7],"bronze-face":[49.9,50.1,19.2],"bronze-lotus":[48.8,48.7,22.9],"bucolic-poetry":[50.9,50.0,26.3],"bunny-bash":[48.4,48.9,26.5],"bunny-blessed":[47.4,41.9,24.1],"bunny-bonnet":[50.6,51.7,24.2],"capitoline-wolf":[46.9,47.0,28.5],"celestial-sea":[51.4,49.5,25.4],"champions-wreath":[50.8,48.4,23.7],"champions-wreath (2)":[50.8,48.4,23.7],"city-of-angels":[50.1,48.5,18.7],"cloud-palace":[49.3,48.8,23.3],"cloudpiercing-plumes":[50.5,47.4,21.5],"clouds-rise-like-dragons":[50.4,51.3,22.8],"colossus-of-rhodes":[48.7,48.8,26.6],"cranes-cry":[49.5,43.9,26.3],"d-y-nt":[53.4,51.3,27.9],"deer-friends":[47.6,47.7,23.9],"desert-eagle":[48.0,46.0,27.9],"dionysian-crown":[51.3,53.4,22.3],"divine-favor":[50.0,48.8,23.1],"divine-laurels":[48.5,47.7,28.2],"dome-carvings":[49.9,49.7,24.6],"down-am-main-street":[51.6,47.1,22.5],"dragon-boat-drumroll":[52.5,48.2,27.0],"dragon-dance":[51.4,52.0,25.0],"drifting-down-a-river-of-stars":[49.9,49.8,25.2],"dust-devil":[50.5,49.2,22.1],"easter-egg":[50.7,48.0,23.8],"egyptian-blue":[50.5,48.3,26.2],"eight-golden-blossoms":[51.0,48.5,24.7],"emerging-phantoms":[50.6,50.7,24.2],"enchanted-pumpkin":[51.7,52.4,24.5],"endless-melody":[48.0,46.6,26.3],"entrancing-witch":[46.7,49.1,27.2],"eventide-witch":[50.2,49.4,23.7],"ever-changing-world":[51.0,52.3,26.1],"eye-incarnadine":[49.8,51.4,22.5],"eye-of-power":[48.6,49.9,23.8],"face-changer":[50.8,50.7,22.3],"fall-of-troy":[49.6,48.5,24.9],"fearless-charger":[50.0,50.0,25.3],"festival-of-spring":[50.4,52.4,19.0],"fireworks-festival":[49.3,49.3,23.7],"flames-of-apollo":[50.0,49.0,21.6],"flames-of-rebirth":[49.7,49.3,23.8],"flames-of-xibalba":[48.4,47.5,21.8],"fleur-de-lys":[47.7,46.7,27.8],"floral-aurora":[50.7,49.7,25.6],"flowers-and-scriptures":[49.0,48.7,25.7],"founder":[49.8,49.8,27.1],"fragrant-waters":[50.7,48.4,23.8],"frightful-night":[49.0,47.9,24.6],"frostborn-legend":[49.0,49.4,24.9],"frozen-treats":[50.5,48.1,22.7],"gae-gyeongbok":[50.3,49.9,26.4],"garden-grove":[53.6,49.4,22.7],"gate-of-all-nations":[49.6,49.8,26.1],"gemmed-crown":[49.8,46.0,28.5],"gilded-ruyi-scepter":[50.0,50.6,24.2],"gilded-wings":[50.1,47.8,21.8],"glittering-sparkles":[50.7,46.9,24.3],"gobbled-up":[50.6,47.9,21.2],"goddess-of-joy":[50.3,49.2,24.1],"golden-anubis":[50.5,52.2,21.3],"golden-dragon":[49.8,47.1,23.4],"golden-eye-of-ra":[48.1,49.7,26.3],"golden-laurels":[50.5,47.7,27.3],"golden-pyramidions":[49.0,47.5,25.1],"golden-sunbird":[50.2,50.3,20.2],"golden-war-helm":[50.6,53.4,22.9],"golden-window-art":[50.0,50.3,23.1],"goldwood-frame":[50.8,50.0,25.6],"governor-of-the-year-2024":[49.7,49.3,23.4],"governors-gambit":[51.8,47.2,23.5],"grand-ball":[47.0,45.8,28.7],"guqin-melody":[49.3,47.2,22.2],"happy-chorus":[51.0,49.5,24.9],"harmonic-radiance":[51.8,47.9,24.0],"harvest-wreath":[50.7,48.0,25.1],"heart-of-the-north":[50.1,47.6,24.4],"high-sea-legend":[49.8,50.8,20.6],"horn-of-victory":[48.6,47.7,27.2],"immortal-legacy":[49.4,52.0,21.0],"imperial-impression":[47.9,49.2,24.6],"imperial-terrace":[49.1,48.7,25.3],"imperium-sine-fine":[49.9,50.9,21.6],"ink-of-eons":[51.6,49.4,26.6],"ink-wine-and-song":[51.8,49.2,25.4],"iridescent-ice":[50.3,50.7,24.0],"janggu-in-the-wind":[47.0,47.7,27.8],"journey-together":[51.9,50.8,24.3],"judgement-of-maat":[50.5,49.6,23.7],"karakus-treasure":[49.4,50.2,23.5],"key-of-kingship":[50.6,50.5,17.4],"killer-kunoichi":[49.6,55.5,21.5],"knife-of-khnum":[52.2,50.7,21.1],"lampshadow-evening":[53.5,52.0,23.8],"legendary-arms":[49.2,49.3,24.7],"legendary-dancer":[50.4,54.7,24.6],"leonine-crown":[50.2,53.0,22.2],"living-infinite":[53.1,47.8,25.4],"lotus-lake":[46.9,44.9,23.7],"lotus-of-life":[49.6,50.1,21.6],"love-after-dusk":[53.5,47.9,27.5],"loveliest-of-trees":[50.6,48.8,24.8],"luck-of-the-lion":[51.7,46.8,24.5],"lucky-koilligraphy":[49.2,48.8,23.6],"lunar-longing":[46.9,48.0,23.2],"lyrical-lilies":[52.4,47.8,24.8],"magpie-branches":[50.3,49.3,22.8],"maritime-tidings":[50.4,47.7,23.2],"mark-of-shu":[48.4,49.2,25.6],"matadors-regalia":[48.4,47.0,26.6],"mayan-secrets":[49.8,49.9,20.9],"meow-moneymaker":[50.5,51.6,23.1],"metropolis-melodies":[49.3,48.0,24.2],"moment-of-celebration":[50.4,47.4,26.5],"moonlit-teatime":[49.3,49.6,26.8],"moonstone-crown":[49.8,48.2,25.7],"morning-mist":[50.2,50.9,24.3],"mycenaean-pottery":[50.6,50.0,23.7],"nautical-compass":[50.9,48.5,24.1],"nehebkaus-ward":[50.5,50.2,20.8],"neon-memories":[49.3,48.7,22.7],"nilotic-memories":[48.9,50.8,21.9],"oer-the-fields":[48.6,49.1,25.8],"olympia":[47.5,47.7,28.0],"onward-and-upward":[51.5,49.9,26.8],"origarland":[48.5,53.0,25.9],"out-with-the-old":[50.8,49.8,20.5],"p-s-i-love-you":[50.0,49.8,24.0],"paper-dragon":[48.8,48.7,24.6],"paths-of-the-stars":[49.7,47.1,24.6],"pavilion-serenity":[50.1,48.5,25.2],"pawsome-protection":[50.0,51.9,22.8],"pearl-of-the-far-east":[51.1,49.4,24.2],"pesky-pumpkin":[50.2,48.4,25.0],"phantasmagoria":[49.9,48.2,25.1],"porcelain-pusher":[46.9,48.8,24.6],"prismatic-kaleidoscope":[48.2,48.1,28.2],"quill-pals":[51.1,48.2,26.4],"quinquennial-crown":[49.7,48.1,20.8],"ramadan-mubarak":[49.8,49.9,25.4],"remnants-of-time":[50.9,51.3,22.5],"resonant-dawn":[51.8,47.9,24.0],"rheinische-sinfonie":[52.7,49.2,26.8],"rhythm-of-bamboo":[49.7,49.1,27.0],"riddle-of-the-desert":[51.9,49.9,22.5],"rising-phoenix":[50.7,50.4,21.2],"rites-of-kings":[50.4,47.0,26.2],"rose-petals":[47.5,46.1,27.8],"royal-respite":[50.6,47.0,24.6],"royal-respite (1)":[50.6,47.0,24.6],"sacred-garden":[50.7,49.7,25.6],"sakura-fantasy":[49.0,48.6,26.9],"samurai-headgear":[49.6,58.1,21.6],"sanguine-favor":[48.2,49.2,23.9],"santa-claus":[50.3,47.9,26.2],"scent-of-sakura":[50.3,49.0,23.7],"scroll-of-the-stars":[49.2,48.8,24.9],"sea-of-distant-dreams":[50.6,47.3,25.4],"sea-scion":[51.3,49.9,25.0],"seaside-rendezvous":[49.3,48.3,25.9],"senet-or":[50.4,50.5,23.5],"sharkpunk":[52.0,44.6,23.8],"sharp-bites":[52.0,44.6,23.8],"silver-anubis":[50.3,50.0,20.5],"silver-eye-of-ra":[50.6,50.6,25.8],"skyward-spires":[52.6,48.0,23.1],"solar-barque":[50.1,48.2,22.3],"sphinx":[49.9,52.0,21.9],"spirit-of-the-age":[48.6,48.2,23.9],"splendid-foresight":[49.2,49.9,20.7],"springs-birdsong":[50.7,48.5,24.5],"star-crossed-lovers":[51.0,49.3,23.7],"steadfast-oath":[50.2,49.0,24.8],"steelborne-song":[51.2,47.9,26.4],"steelborne-spring":[51.2,47.9,26.4],"strength-of-the-gods":[50.3,51.8,26.5],"sumerian-memories":[49.7,47.5,24.1],"summer-lilies":[50.1,48.5,23.7],"summer-nights":[50.9,50.7,24.4],"swallows-return":[49.5,49.8,24.0],"swan-love":[49.8,48.5,26.7],"sweet-meeting":[49.9,45.7,25.9],"sweet-summer":[51.6,49.7,23.5],"sweetest-dreams":[48.7,45.6,23.0],"take-a-turn":[49.7,49.0,24.2],"tasseled-crown":[50.3,54.6,27.9],"tempered-flame":[53.2,48.5,26.4],"temple-of-artemis":[46.5,47.6,29.5],"thanksgiving-dinner":[47.3,47.7,25.5],"thanksgiving-harvest":[50.3,45.8,25.0],"the-great-wall":[47.2,48.6,27.2],"theater-of-muses":[51.1,49.4,24.6],"thistles-and-thorns":[49.8,49.9,23.2],"time-flies":[51.5,49.9,26.8],"tis-the-season":[46.3,48.6,28.4],"tumi":[50.1,49.9,22.8],"turquoise-comforts":[49.8,49.2,25.5],"turquoise-invocation":[49.7,48.7,25.9],"undersea-kingdom":[50.8,51.5,23.8],"unequalled-glory":[51.3,47.5,24.5],"vile-witch":[46.4,49.1,26.8],"wanderer-of-duat":[52.0,49.0,24.6],"war-incarnate":[48.2,49.2,23.7],"warmth-of-spring-49":[49.7,47.8,23.5],"wave-warlord":[51.3,49.9,25.0],"wavedancer":[51.4,47.6,25.4],"waveglimmer":[53.2,47.3,24.8],"wild-spirit":[46.3,47.3,27.1],"will-of-the-empire":[49.9,49.1,22.8],"wind-of-the-andes":[50.1,47.5,25.0],"wings-of-iset":[50.7,47.9,22.5],"wings-of-tasi":[49.9,45.8,25.3],"winter-warmth":[51.2,50.8,20.6],"words-of-love":[48.3,48.9,22.1],"wormwood-and-wine":[49.9,48.0,26.4],"wrath-of-anubis":[50.7,53.8,26.7],"year-of-the-rat":[49.7,47.7,27.6]};
  const avFrameImg = (id) => '/icons/avatar/' + encodeURIComponent(id) + '.webp';
  const avFrameName = (id) => id.replace(/\s*\(\d+\)$/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  (async function syncFrames() {                           // neue Rahmen im GitHub-Ordner automatisch übernehmen
    let list = null;
    try { const c = JSON.parse(localStorage.getItem('rok_frame_files') || 'null'); if (c && Date.now() - c.t < 3600e3 && Array.isArray(c.list)) list = c.list; } catch {}
    if (!list) { try { const r = await fetch('https://api.github.com/repos/marcopopp51200-coder/rok-scanner/contents/icons/avatar', { headers: { accept: 'application/vnd.github+json' } });
      if (!r.ok) return; list = (await r.json()).map(x => String(x?.name || '')).filter(n => /\.webp$/i.test(n)).map(n => n.slice(0, -5));
      try { localStorage.setItem('rok_frame_files', JSON.stringify({ t: Date.now(), list })); } catch {} } catch { return; } }
    list.forEach(f => { if (!AV_FRAMES[f]) AV_FRAMES[f] = [50, 50, 24]; });
  })();
  const scSkinHtml = (src, w) => `<img src="${src}" alt="" draggable="false" class="block max-w-none object-contain" style="box-sizing:border-box;width:${3 * SC_G}cqw;height:${3 * SC_G}cqw;border-radius:1cqw;${w.border === 'none' ? '' : `border:${w.bw || 2}px solid ${w.border || 'rgba(245,197,66,.8)'};`}${w.fill === 'none' ? '' : `background:${scRgba(w.fill || '#07090f', w.fillO / 100)};`}${w.shadow ? 'filter:drop-shadow(0 6px 10px rgba(0,0,0,.6));' : ''}">`;
  // VIP-Symbol aus /icons/anything/vip<Stufe>.webp (fehlt die Stufe: vip16.webp)
  const scVipIcon = (lvl) => { const n = Math.max(0, Math.min(20, Math.round(+lvl || 16)));
    return `<img src="/icons/anything/vip${n}.webp" alt="" draggable="false" onerror="if(!this.dataset.fb){this.dataset.fb=1;this.src='/icons/anything/vip16.webp'}" style="height:1.45em;width:auto;margin-right:.3em;flex:none">`; };
  function scWidget(k, w) {
    const st = sc.stats, W = SC_ELS[k], shadow = w.shadow ? 'filter:drop-shadow(0 2px 3px rgba(0,0,0,.85));' : '';
    const boxSt = scBoxSt(w), box = 'rounded-lg', own = (auto) => auto;   // Werte kommen immer aus dem Profil
    if (k === 'skin') {
      const src = D().skin;
      return src ? `<img src="${src}" alt="" draggable="false" class="block max-w-none object-contain" style="box-sizing:border-box;width:${3 * SC_G}cqw;height:${3 * SC_G}cqw;border-radius:1cqw;${w.border === 'none' ? '' : `border:${w.bw || 2}px solid ${w.border || 'rgba(245,197,66,.8)'};`}${w.fill === 'none' ? '' : `background:${scRgba(w.fill || '#07090f', w.fillO / 100)};`}${w.shadow ? 'filter:drop-shadow(0 6px 10px rgba(0,0,0,.6));' : ''}">`
        : `<div class="rounded-lg border border-dashed border-gold-500/60 bg-ink-950/60 grid place-items-center text-center text-gold-300" style="width:${3 * SC_G}cqw;height:${3 * SC_G}cqw;font-size:max(9px,1.1cqw)">🏯<br>City-Skin</div>`;
    }
    if (k === 'avatar') {
      const av = st.avatar, letter = String(st.name || '?').charAt(0).toUpperCase();
      const inner = R.isImgAv(av) ? `<img src="${av}" alt="" draggable="false" class="w-full h-full object-cover">`
        : `<span class="w-full h-full grid place-items-center ${av ? 'bg-ink-800' : 'bg-gradient-to-br from-gold-400 to-gold-600 text-ink-950 font-bold'}" style="font-size:3.4cqw">${R.esc(av && av.length <= 8 ? av : letter)}</span>`;
      const F = w.frame && AV_FRAMES[w.frame];
      if (F) {                                                  // Rahmen: Bild rund im Loch zentriert, Rahmen darüber
        const S = 3 * SC_G, D = (2 * F[2] + 0.6) / 100 * S * (w.fz || 100) / 100;
        return `<div class="relative" style="width:${S}cqw;height:${S}cqw">
          <div class="absolute overflow-hidden rounded-full" style="width:${D}cqw;height:${D}cqw;left:${F[0] / 100 * S - D / 2}cqw;top:${F[1] / 100 * S - D / 2}cqw">${inner}</div>
          <img src="${avFrameImg(w.frame)}" alt="" draggable="false" class="absolute inset-0 w-full h-full object-contain pointer-events-none" style="${w.shadow ? 'filter:drop-shadow(0 4px 8px rgba(0,0,0,.55));' : ''}"></div>`;
      }
      return `<div class="overflow-hidden" style="width:${3 * SC_G}cqw;height:${3 * SC_G}cqw;box-sizing:border-box;border-radius:${w.round ? '50%' : '1.2cqw'};${w.border === 'none' ? '' : `border:${w.bw || 2}px solid ${w.border || 'rgba(245,197,66,.8)'};`}${w.shadow ? 'box-shadow:0 0 14px rgba(245,197,66,.35),0 4px 10px rgba(0,0,0,.6);' : ''}">${inner}</div>`;
    }
    const goldTxt = !w.color && (k === 'name' || k === 'vip');
    const col = w.color ? `color:${w.color};` : (goldTxt ? '' : `color:${SC_DEF_COLOR[k]};`);
    const pad = (boxSt || '') + `box-sizing:border-box;display:flex;align-items:center;height:${k === 'name' ? 1.5 * SC_G : 0.86 * SC_G}cqw;padding:0 ${boxSt ? 1.1 : 0}cqw;`;   // Höhe = 1 Kästchen (Name 1,5)
    const gold = (t) => goldTxt ? `<span class="gold-text">${t}</span>` : t;
    if (k === 'name') return `<div class="${box} font-display font-extrabold whitespace-nowrap" style="${col}${shadow}${pad}font-size:max(10px,2.5cqw)" translate="no">${gold(R.esc(st.name || ''))}</div>`;
    if (k === 'tag') return `<div class="${box} font-bold whitespace-nowrap" style="${col}${shadow}${pad}font-size:max(8px,1.65cqw)" translate="no">${own(`[${R.esc(st.tag || '–')}]`)}</div>`;
    if (k === 'kd') return `<div class="${box} font-bold whitespace-nowrap" style="${col}${shadow}${pad}font-size:max(8px,1.55cqw)">${own(`${w.ni ? '' : '🏰 '}Königreich ${R.esc(st.kd || '–')}`)}</div>`;
    if (k === 'vip') return `<div class="${box} font-display font-extrabold whitespace-nowrap" style="${col}${shadow}${pad}font-size:max(8px,1.7cqw)">${w.ni ? '' : scVipIcon(st.vip)}${gold(st.vip != null ? R.vipName(st.vip) : 'VIP –')}</div>`;
    const v = st[k];
    return `<div class="${box} text-center flex flex-col justify-center" style="width:${5 * SC_G}cqw;height:${2 * SC_G}cqw;box-sizing:border-box;${boxSt}${shadow}padding:0 .8cqw">
      <div class="uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis ${w.color ? '' : 'text-slate-400'}" style="${w.color ? `color:${w.color};opacity:.8;` : ''}font-size:max(7px,.95cqw)">${W.icon} ${W.label}</div>
      <div class="font-extrabold tabular-nums whitespace-nowrap" style="${col}font-size:max(10px,2cqw)">${own(v != null ? R.short(v) : '–')}</div></div>`;
  }
  const scTf = (o) => `translate(-50%,-50%) rotate(${o.r || 0}deg) scale(${o.s})`;
  // ---- Live-Vorschau des Sets, das gerade bearbeitet wird (Kopie der Bühnen-Elemente, auf das Set gezoomt) ----
  let scPrevRaf = 0;
  const scPreviewSoon = () => { if (!scPrevRaf) scPrevRaf = requestAnimationFrame(() => { scPrevRaf = 0; scDrawPreview(); }); };
  function scDrawPreview() {
    const box = R.$('scPrev'); if (!box) return;
    const x = sc.doc && sc.sel ? scSetOfSel() : null, st = R.$('scStage'), els = R.$('scEls');
    if (!x || !st || !els) { box.innerHTML = ''; return; }
    const d = D(), i = d.sets.indexOf(x), SW = st.offsetWidth, SH = st.offsetHeight, f = SW / 100, a = x.arm;
    const keys = [...(x.split ? [['pc:' + i, x.parts.c, x.cm], ['pn:' + i, x.parts.n, x.cn], ['pg:' + i, x.parts.g, scGearShown(x)]] : [['set:' + i, x, true]]),
      ['arm:' + i, a, scArmBlk(a)], ['st:' + i, x.st, x.st.on && scStHas(a)], ['fm:' + i, a.fm, a.fsep && !!a.formation && a.fpos !== 'hidden']];
    const bs = keys.filter(([k, , on]) => on && els.querySelector(`[data-el="${k}"]`)).map(([k, o]) => scBox(k, o)).filter(Boolean);
    const inner = document.createElement('div');
    inner.style.cssText = `position:absolute;left:0;top:0;width:${SW}px;height:${SH}px;container-type:inline-size;transform-origin:0 0;pointer-events:none`;
    [...keys.map(([k]) => `[data-el="${k}"]`), `[data-fma="${i}"]`].forEach(q => { const e = els.querySelector(q); if (!e || getComputedStyle(e).visibility === 'hidden') return;
      const c = e.cloneNode(true); [c, ...c.querySelectorAll('*')].forEach(n => { n.removeAttribute('id'); [...n.attributes].forEach(at => { if (at.name.startsWith('data-')) n.removeAttribute(at.name); }); });
      c.style.zIndex = ''; inner.appendChild(c); });
    box.innerHTML = '';
    if (!bs.length) { box.innerHTML = '<div class="absolute inset-0 grid place-items-center text-slate-500 text-xs">Alles ausgeblendet</div>'; return; }
    const l = Math.min(...bs.map(b => b.l)) * f, r = Math.max(...bs.map(b => b.r)) * f, t = Math.min(...bs.map(b => b.t)) * f, b2 = Math.max(...bs.map(b => b.b)) * f;
    const BW = box.clientWidth, BH = box.clientHeight, pad = 14, k = Math.min((BW - 2 * pad) / Math.max(1, r - l), (BH - 2 * pad) / Math.max(1, b2 - t), 3);
    inner.style.transform = `translate(${(BW - (r - l) * k) / 2 - l * k}px,${(BH - (b2 - t) * k) / 2 - t * k}px) scale(${k})`;
    box.appendChild(inner);
  }
  function drawStage() {
    scPreviewSoon();
    const d = D(), st = R.$('scStage'), pfsAll = scArmFsAll(d);
    st.style.aspectRatio = `100 / ${scH(d)}`;
    scApplyBg();
    R.$('scGridOv').classList.toggle('hidden', !(sc.edit && d.grid));
    { const gc = SC_GRID_C[d.gridC] || SC_GRID_C.gold, ov = R.$('scGridOv');
      ov.style.backgroundImage = `linear-gradient(to right, ${gc.c} 1px, transparent 1px),linear-gradient(to bottom, ${gc.c} 1px, transparent 1px)`;
      ov.style.backgroundSize = `${SC_G}cqw ${SC_G}cqw`; ov.style.backgroundPosition = `calc(50cqw - ${Math.floor(50 / SC_G) * SC_G}cqw) 0`;
      ov.firstElementChild.style.background = gc.m; ov.children[1].classList.add('hidden'); }
    ['ring-2', 'ring-gold-500/60'].forEach(k => st.classList.toggle(k, sc.edit));
    const ed = (key) => sc.edit ? ` cursor-move touch-none rounded-md ${sc.sel === key ? 'outline outline-2 outline-gold-300' : 'outline-dashed outline-1 outline-gold-400/70 hover:outline-2'}` : '';
    const pos = (o) => `left:${o.x}cqw;top:${o.y}cqw;transform:${scTf(o)}`;
    R.$('scEls').innerHTML = d.sets.map((x, i) => `<div data-el="set:${i}" class="absolute${ed('set:' + i)}${!sc.edit && d.sets.length > 1 ? ' cursor-pointer' : ''}" style="${pos(x)};${i === sc.si && !sc.exporting ? 'z-index:5;' : ''}width:${x.mode === 'shot' ? SC_SHOT_W : SC_SET_W}cqw${x.split && x.mode !== 'shot' ? ';visibility:hidden;pointer-events:none' : ''}" title="${R.esc(x.name || 'Set ' + (i + 1))}">${scMiniSet(x, i)}</div>`).join('')
      + d.sets.map((x, i) => {                                // Freies Set: Teile einzeln
          if (!x.split || x.mode === 'shot') return '';
          const P = (k, t, h) => { if (!h) return ''; const p = x.parts[k]; if (p.x == null) { p.x = x.x; p.y = x.y; p.s = x.s; }
            return `<div data-el="${t}:${i}" class="absolute${ed(t + ':' + i)}${!sc.edit ? ' cursor-pointer' : ''}" style="${pos(p)}">${h}</div>`; };
          return P('c', 'pc', x.cm ? scPartCmd(x) : '') + P('n', 'pn', x.cn ? scPartNames(x) : '') + P('g', 'pg', scGearShown(x) ? scPartGear(x) : '');
        }).join('')
      + d.sets.map((x, i) => scArmBlk(x.arm) && !(x.kind && !x.gearOn) ? `<div data-el="arm:${i}" class="absolute${ed('arm:' + i)}" style="${pos(x.arm)}">${scArmHtml(x.arm, n => n + 'cqw', 'arm', null, null, pfsAll)}</div>` : '').join('')
      + d.sets.map((x, i) => { const a = x.arm; if (!(a.fsep && a.formation && a.fpos !== 'hidden' && !(x.kind && !x.gearOn))) return '';
          if (a.fm.x == null) { a.fm.x = a.x ?? x.x; a.fm.y = a.y ?? x.y; a.fm.s = a.s; }
          return `<div data-el="fm:${i}" class="absolute${ed('fm:' + i)}" style="${pos(a.fm)}">${scFmHtml(a)}</div>`; }).join('')
      + (() => { const sfs = scStatFsAll(d); return d.sets.map((x, i) => x.st.on && scStHas(x.arm) && !(x.kind && !x.gearOn) ? `<div data-el="st:${i}" class="absolute${ed('st:' + i)}" style="${pos(x.st)}">${scArmHtml(x.arm, n => n + 'cqw', 'st', x.st, sfs)}</div>` : '').join(''); })()
      + Object.entries(d.els).filter(([, w]) => w.on).map(([k, w]) => `<div data-el="w:${k}" class="absolute${ed('w:' + k)}" style="${pos(w)}">${scWidget(k, w)}</div>`).join('')
      + (d.texts || []).map(t => `<div data-el="tx:${t.id}" class="absolute${ed('tx:' + t.id)}" style="${pos(t)}">${scTxHtml(t)}</div>`).join('')
      + (d.xskins || []).map(x => `<div data-el="xs:${x.id}" class="absolute${ed('xs:' + x.id)}" style="${pos(x)}">${scSkinHtml(x.src, x)}</div>`).join('')
      + d.sets.map((x, i) => scFmAuto(x.arm) && !(x.kind && !x.gearOn) ? `<div data-fma="${i}" class="absolute pointer-events-none" style="left:0;top:0;visibility:hidden">${scFmHtml(x.arm)}</div>` : '').join('');
    scFmOverlay(d);
  }
  function drawListBar() {
    const doc = sc.doc, many = doc.list.length > 1, b = 'text-xs px-3 py-1.5 rounded-lg border';
    R.$('scListBar').classList.toggle('hidden', !sc.own && !many);
    R.$('scListBar').innerHTML = doc.list.map(x => `<button type="button" data-scl="${R.esc(x.id)}" aria-pressed="${x.id === doc.active}" class="seg-btn rounded-lg px-3 py-1.5 text-xs font-semibold border border-ink-700 transition" translate="no">${R.esc(x.title)}</button>`).join('')
      + (sc.own ? (doc.list.length < SC_MAX_LIST ? `<button type="button" id="scNewList" class="${b} border-dashed border-gold-500/60 text-gold-300 hover:border-gold-400">+ Neuer Showcase</button>` : '')
        + (doc.list.length < SC_MAX_LIST ? `<button type="button" id="scDupList" class="${b} border-ink-600 hover:border-gold-500/60 hover:text-gold-300">⧉ Duplizieren</button>` : '')
        + `<button type="button" id="scRefresh" title="Aus der Cloud neu laden und Überlappungen oben/unten auflösen" class="${b} border-ink-600 hover:border-gold-500/60 hover:text-gold-300">⟳ Aktualisieren</button>`
        + `<button type="button" id="scRenList" class="${b} border-ink-600 hover:border-gold-500/60 hover:text-gold-300">✎ Umbenennen</button>`
        + (many ? `<button type="button" id="scDelList" class="${b} border-red-500/40 text-red-300 hover:bg-red-500/10">🗑 Showcase löschen</button>` : '')
        + `<div class="ml-auto flex flex-wrap items-center gap-2">
            <label class="inline-flex items-center gap-2 text-xs text-slate-300">👁 Im Profil zeigen
            <select id="scShow" class="bg-ink-950 border border-ink-600 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-gold-500">
              ${many ? `<option value="all"${doc.show === 'all' ? ' selected' : ''}>Alle Showcases</option>` : `<option value="all"${doc.show !== 'none' ? ' selected' : ''}>Öffentlich</option>`}
              ${many ? doc.list.map(x => `<option value="${R.esc(x.id)}"${doc.show === x.id ? ' selected' : ''}>Nur „${R.esc(x.title)}“</option>`).join('') : ''}
              <option value="none"${doc.show === 'none' ? ' selected' : ''}>🔒 Keinen – privat</option>
            </select></label>
            <button type="button" id="scDetPriv" role="switch" aria-checked="${!!doc.detPriv}" ${doc.show === 'none' ? 'disabled' : ''} title="Andere sehen nur das Showcase-Bild – Sets, Ausrüstung und Details darunter bleiben privat"
              class="${b} ${doc.detPriv ? 'border-amber-400/70 bg-amber-500/15 text-amber-200' : 'border-ink-600 text-slate-300 hover:border-gold-500/60 hover:text-gold-300'} disabled:opacity-40">${doc.detPriv ? '🔒 Details privat' : '🔓 Details öffentlich'}</button>
          </div>`
        : '');
    if (sc.own) R.$('scListBar').insertAdjacentHTML('beforeend', `<div class="w-full text-[11px] text-slate-500"><span>${doc.show === 'none' ? '🔒 Dein Showcase ist privat – andere Spieler sehen ihn nicht.'
      : (doc.show === 'all' ? (many ? '👁 Andere Spieler sehen alle deine Showcases in deinem Profil.' : '👁 Andere Spieler sehen deinen Showcase in deinem Profil.') : '👁 Andere Spieler sehen nur den ausgewählten Showcase.')
        }</span>${doc.detPriv ? ' <span>Details sind privat – andere sehen nur das Bild.</span>' : ''}</div>`);
  }
  function drawWidgetOpts(d) {
    R.$('scWidgetOpts').innerHTML = Object.entries(SC_ELS).map(([k, w]) =>
      `<button type="button" data-wsel="${k}" aria-pressed="${sc.sel === 'w:' + k}" title="${d.els[k].on ? 'Sichtbar' : 'Ausgeblendet'} – antippen zum Einstellen"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition ${d.els[k].on ? 'border-gold-400/70 bg-gold-500/15 text-gold-100' : 'border-ink-600 text-slate-500 hover:text-slate-200'} ${sc.sel === 'w:' + k ? 'ring-2 ring-gold-300 ring-offset-1 ring-offset-ink-950' : 'hover:border-gold-500/60'}">${d.els[k].on ? '👁' : '<span class="opacity-60">⊘</span>'} ${w.icon} ${w.label}</button>`).join('')
      + (() => { const cx = scSetOfSel(); return '<span class="self-center w-px h-6 bg-ink-600 mx-1"></span>' + d.sets.map((x, j) => `<button type="button" data-wset="${j}" title="Set antippen zum Einstellen"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition ${x === cx ? 'border-gold-400 bg-gold-500/25 text-gold-100 ring-2 ring-gold-300 ring-offset-1 ring-offset-ink-950' : 'border-sky-500/50 bg-sky-500/10 text-sky-100 hover:border-gold-500/60'}" translate="no">${x.kind ? '' : '🛡 '}${R.esc(scSetLabel(d, x))}${({ partial: ' ⇅', free: ' ✥' })[x.syncMode] || ''}</button>`).join(''); })();
  }
  function drawEditBar() {
    const d = D(), on = sc.own && sc.edit;
    R.$('scEditBar').classList.toggle('hidden', !on);
    if (!on) return;
    R.$('scGridOn').checked = d.grid; R.$('scSyncA').value = d.syncA || 'top'; drawSyncMenu(d); R.$('scGuidesOn').checked = d.guides !== false;
    R.$('scGridC').innerHTML = Object.entries(SC_GRID_C).map(([k, v]) => `<option value="${k}"${k === d.gridC ? ' selected' : ''}>${v.label}</option>`).join('');
    R.$('scHeight').innerHTML = Object.entries(SC_HEIGHTS).map(([k, v]) => `<option value="${k}"${k === d.h ? ' selected' : ''}>${v.label}</option>`).join('');
    drawWidgetOpts(d);
    drawProps();
  }
  function scSelObj(key = sc.sel) {
    if (!key) return null;
    const [t, k] = key.split(':'), d = D();
    if (t === 'set') return d.sets[+k] || null;
    if (t === 'arm') return d.sets[+k]?.arm || null;
    if (t === 'st') return d.sets[+k]?.st || null;
    if (t === 'pc' || t === 'pn' || t === 'pg') return d.sets[+k]?.parts?.[t[1]] || null;
    if (t === 'fm') return d.sets[+k]?.arm?.fm || null;
    if (t === 'tx') return (d.texts || []).find(x => x.id === k) || null;
    if (t === 'xs') return (d.xskins || []).find(x => x.id === k) || null;
    return d.els[k] || null;
  }
  function drawProps() {                                     // festes Bearbeitungsfenster: Seite springt nie, gleiches Set → Scroll im Fenster bleibt
    const el = R.$('scProps'), wy = window.scrollY;
    el.style.minHeight = (el.__minH || 0) + 'px';             // Fenster wird nie kleiner → die Seite darunter rutscht nicht hoch
    drawPropsInner();
    el.__minH = Math.max(el.__minH || 0, el.offsetHeight); el.style.minHeight = el.__minH + 'px';
    if (Math.abs(window.scrollY - wy) > 1) window.scrollTo({ top: wy, behavior: 'instant' });   // Mausrad scrollt ganz normal die Seite
  }
  function drawPropsInner() {
    if (sc.doc) drawWidgetOpts(D());
    const o = scSelObj(), el = R.$('scProps');
    { const rb = R.$('scRemoveSel'); if (rb) rb.disabled = !o; }
    if (!o) { el.innerHTML = '<span class="text-xs text-slate-500">Element auf der Bühne oder oben antippen, um es einzustellen. Ziehen verschiebt es – mit Raster rastet es symmetrisch ein.</span>'; return; }
    const [t, k] = sc.sel.split(':'), d = D();
    const PL = { pc: '👤 Kommandanten', pn: '🔤 Namen', pg: '🛡 Ausrüstung', fm: '🔰 Formation' }, sx = scSetOfSel(), sxc = sx;
    const label = t === 'set' ? (d.sets[+k].name || `Set ${+k + 1}`) : PL[t] ? `${PL[t]} · ${d.sets[+k].name || 'Set ' + (+k + 1)}` : t === 'arm' ? `⚔ Rüstung · ${d.sets[+k].name || 'Set ' + (+k + 1)}` : t === 'st' ? `📊 Werte · ${d.sets[+k].name || 'Set ' + (+k + 1)}` : t === 'tx' ? '✏️ Eigener Text' : t === 'xs' ? '🏯 Weiterer City-Skin' : `${SC_ELS[k].icon} ${SC_ELS[k].label}`;
    const textual = t === 'tx' || (t === 'w' && k !== 'avatar' && k !== 'skin'), boxy = t === 'w' || t === 'tx' || t === 'xs', frame = t === 'xs' || (t === 'w' && (k === 'avatar' || k === 'skin'));
    const fillable = boxy && k !== 'avatar', defBw = frame ? 2 : 1;
    const btn = 'px-3 py-1.5 rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300 transition';
    const sw = 'w-9 h-8 p-0 bg-transparent border border-ink-600 rounded-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';
    const card = (title, body, cls = '') => `<div class="rounded-xl border border-ink-700 bg-ink-950/50 p-3 ${cls}">
        <div class="text-[10px] uppercase tracking-widest text-slate-500 mb-2">${title}</div>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2">${body}</div></div>`;
    const chk = (id, on, txt) => `<label class="inline-flex items-center gap-1.5 cursor-pointer"><input id="${id}" type="checkbox" ${on ? 'checked' : ''} class="w-4 h-4 accent-yellow-500">${txt}</label>`;
    const ck = (f, on, txt) => `<label class="inline-flex items-center gap-1.5 cursor-pointer"><input type="checkbox" data-setopt="${f}" ${on ? 'checked' : ''} class="w-4 h-4 accent-yellow-500">${txt}</label>`;
    const ncHtml = sxc ? `<span class="text-slate-400">Namen-Farbe</span><input type="color" data-setcol value="${sxc.nc || '#ffffff'}" class="${sw}"><button type="button" data-setact="ncreset" class="${btn}">Standardfarbe</button>` : '';
    const MODE_UI = { full: ['🔒', 'Full Sync', 'Full Sync: alle Teile fest in einer Einheit, ein Ziehen bewegt alles', 'bg-gold-500 text-ink-950 shadow-[0_0_14px_rgba(245,197,66,.45)]'],
      partial: ['⇅', 'Partial Sync', 'Partial Sync: angehakte Teile bewegen sich zusammen, der Rest frei', 'bg-emerald-500 text-ink-950 shadow-[0_0_14px_rgba(16,185,129,.45)]'],
      free: ['✥', 'Free Mode', 'Free Mode: jedes Teil einzeln und völlig frei', 'bg-sky-500 text-ink-950 shadow-[0_0_14px_rgba(56,189,248,.45)]'] };
    const splitHtml = sxc ? `<span class="inline-flex items-center gap-1 p-1 rounded-xl border border-ink-600 bg-ink-950" role="radiogroup" aria-label="Modus">${SC_MODES.map(m2 => { const [ic, l, tt, on] = MODE_UI[m2], act = sxc.syncMode === m2;
        return `<button type="button" role="radio" data-setact="${m2}" aria-checked="${act}" aria-pressed="${act}" title="${tt}" class="px-3 py-1.5 rounded-lg font-semibold transition ${act ? on : 'text-slate-300 hover:bg-ink-800 hover:text-white'}">${ic} ${l}</button>`; }).join('')}</span>` : '';
    const syncHtml = sxc ? (() => { const others = d.sets.filter(y => y !== sxc), lk = new Set(scLinked(d, sxc).map(y => y.id)), anyLink = d.sets.some(y => (y.link || []).length), all = others.length > 1 && others.every(y => lk.has(y.id));
      const live = sxc.syncMode === 'partial', full = sxc.syncMode === 'full';
      return `<div class="sm:col-span-2 lg:col-span-3 rounded-lg border ${live ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-ink-700 bg-ink-900/40'} p-2.5">
        <div class="mb-1.5 text-[10px] uppercase tracking-widest ${live ? 'text-emerald-300/80' : 'text-slate-500'}">⇅ Sync Set – was wird zusammengepackt</div>
        ${full ? `<div class="mb-1.5 text-[11px] text-amber-300/90">🔒 Im Full Sync ist alles fest verbunden – für eine eigene Auswahl auf Partial Sync wechseln.</div>
          <div class="mb-2 flex flex-wrap items-center gap-2">
            <button type="button" data-setact="align" title="Kommandanten, Namen, Ausrüstung, Rüstung, Formation und Werte wieder sauber zentriert untereinander packen" class="px-3 py-1.5 rounded-lg border border-gold-500/60 text-gold-200 hover:bg-gold-500/15 transition">⇕ Ausrichten</button>
            <button type="button" data-setact="std" title="Alles, was zum Gear gehört, auf Standard zurücksetzen (100 %, Standard-Position, Formation in der Rüstung)" class="px-3 py-1.5 rounded-lg border border-rose-500/50 text-rose-200 hover:bg-rose-500/15 transition">↺ Standard</button>
          </div>` : ''}
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
          ${sxc.syncMode === 'free' ? '' : SY_KEYS.map(([k2, l]) => `<label class="inline-flex items-center gap-1.5 ${live ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}"><input type="checkbox" data-sy="${k2}" ${(full || (live && sxc.sy[k2])) ? 'checked' : ''} ${live ? '' : 'disabled'} class="w-4 h-4 accent-emerald-500 disabled:cursor-not-allowed">${l}</label>`).join('')}
          ${others.length ? `${sxc.syncMode === 'free' ? '' : '<span class="basis-full h-0"></span>'}<span class="text-slate-400">🔗 Mit Set syncen</span>
            ${others.map(y => `<button type="button" data-link="${d.sets.indexOf(y)}" aria-pressed="${lk.has(y.id)}" class="px-3 py-1 rounded-full border transition ${lk.has(y.id) ? 'border-emerald-400 bg-emerald-500/25 text-emerald-100' : 'border-ink-600 hover:border-emerald-400/60 hover:text-emerald-200'}" translate="no">${lk.has(y.id) ? '✓ ' : ''}${R.esc(scSetLabel(d, y))}</button>`).join('')}
            ${others.length > 1 ? `<button type="button" data-linkall aria-pressed="${all}" class="px-3 py-1 rounded-full border transition ${all ? 'border-emerald-400 bg-emerald-500/25 text-emerald-100' : 'border-ink-600 hover:border-emerald-400/60 hover:text-emerald-200'}">${all ? '✓ ' : ''}Alle Sets</button>` : ''}
            ${anyLink ? `<button type="button" data-linkreset class="px-3 py-1 rounded-full border border-rose-500/50 text-rose-200 hover:bg-rose-500/15 transition" title="Alle Verknüpfungen lösen – nichts verschiebt sich">⨯ Syncs zurücksetzen</button>` : ''}` : ''}
        </div>
        <p class="mt-1.5 text-[10px] text-slate-500">${sxc.syncMode === 'free' ? 'Free Mode: jedes Teil bewegt sich einzeln. Verknüpfungen bleiben gespeichert und greifen wieder im Full / Partial Sync.' : ''}${sxc.syncMode === 'free' ? '' : `Full Sync: das ganze Set und alle verknüpften Sets bewegen sich komplett. Partial Sync: nur die angehakten Teile bewegen sich – in diesem Set und in jedem verknüpften Set. Nicht angehakte Teile bleiben frei beweglich.`}</p>
      </div>`; })() : '';
    const sec = (title, body) => `<div class="rounded-lg border border-ink-700 bg-ink-900/50 p-2.5"><div class="mb-1.5 text-[10px] uppercase tracking-widest text-slate-500">${title}</div><div class="flex flex-wrap items-center gap-x-3 gap-y-2">${body}</div></div>`;
    const seg = (items, cur, attr) => `<span class="inline-flex rounded-lg border border-ink-600 overflow-hidden">${items.map(([v, l], n) => `<button type="button" ${attr}="${v}" aria-pressed="${cur === v}" class="px-2.5 py-1 ${cur === v ? 'bg-gold-500/25 text-gold-200' : 'hover:text-gold-300'} ${n ? 'border-l border-ink-600' : ''}">${l}</button>`).join('')}</span>`;
    const scanB = (f, l) => `<label for="${f}" data-scanset="${k}" class="cursor-pointer px-3 py-1.5 rounded-lg border border-gold-500/50 text-gold-300 hover:border-gold-400">📷 ${l}</label>`;
    const BR = '<span class="basis-full h-0"></span>';
    const setCard = sxc ? (() => { const a = sxc.arm, st = sxc.st;
      return `<div class="sm:col-span-2 xl:col-span-3 rounded-xl border border-gold-500/30 bg-ink-950/50 p-3 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2"><div class="text-[10px] uppercase tracking-widest text-slate-500">🛡 Set-Einstellungen</div>${sxc.kind ? '' : splitHtml}</div>
        <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          ${syncHtml}
          ${sec('👤 Kommandanten', ck('cm', sxc.cm, 'Kommandanten anzeigen') + (sxc.kind ? '' : ck('heads', sxc.heads, 'Nur Kommandanten')))}
          ${sec('🔤 Namen', ck('cn', sxc.cn, 'Kommandanten-Namen anzeigen') + BR + ncHtml)}
          ${sec('🛡 Ausrüstung', (sxc.kind ? ck('gearOn', sxc.gearOn, 'Gear anzeigen') : '') + ck('hideEmpty', sxc.hideEmpty, 'Leere Slots ausblenden') + BR + scanB('scFile', 'Ausrüstung scannen'))}
          ${sec('⚔ Rüstung', ck('armOn', a.on, 'Rüstung anzeigen') + BR + '<span class="text-slate-400">Anordnung</span>' + seg([[1, '▤ 1 Spalte'], [2, '▥ 2 Spalten']], a.cols || 1, 'data-armcols') + BR + scanB('scArmFile', 'Rüstung scannen'))}
          ${sec('🔰 Formation', a.formation ? seg([['above', '⬆ Über'], ['below', '⬇ Unter'], ['hidden', '⊘ Aus']], a.fpos, 'data-armfpos')
              + `<label class="inline-flex items-center gap-1.5 cursor-pointer"><input type="checkbox" data-fsep ${a.fsep ? 'checked' : ''} class="w-4 h-4 accent-yellow-500">Formation einzeln (frei bewegen)</label>`
              : '<span class="text-slate-500">Formation im Rüstungs-Panel unten wählen</span>')}
          ${sec('📊 Werte', ck('stOn', st.on, 'Werte anzeigen') + BR + '<span class="text-slate-400">Schrift</span>' + seg(Object.entries(SC_AL), st.al, 'data-stal') + BR + chk('scPNt', !st.nt, 'Truppentyp zeigen (z. B. „Archer Attack“)'))}
        </div></div>`; })() : '';
    const cards = [
      card('📐 Größe &amp; Effekt', `<input id="scPS" type="range" min="30" max="400" step="5" value="${Math.round(o.s * 100)}" class="flex-1 min-w-[110px] accent-yellow-500"><span id="scPSv" class="tabular-nums w-11 text-right">${Math.round(o.s * 100)} %</span>
        ${boxy ? chk('scPSh', o.shadow, 'Schatten') : ''}
        <span class="basis-full h-0"></span>
        <span class="text-slate-400">↻ Drehung</span><input id="scPRot" type="range" min="-180" max="180" step="1" value="${o.r || 0}" class="flex-1 min-w-[110px] accent-yellow-500"><span id="scPRotv" class="tabular-nums w-11 text-right">${o.r || 0}°</span>
        <button type="button" id="scPRot0" class="${btn}">0°</button>
        ${sx ? `<span class="basis-full h-0 border-t border-ink-700 mt-1"></span>
          <span class="text-slate-400">Alle auf</span>
          <input id="scPAll" type="number" min="30" max="400" step="5" value="${Math.round((sx.s || 1) * 100)}" class="w-20 bg-ink-950 border border-ink-600 rounded-lg px-2 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:border-gold-500"><span class="text-slate-400">%</span>
          <button type="button" data-sizeall="set" class="px-3 py-1.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-ink-950 font-semibold">Dieses Set</button>
          <button type="button" data-sizeall="all" class="${btn}">Alle Sets</button>` : ''}`, sxc ? 'sm:col-span-2 xl:col-span-4 order-last' : ''),
      sxc ? `<div class="rounded-xl border border-gold-500/30 bg-ink-950/50 p-3 flex flex-col order-first">
        <div class="text-[10px] uppercase tracking-widest text-slate-500 mb-2">👁 Vorschau · <span translate="no">${R.esc(scSetLabel(d, sxc))}</span></div>
        <div id="scPrev" class="relative w-full flex-1 min-h-[260px] rounded-lg border border-ink-700 bg-[radial-gradient(circle_at_50%_40%,#1a2033,#07090f)] overflow-hidden" title="So sieht das Set gerade aus"></div></div>` : '',
      setCard,
      t === 'w' && k === 'avatar' ? card('🖼 Profilbild', `${o.frame ? '' : chk('scPRound', o.round, '◯ Rund')}
        <button type="button" id="scPFrame" class="${btn}">🖼 ${o.frame ? 'Anderer Rahmen …' : 'Rahmen hinzufügen …'}</button>
        ${o.frame ? `<span class="text-slate-400 truncate max-w-[10rem]">${R.esc(avFrameName(o.frame))}</span>
          <button type="button" id="scPFrameOff" class="px-3 py-1.5 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10">▢ Rahmen entfernen</button>
          <span class="basis-full h-0"></span><span class="text-slate-400">🔍 Bild im Rahmen</span><input id="scPFz" type="range" min="70" max="150" step="1" value="${o.fz || 100}" class="flex-1 min-w-[110px] accent-yellow-500"><span id="scPFzv" class="tabular-nums w-11 text-right">${o.fz || 100} %</span>` : ''}`) : '',
      o.free ? card('✥ Frei platziert', `<span class="text-slate-400">Wird nicht automatisch verschoben.</span>
        <button type="button" id="scPUnfree" class="${btn}">⊞ Wieder einrasten</button>`) : '',
      t === 'w' && (k === 'kd' || k === 'vip') ? card('✦ Symbol', chk('scPNi', !o.ni, k === 'kd' ? '🏰 anzeigen' : '👑 anzeigen')) : '',
      textual ? card('🎨 Schrift', `<input id="scPC" type="color" value="${o.color || (t === 'tx' ? '#ffffff' : SC_DEF_COLOR[k])}" class="${sw}">
        <button type="button" id="scPCr" class="${btn}">Standardfarbe</button>`) : '',
      fillable ? card('▦ Füllung', `<input id="scPF" type="color" value="${o.fill && o.fill !== 'none' ? o.fill : '#07090f'}" ${o.fill === 'none' ? 'disabled' : ''} class="${sw}">
        <input id="scPFo" type="range" min="0" max="100" step="5" value="${o.fillO}" ${o.fill === 'none' ? 'disabled' : ''} title="Deckkraft" class="flex-1 min-w-[80px] accent-yellow-500 disabled:opacity-40"><span id="scPFov" class="tabular-nums w-9 text-right ${o.fill === 'none' ? 'opacity-40' : ''}">${o.fillO} %</span>
        ${chk('scPFn', o.fill === 'none', 'keine')}`) : '',
      boxy ? card(frame ? '▢ Rahmen' : '▢ Rand', `<input id="scPR" type="color" value="${o.border && o.border !== 'none' ? o.border : '#e0a91b'}" ${o.border === 'none' ? 'disabled' : ''} class="${sw}">
        <input id="scPBw" type="range" min="1" max="10" step="1" value="${o.bw || defBw}" ${o.border === 'none' ? 'disabled' : ''} title="Stärke" class="flex-1 min-w-[80px] accent-yellow-500 disabled:opacity-40"><span id="scPBwv" class="tabular-nums w-10 text-right ${o.border === 'none' ? 'opacity-40' : ''}">${o.bw || defBw} px</span>
        ${chk('scPRn', o.border === 'none', frame ? 'keiner' : 'kein')}`) : ''
    ].filter(Boolean);
    el.innerHTML = `<div class="space-y-3 text-xs">
      <div class="flex flex-wrap items-center gap-2">
        ${t === 'set' ? '' : `<span class="px-3 py-1.5 rounded-lg bg-gold-500/15 border border-gold-500/40 text-gold-200 font-semibold">${(() => { const nm = /^(pc|pn|pg|fm|arm|st)$/.test(t) ? (d.sets[+k].name || `Set ${+k + 1}`) : null;
          return nm != null ? `<span>${R.esc(label.slice(0, label.length - nm.length - 3))}</span> · <span translate="no">${R.esc(nm)}</span>` : `<span>${R.esc(label)}</span>`; })()}</span>`}
        ${(t === 'w' && k === 'skin') || t === 'xs' ? '<button type="button" id="scPSkin" class="px-3 py-1.5 rounded-lg border border-gold-500/60 text-gold-300 hover:border-gold-400">🏯 Skin wählen …</button><button type="button" id="scPSkinAdd" class="px-3 py-1.5 rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300">＋ Weiteren Skin</button>' : ''}
        <div class="ml-auto flex flex-wrap gap-2">
          ${boxy ? `<button type="button" id="scPBr" class="${btn}">↺ Standardwerte</button>` : ''}
          ${t === 'tx' || t === 'xs' ? `<button type="button" id="scPDel" class="px-3 py-1.5 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10">🗑 ${t === 'xs' ? 'Skin entfernen' : 'Text löschen'}</button>`
            : !['set', 'pc', 'pn', 'pg', 'fm', 'arm', 'st'].includes(t) ? `<span class="inline-flex rounded-lg border border-ink-600 overflow-hidden">
                <button type="button" id="scPShow" ${o.on ? 'disabled' : ''} class="px-3 py-1.5 ${o.on ? 'bg-ink-800 text-slate-500 cursor-default' : 'hover:bg-gold-500/15 hover:text-gold-300'}">👁 Einblenden</button>
                <button type="button" id="scPHide" ${o.on ? '' : 'disabled'} class="px-3 py-1.5 border-l border-ink-600 ${o.on ? 'hover:bg-red-500/10 hover:text-red-300' : 'bg-ink-800 text-slate-500 cursor-default'}">⊘ Ausblenden</button></span>` : ''}
        </div>
      </div>
      ${t === 'tx' ? `<input id="scPT" maxlength="80" value="${R.esc(o.text || '')}" placeholder="Dein Text" class="w-full bg-ink-950 border border-ink-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold-500">` : ''}
      <div class="grid gap-2 sm:grid-cols-2 ${cards.length > 2 || sxc ? 'xl:grid-cols-4' : ''}">${cards.join('')}</div>
    </div>`;
    scDrawPreview();
  }
  const scImgEff = () => scImgOnly || !scBarEff() || (!sc.own && !!sc.doc?.detPriv);   // ohne Leiste: nur das Bild   // „Nur Bild“: selbst gewählt oder vom Besitzer erzwungen
  function drawSetBar() {
    const d = D(), many = d.sets.length > 1;
    R.$('scSetBar').classList.toggle('hidden', (!sc.own && !many) || scImgEff());
    const nN = scNormal(d).length, nr = (i) => scNormal(d).findIndex(([, j]) => j === i) + 1;
    R.$('scSetBar').innerHTML = d.sets.map((x, i) => `<button type="button" data-si="${i}" aria-pressed="${i === sc.si}" class="seg-btn rounded-lg px-3 py-1.5 text-xs font-semibold border border-ink-700 transition" translate="no">${R.esc(x.kind ? SC_KIND[x.kind] + (d.sets.filter(y => y.kind === x.kind).length > 1 ? ' ' + (scKindNo(d, x) + 1) : '') : (x.name || 'Set ' + nr(i)))}${sc.own && x.priv ? ' 🔒' : ''}</button>`).join('')
      + (sc.own && nN < SC_MAX ? '<button type="button" id="scAddSet" class="text-xs px-3 py-1.5 rounded-lg border border-dashed border-gold-500/60 text-gold-300 hover:border-gold-400">+ Set</button>' : '')
      + (sc.own ? `<span class="text-[11px] text-slate-500">${nN}/${SC_MAX}</span>` : '')
      + (sc.own ? ['garrison', 'rally'].filter(k => d.sets.filter(x => x.kind === k).length < SC_KIND_MAX).map(k => `<button type="button" data-addkind="${k}" class="text-xs px-3 py-1.5 rounded-lg border border-dashed border-sky-400/60 text-sky-300 hover:border-sky-300">+ ${SC_KIND[k]}</button>`).join('') : '')
      + (sc.own && many ? '<button type="button" id="scDelSet" class="ml-auto text-xs px-3 py-1.5 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10">🗑 Set löschen</button>' : '');
  }
  function drawDetail() {
    const x = scSet(), own = sc.own, segB = 'seg-btn rounded-lg px-3 py-1.5 text-xs font-semibold transition';
    R.$('scDetail').classList.toggle('hidden', !x || scImgEff());
    if (!x || scImgEff()) return;
    R.$('scDetailHead').innerHTML = own ? `
      <div class="flex flex-wrap items-center gap-2 mb-3">
        <input id="scSetName" maxlength="30" value="${R.esc(x.name)}" placeholder="Name des Sets (optional), z. B. Infanterie Marsch" class="order-1 flex-1 min-w-[200px] bg-ink-950 border border-ink-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold-500">
        <button type="button" id="scSetReset" title="Nur dieses Set leeren: Kommandanten, Ausrüstung, Rüstung und Werte – Position und Größe bleiben" class="order-2 text-xs px-3 py-2 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10">↺ Set zurücksetzen</button>
      </div>
`
      : (x.name ? `<div class="mb-2 text-center font-display text-lg gold-text" translate="no">${R.esc(x.name)}</div>` : '');
    // Aufteilung: eigenes Profil = links Gear-Set, rechts Bearbeitung · andere = Gear-Set und Rüstung mittig nebeneinander
    R.$('scDetailBody').className = own ? 'grid lg:grid-cols-[320px_minmax(0,1fr)] gap-6 lg:gap-8 items-start' : 'flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12';
    R.$('scMain').className = own ? 'min-w-0 w-full' : 'min-w-0 w-full lg:w-[320px] shrink-0';
    R.$('scSide').className = own ? 'min-w-0 w-full space-y-4' : 'min-w-0 space-y-4';
    // Rüstungs-Vorschau: im eigenen Profil unter dem Gear (links), bei anderen rechts neben dem Gear
    const armBox = R.$('scArmSide'), armHome = own ? R.$('scManual') : R.$('scSide');
    if (armBox.parentElement !== armHome) { if (own) armHome.appendChild(armBox); else armHome.insertBefore(armBox, armHome.firstChild); }
    armBox.style.marginTop = own ? '1.5rem' : '';
    const noGear = !!x.kind && !x.gearOn;
    R.$('scGearTools').classList.toggle('hidden', !(own && x.mode === 'manual') || noGear);
    R.$('scGearBoard').parentElement.classList.toggle('hidden', noGear);
    R.$('scGearBtns').innerHTML = own && x.mode === 'manual' ? `<label for="scFile" id="scScanLbl" class="cursor-pointer text-xs px-3 py-2 rounded-lg border border-gold-500/50 text-gold-300 hover:border-gold-400">📷 Ausrüstung scannen</label>
      ${scCopyOptions(x)}` : '';
    R.$('scGearHint').classList.toggle('hidden', !!sc.gsel || noGear);
    R.$('scManual').classList.toggle('hidden', x.mode !== 'manual');
    R.$('scShot').classList.toggle('hidden', x.mode !== 'shot');
    if (x.mode === 'manual') {
      R.$('scCmds').innerHTML = scCmdsHtml(x.cmd, x.cg);
      const cgStep = SC_CG.reduce((b, v, i) => Math.abs(v - x.cg) < Math.abs(SC_CG[b] - x.cg) ? i : b, 0);
      R.$('scCgBar').innerHTML = own && x.cmd[0] && x.cmd[1] ? `<div class="flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-400">
        <span title="Abstand der beiden Kommandanten">↔ Abstand</span>
        ${SC_CG.map((v, i) => `<button type="button" data-cg="${i}" aria-pressed="${i === cgStep}" title="Stufe ${i + 1}${i === 0 ? ' (weit)' : i === SC_CG.length - 1 ? ' (eng)' : ''}"
          class="w-7 h-7 rounded-lg font-bold border ${i === cgStep ? 'border-gold-400 bg-gold-500/20 text-gold-200' : 'border-ink-600 hover:border-gold-500/60 hover:text-gold-300'}">${i + 1}</button>`).join('')}
        ${D().sets.length > 1 ? '<button type="button" id="scCgAll" class="ml-1 px-2.5 h-7 rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300">für alle Sets</button>' : ''}
      </div>` : '';
      scDrawGearBoard(x);
      R.gearSel.sc = sc.gsel;
      R.$('scGearEdit').innerHTML = own && sc.gsel ? R.gearEditor('sc', { sc: x.gear }, { rows: R.GEAR_SLOTS.map(sl => ({ sl, status: 'none' })) }) : '';
      R.$('scGearFx').innerHTML = own ? scGearFxHtml(x) : '';
      R.$('scGearTools').open = scGearOpen;
    } else {
      R.$('scShot').innerHTML = x.shot ? `<div class="flex flex-col items-center gap-3">
          <img src="${x.shot}" alt="" class="max-w-full max-h-[70vh] rounded-xl border border-gold-500/40 shadow-[0_8px_24px_rgba(0,0,0,.6)]">
          ${own ? `<div class="flex gap-2"><label for="scShotFile" class="cursor-pointer text-xs px-3 py-2 rounded-lg border border-gold-500/50 text-gold-300 hover:border-gold-400">📷 Anderen Screenshot wählen</label>
            <button type="button" id="scShotDel" class="text-xs px-3 py-2 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10">✕ Entfernen</button></div>` : ''}</div>`
        : (own ? `<label for="scShotFile" class="block cursor-pointer rounded-xl border-2 border-dashed border-ink-600 hover:border-gold-500/60 bg-ink-950/60 p-8 text-center">
            <div class="text-3xl mb-1">📷</div><div class="font-semibold">Screenshot für dieses Set auswählen</div>
            <div class="text-xs text-slate-400 mt-1">z. B. die Marsch-Ansicht aus dem Spiel · wird verkleinert gespeichert</div></label>`
          : '<div class="py-6 text-center text-sm text-slate-500">Kein Screenshot.</div>');
    }
    drawArm();
  }
  let scArmOpen = true;
  let scGearOpen = (() => { try { return localStorage.getItem('rok_sc_gear_open') !== '0'; } catch { return true; } })();
  // Expertise-Rahmen + Refine-/Iconic-Symbol für das ganze Set einstellen
  // Regler: [Schlüssel, Name, Minimum, Standard, Maximum, Gruppe] – der Regler steht beim Standardwert immer genau in der Mitte (50)
  const SC_GFX_SL = [['fh', '🎨 Orange-Ton', -100, 0, 100, 'f'], ['fs', '◇ Rahmen-Größe', 60, 100, 150, 'f'], ['fw', '◇ Rahmen-Dicke', 0, 50, 100, 'f'],
    ['rs', '✦ Refine-Größe', 8, 16, 40, 's'], ['rx', '✦ Refine ↔', 0, 64, 100, 's'], ['ry', '✦ Refine ↕', 0, 70, 100, 's'],
    ['ts', '🏅 Iconic-Größe', 15, 44, 90, 's'], ['tx', '🏅 Iconic ↔', 0, 50, 100, 's'], ['ty', '🏅 Iconic ↕', 0, 91, 100, 's']];
  const scGfxToPos = (z, v) => { const [, , lo, df, hi] = z; return Math.round(v <= df ? (df === lo ? 50 : (v - lo) / (df - lo) * 50) : 50 + (hi === df ? 0 : (v - df) / (hi - df) * 50)); };
  const scGfxFromPos = (z, p) => { const [, , lo, df, hi] = z; return Math.round(p <= 50 ? lo + (df - lo) * p / 50 : df + (hi - df) * (p - 50) / 50); };
  function scGearFxHtml(x) {
    const fx = x.gfx, tile = (f, on, c, key) => {
      const face = c === 'purple' ? gFace('epic') : gFace('legendary', fx.fh);
      const inner = f === 'css' ? `<span class="gdia absolute inset-0" style="background:${GOLD_RIM}"></span><span class="gdia absolute inset-[5px]" style="background:${face}"></span>`
        : f === 'none' ? `<span class="gdia absolute inset-0" style="background:${c === 'purple' ? R.GFILL.epic[0] : R.GFILL.legendary[0]}"></span><span class="gdia absolute inset-[2px]" style="background:${face}"></span>`
        : `<span class="gdia absolute" style="inset:10%;background:${face}"></span>${gfImg(f, 'absolute inset-0 w-full h-full max-w-none', '')}${fx.pt && c === 'gold' ? gfParticles('inset:0;width:100%;height:100%') : ''}`;
      const lbl = f === 'css' ? 'Glitzer-Rand' : f === 'none' ? 'Kein Rahmen' : f.id.replace(/^frame-/, '').replace(/-/g, ' ');
      return `<button type="button" data-gfr="${R.esc(key)}" data-gfc="${c}" aria-pressed="${on}" title="${R.esc(lbl)}" class="relative w-16 h-16 rounded-lg border-2 ${on ? 'border-gold-400 bg-gold-500/15' : 'border-ink-600 hover:border-gold-500/60'}">
        <span class="absolute inset-1">${inner}</span></button>`; };
    const curG = fx.fr === 'css' || fx.fr === 'none' ? fx.fr : (gfById(fx.fr) || gfList('gold')[0])?.id || 'css';
    const curP = fx.fp === 'css' || fx.fp === 'none' ? fx.fp : (gfById(fx.fp) || gfList('purple')[0])?.id || 'css';
    const row = (c, cur) => [...gfList(c).map(f => tile(f, cur === f.id, c, f.id)), tile('css', cur === 'css', c, 'css'), tile('none', cur === 'none', c, 'none')].join('');
    const sl = (z) => { const p = scGfxToPos(z, fx[z[0]]); return `<label class="flex items-center gap-2"><span class="w-28 shrink-0 text-slate-400">${z[1]}</span>
      <input type="range" data-gfx="${z[0]}" min="0" max="100" step="1" value="${p}" class="flex-1 min-w-[90px] accent-yellow-500"><span data-gfxv="${z[0]}" class="w-10 text-right tabular-nums ${p === 50 ? 'text-slate-500' : 'text-gold-300'}">${p}</span></label>`; };
    return `<details id="scGfxBox" class="rounded-lg border border-ink-700 bg-ink-950/40 p-3" ${scGfxOpen ? 'open' : ''}>
      <summary class="cursor-pointer select-none text-xs font-semibold text-gold-300">✨ Expertise-Rahmen &amp; Symbole</summary>
      <p class="mt-2 text-[11px] text-slate-500">Rahmen erscheinen bei Items mit Expertise (fertig refined).</p>
      <label class="mt-2 flex items-center gap-2 rounded-lg border border-gold-500/40 bg-gold-500/10 px-3 py-2 text-xs cursor-pointer"><input type="checkbox" id="scGfxSync" ${D().gfxAll ? 'checked' : ''} class="w-4 h-4 accent-yellow-500">
        <span><span class="font-semibold text-gold-200">🔗 Für alle Sets gleich</span><span class="block text-[10px] text-slate-400">Rahmen, Partikel, Orange-Ton, rotes Refine-Symbol und Iconic gelten automatisch für alle Sets dieses Showcase</span></span></label>
      <div class="mt-2 text-[10px] uppercase tracking-widest text-orange-300">Gold · legendäre Items</div>
      <div class="mt-1 flex flex-wrap gap-2">${row('gold', curG)}</div>
      <label class="mt-2 inline-flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" id="scGfxPt" ${fx.pt ? 'checked' : ''} class="w-4 h-4 accent-yellow-500">✨ Glitzer-Partikel bei allen Gold-Rahmen</label>
      <div class="mt-3 text-[10px] uppercase tracking-widest text-purple-300">Lila · epische Items</div>
      <div class="mt-1 flex flex-wrap gap-2">${row('purple', curP)}</div>
      <div class="mt-4 grid gap-2 text-xs">${SC_GFX_SL.filter(z => z[5] === 'f').map(sl).join('')}</div>
      <button type="button" id="scGfxResetF" class="mt-2 px-3 py-1.5 rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300 text-xs">↺ Nur Rahmen zurücksetzen</button>
      <div class="mt-4 grid gap-2 text-xs">${SC_GFX_SL.filter(z => z[5] === 's').map(sl).join('')}</div>
      <p class="mt-1 text-[10px] text-slate-500">50 = Standard (Regler in der Mitte).</p>
      <p class="mt-1 text-[10px] text-slate-500">🎨 Orange-Ton: nach links dunkler orange, nach rechts gelblicher (0 = Standard) – gilt für alle legendären Items dieses Sets.</p>
      <p class="mt-1 text-[10px] text-slate-500">Das rote Refine-Symbol bleibt immer innerhalb des Rahmens.</p>
      <div class="mt-3 flex flex-wrap gap-2 text-xs">
        <button type="button" id="scGfxReset" class="px-3 py-1.5 rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300">↺ Refine &amp; Iconic zurücksetzen</button>
        <button type="button" id="scGfxAll" class="px-3 py-1.5 rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300" title="Einmalig auf alle Sets aller Showcases übertragen">⧉ Auf alle Sets aller Showcases übertragen</button>
      </div>
    </details>`;
  }
  let scGfxOpen = true;
  // Rüstung rechts neben Ausrüstung bzw. Screenshot (für alle sichtbar, sobald etwas eingetragen ist)
  // ---- 🧍 Charakter-Profil: Set als Bild mit Charakter, Hintergrund und Runensäulen (Armaments) ----
  let scProfOpen = false;
  const scProfCtx = (x) => ({ pick: x.prof.char, name: x.name, bg: { k: x.prof.bg }, arm: { ...x.arm, flip: x.prof.flip, scene: x.prof.stones } });
  function drawProf() {
    const box = R.$('scProf'); if (!box) return; const x = scSet();
    box.innerHTML = x && R.charBoardHTML ? '<div class="mt-4 rounded-xl border border-gold-500/30 bg-ink-950/40 px-3 py-2 text-xs text-slate-300">🧍 Charakter-Bild mit Hintergrund und Runensäulen: oben im Reiter <b class="text-gold-200">„🧍 Charakter Showcase“</b>.</div>' : ''; return;
    if (!x || (x.kind && !x.gearOn) || !R.charBoardHTML || !R.GEAR_SLOTS.some(sl => x.gear?.[sl.k]?.item)) { box.innerHTML = ''; return; }
    const ctx = scProfCtx(x), own = sc.own, fi = 'bg-ink-950 border border-ink-600 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-gold-500';
    const parts = ['flag', 'emblem', 'scroll', 'instrument'].filter(k => ARM_BY_ID[x.arm.arms?.[k]]);
    box.innerHTML = `<details id="scProfBox" class="mt-4 rounded-xl border border-gold-500/40 bg-ink-950/50 p-3" ${scProfOpen ? 'open' : ''}>
      <summary class="cursor-pointer select-none font-semibold text-gold-300">🧍 Charakter-Profil <span class="text-[11px] font-normal text-slate-400">· Bild mit Charakter, Hintergrund und Runensäulen</span></summary>
      <div class="mt-3 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px] items-start">
        <div class="relative mx-auto w-full max-w-[460px] aspect-square">${R.charBoardHTML(x.gear, ctx)}</div>
        ${own ? `<div class="space-y-2 text-xs">
          <label class="block text-slate-400">Charakter<select data-prof="char" class="${fi} mt-1 w-full"><option value="">🔄 automatisch</option>${(R.charList?.() || []).map(c => `<option value="${R.esc(c.id)}"${x.prof.char === c.id ? ' selected' : ''}>🧍 ${R.esc(c.name)}</option>`).join('')}</select></label>
          <label class="block text-slate-400">Hintergrund<select data-prof="bg" class="${fi} mt-1 w-full">${(R.charBgList?.() || []).map(([k, l]) => `<option value="${k}"${x.prof.bg === k ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
          <label class="flex items-center gap-2 text-slate-300 cursor-pointer"><input type="checkbox" data-prof="stones" ${x.prof.stones ? 'checked' : ''} class="w-4 h-4 accent-yellow-500">🪨 Runensäulen (Armaments) zeigen</label>
          ${parts.length ? `<div class="text-slate-400">Säulen neigen:</div><div class="grid grid-cols-2 gap-1">${parts.map(k => `<button type="button" data-prof-flip="${k}" class="px-2 py-1 rounded-md border ${x.prof.flip[k] ? 'border-gold-400 text-gold-200' : 'border-ink-600 text-slate-300'}">${ARM_TYPES[k].icon} ${x.prof.flip[k] < 0 ? '↖' : x.prof.flip[k] > 0 ? '↗' : '⬆'}</button>`).join('')}</div>`
            : '<div class="text-slate-500">Für Runensäulen oben unter „Rüstung“ Armaments wählen.</div>'}
          <button type="button" data-prof-feed class="w-full mt-1 px-3 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-ink-950 font-semibold">📰 Im Feed posten</button>
          <div data-prof-msg class="text-[11px]"></div></div>` : ''}
      </div></details>`;
  }
  R.boardStyleHooks = R.boardStyleHooks || []; R.boardStyleHooks.push(() => { try { drawProf(); } catch {} });
  function drawArmSide() {
    const a = scSet()?.arm, has = !!a && scArmHas(a);
    R.$('scArmSide').classList.toggle('hidden', !has);
    R.$('scArmSide').innerHTML = has ? `<div class="rounded-2xl bg-ink-900/60 border border-ink-700 px-5 py-4 ${sc.own ? '' : 'w-fit mx-auto'}">
      ${sc.own ? '<div class="mb-3 text-[11px] uppercase tracking-widest text-slate-500">Vorschau Rüstung</div>' : ''}
      <div class="flex justify-center">${scArmHtml(a, n => n * 9 + 'px')}</div></div>` : '';
  }
  // Formation → je Typ eine Rüstung wählen → Inschriften antippen (Farbe kommt automatisch)
  function scArmPickHtml(a) {
    const form = ARM_FORMATIONS[a.formation] ? a.formation : '';
    const arms = form ? ARM_FORMATIONS[form] : Object.values(ARM_FORMATIONS).flat();
    const has = new Set(a.insc.map(i => i.t.toLowerCase()));
    const chip = (t, c, title) => { const st = SC_INSC[c], on = has.has(t.toLowerCase());
      return `<button type="button" data-ins="${R.esc(t)}" data-c="${c}" aria-pressed="${on}" title="${R.esc(title || (on ? 'Entfernen' : 'Hinzufügen'))}"
        class="px-2.5 py-1 rounded-md text-[11px] font-extrabold border transition ${on ? 'ring-2 ring-gold-400 scale-[1.03]' : 'opacity-55 hover:opacity-100'}"
        style="background:${st.bg};color:${st.fg};border-color:${st.bd}">${on ? '✓ ' : ''}${R.esc(t)}</button>`; };
    const row = (lbl, html) => html ? `<div class="flex flex-wrap items-center gap-1.5"><span class="w-12 shrink-0 text-[10px] uppercase tracking-widest text-slate-500">${lbl}</span>${html}</div>` : '';
    const own = a.insc.filter(i => !scInscKnown(i.t));
    return `<div class="rounded-lg border border-ink-700 bg-ink-950/40 p-3 space-y-3">
      <label class="flex items-center gap-2"><span class="text-slate-400">Formation</span>
        <select data-arm="formsel" class="bg-ink-950 border border-ink-600 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-gold-500">
          <option value="">– keine –</option>${Object.keys(ARM_FORMATIONS).map(f => `<option value="${f}"${f === form ? ' selected' : ''}>${f}</option>`).join('')}
          ${a.formation && !form ? `<option value="${R.esc(a.formation)}" selected>${R.esc(a.formation)}</option>` : ''}
        </select>
        <span class="ml-auto text-[11px] text-slate-500">${a.insc.length}/12 gewählt</span></label>
      ${Object.entries(ARM_TYPES).map(([k, ty]) => {
        const list = arms.filter(x => x.type === k);
        return `<div class="rounded-lg border border-ink-700 p-2.5 space-y-1.5">
          <div class="font-semibold text-slate-200">${ty.icon} ${ty.label}</div>
          ${row('Gold', list.map(x => chip(x.gold, 'gold', x.name)).join(''))}
          ${row('Blau', list.map(x => chip(x.blue, 'blue', x.name)).join(''))}
          ${row('Weiß', ARM_POOL[k].map(t => chip(t, 'gray')).join(''))}
        </div>`; }).join('')}
      ${own.length ? `<div class="flex flex-wrap items-center gap-1.5"><span class="text-[10px] uppercase tracking-widest text-slate-500">Sonstige</span>${own.map(i => chip(i.t, i.c)).join('')}</div>` : ''}
    </div>`;
  }
  function drawArm() {
    const a = scSet().arm;
    drawArmSide(); drawProf();
    if (scSet().kind && !scSet().gearOn) { R.$('scArmSide').classList.add('hidden'); R.$('scArm').innerHTML = ''; return; }
    if (!sc.own) { R.$('scArm').innerHTML = ''; return; }
    const inp = 'bg-ink-950 border border-ink-600 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-gold-500';
    R.$('scArm').innerHTML = `<details id="scArmBox" class="mt-4 rounded-xl border border-ink-700 bg-ink-950/50 p-3" ${scArmOpen ? 'open' : ''}>
      <summary class="cursor-pointer font-semibold text-gold-300">⚔ Rüstung (Armaments)</summary>
      <div class="mt-3">
        <div class="space-y-3 text-xs">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-[11px] text-slate-500">Die Vorschau steht direkt darüber. Alles lässt sich nach dem Scan von Hand ändern.</p>
            <label for="scArmFile" id="scArmScanLbl" class="cursor-pointer text-xs px-3 py-2 rounded-lg border border-gold-500/50 text-gold-300 hover:border-gold-400">📷 Rüstung scannen</label>
          </div>
          ${scArmPickHtml(a)}
          <div class="flex flex-wrap items-end gap-2">
            <label><span class="text-slate-400">Truppe</span><select data-arm="troop" class="mt-1 block ${inp}">${Object.entries(SC_TROOPS).map(([k, l]) => `<option value="${k}"${k === a.troop ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
            ${SC_ARM_STATS.map(([k, l]) => `<label><span class="text-slate-400">${l} %</span><input data-arm="${k}" type="number" step="0.1" value="${a[k] ?? ''}" class="mt-1 block w-24 ${inp} text-right tabular-nums"></label>`).join('')}
          </div>
        </div>
      </div>
    </details>`;
  }
  function drawShowcase() {
    if (!sc.doc) return;
    const d = D();
    R.$('scTools').classList.toggle('hidden', !sc.own);
    R.$('scHint').classList.toggle('hidden', !sc.own);
    R.$('scDl').classList.toggle('hidden', !sc.own);                     // Download nur beim eigenen Showcase
    R.$('scEditBtn').textContent = sc.edit ? '✓ Fertig' : '✎ Bearbeiten';
    R.$('scEditBtn').setAttribute('aria-pressed', String(sc.edit));
    R.$('scCount').textContent = `${scNormal(d).length}/${SC_MAX} Sets`;
    if (!sc.own) { R.$('scBgPick').classList.add('hidden'); R.$('scSync').textContent = ''; }
    else if (!R.$('scBgPick').classList.contains('hidden')) drawBgPick();
    drawListBar(); drawStage(); if (scFixStacks(d)) scSaveSoon(); drawEditBar(); drawSetBar(); drawDetail(); drawCk(); if (!sc.hLast || sc.hLast.id !== d.id) scHistReset(); else drawUndoBtn();
    scApplyImgOnly(); scApplyOpen();
  }
  // „Nur Bild“: Sets-Leiste und Details unter der Bühne ausblenden (pro Betrachter gemerkt)
  let scImgOnly = (() => { try { return localStorage.getItem('rok_showcase_imgonly') === '1'; } catch { return false; } })();
  function scApplyImgOnly() {
    const btn = R.$('scImgOnly'), forced = !sc.own && !!sc.doc?.detPriv;
    btn.setAttribute('aria-pressed', String(scImgOnly)); btn.textContent = scImgOnly ? '☰ Details zeigen' : '🖼 Nur Bild';
    btn.classList.toggle('hidden', forced);
    if (scImgEff()) { R.$('scSetBar').classList.add('hidden'); R.$('scDetail').classList.add('hidden'); }
  }
  // Klick irgendwo außerhalb eines Sets → oranger Rahmen weg
  document.addEventListener('click', (ev) => {
    if (sc.hl == null || ev.target.closest?.('[data-el^="set:"],[data-el^="pc:"],[data-el^="pn:"],[data-el^="pg:"]')) return;
    sc.hl = null; if (sc.doc) drawStage();
  });
  R.$('scImgOnly').onclick = () => {
    scImgOnly = !scImgOnly; try { localStorage.setItem('rok_showcase_imgonly', scImgOnly ? '1' : '0'); } catch {}
    if (!scOpen) { scOpen = true; try { localStorage.setItem('rok_showcase_open', '1'); } catch {} }
    drawShowcase();
  };

  // ---- Sicher speichern: lokal → user_state (Cloud) und leaderboard.showcase (für andere sichtbar), mit automatischer Wiederholung ----
  let scDirty = false, scT = null, scRetryT = null, scSaving = false, scColWarned = false;
  function scSync(state, text) {
    const el = R.$('scSync'); if (!sc.own) { el.textContent = ''; return; }
    el.textContent = text;
    el.className = 'text-[11px] ' + ({ ok: 'text-emerald-400', busy: 'text-slate-400', warn: 'text-amber-300', err: 'text-red-300' }[state] || 'text-slate-500');
  }
  async function scSave(okText, quiet) {
    if (!sc.own || !sc.doc) return;
    scHistTrack();
    clearTimeout(scT); clearTimeout(scRetryT);
    sc.doc.updated = Date.now(); scDirty = true;
    R.LS.set(SC_KEY, JSON.stringify(sc.doc));                // Kopie im Account (user_state) – wird automatisch hochgeladen
    if (scSaving) { scT = setTimeout(() => scSave(okText, quiet), 700); return; }
    scSaving = true; scSync('busy', '☁ speichert …');
    try {
      const ok = await RokAuth.saveShowcase(scPublicDoc(sc.doc));     // für andere nur die freigegebenen Teile
      await RokAuth.flushNow();
      if (RokAuth.pending && RokAuth.pending()) throw new Error('Cloud gerade nicht erreichbar – wird automatisch erneut gespeichert');
      scDirty = false;
      if (ok) { scSync('ok', '☁ in der Cloud gespeichert'); if (!quiet) scMsg(okText || '✓ Showcase gespeichert', 'ok'); }
      else {
        scSync('warn', '☁ im Account gespeichert');
        if (!scColWarned) { scColWarned = true; scMsg('✓ Im Account gespeichert · für andere Spieler sichtbar erst nach dem SQL-Update (Spalte showcase)', 'warn'); }
        else if (!quiet) scMsg(okText || '✓ Showcase gespeichert', 'ok');
      }
    } catch (e) {
      scSync('err', '⚠ nicht gespeichert – neuer Versuch …');
      if (!quiet) scMsg(e.message || String(e), 'err');
      scRetryT = setTimeout(() => scSave(null, true), 10000);
    } finally { scSaving = false; }
  }
  const scSaveSoon = () => { if (!sc.own) return; scHistTrack(); scDirty = true; scSync('busy', '☁ ungespeichert …'); clearTimeout(scT); scT = setTimeout(() => scSave(null, true), 600); };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && scDirty) scSave(null, true); });
  window.addEventListener('pagehide', () => { if (scDirty) scSave(null, true); });
  window.addEventListener('beforeunload', (e) => { if (scDirty) { scSave(null, true); e.preventDefault(); e.returnValue = ''; } });

  // ---- Bearbeitungsmodus: auswählen, ziehen (Raster), Größe/Farbe ----
  let scDrag = null;
  // Was beim Ziehen mitwandert: Full Sync → alles (eigenes Set + alle verknüpften Sets).
  // Partial Sync → nur die oben angehakten Module – im eigenen Set UND in jedem verknüpften Set.
  function scDragPlan(d, x0, obj) {
    const mv = new Set(), linked = scLinked(d, x0).filter(y => y.syncMode !== 'free'), all = (y) => [y, y.parts.c, y.parts.n, y.parts.g, y.arm, y.st, y.arm.fm];
    let ch = false;
    if (x0.syncMode === 'full') { [x0, ...linked].forEach(y => all(y).forEach(o => mv.add(o))); return { mv, ch }; }
    if (x0.syncMode !== 'partial' || !scMembers(x0).includes(obj)) return { mv, ch };   // Free / nicht angehaktes Teil: nur das Teil selbst
    const sy = x0.sy, cng = ['c', 'n', 'g'].filter(k => sy[k]);
    [x0, ...linked].forEach(y => { const j = d.sets.indexOf(y), a = y.arm, fmShown = !!a.formation && a.fpos !== 'hidden';
      if (cng.length && cng.length < 3 && !y.split) { scSplit(y, j, true); ch = true; }   // nur ein Teil des Gears soll mit → Set auftrennen (Position bleibt)
      if (cng.length) { if (y.split) cng.forEach(k => mv.add(y.parts[k])); if (!y.split || cng.length === 3) mv.add(y); }
      if (sy.arm) mv.add(a);
      if (sy.st) mv.add(y.st);
      if (fmShown && !a.fsep && sy.arm !== !!sy.fm) { scFmSep(y, j, true); ch = true; }   // Formation soll sich anders bewegen als die Rüstung → abtrennen
      if (sy.fm && a.fsep) mv.add(a.fm);
    });
    return { mv, ch };
  }
  R.$('scEls').addEventListener('pointerdown', (ev) => {
    if (!sc.edit || !sc.own) return;
    const el = ev.target.closest('[data-el]');
    if (!el) { if (sc.sel) { sc.sel = null; drawStage(); drawProps(); } return; }
    ev.preventDefault();
    const key = el.dataset.el, obj = scSelObj(key); if (!obj) return;
    sc.sel = key;
    const d0 = D(), others = [...d0.sets.map((x, i) => ['set:' + i, x]).filter(([, x]) => !x.split), ...d0.sets.flatMap((x, i) => x.split ? [['pc:' + i, x.parts.c], ['pn:' + i, x.parts.n], ['pg:' + i, x.parts.g]] : []), ...d0.sets.map((x, i) => ['fm:' + i, x.arm.fm]).filter(([, f], i) => d0.sets[i].arm.fsep), ...d0.sets.map((x, i) => ['arm:' + i, x.arm]).filter(([, a]) => a.on), ...d0.sets.map((x, i) => ['st:' + i, x.st]).filter(([, a]) => a.on),
      ...Object.entries(d0.els).filter(([, w]) => w.on).map(([k, w]) => ['w:' + k, w]), ...(d0.texts || []).map(t => ['tx:' + t.id, t]), ...(d0.xskins || []).map(x => ['xs:' + x.id, x])].filter(([k]) => k !== key);
    scDrag = { el, obj, key, others, f: 100 / R.$('scStage').getBoundingClientRect().width, sx: ev.clientX, sy: ev.clientY, ox: obj.x, oy: obj.y, moved: false };
    try { el.setPointerCapture(ev.pointerId); } catch {} el.style.zIndex = 30;
  });
  R.$('scEls').addEventListener('pointermove', (ev) => {
    if (!scDrag) return;
    if (!scDrag.plan) { const m0 = /^(set|arm|st|fm|pc|pn|pg):(\d+)$/.exec(scDrag.key), d0 = D();
      const p0 = m0 && !(sc.free || ev.altKey) ? scDragPlan(d0, d0.sets[+m0[2]], scDrag.obj) : { mv: new Set(), ch: false };
      scDrag.plan = p0.mv; scDrag.others = scDrag.others.filter(([, o]) => !p0.mv.has(o));   // nicht an mitwandernden Teilen einrasten
      if (p0.ch) { drawStage(); const e2 = R.$('scEls').querySelector(`[data-el="${scDrag.key}"]`); if (e2) { scDrag.el = e2; e2.style.zIndex = 30; } } }
    let x = scDrag.ox + (ev.clientX - scDrag.sx) * scDrag.f, y = scDrag.oy + (ev.clientY - scDrag.sy) * scDrag.f;
    const d = D(), guides = [];
    const free = sc.free || ev.altKey; scDrag.free = scDrag.free || free;   // frei bewegen: kein Raster, kein Einrasten, kein Sync (auch mit gedrückter Alt-Taste)
    if (d.grid && !free) [x, y] = scGridFit(scDrag.key, scDrag.obj, x, y);
    // an anderen Elementen ausrichten: Mitte, linke/rechte, obere/untere Kante (Hilfslinie erscheint)
    const me = free ? null : scBox(scDrag.key, { ...scDrag.obj, x, y });
    if (me) { const TH = 0.9; let bx = null, by = null;
      scDrag.others.forEach(([k, o]) => { const b = scBox(k, o); if (!b) return;
        [[me.cx, b.cx, 0], [me.l, b.l, me.w / 2], [me.r, b.r, -me.w / 2], [me.cx, 50, 0]].forEach(([m, t, off]) => { const dd = Math.abs(m - t); if (dd < TH && (!bx || dd < bx.dd)) bx = { dd, x: t + off, g: t }; });
        [[me.cy, b.cy, 0], [me.t, b.t, me.h / 2], [me.b, b.b, -me.h / 2]].forEach(([m, t, off]) => { const dd = Math.abs(m - t); if (dd < TH && (!by || dd < by.dd)) by = { dd, y: t + off, g: t }; }); });
      if (bx) { x = bx.x; guides.push(`<div class="absolute top-0 bottom-0" style="left:${bx.g}cqw;width:0;border-left:1px dashed #22d3ee"></div>`); }
      if (by) { y = by.y; guides.push(`<div class="absolute left-0 right-0" style="top:${by.g}cqw;height:0;border-top:1px dashed #22d3ee"></div>`); } }
    R.$('scGuides').innerHTML = d.guides === false ? '' : guides.join('');
    x = Math.min(100, Math.max(0, x)); y = Math.min(scH(d), Math.max(0, y));
    if (x === scDrag.obj.x && y === scDrag.obj.y) return;
    const dy = y - scDrag.obj.y, dx = x - scDrag.obj.x;
    scDrag.obj.x = x; scDrag.obj.y = y; scDrag.moved = true;
    scDrag.el.style.left = x + 'cqw'; scDrag.el.style.top = y + 'cqw';
    // Sync: Set-Einheit (Set + Rüstung + Werte) und/oder ganze Reihe (Gear / Rüstungen / Werte) wandern mit
    const S = d.syncs || {}, m = /^(set|arm|st|fm|pc|pn|pg):(\d+)$/.exec(scDrag.key);
    if (!free && m) {
      const t = m[1], i0 = +m[2], x0 = d.sets[i0], gk = { set: 'gear', arm: 'arm', st: 'st' }[t], grp = !x0.kind && x0.syncMode !== 'free' && gk && S[gk];   // Free Mode: keine Reihen-Angleichung
      const mv = new Set(scDrag.plan || []), linked = scLinked(d, x0);   // Plan: Full = alles, Partial = angehakte Module in allen verknüpften Sets
      if (grp && !linked.length) scRowSets(d, i0).filter(([y]) => y !== x0 && scVisOf(y, t)).forEach(([y]) => { if (y.lock) scMembers(y).forEach(o => mv.add(o)); else mv.add(scObjOf(y, t)); });
      mv.delete(scDrag.obj); mv.forEach(o => { if (o && o.x != null) { o.x += dx; o.y += dy; } });
      d.sets.forEach((x, i) => [['set', x], ['arm', x.arm], ['st', x.st], ['fm', x.arm.fm], ['pc', x.parts.c], ['pn', x.parts.n], ['pg', x.parts.g]].forEach(([tt, o]) => { if (!mv.has(o)) return;
        const e = R.$('scEls').querySelector(`[data-el="${tt}:${i}"]`); if (e) { e.style.left = o.x + 'cqw'; e.style.top = o.y + 'cqw'; } }));
    }
    scFmOverlay(d); scPreviewSoon();
  });
  const scEndDrag = () => { if (!scDrag) return; const { moved, key, free, obj } = scDrag; scDrag = null;
    { const sx = moved && scSetOfSel(key); if (sx) { const d1 = D(); [sx, ...scLinked(d1, sx)].forEach(y => { if (y.syncMode === 'partial') scDockSave(y, d1.sets.indexOf(y)); }); } } R.$('scGuides').innerHTML = ''; drawStage();
    const d = D(); if (moved && free) obj.free = true; else if (moved) { const sx = scSetOfSel(key); if (!(sx && (sx.syncMode === 'free' || scLinked(d, sx).length))) scSyncAfter(d, key); }   // frei platziert → bleibt genau so liegen
    drawProps(); if (moved) scSaveSoon(); };
  R.$('scEls').addEventListener('pointerup', scEndDrag);
  R.$('scEls').addEventListener('pointercancel', scEndDrag);
  R.$('scEls').addEventListener('click', (ev) => {                 // außerhalb des Bearbeitungsmodus: Set antippen = unten anzeigen
    if (sc.edit) return;
    const el = ev.target.closest('[data-el^="set:"],[data-el^="pc:"],[data-el^="pn:"],[data-el^="pg:"]');
    if (!el) { if (sc.hl != null) { sc.hl = null; drawStage(); } return; }
    const i = +el.dataset.el.split(':')[1];
    if (sc.hl === i) { R.$('scDetail').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }   // nochmal antippen → runter zum Set
    sc.hl = i; sc.si = i; sc.gsel = null; drawShowcase();
  });
  R.$('scProps').addEventListener('input', (ev) => {
    if (ev.target.dataset.setcol != null) { const x = scSetOfSel(); if (x) { x.nc = scColor(ev.target.value); drawStage(); scSaveSoon(); } return; }
    const o = scSelObj(); if (!o) return;
    if (ev.target.id === 'scPS') {
      const gx = scSetOfSel();
      if (gx && gx.syncMode === 'full' && !gx.kind) {                // Full Sync: der Regler skaliert das ganze Set
        const ns = scScale(+ev.target.value / 100); scScaleGroup(gx, D().sets.indexOf(gx), (gx.s || 1) * ns / (o.s || 1));
        R.$('scPSv').textContent = Math.round(ns * 100) + ' %'; drawStage(); scSaveSoon(); return;
      }
      const before = scBox(sc.sel, o), d = D();
      o.s = scScale(+ev.target.value / 100); R.$('scPSv').textContent = Math.round(o.s * 100) + ' %';
      if (before) { const nb = scBox(sc.sel, o); if (nb) o.y = before.t + nb.h / 2; }   // obere Kante bleibt, wo sie ist
      if (scSyncOn(d)) scSyncAfter(d, sc.sel);
      { const el = R.$('scEls').querySelector(`[data-el="${sc.sel}"]`); if (el) { el.style.transform = scTf(o); el.style.top = o.y + 'cqw'; } scFmOverlay(D()); }
      scSaveSoon();
    } else if (ev.target.id === 'scPFz') {
      o.fz = scInt(ev.target.value, 70, 150, 100); R.$('scPFzv').textContent = o.fz + ' %'; drawStage(); scSaveSoon();
    } else if (ev.target.id === 'scPRot') {
      o.r = scRot(ev.target.value); R.$('scPRotv').textContent = o.r + '°';
      const el = R.$('scEls').querySelector(`[data-el="${sc.sel}"]`); if (el) el.style.transform = scTf(o); scFmOverlay(D());
      scSaveSoon();
    } else if (ev.target.id === 'scPC') { o.color = scColor(ev.target.value); drawStage(); scSaveSoon(); }
    else if (ev.target.id === 'scPF') { o.fill = scColor(ev.target.value); drawStage(); scSaveSoon(); }
    else if (ev.target.id === 'scPFo') { o.fillO = Math.min(100, Math.max(0, +ev.target.value || 0)); R.$('scPFov').textContent = o.fillO + ' %'; drawStage(); scSaveSoon(); }
    else if (ev.target.id === 'scPR') { o.border = scColor(ev.target.value); drawStage(); scSaveSoon(); }
    else if (ev.target.id === 'scPBw') { o.bw = Math.min(10, Math.max(1, +ev.target.value || 1)); R.$('scPBwv').textContent = o.bw + ' px'; drawStage(); scSaveSoon(); }
    else if (ev.target.id === 'scPT') { o.text = ev.target.value.slice(0, 80); drawStage(); scSaveSoon(); }
  });
  R.$('scProps').addEventListener('change', (ev) => {
    if (ev.target.dataset.sy) { const x = scSetOfSel(); if (!x || x.syncMode !== 'partial') return; const i = D().sets.indexOf(x);
      { const k2 = ev.target.dataset.sy, d2 = D(); [x, ...scLinked(d2, x)].forEach(y => { if (y.syncMode !== 'partial') return;   // Haken gelten für die ganze Gruppe
        y.sy[k2] = ev.target.checked; if (ev.target.checked && y.dock) delete y.dock[k2]; if (y !== x) { const j = d2.sets.indexOf(y); scDecouple(y, j); scDockSave(y, j); } }); }   // alte Abdock-Position verwerfen        // Partial Sync: Haken ändert nur die Bindung – das Teil bleibt exakt stehen
      scDecouple(x, i); scDockSave(x, i); drawStage(); drawProps(); scSaveSoon(); return; }
    let o = scSelObj(); if (!o) return;
    if (ev.target.dataset.setopt) o = scSetOfSel() || o;
    if (ev.target.dataset.fsep != null) { const x = scSetOfSel(), i = D().sets.indexOf(x); if (!x) return;
      scFmSep(x, i, ev.target.checked); if (!ev.target.checked && sc.sel === 'fm:' + i) sc.sel = 'set:' + i; drawStage(); drawProps(); drawArm(); scSaveSoon(); return; }
    if (ev.target.id === 'scPS' && scSetOfSel()?.syncMode === 'full' && !scSetOfSel()?.kind) { drawStage(); drawProps(); scSaveSoon(); return; }
    if (ev.target.id === 'scPS') { const d = D(), b = D().grid && scBox(sc.sel, o); if (b) o.y = scLine(b.t, 0) + b.h / 2;
      scSyncAfter(d, sc.sel); drawStage(); scSaveSoon(); return; }
    if (ev.target.id === 'scPNi') { o.ni = !ev.target.checked; drawStage(); scSaveSoon(); return; }
    if (ev.target.id === 'scPRound') { o.round = ev.target.checked; drawStage(); scSaveSoon(); return; }
    if (ev.target.dataset.setopt === 'gearOn') { o.gearOn = ev.target.checked; { const d = D(), L = scLayoutPos(d, scH(d)); d.sets.forEach((x, i) => { if (x.kind && L.sp[i]) { x.x = L.sp[i].x; x.y = L.sp[i].y; } }); } drawStage(); drawProps(); drawDetail(); scSaveSoon(); return; }
    if (ev.target.dataset.setopt === 'armOn') { const i = D().sets.indexOf(o), b0 = scBox('arm:' + i, o.arm);
      o.arm.on = ev.target.checked;
      if (o.arm.on && !b0) scArmShow(o);
      else { drawStage(); const b1 = scBox('arm:' + i, o.arm); if (b0 && b1) { o.arm.y = b0.t + b1.h / 2; drawStage(); }   // obere Kante bleibt
        if (o.st.on && scStHas(o.arm) && !o.st.free && scBound(o, 'st')) { scStUnder(o, true); } }
      drawStage(); drawProps(); drawArm(); scSaveSoon(); return; }
    if (ev.target.dataset.setopt === 'stOn') { o.st.on = ev.target.checked; if (o.st.on) scStShow(o); drawStage(); drawArm(); scSaveSoon(); return; }
    if (ev.target.id === 'scPNt') { (scSetOfSel()?.st || o).nt = !ev.target.checked; if (D().syncs.st) { const i = +sc.sel.split(':')[1]; scSyncAfter(D(), 'st:' + i); } drawStage(); scSaveSoon(); return; }
    if (ev.target.dataset.setopt) { const x = o; x[ev.target.dataset.setopt] = ev.target.checked;
      if (ev.target.dataset.setopt === 'heads') { drawStage(); scStack(x); }
      drawStage(); drawProps(); drawDetail(); scSaveSoon(); return; }
    if (ev.target.id === 'scPFn') o.fill = ev.target.checked ? 'none' : '';
    else if (ev.target.id === 'scPRn') o.border = ev.target.checked ? 'none' : '';
    else if (ev.target.id === 'scPSh') o.shadow = ev.target.checked;
    else return;
    drawStage(); drawProps(); scSaveSoon();
  });
  R.$('scProps').addEventListener('click', (ev) => {
    const o = scSelObj(); if (!o) return;
    const szb = ev.target.closest('[data-sizeall]');
    if (szb) { const x = scSetOfSel(), d = D(); if (!x) return;
      const ns = scScale(Math.min(400, Math.max(30, +R.$('scPAll').value || 100)) / 100);
      (szb.dataset.sizeall === 'all' ? d.sets : [x]).forEach(y => scSetAllSize(y, d.sets.indexOf(y), ns));
      drawStage(); drawProps(); scSave(`✓ Größe ${Math.round(ns * 100)} % übernommen`); return; }
    const sa = ev.target.closest('[data-setact]');
    if (sa) { const x = scSetOfSel(); if (!x) return; const i = D().sets.indexOf(x);
      if (sa.dataset.setact === 'align') { scSyncSet(x, i); drawStage(); drawProps(); drawArm(); scSave('⇕ Set ausgerichtet'); return; }
      if (sa.dataset.setact === 'std') {
        UI.confirm('⚠ Set auf Standard zurücksetzen?\n\nKommandanten, Namen, Ausrüstung, Rüstung, Formation und Werte dieses Sets bekommen wieder 100 % Größe und ihre Standard-Position. Eigene Größen und Positionen dieses Sets gehen verloren.')
          .then(ok => { if (!ok) return; scSetDefault(x, D().sets.indexOf(x)); sc.sel = 'set:' + D().sets.indexOf(x); drawStage(); drawProps(); drawArm(); scSave('↺ Set auf Standard zurückgesetzt'); });
        return; }
      if (sa.dataset.setact === 'ncreset') { x.nc = ''; drawStage(); drawProps(); scSaveSoon(); return; }
      if (SC_MODES.includes(sa.dataset.setact)) { const md = sa.dataset.setact;
        scGroupMode(D(), x, md);                                   // verknüpfte Sets bekommen denselben Modus
        sc.sel = x.split ? (x.cm ? 'pc:' : x.cn ? 'pn:' : 'pg:') + i : 'set:' + i;
        drawStage(); drawProps(); drawArm();
        scSave({ full: '🔒 Full Sync – alles fest verbunden', partial: '⇅ Partial Sync – angehakte Teile verbunden', free: '✥ Free Mode – alles frei beweglich' }[md]); return; }
      return; }
    if (ev.target.closest('[data-linkreset]')) { scUnlinkAll(D()); drawProps(); scSaveSoon(); return; }
    const lb = ev.target.closest('[data-link]'), la = ev.target.closest('[data-linkall]');
    if (lb || la) { const d = D(), x = scSetOfSel(); if (!x) return;
      const before = new Set([x, ...scLinked(d, x)]);
      if (lb) { const y = d.sets[+lb.dataset.link]; if (y) scLinkSet(d, x, y, !scLinked(d, x).includes(y)); }
      else { const on = scLinked(d, x).length < d.sets.length - 1; if (on) scGroupWrite(d.sets.slice()); else scUnlinkAll(d); }
      { const joined = scLinked(d, x).filter(y => !before.has(y)); if (joined.length) { scGroupMode(d, x, x.syncMode, joined); drawStage(); } }   // neu verknüpfte Sets übernehmen Modus + Haken
      drawProps(); scSaveSoon(); return; }
    const fp = ev.target.closest('[data-armfpos]');
    if (fp) { const x = scSetOfSel(); scFmPos(x, D().sets.indexOf(x), fp.dataset.armfpos); return; }
    if (ev.target.closest('#scPUnfree')) { const [t, k] = sc.sel.split(':'), d = D(), x = d.sets[+k]; o.free = false;
      if (t === 'arm' && x) scArmUnder(x, true); else if (t === 'st' && x) { drawStage(); scStUnder(x, true); } else scSnapObj(sc.sel, o);
      drawStage(); scSyncAfter(d, sc.sel); drawProps(); scSaveSoon(); return; }
    const ac = ev.target.closest('[data-armcols]');
    if (ac) { scArmCols(D().sets[+sc.sel.split(':')[1]], +ac.dataset.armcols); return; }
    const al = ev.target.closest('[data-stal]');
    if (al) { const xs = scSetOfSel(); (xs ? xs.st : o).al = SC_AL[al.dataset.stal] ? al.dataset.stal : 'left'; if (D().syncs.st && xs) scSyncAfter(D(), 'st:' + D().sets.indexOf(xs)); drawStage(); drawProps(); scSaveSoon(); return; }
    if (ev.target.closest('#scPCr')) { o.color = ''; drawStage(); drawProps(); scSaveSoon(); }
    else if (ev.target.closest('#scPRot0')) { o.r = 0; drawStage(); drawProps(); scSaveSoon(); }
    else if (ev.target.closest('#scPBr')) { const tx = sc.sel.startsWith('tx:');
      Object.assign(o, { s: 1, r: 0, color: '', shadow: true, fill: tx ? 'none' : '', fillO: 75, border: tx ? 'none' : '', bw: 0 }); drawStage(); drawProps(); scSaveSoon(); }
    else if (ev.target.closest('#scPFrame')) scFramePicker();
    else if (ev.target.closest('#scPFrameOff')) { o.frame = ''; o.round = false; o.fz = 100; drawStage(); drawProps(); scSave('✓ Rahmen entfernt'); }
    else if (ev.target.closest('#scPSkinAdd')) scSkinPicker('add');
    else if (ev.target.closest('#scPSkin')) scSkinPicker(sc.sel.startsWith('xs:') ? sc.sel.slice(3) : undefined);
    else if (ev.target.closest('#scPDel')) { const d = D(); d.texts = d.texts.filter(x => x !== o); d.xskins = (d.xskins || []).filter(x => x !== o); sc.sel = null; drawStage(); drawProps(); scSaveSoon(); }
    else if (ev.target.closest('#scPHide') || ev.target.closest('#scPShow')) { const on = !!ev.target.closest('#scPShow'), [t, k] = sc.sel.split(':');
      if (t === 'w') scShowWidget(k, on);
      else { o.on = on; const x = D().sets[+k]; if (on && x) { if (t === 'arm') scArmShow(x); else if (t === 'st') scStShow(x); } drawStage(); drawProps(); drawArm(); scSaveSoon(); } }
  });
  R.$('scEditBtn').onclick = () => {
    sc.edit = !sc.edit; sc.gsel = null; sc.sel = null; if (!sc.edit) { Object.assign(sc.zoom, { on: false, z: 1, x: 0, y: 0 }); scZoomApply(); }
    if (sc.edit) scOpen = true; else scSave('✓ Showcase gespeichert');
    drawShowcase();
    if (sc.edit) { scCkStore(); sc.hist = []; scHistReset(); }   // Bearbeiten beginnt → Zwischenstand = Stand vorher, „Zurück“ startet leer
    if (sc.edit) R.$('scEditBar').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  // ---- Zwischenspeichern / Abbrechen: Stand je Showcase merken (auch nach Neuladen, im Browser) und wiederherstellen ----
  const SC_CK_KEY = 'rok_sc_checkpoints';
  const scCkAll = () => { let a = {}; try { a = JSON.parse(localStorage.getItem(SC_CK_KEY) || '{}') || {}; } catch {} if (sc.ckMem && sc.doc && !a[scCkKey()] && sc.ckMem.data?.id === D().id) a[scCkKey()] = sc.ckMem; return a; };
  const scCkKey = () => (RokAuth.userId?.() || 'local') + '|' + D().id;
  function drawCk() {
    const c = sc.own && sc.doc ? scCkAll()[scCkKey()] : null;
    R.$('scCkUndo').disabled = !c;
    R.$('scCkInfo').textContent = c ? `Zwischenstand: ${new Date(c.t).toLocaleString(I18N.lang?.() === 'en' ? 'en-GB' : 'de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : '';
  }
  function scCkStore() {
    if (!sc.own || !sc.doc) return false;
    const all = scCkAll(); all[scCkKey()] = { t: Date.now(), data: JSON.parse(JSON.stringify(D())) };
    try { localStorage.setItem(SC_CK_KEY, JSON.stringify(all)); }
    catch { sc.ckMem = all[scCkKey()]; }                      // zu groß für den Browser-Speicher → nur bis zum Neuladen merken
    drawCk(); return true;
  }
  R.$('scCkSave').onclick = () => { if (scCkStore()) scMsg('💾 Zwischenstand gespeichert – „✖ Abbrechen“ springt hierher zurück.', 'ok'); };
  R.$('scCkUndo').onclick = async () => {
    const c = scCkAll()[scCkKey()]; if (!sc.own || !c) return;
    if (!(await UI.confirm('✖ Abbrechen?\n\nAlle Änderungen seit dem letzten Zwischenspeichern werden verworfen, der Zwischenstand wird komplett wiederhergestellt und das Bearbeiten beendet.'))) return;
    if (scDrag) scDrag = null;
    clearTimeout(scT);
    scRestore(c.data); sc.edit = false; sc.hist = []; scHistReset(); Object.assign(sc.zoom, { on: false, z: 1, x: 0, y: 0 }); scZoomApply();
    drawShowcase(); scSave('✖ Abgebrochen – Zwischenstand wiederhergestellt');
  };
  function scRestore(data) {                                // Showcase-Stand aus einer Kopie zurückholen
    const raw = typeof data === 'string' ? JSON.parse(data) : JSON.parse(JSON.stringify(data));
    const i = sc.doc.list.findIndex(x => x.id === raw.id); if (i < 0) return false;
    sc.doc.list[i] = scNorm(raw, i, true);
    if (!sc.doc.list[i].sets.length) sc.doc.list[i].sets.push(scSetNorm({}));
    sc.sel = null; sc.gsel = null; sc.hl = null; sc.si = Math.min(sc.si, sc.doc.list[i].sets.length - 1);
    R.$('scGuides').innerHTML = '';
    return true;
  }
  // ---- Zurück: Schritt für Schritt rückgängig (bis zu 60 Schritte, schnelle Folgeänderungen wie Regler = 1 Schritt) ----
  sc.hist = [];
  function scHistReset() { sc.hLast = sc.doc ? { id: D().id, j: JSON.stringify(D()) } : null; sc.hT = 0; drawUndoBtn(); }
  function scHistTrack() {
    if (!sc.own || !sc.doc || sc.undoing) return;
    const d = D(), cur = JSON.stringify(d);
    if (!sc.hLast || sc.hLast.id !== d.id) { sc.hist = []; sc.hLast = { id: d.id, j: cur }; drawUndoBtn(); return; }
    if (cur === sc.hLast.j) return;
    const now = Date.now();
    if (now - (sc.hT || 0) > 700) { sc.hist.push(sc.hLast.j); if (sc.hist.length > 60) sc.hist.shift(); }
    sc.hT = now; sc.hLast.j = cur; drawUndoBtn();
  }
  function drawUndoBtn() { const b = R.$('scUndo'); if (b) { b.disabled = !sc.hist.length; b.textContent = sc.hist.length ? `↩ Zurück (${sc.hist.length})` : '↩ Zurück'; } }
  function scUndo() {
    if (!sc.own || !sc.hist.length) return;
    const j = sc.hist.pop(); sc.undoing = true;
    if (scRestore(j)) { drawShowcase(); sc.hLast = { id: D().id, j: JSON.stringify(D()) }; sc.hT = 0; scSave('↩ Schritt rückgängig', true); }
    sc.undoing = false; drawUndoBtn();
  }
  R.$('scUndo').onclick = scUndo;
  document.addEventListener('keydown', (ev) => {
    if (!sc.edit || !sc.own || !(ev.ctrlKey || ev.metaKey) || ev.key.toLowerCase() !== 'z' || ev.shiftKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) && document.activeElement.type !== 'range' && document.activeElement.type !== 'checkbox') return;
    ev.preventDefault(); scUndo();
  });
  // ---- Freie Ansicht: zoomen (Lupen, Mausrad) und frei verschieben – nichts wird verändert ----
  sc.zoom = { on: false, z: 1, x: 0, y: 0 };
  function scZoomApply() {
    const st = R.$('scStage'), Z = sc.zoom;
    st.classList.toggle('sc-zoom', Z.on && !sc.exporting);
    st.style.setProperty('--z', Z.z); st.style.setProperty('--zx', Z.x + 'px'); st.style.setProperty('--zy', Z.y + 'px');
    R.$('scViewBtn').setAttribute('aria-pressed', String(Z.on)); R.$('scZoomReset').textContent = Math.round(Z.z * 100) + ' %';
  }
  function scZoomBy(f, px, py) {                             // um Punkt (px/py in Bühnen-Pixeln) zoomen
    const Z = sc.zoom, r = R.$('scStage').getBoundingClientRect(), nz = Math.min(5, Math.max(1, +(Z.z * f).toFixed(3)));
    const cx = px ?? r.width / 2, cy = py ?? r.height / 2;
    Z.x = cx - (cx - Z.x) * nz / Z.z; Z.y = cy - (cy - Z.y) * nz / Z.z; Z.z = nz;
    if (nz === 1) { Z.x = 0; Z.y = 0; }
    Z.x = Math.min(0, Math.max(r.width - r.width * nz, Z.x)); Z.y = Math.min(0, Math.max(r.height - r.height * nz, Z.y));
    Z.on = true; scZoomApply();
  }
  R.$('scViewBtn').onclick = () => { sc.zoom.on = !sc.zoom.on; if (sc.zoom.on) { sc.sel = null; drawStage(); drawProps(); } scZoomApply(); };
  R.$('scZoomIn').onclick = () => scZoomBy(1.25);
  R.$('scZoomOut').onclick = () => scZoomBy(0.8);
  R.$('scZoomReset').onclick = () => { Object.assign(sc.zoom, { z: 1, x: 0, y: 0 }); scZoomApply(); };
  { const st = R.$('scStage'); let pan = null;
    st.addEventListener('pointerdown', (ev) => { if (!sc.zoom.on) return; ev.stopPropagation(); ev.preventDefault();
      pan = { sx: ev.clientX, sy: ev.clientY, x: sc.zoom.x, y: sc.zoom.y }; st.classList.add('sc-grab'); try { st.setPointerCapture(ev.pointerId); } catch {} }, true);
    st.addEventListener('pointermove', (ev) => { if (!pan) return; ev.stopPropagation();
      const r = st.getBoundingClientRect(), Z = sc.zoom;
      Z.x = Math.min(0, Math.max(r.width - r.width * Z.z, pan.x + ev.clientX - pan.sx)); Z.y = Math.min(0, Math.max(r.height - r.height * Z.z, pan.y + ev.clientY - pan.sy)); scZoomApply(); }, true);
    const end = (ev) => { if (!pan) return; ev.stopPropagation(); pan = null; st.classList.remove('sc-grab'); };
    st.addEventListener('pointerup', end, true); st.addEventListener('pointercancel', end, true);
    st.addEventListener('click', (ev) => { if (sc.zoom.on) { ev.stopPropagation(); ev.preventDefault(); } }, true);
    st.addEventListener('wheel', (ev) => { if (!sc.zoom.on) return; ev.preventDefault(); const r = st.getBoundingClientRect(); scZoomBy(ev.deltaY < 0 ? 1.15 : 1 / 1.15, ev.clientX - r.left, ev.clientY - r.top); }, { passive: false }); }
  // ---- Entfernen: Ausgewähltes schnell aus dem Bild nehmen ----
  async function scRemoveSel() {
    const o = scSelObj(); if (!o || !sc.own) return;
    const [t, k] = sc.sel.split(':'), d = D();
    if (t === 'set') {
      const x = d.sets[+k]; if (d.sets.length <= 1) { UI.alert('Das letzte Set kann nicht entfernt werden – stattdessen „Set zurücksetzen“ nutzen.'); return; }
      if (!(await UI.confirm(`„${x.kind ? SC_KIND[x.kind] : (x.name || 'Set ' + (+k + 1))}“ aus dem Showcase löschen?`))) return;
      d.sets.splice(+k, 1); sc.si = Math.max(0, Math.min(sc.si, d.sets.length - 1)); scRecenter(d);
    } else if (t === 'pc') d.sets[+k].cm = false;
    else if (t === 'pn') d.sets[+k].cn = false;
    else if (t === 'pg') d.sets[+k].heads = true;
    else if (t === 'fm') scFmSep(d.sets[+k], +k, false);
    else if (t === 'tx') d.texts = d.texts.filter(x => x !== o);
    else if (t === 'xs') d.xskins = (d.xskins || []).filter(x => x !== o);
    else o.on = false;                                         // Anzeige / Rüstung / Werte: nur ausblenden (über „Einblenden“ zurückholbar)
    sc.sel = null; drawShowcase(); scSave('🗑 Entfernt');
  }
  R.$('scRemoveSel').onclick = scRemoveSel;
  sc.free = false;
  R.$('scFreeBtn').onclick = () => { sc.free = !sc.free; R.$('scFreeBtn').setAttribute('aria-pressed', String(sc.free));
    scMsg(sc.free ? '✥ Frei bewegen ist an – Elemente bleiben genau dort liegen, wo du sie loslässt.' : '⊞ Frei bewegen aus – Raster und Sync gelten wieder.', 'ok'); };
  document.addEventListener('keydown', (ev) => {
    if (!sc.edit || !sc.own || !sc.sel || !['Delete', 'Backspace'].includes(ev.key)) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable) return;
    ev.preventDefault(); scRemoveSel();
  });
  R.$('scProps').addEventListener('click', (ev) => { const b = ev.target.closest('[data-scanset]'); if (b) sc.si = +b.dataset.scanset; }, true);
  R.$('scDone').onclick = () => { sc.free = false; R.$('scFreeBtn').setAttribute('aria-pressed', 'false'); Object.assign(sc.zoom, { on: false, z: 1, x: 0, y: 0 }); scZoomApply(); sc.edit = false; sc.sel = null; drawShowcase(); scSave('✓ Showcase gespeichert'); };
  function drawSyncMenu(d) {
    const n = Object.values(d.syncs).filter(Boolean).length;
    R.$('scSyncN').textContent = n ? `(${n})` : 'aus';
    R.$('scSyncList').innerHTML = Object.entries(SC_SYNCS).map(([k, [l, h]]) => `<label class="flex items-start gap-2 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-ink-800" title="${R.esc(h)}">
      <input type="checkbox" data-sync="${k}" ${d.syncs[k] ? 'checked' : ''} class="mt-0.5 w-4 h-4 accent-yellow-500"><span><span class="font-semibold text-slate-100">${l}</span><span class="block text-[10px] text-slate-500">${h}</span></span></label>`).join('');
  }
  R.$('scSyncBtn').onclick = (ev) => { ev.stopPropagation(); const open = R.$('scSyncMenu').classList.toggle('hidden') === false; R.$('scSyncBtn').setAttribute('aria-expanded', String(open)); if (open) drawSyncMenu(D()); };
  document.addEventListener('click', (ev) => { if (!ev.target.closest('#scSyncWrap')) { R.$('scSyncMenu').classList.add('hidden'); R.$('scSyncBtn').setAttribute('aria-expanded', 'false'); } });
  R.$('scSyncList').addEventListener('change', async (ev) => {
    const t = ev.target.closest('[data-sync]'); if (!t || !sc.own) return;
    const d = D(), k = t.dataset.sync;
    if (t.checked && !(await UI.confirm(`⚠ Sync „${SC_SYNCS[k][0]}“ einschalten?\n\nGrößen und Positionen werden sofort angeglichen – dein Showcase-Bild kann sich dadurch verändern.`))) { t.checked = false; return; }
    d.syncs[k] = t.checked;
    if (t.checked) { const before = JSON.stringify(d); scSyncAll(d); if (before !== JSON.stringify(d)) scMsg('🔗 Sync eingeschaltet – Größen und Höhen wurden angeglichen.', 'ok'); }
    drawSyncMenu(d); drawStage(); scSaveSoon();
  });
  R.$('scGuidesOn').onchange = () => { D().guides = R.$('scGuidesOn').checked; scSaveSoon(); };
  R.$('scSyncA').onchange = async () => { const d = D(), v = R.$('scSyncA').value;
    if (scSyncOn(d) && v !== 'none' && !(await UI.confirm('⚠ Ausrichtung ändern?\n\nAlle gesyncten Elemente werden neu ausgerichtet – dein Showcase-Bild kann sich dadurch verändern.'))) { R.$('scSyncA').value = d.syncA || 'top'; return; }
    d.syncA = v; if (scSyncOn(d)) { if (sc.sel && /^(set|arm|st|xs|w):/.test(sc.sel)) scSyncAfter(d, sc.sel); else scSyncAll(d); } drawStage(); scSaveSoon(); };
  R.$('scGridOn').onchange = () => { D().grid = R.$('scGridOn').checked; drawStage(); scSaveSoon(); };
  R.$('scGridC').onchange = () => { D().gridC = SC_GRID_C[R.$('scGridC').value] ? R.$('scGridC').value : 'gold'; if (!D().grid) { D().grid = true; R.$('scGridOn').checked = true; } drawStage(); scSaveSoon(); };
  R.$('scHeight').onchange = () => {
    const d = D(); d.h = R.$('scHeight').value; const H = scH(d);
    [...d.sets, ...d.sets.map(x => x.arm), ...d.sets.map(x => x.st), ...Object.values(d.els)].forEach(o => { if (o.y != null) o.y = Math.min(o.y, H); });
    drawStage(); scSaveSoon();
  };
  function scShowWidget(k, on) {                            // Anzeige ein-/ausblenden (bleibt ausgewählt, Einstellungen bleiben sichtbar)
    const d = D(), w = d.els[k]; if (!w) return; w.on = on;
    if (w.on && k === 'skin' && !d.skin) setTimeout(scSkinPicker, 50);
    if (w.on) {                                               // an den Standard-Platz – zusammengehörige Anzeigen (Kopfzeile links, Werte unten) gleich mit ausrichten
      if (w.x == null || w.y == null) { const L = scLayoutPos(d, scH(d)), p = L.wp[k]; if (p) { Object.assign(w, p); if (L.anch['w:' + k]) scPendingAnch['w:' + k] = L.anch['w:' + k]; } else scAutoLayout(d, true); }
    }
    sc.sel = 'w:' + k;
    drawStage(); scFixAnchors(); if (w.on && ['kp', 'power', 'merit', 'kd', 'tag', 'vip'].includes(k)) scFlowRows(d); drawProps(); drawWidgetOpts(d); scSaveSoon();
  }
  R.$('scWidgetOpts').addEventListener('click', (ev) => {        // Antippen = nur auswählen → Einstellungen erscheinen unten
    const ws = ev.target.closest('[data-wset]');
    const showProps = () => { const r = R.$('scProps').getBoundingClientRect(); if (r.top > innerHeight - 80 || r.bottom < 80) R.$('scProps').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); };
    if (ws && sc.own) { scSelSet(+ws.dataset.wset); showProps(); return; }
    const t = ev.target.closest('[data-wsel]'); if (!t || !sc.own) return;
    sc.sel = 'w:' + t.dataset.wsel; drawStage(); drawProps(); drawWidgetOpts(D());
    showProps();
  });
  R.$('scAddSkin').onclick = () => scSkinPicker('add');
  R.$('scAddText').onclick = () => {
    const d = D(); if ((d.texts || []).length >= 12) { UI.alert('Maximal 12 eigene Texte pro Showcase.'); return; }
    const t = scTxNorm({ text: 'Dein Text' }); t.x = 50; t.y = scGridSnap(scH(d) / 2);
    d.texts.push(t); sc.sel = 'tx:' + t.id; drawStage(); drawProps(); scSaveSoon();
    setTimeout(() => { const i = R.$('scPT'); if (i) { i.focus(); i.select(); } }, 30);
  };
  R.$('scAuto').onclick = async () => {
    if (!(await UI.confirm('⚠ Wirklich alles symmetrisch anordnen?\n\nAlle Sets, Rüstungen und Anzeigen dieses Showcase werden automatisch neu platziert – deine eigene Anordnung geht dabei verloren.'))) return;
    { const d = D(); d.sets.forEach(x => { x.free = false; x.split = false; x.syncMode = 'full'; x.lock = true; x.arm.free = false; x.st.free = false; }); Object.values(d.els).forEach(w => { w.free = false; }); (d.texts || []).forEach(t => { t.free = false; }); (d.xskins || []).forEach(t => { t.free = false; }); }
    scAutoLayout(D(), false); drawShowcase(); scFixAnchors(); scFlowRows(D()); scSnapTops(); if (scSyncOn(D())) scSyncAll(D()); D().sets.forEach((x, i) => { if (x.arm.on && x.arm.fsep) scFmPlace(x, i); }); drawStage(); scFitSets(D()); scSave('✓ Symmetrisch angeordnet');
  };

  // ---- City-Skin auswählen ----
  // Katalog: Bilder liegen unter /icons/skins/<id>.webp – weitere einfach hier ergänzen (name optional)
  // Dateiname genau wie in GitHub unter icons/city skins/ (Groß-/Kleinschreibung beachten)
  const CITY_SKINS = [
    { id: "age-of-devotion.webp", name: "Age of Devotion" },
    { id: "alhambra-palace.webp", name: "Alhambra Palace" },
    { id: "amber-fortress.webp", name: "Amber Fortress" },
    { id: "ancestral-hall.webp", name: "Ancestral Hall" },
    { id: "ancient-leisure.webp", name: "Ancient Leisure" },
    { id: "anubis-the-judicator.webp", name: "Anubis the Judicator" },
    { id: "astral-pegasus.webp", name: "Astral Pegasus" },
    { id: "atlantis.webp", name: "Atlantis" },
    { id: "azure-thunderscape.webp", name: "Azure Thunderscape" },
    { id: "babylonian-gardens (1).webp", name: "Babylonian Gardens" },
    { id: "battles-bloom.webp", name: "Battle’s Bloom" },
    { id: "blessings-of-the-gods.webp", name: "Blessings of the Gods" },
    { id: "bloodblaze-crown.webp", name: "Bloodblaze Crown" },
    { id: "call-of-eternity.webp", name: "Call of Eternity" },
    { id: "city-of-power.webp", name: "City of Power" },
    { id: "crowning-glory.webp", name: "Crowning Glory" },
    { id: "daedalus-dirigible.webp", name: "Daedalus Dirigible" },
    { id: "divine-abode.webp", name: "Divine Abode" },
    { id: "divine-dawnbreaker.webp", name: "Divine Dawnbreaker" },
    { id: "divine-diadem.webp", name: "Divine Diadem" },
    { id: "divine-lighthouse.webp", name: "Divine Lighthouse" },
    { id: "dragon-tamer.webp", name: "Dragon Tamer" },
    { id: "dreams-of-the-apkallu.webp", name: "Dreams of the Apkallu" },
    { id: "dynastic-conqueror.webp", name: "Dynastic Conqueror" },
    { id: "emeraldshade-hall.webp", name: "Emeraldshade Hall" },
    { id: "feline-fort.webp", name: "Feline Fort" },
    { id: "flaming-prophecy.webp", name: "Flaming Prophecy" },
    { id: "flight-of-the-heron.webp", name: "Flight of the Heron" },
    { id: "frosthowl-sanctum.webp", name: "Frosthowl Sanctum" },
    { id: "frozen-fortress.webp", name: "Frozen Fortress" },
    { id: "gilded-pavilion.webp", name: "Gilded Pavilion" },
    { id: "hawa-mahal.webp", name: "Hawa Mahal" },
    { id: "hedvig.webp", name: "Hedvig" },
    { id: "heliopolis.webp", name: "Heliopolis" },
    { id: "island-fortress.webp", name: "Island Fortress" },
    { id: "jade-plume-palace.webp", name: "Jade Plume Palace" },
    { id: "lake-palace.webp", name: "Lake Palace" },
    { id: "mayan-mystery.webp", name: "Mayan Mystery" },
    { id: "melk-abbey.webp", name: "Melk Abbey" },
    { id: "ode-to-victory.webp", name: "Ode to Victory" },
    { id: "omniscient-watch.webp", name: "Omniscient Watch" },
    { id: "on-wings-of-sailcloth.webp", name: "On Wings of Sailcloth" },
    { id: "persian-dream.webp", name: "Persian Dream" },
    { id: "phoenix-pavilion.webp", name: "Phoenix Pavilion" },
    { id: "phoenix-perch.webp", name: "Phoenix Perch" },
    { id: "poseidons-sanctuary.webp", name: "Poseidon’s Sanctuary" },
    { id: "promise-of-love.webp", name: "Promise of Love" },
    { id: "reign-of-rime.webp", name: "Reign of Rime" },
    { id: "road-to-the-crown.webp", name: "Road to the Crown" },
    { id: "ruins-of-kom-ombo.webp", name: "Ruins of Kom Ombo" },
    { id: "saga-of-the-longship.webp", name: "Saga of the Longship" },
    { id: "saints-halo.webp", name: "Saint’s Halo" },
    { id: "sands-of-time.webp", name: "Sands of Time" },
    { id: "skypiercer.webp", name: "Skypiercer" },
    { id: "spire-of-wadjet.webp", name: "Spire of Wadjet" },
    { id: "st-peters-basilica.webp", name: "St. Peter’s Basilica" },
    { id: "star-palace.webp", name: "Star Palace" },
    { id: "steam-patrol.webp", name: "Steam Patrol" },
    { id: "summer-palace.webp", name: "Summer Palace" },
    { id: "summit-of-the-supreme.webp", name: "Summit of the Supreme" },
    { id: "supreme-warrior.webp", name: "Supreme Warrior" },
    { id: "topkapi-palace.webp", name: "Topkapi Palace" },
    { id: "twilight-falls.webp", name: "Twilight Falls" },
    { id: "warriors-hymn.webp", name: "Warrior’s Hymn" },
    { id: "wat-phra-si-sanphet.webp", name: "Wat Phra Si Sanphet" },
    { id: "where-all-roads-lead.webp", name: "Where all Roads Lead" }
  ];
  const SKIN_DIR = '/icons/city%20skins/';
  const skinImg = (id) => SKIN_DIR + encodeURIComponent(id);
  // neue Bilder in icons/city skins/ automatisch übernehmen (GitHub-Ordnerliste, 1 h zwischengespeichert)
  (async function syncCitySkins() {
    let list = null;
    try { const c = JSON.parse(localStorage.getItem('rok_skin_files2') || 'null'); if (c && Date.now() - c.t < 3600e3 && Array.isArray(c.list)) list = c.list; } catch {}
    if (!list) {
      try {
        const r = await fetch('https://api.github.com/repos/marcopopp51200-coder/rok-scanner/contents/icons/city%20skins', { headers: { accept: 'application/vnd.github+json' } });
        if (!r.ok) return;
        list = (await r.json()).map(x => String(x?.name || '')).filter(n => /\.(webp|png|jpe?g)$/i.test(n));
        try { localStorage.setItem('rok_skin_files2', JSON.stringify({ t: Date.now(), list })); } catch {}
      } catch { return; }
    }
    const have = new Set(CITY_SKINS.map(c => c.id));
    list.filter(f => !have.has(f)).forEach(f => CITY_SKINS.push({ id: f, name: f.replace(/\.[a-z]+$/i, '').replace(/\s*\(\d+\)$/, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }));
  })();
  function scFramePicker() {                               // Avatar-Rahmen wählen (mit Suche)
    if (!sc.own) return;
    const w = D().els.avatar, root = document.createElement('div');
    root.className = 'fixed inset-0 z-[85] overflow-y-auto bg-ink-950/85 backdrop-blur-sm ui-fade';
    const ids = Object.keys(AV_FRAMES).sort();
    root.innerHTML = `<div data-bd class="min-h-full grid place-items-center p-4"><div class="panel !bg-ink-900 w-full max-w-4xl rounded-2xl p-5 ui-pop">
      <div class="flex items-center justify-between gap-3 mb-3"><h3 class="font-display text-xl gold-text">Rahmen wählen</h3>
        <button type="button" data-x class="w-9 h-9 rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300">✕</button></div>
      <input data-q type="search" placeholder="Rahmen suchen …" class="mb-3 w-full bg-ink-950 border border-ink-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold-500">
      <div class="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2 max-h-[62vh] overflow-y-auto pr-1">
        <button type="button" data-fr="" class="rounded-xl p-2 border ${!w.frame ? 'border-gold-400 bg-gold-500/15' : 'border-ink-700 hover:border-gold-500/60'} grid place-items-center text-xs text-slate-300 aspect-square">kein Rahmen</button>
        ${ids.map(id => `<button type="button" data-fr="${R.esc(id)}" data-n="${R.esc(avFrameName(id).toLowerCase())}" title="${R.esc(avFrameName(id))}" class="rounded-xl p-1 border ${w.frame === id ? 'border-gold-400 bg-gold-500/15' : 'border-ink-700 hover:border-gold-500/60'}">
          <img src="${avFrameImg(id)}" alt="" loading="lazy" class="w-full aspect-square object-contain"></button>`).join('')}
      </div></div></div>`;
    const close = () => { root.remove(); document.body.style.overflow = ''; };
    root.querySelector('[data-q]').addEventListener('input', (ev) => { const q = ev.target.value.trim().toLowerCase();
      root.querySelectorAll('[data-n]').forEach(b => { b.style.display = !q || b.dataset.n.includes(q) ? '' : 'none'; }); });
    root.addEventListener('click', (ev) => {
      if (ev.target.matches('[data-bd]') || ev.target.closest('[data-x]')) return close();
      const b = ev.target.closest('[data-fr]'); if (!b) return;
      w.frame = b.dataset.fr; close(); drawStage(); drawProps(); scSave(w.frame ? '✓ Rahmen gespeichert' : '✓ Rahmen entfernt');
    });
    document.body.appendChild(root); document.body.style.overflow = 'hidden';
  }
  function scSkinPicker(target) {
    if (!sc.own) return;
    const d = D(), root = document.createElement('div');
    d.xskins = d.xskins || [];
    if (target === 'add' && d.xskins.length >= 6) { UI.alert('Maximal 6 weitere City-Skins.'); return; }
    if (target === 'add' && !d.skin) target = undefined;                 // erster Skin = Haupt-Skin
    const xs = target && target !== 'add' ? d.xskins.find(x => x.id === target) : null, cur = xs ? xs.src : target === 'add' ? '' : d.skin;
    root.className = 'fixed inset-0 z-[85] overflow-y-auto bg-ink-950/85 backdrop-blur-sm ui-fade';
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true');
    root.innerHTML = `<div data-bd class="min-h-full grid place-items-center p-4"><div class="panel !bg-ink-900 w-full max-w-3xl rounded-2xl p-5 ui-pop">
        <div class="flex items-center justify-between gap-3 mb-4">
          <h3 class="font-display text-xl gold-text">City-Skin wählen</h3>
          <button type="button" data-x class="w-9 h-9 shrink-0 rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300" title="Schließen">✕</button>
        </div>
        <input data-q type="search" placeholder="Skin suchen …" class="mb-3 w-full bg-ink-950 border border-ink-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold-500">
        <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          ${CITY_SKINS.map(c => `<button type="button" data-skin="${R.esc(c.id)}" data-n="${R.esc(c.name.toLowerCase())}" class="rounded-xl p-2 border flex flex-col items-center transition ${cur === skinImg(c.id) ? 'border-gold-400 bg-gold-500/15' : 'border-ink-700 hover:border-gold-500/60 hover:bg-ink-800'}">
              <img src="${skinImg(c.id)}" alt="${R.esc(c.name)}" loading="lazy" class="h-28 w-full object-contain">
              ${c.name ? `<span class="mt-1 text-[11px] text-slate-300 truncate max-w-full" translate="no">${R.esc(c.name)}</span>` : ''}</button>`).join('')}
        </div>
        <div class="mt-4 flex flex-wrap items-center justify-between gap-2">
          <span data-info class="text-[11px] text-slate-500">Weitere Skins kommen dazu, sobald sie hinterlegt sind.</span>
          ${cur ? '<button type="button" data-rm class="text-xs px-3 py-2 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10">Skin entfernen</button>' : ''}
        </div>
      </div></div>`;
    const close = () => { document.removeEventListener('keydown', onKey, true); root.remove(); document.body.style.overflow = ''; };
    const onKey = (ev) => { if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); close(); } };
    const apply = (src) => {
      if (target === 'add') {                                     // neuer Skin links neben den bisherigen
        if (src) { const idx = d.xskins.length + (d.els.skin.on && d.skin ? 1 : 0), s0 = d.els.skin.s || 1;
          const n = { ...scElNorm({ on: true }), id: R.newId(), src, s: s0, ...scSkinPos(idx, s0) };
          d.xskins.push(n); sc.sel = 'xs:' + n.id; }
      } else if (xs) { if (src) xs.src = src; else { d.xskins = d.xskins.filter(x => x !== xs); sc.sel = null; } }
      else { d.skin = src; if (src) d.els.skin.on = true; }
      close(); drawStage(); drawEditBar(); scSave(src ? '✓ City-Skin gespeichert' : '✓ City-Skin entfernt');
    };
    root.querySelector('[data-q]').addEventListener('input', (ev) => { const q = ev.target.value.trim().toLowerCase();
      root.querySelectorAll('[data-skin]').forEach(b => { b.style.display = !q || b.dataset.n.includes(q) ? '' : 'none'; }); });
    root.addEventListener('click', (ev) => {
      if (ev.target.matches('[data-bd]') || ev.target.closest('[data-x]')) return close();
      const b = ev.target.closest('[data-skin]'); if (b) return apply(skinImg(b.dataset.skin));
      if (ev.target.closest('[data-rm]')) apply('');
    });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(root); document.body.style.overflow = 'hidden';
  }

  // ---- Mehrere Showcases ----
  R.$('scListBar').addEventListener('change', (ev) => {
    if (ev.target.id !== 'scShow' || !sc.own) return;
    sc.doc.show = ev.target.value; drawListBar();
    scSave(sc.doc.show === 'none' ? '🔒 Showcase ist jetzt privat' : '✓ Sichtbarkeit gespeichert');
  });
  R.$('scListBar').addEventListener('click', (ev) => {
    if (!ev.target.closest('#scDetPriv') || !sc.own) return;
    sc.doc.detPriv = !sc.doc.detPriv; drawListBar();
    scSave(sc.doc.detPriv ? '🔒 Details sind jetzt privat – andere sehen nur das Bild' : '🔓 Details sind jetzt für andere sichtbar');
  });
  R.$('scListBar').addEventListener('click', async (ev) => {
    const doc = sc.doc, b = ev.target.closest('[data-scl]');
    if (b) { doc.active = b.dataset.scl; sc.si = 0; sc.gsel = null; sc.sel = null; drawShowcase(); scFitOnLoad(); if (sc.own) scSaveSoon(); return; }
    if (!sc.own) return;
    if (ev.target.closest('#scNewList')) {
      if (doc.list.length >= SC_MAX_LIST) return;
      const t = await UI.prompt('Name des neuen Showcase:', `Showcase ${doc.list.length + 1}`); if (t == null) return;
      const x = scNorm({ title: t.trim() || `Showcase ${doc.list.length + 1}` }, doc.list.length);
      doc.list.push(x); doc.active = x.id; sc.si = 0; sc.gsel = null; sc.sel = null;
      drawShowcase(); scFitOnLoad(); scSave('✓ Showcase erstellt');
    } else if (ev.target.closest('#scDupList')) {
      const src = D(), c = JSON.parse(JSON.stringify(src)); c.id = R.newId(); c.title = (src.title + ' (Kopie)').slice(0, 30);
      { const mp = {}; c.sets.forEach(x => { const n = R.newId(); mp[x.id] = n; x.id = n; }); c.sets.forEach(x => { x.link = (x.link || []).map(id => mp[id]).filter(Boolean); }); } (c.texts || []).forEach(x => { x.id = R.newId(); }); (c.xskins || []).forEach(x => { x.id = R.newId(); });
      const x = scNorm(c, doc.list.length); doc.list.push(x); doc.active = x.id; sc.si = 0; sc.gsel = null; sc.sel = null;
      drawShowcase(); scFitOnLoad(); scSave('✓ Showcase kopiert');
    } else if (ev.target.closest('#scRefresh')) {
      const act = doc.active, edit = sc.edit; sc.doc = ownShowcase(); if (sc.doc.list.some(x => x.id === act)) sc.doc.active = act;
      sc.edit = edit; sc.si = Math.min(sc.si, D().sets.length - 1); drawShowcase(); scFlowRows(D()); scFitSets(D()); scSave('✓ Showcase aktualisiert');
    } else if (ev.target.closest('#scRenList')) {
      const d = D(), t = await UI.prompt('Neuer Name für den Showcase:', d.title); if (t == null || !t.trim()) return;
      d.title = t.trim().slice(0, 30); drawListBar(); scSave('✓ Umbenannt');
    } else if (ev.target.closest('#scDelList')) {
      const d = D(); if (doc.list.length < 2 || !(await UI.confirm(`Showcase „${d.title}“ wirklich löschen? Das kann nicht rückgängig gemacht werden.`))) return;
      doc.list = doc.list.filter(x => x.id !== d.id); doc.active = doc.list[0].id; if (doc.show === d.id) doc.show = 'all'; sc.si = 0; sc.gsel = null; sc.sel = null;
      drawShowcase(); scSave('🗑 Showcase gelöscht');
    }
  });

  // ---- Sets ----
  R.$('scSetBar').addEventListener('click', async (ev) => {
    const d = D(), b = ev.target.closest('[data-si]');
    if (b) { sc.si = +b.dataset.si; sc.gsel = null; drawShowcase(); return; }
    if (ev.target.closest('#scAddSet')) {
      if (scNormal(d).length >= SC_MAX) return;
      // neues Set kommt auf den nächsten festen Platz (Mitte, rechts, links, …) – Rüstung direkt darunter
      const x = scSetNorm({}); d.sets.push(x);
      const NS = scNormal(d), i = NS.length - 1, first = NS[0][0];
      if (d.gfxAll && first !== x) x.gfx = { ...first.gfx };
      if (i > 0 && first.y != null) { x.y = first.y + Math.floor(i / SC_COLS) * (scSetH(first) + SC_G + scUnderH(first)) * first.s; x.s = first.s; }
      else Object.assign(x, scLayoutPos(d, scH(d)).sp[i]);
      scRecenter(d); scArmUnder(x); scStUnder(x); drawStage(); scFitSets(d);
      sc.si = d.sets.length - 1; sc.gsel = null; if (sc.edit) sc.sel = 'set:' + sc.si;
      drawShowcase(); scSave('✓ Set hinzugefügt');
      R.$('scStage').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const ak = ev.target.closest('[data-addkind]');
    if (ak) {                                                  // Garnison / Rally: nur 2 Kommandanten, unten links / rechts
      const x = scSetNorm({ kind: ak.dataset.addkind }); d.sets.push(x);
      if (d.gfxAll) x.gfx = { ...d.sets[0].gfx };
      { const L = scLayoutPos(d, scH(d)); d.sets.forEach((y, i) => { if (y.kind && L.sp[i]) Object.assign(y, L.sp[i]); }); }
      sc.si = d.sets.length - 1; sc.gsel = null; if (sc.edit) sc.sel = 'set:' + sc.si;
      drawShowcase(); scSave(`✓ ${SC_KIND[x.kind]} hinzugefügt`); return;
    }
    if (ev.target.closest('#scDelSet')) {
      const x = scSet();
      if (!(await UI.confirm(`„${x.kind ? SC_KIND[x.kind] : (x.name || 'Set ' + (sc.si + 1))}“ aus dem Showcase löschen?`))) return;
      d.sets.splice(sc.si, 1); sc.si = Math.max(0, sc.si - 1); sc.gsel = null; sc.sel = null; scRecenter(d);
      drawShowcase(); scSave('🗑 Set gelöscht');
    }
  });
  R.$('scDetailHead').addEventListener('change', (ev) => {
    const t = ev.target.closest('[data-setopt]'); if (!t || !sc.own) return;
    const x = scSet(), i = D().sets.indexOf(x); x[t.dataset.setopt] = t.checked;
    if (t.dataset.setopt === 'heads') { scSnapObj('set:' + i, x); drawStage(); scStack(x); }
    drawStage(); drawDetail(); scSaveSoon();
  });
  R.$('scDetailHead').addEventListener('click', async (ev) => {
    if (!ev.target.closest('#scSetReset') || !sc.own) return;
    const x = scSet(); if (!x) return;
    if (!(await UI.confirm(`↺ „${x.kind ? SC_KIND[x.kind] : (x.name || 'Set ' + (sc.si + 1))}“ zurücksetzen?\n\nNur dieses Set wird geleert: Kommandanten, Ausrüstung, Rüstung und Werte. Andere Sets, Position und Größe bleiben.`))) return;
    const e = scSetNorm({ kind: x.kind });
    Object.assign(x, { cmd: e.cmd, gear: e.gear, arm: { ...e.arm, on: false, x: x.arm.x, y: x.arm.y, s: x.arm.s, r: x.arm.r }, st: { ...x.st, on: false }, cg: e.cg, heads: false, hideEmpty: false });
    sc.gsel = null; drawShowcase(); scSave('↺ Set zurückgesetzt');
  });
  R.$('scDetailHead').addEventListener('input', (ev) => {
    if (ev.target.id !== 'scSetName') return;
    scSet().name = ev.target.value.slice(0, 30); drawStage(); drawSetBar(); scSaveSoon();
  });
  R.$('scDetailHead').addEventListener('click', (ev) => {
    const m = ev.target.closest('[data-scmode]');
    if (m) { scSet().mode = m.dataset.scmode; sc.gsel = null; drawStage(); drawDetail(); scSaveSoon(); return; }
    if (ev.target.closest('#scFromCraft')) scFromCraft();
    if (ev.target.closest('#scPriv')) {
      const x = scSet(); x.priv = !x.priv; drawStage(); drawSetBar(); drawDetail();
      scSave(x.priv ? '🔒 Set ist jetzt privat – andere sehen es nicht' : '🔓 Set ist jetzt für andere sichtbar');
    }
  });
  R.$('scGearTools').addEventListener('click', (ev) => { if (ev.target.closest('#scFromCraft')) scFromCraft(); });
  R.$('scShot').addEventListener('click', async (ev) => {
    if (!ev.target.closest('#scShotDel')) return;
    if (!(await UI.confirm('Screenshot von diesem Set entfernen?'))) return;
    scSet().shot = ''; drawStage(); drawDetail(); scSave('✓ Screenshot entfernt');
  });
  R.$('scShotFile').onchange = async (ev) => {
    const f = ev.target.files?.[0]; ev.target.value = '';
    if (!f || !f.type.startsWith('image/') || !sc.own) return;
    const x = scSet(), d = D();
    scMsg('Lade Screenshot hoch …', 'busy');
    try { x.shot = await scStoreImage(f, `${d.id}_${x.id}_shot`, 1100, 1100); x.mode = 'shot'; drawStage(); drawDetail(); scSave('✓ Screenshot gespeichert'); }
    catch (e) { scMsg(e.message || 'Bild konnte nicht gelesen werden.', 'err'); }
  };
  // ---- Rüstung per Screenshot ("Armament Info": Inschriften + Werte) → /api/scan Modus "armament" ----
  R.$('scArmFile').addEventListener('change', async (ev) => {
    const f = [...(ev.target.files || [])].find(x => x.type.startsWith('image/')); ev.target.value = '';
    if (!f || !sc.own || sc.busy) return;
    sc.busy = true; scMsg('Claude liest deine Rüstung …', 'busy');
    let img = null;
    try {
      img = await R.prepareImage(f);
      const res = await fetch('/api/scan', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: 'armament', images: [{ media_type: img.mediaType, data: img.base64 }] }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 400 && /modus|mode/i.test(data?.error || '')) throw new Error('Der Scan-Server kennt den Rüstungs-Scan noch nicht – bitte die neue api/scan.js hochladen.');
        if (res.status === 404) throw new Error('Server-Route /api/scan nicht gefunden. Die Seite muss über Vercel laufen (nicht als lokale Datei).');
        throw new Error(data?.error || `Serverfehler ${res.status}`);
      }
      const r = R.parseJson(String(data.text || ''));
      if (!r) throw new Error('Die Antwort konnte nicht ausgelesen werden. Bitte erneut versuchen.');
      const x = scSet(), a = JSON.parse(JSON.stringify(x.arm)), seen = new Set(), list = [];   // auf einer Kopie arbeiten → erst nach „Übernehmen“ ersetzen
      (Array.isArray(r.inscriptions) ? r.inscriptions : []).forEach(i => {
        const raw = String(i?.text ?? i?.name ?? '').trim(); if (!raw) return;
        const k = scInscKnown(raw), t = k ? k.t : raw.slice(0, 24), c = k ? k.c : (/gold|gelb|orange/i.test(i?.color) ? 'gold' : /blu|blau|lila|purple/i.test(i?.color) ? 'blue' : 'gray');
        if (seen.has(t.toLowerCase())) return; seen.add(t.toLowerCase()); list.push({ t, c });
      });
      a.insc = scInscSort(list.slice(0, 12));                   // komplett ersetzen
      const fm = String(r.formation || '').trim();
      const fKnown = Object.keys(ARM_FORMATIONS).find(f => f.toLowerCase() === fm.toLowerCase()) || (/zange/i.test(fm) ? 'Pincer' : '');
      const fGuess = Object.entries(ARM_FORMATIONS).map(([f, l]) => [f, l.filter(x => list.some(i => i.t === x.gold || i.t === x.blue)).length]).sort((x, y) => y[1] - x[1])[0];
      a.formation = fKnown || (fGuess && fGuess[1] ? fGuess[0] : fm.slice(0, 30));
      const tr = String(r.troop || '').toLowerCase();
      a.troop = /cav|kav/.test(tr) ? 'cavalry' : /arch|bog/.test(tr) ? 'archer' : /siege|belag/.test(tr) ? 'siege' : /all|alle/.test(tr) ? 'all' : /inf/.test(tr) ? 'infantry' : a.troop;
      const ST = [['atk', 'attack'], ['def', 'defense'], ['hp', 'health'], ['spd', 'march_speed'], ['dmg', 'all_damage']];
      ST.forEach(([k, rk]) => { a[k] = scNum1(r[rk]); });   // neue Werte ersetzen die alten komplett
      const nothing = !list.length && !ST.some(([k]) => a[k] != null);
      const o = x.arm, pct = (v) => v == null ? '<span class="text-slate-500">–</span>' : scPct(v), ins = (l) => l.length ? l.map(i => R.esc(i.t)).join(', ') : '<span class="text-slate-500">–</span>';
      const rows = [{ label: 'Formation', old: R.esc(o.formation || '–'), neu: R.esc(a.formation || '–'), changed: (o.formation || '') !== (a.formation || '') },
        { label: 'Inschriften', old: ins(o.insc), neu: ins(a.insc), changed: o.insc.map(i => i.t).join() !== a.insc.map(i => i.t).join() },
        { label: 'Truppe', old: R.esc(I18N.tr(SC_TROOPS[o.troop])), neu: R.esc(I18N.tr(SC_TROOPS[a.troop])), changed: o.troop !== a.troop },
        ...SC_ARM_STATS.map(([k, l]) => ({ label: l, old: pct(o[k]), neu: pct(a[k]), changed: (o[k] ?? null) !== (a[k] ?? null) }))];
      R.$('scMsg').classList.add('hidden');
      const ok = await scScanPreview({ title: '📷 Rüstung gescannt', img: img?.dataUrl, rows, canApply: !nothing,
        warn: nothing ? '⚠ Auf dem Bild wurde keine Rüstung erkannt – vielleicht ist es die Ausrüstung oder ein anderes Fenster. Bitte einen Screenshot der Rüstung (Armaments) wählen.' : '' });
      if (!ok) { scMsg('Scan verworfen – nichts geändert.', 'warn'); return; }
      Object.assign(x.arm, { insc: a.insc, formation: a.formation, troop: a.troop, arms: a.arms, ...Object.fromEntries(SC_ARM_STATS.map(([k]) => [k, a[k]])) });
      if (!x.arm.on) scArmShow(x);
      if (!x.st.on && scStHas(x.arm)) scStShow(x);
      if (x.syncMode !== 'free') scFitSets(D());
      drawArm(); drawStage();
      await scSave(`✓ Rüstung erkannt: ${list.length} Inschriften` + (r.confidence ? ` · Sicherheit: ${r.confidence}` : ''));
    } catch (e) {
      scMsg(e.message === 'Failed to fetch' ? 'Netzwerkfehler – keine Verbindung zum Scan-Server.' : (e.message || String(e)), 'err');
    } finally { if (img) { img.base64 = null; img.dataUrl = null; } sc.busy = false; }
  });
  // ---- Rüstung ----
  R.$('scArm').addEventListener('toggle', (ev) => { if (ev.target.id === 'scArmBox') scArmOpen = ev.target.open; }, true);
  R.$('scProf')?.addEventListener('toggle', (ev) => { if (ev.target.id === 'scProfBox') scProfOpen = ev.target.open; }, true);
  R.$('scProf')?.addEventListener('change', (ev) => { const t = ev.target, x = scSet(); if (!sc.own || !x || !t.dataset.prof) return;
    if (t.dataset.prof === 'stones') x.prof.stones = t.checked; else x.prof[t.dataset.prof] = t.value; scProfOpen = true; drawProf(); scSaveSoon(); });
  R.$('scProf')?.addEventListener('click', async (ev) => { const x = scSet(); if (!sc.own || !x) return;
    const f = ev.target.closest('[data-prof-flip]'); if (f) { const k = f.dataset.profFlip, v = x.prof.flip[k] || 0; x.prof.flip[k] = v === 0 ? -8 : v === -8 ? 8 : 0; scProfOpen = true; drawProf(); scSaveSoon(); return; }
    if (!ev.target.closest('[data-prof-feed]')) return;
    const msg = R.$('scProf').querySelector('[data-prof-msg]');
    if (!R.feedShareSet) { msg.innerHTML = '<span class="text-amber-300">Feed ist noch nicht geladen.</span>'; return; }
    const note = await UI.prompt(`Charakter-Profil „${x.name || 'Set'}“ im Feed posten.\n\nText dazu (optional):`, '', { title: '📰 Im Feed posten', ok: 'Posten' }); if (note === null) return;
    const gear = Object.fromEntries(R.GEAR_SLOTS.map(sl => { const v = x.gear?.[sl.k], it = R.gItem(v?.item); return [sl.k, v?.item ? { item: v.item, name: it?.name || '', icon: it?.icon || '', rarity: it?.rarity || v.rarity, tier: v.tier || 0, refine: v.refine || 0, refType: v.refType } : null]; }));
    const ctx = scProfCtx(x);
    try { await R.feedShareSet({ name: x.name || 'Set', gear, char: x.prof.char || R.charOf?.(gear, { name: x.name })?.id || '', bg: ctx.bg, arm: ctx.arm, note: note.trim() }); msg.innerHTML = '<span class="text-emerald-300">✓ Im Feed gepostet</span>'; }
    catch (e) { msg.innerHTML = `<span class="text-red-300">⚠ ${R.esc(e.message || String(e))}</span>`; } });
  R.$('scArm').addEventListener('input', (ev) => {
    const t = ev.target, a = scSet().arm;
    if (t.dataset.insc != null && t.dataset.f === 't') a.insc[+t.dataset.insc].t = t.value.slice(0, 24);
    else if (t.dataset.arm === 'formation') a.formation = t.value.slice(0, 30);
    else if (SC_ARM_STATS.some(([k]) => k === t.dataset.arm)) a[t.dataset.arm] = scNum1(t.value);
    else return;
    drawArmSide();
    if (scStHas(a) && !scSet().st.on && a.on) { scStShow(scSet()); drawArm(); }   // erster Wert → Werte auf der Bühne zeigen
    drawStage(); scSaveSoon();
  });
  R.$('scArm').addEventListener('change', (ev) => {
    const t = ev.target, a = scSet().arm, d = D();
    if (t.dataset.arm === 'on') { a.on = t.checked; if (a.on) scArmShow(scSet()); }
    else if (t.dataset.arm === 'ston') { scSet().st.on = t.checked; if (t.checked) scStShow(scSet()); }
    else if (t.dataset.fsep != null) scFmSep(scSet(), d.sets.indexOf(scSet()), t.checked);
    else if (t.dataset.arm === 'troop') a.troop = SC_TROOPS[t.value] ? t.value : 'infantry';
    else if (t.dataset.insc != null && t.dataset.f === 'c') a.insc[+t.dataset.insc].c = SC_INSC[t.value] ? t.value : 'gold';
    else if (t.dataset.arm === 'formsel') { a.formation = t.value; if (t.value && !a.on) scArmShow(scSet()); }
    else if (t.dataset.armpick) {                             // andere Rüstung gewählt → deren gold/blaue Inschrift aus der Liste nehmen
      const old = ARM_BY_ID[a.arms[t.dataset.armpick]];
      if (old) a.insc = a.insc.filter(i => i.t !== old.gold && i.t !== old.blue);
      a.arms[t.dataset.armpick] = t.value;
    }
    else return;
    drawStage(); drawArm(); scSaveSoon();
  });
  R.$('scArm').addEventListener('click', (ev) => {
    const cb = ev.target.closest('[data-armcols]');
    if (cb && sc.own) { scArmCols(scSet(), +cb.dataset.armcols); return; }
    const fpb = ev.target.closest('[data-armfpos]');
    if (fpb && sc.own) { scFmPos(scSet(), D().sets.indexOf(scSet()), fpb.dataset.armfpos); return; }
    const a = scSet().arm, del = ev.target.closest('[data-inscdel]'), chip = ev.target.closest('[data-ins]');
    if (chip) {                                               // Inschrift an/aus – sortiert gold, blau, grau
      const t = chip.dataset.ins, i = a.insc.findIndex(x => x.t.toLowerCase() === t.toLowerCase());
      if (i >= 0) a.insc.splice(i, 1);
      else if (a.insc.length >= 12) { scMsg('Maximal 12 Inschriften.', 'warn'); return; }
      else { a.insc.push({ t, c: chip.dataset.c }); scInscSort(a.insc); }
      if (!a.on) scArmShow(scSet());
      drawArm(); drawStage(); scSaveSoon(); return;
    }
    if (ev.target.closest('#scInscAdd')) { if (a.insc.length < 12) a.insc.push({ t: '', c: 'gold' }); drawArm(); R.$('scArm').querySelector(`[data-insc="${a.insc.length - 1}"][data-f="t"]`)?.focus(); }
    else if (del) { a.insc.splice(+del.dataset.inscdel, 1); drawArm(); drawStage(); scSaveSoon(); }
  });

  // ---- Download: nur die Bühne als PNG ----
  // Eigenen Showcase als Bild (für Feed und Showcases-Seite) – auch wenn das Profil gerade nicht offen ist
  R.showcaseImage = async (opts = {}) => {
    const pv = R.$('profileView'), wasHidden = pv.classList.contains('hidden');
    const sh = R.$('profShowcase'), shHidden = sh.classList.contains('hidden');
    if (wasHidden) { pv.classList.remove('hidden'); pv.style.cssText = 'position:fixed;left:-20000px;top:0;width:1200px;pointer-events:none'; }
    if (shHidden) sh.classList.remove('hidden');
    const wasEdit = sc.edit, wasBar = scBar;
    try {
      if (!sc.own || !sc.doc) renderShowcase(true, null, (R.lastProfileP && R.lastProfileP.stats) || {});
      if (opts.active && sc.doc.list.some((x) => x.id === opts.active)) sc.doc.active = opts.active;
      sc.edit = false; scBar = false; sc.exporting = true; scOpen = true; scApplyOpen(); R.$('scStage').classList.remove('sc-zoom'); drawStage();
      await new Promise((r) => setTimeout(r, 160));
      const h2i = await scLoadH2I(), node = R.$('scStage'), opt = { pixelRatio: opts.pixelRatio || 1.5, backgroundColor: '#07090f', cacheBust: true, style: { margin: '0' }, quality: 0.86 };
      const f = opts.jpeg ? h2i.toJpeg : h2i.toPng;
      let url; try { url = await f(node, opt); } catch { url = await f(node, { ...opt, skipFonts: true }); }
      return { url, title: D().title, id: D().id };
    } finally {
      sc.exporting = false; sc.edit = wasEdit; scBar = wasBar; drawStage(); scZoomApply();
      if (shHidden) sh.classList.add('hidden');
      if (wasHidden) { pv.classList.add('hidden'); pv.style.cssText = ''; }
    }
  };
  R.ownShowcase = ownShowcase;
  R.showcaseList = () => { try { return ownShowcase().list.map((x) => ({ id: x.id, title: x.title, sets: x.sets })); } catch { return []; } };
  let scH2I = null;
  const scLoadH2I = () => scH2I || (scH2I = new Promise((resolve, reject) => {
    if (window.htmlToImage) return resolve(window.htmlToImage);
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js';
    s.onload = () => window.htmlToImage ? resolve(window.htmlToImage) : reject(new Error('Download-Bibliothek konnte nicht geladen werden.'));
    s.onerror = () => { scH2I = null; reject(new Error('Download-Bibliothek konnte nicht geladen werden (Internet/Adblocker prüfen).')); };
    document.head.appendChild(s);
  }));
  // Ein beliebiges Element als PNG herunterladen (Charakter Showcase)
  R.downloadNode = async (node, name) => { const h2i = await scLoadH2I(), opt = { pixelRatio: 2, backgroundColor: '#07090f', cacheBust: true, style: { margin: '0' }, filter: (n) => !(n.dataset && n.dataset.ptk) };
    let url; try { url = await h2i.toPng(node, opt); } catch { url = await h2i.toPng(node, { ...opt, skipFonts: true }); }
    const a = document.createElement('a'); a.href = url; a.download = `${String(name || 'charakter').replace(/[^\wäöüÄÖÜß-]+/g, '_')}.png`; document.body.appendChild(a); a.click(); a.remove(); };
  R.$('scDl').onclick = async () => {
    if (!sc.own) return;
    const btn = R.$('scDl'), wasEdit = sc.edit;
    btn.disabled = true; btn.classList.add('opacity-50');
    scOpen = true; scApplyOpen();
    try {
      const h2i = await scLoadH2I();
      sc.edit = false; sc.exporting = true; R.$('scStage').classList.remove('sc-zoom'); drawStage();
      await new Promise(r => setTimeout(r, 120));
      const node = R.$('scStage'), opt = { pixelRatio: 2, backgroundColor: '#07090f', cacheBust: true, style: { margin: '0' } };
      let url;
      try { url = await h2i.toPng(node, opt); } catch { url = await h2i.toPng(node, { ...opt, skipFonts: true }); }
      const a = document.createElement('a');
      a.href = url; a.download = `showcase-${(D().title || 'showcase').replace(/[^\wäöüÄÖÜß-]+/g, '_')}.png`;
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e) { scMsg(e.message || 'Download fehlgeschlagen.', 'err'); }
    finally { sc.exporting = false; sc.edit = wasEdit; drawStage(); scZoomApply(); btn.disabled = false; btn.classList.remove('opacity-50'); }
  };

  // ---- Ausrüstung bearbeiten ----
  R.$('scGearBoard').addEventListener('click', (ev) => {
    const t = ev.target.closest('[data-sctile]'); if (!t || !sc.own) return;
    sc.gsel = sc.gsel === t.dataset.sctile ? null : t.dataset.sctile; drawShowcase();
  });
  const scGearEdit = (ev) => {
    const t = ev.target.closest('[data-slot]'); if (!t || t.disabled || !sc.own) return;
    const isBtn = t.tagName === 'BUTTON';
    if (ev.type === 'click' && !isBtn) return;
    if (ev.type === 'change' && isBtn) return;
    if (R.gearPickEvent(t)) { drawShowcase(); return; }
    const v = scSet().gear[t.dataset.slot];
    if (t.dataset.f === 'clear') { v.item = ''; scSnap(v, null); v.tier = 0; v.refine = 0; }
    else if (t.dataset.f === 'refset') { if (t.dataset.v) { v.refType = R.gRefType(t.dataset.v); if (!v.refine) v.refine = 100; } else v.refine = 0; }
    else if (t.dataset.f === 'item') { v.item = t.dataset.v ?? t.value; const it = R.gItem(t.value); v.rarity = it ? it.rarity : 'legendary'; scSnap(v, it); v.tier = 0; v.refine = 0; }
    else if (t.dataset.f === 'tier' && (R.gItem(v.item)?.rarity || v.rarity) !== 'legendary') v.tier = 0;   // Iconic nur bei legendären Items
    else if (t.dataset.f === 'refine') v.refine = R.gRefine(t.dataset.v);
    else if (t.dataset.f === 'refType') v.refType = R.gRefType(t.dataset.v);
    else v.tier = R.gTier(t.value);
    drawShowcase(); scSaveSoon();
  };
  R.$('scGearEdit').addEventListener('change', scGearEdit);
  R.$('scGearEdit').addEventListener('click', scGearEdit);
  R.$('scGearTools').addEventListener('toggle', (ev) => {
    if (ev.target.id === 'scGearTools') { scGearOpen = ev.target.open; try { localStorage.setItem('rok_sc_gear_open', scGearOpen ? '1' : '0'); } catch {} }
    else if (ev.target.id === 'scGfxBox') scGfxOpen = ev.target.open;
  }, true);
  const scGfxRedraw = () => { scDrawGearBoard(scSet()); drawStage(); };
  R.boardStyleHooks = R.boardStyleHooks || []; R.boardStyleHooks.push(() => { try { if (scSet()?.mode === 'manual' && R.$('scGearBoard')) scDrawGearBoard(scSet()); } catch {} });
  const scGfxSpread = () => { const d = D(), x = scSet(); if (d.gfxAll) d.sets.forEach(y => { if (y !== x) y.gfx = { ...x.gfx }; }); };   // „Für alle Sets gleich“
  R.$('scGearFx').addEventListener('change', async (ev) => {
    if (!sc.own) return;
    if (ev.target.id === 'scGfxPt') { scSet().gfx.pt = ev.target.checked; scGfxSpread(); drawDetail(); drawStage(); scSaveSoon(); return; }
    if (ev.target.id === 'scGfxSync') {
      if (ev.target.checked && D().sets.length > 1 && !(await UI.confirm('Rahmen- und Symbol-Einstellungen dieses Sets auf alle Sets dieses Showcase übertragen und ab jetzt gemeinsam ändern?'))) { ev.target.checked = false; return; }
      D().gfxAll = ev.target.checked; scGfxSpread(); drawDetail(); drawStage(); scSave(ev.target.checked ? '✓ Gilt jetzt für alle Sets' : '✓ Wieder pro Set einstellbar');
    }
  });
  R.$('scGearFx').addEventListener('input', (ev) => {
    const t = ev.target.closest('[data-gfx]'); if (!t || !sc.own) return;
    const k = t.dataset.gfx, fx = scSet().gfx, z = SC_GFX_SL.find(q => q[0] === k), p = scInt(t.value, 0, 100, 50);
    fx[k] = scGfxFromPos(z, p);
    const lab = R.$('scGearFx').querySelector(`[data-gfxv="${k}"]`); if (lab) { lab.textContent = p; lab.className = `w-10 text-right tabular-nums ${p === 50 ? 'text-slate-500' : 'text-gold-300'}`; }
    scGfxSpread();
    if (k === 'fh') R.$('scGearFx').querySelectorAll('[data-gfc="gold"] .gdia').forEach(e => { if (/radial-gradient\(120%/.test(e.style.background)) e.style.background = gFace('legendary', fx.fh); });
    scGfxRedraw(); scSaveSoon();
  });
  R.$('scGearFx').addEventListener('click', async (ev) => {
    if (!sc.own) return;
    const x = scSet(), b = ev.target.closest('[data-gfr]');
    if (b) { x.gfx[b.dataset.gfc === 'purple' ? 'fp' : 'fr'] = b.dataset.gfr; scGfxSpread(); drawDetail(); drawStage(); scSave('✓ Rahmen gespeichert'); return; }
    if (ev.target.closest('#scGfxReset')) { const g = x.gfx; x.gfx = { ...g, rs: SC_GFX_DEF.rs, rx: SC_GFX_DEF.rx, ry: SC_GFX_DEF.ry, ts: SC_GFX_DEF.ts, tx: SC_GFX_DEF.tx, ty: SC_GFX_DEF.ty }; scGfxSpread(); drawDetail(); drawStage(); scSaveSoon(); return; }
    if (ev.target.closest('#scGfxResetF')) { const g = x.gfx; x.gfx = { ...g, fr: '', fp: '', pt: true, fs: 100, fw: 50, fh: 0 }; scGfxSpread(); drawDetail(); drawStage(); scSave('✓ Rahmen zurückgesetzt'); return; }
    if (ev.target.closest('#scGfxAll')) {
      if (!(await UI.confirm('Rahmen und Symbol-Einstellungen dieses Sets auf alle Sets aller Showcases übertragen?'))) return;
      sc.doc.list.forEach(l => l.sets.forEach(y => { y.gfx = { ...x.gfx }; })); drawDetail(); drawStage(); scSave('✓ Für alle Sets übernommen');
    }
  });
  // ---- Inhalt eines anderen Sets übernehmen (Kommandanten, Ausrüstung, Rüstung, Abstand) ----
  function scCopyOptions(cur) {
    const groups = sc.doc.list.map(l => [l, l.sets.map((s, i) => [s, i]).filter(([s]) => s !== cur)]).filter(([, a]) => a.length);
    if (!groups.length) return '';
    const many = sc.doc.list.length > 1;
    return `<select id="scCopyFrom" class="text-xs px-3 py-2 rounded-lg border border-ink-600 bg-ink-950 hover:border-gold-500/60 focus:outline-none focus:border-gold-500" title="Inhalt eines anderen Sets übernehmen">
      <option value="">⇢ Aus Set übernehmen …</option>
      ${groups.map(([l, a]) => `${many ? `<optgroup label="${R.esc(l.title)}">` : ''}${a.map(([s, i]) => `<option value="${R.esc(l.id)}|${R.esc(s.id)}">${R.esc(s.name || 'Set ' + (i + 1))}</option>`).join('')}${many ? '</optgroup>' : ''}`).join('')}
    </select>`;
  }
  async function scCopyFrom(val) {
    const [lid, sid] = String(val).split('|'), src = sc.doc.list.find(l => l.id === lid)?.sets.find(s => s.id === sid), x = scSet();
    const srcName = src ? (src.name || 'Set ' + (sc.doc.list.find(l => l.id === lid).sets.indexOf(src) + 1)) : '';
    if (!src || !x || src === x) return;
    const filled = x.cmd.some(Boolean) || R.GEAR_SLOTS.some(sl => scItem(x.gear[sl.k]));
    if (filled && !(await UI.confirm(`Kommandanten und Ausrüstung von „${x.name || 'diesem Set'}“ mit „${srcName}“ überschreiben?`))) { drawDetail(); return; }
    const c = JSON.parse(JSON.stringify(src));
    Object.assign(x, { cmd: c.cmd, gear: c.gear, gfx: D().gfxAll ? x.gfx : c.gfx, arm: { ...c.arm, x: x.arm.x, y: x.arm.y, s: x.arm.s }, st: { ...c.st, x: x.st.x, y: x.st.y, s: x.st.s }, cg: c.cg, heads: false });
    drawStage(); if (scArmBlk(x.arm)) { scArmUnder(x, true); drawStage(); } if (x.st.on && scStHas(x.arm)) scStUnder(x, true);   // untereinander: Gear → Rüstung → Werte
    if (x.arm.fsep) { drawStage(); scFmPlace(x, D().sets.indexOf(x)); }
    if (!x.kind) scSyncAfter(D(), 'set:' + D().sets.indexOf(x));
    sc.gsel = null; drawShowcase(); scSave(`✓ Übernommen aus „${srcName}“`);
  }
  R.$('scGearTools').addEventListener('change', (ev) => { if (ev.target.id === 'scCopyFrom' && ev.target.value) scCopyFrom(ev.target.value); });
  // ---- Verbindung zum Crafting-Planer: Sets aller eigenen Showcases lesen und Ausrüstung hineinschreiben ----
  const scOwnDoc = () => (sc.own && sc.doc) ? sc.doc : ownShowcase();
  R.scGearSets = () => scOwnDoc().list.flatMap(s => s.sets.map((x, i) => ({ scId: s.id, scTitle: s.title, setId: x.id,
    setName: x.kind ? SC_KIND[x.kind] : (x.name || 'Set ' + (i + 1)), gear: JSON.parse(JSON.stringify(x.gear)) })));
  R.scGetArm = (scId, setId) => { const x = scOwnDoc().list.find(s => s.id === scId)?.sets.find(y => y.id === setId); return x?.arm ? JSON.parse(JSON.stringify(x.arm)) : null; };
  // ---- für den Reiter „🧍 Charakter Showcase“ (showcases.js): alle eigenen Sets mit Profil-Einstellungen ----
  R.scProfSets = () => scOwnDoc().list.flatMap(sh => sh.sets.filter(x => !x.kind || x.gearOn).map((x, i) => ({ scId: sh.id, scTitle: sh.title, setId: x.id,
    name: x.kind ? SC_KIND[x.kind] : (x.name || 'Set ' + (i + 1)), gear: JSON.parse(JSON.stringify(x.gear)), arm: JSON.parse(JSON.stringify(x.arm)), prof: JSON.parse(JSON.stringify(x.prof)) })));
  R.scProfCtxOf = (p, edit) => ({ pick: p.prof.char, name: p.name, bg: { k: p.prof.bg }, lines: p.prof.lines, arm: { ...p.arm, flip: p.prof.flip, scene: p.prof.stones, order: p.prof.order }, adj: { bgY: p.prof.bgY, chY: p.prof.chY, chS: p.prof.chS, pts: p.prof.pts }, edit: !!edit });
  // Charakter-Bild mit den echten Showcase-Kacheln (Rahmen, Expertise, Refine-Symbol, Iconic wie im Showcase)
  R.scBoardFor = (gear, gfx, ctx) => { try { const g = scGearNorm(gear || {}); return scGearBoard(g, true, false, gfx ? scGfxNorm(gfx) : null, ctx); } catch (e) { console.warn(e); return R.charBoardHTML(gear, ctx); } };
  // Rahmen/Partikel fürs Charakter-Bild: Showcase-Einstellung des Sets + eigene Wahl aus dem Charakter Showcase
  const scProfGfx = (x) => scGfxNorm({ ...(x.gfx || {}), ...(x.prof?.gfx || {}) });
  R.scGfxOf = (scId, setId) => { const x = scOwnDoc().list.find(s => s.id === scId)?.sets.find(y => y.id === setId); return x ? JSON.parse(JSON.stringify(scProfGfx(x))) : null; };
  // Auswahl der Expertise-Rahmen (Gold + Lila) und Partikel für den Charakter Showcase
  R.scProfGfxHtml = (scId, setId) => { const x = scOwnDoc().list.find(s => s.id === scId)?.sets.find(y => y.id === setId); if (!x) return '';
    const fx = scProfGfx(x), own = x.prof?.gfx || {};
    const tile = (f, on, c, key) => { const face = c === 'purple' ? gFace('epic') : gFace('legendary', fx.fh);
      const inner = f === 'css' ? `<span class="gdia absolute inset-0" style="background:${GOLD_RIM}"></span><span class="gdia absolute inset-[4px]" style="background:${face}"></span>`
        : f === 'none' ? `<span class="gdia absolute inset-0" style="background:${c === 'purple' ? R.GFILL.epic[0] : R.GFILL.legendary[0]}"></span><span class="gdia absolute inset-[2px]" style="background:${face}"></span>`
        : `<span class="gdia absolute" style="inset:10%;background:${face}"></span>${gfImg(f, 'absolute inset-0 w-full h-full max-w-none', '')}${fx.pt && c === 'gold' ? gfParticles('inset:0;width:100%;height:100%') : ''}`;
      const lbl = f === 'css' ? 'Glitzer-Rand' : f === 'none' ? 'Kein Rahmen' : f.id.replace(/^frame-/, '').replace(/-/g, ' ');
      return `<button type="button" data-scp-gfr="${R.esc(key)}" data-scp-gfc="${c}" aria-pressed="${on}" title="${R.esc(lbl)}" class="relative w-12 h-12 rounded-lg border-2 ${on ? 'border-gold-400 bg-gold-500/15' : 'border-ink-600 hover:border-gold-500/60'}"><span class="absolute inset-1">${inner}</span></button>`; };
    const cur = (v, c) => v === 'css' || v === 'none' ? v : (gfById(v) || gfList(c)[0])?.id || 'css';
    const row = (c, v) => [...gfList(c).map(f => tile(f, v === f.id, c, f.id)), tile('css', v === 'css', c, 'css'), tile('none', v === 'none', c, 'none')].join('');
    return `<div class="text-[10px] uppercase tracking-widest text-orange-300">Gold · legendäre Items</div><div class="mt-1 flex flex-wrap gap-1.5">${row('gold', cur(fx.fr, 'gold'))}</div>
      <label class="mt-2 inline-flex items-center gap-2 cursor-pointer"><input type="checkbox" data-scp-gpt ${fx.pt ? 'checked' : ''} class="w-4 h-4 accent-yellow-500">✨ Glitzer-Partikel bei Gold-Rahmen</label>
      <div class="mt-2 text-[10px] uppercase tracking-widest text-purple-300">Lila · epische Items</div><div class="mt-1 flex flex-wrap gap-1.5">${row('purple', cur(fx.fp, 'purple'))}</div>
      <p class="mt-1 text-[10px] text-slate-500">Rahmen erscheinen bei Items mit Expertise (fertig refined). ${Object.keys(own).length ? 'Eigene Wahl für dieses Bild.' : 'Aktuell wie im ⚔️ Gear Showcase.'}</p>`; };
  R.scCharBoard = (scId, setId, ctx) => { const x = scOwnDoc().list.find(s => s.id === scId)?.sets.find(y => y.id === setId); if (!x) return '';
    try { return scGearBoard(x.gear, true, false, scProfGfx(x), ctx); } catch (e) { console.warn(e); return R.charBoardHTML(x.gear, ctx); } };
  R.scProfPut = async (scId, setId, patch) => {
    const live = !!(sc.own && sc.doc), doc = scOwnDoc(), x = doc.list.find(s => s.id === scId)?.sets.find(y => y.id === setId); if (!x) return false;
    x.prof = scProfNorm({ ...x.prof, ...patch, flip: { ...x.prof.flip, ...(patch.flip || {}) }, gfx: patch.gfx === null ? {} : { ...(x.prof.gfx || {}), ...(patch.gfx || {}) }, pts: patch.pts === null ? {} : { ...x.prof.pts, ...(patch.pts || {}) } });
    if (live) { scSaveSoon(); return true; }
    doc.updated = Date.now(); R.LS.set(SC_KEY, JSON.stringify(doc)); try { await RokAuth.saveShowcase(scPublicDoc(doc)); } catch {} return true;
  };
  R.scPutGear = async (scId, setId, slots, label) => {
    const live = !!(sc.own && sc.doc), doc = scOwnDoc();
    const x = doc.list.find(s => s.id === scId)?.sets.find(y => y.id === setId); if (!x) return false;
    R.GEAR_SLOTS.forEach(sl => { const v = { item: '', rarity: 'legendary', tier: 0, refine: 0, refType: 'infantry', ...(slots[sl.k] || {}) };
      const it = R.gItem(v.item); scSnap(v, it); x.gear[sl.k] = scGearNorm({ [sl.k]: v })[sl.k]; });
    const msg = `✓ Ausrüstung aus dem Planer übernommen${label ? ` („${label}“)` : ''}`;
    if (live) { if (R.view === 'profile') drawShowcase(); await scSave(msg, true); return true; }
    doc.updated = Date.now(); R.LS.set(SC_KEY, JSON.stringify(doc));           // Showcase gerade nicht offen → im Account speichern …
    try { await RokAuth.saveShowcase(scPublicDoc(doc)); } catch {}              // … und die öffentliche Fassung aktualisieren
    return true;
  };
  async function scFromCraft() {
    const s = R.activeSet();
    if (R.GEAR_SLOTS.some(sl => scItem(scSet().gear[sl.k])) && !(await UI.confirm(`Showcase-Ausrüstung mit der Ist-Ausrüstung aus „${s.name}“ überschreiben?`))) return;
    R.GEAR_SLOTS.forEach(sl => { const v = { ...s.ist[sl.k] }; scSnap(v, R.gItem(v.item)); scSet().gear[sl.k] = v; });
    drawShowcase(); scSave(`✓ Ausrüstung aus „${s.name}“ übernommen`);
  }
  // ---- Scan-Vorschau: Screenshot + was erkannt wurde (alt → neu), erst nach „Übernehmen“ wird ersetzt ----
  function scScanPreview({ title, img, rows, warn, canApply = true }) {
    return new Promise((resolve) => {
      const root = document.createElement('div');
      root.className = 'fixed inset-0 z-[90] overflow-y-auto bg-ink-950/85 backdrop-blur-sm ui-fade';
      const nCh = rows.filter(r => r.changed).length;
      root.innerHTML = `<div class="min-h-full grid place-items-center p-4"><div class="panel !bg-ink-900 w-full max-w-4xl rounded-2xl p-5 ui-pop">
        <div class="flex items-center justify-between gap-3 mb-3"><h3 class="font-display text-xl gold-text">${R.esc(title)}</h3>
          <button type="button" data-x class="w-9 h-9 shrink-0 rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300">✕</button></div>
        ${warn ? `<div class="mb-3 rounded-lg border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">${warn}</div>` : ''}
        <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] items-start">
          <div><div class="mb-1 text-[10px] uppercase tracking-widest text-slate-500">Gescanntes Bild</div>
            ${img ? `<img src="${img}" alt="" class="w-full max-h-[55vh] object-contain rounded-lg border border-ink-700 bg-black">` : '<div class="text-slate-500 text-sm">–</div>'}</div>
          <div><div class="mb-1 text-[10px] uppercase tracking-widest text-slate-500">Erkannt · ${nCh} Änderung${nCh === 1 ? '' : 'en'}</div>
            <div class="rounded-lg border border-ink-700 divide-y divide-ink-700 text-xs">
              ${rows.map(r => `<div class="grid grid-cols-[5.5rem_minmax(0,1fr)_minmax(0,1fr)] gap-2 items-center px-2.5 py-1.5 ${r.changed ? 'bg-gold-500/10' : 'opacity-60'}">
                <span class="text-slate-400">${r.label}</span><span class="min-w-0 overflow-hidden whitespace-nowrap ${r.changed ? 'line-through text-slate-500' : ''}">${r.old}</span><span class="min-w-0 flex items-center gap-1 overflow-hidden whitespace-nowrap ${r.changed ? 'text-gold-200 font-semibold' : ''}">${r.changed ? '<span class="shrink-0">→</span>' : ''}<span class="min-w-0 flex-1 overflow-hidden">${r.neu}</span></span></div>`).join('')}
            </div>
            <p class="mt-2 text-[11px] text-slate-500">Mit „Übernehmen“ wird alles ersetzt, auch was vorher eingetragen war. Danach lässt sich alles von Hand ändern.</p></div>
        </div>
        <div class="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" data-x class="px-4 py-2.5 rounded-lg border border-ink-600 hover:border-gold-500/60 hover:text-gold-300 text-sm">Abbrechen</button>
          ${canApply ? '<button type="button" data-ok class="px-5 py-2.5 rounded-lg font-semibold text-sm bg-gold-500 hover:bg-gold-400 text-ink-950">✓ Übernehmen</button>' : ''}
        </div></div></div>`;
      const done = (v) => { root.remove(); document.removeEventListener('keydown', key); resolve(v); };
      const key = (e) => { if (e.key === 'Escape') done(false); };
      root.addEventListener('click', (e) => { if (e.target.closest('[data-ok]')) done(true); else if (e.target.closest('[data-x]') || e.target === root.firstElementChild) done(false); });
      document.addEventListener('keydown', key);
      document.body.appendChild(root); I18N.apply?.(root);
    });
  }
  const scPrevGear = (v) => { const it = scItem(v); if (!it) return '<span class="text-slate-500">– leer –</span>';
    return `<span class="flex items-center gap-1.5 min-w-0">${it.icon ? `<img src="${it.icon}" alt="" class="w-6 h-6 object-contain shrink-0">` : ''}<span class="truncate min-w-0">${R.esc(it.name)}</span>${v.tier ? `<span class="text-gold-300 shrink-0">${R.ROMAN[v.tier - 1]}</span>` : ''}${v.refine >= 100 ? '<span class="text-red-300 shrink-0">✦</span>' : ''}</span>`; };
  const scPrevKey = (v) => { const it = scItem(v); return it ? [it.name, v.tier, v.refine, v.refType].join('|') : ''; };
  const scPrevCmd = (c) => { const m = c && CMD_BY_ID[c.id]; return m ? `${R.esc(m.name)}${c.exp ? ' ⭐' : ''}` : '<span class="text-slate-500">–</span>'; };
  // Screenshot der Ausrüstung → /api/scan (Modus "gear", wie im Crafting-Planer)
  R.$('scFile').onchange = async (ev) => {
    const files = [...(ev.target.files || [])].filter(f => f && f.type.startsWith('image/')).slice(0, 2);
    ev.target.value = '';
    if (!files.length || sc.busy) return;
    sc.busy = true; scOpen = true; scApplyOpen();
    R.$('scScanLbl')?.classList.add('opacity-50', 'pointer-events-none');
    scMsg('Claude liest Ausrüstung und Kommandanten und gleicht sie mit deinen Bildern ab …', 'busy');
    const imgs = [];
    try {
      if (R.gearDbState === 'idle' || !R.gearCat.length) await R.loadGearDb();
      for (const f of files) imgs.push(await R.prepareImage(f));
      const res = await fetch('/api/scan', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: 'gear', images: imgs.map(i => ({ media_type: i.mediaType, data: i.base64 })), refs: await scanRefs(['gear', 'gear2', 'commanders']) }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 400 && /modus|mode/i.test(data?.error || '')) throw new Error('Der Scan-Server kennt den Ausrüstungs-Scan noch nicht – bitte den Modus „gear“ in api/scan.js ergänzen. Bis dahin die Slots von Hand wählen.');
        if (res.status === 404) throw new Error('Server-Route /api/scan nicht gefunden. Die Seite muss über Vercel laufen (nicht als lokale Datei).');
        if (res.status === 413) throw new Error('Die Bilder sind zu groß. Bitte weniger Screenshots auf einmal hochladen.');
        throw new Error(data?.error || `Serverfehler ${res.status}`);
      }
      const r = R.parseJson(String(data.text || ''));
      if (!r) throw new Error('Die Antwort konnte nicht ausgelesen werden. Bitte erneut versuchen.');
      const src = r.slots || r.equipment || r; let hit = 0, seen = 0;
      const x = scSet(), neu = scGearNorm({});                    // komplett neu: was nicht erkannt wird, bleibt leer
      R.GEAR_SLOTS.forEach(sl => {
        const info = src[sl.k]; if (!info || typeof info !== 'object') return;
        seen++;
        const byRef = R.gearByRef(sl.cat, info);
        if (byRef?.reject) return;                                // lieber leer lassen als ein Item in der falschen Farbe
        let it = byRef && !byRef.file ? byRef : (info.item_id ? R.gItem(String(info.item_id)) : null);
        if (it && it.cat !== sl.cat && !it.lib) it = null;
        if (!it && !byRef) it = R.gearMatch(sl.cat, info);
        const base = { tier: R.gTier(info.tier), refine: R.gScanRefine(info), refType: R.gRefType(info.refine_type) };
        if (it) { const v = { item: it.id, rarity: it.rarity || R.gearRarity(info.rarity) || 'legendary', ...base }; scSnap(v, it); neu[sl.k] = v; hit++; }
        else if (byRef?.file) {                                  // Bild erkannt, aber (noch) nicht in gear_items → Bild + Name direkt übernehmen
          neu[sl.k] = { item: '', name: gearFileName(byRef.file), icon: `/icons/gear/${byRef.file}.webp`, rarity: R.gearRarity(info.rarity) || gearFileRar(byRef.file), ...base }; hit++;
        }
        if (neu[sl.k].item && (R.gItem(neu[sl.k].item)?.rarity || neu[sl.k].rarity) !== 'legendary') neu[sl.k].tier = 0;   // Iconic nur legendär
      });
      const cmds = (Array.isArray(r.commanders) ? r.commanders : []).map(cmdFromScan).filter(Boolean).slice(0, 2);
      const newCmd = cmds.length ? [cmds[0] || null, cmds[1] || null] : x.cmd;
      const rows = [0, 1].map(i => ({ label: i ? 'Kommandant 2' : 'Kommandant 1', old: scPrevCmd(x.cmd[i]), neu: scPrevCmd(newCmd[i]), changed: (x.cmd[i]?.id || '') + !!x.cmd[i]?.exp !== (newCmd[i]?.id || '') + !!newCmd[i]?.exp }))
        .concat(R.GEAR_SLOTS.map(sl => ({ label: sl.label, old: scPrevGear(x.gear[sl.k]), neu: scPrevGear(neu[sl.k]), changed: scPrevKey(x.gear[sl.k]) !== scPrevKey(neu[sl.k]) })));
      const nothing = !hit && !cmds.length;
      scMsg('', 'ok'); R.$('scMsg').classList.add('hidden');
      const ok = await scScanPreview({ title: '📷 Ausrüstung gescannt', img: imgs[0]?.dataUrl, rows, canApply: !nothing,
        warn: nothing ? '⚠ Auf dem Bild wurde keine Ausrüstung erkannt – vielleicht ist es eine Rüstung, ein Kommandanten- oder ein anderes Fenster. Bitte einen Screenshot der Ausrüstung wählen.'
          : hit < seen ? `⚠ ${seen - hit} Slot(s) nicht sicher erkannt – sie bleiben leer und lassen sich von Hand wählen.` : '' });
      if (!ok) { scMsg('Scan verworfen – nichts geändert.', 'warn'); return; }
      x.gear = neu; if (cmds.length) x.cmd = newCmd;
      if (x.syncMode !== 'free') scFitSets(D());
      drawShowcase();
      await scSave(`✓ ${hit} von ${seen} Slots erkannt` + (cmds.length ? ` · Kommandant${cmds.length > 1 ? 'en' : ''}: ${cmds.map(c => CMD_BY_ID[c.id].name + (c.exp ? ' ⭐' : '')).join(' & ')}` : ''));
    } catch (e) {
      scMsg(e.message === 'Failed to fetch' ? 'Netzwerkfehler – keine Verbindung zum Scan-Server.' : (e.message || String(e)), 'err');
    } finally {
      imgs.forEach(i => { i.base64 = null; i.dataUrl = null; }); imgs.length = 0;   // Bilder sofort verwerfen
      sc.busy = false; R.$('scScanLbl')?.classList.remove('opacity-50', 'pointer-events-none');
    }
  };

  // ---- Kommandanten-Fenster ----
  let cm = { exp: true, slot: 0, rar: 'all', q: '', sel: null, level: 60, skills: [5, 5, 5, 5], awakened: false };
  const openModal = () => { R.$('cmdModal').classList.remove('hidden'); document.body.style.overflow = 'hidden'; };
  const closeModal = () => { R.$('cmdModal').classList.add('hidden'); document.body.style.overflow = ''; };
  function openCmd(i) {
    const cur = scSet().cmd[i];
    if (!sc.own) { if (cur) showCmdView(cur); return; }
    cm = { slot: i, rar: cm.rar || 'all', q: '', sel: cur?.id || null, exp: cur ? !!cur.exp : !!cm.exp, level: cur?.level ?? 60, skills: cur ? [...cur.skills] : [5, 5, 5, 5], awakened: !!cur?.awakened };
    if (cm.sel && cm.rar !== 'all' && CMD_BY_ID[cm.sel].r !== cm.rar) cm.rar = 'all';
    R.$('cmdTitle').textContent = `Kommandant wählen · ${SC_SLOTS[i]}`;
    R.$('cmdPick').classList.remove('hidden'); R.$('cmdView').classList.add('hidden');
    R.$('cmdSearch').value = ''; R.$('cmdSearch').classList.toggle('hidden', !COMMANDERS.some(c => c.name));
    drawCmdPicker(); openModal();
    R.$('cmdGrid').querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest' });
  }
  function drawCmdPicker() {
    R.$('cmdRar').innerHTML = [['all', 'Alle'], ...Object.entries(SC_RAR).map(([k, r]) => [k, r.label])].map(([k, l]) =>
      `<button type="button" data-cr="${k}" aria-pressed="${cm.rar === k}" class="seg-btn rounded-lg px-3 py-1.5 text-xs font-semibold transition">${l}</button>`).join('');
    const other = scSet().cmd[1 - cm.slot]?.id, q = scKey(cm.q);
    const list = COMMANDERS.filter(c => (cm.rar === 'all' || c.r === cm.rar) && (!q || scKey(c.name).includes(q) || scKey(I18N.tr(c.name)).includes(q)) && (!cm.exp || c.ex));
    R.$('cmdGrid').innerHTML = list.length ? list.map(c => {
      const used = c.id === other, on = c.id === cm.sel;
      return `<button type="button" data-cid="${c.id}" aria-pressed="${on}" ${used ? 'disabled' : ''} title="${R.esc(c.name)}${used ? ' – schon im anderen Slot' : ''}"
          class="relative rounded-xl p-1 transition ${on ? 'bg-gold-500/25 ring-2 ring-gold-400' : 'hover:bg-ink-800'} ${used ? 'opacity-30 cursor-not-allowed' : ''}">
        <img src="${cmdImg(c.id, cm.exp)}" alt="${R.esc(c.name)}" loading="lazy" class="w-full aspect-square object-contain">
        ${c.name ? `<span class="block mt-0.5 text-[10px] text-slate-300 truncate">${R.esc(c.name)}</span>` : ''}
      </button>`; }).join('') : '<div class="col-span-full py-8 text-center text-sm text-slate-500">Keine Kommandanten gefunden.</div>';
    drawCmdForm();
  }
  function drawCmdForm() {
    R.$('cmdForm').innerHTML = `<div class="flex flex-wrap items-center justify-between gap-2">
      <span class="text-xs text-slate-500">Kommandant antippen zum Übernehmen</span>
      <div class="grid grid-cols-2 gap-1 p-1 rounded-xl bg-ink-950 border border-ink-700" role="group" aria-label="Expertise">
        <button type="button" data-cmexp="1" aria-pressed="${!!cm.exp}" class="seg-btn rounded-lg px-3 py-1.5 text-xs font-semibold transition">⭐ Expertise</button>
        <button type="button" data-cmexp="0" aria-pressed="${!cm.exp}" class="seg-btn rounded-lg px-3 py-1.5 text-xs font-semibold transition">Normal</button>
      </div>
      ${scSet().cmd[cm.slot] ? '<button type="button" id="cmClear" class="px-3 py-2 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10 text-sm">Slot leeren</button>' : ''}
    </div>`;
  }
  function showCmdView(c) {
    const m = CMD_BY_ID[c.id], r = SC_RAR[m.r];
    R.$('cmdTitle').textContent = m.name || 'Kommandant';
    R.$('cmdPick').classList.add('hidden'); R.$('cmdView').classList.remove('hidden');
    R.$('cmdView').innerHTML = `<div class="flex flex-col items-center gap-3 py-2">
      <img src="${cmdImg(m.id, c.exp)}" alt="" class="w-48 aspect-square object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,.6)]">
      ${c.exp ? '<div class="text-xs font-semibold text-gold-300">⭐ Expertise</div>' : ''}
      ${m.name ? `<div class="font-display text-2xl gold-text">${R.esc(m.name)}</div>` : ''}
      <div class="text-sm font-semibold" style="color:${r.c}">${r.label}</div>
    </div>`;
    openModal();
  }
  R.$('scCgBar').addEventListener('click', (ev) => {          // Abstand der Kommandanten in 5 Stufen (Detail + Bühne)
    if (!sc.own) return;
    const x = scSet(), b = ev.target.closest('[data-cg]');
    if (b) { x.cg = SC_CG[+b.dataset.cg]; drawShowcase(); scSaveSoon(); return; }
    if (ev.target.closest('#scCgAll')) { D().sets.forEach(s => { s.cg = x.cg; }); drawShowcase(); scSave(`✓ Abstand Stufe ${SC_CG.indexOf(x.cg) + 1} für alle Sets übernommen`); }
  });
  R.$('scCmds').addEventListener('click', (ev) => { const b = ev.target.closest('[data-cmdslot]'); if (b && !b.disabled) openCmd(+b.dataset.cmdslot); });
  R.$('cmdRar').onclick = (ev) => { const b = ev.target.closest('[data-cr]'); if (!b) return; cm.rar = b.dataset.cr; drawCmdPicker(); };
  R.$('cmdSearch').oninput = () => { cm.q = R.$('cmdSearch').value; drawCmdPicker(); };
  const cmdPickOne = (ev) => {
    const b = ev.target.closest('[data-cid]'); if (!b || b.disabled) return null;
    cm.sel = b.dataset.cid;
    R.$('cmdGrid').querySelectorAll('[data-cid]').forEach(x => { const on = x.dataset.cid === cm.sel;
      x.setAttribute('aria-pressed', String(on)); ['bg-gold-500/25', 'ring-2', 'ring-gold-400'].forEach(k => x.classList.toggle(k, on)); x.classList.toggle('hover:bg-ink-800', !on); });
    drawCmdForm(); return b;
  };
  R.$('cmdGrid').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-cid]'); if (!b || b.disabled || !sc.own) return;
    scSet().cmd[cm.slot] = scCmdNorm({ ...(scSet().cmd[cm.slot] || {}), id: b.dataset.cid, exp: cm.exp });
    closeModal(); drawShowcase(); scSave('✓ Kommandant gespeichert');
  });
  R.$('cmdForm').addEventListener('click', (ev) => {         // Normal / Expertise: Bilder im Fenster wechseln, gewählter Kommandant wird sofort angepasst
    const b = ev.target.closest('[data-cmexp]'); if (!b) return;
    cm.exp = b.dataset.cmexp === '1';
    const cur = scSet().cmd[cm.slot]; if (cur && sc.own) { scSet().cmd[cm.slot] = scCmdNorm({ ...cur, exp: cm.exp }); drawShowcase(); scSaveSoon(); }
    const top = R.$('cmdGrid').scrollTop; drawCmdPicker(); R.$('cmdGrid').scrollTop = top;
  });
  R.$('cmdForm').addEventListener('input', (ev) => {
    const t = ev.target;
    if (t.id === 'cmLevel') cm.level = scInt(t.value, 1, 60, 60);
    else if (t.dataset.cms != null) cm.skills[+t.dataset.cms] = scInt(t.value, 0, 5, 1);
    else if (t.id === 'cmAwake') cm.awakened = t.checked;
  });
  R.$('cmdForm').addEventListener('click', (ev) => {
    if (ev.target.closest('#cmApply')) {
      if (!cm.sel) return;
      scSet().cmd[cm.slot] = scCmdNorm({ id: cm.sel, level: cm.level, skills: cm.skills, awakened: cm.awakened });
      closeModal(); drawShowcase(); scSave('✓ Kommandant gespeichert');
    } else if (ev.target.closest('#cmClear')) {
      scSet().cmd[cm.slot] = null; closeModal(); drawShowcase(); scSave('✓ Slot geleert');
    }
  });
  R.$('cmdClose').onclick = closeModal;
  R.$('cmdBackdrop').addEventListener('click', (ev) => { if (ev.target === ev.currentTarget) closeModal(); });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !R.$('cmdModal').classList.contains('hidden')) closeModal(); });


  // Zum Scanner & Dashboard im passenden Modus springen
  function goScan(m) { R.view = 'scanner'; R.applyView(); R.showHub?.(false); R.mode = m; R.LS.set(R.MODE_KEY, R.mode); R.applyMode(); R.setAreaTab?.('dash'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  R.$('profScanSpeed').onclick = () => goScan('speedups');
  R.$('profSpeedMode').addEventListener('click', (ev) => { const b = ev.target.closest('[data-pm]'); if (!b) return;
    try { localStorage.setItem('rok_prof_panel', b.dataset.pm); } catch {} if (R.lastProfileP) R.renderGameProfile(R.lastProfileP); });

  // ---- Charts-Fenster (ApexCharts): Reiter · Zeitraum · Area/Bar ----
  const PC_TABS = [
    { id: 'speedups', label: 'Speedups' }, { id: 'resources', label: 'Ressourcen' }, { id: 'ap', label: 'Aktionspunkte' },
    { id: 'gems', label: 'Gems' }, { id: 'vip', label: 'VIP' }, { id: 'materials', label: 'Mats' }
  ];
  const PC_RANGES = [['14d', '14D', 14], ['1m', '1M', 30], ['3m', '3M', 91], ['1y', '1Y', 365], ['all', 'All', 0]];
  const PC_TYPES = [['area', 'Area'], ['bar', 'Bar']];
  const PC_PINK = '#f5c542', PC_CYAN = '#fde68a';   // Hauptlinie + Sprung-Markierungen im Gold-Stil
  R.speedUi.pc = { tab: 'ap', range: '1m', type: 'area', ...(R.speedUi.pc || {}) };
  let pcChart = null, pcData = null;

  // 9500 → 9.5K · 1250000 → 1.25M
  const kfmt = (v) => {
    const a = Math.abs(v), f = (x, sfx) => (Math.round(x * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 }) + sfx;
    return a >= 1e9 ? f(v / 1e9, 'B') : a >= 1e6 ? f(v / 1e6, 'M') : a >= 1e3 ? f(v / 1e3, 'K') : String(Math.round(v));
  };
  const APEX_EN = { name: 'en', options: {
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], shortDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    toolbar: { exportToSVG: 'Download SVG', exportToPNG: 'Download PNG', exportToCSV: 'Download CSV', menu: 'Download',
               selection: 'Selection', selectionZoom: 'Zoom area', zoomIn: 'Zoom in', zoomOut: 'Zoom out', pan: 'Pan', reset: 'Reset zoom' } } };
  const APEX_DE = { name: 'de', options: {
    months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
    shortMonths: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
    days: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
    shortDays: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
    toolbar: { exportToSVG: 'SVG herunterladen', exportToPNG: 'PNG herunterladen', exportToCSV: 'CSV herunterladen', menu: 'Download',
               selection: 'Auswahl', selectionZoom: 'Bereich zoomen', zoomIn: 'Vergrößern', zoomOut: 'Verkleinern', pan: 'Verschieben', reset: 'Zoom zurücksetzen' } } };

  // Datenreihen je Reiter: eine Hauptlinie (Fläche) + optionale Einzelwerte (per Legende einblendbar)
  function pcDef(tab) {
    const of = (type, f) => (e) => { if (e.type !== type) return null; const v = R.num(f(e)); return v == null ? null : v; };
    const sp = (k) => of('speedups', e => e.total == null ? null : (R.num(e[k]) || 0) / 1440);
    if (tab === 'resources') {
      const has = (e) => ['food', 'wood', 'stone', 'gold'].some(k => R.num(e[k]) != null);
      let lines = R.RES_LINES.filter(([k]) => R.speedUi.pcRes[k]);
      if (!lines.length) lines = [R.RES_LINES[1]];
      const mk = ([part, name, color]) => ({ name, color, get: of('resources', e => has(e) ? R.sumPart(e, part) : null) });
      const [first, ...rest] = lines.map(mk);
      return { showExtra: true, main: first, mainColor: first.color, extra: rest };
    }
    if (tab === 'gems') return { main: { name: 'Gems', get: of('gems', e => e.gems) }, extra: [] };
    if (tab === 'speedups') return { days: true, main: { name: 'Speedups gesamt', get: of('speedups', e => e.total == null ? null : R.num(e.total) / 1440) },
      extra: [['Training', 'training', '#f87171'], ['Heilung', 'healing', '#34d399'], ['Universal', 'universal', '#a78bfa'], ['Forschung', 'research', '#38bdf8'], ['Bau', 'building', '#fb923c']].map(([name, k, color]) => ({ name, color, get: sp(k) })) };
    if (tab === 'ap') return { main: { name: 'Aktionspunkte', get: of('ap', e => e.total_ap) }, extra: [] };
    if (tab === 'materials') {
      const all = [{ k: 'total', name: 'Gesamt (Legendär)', color: '#facc15', get: of('materials', e => R.matSelTotal(e)) },
        ...R.MATS.map(m => ({ k: m.k, name: m.label, color: m.c, get: of('materials', e => R.matLeg(e, m.k)) })),
        { k: 'chest', name: 'Kisten', color: R.CHEST.c, get: of('materials', e => R.chestLeg(e)) }];
      const [first, ...rest] = all;                                  // ein-/ausblenden über die Legende
      return { dec: true, showExtra: true, main: first, mainColor: first.color, extra: rest };
    }
    return { main: { name: 'VIP-Punkte', get: of('vip', e => e.after) }, extra: [] };
  }

  R.speedUi.pcRes = { hand: true, total: true, farm: false, ...(R.speedUi.pcRes || {}) };
  function renderProfileCharts(entries, P) { pcData = { entries, P }; drawPc(); }
  R.$('pcReset').onclick = async () => {
    const type = R.speedUi.pc.tab;
    if (!pcData?.P.own || !(await R.resetHistoryType(type))) return;
    pcData.entries = pcData.entries.filter(e => e.type !== type);
    drawPc();
  };

  function pcButtons(el, items, active, onPick) {
    el.innerHTML = items.map(([id, label]) => `<button type="button" data-v="${id}" aria-pressed="${id === active}" class="seg-btn rounded-lg px-3 py-1.5 text-xs font-semibold transition">${label}</button>`).join('');
    el.querySelectorAll('button').forEach(b => b.onclick = () => { onPick(b.dataset.v); R.saveSpeedUi(); drawPc(); });
  }

  function drawPc() {
    if (!pcData) return;
    const ui = R.speedUi.pc;
    pcButtons(R.$('pcTabs'), PC_TABS.map(t => [t.id, t.label]), ui.tab, v => ui.tab = v);
    pcButtons(R.$('pcRanges'), PC_RANGES.map(r => [r[0], r[1]]), ui.range, v => ui.range = v);
    pcButtons(R.$('pcTypes'), PC_TYPES, ui.type, v => ui.type = v);

    R.$('pcResLines').classList.toggle('hidden', ui.tab !== 'resources');
    if (ui.tab === 'resources') R.renderResLines(R.$('pcResLines'), R.speedUi.pcRes, () => { R.saveSpeedUi(); drawPc(); });
    R.$('pcResetWrap').classList.toggle('hidden', !pcData.P.own);
    R.$('pcReset').textContent = `🗑 ${R.TYPE_LABEL[ui.tab] || ''}-Diagramm zurücksetzen`;
    // Schnell-Scan: öffnet das Dashboard direkt im Modus des gewählten Reiters (nur eigenes Profil)
    R.$('pcScan').classList.toggle('hidden', !pcData.P.own);
    R.$('pcScan').textContent = `📷 ${PC_TABS.find(t => t.id === ui.tab)?.label || ''} scannen`;
    R.$('pcScan').onclick = () => goScan(ui.tab === 'materials' ? 'mats' : ui.tab);
    const def = pcDef(ui.tab), isBar = ui.type === 'bar';
    const span = (PC_RANGES.find(r => r[0] === ui.range) || PC_RANGES[1])[2];
    const from = span ? Date.now() - span * 86400000 : 0;
    const all = pcData.entries.filter(e => def.main.get(e) != null).sort((a, b) => a.ts - b.ts);
    const rows = all.filter(e => e.ts >= from);
    const empty = R.$('pcEmpty');
    if (pcChart) { pcChart.destroy(); pcChart = null; }
    R.$('pcChart').innerHTML = '';
    if (!window.ApexCharts) { empty.textContent = 'Diagramm-Bibliothek konnte nicht geladen werden (Internet/Adblocker prüfen).'; empty.classList.remove('hidden'); return; }
    if (!rows.length) {
      const what = PC_TABS.find(t => t.id === ui.tab).label;
      empty.textContent = all.length ? `Keine ${what}-Daten im gewählten Zeitraum – „All“ zeigt den ganzen Verlauf.`
        : (pcData.P.own ? `Noch keine ${what}-Scans – scanne sie im Scanner & Dashboard.` : (pcData.P.scansError ? 'Verlauf nicht verfügbar.' : `Dieser Spieler hat noch keine ${what}-Daten.`));
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');

    const round = (v) => v == null ? null : (def.days || def.dec) ? Math.round(v * 100) / 100 : Math.round(v);
    const pts = (get) => rows.map(e => ({ x: e.ts, y: round(get(e)) }));
    const mainData = pts(def.main.get);
    const series = [{ name: def.main.name, type: isBar ? 'bar' : 'area', data: mainData },
      ...def.extra.map(x => ({ name: x.name, type: isBar ? 'bar' : 'line', data: pts(x.get) }))];

    // Markierte Sprünge: die bis zu 4 größten Anstiege zwischen zwei Scans
    const fmtDelta = (d) => '+' + (def.days ? d.toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' T' : def.dec ? R.fmtLeg(d) : kfmt(d));
    const jumps = mainData.slice(1).map((p, i) => ({ p, d: p.y - mainData[i].y })).filter(j => j.d > 0)
      .sort((a, b) => b.d - a.d).slice(0, 4);
    const points = jumps.map(({ p, d }) => ({
      x: p.x, y: p.y, seriesIndex: 0,
      marker: { size: 5, fillColor: PC_PINK, strokeColor: '#07090f', strokeWidth: 2, shape: 'circle' },
      label: { text: fmtDelta(d), borderWidth: 0, offsetY: -6, style: { background: 'transparent', color: PC_CYAN, fontSize: '12px', fontWeight: 700, padding: { left: 0, right: 0, top: 0, bottom: 0 } } }
    }));

    const valFmt = (v) => v == null ? '–' : def.days ? R.durText(v * 1440) : def.dec ? R.fmtLeg(v) : R.fmt(v);
    pcChart = new ApexCharts(R.$('pcChart'), {
      chart: {
        type: isBar ? 'bar' : 'area', height: 340, background: 'transparent', foreColor: '#94a3b8', fontFamily: 'Inter, system-ui, sans-serif',
        locales: [APEX_DE, APEX_EN], defaultLocale: I18N.lang?.() === 'en' ? 'en' : 'de', animations: { enabled: true, speed: 450 },
        zoom: { enabled: false },
        toolbar: { show: false }
      },
      theme: { mode: 'dark' },
      series,
      colors: [def.mainColor || PC_PINK, ...def.extra.map(x => x.color)],
      stroke: { curve: 'smooth', width: isBar ? 0 : [3, ...def.extra.map(() => 2)] },
      fill: isBar ? { type: 'solid', opacity: 0.9 }
        : { type: ['gradient', ...def.extra.map(() => 'solid')], opacity: [1, ...def.extra.map(() => 1)],
            gradient: { shade: 'dark', type: 'vertical', shadeIntensity: 0, opacityFrom: 0.30, opacityTo: 0.02, stops: [0, 100] } },
      plotOptions: { bar: { borderRadius: 3, columnWidth: '55%' } },
      dataLabels: { enabled: false },
      markers: { size: 0, hover: { size: 5 } },
      grid: { borderColor: 'rgba(46,58,85,.6)', strokeDashArray: 0, xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } }, padding: { left: 6, right: 14, top: 4 } },
      xaxis: { type: 'datetime', labels: { datetimeUTC: false, format: 'dd MMM', style: { colors: '#94a3b8', fontSize: '12px' } },
               axisBorder: { show: false }, axisTicks: { show: false }, tooltip: { enabled: false } },
      yaxis: { min: isBar ? 0 : undefined, forceNiceScale: true, tickAmount: 4,
               labels: { style: { colors: '#94a3b8', fontSize: '12px' }, formatter: (v) => v == null ? '' : def.days ? (Math.round(v * 10) / 10).toLocaleString('de-DE') + ' T' : def.dec && Math.abs(v) < 1000 ? (Math.round(v * 10) / 10).toLocaleString('de-DE') : kfmt(v) } },
      legend: { show: def.extra.length > 0, position: 'top', horizontalAlign: 'center', labels: { colors: '#94a3b8' }, markers: { shape: 'circle' }, onItemClick: { toggleDataSeries: true } },
      tooltip: { theme: 'dark', shared: true, intersect: false, x: { format: 'dd. MMM yyyy, HH:mm' }, y: { formatter: valFmt } },
      annotations: { points }
    });
    pcChart.render().then(() => { if (!def.showExtra) def.extra.forEach(x => { try { pcChart.hideSeries(x.name); } catch {} }); });   // Einzelwerte per Legende einblenden
  }

  // Sprache gewechselt → Diagramme neu zeichnen (Beschriftungen im Canvas/SVG)
  window.addEventListener('langchange', () => { R.renderHistory(); if (R.view === 'profile' && typeof drawPc === 'function') drawPc(); });

};
