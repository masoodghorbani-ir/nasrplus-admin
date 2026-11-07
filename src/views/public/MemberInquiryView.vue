<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useThemeStore } from '@/stores';
import { inquiryApi } from '@/api';
import type { MemberInquiryResult } from '@/types';
import { AppLogo } from '@/components/ui';
import { resolvePhotoUrl } from '@/services/member-photo.service';
import CaptchaInput from '@/components/common/CaptchaInput.vue';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Hash,
  Building2,
  Printer,
  RotateCcw,
  Copy,
  Check,
  Sun,
  Moon,
  Home,
  ShieldCheck,
  QrCode,
  User,
  ZoomIn,
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
const imageError = ref(false);

watch(inquiryResult, () => {
  imageError.value = false;
});

function formatFieldValue(val?: string | null): string {
  if (!val) return 'ثبت نشده';
  const trimmed = val.trim();
  if (!trimmed || trimmed === '-' || trimmed === '—' || trimmed.includes('انتخاب نشده')) {
    return 'ثبت نشده';
  }
  return trimmed;
}

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
    <main class="flex-1 w-full max-w-4xl mx-auto px-3.5 sm:px-6 py-5 sm:py-12 z-10 print:p-0 print:m-0 print:max-w-none print:w-full">
      <!-- 1. Inquiry Form (Hidden when result is active) -->
      <div v-if="!inquiryResult" class="max-w-xl mx-auto">
        <!-- Hero Header -->
        <div class="text-center mb-6 sm:mb-8">
          <h1 class="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            استعلام اصالت و مجوز اعضا
          </h1>
          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed px-2">
            جهت احراز هویت و بررسی اعتبار پروانه عضویت در نظام صنفی رایانه‌ای، شناسه عضویت و کد ملی عضو را وارد نمایید.
          </p>
        </div>

        <!-- Form Card -->
        <div
          class="bg-white dark:bg-slate-900/90 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 transition-all"
        >
          <!-- Error Alert -->
          <div
            v-if="formError"
            class="mb-5 sm:mb-6 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-800 dark:text-rose-200 text-xs sm:text-sm leading-relaxed"
            role="alert"
          >
            <AlertCircle class="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p class="font-bold">خطا در استعلام</p>
              <p class="mt-0.5 text-rose-700 dark:text-rose-300">{{ formError }}</p>
            </div>
          </div>

          <form class="space-y-4 sm:space-y-5" @submit.prevent="handleInquiry">
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
                  placeholder="شناسه یا کد عضویت"
                  dir="ltr"
                  autocomplete="off"
                  class="w-full h-11 sm:h-12 px-3.5 pl-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono text-sm sm:text-base font-bold transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-right"
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
                  class="w-full h-11 sm:h-12 px-3.5 pl-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono text-sm sm:text-base font-bold transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-right"
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
            <div class="pt-2 sm:pt-3">
              <button
                type="submit"
                :disabled="isLoading"
                class="w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 hover:shadow-xl hover:shadow-brand-600/40 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
        </div>
      </div>

      <!-- 2. Member Inquiry Result Certificate (Official Card) -->
      <div v-else class="max-w-3xl mx-auto print:max-w-none print:w-full print:m-0">
        <!-- Action Toolbar (Hidden when printing) -->
        <div class="print:hidden mb-4 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <button
            type="button"
            class="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            @click="resetForm"
          >
            <RotateCcw class="w-4 h-4 text-slate-500" />
            <span>استعلام مجدد</span>
          </button>

          <div class="grid grid-cols-2 sm:flex items-center gap-2">
            <!-- Share/Copy Link -->
            <button
              type="button"
              class="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="کپی لینک استعلام این پرونده"
              @click="copyInquiryShareLink"
            >
              <Check v-if="isLinkCopied" class="w-4 h-4 text-emerald-600" />
              <Copy v-else class="w-4 h-4 text-slate-500" />
              <span>{{ isLinkCopied ? 'لینک کپی شد' : 'اشتراک‌گذاری' }}</span>
            </button>

            <!-- Print Button -->
            <button
              type="button"
              class="h-10 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-brand-600/25 transition-all cursor-pointer"
              title="چاپ یا ذخیره نسخه چاپی PDF"
              @click="printCertificate"
            >
              <Printer class="w-4 h-4" />
              <span>چاپ شناسنامه</span>
            </button>
          </div>
        </div>

        <!-- Official Inquiry Certificate Document -->
        <div
          id="certificate-print-area"
          class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-xl relative overflow-hidden transition-colors print:border-2 print:border-slate-900 print:shadow-none print:rounded-lg print:max-w-none print:w-full print:bg-white print:text-slate-900"
        >
          <!-- Top Watermark / Security Header Stripe -->
          <div class="h-2 bg-gradient-to-r from-slate-800 via-brand-700 to-slate-800 print:h-2 print:bg-slate-900" />

          <div class="p-3.5 sm:p-8 space-y-4 sm:space-y-6 print:p-4.5 print:space-y-3.5">
            <!-- 1. Formal Certificate Header -->
            <div class="border-b border-slate-200 dark:border-slate-800 pb-4 sm:pb-5 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-5 text-center sm:text-right print:flex-row print:items-center print:justify-between print:text-right print:pb-3 print:gap-4 print:border-b-2 print:border-slate-800">
              <!-- Right Side: Logo & Official Titles -->
              <div class="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-4 text-center sm:text-right print:flex-row print:items-center print:text-right print:gap-3 w-full sm:w-auto">
                <div class="w-13 h-13 sm:w-16 sm:h-16 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-2 shrink-0 shadow-xs print:w-13 print:h-13 print:p-1.5 print:border-slate-400 print:rounded-lg print:bg-white">
                  <AppLogo size="md" :show-text="false" />
                </div>
                <div class="space-y-0.5 sm:space-y-1">
                  <div class="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 print:text-[10px] print:text-slate-600">
                    جمهوری اسلامی ایران &bull; سازمان نظام صنفی رایانه‌ای اردبیل
                  </div>
                  <h2 class="text-sm sm:text-lg font-black text-slate-900 dark:text-white print:text-sm print:font-black print:text-black leading-snug">
                    شناسنامه استعلام اصالت عضویت و مجوز فعالیت
                  </h2>
                  <p class="text-[9.5px] sm:text-xs text-brand-600 dark:text-brand-400 font-medium print:text-[9.5px] print:text-slate-700">
                    سامانه برخط احراز اصالت و اعتبار پروانه الکترونیک (نصر پلاس)
                  </p>
                </div>
              </div>

              <!-- Left Side: Official Document Tracking & Status -->
              <div class="flex flex-col items-center sm:items-end gap-1.5 sm:gap-2 shrink-0 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80 print:items-end print:gap-1 print:border-0 print:pt-0">
                <!-- Status Badge -->
                <div
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border shadow-xs print:py-0.5 print:px-2.5 print:text-[10.5px] print:border-emerald-700 print:text-emerald-900 print:bg-emerald-50"
                  :class="[
                    inquiryResult.statusVariant === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                      : inquiryResult.statusVariant === 'danger'
                      ? 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                      : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
                  ]"
                >
                  <CheckCircle2 v-if="inquiryResult.statusVariant === 'success'" class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 print:w-3.5 print:h-3.5 print:text-emerald-700" />
                  <AlertCircle v-else class="w-3.5 h-3.5 print:w-3.5 print:h-3.5" />
                  <span>{{ inquiryResult.statusLabel }}</span>
                </div>

                <!-- Document Meta Info -->
                <div class="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 print:text-[9.5px] print:text-slate-700">
                  <span class="font-medium">شناسه رهگیری:</span>
                  <span class="font-mono font-bold text-slate-800 dark:text-slate-200 select-all print:text-black" dir="ltr">
                    {{ inquiryResult.inquiryCode }}
                  </span>
                  <button
                    type="button"
                    class="print:hidden text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    title="کپی شناسه استعلام"
                    @click="copyInquiryCode(inquiryResult?.inquiryCode)"
                  >
                    <Copy class="w-3.5 h-3.5" />
                  </button>
                </div>
                <div class="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 print:text-[9.5px] print:text-slate-600">
                  <span class="font-medium">تاریخ صدور:</span>
                  <span class="font-mono">{{ toPersianDigits(inquiryResult.inquiryDateJalali) }}</span>
                </div>
              </div>
            </div>

            <!-- 2. Member Primary Identity Section (Formal 3x4 Photo + Member Profile) -->
            <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 print:flex-row print:items-start print:gap-4 print:p-3 print:bg-slate-50 print:border-slate-300">
              <!-- Official 3x4 Personnel Photo Frame -->
              <div class="shrink-0 flex flex-col items-center">
                <div
                  class="w-24 sm:w-32 h-32 sm:h-42 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-1 shadow-xs relative group cursor-pointer transition-transform hover:scale-101 print:w-24 print:h-32 print:border-slate-400 print:p-1 print:shadow-none print:hover:scale-100"
                  @click="inquiryResult?.profileImage ? (showPhotoModal = true) : null"
                  :title="inquiryResult?.profileImage ? 'کلیک جهت مشاهده تصویر در اندازه اصلی' : ''"
                >
                  <div class="w-full h-full rounded overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                    <img
                      v-if="inquiryResult?.profileImage && !imageError"
                      :src="resolvePhotoUrl(inquiryResult.profileImage)"
                      :alt="inquiryResult.fullName"
                      class="w-full h-full object-cover transition-opacity"
                      loading="lazy"
                      @error="imageError = true"
                    />
                    <div
                      v-else
                      class="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-2 text-center select-none"
                    >
                      <User class="w-10 sm:w-12 h-10 sm:h-12 text-slate-400 dark:text-slate-500 mb-1 print:w-10 print:h-10" />
                      <span class="text-3xs font-medium print:text-[9px]">فاقد تصویر پرسنلی</span>
                    </div>
                  </div>

                  <!-- Subtle zoom overlay icon on hover (only when photo exists) -->
                  <div
                    v-if="inquiryResult?.profileImage && !imageError"
                    class="print:hidden absolute inset-1 bg-black/30 rounded opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none"
                  >
                    <ZoomIn class="w-5 sm:w-6 h-5 sm:h-6 text-white drop-shadow" />
                  </div>
                </div>
              </div>

              <!-- Primary Profile Information -->
              <div class="flex-1 text-center sm:text-right space-y-2.5 sm:space-y-3 w-full print:text-right print:space-y-1.5">
                <div>
                  <div class="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2 print:justify-start print:gap-1.5">
                    <span class="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-md text-3xs font-black bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800 print:text-[10px] print:border-slate-400 print:text-slate-900">
                      {{ inquiryResult.natureOfMembershipName || 'عضو حقیقی' }}
                    </span>
                    <span v-if="inquiryResult.membershipTypeName" class="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-md text-3xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 print:text-[10px] print:border print:border-slate-300 print:text-slate-800">
                      {{ inquiryResult.membershipTypeName }}
                    </span>
                  </div>

                  <h3 class="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mt-1 sm:mt-1.5 tracking-tight print:text-lg print:font-black print:text-black">
                    {{ inquiryResult.fullName }}
                  </h3>

                  <div class="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 mt-1 text-xs text-slate-600 dark:text-slate-300 print:justify-start print:gap-x-4 print:text-[11px] print:text-slate-800">
                    <span v-if="inquiryResult.fatherName">
                      <strong class="text-slate-400 dark:text-slate-500 font-normal print:text-slate-600">نام پدر:</strong>
                      {{ inquiryResult.fatherName }}
                    </span>
                    <span v-if="inquiryResult.companyName" class="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200 print:text-slate-900">
                      <Building2 class="w-3.5 h-3.5 text-slate-400 print:text-slate-700" />
                      <span>{{ inquiryResult.companyName }}</span>
                    </span>
                  </div>
                </div>

                <!-- Primary Identification Strip -->
                <div class="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs print:grid-cols-2 print:gap-2 print:pt-1.5 print:border-slate-300">
                  <div class="flex items-center justify-between sm:justify-start gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 print:p-1.5 print:border-slate-300 print:bg-white">
                    <span class="text-slate-500 dark:text-slate-400 text-3xs sm:text-xs print:text-[10px] print:text-slate-600">شماره / کد عضویت:</span>
                    <span class="font-mono font-bold text-brand-700 dark:text-brand-400 select-all print:text-xs print:text-black" dir="ltr">
                      {{ inquiryResult.memberCode }}
                    </span>
                  </div>

                  <div class="flex items-center justify-between sm:justify-start gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 print:p-1.5 print:border-slate-300 print:bg-white">
                    <span class="text-slate-500 dark:text-slate-400 text-3xs sm:text-xs print:text-[10px] print:text-slate-600">کد ملی / شناسه ملی:</span>
                    <span class="font-mono font-bold text-slate-800 dark:text-slate-200 select-all print:text-xs print:text-black" dir="ltr">
                      {{ inquiryResult.nationalCode ? toPersianDigits(inquiryResult.nationalCode) : '—' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. Official Administrative Specification Table (جدول مشخصات و سوابق پرونده) -->
            <div class="space-y-2 sm:space-y-2.5 print:space-y-1.5">
              <div class="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800 print:border-b print:border-slate-400 print:pb-1">
                <h4 class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 print:text-xs print:text-black">
                  <span class="w-1.5 h-4 bg-brand-600 rounded-full print:bg-slate-800"></span>
                  <span>مشخصات فنی و سوابق پروانه فعالیت صنف</span>
                </h4>
                <span class="text-[10px] sm:text-3xs text-slate-400 dark:text-slate-500 print:text-[10px] print:text-slate-600">پایگاه داده نصر</span>
              </div>

              <!-- Unified Administrative Grid Table -->
              <div class="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 print:border-slate-400 print:rounded-lg print:border">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 divide-slate-200 dark:divide-slate-700 sm:[&>*]:border-b sm:[&>*]:border-l sm:[&>*:nth-child(3n)]:border-l-0 sm:[&>*:nth-last-child(-n+3)]:border-b-0 dark:sm:[&>*]:border-slate-700 print:grid-cols-3 print:[&>*]:border-b print:[&>*]:border-l print:[&>*:nth-child(3n)]:border-l-0 print:[&>*:nth-last-child(-n+3)]:border-b-0 print:[&>*]:border-slate-300">

                  <!-- 1. نوع عضویت -->
                  <div class="p-2.5 sm:p-3.5 flex flex-row items-center justify-between sm:flex-col sm:items-start sm:justify-between gap-2 sm:gap-1 print:flex-col print:items-start print:p-2 print:gap-0.5">
                    <span class="text-3xs text-slate-400 dark:text-slate-500 font-medium shrink-0 print:text-[9.5px] print:text-slate-600">نوع عضویت در صنف</span>
                    <span class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 text-left sm:text-right print:text-[11px] print:font-bold print:text-black">
                      {{ inquiryResult.membershipTypeName || 'عضویت رسمی صنف' }}
                    </span>
                  </div>

                  <!-- 2. ماهیت عضویت -->
                  <div class="p-2.5 sm:p-3.5 flex flex-row items-center justify-between sm:flex-col sm:items-start sm:justify-between gap-2 sm:gap-1 print:flex-col print:items-start print:p-2 print:gap-0.5">
                    <span class="text-3xs text-slate-400 dark:text-slate-500 font-medium shrink-0 print:text-[9.5px] print:text-slate-600">ماهیت پرونده</span>
                    <span class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 text-left sm:text-right print:text-[11px] print:font-bold print:text-black">
                      {{ inquiryResult.natureOfMembershipName || 'شخص حقیقی' }}
                    </span>
                  </div>

                  <!-- 3. استان و شهر -->
                  <div class="p-2.5 sm:p-3.5 flex flex-row items-center justify-between sm:flex-col sm:items-start sm:justify-between gap-2 sm:gap-1 print:flex-col print:items-start print:p-2 print:gap-0.5">
                    <span class="text-3xs text-slate-400 dark:text-slate-500 font-medium shrink-0 print:text-[9.5px] print:text-slate-600">حوزه فعالیت جغرافیایی</span>
                    <span class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 text-left sm:text-right print:text-[11px] print:font-bold print:text-black">
                      {{ inquiryResult.provinceName || 'استان اردبیل' }}
                      <span v-if="inquiryResult.cityName && inquiryResult.cityName !== '—' && inquiryResult.cityName !== '-'">
                        - {{ inquiryResult.cityName }}
                      </span>
                    </span>
                  </div>

                  <!-- 4. رسته تخصصی -->
                  <div class="p-2.5 sm:p-3.5 flex flex-row items-center justify-between sm:flex-col sm:items-start sm:justify-between gap-2 sm:gap-1 print:flex-col print:items-start print:p-2 print:gap-0.5">
                    <span class="text-3xs text-slate-400 dark:text-slate-500 font-medium shrink-0 print:text-[9.5px] print:text-slate-600">رسته تخصصی</span>
                    <span
                      class="text-xs sm:text-sm font-bold text-left sm:text-right print:text-[11px]"
                      :class="formatFieldValue(inquiryResult.specializationName) === 'ثبت نشده' ? 'text-slate-400 dark:text-slate-500 font-normal print:text-slate-500' : 'text-slate-800 dark:text-slate-200 print:text-black print:font-bold'"
                    >
                      {{ formatFieldValue(inquiryResult.specializationName) }}
                    </span>
                  </div>

                  <!-- 5. رتبه و پایه صنفی -->
                  <div class="p-2.5 sm:p-3.5 flex flex-row items-center justify-between sm:flex-col sm:items-start sm:justify-between gap-2 sm:gap-1 print:flex-col print:items-start print:p-2 print:gap-0.5">
                    <span class="text-3xs text-slate-400 dark:text-slate-500 font-medium shrink-0 print:text-[9.5px] print:text-slate-600">رتبه و پایه صنفی</span>
                    <span
                      class="text-xs sm:text-sm font-bold text-left sm:text-right print:text-[11px]"
                      :class="formatFieldValue(inquiryResult.rankName) === 'ثبت نشده' ? 'text-slate-400 dark:text-slate-500 font-normal print:text-slate-500' : 'text-slate-800 dark:text-slate-200 print:text-black print:font-bold'"
                    >
                      {{ formatFieldValue(inquiryResult.rankName) }}
                    </span>
                  </div>

                  <!-- 6. تاریخ عضویت اولیه -->
                  <div class="p-2.5 sm:p-3.5 flex flex-row items-center justify-between sm:flex-col sm:items-start sm:justify-between gap-2 sm:gap-1 print:flex-col print:items-start print:p-2 print:gap-0.5">
                    <span class="text-3xs text-slate-400 dark:text-slate-500 font-medium shrink-0 print:text-[9.5px] print:text-slate-600">تاریخ عضویت اولیه</span>
                    <span class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 font-mono text-left sm:text-right print:text-[11px] print:font-bold print:text-black">
                      {{ inquiryResult.membershipDateJalali ? toPersianDigits(inquiryResult.membershipDateJalali) : '—' }}
                    </span>
                  </div>

                  <!-- 7. تاریخ انقضای پروانه -->
                  <div class="p-2.5 sm:p-3.5 flex flex-row items-center justify-between sm:flex-col sm:items-start sm:justify-between gap-2 sm:gap-1 print:flex-col print:items-start print:p-2 print:gap-0.5">
                    <span class="text-3xs text-slate-400 dark:text-slate-500 font-medium shrink-0 print:text-[9.5px] print:text-slate-600">تاریخ انقضای پروانه</span>
                    <span class="text-xs sm:text-sm font-bold font-mono text-left sm:text-right print:text-[11px] print:font-bold" :class="inquiryResult.isExpired ? 'text-rose-600 print:text-rose-700' : 'text-slate-800 dark:text-slate-200 print:text-black'">
                      {{ inquiryResult.expiryDateJalali ? toPersianDigits(inquiryResult.expiryDateJalali) : '—' }}
                    </span>
                  </div>

                  <!-- 8. وضعیت اعتبار پروانه -->
                  <div class="p-2.5 sm:p-3.5 flex flex-row items-center justify-between sm:flex-col sm:items-start sm:justify-between gap-2 sm:gap-1 sm:col-span-2 lg:col-span-2 print:col-span-2 print:p-2 print:gap-0.5">
                    <span class="text-3xs text-slate-400 dark:text-slate-500 font-medium shrink-0 print:text-[9.5px] print:text-slate-600">وضعیت حقوقی پروانه</span>
                    <div class="flex items-center gap-1.5 sm:gap-2 print:gap-1.5">
                      <span
                        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-3xs sm:text-xs font-bold border print:py-0.5 print:px-2 print:text-[10px]"
                        :class="[
                          inquiryResult.isExpired
                            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900 print:bg-rose-50 print:text-rose-800 print:border-rose-400'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900 print:bg-emerald-50 print:text-emerald-800 print:border-emerald-400',
                        ]"
                      >
                        <span class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full print:w-1.5 print:h-1.5" :class="inquiryResult.isExpired ? 'bg-rose-500' : 'bg-emerald-500'" />
                        <span>{{ inquiryResult.isExpired ? 'منقضی شده' : 'دارای پروانه معتبر صنفی' }}</span>
                      </span>
                      <span v-if="!inquiryResult.isExpired && inquiryResult.expiryDateJalali" class="hidden sm:inline text-3xs text-slate-500 print:text-[9.5px] print:text-slate-700">
                        (معتبر تا تاریخ {{ toPersianDigits(inquiryResult.expiryDateJalali) }})
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <!-- 4. Digital Seal, Legal Disclaimer & QR Code (تاییدیه رسمی دبیرخانه) -->
            <div class="pt-4 sm:pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6 print:flex-row print:items-center print:justify-between print:gap-3 print:pt-3 print:border-slate-400">
              <!-- Legal Certification Notice -->
              <div class="text-center sm:text-right space-y-1 text-3xs sm:text-xs text-slate-500 dark:text-slate-400 max-w-lg print:text-right print:space-y-0.5 print:max-w-md">
                <p class="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center sm:justify-start gap-1.5 print:justify-start print:text-[11px] print:text-black">
                  <ShieldCheck class="w-4 h-4 text-emerald-600 dark:text-emerald-400 print:w-3.5 print:h-3.5 print:text-emerald-700" />
                  <span>تاییدیه رسمی دبیرخانه سازمان نظام صنفی رایانه‌ای:</span>
                </p>
                <p class="leading-relaxed print:text-[9.5px] print:leading-relaxed print:text-slate-700">
                  این شناسنامه الکترونیکی به منزله تایید اصالت عضویت و مجوز فعالیت شخص فوق در سازمان نظام صنفی رایانه‌ای بوده و مندرجات آن بر اساس اطلاعات رسمی سامانه نصر پلاس صادر شده و معتبر و قابل استناد می‌باشد.
                </p>
              </div>

              <!-- Official Seal Stamp & QR Code -->
              <div class="flex items-center justify-center gap-4 shrink-0 print:gap-3">
                <!-- QR Code Representation -->
                <div class="w-18 h-18 sm:w-20 sm:h-20 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-1.5 shadow-xs print:w-15 print:h-15 print:p-1 print:border-slate-400 print:shadow-none">
                  <QrCode class="w-10 h-10 sm:w-11 sm:h-11 text-slate-800 dark:text-slate-200 print:w-9 print:h-9 print:text-black" />
                  <span class="text-[8.5px] sm:text-[9px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 print:text-[8px] print:text-slate-700">اصالت‌سنجی</span>
                </div>

                <!-- Digital Seal Stamp -->
                <div
                  class="w-20 h-20 sm:w-22 sm:h-22 rounded-full border-2 border-emerald-700/80 dark:border-emerald-500/80 flex flex-col items-center justify-center text-center p-1 bg-emerald-50/60 dark:bg-emerald-950/40 rotate-[-6deg] shadow-xs select-none print:w-17 print:h-17 print:border-emerald-800 print:bg-emerald-50 print:rotate-[-3deg] print:shadow-none"
                >
                  <span class="text-[7.5px] sm:text-[8px] font-black text-emerald-900 dark:text-emerald-300 leading-tight print:text-[7.5px] print:text-emerald-950">نظام صنفی رایانه‌ای</span>
                  <ShieldCheck class="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400 my-0.5 print:w-4 print:h-4 print:text-emerald-700" />
                  <span class="text-[7.5px] sm:text-[8px] font-black text-emerald-800 dark:text-emerald-400 print:text-[7.5px] print:text-emerald-900">تایید اصالت</span>
                </div>
              </div>
            </div>

            <!-- 5. Print Official Certificate Tracking Line (حاشیه رسمی پایین سند چاپی) -->
            <div class="hidden print:flex items-center justify-between pt-2 mt-2 border-t border-dashed border-slate-400 text-[9px] text-slate-600 font-mono">
              <span>سازمان نظام صنفی رایانه‌ای — سامانه یکپارچه خدمات الکترونیک نصر پلاس</span>
              <span>شناسه پیگیری سند: {{ inquiryResult.inquiryCode }}</span>
              <span>تاریخ و زمان صدور نسخه چاپی: {{ toPersianDigits(inquiryResult.inquiryDateJalali) }}</span>
            </div>
          </div>
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
        class="relative max-w-sm w-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl p-5 border border-slate-200 dark:border-slate-800"
        @click.stop
      >
        <div class="w-full aspect-[3/4] max-h-[70vh] rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
          <img
            :src="resolvePhotoUrl(inquiryResult.profileImage)"
            :alt="inquiryResult.fullName"
            class="w-full h-full object-contain"
          />
        </div>
        <div class="mt-4 text-center">
          <h4 class="font-bold text-slate-900 dark:text-white">{{ inquiryResult.fullName }}</h4>
          <p class="text-xs text-slate-500 font-mono mt-0.5" dir="ltr">{{ inquiryResult.memberCode }}</p>
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
      <div class="max-w-5xl mx-auto flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 text-center">
        <div class="flex items-center gap-2 font-medium">
          <span class="font-bold text-slate-800 dark:text-slate-200">سامانه نصر پلاس</span>
          <span>&bull;</span>
          <span>سازمان نظام صنفی رایانه‌ای اردبیل</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@media print {
  @page {
    size: A4 portrait;
    margin: 8mm 10mm;
  }

  *,
  *::before,
  *::after {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  html,
  body {
    background: #ffffff !important;
    color: #0f172a !important;
    width: 100% !important;
    height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    font-family: inherit !important;
  }

  .print\:hidden {
    display: none !important;
  }

  main {
    max-width: 100% !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  #certificate-print-area {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 auto !important;
    background: #ffffff !important;
    color: #0f172a !important;
    border: 2px solid #0f172a !important;
    border-radius: 6px !important;
    box-shadow: none !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    page-break-after: avoid !important;
    break-after: avoid !important;
    position: relative !important;
  }

  #certificate-print-area * {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
}
</style>
