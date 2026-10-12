<script setup lang="ts">
import { ref, watch } from 'vue';
import { membersApi } from '@/api';
import { useLookupsStore, useNotificationStore } from '@/stores';
import type { Member, MemberAddress, MemberTelephone, PhoneType } from '@/types';
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
  Edit,
} from 'lucide-vue-next';
import { extractErrorMessage } from '@/utils/errors';

interface Props {
  open: boolean;
  memberId: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  memberId: null,
});

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'edit', member: Member): void;
}>();

const lookupsStore = useLookupsStore();
const notificationStore = useNotificationStore();

const member = ref<Member | null>(null);
const isLoading = ref(false);
const activeTab = ref<'info' | 'addresses' | 'telephones'>('info');

// Address management state
const addresses = ref<MemberAddress[]>([]);
const isAddAddressOpen = ref(false);
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
const phoneTypeInput = ref<PhoneType>('MOBILE');
const phoneNumberInput = ref('');
const areaCodeInput = ref('');
const countryCodeInput = ref('+98');
const extensionInput = ref('');
const phoneTitleInput = ref('');
const isPrimaryPhone = ref(false);
const isSavingPhone = ref(false);
const phoneToDelete = ref<string | null>(null);

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
      activeTab.value = 'info';
      loadMemberDetails();
    } else {
      member.value = null;
    }
  }
);

