<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onMounted,
  onUnmounted,
  nextTick,
} from 'vue';
import {
  ChevronDown,
  Search,
  Check,
  X,
  Loader2,
} from 'lucide-vue-next';

export interface Option {
  label: string;
  value: string | number;
  disabled?: boolean;
  [key: string]: any;
}

interface Props {
  modelValue?: string | number | null;
  label?: string;
  id?: string;
  name?: string;
  placeholder?: string;
  options?: Option[];
  error?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  clearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  dir?: 'rtl' | 'ltr' | 'auto';
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  options: () => [],
  disabled: false,
  required: false,
  searchable: true,
  searchPlaceholder: 'جستجو...',
  emptyText: 'موردی یافت نشد',
  clearable: false,
  size: 'md',
  loading: false,
  dir: 'rtl',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
  (e: 'change', value: any): void;
  (e: 'open'): void;
  (e: 'close'): void;
}>();

const selectId = computed(() => props.id || `select_${Math.random().toString(36).substring(2, 9)}`);

const isOpen = ref(false);
const searchQuery = ref('');
const highlightedIndex = ref(-1);
const placement = ref<'top' | 'bottom'>('bottom');

const containerRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLButtonElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);
const optionsListRef = ref<HTMLElement | null>(null);
const optionRefs = ref<HTMLElement[]>([]);

// Persian/Arabic text normalization for high-accuracy search
function normalizeText(text: any): string {
  if (text === null || text === undefined) return '';
  return String(text)
    .toLowerCase()
    // Remove Arabic diacritics
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Remove Tatweel (Kashida)
    .replace(/\u0640/g, '')
    // Remove Zero-Width Non-Joiner & Joiners
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Normalize Kaf
    .replace(/[\u0643\u06AA]/g, 'ک')
    // Normalize Yeh
    .replace(/[\u0649\u064A\u06CD\u06D0\u06D1]/g, 'ی')
    // Normalize Alef
    .replace(/[\u0622\u0623\u0625\u0671]/g, 'ا')
    // Normalize Teh Marbuta
    .replace(/\u0629/g, 'ه')
    // Normalize Persian digits to English digits
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    // Normalize Arabic digits to English digits
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .trim();
}

// Find currently selected option
const selectedOption = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) {
    return undefined;
  }
  return props.options.find(
    (o) => o.value === props.modelValue || String(o.value) === String(props.modelValue)
  );
});

// Has a valid non-empty selection
const hasValue = computed(() => {
  return (
    props.modelValue !== null &&
    props.modelValue !== undefined &&
    props.modelValue !== ''
  );
});

// Label to display on the trigger button
const displayLabel = computed(() => {
  if (selectedOption.value) {
    return selectedOption.value.label;
  }
  return props.placeholder || 'انتخاب کنید...';
});

// Filtered options based on search query
const filteredOptions = computed(() => {
  const q = normalizeText(searchQuery.value);
  if (!q) {
    return props.options;
  }
  return props.options.filter((opt) => normalizeText(opt.label).includes(q));
});

function isOptionSelected(opt: Option): boolean {
  if (props.modelValue === null || props.modelValue === undefined) {
    return false;
  }
  return opt.value === props.modelValue || String(opt.value) === String(props.modelValue);
}

