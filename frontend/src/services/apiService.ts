// 통합 API 서비스
import { User } from '../types/user';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// 공통 API 호출 함수
async function apiCall<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: any; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: data.message || `HTTP ${response.status} 오류`,
          details: data
        }
      };
    }

    // 백엔드 응답이 직접 데이터인 경우 success: true로 래핑
    return {
      success: true,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: '네트워크 오류가 발생했습니다.',
        details: error
      }
    };
  }
}

// 인증 관련 API
export const authAPI = {
  // 현재 사용자 정보 조회 (통계 포함)
  async getCurrentUser(token: string): Promise<{ success: boolean; data?: User; error?: any }> {
    return apiCall<User>('/api/v1/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // 사용자 프로필 조회 (통계 포함)
  async getUserProfile(token: string): Promise<{ success: boolean; data?: any; error?: any }> {
    return apiCall('/api/v1/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // 소셜 로그인
  async socialLogin(provider: string, accessToken: string): Promise<{ success: boolean; data?: any; error?: any }> {
    return apiCall('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        provider,
        access_token: accessToken
      })
    });
  }
};

// 저장된 추천번호 관련 API
export const savedRecommendationsAPI = {
  // 저장된 추천번호 목록 조회
  async getSavedRecommendations(token: string, params?: {
    limit?: number;
    offset?: number;
    is_active?: boolean;
    is_favorite?: boolean;
  }): Promise<{ success: boolean; data?: any; error?: any }> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.is_favorite !== undefined) queryParams.append('is_favorite', params.is_favorite.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/api/v1/saved-recommendations${queryString ? `?${queryString}` : ''}`;
    
    return apiCall(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // 추천번호 저장
  async saveRecommendation(token: string, data: {
    numbers: number[];
    confidence_score?: number;
    generation_method: string;
    analysis_data?: any;
    title?: string;
    memo?: string;
    tags?: string[];
    target_draw_number?: number;
  }): Promise<{ success: boolean; data?: any; error?: any }> {
    return apiCall('/api/v1/saved-recommendations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
  },

  // 추천번호 수정
  async updateRecommendation(token: string, id: number, data: {
    title?: string;
    memo?: string;
    tags?: string[];
    is_favorite?: boolean;
    is_active?: boolean;
  }): Promise<{ success: boolean; data?: any; error?: any }> {
    return apiCall(`/api/v1/saved-recommendations/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
  },

  // 추천번호 삭제
  async deleteRecommendation(token: string, id: number): Promise<{ success: boolean; data?: any; error?: any }> {
    return apiCall(`/api/v1/saved-recommendations/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // 당첨 결과 확인
  async checkWinning(token: string, data: {
    draw_number: number;
    winning_numbers: number[];
    bonus_number: number;
  }): Promise<{ success: boolean; data?: any; error?: any }> {
    return apiCall('/api/v1/saved-recommendations/check-winning', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
  },

  // 사용자 통계 조회
  async getStats(token: string): Promise<{ success: boolean; data?: any; error?: any }> {
    return apiCall('/api/v1/saved-recommendations/stats/summary', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
};

// 로또 관련 API
export const lottoAPI = {
  // 최신 당첨번호 조회
  async getLatestDraw(): Promise<{ success: boolean; data?: any; error?: any }> {
    return apiCall('/api/v1/lotto/latest');
  },

  // 당첨번호 목록 조회
  async getDraws(limit: number = 10, offset: number = 0): Promise<{ success: boolean; data?: any; error?: any }> {
    return apiCall(`/api/v1/lotto/draws?limit=${limit}&offset=${offset}`);
  },

  // 특정 회차 당첨번호 조회
  async getDrawByNumber(drawNumber: number): Promise<{ success: boolean; data?: any; error?: any }> {
    return apiCall(`/api/v1/lotto/draw/${drawNumber}`);
  },

  // 로또 통계 조회
  async getStatistics(): Promise<{ success: boolean; data?: any; error?: any }> {
    return apiCall('/api/v1/lotto/statistics');
  }
};

// 추천 관련 API
export const recommendationsAPI = {
  // AI 추천 생성
  async generateRecommendations(data: {
    session_id: string;
    total_count: number;
    manual_combinations?: Array<{ numbers: number[] }>;
    preferences?: {
      include_numbers?: number[];
      exclude_numbers?: number[];
    };
    target_draw?: number | null;
  }): Promise<{ success: boolean; data?: any; error?: any }> {
    return apiCall('/api/v1/recommendations/generate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // 추천 기록 조회
  async getHistory(limit: number = 50, offset: number = 0): Promise<{ success: boolean; data?: any; error?: any }> {
    return apiCall(`/api/v1/recommendations/history?limit=${limit}&offset=${offset}`);
  }
};

export default {
  auth: authAPI,
  savedRecommendations: savedRecommendationsAPI,
  lotto: lottoAPI,
  recommendations: recommendationsAPI
};
