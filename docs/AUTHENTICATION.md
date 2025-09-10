# 인증 시스템 문서

## 소셜 로그인 구현 (2025-09-08)

### 카카오 소셜 로그인 완전 구현
- OAuth 2.0 인증 코드 플로우 구현
- 백엔드에서 카카오 API 토큰 교환 (`get_kakao_access_token`)
- 사용자 정보 조회 (고유 ID만 수집, 개인정보 최소화)
- JWT 토큰 생성 및 프론트엔드 로그인 상태 관리
- **전역 콜백 처리**: App.tsx의 CallbackHandler로 안정적인 로그인 처리
- **즉시 로그인 완료**: 새로고침 없이도 로그인 상태 즉시 반영

### 네이버 소셜 로그인 준비 완료 (검수 대기 중)
- 네이버 OAuth 2.0 플로우 구현 완료
- 백엔드 토큰 교환 로직 구현 (`get_naver_access_token`)
- UI에서 네이버 로그인 버튼 숨김 처리 (검수 완료 후 활성화 예정)
- 설정 파일들은 보존하여 나중에 쉽게 활성화 가능

### 환경변수 설정
- `VITE_KAKAO_APP_KEY`: 카카오 JavaScript SDK 키
- `KAKAO_REST_API_KEY`: 카카오 REST API 키 (백엔드 토큰 교환용)
- `VITE_NAVER_CLIENT_ID`, `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`: 네이버 로그인용

### 보안 및 개인정보 보호
- 최소한의 개인정보만 수집 (고유 ID, 닉네임)
- 이메일, 프로필 이미지 등은 선택적 수집
- 법적 리스크 최소화를 위한 데이터 수집 정책 적용

## 통합 인증 시스템 (2025-09-08)

### 완성된 기능
- **Email Registration/Login**: Direct email/password authentication
- **Social Login Integration**: Kakao login with account linking
- **Admin Management**: Role-based access control with admin panel
- **Login Persistence**: Page refresh maintains authentication state
- **Database Schema**: Extended User model with password_hash, role, login_method fields
- **API Endpoints**: `/api/v1/auth/*` for unified authentication
- **Frontend Context**: `UnifiedAuthContext` for state management
- **Pages**: `/login`, `/register` for user authentication

## 카카오 로그인 중복 요청 문제 해결
- **해결 상태**: ✅ **완료** - 중복 요청 문제 완전 해결
- **적용된 해결책**:
  - **세션 스토리지 기반 중복 방지**: `kakao_processing_${code}` 키로 고유 처리 상태 추적
  - **useRef 이중 보안**: `processingRef.current`로 추가 중복 방지 레이어
  - **즉시 URL 정리**: 토큰 교환 전에 URL 파라미터를 즉시 제거하여 중복 실행 차단
  - **useEffect 의존성 수정**: `[isProcessingKakao]` → `[]`로 변경하여 한 번만 실행
  - **finally 블록**: 처리 완료 후 세션 스토리지와 ref 상태 자동 정리

## 관리자 로그인 시스템 통합
- **관리자 로그인 통합**: 별도 관리자 로그인 시스템을 일반 로그인으로 통합
- **권한 기반 접근**: 관리자 페이지는 관리자 권한이 있는 계정만 접근 가능
- **관리자 계정**: `ip9202@gmail.com` (UserRole.ADMIN)

## Authentication System Testing
- **Social Login Test**: Use mock tokens in development for Kakao/Naver login
- **JWT Token Validation**: Check `/api/v1/auth/me` endpoint with Bearer token
- **Database Tables**: Ensure `users` and `saved_recommendations` tables exist with correct schema
- **Frontend Auth Flow**: Test UnifiedAuthContext state management and localStorage persistence
- **CRUD Operations**: Test save, list, update, delete operations for saved recommendations
- **User Profile**: Test `/api/v1/auth/profile` endpoint for complete user data
- **Statistics**: Test `/api/v1/saved-recommendations/stats/summary` for user statistics

## 프로필 설정 기능
- **프로필 설정 페이지**: `/profile-settings` 경로
- **비밀번호 변경**: 모든 계정에서 비밀번호 변경 가능
- **계정 정보 표시**: 이메일, 닉네임, 로그인 방식, 연동된 소셜 계정
- **소셜 로그인 안내**: 카카오/네이버 사용자는 해당 플랫폼에서 변경 안내