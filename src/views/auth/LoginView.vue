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
      <!-- Header with public logos -->
      <div class="text-center mb-8">
        <div class="w-20 h-20 mx-auto rounded-3xl bg-slate-50 dark:bg-slate-800 p-2.5 border border-slate-200 dark:border-slate-700 shadow-md mb-4 flex items-center justify-center">
          <img
            src="/logo.png"
            alt="لوگوی نظام صنفی رایانه‌ای"
            class="w-full h-full object-contain"
          />
        </div>

        <h1 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          ورود به پنل مدیریت نصر پلاس
        </h1>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
          سامانه اختصاصی مدیران و کارشناسان دبیرخانه
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

      <!-- Link to Public Registration Landing -->
      <div class="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
        <div class="p-3.5 rounded-2xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200/70 dark:border-brand-800/50 text-center">
          <p class="text-xs text-brand-900 dark:text-brand-300 font-bold mb-1.5">
            متقاضی عضویت در نظام صنفی هستید؟
          </p>
          <router-link
            to="/register"
            class="inline-flex items-center gap-1.5 text-xs font-black text-brand-700 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 underline underline-offset-4 transition-colors"
          >
            <span>ورود به لندینگ و فرم ثبت‌نام آنلاین اعضا (حقیقی و حقوقی)</span>
            <span dir="ltr">&larr;</span>
          </router-link>
        </div>
      </div>

      <!-- Footer notice -->
      <div class="mt-4 text-center text-3xs text-slate-400 dark:text-slate-500">
        سامانه جامع مدیریت اعضای سازمان نظام صنفی رایانه‌ای کشور
      </div>
    </div>
  </div>
</template>
