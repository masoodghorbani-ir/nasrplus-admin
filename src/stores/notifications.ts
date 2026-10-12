import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastNotification {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<ToastNotification[]>([]);

  function show(toast: Omit<ToastNotification, 'id'>): string {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const duration = toast.duration ?? 4500;

    const newToast: ToastNotification = {
      ...toast,
      id,
    };

    notifications.value.push(newToast);

    if (duration > 0) {
      setTimeout(() => {
        remove(id);
      }, duration);
    }

    return id;
  }

  function success(message: string, title?: string): string {
    return show({ type: 'success', message, title });
  }

  function error(message: string, title?: string): string {
    return show({ type: 'error', message, title: title || 'خطا در عملیات' });
  }

  function warning(message: string, title?: string): string {
    return show({ type: 'warning', message, title: title || 'هشدار' });
  }

  function info(message: string, title?: string): string {
    return show({ type: 'info', message, title: title || 'اطلاعیه' });
  }

  function remove(id: string): void {
    const index = notifications.value.findIndex((n) => n.id === id);
    if (index !== -1) {
      notifications.value.splice(index, 1);
    }
  }

  function clearAll(): void {
    notifications.value = [];
  }

  return {
    notifications,
    show,
    success,
    error,
    warning,
    info,
    remove,
    clearAll,
  };
});
