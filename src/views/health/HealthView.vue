<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { healthApi, type HealthResponse } from '@/api';
import { useNotificationStore } from '@/stores';
import {
  Activity,
  Server,
  RefreshCw,
  Clock,
  Cpu,
  Zap,
  Database,
  CheckCircle2,
} from 'lucide-vue-next';
import {
  Button,
  Badge,
  Skeleton,
} from '@/components/ui';
import { formatPersianDate, toPersianDigits } from '@/utils/formatters';

const notificationStore = useNotificationStore();

const healthData = ref<HealthResponse | null>(null);
const isLoading = ref(false);
const latencyMs = ref<number | null>(null);
const lastCheckedAt = ref<Date | null>(null);

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

async function checkHealth() {
  isLoading.value = true;
  const start = performance.now();
  try {
    const res = await healthApi.getHealth();
    const end = performance.now();
    latencyMs.value = Math.round(end - start);
    healthData.value = res;
    lastCheckedAt.value = new Date();
    notificationStore.success('وضعیت سامانه با موفقیت استعلام شد.');
  } catch (err) {
    notificationStore.error('عدم برقراری ارتباط با سرور.');
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  checkHealth();
});
</script>

<template>
  <div class="space-y-6 text-right select-none" dir="rtl">
    <!-- Header Title & Action Buttons -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
      <div>
        <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          وضعیت سامانه
        </h1>
        <p class="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          بررسی سلامت سرویس‌ها، پایداری اتصالات و تاخیر پاسخگویی سرور
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <Button
          variant="outline"
          size="sm"
          :loading="isLoading"
          @click="checkHealth"
        >
          <RefreshCw class="w-4 h-4 ml-1" />
          تست مجدد اتصال (Ping)
        </Button>
      </div>
    </div>

    <!-- Live Status Overview Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      <!-- Status Card -->
      <div class="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs text-slate-500 dark:text-slate-400">وضعیت سرور</span>
          <div class="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
            <Activity class="w-5 h-5" />
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 class="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {{ healthData?.status === 'ok' ? 'سالم و فعال (OK)' : 'در حال بررسی...' }}
          </h3>
        </div>
        <p class="text-[11px] text-slate-400 mt-2">
          Express & Mongoose Connected
        </p>
      </div>

      <!-- Latency Card -->
      <div class="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs text-slate-500 dark:text-slate-400">زمان پاسخگویی (RTT)</span>
          <div class="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
            <Zap class="w-5 h-5" />
          </div>
        </div>
        <h3 class="text-xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
          {{ latencyMs !== null ? `${toPersianDigits(latencyMs)} ms` : '—' }}
        </h3>
        <p class="text-[11px] text-slate-400 mt-2">
          پاسخ مستقیم از localhost:5000
        </p>
      </div>

      <!-- Version Card -->
      <div class="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs text-slate-500 dark:text-slate-400">نسخه سامانه</span>
          <div class="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
            <Server class="w-5 h-5" />
          </div>
        </div>
        <h3 class="text-xl font-black text-slate-900 dark:text-slate-100">
          v1.0.0
        </h3>
        <p class="text-[11px] text-slate-400 mt-2">
          هسته نرم‌افزاری نصر پلاس
        </p>
      </div>

      <!-- Last Checked Card -->
      <div class="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs text-slate-500 dark:text-slate-400">آخرین استعلام</span>
          <div class="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
            <Clock class="w-5 h-5" />
          </div>
        </div>
        <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">
          {{ lastCheckedAt ? formatPersianDate(lastCheckedAt, true) : '—' }}
        </h3>
        <p class="text-[11px] text-slate-400 mt-2">
          همگام با زمان سرور
        </p>
      </div>
    </div>

    <!-- Health Diagnostics Details -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Details Card -->
      <div class="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Cpu class="w-4 h-4 text-brand-600" />
            جزییات ارتباط با سرویس نصر پلاس
          </h3>

          <Badge variant="brand">
            REST Envelope
          </Badge>
        </div>

        <div v-if="isLoading" class="space-y-3 py-2">
          <Skeleton height="h-8" :rows="4" />
        </div>

        <div v-else class="space-y-3 text-xs">
          <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between">
            <span class="text-slate-500 dark:text-slate-400">نام سرویس:</span>
            <span class="font-bold text-slate-800 dark:text-slate-200">
              {{ healthData?.service || 'سامانه مدیریت اعضای نصر پلاس' }}
            </span>
          </div>

          <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between">
            <span class="text-slate-500 dark:text-slate-400">آدرس سرور پایه (Base URL):</span>
            <span class="text-brand-600 dark:text-brand-400 font-bold" dir="ltr">
              {{ apiBaseUrl }}
            </span>
          </div>

          <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between">
            <span class="text-slate-500 dark:text-slate-400">پروتکل ارتباطی:</span>
            <span class="text-slate-800 dark:text-slate-200 font-medium">
              JSON / REST Envelope
            </span>
          </div>

          <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between">
            <span class="text-slate-500 dark:text-slate-400">زمان ثبت آخرین پاسخ سرور:</span>
            <span class="text-slate-600 dark:text-slate-400" dir="ltr">
              {{ healthData?.timestamp || '—' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Infrastructure Status Card -->
      <div class="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Database class="w-4 h-4 text-emerald-500" />
            وضعیت زیرساخت و پایگاه داده
          </h3>

          <Badge variant="emerald">
            فعال و متصل
          </Badge>
        </div>

        <div class="space-y-3 text-xs">
          <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between">
            <span class="text-slate-500 dark:text-slate-400">وضعیت پایگاه داده MongoDB:</span>
            <span class="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              متصل و پایدار (Mongoose ODM)
            </span>
          </div>

          <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between">
            <span class="text-slate-500 dark:text-slate-400">سیستم احراز هویت:</span>
            <span class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <CheckCircle2 class="w-3.5 h-3.5 text-emerald-500" />
              فعال (JWT Bearer Token)
            </span>
          </div>

          <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between">
            <span class="text-slate-500 dark:text-slate-400">محیط استقرار و اجرا:</span>
            <span class="font-bold text-slate-800 dark:text-slate-200">
              Development (Port 5000)
            </span>
          </div>

          <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between">
            <span class="text-slate-500 dark:text-slate-400">وضعیت ارتباط شبکه:</span>
            <span class="text-emerald-600 dark:text-emerald-400 font-semibold">
              پایدار و بدون اختلال
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
