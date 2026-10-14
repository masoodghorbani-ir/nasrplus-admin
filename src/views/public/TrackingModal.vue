<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  X,
  Copy,
  Check,
} from 'lucide-vue-next';
import { publicApi } from '@/api';
import type { RegistrationTrackRecord } from '@/types';
import { toPersianDigits, formatPersianDate } from '@/utils/formatters';

interface Props {
  open: boolean;
  initialCode?: string;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  initialCode: '',
});

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
}>();

const searchQuery = ref('');
const isLoading = ref(false);
const record = ref<RegistrationTrackRecord | null>(null);
const searchPerformed = ref(false);
const errorMsg = ref('');
const isCopied = ref(false);

watch(
  () => props.open,
  (val) => {
    if (val) {
      if (props.initialCode) {
        searchQuery.value = props.initialCode;
        handleSearch();
      } else {
        searchQuery.value = '';
        record.value = null;
        searchPerformed.value = false;
        errorMsg.value = '';
      }
    }
  }
);

async function handleSearch() {
  const query = searchQuery.value.trim();
  if (!query) {
    errorMsg.value = 'لطفاً کد رهگیری یا کد ملی را وارد فرمایید.';
    return;
  }

  isLoading.value = true;
  errorMsg.value = '';
  searchPerformed.value = true;

  try {
    const res = await publicApi.trackRegistration(query);
    record.value = res;
    if (!res) {
      errorMsg.value = 'پرونده‌ای با کد رهگیری یا کد ملی وارد شده یافت نشد. لطفاً دقت فرمایید.';
    }
  } catch (err: any) {
    errorMsg.value = err.message || 'خطا در برقراری ارتباط با سامانه استعلام.';
  } finally {
    isLoading.value = false;
  }
}

function copyCode(code: string) {
  navigator.clipboard.writeText(code);
  isCopied.value = true;
  setTimeout(() => {
    isCopied.value = false;
  }, 2000);
}

