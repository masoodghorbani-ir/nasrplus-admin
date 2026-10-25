<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useThemeStore } from '@/stores';
import { AppLogo } from '@/components/ui';
import {
  ShieldCheck,
  UserCheck,
  Sun,
  Moon,
  ArrowLeft,
  Building2,
} from 'lucide-vue-next';

const router = useRouter();
const themeStore = useThemeStore();

function goToAdmin() {
  router.push('/admin');
}

function goToProfile() {
  router.push('/profile');
}
</script>

<template>
  <div
    class="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 relative overflow-x-hidden transition-colors selection:bg-brand-500 selection:text-white"
    dir="rtl"
  >
    <!-- Background Decorative Glow Elements -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
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

    <!-- Top Navigation Header -->
    <header
      class="w-full backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-30 transition-colors"
    >
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
        <!-- Brand Emblem & Title -->
        <AppLogo size="md" />

        <!-- Right Side (in RTL): Theme Switcher -->
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Theme Toggle Button -->
          <button
            type="button"
            class="h-10 w-10 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            :title="themeStore.isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'"
            @click="themeStore.toggleTheme"
          >
            <Sun v-if="themeStore.isDark" class="w-5 h-5 text-amber-400" />
            <Moon v-else class="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>
    </header>

    <!-- Main Hero & Selection Area -->
    <main class="flex-1 flex flex-col justify-center max-w-5xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-20 z-10">
      <!-- Welcome Intro -->
      <div class="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
        <div
          class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 mb-4"
        >
          <Building2 class="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span>پورتال خدمات الکترونیک نظام صنفی رایانه‌ای</span>
        </div>

        <h1
          class="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-snug sm:leading-tight"
        >
          سامانه هوشمند <span class="text-brand-600 dark:text-brand-400">نصر پلاس</span>
        </h1>

        <p class="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
          لطفاً برای ورود به بخش مورد نظر، یکی از درگاه‌های زیر را انتخاب فرمایید:
        </p>
      </div>

      <!-- Action Cards: Admin vs Member Profile -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-4xl mx-auto w-full">
        <!-- 1. Admin System Portal -->
        <div
          class="group relative bg-white dark:bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 hover:border-brand-500/60 dark:hover:border-brand-500/50 hover:shadow-2xl hover:shadow-brand-500/10 dark:hover:shadow-brand-950/40 transition-all duration-300 flex flex-col justify-between cursor-pointer"
          @click="goToAdmin"
        >
          <!-- Subtle Top Gradient Highlight -->
          <div
            class="absolute top-0 right-8 left-8 h-1 bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-500 rounded-b opacity-80 group-hover:opacity-100 transition-opacity"
          />

          <div>
            <!-- Icon & Badge Header -->
            <div class="flex items-center justify-between gap-3 mb-6">
              <div
                class="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/70 border border-brand-200/80 dark:border-brand-800/60 flex items-center justify-center text-brand-600 dark:text-brand-400 group-hover:scale-105 group-hover:bg-brand-600 group-hover:text-white transition-all duration-300 shadow-xs"
              >
                <ShieldCheck class="w-7 h-7" />
              </div>

              <span
                class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 border border-brand-200/70 dark:border-brand-800/60"
              >
                ویژه مدیران و دبیرخانه
              </span>
            </div>

            <!-- Title & Description -->
            <h2 class="text-xl font-black text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              ورود به سیستم مدیریت
            </h2>

            <p class="mt-2.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              دسترسی به داشبورد جامع، مدیریت و بایگانی اعضای حقیقی و حقوقی، پایش پروانه‌ها، تعاریف پایه صنف و کنترل دسترسی مدیران.
            </p>
          </div>

          <!-- Bottom Action Button -->
          <div class="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-brand-600 text-white hover:bg-brand-700 font-bold text-sm shadow-md shadow-brand-600/25 group-hover:shadow-lg group-hover:shadow-brand-600/35 transition-all cursor-pointer"
              @click.stop="goToAdmin"
            >
              <span>ورود به سیستم مدیریت</span>
              <ArrowLeft class="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </button>
          </div>
        </div>

        <!-- 2. Members Profile Portal -->
        <div
          class="group relative bg-white dark:bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 hover:border-emerald-500/60 dark:hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10 dark:hover:shadow-emerald-950/40 transition-all duration-300 flex flex-col justify-between cursor-pointer"
          @click="goToProfile"
        >
          <!-- Subtle Top Gradient Highlight -->
          <div
            class="absolute top-0 right-8 left-8 h-1 bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 rounded-b opacity-80 group-hover:opacity-100 transition-opacity"
          />

          <div>
            <!-- Icon & Badge Header -->
            <div class="flex items-center justify-between gap-3 mb-6">
              <div
                class="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-xs"
              >
                <UserCheck class="w-7 h-7" />
              </div>

              <span
                class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60"
              >
                ویژه اعضای صنف
              </span>
            </div>

            <!-- Title & Description -->
            <h2 class="text-xl font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              ورود به پروفایل اعضا
            </h2>

            <p class="mt-2.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              مشاهده وضعیت عضویت، اعتبار پروانه فعالیت، استعلام صلاحیت‌ها، دریافت گواهی الکترونیک و رهگیری پرونده‌های ثبتی.
            </p>
          </div>

          <!-- Bottom Action Button -->
          <div class="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-sm shadow-md shadow-emerald-600/25 group-hover:shadow-lg group-hover:shadow-emerald-600/35 transition-all cursor-pointer"
              @click.stop="goToProfile"
            >
              <span>ورود به پروفایل اعضا</span>
              <ArrowLeft class="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer
      class="w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs py-4 px-4 sm:px-6 z-10"
    >
      <div
        class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 text-center sm:text-right"
      >
        <div class="flex items-center gap-2">
          <span class="font-bold text-slate-800 dark:text-slate-200">سامانه نصر پلاس</span>
          <span>&bull;</span>
          <span>سازمان نظام صنفی رایانه‌ای اردبیل</span>
        </div>
        <div class="font-medium text-slate-600 dark:text-slate-400">
          کاری از متخصصان کمیسیون نرم‌افزار استان اردبیل
        </div>
      </div>
    </footer>
  </div>
</template>
