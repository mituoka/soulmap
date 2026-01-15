'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Post, PostCreate, PostUpdate, PostListResponse } from '@/types';

export function usePosts(page: number = 1) {
  return useQuery({
    queryKey: ['posts', page],
    queryFn: () => api.get<PostListResponse>(`/api/v1/posts?page=${page}`),
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
