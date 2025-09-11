import React from 'react';
// import AdSense from './AdSense'; // 심사 완료 후 활성화

interface AdSenseBannerProps {
  className?: string;
}

const AdSenseBanner: React.FC<AdSenseBannerProps> = ({ className = '' }) => {
  // 심사 중이므로 AdSense 비활성화
  return (
    <div className={`w-full ${className}`} style={{ display: 'none' }}>
      {/* AdSense 심사 완료 후 활성화 예정 */}
    </div>
  );
};

export default AdSenseBanner;
