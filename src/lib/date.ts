/**
 * Lightweight date utilities for revision scheduling.
 * No external dependencies — uses native Date API.
 */
import type { UserProgress } from "@/types/progress";

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/** Returns YYYY-MM-DD string for a Date */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Today as YYYY-MM-DD */
export function todayString(): string {
  return toDateString(new Date());
}

/** Parse a YYYY-MM-DD or ISO string into a Date at start of day (local time) */
export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Is the given date string today or in the past? */
export function isPastOrToday(dateStr: string, today: Date): boolean {
  const target = parseDate(dateStr);
  const normalizedToday = startOfDay(today);
  return target.getTime() <= normalizedToday.getTime();
}

/** Is the given date string strictly in the future? */
export function isFuture(dateStr: string, today: Date): boolean {
  return !isPastOrToday(dateStr, today);
}

/** Human-readable date: "Aug 19" */
export function formatDate(dateStr: string): string {
  const date = parseDate(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Number of days from today (positive = future, negative = past) */
export function daysFromNow(dateStr: string, today: Date): number {
  const target = startOfDay(parseDate(dateStr));
  const normalizedToday = startOfDay(today);
  return Math.round((target.getTime() - normalizedToday.getTime()) / (1000 * 60 * 60 * 24));
}

/** Relative label like "Today", "Tomorrow", "In 3 days", "2 days ago" */
export function relativeLabel(dateStr: string, today: Date): string {
  const diff = daysFromNow(dateStr, today);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 0) return `In ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

/** 
 * Checks if a problem's revision is due today or in the past.
 * Uses shared date parsing logic to prevent timezone offset bugs.
 */
export function isRevisionDue(progress: UserProgress | null | undefined, today: Date): boolean {
  if (!progress || !progress.solved) return false;
  if (progress.revisionStage >= 5) return false;
  if (!progress.nextRevisionAt) return false;
  return isPastOrToday(progress.nextRevisionAt, today);
}
