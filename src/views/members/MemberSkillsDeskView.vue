<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { membersApi, companiesApi } from '@/api';
import { useLookupsStore, useNotificationStore } from '@/stores';
import type {
  IMemberSkill,
  Member,
  Company,
} from '@/types';
import {
  Button,
  Input,
  Select,
  EmptyState,
  MemberAvatar,
  Pagination,
} from '@/components/ui';
import { toPersianDigits, formatPersianDate } from '@/utils/formatters';
import { extractErrorMessage } from '@/utils/errors';
import {
  getSelfAssessmentInfo,
  getSkillStatusInfo,
  calculateExperienceDuration,
  seedSampleSkillsIfEmpty,
} from '@/utils/skills';
import VerifySkillModal from './components/VerifySkillModal.vue';
import SkillVerificationLogsTimeline from './components/SkillVerificationLogsTimeline.vue';
import CertificatePreviewModal from './components/CertificatePreviewModal.vue';
import MemberDetailDrawer from './MemberDetailDrawer.vue';
import {
  Award,
  ShieldCheck,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  History,
  ExternalLink,
  FileText,
  Filter,
} from 'lucide-vue-next';

const lookupsStore = useLookupsStore();
const notificationStore = useNotificationStore();

const skillsList = ref<IMemberSkill[]>([]);
const isLoading = ref(false);

// Cache maps for populated member and company details
const membersMap = ref<Record<string, Member>>({});
const companiesMap = ref<Record<string, Company>>({});

// Filter States
const selectedStatus = ref<string>('PENDING'); // Default to PENDING per workflow spec
const selectedSpecializationId = ref<string>('');
const selectedHasCertificate = ref<string>('');
const search = ref('');

// Pagination
const currentPage = ref(1);
const pageSize = ref(10);

// Modals State
const isVerifyModalOpen = ref(false);
const activeSkillForVerify = ref<IMemberSkill | null>(null);

const isTimelineModalOpen = ref(false);
const activeSkillForTimeline = ref<IMemberSkill | null>(null);

const isPreviewModalOpen = ref(false);
const previewCertificateUrl = ref('');
const previewCertificateTitle = ref('');
const previewSpecializationTitle = ref('');
const previewMemberName = ref('');

// Member Detail Drawer
const isMemberDrawerOpen = ref(false);
const selectedMemberIdForDrawer = ref<string | null>(null);

// Options for Status filter
const statusFilterOptions = [
  { label: 'همه وضعیت‌ها', value: '' },
  { label: 'در انتظار تائید کارشناس (پیش‌فرض)', value: 'PENDING' },
  { label: 'تائید شده', value: 'APPROVED' },
  { label: 'رد شده', value: 'REJECTED' },
];

// Options for Certificate filter
const certFilterOptions = [
  { label: 'همه وضعیت‌های مدرک', value: '' },
  { label: 'دارای گواهینامه معتبر', value: 'true' },
  { label: 'فاقد گواهینامه (صرفاً خوداظهاری)', value: 'false' },
];

// Specialization Options
const specializationFilterOptions = computed(() => {
  return [
    { label: 'همه رسته‌های تخصصی', value: '' },
    ...lookupsStore.specializations.map((s) => ({
      label: `${s.title}${s.code ? ` (${s.code})` : ''}`,
      value: s._id,
    })),
  ];
});

onMounted(async () => {
  await Promise.allSettled([
    lookupsStore.fetchAllLookups(),
    loadMembersAndCompanies(),
  ]);
  await loadSkills();
});

async function loadMembersAndCompanies() {
  try {
    const [membersRes, companiesRes] = await Promise.allSettled([
      membersApi.getMembers({ limit: 500 }),
      companiesApi.getCompanies({ limit: 500 }),
    ]);

    if (membersRes.status === 'fulfilled' && membersRes.value?.success && Array.isArray(membersRes.value.data)) {
      for (const m of membersRes.value.data) {
        if (m?._id) membersMap.value[m._id] = m;
      }
      seedSampleSkillsIfEmpty(membersRes.value.data, lookupsStore.specializations);
    }

    if (companiesRes.status === 'fulfilled' && companiesRes.value?.success && Array.isArray(companiesRes.value.data)) {
      for (const c of companiesRes.value.data) {
        if (c?._id) companiesMap.value[c._id] = c;
      }
    }
  } catch {
    // Non-fatal
  }
}

