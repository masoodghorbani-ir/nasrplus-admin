<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore, useThemeStore, useLookupsStore, useDeskStore } from '@/stores';
import { AppLogo } from '@/components/ui';
import { toPersianDigits } from '@/utils/formatters';
import {
  LayoutDashboard,
  Users,
  Building2,
  Database,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  GraduationCap,
  Award,
  ClipboardCheck,
  Layers,
  Bookmark,
  BookOpen,
  LayoutGrid,
  Settings,
} from 'lucide-vue-next';

interface NavItem {
  name: string;
  label: string;
  path: string;
  icon: any;
  permission?: string;
  superAdminOnly?: boolean;
  badge?: string;
}

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const themeStore = useThemeStore();
const lookupsStore = useLookupsStore();
const deskStore = useDeskStore();

const navItems: NavItem[] = [
  {
    name: 'dashboard',
    label: 'داشبورد',
    path: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'members',
    label: 'مدیریت اعضا',
    path: '/admin/members',
    icon: Users,
    permission: 'members:read',
  },
  {
    name: 'desk',
    label: 'کارتابل',
    path: '/admin/desk/qualifications',
    icon: ClipboardCheck,
    permission: 'members:read',
  },
  {
    name: 'companies',
    label: 'مدیریت شرکت‌ها',
    path: '/admin/companies',
    icon: Building2,
    permission: 'companies:read',
  },
  {
    name: 'lookups',
    label: 'اطلاعات پایه و دسته‌بندی‌ها',
    path: '/admin/lookups',
    icon: Database,
    superAdminOnly: true,
  },
  {
    name: 'admins',
    label: 'مدیران و کارشناسان',
    path: '/admin/admins',
    icon: ShieldCheck,
    superAdminOnly: true,
  },
  {
    name: 'settings',
    label: 'تنظیمات مدیریتی',
    path: '/admin/settings',
    icon: Settings,
    superAdminOnly: true,
  },
];

const filteredNavItems = computed(() => {
  return navItems.filter((item) => {
    if (item.superAdminOnly && !authStore.isSuperAdmin) {
      return false;
    }
    if (!item.permission) return true;
    return authStore.hasPermission(item.permission);
  });
});

function isItemActive(path: string): boolean {
  if (path === '/admin/dashboard') {
    return route.path === '/admin/dashboard' || route.path === '/admin';
  }
  return route.path.startsWith(path);
}

const isDeskSectionActive = computed(() => {
  return (
    route.path.startsWith('/admin/desk') ||
    route.path.startsWith('/desk') ||
    route.path.startsWith('/admin/members/qualifications') ||
    route.path.startsWith('/admin/members/skills') ||
    route.path.startsWith('/members/qualifications') ||
    route.path.startsWith('/members/skills')
  );
});

const isMembersSectionActive = computed(() => {
  if (isDeskSectionActive.value) return false;
  return route.path.startsWith('/admin/members') || route.path.startsWith('/members');
});

const isAllMembersActive = computed(() => {
  return (
    (route.path === '/admin/members' || route.path === '/members') &&
    !route.query.membershipTypeId &&
    !route.query.type
  );
});

const isQualificationsDeskActive = computed(() => {
  return (
    route.path.startsWith('/admin/desk/qualifications') ||
    route.path.startsWith('/desk/qualifications') ||
    route.path.startsWith('/admin/members/qualifications') ||
    route.path.startsWith('/admin/members/academic-qualifications') ||
    route.path.startsWith('/members/qualifications')
  );
});

const isSkillsDeskActive = computed(() => {
  return (
    route.path.startsWith('/admin/desk/skills') ||
    route.path.startsWith('/desk/skills') ||
    route.path.startsWith('/admin/members/skills') ||
    route.path.startsWith('/members/skills')
  );
});

const isLookupsSectionActive = computed(() => {
  return route.path.startsWith('/admin/lookups') || route.path.startsWith('/lookups');
});

const isAllLookupsActive = computed(() => {
  return (
    isLookupsSectionActive.value &&
    !route.query.tab &&
    !route.params.tab
  );
});

const isSpecializationsLookupActive = computed(() => {
  if (!isLookupsSectionActive.value) return false;
  const tab = (route.query.tab || route.params.tab) ? String(route.query.tab || route.params.tab) : '';
  return tab === 'specializations';
});

function isLookupTabActive(tabId: string): boolean {
  if (!isLookupsSectionActive.value) return false;
  const tab = (route.query.tab || route.params.tab) ? String(route.query.tab || route.params.tab) : '';
  return tab === tabId;
}

