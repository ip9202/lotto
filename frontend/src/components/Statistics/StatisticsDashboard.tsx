import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  TrophyIcon, 
  StarIcon, 
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import StatCard from './StatCard';
import NumberFrequencyChart from './NumberFrequencyChart';
import WinRateChart from './WinRateChart';
import RecommendationPerformanceChart from './RecommendationPerformanceChart';

interface StatisticsData {
  userStats: {
    totalRecommendations: number;
    totalWinners: number;
    winRate: number;
    totalWinnings: number;
    bestRank: number | null;
    averageConfidence: number;
  };
  lottoStats: {
    numberFrequency: Array<{
      number: number;
      frequency: number;
      isHot?: boolean;
      isCold?: boolean;
    }>;
    hotNumbers: number[];
    coldNumbers: number[];
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

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      // 사용자 통계 조회
      const userStatsResponse = await fetch(`${baseURL}/api/v1/saved-recommendations/stats/summary`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      // 로또 통계 조회
      const lottoStatsResponse = await fetch(`${baseURL}/api/v1/lotto/statistics`);

      if (!userStatsResponse.ok || !lottoStatsResponse.ok) {
        throw new Error('통계 데이터를 불러올 수 없습니다');
      }

      const userStatsData = await userStatsResponse.json();
      const lottoStatsData = await lottoStatsResponse.json();

      // 로또 번호 빈도 데이터 변환
      const numberFrequency = Object.entries(lottoStatsData.data?.number_frequency || {}).map(([number, data]: [string, any]) => ({
        number: parseInt(number),
        frequency: data.total_appearances || 0,
        isHot: lottoStatsData.data?.hot_numbers?.includes(parseInt(number)) || false,
        isCold: lottoStatsData.data?.cold_numbers?.includes(parseInt(number)) || false
      })).sort((a, b) => a.number - b.number);

      // 데이터 변환
      const statisticsData: StatisticsData = {
        userStats: {
          totalRecommendations: userStatsData.total_saved || 0,
          totalWinners: userStatsData.total_winners || 0,
          winRate: userStatsData.win_rate || 0,
          totalWinnings: userStatsData.total_winnings || 0,
          bestRank: userStatsData.best_rank || null,
          averageConfidence: userStatsData.avg_confidence || 0
        },
        lottoStats: {
          numberFrequency: numberFrequency,
          hotNumbers: lottoStatsData.data?.hot_numbers || [],
          coldNumbers: lottoStatsData.data?.cold_numbers || []
        },
        performanceData: generatePerformanceData(),
        winRateData: generateWinRateData(userStatsData)
      };

      setData(statisticsData);
    } catch (err) {
      console.error('통계 데이터 조회 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const generatePerformanceData = () => {
    // 최근 7일간의 성과 데이터 생성 (실제로는 API에서 받아와야 함)
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        period: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        total: Math.floor(Math.random() * 20) + 5,
        winners: Math.floor(Math.random() * 5),
        winRate: Math.floor(Math.random() * 30) + 10
      });
    }
    return data;
  };

  const generateWinRateData = (userStats: any) => {
    const total = userStats.total_checked || 1;
    const winners = userStats.total_winners || 0;
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
          onClick={fetchStatistics}
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
      {/* 통계 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="총 추천 수"
          value={data.userStats.totalRecommendations}
          subtitle="AI + 수동 추천"
          icon={<ChartBarIcon className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="당첨 수"
          value={data.userStats.totalWinners}
          subtitle={`${data.userStats.winRate.toFixed(1)}% 당첨률`}
          icon={<TrophyIcon className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="총 당첨금"
          value={`${data.userStats.totalWinnings.toLocaleString()}원`}
          subtitle={data.userStats.bestRank ? `최고 ${data.userStats.bestRank}등` : '아직 당첨 없음'}
          icon={<CurrencyDollarIcon className="w-6 h-6" />}
          color="purple"
        />
        <StatCard
          title="평균 신뢰도"
          value={`${data.userStats.averageConfidence.toFixed(1)}%`}
          subtitle="AI 추천 신뢰도"
          icon={<StarIcon className="w-6 h-6" />}
          color="yellow"
        />
      </div>

      {/* 차트 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 번호 빈도 차트 */}
        <div className="lg:col-span-2">
          <NumberFrequencyChart 
            data={data.lottoStats.numberFrequency}
            title="로또 번호 출현 빈도 분석"
            height={400}
          />
        </div>

        {/* 당첨률 분석 */}
        <WinRateChart 
          data={data.winRateData}
          title="당첨률 분석"
          height={300}
        />

        {/* 추천 성과 추이 */}
        <RecommendationPerformanceChart 
          data={data.performanceData}
          title="최근 추천 성과"
          height={300}
          type="line"
        />
      </div>

      {/* 핫/콜드 넘버 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔥 핫 넘버</h3>
          <div className="flex flex-wrap gap-2">
            {data.lottoStats.hotNumbers.map((number) => (
              <span 
                key={number}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium"
              >
                {number}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">❄️ 콜드 넘버</h3>
          <div className="flex flex-wrap gap-2">
            {data.lottoStats.coldNumbers.map((number) => (
              <span 
                key={number}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
              >
                {number}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsDashboard;
