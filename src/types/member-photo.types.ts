// Member profile entity summary with photo
export interface IMemberSummary {
  _id: string;
  memberCode: string;
  nationalCode?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  profileImage?: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REJECTED';
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

// API standard wrapper
export interface IApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

// State of the photo uploader component
export interface IPhotoUploaderState {
  isUploading: boolean;
  progress: number;
  previewUrl: string | null;
  selectedFile: File | null;
  error: string | null;
}

// Cropping configuration options
export interface ICropModalOptions {
  aspectRatio: number; // e.g. 3 / 4 (Portrait) or 1 (Square)
  maxWidth?: number;   // e.g. 1200
  maxHeight?: number;  // e.g. 1600
  outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
  quality?: number;    // 0.85 to 0.95
}
