// Vercel Serverless Function: POST /api/scan
// Nimmt Screenshots vom Browser entgegen, fragt die Claude API (Vision) ab und gibt die Rohantwort zurück.
// Der API-Key kommt ausschließlich aus der Umgebungsvariable ANTHROPIC_API_KEY und verlässt nie den Server.

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
const MODES = new Set(['resources', 'vip', 'gems']);
const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_IMAGES = 5;
const MAX_TOTAL_B64 = 4_300_000; // Vercel erlaubt max. 4,5 MB pro Anfrage

// Der Prompt liegt auf dem Server: so kann die Route nicht als allgemeiner Claude-Proxy missbraucht werden.
const PROMPT = (m) => `Du analysierst Screenshots aus dem Handyspiel "Rise of Kingdoms" (Sprache der Spieloberfläche kann Deutsch, Englisch o. a. sein).

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
  if (!images.length) return res.status(400).json({ error: 'Kein Bild übermittelt.' });
  if (images.length > MAX_IMAGES) return res.status(400).json({ error: `Maximal ${MAX_IMAGES} Bilder pro Analyse.` });
  let total = 0;
  for (const im of images) {
    if (!im || !TYPES.has(im.media_type) || typeof im.data !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(im.data)) {
      return res.status(400).json({ error: 'Ungültiges Bildformat.' });
    }
    total += im.data.length;
  }
  if (total > MAX_TOTAL_B64) return res.status(413).json({ error: 'Bilder zu groß.' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
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
      // Keine Details zum Key an den Browser geben
      const status = r.status === 429 ? 429 : r.status === 529 ? 503 : 502;
      const msg = r.status === 401 ? 'Server-API-Key ungültig – bitte in Vercel prüfen.'
        : r.status === 404 ? `Modell „${MODEL}“ nicht verfügbar – ANTHROPIC_MODEL in Vercel prüfen.`
        : r.status === 429 ? 'Rate-Limit erreicht. Kurz warten und erneut versuchen.'
        : r.status === 529 ? 'Claude ist gerade überlastet. Bitte gleich nochmal versuchen.'
        : `Claude-API-Fehler (${r.status}).`;
      console.error('Anthropic API error', r.status, data?.error?.message);
      return res.status(status).json({ error: msg });
    }
    const text = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n');
    return res.status(200).json({ text });
  } catch (e) {
    console.error('scan failed', e);
    return res.status(502).json({ error: 'Verbindung zur Claude API fehlgeschlagen.' });
  }
};
