# Разбор багов части 2 (чужой код)

Исходный код на момент написания скилла — сверь с актуальными файлами репозитория.

## Жалоба 1: «Звёздочки горят у всех сразу; нажатие срабатывает непредсказуемо»

В `useFavorites.ts` **два** независимых бага.

### 1a. `isFavorite` — путаница с `indexOf`
```ts
const isFavorite = (id: string) => Boolean(favorites.indexOf(id));
```
`indexOf` возвращает **индекс**, а не «есть/нет»: `-1` если элемента нет, `0` для первого элемента. `Boolean(-1) === true`, `Boolean(0) === false`. В итоге:
- пустой список → у всех матчей `-1` → `true` → **горят все звёзды**;
- единственный/первый добавленный элемент → индекс `0` → `false` → при нажатии звезда «гаснет вместо того, чтобы загореться».

Исправление: `favorites.includes(id)`.

### 1b. `toggle` — мутация state
```ts
favorites.push(id);       // меняем тот же массив
setFavorites(favorites);  // кладём ту же ссылку
```
React сравнивает новое значение со старым по ссылке (`Object.is`). Ссылка та же → React считает, что ничего не изменилось и **не перерисовывает** компонент → «ничего не меняется». Массив при этом уже изменён, поэтому звезда «догоняет» при ближайшем несвязанном рендере — отсюда «непредсказуемо». Плюс `FlatList` не перерисует ячейки, если не поменялись его `data`/`extraData`.

Исправление — создавать **новый** массив и использовать функциональный апдейт (чтобы не зависеть от устаревшего замыкания):
```ts
const toggle = (id: string) =>
  setFavorites(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
```

Эталонная версия файла:
```ts
import { useCallback, useState } from 'react';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const toggle = useCallback((id: string) => {
    setFavorites(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  }, []);

  return { favorites, isFavorite, toggle };
}
```
На экране: `FlatList` должен получать `extraData={favorites}` (или данные, зависящие от favorites), иначе строки не перерисуются, потому что `FlatList` — PureComponent и смотрит только на свои пропсы.

Для SOLUTION.md (пример структуры, пользователь переписывает своими словами): *почему* — `indexOf` вернул индекс, а не булево, и state мутировался на месте; *что исправили* — `includes` и неизменяемое обновление.

## Жалоба 2: «Обновлено N сек назад» застывает и не сбрасывается

```ts
const [seconds, setSeconds] = useState(0);
useEffect(() => {
  setInterval(() => { setSeconds(seconds + 1); }, 1000);
}, []);
```
Три проблемы:
1. **Устаревшее замыкание (stale closure).** Эффект с `[]` запускается один раз; колбэк интервала запомнил `seconds === 0` навсегда. Каждую секунду выполняется `setSeconds(0 + 1)` → число застывает на 1.
2. **Пропс `since` игнорируется.** Счётчик просто считает тики с момента монтирования и не знает, когда реально были загружены данные → после «Обновить» не сбрасывается.
3. **Нет очистки.** `setInterval` не останавливается при размонтировании и не пересоздаётся при смене `since` → утечка таймеров, обновления состояния у размонтированного компонента.

Исправление: хранить не счётчик, а «текущее время», а секунды **вычислять** из `since`; эффект зависит от `since`, чистит интервал.
```tsx
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

type Props = { since: Date };

export function UpdatedAgo({ since }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [since]);

  const seconds = Math.max(0, Math.floor((now - since.getTime()) / 1000));
  return <Text style={styles.text}>Обновлено {seconds} сек назад</Text>;
}
// styles — как были
```
Важно на экране: `since` менять **только после успешной** загрузки (в комментарии компонента сказано «момент последней успешной загрузки»), а не при ошибке. Хранить как `Date | null` и показывать подпись, когда он есть. Если передавать `new Date()` прямо в JSX на каждый рендер — эффект будет перезапускаться постоянно и счётчик будет сбрасываться: храни дату в state.
