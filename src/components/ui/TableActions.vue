<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  nextTick,
  type Component,
} from 'vue';
import { MoreVertical } from 'lucide-vue-next';

export interface ActionItem {
  label: string;
  icon?: Component;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

interface Props {
  primaryLabel?: string;
  primaryIcon?: Component;
  primaryTitle?: string;
  primaryVariant?: 'brand' | 'outline' | 'default';
  items?: ActionItem[];
  menuTitle?: string;
}

const props = withDefaults(defineProps<Props>(), {
  primaryVariant: 'brand',
  items: () => [],
  menuTitle: 'سایر عملیات',
});

const emit = defineEmits<{
  (e: 'primary'): void;
}>();

const isOpen = ref(false);
const triggerRef = ref<HTMLButtonElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const coords = ref({ top: 0, left: 0 });

const primaryVariantClasses = computed(() => {
  switch (props.primaryVariant) {
    case 'outline':
      return 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-brand-600 dark:hover:text-brand-400';
    case 'default':
      return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700';
    case 'brand':
    default:
      return 'bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-950/50 dark:text-brand-300 dark:hover:bg-brand-900/60 border border-brand-200/80 dark:border-brand-800/80';
  }
});

function updateCoords() {
  if (!triggerRef.value) return;
  const rect = triggerRef.value.getBoundingClientRect();
  const menuWidth = 195;
  const approxItemHeight = 36;
  const menuHeight = (props.items.length || 2) * approxItemHeight + 16;
  const spaceBelow = window.innerHeight - rect.bottom;

  let top = rect.bottom + 4;
  if (spaceBelow < menuHeight + 8 && rect.top > menuHeight + 8) {
    top = rect.top - menuHeight - 4;
  }

  let left = rect.left;
  if (left + menuWidth > window.innerWidth - 8) {
    left = window.innerWidth - menuWidth - 8;
  }
  if (left < 8) {
    left = 8;
  }

  coords.value = { top, left };
}

function openMenu() {
  updateCoords();
  isOpen.value = true;
}

function closeMenu() {
  isOpen.value = false;
}

function toggleMenu() {
  if (isOpen.value) {
    closeMenu();
  } else {
    openMenu();
  }
}

function handlePrimaryClick() {
  emit('primary');
}

function handleItemClick(item: ActionItem) {
  if (item.disabled) return;
  closeMenu();
  nextTick(() => {
    item.onClick();
  });
}

function handleOutsideClick(e: MouseEvent) {
  if (!isOpen.value) return;
  const target = e.target as Node;
  if (triggerRef.value?.contains(target) || menuRef.value?.contains(target)) {
    return;
  }
  closeMenu();
}

function handleScroll() {
  if (isOpen.value) {
    closeMenu();
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) {
    closeMenu();
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleOutsideClick);
  window.addEventListener('scroll', handleScroll, true);
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', handleScroll);
});

onUnmounted(() => {
  document.removeEventListener('pointerdown', handleOutsideClick);
  window.removeEventListener('scroll', handleScroll, true);
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('resize', handleScroll);
});
</script>

<template>
  <div class="inline-flex items-center justify-end gap-1.5" dir="rtl">
    <!-- Primary Action with Icon and Label -->
    <slot name="primary">
      <button
        v-if="primaryLabel"
        type="button"
        :class="[
          'inline-flex items-center gap-1.5 h-7.5 px-2.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer select-none shadow-xs',
          primaryVariantClasses
        ]"
        :title="primaryTitle || primaryLabel"
        @click="handlePrimaryClick"
      >
        <component
          :is="primaryIcon"
          v-if="primaryIcon"
          class="w-3.5 h-3.5 shrink-0"
        />
        <span class="whitespace-nowrap">{{ primaryLabel }}</span>
      </button>
    </slot>

    <!-- More Actions Dropdown Trigger -->
    <div v-if="items && items.length > 0" class="relative">
      <button
        ref="triggerRef"
        type="button"
        :class="[
          'inline-flex items-center justify-center h-7.5 w-7.5 rounded-lg transition-all duration-150 cursor-pointer select-none shadow-xs',
          'border border-slate-200 dark:border-slate-700/80',
          isOpen
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 ring-2 ring-brand-500/20 border-brand-400 dark:border-brand-600'
            : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
        ]"
        :title="menuTitle"
        aria-haspopup="menu"
        :aria-expanded="isOpen"
        @click.stop="toggleMenu"
      >
        <MoreVertical class="w-3.5 h-3.5" />
      </button>

      <!-- Dropdown Menu Teleported to Body -->
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
            ref="menuRef"
            class="fixed z-50 min-w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 text-xs text-right overflow-hidden select-none"
            :style="{ top: `${coords.top}px`, left: `${coords.left}px` }"
            dir="rtl"
            role="menu"
          >
            <template v-for="(item, idx) in items" :key="idx">
              <div
                v-if="item.divider"
                class="my-1 border-t border-slate-100 dark:border-slate-800"
              />
              <button
                type="button"
                role="menuitem"
                :disabled="item.disabled"
                :class="[
                  'w-full flex items-center gap-2.5 px-3 py-2 text-right transition-colors cursor-pointer',
                  item.disabled ? 'opacity-40 cursor-not-allowed' : '',
                  item.danger
                    ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:text-slate-100'
                ]"
                @click.stop="handleItemClick(item)"
              >
                <component
                  :is="item.icon"
                  v-if="item.icon"
                  :class="[
                    'w-3.5 h-3.5 shrink-0',
                    item.danger ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'
                  ]"
                />
                <span class="font-medium flex-1">{{ item.label }}</span>
              </button>
            </template>
          </div>
        </Transition>
      </Teleport>
    </div>
  </div>
</template>
