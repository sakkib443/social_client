import api from './api';
import type { ApiResponse, User } from '@/types';

export interface FriendRequest {
  _id: string;
  sender: User;
  receiver: User;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export const friendService = {
  async sendRequest(userId: string): Promise<FriendRequest> {
    const response = await api.post<ApiResponse<FriendRequest>>(`/friends/request/${userId}`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.message || 'Failed to send request');
  },

  async acceptRequest(requestId: string): Promise<void> {
    const response = await api.put<ApiResponse>(`/friends/accept/${requestId}`);
    if (!response.data.success) throw new Error(response.data.message || 'Failed');
  },

  async rejectRequest(requestId: string): Promise<void> {
    const response = await api.put<ApiResponse>(`/friends/reject/${requestId}`);
    if (!response.data.success) throw new Error(response.data.message || 'Failed');
  },

  async getPendingRequests(): Promise<FriendRequest[]> {
    const response = await api.get<ApiResponse<{ requests: FriendRequest[] }>>('/friends/requests');
    if (response.data.success && response.data.data) return response.data.data.requests;
    return [];
  },

  async getFriends(): Promise<User[]> {
    const response = await api.get<ApiResponse<{ friends: User[] }>>('/friends');
    if (response.data.success && response.data.data) return response.data.data.friends;
    return [];
  },

  async getSuggestions(): Promise<User[]> {
    const response = await api.get<ApiResponse<{ suggestions: User[] }>>('/friends/suggestions');
    if (response.data.success && response.data.data) return response.data.data.suggestions;
    return [];
  },

  async removeFriend(friendId: string): Promise<void> {
    const response = await api.delete<ApiResponse>(`/friends/${friendId}`);
    if (!response.data.success) throw new Error(response.data.message || 'Failed');
  },

  async getSentRequests(): Promise<FriendRequest[]> {
    const response = await api.get<ApiResponse<{ requests: FriendRequest[] }>>('/friends/sent');
    if (response.data.success && response.data.data) return response.data.data.requests;
    return [];
  },

  async cancelRequest(requestId: string): Promise<void> {
    const response = await api.delete<ApiResponse>(`/friends/cancel/${requestId}`);
    if (!response.data.success) throw new Error(response.data.message || 'Failed');
  },
};
