<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { membersApi, lookupsApi } from '@/api';
import { useNotificationStore } from '@/stores';
import type {
  IAcademicQualification,
  QualificationVerificationStatus,
  IVerifyQualificationPayload,
} from '@/types';
import { Modal, Button, Badge } from '@/components/ui';
import { toPersianDigits } from '@/utils/formatters';
import { extractErrorMessage } from '@/utils/errors';
import {
  CheckCircle2,
  XCircle,
  Clock,
  GraduationCap,
  Building2,
  AlertTriangle,
  FileText,
  ShieldCheck,
} from 'lucide-vue-next';

interface Props {
  open: boolean;
  qualification: IAcademicQualification | null;
  memberId?: string;
  memberName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  qualification: null,
  memberId: '',
  memberName: '',
});

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'verified', updated: IAcademicQualification): void;
}>();

const notificationStore = useNotificationStore();

const isSubmitting = ref(false);
const selectedStatus = ref<QualificationVerificationStatus>('APPROVED');
const rejectionReason = ref('');
const expertComment = ref('');
const touched = ref(false);

// Reset / Initialize on modal open
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.qualification) {
      touched.value = false;
      expertComment.value = '';
      // Default to APPROVED unless it's already APPROVED, then keep or default
      if (props.qualification.verificationStatus === 'APPROVED') {
        selectedStatus.value = 'APPROVED';
      } else if (props.qualification.verificationStatus === 'REJECTED') {
        selectedStatus.value = 'REJECTED';
        rejectionReason.value = props.qualification.rejectionReason || '';
      } else {
        selectedStatus.value = 'APPROVED';
        rejectionReason.value = '';
      }
    } else {
      rejectionReason.value = '';
      expertComment.value = '';
      touched.value = false;
    }
  }
);

// Watch status change to clear rejection reason if moving away from REJECTED
watch(selectedStatus, (newStatus) => {
  if (newStatus !== 'REJECTED') {
    rejectionReason.value = '';
  }
});

// Validation
const isRejectionReasonEmpty = computed(() => {
  return selectedStatus.value === 'REJECTED' && !rejectionReason.value.trim();
});

const isSubmitDisabled = computed(() => {
  if (isSubmitting.value) return true;
  if (selectedStatus.value === 'REJECTED' && !rejectionReason.value.trim()) {
    return true;
  }
  return false;
});

// Display helpers
const displayDegree = computed(() => {
  if (!props.qualification) return '';
  const deg = props.qualification.degreeLevel;
  if (typeof deg === 'object' && deg?.title) return deg.title;
  return String(deg || '');
});

const displayField = computed(() => {
  if (!props.qualification) return '';
  const f = props.qualification.academicField;
  if (typeof f === 'object' && f?.title) return f.title;
  return String(f || '');
});