// Addresses CRUD
async function handleAddAddress() {
  if (!props.memberId || !addressTextInput.value.trim()) {
    notificationStore.warning('لطفاً نشانی کامل را وارد فرمایید.');
    return;
  }

  isSavingAddress.value = true;
  try {
    const res = await membersApi.addMemberAddress(props.memberId, {
      addressType: addressTypeInput.value || '60d5ec49f1b2c8b1f8c8e1a1',
      province: provinceInput.value || '60d5ec49f1b2c8b1f8c8e1a2',
      city: cityInput.value || '60d5ec49f1b2c8b1f8c8e1a3',
      address: addressTextInput.value.trim(),
      postalCode: postalCodeInput.value.trim() || undefined,
      plaque: plaqueInput.value.trim() || undefined,
      isPrimary: isPrimaryAddress.value,
    });

    if (res.success) {
      notificationStore.success('نشانی با موفقیت افزوده شد.');
      isAddAddressOpen.value = false;
      // Refresh addresses
      const addrRes = await membersApi.getMemberAddresses(props.memberId);
      if (addrRes.success) addresses.value = addrRes.data;
      // Clear form
      addressTextInput.value = '';
      postalCodeInput.value = '';
      plaqueInput.value = '';
      isPrimaryAddress.value = false;
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در افزودن نشانی'));
  } finally {
    isSavingAddress.value = false;
  }
}

async function handleDeleteAddress() {
  if (!props.memberId || !addressToDelete.value) return;

  try {
    const res = await membersApi.deleteMemberAddress(props.memberId, addressToDelete.value);
    if (res.success) {
      notificationStore.success('نشانی حذف گردید.');
      addresses.value = addresses.value.filter((a) => a._id !== addressToDelete.value);
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در حذف نشانی'));
  } finally {
    addressToDelete.value = null;
  }
}

// Telephones CRUD
async function handleAddTelephone() {
  if (!props.memberId || !phoneNumberInput.value.trim()) {
    notificationStore.warning('لطفاً شماره تماس را وارد فرمایید.');
    return;
  }

  isSavingPhone.value = true;
  try {
    const res = await membersApi.addMemberTelephone(props.memberId, {
      phoneType: phoneTypeInput.value,
      phoneNumber: phoneNumberInput.value.trim(),
      areaCode: areaCodeInput.value.trim() || undefined,
      countryCode: countryCodeInput.value.trim() || '+98',
      extension: extensionInput.value.trim() || undefined,
      title: phoneTitleInput.value.trim() || undefined,
      isPrimary: isPrimaryPhone.value,
    });

    if (res.success) {
      notificationStore.success('شماره تماس با موفقیت ثبت شد.');
      isAddPhoneOpen.value = false;
      // Refresh telephones
      const phoneRes = await membersApi.getMemberTelephones(props.memberId);
      if (phoneRes.success) telephones.value = phoneRes.data;
      // Clear form
      phoneNumberInput.value = '';
      areaCodeInput.value = '';
      extensionInput.value = '';
      phoneTitleInput.value = '';
      isPrimaryPhone.value = false;
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در افزودن شماره تماس'));
  } finally {
    isSavingPhone.value = false;
  }
}

async function handleDeleteTelephone() {
  if (!props.memberId || !phoneToDelete.value) return;

  try {
    const res = await membersApi.deleteMemberTelephone(props.memberId, phoneToDelete.value);
    if (res.success) {
      notificationStore.success('شماره تماس حذف گردید.');
      telephones.value = telephones.value.filter((t) => t._id !== phoneToDelete.value);
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در حذف شماره تماس'));
  } finally {
    phoneToDelete.value = null;
  }
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
          @click="member && emit('edit', member)"
        >
          <Edit class="w-3.5 h-3.5 ml-1" />
          ویرایش
        </Button>
      </div>
      <div v-else class="text-sm font-bold">
        در حال دریافت جزییات...
      </div>
    </template>

    <div v-if="member" class="space-y-6 text-right" dir="rtl">
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
          <span class="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]">
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
          <span class="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]">
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
              <span class="font-bold text-slate-800 dark:text-slate-200">
                {{ formatPersianDate(member.birthDate) }}
              </span>
            </div>

            <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              <span class="text-slate-400 block mb-1">تاریخ عضویت:</span>
              <span class="font-bold text-slate-800 dark:text-slate-200">
                {{ formatPersianDate(member.membershipDate || member.createdAt) }}
              </span>
            </div>

            <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              <span class="text-slate-400 block mb-1">تاریخ انقضا:</span>
              <span class="font-bold text-slate-800 dark:text-slate-200">
                {{ formatPersianDate(member.expiryDate) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Guild details -->
        <div>
          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            مشخصات فنی و صنفی
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
              <Layers class="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
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
          <Button variant="primary" size="sm" @click="isAddAddressOpen = true">
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
            class="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-start justify-between gap-4 text-xs"
          >
            <div class="space-y-1.5 flex-1">
              <div class="flex items-center gap-2">
                <span v-if="addr.isPrimary" class="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                  نشانی اصلی
                </span>
                <span class="text-slate-400">
                  کد پستی: <strong class="text-slate-700 dark:text-slate-300 tabular-nums">{{ toPersianDigits(addr.postalCode) || '—' }}</strong>
                </span>
              </div>
              <p class="text-slate-800 dark:text-slate-200 text-sm font-medium leading-relaxed">
                {{ addr.address }}
              </p>
            </div>

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

      <!-- Tab 3: Telephones -->
      <div v-else-if="activeTab === 'telephones'" class="space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-500">شماره‌های تماس و ارتباطی</span>
          <Button variant="primary" size="sm" @click="isAddPhoneOpen = true">
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
            class="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-4 text-xs"
          >
            <div class="flex items-center gap-3">
              <div class="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <Phone class="w-4 h-4" />
              </div>

              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-sm text-slate-900 dark:text-slate-100 tabular-nums" dir="ltr">
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

    <template #footer>
      <Button variant="outline" size="md" @click="emit('update:open', false)">
        بستن پرونده
      </Button>
    </template>
  </Drawer>

  <!-- Add Address Sub-Modal -->
  <Modal
    :open="isAddAddressOpen"
    title="افزودن نشانی جدید برای عضو"
    subtitle="ثبت مشخصات پستی و موقعیت مکانی"
    size="md"
    @close="isAddAddressOpen = false"
  >
    <div class="space-y-4 text-right">
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
      <Button variant="primary" size="md" :loading="isSavingAddress" @click="handleAddAddress">ثبت نشانی</Button>
    </template>
  </Modal>

  <!-- Delete Address Confirmation -->
  <ConfirmDialog
    :open="Boolean(addressToDelete)"
    title="حذف نشانی"
    description="آیا از حذف این نشانی اطمینان دارید؟"
    confirm-text="حذف نشانی"
    @confirm="handleDeleteAddress"
    @cancel="addressToDelete = null"
  />

  <!-- Add Telephone Sub-Modal -->
  <Modal
    :open="isAddPhoneOpen"
    title="افزودن شماره تماس جدید"
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
      <Button variant="primary" size="md" :loading="isSavingPhone" @click="handleAddTelephone">ثبت شماره</Button>
    </template>
  </Modal>

  <!-- Delete Telephone Confirmation -->
  <ConfirmDialog
    :open="Boolean(phoneToDelete)"
    title="حذف شماره تماس"
    description="آیا از حذف این شماره تماس اطمینان دارید؟"
    confirm-text="حذف شماره"
    @confirm="handleDeleteTelephone"
    @cancel="phoneToDelete = null"
  />
</template>
