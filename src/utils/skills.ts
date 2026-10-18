import type {
  IMemberSkill,
  SkillVerificationStatus,
  ISkillVerificationLog,
} from '@/types';
import { toPersianDigits } from './formatters';

const STORAGE_PREFIX = 'nasrplus_member_skills_';

export interface ISelfAssessmentLevel {
  label: string;
  enLabel: string;
  min: number;
  max: number;
  colorName: 'blue' | 'amber' | 'emerald' | 'purple';
  badgeClass: string;
  progressBarClass: string;
  textColorClass: string;
  bgLightClass: string;
  borderColorClass: string;
}

/**
 * 3.1 Self-Assessment Slider / Percentage Evaluation
 * 1% - 39%: مقدماتی (Beginner - Blue/Slate)
 * 40% - 69%: متوسط (Intermediate - Amber/Orange)
 * 70% - 89%: پیشرفته (Advanced - Emerald/Green)
 * 90% - 100%: خبره / ارشد (Expert - Purple/Indigo)
 */
export function getSelfAssessmentInfo(percentage: number | null | undefined): ISelfAssessmentLevel {
  const value = Math.max(1, Math.min(100, Math.round(Number(percentage) || 1)));

  if (value <= 39) {
    return {
      label: 'مقدماتی',
      enLabel: 'Beginner',
      min: 1,
      max: 39,
      colorName: 'blue',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
      progressBarClass: 'bg-gradient-to-r from-blue-500 to-indigo-500',
      textColorClass: 'text-blue-600 dark:text-blue-400',
      bgLightClass: 'bg-blue-50 dark:bg-blue-950/40',
      borderColorClass: 'border-blue-200 dark:border-blue-800',
    };
  }

  if (value <= 69) {
    return {
      label: 'متوسط',
      enLabel: 'Intermediate',
      min: 40,
      max: 69,
      colorName: 'amber',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
      progressBarClass: 'bg-gradient-to-r from-amber-500 to-orange-500',
      textColorClass: 'text-amber-600 dark:text-amber-400',
      bgLightClass: 'bg-amber-50 dark:bg-amber-950/40',
      borderColorClass: 'border-amber-200 dark:border-amber-800',
    };
  }

  if (value <= 89) {
    return {
      label: 'پیشرفته',
      enLabel: 'Advanced',
      min: 70,
      max: 89,
      colorName: 'emerald',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
      progressBarClass: 'bg-gradient-to-r from-teal-500 to-emerald-500',
      textColorClass: 'text-emerald-600 dark:text-emerald-400',
      bgLightClass: 'bg-emerald-50 dark:bg-emerald-950/40',
      borderColorClass: 'border-emerald-200 dark:border-emerald-800',
    };
  }

  return {
    label: 'خبره / ارشد',
    enLabel: 'Expert',
    min: 90,
    max: 100,
    colorName: 'purple',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
    progressBarClass: 'bg-gradient-to-r from-purple-500 to-indigo-600',
    textColorClass: 'text-purple-600 dark:text-purple-400',
    bgLightClass: 'bg-purple-50 dark:bg-purple-950/40',
    borderColorClass: 'border-purple-200 dark:border-purple-800',
  };
}

/**
 * 3.3 Verification Status Badges & Helper
 */
export function getSkillStatusInfo(status?: SkillVerificationStatus | string) {
  switch (status) {
    case 'APPROVED':
      return {
        label: 'تائید شده',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
        dotClass: 'bg-emerald-500',
        iconName: 'CheckCircle2',
      };
    case 'REJECTED':
      return {
        label: 'رد شده',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
        dotClass: 'bg-rose-500',
        iconName: 'XCircle',
      };
    case 'PENDING':
    default:
      return {
        label: 'در انتظار تائید کارشناس',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
        dotClass: 'bg-amber-500',
        iconName: 'Clock',
      };
  }
}

/**
 * Calculate humanized experience duration from activity start date to now
 */
export function calculateExperienceDuration(startDateString?: string): string {
  if (!startDateString) return '';
  const start = new Date(startDateString);
  if (isNaN(start.getTime())) return '';

  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years < 0) return 'به تازگی آغاز شده';

  if (years === 0) {
    if (months === 0) return 'کمتر از یک ماه';
    return `${toPersianDigits(months)} ماه سابقه`;
  }

  if (months === 0) {
    return `${toPersianDigits(years)} سال سابقه`;
  }

  return `${toPersianDigits(years)} سال و ${toPersianDigits(months)} ماه سابقه`;
}

/**
 * Get all skills stored locally for a member
 */
