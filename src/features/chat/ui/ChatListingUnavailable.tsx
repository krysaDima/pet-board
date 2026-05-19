/** Заглушка, когда объявление по чату недоступно (снято или удалено). */
export function ChatListingUnavailable() {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50/90 px-3 py-2.5 sm:px-3.5 sm:py-3"
      role="status"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-xl sm:h-14 sm:w-14">
        📋
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 sm:text-xs">По объявлению</p>
        <p className="text-sm font-medium text-stone-700 sm:text-base">Объявление недоступно</p>
        <p className="mt-0.5 text-xs text-stone-500">Снято с публикации или удалено — переписка сохраняется</p>
      </div>
    </div>
  );
}
