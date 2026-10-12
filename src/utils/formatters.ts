import type { MemberStatus, Gender, CompanyType, PhoneType } from '@/types';

/**
 * Convert standard Latin digits to Persian digits
 */
export function toPersianDigits(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
}

/**
 * Convert Persian and Arabic digits to Latin digits
 */
export function toLatinDigits(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

/**
 * Format date string into Persian Jalali date (yyyy/mm/dd)
 */
export function formatPersianDate(
  dateInput: string | Date | null | undefined,
  includeTime = false,
  persianDigits = true
): string {
  if (!dateInput) return '—';
  try {
    if (typeof dateInput === 'string') {
      const trimmed = dateInput.trim();
      const jalaliMatch = trimmed.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
      if (jalaliMatch) {
        const y = parseInt(jalaliMatch[1], 10);
        if (y >= 1300 && y <= 1500) {
          const m = jalaliMatch[2].padStart(2, '0');
          const d = jalaliMatch[3].padStart(2, '0');
          let res = `${y}/${m}/${d}`;
          return persianDigits ? toPersianDigits(res) : res;
        }
      }
    }

    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '—';

    const parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...(includeTime
        ? {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }
        : {}),
    }).formatToParts(date);

    const year = parts.find((p) => p.type === 'year')?.value || '';
    const month = parts.find((p) => p.type === 'month')?.value || '';
    const day = parts.find((p) => p.type === 'day')?.value || '';

    let formatted = `${year}/${month}/${day}`;

    if (includeTime) {
      const hour = parts.find((p) => p.type === 'hour')?.value || '00';
      const minute = parts.find((p) => p.type === 'minute')?.value || '00';
      formatted += ` - ${hour}:${minute}`;
    }

    return persianDigits ? toPersianDigits(formatted) : formatted;
  } catch {
    return '—';
  }
}

/**
 * Format relative time in Persian
 */
export function formatRelativeTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '—';

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'لحظاتی پیش';
    if (diffInSeconds < 3600) return `${toPersianDigits(Math.floor(diffInSeconds / 60))} دقیقه پیش`;
    if (diffInSeconds < 86400) return `${toPersianDigits(Math.floor(diffInSeconds / 3600))} ساعت پیش`;
    if (diffInSeconds < 2592000) return `${toPersianDigits(Math.floor(diffInSeconds / 86400))} روز پیش`;
    return formatPersianDate(date);
  } catch {
    return '—';
  }
}

/**
 * Format thousands separator with Persian numbers
 */
export function formatNumber(num: number | string | null | undefined, persian = true): string {
  if (num === null || num === undefined) return '۰';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '۰';
  const formatted = n.toLocaleString('en-US');
  return persian ? toPersianDigits(formatted) : formatted;
}

/**
 * Validate Iranian national code algorithm
 */
export function isValidNationalCode(code: string): boolean {
  const clean = toLatinDigits(code).trim();
  if (!/^\d{10}$/.test(clean)) return false;
  
  // Check if all digits are identical (e.g. 0000000000)
  if (/^(\d)\1{9}$/.test(clean)) return false;

  const check = parseInt(clean[9], 10);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean[i], 10) * (10 - i);
  }
  const remainder = sum % 11;
  return (remainder < 2 && check === remainder) || (remainder >= 2 && check === 11 - remainder);
}

/**
 * Member status display configuration
 */
export const statusConfig: Record<
  MemberStatus,
  { label: string; bgClass: string; textClass: string; borderClass: string; dotClass: string }
> = {
  ACTIVE: {
    label: 'فعال',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    dotClass: 'bg-emerald-500',
  },
  PENDING: {
    label: 'در انتظار تایید',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    textClass: 'text-amber-700 dark:text-amber-300',
    borderClass: 'border-amber-200 dark:border-amber-800',
    dotClass: 'bg-amber-500',
  },
  SUSPENDED: {
    label: 'تعلیق شده',
    bgClass: 'bg-rose-50 dark:bg-rose-950/40',
    textClass: 'text-rose-700 dark:text-rose-300',
    borderClass: 'border-rose-200 dark:border-rose-800',
    dotClass: 'bg-rose-500',
  },
  EXPIRED: {
    label: 'منقضی شده',
    bgClass: 'bg-slate-100 dark:bg-slate-800',
    textClass: 'text-slate-700 dark:text-slate-300',
    borderClass: 'border-slate-300 dark:border-slate-700',
    dotClass: 'bg-slate-400',
  },
  REJECTED: {
    label: 'رد شده',
    bgClass: 'bg-red-50 dark:bg-red-950/40',
    textClass: 'text-red-700 dark:text-red-300',
    borderClass: 'border-red-200 dark:border-red-800',
    dotClass: 'bg-red-500',
  },
};

/**
 * Gender display map
 */
export const genderConfig: Record<Gender, string> = {
  MALE: 'مرد',
  FEMALE: 'زن',
  OTHER: 'سایر',
};

/**
 * Company type display configuration
 */
export const companyTypeConfig: Record<CompanyType, string> = {
  PRIVATE_JOINT_STOCK: 'سهامی خاص',
  PUBLIC_JOINT_STOCK: 'سهامی عام',
  LIMITED_LIABILITY: 'با مسئولیت محدود',
  COOPERATIVE: 'تعاونی',
  KNOWLEDGE_BASED: 'دانش‌بنیان',
  STARTUP: 'استارتاپ',
  OTHER: 'سایر',
};

/**
 * Phone type display configuration
 */
export const phoneTypeConfig: Record<PhoneType, string> = {
  MOBILE: 'تلفن همراه',
  LANDLINE: 'تلفن ثابت',
  FAX: 'نمابر (فکس)',
  SUPPORT: 'خط پشتیبانی',
  OTHER: 'سایر',
};
