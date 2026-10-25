<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useMemberAuthStore, useThemeStore } from '@/stores';
import { MemberAvatar, AppLogo } from '@/components/ui';
import { Sun, Moon, LogOut } from 'lucide-vue-next';
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
    class="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95"
  >
    <div class="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
      <button
        type="button"
        class="min-w-0 cursor-pointer text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        title="صفحه اصلی پروفایل عضو"
        @click="goToProfile"
      >
        <AppLogo size="md" />
      </button>

      <div class="flex shrink-0 items-center gap-1 sm:gap-2">
        <button
          type="button"
          class="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          :title="themeStore.isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'"
          @click="themeStore.toggleTheme"
        >
          <Sun v-if="themeStore.isDark" class="h-4 w-4 text-amber-400" />
          <Moon v-else class="h-4 w-4" />
        </button>

        <div
          v-if="memberAuthStore.member"
          class="hidden items-center gap-2 border-r border-slate-200 pr-2 dark:border-slate-700 sm:flex"
        >
          <div class="text-right leading-tight">
            <p class="max-w-[160px] truncate text-xs font-medium text-slate-800 dark:text-slate-100">
              {{ memberAuthStore.memberFullName }}
            </p>
            <p class="mt-0.5 text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
              کد {{ toPersianDigits(memberAuthStore.memberCode) }}
            </p>
          </div>
          <MemberAvatar
            :profile-image="memberAuthStore.member.profileImage"
            :full-name="memberAuthStore.memberFullName"
            size="sm"
            shape="circle"
            :timestamp="memberAuthStore.photoTimestamp"
          />
        </div>

        <button
          type="button"
          class="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          title="خروج از حساب عضویت"
          @click="handleLogout"
        >
          <LogOut class="h-4 w-4" />
          <span class="hidden md:inline">خروج</span>
        </button>
      </div>
    </div>
  </header>
</template>
