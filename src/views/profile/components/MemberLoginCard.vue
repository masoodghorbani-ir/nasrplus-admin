<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMemberAuthStore } from '@/stores';
import {
  UserCheck,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
} from 'lucide-vue-next';

const router = useRouter();
const memberAuthStore = useMemberAuthStore();

const memberCodeInput = ref('');
const nationalCodeInput = ref('');
const showPassword = ref(false);
const formError = ref<string | null>(null);

async function handleLogin() {
  formError.value = null;
  const memberCode = memberCodeInput.value.trim();
  const nationalCode = nationalCodeInput.value.trim();

  if (!memberCode) {
    formError.value = 'لطفاً کد عضویت خود را وارد فرمایید';
    return;
  }
  if (!nationalCode) {
    formError.value = 'لطفاً کد ملی خود را بعنوان رمز عبور وارد فرمایید';
    return;
  }

  const success = await memberAuthStore.login(memberCode, nationalCode);
  if (!success) {
    formError.value = memberAuthStore.error || 'کد عضویت یا کد ملی وارد شده نادرست است';
  }
}

function goHome() {
  router.push('/');
}
</script>

<template>
  <div class="w-full max-w-xl mx-auto select-none" dir="rtl">
    <div
      class="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 transition-colors"
    >
      <!-- Top Emblem & Title -->
      <div class="text-center mb-8">
        <div
          class="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800/60 mx-auto flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 shadow-xs"
        >
          <UserCheck class="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <span
          class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 mb-2"
        >
          ویژه اعضای صنف رایانه‌ای
        </span>

        <h1 class="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">
          ورود به پروفایل اختصاصی اعضا
        </h1>

        <p class="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
          ورود با <span class="font-semibold text-slate-700 dark:text-slate-200">کد عضویت</span> بعنوان نام کاربری و <span class="font-semibold text-slate-700 dark:text-slate-200">کد ملی</span> بعنوان رمز عبور
        </p>
      </div>

      <!-- Error Alert -->
      <div
        v-if="formError"
        class="mb-6 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2.5 animate-in fade-in"
      >
        <AlertCircle class="w-4 h-4 shrink-0" />
        <span>{{ formError }}</span>
      </div>

      <!-- Login Form -->
      <form class="space-y-4" @submit.prevent="handleLogin">
        <!-- Field 1: Member Code (Username) -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            کد عضویت نظام صنفی (نام کاربری)
          </label>
          <div class="relative">
            <input
              v-model="memberCodeInput"
              type="text"
              placeholder="کد عضویت خود را وارد نمایید"
              dir="ltr"
              autocomplete="username"
              required
              class="w-full h-12 px-4 pl-10 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 text-sm font-semibold text-slate-800 dark:text-slate-100 transition-all text-right tabular-nums font-mono"
            />
            <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <UserCheck class="w-4 h-4" />
            </div>
          </div>
        </div>

        <!-- Field 2: National Code (Password) -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            کد ملی ۱۰ رقمی (رمز عبور)
          </label>
          <div class="relative">
            <input
              v-model="nationalCodeInput"
              :type="showPassword ? 'text' : 'password'"
              placeholder="کد ملی ۱۰ رقمی خود را وارد نمایید"
              dir="ltr"
              autocomplete="current-password"
              required
              class="w-full h-12 px-4 pl-20 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 text-sm font-semibold text-slate-800 dark:text-slate-100 transition-all text-right tabular-nums font-mono"
            />
            <div class="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <button
                type="button"
                class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                title="نمایش/عدم نمایش رمز"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
              <Lock class="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="pt-2">
          <button
            type="submit"
            :disabled="memberAuthStore.isLoading"
            class="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span
              v-if="memberAuthStore.isLoading"
              class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
            />
            <span>{{ memberAuthStore.isLoading ? 'در حال بررسی مشخصات...' : 'ورود به پروفایل' }}</span>
          </button>
        </div>
      </form>

      <!-- Bottom Navigations -->
      <div class="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center text-xs">
        <button
          type="button"
          class="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold transition flex items-center gap-1.5 cursor-pointer py-1 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          @click="goHome"
        >
          <ArrowRight class="w-3.5 h-3.5" />
          <span>بازگشت به صفحه اصلی</span>
        </button>
      </div>
    </div>
  </div>
</template>
