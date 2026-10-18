<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { membersApi } from '@/api';
import { useLookupsStore, useNotificationStore } from '@/stores';
import type { Member, MemberStatus } from '@/types';
import {
  Plus,
  Search,
  FilterX,
  Download,
  FileSpreadsheet,
  Eye,
  Edit,
  Trash2,
  Users,
  RefreshCw,
  Calendar,
  MapPin,
  Phone,
  GraduationCap,
  Camera,
  Award,
} from 'lucide-vue-next';
import {
  Button,
  Input,
  Select,
  DatePicker,
  Badge,
  Pagination,
  ConfirmDialog,
  EmptyState,
  Skeleton,
  TableActions,
  MemberAvatar,
} from '@/components/ui';
import {
  toPersianDigits,
  statusConfig,
} from '@/utils/formatters';
import { extractErrorMessage } from '@/utils/errors';
import { getMemberLatestDegreeTitle } from '@/utils/qualifications';
import MemberFormModal from './MemberFormModal.vue';
import MemberDetailDrawer from './MemberDetailDrawer.vue';
import MemberImportModal from './MemberImportModal.vue';
import MemberContactsModal from './MemberContactsModal.vue';
import MemberQualificationsModal from './MemberQualificationsModal.vue';
import MemberSkillsModal from './MemberSkillsModal.vue';
import MemberPhotoModal from './components/MemberPhotoModal.vue';

const route = useRoute();
const router = useRouter();
const lookupsStore = useLookupsStore();
const notificationStore = useNotificationStore();

const members = ref<Member[]>([]);
const isLoading = ref(false);
const totalRecords = ref(0);
const totalPages = ref(1);

// Helper to resolve raw query param (ID, title or code) to valid membershipType ID
function resolveMembershipTypeId(raw: string): string {
  if (!raw) return '';
  if (lookupsStore.membershipTypes.length > 0) {
    const match = lookupsStore.membershipTypes.find(
      (m) =>
        m._id === raw ||
        m.title === raw ||
        (m.code && m.code.toLowerCase() === raw.toLowerCase())
    );
    if (match) return match._id;
  }
  return raw;
}

const initialQueryTypeId = (route.query.membershipTypeId || route.query.type)
  ? String(route.query.membershipTypeId || route.query.type)
  : '';

// Query & Filter states
const page = ref(1);
const limit = ref(10);
const search = ref('');
const selectedStatus = ref<MemberStatus | ''>('');
const selectedMembershipTypeId = ref(initialQueryTypeId);
const selectedNatureOfMembership = ref('');
const selectedSpecializationId = ref('');
const selectedRankId = ref('');
const dateFrom = ref('');
const dateTo = ref('');

// Modals state
const isFormModalOpen = ref(false);
const editingMember = ref<Member | null>(null);

const isImportModalOpen = ref(false);

const isDetailDrawerOpen = ref(false);
const viewingMemberId = ref<string | null>(null);
const detailDrawerInitialTab = ref<'info' | 'addresses' | 'telephones' | 'qualifications' | 'skills'>('info');

const isContactsModalOpen = ref(false);
const managingContactsMember = ref<Member | null>(null);
const contactsModalInitialTab = ref<'addresses' | 'telephones'>('addresses');

function openContactsModal(member: Member, tab: 'addresses' | 'telephones' = 'addresses') {
  managingContactsMember.value = member;
  contactsModalInitialTab.value = tab;
  isContactsModalOpen.value = true;
}

const isQualificationsModalOpen = ref(false);
const managingQualificationsMember = ref<Member | null>(null);

function openQualificationsModal(member: Member) {
  managingQualificationsMember.value = member;
  isQualificationsModalOpen.value = true;
}

const isSkillsModalOpen = ref(false);
const managingSkillsMember = ref<Member | null>(null);

function openSkillsModal(member: Member) {
  managingSkillsMember.value = member;
  isSkillsModalOpen.value = true;
}

const isPhotoModalOpen = ref(false);
const managingPhotoMember = ref<Member | null>(null);
const photoTimestamp = ref(Date.now());

function openPhotoModalForMember(member: Member) {
  managingPhotoMember.value = member;
  isPhotoModalOpen.value = true;
}

