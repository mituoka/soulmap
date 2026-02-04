'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { usePosts } from '@/hooks/use-posts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PostCard } from '@/components/posts/post-card';
import { PenLine, BookOpen, Search, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PostFilters } from '@/types';

export default function PostsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<PostFilters>({});
  const [searchInput, setSearchInput] = useState('');
  const { data, isLoading } = usePosts(page, filters);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // デバウンス検索
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => {
        const next = { ...prev };
        if (searchInput) {
          next.search = searchInput;
        } else {
          delete next.search;
        }
        return next;
      });
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDateChange = (field: 'date_from' | 'date_to', value: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (value) {
        next[field] = value;
      } else {
        delete next[field];
      }
      return next;
    });
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchInput('');
    setPage(1);
  };

  const hasFilters = searchInput || filters.date_from || filters.date_to;

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
      <div className="flex items-center justify-between mb-6">
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

      {/* フィルタバー */}
      <div className="space-y-3 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search posts..."
              className="pl-9"
            />
          </div>
          <Input
            type="date"
            value={filters.date_from || ''}
            onChange={(e) => handleDateChange('date_from', e.target.value)}
            className="w-auto"
          />
          <span className="text-muted-foreground text-sm">~</span>
          <Input
            type="date"
            value={filters.date_to || ''}
            onChange={(e) => handleDateChange('date_to', e.target.value)}
            className="w-auto"
          />
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
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
            <p className="text-muted-foreground mb-4">
              {hasFilters ? 'No posts match your filters.' : 'No posts yet. Start your journey!'}
            </p>
            {!hasFilters && (
              <Link href="/posts/new">
                <Button>Write Your First Post</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
