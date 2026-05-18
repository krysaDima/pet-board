import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchMediaBlobUrl } from '@/shared/lib/mediaFetch';

type Options = {
  /** После ошибки обычного <img src> пробуем GET с Authorization (защищённые файлы на API). */
  authFallback: boolean;
};

/**
 * URL для <img>: сначала прямой src; при onError — один раз пробуем запрос с Bearer.
 */
export function useAuthAwareImg(src: string | null | undefined, { authFallback }: Options): {
  displaySrc: string;
  onImgError: () => void;
} {
  const raw = (src ?? '').trim();
  const [displaySrc, setDisplaySrc] = useState(raw);
  const blobUrlRef = useRef<string | null>(null);
  const authTriedRef = useRef(false);

  useEffect(() => {
    authTriedRef.current = false;
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setDisplaySrc(raw);
  }, [raw]);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  const onImgError = useCallback(() => {
    if (!raw) return;
    if (!authFallback) {
      setDisplaySrc('');
      return;
    }
    /* Повторная ошибка (например blob не открылся) — показываем плейсхолдер, а не битый <img>. */
    if (authTriedRef.current) {
      setDisplaySrc('');
      return;
    }
    authTriedRef.current = true;
    void (async () => {
      const blobUrl = await fetchMediaBlobUrl(raw);
      if (blobUrl) {
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = blobUrl;
        setDisplaySrc(blobUrl);
      } else {
        setDisplaySrc('');
      }
    })();
  }, [authFallback, raw]);

  return { displaySrc, onImgError };
}
