<script setup lang="ts">
import { computed } from 'vue';
import type {
  IAcademicQualification,
  IQualificationVerificationLog,
  QualificationVerificationStatus,
} from '@/types';
import { Modal, Button, EmptyState } from '@/components/ui';
import { formatPersianDate } from '@/utils/formatters';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  MessageSquareQuote,
  GraduationCap,
  ArrowLeft,
} from 'lucide-vue-next';

interface Props {
  open: boolean;
  qualification: IAcademicQualification | null;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  qualification: null,
});

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
}>();

// Sort logs newest first
const sortedLogs = computed<IQualificationVerificationLog[]>(() => {
  if (!props.qualification?.verificationLogs) return [];
  return [...props.qualification.verificationLogs].sort((a, b) => {
    const tA = new Date(a.changedAt).getTime();
    const tB = new Date(b.changedAt).getTime();
    return tB - tA;
  });
});

function getStatusLabel(status?: QualificationVerificationStatus): string {
  switch (status) {
    case 'APPROVED':
      return 'تائید شده';
    case 'REJECTED':
      return 'رد شده';
    case 'PENDING':
      return 'در انتظار تائید کارشناس';
    default:
      return status || 'نامشخص';
  }
}

function getStatusBadgeClasses(status?: QualificationVerificationStatus): string {
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

function getStatusDotColor(status?: QualificationVerificationStatus): string {
  switch (status) {
    case 'APPROVED':
      return 'bg-emerald-500 text-white';
    case 'REJECTED':
      return 'bg-rose-500 text-white';
    case 'PENDING':
    default:
      return 'bg-amber-500 text-white';
  }
}

function getOperatorName(changedBy: any): string {
  if (!changedBy) return 'سیستم / ثبت خودکار';
  if (typeof changedBy === 'object') {
    return changedBy.fullName || changedBy.username || 'کارشناس صنف';
  }
  return String(changedBy);
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
            <History class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>تاریخچه و لاگ گردش کار مدرک تحصیلی</span>
            </h3>
            <p v-if="qualification" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
              <GraduationCap class="w-3.5 h-3.5" />
              <span>{{ qualification.title }}</span>
            </p>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal Body -->
    <div class="space-y-4 text-right select-none" dir="rtl">
      <!-- Empty State -->
      <div v-if="sortedLogs.length === 0" class="py-6">
        <EmptyState
          title="هیچ رکوردی در تاریخچه این مدرک یافت نشد"
          description="تغییرات وضعیت مدرک به صورت خودکار در این بخش ثبت و نگهداری می‌شوند."
          :icon="History"
        />
      </div>

      <!-- Vertical Timeline -->
      <div v-else class="relative pr-6 space-y-6 before:absolute before:right-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
        <div
          v-for="(log, idx) in sortedLogs"
          :key="log._id || idx"
          class="relative pr-6 group"
        >
          <!-- Timeline Node Icon -->
          <div
            :class="[
              'absolute right-[-14px] top-1 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-xs z-10 transition-transform group-hover:scale-110',
              getStatusDotColor(log.toStatus),
            ]"
          >
            <CheckCircle2 v-if="log.toStatus === 'APPROVED'" class="w-3.5 h-3.5" />
            <XCircle v-else-if="log.toStatus === 'REJECTED'" class="w-3.5 h-3.5" />
            <Clock v-else class="w-3.5 h-3.5" />
          </div>

          <!-- Log Card -->
          <div class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition">
            <!-- Header: Badges & Timestamp -->
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex flex-wrap items-center gap-2">
                <!-- Status Badge -->
                <span
                  :class="[
                    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border',
                    getStatusBadgeClasses(log.toStatus),
                  ]"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                  {{ getStatusLabel(log.toStatus) }}
                </span>

                <!-- Transition Flow (if fromStatus exists) -->
                <span
                  v-if="log.fromStatus && log.fromStatus !== log.toStatus"
                  class="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-white dark:bg-slate-900/60 px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-slate-800"
                >
                  <span>تغییر از</span>
                  <strong class="font-semibold">{{ getStatusLabel(log.fromStatus) }}</strong>
                  <ArrowLeft class="w-3 h-3 text-slate-400" />
                  <strong class="font-semibold">{{ getStatusLabel(log.toStatus) }}</strong>
                </span>
                <span
                  v-else-if="!log.fromStatus"
                  class="text-[11px] text-slate-400"
                >
                  (ثبت اولیه مدرک)
                </span>
              </div>

              <!-- Timestamp -->
              <span class="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {{ formatPersianDate(log.changedAt, true) }}
              </span>
            </div>

            <!-- Operator info -->
            <div class="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <User class="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>اقدام‌کننده:</span>
              <strong class="font-bold text-slate-800 dark:text-slate-200">
                {{ getOperatorName(log.changedBy) }}
              </strong>
            </div>

            <!-- Comment or Reason Quote Box -->
            <div
              v-if="log.comment"
              :class="[
                'p-3 rounded-xl text-xs flex items-start gap-2.5 border',
                log.toStatus === 'REJECTED'
                  ? 'bg-rose-50/70 border-rose-200 text-rose-900 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-200'
                  : 'bg-white dark:bg-slate-900/70 border-slate-200/70 dark:border-slate-700/60 text-slate-700 dark:text-slate-300',
              ]"
            >
              <MessageSquareQuote
                :class="[
                  'w-4 h-4 shrink-0 mt-0.5',
                  log.toStatus === 'REJECTED' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400',
                ]"
              />
              <div class="leading-relaxed whitespace-pre-wrap">
                <span v-if="log.toStatus === 'REJECTED'" class="font-bold block mb-0.5 text-rose-700 dark:text-rose-300">
                  علت رد مدرک:
                </span>
                <span>{{ log.comment }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Footer -->
    <template #footer>
      <div class="w-full flex items-center justify-between">
        <span class="text-[11px] text-slate-400">
          لاگ‌های گردش کار به صورت تغییرناپذیر در پایگاه‌داده نگهداری می‌شوند.
        </span>
        <Button
          variant="outline"
          size="sm"
          @click="emit('update:open', false)"
        >
          بستن
        </Button>
      </div>
    </template>
  </Modal>
</template>
