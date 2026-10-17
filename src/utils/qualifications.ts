import type { Member, AcademicQualification } from '@/types';

const STORAGE_PREFIX = 'nasrplus_member_quals_';

/**
 * Get all qualifications stored locally for a member
 */
export function getStoredMemberQualifications(memberId: string): AcademicQualification[] {
  if (!memberId) return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${memberId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore JSON parse errors
  }
  return [];
}

/**
 * Persist qualifications locally for a member
 */
export function setStoredMemberQualifications(
  memberId: string,
  qualifications: AcademicQualification[]
): void {
  if (!memberId) return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${memberId}`, JSON.stringify(qualifications));
  } catch {
    // Storage quota or disabled
  }
}

/**
 * Remove stored qualifications for a member
 */
export function removeStoredMemberQualifications(memberId: string): void {
  if (!memberId) return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${memberId}`);
  } catch {
    // Ignore
  }
}

/**
 * Extract degree level title for the member's latest qualification
 */
export function getMemberLatestDegreeTitle(
  member: Member | null | undefined,
  lookupsStore: {
    academicQualifications: AcademicQualification[];
    getDegreeLevelTitle: (idOrObj: any) => string;
  }
): string {
  if (!member) return '';

  // 1. Check member.latestAcademicQualifications (object form)
  if (member.latestAcademicQualifications) {
    const raw = member.latestAcademicQualifications;
    if (typeof raw === 'object' && raw.degreeLevel) {
      const title = lookupsStore.getDegreeLevelTitle(raw.degreeLevel);
      if (title && title !== '—') return title;
    }

    // 2. Check member.latestAcademicQualifications (string ID form) in lookups store
    if (typeof raw === 'string') {
      const foundInStore = lookupsStore.academicQualifications.find((q) => q._id === raw);
      if (foundInStore?.degreeLevel) {
        const title = lookupsStore.getDegreeLevelTitle(foundInStore.degreeLevel);
        if (title && title !== '—') return title;
      }
    }
  }

  // 3. Check member.academicQualifications array if present
  if (Array.isArray(member.academicQualifications) && member.academicQualifications.length > 0) {
    const latest =
      member.academicQualifications.find((q) => q.isLatest) ||
      member.academicQualifications[member.academicQualifications.length - 1];
    if (latest?.degreeLevel) {
      const title = lookupsStore.getDegreeLevelTitle(latest.degreeLevel);
      if (title && title !== '—') return title;
    }
  }

  // 4. Check locally stored qualifications
  if (member._id) {
    const localQuals = getStoredMemberQualifications(member._id);
    if (localQuals.length > 0) {
      // Find one marked isLatest, or latest by graduationYear, or last added
      const latest =
        localQuals.find((q) => q.isLatest) ||
        [...localQuals].sort((a, b) => (Number(b.graduationYear) || 0) - (Number(a.graduationYear) || 0))[0] ||
        localQuals[localQuals.length - 1];

      if (latest?.degreeLevel) {
        const title = lookupsStore.getDegreeLevelTitle(latest.degreeLevel);
        if (title && title !== '—') return title;
      }
    }
  }

  return '';
}
