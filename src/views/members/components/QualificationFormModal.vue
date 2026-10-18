<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { membersApi } from '@/api';
import { useLookupsStore, useNotificationStore } from '@/stores';
import type {
  IAcademicQualification,
  ICreateAcademicQualificationPayload,
  IUpdateAcademicQualificationPayload,
} from '@/types';
import { Modal, Button, Input, Select } from '@/components/ui';
import { extractErrorMessage } from '@/utils/errors';
import {
  GraduationCap,
  Building2,
  MapPin,
  Calendar,
  Award,
  BookOpen,
  FileText,
} from 'lucide-vue-next';

interface Props {
  open: boolean;
  memberId: string;
  qualification?: IAcademicQualification | null;
  memberName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  qualification: null,
  memberName: '',
});

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'saved', qualification: IAcademicQualification): void;
}>();

const lookupsStore = useLookupsStore();
const notificationStore = useNotificationStore();

const isSaving = ref(false);

// Form Fields
const formTitle = ref('');
const formDegreeLevel = ref('');
const formAcademicField = ref('');
const formInstitution = ref('');
const formCity = ref('');
const formStartYear = ref<string | number>('');
const formGraduationYear = ref<string | number>('');
const formGpa = ref<string | number>('');
const formDescription = ref('');

// Validation Errors
const errors = ref<Record<string, string>>({});

const isEditMode = computed(() => Boolean(props.qualification && props.qualification._id));

// Degree level options
const degreeLevelOptions = computed(() => {
  return lookupsStore.degreeLevels.map((d) => ({
    label: d.title,
    value: d._id,
  }));
});

// Academic field options
const academicFieldOptions = computed(() => {
  return lookupsStore.academicFields.map((f) => ({
    label: f.title,
    value: f._id,
  }));
});

// Watch open state and load / reset values
watch(
  () => props.open,
  (isOpen) => {
    errors.value = {};
    if (isOpen) {
      if (props.qualification) {
        // Edit mode
        const q = props.qualification;
        formTitle.value = q.title || '';
        formDegreeLevel.value =
          typeof q.degreeLevel === 'object' && q.degreeLevel ? q.degreeLevel._id : (q.degreeLevel as string) || '';
        formAcademicField.value =
          typeof q.academicField === 'object' && q.academicField ? q.academicField._id : (q.academicField as string) || '';
        formInstitution.value = q.institution || '';
        formCity.value = q.city || '';
        formStartYear.value = q.startYear !== undefined && q.startYear !== null ? q.startYear : '';
        formGraduationYear.value = q.graduationYear !== undefined && q.graduationYear !== null ? q.graduationYear : '';
        formGpa.value = q.gpa !== undefined && q.gpa !== null ? String(q.gpa) : '';
        formDescription.value = q.description || '';
      } else {
        // Create mode
        resetForm();
      }
    }
  }
);

function resetForm() {
  formTitle.value = '';
  formDegreeLevel.value = lookupsStore.degreeLevels[0]?._id || '';
  formAcademicField.value = lookupsStore.academicFields[0]?._id || '';
  formInstitution.value = '';
  formCity.value = '';
  formStartYear.value = '';
  formGraduationYear.value = '';
  formGpa.value = '';
  formDescription.value = '';
  errors.value = {};
}

function handleAutoFillTitle() {
  const selectedDegree = lookupsStore.degreeLevels.find((d) => d._id === formDegreeLevel.value);
  const selectedField = lookupsStore.academicFields.find((f) => f._id === formAcademicField.value);
  const parts: string[] = [];
  if (selectedDegree?.title) parts.push(selectedDegree.title);
  if (selectedField?.title) parts.push(selectedField.title);
  if (parts.length > 0) {
    formTitle.value = parts.join(' ');
  }
}

