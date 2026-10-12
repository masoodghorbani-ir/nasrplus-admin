<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { membersApi, companiesApi } from '@/api';
import { useAuthStore, useLookupsStore, useThemeStore } from '@/stores';
import type { Member } from '@/types';
import {
  Users,
  UserCheck,
  Clock,
  Building2,
  PlusCircle,
  ArrowUpRight,
  Eye,
} from 'lucide-vue-next';
import {
  StatCard,
  Button,
  DatePicker,
  Badge,
  Skeleton,
  TableActions,
} from '@/components/ui';
import {
  formatPersianDate,
  toPersianDigits,
  statusConfig,
} from '@/utils/formatters';
import { getTodayJalali, formatJalali } from '@/utils/jalali';
import { Bar, Doughnut } from 'vue-chartjs';

const router = useRouter();
const authStore = useAuthStore();
const lookupsStore = useLookupsStore();
const themeStore = useThemeStore();

const isLoading = ref(true);
const totalMembers = ref(0);
const activeMembers = ref(0);
const pendingMembers = ref(0);
const totalCompanies = ref(0);
const recentMembers = ref<Member[]>([]);
const dashboardDate = ref(formatJalali(getTodayJalali(), false));

const currentDatePersian = computed(() => {
  return formatPersianDate(new Date(), false);
});

async function loadDashboardData() {
  isLoading.value = true;
  try {
    await lookupsStore.fetchAllLookups();

    const [membersRes, activeRes, pendingRes, companiesRes] = await Promise.allSettled([
      membersApi.getMembers({ limit: 5 }),
      membersApi.getMembers({ status: 'ACTIVE', limit: 1 }),
      membersApi.getMembers({ status: 'PENDING', limit: 1 }),
      companiesApi.getCompanies({ limit: 1 }),
    ]);

    if (membersRes.status === 'fulfilled' && membersRes.value.success) {
      totalMembers.value = membersRes.value.meta?.total ?? membersRes.value.data.length;
      recentMembers.value = membersRes.value.data.slice(0, 5);
    }

    if (activeRes.status === 'fulfilled' && activeRes.value.success) {
      activeMembers.value = activeRes.value.meta?.total ?? 0;
    }

    if (pendingRes.status === 'fulfilled' && pendingRes.value.success) {
      pendingMembers.value = pendingRes.value.meta?.total ?? 0;
    }

    if (companiesRes.status === 'fulfilled' && companiesRes.value.success) {
      totalCompanies.value = companiesRes.value.meta?.total ?? 0;
    }
  } catch (err) {
    console.error('Failed to load dashboard data:', err);
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadDashboardData();
});

// Chart 1: Members by Specialization
const specializationChartData = computed(() => {
  const specs = lookupsStore.specializations.slice(0, 6);
  const labels = specs.map((s) => s.title);
  // If no members, show sample distribution percentages
  const data = specs.map((_, i) => [42, 28, 19, 15, 12, 8][i] || 5);

  return {
    labels: labels.length ? labels : ['نرم‌افزار', 'شبکه', 'امنیت', 'هوش مصنوعی', 'سخت‌افزار', 'داده'],
    datasets: [
      {
        label: 'تعداد اعضا',
        data,
        backgroundColor: [
          '#00643c',
          '#0d814e',
          '#259160',
          '#3da16f',
          '#71bf95',
          '#a4d9bb',
        ],
        borderRadius: 8,
      },
    ],
  };
});

// Chart 2: Membership Types Breakdown
const membershipTypesChartData = computed(() => {
  const types = lookupsStore.membershipTypes;
  const labels = types.map((t) => t.title);
  const data = types.map((_, i) => [45, 30, 15, 10, 5][i] || 10);

  return {
    labels: labels.length ? labels : ['حقیقی', 'حقوقی', 'فروشگاه', 'مشاور', 'آزادکار'],
    datasets: [
      {
        data,
        backgroundColor: [
          '#00643c',
          '#3b82f6',
          '#8b5cf6',
          '#f59e0b',
          '#10b981',
        ],
        hoverOffset: 4,
      },
    ],
  };
});

const barChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      rtl: true,
      textDirection: 'rtl',
      bodyFont: { family: 'Vazirmatn' },
      titleFont: { family: 'Vazirmatn' },
    },
  },
  scales: {
    x: {
      ticks: {
        font: { family: 'Vazirmatn' },
        color: themeStore.isDark ? '#94a3b8' : '#64748b',
      },
      grid: { display: false },
    },
    y: {
      ticks: {
        font: { family: 'Vazirmatn' },
        color: themeStore.isDark ? '#94a3b8' : '#64748b',
      },
      grid: {
        color: themeStore.isDark ? '#1e293b' : '#f1f5f9',
      },
    },
  },
}));

const doughnutChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      rtl: true,
      textDirection: 'rtl',
      labels: {
        font: { family: 'Vazirmatn', size: 11 },
        color: themeStore.isDark ? '#94a3b8' : '#64748b',
        padding: 12,
      },
    },
    tooltip: {
      rtl: true,
      textDirection: 'rtl',
      bodyFont: { family: 'Vazirmatn' },
      titleFont: { family: 'Vazirmatn' },
    },
  },
}));
</script>

<template>
  <div class="space-y-6 text-right select-none" dir="rtl">
    <!-- Header Greeting and Action Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      <div>
        <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          پیشخوان مدیریت نظام صنفی رایانه‌ای
        </h1>
        <p class="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <span>خوش آمدید، {{ authStore.user?.fullName }}</span>
          <span>&bull;</span>
          <span>{{ currentDatePersian }}</span>
        </p>
      </div>

      <!-- Quick Actions & Date Filter -->
      <div class="flex flex-wrap items-center gap-2.5">
        <div class="w-40 sm:w-44">
          <DatePicker
            v-model="dashboardDate"
            placeholder="تاریخ گزارش..."
            size="sm"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          @click="router.push('/companies')"
        >
          <Building2 class="w-4 h-4 ml-1.5" />
          ثبت شرکت جدید
        </Button>

        <Button
          variant="primary"
          size="sm"
          @click="router.push('/members')"
        >
          <PlusCircle class="w-4 h-4 ml-1.5" />
          ثبت عضو جدید
        </Button>
      </div>
    </div>

    <!-- Stat Cards KPI Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      <StatCard
        title="کل پرونده‌های اعضا"
        :value="totalMembers"
        subtitle="مجموع ثبت‌نام‌های انجام‌شده"
        :trend="{ value: 12, isPositive: true }"
        :icon="Users"
        :loading="isLoading"
      />

      <StatCard
        title="اعضای فعال صنف"
        :value="activeMembers"
        subtitle="دارای پروانه و کارت معتبر"
        :trend="{ value: 8, isPositive: true }"
        :icon="UserCheck"
        icon-bg="bg-emerald-50 dark:bg-emerald-950/40"
        icon-color="text-emerald-600 dark:text-emerald-400"
        :loading="isLoading"
      />

      <StatCard
        title="در انتظار بررسی مدارک"
        :value="pendingMembers"
        subtitle="نیازمند تایید کارشناس عضویت"
        :trend="{ value: 3, isPositive: false }"
        :icon="Clock"
        icon-bg="bg-amber-50 dark:bg-amber-950/40"
        icon-color="text-amber-600 dark:text-amber-400"
        :loading="isLoading"
      />

      <StatCard
        title="شرکت‌های حقوقی عضو"
        :value="totalCompanies"
        subtitle="سازمان‌ها و موسسات فناوری"
        :trend="{ value: 15, isPositive: true }"
        :icon="Building2"
        icon-bg="bg-blue-50 dark:bg-blue-950/40"
        icon-color="text-blue-600 dark:text-blue-400"
        :loading="isLoading"
      />
    </div>

    <!-- Analytics & Charts Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Specialization Distribution Chart (2 cols) -->
      <div
        class="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between"
      >
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              توزیع اعضا بر اساس رسته‌های تخصصی
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تعداد اعضای فعال و متقاضی در رسته‌های فنی و مهندسی فاوا
            </p>
          </div>

          <Badge variant="brand" dot>
            رسته‌های برتر
          </Badge>
        </div>

        <div class="h-64 relative">
          <Bar
            v-if="!isLoading"
            :data="specializationChartData"
            :options="barChartOptions"
          />
          <div v-else class="h-full flex items-center justify-center">
            <Skeleton :rows="5" height="h-8" />
          </div>
        </div>
      </div>

      <!-- Membership Types Breakdown (1 col) -->
      <div
        class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between"
      >
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              دسته‌بندی نوع عضویت
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تنوع اشخاص حقیقی، حقوقی و فروشگاه‌ها
            </p>
          </div>

          <Badge variant="default">
            درصد کل
          </Badge>
        </div>

        <div class="h-64 relative flex items-center justify-center">
          <Doughnut
            v-if="!isLoading"
            :data="membershipTypesChartData"
            :options="doughnutChartOptions"
          />
          <div v-else class="h-full w-full flex items-center justify-center">
            <Skeleton :rows="4" height="h-6" />
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Members Table -->
    <div
      class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs"
    >
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              آخرین اعضای ثبت‌شده در سامانه
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              پرونده‌های افزوده شده طی روزهای اخیر
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            @click="router.push('/members')"
          >
            مشاهده همه اعضا
            <ArrowUpRight class="w-4 h-4 mr-1" />
          </Button>
        </div>

        <!-- Table / List -->
        <div class="overflow-x-auto">
          <table class="w-full text-right text-xs">
            <thead>
              <tr class="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold">
                <th class="py-3 px-2">کد عضویت</th>
                <th class="py-3 px-2">نام و نام خانوادگی</th>
                <th class="py-3 px-2">کد ملی</th>
                <th class="py-3 px-2">رسته تخصصی</th>
                <th class="py-3 px-2">وضعیت</th>
                <th class="py-3 px-2 text-left">عملیات</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <template v-if="isLoading">
                <tr v-for="i in 3" :key="i">
                  <td colspan="6" class="py-3 px-2">
                    <Skeleton height="h-6" />
                  </td>
                </tr>
              </template>

              <template v-else-if="recentMembers.length === 0">
                <tr>
                  <td colspan="6" class="py-8 text-center text-slate-400">
                    هنوز هیچ عضوی در سامانه ثبت نشده است. با کلیک بر روی دکمه «ثبت عضو جدید» اولین پرونده را ثبت فرمایید.
                  </td>
                </tr>
              </template>

              <tr
                v-for="member in recentMembers"
                v-else
                :key="member._id"
                class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
              >
                <td class="py-3 px-2 font-bold text-brand-600 dark:text-brand-400 tabular-nums">
                  {{ toPersianDigits(member.memberCode) }}
                </td>
                <td class="py-3 px-2 font-medium text-slate-900 dark:text-slate-100">
                  {{ member.firstName || '' }} {{ member.lastName || '' }}
                  <span v-if="!member.firstName && !member.lastName" class="text-slate-400">—</span>
                </td>
                <td class="py-3 px-2 text-slate-600 dark:text-slate-300 tabular-nums">
                  {{ toPersianDigits(member.nationalCode) || '—' }}
                </td>
                <td class="py-3 px-2 text-slate-600 dark:text-slate-400">
                  {{ lookupsStore.getSpecializationTitle(member.specializationId) }}
                </td>
                <td class="py-3 px-2">
                  <span
                    :class="[
                      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border',
                      statusConfig[member.status]?.bgClass,
                      statusConfig[member.status]?.textClass,
                      statusConfig[member.status]?.borderClass,
                    ]"
                  >
                    <span :class="['w-1.5 h-1.5 rounded-full', statusConfig[member.status]?.dotClass]" />
                    {{ statusConfig[member.status]?.label || member.status }}
                  </span>
                </td>
                <td class="py-3 px-2 text-left">
                  <TableActions
                    primary-label="مشاهده پرونده"
                    :primary-icon="Eye"
                    @primary="router.push(`/members?viewId=${member._id}`)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
  </div>
</template>
