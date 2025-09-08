# 🎯 로또리아 AI - 인공지능 로또 번호 예측 서비스

[![Status](https://img.shields.io/badge/Status-🚀%20프로덕션%20배포%20완료-brightgreen)](https://lottoria.ai.kr)
[![Python](https://img.shields.io/badge/Python-3.12-blue)](https://python.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green)](https://fastapi.tiangolo.com)

**AI 머신러닝으로 로또 당첨번호를 분석하고 예측하는 로또리아. 과거 데이터 기반 통계 분석과 패턴 인식으로 더 스마트한 로또 번호 선택을 도와드립니다!** 🍀

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

## 🚀 빠른 시작 (Docker 권장)

### 📋 요구사항
- **Docker Desktop** (필수!)
- **Git** (코드 다운로드용)
- **브라우저** (Chrome, Firefox, Safari 등)

### 🐳 Docker로 시작하기 (가장 쉬운 방법)

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

### 🔧 수동 설치 (고급 사용자용)

#### 백엔드 설정
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

#### 프론트엔드 설정
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

### Python/Conda 관련 문제
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

**🚀 현재 상태: 프로덕션 배포 완료 + SEO 최적화 완료 (2025-09-08)**

### 🎯 SEO 최적화 완료 (2025-09-08)
- **검색엔진 최적화**: 구글, 네이버, 다음 검색 최적화 완료
- **Meta 태그 개선**: Title, Description, Keywords 한국어 최적화
- **구조화 데이터**: JSON-LD 스키마로 리치 스니펫 지원
- **robots.txt/sitemap.xml**: 검색엔진 크롤링 최적화
- **PWA 매니페스트**: 앱 설치 가능, 바로가기 메뉴 지원
- **성능 최적화**: GZIP 압축, 캐싱, HTTPS 강제 설정
- **예상 효과**: 검색 랭킹 향상, 페이지 속도 개선, 모바일 친화성 증대

**🌐 라이브 사이트: https://lottoria.ai.kr**