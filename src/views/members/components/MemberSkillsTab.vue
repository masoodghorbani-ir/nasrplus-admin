<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { membersApi } from '@/api';
import { useLookupsStore, useNotificationStore } from '@/stores';
import type {
  Member,
  IMemberSkill,
} from '@/types';
import {
  Button,
  ConfirmDialog,
  EmptyState,
} from '@/components/ui';
import { toPersianDigits, formatPersianDate } from '@/utils/formatters';
import { extractErrorMessage } from '@/utils/errors';
import {
  getSelfAssessmentInfo,
  getSkillStatusInfo,
  calculateExperienceDuration,
  seedSampleSkillsIfEmpty,
} from '@/utils/skills';
import MemberSkillFormModal from './MemberSkillFormModal.vue';
import VerifySkillModal from './VerifySkillModal.vue';
import SkillVerificationLogsTimeline from './SkillVerificationLogsTimeline.vue';
import CertificatePreviewModal from './CertificatePreviewModal.vue';
import {
  Award,
  Calendar,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  History,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
} from 'lucide-vue-next';

interface Props {
  memberId: string;
  member?: Member | null;
  allowVerify?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  member: null,
  allowVerify: true,
});

const emit = defineEmits<{
  (e: 'updated'): void;
}>();

const lookupsStore = useLookupsStore();
const notificationStore = useNotificationStore();

const skills = ref<IMemberSkill[]>([]);
const isLoading = ref(false);
const isDeleting = ref(false);

// Modals State
const isFormModalOpen = ref(false);
const editingSkill = ref<IMemberSkill | null>(null);

const isVerifyModalOpen = ref(false);
const verifyingSkill = ref<IMemberSkill | null>(null);

const isTimelineModalOpen = ref(false);
const timelineSkill = ref<IMemberSkill | null>(null);

const isPreviewModalOpen = ref(false);
const previewCertificateUrl = ref('');
const previewCertificateTitle = ref('');
const previewSpecializationTitle = ref('');

const itemToDelete = ref<IMemberSkill | null>(null);

const memberFullName = computed(() => {
  if (props.member) {
    return `${props.member.firstName || ''} ${props.member.lastName || ''}`.trim();
  }
  return '';
});

// Stats summary
const approvedCount = computed(() => skills.value.filter((s) => s.verificationStatus === 'APPROVED').length);
const pendingCount = computed(() => skills.value.filter((s) => s.verificationStatus === 'PENDING' || !s.verificationStatus).length);
const withCertCount = computed(() => skills.value.filter((s) => s.hasCertificate).length);

onMounted(() => {
  lookupsStore.fetchAllLookups();
  if (props.memberId) {
    loadSkills();
  }
});

watch(
  () => props.memberId,
  (newId) => {
    if (newId) {
      loadSkills();
    }
  }
);

async function loadSkills() {
  if (!props.memberId) return;
  isLoading.value = true;
  try {
    if (props.member) {
      seedSampleSkillsIfEmpty([props.member], lookupsStore.specializations);
    }
    const res = await membersApi.getMemberSkills(props.memberId);
    if (res.success && Array.isArray(res.data)) {
      skills.value = res.data;
    } else {
      skills.value = [];
    }
  } catch (_err) {
    skills.value = [];
  } finally {
    isLoading.value = false;
  }
}

function handleOpenCreate() {
  editingSkill.value = null;
  isFormModalOpen.value = true;
}

function handleOpenEdit(skill: IMemberSkill) {
  editingSkill.value = skill;
  isFormModalOpen.value = true;
}

function handleOpenVerify(skill: IMemberSkill) {
  verifyingSkill.value = skill;
  isVerifyModalOpen.value = true;
}

function handleOpenTimeline(skill: IMemberSkill) {
  timelineSkill.value = skill;
  isTimelineModalOpen.value = true;
}

function handleOpenPreview(skill: IMemberSkill) {
  previewCertificateUrl.value = skill.certificateFile || '';
  previewCertificateTitle.value = skill.certificateTitle || 'گواهینامه تخصصی';
  previewSpecializationTitle.value = getSpecTitle(skill);
  isPreviewModalOpen.value = true;
}

function handleConfirmDelete(skill: IMemberSkill) {
  itemToDelete.value = skill;
}

