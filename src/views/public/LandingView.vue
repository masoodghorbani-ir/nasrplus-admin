<script setup lang="ts">
import { ref } from 'vue';
import { Search, ShieldCheck } from 'lucide-vue-next';
import LandingNavbar from './LandingNavbar.vue';
import LandingFooter from './LandingFooter.vue';
import RegistrationWizard from './RegistrationWizard.vue';
import TrackingModal from './TrackingModal.vue';

const isTrackingModalOpen = ref(false);
const activeTrackingCode = ref('');

function openTrackingModal(code?: string) {
  if (code) activeTrackingCode.value = code;
  isTrackingModalOpen.value = true;
}

function handleRegistrationCompleted(code: string) {
  activeTrackingCode.value = code;
}
</script>

<template>
  <div class="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 antialiased selection:bg-brand-500 selection:text-white relative" dir="rtl">
    <!-- Navbar -->
    <LandingNavbar
      @open-tracking="openTrackingModal"
    />

    <!-- Main Container -->
    <main class="flex-1 py-6 sm:py-10 px-3.5 sm:px-6 relative z-10 flex flex-col items-center">
      <!-- Subtle Ambient Background Accents -->
      <div class="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-gradient-to-b from-brand-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />

      <div class="w-full max-w-3xl space-y-5 sm:space-y-8">
        <!-- Compact Page Header -->
        <div class="text-center space-y-2">
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <ShieldCheck class="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
            <span class="text-3xs sm:text-2xs font-extrabold text-slate-700 dark:text-slate-300">
              سازمان نظام صنفی رایانه‌ای اردبیل
            </span>
          </div>

          <h1 class="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            ثبت‌نام آنلاین متقاضیان عضویت
          </h1>

          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed px-1">
            جهت استفاده از خدمات نصر پلاس (اشخاص حقیقی و حقوقی)، مشخصات خود را در فرم زیر وارد نمایید.
          </p>
        </div>

        <!-- Registration Wizard Card -->
        <RegistrationWizard
          @completed="handleRegistrationCompleted"
        />

        <!-- Secondary Tracking Box -->
        <div class="p-3.5 sm:p-4 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right shadow-2xs">
          <div>
            <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200">
              قبلاً ثبت‌نام کرده‌اید و قصد پیگیری پرونده را دارید؟
            </h4>
            <p class="text-2xs text-slate-400 dark:text-slate-500 mt-0.5">
              با وارد کردن کد رهگیری یا کد ملی، وضعیت بررسی پرونده خود را استعلام نمایید.
            </p>
          </div>

          <button
            type="button"
            class="w-full sm:w-auto h-9 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
            @click="openTrackingModal()"
          >
            <Search class="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>پیگیری وضعیت پرونده</span>
          </button>
        </div>
      </div>
    </main>

    <!-- Clean Minimal Footer -->
    <LandingFooter />

    <!-- Tracking Modal -->
    <TrackingModal
      v-model:open="isTrackingModalOpen"
      :initial-code="activeTrackingCode"
    />
  </div>
</template>