function validateForm(): boolean {
  errors.value = {};

  if (!formTitle.value.trim()) {
    errors.value.title = 'وارد کردن عنوان مدرک الزامی است.';
  }

  if (!formDegreeLevel.value) {
    errors.value.degreeLevel = 'انتخاب مقطع تحصیلی الزامی است.';
  }

  if (!formAcademicField.value) {
    errors.value.academicField = 'انتخاب رشته تحصیلی الزامی است.';
  }

  const sYear = formStartYear.value !== '' ? Number(formStartYear.value) : null;
  const gYear = formGraduationYear.value !== '' ? Number(formGraduationYear.value) : null;

  if (sYear !== null) {
    if (isNaN(sYear) || sYear < 1300 || sYear > 2100) {
      errors.value.startYear = 'سال شروع باید بین ۱۳۰۰ الی ۲۱۰۰ باشد.';
    }
  }

  if (gYear !== null) {
    if (isNaN(gYear) || gYear < 1300 || gYear > 2100) {
      errors.value.graduationYear = 'سال فراغت باید بین ۱۳۰۰ الی ۲۱۰۰ باشد.';
    }
  }

  if (sYear !== null && gYear !== null && !isNaN(sYear) && !isNaN(gYear) && sYear > gYear) {
    errors.value.graduationYear = 'سال فراغت از تحصیل نمی‌تواند کوچکتر از سال شروع تحصیل باشد.';
  }

  if (formGpa.value !== '' && formGpa.value !== null && formGpa.value !== undefined) {
    const gpaNum = Number(formGpa.value);
    if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 20) {
      errors.value.gpa = 'معدل باید عددی بین ۰ تا ۲۰ باشد.';
    }
  }

  return Object.keys(errors.value).length === 0;
}

