/** Оценка надёжности пароля для подсказки пользователю (без отправки на сервер). */

export type PasswordStrengthInfo = {
  /** 0 — пусто, 1…4 — уровень для полосы */
  level: number;
  label: string;
  detail: string;
  trackClass: string;
  barClass: string;
};

export function getPasswordStrength(password: string): PasswordStrengthInfo {
  if (!password) {
    return {
      level: 0,
      label: '',
      detail: '',
      trackClass: 'bg-stone-200',
      barClass: 'bg-stone-300',
    };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const level = Math.min(4, score);

  if (level <= 1) {
    return {
      level,
      label: 'Очень слабый',
      detail: 'Увеличьте длину (от 8 символов), добавьте цифры, разный регистр и знаки.',
      trackClass: 'bg-red-100',
      barClass: 'bg-red-500',
    };
  }
  if (level === 2) {
    return {
      level,
      label: 'Слабый',
      detail: 'Лучше добавить ещё тип символов или длину от 12 символов.',
      trackClass: 'bg-orange-100',
      barClass: 'bg-orange-500',
    };
  }
  if (level === 3) {
    return {
      level,
      label: 'Средний',
      detail: 'Подойдёт для большинства случаев; можно усилить длиной и символами.',
      trackClass: 'bg-amber-100',
      barClass: 'bg-amber-500',
    };
  }
  return {
    level,
    label: 'Надёжный',
    detail: 'Хороший баланс длины и разнообразия символов.',
    trackClass: 'bg-emerald-100',
    barClass: 'bg-emerald-600',
  };
}
