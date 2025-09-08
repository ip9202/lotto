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
    // consentStatus가 null이 아니고, 아직 광고가 푸시되지 않았을 때만 실행
    if (consentStatus && !isAdPushed) {
      const timer = setTimeout(() => {
        try {
          if (typeof window !== 'undefined' && window.adsbygoogle) {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            setIsAdPushed(true);
          }
        } catch (error) {
        }
      }, 1000); // 1초 지연으로 안전하게 처리

      return () => clearTimeout(timer);
    }
  }, [consentStatus, isAdPushed]);

  // CMP 응답이 없으면 렌더링하지 않습니다.
  if (!consentStatus) {
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
        data-ad-client="ca-pub-1813089661807173"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
        data-npa-on-unknown-consent={npaSetting}
      />
    </div>
  );
};

export default AdSense;
