// 세션 관리 관련 타입 정의

export interface UserSession {
  id: number;
  session_id: string;
  session_name: string;
  is_active: boolean;
  is_admin_created: boolean;
  created_by: string;
  max_recommendations: number;
  manual_ratio: number;
  auto_ratio: number;
  include_numbers: number[] | null;
  exclude_numbers: number[] | null;
  preferred_numbers: number[] | null;
  session_type: string;
  description: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  total_histories: number;
  total_recommendations: number;
  days_until_expiry: number | null;
}

export interface SessionCreate {
  session_name: string;
  max_recommendations?: number;
  manual_ratio?: number;
  auto_ratio?: number;
  include_numbers?: number[];
  exclude_numbers?: number[];
  preferred_numbers?: number[];
  session_type?: string;
  description?: string;
  tags?: string[];
  expires_at?: string;
}

export interface SessionUpdate {
  session_name?: string;
  is_active?: boolean;
  max_recommendations?: number;
  manual_ratio?: number;
  auto_ratio?: number;
  include_numbers?: number[];
  exclude_numbers?: number[];
  preferred_numbers?: number[];
  session_type?: string;
  description?: string;
  tags?: string[];
  expires_at?: string;
}

export interface SessionListResponse {
  success: boolean;
  sessions: UserSession[];
  total: number;
  active_count: number;
  expired_count: number;
}

export interface SessionResponse {
  success: boolean;
  session: UserSession;
}

export interface SessionStats {
  total_sessions: number;
  active_sessions: number;
  expired_sessions: number;
  total_recommendations: number;
  average_recommendations_per_session: number;
}

export interface SessionBulkCreate {
  count: number;
  base_name: string;
  max_recommendations?: number;
  manual_ratio?: number;
  auto_ratio?: number;
  session_type?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
