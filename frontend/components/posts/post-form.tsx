'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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

interface ImageItem {
  url: string;
  preview: string;
}

const MAX_FILE_SIZE_MB = 50;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff', 'image/heic', 'image/heif', 'image/svg+xml'];

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export function PostForm({ post, isEditing = false }: PostFormProps) {
  const router = useRouter();
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(post?.title || '');
  const [content, setContent] = useState(post?.content || '');
  const [images, setImages] = useState<ImageItem[]>(
    (post?.image_urls || []).map((url) => ({
      url,
      preview: api.getImageUrl(url) || '',
    }))
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File): string | null => {
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      return `ファイルサイズが大きすぎます（${formatFileSize(file.size)}）。上限: ${MAX_FILE_SIZE_MB}MB`;
    }
    if (file.type && !ALLOWED_TYPES.includes(file.type)) {
      return '対応していないファイル形式です。対応形式: JPG, PNG, GIF, WebP, BMP, TIFF, HEIC, SVG';
    }
    return null;
  };

  const uploadFiles = useCallback(async (files: File[]) => {
    setUploadError(null);

    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        setUploadError(error);
        continue;
      }

      // プレビュー作成
      const preview = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      // アップロード
      setUploading(true);
      try {
        const result = await api.uploadImage(file);
        setImages((prev) => [...prev, { url: result.url, preview }]);
      } catch (err) {
        console.error('Upload failed:', err);
        setUploadError(err instanceof Error ? err.message : '画像のアップロードに失敗しました');
      } finally {
        setUploading(false);
      }
    }
  }, []);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    await uploadFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/')
    );
    if (files.length > 0) {
      await uploadFiles(files);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageFiles = items
      .filter((item) => item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((f): f is File => f !== null);
    if (imageFiles.length > 0) {
      e.preventDefault();
      await uploadFiles(imageFiles);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: PostCreate | PostUpdate = {
      title: title || undefined,
      content,
      image_urls: images.map((img) => img.url),
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
      setUploadError(error instanceof Error ? error.message : '投稿の保存に失敗しました');
    }
  };

  const isPending = createPost.isPending || updatePost.isPending;

  return (
    <form onSubmit={handleSubmit}>
      <Card
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={isDragging ? 'ring-2 ring-primary ring-offset-2' : ''}
      >
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
              onPaste={handlePaste}
              placeholder="Write your thoughts..."
              required
              rows={8}
            />
          </div>

          {/* 画像アップロード */}
          <div className="space-y-2">
            <Label>Images (optional)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />

            {uploadError && (
              <p className="text-sm text-red-500">{uploadError}</p>
            )}

            {images.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {images.map((img, index) => (
                  <div key={index} className="relative inline-block">
                    <img
                      src={img.preview}
                      alt={`Image ${index + 1}`}
                      className="rounded-lg max-w-full max-h-[200px] w-auto h-auto"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => handleRemoveImage(index)}
                      disabled={uploading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {uploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                アップロード中...
              </div>
            )}

            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                クリック、ドラッグ&ドロップ、またはペーストで画像を追加
              </p>
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
