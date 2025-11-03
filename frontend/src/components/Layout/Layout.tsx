import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { UserProfile } from '../UserProfile';
import { useUnifiedAuth } from '../../contexts/UnifiedAuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useUnifiedAuth();

  // 디버깅을 위한 로그

  useEffect(() => {
  }, [location]);

  const navItems = [
    { path: '/', label: '홈' },
    { path: '/ml-intro', label: 'ML 안내' },
    { path: '/recommendation', label: '번호 추천' },
    { path: '/statistics', label: '통계' },
    // { path: '/history', label: '기록 보기' }, // 이전기록 기능 개발 중 - 일시 비활성화
  ];

  const handleNavClick = (path: string) => {
    
    // 모바일 메뉴 닫기
    setIsMobileMenuOpen(false);
    
    // 프로그래밍 방식으로도 네비게이션 시도
    try {
      navigate(path);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 로고 */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center" onClick={() => handleNavClick('/')}>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  로또리아 ML
                </span>
              </Link>
            </div>

            {/* 데스크톱 네비게이션 */}
            <div className="flex items-center space-x-8">
              <nav className="hidden md:flex space-x-8">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => handleNavClick(item.path)}
                    className={clsx(
                      'px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer',
                      location.pathname === item.path
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* 사용자 인증 영역 */}
              <div className="hidden md:flex items-center space-x-2">
                {isAuthenticated ? (
                  <UserProfile />
                ) : (
                  <button
                    onClick={() => navigate('/login')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    로그인
                  </button>
                )}
              </div>
            </div>

            {/* 모바일 메뉴 버튼 */}
            <div className="md:hidden flex items-center space-x-2">
              {isAuthenticated && <UserProfile />}
              <button 
                className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100 transition-colors"
                onClick={toggleMobileMenu}
                aria-label="메뉴 열기"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* 모바일 메뉴 */}
          {isMobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200 shadow-lg">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => handleNavClick(item.path)}
                    className={clsx(
                      'block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200',
                      location.pathname === item.path
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                
                {/* 모바일 로그인 버튼 */}
                {!isAuthenticated && (
                  <div className="px-3 py-2 border-t border-gray-200 mt-2 pt-4">
                    <button
                      onClick={() => {
                        navigate('/login');
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      로그인
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* 푸터 - 모던하고 세련된 디자인 */}
      <footer className="relative bg-gradient-to-r from-gray-50 via-blue-50/30 to-indigo-50/30 border-t border-gray-200/60 mt-auto overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
        <div className="absolute top-1/2 left-0 w-20 h-20 bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full -translate-y-1/2 -translate-x-10"></div>
        <div className="absolute top-1/2 right-0 w-16 h-16 bg-gradient-to-bl from-purple-200/20 to-pink-200/20 rounded-full -translate-y-1/2 translate-x-8"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="text-center space-y-4">
            {/* 로고와 브랜드 */}
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-bold">🎯</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                로또리아 ML
              </span>
            </div>

            {/* 메인 텍스트 */}
            <div className="space-y-2">
              <div className="flex justify-center space-x-4 mb-4 text-sm text-gray-600">
                <Link to="/terms" className="hover:text-blue-600 transition-colors">이용약관</Link>
                <Link to="/privacy-policy" className="hover:text-blue-600 transition-colors">개인정보처리방침</Link>
                <Link to="/cookie-settings" className="hover:text-blue-600 transition-colors">쿠키 설정</Link>
              </div>
              <p className="text-gray-700 font-medium">
                &copy; 2024 로또리아 ML · 인공지능 머신러닝 · 다양한 패턴 분석 · 높은 정확도
              </p>
              <p className="text-sm text-gray-500">
                행운을 빕니다! 🍀
              </p>
            </div>

            {/* 추가 정보 */}
            <div className="pt-4 border-t border-gray-200/60">
              <div className="flex items-center justify-center space-x-2 sm:space-x-4 text-xs text-gray-400 flex-wrap">
                <span>인공지능 머신러닝</span>
                <span className="text-gray-300">•</span>
                <span>다양한 패턴 분석</span>
                <span className="text-gray-300">•</span>
                <span>번호 관계 학습</span>
                <span className="text-gray-300">•</span>
                <span>신뢰도 제공</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Layout;
