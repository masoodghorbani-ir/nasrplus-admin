<script setup lang="ts">
import { Modal } from '@/components/ui';
import MemberImportWizard from './MemberImportWizard.vue';
import type { IImportExecutionResponse } from '@/types';

interface Props {
  open: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'imported', result: IImportExecutionResponse): void;
}>();

function handleClose() {
  emit('update:open', false);
}

function handleImported(result: IImportExecutionResponse) {
  emit('imported', result);
}
</script>

<template>
  <Modal
    :open="open"
    title="ورود دسته‌جمعی اعضا از فایل اکسل"
    subtitle="بارگذاری، تطبیق ستون‌ها و ثبت هوشمند پرونده‌های عضویت حقیقی و حقوقی"
    size="3xl"
    :close-on-backdrop="false"
    @close="handleClose"
  >
    <MemberImportWizard
      :is-modal="true"
      @close="handleClose"
      @imported="handleImported"
    />
  </Modal>
</template>
