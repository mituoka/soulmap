'use client';

import { PersonalityTraits } from '@/types';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

interface PersonalityRadarProps {
  traits: PersonalityTraits;
}

const traitLabels: Record<string, string> = {
  openness: 'Openness',
  conscientiousness: 'Conscientiousness',
  extraversion: 'Extraversion',
  agreeableness: 'Agreeableness',
  neuroticism: 'Neuroticism',
};

export function PersonalityRadar({ traits }: PersonalityRadarProps) {
  const data = Object.entries(traits).map(([key, value]) => ({
    trait: traitLabels[key] || key,
    value: Math.round(value * 100),
    fullMark: 100,
  }));

  return (
    <div className="h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="trait" tick={{ fontSize: 11 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
          <Radar
            name="Personality"
            dataKey="value"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
