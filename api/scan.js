// Vercel Serverless Function: POST /api/scan
// Nimmt Screenshots vom Browser entgegen, fragt die Claude API (Vision) ab und gibt die Rohantwort zurück.
// Der API-Key kommt ausschließlich aus der Umgebungsvariable ANTHROPIC_API_KEY und verlässt nie den Server.

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
const MODES = new Set(['resources', 'vip', 'gems', 'speedups', 'ap', 'governor', 'mats', 'gear', 'armament', 'passports', 'goldheads', 'keys', 'armaments']);
const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_IMAGES = 5;
const MAX_TOTAL_B64 = 4_300_000; // Vercel erlaubt max. 4,5 MB pro Anfrage
const REF_KINDS = new Set(['gear', 'gear2', 'commanders']);   // Referenztafeln aus dem Browser (nummerierte Bilder aus /icons/…)

const INTRO = `Du analysierst Screenshots aus dem Handyspiel "Rise of Kingdoms" (Sprache der Spieloberfläche kann Deutsch, Englisch o. a. sein).`;

// ---------- Ressourcen / VIP / Gems (unverändert) ----------
const PROMPT_CLASSIC = (m) => `${INTRO}

${m === 'resources' ? 'MODUS: Ressourcen. Setze "type" auf "resources".' : m === 'vip' ? 'MODUS: VIP. Setze "type" auf "vip".' : 'MODUS: Edelsteine. Setze "type" auf "gems". Lies die Edelsteine (Gems): "gems_hand" = Edelsteine auf Hand (Anzeige oben/Konto), "gems_bag" = Summe der Edelstein-Items im Rucksack/Inventar (Wert × Anzahl je Kachel). Fehlt eins davon, null. "gems" = gems_hand + gems_bag. Abkürzungen wie 12.5K umrechnen.'}

Alle Screenshots stammen vom Main-Account des Spielers.

RESSOURCEN: Lies für Proviant/Nahrung (food), Holz (wood), Stein (stone) und Gold (gold) je 3 Werte:
- "rucksack" = Spalte "Durch Gegenstände" (From Items)
- "gesamt" = Spalte "Gesamtressourcen" / "Gesamt" (Total)
- "aufHand" = gesamt − rucksack (berechnen)
- Wandle Abkürzungen in ganze Zahlen um: "8.1B" = 8100000000, "12.5M" = 12500000, "850K" = 850000. Achte auf Dezimaltrennzeichen (8,1 Mrd. = 8100000000).
- Fehlt ein Wert, nutze null.

VIP: Jede Kachel mit VIP-Punkten zeigt einen Punktewert (z. B. 10, 50, 100, 500, 1000, 5000, 10000) und eine Anzahl (meist unten rechts, z. B. "x23" oder nur "23").
- Liste jede unterschiedliche Kachel einmal mit points_each und quantity. Ohne sichtbare Anzahl: quantity = 1.
- Ignoriere Kacheln, die keine VIP-Punkte sind (Beschleuniger, Ressourcen, Schlüssel usw.).
- Wenn der VIP-Bildschirm sichtbar ist, lies aktuelle Gesamtpunkte (current_points) und VIP-Stufe (current_level), sonst null. Bei Anzeige wie "123,456/200,000" ist current_points die Gesamtzahl, falls ersichtlich; wenn nur Fortschritt innerhalb der Stufe angezeigt wird, setze progress_in_level und level_requirement.
- Bei mehreren Screenshots: zähle dieselbe Kachel NICHT doppelt, wenn sie offensichtlich zweimal zu sehen ist.

Antworte AUSSCHLIESSLICH mit gültigem JSON, ohne Markdown, in genau diesem Format:
{
  "type": "resources" | "vip" | "gems",
  "gems": number|null,
  "gems_hand": number|null,
  "gems_bag": number|null,
  "resources": {
    "food":  {"rucksack": number|null, "aufHand": number|null, "gesamt": number|null},
    "wood":  {"rucksack": number|null, "aufHand": number|null, "gesamt": number|null},
    "stone": {"rucksack": number|null, "aufHand": number|null, "gesamt": number|null},
    "gold":  {"rucksack": number|null, "aufHand": number|null, "gesamt": number|null}
  },
  "vip": {
    "current_points": number|null,
    "current_level": number|null,
    "progress_in_level": number|null,
    "level_requirement": number|null,
    "items": [{"name": string, "points_each": number, "quantity": number}]
  },
  "confidence": "hoch" | "mittel" | "niedrig",
  "notes": "kurzer Hinweis auf Deutsch, z. B. unsichere Werte"
}`;

