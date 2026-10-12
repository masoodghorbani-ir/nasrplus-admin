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
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-600/30">
          <svg
            class="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <span class="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
          سامانه نصر پلاس
        </span>
      </div>

      <button
        type="button"
        class="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        :title="themeStore.isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'"
        @click="themeStore.toggleTheme"
      >
        <Sun v-if="themeStore.isDark" class="w-5 h-5 text-amber-400" />
        <Moon v-else class="w-5 h-5 text-slate-600" />
      </button>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="w-full py-4 text-center text-xs text-slate-400 dark:text-slate-500 z-10">
      سازمان نظام صنفی رایانه‌ای کشور &bull; سامانه جامع مدیریت اعضا (نصر پلاس)
    </footer>

    <!-- Global Toast Container -->
    <ToastContainer />
  </div>
</template>
