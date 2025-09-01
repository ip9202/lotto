import React from 'react';
import AdSense from './AdSense';

interface AdSenseBannerProps {
  className?: string;
}

const AdSenseBanner: React.FC<AdSenseBannerProps> = ({ className = '' }) => {
  return (
    <div className={`ad-banner ${className}`}>
      <AdSense 
        adSlot="1234567890" 
        adFormat="auto"
        className="w-full"
      />
    </div>
  );
};

export default AdSenseBanner;