// ---------- Speedups (Übersicht "Beschleunigungstyp / Gesamtdauer") ----------
const PROMPT_SPEEDUPS = `${INTRO}

MODUS: Speedups (Beschleuniger). Alle Screenshots stammen vom Main-Account des Spielers.

Der Screenshot zeigt normalerweise die Übersicht "Beschleunigungstyp" mit der Spalte "Gesamtdauer", z. B.:
  Baubeschleunigung            162 d 2 h 44 m
  Forschungsbeschleunigung     151 d 12 h 26 m
  Ausbildungsbeschleunigung    201 d 17 h 50 m
  Heilungsbeschleunigung       100 d 11 h 5 m
  Beschleunigung               1.055 d 15 h 56 m

Zuordnung (deutsch / englisch → Schlüssel):
- "Baubeschleunigung" / "Building Speedup" → building
- "Forschungsbeschleunigung" / "Research Speedup" → research
- "Ausbildungsbeschleunigung" / "Training Speedup" → training
- "Heilungsbeschleunigung" / "Healing Speedup" → healing
- "Beschleunigung" ohne Zusatz / "Universal Speedup" / "Speedup" → universal

Rechne jede Gesamtdauer in MINUTEN um (Tage × 1440 + Stunden × 60 + Minuten).
- "d" = Tage (auch "T", "days"), "h" = Stunden (auch "Std"), "m" = Minuten (auch "min").
- Punkt oder Komma in der Tageszahl ist ein Tausendertrennzeichen: "1.055 d" = 1055 Tage.
- Beispiel: "162 d 2 h 44 m" = 162×1440 + 2×60 + 44 = 233444.
Falls stattdessen einzelne Beschleuniger-Kacheln aus dem Inventar zu sehen sind (Dauer × Anzahl), summiere je Typ.
Fehlt ein Typ, nutze null. Bei mehreren Screenshots denselben Wert nicht doppelt zählen.

Antworte AUSSCHLIESSLICH mit gültigem JSON, ohne Markdown, in genau diesem Format:
{
  "type": "speedups",
  "speedups": {
    "building": number|null,
    "research": number|null,
    "training": number|null,
    "healing": number|null,
    "universal": number|null
  },
  "confidence": "hoch" | "mittel" | "niedrig",
  "notes": "kurzer Hinweis auf Deutsch, z. B. unsichere Werte"
}`;

// ---------- AP (Aktionspunkte-Flaschen) ----------
const PROMPT_AP = `${INTRO}

MODUS: Aktionspunkte (AP). Alle Screenshots stammen vom Main-Account des Spielers.

Gesucht ist die ANZAHL der grünen Aktionspunkte-Flaschen in genau 4 Größen: 50, 100, 500 und 1000 AP.
Es gibt zwei mögliche Ansichten – beide auswerten:

1) Inventar-Kacheln: Grüne Flasche mit Etikett. Die Größe steht OBEN auf der Kachel (z. B. "50", "100", "500", "1.000"),
   die Anzahl steht UNTEN RECHTS (z. B. "4.657", "1.575", "5", "3"). Punkt/Komma in der Anzahl ist ein Tausendertrennzeichen: "4.657" = 4657.
   Ignoriere alle anderen Kacheln (Schlüssel, Karten, Münzen, Äpfel, Beschleuniger usw.).

2) Gegenstandsliste mit Text, z. B.:
   "Stelle 50 Aktionspunkte wieder her. Du besitzt: 4.656"            → ap_50 = 4656
   "Grundlegende Aktionspunkteerholung: Stelle 100 … Du besitzt: 1.575" → ap_100 = 1575
   "Mittlere Aktionspunkteerholung: Stelle 500 … Du besitzt: 5"          → ap_500 = 5
   "Erweiterte Aktionspunkteerholung: Stelle 1000 … Du besitzt: 3"       → ap_1000 = 3
   (englisch: "Restores 50 AP … Owned: …")

Ist eine Größe nicht zu sehen, nutze null. Bei mehreren Screenshots dieselbe Flasche nicht doppelt zählen –
zeigen zwei Screenshots dieselbe Größe mit leicht unterschiedlicher Anzahl, nimm den Wert aus der Textliste ("Du besitzt").

Antworte AUSSCHLIESSLICH mit gültigem JSON, ohne Markdown, in genau diesem Format:
{
  "type": "ap",
  "ap": { "ap_50": number|null, "ap_100": number|null, "ap_500": number|null, "ap_1000": number|null },
  "confidence": "hoch" | "mittel" | "niedrig",
  "notes": "kurzer Hinweis auf Deutsch, z. B. unsichere Werte"
}`;

// ---------- Passports (Passseiten für die Migration) ----------
const PROMPT_PASSPORTS = `${INTRO}

MODUS: Passports. Alle Screenshots stammen vom Main-Account des Spielers.

Gesucht ist die ANZAHL der Passseiten (englisch "Passport Page", deutsch z. B. "Passseite" / "Reisepass-Seite" / "Pass").
Das Item sieht aus wie ein aufgeschlagenes Pass-/Ausweisheft und wird für die Migration in ein anderes Königreich benötigt
(Beschreibung z. B. "Wird für die Migration benötigt" / "Used for migrating to another kingdom").

Mögliche Ansichten – beide auswerten:
1) Inventar-Kachel: die Anzahl steht UNTEN RECHTS auf der Kachel (z. B. "1.250"). Punkt/Komma ist ein Tausendertrennzeichen: "1.250" = 1250.
2) Item-Details / Textliste: "Du besitzt: 1.250" / "Owned: 1,250".
3) Migrations-Fenster: "Passseiten: 1.250/3.600" → passports = 1250, required = 3600 (die zweite Zahl ist der Bedarf).

Ignoriere alle anderen Items (Beschleuniger, Schlüssel, Teleporter, Truhen usw.). Bei mehreren Screenshots nicht doppelt zählen –
nimm im Zweifel den Wert aus der Textansicht ("Du besitzt").
Ist kein Passport zu sehen, nutze null.

Antworte AUSSCHLIESSLICH mit gültigem JSON, ohne Markdown, in genau diesem Format:
{
  "type": "passports",
  "passports": number|null,
  "required": number|null,
  "confidence": "hoch" | "mittel" | "niedrig",
  "notes": "kurzer Hinweis auf Deutsch, z. B. unsichere Werte"
}`;

