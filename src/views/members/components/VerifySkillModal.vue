<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { membersApi } from '@/api';
import { useNotificationStore } from '@/stores';
import type {
  IMemberSkill,
  SkillVerificationStatus,
  IVerifySkillPayload,
} from '@/types';
import { Modal, Button } from '@/components/ui';
import { getSelfAssessmentInfo, calculateExperienceDuration } from '@/utils/skills';
import { formatPersianDate, toPersianDigits } from '@/utils/formatters';
import { extractErrorMessage } from '@/utils/errors';
import CertificatePreviewModal from './CertificatePreviewModal.vue';
import {
  CheckCircle2,
  XCircle,
  Award,
  Calendar,
  AlertTriangle,
  FileText,
  ShieldCheck,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from 'lucide-vue-next';

interface Props {
  open: boolean;
  skill: IMemberSkill | null;
  memberId?: string;
  memberName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  skill: null,
  memberId: '',
  memberName: '',
});

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'verified', updated: IMemberSkill): void;
}>();

const notificationStore = useNotificationStore();

const isSubmitting = ref(false);
const selectedStatus = ref<SkillVerificationStatus>('APPROVED');
const rejectionReason = ref('');
const expertComment = ref('');
const touched = ref(false);
const isPreviewModalOpen = ref(false);

