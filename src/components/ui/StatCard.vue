<script setup lang="ts">
import type { Component } from 'vue';
import { TrendingUp, TrendingDown } from 'lucide-vue-next';
import { toPersianDigits } from '@/utils/formatters';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
  icon?: Component;
  iconBg?: string;
  iconColor?: string;
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  iconBg: 'bg-brand-50 dark:bg-brand-950/40',
  iconColor: 'text-brand-600 dark:text-brand-400',
  loading: false,
});
</script>

<template>
  <div
    class="relative p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-all hover:border-slate-300 dark:hover:border-slate-700"
    dir="rtl"
  >
    <div class="flex items-start justify-between">
      <div class="text-right">
        <span class="text-xs font-medium text-slate-500 dark:text-slate-400">
          {{ title }}
        </span>

        <div class="mt-2 flex items-baseline gap-2">
          <div v-if="loading" class="h-8 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
          <h3 v-else class="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-sans">
            {{ toPersianDigits(value) }}
          </h3>
        </div>
      </div>

      <div
        v-if="icon"
        :class="['p-3 rounded-xl shrink-0', iconBg, iconColor]"
      >
        <component :is="icon" class="w-5 h-5" />
      </div>
    </div>

    <!-- Trend / Subtitle footer -->
    <div
      v-if="trend || subtitle"
      class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs"
    >
      <div v-if="trend" class="flex items-center gap-1 font-medium">
        <span
          :class="[
            'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-semibold text-[11px]',
            trend.isPositive
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400',
          ]"
        >
          <component
            :is="trend.isPositive ? TrendingUp : TrendingDown"
            class="w-3 h-3"
          />
          {{ toPersianDigits(trend.value) }}%
        </span>
        <span class="text-slate-400 dark:text-slate-500 mr-1">نسبت به ماه قبل</span>
      </div>

      <span v-if="subtitle" class="text-slate-500 dark:text-slate-400 mr-auto">
        {{ subtitle }}
      </span>
    </div>
  </div>
</template>
