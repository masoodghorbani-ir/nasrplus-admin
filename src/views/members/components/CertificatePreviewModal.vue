<script setup lang="ts">
import { computed } from 'vue';
import { Modal, Button } from '@/components/ui';
import {
  FileText,
  Download,
  ExternalLink,
  Award,
} from 'lucide-vue-next';

interface Props {
  open: boolean;
  fileUrl?: string;
  title?: string;
  specializationTitle?: string;
  memberName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  fileUrl: '',
  title: 'مشاهده گواهینامه',
  specializationTitle: '',
  memberName: '',
});

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
}>();

const isPdf = computed(() => {
  if (!props.fileUrl) return false;
  return props.fileUrl.toLowerCase().includes('.pdf');
});

const isImage = computed(() => {
  if (!props.fileUrl) return false;
  const lower = props.fileUrl.toLowerCase();
  return (
    lower.includes('.jpg') ||
    lower.includes('.jpeg') ||
    lower.includes('.png') ||
    lower.includes('.webp') ||
    lower.startsWith('data:image') ||
    lower.startsWith('blob:') ||
    lower.includes('images.unsplash.com')
  );
});

function handleDownload() {
  if (!props.fileUrl) return;
  const link = document.createElement('a');
  link.href = props.fileUrl;
  link.download = props.title ? `${props.title}.pdf` : 'certificate.pdf';
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>

<template>
  <Modal
    :open="open"
    size="xl"
    @close="emit('update:open', false)"
  >
    <template #header>
      <div class="w-full flex items-center justify-between text-right" dir="rtl">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 flex items-center justify-center font-bold">
            <Award class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{{ title || 'مشاهده گواهینامه معتبر مهارت' }}</span>
            </h3>
            <p v-if="specializationTitle || memberName" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
              <span v-if="specializationTitle">رسته: {{ specializationTitle }}</span>
              <span v-if="specializationTitle && memberName">•</span>
              <span v-if="memberName">عضو: {{ memberName }}</span>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <a
            v-if="fileUrl"
            :href="fileUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="باز کردن در برگه جدید"
          >
            <ExternalLink class="w-4 h-4" />
            <span class="hidden sm:inline">باز کردن مجزا</span>
          </a>

          <Button
            v-if="fileUrl"
            variant="outline"
            size="sm"
            @click="handleDownload"
          >
            <Download class="w-4 h-4" />
            <span class="hidden sm:inline">دانلود فایل</span>
          </Button>
        </div>
      </div>
    </template>

    <!-- Preview Content -->
    <div class="min-h-[420px] max-h-[75vh] overflow-auto flex items-center justify-center bg-slate-100 dark:bg-slate-950/50 rounded-xl p-4 border border-slate-200/60 dark:border-slate-800">
      <!-- PDF Document Viewer -->
      <iframe
        v-if="isPdf"
        :src="fileUrl"
        class="w-full h-[65vh] rounded-lg border-0 bg-white"
        title="نمایش فایل گواهینامه PDF"
      ></iframe>

      <!-- High-res Image Preview -->
      <div v-else-if="isImage" class="flex flex-col items-center justify-center w-full">
        <img
          :src="fileUrl"
          :alt="title || 'Certificate Image'"
          class="max-w-full max-h-[65vh] object-contain rounded-lg shadow-md border border-slate-200 dark:border-slate-800"
        />
      </div>

      <!-- Fallback Preview Box -->
      <div v-else class="text-center py-12 space-y-3">
        <FileText class="w-16 h-16 text-slate-400 mx-auto" />
        <p class="text-sm font-bold text-slate-700 dark:text-slate-300">
          فایل ضمیمه گواهینامه بارگذاری شده است
        </p>
        <p class="text-xs text-slate-500">
          برای مشاهده کامل یا چاپ روی دکمه دریافت یا باز کردن مجزا کلیک نمایید.
        </p>
        <div class="pt-2">
          <Button variant="primary" size="sm" @click="handleDownload">
            <Download class="w-4 h-4 ml-1.5" />
            دانلود و مشاهده سند
          </Button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="w-full flex justify-end">
        <Button variant="secondary" @click="emit('update:open', false)">
          بستن
        </Button>
      </div>
    </template>
  </Modal>
</template>
