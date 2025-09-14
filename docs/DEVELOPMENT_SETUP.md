# 🚀 로또리아 AI 개발환경 설정

## ⚠️ 개발 시작 전 필수 확인사항

**모든 개발은 Docker를 통해서만 진행합니다.**

## 🐳 Docker 개발 (권장)

### 1. Docker Desktop 설치
```bash
# Docker Desktop 다운로드 및 설치
# https://www.docker.com/products/docker-desktop/

# Docker 버전 확인
docker --version
# 결과: Docker version 24.x.x 이상
```

### 2. 프로젝트 시작
```bash
# 프로젝트 클론
git clone https://github.com/your-username/lotto.git
cd lotto

# 모든 서비스 시작
docker-compose up -d

# 시작 상태 확인
docker-compose ps
# 결과: 3개 컨테이너가 모두 "Up" 상태
```

### 3. 서비스 접속
- **프론트엔드**: http://localhost:5173
- **백엔드 API**: http://localhost:8000/docs
- **관리자**: http://localhost:5173/admin

## 🐍 Python 수동 개발 (백엔드 디버깅용)

**⚠️ 백엔드 Python 코드 수정 시에만 사용**

### 1. Conda 가상환경 활성화
```bash
# 기존 conda 가상환경 활성화 (필수!)
conda activate py3_12

# 가상환경 활성화 확인
echo $CONDA_DEFAULT_ENV
# 결과: py3_12
```

### 2. 백엔드 실행
```bash
# 백엔드 의존성 설치 (처음 한 번만)
cd backend
pip install -r requirements.txt

# 백엔드 실행
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 🚨 문제 해결

### Docker 관련 문제
```bash
# Docker Desktop 재시작이 해결책인 경우가 많음

# 포트 충돌 확인
lsof -i :5432  # PostgreSQL
lsof -i :8000  # Backend
lsof -i :5173  # Frontend

# 컨테이너 재시작
docker-compose down && docker-compose up -d
```

### Conda 가상환경 문제
```bash
# 문제: "conda: command not found"
# 해결방법: Conda 초기화
source ~/opt/anaconda3/etc/profile.d/conda.sh
conda activate py3_12

# 문제: Python 패키지 import 오류
# 해결방법: 가상환경 재활성화
conda deactivate
conda activate py3_12
```

## 📝 개발 워크플로우

### 일반 개발 (권장)
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

### 백엔드 Python 디버깅
```bash
# 1. conda 가상환경 활성화 (필수!)
conda activate py3_12

# 2. 백엔드 실행
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

**💡 결론: Docker Desktop만 설치하면 바로 개발 시작 가능!**