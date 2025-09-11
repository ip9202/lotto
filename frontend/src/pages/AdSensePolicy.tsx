import React from 'react';

const AdSensePolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            📋 Google AdSense 정책 준수 안내
          </h1>
          
          <div className="space-y-8">
            {/* 연령 제한 안내 */}
            <section className="border-l-4 border-blue-500 pl-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                🔞 연령 제한
              </h2>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2">
                  <strong>19세 이상 이용 가능</strong>
                </p>
                <p className="text-gray-600">
                  본 서비스는 성인을 대상으로 한 오락 서비스입니다. 
                  미성년자는 이용할 수 없습니다.
                </p>
              </div>
            </section>

            {/* 서비스 성격 안내 */}
            <section className="border-l-4 border-green-500 pl-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                🎯 서비스 성격
              </h2>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2">
                  <strong>참고용 오락 서비스</strong>
                </p>
                <p className="text-gray-600">
                  본 서비스는 AI 분석을 통한 참고용 번호 제안 서비스입니다. 
                  당첨을 보장하지 않으며, 단순한 오락 목적으로만 이용해 주세요.
                </p>
              </div>
            </section>

            {/* 책임 고지 */}
            <section className="border-l-4 border-yellow-500 pl-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                ⚠️ 책임 고지
              </h2>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <ul className="text-gray-700 space-y-2">
                  <li>• 본 서비스는 참고용이며, 당첨을 보장하지 않습니다.</li>
                  <li>• 로또 구매는 개인의 책임하에 신중하게 결정하세요.</li>
                  <li>• 과도한 도박은 금물이며, 적절한 선에서 즐기세요.</li>
                  <li>• 미성년자 및 도박 중독자는 이용을 금지합니다.</li>
                </ul>
              </div>
            </section>

            {/* 개인정보 보호 */}
            <section className="border-l-4 border-purple-500 pl-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                🔒 개인정보 보호
              </h2>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2">
                  <strong>쿠키 및 광고 동의</strong>
                </p>
                <p className="text-gray-600">
                  본 사이트는 Google AdSense를 사용하여 광고를 제공합니다. 
                  쿠키 및 개인정보 수집에 동의하지 않으시면 광고가 표시되지 않을 수 있습니다.
                </p>
              </div>
            </section>

            {/* 광고 정책 */}
            <section className="border-l-4 border-red-500 pl-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                📺 광고 정책
              </h2>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2">
                  <strong>Google AdSense 정책 준수</strong>
                </p>
                <p className="text-gray-600">
                  본 사이트는 Google AdSense 정책을 준수합니다. 
                  광고는 콘텐츠와 분리되어 표시되며, 사용자 경험을 해치지 않도록 배치됩니다.
                </p>
              </div>
            </section>

            {/* 문의 안내 */}
            <section className="border-l-4 border-gray-500 pl-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                📞 문의 안내
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  정책 관련 문의사항이 있으시면 언제든지 연락주세요.
                </p>
                <p className="text-gray-600 mt-2">
                  이메일: support@lottoria.ai.kr
                </p>
              </div>
            </section>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              마지막 업데이트: 2025년 1월 11일
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdSensePolicy;
