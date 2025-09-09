import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 사용자 타입 정의
interface User {
  id: number;
  user_id: string;
  email: string;
  nickname: string;
  profile_image_url?: string;
  login_method: 'social' | 'email';
  role: 'user' | 'admin';
  social_provider?: 'kakao' | 'naver';
  linked_social_providers: string[];
  subscription_plan: string;
  subscription_status: string;
  is_premium: boolean;
  is_verified: boolean;
  created_at: string;
  last_login_at?: string;
  // 추가 프로퍼티들 (SaveRecommendation 및 UserProfile에서 사용)
  can_save_number: boolean;
  daily_recommendation_count: number;
  total_saved_numbers: number;
  total_wins: number;
  total_winnings: number;
}

// 인증 컨텍스트 타입
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, nickname: string) => Promise<boolean>;
  socialLogin: (provider: string, accessToken: string) => Promise<boolean>;
  linkSocial: (provider: string, accessToken: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// API 서비스
class AuthService {
  private static baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  static async login(email: string, password: string) {
    const response = await fetch(`${this.baseURL}/api/v1/auth/login/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  }

  static async register(email: string, password: string, nickname: string) {
    const response = await fetch(`${this.baseURL}/api/v1/auth/register/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, nickname }),
    });
    return response.json();
  }

  static async socialLogin(provider: string, accessToken: string) {
    const response = await fetch(`${this.baseURL}/api/v1/auth/login/social`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ provider, access_token: accessToken }),
    });
    return response.json();
  }

  static async linkSocial(provider: string, accessToken: string) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${this.baseURL}/api/v1/auth/link/social`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ provider, access_token: accessToken }),
    });
    return response.json();
  }

  static async getCurrentUser() {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${this.baseURL}/api/v1/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  }
}

// 컨텍스트 생성
const UnifiedAuthContext = createContext<AuthContextType | undefined>(undefined);

// 프로바이더 컴포넌트
export const UnifiedAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 인증 상태 확인
  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const result = await AuthService.getCurrentUser();
      
      // API 응답이 직접 사용자 데이터인 경우
      if (result && result.user_id) {
        setUser(result);
      } else if (result && result.success && result.data && result.data.user) {
        // success 필드가 있고 data.user가 있는 경우
        setUser(result.data.user);
      } else if (result && result.success && result.data) {
        // success 필드가 있고 data가 사용자 데이터인 경우
        setUser(result.data);
      } else {
        localStorage.removeItem('access_token');
        setUser(null);
      }
    } catch (error) {
      console.error('인증 상태 확인 오류:', error);
      localStorage.removeItem('access_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 인증 상태 확인
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // 이메일 로그인
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await AuthService.login(email, password);
      if (result.success) {
        localStorage.setItem('access_token', result.data.access_token);
        setUser(result.data.user);
        return true;
      } else {
        console.error('로그인 실패:', result.error);
        return false;
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      return false;
    }
  };

  // 이메일 회원가입
  const register = async (email: string, password: string, nickname: string): Promise<boolean> => {
    try {
      const result = await AuthService.register(email, password, nickname);
      if (result.success) {
        localStorage.setItem('access_token', result.data.access_token);
        setUser(result.data.user);
        return true;
      } else {
        console.error('회원가입 실패:', result.error);
        return false;
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      return false;
    }
  };

  // 소셜 로그인
  const socialLogin = async (provider: string, accessToken: string): Promise<boolean> => {
    try {
      const result = await AuthService.socialLogin(provider, accessToken);
      if (result.success) {
        localStorage.setItem('access_token', result.data.access_token);
        setUser(result.data.user);
        return true;
      } else {
        console.error('소셜 로그인 실패:', result.error);
        return false;
      }
    } catch (error) {
      console.error('소셜 로그인 오류:', error);
      return false;
    }
  };

  // 소셜 계정 연동
  const linkSocial = async (provider: string, accessToken: string): Promise<boolean> => {
    try {
      const result = await AuthService.linkSocial(provider, accessToken);
      if (result.success) {
        setUser(result.data.user);
        return true;
      } else {
        console.error('소셜 연동 실패:', result.error);
        return false;
      }
    } catch (error) {
      console.error('소셜 연동 오류:', error);
      return false;
    }
  };

  // 로그아웃
  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    // 메인페이지로 리다이렉트
    window.location.href = '/';
  };

  // 사용자 정보 새로고침
  const refreshUser = async () => {
    await checkAuthStatus();
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    socialLogin,
    linkSocial,
    logout,
    refreshUser,
  };

  return (
    <UnifiedAuthContext.Provider value={value}>
      {children}
    </UnifiedAuthContext.Provider>
  );
};

// 훅
export const useUnifiedAuth = (): AuthContextType => {
  const context = useContext(UnifiedAuthContext);
  if (context === undefined) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider');
  }
  return context;
};

export default UnifiedAuthContext;
