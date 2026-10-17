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
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  X,
  RotateCcw,
} from 'lucide-vue-next';
import {
  getTodayJalali,
  getMonthLength,
  getJalaliWeekdayIndex,
  parseAnyDateToJalali,
  formatJalali,
  jalaliToGregorianString,
  jalaliToIsoString,
  isSameDate,
  isDateBefore,
  isDateAfter,
  PERSIAN_MONTH_NAMES,
  PERSIAN_WEEK_DAYS,
  type JalaliDate,
  type JalaliCalendarCell,
} from '@/utils/jalali';
import { toPersianDigits } from '@/utils/formatters';

export type OutputFormat = 'gregorian' | 'jalali' | 'iso';
type CalendarView = 'days' | 'months' | 'years';

interface Props {
  modelValue?: string | null;
  label?: string;
  id?: string;
  name?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  readonly?: boolean;
  clearable?: boolean;
  outputFormat?: OutputFormat;
  min?: string;
  max?: string;
  size?: 'sm' | 'md' | 'lg';
  dir?: 'rtl' | 'ltr';
  persianDigits?: boolean;
  inputClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'انتخاب تاریخ...',
  disabled: false,
  required: false,
  readonly: false,
  clearable: true,
  outputFormat: 'gregorian',
  size: 'md',
  dir: 'rtl',
  persianDigits: true,
  inputClass: '',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'change', value: string, jalaliDate: JalaliDate | null): void;
  (e: 'clear'): void;
}>();

const inputId = computed(() => props.id || `datepicker_${Math.random().toString(36).substring(2, 9)}`);

const isOpen = ref(false);
const currentView = ref<CalendarView>('days');

// Internal selected date
const selectedDate = ref<JalaliDate | null>(null);

// Currently browsed year and month in the calendar view
const today = getTodayJalali();
const viewYear = ref<number>(today.jy);
const viewMonth = ref<number>(today.jm);

// Year grid navigation decade start (e.g. 1400)
const decadeStartYear = ref<number>(Math.floor(today.jy / 12) * 12);

// Elements & positioning
const containerRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);
const dropdownStyle = ref<Record<string, string>>({});

// Min & max parsed dates
const minDate = computed(() => (props.min ? parseAnyDateToJalali(props.min) : null));
const maxDate = computed(() => (props.max ? parseAnyDateToJalali(props.max) : null));

// Sync modelValue to selectedDate & viewYear/viewMonth
watch(
  () => props.modelValue,
  (newVal) => {
    if (!newVal) {
      selectedDate.value = null;
      return;
    }
    const parsed = parseAnyDateToJalali(newVal);
    if (parsed) {
      selectedDate.value = parsed;
      // If calendar is closed, sync view position
      if (!isOpen.value) {
        viewYear.value = parsed.jy;
        viewMonth.value = parsed.jm;
        decadeStartYear.value = Math.floor(parsed.jy / 12) * 12;
      }
    } else {
      selectedDate.value = null;
    }
  },
  { immediate: true }
);

// Display label in input
const displayValue = computed(() => {
  if (!selectedDate.value) return '';
  return formatJalali(selectedDate.value, props.persianDigits);
});

