import React, { useState } from 'react';
import { useUserAuth } from '../../contexts/UserAuthContext';

interface SocialLoginProps {
  onLogin?: (token: string, user: any) => void;
  onClose?: () => void;
  className?: string;
}

const SocialLogin: React.FC<SocialLoginProps> = ({ onLogin, onClose, className = '' }) => {
  const { login } = useUserAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleKakaoLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 실제 구현에서는 Kakao SDK를 사용
      // 현재는 개발용 모의 구현
      console.log('카카오 로그인 시작...');
      
      // 모의 카카오 액세스 토큰 (실제로는 Kakao SDK에서 받아옴)
      const mockKakaoToken = 'mock_kakao_access_token_' + Date.now();
      
      // 백엔드 소셜 로그인 API 호출
      const response = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'kakao',
          access_token: mockKakaoToken
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await login(data.data.access_token, data.data.user);
          if (onLogin) {
            onLogin(data.data.access_token, data.data.user);
          }
          if (onClose) {
            onClose();
          }
        } else {
          setError('로그인에 실패했습니다.');
        }
      } else {
        setError('로그인 요청 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('카카오 로그인 오류:', err);
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNaverLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 실제 구현에서는 Naver SDK를 사용
      console.log('네이버 로그인 시작...');
      
      // 모의 네이버 액세스 토큰
      const mockNaverToken = 'mock_naver_access_token_' + Date.now();
      
      const response = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'naver',
          access_token: mockNaverToken
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await login(data.data.access_token, data.data.user);
          if (onLogin) {
            onLogin(data.data.access_token, data.data.user);
          }
          if (onClose) {
            onClose();
          }
        } else {
          setError('로그인에 실패했습니다.');
        }
      } else {
        setError('로그인 요청 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('네이버 로그인 오류:', err);
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          소셜 로그인으로 시작하기
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          로그인하고 나만의 추천번호를 저장해보세요!
        </p>
      </div>

      <div className="space-y-3">
        {/* 카카오 로그인 버튼 */}
        <button
          onClick={handleKakaoLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 5.84 2 10.8c0 3.12 1.68 5.88 4.32 7.56l-.96 3.48c-.12.36.24.72.6.48l4.56-2.76c.48.06.96.06 1.44.06 5.52 0 10-3.84 10-8.82C22 5.84 17.52 2 12 2z"/>
            </svg>
          )}
          카카오 로그인
        </button>

        {/* 네이버 로그인 버튼 */}
        <button
          onClick={handleNaverLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.017 0C8.444 0 5.538 2.545 5.538 5.686c0 1.411.548 2.73 1.496 3.638L5.538 24l7.97-8.676c.234.014.469.021.706.021 3.573 0 6.479-2.545 6.479-5.686C20.693 2.545 17.787 0 14.214 0h-2.197z"/>
            </svg>
          )}
          네이버 로그인
        </button>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          로그인하면 <span className="text-blue-600">이용약관</span> 및{' '}
          <span className="text-blue-600">개인정보처리방침</span>에 동의한 것으로 간주됩니다.
        </p>
      </div>
    </div>
  );
};

export default SocialLogin;