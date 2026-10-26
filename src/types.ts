export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed';

export type Team = {
  id: string;
  name: string;
  city: string;
};

export type Score = {
  home: number;
  away: number;
};

export type Match = {
  id: string;
  // null — дата ещё не назначена (например, матч перенесён).
  startsAt: string | null;
  // `string & {}` оставляет автодополнение для известных статусов,
  // но не ломает типы, если сервер пришлёт новый статус.
  status: MatchStatus | (string & {});
  // Есть только у матчей в статусе live.
  minute?: number;
  home: Team;
  away: Team;
  // null — матч ещё не начался или перенесён.
  score: Score | null;
};

export type MatchesResponse = {
  round?: number;
  matches: Match[];
};
