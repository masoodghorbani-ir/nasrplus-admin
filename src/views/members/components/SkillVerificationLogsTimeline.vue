<script setup lang="ts">
import { computed } from 'vue';
import type {
  IMemberSkill,
  ISkillVerificationLog,
  SkillVerificationStatus,
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
  Award,
  AlertTriangle,
} from 'lucide-vue-next';

interface Props {
  open: boolean;
  skill: IMemberSkill | null;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  skill: null,
});

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
}>();

// Sort logs newest first
const sortedLogs = computed<ISkillVerificationLog[]>(() => {
  if (!props.skill?.verificationLogs) return [];
  return [...props.skill.verificationLogs].sort((a, b) => {
    const tA = new Date(a.changedAt).getTime();
    const tB = new Date(b.changedAt).getTime();
    return tB - tA;
  });
});

function getStatusLabel(status?: SkillVerificationStatus): string {
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

function getStatusBadgeClasses(status?: SkillVerificationStatus): string {
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

function getStatusDotColor(status?: SkillVerificationStatus): string {
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

const skillTitle = computed(() => {
  if (!props.skill) return '';
  const spec = props.skill.specializationId;
  if (typeof spec === 'object' && spec?.title) return spec.title;
  return String(spec || '');
});
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
              <span>تاریخچه و لاگ گردش کار مهارت و گواهینامه</span>
            </h3>
            <p v-if="skill" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
              <Award class="w-3.5 h-3.5" />
              <span>{{ skillTitle }}</span>
              <span v-if="skill.certificateTitle">({{ skill.certificateTitle }})</span>
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
          title="گردش کاری ثبت نشده است"
          description="هنوز هیچ تغییر وضعیتی برای این مهارت در سیستم ثبت نشده است."
        />
      </div>

      <!-- Timeline List -->
      <div v-else class="relative pr-6 space-y-6 before:absolute before:right-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        <div
          v-for="(log, idx) in sortedLogs"
          :key="log._id || idx"
          class="relative space-y-2"
        >
          <!-- Timeline Indicator Dot -->
          <div
            :class="[
              'absolute -right-6 top-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-xs ring-4 ring-white dark:ring-slate-900',
              getStatusDotColor(log.toStatus)
            ]"
          >
            <CheckCircle2 v-if="log.toStatus === 'APPROVED'" class="w-3 h-3" />
            <XCircle v-else-if="log.toStatus === 'REJECTED'" class="w-3 h-3" />
            <Clock v-else class="w-3 h-3" />
          </div>

          <!-- Log Card -->
          <div class="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2.5 hover:shadow-2xs transition">
            <!-- Top Row: Status Badges & Time -->
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <div class="flex items-center gap-2">
                <!-- If there was a previous status -->
                <template v-if="log.fromStatus">
                  <span
                    :class="[
                      'px-2 py-0.5 text-2xs font-bold rounded-md border',
                      getStatusBadgeClasses(log.fromStatus)
                    ]"
                  >
                    {{ getStatusLabel(log.fromStatus) }}
                  </span>
                  <span class="text-xs text-slate-400 font-bold">←</span>
                </template>

                <span
                  :class="[
                    'px-2.5 py-0.5 text-xs font-bold rounded-lg border flex items-center gap-1',
                    getStatusBadgeClasses(log.toStatus)
                  ]"
                >
                  <span>{{ getStatusLabel(log.toStatus) }}</span>
                </span>
              </div>

              <!-- Changed At Timestamp -->
              <span class="text-2xs text-slate-400 dark:text-slate-500 font-medium tabular-nums flex items-center gap-1">
                <Clock class="w-3 h-3" />
                {{ formatPersianDate(log.changedAt) }}
              </span>
            </div>

            <!-- Changed By Operator -->
            <div class="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <User class="w-3.5 h-3.5 text-slate-400" />
              <span>اقدام‌کننده:</span>
              <span class="font-bold text-slate-800 dark:text-slate-200">
                {{ getOperatorName(log.changedBy) }}
              </span>
            </div>

            <!-- Rejection Reason if Rejected -->
            <div
              v-if="log.toStatus === 'REJECTED' && log.rejectionReason"
              class="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs space-y-1"
            >
              <div class="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300">
                <AlertTriangle class="w-3.5 h-3.5 shrink-0" />
                <span>علت رد:</span>
              </div>
              <p class="text-rose-600 dark:text-rose-400 text-2xs leading-relaxed">
                {{ log.rejectionReason }}
              </p>
            </div>

            <!-- Comment Note -->
            <div
              v-if="log.comment"
              class="flex items-start gap-1.5 text-2xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-700/50"
            >
              <MessageSquareQuote class="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <p class="leading-relaxed">{{ log.comment }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Footer -->
    <template #footer>
      <div class="w-full flex justify-end">
        <Button variant="secondary" @click="emit('update:open', false)">
          بستن تاریخچه
        </Button>
      </div>
    </template>
  </Modal>
</template>
