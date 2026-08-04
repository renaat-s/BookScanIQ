/**
 * Shared scheduling maths for recurring auto-scans.
 * Storage stays UTC-only (hour_utc / day_of_week) so the client, database and
 * edge function always agree; the user's chosen timezone is stored alongside
 * purely so the UI can show and edit the schedule in local terms.
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

/** Backlog windows supported by the backlog scan workflow. */
export const BACKLOG_OPTIONS = [4, 8, 12] as const;

/** Curated list of the main business timezones. */
export const TIMEZONES: { value: string; label: string }[] = [
  { value: "UTC", label: "UTC" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Dublin", label: "Dublin (GMT/IST)" },
  { value: "Europe/Paris", label: "Paris / Berlin / Madrid (CET)" },
  { value: "Europe/Athens", label: "Athens / Helsinki (EET)" },
  { value: "Africa/Johannesburg", label: "Johannesburg (SAST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
  { value: "America/New_York", label: "New York (ET)" },
  { value: "America/Chicago", label: "Chicago (CT)" },
  { value: "America/Denver", label: "Denver (MT)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PT)" },
  { value: "America/Sao_Paulo", label: "Sao Paulo (BRT)" },
];

/** Offset of `timeZone` from UTC, in whole hours, at `ref`. */
export function tzOffsetHours(timeZone: string, ref: Date = new Date()): number {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const parts = Object.fromEntries(
      dtf.formatToParts(ref).map((p) => [p.type, p.value]),
    ) as Record<string, string>;
    const asUTC = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour) % 24,
      Number(parts.minute),
      Number(parts.second),
    );
    return Math.round((asUTC - ref.getTime()) / 3_600_000);
  } catch {
    return 0;
  }
}

/** Local hour/day in `timeZone` -> stored UTC hour/day. */
export function localToUtc(
  hourLocal: number,
  dayLocal: number,
  timeZone: string,
  ref: Date = new Date(),
): { hourUtc: number; dayUtc: number } {
  const raw = hourLocal - tzOffsetHours(timeZone, ref);
  const shift = Math.floor(raw / 24);
  return {
    hourUtc: ((raw % 24) + 24) % 24,
    dayUtc: (((dayLocal + shift) % 7) + 7) % 7,
  };
}

/** Stored UTC hour/day -> local hour/day in `timeZone`. */
export function utcToLocal(
  hourUtc: number,
  dayUtc: number,
  timeZone: string,
  ref: Date = new Date(),
): { hourLocal: number; dayLocal: number } {
  const raw = hourUtc + tzOffsetHours(timeZone, ref);
  const shift = Math.floor(raw / 24);
  return {
    hourLocal: ((raw % 24) + 24) % 24,
    dayLocal: (((dayUtc + shift) % 7) + 7) % 7,
  };
}

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

/** Human summary in the user's timezone, e.g. "Every Monday at 07:00 (London)". */
export function describeSchedule(
  frequency: ScanFrequency,
  dayLocal: number,
  hourLocal: number,
  timeZone = "UTC",
): string {
  const label = TIMEZONES.find((t) => t.value === timeZone)?.label ?? timeZone;
  const time = `${String(hourLocal).padStart(2, "0")}:00 ${label}`;
  return frequency === "daily"
    ? `Every day at ${time}`
    : `Every ${DAY_NAMES[dayLocal]} at ${time}`;
}
