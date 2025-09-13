import React, { useState, useEffect } from 'react';
import { 
  TrophyIcon, 
  StarIcon
} from '@heroicons/react/24/outline';
import RecommendationPerformanceChart from './RecommendationPerformanceChart';

interface StatisticsData {
  publicStats: {
    totalRecommendations: number;
    aiRecommendations: number;
    manualRecommendations: number;
    memberRecommendations: number;
    guestRecommendations: number;
    recent7Days: number;
    latestDraw: number;
    totalWinners: number;
    winRate: number;
    gradeStats: {
      grade1: number;
      grade2: number;
      grade3: number;
      grade4: number;
      grade5: number;
    };
  };
  performanceData: Array<{
    period: string;
    total: number;
    winners: number;
    winRate: number;
  }>;
  winRateData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

const StatisticsDashboard: React.FC = () => {
  const [data, setData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDrawNumber, setSelectedDrawNumber] = useState<number | null>(null);
  const [drawNumbers, setDrawNumbers] = useState<Array<{
    draw_number: number;
    draw_date: string;
    numbers: number[];
    bonus_number: number;
  }>>([]);
  const [currentDrawInfo, setCurrentDrawInfo] = useState<{
    draw_date: string;
    purchase_period: string;
  } | null>(null);

  useEffect(() => {
    fetchStatistics();
    fetchDrawNumbers();
  }, []);

  useEffect(() => {
    if (selectedDrawNumber) {
      fetchStatistics(selectedDrawNumber);
    }
  }, [selectedDrawNumber]);

  const fetchStatistics = async (drawNumber?: number) => {
    try {
      setLoading(true);
      setError(null);

      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      let targetDrawNumber;
      if (drawNumber) {
        targetDrawNumber = drawNumber;
      } else {
        // 현재 회차 조회
        const currentDrawResponse = await fetch(`${baseURL}/api/v1/lotto/current-draw`);
        if (!currentDrawResponse.ok) {
          throw new Error('현재 회차를 불러올 수 없습니다');
        }
        const currentDrawData = await currentDrawResponse.json();
        const currentDrawNumber = currentDrawData.data.draw_number;
        
        // 전회차 계산 (현재 회차 - 1)
        targetDrawNumber = currentDrawNumber - 1;
      }
      
      // 공공 통계 데이터 조회 (로그인 불필요)
      const statsResponse = await fetch(`${baseURL}/admin/statistics`);
      const winningResponse = await fetch(`${baseURL}/api/v1/winning-comparison/public/${targetDrawNumber}`);

      if (!statsResponse.ok || !winningResponse.ok) {
        throw new Error('통계 데이터를 불러올 수 없습니다');
      }

      const statsData = await statsResponse.json();
      const winningData = await winningResponse.json();

      // 회차 정보 조회 (추첨일, 구매기간)
      let drawInfo = null;
      
      // 1189회차인 경우 최신 회차 API에서 구매기간 정보를 가져올 수 있음
      if (targetDrawNumber === 1189) {
        const latestResponse = await fetch(`${baseURL}/api/v1/lotto/latest`);
        if (latestResponse.ok) {
          const latestData = await latestResponse.json();
          if (latestData.success && latestData.data && latestData.data.draw_number === 1189) {
            drawInfo = latestData.data;
          }
        }
      }
      
      // 최신 회차 API에서 정보를 못 가져온 경우, 개별 조회 API 사용
      if (!drawInfo) {
        const individualDrawResponse = await fetch(`${baseURL}/api/v1/lotto/draw/${targetDrawNumber}`);
        if (individualDrawResponse.ok) {
          const individualDrawData = await individualDrawResponse.json();
          if (individualDrawData.success && individualDrawData.data) {
            drawInfo = individualDrawData.data;
          }
        }
      }
      
      // 회차 정보가 있으면 상태 업데이트
      if (drawInfo) {
        const drawDate = new Date(drawInfo.draw_date);
        const formattedDate = `${drawDate.getMonth() + 1}월 ${drawDate.getDate()}일 (${['일','월','화','수','목','금','토'][drawDate.getDay()]})`;
        setCurrentDrawInfo({
          draw_date: formattedDate,
          purchase_period: drawInfo.purchase_period || '구매 기간'
        });
      }

      // 공공 데이터로 통계 생성
      const statisticsData: StatisticsData = {
        publicStats: {
          totalRecommendations: winningData.data?.total_recommendations || 0, // 전회차 기준 총 추천수
          aiRecommendations: statsData.data.public_recommendations?.ai || 0,
          manualRecommendations: statsData.data.public_recommendations?.manual || 0,
          memberRecommendations: statsData.data.public_recommendations?.member || 0,
          guestRecommendations: statsData.data.public_recommendations?.guest || 0,
          recent7Days: statsData.data.public_recommendations?.recent_7days || 0,
          latestDraw: targetDrawNumber, // 선택된 회차 또는 전회차로 표시
          totalWinners: winningData.data?.total_winners || 0,
          winRate: Math.round((winningData.data?.win_rate || 0) * 100),
          gradeStats: {
            grade1: winningData.data?.grade_stats?.grade_1 || 0,
            grade2: winningData.data?.grade_stats?.grade_2 || 0,
            grade3: winningData.data?.grade_stats?.grade_3 || 0,
            grade4: winningData.data?.grade_stats?.grade_4 || 0,
            grade5: winningData.data?.grade_stats?.grade_5 || 0
          }
        },
        performanceData: await generatePerformanceData(winningData.data, targetDrawNumber), // 선택된 회차 또는 전회차 데이터 사용
        winRateData: generateWinRateData(statsData.data)
      };

      setData(statisticsData);
    } catch (err) {
      console.error('통계 데이터 조회 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const fetchDrawNumbers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/draw-numbers`);
      const data = await response.json();
      if (data.success) {
        setDrawNumbers(data.data.draws);
      }
    } catch (error) {
      console.error('회차 목록 조회 실패:', error);
    }
  };

  const generatePerformanceData = async (winningData: any, drawNumber: number) => {
    // 실제 API 데이터를 사용하여 차트 데이터 생성
    const data = [];
    
    // API에서 해당 회차의 구매기간 정보 가져오기
    const getPurchasePeriod = async (drawNum: number) => {
      try {
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${baseURL}/api/v1/lotto/draw/${drawNum}`);
        if (response.ok) {
          const drawData = await response.json();
          const draw = drawData.data;
          
          if (draw.purchase_start_date && draw.purchase_end_date) {
            // 구매기간을 일별로 분할
            const periods = [];
            const startDate = new Date(draw.purchase_start_date);
            const endDate = new Date(draw.purchase_end_date);
            
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
              const dayName = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
              periods.push({
                label: `${d.getMonth() + 1}/${d.getDate()} (${dayName})`,
                date: d.toISOString().split('T')[0]
              });
            }
            return periods;
          }
        }
      } catch (error) {
        console.error('구매기간 정보 조회 실패:', error);
      }
      
      // 폴백: 기본 패턴 (일요일 ~ 토요일)
      return [
        { label: '일요일', date: '2025-08-17' },
        { label: '월요일', date: '2025-08-18' },
        { label: '화요일', date: '2025-08-19' },
        { label: '수요일', date: '2025-08-20' },
        { label: '목요일', date: '2025-08-21' },
        { label: '금요일', date: '2025-08-22' },
        { label: '토요일', date: '2025-08-23' }
      ];
    };
    
    const purchasePeriod = await getPurchasePeriod(drawNumber);
    
    // 실제 API 데이터에서 results 배열 사용
    const results = winningData?.results || [];
    
    // 각 날짜별로 실제 데이터 집계
    for (const day of purchasePeriod) {
      // 해당 날짜의 데이터 필터링
      const dayData = results.filter((item: any) => {
        const itemDate = new Date(item.created_at).toISOString().split('T')[0];
        return itemDate === day.date;
      });
      
      // 해당 날짜의 총 추천 수
      const dailyTotal = dayData.length;
      
      // 해당 날짜의 당첨자 수 (is_winner가 true인 것들)
      const dailyWinners = dayData.filter((item: any) => item.is_winner).length;
      
      data.push({
        period: day.label,
        total: dailyTotal,
        winners: dailyWinners,
        winRate: dailyTotal > 0 ? Math.round((dailyWinners / dailyTotal) * 100) : 0
      });
    }
    
    return data;
  };

  const generateWinRateData = (statsData: any) => {
    const total = statsData.total_recommendations || 1;
    const winners = Math.floor(total * 0.1); // 10% 당첨률 가정
    const losers = total - winners;

    return [
      { name: '당첨', value: winners, color: '#10b981' },
      { name: '미당첨', value: losers, color: '#ef4444' }
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => fetchStatistics(selectedDrawNumber || undefined)}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* 회차 정보 카드 - 최상단 1칼럼 */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800">🎯 회차 정보</h3>
          <StarIcon className="w-6 h-6 text-purple-600" />
        </div>
        
        {/* 회차 선택 드롭다운 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            회차 선택
          </label>
          <select
            value={selectedDrawNumber || ''}
            onChange={(e) => setSelectedDrawNumber(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체 통계 (최신)</option>
            {drawNumbers.map((draw) => (
              <option key={draw.draw_number} value={draw.draw_number}>
                {draw.draw_number}회차 ({draw.draw_date})
              </option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-purple-600">{data.publicStats.latestDraw}회</div>
            <div className="text-xs sm:text-sm text-gray-600">회차</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl font-bold text-gray-800">
              {currentDrawInfo?.draw_date || '추첨일'}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">추첨일</div>
          </div>
          <div className="text-center">
            <div className="text-sm sm:text-base font-bold text-gray-600">
              {currentDrawInfo?.purchase_period || '구매 기간'}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">구매 기간</div>
          </div>
        </div>
      </div>

      {/* 당첨 성과 카드 */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800">🏆 당첨 성과</h3>
          <TrophyIcon className="w-6 h-6 text-yellow-600" />
        </div>
        
        {/* 전체 당첨 현황 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{data.publicStats.totalRecommendations.toLocaleString()}</div>
            <div className="text-sm text-gray-600">총 추천 수</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{data.publicStats.totalWinners.toLocaleString()}</div>
            <div className="text-sm text-gray-600">총 당첨자</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{data.publicStats.winRate}%</div>
            <div className="text-sm text-gray-600">당첨률</div>
          </div>
        </div>

        {/* 등수별 당첨 현황 */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{data.publicStats.gradeStats.grade1}</div>
            <div className="text-xs text-gray-600">1등</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{data.publicStats.gradeStats.grade2}</div>
            <div className="text-xs text-gray-600">2등</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{data.publicStats.gradeStats.grade3}</div>
            <div className="text-xs text-gray-600">3등</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{data.publicStats.gradeStats.grade4}</div>
            <div className="text-xs text-gray-600">4등</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{data.publicStats.gradeStats.grade5}</div>
            <div className="text-xs text-gray-600">5등</div>
          </div>
        </div>
      </div>

      {/* 추천 성과 추이 - 전체 row */}
      <RecommendationPerformanceChart 
        data={data.performanceData}
        title="최근 추천 성과"
        height={300}
        type="line"
      />
    </div>
  );
};

export default StatisticsDashboard;
