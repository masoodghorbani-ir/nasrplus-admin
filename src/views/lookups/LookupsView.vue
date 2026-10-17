<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { lookupsApi } from '@/api';
import { useLookupsStore, useNotificationStore } from '@/stores';
import {
  Database,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  Bookmark,
  Layers,
  Award,
  BookOpen,
  GraduationCap,
  ArrowRight,
  ChevronLeft,
  LayoutGrid,
} from 'lucide-vue-next';
import {
  Button,
  Input,
  Select,
  Badge,
  Modal,
  ConfirmDialog,
  EmptyState,
  Skeleton,
  TableActions,
  CategoryCard,
  type CategoryColor,
} from '@/components/ui';
import { toPersianDigits } from '@/utils/formatters';
import { extractErrorMessage } from '@/utils/errors';

const route = useRoute();
const router = useRouter();
const lookupsStore = useLookupsStore();
const notificationStore = useNotificationStore();

export type LookupTab =
  | 'membership-types'
  | 'specializations'
  | 'ranks'
  | 'nature-of-memberships'
  | 'academic-fields'
  | 'degree-levels';

interface LookupCategoryDef {
  id: LookupTab;
  label: string;
  description: string;
  icon: any;
  color: CategoryColor;
  getCount: () => number;
}

const categories: LookupCategoryDef[] = [
  {
    id: 'membership-types',
    label: 'انواع عضویت',
    description: 'مدیریت انواع عضویت تعریف شده در سازمان نظام صنفی',
    icon: Bookmark,
    color: 'emerald',
    getCount: () => lookupsStore.membershipTypes.length,
  },
  {
    id: 'specializations',
    label: 'رسته‌های تخصصی',
    description: 'مدیریت رسته‌ها و شاخه‌های تخصصی فاوا و فناوری اطلاعات',
    icon: Layers,
    color: 'cyan',
    getCount: () => lookupsStore.specializations.length,
  },
  {
    id: 'ranks',
    label: 'رتبه‌ها و درجات',
    description: 'مدیریت رتبه‌بندی، سطوح و درجات صنفی اعضا و شرکت‌ها',
    icon: Award,
    color: 'amber',
    getCount: () => lookupsStore.ranks.length,
  },
  {
    id: 'nature-of-memberships',
    label: 'ماهیت عضویت',
    description: 'تعریف ماهیت‌های عضویت اعضا و اشخاص حقیقی و حقوقی',
    icon: Database,
    color: 'purple',
    getCount: () => lookupsStore.natureOfMemberships.length,
  },
  {
    id: 'academic-fields',
    label: 'رشته‌های تحصیلی',
    description: 'مدیریت رشته‌ها و گرایش‌های تحصیلی معتبر در نظام صنفی',
    icon: BookOpen,
    color: 'blue',
    getCount: () => lookupsStore.academicFields.length,
  },
  {
    id: 'degree-levels',
    label: 'مقاطع تحصیلی',
    description: 'تعریف مقاطع تحصیلی از دیپلم تا دکتری تخصصی',
    icon: GraduationCap,
    color: 'indigo',
    getCount: () => lookupsStore.degreeLevels.length,
  },
];

const selectedLookup = ref<LookupTab | null>(null);
const hubSearchQuery = ref('');
const tableSearchQuery = ref('');
const isSubmitting = ref(false);

// Sync with route query param
watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab && categories.some((c) => c.id === newTab)) {
      selectedLookup.value = newTab as LookupTab;
    } else {
      selectedLookup.value = null;
    }
  },
  { immediate: true }
);

function selectCategory(id: LookupTab) {
  selectedLookup.value = id;
  router.push({ query: { ...route.query, tab: id } });
  tableSearchQuery.value = '';
}

function backToHub() {
  selectedLookup.value = null;
  const q = { ...route.query };
  delete q.tab;
  router.push({ query: q });
  tableSearchQuery.value = '';
}

