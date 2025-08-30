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
    const percentScore = Math.round(score * 100);
    if (percentScore >= 55) return 'text-green-600 bg-green-100';
    if (percentScore >= 40) return 'text-blue-600 bg-blue-100';
    if (percentScore >= 30) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceText = (score: number) => {
    const percentScore = Math.round(score * 100);
    if (percentScore >= 55) return '높음';
    if (percentScore >= 40) return '보통';
    if (percentScore >= 30) return '낮음';
    return '아주 낮음';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold text-gray-700">
            조합 {index + 1}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            isManual ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
          }`}>
            {isManual ? '수동' : 'AI'}
          </span>
          {!isManual && (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidenceColor(confidenceScore)}`}>
              {getConfidenceText(confidenceScore)} ({Math.round(confidenceScore * 100)}%)
            </span>
          )}
        </div>
        <button
          onClick={onShowAnalysis}
          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-xs font-medium flex items-center space-x-1"
        >
          <span>📊</span>
          <span>상세</span>
        </button>
      </div>

      {/* 번호들 - 깔끔하게 */}
      <div className="flex justify-center items-center min-h-[80px]">
        <div className="flex gap-4 sm:gap-5 lg:gap-6 justify-center">
          {numbers.map((number, numIndex) => (
            <LottoBall
              key={numIndex}
              number={number}
              size="xs"
              variant="recommended"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimpleCombination;
