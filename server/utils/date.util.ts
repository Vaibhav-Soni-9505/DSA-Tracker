/**
 * Lightweight date utilities for the backend revision engine.
 * Ensures strict YYYY-MM-DD calendar-day arithmetic without timezone shifting.
 */

export const addDays = (dateStr: string, days: number): string => {
  const [y, m, d] = dateStr.split("-").map(Number);
  // Use UTC to prevent local timezone shifts during math
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split("T")[0];
};

export const isValidDateString = (dateStr: string | any): boolean => {
  if (typeof dateStr !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toISOString().split("T")[0] === dateStr;
};

// Returns true if localToday >= targetDate
export const isPastOrToday = (targetDate: string, localToday: string): boolean => {
  // YYYY-MM-DD strings can be lexicographically compared safely
  return localToday >= targetDate;
};
