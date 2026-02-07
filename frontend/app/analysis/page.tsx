'use client';

/**
 * 分析サマリーページ
 *
 * ユーザーの日記分析結果の全体的な傾向を表示。
 * - 全体的なサマリー
 * - 主要な感情
 * - 関心事
 * - 性格傾向
 * - おすすめ
 *
 * 注意: このページを開くとAI APIを呼び出して要約を生成する
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { useUserSummary } from '@/hooks/use-analysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Heart, Lightbulb, Target, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AnalysisPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: summary, isLoading, error, refetch } = useUserSummary();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const hasSummary = summary && summary.total_posts_analyzed > 0;

  // レート制限エラーかどうかをチェック
  const isRateLimited = summary?.summary?.overall_summary?.includes('レート制限') ||
    error?.message?.includes('レート制限');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">分析サマリー</h1>
        <p className="text-muted-foreground">
          {summary?.total_posts_analyzed || 0}件の分析結果に基づく傾向
        </p>
      </div>

      {/* レート制限エラー表示 */}
      {isRateLimited && (
        <Card className="border-destructive/50 mb-6">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertTriangle className="h-8 w-8 text-destructive flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-destructive">AI APIのレート制限に達しました</p>
              <p className="text-sm text-muted-foreground">
                しばらく時間をおいてから再度お試しください。（毎日午前9時にリセットされます）
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              再試行
            </Button>
          </CardContent>
        </Card>
      )}

      {hasSummary && !isRateLimited ? (
        <div className="grid gap-6">
          {/* Overall Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Overall Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {summary.summary.overall_summary}
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Dominant Emotions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Dominant Emotions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {summary.summary.dominant_emotions?.length > 0 ? (
                    summary.summary.dominant_emotions.map((emotion, i) => (
                      <Badge key={i} variant="secondary">
                        {emotion}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Not enough data yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Key Interests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Key Interests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {summary.summary.key_interests?.length > 0 ? (
                    summary.summary.key_interests.map((interest, i) => (
                      <Badge key={i} variant="outline">
                        {interest}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Not enough data yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Personality Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Personality Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {summary.summary.personality_overview || 'Not enough data yet'}
              </p>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary.summary.recommendations?.length > 0 ? (
                <ul className="space-y-2">
                  {summary.summary.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span className="text-muted-foreground">{rec}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Not enough data yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : !isRateLimited && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-2">
              まだ分析データがありません
            </p>
            <p className="text-muted-foreground text-center text-sm">
              投稿を作成して分析すると、ここに傾向が表示されます。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
