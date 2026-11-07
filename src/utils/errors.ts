import axios from 'axios';

/**
 * Extract human-readable error message from API response or unknown error
 */
export function extractErrorMessage(error: unknown, fallbackMessage = 'خطایی در انجام عملیات رخ داده است'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data) {
      // 1. Check if specific field validation errors exist in data.details
      if (data.details && typeof data.details === 'object') {
        const detailsObj = data.details as Record<string, any>;
        const errors = detailsObj.errors || detailsObj;
        if (errors && typeof errors === 'object') {
          const detailedMessages = Object.entries(errors)
            .map(([field, err]: [string, any]) => {
              const msg = err?.message || err?.reason?.message || (typeof err === 'string' ? err : '');
              if (!msg) return '';
              const lower = msg.toLowerCase();
              if (lower.includes('at least 6 characters')) {
                return 'رمز عبور باید حداقل ۶ کاراکتر باشد';
              }
              if (lower.includes('is required')) {
                return `تکمیل فیلد ${field} الزامی است`;
              }
              if (lower.includes('type must be either')) {
                return 'نقش انتخابی باید یکی از موارد ADMIN، SUPERADMIN یا EXPERT باشد';
              }
              if (lower.includes('cast to objectid failed') || lower.includes('cast to [objectid] failed')) {
                return `شناسه انتخابی در بخش ${field} نامعتبر است`;
              }
              return msg;
            })
            .filter(Boolean);

          if (detailedMessages.length > 0) {
            return detailedMessages.join(' | ');
          }
        }
      }

      const rawMessage = (typeof data.message === 'string' && data.message.trim().length > 0)
        ? data.message
        : (typeof data.error === 'string' && data.error.trim().length > 0)
          ? data.error
          : null;

      if (rawMessage) {
        const lower = rawMessage.toLowerCase();
        // Referential integrity & delete protection contract
        if (lower.includes('expert admins') || (error.response?.status === 409 && lower.includes('specialization'))) {
          return 'این رسته تخصصی به یک یا چند کارشناس بررسی پرونده منتسب است و امکان حذف آن وجود ندارد.';
        }
        if (lower.includes('admin login logs') || lower.includes('login logs') || (error.response?.status === 409 && lower.includes('admin'))) {
          return 'این حساب کاربری دارای سابقه لاگ ورود یا عملیات کارشناسی در سامانه است و امکان حذف آن وجود ندارد. پیشنهاد می‌شود به جای حذف، حساب را غیرفعال فرمایید.';
        }
        if (lower.includes('cannot delete superadmin') || lower.includes('superadmin account cannot be deleted')) {
          return 'امکان حذف حساب مدیر ارشد سامانه (Superadmin) وجود ندارد.';
        }
        if (lower.includes('single superadmin') || lower.includes('superadmin already exists')) {
          return 'تنها یک مدیر ارشد در سامانه مجاز است و امکان تعریف حساب Superadmin جدید وجود ندارد.';
        }
        if (lower.includes('reviewablespecializations') || lower.includes('reviewable specializations are required')) {
          return 'انتخاب حداقل یک رسته تخصصی معتبر برای حساب کارشناس الزامی است.';
        }
        if (lower.includes('invalid specialization id format')) {
          return 'شناسه یکی از رسته‌های تخصصی انتخاب شده نامعتبر است.';
        }
        if (lower.includes('validation error: invalid input parameters')) {
          return 'اطلاعات وارد شده نامعتبر است. لطفاً فیلدهای ورودی را بررسی نمایید.';
        }
        return rawMessage;
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
    if (error.response?.status === 409) {
      return 'به دلیل وابستگی اطلاعاتی در سایر بخش‌های سامانه، انجام این عملیات امکان‌پذیر نیست.';
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
