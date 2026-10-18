import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { memberPortalApi } from '@/api';
import type { Member } from '@/types';
import { extractErrorMessage } from '@/utils/errors';

function getInitialMember(): Member | null {
  const saved = localStorage.getItem('nasrplus_current_member');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
}

export const useMemberAuthStore = defineStore('memberAuth', () => {
  const token = ref<string | null>(localStorage.getItem('nasrplus_member_token'));
  const member = ref<Member | null>(getInitialMember());
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const photoTimestamp = ref<number>(Date.now());

  const isAuthenticated = computed(() => Boolean(token.value && member.value));
  const memberId = computed(() => member.value?._id || '');

  const memberFullName = computed(() => {
    if (!member.value) return '';
    const name = `${member.value.firstName || ''} ${member.value.lastName || ''}`.trim();
    return name || `عضو نظام صنفی (${member.value.memberCode})`;
  });

  const memberCode = computed(() => member.value?.memberCode || '');
  const nationalCode = computed(() => member.value?.nationalCode || '');

  /**
   * Status details helper
   */
  const statusConfig = computed(() => {
    const status = member.value?.status || 'PENDING';
    switch (status) {
      case 'ACTIVE':
        return {
          label: 'عضو فعال و معتبر',
          variant: 'success' as const,
          bgClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          dotClass: 'bg-emerald-500',
        };
      case 'PENDING':
        return {
          label: 'در انتظار بررسی پرونده',
          variant: 'warning' as const,
          bgClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          dotClass: 'bg-amber-500',
        };
      case 'SUSPENDED':
        return {
          label: 'معلق',
          variant: 'warning' as const,
          bgClass: 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
          dotClass: 'bg-orange-500',
        };
      case 'EXPIRED':
        return {
          label: 'منقضی شده',
          variant: 'danger' as const,
          bgClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
          dotClass: 'bg-rose-500',
        };
      case 'REJECTED':
        return {
          label: 'رد شده',
          variant: 'danger' as const,
          bgClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
          dotClass: 'bg-rose-500',
        };
      default:
        return {
          label: status,
          variant: 'secondary' as const,
          bgClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          dotClass: 'bg-slate-400',
        };
    }
  });

  /**
   * Log into member portal
   */
  async function login(memberCodeInput: string, nationalCodeInput: string): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await memberPortalApi.login({
        memberCode: memberCodeInput.trim(),
        nationalCode: nationalCodeInput.trim(),
      });

      if (response.success && response.data) {
        token.value = response.data.token;
        member.value = response.data.member;
        photoTimestamp.value = Date.now();

        localStorage.setItem('nasrplus_member_token', response.data.token);
        localStorage.setItem('nasrplus_current_member', JSON.stringify(response.data.member));
        return true;
      } else {
        error.value = response.message || 'اطلاعات ورود نامعتبر است';
        return false;
      }
    } catch (err: any) {
      error.value = extractErrorMessage(
        err,
        'کد عضویت یا کد ملی وارد شده اشتباه است یا عضوی با این مشخصات یافت نشد'
      );
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Re-fetch the full latest profile from backend
   */
  async function fetchProfile(): Promise<void> {
    if (!token.value || !member.value?._id) return;

    try {
      const response = await memberPortalApi.getProfile(member.value._id);
      if (response.success && response.data) {
        member.value = response.data;
        localStorage.setItem('nasrplus_current_member', JSON.stringify(response.data));
      }
    } catch {
      // Ignore background refresh failure
    }
  }

  /**
   * Update member local representation
   */
  function updateCurrentMember(updatedMember: Partial<Member>): void {
    if (!member.value) return;
    member.value = { ...member.value, ...updatedMember };
    localStorage.setItem('nasrplus_current_member', JSON.stringify(member.value));
  }

  /**
   * Update member personal photo
   */
  async function updatePhoto(file: File | Blob): Promise<boolean> {
    if (!member.value?._id) return false;
    isLoading.value = true;
    try {
      const response = await memberPortalApi.updatePhoto(member.value._id, file);
      if (response.success && response.data) {
        member.value = {
          ...member.value,
          profileImage: response.data.profileImage,
        };
        photoTimestamp.value = Date.now();
        localStorage.setItem('nasrplus_current_member', JSON.stringify(member.value));
        return true;
      }
      return false;
    } catch (err) {
      error.value = extractErrorMessage(err, 'خطا در بارگذاری تصویر پرسنلی');
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Delete member personal photo
   */
  async function deletePhoto(): Promise<boolean> {
    if (!member.value?._id) return false;
    isLoading.value = true;
    try {
      const response = await memberPortalApi.deletePhoto(member.value._id);
      if (response.success) {
        member.value = {
          ...member.value,
          profileImage: '',
        };
        photoTimestamp.value = Date.now();
        localStorage.setItem('nasrplus_current_member', JSON.stringify(member.value));
        return true;
      }
      return false;
    } catch (err) {
      error.value = extractErrorMessage(err, 'خطا در حذف تصویر پرسنلی');
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Logout member
   */
  function logout(): void {
    token.value = null;
    member.value = null;
    error.value = null;
    localStorage.removeItem('nasrplus_member_token');
    localStorage.removeItem('nasrplus_current_member');
  }

  /**
   * Rehydrate member auth on startup
   */
  function initAuth(): void {
    const savedToken = localStorage.getItem('nasrplus_member_token');
    const savedMember = localStorage.getItem('nasrplus_current_member');

    if (savedToken && savedMember) {
      token.value = savedToken;
      try {
        member.value = JSON.parse(savedMember);
      } catch {
        logout();
      }
    }
  }

  return {
    token,
    member,
    isLoading,
    error,
    photoTimestamp,
    isAuthenticated,
    memberId,
    memberFullName,
    memberCode,
    nationalCode,
    statusConfig,
    login,
    fetchProfile,
    updateCurrentMember,
    updatePhoto,
    deletePhoto,
    logout,
    initAuth,
  };
});
