import type { MessageStatus as Status } from '@/entities/chat/model/types';

type Props = {
  status: Status;
  className?: string;
};

/** Иконка статуса доставки сообщения */
export function MessageStatus({ status, className = '' }: Props) {
  const baseClass = `inline-flex items-center ${className}`;

  switch (status) {
    case 'sending':
      return (
        <span className={baseClass} title="Отправка...">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </span>
      );
    case 'sent':
      return (
        <span className={baseClass} title="Отправлено">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      );
    case 'delivered':
      return (
        <span className={baseClass} title="Доставлено">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M2 12l5 5L17 7" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 12l5 5L23 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      );
    case 'read':
      return (
        <span className={`${baseClass} text-blue-400`} title="Прочитано">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M2 12l5 5L17 7" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 12l5 5L23 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      );
    case 'error':
      return (
        <span className={`${baseClass} text-red-500`} title="Ошибка отправки">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
        </span>
      );
    default:
      return null;
  }
}
