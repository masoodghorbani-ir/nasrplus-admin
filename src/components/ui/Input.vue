<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  modelValue?: string | number | null;
  label?: string;
  id?: string;
  placeholder?: string;
  type?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  readonly?: boolean;
  dir?: 'rtl' | 'ltr' | 'auto';
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  disabled: false,
  required: false,
  readonly: false,
  dir: 'auto',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'blur', event: FocusEvent): void;
  (e: 'focus', event: FocusEvent): void;
}>();

const inputId = computed(() => props.id || `input_${Math.random().toString(36).substring(2, 9)}`);

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
}
</script>

<template>
  <div class="w-full text-right">
    <label
      v-if="label"
      :for="inputId"
      class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
    >
      {{ label }}
      <span v-if="required" class="text-rose-500 font-bold mr-0.5">*</span>
    </label>

    <div class="relative flex items-center">
      <div
        v-if="$slots.prefix"
        class="absolute right-3 text-slate-400 dark:text-slate-500 flex items-center pointer-events-none"
      >
        <slot name="prefix" />
      </div>

      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :readonly="readonly"
        :dir="dir"
        :class="[
          'w-full h-10 px-3.5 text-sm rounded-lg transition-all duration-150',
          'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500',
          'border',
          error
            ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 focus:border-brand-600 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
          'focus:outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed',
          $slots.prefix ? 'pr-10' : '',
          $slots.suffix ? 'pl-10' : '',
        ]"
        @input="handleInput"
        @blur="emit('blur', $event)"
        @focus="emit('focus', $event)"
      />

      <div
        v-if="$slots.suffix"
        class="absolute left-3 text-slate-400 dark:text-slate-500 flex items-center"
      >
        <slot name="suffix" />
      </div>
    </div>

    <p v-if="error" class="mt-1 text-xs text-rose-500 font-medium animate-fadeIn">
      {{ error }}
    </p>
    <p v-else-if="hint" class="mt-1 text-xs text-slate-500 dark:text-slate-400">
      {{ hint }}
    </p>
  </div>
</template>
