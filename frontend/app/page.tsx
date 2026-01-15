'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { BookOpen, Brain, BarChart3, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Discover Your <span className="text-primary">Inner Self</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          SoulMap uses AI to analyze your journal entries, revealing patterns in your emotions,
          personality traits, and interests. Start your journey of self-discovery today.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">Login</Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<BookOpen className="h-8 w-8" />}
              title="Journal Writing"
              description="Write your thoughts, feelings, and experiences in a secure digital journal."
            />
            <FeatureCard
              icon={<Brain className="h-8 w-8" />}
              title="AI Analysis"
              description="Get deep insights into your emotions and personality through AI-powered analysis."
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8" />}
              title="Visual Insights"
              description="View beautiful charts and graphs that visualize your emotional patterns."
            />
            <FeatureCard
              icon={<Sparkles className="h-8 w-8" />}
              title="Self Discovery"
              description="Understand yourself better and track your personal growth over time."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center p-6 rounded-lg border bg-gray-50">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
