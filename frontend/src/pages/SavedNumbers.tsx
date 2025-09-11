import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { userPreferencesAPI, UserPreferences, savedRecommendationsAPI } from '../services/apiService';
import { useNotification } from '../contexts/NotificationContext';
import LottoBall from '../components/LottoBall';

const SavedNumbers: React.FC = () => {
  const { isAuthenticated, refreshUser } = useUnifiedAuth();
  const { showError, showSuccess } = useNotification();
  const [savedRecommendations, setSavedRecommendations] = useState<any[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    include_numbers: [],
    exclude_numbers: []
  });
  const [loading, setLoading] = useState(true);
  const [currentDrawNumber, setCurrentDrawNumber] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // 현재 회차 번호 조회
  const fetchCurrentDrawNumber = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/lotto/latest`);
      if (response.ok) {
        const data = await response.json();
        console.log('현재 회차 API 응답:', data);
        // API 응답 구조: { success: true, data: { draw_number: 1188, ... } }
        if (data.success && data.data) {
          const nextDrawNumber = data.data.draw_number + 1;
          console.log('다음 회차 번호:', nextDrawNumber);
          setCurrentDrawNumber(nextDrawNumber);
          return nextDrawNumber;
        }
      }
    } catch (error) {
      console.error('현재 회차 조회 오류:', error);
    }
    return null;
  };

  // 저장된 추천번호 조회 (이번 회차만)
  const fetchSavedRecommendations = async (targetDraw: number) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      console.log('저장된 추천번호 조회 - targetDraw:', targetDraw);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/saved-recommendations?target_draw=${targetDraw}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('저장된 추천번호 API 응답 상태:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('저장된 추천번호 API 응답:', data);
        // API 응답이 { items: [...], total: ... } 형태이므로 items 배열을 사용
        setSavedRecommendations(data.items || []);
      } else {
        const errorText = await response.text();
        console.error('저장된 추천번호 API 에러:', errorText);
      }
    } catch (error) {
      console.error('저장된 추천번호 조회 오류:', error);
    }
  };

  // 사용자 설정 조회
  const fetchUserPreferences = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const result = await userPreferencesAPI.getPreferences(token);
      console.log('사용자 설정 API 응답:', result);
      if (result.success && result.data) {
        console.log('설정된 포함 번호:', result.data.include_numbers);
        console.log('설정된 제외 번호:', result.data.exclude_numbers);
        setUserPreferences(result.data);
      }
    } catch (error) {
      console.error('사용자 설정 조회 오류:', error);
    }
  };

  // 저장된 추천번호 삭제
  const handleDeleteRecommendation = async (id: number) => {
    if (!window.confirm('정말로 이 추천번호를 삭제하시겠습니까?')) {
      return;
    }

    setDeletingId(id);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        showError('로그인이 필요합니다.');
        return;
      }

      const result = await savedRecommendationsAPI.deleteRecommendation(token, id);
      if (result.success) {
        // 로컬 상태에서 삭제
        setSavedRecommendations(prev => prev.filter(rec => rec.id !== id));
        // 사용자 정보 새로고침 (저장 개수 업데이트)
        await refreshUser();
        showSuccess('추천번호가 삭제되었습니다.');
      } else {
        showError(result.error?.message || '삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      showError('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const loadData = async () => {
        setLoading(true);
        // 1. 현재 회차 번호 조회
        const currentDraw = await fetchCurrentDrawNumber();
        if (currentDraw) {
          // 2. 이번 회차 저장된 추천번호 조회
          await fetchSavedRecommendations(currentDraw);
        }
        // 3. 사용자 설정 조회
        await fetchUserPreferences();
        setLoading(false);
      };
      loadData();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h1>
          <p className="text-gray-600">저장된 번호를 보려면 로그인해주세요.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">내 저장번호</h1>
          <p className="text-gray-600">
            {currentDrawNumber ? `제${currentDrawNumber}회차` : '현재 회차'}에서 저장한 추천번호와 포함/제외 번호 설정을 확인할 수 있습니다.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 저장된 추천번호 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                💾
              </span>
              {currentDrawNumber ? `제${currentDrawNumber}회차` : '이번 회차'} 저장된 추천번호
            </h2>

            {savedRecommendations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📝</span>
                </div>
                <p className="text-lg font-medium">저장된 번호가 없습니다</p>
                <p className="text-sm">추천받은 번호를 저장해보세요!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {savedRecommendations.map((rec, index) => (
                  <div key={rec.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                           <div className="flex items-center justify-between mb-3">
                             <div className="flex items-center space-x-3">
                               <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full">
                                 {savedRecommendations.length - index}
                               </span>
                               <span className="text-sm font-medium text-gray-600">
                                 {rec.title ? rec.title.replace(/\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\./g, '').trim() || 'AI 추천' : 'AI 추천'}
                               </span>
                             </div>
                             <div className="flex items-center gap-2">
                               <span className="text-xs text-gray-500">
                                 {new Date(rec.created_at).toLocaleDateString()}
                               </span>
                        <button
                          onClick={() => handleDeleteRecommendation(rec.id)}
                          disabled={deletingId === rec.id}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="삭제"
                        >
                          {deletingId === rec.id ? (
                            <div className="w-5 h-5 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {rec.numbers.map((number: number) => (
                        <LottoBall
                          key={number}
                          number={number}
                          size="sm"
                          variant="default"
                        />
                      ))}
                    </div>
                    {rec.confidence_score && (
                      <div className="mt-2 text-xs text-gray-500">
                        신뢰도: {Math.round(rec.confidence_score * 100)}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 포함/제외 번호 설정 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                ⚙️
              </span>
              포함/제외 번호 설정
            </h2>

            {/* 포함할 번호 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">포함할 번호</h3>
              {console.log('렌더링 시 userPreferences:', userPreferences)}
              {!userPreferences.include_numbers || userPreferences.include_numbers.length === 0 ? (
                <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                  <p className="text-sm">포함할 번호가 설정되지 않았습니다</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {userPreferences.include_numbers?.map((number) => (
                    <LottoBall
                      key={number}
                      number={number}
                      size="sm"
                      variant="selected"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 제외할 번호 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">제외할 번호</h3>
              {!userPreferences.exclude_numbers || userPreferences.exclude_numbers.length === 0 ? (
                <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                  <p className="text-sm">제외할 번호가 설정되지 않았습니다</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {userPreferences.exclude_numbers?.map((number) => (
                    <LottoBall
                      key={number}
                      number={number}
                      size="sm"
                      variant="default"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 설정 안내 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>설정 변경</strong>: 추천 페이지의 고급 추천에서 포함/제외 번호를 설정할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavedNumbers;
