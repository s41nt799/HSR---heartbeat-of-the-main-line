import { useEffect, useRef, useState } from 'react';

export interface UseTimerResult {
  remaining_sec: number | null;
  progress: number | null;
}

/**
 * Таймер только для отображения. Решение о timeout — на сервере.
 * remaining = (deadline - server_now) - (Date.now() - clientReceivedAt)
 */
export function useTimer(
  deadline: string | null,
  serverNow: string,
  onExpire: () => void,
): UseTimerResult {
  const clientReceivedAt = useRef(Date.now());
  const expireCalledRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const [now, setNow] = useState(() => Date.now());

  // Новый узел / новый дедлайн — сбрасываем якорь и guard
  useEffect(() => {
    clientReceivedAt.current = Date.now();
    expireCalledRef.current = false;
    setNow(Date.now());
  }, [deadline, serverNow]);

  useEffect(() => {
    if (!deadline) return;
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [deadline]);

  let remaining_sec: number | null = null;
  let progress: number | null = null;

  if (deadline) {
    const deadlineMs = Date.parse(deadline);
    const serverNowMs = Date.parse(serverNow);

    if (!Number.isNaN(deadlineMs) && !Number.isNaN(serverNowMs)) {
      const totalMs = Math.max(0, deadlineMs - serverNowMs);
      const remainingMs = totalMs - (now - clientReceivedAt.current);
      remaining_sec = Math.max(0, remainingMs / 1000);
      progress = totalMs > 0 ? Math.min(1, Math.max(0, remainingMs / totalMs)) : 0;
    }
  }

  // onExpire ровно один раз
  useEffect(() => {
    if (remaining_sec === null) return;
    if (remaining_sec > 0) return;
    if (expireCalledRef.current) return;
    expireCalledRef.current = true;
    onExpireRef.current();
  }, [remaining_sec]);

  return { remaining_sec, progress };
}
