'use client';

import { EmotionScores } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface EmotionChartProps {
  emotions: EmotionScores;
}

const emotionLabels: Record<string, string> = {
  joy: 'Joy',
  sadness: 'Sadness',
  anger: 'Anger',
  fear: 'Fear',
  surprise: 'Surprise',
};

const emotionColors: Record<string, string> = {
  joy: '#FCD34D',
  sadness: '#60A5FA',
  anger: '#F87171',
  fear: '#A78BFA',
  surprise: '#34D399',
};

export function EmotionChart({ emotions }: EmotionChartProps) {
  const data = Object.entries(emotions).map(([key, value]) => ({
    name: emotionLabels[key] || key,
    value: Math.round(value * 100),
    fill: emotionColors[key] || '#94A3B8',
  }));

  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 100]} />
          <YAxis type="category" dataKey="name" width={70} />
          <Tooltip formatter={(value) => `${value}%`} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
