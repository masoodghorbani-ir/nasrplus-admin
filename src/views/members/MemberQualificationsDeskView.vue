<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { lookupsApi, membersApi, companiesApi } from '@/api';
import { useLookupsStore, useNotificationStore } from '@/stores';
import type {
  IAcademicQualification,
  QualificationVerificationStatus,
  Member,
  Company,
} from '@/types';
import {
  Button,
  Input,
  Select,
  Badge,
  EmptyState,
  MemberAvatar,
} from '@/components/ui';
import { toPersianDigits } from '@/utils/formatters';
import { extractErrorMessage } from '@/utils/errors';
import VerifyQualificationModal from './components/VerifyQualificationModal.vue';
import VerificationLogsTimeline from './components/VerificationLogsTimeline.vue';
import MemberDetailDrawer from './MemberDetailDrawer.vue';
import {
  GraduationCap,
  ShieldCheck,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  History,
  AlertTriangle,
  ExternalLink,
} from 'lucide-vue-next';

const lookupsStore = useLookupsStore();
const notificationStore = useNotificationStore();

const qualificationsList = ref<IAcademicQualification[]>([]);
const isLoading = ref(false);

// Cache maps for populated member and company details
const membersMap = ref<Record<string, Member>>({});
const companiesMap = ref<Record<string, Company>>({});

// Helper to normalize verification status (legacy/empty statuses default to PENDING)
function normalizeStatus(status?: string): QualificationVerificationStatus {
  if (status === 'APPROVED') return 'APPROVED';
  if (status === 'REJECTED') return 'REJECTED';
  return 'PENDING';
}

// Filter States
const selectedStatus = ref<string>('PENDING'); // Default to PENDING per desk workflow spec
const selectedDegreeLevel = ref<string>('');
const search = ref('');

// Modals State
const isVerifyModalOpen = ref(false);
const activeQualificationForVerify = ref<IAcademicQualification | null>(null);

const isTimelineModalOpen = ref(false);
const activeQualificationForTimeline = ref<IAcademicQualification | null>(null);

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

// Degree Level Options
const degreeLevelOptions = computed(() => {
  return [
    { label: 'همه مقاطع تحصیلی', value: '' },
    ...lookupsStore.degreeLevels.map((d) => ({
      label: d.title,
      value: d._id,
    })),
  ];
});

onMounted(async () => {
  // Pre-fill from store if available to prevent any 0-count flash
  if (lookupsStore.academicQualifications && lookupsStore.academicQualifications.length > 0) {
    qualificationsList.value = lookupsStore.academicQualifications as any;
  }
  await Promise.allSettled([
    lookupsStore.fetchAllLookups(),
    loadQualifications(),
    loadMembersAndCompanies(),
  ]);
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
    }

    if (companiesRes.status === 'fulfilled' && companiesRes.value?.success && Array.isArray(companiesRes.value.data)) {
      for (const c of companiesRes.value.data) {
        if (c?._id) companiesMap.value[c._id] = c;
      }
    }
  } catch {
    // Ignore error
  }
}

async function resolveMissingMembers(items: IAcademicQualification[]) {
  const missingMemberIds = new Set<string>();
  for (const q of items) {
    const rawId = typeof q.memberId === 'object' && q.memberId ? q.memberId._id : q.memberId;
    if (typeof rawId === 'string' && rawId && !membersMap.value[rawId]) {
      missingMemberIds.add(rawId);
    }
  }

  if (missingMemberIds.size > 0) {
    await Promise.allSettled(
      Array.from(missingMemberIds).map(async (id) => {
        try {
          const res = await membersApi.getMemberById(id);
          if (res.success && res.data) {
            membersMap.value[id] = res.data;
            const cInfo = res.data.companyInformation;
            const cId = typeof cInfo === 'object' && cInfo ? cInfo._id : cInfo;
            if (typeof cId === 'string' && cId && !companiesMap.value[cId]) {
              try {
                const cRes = await companiesApi.getCompanyById(cId);
                if (cRes.success && cRes.data) {
                  companiesMap.value[cId] = cRes.data;
                }
              } catch {
                // Ignore
              }
            }
          }
        } catch {
          // Ignore
        }
      })
    );
  }
}

