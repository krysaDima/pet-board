/** Анимация очистки истории чата (вспышка + успех). */
export function ChatClearOverlay({ phase }: { phase: 'idle' | 'clearing' | 'success' }) {
  if (phase === 'idle') return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden rounded-2xl"
      aria-hidden
    >
      {phase === 'clearing' ? (
        <>
          <div className="chat-clear-sweep absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/50 to-transparent" />
          <div className="relative flex flex-col items-center gap-2">
            <span className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-amber-300/40 border-t-amber-600" />
            <span className="text-sm font-medium text-amber-900/80">Очищаем историю…</span>
          </div>
        </>
      ) : null}
      {phase === 'success' ? (
        <div className="chat-clear-success flex flex-col items-center gap-2 rounded-2xl bg-white/90 px-6 py-4 shadow-lg backdrop-blur-sm">
          <span className="text-3xl">✨</span>
          <span className="text-sm font-semibold text-stone-800">История очищена</span>
          <span className="text-xs text-stone-500">Только у вас — собеседник видит сообщения</span>
        </div>
      ) : null}
    </div>
  );
}
