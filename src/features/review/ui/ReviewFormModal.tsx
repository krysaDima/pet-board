import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/shared/ui/Button';
import type { Review } from '@/entities/user/model/types';

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (rating: number, text: string) => void;
  pending: boolean;
  targetUserName: string;
  /** Если передан — режим редактирования */
  existingReview?: Review | null;
};

/** Модалка создания/редактирования отзыва */
export function ReviewFormModal({ open, onClose, onSubmit, pending, targetUserName, existingReview }: Props) {
  const isEdit = Boolean(existingReview);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      if (existingReview) {
        setRating(existingReview.rating);
        setText(existingReview.text);
      } else {
        setRating(5);
        setText('');
      }
      setHoverRating(null);
    }
  }, [open, existingReview]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const displayRating = hoverRating ?? rating;

  const ratingLabels: Record<number, string> = {
    1: 'Ужасно',
    2: 'Плохо',
    3: 'Нормально',
    4: 'Хорошо',
    5: 'Отлично',
  };

  const handleSubmit = () => {
    onSubmit(rating, text.trim());
  };

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-[2px]"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <div
        className="relative z-[1] w-full max-w-md rounded-2xl border border-stone-200/90 bg-white p-6 shadow-2xl shadow-stone-900/20 ring-1 ring-stone-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-form-title"
      >
        <h2 id="review-form-title" className="text-xl font-semibold leading-snug text-stone-900">
          {isEdit ? 'Редактировать отзыв' : 'Оставить отзыв'}
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          О пользователе <span className="font-medium text-stone-700">{targetUserName}</span>
        </p>

        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-700">Оценка</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="group relative p-1 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
                  aria-label={`${star} ${star === 1 ? 'звезда' : star < 5 ? 'звезды' : 'звёзд'}`}
                >
                  <svg
                    className={`h-8 w-8 transition-colors ${
                      star <= displayRating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-stone-300 fill-none'
                    }`}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    fill={star <= displayRating ? 'currentColor' : 'none'}
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>
            <p className="text-sm font-medium text-amber-700">{ratingLabels[displayRating]}</p>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">Комментарий</span>
            <textarea
              className="mt-1.5 min-h-[100px] w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 transition resize-y"
              placeholder="Поделитесь впечатлениями о сотрудничестве..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={1000}
              disabled={pending}
            />
            <span className="mt-1 block text-xs text-stone-400">{text.length}/1000</span>
          </label>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" type="button" className="w-full sm:w-auto" disabled={pending} onClick={onClose}>
            Отмена
          </Button>
          <Button
            variant="primary"
            type="button"
            className="w-full sm:w-auto"
            disabled={pending}
            onClick={handleSubmit}
          >
            {pending ? 'Сохранение...' : isEdit ? 'Сохранить изменения' : 'Отправить отзыв'}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
