import React from 'react';
import AdSense from './AdSense';

interface AdSenseBannerProps {
  className?: string;
}

const AdSenseBanner: React.FC<AdSenseBannerProps> = ({ className = '' }) => {
  return (
    <div className={`w-full ${className}`}>
      <AdSense 
        adSlot="1234567890" // 실제 슬롯 ID로 변경 필요
        adFormat="auto"
        style={{ 
          display: 'block',
          minHeight: '90px',
          width: '100%'
        }}
      />
    </div>
  );
};

export default AdSenseBanner;
