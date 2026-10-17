<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { membersApi, lookupsApi } from '@/api';
import { useLookupsStore, useNotificationStore } from '@/stores';
import type { Member, AcademicQualification } from '@/types';
import {
  Modal,
  Button,
  Badge,
  Input,
  Select,
  ConfirmDialog,
  EmptyState,
} from '@/components/ui';
import { toPersianDigits } from '@/utils/formatters';
import { extractErrorMessage } from '@/utils/errors';
import {
  getStoredMemberQualifications,
  setStoredMemberQualifications,
} from '@/utils/qualifications';
import {
  GraduationCap,
  Building2,
  MapPin,
  Calendar,
  Award,
  FileText,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  Star,
  Check,
} from 'lucide-vue-next';

interface Props {
  open: boolean;
  member: Member | null;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  member: null,
});

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'updated'): void;
}>();

const lookupsStore = useLookupsStore();
const notificationStore = useNotificationStore();

const isLoadingData = ref(false);
const isSaving = ref(false);
const isFormOpen = ref(false);
const itemToDelete = ref<AcademicQualification | null>(null);

// List of all qualifications for this member
const qualifications = ref<AcademicQualification[]>([]);
const latestQualificationId = ref<string>('');

// Form state
const editingQualId = ref<string | null>(null);
const formDegreeLevel = ref('');
const formAcademicField = ref('');
const formInstitution = ref('');
const formCity = ref('');
const formStartYear = ref<string | number>('');
const formGraduationYear = ref<string | number>('');
const formGpa = ref<string | number>('');
const formTitle = ref('');
const formDescription = ref('');
const formIsLatest = ref(true);

// Form Validation Errors
const errors = ref<Record<string, string>>({});

// Degree level options for select
const degreeLevelOptions = computed(() => {
  return lookupsStore.degreeLevels.map((d) => ({
    label: d.title,
    value: d._id,
  }));
});

// Academic field options for select
const academicFieldOptions = computed(() => {
  return lookupsStore.academicFields.map((f) => ({
    label: f.title,
    value: f._id,
  }));
});

// Watch modal open state
watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen && props.member) {
      errors.value = {};
      isFormOpen.value = false;
      await lookupsStore.fetchAllLookups();
      await loadMemberQualifications();
    } else {
      resetForm();
      isFormOpen.value = false;
    }
  }
);

