import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '@/api';
import type { AdminUser, LoginCredentials, Permission } from '@/types';
import { extractErrorMessage } from '@/utils/errors';

function getInitialUser(): AdminUser | null {
  const saved = localStorage.getItem('nasrplus_user');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('nasrplus_token'));
  const user = ref<AdminUser | null>(getInitialUser());

  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => Boolean(token.value && user.value));
  const isSuperAdmin = computed(() => user.value?.type === 'SUPERADMIN');

  async function login(credentials: LoginCredentials): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await authApi.login(credentials);
      if (response.success && response.data) {
        token.value = response.data.token;
        user.value = response.data.admin;

        localStorage.setItem('nasrplus_token', response.data.token);
        localStorage.setItem('nasrplus_user', JSON.stringify(response.data.admin));

        return true;
      } else {
        error.value = response.message || 'خطا در ورود به سامانه';
        return false;
      }
    } catch (err) {
      error.value = extractErrorMessage(err, 'نام کاربری یا رمز عبور اشتباه است');
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchProfile(): Promise<void> {
    if (!token.value) return;

    try {
      const response = await authApi.getProfile();
      if (response.success && response.data) {
        user.value = response.data;
        localStorage.setItem('nasrplus_user', JSON.stringify(response.data));
      }
    } catch {
      // If profile fails due to 401, client interceptor will handle it
    }
  }

  function logout(): void {
    token.value = null;
    user.value = null;
    localStorage.removeItem('nasrplus_token');
    localStorage.removeItem('nasrplus_user');
  }

  function hasPermission(permissionKey: string): boolean {
    if (!user.value) return false;
    if (user.value.type === 'SUPERADMIN') return true;

    if (!user.value.permissions) return false;

    return user.value.permissions.some((p: Permission | string) => {
      if (typeof p === 'string') return p === permissionKey;
      return p.key === permissionKey;
    });
  }

  function initAuth(): void {
    const savedToken = localStorage.getItem('nasrplus_token');
    const savedUser = localStorage.getItem('nasrplus_user');

    if (savedToken && savedUser) {
      token.value = savedToken;
      try {
        user.value = JSON.parse(savedUser);
      } catch {
        logout();
      }
    }
  }

  return {
    token,
    user,
    isLoading,
    error,
    isAuthenticated,
    isSuperAdmin,
    login,
    logout,
    fetchProfile,
    hasPermission,
    initAuth,
  };
});
