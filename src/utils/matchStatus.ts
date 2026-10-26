import type { Match, MatchStatus } from '../types';

const STATUS_LABELS: Record<MatchStatus, string> = {
  scheduled: 'Запланирован',
  live: 'Идёт',
  finished: 'Завершён',
  postponed: 'Перенесён',
};

function isKnownStatus(status: string): status is MatchStatus {
  // hasOwnProperty, а не `in`: иначе статус вроде «toString» сойдёт за известный.
  return Object.prototype.hasOwnProperty.call(STATUS_LABELS, status);
}

// Статус по-русски. Для неизвестного статуса показываем исходную строку.
export function statusLabel(match: Pick<Match, 'status' | 'minute'>): string {
  const label = isKnownStatus(match.status) ? STATUS_LABELS[match.status] : match.status;

  if (match.status === 'live' && typeof match.minute === 'number') {
    return `${label} · ${match.minute}'`;
  }
  return label;
}
