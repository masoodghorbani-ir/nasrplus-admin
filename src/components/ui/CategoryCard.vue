<script setup lang="ts">
import { computed, type Component } from 'vue';
import { ArrowLeft } from 'lucide-vue-next';
import { toPersianDigits } from '@/utils/formatters';

export type CategoryColor =
  | 'emerald'
  | 'cyan'
  | 'amber'
  | 'purple'
  | 'blue'
  | 'indigo'
  | 'rose'
  | 'orange'
  | 'teal';

interface Props {
  title: string;
  description: string;
  icon: Component;
  count?: number | string;
  countLabel?: string;
  color?: CategoryColor;
  badge?: string;
  clickable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  count: undefined,
  countLabel: 'رکورد تعریف شده',
  color: 'emerald',
  badge: undefined,
  clickable: true,
});

defineEmits<{
  (e: 'click'): void;
}>();

const colorStyles = computed(() => {
  switch (props.color) {
    case 'cyan':
      return {
        topBar: 'bg-cyan-500',
        iconBg: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400 border-cyan-100 dark:border-cyan-900/40',
        hoverText: 'group-hover:text-cyan-600 dark:group-hover:text-cyan-400',
      };
    case 'amber':
      return {
        topBar: 'bg-amber-500',
        iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-100 dark:border-amber-900/40',
        hoverText: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
      };
    case 'purple':
      return {
        topBar: 'bg-purple-500',
        iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border-purple-100 dark:border-purple-900/40',
        hoverText: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
      };
    case 'blue':
      return {
        topBar: 'bg-blue-500',
        iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border-blue-100 dark:border-blue-900/40',
        hoverText: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
      };
    case 'indigo':
      return {
        topBar: 'bg-indigo-500',
        iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40',
        hoverText: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
      };
    case 'rose':
      return {
        topBar: 'bg-rose-500',
        iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border-rose-100 dark:border-rose-900/40',
        hoverText: 'group-hover:text-rose-600 dark:group-hover:text-rose-400',
      };
    case 'orange':
      return {
        topBar: 'bg-orange-500',
        iconBg: 'bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400 border-orange-100 dark:border-orange-900/40',
        hoverText: 'group-hover:text-orange-600 dark:group-hover:text-orange-400',
      };
    case 'teal':
      return {
        topBar: 'bg-teal-500',
        iconBg: 'bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400 border-teal-100 dark:border-teal-900/40',
        hoverText: 'group-hover:text-teal-600 dark:group-hover:text-teal-400',
      };
    case 'emerald':
    default:
      return {
        topBar: 'bg-emerald-500',
        iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40',
        hoverText: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
      };
  }
});
</script>

<template>
  <div
    :class="[
      'group relative bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-all duration-200 select-none overflow-hidden flex flex-col justify-between text-right',
      clickable
        ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 dark:hover:border-slate-700'
        : '',
    ]"
    @click="clickable && $emit('click')"
  >
    <!-- Top Accent Colored Stripe -->
    <div
      class="absolute top-0 inset-x-0 h-1 transition-colors"
      :class="colorStyles.topBar"
    />

    <div>
      <!-- Top Row: Arrow Button (left) and Icon Squircle (right) in RTL -->
      <div class="flex items-start justify-between gap-3">
        <!-- Icon Container (Right in RTL) -->
        <div
          :class="[
            'w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-105 shrink-0 shadow-xs',
            colorStyles.iconBg,
          ]"
        >
          <component :is="icon" class="w-5 h-5 sm:w-6 sm:h-6" />
        </div>

        <!-- Arrow Indicator (Left in RTL) -->
        <div
          v-if="clickable"
          class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-100 group-hover:bg-slate-100 dark:group-hover:bg-slate-800 transition-all duration-200 group-hover:-translate-x-1 shrink-0"
        >
          <ArrowLeft class="w-4 h-4" />
        </div>
      </div>

      <!-- Title & Description -->
      <div class="mt-4">
        <div class="flex items-center gap-2">
          <h3
            :class="[
              'text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight transition-colors',
              colorStyles.hoverText,
            ]"
          >
            {{ title }}
          </h3>
          <span
            v-if="badge"
            class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 border border-brand-100 dark:border-brand-900/30"
          >
            {{ badge }}
          </span>
        </div>

        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
          {{ description }}
        </p>
      </div>
    </div>

    <!-- Bottom Row: Count / Details / Action -->
    <div class="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
      <div v-if="count !== undefined" class="text-slate-500 dark:text-slate-400 text-xs">
        <span class="font-bold tabular-nums text-slate-700 dark:text-slate-300">
          {{ toPersianDigits(count) }}
        </span>
        <span class="mr-1 text-[11px] text-slate-400 dark:text-slate-500">{{ countLabel }}</span>
      </div>
      <div v-else />

      <div
        v-if="clickable"
        :class="[
          'inline-flex items-center gap-1 text-xs font-bold transition-all duration-200 opacity-80 group-hover:opacity-100',
          colorStyles.hoverText,
        ]"
      >
        <span>مدیریت</span>
        <ArrowLeft class="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
      </div>
    </div>
  </div>
</template>