// ---------- Goldheads / Keys / Armaments (Anzahl aus dem Inventar) ----------
const COUNT_TAIL = (type, keys) => `
Punkt/Komma in einer Anzahl ist ein Tausendertrennzeichen: "1.250" = 1250. Die Anzahl steht auf Inventar-Kacheln UNTEN RECHTS,
in Textansichten hinter "Du besitzt:" / "Owned:". Bei mehreren Screenshots dasselbe Item nicht doppelt zählen.
Ist ein Item nicht zu sehen, nutze null (nicht 0 raten). Ignoriere alle anderen Items.

Antworte AUSSCHLIESSLICH mit gültigem JSON, ohne Markdown, in genau diesem Format:
{
  "type": "${type}",
  "counts": { ${keys.map(k => `"${k}": number|null`).join(', ')} },
  "confidence": "hoch" | "mittel" | "niedrig",
  "notes": "kurzer Hinweis auf Deutsch, z. B. unsichere Werte"
}`;

const PROMPT_GOLDHEADS = `${INTRO}

MODUS: Goldheads. Alle Screenshots stammen vom Main-Account des Spielers.
Gesucht ist die Anzahl der UNIVERSELLEN legendären Skulpturen ("Goldheads"): goldene Büste/Kopf-Skulptur,
englisch z. B. "Legendary Sculpture" / "Universal Legendary Sculpture", deutsch z. B. "Legendäre Skulptur" / "Universelle legendäre Skulptur".
Beschreibung sinngemäß: kann für JEDEN legendären Kommandanten verwendet werden (Fertigkeiten aufwerten / freischalten).
NICHT mitzählen: Skulpturen eines bestimmten Kommandanten (mit Namen, z. B. "Skulptur von Richard I."), epische (lila) Skulpturen.
- "goldheads" = Anzahl universeller legendärer Skulpturen
${COUNT_TAIL('goldheads', ['goldheads'])}`;

const PROMPT_KEYS = `${INTRO}

MODUS: Schlüssel (Keys). Alle Screenshots stammen vom Main-Account des Spielers.
Gesucht ist die Anzahl dieser Schlüssel:
- "key_gold"     = Goldene Schlüssel / "Gold Key" (Taverne, goldene Truhe)
- "key_silver"   = Silberne Schlüssel / "Silver Key" (Taverne, silberne Truhe)
- "key_material" = Material-Schlüssel / "Material Key" (goldener Schlüssel mit blauer Kugel im Griff)
- "key_sovereign" = Sovereign-Schlüssel / "Sovereign Key" (goldener Schlüssel mit grünem Stein im Griff)
In der Taverne steht die Anzahl ggf. neben dem Schlüssel-Symbol am Truhen-Button (z. B. "Schlüssel: 12").
${COUNT_TAIL('keys', ['key_gold', 'key_silver', 'key_material', 'key_sovereign'])}`;

const PROMPT_ARMAMENTS = `${INTRO}

MODUS: Armaments (Formations-Rüstungen / Armament-Teile). Alle Screenshots stammen vom Main-Account des Spielers.
Zähle die Armament-Teile nach Seltenheit (Rahmenfarbe der Kachel bzw. Seltenheit im Text):
- "arm_legendary" = Legendär / Legendary (gold/orange)
- "arm_epic"      = Episch / Epic (lila)
- "arm_elite"     = Elite (blau)
- "arm_advanced"  = Fortgeschritten / Advanced (grün)
- "arm_normal"    = Normal (weiß/grau)
Zusätzlich:
- "arm_scrolls"   = Armament-Schriftrollen / Armament Scrolls (zum Aufwerten bzw. Umschreiben der Inschriften), Summe aller Schriftrollen
Steht in einer Übersicht eine Zahl je Seltenheit, nimm diese. Sonst zähle die sichtbaren Kacheln (Anzahl auf der Kachel beachten).
Außerdem die Anzahl dieser Items aus dem Inventar (Anzahl unten rechts auf der Kachel):
- "arm_chest"         = Armament-Truhe (goldene Truhe mit blauem Edelstein)
- "arm_chest2"        = graue/silberne Armament-Kiste mit Schloss
- "arm_coin"          = Formations-Münze, silbern-blau mit "A"
- "arm_coin_gold"     = Formations-Münze, golden mit "A"
- "arm_conv"          = Umwandlungsstein / Conversion Stone (blauer, polierter Stein mit Pfeilen)
- "arm_conv_frag"     = Umwandlungsstein-Fragment (dunkelblaue Bruchstücke mit Pfeilen)
- "arm_crystal"       = Kristall (oranger Kristall)
- "arm_trans_crystal" = Transmutationskristall (schillernder lila-blauer Kristall)
- "arm_trans_stone"   = Transmutationsstein (oranger Stein mit schwarzem Rand)
${COUNT_TAIL('armaments', ['arm_legendary', 'arm_epic', 'arm_elite', 'arm_advanced', 'arm_normal', 'arm_scrolls', 'arm_chest', 'arm_chest2', 'arm_coin', 'arm_coin_gold', 'arm_conv', 'arm_conv_frag', 'arm_crystal', 'arm_trans_crystal', 'arm_trans_stone'])}`;

