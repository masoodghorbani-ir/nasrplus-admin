<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useThemeStore } from '@/stores';
import { inquiryApi } from '@/api';
import type { MemberInquiryResult } from '@/types';
import { AppLogo, MemberAvatar } from '@/components/ui';
import CaptchaInput from '@/components/common/CaptchaInput.vue';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Hash,
  CreditCard,
  Building2,
  Calendar,
  Award,
  MapPin,
  Briefcase,
  Layers,
  Printer,
  RotateCcw,
  Copy,
  Check,
  Sun,
  Moon,
  Home,
  ShieldCheck,
  QrCode,
  Sparkles,
} from 'lucide-vue-next';
import { toPersianDigits, toLatinDigits } from '@/utils/formatters';

const route = useRoute();
const router = useRouter();
const themeStore = useThemeStore();

// Form Inputs
const memberCode = ref('');
const nationalCode = ref('');
const captchaCode = ref('');
const captchaRef = ref<InstanceType<typeof CaptchaInput> | null>(null);

// Form States
const isLoading = ref(false);
const formError = ref<string | null>(null);
const captchaError = ref<string | null>(null);
const inquiryResult = ref<MemberInquiryResult | null>(null);
const isCopied = ref(false);
const isLinkCopied = ref(false);
const showPhotoModal = ref(false);

// Query params prefill
onMounted(() => {
  const qMemberCode = (route.query.memberCode || route.query.code) as string;
  const qNationalCode = (route.query.nationalCode || route.query.nc) as string;

  if (qMemberCode) {
    memberCode.value = qMemberCode.trim();
  }
  if (qNationalCode) {
    nationalCode.value = qNationalCode.trim();
  }

  // If both provided in URL, focus on captcha
  if (qMemberCode && qNationalCode) {
    captchaRef.value?.focus();
  }
});

const isNationalCodeLengthValid = computed(() => {
  const clean = toLatinDigits(nationalCode.value).trim();
  return clean.length === 10;
});

async function handleInquiry() {
  formError.value = null;
  captchaError.value = null;

  const cleanMemberCode = toLatinDigits(memberCode.value).trim();
  const cleanNationalCode = toLatinDigits(nationalCode.value).trim();

  // Validate Member Code
  if (!cleanMemberCode) {
    formError.value = 'لطفاً شناسه یا کد عضویت صنف را وارد فرمایید.';
    return;
  }

  // Validate National Code
  if (!cleanNationalCode) {
    formError.value = 'لطفاً کد ملی عضو را وارد فرمایید.';
    return;
  }

  if (cleanNationalCode.length !== 10 || !/^\d{10}$/.test(cleanNationalCode)) {
    formError.value = 'کد ملی باید دقیقاً ۱۰ رقم عددی باشد.';
    return;
  }

  // Validate Captcha
  const isCaptchaValid = captchaRef.value?.validate(captchaCode.value);
  if (!isCaptchaValid) {
    captchaError.value = 'کد امنیتی کپچا نادرست است. تصویر جدید تولید شد، لطفاً مجدداً وارد فرمایید.';
    captchaRef.value?.generateCaptcha();
    captchaCode.value = '';
    captchaRef.value?.focus();
    return;
  }

  isLoading.value = true;
  inquiryResult.value = null;

  try {
    const result = await inquiryApi.inquireMember(cleanMemberCode, cleanNationalCode);
    inquiryResult.value = result;

    // Smooth scroll to results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err: any) {
    formError.value = err.message || 'خطا در انجام استعلام. لطفاً مجدداً تلاش فرمایید.';
    // Regenerate captcha on failure for security
    captchaRef.value?.generateCaptcha();
    captchaCode.value = '';
  } finally {
    isLoading.value = false;
  }
}