async function executeDelete() {
  if (!itemToDelete.value?._id || !props.memberId) return;
  isDeleting.value = true;
  try {
    await membersApi.deleteMemberSkill(props.memberId, itemToDelete.value._id);
    notificationStore.success('مهارت مورد نظر با موفقیت حذف گردید.', 'حذف موفق');
    skills.value = skills.value.filter((s) => s._id !== itemToDelete.value?._id);
    itemToDelete.value = null;
    emit('updated');
  } catch (err: any) {
    notificationStore.error(extractErrorMessage(err) || 'خطا در انجام عملیات حذف.', 'خطا در حذف مهارت');
  } finally {
    isDeleting.value = false;
  }
}

function handleSkillSaved(_savedSkill: IMemberSkill) {
  loadSkills();
  emit('updated');
}

function handleSkillVerified(updated: IMemberSkill) {
  const index = skills.value.findIndex((s) => s._id === updated._id);
  if (index !== -1) {
    skills.value[index] = updated;
  } else {
    loadSkills();
  }
  emit('updated');
}

function getSpecTitle(skill: IMemberSkill): string {
  if (typeof skill.specializationId === 'object' && skill.specializationId?.title) {
    return skill.specializationId.title;
  }
  const found = lookupsStore.specializations.find((s) => s._id === skill.specializationId);
  return found?.title || String(skill.specializationId || 'نامشخص');
}

function getSpecCode(skill: IMemberSkill): string {
  if (typeof skill.specializationId === 'object' && skill.specializationId?.code) {
    return skill.specializationId.code;
  }
  const found = lookupsStore.specializations.find((s) => s._id === skill.specializationId);
  return found?.code || '';
}
</script>

