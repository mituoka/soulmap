// Auth types
export interface User {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

// Post types
export interface Post {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  mood: string | null;
  image_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface PostCreate {
  title?: string;
  content: string;
  mood?: string;
  image_urls?: string[];
}

export interface PostUpdate {
  title?: string;
  content?: string;
  mood?: string;
  image_urls?: string[];
}

export interface PostFilters {
  search?: string;
  mood?: string;
  date_from?: string;
  date_to?: string;
}

export interface PostListResponse {
  posts: Post[];
  total: number;
  page: number;
  per_page: number;
}

// Analysis types
export interface EmotionScores {
  joy: number;
  sadness: number;
  anger: number;
  fear: number;
  surprise: number;
}

export interface PersonalityTraits {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface AnalysisResult {
  emotions: EmotionScores;
  topics: string[];
  personality_traits: PersonalityTraits;
  interests: string[];
  summary: string;
}

export interface Analysis {
  id: string;
  post_id: string;
  user_id: string;
  analysis_type: string;
  result: AnalysisResult;
  tokens_used: number | null;
  model_version: string | null;
  created_at: string;
}

export interface UserSummary {
  user_id: string;
  total_posts_analyzed: number;
  summary: {
    overall_summary: string;
    dominant_emotions: string[];
    key_interests: string[];
    personality_overview: string;
    recommendations: string[];
  };
}
