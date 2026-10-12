import { defineStore } from 'pinia';
import { ref } from 'vue';
import { lookupsApi } from '@/api';
import type {
  MembershipType,
  Specialization,
  Rank,
  NatureOfMembership,
  AcademicField,
  DegreeLevel,
  AcademicQualification,
} from '@/types';

export const useLookupsStore = defineStore('lookups', () => {
  const membershipTypes = ref<MembershipType[]>([]);
  const specializations = ref<Specialization[]>([]);
  const ranks = ref<Rank[]>([]);
  const natureOfMemberships = ref<NatureOfMembership[]>([]);
  const academicFields = ref<AcademicField[]>([]);
  const degreeLevels = ref<DegreeLevel[]>([]);
  const academicQualifications = ref<AcademicQualification[]>([]);

  const isLoading = ref(false);
  const isLoaded = ref(false);

  async function fetchAllLookups(forceRefresh = false): Promise<void> {
    if (isLoaded.value && !forceRefresh) return;

    isLoading.value = true;
    try {
      const [
        mTypesRes,
        specRes,
        ranksRes,
        natureRes,
        fieldsRes,
        degreeRes,
        qualRes,
      ] = await Promise.allSettled([
        lookupsApi.getMembershipTypes(),
        lookupsApi.getSpecializations(),
        lookupsApi.getRanks(),
        lookupsApi.getNatureOfMemberships(),
        lookupsApi.getAcademicFields(),
        lookupsApi.getDegreeLevels(),
        lookupsApi.getAcademicQualifications(),
      ]);

      if (mTypesRes.status === 'fulfilled' && mTypesRes.value.success) {
        membershipTypes.value = mTypesRes.value.data || [];
      }
      if (specRes.status === 'fulfilled' && specRes.value.success) {
        specializations.value = specRes.value.data || [];
      }
      if (ranksRes.status === 'fulfilled' && ranksRes.value.success) {
        ranks.value = ranksRes.value.data || [];
      }
      if (natureRes.status === 'fulfilled' && natureRes.value.success) {
        natureOfMemberships.value = natureRes.value.data || [];
      }
      if (fieldsRes.status === 'fulfilled' && fieldsRes.value.success) {
        academicFields.value = fieldsRes.value.data || [];
      }
      if (degreeRes.status === 'fulfilled' && degreeRes.value.success) {
        degreeLevels.value = degreeRes.value.data || [];
      }
      if (qualRes.status === 'fulfilled' && qualRes.value.success) {
        academicQualifications.value = qualRes.value.data || [];
      }

      isLoaded.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  // Lookup title helpers
  function getMembershipTypeTitle(idOrObj: string | MembershipType | undefined | null): string {
    if (!idOrObj) return '—';
    if (typeof idOrObj === 'object' && idOrObj.title) return idOrObj.title;
    const item = membershipTypes.value.find((x) => x._id === idOrObj);
    return item?.title || '—';
  }

  function getSpecializationTitle(idOrObj: string | Specialization | undefined | null): string {
    if (!idOrObj) return '—';
    if (typeof idOrObj === 'object' && idOrObj.title) return idOrObj.title;
    const item = specializations.value.find((x) => x._id === idOrObj);
    return item?.title || '—';
  }

  function getRankTitle(idOrObj: string | Rank | undefined | null): string {
    if (!idOrObj) return '—';
    if (typeof idOrObj === 'object' && idOrObj.title) return idOrObj.title;
    const item = ranks.value.find((x) => x._id === idOrObj);
    return item?.title || '—';
  }

  function getNatureTitle(idOrObj: string | NatureOfMembership | undefined | null): string {
    if (!idOrObj) return '—';
    if (typeof idOrObj === 'object' && idOrObj.title) return idOrObj.title;
    const item = natureOfMemberships.value.find((x) => x._id === idOrObj);
    return item?.title || '—';
  }

  return {
    membershipTypes,
    specializations,
    ranks,
    natureOfMemberships,
    academicFields,
    degreeLevels,
    academicQualifications,
    isLoading,
    isLoaded,
    fetchAllLookups,
    getMembershipTypeTitle,
    getSpecializationTitle,
    getRankTitle,
    getNatureTitle,
  };
});
