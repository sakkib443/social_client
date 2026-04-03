// User types
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// Post types
export interface Post {
  _id: string;
  content?: string;
  imageUrl?: string;
  isPrivate: boolean;
  author: User;
  createdAt: string;
  updatedAt: string;
  _count: {
    likes: number;
    comments: number;
  };
  isLikedByMe: boolean;
}

// Comment types
export interface Comment {
  _id: string;
  content: string;
  author: User;
  post: string;
  parent?: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    likes: number;
    replies: number;
  };
  isLikedByMe: boolean;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface PaginatedResponse<T> {
  posts: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface LikeResponse {
  liked: boolean;
  likeCount: number;
}

export interface LikersResponse {
  users: User[];
  total: number;
  hasMore: boolean;
}

// Form input types
export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreatePostInput {
  content?: string;
  imageUrl?: string;
  isPrivate: boolean;
}

export interface CreateCommentInput {
  content: string;
}
