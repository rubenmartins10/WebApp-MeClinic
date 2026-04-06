/**
 * Normalises a signature PNG for PDF output: always white background + dark strokes.
 * Detects dark-theme signatures (light strokes on dark bg) and inverts the pixels.
 *
 * @param {string} src - Base64 PNG data-URI of the signature
 * @returns {Promise<string>} Normalised PNG data-URI (white bg, dark strokes)
 */
export const flattenToWhite = (src) =>
  new Promise((resolve) => {
    if (!src || !src.startsWith('data:')) { resolve(src); return; }
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth  || 600;
      const h = img.naturalHeight || 150;
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');

      // Draw original to read raw pixels
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, w, h);
      const d = imageData.data;

      // Sample a small grid to detect average background brightness
      let sum = 0, count = 0;
      for (let y = 0; y < Math.min(8, h); y++) {
        for (let x = 0; x < Math.min(8, w); x++) {
          const i = (y * w + x) * 4;
          sum += (d[i] + d[i + 1] + d[i + 2]) / 3;
          count++;
        }
      }
      const isDark = (sum / count) < 128;

      if (isDark) {
        // Invert every pixel RGB (keep alpha) — dark bg→white, light strokes→dark
        for (let i = 0; i < d.length; i += 4) {
          d[i]     = 255 - d[i];
          d[i + 1] = 255 - d[i + 1];
          d[i + 2] = 255 - d[i + 2];
        }
      }

      // putImageData overwrites every pixel including alpha, so we need a second
      // canvas: draw the raw pixels there, then composite onto a white fill.
      ctx.clearRect(0, 0, w, h);
      ctx.putImageData(imageData, 0, 0);

      const out = document.createElement('canvas');
      out.width = w; out.height = h;
      const octx = out.getContext('2d');
      octx.fillStyle = '#ffffff';
      octx.fillRect(0, 0, w, h);
      octx.drawImage(c, 0, 0); // composite signature alpha over white bg

      // JPEG is 5-10× smaller than PNG → smaller PDFs → better mobile compatibility
      resolve(out.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
