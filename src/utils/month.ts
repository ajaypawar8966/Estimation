/** Month key such as "2026-10", used to group diary entries. */
export const monthKey = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** "2026-10" → "October 2026". */
export const monthLabel = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
};

/** Day key such as "2026-10-02", for counting distinct working days. */
export const dayKey = (ts: number) => {
  const d = new Date(ts);
  return `${monthKey(ts)}-${String(d.getDate()).padStart(2, '0')}`;
};

/** "02 Oct 2026", as on the printed report. */
export const formatDay = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export const entriesLabel = (n: number) =>
  `${n} ${n === 1 ? 'entry' : 'entries'}`;
