# Данные и экран (часть 1)

Формат `data/matches.json`:
```jsonc
{ "round": 12, "matches": [ { "id", "startsAt": ISO|null, "status", "minute"?: number,
  "home": {id,name,city}, "away": {id,name,city}, "score": {home,away} | null } ] }
```
Ответ — **объект** `{ round, matches }`, а не массив. Заголовок можно сделать «Матчи тура · 12-й тур».

## Неочевидные случаи в данных (на момент написания: 8 матчей)

| Случай | Пример | Ловушка | Что делать |
|---|---|---|---|
| Статусы: `finished`, `live`, `scheduled`, `postponed` | m4 live, m7 postponed | в фильтре только «Предстоящие/Завершённые» — live и postponed «теряются» | осознанно распределить (см. ниже) и объяснить в SOLUTION.md |
| `startsAt: null` | m7 (перенесён) | `new Date(null)` = 1 января 1970; `new Date(undefined)`/мусор = Invalid Date; сортировка по null ломается | показывать «Дата уточняется»; при сортировке null — в конец |
| `score: null` | scheduled, postponed | обращение `score.home` → падение | проверять `score !== null`, показывать «—» или «vs» |
| Счёт `0:0` | m2 (0–0) | `score.home && ...`/`if (score.home)` скроет ноль как falsy | сравнивать с `null`/`undefined`, не по truthiness |
| `minute` только у live | m4 (67) | поле опционально | показывать «Идёт · 67'» |
| Live-матч со счётом | m4 1:1 | — | счёт показывать, статус «Идёт» |
| Длинные названия | «Пари Нижний Новгород», «Динамо Махачкала» | вёрстка ломается | `numberOfLines`/`flexShrink`, перенос |
| Одинаковые названия города | три матча из Москвы | — | ключи/сравнение по `id`, не по городу/имени |
| Неизвестный статус в будущем | — | `switch` без default → undefined в UI | fallback: показать исходную строку статуса, класть только во «Все» |
| Порядок | в файле не гарантирован | — | сортировать по `startsAt` |

Всегда перепроверь реальный файл — могут быть добавлены/изменены случаи.

## Рекомендуемое решение по фильтру
- **Завершённые** = `finished`.
- **Предстоящие** = всё, что не завершено: `scheduled`, `live`, `postponed`. Обоснование: «ещё не закончен» — это то, что пользователь хочет увидеть в разделе «не итоги»; иначе идущий матч и перенесённый матч исчезнут из обоих фильтров и будут видны только во «Все». Перенесённый — это матч, который ещё предстоит сыграть. Идущий можно поднять выше остальных предстоящих.
- **Все** = всё, включая неизвестные статусы.
Альтернатива (live отдельно) допустима, но фильтров по условию три — выбери и объясни. Решение должно быть в одном месте — чистая функция `filterMatches(matches, filter)` в отдельном файле (удобно тестировать и выбрать как доп. задание).

## Статусы по-русски
`scheduled` → «Запланирован», `live` → «Идёт» (+ минута), `finished` → «Завершён», `postponed` → «Перенесён». Словарь `Record<MatchStatus, string>` + fallback на сырое значение.

## Типы
```ts
export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed';
export type Team = { id: string; name: string; city: string };
export type Match = {
  id: string;
  startsAt: string | null;
  status: MatchStatus | (string & {}); // запас на неизвестные статусы
  minute?: number;
  home: Team; away: Team;
  score: { home: number; away: number } | null;
};
export type MatchesResponse = { round: number; matches: Match[] };
```
Лежат в `src/types.ts`.

## Дата и время в поясе устройства
`startsAt` — ISO в UTC (`Z`). Парсить `new Date(iso)` и форматировать локальным временем:
```ts
new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
```
Проверка на невалидное: `Number.isNaN(date.getTime())`. Не вычитай/прибавляй часы руками (не хардкодь МСК). Для проверки можно сменить пояс ОС/браузера и убедиться, что время изменилось.

## Загрузка данных
- Хук `useMatches()` (или в экране): `status: 'loading' | 'success' | 'error'`, `data`, `error`, `refresh()`, `updatedAt: Date | null`.
- `fetch(MATCHES_URL)`, **обязательно** `if (!res.ok) throw ...` (fetch не бросает на 404/500), `res.json()` в `try/catch`, проверка формы (`Array.isArray(json.matches)`).
- Первая загрузка — спиннер на весь экран; повторная (pull-to-refresh/кнопка) — **не** прячет список, показывает `refreshing` в `RefreshControl`. Ошибка при повторной загрузке не должна стирать уже показанные данные и не должна сдвигать `updatedAt`.
- Защита от гонок: `AbortController` или счётчик запросов — применяется результат только последнего.
- Не вызывай `setState` после размонтирования; чисти эффект.
- `RefreshControl` работает и в вебе (react-native-web), но на десктопном вебе pull-жеста нет — поэтому нужна ещё и кнопка «Обновить».

## Экран
- `FlatList`: `data={filtered}`, `keyExtractor={m => m.id}`, `extraData={favorites}`, `ListEmptyComponent` (разные тексты: «Матчей в туре нет» vs «Нет матчей с таким фильтром»), `refreshControl`.
- Над списком: заголовок тура, `FilterTabs` (Pressable-сегменты, активный выделен, `accessibilityState={{ selected }}`), строка «Обновлено…» + кнопка «Обновить».
- Если `matches` пуст — отдельный empty-экран; если после фильтрации пусто — сообщение про фильтр.
- Стили через `StyleSheet.create`, без дизайн-излишеств: «аккуратно и читаемо — достаточно».
- Звёздочка: `<FavoriteButton active={isFavorite(m.id)} onPress={() => toggle(m.id)} />`.
- Компоненты в `src/components/`: `MatchCard`, `FilterTabs`, при желании `StatusBadge`. Утилиты (`formatKickoff`, `statusLabel`, `filterMatches`) — в `src/utils/`.
