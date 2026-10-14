<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { membersApi } from '@/api';
import { useLookupsStore, useNotificationStore } from '@/stores';
import type {
  IImportPreviewResponse,
  IImportConfirmPayload,
  IImportExecutionResponse,
  IExcelColumnMapping,
} from '@/types';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Download,
  RefreshCw,
  FileText,
  Check,
  Info,
  Table as TableIcon,
  Layers,
  ArrowRight,
  X,
  Sliders,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-vue-next';
import { Button, Input, Select, Badge } from '@/components/ui';
import { toPersianDigits } from '@/utils/formatters';
import { extractErrorMessage } from '@/utils/errors';

interface Props {
  isModal?: boolean;
}

withDefaults(defineProps<Props>(), {
  isModal: false,
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'imported', result: IImportExecutionResponse): void;
}>();

const lookupsStore = useLookupsStore();
const notificationStore = useNotificationStore();

// Stepper navigation
type StepNumber = 1 | 2 | 3;
const currentStep = ref<StepNumber>(1);

const steps = [
  {
    step: 1,
    title: 'بارگذاری و تحلیل فایل',
    description: 'انتخاب فایل اکسل یا CSV و تحلیل ستون‌ها',
    icon: Upload,
  },
  {
    step: 2,
    title: 'پیکربندی و نگاشت ستون‌ها',
    description: 'تنظیم اطلاعات پیش‌فرض و انتساب فیلدها',
    icon: Sliders,
  },
  {
    step: 3,
    title: 'گزارش و نتایج ورود',
    description: 'مشاهده آمار ثبت و بررسی موارد رد شده',
    icon: CheckCircle2,
  },
];

// --- STEP 1: Upload & Preview State ---
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const isDragging = ref(false);
const isAnalyzing = ref(false);
const fileError = ref<string>('');
const previewData = ref<IImportPreviewResponse | null>(null);

// --- STEP 2: Configuration & Mapping State ---
const selectedSheet = ref<string>('');
const startRow = ref<number>(2);
const natureOfMembership = ref<string>('');
const membershipTypeId = ref<string>('');
const specializationId = ref<string>('');
const status = ref<'ACTIVE' | 'PENDING'>('ACTIVE');
const isSubmitting = ref(false);

const columnMapping = ref<IExcelColumnMapping>({
  memberCode: '',
  firstName: '',
  lastName: '',
  nationalCode: '',
  membershipDate: '',
  expiryDate: '',
  mobilePhone: '',
  email: '',
});

const mappingErrors = ref<Record<string, string>>({});

// --- STEP 3: Execution & Report State ---
const executionResult = ref<IImportExecutionResponse | null>(null);
const failedRowsSearch = ref('');
const isCopied = ref(false);
const showImportedList = ref(false);

// Field definitions for mapping
interface TargetFieldDef {
  key: keyof IExcelColumnMapping;
  label: string;
  required: boolean;
  description: string;
  badgeColor?: string;
}

const targetFields: TargetFieldDef[] = [
  {
    key: 'memberCode',
    label: 'کد عضویت صنف',
    required: true,
    description: 'شناسه یکتای پرونده عضویت (مثال: 1001 یا NSR-201045)',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  },
  {
    key: 'firstName',
    label: 'نام',
    required: false,
    description: 'نام کوچک عضو یا نماینده',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  {
    key: 'lastName',
    label: 'نام خانوادگی',
    required: false,
    description: 'نام خانوادگی شخص یا نام ثبتی کامل شرکت',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  },
  {
    key: 'nationalCode',
    label: 'کد ملی / شناسه ملی',
    required: false,
    description: 'کد ملی ۱۰ رقمی شخص یا شناسه ملی ۱۱ رقمی حقوقی',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  },
  {
    key: 'mobilePhone',
    label: 'شماره تلفن همراه',
    required: false,
    description: 'شماره همراه معتبر جهت پیامک و اطلاع‌رسانی',
    badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  },
  {
    key: 'email',
    label: 'پست الکترونیکی',
    required: false,
    description: 'آدرس ایمیل معتبر کاربر',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  },
  {
    key: 'membershipDate',
    label: 'تاریخ شروع عضویت',
    required: false,
    description: 'تاریخ عضویت شمسی یا میلادی (نظیر 1402/05/15)',
    badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  },
  {
    key: 'expiryDate',
    label: 'تاریخ پایان / انقضا',
    required: false,
    description: 'تاریخ اعتبار پرونده عضویت صنف',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  },
];

// Available column dropdown options
const excelColumnOptions = computed(() => {
  if (!previewData.value?.columns) return [];
  return previewData.value.columns.map((col) => ({
    label: `ستون ${col.key}${col.headerSample ? ` (${col.headerSample})` : ''}`,
    value: col.key,
  }));
});

const excelColumnOptionsWithEmpty = computed(() => {
  return [
    { label: '— عدم تخصیص (خالی) —', value: '' },
    ...excelColumnOptions.value,
  ];
});

// Dropdown options for lookups
const natureOptions = computed(() =>
  lookupsStore.natureOfMemberships.map((n) => ({
    label: n.title,
    value: n._id,
  }))
);

const membershipTypeOptions = computed(() =>
  lookupsStore.membershipTypes.map((m) => ({
    label: m.title + (m.code ? ` (${m.code})` : ''),
    value: m._id,
  }))
);

const specializationOptions = computed(() => [
  { label: '— عدم تعیین تخصص (اختیاری) —', value: '' },
  ...lookupsStore.specializations.map((s) => ({
    label: s.title + (s.code ? ` (${s.code})` : ''),
    value: s._id,
  })),
]);

const statusOptions = [
  { label: 'فعال (ACTIVE)', value: 'ACTIVE' },
  { label: 'در انتظار تایید (PENDING)', value: 'PENDING' },
];

const sheetOptions = computed(() => {
  if (!previewData.value?.sheets?.length) return [];
  return previewData.value.sheets.map((sheet) => ({
    label: sheet,
    value: sheet,
  }));
});

// Mapping lookup helper to know which field is assigned to which column key
function getMappedFieldForColumn(colKey: string): TargetFieldDef | undefined {
  return targetFields.find((f) => columnMapping.value[f.key] === colKey);
}

// File Validation & Handling
const allowedExtensions = ['.xlsx', '.xls', '.csv'];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '۰ بایت';
  const k = 1024;
  const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = (bytes / Math.pow(k, i)).toFixed(1);
  return `${toPersianDigits(val)} ${sizes[i]}`;
}

