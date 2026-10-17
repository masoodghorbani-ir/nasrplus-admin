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
} from '@/types';
import {
  Modal,
  Button,
  Badge,
  Input,
  Select,
  ConfirmDialog,
  EmptyState,
} from '@/components/ui';
import {
  toPersianDigits,
  phoneTypeConfig,
} from '@/utils/formatters';
import { extractErrorMessage } from '@/utils/errors';
import {
  MapPin,
  Phone,
  Plus,
  Trash2,
  Edit2,
  Star,
  Copy,
} from 'lucide-vue-next';

interface Props {
  open: boolean;
  member: Member | null;
  initialTab?: 'addresses' | 'telephones';
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  member: null,
  initialTab: 'addresses',
});

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'updated'): void;
}>();

const lookupsStore = useLookupsStore();
const notificationStore = useNotificationStore();

const activeTab = ref<'addresses' | 'telephones'>('addresses');
const isLoadingData = ref(false);

// Address state
const addresses = ref<MemberAddress[]>([]);
const isAddressFormOpen = ref(false);
const editingAddressId = ref<string | null>(null);
const addressTypeInput = ref('');
const provinceInput = ref('');
const cityInput = ref('');
const addressTextInput = ref('');
const postalCodeInput = ref('');
const plaqueInput = ref('');
const isPrimaryAddress = ref(false);
const isSavingAddress = ref(false);
const addressToDelete = ref<string | null>(null);

// Telephone state
const telephones = ref<MemberTelephone[]>([]);
const isPhoneFormOpen = ref(false);
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

// Computed available cities based on selected province
const availableCities = computed(() => {
  if (!provinceInput.value) {
    return lookupsStore.cities;
  }
  return lookupsStore.getCitiesByProvinceId(provinceInput.value);
});

// Watch province changes to auto-reset or select valid city
watch(provinceInput, (newProvId) => {
  if (!newProvId) {
    cityInput.value = '';
    return;
  }
  const citiesInProv = lookupsStore.getCitiesByProvinceId(newProvId);
  // If current selected city is not in this province, reset city
  if (cityInput.value) {
    const exists = citiesInProv.some((c) => c._id === cityInput.value);
    if (!exists) {
      cityInput.value = citiesInProv[0]?._id || '';
    }
  } else if (citiesInProv.length > 0) {
    cityInput.value = citiesInProv[0]._id;
  }
});

// Fetch all contacts when opened
watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen && props.member) {
      activeTab.value = props.initialTab || 'addresses';
      await lookupsStore.fetchAllLookups();
      await fetchContacts();
    } else {
      closeAddressForm();
      closePhoneForm();
    }
  }
);

watch(
  () => props.initialTab,
  (newTab) => {
    if (newTab) {
      activeTab.value = newTab;
    }
  }
);

async function fetchContacts() {
  if (!props.member?._id) return;
  isLoadingData.value = true;
  try {
    const [addrRes, phoneRes] = await Promise.all([
      membersApi.getMemberAddresses(props.member._id),
      membersApi.getMemberTelephones(props.member._id),
    ]);
    if (addrRes.success) addresses.value = addrRes.data || [];
    if (phoneRes.success) telephones.value = phoneRes.data || [];
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در دریافت اطلاعات آدرس‌ها و تماس‌ها'));
  } finally {
    isLoadingData.value = false;
  }
}

// --------------------------------------------------------------------------
// ADDRESS ACTIONS
// --------------------------------------------------------------------------
function openAddAddressForm() {
  editingAddressId.value = null;
  addressTypeInput.value = lookupsStore.addressTypes[0]?._id || '';
  provinceInput.value = lookupsStore.provinces[0]?._id || '';
  const firstCities = lookupsStore.getCitiesByProvinceId(provinceInput.value);
  cityInput.value = firstCities[0]?._id || '';
  addressTextInput.value = '';
  postalCodeInput.value = '';
  plaqueInput.value = '';
  isPrimaryAddress.value = addresses.value.length === 0;
  isAddressFormOpen.value = true;
}

function openEditAddressForm(addr: MemberAddress) {
  editingAddressId.value = addr._id;
  addressTypeInput.value = typeof addr.addressType === 'object' ? addr.addressType._id : addr.addressType;
  provinceInput.value = typeof addr.province === 'object' ? addr.province._id : addr.province;
  cityInput.value = typeof addr.city === 'object' ? addr.city._id : addr.city;
  addressTextInput.value = addr.address || '';
  postalCodeInput.value = addr.postalCode || '';
  plaqueInput.value = addr.plaque || '';
  isPrimaryAddress.value = Boolean(addr.isPrimary);
  isAddressFormOpen.value = true;
}

