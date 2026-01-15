'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Post, PostCreate, PostUpdate } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreatePost, useUpdatePost } from '@/hooks/use-posts';
import { api } from '@/lib/api';
import { ImagePlus, X, Loader2 } from 'lucide-react';

interface PostFormProps {
  post?: Post;
  isEditing?: boolean;
}

const moods = [
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
  { value: 'angry', label: 'Angry', emoji: '😠' },
  { value: 'excited', label: 'Excited', emoji: '🎉' },
  { value: 'calm', label: 'Calm', emoji: '😌' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'motivated', label: 'Motivated', emoji: '💪' },
  { value: 'tired', label: 'Tired', emoji: '😴' },
];

export function PostForm({ post, isEditing = false }: PostFormProps) {
  const router = useRouter();
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(post?.title || '');
  const [content, setContent] = useState(post?.content || '');
  const [mood, setMood] = useState(post?.mood || '');
  const [imageUrl, setImageUrl] = useState(post?.image_url || '');
  const [imagePreview, setImagePreview] = useState<string | null>(
    post?.image_url ? api.getImageUrl(post.image_url) : null
  );
  const [uploading, setUploading] = useState(false);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // プレビュー表示
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // アップロード
    setUploading(true);
    try {
      const result = await api.uploadImage(file);
      setImageUrl(result.url);
    } catch (error) {
      console.error('Upload failed:', error);
      setImagePreview(null);
      alert('画像のアップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: PostCreate | PostUpdate = {
      title: title || undefined,
      content,
      mood: mood || undefined,
      image_url: imageUrl || undefined,
    };

    try {
      if (isEditing && post) {
        await updatePost.mutateAsync({ id: post.id, data });
        router.push(`/posts/${post.id}`);
      } else {
        const newPost = await createPost.mutateAsync(data as PostCreate);
        router.push(`/posts/${newPost.id}`);
      }
    } catch (error) {
      console.error('Failed to save post:', error);
    }
  };

  const isPending = createPost.isPending || updatePost.isPending;

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Post' : 'New Post'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts..."
              required
              rows={8}
            />
          </div>

          {/* 画像アップロード */}
          <div className="space-y-2">
            <Label>Image (optional)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {imagePreview ? (
              <div className="relative inline-block">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  width={300}
                  height={200}
                  className="rounded-lg object-cover max-h-[200px] w-auto"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={handleRemoveImage}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                )}
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                Add Image
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label>Mood (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {moods.map((m) => (
                <Button
                  key={m.value}
                  type="button"
                  variant={mood === m.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMood(mood === m.value ? '' : m.value)}
                >
                  {m.emoji} {m.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button type="submit" disabled={isPending || uploading || !content.trim()}>
            {isPending ? 'Saving...' : isEditing ? 'Update' : 'Create'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
