import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import SocialLogin from '../components/SocialLogin/SocialLogin';

const KakaoLink: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, socialLogin } = useUnifiedAuth();
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [kakaoUser, setKakaoUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string>('');

  // 전달받은 카카오 사용자 정보 확인
  useEffect(() => {
    if (location.state?.kakaoUser && location.state?.accessToken) {
      setKakaoUser(location.state.kakaoUser);
      setAccessToken(location.state.accessToken);
    }
  }, [location.state]);

  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handleKakaoLink = async () => {
    if (!accessToken) {
      setErrors({ submit: '카카오 인증 정보가 없습니다.' });
      return;
    }

    setIsLoading(true);
    try {
      const success = await socialLogin('kakao', accessToken);
      if (success) {
        navigate('/');
      } else {
        setErrors({ submit: '카카오 연동에 실패했습니다.' });
      }
    } catch (error) {
      console.error('카카오 연동 오류:', error);
      setErrors({ submit: '카카오 연동 중 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            카카오 계정 연동
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            현재 로그인: {user?.email}
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          {/* 설명 */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              카카오 계정을 연동하면 더 편리하게 로그인할 수 있습니다.
            </p>
          </div>

          {/* 카카오 연동 버튼 */}
          <div className="mt-6">
            {kakaoUser ? (
              <button
                onClick={handleKakaoLink}
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-black bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <span className="mr-2">🔗</span>
                {isLoading ? '연동 중...' : '카카오 계정 연동하기'}
              </button>
            ) : (
              <SocialLogin 
                onLogin={handleKakaoLink}
                onClose={() => {}}
                className="w-full"
              />
            )}
          </div>

          {/* 건너뛰기 버튼 */}
          <div className="mt-4">
            <button
              onClick={handleSkip}
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '연동 중...' : '나중에 연동하기'}
            </button>
          </div>

          {/* 에러 메시지 */}
          {errors.submit && (
            <div className="text-center">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KakaoLink;
