<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore, useThemeStore } from '@/stores';
import {
  LayoutDashboard,
  Users,
  Building2,
  Database,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
} from 'lucide-vue-next';

interface NavItem {
  name: string;
  label: string;
  path: string;
  icon: any;
  permission?: string;
  badge?: string;
}

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const themeStore = useThemeStore();

const navItems: NavItem[] = [
  {
    name: 'dashboard',
    label: 'داشبورد',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'members',
    label: 'مدیریت اعضا',
    path: '/members',
    icon: Users,
    permission: 'members:read',
  },
  {
    name: 'companies',
    label: 'مدیریت شرکت‌ها',
    path: '/companies',
    icon: Building2,
    permission: 'companies:read',
  },
  {
    name: 'lookups',
    label: 'اطلاعات پایه و تعاریف',
    path: '/lookups',
    icon: Database,
    permission: 'lookups:read',
  },
  {
    name: 'admins',
    label: 'مدیران و دسترسی‌ها',
    path: '/admins',
    icon: ShieldCheck,
    permission: 'admins:manage',
  },
];

const filteredNavItems = computed(() => {
  return navItems.filter((item) => {
    if (!item.permission) return true;
    return authStore.hasPermission(item.permission);
  });
});

function isItemActive(path: string): boolean {
  if (path === '/dashboard') {
    return route.path === '/dashboard';
  }
  return route.path.startsWith(path);
}

function navigateTo(path: string) {
  router.push(path);
  themeStore.toggleMobileSidebar(false);
}
</script>

<template>
  <aside
    :class="[
      'h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 transition-all duration-300 select-none z-30',
      themeStore.sidebarCollapsed ? 'w-20' : 'w-64',
    ]"
    dir="rtl"
  >
    <!-- Brand Header -->
    <div
      :class="[
        'h-16 flex items-center px-4 border-b border-slate-200 dark:border-slate-800 shrink-0',
        themeStore.sidebarCollapsed ? 'justify-center' : 'justify-between',
      ]"
    >
      <div
        class="flex items-center gap-3 cursor-pointer overflow-hidden"
        @click="navigateTo('/dashboard')"
      >
        <!-- Logo Emblem -->
        <div class="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 p-1 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs">
          <img
            src="/logo.png"
            alt="لوگوی نصر"
            class="h-full w-auto object-contain"
          />
        </div>

        <!-- Brand Text -->
        <div v-if="!themeStore.sidebarCollapsed" class="flex flex-col text-right truncate">
          <span class="text-sm font-black text-slate-900 dark:text-white tracking-tight truncate">
            نصر پلاس
          </span>
          <span class="text-[11px] text-brand-700 dark:text-brand-400 font-bold truncate">
            سامانه مدیریت اعضا (نصر)
          </span>
        </div>
      </div>

      <!-- Close Mobile Sidebar Button -->
      <button
        type="button"
        class="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        @click="themeStore.toggleMobileSidebar(false)"
      >
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- Navigation Links -->
    <div class="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
      <div
        v-if="!themeStore.sidebarCollapsed"
        class="px-3 pb-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider"
      >
        منوی اصلی
      </div>

      <nav class="space-y-1">
        <button
          v-for="item in filteredNavItems"
          :key="item.name"
          type="button"
          :title="themeStore.sidebarCollapsed ? item.label : undefined"
          :class="[
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer',
            isItemActive(item.path)
              ? 'bg-brand-600 text-white font-semibold shadow-sm shadow-brand-600/25'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100',
            themeStore.sidebarCollapsed ? 'justify-center px-0' : '',
          ]"
          @click="navigateTo(item.path)"
        >
          <component
            :is="item.icon"
            :class="[
              'w-5 h-5 shrink-0 transition-transform',
              isItemActive(item.path) ? 'text-white' : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-600',
            ]"
          />

          <span v-if="!themeStore.sidebarCollapsed" class="truncate text-right flex-1">
            {{ item.label }}
          </span>

          <span
            v-if="!themeStore.sidebarCollapsed && item.badge"
            class="text-[11px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-100 font-bold"
          >
            {{ item.badge }}
          </span>
        </button>
      </nav>
    </div>

    <!-- Public Landing Quick Link -->
    <div
      v-if="!themeStore.sidebarCollapsed"
      class="px-3 pt-2 shrink-0"
    >
      <a
        href="/register"
        target="_blank"
        class="flex items-center justify-between p-2 rounded-xl bg-brand-50/70 hover:bg-brand-100/70 dark:bg-brand-950/40 dark:hover:bg-brand-900/50 border border-brand-200/60 dark:border-brand-800/40 text-brand-700 dark:text-brand-300 transition-colors text-xs font-bold"
      >
        <span>پورتال لندینگ ثبت‌نام</span>
        <ExternalLink class="w-3.5 h-3.5" />
      </a>
    </div>

    <!-- Attribution Card -->
    <div
      v-if="!themeStore.sidebarCollapsed"
      class="px-3 pt-2 pb-1 shrink-0"
    >
      <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-center">
        <p class="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
          کاری از متخصصان کمسیون نرم افزار استان اردبیل
        </p>
      </div>
    </div>

    <!-- Sidebar Footer / Collapse Toggle on Desktop -->
    <div
      class="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0 hidden lg:flex items-center justify-between"
    >
      <button
        type="button"
        class="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        @click="themeStore.toggleSidebar"
      >
        <component
          :is="themeStore.sidebarCollapsed ? ChevronLeft : ChevronRight"
          class="w-4 h-4"
        />
        <span v-if="!themeStore.sidebarCollapsed">جمع کردن منو</span>
      </button>
    </div>
  </aside>
</template>
