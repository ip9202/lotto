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
4. **통계 대시보드**: 사용자별 당첨률 및 성과 분석 (구매기간 포함)
5. **관리자 시스템**: 사용자 관리 및 데이터 업데이트
6. **구매기간 자동 관리**: 새 회차 업데이트 시 구매기간 자동 계산 및 저장

## 📊 데이터베이스

### 주요 테이블
- **users**: 사용자 계정 (이메일/소셜 로그인)
- **saved_recommendations**: 저장된 추천번호
- **lotto_draws**: 로또 당첨번호 이력 (구매기간 포함)
  - `purchase_start_date`: 구매 시작일 (일요일)
  - `purchase_end_date`: 구매 종료일 (추첨일, 토요일)
  - `purchase_period`: 구매기간 텍스트 (MM/DD ~ MM/DD)

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
- `DEVELOPMENT_SETUP.md`: 개발 환경 설정

## 🚀 현재 상태

### 프로덕션 서비스 ✅
- **Frontend**: https://lottoria.ai.kr
- **Backend API**: https://lotto-backend-production-e7f6.up.railway.app/docs
- **자동 배포**: GitHub push → Railway 자동 빌드/배포

### 완료된 기능 ✅
- **소셜 로그인**: 카카오/네이버 OAuth 인증
- **번호 저장 시스템**: 개인별 추천번호 저장 및 관리
- **자동 당첨 비교**: 매주 당첨번호 자동 비교 및 통계
- **통계 대시보드**: 실시간 성과 분석 및 차트
- **관리자 시스템**: 사용자 관리 및 데이터 업데이트
- **구매기간 자동 관리**: 회차별 구매기간 자동 계산
- **모바일 최적화**: 반응형 디자인 완료
- **주간 저장 한도**: 회차 기반 정확한 한도 관리

### 개발 우선순위
1. **유료 서비스 시스템**
2. **PWA 기능 추가**
3. **고급 분석 기능**

### 최신 해결 사항 (2025-09-20)
- **스케줄러 데이터 타입 오류 수정**: draw_date 문자열을 date 객체로 변환하는 로직 추가
- **1190회차 업데이트 성공**: 2025-09-20 토요일 당첨번호 정상 반영
- **자동 업데이트 안정화**: 매주 토요일 21:20 스케줄러 정상 작동 확인
- **주간 저장 한도 리셋 문제**: 회차 전환 시 정상적으로 0/10 리셋
- **구매기간 자동 관리**: auto_updater에서 자동 계산 및 저장
- **API 환경변수**: Railway 프로덕션 환경 완전 대응
- **UX 개선**: 깜박임 현상 해결 및 UI 간소화

---

**⚠️ 중요**: 모든 응답과 커뮤니케이션은 한국어로 진행합니다.
- 빌드 및 테스트는 모두 Docker 안에서 이루어집니다.