export function getStoredMemberSkills(memberId: string): IMemberSkill[] {
  if (!memberId) return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${memberId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore JSON parse errors
  }
  return [];
}

/**
 * Persist skills locally for a member
 */
export function setStoredMemberSkills(memberId: string, skills: IMemberSkill[]): void {
  if (!memberId) return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${memberId}`, JSON.stringify(skills));
  } catch {
    // Storage quota or disabled
  }
}

/**
 * Remove stored skills for a member
 */
export function removeStoredMemberSkills(memberId: string): void {
  if (!memberId) return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${memberId}`);
  } catch {
    // Ignore
  }
}

/**
 * Collect all skills across all cached members in local storage
 */
export function getAllStoredSkills(): IMemberSkill[] {
  const all: IMemberSkill[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            all.push(...parsed);
          }
        }
      }
    }
  } catch {
    // Ignore
  }
  return all;
}

/**
 * Helper to generate a new verification log
 */
export function createVerificationLog(
  toStatus: SkillVerificationStatus,
  fromStatus?: SkillVerificationStatus,
  comment?: string,
  rejectionReason?: string,
  operatorName?: string
): ISkillVerificationLog {
  return {
    _id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    fromStatus,
    toStatus,
    changedBy: {
      _id: 'admin_current',
      username: 'admin',
      fullName: operatorName || 'کارشناس صنف',
      type: 'SUPER_ADMIN',
    },
    changedAt: new Date().toISOString(),
    comment: comment || (toStatus === 'APPROVED' ? 'تائید شده توسط کارشناس' : toStatus === 'REJECTED' ? 'رد شده توسط کارشناس' : 'در انتظار بررسی مجدد'),
    rejectionReason: rejectionReason || '',
  };
}

/**
 * Seed realistic initial demo skills if localStorage has no skills yet
 */
