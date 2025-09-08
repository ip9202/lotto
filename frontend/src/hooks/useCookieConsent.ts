import { useEffect, useState } from 'react';

// Google CMP로부터 받는 동의 상태에 대한 타입 정의
interface ConsentState {
  ad_storage?: 'granted' | 'denied';
  analytics_storage?: 'granted' | 'denied';
  functionality_storage?: 'granted' | 'denied';
  personalization_storage?: 'granted' | 'denied';
  security_storage?: 'granted' | 'denied';
}

// window.addEventListener를 통해 받는 메시지 이벤트 타입
interface ConsentMessageEvent extends MessageEvent {
  data: {
    type: string;
    consent?: ConsentState;
  };
}

export const useCookieConsent = () => {
  const [consentStatus, setConsentStatus] = useState<ConsentState | null>(null);

  useEffect(() => {
    const handleConsentMessage = (event: Event) => {
      // 타입 가드를 사용하여 event가 ConsentMessageEvent인지 확인
      const consentEvent = event as ConsentMessageEvent;
      if (consentEvent.data && consentEvent.data.type === 'consent_response') {
        const consent = consentEvent.data.consent;
        if (consent) {
          console.log('Received consent state from CMP:', consent);
          setConsentStatus(consent);

          // AdSense 관련 로직 제거 (심사 완료 후 추가 예정)
          console.log('Cookie consent received:', consent);
        }
      }
    };

    // Google CMP는 postMessage를 사용하여 동의 상태를 전달할 수 있습니다.
    window.addEventListener('message', handleConsentMessage);

    // 컴포넌트 언마운트 시 이벤트 리스너 정리
    return () => {
      window.removeEventListener('message', handleConsentMessage);
    };
  }, []);

  return consentStatus;
};
