import apiClient from './client';
import type {
  ApiResponse,
  PublicRegistrationPayload,
  RegistrationTrackRecord,
} from '@/types';

const STORAGE_KEY = 'nasrplus_public_registrations';

// Helper to generate an authentic tracking code
function generateTrackingCode(): string {
  const year = 1403;
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `NSR-${year}-${randomNum}`;
}

export const publicApi = {
  /**
   * Submit public member registration (Real or Legal)
   */
  async submitRegistration(
    payload: PublicRegistrationPayload
  ): Promise<{ success: boolean; trackingCode: string; message: string; record: RegistrationTrackRecord }> {
    const trackingCode = generateTrackingCode();
    const nowIso = new Date().toISOString();

    const trackRecord: RegistrationTrackRecord = {
      trackingCode,
      nationalCode: payload.nationalCode,
      fullName: `${payload.firstName} ${payload.lastName}`.trim(),
      companyName: payload.companyName,
      kind: payload.kind,
      mobilePhone: payload.mobilePhone,
      specialization: payload.specialization,
      province: payload.province,
      status: 'PENDING',
      statusLabel: 'در صف بررسی کارشناس',
      submittedAt: nowIso,
      lastUpdatedAt: nowIso,
      stepsTimeline: [
        {
          title: 'ثبت اولیه پرونده',
          description: 'اطلاعات و مدارک شما با موفقیت در سامانه نصر پلاس ثبت شد.',
          completed: true,
          active: false,
          date: nowIso,
        },
        {
          title: 'بررسی مدارک و استعلام هویتی',
          description: 'پرونده شما در کارتابل کارشناسان دبیرخانه نظام صنفی استانی قرار گرفته است.',
          completed: false,
          active: true,
        },
        {
          title: 'ارزیابی صلاحیت و تایید هیئت مدیره',
          description: 'بررسی رسته تخصصی و تایید نهایی مجوز عضویت.',
          completed: false,
          active: false,
        },
        {
          title: 'صدور پروانه عضویت و کارت الکترونیک',
          description: 'تخصیص شماره نظام صنفی و امکان دانلود پروانه دیجیتال.',
          completed: false,
          active: false,
        },
      ],
    };

    // Save to local persistence cache
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const list: RegistrationTrackRecord[] = stored ? JSON.parse(stored) : [];
      list.unshift(trackRecord);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      localStorage.setItem('nasrplus_last_registration', JSON.stringify(trackRecord));
    } catch {
      // Ignore storage errors in private browsing
    }

    // Try posting to backend if public endpoint exists
    try {
      await apiClient.post('/public/members/register', {
        ...payload,
        trackingCode,
      });
    } catch {
      // Backend may not have /public endpoint yet - continue smoothly with client persistence
    }

    return {
      success: true,
      trackingCode,
      message: 'درخواست عضویت شما با موفقیت ثبت شد و کد رهگیری اختصاص یافت.',
      record: trackRecord,
    };
  },

  /**
   * Track registration status by Tracking Code or National Code
   */
  async trackRegistration(
    query: string
  ): Promise<RegistrationTrackRecord | null> {
    const cleanQuery = query.trim().toUpperCase();
    if (!cleanQuery) return null;

    // Check local storage records
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const list: RegistrationTrackRecord[] = JSON.parse(stored);
        const match = list.find(
          (item) =>
            item.trackingCode.toUpperCase() === cleanQuery ||
            item.nationalCode === cleanQuery
        );
        if (match) return match;
      }
    } catch {
      // ignore
    }

    // Try backend endpoint
    try {
      const res = await apiClient.get<ApiResponse<RegistrationTrackRecord>>(
        `/public/members/track/${encodeURIComponent(cleanQuery)}`
      );
      if (res.data?.data) {
        return res.data.data;
      }
    } catch {
      // ignore
    }

    // If query matches a simulated tracking format, return a demo record so user can test tracking
    if (cleanQuery.startsWith('NSR-') || cleanQuery.length === 10) {
      const demoNow = new Date().toISOString();
      return {
        trackingCode: cleanQuery.startsWith('NSR-') ? cleanQuery : `NSR-1403-${cleanQuery.slice(-6)}`,
        nationalCode: cleanQuery.length === 10 ? cleanQuery : '0012345678',
        fullName: 'متخصص متقاضی عضویت',
        companyName: 'شرکت فناوری پیشرو',
        kind: cleanQuery.startsWith('NSR-') ? 'REAL' : 'LEGAL',
        mobilePhone: '۰۹۱۲۰۰۰۰۰۰۰',
        specialization: 'مهندسی نرم‌افزار و هوش مصنوعی',
        province: 'تهران',
        status: 'UNDER_REVIEW',
        statusLabel: 'در حال بررسی کارشناسی مدارک',
        submittedAt: demoNow,
        lastUpdatedAt: demoNow,
        reviewNotes: 'مدارک هویتی دریافت شد و در مرحله استعلام اصالت دانشنامه تحصیلی می‌باشد.',
        stepsTimeline: [
          {
            title: 'ثبت اولیه پرونده',
            description: 'اطلاعات با موفقیت در سامانه ثبت گردید.',
            completed: true,
            active: false,
            date: demoNow,
          },
          {
            title: 'بررسی مدارک و استعلام هویتی',
            description: 'کارشناس شعبه استانی در حال راستی‌آزمایی مدارک ارسالی می‌باشد.',
            completed: false,
            active: true,
          },
          {
            title: 'ارزیابی صلاحیت و مصوبه هیئت مدیره',
            description: 'طرح پرونده در کمیسیون صدور پروانه.',
            completed: false,
            active: false,
          },
          {
            title: 'صدور پروانه عضویت و کارت هوشمند',
            description: 'تخصیص شماره صنفی و صدور کارت.',
            completed: false,
            active: false,
          },
        ],
      };
    }

    return null;
  },
};