async function handleSubmitDecision() {
  touched.value = true;
  if (isSubmitDisabled.value) return;
  if (!props.qualification?._id) return;

  isSubmitting.value = true;
  try {
    const payload: IVerifyQualificationPayload = {
      status: selectedStatus.value,
      rejectionReason:
        selectedStatus.value === 'REJECTED' ? rejectionReason.value.trim() : undefined,
      comment: expertComment.value.trim() || undefined,
    };

    let updatedQual: IAcademicQualification;

    // Use member subroute if memberId is provided, otherwise direct lookups verify endpoint
    const mId =
      props.memberId ||
      (typeof props.qualification.memberId === 'object'
        ? props.qualification.memberId?._id
        : props.qualification.memberId);

    if (mId) {
      const res = await membersApi.verifyMemberQualification(
        mId,
        props.qualification._id,
        payload
      );
      updatedQual = res.data;
    } else {
      const res = await lookupsApi.verifyAcademicQualification(
        props.qualification._id,
        payload
      );
      updatedQual = res.data;
    }

    // Success Toast
    if (selectedStatus.value === 'APPROVED') {
      notificationStore.success('مدرک تحصیلی با موفقیت تائید شد.');
    } else if (selectedStatus.value === 'REJECTED') {
      notificationStore.warning('مدرک تحصیلی رد شد و علت رد در پرونده ثبت گردید.');
    } else {
      notificationStore.info('وضعیت مدرک به در انتظار بررسی تغییر یافت.');
    }

    emit('verified', updatedQual);
    emit('update:open', false);
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در ثبت تصمیم بررسی مدرک'));
  } finally {
    isSubmitting.value = false;
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
            <ShieldCheck class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>بررسی و تعیین وضعیت کارشناسی مدرک</span>
            </h3>
            <p v-if="memberName" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              عضو: <strong class="text-slate-700 dark:text-slate-300">{{ memberName }}</strong>
            </p>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal Body -->
    <div v-if="qualification" class="space-y-5 text-right select-none" dir="rtl">
      <!-- Qualification Summary Card -->
      <div class="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <GraduationCap class="w-4 h-4 text-brand-600 shrink-0" />
            <span class="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {{ qualification.title }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <Badge v-if="displayDegree" variant="purple" size="sm">
              {{ displayDegree }}
            </Badge>
            <Badge v-if="displayField" variant="brand" size="sm">
              {{ displayField }}
            </Badge>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
          <div class="flex items-center gap-1.5 truncate">
            <Building2 class="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span class="truncate">{{ qualification.institution || 'دانشگاه نامشخص' }}</span>
            <span v-if="qualification.city" class="text-slate-400 text-[11px]">({{ qualification.city }})</span>
          </div>

          <div v-if="qualification.graduationYear" class="truncate tabular-nums">
            فارغ‌التحصیل: {{ toPersianDigits(qualification.graduationYear) }}
          </div>

          <div v-if="qualification.gpa !== undefined && qualification.gpa !== null" class="truncate tabular-nums">
            معدل: <strong class="text-amber-600 dark:text-amber-400">{{ toPersianDigits(qualification.gpa) }}</strong> از ۲۰
          </div>
        </div>
      </div>

      <!-- Verification Decision Radio Selector -->
      <div class="space-y-2">
        <label class="block text-xs font-bold text-slate-800 dark:text-slate-200">
          تصمیم کارشناسی برای این مدرک:
          <span class="text-rose-500 font-bold mr-0.5">*</span>
        </label>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <!-- Option 1: APPROVED -->
          <label
            :class="[
              'p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 select-none',
              selectedStatus === 'APPROVED'
                ? 'bg-emerald-50/80 border-emerald-500 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-500 dark:text-emerald-100 shadow-xs'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300',
            ]"
          >
            <input
              v-model="selectedStatus"
              type="radio"
              value="APPROVED"
              class="sr-only"
            />
            <CheckCircle2
              :class="[
                'w-5 h-5 shrink-0 mt-0.5',
                selectedStatus === 'APPROVED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400',
              ]"
            />
            <div>
              <span class="font-bold text-xs block">تائید مدرک</span>
              <span class="text-[11px] opacity-80 block mt-0.5">دانشنامه معتبر و تائید شده است</span>
            </div>
          </label>

          <!-- Option 2: REJECTED -->
          <label
            :class="[
              'p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 select-none',
              selectedStatus === 'REJECTED'
                ? 'bg-rose-50/80 border-rose-500 text-rose-900 dark:bg-rose-950/40 dark:border-rose-500 dark:text-rose-100 shadow-xs'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300',
            ]"
          >
            <input
              v-model="selectedStatus"
              type="radio"
              value="REJECTED"
              class="sr-only"
            />
            <XCircle
              :class="[
                'w-5 h-5 shrink-0 mt-0.5',
                selectedStatus === 'REJECTED' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400',
              ]"
            />
            <div>
              <span class="font-bold text-xs block">رد مدرک</span>
              <span class="text-[11px] opacity-80 block mt-0.5">نقص مدارک یا عدم انطباق (علت الزامی است)</span>
            </div>
          </label>

          <!-- Option 3: PENDING -->
          <label
            :class="[
              'p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 select-none',
              selectedStatus === 'PENDING'
                ? 'bg-amber-50/80 border-amber-500 text-amber-900 dark:bg-amber-950/40 dark:border-amber-500 dark:text-amber-100 shadow-xs'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300',
            ]"
          >
            <input
              v-model="selectedStatus"
              type="radio"
              value="PENDING"
              class="sr-only"
            />
            <Clock
              :class="[
                'w-5 h-5 shrink-0 mt-0.5',
                selectedStatus === 'PENDING' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400',
              ]"
            />
            <div>
              <span class="font-bold text-xs block">در انتظار بررسی</span>
              <span class="text-[11px] opacity-80 block mt-0.5">بازگردانی جهت استعلام مجدد</span>
            </div>
          </label>
        </div>
      </div>

      <!-- Conditional Rejection Reason (STRICTLY REQUIRED FOR REJECTED) -->
      <div v-if="selectedStatus === 'REJECTED'" class="space-y-1.5 transition-all">
        <label class="block text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
          <AlertTriangle class="w-4 h-4 text-rose-600" />
          علت و توضیحات رد مدرک تحصیلی
          <span class="text-rose-600 font-bold">*</span>
        </label>
        <textarea
          v-model="rejectionReason"
          rows="3"
          placeholder="علت رد شدن مدرک را با ذکر دقیق جزئیات بنویسید..."
          :class="[
            'w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 transition',
            isRejectionReasonEmpty && touched
              ? 'border-rose-500 focus:ring-rose-400 ring-1 ring-rose-300'
              : 'border-rose-300 dark:border-rose-800/80 focus:ring-rose-500',
          ]"
        />
        <p v-if="isRejectionReasonEmpty" class="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
          <span>&bull;</span>
          <span>در صورت رد مدرک، ثبت علت رد الزامی است.</span>
        </p>
      </div>

      <!-- Additional Expert Comment / Audit Note (Optional) -->
      <div class="space-y-1.5">
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <FileText class="w-3.5 h-3.5 text-slate-400" />
          یادداشت کارشناس جهت ثبت در تاریخچه لاگ (اختیاری)
        </label>
        <textarea
          v-model="expertComment"
          rows="2"
          placeholder="توضیحات تکمیلی، شماره یا کد رهگیری استعلام یا یادداشت داخلی..."
          class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
        />
      </div>

      <!-- Modal Actions -->
      <div class="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
        <span class="text-[11px] text-slate-400">
          تغییر وضعیت همراه با هویت کارشناس در تاریخچه سوابق ثبت می‌گردد.
        </span>

        <div class="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="md"
            @click="emit('update:open', false)"
          >
            انصراف
          </Button>

          <Button
            type="button"
            :variant="selectedStatus === 'REJECTED' ? 'outline' : 'primary'"
            :class="[
              selectedStatus === 'REJECTED'
                ? '!bg-rose-600 !hover:bg-rose-700 !text-white !border-rose-600 font-bold'
                : selectedStatus === 'APPROVED'
                ? '!bg-emerald-600 !hover:bg-emerald-700 !text-white font-bold'
                : '',
            ]"
            size="md"
            :loading="isSubmitting"
            :disabled="isSubmitDisabled"
            @click="handleSubmitDecision"
          >
            ثبت تصمیم کارشناسی
          </Button>
        </div>
      </div>
    </div>
  </Modal>
</template>
