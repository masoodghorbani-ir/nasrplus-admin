import axios from 'axios';

/**
 * Extract human-readable error message from API response or unknown error
 */
export function extractErrorMessage(error: unknown, fallbackMessage = 'خطایی در انجام عملیات رخ داده است'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data) {
      if (typeof data.message === 'string' && data.message.trim().length > 0) {
        return data.message;
      }
      if (typeof data.error === 'string' && data.error.trim().length > 0) {
        return data.error;
      }
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        return data.errors.map((e: { message?: string; msg?: string } | string) => 
          typeof e === 'string' ? e : e.message || e.msg || ''
        ).filter(Boolean).join(' - ');
      }
    }
    if (error.response?.status === 401) {
      return 'نشست کاربری شما منقضی شده است. لطفاً مجدداً وارد شوید.';
    }
    if (error.response?.status === 403) {
      return 'شما مجوز دسترسی به این بخش را ندارید.';
    }
    if (error.response?.status === 404) {
      return 'مورد درخواستی یافت نشد.';
    }
    if (error.code === 'ERR_NETWORK') {
      return 'ارتباط با سرور برقرار نشد. لطفاً اتصال اینترنت یا سرور را بررسی کنید.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}
