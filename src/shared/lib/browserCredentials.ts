/**
 * Сохранение пары логин/пароль стандартными средствами браузера (Credential Management API),
 * вместо записи пароля в localStorage. Успешный вызов обычно показывает системный диалог «Сохранить?».
 *
 * Нужен защищённый контекст (`https:` или `localhost`). В деве по IP без HTTPS API может быть недоступен —
 * тогда остаются `autocomplete` и встроенный менеджер паролей на полях формы.
 */
type PasswordCredentialInit = {
  id: string;
  password: string;
  name?: string;
};

export async function offerToSavePassword(opts: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<void> {
  if (typeof window === 'undefined' || !window.isSecureContext) return;
  if (typeof navigator?.credentials?.store !== 'function') return;

  type PasswordCtor = new (init: PasswordCredentialInit) => Credential;
  const PC = (globalThis as unknown as { PasswordCredential?: PasswordCtor }).PasswordCredential;
  if (!PC) return;

  try {
    const credential = new PC({
      id: opts.email,
      password: opts.password,
      name: opts.displayName?.trim() || opts.email,
    });
    await navigator.credentials.store(credential);
  } catch {
    /* пользователь отказал, браузер не поддерживает или политика сайта */
  }
}

/** Удалить устаревший ключ, если раньше пароль писали в localStorage (миграция). */
export function clearLegacySavedPasswordStorage(): void {
  try {
    localStorage.removeItem('pet-board-saved-login');
  } catch {
    /* */
  }
}