async function handleSubmit() {
  if (!validateForm()) return;
  if (!props.memberId) {
    notificationStore.error('شناسه عضو معتبر نیست.');
    return;
  }

  isSaving.value = true;
  try {
    const payload: ICreateAcademicQualificationPayload = {
      title: formTitle.value.trim(),
      academicField: formAcademicField.value,
      degreeLevel: formDegreeLevel.value,
      institution: formInstitution.value.trim() || undefined,
      city: formCity.value.trim() || undefined,
      startYear: formStartYear.value !== '' ? Number(formStartYear.value) : undefined,
      graduationYear: formGraduationYear.value !== '' ? Number(formGraduationYear.value) : undefined,
      gpa: formGpa.value !== '' && formGpa.value !== null ? Number(formGpa.value) : undefined,
      description: formDescription.value.trim() || undefined,
    };

    let resultQual: IAcademicQualification;

    if (isEditMode.value && props.qualification?._id) {
      const res = await membersApi.updateMemberQualification(
        props.memberId,
        props.qualification._id,
        payload as IUpdateAcademicQualificationPayload
      );
      resultQual = res.data;
      notificationStore.success('مدرک تحصیلی با موفقیت ویرایش شد.');
    } else {
      const res = await membersApi.addMemberQualification(props.memberId, payload);
      resultQual = res.data;
      notificationStore.success('مدرک تحصیلی با موفقیت ثبت شد و در انتظار تائید کارشناس قرار گرفت.');
    }

    emit('saved', resultQual);
    emit('update:open', false);
  } catch (err) {
    notificationStore.error(
      extractErrorMessage(err, isEditMode.value ? 'خطا در ویرایش مدرک تحصیلی' : 'خطا در ثبت مدرک تحصیلی')
    );
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
          <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center font-bold">
            <GraduationCap class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{{ isEditMode ? 'ویرایش مشخصات مدرک تحصیلی' : 'ثبت مدرک تحصیلی جدید' }}</span>
            </h3>
            <p v-if="memberName" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              برای عضو: <strong class="text-slate-700 dark:text-slate-300">{{ memberName }}</strong>
            </p>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal Body -->
    <div class="space-y-4 text-right select-none" dir="rtl">
      <!-- Status Hint Banner for Create Mode -->
      <div
        v-if="!isEditMode"
        class="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2"
      >
        <span class="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
        <span>
          مدرک پس از ثبت، به صورت خودکار در وضعیت <strong>«در انتظار تائید کارشناس» (PENDING)</strong> قرار خواهد گرفت.
        </span>
      </div>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <!-- Row 1: Degree Level & Academic Field -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            v-model="formDegreeLevel"
            label="مقطع تحصیلی"
            placeholder="انتخاب مقطع تحصیلی..."
            :options="degreeLevelOptions"
            :error="errors.degreeLevel"
            required
            @update:model-value="handleAutoFillTitle"
          />

          <Select
            v-model="formAcademicField"
            label="رشته تحصیلی"
            placeholder="انتخاب رشته تحصیلی..."
            :options="academicFieldOptions"
            :error="errors.academicField"
            searchable
            required
            @update:model-value="handleAutoFillTitle"
          />
        </div>

        <!-- Row 2: Title of Qualification -->
        <div>
          <Input
            v-model="formTitle"
            label="عنوان مدرک"
            placeholder="مثال: کارشناسی مهندسی نرم‌افزار، کارشناسی ارشد هوش مصنوعی..."
            :error="errors.title"
            required
          >
            <template #prefix>
              <BookOpen class="w-4 h-4" />
            </template>
          </Input>
          <div class="flex items-center justify-between mt-1 text-[11px] text-slate-400">
            <span>عنوان دقیق دانشنامه یا گواهی تحصیلی را درج فرمایید.</span>
            <button
              type="button"
              class="text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              @click="handleAutoFillTitle"
            >
              ساخت خودکار از مقطع و رشته
            </button>
          </div>
        </div>

        <!-- Row 3: Institution & City -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            v-model="formInstitution"
            label="دانشگاه / موسسه آموزش عالی"
            placeholder="مثال: دانشگاه صنعتی شریف، دانشگاه تهران..."
            :error="errors.institution"
          >
            <template #prefix>
              <Building2 class="w-4 h-4" />
            </template>
          </Input>

          <Input
            v-model="formCity"
            label="شهر محل تحصیل"
            placeholder="مثال: تهران، تبریز، اصفهان..."
            :error="errors.city"
          >
            <template #prefix>
              <MapPin class="w-4 h-4" />
            </template>
          </Input>
        </div>

        <!-- Row 4: Start Year, Graduation Year & GPA -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            v-model="formStartYear"
            type="number"
            label="سال شروع تحصیل"
            placeholder="مثال: ۱۳۹۵"
            dir="ltr"
            :error="errors.startYear"
          >
            <template #prefix>
              <Calendar class="w-4 h-4" />
            </template>
          </Input>

          <Input
            v-model="formGraduationYear"
            type="number"
            label="سال فراغت از تحصیل"
            placeholder="مثال: ۱۳۹۹"
            dir="ltr"
            :error="errors.graduationYear"
          >
            <template #prefix>
              <Calendar class="w-4 h-4" />
            </template>
          </Input>

          <Input
            v-model="formGpa"
            type="number"
            step="0.01"
            min="0"
            max="20"
            label="معدل کل (از ۲۰)"
            placeholder="مثال: ۱۷.۸۵"
            dir="ltr"
            :error="errors.gpa"
          >
            <template #prefix>
              <Award class="w-4 h-4" />
            </template>
          </Input>
        </div>

        <!-- Row 5: Additional Notes / Description -->
        <div class="w-full text-right">
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <FileText class="w-3.5 h-3.5 text-slate-400" />
            توضیحات و عنوان پایان‌نامه (اختیاری)
          </label>
          <textarea
            v-model="formDescription"
            rows="2"
            placeholder="گرایش تحصیلی، عنوان پروژه یا پایان‌نامه، رتبه علمی یا هرگونه توضیح تکمیلی..."
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
          />
        </div>

        <!-- Modal Actions -->
        <div class="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="md"
            @click="emit('update:open', false)"
          >
            انصراف
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            :loading="isSaving"
          >
            {{ isEditMode ? 'ذخیره تغییرات مدرک' : 'ثبت مدرک تحصیلی' }}
          </Button>
        </div>
      </form>
    </div>
  </Modal>
</template>
