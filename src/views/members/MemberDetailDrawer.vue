<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { membersApi, companiesApi } from '@/api';
import { useLookupsStore, useNotificationStore } from '@/stores';
import type {
  Member,
  MemberAddress,
  MemberTelephone,
  PhoneType,
  CreateAddressInput,
  CreateTelephoneInput,
  AcademicQualification,
  Company,
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
  Building2,
  ShieldCheck,
  FileText,
  Camera,
} from 'lucide-vue-next';
import { extractErrorMessage } from '@/utils/errors';
import { getStoredMemberQualifications } from '@/utils/qualifications';
import { getStoredMemberSkills } from '@/utils/skills';
import MemberQualificationsTab from './components/MemberQualificationsTab.vue';
import MemberSkillsTab from './components/MemberSkillsTab.vue';
import { MemberAvatar, MemberPhotoModal } from './components';

interface Props {
  open: boolean;
  memberId: string | null;
  initialTab?: 'info' | 'addresses' | 'telephones' | 'qualifications' | 'skills';
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
const activeTab = ref<'info' | 'addresses' | 'telephones' | 'qualifications' | 'skills'>(props.initialTab);
const memberSkillsCount = ref(0);

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

// Member Photo modal state & cache busting
const isPhotoModalOpen = ref(false);
const photoTimestamp = ref(Date.now());

function openPhotoModal() {
  isPhotoModalOpen.value = true;
}

function handlePhotoUpdated(updatedPhotoPath: string) {
  if (member.value) {
    member.value.profileImage = updatedPhotoPath;
  }
  photoTimestamp.value = Date.now();
  emit('updated');
}

const memberFullName = computed(() => {
  if (!member.value) return '';
  return `${member.value.firstName || ''} ${member.value.lastName || ''}`.trim() || member.value.memberCode;
});

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

const companyDetails = ref<Company | null>(null);

async function resolveCompanyDetails(cInfo: any) {
  if (!cInfo) {
    companyDetails.value = null;
    return;
  }
  if (typeof cInfo === 'object' && cInfo.title) {
    companyDetails.value = cInfo;
    return;
  }
  const cId = typeof cInfo === 'string' ? cInfo : cInfo?._id;
  if (cId) {
    try {
      const res = await companiesApi.getCompanyById(cId);
      if (res.success && res.data) {
        companyDetails.value = res.data;
      }
    } catch {
      companyDetails.value = null;
    }
  } else {
    companyDetails.value = null;
  }
}

async function loadMemberDetails() {
  if (!props.memberId) return;

  isLoading.value = true;
  try {
    const res = await membersApi.getMemberById(props.memberId);
    if (res.success) {
      member.value = res.data;
      addresses.value = res.data.addresses || [];
      telephones.value = res.data.telephones || [];
      if (res.data.companyInformation) {
        resolveCompanyDetails(res.data.companyInformation);
      } else {
        companyDetails.value = null;
      }
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در بارگذاری جزییات پرونده عضو'));
  } finally {
    isLoading.value = false;
  }
}

async function loadMemberSkillsCount() {
  if (!props.memberId) {
    memberSkillsCount.value = 0;
    return;
  }
  try {
    const res = await membersApi.getMemberSkills(props.memberId);
    if (res?.data && Array.isArray(res.data)) {
      memberSkillsCount.value = res.data.length;
    } else {
      memberSkillsCount.value = getStoredMemberSkills(props.memberId).length;
    }
  } catch {
    memberSkillsCount.value = getStoredMemberSkills(props.memberId).length;
  }
}

watch(
  () => props.open,
  (val) => {
    if (val && props.memberId) {
      activeTab.value = props.initialTab || 'info';
      lookupsStore.fetchAllLookups();
      loadMemberDetails();
      loadMemberSkillsCount();
    } else {
      member.value = null;
      companyDetails.value = null;
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
    width="max-w-3xl sm:max-w-4xl lg:max-w-5xl 2xl:max-w-[1150px]"
    @close="emit('update:open', false)"
  >
    <template #header>
      <div v-if="member" class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full pl-6">
        <div class="flex items-center gap-3.5">
          <!-- Avatar with photo edit trigger -->
          <div
            v-if="companyDetails && !member.firstName && !member.lastName"
            class="w-12 h-12 rounded-2xl font-black flex items-center justify-center text-base shadow-sm shrink-0 bg-gradient-to-br from-blue-600 to-indigo-700 text-white"
          >
            <Building2 class="w-6 h-6" />
          </div>
          <div
            v-else
            class="relative group cursor-pointer shrink-0"
            title="مدیریت تصویر پرسنلی"
            @click="openPhotoModal"
          >
            <MemberAvatar
              :profile-image="member.profileImage"
              :full-name="memberFullName"
              :status="member.status"
              size="md"
              shape="rounded"
              show-status
              :timestamp="photoTimestamp"
            />
            <div
              class="absolute inset-0 bg-black/45 rounded-xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
            >
              <Camera class="w-4 h-4" />
            </div>
          </div>

          <!-- Member Name, Code & Subtitles -->
          <div class="text-right">
            <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 flex flex-wrap items-center gap-2">
              <span>{{ member.firstName || '' }} {{ member.lastName || '' }}</span>
              <span v-if="!member.firstName && !member.lastName && companyDetails?.title">
                {{ companyDetails.title }}
              </span>

              <!-- Member Code Badge with copy -->
              <span
                class="text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/80 border border-brand-200/60 dark:border-brand-800/60 px-2 py-0.5 rounded-lg tabular-nums inline-flex items-center gap-1 cursor-pointer hover:bg-brand-100 dark:hover:bg-brand-900/60 transition"
                title="برای کپی کد عضویت کلیک کنید"
                @click="copyToClipboard(member.memberCode, 'کد عضویت کپی شد')"
              >
                {{ toPersianDigits(member.memberCode) }}
                <Copy class="w-3 h-3 opacity-60 hover:opacity-100" />
              </span>

              <!-- Affiliated Company chip if person has company -->
              <span
                v-if="companyDetails?.title && (member.firstName || member.lastName)"
                class="text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 px-2 py-0.5 rounded-lg inline-flex items-center gap-1"
              >
                <Building2 class="w-3 h-3 text-blue-500" />
                {{ companyDetails.title }}
              </span>
            </h3>

            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
              <span class="inline-flex items-center gap-1">
                <Calendar class="w-3.5 h-3.5 text-slate-400" />
                ثبت پرونده: {{ formatPersianDate(member.createdAt) }}
              </span>
            </p>
          </div>
        </div>

        <!-- Header Actions -->
        <div class="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            class="text-xs"
            @click="openPhotoModal"
          >
            <Camera class="w-3.5 h-3.5 ml-1 text-slate-500" />
            تصویر پرسنلی
          </Button>

          <Button
            variant="outline"
            size="sm"
            class="text-xs"
            @click="handleEdit"
          >
            <Edit class="w-3.5 h-3.5 ml-1 text-slate-500" />
            ویرایش پرونده
          </Button>
        </div>
      </div>
      <div v-else class="text-sm font-bold text-slate-400">
        در حال دریافت جزییات پرونده عضو...
      </div>
    </template>

    <div v-if="member" class="space-y-6 text-right select-none" dir="rtl">
      <!-- Status & Badges Banner Card -->
      <div class="p-3.5 sm:p-4 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div class="flex flex-wrap items-center gap-2">
          <!-- Status badge -->
          <span
            :class="[
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs',
              statusConfig[member.status]?.bgClass,
              statusConfig[member.status]?.textClass,
              statusConfig[member.status]?.borderClass,
            ]"
          >
            <span :class="['w-2 h-2 rounded-full animate-pulse', statusConfig[member.status]?.dotClass]" />
            وضعیت: {{ statusConfig[member.status]?.label || member.status }}
          </span>

          <!-- Nature of membership badge -->
          <Badge variant="purple" size="md">
            ماهیت: {{ lookupsStore.getNatureTitle(member.natureOfMembership) }}
          </Badge>

          <!-- Specialization badge -->
          <Badge variant="brand" size="md">
            رسته: {{ lookupsStore.getSpecializationTitle(member.specializationId) }}
          </Badge>

          <!-- Rank badge -->
          <Badge v-if="member.rankId" variant="amber" size="md">
            رتبه: {{ lookupsStore.getRankTitle(member.rankId) }}
          </Badge>
        </div>

        <!-- Quick metadata on the left -->
        <div class="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div v-if="member.nationalCode" class="flex items-center gap-1">
            <span class="text-slate-400">کد ملی:</span>
            <strong class="font-bold text-slate-800 dark:text-slate-200 tabular-nums">{{ toPersianDigits(member.nationalCode) }}</strong>
          </div>
          <div v-if="member.membershipDate" class="hidden sm:flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-3">
            <span class="text-slate-400">تاریخ شروع:</span>
            <strong class="font-bold text-slate-800 dark:text-slate-200 tabular-nums">{{ formatPersianDate(member.membershipDate) }}</strong>
          </div>
        </div>
      </div>

      <!-- Segmented Navigation Tabs -->
      <div class="bg-slate-100/80 dark:bg-slate-800/60 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto border border-slate-200/60 dark:border-slate-700/60">
        <button
          type="button"
          :class="[
            'flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap border outline-none focus:outline-none focus-visible:outline-none focus:ring-0 active:outline-none select-none',
            activeTab === 'info'
              ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-2xs border-slate-200/80 dark:border-slate-700/80'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50',
          ]"
          @click="activeTab = 'info'"
        >
          <User class="w-4 h-4" />
          مشخصات هویتی و صنفی
        </button>

        <button
          type="button"
          :class="[
            'flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap border outline-none focus:outline-none focus-visible:outline-none focus:ring-0 active:outline-none select-none',
            activeTab === 'addresses'
              ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-2xs border-slate-200/80 dark:border-slate-700/80'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50',
          ]"
          @click="activeTab = 'addresses'"
        >
          <MapPin class="w-4 h-4" />
          نشانی‌ها و شعب
          <span
            :class="[
              'px-1.5 py-0.2 rounded-full text-[10px] tabular-nums font-bold transition-colors',
              activeTab === 'addresses' ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300' : 'bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300'
            ]"
          >
            {{ toPersianDigits(addresses.length) }}
          </span>
        </button>

