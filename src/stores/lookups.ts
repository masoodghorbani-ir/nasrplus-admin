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
  AddressType,
  Province,
  City,
} from '@/types';

export const useLookupsStore = defineStore('lookups', () => {
  const membershipTypes = ref<MembershipType[]>([]);
  const specializations = ref<Specialization[]>([]);
  const ranks = ref<Rank[]>([]);
  const natureOfMemberships = ref<NatureOfMembership[]>([]);
  const academicFields = ref<AcademicField[]>([]);
  const degreeLevels = ref<DegreeLevel[]>([]);
  const academicQualifications = ref<AcademicQualification[]>([]);
  const addressTypes = ref<AddressType[]>([]);
  const provinces = ref<Province[]>([]);
  const cities = ref<City[]>([]);

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
        addrTypesRes,
        provincesRes,
        citiesRes,
      ] = await Promise.allSettled([
        lookupsApi.getMembershipTypes(),
        lookupsApi.getSpecializations(),
        lookupsApi.getRanks(),
        lookupsApi.getNatureOfMemberships(),
        lookupsApi.getAcademicFields(),
        lookupsApi.getDegreeLevels(),
        lookupsApi.getAcademicQualifications(),
        lookupsApi.getAddressTypes(),
        lookupsApi.getProvinces(),
        lookupsApi.getCities(),
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
      if (addrTypesRes.status === 'fulfilled' && addrTypesRes.value.success) {
        addressTypes.value = addrTypesRes.value.data || [];
      }
      if (provincesRes.status === 'fulfilled' && provincesRes.value.success) {
        provinces.value = provincesRes.value.data || [];
      }
      if (citiesRes.status === 'fulfilled' && citiesRes.value.success) {
        cities.value = citiesRes.value.data || [];
      }

      isLoaded.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchCities(provinceId?: string): Promise<City[]> {
    try {
      const res = await lookupsApi.getCities(provinceId);
      if (res.success && res.data) {
        if (!provinceId) {
          cities.value = res.data;
        } else {
          // Merge or replace
          const existingOther = cities.value.filter((c) => {
            const pId = typeof c.provinceId === 'object' ? c.provinceId?._id : c.provinceId;
            return pId !== provinceId;
          });
          cities.value = [...existingOther, ...res.data];
        }
        return res.data;
      }
    } catch {
      // Fallback
    }
    return [];
  }

  function getCitiesByProvinceId(provinceId: string): City[] {
    if (!provinceId) return cities.value;
    return cities.value.filter((c) => {
      const pId = typeof c.provinceId === 'object' ? c.provinceId?._id : c.provinceId;
      return pId === provinceId;
    });
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

  function getAddressTypeTitle(idOrObj: string | AddressType | undefined | null): string {
    if (!idOrObj) return '—';
    if (typeof idOrObj === 'object' && idOrObj.title) return idOrObj.title;
    const item = addressTypes.value.find((x) => x._id === idOrObj);
    return item?.title || String(idOrObj);
  }

  function getProvinceTitle(idOrObj: string | Province | undefined | null): string {
    if (!idOrObj) return '—';
    if (typeof idOrObj === 'object') return idOrObj.title || idOrObj.name || '—';
    const item = provinces.value.find((x) => x._id === idOrObj);
    return item?.title || item?.name || String(idOrObj);
  }

  function getCityTitle(idOrObj: string | City | undefined | null): string {
    if (!idOrObj) return '—';
    if (typeof idOrObj === 'object') return idOrObj.title || idOrObj.name || '—';
    const item = cities.value.find((x) => x._id === idOrObj);
    return item?.title || item?.name || String(idOrObj);
  }

  function getAcademicFieldTitle(idOrObj: string | AcademicField | undefined | null): string {
    if (!idOrObj) return '—';
    if (typeof idOrObj === 'object' && idOrObj.title) return idOrObj.title;
    const item = academicFields.value.find((x) => x._id === idOrObj);
    return item?.title || '—';
  }

  function getDegreeLevelTitle(idOrObj: string | DegreeLevel | undefined | null): string {
    if (!idOrObj) return '—';
    if (typeof idOrObj === 'object' && idOrObj.title) return idOrObj.title;
    const item = degreeLevels.value.find((x) => x._id === idOrObj);
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
    addressTypes,
    provinces,
    cities,
    isLoading,
    isLoaded,
    fetchAllLookups,
    fetchCities,
    getCitiesByProvinceId,
    getMembershipTypeTitle,
    getSpecializationTitle,
    getRankTitle,
    getNatureTitle,
    getAddressTypeTitle,
    getProvinceTitle,
    getCityTitle,
    getAcademicFieldTitle,
    getDegreeLevelTitle,
  };
});
