import React, { useState, useCallback } from 'react';

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
  const [mode, setMode] = useState<Mode>('include');
  const [currentCombinationIndex, setCurrentCombinationIndex] = useState(0);
  const [error, setError] = useState<string>('');

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

  // 랜덤 조합 생성 (수동 조합용 - 포함/제외 숫자 제한 없음)
  const generateRandomCombination = useCallback((combinationIndex: number) => {
    try {
      // 수동 조합용 랜덤 생성이므로 모든 숫자 사용 가능
      const availableNumbers = Array.from({ length: 45 }, (_, i) => i + 1);
      
      const randomNumbers: number[] = [];
      for (let i = 0; i < maxNumbersPerCombination; i++) {
        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        randomNumbers.push(availableNumbers[randomIndex]);
        availableNumbers.splice(randomIndex, 1);
      }
      
      const newCombinations = [...manualCombinations];
      newCombinations[combinationIndex] = randomNumbers.sort((a, b) => a - b);
      safeUpdateCombinations(newCombinations);
      setError('');
    } catch (error) {
      console.error('랜덤 조합 생성 오류:', error);
      setError('랜덤 조합 생성 중 오류가 발생했습니다.');
    }
  }, [manualCombinations, maxNumbersPerCombination, safeUpdateCombinations]);

  // 전체 초기화
  const clearAll = useCallback(() => {
    try {
      safeUpdateInclude([]);
      safeUpdateExclude([]);
      safeUpdateCombinations([]);
      setCurrentCombinationIndex(0);
      setError('');
    } catch (error) {
      console.error('전체 초기화 오류:', error);
      setError('전체 초기화 중 오류가 발생했습니다.');
    }
  }, [safeUpdateInclude, safeUpdateExclude, safeUpdateCombinations]);

  // 번호 볼 렌더링
  const renderNumberBall = (number: number) => {
    if (!number || number < 1 || number > 45) return null;

    let buttonClass = 'w-8 h-8 rounded-full text-xs font-medium transition-all ';
    let isDisabled = false;

    try {
      switch (mode) {
        case 'include':
          if (includeNumbers.includes(number)) {
            buttonClass += 'bg-green-500 text-white shadow-lg scale-110';
          } else if (excludeNumbers.includes(number)) {
            buttonClass += 'bg-red-300 text-red-700 opacity-60 cursor-not-allowed';
            isDisabled = true;
          } else {
            buttonClass += 'bg-gray-200 text-gray-700 hover:bg-gray-300';
          }
          break;

        case 'exclude':
          if (excludeNumbers.includes(number)) {
            buttonClass += 'bg-red-500 text-white shadow-lg scale-110';
          } else if (includeNumbers.includes(number)) {
            buttonClass += 'bg-green-300 text-green-700 opacity-60 cursor-not-allowed';
            isDisabled = true;
          } else {
            buttonClass += 'bg-gray-200 text-gray-700 hover:bg-gray-300';
          }
          break;

        case 'combination':
          const currentCombination = manualCombinations[currentCombinationIndex] || [];
          if (currentCombination.includes(number)) {
            buttonClass += 'bg-blue-500 text-white shadow-lg scale-110';
          } else {
            // 수동 조합 모드에서는 포함/제외 숫자와 관계없이 모든 숫자 선택 가능
            if (includeNumbers.includes(number)) {
              buttonClass += 'bg-green-200 text-green-700 border border-green-400 hover:bg-blue-300';
            } else if (excludeNumbers.includes(number)) {
              buttonClass += 'bg-red-200 text-red-700 border border-red-400 hover:bg-blue-300';
            } else {
              buttonClass += 'bg-gray-200 text-gray-700 hover:bg-blue-300';
            }
          }
          break;
      }
    } catch (error) {
      console.error('번호 볼 렌더링 오류:', error);
      buttonClass = 'w-8 h-8 rounded-full text-xs font-medium bg-gray-300 text-gray-600 cursor-not-allowed';
      isDisabled = true;
    }

    return (
      <button
        key={number}
        onClick={() => handleNumberToggle(number)}
        className={buttonClass}
        disabled={isDisabled}
      >
        {number}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* 모드 선택 탭 - 원래 디자인 */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button 
          className={`flex-1 px-4 py-3 rounded-md transition-all font-medium ${
            mode === 'include' 
              ? 'bg-green-500 text-white shadow-md' 
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
          onClick={() => setMode('include')}
        >
          📍 포함 (최대 5개)
        </button>
        
        <button 
          className={`flex-1 px-4 py-3 rounded-md transition-all font-medium ${
            mode === 'exclude' 
              ? 'bg-red-500 text-white shadow-md' 
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
          onClick={() => setMode('exclude')}
        >
          ❌ 제외 (제한 없음)
        </button>
        
        <button 
          className={`flex-1 px-4 py-3 rounded-md transition-all font-medium ${
            mode === 'combination' 
              ? 'bg-blue-500 text-white shadow-md' 
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
          onClick={() => setMode('combination')}
        >
          ✏️ 조합 생성
        </button>
      </div>

      {/* 에러 메시지 - 원래 디자인 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* 조합 설정 표시 (조합 생성 모드일 때만) */}
      {mode === 'combination' && combinationSettings && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">📊 조합 설정</span>
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
              {combinationSettings.manual_count} 수동 + {combinationSettings.auto_count} 자동
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(combinationSettings.manual_count / combinationSettings.total_count) * 100}%` }}
              ></div>
            </div>
            <span className="text-xs text-blue-700 font-medium w-12 text-center">
              {combinationSettings.manual_count}:{combinationSettings.auto_count}
            </span>
          </div>
        </div>
      )}

      {/* 번호 볼 그리드 - 원래 디자인 */}
      <div className="grid grid-cols-9 gap-2">
        {Array.from({ length: 45 }, (_, i) => i + 1).map(renderNumberBall)}
      </div>

      {/* 선택된 번호 표시 - 원래 디자인 */}
      <div className="space-y-4">
        {/* 포함할 번호 */}
        {includeNumbers.length > 0 && (
          <div className={`p-3 rounded-lg transition-all ${
            mode === 'include' ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${
                mode === 'include' ? 'text-green-700' : 'text-gray-600'
              }`}>
                포함할 번호
              </span>
              <span className="text-xs text-gray-500">
                ({includeNumbers.length}/5)
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {includeNumbers.map((num) => (
                <span key={num} className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-300">
                  {num}
                  <button
                    onClick={() => handleNumberRemove(num, 'include')}
                    className="ml-1 hover:opacity-70 text-green-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 제외할 번호 */}
        {excludeNumbers.length > 0 && (
          <div className={`p-3 rounded-lg transition-all ${
            mode === 'exclude' ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${
                mode === 'exclude' ? 'text-red-700' : 'text-gray-600'
              }`}>
                제외할 번호
              </span>
              <span className="text-xs text-gray-500">
                ({excludeNumbers.length}개)
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {excludeNumbers.map((num) => (
                <span key={num} className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-300">
                  {num}
                  <button
                    onClick={() => handleNumberRemove(num, 'exclude')}
                    className="ml-1 hover:opacity-70 text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 수동 조합 - 수동 조합 개수가 0일 때는 숨김 */}
        {mode === 'combination' && maxCombinations > 0 && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-blue-800">
                ✏️ 수동 조합 생성
              </h4>
              <div className="flex space-x-2">
                <button
                  onClick={addCombination}
                  disabled={manualCombinations.length >= maxCombinations}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
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
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    manualCombinations.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-500 text-white hover:bg-gray-600'
                  }`}
                >
                  전체 초기화
                </button>
              </div>
            </div>

            {/* 조합 선택 탭 */}
            {manualCombinations.length > 0 && (
              <div className="flex space-x-2 mb-3">
                {manualCombinations.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentCombinationIndex(index)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      currentCombinationIndex === index
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    조합 {index + 1}
                  </button>
                ))}
              </div>
            )}

            {/* 현재 조합 표시 */}
            {manualCombinations.length > 0 && (
              <div className="space-y-3">
                {manualCombinations.map((combination, index) => (
                  <div key={index} className={`p-3 rounded-lg ${
                    currentCombinationIndex === index ? 'bg-blue-100 border border-blue-300' : 'bg-white border border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        조합 {index + 1} ({combination.length}/6)
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => generateRandomCombination(index)}
                          className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                        >
                          🎲 랜덤
                        </button>
                        <button
                          onClick={() => removeCombination(index)}
                          className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {combination.map((num) => (
                        <span key={num} className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-300">
                          {num}
                          <button
                            onClick={() => handleNumberRemove(num, 'combination', index)}
                            className="ml-1 hover:opacity-70 text-blue-600"
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
              <div className="text-center py-6 text-gray-500">
                <p>조합 추가 버튼을 클릭하여 수동 조합을 만들어보세요!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedNumberManager;