async function loadQualifications() {
  isLoading.value = true;
  try {
    // Fetch all qualifications so KPI stats always reflect the overall counts accurately
    const res = await lookupsApi.getAcademicQualifications();
    if (res.success && Array.isArray(res.data)) {
      qualificationsList.value = res.data;
    } else if (lookupsStore.academicQualifications && lookupsStore.academicQualifications.length > 0) {
      qualificationsList.value = lookupsStore.academicQualifications as any;
    } else {
      qualificationsList.value = [];
    }
    // Resolve any member details if only IDs were returned
    resolveMissingMembers(qualificationsList.value);
  } catch (err) {
    if (lookupsStore.academicQualifications && lookupsStore.academicQualifications.length > 0) {
      qualificationsList.value = lookupsStore.academicQualifications as any;
    } else {
      qualificationsList.value = [];
      notificationStore.error(extractErrorMessage(err, 'خطا در بارگذاری مدارک تحصیلی'));
    }
  } finally {
    isLoading.value = false;
  }
}

// Reactive filtering for desk table list
const filteredQualifications = computed(() => {
  let list = qualificationsList.value;

  // Filter by status if selected
  if (selectedStatus.value) {
    list = list.filter((q) => normalizeStatus(q.verificationStatus) === selectedStatus.value);
  }

  // Filter by degree level if selected
  if (selectedDegreeLevel.value) {
    list = list.filter((q) => {
      const dId = typeof q.degreeLevel === 'object' && q.degreeLevel ? q.degreeLevel._id : q.degreeLevel;
      return dId === selectedDegreeLevel.value;
    });
  }

  // Filter by search string (matches degree, university, city, person name, company name, member code)
  const qStr = search.value.trim().toLowerCase();
  if (qStr) {
    list = list.filter((item) => {
      const titleMatch = item.title?.toLowerCase().includes(qStr);
      const instMatch = item.institution?.toLowerCase().includes(qStr);
      const cityMatch = item.city?.toLowerCase().includes(qStr);
      const fieldTitle = displayFieldTitle(item.academicField).toLowerCase();
      const degreeTitle = displayDegreeTitle(item.degreeLevel).toLowerCase();

      const memberInfo = getMemberInfo(item.memberId, item);
      const memberMatch =
        memberInfo.displayName.toLowerCase().includes(qStr) ||
        memberInfo.secondaryName.toLowerCase().includes(qStr) ||
        memberInfo.personName.toLowerCase().includes(qStr) ||
        memberInfo.companyName.toLowerCase().includes(qStr) ||
        Boolean(memberInfo.code?.toLowerCase().includes(qStr)) ||
        Boolean(memberInfo.nationalCode?.toLowerCase().includes(qStr));

      return (
        Boolean(titleMatch) ||
        Boolean(instMatch) ||
        Boolean(cityMatch) ||
        fieldTitle.includes(qStr) ||
        degreeTitle.includes(qStr) ||
        memberMatch
      );
    });
  }

  return list;
});

// Overall KPI Counts (computed across the complete qualifications dataset)
const stats = computed(() => {
  const all = qualificationsList.value;
  let pendingCount = 0;
  let approvedCount = 0;
  let rejectedCount = 0;

  for (const q of all) {
    const st = normalizeStatus(q.verificationStatus);
    if (st === 'APPROVED') {
      approvedCount++;
    } else if (st === 'REJECTED') {
      rejectedCount++;
    } else {
      pendingCount++;
    }
  }

  return {
    total: all.length,
    pending: pendingCount,
    approved: approvedCount,
    rejected: rejectedCount,
  };
});

function openVerifyModal(item: IAcademicQualification) {
  activeQualificationForVerify.value = item;
  isVerifyModalOpen.value = true;
}

function openTimelineModal(item: IAcademicQualification) {
  activeQualificationForTimeline.value = item;
  isTimelineModalOpen.value = true;
}

function handleVerified(updatedQual: IAcademicQualification) {
  const idx = qualificationsList.value.findIndex((q) => q._id === updatedQual._id);
  if (idx >= 0) {
    qualificationsList.value[idx] = updatedQual;
  } else {
    qualificationsList.value.unshift(updatedQual);
  }
  // Also refresh in background from server
  loadQualifications();
}

