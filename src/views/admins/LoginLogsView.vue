<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { adminsApi } from '@/api';
import { useNotificationStore } from '@/stores';
import type { AdminLoginLog, AdminType } from '@/types';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Filter,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  ArrowRight,
} from 'lucide-vue-next';
import {
  Button,
  Input,
  Select,
  DatePicker,
  Badge,
  EmptyState,
  Skeleton,
  Pagination,
} from '@/components/ui';
import { formatPersianDateTime, toPersianDigits } from '@/utils/formatters';
import { extractErrorMessage } from '@/utils/errors';

interface Props {
  embedded?: boolean;
  filterAdminId?: string;
  filterUsername?: string;
}

const props = withDefaults(defineProps<Props>(), {
  embedded: false,
  filterAdminId: '',
  filterUsername: '',
});

const route = useRoute();
const router = useRouter();
const notificationStore = useNotificationStore();

const logs = ref<AdminLoginLog[]>([]);
const isLoading = ref(false);

// Filter States
const search = ref('');
const selectedAdminType = ref<string>('');
const selectedStatus = ref<string>('');
const startDate = ref('');
const endDate = ref('');
const targetAdminId = ref<string>(props.filterAdminId || '');
const targetUsername = ref<string>(props.filterUsername || '');

// Pagination
const currentPage = ref(1);
const pageSize = ref(20);
const totalRecords = ref(0);
const totalPages = ref(1);

// Copied IP state
const copiedIpId = ref<string | null>(null);

const roleFilterOptions = [
  { label: 'همه نقش‌ها', value: '' },
  { label: 'مدیر ارشد سامانه (SUPERADMIN)', value: 'SUPERADMIN' },
  { label: 'مدیر سامانه (ADMIN)', value: 'ADMIN' },
  { label: 'کارشناس بررسی پرونده (EXPERT)', value: 'EXPERT' },
];

const statusFilterOptions = [
  { label: 'همه وضعیت‌ها', value: '' },
  { label: 'ورود موفق (SUCCESS)', value: 'SUCCESS' },
  { label: 'ورود ناموفق (FAILED)', value: 'FAILED' },
];

async function fetchLogs() {
  isLoading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value,
    };

    if (search.value.trim()) {
      params.search = search.value.trim();
    }
    if (selectedAdminType.value) {
      params.adminType = selectedAdminType.value as AdminType;
    }
    if (selectedStatus.value) {
      params.status = selectedStatus.value as 'SUCCESS' | 'FAILED';
    }
    if (startDate.value) {
      params.startDate = new Date(startDate.value).toISOString();
    }
    if (endDate.value) {
      const end = new Date(endDate.value);
      end.setHours(23, 59, 59, 999);
      params.endDate = end.toISOString();
    }
    const cleanAdminId = targetAdminId.value ? targetAdminId.value.trim() : '';
    if (cleanAdminId) {
      if (/^[0-9a-fA-F]{24}$/.test(cleanAdminId)) {
        params.adminId = cleanAdminId;
      } else if (!targetUsername.value) {
        params.username = cleanAdminId;
      }
    }
    if (targetUsername.value && targetUsername.value.trim()) {
      params.username = targetUsername.value.trim();
    }

    const res = await adminsApi.getLoginLogs(params);
    if (res.success && res.data) {
      logs.value = res.data.logs || [];
      totalRecords.value = res.data.pagination?.total || 0;
      totalPages.value = res.data.pagination?.totalPages || 1;
    } else {
      logs.value = [];
      totalRecords.value = 0;
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در بارگذاری لاگ‌های ورود به سیستم'));
    logs.value = [];
  } finally {
    isLoading.value = false;
  }
}

function handleSearch() {
  currentPage.value = 1;
  fetchLogs();
}

function resetFilters() {
  search.value = '';
  selectedAdminType.value = '';
  selectedStatus.value = '';
  startDate.value = '';
  endDate.value = '';
  targetAdminId.value = '';
  targetUsername.value = '';
  currentPage.value = 1;
  fetchLogs();
}

function copyToClipboard(text?: string, id?: string) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    copiedIpId.value = id || text;
    notificationStore.success(`آدرس IP (${text}) در حافظه کپی شد.`);
    setTimeout(() => {
      if (copiedIpId.value === (id || text)) {
        copiedIpId.value = null;
      }
    }, 2500);
  });
}

