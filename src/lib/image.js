// Downscale a photo before upload: Vercel Functions accept at most 4.5 MB,
// and Gemma does not need more than ~1024 px to read a room.
export async function compressPhoto(fileOrBlob, maxSide = 1024, quality = 0.82) {
  const url = URL.createObjectURL(fileOrBlob);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Foto tidak bisa dibaca. Coba foto lain (JPG/PNG).'));
      el.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
    return { dataUrl: canvas.toDataURL('image/jpeg', quality), width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Dark or light text for a coloured swatch.
export function inkFor(hex) {
  const n = parseInt(hex.slice(1), 16);
  const luma = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return luma > 150 ? '#1c1917' : '#fafaf9';
}