function openMemberProfile(mId: string) {
  if (!mId) return;
  selectedMemberIdForDrawer.value = mId;
  isMemberDrawerOpen.value = true;
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

interface ResolvedMemberInfo {
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

function getMemberInfo(memberIdProp: any, item?: IAcademicQualification | null): ResolvedMemberInfo {
  const rawId = typeof memberIdProp === 'object' && memberIdProp ? memberIdProp._id : memberIdProp;
  const id = typeof rawId === 'string' ? rawId : '';

  // Candidate member object from prop or cache
  const cachedMember = id ? membersMap.value[id] : null;
  const m = (typeof memberIdProp === 'object' && memberIdProp ? memberIdProp : cachedMember) || {};

  // 1. Person Name
  const first = m.firstName || cachedMember?.firstName || '';
  const last = m.lastName || cachedMember?.lastName || '';
  let personName = `${first} ${last}`.trim();
  if (!personName && (m.fullName || (cachedMember as any)?.fullName)) {
    personName = m.fullName || (cachedMember as any)?.fullName || '';
  }

  // 2. Company Name
  let companyName = '';

  // Direct companyName on member or item
  if (m.companyName || (cachedMember as any)?.companyName) {
    companyName = m.companyName || (cachedMember as any)?.companyName || '';
  } else if (item && (item as any).companyName) {
    companyName = (item as any).companyName;
  }

  // Check companyInformation on m or cachedMember
  const cInfo = m.companyInformation || cachedMember?.companyInformation;
  if (!companyName && cInfo) {
    if (typeof cInfo === 'object' && cInfo.title) {
      companyName = cInfo.title;
    } else if (typeof cInfo === 'string' && companiesMap.value[cInfo]) {
      companyName = companiesMap.value[cInfo].title;
    }
  }

  // Check direct company property on item or m
  if (!companyName && (item as any)?.company) {
    const directC = (item as any).company;
    companyName = typeof directC === 'object' && directC?.title ? directC.title : String(directC || '');
  }

  // 3. Member Code & National Code
  const code = m.memberCode || cachedMember?.memberCode || '';
  const nationalCode = m.nationalCode || cachedMember?.nationalCode || '';

  // 4. Determine primary displayName and secondaryName
  const isCompanyOnly = Boolean(companyName && !personName);
  let displayName = '';
  let secondaryName = '';

  if (personName && companyName) {
    displayName = personName;
    secondaryName = companyName;
  } else if (personName) {
    displayName = personName;
    secondaryName = '';
  } else if (companyName) {
    displayName = companyName;
    secondaryName = '';
  } else if (code) {
    displayName = `عضو صنف (${code})`;
    secondaryName = '';
  } else {
    displayName = 'عضو صنف';
    secondaryName = '';
  }

  const profileImage = m.profileImage || (cachedMember as any)?.profileImage || '';

  return {
    id,
    personName,
    companyName,
    displayName,
    secondaryName,
    code,
    nationalCode,
    isCompany: isCompanyOnly,
    profileImage,
  };
}

function getStatusBadgeClasses(status?: string): string {
  const st = normalizeStatus(status);
  switch (st) {
    case 'APPROVED':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
    case 'REJECTED':
      return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
    case 'PENDING':
    default:
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
  }
}

function getStatusLabel(status?: string): string {
  const st = normalizeStatus(status);
  switch (st) {
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
  <div class="space-y-6 text-right select-none" dir="rtl">
    <!-- Header Title & Action Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
      <div>
        <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
          <div class="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 flex items-center justify-center font-bold shadow-xs">
            <GraduationCap class="w-5 h-5" />
          </div>
          <span>کارتابل متمرکز بررسی مدارک تحصیلی اعضا</span>
        </h1>
        <p class="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          ارزیابی مدارک آموزش عالی، تائید دانشنامه‌ها، ثبت علت عدم انطباق و پایش سوابق صحت‌سنجی
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <Button
          variant="outline"
          size="sm"
          :loading="isLoading"
          title="تازه‌سازی کارتابل"
          @click="loadQualifications"
        >
          <RefreshCw class="w-4 h-4 ml-1" />
          تازه‌سازی کارتابل
        </Button>
      </div>
    </div>

    <!-- Quick Stat KPI Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <!-- Total -->
      <div
        :class="[
          'p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xs flex items-center justify-between cursor-pointer transition border-2',
          selectedStatus === ''
            ? 'border-purple-500 bg-purple-50/30 dark:bg-purple-950/20 shadow-sm'
            : 'border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700',
        ]"
        @click="selectedStatus = ''"
      >
        <div>
          <span class="text-xs text-purple-700 dark:text-purple-400 font-bold block mb-1 flex items-center gap-1">
            <GraduationCap class="w-3.5 h-3.5" />
            کل مدارک ثبت‌شده
          </span>
          <span class="text-2xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
            {{ toPersianDigits(stats.total) }}
          </span>
        </div>
        <div class="w-11 h-11 rounded-2xl bg-purple-100/80 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 flex items-center justify-center">
          <GraduationCap class="w-5 h-5" />
        </div>
      </div>

      <!-- Pending (Highlighted) -->
      <div
        :class="[
          'p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xs flex items-center justify-between cursor-pointer transition border-2',
          selectedStatus === 'PENDING'
            ? 'border-amber-500 bg-amber-50/30 dark:bg-amber-950/20 shadow-sm'
            : 'border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-700',
        ]"
        @click="selectedStatus = 'PENDING'"
      >
        <div>
          <span class="text-xs text-amber-700 dark:text-amber-400 font-bold block mb-1 flex items-center gap-1">
            <Clock class="w-3.5 h-3.5" />
            در انتظار بررسی کارشناس
          </span>
          <span class="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
            {{ toPersianDigits(stats.pending) }}
          </span>
        </div>
        <div class="w-11 h-11 rounded-2xl bg-amber-100/80 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 flex items-center justify-center">
          <Clock class="w-5 h-5" />
        </div>
      </div>

      <!-- Approved -->
      <div
        :class="[
          'p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xs flex items-center justify-between cursor-pointer transition border-2',
          selectedStatus === 'APPROVED'
            ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-sm'
            : 'border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-700',
        ]"
        @click="selectedStatus = 'APPROVED'"
      >
        <div>
          <span class="text-xs text-emerald-700 dark:text-emerald-400 font-bold block mb-1 flex items-center gap-1">
            <CheckCircle2 class="w-3.5 h-3.5" />
            مدارک تائید شده
          </span>
          <span class="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
            {{ toPersianDigits(stats.approved) }}
          </span>
        </div>
        <div class="w-11 h-11 rounded-2xl bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center">
          <CheckCircle2 class="w-5 h-5" />
        </div>
      </div>

      <!-- Rejected -->
      <div
        :class="[
          'p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xs flex items-center justify-between cursor-pointer transition border-2',
          selectedStatus === 'REJECTED'
            ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 shadow-sm'
            : 'border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-700',
        ]"
        @click="selectedStatus = 'REJECTED'"
      >
        <div>
          <span class="text-xs text-rose-700 dark:text-rose-400 font-bold block mb-1 flex items-center gap-1">
            <XCircle class="w-3.5 h-3.5" />
            مدارک رد شده
          </span>
          <span class="text-2xl font-black text-rose-600 dark:text-rose-400 tabular-nums">
            {{ toPersianDigits(stats.rejected) }}
          </span>
        </div>
        <div class="w-11 h-11 rounded-2xl bg-rose-100/80 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 flex items-center justify-center">
          <XCircle class="w-5 h-5" />
        </div>
      </div>
    </div>

    <!-- Filters Bar Card -->
    <div class="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
      <div class="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-center">
        <!-- Search Input -->
        <div class="sm:col-span-2 lg:col-span-3">
          <Input
            v-model="search"
            placeholder="جستجو بر اساس عنوان مدرک، دانشگاه، نام عضو یا کد عضویت..."
            @keyup.enter="loadQualifications"
          >
            <template #prefix>
              <Search class="w-4 h-4" />
            </template>
          </Input>
        </div>

        <!-- Status Filter -->
        <div class="sm:col-span-1 lg:col-span-2">
          <Select
            v-model="selectedStatus"
            placeholder="فیلتر بر اساس وضعیت تائید"
            :options="statusFilterOptions"
          />
        </div>

        <!-- Degree Level Filter -->
        <div class="sm:col-span-1 lg:col-span-1">
          <Select
            v-model="selectedDegreeLevel"
            placeholder="مقطع تحصیلی"
            :options="degreeLevelOptions"
          />
        </div>
      </div>
    </div>

    <!-- Table Container Card -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
      <!-- Loading State -->
      <div v-if="isLoading" class="py-16 text-center text-xs text-slate-400">
        در حال بارگذاری مدارک تحصیلی...
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredQualifications.length === 0" class="py-12">
        <EmptyState
          title="هیچ مدرکی با فیلترهای انتخابی یافت نشد"
          description="می‌توانید فیلتر وضعیت تائید یا متن جستجو را تغییر دهید."
          :icon="GraduationCap"
        >
          <template #action>
            <Button
              variant="outline"
              size="sm"
              @click="selectedStatus = ''; selectedDegreeLevel = ''; search = '';"
            >
              پاک کردن همه فیلترها
            </Button>
          </template>
        </EmptyState>
      </div>

      <!-- Qualifications Data Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-right text-xs divide-y divide-slate-100 dark:divide-slate-800">
          <thead class="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold">
            <tr>
              <th scope="col" class="py-3 px-4 w-12 text-center">#</th>
              <th scope="col" class="py-3 px-4">مشخصات عضو / شرکت</th>
              <th scope="col" class="py-3 px-4">عنوان و رشته تحصیلی</th>
              <th scope="col" class="py-3 px-4">دانشگاه و محل تحصیل</th>
              <th scope="col" class="py-3 px-4">دوره و معدل</th>
              <th scope="col" class="py-3 px-4">وضعیت تائید</th>
              <th scope="col" class="py-3 px-4 text-center">عملیات کارشناسی</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="(item, idx) in filteredQualifications"
              :key="item._id"
              class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
            >
              <!-- Index -->
              <td class="py-3.5 px-4 text-center font-bold text-slate-400 tabular-nums">
                {{ toPersianDigits(idx + 1) }}
              </td>

              <!-- Member & Company Information -->
              <td class="py-3.5 px-4">
                <div
                  v-if="getMemberInfo(item.memberId, item).id || getMemberInfo(item.memberId, item).displayName"
                  class="flex items-start gap-2.5 cursor-pointer group"
                  @click="openMemberProfile(getMemberInfo(item.memberId, item).id)"
                >
                  <!-- Avatar Icon / Initial -->
                  <div
                    v-if="getMemberInfo(item.memberId, item).isCompany && !getMemberInfo(item.memberId, item).personName"
                    class="w-9 h-9 rounded-xl font-bold flex items-center justify-center shrink-0 text-xs shadow-2xs mt-0.5 transition-colors bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60"
                  >
                    <Building2 class="w-4 h-4" />
                  </div>
                  <MemberAvatar
                    v-else
                    :profile-image="getMemberInfo(item.memberId, item).profileImage"
                    :full-name="getMemberInfo(item.memberId, item).displayName"
                    size="sm"
                    shape="rounded"
                    class="mt-0.5"
                  />

                  <!-- Details -->
                  <div class="space-y-0.5">
                    <!-- Main Name (Person or Company) -->
                    <div class="font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 transition flex items-center gap-1.5">
                      <span>{{ getMemberInfo(item.memberId, item).displayName }}</span>
                      <ExternalLink class="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition shrink-0" />
                    </div>

                    <!-- Secondary Name (Affiliated Company or Person) -->
                    <div
                      v-if="getMemberInfo(item.memberId, item).secondaryName"
                      class="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1 font-medium"
                    >
                      <Building2 class="w-3 h-3 shrink-0" />
                      <span class="truncate max-w-[200px]">{{ getMemberInfo(item.memberId, item).secondaryName }}</span>
                    </div>

                    <!-- Codes: Member Code & National Code -->
                    <div class="flex items-center gap-2 text-[11px] text-slate-400 pt-0.5">
                      <span
                        v-if="getMemberInfo(item.memberId, item).code"
                        class="bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold px-1.5 py-0.2 rounded tabular-nums"
                      >
                        کد: {{ toPersianDigits(getMemberInfo(item.memberId, item).code) }}
                      </span>
                      <span v-if="getMemberInfo(item.memberId, item).nationalCode" class="tabular-nums">
                        کد ملی: {{ toPersianDigits(getMemberInfo(item.memberId, item).nationalCode) }}
                      </span>
                    </div>
                  </div>
                </div>
                <div v-else class="text-slate-400">
                  —
                </div>
              </td>

              <!-- Degree Title & Academic Field -->
              <td class="py-3.5 px-4">
                <div class="space-y-1">
                  <div class="font-bold text-slate-900 dark:text-slate-100">
                    {{ item.title }}
                  </div>
                  <div class="flex flex-wrap items-center gap-1.5">
                    <Badge variant="purple" size="sm">
                      {{ displayDegreeTitle(item.degreeLevel) }}
                    </Badge>
                    <span class="text-[11px] text-slate-500 dark:text-slate-400">
                      {{ displayFieldTitle(item.academicField) }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- University & City -->
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-1.5">
                  <Building2 class="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span class="font-semibold text-slate-800 dark:text-slate-200">
                    {{ item.institution || '—' }}
                  </span>
                </div>
                <div v-if="item.city" class="text-[11px] text-slate-400 mt-0.5 mr-5">
                  شهر: {{ item.city }}
                </div>
              </td>

              <!-- Years & GPA -->
              <td class="py-3.5 px-4 tabular-nums">
                <div class="font-semibold text-slate-700 dark:text-slate-300">
                  <template v-if="item.startYear && item.graduationYear">
                    {{ toPersianDigits(item.startYear) }} الی {{ toPersianDigits(item.graduationYear) }}
                  </template>
                  <template v-else-if="item.graduationYear">
                    فارغ‌التحصیل {{ toPersianDigits(item.graduationYear) }}
                  </template>
                  <template v-else>—</template>
                </div>
                <div class="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                  <template v-if="item.gpa !== undefined && item.gpa !== null">
                    معدل: {{ toPersianDigits(item.gpa) }} از ۲۰
                  </template>
                  <template v-else>
                    <span class="text-slate-400 font-normal">معدل نامشخص</span>
                  </template>
                </div>
              </td>

              <!-- Status Badge & Rejection Alert Tooltip -->
              <td class="py-3.5 px-4">
                <div class="space-y-1">
                  <span
                    :class="[
                      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border',
                      getStatusBadgeClasses(item.verificationStatus),
                    ]"
                  >
                    <CheckCircle2 v-if="normalizeStatus(item.verificationStatus) === 'APPROVED'" class="w-3.5 h-3.5" />
                    <XCircle v-else-if="normalizeStatus(item.verificationStatus) === 'REJECTED'" class="w-3.5 h-3.5" />
                    <Clock v-else class="w-3.5 h-3.5" />
                    {{ getStatusLabel(item.verificationStatus) }}
                  </span>

                  <!-- Rejection Reason Preview if Rejected -->
                  <div
                    v-if="normalizeStatus(item.verificationStatus) === 'REJECTED' && item.rejectionReason"
                    class="text-[11px] text-rose-700 dark:text-rose-400 max-w-xs truncate flex items-center gap-1"
                    :title="item.rejectionReason"
                  >
                    <AlertTriangle class="w-3 h-3 text-rose-500 shrink-0" />
                    <span class="truncate">{{ item.rejectionReason }}</span>
                  </div>
                </div>
              </td>

              <!-- Actions -->
              <td class="py-3.5 px-4 text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <!-- Verify Decision Button -->
                  <Button
                    variant="primary"
                    size="sm"
                    class="text-xs"
                    title="بررسی و تائید / رد مدرک"
                    @click="openVerifyModal(item)"
                  >
                    <ShieldCheck class="w-3.5 h-3.5 ml-1" />
                    بررسی مدرک
                  </Button>

                  <!-- Audit Logs Timeline Button -->
                  <Button
                    variant="outline"
                    size="sm"
                    class="text-xs"
                    title="تاریخچه و لاگ گردش کار"
                    @click="openTimelineModal(item)"
                  >
                    <History class="w-3.5 h-3.5 ml-1" />
                    گردش کار
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Table Footer Summary -->
      <div class="p-3 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span>
          نمایش <strong class="font-bold text-slate-700 dark:text-slate-300 tabular-nums">{{ toPersianDigits(filteredQualifications.length) }}</strong> مدرک
        </span>
        <span class="text-[11px] text-slate-400">
          سامانه جامع ارزیابی و استعلام مدارک تحصیلی اعضای سازمان نصر
        </span>
      </div>
    </div>

    <!-- Verify Modal -->
    <VerifyQualificationModal
      v-model:open="isVerifyModalOpen"
      :qualification="activeQualificationForVerify"
      :member-id="getMemberInfo(activeQualificationForVerify?.memberId, activeQualificationForVerify).id"
      :member-name="getMemberInfo(activeQualificationForVerify?.memberId, activeQualificationForVerify).secondaryName ? `${getMemberInfo(activeQualificationForVerify?.memberId, activeQualificationForVerify).displayName} (${getMemberInfo(activeQualificationForVerify?.memberId, activeQualificationForVerify).secondaryName})` : getMemberInfo(activeQualificationForVerify?.memberId, activeQualificationForVerify).displayName"
      @verified="handleVerified"
    />

    <!-- Audit Logs Timeline Modal -->
    <VerificationLogsTimeline
      v-model:open="isTimelineModalOpen"
      :qualification="activeQualificationForTimeline"
    />

    <!-- Member Detail Drawer -->
    <MemberDetailDrawer
      v-model:open="isMemberDrawerOpen"
      :member-id="selectedMemberIdForDrawer"
      @updated="loadQualifications"
    />
  </div>
</template>
