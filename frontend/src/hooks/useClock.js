import { useState, useEffect } from 'react';

function toWita(date) {
  // UTC+8 (Asia/Makassar) — Apps Script zone
  const d = new Date(date.getTime() + 8 * 3600 * 1000);
  return {
    d,
    hhmm: String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'),
  };
}

export function useClock(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  const wita = toWita(now);

  return {
    now,
    date: now.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }),
    wita: wita.hhmm,
    utc: String(now.getUTCHours()).padStart(2, '0') + ':' + String(now.getUTCMinutes()).padStart(2, '0'),
  };
}