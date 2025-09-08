import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/user';

interface UserAuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUserInfo: () => Promise<void>;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

interface UserAuthProviderProps {
  children: ReactNode;
}

export const UserAuthProvider: React.FC<UserAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 로컬 스토리지에서 인증 정보 복원
  useEffect(() => {
    const savedToken = localStorage.getItem('userToken');
    const savedUser = localStorage.getItem('userData');
    
    if (savedToken && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(userData);
        
        // 토큰 유효성 검증 (optional)
        refreshUserInfo();
      } catch (error) {
        console.error('저장된 사용자 정보 복원 실패:', error);
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, userData: User) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('userToken', newToken);
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    // 메인페이지로 리다이렉트
    window.location.href = '/';
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('userData', JSON.stringify(updatedUser));
    }
  };

  const refreshUserInfo = async () => {
    if (!token) return;

    try {
      const { authAPI } = await import('../services/apiService');
      const result = await authAPI.getCurrentUser(token);
      
      if (result.success && result.data) {
        updateUser(result.data);
      } else if (result.error?.code === 'HTTP_401') {
        // 토큰이 만료되었거나 유효하지 않음
        logout();
      }
    } catch (error) {
      console.error('사용자 정보 새로고침 실패:', error);
    }
  };

  const value: UserAuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    updateUser,
    refreshUserInfo
  };

  return (
    <UserAuthContext.Provider value={value}>
      {children}
    </UserAuthContext.Provider>
  );
};

// 커스텀 훅
export const useUserAuth = (): UserAuthContextType => {
  const context = useContext(UserAuthContext);
  if (context === undefined) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
};