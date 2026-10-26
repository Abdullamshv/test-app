const UNKNOWN_DATE = 'Дата уточняется';

// startsAt приходит в UTC (ISO-строка с «Z»). toLocaleString показывает время
// в часовом поясе устройства, вручную смещать часы не нужно.
export function formatKickoff(startsAt: string | null): string {
  if (startsAt === null) return UNKNOWN_DATE;

  const date = new Date(startsAt);
  // Некорректная строка даёт Invalid Date, а не исключение.
  if (Number.isNaN(date.getTime())) return UNKNOWN_DATE;

  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}
