<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { adminsApi, healthApi, type HealthResponse } from '@/api';
import { useLookupsStore, useNotificationStore, useAuthStore } from '@/stores';
import {
  Settings,
  ShieldAlert,
  Activity,
  ShieldCheck,
  Database,
  Server,
  Search,
  RefreshCw,
  ArrowRight,
  ChevronLeft,
  LayoutGrid,
  Lock,
  Cpu,
  Globe,
  CheckCircle2,
} from 'lucide-vue-next';
import {
  Button,
  Input,
  Select,
  Badge,
  EmptyState,
  CategoryCard,
  type CategoryColor,
} from '@/components/ui';
import { toPersianDigits } from '@/utils/formatters';
import { extractErrorMessage } from '@/utils/errors';
import { getApiBaseUrl } from '@/config';
import LoginLogsView from '@/views/admins/LoginLogsView.vue';
import HealthView from '@/views/health/HealthView.vue';

export type SettingsTab = 'login-logs' | 'health' | 'server-config';

interface SettingsCategoryDef {
  id: string;
  tabKey?: SettingsTab;
  label: string;
  description: string;
  icon: any;
  color: CategoryColor;
  count?: () => number | string | undefined;
  countLabel?: string;
  badge?: string;
  isExternalLink?: boolean;
  targetPath?: string;
}

const route = useRoute();
const router = useRouter();
const lookupsStore = useLookupsStore();
const notificationStore = useNotificationStore();
const authStore = useAuthStore();

// Child components refs
const loginLogsRef = ref<any>(null);
const healthRef = ref<any>(null);

// State
const selectedTab = ref<SettingsTab | null>(null);
const hubSearchQuery = ref('');
const isRefreshing = ref(false);

// Live statistics
const totalLogsCount = ref<number>(0);
const totalAdminsCount = ref<number>(0);
const healthData = ref<HealthResponse | null>(null);
const latencyMs = ref<number | null>(null);

const apiBaseUrl = getApiBaseUrl();

const categories: SettingsCategoryDef[] = [
  {
    id: 'login-logs',
    tabKey: 'login-logs',
    label: 'لاگ‌های ورود به سیستم',
    description: 'ثبت جامع و ممیزی امنیتی نشست‌های ورود مدیران و کارشناسان همراه با IP و مشخصات دستگاه',
    icon: ShieldAlert,
    color: 'rose',
    count: () => totalLogsCount.value,
    countLabel: 'نشست ورود ثبت‌شده',
    badge: 'ممیزی امنیتی',
  },
  {
    id: 'health',
    tabKey: 'health',
    label: 'وضعیت و سلامت سامانه',
    description: 'پایش پایداری سرویس‌ها، ارتباط با پایگاه داده MongoDB، نسخه سامانه و تاخیر پاسخگویی (Ping)',
    icon: Activity,
    color: 'emerald',
    count: () => (latencyMs.value !== null ? `${latencyMs.value} ms` : 'آنلاین'),
    countLabel: 'تاخیر پاسخگویی سرور',
    badge: 'پایش زیرساخت',
  },
  {
    id: 'admins',
    label: 'مدیران و سطوح دسترسی',
    description: 'تعریف حساب‌های کاربری مدیران، کارشناسان بررسی پرونده و انتساب مجوزهای امنیتی سامانه',
    icon: ShieldCheck,
    color: 'blue',
    count: () => totalAdminsCount.value,
    countLabel: 'کاربر مدیر و کارشناس',
    badge: 'کنترل دسترسی',
    isExternalLink: true,
    targetPath: '/admin/admins',
  },
  {
    id: 'lookups',
    label: 'اطلاعات پایه و تعاریف صنف',
    description: 'مدیریت انواع عضویت، رسته‌های تخصصی فاوا، رتبه‌ها، ماهیت عضویت و رشته‌های تحصیلی',
    icon: Database,
    color: 'cyan',
    count: () =>
      lookupsStore.membershipTypes.length +
      lookupsStore.specializations.length +
      lookupsStore.ranks.length +
      lookupsStore.natureOfMemberships.length +
      lookupsStore.academicFields.length +
      lookupsStore.degreeLevels.length,
    countLabel: 'تعاریف مرجع فعال',
    badge: 'تعاریف صنف',
    isExternalLink: true,
    targetPath: '/admin/lookups',
  },
  {
    id: 'server-config',
    tabKey: 'server-config',
    label: 'پیکربندی محیط و سرویس‌ها',
    description: 'مشاهده مشخصات محیط استقرار، پروتکل‌های احراز هویت، نگارش هسته و اطلاعات شبکه',
    icon: Server,
    color: 'purple',
    count: () => 'v1.0.0',
    countLabel: 'نگارش سامانه',
    badge: 'محیط اجرا',
  },
];

