/** Сжатие фото профиля/галереи перед upload — меньше трафика на мобильном LTE. */
const MOBILE_MAX_SIDE = 1280;
const DESKTOP_MAX_SIDE = 1920;
const JPEG_QUALITY = 0.84;
const SKIP_BELOW_BYTES = 200_000;

function isNarrowViewport(): boolean {
  if (typeof globalThis === 'undefined' || !('matchMedia' in globalThis)) return true;
  return globalThis.matchMedia('(max-width: 639px)').matches;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Не удалось прочитать изображение'));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), type, quality);
  });
}

/**
 * Уменьшает и перекодирует JPEG/PNG/WebP; GIF и уже маленькие файлы не трогает.
 */
export async function compressProfileImageForUpload(file: File): Promise<File> {
  if (/^image\/gif$/i.test(file.type)) return file;
  if (file.size > 0 && file.size < SKIP_BELOW_BYTES) return file;

  const maxSide = isNarrowViewport() ? MOBILE_MAX_SIDE : DESKTOP_MAX_SIDE;
  const img = await loadImageFromFile(file);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) return file;

  const scale = Math.min(1, maxSide / Math.max(w, h));
  if (scale >= 1 && file.size < SKIP_BELOW_BYTES * 4) return file;

  const tw = Math.max(1, Math.round(w * scale));
  const th = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement('canvas');
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, tw, th);

  const preferWebp = typeof createImageBitmap !== 'undefined';
  const outType = preferWebp && !/\.gif$/i.test(file.name) ? 'image/webp' : 'image/jpeg';
  const blob = await canvasToBlob(canvas, outType, JPEG_QUALITY);
  if (!blob || blob.size >= file.size) return file;

  const ext = outType === 'image/webp' ? '.webp' : '.jpg';
  const base = file.name.replace(/\.[^.]+$/, '') || 'photo';
  return new File([blob], `${base}${ext}`, { type: outType, lastModified: Date.now() });
}