async function loadMemberQualifications() {
  if (!props.member?._id) return;
  isLoadingData.value = true;
  qualifications.value = [];

  try {
    const memberId = props.member._id;

    // 1. Determine currently assigned latest qualification ID on member
    let currentLatestId = '';
    const rawLatest = props.member.latestAcademicQualifications;
    if (rawLatest) {
      if (typeof rawLatest === 'object' && rawLatest._id) {
        currentLatestId = rawLatest._id;
      } else if (typeof rawLatest === 'string') {
        currentLatestId = rawLatest;
      }
    }
    latestQualificationId.value = currentLatestId;

    // 2. Load locally stored qualifications for this member
    const localList = getStoredMemberQualifications(memberId);

    // 3. Match from global lookups store
    const storeMatches = lookupsStore.academicQualifications.filter(
      (q) => (q as any).memberId === memberId || q._id === currentLatestId
    );

    // 4. Merge unique by _id
    const mergedMap = new Map<string, AcademicQualification>();

    for (const q of localList) {
      if (q._id) mergedMap.set(q._id, q);
    }
    for (const q of storeMatches) {
      if (q._id && !mergedMap.has(q._id)) {
        mergedMap.set(q._id, q);
      }
    }

    // If single latest qualification object was populated on member
    if (typeof rawLatest === 'object' && rawLatest._id && !mergedMap.has(rawLatest._id)) {
      mergedMap.set(rawLatest._id, rawLatest as AcademicQualification);
    }

    // Convert map to array
    let list = Array.from(mergedMap.values());

    // If latestQualificationId is set, mark it as isLatest
    if (list.length > 0) {
      if (!currentLatestId) {
        // Elect the first or latest by graduationYear
        const sorted = [...list].sort(
          (a, b) => (Number(b.graduationYear) || 0) - (Number(a.graduationYear) || 0)
        );
        currentLatestId = sorted[0]._id;
        latestQualificationId.value = currentLatestId;
      }

      list = list.map((q) => ({
        ...q,
        isLatest: q._id === currentLatestId,
      }));
    }

    qualifications.value = list;

    // If member has no qualifications, open the form directly
    if (qualifications.value.length === 0) {
      openAddForm();
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در بارگذاری مدارک تحصیلی عضو'));
  } finally {
    isLoadingData.value = false;
  }
}

function openAddForm() {
  editingQualId.value = null;
  formDegreeLevel.value = lookupsStore.degreeLevels[0]?._id || '';
  formAcademicField.value = lookupsStore.academicFields[0]?._id || '';
  formInstitution.value = '';
  formCity.value = '';
  formStartYear.value = '';
  formGraduationYear.value = '';
  formGpa.value = '';
  formTitle.value = '';
  formDescription.value = '';
  // Default to isLatest if it's the first qualification, or true
  formIsLatest.value = qualifications.value.length === 0;
  errors.value = {};
  isFormOpen.value = true;
}

function openEditForm(q: AcademicQualification) {
  editingQualId.value = q._id;
  formDegreeLevel.value =
    typeof q.degreeLevel === 'object' && q.degreeLevel ? q.degreeLevel._id : (q.degreeLevel as string) || '';
  formAcademicField.value =
    typeof q.academicField === 'object' && q.academicField ? q.academicField._id : (q.academicField as string) || '';
  formInstitution.value = q.institution || '';
  formCity.value = q.city || '';
  formStartYear.value = q.startYear || '';
  formGraduationYear.value = q.graduationYear || '';
  formGpa.value = q.gpa !== undefined && q.gpa !== null ? String(q.gpa) : '';
  formTitle.value = q.title || '';
  formDescription.value = q.description || '';
  formIsLatest.value = Boolean(q.isLatest) || q._id === latestQualificationId.value;
  errors.value = {};
  isFormOpen.value = true;
}

function resetForm() {
  editingQualId.value = null;
  formDegreeLevel.value = '';
  formAcademicField.value = '';
  formInstitution.value = '';
  formCity.value = '';
  formStartYear.value = '';
  formGraduationYear.value = '';
  formGpa.value = '';
  formTitle.value = '';
  formDescription.value = '';
  formIsLatest.value = true;
  errors.value = {};
}

function validateForm(): boolean {
  errors.value = {};

  if (!formDegreeLevel.value) {
    errors.value.degreeLevel = 'انتخاب درجه مدرک (مقطع تحصیلی) الزامی است.';
  }

  if (!formAcademicField.value) {
    errors.value.academicField = 'انتخاب رشته تحصیلی الزامی است.';
  }

  if (!formInstitution.value.trim()) {
    errors.value.institution = 'وارد کردن عنوان دانشگاه یا موسسه آموزشی الزامی است.';
  }

  const sYear = formStartYear.value ? Number(formStartYear.value) : null;
  const gYear = formGraduationYear.value ? Number(formGraduationYear.value) : null;

  if (sYear && (sYear < 1300 || sYear > 1500)) {
    errors.value.startYear = 'سال شروع باید بین ۱۳۰۰ تا ۱۵۰۰ باشد.';
  }

  if (gYear && (gYear < 1300 || gYear > 1500)) {
    errors.value.graduationYear = 'سال فارغ‌التحصیلی باید بین ۱۳۰۰ تا ۱۵۰۰ باشد.';
  }

  if (sYear && gYear && sYear > gYear) {
    errors.value.startYear = 'سال شروع نمی‌تواند بزرگتر از سال فارغ‌التحصیلی باشد.';
  }

  if (formGpa.value !== '' && formGpa.value !== null && formGpa.value !== undefined) {
    const gpaNum = Number(formGpa.value);
    if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 20) {
      errors.value.gpa = 'معدل باید عددی بین ۰ تا ۲۰ باشد.';
    }
  }

  return Object.keys(errors.value).length === 0;
}

