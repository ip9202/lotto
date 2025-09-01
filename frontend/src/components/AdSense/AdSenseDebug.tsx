import React, { useState, useEffect } from 'react';

const AdSenseDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const checkAdSense = () => {
      const info: any = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        domain: window.location.hostname,
        protocol: window.location.protocol,
        adsbygoogle: typeof window.adsbygoogle,
        adsbygoogleLength: window.adsbygoogle?.length || 0,
        adBlockDetected: false,
        scriptLoaded: false
      };

      // AdSense 스크립트 로드 확인
      const scripts = document.querySelectorAll('script[src*="adsbygoogle"]');
      info.scriptLoaded = scripts.length > 0;
      info.scriptCount = scripts.length;

      // 광고 차단 감지
      try {
        const testAd = document.createElement('div');
        testAd.innerHTML = '&nbsp;';
        testAd.className = 'adsbox';
        testAd.style.cssText = 'position:absolute;left:-10000px;top:-1000px;';
        document.body.appendChild(testAd);
        
        setTimeout(() => {
          const isBlocked = testAd.offsetHeight === 0;
          info.adBlockDetected = isBlocked;
          document.body.removeChild(testAd);
        }, 100);
      } catch (e) {
        info.adBlockError = e.message;
      }

      setDebugInfo(info);
    };

    checkAdSense();
  }, []);

  return (
    <div className="p-4 bg-gray-100 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">🔍 AdSense 디버깅 정보</h3>
      
      <div className="space-y-2 text-sm">
        <div><strong>도메인:</strong> {debugInfo.domain}</div>
        <div><strong>프로토콜:</strong> {debugInfo.protocol}</div>
        <div><strong>AdSense 스크립트:</strong> {debugInfo.scriptLoaded ? '✅ 로드됨' : '❌ 로드 안됨'}</div>
        <div><strong>스크립트 개수:</strong> {debugInfo.scriptCount}</div>
        <div><strong>adsbygoogle 객체:</strong> {debugInfo.adsbygoogle}</div>
        <div><strong>adsbygoogle 길이:</strong> {debugInfo.adsbygoogleLength}</div>
        <div><strong>광고 차단:</strong> {debugInfo.adBlockDetected ? '❌ 감지됨' : '✅ 감지 안됨'}</div>
        <div><strong>User Agent:</strong> {debugInfo.userAgent}</div>
        <div><strong>확인 시간:</strong> {debugInfo.timestamp}</div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded">
        <h4 className="font-semibold text-blue-800">💡 해결 방법:</h4>
        <ul className="text-sm text-blue-700 mt-2 space-y-1">
          <li>• AdSense 계정이 승인되었는지 확인</li>
          <li>• 광고 단위가 생성되었는지 확인</li>
          <li>• Cloudflare 보안 설정 확인</li>
          <li>• 광고 차단 프로그램 비활성화</li>
        </ul>
      </div>
    </div>
  );
};

export default AdSenseDebug;
