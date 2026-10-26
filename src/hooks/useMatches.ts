import { useCallback, useEffect, useRef, useState } from 'react';
import { MATCHES_URL } from '../config';
import type { Match, MatchesResponse } from '../types';

export type LoadStatus = 'loading' | 'success' | 'error';

type State = {
  status: LoadStatus;
  matches: Match[];
  round: number | null;
  // Момент последней УСПЕШНОЙ загрузки. При ошибке не меняется.
  updatedAt: Date | null;
  error: string | null;
};

const INITIAL_STATE: State = {
  status: 'loading',
  matches: [],
  round: null,
  updatedAt: null,
  error: null,
};

function isMatchesResponse(value: unknown): value is MatchesResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as { matches?: unknown }).matches)
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Неизвестная ошибка';
}

export function useMatches() {
  const [state, setState] = useState<State>(INITIAL_STATE);
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    // Новая загрузка отменяет предыдущую, чтобы старый ответ не затёр новый.
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setState((prev) => ({ ...prev, status: 'loading', error: null }));

    try {
      const response = await fetch(MATCHES_URL, { signal: controller.signal });
      // fetch не бросает ошибку на 404 и 500, проверяем статус сами.
      if (!response.ok) {
        throw new Error(`Сервер ответил с кодом ${response.status}`);
      }
      const json: unknown = await response.json();
      if (!isMatchesResponse(json)) {
        throw new Error('Неверный формат ответа сервера');
      }
      if (controller.signal.aborted) return;

      setState({
        status: 'success',
        matches: json.matches,
        round: json.round ?? null,
        updatedAt: new Date(),
        error: null,
      });
    } catch (error) {
      // Отменённый запрос — не ошибка: экран размонтирован или запущена новая загрузка.
      if (controller.signal.aborted) return;
      setState((prev) => ({ ...prev, status: 'error', error: getErrorMessage(error) }));
    }
  }, []);

  useEffect(() => {
    void load();
    return () => controllerRef.current?.abort();
  }, [load]);

  return { ...state, refresh: load };
}
