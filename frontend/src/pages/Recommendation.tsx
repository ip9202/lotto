import React, { useState, useEffect } from 'react';
// import { useLocation } from 'react-router-dom'; // 현재 사용하지 않음
import SimpleCombination from '../components/SimpleCombination';
import AnalysisModal from '../components/AnalysisModal';
import UnifiedNumberManager from '../components/UnifiedNumberManager';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { userPreferencesAPI } from '../services/apiService';
// AdSense 관련 import 제거 (심사 완료 후 추가 예정)

interface Recommendation {
  numbers: number[];
  is_manual: boolean;
  confidence_score?: number;
  // history_id?: string; // 추천기록 기능 일시 비활성화
  analysis?: any;
  isSaved?: boolean; // 저장 상태 추가
}

const Recommendation: React.FC = () => {
  // const location = useLocation(); // 현재 사용하지 않음
  const { isAuthenticated } = useUnifiedAuth();
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

  // 특정 추천 번호의 저장 상태 업데이트 (일회성 데이터)
  const updateRecommendationSavedStatus = (index: number, isSaved: boolean) => {
    setRecommendations(prev => {
      const updated = prev.map((rec, i) => 
        i === index ? { ...rec, isSaved } : rec
      );
      return updated;
    });
  };


  // 사용자 설정 불러오기 (회원만)
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!isAuthenticated) return;
      
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const result = await userPreferencesAPI.getPreferences(token);
        if (result.success && result.data) {
          setPreferences({
            include_numbers: result.data.include_numbers || [],
            exclude_numbers: result.data.exclude_numbers || []
          });
        }
      } catch (error) {
        console.error('사용자 설정 불러오기 오류:', error);
      }
    };

    loadUserPreferences();
  }, [isAuthenticated]);

  // 기본 추천 처리 함수
  const handleBasicRecommendations = async () => {
    setLoading(true);
    try {
      const requestData = {
        session_id: `default_session`,
        total_count: isAuthenticated ? basicSettings.total_count : 5,
        manual_combinations: [],
        preferences: {
          include_numbers: [],
          exclude_numbers: []
        },
        target_draw: null
      };

      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      console.log('API 요청 URL:', `${apiUrl}/api/v1/recommendations/generate`);
      console.log('요청 데이터:', requestData);
      
      const response = await fetch(`${apiUrl}/api/v1/recommendations/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 오류 응답:', errorText);
        console.error('응답 상태:', response.status);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const recommendations = (data.data.combinations || []).map((rec: any) => ({
          ...rec,
          isSaved: false // 새로운 추천은 모두 저장되지 않은 상태로 시작
        }));
        
        setRecommendations(recommendations);
        
        // localStorage에 추천 번호 저장
        localStorage.setItem('lottoria_recommendations', JSON.stringify(recommendations));
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
    // 새로운 추천을 받기 전에 이전 추천 번호 및 저장 상태 초기화
    setRecommendations([]);
    localStorage.removeItem('lottoria_recommendations');

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

      
      const { recommendationsAPI } = await import('../services/apiService');
      const result = await recommendationsAPI.generateRecommendations(requestData);

      
      if (result.success && result.data) {
        const recommendations = (result.data.combinations || []).map((rec: any) => ({
          ...rec,
          isSaved: false // 새로운 추천은 모두 저장되지 않은 상태로 시작
        }));
        
        // 일회성 데이터: 메모리에만 저장 (localStorage 저장 안함)
        setRecommendations(recommendations);
        
      } else {
        alert(result.error?.message || '추천 조합 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('추천 생성 오류:', error);
      alert('추천 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCombination = async (_index: number) => {
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

      {/* AdSense 배너 제거 (심사 완료 후 추가 예정) */}

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
        {isAuthenticated ? (
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
        ) : (
          <div className="mb-6">
            <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                💡 <strong>회원가입</strong>하시면 고급 추천 기능을 이용하실 수 있습니다!
              </p>
            </div>
          </div>
        )}

        {/* 탭 콘텐츠 */}
        {!isAuthenticated || activeTab === 'basic' ? (
          /* 기본 추천 탭 (비회원은 항상 기본 추천만) */
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
                    max={isAuthenticated ? "10" : "5"}
                    disabled={!isAuthenticated}
                    className={`flex-1 px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      !isAuthenticated 
                        ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'border-gray-300'
                    }`}
                    value={isAuthenticated ? (basicSettings.total_count || '') : 5}
                    onChange={(e) => {
                      if (isAuthenticated) {
                        const inputValue = e.target.value;
                        // 빈 문자열이면 그대로 유지 (사용자가 삭제할 수 있도록)
                        if (inputValue === '') {
                          setBasicSettings(prev => ({
                            ...prev,
                            total_count: 0 // 임시로 0으로 설정
                          }));
                          return;
                        }
                        
                        // 숫자가 아닌 경우는 무시 (사용자가 입력 중일 때)
                        const parsedValue = parseInt(inputValue);
                        if (isNaN(parsedValue)) {
                          return;
                        }
                        
                        const clampedValue = Math.min(Math.max(parsedValue, 1), 10);
                        setBasicSettings(prev => ({
                          ...prev,
                          total_count: clampedValue
                        }));
                      }
                    }}
                    onBlur={(e) => {
                      if (isAuthenticated) {
                        // 포커스가 벗어날 때 빈 값이거나 1보다 작으면 1로 설정
                        const value = parseInt(e.target.value);
                        if (e.target.value === '' || isNaN(value) || value < 1) {
                          setBasicSettings(prev => ({
                            ...prev,
                            total_count: 1
                          }));
                        }
                      }
                    }}
                  />
                  <span className="text-gray-500 text-sm">개</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {isAuthenticated 
                    ? '1-10개 사이의 숫자를 입력하세요' 
                    : '비회원은 5개로 제한됩니다'
                  }
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
                    <span>{isAuthenticated ? basicSettings.total_count : 5}개 조합 생성하기</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* 고급 추천 탭 (회원만) */
          <div className="space-y-8">
            {/* 헤더 섹션 */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                ⚙️ 맞춤형 AI 추천
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                원하는 조합 수와 포함/제외 번호를 설정하여 더욱 정확한 AI 추천을 받아보세요
              </p>
            </div>

            {/* 조합 설정 카드 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mr-3">
                  <span className="text-white text-xl">🎲</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">조합 설정</h3>
              </div>

              {/* 총 조합 수 설정 */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  생성할 조합 수
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1 max-w-xs">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={combinationSettings.total_count}
                      onChange={(e) => {
                        const total = parseInt(e.target.value);
                        const manual = Math.min(combinationSettings.manual_count, total);
                        const auto = total - manual;
                        setCombinationSettings({
                          total_count: total,
                          manual_count: manual,
                          auto_count: auto
                        });
                      }}
                      className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(combinationSettings.total_count / 10) * 100}%, #DBEAFE ${(combinationSettings.total_count / 10) * 100}%, #DBEAFE 100%)`
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-center w-16 h-12 bg-white rounded-xl border-2 border-blue-200">
                    <span className="text-xl font-bold text-blue-600">{combinationSettings.total_count}</span>
                  </div>
                </div>
              </div>

              {/* 수동/자동 비율 설정 */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  수동 조합 개수
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1 max-w-xs">
                    <input
                      type="range"
                      min="0"
                      max={combinationSettings.total_count}
                      value={combinationSettings.manual_count}
                      onChange={(e) => {
                        const manual = parseInt(e.target.value);
                        const total = combinationSettings.total_count;
                        const auto = total - manual;
                        setCombinationSettings({
                          total_count: total,
                          manual_count: manual,
                          auto_count: auto
                        });
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-green-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #10B981 0%, #10B981 ${(combinationSettings.manual_count / combinationSettings.total_count) * 100}%, #F3F4F6 ${(combinationSettings.manual_count / combinationSettings.total_count) * 100}%, #F3F4F6 100%)`
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-center w-16 h-12 bg-white rounded-xl border-2 border-green-200">
                    <span className="text-xl font-bold text-green-600">{combinationSettings.manual_count}</span>
                  </div>
                </div>
              </div>

              {/* 비율 시각화 */}
              <div className="bg-white rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between text-sm font-medium text-gray-600 mb-2">
                  <span>💚 수동 {combinationSettings.manual_count}개</span>
                  <span>🤖 AI 자동 {combinationSettings.auto_count}개</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div className="flex h-full">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-500 transition-all duration-300"
                      style={{ width: `${(combinationSettings.manual_count / combinationSettings.total_count) * 100}%` }}
                    ></div>
                    <div 
                      className="bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-300"
                      style={{ width: `${(combinationSettings.auto_count / combinationSettings.total_count) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 번호 관리 카드 */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center mr-3">
                  <span className="text-white text-xl">🎯</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">번호 관리</h3>
              </div>
              
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

            {/* 생성 버튼 */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-200/50 via-purple-200/50 to-fuchsia-200/50 rounded-2xl blur-xl"></div>
              <button
                onClick={handleGenerateRecommendations}
                disabled={loading || (combinationSettings.manual_count > 0 && selectedNumbers.length === 0)}
                className="relative w-full py-6 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white rounded-2xl text-lg font-bold hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 transition-all duration-300 shadow-2xl hover:shadow-3xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.01] border border-white/20"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-white"></div>
                    <span className="text-xl">AI가 최적 조합을 분석하고 있습니다...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🚀</span>
                      <span className="text-xl">{combinationSettings.total_count}개 맞춤형 조합 생성</span>
                    </div>
                    <span className="text-sm opacity-90 font-normal">
                      수동 {combinationSettings.manual_count}개 + AI 자동 {combinationSettings.auto_count}개
                    </span>
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
                  // localStorage에서 캐시된 추천 번호 제거
                  localStorage.removeItem('lottoria_recommendations');
                }}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium flex items-center space-x-2"
              >
                <span>🔄</span>
                <span>초기화</span>
              </button>
            )}
          </div>
          
          {recommendations.length === 0 ? (
          <div className="text-center py-8 sm:py-12 lg:py-16">
            {loading ? (
              // 로딩 상태일 때
              <>
                {/* 로딩 애니메이션 */}
                <div className="relative mb-4 sm:mb-6">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 mx-auto bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl shadow-lg flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-16 sm:w-16 lg:h-20 lg:w-20 border-4 border-blue-200 border-t-blue-600"></div>
                  </div>
                  {/* 그림자 효과 */}
                  <div className="absolute -bottom-1 sm:-bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-1 sm:w-20 sm:h-2 lg:w-24 lg:h-3 bg-black/10 rounded-full blur-sm"></div>
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
                <div className="relative mb-4 sm:mb-6">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl shadow-lg flex items-center justify-center transform rotate-12">
                    <div className="grid grid-cols-3 gap-1 w-10 h-10 sm:w-16 sm:h-16 lg:w-20 lg:h-20">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-600 rounded-full"></div>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-600 rounded-full"></div>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-600 rounded-full"></div>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-600 rounded-full"></div>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-600 rounded-full"></div>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-600 rounded-full"></div>
                    </div>
                  </div>
                  {/* 그림자 효과 */}
                  <div className="absolute -bottom-1 sm:-bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-1 sm:w-20 sm:h-2 lg:w-24 lg:h-3 bg-black/10 rounded-full blur-sm"></div>
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
          <div className="space-y-8">
            {/* AdSense 광고 제거 (심사 완료 후 추가 예정) */}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((rec, index) => (
                <SimpleCombination
                  key={index}
                  numbers={rec.numbers}
                  index={index}
                  isManual={rec.is_manual}
                  confidenceScore={rec.confidence_score || 0}
                  isSaved={rec.isSaved || false}
                  onRegenerate={() => handleRegenerateCombination(index)}
                  onShowAnalysis={() => handleShowAnalysis(
                    rec.numbers,
                    rec.is_manual ? '수동' : 'AI',
                    rec.confidence_score || 0,
                    rec.analysis
                  )}
                  onSavedStatusChange={(isSaved) => updateRecommendationSavedStatus(index, isSaved)}
                />
              ))}
            </div>
            
            {/* AdSense 광고 제거 (심사 완료 후 추가 예정) */}
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
