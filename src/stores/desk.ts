import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { lookupsApi, membersApi } from '@/api';

export const useDeskStore = defineStore('desk', () => {
  const pendingQualificationsCount = ref<number>(0);
  const pendingSkillsCount = ref<number>(0);
  const isLoading = ref<boolean>(false);
  const hasLoaded = ref<boolean>(false);

  const totalPendingCount = computed<number>(() => {
    return pendingQualificationsCount.value + pendingSkillsCount.value;
  });

  async function fetchPendingCounts(force = false): Promise<void> {
    if (hasLoaded.value && !force && (pendingQualificationsCount.value > 0 || pendingSkillsCount.value > 0)) {
      // Background re-fetch without blocking
    }
    isLoading.value = true;
    try {
      const [qualRes, skillsRes] = await Promise.allSettled([
        lookupsApi.getAcademicQualifications(),
        membersApi.getAllSkills(),
      ]);

      if (qualRes.status === 'fulfilled' && qualRes.value?.success && Array.isArray(qualRes.value.data)) {
        const count = qualRes.value.data.filter((q: any) => {
          const st = q.verificationStatus;
          return st !== 'APPROVED' && st !== 'REJECTED';
        }).length;
        pendingQualificationsCount.value = count;
      }

      if (skillsRes.status === 'fulfilled' && skillsRes.value?.success && Array.isArray(skillsRes.value.data)) {
        const count = skillsRes.value.data.filter((s: any) => {
          const st = s.verificationStatus;
          return st === 'PENDING';
        }).length;
        pendingSkillsCount.value = count;
      }

      hasLoaded.value = true;
    } catch {
      // Graceful fallback
    } finally {
      isLoading.value = false;
    }
  }

  function setPendingQualificationsCount(count: number) {
    pendingQualificationsCount.value = Math.max(0, count);
  }

  function setPendingSkillsCount(count: number) {
    pendingSkillsCount.value = Math.max(0, count);
  }

  function decrementQualifications() {
    if (pendingQualificationsCount.value > 0) {
      pendingQualificationsCount.value--;
    }
  }

  function decrementSkills() {
    if (pendingSkillsCount.value > 0) {
      pendingSkillsCount.value--;
    }
  }

  return {
    pendingQualificationsCount,
    pendingSkillsCount,
    totalPendingCount,
    isLoading,
    hasLoaded,
    fetchPendingCounts,
    setPendingQualificationsCount,
    setPendingSkillsCount,
    decrementQualifications,
    decrementSkills,
  };
});
