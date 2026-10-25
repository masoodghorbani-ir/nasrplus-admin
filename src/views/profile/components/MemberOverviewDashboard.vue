<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Member, IAcademicQualification, IMemberSkill } from '@/types';
import { useMemberAuthStore, useLookupsStore } from '@/stores';
import MemberAvatar from '@/components/ui/MemberAvatar.vue';
import MemberRankCard from './MemberRankCard.vue';
import {
  GraduationCap,
  Sparkles,
  Camera,
  Calendar,
  Building2,
  Clock,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  BadgeCheck,
} from 'lucide-vue-next';
import { toPersianDigits, formatPersianDate } from '@/utils/formatters';
import { membersApi } from '@/api';

interface Props {
  member: Member;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'navigate', tab: string): void;
  (e: 'openPhoto'): void;
}>();

const memberAuthStore = useMemberAuthStore();
const lookupsStore = useLookupsStore();

const qualifications = ref<IAcademicQualification[]>([]);
const skills = ref<IMemberSkill[]>([]);
const isLoadingStats = ref(true);

const approvedQualsCount = computed(() => {
  return qualifications.value.filter((q) => q.verificationStatus === 'APPROVED').length;
});

const pendingQualsCount = computed(() => {
  return qualifications.value.filter((q) => !q.verificationStatus || q.verificationStatus === 'PENDING').length;
});

const approvedSkillsCount = computed(() => {
  return skills.value.filter((s) => s.verificationStatus === 'APPROVED').length;
});

const pendingSkillsCount = computed(() => {
  return skills.value.filter((s) => !s.verificationStatus || s.verificationStatus === 'PENDING').length;
});

const avgSkillPercentage = computed(() => {
  if (skills.value.length === 0) return 0;
  const sum = skills.value.reduce((acc, s) => acc + (s.selfAssessmentPercentage || 0), 0);
  return Math.round(sum / skills.value.length);
});

const identityMeta = computed(() => {
  const items: string[] = [];
  const specialization = lookupsStore.getSpecializationTitle(props.member.specializationId);
  if (specialization && specialization !== '—') items.push(specialization);
  const nature = lookupsStore.getNatureTitle(props.member.natureOfMembership);
  if (nature && nature !== '—') items.push(nature);
  if (props.member.membershipDate) {
    items.push(`عضویت از ${formatPersianDate(props.member.membershipDate)}`);
  }
  return items;
});

async function loadOverviewData() {
  if (!props.member?._id) return;
  isLoadingStats.value = true;
  try {
    const [qualsRes, skillsRes] = await Promise.allSettled([
      membersApi.getMemberQualifications(props.member._id),
      membersApi.getMemberSkills(props.member._id),
    ]);

    if (qualsRes.status === 'fulfilled' && qualsRes.value.success) {
      qualifications.value = qualsRes.value.data || [];
    }
    if (skillsRes.status === 'fulfilled' && skillsRes.value.success) {
      skills.value = skillsRes.value.data || [];
    }
  } catch {
    // Non-blocking
  } finally {
    isLoadingStats.value = false;
  }
}

onMounted(() => {
  loadOverviewData();
});
</script>

