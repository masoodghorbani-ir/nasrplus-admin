<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import { membersApi } from '@/api';
import { useLookupsStore, useNotificationStore } from '@/stores';
import type {
  Member,
  IAcademicQualification,
  QualificationVerificationStatus,
} from '@/types';
import {
  Button,
  Badge,
  ConfirmDialog,
  EmptyState,
} from '@/components/ui';
import { toPersianDigits, formatPersianDate } from '@/utils/formatters';
import { extractErrorMessage } from '@/utils/errors';
import QualificationFormModal from './QualificationFormModal.vue';
import VerifyQualificationModal from './VerifyQualificationModal.vue';
import VerificationLogsTimeline from './VerificationLogsTimeline.vue';
import {
  GraduationCap,
  Building2,
  MapPin,
  Calendar,
  Award,
  BookOpen,
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
  Lock,
} from 'lucide-vue-next';

interface Props {
  memberId: string;
  member?: Member | null;
  allowVerify?: boolean;
  restrictEditTime?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  member: null,
  allowVerify: true,
  restrictEditTime: undefined,
});

const isTimeRestricted = computed(() => {
  if (props.restrictEditTime !== undefined) {
    return props.restrictEditTime;
  }
  return !props.allowVerify;
});

const EDIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes in milliseconds
const now = ref(Date.now());
let timerInterval: ReturnType<typeof setInterval> | null = null;

const emit = defineEmits<{
  (e: 'updated'): void;
}>();

const lookupsStore = useLookupsStore();
const notificationStore = useNotificationStore();

const qualifications = ref<IAcademicQualification[]>([]);
const isLoading = ref(false);
const isDeleting = ref(false);

// Modals State
const isFormModalOpen = ref(false);
const editingQualification = ref<IAcademicQualification | null>(null);

const isVerifyModalOpen = ref(false);
const verifyingQualification = ref<IAcademicQualification | null>(null);

const isTimelineModalOpen = ref(false);
const timelineQualification = ref<IAcademicQualification | null>(null);

const itemToDelete = ref<IAcademicQualification | null>(null);

const memberFullName = computed(() => {
  if (props.member) {
    return `${props.member.firstName || ''} ${props.member.lastName || ''}`.trim();
  }
  return '';
});

onMounted(() => {
  lookupsStore.fetchAllLookups();
  if (props.memberId) {
    loadQualifications();
  }
  timerInterval = setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
});

function getRemainingEditTimeMs(item: { createdAt?: string }): number {
  if (!item?.createdAt) return 0;
  const createdTime = new Date(item.createdAt).getTime();
  if (isNaN(createdTime)) return 0;
  const elapsed = now.value - createdTime;
  const remaining = EDIT_WINDOW_MS - elapsed;
  return Math.max(0, remaining);
}

function canEditOrDelete(item: { createdAt?: string }): boolean {
  if (!isTimeRestricted.value) return true;
  return getRemainingEditTimeMs(item) > 0;
}

