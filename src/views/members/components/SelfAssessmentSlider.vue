<script setup lang="ts">
import { computed } from 'vue';
import { getSelfAssessmentInfo } from '@/utils/skills';
import { Sparkles, Gauge } from 'lucide-vue-next';

interface Props {
  modelValue: number;
  disabled?: boolean;
  label?: string;
  error?: string;
  hint?: string;
  showPresets?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 50,
  disabled: false,
  label: 'درجه مهارت به صورت خوداظهاری',
  error: '',
  hint: '',
  showPresets: true,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
}>();

const levelInfo = computed(() => getSelfAssessmentInfo(props.modelValue));

function handleSliderChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const num = Math.max(1, Math.min(100, Number(target.value) || 1));
  emit('update:modelValue', num);
}

function handleNumberChange(e: Event) {
  const target = e.target as HTMLInputElement;
  let num = parseInt(target.value, 10);
  if (isNaN(num)) num = 1;
  num = Math.max(1, Math.min(100, num));
  emit('update:modelValue', num);
}

function setPreset(val: number) {
  if (props.disabled) return;
  emit('update:modelValue', val);
}

const presets = [
  { label: 'مقدماتی (۲۵٪)', value: 25, color: 'blue' },
  { label: 'متوسط (۵۰٪)', value: 50, color: 'amber' },
  { label: 'پیشرفته (۷۵٪)', value: 75, color: 'emerald' },
  { label: 'خبره (۹۵٪)', value: 95, color: 'purple' },
];
</script>

<template>
  <div class="space-y-2 select-none" dir="rtl">
    <!-- Header with Label and Dynamic Tier Badge -->
    <div class="flex items-center justify-between gap-2">
      <label class="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
        <Gauge class="w-4 h-4 text-brand-600 dark:text-brand-400" />
        <span>{{ label }}</span>
        <span class="text-rose-500">*</span>
      </label>

      <!-- Active Tier Badge -->
      <div
        :class="[
          'flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-all duration-200',
          levelInfo.badgeClass
        ]"
      >
        <Sparkles class="w-3 h-3" />
        <span>{{ levelInfo.label }}</span>
        <span class="text-[10px] opacity-75">({{ levelInfo.enLabel }})</span>
      </div>
    </div>

    <!-- Main Control: Slider + Number Display Box -->
    <div
      :class="[
        'p-3.5 rounded-xl border transition-all duration-150',
        error
          ? 'border-rose-400 bg-rose-50/20 dark:bg-rose-950/20'
          : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40'
      ]"
    >
      <div class="flex items-center gap-3">
        <!-- Range Track Slider -->
        <div class="relative flex-1 flex items-center">
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            :value="modelValue"
            :disabled="disabled"
            class="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-600 focus:outline-none transition-all disabled:opacity-50"
            @input="handleSliderChange"
          />
        </div>

        <!-- Numeric Box with % -->
        <div class="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg shrink-0 shadow-2xs">
          <input
            type="number"
            min="1"
            max="100"
            :value="modelValue"
            :disabled="disabled"
            class="w-10 text-center font-black text-sm bg-transparent outline-none tabular-nums text-slate-800 dark:text-slate-100"
            @input="handleNumberChange"
          />
          <span class="text-xs font-bold text-slate-400">%</span>
        </div>
      </div>

      <!-- Color-Coded Progress Visual Bar -->
      <div class="mt-2.5 h-1.5 w-full bg-slate-200/80 dark:bg-slate-700/80 rounded-full overflow-hidden">
        <div
          :class="['h-full transition-all duration-200 rounded-full', levelInfo.progressBarClass]"
          :style="{ width: `${modelValue}%` }"
        ></div>
      </div>

      <!-- Quick Preset Buttons -->
      <div v-if="showPresets" class="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-1 text-2xs font-medium">
        <span class="text-slate-400 dark:text-slate-500">انتخاب سریع:</span>
        <div class="flex items-center gap-1.5 flex-wrap">
          <button
            v-for="p in presets"
            :key="p.value"
            type="button"
            :disabled="disabled"
            :class="[
              'px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer border',
              modelValue === p.value
                ? 'bg-brand-600 text-white border-brand-600 shadow-2xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-300'
            ]"
            @click="setPreset(p.value)"
          >
            {{ p.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Error message -->
    <p v-if="error" class="text-2xs font-bold text-rose-500 dark:text-rose-400">
      {{ error }}
    </p>

    <!-- Hint -->
    <p v-else-if="hint" class="text-2xs text-slate-400 dark:text-slate-500">
      {{ hint }}
    </p>
  </div>
</template>
