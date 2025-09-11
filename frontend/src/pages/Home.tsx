import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LottoBall from '../components/LottoBall';
// import AdSenseBanner from '../components/AdSense/AdSenseBanner'; // 심사 완료 후 추가 예정
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';

interface LottoDraw {
  draw_number: number;
  draw_date: string;
  numbers: number[];
  bonus_number: number;
  first_winners: number;
  first_amount: number;
}

const Home: React.FC = () => {
  useNavigate();
  const { socialLogin } = useUnifiedAuth();
  const [latestDraw, setLatestDraw] = useState<LottoDraw | null>(null);
  const [loading, setLoading] = useState(true);

  // 카카오 콜백 처리
  useEffect(() => {
    const handleKakaoCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      if (code && state && state.startsWith('kakao_login_')) {
        
        try {
          // 카카오 SDK 초기화
          if (!window.Kakao || !window.Kakao.isInitialized()) {
            window.Kakao.init(import.meta.env.VITE_KAKAO_APP_KEY);
          }
          
          // 카카오에서 액세스 토큰 가져오기
          const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              client_id: import.meta.env.VITE_KAKAO_APP_KEY,
              redirect_uri: `${window.location.origin}/`,
              code: code
            })
          });
          
          const tokenData = await tokenResponse.json();
          
          if (tokenData.access_token) {
            // 카카오 사용자 정보 가져오기
            const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
              headers: {
                'Authorization': `Bearer ${tokenData.access_token}`
              }
            });
            
            await userResponse.json(); // userData
            
            // 카카오 사용자 정보 확인
            const checkResponse = await fetch('http://localhost:8000/api/v1/auth/check-kakao-user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                provider: 'kakao',
                access_token: tokenData.access_token
              })
            });

            const checkResult = await checkResponse.json();
            
            if (checkResult.success) {
              if (checkResult.data.is_registered) {
                // 기존 계정이 있으면 자동 로그인
                const success = await socialLogin('kakao', tokenData.access_token);
                if (success) {
                  // URL 정리
                  window.history.replaceState({}, document.title, window.location.pathname);
                }
              } else {
                // 가입된 계정이 없으면 자동 회원가입 후 로그인
                await handleKakaoRegister(checkResult.data.user_info, tokenData.access_token);
              }
            }
          } else {
            console.error('카카오 인증 실패');
          }
        } catch (error) {
          console.error('카카오 콜백 처리 오류:', error);
        }
      }
    };

    handleKakaoCallback();
  }, [socialLogin]);

  const handleKakaoRegister = async (kakaoUser: any, accessToken: string) => {
    try {
      // 카카오 사용자 정보로 자동 회원가입
      const registerResponse = await fetch('http://localhost:8000/api/v1/auth/register/email', {
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
        const linkResponse = await fetch('http://localhost:8000/api/v1/auth/link/kakao', {
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

  useEffect(() => {
      const fetchLatestDraw = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/lotto/latest`);
        const data = await response.json();
        if (data.success) {
          setLatestDraw(data.data);
        }
      } catch (error) {
        console.error('최신 로또 데이터 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestDraw();
  }, []);

  return (
    <div className="space-y-8">
      {/* 히어로 섹션 - 세련되고 모던한 디자인 */}
      <div className="relative overflow-hidden">
        {/* 배경 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50/30 to-purple-50/30"></div>
        
        {/* 헤더 콘텐츠 */}
        <div className="relative z-10 text-center py-6 sm:py-8 lg:py-10 px-4">
          {/* 로고와 제목 */}
          <div className="flex items-center justify-center space-x-3 sm:space-x-4 mb-4">
            <div className="relative">
              {/* 로고 아이콘 */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-12">
                <span className="text-white text-base sm:text-lg lg:text-xl font-bold">🎯</span>
              </div>
              {/* 로고 글로우 효과 */}
              <div className="absolute inset-0 w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-xl opacity-20 blur-xl"></div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
              로또리아 AI - 인공지능으로 예측하는 로또 번호
            </h1>
          </div>
          
          {/* 설명 문구 */}
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-6">
            AI 머신러닝 기술의 로또 분석으로 과거 데이터 기반 통계 분석과 패턴 인식을 통해 참고용 번호 선택을 도와드립니다. 19세 이상 이용 가능한 오락 서비스입니다.
          </p>
          
          {/* CTA 버튼 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/recommendation"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              번호 추천 받기
            </Link>
          </div>
        </div>
        
        {/* 하단 장식 라인 */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
      </div>

      {/* 상단 광고 배너 - 심사 완료 후 추가 예정 */}
      {/* <AdSenseBanner className="my-8" /> */}

      {/* 최신 당첨 번호 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          🎯 실시간 번호 예측 서비스 - 최신 당첨 번호
        </h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
          </div>
        ) : latestDraw ? (
          <div className="space-y-6">

            
            <div className="text-center space-y-2">
              <p className="text-lg text-gray-600">
                <span className="font-semibold">{latestDraw.draw_number}회차</span>
                {' '}• {new Date(latestDraw.draw_date).toLocaleDateString('ko-KR')}
              </p>
              <p className="text-sm text-gray-500">
                당첨자: {latestDraw.first_winners}명 • 
                당첨금: {latestDraw.first_amount.toLocaleString()}원
              </p>
            </div>
            
            {/* 당첨 번호들 - 가운데 정렬, 간격 개선 */}
            <div className="flex justify-center">
              <div className="flex flex-wrap gap-2 sm:gap-4 lg:gap-6 justify-center max-w-fit">
                {latestDraw.numbers.map((number) => (
                  <LottoBall
                    key={number}
                    number={number}
                    size="responsive"
                    variant="default"
                  />
                ))}
                <div className="flex items-center">
                  <span className="text-lg sm:text-xl text-gray-400 mx-2 sm:mx-3">+</span>
                  <LottoBall
                    number={latestDraw.bonus_number}
                    size="responsive"
                    variant="default"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            최신 당첨 번호를 불러올 수 없습니다.
          </div>
        )}
      </div>

      {/* 중간 광고 - 정책 위반 방지를 위해 제거 */}
      {/* <AdSense adSlot="2468013579" className="my-8" /> */}

      {/* 서비스 특징 */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 text-center shadow-lg">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">AI</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">AI 머신러닝 기술의 로또 분석</h3>
          <p className="text-gray-600">
            머신러닝 알고리즘으로 과거 패턴을 분석하여 참고용 번호를 제안합니다.
          </p>
        </div>
        
        <div className="bg-white rounded-xl p-6 text-center shadow-lg">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">📊</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">과거 데이터 기반 통계 분석</h3>
          <p className="text-gray-600">
            빈도 분석, 트렌드 분석, 패턴 분석을 통해 과학적인 번호 선택을 도와줍니다.
          </p>
        </div>
        
        <div className="bg-white rounded-xl p-6 text-center shadow-lg">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">🎯</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">맞춤 추천</h3>
          <p className="text-gray-600">
            사용자의 선호도와 과거 선택 패턴을 고려한 개인화된 번호를 제안합니다.
          </p>
        </div>
      </div>

      {/* 하단 광고 - 정책 위반 방지를 위해 제거 */}
      {/* <AdSense adSlot="1357924680" className="my-8" /> */}

      {/* CTA 섹션 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">
          지금 바로 시작하세요!
        </h2>
        <p className="text-xl mb-6 opacity-90">
          AI가 분석한 로또 번호로 참고용 선택을 도와드립니다.
        </p>
        <Link
          to="/recommendation"
          className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
        >
                      번호 추천 받기
        </Link>
      </div>
    </div>
  );
};

export default Home;