function getDeviceIcon(device?: string) {
  const d = (device || '').toLowerCase();
  if (d.includes('mobile') || d.includes('phone')) return Smartphone;
  if (d.includes('tablet') || d.includes('ipad')) return Tablet;
  return Monitor;
}

function getDeviceLabel(device?: string): string {
  const d = (device || '').toLowerCase();
  if (d.includes('mobile') || d.includes('phone')) return 'موبایل';
  if (d.includes('tablet') || d.includes('ipad')) return 'تبلت';
  if (d.includes('desktop')) return 'رایانه دسکتاپ';
  return device || 'نامشخص';
}

function getFailureReasonLabel(reason?: string): string {
  if (!reason) return 'دلیل خطا ثبت نشده است';
  const lower = reason.toLowerCase();
  if (lower.includes('password') || lower.includes('invalid password')) return 'کلمه عبور اشتباه است';
  if (lower.includes('disabled') || lower.includes('inactive')) return 'حساب کاربری غیرفعال است';
  if (lower.includes('not found') || lower.includes('user not found')) return 'کاربری با این مشخصات یافت نشد';
  return reason;
}

function resolveAdminName(log: AdminLoginLog): string {
  if (log.fullName) return log.fullName;
  if (log.adminId && typeof log.adminId === 'object' && log.adminId.fullName) {
    return log.adminId.fullName;
  }
  return log.username;
}

function resolveAdminRole(log: AdminLoginLog): AdminType | undefined {
  if (log.adminType) return log.adminType;
  if (log.adminId && typeof log.adminId === 'object' && log.adminId.type) {
    return log.adminId.type;
  }
  return undefined;
}

watch(
  () => [props.filterAdminId, props.filterUsername],
  ([newId, newUsername]) => {
    if (newId !== undefined) targetAdminId.value = newId;
    if (newUsername !== undefined) targetUsername.value = newUsername;
    currentPage.value = 1;
    fetchLogs();
  }
);

onMounted(() => {
  // If query parameters exist in URL
  if (route.query.adminId) {
    const qAdminId = String(route.query.adminId).trim();
    if (/^[0-9a-fA-F]{24}$/.test(qAdminId)) {
      targetAdminId.value = qAdminId;
    } else {
      targetUsername.value = qAdminId;
    }
  }
  if (route.query.username) {
    targetUsername.value = String(route.query.username).trim();
  }
  if (route.query.status) {
    selectedStatus.value = String(route.query.status).trim();
  }
  fetchLogs();
});

defineExpose({
  fetchLogs,
  totalRecords,
  isLoading,
});
</script>

