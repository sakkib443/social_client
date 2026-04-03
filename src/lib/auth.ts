import api from './api';
import Cookies from 'js-cookie';
import type { ApiResponse, AuthResponse, RegisterInput, LoginInput, User } from '@/types';

export const authService = {
  // Register
  async register(data: RegisterInput): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    
    if (response.data.success && response.data.data) {
      const { token, user } = response.data.data;
      Cookies.set('token', token, { expires: 7 }); // 7 days
      return { token, user };
    }
    
    throw new Error(response.data.message || 'Registration failed');
  },

  // Login
  async login(data: LoginInput): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    
    if (response.data.success && response.data.data) {
      const { token, user } = response.data.data;
      Cookies.set('token', token, { expires: 7 }); // 7 days
      return { token, user };
    }
    
    throw new Error(response.data.message || 'Login failed');
  },

  // Get current user
  async getMe(): Promise<User> {
    const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    
    if (response.data.success && response.data.data) {
      return response.data.data.user;
    }
    
    throw new Error(response.data.message || 'Failed to get user');
  },

  // Google Login
  async googleLogin(credential: string): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/google', { credential });
    
    if (response.data.success && response.data.data) {
      const { token, user } = response.data.data;
      Cookies.set('token', token, { expires: 7 });
      return { token, user };
    }
    
    throw new Error(response.data.message || 'Google login failed');
  },

  // Logout
  logout(): void {
    Cookies.remove('token');
    window.location.href = '/login';
  },

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!Cookies.get('token');
  },

  // Get token
  getToken(): string | undefined {
    return Cookies.get('token');
  },
};