// Calculate calendar cells for currently viewed month
const calendarCells = computed<JalaliCalendarCell[]>(() => {
  const y = viewYear.value;
  const m = viewMonth.value;
  const currentMonthLength = getMonthLength(y, m);

  // Weekday index of 1st day of current month (0 = شنبه, 6 = جمعه)
  const startWeekday = getJalaliWeekdayIndex(y, m, 1);

  // Previous month info
  const prevMonth = m === 1 ? 12 : m - 1;
  const prevYear = m === 1 ? y - 1 : y;
  const prevMonthLength = getMonthLength(prevYear, prevMonth);

  const cells: JalaliCalendarCell[] = [];

  // Trailing days from previous month
  for (let i = startWeekday - 1; i >= 0; i--) {
    const day = prevMonthLength - i;
    const dateObj: JalaliDate = { jy: prevYear, jm: prevMonth, jd: day };
    const weekday = (startWeekday - 1 - i + 7) % 7;
    cells.push({
      day,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
      isToday: isSameDate(dateObj, today),
      isSelected: isSameDate(dateObj, selectedDate.value),
      isDisabled: isDateDisabled(dateObj),
      isWeekend: weekday === 6,
    });
  }

  // Days of current month
  for (let day = 1; day <= currentMonthLength; day++) {
    const dateObj: JalaliDate = { jy: y, jm: m, jd: day };
    const weekday = getJalaliWeekdayIndex(y, m, day);
    cells.push({
      day,
      month: m,
      year: y,
      isCurrentMonth: true,
      isToday: isSameDate(dateObj, today),
      isSelected: isSameDate(dateObj, selectedDate.value),
      isDisabled: isDateDisabled(dateObj),
      isWeekend: weekday === 6,
    });
  }

  // Leading days from next month to complete the 7-column grid (up to 35 or 42 cells)
  const nextMonth = m === 12 ? 1 : m + 1;
  const nextYear = m === 12 ? y + 1 : y;
  const remainingCells = (7 - (cells.length % 7)) % 7;
  // If fewer than 35 cells, show one more row for visual stability
  const targetTotal = cells.length + remainingCells < 35 ? remainingCells + 7 : remainingCells;

  for (let day = 1; day <= targetTotal; day++) {
    const dateObj: JalaliDate = { jy: nextYear, jm: nextMonth, jd: day };
    const weekday = getJalaliWeekdayIndex(nextYear, nextMonth, day);
    cells.push({
      day,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
      isToday: isSameDate(dateObj, today),
      isSelected: isSameDate(dateObj, selectedDate.value),
      isDisabled: isDateDisabled(dateObj),
      isWeekend: weekday === 6,
    });
  }

  return cells;
});

// Years for Decade View
const yearsInDecade = computed<number[]>(() => {
  const start = decadeStartYear.value;
  const list: number[] = [];
  for (let i = 0; i < 12; i++) {
    list.push(start + i);
  }
  return list;
});

function isDateDisabled(d: JalaliDate): boolean {
  if (minDate.value && isDateBefore(d, minDate.value)) return true;
  if (maxDate.value && isDateAfter(d, maxDate.value)) return true;
  return false;
}

// Convert internal JalaliDate to appropriate output format
function getFormattedOutput(d: JalaliDate): string {
  if (props.outputFormat === 'jalali') {
    return formatJalali(d, false);
  }
  if (props.outputFormat === 'iso') {
    return jalaliToIsoString(d.jy, d.jm, d.jd);
  }
  // default: 'gregorian' (YYYY-MM-DD)
  return jalaliToGregorianString(d.jy, d.jm, d.jd);
}

function selectCell(cell: JalaliCalendarCell) {
  if (cell.isDisabled) return;
  const picked: JalaliDate = { jy: cell.year, jm: cell.month, jd: cell.day };
  selectedDate.value = picked;
  viewYear.value = cell.year;
  viewMonth.value = cell.month;

  const outputVal = getFormattedOutput(picked);
  emit('update:modelValue', outputVal);
  emit('change', outputVal, picked);

  closeCalendar();
}

function selectMonth(monthIndex: number) {
  viewMonth.value = monthIndex;
  currentView.value = 'days';
}

function selectYear(year: number) {
  viewYear.value = year;
  currentView.value = 'months';
}

function selectToday() {
  const todayDate = getTodayJalali();
  if (isDateDisabled(todayDate)) return;

  selectedDate.value = todayDate;
  viewYear.value = todayDate.jy;
  viewMonth.value = todayDate.jm;
  decadeStartYear.value = Math.floor(todayDate.jy / 12) * 12;

  const outputVal = getFormattedOutput(todayDate);
  emit('update:modelValue', outputVal);
  emit('change', outputVal, todayDate);

  closeCalendar();
}