function normalizeText(text?: string | number | null): string {
  if (text === undefined || text === null) return '';
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[يى]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

const currentCategory = computed(() => {
  return categories.find((c) => c.id === selectedLookup.value) || null;
});

const filteredCategories = computed(() => {
  const q = normalizeText(hubSearchQuery.value);
  if (!q) return categories;
  return categories.filter(
    (c) =>
      normalizeText(c.label).includes(q) ||
      normalizeText(c.description).includes(q)
  );
});

const totalLookupsCount = computed(() => {
  return (
    lookupsStore.membershipTypes.length +
    lookupsStore.specializations.length +
    lookupsStore.ranks.length +
    lookupsStore.natureOfMemberships.length +
    lookupsStore.academicFields.length +
    lookupsStore.degreeLevels.length
  );
});

const categoryOptions = computed(() => {
  return categories.map((c) => ({
    label: c.label,
    value: c.id,
  }));
});

// Modal state
const isFormModalOpen = ref(false);
const editingId = ref<string | null>(null);

// Form inputs
const formTitle = ref('');
const formCode = ref('');
const formDescription = ref('');
const formLevel = ref<number | undefined>(undefined);

// Delete state
const itemToDelete = ref<{ id: string; title: string } | null>(null);
const isDeleting = ref(false);

async function refreshAll() {
  await lookupsStore.fetchAllLookups(true);
  notificationStore.success('جداول اطلاعات پایه با موفقیت به‌روزرسانی شد.');
}

const currentItems = computed(() => {
  if (!selectedLookup.value) return [];

  let list: any[] = [];
  switch (selectedLookup.value) {
    case 'membership-types':
      list = lookupsStore.membershipTypes;
      break;
    case 'specializations':
      list = lookupsStore.specializations;
      break;
    case 'ranks':
      list = lookupsStore.ranks;
      break;
    case 'nature-of-memberships':
      list = lookupsStore.natureOfMemberships;
      break;
    case 'academic-fields':
      list = lookupsStore.academicFields;
      break;
    case 'degree-levels':
      list = lookupsStore.degreeLevels;
      break;
  }

  const q = normalizeText(tableSearchQuery.value);
  if (!q) return list;

  return list.filter((item) => {
    return (
      normalizeText(item.title).includes(q) ||
      normalizeText(item.code).includes(q) ||
      normalizeText(item.description).includes(q) ||
      normalizeText(item.institution).includes(q)
    );
  });
});

function openCreateModal() {
  editingId.value = null;
  formTitle.value = '';
  formCode.value = '';
  formDescription.value = '';
  formLevel.value = undefined;
  isFormModalOpen.value = true;
}

function openEditModal(item: any) {
  editingId.value = item._id;
  formTitle.value = item.title || '';
  formCode.value = item.code || '';
  formDescription.value = item.description || '';
  formLevel.value = item.level;
  isFormModalOpen.value = true;
}

async function handleSaveItem() {
  if (!formTitle.value.trim()) {
    notificationStore.warning('لطفاً عنوان را وارد فرمایید.');
    return;
  }
  if (!selectedLookup.value) return;

  isSubmitting.value = true;
  try {
    const isEdit = Boolean(editingId.value);
    const id = editingId.value;

    switch (selectedLookup.value) {
      case 'membership-types': {
        const payload = {
          title: formTitle.value.trim(),
          code: formCode.value.trim() || undefined,
          description: formDescription.value.trim() || undefined,
        };
        if (isEdit && id) {
          await lookupsApi.updateMembershipType(id, payload);
        } else {
          await lookupsApi.createMembershipType(payload);
        }
        break;
      }
      case 'specializations': {
        const payload = {
          title: formTitle.value.trim(),
          code: formCode.value.trim() || undefined,
        };
        if (isEdit && id) {
          await lookupsApi.updateSpecialization(id, payload);
        } else {
          await lookupsApi.createSpecialization(payload);
        }
        break;
      }
      case 'ranks': {
        const payload = {
          title: formTitle.value.trim(),
          level: formLevel.value ? Number(formLevel.value) : undefined,
        };
        if (isEdit && id) {
          await lookupsApi.updateRank(id, payload);
        } else {
          await lookupsApi.createRank(payload);
        }
        break;
      }
      case 'nature-of-memberships': {
        const payload = {
          title: formTitle.value.trim(),
          code: formCode.value.trim() || undefined,
        };
        if (isEdit && id) {
          await lookupsApi.updateNatureOfMembership(id, payload);
        } else {
          await lookupsApi.createNatureOfMembership(payload);
        }
        break;
      }
      case 'academic-fields': {
        const payload = {
          title: formTitle.value.trim(),
        };
        if (isEdit && id) {
          await lookupsApi.updateAcademicField(id, payload);
        } else {
          await lookupsApi.createAcademicField(payload);
        }
        break;
      }
      case 'degree-levels': {
        const payload = {
          title: formTitle.value.trim(),
          description: formDescription.value.trim() || undefined,
        };
        if (isEdit && id) {
          await lookupsApi.updateDegreeLevel(id, payload);
        } else {
          await lookupsApi.createDegreeLevel(payload);
        }
        break;
      }
    }

    notificationStore.success('عملیات با موفقیت انجام شد.');
    isFormModalOpen.value = false;
    await lookupsStore.fetchAllLookups(true);
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در ثبت مورد'));
  } finally {
    isSubmitting.value = false;
  }
}

async function handleDeleteItem() {
  if (!itemToDelete.value || !selectedLookup.value) return;

  isDeleting.value = true;
  try {
    const id = itemToDelete.value.id;
    switch (selectedLookup.value) {
      case 'membership-types':
        await lookupsApi.deleteMembershipType(id);
        break;
      case 'specializations':
        await lookupsApi.deleteSpecialization(id);
        break;
      case 'ranks':
        await lookupsApi.deleteRank(id);
        break;
      case 'nature-of-memberships':
        await lookupsApi.deleteNatureOfMembership(id);
        break;
      case 'academic-fields':
        await lookupsApi.deleteAcademicField(id);
        break;
      case 'degree-levels':
        await lookupsApi.deleteDegreeLevel(id);
        break;
    }

    notificationStore.success('رکورد مورد نظر با موفقیت حذف گردید.');
    itemToDelete.value = null;
    await lookupsStore.fetchAllLookups(true);
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در حذف رکورد'));
  } finally {
    isDeleting.value = false;
  }
}

onMounted(() => {
  lookupsStore.fetchAllLookups();
});
</script>

<template>
  <div class="space-y-6 text-right select-none" dir="rtl">
    <!-- VIEW 1: HUB / CATEGORY SELECTION CARDS VIEW -->
    <div v-if="!selectedLookup" class="space-y-6">
      <!-- Header Section -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            اطلاعات پایه و تعاریف صنف
          </h1>
          <p class="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            انواع عضویت، رسته‌ها، رتبه‌بندی، ماهیت و مدارک تحصیلی و سایر تعاریف مرتبط با صنف
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            :loading="lookupsStore.isLoading"
            title="تازه‌سازی جداول"
            @click="refreshAll"
          >
            <RefreshCw class="w-4 h-4 ml-1.5" />
            تازه‌سازی همه
          </Button>
        </div>
      </div>

      <!-- Search & Overview Stats Bar -->
      <div
        class="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div class="w-full sm:max-w-sm">
          <Input
            v-model="hubSearchQuery"
            placeholder="جستجو در دسته‌بندی‌های اطلاعات پایه..."
          >
            <template #prefix>
              <Search class="w-4 h-4" />
            </template>
          </Input>
        </div>

        <div class="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div class="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <LayoutGrid class="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>{{ toPersianDigits(categories.length) }} دسته‌بندی مرجع</span>
          </div>

          <div class="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <Database class="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>مجموع {{ toPersianDigits(totalLookupsCount) }} رکورد فعال</span>
          </div>
        </div>
      </div>

      <!-- Categories Card Grid (Pixel-perfect to user design) -->
      <div
        v-if="filteredCategories.length > 0"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
      >
        <CategoryCard
          v-for="cat in filteredCategories"
          :key="cat.id"
          :title="cat.label"
          :description="cat.description"
          :icon="cat.icon"
          :color="cat.color"
          :count="cat.getCount()"
          count-label="رکورد تعریف شده در سیستم"
          @click="selectCategory(cat.id)"
        />
      </div>

      <!-- Empty State for Search -->
      <div
        v-else
        class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8"
      >
        <EmptyState
          title="دسته‌بندی با این عنوان یافت نشد"
          description="لطفاً عبارت دیگری را برای جستجو در اطلاعات پایه وارد فرمایید."
          :icon="Search"
        >
          <template #action>
            <Button variant="outline" size="sm" @click="hubSearchQuery = ''">
              پاک کردن جستجو
            </Button>
          </template>
        </EmptyState>
      </div>
    </div>

    <!-- VIEW 2: CATEGORY DETAIL & TABLE MANAGEMENT VIEW -->
    <div v-else class="space-y-6">
      <!-- Breadcrumb & Top Navigation Bar -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            @click="backToHub"
            class="shrink-0"
          >
            <ArrowRight class="w-4 h-4 ml-1.5" />
            <span>بازگشت به اطلاعات پایه</span>
          </Button>

          <div class="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          <!-- Breadcrumbs -->
          <nav class="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <button
              type="button"
              class="hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer"
              @click="backToHub"
            >
              اطلاعات پایه
            </button>
            <ChevronLeft class="w-3.5 h-3.5 text-slate-400" />
            <span class="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <component :is="currentCategory?.icon" class="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              {{ currentCategory?.label }}
            </span>
          </nav>
        </div>

        <div class="flex items-center flex-wrap gap-2.5">
          <!-- Quick Switcher Dropdown -->
          <div class="w-48">
            <Select
              :model-value="selectedLookup"
              :options="categoryOptions"
              size="sm"
              placeholder="تغییر دسته‌بندی..."
              @update:model-value="(val) => selectCategory(val as LookupTab)"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            :loading="lookupsStore.isLoading"
            title="تازه‌سازی جدول"
            @click="refreshAll"
          >
            <RefreshCw class="w-4 h-4 ml-1" />
            تازه‌سازی
          </Button>

          <Button
            variant="primary"
            size="sm"
            @click="openCreateModal"
          >
            <Plus class="w-4 h-4 ml-1" />
            افزودن مورد جدید
          </Button>
        </div>
      </div>

      <!-- Current Category Header Card -->
      <div
        class="p-5 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs flex items-center justify-between gap-4"
      >
        <div class="flex items-center gap-4">
          <div
            :class="[
              'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs',
              currentCategory?.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40' :
              currentCategory?.color === 'cyan' ? 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400 border-cyan-100 dark:border-cyan-900/40' :
              currentCategory?.color === 'amber' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-100 dark:border-amber-900/40' :
              currentCategory?.color === 'purple' ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border-purple-100 dark:border-purple-900/40' :
              currentCategory?.color === 'blue' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border-blue-100 dark:border-blue-900/40' :
              currentCategory?.color === 'indigo' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40' :
              'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border-rose-100 dark:border-rose-900/40'
            ]"
          >
            <component :is="currentCategory?.icon" class="w-6 h-6" />
          </div>

          <div>
            <h2 class="text-lg font-black text-slate-900 dark:text-slate-100">
              مدیریت {{ currentCategory?.label }}
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {{ currentCategory?.description }}
            </p>
          </div>
        </div>

        <div class="hidden sm:flex items-center gap-2">
          <Badge variant="brand" size="md">
            {{ toPersianDigits(currentItems.length) }} رکورد در جدول
          </Badge>
        </div>
      </div>

      <!-- Search & Summary Bar inside Table -->
      <div
        class="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div class="w-full sm:max-w-xs">
          <Input
            v-model="tableSearchQuery"
            placeholder="جستجو در این جدول..."
          >
            <template #prefix>
              <Search class="w-4 h-4" />
            </template>
          </Input>
        </div>

        <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>تعداد کل رکوردها:</span>
          <strong class="font-bold text-slate-800 dark:text-slate-200">
            {{ toPersianDigits(currentItems.length) }} مورد
          </strong>
        </div>
      </div>

      <!-- Lookup Data Table Card -->
      <div
        class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-right text-xs">
            <thead>
              <tr class="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                <th class="py-3.5 px-4">عنوان</th>
                <th v-if="selectedLookup !== 'academic-fields' && selectedLookup !== 'ranks'" class="py-3.5 px-4">کد / شناسه</th>
                <th v-if="selectedLookup === 'ranks'" class="py-3.5 px-4">سطح رتبه (Level)</th>
                <th class="py-3.5 px-4">توضیحات</th>
                <th class="py-3.5 px-4 text-left">عملیات</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-slate-100 dark:divide-slate-800/80">
              <!-- Loading -->
              <template v-if="lookupsStore.isLoading">
                <tr v-for="i in 4" :key="i">
                  <td colspan="5" class="py-4 px-4">
                    <Skeleton height="h-6" />
                  </td>
                </tr>
              </template>

              <!-- Empty -->
              <template v-else-if="currentItems.length === 0">
                <tr>
                  <td colspan="5">
                    <EmptyState
                      title="هیچ رکوردی در این جدول ثبت نشده است"
                      description="می‌توانید با استفاده از دکمه زیر رکورد جدیدی اضافه نمایید."
                      :icon="Database"
                    >
                      <template #action>
                        <Button variant="primary" size="sm" @click="openCreateModal">
                          افزودن مورد جدید
                        </Button>
                      </template>
                    </EmptyState>
                  </td>
                </tr>
              </template>

              <!-- Rows -->
              <tr
                v-for="item in currentItems"
                v-else
                :key="item._id"
                class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
              >
                <!-- Title -->
                <td class="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                  {{ item.title }}
                </td>

                <!-- Code -->
                <td v-if="selectedLookup !== 'academic-fields' && selectedLookup !== 'ranks'" class="py-3.5 px-4 text-slate-600 dark:text-slate-400 tabular-nums">
                  <span v-if="item.code" class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px]">
                    {{ item.code }}
                  </span>
                  <span v-else class="text-slate-400">—</span>
                </td>

                <!-- Rank Level -->
                <td v-if="selectedLookup === 'ranks'" class="py-3.5 px-4 font-bold text-brand-600">
                  <Badge variant="brand">
                    سطح {{ toPersianDigits(item.level ?? 'بدون سطح') }}
                  </Badge>
                </td>

                <!-- Description -->
                <td class="py-3.5 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                  {{ item.description || '—' }}
                </td>

                <!-- Actions -->
                <td class="py-3.5 px-4 text-left">
                  <TableActions
                    primary-label="ویرایش"
                    :primary-icon="Edit"
                    primary-title="ویرایش اطلاعات"
                    @primary="openEditModal(item)"
                    :items="[
                      {
                        label: 'حذف مورد',
                        icon: Trash2,
                        danger: true,
                        onClick: () => { itemToDelete = { id: item._id, title: item.title }; },
                      },
                    ]"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <Modal
      :open="isFormModalOpen"
      :title="editingId ? 'ویرایش رکورد پایه' : 'افزودن رکورد جدید'"
      :subtitle="currentCategory?.label"
      size="md"
      @close="isFormModalOpen = false"
    >
      <form class="space-y-4 text-right" @submit.prevent="handleSaveItem">
        <Input
          v-model="formTitle"
          label="عنوان"
          placeholder="عنوان نمایشی مورد نظر..."
          required
        />

        <Input
          v-if="['membership-types', 'specializations', 'nature-of-memberships'].includes(selectedLookup || '')"
          v-model="formCode"
          label="کد انگلیسی شناسه (Code)"
          placeholder="مثال: SOFTWARE"
          dir="ltr"
        />

        <Input
          v-if="selectedLookup === 'ranks'"
          v-model="formLevel"
          type="number"
          label="سطح رتبه (Level)"
          placeholder="مثال: 1, 2, 3"
          dir="ltr"
        />

        <Input
          v-if="['membership-types', 'degree-levels'].includes(selectedLookup || '')"
          v-model="formDescription"
          label="توضیحات تکمیلی"
          placeholder="توضیحات مربوطه..."
        />
      </form>

      <template #footer>
        <Button variant="outline" size="md" :disabled="isSubmitting" @click="isFormModalOpen = false">
          انصراف
        </Button>
        <Button variant="primary" size="md" :loading="isSubmitting" @click="handleSaveItem">
          {{ editingId ? 'ذخیره تغییرات' : 'ثبت مورد' }}
        </Button>
      </template>
    </Modal>

    <!-- Delete Confirm Dialog -->
    <ConfirmDialog
      :open="Boolean(itemToDelete)"
      title="حذف رکورد از جدول پایه"
      :description="`آیا از حذف «${itemToDelete?.title}» از پایگاه داده اطمینان دارید؟ توجه داشته باشید که این عمل ممکن است بر روی رکوردهای مرتبط در سایر بخش‌ها تأثیرگذار باشد.`"
      confirm-text="بله، حذف کن"
      cancel-text="انصراف"
      variant="danger"
      :loading="isDeleting"
      @confirm="handleDeleteItem"
      @cancel="itemToDelete = null"
    />
  </div>
</template>