function formatRemainingTime(item: { createdAt?: string }): string {
  const ms = getRemainingEditTimeMs(item);
  if (ms <= 0) return 'پایان مهلت';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${toPersianDigits(minutes)} دقیقه و ${toPersianDigits(seconds)} ثانیه`;
  }
  return `${toPersianDigits(seconds)} ثانیه`;
}

watch(
  () => props.memberId,
  (newId) => {
    if (newId) {
      loadQualifications();
    }
  }
);

async function loadQualifications() {
  if (!props.memberId) return;
  isLoading.value = true;
  try {
    const res = await membersApi.getMemberQualifications(props.memberId);
    if (res.success && Array.isArray(res.data)) {
      qualifications.value = res.data;
    } else if (props.member?.academicQualifications) {
      qualifications.value = props.member.academicQualifications as any;
    } else {
      qualifications.value = [];
    }
  } catch (_err) {
    // If sub-route is empty or 404, fallback to member's populated array
    if (props.member?.academicQualifications && props.member.academicQualifications.length > 0) {
      qualifications.value = props.member.academicQualifications as any;
    } else {
      qualifications.value = [];
    }
  } finally {
    isLoading.value = false;
  }
}

function openAddModal() {
  editingQualification.value = null;
  isFormModalOpen.value = true;
}

function openEditModal(qual: IAcademicQualification) {
  if (!canEditOrDelete(qual)) {
    notificationStore.warning('ویرایش و حذف تنها به مدت 10 دقیقه برای شما فعال میباشد و این زمان به پایان رسیده است.');
    return;
  }
  editingQualification.value = qual;
  isFormModalOpen.value = true;
}

function confirmDeleteQual(qual: IAcademicQualification) {
  if (!canEditOrDelete(qual)) {
    notificationStore.warning('ویرایش و حذف تنها به مدت 10 دقیقه برای شما فعال میباشد و این زمان به پایان رسیده است.');
    return;
  }
  itemToDelete.value = qual;
}

function openVerifyModal(qual: IAcademicQualification) {
  verifyingQualification.value = qual;
  isVerifyModalOpen.value = true;
}

function openTimelineModal(qual: IAcademicQualification) {
  timelineQualification.value = qual;
  isTimelineModalOpen.value = true;
}

function handleSaved(saved: IAcademicQualification) {
  const idx = qualifications.value.findIndex((q) => q._id === saved._id);
  if (idx >= 0) {
    qualifications.value[idx] = saved;
  } else {
    qualifications.value.push(saved);
  }
  emit('updated');
}

function handleVerified(updated: IAcademicQualification) {
  const idx = qualifications.value.findIndex((q) => q._id === updated._id);
  if (idx >= 0) {
    qualifications.value[idx] = updated;
  }
  emit('updated');
}

async function handleDelete() {
  if (!props.memberId || !itemToDelete.value?._id) return;

  isDeleting.value = true;
  try {
    await membersApi.deleteMemberQualification(props.memberId, itemToDelete.value._id);
    qualifications.value = qualifications.value.filter((q) => q._id !== itemToDelete.value?._id);
    notificationStore.success('مدرک تحصیلی با موفقیت حذف گردید.');
    emit('updated');
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در حذف مدرک تحصیلی'));
  } finally {
    isDeleting.value = false;
    itemToDelete.value = null;
  }
}

// Display Helpers
function displayDegreeTitle(deg: any): string {
  if (!deg) return 'نامشخص';
  if (typeof deg === 'object' && deg.title) return deg.title;
  return lookupsStore.getDegreeLevelTitle(deg);
}

function displayFieldTitle(field: any): string {
  if (!field) return 'نامشخص';
  if (typeof field === 'object' && field.title) return field.title;
  return lookupsStore.getAcademicFieldTitle(field);
}

function getStatusBadgeClasses(status: QualificationVerificationStatus): string {
  switch (status) {
    case 'APPROVED':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
    case 'REJECTED':
      return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
    case 'PENDING':
    default:
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
  }
}

function getStatusLabel(status: QualificationVerificationStatus): string {
  switch (status) {
    case 'APPROVED':
      return 'تائید شده';
    case 'REJECTED':
      return 'رد شده';
    case 'PENDING':
    default:
      return 'در انتظار تائید کارشناس';
  }
}
</script>

<template>
  <div class="space-y-4 text-right select-none" dir="rtl">
    <!-- 10-Minute Policy Banner -->
    <div
      v-if="isTimeRestricted"
      class="p-3.5 sm:p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-900/60 flex items-center gap-3 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-bold shadow-xs"
    >
      <div class="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/70 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
        <Clock class="w-5 h-5" />
      </div>
      <div class="flex-1 min-w-0">
        <span class="block">ویرایش و حذف تنها به مدت 10 دقیقه برای شما فعال میباشد</span>
        <span class="block text-2xs sm:text-xs text-amber-700 dark:text-amber-400 font-normal mt-0.5">
          پس از ثبت مدرک تحصیلی، حداکثر تا ۱۰ دقیقه فرصت ویرایش یا حذف آن را خواهید داشت.
        </span>
      </div>
    </div>

    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
          <GraduationCap class="w-5 h-5" />
        </div>
        <div>
          <h4 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>مدارک و تحصیلات دانشگاهی</span>
            <span class="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/80 px-2 py-0.5 rounded-md tabular-nums">
              {{ toPersianDigits(qualifications.length) }} مدرک
            </span>
          </h4>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            سوابق مدارک تحصیلی و وضعیت صحت‌سنجی کارشناسی دانشنامه‌های عضو
          </p>
        </div>
      </div>

      <Button
        variant="primary"
        size="sm"
        @click="openAddModal"
      >
        <Plus class="w-4 h-4 ml-1.5" />
        ثبت مدرک تحصیلی جدید
      </Button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="py-12 text-center text-xs text-slate-400">
      در حال بارگذاری مدارک تحصیلی...
    </div>

    <!-- Empty State -->
    <div v-else-if="qualifications.length === 0" class="py-6">
      <EmptyState
        title="هیچ مدرک تحصیلی برای این عضو ثبت نشده است"
        description="می‌توانید مدارک تحصیلی دانشگاهی (کاردانی، کارشناسی، ارشد، دکتری) این عضو را ثبت کنید تا فرآیند ارزیابی کارشناسی آغاز شود."
        :icon="GraduationCap"
      >
        <template #action>
          <Button variant="primary" size="sm" @click="openAddModal">
            <Plus class="w-4 h-4 ml-1.5" />
            ثبت اولین مدرک دانشگاهی
          </Button>
        </template>
      </EmptyState>
    </div>

    <!-- Qualifications Cards List -->
    <div v-else class="space-y-3.5">
      <div
        v-for="qual in qualifications"
        :key="qual._id"
        :class="[
          'p-4 rounded-2xl border transition-all duration-150 space-y-3',
          qual.verificationStatus === 'APPROVED'
            ? 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-800'
            : qual.verificationStatus === 'REJECTED'
            ? 'bg-rose-50/20 dark:bg-rose-950/10 border-rose-200/80 dark:border-rose-900/50'
            : 'bg-amber-50/20 dark:bg-amber-950/10 border-amber-200/80 dark:border-amber-900/50',
        ]"
      >
        <!-- Card Header: Title, Level, Status Badge & Actions -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/60">
          <div class="flex flex-wrap items-center gap-2">
            <!-- 1. Degree Level Badge -->
            <Badge variant="purple" size="md">
              {{ displayDegreeTitle(qual.degreeLevel) }}
            </Badge>

            <!-- Title -->
            <span class="text-sm font-bold text-slate-900 dark:text-slate-100">
              {{ qual.title }}
            </span>

            <!-- 2. Academic Field Title -->
            <span class="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
              <BookOpen class="w-3.5 h-3.5 text-brand-600" />
              {{ displayFieldTitle(qual.academicField) }}
            </span>

            <!-- 6. Status Badge -->
            <span
              :class="[
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border',
                getStatusBadgeClasses(qual.verificationStatus),
              ]"
            >
              <CheckCircle2 v-if="qual.verificationStatus === 'APPROVED'" class="w-3.5 h-3.5" />
              <XCircle v-else-if="qual.verificationStatus === 'REJECTED'" class="w-3.5 h-3.5" />
              <Clock v-else class="w-3.5 h-3.5" />
              {{ getStatusLabel(qual.verificationStatus) }}
            </span>

            <!-- 10-Minute Timer Badge (Member Portal Mode) -->
            <span
              v-if="isTimeRestricted"
              :class="[
                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold border transition-colors',
                canEditOrDelete(qual)
                  ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                  : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
              ]"
              :title="canEditOrDelete(qual) ? 'ویرایش و حذف تنها به مدت 10 دقیقه برای شما فعال میباشد' : 'مهلت ۱۰ دقیقه‌ای ویرایش و حذف به پایان رسیده است'"
            >
              <Clock v-if="canEditOrDelete(qual)" class="w-3 h-3 text-amber-600 dark:text-amber-400 animate-pulse" />
              <Lock v-else class="w-3 h-3 text-slate-400" />
              <span v-if="canEditOrDelete(qual)">مهلت ویرایش/حذف: {{ formatRemainingTime(qual) }}</span>
              <span v-else>قفل شده (اتمام ۱۰ دقیقه)</span>
            </span>
          </div>

          <!-- 7. Actions -->
          <div class="flex items-center gap-1.5 self-end lg:self-auto shrink-0">
            <!-- Verify Action Button (Expert Desk) -->
            <Button
              v-if="allowVerify"
              variant="outline"
              size="sm"
              class="text-xs text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/50"
              title="بررسی و تعیین وضعیت مدرک توسط کارشناس"
              @click="openVerifyModal(qual)"
            >
              <ShieldCheck class="w-3.5 h-3.5 ml-1" />
              بررسی مدرک
            </Button>

            <!-- Audit Logs History Button -->
            <Button
              variant="outline"
              size="sm"
              class="text-xs text-slate-700 dark:text-slate-300"
              title="مشاهده گردش کار و تاریخچه تغییرات"
              @click="openTimelineModal(qual)"
            >
              <History class="w-3.5 h-3.5 ml-1" />
              تاریخچه
            </Button>

            <!-- Edit Button -->
            <Button
              variant="outline"
              size="sm"
              class="text-xs transition-opacity"
              :class="!canEditOrDelete(qual) ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-500' : ''"
              :disabled="!canEditOrDelete(qual)"
              :title="!canEditOrDelete(qual) ? 'مهلت ۱۰ دقیقه‌ای ویرایش به پایان رسیده است' : 'ویرایش مشخصات مدرک'"
              @click="openEditModal(qual)"
            >
              <Edit2 class="w-3.5 h-3.5 ml-1" />
              ویرایش
            </Button>

            <!-- Delete Button -->
            <Button
              variant="outline"
              size="sm"
              class="text-rose-600 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs transition-opacity"
              :class="!canEditOrDelete(qual) ? 'opacity-40 cursor-not-allowed border-slate-200 text-slate-400 dark:text-slate-500 hover:bg-transparent' : ''"
              :disabled="!canEditOrDelete(qual)"
              :title="!canEditOrDelete(qual) ? 'مهلت ۱۰ دقیقه‌ای حذف به پایان رسیده است' : 'حذف مدرک تحصیلی'"
              @click="confirmDeleteQual(qual)"
            >
              <Trash2 class="w-3.5 h-3.5 ml-1" />
              حذف
            </Button>
          </div>
        </div>

        <!-- REJECTION ALERT BOX (Strict UX Rule) -->
        <div
          v-if="qual.verificationStatus === 'REJECTED' && qual.rejectionReason"
          class="p-3 bg-rose-50/90 dark:bg-rose-950/40 border-r-4 border-r-rose-600 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs flex items-start gap-2.5 text-rose-900 dark:text-rose-200"
        >
          <AlertTriangle class="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div class="leading-relaxed">
            <strong class="font-bold text-rose-700 dark:text-rose-300 ml-1">
              علت رد مدرک:
            </strong>
            <span>{{ qual.rejectionReason }}</span>
          </div>
        </div>

        <!-- Card Body: Grid Details -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <!-- 3. University & City -->
          <div class="p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
            <span class="text-slate-400 block text-[10px] mb-0.5 flex items-center gap-1">
              <Building2 class="w-3 h-3 text-blue-500" />
              دانشگاه / موسسه:
            </span>
            <span class="font-bold text-slate-800 dark:text-slate-200 truncate block">
              {{ qual.institution || '—' }}
            </span>
          </div>

          <!-- City -->
          <div class="p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
            <span class="text-slate-400 block text-[10px] mb-0.5 flex items-center gap-1">
              <MapPin class="w-3 h-3 text-emerald-500" />
              شهر محل تحصیل:
            </span>
            <span class="font-bold text-slate-800 dark:text-slate-200 truncate block">
              {{ qual.city || '—' }}
            </span>
          </div>

          <!-- 4. Years -->
          <div class="p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
            <span class="text-slate-400 block text-[10px] mb-0.5 flex items-center gap-1">
              <Calendar class="w-3 h-3 text-purple-500" />
              دوره تحصیلی:
            </span>
            <span class="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
              <template v-if="qual.startYear && qual.graduationYear">
                {{ toPersianDigits(qual.startYear) }} الی {{ toPersianDigits(qual.graduationYear) }}
              </template>
              <template v-else-if="qual.graduationYear">
                فارغ‌التحصیل {{ toPersianDigits(qual.graduationYear) }}
              </template>
              <template v-else-if="qual.startYear">
                ورودی {{ toPersianDigits(qual.startYear) }}
              </template>
              <template v-else>—</template>
            </span>
          </div>

          <!-- 5. GPA -->
          <div class="p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
            <span class="text-slate-400 block text-[10px] mb-0.5 flex items-center gap-1">
              <Award class="w-3 h-3 text-amber-500" />
              معدل کل:
            </span>
            <span v-if="qual.gpa !== undefined && qual.gpa !== null" class="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {{ toPersianDigits(qual.gpa) }} <span class="text-[10px] font-normal text-slate-400">از ۲۰</span>
            </span>
            <span v-else class="text-slate-400">—</span>
          </div>
        </div>

        <!-- Description / Thesis if any -->
        <div v-if="qual.description" class="p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-xs flex items-start gap-2">
          <FileText class="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
          <p class="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
            {{ qual.description }}
          </p>
        </div>

        <!-- Verification Meta Footer (if verified) -->
        <div
          v-if="qual.verifiedAt"
          class="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800"
        >
          <span>
            بررسی‌شده در: <span class="tabular-nums font-semibold">{{ formatPersianDate(qual.verifiedAt, true) }}</span>
          </span>
          <span v-if="qual.verifiedBy">
            توسط:
            <strong class="text-slate-600 dark:text-slate-300">
              {{ typeof qual.verifiedBy === 'object' ? (qual.verifiedBy.fullName || qual.verifiedBy.username) : qual.verifiedBy }}
            </strong>
          </span>
        </div>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <QualificationFormModal
      v-model:open="isFormModalOpen"
      :member-id="memberId"
      :qualification="editingQualification"
      :member-name="memberFullName"
      @saved="handleSaved"
    />

    <!-- Verify Modal -->
    <VerifyQualificationModal
      v-model:open="isVerifyModalOpen"
      :qualification="verifyingQualification"
      :member-id="memberId"
      :member-name="memberFullName"
      @verified="handleVerified"
    />

    <!-- Audit Logs Timeline Modal -->
    <VerificationLogsTimeline
      v-model:open="isTimelineModalOpen"
      :qualification="timelineQualification"
    />

    <!-- Confirm Delete Dialog -->
    <ConfirmDialog
      :open="Boolean(itemToDelete)"
      title="حذف مدرک تحصیلی"
      :description="`آیا از حذف مدرک «${itemToDelete?.title || ''}» اطمینان دارید؟ این عملیات قابل بازگشت نیست.`"
      confirm-text="بله، حذف مدرک"
      cancel-text="انصراف"
      danger
      :loading="isDeleting"
      @confirm="handleDelete"
      @cancel="itemToDelete = null"
    />
  </div>
</template>
