'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { usePost, useDeletePost } from '@/hooks/use-posts';
import { usePostAnalysis, useCreateAnalysis } from '@/hooks/use-analysis';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalysisResult } from '@/components/analysis/analysis-result';
import { ArrowLeft, Edit, Trash2, Brain, Calendar, Loader2, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: post, isLoading: postLoading } = usePost(postId);
  const { data: analysis, isLoading: analysisLoading, error: analysisError } = usePostAnalysis(postId);
  const createAnalysis = useCreateAnalysis();
  const deletePost = useDeletePost();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this post?')) {
      await deletePost.mutateAsync(postId);
      router.push('/posts');
    }
  };

  const handleAnalyze = async () => {
    try {
      await createAnalysis.mutateAsync(postId);
    } catch (error) {
      // エラーはcreateAnalysis.errorで取得できる
      console.error('Analysis failed:', error);
    }
  };

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

  const hasAnalysis = analysis && !analysisError;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/posts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Posts
          </Button>
        </Link>
      </div>

      <Card className="mb-8">
        {post.image_urls?.length > 0 && (
          <div className="space-y-2 p-4 pb-0">
            {post.image_urls.map((url, index) => (
              <img
                key={index}
                src={api.getImageUrl(url)!}
                alt={post.title || `Image ${index + 1}`}
                className="w-full rounded-lg"
              />
            ))}
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">
                {post.title || 'Untitled'}
              </CardTitle>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(post.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/posts/${postId}/edit`}>
                <Button variant="outline" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="icon"
                className="text-destructive"
                onClick={handleDelete}
                disabled={deletePost.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{post.content}</p>
        </CardContent>
      </Card>

      {/* Analysis Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">AI Analysis</h2>
          {!hasAnalysis && (
            <Button onClick={handleAnalyze} disabled={createAnalysis.isPending}>
              {createAnalysis.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Analyze Post
                </>
              )}
            </Button>
          )}
        </div>

        {analysisLoading || createAnalysis.isPending ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">分析中...</p>
              </div>
            </CardContent>
          </Card>
        ) : createAnalysis.isError ? (
          <Card className="border-destructive/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-destructive font-medium mb-2">分析に失敗しました</p>
              <p className="text-muted-foreground text-sm text-center max-w-md mb-4">
                {createAnalysis.error?.message?.includes('レート制限')
                  ? 'AI APIのレート制限に達しました。しばらく時間をおいてから再度お試しください。（毎日午前9時にリセットされます）'
                  : 'エラーが発生しました。しばらくしてから再度お試しください。'}
              </p>
              <Button onClick={handleAnalyze} variant="outline">
                再試行
              </Button>
            </CardContent>
          </Card>
        ) : hasAnalysis ? (
          <AnalysisResult analysis={analysis} />
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Brain className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                まだ分析されていません。上のボタンをクリックして分析を開始してください。
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
