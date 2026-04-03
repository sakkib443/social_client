import api from './api';
import type { ApiResponse } from '@/types';

export interface UploadResult {
  url: string;
  publicId: string;
}

export const uploadService = {
  // Upload image
  async uploadImage(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post<ApiResponse<UploadResult>>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to upload image');
  },
};
