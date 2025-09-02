# 🚀 로또리아 AI 개발환경 설정 가이드

## ⚠️ **개발 시작 전 필수 확인사항**

### 1. Python 개발환경 설정 (수동 개발 시) 🐍
```bash
# 기존 conda 가상환경 활성화
conda activate py3_12

# 가상환경 활성화 확인
echo $CONDA_DEFAULT_ENV
# 결과: py3_12

# Python 버전 확인
python --version
# 결과: Python 3.12.x
```

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

### 방법 1: Docker 사용 (권장)
```bash
# 1. Docker Desktop 실행 확인
docker ps

# 2. 프로젝트 디렉토리로 이동
cd ~/develop/vibe/lotto

# 3. 서비스 시작
docker-compose up -d

# 4. 개발 시작! 🚀
```

### 방법 2: 수동 개발 (Python 코드 수정 시)
```bash
# 1. 기존 conda 가상환경 활성화
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
