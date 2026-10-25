<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMemberAuthStore } from '@/stores';
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Hash,
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
  <div class="mx-auto w-full max-w-md select-none" dir="rtl">
    <div class="portal-panel p-6 sm:p-8">
      <div class="mb-6 space-y-2 text-center">
        <h1 class="text-lg font-semibold text-slate-900 dark:text-slate-50 sm:text-xl">
          ورود به پروفایل اعضا
        </h1>
        <p class="text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm">
          با
          <span class="font-medium text-slate-700 dark:text-slate-200">کد عضویت</span>
          و
          <span class="font-medium text-slate-700 dark:text-slate-200">کد ملی</span>
          وارد شوید
        </p>
      </div>

      <div
        v-if="formError"
        class="mb-5 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-400"
        role="alert"
      >
        <AlertCircle class="h-4 w-4 shrink-0" />
        <span>{{ formError }}</span>
      </div>

      <form class="space-y-4" @submit.prevent="handleLogin">
        <div class="space-y-1.5">
          <label class="portal-label block" for="member-code">
            کد عضویت (نام کاربری)
          </label>
          <div class="relative">
            <input
              id="member-code"
              v-model="memberCodeInput"
              type="text"
              placeholder="کد عضویت"
              dir="ltr"
              autocomplete="username"
              required
              class="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 pl-10 text-right text-sm tabular-nums text-slate-800 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 font-mono"
            />
            <Hash class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="portal-label block" for="national-code">
            کد ملی (رمز عبور)
          </label>
          <div class="relative">
            <input
              id="national-code"
              v-model="nationalCodeInput"
              :type="showPassword ? 'text' : 'password'"
              placeholder="کد ملی ۱۰ رقمی"
              dir="ltr"
              autocomplete="current-password"
              required
              class="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 pl-20 text-right text-sm tabular-nums text-slate-800 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 font-mono"
            />
            <div class="absolute left-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
              <button
                type="button"
                class="cursor-pointer p-1 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-300"
                title="نمایش/عدم نمایش رمز"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
              <Lock class="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>

        <button
          type="submit"
          :disabled="memberAuthStore.isLoading"
          class="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span
            v-if="memberAuthStore.isLoading"
            class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
          />
          <span>{{ memberAuthStore.isLoading ? 'در حال بررسی…' : 'ورود' }}</span>
        </button>
      </form>

      <div class="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
        <button
          type="button"
          class="mx-auto flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          @click="goHome"
        >
          <ArrowRight class="h-3.5 w-3.5" />
          <span>بازگشت به صفحه اصلی</span>
        </button>
      </div>
    </div>
  </div>
</template>