<template>
  <div class="space-y-6 select-none" dir="rtl">
    <!-- Identity + Rank -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
      <section class="portal-panel p-5 sm:p-6 lg:col-span-7">
        <div class="flex flex-col gap-5 sm:flex-row sm:items-start">
          <button
            type="button"
            class="group relative mx-auto shrink-0 cursor-pointer sm:mx-0"
            title="تغییر عکس پرسنلی"
            @click="emit('openPhoto')"
          >
            <MemberAvatar
              :profile-image="member.profileImage"
              :full-name="memberAuthStore.memberFullName"
              size="xl"
              shape="portrait"
              :timestamp="memberAuthStore.photoTimestamp"
              class="border border-slate-200 dark:border-slate-700"
            />
            <span
              class="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-900/45 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Camera class="h-5 w-5" />
            </span>
          </button>

          <div class="min-w-0 flex-1 space-y-4 text-center sm:text-right">
            <div class="space-y-2">
              <div class="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span
                  :class="[
                    'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium',
                    memberAuthStore.statusConfig.bgClass,
                  ]"
                >
                  <span
                    class="h-1.5 w-1.5 rounded-full"
                    :class="memberAuthStore.statusConfig.dotClass"
                  />
                  {{ memberAuthStore.statusConfig.label }}
                </span>
              </div>

              <h1 class="truncate text-xl font-semibold text-slate-900 dark:text-slate-50 sm:text-2xl">
                {{ memberAuthStore.memberFullName }}
              </h1>

              <dl class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 sm:justify-start">
                <div class="inline-flex items-center gap-1.5">
                  <dt class="sr-only">کد عضویت</dt>
                  <dd class="tabular-nums">کد عضویت {{ toPersianDigits(member.memberCode) }}</dd>
                </div>
                <div v-if="member.nationalCode" class="inline-flex items-center gap-1.5">
                  <dt class="sr-only">کد ملی</dt>
                  <dd class="tabular-nums">کد ملی {{ toPersianDigits(member.nationalCode) }}</dd>
                </div>
              </dl>

              <p
                v-if="identityMeta.length"
                class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 sm:justify-start"
              >
                <span
                  v-for="(item, index) in identityMeta"
                  :key="index"
                  class="inline-flex items-center gap-1.5"
                >
                  <Building2 v-if="index === 0" class="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <BadgeCheck v-else-if="index === 1" class="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <Calendar v-else class="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {{ item }}
                </span>
              </p>
            </div>

            <div class="flex flex-wrap items-center justify-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800 sm:justify-start">
              <button
                type="button"
                class="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 text-xs font-medium text-white transition hover:bg-brand-700"
                @click="emit('navigate', 'info')"
              >
                <span>مشاهده پرونده کامل</span>
                <ArrowLeft class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                @click="emit('openPhoto')"
              >
                <Camera class="h-4 w-4" />
                <span>ویرایش تصویر</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div class="lg:col-span-5">
        <MemberRankCard :member="member" class="h-full" />
      </div>
    </div>

    <!-- Metrics -->
    <section aria-label="خلاصه وضعیت پرونده">
      <div class="mb-3 flex items-end justify-between gap-3">
        <h2 class="portal-section-title">خلاصه وضعیت پرونده</h2>
        <span v-if="isLoadingStats" class="portal-muted">در حال به‌روزرسانی…</span>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          class="portal-panel group cursor-pointer p-4 text-right transition hover:border-slate-300 dark:hover:border-slate-700"
          @click="emit('navigate', 'qualifications')"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="space-y-1">
              <p class="portal-label">مدارک تحصیلی</p>
              <p class="portal-metric">{{ toPersianDigits(qualifications.length) }}</p>
            </div>
            <span class="portal-icon-box">
              <GraduationCap class="h-4 w-4" />
            </span>
          </div>
          <div class="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
            <span class="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 class="h-3.5 w-3.5" />
              {{ toPersianDigits(approvedQualsCount) }} تایید
            </span>
            <span class="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
              <Clock class="h-3.5 w-3.5" />
              {{ toPersianDigits(pendingQualsCount) }} انتظار
            </span>
          </div>
        </button>

        <button
          type="button"
          class="portal-panel group cursor-pointer p-4 text-right transition hover:border-slate-300 dark:hover:border-slate-700"
          @click="emit('navigate', 'skills')"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="space-y-1">
              <p class="portal-label">مهارت‌ها و تخصص‌ها</p>
              <p class="portal-metric">{{ toPersianDigits(skills.length) }}</p>
            </div>
            <span class="portal-icon-box">
              <Sparkles class="h-4 w-4" />
            </span>
          </div>
          <div class="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
            <span class="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 class="h-3.5 w-3.5" />
              {{ toPersianDigits(approvedSkillsCount) }} تایید
            </span>
            <span class="text-slate-500 dark:text-slate-400">
              میانگین {{ toPersianDigits(avgSkillPercentage) }}٪
            </span>
          </div>
        </button>

        <button
          type="button"
          class="portal-panel group cursor-pointer p-4 text-right transition hover:border-slate-300 dark:hover:border-slate-700"
          @click="emit('navigate', 'qualifications')"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="space-y-1">
              <p class="portal-label">استعلام کارشناسان</p>
              <p class="portal-metric">{{ toPersianDigits(approvedQualsCount + approvedSkillsCount) }}</p>
            </div>
            <span class="portal-icon-box">
              <ShieldCheck class="h-4 w-4" />
            </span>
          </div>
          <div class="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
            <span class="text-slate-500 dark:text-slate-400">در صف بررسی</span>
            <span class="font-medium tabular-nums text-amber-700 dark:text-amber-400">
              {{ toPersianDigits(pendingQualsCount + pendingSkillsCount) }} مورد
            </span>
          </div>
        </button>

        <button
          type="button"
          class="portal-panel group cursor-pointer p-4 text-right transition hover:border-slate-300 dark:hover:border-slate-700"
          @click="emit('navigate', 'info')"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="space-y-1">
              <p class="portal-label">اعتبار پروانه</p>
              <p class="truncate text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-50 sm:text-xl">
                {{ member.expiryDate ? formatPersianDate(member.expiryDate) : 'نامحدود' }}
              </p>
            </div>
            <span class="portal-icon-box">
              <Calendar class="h-4 w-4" />
            </span>
          </div>
          <div class="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
            <span class="text-slate-500 dark:text-slate-400">وضعیت نظام</span>
            <span class="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 class="h-3.5 w-3.5" />
              {{ memberAuthStore.statusConfig.label }}
            </span>
          </div>
        </button>
      </div>
    </section>
  </div>
</template>
