<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next';
import Modal from './Modal.vue';
import Button from './Button.vue';

interface Props {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  title: 'آیا اطمینان دارید؟',
  description: 'این عملیات غیرقابل بازگشت خواهد بود.',
  confirmText: 'تایید و ادامه',
  cancelText: 'انصراف',
  variant: 'danger',
  loading: false,
});

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

function onCancel() {
  emit('update:open', false);
  emit('cancel');
}

function onConfirm() {
  emit('confirm');
}
</script>

<template>
  <Modal
    :open="open"
    size="sm"
    :closable="!loading"
    @close="onCancel"
  >
    <div class="flex items-start gap-4">
      <div
        :class="[
          'p-3 rounded-full shrink-0',
          variant === 'danger'
            ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
            : 'bg-brand-100 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400',
        ]"
      >
        <AlertTriangle class="w-6 h-6" />
      </div>

      <div class="flex-1 text-right">
        <h4 class="text-base font-bold text-slate-900 dark:text-slate-100">
          {{ title }}
        </h4>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {{ description }}
        </p>
      </div>
    </div>

    <template #footer>
      <Button
        variant="outline"
        size="md"
        :disabled="loading"
        @click="onCancel"
      >
        {{ cancelText }}
      </Button>
      <Button
        :variant="variant === 'danger' ? 'danger' : 'primary'"
        size="md"
        :loading="loading"
        @click="onConfirm"
      >
        {{ confirmText }}
      </Button>
    </template>
  </Modal>
</template>
