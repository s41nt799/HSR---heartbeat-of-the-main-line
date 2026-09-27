import { useEffect, useRef, useState } from 'react';

export interface UseTimerResult {
  remaining_sec: number | null;
  progress: number | null;
}

/**
 * Таймер от timer_left_sec. Решение о timeout — на сервере.
 * Отсчёт идёт от timer_left_sec до 0; при достижении 0 вызывается onExpire ровно один раз.
 */
export function useTimer(
  timerLeftSec: number | null,
  onExpire: () => void,
): UseTimerResult {
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const expireCalledRef = useRef(false);
  const intervalRef = useRef<number | null>(null);

  const [remainingSec, setRemainingSec] = useState<number | null>(timerLeftSec);
  const startSecRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Новый узел — сбрасываем якорь и guard
  useEffect(() => {
    if (timerLeftSec === null || timerLeftSec <= 0) {
      setRemainingSec(timerLeftSec);
      expireCalledRef.current = false;
      startSecRef.current = null;
      startTimeRef.current = null;
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    startSecRef.current = timerLeftSec;
    startTimeRef.current = Date.now();
    setRemainingSec(timerLeftSec);
    expireCalledRef.current = false;
  }, [timerLeftSec]);

  // Тик таймера
  useEffect(() => {
    if (startSecRef.current === null || startTimeRef.current === null) return;
    if (remainingSec === null || remainingSec <= 0) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current!) / 1000;
      const left = Math.max(0, startSecRef.current! - elapsed);
      setRemainingSec(left);
      if (left <= 0 && intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 100);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerLeftSec]);

  // onExpire ровно один раз
  useEffect(() => {
    if (remainingSec === null || remainingSec > 0) return;
    if (expireCalledRef.current) return;
    expireCalledRef.current = true;
    onExpireRef.current();
  }, [remainingSec]);

  const progress =
    startSecRef.current !== null && startSecRef.current > 0
      ? Math.max(0, Math.min(1, (remainingSec ?? 0) / startSecRef.current))
      : null;

  return { remaining_sec: remainingSec, progress };
}
