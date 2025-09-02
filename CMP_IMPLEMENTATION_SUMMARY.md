# Google CMP (Consent Management Platform) 구현 작업 요약

이 문서는 Google AdSense 심사 및 GDPR/ePrivacy 규정 준수를 위해 서비스에 CMP 관련 기능을 구현한 내역을 요약합니다.

## 📅 작업 일자

2025년 9월 2일

## ✅ 주요 작업 내역

### 1. 법적 고지 페이지 3종 추가

사용자에게 투명한 정보 제공 및 법적 요구사항 준수를 위해 아래 3개의 페이지를 `frontend/src/pages` 디렉토리에 생성했습니다.

- **개인정보 처리방침 (`PrivacyPolicy.tsx`)**: 서비스의 개인정보 수집, 이용, 제3자 제공, 쿠키 사용 등에 대한 상세 내용을 포함합니다.
- **쿠키 설정 (`CookieSettings.tsx`)**: 사용자가 직접 분석 및 광고 쿠키 사용 여부를 선택하고 설정을 저장할 수 있는 기능을 제공합니다.
- **이용약관 (`Terms.tsx`)**: 서비스 이용에 대한 기본적인 규칙과 면책 조항 등을 명시합니다.

### 2. 라우팅 설정

`frontend/src/App.tsx` 파일에 새로 생성된 페이지들에 대한 라우팅 규칙을 추가하여 사용자가 해당 URL로 접근할 수 있도록 설정했습니다.

```tsx
// /frontend/src/App.tsx
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookieSettings from './pages/CookieSettings';
import Terms from './pages/Terms';

// ...
<Routes>
  {/* ... 기존 경로 ... */}
  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
  <Route path="/cookie-settings" element={<CookieSettings />} />
  <Route path="/terms" element={<Terms />} />
</Routes>
// ...
```

### 3. 푸터(Footer) 링크 추가

사용자가 사이트 어느 곳에서든 법적 고지 페이지에 쉽게 접근할 수 있도록 `frontend/src/components/Layout/Layout.tsx`의 푸터 영역에 아래 링크들을 추가했습니다.

- 이용약관
- 개인정보처리방침
- 쿠키 설정

```tsx
// /frontend/src/components/Layout/Layout.tsx
<div className="flex justify-center space-x-4 mb-4 text-sm text-gray-600">
  <Link to="/terms" className="hover:text-blue-600 transition-colors">이용약관</Link>
  <Link to="/privacy-policy" className="hover:text-blue-600 transition-colors">개인정보처리방침</Link>
  <Link to="/cookie-settings" className="hover:text-blue-600 transition-colors">쿠키 설정</Link>
</div>
```

### 4. 쿠키 동의 상태 관리 훅(Hook) 생성

Google CMP로부터 전달받는 사용자의 동의 상태를 애플리케이션 전역에서 쉽게 사용할 수 있도록 `frontend/src/hooks/useCookieConsent.ts` 훅을 생성했습니다.

- 이 훅은 `window`의 `message` 이벤트를 리스닝하여 CMP의 동의 상태 응답(`consent_response`)을 감지합니다.
- 감지된 동의 상태(`ad_storage`, `analytics_storage` 등)를 React의 `state`로 관리하고 반환합니다.

### 5. AdSense 컴포넌트 수정

`frontend/src/components/AdSense/AdSense.tsx` 컴포넌트를 수정하여 `useCookieConsent` 훅을 통해 얻은 동의 상태에 따라 광고를 조건부로 로드하도록 변경했습니다.

- **동의 상태 확인**: CMP로부터 동의 상태를 받기 전까지 광고를 로드하지 않습니다.
- **비개인화 광고(NPA) 설정**: 사용자가 광고 쿠키(`ad_storage`)에 동의하지 않은 경우, 비개인화 광고를 요청하도록 `data-npa-on-unknown-consent` 속성을 동적으로 설정합니다.

```tsx
// /frontend/src/components/AdSense/AdSense.tsx
const consentStatus = useCookieConsent();

// ...

// CMP 응답이 없으면 렌더링하지 않음
if (!consentStatus) {
  return null;
}

// ad_storage 동의 여부에 따라 NPA 설정
const npaSetting = consentStatus.ad_storage !== 'granted' ? '1' : '0';

return (
  <ins
    // ...
    data-npa-on-unknown-consent={npaSetting}
  />
);
```

## 🚀 향후 진행 사항

- Docker 환경에서 개발 서버를 실행하여 현재까지의 작업 내역을 최종 확인합니다.
- 변경 사항이 최종 확정되면 Git에 커밋 및 푸시합니다.
