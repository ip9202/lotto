import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  const location = useLocation();
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

  const [basicSettings, setBasicSettings] = useState({
    total_count: 5
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

  const [combinationSettings, setCombinationSettings] = useState({
    total_count: 5,
    manual_count: 0,
    auto_count: 5
  });

  // 페이지 로드 시 상단으로 스크롤
  useEffect(() => {
    // 페이지 로드 시 항상 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // 기본 추천 처리 함수
  const handleBasicRecommendations = async () => {
    setLoading(true);
    try {
      const requestData = {
        session_id: `default_session`,
        total_count: basicSettings.total_count,
        manual_combinations: [],
        preferences: {
          include_numbers: [],
          exclude_numbers: []
        },
        target_draw: null
      };

      console.log('기본 추천 요청 데이터:', requestData);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/recommendations/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 오류 응답:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('기본 추천 응답 데이터:', data);
      
      if (data.success) {
        const recommendations = data.data.combinations || [];
        setRecommendations(recommendations);
        console.log('기본 추천 조합 생성 완료');
      } else {
        alert('기본 추천 조합 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('기본 추천 생성 오류:', error);
      alert('기본 추천 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

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
        session_id: `default_session`, // 기본 세션 ID 사용 (백엔드에서 자동 생성)
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
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/recommendations/generate`, {
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
      {/* 페이지 헤더 - 세련되고 모던한 디자인 */}
      <div className="relative overflow-hidden">
        {/* 배경 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50/30 to-purple-50/30"></div>
        
        {/* 헤더 콘텐츠 */}
        <div className="relative z-10 text-center py-6 sm:py-8 lg:py-10 px-4">
          {/* 아이콘과 제목 */}
          <div className="flex items-center justify-center space-x-3 sm:space-x-4 mb-4">
            <div className="relative">
              {/* 과녁 아이콘 배경 */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                {/* 과녁 중앙 */}
                <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-white rounded-full flex items-center justify-center">
                  {/* 다트 */}
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 lg:w-3 lg:h-3 bg-blue-500 rounded-full"></div>
                </div>
              </div>
              {/* 과녁 테두리 */}
              <div className="absolute inset-0 w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 border-3 border-red-400 rounded-full opacity-30"></div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-gray-800 via-gray-900 to-black bg-clip-text text-transparent leading-tight">
              AI 로또 번호 추천
        </h1>
          </div>
          
          {/* 설명 문구 */}
          <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          원하는 번호를 선택하고 AI가 최적의 조합을 추천해드립니다.
        </p>
      </div>

        {/* 하단 장식 라인 */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          <button
            onClick={() => setActiveTab('basic')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'basic'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🚀 기본 추천
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'advanced'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            ⚙️ 고급 추천
          </button>
        </div>

        {/* 탭 콘텐츠 */}
        {activeTab === 'basic' ? (
          /* 기본 추천 탭 */
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                🎯 간단하고 빠른 AI 추천
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-6">
                원하는 조합 수만 입력하면 AI가 즉시 최적의 번호를 추천해드립니다.
              </p>
            </div>

            {/* 기본 설정 */}
            <div className="max-w-md mx-auto">
              <div className="bg-gray-50 rounded-lg p-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  원하는 조합 수
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    className="flex-1 px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={basicSettings.total_count}
                    onChange={(e) => setBasicSettings(prev => ({
                      ...prev,
                      total_count: parseInt(e.target.value) || 1
                    }))}
                  />
                  <span className="text-gray-500 text-sm">개</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  1-20개 사이의 숫자를 입력하세요
                </p>
              </div>
            </div>

            {/* 기본 추천 생성 버튼 */}
            <div className="text-center">
              <button
                onClick={handleBasicRecommendations}
                disabled={loading}
                className="w-full max-w-md py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>AI 분석 중...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-3">
                    <span>🤖</span>
                    <span>{basicSettings.total_count}개 조합 생성하기</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* 고급 추천 탭 */
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                ⚙️ 상세 설정을 통한 맞춤형 추천
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600">
                포함/제외 번호, 수동 조합 등을 설정하여 더 정확한 추천을 받아보세요.
              </p>
            </div>

            {/* 조합 설정과 통합 번호 관리를 하나의 통합된 컨테이너 안에 배치 */}
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* 왼쪽: 조합 설정 */}
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6">
          🎲 조합 설정
        </h2>
        
            <div className="grid grid-cols-3 gap-3 lg:gap-4">
          {/* 총 조합 수 */}
          <div>
                <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1 lg:mb-2">
              총 조합 수
            </label>
            <input
              type="number"
              min="1"
              max="20"
                  className="w-full px-2 py-1 lg:px-3 lg:py-2 text-sm lg:text-base border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1 lg:mb-2">
              수동
            </label>
            <input
              type="number"
              min="0"
              max={combinationSettings.total_count}
                  className="w-full px-2 py-1 lg:px-3 lg:py-2 text-sm lg:text-base border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1 lg:mb-2">
              자동
            </label>
            <input
              type="number"
              min="0"
              max={combinationSettings.total_count}
                  className="w-full px-2 py-1 lg:px-3 lg:py-2 text-sm lg:text-base border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            <div className="mt-3 lg:mt-4 bg-gray-50 p-2 lg:p-3 rounded text-center">
              <div className="text-xs lg:text-sm text-gray-600 mb-1 lg:mb-2">현재: {combinationSettings.manual_count} 수동 + {combinationSettings.auto_count} 자동</div>
              <div className="flex items-center space-x-1 lg:space-x-2">
                <div className="flex-1 bg-blue-200 rounded-full h-1.5 lg:h-2">
                  <div 
                    className="bg-blue-600 h-1.5 lg:h-2 rounded-full transition-all duration-300"
                style={{ width: `${(combinationSettings.manual_count / combinationSettings.total_count) * 100}%` }}
              ></div>
            </div>
                <span className="text-xs lg:text-sm text-gray-500 w-8 lg:w-12 text-center">
              {combinationSettings.manual_count}:{combinationSettings.auto_count}
            </span>
          </div>
        </div>
      </div>

          {/* 오른쪽: 통합 번호 관리 */}
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6">
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
      </div>

            {/* 고급 추천 생성 버튼 */}
            <div className="w-full relative">
              {/* 배경 장식 */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/50 rounded-2xl"></div>
              
          <button
            onClick={handleGenerateRecommendations}
            disabled={loading || (combinationSettings.manual_count > 0 && selectedNumbers.length === 0)}
                className="relative w-full py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl text-lg font-semibold hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] border border-blue-500/20"
          >
            {loading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span className="text-lg">AI 분석 중...</span>
              </div>
            ) : (
                  <div className="flex items-center justify-center space-x-3">
                    <span className="text-xl">🤖</span>
                    <span>{combinationSettings.total_count}개 조합 생성하기</span>
                    <span className="text-sm opacity-90">(수동 {combinationSettings.manual_count}개 + 자동 {combinationSettings.auto_count}개)</span>
                  </div>
            )}
          </button>
            </div>
          </div>
        )}
        </div>

      {/* 추천 결과 - 전체 너비 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
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
          <div className="text-center py-16 sm:py-20">
            {loading ? (
              // 로딩 상태일 때
              <>
                {/* 로딩 애니메이션 */}
                <div className="relative mb-6">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl shadow-lg flex items-center justify-center">
                    <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-4 border-blue-200 border-t-blue-600"></div>
                  </div>
                  {/* 그림자 효과 */}
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-2 sm:w-24 sm:h-3 bg-black/10 rounded-full blur-sm"></div>
                </div>
                
                {/* 로딩 메시지 */}
                <div className="space-y-3">
                  <h3 className="text-xl sm:text-2xl font-semibold text-blue-700">
                    AI가 분석 중입니다...
                  </h3>
                  <p className="text-blue-500 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                        잠시만 기다려주세요. 최적의 조합을 찾고 있습니다!
                  </p>
                </div>
                
                {/* 로딩 장식 요소 */}
                <div className="mt-8 flex justify-center space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </>
            ) : (
              // 로딩이 끝났을 때 (기존 상태)
              <>
                {/* 3D 주사위 아이콘 */}
                <div className="relative mb-6">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl shadow-lg flex items-center justify-center transform rotate-12">
                    <div className="grid grid-cols-3 gap-1 w-16 h-16 sm:w-20 sm:h-20">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-600 rounded-full"></div>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-600 rounded-full"></div>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-600 rounded-full"></div>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-600 rounded-full"></div>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-600 rounded-full"></div>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-600 rounded-full"></div>
                    </div>
                  </div>
                  {/* 그림자 효과 */}
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-2 sm:w-24 sm:h-3 bg-black/10 rounded-full blur-sm"></div>
                </div>
                
                {/* 메시지 */}
                <div className="space-y-3">
                  <h3 className="text-xl sm:text-2xl font-semibold text-gray-700">
                    AI 추천을 기다리고 있습니다
                  </h3>
                  <p className="text-gray-500 text-sm sm:text-base lg:text-lg max-w-md mx-auto leading-relaxed">
                    번호를 선택하고 AI 추천을 받아보세요!
                  </p>
                </div>
                
                {/* 장식 요소 */}
                <div className="mt-8 flex justify-center space-x-1">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                </div>
              </>
            )}
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((rec, index) => (
                <SimpleCombination
                  key={index}
                  numbers={rec.numbers}
                  index={index}
                  isManual={rec.is_manual}
                  confidenceScore={rec.confidence_score || 0}
                onRegenerate={() => handleRegenerateCombination(index)}
                  onShowAnalysis={() => handleShowAnalysis(
                    rec.numbers,
                    rec.is_manual ? '수동' : 'AI',
                    rec.confidence_score || 0,
                    rec.analysis
                  )}
                />
              ))}
            </div>
          )}
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
