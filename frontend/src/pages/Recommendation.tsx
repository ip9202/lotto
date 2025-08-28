import React, { useState } from 'react';
import SimpleCombination from '../components/SimpleCombination';
import AnalysisModal from '../components/AnalysisModal';
import UnifiedNumberManager from '../components/UnifiedNumberManager';

interface Recommendation {
  numbers: number[];
  is_manual: boolean;
  confidence_score?: number;
  // history_id?: string; // 추천기록 기능 일시 비활성화
  analysis?: any;
}

const Recommendation: React.FC = () => {
  const [selectedNumbers, setSelectedNumbers] = useState<number[][]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [analysisModal, setAnalysisModal] = useState<{
    isOpen: boolean;
    numbers: number[];
    combinationType: string;
    confidenceScore: number;
    analysis?: any;
  }>({
    isOpen: false,
    numbers: [],
    combinationType: '',
    confidenceScore: 0,
    analysis: undefined
  });
  const [preferences, setPreferences] = useState({
    include_numbers: [] as number[],
    exclude_numbers: [] as number[]
  });



  const [combinationSettings, setCombinationSettings] = useState({
    total_count: 5,
    manual_count: 0,
    auto_count: 5
  });

  const handleGenerateRecommendations = async () => {
    // 수동 조합이 설정되어 있는데 실제로는 없는 경우
    if (combinationSettings.manual_count > 0 && selectedNumbers.length === 0) {
      alert('수동 조합을 추가해주세요.');
      return;
    }

    // 수동 조합이 설정되어 있지 않은 경우 (자동만 생성)
    if (combinationSettings.manual_count === 0) {
      // 자동 생성만 하므로 검증 불필요
    } else {
      // 수동 조합이 있는 경우 각 조합이 6개 번호를 가지고 있는지 확인
      for (let i = 0; i < selectedNumbers.length; i++) {
        if (selectedNumbers[i].length !== 6) {
          alert(`조합 ${i + 1}에 정확히 6개의 번호를 선택해주세요.`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      // 포함/제외 번호는 이미 preferences에 저장되어 있음
      const includeNumbers = preferences.include_numbers;
      const excludeNumbers = preferences.exclude_numbers;

      // 백엔드 스키마에 맞는 형식으로 변환
      const requestData = {
        session_id: `session_${Date.now()}`, // 임시 세션 ID 생성
        total_count: combinationSettings.total_count,
        manual_combinations: selectedNumbers.map(numbers => ({
          numbers: numbers.sort((a, b) => a - b)
        })),
        preferences: {
          include_numbers: includeNumbers,
          exclude_numbers: excludeNumbers
        },
        target_draw: null
      };

      console.log('요청 데이터:', requestData);
      
      const response = await fetch('http://localhost:8000/api/v1/recommendations/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('응답 상태:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 오류 응답:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('응답 데이터:', data);
      
      if (data.success) {
        console.log('추천 데이터:', data.data);
        const recommendations = data.data.combinations || [];
        
        // 추천기록 기능 일시 비활성화로 history_id 처리 불필요
        setRecommendations(recommendations);
        
        console.log('추천 조합 생성 완료');
      } else {
        alert('추천 조합 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('추천 생성 오류:', error);
      alert('추천 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCombination = async (index: number) => {
    // 추천기록 기능 일시 비활성화로 재생성 기능도 비활성화
    alert('재생성 기능은 추천기록 기능과 함께 일시 비활성화되었습니다.');
    return;
  };

  const handleShowAnalysis = (numbers: number[], combinationType: string, confidenceScore: number, analysis?: any) => {
    setAnalysisModal({
      isOpen: true,
      numbers,
      combinationType,
      confidenceScore,
      analysis
    });
  };



  return (
    <div className="space-y-8">
      {/* 페이지 헤더 */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          🎯 AI 로또 번호 추천
        </h1>
        <p className="text-xl text-gray-600">
          원하는 번호를 선택하고 AI가 최적의 조합을 추천해드립니다.
        </p>
      </div>

      {/* 조합 설정 - 컴팩트 */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          🎲 조합 설정
        </h2>
        
        <div className="grid grid-cols-3 gap-3">
          {/* 총 조합 수 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              총 조합 수
            </label>
            <input
              type="number"
              min="1"
              max="20"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={combinationSettings.total_count}
              onChange={(e) => {
                const total = parseInt(e.target.value) || 1;
                const manual = Math.min(combinationSettings.manual_count, total);
                const auto = total - manual;
                setCombinationSettings({
                  total_count: total,
                  manual_count: manual,
                  auto_count: auto
                });
              }}
            />
          </div>

          {/* 수동 생성 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              수동
            </label>
            <input
              type="number"
              min="0"
              max={combinationSettings.total_count}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={combinationSettings.manual_count}
              onChange={(e) => {
                const manual = parseInt(e.target.value) || 0;
                const total = combinationSettings.total_count;
                const auto = Math.max(0, total - manual);
                setCombinationSettings({
                  total_count: total,
                  manual_count: manual,
                  auto_count: auto
                });
              }}
            />
          </div>

          {/* 자동 생성 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              자동
            </label>
            <input
              type="number"
              min="0"
              max={combinationSettings.total_count}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={combinationSettings.auto_count}
              onChange={(e) => {
                const auto = parseInt(e.target.value) || 0;
                const total = combinationSettings.total_count;
                const manual = Math.max(0, total - auto);
                setCombinationSettings({
                  total_count: total,
                  manual_count: manual,
                  auto_count: auto
                });
              }}
            />
          </div>
        </div>

        {/* 간단한 비율 표시 */}
        <div className="mt-3 bg-gray-50 p-2 rounded text-center">
          <div className="text-xs text-gray-600 mb-1">현재: {combinationSettings.manual_count} 수동 + {combinationSettings.auto_count} 자동</div>
          <div className="flex items-center space-x-1">
            <div className="flex-1 bg-blue-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(combinationSettings.manual_count / combinationSettings.total_count) * 100}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-500 w-8 text-center">
              {combinationSettings.manual_count}:{combinationSettings.auto_count}
            </span>
          </div>
        </div>
      </div>

      {/* 통합 번호 관리 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          🎯 통합 번호 관리
        </h2>
        <UnifiedNumberManager
          includeNumbers={preferences.include_numbers}
          excludeNumbers={preferences.exclude_numbers}
          manualCombinations={selectedNumbers}
          onIncludeNumbersChange={(numbers: number[]) => setPreferences(prev => ({ ...prev, include_numbers: numbers }))}
          onExcludeNumbersChange={(numbers: number[]) => setPreferences(prev => ({ ...prev, exclude_numbers: numbers }))}
          onManualCombinationsChange={setSelectedNumbers}
          maxCombinations={combinationSettings.manual_count}
          maxNumbersPerCombination={6}
          combinationSettings={combinationSettings}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* 왼쪽: 번호 입력 및 설정 */}
        <div className="space-y-6">

          {/* 추천 생성 버튼 */}
          <button
            onClick={handleGenerateRecommendations}
            disabled={loading || (combinationSettings.manual_count > 0 && selectedNumbers.length === 0)}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>AI 분석 중...</span>
              </div>
            ) : (
              `🤖 ${combinationSettings.total_count}개 조합 생성하기 (수동 ${combinationSettings.manual_count}개 + 자동 ${combinationSettings.auto_count}개)`
            )}
          </button>
        </div>

        {/* 오른쪽: 추천 결과 */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              🎯 추천 결과
            </h2>
            {recommendations.length > 0 && (
              <button
                onClick={() => {
                  setRecommendations([]);
                  setSelectedNumbers([]);
                  setPreferences(prev => ({
                    ...prev
                  }));
                }}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium flex items-center space-x-2"
              >
                <span>🔄</span>
                <span>초기화</span>
              </button>
            )}
          </div>
          
          {recommendations.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">🎲</div>
              <p className="text-gray-600 text-lg">
                번호를 선택하고 AI 추천을 받아보세요!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec, index) => (
                <SimpleCombination
                  key={index}
                  numbers={rec.numbers}
                  index={index}
                  isManual={rec.is_manual}
                  confidenceScore={rec.confidence_score ? Math.round(rec.confidence_score * 100) : 0}
                  onRegenerate={() => handleRegenerateCombination(index)}
                  onShowAnalysis={() => handleShowAnalysis(
                    rec.numbers,
                    rec.is_manual ? '수동' : 'AI',
                    rec.confidence_score ? Math.round(rec.confidence_score * 100) : 0,
                    rec.analysis
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 상세분석 모달 */}
      <AnalysisModal
        isOpen={analysisModal.isOpen}
        onClose={() => setAnalysisModal(prev => ({ ...prev, isOpen: false }))}
        numbers={analysisModal.numbers}
        combinationType={analysisModal.combinationType}
        confidenceScore={analysisModal.confidenceScore}
        analysis={analysisModal.analysis}
      />
    </div>
  );
};

export default Recommendation;