function clearValue(event?: Event) {
  if (event) {
    event.stopPropagation();
  }
  selectedDate.value = null;
  emit('update:modelValue', '');
  emit('change', '', null);
  emit('clear');
}

// Navigation buttons (< and >)
function handlePrev() {
  if (currentView.value === 'days') {
    if (viewMonth.value === 1) {
      viewMonth.value = 12;
      viewYear.value -= 1;
    } else {
      viewMonth.value -= 1;
    }
  } else if (currentView.value === 'months') {
    viewYear.value -= 1;
  } else if (currentView.value === 'years') {
    decadeStartYear.value -= 12;
  }
}

function handleNext() {
  if (currentView.value === 'days') {
    if (viewMonth.value === 12) {
      viewMonth.value = 1;
      viewYear.value += 1;
    } else {
      viewMonth.value += 1;
    }
  } else if (currentView.value === 'months') {
    viewYear.value += 1;
  } else if (currentView.value === 'years') {
    decadeStartYear.value += 12;
  }
}

function toggleView(target: CalendarView) {
  if (currentView.value === target) {
    currentView.value = 'days';
  } else {
    currentView.value = target;
    if (target === 'years') {
      decadeStartYear.value = Math.floor(viewYear.value / 12) * 12;
    }
  }
}

// Popup Positioning & Click Outside
function updatePosition() {
  if (!triggerRef.value) return;

  const rect = triggerRef.value.getBoundingClientRect();
  const dropdownWidth = Math.min(320, window.innerWidth - 20);
  const dropdownHeight = 360;

  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;

  let top = rect.bottom + 6;
  if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
    top = Math.max(10, rect.top - dropdownHeight - 6);
  }

  // Calculate left/right based on viewport bounds
  let left = rect.right - dropdownWidth;
  if (left < 10) {
    left = 10;
  }
  if (left + dropdownWidth > window.innerWidth - 10) {
    left = Math.max(10, window.innerWidth - dropdownWidth - 10);
  }

  dropdownStyle.value = {
    position: 'fixed',
    top: `${Math.round(top)}px`,
    left: `${Math.round(left)}px`,
    width: `${dropdownWidth}px`,
    zIndex: '99999',
  };
}

function openCalendar() {
  if (props.disabled || props.readonly) return;

  if (selectedDate.value) {
    viewYear.value = selectedDate.value.jy;
    viewMonth.value = selectedDate.value.jm;
    decadeStartYear.value = Math.floor(selectedDate.value.jy / 12) * 12;
  } else {
    const cur = getTodayJalali();
    viewYear.value = cur.jy;
    viewMonth.value = cur.jm;
    decadeStartYear.value = Math.floor(cur.jy / 12) * 12;
  }

  currentView.value = 'days';
  isOpen.value = true;
  nextTick(() => {
    updatePosition();
  });
}

function closeCalendar() {
  isOpen.value = false;
  currentView.value = 'days';
}

function toggleCalendar() {
  if (isOpen.value) {
    closeCalendar();
  } else {
    openCalendar();
  }
}

function handleOutsideClick(event: MouseEvent | PointerEvent) {
  if (!isOpen.value) return;
  const target = event.target as Node;
  if (
    containerRef.value?.contains(target) ||
    dropdownRef.value?.contains(target)
  ) {
    return;
  }
  closeCalendar();
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    closeCalendar();
  }
}

function handleScrollOrResize() {
  if (isOpen.value) {
    updatePosition();
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleOutsideClick);
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', handleScrollOrResize);
  window.addEventListener('scroll', handleScrollOrResize, true);
});

