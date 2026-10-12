<script setup lang="ts">
import { computed } from 'vue';
import { ChevronRight, ChevronLeft } from 'lucide-vue-next';
import { toPersianDigits } from '@/utils/formatters';

interface Props {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
}

const props = withDefaults(defineProps<Props>(), {
  totalPages: 1,
});

const emit = defineEmits<{
  (e: 'update:page', page: number): void;
  (e: 'update:limit', limit: number): void;
  (e: 'change', page: number): void;
}>();

const calculatedTotalPages = computed(() => {
  if (props.totalPages && props.totalPages > 0) return props.totalPages;
  return Math.max(1, Math.ceil(props.total / props.limit));
});

const fromRecord = computed(() => {
  if (props.total === 0) return 0;
  return (props.page - 1) * props.limit + 1;
});

const toRecord = computed(() => {
  return Math.min(props.page * props.limit, props.total);
});

function goToPage(p: number) {
  if (p < 1 || p > calculatedTotalPages.value || p === props.page) return;
  emit('update:page', p);
  emit('change', p);
}

function handleLimitChange(e: Event) {
  const target = e.target as HTMLSelectElement;
  const newLimit = parseInt(target.value, 10);
  emit('update:limit', newLimit);
  emit('update:page', 1);
  emit('change', 1);
}

const displayedPages = computed(() => {
  const total = calculatedTotalPages.value;
  const current = props.page;
  const delta = 2;
  const range: (number | string)[] = [];

  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i);
  }

  if (current - delta > 2) {
    range.unshift('...');
  }
  range.unshift(1);

  if (current + delta < total - 1) {
    range.push('...');
  }
  if (total > 1) {
    range.push(total);
  }

  return range;
});
</script>

<template>
  <div
    class="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400"
    dir="rtl"
  >
    <!-- Record count info & limit selector -->
    <div class="flex items-center gap-3">
      <span>
        نمایش
        <strong class="font-semibold text-slate-800 dark:text-slate-200">
          {{ toPersianDigits(fromRecord) }}
        </strong>
        تا
        <strong class="font-semibold text-slate-800 dark:text-slate-200">
          {{ toPersianDigits(toRecord) }}
        </strong>
        از مجموع
        <strong class="font-semibold text-slate-800 dark:text-slate-200">
          {{ toPersianDigits(total) }}
        </strong>
        مورد
      </span>

      <div class="flex items-center gap-1.5 mr-2">
        <label for="limit-select" class="text-xs">تعداد در صفحه:</label>
        <select
          id="limit-select"
          :value="limit"
          class="h-7 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
          @change="handleLimitChange"
        >
          <option :value="10">{{ toPersianDigits(10) }}</option>
          <option :value="20">{{ toPersianDigits(20) }}</option>
          <option :value="50">{{ toPersianDigits(50) }}</option>
          <option :value="100">{{ toPersianDigits(100) }}</option>
        </select>
      </div>
    </div>

    <!-- Page navigation buttons -->
    <div class="flex items-center gap-1">
      <!-- Previous page (in RTL, previous is right arrow) -->
      <button
        type="button"
        :disabled="page <= 1"
        class="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        title="صفحه قبل"
        @click="goToPage(page - 1)"
      >
        <ChevronRight class="w-4 h-4" />
      </button>

      <template v-for="(p, idx) in displayedPages" :key="idx">
        <span
          v-if="p === '...'"
          class="px-2 py-1 text-slate-400 select-none"
        >
          ...
        </span>
        <button
          v-else
          type="button"
          :class="[
            'h-8 min-w-8 px-2 flex items-center justify-center rounded-lg text-xs font-medium transition-colors cursor-pointer',
            page === p
              ? 'bg-brand-600 text-white font-bold shadow-sm'
              : 'border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
          ]"
          @click="goToPage(Number(p))"
        >
          {{ toPersianDigits(p) }}
        </button>
      </template>

      <!-- Next page (in RTL, next is left arrow) -->
      <button
        type="button"
        :disabled="page >= calculatedTotalPages"
        class="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        title="صفحه بعد"
        @click="goToPage(page + 1)"
      >
        <ChevronLeft class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
