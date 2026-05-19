import { describe, it, expect } from 'vitest';
import {
  sanitizeMessage,
  sanitizeForDisplay,
  isSpamLike,
  extractUrls,
  maskSensitiveData,
} from './sanitize';

describe('sanitizeMessage', () => {
  it('должен обрезать пустой ввод', () => {
    expect(sanitizeMessage('')).toBe('');
    expect(sanitizeMessage('   ')).toBe('');
  });

  it('должен обрезать сообщение по максимальной длине', () => {
    const longText = 'a'.repeat(3000);
    expect(sanitizeMessage(longText).length).toBe(2000);
  });

  it('должен удалять скрипты', () => {
    const malicious = 'Hello<script>alert("xss")</script>World';
    expect(sanitizeMessage(malicious)).toBe('HelloWorld');
  });

  it('должен удалять javascript: URL', () => {
    const malicious = 'click here: javascript:alert(1)';
    expect(sanitizeMessage(malicious)).toBe('click here: alert(1)');
  });

  it('должен удалять обработчики событий', () => {
    const malicious = 'text onclick=alert(1) more';
    expect(sanitizeMessage(malicious)).toBe('text alert(1) more');
  });

  it('должен нормализовать переносы строк', () => {
    expect(sanitizeMessage('a\r\nb\rc\nd')).toBe('a\nb\nc\nd');
    expect(sanitizeMessage('a\n\n\n\nb')).toBe('a\n\nb');
  });

  it('должен нормализовать пробелы', () => {
    expect(sanitizeMessage('hello    world')).toBe('hello world');
    expect(sanitizeMessage('  hello  ')).toBe('hello');
  });
});

describe('sanitizeForDisplay', () => {
  it('должен экранировать HTML спецсимволы', () => {
    expect(sanitizeForDisplay('<script>')).toBe('&lt;script&gt;');
    expect(sanitizeForDisplay('a & b')).toBe('a &amp; b');
    expect(sanitizeForDisplay('"hello"')).toBe('&quot;hello&quot;');
  });

  it('должен обрабатывать пустой ввод', () => {
    expect(sanitizeForDisplay('')).toBe('');
  });
});

describe('isSpamLike', () => {
  it('должен определять повторяющиеся символы', () => {
    expect(isSpamLike('aaaaaaaaaaaaa')).toBe(true);
    expect(isSpamLike('hello')).toBe(false);
  });

  it('должен определять много заглавных букв', () => {
    expect(isSpamLike('AAAAAAAAAAAAAAAAAAAAAAAAAA')).toBe(true);
    expect(isSpamLike('HELLO')).toBe(false);
  });

  it('должен определять очень длинные ссылки', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(150);
    expect(isSpamLike(longUrl)).toBe(true);
    expect(isSpamLike('https://example.com/short')).toBe(false);
  });
});

describe('extractUrls', () => {
  it('должен извлекать ссылки из текста', () => {
    const text = 'Смотри: https://example.com и http://test.ru/page';
    const urls = extractUrls(text);
    expect(urls).toHaveLength(2);
    expect(urls).toContain('https://example.com');
    expect(urls).toContain('http://test.ru/page');
  });

  it('должен возвращать пустой массив без ссылок', () => {
    expect(extractUrls('просто текст')).toEqual([]);
  });
});

describe('maskSensitiveData', () => {
  it('должен маскировать телефоны', () => {
    expect(maskSensitiveData('Звони: +7 999 123-45-67')).toContain('[телефон скрыт]');
    expect(maskSensitiveData('Тел: 8(495)123-45-67')).toContain('[телефон скрыт]');
  });

  it('должен маскировать email', () => {
    expect(maskSensitiveData('Пиши: test@example.com')).toContain('[email скрыт]');
  });

  it('должен маскировать номера карт', () => {
    expect(maskSensitiveData('Карта: 1234 5678 9012 3456')).toContain('[номер карты скрыт]');
    expect(maskSensitiveData('Карта: 1234-5678-9012-3456')).toContain('[номер карты скрыт]');
  });

  it('не должен изменять обычный текст', () => {
    expect(maskSensitiveData('Привет, как дела?')).toBe('Привет, как дела?');
  });
});
