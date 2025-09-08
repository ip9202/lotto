import React, { useState, useEffect } from 'react';

// Google의 gtag 타입을 확장하여 consent 함수를 인식시킵니다.
declare global {
  interface Window {
    gtag?: (command: string, action: string, params: Record<string, string>) => void;
  }
}

const CookieSettings: React.FC = () => {
  // 실제 Google CMP의 기본값을 가져오는 로직이 필요하지만,
  // 여기서는 UI 시연을 위해 초기 상태를 false로 설정합니다.
  const [settings, setSettings] = useState({
    analytics_storage: false,
    ad_storage: false,
  });

  const [isSaved, setIsSaved] = useState(false);

  // 컴포넌트 마운트 시 현재 동의 상태를 가져오는 로직 (시뮬레이션)
  useEffect(() => {
    // 실제로는 Google CMP API를 통해 현재 동의 상태를 가져와야 합니다.
    // 예: window.google_tag_manager.getConsentState();
    // 지금은 로컬 스토리지나 기본값으로 대체합니다.
    const savedConsent = localStorage.getItem('cookie_consent');
    if (savedConsent) {
      setSettings(JSON.parse(savedConsent));
    }
  }, []);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setIsSaved(false);
  };

  const handleSave = () => {
    // Google CMP API (gtag.js)를 통해 동의 상태를 업데이트합니다.
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': settings.analytics_storage ? 'granted' : 'denied',
        'ad_storage': settings.ad_storage ? 'granted' : 'denied',
      });
    }

    // 사용자의 선택을 로컬 스토리지에 저장하여 유지합니다.
    localStorage.setItem('cookie_consent', JSON.stringify(settings));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000); // 2초 후 메시지 숨김

    console.log('Cookie settings updated:', settings);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 text-gray-800 dark:text-gray-200">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">쿠키 설정</h1>
        <p className="text-gray-600 dark:text-gray-400">
          귀하의 개인정보 보호를 위해 쿠키 사용을 직접 제어할 수 있습니다. 변경사항은 저장 후 즉시 적용됩니다.
        </p>
      </header>

      <div className="space-y-6">
        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">필수 쿠키</h3>
            <span className="text-sm font-medium text-green-600 dark:text-green-400">항상 활성화</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            웹사이트의 핵심 기능을 활성화하는 데 필수적입니다. 이 쿠키 없이는 서비스가 정상적으로 작동하지 않을 수 있습니다.
          </p>
        </div>

        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">분석 쿠키</h3>
            <label htmlFor="analytics_storage" className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                id="analytics_storage" 
                className="sr-only peer" 
                checked={settings.analytics_storage}
                onChange={() => handleToggle('analytics_storage')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            웹사이트 방문 및 이용 행태에 대한 통계를 수집하여 서비스 개선에 사용됩니다. (예: Google Analytics)
          </p>
        </div>

        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">광고 쿠키</h3>
            <label htmlFor="ad_storage" className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                id="ad_storage" 
                className="sr-only peer" 
                checked={settings.ad_storage}
                onChange={() => handleToggle('ad_storage')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            귀하의 관심사에 맞는 맞춤형 광고를 제공하는 데 사용됩니다. (현재 비활성화)
          </p>
        </div>
      </div>

      <div className="mt-8 text-center">
        <button 
          onClick={handleSave} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300"
        >
          설정 저장
        </button>
        {isSaved && <p className="text-green-600 dark:text-green-400 mt-2">설정이 저장되었습니다!</p>}
      </div>
    </div>
  );
};

export default CookieSettings;
