/**
 * Convert various date inputs to Date object or null
 * Handles string dates, Date objects, and invalid inputs
 *
 * @param value - String date, Date object, or null/undefined
 * @returns Date object or null if invalid
 */
export function toDate(value?: string | Date | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Add days to a date
 *
 * @param date - Base date
 * @param days - Number of days to add (can be negative)
 * @returns New Date object
 */
export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * Format date as YYYY-MM-DD for input fields
 *
 * @param date - Date to format
 * @returns Formatted string in YYYY-MM-DD format
 */
export function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD string to Date
 *
 * @param value - Date string in YYYY-MM-DD format
 * @returns Date object or null if invalid
 */
export function parseDateInput(value?: string | null): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Format date as MM/DD
 *
 * @param date - Date to format
 * @returns Formatted string in MM/DD format
 */
export function formatShortDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}/${day}`;
}

/**
 * Get start of week (Monday)
 * Sets time to 00:00:00
 *
 * @param date - Date to get week start from
 * @returns Date object representing Monday of that week
 */
export function startOfWeek(date: Date): Date {
  const next = new Date(date);
  const diff = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

/**
 * Format date for display (Japanese locale)
 *
 * @param value - String date, Date object, or null/undefined
 * @returns Formatted date string or '-' if invalid
 */
export function formatDate(value?: string | Date | null): string {
  const date = toDate(value);
  return date ? date.toLocaleDateString('ja-JP') : '-';
}
