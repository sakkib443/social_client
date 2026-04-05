import api from './api';
import type { ApiResponse, Post } from '@/types';

export const bookmarkService = {
  async toggleBookmark(postId: string): Promise<{ bookmarked: boolean }> {
    const response = await api.post<ApiResponse<{ bookmarked: boolean }>>(`/bookmarks/${postId}`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.message || 'Failed');
  },

  async getBookmarks(): Promise<Post[]> {
    const response = await api.get<ApiResponse<{ posts: Post[] }>>('/bookmarks');
    if (response.data.success && response.data.data) return response.data.data.posts;
    return [];
  },
};
