<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { Eye, EyeOff, Lock } from 'lucide-vue-next';
import { Modal, Button, Input } from '@/components/ui';
import { membersApi } from '@/api';
import type { Member } from '@/types';
import { useNotificationStore } from '@/stores';
import { extractErrorMessage } from '@/utils/errors';
import { toPersianDigits } from '@/utils/formatters';

const props = defineProps<{
  open: boolean;
  member: Member | null;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

const notificationStore = useNotificationStore();

const newPassword = ref('');
const confirmPassword = ref('');
const showNew = ref(false);
const showConfirm = ref(false);
const isSubmitting = ref(false);
const formError = ref('');
const newError = ref('');
const confirmError = ref('');

const memberLabel = computed(() => {
  if (!props.member) return '';
  const name = `${props.member.firstName || ''} ${props.member.lastName || ''}`.trim();
  const code = props.member.memberCode ? `کد ${toPersianDigits(props.member.memberCode)}` : '';
  return [name || 'عضو', code].filter(Boolean).join(' · ');
});

function close() {
  if (isSubmitting.value) return;
  emit('update:open', false);
}

function resetForm() {
  newPassword.value = '';
  confirmPassword.value = '';
  showNew.value = false;
  showConfirm.value = false;
  formError.value = '';
  newError.value = '';
  confirmError.value = '';
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) resetForm();
  }
);

function validate(): boolean {
  formError.value = '';
  newError.value = '';
  confirmError.value = '';
  let valid = true;

  const next = newPassword.value.trim();
  if (!next) {
    newError.value = 'رمز عبور جدید را وارد کنید';
    valid = false;
  } else if (next.length < 6) {
    newError.value = 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد';
    valid = false;
  }

  if (!confirmPassword.value) {
    confirmError.value = 'تکرار رمز عبور را وارد کنید';
    valid = false;
  } else if (confirmPassword.value !== newPassword.value) {
    confirmError.value = 'تکرار رمز عبور با رمز جدید یکسان نیست';
    valid = false;
  }

  return valid;
}

async function handleSubmit() {
  if (isSubmitting.value || !props.member || !validate()) return;

  isSubmitting.value = true;
  formError.value = '';
  try {
    await membersApi.setMemberPassword(props.member._id, newPassword.value.trim());
    notificationStore.success('رمز عبور عضو با موفقیت تغییر کرد.');
    emit('update:open', false);
  } catch (error) {
    formError.value = extractErrorMessage(error, 'تغییر رمز عبور عضو انجام نشد.');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <Modal
    :open="open"
    title="تغییر رمز عبور عضو"
    :subtitle="memberLabel"
    size="sm"
    :closable="!isSubmitting"
    @close="close"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <p class="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        رمز ورود پروفایل این عضو جایگزین می‌شود. عضو از این پس با رمز جدید وارد می‌شود و رمز قبلی، از جمله کد ملی، دیگر پذیرفته نمی‌شود.
      </p>

      <Input
        v-model="newPassword"
        label="رمز عبور جدید"
        :type="showNew ? 'text' : 'password'"
        placeholder="حداقل ۶ کاراکتر"
        autocomplete="new-password"
        :error="newError"
        required
      >
        <template #prefix>
          <Lock class="h-4 w-4" />
        </template>
        <template #suffix>
          <button
            type="button"
            class="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            tabindex="-1"
            :title="showNew ? 'پنهان کردن رمز' : 'نمایش رمز'"
            @click="showNew = !showNew"
          >
            <EyeOff v-if="showNew" class="h-4 w-4" />
            <Eye v-else class="h-4 w-4" />
          </button>
        </template>
      </Input>

      <Input
        v-model="confirmPassword"
        label="تکرار رمز عبور جدید"
        :type="showConfirm ? 'text' : 'password'"
        placeholder="رمز جدید را دوباره وارد کنید"
        autocomplete="new-password"
        :error="confirmError"
        required
      >
        <template #prefix>
          <Lock class="h-4 w-4" />
        </template>
        <template #suffix>
          <button
            type="button"
            class="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            tabindex="-1"
            :title="showConfirm ? 'پنهان کردن رمز' : 'نمایش رمز'"
            @click="showConfirm = !showConfirm"
          >
            <EyeOff v-if="showConfirm" class="h-4 w-4" />
            <Eye v-else class="h-4 w-4" />
          </button>
        </template>
      </Input>

      <p
        v-if="formError"
        class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
      >
        {{ formError }}
      </p>
    </form>

    <template #footer>
      <Button variant="outline" :disabled="isSubmitting" @click="close">
        انصراف
      </Button>
      <Button variant="primary" :loading="isSubmitting" @click="handleSubmit">
        ثبت رمز جدید
      </Button>
    </template>
  </Modal>
</template>
