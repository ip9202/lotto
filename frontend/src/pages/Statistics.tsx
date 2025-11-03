import React from 'react';
import { StatisticsDashboard } from '../components/Statistics';

const Statistics: React.FC = () => {
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
              {/* 통계 아이콘 배경 */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-base sm:text-lg lg:text-xl font-bold">📊</span>
              </div>
              {/* 아이콘 글로우 효과 */}
              <div className="absolute inset-0 w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full opacity-20 blur-xl"></div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-gray-800 via-gray-900 to-black bg-clip-text text-transparent leading-tight">
              통계 대시보드
            </h1>
          </div>
          
          {/* 설명 문구 */}
          <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            인공지능 머신러닝의 예측 성과 분석 · 높은 정확도 · 신뢰할 수 있는 예측
          </p>
        </div>

        {/* 하단 장식 라인 */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
      </div>

      {/* 통계 대시보드 */}
      <StatisticsDashboard />
    </div>
  );
};

export default Statistics;