async function handleSaveQualification() {
  if (!props.member?._id) return;
  if (!validateForm()) return;

  isSaving.value = true;
  try {
    const memberId = props.member._id;
    const selectedDegree = lookupsStore.degreeLevels.find((d) => d._id === formDegreeLevel.value);
    const selectedField = lookupsStore.academicFields.find((f) => f._id === formAcademicField.value);

    // Auto-generate title if empty
    const autoTitle = formTitle.value.trim()
      ? formTitle.value.trim()
      : `${selectedDegree?.title || ''} ${selectedField?.title || ''}${
          formInstitution.value.trim() ? ` - ${formInstitution.value.trim()}` : ''
        }`.trim();

    const payload = {
      title: autoTitle || 'مدرک دانشگاهی',
      academicField: formAcademicField.value,
      degreeLevel: formDegreeLevel.value,
      memberId,
      institution: formInstitution.value.trim() || undefined,
      city: formCity.value.trim() || undefined,
      startYear: formStartYear.value ? Number(formStartYear.value) : undefined,
      graduationYear: formGraduationYear.value ? Number(formGraduationYear.value) : undefined,
      gpa: formGpa.value !== '' && formGpa.value !== null ? Number(formGpa.value) : undefined,
      description: formDescription.value.trim() || undefined,
      isLatest: Boolean(formIsLatest.value),
    };

    let qualId: string;
    let savedQual: AcademicQualification;

    if (editingQualId.value) {
      const updateRes = await lookupsApi.updateAcademicQualification(editingQualId.value, payload);
      qualId = editingQualId.value;
      savedQual = updateRes.data || { _id: qualId, ...payload };
    } else {
      const createRes = await lookupsApi.createAcademicQualification(payload);
      savedQual = createRes.data;
      qualId = savedQual._id;
    }

    // Update local list
    const updatedList = [...qualifications.value];
    const existingIndex = updatedList.findIndex((q) => q._id === qualId);

    const isThisLatest = formIsLatest.value || qualifications.value.length === 0;

    const newObj: AcademicQualification = {
      ...savedQual,
      isLatest: isThisLatest,
    };

    if (existingIndex >= 0) {
      updatedList[existingIndex] = newObj;
    } else {
      updatedList.push(newObj);
    }

    // If this item is designated as latest, unmark others and update Member on backend
    if (isThisLatest) {
      latestQualificationId.value = qualId;
      for (const item of updatedList) {
        item.isLatest = item._id === qualId;
      }
      await membersApi.updateMember(memberId, {
        latestAcademicQualifications: qualId,
      });
    }

    // Persist to local storage
    setStoredMemberQualifications(memberId, updatedList);
    qualifications.value = updatedList;

    // Refresh store & close form
    await lookupsStore.fetchAllLookups(true);
    isFormOpen.value = false;

    notificationStore.success('مدرک تحصیلی با موفقیت ذخیره گردید.');
    emit('updated');
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در ثبت مدرک تحصیلی'));
  } finally {
    isSaving.value = false;
  }
}

async function setAsLatest(qual: AcademicQualification) {
  if (!props.member?._id || !qual._id) return;
  isSaving.value = true;

  try {
    const memberId = props.member._id;
    latestQualificationId.value = qual._id;

    const updatedList = qualifications.value.map((q) => ({
      ...q,
      isLatest: q._id === qual._id,
    }));

    qualifications.value = updatedList;
    setStoredMemberQualifications(memberId, updatedList);

    // Update member record in backend
    await membersApi.updateMember(memberId, {
      latestAcademicQualifications: qual._id,
    });

    notificationStore.success(`مدرک «${displayDegreeTitle(qual.degreeLevel)}» به عنوان آخرین مدرک تحصیلی عضو تنظیم شد.`);
    emit('updated');
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در تنظیم آخرین مدرک تحصیلی'));
  } finally {
    isSaving.value = false;
  }
}