// ---------- Statthalter-Profil (Energie, Kill-Punkte, Höchster Verdienst, Tote, Ark of Osiris, Lost Kingdom) ----------
const PROMPT_GOVERNOR = `${INTRO}

MODUS: Statthalter-Profil (Governor Profile). Es gibt drei mögliche Ansichten:

A) EIGENES PROFIL (hochkant): Oben eine Leiste "Aktionspunkte / Action Points 1,001/1,700" – das ist KEIN Wert, ignorieren.
   Darunter Zeilen mit Beschriftung links und Wert rechts in GENAU dieser Reihenfolge:
     Statthalter / Governor      (ID: 148759624)   und darunter der Name
     Zivilisation / Civilization
     Bündnis / Alliance          [S79]Saints of 79
     Macht / Energie / Power     85,141,754
     Kill-Punkte / Kill Points   5,482,675,899
     Verdienst / Acclaim         0                 ← aktueller Verdienst → "acclaim" (oft 0, NICHT der Höchste)
     Höchster Verdienst / Highest Acclaim   20,061,883
   Ganz unten drei Abzeichen: "Champions of Olympia / Champions von Olympia", "Ark of Osiris – 9 Wins" bzw. deutsch "Truhe des Osiris – 9 Siege",
   "Lost Kingdom – 4x Autarch" bzw. deutsch "Verlorenes Königreich – 4x Alleinherrscher".

B) FREMDES PROFIL (quer, Banner links): rechts oben "Governor(ID: 149655218)" und der Name. Darunter ein Raster aus 2 Zeilen × 3 Spalten,
   der Wert steht jeweils DIREKT UNTER seiner Beschriftung:
     Alliance [S79]Saints of 79 | Kill Points 48,173,763 | Power 26,616,910
     Civilization Spain         | Acclaim 0              | Highest Acclaim 224,895
   Unten drei Abzeichen: "Champions of Olympia N/A", "Ark of Osiris 2 Wins" (deutsch "Truhe des Osiris 2 Siege"), "Lost Kingdom 0x Autarch" (deutsch "Verlorenes Königreich 0x Alleinherrscher").

C) "WEITERE INFOS / MORE INFO": Liste mit u. a. "Tote / Dead" (gefallene Einheiten), ggf. auch Kill-Punkte und Macht.

D) LOST-KINGDOM-STATISTIK ("Most Units", gelbe Kacheln): oben drei Kacheln mit Beschriftung oben und Zahl darunter:
     "Times Named Autarch" / "Mal Alleinherrscher" 4 | "Times Participated" / "Teilnahmen" 13 | "Most Units Killed" / "Meiste getötete Einheiten" 89,827,934
   darunter zwei Zeilen: "Most Units Lost" 1,949,570 und "Most Units Healed" 42,174,599.
   → view = "lk_stats". Hier NUR lk_autarch, lk_participated, units_killed, units_lost, units_healed füllen.
   "Most Units Killed" ist NICHT kill_points! kill_points, energy, highest_merit, acclaim, deads, ark_wins = null.

Ordne jeden Wert seiner Beschriftung zu (Ansicht A: gleiche Zeile rechts, Ansicht B: direkt darunter) – nicht nach Größe raten.
- "governor_id"   = Ziffern hinter "ID:" (als Text, z. B. "148759624")
- "name"          = Name des Statthalters
- "alliance_tag"  = Kürzel in eckigen Klammern vor dem Bündnisnamen (z. B. "S79"); "alliance_name" = Rest (z. B. "Saints of 79")
- "energy"        = Macht / Energie / Power
- "kill_points"   = Kill-Punkte / Kill Points
- "highest_merit" = Höchster Verdienst / Highest Acclaim (NIEMALS der normale "Verdienst"/"Acclaim", der oft 0 ist)
- "deads"         = Tote / Dead (nur wenn sichtbar, sonst null)
- "acclaim"       = aktueller Verdienst / Acclaim (die Zeile OHNE "Höchster"; oft 0 – dann 0, nicht null)
- "ark_wins"      = Zahl vor "Wins"/"Siege" beim Abzeichen Ark of Osiris / Truhe des Osiris / Arche des Osiris
- "lk_autarch"    = Zahl vor "x Autarch" / "x Alleinherrscher" beim Abzeichen Lost Kingdom / Verlorenes Königreich ("0x" = 0)
- "lk_participated" = "Times Participated" / "Teilnahmen" (nur Ansicht D, sonst null)
- "units_killed"  = "Most Units Killed" / "Meiste getötete Einheiten" (nur wenn sichtbar, sonst null)
- "units_lost"    = "Most Units Lost" / "Meiste verlorene Einheiten" (nur wenn sichtbar, sonst null)
- "units_healed"  = "Most Units Healed" / "Meiste geheilte Einheiten" (nur wenn sichtbar, sonst null)
Punkt oder Komma sind Tausendertrennzeichen: "5.482.675.899" und "5,482,675,899" = 5482675899. Abkürzungen umrechnen ("84.9M" = 84900000).
Lies jede Ziffer einzeln und genau ab – lieber null als geraten. Fehlt ein Wert oder ist er nicht lesbar, nutze null.

Antworte AUSSCHLIESSLICH mit gültigem JSON, ohne Markdown, in genau diesem Format:
{
  "type": "governor",
  "view": "own" | "other" | "more_info" | "lk_stats",
  "governor_id": string|null,
  "name": string|null,
  "alliance_tag": string|null,
  "alliance_name": string|null,
  "energy": number|null,
  "kill_points": number|null,
  "highest_merit": number|null,
  "acclaim": number|null,
  "deads": number|null,
  "ark_wins": number|null,
  "lk_autarch": number|null,
  "lk_participated": number|null,
  "units_killed": number|null,
  "units_lost": number|null,
  "units_healed": number|null,
  "confidence": "hoch" | "mittel" | "niedrig",
  "notes": "kurzer Hinweis auf Deutsch, z. B. unsichere Werte"
}`;