<template>
  <div class="space-y-6 text-right select-none" dir="rtl">
    <!-- Header Title & Action Buttons (Hidden if embedded) -->
    <div v-if="!embedded" class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
      <div>
        <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
          <ShieldAlert class="w-6 h-6 text-brand-600" />
          <span>لاگ‌های ورود به سیستم</span>
          <span class="text-xs px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 font-bold border border-brand-200 dark:border-brand-800">
            ممیزی امنیتی
          </span>
        </h1>
        <p class="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          ثبت جامع نشست‌های ورود موفق و ناموفق مدیران و کارشناسان سامانه به همراه مشخصات IP، دستگاه و مرورگر
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <Button
          variant="outline"
          size="sm"
          :loading="isLoading"
          title="تازه‌سازی فهرست لاگ‌ها"
          @click="fetchLogs"
        >
          <RefreshCw class="w-4 h-4 ml-1" />
          تازه‌سازی
        </Button>

        <Button
          v-if="route.path !== '/admin/admins'"
          variant="secondary"
          size="sm"
          @click="router.push('/admin/admins')"
        >
          <ArrowRight class="w-4 h-4 ml-1" />
          بازگشت به مدیریت مدیران
        </Button>
      </div>
    </div>

    <!-- Active Filter Banner (When filtering by specific admin) -->
    <div
      v-if="targetAdminId || targetUsername"
      class="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between text-xs"
    >
      <div class="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-medium">
        <Filter class="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          نمایش فیلتر شده لاگ‌های ورود مربوط به کاربر:
          <strong class="font-bold underline" dir="ltr">{{ targetUsername || targetAdminId }}</strong>
        </span>
      </div>
      <button
        type="button"
        class="text-xs text-amber-700 dark:text-amber-300 hover:underline font-bold cursor-pointer"
        @click="targetAdminId = ''; targetUsername = ''; fetchLogs()"
      >
        حذف این فیلتر
      </button>
    </div>

    <!-- Filter Bar Controls -->
    <div
      class="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3"
    >
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
        <!-- 1. Text Search Input -->
        <Input
          v-model="search"
          placeholder="جستجو در کاربر، IP، سیستم‌عامل، مرورگر..."
          @keydown.enter="handleSearch"
        >
          <template #prefix>
            <Search class="w-4 h-4 text-slate-400" />
          </template>
        </Input>

        <!-- 2. Role Dropdown -->
        <Select
          v-model="selectedAdminType"
          :options="roleFilterOptions"
          placeholder="فیلتر بر اساس نقش..."
          @update:model-value="handleSearch"
        />

        <!-- 3. Status Dropdown -->
        <Select
          v-model="selectedStatus"
          :options="statusFilterOptions"
          placeholder="فیلتر بر اساس وضعیت ورود..."
          @update:model-value="handleSearch"
        />

        <!-- 4. Date From (Jalali DatePicker) -->
        <DatePicker
          v-model="startDate"
          placeholder="از تاریخ ورود..."
          output-format="iso"
          @change="handleSearch"
        />

        <!-- 5. Date To (Jalali DatePicker) -->
        <DatePicker
          v-model="endDate"
          placeholder="تا تاریخ ورود..."
          output-format="iso"
          @change="handleSearch"
        />
      </div>

      <!-- Action Buttons Row -->
      <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <span>
            تعداد کل لاگ‌های ثبت‌شده:
            <strong class="text-slate-900 dark:text-slate-100 font-bold tabular-nums">
              {{ toPersianDigits(totalRecords) }}
            </strong>
            مورد
          </span>
          <span class="text-slate-300 dark:text-slate-700">&bull;</span>
          <span>
            صفحه <strong class="tabular-nums">{{ toPersianDigits(currentPage) }}</strong> از <strong class="tabular-nums">{{ toPersianDigits(totalPages) }}</strong>
          </span>
        </div>

        <div class="flex items-center gap-2">
          <Button
            v-if="search || selectedAdminType || selectedStatus || startDate || endDate || targetAdminId || targetUsername"
            variant="ghost"
            size="sm"
            class="text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            @click="resetFilters"
          >
            پاکسازی همه فیلترها
          </Button>

          <Button
            variant="primary"
            size="sm"
            :loading="isLoading"
            @click="handleSearch"
          >
            اعمال فیلترها
          </Button>
        </div>
      </div>
    </div>

    <!-- Logs Data Table Container -->
    <div
      class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-right text-xs">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
              <th class="py-3.5 px-4">زمان ثبت ورود</th>
              <th class="py-3.5 px-4">مشخصات کاربر</th>
              <th class="py-3.5 px-4">آدرس IP کلاینت</th>
              <th class="py-3.5 px-4">دستگاه و سیستم‌عامل</th>
              <th class="py-3.5 px-4">مرورگر و نسخه</th>
              <th class="py-3.5 px-4 text-center">نتیجه ورود</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-100 dark:divide-slate-800/80">
            <!-- Loading Skeleton -->
            <template v-if="isLoading">
              <tr v-for="i in 5" :key="i">
                <td colspan="6" class="py-4 px-4">
                  <Skeleton height="h-6" />
                </td>
              </tr>
            </template>

            <!-- Empty State -->
            <template v-else-if="logs.length === 0">
              <tr>
                <td colspan="6" class="py-12">
                  <EmptyState
                    title="هیچ لاگ ورودی یافت نشد"
                    description="با فیلترهای انتخابی یا بازه زمانی مشخص‌شده، رکوردی در سیستم ثبت نشده است."
                    :icon="ShieldAlert"
                  >
                    <template #actions>
                      <Button variant="outline" size="sm" @click="resetFilters">
                        بازنشانی فیلترها
                      </Button>
                    </template>
                  </EmptyState>
                </td>
              </tr>
            </template>

            <!-- Table Rows -->
            <tr
              v-for="log in logs"
              v-else
              :key="log._id"
              class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
            >
              <!-- 1. Timestamp -->
              <td class="py-3.5 px-4 font-mono tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                <div class="flex items-center gap-1.5">
                  <Clock class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{{ formatPersianDateTime(log.loginAt || log.createdAt) }}</span>
                </div>
              </td>

              <!-- 2. User Info -->
              <td class="py-3.5 px-4">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-slate-900 dark:text-slate-100">
                      {{ resolveAdminName(log) }}
                    </span>
                    <!-- Role Badge -->
                    <Badge
                      v-if="resolveAdminRole(log) === 'SUPERADMIN'"
                      variant="purple"
                      size="sm"
                    >
                      مدیر ارشد
                    </Badge>
                    <Badge
                      v-else-if="resolveAdminRole(log) === 'ADMIN'"
                      variant="blue"
                      size="sm"
                    >
                      مدیر سامانه
                    </Badge>
                    <Badge
                      v-else-if="resolveAdminRole(log) === 'EXPERT'"
                      variant="emerald"
                      size="sm"
                    >
                      کارشناس
                    </Badge>
                  </div>
                  <div class="text-[11px] font-mono text-slate-400 text-left" dir="ltr">
                    {{ log.username }}
                  </div>
                </div>
              </td>

              <!-- 3. Client IP with Quick Copy -->
              <td class="py-3.5 px-4">
                <div class="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200">
                  <span dir="ltr">{{ log.ip || '—' }}</span>
                  <button
                    v-if="log.ip"
                    type="button"
                    class="p-0.5 rounded text-slate-400 hover:text-brand-600 transition-colors cursor-pointer"
                    title="کپی آدرس IP"
                    @click="copyToClipboard(log.ip, log._id)"
                  >
                    <Check v-if="copiedIpId === log._id" class="w-3 h-3 text-emerald-600" />
                    <Copy v-else class="w-3 h-3" />
                  </button>
                </div>
              </td>

              <!-- 4. Device & OS -->
              <td class="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                <div class="flex items-center gap-2">
                  <component
                    :is="getDeviceIcon(log.device)"
                    class="w-4 h-4 text-slate-500 shrink-0"
                  />
                  <div class="truncate">
                    <span class="font-medium">{{ getDeviceLabel(log.device) }}</span>
                    <span v-if="log.os" class="text-slate-400 text-[11px] mr-1.5" dir="ltr">
                      ({{ log.os }})
                    </span>
                  </div>
                </div>
              </td>

              <!-- 5. Browser -->
              <td class="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                <div class="flex items-center gap-1.5">
                  <Globe class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span class="font-mono text-[11px]" dir="ltr">{{ log.browser || 'نامشخص' }}</span>
                </div>
              </td>

              <!-- 6. Status Badge & Failure Reason -->
              <td class="py-3.5 px-4 text-center">
                <div class="inline-flex flex-col items-center">
                  <span
                    v-if="log.status === 'SUCCESS'"
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  >
                    <CheckCircle2 class="w-3 h-3" />
                    ورود موفق
                  </span>
                  <div v-else class="space-y-0.5 text-center">
                    <span
                      class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                      :title="log.failureReason || 'خطا در احراز هویت'"
                    >
                      <XCircle class="w-3 h-3" />
                      ورود ناموفق
                    </span>
                    <p
                      v-if="log.failureReason"
                      class="text-[10px] text-rose-500 dark:text-rose-400 max-w-[160px] truncate"
                      :title="log.failureReason"
                    >
                      {{ getFailureReasonLabel(log.failureReason) }}
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div
        v-if="totalRecords > 0"
        class="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
      >
        <div class="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <span>
            نمایش ردیف‌های
            <strong class="font-bold tabular-nums">
              {{ toPersianDigits((currentPage - 1) * pageSize + 1) }}
            </strong>
            تا
            <strong class="font-bold tabular-nums">
              {{ toPersianDigits(Math.min(currentPage * pageSize, totalRecords)) }}
            </strong>
            از
            <strong class="font-bold tabular-nums">{{ toPersianDigits(totalRecords) }}</strong>
          </span>

          <div class="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-700" />

          <div class="flex items-center gap-1.5">
            <span>اندازه صفحه:</span>
            <select
              v-model.number="pageSize"
              class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs cursor-pointer focus:outline-none"
              @change="currentPage = 1; fetchLogs()"
            >
              <option :value="10">۱۰</option>
              <option :value="20">۲۰</option>
              <option :value="50">۵۰</option>
              <option :value="100">۱۰۰</option>
            </select>
          </div>
        </div>

        <Pagination
          v-if="totalPages > 1"
          :page="currentPage"
          :limit="pageSize"
          :total="totalRecords"
          @update:page="currentPage = $event; fetchLogs()"
        />
      </div>
    </div>
  </div>
</template>
