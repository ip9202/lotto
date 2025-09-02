import React from 'react';

const Terms: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 text-gray-800 dark:text-gray-200">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">이용약관</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">최종 수정일: 2025년 9월 2일</p>
      </header>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">제1조 (목적)</h2>
        <p>
          본 약관은 로또리아 AI(이하 "서비스")가 제공하는 모든 서비스의 이용 조건 및 절차, 회원과 회사 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">제2조 (서비스의 제공 및 변경)</h2>
        <p>
          서비스는 AI 기반 로또 번호 분석 및 추천 정보를 제공합니다. 제공되는 정보는 통계적 확률에 근거한 것으로, 당첨을 보장하지 않습니다. 서비스의 내용은 운영상, 기술상의 필요에 따라 변경될 수 있습니다.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">제3조 (면책조항)</h2>
        <p>
          서비스가 제공하는 데이터 및 분석 정보는 사용자의 참고용이며, 이를 활용한 최종적인 판단과 책임은 전적으로 사용자에게 있습니다. 서비스는 제공된 정보로 인해 발생한 어떠한 형태의 손실이나 손해에 대해서도 책임을 지지 않습니다.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">제4조 (약관의 효력 및 변경)</h2>
        <p>
          본 약관의 내용은 서비스 화면에 게시하거나 기타의 방법으로 공지함으로써 효력이 발생합니다. 회사는 합리적인 사유가 발생할 경우, 관련 법령에 위배되지 않는 범위 안에서 본 약관을 개정할 수 있습니다.
        </p>
      </section>
    </div>
  );
};

export default Terms;