// ---------- Schmiedematerialien ----------
const PROMPT_MATS = `${INTRO}

MODUS: Schmiedematerialien. Alle Screenshots stammen vom Main-Account des Spielers (Inventar / Materialien-Übersicht).

AUFBAU DER SCREENSHOTS:
- Ganz oben stehen meist MATERIALKISTEN (bronzene/goldene Truhen). Diese gehören in "chests" – NICHT zu einem Material addieren.
- Darunter Abschnitte mit Überschrift, typischerweise in dieser Reihenfolge: Leder (Leather), Eisenerz (Iron Ore), Ebenholz (Ebony), Tierknochen (Animal Bone).
- In jeder Zeile sind die Kacheln von der HÖCHSTEN zur NIEDRIGSTEN Seltenheit sortiert (links Legendär … rechts Normal).

Materialarten (falls keine Überschrift sichtbar ist, am Symbol erkennen):
- "leather" = Leder: braune Tierhaut / Pergament-Rollen
- "iron"    = Eisenerz: graue Steine / Erzbrocken
- "ebony"   = Ebenholz: dunkle, rötlich-braune Holzstämme / Bretter
- "bone"    = Tierknochen: cremefarbene Knochen / Krallen
- Kisten ("chests"): Schatztruhen

Seltenheit = HINTERGRUNDFARBE der Kachel:
- "white"  = grau (Normal)
- "green"  = grün (Fortgeschritten / Advanced)
- "blue"   = blau (Elite)
- "purple" = lila (Episch / Epic)
- "gold"   = ORANGE (Legendär / Legendary)

Die Anzahl steht unten rechts auf der Kachel (z. B. "1.234"). Punkt/Komma sind Tausendertrennzeichen: "1.234" = 1234, "12,5K" = 12500.

WICHTIG – KEINE DOPPELZÄHLUNG:
Spieler schicken oft 2 (oder mehr) Screenshots, die sich überlappen (gescrollt). Dieselbe Kachel (gleiches Material + gleiche Seltenheit) kann auf mehreren Bildern erscheinen.
Jede Kombination Material+Seltenheit gibt es im Inventar nur EINMAL – trage ihre Zahl genau einmal ein und addiere sie NIEMALS über Screenshots hinweg.
Weichen die Zahlen zwischen zwei Bildern ab, nimm die besser lesbare.

Ignoriere alles andere (Ausrüstung, Baupläne, Beschleuniger, Ressourcen, Schlüssel usw.).
Nicht sichtbare Kombinationen: null.

Antworte AUSSCHLIESSLICH mit gültigem JSON, ohne Markdown, in genau diesem Format:
{
  "type": "materials",
  "chests": {"white": number|null, "green": number|null, "blue": number|null, "purple": number|null, "gold": number|null},
  "materials": {
    "leather": {"white": number|null, "green": number|null, "blue": number|null, "purple": number|null, "gold": number|null},
    "iron":    {"white": number|null, "green": number|null, "blue": number|null, "purple": number|null, "gold": number|null},
    "ebony":   {"white": number|null, "green": number|null, "blue": number|null, "purple": number|null, "gold": number|null},
    "bone":    {"white": number|null, "green": number|null, "blue": number|null, "purple": number|null, "gold": number|null}
  },
  "confidence": "hoch" | "mittel" | "niedrig",
  "notes": "kurzer Hinweis auf Deutsch, z. B. unsichere Werte"
}`;

// ---------- Ausrüstung (Ist-Zustand für den Crafting-Planer) ----------
// Der Item-Katalog kommt direkt aus Supabase (Tabelle public.gear_items) – nicht vom Browser.
const SB_URL = process.env.SUPABASE_URL || 'https://tqkhnicaiokyckiqwvpw.supabase.co';
const SB_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxa2huaWNhaW9reWNraXF3dnB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1Nzg0NjcsImV4cCI6MjEwNzE1NDQ2N30.8bNhMl2ewyIKh_PqSvGKf34stNIbXfXiOhEPFXDOev0';
async function gearCatalog() {
  const get = async (cols) => {
    const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), 4000);
    try {
      const r = await fetch(`${SB_URL}/rest/v1/gear_items?select=${cols}&order=slot`, { headers: { apikey: SB_KEY, authorization: `Bearer ${SB_KEY}` }, signal: ctrl.signal });
      return r.ok ? await r.json() : null;
    } catch { return null; } finally { clearTimeout(t); }
  };
  const rows = (await get('id,name,slot,icon_hint')) || (await get('id,name,slot')) || [];   // icon_hint ist optional
  return Array.isArray(rows) ? rows.slice(0, 300) : [];
}
const clean = (v, n) => String(v ?? '').replace(/[\r\n|]+/g, ' ').slice(0, n).trim();

