'use client';

/**
 * ダッシュボードページ
 *
 * ユーザーのホーム画面。以下を表示:
 * - TODOリスト（今日のタスク）
 * - 最近の投稿一覧
 *
 * 注意: このページではAI APIを呼び出さない（レート制限対策）
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { usePosts } from '@/hooks/use-posts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PostCard } from '@/components/posts/post-card';
import { TodoList } from '@/components/dashboard/todo-list';
import { PenLine, BookOpen } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: postsData, isLoading: postsLoading } = usePosts(1);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const recentPosts = postsData?.posts.slice(0, 3) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-end mb-6">
        <Link href="/posts/new">
          <Button>
            <PenLine className="h-4 w-4 mr-2" />
            新しい投稿
          </Button>
        </Link>
      </div>

      {/* Today's TODO */}
      <div className="mb-8">
        <TodoList />
      </div>

      {/* 最近の投稿 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">最近の投稿</h2>
          <Link href="/posts">
            <Button variant="ghost" size="sm">
              すべて見る
            </Button>
          </Link>
        </div>

        {postsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : recentPosts.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-4">
            {recentPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">まだ投稿がありません。最初の一歩を踏み出しましょう！</p>
              <Link href="/posts/new">
                <Button>最初の投稿を書く</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
