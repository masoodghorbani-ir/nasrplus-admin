<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { companiesApi } from '@/api';
import { useNotificationStore } from '@/stores';
import type { Company, CreateCompanyInput, CompanyType } from '@/types';
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  Download,
  Edit,
  Trash2,
  Globe,
  Mail,
  Eye,
  FilterX,
} from 'lucide-vue-next';
import {
  Button,
  Input,
  Select,
  DatePicker,
  Badge,
  Pagination,
  Modal,
  ConfirmDialog,
  EmptyState,
  Skeleton,
  TableActions,
} from '@/components/ui';
import {
  toPersianDigits,
  companyTypeConfig,
  formatPersianDate,
} from '@/utils/formatters';
import { extractErrorMessage } from '@/utils/errors';

const notificationStore = useNotificationStore();

const companies = ref<Company[]>([]);
const isLoading = ref(false);
const totalRecords = ref(0);
const totalPages = ref(1);

const page = ref(1);
const limit = ref(10);
const search = ref('');
const dateFrom = ref('');
const dateTo = ref('');

// Create/Edit modal state
const isFormModalOpen = ref(false);
const editingCompany = ref<Company | null>(null);
const isSubmitting = ref(false);

const titleInput = ref('');
const companyTypeInput = ref<CompanyType>('KNOWLEDGE_BASED');
const nationalIdInput = ref('');
const regNumberInput = ref('');
const economicCodeInput = ref('');
const ceoNameInput = ref('');
const websiteInput = ref('');
const emailInput = ref('');
const descInput = ref('');
const formErrors = ref<Record<string, string>>({});

// View Detail modal state
const viewingCompany = ref<Company | null>(null);

// Delete state
const companyToDelete = ref<Company | null>(null);
const isDeleting = ref(false);

