<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { membersApi } from '@/api';
import { useLookupsStore, useNotificationStore } from '@/stores';
import type {
  Member,
  MemberAddress,
  MemberTelephone,
  PhoneType,
  CreateAddressInput,
  CreateTelephoneInput,
  AcademicQualification,
} from '@/types';
import {
  Drawer,
  Button,
  Badge,
  Input,
  Select,
  Modal,
  ConfirmDialog,
  EmptyState,
} from '@/components/ui';
import {
  toPersianDigits,
  formatPersianDate,
  statusConfig,
  genderConfig,
  phoneTypeConfig,
} from '@/utils/formatters';
import {
  User,
  MapPin,
  Phone,
  Plus,
  Trash2,
  Calendar,
  Award,
  Briefcase,
  Layers,
  GraduationCap,
  Edit,
  Edit2,
  Star,
  Copy,
} from 'lucide-vue-next';
import { extractErrorMessage } from '@/utils/errors';
import { getStoredMemberQualifications } from '@/utils/qualifications';

interface Props {
  open: boolean;
  memberId: string | null;
  initialTab?: 'info' | 'addresses' | 'telephones';
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  memberId: null,
  initialTab: 'info',
});

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'edit', member: Member): void;
  (e: 'updated'): void;
}>();

const lookupsStore = useLookupsStore();
const notificationStore = useNotificationStore();

const member = ref<Member | null>(null);
const isLoading = ref(false);
const activeTab = ref<'info' | 'addresses' | 'telephones'>(props.initialTab);

// Address management state
const addresses = ref<MemberAddress[]>([]);
const isAddAddressOpen = ref(false);
const editingAddressId = ref<string | null>(null);
const addressTypeInput = ref('');
const provinceInput = ref('');
const cityInput = ref('');
const postalCodeInput = ref('');
const addressTextInput = ref('');
const plaqueInput = ref('');
const isPrimaryAddress = ref(false);
const isSavingAddress = ref(false);
const addressToDelete = ref<string | null>(null);

// Telephone management state
const telephones = ref<MemberTelephone[]>([]);
const isAddPhoneOpen = ref(false);
const editingPhoneId = ref<string | null>(null);
const phoneTypeInput = ref<PhoneType>('MOBILE');
const phoneNumberInput = ref('');
const areaCodeInput = ref('');
const countryCodeInput = ref('+98');
const extensionInput = ref('');
const phoneTitleInput = ref('');
const isPrimaryPhone = ref(false);
const isSavingPhone = ref(false);
const phoneToDelete = ref<string | null>(null);

const memberAcademicQualification = computed(() => {
  if (!member.value) return null;
  const raw = member.value.latestAcademicQualifications;
  if (raw) {
    if (typeof raw === 'object' && raw._id) return raw as AcademicQualification;
    const foundInStore = lookupsStore.academicQualifications.find((q) => q._id === raw);
    if (foundInStore) return foundInStore;
  }
  if (member.value._id) {
    const localQuals = getStoredMemberQualifications(member.value._id);
    if (localQuals.length > 0) {
      return (
        localQuals.find((q) => q.isLatest) ||
        [...localQuals].sort((a, b) => (Number(b.graduationYear) || 0) - (Number(a.graduationYear) || 0))[0] ||
        localQuals[0]
      );
    }
  }
  return null;
});

// Cities filtered by selected province
const availableCities = computed(() => {
  if (!provinceInput.value) return lookupsStore.cities;
  return lookupsStore.getCitiesByProvinceId(provinceInput.value);
});

watch(provinceInput, (newProvId) => {
  if (!newProvId) {
    cityInput.value = '';
    return;
  }
  const citiesInProv = lookupsStore.getCitiesByProvinceId(newProvId);
  if (cityInput.value) {
    const exists = citiesInProv.some((c) => c._id === cityInput.value);
    if (!exists) {
      cityInput.value = citiesInProv[0]?._id || '';
    }
  } else if (citiesInProv.length > 0) {
    cityInput.value = citiesInProv[0]._id;
  }
});

