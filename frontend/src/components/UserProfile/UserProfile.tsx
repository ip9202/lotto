import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '../../contexts/UnifiedAuthContext';

const UserProfile: React.FC = () => {
  const { user, logout, isAuthenticated } = useUnifiedAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center gap-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow duration-200 p-2"
      >
        {/* 프로필 이미지 또는 기본 아바타 */}
        {user.profile_image_url ? (
          <img
            src={user.profile_image_url}
            alt={user.nickname || '사용자'}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user.nickname ? user.nickname.charAt(0) : '?'}
            </span>
          </div>
        )}

        {/* 사용자 이름 및 플랜 */}
        <div className="hidden md:flex flex-col items-start text-left">
          <span className="text-sm font-medium text-gray-900">
            {user.nickname || '로또리아 사용자'}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            user.is_premium 
              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {user.subscription_status}
          </span>
        </div>

        {/* 드롭다운 아이콘 */}
        <svg
          className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
            isMenuOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 드롭다운 메뉴 */}
      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
          {/* 사용자 정보 섹션 */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {user.profile_image_url ? (
                <img
                  src={user.profile_image_url}
                  alt={user.nickname || '사용자'}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg font-medium">
                    {user.nickname ? user.nickname.charAt(0) : '?'}
                  </span>
                </div>
              )}
              <div>
                <div className="font-medium text-gray-900">
                  {user.nickname || '로또리아 사용자'}
                </div>
                <div className="text-sm text-gray-500">
                  {user.social_provider === 'kakao' ? '카카오' : '네이버'} 로그인
                </div>
              </div>
            </div>
          </div>

          {/* 사용량 정보 */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">1189회 추천생성</span>
                <span className="text-sm font-medium">
                  {user.daily_recommendation_count}개
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">1189회 저장된 번호</span>
                <span className="text-sm font-medium">
                  {user.total_saved_numbers} / {user.is_premium ? '∞' : '10'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">총 당첨횟수</span>
                <span className="text-sm font-medium text-green-600">
                  {user.total_wins}번
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">총 당첨금액</span>
                <span className="text-sm font-medium text-green-600">
                  {user.total_winnings.toLocaleString()}원
                </span>
              </div>
            </div>
          </div>

          {/* 메뉴 항목들 */}
          <div className="py-1">
            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              내 추천번호
            </button>
            <button 
              onClick={() => {
                navigate('/winning-history');
                setIsMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              당첨 이력
            </button>
            <button 
              onClick={() => {
                navigate('/profile-settings');
                setIsMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              프로필 설정
            </button>
            
            {/* 관리자 메뉴 - 관리자 권한이 있는 경우에만 표시 */}
            {user.role === 'admin' && (
              <button 
                onClick={() => {
                  navigate('/admin');
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 font-medium"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  관리자 페이지
                </div>
              </button>
            )}
            
            {!user.is_premium && (
              <button className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50">
                프리미엄 업그레이드
              </button>
            )}
          </div>

          {/* 로그아웃 */}
          <div className="border-t border-gray-100 pt-1">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              로그아웃
            </button>
          </div>
        </div>
      )}

      {/* 메뉴 외부 클릭시 닫기 */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default UserProfile;