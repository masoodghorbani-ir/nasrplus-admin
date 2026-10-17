<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ArrowRight, FileSpreadsheet } from 'lucide-vue-next';
import { Button } from '@/components/ui';
import MemberImportWizard from './MemberImportWizard.vue';
import type { IImportExecutionResponse } from '@/types';

const router = useRouter();

function handleBack() {
  router.push('/admin/members');
}

function handleImported(_result: IImportExecutionResponse) {
  // Can either navigate back or let user inspect result
}
</script>

<template>
  <div class="space-y-6 text-right select-none" dir="rtl">
    <!-- Header with Back Button and Breadcrumb -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
      <div>
        <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
          <router-link to="/admin/dashboard" class="hover:text-brand-600 transition-colors">
            داشبورد
          </router-link>
          <span>/</span>
          <router-link to="/admin/members" class="hover:text-brand-600 transition-colors">
            مدیریت اعضا
          </router-link>
          <span>/</span>
          <span class="text-slate-800 dark:text-slate-200 font-medium">ورود از اکسل</span>
        </div>

        <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
          <FileSpreadsheet class="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          ورود دسته‌جمعی اعضا از فایل اکسل
        </h1>
        <p class="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          فرآیند ۳ مرحله‌ای بارگذاری، نگاشت فیلدها و ثبت هوشمند اعضای صنف در سامانه نصر پلاس
        </p>
      </div>

      <div>
        <Button
          variant="outline"
          size="sm"
          @click="handleBack"
        >
          <ArrowRight class="w-4 h-4 ml-1.5" />
          بازگشت به فهرست اعضا
        </Button>
      </div>
    </div>

    <!-- Main Wizard Card -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
      <MemberImportWizard
        :is-modal="false"
        @close="handleBack"
        @imported="handleImported"
      />
    </div>
  </div>
</template>