async function loadSkills() {
  isLoading.value = true;
  try {
    const res = await membersApi.getAllSkills({
      verificationStatus: selectedStatus.value || undefined,
      specializationId: selectedSpecializationId.value || undefined,
      hasCertificate: selectedHasCertificate.value || undefined,
      search: search.value.trim() || undefined,
    });

    if (res.success && Array.isArray(res.data)) {
      skillsList.value = res.data;
    } else {
      skillsList.value = [];
    }
  } catch (err: any) {
    notificationStore.error(extractErrorMessage(err) || 'دریافت فهرست با خطا مواجه شد.', 'خطا در بارگذاری کارتابل مهارت‌ها');
    skillsList.value = [];
  } finally {
    isLoading.value = false;
  }
}

// Client-side Filtered and Searched Skills
const filteredSkills = computed(() => {
  let list = skillsList.value;

  if (selectedStatus.value) {
    list = list.filter((s) => s.verificationStatus === selectedStatus.value);
  }

  if (selectedSpecializationId.value) {
    list = list.filter((s) => {
      const specId = typeof s.specializationId === 'object' ? s.specializationId?._id : s.specializationId;
      return specId === selectedSpecializationId.value;
    });
  }

  if (selectedHasCertificate.value !== '') {
    const isCert = selectedHasCertificate.value === 'true';
    list = list.filter((s) => Boolean(s.hasCertificate) === isCert);
  }

  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase();
    list = list.filter((s) => {
      const member = resolveMember(s);
      const memberName = `${member?.firstName || ''} ${member?.lastName || ''}`.toLowerCase();
      const nationalCode = (member?.nationalCode || '').toLowerCase();
      const memberCode = (member?.memberCode || '').toLowerCase();
      const specTitle = resolveSpecializationTitle(s).toLowerCase();
      const certTitle = (s.certificateTitle || '').toLowerCase();
      const desc = (s.description || '').toLowerCase();

      return (
        memberName.includes(q) ||
        nationalCode.includes(q) ||
        memberCode.includes(q) ||
        specTitle.includes(q) ||
        certTitle.includes(q) ||
        desc.includes(q)
      );
    });
  }

  return list;
});

// Paginated Skills
const paginatedSkills = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredSkills.value.slice(start, start + pageSize.value);
});

// Metric Statistics (based on total loaded records)
const stats = computed(() => {
  const total = skillsList.value.length;
  const pending = skillsList.value.filter((s) => s.verificationStatus === 'PENDING').length;
  const approved = skillsList.value.filter((s) => s.verificationStatus === 'APPROVED').length;
  const rejected = skillsList.value.filter((s) => s.verificationStatus === 'REJECTED').length;
  const withCertificate = skillsList.value.filter((s) => s.hasCertificate).length;

  return { total, pending, approved, rejected, withCertificate };
});

function resolveMember(skill: IMemberSkill): Member | null {
  if (skill.memberId && typeof skill.memberId === 'object') {
    return skill.memberId as any;
  }
  const id = String(skill.memberId || '');
  return membersMap.value[id] || null;
}

