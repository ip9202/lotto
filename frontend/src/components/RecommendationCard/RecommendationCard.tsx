import React from 'react';
import { clsx } from 'clsx';
import LottoBall from '../LottoBall';

interface RecommendationCardProps {
  numbers: number[];
  confidenceScore: number;
  combinationType: string;
  analysis?: {
    hotNumbers: number;
    coldNumbers: number;
    oddEvenRatio: string;
    sum: number;
    consecutiveCount: number;
    rangeDistribution: string;
  };
  className?: string;
  onRegenerate?: () => void;
  showRegenerateButton?: boolean;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  numbers,
  confidenceScore,
  combinationType,
  analysis,
  className,
  onRegenerate,
  showRegenerateButton = false
}) => {
  const getConfidenceColor = (score: number) => {
    if (score >= 75) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 45) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceText = (score: number) => {
    if (score >= 75) return '높음';
    if (score >= 60) return '보통';
    if (score >= 45) return '낮음';
    return '아주 낮음';
  };

  return (
    <div className={clsx(
      'bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300',
      className
    )}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold text-gray-900">
            {combinationType === 'AI' ? '🤖 AI 추천' : '👤 수동 입력'}
          </span>
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
            {combinationType}
          </span>
        </div>
        
        {/* 신뢰도 점수 */}
        <div className={clsx(
          'px-3 py-1 rounded-full text-sm font-medium',
          getConfidenceColor(confidenceScore)
        )}>
          신뢰도: {getConfidenceText(confidenceScore)}
        </div>
      </div>

      {/* 로또 번호들 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">추천 번호</h4>
        <div className="flex flex-wrap gap-3 justify-center">
          {numbers.map((number, index) => (
            <LottoBall
              key={index}
              number={number}
              size="lg"
              variant="recommended"
            />
          ))}
        </div>
      </div>

      {/* 분석 정보 */}
      {analysis && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">번호 분석</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">핫 넘버:</span>
              <span className="font-medium">{analysis.hotNumbers}개</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">콜드 넘버:</span>
              <span className="font-medium">{analysis.coldNumbers}개</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">홀짝 비율:</span>
              <span className="font-medium">{analysis.oddEvenRatio}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">합계:</span>
              <span className="font-medium">{analysis.sum}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">연속 번호:</span>
              <span className="font-medium">{analysis.consecutiveCount}개</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">구간 분포:</span>
              <span className="font-medium text-xs">{analysis.rangeDistribution}</span>
            </div>
          </div>
        </div>
      )}

      {/* 액션 버튼들 */}
      <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-200">
        <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          번호 저장
        </button>
        {showRegenerateButton && onRegenerate && (
          <button 
            onClick={onRegenerate}
            className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
          >
            🔄 재생성
          </button>
        )}
        <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
          상세 분석
        </button>
      </div>
    </div>
  );
};

export default RecommendationCard;
