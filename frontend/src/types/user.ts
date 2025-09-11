export interface User {
  user_id: string;
  nickname?: string;
  profile_image_url?: string;
  email?: string;
  social_provider: string;
  subscription_plan: string;
  subscription_status: string;
  is_premium: boolean;
  total_wins: number;
  total_winnings: number;
  daily_recommendation_count: number;
  total_saved_numbers: number;
  total_recommendations?: number; // 총 추천 생성 횟수
  can_generate_recommendation: boolean;
  can_save_number: boolean;
  created_at: string;
  last_login_at?: string;
}
