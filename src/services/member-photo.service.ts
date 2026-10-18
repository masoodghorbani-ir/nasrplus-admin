import axios from 'axios';
import type { IMemberSummary, IApiResponse } from '@/types/member-photo.types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const apiClient = axios.create({
  baseURL: BASE_URL,
});

// Attach Authorization header (supports nasrplus_member_token, nasrplus_token, and token keys)
apiClient.interceptors.request.use((config) => {
  const isProfile = typeof window !== 'undefined' && window.location.pathname.startsWith('/profile');
  const memberToken = localStorage.getItem('nasrplus_member_token');
  const adminToken = localStorage.getItem('nasrplus_token') || localStorage.getItem('token');
  const token = isProfile ? (memberToken || adminToken) : (adminToken || memberToken);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Uploads cropped member personal photo file
 * POST /api/v1/members/:id/photo
 */
export async function uploadMemberPhoto(
  memberId: string,
  file: File | Blob,
  onProgress?: (percent: number) => void
): Promise<IMemberSummary> {
  const formData = new FormData();
  formData.append('photo', file, 'member-photo.jpg');

  const response = await apiClient.post<IApiResponse<IMemberSummary>>(
    `/members/${memberId}/photo`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    }
  );

  return response.data.data;
}

/**
 * Removes member personal photo
 * DELETE /api/v1/members/:id/photo
 */
export async function deleteMemberPhoto(memberId: string): Promise<IMemberSummary> {
  const response = await apiClient.delete<IApiResponse<IMemberSummary>>(
    `/members/${memberId}/photo`
  );
  return response.data.data;
}

/**
 * Resolves static URL with cache-busting timestamp
 */
export function resolvePhotoUrl(path?: string | null, timestamp?: number): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return timestamp ? `${path}${path.includes('?') ? '&' : '?'}t=${timestamp}` : path;
  }
  const baseUrl =
    import.meta.env.VITE_SERVER_URL ||
    (import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, '')
      : '') ||
    'http://localhost:5000';
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');
  const url = `${cleanBase}/${cleanPath}`;
  return timestamp ? `${url}?t=${timestamp}` : url;
}

/**
 * Helper to get the full static photo URL (null if empty)
 */
export function getPhotoFullUrl(profileImage?: string | null, timestamp?: number): string | null {
  if (!profileImage) return null;
  return resolvePhotoUrl(profileImage, timestamp);
}
