import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Recommendation from './pages/Recommendation';
import Admin from './pages/Admin';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { UserAuthProvider, useUserAuth } from './contexts/UserAuthContext';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookieSettings from './pages/CookieSettings';
import Terms from './pages/Terms';
// import History from './pages/History'; // 이전기록 기능 개발 중 - 일시 비활성화

// 전역 콜백 처리 컴포넌트
const CallbackHandler: React.FC = () => {
  const { login } = useUserAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (code && state) {
          if (state.startsWith('kakao_login_')) {
            console.log('전역 카카오 로그인 콜백 감지:', { code, state });
            
            // 카카오 SDK 초기화
            if (!window.Kakao || !window.Kakao.isInitialized()) {
              window.Kakao.init(import.meta.env.VITE_KAKAO_APP_KEY);
            }
            
            try {
              const { authAPI } = await import('./services/apiService');
              const result = await authAPI.socialLogin('kakao', code);

              if (result.success && result.data) {
                console.log('전역 카카오 로그인 성공:', result.data);
                
                // 로그인 처리
                login(result.data.access_token, result.data.user);
                
                // URL 정리
                window.history.replaceState({}, document.title, window.location.pathname);
                
                // 새로고침
                window.location.reload();
              } else {
                console.error('전역 카카오 로그인 실패:', result.error);
              }
            } catch (err) {
              console.error('전역 카카오 로그인 오류:', err);
            }
          } else if (state.startsWith('naver_login_')) {
            console.log('전역 네이버 로그인 콜백 감지:', { code, state });
            
            try {
              const { authAPI } = await import('./services/apiService');
              const result = await authAPI.socialLogin('naver', code);

              if (result.success && result.data) {
                console.log('전역 네이버 로그인 성공:', result.data);
                
                // 로그인 처리
                login(result.data.access_token, result.data.user);
                
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
  }, [login]);

  return null;
};

const App: React.FC = () => {
  return (
    <UserAuthProvider>
      <CallbackHandler />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/recommendation" element={<Recommendation />} />
          <Route path="/admin" element={
            <AdminAuthProvider>
              <Admin />
            </AdminAuthProvider>
          } />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/cookie-settings" element={<CookieSettings />} />
          <Route path="/terms" element={<Terms />} />
          {/* <Route path="/history" element={<History />} /> 이전기록 기능 개발 중 - 일시 비활성화 */}
        </Routes>
      </Layout>
    </UserAuthProvider>
  );
};

export default App;
