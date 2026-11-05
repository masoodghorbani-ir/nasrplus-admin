<script setup lang="ts">
import { memberPortalApi } from '@/api';
import ChangePasswordForm from '@/components/auth/ChangePasswordForm.vue';
</script>

<template>
  <div class="space-y-5" dir="rtl">
    <header class="space-y-1">
      <h2 class="portal-section-title text-base">تغییر رمز عبور</h2>
      <p class="portal-muted leading-relaxed">
        رمز ورود به پروفایل عضویت را به‌روز کنید. پس از تغییر، ورود بعدی با رمز جدید انجام می‌شود.
      </p>
    </header>

    <section class="portal-panel max-w-lg p-5 sm:p-6">
      <ChangePasswordForm
        :submit="memberPortalApi.changePassword"
        hint="اگر تاکنون رمز جداگانه‌ای تعیین نکرده‌اید، کد ملی فعلی همان رمز عبور شماست."
      />
    </section>
  </div>
</template>
