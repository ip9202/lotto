# 🎯 LottoGenius 통합 개발 문서 패키지

> **완전한 로또 번호 추천 서비스 개발 명세서**
> 
> 이 문서 하나로 Cursor AI가 전체 프로젝트를 구현할 수 있습니다!

---

# 📄 1. README.md - 프로젝트 개요

# 🎯 LottoGenius - AI 로또 번호 추천 서비스

> **간단하고 똑똑한 로또 번호 추천 서비스**  
> React + FastAPI + PostgreSQL + Docker로 구현하는 미니멀 디자인의 로또 분석 플랫폼

## 📋 프로젝트 개요

### 🎲 핵심 기능
- **AI 번호 추천**: 과거 모든 로또 데이터 분석을 통한 확률 기반 추천
- **혼합 선택**: 수동 선택 + AI 자동 추천 조합
- **개인 설정**: 선호 번호 포함, 회피 번호 제외 기능
- **추천 기록**: 당첨 확인을 위한 추천 이력 저장
- **실시간 업데이트**: 매주 새로운 당첨 데이터 자동 업데이트

### 🛠 기술 스택
```
Frontend:   React 18 + Vite + TypeScript
Backend:    Python 3.12 + FastAPI + SQLAlchemy
Database:   PostgreSQL 15+
Container:  Docker + Docker Compose
Analytics:  Pandas + NumPy
```

### 🎨 디자인 시스템
- **스타일**: Minimal Flat Design (그림자 없음, 깔끔한 테두리)
- **폰트**: Inter (영문) + Pretendard (한글)
- **반응형**: Mobile First → PC 자연 확장
- **그리드**: Bootstrap 12컬럼 호환
- **애니메이션**: Fade 트랜지션 (0.2s ease)

---

## 🚀 빠른 시작

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd lotto-genius
```

### 2. 환경 설정 ⚠️ **중요!**
```bash
# 🚨 반드시 conda 가상환경을 먼저 활성화해야 합니다!
conda activate py3_12

# 가상환경이 활성화되었는지 확인 (프롬프트 앞에 (py3_12) 표시)
(py3_12) ~/develop/vibe/lotto $

# 의존성 설치
pip install -r backend/requirements.txt
npm install --prefix frontend
```

### 3. 개발 작업 시 주의사항
```bash
# 🚨 매번 터미널을 열 때마다 반드시 실행!
conda activate py3_12

# 🚨 가상환경 활성화 확인 방법
conda info --envs  # 현재 활성화된 환경 확인
echo $CONDA_DEFAULT_ENV  # 환경 변수로 확인
```

### 3. 데이터베이스 설정
```bash
# PostgreSQL 컨테이너 시작
docker-compose up -d postgres

# 테이블 생성 및 초기 데이터 로드
cd backend
python scripts/init_database.py
python scripts/load_lotto_data.py
```

### 4. 개발 서버 실행
```bash
# 터미널 1: 백엔드 서버
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 터미널 2: 프론트엔드 서버
cd frontend
npm run dev
```

### 5. 접속 확인
- **프론트엔드**: http://localhost:5173
- **API 문서**: http://localhost:8000/docs
- **데이터베이스**: localhost:5432

---

## 🐳 Docker로 전체 실행

### 전체 서비스 실행
```bash
# 모든 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 특정 서비스만 시작
docker-compose up -d postgres backend
```

### 서비스 상태 확인
```bash
# 서비스 상태
docker-compose ps

# 특정 서비스 로그
docker-compose logs backend
docker-compose logs frontend
```

### 서비스 중지
```bash
# 모든 서비스 중지
docker-compose down

