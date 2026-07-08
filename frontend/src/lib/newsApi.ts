import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface News {
  id: string;
  title: string;
  content: string;
  summary?: string;
  source?: string;
  sourceUrl?: string;
  imageUrl?: string;
  relatedSymbols?: string[];
  category?: string;
  authorId?: string;
  viewCount: number;
  commentCount: number;
  reactionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  newsId: string;
  userId: string;
  content: string;
  parentId?: string;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Reaction {
  id: string;
  newsId: string;
  userId: string;
  type: 'like' | 'love' | 'insightful' | 'bullish' | 'bearish';
  createdAt: string;
}

export const newsApi = {
  // News endpoints
  getAllNews: (params?: { category?: string; symbol?: string; limit?: number; offset?: number }) =>
    axios.get<{ data: News[]; total: number }>(`${API_URL}/api/v1/news`, { params }),

  getTrendingNews: (limit = 10) =>
    axios.get<{ data: News[] }>(`${API_URL}/api/v1/news/trending`, { params: { limit } }),

  getNewsById: (id: string) =>
    axios.get<{ data: News }>(`${API_URL}/api/v1/news/${id}`),

  createNews: (data: { title: string; content: string; summary?: string; category?: string; relatedSymbols?: string[]; imageUrl?: string }) =>
    axios.post<{ data: News }>(`${API_URL}/api/v1/news`, data),

  deleteNews: (id: string) =>
    axios.delete(`${API_URL}/api/v1/news/${id}`),

  // Comment endpoints
  getComments: (newsId: string, params?: { limit?: number; offset?: number }) =>
    axios.get<{ data: Comment[]; total: number }>(`${API_URL}/api/v1/news/${newsId}/comments`, { params }),

  getReplies: (commentId: string) =>
    axios.get<{ data: Comment[] }>(`${API_URL}/api/v1/news/comments/${commentId}/replies`),

  createComment: (newsId: string, data: { content: string; parentId?: string }) =>
    axios.post<{ data: Comment }>(`${API_URL}/api/v1/news/${newsId}/comments`, data),

  deleteComment: (commentId: string) =>
    axios.delete(`${API_URL}/api/v1/news/comments/${commentId}`),

  // Reaction endpoints
  getReactions: (newsId: string) =>
    axios.get<{ data: Record<string, number> }>(`${API_URL}/api/v1/news/${newsId}/reactions`),

  getUserReaction: (newsId: string) =>
    axios.get<{ data: Reaction | null }>(`${API_URL}/api/v1/news/${newsId}/reactions/me`),

  toggleReaction: (newsId: string, type: Reaction['type']) =>
    axios.post<{ data: { added: boolean; reaction?: Reaction } }>(`${API_URL}/api/v1/news/${newsId}/reactions`, { type }),
};
