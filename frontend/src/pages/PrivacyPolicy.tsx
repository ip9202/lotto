import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 text-gray-800 dark:text-gray-200">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">개인정보 처리방침</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">최종 수정일: 2025년 9월 2일</p>
      </header>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">1. 총칙</h2>
        <p>
          로또리아 AI(이하 "서비스")는 귀하의 개인정보를 매우 중요하게 생각하며, 「개인정보 보호법」을 비롯한 모든 관련 법규를 준수하고 있습니다. 본 개인정보 처리방침을 통해 귀하가 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">2. 수집하는 개인정보 항목 및 수집 방법</h2>
        <p className="mb-2">서비스는 원활한 서비스 제공을 위해 다음과 같은 최소한의 개인정보를 수집하고 있습니다.</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>수집 항목:</strong> 서비스 이용 기록, 접속 로그, 쿠키, IP 주소</li>
          <li><strong>수집 목적:</strong> 부정 이용 방지, 비인가 사용 방지, 사용자 맞춤형 서비스 제공</li>
          <li><strong>수집 방법:</strong> 사용자가 서비스를 이용하는 과정에서 자동으로 생성되어 수집됩니다.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">3. 쿠키(Cookie)의 사용</h2>
        <p className="mb-2">
          서비스는 사용자에게 더 나은 경험을 제공하기 위해 쿠키를 사용합니다. 쿠키는 웹사이트가 사용자의 컴퓨터 브라우저에 보내는 소량의 정보이며, 사용자의 컴퓨터는 식별하지만 개인적으로 식별하지는 않습니다.
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>필수 쿠키:</strong> 서비스의 기본적인 기능을 유지하기 위해 필수적으로 사용됩니다.</li>
          <li><strong>분석 쿠키:</strong> Google Analytics를 통해 서비스 이용 행태를 분석하고 서비스 품질을 개선하기 위해 사용됩니다. (선택 사항)</li>
          <li><strong>광고 쿠키:</strong> Google AdSense를 통해 사용자에게 맞춤형 광고를 제공하기 위해 사용됩니다. (선택 사항)</li>
        </ul>
        <p className="mt-2">
          귀하는 언제든지 <Link to="/cookie-settings" className="text-blue-500 hover:underline">쿠키 설정</Link> 페이지를 통해 쿠키 사용에 대한 동의를 변경하거나 철회할 수 있습니다.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">4. 제3자 제공 및 위탁</h2>
        <p>
          서비스는 법령에 근거가 있거나 정부의 요청이 있는 경우를 제외하고는 사용자의 사전 동의 없이 개인정보를 외부에 제공하지 않습니다. 단, 다음과 같은 경우는 예외로 합니다.
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Google AdSense:</strong> 관심 기반 광고를 제공하기 위해 광고 식별자(쿠키)를 Google과 공유할 수 있습니다.</li>
          <li><strong>Google Analytics:</strong> 서비스 사용 통계 분석을 위해 익명의 데이터를 Google과 공유할 수 있습니다.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">5. 개인정보의 보유 및 이용기간</h2>
        <p>
          수집된 개인정보는 관련 법령에 따른 보관 의무가 없는 한, 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">6. 문의</h2>
        <p>
          개인정보 처리방침에 대한 문의사항이 있으시면 아래 연락처로 문의해 주시기 바랍니다.
        </p>
        <p className="mt-2">
          이메일: <a href="mailto:privacy@lottoria.ai.kr" className="text-blue-500 hover:underline">privacy@lottoria.ai.kr</a>
        </p>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
