<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?: 'default' | 'brand' | 'emerald' | 'amber' | 'rose' | 'blue' | 'purple';
  size?: 'sm' | 'md';
  dot?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'sm',
  dot: false,
});

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'brand':
      return 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-800';
    case 'emerald':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
    case 'amber':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    case 'rose':
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
    case 'blue':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
    case 'purple':
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  }
});

const dotColorClass = computed(() => {
  switch (props.variant) {
    case 'brand':
      return 'bg-brand-500';
    case 'emerald':
      return 'bg-emerald-500';
    case 'amber':
      return 'bg-amber-500';
    case 'rose':
      return 'bg-rose-500';
    case 'blue':
      return 'bg-blue-500';
    case 'purple':
      return 'bg-purple-500';
    default:
      return 'bg-slate-400';
  }
});
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 font-medium border rounded-full select-none',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
      variantClasses,
    ]"
  >
    <span v-if="dot" :class="['w-1.5 h-1.5 rounded-full shrink-0', dotColorClass]" />
    <slot />
  </span>
</template>
