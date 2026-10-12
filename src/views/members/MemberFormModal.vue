<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useLookupsStore, useNotificationStore } from '@/stores';
import { membersApi, companiesApi } from '@/api';
import type { Member, CreateMemberInput, UpdateMemberInput, Gender, MemberStatus, Company } from '@/types';
import { Modal, Button, Input, Select, DatePicker } from '@/components/ui';
import { extractErrorMessage } from '@/utils/errors';
import { isValidNationalCode } from '@/utils/formatters';
import { safeToIso } from '@/utils/jalali';

interface Props {
  open: boolean;
  member?: Member | null; // If passed, edit mode; else create mode
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  member: null,
});

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'saved', member: Member): void;
}>();

const lookupsStore = useLookupsStore();
const notificationStore = useNotificationStore();

const isSubmitting = ref(false);
const companiesList = ref<Company[]>([]);

// Form state
const memberCode = ref('');
const firstName = ref('');
const lastName = ref('');
const nationalCode = ref('');
const fatherName = ref('');
const gender = ref<Gender>('MALE');
const birthDate = ref('');
const status = ref<MemberStatus>('ACTIVE');
const membershipTypeId = ref('');
const specializationId = ref('');
const rankId = ref('');
const natureOfMembership = ref('');
const companyInformation = ref('');
const membershipDate = ref('');
const expiryDate = ref('');
const notes = ref('');

const errors = ref<Record<string, string>>({});

const isEdit = computed(() => Boolean(props.member));

const selectedNature = computed(() =>
  lookupsStore.natureOfMemberships.find((n) => n._id === natureOfMembership.value)
);

const isLegal = computed(() => {
  if (!selectedNature.value) return false;
  const text = `${selectedNature.value.title || ''} ${selectedNature.value.code || ''}`.toLowerCase();
  return text.includes('حقوقی') || text.includes('legal') || text.includes('شرکت') || text.includes('company');
});

const isIndividual = computed(() => {
  if (!selectedNature.value) return true;
  const text = `${selectedNature.value.title || ''} ${selectedNature.value.code || ''}`.toLowerCase();
  if (text.includes('حقیقی') || text.includes('individual') || text.includes('شخص') || text.includes('فردی')) return true;
  return !isLegal.value;
});

async function fetchCompanies() {
  try {
    const res = await companiesApi.getCompanies({ limit: 100 });
    if (res.success) {
      companiesList.value = res.data;
    }
  } catch {
    // Ignore error
  }
}

watch(
  () => props.open,
  async (val) => {
    if (val) {
      await lookupsStore.fetchAllLookups();
      await fetchCompanies();
      errors.value = {};

      if (props.member) {
        // Edit mode
        memberCode.value = props.member.memberCode;
        firstName.value = props.member.firstName || '';
        lastName.value = props.member.lastName || '';
        nationalCode.value = props.member.nationalCode || '';
        fatherName.value = props.member.fatherName || '';
        gender.value = props.member.gender || 'MALE';
        birthDate.value = props.member.birthDate ? props.member.birthDate.split('T')[0] : '';
        status.value = props.member.status || 'ACTIVE';
        membershipTypeId.value = typeof props.member.membershipTypeId === 'object' ? props.member.membershipTypeId._id : props.member.membershipTypeId;
        specializationId.value = typeof props.member.specializationId === 'object' ? props.member.specializationId._id : props.member.specializationId;
        rankId.value = props.member.rankId ? (typeof props.member.rankId === 'object' ? props.member.rankId._id : props.member.rankId) : '';
        natureOfMembership.value = props.member.natureOfMembership ? (typeof props.member.natureOfMembership === 'object' ? props.member.natureOfMembership._id : props.member.natureOfMembership) : '';
        companyInformation.value = props.member.companyInformation ? (typeof props.member.companyInformation === 'object' ? props.member.companyInformation._id : props.member.companyInformation) : '';
        membershipDate.value = props.member.membershipDate ? props.member.membershipDate.split('T')[0] : '';
        expiryDate.value = props.member.expiryDate ? props.member.expiryDate.split('T')[0] : '';
        notes.value = props.member.notes || '';
      } else {
        // Create mode
        memberCode.value = `NSR-${Math.floor(100000 + Math.random() * 900000)}`;
        firstName.value = '';
        lastName.value = '';
        nationalCode.value = '';
        fatherName.value = '';
        gender.value = 'MALE';
        birthDate.value = '';
        status.value = 'ACTIVE';
        membershipTypeId.value = lookupsStore.membershipTypes[0]?._id || '';
        specializationId.value = lookupsStore.specializations[0]?._id || '';
        rankId.value = lookupsStore.ranks[0]?._id || '';
        natureOfMembership.value = lookupsStore.natureOfMemberships[0]?._id || '';
        companyInformation.value = '';
        membershipDate.value = '';
        expiryDate.value = '';
        notes.value = '';
      }
    }
  }
);