onUnmounted(() => {
  document.removeEventListener('pointerdown', handleOutsideClick);
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('resize', handleScrollOrResize);
  window.removeEventListener('scroll', handleScrollOrResize, true);
});

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-9 px-3 text-xs';
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
    class="w-full text-right select-none"
  >
    <!-- Label -->
    <label
      v-if="label"
      :for="inputId"
      class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
    >
      {{ label }}
      <span v-if="required" class="text-rose-500 font-bold mr-0.5">*</span>
    </label>

    <!-- Trigger Input Box -->
    <div
      ref="triggerRef"
      tabindex="0"
      role="combobox"
      :aria-expanded="isOpen"
      :aria-controls="`dp_popup_${inputId}`"
      :class="[
        'relative flex items-center justify-between rounded-lg transition-all duration-150 cursor-pointer',
        sizeClasses,
        inputClass || 'bg-white dark:bg-slate-900',
        error
          ? 'border border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
          : isOpen
            ? 'border border-brand-600 dark:border-brand-500 ring-2 ring-brand-500/20'
            : 'border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 focus:border-brand-600 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
        'focus:outline-none',
        disabled ? 'bg-slate-100 dark:bg-slate-800 opacity-60 cursor-not-allowed pointer-events-none' : '',
      ]"
      @click="toggleCalendar"
      @keydown.enter.prevent="toggleCalendar"
      @keydown.space.prevent="toggleCalendar"
    >
      <!-- Prefix: Calendar Icon -->
      <div class="flex items-center gap-2 text-slate-400 dark:text-slate-500 pointer-events-none shrink-0">
        <CalendarIcon class="w-4 h-4 text-brand-600 dark:text-brand-400" />
      </div>

      <!-- Selected Value or Placeholder -->
      <span
        :class="[
          'flex-1 mx-2.5 truncate text-right font-medium',
          displayValue
            ? 'text-slate-900 dark:text-slate-100'
            : 'text-slate-400 dark:text-slate-500 font-normal',
        ]"
      >
        {{ displayValue || placeholder }}
      </span>

      <!-- Suffix: Clear Icon / Empty Spacer -->
      <div class="flex items-center gap-1 shrink-0 text-slate-400 dark:text-slate-500">
        <button
          v-if="clearable && displayValue && !disabled && !readonly"
          type="button"
          title="پاک کردن تاریخ"
          class="p-1 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          @click.stop="clearValue"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Error & Hint Messages -->
    <p v-if="error" class="mt-1 text-xs text-rose-500 font-medium animate-fadeIn">
      {{ error }}
    </p>
    <p v-else-if="hint" class="mt-1 text-xs text-slate-500 dark:text-slate-400">
      {{ hint }}
    </p>

    <!-- Teleported Calendar Popover Dropdown -->
    <Teleport to="body">
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
          :id="`dp_popup_${inputId}`"
          ref="dropdownRef"
          :style="dropdownStyle"
          dir="rtl"
          class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl shadow-slate-900/15 dark:shadow-slate-950/60 overflow-hidden p-3.5 text-right font-sans select-none"
          @click.stop
        >
          <!-- Calendar Header Navigation -->
          <div class="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
            <!-- Next Button (in RTL, Arrow Right moves backward in time, Arrow Left moves forward in time) -->
            <button
              type="button"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="ماه قبل"
              @click="handlePrev"
            >
              <ChevronRight class="w-4 h-4" />
            </button>

            <!-- Month & Year Jump Buttons -->
            <div class="flex items-center gap-1.5 font-bold text-sm text-slate-800 dark:text-slate-100">
              <button
                type="button"
                :class="[
                  'px-2.5 py-1 rounded-lg transition-colors cursor-pointer',
                  currentView === 'months'
                    ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100'
                ]"
                @click="toggleView('months')"
              >
                {{ PERSIAN_MONTH_NAMES[viewMonth - 1] }}
              </button>

              <button
                type="button"
                :class="[
                  'px-2.5 py-1 rounded-lg transition-colors cursor-pointer',
                  currentView === 'years'
                    ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100'
                ]"
                @click="toggleView('years')"
              >
                {{ toPersianDigits(viewYear) }}
              </button>
            </div>

            <!-- Prev Button -->
            <button
              type="button"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="ماه بعد"
              @click="handleNext"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
          </div>

          <!-- VIEW 1: Days View -->
          <div v-if="currentView === 'days'">
            <!-- Weekday Headers -->
            <div class="grid grid-cols-7 gap-1 text-center mb-1.5">
              <span
                v-for="wd in PERSIAN_WEEK_DAYS"
                :key="wd.index"
                :class="[
                  'text-[11px] font-semibold py-1',
                  wd.isWeekend
                    ? 'text-rose-500 dark:text-rose-400'
                    : 'text-slate-400 dark:text-slate-500'
                ]"
                :title="wd.name"
              >
                {{ wd.short }}
              </span>
            </div>

            <!-- Month Days Grid -->
            <div class="grid grid-cols-7 gap-1 text-center">
              <button
                v-for="(cell, idx) in calendarCells"
                :key="idx"
                type="button"
                :disabled="cell.isDisabled"
                :class="[
                  'h-8 w-8 mx-auto text-xs rounded-lg transition-all duration-150 flex items-center justify-center relative cursor-pointer',
                  cell.isDisabled
                    ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed pointer-events-none'
                    : cell.isSelected
                      ? 'bg-brand-600 text-white font-bold shadow-md shadow-brand-500/25'
                      : cell.isCurrentMonth
                        ? cell.isWeekend
                          ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                          : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 opacity-60',
                  cell.isToday && !cell.isSelected
                    ? 'ring-1.5 ring-brand-500 font-bold text-brand-600 dark:text-brand-400'
                    : '',
                ]"
                @click="selectCell(cell)"
              >
                <span>{{ toPersianDigits(cell.day) }}</span>
                <!-- Small dot indicator for today if not selected -->
                <span
                  v-if="cell.isToday && !cell.isSelected"
                  class="absolute bottom-0.5 w-1 h-1 rounded-full bg-brand-500"
                />
              </button>
            </div>
          </div>

          <!-- VIEW 2: Months Selection Grid -->
          <div v-else-if="currentView === 'months'" class="grid grid-cols-3 gap-2 py-2">
            <button
              v-for="(monthName, idx) in PERSIAN_MONTH_NAMES"
              :key="idx"
              type="button"
              :class="[
                'py-2 px-1 text-xs rounded-xl font-medium transition-colors cursor-pointer',
                viewMonth === idx + 1
                  ? 'bg-brand-600 text-white font-bold shadow-sm'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
              ]"
              @click="selectMonth(idx + 1)"
            >
              {{ monthName }}
            </button>
          </div>

          <!-- VIEW 3: Years Selection Grid -->
          <div v-else-if="currentView === 'years'" class="grid grid-cols-3 gap-2 py-2">
            <button
              v-for="year in yearsInDecade"
              :key="year"
              type="button"
              :class="[
                'py-2 px-1 text-xs rounded-xl font-medium transition-colors cursor-pointer',
                viewYear === year
                  ? 'bg-brand-600 text-white font-bold shadow-sm'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
              ]"
              @click="selectYear(year)"
            >
              {{ toPersianDigits(year) }}
            </button>
          </div>

          <!-- Footer Actions Bar -->
          <div class="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <button
              type="button"
              class="flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-semibold px-2 py-1 rounded-md hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
              @click="selectToday"
            >
              <RotateCcw class="w-3.5 h-3.5" />
              امروز
            </button>

            <div class="flex items-center gap-1.5">
              <button
                v-if="selectedDate"
                type="button"
                class="text-slate-400 hover:text-rose-500 font-medium px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                @click="clearValue"
              >
                پاک کردن
              </button>

              <button
                type="button"
                class="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                @click="closeCalendar"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
