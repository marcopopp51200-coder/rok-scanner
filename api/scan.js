// Vercel Serverless Function: POST /api/scan
// Nimmt Screenshots vom Browser entgegen, fragt die Claude API (Vision) ab und gibt die Rohantwort zurück.
// Der API-Key kommt ausschließlich aus der Umgebungsvariable ANTHROPIC_API_KEY und verlässt nie den Server.

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
const MODES = new Set(['resources', 'vip', 'gems', 'speedups', 'ap', 'governor', 'mats', 'gear']);
const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_IMAGES = 5;
const MAX_TOTAL_B64 = 4_300_000; // Vercel erlaubt max. 4,5 MB pro Anfrage

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

// ---------- Statthalter-Profil (Kill-Punkte, Höchster Verdienst, Energie) ----------
const PROMPT_GOVERNOR = `${INTRO}

MODUS: Statthalter-Profil. Der Screenshot zeigt das Profil des Statthalters (Governor) mit Zeilen wie:
  Energie               84.895.038      (englisch: "Power")
  Kill-Punkte           5.482.675.899   (englisch: "Kill Points")
  Verdienst             0               (englisch: "Merit") – NICHT verwenden
  Höchster Verdienst    20.061.883      (englisch: "Highest Merit")

Lies genau diese drei Werte als ganze Zahlen:
- "energy"        = Energie / Power
- "kill_points"   = Kill-Punkte / Kill Points
- "highest_merit" = Höchster Verdienst / Highest Merit (nicht den normalen "Verdienst")
Punkt oder Komma sind Tausendertrennzeichen: "5.482.675.899" = 5482675899. Abkürzungen umrechnen ("84.9M" = 84900000).
Ignoriere alles andere (Aktionspunkte-Leiste, ID, Kultur, Bündnis, Abzeichen). Fehlt ein Wert, nutze null.

Antworte AUSSCHLIESSLICH mit gültigem JSON, ohne Markdown, in genau diesem Format:
{
  "type": "governor",
  "energy": number|null,
  "kill_points": number|null,
  "highest_merit": number|null,
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
const PROMPT_GEAR = `${INTRO}

MODUS: Ausrüstung. Die Screenshots zeigen das Ausrüstungsfenster eines Statthalters/Kommandanten (Main-Account) –
ggf. zusätzlich geöffnete Item-Details mit Namen und Set.

Lies die 8 Ausrüstungs-Slots aus:
- "helm"   = Helm (Helmet)
- "chest"  = Brustpanzer / Rüstung (Chest)
- "weapon" = Waffe (Weapon)
- "gloves" = Handschuhe (Gloves)
- "legs"   = Beinschutz / Hose (Legs)
- "boots"  = Stiefel (Boots)
- "acc1", "acc2" = die zwei Accessoire-Slots (Accessory), in Lesereihenfolge (links/oben zuerst)

Je Slot:
- "name": Item-Name genau wie im Bild (Deutsch oder Englisch). Ist kein Name lesbar, aber das Set erkennbar, den Set-Namen eintragen.
- "set": Set-Name, falls sichtbar oder eindeutig erkennbar (z. B. "Ewiges Reich" / "Eternal Empire", "Höllisches Ödland" / "Hellish Wasteland",
  "Drachenatem" / "Dragon's Breath"); bei KvK-Waffen "KvK" plus Truppentyp; sonst null.
- "rarity": aus der Hintergrund-/Rahmenfarbe des Items: ORANGE/gold = "legendary", lila = "epic", blau = "elite", grün = "advanced", grau = "normal".
Leerer oder nicht sichtbarer Slot: null. Rate keine Namen – lieber null und in "notes" erwähnen.
Bei mehreren Screenshots denselben Slot nur einmal eintragen (die besser lesbare Variante nehmen).

Antworte AUSSCHLIESSLICH mit gültigem JSON, ohne Markdown, in genau diesem Format:
{
  "type": "gear",
  "slots": {
    "helm":   {"name": string, "set": string|null, "rarity": "legendary"|"epic"|"elite"|"advanced"|"normal"} | null,
    "chest":  ... | null,
    "weapon": ... | null,
    "gloves": ... | null,
    "legs":   ... | null,
    "boots":  ... | null,
    "acc1":   ... | null,
    "acc2":   ... | null
  },
  "confidence": "hoch" | "mittel" | "niedrig",
  "notes": "kurzer Hinweis auf Deutsch, z. B. unsichere Werte"
}`;

// Der Prompt liegt auf dem Server: so kann die Route nicht als allgemeiner Claude-Proxy missbraucht werden.
const PROMPT = (m) => m === 'speedups' ? PROMPT_SPEEDUPS : m === 'ap' ? PROMPT_AP : m === 'governor' ? PROMPT_GOVERNOR : m === 'mats' ? PROMPT_MATS : m === 'gear' ? PROMPT_GEAR : PROMPT_CLASSIC(m);

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
  if (total > MAX_TOTAL_B64) return res.status(413).json({ error: 'Die Bilder sind zusammen zu groß.' });

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
            { type: 'text', text: PROMPT(mode) }
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
