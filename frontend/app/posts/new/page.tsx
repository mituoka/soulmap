'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { PostForm } from '@/components/posts/post-form';
import { AIChat } from '@/components/posts/ai-chat';
import { Button } from '@/components/ui/button';
import { MessageSquare, PenLine } from 'lucide-react';

type Mode = 'select' | 'chat' | 'manual';

export default function NewPostPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [mode, setMode] = useState<Mode>('select');
  const [prefillTitle, setPrefillTitle] = useState('');
  const [prefillContent, setPrefillContent] = useState('');
  const [prefillImages, setPrefillImages] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleChatComplete = (title: string, content: string, imageUrls: string[]) => {
    setPrefillTitle(title);
    setPrefillContent(content);
    setPrefillImages(imageUrls);
    setMode('manual');
  };

  const handleChatCancel = () => {
    setMode('select');
  };

  if (mode === 'select') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center">新しい投稿</h1>
        <div className="grid gap-4 md:grid-cols-2">
          <Button
            onClick={() => setMode('chat')}
            variant="outline"
            className="h-32 flex flex-col gap-2"
          >
            <MessageSquare className="h-8 w-8" />
            <span className="text-lg font-medium">AIと会話して作成</span>
            <span className="text-sm text-muted-foreground">
              今日の出来事を話すと日記にまとめます
            </span>
          </Button>
          <Button
            onClick={() => setMode('manual')}
            variant="outline"
            className="h-32 flex flex-col gap-2"
          >
            <PenLine className="h-8 w-8" />
            <span className="text-lg font-medium">自分で書く</span>
            <span className="text-sm text-muted-foreground">
              直接日記を入力します
            </span>
          </Button>
        </div>
      </div>
    );
  }

  if (mode === 'chat') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <AIChat onComplete={handleChatComplete} onCancel={handleChatCancel} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <PostForm prefillTitle={prefillTitle} prefillContent={prefillContent} prefillImages={prefillImages} />
    </div>
  );
}
