import React, { useState, useEffect } from 'react';
import NumberInput from '../components/NumberInput';
import SimpleCombination from '../components/SimpleCombination';
import AnalysisModal from '../components/AnalysisModal';

interface RecommendationRequest {
  session_id: string;
  total_count: number;
  manual_combinations: Array<{
    numbers: number[];
  }>;
  preferences: {
    include_numbers: number[];
    exclude_numbers: number[];
    avoid_consecutive: boolean;
    balance_odd_even: boolean;
  };
  target_draw: number | null;
}

const Recommendation: React.FC = () => {
  const [selectedNumbers, setSelectedNumbers] = useState<number[][]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
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
    exclude_numbers: [] as number[],
    odd_even_balance: 'balanced' as const,
    range_preference: 'balanced' as const,
    consecutive_limit: 2
  });

  const [numberMode, setNumberMode] = useState<'include' | 'exclude'>('include');

  const [combinationSettings, setCombinationSettings] = useState({
    total_count: 5,
    manual_count: 0,
    auto_count: 5
  });

  const handleGenerateRecommendations = async (regenerateIndex?: number) => {
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
          exclude_numbers: excludeNumbers,
          avoid_consecutive: preferences.consecutive_limit === 0,
          balance_odd_even: preferences.odd_even_balance !== 'balanced'
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
        
        // history_id를 각 조합에 추가
        const recommendationsWithHistoryId = recommendations.map((rec: any) => ({
          ...rec,
          history_id: data.data.history_id
        }));
        
        if (regenerateIndex !== undefined) {
          // 개별 조합 재생성
          const newRecommendations = [...recommendations];
          newRecommendations[regenerateIndex] = recommendationsWithHistoryId[regenerateIndex];
          setRecommendations(newRecommendations);
        } else {
          // 전체 새로 생성
          setRecommendations(recommendationsWithHistoryId);
        }
        
        if (recommendations.length === 0) {
          alert('생성된 추천 번호가 없습니다.');
        } else {
          console.log(`${recommendations.length}개의 추천 조합 생성 완료`);
        }
      } else {
        console.error('API 성공이지만 데이터 없음:', data);
        alert('추천 번호 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('추천 번호 생성 오류:', error);
      alert('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleNumberToggle = (number: number) => {
    if (numberMode === 'include') {
      // 포함 모드일 때
      if (preferences.include_numbers.includes(number)) {
        // 이미 포함된 번호면 제거
        setPreferences(prev => ({
          ...prev,
          include_numbers: prev.include_numbers.filter(n => n !== number)
        }));
      } else {
        // 최대 5개까지만 추가 가능
        if (preferences.include_numbers.length >= 5) {
          alert('포함할 번호는 최대 5개까지 가능합니다.');
          return;
        }
        // 제외 번호와 중복되지 않는지 확인
        if (preferences.exclude_numbers.includes(number)) {
          alert('제외할 번호와 중복됩니다.');
          return;
        }
        setPreferences(prev => ({
          ...prev,
          include_numbers: [...prev.include_numbers, number].sort((a, b) => a - b)
        }));
      }
    } else {
      // 제외 모드일 때
      if (preferences.exclude_numbers.includes(number)) {
        // 이미 제외된 번호면 제거
        setPreferences(prev => ({
          ...prev,
          exclude_numbers: prev.exclude_numbers.filter(n => n !== number)
        }));
      } else {
        // 포함 번호와 중복되지 않는지 확인
        if (preferences.include_numbers.includes(number)) {
          alert('포함할 번호와 중복됩니다.');
          return;
        }
        setPreferences(prev => ({
          ...prev,
          exclude_numbers: [...prev.exclude_numbers, number].sort((a, b) => a - b)
        }));
      }
    }
  };

  const handleRegenerateCombination = async (index: number) => {
    try {
      setLoading(true);
      
      // 현재 추천 기록의 history_id가 필요합니다
      if (!recommendations.length || !recommendations[0].history_id) {
        alert('재생성을 위해 먼저 추천을 생성해주세요.');
        return;
      }
      
      // 개별 조합 재생성 API 호출
      const response = await fetch(
        `http://localhost:8000/api/v1/recommendations/regenerate/${recommendations[0].history_id}/${index}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // 해당 조합만 업데이트
        const newRecommendations = [...recommendations];
        newRecommendations[index] = data.data;
        setRecommendations(newRecommendations);
        
        console.log(`조합 ${index + 1} 재생성 완료`);
      } else {
        alert('조합 재생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('조합 재생성 오류:', error);
      alert('조합 재생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
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

      <div className="grid lg:grid-cols-2 gap-8">
        {/* 왼쪽: 번호 입력 및 설정 */}
        <div className="space-y-6">
          {/* 번호 입력 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              📝 번호 선택
            </h2>
            <NumberInput
              selectedNumbers={selectedNumbers}
              onNumbersChange={setSelectedNumbers}
              maxCombinations={combinationSettings.manual_count}
              maxNumbersPerCombination={6}
            />
          </div>

          {/* 조합 설정 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              🎲 조합 설정
            </h2>
            
            <div className="space-y-4">
              {/* 총 조합 수 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  총 조합 수
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <p className="text-xs text-gray-500 mt-1">1~20개까지 설정 가능</p>
              </div>

              {/* 수동/자동 비율 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    수동 생성
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={combinationSettings.total_count}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <p className="text-xs text-gray-500 mt-1">사용자 선택 번호 기반</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    자동 생성
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={combinationSettings.total_count}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <p className="text-xs text-gray-500 mt-1">AI 완전 자동 생성</p>
                </div>
              </div>

              {/* 비율 표시 */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">현재 설정</div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                      style={{ width: `${(combinationSettings.manual_count / combinationSettings.total_count) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {combinationSettings.manual_count}:{combinationSettings.auto_count}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  수동 {combinationSettings.manual_count}개 + 자동 {combinationSettings.auto_count}개 = 총 {combinationSettings.total_count}개
                </p>
              </div>
            </div>
          </div>

          {/* 포함/제외 번호 볼 선택 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              🎯 번호 선택 (포함/제외)
            </h2>
            
            {/* 모드 선택 라디오 버튼 */}
            <div className="mb-6">
              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="numberMode"
                    value="include"
                    checked={numberMode === 'include'}
                    onChange={() => setNumberMode('include')}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">포함할 번호</span>
                  <span className="text-xs text-gray-500">(최대 5개)</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="numberMode"
                    value="exclude"
                    checked={numberMode === 'exclude'}
                    onChange={() => setNumberMode('exclude')}
                    className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">제외할 번호</span>
                  <span className="text-xs text-gray-500">(제한 없음)</span>
                </label>
              </div>
            </div>
            
            {/* 번호 볼들 */}
            <div className="space-y-4">
              <div className="grid grid-cols-9 gap-2">
                {Array.from({ length: 45 }, (_, i) => i + 1).map((number) => (
                  <button
                    key={number}
                    onClick={() => handleNumberToggle(number)}
                    className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                      preferences.include_numbers.includes(number)
                        ? 'bg-green-500 text-white shadow-lg scale-110'
                        : preferences.exclude_numbers.includes(number)
                        ? 'bg-red-500 text-white shadow-lg scale-110'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {number}
                  </button>
                ))}
              </div>
              
              {/* 선택된 번호 표시 */}
              {(preferences.include_numbers.length > 0 || preferences.exclude_numbers.length > 0) && (
                <div className="space-y-3">
                  {preferences.include_numbers.length > 0 && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-sm text-gray-600">포함할 번호:</span>
                      {preferences.include_numbers.map((num) => (
                        <span key={num} className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          {num}
                          <button
                            onClick={() => handleNumberToggle(num)}
                            className="ml-1 text-green-600 hover:text-green-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <span className="text-xs text-gray-500">
                        ({preferences.include_numbers.length}/5)
                      </span>
                    </div>
                  )}
                  
                  {preferences.exclude_numbers.length > 0 && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-sm text-gray-600">제외할 번호:</span>
                      {preferences.exclude_numbers.map((num) => (
                        <span key={num} className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          {num}
                          <button
                            onClick={() => handleNumberToggle(num)}
                            className="ml-1 text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <span className="text-xs text-gray-500">
                        ({preferences.exclude_numbers.length}개)
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 선호도 설정 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              ⚙️ 선호도 설정
            </h2>
            
            <div className="space-y-4">
              {/* 홀짝 균형 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  홀짝 균형
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={preferences.odd_even_balance}
                  onChange={(e) => handlePreferenceChange('odd_even_balance', e.target.value)}
                >
                  <option value="balanced">균형잡힌</option>
                  <option value="odd_heavy">홀수 위주</option>
                  <option value="even_heavy">짝수 위주</option>
                </select>
              </div>

              {/* 연속번호 제한 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  연속번호 제한
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={preferences.consecutive_limit}
                  onChange={(e) => handlePreferenceChange('consecutive_limit', parseInt(e.target.value))}
                >
                  <option value={0}>연속번호 없음</option>
                  <option value={1}>최대 1쌍</option>
                  <option value={2}>최대 2쌍</option>
                  <option value={3}>최대 3쌍</option>
                </select>
              </div>
            </div>
          </div>

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
                  setPreferences({
                    include_numbers: [],
                    exclude_numbers: [],
                    odd_even_balance: 'balanced',
                    range_preference: 'balanced',
                    consecutive_limit: 2
                  });
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