// Find closest scrollable parent to calculate placement accurately inside modals/drawers
function getScrollParent(node: HTMLElement | null): HTMLElement | null {
  if (!node) return null;
  let parent = node.parentElement;
  while (parent) {
    const { overflowY } = window.getComputedStyle(parent);
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

function updatePlacement() {
  if (!containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  const spaceBelowWindow = window.innerHeight - rect.bottom;
  const spaceAboveWindow = rect.top;

  let spaceBelow = spaceBelowWindow;
  let spaceAbove = spaceAboveWindow;

  const scrollParent = getScrollParent(containerRef.value);
  if (scrollParent && scrollParent !== document.documentElement && scrollParent !== document.body) {
    const parentRect = scrollParent.getBoundingClientRect();
    const spaceBelowContainer = parentRect.bottom - rect.bottom;
    const spaceAboveContainer = rect.top - parentRect.top;
    spaceBelow = Math.min(spaceBelowWindow, spaceBelowContainer);
    spaceAbove = Math.min(spaceAboveWindow, spaceAboveContainer);
  }

  const menuHeight = 280;
  if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
    placement.value = 'top';
  } else {
    placement.value = 'bottom';
  }
}

function openDropdown() {
  if (props.disabled) return;
  updatePlacement();
  isOpen.value = true;
  searchQuery.value = '';

  // Set initial highlighted item
  const selectedIdx = filteredOptions.value.findIndex((o) => isOptionSelected(o));
  highlightedIndex.value = selectedIdx >= 0 ? selectedIdx : 0;

  emit('open');

  nextTick(() => {
    if (props.searchable && searchInputRef.value) {
      searchInputRef.value.focus();
    }
    scrollToHighlighted();
  });
}

function closeDropdown() {
  if (!isOpen.value) return;
  isOpen.value = false;
  searchQuery.value = '';
  highlightedIndex.value = -1;
  emit('close');
}

function toggleDropdown() {
  if (props.disabled) return;
  if (isOpen.value) {
    closeDropdown();
  } else {
    openDropdown();
  }
}

function selectOption(opt: Option) {
  if (opt.disabled) return;
  emit('update:modelValue', opt.value);
  emit('change', opt.value);
  closeDropdown();
  nextTick(() => {
    triggerRef.value?.focus();
  });
}

function clearSelection() {
  emit('update:modelValue', '');
  emit('change', '');
}

function findNextEnabledIndex(startIndex: number, direction: 1 | -1): number {
  const len = filteredOptions.value.length;
  if (len === 0) return -1;
  let idx = startIndex;
  for (let i = 0; i < len; i++) {
    idx = (idx + direction + len) % len;
    if (!filteredOptions.value[idx]?.disabled) {
      return idx;
    }
  }
  return -1;
}

function scrollToHighlighted() {
  if (highlightedIndex.value < 0) return;
  nextTick(() => {
    const el = optionRefs.value[highlightedIndex.value];
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  });
}

// Keyboard handling on trigger button
function handleTriggerKeydown(e: KeyboardEvent) {
  if (props.disabled) return;

  if (!isOpen.value) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openDropdown();
    }
  } else {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeDropdown();
    }
  }
}

// Keyboard handling inside search input
function handleSearchKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const nextIdx = findNextEnabledIndex(highlightedIndex.value, 1);
    if (nextIdx !== -1) {
      highlightedIndex.value = nextIdx;
      scrollToHighlighted();
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    const prevIdx = findNextEnabledIndex(highlightedIndex.value, -1);
    if (prevIdx !== -1) {
      highlightedIndex.value = prevIdx;
      scrollToHighlighted();
    }
  } else if (e.key === 'Enter') {
    e.preventDefault();
    e.stopPropagation();
    if (filteredOptions.value.length > 0 && highlightedIndex.value >= 0) {
      const opt = filteredOptions.value[highlightedIndex.value];
      if (opt && !opt.disabled) {
        selectOption(opt);
      }
    }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    closeDropdown();
    nextTick(() => {
      triggerRef.value?.focus();
    });
  } else if (e.key === 'Tab') {
    closeDropdown();
  }
}

// Reset highlight when filtered options change
watch(searchQuery, () => {
  const firstEnabled = filteredOptions.value.findIndex((o) => !o.disabled);
  highlightedIndex.value = firstEnabled >= 0 ? firstEnabled : -1;
  nextTick(() => {
    if (optionsListRef.value) {
      optionsListRef.value.scrollTop = 0;
    }
  });
});

// Outside click handling
function handleOutsideClick(event: MouseEvent) {
  if (!isOpen.value) return;
  const target = event.target as Node;
  if (containerRef.value && !containerRef.value.contains(target)) {
    closeDropdown();
  }
}

function handleWindowResize() {
  if (isOpen.value) {
    updatePlacement();
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleOutsideClick);
  window.addEventListener('resize', handleWindowResize);
});

onUnmounted(() => {
  document.removeEventListener('pointerdown', handleOutsideClick);
  window.removeEventListener('resize', handleWindowResize);
});

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-8 px-2.5 text-xs';
    case 'lg':
      return 'h-12 px-4 text-base';
    case 'md':
    default:
      return 'h-10 px-3.5 text-sm';
  }
});
</script>