export function seedSampleSkillsIfEmpty(members: any[] = [], specializations: any[] = []): void {
  try {
    const existing = getAllStoredSkills();
    if (existing.length > 0) return;

    if (!members || members.length === 0) return;

    const sampleSpecs = specializations.length > 0
      ? specializations
      : [
          { _id: 'spec_net_01', title: 'شبکه و زیرساخت ارتباطی', code: 'NET' },
          { _id: 'spec_dev_02', title: 'مهندسی نرم‌افزار و وب', code: 'DEV' },
          { _id: 'spec_sec_03', title: 'امنیت سایبری و تست نفوذ', code: 'SEC' },
          { _id: 'spec_ai_04', title: 'هوش مصنوعی و یادگیری ماشین', code: 'AI' },
          { _id: 'spec_devops_05', title: 'دواپس و رایانش ابری', code: 'DEVOPS' },
        ];

    const sampleSkillsConfig = [
      {
        specIndex: 0,
        startDate: '2020-03-20T00:00:00.000Z',
        selfAssessmentPercentage: 85,
        hasCertificate: true,
        certificateTitle: 'گواهینامه سیسکو CCNA و CCNP Enterprise',
        certificateFile: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
        description: 'تجربه عملی در پیاده‌سازی سوئیچینگ و روتینگ سازمانی و پیکربندی فایروال',
        verificationStatus: 'PENDING' as SkillVerificationStatus,
        rejectionReason: '',
        logs: [
          {
            _id: 'log_seed_1',
            toStatus: 'PENDING' as SkillVerificationStatus,
            changedBy: null,
            changedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            comment: 'ثبت اولیه مهارت و بارگذاری گواهینامه - در انتظار بررسی کارشناس',
          },
        ],
      },
      {
        specIndex: 1,
        startDate: '2019-06-15T00:00:00.000Z',
        selfAssessmentPercentage: 92,
        hasCertificate: true,
        certificateTitle: 'مدرک تخصصی توسعه نرم‌افزار سازمانی FullStack',
        certificateFile: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=1200&q=80',
        description: 'توسعه میکروسرویس‌های Node.js، معماری کلین و پیاده‌سازی فرانت‌اند پیشرفته Vue / React',
        verificationStatus: 'APPROVED' as SkillVerificationStatus,
        rejectionReason: '',
        logs: [
          {
            _id: 'log_seed_2_1',
            toStatus: 'PENDING' as SkillVerificationStatus,
            changedBy: null,
            changedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
            comment: 'ثبت مهارت توسط عضو',
          },
          {
            _id: 'log_seed_2_2',
            fromStatus: 'PENDING' as SkillVerificationStatus,
            toStatus: 'APPROVED' as SkillVerificationStatus,
            changedBy: { _id: 'admin_1', username: 'expert_mohammadi', fullName: 'مهندس محمدی (کارشناس ارشد صنف)' },
            changedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
            comment: 'گواهی بین‌المللی استعلام شد و با مشخصات هویتی عضو تطابق کامل دارد.',
          },
        ],
      },
      {
        specIndex: 2,
        startDate: '2022-01-10T00:00:00.000Z',
        selfAssessmentPercentage: 65,
        hasCertificate: true,
        certificateTitle: 'گواهینامه ارزیابی امنیتی و تست نفوذ CEH',
        certificateFile: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
        description: 'اجرای تست‌های نفوذ دوره‌ای و گزارش آسیب‌پذیری‌های وب و شبکه',
        verificationStatus: 'REJECTED' as SkillVerificationStatus,
        rejectionReason: 'تصویر ارسالی ناخوانا است و بارکد و شماره سریال گواهی مخدوش می‌باشد. لطفاً اسکن اصل مدرک را مجدداً آپلود فرمایید.',
        logs: [
          {
            _id: 'log_seed_3_1',
            toStatus: 'PENDING' as SkillVerificationStatus,
            changedBy: null,
            changedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
            comment: 'ثبت اولیه مدرک',
          },
          {
            _id: 'log_seed_3_2',
            fromStatus: 'PENDING' as SkillVerificationStatus,
            toStatus: 'REJECTED' as SkillVerificationStatus,
            changedBy: { _id: 'admin_2', username: 'expert_rezaei', fullName: 'مهندس رضایی (ممیز امنیت صنف)' },
            changedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
            comment: 'رد شده به دلیل عدم وضوح تصویر و عدم امکان استعلام',
            rejectionReason: 'تصویر ارسالی ناخوانا است و بارکد و شماره سریال گواهی مخدوش می‌باشد. لطفاً اسکن اصل مدرک را مجدداً آپلود فرمایید.',
          },
        ],
      },
      {
        specIndex: 3,
        startDate: '2023-04-01T00:00:00.000Z',
        selfAssessmentPercentage: 45,
        hasCertificate: false,
        certificateTitle: '',
        certificateFile: '',
        description: 'کار با مدل‌های زبانی بزرگ، بینایی ماشین و پردازش تصویر با پایتون و PyTorch',
        verificationStatus: 'PENDING' as SkillVerificationStatus,
        rejectionReason: '',
        logs: [
          {
            _id: 'log_seed_4',
            toStatus: 'PENDING' as SkillVerificationStatus,
            changedBy: null,
            changedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
            comment: 'ثبت مهارت خوداظهاری بدون گواهینامه رسمی',
          },
        ],
      },
    ];

    members.slice(0, Math.min(members.length, 5)).forEach((member, mIdx) => {
      const memberId = member._id;
      if (!memberId) return;

      const memberSkills: IMemberSkill[] = [];
      const configCount = (mIdx % 2 === 0) ? 2 : 1;

      for (let c = 0; c < configCount; c++) {
        const cfg = sampleSkillsConfig[(mIdx + c) % sampleSkillsConfig.length];
        const spec = sampleSpecs[cfg.specIndex % sampleSpecs.length];

        const skill: IMemberSkill = {
          _id: `skill_${memberId}_${c + 1}`,
          memberId: {
            _id: member._id,
            firstName: member.firstName || 'عضو',
            lastName: member.lastName || 'صنف',
            nationalCode: member.nationalCode || '—',
            memberCode: member.memberCode || '—',
            companyName: member.companyName || '',
          },
          specializationId: {
            _id: spec._id,
            title: spec.title,
            code: spec.code || 'SPEC',
          },
          startDate: cfg.startDate,
          selfAssessmentPercentage: cfg.selfAssessmentPercentage,
          hasCertificate: cfg.hasCertificate,
          certificateTitle: cfg.certificateTitle,
          certificateFile: cfg.certificateFile,
          description: cfg.description,
          verificationStatus: cfg.verificationStatus,
          verifiedBy: cfg.verificationStatus === 'APPROVED' ? { _id: 'admin_1', username: 'expert_mohammadi', fullName: 'مهندس محمدی' } : null,
          verifiedAt: cfg.verificationStatus === 'APPROVED' ? new Date().toISOString() : null,
          rejectionReason: cfg.rejectionReason,
          verificationLogs: cfg.logs,
          isActive: true,
          createdAt: cfg.startDate,
          updatedAt: new Date().toISOString(),
        };

        memberSkills.push(skill);
      }

      setStoredMemberSkills(memberId, memberSkills);
    });
  } catch {
    // Ignore seeding errors
  }
}
