import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import SocialLogin from '../components/SocialLogin/SocialLogin';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useUnifiedAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nickname: ''
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showKakaoLink, setShowKakaoLink] = useState(false);
  const [pendingKakaoData, setPendingKakaoData] = useState<{accessToken: string, userInfo: any} | null>(null);
  const processingRef = useRef(false);

  // 카카오 콜백 처리
  useEffect(() => {
    const handleKakaoCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      if (!code || !state || !state.startsWith('kakao_login_')) {
        return;
      }

      // 세션 스토리지 기반 중복 방지 (더 강력함)
      const processKey = `kakao_processing_${code}`;
      const isAlreadyProcessing = sessionStorage.getItem(processKey);
      
      if (isAlreadyProcessing || processingRef.current) {
        return;
      }

      // 즉시 URL 정리하여 중복 실행 방지
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // 처리 시작 마킹
      sessionStorage.setItem(processKey, 'true');
      processingRef.current = true;
      
      
      try {
        // 카카오 SDK 초기화
        if (!window.Kakao || !window.Kakao.isInitialized()) {
          window.Kakao.init(import.meta.env.VITE_KAKAO_APP_KEY);
        }
        
        // 카카오에서 액세스 토큰 가져오기
        const redirectUri = `${window.location.origin}/login`;
        
        const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: import.meta.env.VITE_KAKAO_APP_KEY,
            redirect_uri: redirectUri,
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
          
          const userData = await userResponse.json();
          
          // handleKakaoLogin 함수 호출
          await handleKakaoLogin(tokenData.access_token, userData);
        } else {
          setErrors({ submit: '카카오 인증에 실패했습니다.' });
        }
      } catch (error) {
        console.error('카카오 콜백 처리 오류:', error);
        setErrors({ submit: '카카오 로그인 중 오류가 발생했습니다.' });
      } finally {
        // 처리 완료 후 정리
        sessionStorage.removeItem(processKey);
        processingRef.current = false;
      }
    };

    handleKakaoCallback();
  }, []); // 의존성 배열을 비워서 한 번만 실행되도록 수정

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 입력 시 에러 메시지 제거
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // 이메일 검증
    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.';
    }

    // 비밀번호 검증
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await login(formData.email, formData.password);
      
      if (success) {
        // 로그인 성공 후 카카오 연동이 대기 중이면 연동 진행
        if (pendingKakaoData) {
          await handleKakaoLink(pendingKakaoData.accessToken);
          setPendingKakaoData(null);
        } else {
          // 일반 로그인인 경우 사용자 정보 확인 후 카카오 연동 상태 체크
          try {
            const response = await fetch('http://localhost:8000/api/v1/auth/me', {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
              }
            });
            
            if (response.ok) {
              const userData = await response.json();
              
              // 이미 카카오 연동된 계정이면 바로 메인 페이지로 이동
              if (userData.linked_social_providers && userData.linked_social_providers.includes('KAKAO')) {
                window.location.href = '/';
                return;
              }
              
              // 카카오 연동되지 않은 계정이면 연동 옵션 표시
              setShowKakaoLink(true);
            } else {
              // 사용자 정보를 가져올 수 없으면 바로 메인 페이지로 이동
              window.location.href = '/';
            }
          } catch (error) {
            console.error('사용자 정보 확인 오류:', error);
            // 오류 발생 시에도 메인 페이지로 이동
            window.location.href = '/';
          }
        }
      } else {
        setErrors({ submit: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      setErrors({ submit: '로그인 중 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKakaoLoginClick = () => {
    // Placeholder function
  }; handleKakaoLoginClick;

  const handleKakaoLogin = async (accessToken: string, _user: any) => {
    try {
      // 1. 먼저 카카오 사용자 정보 확인
      const checkResponse = await fetch('http://localhost:8000/api/v1/auth/check-kakao-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'kakao',
          access_token: accessToken
        })
      });

      const checkResult = await checkResponse.json();
      
      if (checkResult.success) {
        if (checkResult.data.is_registered) {
          // 기존 계정이 있으면 자동 로그인
          setIsLoading(true);
          setErrors({ submit: '카카오 로그인 중...' });
          
          const loginResponse = await fetch('http://localhost:8000/api/v1/auth/login/social', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              provider: 'kakao',
              access_token: accessToken
            })
          });
          
          const loginResult = await loginResponse.json();
          
          if (loginResult.success) {
            // 로그인 성공 - 토큰 저장 및 상태 업데이트
            localStorage.setItem('access_token', loginResult.data.access_token);
            
            // 전체 화면 로딩 표시
            setShowKakaoLink(false);
            setPendingKakaoData(null);
            
            // 1초 후 메인 페이지로 이동
            setTimeout(() => {
              window.location.href = '/';
            }, 1000);
          } else {
            setIsLoading(false);
            setErrors({ submit: '카카오 로그인에 실패했습니다.' });
          }
        } else {
          // 가입된 계정이 없으면 사용자에게 선택하게 하기
          // 카카오 데이터를 저장해두기 (회원가입/로그인 후 연동용)
          setPendingKakaoData({
            accessToken: accessToken,
            userInfo: checkResult.data.user_info
          });
          setErrors({ 
            submit: '카카오 로그인을 위해서는 먼저 로또리아AI와 계정연동이 필요합니다.' 
          });
        }
      } else {
        setErrors({ submit: '카카오 사용자 확인에 실패했습니다.' });
      }
    } catch (error) {
      console.error('카카오 로그인 오류:', error);
      setErrors({ submit: '카카오 로그인 중 오류가 발생했습니다.' });
    }
  };

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
          const loginResponse = await fetch('http://localhost:8000/api/v1/auth/login/social', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              provider: 'kakao',
              access_token: accessToken
            })
          });
          
          const loginResult = await loginResponse.json();
          
          if (loginResult.success) {
            // 로그인 성공 - 토큰 저장 및 상태 업데이트
            localStorage.setItem('access_token', loginResult.data.access_token);
            window.location.href = '/';
          } else {
            setErrors({ submit: '자동 로그인에 실패했습니다.' });
          }
        } else {
          setErrors({ submit: '카카오 연동에 실패했습니다.' });
        }
      } else {
        setErrors({ submit: '회원가입에 실패했습니다.' });
      }
    } catch (error) {
      console.error('카카오 회원가입 오류:', error);
      setErrors({ submit: '카카오 회원가입 중 오류가 발생했습니다.' });
    }
  };

  const handleKakaoLink = async (accessToken: string) => {
    try {
      // 현재 로그인된 사용자와 카카오 연동
      const linkResponse = await fetch('http://localhost:8000/api/v1/auth/link/kakao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          provider: 'kakao',
          access_token: accessToken
        })
      });

      const linkResult = await linkResponse.json();
      
      if (linkResult.success) {
        // 연동 성공 - 메인 페이지로 이동
        window.location.href = '/';
      } else {
        setErrors({ submit: '카카오 연동에 실패했습니다.' });
      }
    } catch (error) {
      console.error('카카오 연동 오류:', error);
      setErrors({ submit: '카카오 연동 중 오류가 발생했습니다.' });
    }
  };


  const handleSkipKakaoLink = () => {
    navigate('/');
  };
  
  // Prevent unused variable warnings
  void handleKakaoLoginClick;
  void handleKakaoRegister;

  // 이미 로그인된 경우 홈으로 리다이렉트
  useEffect(() => {
    if (isAuthenticated && !showKakaoLink) {
      navigate('/');
    }
  }, [isAuthenticated, showKakaoLink, navigate]);

  // 이미 로그인된 경우 로딩 표시
  if (isAuthenticated && !showKakaoLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">이미 로그인됨</h2>
          <p className="text-gray-600">홈으로 이동 중...</p>
        </div>
      </div>
    );
  }

  // 카카오 로그인 성공 후 로딩 중일 때 전체 화면 로딩 표시
  if (isLoading && !showKakaoLink && !pendingKakaoData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">로그인 성공!</h2>
          <p className="text-gray-600">잠시 후 메인 페이지로 이동합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {showKakaoLink ? '카카오 연동' : '로그인'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {showKakaoLink ? (
              '카카오 계정을 연동하시겠어요?'
            ) : (
              <>
                계정이 없으신가요?{' '}
                <Link
                  to="/register"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  회원가입하기
                </Link>
              </>
            )}
          </p>
        </div>
        
        {!showKakaoLink ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* 이메일 */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  이메일 주소
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                  placeholder="이메일을 입력하세요"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* 비밀번호 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  비밀번호
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                  placeholder="비밀번호를 입력하세요"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>

            {/* 제출 에러 */}
            {errors.submit && (
              <div className="text-center">
                <p className="text-sm text-red-600 mb-4">{errors.submit}</p>
                {pendingKakaoData && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">계정이 있으신가요? 아래에서 로그인해주세요.</p>
                    <button
                      onClick={async () => {
                        // 현재 폼의 이메일/비밀번호로 바로 로그인 처리
                        if (!formData.email || !formData.password) {
                          setErrors({ submit: '이메일과 비밀번호를 입력해주세요.' });
                          return;
                        }

                        setIsLoading(true);
                        setErrors({});

                        try {
                          const success = await login(formData.email, formData.password);
                          
                          if (success) {
                            // 로그인 성공 후 카카오 연동 진행
                            if (pendingKakaoData) {
                              await handleKakaoLink(pendingKakaoData.accessToken);
                              setPendingKakaoData(null);
                            } else {
                              window.location.href = '/';
                            }
                          } else {
                            setErrors({ submit: '이메일 또는 비밀번호가 올바르지 않습니다.' });
                          }
                        } catch (error) {
                          console.error('로그인 오류:', error);
                          setErrors({ submit: '로그인 중 오류가 발생했습니다.' });
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      disabled={isLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? '로그인 중...' : '로그인하기'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 제출 버튼 - 카카오 연동 안내가 있을 때는 숨김 */}
            {!pendingKakaoData && (
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '로그인 중...' : '로그인'}
                </button>
              </div>
            )}

            {/* 소셜 로그인 */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">또는</span>
                </div>
              </div>

              <div className="mt-6">
                <SocialLogin 
                  onLogin={handleKakaoLogin}
                  onClose={() => {}}
                  className="w-full"
                />
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  카카오 로그인 시 자동으로 가입/로그인됩니다.
                </p>
              </div>
            </div>
          </form>
        ) : (
          <div className="mt-8 space-y-6">
            {/* 로그인 성공 메시지 */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                로그인 성공! 카카오 계정을 연동하시겠어요?
              </p>
            </div>

            {/* 카카오 연동 버튼 */}
            <div className="mt-6">
              <SocialLogin 
                onLogin={handleKakaoLink}
                onClose={() => {}}
                className="w-full"
              />
            </div>

            {/* 건너뛰기 버튼 */}
            <div className="mt-4">
              <button
                onClick={handleSkipKakaoLink}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                나중에 연동하기
              </button>
            </div>

            {/* 제출 에러 */}
            {errors.submit && (
              <div className="text-center">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Prevent unused variable warnings (moved to inside component scope)

export default Login;
