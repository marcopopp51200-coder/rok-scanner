// ================= Sprache / Language (DE ⇄ EN) =================
// Deutsch ist die Grundsprache der Seite. translations.en übersetzt jeden deutschen Text ins Englische.
// Feste Texte stehen in "texts", Texte mit Zahlen/Namen in "patterns" (Regex → Ersatz).
// Die Umschaltung tauscht alle Texte live aus (auch später erzeugte), ohne Neuladen. Auswahl: localStorage 'lang'.
window.I18N = (() => {
  const LANGS = { de: { name: 'Deutsch', flag: '🇩🇪' }, en: { name: 'English', flag: '🇺🇸' } };
  const translations = {
    de: {},   // Grundsprache – Texte stehen direkt im HTML/JS
    en: {
      texts: {
        // Rangliste-Zuwachs, Profil-Fenster, KvK-Timer, Showcase-Sichtbarkeit
        '+ grün': '+ green', 'Zuwachs seit dem letzten Scan': 'gain since the last scan', 'seit dem letzten Scan': 'since the last scan',
        'KvK-Start in': 'KvK starts in', 'KvK läuft · Tag': 'KvK running · Day', 'KvK-Start festlegen': 'Set KvK start', 'KvK öffnen': 'Open KvK',
        'Statthalter-Werte': 'Governor stats', 'Werden beim Scannen ausgefüllt – falls der Scanner danebenliegt, hier von Hand eintragen.': 'Filled in when you scan – if the scanner gets something wrong, enter it here manually.',
        'Siege': 'Wins', 'Truhe des Osiris': 'Ark of Osiris', 'Verlorenes Königreich': 'Lost Kingdom', '× Alleinherrscher': '× Autarch', 'Alleinherrscher': 'Autarch', 'Speedups gesamt': 'Speedups total', 'nur für dich sichtbar': 'only visible to you', 'im Profil bearbeiten eintragen': 'enter it under edit profile',
        '✓ Gespeichert · Statthalter-Werte übernommen': '✓ Saved · governor stats updated', 'Prüfe Werte …': 'Checking values …', 'Abgebrochen – nichts übernommen.': 'Cancelled – nothing saved.',
        'z. B. 85.141.754': 'e.g. 85,141,754', 'z. B. 5.482.675.899': 'e.g. 5,482,675,899', 'z. B. 20.061.883': 'e.g. 20,061,883', 'z. B. 12.500.000': 'e.g. 12,500,000',
        'Keinen – privat': 'None – private', 'Details privat': 'Details private', 'Details öffentlich': 'Details public',
        'Andere sehen nur das Showcase-Bild – Sets, Ausrüstung und Details darunter bleiben privat': 'Others only see the showcase image – sets, equipment and details below stay private',
        '👁 Andere Spieler sehen deinen Showcase in deinem Profil.': '👁 Other players see your showcase in your profile.',
        '👁 Andere Spieler sehen nur den ausgewählten Showcase.': '👁 Other players only see the selected showcase.',
        'Details sind privat – andere sehen nur das Bild.': 'Details are private – others only see the image.',
        '🔒 Details sind jetzt privat – andere sehen nur das Bild': '🔒 Details are now private – others only see the image', '🔓 Details sind jetzt für andere sichtbar': '🔓 Details are now visible to others',
        // Neue Bereiche: Feed, My Kingdom, Help Me, Showcases (feed.js, kingdom.js, helpme.js, showcases.js)
        '📰 Feed': '📰 Feed', '🏰 My Kingdom': '🏰 My Kingdom', '🆘 Help Me': '🆘 Help Me', 'Showcases': 'Showcases', '🎨 Showcases': '🎨 Showcases', 'Zur Startseite': 'To the start page',
        'Showcases, KvK-Bilanzen und Craft-Upgrades aller Spieler': 'Showcases, KvK results and craft upgrades of all players', '↻ Aktualisieren': '↻ Refresh', 'Neuer Beitrag': 'New post',
        "Was gibt's Neues? (optional)": "What's new? (optional)", 'Anhängen:': 'Attach:', '🎨 Showcase': '🎨 Showcase', '🏁 KvK-Bilanz': '🏁 KvK result', '🏛️ AoO': '🏛️ AoO', '⚒️ Craft-Upgrade': '⚒️ Craft upgrade',
        '✕ Anhang entfernen': '✕ Remove attachment', 'Posten': 'Post', '✓ Gepostet': '✓ Posted', 'Wird gepostet …': 'Posting …', 'Noch keine Beiträge – mach den Anfang! 🎉': 'No posts yet – be the first! 🎉',
        '⚒️ Welches Teil hast du gecraftet / aufgewertet?': '⚒️ Which piece did you craft / upgrade?', '💬 Beitrag': '💬 Post', 'gerade eben': 'just now', 'Diesen Beitrag löschen?': 'Delete this post?',
        'Nur für Mitglieder deines Königreichs sichtbar': 'Only visible to members of your kingdom', '📨 Einladungen': '📨 Invitations', '✓ Annehmen': '✓ Accept', 'Ablehnen': 'Decline', '🏰 Königreich gründen': '🏰 Found a kingdom',
        '👑 Gründen': '👑 Found', 'Königreich-Nr.': 'Kingdom no.', '👥 Mitglieder': '👥 Members', '💬 Feed': '💬 Feed', '📅 Ereignisse': '📅 Events', '⚔️ KvK-Planung': '⚔️ KvK planning', '👑 Autarchen': '👑 Autarchs', '👑 Autarch-Liste': '👑 Autarch list',
        '💬 Königreich-Feed': '💬 Kingdom feed', 'Verlassen': 'Leave', '🗑 Löschen': '🗑 Delete', '➕ Planen': '➕ Plan', '➕ Eintragen': '➕ Add', 'Senden': 'Send', '🔍 Suchen': '🔍 Search', '📨 Einladen': '📨 Invite', 'schon dabei': 'already in',
        'Planen können R4 und R5.': 'R4 and R5 can plan.', 'Noch nichts geplant.': 'Nothing planned yet.', 'Noch keine Einträge.': 'No entries yet.', 'Noch keine Beiträge.': 'No posts yet.', 'Datum & Uhrzeit': 'Date & time', 'Notiz': 'Note', 'Titel': 'Title',
        'Zeig dein Set – die Community sagt dir, was du zuerst craften solltest': 'Show your set – the community tells you what to craft first', '➕ Anfrage stellen': '➕ Ask for help', '🆘 Neue Anfrage': '🆘 New request', 'Welche Sets?': 'Which sets?',
        'Frage (optional)': 'Question (optional)', '📨 Posten': '📨 Post', 'Abbrechen': 'Cancel', '📨 Empfehlung senden': '📨 Send recommendation', '↻ Empfehlung ändern': '↻ Change recommendation', 'Schließen': 'Close', 'Noch keine Anfragen.': 'No requests yet.',
        'Kurze Begründung (optional)': 'Short reason (optional)', 'Noch keine Antworten.': 'No answers yet.', '✓ Empfehlung gesendet': '✓ Recommendation sent', '✓ Anfrage gepostet': '✓ Request posted',
        'Gear, KvK und Ark of Osiris – hier bearbeiten und ins Profil laden': 'Gear, KvK and Ark of Osiris – edit here and load into your profile', '⚔️ Gear Showcase': '⚔️ Gear Showcase', '🏁 KvK Showcase': '🏁 KvK Showcase', '🏛️ AoO Showcase': '🏛️ AoO Showcase',
        '🏛️ AoO Showcase bearbeiten': '🏛️ Edit AoO Showcase', '👤 Im Profil speichern': '👤 Save to profile', '✕ Aus Profil entfernen': '✕ Remove from profile', '📰 Im Feed posten': '📰 Post in feed', '✎ Bearbeiten (KvK → Stats → Bild)': '✎ Edit (KvK → Stats → Image)',
        '🏆 Siege': '🏆 Wins', '⭐ MVP (Anzahl)': '⭐ MVP (count)', '🎯 Rolle': '🎯 Role', '💬 Motto': '💬 Motto', '🖼️ Hintergrund': '🖼️ Background', '👁 Vorschau': '👁 Preview', 'Siege': 'Wins', '← Zurück': '← Back',
        // Dashboard-Kacheln & Passports
        'Dashboard': 'Dashboard', 'Bereich antippen zum Öffnen': 'Tap an area to open it', 'noch kein Scan': 'no scan yet', '← Alle Bereiche': '← All areas',
        'Passports': 'Passports', 'Passseiten': 'Passport pages', '🛂 Passseiten': '🛂 Passport pages', 'Passseiten (Main)': 'Passport pages (main)', 'Benötigt': 'Required',
        '2 · Passports eingeben': '2 · Enter passports', 'Passports speichern': 'Save passports', '🎯 Benötigt für Migration': '🎯 Required for migration', '(optional)': '(optional)',
        'Anzahl deiner Passseiten aus dem Inventar. Ein Scan füllt das Feld – kurz prüfen, dann speichern.': 'Number of passport pages in your inventory. A scan fills the field – check it, then save.',
        'Migration': 'Migration', 'Genug Passseiten für die Migration ✓': 'Enough passport pages for migration ✓', 'Noch keine Passport-Scans gespeichert.': 'No passport scans saved yet.',
        'Bitte die Anzahl deiner Passseiten eintragen.': 'Please enter your number of passport pages.',
        'Keine Passports im Screenshot erkannt. Bitte die Anzahl links von Hand eintragen.': 'No passports detected in the screenshot. Please enter the number on the left manually.',
        'Lade einen Screenshot deiner Passseiten aus dem Inventar hoch und klicke auf „Analysieren“ – oder trag die Anzahl links von Hand ein.': 'Upload a screenshot of your passport pages from the inventory and click “Analyze” – or enter the number on the left manually.',
        'Der Scan-Server kennt den Passport-Scan noch nicht – bitte die neue api/scan.js auf Vercel einspielen. Bis dahin kannst du die Anzahl links von Hand eintragen.': 'The scan server doesn’t know the passport scan yet – please deploy the new api/scan.js to Vercel. Until then you can enter the number on the left manually.',
        'Goldheads': 'Goldheads', 'Keys': 'Keys', 'Armaments': 'Armaments', 'Universelle legendäre Skulpturen': 'Universal legendary sculptures', 'Goldene Schlüssel': 'Gold keys',
        'Silberne Schlüssel': 'Silver keys', 'Material-Schlüssel': 'Material keys', 'Armaments gesamt': 'Armaments total', 'Episch': 'Epic', 'Elite': 'Elite', 'Fortgeschritten': 'Advanced',
        'Normal': 'Normal', 'Schriftrollen': 'Scrolls', 'Gesamt': 'Total', 'Veränderung': 'Change', 'Erster Scan': 'First scan', 'Bitte mindestens eine Anzahl eintragen.': 'Please enter at least one amount.',
        'Anzahl aus dem Inventar. Ein Scan füllt die Felder – kurz prüfen, dann speichern.': 'Amounts from your inventory. A scan fills the fields – check them, then save.',
        'Noch keine Goldhead-Scans gespeichert.': 'No goldhead scans saved yet.', 'Noch keine Key-Scans gespeichert.': 'No key scans saved yet.', 'Noch keine Armament-Scans gespeichert.': 'No armament scans saved yet.',
        'Lade einen Screenshot deiner universellen legendären Skulpturen (Goldheads) hoch und klicke auf „Analysieren“ – oder trag die Anzahl links von Hand ein.': 'Upload a screenshot of your universal legendary sculptures (goldheads) and click “Analyze” – or enter the number on the left manually.',
        'Lade einen Screenshot deiner Schlüssel aus dem Inventar hoch und klicke auf „Analysieren“ – oder trag die Anzahl links von Hand ein.': 'Upload a screenshot of your keys from the inventory and click “Analyze” – or enter the numbers on the left manually.',
        'Lade Screenshots deiner Armaments und Schriftrollen hoch und klicke auf „Analysieren“ – oder trag die Anzahl links von Hand ein.': 'Upload screenshots of your armaments and scrolls and click “Analyze” – or enter the numbers on the left manually.',
        // Passive Income, klappbare Felder, neue Items
        'Passive Income': 'Passive income', 'Scan': 'Scan', 'Passive': 'Passive', 'Screenshot oder von Hand': 'Screenshot or manual', 'nicht verfügbar': 'not available', 'noch nichts eingetragen': 'nothing entered yet', 'pro Tag': 'per day', 'pro Woche': 'per week', 'pro Monat': 'per month', '/ Woche': '/ week', 'in 30 Tagen': 'in 30 days', '+30 Tage': '+30 days',
        'Was regelmäßig dazukommt (Events, Truhen, Allianz-Shop, Farmen …). Wird automatisch gespeichert und hochgerechnet.': 'What you get regularly (events, chests, alliance shop, farms …). Saved automatically and projected.',
        'Trag ein, wie viel du regelmäßig bekommst – dann siehst du hier, was in 7 und 30 Tagen dazukommt.': 'Enter how much you get regularly – then you see here what you gain in 7 and 30 days.',
        'Ziel schon erreicht ✓': 'Goal already reached ✓', 'Aufklappen': 'Expand', 'Zuklappen': 'Collapse', 'Ressourcen gesamt': 'Resources total', 'Std.': 'h',
        '🎯 Migrations-Ziel in ca.': '🎯 Migration goal reached in about', 'Tagen erreicht': 'days', 'Sovereign-Schlüssel': 'Sovereign keys', 'Armament-Truhen': 'Armament chests', 'Armament-Kisten': 'Armament boxes', 'Formations-Münzen': 'Formation coins',
        'Goldene Formations-Münzen': 'Gold formation coins', 'Umwandlungssteine': 'Conversion stones', 'Umwandlungsstein-Fragmente': 'Conversion stone fragments', 'Kristalle': 'Crystals',
        'Transmutationskristalle': 'Transmutation crystals', 'Transmutationssteine': 'Transmutation stones',
        // Statistics (AP)
        'Statistics': 'Statistics', 'Was kann ich damit machen?': 'What can I do with it?', 'Was kannst du mit deinen AP machen?': 'What can you do with your AP?', 'Jetzt': 'Now', '7 Tage': '7 days', '30 Tage': '30 days', 'bis KvK': 'until KvK',
        'Eigener Zeitraum': 'Custom period', 'Tage': 'days', 'AP jetzt': 'AP now', 'aus deinem letzten Scan': 'from your last scan', 'Noch kein AP-Scan – nur Passive gerechnet': 'No AP scan yet – passive only',
        '⚙ AP-Kosten anpassen': '⚙ Adjust AP costs', 'Barbaren (Offseason)': 'Barbarians (offseason)', 'Barbaren (KvK)': 'Barbarians (KvK)', 'Forts (Offseason)': 'Forts (offseason)', 'Forts (KvK)': 'Forts (KvK)', 'Marodeure (KvK)': 'Marauders (KvK)',
        'Barbaren: 50 AP, je Angriff ohne Rückkehr −2 bis 40 (mit Talent „Einsicht“ weniger). Forts und Marodeure sind Schätzwerte – trag hier deine echten Kosten ein.': 'Barbarians: 50 AP, −2 per attack without returning, down to 40 (less with the Insight talent). Forts and marauders are estimates – enter your real costs here.',
        'Passive AP': 'Passive AP', 'Aktiviere, was auf dich zutrifft – wird automatisch gespeichert und hochgerechnet.': 'Turn on what applies to you – saved automatically and projected.',
        'Montags-Belohnung': 'Monday reward', '100 AP jeden Tag': '100 AP every day', '3.000 AP jeden Montag': '3,000 AP every Monday', 'Allianz-Forts': 'Alliance forts', '100 % = 7.000 AP pro Woche': '100 % = 7,000 AP per week',
        'Eigene Forts': 'Own forts', 'Barbaren': 'Barbarians', 'Daily Bundle': 'Daily bundle', '500 AP pro Kauf': '500 AP per purchase', 'Forts pro Tag (Ø)': 'Forts per day (avg)', 'Barbaren pro Tag': 'Barbarians per day', 'Käufe pro Tag': 'Purchases per day',
        'Quelle': 'Source', 'Passiv gesamt': 'Passive total', 'AP gesamt': 'AP total', 'z. B. 5': 'e.g. 5',
        'Aktiviere oben mindestens eine Quelle – dann siehst du hier, wie viel AP in 7 Tagen, 30 Tagen, deinem eigenen Zeitraum und bis zum KvK dazukommen.': 'Turn on at least one source above – then you see how much AP you gain in 7 days, 30 days, your custom period and until KvK.',
        'Trag ein, wie viel du regelmäßig bekommst – dann siehst du hier, was in 7 Tagen, 30 Tagen, deinem eigenen Zeitraum und bis zum KvK dazukommt.': 'Enter how much you get regularly – then you see what you gain in 7 days, 30 days, your custom period and until KvK.',
        'Gold = Bestand aus dem letzten Scan + Passive · „+“ = nur Passive (noch kein Scan)': 'Gold = stock from last scan + passive · “+” = passive only (no scan yet)',
        'KvK-Start nicht festgelegt (unter KvK → Get Ready)': 'KvK start not set (under KvK → Get Ready)', 'KvK-Start:': 'KvK start:', 'AP zum KvK-Start': 'AP at KvK start',
        'Für diesen Bereich gibt es noch keine Statistik – kommt als Nächstes.': 'No statistics for this area yet – coming next.',
        // Navigation & Überschriften
        'Allianz-Rangliste': 'Alliance Leaderboard', 'Rangliste': 'Leaderboard', 'Game Profil': 'Game Profile',
        'Scanner & Dashboard': 'Scanner & Dashboard', 'Profil bearbeiten': 'Edit Profile', 'Verlauf': 'History',
        'Modus': 'Mode', 'Ressourcen': 'Resources', 'Speedups': 'Speedups', 'VIP': 'VIP', 'Gems': 'Gems', 'AP': 'AP',
        'Edelsteine': 'Gems', 'Mats': 'Mats', 'Materialien': 'Materials', 'Kisten': 'Chests', 'Material-Kisten': 'Material chests', 'Kisten (Legendär)': 'Chests (legendary)', 'Leder': 'Leather', 'Eisenerz': 'Iron Ore', 'Ebenholz': 'Ebony', 'Tierknochen': 'Animal Bone',
        'Normal': 'Normal', 'Fortgeschritten': 'Advanced', 'Advanced': 'Advanced', 'Elite': 'Elite', 'Episch': 'Epic', 'Legendär': 'Legendary',
        '2 · Materialien eingeben': '2 · Enter materials', 'Materialien speichern': 'Save materials', 'Materialien scannen': 'Scan materials',
        'Anzahl je Seltenheit. Ein Scan füllt die Felder – kurz prüfen, dann speichern.': 'Number per rarity. A scan fills the fields – check quickly, then save.',
        'Gesamt · Äquivalent in Legendär': 'Total · legendary equivalent', 'Antippen: in Gesamtsumme zählen / nicht zählen': 'Tap: include in / exclude from total', 'Äquivalent in Legendär:': 'Legendary equivalent:', 'Gesamt (Legendär)': 'Total (legendary)',
        'Noch keine Material-Scans gespeichert.': 'No material scans saved yet.', 'Bitte mindestens ein Material eintragen.': 'Please enter at least one material.',
        'Keine Materialien im Screenshot erkannt. Bitte die Anzahl links von Hand eintragen.': 'No materials detected in the screenshot. Please enter the numbers on the left.',
        'Lade Screenshots deiner Schmiedematerialien aus dem Rucksack hoch und klicke auf „Materialien scannen“ – oder trag die Anzahl links von Hand ein.':
          'Upload screenshots of your crafting materials and click “Scan materials” – or enter the numbers on the left.',
        'Der Scan-Server kennt den Material-Scan noch nicht – bitte die neue api/scan.js auf Vercel einspielen. Bis dahin kannst du die Materialien links von Hand eintragen.':
          'The scan server does not know the material scan yet – please deploy the new api/scan.js on Vercel. Until then enter the materials on the left.', 'Aktionspunkte': 'Action Points', 'AP (Aktionspunkte)': 'AP (Action Points)', 'Farmen': 'Farms', 'Farm': 'Farm',
        'VIP-Rechner': 'VIP Calculator', 'Dein Account': 'Your account', 'Eingeloggt als': 'Logged in as',
        '1 · Screenshots': '1 · Screenshots', '2 · Speedups eingeben': '2 · Enter speedups', '2 · AP-Flaschen': '2 · AP bottles',
        '2 · Aktueller VIP-Stand': '2 · Current VIP status', 'Erkannte VIP-Items': 'Detected VIP items',
        // Buttons & Labels
        'Profil speichern': 'Save Profile', 'Wird beim „📷 Statthalter-Profil scannen“ automatisch ausgelesen.': 'Read automatically when you “📷 Scan governor profile”.', 'Abmelden': 'Logout', 'Allianz-Tag': 'Alliance Tag', 'Profilbild': 'Profile picture',
        'Benötigte Bündnis-Credits': 'Required Alliance Credits', 'Bündnis-Credits benötigt': 'Alliance Credits required',
        'Analysieren': 'Analyze', 'Analysiere …': 'Analyzing …', 'Aktualisieren': 'Refresh', '← Zurück': '← Back',
        'Einloggen': 'Log in', 'Neuen Account anlegen': 'Create new account', 'Account anlegen': 'Create account',
        'Benutzername': 'Username', 'Passwort': 'Password', 'Passwort bestätigen': 'Confirm password', '(mind. 6 Zeichen)': '(min. 6 characters)',
        'Erneut versuchen': 'Try again', 'Bitte warten …': 'Please wait …',
        'VIP scannen': 'Scan VIP', 'Speedups scannen': 'Scan speedups', 'Statthalter-Profil scannen': 'Scan governor profile',
        'Bestand speichern': 'Save inventory', 'AP speichern': 'Save AP', 'Rechner ohne Scan öffnen': 'Open calculator without scan',
        'Verlauf zurücksetzen': 'Reset history', 'Diagramm zurücksetzen': 'Reset chart', '+ Farm': '+ Farm',
        'Linie': 'Line', 'Balken': 'Bar', 'Area': 'Area', 'Bar': 'Bar', 'All': 'All',
        'Gesamt': 'Total', 'Farm Gesamt': 'Farm total', 'Main + Farm Gesamt': 'Main + farm total', 'Ohne Rucksack': 'Without backpack', 'Mit Farms': 'With farms', '+ Farms': '+ Farms', 'Linien:': 'Lines:',
        'Main': 'Main', 'Main + Rucksack': 'Main + backpack', 'Main + Rucksack + Farms': 'Main + backpack + farms',
        'Rucksack': 'Backpack', 'Auf Hand': 'On hand', 'Im Rucksack': 'In backpack', 'Summe': 'Sum', 'Summe Farmen': 'Farms total',
        'Main (letzter Scan)': 'Main (last scan)', 'Ressourcen gesamt': 'Resources total',
        'Proviant': 'Food', 'Nahrung': 'Food', 'Holz': 'Wood', 'Stein': 'Stone', 'Gold': 'Gold',
        'Universal': 'Universal', 'Training': 'Training', 'Heilung': 'Healing', 'Forschung': 'Research', 'Bau': 'Building',
        'Truppentraining': 'Troop training', 'Speedups gesamt': 'Speedups total', 'Tage': 'days', 'Std.': 'h', 'Min.': 'min', 'Tag': 'day',
        'Kill-Punkte': 'Kill Points', 'Höchster Verdienst': 'Highest Acclaim', 'Verdienst': 'Acclaim', 'Energie': 'Power',
        'VIP-Punkte': 'VIP points', 'VIP-Stufe': 'VIP level', 'Stufe': 'Level', 'Platz': 'Rank', 'Spieler': 'Player',
        'Bis zum nächsten VIP': 'To next VIP', 'Zuletzt aktualisiert': 'Last updated', '(inkl. Gegenstände)': '(incl. items)',
        'Dein Platz': 'Your rank', 'noch kein Scan': 'no scan yet', 'Datum': 'Date', 'Veränderung': 'Change',
        'Aktuell': 'Current', 'Punkte im Rucksack': 'Points in backpack', 'Gesamtwert': 'Total value',
        'Aktuelle VIP-Punkte': 'Current VIP points', 'Ziel-Level': 'Target level', 'Fehlende Punkte': 'Missing points',
        'Benötigte Tage': 'Days needed', 'Pkt./Stk.': 'Pts/pc', 'Anzahl': 'Quantity', 'Inventar': 'Inventory',
        'Nach Einlösen': 'After redeeming', 'Aktuelle Punkte': 'Current points', 'Stk.': 'pcs',
        'Edelsteine gesamt (Main)': 'Gems total (main)', '💎 Gesamt': '💎 Total', 'AP gesamt': 'AP total', 'Aktionspunkte gesamt': 'Action points total',
        '50er': '50s', '100er': '100s', '500er': '500s', '1.000er': '1,000s',
        '50er Flaschen': '50 bottles', '100er Flaschen': '100 bottles', '500er Flaschen': '500 bottles', '1.000er Flaschen': '1,000 bottles',
        'Profil privat': 'Private profile', 'Dieses Profil ist privat': 'This profile is private',
        'Speedups und Verlauf sind nur für den Spieler selbst sichtbar.': 'Speedups and history are only visible to the player.',
        'Andere sehen dann nur noch den oberen Bereich (Name, Allianz-Tag, VIP, Kill-Punkte, Verdienst, Energie) – auch dein Showcase bleibt verborgen. Speedups, Deads, AP, Gems und Verlauf siehst ohnehin nur du.':
          'Others will then only see the top section (name, alliance tag, VIP, kill points, acclaim, power) – your showcase stays hidden too. Speedups, deads, AP, gems and history are only ever visible to you.',
        'Andere sehen dann nur noch den oberen Bereich (Name, Allianz-Tag, VIP, Kill-Punkte, Verdienst, Energie) – Speedups und Verlauf bleiben verborgen.':
          'Others will only see the top section (name, alliance tag, VIP, kill points, acclaim, power) – speedups and history stay hidden.',
        'Nur Ansicht': 'View only', 'Dein Profil · öffentlich': 'Your profile · public', 'Dein Profil · 🔒 privat': 'Your profile · 🔒 private',
        'Dein Profil ·': 'Your profile ·', 'Profil ist jetzt privat': 'Profile is now private', 'Profil ist jetzt öffentlich': 'Profile is now public',
        '– eigenes Bild hochladen oder Symbol wählen': '– upload your own picture or pick a symbol',
        'Max Level erreicht 👑': 'Max level reached 👑', 'Höchste VIP-Stufe erreicht': 'Highest VIP level reached',
        'Du führst die Rangliste an! 👑': 'You lead the leaderboard! 👑', 'Noch': 'Need', 'und tippe auf': 'and tap',
        'keine Daten': 'no data', 'Erster Scan': 'First scan', 'unbekannt': 'unknown', 'Keine Einträge.': 'No entries.',
        // Scanner-Hinweise
        'Bilder hierher ziehen': 'Drop images here', 'oder klicken · auch Strg+V zum Einfügen · max. 5 Bilder': 'or click · Ctrl+V to paste · max. 5 images',
        'Nur Screenshots deines Main-Accounts': 'Only screenshots of your main account',
        'Bilder werden nur im Arbeitsspeicher gehalten, nie gespeichert und nach erfolgreichem Auslesen sofort verworfen. Im Verlauf bleiben nur Datum, Typ und Zahlen.':
          'Images are only kept in memory, never stored, and discarded right after reading. The history keeps only date, type and numbers.',
        '✓ Screenshots wurden nach dem Auslesen verworfen.': '✓ Screenshots were discarded after reading.',
        'Claude liest deine Screenshots …': 'Claude is reading your screenshots …', 'Noch keine Auswertung': 'No analysis yet',
        'Alternativ zum Scan: Bestand von Hand eintragen.': 'Alternatively: enter your inventory manually.',
        'Anzahl je Flaschengröße aus dem Inventar. Ein Scan füllt die Felder vor – kurz prüfen, dann speichern.':
          'Number per bottle size from your inventory. A scan fills the fields – check quickly, then save.',
        'Anzahl ist korrigierbar, falls eine Kachel schlecht lesbar war.': 'Quantity can be corrected if a tile was hard to read.',
        'Eingabe als Zahl oder Kurzform, z. B. 12500000, 12,5M oder 850K. Wird automatisch gespeichert.':
          'Enter a number or short form, e.g. 12500000, 12.5M or 850K. Saved automatically.',
        'Noch keine Farmen – „+ Farm“ klicken.': 'No farms yet – click “+ Farm”.',
        'Lade einen Screenshot der Ressourcen deines Main-Accounts hoch und klicke auf „Analysieren“.': 'Upload a screenshot of your main account’s resources and click “Analyze”.',
        'Lade einen Screenshot deines Inventars mit VIP-Punkte-Items hoch und klicke auf „Analysieren“ – oder nutze „Rechner ohne Scan öffnen“.':
          'Upload a screenshot of your inventory with VIP point items and click “Analyze” – or use “Open calculator without scan”.',
        'Lade einen Screenshot hoch, auf dem deine Edelsteine zu sehen sind, und klicke auf „Analysieren“.': 'Upload a screenshot showing your gems and click “Analyze”.',
        'Lade Screenshots deiner Beschleuniger aus dem Inventar hoch und klicke auf „Analysieren“ – oder trag deinen Bestand links unter „Speedups eingeben“ ein.':
          'Upload screenshots of your speedups and click “Analyze” – or enter your inventory on the left under “Enter speedups”.',
        'Lade einen Screenshot deiner AP-Flaschen aus dem Inventar hoch und klicke auf „Analysieren“ – oder trag die Anzahl je Flaschengröße links ein.':
          'Upload a screenshot of your AP bottles and click “Analyze” – or enter the number per bottle size on the left.',
        'VIP-Punkte, Speedups, Edelsteine, AP und Ressourcen werden automatisch aus deinen Scans im Scanner & Dashboard übernommen.':
          'VIP points, speedups, gems, AP and resources are taken automatically from your scans in Scanner & Dashboard.',
        'Inoffizielles Fan-Tool · nicht mit Lilith Games verbunden': 'Unofficial fan tool · not affiliated with Lilith Games',
        // Status & Laden
        'Verbinde …': 'Connecting …', 'Lade deine Daten aus der Cloud …': 'Loading your data from the cloud …',
        'Lade ungespeicherte Änderungen hoch …': 'Uploading unsaved changes …', 'Lade Rangliste …': 'Loading leaderboard …',
        'Lade Game Profil …': 'Loading game profile …', 'Lese Statthalter-Profil …': 'Reading governor profile …', 'Lese AP lokal …': 'Reading AP locally …',
        'Speichere …': 'Saving …', '✓ Gespeichert': '✓ Saved', '✓ Statthalter-Profil gespeichert': '✓ Governor profile saved',
        '☁ synchronisiert': '☁ synced', '☁ in der Cloud gespeichert': '☁ saved to cloud', '☁ speichert …': '☁ saving …',
        '☁ ungespeichert …': '☁ unsaved …', '☁ gespeichert (Profil-Speicher)': '☁ saved (profile storage)',
        '⚠ nicht gespeichert – neuer Versuch …': '⚠ not saved – retrying …', '⚠ offline – lokaler Stand': '⚠ offline – local data',
        '✓ Gespeichert · in Supabase (scans)': '✓ Saved · in Supabase (scans)',
        '✓ Gespeichert · im Profil-Speicher (für public.scans fehlt noch das SQL-Update)': '✓ Saved · in profile storage (SQL update for public.scans still missing)',
        '✓ Lokal gespeichert · Cloud gerade nicht erreichbar, wird automatisch nachgeholt': '✓ Saved locally · cloud unreachable, will sync automatically',
        '✓ Lokal gespeichert, Cloud folgt': '✓ Saved locally, cloud follows',
        '✓ Gespeichert (Profil-Speicher – SQL-Update für public.scans fehlt)': '✓ Saved (profile storage – SQL update for public.scans missing)',
        'Profilbild bereit – „Profil speichern“ klicken.': 'Picture ready – click “Save Profile”.',
        'Noch kein Statthalter-Scan': 'No governor scan yet', 'Verlauf nicht verfügbar.': 'History not available.',
        'Noch niemand in der Rangliste. Scanne dein VIP oder trag deine aktuellen VIP-Punkte im VIP-Bereich ein.':
          'Nobody on the leaderboard yet. Scan your VIP or enter your current VIP points in the VIP section.',
        // Fehlermeldungen
        'Benutzername oder Passwort ist falsch.': 'Username or password is wrong.', 'Diesen Account gibt es schon – bitte einloggen.': 'This account already exists – please log in.',
        'Bitte bestätige zuerst deine E-Mail-Adresse (Link im Postfach).': 'Please confirm your e-mail address first (link in your inbox).',
        'Das Passwort ist zu kurz (mind. 6 Zeichen).': 'The password is too short (min. 6 characters).',
        'Zu viele Versuche – bitte kurz warten.': 'Too many attempts – please wait a moment.', 'Keine Verbindung zur Cloud. Internet prüfen.': 'No connection to the cloud. Check your internet.',
        'Bitte Benutzernamen eingeben.': 'Please enter a username.', 'Bitte eine gültige E-Mail-Adresse eingeben.': 'Please enter a valid e-mail address.',
        'Das Passwort muss mindestens 6 Zeichen haben.': 'The password must have at least 6 characters.', 'Der Benutzername muss mindestens 2 Zeichen haben.': 'The username must have at least 2 characters.',
        'Die Passwörter stimmen nicht überein.': 'The passwords do not match.', 'Dieses Profil wurde nicht gefunden.': 'This profile was not found.',
        'Registrierung ist in Supabase gerade nicht erlaubt (Auth-Einstellungen prüfen).': 'Sign-up is currently not allowed in Supabase (check auth settings).',
        'Die Datenbank-Tabellen fehlen – bitte das SQL im Supabase SQL Editor ausführen.': 'Database tables are missing – please run the SQL in the Supabase SQL editor.',
        'Die Cloud-Bibliothek (Supabase) konnte nicht geladen werden. Internetverbindung oder Adblocker prüfen.': 'The cloud library (Supabase) could not be loaded. Check your internet connection or ad blocker.',
        'Maximal 5 Bilder pro Analyse.': 'Maximum 5 images per analysis.', 'Die Antwort konnte nicht ausgelesen werden. Bitte erneut versuchen.': 'The response could not be read. Please try again.',
        'Die Bilder sind zu groß. Bitte weniger Screenshots auf einmal hochladen.': 'The images are too large. Please upload fewer screenshots at once.',
        'Die Bilder sind zusammen zu groß. Bitte weniger Screenshots auf einmal hochladen.': 'The images are too large together. Please upload fewer screenshots at once.',
        'Gerade zu viele Anfragen. Kurz warten und erneut versuchen.': 'Too many requests right now. Wait a moment and try again.',
        'Server-Route /api/scan nicht gefunden. Die Seite muss über Vercel laufen (nicht als lokale Datei).': 'Server route /api/scan not found. The page must run on Vercel (not as a local file).',
        'Netzwerkfehler – keine Verbindung zur API. Prüfe Internet/Adblocker.': 'Network error – no connection to the API server. Check internet/ad blocker.',
        'Netzwerkfehler – keine Verbindung zum Scan-Server.': 'Network error – no connection to the scan server.',
        'Keine Speedups im Screenshot erkannt.': 'No speedups detected in the screenshot.', 'Keine Edelsteine im Screenshot erkannt.': 'No gems detected in the screenshot.',
        'Keine Werte im Screenshot erkannt.': 'No values detected in the screenshot.',
        'Keine AP-Flaschen im Screenshot erkannt. Bitte die Anzahl links von Hand eintragen.': 'No AP bottles detected in the screenshot. Please enter the numbers on the left.',
        'Bitte mindestens eine Flaschen-Anzahl eintragen.': 'Please enter at least one bottle count.', 'Bitte mindestens einen Speedup-Wert eintragen.': 'Please enter at least one speedup value.',
        'Bild konnte nicht gelesen werden.': 'Image could not be read.',
        'Verlauf konnte nicht gespeichert werden (LocalStorage blockiert oder voll).': 'History could not be saved (LocalStorage blocked or full).',
        'Chart.js konnte nicht geladen werden (keine Internetverbindung?). Die Tabelle funktioniert trotzdem.': 'Chart.js could not be loaded (no internet?). The table still works.',
        'Diagramm-Bibliothek konnte nicht geladen werden (Internet/Adblocker prüfen).': 'Chart library could not be loaded (check internet/ad blocker).',
        'Der Scan-Server (/api/scan) kennt den Speedup-Scan noch nicht. Trag deinen Bestand links unter „Speedups eingeben“ ein – das wird normal gespeichert.':
          'The scan server (/api/scan) does not know the speedup scan yet. Enter your inventory on the left under “Enter speedups” – it is saved normally.',
        'Der Scan-Server kennt den Statthalter-Scan noch nicht – bitte die neue api/scan.js einspielen.': 'The scan server does not know the governor scan yet – please deploy the new api/scan.js.',
        'Privat-Schalter: bitte zuerst die Spalte is_private in Supabase anlegen (SQL siehe Anleitung).': 'Private switch: please create the column is_private in Supabase first (see SQL instructions).',
        'Gesamten Verlauf (alle gespeicherten Scans) unwiderruflich löschen?': 'Permanently delete the entire history (all saved scans)?',
        // Attribute (Platzhalter, Tooltips)
        'z. B. dein Ingame-Name': 'e.g. your in-game name', 'z. B. ABC1': 'e.g. ABC1', 'z. B. 12345678': 'e.g. 12345678', 'z. B. 1.961.265': 'e.g. 1,961,265',
        'Eintrag löschen': 'Delete entry', 'Farm löschen': 'Delete farm', 'Game Profil öffnen': 'Open game profile', 'Zur Rangliste': 'To leaderboard',
        'Eigenes Bild hochladen': 'Upload your own picture', 'Anfangsbuchstabe': 'Initial', 'Entfernen': 'Remove', 'Sortierung': 'Sorting',
        'Zeitraum': 'Time range', 'Darstellung': 'Display', 'Datenart': 'Data type', 'Ansicht': 'View', 'Bereiche': 'Sections',
        'hoch': 'high', 'mittel': 'medium', 'niedrig': 'low', 'manuell': 'manual',
        // Crafting-Planer
        'Materialien & Crafting-Planer': 'Materials & Crafting Planner',
        'Ist-Ausrüstung scannen, Wunsch-Set wählen – der Planer rechnet Materialien, Goldmünzen und Baupläne aus.': 'Scan your current gear, pick a target set – the planner works out materials, gold coins and blueprints.',
        'Aktives Set': 'Active set', '+ Neues Set erstellen': '+ Create new set', 'Set speichern': 'Save set', 'Set umbenennen': 'Rename set', 'Set löschen': 'Delete set',
        'Name des neuen Sets': 'Name of the new set', 'Neuer Name für das Set': 'New name for the set', 'Übernehmen': 'Apply', 'Abbrechen': 'Cancel', 'z. B. Infanterie Marsch 1': 'e.g. Infantry march 1',
        'Aktuelle Ausrüstung': 'Current equipment', 'Ist-Zustand · per Scan oder von Hand': 'Current state · by scan or by hand', 'Screenshot des Ausrüstungsfensters': 'Screenshot of the equipment window',
        'hierher ziehen oder klicken · max. 2 Bilder · Bilder werden nach dem Auslesen verworfen': 'drop here or click · max. 2 images · images are discarded after reading',
        'Ziel-Ausrüstung': 'Target equipment', 'Wunsch-Set · leere Slots werden nicht berechnet': 'Target set · empty slots are not calculated', 'Ist übernehmen': 'Copy current',
        'Bestehendes Equipment zerlegen (Dismantle)': 'Dismantle existing equipment', 'Rückgabe beim Zerlegen': 'Return when dismantling', 'Material-Kisten zum Auffüllen nutzen': 'Use material chests to fill gaps',
        'Item-Katalog & Materialkosten': 'Item catalog & material costs', 'Standard-Katalog wiederherstellen': 'Restore default catalog', 'Item': 'Item', 'Slot': 'Slot', 'Set': 'Set',
        'Helm': 'Helmet', 'Brust': 'Chest', 'Waffe': 'Weapon', 'Handschuhe': 'Gloves', 'Beine': 'Legs', 'Stiefel': 'Boots', 'Accessoire': 'Accessory', 'Accessoire 1': 'Accessory 1', 'Accessoire 2': 'Accessory 2',
        'leer': 'empty', '– leer –': '– empty –', 'Seltenheit': 'Rarity', 'Slot-Vergleich': 'Slot comparison', 'Ist': 'Current', 'Ziel': 'Target', 'Status': 'Status', 'Kosten': 'Cost', 'Zerlegen': 'Dismantle',
        'identisch': 'identical', 'Platz getauscht': 'slot swapped', 'craften': 'craft', 'kein Ziel': 'no target', 'wird zerlegt': 'will be dismantled',
        'Benötigte Baupläne': 'Required blueprints', 'vorhanden': 'owned', 'fehlt': 'missing', 'Haken setzen, wenn du den Bauplan schon besitzt – gilt für alle Sets.': 'Tick if you already own the blueprint – applies to all sets.',
        'Keine Baupläne nötig – im Ziel-Set muss nichts geschmiedet werden.': 'No blueprints needed – nothing to craft in the target set.',
        'Gesamtbedarf': 'Total requirement', 'legendäre Materialien': 'legendary materials', 'Goldmünzen': 'Gold coins', 'Items zu craften': 'items to craft',
        'Bedarf (legendär)': 'Needed (legendary)', 'Bedarf': 'Needed', 'Bestand': 'Stock', '+ Zerlegen': '+ dismantle', '+ aus Kisten': '+ from chests', 'Überschuss': 'Surplus',
        'Nicht benötigt': 'Not needed', 'Bestand unbekannt': 'Stock unknown', 'Materialien scannen': 'Scan materials', 'Ressourcen scannen': 'Scan resources',
        'Keine Zusatzkosten – das Ziel-Set entspricht der Ist-Ausrüstung oder ist leer.': 'No extra cost – the target set matches your current gear or is empty.',
        'Bestand teilweise unbekannt – bitte Materialien und Ressourcen scannen.': 'Stock partly unknown – please scan materials and resources.',
        'Alles vorhanden – das Set kann geschmiedet werden.': 'Everything available – the set can be crafted.',
        'Claude liest deine Ausrüstung …': 'Claude is reading your equipment …', 'Ein Set mit diesem Namen gibt es schon.': 'A set with this name already exists.',
        'Ziel-Ausrüstung mit der Ist-Ausrüstung überschreiben?': 'Overwrite the target equipment with the current equipment?',
        'Keine Ausrüstung im Screenshot erkannt. Bitte die Slots von Hand wählen.': 'No equipment detected in the screenshot. Please pick the slots by hand.',
        'Der Scan-Server kennt den Ausrüstungs-Scan noch nicht – bitte den Modus „gear“ in api/scan.js ergänzen. Bis dahin die Slots von Hand wählen.': 'The scan server does not know the equipment scan yet – please add the “gear” mode to api/scan.js. Until then pick the slots by hand.',
        'Ist-Zustand · Screenshot scannen oder Slot antippen': 'Current state · scan a screenshot or tap a slot', 'Screenshot scannen': 'Scan screenshot',
        'Item-Katalog': 'Item catalog', 'Quelle': 'Source', 'eigenes': 'custom', 'Eigenes Item': 'Custom item', '+ Eigenes Item': '+ Custom item', 'Eigene Items': 'Custom items',
        'Katalog aus Supabase neu laden': 'Reload catalog from Supabase', 'Lade Katalog aus Supabase …': 'Loading catalog from Supabase …', 'Katalog': 'Catalog',
        'Für diesen Slot gibt es noch keine Items im Katalog.': 'There are no catalog items for this slot yet.',
        'Ist-Ausrüstung scannen, Wunsch-Set wählen – der Planer rechnet aus, welche Materialien dir noch fehlen.': 'Scan your current gear, pick a target set – the planner shows which materials you are still missing.',
        'Bestand unbekannt – bitte zuerst deine Materialien scannen.': 'Stock unknown – please scan your materials first.',
        'Refine-Typ': 'Refine type', 'Bogenschützen': 'Archers', 'Kavallerie': 'Cavalry', 'Infanterie': 'Infantry', 'Tier erhöhen': 'Raise tier', 'Refine fehlt': 'Refine missing', 'Refine fehlt noch': 'Refine still missing', 'Tier': 'Tier',
        'Kommandant wählen': 'Choose commander', 'Primär': 'Primary', 'Sekundär': 'Secondary', 'Antippen zum Wählen': 'Tap to choose', 'Alle': 'All',
        'Name suchen …': 'Search name …', 'Keine Kommandanten gefunden.': 'No commanders found.', 'Slot leeren': 'Clear slot', 'Schließen': 'Close',
        'Kommandant ansehen': 'View commander', 'Kommandant ändern': 'Change commander', 'Kommandant gespeichert': 'Commander saved', 'Slot geleert': 'Slot cleared',
        'Ausrüstung scannen': 'Scan equipment', 'Aus Craft-Set übernehmen': 'Copy from craft set',
        '„✎ Bearbeiten“ zum Anordnen · Set antippen zum Anzeigen · Kommandant oder Ausrüstung antippen zum Ändern · Screenshots werden nach dem Auslesen verworfen.': 'Tap a commander slot to choose · tap an equipment slot to edit · screenshots are discarded after reading.',
        'Hintergrund': 'Background', 'Standard': 'Default', 'Nacht': 'Night', 'Blut': 'Blood', 'Wald': 'Forest', 'Königlich': 'Royal', 'Wüste': 'Desert', 'Eigenes': 'Custom', 'Bild': 'Image',
        'Eigenes Bild hochladen': 'Upload your own image', 'Hintergrund gespeichert': 'Background saved', 'Kommandant antippen zum Übernehmen': 'Tap a commander to apply',
        'Eigenes Bild wird verkleinert gespeichert und ist für alle sichtbar, die deinen Showcase sehen.': 'Your own image is stored downsized and is visible to everyone who sees your showcase.',
        'Bearbeiten': 'Edit', 'Fertig': 'Done', 'Bearbeitungsmodus': 'Edit mode', 'Raster': 'Grid', 'Höhe': 'Height', 'Kompakt': 'Compact', 'Hoch': 'Tall', 'Sehr hoch': 'Very tall',
        'Symmetrisch anordnen': 'Arrange symmetrically', 'Im Showcase anzeigen:': 'Show in showcase:', 'Profilbild': 'Profile picture', 'Set löschen': 'Delete set', '+ Set': '+ Set',
        'Set hinzugefügt': 'Set added', 'Set gelöscht': 'Set deleted', 'Name des Sets (optional), z. B. Infanterie Marsch': 'Set name (optional), e.g. Infantry march',
        'Sets und Anzeigen mit Maus oder Finger verschieben. Mit Raster rasten sie symmetrisch ein – die goldenen Linien markieren die Mitte.': 'Drag sets and displays with mouse or finger. With the grid they snap symmetrically – the golden lines mark the centre.',
        '„✎ Bearbeiten“ zum Anordnen · Set antippen zum Anzeigen · Kommandant oder Ausrüstung antippen zum Ändern · Screenshots werden nach dem Auslesen verworfen.': '“✎ Edit” to arrange · tap a set to show it · tap a commander or equipment to change it · screenshots are discarded after reading.',
        'Download': 'Download', 'Neuer Showcase': 'New showcase', 'Umbenennen': 'Rename', 'Showcase löschen': 'Delete showcase', 'Name': 'Name', 'Allianz-Tag': 'Alliance tag', 'VIP': 'VIP',
        'Größe': 'Size', 'Schriftfarbe': 'Text colour', 'Standardfarbe': 'Default colour', 'Hintergrund-Box': 'Background box', 'Rahmen': 'Frame', 'Schatten': 'Shadow', 'Ausblenden': 'Hide', 'Extra hoch': 'Extra tall',
        'Element auf der Bühne antippen, um Größe, Schriftfarbe und Hintergrund einzustellen.': 'Tap an element on the stage to set size, text colour and background.',
        'Elemente mit Maus oder Finger verschieben, antippen zum Einstellen. Mit Raster rasten sie symmetrisch ein – die goldenen Linien markieren die Mitte.': 'Drag elements with mouse or finger, tap to adjust. With the grid they snap symmetrically – the golden lines mark the centre.',
        'Manuell': 'Manual', 'Screenshot': 'Screenshot', 'Screenshot für dieses Set auswählen': 'Choose a screenshot for this set', 'Anderen Screenshot wählen': 'Choose another screenshot', 'Entfernen': 'Remove',
        'z. B. die Marsch-Ansicht aus dem Spiel · wird verkleinert gespeichert': 'e.g. the march view from the game · stored downsized', 'Kein Screenshot.': 'No screenshot.',
        'Rüstung (Armaments)': 'Armaments', 'Auf der Bühne anzeigen': 'Show on stage', 'Inschriften': 'Inscriptions', '+ Inschrift': '+ Inscription', 'Formation': 'Formation', 'Truppe': 'Troop', 'Vorschau': 'Preview',
        'Infanterie': 'Infantry', 'Kavallerie': 'Cavalry', 'Bogenschützen': 'Archers', 'Belagerung': 'Siege', 'Alle Truppen': 'All troops', 'Angriff %': 'Attack %', 'Verteidigung %': 'Defense %', 'Leben %': 'Health %', 'Marschgeschw. %': 'March speed %',
        'Gold': 'Gold', 'Blau': 'Blue', 'Grau': 'Grey', 'Lade Hintergrund hoch …': 'Uploading background …', 'Lade Screenshot hoch …': 'Uploading screenshot …',
        'Screenshot gespeichert': 'Screenshot saved', 'Screenshot entfernt': 'Screenshot removed', 'Showcase erstellt': 'Showcase created', 'Umbenannt': 'Renamed', 'Showcase gelöscht': 'Showcase deleted',
        '☁ in der Cloud gespeichert': '☁ saved to cloud', '☁ im Account gespeichert': '☁ saved in your account', 'Screenshot von diesem Set entfernen?': 'Remove the screenshot from this set?',
        '✓ Im Account gespeichert · für andere Spieler sichtbar erst nach dem SQL-Update (Spalte showcase)': '✓ Saved in your account · visible to other players after the SQL update (column showcase)',
        'Bild direkt im Showcase gespeichert – für kürzere Ladezeiten das Storage-SQL ausführen (Bucket „showcase“).': 'Image stored directly in the showcase – run the storage SQL (bucket “showcase”) for faster loading.',
        'Download-Bibliothek konnte nicht geladen werden (Internet/Adblocker prüfen).': 'Download library could not be loaded (check internet/ad blocker).', 'Download fehlgeschlagen.': 'Download failed.',
        'Füllung': 'Fill', 'Rand': 'Border', 'keine': 'none', 'kein': 'none', 'keiner': 'none', 'Deckkraft': 'Opacity', '↺ Standardwerte': '↺ Defaults', "✥ Frei bewegen": "✥ Move freely", "Elemente komplett frei bewegen – ohne Raster, Einrasten, Hilfslinien und Sync. Tipp: Alt-Taste beim Ziehen gedrückt halten geht auch.": "Move elements completely freely – without grid, snapping, guides and sync. Tip: holding Alt while dragging works too.", "✥ Frei bewegen ist an – Elemente bleiben genau dort liegen, wo du sie loslässt.": "✥ Free move is on – elements stay exactly where you drop them.", "⊞ Frei bewegen aus – Raster und Sync gelten wieder.": "⊞ Free move off – grid and sync apply again.", "✥ Frei platziert": "✥ Placed freely", "Wird nicht automatisch verschoben.": "Is not moved automatically.", "⊞ Wieder einrasten": "⊞ Snap back", "Anordnung": "Layout", "▤ 1 Spalte": "▤ 1 column", "▥ 2 Spalten": "▥ 2 columns", "⚔ Rüstung": "⚔ Armament", "🖐 Freie Ansicht": "🖐 Free view", "Freie Ansicht: zoomen und verschieben, ohne etwas zu verändern": "Free view: zoom and pan without changing anything", "Herauszoomen": "Zoom out", "Hineinzoomen": "Zoom in", "Zoom zurücksetzen": "Reset zoom", "🗑 Entfernen": "🗑 Remove", "Ausgewähltes Element schnell aus dem Bild entfernen (Entf-Taste)": "Quickly remove the selected element from the image (Delete key)", "🗑 Entfernt": "🗑 Removed", "Das letzte Set kann nicht entfernt werden – stattdessen „Set zurücksetzen“ nutzen.": "The last set cannot be removed – use “Reset set” instead.", "↺ Set zurücksetzen": "↺ Reset set", "Nur dieses Set leeren: Kommandanten, Ausrüstung, Rüstung und Werte – Position und Größe bleiben": "Clear only this set: commanders, equipment, armament and stats – position and size stay", "↺ Set zurückgesetzt": "↺ Set reset", "Element auf der Bühne oder oben antippen, um es einzustellen. Ziehen verschiebt es – mit Raster rastet es symmetrisch ein.": "Tap an element on the stage or above to adjust it. Dragging moves it – with the grid it snaps symmetrically.", "📷 Ausrüstung gescannt": "📷 Equipment scanned", "📷 Rüstung gescannt": "📷 Armament scanned", "Gescanntes Bild": "Scanned image", "✓ Übernehmen": "✓ Apply", "Abbrechen": "Cancel", "Mit „Übernehmen“ wird alles ersetzt, auch was vorher eingetragen war. Danach lässt sich alles von Hand ändern.": "“Apply” replaces everything, including what was entered before. Everything can be changed by hand afterwards.", "Scan verworfen – nichts geändert.": "Scan discarded – nothing changed.", "– leer –": "– empty –", "Kommandant 1": "Commander 1", "Kommandant 2": "Commander 2", "Formation": "Formation", "Inschriften": "Inscriptions", "Truppe": "Troop", "⚠ Auf dem Bild wurde keine Ausrüstung erkannt – vielleicht ist es eine Rüstung, ein Kommandanten- oder ein anderes Fenster. Bitte einen Screenshot der Ausrüstung wählen.": "⚠ No equipment was detected in the image – it may be an armament, commander or other screen. Please choose a screenshot of the equipment.", "⚠ Auf dem Bild wurde keine Rüstung erkannt – vielleicht ist es die Ausrüstung oder ein anderes Fenster. Bitte einen Screenshot der Rüstung (Armaments) wählen.": "⚠ No armament was detected in the image – it may be the equipment or another screen. Please choose a screenshot of the armaments.", "👁 Einblenden": "👁 Show", "⊘ Ausblenden": "⊘ Hide", "Sichtbar – antippen zum Einstellen": "Visible – tap to adjust", "Ausgeblendet – antippen zum Einstellen": "Hidden – tap to adjust", "Farbverläufe": "Gradients", "📷 Hochladen": "📷 Upload", "Eigenes Bild": "Own image", "Bild löschen": "Delete image", "Maximal 10 Bilder – zum Hochladen erst eins löschen (✕).": "Maximum 10 images – delete one (✕) to upload another.", "Dieses Bild aus deinen Hintergründen löschen?\n\nShowcases, die es gerade nutzen, behalten es.": "Delete this image from your backgrounds?\n\nShowcases currently using it keep it.", "🗑 Bild gelöscht": "🗑 Image deleted", "Maximal 10 eigene Bilder – bitte erst eins löschen.": "Maximum 10 own images – please delete one first.", "✓ Bild gespeichert und als Hintergrund gesetzt": "✓ Image saved and set as background", "👁 Ansicht": "👁 View", "⊞ Anordnen": "⊞ Arrange", "＋ Hinzufügen": "＋ Add", "Im Showcase anzeigen": "Show in showcase", "✏️ Text": "✏️ Text", "🏯 City-Skin": "🏯 City skin", "↩ Zurück": "↩ Undo", "✖ Abbrechen": "✖ Cancel", "Letzten Schritt rückgängig machen (Strg+Z)": "Undo the last step (Ctrl+Z)", "Aktuellen Stand merken – „Abbrechen“ springt hierher zurück": "Remember the current state – “Cancel” jumps back here", "Bearbeiten abbrechen und den letzten Zwischenstand komplett wiederherstellen": "Cancel editing and fully restore the last checkpoint", "💾 Zwischenstand gespeichert – „✖ Abbrechen“ springt hierher zurück.": "💾 Checkpoint saved – “✖ Cancel” jumps back here.", "✖ Abbrechen?\n\nAlle Änderungen seit dem letzten Zwischenspeichern werden verworfen, der Zwischenstand wird komplett wiederhergestellt und das Bearbeiten beendet.": "✖ Cancel?\n\nAll changes since the last checkpoint are discarded, the checkpoint is fully restored and editing ends.", "✖ Abgebrochen – Zwischenstand wiederhergestellt": "✖ Cancelled – checkpoint restored", "↩ Schritt rückgängig": "↩ Step undone", "💾 Zwischenspeichern": "💾 Save checkpoint", "↶ Abbrechen": "↶ Cancel", "Aktuellen Stand dieses Showcase merken – mit „Abbrechen“ kommst du jederzeit dahin zurück": "Remember the current state of this showcase – “Cancel” brings you back to it at any time", "Alle Änderungen seit dem letzten Zwischenspeichern verwerfen": "Discard all changes since the last checkpoint", "💾 Zwischenstand gespeichert – mit „↶ Abbrechen“ kommst du hierher zurück.": "💾 Checkpoint saved – “↶ Cancel” brings you back here.", "↶ Abbrechen?\n\nAlle Änderungen an diesem Showcase seit dem Zwischenspeichern gehen verloren und der gemerkte Stand wird wiederhergestellt.": "↶ Cancel?\n\nAll changes to this showcase since the checkpoint will be lost and the saved state restored.", "↶ Zwischenstand wiederhergestellt": "↶ Checkpoint restored", "Zwischenstand zu groß für den Browser-Speicher (eigene Bilder) – bitte ein eigenes Hintergrundbild entfernen oder verkleinern.": "Checkpoint too large for browser storage (own images) – please remove or shrink a custom background image.", "◇ Rahmen-Dicke": "◇ Frame thickness", "↺ Nur Rahmen zurücksetzen": "↺ Reset frames only", "↺ Refine & Iconic zurücksetzen": "↺ Reset refine & iconic", "50 = Standard (Regler in der Mitte).": "50 = default (slider in the middle).", "✓ Rahmen zurückgesetzt": "✓ Frames reset", "Rahmen erscheinen bei Items mit Expertise (fertig refined).": "Frames appear on items with expertise (fully refined).", "🔗 Für alle Sets gleich": "🔗 Same for all sets", "Rahmen, Partikel, Orange-Ton, rotes Refine-Symbol und Iconic gelten automatisch für alle Sets dieses Showcase": "Frames, particles, orange tone, red refine icon and iconic apply automatically to all sets of this showcase", "⧉ Auf alle Sets aller Showcases übertragen": "⧉ Apply to all sets of all showcases", "Einmalig auf alle Sets aller Showcases übertragen": "Apply once to all sets of all showcases", "Rahmen- und Symbol-Einstellungen dieses Sets auf alle Sets dieses Showcase übertragen und ab jetzt gemeinsam ändern?": "Apply the frame and icon settings of this set to all sets of this showcase and change them together from now on?", "✓ Gilt jetzt für alle Sets": "✓ Now applies to all sets", "✓ Wieder pro Set einstellbar": "✓ Adjustable per set again", "Rahmen und Symbol-Einstellungen dieses Sets auf alle Sets aller Showcases übertragen?": "Apply the frame and icon settings of this set to all sets of all showcases?", "✨ Glitzer-Partikel bei allen Gold-Rahmen": "✨ Glitter particles on all gold frames", "kein Iconic": "no iconic", "Iconic-Stufen gibt es nur bei legendären Items": "Iconic levels only exist on legendary items", "🎨 Orange-Ton": "🎨 Orange tone", "🎨 Orange-Ton: nach links dunkler orange, nach rechts gelblicher (0 = Standard) – gilt für alle legendären Items dieses Sets.": "🎨 Orange tone: left = darker orange, right = more yellow (0 = default) – applies to all legendary items of this set.", 'Angriff': 'Attack', 'Verteidigung': 'Defense', 'Leben': 'Health', 'Marschgeschw.': 'March Speed', "Was soll gleich sein?": "What should match?", "Ausrichten an": "Align at", "aus": "off", "⚠ Beim Einschalten werden Größen und Positionen sofort angeglichen – dein Bild kann sich verändern.": "⚠ When switched on, sizes and positions are matched right away – your image may change.", "🔗 Set-Einheit": "🔗 Set unit", "Set, Rüstung und Werte bewegen sich zusammen – Rüstung und Werte bleiben unter ihrem Set": "Set, armament and stats move together – armament and stats stay below their set", "🛡 Alle Gear-Sets": "🛡 All gear sets", "Alle Sets einer Reihe gleich groß und auf gleicher Höhe": "All sets in a row same size and at the same height", "⚔ Alle Rüstungen": "⚔ All armaments", "Alle Rüstungen einer Reihe gleich groß und auf gleicher Höhe": "All armaments in a row same size and at the same height", "📊 Alle Werte": "📊 All stats", "Alle Werte-Blöcke gleich groß, gleiche Höhe und gleiche Schrift-Ausrichtung": "All stat blocks same size, same height and same text alignment", "🏯 Alle City-Skins": "🏯 All city skins", "Alle City-Skins gleich groß und je Reihe auf gleicher Höhe": "All city skins same size and at the same height per row", "⚡ Energie · KP · Verdienst": "⚡ Power · KP · Merit", "Die drei Werte-Kästen gleich groß und auf gleicher Höhe": "The three value boxes same size and at the same height", "🔗 Sync eingeschaltet – Größen und Höhen wurden angeglichen.": "🔗 Sync on – sizes and heights were matched.", "⚠ Ausrichtung ändern?\n\nAlle gesyncten Elemente werden neu ausgerichtet – dein Showcase-Bild kann sich dadurch verändern.": "⚠ Change alignment?\n\nAll synced elements will be realigned – your showcase image may change.", "Rüstung auf der Bühne": "Armament on stage", "Werte auf der Bühne": "Stats on stage", "Werte anzeigen": "Show stats", "📊 Werte": "📊 Stats", "⬅ Links": "⬅ Left", "↔ Mitte": "↔ Center", "➡ Rechts": "➡ Right", "Links": "Left", "Rechts": "Right", "Truppentyp zeigen (z. B. „Archer Attack“)": "Show troop type (e.g. “Archer Attack”)", "✨ Expertise-Rahmen & Symbole": "✨ Expertise frames & icons", "Rahmen erscheinen bei Items mit Expertise (fertig refined). Gilt für dieses Set.": "Frames appear on items with expertise (fully refined). Applies to this set.", "Gold · legendäre Items": "Gold · legendary items", "Lila · epische Items": "Purple · epic items", "◇ Rahmen-Größe": "◇ Frame size", "✦ Refine-Größe": "✦ Refine size", "✦ Refine ↔": "✦ Refine ↔", "✦ Refine ↕": "✦ Refine ↕", "🏅 Iconic-Größe": "🏅 Iconic size", "🏅 Iconic ↔": "🏅 Iconic ↔", "🏅 Iconic ↕": "🏅 Iconic ↕", "Das rote Refine-Symbol bleibt immer innerhalb des Rahmens.": "The red refine icon always stays inside the frame.", "⧉ Für alle Sets übernehmen": "⧉ Apply to all sets", "Glitzer-Rand": "Glitter rim", "Kein Rahmen": "No frame", "Rahmen und Symbol-Einstellungen dieses Sets für alle Sets übernehmen?": "Apply the frame and icon settings of this set to all sets?", "✓ Für alle Sets übernommen": "✓ Applied to all sets", "Anderer Rahmen …": "Other frame …", "Rahmen hinzufügen …": "Add frame …", "▢ Rahmen entfernen": "▢ Remove frame", "🔍 Bild im Rahmen": "🔍 Picture in frame", "🛡 Ausrüstung": "🛡 Equipment", '– nur Größe': '– size only', "Rund": "Round", "Rahmen wählen …": "Choose frame …", "Rahmen wählen": "Choose frame", "Rahmen suchen …": "Search frame …", "kein Rahmen": "no frame", "Gear anzeigen": "Show gear", "nur Größe": "size only", "Hilfslinien": "Guides", "Türkise Hilfslinien beim Ziehen": "Cyan guide lines while dragging", "Duplizieren": "Duplicate", "Im Profil zeigen": "Show in profile", "Alle Showcases": "All showcases", "Aktionspunkte": "Action points", "Gesamt-AP": "Total AP", "Flaschen": "Bottles", "Gems gesamt": "Total gems", "Auf der Hand": "On hand", "Im Rucksack": "In backpack", "Anzeige": "Display", "✓ Showcase kopiert": "✓ Showcase copied", "✓ Rahmen gespeichert": "✓ Frame saved", "✓ Rahmen entfernt": "✓ Frame removed", "Garnison": "Garrison", "Profilbild": "Profile picture", 'Skin suchen …': 'Search skin …', '+ 🛡 Garnison': '+ 🛡 Garrison', '+ 🚩 Rally': '+ 🚩 Rally', '🛡 Garnison': '🛡 Garrison', "Garnison": "Garrison", "Rally": "Rally", "Aktualisieren": "Refresh", "Aus der Cloud neu laden und Überlappungen oben/unten auflösen": "Reload from the cloud and fix overlaps at top/bottom", "Oben": "Top", "Mitte": "Middle", "Unten": "Bottom", "Sets und Rüstungen ausrichten an": "Align sets and armaments at", "Rüstung anzeigen": "Show armament", "Nur Kommandanten": "Commanders only", "Symbol": "Icon", "🏰 anzeigen": "Show 🏰", "👑 anzeigen": "Show 👑", "✓ Showcase aktualisiert": "✓ Showcase refreshed", "Sets und Rüstungen gemeinsam verschieben und vergrößern (gleiche Höhe und Größe)": "Move and resize sets and armaments together (same height and size)", "Rasterfarbe": "Grid colour", "Schwarz": "Black", "Orange": "Orange", "Drehung": "Rotation", "Helligkeit": "Brightness", "Kontrast": "Contrast", "Zurücksetzen": "Reset", "Nur Kommandanten (Garnison)": "Commanders only (garrison)", "Leere Slots ausblenden": "Hide empty slots", "Nur Bild": "Image only", "Details zeigen": "Show details", "Nur das Showcase-Bild anzeigen, ohne Sets und Details darunter": "Show only the showcase image, without sets and details below", "+ City-Skin": "+ City skin", "Ausrüstung": "Equipment", "Scannen": "Scan", "Screenshot auch per Drag & Drop auf dieses Feld · max. 2 Bilder · werden nach dem Auslesen verworfen": "Screenshot also via drag & drop onto this field · max. 2 images · discarded after reading", "Materialkosten je Item (Anzahl). In legendärer Qualität sind es legendäre Materialien, in epischer die gleiche Anzahl lila Materialien (= ¼ legendär).": "Material cost per item (amount). In legendary quality these are legendary materials, in epic the same amount of purple materials (= ¼ legendary).", "kein Allianz-Tag": "no alliance tag", "Noch kein VIP-Stand": "No VIP level yet", "+ Neuer Showcase": "+ New showcase", "Andere Spieler sehen alle deine Showcases in deinem Profil.": "Other players see all your showcases in your profile.", "Die Vorschau steht direkt darüber. Alles lässt sich nach dem Scan von Hand ändern.": "The preview is right above. Everything can be changed by hand after the scan.", "– keine –": "– none –", "Flagge": "Flag", "Schriftrolle": "Scroll", "Weiß": "White", "Blau": "Blue", "Gesamtschaden %": "All damage %", "Gesamtschaden": "All Damage", "Kein": "None", "Führung": "Leadership", "Item wählen": "Choose item", "Legendär": "Legendary", "Episch": "Epic", "Noch kein Material-Scan – Rucksack-Bestand unbekannt.": "No material scan yet – backpack inventory unknown.", "Noch keine Items – Tabelle gear_items in Supabase füllen oder „+ Eigenes Item“.": "No items yet – fill table gear_items in Supabase or use “+ Own item”.", "Hinzufügen": "Add", "Entfernen": "Remove", "Weiteren Skin": "Add another skin", "Stärke": "Width", "Expertise": "Expertise", "Aus Set übernehmen …": "Copy from set …", "Inhalt eines anderen Sets übernehmen": "Copy the content of another set", "Rüstung scannen": "Scan armament", "Rüstung (Armaments)": "Armaments", "Vorschau Rüstung": "Armament preview", "Auf der Bühne anzeigen": "Show on stage", "Abstand": "Spacing", "für alle Sets": "for all sets", "Slot leeren": "Clear slot", "– leer – unten ein Bild antippen": "– empty – tap an image below", "Größe & Effekt": "Size & effect", "Schrift": "Text", "Füllung": "Fill", "Rahmen": "Frame", "Rand": "Border", "Ausblenden": "Hide", "Standardwerte": "↺ Defaults", "Text löschen": "Delete text", "Skin entfernen": "Remove skin", "Skin wählen …": "Choose skin …", "Weiterer City-Skin": "Additional city skin", "Eigener Text": "Custom text", "Sonstige": "Other", "Formation wählen, um Rüstungen und Inschriften aus der Liste anzutippen.": "Choose a formation to tap armaments and inscriptions from the list.", "Claude liest deine Rüstung …": "Claude is reading your armament …", "Claude liest Ausrüstung und Kommandanten und gleicht sie mit deinen Bildern ab …": "Claude is reading equipment and commanders and matching them with your images …", "Keine Rüstung im Screenshot erkannt.": "No armament detected in the screenshot.", "Maximal 12 Inschriften.": "Maximum 12 inscriptions.", "Maximal 6 weitere City-Skins.": "Maximum 6 additional city skins.", "Keine Bilder für diesen Typ.": "No images for this type.", "Hinweis: anderer Typ als dieser Slot – nur wählen, wenn das Item falsch einsortiert ist.": "Note: different type than this slot – only choose if the item is sorted wrongly.", "Andere Spieler sehen alle deine Showcases in deinem Profil": "Other players see all your showcases in your profile", "Alexander der Große": "Alexander the Great", "Alexander Newski": "Alexander Nevsky", "Assurbanipal": "Ashurbanipal", "Björn Eisenseite": "Björn Ironside", "Dschingis Khan": "Genghis Khan", "Edward von Woodstock": "Edward of Woodstock", "Eleonore von Aquitanien": "Eleanor of Aquitaine", "Elisabeth I.": "Elizabeth I", "Friedrich I.": "Frederick I", "Gilgamesch": "Gilgamesh", "Heinrich V.": "Henry V", "Hektor": "Hector", "Herakleios": "Heraclius", "Iwan III.": "Ivan III", "Jeanne d’Arc": "Joan of Arc", "Jeanne d’Arc (Episch)": "Joan of Arc (Epic)", "Johann Hunyadi": "John Hunyadi", "Karl der Große": "Charlemagne", "Karl Martell": "Charles Martel", "Kasimir III.": "Casimir III", "Kleopatra VII.": "Cleopatra VII", "Konstantin der Große": "Constantine the Great", "Kyros der Große": "Cyrus the Great", "Margarete I.": "Margaret I", "Maria I.": "Mary I", "Mehmed II.": "Mehmed II", "Moctezuma I.": "Montezuma I", "Nebukadnezar II.": "Nebuchadnezzar II", "Osman I.": "Osman I", "Pakal der Große": "Pakal the Great", "Philipp II.": "Philip II", "Pippin der Jüngere": "Pepin the Short", "Ramses II.": "Ramesses II", "Richard I.": "Richard I", "Sargon der Große": "Sargon the Great", "Shapur I.": "Shapur I", "Stephan I.": "Stephen I", "Süleyman I.": "Suleiman I", "Thutmosis III.": "Thutmose III", "Wilhelm I.": "William I", "Katharina": "Catherine", "Mathilde von Flandern": "Matilda of Flanders", "Perikles": "Pericles", "Drachenlanzer": "Dragon Lancer", "Schützin": "Markswoman", "Stadtwächter": "City Keeper", "Zenturio": "Centurion", "Afonso I.": "Afonso I", "Artemisia I.": "Artemisia I", "David IV.": "David IV", "Justinian I.": "Justinian I", "Belisarius (Episch)": "Belisarius (Epic)", "Boudica (Episch)": "Boudica (Epic)", "Hermann (Episch)": "Hermann (Epic)", "Scipio (Episch)": "Scipio (Epic)", "Sun Tzu (Episch)": "Sun Tzu (Epic)", "Ragnar (alt)": "Ragnar (old)", "Kommandant": "Commander", '📐 Größe & Effekt': '📐 Size & effect', '🎨 Schrift': '🎨 Text', '▦ Füllung': '▦ Fill', '▢ Rahmen': '▢ Frame', '▢ Rand': '▢ Border', '👁 Ausblenden': '👁 Hide', 'Dein Text': 'Your text', 'Symmetrisch angeordnet': 'Arranged symmetrically',
        '⚠ Wirklich alles symmetrisch anordnen?\n\nAlle Sets, Rüstungen und Anzeigen dieses Showcase werden automatisch neu platziert – deine eigene Anordnung geht dabei verloren.': '⚠ Really arrange everything symmetrically?\n\nAll sets, armaments and displays of this showcase will be repositioned automatically – your own layout will be lost.',
        'Im Profil zeigen': 'Show in profile', 'Alle Showcases': 'All showcases', '🔒 Niemand – alles privat': '🔒 Nobody – all private', 'Privat': 'Private', 'Öffentlich': 'Public',
        'Nur für dich sichtbar': 'Only visible to you', 'Für andere sichtbar': 'Visible to others', 'Privat – nur für dich sichtbar': 'Private – only visible to you', 'Sichtbarkeit gespeichert': 'Visibility saved',
        '🔒 Dein Showcase ist privat – andere Spieler sehen ihn nicht.': '🔒 Your showcase is private – other players cannot see it.',
        '👁 Andere sehen alle Showcases – außer Sets, die auf 🔒 privat stehen.': '👁 Others see all showcases – except sets set to 🔒 private.',
        '👁 Andere sehen nur den ausgewählten Showcase – außer Sets, die auf 🔒 privat stehen.': '👁 Others only see the selected showcase – except sets set to 🔒 private.',
        'Showcase ist jetzt privat': 'Showcase is now private', 'Set ist jetzt privat – andere sehen es nicht': 'Set is now private – others cannot see it', 'Set ist jetzt für andere sichtbar': 'Set is now visible to others',
        'Die Vorschau erscheint oben rechts neben der Ausrüstung.': 'The preview appears above, to the right of the equipment.',
        'Slot links antippen, um Item, Tier und Refine zu ändern.': 'Tap a slot on the left to change item, tier and refine.', 'Vorschau Rüstung': 'Armament preview', 'Die Vorschau steht direkt darüber.': 'The preview is shown right above.',
        'Bitte bestätigen': 'Please confirm', 'Bestätigen': 'Confirm', 'Hinweis': 'Notice', 'Eingabe': 'Input', 'OK': 'OK',
        'Name des neuen Showcase:': 'Name of the new showcase:', 'Neuer Name für den Showcase:': 'New name for the showcase:',
        'Lese ID und Allianz-Tag …': 'Reading ID and alliance tag …',
        'Königreich': 'Kingdom', 'Allianz-Name': 'Alliance name', 'Allianz': 'Alliance', 'City-Skin': 'City skin', 'City-Skin wählen': 'Choose city skin', 'Eigenes Bild': 'Own image', 'Skin entfernen': 'Remove skin',
        'Skin wählen …': 'Choose skin …', 'Eigener Text': 'Custom text', 'Text': 'Text', 'Dein Text': 'Your text', 'leer = automatisch': 'empty = automatic', 'Text löschen': 'Delete text', '+ Text': '+ Text',
        'Weitere Skins kommen dazu, sobald sie hinterlegt sind.': 'More skins will be added once they are available.', 'Lade Bild hoch …': 'Uploading image …',
        'City-Skin gespeichert': 'City skin saved', 'City-Skin entfernt': 'City skin removed', 'Maximal 12 eigene Texte pro Showcase.': 'Maximum 12 custom texts per showcase.',
        'z. B. 1234': 'e.g. 1234', 'z. B. Saints of 79': 'e.g. Saints of 79',
        '✓ Gespeichert · Königreich/Allianz-Name sind für andere erst nach dem SQL-Update sichtbar': '✓ Saved · kingdom/alliance name are visible to others after the SQL update',
        'Showcase': 'Showcase', 'Kommandanten scannen': 'Scan commanders', '+ Von Hand': '+ Manually', 'Aufklappen / zuklappen': 'Expand / collapse',
        'Erweckt': 'Awakened', 'Sterne': 'Stars', 'Skills': 'Skills', 'Level': 'Level', 'Name': 'Name', 'Speichern': 'Save', 'Bearbeiten': 'Edit', 'Löschen': 'Delete',
        'Claude liest deine Kommandanten …': 'Claude is reading your commanders …', '✓ Showcase gespeichert': '✓ Showcase saved', 'Keine Kommandanten im Screenshot erkannt.': 'No commanders detected in the screenshot.',
        'Dieser Spieler hat noch keinen Showcase.': 'This player has no showcase yet.',
        'Noch kein Showcase – lade Screenshots deiner Kommandanten hoch („📷 Kommandanten scannen“) oder trag sie von Hand ein.': 'No showcase yet – upload screenshots of your commanders (“📷 Scan commanders”) or add them manually.',
        '✓ Lokal gespeichert · für andere Spieler sichtbar erst nach dem SQL-Update (Spalte showcase)': '✓ Saved locally · visible to other players after the SQL update (column showcase)',
        'Der Scan-Server kennt den Showcase-Scan noch nicht – bitte den Modus „showcase“ in api/scan.js ergänzen. Bis dahin Kommandanten über „+ Von Hand“ eintragen.': 'The scan server does not know the showcase scan yet – please add the “showcase” mode to api/scan.js. Until then add commanders with “+ Manually”.',
        'Bis zu 5 Screenshots deiner Kommandanten-Ansicht · Bilder werden nach dem Auslesen sofort verworfen · gleiche Kommandanten werden aktualisiert statt doppelt angelegt.': 'Up to 5 screenshots of your commander view · images are discarded right after reading · existing commanders are updated instead of duplicated.',
        'Modus': 'Mode', 'Full Sync – alles fest verbunden': 'Full Sync – everything locked together', 'Partial Sync – angehakte Teile verbunden': 'Partial Sync – ticked parts linked',
        'Free Mode – alles frei beweglich': 'Free Mode – everything moves freely',
        'Full Sync: alle Teile fest in einer Einheit, ein Ziehen bewegt alles': 'Full Sync: all parts locked in one unit, one drag moves everything',
        'Partial Sync: angehakte Teile bewegen sich zusammen, der Rest frei': 'Partial Sync: ticked parts move together, the rest freely',
        'Free Mode: jedes Teil einzeln und völlig frei': 'Free Mode: every part on its own and completely free',
        'Im Full Sync ist alles fest verbunden – für eine eigene Auswahl auf Partial Sync wechseln.': 'In Full Sync everything is locked together – switch to Partial Sync for your own selection.',
        'Im Free Mode ist nichts verbunden – für eine eigene Auswahl auf Partial Sync wechseln.': 'In Free Mode nothing is linked – switch to Partial Sync for your own selection.',
        'Sync Set – was wird zusammengepackt': 'Sync set – what gets packed together', 'Mit Set syncen': 'Sync with set', 'Alle Sets': 'All sets', 'Vorschau': 'Preview', 'Alles ausgeblendet': 'Everything hidden', 'So sieht das Set gerade aus': 'This is how the set looks right now', 'Supabase verlangt eine E-Mail-Bestätigung. Für Accounts mit Benutzernamen bitte in Supabase unter Authentication → Sign In / Providers → Email die Option „Confirm email“ ausschalten – oder mit E-Mail registrieren.': 'Supabase requires email confirmation. For accounts with usernames, please turn off “Confirm email” in Supabase under Authentication → Sign In / Providers → Email – or register with an email.', 'Du bist noch nicht in der Rangliste. Scanne dein VIP oder trag unter': 'You are not on the leaderboard yet. Scan your VIP or enter your current VIP points under', 'deine aktuellen VIP-Punkte ein.': '.', "Abstand der beiden Kommandanten": "Spacing between the two commanders", "Alles, was zum Gear gehört, auf Standard zurücksetzen (100 %, Standard-Position, Formation in der Rüstung)": "Reset everything that belongs to the gear to default (100 %, default position, formation inside the armament)", "Kommandanten, Namen, Ausrüstung, Rüstung, Formation und Werte wieder sauber zentriert untereinander packen": "Stack commanders, names, equipment, armament, formation and stats neatly centred again", "⚠ Set auf Standard zurücksetzen?\n\nKommandanten, Namen, Ausrüstung, Rüstung, Formation und Werte dieses Sets bekommen wieder 100 % Größe und ihre Standard-Position. Eigene Größen und Positionen dieses Sets gehen verloren.": "⚠ Reset set to default?\n\nCommanders, names, equipment, armament, formation and stats of this set get 100 % size and their default position again. Custom sizes and positions of this set will be lost.", "Set auf Standard zurücksetzen?\n\nKommandanten, Namen, Ausrüstung, Rüstung, Formation und Werte dieses Sets bekommen wieder 100 % Größe und ihre Standard-Position. Eigene Größen und Positionen dieses Sets gehen verloren.": "Reset set to default?\n\nCommanders, names, equipment, armament, formation and stats of this set get 100 % size and their default position again. Custom sizes and positions of this set will be lost.", "Weiterer City-Skin": "Additional city skin", "Alle Speedups": "All speedups", "Claude erkennt selbst, ob es eine Ressourcen-Übersicht oder Inventar mit VIP-Packs ist.": "Claude detects by itself whether it is a resource overview or an inventory with VIP packs.", "Cloud gerade nicht erreichbar – wird automatisch erneut gespeichert": "Cloud unreachable right now – will be saved again automatically", "Diese E-Mail-Adresse wird nicht akzeptiert. Bei reinen Benutzernamen: siehe Hinweis zur Einrichtung (E-Mail-Bestätigung ausschalten).": "This email address is not accepted. For plain usernames: see the setup note (turn off email confirmation).", "Download-Bibliothek konnte nicht geladen werden.": "Download library could not be loaded.", "Item löschen": "Delete item", "Liest Leder, Eisenerz, Ebenholz und Tierknochen in allen Seltenheiten und rechnet sie in Legendär um.": "Reads leather, iron ore, ebony and animal bone in all rarities and converts them to legendary.", "Liest Proviant, Holz, Stein und Gold – aus der Ressourcenleiste oder dem Ressourcen-Inventar.": "Reads food, wood, stone and gold – from the resource bar or the resource inventory.", "Liest VIP-Punkte-Kacheln aus dem Inventar (Wert × Anzahl) und berechnet den Weg zu deinem Ziel-Level.": "Reads VIP point tiles from the inventory (value × quantity) and calculates the way to your target level.", "Liest deine AP-Flaschen (50, 100, 500, 1.000) aus dem Inventar, füllt die 4 Felder vor und rechnet die Gesamt-AP aus.": "Reads your AP bottles (50, 100, 500, 1,000) from the inventory, pre-fills the 4 fields and calculates the total AP.", "Liest deine Beschleuniger (Universal, Bau, Forschung, Training, Heilung) aus dem Inventar und rechnet die Gesamtzeit aus.": "Reads your speedups (universal, building, research, training, healing) from the inventory and calculates the total time.", "Liest die Anzahl deiner Edelsteine und speichert sie im Verlauf.": "Reads the number of your gems and saves it in the history.", "Supabase-Storage nicht verfügbar – Bild wird direkt im Showcase gespeichert": "Supabase storage not available – image is saved directly in the showcase", "Texterkennung (Tesseract) konnte nicht geladen werden. Trag deine AP links unter „AP eingeben“ ein.": "Text recognition (Tesseract) could not be loaded. Enter your AP on the left under “Enter AP”.", "für die Punkte-Rechnung": "for the points calculation", "öffentlich": "public", "↺ Refine & Iconic zurücksetzen": "↺ Reset refine & iconic", "✨ Expertise-Rahmen & Symbole": "✨ Expertise frames & symbols", "Übernehmen": "Apply", '⇕ Ausrichten': '⇕ Align', '↺ Standard': '↺ Default', '⇕ Set ausgerichtet': '⇕ Set aligned', '↺ Set auf Standard zurückgesetzt': '↺ Set reset to default', '🔒 Im Full Sync ist alles fest verbunden – für eine eigene Auswahl auf Partial Sync wechseln.': '🔒 In Full Sync everything is locked together – switch to Partial Sync for a custom selection.', 'Free Mode: jedes Teil bewegt sich einzeln. Verknüpfungen bleiben gespeichert und greifen wieder im Full / Partial Sync.': 'Free Mode: every part moves on its own. Links stay saved and apply again in Full / Partial Sync.', 'Full Sync: das ganze Set und alle verknüpften Sets bewegen sich komplett. Partial Sync: nur die angehakten Teile bewegen sich – in diesem Set und in jedem verknüpften Set. Nicht angehakte Teile bleiben frei beweglich.': 'Full Sync: the whole set and every linked set move completely. Partial Sync: only the checked parts move – in this set and in every linked set. Unchecked parts stay free.', '⨯ Syncs zurücksetzen': '⨯ Reset syncs', 'Alle Verknüpfungen lösen – nichts verschiebt sich': 'Unlink all sets – nothing moves', 'Aus': 'Off',
        
        'Alle auf': 'All to', 'Dieses Set': 'This set',
        'Sync Set': 'Sync set', 'Set-Einstellungen': 'Set settings', 'Kommandanten': 'Commanders', 'Namen': 'Names', 'Rüstung': 'Armament', 'Werte': 'Stats',
        'Set synchronisiert': 'Set synced', 'Formation im Rüstungs-Panel unten wählen': 'Choose the formation in the armament panel below',
        'Fixes Set: Kommandanten, Namen, Gear, Rüstung und Werte bewegen sich zusammen': 'Fixed set: commanders, names, gear, armament and stats move together',
        'Sync Set: alles wieder zusammenpacken und untereinander aufreihen': 'Sync set: pack everything together again and line it up underneath',
        'Kommandanten anzeigen': 'Show commanders', 'Kommandanten-Namen anzeigen': 'Show commander names', 'Fixes Set': 'Fixed set', 'Freies Set': 'Free set',
        'Namen-Farbe': 'Name colour', 'Über': 'Above', 'Unter': 'Below', 'Formation einzeln (frei bewegen)': 'Formation separate (move freely)',
        'Freies Set – Kommandanten, Namen und Ausrüstung einzeln bewegen': 'Free set – move commanders, names and equipment separately',
        'Set wieder zusammengefügt': 'Set joined again', 'Fixes Set: alles wieder zusammen wie vorher': 'Fixed set: everything joined like before',
        'Freies Set: Kommandanten, Namen und Ausrüstung einzeln verschieben, vergrößern und drehen': 'Free set: move, resize and rotate commanders, names and equipment separately',
        'Set gespeichert · in der Cloud (user_state)': 'Set saved · in the cloud (user_state)', 'Lokal gespeichert · Cloud gerade nicht erreichbar, wird automatisch nachgeholt': 'Saved locally · cloud unreachable, will sync automatically'
      },
      patterns: [
        [/^Bitte nur Zahlen eintragen, z\. B\. 85\.141\.754 oder 85,1M: (.+)$/, (m, f) => 'Please enter numbers only, e.g. 85,141,754 or 85.1M: ' + f.split(', ').map(x => tr(x)).join(', ')],
        [/^Der Screenshot zeigt die ID (\d+), in deinem Profil steht die ID (\d+)\.\n\nWerte trotzdem übernehmen\?$/, 'The screenshot shows ID $1, but your profile has ID $2.\n\nUse the values anyway?'],
        [/^✓ Größe (\d+) % übernommen$/, '✓ Size $1 % applied'],
        [/^Item „(.+)“ löschen\?(\n\nEs wird in mindestens einem Set verwendet – dieser Slot gilt danach als leer\.)?$/, (m, n, u) => `Delete item “${n}”?` + (u ? '\n\nIt is used in at least one set – that slot will be empty afterwards.' : '')],
        [/^(Kommandanten|Namen|Ausrüstung|Formation) · (.+)$/, (m, a, b) => ({ 'Kommandanten': 'Commanders', 'Namen': 'Names', 'Ausrüstung': 'Equipment', 'Formation': 'Formation' })[a] + ' · ' + b],
        [/^Nur „(.+)“$/, 'Only “$1”'],
        [/^Erkannt · (\d+) Änderung(en)?$/, (m, n) => `Detected · ${n} change${n === '1' ? '' : 's'}`],
        [/^⚠ (\d+) Slot\(s\) nicht sicher erkannt – sie bleiben leer und lassen sich von Hand wählen\.$/, '⚠ $1 slot(s) not reliably detected – they stay empty and can be chosen by hand.'],
        [/^Deine Bilder · (\d+)\/(\d+)$/, 'Your images · $1/$2'],
        [/^Zwischenstand: (.+)$/, 'Checkpoint: $1'],
        [/^↩ Zurück \((\d+)\)$/, '↩ Undo ($1)'],
        [/^⚠ Sync „(.+)“ einschalten\?\n\nGrößen und Positionen werden sofort angeglichen – dein Showcase-Bild kann sich dadurch verändern\.$/, (m, k) => `⚠ Turn on sync “${I18N.tr(k)}”?\n\nSizes and positions are matched right away – your showcase image may change.`],
        [/^📊 Werte · (.+)$/, '📊 Stats · $1'],
        [/^(🛡 Garnison|🚩 Rally) (\d)$/, (m, k, n) => k.replace('Garnison', 'Garrison') + ' ' + n],
        [/^✓ (🛡 Garnison|🚩 Rally) hinzugefügt$/, (m, k) => '✓ ' + k.replace('Garnison', 'Garrison') + ' added'],
        [/^(\d+)\/12 gewählt$/, '$1/12 selected'],
        [/^(Helm|Brust|Waffe|Handschuhe|Beine|Stiefel|Accessoire) ★$/, (m, k) => ({ Helm: 'Helmet', Brust: 'Chest', Waffe: 'Weapon', Handschuhe: 'Gloves', Beine: 'Legs', Stiefel: 'Boots', Accessoire: 'Accessory' })[k] + ' ★'],
        [/^(Legendär|Episch|Elite|Normal) · (\d+)$/, (m, k, n) => ({ 'Legendär': 'Legendary', 'Episch': 'Epic', Elite: 'Elite', Normal: 'Normal' })[k] + ' · ' + n],
        [/^☁ (\d+) Items aus Supabase \(Tabelle$/, '☁ $1 items from Supabase (table'],
        [/^\) · (\d+) eigene Items$/, ') · $1 own items'],
        [/^✓ Rüstung erkannt: (\d+) Inschriften(.*)$/, (m, n, r) => `✓ Armament detected: ${n} inscriptions${r.replace('Sicherheit', 'confidence')}`],
        [/^✓ Übernommen aus „(.+)“$/, 'Copied from “$1”'],
        [/^Kommandanten und Ausrüstung von „(.+)“ mit „(.+)“ überschreiben\?$/, 'Overwrite commanders and equipment of “$1” with “$2”?'],
        [/^✓ Abstand Stufe (\d) für alle Sets übernommen$/, '✓ Spacing level $1 applied to all sets'],
        [/^Stufe (\d)( \((weit|eng)\))?$/, (m, n, x, w) => 'Level ' + n + (w ? (w === 'weit' ? ' (wide)' : ' (tight)') : '')],
        [/^(.+) \(Episch\)$/, '$1 (Epic)'],
        [/^„(.+)“ aus dem Showcase löschen\?$/, 'Delete “$1” from the showcase?'],
        [/^(Infanterie|Kavallerie|Bogenschützen|Belagerung|Alle Truppen) (Angriff|Verteidigung|Leben|Marschgeschw\.)$/, (m, t, k) => ({ 'Infanterie': 'Infantry', 'Kavallerie': 'Cavalry', 'Bogenschützen': 'Archer', 'Belagerung': 'Siege', 'Alle Truppen': 'All Troop' })[t] + ' ' + ({ 'Angriff': 'Attack', 'Verteidigung': 'Defense', 'Leben': 'Health', 'Marschgeschw.': 'March Speed' })[k]],
        [/^(\d)\/7 Sets$/, '$1/7 sets'], [/^Königreich (.+)$/, 'Kingdom $1'], [/^Nur „(.+)“$/, 'Only “$1”'], [/^Rüstung · (.+)$/, 'Armaments · $1'],
        [/^Showcase „(.+)“ wirklich löschen\? Das kann nicht rückgängig gemacht werden\.$/, 'Really delete showcase “$1”? This cannot be undone.'],
        [/^Kommandant wählen · (Primär|Sekundär)$/, (m, k) => 'Choose commander · ' + (k === 'Primär' ? 'Primary' : 'Secondary')],
        [/^✓ Ausrüstung aus „(.+)“ übernommen$/, '✓ Equipment copied from “$1”'],
        [/^Showcase-Ausrüstung mit der Ist-Ausrüstung aus „(.+)“ überschreiben\?$/, 'Overwrite the showcase equipment with the current equipment from “$1”?'],
        [/^(\d+) Kommandanten$/, '$1 commanders'], [/^(\d+) Kommandanten ausgewertet \((\d+) neu, (\d+) aktualisiert\)$/, '$1 commanders analyzed ($2 new, $3 updated)'],
        [/^„(.+)“ aus dem Showcase entfernen\?$/, 'Remove “$1” from the showcase?'], [/^Entfernt$/, 'Removed'],
        [/^⚠ In Supabase fehlt die Spalte$/, '⚠ Supabase is missing the column'], [/^– Werte werden vorerst aus den Scans gelesen und nicht dauerhaft in der Rangliste gespeichert\.$/, '– values are read from the scans for now and not stored in the leaderboard.'],
        [/^(.+) scannen$/, (m, l) => 'Scan ' + L(l)],
        [/^Fortschritt zu (VIP \d+|SVIP)$/, 'Progress to $1'], [/^([\d,.]+) % von (VIP \d+|SVIP) bis (VIP \d+|SVIP)$/, '$1 % from $2 to $3'], [/^bis (VIP \d+|SVIP)$/, 'to $1'],
        [/^noch ([\d.,]+) Punkte · (\d+) %$/, '$1 points left · $2 %'],
        [/^Noch ([\d.,]+) Punkte bis Platz (\d+) \((.+)\)$/, '$1 more points to rank $2 ($3)'],
        [/^Noch ([\d.,]+) (Kill-Punkte|Verdienst) bis Platz (\d+) \((.+)\)$/, (m, a, l, b, c) => `${a} more ${L(l)} to rank ${b} (${c})`],
        [/^Du führst die (.+)-Rangliste an! (.*)$/, (m, l, i) => `You lead the ${L(l)} leaderboard! ${i}`],
        [/^Für dich ist noch kein (.+)-Wert gespeichert\. Öffne dein$/, (m, l) => `No ${L(l)} value saved for you yet. Open your`],
        [/^Alle Spieler, sortiert nach (.+?) – Name anklicken öffnet das Game Profil$/, (m, w) => `All players, sorted by ${SORT[w] || w} – click a name to open the game profile`],
        [/^Stand: (.+?) · (\d+) Spieler$/, 'As of $1 · $2 players'], [/^Stand: (.+)$/, 'As of $1'],
        [/^Letzter Scan: (.+)$/, (m, r) => 'Last scan: ' + r.replace(/ · Sicherheit: (.+)$/, (x, c) => ' · Confidence: ' + (T()[c] || c))], [/^aktualisiert (.+)$/, 'updated $1'], [/^Statthalter-Profil vom (.+)$/, 'Governor profile from $1'],
        [/^seit (.+)$/, (m, r) => 'since ' + r.replace(/ · ≈ ([\d.,]+) Tage$/, ' · ≈ $1 days')],
        [/^(\d+) Scans gespeichert \((\d+) Speedups, (\d+) Ressourcen, (\d+) VIP, (\d+) Gems, (\d+) AP, (\d+) Mats, (\d+) Passports, (\d+) Goldheads, (\d+) Keys, (\d+) Armaments\) · nur Zahlenwerte, keine Bilder$/,
          '$1 scans saved ($2 speedups, $3 resources, $4 VIP, $5 gems, $6 AP, $7 mats, $8 passports, $9 goldheads, $10 keys, $11 armaments) · numbers only, no images'],
        [/^(AP|Speedups|VIP|Gems|Ressourcen|Mats|Passports|Goldheads|Keys|Armaments) (eingeben|speichern)$/, (m, a, v) => (v === 'speichern' ? 'Save ' : 'Enter ') + (T()[a] || a)],
        [/^2 · (Goldheads|Keys|Armaments) eingeben$/, '2 · Enter $1'],
        [/^Keine (Goldheads|Keys|Armaments) im Screenshot erkannt\. Bitte die Anzahl links von Hand eintragen\.$/, 'No $1 detected in the screenshot. Please enter the number on the left manually.'],
        [/^([\d.,]+) Gold · ([\d.,]+) Silber$/, '$1 gold · $2 silver'],
        [/^([\d.,]+) (Goldheads|Teile)$/, (m, n, u) => n + (u === 'Teile' ? ' pieces' : ' goldheads')],
        [/^✓ Ausgewertet \((.+?)\)\. Falls eine Zahl nicht stimmt: Feld korrigieren und „(.+?) speichern“ – das überschreibt diesen Scan\.$/,
          (m, c, t) => `✓ Analyzed (${T()[c] || c}). If a number is wrong: correct the field and click “Save ${t}” – this overwrites the scan.`],
        [/^(\d+) Scans gespeichert \((\d+) Speedups, (\d+) Ressourcen, (\d+) VIP, (\d+) Gems, (\d+) AP, (\d+) Mats, (\d+) Passports\) · nur Zahlenwerte, keine Bilder$/,
          '$1 scans saved ($2 speedups, $3 resources, $4 VIP, $5 gems, $6 AP, $7 mats, $8 passports) · numbers only, no images'],
        [/^([23]) · (Passive Income|Ressourcen gesamt)$/, (m, n, t) => `${n} · ${t === 'Passive Income' ? 'Passive income' : 'Resources total'}`],
        [/^🎯 Migrations-Ziel in ca\. (.+) Tagen erreicht$/, '🎯 Migration goal reached in about $1 days'],
        [/^\+(.+) \/ Woche$/, '+$1 / week'],
        [/^(\d+) Werte · pro Woche$/, '$1 values · per week'],
        [/^(\d+) Tage$/, '$1 days'], [/^AP in (\d+) Tage$/, 'AP in $1 days'], [/^\+(.+) AP \/ Tag$/, '+$1 AP / day'], [/^\+(.+) \/ Tag$/, '+$1 / day'],
        [/^≈ (.+) Barbaren$/, '≈ $1 barbarians'], [/^à (.+) AP$/, 'at $1 AP each'], [/^(.+) jetzt \+ (.+) passiv$/, '$1 now + $2 passive'],
        [/^Ø (.+) AP pro Fort \(720 Forts ≈ 430×50er · 373 ≈ 237×50er\)$/, 'avg $1 AP per fort (720 forts ≈ 430×50 bottles · 373 ≈ 237×50)'],
        [/^Ø (.+) AP pro Barbar \(7\.000 Barbaren ≈ 915×100er\)$/, 'avg $1 AP per barbarian (7,000 barbarians ≈ 915×100 bottles)'],
        [/^Noch (.+) Passseiten fehlen$/, '$1 passport pages missing'],
        [/^([\d.,]+) Passseiten$/, '$1 passport pages'],
        [/^([\d.,]+) Legendär$/, '$1 legendary'],
        [/^(AP|Speedups|VIP|Gems|Ressourcen|Mats|Passports|Goldheads|Keys|Armaments) öffnen$/, (m, a) => 'Open ' + (T()[a] || a)],
        [/^✓ Ausgewertet \((.+?)\): (.+?) Passseiten\. Falls die Zahl nicht stimmt: Feld korrigieren und „Passports speichern“ – das überschreibt diesen Scan\.$/,
          (m, c, n) => `✓ Analyzed (${T()[c] || c}): ${n} passport pages. If the number is wrong: correct the field and click “Save passports” – this overwrites the scan.`],
        [/^(\d+) Scans gespeichert \((\d+) Speedups, (\d+) Ressourcen, (\d+) VIP, (\d+) Gems, (\d+) AP\) · nur Zahlenwerte, keine Bilder$/,
          '$1 scans saved ($2 speedups, $3 resources, $4 VIP, $5 gems, $6 AP) · numbers only, no images'],
        [/^(\d+) Scans gespeichert \((\d+) Speedups, (\d+) Ressourcen, (\d+) VIP, (\d+) Gems, (\d+) AP, (\d+) Mats\) · nur Zahlenwerte, keine Bilder$/,
          '$1 scans saved ($2 speedups, $3 resources, $4 VIP, $5 gems, $6 AP, $7 mats) · numbers only, no images'],
        [/^(.+) % zum nächsten legendären Material$/, '$1 % to the next legendary material'], [/^(.+) volle legendäre herstellbar$/, '$1 full legendary craftable'], [/^(\d) von 5 ausgewählt – Kachel antippen zum Ein-\/Ausschließen$/, '$1 of 5 selected – tap a tile to include/exclude'],
        [/^(\d+) % zum nächsten$/, '$1 % to the next'], [/^inkl\. Kisten:$/, 'incl. chests:'], [/^(.+) · (Normal|Fortgeschritten|Advanced|Elite|Episch|Legendär)$/, (m, a, b) => L(a) + ' · ' + L(b)],
        [/^(VIP \d+|SVIP) – ([\d.,]+) Punkte$/, '$1 – $2 points'], [/^([\d.,]+) Punkte · (VIP \d+|SVIP)$/, '$1 points · $2'], [/^([\d.,]+) Punkte$/, '$1 points'],
        [/^von (\d+)$/, 'of $1'], [/^Ziel: (VIP \d+|SVIP)$/, 'Target: $1'], [/^(VIP \d+|SVIP) erreicht! 🎉$/, '$1 reached! 🎉'],
        [/^Aktueller Stand ([\d,.]+) %$/, 'Current $1 %'], [/^Erkennungssicherheit: (.+)$/, (m, c) => 'Confidence: ' + (T()[c] || c)],
        [/^Benötigte Bündnis-Credits · bis (VIP \d+|SVIP)$/, 'Required Alliance Credits · to $1'],
        [/^Punkte fehlen bis (VIP \d+|SVIP) →$/, 'points missing to $1 →'], [/^Punkte fehlen →$/, 'points missing →'],
        [/^Bis zum Ziel (VIP \d+|SVIP)$/, 'To target $1'],
        [/^Grundlage: 100 VIP-Punkte = 50\.000 Bündnis-Credits \(500 Credits je Punkt\)\. Gerechnet mit ([\d.,]+) VIP-Punkten inkl\. Gegenständen\.$/,
          'Basis: 100 VIP points = 50,000 Alliance Credits (500 credits per point). Calculated with $1 VIP points incl. items.'],
        [/^\+ Rucksack-VIP →$/, '+ backpack VIP →'],
        [/^(.+)-Diagramm zurücksetzen$/, (m, l) => `Reset ${L(l)} chart`],
        [/^⚠ (.+)-Diagramm wirklich zurücksetzen\?\n\nAlle (\d+) gespeicherten .+-Scans werden unwiderruflich gelöscht – auch in der Cloud\. Die anderen Diagramme bleiben erhalten\.$/,
          (m, l, n) => `⚠ Really reset the ${L(l)} chart?\n\nAll ${n} saved ${L(l)} scans will be permanently deleted – also in the cloud. The other charts are kept.`],
        [/^Im (.+)-Diagramm sind keine Einträge\.$/, (m, l) => `The ${L(l)} chart has no entries.`],
        [/^Farm „(.+)“ löschen\?$/, 'Delete farm “$1”?'],
        [/^Keine (.+)-Daten im gewählten Zeitraum – „All“ zeigt den ganzen Verlauf\.$/, (m, l) => `No ${L(l)} data in the selected range – “All” shows the full history.`],
        [/^Noch keine (.+)-Scans – scanne sie im Scanner & Dashboard\.$/, (m, l) => `No ${L(l)} scans yet – scan them in Scanner & Dashboard.`],
        [/^Noch keine (.+)-Scans gespeichert\.$/, (m, l) => `No ${L(l)} scans saved yet.`],
        [/^Dieser Spieler hat noch keine (.+)-Daten\.$/, (m, l) => `This player has no ${L(l)} data yet.`],
        [/^Noch kein Scan – „📷 Statthalter-Profil scannen“$/, 'No scan yet – “📷 Scan governor profile”'],
        [/^„📷 Statthalter-Profil scannen“$/, '“📷 Scan governor profile”'],
        [/^✓ Ausgewertet \((.+?)\): ([\d.,]+) AP\. Falls eine Zahl nicht stimmt: Feld korrigieren und „AP speichern“ – das überschreibt diesen Scan\.$/,
          (m, c, n) => `✓ Analyzed (${T()[c] || c}): ${n} AP. If a number is wrong: correct the field and click “Save AP” – this overwrites the scan.`],
        [/^„(.+)" konnte nicht gelesen werden\.$/, '“$1” could not be read.'],
        [/^Profil konnte nicht geladen werden: (.*)$/, (m, e) => 'Profile could not be loaded: ' + tr(e)],
        [/^Rangliste konnte nicht geladen werden: (.*)$/, (m, e) => 'Leaderboard could not be loaded: ' + tr(e)],
        [/^Kombiniert: (.+)$/, (m, k) => 'Combined: ' + k.split(' + ').map(L).join(' + ')],
        [/^Kombiniert \((.+)\)$/, (m, k) => 'Combined (' + k.split(' + ').map(L).join(' + ') + ')'],
        [/^In diesem Browser liegen noch Daten aus der alten Version \(Profil „(.+)“, (\d+) Scans\)\.\n\nIn deinen Cloud-Account übernehmen\?$/,
          'This browser still holds data from the old version (profile “$1”, $2 scans).\n\nMove it into your cloud account?'],
        [/^Fast geschafft! Wir haben eine Bestätigungs-Mail an (.+) geschickt\. Klicke auf den Link und logge dich dann ein\.$/,
          'Almost done! We sent a confirmation e-mail to $1. Click the link, then log in.'],
        [/^Es fehlen noch ([\d.,]+) legendäre (.+)$/, (m, n, l) => `Still missing ${n} legendary ${L(l)}`],
        [/^Es fehlen noch (.+) Goldmünzen$/, 'Still missing $1 gold coins'], [/^Genug (.+) vorhanden$/, (m, l) => `Enough ${L(l)} available`],
        [/^(\d+) von 4 Materialien reichen noch nicht\.$/, '$1 of 4 materials are not enough yet.'], [/^(\d+) von (\d+) vorhanden$/, '$1 of $2 owned'],
        [/^(\d+) von (\d+) Slots erkannt(.*)$/, (m, a, b, r) => `${a} of ${b} slots detected` + r.replace(' – markierte Slots bitte von Hand wählen.', ' – please pick the marked slots by hand.').replace(' · Sicherheit: ', ' · Confidence: ')],
        [/^Set „(.+)“ (erstellt|gelöscht)$/, (m, n, a) => `Set “${n}” ${a === 'erstellt' ? 'created' : 'deleted'}`], [/^Set umbenannt in „(.+)“$/, 'Set renamed to “$1”'],
        [/^Set „(.+)“ wirklich löschen\? Das kann nicht rückgängig gemacht werden\.$/, 'Really delete set “$1”? This cannot be undone.'],
        [/^nicht im Katalog: (.+)$/, 'not in catalog: $1'],
        [/^Der Scan-Server kennt den AP-Scan noch nicht[\s\S]*$/, 'The scan server does not know the AP scan yet (the new api/scan.js is not deployed) and the in-browser fallback could not read the bottles reliably. Please deploy the new api/scan.js – until then enter the number per bottle size on the left.']
      ]
    }
  };
  // Begriffe innerhalb von Mustern
  const LABELS = { 'Ressourcen': 'resources', 'Speedups': 'speedups', 'VIP': 'VIP', 'Gems': 'gems', 'AP': 'AP', 'Kill-Punkte': 'kill points',
    'Verdienst': 'acclaim', 'Statthalter': 'governor', 'Materialien': 'materials', 'Material': 'material', 'Edelstein': 'gem', 'Training': 'Training', 'Universal': 'Universal', 'Heilung': 'Healing' };
  const SORT = { 'VIP-Punkten inkl. VIP durch Gegenstände': 'VIP points incl. VIP from items', 'Kill-Punkten aus dem Statthalter-Profil': 'kill points from the governor profile',
    'höchstem Verdienst aus dem Statthalter-Profil': 'highest acclaim from the governor profile' };
  const L = (w) => LABELS[w] || T()[w] || w;

  let lang = (() => { try { return localStorage.getItem('lang') === 'en' ? 'en' : 'de'; } catch { return 'de'; } })();
  const T = () => translations.en.texts;

  // Einheiten in Zahlen-Texten: "12 Tage, 3 Std., 5 Min." · "12T 3h" · "102 Mio." · "1,2 Mrd."
  function units(s) {
    if (!/\d/.test(s)) return s;
    return s.replace(/(\d) Tage\b/g, '$1 days').replace(/(\d) Tag\b/g, '$1 day').replace(/(\d) Std\./g, '$1 h').replace(/(\d) Min\./g, '$1 min')
            .replace(/(\d)T\b/g, '$1d').replace(/(\d) T\b/g, '$1 d').replace(/(\d) Mio\./g, '$1 M').replace(/(\d) Mrd\./g, '$1 B').replace(/(\d) Tsd\./g, '$1 K')
            .replace(/(\d) Tage$/, '$1 days').replace(/ Spieler$/, ' players').replace(/≈ ([\d.,]+) Tage/g, '≈ $1 days');
  }
  // Übersetzt einen deutschen Text (ganzer Text, sonst mit führendem Symbol/Emoji, sonst Muster, sonst Einheiten)
  function tr(src) {
    if (lang !== 'en' || src == null) return src;
    const s = String(src), t = T();
    if (t[s] != null) return t[s];
    const m = s.match(/^([^A-Za-zÄÖÜäöüß0-9„(+–←]*)([\s\S]*?)(:?)$/);   // Symbole vorn (z. B. "⚔️ ") und ":" hinten abtrennen
    if (m && m[2] && t[m[2]] != null) return m[1] + t[m[2]] + m[3];
    for (const [re, rep] of translations.en.patterns) {
      if (m && m[1] && re.test(m[2])) return m[1] + m[2].replace(re, rep) + m[3];   // erst ohne führendes Symbol
      if (re.test(s)) return s.replace(re, rep);
    }
    return units(s);
  }

  // ---------- DOM: alle Textknoten + Attribute austauschen, Original (Deutsch) merken ----------
  const ATTRS = ['placeholder', 'title', 'aria-label'];
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'NOSCRIPT']);
  const skipNode = (el) => !el || SKIP.has(el.tagName) || !!el.closest?.('[translate="no"]');
  function doText(n) {
    if (n.__i18nSet !== n.nodeValue) n.__de = n.nodeValue;          // neu oder von der App geändert → gilt als Deutsch
    if (n.__de == null) return;
    const lead = n.__de.match(/^\s*/)[0], trail = n.__de.match(/\s*$/)[0], core = n.__de.trim();
    const out = (lang === 'en' && core && /[A-Za-zÄÖÜäöüß]/.test(core)) ? lead + tr(core) + trail : n.__de;
    if (out !== n.nodeValue) n.nodeValue = out;
    n.__i18nSet = out;
  }
  function doAttrs(el) {
    el.__deA = el.__deA || {}; el.__setA = el.__setA || {};
    for (const a of ATTRS) {
      if (!el.hasAttribute(a)) continue;
      const v = el.getAttribute(a);
      if (el.__setA[a] !== v) el.__deA[a] = v;
      const out = lang === 'en' ? tr(el.__deA[a]) : el.__deA[a];
      if (out !== v) el.setAttribute(a, out);
      el.__setA[a] = out;
    }
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { if (!skipNode(root.parentElement)) doText(root); return; }
    if (root.nodeType !== 1 || skipNode(root)) return;
    doAttrs(root);
    root.querySelectorAll('[placeholder],[title],[aria-label]').forEach(el => { if (!skipNode(el)) doAttrs(el); });
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => skipNode(n.parentElement) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    let n; while ((n = w.nextNode())) doText(n);
  }
  const obs = new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === 'childList') m.addedNodes.forEach(walk);
      else if (m.type === 'characterData') { if (!skipNode(m.target.parentElement)) doText(m.target); }
      else if (m.type === 'attributes' && !skipNode(m.target)) doAttrs(m.target);
    }
  });
  const observe = () => obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });

  // Dialoge (confirm/alert) ebenfalls übersetzen
  const _confirm = window.confirm.bind(window), _alert = window.alert.bind(window);
  window.confirm = (m) => _confirm(tr(m));
  window.alert = (m) => _alert(tr(m));

  // Chart.js: Beschriftungen in der Zeichenfläche (Legende, Achsentitel, Tooltips, Achsenwerte)
  function wrapChart() {
    if (!window.Chart || window.Chart.__i18n) return;
    const C = window.Chart;
    const wrapFn = (f) => typeof f === 'function' ? function (...a) { return tr(f.apply(this, a)); } : f;
    window.Chart = new Proxy(C, { construct(target, args) {
      const cfg = args[1] || {};
      (cfg.data?.datasets || []).forEach(d => { if (d.label) d.label = tr(d.label); });
      const sc = cfg.options?.scales || {};
      Object.values(sc).forEach(a => { if (a?.title?.text) a.title.text = tr(a.title.text); if (a?.ticks?.callback) a.ticks.callback = wrapFn(a.ticks.callback); });
      const cb = cfg.options?.plugins?.tooltip?.callbacks;
      if (cb?.label) cb.label = wrapFn(cb.label);
      return new target(...args);
    }, get(t, p) { return p === '__i18n' ? true : t[p]; }, set(t, p, v) { t[p] = v; return true; } });
  }

  function setLang(l) {
    lang = LANGS[l] ? l : 'de';
    try { localStorage.setItem('lang', lang); } catch {}
    document.documentElement.lang = lang;
    walk(document.body);
    if (lang === 'en') observe(); else obs.disconnect();
    renderSwitch();
    window.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
  }
  function renderSwitch() {
    const cur = document.getElementById('langCurrent');
    if (cur) cur.textContent = `${LANGS[lang].name} ${LANGS[lang].flag}`;
    document.querySelectorAll('.lang-opt').forEach(b => b.setAttribute('aria-checked', String(b.dataset.lang === lang)));
  }
  function init() {
    wrapChart();
    document.documentElement.lang = lang;
    const btn = document.getElementById('menuLang'), menu = document.getElementById('langMenu');
    if (btn && menu) {
      btn.onclick = (ev) => { ev.stopPropagation(); const open = menu.classList.toggle('hidden') === false; btn.setAttribute('aria-expanded', String(open)); };
      menu.querySelectorAll('.lang-opt').forEach(b => b.onclick = (ev) => { ev.stopPropagation(); setLang(b.dataset.lang); menu.classList.add('hidden'); btn.setAttribute('aria-expanded', 'false'); });
    }
    renderSwitch();
    if (lang === 'en') { walk(document.body); observe(); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  return { tr, setLang, lang: () => lang, translations };
})();