function validate(): boolean {
  errors.value = {};

  if (!memberCode.value.trim()) {
    errors.value.memberCode = 'کد عضویت الزامی است';
  }
  if (!natureOfMembership.value) {
    errors.value.natureOfMembership = 'انتخاب ماهیت عضویت الزامی است';
  }
  if (!firstName.value.trim() && isIndividual.value) {
    errors.value.firstName = 'نام الزامی است';
  }
  if (!lastName.value.trim() && isIndividual.value) {
    errors.value.lastName = 'نام خانوادگی الزامی است';
  }
  if (nationalCode.value.trim() && !isValidNationalCode(nationalCode.value.trim())) {
    errors.value.nationalCode = 'کد ملی وارد شده نامعتبر است';
  }
  if (!membershipTypeId.value) {
    errors.value.membershipTypeId = 'انتخاب نوع عضویت الزامی است';
  }
  if (!specializationId.value) {
    errors.value.specializationId = 'انتخاب رسته تخصصی الزامی است';
  }

  return Object.keys(errors.value).length === 0;
}

async function handleSubmit() {
  if (!validate()) return;

  isSubmitting.value = true;
  try {
    if (isEdit.value && props.member) {
      const updatePayload: UpdateMemberInput = {
        firstName: firstName.value.trim() || undefined,
        lastName: lastName.value.trim() || undefined,
        fatherName: fatherName.value.trim() || undefined,
        gender: gender.value,
        birthDate: birthDate.value ? safeToIso(birthDate.value) || birthDate.value : undefined,
        status: status.value,
        membershipTypeId: membershipTypeId.value || undefined,
        specializationId: specializationId.value || undefined,
        rankId: rankId.value || undefined,
        natureOfMembership: natureOfMembership.value || undefined,
        companyInformation: companyInformation.value || undefined,
        membershipDate: membershipDate.value ? safeToIso(membershipDate.value) : undefined,
        expiryDate: expiryDate.value ? safeToIso(expiryDate.value) : undefined,
        notes: notes.value.trim() || undefined,
      };

      const res = await membersApi.updateMember(props.member._id, updatePayload);
      if (res.success) {
        notificationStore.success('اطلاعات پرونده عضو با موفقیت به‌روزرسانی شد.');
        emit('saved', res.data);
        emit('update:open', false);
      }
    } else {
      const createPayload: CreateMemberInput = {
        memberCode: memberCode.value.trim(),
        firstName: firstName.value.trim() || undefined,
        lastName: lastName.value.trim() || undefined,
        nationalCode: nationalCode.value.trim() || undefined,
        fatherName: fatherName.value.trim() || undefined,
        gender: gender.value,
        birthDate: birthDate.value ? safeToIso(birthDate.value) || birthDate.value : undefined,
        membershipTypeId: membershipTypeId.value,
        specializationId: specializationId.value,
        rankId: rankId.value || undefined,
        natureOfMembership: natureOfMembership.value,
        companyInformation: companyInformation.value || undefined,
        membershipDate: membershipDate.value ? safeToIso(membershipDate.value) : undefined,
        expiryDate: expiryDate.value ? safeToIso(expiryDate.value) : undefined,
      };

      const res = await membersApi.createMember(createPayload);
      if (res.success) {
        notificationStore.success('عضو جدید با موفقیت در سامانه نصر پلاس ثبت شد.');
        emit('saved', res.data);
        emit('update:open', false);
      }
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در ثبت اطلاعات عضو'));
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <Modal
    :open="open"
    :title="isEdit ? 'ویرایش پرونده عضو' : 'ثبت نام عضو جدید در صنف'"
    :subtitle="isEdit ? `شناسه پرونده: ${member?.memberCode}` : 'تکمیل فرم ثبت‌نام و تعیین مشخصات صنفی'"
    size="2xl"
    @close="emit('update:open', false)"
  >
    <form class="space-y-6 text-right" @submit.prevent="handleSubmit">
      <!-- Section 1: Member Identity & Basic Info -->
      <div>
        <h4 class="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3 pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span>۱. مشخصات هویتی و پایه</span>
          <span class="text-[11px] text-slate-400 font-normal">فیلدهای ستاره‌دار (*) اجباری هستند</span>
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            v-model="memberCode"
            label="کد عضویت صنف"
            placeholder="مثال: NSR-201045"
            dir="ltr"
            :error="errors.memberCode"
            :disabled="isEdit"
            required
          />

          <Select
            v-model="natureOfMembership"
            label="ماهیت عضویت"
            placeholder="انتخاب ماهیت (حقیقی / حقوقی)..."
            :options="lookupsStore.natureOfMemberships.map(n => ({ label: n.title, value: n._id }))"
            :error="errors.natureOfMembership"
            required
          />

          <Input
            v-model="nationalCode"
            :label="isLegal ? 'شناسه / کد ملی' : 'کد ملی (۱۰ رقم)'"
            placeholder="0012345678"
            dir="ltr"
            :error="errors.nationalCode"
          />

          <Input
            v-model="firstName"
            :label="isLegal ? 'نام / نماینده' : 'نام'"
            placeholder="نام عضو"
            :error="errors.firstName"
            :required="isIndividual"
          />

          <Input
            v-model="lastName"
            :label="isLegal ? 'نام خانوادگی نماینده' : 'نام خانوادگی'"
            placeholder="نام خانوادگی عضو"
            :error="errors.lastName"
            :required="isIndividual"
          />

          <Input
            v-model="fatherName"
            label="نام پدر"
            placeholder="نام پدر"
          />

          <Select
            v-model="gender"
            label="جنسیت"
            :options="[
              { label: 'مرد', value: 'MALE' },
              { label: 'زن', value: 'FEMALE' },
              { label: 'سایر', value: 'OTHER' },
            ]"
          />

          <DatePicker
            v-model="birthDate"
            :label="isLegal ? 'تاریخ ثبت / تأسیس' : 'تاریخ تولد'"
            placeholder="انتخاب تاریخ..."
          />

          <Select
            v-if="isEdit"
            v-model="status"
            label="وضعیت پرونده عضویت"
            :options="[
              { label: 'فعال', value: 'ACTIVE' },
              { label: 'در انتظار تایید', value: 'PENDING' },
              { label: 'تعلیق شده', value: 'SUSPENDED' },
              { label: 'منقضی شده', value: 'EXPIRED' },
              { label: 'رد شده', value: 'REJECTED' },
            ]"
          />
        </div>
      </div>

      <!-- Section 2: Guild Lookups & Classification -->
      <div>
        <h4 class="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3 pb-1 border-b border-slate-100 dark:border-slate-800">
          ۲. مشخصات صنفی، رسته و رتبه‌بندی
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            v-model="membershipTypeId"
            label="نوع عضویت در صنف"
            placeholder="انتخاب نوع عضویت..."
            :options="lookupsStore.membershipTypes.map(m => ({ label: m.title, value: m._id }))"
            :error="errors.membershipTypeId"
            required
          />

          <Select
            v-model="specializationId"
            label="رسته تخصصی فاوا"
            placeholder="انتخاب رسته تخصصی..."
            :options="lookupsStore.specializations.map(s => ({ label: s.title, value: s._id }))"
            :error="errors.specializationId"
            required
          />

          <Select
            v-model="rankId"
            label="رتبه / گرید صنفی"
            placeholder="انتخاب رتبه..."
            :options="lookupsStore.ranks.map(r => ({ label: r.title, value: r._id }))"
          />

          <Select
            v-model="companyInformation"
            label="وابستگی حقوقی / شرکت مربوطه"
            placeholder="انتخاب شرکت (اختیاری)..."
            :options="[
              { label: '— بدون شرکت وابسته —', value: '' },
              ...companiesList.map(c => ({ label: `${c.title} (${c.nationalId || 'بدون شناسه'})`, value: c._id }))
            ]"
          />

          <DatePicker
            v-model="membershipDate"
            label="تاریخ شروع عضویت"
            placeholder="انتخاب تاریخ شروع..."
          />

          <DatePicker
            v-if="isEdit"
            v-model="expiryDate"
            label="تاریخ انقضای عضویت"
            placeholder="انتخاب تاریخ انقضا..."
          />
        </div>

        <div v-if="isEdit" class="mt-4">
          <Input
            v-model="notes"
            label="یادداشت و توضیحات پرونده"
            placeholder="توضیحات تکمیلی یا سوابق..."
          />
        </div>
      </div>
    </form>

    <template #footer>
      <Button
        variant="outline"
        size="md"
        :disabled="isSubmitting"
        @click="emit('update:open', false)"
      >
        انصراف
      </Button>

      <Button
        variant="primary"
        size="md"
        :loading="isSubmitting"
        @click="handleSubmit"
      >
        {{ isEdit ? 'ذخیره تغییرات پرونده' : 'ثبت نهایی عضو جدید' }}
      </Button>
    </template>
  </Modal>
</template>
