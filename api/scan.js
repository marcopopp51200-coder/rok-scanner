// Vercel Serverless Function: POST /api/scan
// Nimmt Screenshots vom Browser entgegen, fragt die Claude API (Vision) ab und gibt die Rohantwort zurück.
// Der API-Key kommt ausschließlich aus der Umgebungsvariable ANTHROPIC_API_KEY und verlässt nie den Server.

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
const MODES = new Set(['resources', 'vip', 'gems', 'speedups', 'ap', 'governor', 'mats', 'gear']);
const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_IMAGES = 5;
const MAX_TOTAL_B64 = 4_300_000; // Vercel erlaubt max. 4,5 MB pro Anfrage
const REF_KINDS = new Set(['gear', 'commanders']);   // Referenztafeln aus dem Browser (nummerierte Bilder aus /icons/…)

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
Bogen = "archer", Pferdekopf = "cavalry", Schwert = "infantry" (kein Symbol → null).
Sieh dir jedes dieser Symbole einzeln und genau an und trage "refine" als Zahl ein:
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
    "helm":   {"ref": number|null, "item_id": string|null, "name": string|null, "description": string, "rarity": "legendary"|"epic"|"elite"|"advanced"|"normal", "tier": 0|1|2|3|4|5, "refine": 0|25|50|75|100, "refine_type": "archer"|"cavalry"|"infantry"|null} | null,
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
  gear: (n) => `REFERENZTAFEL AUSRÜSTUNG (nicht auswerten, nur zum Vergleichen): ${n} nummerierte Kacheln, die gelbe Zahl oben links ist die Nummer (1–${n}).
Vergleiche jedes Feld des Screenshots genau mit diesen Kacheln (Form, Farben, Motiv – die Seltenheitsfarbe des Feldes beim Vergleich ignorieren)
und trage die Nummer des identischen Symbols als "ref" ein. Ohne sicheren Treffer: "ref": null.`,
  commanders: (n) => `REFERENZTAFEL KOMMANDANTEN (nicht auswerten, nur zum Vergleichen): ${n} Porträts, gelbe Nummer oben links, Name darunter.
Sind im Screenshot Kommandanten zu sehen (Porträt, Ganzkörperbild oder Name), trage sie in "commanders" ein – zuerst den Hauptkommandanten (Primär), dann den Sekundären:
"ref" = Nummer des passenden Porträts, "name" = gelesener Name (sonst null), "expertise" = true, wenn der Kommandant erkennbar Expertise hat (alle Fähigkeiten auf Stufe 5 / Expertise-Rahmen), sonst false.
Keine Kommandanten zu sehen: "commanders": [].`
};

// Der Prompt liegt auf dem Server: so kann die Route nicht als allgemeiner Claude-Proxy missbraucht werden.
const PROMPT = (m) => m === 'speedups' ? PROMPT_SPEEDUPS : m === 'ap' ? PROMPT_AP : m === 'governor' ? PROMPT_GOVERNOR : m === 'mats' ? PROMPT_MATS : PROMPT_CLASSIC(m);

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
  const refs = mode === 'gear' && Array.isArray(body?.refs) ? body.refs.slice(0, 2) : [];
  for (const rf of refs) {
    if (!rf || !REF_KINDS.has(rf.kind) || rf.media_type !== 'image/jpeg' || typeof rf.data !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(rf.data)) {
      return res.status(400).json({ error: 'Ungültige Referenztafel.' });
    }
    rf.count = Math.max(1, Math.min(400, Math.round(+rf.count) || 1));
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
            ...refs.flatMap(rf => [{ type: 'text', text: REF_TEXT[rf.kind](rf.count) }, { type: 'image', source: { type: 'base64', media_type: rf.media_type, data: rf.data } }]),
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
