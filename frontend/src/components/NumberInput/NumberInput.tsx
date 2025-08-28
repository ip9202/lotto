import React, { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import LottoBall from '../LottoBall';

interface NumberInputProps {
  selectedNumbers: number[][];  // 2차원 배열로 변경
  onNumbersChange: (numbers: number[][]) => void;
  maxCombinations?: number;     // 최대 조합 수
  maxNumbersPerCombination?: number;  // 조합당 최대 번호 수
  className?: string;
}

const NumberInput: React.FC<NumberInputProps> = ({
  selectedNumbers,
  onNumbersChange,
  maxCombinations = 5,
  maxNumbersPerCombination = 6,
  className
}) => {
  const [error, setError] = useState<string>('');

  const handleNumberClick = useCallback((number: number, combinationIndex: number) => {
    const newNumbers = [...selectedNumbers];
    const currentCombination = newNumbers[combinationIndex] || [];
    
    if (currentCombination.includes(number)) {
      // 이미 선택된 번호라면 제거
      const updatedCombination = currentCombination.filter(n => n !== number);
      newNumbers[combinationIndex] = updatedCombination;
      onNumbersChange(newNumbers);
      setError('');
    } else {
      // 새로운 번호 추가
      if (currentCombination.length >= maxNumbersPerCombination) {
        setError(`각 조합당 최대 ${maxNumbersPerCombination}개까지만 선택할 수 있습니다.`);
        return;
      }
      const updatedCombination = [...currentCombination, number].sort((a, b) => a - b);
      newNumbers[combinationIndex] = updatedCombination;
      onNumbersChange(newNumbers);
      setError('');
    }
  }, [selectedNumbers, onNumbersChange, maxNumbersPerCombination]);

  const addCombination = useCallback(() => {
    if (selectedNumbers.length >= maxCombinations) {
      setError(`최대 ${maxCombinations}개 조합까지만 만들 수 있습니다.`);
      return;
    }
    onNumbersChange([...selectedNumbers, []]);
    setError('');
  }, [selectedNumbers, onNumbersChange, maxCombinations]);

  const removeCombination = useCallback((index: number) => {
    const newNumbers = selectedNumbers.filter((_, i) => i !== index);
    onNumbersChange(newNumbers);
    setError('');
  }, [selectedNumbers, onNumbersChange]);

  const clearAllNumbers = useCallback(() => {
    onNumbersChange([]);
    setError('');
  }, [onNumbersChange]);

  const generateRandomCombination = useCallback((combinationIndex: number) => {
    const availableNumbers = Array.from({ length: 45 }, (_, i) => i + 1);
    const randomNumbers: number[] = [];
    
    for (let i = 0; i < maxNumbersPerCombination; i++) {
      const randomIndex = Math.floor(Math.random() * availableNumbers.length);
      randomNumbers.push(availableNumbers[randomIndex]);
      availableNumbers.splice(randomIndex, 1);
    }
    
    const newNumbers = [...selectedNumbers];
    newNumbers[combinationIndex] = randomNumbers.sort((a, b) => a - b);
    onNumbersChange(newNumbers);
    setError('');
  }, [selectedNumbers, onNumbersChange, maxNumbersPerCombination]);

  const generateRandomAllCombinations = useCallback(() => {
    const newNumbers: number[][] = [];
    
    for (let i = 0; i < maxCombinations; i++) {
      const availableNumbers = Array.from({ length: 45 }, (_, j) => j + 1);
      const randomNumbers: number[] = [];
      
      for (let j = 0; j < maxNumbersPerCombination; j++) {
        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        randomNumbers.push(availableNumbers[randomIndex]);
        availableNumbers.splice(randomIndex, 1);
      }
      
      newNumbers.push(randomNumbers.sort((a, b) => a - b));
    }
    
    onNumbersChange(newNumbers);
    setError('');
  }, [onNumbersChange, maxCombinations, maxNumbersPerCombination]);

  return (
    <div className={clsx('space-y-4', className)}>
      {/* 조합 관리 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          번호 조합 ({selectedNumbers.length}/{maxCombinations})
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={addCombination}
            disabled={selectedNumbers.length >= maxCombinations}
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + 조합 추가
          </button>
          <button
            onClick={clearAllNumbers}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            전체 초기화
          </button>
          <button
            onClick={generateRandomAllCombinations}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            전체 랜덤
          </button>
        </div>
      </div>

      {/* 조합별 번호 입력 */}
      {selectedNumbers.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-4xl mb-2">🎲</div>
          <p className="text-gray-600">첫 번째 조합을 추가해주세요</p>
          <button
            onClick={addCombination}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            조합 추가하기
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {selectedNumbers.map((combination, combinationIndex) => (
            <div key={combinationIndex} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              {/* 조합 헤더 */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  조합 {combinationIndex + 1} ({combination.length}/{maxNumbersPerCombination})
                </h4>
                <div className="flex space-x-2">
                  <button
                    onClick={() => generateRandomCombination(combinationIndex)}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    랜덤
                  </button>
                  <button
                    onClick={() => removeCombination(combinationIndex)}
                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>

              {/* 선택된 번호들 */}
              <div className="flex flex-wrap gap-2 min-h-[3rem] p-3 bg-white rounded border border-gray-300">
                {combination.length === 0 ? (
                  <div className="text-gray-500 text-sm">번호를 선택해주세요</div>
                ) : (
                  combination.map((number) => (
                    <LottoBall
                      key={number}
                      number={number}
                      size="sm"
                      variant="selected"
                      onClick={() => handleNumberClick(number, combinationIndex)}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 번호 선택 그리드 */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">번호 선택</h3>
        <div className="grid grid-cols-9 gap-2">
          {Array.from({ length: 45 }, (_, i) => i + 1).map((number) => (
            <LottoBall
              key={number}
              number={number}
              size="sm"
              variant="default"
              onClick={() => {
                // 현재 활성화된 조합이 있으면 해당 조합에 추가
                if (selectedNumbers.length > 0) {
                  const lastCombinationIndex = selectedNumbers.length - 1;
                  handleNumberClick(number, lastCombinationIndex);
                }
              }}
            />
          ))}
        </div>
      </div>

      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}
    </div>
  );
};

export default NumberInput;