async function loadMemberDetails() {
  if (!props.memberId) return;

  isLoading.value = true;
  try {
    const res = await membersApi.getMemberById(props.memberId);
    if (res.success) {
      member.value = res.data;
      addresses.value = res.data.addresses || [];
      telephones.value = res.data.telephones || [];
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در بارگذاری جزییات پرونده عضو'));
  } finally {
    isLoading.value = false;
  }
}

watch(
  () => props.open,
  (val) => {
    if (val && props.memberId) {
      activeTab.value = props.initialTab || 'info';
      lookupsStore.fetchAllLookups();
      loadMemberDetails();
    } else {
      member.value = null;
    }
  }
);

watch(
  () => props.initialTab,
  (val) => {
    if (val) {
      activeTab.value = val;
    }
  }
);

// --------------------------------------------------------------------------
// Addresses CRUD
// --------------------------------------------------------------------------
function openAddAddressModal() {
  editingAddressId.value = null;
  addressTypeInput.value = lookupsStore.addressTypes[0]?._id || '';
  provinceInput.value = lookupsStore.provinces[0]?._id || '';
  const firstCities = lookupsStore.getCitiesByProvinceId(provinceInput.value);
  cityInput.value = firstCities[0]?._id || '';
  addressTextInput.value = '';
  postalCodeInput.value = '';
  plaqueInput.value = '';
  isPrimaryAddress.value = addresses.value.length === 0;
  isAddAddressOpen.value = true;
}

function openEditAddressModal(addr: MemberAddress) {
  editingAddressId.value = addr._id;
  addressTypeInput.value = typeof addr.addressType === 'object' ? addr.addressType._id : addr.addressType;
  provinceInput.value = typeof addr.province === 'object' ? addr.province._id : addr.province;
  cityInput.value = typeof addr.city === 'object' ? addr.city._id : addr.city;
  addressTextInput.value = addr.address || '';
  postalCodeInput.value = addr.postalCode || '';
  plaqueInput.value = addr.plaque || '';
  isPrimaryAddress.value = Boolean(addr.isPrimary);
  isAddAddressOpen.value = true;
}

async function handleSaveAddress() {
  if (!props.memberId || !addressTextInput.value.trim()) {
    notificationStore.warning('لطفاً نشانی کامل را وارد فرمایید.');
    return;
  }

  if (!provinceInput.value) {
    notificationStore.warning('لطفاً استان را انتخاب فرمایید.');
    return;
  }
  if (!cityInput.value) {
    notificationStore.warning('لطفاً شهر را انتخاب فرمایید.');
    return;
  }

  const cleanedPostal = postalCodeInput.value.replace(/[\s-]/g, '');
  if (cleanedPostal && !/^\d{10}$/.test(cleanedPostal)) {
    notificationStore.warning('کد پستی باید یک عدد ۱۰ رقمی باشد.');
    return;
  }

  const payload: CreateAddressInput = {
    addressType: addressTypeInput.value || lookupsStore.addressTypes[0]?._id,
    province: provinceInput.value,
    city: cityInput.value,
    address: addressTextInput.value.trim(),
    postalCode: cleanedPostal || undefined,
    plaque: plaqueInput.value.trim() || undefined,
    isPrimary: isPrimaryAddress.value,
  };

  isSavingAddress.value = true;
  try {
    if (editingAddressId.value) {
      const res = await membersApi.updateMemberAddress(props.memberId, editingAddressId.value, payload);
      if (res.success) {
        notificationStore.success('نشانی با موفقیت به‌روزرسانی شد.');
        isAddAddressOpen.value = false;
        editingAddressId.value = null;
        const addrRes = await membersApi.getMemberAddresses(props.memberId);
        if (addrRes.success) addresses.value = addrRes.data;
        emit('updated');
      }
    } else {
      const res = await membersApi.addMemberAddress(props.memberId, payload);
      if (res.success) {
        notificationStore.success('نشانی با موفقیت افزوده شد.');
        isAddAddressOpen.value = false;
        const addrRes = await membersApi.getMemberAddresses(props.memberId);
        if (addrRes.success) addresses.value = addrRes.data;
        emit('updated');
      }
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در ذخیره‌سازی نشانی'));
  } finally {
    isSavingAddress.value = false;
  }
}

async function handleSetPrimaryAddress(addr: MemberAddress) {
  if (!props.memberId || addr.isPrimary) return;
  try {
    const res = await membersApi.updateMemberAddress(props.memberId, addr._id, { isPrimary: true });
    if (res.success) {
      notificationStore.success('نشانی به عنوان آدرس اصلی تنظیم شد.');
      const addrRes = await membersApi.getMemberAddresses(props.memberId);
      if (addrRes.success) addresses.value = addrRes.data;
      emit('updated');
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در تغییر نشانی اصلی'));
  }
}

async function handleDeleteAddress() {
  if (!props.memberId || !addressToDelete.value) return;

  try {
    const res = await membersApi.deleteMemberAddress(props.memberId, addressToDelete.value);
    if (res.success) {
      notificationStore.success('نشانی حذف گردید.');
      addresses.value = addresses.value.filter((a) => a._id !== addressToDelete.value);
      emit('updated');
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در حذف نشانی'));
  } finally {
    addressToDelete.value = null;
  }
}

// --------------------------------------------------------------------------
// Telephones CRUD
// --------------------------------------------------------------------------
function openAddPhoneModal() {
  editingPhoneId.value = null;
  phoneTypeInput.value = 'MOBILE';
  phoneNumberInput.value = '';
  areaCodeInput.value = '';
  countryCodeInput.value = '+98';
  extensionInput.value = '';
  phoneTitleInput.value = '';
  isPrimaryPhone.value = telephones.value.length === 0;
  isAddPhoneOpen.value = true;
}

function openEditPhoneModal(phone: MemberTelephone) {
  editingPhoneId.value = phone._id;
  phoneTypeInput.value = phone.phoneType || 'MOBILE';
  phoneNumberInput.value = phone.phoneNumber || '';
  areaCodeInput.value = phone.areaCode || '';
  countryCodeInput.value = phone.countryCode || '+98';
  extensionInput.value = phone.extension || '';
  phoneTitleInput.value = phone.title || '';
  isPrimaryPhone.value = Boolean(phone.isPrimary);
  isAddPhoneOpen.value = true;
}

async function handleSaveTelephone() {
  if (!props.memberId || !phoneNumberInput.value.trim()) {
    notificationStore.warning('لطفاً شماره تماس را وارد فرمایید.');
    return;
  }

  const payload: CreateTelephoneInput = {
    phoneType: phoneTypeInput.value,
    phoneNumber: phoneNumberInput.value.trim(),
    areaCode: areaCodeInput.value.trim() || undefined,
    countryCode: countryCodeInput.value.trim() || '+98',
    extension: extensionInput.value.trim() || undefined,
    title: phoneTitleInput.value.trim() || undefined,
    isPrimary: isPrimaryPhone.value,
  };

  isSavingPhone.value = true;
  try {
    if (editingPhoneId.value) {
      const res = await membersApi.updateMemberTelephone(props.memberId, editingPhoneId.value, payload);
      if (res.success) {
        notificationStore.success('شماره تماس با موفقیت ویرایش شد.');
        isAddPhoneOpen.value = false;
        editingPhoneId.value = null;
        const phoneRes = await membersApi.getMemberTelephones(props.memberId);
        if (phoneRes.success) telephones.value = phoneRes.data;
        emit('updated');
      }
    } else {
      const res = await membersApi.addMemberTelephone(props.memberId, payload);
      if (res.success) {
        notificationStore.success('شماره تماس با موفقیت ثبت شد.');
        isAddPhoneOpen.value = false;
        const phoneRes = await membersApi.getMemberTelephones(props.memberId);
        if (phoneRes.success) telephones.value = phoneRes.data;
        emit('updated');
      }
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در ذخیره‌سازی شماره تماس'));
  } finally {
    isSavingPhone.value = false;
  }
}

async function handleSetPrimaryPhone(phone: MemberTelephone) {
  if (!props.memberId || phone.isPrimary) return;
  try {
    const res = await membersApi.updateMemberTelephone(props.memberId, phone._id, { isPrimary: true });
    if (res.success) {
      notificationStore.success('شماره به عنوان خط اصلی ثبت شد.');
      const phoneRes = await membersApi.getMemberTelephones(props.memberId);
      if (phoneRes.success) telephones.value = phoneRes.data;
      emit('updated');
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در تغییر شماره اصلی'));
  }
}

async function handleDeleteTelephone() {
  if (!props.memberId || !phoneToDelete.value) return;

  try {
    const res = await membersApi.deleteMemberTelephone(props.memberId, phoneToDelete.value);
    if (res.success) {
      notificationStore.success('شماره تماس حذف گردید.');
      telephones.value = telephones.value.filter((t) => t._id !== phoneToDelete.value);
      emit('updated');
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در حذف شماره تماس'));
  } finally {
    phoneToDelete.value = null;
  }
}

function handleEdit() {
  if (!member.value) return;
  const currentMember = member.value;
  emit('update:open', false);
  emit('edit', currentMember);
}

function copyToClipboard(text: string, msg = 'کپی شد') {
  if (!text) return;
  navigator.clipboard.writeText(text);
  notificationStore.success(msg);
}
</script>

<template>
  <Drawer
    :open="open"
    width="max-w-2xl"
    @close="emit('update:open', false)"
  >
    <template #header>
      <div v-if="member" class="flex items-center justify-between w-full pl-6">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl bg-brand-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
            {{ member.firstName ? member.firstName[0] : 'ع' }}
          </div>
          <div class="text-right">
            <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {{ member.firstName || '' }} {{ member.lastName || '' }}
              <span class="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-md tabular-nums">
                {{ toPersianDigits(member.memberCode) }}
              </span>
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              پرونده عضویت صنف &bull; ثبت: {{ formatPersianDate(member.createdAt) }}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          @click="handleEdit"
        >
          <Edit class="w-3.5 h-3.5 ml-1" />
          ویرایش پرونده
        </Button>
      </div>
      <div v-else class="text-sm font-bold">
        در حال دریافت جزییات...
      </div>
    </template>

    <div v-if="member" class="space-y-6 text-right select-none" dir="rtl">
      <!-- Status & Badges Banner -->
      <div class="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
        <!-- Status badge -->
        <span
          :class="[
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
            statusConfig[member.status]?.bgClass,
            statusConfig[member.status]?.textClass,
            statusConfig[member.status]?.borderClass,
          ]"
        >
          <span :class="['w-2 h-2 rounded-full', statusConfig[member.status]?.dotClass]" />
          وضعیت: {{ statusConfig[member.status]?.label || member.status }}
        </span>

        <!-- Nature of membership badge -->
        <Badge variant="purple">
          ماهیت: {{ lookupsStore.getNatureTitle(member.natureOfMembership) }}
        </Badge>

        <!-- Specialization badge -->
        <Badge variant="brand">
          رسته: {{ lookupsStore.getSpecializationTitle(member.specializationId) }}
        </Badge>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          :class="[
            'flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer',
            activeTab === 'info'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
          ]"
          @click="activeTab = 'info'"
        >
          <User class="w-4 h-4" />
          مشخصات هویتی و صنفی
        </button>

        <button
          type="button"
          :class="[
            'flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer',
            activeTab === 'addresses'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
          ]"
          @click="activeTab = 'addresses'"
        >
          <MapPin class="w-4 h-4" />
          نشانی‌ها و شعب
          <span class="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] tabular-nums">
            {{ toPersianDigits(addresses.length) }}
          </span>
        </button>

        <button
          type="button"
          :class="[
            'flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer',
            activeTab === 'telephones'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
          ]"
          @click="activeTab = 'telephones'"
        >
          <Phone class="w-4 h-4" />
          شماره‌های تماس
          <span class="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] tabular-nums">
            {{ toPersianDigits(telephones.length) }}
          </span>
        </button>
      </div>

      <!-- Tab 1: Info -->
      <div v-if="activeTab === 'info'" class="space-y-6">
        <!-- Personal info grid -->
        <div>
          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            اطلاعات شناسنامه‌ای
          </h4>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              <span class="text-slate-400 block mb-1">کد ملی:</span>
              <span class="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                {{ toPersianDigits(member.nationalCode) || '—' }}
              </span>
            </div>

            <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              <span class="text-slate-400 block mb-1">نام پدر:</span>
              <span class="font-bold text-slate-800 dark:text-slate-200">
                {{ member.fatherName || '—' }}
              </span>
            </div>

            <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              <span class="text-slate-400 block mb-1">جنسیت:</span>
              <span class="font-bold text-slate-800 dark:text-slate-200">
                {{ member.gender ? genderConfig[member.gender] : '—' }}
              </span>
            </div>

            <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              <span class="text-slate-400 block mb-1">تاریخ تولد:</span>
              <span class="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                {{ formatPersianDate(member.birthDate) }}
              </span>
            </div>

            <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              <span class="text-slate-400 block mb-1">تاریخ عضویت:</span>
              <span class="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                {{ formatPersianDate(member.membershipDate) }}
              </span>
            </div>

            <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              <span class="text-slate-400 block mb-1">تاریخ انقضا:</span>
              <span class="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                {{ formatPersianDate(member.expiryDate) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Guild Information Grid -->
        <div>
          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            اطلاعات صنفی و حرفه‌ای
          </h4>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div class="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-start gap-3">
              <Briefcase class="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
              <div>
                <span class="text-slate-400 block text-[11px]">نوع عضویت:</span>
                <span class="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {{ lookupsStore.getMembershipTypeTitle(member.membershipTypeId) }}
                </span>
              </div>
            </div>

            <div class="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-start gap-3">
              <Layers class="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <span class="text-slate-400 block text-[11px]">رسته تخصصی:</span>
                <span class="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {{ lookupsStore.getSpecializationTitle(member.specializationId) }}
                </span>
              </div>
            </div>

            <div class="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-start gap-3">
              <Award class="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <span class="text-slate-400 block text-[11px]">رتبه صنفی:</span>
                <span class="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {{ lookupsStore.getRankTitle(member.rankId) }}
                </span>
              </div>
            </div>

            <div class="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-start gap-3">
              <Calendar class="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
              <div>
                <span class="text-slate-400 block text-[11px]">ماهیت عضویت:</span>
                <span class="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {{ lookupsStore.getNatureTitle(member.natureOfMembership) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Academic Qualification -->
        <div>
          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            اطلاعات تحصیلی و مدرک دانشگاهی
          </h4>

          <div v-if="memberAcademicQualification" class="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <GraduationCap class="w-4 h-4 text-rose-600" />
                <span class="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {{ lookupsStore.getAcademicFieldTitle(memberAcademicQualification.academicField) }}
                </span>
              </div>
              <Badge variant="brand">
                {{ lookupsStore.getDegreeLevelTitle(memberAcademicQualification.degreeLevel) }}
              </Badge>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-200/40 dark:border-slate-700/40">
              <div>
                <span class="text-slate-400 block text-[11px]">دانشگاه:</span>
                <span class="font-bold text-slate-700 dark:text-slate-300">
                  {{ memberAcademicQualification.institution || '—' }}
                </span>
              </div>
              <div>
                <span class="text-slate-400 block text-[11px]">شهر محل تحصیل:</span>
                <span class="font-bold text-slate-700 dark:text-slate-300">
                  {{ memberAcademicQualification.city || '—' }}
                </span>
              </div>
              <div>
                <span class="text-slate-400 block text-[11px]">معدل:</span>
                <span v-if="memberAcademicQualification.gpa !== undefined && memberAcademicQualification.gpa !== null" class="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                  {{ toPersianDigits(memberAcademicQualification.gpa) }}
                </span>
                <span v-else class="text-slate-400">—</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[11px]">سال شروع تحصیل:</span>
                <span class="font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                  {{ memberAcademicQualification.startYear ? toPersianDigits(memberAcademicQualification.startYear) : '—' }}
                </span>
              </div>
              <div>
                <span class="text-slate-400 block text-[11px]">سال فارغ‌التحصیلی:</span>
                <span class="font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                  {{ memberAcademicQualification.graduationYear ? toPersianDigits(memberAcademicQualification.graduationYear) : '—' }}
                </span>
              </div>
            </div>

            <div v-if="memberAcademicQualification.description" class="pt-2 border-t border-slate-200/40 dark:border-slate-700/40 text-xs">
              <span class="text-slate-400 block text-[11px] mb-0.5">توضیحات:</span>
              <p class="text-slate-700 dark:text-slate-300">{{ memberAcademicQualification.description }}</p>
            </div>
          </div>

          <div v-else class="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-xs text-slate-400">
            مدرک دانشگاهی برای این عضو ثبت نشده است.
          </div>
        </div>

        <!-- Notes if any -->
        <div v-if="member.notes" class="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl text-xs">
          <span class="font-bold text-amber-800 dark:text-amber-300 block mb-1">یادداشت پرونده:</span>
          <p class="text-amber-900 dark:text-amber-200 leading-relaxed">
            {{ member.notes }}
          </p>
        </div>
      </div>

      <!-- Tab 2: Addresses -->
      <div v-else-if="activeTab === 'addresses'" class="space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-500">فهرست نشانی‌های ثبت‌شده</span>
          <Button variant="primary" size="sm" @click="openAddAddressModal">
            <Plus class="w-4 h-4 ml-1" />
            افزودن نشانی جدید
          </Button>
        </div>

        <div v-if="addresses.length === 0">
          <EmptyState
            title="هیچ نشانی ثبت نشده است"
            description="می‌توانید آدرس محل کار یا اقامت این عضو را با دکمه بالا ثبت کنید."
            :icon="MapPin"
          />
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="addr in addresses"
            :key="addr._id"
            :class="[
              'p-4 rounded-2xl border transition-all duration-150 flex items-start justify-between gap-4 text-xs',
              addr.isPrimary
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/80 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800',
            ]"
          >
            <div class="space-y-1.5 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span v-if="addr.isPrimary" class="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] inline-flex items-center gap-1">
                  <Star class="w-3 h-3 fill-current" />
                  نشانی اصلی
                </span>

                <Badge variant="blue">
                  {{ lookupsStore.getAddressTypeTitle(addr.addressType) }}
                </Badge>

                <Badge variant="purple">
                  {{ lookupsStore.getProvinceTitle(addr.province) }} &bull; {{ lookupsStore.getCityTitle(addr.city) }}
                </Badge>

                <span v-if="addr.plaque" class="text-slate-500 dark:text-slate-400">
                  پلاک: <strong class="text-slate-700 dark:text-slate-300 tabular-nums">{{ toPersianDigits(addr.plaque) }}</strong>
                </span>

                <span class="text-slate-400 mr-2">
                  کد پستی: <strong class="text-slate-700 dark:text-slate-300 tabular-nums" dir="ltr">{{ toPersianDigits(addr.postalCode) || '—' }}</strong>
                </span>
              </div>

              <p class="text-slate-800 dark:text-slate-200 text-sm font-medium leading-relaxed pt-1">
                {{ addr.address }}
              </p>
            </div>

            <div class="flex items-center gap-1 shrink-0">
              <button
                v-if="!addr.isPrimary"
                type="button"
                class="p-2 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="تنظیم به عنوان نشانی اصلی"
                @click="handleSetPrimaryAddress(addr)"
              >
                <Star class="w-4 h-4" />
              </button>

              <button
                type="button"
                class="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="ویرایش نشانی"
                @click="openEditAddressModal(addr)"
              >
                <Edit2 class="w-4 h-4" />
              </button>

              <button
                type="button"
                class="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                title="حذف نشانی"
                @click="addressToDelete = addr._id"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 3: Telephones -->
      <div v-else-if="activeTab === 'telephones'" class="space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-500">شماره‌های تماس و ارتباطی</span>
          <Button variant="primary" size="sm" @click="openAddPhoneModal">
            <Plus class="w-4 h-4 ml-1" />
            افزودن شماره تماس
          </Button>
        </div>

        <div v-if="telephones.length === 0">
          <EmptyState
            title="هیچ شماره تماسی ثبت نشده است"
            description="می‌توانید شماره همراه، تلفن ثابت یا خط مستقیم عضو را ثبت نمایید."
            :icon="Phone"
          />
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="phone in telephones"
            :key="phone._id"
            :class="[
              'p-4 rounded-2xl border transition-all duration-150 flex items-center justify-between gap-4 text-xs',
              phone.isPrimary
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/80 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800',
            ]"
          >
            <div class="flex items-center gap-3">
              <div
                :class="[
                  'p-2.5 rounded-xl',
                  phone.isPrimary
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
                ]"
              >
                <Phone class="w-4 h-4" />
              </div>

              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-sm text-slate-900 dark:text-slate-100 tabular-nums" dir="ltr">
                    <span v-if="phone.areaCode && phone.phoneType !== 'MOBILE'">({{ phone.areaCode }}) </span>
                    {{ toPersianDigits(phone.phoneNumber) }}
                  </span>
                  <span v-if="phone.isPrimary" class="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                    اصلی
                  </span>
                </div>
                <p class="text-[11px] text-slate-400 mt-0.5">
                  {{ phoneTypeConfig[phone.phoneType] || phone.phoneType }}
                  <span v-if="phone.title">&bull; {{ phone.title }}</span>
                  <span v-if="phone.extension">&bull; داخلی: {{ toPersianDigits(phone.extension) }}</span>
                </p>
              </div>
            </div>

            <div class="flex items-center gap-1 shrink-0">
              <button
                type="button"
                class="p-2 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="کپی شماره"
                @click="copyToClipboard(phone.phoneNumber, 'شماره کپی شد')"
              >
                <Copy class="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                class="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="ویرایش شماره"
                @click="openEditPhoneModal(phone)"
              >
                <Edit2 class="w-3.5 h-3.5" />
              </button>

              <button
                v-if="!phone.isPrimary"
                type="button"
                class="p-2 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="تنظیم به عنوان شماره اصلی"
                @click="handleSetPrimaryPhone(phone)"
              >
                <Star class="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                class="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                title="حذف شماره"
                @click="phoneToDelete = phone._id"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button variant="outline" size="md" @click="emit('update:open', false)">
        بستن پرونده
      </Button>
    </template>
  </Drawer>

  <!-- Add / Edit Address Sub-Modal -->
  <Modal
    :open="isAddAddressOpen"
    :title="editingAddressId ? 'ویرایش نشانی عضو' : 'افزودن نشانی جدید برای عضو'"
    subtitle="ثبت مشخصات پستی، استان، شهر و موقعیت مکانی"
    size="md"
    @close="isAddAddressOpen = false"
  >
    <div class="space-y-4 text-right">
      <Select
        v-model="addressTypeInput"
        label="نوع نشانی"
        :options="lookupsStore.addressTypes.map((t) => ({ label: t.title, value: t._id }))"
        required
      />

      <div class="grid grid-cols-2 gap-3">
        <Select
          v-model="provinceInput"
          label="استان"
          :options="lookupsStore.provinces.map((p) => ({ label: p.title || p.name || '', value: p._id }))"
          required
        />

        <Select
          v-model="cityInput"
          label="شهر / شهرستان"
          :options="availableCities.map((c) => ({ label: c.title || c.name || '', value: c._id }))"
          required
        />
      </div>

      <Input
        v-model="addressTextInput"
        label="آدرس پستی کامل"
        placeholder="خیابان، پلاک، طبقه، واحد..."
        required
      />

      <div class="grid grid-cols-2 gap-3">
        <Input
          v-model="postalCodeInput"
          label="کد پستی (۱۰ رقم)"
          placeholder="1417755331"
          dir="ltr"
          maxlength="10"
        />

        <Input
          v-model="plaqueInput"
          label="پلاک"
          placeholder="مثال: ۱۲"
          dir="ltr"
        />
      </div>

      <label class="flex items-center gap-2 text-xs cursor-pointer select-none pt-2">
        <input
          v-model="isPrimaryAddress"
          type="checkbox"
          class="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
        />
        ثبت به عنوان نشانی اصلی پرونده
      </label>
    </div>

    <template #footer>
      <Button variant="outline" size="md" @click="isAddAddressOpen = false">انصراف</Button>
      <Button variant="primary" size="md" :loading="isSavingAddress" @click="handleSaveAddress">
        {{ editingAddressId ? 'ذخیره تغییرات' : 'ثبت نشانی' }}
      </Button>
    </template>
  </Modal>

  <!-- Delete Address Confirmation -->
  <ConfirmDialog
    :open="Boolean(addressToDelete)"
    title="حذف نشانی"
    description="آیا از حذف این نشانی اطمینان دارید؟"
    confirm-text="حذف نشانی"
    variant="danger"
    @confirm="handleDeleteAddress"
    @cancel="addressToDelete = null"
  />

  <!-- Add / Edit Telephone Sub-Modal -->
  <Modal
    :open="isAddPhoneOpen"
    :title="editingPhoneId ? 'ویرایش شماره تماس' : 'افزودن شماره تماس جدید'"
    subtitle="ثبت شماره همراه، ثابت، نمابر یا خط پشتیبانی"
    size="md"
    @close="isAddPhoneOpen = false"
  >
    <div class="space-y-4 text-right">
      <Select
        v-model="phoneTypeInput"
        label="نوع خط"
        :options="[
          { label: 'تلفن همراه', value: 'MOBILE' },
          { label: 'تلفن ثابت', value: 'LANDLINE' },
          { label: 'نمابر (فکس)', value: 'FAX' },
          { label: 'خط پشتیبانی', value: 'SUPPORT' },
          { label: 'سایر', value: 'OTHER' },
        ]"
        required
      />

      <div class="grid grid-cols-3 gap-3">
        <div class="col-span-2">
          <Input
            v-model="phoneNumberInput"
            label="شماره تماس"
            placeholder="09121234567"
            dir="ltr"
            required
          />
        </div>
        <Input
          v-model="areaCodeInput"
          label="پیش‌شماره (شهر)"
          placeholder="021"
          dir="ltr"
        />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <Input
          v-model="extensionInput"
          label="شماره داخلی"
          placeholder="102"
          dir="ltr"
        />
        <Input
          v-model="phoneTitleInput"
          label="عنوان / توضیحات خط"
          placeholder="مثال: خط مستقیم دفتر"
        />
      </div>

      <label class="flex items-center gap-2 text-xs cursor-pointer select-none pt-2">
        <input
          v-model="isPrimaryPhone"
          type="checkbox"
          class="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
        />
        ثبت به عنوان شماره تماس اصلی
      </label>
    </div>

    <template #footer>
      <Button variant="outline" size="md" @click="isAddPhoneOpen = false">انصراف</Button>
      <Button variant="primary" size="md" :loading="isSavingPhone" @click="handleSaveTelephone">
        {{ editingPhoneId ? 'ذخیره تغییرات' : 'ثبت شماره' }}
      </Button>
    </template>
  </Modal>

  <!-- Delete Telephone Confirmation -->
  <ConfirmDialog
    :open="Boolean(phoneToDelete)"
    title="حذف شماره تماس"
    description="آیا از حذف این شماره تماس اطمینان دارید؟"
    confirm-text="حذف شماره"
    variant="danger"
    @confirm="handleDeleteTelephone"
    @cancel="phoneToDelete = null"
  />
</template>
