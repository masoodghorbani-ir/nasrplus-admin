<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useThemeStore } from '@/stores';
import {
  UserCheck,
  ArrowRight,
  Sun,
  Moon,
  Clock,
  ShieldCheck,
  FileCheck2,
  HelpCircle,
} from 'lucide-vue-next';

const router = useRouter();
const themeStore = useThemeStore();

function goHome() {
  router.push('/');
}

function goToAdmin() {
  router.push('/admin');
}
</script>

<template>
  <div
    class="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 relative overflow-x-hidden transition-colors"
    dir="rtl"
  >
    <!-- Header -->
    <header
      class="w-full backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-30"
    >
      <div class="max-w-5xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 cursor-pointer" @click="goHome">
          <div
            class="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-white dark:bg-slate-800 p-1.5 border border-slate-200/90 dark:border-slate-700 shadow-xs flex items-center justify-center shrink-0"
          >
            <img
              src="/logo.png"
              alt="لوگوی نظام صنفی رایانه‌ای"
              class="h-full w-auto object-contain"
            />
          </div>

          <div class="flex flex-col text-right">
            <span class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              پروفایل اعضا &bull; نصر پلاس
            </span>
            <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">
              سامانه یکپارچه اعضای نظام صنفی رایانه‌ای
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            class="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            @click="goHome"
          >
            <ArrowRight class="w-4 h-4" />
            <span class="hidden sm:inline">بازگشت به صفحه اصلی</span>
          </button>

          <button
            type="button"
            class="h-10 w-10 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:border-slate-700"
            :title="themeStore.isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'"
            @click="themeStore.toggleTheme"
          >
            <Sun v-if="themeStore.isDark" class="w-5 h-5 text-amber-400" />
            <Moon v-else class="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>
    </header>

    <!-- Main Container -->
    <main class="flex-1 flex items-center justify-center max-w-3xl w-full mx-auto px-4 sm:px-6 py-12 z-10">
      <div
        class="w-full bg-white dark:bg-slate-900/90 rounded-3xl p-6 sm:p-10 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 text-center"
      >
        <!-- Status Icon -->
        <div
          class="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800/60 mx-auto flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 shadow-xs"
        >
          <UserCheck class="w-10 h-10" />
        </div>

        <!-- Tag -->
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 mb-4">
          <Clock class="w-3.5 h-3.5" />
          <span>پرتال اعضا در حال پیاده‌سازی و آماده‌سازی نهایی</span>
        </div>

        <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
          ورود به پروفایل اعضای سازمان نظام صنفی
        </h1>

        <p class="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          این درگاه اختصاصی برای اعضای محترم (حقیقی، حقوقی و فروشگاهی) جهت ورود با کد ملی / شناسه ملی، مشاهده وضعیت اشتراک، تمدید عضویت و دریافت پروانه فعالیت در حال طراحی و اتصال می‌باشد.
        </p>

        <!-- Feature preview cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 my-8 text-right">
          <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
            <FileCheck2 class="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-2" />
            <h4 class="text-xs font-bold text-slate-900 dark:text-white">پروانه فعالیت هوشمند</h4>
            <p class="text-3xs text-slate-500 dark:text-slate-400 mt-1">مشاهده و دانلود الکترونیک پروانه صنفی معتبر</p>
          </div>

          <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
            <ShieldCheck class="w-5 h-5 text-brand-600 dark:text-brand-400 mb-2" />
            <h4 class="text-xs font-bold text-slate-900 dark:text-white">استعلام صلاحیت‌ها</h4>
            <p class="text-3xs text-slate-500 dark:text-slate-400 mt-1">رتبه‌بندی، رسته‌ها و وضعیت مالی حق عضویت</p>
          </div>

          <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
            <HelpCircle class="w-5 h-5 text-indigo-600 dark:text-indigo-400 mb-2" />
            <h4 class="text-xs font-bold text-slate-900 dark:text-white">پشتیبانی و درخواست‌ها</h4>
            <p class="text-3xs text-slate-500 dark:text-slate-400 mt-1">ارتباط مستقیم با دبیرخانه صنف و ثبت تیکت</p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            class="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-xs sm:text-sm font-bold shadow-md transition-colors cursor-pointer"
            @click="goHome"
          >
            بازگشت به صفحه اصلی
          </button>

          <button
            type="button"
            class="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            @click="goToAdmin"
          >
            ورود به سیستم مدیریت
          </button>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer
      class="w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs py-4 px-4 sm:px-6 z-10"
    >
      <div
        class="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 text-center sm:text-right"
      >
        <div class="flex items-center gap-2">
          <span class="font-bold text-slate-800 dark:text-slate-200">سامانه نصر پلاس</span>
          <span>&bull;</span>
          <span>پروفایل و پرتال اعضای صنف</span>
        </div>
        <div class="font-medium text-slate-600 dark:text-slate-400">
          کاری از متخصصان کمیسیون نرم‌افزار استان اردبیل
        </div>
      </div>
    </footer>
  </div>
</template>
