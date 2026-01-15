'use client';

import { Analysis } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmotionChart } from './emotion-chart';
import { PersonalityRadar } from './personality-radar';

interface AnalysisResultProps {
  analysis: Analysis;
}

export function AnalysisResult({ analysis }: AnalysisResultProps) {
  const { result } = analysis;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Analysis Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{result.summary}</p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Emotions</CardTitle>
          </CardHeader>
          <CardContent>
            <EmotionChart emotions={result.emotions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personality Traits</CardTitle>
          </CardHeader>
          <CardContent>
            <PersonalityRadar traits={result.personality_traits} />
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {result.topics.map((topic, i) => (
                <Badge key={i} variant="secondary">
                  {topic}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {result.interests.map((interest, i) => (
                <Badge key={i} variant="outline">
                  {interest}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-xs text-muted-foreground text-right">
        Model: {analysis.model_version || 'N/A'} | Tokens: {analysis.tokens_used || 0}
      </div>
    </div>
  );
}
