import React, { useState } from 'react';
import { useUnifiedAuth } from '../../contexts/UnifiedAuthContext';

// Global type declarations
declare global {
  interface Window {
    Kakao: any;
    naver: any;
    kakaoSDKLoaded: boolean;
    naverSDKLoaded: boolean;
  }
}

interface SocialLoginProps {
  onLogin?: (token: string, user: any) => void;
  onClick?: () => void;
  onClose?: () => void;
  className?: string;
}

const SocialLogin: React.FC<SocialLoginProps> = ({ onClick, className = '' }) => {
  useUnifiedAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 콜백 처리는 App.tsx의 CallbackHandler에서 처리

  const handleKakaoLogin = async () => {
    // onClick이 있으면 onClick 호출 (안내 페이지로 이동)
    if (onClick) {
      onClick();
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 카카오 SDK 로딩 대기 및 확인
      let retryCount = 0;
      const maxRetries = 50; // 5초 대기
      
      while ((typeof window.Kakao === 'undefined' || !window.kakaoSDKLoaded) && retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retryCount++;
      }
      
      if (typeof window.Kakao === 'undefined' || !window.kakaoSDKLoaded) {
        setError('카카오 SDK가 로드되지 않았습니다. 페이지를 새로고침해주세요.');
        setIsLoading(false);
        return;
      }
      
      
      // 카카오 SDK 초기화
      const kakaoAppKey = import.meta.env.VITE_KAKAO_APP_KEY;
      console.log('🔑 카카오 앱 키 확인:', kakaoAppKey);
      console.log('🌍 현재 환경:', import.meta.env.VITE_ENVIRONMENT);
      
      if (!kakaoAppKey) {
        console.error('❌ 카카오 앱 키가 없습니다!');
        setIsLoading(false);
        return;
      }
      
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(kakaoAppKey);
      }
      
      // 초기화 후 Auth 객체 확인
      
      // 카카오 로그인 실행 (새로운 API 방식 - authorize 사용)
      if (window.Kakao.Auth && window.Kakao.Auth.authorize) {
        // 카카오 로그인 실행 (콜백 방식)
        window.Kakao.Auth.authorize({
          redirectUri: `${window.location.origin}/login`, // /login 경로로 수정
          state: 'kakao_login_' + Date.now(),
          scope: 'profile_nickname'  // 이메일 scope 제거
        });
        
      } else {
        console.error('카카오 Auth.authorize 함수를 찾을 수 없습니다:', window.Kakao);
        setError('카카오 로그인 API를 사용할 수 없습니다.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('카카오 로그인 오류:', err);
      setError('로그인 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  // const handleNaverLogin = async () => {
  //   // 네이버 로그인 기능은 검수 완료 후 활성화 예정
  //   setIsLoading(true);
  //   setError(null);
  //   // ... 네이버 로그인 로직
  //   setIsLoading(false);
  // };

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

        {/* 네이버 로그인 버튼 - 검수 완료 후 활성화 예정 */}
        {/* 
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
        */}
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

// handleNaverLogin 함수는 검수 완료 후 활성화 예정

export default SocialLogin;