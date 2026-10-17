<script setup lang="ts">
import { watch, onMounted, onUnmounted, computed } from 'vue';
import { X } from 'lucide-vue-next';
import { lockBodyScroll, unlockBodyScroll } from '@/utils/scrollLock';

interface Props {
  open: boolean;
  title?: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  closable?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  size: 'lg',
  closable: true,
  closeOnBackdrop: false,
  closeOnEscape: false,
});

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'close'): void;
}>();

function close() {
  if (props.closable) {
    emit('update:open', false);
    emit('close');
  }
}

function handleBackdropClick() {
  if (props.closeOnBackdrop && props.closable) {
    close();
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open && props.closable && props.closeOnEscape) {
    close();
  }
}

watch(
  () => props.open,
  (val, oldVal) => {
    if (val && !oldVal) {
      lockBodyScroll();
    } else if (!val && oldVal) {
      unlockBodyScroll();
    }
  }
);

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  if (props.open) {
    lockBodyScroll();
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  if (props.open) {
    unlockBodyScroll();
  }
});

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'max-w-md';
    case 'md':
      return 'max-w-lg';
    case 'lg':
      return 'max-w-2xl';
    case 'xl':
      return 'max-w-4xl';
    case '2xl':
      return 'max-w-5xl';
    case '3xl':
      return 'max-w-6xl';
    case 'full':
      return 'max-w-[95vw] min-h-[85vh]';
    default:
      return 'max-w-2xl';
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        dir="rtl"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity"
          @click="handleBackdropClick"
        />

        <!-- Dialog Panel -->
        <div
          :class="[
            'relative w-full my-8 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden transform transition-all',
            sizeClasses,
          ]"
          @click.stop
        >
          <!-- Header -->
          <div
            v-if="title || $slots.header"
            class="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0"
          >
            <slot name="header">
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">
                  {{ title }}
                </h3>
                <p v-if="subtitle" class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {{ subtitle }}
                </p>
              </div>
            </slot>

            <button
              v-if="closable"
              type="button"
              class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              @click="close"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="px-6 py-5 overflow-y-auto flex-1 text-slate-800 dark:text-slate-200 text-sm">
            <slot />
          </div>

          <!-- Footer -->
          <div
            v-if="$slots.footer"
            class="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 shrink-0"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
