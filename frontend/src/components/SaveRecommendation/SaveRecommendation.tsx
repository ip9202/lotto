import React, { useState } from 'react';
import { useUnifiedAuth } from '../../contexts/UnifiedAuthContext';
import { useLoading, useNotification } from '../../hooks/common';
import { Modal } from '../../components/common';

interface SaveRecommendationProps {
  numbers: number[];
  confidenceScore: number;
  generationMethod: 'ai' | 'manual' | 'hybrid';
  analysisData?: any;
  onSaved?: (savedId: number) => void;
  className?: string;
}

interface SaveFormData {
  title: string;
  memo: string;
  tags: string[];
  targetDrawNumber?: number;
}

const SaveRecommendation: React.FC<SaveRecommendationProps> = ({
  numbers,
  confidenceScore,
  generationMethod,
  analysisData,
  onSaved,
  className = ''
}) => {
  const { user, isAuthenticated } = useUnifiedAuth();
  const { isLoading, withLoading } = useLoading();
  const { showSuccess, showError } = useNotification();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState<SaveFormData>({
    title: '',
    memo: '',
    tags: [],
    targetDrawNumber: undefined
  });

  const [tagInput, setTagInput] = useState('');

  const canSave = isAuthenticated && user?.can_save_number;

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
          title: `${generationMethod === 'ai' ? 'AI' : '수동'} 추천 ${new Date().toLocaleDateString()}`,
          memo: undefined,
          tags: undefined
        });

        if (result.success && result.data) {
          if (onSaved) {
            onSaved(result.data.id);
          }
          showSuccess('추천번호가 저장되었습니다!');
        } else {
          showError(result.error?.message || '저장에 실패했습니다.');
        }
      } catch (err) {
        console.error('저장 오류:', err);
        showError('저장 중 오류가 발생했습니다.');
      }
    });
  };

  const handleDetailedSave = async () => {
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
          title: formData.title || `${generationMethod === 'ai' ? 'AI' : '수동'} 추천`,
          memo: formData.memo || undefined,
          tags: formData.tags.length > 0 ? formData.tags : undefined,
          target_draw_number: formData.targetDrawNumber
        });

        if (result.success && result.data) {
          if (onSaved) {
            onSaved(result.data.id);
          }
          setIsModalOpen(false);
          setFormData({ title: '', memo: '', tags: [] });
          showSuccess('추천번호가 저장되었습니다!');
        } else {
          showError(result.error?.message || '저장에 실패했습니다.');
        }
      } catch (err) {
        console.error('저장 오류:', err);
        showError('저장 중 오류가 발생했습니다.');
      }
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim()) && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  if (!isAuthenticated) {
    return (
      <div className={`text-center p-4 bg-blue-50 rounded-lg ${className}`}>
        <p className="text-blue-700 text-sm mb-2">
          추천번호를 저장하려면 로그인이 필요합니다
        </p>
        <button className="text-blue-600 text-sm underline hover:no-underline">
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

  return (
    <div className={className}>
      <div className="flex gap-2">
        {/* 빠른 저장 버튼 */}
        <button
          onClick={handleQuickSave}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          빠른 저장
        </button>

        {/* 상세 저장 버튼 */}
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={isLoading}
          className="px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>

      {/* 상세 저장 모달 */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="추천번호 저장"
        size="md"
      >

              {/* 번호 표시 */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">저장할 번호</div>
                <div className="flex gap-2 flex-wrap">
                  {numbers.map((num, index) => (
                    <span key={index} className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {num}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  신뢰도: {Math.round(confidenceScore * 100)}%
                </div>
              </div>

              {/* 폼 필드들 */}
              <div className="space-y-4">
                {/* 제목 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    제목
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={`${generationMethod === 'ai' ? 'AI' : '수동'} 추천 ${new Date().toLocaleDateString()}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* 메모 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    메모
                  </label>
                  <textarea
                    value={formData.memo}
                    onChange={(e) => setFormData(prev => ({ ...prev, memo: e.target.value }))}
                    placeholder="이 번호에 대한 메모를 남겨보세요..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* 태그 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    태그 (최대 10개)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="태그 입력 후 Enter"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleAddTag}
                      type="button"
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      추가
                    </button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 목표 회차 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    목표 회차 (선택사항)
                  </label>
                  <input
                    type="number"
                    value={formData.targetDrawNumber || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      targetDrawNumber: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="예: 1050"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

          {/* 버튼들 */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setIsModalOpen(false)}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
            <button
              onClick={handleDetailedSave}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              저장하기
            </button>
          </div>
      </Modal>
    </div>
  );
};

export default SaveRecommendation;