// Available internal tabs for dropdown quick switcher
const internalCategories = computed(() => {
  return categories.filter((c) => !c.isExternalLink && c.tabKey);
});

const internalCategoryOptions = computed(() => {
  return internalCategories.value.map((c) => ({
    label: c.label,
    value: c.tabKey!,
  }));
});

// Watch route for tab syncing
watch(
  () => [route.query.tab, route.params.tab],
  ([newQueryTab, newParamTab]) => {
    const activeTab = (newParamTab as string) || (newQueryTab as string);
    if (activeTab && internalCategories.value.some((c) => c.tabKey === activeTab)) {
      selectedTab.value = activeTab as SettingsTab;
    } else {
      selectedTab.value = null;
    }
  },
  { immediate: true }
);

const currentCategory = computed(() => {
  return categories.find((c) => c.tabKey === selectedTab.value) || null;
});

// Search filter
function normalizeText(text?: string | number | null): string {
  if (text === undefined || text === null) return '';
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[يى]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

const filteredCategories = computed(() => {
  const q = normalizeText(hubSearchQuery.value);
  if (!q) return categories;
  return categories.filter(
    (c) =>
      normalizeText(c.label).includes(q) ||
      normalizeText(c.description).includes(q)
  );
});

function handleCategoryClick(cat: SettingsCategoryDef) {
  if (cat.isExternalLink && cat.targetPath) {
    router.push(cat.targetPath);
    return;
  }
  if (cat.tabKey) {
    selectTab(cat.tabKey);
  }
}

function selectTab(tab: SettingsTab) {
  selectedTab.value = tab;
  router.push({ path: `/admin/settings/${tab}` });
}

function backToHub() {
  selectedTab.value = null;
  router.push({ path: '/admin/settings' });
}

async function loadInitialStats() {
  // 1. Fetch total login logs count
  try {
    const logsRes = await adminsApi.getLoginLogs({ limit: 1 });
    if (logsRes.success && logsRes.data) {
      totalLogsCount.value = logsRes.data.pagination?.total || 0;
    }
  } catch (err) {
    // Non-blocking
  }

  // 2. Fetch total admins count
  try {
    const adminsRes = await adminsApi.getAdmins();
    if (adminsRes.success && adminsRes.data) {
      totalAdminsCount.value = adminsRes.data.length || 0;
    }
  } catch (err) {
    // Non-blocking
  }

  // 3. Ping health endpoint
  try {
    const start = performance.now();
    const h = await healthApi.getHealth();
    const end = performance.now();
    latencyMs.value = Math.round(end - start);
    healthData.value = h;
  } catch (err) {
    // Non-blocking
  }

  // 4. Lookups
  lookupsStore.fetchAllLookups();
}

async function refreshAll() {
  isRefreshing.value = true;
  try {
    await loadInitialStats();
    if (selectedTab.value === 'login-logs' && loginLogsRef.value?.fetchLogs) {
      await loginLogsRef.value.fetchLogs();
    } else if (selectedTab.value === 'health' && healthRef.value?.checkHealth) {
      await healthRef.value.checkHealth();
    }
    notificationStore.success('اطلاعات تنظیمات مدیریتی با موفقیت به‌روزرسانی شد.');
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در تازه‌سازی اطلاعات'));
  } finally {
    isRefreshing.value = false;
  }
}

async function handleCategoryRefresh() {
  if (selectedTab.value === 'login-logs' && loginLogsRef.value?.fetchLogs) {
    await loginLogsRef.value.fetchLogs();
    notificationStore.success('فهرست لاگ‌های ورود به‌روزرسانی شد.');
  } else if (selectedTab.value === 'health' && healthRef.value?.checkHealth) {
    await healthRef.value.checkHealth();
  } else {
    await refreshAll();
  }
}

function getIconBgClass(color?: CategoryColor) {
  switch (color) {
    case 'emerald':
      return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40';
    case 'cyan':
      return 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400 border-cyan-100 dark:border-cyan-900/40';
    case 'amber':
      return 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-100 dark:border-amber-900/40';
    case 'purple':
      return 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border-purple-100 dark:border-purple-900/40';
    case 'blue':
      return 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border-blue-100 dark:border-blue-900/40';
    case 'indigo':
      return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40';
    case 'rose':
    default:
      return 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border-rose-100 dark:border-rose-900/40';
  }
}

function getBadgeVariant(color?: CategoryColor): any {
  if (color === 'emerald') return 'emerald';
  if (color === 'cyan') return 'cyan';
  if (color === 'amber') return 'amber';
  if (color === 'purple') return 'purple';
  if (color === 'blue') return 'blue';
  if (color === 'rose') return 'rose';
  return 'brand';
}

watch(
  currentCategory,
  (cat) => {
    if (cat) {
      document.title = `${cat.label} | تنظیمات مدیریتی سامانه نصر پلاس`;
    } else {
      document.title = 'تنظیمات مدیریتی | سامانه نصر پلاس';
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (!authStore.isSuperAdmin) {
    router.replace('/admin/dashboard');
    return;
  }
  loadInitialStats();
});
</script>

<template>
  <div class="space-y-6 text-right select-none" dir="rtl">
    <!-- VIEW 1: HUB / CATEGORY SELECTION CARDS VIEW -->
    <div v-if="!selectedTab" class="space-y-6">
      <!-- Header Section -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <Settings class="w-6 h-6 text-brand-600" />
            <span>تنظیمات مدیریتی</span>
          </h1>
          <p class="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            ممیزی امنیتی، تاریخچه لاگ‌های ورود، پایش سلامت سرویس‌ها و پیکربندی‌های مدیریتی سامانه
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            :loading="isRefreshing"
            title="تازه‌سازی اطلاعات"
            @click="refreshAll"
          >
            <RefreshCw class="w-4 h-4 ml-1.5" />
            تازه‌سازی همه
          </Button>
        </div>
      </div>

      <!-- Search & Overview Stats Bar -->
      <div
        class="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div class="w-full sm:max-w-sm">
          <Input
            v-model="hubSearchQuery"
            placeholder="جستجو در بخش‌های تنظیمات مدیریتی..."
          >
            <template #prefix>
              <Search class="w-4 h-4 text-slate-400" />
            </template>
          </Input>
        </div>

        <div class="flex items-center flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div class="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <LayoutGrid class="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>{{ toPersianDigits(categories.length) }} بخش مدیریتی</span>
          </div>

          <div class="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <ShieldAlert class="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>مجموع {{ toPersianDigits(totalLogsCount) }} لاگ ورود</span>
          </div>

          <div class="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <Activity class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>پایش سرور: {{ latencyMs !== null ? `${toPersianDigits(latencyMs)} میلی‌ثانیه` : 'آنلاین' }}</span>
          </div>
        </div>
      </div>

      <!-- Categories Card Grid -->
      <div
        v-if="filteredCategories.length > 0"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
      >
        <CategoryCard
          v-for="cat in filteredCategories"
          :key="cat.id"
          :title="cat.label"
          :description="cat.description"
          :icon="cat.icon"
          :color="cat.color"
          :count="cat.count ? cat.count() : undefined"
          :count-label="cat.countLabel"
          :badge="cat.badge"
          @click="handleCategoryClick(cat)"
        />
      </div>

      <!-- Empty State for Search -->
      <div
        v-else
        class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8"
      >
        <EmptyState
          title="بخشی با این عنوان یافت نشد"
          description="لطفاً عبارت دیگری را برای جستجو در تنظیمات مدیریتی وارد فرمایید."
          :icon="Search"
        >
          <template #action>
            <Button variant="outline" size="sm" @click="hubSearchQuery = ''">
              پاک کردن جستجو
            </Button>
          </template>
        </EmptyState>
      </div>
    </div>

    <!-- VIEW 2: CATEGORY DETAIL VIEW (e.g. LOGIN LOGS, HEALTH, SERVER CONFIG) -->
    <div v-else class="space-y-6">
      <!-- Breadcrumb & Top Navigation Bar -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            @click="backToHub"
            class="shrink-0"
          >
            <ArrowRight class="w-4 h-4 ml-1.5" />
            <span>بازگشت به تنظیمات مدیریتی</span>
          </Button>

          <div class="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          <!-- Breadcrumbs -->
          <nav class="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <button
              type="button"
              class="hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer"
              @click="backToHub"
            >
              تنظیمات مدیریتی
            </button>
            <ChevronLeft class="w-3.5 h-3.5 text-slate-400" />
            <span class="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <component :is="currentCategory?.icon" class="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              {{ currentCategory?.label }}
            </span>
          </nav>
        </div>

        <div class="flex items-center flex-wrap gap-2.5">
          <!-- Quick Switcher Dropdown -->
          <div class="w-56">
            <Select
              :model-value="selectedTab"
              :options="internalCategoryOptions"
              size="sm"
              placeholder="تغییر بخش..."
              @update:model-value="(val) => selectTab(val as SettingsTab)"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            :loading="isRefreshing"
            title="تازه‌سازی"
            @click="handleCategoryRefresh"
          >
            <RefreshCw class="w-4 h-4 ml-1" />
            تازه‌سازی
          </Button>
        </div>
      </div>

      <!-- Current Category Header Card -->
      <div
        class="p-5 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs flex items-center justify-between gap-4"
      >
        <div class="flex items-center gap-4">
          <div
            :class="[
              'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs',
              getIconBgClass(currentCategory?.color),
            ]"
          >
            <component :is="currentCategory?.icon" class="w-6 h-6" />
          </div>

          <div>
            <h2 class="text-lg font-black text-slate-900 dark:text-slate-100">
              {{ currentCategory?.label }}
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {{ currentCategory?.description }}
            </p>
          </div>
        </div>

        <div v-if="currentCategory?.badge" class="hidden sm:flex items-center gap-2">
          <Badge :variant="getBadgeVariant(currentCategory?.color)" size="md">
            {{ currentCategory.badge }}
          </Badge>
        </div>
      </div>

      <!-- Tab Content 1: Login Logs -->
      <div v-if="selectedTab === 'login-logs'">
        <LoginLogsView ref="loginLogsRef" :embedded="true" />
      </div>

      <!-- Tab Content 2: System Health -->
      <div v-else-if="selectedTab === 'health'">
        <HealthView ref="healthRef" :embedded="true" />
      </div>

      <!-- Tab Content 3: Server & Environment Configuration -->
      <div v-else-if="selectedTab === 'server-config'" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <!-- Item 1: App Core -->
          <div class="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-500 dark:text-slate-400">سامانه مدیریت</span>
              <div class="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
                <Server class="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">
                نصر پلاس (مدیریت متمرکز)
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                نگارش نرم‌افزار: <span class="font-bold font-mono">v1.0.0</span>
              </p>
            </div>
            <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span class="text-slate-400">پلتفرم:</span>
              <span class="font-bold text-slate-700 dark:text-slate-300">Vue 3 + Vite + TypeScript</span>
            </div>
          </div>

          <!-- Item 2: API Base URL -->
          <div class="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-500 dark:text-slate-400">سرویس وب پایه</span>
              <div class="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
                <Globe class="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">
                آدرس سرور API
              </h3>
              <p class="text-xs text-brand-600 dark:text-brand-400 mt-1 font-mono font-bold truncate" dir="ltr">
                {{ apiBaseUrl }}
              </p>
            </div>
            <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span class="text-slate-400">پروتکل:</span>
              <span class="font-bold text-slate-700 dark:text-slate-300">RESTful JSON Envelope</span>
            </div>
          </div>

          <!-- Item 3: Security & Session -->
          <div class="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-500 dark:text-slate-400">احراز هویت و نشست</span>
              <div class="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                <Lock class="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">
                توکن امنیتی نشست
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                پروتکل: <span class="font-bold font-mono">JWT Bearer Token</span>
              </p>
            </div>
            <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span class="text-slate-400">وضعیت سشن:</span>
              <span class="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 class="w-3.5 h-3.5" />
                احراز هویت فعال
              </span>
            </div>
          </div>
        </div>

        <!-- System Architecture Card -->
        <div class="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Cpu class="w-4 h-4 text-brand-600" />
              اطلاعات معماری و زیرساخت نصر پلاس
            </h3>
            <Badge variant="brand">سرویس ابری / محلی</Badge>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between">
              <span class="text-slate-500 dark:text-slate-400">پایگاه داده اصلی:</span>
              <span class="font-bold text-slate-800 dark:text-slate-200">MongoDB با نگاشت Mongoose ODM</span>
            </div>

            <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between">
              <span class="text-slate-500 dark:text-slate-400">محیط زمان اجرا (Runtime):</span>
              <span class="font-bold text-slate-800 dark:text-slate-200">Node.js Express + Vite Client</span>
            </div>

            <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between">
              <span class="text-slate-500 dark:text-slate-400">کنترل دسترسی‌ها (RBAC):</span>
              <span class="font-bold text-slate-800 dark:text-slate-200">مدیر ارشد، مدیر، کارشناس استانی</span>
            </div>

            <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between">
              <span class="text-slate-500 dark:text-slate-400">ممیزی امنیتی فعالیت‌ها:</span>
              <span class="font-bold text-emerald-600 dark:text-emerald-400">ثبت دائمی IP، دستگاه، مرورگر و زمان</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
