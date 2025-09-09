import React from 'react';
// import { useCookieConsent } from '../../hooks/useCookieConsent'; // 심사 완료 후 활성화

// AdSense 타입 정의
declare global {
  interface Window {
    adsbygoogle: any[];
    adsenseInitialized: boolean;
    adsenseErrorSuppressed: boolean;
  }
}

interface AdSenseProps {
  adSlot?: string;
  adFormat?: 'auto' | 'fluid';
  style?: React.CSSProperties;
  className?: string;
}

const AdSense: React.FC<AdSenseProps> = ({ 
  className = '' 
}) => {
  // const consentStatus = useCookieConsent(); // 심사 완료 후 활성화
  // const [isAdPushed, setIsAdPushed] = useState(false);
  // const adElementRef = useRef<HTMLElement>(null);

  // 심사 중이므로 AdSense 완전 비활성화
  return (
    <div className={`adsense-disabled ${className}`} style={{ display: 'none' }}>
      {/* AdSense 심사 완료 후 활성화 예정 */}
    </div>
  );

  /* 심사 완료 후 활성화 예정
  useEffect(() => {
    // AdSense 관련 로직...
  }, []);
  */
};

export default AdSense;
