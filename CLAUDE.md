# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

이 파일은 Claude Code가 이 프로젝트에서 작업할 때 필요한 핵심 가이드라인을 제공합니다.

## 🐳 개발 환경 (필수)

**⚠️ CRITICAL: 모든 개발은 Docker를 통해서만 진행합니다.**

### 필수 명령어
```bash
# 모든 서비스 시작
docker-compose up -d

# 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f [service_name]

# 서비스 중지
docker-compose down
```

### 접속 URL
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/docs
- **Admin Panel**: http://localhost:5173/admin

## 🏗️ 프로젝트 개요

### 기술 스택
- **Backend**: FastAPI + Python 3.12 + PostgreSQL 15
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Deployment**: Docker Compose (dev) / Railway (prod)

### 핵심 기능
1. **AI 로또 번호 추천**: Monte Carlo 방법론 기반 통계 분석
2. **소셜 로그인**: 카카오/네이버 OAuth 2.0 인증
3. **번호 저장 관리**: 개인별 추천번호 저장 및 당첨 비교
4. **통계 대시보드**: 사용자별 당첨률 및 성과 분석
5. **관리자 시스템**: 사용자 관리 및 데이터 업데이트

## 📊 데이터베이스

### 주요 테이블
- **users**: 사용자 계정 (이메일/소셜 로그인)
- **saved_recommendations**: 저장된 추천번호
- **lotto_draws**: 로또 당첨번호 이력

### 환경변수
```bash
DATABASE_URL=postgresql://lotto_user:lotto_password@postgres:5432/lotto_db
KAKAO_REST_API_KEY=932fccce67821851edcda7436612c582
VITE_KAKAO_APP_KEY=932fccce67821851edcda7436612c582
```

## 🔧 개발 명령어

### Frontend
```bash
# 빌드 & 린트
npm run build
npm run lint

# 프로덕션 미리보기
npm run preview
```

### Backend
```bash
# 테스트 실행
docker exec -it lotto_backend python -m pytest

# DB 연결 확인
docker exec -it lotto_postgres psql -U lotto_user -d lotto_db
```

## 📝 코딩 규칙

### 필수 사항
- **TypeScript Strict Mode**: any 타입 사용 금지
- **Component Structure**: 함수형 컴포넌트 + hooks 사용
- **Error Handling**: 모든 API 호출에 try/catch 적용
- **반응형 디자인**: Tailwind CSS + mobile-first 접근

### MCP 사용 규칙
- **Sequential Thinking**: 명시적 요청 시에만 사용 (--think 플래그 또는 "깊게 분석해줘" 등)
- **기본 추론**: 일반적인 질문과 작업에는 sequential-thinking 사용하지 않음
- **토큰 효율**: 복잡한 분석이 명시적으로 요청되지 않은 경우 기본 추론 사용

### 품질 체크
- `npm run lint` 통과 필수
- 빌드 에러 없이 `docker-compose up -d` 실행 가능
- 관리자 계정: `ip9202@gmail.com` (비밀번호: `rkdcjfIP`)

## 📚 상세 문서

더 자세한 정보는 `docs/` 폴더를 참조하세요:
- `ARCHITECTURE.md`: 시스템 아키텍처
- `API.md`: API 엔드포인트 문서
- `DATABASE.md`: 데이터베이스 스키마
- `AUTHENTICATION.md`: 인증 시스템
- `DOCKER_SETUP.md`: Docker 환경 설정

## 🚀 현재 상태

### Railway 배포 완료 (2025-09-11) ✅

**🌐 프로덕션 서비스**:
- **Frontend**: https://lottoria.ai.kr
- **Backend API**: https://lotto-backend-production-e7f6.up.railway.app/docs
- **자동 배포**: GitHub push → Railway 자동 빌드/배포

**주요 해결 사항**:
- ✅ CORS 설정: Railway 환경변수로 직접 설정
- ✅ 소셜 로그인: 카카오/네이버 앱 키 Railway 대시보드 설정  
- ✅ DB 스키마: 완전한 saved_recommendations 테이블 재생성
- ✅ 환경변수: .env 파일 → Railway 대시보드 환경변수로 전환

### 완료된 기능 ✅
- 소셜 로그인 (카카오/네이버)
- 번호 저장 및 관리
- 당첨 비교 시스템
- 통계 대시보드
- 관리자 기능
- **더미 데이터 생성 시스템** (2025-09-10 오류 수정 완료)