function resetForm() {
  inquiryResult.value = null;
  formError.value = null;
  captchaError.value = null;
  captchaCode.value = '';
  captchaRef.value?.generateCaptcha();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function fillSampleData() {
  memberCode.value = 'NSR-001403';
  nationalCode.value = '0012345678';
  formError.value = null;
  captchaError.value = null;
  captchaRef.value?.focus();
}

function copyInquiryCode(code?: string) {
  if (!code) return;
  navigator.clipboard.writeText(code);
  isCopied.value = true;
  setTimeout(() => {
    isCopied.value = false;
  }, 2000);
}

function copyInquiryShareLink() {
  const url = `${window.location.origin}/inquiry?memberCode=${encodeURIComponent(
    inquiryResult.value?.memberCode || ''
  )}`;
  navigator.clipboard.writeText(url);
  isLinkCopied.value = true;
  setTimeout(() => {
    isLinkCopied.value = false;
  }, 2000);
}

function printCertificate() {
  window.print();
}

function goToHome() {
  router.push('/');
}
</script>

<template>
  <div
    class="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 transition-colors selection:bg-brand-500 selection:text-white"
    dir="rtl"
  >
    <!-- Background Decorative Glow Elements (Hidden on print) -->
    <div class="print:hidden absolute inset-0 pointer-events-none overflow-hidden">
      <div
        class="absolute -top-32 right-1/2 translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-brand-500/15 via-brand-500/5 to-transparent blur-3xl dark:from-brand-600/10 dark:via-brand-600/5 rounded-full"
      />
      <div
        class="absolute -bottom-40 -left-20 w-80 h-80 bg-emerald-500/10 blur-3xl rounded-full dark:bg-emerald-500/5"
      />
      <div
        class="absolute -bottom-40 -right-20 w-80 h-80 bg-brand-500/10 blur-3xl rounded-full dark:bg-brand-500/5"
      />
    </div>

    <!-- Top Navigation Header (Hidden on print) -->
    <header
      class="print:hidden w-full backdrop-blur-md bg-white/85 dark:bg-slate-900/85 border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-30 transition-colors"
    >
      <div class="max-w-5xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
        <!-- Logo & Title -->
        <div class="flex items-center gap-3">
          <div class="cursor-pointer" @click="goToHome" title="بازگشت به صفحه اصلی">
            <AppLogo size="md" />
          </div>
          <span class="hidden sm:inline-block h-6 w-px bg-slate-200 dark:bg-slate-700" />
          <div class="hidden sm:flex flex-col">
            <span class="text-xs font-bold text-slate-900 dark:text-white">سامانه استعلام اصالت اعضا</span>
            <span class="text-3xs text-slate-500 dark:text-slate-400">سازمان نظام صنفی رایانه‌ای</span>
          </div>
        </div>

        <!-- Right Side: Home Link & Theme Toggle -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            @click="goToHome"
          >
            <Home class="w-3.5 h-3.5" />
            <span class="hidden md:inline">صفحه اصلی</span>
          </button>

          <!-- Theme Toggle -->
          <button
            type="button"
            class="h-9 w-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            :title="themeStore.isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'"
            @click="themeStore.toggleTheme"
          >
            <Sun v-if="themeStore.isDark" class="w-4 h-4 text-amber-400" />
            <Moon v-else class="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>
    </header>

    <!-- Main Container -->
    <main class="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12 z-10">
      <!-- 1. Inquiry Form (Hidden when result is active) -->
      <div v-if="!inquiryResult" class="max-w-xl mx-auto">
        <!-- Hero Header -->
        <div class="text-center mb-8">
          <div
            class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800 mb-3.5 shadow-2xs"
          >
            <ShieldCheck class="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>پایگاه رسمی اعتبارسنجی اعضای صنف</span>
          </div>

          <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            استعلام اصالت و مجوز اعضا
          </h1>
          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            جهت احراز هویت و بررسی اعتبار پروانه عضویت در نظام صنفی رایانه‌ای، شناسه عضویت و کد ملی عضو را وارد نمایید.
          </p>
        </div>

        <!-- Form Card -->
        <div
          class="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 transition-all"
        >
          <!-- Error Alert -->
          <div
            v-if="formError"
            class="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-800 dark:text-rose-200 text-xs sm:text-sm leading-relaxed"
            role="alert"
          >
            <AlertCircle class="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p class="font-bold">خطا در استعلام</p>
              <p class="mt-0.5 text-rose-700 dark:text-rose-300">{{ formError }}</p>
            </div>
          </div>

          <form class="space-y-5" @submit.prevent="handleInquiry">
            <!-- 1. Membership Code Input -->
            <div class="space-y-1.5">
              <label for="member-code-input" class="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                شناسه / کد عضویت صنف
                <span class="text-rose-500 font-black mr-0.5">*</span>
              </label>
              <div class="relative">
                <input
                  id="member-code-input"
                  v-model="memberCode"
                  type="text"
                  required
                  placeholder="مثال: NSR-001403 یا 12345"
                  dir="ltr"
                  autocomplete="off"
                  class="w-full h-12 px-3.5 pl-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono text-sm sm:text-base font-bold transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-right"
                />
                <div class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
                  <Hash class="w-4 h-4" />
                </div>
              </div>
              <p class="text-3xs sm:text-xs text-slate-400 dark:text-slate-500">
                کد درج‌شده بر روی کارت عضویت یا پروانه صنفی
              </p>
            </div>

            <!-- 2. National Code Input -->
            <div class="space-y-1.5">
              <label for="national-code-input" class="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                کد ملی عضو
                <span class="text-rose-500 font-black mr-0.5">*</span>
              </label>
              <div class="relative">
                <input
                  id="national-code-input"
                  v-model="nationalCode"
                  type="text"
                  maxlength="10"
                  required
                  placeholder="کد ۱۰ رقمی ملی بدون خط تیره"
                  dir="ltr"
                  autocomplete="off"
                  class="w-full h-12 px-3.5 pl-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono text-sm sm:text-base font-bold transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-right"
                  :class="{
                    'border-emerald-500 dark:border-emerald-500': isNationalCodeLengthValid,
                  }"
                />
                <div class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
                  <CreditCard class="w-4 h-4" />
                </div>
              </div>
              <p class="text-3xs sm:text-xs text-slate-400 dark:text-slate-500">
                کد ملی شخص حقیقی یا مدیرعامل شخص حقوقی
              </p>
            </div>

            <!-- 3. Captcha Component -->
            <div class="pt-1">
              <CaptchaInput
                ref="captchaRef"
                v-model="captchaCode"
                :has-error="Boolean(captchaError)"
                :error-message="captchaError || ''"
                @enter="handleInquiry"
              />
            </div>

            <!-- Submit Button -->
            <div class="pt-3">
              <button
                type="submit"
                :disabled="isLoading"
                class="w-full h-12 rounded-2xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 hover:shadow-xl hover:shadow-brand-600/40 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div
                  v-if="isLoading"
                  class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                />
                <Search v-else class="w-5 h-5" />
                <span>{{ isLoading ? 'در حال استعلام برخط...' : 'استعلام اطلاعات عضو' }}</span>
              </button>
            </div>
          </form>

          <!-- Testing / Sample Helper -->
          <div class="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span class="text-slate-400 dark:text-slate-500">نیاز به تست سامانه دارید؟</span>
            <button
              type="button"
              class="text-brand-600 dark:text-brand-400 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
              @click="fillSampleData"
            >
              <Sparkles class="w-3.5 h-3.5" />
              <span>مشاهده استعلام نمونه</span>
            </button>
          </div>
        </div>

        <!-- Security & Legal Notice -->
        <div class="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <p>اطلاعات استعلام‌شده مستقیماً از پایگاه داده نظام صنفی رایانه‌ای کشور واکشی می‌گردد.</p>
          <p class="text-3xs text-slate-400 dark:text-slate-500">کلیه حقوق این سامانه متعلق به سازمان نظام صنفی رایانه‌ای می‌باشد.</p>
        </div>
      </div>

      <!-- 2. Member Inquiry Result Certificate (Official Card) -->
      <div v-else class="max-w-3xl mx-auto">
        <!-- Action Toolbar (Hidden when printing) -->
        <div class="print:hidden mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            class="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            @click="resetForm"
          >
            <RotateCcw class="w-4 h-4 text-slate-500" />
            <span>استعلام مجدد</span>
          </button>

          <div class="flex items-center gap-2">
            <!-- Share/Copy Link -->
            <button
              type="button"
              class="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="کپی لینک استعلام این پرونده"
              @click="copyInquiryShareLink"
            >
              <Check v-if="isLinkCopied" class="w-4 h-4 text-emerald-600" />
              <Copy v-else class="w-4 h-4 text-slate-500" />
              <span class="hidden sm:inline">{{ isLinkCopied ? 'لینک کپی شد' : 'اشتراک‌گذاری' }}</span>
            </button>

            <!-- Print Button -->
            <button
              type="button"
              class="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-brand-600/25 transition-all cursor-pointer"
              title="چاپ یا ذخیره نسخه چاپی PDF"
              @click="printCertificate"
            >
              <Printer class="w-4 h-4" />
              <span>چاپ شناسنامه استعلام</span>
            </button>
          </div>
        </div>

        <!-- Official Inquiry Certificate Document -->
        <div
          id="certificate-print-area"
          class="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-2xl relative overflow-hidden transition-colors print:border-2 print:border-black print:shadow-none print:p-6 print:rounded-none"
        >
          <!-- Top Watermark / Security Header Stripe -->
          <div
            class="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-brand-600 via-emerald-500 to-brand-600 print:bg-black"
          />

          <!-- Certificate Header -->
          <div class="border-b-2 border-dashed border-slate-200 dark:border-slate-800 pb-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
            <div class="flex items-center gap-4">
              <!-- Official Emblem / Logo -->
              <div class="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-2 shrink-0 shadow-inner">
                <AppLogo size="md" :show-text="false" />
              </div>
              <div>
                <h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  سازمان نظام صنفی رایانه‌ای کشور
                </h2>
                <h3 class="text-xs sm:text-sm font-bold text-brand-600 dark:text-brand-400 mt-0.5">
                  شناسنامه استعلام اصالت و مجوز عضویت
                </h3>
                <p class="text-3xs sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  سامانه برخط احراز صلاحیت و وضعیت پروانه فعالیت
                </p>
              </div>
            </div>

            <!-- Inquiry Metadata & Status Badge -->
            <div class="flex flex-col items-center sm:items-end gap-2 shrink-0">
              <!-- Status Badge -->
              <div
                class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black border shadow-xs"
                :class="[
                  inquiryResult.statusVariant === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                    : inquiryResult.statusVariant === 'danger'
                    ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                    : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
                ]"
              >
                <CheckCircle2 v-if="inquiryResult.statusVariant === 'success'" class="w-4 h-4 text-emerald-600" />
                <AlertCircle v-else class="w-4 h-4" />
                <span>{{ inquiryResult.statusLabel }}</span>
              </div>

              <!-- Inquiry Code & Date -->
              <div class="text-3xs sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 font-mono">
                <span>کد پیگیری:</span>
                <span class="font-bold text-slate-700 dark:text-slate-200 select-all" dir="ltr">
                  {{ inquiryResult.inquiryCode }}
                </span>
                <button
                  type="button"
                  class="print:hidden text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="کپی کد استعلام"
                  @click="copyInquiryCode(inquiryResult?.inquiryCode)"
                >
                  <Copy class="w-3 h-3" />
                </button>
              </div>
              <div class="text-3xs text-slate-400 dark:text-slate-500">
                تاریخ استعلام: {{ toPersianDigits(inquiryResult.inquiryDateJalali) }}
              </div>
            </div>
          </div>

          <!-- Member Primary Profile Card (Image + Full Name) -->
          <div class="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
            <!-- Personnel Image (تصویر پرسنلی عضو) -->
            <div class="relative group shrink-0">
              <div
                class="w-28 h-36 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-700 shadow-md bg-slate-200 dark:bg-slate-900 flex items-center justify-center cursor-pointer transition-transform group-hover:scale-102"
                @click="showPhotoModal = true"
                title="مشاهده تصویر بزرگتر"
              >
                <MemberAvatar
                  :profile-image="inquiryResult.profileImage"
                  :full-name="inquiryResult.fullName"
                  size="card"
                  shape="portrait"
                />
              </div>
              <span
                class="print:hidden absolute -bottom-2 right-1/2 translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-900/80 text-white text-[10px] font-medium backdrop-blur-xs shadow-xs pointer-events-none"
              >
                تصویر عضو
              </span>
            </div>

            <!-- Identity Info -->
            <div class="flex-1 text-center sm:text-right space-y-3">
              <div>
                <span class="text-3xs sm:text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                  {{ inquiryResult.natureOfMembershipName || 'عضو حقیقی صنف' }}
                </span>
                <h3 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                  {{ inquiryResult.fullName }}
                </h3>
                <p v-if="inquiryResult.fatherName" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  نام پدر: {{ inquiryResult.fatherName }}
                </p>
                <p v-if="inquiryResult.companyName" class="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1 flex items-center gap-1.5 justify-center sm:justify-start">
                  <Building2 class="w-3.5 h-3.5 text-slate-400" />
                  <span>سازمان / شرکت: {{ inquiryResult.companyName }}</span>
                </p>
              </div>

              <!-- Quick Badges -->
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200">
                  <Hash class="w-3.5 h-3.5 text-brand-600" />
                  <span>کد عضویت:</span>
                  <span class="font-mono text-brand-600 dark:text-brand-400 select-all" dir="ltr">
                    {{ inquiryResult.memberCode }}
                  </span>
                </div>

                <div v-if="inquiryResult.nationalCode" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200">
                  <CreditCard class="w-3.5 h-3.5 text-slate-400" />
                  <span>کد ملی:</span>
                  <span class="font-mono text-slate-600 dark:text-slate-300 select-all" dir="ltr">
                    {{ toPersianDigits(inquiryResult.nationalCode) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- All Specified Details Grid (اطلاعات کلی عضو) -->
          <div class="space-y-4">
            <h4 class="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Layers class="w-4 h-4 text-brand-600" />
              <span>مشخصات فنی و سوابق صنفی عضو</span>
            </h4>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              <!-- 1. کد عضویت صنف -->
              <div class="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div class="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-3xs font-bold">
                  <Hash class="w-3.5 h-3.5 text-brand-500" />
                  <span>کد عضویت صنف</span>
                </div>
                <div class="mt-1 font-mono font-black text-slate-900 dark:text-white text-sm sm:text-base select-all" dir="ltr">
                  {{ inquiryResult.memberCode }}
                </div>
              </div>

              <!-- 2. نام و نام خانوادگی -->
              <div class="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div class="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-3xs font-bold">
                  <Briefcase class="w-3.5 h-3.5 text-brand-500" />
                  <span>نام و نام خانوادگی</span>
                </div>
                <div class="mt-1 font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  {{ inquiryResult.fullName }}
                </div>
              </div>

              <!-- 3. نوع عضویت در صنف -->
              <div class="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div class="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-3xs font-bold">
                  <Layers class="w-3.5 h-3.5 text-brand-500" />
                  <span>نوع عضویت در صنف</span>
                </div>
                <div class="mt-1 font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  {{ inquiryResult.membershipTypeName || 'عضویت رسمی صنف' }}
                </div>
              </div>

              <!-- 4. رسته تخصصی -->
              <div class="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div class="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-3xs font-bold">
                  <Award class="w-3.5 h-3.5 text-indigo-500" />
                  <span>رسته تخصصی</span>
                </div>
                <div class="mt-1 font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  {{ inquiryResult.specializationName || 'رسته عمومی نرم‌افزار' }}
                </div>
              </div>

              <!-- 5. رتبه صنف -->
              <div class="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div class="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-3xs font-bold">
                  <Sparkles class="w-3.5 h-3.5 text-amber-500" />
                  <span>رتبه و پایه صنفی</span>
                </div>
                <div class="mt-1 font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  {{ inquiryResult.rankName || 'پایه تخصصی معتبر' }}
                </div>
              </div>

              <!-- 6. استان و شهر -->
              <div class="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div class="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-3xs font-bold">
                  <MapPin class="w-3.5 h-3.5 text-rose-500" />
                  <span>استان و شهر</span>
                </div>
                <div class="mt-1 font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  <span>{{ inquiryResult.provinceName || 'استان اردبیل' }}</span>
                  <span v-if="inquiryResult.cityName && inquiryResult.cityName !== '—'">
                    - {{ inquiryResult.cityName }}
                  </span>
                </div>
              </div>

              <!-- 7. تاریخ عضویت -->
              <div class="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div class="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-3xs font-bold">
                  <Calendar class="w-3.5 h-3.5 text-emerald-500" />
                  <span>تاریخ عضویت اولیه</span>
                </div>
                <div class="mt-1 font-bold text-slate-900 dark:text-white text-sm sm:text-base font-mono">
                  {{ inquiryResult.membershipDateJalali || '—' }}
                </div>
              </div>

              <!-- 8. تاریخ انقضا -->
              <div
                class="p-3.5 rounded-2xl border"
                :class="[
                  inquiryResult.isExpired
                    ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                    : 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60',
                ]"
              >
                <div class="flex items-center gap-2 text-3xs font-bold" :class="inquiryResult.isExpired ? 'text-rose-600' : 'text-emerald-700 dark:text-emerald-300'">
                  <Calendar class="w-3.5 h-3.5" />
                  <span>تاریخ انقضای پروانه</span>
                </div>
                <div
                  class="mt-1 font-bold text-sm sm:text-base font-mono flex items-center justify-between"
                  :class="inquiryResult.isExpired ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-800 dark:text-emerald-200'"
                >
                  <span>{{ inquiryResult.expiryDateJalali || '—' }}</span>
                  <span
                    class="text-3xs px-2 py-0.5 rounded-full font-sans"
                    :class="inquiryResult.isExpired ? 'bg-rose-200 text-rose-800' : 'bg-emerald-200 text-emerald-800'"
                  >
                    {{ inquiryResult.isExpired ? 'منقضی' : 'معتبر' }}
                  </span>
                </div>
              </div>

              <!-- 9. ماهیت پرونده -->
              <div class="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div class="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-3xs font-bold">
                  <Building2 class="w-3.5 h-3.5 text-slate-500" />
                  <span>ماهیت عضویت</span>
                </div>
                <div class="mt-1 font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  {{ inquiryResult.natureOfMembershipName || 'شخص حقیقی' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Digital Seal, Verification Stamp & QR Code -->
          <div class="mt-8 pt-6 border-t-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
            <!-- Official Verification Text -->
            <div class="text-center sm:text-right space-y-1 text-3xs sm:text-xs text-slate-500 dark:text-slate-400 max-w-md">
              <p class="font-bold text-slate-700 dark:text-slate-300">
                تاییدیه رسمی دبیرخانه سازمان نظام صنفی رایانه‌ای:
              </p>
              <p class="leading-relaxed">
                این سند الکترونیکی به منزله تایید اصالت عضویت شخص فوق در سازمان نظام صنفی رایانه‌ای بوده و اطلاعات آن از پایگاه رسمی نصر پلاس صادر گردیده است.
              </p>
            </div>

            <!-- Stylized Digital Seal Stamp & QR Code -->
            <div class="flex items-center gap-4 shrink-0">
              <!-- QR Code Representation -->
              <div class="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-1.5 shadow-2xs">
                <QrCode class="w-11 h-11 text-slate-800 dark:text-slate-200" />
                <span class="text-[9px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">اصالت‌سنجی</span>
              </div>

              <!-- Digital Seal Stamp -->
              <div
                class="w-22 h-22 rounded-full border-2 border-emerald-600/70 dark:border-emerald-500/70 flex flex-col items-center justify-center text-center p-1 bg-emerald-50/50 dark:bg-emerald-950/30 rotate-[-8deg] shadow-xs select-none"
              >
                <span class="text-[8px] font-black text-emerald-800 dark:text-emerald-300 leading-tight">نظام صنفی رایانه‌ای</span>
                <ShieldCheck class="w-5 h-5 text-emerald-600 dark:text-emerald-400 my-0.5" />
                <span class="text-[8px] font-black text-emerald-700 dark:text-emerald-400">تایید اصالت</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Print-only disclaimer -->
        <div class="hidden print:block mt-4 text-center text-[10px] text-gray-500">
          سامانه هوشمند نصر پلاس — تاریخ صدور گزارش چاپی: {{ toPersianDigits(inquiryResult.inquiryDateJalali) }}
        </div>
      </div>
    </main>

    <!-- Photo Zoom Modal -->
    <div
      v-if="showPhotoModal && inquiryResult?.profileImage"
      class="print:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      @click="showPhotoModal = false"
    >
      <div
        class="relative max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl p-4 border border-slate-200 dark:border-slate-800"
        @click.stop
      >
        <div class="w-full h-80 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
          <MemberAvatar
            :profile-image="inquiryResult.profileImage"
            :full-name="inquiryResult.fullName"
            size="card"
            shape="portrait"
          />
        </div>
        <div class="mt-4 text-center">
          <h4 class="font-bold text-slate-900 dark:text-white">{{ inquiryResult.fullName }}</h4>
          <p class="text-xs text-slate-500 font-mono mt-0.5">{{ inquiryResult.memberCode }}</p>
        </div>
        <button
          type="button"
          class="mt-4 w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          @click="showPhotoModal = false"
        >
          بستن تصویر
        </button>
      </div>
    </div>

    <!-- Official Footer (Hidden when printing) -->
    <footer
      class="print:hidden w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs py-5 px-4 sm:px-6 z-10"
    >
      <div class="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 text-center sm:text-right">
        <div class="flex items-center gap-2 font-medium">
          <span class="font-bold text-slate-800 dark:text-slate-200">سامانه نصر پلاس</span>
          <span>&bull;</span>
          <span>سازمان نظام صنفی رایانه‌ای اردبیل</span>
        </div>
        <div class="text-3xs sm:text-xs text-slate-500 dark:text-slate-400">
          پایگاه رسمی خدمات الکترونیک و استعلام اعضای صنف فاوا
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@media print {
  body {
    background: #ffffff !important;
    color: #000000 !important;
  }
  #certificate-print-area {
    box-shadow: none !important;
    border-width: 2px !important;
    border-color: #000000 !important;
    padding: 24px !important;
  }
}
</style>
