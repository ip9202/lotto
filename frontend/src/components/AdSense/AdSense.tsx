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
  const [isAdLoaded, setIsAdLoaded] = React.useState(false);
  const [shouldShow, setShouldShow] = React.useState(false);

  React.useEffect(() => {
    const checkAdSense = async () => {
      try {
        // AdSense 스크립트가 로드되었는지 확인
        if (typeof window !== 'undefined' && window.adsbygoogle) {
          // 광고를 푸시하고 로드 확인
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          
          // 잠시 후 광고가 실제로 로드되었는지 확인
          setTimeout(() => {
            const adElements = document.querySelectorAll('.adsbygoogle');
            let hasLoadedAd = false;
            
            adElements.forEach((ad) => {
              const adElement = ad as HTMLElement;
              // 광고가 로드되면 data-adsbygoogle-status가 설정됨
              if (adElement.getAttribute('data-adsbygoogle-status') === 'done' ||
                  adElement.offsetHeight > 0) {
                hasLoadedAd = true;
              }
            });
            
            setIsAdLoaded(hasLoadedAd);
            setShouldShow(hasLoadedAd);
          }, 1000);
        }
      } catch (error) {
        console.warn('AdSense 로드 중 오류:', error);
        setIsAdLoaded(false);
        setShouldShow(false);
      }
    };

    checkAdSense();
  }, []);

  // 광고가 로드되지 않았으면 아무것도 렌더링하지 않음
  if (!shouldShow) {
    return null;
  }

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
