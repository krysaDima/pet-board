import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'pet-board-favorites';

type FavoritesStore = {
  ids: Set<string>;
  listeners: Set<() => void>;
};

const store: FavoritesStore = {
  ids: new Set<string>(),
  listeners: new Set(),
};

function loadFromStorage(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw) as string[];
      store.ids = new Set(arr);
    }
  } catch {
    store.ids = new Set();
  }
}

function saveToStorage(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...store.ids]));
  } catch {
    // ignore
  }
}

function notify(): void {
  store.listeners.forEach((listener) => listener());
}

loadFromStorage();

function subscribe(listener: () => void): () => void {
  store.listeners.add(listener);
  return () => store.listeners.delete(listener);
}

function getSnapshot(): Set<string> {
  return store.ids;
}

/** Хук для работы с избранными объявлениями (localStorage) */
export function useFavorites() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const isFavorite = useCallback((id: string): boolean => {
    return ids.has(id);
  }, [ids]);

  const toggle = useCallback((id: string): void => {
    if (store.ids.has(id)) {
      store.ids.delete(id);
    } else {
      store.ids.add(id);
    }
    store.ids = new Set(store.ids);
    saveToStorage();
    notify();
  }, []);

  const add = useCallback((id: string): void => {
    if (!store.ids.has(id)) {
      store.ids.add(id);
      store.ids = new Set(store.ids);
      saveToStorage();
      notify();
    }
  }, []);

  const remove = useCallback((id: string): void => {
    if (store.ids.has(id)) {
      store.ids.delete(id);
      store.ids = new Set(store.ids);
      saveToStorage();
      notify();
    }
  }, []);

  const count = ids.size;
  const favoriteIds = [...ids];

  return {
    isFavorite,
    toggle,
    add,
    remove,
    count,
    favoriteIds,
  };
}