const PROMPT_GEAR = (catalog) => `${INTRO}

MODUS: Ausrüstung. Der Screenshot zeigt die Ausrüstung eines Kommandanten (Main-Account): 8 rautenförmige Felder in fester Anordnung.
Von oben nach unten:
1. ganz oben, Mitte                → "helm"   (Helm)
2. darunter, Mitte                 → "chest"  (Brust / Umhang / Rüstung)
3. links daneben → "weapon" (Waffe) · rechts daneben → "gloves" (Handschuhe)
4. darunter, Mitte                 → "legs"   (Beinschutz)
5. links darunter → "acc1" · rechts darunter → "acc2" (Accessoires)
6. ganz unten, Mitte               → "boots"  (Stiefel)
Unter jedem Feld kann eine römische Ziffer I, II, III, IV oder V stehen – das ist das Tier des Items: als Zahl in "tier" eintragen (I=1, II=2, III=3, IV=4, V=5; keine Ziffer → 0).
REFINE: Unten rechts in jedem Feld sitzt ein kleines rotes Rauten-Symbol – das ist das Refine. Das weiße Motiv darin bestimmt den Typ ("refine_type"):
Bogen = "archer", Pferdekopf = "cavalry", Schwert = "infantry", Zahnrad = "engineering", Schwert in einem Sockel/Stein = "integration", Fahne = "leadership" (kein Symbol → null).
Sieh dir jedes dieser Symbole einzeln und genau an (vergrößert betrachten!) und entscheide zuerst "refine_full":
- true  = das GANZE Symbol ist kräftig rot gefüllt, kein grauer/dunkler Anteil (Refine fertig)
- false = das Symbol ist grau/dunkel oder nur teilweise rot (unten rot, oben grau) oder es gibt kein Symbol
Im Zweifel genau hinsehen: Ein fertiges Refine ist überall gleich rot wie die Beispiele in der Zeile "VOLL" der Refine-Legende (falls mitgeschickt).
Trage danach "refine" als Zahl ein:
- komplett ROT gefülltes Symbol → 100 (Refine voll / fertig)
- Symbol nur teilweise rot gefüllt (Rest grau/dunkel) → Anteil der roten Füllung auf 25, 50 oder 75 runden
- graues/dunkles Symbol ohne Rot → 0
- kein Symbol sichtbar → 0

Seltenheit = Farbe des Feldes: gold/orange = "legendary", lila = "epic", blau = "elite", grün = "advanced", grau = "normal".
Leeres Feld (nur Umriss/Platzhalter) → null.

Item-Namen sind im Ausrüstungsfenster meist NICHT zu sehen. Ordne jedes Feld anhand des Bildes einem Item aus diesem Katalog zu
(nur Items mit passendem Slot; Format: id | slot | Name | Aussehen):
${catalog.length ? catalog.map(c => `- ${clean(c.id, 80)} | ${clean(c.slot, 12)} | ${clean(c.name, 60)} | ${clean(c.icon_hint, 160) || '–'}`).join('\n') : '(Katalog leer)'}

Passt kein Katalog-Item sicher, setze "item_id": null und beschreibe das Item kurz in "description" (z. B. "schwarzes Horn mit rotem Band").
Ist ein Item-Name im Bild zu lesen (Detailansicht), trage ihn in "name" ein.

Antworte AUSSCHLIESSLICH mit gültigem JSON, ohne Markdown, in genau diesem Format:
{
  "type": "gear",
  "slots": {
    "helm":   {"ref": number|null, "ref2": number|null, "ref3": number|null, "item_id": string|null, "name": string|null, "description": string, "rarity": "legendary"|"epic"|"elite"|"advanced"|"normal", "tier": 0|1|2|3|4|5, "refine": 0|25|50|75|100, "refine_full": boolean, "refine_type": "archer"|"cavalry"|"infantry"|"engineering"|"integration"|"leadership"|null} | null,
    "chest":  ... | null,
    "weapon": ... | null,
    "gloves": ... | null,
    "legs":   ... | null,
    "acc1":   ... | null,
    "acc2":   ... | null,
    "boots":  ... | null
  },
  "commanders": [{"ref": number|null, "name": string|null, "expertise": boolean}],
  "confidence": "hoch" | "mittel" | "niedrig",
  "notes": "kurzer Hinweis auf Deutsch, z. B. unsichere Zuordnungen"
}`;

