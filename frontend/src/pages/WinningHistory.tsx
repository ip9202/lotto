import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import LottoBall from '../components/LottoBall/LottoBall';

interface WinningResult {
  draw_number: number;
  draw_date: string;
  numbers: number[];
  bonus_number: number;
  first_winners: number;
  first_amount: number;
}

interface SavedRecommendation {
  id: number;
  numbers: number[];
  created_at: string;
  tags: string[];
}

interface ComparisonResult {
  savedRecommendation: SavedRecommendation;
  matchedNumbers: number[];
  matchedBonus: boolean;
  winRank: number;
  winAmount: number;
}

const WinningHistory: React.FC = () => {
  const { user, isAuthenticated } = useUnifiedAuth();
  const [winningResult, setWinningResult] = useState<WinningResult | null>(null);
  const [savedRecommendations, setSavedRecommendations] = useState<SavedRecommendation[]>([]);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDrawNumber, setCurrentDrawNumber] = useState<number>(0);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWinningHistory();
    }
  }, [isAuthenticated]);

  const fetchWinningHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      // 현재 회차 조회
      const currentDrawResponse = await fetch(`${baseURL}/api/v1/lotto/current-draw`);
      if (!currentDrawResponse.ok) {
        throw new Error('현재 회차를 불러올 수 없습니다');
      }
      const currentDrawData = await currentDrawResponse.json();
      const currentDrawNumber = currentDrawData.data.draw_number;
      setCurrentDrawNumber(currentDrawNumber);
      
      // 전회차 계산 (현재 회차 - 1)
      const previousDrawNumber = currentDrawNumber - 1;
      
      // 전회차 당첨 번호 조회
      const winningResponse = await fetch(`${baseURL}/api/v1/lotto/draw/${previousDrawNumber}`);
      if (!winningResponse.ok) {
        throw new Error('당첨 번호를 불러올 수 없습니다');
      }
      const winningData = await winningResponse.json();

      // 개인 저장된 추천 번호 조회 (전회차)
      const savedResponse = await fetch(`${baseURL}/api/v1/saved-recommendations?target_draw=${previousDrawNumber}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (!savedResponse.ok) {
        throw new Error('저장된 번호를 불러올 수 없습니다');
      }
      const savedData = await savedResponse.json();

      setWinningResult(winningData.data);
      setSavedRecommendations(savedData.items || []);

      // 당첨 번호와 비교
      const results = compareWithWinningNumbers(winningData.data, savedData.items || []);
      setComparisonResults(results);

    } catch (err) {
      console.error('당첨 이력 조회 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const compareWithWinningNumbers = (winning: WinningResult, saved: SavedRecommendation[]): ComparisonResult[] => {
    return saved.map(savedRec => {
      const matchedNumbers = savedRec.numbers.filter(num => winning.numbers.includes(num));
      const matchedBonus = savedRec.numbers.includes(winning.bonus_number);
      
      let winRank = 0;
      let winAmount = 0;

      if (matchedNumbers.length === 6) {
        winRank = 1;
        winAmount = winning.first_amount;
      } else if (matchedNumbers.length === 5 && matchedBonus) {
        winRank = 2;
        winAmount = Math.floor(winning.first_amount * 0.05); // 2등은 1등의 5% 가정
      } else if (matchedNumbers.length === 5) {
        winRank = 3;
        winAmount = 1500000; // 3등 150만원
      } else if (matchedNumbers.length === 4) {
        winRank = 4;
        winAmount = 50000; // 4등 5만원
      } else if (matchedNumbers.length === 3) {
        winRank = 5;
        winAmount = 5000; // 5등 5천원
      }

      return {
        savedRecommendation: savedRec,
        matchedNumbers,
        matchedBonus,
        winRank,
        winAmount
      };
    });
  };

  const getWinRankText = (rank: number): string => {
    switch (rank) {
      case 1: return '1등 당첨';
      case 2: return '2등 당첨';
      case 3: return '3등 당첨';
      case 4: return '4등 당첨';
      case 5: return '5등 당첨';
      default: return '낙첨';
    }
  };

  const getWinRankColor = (rank: number): string => {
    switch (rank) {
      case 1: return 'text-red-600';
      case 2: return 'text-orange-600';
      case 3: return 'text-yellow-600';
      case 4: return 'text-green-600';
      case 5: return 'text-blue-600';
      default: return 'text-gray-500';
    }
  };

  const getBallColor = (number: number): string => {
    if (number >= 1 && number <= 10) return 'yellow';
    if (number >= 11 && number <= 20) return 'blue';
    if (number >= 21 && number <= 30) return 'red';
    if (number >= 31 && number <= 40) return 'black';
    return 'green';
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h2>
          <p className="text-gray-600">당첨 이력을 확인하려면 로그인해주세요.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">오류 발생</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchWinningHistory}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

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
              {/* 당첨 이력 아이콘 배경 */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-base sm:text-lg lg:text-xl font-bold">🏆</span>
              </div>
              {/* 아이콘 글로우 효과 */}
              <div className="absolute inset-0 w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full opacity-20 blur-xl"></div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-gray-800 via-gray-900 to-black bg-clip-text text-transparent leading-tight">
              당첨 이력
            </h1>
          </div>
          
          {/* 설명 문구 */}
          <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {currentDrawNumber > 0 ? `${currentDrawNumber - 1}회차` : '전회차'} 당첨 결과와 내 번호 비교
          </p>
        </div>

        {/* 하단 장식 라인 */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
      </div>
      {winningResult && (
        <>
          {/* 회차 정보 및 당첨 번호 */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                🎯 로또 6/45 제{winningResult.draw_number}회
              </h2>
              <p className="text-gray-600">
                {new Date(winningResult.draw_date).toLocaleDateString('ko-KR')} 추첨
              </p>
            </div>

            {/* 당첨 번호 */}
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">당첨 번호</h3>
              <div className="flex justify-center items-center gap-1 sm:gap-3 flex-nowrap overflow-x-auto">
                {winningResult.numbers.map((number, index) => (
                  <LottoBall
                    key={index}
                    number={number}
                    size="sm"
                    variant="winning"
                  />
                ))}
                <span className="text-lg sm:text-3xl text-gray-400 mx-1 sm:mx-3">+</span>
                <LottoBall
                  number={winningResult.bonus_number}
                  size="sm"
                  variant="bonus"
                />
              </div>
            </div>

            {/* 1등 정보 */}
            <div className="bg-gray-50 rounded-lg p-2 sm:p-4 text-center">
              <div className="flex justify-center items-center gap-4 sm:gap-8 text-xs sm:text-sm">
                <div>
                  <span className="text-gray-600">1등 당첨자</span>
                  <p className="text-sm sm:text-lg font-bold text-red-600">{winningResult.first_winners}명</p>
                </div>
                <div>
                  <span className="text-gray-600">1등 당첨금</span>
                  <p className="text-sm sm:text-lg font-bold text-red-600">{winningResult.first_amount.toLocaleString()}원</p>
                </div>
              </div>
            </div>
          </div>

          {/* 내 저장된 번호들 */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">내 저장된 번호</h3>
              
            {comparisonResults.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-500 text-lg">{currentDrawNumber > 0 ? `${currentDrawNumber - 1}회차` : '전회차'}에 저장된 번호가 없습니다.</p>
                <p className="text-gray-400 text-sm mt-2">번호를 저장하고 다음 회차에 도전해보세요!</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <tbody>
                    {comparisonResults.map((result, index) => (
                      <tr key={result.savedRecommendation.id} className="border-b border-gray-100 last:border-b-0">
                        <td className="w-12 py-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200">
                          {String.fromCharCode(65 + index)}
                        </td>
                        <td className="w-20 py-3 text-center border-r border-gray-200">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getWinRankColor(result.winRank)}`}>
                            {getWinRankText(result.winRank).replace('당첨', '')}
                          </span>
                        </td>
                        {result.savedRecommendation.numbers
                          .slice()
                          .sort((a, b) => a - b)
                          .map((number, numIndex) => {
                          const isMatched = result.matchedNumbers.includes(number);
                          const isBonus = number === winningResult.bonus_number;
                          
                          return (
                            <td key={numIndex} className="w-16 py-3 text-center">
                              {isMatched ? (
                                <div className="relative inline-block">
                                  <LottoBall
                                    number={number}
                                    size="sm"
                                    variant="winning"
                                  />
                                  {isBonus && (
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                                      +
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-600 font-medium">{number}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default WinningHistory;