const isMembersSubmenuOpen = ref(isMembersSectionActive.value);
const isDeskSubmenuOpen = ref(isDeskSectionActive.value);
const isLookupsSubmenuOpen = ref(isLookupsSectionActive.value);

watch(
  () => route.path,
  () => {
    if (isMembersSectionActive.value) {
      isMembersSubmenuOpen.value = true;
    }
    if (isDeskSectionActive.value) {
      isDeskSubmenuOpen.value = true;
    }
    if (isLookupsSectionActive.value) {
      isLookupsSubmenuOpen.value = true;
    }
  }
);

onMounted(() => {
  lookupsStore.fetchAllLookups();
  deskStore.fetchPendingCounts();
});

function isMembershipTypeActive(id: string, title?: string): boolean {
  if (route.path !== '/admin/members' && route.path !== '/members') return false;
  const current = (route.query.membershipTypeId || route.query.type)
    ? String(route.query.membershipTypeId || route.query.type)
    : '';
  if (!current) return false;
  return current === id || (!!title && current === title);
}

function navigateTo(path: string) {
  router.push(path);
  themeStore.toggleMobileSidebar(false);
}

function handleMembersParentClick() {
  if (themeStore.sidebarCollapsed) {
    themeStore.toggleSidebar();
    isMembersSubmenuOpen.value = true;
    navigateToMembers(undefined);
  } else {
    isMembersSubmenuOpen.value = !isMembersSubmenuOpen.value;
    if (isMembersSubmenuOpen.value && !isMembersSectionActive.value) {
      navigateToMembers(undefined);
    }
  }
}

function handleDeskParentClick() {
  if (themeStore.sidebarCollapsed) {
    themeStore.toggleSidebar();
    isDeskSubmenuOpen.value = true;
    navigateTo('/admin/desk/qualifications');
  } else {
    isDeskSubmenuOpen.value = !isDeskSubmenuOpen.value;
    if (isDeskSubmenuOpen.value && !isDeskSectionActive.value) {
      navigateTo('/admin/desk/qualifications');
    }
  }
}

function navigateToMembers(typeId?: string) {
  const currentQueryTypeId = (route.query.membershipTypeId || route.query.type)
    ? String(route.query.membershipTypeId || route.query.type)
    : '';
  if ((route.path === '/admin/members' || route.path === '/members') && (typeId ? currentQueryTypeId === typeId : !currentQueryTypeId)) {
    themeStore.toggleMobileSidebar(false);
    return;
  }

  if (typeId) {
    router.push({
      path: '/admin/members',
      query: { membershipTypeId: typeId },
    });
  } else {
    router.push({
      path: '/admin/members',
    });
  }
  themeStore.toggleMobileSidebar(false);
}

function handleLookupsParentClick() {
  if (themeStore.sidebarCollapsed) {
    themeStore.toggleSidebar();
    isLookupsSubmenuOpen.value = true;
    navigateToLookups(undefined);
  } else {
    isLookupsSubmenuOpen.value = !isLookupsSubmenuOpen.value;
    if (isLookupsSubmenuOpen.value && !isLookupsSectionActive.value) {
      navigateToLookups(undefined);
    }
  }
}

