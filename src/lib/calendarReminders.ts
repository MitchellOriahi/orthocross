export function calendarDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function reminderTimestamp(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const value = new Date(year, month - 1, day, hour, minute);
  if (hour > 23 || minute > 59 || calendarDateKey(value) !== date) return null;
  return value.toISOString();
}
export function notificationId(id: string): number {
  let hash = 0;
  for (const char of id) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) | 0;
  return (hash >>> 0) % 2000000000 + 1;
}
export class ReminderTimeoutError extends Error {
  constructor(message = "This is taking too long. Check your connection and try again.") { super(message); this.name = "ReminderTimeoutError"; }
}
// Native plugin calls and network requests can stall on iOS; never let the dialog wait forever.
export function withTimeout<T>(work: PromiseLike<T>, ms: number, message?: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new ReminderTimeoutError(message)), ms);
    Promise.resolve(work).then(v => { clearTimeout(timer); resolve(v); }, e => { clearTimeout(timer); reject(e); });
  });
}
