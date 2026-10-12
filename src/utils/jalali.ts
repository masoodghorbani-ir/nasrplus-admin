import {
  toJalaali as toJalali,
  toGregorian,
  isLeapJalaaliYear,
  jalaaliMonthLength,
  isValidJalaaliDate,
} from 'jalaali-js';
import { toPersianDigits, toLatinDigits } from './formatters';

export interface JalaliDate {
  jy: number;
  jm: number;
  jd: number;
}

export interface JalaliCalendarCell {
  day: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  isWeekend: boolean;
}

export const PERSIAN_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

export const PERSIAN_WEEK_DAYS = [
  { name: 'شنبه', short: 'ش', index: 0, isWeekend: false },
  { name: 'یکشنبه', short: 'ی', index: 1, isWeekend: false },
  { name: 'دوشنبه', short: 'د', index: 2, isWeekend: false },
  { name: 'سه‌شنبه', short: 'س', index: 3, isWeekend: false },
  { name: 'چهارشنبه', short: 'چ', index: 4, isWeekend: false },
  { name: 'پنجشنبه', short: 'پ', index: 5, isWeekend: false },
  { name: 'جمعه', short: 'ج', index: 6, isWeekend: true },
] as const;

/**
 * Get current date in Jalali calendar
 */
export function getTodayJalali(): JalaliDate {
  const now = new Date();
  return toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/**
 * Check if a year is a leap year in Jalali calendar
 */
export function isLeapYear(year: number): boolean {
  return isLeapJalaaliYear(year);
}

/**
 * Get number of days in a given Jalali month
 */
export function getMonthLength(year: number, month: number): number {
  return jalaaliMonthLength(year, month);
}

/**
 * Check whether a Jalali date is valid
 */
export function isValidDate(year: number, month: number, day: number): boolean {
  return isValidJalaaliDate(year, month, day);
}

/**
 * Convert Jalali date to JavaScript Date object
 */
export function jalaliToDate(jy: number, jm: number, jd: number): Date {
  const g = toGregorian(jy, jm, jd);
  return new Date(g.gy, g.gm - 1, g.gd, 12, 0, 0, 0);
}

/**
 * Convert Jalali date to Gregorian ISO date string (YYYY-MM-DD)
 */
export function jalaliToGregorianString(jy: number, jm: number, jd: number): string {
  const g = toGregorian(jy, jm, jd);
  const mm = String(g.gm).padStart(2, '0');
  const dd = String(g.gd).padStart(2, '0');
  return `${g.gy}-${mm}-${dd}`;
}

/**
 * Convert Jalali date to full ISO timestamp string
 */
export function jalaliToIsoString(jy: number, jm: number, jd: number): string {
  const g = toGregorian(jy, jm, jd);
  const d = new Date(Date.UTC(g.gy, g.gm - 1, g.gd, 0, 0, 0, 0));
  return d.toISOString();
}

/**
 * Format Jalali date into string (default YYYY/MM/DD)
 */
export function formatJalali(
  date: JalaliDate | null | undefined,
  persianDigits = true,
  separator = '/'
): string {
  if (!date) return '';
  const mm = String(date.jm).padStart(2, '0');
  const dd = String(date.jd).padStart(2, '0');
  const formatted = `${date.jy}${separator}${mm}${separator}${dd}`;
  return persianDigits ? toPersianDigits(formatted) : formatted;
}

/**
 * Parse any date string or Date object into a JalaliDate
 * Supports:
 * - Gregorian Date object
 * - Gregorian ISO strings: "2024-10-12", "2024-10-12T00:00:00.000Z"
 * - Jalali strings: "1403/07/21", "1403-07-21", with Persian or Latin digits
 */
export function parseAnyDateToJalali(value: string | Date | null | undefined): JalaliDate | null {
  if (!value) return null;

  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return toJalali(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }

  const str = toLatinDigits(String(value).trim());
  if (!str) return null;

  // Check if string matches Jalali format (year in range 1300..1499)
  const jalaliMatch = str.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
  if (jalaliMatch) {
    const y = parseInt(jalaliMatch[1], 10);
    const m = parseInt(jalaliMatch[2], 10);
    const d = parseInt(jalaliMatch[3], 10);
    if (y >= 1300 && y <= 1499 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      if (isValidJalaaliDate(y, m, d)) {
        return { jy: y, jm: m, jd: d };
      }
    }
  }

  // Check Gregorian string (e.g. 1990-05-15 or ISO timestamp)
  const gregDate = new Date(str);
  if (!isNaN(gregDate.getTime())) {
    // If year is within normal Gregorian range
    const gy = gregDate.getFullYear();
    if (gy >= 1800 && gy <= 2200) {
      return toJalali(gy, gregDate.getMonth() + 1, gregDate.getDate());
    }
  }

  // Direct Gregorian YYYY-MM-DD match without timezone shift
  const gregMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (gregMatch) {
    const gy = parseInt(gregMatch[1], 10);
    const gm = parseInt(gregMatch[2], 10);
    const gd = parseInt(gregMatch[3], 10);
    if (gy >= 1800 && gy <= 2200 && gm >= 1 && gm <= 12 && gd >= 1 && gd <= 31) {
      return toJalali(gy, gm, gd);
    }
  }

  return null;
}

/**
 * Get weekday index for a Jalali date (0 = شنبه, 6 = جمعه)
 */
export function getJalaliWeekdayIndex(jy: number, jm: number, jd: number): number {
  const g = toGregorian(jy, jm, jd);
  const jsDay = new Date(g.gy, g.gm - 1, g.gd).getDay(); // 0 = Sun, 6 = Sat
  return (jsDay + 1) % 7;
}

/**
 * Compare two Jalali dates
 */
export function isSameDate(d1: JalaliDate | null, d2: JalaliDate | null): boolean {
  if (!d1 || !d2) return false;
  return d1.jy === d2.jy && d1.jm === d2.jm && d1.jd === d2.jd;
}

export function isDateBefore(d1: JalaliDate, d2: JalaliDate): boolean {
  if (d1.jy !== d2.jy) return d1.jy < d2.jy;
  if (d1.jm !== d2.jm) return d1.jm < d2.jm;
  return d1.jd < d2.jd;
}

export function isDateAfter(d1: JalaliDate, d2: JalaliDate): boolean {
  if (d1.jy !== d2.jy) return d1.jy > d2.jy;
  if (d1.jm !== d2.jm) return d1.jm > d2.jm;
  return d1.jd > d2.jd;
}

/**
 * Convert any date input (Gregorian or Jalali) safely to ISO string for backend payload
 */
export function safeToIso(value: string | Date | null | undefined): string | undefined {
  if (!value) return undefined;
  const jalali = parseAnyDateToJalali(value);
  if (!jalali) {
    try {
      const d = new Date(value);
      return !isNaN(d.getTime()) ? d.toISOString() : undefined;
    } catch {
      return undefined;
    }
  }
  return jalaliToIsoString(jalali.jy, jalali.jm, jalali.jd);
}
