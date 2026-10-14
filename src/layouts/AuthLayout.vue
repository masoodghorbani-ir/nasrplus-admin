<script setup lang="ts">
import { useThemeStore } from '@/stores';
import { Sun, Moon } from 'lucide-vue-next';
import { ToastContainer } from '@/components/ui';

const themeStore = useThemeStore();
</script>

<template>
  <div
    class="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 font-sans relative overflow-hidden"
    dir="rtl"
  >
    <!-- Top Bar with Theme Toggle -->
    <header class="w-full px-6 py-4 flex items-center justify-between z-10">
      <router-link to="/register" class="flex items-center gap-3 group">
        <div class="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 flex items-center justify-center shadow-xs">
          <img
            src="/logo.png"
            alt="لوگو نصر"
            class="h-full w-auto object-contain"
          />
        </div>
        <div class="flex flex-col">
          <span class="text-sm font-black text-slate-900 dark:text-white tracking-tight">
            نصر پلاس
          </span>
          <span class="text-3xs text-brand-700 dark:text-brand-400 font-bold">
            سامانه مدیریت اعضا (نصر)
          </span>
        </div>
      </router-link>

      <div class="flex items-center gap-3">
        <router-link
          to="/register"
          class="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline hidden sm:inline"
        >
          پورتال و لندینگ ثبت‌نام اعضا &larr;
        </router-link>

        <button
          type="button"
          class="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          :title="themeStore.isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'"
          @click="themeStore.toggleTheme"
        >
          <Sun v-if="themeStore.isDark" class="w-5 h-5 text-amber-400" />
          <Moon v-else class="w-5 h-5 text-slate-600" />
        </button>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="w-full py-4 text-center text-xs text-slate-400 dark:text-slate-500 z-10 space-y-1">
      <div>سازمان نظام صنفی رایانه‌ای کشور &bull; سامانه جامع مدیریت اعضا (نصر پلاس)</div>
      <div class="font-medium text-slate-500 dark:text-slate-400">کاری از متخصصان کمسیون نرم افزار استان اردبیل</div>
    </footer>

    <!-- Global Toast Container -->
    <ToastContainer />
  </div>
</template>