async function loadCompanies() {
  isLoading.value = true;
  try {
    const res = await companiesApi.getCompanies({
      page: page.value,
      limit: limit.value,
      search: search.value.trim() || undefined,
    });

    if (res.success) {
      companies.value = res.data;
      if (res.meta) {
        totalRecords.value = res.meta.total;
        totalPages.value = res.meta.totalPages;
      } else {
        totalRecords.value = res.data.length;
        totalPages.value = 1;
      }
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در بارگذاری لیست شرکت‌ها'));
  } finally {
    isLoading.value = false;
  }
}

function handleSearch() {
  page.value = 1;
  loadCompanies();
}

const displayedCompanies = computed(() => {
  if (!dateFrom.value && !dateTo.value) {
    return companies.value;
  }
  return companies.value.filter((c) => {
    if (!c.createdAt) return false;
    const itemDate = new Date(c.createdAt);
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
});

function resetFilters() {
  search.value = '';
  dateFrom.value = '';
  dateTo.value = '';
  page.value = 1;
  loadCompanies();
}

function openCreateModal() {
  editingCompany.value = null;
  titleInput.value = '';
  companyTypeInput.value = 'KNOWLEDGE_BASED';
  nationalIdInput.value = '';
  regNumberInput.value = '';
  economicCodeInput.value = '';
  ceoNameInput.value = '';
  websiteInput.value = '';
  emailInput.value = '';
  descInput.value = '';
  formErrors.value = {};
  isFormModalOpen.value = true;
}

function openEditModal(c: Company) {
  editingCompany.value = c;
  titleInput.value = c.title || '';
  companyTypeInput.value = c.companyType || 'PRIVATE_JOINT_STOCK';
  nationalIdInput.value = c.nationalId || '';
  regNumberInput.value = c.registrationNumber || '';
  economicCodeInput.value = c.economicCode || '';
  ceoNameInput.value = c.ceoName || '';
  websiteInput.value = c.website || '';
  emailInput.value = c.email || '';
  descInput.value = c.description || '';
  formErrors.value = {};
  isFormModalOpen.value = true;
}

function validateForm(): boolean {
  formErrors.value = {};
  if (!titleInput.value.trim()) {
    formErrors.value.title = 'نام شرکت / موسسه الزامی است';
  }
  return Object.keys(formErrors.value).length === 0;
}

async function handleSaveCompany() {
  if (!validateForm()) return;

  isSubmitting.value = true;
  try {
    const payload: CreateCompanyInput = {
      title: titleInput.value.trim(),
      companyType: companyTypeInput.value,
      nationalId: nationalIdInput.value.trim() || undefined,
      registrationNumber: regNumberInput.value.trim() || undefined,
      economicCode: economicCodeInput.value.trim() || undefined,
      ceoName: ceoNameInput.value.trim() || undefined,
      website: websiteInput.value.trim() || undefined,
      email: emailInput.value.trim() || undefined,
      description: descInput.value.trim() || undefined,
    };

    if (editingCompany.value) {
      const res = await companiesApi.updateCompany(editingCompany.value._id, payload);
      if (res.success) {
        notificationStore.success('مشخصات شرکت با موفقیت به‌روزرسانی شد.');
        isFormModalOpen.value = false;
        loadCompanies();
      }
    } else {
      const res = await companiesApi.createCompany(payload);
      if (res.success) {
        notificationStore.success('شرکت جدید با موفقیت در سامانه ثبت شد.');
        isFormModalOpen.value = false;
        loadCompanies();
      }
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در ذخیره اطلاعات شرکت'));
  } finally {
    isSubmitting.value = false;
  }
}

async function handleDeleteCompany() {
  if (!companyToDelete.value) return;

  isDeleting.value = true;
  try {
    const res = await companiesApi.deleteCompany(companyToDelete.value._id);
    if (res.success) {
      notificationStore.success('اطلاعات شرکت حذف گردید.');
      companyToDelete.value = null;
      loadCompanies();
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در حذف شرکت'));
  } finally {
    isDeleting.value = false;
  }
}

function exportCsv() {
  if (companies.value.length === 0) {
    notificationStore.warning('داده‌ای برای خروجی موجود نیست.');
    return;
  }

  const headers = ['نام شرکت', 'نوع شرکت', 'شناسه ملی', 'شماره ثبت', 'کد اقتصادی', 'مدیرعامل'];
  const rows = companies.value.map((c) => [
    c.title,
    c.companyType ? companyTypeConfig[c.companyType] : '',
    c.nationalId || '',
    c.registrationNumber || '',
    c.economicCode || '',
    c.ceoName || '',
  ]);

  const csvContent =
    '\uFEFF' +
    [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `companies_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  notificationStore.success('فایل خروجی شرکت‌ها دانلود شد.');
}

onMounted(() => {
  loadCompanies();
});
</script>

<template>
  <div class="space-y-6 text-right select-none" dir="rtl">
    <!-- Header Title & Action Buttons -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
      <div>
        <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          مدیریت شرکت‌ها و اشخاص حقوقی
        </h1>
        <p class="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          ساماندهی مشخصات شرکت‌ها، شناسه ملی، شماره ثبت و وضعیت حقوقی اعضا
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <Button
          variant="outline"
          size="sm"
          :loading="isLoading"
          title="تازه‌سازی لیست"
          @click="loadCompanies"
        >
          <RefreshCw class="w-4 h-4 ml-1" />
          تازه‌سازی
        </Button>

        <Button
          variant="outline"
          size="sm"
          @click="exportCsv"
        >
          <Download class="w-4 h-4 ml-1" />
          خروجی اکسل
        </Button>

        <Button
          variant="primary"
          size="sm"
          @click="openCreateModal"
        >
          <Plus class="w-4 h-4 ml-1" />
          ثبت شرکت جدید
        </Button>
      </div>
    </div>

    <!-- Search Bar Card -->
    <div
      class="p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3"
    >
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
        <div class="lg:col-span-2">
          <Input
            v-model="search"
            placeholder="جستجوی نام شرکت، شناسه ملی، شماره ثبت یا نام مدیرعامل..."
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <Search class="w-4 h-4" />
            </template>
          </Input>
        </div>

        <DatePicker
          v-model="dateFrom"
          placeholder="از تاریخ ثبت پرونده..."
        />

        <DatePicker
          v-model="dateTo"
          placeholder="تا تاریخ ثبت پرونده..."
        />
      </div>

      <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        <span class="text-slate-500 dark:text-slate-400">
          مجموع نتایج:
          <strong class="font-bold text-slate-800 dark:text-slate-200">
            {{ toPersianDigits(displayedCompanies.length) }} شرکت
          </strong>
        </span>

        <div class="flex items-center gap-2">
          <Button
            v-if="search || dateFrom || dateTo"
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
            جستجو
          </Button>
        </div>
      </div>
    </div>

    <!-- Companies Data Table Card -->
    <div
      class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-right text-xs">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
              <th class="py-3.5 px-4">نام شرکت و هویت</th>
              <th class="py-3.5 px-4">نوع شخصیت حقوقی</th>
              <th class="py-3.5 px-4">شناسه ملی</th>
              <th class="py-3.5 px-4">شماره ثبت</th>
              <th class="py-3.5 px-4">کد اقتصادی</th>
              <th class="py-3.5 px-4">مدیرعامل</th>
              <th class="py-3.5 px-4">ارتباطات</th>
              <th class="py-3.5 px-4 text-left">عملیات</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-100 dark:divide-slate-800/80">
            <!-- Loading Skeleton -->
            <template v-if="isLoading">
              <tr v-for="i in 5" :key="i">
                <td colspan="8" class="py-4 px-4">
                  <Skeleton height="h-7" />
                </td>
              </tr>
            </template>

            <!-- Empty State -->
            <template v-else-if="displayedCompanies.length === 0">
              <tr>
                <td colspan="8">
                  <EmptyState
                    title="هیچ شرکتی یافت نشد"
                    description="شرکتی با فیلترهای انتخابی پیدا نشد. می‌توانید فیلترها را تغییر دهید یا شرکت جدیدی ثبت کنید."
                    :icon="Building2"
                  >
                    <template #action>
                      <Button variant="primary" size="sm" @click="openCreateModal">
                        ثبت شرکت جدید
                      </Button>
                    </template>
                  </EmptyState>
                </td>
              </tr>
            </template>

            <!-- Data Rows -->
            <tr
              v-for="company in displayedCompanies"
              v-else
              :key="company._id"
              class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
            >
              <!-- Title & Avatar -->
              <td class="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0">
                    <Building2 class="w-4 h-4" />
                  </div>
                  <div>
                    <span class="text-sm block">{{ company.title }}</span>
                    <span v-if="company.description" class="text-[11px] text-slate-400 font-normal truncate max-w-xs block">
                      {{ company.description }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- Company Type -->
              <td class="py-3.5 px-4">
                <Badge :variant="company.companyType === 'KNOWLEDGE_BASED' ? 'brand' : 'default'">
                  {{ company.companyType ? companyTypeConfig[company.companyType] : 'نامشخص' }}
                </Badge>
              </td>

              <!-- National ID -->
              <td class="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                {{ toPersianDigits(company.nationalId) || '—' }}
              </td>

              <!-- Reg Number -->
              <td class="py-3.5 px-4 text-slate-600 dark:text-slate-400 tabular-nums">
                {{ toPersianDigits(company.registrationNumber) || '—' }}
              </td>

              <!-- Economic Code -->
              <td class="py-3.5 px-4 text-slate-600 dark:text-slate-400 tabular-nums">
                {{ toPersianDigits(company.economicCode) || '—' }}
              </td>

              <!-- CEO Name -->
              <td class="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                {{ company.ceoName || '—' }}
              </td>

              <!-- Website & Email links -->
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-2">
                  <a
                    v-if="company.website"
                    :href="company.website.startsWith('http') ? company.website : `https://${company.website}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="p-1 text-slate-400 hover:text-brand-600 rounded"
                    title="وب‌سایت"
                  >
                    <Globe class="w-3.5 h-3.5" />
                  </a>
                  <a
                    v-if="company.email"
                    :href="`mailto:${company.email}`"
                    class="p-1 text-slate-400 hover:text-brand-600 rounded"
                    title="ایمیل"
                  >
                    <Mail class="w-3.5 h-3.5" />
                  </a>
                  <span v-if="!company.website && !company.email" class="text-slate-400">—</span>
                </div>
              </td>

              <!-- Actions -->
              <td class="py-3.5 px-4 text-left">
                <TableActions
                  primary-label="جزییات"
                  :primary-icon="Eye"
                  primary-title="مشاهده جزییات شرکت"
                  @primary="viewingCompany = company"
                  :items="[
                    {
                      label: 'ویرایش شرکت',
                      icon: Edit,
                      onClick: () => openEditModal(company),
                    },
                    {
                      label: 'حذف شرکت',
                      icon: Trash2,
                      danger: true,
                      divider: true,
                      onClick: () => { companyToDelete = company; },
                    },
                  ]"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <Pagination
        v-model:page="page"
        v-model:limit="limit"
        :total="totalRecords"
        :total-pages="totalPages"
        @change="loadCompanies"
      />
    </div>

    <!-- Create / Edit Company Modal -->
    <Modal
      :open="isFormModalOpen"
      :title="editingCompany ? 'ویرایش اطلاعات شرکت' : 'ثبت شرکت حقوقی جدید'"
      :subtitle="editingCompany ? `شناسه: ${editingCompany.title}` : 'تکمیل مشخصات ثبتی و سازمانی شرکت عضو'"
      size="xl"
      @close="isFormModalOpen = false"
    >
      <form class="space-y-4 text-right" @submit.prevent="handleSaveCompany">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            v-model="titleInput"
            label="نام ثبتی شرکت / موسسه"
            placeholder="نام ثبتی شرکت یا موسسه را وارد نمایید"
            :error="formErrors.title"
            required
          />

          <Select
            v-model="companyTypeInput"
            label="نوع شرکت"
            :options="[
              { label: 'دانش‌بنیان', value: 'KNOWLEDGE_BASED' },
              { label: 'سهامی خاص', value: 'PRIVATE_JOINT_STOCK' },
              { label: 'سهامی عام', value: 'PUBLIC_JOINT_STOCK' },
              { label: 'با مسئولیت محدود', value: 'LIMITED_LIABILITY' },
              { label: 'استارتاپ', value: 'STARTUP' },
              { label: 'تعاونی', value: 'COOPERATIVE' },
              { label: 'سایر', value: 'OTHER' },
            ]"
            required
          />

          <Input
            v-model="nationalIdInput"
            label="شناسه ملی (۱۱ رقم)"
            placeholder="شناسه ملی ۱۱ رقمی را وارد نمایید"
            dir="ltr"
          />

          <Input
            v-model="regNumberInput"
            label="شماره ثبت"
            placeholder="شماره ثبت شرکت را وارد نمایید"
            dir="ltr"
          />

          <Input
            v-model="economicCodeInput"
            label="کد اقتصادی"
            placeholder="کد اقتصادی را وارد نمایید"
            dir="ltr"
          />

          <Input
            v-model="ceoNameInput"
            label="نام مدیرعامل"
            placeholder="نام و نام خانوادگی مدیرعامل را وارد نمایید"
          />

          <Input
            v-model="websiteInput"
            label="وب‌سایت رسمی"
            placeholder="آدرس وب‌سایت را وارد نمایید"
            dir="ltr"
          />

          <Input
            v-model="emailInput"
            label="پست الکترونیک (ایمیل)"
            placeholder="پست الکترونیکی را وارد نمایید"
            dir="ltr"
          />
        </div>

        <div>
          <Input
            v-model="descInput"
            label="شرح فعالیت و توضیحات"
            placeholder="توضیح کوتاه درباره زمینه فعالیت شرکت و خدمات فاوا..."
          />
        </div>
      </form>

      <template #footer>
        <Button variant="outline" size="md" :disabled="isSubmitting" @click="isFormModalOpen = false">
          انصراف
        </Button>
        <Button variant="primary" size="md" :loading="isSubmitting" @click="handleSaveCompany">
          {{ editingCompany ? 'ذخیره تغییرات' : 'ثبت شرکت' }}
        </Button>
      </template>
    </Modal>

    <!-- View Company Detail Modal -->
    <Modal
      :open="Boolean(viewingCompany)"
      title="شناسنامه شرکت عضو"
      subtitle="جزییات ثبتی و مشخصات هویتی شخص حقوقی"
      size="md"
      @close="viewingCompany = null"
    >
      <div v-if="viewingCompany" class="space-y-4 text-right">
        <div class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-brand-600 text-white font-bold flex items-center justify-center text-lg">
            {{ viewingCompany.title[0] }}
          </div>
          <div>
            <h4 class="text-base font-bold text-slate-900 dark:text-slate-100">
              {{ viewingCompany.title }}
            </h4>
            <span class="text-xs text-brand-600 dark:text-brand-400 font-medium">
              {{ viewingCompany.companyType ? companyTypeConfig[viewingCompany.companyType] : 'شرکت' }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 text-xs">
          <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            <span class="text-slate-400 block mb-1">شناسه ملی:</span>
            <span class="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
              {{ toPersianDigits(viewingCompany.nationalId) || '—' }}
            </span>
          </div>

          <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            <span class="text-slate-400 block mb-1">شماره ثبت:</span>
            <span class="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
              {{ toPersianDigits(viewingCompany.registrationNumber) || '—' }}
            </span>
          </div>

          <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            <span class="text-slate-400 block mb-1">کد اقتصادی:</span>
            <span class="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
              {{ toPersianDigits(viewingCompany.economicCode) || '—' }}
            </span>
          </div>

          <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            <span class="text-slate-400 block mb-1">نام مدیرعامل:</span>
            <span class="font-bold text-slate-800 dark:text-slate-200">
              {{ viewingCompany.ceoName || '—' }}
            </span>
          </div>

          <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            <span class="text-slate-400 block mb-1">وب‌سایت:</span>
            <a
              v-if="viewingCompany.website"
              :href="viewingCompany.website"
              target="_blank"
              class="text-brand-600 hover:underline"
              dir="ltr"
            >
              {{ viewingCompany.website }}
            </a>
            <span v-else class="text-slate-400">—</span>
          </div>

          <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            <span class="text-slate-400 block mb-1">پست الکترونیک:</span>
            <span class="text-slate-700 dark:text-slate-300" dir="ltr">
              {{ viewingCompany.email || '—' }}
            </span>
          </div>
        </div>

        <div v-if="viewingCompany.description" class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs">
          <span class="text-slate-400 block mb-1">توضیحات:</span>
          <p class="text-slate-800 dark:text-slate-200 leading-relaxed">
            {{ viewingCompany.description }}
          </p>
        </div>

        <div class="text-[11px] text-slate-400 text-center pt-2">
          تاریخ ثبت پرونده: {{ formatPersianDate(viewingCompany.createdAt, true) }}
        </div>
      </div>

      <template #footer>
        <Button variant="outline" size="md" @click="viewingCompany = null">بستن</Button>
      </template>
    </Modal>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      :open="Boolean(companyToDelete)"
      title="حذف شرکت"
      :description="`آیا از حذف اطلاعات شرکت «${companyToDelete?.title}» اطمینان دارید؟ این عملیات غیرقابل بازگشت است.`"
      confirm-text="حذف شرکت"
      variant="danger"
      :loading="isDeleting"
      @confirm="handleDeleteCompany"
      @cancel="companyToDelete = null"
    />
  </div>
</template>
