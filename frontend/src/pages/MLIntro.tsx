import React from 'react';

const MLIntro: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* 페이지 헤더 */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50/30 to-purple-50/30"></div>

        <div className="relative z-10 text-center py-6 sm:py-8 lg:py-10 px-4">
          <div className="flex items-center justify-center space-x-3 sm:space-x-4 mb-4">
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-base sm:text-lg lg:text-xl font-bold">🤖</span>
              </div>
              <div className="absolute inset-0 w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full opacity-20 blur-xl"></div>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-gray-800 via-gray-900 to-black bg-clip-text text-transparent leading-tight">
              ML 로또 추천 안내
            </h1>
          </div>

          <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            인공지능 머신러닝이 어떻게 로또 번호를 추천하는지 쉽게 설명해드립니다
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-4xl mx-auto space-y-8">

        {/* ML이 뭔가요? */}
        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
              <span className="text-white text-2xl">💡</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">ML(머신러닝)이 뭔가요?</h2>
          </div>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              <strong>머신러닝(Machine Learning)</strong>은 컴퓨터가 사람처럼 스스로 학습하는 기술입니다.
              마치 아이가 여러 번 경험하면서 배우듯이, 컴퓨터도 많은 데이터를 보면서 패턴을 찾아냅니다.
            </p>
            <p>
              로또리아 ML은 과거 <strong>1000회차 이상의 로또 당첨 번호</strong>를 학습하여,
              어떤 번호들이 자주 함께 나오는지, 어떤 패턴이 있는지를 스스로 발견합니다.
            </p>
          </div>
        </div>

        {/* 어떻게 작동하나요? */}
        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
              <span className="text-white text-2xl">⚙️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">어떻게 작동하나요?</h2>
          </div>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">1</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">과거 데이터 학습</h3>
                <p className="text-gray-700">
                  과거 1000회차 이상의 로또 당첨 번호를 분석하여 다양한 패턴을 찾아냅니다.
                  어떤 번호들이 자주 함께 나오는지, 번호 간 관계는 어떤지 등을 학습합니다.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold">2</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">패턴 분석</h3>
                <p className="text-gray-700">
                  단순히 자주 나온 번호만 보는 게 아니라, 홀수/짝수 비율, 연속 번호, 번호 구간 분포 등
                  다양한 각도에서 번호들의 관계를 분석합니다.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">3</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">번호 추천</h3>
                <p className="text-gray-700">
                  학습한 패턴을 바탕으로 가능성 있는 번호 조합을 추천합니다.
                  각 추천마다 신뢰도 점수를 함께 제공하여 얼마나 확신하는지 알려드립니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 기존 방식과 뭐가 다른가요? */}
        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4">
              <span className="text-white text-2xl">📊</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">기존 방식과 뭐가 다른가요?</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">구분</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">기존 통계 방식</th>
                  <th className="px-4 py-3 text-left text-blue-600 font-semibold">ML 방식</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-4 font-medium text-gray-900">분석 방법</td>
                  <td className="px-4 py-4 text-gray-700">단순 출현 빈도만 체크</td>
                  <td className="px-4 py-4 text-blue-700">다양한 패턴과 번호 관계 분석</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 font-medium text-gray-900">분석 항목</td>
                  <td className="px-4 py-4 text-gray-700">2가지 (빈도, 추세)</td>
                  <td className="px-4 py-4 text-blue-700">다양한 패턴 종합 분석</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 font-medium text-gray-900">번호 관계</td>
                  <td className="px-4 py-4 text-gray-700">개별 번호만 봄</td>
                  <td className="px-4 py-4 text-blue-700">번호 간 관계와 조합 학습</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 font-medium text-gray-900">신뢰도</td>
                  <td className="px-4 py-4 text-gray-700">제공하지 않음</td>
                  <td className="px-4 py-4 text-blue-700">각 추천마다 신뢰도 점수 제공</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 신뢰도 점수란? */}
        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mr-4">
              <span className="text-white text-2xl">🎯</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">신뢰도 점수란?</h2>
          </div>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              신뢰도 점수는 ML이 <strong>이 번호 조합에 얼마나 확신하는지</strong>를 나타내는 지표입니다.
            </p>

            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="text-green-600 font-bold text-lg mr-2">높음 (65% 이상)</span>
                  <span className="text-2xl">✨</span>
                </div>
                <p className="text-sm text-gray-700">
                  과거 패턴과 매우 유사하여 ML이 자신있게 추천하는 조합입니다.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="text-blue-600 font-bold text-lg mr-2">보통 (40-64%)</span>
                  <span className="text-2xl">👍</span>
                </div>
                <p className="text-sm text-gray-700">
                  패턴이 어느 정도 일치하는 조합으로, 참고할 만한 추천입니다.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="text-yellow-600 font-bold text-lg mr-2">낮음 (25-39%)</span>
                  <span className="text-2xl">🤔</span>
                </div>
                <p className="text-sm text-gray-700">
                  패턴 일치도가 낮아 가벼운 참고용으로만 활용하세요.
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="text-red-600 font-bold text-lg mr-2">아주 낮음 (24% 이하)</span>
                  <span className="text-2xl">⚠️</span>
                </div>
                <p className="text-sm text-gray-700">
                  과거 패턴과 거의 맞지 않는 조합으로, 신중하게 판단하세요.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 주의사항 */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6 lg:p-8">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-2xl">⚠️</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">꼭 기억하세요!</h2>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-start">
                  <span className="mr-2">•</span>
                  <p><strong>ML 추천은 참고용입니다.</strong> 로또는 무작위 추첨이므로 어떤 방법도 당첨을 보장할 수 없습니다.</p>
                </div>
                <div className="flex items-start">
                  <span className="mr-2">•</span>
                  <p><strong>과거 패턴이 미래를 보장하지 않습니다.</strong> 매 회차는 독립적인 확률 게임입니다.</p>
                </div>
                <div className="flex items-start">
                  <span className="mr-2">•</span>
                  <p><strong>신뢰도가 높다고 반드시 당첨되는 건 아닙니다.</strong> 확률이 조금 더 높을 수 있다는 의미일 뿐입니다.</p>
                </div>
                <div className="flex items-start">
                  <span className="mr-2">•</span>
                  <p><strong>19세 이상만 이용 가능합니다.</strong> 건전한 오락 범위 내에서 즐기세요.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            지금 ML 추천 받아보기
          </h2>
          <p className="text-xl mb-6 opacity-90">
            인공지능이 분석한 똑똑한 번호 조합을 확인해보세요! 🎯
          </p>
          <a
            href="/recommendation"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
          >
            번호 추천 받기
          </a>
        </div>

      </div>
    </div>
  );
};

export default MLIntro;
