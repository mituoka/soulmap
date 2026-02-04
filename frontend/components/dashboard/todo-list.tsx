'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useTodos, useCreateTodo, useUpdateTodo, useDeleteTodo } from '@/hooks/use-todos';
import { Plus, Trash2, ListTodo } from 'lucide-react';

export function TodoList() {
  const today = new Date().toISOString().split('T')[0];
  const [newTodo, setNewTodo] = useState('');

  const { data: todos = [], isLoading } = useTodos(today);
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const handleAdd = async () => {
    if (!newTodo.trim()) return;

    await createTodo.mutateAsync({
      title: newTodo.trim(),
      date: today,
    });
    setNewTodo('');
  };

  const handleToggle = async (id: number, completed: boolean) => {
    await updateTodo.mutateAsync({
      id,
      data: { completed: !completed },
    });
  };

  const handleDelete = async (id: number) => {
    await deleteTodo.mutateAsync(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // IME変換中は送信しない
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      handleAdd();
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ListTodo className="h-5 w-5" />
          Today&apos;s TODO
          {todos.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({completedCount}/{todos.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="新しいタスクを追加..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={createTodo.isPending}
          />
          <Button
            size="icon"
            onClick={handleAdd}
            disabled={!newTodo.trim() || createTodo.isPending}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        ) : todos.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            タスクがありません
          </p>
        ) : (
          <ul className="space-y-2">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center gap-2 group"
              >
                <Checkbox
                  checked={todo.completed}
                  onCheckedChange={() => handleToggle(todo.id, todo.completed)}
                />
                <span
                  className={`flex-1 text-sm ${
                    todo.completed ? 'line-through text-muted-foreground' : ''
                  }`}
                >
                  {todo.title}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(todo.id)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
