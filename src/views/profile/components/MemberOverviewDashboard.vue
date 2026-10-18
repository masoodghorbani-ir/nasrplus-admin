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
  ChevronLeft,
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
  <div class="space-y-6 sm:space-y-8 select-none" dir="rtl">
    <!-- 1 & 2. Hero Profile Banner & Guild Rank Showcase (Side by Side) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
      <!-- Right (in RTL): Hero Profile Welcome Banner (7 columns) -->
      <div
        class="lg:col-span-7 relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-700 to-brand-700 p-5 sm:p-6 text-white shadow-xl shadow-emerald-950/20 flex flex-col justify-between"
      >
        <!-- Background Decorative Circles -->
        <div class="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div class="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-brand-400/15 blur-2xl pointer-events-none" />

        <div class="relative z-10 flex flex-col justify-between h-full gap-5">
          <!-- Photo and Identity Info -->
          <div class="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-right">
            <div class="relative group cursor-pointer shrink-0" @click="emit('openPhoto')">
              <MemberAvatar
                :profile-image="member.profileImage"
                :full-name="memberAuthStore.memberFullName"
                size="xl"
                shape="portrait"
                :timestamp="memberAuthStore.photoTimestamp"
                class="border-4 border-white/30 shadow-xl group-hover:scale-102 transition-transform duration-300"
              />
              <div
                class="absolute inset-0 bg-slate-900/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                title="تغییر عکس پرسنلی"
              >
                <Camera class="w-6 h-6" />
              </div>
            </div>

            <div class="space-y-2 flex-1 min-w-0">
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span
                  class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 backdrop-blur-xs text-white border border-white/25"
                >
                  کد عضویت: {{ toPersianDigits(member.memberCode) }}
                </span>

                <span
                  v-if="member.nationalCode"
                  class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-emerald-100 border border-white/15"
                >
                  کد ملی: {{ toPersianDigits(member.nationalCode) }}
                </span>

                <span
                  class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-400 text-emerald-950 shadow-xs"
                >
                  {{ memberAuthStore.statusConfig.label }}
                </span>
              </div>

              <h1 class="text-lg sm:text-xl font-bold text-white truncate">
                {{ memberAuthStore.memberFullName }}
              </h1>

              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-xs text-emerald-100/90 pt-1 font-normal">
                <span class="inline-flex items-center gap-1.5">
                  <Building2 class="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  رسته: {{ lookupsStore.getSpecializationTitle(member.specializationId) }}
                </span>

                <span class="inline-flex items-center gap-1.5">
                  <BadgeCheck class="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  ماهیت: {{ lookupsStore.getNatureTitle(member.natureOfMembership) }}
                </span>

                <span v-if="member.membershipDate" class="inline-flex items-center gap-1.5">
                  <Calendar class="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  عضویت از: {{ formatPersianDate(member.membershipDate) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Bottom Action Buttons in Hero Banner -->
          <div class="pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
            <span class="text-2xs text-emerald-100/80 font-normal hidden sm:inline">
              پرتال جامع خدمات الکترونیکی سازمان نصر
            </span>

            <div class="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                class="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-semibold border border-white/30 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:scale-102"
                @click="emit('openPhoto')"
              >
                <Camera class="w-4 h-4" />
                <span>ویرایش تصویر</span>
              </button>

              <button
                type="button"
                class="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-semibold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer hover:scale-102"
                @click="emit('navigate', 'info')"
              >
                <span>مشاهده پرونده کامل</span>
                <ArrowLeft class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Left (in RTL): Prominent Guild Rank Showcase Card (5 columns) -->
      <div class="lg:col-span-5 flex">
        <MemberRankCard :member="member" class="w-full" />
      </div>
    </div>

    <!-- 3. Key Stat Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      <!-- Card A: Qualifications -->
      <div
        class="group p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-[185px]"
        @click="emit('navigate', 'qualifications')"
      >
        <div class="flex items-center justify-between">
          <div
            class="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform"
          >
            <GraduationCap class="w-5 h-5" />
          </div>
          <span class="text-3xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800">
            مدارک دانشگاهی
          </span>
        </div>

        <div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold text-slate-800 dark:text-slate-100 tabular-nums">
              {{ toPersianDigits(qualifications.length) }}
            </span>
            <span class="text-xs text-slate-500 dark:text-slate-400 font-normal">مدرک ثبت‌شده</span>
          </div>

          <!-- Approval breakdown -->
          <div class="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 class="w-3.5 h-3.5" />
              {{ toPersianDigits(approvedQualsCount) }} تائید شده
            </span>
            <span class="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-normal">
              <Clock class="w-3.5 h-3.5" />
              {{ toPersianDigits(pendingQualsCount) }} در انتظار
            </span>
          </div>
        </div>
      </div>

      <!-- Card B: Skills & Certificates -->
      <div
        class="group p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-brand-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-[185px]"
        @click="emit('navigate', 'skills')"
      >
        <div class="flex items-center justify-between">
          <div
            class="w-11 h-11 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200/70 dark:border-brand-800 flex items-center justify-center group-hover:scale-105 transition-transform"
          >
            <Sparkles class="w-5 h-5" />
          </div>
          <span class="text-3xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400 border border-brand-200/70 dark:border-brand-800">
            تخصص‌ها و مهارت‌ها
          </span>
        </div>

        <div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold text-slate-800 dark:text-slate-100 tabular-nums">
              {{ toPersianDigits(skills.length) }}
            </span>
            <span class="text-xs text-slate-500 dark:text-slate-400 font-normal">مهارت و تخصص</span>
          </div>

          <!-- Skill Approval breakdown -->
          <div class="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 class="w-3.5 h-3.5" />
              {{ toPersianDigits(approvedSkillsCount) }} تائید شده
            </span>
            <span class="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 font-normal">
              میانگین: {{ toPersianDigits(avgSkillPercentage) }}٪
            </span>
          </div>
        </div>
      </div>

      <!-- Card C: Verification Status Summary -->
      <div
        class="group p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-indigo-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-[185px]"
        @click="emit('navigate', 'qualifications')"
      >
        <div class="flex items-center justify-between">
          <div
            class="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/70 dark:border-indigo-800 flex items-center justify-center group-hover:scale-105 transition-transform"
          >
            <ShieldCheck class="w-5 h-5" />
          </div>
          <span class="text-3xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/70 dark:border-indigo-800">
            استعلام کارشناسان
          </span>
        </div>

        <div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {{ toPersianDigits(approvedQualsCount + approvedSkillsCount) }}
            </span>
            <span class="text-xs text-slate-500 dark:text-slate-400 font-normal">مدرک تائید نهایی</span>
          </div>

          <div class="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>در صف بررسی:</span>
            <span class="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
              {{ toPersianDigits(pendingQualsCount + pendingSkillsCount) }} مورد
            </span>
          </div>
        </div>
      </div>

      <!-- Card D: Membership Period -->
      <div
        class="group p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-amber-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-[185px]"
        @click="emit('navigate', 'info')"
      >
        <div class="flex items-center justify-between">
          <div
            class="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800 flex items-center justify-center group-hover:scale-105 transition-transform"
          >
            <Calendar class="w-5 h-5" />
          </div>
          <span class="text-3xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800">
            اعتبار پروانه
          </span>
        </div>

        <div>
          <div class="flex items-baseline gap-2">
            <span class="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 tabular-nums truncate">
              {{ member.expiryDate ? formatPersianDate(member.expiryDate) : 'نامحدود' }}
            </span>
            <span class="text-xs text-slate-500 dark:text-slate-400 font-normal shrink-0">
              {{ member.expiryDate ? 'تاریخ انقضا' : 'اعتبار پروانه' }}
            </span>
          </div>

          <div class="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>وضعیت نظام:</span>
            <span class="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 class="w-3.5 h-3.5" />
              {{ memberAuthStore.statusConfig.label }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. Quick Access Modules Row -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
          دسترسی سریع به بخش‌های پرونده
        </h2>
        <span class="text-xs text-slate-500 dark:text-slate-400 font-normal">
          انتخاب و مدیریت اطلاعات
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Quick Option 1: Academic Qualifications -->
        <div
          class="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
          @click="emit('navigate', 'qualifications')"
        >
          <div class="flex items-center gap-3.5">
            <div
              class="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/70 dark:border-emerald-800"
            >
              <GraduationCap class="w-5 h-5" />
            </div>
            <div class="text-right">
              <h4 class="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                مدیریت مدارک تحصیلی
              </h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                ثبت مدارک دانشگاهی و استعلام تاییدیه
              </p>
            </div>
          </div>
          <ChevronLeft class="w-5 h-5 text-slate-400 group-hover:-translate-x-1 transition-transform" />
        </div>

        <!-- Quick Option 2: Skills & Certifications -->
        <div
          class="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-brand-500/60 dark:hover:border-brand-500/60 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
          @click="emit('navigate', 'skills')"
        >
          <div class="flex items-center gap-3.5">
            <div
              class="w-11 h-11 rounded-2xl bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 border border-brand-200/70 dark:border-brand-800"
            >
              <Sparkles class="w-5 h-5" />
            </div>
            <div class="text-right">
              <h4 class="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                مهارت‌ها و گواهینامه‌ها
              </h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                تخصص‌ها، بارگذاری مدارک و خودارزیابی
              </p>
            </div>
          </div>
          <ChevronLeft class="w-5 h-5 text-slate-400 group-hover:-translate-x-1 transition-transform" />
        </div>

        <!-- Quick Option 3: Photo Management -->
        <div
          class="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500/60 dark:hover:border-indigo-500/60 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
          @click="emit('openPhoto')"
        >
          <div class="flex items-center gap-3.5">
            <div
              class="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200/70 dark:border-indigo-800"
            >
              <Camera class="w-5 h-5" />
            </div>
            <div class="text-right">
              <h4 class="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                ویرایش تصویر پرسنلی
              </h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                برش، تنظیم نسبت ۳:۴ و تغییر عکس
              </p>
            </div>
          </div>
          <ChevronLeft class="w-5 h-5 text-slate-400 group-hover:-translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  </div>
</template>