function resolveMemberName(skill: IMemberSkill): string {
  const m = resolveMember(skill);
  if (!m) return 'کاربر نامشخص';
  return `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'عضو بدون نام';
}

function resolveMemberCompanyName(skill: IMemberSkill): string {
  const m = resolveMember(skill);
  if (!m) return '';
  if (typeof m === 'object' && (m as any).companyName) return (m as any).companyName;
  if (m.companyInformation) {
    if (typeof m.companyInformation === 'object') {
      return (m.companyInformation as any).title || (m.companyInformation as any).name || '';
    }
    const c = companiesMap.value[String(m.companyInformation)];
    if (c?.title) return c.title;
  }
  return '';
}

function resolveSpecializationTitle(skill: IMemberSkill): string {
  if (typeof skill.specializationId === 'object' && skill.specializationId?.title) {
    return skill.specializationId.title;
  }
  const found = lookupsStore.specializations.find((s) => s._id === skill.specializationId);
  return found?.title || String(skill.specializationId || 'نامشخص');
}

function resolveSpecializationCode(skill: IMemberSkill): string {
  if (typeof skill.specializationId === 'object' && skill.specializationId?.code) {
    return skill.specializationId.code;
  }
  const found = lookupsStore.specializations.find((s) => s._id === skill.specializationId);
  return found?.code || '';
}

function openMemberProfile(memberId?: string) {
  if (!memberId) return;
  selectedMemberIdForDrawer.value = memberId;
  isMemberDrawerOpen.value = true;
}

function openVerifyModal(skill: IMemberSkill) {
  activeSkillForVerify.value = skill;
  isVerifyModalOpen.value = true;
}

function openTimelineModal(skill: IMemberSkill) {
  activeSkillForTimeline.value = skill;
  isTimelineModalOpen.value = true;
}

function openCertificatePreview(skill: IMemberSkill) {
  previewCertificateUrl.value = skill.certificateFile || '';
  previewCertificateTitle.value = skill.certificateTitle || 'گواهینامه مهارت تخصصی';
  previewSpecializationTitle.value = resolveSpecializationTitle(skill);
  previewMemberName.value = resolveMemberName(skill);
  isPreviewModalOpen.value = true;
}

function handleSkillVerified(updated: IMemberSkill) {
  const index = skillsList.value.findIndex((s) => s._id === updated._id);
  if (index !== -1) {
    skillsList.value[index] = updated;
  } else {
    loadSkills();
  }
}

function resetFilters() {
  selectedStatus.value = '';
  selectedSpecializationId.value = '';
  selectedHasCertificate.value = '';
  search.value = '';
  currentPage.value = 1;
  loadSkills();
}
</script>

<template>
  <div class="space-y-6 text-right select-none pb-12" dir="rtl">
    <!-- Header Banner -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-gradient-to-l from-purple-50 via-brand-50/40 to-white dark:from-purple-950/40 dark:via-brand-950/30 dark:to-slate-900 rounded-3xl border border-purple-200/70 dark:border-purple-900/50 shadow-xs">
      <div class="space-y-1.5">
        <div class="flex items-center gap-2.5">
          <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-brand-600 text-white flex items-center justify-center font-black shadow-md shadow-purple-500/20">
            <Award class="w-6 h-6" />
          </div>
          <div>
            <h1 class="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>کارتابل بررسی مهارت‌ها و گواهینامه‌های اعضا</span>
              <span class="px-2 py-0.5 rounded-lg text-xs bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-bold border border-purple-200/80 dark:border-purple-800">
                میز کارشناسی صنف
              </span>
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ممیزی تخصص‌های شغلی، استعلام اصالت گواهینامه‌های آزمون و صدور تائیدیه صلاحیت حرفه‌ای اعضای نظام صنفی
            </p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2.5 self-end md:self-auto">
        <Button
          variant="outline"
          size="sm"
          class="bg-white/80 dark:bg-slate-900/80"
          :loading="isLoading"
          @click="loadSkills"
        >
          <RefreshCw class="w-4 h-4 ml-1.5" />
          بروزرسانی داده‌ها
        </Button>
      </div>
    </div>

    <!-- Stat Cards Overview -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      <!-- 1. Total Skills -->
      <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
          <span>کل مهارت‌های ثبت‌شده</span>
          <Award class="w-4 h-4 text-purple-500" />
        </div>
        <div class="text-2xl font-black text-slate-800 dark:text-slate-100 tabular-nums">
          {{ toPersianDigits(stats.total) }}
        </div>
        <div class="text-2xs text-slate-400">تمام مهارت‌های پرونده‌ها</div>
      </div>

      <!-- 2. Pending (Highlighted) -->
      <div
        :class="[
          'p-4 rounded-2xl border shadow-2xs space-y-1 cursor-pointer transition',
          selectedStatus === 'PENDING'
            ? 'bg-amber-50/90 border-amber-300 dark:bg-amber-950/40 dark:border-amber-700 ring-2 ring-amber-400/30'
            : 'bg-white dark:bg-slate-900 border-amber-200/80 dark:border-amber-900/60 hover:bg-amber-50/40'
        ]"
        @click="selectedStatus = 'PENDING'"
      >
        <div class="flex items-center justify-between text-amber-700 dark:text-amber-300 text-xs font-bold">
          <span>در انتظار تائید کارشناس</span>
          <Clock class="w-4 h-4 text-amber-500 animate-pulse" />
        </div>
        <div class="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
          {{ toPersianDigits(stats.pending) }}
        </div>
        <div class="text-2xs text-amber-600/80 dark:text-amber-400/80 font-bold">نیازمند بررسی فوری</div>
      </div>

      <!-- 3. Approved -->
      <div
        :class="[
          'p-4 rounded-2xl border shadow-2xs space-y-1 cursor-pointer transition',
          selectedStatus === 'APPROVED'
            ? 'bg-emerald-50/90 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-700 ring-2 ring-emerald-400/30'
            : 'bg-white dark:bg-slate-900 border-emerald-200/80 dark:border-emerald-900/60 hover:bg-emerald-50/40'
        ]"
        @click="selectedStatus = 'APPROVED'"
      >
        <div class="flex items-center justify-between text-emerald-700 dark:text-emerald-300 text-xs font-bold">
          <span>تائید شده</span>
          <CheckCircle2 class="w-4 h-4 text-emerald-500" />
        </div>
        <div class="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
          {{ toPersianDigits(stats.approved) }}
        </div>
        <div class="text-2xs text-emerald-600/80 dark:text-emerald-400/80">مورد تائید صنف</div>
      </div>

      <!-- 4. Rejected -->
      <div
        :class="[
          'p-4 rounded-2xl border shadow-2xs space-y-1 cursor-pointer transition',
          selectedStatus === 'REJECTED'
            ? 'bg-rose-50/90 border-rose-300 dark:bg-rose-950/40 dark:border-rose-700 ring-2 ring-rose-400/30'
            : 'bg-white dark:bg-slate-900 border-rose-200/80 dark:border-rose-900/60 hover:bg-rose-50/40'
        ]"
        @click="selectedStatus = 'REJECTED'"
      >
        <div class="flex items-center justify-between text-rose-700 dark:text-rose-300 text-xs font-bold">
          <span>رد شده</span>
          <XCircle class="w-4 h-4 text-rose-500" />
        </div>
        <div class="text-2xl font-black text-rose-600 dark:text-rose-400 tabular-nums">
          {{ toPersianDigits(stats.rejected) }}
        </div>
        <div class="text-2xs text-rose-600/80 dark:text-rose-400/80">همراه با علت رد</div>
      </div>

      <!-- 5. With Certificate -->
      <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200/80 dark:border-purple-900/60 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
        <div class="flex items-center justify-between text-purple-700 dark:text-purple-300 text-xs font-bold">
          <span>دارای گواهینامه معتبر</span>
          <FileText class="w-4 h-4 text-purple-500" />
        </div>
        <div class="text-2xl font-black text-purple-600 dark:text-purple-400 tabular-nums">
          {{ toPersianDigits(stats.withCertificate) }}
        </div>
        <div class="text-2xs text-purple-600/80 dark:text-purple-400/80">دارای سند و فایل اسکن</div>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <!-- Search Keyword -->
        <div class="relative">
          <Input
            v-model="search"
            placeholder="جستجو در نام عضو، کد ملی، عنوان گواهینامه..."
          >
            <template #prefix>
              <Search class="w-4 h-4 text-slate-400" />
            </template>
          </Input>
        </div>

        <!-- Verification Status Filter -->
        <div>
          <Select
            v-model="selectedStatus"
            :options="statusFilterOptions"
            placeholder="فیلتر وضعیت بررسی..."
          />
        </div>

        <!-- Specialization Filter -->
        <div>
          <Select
            v-model="selectedSpecializationId"
            :options="specializationFilterOptions"
            placeholder="فیلتر بر اساس رسته تخصصی..."
          />
        </div>

        <!-- Has Certificate Filter -->
        <div>
          <Select
            v-model="selectedHasCertificate"
            :options="certFilterOptions"
            placeholder="فیلتر وضعیت مدرک..."
          />
        </div>
      </div>

      <!-- Filter Badges / Reset Line -->
      <div class="flex items-center justify-between pt-1 text-xs text-slate-500">
        <div class="flex items-center gap-2">
          <Filter class="w-3.5 h-3.5 text-slate-400" />
          <span>تعداد نتایج یافت‌شده: <span class="font-bold text-slate-800 dark:text-slate-100 tabular-nums">{{ toPersianDigits(filteredSkills.length) }}</span> مهارت</span>
        </div>

        <button
          v-if="selectedStatus || selectedSpecializationId || selectedHasCertificate || search"
          type="button"
          class="text-2xs font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
          @click="resetFilters"
        >
          پاکسازی فیلترها
        </button>
      </div>
    </div>

    <!-- Desk Table Container -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
      <!-- Loading State -->
      <div v-if="isLoading" class="p-12 text-center space-y-3">
        <RefreshCw class="w-8 h-8 text-brand-600 animate-spin mx-auto" />
        <p class="text-xs font-bold text-slate-600 dark:text-slate-400">در حال دریافت داده‌های کارتابل مهارت‌ها...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredSkills.length === 0" class="p-12">
        <EmptyState
          title="موردی مطابق با فیلترهای انتخابی یافت نشد"
          description="می‌توانید فیلتر وضعیت یا رسته تخصصی را تغییر داده و مجدداً جستجو فرمایید."
        >
          <template #actions>
            <Button variant="secondary" size="sm" @click="resetFilters">
              بازنشانی فیلترها
            </Button>
          </template>
        </EmptyState>
      </div>

      <!-- Table View -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-right text-xs">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
              <th class="py-3 px-4">مشخصات عضو</th>
              <th class="py-3 px-4">رسته تخصصی و سابقه فعالیت</th>
              <th class="py-3 px-4">درجه مهارت (خوداظهاری)</th>
              <th class="py-3 px-4">وضعیت گواهینامه معتبر</th>
              <th class="py-3 px-4">وضعیت بررسی</th>
              <th class="py-3 px-4 text-center">عملیات کارشناسی</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
            <tr
              v-for="skill in paginatedSkills"
              :key="skill._id"
              class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
            >
              <!-- 1. Member Information -->
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-3">
                  <div
                    class="cursor-pointer shrink-0"
                    title="مشاهده پرونده کامل عضو"
                    @click="openMemberProfile(resolveMember(skill)?._id)"
                  >
                    <MemberAvatar
                      :profile-image="resolveMember(skill)?.profileImage"
                      :full-name="resolveMemberName(skill)"
                      :status="resolveMember(skill)?.status"
                      size="sm"
                    />
                  </div>
                  <div class="min-w-0">
                    <p
                      class="font-bold text-slate-900 dark:text-slate-100 hover:text-brand-600 cursor-pointer truncate"
                      @click="openMemberProfile(resolveMember(skill)?._id)"
                    >
                      {{ resolveMemberName(skill) }}
                    </p>
                    <p class="text-2xs text-slate-400 mt-0.5 tabular-nums">
                      کد ملی: {{ toPersianDigits(resolveMember(skill)?.nationalCode || '—') }}
                    </p>
                    <p v-if="resolveMemberCompanyName(skill)" class="text-2xs text-purple-600 dark:text-purple-400 truncate mt-0.5 flex items-center gap-1">
                      <Building2 class="w-3 h-3 shrink-0" />
                      <span>{{ resolveMemberCompanyName(skill) }}</span>
                    </p>
                  </div>
                </div>
              </td>

              <!-- 2. Specialization & Activity Duration -->
              <td class="py-3.5 px-4">
                <div class="space-y-1">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="font-bold text-slate-800 dark:text-slate-200">
                      {{ resolveSpecializationTitle(skill) }}
                    </span>
                    <span v-if="resolveSpecializationCode(skill)" class="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-500 font-bold">
                      {{ resolveSpecializationCode(skill) }}
                    </span>
                  </div>

                  <p class="text-2xs text-slate-400 flex items-center gap-1">
                    <span>شروع: {{ skill.startDate ? formatPersianDate(skill.startDate) : '—' }}</span>
                    <span v-if="calculateExperienceDuration(skill.startDate)" class="text-brand-600 dark:text-brand-400 font-medium">
                      ({{ calculateExperienceDuration(skill.startDate) }})
                    </span>
                  </p>
                </div>
              </td>

              <!-- 3. Self Assessment Slider Degree -->
              <td class="py-3.5 px-4 min-w-[140px]">
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between text-2xs">
                    <span
                      :class="[
                        'px-2 py-0.5 rounded-md font-bold border',
                        getSelfAssessmentInfo(skill.selfAssessmentPercentage).badgeClass
                      ]"
                    >
                      {{ getSelfAssessmentInfo(skill.selfAssessmentPercentage).label }}
                    </span>
                    <span class="font-black tabular-nums text-slate-800 dark:text-slate-200">
                      {{ toPersianDigits(skill.selfAssessmentPercentage) }}٪
                    </span>
                  </div>

                  <div class="h-1.5 w-full bg-slate-200/80 dark:bg-slate-700/80 rounded-full overflow-hidden">
                    <div
                      :class="['h-full rounded-full transition-all duration-300', getSelfAssessmentInfo(skill.selfAssessmentPercentage).progressBarClass]"
                      :style="{ width: `${skill.selfAssessmentPercentage}%` }"
                    ></div>
                  </div>
                </div>
              </td>

              <!-- 4. Certificate Upload & Status -->
              <td class="py-3.5 px-4">
                <div v-if="skill.hasCertificate" class="space-y-1">
                  <div class="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-bold">
                    <Award class="w-3.5 h-3.5 shrink-0 text-purple-600" />
                    <span class="truncate max-w-[180px]">{{ skill.certificateTitle || 'دارای مدرک معتبر' }}</span>
                  </div>

                  <button
                    v-if="skill.certificateFile"
                    type="button"
                    class="inline-flex items-center gap-1 text-2xs text-brand-600 dark:text-brand-400 hover:underline font-bold cursor-pointer"
                    @click="openCertificatePreview(skill)"
                  >
                    <ExternalLink class="w-3 h-3" />
                    مشاهده سند گواهی
                  </button>
                </div>
                <div v-else class="text-slate-400 text-2xs">
                  فاقد گواهینامه (صرفاً خوداظهاری)
                </div>
              </td>

              <!-- 5. Verification Status Badge (Section 3.3) -->
              <td class="py-3.5 px-4">
                <div class="space-y-1">
                  <span
                    :class="[
                      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold border',
                      getSkillStatusInfo(skill.verificationStatus).badgeClass
                    ]"
                  >
                    <component
                      :is="skill.verificationStatus === 'APPROVED' ? CheckCircle2 : skill.verificationStatus === 'REJECTED' ? XCircle : Clock"
                      class="w-3 h-3"
                    />
                    <span>{{ getSkillStatusInfo(skill.verificationStatus).label }}</span>
                  </span>

                  <!-- Rejection Reason Tooltip / Snippet -->
                  <p
                    v-if="skill.verificationStatus === 'REJECTED' && skill.rejectionReason"
                    class="text-2xs text-rose-600 dark:text-rose-400 line-clamp-1 max-w-[180px] cursor-pointer hover:underline"
                    :title="skill.rejectionReason"
                    @click="openVerifyModal(skill)"
                  >
                    علت: {{ skill.rejectionReason }}
                  </p>
                </div>
              </td>

              <!-- 6. Expert Action Buttons (Section 3.4) -->
              <td class="py-3.5 px-4 text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <!-- Direct Verify / Review Button -->
                  <Button
                    variant="outline"
                    size="sm"
                    class="h-7 px-2.5 text-2xs font-bold text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800 hover:bg-brand-50"
                    title="بررسی کارشناسی و ثبت تصمیم"
                    @click="openVerifyModal(skill)"
                  >
                    <ShieldCheck class="w-3.5 h-3.5 ml-1 text-brand-600" />
                    کارشناسی
                  </Button>

                  <!-- Audit Trail Timeline Button -->
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    class="text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="مشاهده تاریخچه و لاگ گردش کار"
                    @click="openTimelineModal(skill)"
                  >
                    <History class="w-3.5 h-3.5 shrink-0" />
                  </Button>

                  <!-- Open Member Profile Button -->
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    class="text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="مشاهده پرونده کامل عضو"
                    @click="openMemberProfile(resolveMember(skill)?._id)"
                  >
                    <ExternalLink class="w-3.5 h-3.5 shrink-0" />
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div v-if="filteredSkills.length > pageSize" class="p-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
        <span class="text-xs text-slate-400">
          نمایش {{ toPersianDigits(paginatedSkills.length) }} از {{ toPersianDigits(filteredSkills.length) }} مهارت
        </span>
        <Pagination
          :page="currentPage"
          :limit="pageSize"
          :total="filteredSkills.length"
          @update:page="currentPage = $event"
        />
      </div>
    </div>

    <!-- Modals -->
    <!-- 1. Verification Modal -->
    <VerifySkillModal
      v-model:open="isVerifyModalOpen"
      :skill="activeSkillForVerify"
      :member-id="resolveMember(activeSkillForVerify || ({} as any))?._id"
      :member-name="activeSkillForVerify ? resolveMemberName(activeSkillForVerify) : ''"
      @verified="handleSkillVerified"
    />

    <!-- 2. Audit Timeline Modal -->
    <SkillVerificationLogsTimeline
      v-model:open="isTimelineModalOpen"
      :skill="activeSkillForTimeline"
    />

    <!-- 3. Certificate Preview Modal -->
    <CertificatePreviewModal
      v-model:open="isPreviewModalOpen"
      :file-url="previewCertificateUrl"
      :title="previewCertificateTitle"
      :specialization-title="previewSpecializationTitle"
      :member-name="previewMemberName"
    />

    <!-- 4. Member Detail Drawer -->
    <MemberDetailDrawer
      v-model:open="isMemberDrawerOpen"
      :member-id="selectedMemberIdForDrawer"
      initial-tab="skills"
      @updated="loadSkills"
    />
  </div>
</template>
