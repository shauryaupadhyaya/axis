import * as chrono from "chrono-node";
import type { Priority, RecurrenceRule } from "@/lib/types";

export interface ParsedTask {
  cleanTitle: string;
  dueDate: string | null;
  dueTime: string | null;
  recurrence: RecurrenceRule | null;
  priority: Priority | null;
  labels: string[];
}

const WEEKDAY_CODES: Record<string, string> = {
  sunday: "SU",
  monday: "MO",
  tuesday: "TU",
  wednesday: "WE",
  thursday: "TH",
  friday: "FR",
  saturday: "SA",
};

const PRIORITY_MAP: Record<string, Priority> = { "1": "urgent", "2": "high", "3": "medium", "4": "low" };

function removeMatch(text: string, index: number, length: number): string {
  return text.slice(0, index) + text.slice(index + length);
}

function extractRecurrence(text: string): { rule: RecurrenceRule | null; text: string } {
  const patterns: { re: RegExp; build: (m: RegExpMatchArray) => RecurrenceRule }[] = [
    {
      re: /\bevery\s+month\s+on\s+the\s+(\d{1,2})(st|nd|rd|th)?\b/i,
      build: (m) => ({ freq: "monthly", interval: 1, byMonthDay: Number(m[1]) }),
    },
    { re: /\bevery\s+(\d+)\s+day(s)?\b/i, build: (m) => ({ freq: "daily", interval: Number(m[1]) }) },
    { re: /\bevery\s+day\b|\bdaily\b/i, build: () => ({ freq: "daily", interval: 1 }) },
    { re: /\bevery\s+weekday(s)?\b/i, build: () => ({ freq: "weekdays", interval: 1 }) },
    { re: /\bevery\s+(\d+)\s+week(s)?\b/i, build: (m) => ({ freq: "weekly", interval: Number(m[1]) }) },
    {
      re: /\bevery\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i,
      build: (m) => ({ freq: "weekly", interval: 1, byDay: [WEEKDAY_CODES[m[1].toLowerCase()]] }),
    },
    { re: /\bevery\s+week\b|\bweekly\b/i, build: () => ({ freq: "weekly", interval: 1 }) },
    { re: /\bevery\s+(\d+)\s+month(s)?\b/i, build: (m) => ({ freq: "monthly", interval: Number(m[1]) }) },
    { re: /\bevery\s+month\b|\bmonthly\b/i, build: () => ({ freq: "monthly", interval: 1 }) },
    { re: /\bevery\s+(\d+)\s+year(s)?\b/i, build: (m) => ({ freq: "yearly", interval: Number(m[1]) }) },
    { re: /\bevery\s+year\b|\byearly\b|\bannually\b/i, build: () => ({ freq: "yearly", interval: 1 }) },
  ];
  for (const { re, build } of patterns) {
    const m = text.match(re);
    if (m && m.index !== undefined) {
      return { rule: build(m), text: removeMatch(text, m.index, m[0].length) };
    }
  }
  return { rule: null, text };
}

function formatISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatHHMM(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Extracts title/date/time/recurrence/priority/labels from free-form text (typed or voice-transcribed). */
export function parseTaskText(input: string, now: Date = new Date()): ParsedTask {
  let text = input;
  let priority: Priority | null = null;
  const labels: string[] = [];

  const pMatch = text.match(/\bp([1-4])\b/i);
  if (pMatch && pMatch.index !== undefined) {
    priority = PRIORITY_MAP[pMatch[1]];
    text = removeMatch(text, pMatch.index, pMatch[0].length);
  }

  text = text.replace(/#([a-zA-Z0-9_-]+)/g, (_match, label: string) => {
    labels.push(label);
    return "";
  });

  const { rule, text: afterRecurrence } = extractRecurrence(text);
  text = afterRecurrence;

  let dueDate: string | null = null;
  let dueTime: string | null = null;
  const results = chrono.parse(text, now, { forwardDate: true });
  if (results.length > 0) {
    const result = results[0];
    const date = result.start.date();
    dueDate = formatISODate(date);
    if (result.start.isCertain("hour")) {
      dueTime = formatHHMM(date);
    }
    text = removeMatch(text, result.index, result.text.length);
  }

  const cleanTitle = text.replace(/\s{2,}/g, " ").trim();

  return { cleanTitle, dueDate, dueTime, recurrence: rule, priority, labels };
}
