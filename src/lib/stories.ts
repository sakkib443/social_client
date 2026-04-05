import api from './api';
import type { ApiResponse, User } from '@/types';

export interface StoryGroup {
  author: User;
  stories: StoryItem[];
}

export interface StoryItem {
  _id: string;
  author: User;
  imageUrl: string;
  content?: string;
  expiresAt: string;
  createdAt: string;
}

export const storyService = {
  async getStories(): Promise<StoryGroup[]> {
    const response = await api.get<ApiResponse<{ stories: StoryGroup[] }>>('/stories');
    if (response.data.success && response.data.data) return response.data.data.stories;
    return [];
  },

  async createStory(data: { imageUrl: string; content?: string }): Promise<StoryItem> {
    const response = await api.post<ApiResponse<{ story: StoryItem }>>('/stories', data);
    if (response.data.success && response.data.data) return response.data.data.story;
    throw new Error(response.data.message || 'Failed to create story');
  },

  async deleteStory(id: string): Promise<void> {
    const response = await api.delete<ApiResponse>(`/stories/${id}`);
    if (!response.data.success) throw new Error(response.data.message || 'Failed');
  },
};
