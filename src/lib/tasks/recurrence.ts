import { addDays, addWeeks, addMonths, addYears, setDate } from "date-fns";
import type { RecurrenceRule } from "@/lib/types";

export const DAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as const;
export type DayCode = (typeof DAY_CODES)[number];

const DAY_LABEL: Record<DayCode, string> = {
  SU: "Sunday",
  MO: "Monday",
  TU: "Tuesday",
  WE: "Wednesday",
  TH: "Thursday",
  FR: "Friday",
  SA: "Saturday",
};

function nextWeekday(from: Date): Date {
  let d = addDays(from, 1);
  while (d.getDay() === 0 || d.getDay() === 6) d = addDays(d, 1);
  return d;
}

export function computeNextOccurrence(currentDueAt: Date, rule: RecurrenceRule): Date {
  const interval = Math.max(1, rule.interval || 1);
  switch (rule.freq) {
    case "daily":
      return addDays(currentDueAt, interval);
    case "weekdays":
      return nextWeekday(currentDueAt);
    case "weekly": {
      if (rule.byDay && rule.byDay.length > 0) {
        const targets = new Set(rule.byDay);
        let d = addDays(currentDueAt, 1);
        for (let i = 0; i < 7 * interval + 7; i++) {
          if (targets.has(DAY_CODES[d.getDay()])) return d;
          d = addDays(d, 1);
        }
      }
      return addWeeks(currentDueAt, interval);
    }
    case "monthly": {
      const base = addMonths(currentDueAt, interval);
      return rule.byMonthDay ? setDate(base, rule.byMonthDay) : base;
    }
    case "yearly":
      return addYears(currentDueAt, interval);
    default:
      return addDays(currentDueAt, interval);
  }
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

export function formatRecurrence(rule: RecurrenceRule | null): string {
  if (!rule) return "";
  const n = rule.interval || 1;
  switch (rule.freq) {
    case "daily":
      return n === 1 ? "Every day" : `Every ${n} days`;
    case "weekdays":
      return "Every weekday";
    case "weekly": {
      if (rule.byDay && rule.byDay.length > 0) {
        const names = rule.byDay.map((d) => DAY_LABEL[d as DayCode] ?? d).join(", ");
        return n === 1 ? `Every ${names}` : `Every ${n} weeks on ${names}`;
      }
      return n === 1 ? "Every week" : `Every ${n} weeks`;
    }
    case "monthly":
      return n === 1
        ? rule.byMonthDay
          ? `Every month on the ${ordinal(rule.byMonthDay)}`
          : "Every month"
        : `Every ${n} months`;
    case "yearly":
      return n === 1 ? "Every year" : `Every ${n} years`;
    default:
      return "Repeats";
  }
}

export const RECURRENCE_PRESETS: { label: string; rule: RecurrenceRule }[] = [
  { label: "Every day", rule: { freq: "daily", interval: 1 } },
  { label: "Every weekday", rule: { freq: "weekdays", interval: 1 } },
  { label: "Every week", rule: { freq: "weekly", interval: 1 } },
  { label: "Every month", rule: { freq: "monthly", interval: 1 } },
  { label: "Every year", rule: { freq: "yearly", interval: 1 } },
];
