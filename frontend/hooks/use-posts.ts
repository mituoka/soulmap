'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Post, PostCreate, PostUpdate, PostListResponse, PostFilters } from '@/types';

export function usePosts(page: number = 1, filters: PostFilters = {}) {
  return useQuery({
    queryKey: ['posts', page, filters],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page) });
      if (filters.search) params.set('search', filters.search);
      if (filters.mood) params.set('mood', filters.mood);
      if (filters.date_from) params.set('date_from', filters.date_from);
      if (filters.date_to) params.set('date_to', filters.date_to);
      return api.get<PostListResponse>(`/api/v1/posts?${params.toString()}`);
    },
  });
}

export function usePost(postId: string) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: () => api.get<Post>(`/api/v1/posts/${postId}`),
    enabled: !!postId,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PostCreate) => api.post<Post>('/api/v1/posts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PostUpdate }) =>
      api.put<Post>(`/api/v1/posts/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.id] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/posts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
