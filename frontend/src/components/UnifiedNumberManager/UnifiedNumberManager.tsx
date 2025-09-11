import React, { useState, useCallback, useEffect } from 'react';
import LottoBall from '../LottoBall';
import { useUnifiedAuth } from '../../contexts/UnifiedAuthContext';
import { userPreferencesAPI, UserPreferences } from '../../services/apiService';
import { useNotification } from '../../contexts/NotificationContext';

interface UnifiedNumberManagerProps {
  includeNumbers: number[];
  excludeNumbers: number[];
  manualCombinations: number[][];
  onIncludeNumbersChange: (numbers: number[]) => void;
  onExcludeNumbersChange: (numbers: number[]) => void;
  onManualCombinationsChange: (combinations: number[][]) => void;
  maxCombinations?: number;
  maxNumbersPerCombination?: number;
  combinationSettings?: {
    total_count: number;
    manual_count: number;
    auto_count: number;
  };
}

type Mode = 'include' | 'exclude' | 'combination';

const UnifiedNumberManager: React.FC<UnifiedNumberManagerProps> = ({
  includeNumbers = [],
  excludeNumbers = [],
  manualCombinations = [],
  onIncludeNumbersChange,
  onExcludeNumbersChange,
  onManualCombinationsChange,
  maxCombinations = 5,
  maxNumbersPerCombination = 6,
  combinationSettings
}) => {
  const { isAuthenticated } = useUnifiedAuth();
  const { showSuccess, showError } = useNotification();
  const [mode, setMode] = useState<Mode>('include');
  const [currentCombinationIndex, setCurrentCombinationIndex] = useState(0);
  const [error, setError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // 안전한 상태 업데이트 함수들
  const safeUpdateInclude = useCallback((numbers: number[]) => {
    try {
      onIncludeNumbersChange(numbers);
    } catch (error) {
      console.error('포함 번호 업데이트 오류:', error);
      setError('포함 번호 업데이트 중 오류가 발생했습니다.');
    }
  }, [onIncludeNumbersChange]);

  const safeUpdateExclude = useCallback((numbers: number[]) => {
    try {
      onExcludeNumbersChange(numbers);
    } catch (error) {
      console.error('제외 번호 업데이트 오류:', error);
      setError('제외 번호 업데이트 중 오류가 발생했습니다.');
    }
  }, [onExcludeNumbersChange]);

  const safeUpdateCombinations = useCallback((combinations: number[][]) => {
    try {
      onManualCombinationsChange(combinations);
    } catch (error) {
      console.error('조합 업데이트 오류:', error);
      setError('조합 업데이트 중 오류가 발생했습니다.');
    }
  }, [onManualCombinationsChange]);

  // 수동 조합 개수가 0이 될 때 선택된 볼들 자동 리셋
  useEffect(() => {
    if (combinationSettings?.manual_count === 0 && manualCombinations.length > 0) {
      safeUpdateCombinations([]);
      setCurrentCombinationIndex(0);
    }
  }, [combinationSettings?.manual_count, manualCombinations.length, safeUpdateCombinations]);

  // 사용자 설정 저장 함수
  const handleSavePreferences = async () => {
    if (!isAuthenticated) return;
    
    setIsSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        showError('로그인이 필요합니다.');
        return;
      }

      const preferences: UserPreferences = {
        include_numbers: includeNumbers,
        exclude_numbers: excludeNumbers
      };

      const result = await userPreferencesAPI.savePreferences(token, preferences);
      
      if (result.success) {
        showSuccess('설정이 저장되었습니다.');
      } else {
        showError(result.error?.message || '설정 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('설정 저장 오류:', error);
      showError('설정 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 번호 토글 함수
  const handleNumberToggle = useCallback((number: number) => {
    if (!number || number < 1 || number > 45) {
      setError('유효하지 않은 번호입니다.');
      return;
    }

    setError('');
    
    try {
      switch (mode) {
        case 'include':
          if (includeNumbers.includes(number)) {
            // 이미 포함된 번호면 제거
            safeUpdateInclude(includeNumbers.filter(n => n !== number));
          } else {
            // 최대 5개까지만 추가 가능
            if (includeNumbers.length >= 5) {
              setError('포함할 번호는 최대 5개까지 가능합니다.');
              return;
            }
            // 제외 번호와 중복되지 않는지 확인
            if (excludeNumbers.includes(number)) {
              setError('제외할 번호와 중복됩니다.');
              return;
            }
            safeUpdateInclude([...includeNumbers, number].sort((a, b) => a - b));
          }
          break;

        case 'exclude':
          if (excludeNumbers.includes(number)) {
            // 이미 제외된 번호면 제거
            safeUpdateExclude(excludeNumbers.filter(n => n !== number));
          } else {
            // 포함 번호와 중복되지 않는지 확인
            if (includeNumbers.includes(number)) {
              setError('포함할 번호와 중복됩니다.');
              return;
            }
            safeUpdateExclude([...excludeNumbers, number].sort((a, b) => a - b));
          }
          break;

        case 'combination':
          const currentCombination = manualCombinations[currentCombinationIndex] || [];
          
          if (currentCombination.includes(number)) {
            // 이미 선택된 번호라면 제거
            const updatedCombination = currentCombination.filter(n => n !== number);
            const newCombinations = [...manualCombinations];
            newCombinations[currentCombinationIndex] = updatedCombination;
            safeUpdateCombinations(newCombinations);
          } else {
            // 새로운 번호 추가
            if (currentCombination.length >= maxNumbersPerCombination) {
              setError(`각 조합당 최대 ${maxNumbersPerCombination}개까지만 선택할 수 있습니다.`);
              return;
            }
            const updatedCombination = [...currentCombination, number].sort((a, b) => a - b);
            const newCombinations = [...manualCombinations];
            newCombinations[currentCombinationIndex] = updatedCombination;
            safeUpdateCombinations(newCombinations);
          }
          break;
      }
    } catch (error) {
      console.error('번호 토글 오류:', error);
      setError('번호 선택 중 오류가 발생했습니다.');
    }
  }, [mode, includeNumbers, excludeNumbers, manualCombinations, currentCombinationIndex, maxNumbersPerCombination, safeUpdateInclude, safeUpdateExclude, safeUpdateCombinations]);

  // 번호 제거 함수 (X 버튼용)
  const handleNumberRemove = useCallback((number: number, targetMode: Mode, combinationIndex?: number) => {
    if (!number || number < 1 || number > 45) {
      setError('유효하지 않은 번호입니다.');
      return;
    }

    setError('');
    
    try {
      switch (targetMode) {
        case 'include':
          safeUpdateInclude(includeNumbers.filter(n => n !== number));
          break;
        case 'exclude':
          safeUpdateExclude(excludeNumbers.filter(n => n !== number));
          break;
        case 'combination':
          if (combinationIndex !== undefined) {
            const currentCombination = manualCombinations[combinationIndex] || [];
            const updatedCombination = currentCombination.filter(n => n !== number);
            const newCombinations = [...manualCombinations];
            newCombinations[combinationIndex] = updatedCombination;
            safeUpdateCombinations(newCombinations);
          }
          break;
      }
    } catch (error) {
      console.error('번호 제거 오류:', error);
      setError('번호 제거 중 오류가 발생했습니다.');
    }
  }, [includeNumbers, excludeNumbers, manualCombinations, safeUpdateInclude, safeUpdateExclude, safeUpdateCombinations]);

  // 조합 추가
  const addCombination = useCallback(() => {
    try {
      if (manualCombinations.length >= maxCombinations) {
        setError(`최대 ${maxCombinations}개 조합까지만 만들 수 있습니다.`);
        return;
      }
      safeUpdateCombinations([...manualCombinations, []]);
      setCurrentCombinationIndex(manualCombinations.length);
      setError('');
    } catch (error) {
      console.error('조합 추가 오류:', error);
      setError('조합 추가 중 오류가 발생했습니다.');
    }
  }, [manualCombinations, maxCombinations, safeUpdateCombinations]);

  // 조합 제거
  const removeCombination = useCallback((index: number) => {
    try {
      const newCombinations = manualCombinations.filter((_, i) => i !== index);
      safeUpdateCombinations(newCombinations);
      if (currentCombinationIndex >= newCombinations.length) {
        setCurrentCombinationIndex(Math.max(0, newCombinations.length - 1));
      }
      setError('');
    } catch (error) {
      console.error('조합 제거 오류:', error);
      setError('조합 제거 중 오류가 발생했습니다.');
    }
  }, [manualCombinations, currentCombinationIndex, safeUpdateCombinations]);

  // 스마트 랜덤 조합 생성 (포함/제외 번호 고려)
  const generateRandomCombination = useCallback((combinationIndex: number) => {
    try {
      // 사용 가능한 숫자들 (포함할 번호는 강제 포함, 제외할 번호는 제외)
      let availableNumbers = Array.from({ length: 45 }, (_, i) => i + 1);
      
      // 제외할 번호 제거
      availableNumbers = availableNumbers.filter(num => !excludeNumbers.includes(num));
      
      // 포함할 번호는 강제로 포함
      const forcedNumbers = [...includeNumbers];
      const remainingCount = maxNumbersPerCombination - forcedNumbers.length;
      
      if (remainingCount < 0) {
        // 포함할 번호가 너무 많으면 에러
        setError(`포함할 번호가 너무 많습니다. 최대 ${maxNumbersPerCombination}개까지 가능합니다.`);
        return;
      }
      
      // 나머지 숫자들에서 랜덤 선택
      const remainingNumbers = availableNumbers.filter(num => !forcedNumbers.includes(num));
      const randomNumbers: number[] = [];
      
      for (let i = 0; i < remainingCount; i++) {
        if (remainingNumbers.length === 0) break;
        const randomIndex = Math.floor(Math.random() * remainingNumbers.length);
        randomNumbers.push(remainingNumbers[randomIndex]);
        remainingNumbers.splice(randomIndex, 1);
      }
      
      // 최종 조합: 강제 포함 + 랜덤 선택
      const finalCombination = [...forcedNumbers, ...randomNumbers].sort((a, b) => a - b);
      
      const newCombinations = [...manualCombinations];
      newCombinations[combinationIndex] = finalCombination;
      safeUpdateCombinations(newCombinations);
      setError('');
    } catch (error) {
      console.error('스마트 랜덤 조합 생성 오류:', error);
      setError('스마트 랜덤 조합 생성 중 오류가 발생했습니다.');
    }
  }, [manualCombinations, maxNumbersPerCombination, safeUpdateCombinations, includeNumbers, excludeNumbers]);

  // 수동 조합만 초기화 (포함/제외 번호는 유지)
  const clearAll = useCallback(() => {
    try {
      // 포함/제외 번호는 유지하고 수동 조합만 초기화
      safeUpdateCombinations([]);
      setCurrentCombinationIndex(0);
      setError('');
    } catch (error) {
      console.error('수동 조합 초기화 오류:', error);
      setError('수동 조합 초기화 중 오류가 발생했습니다.');
    }
  }, [safeUpdateCombinations]);

  // 번호 볼 렌더링
  const renderNumberBall = (number: number) => {
    if (!number || number < 1 || number > 45) return null;

    let variant: 'default' | 'selected' = 'default';
    let isDisabled = false;

    try {
      switch (mode) {
        case 'include':
          if (includeNumbers.includes(number)) {
            variant = 'selected';
          } else if (excludeNumbers.includes(number)) {
            isDisabled = true;
          }
          break;

        case 'exclude':
          if (excludeNumbers.includes(number)) {
            variant = 'selected';
          } else if (includeNumbers.includes(number)) {
            isDisabled = true;
          }
          break;

        case 'combination':
          const currentCombination = manualCombinations[currentCombinationIndex] || [];
          if (currentCombination.includes(number)) {
            variant = 'selected';
          }
          break;
      }
    } catch (error) {
      console.error('번호 볼 렌더링 오류:', error);
      isDisabled = true;
    }

    return (
      <LottoBall
        key={number}
        number={number}
        size="xs"
        variant={variant}
        onClick={isDisabled ? undefined : () => handleNumberToggle(number)}
        className={isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* 모드 선택 탭 - 반응형 배치 (iPhone에서는 세로, 데스크톱에서는 가로) */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 bg-gray-100 p-3 sm:p-2 rounded-lg sm:justify-center">
        <button 
          className={`w-full sm:w-auto px-4 py-3 sm:px-3 sm:py-2 rounded-md transition-all font-medium text-sm sm:text-base ${
            mode === 'include' 
              ? 'bg-green-500 text-white shadow-md' 
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
          onClick={() => setMode('include')}
        >
          📍 포함 (최대 5개)
        </button>
        
        <button 
          className={`w-full sm:w-auto px-4 py-3 sm:px-3 sm:py-2 rounded-md transition-all font-medium text-sm sm:text-base ${
            mode === 'exclude' 
              ? 'bg-red-500 text-white shadow-md' 
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
          onClick={() => setMode('exclude')}
        >
          ❌ 제외 (제한 없음)
        </button>
        
        <button 
          className={`w-full sm:w-auto px-4 py-3 sm:px-3 sm:py-2 rounded-md transition-all font-medium text-sm sm:text-base ${
            mode === 'combination' 
              ? 'bg-blue-500 text-white shadow-md' 
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          } ${
            combinationSettings?.manual_count === 0 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-gray-50'
          }`}
          onClick={() => setMode('combination')}
          disabled={combinationSettings?.manual_count === 0}
        >
          ✏️ 수동 조합 생성
        </button>
      </div>

      {/* 에러 메시지 - 반응형 개선 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 sm:px-4 sm:py-3 rounded-lg text-sm sm:text-base font-medium">
          {error}
        </div>
      )}

      {/* 조합 설정 표시 (조합 생성 모드일 때만) */}
      {mode === 'combination' && combinationSettings && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
          <div className="flex flex-row items-center justify-between mb-3">
            <span className="text-base font-semibold text-blue-800">📊 조합 설정</span>
            <span className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full font-medium">
              {combinationSettings.manual_count} 수동 + {combinationSettings.auto_count} 자동
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-blue-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(combinationSettings.manual_count / combinationSettings.total_count) * 100}%` }}
              ></div>
            </div>
            <span className="text-sm text-blue-700 font-semibold w-12 text-center">
              {combinationSettings.manual_count}:{combinationSettings.auto_count}
            </span>
          </div>
        </div>
      )}

      {/* 번호 볼 그리드 - 모바일 최적화 */}
      <div className="w-full overflow-x-auto">
        <div className="flex justify-center min-w-full">
          <div className="grid grid-cols-7 gap-2 sm:gap-3 md:gap-4 max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto px-2">
            {Array.from({ length: 45 }, (_, i) => i + 1).map(renderNumberBall)}
          </div>
        </div>
      </div>


      {/* 설정 저장 버튼 (회원만) - 포함/제외 모드에서만 보이기 */}
      {isAuthenticated && (mode === 'include' || mode === 'exclude') && (includeNumbers.length > 0 || excludeNumbers.length > 0) && (
        <div className="flex justify-center">
          <button
            onClick={handleSavePreferences}
            disabled={isSaving}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] flex items-center space-x-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>저장 중...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>포함/제외 설정 저장</span>
              </>
            )}
          </button>
        </div>
      )}

        {/* 수동 조합 - 수동 조합 개수가 0일 때는 숨김 */}
        {mode === 'combination' && maxCombinations > 0 && (
          <div className="bg-blue-50 border border-blue-200 p-3 sm:p-4 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <h4 className="text-lg sm:text-xl font-bold text-blue-800">
                  ✏️ 수동 조합 생성
                </h4>
                <span className="text-xs sm:text-sm text-blue-600 bg-blue-100 px-2 py-1 sm:px-3 sm:py-1 rounded-full font-medium">
                  ({manualCombinations.length}/{maxCombinations})
                </span>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                  onClick={addCombination}
                  disabled={manualCombinations.length >= maxCombinations}
                  className={`px-3 py-2 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    manualCombinations.length >= maxCombinations
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  + 조합 추가
                </button>
                <button
                  onClick={clearAll}
                  disabled={manualCombinations.length === 0}
                  className={`px-3 py-2 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    manualCombinations.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-500 text-white hover:bg-gray-600'
                  }`}
                >
                  수동 조합 초기화
                </button>
              </div>
            </div>

            {/* 조합 선택 탭 */}
            {manualCombinations.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 sm:mb-3 justify-center sm:justify-start">
                {manualCombinations.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentCombinationIndex(index)}
                    className={`px-3 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors flex-shrink-0 ${
                      currentCombinationIndex === index
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-200'
                    }`}
                  >
                    조합 {index + 1}
                  </button>
                ))}
              </div>
            )}

            {/* 현재 조합 표시 */}
            {manualCombinations.length > 0 && (
              <div className="space-y-4 sm:space-y-3">
                {manualCombinations.map((combination, index) => (
                  <div key={index} className={`p-4 sm:p-3 rounded-lg ${
                    currentCombinationIndex === index ? 'bg-blue-100 border border-blue-300' : 'bg-white border border-gray-200'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-2 space-y-2 sm:space-y-0">
                      <span className="text-base sm:text-lg font-semibold text-gray-700">
                        조합 {index + 1} ({combination.length}/6)
                      </span>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => generateRandomCombination(index)}
                          className="px-3 py-2 bg-blue-500 text-white rounded text-xs sm:text-sm font-medium hover:bg-blue-600 transition-colors flex items-center justify-center"
                        >
                          🎲 스마트 랜덤
                        </button>
                        <button
                          onClick={() => removeCombination(index)}
                          className="px-3 py-2 bg-red-500 text-white rounded text-xs sm:text-sm font-medium hover:bg-red-600 transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {combination.map((num) => (
                        <span key={num} className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-2 rounded-full text-xs sm:text-sm font-semibold bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200 transition-colors">
                          {num}
                          <button
                            onClick={() => handleNumberRemove(num, 'combination', index)}
                            className="ml-1 sm:ml-2 hover:opacity-70 text-blue-600 text-sm sm:text-lg font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 조합이 없을 때 안내 */}
            {manualCombinations.length === 0 && (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <p className="text-base sm:text-lg font-medium">조합 추가 버튼을 클릭하여 수동 조합을 만들어보세요!</p>
              </div>
            )}
          </div>
        )}
    </div>
  );
};

export default UnifiedNumberManager;
