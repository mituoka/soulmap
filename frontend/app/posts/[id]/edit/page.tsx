'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { usePost } from '@/hooks/use-posts';
import { PostForm } from '@/components/posts/post-form';

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: post, isLoading: postLoading } = usePost(postId);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || postLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !post) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <PostForm post={post} isEditing />
    </div>
  );
}
