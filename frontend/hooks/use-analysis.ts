'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Analysis, UserSummary } from '@/types';

export function usePostAnalysis(postId: string) {
  return useQuery({
    queryKey: ['analysis', postId],
    queryFn: () => api.get<Analysis>(`/api/v1/analyses/post/${postId}`),
    enabled: !!postId,
    retry: false,
  });
}

export function useCreateAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) =>
      api.post<Analysis>('/api/v1/analyses/create', { post_id: postId }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['analysis', data.post_id] });
    },
  });
}

export function useUserSummary() {
  return useQuery({
    queryKey: ['userSummary'],
    queryFn: () => api.get<UserSummary>('/api/v1/analyses/user/summary'),
  });
}
