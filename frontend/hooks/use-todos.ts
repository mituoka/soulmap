import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Todo, TodoCreate, TodoUpdate } from '@/types';

export function useTodos(date: string) {
  return useQuery({
    queryKey: ['todos', date],
    queryFn: () => api.get<Todo[]>(`/api/v1/todos?target_date=${date}`),
  });
}

export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TodoCreate) => api.post<Todo>('/api/v1/todos', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['todos', variables.date] });
    },
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TodoUpdate }) =>
      api.put<Todo>(`/api/v1/todos/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/v1/todos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}
