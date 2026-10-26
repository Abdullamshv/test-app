import { useCallback, useState } from 'react';

// Избранные матчи (по id). Хранятся только в памяти, пока открыто приложение.
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  // Всегда создаём новый массив: React сравнивает state по ссылке.
  const toggle = useCallback((id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  return { favorites, isFavorite, toggle };
}
