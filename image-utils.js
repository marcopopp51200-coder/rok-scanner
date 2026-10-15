// image-utils.js – hochwertiges Verkleinern von Bildern für den Wiz fan Club
// Wird von index.html benutzt (prepareImage, cropSquare, scCompress).

// Bild aus einer Datei laden (beachtet die EXIF-Drehung von Handyfotos)
async function hqLoadImage(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // Fallback für ältere Browser
    return await new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Bild konnte nicht gelesen werden.')); };
      img.src = url;
    });
  }
}

function hqCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, w); c.height = Math.max(1, h);
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  return c;
}

// Zeichnet den Ausschnitt (sx, sy, sw, sh) von src in Zielgröße w × h.
// Starkes Verkleinern passiert in Halbierungsschritten → scharfe Kanten, kein Flimmern bei Text.
// Hintergrund wird weiß gefüllt, damit transparente PNGs als JPEG nicht schwarz werden.
function hqResize(src, w, h, sx = 0, sy = 0, sw = src.width, sh = src.height) {
  let cur = src, cx = sx, cy = sy, cw = sw, ch = sh;
  while (cw / 2 >= w && ch / 2 >= h) {
    const nw = Math.round(cw / 2), nh = Math.round(ch / 2);
    const step = hqCanvas(nw, nh);
    step.getContext('2d').drawImage(cur, cx, cy, cw, ch, 0, 0, nw, nh);
    cur = step; cx = 0; cy = 0; cw = nw; ch = nh;
  }
  const out = hqCanvas(w, h), g = out.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, out.width, out.height);
  g.drawImage(cur, cx, cy, cw, ch, 0, 0, out.width, out.height);
  return out;
}
