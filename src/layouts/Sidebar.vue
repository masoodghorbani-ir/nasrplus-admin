<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore, useThemeStore, useLookupsStore } from '@/stores';
import { AppLogo } from '@/components/ui';
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
    label: 'مدیران و دسترسی‌ها',
    path: '/admin/admins',
    icon: ShieldCheck,
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

const isMembersSubmenuOpen = ref(isMembersSectionActive.value);
const isDeskSubmenuOpen = ref(isDeskSectionActive.value);

watch(
  () => route.path,
  () => {
    if (isMembersSectionActive.value) {
      isMembersSubmenuOpen.value = true;
    }
    if (isDeskSectionActive.value) {
      isDeskSubmenuOpen.value = true;
    }
  }
);

onMounted(() => {
  lookupsStore.fetchAllLookups();
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
            <!-- Collapsed Mode: Single Icon Button -->
            <button
              v-if="themeStore.sidebarCollapsed"
              type="button"
              :title="item.label"
              :class="[
                'w-full flex items-center justify-center px-0 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer',
                isDeskSectionActive
                  ? 'bg-brand-600 text-white font-semibold shadow-sm shadow-brand-600/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100',
              ]"
              @click="handleDeskParentClick"
            >
              <component
                :is="item.icon"
                :class="[
                  'w-5 h-5 shrink-0 transition-transform',
                  isDeskSectionActive ? 'text-white' : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-600',
                ]"
              />
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

                <ChevronDown
                  :class="[
                    'w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200',
                    isDeskSubmenuOpen ? 'rotate-180' : '',
                  ]"
                />
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
                    'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer text-right',
                    isQualificationsDeskActive
                      ? 'bg-brand-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200 font-medium',
                  ]"
                  @click="navigateTo('/admin/desk/qualifications')"
                >
                  <GraduationCap class="w-3.5 h-3.5 shrink-0" />
                  <span class="truncate">بررسی مدارک تحصیلی</span>
                </button>

                <!-- 2. Member Skills & Specializations Verification Desk -->
                <button
                  type="button"
                  :class="[
                    'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer text-right',
                    isSkillsDeskActive
                      ? 'bg-brand-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200 font-medium',
                  ]"
                  @click="navigateTo('/admin/desk/skills')"
                >
                  <Award class="w-3.5 h-3.5 shrink-0" />
                  <span class="truncate">بررسی مهارت‌ها و گواهی‌ها</span>
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