// ---------- Referenztafeln (Bild-Abgleich) ----------
const REF_TEXT = {
  gear: (n, note) => `REFERENZTAFEL AUSRÜSTUNG (nicht auswerten, nur zum Vergleichen): ${n} nummerierte Kacheln (gelbe Zahl oben links, Name darunter),
in ABSCHNITTE nach Slot-Typ eingeteilt${note ? ' – ' + note : ''}.
REGELN für "ref":
- Für jedes Feld NUR Kacheln aus dem passenden Abschnitt verwenden: helm → HELM, chest → BRUST, weapon → WAFFE, gloves → HANDSCHUHE, legs → BEINE, acc1/acc2 → ACCESSOIRE, boots → STIEFEL.
- FARBE ZUERST: Jede Kachel liegt auf einer Raute in der Seltenheitsfarbe (orange = legendär, lila = episch, blau = elite, grau = normal) – genau wie die Felder im Screenshot.
  Bestimme zuerst die Farbe des Feldes im Screenshot und wähle danach NUR Kacheln mit derselben Hintergrundfarbe. Ein oranges Feld ist NIE ein lila Item und umgekehrt.
  Trage die Feldfarbe auch in "rarity" ein (orange → "legendary", lila → "epic", blau → "elite", grau → "normal").
- Danach vergleiche Form, Umriss, Farben und Details (z. B. bei Bögen/Armbrüsten: Form des Bogens, Farbe von Griff, Sehne und Verzierung; bei Helmen: Federn, Hörner, Visier). Die Seltenheitsfarbe des Feldes beim Vergleich ignorieren.
- Ringe, Amulette und Brustteile sehen sich oft ähnlich: achte auf Edelsteinfarbe, Form der Fassung, Farbe von Stoff/Metall und Verzierungen.
- "ref" = Nummer des identischen Symbols, "ref2" und "ref3" = zweit- und drittähnlichstes Symbol aus demselben Abschnitt UND derselben Farbe (Ausweichlösung). Ohne sicheren Treffer: "ref": null.
Ganz unten auf der Tafel steht eine REFINE-LEGENDE: obere Reihe = fertig refined (komplett rot), untere Reihe = nicht fertig (grau). Nutze sie für "refine_full".`,
  gear2: (n, note) => `REFERENZTAFEL AUSRÜSTUNG – TEIL 2 (Fortsetzung, gleiche Nummerierung und gleiche Regeln)${note ? ': ' + note : ''}.`,
  commanders: (n) => `REFERENZTAFEL KOMMANDANTEN (nicht auswerten, nur zum Vergleichen): ${n} Porträts, gelbe Nummer oben links, Name darunter.
Sind im Screenshot Kommandanten zu sehen (Porträt, Ganzkörperbild oder Name), trage sie in "commanders" ein – zuerst den Hauptkommandanten (Primär), dann den Sekundären:
"ref" = Nummer des passenden Porträts, "name" = gelesener Name (sonst null), "expertise" = true, wenn der Kommandant erkennbar Expertise hat (alle Fähigkeiten auf Stufe 5 / Expertise-Rahmen), sonst false.
Keine Kommandanten zu sehen: "commanders": [].`
};

// ---------- Rüstung (Armaments) ----------
const ARM_NAMES = ['Airtight', 'Hardheaded', 'Bulwark', 'Bolstered', 'Thundering', 'Rattling', 'Tidebreaker', 'Vigor', 'Toppler', 'Imploder', 'Dominate', 'Bludgeon', 'Demolisher', 'Raider', 'Cleaver', 'Charge', 'Steelskin', 'Determined', 'Flurry', 'Relentless', 'Thrasher', 'Pummeler', 'Butterfly Effect', 'Causative', 'Maneuver Warfare', 'Ballista', 'Balanced', 'Defiant', 'Horseback Archery', 'Divine Strength', 'Intrepid', 'Focus Fire', 'Advantageous', 'Fury', 'Hunter', 'Crazed', 'Indomitable', 'Soar', 'Unstoppable', 'Boiling Blood',
  'Spiked', 'Metallics', 'Vitality', 'Galloping', 'Cleanser', 'Striker', 'Rebuff', 'Brawler', 'Warflames', 'Eclipsed', 'Brave', 'Strategic', 'Desperado', 'Cohesive', 'Pursuer', 'Assertive', 'Wary', 'Siegework', 'Sentries', 'Ballistics',
  'Infamy', 'Shielded', 'Hardy', 'Haste', 'Pacifier', 'Militant', 'Resistant', 'Daring', 'Elite', 'Evasive', 'Smite', 'Enduring', 'Artisan', 'Rapacious', 'Guardians', 'Counterer', 'Deflecter', 'Watchmen', 'Lineshot',
  'Warcry', 'Well Clad', 'Robust', 'Swift', 'Payback', 'Onslaught', 'Retaliator', 'Enraged', 'Valiant', 'Iron Wall', 'Bellicose', 'Pulverize', 'Breaker', 'Furious', 'Ward', 'Phalanx', 'Hurried', 'Tremors', 'Calm', 'Loosed',
  'Brutal', 'Armored', 'Fit', 'Fine Horse', 'Annexer', 'Warhunger', 'Alert', 'Devious', 'Fearsome', 'Requital', 'Respite', 'Guarded', 'Embattled', 'Vengeful', 'Patronage', 'Primed', 'Uplifting', 'Spirited', 'Bluster'];
