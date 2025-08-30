import React from 'react';
import LottoBall from '../LottoBall';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  numbers: number[];
  combinationType: string;
  confidenceScore: number;
  analysis?: {
    hot_numbers: number;
    cold_numbers: number;
    hot_number_list?: number[];
    cold_number_list?: number[];
    odd_even_ratio: string;
    odd_numbers?: number[];
    even_numbers?: number[];
    sum: number;
    consecutive_count: number;
    consecutive_numbers?: number[];
    range_distribution: string;
  };
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({
  isOpen,
  onClose,
  numbers,
  combinationType,
  confidenceScore,
  analysis
}) => {
  if (!isOpen) return null;

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            📊 상세 분석
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6 space-y-6">
          {/* 조합 정보 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {combinationType === 'AI' ? '🤖 AI 추천' : '👤 수동 입력'}
              </h3>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                combinationType === 'AI' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {combinationType}
              </span>
            </div>
            
            {combinationType === 'AI' && (
              <div className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getConfidenceColor(confidenceScore)}`}>
                신뢰도: {getConfidenceText(confidenceScore)}
              </div>
            )}
          </div>

          {/* 번호들 */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">추천 번호</h4>
            <div className="flex flex-wrap gap-3 justify-center">
              {numbers.map((number, index) => (
                <LottoBall
                  key={index}
                  number={number}
                  size="xs"
                  variant="default"
                />
              ))}
            </div>
          </div>

          {/* 상세 분석 */}
          {analysis && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">번호 분석</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">핫/콜드 분석</h5>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-blue-700">핫 넘버:</span>
                        <span className="font-medium text-blue-900">{analysis.hot_numbers}개</span>
                      </div>
                      {analysis.hot_number_list && analysis.hot_number_list.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {analysis.hot_number_list.map((num) => (
                            <span key={num} className="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-700 text-xs font-semibold rounded-full border border-red-200">
                              {num}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-blue-600 text-xs italic">
                          {analysis.hot_numbers > 0 ? '핫 넘버 정보를 확인하려면 백엔드를 업데이트하세요' : '핫 넘버가 없습니다'}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-blue-700">콜드 넘버:</span>
                        <span className="font-medium text-blue-900">{analysis.cold_numbers}개</span>
                      </div>
                      {analysis.cold_number_list && analysis.cold_number_list.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {analysis.cold_number_list.map((num) => (
                            <span key={num} className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
                              {num}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-blue-600 text-xs italic">
                          {analysis.cold_numbers > 0 ? '콜드 넘버 정보를 확인하려면 백엔드를 업데이트하세요' : '콜드 넘버가 없습니다'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h5 className="font-medium text-green-900 mb-2">패턴 분석</h5>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-green-700">홀짝 비율:</span>
                        <span className="font-medium text-green-900">{analysis.odd_even_ratio}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {analysis.odd_numbers && analysis.odd_numbers.map((num, index) => (
                          <span 
                            key={`odd-${index}`} 
                            className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full border-2 bg-blue-100 text-blue-700 border-blue-300"
                          >
                            {num}
                          </span>
                        ))}
                        {analysis.even_numbers && analysis.even_numbers.map((num, index) => (
                          <span 
                            key={`even-${index}`} 
                            className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full border-2 bg-pink-100 text-pink-700 border-pink-300"
                          >
                            {num}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-green-700">연속 번호:</span>
                        <span className="font-medium text-green-900">{analysis.consecutive_count}개</span>
                      </div>
                      {analysis.consecutive_numbers && analysis.consecutive_numbers.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {analysis.consecutive_numbers.map((num, index) => (
                            <span 
                              key={`consecutive-${index}`} 
                              className="inline-flex items-center justify-center w-5 h-5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full border-2 border-yellow-300"
                            >
                              {num}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h5 className="font-medium text-purple-900 mb-2">수치 분석</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-purple-700">번호 합계:</span>
                      <span className="font-medium">{analysis.sum}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700">평균:</span>
                      <span className="font-medium">{Math.round(analysis.sum / 6)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h5 className="font-medium text-orange-900 mb-2">구간 분포</h5>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-orange-700">1-15:</span>
                        <span className="font-medium text-orange-900">
                          {analysis.range_distribution.includes('1-15:') 
                            ? analysis.range_distribution.split('1-15:')[1]?.split(',')[0] || '0'
                            : '0'
                          }개
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Array.from({ length: parseInt(analysis.range_distribution.includes('1-15:') 
                          ? analysis.range_distribution.split('1-15:')[1]?.split(',')[0] || '0'
                          : '0') }, (_, i) => (
                          <span 
                            key={`range1-${i}`} 
                            className="inline-flex items-center justify-center w-5 h-5 bg-red-100 text-red-700 text-xs font-semibold rounded-full border-2 border-red-300"
                          >
                            {i + 1}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-orange-700">16-30:</span>
                        <span className="font-medium text-orange-900">
                          {analysis.range_distribution.includes('16-30:') 
                            ? analysis.range_distribution.split('16-30:')[1]?.split(',')[0] || '0'
                            : '0'
                          }개
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Array.from({ length: parseInt(analysis.range_distribution.includes('16-30:') 
                          ? analysis.range_distribution.split('16-30:')[1]?.split(',')[0] || '0'
                          : '0') }, (_, i) => (
                          <span 
                            key={`range2-${i}`} 
                            className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full border-2 border-blue-300"
                          >
                            {i + 16}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-orange-700">31-45:</span>
                        <span className="font-medium text-orange-900">
                          {analysis.range_distribution.includes('31-45:') 
                            ? analysis.range_distribution.split('31-45:')[1] || '0'
                            : '0'
                          }개
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Array.from({ length: parseInt(analysis.range_distribution.includes('31-45:') 
                          ? analysis.range_distribution.split('31-45:')[1] || '0'
                          : '0') }, (_, i) => (
                          <span 
                            key={`range3-${i}`} 
                            className="inline-flex items-center justify-center w-5 h-5 bg-green-100 text-green-700 text-xs font-semibold rounded-full border-2 border-green-300"
                          >
                            {i + 31}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 분석이 없는 경우 */}
          {!analysis && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📊</div>
              <p>상세 분석 정보가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisModal;