function validateFile(file: File): boolean {
  fileError.value = '';
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();

  if (!allowedExtensions.includes(extension)) {
    fileError.value = `فرمت فایل انتخابی مجاز نیست. لطفاً یکی از پسوندهای ${allowedExtensions.join('، ')} را انتخاب نمایید.`;
    return false;
  }

  if (file.size > MAX_FILE_SIZE) {
    fileError.value = 'حجم فایل بیشتر از سقف مجاز (۱۵ مگابایت) است.';
    return false;
  }

  return true;
}

function handleFileInputChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file && validateFile(file)) {
    selectedFile.value = file;
  }
}

function triggerFileSelect() {
  fileInputRef.value?.click();
}

function handleDrop(event: DragEvent) {
  isDragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file && validateFile(file)) {
    selectedFile.value = file;
  }
}

function clearSelectedFile() {
  selectedFile.value = null;
  fileError.value = '';
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

// Step 1: Upload & Analyze API Call
async function analyzeFile() {
  if (!selectedFile.value) {
    fileError.value = 'لطفاً ابتدا فایل اکسل یا CSV را انتخاب کنید.';
    return;
  }

  isAnalyzing.value = true;
  fileError.value = '';

  try {
    const res = await membersApi.previewImport(selectedFile.value);
    if (res.success && res.data) {
      previewData.value = res.data;

      // Select sheet
      selectedSheet.value = res.data.selectedSheet || res.data.sheets?.[0] || '';
      startRow.value = 2;

      // Populate column mapping from suggestedMapping
      const suggested = res.data.suggestedMapping || {};
      columnMapping.value = {
        memberCode: suggested.memberCode || '',
        firstName: suggested.firstName || '',
        lastName: suggested.lastName || '',
        nationalCode: suggested.nationalCode || '',
        membershipDate: suggested.membershipDate || '',
        expiryDate: suggested.expiryDate || '',
        mobilePhone: suggested.mobilePhone || '',
        email: suggested.email || '',
      };

      // Ensure lookups are loaded
      await lookupsStore.fetchAllLookups();

      // Pre-fill fixed defaults if empty
      if (!natureOfMembership.value && lookupsStore.natureOfMemberships.length > 0) {
        natureOfMembership.value = lookupsStore.natureOfMemberships[0]._id;
      }
      if (!membershipTypeId.value && lookupsStore.membershipTypes.length > 0) {
        membershipTypeId.value = lookupsStore.membershipTypes[0]._id;
      }

      notificationStore.success('فایل با موفقیت بارگذاری و تحلیل شد.');
      currentStep.value = 2;
    } else {
      fileError.value = res.message || 'خطا در تحلیل ساختار فایل اکسل.';
    }
  } catch (err) {
    fileError.value = extractErrorMessage(err, 'خطا در بارگذاری و تحلیل فایل اکسل.');
  } finally {
    isAnalyzing.value = false;
  }
}

// Step 2: Validate and Confirm Import
function validateStep2(): boolean {
  mappingErrors.value = {};
  let isValid = true;

  if (!natureOfMembership.value) {
    mappingErrors.value.natureOfMembership = 'انتخاب ماهیت عضویت الزامی است.';
    isValid = false;
  }

  if (!membershipTypeId.value) {
    mappingErrors.value.membershipTypeId = 'انتخاب نوع عضویت الزامی است.';
    isValid = false;
  }

  if (!columnMapping.value.memberCode) {
    mappingErrors.value.memberCode = 'تخصیص ستون کد عضویت صنف اجباری است.';
    isValid = false;
  }

  if (!startRow.value || startRow.value < 1) {
    mappingErrors.value.startRow = 'شماره سطر شروع باید عددی مثبت و بزرگتر از ۰ باشد.';
    isValid = false;
  }

  return isValid;
}

async function confirmAndImport() {
  if (!previewData.value?.fileId) {
    notificationStore.error('شناسه فایل تحلیل‌شده یافت نشد. لطفاً مجدداً فایل را بارگذاری کنید.');
    currentStep.value = 1;
    return;
  }

  if (!validateStep2()) {
    notificationStore.error('لطفاً فیلدهای الزامی مشخص‌شده را تکمیل نمایید.');
    return;
  }

  isSubmitting.value = true;
  try {
    const payload: IImportConfirmPayload = {
      fileId: previewData.value.fileId,
      sheetName: selectedSheet.value || undefined,
      startRow: Number(startRow.value) || 2,
      fixedData: {
        natureOfMembership: natureOfMembership.value,
        membershipTypeId: membershipTypeId.value,
        specializationId: specializationId.value || undefined,
        status: status.value,
      },
      columnMapping: {
        memberCode: columnMapping.value.memberCode,
        ...(columnMapping.value.firstName ? { firstName: columnMapping.value.firstName } : {}),
        ...(columnMapping.value.lastName ? { lastName: columnMapping.value.lastName } : {}),
        ...(columnMapping.value.nationalCode ? { nationalCode: columnMapping.value.nationalCode } : {}),
        ...(columnMapping.value.membershipDate ? { membershipDate: columnMapping.value.membershipDate } : {}),
        ...(columnMapping.value.expiryDate ? { expiryDate: columnMapping.value.expiryDate } : {}),
        ...(columnMapping.value.mobilePhone ? { mobilePhone: columnMapping.value.mobilePhone } : {}),
        ...(columnMapping.value.email ? { email: columnMapping.value.email } : {}),
      },
    };

    const res = await membersApi.confirmImport(payload);
    if (res.success && res.data) {
      executionResult.value = res.data;
      currentStep.value = 3;

      if (res.data.summary.skippedCount === 0) {
        notificationStore.success(
          `تمامی ${toPersianDigits(res.data.summary.importedCount)} عضو با موفقیت ثبت شدند.`
        );
      } else {
        notificationStore.warning(
          `عملیات ورود انجام شد: ${toPersianDigits(res.data.summary.importedCount)} عضو ثبت شد، ${toPersianDigits(res.data.summary.skippedCount)} مورد خطا داشت.`
        );
      }

      emit('imported', res.data);
    } else {
      notificationStore.error(res.message || 'خطا در ثبت و ورود اعضا.');
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در اجرای فرآیند ورود اطلاعات اعضا.'));
  } finally {
    isSubmitting.value = false;
  }
}

// Step 3: Copy and Download features
const filteredFailedRows = computed(() => {
  if (!executionResult.value?.failedRows) return [];
  const q = failedRowsSearch.value.trim().toLowerCase();
  if (!q) return executionResult.value.failedRows;

  return executionResult.value.failedRows.filter((r) => {
    return (
      String(r.rowNumber).includes(q) ||
      (r.memberCode && r.memberCode.toLowerCase().includes(q)) ||
      (r.nationalCode && r.nationalCode.toLowerCase().includes(q)) ||
      (r.fullName && r.fullName.toLowerCase().includes(q)) ||
      (r.reason && r.reason.toLowerCase().includes(q))
    );
  });
});

async function copyFailedRows() {
  if (!executionResult.value?.failedRows.length) return;

  const header = ['شماره سطر', 'کد عضویت', 'کد ملی', 'نام و نام خانوادگی', 'علت عدم ثبت'].join('\t');
  const rows = executionResult.value.failedRows.map((f) =>
    [
      f.rowNumber,
      f.memberCode || '—',
      f.nationalCode || '—',
      f.fullName || '—',
      f.reason,
    ].join('\t')
  );

  const fullText = [header, ...rows].join('\n');

  try {
    await navigator.clipboard.writeText(fullText);
    isCopied.value = true;
    notificationStore.success('لیست خطاهای ردیف‌ها در کلیپ‌بورد کپی شد.');
    setTimeout(() => {
      isCopied.value = false;
    }, 3000);
  } catch {
    notificationStore.error('دسترسی به کلیپ‌بورد امکان‌پذیر نشد.');
  }
}

function downloadFailedRowsCsv() {
  if (!executionResult.value?.failedRows.length) return;

  const headers = ['شماره سطر', 'کد عضویت', 'کد ملی', 'نام و نام خانوادگی', 'علت عدم ثبت / خطا'];
  const rows = executionResult.value.failedRows.map((f) => [
    f.rowNumber,
    `"${(f.memberCode || '').replace(/"/g, '""')}"`,
    `"${(f.nationalCode || '').replace(/"/g, '""')}"`,
    `"${(f.fullName || '').replace(/"/g, '""')}"`,
    `"${(f.reason || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    '\uFEFF' +
    [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `failed_members_import_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  notificationStore.success('فایل خطاهای ورود با موفقیت دانلود شد.');
}

// Reset and restart wizard
function restartWizard() {
  selectedFile.value = null;
  fileError.value = '';
  previewData.value = null;
  executionResult.value = null;
  mappingErrors.value = {};
  failedRowsSearch.value = '';
  showImportedList.value = false;
  currentStep.value = 1;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

function finishAndClose() {
  emit('close');
}

onMounted(() => {
  lookupsStore.fetchAllLookups();
});
</script>

<template>
  <div class="flex flex-col space-y-6 text-right select-none" dir="rtl">
    <!-- Stepper Navigation Bar -->
    <div class="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div
          v-for="s in steps"
          :key="s.step"
          :class="[
            'flex items-center gap-3 p-3 rounded-xl transition-all',
            currentStep === s.step
              ? 'bg-white dark:bg-slate-800 shadow-xs border border-brand-200 dark:border-brand-800/60 ring-2 ring-brand-500/10'
              : currentStep > s.step
              ? 'bg-white/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              : 'opacity-50 border border-transparent text-slate-400 dark:text-slate-500',
          ]"
        >
          <div
            :class="[
              'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm transition-colors',
              currentStep === s.step
                ? 'bg-brand-600 text-white shadow-xs'
                : currentStep > s.step
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
            ]"
          >
            <Check v-if="currentStep > s.step" class="w-5 h-5" />
            <span v-else>{{ toPersianDigits(s.step) }}</span>
          </div>

          <div class="min-w-0 flex-1">
            <h4
              :class="[
                'text-xs font-bold truncate',
                currentStep === s.step
                  ? 'text-brand-900 dark:text-brand-100'
                  : 'text-slate-700 dark:text-slate-300',
              ]"
            >
              {{ s.title }}
            </h4>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {{ s.description }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== STEP 1: UPLOAD & PREVIEW ==================== -->
    <div v-if="currentStep === 1" class="space-y-6">
      <!-- Hidden file input -->
      <input
        ref="fileInputRef"
        type="file"
        accept=".xlsx,.xls,.csv"
        class="hidden"
        @change="handleFileInputChange"
      />

      <!-- Drag & Drop Zone -->
      <div
        :class="[
          'relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center',
          isDragging
            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20 scale-[0.99]'
            : selectedFile
            ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
            : 'border-slate-300 dark:border-slate-700 hover:border-brand-400 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/50',
        ]"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        @click="triggerFileSelect"
      >
        <div
          :class="[
            'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform',
            selectedFile
              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
              : 'bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400',
          ]"
        >
          <FileSpreadsheet v-if="selectedFile" class="w-8 h-8" />
          <Upload v-else class="w-8 h-8" />
        </div>

        <div v-if="!selectedFile">
          <h3 class="text-base font-bold text-slate-800 dark:text-slate-200">
            فایل اکسل اعضا را اینجا رها کنید، یا
            <span class="text-brand-600 dark:text-brand-400 underline underline-offset-4">انتخاب فایل از رایانه</span>
          </h3>
          <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">
            فرمت‌های مجاز: <span class="font-mono font-medium">xlsx.</span>، <span class="font-mono font-medium">xls.</span>، <span class="font-mono font-medium">csv.</span> (حداکثر ۱۵ مگابایت)
          </p>
        </div>

        <div v-else class="w-full max-w-md">
          <div class="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-xs">
            <div class="flex items-center gap-3 overflow-hidden text-right">
              <FileSpreadsheet class="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div class="truncate">
                <p class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate font-mono" dir="ltr">
                  {{ selectedFile.name }}
                </p>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  حجم فایل: {{ formatFileSize(selectedFile.size) }}
                </p>
              </div>
            </div>

            <button
              type="button"
              class="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
              title="حذف و انتخاب فایل دیگر"
              @click.stop="clearSelectedFile"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- File error alert -->
      <div
        v-if="fileError"
        class="flex items-start gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs"
      >
        <AlertTriangle class="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
        <div class="flex-1">
          <p class="font-bold">خطا در بررسی فایل</p>
          <p class="mt-1">{{ fileError }}</p>
        </div>
      </div>

      <!-- Import Guidelines & Tips -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div class="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs mb-1">
            <TableIcon class="w-4 h-4 text-brand-600 dark:text-brand-400" />
            سطر عناوین ستون‌ها
          </div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            ردیف اول فایل معمولاً شامل سرستون‌هاست. سامانه به‌طور خودکار ستون‌ها را پیشنهاد داده و سطر شروع داده‌ها را ۲ در نظر می‌گیرد.
          </p>
        </div>

        <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div class="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs mb-1">
            <Info class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            فرمت تاریخ و ارقام فارسی
          </div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            تاریخ‌های شمسی (مانند ۱۴۰۲/۰۵/۱۵ یا ۱۴۰۲۰۵۱۵)، ارقام فارسی و صفرهای اول کد ملی به‌صورت هوشمند و خودکار پالایش می‌شوند.
          </p>
        </div>

        <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div class="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs mb-1">
            <Layers class="w-4 h-4 text-amber-600 dark:text-amber-400" />
            عدم تکرار و اعتبارسنجی
          </div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            کد عضویت و کد ملی قبل از ذخیره نهایی بررسی شده و در صورت تکراری بودن در گام سوم همراه با علت دقیق گزارش می‌شوند.
          </p>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
        <Button
          variant="outline"
          size="sm"
          @click="emit('close')"
        >
          انصراف و بستن
        </Button>

        <Button
          variant="primary"
          size="sm"
          :disabled="!selectedFile"
          :loading="isAnalyzing"
          @click="analyzeFile"
        >
          <RefreshCw v-if="isAnalyzing" class="w-4 h-4 ml-1.5 animate-spin" />
          <Upload v-else class="w-4 h-4 ml-1.5" />
          تحلیل و پردازش اولیه فایل
        </Button>
      </div>
    </div>

    <!-- ==================== STEP 2: CONFIGURATION & MAPPING ==================== -->
    <div v-else-if="currentStep === 2 && previewData" class="space-y-6">
      <!-- File Overview Banner -->
      <div class="p-4 rounded-2xl bg-brand-50/60 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0">
            <FileSpreadsheet class="w-5 h-5" />
          </div>
          <div>
            <h4 class="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span class="font-mono text-xs" dir="ltr">{{ previewData.originalFilename }}</span>
              <Badge variant="emerald" size="sm">تحلیل موفق</Badge>
            </h4>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              تعداد کل سطرهای شناسایی‌شده:
              <strong class="text-brand-700 dark:text-brand-300">{{ toPersianDigits(previewData.totalRows) }}</strong> سطر
              | تعداد ستون‌ها:
              <strong class="text-brand-700 dark:text-brand-300">{{ toPersianDigits(previewData.columns.length) }}</strong> ستون
            </p>
          </div>
        </div>

        <!-- Sheet selection if multiple sheets exist -->
        <div v-if="previewData.sheets && previewData.sheets.length > 1" class="w-full sm:w-56 shrink-0">
          <Select
            v-model="selectedSheet"
            label="انتخاب شیت اکسل"
            :options="sheetOptions"
            size="sm"
          />
        </div>
      </div>

      <!-- SECTION 2.1: Fixed Default Inputs -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 flex items-center justify-center text-xs font-bold">۱</span>
            <h3 class="text-xs font-bold text-slate-900 dark:text-slate-100">
              مقادیر پیش‌فرض پرونده‌ها (تنظیمات سراسری)
            </h3>
          </div>
          <span class="text-[11px] text-slate-400 font-normal">این مقادیر به تمام ردیف‌های فایل اعمال می‌شوند</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Nature of Membership -->
          <Select
            v-model="natureOfMembership"
            label="ماهیت عضویت"
            placeholder="انتخاب ماهیت..."
            :options="natureOptions"
            :error="mappingErrors.natureOfMembership"
            required
          />

          <!-- Membership Type -->
          <Select
            v-model="membershipTypeId"
            label="نوع عضویت"
            placeholder="انتخاب نوع عضویت..."
            :options="membershipTypeOptions"
            :error="mappingErrors.membershipTypeId"
            required
          />

          <!-- Specialization (Optional) -->
          <Select
            v-model="specializationId"
            label="رسته / تخصص اصلی (اختیاری)"
            placeholder="انتخاب تخصص..."
            :options="specializationOptions"
            clearable
          />

          <!-- Status (Optional, default ACTIVE) -->
          <Select
            v-model="status"
            label="وضعیت اولیه اعضا"
            :options="statusOptions"
          />
        </div>

        <div class="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              شماره سطر شروع داده‌ها
              <span class="text-rose-500 font-bold">*</span>
            </label>
            <input
              v-model.number="startRow"
              type="number"
              min="1"
              :class="[
                'w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500',
                mappingErrors.startRow ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800',
              ]"
            />
            <p v-if="mappingErrors.startRow" class="mt-1 text-[11px] text-rose-500">
              {{ mappingErrors.startRow }}
            </p>
            <p v-else class="mt-1 text-[11px] text-slate-400">
              پیش‌فرض: ۲ (ردیف ۱ به عنوان سطر عنوان نادیده گرفته می‌شود)
            </p>
          </div>
        </div>
      </div>

      <!-- SECTION 2.2: Column Mapping -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 flex items-center justify-center text-xs font-bold">۲</span>
            <h3 class="text-xs font-bold text-slate-900 dark:text-slate-100">
              نگاشت ستون‌های اکسل به فیلدهای عضویت
            </h3>
          </div>
          <span class="text-[11px] text-slate-400 font-normal">فیلد کد عضویت اجباری است</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="field in targetFields"
            :key="field.key"
            class="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between"
          >
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {{ field.label }}
                  <span v-if="field.required" class="text-rose-500 font-bold">*</span>
                </span>
                <span
                  v-if="field.required"
                  class="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 font-medium"
                >
                  اجباری
                </span>
                <span
                  v-else
                  class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                >
                  اختیاری
                </span>
              </div>
              <p class="text-[10px] text-slate-400 dark:text-slate-500 mb-2 truncate" :title="field.description">
                {{ field.description }}
              </p>
            </div>

            <div>
              <Select
                v-model="columnMapping[field.key]"
                placeholder="انتخاب ستون اکسل..."
                :options="field.required ? excelColumnOptions : excelColumnOptionsWithEmpty"
                :error="mappingErrors[field.key]"
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION 2.3: Sample Preview Table -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 flex items-center justify-center text-xs font-bold">۳</span>
            <h3 class="text-xs font-bold text-slate-900 dark:text-slate-100">
              پیش‌نمایش داده‌های نمونه و نگاشت ستون‌ها (سطرهای اول)
            </h3>
          </div>
          <span class="text-[11px] text-slate-400 font-normal">جهت تطبیق و بررسی صحت ستون‌ها قبل از ثبت</span>
        </div>

        <div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table class="w-full text-right text-xs border-collapse">
            <thead>
              <tr class="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                <th class="py-2.5 px-3 whitespace-nowrap text-center w-16 border-l border-slate-200 dark:border-slate-800">
                  سطر
                </th>
                <th
                  v-for="col in previewData.columns"
                  :key="col.key"
                  class="py-2.5 px-3 whitespace-nowrap border-l last:border-l-0 border-slate-200 dark:border-slate-800"
                >
                  <div class="flex flex-col gap-1">
                    <div class="flex items-center justify-between gap-2">
                      <span class="font-mono text-brand-600 dark:text-brand-400 font-bold">ستون {{ col.key }}</span>
                      <span
                        v-if="getMappedFieldForColumn(col.key)"
                        :class="[
                          'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                          getMappedFieldForColumn(col.key)?.badgeColor || 'bg-brand-100 text-brand-800',
                        ]"
                      >
                        {{ getMappedFieldForColumn(col.key)?.label }}
                      </span>
                    </div>
                    <span v-if="col.headerSample" class="text-[11px] text-slate-500 font-normal truncate max-w-[120px]" :title="col.headerSample">
                      {{ col.headerSample }}
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              <tr
                v-for="(row, rIndex) in previewData.previewRows.slice(0, 5)"
                :key="String(row.rowNumber ?? rIndex)"
                :class="[
                  'hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors',
                  Number(row.rowNumber) < Number(startRow) ? 'bg-amber-50/30 dark:bg-amber-950/10 opacity-60' : '',
                ]"
              >
                <td class="py-2.5 px-3 text-center whitespace-nowrap font-mono text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30">
                  {{ toPersianDigits(String(row.rowNumber ?? rIndex + 1)) }}
                  <span v-if="Number(row.rowNumber) < Number(startRow)" class="block text-[9px] text-amber-600 dark:text-amber-400 font-bold">
                    (عنوان)
                  </span>
                </td>
                <td
                  v-for="col in previewData.columns"
                  :key="col.key"
                  class="py-2.5 px-3 whitespace-nowrap text-slate-800 dark:text-slate-200 border-l last:border-l-0 border-slate-200 dark:border-slate-800"
                >
                  <span v-if="row[col.key] !== undefined && row[col.key] !== null" class="font-sans">
                    {{ toPersianDigits(String(row[col.key])) }}
                  </span>
                  <span v-else class="text-slate-300 dark:text-slate-600">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Step 2 Navigation Buttons -->
      <div class="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
        <Button
          variant="outline"
          size="sm"
          :disabled="isSubmitting"
          @click="currentStep = 1"
        >
          <ArrowRight class="w-4 h-4 ml-1" />
          مرحله قبل (انتخاب فایل دیگر)
        </Button>

        <Button
          variant="primary"
          size="sm"
          :loading="isSubmitting"
          @click="confirmAndImport"
        >
          <RefreshCw v-if="isSubmitting" class="w-4 h-4 ml-1.5 animate-spin" />
          <CheckCircle2 v-else class="w-4 h-4 ml-1.5" />
          تایید و شروع ورود اطلاعات
        </Button>
      </div>
    </div>

    <!-- ==================== STEP 3: EXECUTION & RESULTS ==================== -->
    <div v-else-if="currentStep === 3 && executionResult" class="space-y-6">
      <!-- Status Announcement Banner -->
      <div
        :class="[
          'p-5 rounded-2xl border flex items-center justify-between gap-4',
          executionResult.summary.skippedCount === 0
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            : executionResult.summary.importedCount > 0
            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
            : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200',
        ]"
      >
        <div class="flex items-center gap-3">
          <div
            :class="[
              'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white',
              executionResult.summary.skippedCount === 0
                ? 'bg-emerald-600'
                : executionResult.summary.importedCount > 0
                ? 'bg-amber-600'
                : 'bg-rose-600',
            ]"
          >
            <CheckCircle2 v-if="executionResult.summary.skippedCount === 0" class="w-6 h-6" />
            <AlertTriangle v-else-if="executionResult.summary.importedCount > 0" class="w-6 h-6" />
            <XCircle v-else class="w-6 h-6" />
          </div>

          <div>
            <h3 class="text-sm font-bold">
              <span v-if="executionResult.summary.skippedCount === 0">
                عملیات ورود اعضا با موفقیت ۱۰۰٪ به پایان رسید
              </span>
              <span v-else-if="executionResult.summary.importedCount > 0">
                ورود اطلاعات با موفقیت انجام شد اما برخی سطرها دارای خطا بودند
              </span>
              <span v-else>
                هیچ عضوی ذخیره نشد؛ تمامی سطرهای فایل دارای خطا بودند
              </span>
            </h3>
            <p class="text-xs opacity-90 mt-1">
              از مجموع {{ toPersianDigits(executionResult.summary.totalRows) }} سطر،
              تعداد {{ toPersianDigits(executionResult.summary.importedCount) }} عضو به پایگاه‌داده اضافه شد و
              تعداد {{ toPersianDigits(executionResult.summary.skippedCount) }} مورد رد شد.
            </p>
          </div>
        </div>

        <Badge
          :variant="executionResult.summary.skippedCount === 0 ? 'emerald' : executionResult.summary.importedCount > 0 ? 'amber' : 'rose'"
          size="md"
        >
          {{ executionResult.summary.skippedCount === 0 ? 'موفقیت کامل' : 'نیاز به بررسی' }}
        </Badge>
      </div>

      <!-- 4 Summary Stat Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div class="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">کل ردیف‌ها</span>
            <FileText class="w-4 h-4 text-slate-400" />
          </div>
          <p class="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {{ toPersianDigits(executionResult.summary.totalRows) }}
          </p>
          <span class="text-[11px] text-slate-400 mt-0.5 block">سطرهای شناسایی شده</span>
        </div>

        <div class="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-blue-600 dark:text-blue-400 font-medium">پردازش‌شده</span>
            <RefreshCw class="w-4 h-4 text-blue-500" />
          </div>
          <p class="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {{ toPersianDigits(executionResult.summary.processedCount) }}
          </p>
          <span class="text-[11px] text-slate-400 mt-0.5 block">بررسی و اعتبارسنجی</span>
        </div>

        <div class="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">ثبت‌شده موفق</span>
            <CheckCircle2 class="w-4 h-4 text-emerald-500" />
          </div>
          <p class="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {{ toPersianDigits(executionResult.summary.importedCount) }}
          </p>
          <span class="text-[11px] text-slate-400 mt-0.5 block">عضو جدید اضافه شد</span>
        </div>

        <div class="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-rose-600 dark:text-rose-400 font-medium">رد شده / دارای خطا</span>
            <AlertTriangle class="w-4 h-4 text-rose-500" />
          </div>
          <p class="text-2xl font-bold text-rose-700 dark:text-rose-300">
            {{ toPersianDigits(executionResult.summary.skippedCount) }}
          </p>
          <span class="text-[11px] text-slate-400 mt-0.5 block">عدم ثبت در سامانه</span>
        </div>
      </div>

      <!-- SECTION 3.1: Failed Rows Table (If any) -->
      <div
        v-if="executionResult.summary.skippedCount > 0"
        class="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 p-5 space-y-4"
      >
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-rose-100 dark:border-rose-950/60">
          <div>
            <h3 class="text-xs sm:text-sm font-bold text-rose-900 dark:text-rose-200 flex items-center gap-2">
              <AlertTriangle class="w-4 h-4 text-rose-600 dark:text-rose-400" />
              فهرست ردیف‌های دارای خطا ({{ toPersianDigits(executionResult.failedRows.length) }} مورد)
            </h3>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              دلایل رد شدن داده‌ها مانند تکراری بودن کد ملی یا کد عضویت، نقص قالب و غیره
            </p>
          </div>

          <!-- Failed Rows Actions: Copy & Download CSV -->
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              class="border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-xs flex-1 sm:flex-initial"
              title="کپی ردیف‌های خطا در کلیپ‌بورد"
              @click="copyFailedRows"
            >
              <Check v-if="isCopied" class="w-3.5 h-3.5 ml-1 text-emerald-600" />
              <Copy v-else class="w-3.5 h-3.5 ml-1" />
              {{ isCopied ? 'کپی شد!' : 'کپی خطاها' }}
            </Button>

            <Button
              variant="outline"
              size="sm"
              class="border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs flex-1 sm:flex-initial"
              title="دریافت فایل اکسل / CSV سطرهای خطا"
              @click="downloadFailedRowsCsv"
            >
              <Download class="w-3.5 h-3.5 ml-1" />
              خروجی اکسل خطاها
            </Button>
          </div>
        </div>

        <!-- Search input for failed rows if more than 5 -->
        <div v-if="executionResult.failedRows.length > 5" class="relative max-w-sm">
          <Input
            v-model="failedRowsSearch"
            placeholder="جستجو در خطاهای ثبت‌شده..."
            size="sm"
          >
            <template #prefix>
              <Search class="w-4 h-4" />
            </template>
          </Input>
        </div>

        <!-- Failed Rows Table -->
        <div class="overflow-x-auto rounded-xl border border-rose-100 dark:border-rose-950">
          <table class="w-full text-right text-xs border-collapse">
            <thead>
              <tr class="bg-rose-50/60 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 font-bold">
                <th class="py-2.5 px-3 text-center w-16">سطر</th>
                <th class="py-2.5 px-3 whitespace-nowrap">کد عضویت</th>
                <th class="py-2.5 px-3 whitespace-nowrap">کد ملی</th>
                <th class="py-2.5 px-3 whitespace-nowrap">نام و نام خانوادگی</th>
                <th class="py-2.5 px-3">علت عدم ثبت / پیام خطا</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              <tr
                v-for="err in filteredFailedRows"
                :key="err.rowNumber"
                class="hover:bg-rose-50/20 dark:hover:bg-rose-950/10 transition-colors"
              >
                <td class="py-2.5 px-3 text-center font-mono font-bold text-rose-700 dark:text-rose-300 bg-rose-50/30 dark:bg-rose-950/20">
                  {{ toPersianDigits(err.rowNumber) }}
                </td>
                <td class="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                  {{ err.memberCode ? toPersianDigits(err.memberCode) : '—' }}
                </td>
                <td class="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                  {{ err.nationalCode ? toPersianDigits(err.nationalCode) : '—' }}
                </td>
                <td class="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                  {{ err.fullName || '—' }}
                </td>
                <td class="py-2.5 px-3 text-rose-700 dark:text-rose-400 font-medium">
                  <span class="inline-flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                    {{ err.reason }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- SECTION 3.2: Successfully Imported Members Preview -->
      <div
        v-if="executionResult.importedMembers?.length"
        class="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 p-5 space-y-3"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 class="text-xs font-bold text-emerald-900 dark:text-emerald-200">
              اعضای با موفقیت ثبت‌شده ({{ toPersianDigits(executionResult.importedMembers.length) }} مورد)
            </h4>
          </div>

          <button
            type="button"
            class="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
            @click="showImportedList = !showImportedList"
          >
            <span>{{ showImportedList ? 'بستن لیست' : 'مشاهده لیست اعضا' }}</span>
            <ChevronUp v-if="showImportedList" class="w-3.5 h-3.5" />
            <ChevronDown v-else class="w-3.5 h-3.5" />
          </button>
        </div>

        <div v-if="showImportedList" class="pt-2">
          <div class="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
            <div
              v-for="m in executionResult.importedMembers"
              :key="m.id"
              class="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2 text-xs"
            >
              <span class="font-bold text-emerald-900 dark:text-emerald-100">
                {{ m.fullName || 'عضو' }}
              </span>
              <span class="font-mono text-emerald-700 dark:text-emerald-400 text-[11px] bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                {{ toPersianDigits(m.memberCode) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
        <Button
          variant="outline"
          size="sm"
          @click="restartWizard"
        >
          <RefreshCw class="w-4 h-4 ml-1.5" />
          ورود فایل جدید
        </Button>

        <Button
          variant="primary"
          size="sm"
          @click="finishAndClose"
        >
          <Check class="w-4 h-4 ml-1.5" />
          تکمیل و مشاهده فهرست اعضا
        </Button>
      </div>
    </div>
  </div>
</template>
