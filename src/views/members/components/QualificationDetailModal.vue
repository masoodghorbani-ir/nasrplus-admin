<script setup lang="ts">
import { computed } from 'vue';
import { useLookupsStore } from '@/stores';
import type {
  IAcademicQualification,
  QualificationVerificationStatus,
} from '@/types';
import { Modal, Button, Badge, MemberAvatar } from '@/components/ui';
import {
  toPersianDigits,
  formatPersianDate,
  formatWorkflowLogComment,
  formatWorkflowOperatorName,
} from '@/utils/formatters';
import {
  GraduationCap,
  Building2,
  MapPin,
  Calendar,
  BookOpen,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  History,
  AlertTriangle,
  User,
  Sparkles,
} from 'lucide-vue-next';

export interface ResolvedMemberInfo {
  id: string;
  personName: string;
  companyName: string;
  displayName: string;
  secondaryName: string;
  code: string;
  nationalCode: string;
  isCompany: boolean;
  profileImage?: string;
}

interface Props {
  open: boolean;
  qualification: IAcademicQualification | null;
  memberInfo?: ResolvedMemberInfo | null;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  qualification: null,
  memberInfo: null,
});

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'verify', qualification: IAcademicQualification): void;
  (e: 'timeline', qualification: IAcademicQualification): void;
  (e: 'open-member', memberId: string): void;
}>();

const lookupsStore = useLookupsStore();

function normalizeStatus(status?: string): QualificationVerificationStatus {
  if (status === 'APPROVED') return 'APPROVED';
  if (status === 'REJECTED') return 'REJECTED';
  return 'PENDING';
}

const status = computed(() => normalizeStatus(props.qualification?.verificationStatus));

const degreeTitle = computed(() => {
  if (!props.qualification) return '—';
  const deg = props.qualification.degreeLevel;
  if (typeof deg === 'object' && deg?.title) return deg.title;
  return lookupsStore.getDegreeLevelTitle(deg) || '—';
});

const fieldTitle = computed(() => {
  if (!props.qualification) return '—';
  const f = props.qualification.academicField;
  if (typeof f === 'object' && f?.title) return f.title;
  return lookupsStore.getAcademicFieldTitle(f) || '—';
});

const studyDuration = computed(() => {
  const q = props.qualification;
  if (!q?.startYear || !q?.graduationYear) return '';
  const diff = q.graduationYear - q.startYear;
  if (diff > 0) {
    return `${toPersianDigits(diff)} سال تحصیلی`;
  }
  return '';
});

function handleClose() {
  emit('update:open', false);
}

function handleVerify() {
  const q = props.qualification;
  emit('update:open', false);
  if (q) {
    emit('verify', q);
  }
}

function handleTimeline() {
  const q = props.qualification;
  emit('update:open', false);
  if (q) {
    emit('timeline', q);
  }
}

function handleOpenMember() {
  const id = props.memberInfo?.id;
  emit('update:open', false);
  if (id) {
    emit('open-member', id);
  }
}
</script>

