<script setup lang="ts">
import { useNotificationStore } from '@/stores';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-vue-next';

const notificationStore = useNotificationStore();

function getIcon(type: string) {
  switch (type) {
    case 'success':
      return CheckCircle2;
    case 'error':
      return AlertCircle;
    case 'warning':
      return AlertTriangle;
    case 'info':
    default:
      return Info;
  }
}

function getStyles(type: string) {
  switch (type) {
    case 'success':
      return {
        border: 'border-emerald-200 dark:border-emerald-800',
        bg: 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-100',
        icon: 'text-emerald-600 dark:text-emerald-400',
      };
    case 'error':
      return {
        border: 'border-rose-200 dark:border-rose-800',
        bg: 'bg-rose-50 dark:bg-rose-950/90 text-rose-900 dark:text-rose-100',
        icon: 'text-rose-600 dark:text-rose-400',
      };
    case 'warning':
      return {
        border: 'border-amber-200 dark:border-amber-800',
        bg: 'bg-amber-50 dark:bg-amber-950/90 text-amber-900 dark:text-amber-100',
        icon: 'text-amber-600 dark:text-amber-400',
      };
    case 'info':
    default:
      return {
        border: 'border-blue-200 dark:border-blue-800',
        bg: 'bg-blue-50 dark:bg-blue-950/90 text-blue-900 dark:text-blue-100',
        icon: 'text-blue-600 dark:text-blue-400',
      };
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed bottom-4 left-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      dir="rtl"
    >
      <TransitionGroup
        enter-active-class="transition duration-300 ease-out transform"
        enter-from-class="opacity-0 translate-y-3 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-200 ease-in transform"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-for="toast in notificationStore.notifications"
          :key="toast.id"
          :class="[
            'pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all',
            getStyles(toast.type).bg,
            getStyles(toast.type).border,
          ]"
        >
          <component
            :is="getIcon(toast.type)"
            :class="['w-5 h-5 shrink-0 mt-0.5', getStyles(toast.type).icon]"
          />

          <div class="flex-1 text-right text-xs">
            <h4 v-if="toast.title" class="font-bold text-sm mb-0.5">
              {{ toast.title }}
            </h4>
            <p class="leading-relaxed opacity-90">
              {{ toast.message }}
            </p>
          </div>

          <button
            type="button"
            class="p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            @click="notificationStore.remove(toast.id)"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
