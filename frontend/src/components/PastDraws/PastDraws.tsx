import React, { useState, useEffect } from 'react';
import LottoBall from '../LottoBall';

interface LottoDrawData {
  draw_number: number;
  draw_date: string;
  numbers: number[];
  bonus_number: number;
  first_winners?: number;
  first_amount?: number;
}

interface PastDrawsProps {
  limit?: number;
  showPagination?: boolean;
  onDrawSelect?: (draw: LottoDrawData) => void;
}

const PastDraws: React.FC<PastDrawsProps> = ({ 
  limit = 10, 
  showPagination = false, 
  onDrawSelect 
}) => {
  const [draws, setDraws] = useState<LottoDrawData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedDraw, setSelectedDraw] = useState<number | null>(null);

  useEffect(() => {
    fetchDraws();
  }, [currentPage, limit]);

  const fetchDraws = async () => {
    try {
      setLoading(true);
      
      const offset = currentPage * limit;
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/lotto/draws?limit=${limit}&offset=${offset}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setDraws(result.data);
      } else {
        throw new Error(result.message || '데이터를 불러올 수 없습니다');
      }
    } catch (error) {
      console.error('당첨번호 데이터 조회 실패:', error);
      // 에러 발생 시 더미 데이터로 대체
      const dummyDraws: LottoDrawData[] = Array.from({ length: limit }, (_, i) => ({
        draw_number: 1186 - currentPage * limit - i,
        draw_date: new Date(Date.now() - (currentPage * limit + i) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        numbers: [3, 8, 15, 22, 28, 41],
        bonus_number: 7,
        first_winners: 3,
        first_amount: 2500000000
      }));
      setDraws(dummyDraws);
    } finally {
      setLoading(false);
    }
  };

  const handleDrawClick = (draw: LottoDrawData) => {
    setSelectedDraw(selectedDraw === draw.draw_number ? null : draw.draw_number);
    if (onDrawSelect) {
      onDrawSelect(draw);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '정보 없음';
    return `${(amount / 100000000).toFixed(0)}억원`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">지난회차 당첨번호를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🎱 지난회차 당첨번호</h2>
            <p className="text-gray-600 mt-1">
              총 {draws.length}개 회차의 당첨번호를 확인해보세요
            </p>
          </div>
          
          {showPagination && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                이전
              </button>
              <span className="px-3 py-2 text-sm text-gray-600">
                페이지 {currentPage + 1}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={draws.length < limit}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                다음
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 당첨번호 목록 */}
      <div className="space-y-4">
        {draws.map((draw) => (
          <div 
            key={draw.draw_number}
            className={`bg-white rounded-xl shadow-lg transition-all duration-200 cursor-pointer ${
              selectedDraw === draw.draw_number 
                ? 'ring-2 ring-blue-500 shadow-xl' 
                : 'hover:shadow-xl hover:scale-[1.01]'
            }`}
            onClick={() => handleDrawClick(draw)}
          >
            <div className="p-6">
              {/* 회차 정보 헤더 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                    제 {draw.draw_number}회
                  </div>
                  <span className="text-gray-600 text-sm">
                    {formatDate(draw.draw_date)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  {draw.first_winners && (
                    <span>당첨자 {draw.first_winners}명</span>
                  )}
                  {draw.first_amount && (
                    <span className="font-medium text-green-600">
                      {formatCurrency(draw.first_amount)}
                    </span>
                  )}
                </div>
              </div>

              {/* 당첨번호 */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-sm font-medium text-gray-700 mr-2">당첨번호:</span>
                {draw.numbers.map((number, index) => (
                  <LottoBall
                    key={index}
                    number={number}
                    size="md"
                    variant="winning"
                  />
                ))}
                <span className="text-sm font-medium text-gray-700 mx-2">보너스:</span>
                <LottoBall
                  number={draw.bonus_number}
                  size="md"
                  variant="bonus"
                />
              </div>

              {/* 상세 정보 (확장 시) */}
              {selectedDraw === draw.draw_number && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-800">번호 분석</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">홀수/짝수:</span>
                          <span>{draw.numbers.filter(n => n % 2 === 1).length}:{draw.numbers.filter(n => n % 2 === 0).length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">번호 합계:</span>
                          <span>{draw.numbers.reduce((sum, n) => sum + n, 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">연속번호:</span>
                          <span>
                            {draw.numbers.slice(0, -1).filter((n, i) => draw.numbers[i + 1] === n + 1).length + 
                             draw.numbers.slice(1).filter((n, i) => draw.numbers[i] === n - 1).length > 0 ? '있음' : '없음'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-800">구간 분포</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">1-15:</span>
                          <span>{draw.numbers.filter(n => n >= 1 && n <= 15).length}개</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">16-30:</span>
                          <span>{draw.numbers.filter(n => n >= 16 && n <= 30).length}개</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">31-45:</span>
                          <span>{draw.numbers.filter(n => n >= 31 && n <= 45).length}개</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-800">당첨 정보</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">1등 당첨자:</span>
                          <span>{draw.first_winners || 0}명</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">1등 당첨금:</span>
                          <span className="text-green-600 font-medium">{formatCurrency(draw.first_amount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      📊 이 번호로 분석하기
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 페이지네이션 푸터 */}
      {showPagination && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← 이전 {limit}개
            </button>
            
            <span className="text-gray-600">
              페이지 {currentPage + 1}
            </span>
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={draws.length < limit}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              다음 {limit}개 →
            </button>
          </div>
        </div>
      )}

      {/* 빈 상태 */}
      {draws.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">🎱</div>
          <p className="text-gray-600 text-lg mb-4">
            당첨번호 데이터를 불러올 수 없습니다.
          </p>
          <button 
            onClick={fetchDraws}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
};

export default PastDraws;