### 더미 데이터 생성 기능 상세
- 관리자가 회차별로 더미 추천 데이터 대량 생성 가능
- 등수별 분포 설정 (1등~5등, 미당첨)
- 통계 대시보드에서 더미 데이터 별도 통계 확인
- API: `/admin/dummy-recommendations/generate`, `/admin/dummy-recommendations/stats`

### 개발 우선순위
1. **유료 서비스 시스템**
2. **모바일 최적화 (PWA)**
3. **고급 분석 기능**

### 최근 수정 사항 (2025-09-12)

**프로덕션 환경 API 연동 완전 해결** ✅:
- **문제점**: Railway 프로덕션에서 하드코딩된 `localhost:8000` URL 호출로 인한 401 Unauthorized 에러
- **해결방안**: 모든 API 호출을 `${import.meta.env.VITE_API_URL}` 환경변수 기반으로 변경
- **영향 범위**: 15개 API 엔드포인트, 5개 주요 페이지
- **결과**: Railway 프로덕션에서 모든 인증 및 API 기능 정상 작동

**수정된 파일 및 API**:
- `frontend/src/pages/ProfileSettings.tsx`: 사용자 정보 조회, 비밀번호 변경 (2개 API)
- `frontend/src/pages/Login.tsx`: 모든 인증 관련 API (7개 API)
- `frontend/src/pages/Register.tsx`: 카카오 연동 API (1개 API)
- `frontend/src/App.tsx`: 콜백 핸들러 API (2개 API)
- `frontend/src/pages/Home.tsx`: 카카오 사용자 확인 API (3개 API)

**개발용 콘솔 로그 완전 제거** ✅:
- **정리된 파일**: SavedNumbers.tsx, Recommendation.tsx, SaveRecommendation.tsx, NotificationContext.tsx, ProfileSettings.tsx
- **제거된 로그**: 30+ 개의 개발용 console.log, console.debug 문
- **보존된 로그**: 에러 처리용 console.error만 유지
- **효과**: 프로덕션 성능 향상 및 콘솔 정리
- **커밋**: 커밋 2f7aced와 9a506c6으로 배포 완료

**카카오 연동 UX 개선 완료** ✅:
- **문제**: 프로필설정에서 카카오 연동 시 메인페이지로 2번 이동하는 깜박임 현상
- **원인**: 복잡한 리다이렉트 경로 (ProfileSettings → Login → 카카오 → 메인 → ProfileSettings)
- **해결**: ProfileSettings에서 직접 카카오 OAuth 처리 구현
- **기술적 변경**:
  - 카카오 개발자 콘솔에 `/profile-settings` Redirect URI 추가
  - 직접 카카오 인증 URL 구성 및 콜백 처리
  - 불필요한 페이지 이동 제거
- **결과**: 깜박임 없는 자연스러운 카카오 연동 경험

**고급추천 설정 UPDATE 문제 완전 해결** ✅:
- **문제**: 고급추천 포함/제외 번호 설정 시 UPDATE가 작동하지 않는 치명적 버그
- **증상**: INSERT는 성공하지만 UPDATE 시 API는 성공 응답하나 DB에 반영 안됨
- **원인**: SQLAlchemy JSON 필드 변경 감지 실패 및 세션 동기화 문제
- **해결책**:
  - 새로운 독립 세션(`SessionLocal()`) 사용으로 동시성 문제 해결
  - `flag_modified()` 강제 적용으로 JSON 필드 변경 감지 보장
  - Raw SQL 대신 안전한 ORM 기반 업데이트 방식 적용
  - with문을 통한 자동 트랜잭션 관리로 안정성 확보
- **테스트 결과**: INSERT/UPDATE 모두 정상 작동 확인
- **영향**: 사용자 경험 대폭 개선, 고급추천 기능 완전 정상화

### 주요 완료 기능 요약

**핵심 시스템** ✅:
- localStorage 기반 추천번호 지속성 및 중복 저장 방지
- 전역 알림 시스템 (NotificationContext)
- 저장 한도 관리 및 에러 처리
- Google AdSense 정책 준수 (Consent Mode v2)

**UI/UX 개선** ✅:
- 고급 추천 탭 슬라이더 인터페이스
- 저장된 번호 페이지 순번 표시
- 포함/제외 설정 조건부 저장 버튼
- 반응형 디자인 최적화

**데이터 정확성** ✅:
- 더미 데이터 생성 시스템 오류 수정
- 통계 대시보드 실제 데이터 기반 차트
- 회차별 구매 기간 정확한 매핑

---

**⚠️ 중요**: 모든 응답과 커뮤니케이션은 한국어로 진행합니다.
- 빌드 및 테스트는 모두 docker 안에서 이루어진다(강조).