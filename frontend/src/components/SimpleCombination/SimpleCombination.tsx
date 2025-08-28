import React from 'react';
import LottoBall from '../LottoBall';

interface SimpleCombinationProps {
  numbers: number[];
  index: number;
  isManual: boolean;
  confidenceScore: number;
  onRegenerate: () => void;
  onShowAnalysis: () => void;
}

const SimpleCombination: React.FC<SimpleCombinationProps> = ({
  numbers,
  index,
  isManual,
  confidenceScore,
  onRegenerate,
  onShowAnalysis
}) => {
  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceText = (score: number) => {
    if (score >= 80) return '매우 높음';
    if (score >= 60) return '높음';
    if (score >= 40) return '보통';
    return '낮음';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-600">
            조합 {index + 1}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            isManual ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
          }`}>
            {isManual ? '수동' : 'AI'}
          </span>
          {!isManual && (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidenceColor(confidenceScore)}`}>
              {confidenceScore}%
            </span>
          )}
        </div>
      </div>

      {/* 번호들 */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {numbers.map((number, numIndex) => (
          <LottoBall
            key={numIndex}
            number={number}
            size="md"
            variant="recommended"
          />
        ))}
      </div>

      {/* 액션 버튼들 */}
      <div className="flex space-x-2">
        {!isManual && (
          <button
            onClick={onRegenerate}
            className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
          >
            <span>🔄</span>
            <span>재생성</span>
          </button>
        )}
        <button
          onClick={onShowAnalysis}
          className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
        >
          <span>📊</span>
          <span>상세분석</span>
        </button>
      </div>
    </div>
  );
};

export default SimpleCombination;