# 볼륨까지 삭제
docker-compose down -v
```

---

## 📁 프로젝트 구조

```
lotto-genius/
├── README.md
├── docker-compose.yml
├── .env.example
│
├── backend/                    # FastAPI 백엔드
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI 앱 진입점
│   │   ├── config.py          # 설정 관리
│   │   ├── database.py        # DB 연결 설정
│   │   │
│   │   ├── models/            # SQLAlchemy 모델
│   │   │   ├── __init__.py
│   │   │   ├── lotto.py
│   │   │   ├── user_history.py
│   │   │   └── recommendation.py
│   │   │
│   │   ├── schemas/           # Pydantic 스키마
│   │   │   ├── __init__.py
│   │   │   ├── lotto.py
│   │   │   └── recommendation.py
│   │   │
│   │   ├── api/               # API 라우터
│   │   │   ├── __init__.py
│   │   │   ├── lotto.py
│   │   │   └── recommendations.py
│   │   │
│   │   ├── services/          # 비즈니스 로직
│   │   │   ├── __init__.py
│   │   │   ├── lotto_analyzer.py
│   │   │   └── recommendation_engine.py
│   │   │
│   │   └── utils/             # 유틸리티
│   │       ├── __init__.py
│   │       └── data_loader.py
│   │
│   ├── scripts/               # 스크립트
│   │   ├── init_database.py   # DB 초기화
│   │   └── load_lotto_data.py # 로또 데이터 로드
│   │
│   ├── tests/                 # 테스트
│   │   └── test_recommendations.py
│   │
│   ├── requirements.txt       # Python 의존성
│   └── Dockerfile
│
├── frontend/                   # React 프론트엔드
│   ├── public/
│   │   └── index.html
│   │
│   ├── src/
│   │   ├── main.tsx           # React 앱 진입점
│   │   ├── App.tsx
│   │   │
│   │   ├── components/        # 재사용 컴포넌트
│   │   │   ├── Layout/
│   │   │   ├── LottoBall/
│   │   │   ├── NumberInput/
│   │   │   └── RecommendationCard/
│   │   │
│   │   ├── pages/             # 페이지 컴포넌트
│   │   │   ├── Home.tsx
│   │   │   ├── Recommendation.tsx
│   │   │   └── History.tsx
│   │   │
│   │   ├── services/          # API 통신
│   │   │   └── api.ts
│   │   │
│   │   ├── types/             # TypeScript 타입
│   │   │   └── lotto.ts
│   │   │
│   │   └── styles/            # 스타일
│   │       ├── globals.css
│   │       └── components/
│   │
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── Dockerfile
│
└── data/                      # 데이터 파일
    └── lotto_data.xlsx        # 동행복권 엑셀 데이터
```

---

## 🔧 개발 환경 설정

### Python 환경
```bash
# Python 3.12 설치 (conda 사용)
conda create -n py3_12 python=3.12
conda activate py3_12

# 의존성 설치
pip install -r backend/requirements.txt
```

### Node.js 환경
```bash
# Node.js 18+ 설치
node --version  # v18.0.0 이상

# 프론트엔드 의존성 설치
cd frontend
npm install
```

### PostgreSQL
```bash
# Docker로 PostgreSQL 실행
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15

# 또는 docker-compose 사용
docker-compose up -d postgres
```

---

## 🚀 배포 가이드

### 프로덕션 빌드
```bash
# 프론트엔드 빌드
cd frontend
npm run build

# 백엔드 실행
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 환경변수 설정
```bash
# .env 파일 생성
cp .env.example .env

# 프로덕션 환경변수 수정
DEBUG=False
ENVIRONMENT=production
SECRET_KEY=your-production-secret-key
```

---

## 🧪 테스트

### 백엔드 테스트
```bash
cd backend
pytest tests/
```

### 프론트엔드 테스트
```bash
cd frontend
npm run lint
npm run build
```

---

## 📚 API 문서

### Swagger UI
- **개발 환경**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 주요 엔드포인트
- `GET /api/v1/lotto/latest` - 최신 당첨번호
- `GET /api/v1/lotto/statistics` - 통계 정보
- `POST /api/v1/recommendations/generate` - 번호 추천
- `GET /api/v1/recommendations/history/{session_id}` - 추천 기록

---

## 🐛 문제 해결

### 일반적인 문제들

#### 1. 데이터베이스 연결 실패
```bash
# PostgreSQL 상태 확인
docker-compose ps postgres

# 로그 확인
docker-compose logs postgres

# 수동 연결 테스트
psql -h localhost -U lotto_user -d lotto_genius
```

#### 2. 포트 충돌
```bash
# 포트 사용 확인
lsof -i :8000
lsof -i :5173
lsof -i :5432

# 충돌하는 프로세스 종료
kill -9 <PID>
```

#### 3. 의존성 문제
```bash
# Python 가상환경 재생성
conda deactivate
conda remove -n py3_12 --all
conda create -n py3_12 python=3.12
conda activate py3_12
pip install -r backend/requirements.txt

# Node.js 의존성 재설치
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 지원 및 문의

### 개발팀 연락처
- **프로젝트 매니저**: [이메일]
- **백엔드 개발자**: [이메일]
- **프론트엔드 개발자**: [이메일]

### 문서 및 리소스
- **API 문서**: http://localhost:8000/docs
- **GitHub 저장소**: [링크]
- **프로젝트 위키**: [링크]

---

## 🎉 완성!

**🎯 이제 정말로 완벽한 통합 문서가 완성되었습니다!** 

이 하나의 문서로 Cursor AI가 전체 프로젝트를 구현할 수 있어요! 🚀✨

### 🚀 다음 단계
1. **프로젝트 실행**: `docker-compose up -d`
2. **데이터베이스 초기화**: `python backend/scripts/init_database.py`
3. **개발 시작**: 프론트엔드와 백엔드 동시 개발
4. **테스트**: API 문서에서 엔드포인트 테스트
5. **배포**: 프로덕션 환경 설정 및 배포

**행운을 빕니다! 🍀**