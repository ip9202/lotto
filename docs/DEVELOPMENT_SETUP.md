# 🚀 로또리아 AI 개발환경 설정 가이드

## ⚠️ **개발 시작 전 필수 확인사항**

## 📊 최근 업데이트 (2025-09-10)

### 통계 대시보드 그래프 오류 수정 완료
- **가짜 데이터 생성 문제 해결**: `generatePerformanceData` 함수가 실제 API 데이터 대신 가짜 데이터를 생성하던 문제 수정
- **실제 데이터 기반 차트**: `winningData.results` 배열에서 실제 `created_at` 날짜별로 데이터 집계
- **정확한 당첨자 수**: `is_winner` 필드를 사용하여 실제 당첨자 수 계산
- **회차별 구매 기간 매핑**: 1186회차(8/17~8/23), 1187회차(8/24~8/30), 1188회차(8/31~9/6) 정확한 날짜 설정
- **데이터베이스 날짜 수정**: 1186회차, 1187회차, 1188회차 추첨일 및 구매 기간 데이터 정확성 확보

### 주요 수정 파일
- `frontend/src/components/Statistics/StatisticsDashboard.tsx`: 실제 데이터 기반 차트 생성 로직
- `backend/app/api/admin.py`: 더미 데이터 생성 시 정확한 날짜 분산
- `backend/app/models/public_recommendation.py`: `bonus_number` 컬럼 추가
- `backend/app/api/winning_comparison.py`: 더미 데이터 처리 로직 개선

### 1. Python 개발환경 설정 (수동 개발 시) 🐍
**⚠️ 중요: Python 코드 수정 시 반드시 conda 가상환경을 활성화해야 합니다!**

```bash
# 기존 conda 가상환경 활성화 (필수!)
conda activate py3_12

# 가상환경 활성화 확인
echo $CONDA_DEFAULT_ENV
# 결과: py3_12

# Python 버전 확인
python --version
# 결과: Python 3.12.x
```

**💡 참고**: 
- **Docker 개발**: 일반적인 개발은 Docker 사용 (가상환경 불필요)
- **Python 수정**: 백엔드 Python 코드 수정 시에만 conda 가상환경 필요

### 2. Docker Desktop 설치 및 실행 ✅
```bash
# Docker Desktop 다운로드 및 설치
# https://www.docker.com/products/docker-desktop/

# Docker 버전 확인
docker --version
# 결과: Docker version 24.x.x 이상

# Docker 서비스 실행 확인
docker ps
# 결과: 빈 테이블이 표시되면 정상
```

### 2. 프로젝트 다운로드 ✅
```bash
# 프로젝트 클론
git clone https://github.com/your-username/lotto.git
cd lotto

# 또는 ZIP 파일 다운로드 후 압축 해제
```

### 3. Docker 서비스 시작 ✅
```bash
# 모든 서비스 한 번에 시작
docker-compose up -d

# 시작 상태 확인
docker-compose ps
# 결과: 3개 컨테이너가 모두 "Up" 상태
```

### 4. 서비스 접속 테스트 ✅
```bash
# 브라우저에서 접속
# 프론트엔드: http://localhost:5173
# 백엔드 API: http://localhost:8000/docs
# 관리자: http://localhost:5173/admin
```

## 🚨 **자주 발생하는 문제들**

### 문제 1: Conda 가상환경 문제
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
```

### 문제 2: Docker Desktop이 실행되지 않음
```bash
# 해결방법:
# 1. Docker Desktop 재시작
# 2. 시스템 재부팅
# 3. Docker Desktop 재설치
```

### 문제 3: 포트 충돌
```bash
# 포트 사용 현황 확인
lsof -i :5432  # PostgreSQL
lsof -i :8000  # Backend
lsof -i :5173  # Frontend

# 충돌하는 프로세스 종료
pkill -f "npm run dev"
pkill -f "uvicorn"
pkill -f "postgres"
```

### 문제 4: 컨테이너가 시작되지 않음
```bash
# 컨테이너 재시작
docker-compose down
docker-compose up -d

# 로그 확인
docker logs lotto_postgres
docker logs lotto_backend
docker logs lotto_frontend
```

## 📝 **개발 워크플로우**

### 방법 1: Docker 사용 (권장) 🐳
**일반적인 개발, 프론트엔드 수정, 테스트 등에 사용**

```bash
# 1. Docker Desktop 실행 확인
docker ps

# 2. 프로젝트 디렉토리로 이동
cd ~/develop/vibe/lotto

# 3. 서비스 시작
docker-compose up -d

# 4. 개발 시작! 🚀
# 접속: http://localhost:5173
```

### 방법 2: 수동 개발 (Python 코드 수정 시) 🐍
**⚠️ 백엔드 Python 코드 수정 시에만 사용**

```bash
# 1. conda 가상환경 활성화 (필수!)
conda activate py3_12

# 2. 프로젝트 디렉토리로 이동
cd ~/develop/vibe/lotto

# 3. 백엔드 의존성 설치 (처음 한 번만)
cd backend
pip install -r requirements.txt

# 4. 백엔드 실행
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 5. 새 터미널에서 프론트엔드 실행
cd frontend
npm install  # 처음 한 번만
npm run dev
```

**💡 언제 어떤 방법을 사용할까요?**
- **Docker**: 프론트엔드 수정, 일반 개발, 테스트
- **수동**: 백엔드 Python 코드 수정, 디버깅

### 2. 코드 수정
```bash
# 파일 수정 후
# Docker 컨테이너가 자동으로 변경사항을 감지하여 재시작
# 브라우저에서 http://localhost:5173 접속하여 확인
```

### 3. 변경사항 커밋
```bash
# Git 상태 확인
git status

# 변경사항 스테이징
git add .

# 커밋
git commit -m "✨ 기능 추가: 설명"

# 푸시
git push origin main
```

## 🔍 **문제 해결 시 확인할 것들**

1. **Docker Desktop이 실행 중인가?** `docker ps` 명령어로 확인
2. **포트가 사용 가능한가?** `lsof -i :포트번호` 명령어로 확인
3. **컨테이너가 정상 실행 중인가?** `docker-compose ps` 명령어로 확인
4. **브라우저에서 접속이 되는가?** http://localhost:5173 접속 테스트

## 💡 **팁**

- **Docker Desktop 자동 시작**: 시스템 시작 시 Docker Desktop이 자동으로 실행되도록 설정
- **터미널 프로필**: 프로젝트 디렉토리로 자동 이동하는 터미널 프로필 설정
- **브라우저 북마크**: http://localhost:5173을 브라우저 북마크에 추가

---

**💡 결론: Docker Desktop만 설치하면 바로 개발 시작 가능!**

**마지막 업데이트**: 2025년 1월 26일  
**상태**: 🚀 **개발환경 설정 가이드 완성**  
**다음 단계**: 🎯 **개발 시작**

## 📋 **최근 업데이트 내역**

### 2025년 1월 26일 - AdSense 정책 위반 수정
- **문제**: 구글 AdSense에서 "게시자 콘텐츠가 없는 화면에 광고" 정책 위반 통지
- **원인**: AdSense 승인 전에 광고를 미리 배치한 것이 정책 위반
- **해결**: 
  - Home 페이지에서 모든 AdSense 광고 제거
  - Recommendation 페이지에서 결과가 있을 때만 광고 표시
  - 구글 AdSense에서 사이트 검토 재요청 완료
- **상태**: 승인 대기 중, 승인 후 실제 광고 단위로 교체 예정
