# 카카오 로그인 연동 이슈 현황 보고서

## 📋 문제 개요

**핵심 문제**: 프로필 설정 페이지에서 카카오 계정 연동이 실패하는 문제

**현재 상태**: 
- ✅ 로그인 페이지: 카카오 로그인 → 자동 연동 성공
- ❌ 프로필 설정: 카카오 연동 버튼 없음 (연동 불가능)

## 🔍 기술적 원인 분석

### 1. 프로필 설정 페이지 문제
- **현재 상태**: `ProfileSettings.tsx`에 카카오 연동 버튼이 없음
- **기대 상태**: 연동되지 않은 사용자에게 "카카오 계정 연동하기" 버튼 표시

### 2. 연동 플로우 문제
- **로그인 페이지**: 카카오 OAuth → 콜백 처리 → 자동 연동 ✅
- **프로필 설정**: 연동 버튼 자체가 없어서 연동 불가능 ❌

## 🛠️ 시도한 해결 방법들

### 1. SocialLogin 컴포넌트 활용
- `ProfileSettings.tsx`에 `SocialLogin` 컴포넌트 추가 시도
- `onLogin` prop을 통한 연동 처리 로직 구현

### 2. 직접 연동 API 호출
- `/api/v1/auth/link/kakao` 엔드포인트 직접 호출
- 팝업 방식으로 카카오 인증 후 연동 처리

### 3. 로그인 페이지 리다이렉트
- `/login?action=kakao_link`로 리다이렉트하여 연동 처리
- URL 파라미터를 통한 연동 모드 구분

## 📊 테스트 결과

### 성공 케이스
- **로그인 페이지 카카오 로그인**: 정상 작동
- **회원가입 시 카카오 연동**: 정상 작동
- **기존 사용자 카카오 연동**: 로그인 페이지에서 정상 작동

### 실패 케이스
- **프로필 설정에서 카카오 연동**: 버튼 자체가 없음
- **이미 로그인된 사용자의 연동**: UI가 제공되지 않음

## 🎯 해결 방향

### 1. 프로필 설정 페이지 수정
```typescript
// ProfileSettings.tsx에 추가 필요
{!user.linked_social_providers?.includes('KAKAO') && (
  <div className="mt-8">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">소셜 계정 연동</h2>
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
      <p className="text-gray-600 mb-4">
        소셜 계정을 연동하면 더 편리하게 로그인할 수 있습니다.
      </p>
      <SocialLogin
        onLogin={handleKakaoLink}
        className="w-full"
      />
    </div>
  </div>
)}
```

### 2. SocialLogin 컴포넌트 개선
- `onLogin` prop이 있을 때 팝업 방식으로 카카오 인증
- 인증 완료 후 부모 컴포넌트로 결과 전달

### 3. 연동 처리 로직
```typescript
const handleKakaoLink = async (accessToken: string, userData: any) => {
  try {
    const response = await fetch('/api/v1/auth/link/kakao', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify({
        provider: 'kakao',
        access_token: accessToken
      })
    });
    
    const result = await response.json();
    if (result.success) {
      // 연동 성공 - 페이지 새로고침
      window.location.reload();
    } else {
      setErrors({ linking: result.message || '카카오 연동에 실패했습니다.' });
    }
  } catch (error) {
    setErrors({ linking: '카카오 연동 중 오류가 발생했습니다.' });
  }
};
```

## 📁 관련 파일

- `frontend/src/pages/ProfileSettings.tsx` - 프로필 설정 페이지
- `frontend/src/components/SocialLogin/SocialLogin.tsx` - 소셜 로그인 컴포넌트
- `frontend/src/pages/Login.tsx` - 로그인 페이지 (정상 작동)
- `backend/app/api/v1/endpoints/unified_auth.py` - 연동 API 엔드포인트

## 🚀 다음 단계

1. **프로필 설정 페이지에 연동 UI 추가**
2. **SocialLogin 컴포넌트의 onLogin 처리 개선**
3. **연동 성공/실패 메시지 표시**
4. **테스트 및 검증**

## 📝 참고사항

- 백엔드 API는 정상 작동 중
- 로그인 페이지의 카카오 연동은 완벽하게 작동
- 문제는 프론트엔드 UI/UX 부분에 집중
- 사용자 경험 개선이 핵심

---
*작성일: 2025-01-27*
*상태: 해결 필요*
