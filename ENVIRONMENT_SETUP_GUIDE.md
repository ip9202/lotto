# 🚀 LottoGenius 개발 환경 설정 가이드

## 📋 **목차**
1. [사전 요구사항](#사전-요구사항)
2. [환경 설정 단계](#환경-설정-단계)
3. [데이터베이스 설정](#데이터베이스-설정)
4. [백엔드 서버 시작](#백엔드-서버-시작)
5. [프론트엔드 확인](#프론트엔드-확인)
6. [문제 해결](#문제-해결)

---

## 🔧 **사전 요구사항**

### **필수 소프트웨어**
- [x] **Python 3.12** (Conda 환경 권장)
- [x] **Docker Desktop** (macOS/Windows)
- [x] **Git** (코드 관리)
- [x] **VS Code** 또는 **Cursor** (에디터)

### **시스템 요구사항**
- **RAM**: 최소 8GB (Docker 컨테이너용)
- **저장공간**: 최소 5GB 여유 공간
- **OS**: macOS 10.15+, Windows 10+, Ubuntu 18.04+

---

## 🎯 **환경 설정 단계**

### **1단계: Conda 환경 활성화**
```bash
# 프로젝트 디렉토리로 이동
cd /Users/ip9202/develop/vibe/lotto

# Conda 환경 활성화
conda activate py3_12

# 환경 확인
python --version  # Python 3.12.x
pip --version     # pip 버전 확인
```

### **2단계: Python 패키지 설치**
```bash
# 백엔드 디렉토리로 이동
cd backend

# 의존성 패키지 설치
pip install -r requirements.txt

# 설치 확인
pip list | grep -E "(fastapi|uvicorn|sqlalchemy|psycopg2|pydantic|apscheduler)"
```

### **3단계: Docker 서비스 시작**
```bash
# 프로젝트 루트로 이동
cd ..

# Docker Desktop 시작 (macOS)
open -a Docker

# Docker 시작 대기 (10-15초)
sleep 15

# Docker 상태 확인
docker --version
docker ps
```

---

## 🗄️ **데이터베이스 설정**

### **자동 설정 (권장)**
```bash
# 프로젝트 루트에서
cd backend
python scripts/setup_database_complete.py
```

### **수동 설정 (고급 사용자)**
```bash
# Docker 컨테이너 시작
docker-compose up -d

# PostgreSQL 컨테이너에 연결
docker exec -it lotto_postgres psql -U lotto_user -d lotto_db

# 테이블 생성 (PostgreSQL 프롬프트에서)
\i scripts/init_database.sql
```

---

## 🖥️ **백엔드 서버 시작**

### **Docker 컨테이너로 시작 (권장)**
```bash
# 프로젝트 루트에서
docker-compose up -d

# 백엔드 로그 확인
docker logs lotto_backend -f
```

### **로컬에서 직접 시작**
```bash
# 백엔드 디렉토리에서
cd backend

# 서버 시작
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 또는 백그라운드에서
nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
```

### **서버 상태 확인**
```bash
# API 문서 접속
curl -s http://localhost:8000/docs | head -10

# 세션 관리 API 테스트
curl -s "http://localhost:8000/admin/sessions/" | head -5
```

---

## 🌐 **프론트엔드 확인**

### **프론트엔드 접속**
```bash
# 브라우저에서 접속
http://localhost:5173  # 메인 페이지
http://localhost:8000/docs  # API 문서
http://localhost:5173/admin  # 관리자 페이지
```

### **프론트엔드 개발 서버 시작**
```bash
# 프론트엔드 디렉토리에서
cd frontend

# 의존성 설치 (최초 1회)
npm install

# 개발 서버 시작
npm run dev
```

---

## 🚨 **문제 해결**

### **일반적인 문제들**

#### **1. Docker 데몬 연결 실패**
```bash
# Docker Desktop 실행 확인
open -a Docker

# Docker 상태 확인
docker ps

# Docker 재시작
docker system prune -a
docker-compose down
docker-compose up -d
```

#### **2. 포트 충돌**
```bash
# 8000번 포트 사용 중인 프로세스 확인
lsof -i :8000

# 프로세스 종료
kill -9 <PID>

# 또는 다른 포트 사용
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

#### **3. 데이터베이스 연결 실패**
```bash
# Docker 컨테이너 상태 확인
docker-compose ps

# PostgreSQL 컨테이너 로그 확인
docker logs lotto_postgres

# 컨테이너 재시작
docker restart lotto_postgres
```

#### **4. Python 모듈 import 오류**
```bash
# Python 경로 확인
python -c "import sys; print(sys.path)"

# 프로젝트 루트에서 실행
cd /Users/ip9202/develop/vibe/lotto
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 📊 **상태 확인 체크리스트**

### **환경 설정**
- [ ] Conda 환경 활성화 (`py3_12`)
- [ ] Python 패키지 설치 완료
- [ ] Docker Desktop 실행 중
- [ ] Docker 컨테이너 실행 중

### **데이터베이스**
- [ ] PostgreSQL 컨테이너 실행 중
- [ ] `user_sessions` 테이블 생성됨
- [ ] 외래키 제약조건 설정됨
- [ ] 기존 데이터 마이그레이션 완료

### **백엔드**
- [ ] FastAPI 서버 실행 중 (포트 8000)
- [ ] API 문서 접근 가능 (`/docs`)
- [ ] 세션 관리 API 정상 작동
- [ ] 데이터베이스 연결 정상

### **프론트엔드**
- [ ] React 개발 서버 실행 중 (포트 5173)
- [ ] 메인 페이지 접근 가능
- [ ] 관리자 페이지 접근 가능
- [ ] API 응답 정상

---

## 🔄 **재시작 절차**

### **전체 재시작**
```bash
# 1. 모든 서비스 중지
docker-compose down

# 2. Docker Desktop 재시작
open -a Docker
sleep 15

# 3. 서비스 재시작
docker-compose up -d

# 4. 백엔드 서버 시작
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### **백엔드만 재시작**
```bash
# 백엔드 컨테이너 재시작
docker restart lotto_backend

# 또는 로컬에서 직접
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 📚 **추가 리소스**

### **문서**
- [DATABASE_TROUBLESHOOTING.md](./DATABASE_TROUBLESHOOTING.md) - 데이터베이스 문제 해결
- [DEVELOPMENT_PROGRESS.md](./DEVELOPMENT_PROGRESS.md) - 개발 진행 상황
- [README.md](./README.md) - 프로젝트 개요

### **유용한 명령어**
```bash
# Docker 컨테이너 로그 실시간 확인
docker logs -f lotto_backend
docker logs -f lotto_postgres
docker logs -f lotto_frontend

# 데이터베이스 직접 접속
docker exec -it lotto_postgres psql -U lotto_user -d lotto_db

# 컨테이너 내부 파일 확인
docker exec -it lotto_backend ls -la /app
```

---

## 🎯 **결론**

이 가이드를 따라하면 LottoGenius 개발 환경을 성공적으로 설정할 수 있습니다.

**핵심 포인트**:
1. **순서 준수**: Conda → Docker → 데이터베이스 → 백엔드 → 프론트엔드
2. **포트 확인**: 8000번(백엔드), 5173번(프론트엔드), 5432번(PostgreSQL)
3. **로그 확인**: 문제 발생 시 각 서비스의 로그를 먼저 확인
4. **단계별 검증**: 각 단계 완료 후 반드시 상태 확인

문제가 발생하면 [DATABASE_TROUBLESHOOTING.md](./DATABASE_TROUBLESHOOTING.md)를 참고하세요.

---

**작성일**: 2025-08-29  
**작성자**: Claude  
**상태**: ✅ 완료
