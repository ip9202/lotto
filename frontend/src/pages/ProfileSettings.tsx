import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  email: string;
  nickname?: string;
  social_provider?: string;
  linked_social_providers?: string[];
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ProfileSettings: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('http://localhost:8000/api/v1/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
          navigate('/login');
        }
      } catch (error) {
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, [navigate]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
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

  const validatePasswordForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = '현재 비밀번호를 입력해주세요.';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = '새 비밀번호를 입력해주세요.';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = '새 비밀번호는 8자 이상이어야 합니다.';
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = '새 비밀번호 확인을 입력해주세요.';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = '새 비밀번호가 일치하지 않습니다.';
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      newErrors.newPassword = '현재 비밀번호와 새 비밀번호가 같습니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    setIsPasswordLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword
        })
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('비밀번호가 성공적으로 변경되었습니다.');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setErrors({ submit: result.message || '비밀번호 변경에 실패했습니다.' });
      }
    } catch (error) {
      setErrors({ submit: '비밀번호 변경 중 오류가 발생했습니다.' });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">프로필 설정</h1>
            <p className="text-gray-600">계정 정보를 관리하고 비밀번호를 변경할 수 있습니다.</p>
          </div>

          {/* 사용자 정보 섹션 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">계정 정보</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">이메일</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">닉네임</span>
                <span className="font-medium">{user.nickname || '미설정'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">로그인 방식</span>
                <span className="font-medium">
                  {user.social_provider === 'kakao' ? '카카오 로그인' : 
                   user.social_provider === 'naver' ? '네이버 로그인' : '이메일 로그인'}
                </span>
              </div>
              {user.linked_social_providers && user.linked_social_providers.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">연동된 소셜 계정</span>
                  <span className="font-medium">
                    {user.linked_social_providers.map(provider => 
                      provider === 'kakao' ? '카카오' : 
                      provider === 'naver' ? '네이버' : provider
                    ).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 비밀번호 변경 섹션 */}
          {(
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">비밀번호 변경</h2>
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    현재 비밀번호
                  </label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.currentPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="현재 비밀번호를 입력하세요"
                  />
                  {errors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    새 비밀번호
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.newPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="새 비밀번호를 입력하세요 (8자 이상)"
                  />
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    새 비밀번호 확인
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="새 비밀번호를 다시 입력하세요"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>

                {successMessage && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">{successMessage}</p>
                  </div>
                )}

                {errors.submit && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">{errors.submit}</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isPasswordLoading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPasswordLoading ? '변경 중...' : '비밀번호 변경'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 소셜 계정 연동 */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">소셜 계정 연동</h2>
            
            {user.linked_social_providers && user.linked_social_providers.length > 0 ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="text-lg font-medium text-blue-900 mb-2">연동된 소셜 계정</h3>
                <p className="text-blue-800">
                  {user.linked_social_providers.map(provider => 
                    provider === 'kakao' ? '카카오' : 
                    provider === 'naver' ? '네이버' : provider
                  ).join(', ')} 계정이 연동되어 있습니다. 
                  소셜 계정으로도 로그인할 수 있으며, 비밀번호는 언제든지 변경 가능합니다.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                <h3 className="text-lg font-medium text-gray-900 mb-2">소셜 계정 연동</h3>
                <p className="text-gray-600 mb-4">
                  소셜 계정을 연동하면 더 편리하게 로그인할 수 있습니다.
                </p>
                
                {/* 카카오 연동 버튼 */}
                <button
                  onClick={() => {
                    // 로그인 페이지로 이동해서 카카오 연동 진행
                    window.location.href = '/login?action=kakao_link';
                  }}
                  className="w-full flex items-center justify-center gap-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 5.84 2 10.8c0 3.12 1.68 5.88 4.32 7.56l-.96 3.48c-.12.36.24.72.6.48l4.56-2.76c.48.06.96.06 1.44.06 5.52 0 10-3.84 10-8.82C22 5.84 17.52 2 12 2z"/>
                  </svg>
                  카카오 계정 연동하기
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
