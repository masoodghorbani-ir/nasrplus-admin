<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore, useNotificationStore } from '@/stores';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-vue-next';
import { Button, Input } from '@/components/ui';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const username = ref('');
const password = ref('');
const showPassword = ref(false);
const rememberMe = ref(true);

const usernameError = ref('');
const passwordError = ref('');

async function handleLogin() {
  usernameError.value = '';
  passwordError.value = '';

  let valid = true;
  if (!username.value.trim()) {
    usernameError.value = 'لطفاً نام کاربری یا ایمیل را وارد کنید';
    valid = false;
  }
  if (!password.value) {
    passwordError.value = 'لطفاً کلمه عبور را وارد کنید';
    valid = false;
  }

  if (!valid) return;

  const success = await authStore.login({
    username: username.value.trim(),
    password: password.value,
  });

  if (success) {
    notificationStore.success(
      `خوش آمدید، ${authStore.user?.fullName || 'مدیر گرامی'}`,
      'ورود موفقیت‌آمیز'
    );
    const redirect = (route.query.redirect as string) || '/dashboard';
    router.push(redirect);
  } else {
    notificationStore.error(authStore.error || 'اطلاعات ورود نامعتبر است');
  }
}
</script>

<template>
  <div class="w-full max-w-md mx-auto" dir="rtl">
    <!-- Card Container -->
    <div
      class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none"
    >
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-600/30 mb-4">
          <svg
            class="w-8 h-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>

        <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          ورود به پنل مدیریت نصر پلاس
        </h1>
        <p class="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          سامانه اعضای سازمان نظام صنفی رایانه‌ای کشور
        </p>
      </div>

      <!-- Login Form -->
      <form class="space-y-4" @submit.prevent="handleLogin">
        <!-- Username / Email -->
        <Input
          v-model="username"
          label="نام کاربری یا ایمیل مدیر"
          placeholder="مثال: superadmin@nasrplus.ir"
          dir="ltr"
          :error="usernameError"
          required
        >
          <template #prefix>
            <Mail class="w-4 h-4" />
          </template>
        </Input>

        <!-- Password -->
        <Input
          v-model="password"
          label="رمز عبور"
          :type="showPassword ? 'text' : 'password'"
          placeholder="••••••••"
          dir="ltr"
          :error="passwordError"
          required
        >
          <template #prefix>
            <Lock class="w-4 h-4" />
          </template>
          <template #suffix>
            <button
              type="button"
              class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              tabindex="-1"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" class="w-4 h-4" />
              <Eye v-else class="w-4 h-4" />
            </button>
          </template>
        </Input>

        <!-- Options: Remember me -->
        <div class="flex items-center text-xs pt-1">
          <label class="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
            <input
              v-model="rememberMe"
              type="checkbox"
              class="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
            />
            مرا به خاطر بسپار
          </label>
        </div>

        <!-- Submit Button -->
        <div class="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            block
            :loading="authStore.isLoading"
          >
            ورود به پنل مدیریت
          </Button>
        </div>
      </form>

      <!-- Footer notice -->
      <div class="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500">
        سامانه جامع مدیریت اعضای سازمان نظام صنفی رایانه‌ای کشور
      </div>
    </div>
  </div>
</template>