function closeAddressForm() {
  isAddressFormOpen.value = false;
  editingAddressId.value = null;
}

async function handleSaveAddress() {
  if (!props.member?._id) return;

  if (!addressTextInput.value.trim()) {
    notificationStore.warning('لطفاً نشانی دقیق پستی را وارد فرمایید.');
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
  if (!addressTypeInput.value) {
    notificationStore.warning('لطفاً نوع نشانی را مشخص فرمایید.');
    return;
  }

  // Validate postal code if filled (10 digits)
  const cleanedPostal = postalCodeInput.value.replace(/[\s-]/g, '');
  if (cleanedPostal && !/^\d{10}$/.test(cleanedPostal)) {
    notificationStore.warning('کد پستی باید یک عدد ۱۰ رقمی معتبر باشد.');
    return;
  }

  const payload: CreateAddressInput = {
    addressType: addressTypeInput.value,
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
      const res = await membersApi.updateMemberAddress(props.member._id, editingAddressId.value, payload);
      if (res.success) {
        notificationStore.success('نشانی با موفقیت به‌روزرسانی شد.');
        closeAddressForm();
        await fetchContacts();
        emit('updated');
      }
    } else {
      const res = await membersApi.addMemberAddress(props.member._id, payload);
      if (res.success) {
        notificationStore.success('نشانی جدید با موفقیت افزوده شد.');
        closeAddressForm();
        await fetchContacts();
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
  if (!props.member?._id || addr.isPrimary) return;
  try {
    const res = await membersApi.updateMemberAddress(props.member._id, addr._id, { isPrimary: true });
    if (res.success) {
      notificationStore.success('نشانی به عنوان آدرس اصلی تنظیم شد.');
      await fetchContacts();
      emit('updated');
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در تغییر نشانی اصلی'));
  }
}

async function handleDeleteAddress() {
  if (!props.member?._id || !addressToDelete.value) return;
  try {
    const res = await membersApi.deleteMemberAddress(props.member._id, addressToDelete.value);
    if (res.success) {
      notificationStore.success('نشانی حذف شد.');
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
// TELEPHONE ACTIONS
// --------------------------------------------------------------------------
function openAddPhoneForm() {
  editingPhoneId.value = null;
  phoneTypeInput.value = 'MOBILE';
  phoneNumberInput.value = '';
  areaCodeInput.value = '';
  countryCodeInput.value = '+98';
  extensionInput.value = '';
  phoneTitleInput.value = '';
  isPrimaryPhone.value = telephones.value.length === 0;
  isPhoneFormOpen.value = true;
}

function openEditPhoneForm(phone: MemberTelephone) {
  editingPhoneId.value = phone._id;
  phoneTypeInput.value = phone.phoneType || 'MOBILE';
  phoneNumberInput.value = phone.phoneNumber || '';
  areaCodeInput.value = phone.areaCode || '';
  countryCodeInput.value = phone.countryCode || '+98';
  extensionInput.value = phone.extension || '';
  phoneTitleInput.value = phone.title || '';
  isPrimaryPhone.value = Boolean(phone.isPrimary);
  isPhoneFormOpen.value = true;
}

function closePhoneForm() {
  isPhoneFormOpen.value = false;
  editingPhoneId.value = null;
}

async function handleSavePhone() {
  if (!props.member?._id) return;

  const rawPhone = phoneNumberInput.value.trim();
  if (!rawPhone) {
    notificationStore.warning('لطفاً شماره تماس را وارد فرمایید.');
    return;
  }

  const payload: CreateTelephoneInput = {
    phoneType: phoneTypeInput.value,
    phoneNumber: rawPhone,
    areaCode: areaCodeInput.value.trim() || undefined,
    countryCode: countryCodeInput.value.trim() || '+98',
    extension: extensionInput.value.trim() || undefined,
    title: phoneTitleInput.value.trim() || undefined,
    isPrimary: isPrimaryPhone.value,
  };

  isSavingPhone.value = true;
  try {
    if (editingPhoneId.value) {
      const res = await membersApi.updateMemberTelephone(props.member._id, editingPhoneId.value, payload);
      if (res.success) {
        notificationStore.success('شماره تماس به‌روزرسانی شد.');
        closePhoneForm();
        await fetchContacts();
        emit('updated');
      }
    } else {
      const res = await membersApi.addMemberTelephone(props.member._id, payload);
      if (res.success) {
        notificationStore.success('شماره تماس با موفقیت ثبت شد.');
        closePhoneForm();
        await fetchContacts();
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
  if (!props.member?._id || phone.isPrimary) return;
  try {
    const res = await membersApi.updateMemberTelephone(props.member._id, phone._id, { isPrimary: true });
    if (res.success) {
      notificationStore.success('شماره به عنوان خط اصلی ثبت شد.');
      await fetchContacts();
      emit('updated');
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در تغییر شماره اصلی'));
  }
}

async function handleDeleteTelephone() {
  if (!props.member?._id || !phoneToDelete.value) return;
  try {
    const res = await membersApi.deleteMemberTelephone(props.member._id, phoneToDelete.value);
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

function copyToClipboard(text: string, message = 'کپی شد') {
  if (!text) return;
  navigator.clipboard.writeText(text);
  notificationStore.success(message);
}
</script>

<template>
  <Modal
    :open="open"
    size="xl"
    @close="emit('update:open', false)"
  >
    <!-- Custom Modal Header -->
    <template #header>
      <div v-if="member" class="w-full flex items-center justify-between text-right" dir="rtl">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 flex items-center justify-center font-black text-sm">
            {{ member.firstName ? member.firstName[0] : 'ع' }}
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>مدیریت آدرس‌ها و شماره تماس‌ها</span>
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
      <!-- Tabs Switcher -->
      <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
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
          <span>نشانی‌ها و شعب</span>
          <span class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold tabular-nums">
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
          <span>شماره‌های تماس و تلفن‌ها</span>
          <span class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold tabular-nums">
            {{ toPersianDigits(telephones.length) }}
          </span>
        </button>
      </div>

      <!-- ================================================================= -->
      <!-- TAB 1: ADDRESSES -->
      <!-- ================================================================= -->
      <div v-if="activeTab === 'addresses'" class="space-y-4">
        <div class="flex items-center justify-between">
          <p class="text-xs text-slate-500 dark:text-slate-400">
            فهرست تمامی آدرس‌های پستی ثبت‌شده، محل کار، اقامتگاه قانونی و شعب این عضو:
          </p>

          <Button
            variant="primary"
            size="sm"
            @click="openAddAddressForm"
          >
            <Plus class="w-4 h-4 ml-1" />
            ثبت نشانی جدید
          </Button>
        </div>

        <!-- Loading State -->
        <div v-if="isLoadingData" class="py-12 text-center text-xs text-slate-400">
          در حال بارگذاری اطلاعات نشانی‌ها...
        </div>

        <!-- Empty State -->
        <div v-else-if="addresses.length === 0">
          <EmptyState
            title="هیچ نشانی برای این عضو ثبت نشده است"
            description="می‌توانید با کلیک روی دکمه «ثبت نشانی جدید»، آدرس محل کار یا اقامتگاه را وارد نمایید."
            :icon="MapPin"
          >
            <template #action>
              <Button variant="primary" size="sm" @click="openAddAddressForm">
                ثبت اولین نشانی
              </Button>
            </template>
          </EmptyState>
        </div>

        <!-- Addresses List -->
        <div v-else class="space-y-3">
          <div
            v-for="addr in addresses"
            :key="addr._id"
            :class="[
              'p-4 rounded-2xl border transition-all duration-150',
              addr.isPrimary
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/80 shadow-xs'
                : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700',
            ]"
          >
            <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs">
              <div class="space-y-2 flex-1">
                <!-- Badges Row -->
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    v-if="addr.isPrimary"
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 font-bold text-[11px]"
                  >
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
                    پلاک: <strong class="text-slate-700 dark:text-slate-200 tabular-nums">{{ toPersianDigits(addr.plaque) }}</strong>
                  </span>
                </div>

                <!-- Full Address text -->
                <p class="text-slate-900 dark:text-slate-100 text-sm font-medium leading-relaxed">
                  {{ addr.address }}
                </p>

                <!-- Postal code & helpers -->
                <div class="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                  <div class="flex items-center gap-1.5">
                    <span>کد پستی:</span>
                    <strong class="text-slate-800 dark:text-slate-200 font-bold tabular-nums" dir="ltr">
                      {{ toPersianDigits(addr.postalCode) || '—' }}
                    </strong>
                    <button
                      v-if="addr.postalCode"
                      type="button"
                      class="text-slate-400 hover:text-brand-600 transition-colors p-0.5"
                      title="کپی کد پستی"
                      @click="copyToClipboard(addr.postalCode, 'کد پستی کپی شد')"
                    >
                      <Copy class="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Item Actions -->
              <div class="flex items-center gap-1 shrink-0 self-end sm:self-start">
                <Button
                  v-if="!addr.isPrimary"
                  variant="ghost"
                  size="sm"
                  title="انتخاب به عنوان نشانی اصلی"
                  @click="handleSetPrimaryAddress(addr)"
                >
                  <Star class="w-3.5 h-3.5 ml-1 text-slate-400" />
                  اصلی کردن
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  title="ویرایش نشانی"
                  @click="openEditAddressForm(addr)"
                >
                  <Edit2 class="w-3.5 h-3.5 ml-1" />
                  ویرایش
                </Button>

                <button
                  type="button"
                  class="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                  title="حذف نشانی"
                  @click="addressToDelete = addr._id"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- TAB 2: TELEPHONES -->
      <!-- ================================================================= -->
      <div v-else-if="activeTab === 'telephones'" class="space-y-4">
        <div class="flex items-center justify-between">
          <p class="text-xs text-slate-500 dark:text-slate-400">
            فهرست خطوط تلفن همراه، ثابت، نمابر و خطوط ارتباطی ثبت‌شده این عضو:
          </p>

          <Button
            variant="primary"
            size="sm"
            @click="openAddPhoneForm"
          >
            <Plus class="w-4 h-4 ml-1" />
            افزودن شماره تماس
          </Button>
        </div>

        <!-- Loading State -->
        <div v-if="isLoadingData" class="py-12 text-center text-xs text-slate-400">
          در حال بارگذاری شماره‌های تماس...
        </div>

        <!-- Empty State -->
        <div v-else-if="telephones.length === 0">
          <EmptyState
            title="هیچ شماره تماسی ثبت نشده است"
            description="می‌توانید با کلیک روی دکمه «افزودن شماره تماس»، شماره تلفن همراه یا خط ثابت را اضافه فرمایید."
            :icon="Phone"
          >
            <template #action>
              <Button variant="primary" size="sm" @click="openAddPhoneForm">
                ثبت اولین شماره تماس
              </Button>
            </template>
          </EmptyState>
        </div>

        <!-- Telephones List -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            v-for="phone in telephones"
            :key="phone._id"
            :class="[
              'p-3.5 rounded-2xl border transition-all duration-150 flex items-center justify-between gap-3 text-xs',
              phone.isPrimary
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/80 shadow-xs'
                : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700',
            ]"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div
                :class="[
                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                  phone.isPrimary
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
                ]"
              >
                <Phone class="w-4 h-4" />
              </div>

              <div class="space-y-0.5 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-sm text-slate-900 dark:text-slate-100 tabular-nums" dir="ltr">
                    <span v-if="phone.areaCode && phone.phoneType !== 'MOBILE'">({{ phone.areaCode }}) </span>
                    {{ toPersianDigits(phone.phoneNumber) }}
                  </span>

                  <span
                    v-if="phone.isPrimary"
                    class="px-2 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold text-[10px]"
                  >
                    اصلی
                  </span>
                </div>

                <div class="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  <Badge variant="default">
                    {{ phoneTypeConfig[phone.phoneType] || phone.phoneType }}
                  </Badge>
                  <span v-if="phone.title" class="truncate">&bull; {{ phone.title }}</span>
                  <span v-if="phone.extension">&bull; داخلی {{ toPersianDigits(phone.extension) }}</span>
                </div>
              </div>
            </div>

            <!-- Phone Actions -->
            <div class="flex items-center gap-1 shrink-0">
              <button
                type="button"
                class="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="کپی شماره"
                @click="copyToClipboard(phone.phoneNumber, 'شماره تماس کپی شد')"
              >
                <Copy class="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                class="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="ویرایش"
                @click="openEditPhoneForm(phone)"
              >
                <Edit2 class="w-3.5 h-3.5" />
              </button>

              <button
                v-if="!phone.isPrimary"
                type="button"
                class="p-1.5 text-amber-500 hover:text-amber-600 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                title="تنظیم به عنوان خط اصلی"
                @click="handleSetPrimaryPhone(phone)"
              >
                <Star class="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                class="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                title="حذف شماره"
                @click="phoneToDelete = phone._id"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Footer -->
    <template #footer>
      <div class="w-full flex items-center justify-between text-xs">
        <span class="text-slate-400">
          تغییرات به صورت لحظه‌ای در پرونده ذخیره می‌شوند.
        </span>

        <Button
          variant="outline"
          size="md"
          @click="emit('update:open', false)"
        >
          بستن پنجره
        </Button>
      </div>
    </template>
  </Modal>

  <!-- ===================================================================== -->
  <!-- SUB-MODAL: ADD / EDIT ADDRESS -->
  <!-- ===================================================================== -->
  <Modal
    :open="isAddressFormOpen"
    :title="editingAddressId ? 'ویرایش نشانی عضو' : 'افزودن نشانی جدید برای عضو'"
    :subtitle="member ? `${member.firstName || ''} ${member.lastName || ''} (کد: ${member.memberCode})` : undefined"
    size="md"
    @close="closeAddressForm"
  >
    <div class="space-y-4 text-right" dir="rtl">
      <!-- Address Type -->
      <Select
        v-model="addressTypeInput"
        label="نوع نشانی"
        :options="lookupsStore.addressTypes.map((t) => ({ label: t.title, value: t._id }))"
        required
      />

      <!-- Province & City cascading -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

      <!-- Address Text -->
      <Input
        v-model="addressTextInput"
        label="آدرس پستی کامل"
        placeholder="خیابان، کوچه، پلاک، طبقه، واحد..."
        required
      />

      <!-- Postal code & Plaque -->
      <div class="grid grid-cols-2 gap-3">
        <Input
          v-model="postalCodeInput"
          label="کد پستی (۱۰ رقم)"
          placeholder="مثال: 1417755331"
          dir="ltr"
          maxlength="10"
        />

        <Input
          v-model="plaqueInput"
          label="پلاک / واحد"
          placeholder="مثال: ۱۲، واحد ۴"
        />
      </div>

      <!-- Primary toggle -->
      <label class="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none pt-2">
        <input
          v-model="isPrimaryAddress"
          type="checkbox"
          class="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
        />
        ثبت به عنوان نشانی اصلی پرونده عضو
      </label>
    </div>

    <template #footer>
      <Button variant="outline" size="md" @click="closeAddressForm">
        انصراف
      </Button>
      <Button
        variant="primary"
        size="md"
        :loading="isSavingAddress"
        @click="handleSaveAddress"
      >
        {{ editingAddressId ? 'ذخیره تغییرات نشانی' : 'ثبت نشانی' }}
      </Button>
    </template>
  </Modal>

  <!-- Delete Address Confirmation -->
  <ConfirmDialog
    :open="Boolean(addressToDelete)"
    title="حذف نشانی عضو"
    description="آیا از حذف این نشانی اطمینان دارید؟ این عمل غیرقابل بازگشت است."
    confirm-text="حذف نشانی"
    variant="danger"
    @confirm="handleDeleteAddress"
    @cancel="addressToDelete = null"
  />

  <!-- ===================================================================== -->
  <!-- SUB-MODAL: ADD / EDIT TELEPHONE -->
  <!-- ===================================================================== -->
  <Modal
    :open="isPhoneFormOpen"
    :title="editingPhoneId ? 'ویرایش شماره تماس' : 'افزودن شماره تماس جدید'"
    :subtitle="member ? `${member.firstName || ''} ${member.lastName || ''} (کد: ${member.memberCode})` : undefined"
    size="md"
    @close="closePhoneForm"
  >
    <div class="space-y-4 text-right" dir="rtl">
      <!-- Phone Type -->
      <Select
        v-model="phoneTypeInput"
        label="نوع خط ارتباطی"
        :options="[
          { label: 'تلفن همراه', value: 'MOBILE' },
          { label: 'تلفن ثابت', value: 'LANDLINE' },
          { label: 'نمابر (فکس)', value: 'FAX' },
          { label: 'خط پشتیبانی', value: 'SUPPORT' },
          { label: 'سایر خطوط', value: 'OTHER' },
        ]"
        required
      />

      <!-- Phone Number & Area Code -->
      <div class="grid grid-cols-3 gap-3">
        <div class="col-span-2">
          <Input
            v-model="phoneNumberInput"
            label="شماره تماس"
            placeholder="مثال: 09121234567 یا 88776655"
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

      <!-- Extension & Title -->
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
          placeholder="مثال: خط مستقیم مدیریت"
        />
      </div>

      <!-- Primary toggle -->
      <label class="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none pt-2">
        <input
          v-model="isPrimaryPhone"
          type="checkbox"
          class="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
        />
        ثبت به عنوان شماره تماس اصلی
      </label>
    </div>

    <template #footer>
      <Button variant="outline" size="md" @click="closePhoneForm">
        انصراف
      </Button>
      <Button
        variant="primary"
        size="md"
        :loading="isSavingPhone"
        @click="handleSavePhone"
      >
        {{ editingPhoneId ? 'ذخیره تغییرات شماره' : 'ثبت شماره تماس' }}
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
