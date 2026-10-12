<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue';
import { X } from 'lucide-vue-next';

interface Props {
  open: boolean;
  title?: string;
  subtitle?: string;
  width?: string;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  width: 'max-w-2xl',
});

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'close'): void;
}>();

function close() {
  emit('update:open', false);
  emit('close');
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) {
    close();
  }
}

watch(
  () => props.open,
  (val) => {
    if (val) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
);

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  if (props.open) {
    document.body.style.overflow = 'hidden';
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 overflow-hidden"
      dir="rtl"
    >
      <!-- Backdrop -->
      <Transition
        enter-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          class="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm"
          @click="close"
        />
      </Transition>

      <div class="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
        <!-- Sliding panel -->
        <Transition
          enter-active-class="transform transition ease-out duration-300"
          enter-from-class="translate-x-full"
          enter-to-class="translate-x-0"
          leave-active-class="transform transition ease-in duration-200"
          leave-from-class="translate-x-0"
          leave-to-class="translate-x-full"
        >
          <div
            :class="[
              'w-screen bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 pointer-events-auto flex flex-col',
              width,
            ]"
          >
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
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
                type="button"
                class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                @click="close"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto p-6">
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
        </Transition>
      </div>
    </div>
  </Teleport>
</template>
