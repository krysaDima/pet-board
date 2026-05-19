import { useState, useRef, useEffect, useCallback } from 'react';

/** Категории эмодзи */
const EMOJI_CATEGORIES = {
  smileys: {
    label: 'Смайлики',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
      '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛',
      '😜', '🤪', '😝', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐',
      '😑', '😶', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥', '😌', '😔',
      '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵',
      '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐',
    ],
  },
  animals: {
    label: 'Животные',
    icon: '🐶',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
      '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆',
      '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋',
      '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎',
      '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟',
      '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧',
    ],
  },
  gestures: {
    label: 'Жесты',
    icon: '👍',
    emojis: [
      '👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙',
      '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖',
      '👏', '🙌', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦶',
      '🦵', '🧠', '👀', '👁️', '👅', '👄', '💋', '❤️', '🧡', '💛',
      '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '💕', '💞',
      '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '💯', '💢', '💥',
    ],
  },
  objects: {
    label: 'Объекты',
    icon: '🎁',
    emojis: [
      '🎁', '🎀', '🎈', '🎉', '🎊', '🎄', '🎃', '🎗️', '🎟️', '🎫',
      '🏆', '🏅', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🥎',
      '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🏒', '🥅', '⛳', '🏹',
      '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿',
      '🔔', '🔕', '🎵', '🎶', '🎤', '🎧', '📻', '🎷', '🎸', '🎹',
      '🎺', '🎻', '🪕', '🥁', '📱', '📲', '💻', '🖥️', '🖨️', '⌨️',
    ],
  },
  nature: {
    label: 'Природа',
    icon: '🌸',
    emojis: [
      '🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱',
      '🪴', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁',
      '🍂', '🍃', '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭',
      '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🫐', '🥝', '🍅', '🫒',
      '🥥', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🫑', '🥒', '🥬',
      '🥦', '🧄', '🧅', '🍄', '🥜', '🌰', '☀️', '🌤️', '⛅', '🌈',
    ],
  },
  food: {
    label: 'Еда',
    icon: '🍔',
    emojis: [
      '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🫔', '🥙', '🧆',
      '🥚', '🍳', '🥘', '🍲', '🫕', '🥣', '🥗', '🍿', '🧈', '🧂',
      '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢',
      '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🦀', '🦞',
      '🦐', '🦑', '🦪', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰',
      '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '☕', '🫖', '🍵',
    ],
  },
} as const;

type EmojiCategory = keyof typeof EMOJI_CATEGORIES;

type Props = {
  onSelect: (emoji: string) => void;
  onClose: () => void;
};

/** Панель выбора эмодзи */
export function EmojiPicker({ onSelect, onClose }: Props) {
  const [activeCategory, setActiveCategory] = useState<EmojiCategory>('smileys');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('recent-emojis');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Закрытие по клику вне
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Закрытие по Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleEmojiClick = useCallback(
    (emoji: string) => {
      onSelect(emoji);
      // Добавляем в недавние
      setRecentEmojis((prev) => {
        const filtered = prev.filter((e) => e !== emoji);
        const updated = [emoji, ...filtered].slice(0, 20);
        try {
          localStorage.setItem('recent-emojis', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    },
    [onSelect],
  );

  // Фильтрация эмодзи по поиску
  const filteredEmojis = searchQuery
    ? Object.values(EMOJI_CATEGORIES).flatMap((cat) => cat.emojis).filter((emoji) => emoji.includes(searchQuery))
    : EMOJI_CATEGORIES[activeCategory].emojis;

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full left-0 z-50 mb-2 w-[320px] rounded-2xl border border-stone-200 bg-white shadow-xl"
      role="dialog"
      aria-label="Выбор эмодзи"
    >
      {/* Поиск */}
      <div className="border-b border-stone-100 p-2">
        <input
          type="text"
          placeholder="Поиск эмодзи..."
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
        />
      </div>

      {/* Категории */}
      {!searchQuery && (
        <div className="flex gap-1 border-b border-stone-100 px-2 py-1.5">
          {recentEmojis.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveCategory('smileys')}
              className={`rounded-lg p-2 text-lg transition ${
                activeCategory === 'smileys' ? 'bg-amber-100' : 'hover:bg-stone-100'
              }`}
              title="Недавние"
            >
              🕐
            </button>
          )}
          {(Object.entries(EMOJI_CATEGORIES) as [EmojiCategory, typeof EMOJI_CATEGORIES[EmojiCategory]][]).map(
            ([key, { icon, label }]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveCategory(key)}
                className={`rounded-lg p-2 text-lg transition ${
                  activeCategory === key ? 'bg-amber-100' : 'hover:bg-stone-100'
                }`}
                title={label}
              >
                {icon}
              </button>
            ),
          )}
        </div>
      )}

      {/* Недавние */}
      {!searchQuery && recentEmojis.length > 0 && activeCategory === 'smileys' && (
        <div className="border-b border-stone-100 p-2">
          <p className="mb-1 text-xs font-medium text-stone-500">Недавние</p>
          <div className="flex flex-wrap gap-1">
            {recentEmojis.map((emoji, i) => (
              <button
                key={`recent-${i}`}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                className="rounded-lg p-1.5 text-xl transition hover:bg-stone-100 active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Эмодзи */}
      <div className="max-h-[240px] overflow-y-auto p-2">
        {!searchQuery && (
          <p className="mb-1 text-xs font-medium text-stone-500">
            {EMOJI_CATEGORIES[activeCategory].label}
          </p>
        )}
        <div className="grid grid-cols-8 gap-0.5">
          {filteredEmojis.map((emoji, i) => (
            <button
              key={`${emoji}-${i}`}
              type="button"
              onClick={() => handleEmojiClick(emoji)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition hover:bg-stone-100 active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>
        {filteredEmojis.length === 0 && (
          <p className="py-4 text-center text-sm text-stone-400">Ничего не найдено</p>
        )}
      </div>
    </div>
  );
}
