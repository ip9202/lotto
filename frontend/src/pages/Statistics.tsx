import React from 'react';
import { StatisticsDashboard } from '../components/Statistics';

const Statistics: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📊 통계 대시보드</h1>
          <p className="mt-2 text-gray-600">
            AI 추천 성과와 로또 번호 분석을 한눈에 확인하세요
          </p>
        </div>

        {/* 통계 대시보드 */}
        <StatisticsDashboard />
      </div>
    </div>
  );
};

export default Statistics;
