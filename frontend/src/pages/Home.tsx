import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LottoBall from '../components/LottoBall';

interface LottoDraw {
  draw_number: number;
  draw_date: string;
  numbers: number[];
  bonus_number: number;
  first_winners: number;
  first_amount: number;
}

const Home: React.FC = () => {
  const [latestDraw, setLatestDraw] = useState<LottoDraw | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestDraw = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/lotto/latest');
        const data = await response.json();
        if (data.success) {
          setLatestDraw(data.data);
        }
      } catch (error) {
        console.error('최신 로또 데이터 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestDraw();
  }, []);

  return (
    <div className="space-y-8">
      {/* 히어로 섹션 */}
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
          🎰 LottoGenius
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          AI 기술로 분석한 로또 번호 추천 서비스로 당신의 행운을 높여보세요!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/recommendation"
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            🎯 번호 추천 받기
          </Link>
          {/* 추천기록 버튼 완전 제거 - 기능 일시 비활성화 */}
        </div>
      </div>

      {/* 최신 당첨 번호 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          🏆 최신 당첨 번호
        </h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
          </div>
        ) : latestDraw ? (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-lg text-gray-600">
                <span className="font-semibold">{latestDraw.draw_number}회차</span>
                {' '}• {new Date(latestDraw.draw_date).toLocaleDateString('ko-KR')}
              </p>
              <p className="text-sm text-gray-500">
                당첨자: {latestDraw.first_winners}명 • 
                당첨금: {latestDraw.first_amount.toLocaleString()}원
              </p>
            </div>
            
            {/* 당첨 번호들 */}
            <div className="flex flex-wrap gap-4 justify-center">
              {latestDraw.numbers.map((number, index) => (
                <LottoBall
                  key={index}
                  number={number}
                  size="lg"
                  variant="default"
                />
              ))}
              <div className="flex items-center">
                <span className="text-2xl text-gray-400 mx-2">+</span>
                <LottoBall
                  number={latestDraw.bonus_number}
                  size="lg"
                  variant="bonus"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            최신 당첨 번호를 불러올 수 없습니다.
          </div>
        )}
      </div>

      {/* 서비스 특징 */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 text-center shadow-lg">
          <div className="text-4xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">AI 분석</h3>
          <p className="text-gray-600">
            머신러닝 알고리즘으로 과거 당첨 패턴을 분석하여 최적의 번호를 추천합니다.
          </p>
        </div>
        
        <div className="bg-white rounded-xl p-6 text-center shadow-lg">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">통계 기반</h3>
          <p className="text-gray-600">
            빈도 분석, 트렌드 분석, 패턴 분석을 통해 과학적인 번호 선택을 도와줍니다.
          </p>
        </div>
        
        <div className="bg-white rounded-xl p-6 text-center shadow-lg">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">맞춤 추천</h3>
          <p className="text-gray-600">
            사용자의 선호도와 과거 선택 패턴을 고려한 개인화된 번호를 제안합니다.
          </p>
        </div>
      </div>

      {/* CTA 섹션 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">
          지금 바로 시작하세요!
        </h2>
        <p className="text-xl mb-6 opacity-90">
          AI가 분석한 로또 번호로 당첨 확률을 높여보세요.
        </p>
        <Link
          to="/recommendation"
          className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
        >
          무료로 번호 추천 받기
        </Link>
      </div>
    </div>
  );
};

export default Home;