<template>
  <Modal
    :open="open"
    size="2xl"
    @close="handleClose"
  >
    <!-- Header -->
    <template #header>
      <div v-if="qualification" class="w-full flex items-center justify-between text-right" dir="rtl">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center font-bold shadow-xs">
            <GraduationCap class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">
                جزئیات کامل مدرک تحصیلی
              </h3>
              <Badge variant="purple" size="sm">
                {{ degreeTitle }}
              </Badge>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              مشخصات تحصیلی، دانشگاه، سنوات، معدل و سوابق گردش کار کارشناسی
            </p>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal Content -->
    <div v-if="qualification" class="space-y-4 text-right select-none" dir="rtl">
      <!-- Member Overview Card -->
      <div
        v-if="memberInfo && (memberInfo.displayName || memberInfo.code)"
        class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div class="flex items-center gap-3 min-w-0">
          <MemberAvatar
            :profile-image="memberInfo.profileImage"
            :full-name="memberInfo.displayName"
            size="md"
            shape="rounded"
          />
          <div class="space-y-0.5 min-w-0">
            <div class="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
              <span>{{ memberInfo.displayName }}</span>
            </div>
            <div
              v-if="memberInfo.secondaryName"
              class="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 font-medium truncate"
            >
              <Building2 class="w-3 h-3 shrink-0" />
              <span>{{ memberInfo.secondaryName }}</span>
            </div>
            <div class="flex flex-wrap items-center gap-2 text-2xs text-slate-500 pt-0.5">
              <span
                v-if="memberInfo.code"
                class="bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold px-1.5 py-0.2 rounded tabular-nums"
              >
                کد عضویت: {{ toPersianDigits(memberInfo.code) }}
              </span>
              <span v-if="memberInfo.nationalCode" class="tabular-nums">
                کد ملی: {{ toPersianDigits(memberInfo.nationalCode) }}
              </span>
            </div>
          </div>
        </div>

        <Button
          v-if="memberInfo.id"
          variant="outline"
          size="xs"
          class="shrink-0 self-end sm:self-center"
          title="مشاهده پرونده کامل عضو"
          @click="handleOpenMember"
        >
          <User class="w-3.5 h-3.5 ml-1 text-slate-500" />
          مشاهده پرونده عضو
        </Button>
      </div>

      <!-- Verification Status Banner -->
      <div
        :class="[
          'p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3',
          status === 'APPROVED'
            ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-100'
            : status === 'REJECTED'
            ? 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/60 text-rose-900 dark:text-rose-100'
            : 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/60 text-amber-900 dark:text-amber-100',
        ]"
      >
        <div class="flex items-start gap-2.5">
          <div class="mt-0.5 shrink-0">
            <CheckCircle2 v-if="status === 'APPROVED'" class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <XCircle v-else-if="status === 'REJECTED'" class="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <Clock v-else class="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div class="space-y-1">
            <div class="font-bold text-sm">
              <span v-if="status === 'APPROVED'">مدرک تائید شده است</span>
              <span v-else-if="status === 'REJECTED'">مدرک تحصیلی رد شده است</span>
              <span v-else>در انتظار بررسی و اعلام نظر کارشناس</span>
            </div>

            <!-- Rejection reason if rejected -->
            <div
              v-if="status === 'REJECTED' && qualification.rejectionReason"
              class="text-xs text-rose-700 dark:text-rose-300 font-medium bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg border border-rose-200 dark:border-rose-900"
            >
              <div class="flex items-center gap-1 font-bold mb-0.5">
                <AlertTriangle class="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>علت عدم انطباق / رد مدرک:</span>
              </div>
              <p class="whitespace-pre-line leading-relaxed">
                {{ formatWorkflowLogComment(qualification.rejectionReason) }}
              </p>
            </div>

            <!-- Operator and timestamp info -->
            <div
              v-if="status !== 'PENDING' && (qualification.verifiedBy || qualification.verifiedAt)"
              class="text-2xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2 pt-0.5"
            >
              <span v-if="qualification.verifiedBy">
                کارشناس: <strong>{{ formatWorkflowOperatorName(qualification.verifiedBy) }}</strong>
              </span>
              <span v-if="qualification.verifiedAt">
                زمان اقدام: {{ formatPersianDate(qualification.verifiedAt, true) }}
              </span>
            </div>
            <div v-else-if="status === 'PENDING'" class="text-2xs text-amber-700 dark:text-amber-400">
              این پرونده در صف کارتابل ارزیابی مدارک تحصیلی قرار دارد.
            </div>
          </div>
        </div>

        <div class="shrink-0 self-end sm:self-center">
          <Button
            variant="outline"
            size="xs"
            class="bg-white/80 dark:bg-slate-900/80 shadow-2xs"
            @click="handleTimeline"
          >
            <History class="w-3.5 h-3.5 ml-1 text-slate-500" />
            مشاهده گردش کار ({{ toPersianDigits(qualification.verificationLogs?.length || 0) }})
          </Button>
        </div>
      </div>

      <!-- Academic Details Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <!-- Box 1: Academic Field & Degree Title -->
        <div class="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
          <div class="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-slate-800">
            <BookOpen class="w-4 h-4 text-purple-600" />
            <span>مشخصات مقطع و رشته تحصیلی</span>
          </div>

          <div class="space-y-2 text-xs">
            <div>
              <span class="text-slate-400 text-2xs block mb-0.5">عنوان رسمی مدرک / دانشنامه:</span>
              <span class="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {{ qualification.title || '—' }}
              </span>
            </div>

            <div class="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span class="text-slate-400 text-2xs block mb-0.5">مقطع تحصیلی:</span>
                <Badge variant="purple" size="sm">
                  {{ degreeTitle }}
                </Badge>
              </div>

              <div>
                <span class="text-slate-400 text-2xs block mb-0.5">رشته تخصصی:</span>
                <span class="font-semibold text-slate-800 dark:text-slate-200">
                  {{ fieldTitle }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Box 2: Institution & City -->
        <div class="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
          <div class="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Building2 class="w-4 h-4 text-blue-600" />
            <span>دانشگاه و محل تحصیل</span>
          </div>

          <div class="space-y-2 text-xs">
            <div>
              <span class="text-slate-400 text-2xs block mb-0.5">نام دانشگاه / موسسه آموزش عالی:</span>
              <span class="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
                <Building2 class="w-4 h-4 text-blue-500 shrink-0" />
                {{ qualification.institution || '—' }}
              </span>
            </div>

            <div class="pt-1">
              <span class="text-slate-400 text-2xs block mb-0.5">شهر محل تحصیل:</span>
              <span class="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <MapPin class="w-3.5 h-3.5 text-rose-500 shrink-0" />
                {{ qualification.city || '—' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Box 3: Years & GPA -->
        <div class="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
          <div class="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Calendar class="w-4 h-4 text-emerald-600" />
            <span>دوره تحصیلی و معدل</span>
          </div>

          <div class="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span class="text-slate-400 text-2xs block mb-0.5">دوره و سنوات تحصیل:</span>
              <div class="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                <template v-if="qualification.startYear && qualification.graduationYear">
                  {{ toPersianDigits(qualification.startYear) }} الی {{ toPersianDigits(qualification.graduationYear) }}
                </template>
                <template v-else-if="qualification.graduationYear">
                  فارغ‌التحصیل {{ toPersianDigits(qualification.graduationYear) }}
                </template>
                <template v-else>—</template>
              </div>
              <span v-if="studyDuration" class="text-2xs text-brand-600 dark:text-brand-400 font-medium block mt-0.5">
                ({{ studyDuration }})
              </span>
            </div>

            <div>
              <span class="text-slate-400 text-2xs block mb-0.5">معدل کل کسب‌شده:</span>
              <div class="font-black text-amber-600 dark:text-amber-400 tabular-nums text-sm">
                <template v-if="qualification.gpa !== undefined && qualification.gpa !== null">
                  {{ toPersianDigits(qualification.gpa) }} <span class="text-xs font-normal text-slate-400">از ۲۰</span>
                </template>
                <template v-else>
                  <span class="text-slate-400 text-xs font-normal">ثبت نشده</span>
                </template>
              </div>
              <span
                v-if="qualification.gpa !== undefined && qualification.gpa !== null && qualification.gpa >= 17"
                class="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5"
              >
                <Sparkles class="w-3 h-3" />
                رتبه برتر / ممتاز (الف)
              </span>
            </div>
          </div>
        </div>

        <!-- Box 4: Description / Applicant Remarks -->
        <div class="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
          <div class="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-slate-800">
            <FileText class="w-4 h-4 text-amber-600" />
            <span>توضیحات و یادداشت تکمیلی</span>
          </div>

          <div class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed min-h-[48px]">
            <p v-if="qualification.description" class="whitespace-pre-line">
              {{ qualification.description }}
            </p>
            <p v-else class="text-slate-400 italic">
              توضیحات تکمیلی توسط متقاضی برای این مدرک ثبت نشده است.
            </p>
          </div>
        </div>
      </div>

      <!-- System Metadata Bar -->
      <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 text-2xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-4">
          <span v-if="qualification.createdAt">
            تاریخ ثبت درخواست: <strong class="text-slate-700 dark:text-slate-300 tabular-nums">{{ formatPersianDate(qualification.createdAt, true) }}</strong>
          </span>
          <span v-if="qualification.updatedAt">
            آخرین ویرایش: <strong class="text-slate-700 dark:text-slate-300 tabular-nums">{{ formatPersianDate(qualification.updatedAt, true) }}</strong>
          </span>
        </div>
        <div>
          <span>
            شناسه مدرک: <span class="font-mono text-slate-400 text-[10px]">{{ qualification._id }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Footer Actions -->
    <template #footer>
      <div class="w-full flex items-center justify-between gap-3 text-right" dir="rtl">
        <div class="flex items-center gap-2">
          <!-- Primary Review Button -->
          <Button
            variant="primary"
            size="sm"
            class="text-xs font-bold shadow-xs"
            title="بررسی و تائید / رد مدرک"
            @click="handleVerify"
          >
            <ShieldCheck class="w-4 h-4 ml-1" />
            بررسی مدرک
          </Button>

          <!-- Audit Timeline Button -->
          <Button
            variant="outline"
            size="sm"
            class="text-xs"
            title="تاریخچه و لاگ گردش کار"
            @click="handleTimeline"
          >
            <History class="w-3.5 h-3.5 ml-1" />
            گردش کار
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          @click="handleClose"
        >
          بستن پنجره
        </Button>
      </div>
    </template>
  </Modal>
</template>