async function handleDeleteQualification() {
  if (!props.member?._id || !itemToDelete.value?._id) return;
  isSaving.value = true;

  try {
    const memberId = props.member._id;
    const delId = itemToDelete.value._id;
    const wasLatest = itemToDelete.value.isLatest || delId === latestQualificationId.value;

    // Filter out from local array
    let updatedList = qualifications.value.filter((q) => q._id !== delId);

    // Try deleting from backend lookup if possible
    try {
      await lookupsApi.deleteAcademicQualification(delId);
    } catch {
      // Backend may disallow deletion if referenced
    }

    // If deleted qualification was latest, designate another one as latest
    if (wasLatest) {
      if (updatedList.length > 0) {
        // Choose the one with latest graduation year or last item
        const sorted = [...updatedList].sort(
          (a, b) => (Number(b.graduationYear) || 0) - (Number(a.graduationYear) || 0)
        );
        const newLatestId = sorted[0]._id;
        latestQualificationId.value = newLatestId;

        updatedList = updatedList.map((q) => ({
          ...q,
          isLatest: q._id === newLatestId,
        }));

        await membersApi.updateMember(memberId, {
          latestAcademicQualifications: newLatestId,
        });
      } else {
        latestQualificationId.value = '';
        await membersApi.updateMember(memberId, {
          latestAcademicQualifications: '' as any,
        });
      }
    }

    qualifications.value = updatedList;
    setStoredMemberQualifications(memberId, updatedList);
    itemToDelete.value = null;

    notificationStore.success('مدرک تحصیلی با موفقیت حذف گردید.');
    emit('updated');
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در حذف مدرک تحصیلی'));
  } finally {
    isSaving.value = false;
  }
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
</script>

<template>
  <Modal
    :open="open"
    size="lg"
    @close="emit('update:open', false)"
  >
    <!-- Modal Header -->
    <template #header>
      <div v-if="member" class="w-full flex items-center justify-between text-right" dir="rtl">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center font-bold">
            <GraduationCap class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>مدارک و تحصیلات دانشگاهی عضو</span>
              <span class="text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/80 px-2 py-0.5 rounded-md tabular-nums">
                {{ toPersianDigits(member.memberCode) }}
              </span>
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              عضو: <strong class="text-slate-700 dark:text-slate-300">{{ member.firstName || '' }} {{ member.lastName || '' }}</strong>
              <span v-if="member.nationalCode" class="mr-2">
                &bull; کد ملی: <span class="tabular-nums">{{ toPersianDigits(member.nationalCode) }}</span>
              </span>
            </p>
          </div>
        </div>
      </div>
    </template>

    <div class="space-y-5 text-right select-none" dir="rtl">
      <!-- Loading State -->
      <div v-if="isLoadingData" class="py-12 text-center text-xs text-slate-400">
        در حال بارگذاری سوابق تحصیلی...
      </div>

      <!-- VIEW MODE: List of Qualifications -->
      <div v-else-if="!isFormOpen" class="space-y-4">
        <!-- Action & Status Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800">
          <div class="text-xs text-slate-600 dark:text-slate-300">
            <span>تعداد مدارک ثبت‌شده: </span>
            <strong class="font-extrabold text-brand-600 dark:text-brand-400 tabular-nums">
              {{ toPersianDigits(qualifications.length) }}
            </strong>
            <span class="text-slate-400 text-[11px] block mt-0.5">
              آخرین مدرک تحصیلی، به عنوان درجه تحصیلی اصلی عضو در لیست اعضا نمایش داده می‌شود.
            </span>
          </div>

          <Button
            variant="primary"
            size="sm"
            @click="openAddForm"
          >
            <Plus class="w-4 h-4 ml-1.5" />
            افزودن مدرک جدید
          </Button>
        </div>

        <!-- Empty State -->
        <div v-if="qualifications.length === 0" class="py-4">
          <EmptyState
            title="هیچ مدرک تحصیلی برای این عضو ثبت نشده است"
            description="می‌توانید مدارک تحصیلی (کارشناسی، کارشناسی ارشد، دکتری و...) این عضو را وارد نمایید. آخرین مدرک ثبت‌شده ملاک اصلی پرونده خواهد بود."
            :icon="GraduationCap"
          >
            <template #action>
              <Button variant="primary" size="sm" @click="openAddForm">
                <Plus class="w-4 h-4 ml-1.5" />
                ثبت اولین مدرک دانشگاهی
              </Button>
            </template>
          </EmptyState>
        </div>

        <!-- Qualifications List -->
        <div v-else class="space-y-3.5">
          <div
            v-for="qual in qualifications"
            :key="qual._id"
            :class="[
              'p-4 rounded-2xl border transition-all duration-150 space-y-3',
              qual.isLatest || qual._id === latestQualificationId
                ? 'bg-gradient-to-br from-purple-50/40 via-white to-purple-50/20 dark:from-purple-950/20 dark:via-slate-800/80 dark:to-purple-950/10 border-purple-300 dark:border-purple-800/80 shadow-xs'
                : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700',
            ]"
          >
            <!-- Card Header: Badges & Action Buttons -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-700/60">
              <div class="flex flex-wrap items-center gap-2">
                <!-- Degree Level Badge -->
                <Badge variant="purple" size="md">
                  {{ displayDegreeTitle(qual.degreeLevel) }}
                </Badge>

                <!-- Latest Degree Badge -->
                <Badge
                  v-if="qual.isLatest || qual._id === latestQualificationId"
                  variant="brand"
                  size="sm"
                >
                  <Star class="w-3 h-3 ml-1 fill-current" />
                  آخرین مدرک تحصیلی (ملاک سیستم)
                </Badge>

                <!-- Academic Field Title -->
                <span class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mr-1">
                  <BookOpen class="w-3.5 h-3.5 text-brand-600" />
                  {{ displayFieldTitle(qual.academicField) }}
                </span>
              </div>

              <!-- Action Buttons -->
              <div class="flex items-center gap-1.5 self-end sm:self-auto">
                <Button
                  v-if="!qual.isLatest && qual._id !== latestQualificationId"
                  variant="ghost"
                  size="sm"
                  class="text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 text-xs"
                  title="تنظیم به عنوان آخرین مدرک تحصیلی عضو"
                  @click="setAsLatest(qual)"
                >
                  <Check class="w-3.5 h-3.5 ml-1" />
                  تنظیم ملاک
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  class="text-xs"
                  @click="openEditForm(qual)"
                >
                  <Edit2 class="w-3.5 h-3.5 ml-1" />
                  ویرایش
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  class="text-rose-600 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs"
                  @click="itemToDelete = qual"
                >
                  <Trash2 class="w-3.5 h-3.5 ml-1" />
                  حذف
                </Button>
              </div>
            </div>

            <!-- Card Body: Grid Details -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <!-- University -->
              <div class="p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
                <span class="text-slate-400 block text-[10px] mb-0.5 flex items-center gap-1">
                  <Building2 class="w-3 h-3 text-blue-500" />
                  دانشگاه / موسسه:
                </span>
                <span class="font-bold text-slate-800 dark:text-slate-200 truncate block">
                  {{ qual.institution || '—' }}
                </span>
              </div>

              <!-- City -->
              <div class="p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
                <span class="text-slate-400 block text-[10px] mb-0.5 flex items-center gap-1">
                  <MapPin class="w-3 h-3 text-emerald-500" />
                  شهر محل تحصیل:
                </span>
                <span class="font-bold text-slate-800 dark:text-slate-200">
                  {{ qual.city || '—' }}
                </span>
              </div>

              <!-- Years -->
              <div class="p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
                <span class="text-slate-400 block text-[10px] mb-0.5 flex items-center gap-1">
                  <Calendar class="w-3 h-3 text-purple-500" />
                  دوره تحصیلی:
                </span>
                <span class="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                  <template v-if="qual.startYear && qual.graduationYear">
                    {{ toPersianDigits(qual.startYear) }} الی {{ toPersianDigits(qual.graduationYear) }}
                  </template>
                  <template v-else-if="qual.graduationYear">
                    فارغ‌التحصیل {{ toPersianDigits(qual.graduationYear) }}
                  </template>
                  <template v-else-if="qual.startYear">
                    ورودی {{ toPersianDigits(qual.startYear) }}
                  </template>
                  <template v-else>—</template>
                </span>
              </div>

              <!-- GPA -->
              <div class="p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
                <span class="text-slate-400 block text-[10px] mb-0.5 flex items-center gap-1">
                  <Award class="w-3 h-3 text-amber-500" />
                  معدل کل:
                </span>
                <span v-if="qual.gpa !== undefined && qual.gpa !== null" class="font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                  {{ toPersianDigits(qual.gpa) }} <span class="text-[10px] font-normal text-slate-400">از ۲۰</span>
                </span>
                <span v-else class="text-slate-400">—</span>
              </div>
            </div>

            <!-- Description if any -->
            <div v-if="qual.description" class="p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl text-xs flex items-start gap-2">
              <FileText class="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <p class="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                {{ qual.description }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- FORM MODE: Registration / Edit Form -->
      <div v-else-if="isFormOpen" class="space-y-4">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div class="flex items-center gap-2">
            <GraduationCap class="w-4 h-4 text-purple-600" />
            <h4 class="text-sm font-bold text-slate-800 dark:text-slate-200">
              {{ editingQualId ? 'ویرایش مدرک تحصیلی' : 'ثبت مدرک تحصیلی جدید برای عضو' }}
            </h4>
          </div>

          <Button
            v-if="qualifications.length > 0"
            variant="ghost"
            size="sm"
            @click="isFormOpen = false"
          >
            انصراف و مشاهده لیست
          </Button>
        </div>

        <form class="space-y-4" @submit.prevent="handleSaveQualification">
          <!-- Row 1: Degree Level & Academic Field -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              v-model="formDegreeLevel"
              label="درجه مدرک (مقطع تحصیلی)"
              placeholder="انتخاب مقطع تحصیلی..."
              :options="degreeLevelOptions"
              :error="errors.degreeLevel"
              required
            />

            <Select
              v-model="formAcademicField"
              label="رشته تحصیلی"
              placeholder="انتخاب رشته تحصیلی..."
              :options="academicFieldOptions"
              :error="errors.academicField"
              searchable
              required
            />
          </div>

          <!-- Row 2: Institution & City -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              v-model="formInstitution"
              label="عنوان دانشگاه / موسسه آموزشی"
              placeholder="مثال: دانشگاه صنعتی شریف، دانشگاه تهران..."
              :error="errors.institution"
              required
            >
              <template #prefix>
                <Building2 class="w-4 h-4" />
              </template>
            </Input>

            <Input
              v-model="formCity"
              label="شهر محل تحصیل"
              placeholder="مثال: تهران، تبریز، اصفهان..."
              :error="errors.city"
            >
              <template #prefix>
                <MapPin class="w-4 h-4" />
              </template>
            </Input>
          </div>

          <!-- Row 3: Start Year, Graduation Year & GPA -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              v-model="formStartYear"
              type="number"
              label="سال شروع تحصیل"
              placeholder="مثال: ۱۳۹۶"
              dir="ltr"
              :error="errors.startYear"
            >
              <template #prefix>
                <Calendar class="w-4 h-4" />
              </template>
            </Input>

            <Input
              v-model="formGraduationYear"
              type="number"
              label="سال فارغ‌التحصیلی"
              placeholder="مثال: ۱۴۰۰"
              dir="ltr"
              :error="errors.graduationYear"
            >
              <template #prefix>
                <Calendar class="w-4 h-4" />
              </template>
            </Input>

            <Input
              v-model="formGpa"
              type="number"
              step="0.01"
              min="0"
              max="20"
              label="معدل (از ۲۰)"
              placeholder="مثال: ۱۷.۸۵"
              dir="ltr"
              :error="errors.gpa"
            >
              <template #prefix>
                <Award class="w-4 h-4" />
              </template>
            </Input>
          </div>

          <!-- Row 4: Custom Degree Title (Optional) -->
          <Input
            v-model="formTitle"
            label="عنوان نمایشی مدرک (اختیاری)"
            placeholder="در صورت خالی بودن، به طور خودکار از ترکیب مقطع و رشته ساخته می‌شود"
            hint="مثال: کارشناسی ارشد مهندسی نرم‌افزار - گرایش سیستم‌های توزیع شده"
          />

          <!-- Row 5: Additional Notes / Description -->
          <div class="w-full text-right">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              توضیحات تکمیلی
            </label>
            <textarea
              v-model="formDescription"
              rows="2"
              placeholder="گرایش تحصیلی، عنوان پایان‌نامه، رتبه علمی یا هرگونه یادداشت مرتبط..."
              class="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
            />
          </div>

          <!-- Row 6: Set as Latest Degree Checkbox -->
          <div class="p-3 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/60 rounded-xl flex items-center justify-between text-xs">
            <label class="flex items-center gap-2.5 cursor-pointer">
              <input
                v-model="formIsLatest"
                type="checkbox"
                class="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer"
              />
              <span class="font-bold text-slate-800 dark:text-slate-200">
                این مدرک به عنوان آخرین مدرک تحصیلی عضو ملاک قرار گیرد
              </span>
            </label>
            <span class="text-[11px] text-slate-400 hidden sm:inline">
              (در ستون «درجه تحصیلی» لیست اعضا نمایش می‌یابد)
            </span>
          </div>

          <!-- Form Actions -->
          <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              v-if="qualifications.length > 0"
              type="button"
              variant="outline"
              size="md"
              @click="isFormOpen = false"
            >
              انصراف
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              :loading="isSaving"
            >
              {{ editingQualId ? 'ذخیره تغییرات مدرک' : 'افزودن مدرک به پرونده' }}
            </Button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Footer -->
    <template #footer>
      <div class="w-full flex items-center justify-between">
        <span class="text-[11px] text-slate-400">
          امکان ثبت مدارک دانشگاهی متعدد برای هر عضو فراهم است.
        </span>
        <Button
          variant="outline"
          size="sm"
          @click="emit('update:open', false)"
        >
          بستن پنجره
        </Button>
      </div>
    </template>
  </Modal>

  <!-- Confirm Delete Dialog -->
  <ConfirmDialog
    :open="Boolean(itemToDelete)"
    title="حذف مدرک تحصیلی"
    :description="`آیا از حذف مدرک «${displayDegreeTitle(itemToDelete?.degreeLevel)} ${displayFieldTitle(itemToDelete?.academicField)}» اطمینان دارید؟`"
    confirm-text="بله، حذف مدرک"
    cancel-text="انصراف"
    danger
    :loading="isSaving"
    @confirm="handleDeleteQualification"
    @cancel="itemToDelete = null"
  />
</template>
