<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { membersApi } from '@/api';
import { useLookupsStore, useNotificationStore } from '@/stores';
import type { IMemberSkill } from '@/types';
import { Modal, Button, Input, Select } from '@/components/ui';
import DatePicker from '@/components/ui/DatePicker.vue';
import SelfAssessmentSlider from './SelfAssessmentSlider.vue';
import { extractErrorMessage } from '@/utils/errors';
import {
  Award,
  Calendar,
  FileText,
  Upload,
  X,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-vue-next';

interface Props {
  open: boolean;
  memberId: string;
  skill?: IMemberSkill | null;
  memberName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  skill: null,
  memberName: '',
});

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'saved', skill: IMemberSkill): void;
}>();

const lookupsStore = useLookupsStore();
const notificationStore = useNotificationStore();

const isSaving = ref(false);

// Form Fields
const formSpecializationId = ref('');
const formStartDate = ref('');
const formSelfAssessment = ref<number>(60);
const formHasCertificate = ref(false);
const formCertificateTitle = ref('');
const formDescription = ref('');

// File Upload State
const certificateFile = ref<File | null>(null);
const certificatePreviewUrl = ref<string>('');
const existingCertificateUrl = ref<string>('');
const isDragging = ref(false);

// Validation Errors
const errors = ref<Record<string, string>>({});

const isEditMode = computed(() => Boolean(props.skill && props.skill._id));

// Specialization Options for Select
const specializationOptions = computed(() => {
  return lookupsStore.specializations.map((s) => ({
    label: `${s.title}${s.code ? ` (${s.code})` : ''}`,
    value: s._id,
  }));
});

// Watch open state and load / reset values
watch(
  () => props.open,
  (isOpen) => {
    errors.value = {};
    certificateFile.value = null;
    certificatePreviewUrl.value = '';

    if (isOpen) {
      if (props.skill) {
        // Edit mode
        const s = props.skill;
        formSpecializationId.value =
          typeof s.specializationId === 'object' && s.specializationId
            ? s.specializationId._id
            : (s.specializationId as string) || '';
        formStartDate.value = s.startDate ? s.startDate.split('T')[0] : '';
        formSelfAssessment.value = Number(s.selfAssessmentPercentage) || 50;
        formHasCertificate.value = Boolean(s.hasCertificate);
        formCertificateTitle.value = s.certificateTitle || '';
        formDescription.value = s.description || '';
        existingCertificateUrl.value = s.certificateFile || '';
      } else {
        // Create mode
        resetForm();
      }
    }
  }
);

function resetForm() {
  formSpecializationId.value = lookupsStore.specializations[0]?._id || '';
  formStartDate.value = new Date().toISOString().split('T')[0];
  formSelfAssessment.value = 60;
  formHasCertificate.value = false;
  formCertificateTitle.value = '';
  formDescription.value = '';
  certificateFile.value = null;
  certificatePreviewUrl.value = '';
  existingCertificateUrl.value = '';
  errors.value = {};
}

// File drop & select handlers
function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    processSelectedFile(target.files[0]);
  }
}

function handleFileDrop(e: DragEvent) {
  isDragging.value = false;
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    processSelectedFile(e.dataTransfer.files[0]);
  }
}

function processSelectedFile(file: File) {
  // Accepted: PDF, JPEG, PNG, WebP (up to 10MB)
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];

  if (!allowedTypes.includes(file.type)) {
    errors.value.certificate = 'تنها فایل‌های PDF، JPG، PNG و WebP مجاز می‌باشند.';
    return;
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    errors.value.certificate = 'حداکثر حجم مجاز برای بارگذاری گواهینامه ۱۰ مگابایت است.';
    return;
  }

  errors.value.certificate = '';
  certificateFile.value = file;

  if (file.type.startsWith('image/')) {
    certificatePreviewUrl.value = URL.createObjectURL(file);
  } else {
    certificatePreviewUrl.value = '';
  }
}

function removeSelectedFile() {
  certificateFile.value = null;
  certificatePreviewUrl.value = '';
}

function validateForm(): boolean {
  errors.value = {};

  if (!formSpecializationId.value) {
    errors.value.specializationId = 'انتخاب نوع مهارت و رسته تخصصی الزامی است.';
  }

  if (!formStartDate.value) {
    errors.value.startDate = 'تاریخ شروع فعالیت در این مهارت الزامی است.';
  }

  if (
    formSelfAssessment.value === undefined ||
    formSelfAssessment.value === null ||
    formSelfAssessment.value < 1 ||
    formSelfAssessment.value > 100
  ) {
    errors.value.selfAssessmentPercentage = 'درجه مهارت باید عددی بین ۱ تا ۱۰۰ درصد باشد.';
  }

  if (formHasCertificate.value) {
    if (!formCertificateTitle.value.trim()) {
      errors.value.certificateTitle = 'عنوان یا نام گواهینامه را وارد نمایید.';
    }
    // If new skill and hasCertificate is true, file is strictly required
    if (!isEditMode.value && !certificateFile.value) {
      errors.value.certificate = 'بارگذاری فایل یا تصویر اسکن گواهینامه الزامی است.';
    }
  }

  return Object.keys(errors.value).length === 0;
}

