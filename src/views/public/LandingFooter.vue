<script setup lang="ts">
import { Phone, ShieldCheck } from 'lucide-vue-next';
</script>

<template>
  <footer class="w-full border-t border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs py-6 mt-12 transition-colors" dir="rtl">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
      <!-- Right info -->
      <div class="flex items-center gap-2">
        <ShieldCheck class="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
        <span class="font-bold text-slate-700 dark:text-slate-300">
          سامانه رسمی ثبت‌نام سازمان نظام صنفی رایانه‌ای اردبیل
        </span>
      </div>

      <!-- Center / Left info -->
      <div class="flex items-center gap-4 text-2xs sm:text-xs">
        <div class="flex items-center gap-1.5 font-mono" dir="ltr">
          <Phone class="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span>۰۴۵-۳۳۲۵۰۰۰۰</span>
        </div>
        <span class="text-slate-300 dark:text-slate-700">&bull;</span>
        <span>کلیه حقوق محفوظ است</span>
      </div>
    </div>
  </footer>
</template>
