'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { usePosts } from '@/hooks/use-posts';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/posts/post-card';
import { PenLine, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function PostsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePosts(page);

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

  const totalPages = data ? Math.ceil(data.total / data.per_page) : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Your Posts</h1>
          <p className="text-muted-foreground">
            {data?.total || 0} posts in your journal
          </p>
        </div>
        <Link href="/posts/new">
          <Button>
            <PenLine className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : data?.posts.length ? (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {data.posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
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
  );
}
