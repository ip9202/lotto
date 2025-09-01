import React from 'react';
import AdSense from './AdSense';

interface AdSenseBannerProps {
  className?: string;
}

const AdSenseBanner: React.FC<AdSenseBannerProps> = ({ className = '' }) => {
  // 실제 광고 단위 ID가 생성되면 여기에 입력
  const adSlot = "1234567890"; // 임시 광고 단위 ID
  
  return (
    <div className={`ad-banner ${className}`}>
      <AdSense 
        adSlot={adSlot} 
        adFormat="auto"
        className="w-full"
      />
    </div>
  );
};

export default AdSenseBanner;
