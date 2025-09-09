import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '../../contexts/UnifiedAuthContext';
import { useLoading, useNotification } from '../../hooks/common';

interface SaveRecommendationProps {
  numbers: number[];
  confidenceScore: number;
  generationMethod: 'ai' | 'manual' | 'hybrid';
  analysisData?: any;
  onSaved?: (savedId: number) => void;
  className?: string;
}

const SaveRecommendation: React.FC<SaveRecommendationProps> = ({
  numbers,
  confidenceScore,
  generationMethod,
  analysisData,
  onSaved,
  className = ''
}) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, refreshUser } = useUnifiedAuth();
  const { isLoading, withLoading } = useLoading();
  const { showSuccess, showError } = useNotification();
  const [isSaved, setIsSaved] = useState(false);

  const canSave = isAuthenticated && user?.can_save_number;
  
  // 디버깅용 로그
  console.log('🔢 현재 번호:', numbers);
  console.log('💾 저장 상태:', isSaved);
  console.log('🔐 저장 가능:', canSave);


  const handleQuickSave = async () => {
    if (!canSave) return;

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
          console.log('✅ 저장 성공! 버튼 상태 변경 중...');
          setIsSaved(true); // 저장 완료 상태로 변경
          console.log('✅ setIsSaved(true) 호출 완료');
          
          // 사용자 정보 새로고침 (저장 개수 업데이트)
          await refreshUser();
          console.log('✅ 사용자 정보 새로고침 완료');
          
          if (onSaved) {
            onSaved(result.data.id);
          }
          showSuccess('추천번호가 저장되었습니다!');
        } else {
          console.log('❌ 저장 실패:', result.error);
          showError(result.error?.message || '저장에 실패했습니다.');
        }
      } catch (err) {
        console.error('저장 오류:', err);
        showError('저장 중 오류가 발생했습니다.');
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
      <div className={`text-center p-4 bg-orange-50 rounded-lg ${className}`}>
        <p className="text-orange-700 text-sm mb-2">
          저장 한도를 초과했습니다 ({user?.total_saved_numbers}/10)
        </p>
        {!user?.is_premium && (
          <button className="text-orange-600 text-sm underline hover:no-underline">
            프리미엄으로 업그레이드
          </button>
        )}
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