<template>
  <div
    ref="containerRef"
    :dir="dir"
    :class="[
      'w-full text-right select-none',
      isOpen ? 'relative z-40' : 'relative z-10'
    ]"
  >
    <!-- Label -->
    <label
      v-if="label"
      :for="selectId"
      class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
    >
      {{ label }}
      <span v-if="required" class="text-rose-500 font-bold mr-0.5">*</span>
    </label>

    <!-- Hidden native input for forms -->
    <input
      type="hidden"
      :name="name"
      :value="modelValue ?? ''"
    />

    <!-- Trigger Button -->
    <button
      :id="selectId"
      ref="triggerRef"
      type="button"
      :disabled="disabled"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      :class="[
        'w-full flex items-center justify-between text-right rounded-lg transition-all duration-150 cursor-pointer',
        sizeClasses,
        'bg-white dark:bg-slate-900',
        error
          ? 'border border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
          : isOpen
            ? 'border border-brand-600 dark:border-brand-500 ring-2 ring-brand-500/20'
            : 'border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 focus:border-brand-600 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
        'focus:outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed',
      ]"
      @click="toggleDropdown"
      @keydown="handleTriggerKeydown"
    >
      <!-- Display label or placeholder -->
      <span
        :class="[
          'block truncate flex-1 text-right',
          selectedOption
            ? 'text-slate-900 dark:text-slate-100 font-normal'
            : 'text-slate-400 dark:text-slate-500'
        ]"
        :title="displayLabel"
      >
        {{ displayLabel }}
      </span>

      <!-- Action icons (Loading / Clear / Chevron) -->
      <div class="flex items-center gap-1.5 shrink-0 mr-2 text-slate-400 dark:text-slate-500">
        <Loader2
          v-if="loading"
          class="w-4 h-4 animate-spin text-brand-600 dark:text-brand-400"
        />

        <span
          v-if="clearable && hasValue && !disabled"
          role="button"
          tabindex="-1"
          title="پاک کردن انتخاب"
          class="p-0.5 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors cursor-pointer"
          @click.stop="clearSelection"
        >
          <X class="w-3.5 h-3.5" />
        </span>

        <ChevronDown
          :class="[
            'w-4 h-4 transition-transform duration-200 pointer-events-none',
            isOpen ? 'rotate-180 text-brand-600 dark:text-brand-400' : ''
          ]"
        />
      </div>
    </button>

    <!-- Dropdown Menu -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        :class="[
          'absolute z-50 left-0 right-0 w-full',
          placement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
          'bg-white dark:bg-slate-900',
          'border border-slate-200 dark:border-slate-800',
          'rounded-xl shadow-xl shadow-slate-900/10 dark:shadow-slate-950/40',
          'overflow-hidden flex flex-col',
        ]"
        role="listbox"
      >
        <!-- Search Input (Select2 Combobox Search) -->
        <div
          v-if="searchable"
          class="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 shrink-0"
        >
          <div class="relative flex items-center">
            <Search class="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-2.5 pointer-events-none" />
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              :placeholder="searchPlaceholder"
              class="w-full h-8.5 pr-8 pl-7 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
              @keydown="handleSearchKeydown"
            />
            <button
              v-if="searchQuery"
              type="button"
              tabindex="-1"
              class="absolute left-2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors cursor-pointer"
              @click.stop="searchQuery = ''"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Options List -->
        <div
          ref="optionsListRef"
          class="max-h-60 overflow-y-auto p-1.5 space-y-0.5 overscroll-contain"
        >
          <template v-if="filteredOptions.length > 0">
            <div
              v-for="(opt, idx) in filteredOptions"
              :id="`${selectId}_opt_${idx}`"
              :key="opt.value"
              :ref="el => { if (el) optionRefs[idx] = el as HTMLElement; }"
              role="option"
              :aria-selected="isOptionSelected(opt)"
              :aria-disabled="opt.disabled"
              :class="[
                'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs md:text-sm text-right transition-colors select-none',
                opt.disabled
                  ? 'opacity-40 cursor-not-allowed'
                  : 'cursor-pointer',
                isOptionSelected(opt)
                  ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-medium'
                  : highlightedIndex === idx
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
              ]"
              @click="selectOption(opt)"
              @mouseenter="highlightedIndex = idx"
            >
              <slot name="option" :option="opt" :selected="isOptionSelected(opt)" :active="highlightedIndex === idx">
                <span class="truncate flex-1" :title="opt.label">
                  {{ opt.label }}
                </span>

                <Check
                  v-if="isOptionSelected(opt)"
                  class="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mr-2"
                />
              </slot>
            </div>
          </template>

          <!-- Empty Search State -->
          <div
            v-else
            class="py-6 px-4 text-center text-xs text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-1.5"
          >
            <Search class="w-5 h-5 text-slate-300 dark:text-slate-600" />
            <span>{{ emptyText }}</span>
          </div>
        </div>

        <!-- Filter Count Footer when searching -->
        <div
          v-if="searchable && searchQuery && filteredOptions.length > 0"
          class="px-3 py-1.5 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between"
        >
          <span>{{ filteredOptions.length }} مورد یافت شد</span>
        </div>
      </div>
    </Transition>

    <!-- Error message -->
    <p v-if="error" class="mt-1 text-xs text-rose-500 font-medium animate-fadeIn">
      {{ error }}
    </p>

    <!-- Hint message -->
    <p v-else-if="hint" class="mt-1 text-xs text-slate-500 dark:text-slate-400">
      {{ hint }}
    </p>
  </div>
</template>
