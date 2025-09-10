# 🎯 로또리아 AI - 인공지능 로또 번호 예측 서비스

[![Status](https://img.shields.io/badge/Status-🚀%20프로덕션%20배포%20완료-brightgreen)](https://lottoria.ai.kr)
[![Python](https://img.shields.io/badge/Python-3.12-blue)](https://python.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green)](https://fastapi.tiangolo.com)

**AI 머신러닝으로 로또 당첨번호를 분석하고 예측하는 로또리아. 과거 데이터 기반 통계 분석과 패턴 인식으로 더 스마트한 로또 번호 선택을 도와드립니다!** 🍀

## 🐳 Docker로 시작하기

> **⚠️ 중요**: 모든 서비스는 Docker를 통해 실행됩니다. Docker Desktop을 설치하고 `docker-compose up -d` 명령어로 시작하세요.

```bash
# 1. Docker Desktop 설치 및 실행
# https://www.docker.com/products/docker-desktop/

# 2. 프로젝트 클론
git clone https://github.com/your-username/lotto.git
cd lotto

# 3. 모든 서비스 시작 (PostgreSQL + Backend + Frontend)
docker-compose up -d

# 4. 브라우저에서 접속
# 프론트엔드: http://localhost:5173
# 백엔드 API: http://localhost:8000/docs
```

## 🚀 현재 개발 상태 (2025-09-10)

### ✅ 최근 완료된 기능들 (2025-09-10)

**통계 대시보드 그래프 오류 수정 완료**:
- **가짜 데이터 생성 문제 해결**: `generatePerformanceData` 함수가 실제 API 데이터 대신 가짜 데이터를 생성하던 문제 수정
- **실제 데이터 기반 차트**: `winningData.results` 배열에서 실제 `created_at` 날짜별로 데이터 집계
- **정확한 당첨자 수**: `is_winner` 필드를 사용하여 실제 당첨자 수 계산
- **회차별 구매 기간 매핑**: 1186회차(8/17~8/23), 1187회차(8/24~8/30), 1188회차(8/31~9/6) 정확한 날짜 설정
- **데이터베이스 날짜 수정**: 1186회차, 1187회차, 1188회차 추첨일 및 구매 기간 데이터 정확성 확보

### ✅ 이전 완료된 기능들 (2025-09-09)
- **📊 통계 대시보드 수정 완료**: 하드코딩된 1188회차를 동적으로 현재의 전회차로 수정, 데이터 일관성 확보
- **🎨 UI/UX 개선 및 최적화**: 메인페이지 반응형 로또볼, 제목 중복 제거, 설정 저장 버튼 위치 변경
- **📱 반응형 디자인**: 데스크탑에서는 크게, 모바일에서는 작게 자동 조정되는 로또볼
- **🔧 UI 단순화**: 포함/제외 번호 카드 제거로 볼 클릭만으로 번호 선택/해제 가능
- **💾 저장 버튼 시스템 개선**: 중복 저장 방지, 실시간 통계 업데이트, 주간 한도 로직 수정
- **🔄 API 응답 구조 개선**: 백엔드 응답을 프론트엔드에서 올바르게 처리하도록 수정
- **📊 실시간 통계 표시**: 저장 후 로그인 패널의 저장 개수 자동 업데이트
- **🎯 저장 상태 관리**: 이미 저장된 번호는 "저장 완료" 상태로 표시
- **🏆 당첨 이력 페이지**: 동행복권 스타일의 깔끔한 당첨 비교 페이지 구현
- **📱 모바일 최적화**: 반응형 디자인으로 모바일에서도 완벽한 사용자 경험
- **🔍 실시간 당첨 비교**: 1188회차 당첨번호와 개인 저장번호 실시간 비교
- **📊 8컬럼 테이블**: A, 당첨등급, 번호1~6으로 구성된 깔끔한 테이블
- **🎯 당첨번호 표시**: 맞는 번호는 볼, 맞지 않는 번호는 텍스트로 구분
- **📈 숫자 정렬**: 모든 번호를 오름차순으로 정렬하여 직관적 표시
- **🧪 테스트 데이터**: lee@example.com 계정으로 3등, 4등, 5등 당첨 데이터 생성
- **관리자 페이지 UI 개선**: 통합 스케줄러 관리 카드, 업데이트 버튼 이동
- **스케줄러 시스템 수정**: 매일 실행되도록 변경, 수동/자동 업데이트 로직 통일
- **세션 관리 비활성화**: 차후 개발 예정으로 비활성화하되 코드 보존
- **코드 리팩토링**: 컴포넌트 분리, 공통 패턴 추출, TypeScript 에러 해결 완료

### 🎯 현재 시스템 상태
- **🏆 당첨 이력 페이지**: 완전히 작동하는 상태 (`/winning-history`) ✅
- **📱 모바일 최적화**: 모든 디바이스에서 완벽한 사용자 경험 ✅
- **🔍 당첨 비교 시스템**: 실시간 당첨번호와 개인 저장번호 비교 완료 ✅
- **관리자 페이지**: 완전히 작동하는 상태 (대시보드, 스케줄러 관리) ✅
- **스케줄러**: 매일 00:01에 자동 실행, 수동 업데이트 가능 ✅
- **인증 시스템**: 소셜 로그인 (카카오, 네이버) + 이메일 로그인 통합 ✅
- **다음 단계**: 유료 서비스 개발 및 고급 분석 기능 추가

### 📊 추천번호 저장 시스템 기획
- **공공 데이터**: 추천 버튼 클릭 시 자동 저장 (전체 통계용)
- **개인 데이터**: 저장 버튼 클릭 시 자동 저장 (개인 당첨 확인용)
- **회차 통일**: 모든 데이터는 추천 생성 시점의 회차로 자동 설정
- **제한 시스템**: 비회원 1주일 5개, 회원 1주일 10개
- **당첨 비교**: 1186회차 당첨번호와 저장된 번호들 자동 비교

### ✅ 핵심 기능들
- **통합 인증 시스템**: 이메일 회원가입/로그인 + 소셜 로그인 통합 완료
- **카카오 로그인 완성**: 신규/기존 사용자 자동 처리, 완전 자동화된 플로우 + UX 개선 + 중복 사용자 생성 방지
- **프로필 설정**: 모든 계정에서 비밀번호 변경 가능, 계정 정보 관리, 소셜 계정 연동 안내
- **소셜 계정 연결**: 기존 이메일 계정에 카카오 계정 연결 가능
- **로그아웃 개선**: 로그아웃 시 메인페이지 자동 이동
- **콘솔 로그 정리**: 프로덕션 환경에 적합하게 정리 완료
- **관리자 로그인 통합**: 별도 관리자 로그인을 일반 로그인 시스템으로 통합
- **권한 기반 접근**: 관리자 페이지는 관리자 권한 계정만 접근 가능
- **관리자 시스템**: 역할 기반 접근 제어 및 관리자 패널 완료
- **로그인 지속성**: 페이지 새로고침 시 로그인 상태 유지 완료
- **통계 대시보드**: 사용자 통계, 로또 번호 분석, 추천 성과 차트 완료
- **추천번호 관리**: CRUD 작업, 즐겨찾기, 태그 시스템 완료
- **당첨 비교 시스템**: 매주 당첨번호 자동 비교, 등수 계산, 상금 계산 완료 ✅
- **당첨 이력 페이지**: 동행복권 스타일 UI로 실시간 당첨 결과 확인 완료 ✅
- **사용자 통계**: 당첨률, 총 당첨금, 최고 등수 실시간 업데이트 완료
- **데이터베이스**: PostgreSQL과 SQLAlchemy 모델 완전 일치 완료

### 🔧 API 엔드포인트 (22개 구현 완료)
- **통합 인증**: `/api/v1/auth/register/email`, `/api/v1/auth/login/email`, `/api/v1/auth/login/social`, `/api/v1/auth/link/social`, `/api/v1/auth/me`
- **관리자**: `/api/v1/auth/admin/users`, `/api/v1/auth/admin/update-role`
- **추천번호**: `/api/v1/saved-recommendations` (CRUD)
- **통계**: `/api/v1/saved-recommendations/stats/summary`, `/api/v1/lotto/statistics`
- **당첨확인**: `/api/v1/saved-recommendations/check-winning`

### 🔐 통합 인증 시스템
- **이메일 회원가입/로그인**: 직접 이메일과 비밀번호로 계정 생성 및 로그인
- **소셜 로그인**: 카카오 로그인으로 기존 이메일 계정에 연결
- **계정 연결**: 이메일 계정에 여러 소셜 계정 연결 가능
- **관리자 시스템**: 역할 기반 접근 제어 (USER/ADMIN)
- **로그인 지속성**: 페이지 새로고침 시에도 로그인 상태 유지
- **✅ 해결 완료**: 카카오 로그인 중복 요청 문제 완전 해결 (2025-09-08)

### 📊 통계 대시보드
- **사용자 통계**: 총 추천 수, 당첨 수, 당첨률, 총 당첨금, 최고 등수
- **로또 번호 분석**: 번호별 출현 빈도 차트, 핫/콜드 넘버 시각화
- **추천 성과 분석**: 생성 방법별 성과, 등수별 당첨 분포, 시간별 활동
- **인터랙티브 차트**: Recharts 기반 깔끔한 디자인의 차트 컴포넌트
- **실시간 데이터**: API 연동으로 실시간 통계 업데이트
- **반응형 디자인**: 모바일/데스크톱 최적화된 대시보드
- **⚠️ 중요**: 모든 통계 데이터는 **현재의 전회차(이전 회차) 데이터만** 기준으로 계산됨
- **✅ 수정 완료**: 하드코딩된 1188회차를 동적으로 현재의 전회차로 수정
- **✅ 데이터 일관성**: 총 추천수, 당첨수, 당첨률 모두 전회차 기준으로 통일
  - **전역 콜백 처리**: App.tsx의 CallbackHandler로 안정적인 로그인 처리
  - **즉시 로그인 완료**: 새로고침 없이도 로그인 상태 즉시 반영
- **네이버 로그인**: 구현 완료 (검수 대기 중)
  - 백엔드 로직 완성, UI에서 숨김 처리
  - 검수 완료 후 즉시 활성화 가능
- **AdSense 통합**: Google AdSense 심사용 복원 (에러 방지 처리 포함)

### ✅ 당첨 비교 시스템 완료 (2025-09-09)
- **매주 당첨번호 자동 비교**: 스케줄러를 통한 자동 당첨번호 비교
- **당첨 순위 및 예상 당첨금액 알림**: 1등~5등 자동 계산 및 상금 표시
- **당첨 통계 및 분석 제공**: 개인별 당첨률, 총 당첨금, 최고 등수 통계
- **실시간 당첨 확인**: `/winning-history` 페이지에서 실시간 당첨 결과 확인
- **동행복권 스타일 UI**: 8컬럼 테이블로 깔끔한 당첨 결과 표시
- **모바일 최적화**: 반응형 디자인으로 모든 디바이스에서 완벽한 사용자 경험

### 📋 다음 개발 예정
- ✅ **카카오 로그인 중복 요청 해결**: 세션 스토리지 + useRef 이중 보안으로 완전 해결
- ✅ **당첨 비교 시스템**: 완전히 작동하는 상태
- 유료 서비스 시스템 개발
- 네이버 로그인 활성화 (검수 완료 후)
- PWA 기능 추가

## ✨ 주요 기능

### 🤖 AI 추천 엔진
- **종합 분석**: 출현 빈도, 트렌드, 간격, 패턴, 균형 등 6가지 요소 종합 분석
- **신뢰도 점수**: 0.0 ~ 1.0 범위의 정확한 AI 신뢰도 제공
- **개인화 추천**: 포함/제외 번호 설정을 반영한 맞춤형 추천

### 🎲 조합 생성
- **수동 조합**: 원하는 번호로 직접 조합 생성
- **AI 자동 조합**: AI가 분석한 최적 조합 자동 생성
- **하이브리드**: 수동 + AI 조합 혼합 생성

### 📊 실시간 데이터
- **자동 업데이트**: 매주 일요일 자동으로 최신 당첨 번호 수집
- **통계 분석**: 과거 데이터 기반 패턴 분석
- **트렌드 분석**: 최근 20회차 데이터 기반 트렌드 분석

### 🎨 모던한 UI/UX
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 완벽 지원
- **로또 볼 시스템**: 5가지 색상으로 구분된 직관적인 번호 선택
- **세련된 디자인**: 그라데이션과 3D 효과로 현대적인 느낌
- **PWA 지원**: 앱과 같은 사용자 경험 제공

## 🚀 빠른 시작 (Docker 필수)

### 📋 요구사항
- **Docker Desktop** (필수! - 모든 서비스는 Docker로 실행)
- **Git** (코드 다운로드용)
- **브라우저** (Chrome, Firefox, Safari 등)

### 🐳 Docker로 시작하기 (유일한 방법)

#### 1단계: Docker Desktop 설치 및 실행
```bash
# Docker Desktop 다운로드 및 설치
# https://www.docker.com/products/docker-desktop/

# Docker Desktop 실행 확인
docker --version
# 결과: Docker version 24.x.x 이상이어야 함

# Docker 서비스가 실행 중인지 확인
docker ps
# 결과: 빈 테이블이 표시되면 정상 (아직 컨테이너가 없음)
```

#### 2단계: 프로젝트 다운로드
```bash
# 프로젝트 클론
git clone https://github.com/your-username/lotto.git
cd lotto

# 또는 ZIP 파일로 다운로드 후 압축 해제
```

#### 3단계: Docker 서비스 시작
```bash
# 모든 서비스 한 번에 시작 (PostgreSQL + Backend + Frontend)
docker-compose up -d

# 시작 상태 확인
docker-compose ps
# 결과: 3개 컨테이너가 모두 "Up" 상태여야 함
```

#### 4단계: 서비스 접속
```bash
# 브라우저에서 접속
# 프론트엔드: http://localhost:5173
# 백엔드 API: http://localhost:8000/docs
# 관리자: http://localhost:5173/admin
```

### 🔧 수동 설치 (Docker 외부 개발용 - 권장하지 않음)

> **⚠️ 주의**: 모든 서비스는 Docker를 통해 실행하는 것이 권장됩니다. 수동 설치는 특별한 디버깅 목적으로만 사용하세요.

#### 백엔드 설정 (Docker 외부)
```bash
# ⚠️ 중요: Python 개발 시 반드시 conda 가상환경 py3_12 사용
# 기존 가상환경 활성화
conda activate py3_12

# 가상환경 활성화 확인
echo $CONDA_DEFAULT_ENV
# 결과: py3_12

# 백엔드 의존성 설치
cd backend
pip install -r requirements.txt

# 백엔드 실행
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 프론트엔드 설정 (Docker 외부)
```bash
# Node.js 18+ 설치 확인
node --version
npm --version

# 프론트엔드 의존성 설치
cd frontend
npm install

# 프론트엔드 실행
npm run dev
```

> **💡 권장사항**: 개발은 `docker-compose up -d`로 시작하는 것이 가장 안정적입니다.

## 🏗️ 프로젝트 구조

```
lotto/
├── frontend/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/      # 재사용 가능한 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   └── App.tsx         # 메인 앱 컴포넌트
│   └── package.json
├── backend/                  # FastAPI 백엔드
│   ├── app/
│   │   ├── api/            # API 엔드포인트
│   │   ├── models/         # 데이터베이스 모델
│   │   ├── schemas/        # Pydantic 스키마
│   │   ├── services/       # 비즈니스 로직
│   │   └── main.py         # FastAPI 앱
│   └── requirements.txt
├── docker-compose.yml        # Docker 서비스 구성
├── start_dev.sh             # 개발 환경 시작 스크립트
└── README.md                # 프로젝트 개요
```

## 🔧 기술 스택

### Backend
- **FastAPI**: 현대적이고 빠른 Python 웹 프레임워크
- **SQLAlchemy**: Python ORM
- **PostgreSQL**: 강력한 관계형 데이터베이스
- **APScheduler**: 백그라운드 작업 스케줄링
- **BeautifulSoup4**: 웹 스크래핑

### Frontend
- **React 18**: 최신 React 기능 활용
- **TypeScript**: 타입 안전성 보장
- **Tailwind CSS**: 유틸리티 퍼스트 CSS 프레임워크
- **React Router**: 클라이언트 사이드 라우팅

### Infrastructure
- **Docker**: 컨테이너화된 배포
- **Docker Compose**: 멀티 서비스 오케스트레이션
- **Railway**: 클라우드 호스팅 (프로덕션)

## 📚 API 문서

### 주요 엔드포인트
- `POST /api/v1/recommendations/generate` - AI 추천 생성
- `GET /api/v1/lotto/latest` - 최신 당첨 번호
- `GET /api/v1/lotto/statistics` - 통계 정보
- `GET /admin/check-latest-data` - 관리자: 데이터 상태 확인

### API 문서 접속
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🎯 AI 분석 요소

### 1. 개별 번호 분석 (40%)
- **출현 빈도**: 실제 vs 이론적 기댓값 비교
- **최근 트렌드**: HOT/COLD 번호 분석
- **번호 간격**: 마지막 출현 이후 경과 회차

### 2. 조합 패턴 분석 (35%)
- **홀짝 균형**: 3:3이 가장 이상적
- **구간 분포**: 1-15, 16-30, 31-45 균등 분포
- **연속 번호**: 연속 번호가 적을수록 높은 점수
- **번호 간격 균형**: 간격의 표준편차가 작을수록 높은 점수
- **끝자리 분포**: 0-9 끝자리가 다양할수록 높은 점수

### 3. 통계적 균형 분석 (25%)
- **평균값 편차**: 이론적 평균(23)과의 차이
- **분산 점수**: 적당한 분산 유지 (50-200)
- **극값 분포**: 적당한 범위 유지 (20-35)
- **과거 패턴 유사도**: 과거 당첨 번호와의 유사성

## 🔐 관리자 시스템

- **관리자 인증**: 보안된 관리자 로그인
- **시스템 모니터링**: 실시간 시스템 상태 확인
- **데이터 관리**: 수동 데이터 업데이트 및 스케줄러 제어
- **사용자 관리**: 사용자 세션 및 데이터 관리

## 🚀 배포

### 프로덕션 환경
- **도메인**: https://lottoria.ai.kr
- **SSL 인증서**: Railway 자동 적용
- **호스팅**: Railway (Docker 기반)
- **데이터베이스**: Railway PostgreSQL

### 배포 체크리스트
- [x] 기능 테스트 완료
- [x] UI/UX 최적화 완료
- [x] SEO 최적화 완료
- [x] 브랜딩 통일 완료
- [x] 프로덕션 환경 배포 완료

## 🆘 문제 해결

### Docker 관련 문제 (주요 해결 방법)
```bash
# 문제: Docker Desktop이 실행되지 않음
# 해결방법: Docker Desktop 재시작
# 1. Docker Desktop 종료
# 2. Docker Desktop 재시작
# 3. 시스템 재부팅 (필요시)

# 문제: 컨테이너가 시작되지 않음
# 해결방법: 컨테이너 재시작
docker-compose down
docker-compose up -d

# 문제: 포트 충돌
# 해결방법: 포트 사용 현황 확인
lsof -i :5432  # PostgreSQL
lsof -i :8000  # Backend
lsof -i :5173  # Frontend

# 문제: 서비스 상태 확인
docker-compose ps
docker-compose logs -f [service_name]
```

### Python/Conda 관련 문제 (Docker 외부 개발시만)
```bash
# 문제: "conda: command not found"
# 해결방법: Conda 초기화
source ~/opt/anaconda3/etc/profile.d/conda.sh
conda activate py3_12

# 문제: 가상환경이 활성화되지 않음
# 해결방법: 수동 활성화
source ~/opt/anaconda3/envs/py3_12/bin/activate

# 문제: Python 패키지 import 오류
# 해결방법: 가상환경 재활성화
conda deactivate
conda activate py3_12

# 문제: pip install 실패
# 해결방법: 가상환경에서 pip 업그레이드
pip install --upgrade pip
```

### Docker 관련 문제
```bash
# Docker Desktop이 실행되지 않는 경우
# 1. Docker Desktop 재시작
# 2. 시스템 재부팅
# 3. Docker Desktop 재설치

# 컨테이너가 시작되지 않는 경우
docker-compose down
docker-compose up -d

# 포트 충돌 문제
# 5432, 8000, 5173 포트가 사용 중인지 확인
lsof -i :5432
lsof -i :8000
lsof -i :5173
```

### 데이터베이스 연결 문제
```bash
# PostgreSQL 컨테이너 상태 확인
docker ps | grep postgres

# PostgreSQL 로그 확인
docker logs lotto_postgres

# 데이터베이스 연결 테스트
docker exec lotto_postgres psql -U lotto_user -d lotto_db -c "SELECT COUNT(*) FROM lotto_draws;"
```

### 프론트엔드 문제
```bash
# Node.js 버전 확인 (18+ 필요)
node --version

# 의존성 재설치
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 연락처

- **프로젝트 링크**: [https://github.com/your-username/lotto](https://github.com/your-username/lotto)
- **이슈 리포트**: [https://github.com/your-username/lotto/issues](https://github.com/your-username/lotto/issues)

## 🙏 감사의 말

- 동행복권 사이트에서 제공하는 공개 데이터
- FastAPI, React, Tailwind CSS 등 오픈소스 프로젝트
- 이 프로젝트에 기여해주신 모든 분들

---

**⭐ 이 프로젝트가 도움이 되었다면 스타를 눌러주세요!**

**🚀 현재 상태: 프로덕션 배포 완료 + SEO 최적화 완료**

**🌐 라이브 사이트: https://lottoria.ai.kr**