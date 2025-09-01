import React from 'react';

// AdSense 타입 정의
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdSenseProps {
  adSlot: string;
  adFormat?: 'auto' | 'fluid';
  style?: React.CSSProperties;
  className?: string;
}

const AdSense: React.FC<AdSenseProps> = ({ 
  adSlot, 
  adFormat = 'auto', 
  style = {}, 
  className = '' 
}) => {
  React.useEffect(() => {
    try {
      // AdSense가 로드되었는지 확인하고 광고를 푸시
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.warn('AdSense 로드 중 오류:', error);
      // AdSense가 로드되지 않은 경우 테스트 메시지 표시
      console.log('AdSense 스크립트 로드 실패 - 계정 승인 대기 중일 수 있습니다.');
    }
  }, []);

  return (
    <div className={`adsense-container ${className}`} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-1813089661807173"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdSense;
