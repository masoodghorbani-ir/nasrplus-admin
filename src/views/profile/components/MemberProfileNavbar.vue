<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useMemberAuthStore, useThemeStore } from '@/stores';
import MemberAvatar from '@/components/ui/MemberAvatar.vue';
import {
  Sun,
  Moon,
  LogOut,
} from 'lucide-vue-next';
import { toPersianDigits } from '@/utils/formatters';

const router = useRouter();
const memberAuthStore = useMemberAuthStore();
const themeStore = useThemeStore();

function handleLogout() {
  memberAuthStore.logout();
  router.push('/profile');
}

function goToProfile() {
  router.push('/profile');
}
</script>

<template>
  <header
    class="w-full backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-30 transition-colors"
  >
    <div class="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
      <!-- Right: Logo & Member Brand -->
      <button
        type="button"
        class="flex items-center gap-2.5 sm:gap-3 cursor-pointer group text-right focus:outline-none min-w-0"
        title="صفحه اصلی پروفایل عضو"
        @click="goToProfile"
      >
        <div
          class="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-white dark:bg-slate-800 p-1.5 border border-slate-200/90 dark:border-slate-700 shadow-xs flex items-center justify-center shrink-0 group-hover:border-emerald-500/50 transition-colors"
        >
          <img
            src="/logo.png"
            alt="لوگوی نظام صنفی رایانه‌ای"
            class="h-full w-auto object-contain"
          />
        </div>

        <div class="flex flex-col text-right min-w-0">
          <span class="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
            نصر پلاس
          </span>
          <span class="text-3xs sm:text-xs text-slate-500 dark:text-slate-400 font-normal truncate max-w-[130px] xs:max-w-[200px] sm:max-w-none">
            سامانه یکپارچه سازمان نظام صنفی رایانه‌ای
          </span>
        </div>
      </button>

      <!-- Left: Member Info & Actions -->
      <div class="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <!-- Theme Switcher -->
        <button
          type="button"
          class="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shrink-0"
          :title="themeStore.isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'"
          @click="themeStore.toggleTheme"
        >
          <Sun v-if="themeStore.isDark" class="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          <Moon v-else class="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
        </button>

        <div class="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block shrink-0" />

        <!-- Member Quick Identity Pill -->
        <div
          v-if="memberAuthStore.member"
          class="h-10 sm:h-11 flex items-center gap-2 sm:gap-2.5 px-2 sm:px-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shrink-0"
        >
          <MemberAvatar
            :profile-image="memberAuthStore.member.profileImage"
            :full-name="memberAuthStore.memberFullName"
            size="sm"
            shape="circle"
            :timestamp="memberAuthStore.photoTimestamp"
          />

          <div class="hidden sm:flex flex-col justify-center text-right leading-tight">
            <span class="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[150px]">
              {{ memberAuthStore.memberFullName }}
            </span>
            <div class="flex items-center gap-1 text-3xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>کد:</span>
              <span class="font-medium tabular-nums text-slate-700 dark:text-slate-300">
                {{ toPersianDigits(memberAuthStore.memberCode) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Logout Button -->
        <button
          type="button"
          class="h-10 px-2.5 sm:h-11 sm:px-3.5 rounded-2xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          title="خروج از حساب عضویت"
          @click="handleLogout"
        >
          <LogOut class="w-4 h-4" />
          <span class="hidden md:inline">خروج</span>
        </button>
      </div>
    </div>
  </header>
</template>