function navigateToLookups(tab?: string) {
  const currentTab = (route.query.tab || route.params.tab) ? String(route.query.tab || route.params.tab) : '';
  if (isLookupsSectionActive.value && (tab ? currentTab === tab : !currentTab)) {
    themeStore.toggleMobileSidebar(false);
    return;
  }

  if (tab) {
    router.push({
      path: '/admin/lookups',
      query: { tab },
    });
  } else {
    router.push({
      path: '/admin/lookups',
    });
  }
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
        class="flex items-center cursor-pointer overflow-hidden min-w-0"
        @click="navigateTo('/admin/dashboard')"
      >
        <AppLogo
          size="sm"
          :hide-text="themeStore.sidebarCollapsed"
        />
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
        <template v-for="item in filteredNavItems" :key="item.name">
          <!-- Special Members Item with Submenu -->
          <div v-if="item.name === 'members'" class="space-y-1">
            <!-- Collapsed Mode: Single Icon Button -->
            <button
              v-if="themeStore.sidebarCollapsed"
              type="button"
              :title="item.label"
              :class="[
                'w-full flex items-center justify-center px-0 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer',
                isMembersSectionActive
                  ? 'bg-brand-600 text-white font-semibold shadow-sm shadow-brand-600/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100',
              ]"
              @click="handleMembersParentClick"
            >
              <component
                :is="item.icon"
                :class="[
                  'w-5 h-5 shrink-0 transition-transform',
                  isMembersSectionActive ? 'text-white' : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-600',
                ]"
              />
            </button>

            <!-- Expanded Mode: Accordion Header & Submenu -->
            <div v-else>
              <button
                type="button"
                :class="[
                  'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer',
                  isMembersSectionActive
                    ? 'bg-brand-50/80 text-brand-900 dark:bg-brand-950/40 dark:text-brand-100 font-bold border border-brand-200/50 dark:border-brand-800/40'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100',
                ]"
                @click="handleMembersParentClick"
              >
                <div class="flex items-center gap-3 truncate min-w-0">
                  <component
                    :is="item.icon"
                    :class="[
                      'w-5 h-5 shrink-0 transition-transform',
                      isMembersSectionActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-400',
                    ]"
                  />
                  <span class="truncate text-right">{{ item.label }}</span>
                </div>

                <ChevronDown
                  :class="[
                    'w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200',
                    isMembersSubmenuOpen ? 'rotate-180' : '',
                  ]"
                />
              </button>

              <!-- Collapsible Submenu -->
              <div
                v-show="isMembersSubmenuOpen"
                class="pr-3 mr-3.5 border-r-2 border-slate-200/80 dark:border-slate-800 space-y-1 mt-1 transition-all"
              >
                <!-- 1. All Members Option -->
                <button
                  type="button"
                  :class="[
                    'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer text-right',
                    isAllMembersActive
                      ? 'bg-brand-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200 font-medium',
                  ]"
                  @click="navigateToMembers(undefined)"
                >
                  <span
                    :class="[
                      'w-1.5 h-1.5 rounded-full shrink-0 transition-colors',
                      isAllMembersActive ? 'bg-white' : 'bg-slate-400 dark:bg-slate-500',
                    ]"
                  ></span>
                  <span class="truncate">مشاهده همه اعضا</span>
                </button>

                <!-- Membership Types -->
                <button
                  v-for="mType in lookupsStore.membershipTypes"
                  :key="mType._id"
                  type="button"
                  :class="[
                    'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer text-right',
                    isMembershipTypeActive(mType._id, mType.title)
                      ? 'bg-brand-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200 font-medium',
                  ]"
                  @click="navigateToMembers(mType._id)"
                >
                  <span
                    :class="[
                      'w-1.5 h-1.5 rounded-full shrink-0 transition-colors',
                      isMembershipTypeActive(mType._id, mType.title) ? 'bg-white' : 'bg-slate-400 dark:bg-slate-500',
                    ]"
                  ></span>
                  <span class="truncate">{{ mType.title }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Special Desk Item with Submenu -->
          <div v-else-if="item.name === 'desk'" class="space-y-1">
            <!-- Collapsed Mode: Single Icon Button with Badge -->
            <button
              v-if="themeStore.sidebarCollapsed"
              type="button"
              :title="item.label"
              :class="[
                'w-full flex items-center justify-center px-0 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer relative',
                isDeskSectionActive
                  ? 'bg-brand-600 text-white font-semibold shadow-sm shadow-brand-600/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100',
              ]"
              @click="handleDeskParentClick"
            >
              <div class="relative">
                <component
                  :is="item.icon"
                  :class="[
                    'w-5 h-5 shrink-0 transition-transform',
                    isDeskSectionActive ? 'text-white' : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-600',
                  ]"
                />
                <!-- Collapsed numeric badge indicator -->
                <span
                  v-if="deskStore.totalPendingCount > 0"
                  class="absolute -top-1 -left-1.5 min-w-[15px] h-3.5 px-0.5 rounded-full bg-amber-500 text-white text-[9px] font-bold leading-none inline-flex items-center justify-center shadow-xs tabular-nums"
                >
                  {{ toPersianDigits(deskStore.totalPendingCount) }}
                </span>
              </div>
            </button>

            <!-- Expanded Mode: Accordion Header & Submenu -->
            <div v-else>
              <button
                type="button"
                :class="[
                  'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer',
                  isDeskSectionActive
                    ? 'bg-brand-50/80 text-brand-900 dark:bg-brand-950/40 dark:text-brand-100 font-bold border border-brand-200/50 dark:border-brand-800/40'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100',
                ]"
                @click="handleDeskParentClick"
              >
                <div class="flex items-center gap-3 truncate min-w-0">
                  <component
                    :is="item.icon"
                    :class="[
                      'w-5 h-5 shrink-0 transition-transform',
                      isDeskSectionActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-400',
                    ]"
                  />
                  <span class="truncate text-right">{{ item.label }}</span>
                </div>

                <div class="flex items-center gap-1.5 shrink-0">
                  <!-- Total Pending Badge on Parent Desk -->
                  <span
                    v-if="deskStore.totalPendingCount > 0"
                    :class="[
                      'h-4.5 min-w-[18px] px-1 text-[10px] font-bold leading-none rounded-full inline-flex items-center justify-center tabular-nums border transition-colors',
                      isDeskSectionActive
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-700/80'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
                    ]"
                    :title="`${toPersianDigits(deskStore.totalPendingCount)} پرونده در انتظار بررسی`"
                  >
                    {{ toPersianDigits(deskStore.totalPendingCount) }}
                  </span>

                  <ChevronDown
                    :class="[
                      'w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200',
                      isDeskSubmenuOpen ? 'rotate-180' : '',
                    ]"
                  />
                </div>
              </button>

              <!-- Collapsible Submenu -->
              <div
                v-show="isDeskSubmenuOpen"
                class="pr-3 mr-3.5 border-r-2 border-slate-200/80 dark:border-slate-800 space-y-1 mt-1 transition-all"
              >
                <!-- 1. Academic Qualifications Verification Desk -->
                <button
                  type="button"
                  :class="[
                    'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer text-right',
                    isQualificationsDeskActive
                      ? 'bg-brand-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200 font-medium',
                  ]"
                  @click="navigateTo('/admin/desk/qualifications')"
                >
                  <div class="flex items-center gap-2 truncate min-w-0">
                    <GraduationCap class="w-3.5 h-3.5 shrink-0" />
                    <span class="truncate">بررسی مدارک تحصیلی</span>
                  </div>

                  <!-- Qualifications Pending Badge -->
                  <span
                    v-if="deskStore.pendingQualificationsCount > 0"
                    :class="[
                      'h-4 min-w-[16px] px-1 text-[10px] font-bold leading-none rounded-full inline-flex items-center justify-center tabular-nums shrink-0 border transition-colors',
                      isQualificationsDeskActive
                        ? 'bg-white/20 text-white border-white/25'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/80',
                    ]"
                    :title="`${toPersianDigits(deskStore.pendingQualificationsCount)} مدرک در انتظار بررسی`"
                  >
                    {{ toPersianDigits(deskStore.pendingQualificationsCount) }}
                  </span>
                </button>

                <!-- 2. Member Skills & Specializations Verification Desk -->
                <button
                  type="button"
                  :class="[
                    'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer text-right',
                    isSkillsDeskActive
                      ? 'bg-brand-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200 font-medium',
                  ]"
                  @click="navigateTo('/admin/desk/skills')"
                >
                  <div class="flex items-center gap-2 truncate min-w-0">
                    <Award class="w-3.5 h-3.5 shrink-0" />
                    <span class="truncate">بررسی مهارت‌ها و گواهی‌ها</span>
                  </div>

                  <!-- Skills Pending Badge -->
                  <span
                    v-if="deskStore.pendingSkillsCount > 0"
                    :class="[
                      'h-4 min-w-[16px] px-1 text-[10px] font-bold leading-none rounded-full inline-flex items-center justify-center tabular-nums shrink-0 border transition-colors',
                      isSkillsDeskActive
                        ? 'bg-white/20 text-white border-white/25'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/80',
                    ]"
                    :title="`${toPersianDigits(deskStore.pendingSkillsCount)} مهارت در انتظار بررسی`"
                  >
                    {{ toPersianDigits(deskStore.pendingSkillsCount) }}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <!-- Special Lookups Item with Submenu -->
          <div v-else-if="item.name === 'lookups'" class="space-y-1">
            <!-- Collapsed Mode: Single Icon Button -->
            <button
              v-if="themeStore.sidebarCollapsed"
              type="button"
              :title="item.label"
              :class="[
                'w-full flex items-center justify-center px-0 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer',
                isLookupsSectionActive
                  ? 'bg-brand-600 text-white font-semibold shadow-sm shadow-brand-600/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100',
              ]"
              @click="handleLookupsParentClick"
            >
              <component
                :is="item.icon"
                :class="[
                  'w-5 h-5 shrink-0 transition-transform',
                  isLookupsSectionActive ? 'text-white' : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-600',
                ]"
              />
            </button>

            <!-- Expanded Mode: Accordion Header & Submenu -->
            <div v-else>
              <button
                type="button"
                :class="[
                  'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer',
                  isLookupsSectionActive
                    ? 'bg-brand-50/80 text-brand-900 dark:bg-brand-950/40 dark:text-brand-100 font-bold border border-brand-200/50 dark:border-brand-800/40'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100',
                ]"
                @click="handleLookupsParentClick"
              >
                <div class="flex items-center gap-3 truncate min-w-0">
                  <component
                    :is="item.icon"
                    :class="[
                      'w-5 h-5 shrink-0 transition-transform',
                      isLookupsSectionActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-400',
                    ]"
                  />
                  <span class="truncate text-right">{{ item.label }}</span>
                </div>

                <div class="flex items-center gap-1.5 shrink-0">
                  <ChevronDown
                    :class="[
                      'w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200',
                      isLookupsSubmenuOpen ? 'rotate-180' : '',
                    ]"
                  />
                </div>
              </button>

              <!-- Collapsible Submenu -->
              <div
                v-show="isLookupsSubmenuOpen"
                class="pr-3 mr-3.5 border-r-2 border-slate-200/80 dark:border-slate-800 space-y-1 mt-1 transition-all"
              >
                <!-- 1. All Lookups / Hub -->
                <button
                  type="button"
                  :class="[
                    'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer text-right',
                    isAllLookupsActive
                      ? 'bg-brand-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200 font-medium',
                  ]"
                  @click="navigateToLookups(undefined)"
                >
                  <LayoutGrid class="w-3.5 h-3.5 shrink-0" />
                  <span class="truncate">پیشخوان اطلاعات پایه</span>
                </button>

                <!-- 2. Specializations (مدیریت رسته‌های تخصصی فاوا) -->
                <button
                  type="button"
                  :class="[
                    'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer text-right',
                    isSpecializationsLookupActive
                      ? 'bg-brand-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200 font-medium',
                  ]"
                  @click="navigateToLookups('specializations')"
                >
                  <div class="flex items-center gap-2 truncate min-w-0">
                    <Layers class="w-3.5 h-3.5 shrink-0" />
                    <span class="truncate">رسته‌های تخصصی فاوا</span>
                  </div>

                  <span
                    v-if="lookupsStore.specializations.length > 0"
                    :class="[
                      'h-4 min-w-[16px] px-1 text-[10px] font-bold leading-none rounded-full inline-flex items-center justify-center tabular-nums shrink-0 border transition-colors',
                      isSpecializationsLookupActive
                        ? 'bg-white/20 text-white border-white/25'
                        : 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/80',
                    ]"
                  >
                    {{ toPersianDigits(lookupsStore.specializations.length) }}
                  </span>
                </button>

                <!-- 3. Membership Types -->
                <button
                  type="button"
                  :class="[
                    'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer text-right',
                    isLookupTabActive('membership-types')
                      ? 'bg-brand-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200 font-medium',
                  ]"
                  @click="navigateToLookups('membership-types')"
                >
                  <Bookmark class="w-3.5 h-3.5 shrink-0" />
                  <span class="truncate">انواع عضویت در صنف</span>
                </button>

                <!-- 4. Ranks -->
                <button
                  type="button"
                  :class="[
                    'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer text-right',
                    isLookupTabActive('ranks')
                      ? 'bg-brand-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200 font-medium',
                  ]"
                  @click="navigateToLookups('ranks')"
                >
                  <Award class="w-3.5 h-3.5 shrink-0" />
                  <span class="truncate">رتبه‌ها و درجات صنفی</span>
                </button>

                <!-- 5. Nature of Memberships -->
                <button
                  type="button"
                  :class="[
                    'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer text-right',
                    isLookupTabActive('nature-of-memberships')
                      ? 'bg-brand-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200 font-medium',
                  ]"
                  @click="navigateToLookups('nature-of-memberships')"
                >
                  <Database class="w-3.5 h-3.5 shrink-0" />
                  <span class="truncate">ماهیت عضویت</span>
                </button>

                <!-- 6. Academic Fields -->
                <button
                  type="button"
                  :class="[
                    'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer text-right',
                    isLookupTabActive('academic-fields')
                      ? 'bg-brand-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200 font-medium',
                  ]"
                  @click="navigateToLookups('academic-fields')"
                >
                  <BookOpen class="w-3.5 h-3.5 shrink-0" />
                  <span class="truncate">رشته‌های تحصیلی</span>
                </button>

                <!-- 7. Degree Levels -->
                <button
                  type="button"
                  :class="[
                    'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer text-right',
                    isLookupTabActive('degree-levels')
                      ? 'bg-brand-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200 font-medium',
                  ]"
                  @click="navigateToLookups('degree-levels')"
                >
                  <GraduationCap class="w-3.5 h-3.5 shrink-0" />
                  <span class="truncate">مقاطع تحصیلی</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Standard Nav Item -->
          <button
            v-else
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
        </template>
      </nav>
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
