'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { usePosts } from '@/hooks/use-posts';
import { useUserSummary } from '@/hooks/use-analysis';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PostCard } from '@/components/posts/post-card';
import { PenLine, BookOpen, BarChart3 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { data: postsData, isLoading: postsLoading } = usePosts(1);
  const { data: summary } = useUserSummary();

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.username}!</h1>
          <p className="text-muted-foreground">Here&apos;s an overview of your journal</p>
        </div>
        <Link href="/posts/new">
          <Button>
            <PenLine className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{postsData?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Posts Analyzed</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_posts_analyzed || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Main Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {summary?.summary?.key_interests?.slice(0, 3).join(', ') || 'Start writing to discover'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      {summary?.summary?.overall_summary && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Journey So Far</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{summary.summary.overall_summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Recent Posts */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Posts</h2>
          <Link href="/posts">
            <Button variant="ghost" size="sm">
              View All
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
              <p className="text-muted-foreground mb-4">No posts yet. Start your journey!</p>
              <Link href="/posts/new">
                <Button>Write Your First Post</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