function handlePhotoUpdated(updatedPhotoPath: string) {
  if (managingPhotoMember.value) {
    managingPhotoMember.value.profileImage = updatedPhotoPath;
  }
  photoTimestamp.value = Date.now();
  loadMembers();
}

function getMemberLatestDegree(member: Member): string {
  return getMemberLatestDegreeTitle(member, lookupsStore);
}

const memberToDelete = ref<Member | null>(null);
const isDeleting = ref(false);

function handleImportSuccess() {
  loadMembers();
}

async function loadMembers() {
  isLoading.value = true;
  try {
    const res = await membersApi.getMembers({
      page: page.value,
      limit: limit.value,
      search: search.value.trim() || undefined,
      status: selectedStatus.value || undefined,
      natureOfMembership: selectedNatureOfMembership.value || undefined,
      membershipTypeId: selectedMembershipTypeId.value || undefined,
      specializationId: selectedSpecializationId.value || undefined,
      rankId: selectedRankId.value || undefined,
      ...(dateFrom.value ? { createdFrom: dateFrom.value } : {}),
      ...(dateTo.value ? { createdTo: dateTo.value } : {}),
    });

    if (res.success) {
      members.value = res.data;
      if (res.meta) {
        totalRecords.value = res.meta.total;
        totalPages.value = res.meta.totalPages;
      } else {
        totalRecords.value = res.data.length;
        totalPages.value = 1;
      }
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در بارگذاری فهرست اعضا'));
  } finally {
    isLoading.value = false;
  }
}

const displayedMembers = computed(() => {
  let list = members.value;

  // Filter by selectedMembershipTypeId if client-side check needed
  if (selectedMembershipTypeId.value) {
    list = list.filter((m) => {
      const typeId =
        typeof m.membershipTypeId === 'object' && m.membershipTypeId
          ? m.membershipTypeId._id
          : m.membershipTypeId;
      return typeId === selectedMembershipTypeId.value;
    });
  }

  // Filter by date range
  if (dateFrom.value || dateTo.value) {
    list = list.filter((m) => {
      const rawDate = m.membershipDate || m.createdAt;
      if (!rawDate) return false;
      const itemDate = new Date(rawDate);
      if (isNaN(itemDate.getTime())) return true;
      if (dateFrom.value) {
        const from = new Date(dateFrom.value);
        from.setHours(0, 0, 0, 0);
        if (itemDate < from) return false;
      }
      if (dateTo.value) {
        const to = new Date(dateTo.value);
        to.setHours(23, 59, 59, 999);
        if (itemDate > to) return false;
      }
      return true;
    });
  }

  return list;
});

function handleSearch() {
  page.value = 1;
  loadMembers();
}

function resetFilters() {
  search.value = '';
  selectedStatus.value = '';
  selectedMembershipTypeId.value = '';
  selectedNatureOfMembership.value = '';
  selectedSpecializationId.value = '';
  selectedRankId.value = '';
  dateFrom.value = '';
  dateTo.value = '';
  page.value = 1;
  loadMembers();
}

function openCreateModal() {
  isDetailDrawerOpen.value = false;
  editingMember.value = null;
  isFormModalOpen.value = true;
}

function openEditModal(m: Member) {
  isDetailDrawerOpen.value = false;
  editingMember.value = m;
  isFormModalOpen.value = true;
}

function openDetailDrawer(memberId: string, initialTab: 'info' | 'addresses' | 'telephones' | 'qualifications' | 'skills' = 'info') {
  viewingMemberId.value = memberId;
  detailDrawerInitialTab.value = initialTab;
  isDetailDrawerOpen.value = true;
}

function onMemberSaved() {
  loadMembers();
}

async function handleDeleteMember() {
  if (!memberToDelete.value) return;

  isDeleting.value = true;
  try {
    const res = await membersApi.deleteMember(memberToDelete.value._id);
    if (res.success) {
      notificationStore.success('پرونده عضو با موفقیت حذف گردید.');
      memberToDelete.value = null;
      loadMembers();
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در حذف عضو'));
  } finally {
    isDeleting.value = false;
  }
}

function exportCsv() {
  if (members.value.length === 0) {
    notificationStore.warning('داده‌ای برای خروجی وجود ندارد.');
    return;
  }

  const headers = ['کد عضویت', 'نام', 'نام خانوادگی', 'کد ملی', 'ماهیت عضویت', 'نوع عضویت', 'وضعیت'];
  const rows = members.value.map((m) => [
    m.memberCode,
    m.firstName || '',
    m.lastName || '',
    m.nationalCode || '',
    lookupsStore.getNatureTitle(m.natureOfMembership),
    lookupsStore.getMembershipTypeTitle(m.membershipTypeId),
    statusConfig[m.status]?.label || m.status,
  ]);

  const csvContent =
    '\uFEFF' +
    [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `members_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  notificationStore.success('فایل گزارش با موفقیت دانلود شد.');
}

// 1. Sync from URL Query to State
watch(
  () => [route.query.membershipTypeId, route.query.type],
  ([newTypeId, newType]) => {
    const raw = (newTypeId || newType) ? String(newTypeId || newType) : '';
    const resolved = resolveMembershipTypeId(raw);
    if (selectedMembershipTypeId.value !== resolved) {
      selectedMembershipTypeId.value = resolved;
    }
  }
);

// If lookupsStore loads after component mount, re-resolve title/code if needed
watch(
  () => lookupsStore.membershipTypes,
  () => {
    const raw = (route.query.membershipTypeId || route.query.type)
      ? String(route.query.membershipTypeId || route.query.type)
      : '';
    if (raw) {
      const resolved = resolveMembershipTypeId(raw);
      if (resolved && selectedMembershipTypeId.value !== resolved) {
        selectedMembershipTypeId.value = resolved;
      }
    }
  }
);

// 2. Sync from State to URL Query
watch(selectedMembershipTypeId, (newVal) => {
  const currentQueryVal = (route.query.membershipTypeId || route.query.type)
    ? String(route.query.membershipTypeId || route.query.type)
    : '';
  if (newVal !== currentQueryVal) {
    const nextQuery = { ...route.query };
    if (newVal) {
      nextQuery.membershipTypeId = newVal;
      delete nextQuery.type;
    } else {
      delete nextQuery.membershipTypeId;
      delete nextQuery.type;
    }
    router.replace({ query: nextQuery });
  }
});

watch(
  [
    selectedStatus,
    selectedMembershipTypeId,
    selectedNatureOfMembership,
    selectedSpecializationId,
    selectedRankId,
    dateFrom,
    dateTo,
  ],
  () => {
    page.value = 1;
    loadMembers();
  }
);

onMounted(async () => {
  await lookupsStore.fetchAllLookups();
  if (initialQueryTypeId) {
    selectedMembershipTypeId.value = resolveMembershipTypeId(initialQueryTypeId);
  }
  loadMembers();

  // If redirected with viewId query param
  if (route.query.viewId) {
    openDetailDrawer(route.query.viewId as string);
  }

  // If redirected with import query param
  if (route.query.import === 'true') {
    isImportModalOpen.value = true;
  }
});
</script>

<template>
  <div class="space-y-6 text-right select-none" dir="rtl">
    <!-- Header Title & Action Buttons -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
      <div>
        <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          مدیریت اعضای سازمان نظام صنفی رایانه‌ای
        </h1>
        <p class="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          مشاهده، جستجو، ثبت و مدیریت پرونده‌های عضویت حقیقی و حقوقی
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <Button
          variant="outline"
          size="sm"
          :loading="isLoading"
          title="تازه‌سازی لیست"
          @click="loadMembers"
        >
          <RefreshCw class="w-4 h-4 ml-1" />
          تازه‌سازی
        </Button>

        <Button
          variant="outline"
          size="sm"
          title="دریافت فایل اکسل / CSV"
          @click="exportCsv"
        >
          <Download class="w-4 h-4 ml-1" />
          خروجی اکسل
        </Button>

        <Button
          variant="outline"
          size="sm"
          title="ورود دسته‌جمعی اعضا از فایل اکسل"
          @click="isImportModalOpen = true"
        >
          <FileSpreadsheet class="w-4 h-4 ml-1 text-emerald-600 dark:text-emerald-400" />
          ورود از اکسل
        </Button>

        <Button
          variant="outline"
          size="sm"
          title="کارتابل متمرکز بررسی مدارک تحصیلی اعضا"
          @click="router.push('/admin/members/qualifications')"
        >
          <GraduationCap class="w-4 h-4 ml-1 text-purple-600 dark:text-purple-400" />
          کارتابل بررسی مدارک
        </Button>

        <Button
          variant="primary"
          size="sm"
          @click="openCreateModal"
        >
          <Plus class="w-4 h-4 ml-1" />
          ثبت عضو جدید
        </Button>
      </div>
    </div>

    <!-- Search & Filters Bar Card -->
    <div
      class="p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4"
    >
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <!-- Search Query Input -->
        <div class="sm:col-span-2 lg:col-span-3 xl:col-span-2">
          <Input
            v-model="search"
            placeholder="جستجو بر اساس نام، کد ملی یا کد عضویت..."
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <Search class="w-4 h-4" />
            </template>
          </Input>
        </div>

        <!-- Membership Type Filter -->
        <Select
          v-model="selectedMembershipTypeId"
          placeholder="همه انواع عضویت"
          :options="[
            { label: 'همه انواع عضویت', value: '' },
            ...lookupsStore.membershipTypes.map(m => ({ label: m.title, value: m._id }))
          ]"
        />

        <!-- Nature of Membership Filter -->
        <Select
          v-model="selectedNatureOfMembership"
          placeholder="همه ماهیت‌ها"
          :options="[
            { label: 'همه ماهیت‌ها (حقیقی / حقوقی)', value: '' },
            ...lookupsStore.natureOfMemberships.map(n => ({ label: n.title, value: n._id }))
          ]"
        />

        <!-- Status Filter -->
        <Select
          v-model="selectedStatus"
          placeholder="همه وضعیت‌ها"
          :options="[
            { label: 'همه وضعیت‌ها', value: '' },
            { label: 'فعال', value: 'ACTIVE' },
            { label: 'در انتظار تایید', value: 'PENDING' },
            { label: 'تعلیق شده', value: 'SUSPENDED' },
            { label: 'منقضی شده', value: 'EXPIRED' },
            { label: 'رد شده', value: 'REJECTED' },
          ]"
        />

        <!-- Specialization Filter -->
        <Select
          v-model="selectedSpecializationId"
          placeholder="همه رسته‌ها"
          :options="[
            { label: 'همه رسته‌های تخصصی', value: '' },
            ...lookupsStore.specializations.map(s => ({ label: s.title, value: s._id }))
          ]"
        />
      </div>

      <!-- Date Range Filter Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 items-center">
        <div class="lg:col-span-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <Calendar class="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
          <span>بازه زمانی تاریخ عضویت / ثبت پرونده:</span>
        </div>

        <DatePicker
          v-model="dateFrom"
          placeholder="از تاریخ..."
        />

        <DatePicker
          v-model="dateTo"
          placeholder="تا تاریخ..."
        />
      </div>

      <!-- Action Row: Execute search & Clear filters -->
      <div class="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
        <span class="text-slate-500 dark:text-slate-400">
          تعداد کل نتایج:
          <strong class="font-bold text-slate-800 dark:text-slate-200">
            {{ toPersianDigits(totalRecords) }} پرونده
          </strong>
        </span>

        <div class="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            @click="resetFilters"
          >
            <FilterX class="w-3.5 h-3.5 ml-1" />
            پاک‌کردن فیلترها
          </Button>

          <Button
            variant="secondary"
            size="sm"
            @click="handleSearch"
          >
            اعمال جستجو
          </Button>
        </div>
      </div>
    </div>

    <!-- Members Data Table Card -->
    <div
      class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-right text-xs">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
              <th class="py-3.5 px-4">کد عضویت</th>
              <th class="py-3.5 px-4">نام و نام خانوادگی</th>
              <th class="py-3.5 px-4">کد ملی</th>
              <th class="py-3.5 px-4">ماهیت عضویت</th>
              <th class="py-3.5 px-4">نوع عضویت</th>
              <th class="py-3.5 px-4">رسته تخصصی</th>
              <th class="py-3.5 px-4">رتبه صنفی</th>
              <th class="py-3.5 px-4">درجه تحصیلی</th>
              <th class="py-3.5 px-4">وضعیت</th>
              <th class="py-3.5 px-4 text-left">عملیات</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-100 dark:divide-slate-800/80">
            <!-- Loading Skeleton -->
            <template v-if="isLoading">
              <tr v-for="i in 5" :key="i">
                <td colspan="10" class="py-4 px-4">
                  <Skeleton height="h-7" />
                </td>
              </tr>
            </template>

            <!-- Empty State -->
            <template v-else-if="displayedMembers.length === 0">
              <tr>
                <td colspan="10">
                  <EmptyState
                    title="هیچ عضوی یافت نشد"
                    description="پرونده‌ای با فیلترهای انتخابی پیدا نشد. می‌توانید فیلترها را تغییر دهید یا عضو جدیدی ثبت کنید."
                    :icon="Users"
                  >
                    <template #action>
                      <Button variant="primary" size="sm" @click="openCreateModal">
                        ثبت عضو جدید
                      </Button>
                    </template>
                  </EmptyState>
                </td>
              </tr>
            </template>

            <!-- Data Rows -->
            <tr
              v-for="member in displayedMembers"
              v-else
              :key="member._id"
              class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
            >
              <!-- Member Code -->
              <td class="py-3.5 px-4 font-bold text-brand-600 dark:text-brand-400 tabular-nums">
                {{ toPersianDigits(member.memberCode) }}
              </td>

              <!-- Full Name & Avatar -->
              <td class="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                <div class="flex items-center gap-2.5">
                  <div
                    class="relative group cursor-pointer shrink-0"
                    title="مدیریت تصویر پرسنلی"
                    @click="openPhotoModalForMember(member)"
                  >
                    <MemberAvatar
                      :profile-image="member.profileImage"
                      :full-name="`${member.firstName || ''} ${member.lastName || ''}`.trim()"
                      :status="member.status"
                      size="sm"
                      shape="circle"
                      show-status
                      :timestamp="photoTimestamp"
                    />
                    <div
                      class="absolute inset-0 bg-black/45 rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                    >
                      <Camera class="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <span>{{ member.firstName || '' }} {{ member.lastName || '' }}</span>
                    <span v-if="!member.firstName && !member.lastName" class="text-slate-400">—</span>
                  </div>
                </div>
              </td>

              <!-- National Code -->
              <td class="py-3.5 px-4 text-slate-600 dark:text-slate-300 tabular-nums">
                {{ toPersianDigits(member.nationalCode) || '—' }}
              </td>

              <!-- Nature of Membership -->
              <td class="py-3.5 px-4 whitespace-nowrap">
                <Badge variant="blue">
                  {{ lookupsStore.getNatureTitle(member.natureOfMembership) }}
                </Badge>
              </td>

              <!-- Membership Type -->
              <td class="py-3.5 px-4 whitespace-nowrap">
                <Badge variant="emerald">
                  {{ lookupsStore.getMembershipTypeTitle(member.membershipTypeId) }}
                </Badge>
              </td>

              <!-- Specialization -->
              <td class="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                {{ lookupsStore.getSpecializationTitle(member.specializationId) }}
              </td>

              <!-- Rank -->
              <td class="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                {{ lookupsStore.getRankTitle(member.rankId) }}
              </td>

              <!-- Academic Degree Level (Latest) -->
              <td class="py-3.5 px-4 whitespace-nowrap">
                <Badge
                  v-if="getMemberLatestDegree(member)"
                  variant="purple"
                >
                  {{ getMemberLatestDegree(member) }}
                </Badge>
                <span v-else class="text-slate-400 font-bold tabular-nums">—</span>
              </td>

              <!-- Status Badge -->
              <td class="py-3.5 px-4">
                <span
                  :class="[
                    'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border',
                    statusConfig[member.status]?.bgClass,
                    statusConfig[member.status]?.textClass,
                    statusConfig[member.status]?.borderClass,
                  ]"
                >
                  <span :class="['w-1.5 h-1.5 rounded-full', statusConfig[member.status]?.dotClass]" />
                  {{ statusConfig[member.status]?.label || member.status }}
                </span>
              </td>

              <!-- Actions -->
              <td class="py-3.5 px-4 text-left">
                <TableActions
                  primary-label="مشاهده"
                  :primary-icon="Eye"
                  primary-title="مشاهده پرونده"
                  @primary="openDetailDrawer(member._id)"
                  :items="[
                    {
                      label: 'ویرایش مشخصات',
                      icon: Edit,
                      onClick: () => openEditModal(member),
                    },
                    {
                      label: 'تصویر پرسنلی',
                      icon: Camera,
                      onClick: () => openPhotoModalForMember(member),
                    },
                    {
                      label: 'مهارت‌ها و تخصص‌ها',
                      icon: Award,
                      onClick: () => openSkillsModal(member),
                    },
                    {
                      label: 'مدارک دانشگاهی',
                      icon: GraduationCap,
                      onClick: () => openQualificationsModal(member),
                    },
                    {
                      label: 'نشانی‌ها و آدرس‌ها',
                      icon: MapPin,
                      onClick: () => openContactsModal(member, 'addresses'),
                    },
                    {
                      label: 'شماره‌های تماس',
                      icon: Phone,
                      onClick: () => openContactsModal(member, 'telephones'),
                    },
                    {
                      label: 'حذف پرونده',
                      icon: Trash2,
                      danger: true,
                      divider: true,
                      onClick: () => { memberToDelete = member; },
                    },
                  ]"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Component -->
      <Pagination
        v-model:page="page"
        v-model:limit="limit"
        :total="totalRecords"
        :total-pages="totalPages"
        @change="loadMembers"
      />
    </div>

    <!-- Member Create / Edit Modal -->
    <MemberFormModal
      v-model:open="isFormModalOpen"
      :member="editingMember"
      @saved="onMemberSaved"
    />

    <!-- Member Excel Import Wizard Modal -->
    <MemberImportModal
      v-model:open="isImportModalOpen"
      @imported="handleImportSuccess"
    />

    <!-- Member Detail Drawer -->
    <MemberDetailDrawer
      v-model:open="isDetailDrawerOpen"
      :member-id="viewingMemberId"
      :initial-tab="detailDrawerInitialTab"
      @edit="openEditModal"
      @updated="loadMembers"
    />

    <!-- Member Contacts & Addresses Modal -->
    <MemberContactsModal
      v-model:open="isContactsModalOpen"
      :member="managingContactsMember"
      :initial-tab="contactsModalInitialTab"
      @updated="loadMembers"
    />

    <!-- Member Academic Qualifications Modal -->
    <MemberQualificationsModal
      v-model:open="isQualificationsModalOpen"
      :member="managingQualificationsMember"
      @updated="loadMembers"
    />

    <!-- Member Skills & Specializations Modal -->
    <MemberSkillsModal
      v-model:open="isSkillsModalOpen"
      :member="managingSkillsMember"
      @updated="loadMembers"
    />

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      :open="Boolean(memberToDelete)"
      title="حذف پرونده عضویت"
      :description="`آیا از حذف پرونده «${memberToDelete?.firstName || ''} ${memberToDelete?.lastName || ''}» با کد ${memberToDelete?.memberCode} اطمینان دارید؟ تمامی نشانی‌ها و اطلاعات ارتباطی این عضو نیز حذف خواهد شد.`"
      confirm-text="حذف نهایی پرونده"
      variant="danger"
      :loading="isDeleting"
      @confirm="handleDeleteMember"
      @cancel="memberToDelete = null"
    />

    <!-- Member Photo Manager Modal -->
    <MemberPhotoModal
      v-if="managingPhotoMember"
      :is-open="isPhotoModalOpen"
      :member-id="managingPhotoMember._id"
      :member-name="`${managingPhotoMember.firstName || ''} ${managingPhotoMember.lastName || ''}`.trim() || managingPhotoMember.memberCode"
      :current-photo="managingPhotoMember.profileImage"
      :current-timestamp="photoTimestamp"
      @close="isPhotoModalOpen = false"
      @updated="handlePhotoUpdated"
    />
  </div>
</template>
