import React, { useEffect, useState } from 'react';
import { useCookieConsent } from '../../hooks/useCookieConsent';

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
  const consentStatus = useCookieConsent();
  const [isAdPushed, setIsAdPushed] = useState(false);

  useEffect(() => {
    // consentStatus가 null이 아니면(즉, CMP로부터 응답을 받으면) 광고 로직을 실행합니다.
    if (consentStatus) {
      try {
        if (typeof window !== 'undefined' && window.adsbygoogle) {
          console.log('Pushing AdSense ad with consent:', consentStatus);
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          setIsAdPushed(true);
        }
      } catch (error) {
        console.error('AdSense push error:', error);
      }
    }
  }, [consentStatus]); // consentStatus가 변경될 때마다 이 효과를 재실행합니다.

  // CMP 응답이 없거나, 광고가 아직 푸시되지 않았다면 렌더링하지 않습니다.
  if (!consentStatus || !isAdPushed) {
    return null;
  }

  // 비개인화 광고(NPA) 설정을 동의 상태에 따라 결정합니다.
  // ad_storage가 'granted'가 아니면 NPA를 활성화합니다.
  const npaSetting = consentStatus.ad_storage !== 'granted' ? '1' : '0';

  return (
    <div className={`adsense-container ${className}`} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-1813089661807173" // 환경 변수 사용을 권장합니다.
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
        data-npa-on-unknown-consent={npaSetting}
      />
    </div>
  );
};

export default AdSense;
