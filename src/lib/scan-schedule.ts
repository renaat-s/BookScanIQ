/**
 * Shared scheduling maths for recurring auto-scans.
 * Kept UTC-only so the client, database and edge function all agree.
 */

export type ScanFrequency = "daily" | "weekly";

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const LOOKBACK_OPTIONS = [1, 2, 4, 8, 12] as const;

/** Next UTC run time strictly after `from` (defaults to now). */
export function computeNextRun(
  frequency: ScanFrequency,
  dayOfWeek: number,
  hourUtc: number,
  from: Date = new Date(),
): Date {
  const next = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), hourUtc, 0, 0, 0),
  );
  if (frequency === "daily") {
    while (next <= from) next.setUTCDate(next.getUTCDate() + 1);
    return next;
  }
  while (next <= from || next.getUTCDay() !== dayOfWeek) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next;
}

/** Human summary, e.g. "Every Monday at 07:00 UTC". */
export function describeSchedule(
  frequency: ScanFrequency,
  dayOfWeek: number,
  hourUtc: number,
): string {
  const time = `${String(hourUtc).padStart(2, "0")}:00 UTC`;
  return frequency === "daily"
    ? `Every day at ${time}`
    : `Every ${DAY_NAMES[dayOfWeek]} at ${time}`;
}
