import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Recommendation from './pages/Recommendation';
import Statistics from './pages/Statistics';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import ProfileSettings from './pages/ProfileSettings';
import KakaoLink from './pages/KakaoLink';
import KakaoLoginGuide from './pages/KakaoLoginGuide';
// import { UserAuthProvider, useUserAuth } from './contexts/UserAuthContext'; // 제거됨 - UnifiedAuthContext로 통합
import { UnifiedAuthProvider, useUnifiedAuth } from './contexts/UnifiedAuthContext';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookieSettings from './pages/CookieSettings';
import Terms from './pages/Terms';
import WinningHistory from './pages/WinningHistory';
import SavedNumbers from './pages/SavedNumbers';
import AdSensePolicy from './pages/AdSensePolicy';
import { NotificationContainer } from './components/common';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
// import History from './pages/History'; // 이전기록 기능 개발 중 - 일시 비활성화

// 전역 콜백 처리 컴포넌트
const CallbackHandler: React.FC = () => {
  const { socialLogin } = useUnifiedAuth();

  const handleKakaoRegister = async (kakaoUser: any, accessToken: string) => {
    try {
      // 카카오 사용자 정보로 자동 회원가입
      const registerResponse = await fetch('${import.meta.env.VITE_API_URL}/api/v1/auth/register/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: kakaoUser.email || `${kakaoUser.id}@kakao.temp`,
          password: `kakao_${kakaoUser.id}_${Date.now()}`,
          nickname: kakaoUser.nickname || '카카오 사용자'
        })
      });

      const registerResult = await registerResponse.json();
      
      if (registerResult.success) {
        // 회원가입 성공 후 카카오 연동
        const linkResponse = await fetch('${import.meta.env.VITE_API_URL}/api/v1/auth/link/kakao', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${registerResult.data.access_token}`
          },
          body: JSON.stringify({
            provider: 'kakao',
            access_token: accessToken
          })
        });

        const linkResult = await linkResponse.json();
        
        if (linkResult.success) {
          // 연동 성공 후 자동 로그인
          const loginSuccess = await socialLogin('kakao', accessToken);
          if (loginSuccess) {
            // URL 정리
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      }
    } catch (error) {
      console.error('카카오 회원가입 오류:', error);
    }
  };
  
  // Use function to prevent unused variable warning
  void handleKakaoRegister;

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (code && state) {
          if (state.startsWith('kakao_login_')) {
            // 로그인 페이지에서만 처리하도록 전역 처리 비활성화
            // handleKakaoRegister 사용 예시 (필요시 활성화)
            // await handleKakaoRegister({}, '');
            return;
          } else if (state.startsWith('naver_login_')) {
            
            try {
              const { authAPI } = await import('./services/apiService');
              const result = await authAPI.socialLogin('naver', code);

              if (result.success && result.data) {
                
                // 통합 인증으로 로그인 처리
                await socialLogin('naver', result.data.access_token);
                
                // URL 정리
                window.history.replaceState({}, document.title, window.location.pathname);
                
                // 새로고침
                window.location.reload();
              } else {
                console.error('전역 네이버 로그인 실패:', result.error);
              }
            } catch (err) {
              console.error('전역 네이버 로그인 오류:', err);
            }
          }
        }
      } catch (err) {
        console.error('전역 콜백 처리 오류:', err);
      }
    };

    handleCallback();
  }, [socialLogin]);

  return null;
};

// App 컴포넌트를 감싸는 래퍼 - 알림 기능 포함
const AppWithNotifications: React.FC = () => {
  const { notifications, hideNotification } = useNotification();

  return (
    <>
      <UnifiedAuthProvider>
        <CallbackHandler />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/recommendation" element={<Recommendation />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile-settings" element={<ProfileSettings />} />
            <Route path="/kakao-link" element={<KakaoLink />} />
            <Route path="/kakao-login-guide" element={<KakaoLoginGuide />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/cookie-settings" element={<CookieSettings />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/winning-history" element={<WinningHistory />} />
            <Route path="/saved-numbers" element={<SavedNumbers />} />
            <Route path="/adsense-policy" element={<AdSensePolicy />} />
            {/* <Route path="/history" element={<History />} /> 이전기록 기능 개발 중 - 일시 비활성화 */}
          </Routes>
        </Layout>
      </UnifiedAuthProvider>
      
      {/* 전역 알림 컨테이너 */}
      <NotificationContainer
        notifications={notifications}
        onClose={hideNotification}
        position="top-right"
      />
    </>
  );
};

const App: React.FC = () => {
  return (
    <NotificationProvider>
      <AppWithNotifications />
    </NotificationProvider>
  );
};

export default App;
