import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  adminInfo: AdminInfo | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

interface AdminInfo {
  username: string;
  loginTime: string;
  lastActivity: string;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// 간단한 관리자 계정 (실제로는 환경변수나 데이터베이스에서 관리)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'lotto2024!' // 실제 운영 시에는 더 강력한 비밀번호 사용
};

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(false);

  // 로컬 스토리지에서 로그인 상태 복원
  useEffect(() => {
    const savedAuth = localStorage.getItem('adminAuth');
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        const now = new Date();
        const lastActivity = new Date(authData.lastActivity);
        
        // 24시간 후 자동 로그아웃
        if (now.getTime() - lastActivity.getTime() < 24 * 60 * 60 * 1000) {
          setIsAuthenticated(true);
          setAdminInfo(authData);
        } else {
          // 만료된 인증 정보 제거
          localStorage.removeItem('adminAuth');
        }
      } catch (error) {
        localStorage.removeItem('adminAuth');
      }
    }
  }, []);

  // 활동 시간 업데이트
  useEffect(() => {
    if (isAuthenticated && adminInfo) {
      const interval = setInterval(() => {
        const now = new Date();
        const lastActivity = new Date(adminInfo.lastActivity);
        
        // 30분 동안 활동이 없으면 자동 로그아웃
        if (now.getTime() - lastActivity.getTime() > 30 * 60 * 1000) {
          logout();
        }
      }, 60000); // 1분마다 체크

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, adminInfo]);

  // 로그인 함수
  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      // 실제로는 API 호출로 검증해야 함
      await new Promise(resolve => setTimeout(resolve, 1000)); // 로딩 시뮬레이션
      
      if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        const now = new Date();
        const adminData: AdminInfo = {
          username,
          loginTime: now.toISOString(),
          lastActivity: now.toISOString()
        };
        
        setIsAuthenticated(true);
        setAdminInfo(adminData);
        
        // 로컬 스토리지에 저장
        localStorage.setItem('adminAuth', JSON.stringify(adminData));
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃 함수
  const logout = () => {
    setIsAuthenticated(false);
    setAdminInfo(null);
    localStorage.removeItem('adminAuth');
  };

  // 활동 시간 업데이트
  const updateActivity = () => {
    if (adminInfo) {
      const updatedInfo = {
        ...adminInfo,
        lastActivity: new Date().toISOString()
      };
      setAdminInfo(updatedInfo);
      localStorage.setItem('adminAuth', JSON.stringify(updatedInfo));
    }
  };

  // 마우스/키보드 활동 감지
  useEffect(() => {
    if (isAuthenticated) {
      const handleActivity = () => updateActivity();
      
      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('keydown', handleActivity);
      window.addEventListener('click', handleActivity);
      window.addEventListener('scroll', handleActivity);
      
      return () => {
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('keydown', handleActivity);
        window.removeEventListener('click', handleActivity);
        window.removeEventListener('scroll', handleActivity);
      };
    }
  }, [isAuthenticated]);

  const value: AdminAuthContextType = {
    isAuthenticated,
    adminInfo,
    login,
    logout,
    loading
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

// 커스텀 훅
export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
