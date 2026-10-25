<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg';
  hideText?: boolean;
  title?: string;
  subtitle?: string;
  truncateSubtitle?: boolean;
}

withDefaults(defineProps<Props>(), {
  size: 'md',
  hideText: false,
  title: 'نصر پلاس',
  subtitle: 'سامانه یکپارچه خدمات الکترونیک نصر اردبیل',
  truncateSubtitle: true,
});
</script>

<template>
  <div class="inline-flex items-center gap-2.5 sm:gap-3 select-none min-w-0" dir="rtl">
    <!-- Logo Emblem (On the right) -->
    <div
      :class="[
        'bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs flex items-center justify-center shrink-0 group-hover:border-emerald-500/50 dark:group-hover:border-emerald-500/40 transition-colors',
        size === 'sm'
          ? 'w-10 h-10 rounded-xl p-1'
          : size === 'lg'
            ? 'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl p-2'
            : 'w-10 h-10 sm:w-12 sm:h-12 rounded-2xl p-1.5',
      ]"
    >
      <img
        src="/logo.png"
        alt="لوگوی نصر پلاس"
        class="h-full w-auto object-contain"
      />
    </div>

    <!-- Brand Text (On the left) -->
    <div
      v-if="!hideText"
      class="flex flex-col text-right min-w-0"
      :title="subtitle"
    >
      <!-- Top Text: نصر پلاس -->
      <span
        :class="[
          'font-black text-slate-900 dark:text-white tracking-tight truncate leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors',
          size === 'sm'
            ? 'text-sm'
            : size === 'lg'
              ? 'text-base sm:text-lg'
              : 'text-sm sm:text-base',
        ]"
      >
        {{ title }}
      </span>

      <!-- Bottom Text: سامانه یکپارچه خدمات الکترونیک نصر اردبیل -->
      <span
        :class="[
          'font-normal text-slate-500 dark:text-slate-400 leading-snug transition-colors',
          truncateSubtitle ? 'truncate' : '',
          size === 'sm' ? 'text-[11px]' : 'text-3xs sm:text-xs',
        ]"
      >
        {{ subtitle }}
      </span>
    </div>
  </div>
</template>