const PROMPT_ARMAMENT = `${INTRO}

MODUS: Rüstung (Armaments). Der Screenshot zeigt meist "Armament Info" / "Rüstungsinfo": oben Inschriften als sechseckige Schilder, darunter Werte, z. B.
  [Bulwark] [Toppler] [Charge]
  [Rattling]
  Infantry Attack +7.7% · Infantry Defense +9.5% · Infantry Health +9% · March Speed (Infantry) +2.1%
  oder: Cavalry Attack +9.4% · Cavalry Defense +8.9% · Cavalry Health +5.7% · All Damage +1.6%

1. "inscriptions": JEDES Schild in Lesereihenfolge (links → rechts, oben → unten), keins auslassen:
   - "text" = Aufschrift genau wie im Bild (abgeschnittene Namen mit "…" zu einem dieser bekannten Namen ergänzen, sonst genau so lassen, wie sie zu sehen sind: ${ARM_NAMES.join(', ')})
   - "color" = Farbe des Schildes: "gold" (gelb/orange), "blue" (blau/lila), "gray" (weiß/hellgrau)
2. "formation" = Name der Formation, falls sichtbar (z. B. "Pincer", "Delta", "Wedge"), sonst null.
3. "troop" = Truppenart der Werte: "infantry" (Infanterie), "cavalry" (Kavallerie), "archer" (Bogenschützen), "siege" (Belagerung), "all" (alle Truppen).
4. Werte als Zahl in Prozent (ohne %-Zeichen, Komma = Dezimaltrenner): "attack" = Angriff/Attack, "defense" = Verteidigung/Defense, "health" = Leben/Health, "march_speed" = Marschgeschwindigkeit/March Speed, "all_damage" = "All Damage"/Gesamtschaden (Stern-Symbol). Fehlt ein Wert: null.

Antworte AUSSCHLIESSLICH mit gültigem JSON, ohne Markdown, in genau diesem Format:
{
  "type": "armament",
  "inscriptions": [{"text": string, "color": "gold"|"blue"|"gray"}],
  "formation": string|null,
  "troop": "infantry"|"cavalry"|"archer"|"siege"|"all"|null,
  "attack": number|null, "defense": number|null, "health": number|null, "march_speed": number|null, "all_damage": number|null,
  "confidence": "hoch" | "mittel" | "niedrig",
  "notes": "kurzer Hinweis auf Deutsch"
}`;

// Der Prompt liegt auf dem Server: so kann die Route nicht als allgemeiner Claude-Proxy missbraucht werden.
const PROMPT = (m) => m === 'armament' ? PROMPT_ARMAMENT : m === 'speedups' ? PROMPT_SPEEDUPS : m === 'ap' ? PROMPT_AP : m === 'passports' ? PROMPT_PASSPORTS : m === 'goldheads' ? PROMPT_GOLDHEADS : m === 'keys' ? PROMPT_KEYS : m === 'armaments' ? PROMPT_ARMAMENTS : m === 'governor' ? PROMPT_GOVERNOR : m === 'mats' ? PROMPT_MATS : PROMPT_CLASSIC(m);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Nur POST erlaubt.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server ist nicht konfiguriert: ANTHROPIC_API_KEY fehlt in den Vercel Environment Variables.' });

  // Body prüfen
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  const mode = body?.mode;
  const images = Array.isArray(body?.images) ? body.images : [];
  if (!MODES.has(mode)) return res.status(400).json({ error: 'Ungültiger Modus.' });
  if (!images.length) return res.status(400).json({ error: 'Keine Bilder übermittelt.' });
  if (images.length > MAX_IMAGES) return res.status(400).json({ error: `Maximal ${MAX_IMAGES} Bilder pro Analyse.` });

  let total = 0;
  for (const im of images) {
    if (!im || !TYPES.has(im.media_type) || typeof im.data !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(im.data)) {
      return res.status(400).json({ error: 'Ungültiges Bildformat.' });
    }
    total += im.data.length;
  }
  // optionale Referenztafeln (nur beim Ausrüstungs-Scan)
  const refs = mode === 'gear' && Array.isArray(body?.refs) ? body.refs.slice(0, 3) : [];
  for (const rf of refs) {
    if (!rf || !REF_KINDS.has(rf.kind) || rf.media_type !== 'image/jpeg' || typeof rf.data !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(rf.data)) {
      return res.status(400).json({ error: 'Ungültige Referenztafel.' });
    }
    rf.count = Math.max(1, Math.min(400, Math.round(+rf.count) || 1));
    rf.note = typeof rf.note === 'string' ? rf.note.replace(/[^\w .:;–-]/g, '').slice(0, 400) : '';
    total += rf.data.length;
  }
  if (total > MAX_TOTAL_B64) return res.status(413).json({ error: 'Die Bilder sind zusammen zu groß.' });

  const promptText = mode === 'gear' ? PROMPT_GEAR(await gearCatalog()) : PROMPT(mode);

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            ...images.map(im => ({ type: 'image', source: { type: 'base64', media_type: im.media_type, data: im.data } })),
            ...refs.flatMap(rf => [{ type: 'text', text: REF_TEXT[rf.kind](rf.count, rf.note) }, { type: 'image', source: { type: 'base64', media_type: rf.media_type, data: rf.data } }]),
            { type: 'text', text: refs.length ? promptText + '\n\nDie Referenztafeln oben sind KEINE Screenshots des Spielers – nur zum Vergleichen verwenden. Ohne Kommandanten-Tafel: "commanders": [].' : promptText }
          ]
        }]
      })
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const status = (r.status === 429 || r.status === 529) ? 429 : 502;
      return res.status(status).json({ error: data?.error?.message ? `Claude API: ${data.error.message}` : `Claude API Fehler ${r.status}` });
    }
    const text = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n');
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(502).json({ error: 'Verbindung zur Claude API fehlgeschlagen.' });
  }
};
