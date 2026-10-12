<script setup lang="ts">
import { computed } from 'vue';
import { Loader2 } from 'lucide-vue-next';

interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  block?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  type: 'button',
  block: false,
});

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 focus-visible:ring-brand-500 shadow-sm shadow-brand-600/20';
    case 'secondary':
      return 'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:active:bg-slate-600';
    case 'outline':
      return 'border border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800/60 dark:active:bg-slate-800';
    case 'ghost':
      return 'text-slate-700 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 dark:active:bg-slate-700';
    case 'danger':
      return 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus-visible:ring-rose-500 shadow-sm shadow-rose-600/20';
    default:
      return '';
  }
});

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-8 px-3 text-xs gap-1.5 rounded-lg';
    case 'md':
      return 'h-9 px-4 text-sm gap-2 rounded-lg';
    case 'lg':
      return 'h-11 px-5 text-base gap-2.5 rounded-xl';
    case 'icon':
      return 'h-9 w-9 p-0 rounded-lg justify-center';
    default:
      return '';
  }
});
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer select-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      variantClasses,
      sizeClasses,
      block ? 'w-full' : '',
    ]"
  >
    <Loader2 v-if="loading" class="w-4 h-4 animate-spin shrink-0" />
    <slot />
  </button>
</template>
