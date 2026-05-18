import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/shared/ui/Button';

type ConfirmOptions = {
  onConfirm: () => void;
  danger?: boolean;
  label?: string;
};

type Props = {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  /** Две кнопки: отмена и подтверждение */
  confirm?: ConfirmOptions;
  /** Подпись единственной кнопки (режим уведомления об ошибке и т.п.) */
  okLabel?: string;
};

/**
 * Модальное окно по центру экрана: уведомление (ОК) или подтверждение (Отмена / Действие).
 */
export function CenterModal({ open, title, description, onClose, confirm, okLabel = 'Понятно' }: Props) {
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

  const isConfirm = Boolean(confirm);

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-[2px]"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <div
        className="relative z-[1] w-full max-w-[min(100%,24rem)] rounded-2xl border border-stone-200/90 bg-white p-6 shadow-2xl shadow-stone-900/20 ring-1 ring-stone-100"
        role={isConfirm ? 'alertdialog' : 'alert'}
        aria-modal="true"
        aria-labelledby="center-modal-title"
        aria-describedby="center-modal-desc"
      >
        <h2 id="center-modal-title" className="text-lg font-semibold leading-snug text-stone-900">
          {title}
        </h2>
        <p id="center-modal-desc" className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-600">
          {description}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          {confirm ? (
            <>
              <Button variant="secondary" type="button" className="w-full sm:w-auto" onClick={onClose}>
                Отмена
              </Button>
              <button
                type="button"
                className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 sm:min-h-0 sm:w-auto sm:py-2 min-h-[44px] touch-manipulation inline-flex items-center justify-center ${
                  confirm.danger
                    ? 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600'
                    : 'bg-amber-600 text-white hover:bg-amber-700 focus-visible:outline-amber-600'
                }`}
                onClick={() => {
                  confirm.onConfirm();
                  onClose();
                }}
              >
                {confirm.label ?? 'Подтвердить'}
              </button>
            </>
          ) : (
            <Button variant="primary" type="button" className="w-full sm:w-auto" onClick={onClose}>
              {okLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