function close() {
  emit('update:open', false);
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
    dir="rtl"
  >
    <div
      class="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all"
    >
      <!-- Modal Header -->
      <div class="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div class="flex items-center gap-2.5 sm:gap-3">
          <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
            <Search class="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 class="font-extrabold text-sm sm:text-lg text-slate-900 dark:text-white">
              استعلام و پیگیری وضعیت پرونده
            </h3>
            <p class="text-3xs sm:text-xs text-slate-500 dark:text-slate-400">
              مشاهده روند بررسی پرونده عضویت با کد رهگیری یا کد ملی
            </p>
          </div>
        </div>
        <button
          type="button"
          class="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          @click="close"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-4 sm:p-6 space-y-5 sm:space-y-6 max-h-[80vh] overflow-y-auto">
        <!-- Search Input -->
        <form @submit.prevent="handleSearch" class="relative">
          <div class="flex gap-2">
            <div class="relative flex-1">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="کد رهگیری یا کد ملی..."
                class="w-full h-11 sm:h-12 pr-3.5 pl-10 text-base sm:text-sm rounded-xl sm:rounded-2xl bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900 dark:text-white transition-all"
                dir="ltr"
              />
              <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <button
              type="submit"
              :disabled="isLoading"
              class="h-11 sm:h-12 px-4 sm:px-5 rounded-xl sm:rounded-2xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <span v-if="!isLoading">استعلام</span>
              <span v-else>بررسی...</span>
            </button>
          </div>
          <p v-if="errorMsg" class="mt-2 text-2xs sm:text-xs text-rose-500 font-bold">
            {{ errorMsg }}
          </p>
        </form>

        <!-- Search Result Details -->
        <div v-if="record" class="space-y-5 sm:space-y-6">
          <!-- Summary Header Card -->
          <div class="p-4 sm:p-5 rounded-2xl bg-brand-50/70 dark:bg-brand-950/30 border border-brand-200/60 dark:border-brand-800/40">
            <div class="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-brand-200/40 dark:border-brand-800/40">
              <div>
                <span class="text-3xs sm:text-xs text-brand-800 dark:text-brand-300 font-bold">کد رهگیری:</span>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white font-mono" dir="ltr">
                    {{ record.trackingCode }}
                  </span>
                  <button
                    type="button"
                    class="p-1 text-brand-600 dark:text-brand-400 hover:bg-brand-100/60 dark:hover:bg-brand-900/50 rounded-lg transition-colors cursor-pointer"
                    title="کپی کد رهگیری"
                    @click="copyCode(record.trackingCode)"
                  >
                    <Check v-if="isCopied" class="w-4 h-4 text-emerald-600" />
                    <Copy v-else class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div class="text-left">
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-3xs sm:text-xs font-bold"
                  :class="[
                    record.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : record.status === 'UNDER_REVIEW'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
                  ]"
                >
                  <Clock class="w-3 h-3 ml-1" />
                  {{ record.statusLabel }}
                </span>
              </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-3 text-3xs sm:text-xs">
              <div>
                <span class="text-slate-500 dark:text-slate-400 block">نام متقاضی / شرکت:</span>
                <span class="font-bold text-slate-800 dark:text-slate-100 mt-0.5 block truncate">
                  {{ record.companyName ? `${record.companyName} (${record.fullName})` : record.fullName }}
                </span>
              </div>
              <div>
                <span class="text-slate-500 dark:text-slate-400 block">نوع عضویت:</span>
                <span class="font-bold text-slate-800 dark:text-slate-100 mt-0.5 block">
                  {{ record.kind === 'REAL' ? 'حقیقی (کارشناس / مشاور)' : 'حقوقی (شرکت)' }}
                </span>
              </div>
              <div>
                <span class="text-slate-500 dark:text-slate-400 block">رسته تخصصی:</span>
                <span class="font-bold text-slate-800 dark:text-slate-100 mt-0.5 block truncate">
                  {{ record.specialization }}
                </span>
              </div>
              <div>
                <span class="text-slate-500 dark:text-slate-400 block">استان نظام صنفی:</span>
                <span class="font-bold text-slate-800 dark:text-slate-100 mt-0.5 block">
                  {{ record.province }}
                </span>
              </div>
              <div>
                <span class="text-slate-500 dark:text-slate-400 block">کد ملی:</span>
                <span class="font-bold text-slate-800 dark:text-slate-100 mt-0.5 block">
                  {{ toPersianDigits(record.nationalCode) }}
                </span>
              </div>
              <div>
                <span class="text-slate-500 dark:text-slate-400 block">تاریخ ثبت:</span>
                <span class="font-bold text-slate-800 dark:text-slate-100 mt-0.5 block">
                  {{ formatPersianDate(record.submittedAt) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Timeline -->
          <div>
            <h4 class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
              مراحل طی شده و وضعیت فعلی پرونده
            </h4>
            <div class="relative pl-2 pr-6 space-y-6 before:absolute before:right-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              <div
                v-for="(step, idx) in record.stepsTimeline"
                :key="idx"
                class="relative flex items-start gap-4"
              >
                <!-- Dot icon -->
                <div
                  class="absolute -right-6 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900"
                  :class="[
                    step.completed
                      ? 'bg-emerald-500 text-white'
                      : step.active
                      ? 'bg-brand-600 text-white animate-pulse'
                      : 'bg-slate-300 dark:bg-slate-700 text-slate-500',
                  ]"
                >
                  <CheckCircle2 v-if="step.completed" class="w-3.5 h-3.5" />
                  <Clock v-else-if="step.active" class="w-3 h-3" />
                  <div v-else class="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600" />
                </div>

                <div class="flex-1">
                  <div class="flex items-center justify-between">
                    <h5
                      class="text-sm font-bold"
                      :class="step.active ? 'text-brand-600 dark:text-brand-400 font-extrabold' : 'text-slate-800 dark:text-slate-200'"
                    >
                      {{ step.title }}
                    </h5>
                    <span v-if="step.date" class="text-2xs text-slate-400">
                      {{ formatPersianDate(step.date) }}
                    </span>
                  </div>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {{ step.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Reviewer Note if any -->
          <div
            v-if="record.reviewNotes"
            class="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3 text-xs"
          >
            <AlertCircle class="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span class="font-bold text-amber-800 dark:text-amber-300 block mb-0.5">یادداشت دبیرخانه استانی:</span>
              <p class="text-amber-700 dark:text-amber-400/90 leading-relaxed">
                {{ record.reviewNotes }}
              </p>
            </div>
          </div>
        </div>

        <!-- Initial Placeholder if no search yet -->
        <div v-else-if="!searchPerformed" class="text-center py-8">
          <div class="w-14 h-14 mx-auto rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <FileText class="w-7 h-7" />
          </div>
          <p class="text-sm font-bold text-slate-700 dark:text-slate-300">
            برای استعلام، کد رهگیری ثبت‌نام یا کد ملی را وارد نمایید
          </p>
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            کد رهگیری پس از اتمام فرآیند ثبت‌نام آنلاین به شما اختصاص یافته و پیامک شده است.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-900/50">
        <button
          type="button"
          class="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          @click="close"
        >
          بستن پنجره
        </button>
      </div>
    </div>
  </div>
</template>
