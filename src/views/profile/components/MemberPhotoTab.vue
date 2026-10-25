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
} from 'lucide-vue-next';

interface Props {
  member: Member;
}

defineProps<Props>();

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
  <div class="mx-auto max-w-3xl space-y-5 select-none" dir="rtl">
    <header class="space-y-1">
      <h2 class="portal-section-title text-base">تصویر پرسنلی</h2>
      <p class="portal-muted leading-relaxed">
        این تصویر روی کارت هوشمند عضویت و پروانه فعالیت درج می‌شود.
      </p>
    </header>

    <section class="portal-panel p-5 sm:p-6">
      <div class="flex flex-col items-start gap-6 md:flex-row">
        <div class="mx-auto flex shrink-0 flex-col items-center gap-3 md:mx-0">
          <div class="relative group">
            <MemberAvatar
              :profile-image="member.profileImage"
              :full-name="memberAuthStore.memberFullName"
              size="xl"
              shape="portrait"
              :timestamp="memberAuthStore.photoTimestamp"
              class="border border-slate-200 dark:border-slate-700"
            />
            <button
              type="button"
              class="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl bg-slate-950/50 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
              @click="emit('openPhotoModal')"
            >
              <Camera class="h-5 w-5" />
              <span>تغییر تصویر</span>
            </button>
          </div>

          <span
            v-if="member.profileImage"
            class="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400"
          >
            <CheckCircle2 class="h-3.5 w-3.5" />
            تصویر فعال
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400"
          >
            <AlertCircle class="h-3.5 w-3.5" />
            فاقد تصویر
          </span>
        </div>

        <div class="w-full flex-1 space-y-5">
          <div class="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <p class="mb-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
              استانداردهای تصویر پرسنلی
            </p>
            <ul class="list-disc space-y-1.5 pr-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              <li>عکس تمام‌رخ با زمینه روشن و بدون روتوش اغراق‌آمیز</li>
              <li>نسبت پرسنلی ۳:۴ یا مربع ۱:۱</li>
              <li>فرمت‌های مجاز: JPG، JPEG یا PNG</li>
              <li>حداکثر حجم ۲ مگابایت</li>
              <li>پوشش رسمی مطابق استاندارد دبیرخانه</li>
            </ul>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 text-xs font-medium text-white transition hover:bg-brand-700"
              @click="emit('openPhotoModal')"
            >
              <UploadCloud class="h-4 w-4" />
              <span>{{ member.profileImage ? 'ویرایش عکس' : 'بارگذاری عکس' }}</span>
            </button>

            <button
              v-if="member.profileImage"
              type="button"
              class="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50 dark:border-slate-700 dark:text-rose-400 dark:hover:bg-rose-950/30"
              @click="isConfirmDeleteOpen = true"
            >
              <Trash2 class="h-4 w-4" />
              <span>حذف تصویر</span>
            </button>
          </div>
        </div>
      </div>
    </section>

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
