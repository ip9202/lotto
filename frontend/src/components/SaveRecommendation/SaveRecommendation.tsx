import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '../../contexts/UnifiedAuthContext';
import { useLoading } from '../../hooks/common';
import { useNotification } from '../../contexts/NotificationContext';

interface SaveRecommendationProps {
  numbers: number[];
  confidenceScore: number;
  generationMethod: 'ai' | 'manual' | 'hybrid';
  analysisData?: any;
  isSaved?: boolean; // 외부에서 전달받은 저장 상태
  onSaved?: (savedId: number) => void;
  onSavedStatusChange?: (isSaved: boolean) => void; // 저장 상태 변경 콜백
  className?: string;
}

const SaveRecommendation: React.FC<SaveRecommendationProps> = ({
  numbers,
  confidenceScore,
  generationMethod,
  analysisData,
  isSaved: externalIsSaved = false,
  onSaved,
  onSavedStatusChange,
  className = ''
}) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, refreshUser } = useUnifiedAuth();
  const { isLoading, withLoading } = useLoading();
  const { showSuccess, showError } = useNotification();
  // 외부에서 전달받은 저장 상태 사용 (내부 state 제거)
  const isSaved = externalIsSaved;

  const canSave = isAuthenticated && user?.can_save_number;

  // 중복 번호 조합 체크 함수
  const checkDuplicateNumbers = async (targetNumbers: number[]): Promise<boolean> => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return false;

      const { savedRecommendationsAPI } = await import('../../services/apiService');
      const savedList = await savedRecommendationsAPI.getSavedRecommendations(token);
      
      if (savedList.success && savedList.data?.items) {
        // 저장된 번호들을 정렬해서 비교
        const sortedTargetNumbers = [...targetNumbers].sort((a, b) => a - b);
        
        for (const savedItem of savedList.data.items) {
          if (savedItem.numbers && Array.isArray(savedItem.numbers)) {
            const sortedSavedNumbers = [...savedItem.numbers].sort((a, b) => a - b);
            
            // 배열 길이와 각 요소가 모두 같은지 확인
            if (sortedTargetNumbers.length === sortedSavedNumbers.length &&
                sortedTargetNumbers.every((num, index) => num === sortedSavedNumbers[index])) {
              return true; // 중복 발견
            }
          }
        }
      }
      return false; // 중복 없음
    } catch (error) {
      console.error('중복 체크 중 오류:', error);
      return false; // 오류 시 저장 허용
    }
  };

  const handleQuickSave = async () => {
    console.log('🔍 저장 시도 - canSave:', canSave);
    console.log('🔍 저장 시도 - user?.total_saved_numbers:', user?.total_saved_numbers);
    
    // 사용자 정보를 먼저 새로고침해서 최신 상태를 확인
    console.log('🔄 사용자 정보 새로고침 중...');
    await refreshUser();
    
    // 백엔드에서 실제 저장 개수 확인
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const { savedRecommendationsAPI } = await import('../../services/apiService');
        const savedList = await savedRecommendationsAPI.getSavedRecommendations(token);
        // 올바른 저장 개수 계산 (data.total 또는 data.items.length 사용)
        const actualSavedCount = savedList.data?.total || savedList.data?.items?.length || 0;
        
        console.log('📊 백엔드 실제 저장 개수:', actualSavedCount);
        console.log('📊 프론트엔드 user.total_saved_numbers:', user?.total_saved_numbers);
        console.log('📊 백엔드 items 배열 길이:', savedList.data?.items?.length || 0);
        console.log('📊 백엔드 total 값:', savedList.data?.total || 0);
        
        // 실제 저장 개수가 10개 이상이면 저장 중단
        if (actualSavedCount >= 10) {
          console.log('⚠️ 실제 저장 개수가 10개 이상 - API 호출 중단');
          showError(
            '💾 저장 한도 초과!\n\n' +
            `현재 저장된 번호: ${actualSavedCount}개 (한도: 10개)\n` +
            '먼저 저장된 번호를 삭제한 후 다시 시도해 주세요.\n\n' +
            '📂 저장된 번호 관리 페이지에서 불필요한 번호를 삭제하실 수 있습니다.'
          );
          await refreshUser(); // 상태 동기화
          return;
        }
      } catch (error) {
        console.error('저장 개수 확인 중 오류:', error);
        console.log('🚨 API 호출 오류로 인해 저장을 중단합니다.');
        showError('저장 상태 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        return;
      }
    }
    
    // 새로고침 후 다시 확인
    if (!isAuthenticated || !user?.can_save_number) {
      console.log('⚠️ 저장 불가능 - API 호출 중단');
      console.log('⚠️ isAuthenticated:', isAuthenticated);
      console.log('⚠️ can_save_number:', user?.can_save_number);
      console.log('⚠️ total_saved_numbers:', user?.total_saved_numbers);
      
      showError('저장 한도가 초과되어 저장할 수 없습니다. 먼저 저장된 번호를 삭제해주세요.');
      return;
    }

    // 중복 번호 조합 체크
    console.log('🔍 중복 번호 조합 체크 중...');
    const isDuplicate = await checkDuplicateNumbers(numbers);
    if (isDuplicate) {
      console.log('⚠️ 중복 번호 조합 발견 - 저장 중단');
      showError(
        '⚠️ 이미 저장된 번호입니다!\n\n' +
        `번호: ${numbers.sort((a, b) => a - b).join(', ')}\n\n` +
        '같은 번호 조합이 이미 저장되어 있습니다.\n' +
        '다른 번호 조합을 선택하거나 저장된 번호를 확인해주세요.'
      );
      return;
    }
    console.log('✅ 중복 없음 - 저장 진행');

    await withLoading(async () => {
      try {
        const { savedRecommendationsAPI } = await import('../../services/apiService');
        const token = localStorage.getItem('access_token');
        const result = await savedRecommendationsAPI.saveRecommendation(token!, {
          numbers,
          confidence_score: confidenceScore,
          generation_method: generationMethod,
          analysis_data: analysisData,
          title: `${generationMethod === 'ai' ? 'AI' : '수동'} 추천 ${new Date().toLocaleDateString()}`
        });

        if (result.success && result.data) {
          // 외부 콜백으로 저장 상태 변경 알림
          if (onSavedStatusChange) {
            onSavedStatusChange(true);
          }
          
          // 사용자 정보 새로고침 (저장 개수 업데이트)
          await refreshUser();
          
          if (onSaved) {
            onSaved(result.data.id);
          }
          showSuccess('추천번호가 저장되었습니다!');
        } else {
          
          // 한도 초과 에러인지 체크 (403 에러나 관련 키워드 포함)
          const errorMessage = result.error?.message || '';
          const errorCode = result.error?.code || '';
          
          console.log('🚨 저장 실패 - 에러 코드:', errorCode);
          console.log('🚨 저장 실패 - 에러 메시지:', errorMessage);
          
          if (errorCode === 'HTTP_403' || 
              errorMessage.includes('한도') || 
              errorMessage.includes('limit') || 
              errorMessage.includes('초과') ||
              errorMessage.includes('Forbidden')) {
            console.log('💾 한도 초과 감지됨 - showError 호출');
            showError(
              '💾 저장 한도 초과!\n\n' +
              '회원님의 저장 한도(10개)가 가득 찼습니다.\n' +
              '먼저 저장된 번호를 삭제한 후 다시 시도해 주세요.\n\n' +
              '📂 저장된 번호 관리 페이지에서 불필요한 번호를 삭제하실 수 있습니다.'
            );
            
            // 사용자 정보 새로고침하여 can_save_number 상태 업데이트
            await refreshUser();
          } else {
            console.log('💾 일반 에러 처리');
            showError(result.error?.message || '저장에 실패했습니다.');
          }
        }
      } catch (err: any) {
        console.error('저장 오류:', err);
        
        // 네트워크 에러나 서버 에러 메시지 체크 (403 포함)
        const errorMessage = err?.response?.data?.message || err?.message || '';
        const statusCode = err?.response?.status;
        
        console.log('🚨 catch 블록 - 상태 코드:', statusCode);
        console.log('🚨 catch 블록 - 에러 메시지:', errorMessage);
        console.log('🚨 catch 블록 - 전체 에러:', err);
        
        if (statusCode === 403 || 
            errorMessage.includes('한도') || 
            errorMessage.includes('limit') || 
            errorMessage.includes('초과') ||
            errorMessage.includes('Forbidden')) {
          console.log('💾 catch에서 한도 초과 감지됨 - showError 호출');
          showError(
            '💾 저장 한도 초과!\n\n' +
            '회원님의 저장 한도(10개)가 가득 찼습니다.\n' +
            '먼저 저장된 번호를 삭제한 후 다시 시도해 주세요.\n\n' +
            '📂 저장된 번호 관리 페이지에서 불필요한 번호를 삭제하실 수 있습니다.'
          );
          
          // 사용자 정보 새로고침하여 can_save_number 상태 업데이트
          await refreshUser();
        } else {
          console.log('💾 catch에서 일반 에러 처리');
          showError('저장 중 오류가 발생했습니다.');
        }
      }
    });
  };


  if (!isAuthenticated) {
    return (
      <div className={`text-center p-4 bg-blue-50 rounded-lg ${className}`}>
        <p className="text-blue-700 text-sm mb-2">
          추천번호를 저장하려면 로그인이 필요합니다
        </p>
        <button 
          onClick={() => navigate('/login')}
          className="text-blue-600 text-sm underline hover:no-underline hover:text-blue-800 transition-colors"
        >
          로그인하기
        </button>
      </div>
    );
  }

  if (!canSave) {
    return (
      <div className={`p-4 bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl ${className}`}>
        <div className="text-center space-y-3">
          {/* 아이콘 */}
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          
          {/* 메인 메시지 */}
          <div>
            <p className="text-red-800 font-semibold text-base mb-1">
              더 이상 저장할 수 없습니다
            </p>
            <p className="text-red-700 text-sm">
              회원 저장 한도가 가득 찼습니다 ({user?.total_saved_numbers}/10)
            </p>
          </div>
          
          {/* 안내 메시지 */}
          <div className="bg-white/60 rounded-lg p-3 border border-red-200/50">
            <p className="text-red-700 text-sm leading-relaxed">
              먼저 <span className="font-semibold">저장된 번호</span>를 삭제한 후<br />
              다시 시도해 주세요
            </p>
          </div>
          
          {/* 액션 버튼들 */}
          <div className="flex flex-col space-y-2">
            <button 
              onClick={() => navigate('/saved-numbers')}
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>저장된 번호 관리</span>
            </button>
            
            {!user?.is_premium && (
              <button className="w-full py-2 px-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 transform hover:scale-[1.02]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span>프리미엄으로 무제한 저장</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isSaved) {
    return (
      <div className={`text-center p-4 bg-green-50 rounded-lg ${className}`}>
        <div className="flex items-center justify-center gap-2 text-green-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium">저장 완료</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* 저장 버튼 */}
      <button
        onClick={handleQuickSave}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {isLoading ? '저장 중...' : '저장하기'}
      </button>

    </div>
  );
};

export default SaveRecommendation;