        <button
          type="button"
          :class="[
            'flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap border outline-none focus:outline-none focus-visible:outline-none focus:ring-0 active:outline-none select-none',
            activeTab === 'telephones'
              ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-2xs border-slate-200/80 dark:border-slate-700/80'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50',
          ]"
          @click="activeTab = 'telephones'"
        >
          <Phone class="w-4 h-4" />
          شماره‌های تماس
          <span
            :class="[
              'px-1.5 py-0.2 rounded-full text-[10px] tabular-nums font-bold transition-colors',
              activeTab === 'telephones' ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300' : 'bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300'
            ]"
          >
            {{ toPersianDigits(telephones.length) }}
          </span>
        </button>

        <button
          type="button"
          :class="[
            'flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap border outline-none focus:outline-none focus-visible:outline-none focus:ring-0 active:outline-none select-none',
            activeTab === 'qualifications'
              ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-2xs border-purple-200/80 dark:border-purple-800/80'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50',
          ]"
          @click="activeTab = 'qualifications'"
        >
          <GraduationCap class="w-4 h-4 text-purple-600 dark:text-purple-400" />
          مدارک و تحصیلات
          <span
            v-if="member.academicQualifications?.length"
            class="px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] tabular-nums font-bold"
          >
            {{ toPersianDigits(member.academicQualifications.length) }}
          </span>
        </button>

        <button
          type="button"
          :class="[
            'flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap border outline-none focus:outline-none focus-visible:outline-none focus:ring-0 active:outline-none select-none',
            activeTab === 'skills'
              ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-2xs border-brand-200/80 dark:border-brand-800/80'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50',
          ]"
          @click="activeTab = 'skills'"
        >
          <Award class="w-4 h-4 text-brand-600 dark:text-brand-400" />
          مهارت‌ها و تخصص‌ها
          <span
            v-if="memberSkillsCount"
            class="px-1.5 py-0.2 rounded-full bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 text-[10px] tabular-nums font-bold"
          >
            {{ toPersianDigits(memberSkillsCount) }}
          </span>
        </button>
      </div>

      <div v-if="activeTab === 'info'" class="space-y-6">
        <!-- Tab 1: Info -->
        <!-- Personal Photo & Identification Card -->
        <div class="p-4 sm:p-5 bg-gradient-to-l from-slate-50 to-brand-50/20 dark:from-slate-800/60 dark:to-brand-950/20 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <!-- Portrait Avatar (3:4 ratio) with hover overlay -->
          <div
            class="relative group shrink-0 cursor-pointer shadow-md rounded-2xl overflow-hidden"
            title="برای تغییر یا بارگذاری عکس پرسنلی کلیک کنید"
            @click="openPhotoModal"
          >
            <MemberAvatar
              :profile-image="member.profileImage"
              :full-name="memberFullName"
              :status="member.status"
              size="xl"
              shape="portrait"
              show-status
              :timestamp="photoTimestamp"
            />
            <div
              class="absolute inset-0 bg-black/55 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col items-center justify-center text-white text-xs gap-1.5 p-2 text-center"
            >
              <Camera class="w-6 h-6" />
              <span class="font-bold">{{ member.profileImage ? 'تغییر تصویر' : 'بارگذاری تصویر' }}</span>
            </div>
          </div>

          <!-- Member identification details & actions -->
          <div class="flex-1 space-y-3 text-center sm:text-right w-full">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                  {{ member.firstName || '' }} {{ member.lastName || '' }}
                  <span v-if="!member.firstName && !member.lastName && companyDetails?.title">
                    {{ companyDetails.title }}
                  </span>
                </h3>
                <p class="text-xs text-slate-400 mt-0.5">
                  کد عضویت نظام صنفی: <span class="font-mono font-bold text-brand-600 dark:text-brand-400 tabular-nums">{{ toPersianDigits(member.memberCode) }}</span>
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                class="text-xs shrink-0 self-center sm:self-auto"
                @click="openPhotoModal"
              >
                <Camera class="w-3.5 h-3.5 ml-1.5 text-brand-600 dark:text-brand-400" />
                {{ member.profileImage ? 'مدیریت و تغییر تصویر پرسنلی' : 'افزودن تصویر پرسنلی' }}
              </Button>
            </div>

            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              تصویر پرسنلی عضو با تناسب ابعاد ۳ به ۴ در کارت هوشمند عضویت، سامانه استعلام پروانه‌ها و گواهی‌نامه‌های رسمی صادرشده از سوی سازمان نظام صنفی رایانه‌ای نمایش داده می‌شود.
            </p>

            <div class="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
              <span v-if="member.profileImage" class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                ✓ عکس پرسنلی تاییدشده ثبت گردیده است
              </span>
              <span v-else class="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                ⚠ هنوز تصویری برای این عضو بارگذاری نشده است
              </span>
            </div>
          </div>
        </div>

        <!-- Personal info Section -->
        <div>
          <h4 class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <User class="w-3.5 h-3.5 text-brand-600" />
            <span>اطلاعات شناسنامه‌ای و فردی</span>
          </h4>

          <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 text-xs">
            <div class="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl relative group">
              <span class="text-slate-400 block text-[11px] mb-1">کد ملی:</span>
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-800 dark:text-slate-200 tabular-nums text-sm">
                  {{ toPersianDigits(member.nationalCode) || '—' }}
                </span>
                <button
                  v-if="member.nationalCode"
                  type="button"
                  class="text-slate-400 hover:text-brand-600 opacity-0 group-hover:opacity-100 transition p-1"
                  title="کپی کد ملی"
                  @click="copyToClipboard(member.nationalCode, 'کد ملی کپی شد')"
                >
                  <Copy class="w-3 h-3" />
                </button>
              </div>
            </div>

            <div class="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl">
              <span class="text-slate-400 block text-[11px] mb-1">نام پدر:</span>
              <span class="font-bold text-slate-800 dark:text-slate-200 text-sm">
                {{ member.fatherName || '—' }}
              </span>
            </div>

            <div class="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl">
              <span class="text-slate-400 block text-[11px] mb-1">جنسیت:</span>
              <span class="font-bold text-slate-800 dark:text-slate-200 text-sm">
                {{ member.gender ? genderConfig[member.gender] : '—' }}
              </span>
            </div>

            <div class="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl">
              <span class="text-slate-400 block text-[11px] mb-1">تاریخ تولد:</span>
              <span class="font-bold text-slate-800 dark:text-slate-200 tabular-nums text-sm">
                {{ formatPersianDate(member.birthDate) }}
              </span>
            </div>

            <div class="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl">
              <span class="text-slate-400 block text-[11px] mb-1">تاریخ شروع عضویت:</span>
              <span class="font-bold text-slate-800 dark:text-slate-200 tabular-nums text-sm">
                {{ formatPersianDate(member.membershipDate) }}
              </span>
            </div>

            <div class="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl">
              <span class="text-slate-400 block text-[11px] mb-1">تاریخ انقضای عضویت:</span>
              <span class="font-bold text-slate-800 dark:text-slate-200 tabular-nums text-sm">
                {{ formatPersianDate(member.expiryDate) }}
              </span>
            </div>

            <div class="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl">
              <span class="text-slate-400 block text-[11px] mb-1">کد پرونده عضویت:</span>
              <span class="font-bold text-brand-600 dark:text-brand-400 tabular-nums text-sm">
                {{ toPersianDigits(member.memberCode) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Company Information (if available) -->
        <div v-if="companyDetails || member.companyInformation">
          <h4 class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Building2 class="w-3.5 h-3.5 text-blue-600" />
            <span>وابستگی حقوقی و شرکت مربوطه</span>
          </h4>

          <div class="p-4 bg-gradient-to-r from-blue-50/70 to-indigo-50/40 dark:from-blue-950/30 dark:to-indigo-950/20 rounded-2xl border border-blue-200/70 dark:border-blue-900/60 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-blue-200/50 dark:border-blue-900/50">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                  <Building2 class="w-5 h-5" />
                </div>
                <div>
                  <h5 class="font-black text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    {{ companyDetails?.title || 'شرکت طرف قرارداد عضو' }}
                  </h5>
                  <p v-if="companyDetails?.companyType" class="text-xs text-blue-700 dark:text-blue-300 font-medium">
                    {{ companyDetails.companyType }}
                  </p>
                </div>
              </div>

              <Badge v-if="companyDetails?.nationalId" variant="blue" size="md">
                شناسه ملی: {{ toPersianDigits(companyDetails.nationalId) }}
              </Badge>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
              <div v-if="companyDetails?.registrationNumber" class="p-2.5 bg-white/70 dark:bg-slate-900/60 rounded-xl">
                <span class="text-slate-400 block text-[11px] mb-0.5">شماره ثبت:</span>
                <span class="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                  {{ toPersianDigits(companyDetails.registrationNumber) }}
                </span>
              </div>

              <div v-if="companyDetails?.economicCode" class="p-2.5 bg-white/70 dark:bg-slate-900/60 rounded-xl">
                <span class="text-slate-400 block text-[11px] mb-0.5">کد اقتصادی:</span>
                <span class="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                  {{ toPersianDigits(companyDetails.economicCode) }}
                </span>
              </div>

              <div v-if="companyDetails?.ceoName" class="p-2.5 bg-white/70 dark:bg-slate-900/60 rounded-xl">
                <span class="text-slate-400 block text-[11px] mb-0.5">نام مدیرعامل:</span>
                <span class="font-bold text-slate-800 dark:text-slate-200">
                  {{ companyDetails.ceoName }}
                </span>
              </div>

              <div v-if="companyDetails?.website" class="p-2.5 bg-white/70 dark:bg-slate-900/60 rounded-xl">
                <span class="text-slate-400 block text-[11px] mb-0.5">وب‌سایت:</span>
                <a :href="companyDetails.website.startsWith('http') ? companyDetails.website : `https://${companyDetails.website}`" target="_blank" class="font-bold text-blue-600 hover:underline truncate block ltr" dir="ltr">
                  {{ companyDetails.website }}
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Guild Information Grid -->
        <div>
          <h4 class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Briefcase class="w-3.5 h-3.5 text-brand-600" />
            <span>اطلاعات صنفی و حرفه‌ای</span>
          </h4>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div class="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl flex items-start gap-3">
              <div class="p-2 rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 shrink-0">
                <Briefcase class="w-4 h-4" />
              </div>
              <div>
                <span class="text-slate-400 block text-[11px]">نوع عضویت:</span>
                <span class="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {{ lookupsStore.getMembershipTypeTitle(member.membershipTypeId) }}
                </span>
              </div>
            </div>

            <div class="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl flex items-start gap-3">
              <div class="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 shrink-0">
                <Layers class="w-4 h-4" />
              </div>
              <div>
                <span class="text-slate-400 block text-[11px]">رسته تخصصی:</span>
                <span class="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {{ lookupsStore.getSpecializationTitle(member.specializationId) }}
                </span>
              </div>
            </div>

            <div class="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl flex items-start gap-3">
              <div class="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 shrink-0">
                <Award class="w-4 h-4" />
              </div>
              <div>
                <span class="text-slate-400 block text-[11px]">رتبه صنفی:</span>
                <span class="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {{ lookupsStore.getRankTitle(member.rankId) }}
                </span>
              </div>
            </div>

            <div class="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl flex items-start gap-3">
              <div class="p-2 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 shrink-0">
                <Calendar class="w-4 h-4" />
              </div>
              <div>
                <span class="text-slate-400 block text-[11px]">ماهیت عضویت:</span>
                <span class="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {{ lookupsStore.getNatureTitle(member.natureOfMembership) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Academic Qualification Overview -->
        <div>
          <h4 class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <GraduationCap class="w-3.5 h-3.5 text-rose-600" />
            <span>اطلاعات تحصیلی و مدرک دانشگاهی ملاک</span>
          </h4>

          <div v-if="memberAcademicQualification" class="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-3 shadow-2xs">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 flex items-center justify-center font-bold">
                  <GraduationCap class="w-5 h-5" />
                </div>
                <div>
                  <span class="font-black text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    {{ memberAcademicQualification.title || lookupsStore.getAcademicFieldTitle(memberAcademicQualification.academicField) }}
                  </span>
                  <p class="text-xs text-slate-500 dark:text-slate-400">
                    رشته: {{ lookupsStore.getAcademicFieldTitle(memberAcademicQualification.academicField) }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <Badge variant="purple" size="md">
                  {{ lookupsStore.getDegreeLevelTitle(memberAcademicQualification.degreeLevel) }}
                </Badge>
                <Badge
                  v-if="(memberAcademicQualification as any).verificationStatus === 'APPROVED'"
                  variant="emerald"
                  size="sm"
                >
                  تائید شده
                </Badge>
              </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
              <div class="p-2.5 bg-white dark:bg-slate-900/60 rounded-xl">
                <span class="text-slate-400 block text-[11px] mb-0.5">دانشگاه / موسسه:</span>
                <span class="font-bold text-slate-700 dark:text-slate-300">
                  {{ memberAcademicQualification.institution || '—' }}
                </span>
              </div>
              <div class="p-2.5 bg-white dark:bg-slate-900/60 rounded-xl">
                <span class="text-slate-400 block text-[11px] mb-0.5">شهر محل تحصیل:</span>
                <span class="font-bold text-slate-700 dark:text-slate-300">
                  {{ memberAcademicQualification.city || '—' }}
                </span>
              </div>
              <div class="p-2.5 bg-white dark:bg-slate-900/60 rounded-xl">
                <span class="text-slate-400 block text-[11px] mb-0.5">معدل:</span>
                <span v-if="memberAcademicQualification.gpa !== undefined && memberAcademicQualification.gpa !== null" class="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                  {{ toPersianDigits(memberAcademicQualification.gpa) }} از ۲۰
                </span>
                <span v-else class="text-slate-400 font-normal">ثبت نشده</span>
              </div>
              <div class="p-2.5 bg-white dark:bg-slate-900/60 rounded-xl">
                <span class="text-slate-400 block text-[11px] mb-0.5">دوره تحصیلی:</span>
                <span class="font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                  <template v-if="memberAcademicQualification.startYear && memberAcademicQualification.graduationYear">
                    {{ toPersianDigits(memberAcademicQualification.startYear) }} الی {{ toPersianDigits(memberAcademicQualification.graduationYear) }}
                  </template>
                  <template v-else-if="memberAcademicQualification.graduationYear">
                    فارغ‌التحصیل {{ toPersianDigits(memberAcademicQualification.graduationYear) }}
                  </template>
                  <template v-else>—</template>
                </span>
              </div>
            </div>

            <div v-if="memberAcademicQualification.description" class="pt-2 border-t border-slate-200/40 dark:border-slate-700/40 text-xs">
              <span class="text-slate-400 block text-[11px] mb-0.5">توضیحات مدرک:</span>
              <p class="text-slate-700 dark:text-slate-300 leading-relaxed">{{ memberAcademicQualification.description }}</p>
            </div>

            <div class="pt-2 border-t border-slate-200/40 dark:border-slate-700/40 flex items-center justify-between text-xs">
              <span class="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck class="w-3.5 h-3.5 text-emerald-500" />
                ملاک رتبه‌بندی پرونده: آخرین مقطع تحصیلی تائید شده
              </span>
              <button
                type="button"
                class="font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
                @click="activeTab = 'qualifications'"
              >
                <span>مشاهده و مدیریت همه مدارک عضو</span>
                <span v-if="member.academicQualifications?.length" class="tabular-nums">
                  ({{ toPersianDigits(member.academicQualifications.length) }})
                </span>
              </button>
            </div>
          </div>

          <div v-else class="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-xs flex items-center justify-between">
            <span class="text-slate-400">مدرک دانشگاهی برای این پرونده ثبت نشده است.</span>
            <button
              type="button"
              class="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              @click="activeTab = 'qualifications'"
            >
              + ثبت و بارگذاری مدرک تحصیلی
            </button>
          </div>
        </div>

        <!-- Skills & Specializations Overview Box -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Award class="w-4 h-4 text-purple-600 dark:text-purple-400" />
              مهارت‌ها، تخصص‌ها و گواهینامه‌های رسمی
            </h3>
            <button
              type="button"
              class="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              @click="activeTab = 'skills'"
            >
              مدیریت و کارشناسی ({{ toPersianDigits(memberSkillsCount) }})
            </button>
          </div>

          <div
            class="p-4 bg-gradient-to-l from-slate-50 to-purple-50/20 dark:from-slate-800/40 dark:to-purple-950/20 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs flex items-center justify-between gap-3 cursor-pointer hover:border-purple-300 transition"
            @click="activeTab = 'skills'"
          >
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold shrink-0">
                <Award class="w-4 h-4" />
              </div>
              <div>
                <p class="font-bold text-slate-800 dark:text-slate-200">
                  <span v-if="memberSkillsCount > 0">
                    {{ toPersianDigits(memberSkillsCount) }} مهارت و تخصص ثبت شده در پرونده عضو
                  </span>
                  <span v-else class="text-slate-500">
                    هنوز مهارتی برای این عضو ثبت نشده است
                  </span>
                </p>
                <p class="text-2xs text-slate-400 mt-0.5">
                  ارزیابی خوداظهاری، گواهینامه‌های رسمی دوره‌ها و تائید کارشناس صنف
                </p>
              </div>
            </div>

            <button
              type="button"
              class="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-brand-600 dark:text-brand-400 shadow-2xs hover:bg-brand-50 shrink-0 cursor-pointer"
              @click.stop="activeTab = 'skills'"
            >
              مشاهده برگه مهارت‌ها ←
            </button>
          </div>
        </div>

        <!-- Notes if any -->
        <div v-if="member.notes" class="p-4 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900 rounded-2xl text-xs space-y-1">
          <span class="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
            <FileText class="w-3.5 h-3.5" />
            یادداشت و سوابق پرونده:
          </span>
          <p class="text-amber-900 dark:text-amber-200 leading-relaxed pt-1">
            {{ member.notes }}
          </p>
        </div>
      </div>

      <div v-else-if="activeTab === 'addresses'" class="space-y-4">
        <!-- Tab 2: Addresses -->
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

        <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          <div
            v-for="addr in addresses"
            :key="addr._id"
            :class="[
              'p-4 rounded-2xl border transition-all duration-150 flex flex-col justify-between gap-3 text-xs',
              addr.isPrimary
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300',
            ]"
          >
            <div class="space-y-2 flex-1">
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
              </div>

              <p class="text-slate-800 dark:text-slate-200 text-sm font-medium leading-relaxed pt-1">
                {{ addr.address }}
              </p>

              <div class="flex items-center gap-3 text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                <span v-if="addr.plaque">
                  پلاک: <strong class="text-slate-700 dark:text-slate-300 tabular-nums">{{ toPersianDigits(addr.plaque) }}</strong>
                </span>

                <span class="mr-auto inline-flex items-center gap-1">
                  کد پستی: <strong class="text-slate-700 dark:text-slate-300 tabular-nums font-mono" dir="ltr">{{ toPersianDigits(addr.postalCode) || '—' }}</strong>
                  <button
                    v-if="addr.postalCode"
                    type="button"
                    class="text-slate-400 hover:text-brand-600 p-0.5"
                    title="کپی کد پستی"
                    @click="copyToClipboard(addr.postalCode, 'کد پستی کپی شد')"
                  >
                    <Copy class="w-3 h-3" />
                  </button>
                </span>
              </div>
            </div>

            <div class="flex items-center justify-end gap-1 shrink-0 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <button
                v-if="!addr.isPrimary"
                type="button"
                class="px-2.5 py-1 text-slate-600 hover:text-amber-600 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                title="تنظیم به عنوان نشانی اصلی"
                @click="handleSetPrimaryAddress(addr)"
              >
                <Star class="w-3.5 h-3.5" />
                اصلی کردن
              </button>

              <button
                type="button"
                class="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="ویرایش نشانی"
                @click="openEditAddressModal(addr)"
              >
                <Edit2 class="w-4 h-4" />
              </button>

              <button
                type="button"
                class="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                title="حذف نشانی"
                @click="addressToDelete = addr._id"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'telephones'" class="space-y-4">
        <!-- Tab 3: Telephones -->
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

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div
            v-for="phone in telephones"
            :key="phone._id"
            :class="[
              'p-4 rounded-2xl border transition-all duration-150 flex items-center justify-between gap-4 text-xs',
              phone.isPrimary
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300',
            ]"
          >
            <div class="flex items-center gap-3">
              <div
                :class="[
                  'p-2.5 rounded-xl shrink-0',
                  phone.isPrimary
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
                ]"
              >
                <Phone class="w-4 h-4" />
              </div>

              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-sm text-slate-900 dark:text-slate-100 tabular-nums font-mono" dir="ltr">
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
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'qualifications'" class="space-y-4">
        <!-- Tab 4: Academic Qualifications -->
        <MemberQualificationsTab
          v-if="member && member._id"
          :member-id="member._id"
          :member="member"
          @updated="loadMemberDetails(); emit('updated');"
        />
      </div>

      <div v-else-if="activeTab === 'skills'" class="space-y-4">
        <!-- Tab 5: Member Skills & Specializations -->
        <MemberSkillsTab
          v-if="member && member._id"
          :member-id="member._id"
          :member="member"
          @updated="loadMemberDetails(); loadMemberSkillsCount(); emit('updated');"
        />
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

  <!-- Member Photo Manager Modal -->
  <MemberPhotoModal
    v-if="member"
    :is-open="isPhotoModalOpen"
    :member-id="member._id"
    :member-name="memberFullName"
    :current-photo="member.profileImage"
    :current-timestamp="photoTimestamp"
    @close="isPhotoModalOpen = false"
    @updated="handlePhotoUpdated"
  />
</template>
