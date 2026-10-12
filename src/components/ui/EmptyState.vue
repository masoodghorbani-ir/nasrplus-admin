<script setup lang="ts">
import type { Component } from 'vue';
import { Inbox } from 'lucide-vue-next';

interface Props {
  title?: string;
  description?: string;
  icon?: Component;
}

withDefaults(defineProps<Props>(), {
  title: 'هیچ داده‌ای یافت نشد',
  description: 'موردی برای نمایش در این بخش وجود ندارد.',
  icon: Inbox,
});
</script>

<template>
  <div
    class="flex flex-col items-center justify-center p-8 sm:p-12 text-center"
    dir="rtl"
  >
    <div class="p-4 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl mb-4">
      <component :is="icon" class="w-8 h-8" />
    </div>

    <h4 class="text-sm font-bold text-slate-800 dark:text-slate-200">
      {{ title }}
    </h4>

    <p class="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
      {{ description }}
    </p>

    <div v-if="$slots.action" class="mt-5">
      <slot name="action" />
    </div>
  </div>
</template>