async function handleSave() {
  if (!validateForm()) return;
  if (!props.memberId) {
    notificationStore.error('شناسه عضو مشخص نشده است.', 'خطا');
    return;
  }

  isSaving.value = true;
  try {
    const formData = new FormData();
    formData.append('specializationId', formSpecializationId.value);
    formData.append('startDate', formStartDate.value);
    formData.append('selfAssessmentPercentage', String(formSelfAssessment.value));
    formData.append('hasCertificate', String(formHasCertificate.value));
    formData.append('certificateTitle', formCertificateTitle.value.trim());
    formData.append('description', formDescription.value.trim());

    if (certificateFile.value) {
      formData.append('certificate', certificateFile.value);
    }

    let savedSkill: IMemberSkill;

    if (isEditMode.value && props.skill?._id) {
      const res = await membersApi.updateMemberSkill(props.memberId, props.skill._id, formData);
      savedSkill = res.data;
      notificationStore.success('اطلاعات مهارت با موفقیت بروزرسانی شد.', 'بروزرسانی موفق');
    } else {
      const res = await membersApi.addMemberSkill(props.memberId, formData);
      savedSkill = res.data;
      notificationStore.success('مهارت جدید با موفقیت ثبت و در صف تائید کارشناس قرار گرفت.', 'ثبت موفق مهارت');
    }

    emit('saved', savedSkill);
    emit('update:open', false);
  } catch (err: any) {
    notificationStore.error(extractErrorMessage(err) || 'عملیات با خطا مواجه شد.', 'خطا در ذخیره‌سازی مهارت');
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <Modal
    :open="open"
    size="lg"
    @close="emit('update:open', false)"
  >
    <!-- Modal Header -->
    <template #header>
      <div class="w-full flex items-center justify-between text-right" dir="rtl">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 flex items-center justify-center font-bold">
            <Award class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{{ isEditMode ? 'ویرایش مهارت و تخصص' : 'افزودن مهارت و تخصص جدید' }}</span>
            </h3>
            <p v-if="memberName" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              عضو: <span class="font-bold text-slate-700 dark:text-slate-300">{{ memberName }}</span>
            </p>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal Form Body -->
    <form class="space-y-5 text-right select-none" dir="rtl" @submit.prevent="handleSave">
      <!-- 1. Specialization Selection -->
      <div class="space-y-1.5">
        <label class="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <span>نوع مهارت و تخصص (رسته صنفی)</span>
          <span class="text-rose-500">*</span>
        </label>
        <Select
          v-model="formSpecializationId"
          :options="specializationOptions"
          placeholder="رسته تخصصی مورد نظر را انتخاب نمایید..."
          :error="errors.specializationId"
        />
        <p v-if="errors.specializationId" class="text-2xs font-bold text-rose-500 mt-1">
          {{ errors.specializationId }}
        </p>
      </div>

      <!-- 2. Start Date & Self Assessment Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Activity Start Date -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Calendar class="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>شروع به فعالیت در این مهارت</span>
            <span class="text-rose-500">*</span>
          </label>
          <DatePicker
            v-model="formStartDate"
            output-format="iso"
            placeholder="انتخاب تاریخ شروع فعالیت..."
            :error="errors.startDate"
          />
          <p v-if="errors.startDate" class="text-2xs font-bold text-rose-500 mt-1">
            {{ errors.startDate }}
          </p>
        </div>

        <!-- Note info box -->
        <div class="p-3 bg-brand-50/40 dark:bg-brand-950/20 border border-brand-200/50 dark:border-brand-800/40 rounded-xl flex items-start gap-2.5 text-xs text-brand-900 dark:text-brand-200">
          <Info class="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
          <p class="leading-relaxed text-2xs">
            تاریخ شروع فعالیت جهت محاسبه میزان سابقه کار تخصصی عضو در کارتابل رتبه‌بندی و ارزیابی صلاحیت استفاده خواهد شد.
          </p>
        </div>
      </div>

      <!-- 3. Self-Assessment Degree Slider (1% to 100%) -->
      <SelfAssessmentSlider
        v-model="formSelfAssessment"
        :error="errors.selfAssessmentPercentage"
      />

      <!-- 4. Has Certificate Switch Toggle -->
      <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Award class="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>آیا برای این مهارت گواهی معتبر دارد؟</span>
            </h4>
            <p class="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
              در صورت داشتن گواهینامه معتبر، سند یا مدرک آزمون رسمی باید بارگذاری شود.
            </p>
          </div>

          <!-- Boolean Radio / Switch -->
          <div class="flex items-center gap-2 bg-slate-200/70 dark:bg-slate-700/70 p-1 rounded-xl">
            <button
              type="button"
              :class="[
                'px-3.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer',
                formHasCertificate
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              ]"
              @click="formHasCertificate = true"
            >
              بله
            </button>
            <button
              type="button"
              :class="[
                'px-3.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer',
                !formHasCertificate
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              ]"
              @click="formHasCertificate = false"
            >
              خیر
            </button>
          </div>
        </div>

        <!-- 5. Revealed Certificate Upload Zone when hasCertificate is True -->
        <div v-if="formHasCertificate" class="space-y-3.5 pt-3 border-t border-slate-200/80 dark:border-slate-800">
          <!-- Certificate Title Input -->
          <div>
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              عنوان گواهینامه یا مرجع صادرکننده
              <span class="text-rose-500">*</span>
            </label>
            <Input
              v-model="formCertificateTitle"
              placeholder="مانند: Cisco CCNA / LPIC-2 / گواهینامه سازمان فنی‌حرفه‌ای"
              :error="errors.certificateTitle"
            />
          </div>

          <!-- Drag & Drop Uploader -->
          <div>
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              بارگذاری مدرک یا اسکن گواهی
              <span v-if="!isEditMode" class="text-rose-500">*</span>
            </label>

            <!-- When file is already chosen -->
            <div
              v-if="certificateFile"
              class="p-3 bg-white dark:bg-slate-900 border border-brand-300 dark:border-brand-700 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div v-if="certificatePreviewUrl" class="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                  <img :src="certificatePreviewUrl" class="w-full h-full object-cover" alt="Preview" />
                </div>
                <div v-else class="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-300 flex items-center justify-center shrink-0">
                  <FileText class="w-5 h-5" />
                </div>
                <div class="truncate">
                  <p class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {{ certificateFile.name }}
                  </p>
                  <p class="text-2xs text-slate-400 mt-0.5">
                    {{ (certificateFile.size / 1024 / 1024).toFixed(2) }} مگابایت
                  </p>
                </div>
              </div>

              <button
                type="button"
                class="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                title="حذف فایل انتخاب شده"
                @click="removeSelectedFile"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <!-- Existing file notice in edit mode -->
            <div
              v-else-if="existingCertificateUrl"
              class="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3"
            >
              <div class="flex items-center gap-2.5">
                <FileCheck class="w-4 h-4 text-emerald-600" />
                <span class="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  گواهینامه قبلاً بارگذاری شده است.
                </span>
              </div>
              <label class="text-xs font-bold text-brand-600 hover:underline cursor-pointer">
                جایگزینی فایل جدید
                <input
                  type="file"
                  class="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  @change="handleFileSelect"
                />
              </label>
            </div>

            <!-- Drag & Drop Zone -->
            <div
              v-else
              :class="[
                'border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer',
                isDragging
                  ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-950/30'
                  : errors.certificate
                  ? 'border-rose-400 bg-rose-50/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-600 bg-white dark:bg-slate-900/60'
              ]"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleFileDrop"
            >
              <input
                id="certFileInput"
                type="file"
                class="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                @change="handleFileSelect"
              />
              <label for="certFileInput" class="cursor-pointer space-y-2 block">
                <Upload class="w-8 h-8 text-slate-400 mx-auto" />
                <p class="text-xs font-bold text-slate-700 dark:text-slate-200">
                  کلیک کنید یا فایل گواهینامه را به این بخش بکشید
                </p>
                <p class="text-2xs text-slate-400">
                  فرمت‌های مجاز: PDF، JPEG، PNG، WebP (حداکثر ۱۰ مگابایت)
                </p>
              </label>
            </div>

            <p v-if="errors.certificate" class="text-2xs font-bold text-rose-500 mt-1">
              {{ errors.certificate }}
            </p>
          </div>
        </div>
      </div>

      <!-- 6. Practical Experience Description -->
      <div class="space-y-1.5">
        <label class="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <FileText class="w-3.5 h-3.5 text-slate-500" />
          <span>توضیحات تکمیلی و سوابق پروژه‌ای</span>
          <span class="text-2xs font-normal text-slate-400">(اختیاری)</span>
        </label>
        <textarea
          v-model="formDescription"
          rows="3"
          placeholder="شرح تجارب اجرایی، پروژه‌های شاخص پیاده‌سازی شده در این مهارت یا شماره سریال استعلام گواهینامه..."
          class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition resize-none"
        ></textarea>
      </div>

      <!-- Workflow Notice -->
      <div class="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 rounded-xl flex items-start gap-2 text-2xs text-amber-900 dark:text-amber-200">
        <AlertCircle class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p class="leading-relaxed">
          پس از ثبت یا ویرایش مهارت، وضعیت به صورت خودکار در وضعیت <span class="font-bold">«در انتظار تائید کارشناس»</span> قرار می‌گیرد و تا زمان بررسی توسط کارشناس، نشان تائید نهایی نخواهد داشت.
        </p>
      </div>
    </form>

    <!-- Modal Footer Actions -->
    <template #footer>
      <div class="w-full flex items-center justify-between" dir="rtl">
        <Button
          variant="secondary"
          :disabled="isSaving"
          @click="emit('update:open', false)"
        >
          انصراف
        </Button>

        <Button
          variant="primary"
          :loading="isSaving"
          @click="handleSave"
        >
          <CheckCircle2 class="w-4 h-4 ml-1.5" />
          {{ isEditMode ? 'ذخیره تغییرات مهارت' : 'ثبت و ارسال مهارت' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>
