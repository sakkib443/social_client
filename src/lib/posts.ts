import api from './api';
import type { 
  ApiResponse, 
  Post, 
  PaginatedResponse, 
  LikeResponse, 
  LikersResponse,
  CreatePostInput 
} from '@/types';

export const postService = {
  // Get all posts
  async getPosts(page = 1, limit = 10): Promise<PaginatedResponse<Post>> {
    const response = await api.get<ApiResponse<PaginatedResponse<Post>>>(
      `/posts?page=${page}&limit=${limit}`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch posts');
  },

  // Get single post
  async getPost(id: string): Promise<Post> {
    const response = await api.get<ApiResponse<{ post: Post }>>(`/posts/${id}`);
    
    if (response.data.success && response.data.data) {
      return response.data.data.post;
    }
    
    throw new Error(response.data.message || 'Failed to fetch post');
  },

  // Create post
  async createPost(data: CreatePostInput): Promise<Post> {
    const response = await api.post<ApiResponse<{ post: Post }>>('/posts', data);
    
    if (response.data.success && response.data.data) {
      return response.data.data.post;
    }
    
    throw new Error(response.data.message || 'Failed to create post');
  },

  // Delete post
  async deletePost(id: string): Promise<void> {
    const response = await api.delete<ApiResponse>(`/posts/${id}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete post');
    }
  },

  // Toggle like
  async toggleLike(id: string): Promise<LikeResponse> {
    const response = await api.post<ApiResponse<LikeResponse>>(`/posts/${id}/like`);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to toggle like');
  },

  // Get likers
  async getLikers(id: string, page = 1, limit = 20): Promise<LikersResponse> {
    const response = await api.get<ApiResponse<LikersResponse>>(
      `/posts/${id}/likers?page=${page}&limit=${limit}`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch likers');
  },

  // SWR fetcher
  fetcher: async (url: string) => {
    const response = await api.get(url);
    return response.data.data;
  },
};
