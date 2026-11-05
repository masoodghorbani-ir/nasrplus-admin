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
  Clock,
  Eye,
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
      <div class="bg-gradient-to-b from-slate-50 to-slate-100/60 dark:from-slate-800/50 dark:to-slate-900/50 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 space-y-4 shadow-xs">
        <!-- Header: Specialization Title & Self-Assessment Pill/Meter -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70 dark:border-slate-700/60">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/70 dark:border-purple-800/70 flex items-center justify-center shrink-0 shadow-2xs">
              <Award class="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div class="min-w-0">
              <span class="text-2xs font-semibold text-slate-400 dark:text-slate-500 block">رسته تخصصی / نوع مهارت:</span>
              <h4 class="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                {{ specializationTitle }}
              </h4>
            </div>
          </div>

          <!-- Self Assessment Level Pill & Progress bar -->
          <div class="flex flex-col sm:items-end gap-1.5 shrink-0 self-start sm:self-center">
            <div
              :class="[
                'px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-2xs',
                selfAssessment.badgeClass
              ]"
            >
              <Sparkles class="w-3.5 h-3.5 shrink-0" />
              <span>{{ selfAssessment.label }}</span>
              <span class="inline-block w-1 h-1 rounded-full bg-current opacity-40"></span>
              <span class="tabular-nums font-black">{{ toPersianDigits(skill.selfAssessmentPercentage) }}٪</span>
            </div>
            <!-- Mini progress indicator -->
            <div class="w-28 sm:w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                :class="['h-full rounded-full transition-all duration-300', selfAssessment.progressBarClass]"
                :style="{ width: `${skill.selfAssessmentPercentage}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- 2 Structured Cards: Experience & Certificate Status -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- Box 1: Experience & Start Date -->
          <div class="bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 flex flex-col justify-between gap-3 shadow-2xs">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                <div class="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
                  <Calendar class="w-4 h-4" />
                </div>
                <span>شروع فعالیت و سابقه</span>
              </div>
              <span
                v-if="experienceDuration"
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 border border-brand-200/70 dark:border-brand-800/60 shrink-0"
              >
                <Clock class="w-3 h-3 text-brand-500 shrink-0" />
                <span>{{ experienceDuration }}</span>
              </span>
            </div>

            <div class="pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span class="text-slate-500 dark:text-slate-400 text-2xs">تاریخ آغاز:</span>
              <span
                dir="ltr"
                class="font-mono font-bold text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/60 tabular-nums whitespace-nowrap"
              >
                {{ skill.startDate ? formatPersianDate(skill.startDate) : '—' }}
              </span>
            </div>
          </div>

          <!-- Box 2: Certificate Status & Document Preview -->
          <div
            :class="[
              'rounded-xl border p-3.5 flex flex-col justify-between gap-3 shadow-2xs transition-colors',
              skill.hasCertificate
                ? 'bg-purple-50/30 dark:bg-purple-950/20 border-purple-200/80 dark:border-purple-800/60'
                : 'bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800'
            ]"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                <div
                  :class="[
                    'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                    skill.hasCertificate
                      ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  ]"
                >
                  <FileText class="w-4 h-4" />
                </div>
                <span>گواهینامه و مدرک</span>
              </div>

              <!-- Status Tag -->
              <span
                v-if="skill.hasCertificate"
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/60 shrink-0"
              >
                <CheckCircle2 class="w-3 h-3 text-emerald-500" />
                دارای مدرک
              </span>
              <span
                v-else
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 shrink-0"
              >
                فاقد گواهینامه
              </span>
            </div>

            <div class="pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
              <div class="min-w-0 flex items-center gap-1.5">
                <span
                  v-if="skill.hasCertificate"
                  class="text-xs font-bold text-purple-900 dark:text-purple-200 truncate"
                  :title="skill.certificateTitle"
                >
                  {{ skill.certificateTitle || 'مدرک رسمی ثبت‌شده' }}
                </span>
                <span v-else class="text-2xs text-slate-400">
                  صرفاً بر اساس خوداظهاری
                </span>
              </div>

              <!-- Document Preview Action -->
              <Button
                v-if="skill.certificateFile"
                type="button"
                variant="outline"
                size="xs"
                class="h-7 px-2.5 text-2xs font-bold shrink-0 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/80 bg-white dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-purple-950/50 shadow-2xs"
                @click="isPreviewModalOpen = true"
              >
                <Eye class="w-3.5 h-3.5 ml-1 text-purple-600 dark:text-purple-400" />
                مشاهده سند مدرک
                <ExternalLink class="w-2.5 h-2.5 mr-1 opacity-60" />
              </Button>
            </div>
          </div>
        </div>

        <!-- Member Notes / Description if present -->
        <div
          v-if="skill.description"
          class="bg-white/90 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-200/70 dark:border-slate-800 text-xs space-y-1"
        >
          <div class="flex items-center gap-1.5 text-2xs font-bold text-slate-600 dark:text-slate-300">
            <MessageSquare class="w-3.5 h-3.5 text-slate-400" />
            <span>توضیحات و اظهارات عضو:</span>
          </div>
          <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pr-5 font-normal">
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