<template>
  <div class="space-y-4 text-right" dir="rtl">
    <!-- Top Header: Title, Stats & Add Action -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center">
            <Award class="w-4 h-4" />
          </div>
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">
            مهارت‌ها و تخصص‌های عضو
          </h3>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          سوابق مهارت‌های تخصصی، درجات خوداظهاری، مدارک آزمون و گواهینامه‌های رسمی صنف
        </p>
      </div>

      <!-- Stats Counters & Add Button -->
      <div class="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
        <!-- Count Badges -->
        <div v-if="skills.length > 0" class="flex items-center gap-1.5 text-xs">
          <span class="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold border border-emerald-200/60 dark:border-emerald-800/60" title="تائید شده">
            {{ toPersianDigits(approvedCount) }} تائید شده
          </span>
          <span v-if="pendingCount > 0" class="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 font-bold border border-amber-200/60 dark:border-amber-800/60" title="در انتظار بررسی">
            {{ toPersianDigits(pendingCount) }} در انتظار
          </span>
          <span v-if="withCertCount > 0" class="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 font-bold border border-purple-200/60 dark:border-purple-800/60" title="دارای گواهینامه">
            {{ toPersianDigits(withCertCount) }} با مدرک
          </span>
        </div>

        <Button
          variant="primary"
          size="sm"
          class="shrink-0"
          @click="handleOpenCreate"
        >
          <Plus class="w-4 h-4 ml-1" />
          ثبت مهارت جدید
        </Button>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="space-y-3">
      <div
        v-for="i in 2"
        :key="i"
        class="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse space-y-3"
      >
        <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3"></div>
        <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-2/3"></div>
        <div class="h-2 bg-slate-200 dark:bg-slate-800 rounded-full w-full"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="skills.length === 0"
      class="p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-center"
    >
      <EmptyState
        :icon="Award"
        title="هنوز مهارتی برای این عضو ثبت نشده است"
        description="می‌توانید تخصص‌های شغلی، درصد خوداظهاری و گواهینامه‌های دوره‌های آموزشی عضو را ثبت نمایید."
      >
        <template #actions>
          <Button variant="primary" size="sm" @click="handleOpenCreate">
            <Plus class="w-4 h-4 ml-1.5" />
            ثبت اولین مهارت و تخصص
          </Button>
        </template>
      </EmptyState>
    </div>

    <!-- Skills List -->
    <div v-else class="space-y-3.5">
      <div
        v-for="skill in skills"
        :key="skill._id"
        :class="[
          'p-4 sm:p-5 rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-900/90 space-y-4 hover:shadow-xs',
          skill.verificationStatus === 'APPROVED'
            ? 'border-emerald-200/80 dark:border-emerald-900/50'
            : skill.verificationStatus === 'REJECTED'
            ? 'border-rose-200/80 dark:border-rose-900/50'
            : 'border-slate-200/80 dark:border-slate-800'
        ]"
      >
        <!-- Card Top Bar: Specialization & Verification Status Badge -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div class="flex items-center gap-2 flex-wrap">
            <div class="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 flex items-center justify-center font-bold">
              <Award class="w-4 h-4" />
            </div>
            <div>
              <h4 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{{ getSpecTitle(skill) }}</span>
                <span v-if="getSpecCode(skill)" class="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-500 font-bold">
                  {{ getSpecCode(skill) }}
                </span>
              </h4>
              <p class="text-2xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span class="flex items-center gap-1">
                  <Calendar class="w-3 h-3" />
                  شروع فعالیت:
                  <span class="font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                    {{ skill.startDate ? formatPersianDate(skill.startDate) : '—' }}
                  </span>
                </span>
                <span v-if="calculateExperienceDuration(skill.startDate)" class="text-brand-600 dark:text-brand-400 font-medium">
                  ({{ calculateExperienceDuration(skill.startDate) }})
                </span>
              </p>
            </div>
          </div>

          <!-- Status Badge (3.3 Verification Status Badges) -->
          <div class="flex items-center gap-2 shrink-0">
            <span
              :class="[
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors',
                getSkillStatusInfo(skill.verificationStatus).badgeClass
              ]"
            >
              <component
                :is="skill.verificationStatus === 'APPROVED' ? CheckCircle2 : skill.verificationStatus === 'REJECTED' ? XCircle : Clock"
                class="w-3.5 h-3.5"
              />
              <span>{{ getSkillStatusInfo(skill.verificationStatus).label }}</span>
            </span>
          </div>
        </div>

        <!-- Rejection Reason Alert Box (If REJECTED) -->
        <div
          v-if="skill.verificationStatus === 'REJECTED' && skill.rejectionReason"
          class="p-3 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 rounded-xl space-y-1 text-xs"
        >
          <div class="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300">
            <AlertTriangle class="w-4 h-4 shrink-0" />
            <span>علت رد مهارت توسط کارشناس صنف:</span>
          </div>
          <p class="text-rose-600 dark:text-rose-400 leading-relaxed text-2xs pr-5">
            {{ skill.rejectionReason }}
          </p>
        </div>

        <!-- Middle Details: Self-Assessment Degree & Certificate Status -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs">
          <!-- 1. Self-Assessment Degree & Compact Progress -->
          <div class="flex items-center justify-between sm:justify-start gap-2.5 flex-wrap">
            <span class="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shrink-0">
              <Sparkles class="w-3.5 h-3.5 text-brand-500 shrink-0" />
              درجه مهارت:
            </span>

            <span
              :class="[
                'px-2 py-0.5 rounded-md text-2xs font-bold border shrink-0',
                getSelfAssessmentInfo(skill.selfAssessmentPercentage).badgeClass
              ]"
            >
              {{ getSelfAssessmentInfo(skill.selfAssessmentPercentage).label }}
            </span>

            <!-- Compact Mini Progress Bar + Percentage -->
            <div class="flex items-center gap-2 shrink-0">
              <div class="h-2 w-24 sm:w-28 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  :class="['h-full rounded-full transition-all duration-300', getSelfAssessmentInfo(skill.selfAssessmentPercentage).progressBarClass]"
                  :style="{ width: `${skill.selfAssessmentPercentage}%` }"
                ></div>
              </div>
              <span class="font-black tabular-nums text-xs text-slate-900 dark:text-slate-100">
                {{ toPersianDigits(skill.selfAssessmentPercentage) }}٪
              </span>
            </div>
          </div>

          <!-- 2. Certificate Status -->
          <div class="flex items-center justify-between md:justify-end gap-2.5 border-t md:border-t-0 pt-2.5 md:pt-0 border-slate-200/60 dark:border-slate-700/60">
            <div class="flex items-center gap-1.5 min-w-0">
              <FileText class="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span class="text-slate-500 dark:text-slate-400 text-xs shrink-0">گواهینامه:</span>
              <span
                v-if="skill.hasCertificate"
                class="font-bold text-purple-700 dark:text-purple-300 text-xs truncate max-w-[180px] sm:max-w-[220px]"
                :title="skill.certificateTitle"
              >
                {{ skill.certificateTitle || 'دارای گواهینامه معتبر' }}
              </span>
              <span v-else class="text-slate-400 dark:text-slate-500 text-xs">
                فاقد گواهینامه (صرفاً خوداظهاری)
              </span>
            </div>

            <!-- Certificate Action Preview Button if file exists -->
            <Button
              v-if="skill.hasCertificate && skill.certificateFile"
              variant="outline"
              size="xs"
              class="h-7 text-2xs shrink-0 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40"
              @click="handleOpenPreview(skill)"
            >
              <ExternalLink class="w-3 h-3 ml-1 text-purple-600 shrink-0" />
              مشاهده مدرک
            </Button>
          </div>
        </div>

        <!-- Description Note if Present -->
        <div v-if="skill.description" class="text-2xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-xl border border-slate-200/40 dark:border-slate-800/40">
          <span class="font-bold text-slate-700 dark:text-slate-300">سوابق و توضیحات: </span>
          <span>{{ skill.description }}</span>
        </div>

        <!-- Card Footer Actions -->
        <div class="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap">
          <!-- Audit History Trigger -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition cursor-pointer"
            title="مشاهده تاریخچه گردش کار و لاگ ممیزی"
            @click="handleOpenTimeline(skill)"
          >
            <History class="w-3.5 h-3.5" />
            <span>تاریخچه بررسی ({{ toPersianDigits(skill.verificationLogs?.length || 1) }})</span>
          </button>

          <!-- Action Buttons Group -->
          <div class="flex items-center gap-1.5">
            <!-- Expert Review Button (Admin) -->
            <Button
              v-if="allowVerify"
              variant="outline"
              size="sm"
              class="h-8 text-xs font-bold text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800 hover:bg-brand-50 dark:hover:bg-brand-950/40"
              title="کارشناسی و تعیین وضعیت مهارت"
              @click="handleOpenVerify(skill)"
            >
              <ShieldCheck class="w-3.5 h-3.5 ml-1 text-brand-600 shrink-0" />
              کارشناسی و تائید
            </Button>

            <!-- Edit Button -->
            <Button
              variant="outline"
              size="sm"
              class="h-8 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
              title="ویرایش مهارت"
              @click="handleOpenEdit(skill)"
            >
              <Edit2 class="w-3.5 h-3.5 ml-1 text-slate-500 dark:text-slate-400 shrink-0" />
              ویرایش
            </Button>

            <!-- Delete Button -->
            <Button
              variant="outline"
              size="sm"
              class="h-8 text-xs font-medium text-rose-600 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              title="حذف مهارت"
              @click="handleConfirmDelete(skill)"
            >
              <Trash2 class="w-3.5 h-3.5 ml-1 text-rose-500 shrink-0" />
              حذف
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <!-- 1. Form Modal -->
    <MemberSkillFormModal
      v-model:open="isFormModalOpen"
      :member-id="memberId"
      :skill="editingSkill"
      :member-name="memberFullName"
      @saved="handleSkillSaved"
    />

    <!-- 2. Verify Modal -->
    <VerifySkillModal
      v-model:open="isVerifyModalOpen"
      :skill="verifyingSkill"
      :member-id="memberId"
      :member-name="memberFullName"
      @verified="handleSkillVerified"
    />

    <!-- 3. Audit Timeline Modal -->
    <SkillVerificationLogsTimeline
      v-model:open="isTimelineModalOpen"
      :skill="timelineSkill"
    />

    <!-- 4. Certificate Preview Modal -->
    <CertificatePreviewModal
      v-model:open="isPreviewModalOpen"
      :file-url="previewCertificateUrl"
      :title="previewCertificateTitle"
      :specialization-title="previewSpecializationTitle"
      :member-name="memberFullName"
    />

    <!-- 5. Delete Confirm Dialog -->
    <ConfirmDialog
      :open="Boolean(itemToDelete)"
      title="حذف مهارت و تخصص"
      message="آیا از حذف این مهارت و پرونده گواهینامه مربوطه اطمینان دارید؟ این عملیات غیرقابل بازگشت است."
      confirm-text="بله، حذف شود"
      cancel-text="انصراف"
      variant="danger"
      :loading="isDeleting"
      @confirm="executeDelete"
      @cancel="itemToDelete = null"
    />
  </div>
</template>
