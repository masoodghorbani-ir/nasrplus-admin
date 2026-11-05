<script setup lang="ts">
import { ref } from 'vue';
import { Eye, EyeOff, Lock } from 'lucide-vue-next';
import { Button, Input } from '@/components/ui';
import { useNotificationStore } from '@/stores';
import { extractErrorMessage } from '@/utils/errors';

interface PasswordPayload {
  currentPassword: string;
  newPassword: string;
}

const props = withDefaults(
  defineProps<{
    submit: (payload: PasswordPayload) => Promise<unknown>;
    submitLabel?: string;
    hint?: string;
  }>(),
  {
    submitLabel: 'ثبت رمز عبور جدید',
    hint: '',
  }
);

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const notificationStore = useNotificationStore();

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const showCurrent = ref(false);
const showNew = ref(false);
const showConfirm = ref(false);
const isSubmitting = ref(false);
const formError = ref('');
const currentError = ref('');
const newError = ref('');
const confirmError = ref('');

function resetErrors() {
  formError.value = '';
  currentError.value = '';
  newError.value = '';
  confirmError.value = '';
}

function validate(): boolean {
  resetErrors();
  let valid = true;

  if (!currentPassword.value) {
    currentError.value = 'رمز عبور فعلی را وارد کنید';
    valid = false;
  }

  const next = newPassword.value.trim();
  if (!next) {
    newError.value = 'رمز عبور جدید را وارد کنید';
    valid = false;
  } else if (next.length < 6) {
    newError.value = 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد';
    valid = false;
  } else if (next === currentPassword.value) {
    newError.value = 'رمز عبور جدید نباید با رمز فعلی یکسان باشد';
    valid = false;
  }

  if (!confirmPassword.value) {
    confirmError.value = 'تکرار رمز عبور جدید را وارد کنید';
    valid = false;
  } else if (confirmPassword.value !== newPassword.value) {
    confirmError.value = 'تکرار رمز عبور با رمز جدید یکسان نیست';
    valid = false;
  }

  return valid;
}

async function handleSubmit() {
  if (isSubmitting.value || !validate()) return;

  isSubmitting.value = true;
  formError.value = '';
  try {
    await props.submit({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value.trim(),
    });
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    notificationStore.success('رمز عبور با موفقیت تغییر کرد.');
    emit('success');
  } catch (error) {
    formError.value = extractErrorMessage(error, 'تغییر رمز عبور انجام نشد.');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <p v-if="hint" class="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
      {{ hint }}
    </p>

    <Input
      v-model="currentPassword"
      label="رمز عبور فعلی"
      :type="showCurrent ? 'text' : 'password'"
      placeholder="رمز فعلی را وارد کنید"
      autocomplete="current-password"
      :error="currentError"
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
          :title="showCurrent ? 'پنهان کردن رمز' : 'نمایش رمز'"
          @click="showCurrent = !showCurrent"
        >
          <EyeOff v-if="showCurrent" class="h-4 w-4" />
          <Eye v-else class="h-4 w-4" />
        </button>
      </template>
    </Input>

    <Input
      v-model="newPassword"
      label="رمز عبور جدید"
      :type="showNew ? 'text' : 'password'"
      placeholder="حداقل ۶ کاراکتر"
      autocomplete="new-password"
      hint="حداقل ۶ کاراکتر"
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

    <Button type="submit" variant="primary" :loading="isSubmitting" :disabled="isSubmitting">
      {{ submitLabel }}
    </Button>
  </form>
</template>
