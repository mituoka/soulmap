'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { useUserSummary } from '@/hooks/use-analysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Heart, Lightbulb, Target } from 'lucide-react';

export default function AnalysisPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: summary, isLoading } = useUserSummary();

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Analysis Summary</h1>
        <p className="text-muted-foreground">
          Insights from {summary?.total_posts_analyzed || 0} analyzed posts
        </p>
      </div>

      {hasSummary ? (
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
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-2">
              No analysis data yet.
            </p>
            <p className="text-muted-foreground text-center text-sm">
              Write some posts and analyze them to see your summary here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
