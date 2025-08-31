import React, { useState, useEffect } from 'react';
import RecommendationCard from '../components/RecommendationCard';
import LottoBall from '../components/LottoBall';
import PastDraws from '../components/PastDraws';

interface RecommendationHistory {
  id: string;
  draw_number: number;
  session_id: string;
  combination_type: string;
  numbers: number[];
  confidence_score: number;
  is_manual: boolean;
  win_rank?: number;
  win_amount?: number;
  created_at: string;
  analysis?: {
    hot_numbers: number;
    cold_numbers: number;
    odd_even_ratio: string;
    sum: number;
    consecutive_count: number;
    range_distribution: string;
  };
}

const History: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'recommendations' | 'past-draws'>('past-draws');
  const [histories, setHistories] = useState<RecommendationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string>('');

  useEffect(() => {
    fetchHistories();
  }, []);

  const fetchHistories = async () => {
    try {
      setLoading(true);
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/recommendations/history?limit=50&offset=0`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        const histories: RecommendationHistory[] = result.data.map((item: any) => ({
          id: item.id,
          draw_number: item.draw_number || 0,
          session_id: item.session_id || 'unknown',
          combination_type: item.combination_type || 'AI',
          numbers: item.numbers || [],
          confidence_score: item.confidence_score || 0.5,
          is_manual: item.is_manual || false,
          win_rank: item.win_rank,
          win_amount: item.win_amount,
          created_at: item.created_at,
          analysis: item.analysis || {
            hot_numbers: 0,
            cold_numbers: 0,
            odd_even_ratio: '0:0',
            sum: 0,
            consecutive_count: 0,
            range_distribution: '1-15:0, 16-30:0, 31-45:0'
          }
        }));
        
        setHistories(histories);
        if (histories.length > 0) {
          setSelectedSession(histories[0].session_id);
        }
      } else {
        throw new Error(result.message || '데이터를 불러올 수 없습니다');
      }
    } catch (error) {
      console.error('추천 기록 조회 실패:', error);
      
      // 에러 발생 시 더미 데이터로 대체
      const dummyHistories: RecommendationHistory[] = [
        {
          id: '1',
          draw_number: 1000,
          session_id: 'session_001',
          combination_type: 'AI',
          numbers: [7, 12, 23, 28, 35, 42],
          confidence_score: 85,
          is_manual: false,
          created_at: new Date().toISOString(),
          analysis: {
            hot_numbers: 2,
            cold_numbers: 1,
            odd_even_ratio: '4:2',
            sum: 147,
            consecutive_count: 0,
            range_distribution: '1-15:2, 16-30:2, 31-45:2'
          }
        },
        {
          id: '2',
          draw_number: 999,
          session_id: 'session_001',
          combination_type: '수동',
          numbers: [1, 15, 22, 29, 38, 44],
          confidence_score: 72,
          is_manual: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          analysis: {
            hot_numbers: 1,
            cold_numbers: 2,
            odd_even_ratio: '3:3',
            sum: 149,
            consecutive_count: 1,
            range_distribution: '1-15:2, 16-30:2, 31-45:2'
          }
        }
      ];
      
      setHistories(dummyHistories);
      if (dummyHistories.length > 0) {
        setSelectedSession(dummyHistories[0].session_id);
      }
    } finally {
      setLoading(false);
    }
  };

  const getWinRankText = (rank?: number) => {
    if (!rank) return '미확인';
    if (rank === 1) return '1등 🏆';
    if (rank === 2) return '2등 🥈';
    if (rank === 3) return '3등 🥉';
    if (rank <= 5) return `${rank}등`;
    return '미당첨';
  };

  const getWinRankColor = (rank?: number) => {
    if (!rank) return 'text-gray-500';
    if (rank === 1) return 'text-yellow-600';
    if (rank <= 3) return 'text-green-600';
    if (rank <= 5) return 'text-blue-600';
    return 'text-red-600';
  };

  const getConfidenceColor = (score: number) => {
    // score가 이미 백분율로 되어있는지 확인 (100 이상이면 백분율, 1 이하면 소수)
    const percentScore = score > 1 ? Math.round(score) : Math.round(score * 100);
    if (percentScore >= 55) return 'text-green-600';
    if (percentScore >= 40) return 'text-blue-600';
    if (percentScore >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceText = (score: number) => {
    // score가 이미 백분율로 되어있는지 확인 (100 이상이면 백분율, 1 이하면 소수)
    const percentScore = score > 1 ? Math.round(score) : Math.round(score * 100);
    if (percentScore >= 55) return '높음';
    if (percentScore >= 40) return '보통';
    if (percentScore >= 30) return '낮음';
    return '아주 낮음';
  };

  const filteredHistories = selectedSession 
    ? histories.filter(h => h.session_id === selectedSession)
    : histories;

  const sessions = [...new Set(histories.map(h => h.session_id))];

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">추천 기록을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 페이지 헤더 */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          📚 기록 보기
        </h1>
        <p className="text-xl text-gray-600">
          지난회차 당첨번호와 AI 추천 기록을 확인해보세요.
        </p>
      </div>

      {/* 탭 메뉴 */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('past-draws')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'past-draws'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span className="text-lg mr-2">🎱</span>
            지난회차 당첨번호
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'recommendations'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span className="text-lg mr-2">🤖</span>
            AI 추천 기록
          </button>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'past-draws' ? (
        <PastDraws 
          limit={20} 
          showPagination={true}
          onDrawSelect={(draw) => {
            console.log('선택된 회차:', draw);
            // 필요시 상세 보기 모달 등을 추가할 수 있음
          }}
        />
      ) : (
        <>
          {/* 세션 선택 */}
          {sessions.length > 1 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📅 세션 선택
          </h2>
          <div className="flex flex-wrap gap-2">
            {sessions.map((session) => (
              <button
                key={session}
                onClick={() => setSelectedSession(session)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedSession === session
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {session.replace('session_', '세션 ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 통계 요약 */}
      {filteredHistories.length > 0 && (
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 text-center shadow-lg">
            <div className="text-2xl font-bold text-blue-600">
              {filteredHistories.length}
            </div>
            <div className="text-sm text-gray-600">총 추천 수</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-lg">
            <div className="text-2xl font-bold text-green-600">
              {filteredHistories.filter(h => h.combination_type === 'AI').length}
            </div>
            <div className="text-sm text-gray-600">AI 추천</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-lg">
            <div className="text-2xl font-bold text-purple-600">
              {filteredHistories.filter(h => h.combination_type === '수동').length}
            </div>
            <div className="text-sm text-gray-600">수동 입력</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {filteredHistories.filter(h => h.win_rank && h.win_rank <= 5).length}
            </div>
            <div className="text-sm text-gray-600">당첨</div>
          </div>
        </div>
      )}

      {/* 추천 기록 목록 */}
      {filteredHistories.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-gray-600 text-lg mb-4">
            아직 추천 기록이 없습니다.
          </p>
          <p className="text-gray-500">
            번호 추천을 받아보시면 여기에 기록됩니다.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredHistories.map((history) => (
            <div key={history.id} className="bg-white rounded-xl shadow-lg p-6">
              {/* 헤더 정보 */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold text-gray-900">
                      {history.combination_type === 'AI' ? '🤖 AI 추천' : '👤 수동 입력'}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                      {history.combination_type}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(history.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* 신뢰도 */}
                  <div className="text-right">
                    <div className="text-sm text-gray-600">신뢰도</div>
                    <div className={`text-lg font-semibold ${getConfidenceColor(history.confidence_score)}`}>
                      {getConfidenceText(history.confidence_score)}
                    </div>
                  </div>
                  
                  {/* 당첨 결과 */}
                  <div className="text-right">
                    <div className="text-sm text-gray-600">당첨 결과</div>
                    <div className={`text-lg font-semibold ${getWinRankColor(history.win_rank)}`}>
                      {getWinRankText(history.win_rank)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 번호들 */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">추천 번호</h4>
                <div className="flex flex-wrap gap-3">
                  {history.numbers.map((number, index) => (
                    <LottoBall
                      key={index}
                      number={number}
                      size="md"
                      variant="recommended"
                    />
                  ))}
                </div>
              </div>

              {/* 분석 정보 */}
              {history.analysis && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">번호 분석</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">핫 넘버:</span>
                      <span className="font-medium">{history.analysis.hot_numbers}개</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">콜드 넘버:</span>
                      <span className="font-medium">{history.analysis.cold_numbers}개</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">홀짝 비율:</span>
                      <span className="font-medium">{history.analysis.odd_even_ratio}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">합계:</span>
                      <span className="font-medium">{history.analysis.sum}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">연속 번호:</span>
                      <span className="font-medium">{history.analysis.consecutive_count}개</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">구간 분포:</span>
                      <span className="font-medium text-xs">{history.analysis.range_distribution}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 액션 버튼들 */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  다시 사용하기
                </button>
                <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                  상세 분석
                </button>
                {!history.win_rank && (
                  <button className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium">
                    당첨 결과 입력
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
          )}
        </>
      )}
    </div>
  );
};

export default History;
