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

### 개발 우선순위
1. **유료 서비스 시스템**
2. **모바일 최적화 (PWA)**
3. **고급 분석 기능**

---

**⚠️ 중요**: 모든 응답과 커뮤니케이션은 한국어로 진행합니다.