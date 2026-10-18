<script setup lang="ts">
import { ref } from 'vue';
import type { Member } from '@/types';
import { useMemberAuthStore, useNotificationStore } from '@/stores';
import MemberAvatar from '@/components/ui/MemberAvatar.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import {
  Camera,
  Trash2,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-vue-next';

interface Props {
  member: Member;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'openPhotoModal'): void;
}>();

const memberAuthStore = useMemberAuthStore();
const notificationStore = useNotificationStore();

const isConfirmDeleteOpen = ref(false);
const isDeleting = ref(false);

async function handleDeletePhoto() {
  isDeleting.value = true;
  try {
    const success = await memberAuthStore.deletePhoto();
    if (success) {
      notificationStore.success('تصویر پرسنلی شما با موفقیت حذف گردید.', 'تصویر حذف شد');
    } else {
      notificationStore.error(memberAuthStore.error || 'خطا در حذف تصویر پرسنلی', 'خطا');
    }
  } finally {
    isDeleting.value = false;
    isConfirmDeleteOpen.value = false;
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6 select-none" dir="rtl">
    <!-- Main Card -->
    <div
      class="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xs"
    >
      <div class="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-slate-800 mb-6">
        <div class="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200/70 dark:border-indigo-800">
          <Camera class="w-6 h-6" />
        </div>
        <div class="text-right">
          <h3 class="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
            مدیریت و ویرایش تصویر پرسنلی
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal leading-relaxed">
            تصویر پرسنلی بر روی کارت هوشمند عضویت و پروانه فعالیت صادر شده درج خواهد شد.
          </p>
        </div>
      </div>

      <div class="flex flex-col md:flex-row items-center md:items-start gap-8">
        <!-- Photo Preview Area -->
        <div class="flex flex-col items-center gap-3 shrink-0">
          <div class="relative group">
            <MemberAvatar
              :profile-image="member.profileImage"
              :full-name="memberAuthStore.memberFullName"
              size="xl"
              shape="portrait"
              :timestamp="memberAuthStore.photoTimestamp"
              class="border-4 border-slate-100 dark:border-slate-800 shadow-xl"
            />

            <!-- Hover edit hint -->
            <button
              type="button"
              class="absolute inset-0 bg-slate-950/50 backdrop-blur-2xs rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-semibold gap-1 cursor-pointer"
              @click="emit('openPhotoModal')"
            >
              <Camera class="w-6 h-6" />
              <span>تغییر تصویر</span>
            </button>
          </div>

          <span
            v-if="member.profileImage"
            class="inline-flex items-center gap-1 text-3xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800"
          >
            <CheckCircle2 class="w-3.5 h-3.5" />
            <span>تصویر فعال در پرونده</span>
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1 text-3xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800"
          >
            <AlertCircle class="w-3.5 h-3.5" />
            <span>فاقد تصویر پرسنلی</span>
          </span>
        </div>

        <!-- Info & Actions Area -->
        <div class="flex-1 space-y-5 text-right w-full">
          <!-- Standards Checklist -->
          <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
            <div class="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Info class="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>دستورالعمل استانداردهای تصویر پرسنلی نظام صنفی:</span>
            </div>

            <ul class="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 pr-5 list-disc">
              <li>عکس تمام‌رخ با زمینه روشن، شفاف و بدون روتوش اغراق‌آمیز</li>
              <li>نسبت استاندارد پرسنلی ۳ در ۴ (۳:۴ Portrait) یا مربع (۱:۱)</li>
              <li>فرمت‌های مجاز فایل: JPG، JPEG یا PNG</li>
              <li>حداکثر حجم فایل تا ۲ مگابایت (ابزار برش خودکار تصویر را بهینه‌سازی می‌کند)</li>
              <li>دارای پوشش رسمی مطابق با استانداردهای دبیرخانه نظام صنفی</li>
            </ul>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              class="px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-600/25 transition flex items-center gap-2 cursor-pointer"
              @click="emit('openPhotoModal')"
            >
              <UploadCloud class="w-4 h-4" />
              <span>{{ member.profileImage ? 'بارگذاری و ویرایش عکس جدید' : 'بارگذاری عکس پرسنلی' }}</span>
            </button>

            <button
              v-if="member.profileImage"
              type="button"
              class="px-4 py-3 rounded-2xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
              @click="isConfirmDeleteOpen = true"
            >
              <Trash2 class="w-4 h-4" />
              <span>حذف تصویر فعلی</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Delete Dialog -->
    <ConfirmDialog
      :open="isConfirmDeleteOpen"
      title="حذف تصویر پرسنلی"
      description="آیا از حذف تصویر پرسنلی خود از سامانه نصر پلاس اطمینان دارید؟ پس از حذف، نشان اختصاری نام شما نمایش داده خواهد شد."
      confirm-text="بله، حذف شود"
      cancel-text="انصراف"
      variant="danger"
      :loading="isDeleting"
      @confirm="handleDeletePhoto"
      @cancel="isConfirmDeleteOpen = false"
    />
  </div>
</template>
