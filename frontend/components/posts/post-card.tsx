'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Post } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Edit, Trash2 } from 'lucide-react';
import { useDeletePost } from '@/hooks/use-posts';
import { api } from '@/lib/api';

interface PostCardProps {
  post: Post;
}

const moodEmojis: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  excited: '🎉',
  calm: '😌',
  anxious: '😰',
  motivated: '💪',
  tired: '😴',
};

export function PostCard({ post }: PostCardProps) {
  const deletePost = useDeletePost();
  const imageUrl = api.getImageUrl(post.image_url);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm('Are you sure you want to delete this post?')) {
      await deletePost.mutateAsync(post.id);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden">
      <Link href={`/posts/${post.id}`}>
        {imageUrl && (
          <div className="relative h-40 w-full">
            <Image
              src={imageUrl}
              alt={post.title || 'Post image'}
              fill
              className="object-cover"
            />
          </div>
        )}
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg line-clamp-1">
              {post.title || 'Untitled'}
            </CardTitle>
            {post.mood && (
              <Badge variant="secondary" className="ml-2">
                {moodEmojis[post.mood] || ''} {post.mood}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm line-clamp-3">
            {post.content}
          </p>
        </CardContent>
      </Link>
      <CardFooter className="flex items-center justify-between pt-0">
        <div className="flex items-center text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 mr-1" />
          {new Date(post.created_at).toLocaleDateString()}
        </div>
        <div className="flex gap-1">
          <Link href={`/posts/${post.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={handleDelete}
            disabled={deletePost.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
