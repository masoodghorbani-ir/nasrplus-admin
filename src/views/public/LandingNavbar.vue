<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useThemeStore } from '@/stores';
import {
  Sun,
  Moon,
  Search,
  LogIn,
} from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'open-tracking'): void;
}>();

const router = useRouter();
const themeStore = useThemeStore();

function goToLogin() {
  router.push('/admin');
}

function goToHome() {
  router.push('/');
}
</script>

<template>
  <header
    class="w-full backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 transition-colors sticky top-0 z-40"
    dir="rtl"
  >
    <div class="max-w-6xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2">
      <!-- Logo & Title -->
      <div class="flex items-center gap-2.5 sm:gap-3 shrink-0 cursor-pointer" @click="goToHome">
        <!-- Logo Emblem -->
        <div class="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 p-1 sm:p-1.5 border border-slate-200/90 dark:border-slate-700 shadow-2xs flex items-center justify-center shrink-0">
          <img
            src="/logo.png"
            alt="لوگوی سازمان نظام صنفی رایانه‌ای"
            class="h-full w-auto object-contain"
          />
        </div>

        <!-- Text -->
        <div class="flex flex-col sm:flex-row sm:items-baseline sm:gap-1.5">
          <span class="text-xs sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
            نصر پلاس
          </span>
          <span class="text-3xs sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
            (سامانه ثبت‌نام آنلاین اعضا)
          </span>
        </div>
      </div>

      <!-- Left Quick Actions -->
      <div class="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <!-- Tracking button -->
        <button
          type="button"
          class="h-9 px-2.5 sm:px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-500 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          title="پیگیری پرونده با کد رهگیری یا کد ملی"
          @click="emit('open-tracking')"
        >
          <Search class="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
          <span class="hidden md:inline">پیگیری پرونده</span>
        </button>

        <!-- Admin Login link -->
        <button
          type="button"
          class="h-9 px-2.5 sm:px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          title="ورود مدیران و کارشناسان صنف"
          @click="goToLogin"
        >
          <LogIn class="w-3.5 h-3.5 shrink-0" />
          <span class="hidden md:inline">ورود مدیران</span>
        </button>

        <!-- Theme Toggle -->
        <button
          type="button"
          class="h-9 w-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          :title="themeStore.isDark ? 'حالت روشن' : 'حالت تاریک'"
          @click="themeStore.toggleTheme"
        >
          <Sun v-if="themeStore.isDark" class="w-4 h-4 text-amber-400" />
          <Moon v-else class="w-4 h-4 text-slate-600" />
        </button>
      </div>
    </div>
  </header>
</template>
