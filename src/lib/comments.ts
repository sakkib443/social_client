import api from './api';
import type { ApiResponse, Comment, LikeResponse, LikersResponse, CreateCommentInput } from '@/types';

export const commentService = {
  // Get comments for a post
  async getComments(postId: string): Promise<Comment[]> {
    const response = await api.get<ApiResponse<{ comments: Comment[] }>>(
      `/posts/${postId}/comments`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data.comments;
    }
    
    throw new Error(response.data.message || 'Failed to fetch comments');
  },

  // Get replies for a comment
  async getReplies(postId: string, commentId: string): Promise<Comment[]> {
    const response = await api.get<ApiResponse<{ replies: Comment[] }>>(
      `/posts/${postId}/comments/${commentId}/replies`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data.replies;
    }
    
    throw new Error(response.data.message || 'Failed to fetch replies');
  },

  // Create comment
  async createComment(postId: string, data: CreateCommentInput): Promise<Comment> {
    const response = await api.post<ApiResponse<{ comment: Comment }>>(
      `/posts/${postId}/comments`,
      data
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data.comment;
    }
    
    throw new Error(response.data.message || 'Failed to create comment');
  },

  // Create reply
  async createReply(postId: string, commentId: string, data: CreateCommentInput): Promise<Comment> {
    const response = await api.post<ApiResponse<{ reply: Comment }>>(
      `/posts/${postId}/comments/${commentId}/replies`,
      data
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data.reply;
    }
    
    throw new Error(response.data.message || 'Failed to create reply');
  },

  // Delete comment
  async deleteComment(postId: string, commentId: string): Promise<void> {
    const response = await api.delete<ApiResponse>(
      `/posts/${postId}/comments/${commentId}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete comment');
    }
  },

  // Toggle like on comment
  async toggleLike(postId: string, commentId: string): Promise<LikeResponse> {
    const response = await api.post<ApiResponse<LikeResponse>>(
      `/posts/${postId}/comments/${commentId}/like`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to toggle like');
  },

  // Get likers for a comment
  async getLikers(postId: string, commentId: string, page = 1, limit = 20): Promise<LikersResponse> {
    const response = await api.get<ApiResponse<LikersResponse>>(
      `/posts/${postId}/comments/${commentId}/likers?page=${page}&limit=${limit}`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch likers');
  },
};
