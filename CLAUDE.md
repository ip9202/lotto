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

### 최근 수정 사항 (2025-01-11)

**추천 번호 지속성 및 중복 저장 방지 기능 완료** ✅:
- **localStorage 저장/복원**: 추천받은 번호를 브라우저에 자동 저장하여 페이지 리로드 후에도 유지
- **중복 저장 방지**: 같은 번호 조합이 이미 저장되어 있으면 "이미 저장된 번호입니다!" 알림 표시
- **정확한 중복 체크**: 번호를 정렬한 후 배열 비교로 정확한 중복 감지
- **새로운 추천 시 초기화**: 새로운 추천을 받기 전에 이전 추천 번호 자동 삭제
- **기본/고급 추천 모두 지원**: 두 가지 추천 방식 모두에서 지속성 기능 적용

**주요 수정 파일**:
- `frontend/src/pages/Recommendation.tsx`: localStorage 저장/복원 로직 추가, 기본 추천에도 적용
- `frontend/src/components/SaveRecommendation/SaveRecommendation.tsx`: 중복 체크 로직 완전 구현

**Google AdSense 정책 위반 방지 조치 완료** ✅:
- **Consent Mode v2 적용**: 동의 전 광고 스크립트 미로딩으로 정책 준수
- **연령 보호 강화**: 19세 이상 이용 가능 명시 및 미성년자 접근 차단 안내
- **도박 관련 표현 개선**: "당첨 보장" → "참고용 서비스"로 변경하여 과도한 유도 표현 제거
- **정책 준수 페이지 추가**: `/adsense-policy` 경로로 상세한 정책 안내 제공
- **메타 태그 개선**: SEO 메타 태그에서 과도한 유도 표현 제거
- **ads.txt 검증 완료**: 올바른 pub ID 설정 확인

**주요 수정 파일**:
- `frontend/index.html`: Consent Mode v2 적용, 메타 태그 개선
- `frontend/src/hooks/useCookieConsent.ts`: Consent Mode v2 연동
- `frontend/src/pages/Home.tsx`: 도박 관련 표현 개선
- `frontend/src/pages/AdSensePolicy.tsx`: 정책 준수 페이지 신규 생성
- `frontend/src/App.tsx`: 정책 페이지 라우팅 추가

### 최근 수정 사항 (2025-09-11)

**고급 추천 탭 UI/UX 대폭 개선 완료** ✅:
- **깔끔한 카드 레이아웃**: 조합 설정과 번호 관리를 별도 카드로 분리
- **직관적인 슬라이더 인터페이스**: 기존 3개 입력 필드 → 2개 슬라이더로 단순화
- **시각적 비율 표시**: 수동/자동 조합 비율을 프로그레스 바로 시각화
- **모던한 디자인 요소**: 부드러운 그라데이션과 3D 효과로 입체감 강조
- **반응형 최적화**: 모바일과 데스크탑에서 모두 완벽한 사용자 경험

**저장 한도 초과 에러 처리 완전 개선** ✅:
- **사전 차단 로직**: 실제 저장 개수 확인 후 10개 이상 시 POST 요청 없이 알림만 표시
- **정확한 개수 계산**: API 응답 구조 `data.total` 값 사용으로 올바른 저장 개수 확인
- **친절한 에러 메시지**: 현재 저장 개수와 해결 방법을 명시한 상세 안내
- **403 에러 완전 방지**: 백엔드 호출 전 프론트엔드에서 한도 체크

**전역 알림 시스템 구축** ✅:
- **NotificationContext 생성**: 모든 컴포넌트가 동일한 알림 상태 공유
- **토스트 알림 표시**: 화면 우상단에 5초간 에러/성공 메시지 표시
- **일관된 사용자 경험**: 모든 페이지에서 통일된 알림 시스템 사용

**저장된 번호 페이지 개선** ✅:
- **제목 정리**: 개수 표시 제거로 깔끔한 제목
- **순번 표시**: 저장된 번호에 내림차순 번호 배지 추가 (상단이 큰 수)
- **시각적 개선**: 파란색 원형 배지로 번호 식별 용이

**포함/제외 설정 저장 버튼 개선** ✅:
- **조건부 표시**: 포함/제외 번호 선택 시에만 저장 버튼 표시
- **시각적 강화**: 그라데이션 버튼과 아이콘으로 사용성 향상

**주요 수정 파일**:
- `frontend/src/pages/Recommendation.tsx`: 고급 추천 탭 UI 완전 개편
- `frontend/src/components/SaveRecommendation/SaveRecommendation.tsx`: 저장 한도 체크 로직 완전 개선
- `frontend/src/contexts/NotificationContext.tsx`: 전역 알림 시스템 구축
- `frontend/src/components/UnifiedNumberManager/UnifiedNumberManager.tsx`: 설정 저장 버튼 조건부 표시
- `frontend/src/pages/SavedNumbers.tsx`: 번호 순서 표시 및 제목 개선
- `frontend/src/App.tsx`: NotificationProvider 통합

### 이전 수정 사항 (2025-09-10)

**더미 데이터 생성 기능 오류 4건 해결**:
- `created_at` 필드 중복 설정 문제 ✅
- `matched_numbers` 타입 불일치 (JSON vs integer[]) ✅
- SQLAlchemy `func` 사용법 오류 ✅
- **당첨번호 조합 생성 로직 부정확 문제 ✅** (추가 수정)

**당첨번호 조합 정확성 수정**:
- 3등, 4등, 5등에서 `winning_numbers[:n]` 순서 사용 → `random.sample()` 랜덤 선택
- 미당첨 데이터도 정확한 일치 개수(0-2개)로 생성
- `Query`, `Optional` import 누락 문제 해결

**통계 대시보드 그래프 오류 수정 (2025-09-10)**:
- **가짜 데이터 생성 문제 해결**: `generatePerformanceData` 함수가 실제 API 데이터 대신 가짜 데이터를 생성하던 문제 수정
- **실제 데이터 기반 차트**: `winningData.results` 배열에서 실제 `created_at` 날짜별로 데이터 집계
- **정확한 당첨자 수**: `is_winner` 필드를 사용하여 실제 당첨자 수 계산
- **회차별 구매 기간 매핑**: 1186회차(8/17~8/23), 1187회차(8/24~8/30), 1188회차(8/31~9/6) 정확한 날짜 설정
- **데이터베이스 날짜 수정**: 1186회차, 1187회차, 1188회차 추첨일 및 구매 기간 데이터 정확성 확보

---

**⚠️ 중요**: 모든 응답과 커뮤니케이션은 한국어로 진행합니다.