// Reset / Initialize on modal open
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.skill) {
      touched.value = false;
      expertComment.value = '';
      if (props.skill.verificationStatus === 'REJECTED') {
        selectedStatus.value = 'REJECTED';
        rejectionReason.value = props.skill.rejectionReason || '';
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

// Clear rejection reason when switching to APPROVED
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
const specializationTitle = computed(() => {
  if (!props.skill) return '';
  const spec = props.skill.specializationId;
  if (typeof spec === 'object' && spec?.title) return spec.title;
  return String(spec || '');
});

const selfAssessment = computed(() => {
  return getSelfAssessmentInfo(props.skill?.selfAssessmentPercentage);
});

const experienceDuration = computed(() => {
  return calculateExperienceDuration(props.skill?.startDate);
});

const memberDisplayName = computed(() => {
  if (props.memberName) return props.memberName;
  if (props.skill?.memberId && typeof props.skill.memberId === 'object') {
    const m = props.skill.memberId;
    return `${m.firstName || ''} ${m.lastName || ''}`.trim();
  }
  return '';
});

async function handleSubmitDecision() {
  touched.value = true;
  if (isSubmitDisabled.value) return;
  if (!props.skill?._id) return;

  isSubmitting.value = true;
  try {
    const payload: IVerifySkillPayload = {
      status: selectedStatus.value,
      rejectionReason: selectedStatus.value === 'REJECTED' ? rejectionReason.value.trim() : undefined,
      comment: expertComment.value.trim() || undefined,
    };

    let updated: IMemberSkill;
    const mId = props.memberId || (typeof props.skill.memberId === 'object' ? props.skill.memberId?._id : props.skill.memberId);

    if (mId) {
      const res = await membersApi.verifyMemberSkill(mId, props.skill._id, payload);
      updated = res.data;
    } else {
      const res = await membersApi.verifyGlobalSkill(props.skill._id, payload);
      updated = res.data;
    }

    if (selectedStatus.value === 'APPROVED') {
      notificationStore.success('مهارت و گواهینامه مربوطه با موفقیت تائید شد.', 'نتیجه کارشناسی مهارت ثبت شد');
    } else {
      notificationStore.warning('مهارت رد شد و علت رد در کارنامه عضو ثبت گردید.', 'نتیجه کارشناسی مهارت ثبت شد');
    }

    emit('verified', updated);
    emit('update:open', false);
  } catch (err: any) {
    notificationStore.error(extractErrorMessage(err) || 'عملیات با خطا مواجه شد.', 'خطا در ثبت تصمیم کارشناسی');
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
          <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center font-bold">
            <ShieldCheck class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>بررسی و کارشناسی مهارت و گواهینامه عضو</span>
            </h3>
            <p v-if="memberDisplayName" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              عضو: <span class="font-bold text-slate-700 dark:text-slate-300">{{ memberDisplayName }}</span>
            </p>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal Content -->
    <div v-if="skill" class="space-y-5 text-right select-none" dir="rtl">
      <!-- 1. Skill & Certificate Summary Card -->
      <div class="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3.5">
        <div class="flex items-start justify-between gap-3">
          <div class="space-y-1">
            <span class="text-2xs font-bold text-brand-600 dark:text-brand-400">رسته تخصصی / نوع مهارت:</span>
            <h4 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Award class="w-4 h-4 text-brand-500 shrink-0" />
              <span>{{ specializationTitle }}</span>
            </h4>
          </div>

          <!-- Self Assessment Level Pill -->
          <div
            :class="[
              'px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shrink-0',
              selfAssessment.badgeClass
            ]"
          >
            <Sparkles class="w-3.5 h-3.5" />
            <span>{{ selfAssessment.label }}</span>
            <span class="tabular-nums font-black">{{ toPersianDigits(skill.selfAssessmentPercentage) }}٪</span>
          </div>
        </div>

        <!-- Experience & Certificate Info Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
          <!-- Start Date -->
          <div class="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Calendar class="w-4 h-4 text-slate-400 shrink-0" />
            <span>شروع فعالیت:</span>
            <span class="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
              {{ skill.startDate ? formatPersianDate(skill.startDate) : '—' }}
            </span>
            <span v-if="experienceDuration" class="text-2xs text-brand-600 dark:text-brand-400 font-medium">
              ({{ experienceDuration }})
            </span>
          </div>

          <!-- Certificate Status -->
          <div class="flex items-center gap-2">
            <FileText class="w-4 h-4 text-slate-400 shrink-0" />
            <span class="text-slate-600 dark:text-slate-400">گواهینامه معتبر:</span>
            <span v-if="skill.hasCertificate" class="font-bold text-emerald-600 dark:text-emerald-400">
              دارد ({{ skill.certificateTitle || 'مدرک رسمی' }})
            </span>
            <span v-else class="text-slate-500">
              فاقد گواهینامه (صرفاً خوداظهاری)
            </span>
          </div>
        </div>

        <!-- Certificate File Preview Trigger -->
        <div
          v-if="skill.certificateFile"
          class="p-2.5 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/60 rounded-xl flex items-center justify-between gap-3 text-xs"
        >
          <div class="flex items-center gap-2 truncate text-purple-700 dark:text-purple-300 font-bold">
            <Award class="w-4 h-4 shrink-0 text-purple-600" />
            <span class="truncate">{{ skill.certificateTitle || 'فایل ضمیمه گواهینامه معتبر' }}</span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            class="text-xs shrink-0"
            @click="isPreviewModalOpen = true"
          >
            <ExternalLink class="w-3.5 h-3.5 ml-1" />
            مشاهده سند مدرک
          </Button>
        </div>

        <!-- Member Notes / Description if present -->
        <div v-if="skill.description" class="pt-2 text-2xs text-slate-600 dark:text-slate-400">
          <span class="font-bold text-slate-700 dark:text-slate-300">توضیحات عضو:</span>
          <p class="mt-0.5 leading-relaxed bg-white/70 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-200/50 dark:border-slate-800">
            {{ skill.description }}
          </p>
        </div>
      </div>

      <!-- 2. Decision Choice: Approve vs Reject -->
      <div class="space-y-2">
        <label class="text-xs font-bold text-slate-700 dark:text-slate-200 block">
          تصمیم کارشناس صنف:
        </label>

        <div class="grid grid-cols-2 gap-3">
          <!-- Option APPROVED -->
          <button
            type="button"
            :class="[
              'p-3.5 rounded-xl border-2 flex items-center justify-center gap-2.5 font-bold text-xs transition cursor-pointer',
              selectedStatus === 'APPROVED'
                ? 'border-emerald-500 bg-emerald-50/70 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 shadow-2xs'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300'
            ]"
            @click="selectedStatus = 'APPROVED'"
          >
            <CheckCircle2 class="w-4 h-4 text-emerald-600" />
            <span>تائید مهارت و گواهینامه</span>
          </button>

          <!-- Option REJECTED -->
          <button
            type="button"
            :class="[
              'p-3.5 rounded-xl border-2 flex items-center justify-center gap-2.5 font-bold text-xs transition cursor-pointer',
              selectedStatus === 'REJECTED'
                ? 'border-rose-500 bg-rose-50/70 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200 shadow-2xs'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-rose-300'
            ]"
            @click="selectedStatus = 'REJECTED'"
          >
            <XCircle class="w-4 h-4 text-rose-600" />
            <span>رد مهارت یا گواهینامه</span>
          </button>
        </div>
      </div>

      <!-- 3. Mandatory Rejection Reason Textarea (when REJECTED) -->
      <div v-if="selectedStatus === 'REJECTED'" class="space-y-1.5 animate-fadeIn">
        <label class="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
          <AlertTriangle class="w-3.5 h-3.5" />
          <span>علت رد مهارت (الزامی)</span>
          <span class="text-rose-500">*</span>
        </label>

        <textarea
          v-model="rejectionReason"
          rows="3"
          placeholder="علت رد را به صورت دقیق بنویسید..."
          class="w-full px-3 py-2 text-xs rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/20 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition resize-none"
        ></textarea>

        <p v-if="touched && isRejectionReasonEmpty" class="text-2xs font-bold text-rose-500">
          درج علت رد الزامی است و تا زمان ورود آن، امکان ثبت رد وجود ندارد.
        </p>
      </div>

      <!-- 4. Optional Review Note / Comment -->
      <div class="space-y-1.5">
        <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <MessageSquare class="w-3.5 h-3.5 text-slate-500" />
          <span>یادداشت کارشناس جهت ثبت در تاریخچه ممیزی</span>
          <span class="text-2xs font-normal text-slate-400">(اختیاری)</span>
        </label>
        <textarea
          v-model="expertComment"
          rows="2"
          placeholder="یادداشت تکمیلی کارشناس برای مستندسازی در گزارش بررسی..."
          class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition resize-none"
        ></textarea>
      </div>
    </div>

    <!-- Modal Footer Actions -->
    <template #footer>
      <div class="w-full flex items-center justify-between" dir="rtl">
        <Button
          variant="secondary"
          :disabled="isSubmitting"
          @click="emit('update:open', false)"
        >
          انصراف
        </Button>

        <Button
          :variant="selectedStatus === 'APPROVED' ? 'primary' : 'danger'"
          :loading="isSubmitting"
          :disabled="isSubmitDisabled"
          @click="handleSubmitDecision"
        >
          <component :is="selectedStatus === 'APPROVED' ? CheckCircle2 : XCircle" class="w-4 h-4 ml-1.5" />
          {{ selectedStatus === 'APPROVED' ? 'تائید نهایی مهارت' : 'ثبت قطعی رد مهارت' }}
        </Button>
      </div>
    </template>
  </Modal>

  <!-- Separate Certificate Preview Modal -->
  <CertificatePreviewModal
    v-if="skill"
    v-model:open="isPreviewModalOpen"
    :file-url="skill.certificateFile"
    :title="skill.certificateTitle || 'گواهینامه تخصصی'"
    :specialization-title="specializationTitle"
    :member-name="memberDisplayName"
  />
</template>
