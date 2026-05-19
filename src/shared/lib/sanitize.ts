/**
 * Утилиты безопасности для обработки пользовательского ввода.
 * Защита от XSS и нежелательного контента.
 */

/** Максимальная длина сообщения */
const MAX_MESSAGE_LENGTH = 2000;

/** Паттерны для блокировки опасного контента */
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:/gi,
];

/** Экранирование HTML спецсимволов */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

/** Удаление потенциально опасных паттернов */
function removeDangerousPatterns(text: string): string {
  let result = text;
  for (const pattern of DANGEROUS_PATTERNS) {
    result = result.replace(pattern, '');
  }
  return result;
}

/** Нормализация пробелов и переносов строк */
function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Санитизация сообщения чата.
 * Защищает от XSS, ограничивает длину, нормализует форматирование.
 */
export function sanitizeMessage(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  let result = input;
  
  // Обрезаем по длине
  if (result.length > MAX_MESSAGE_LENGTH) {
    result = result.slice(0, MAX_MESSAGE_LENGTH);
  }
  
  // Удаляем опасные паттерны
  result = removeDangerousPatterns(result);
  
  // Нормализуем пробелы
  result = normalizeWhitespace(result);
  
  return result;
}

/**
 * Санитизация для отображения в HTML (экранирование).
 * Используется при выводе пользовательского контента в DOM.
 */
export function sanitizeForDisplay(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return escapeHtml(input);
}

/**
 * Проверка на спам-паттерны.
 */
export function isSpamLike(text: string): boolean {
  const spamPatterns = [
    /(.)\1{10,}/,              // Повторяющиеся символы
    /https?:\/\/[^\s]{100,}/i, // Очень длинные ссылки
    /[A-Z]{20,}/,              // Много заглавных букв подряд
  ];
  return spamPatterns.some((p) => p.test(text));
}

/**
 * Извлечение ссылок из текста для превью.
 */
export function extractUrls(text: string): string[] {
  const urlPattern = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  return text.match(urlPattern) ?? [];
}

/**
 * Проверка валидности email.
 */
export function isValidEmail(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

/**
 * Маскирование чувствительных данных.
 */
export function maskSensitiveData(text: string): string {
  // Маскируем номера телефонов
  let result = text.replace(
    /(\+?7|8)?[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/g,
    '[телефон скрыт]'
  );
  
  // Маскируем email
  result = result.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '[email скрыт]'
  );
  
  // Маскируем номера карт
  result = result.replace(
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    '[номер карты скрыт]'
  );
  
  return result;
}
