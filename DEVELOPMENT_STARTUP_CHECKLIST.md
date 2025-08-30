# 🚀 개발 시작 전 필수 체크리스트

## 📋 개요
LottoGenius 프로젝트 개발을 시작하기 전에 반드시 확인해야 할 사항들을 정리한 문서입니다.
**이 체크리스트를 완료하지 않고 개발을 시작하면 안 됩니다!**

---

## ⚠️ 중요: 개발 시작 전 필수 확인사항

### 🔴 1단계: 가상환경 확인 (가장 중요!)

#### ✅ Conda 가상환경 활성화
```bash
# 현재 가상환경 확인
conda info --envs

# 올바른 가상환경 활성화 (py3_12)
conda activate py3_12

# 활성화 확인
echo $CONDA_DEFAULT_ENV
# 결과가 "py3_12"여야 함!
```

**❌ 잘못된 상황:**
- `base` 환경 사용 중
- 가상환경이 활성화되지 않음
- `py3_12` 환경이 아닌 다른 환경 사용

**✅ 올바른 상황:**
- `(py3_12)` 프롬프트 표시
- `echo $CONDA_DEFAULT_ENV` 결과가 "py3_12"

---

### 🔴 2단계: Docker 서비스 상태 확인

#### ✅ Docker 컨테이너 실행 상태
```bash
# 실행 중인 컨테이너 확인
docker ps

# 필수 컨테이너들:
# ✅ lotto_postgres (PostgreSQL)
# ✅ lotto_backend (Backend API)
# ✅ lotto_frontend (Frontend)
```

**❌ 문제 상황:**
- 컨테이너가 실행되지 않음
- 컨테이너 상태가 "unhealthy"
- 필요한 컨테이너가 누락됨

**✅ 해결 방법:**
```bash
# Docker 서비스 시작
docker-compose up -d

# 상태 확인
docker-compose ps
```

---

### 🔴 3단계: 포트 사용 현황 확인

#### ✅ 포트 충돌 방지
```bash
# 현재 사용 중인 포트 확인
lsof -i :5432  # PostgreSQL
lsof -i :8000  # Backend
lsof -i :5173  # Frontend Docker

# 포트가 사용 중이지 않아야 함 (Docker 컨테이너 제외)
```

**❌ 문제 상황:**
- 5432, 8000, 5173 포트가 다른 프로세스에서 사용 중
- 로컬 서비스와 Docker 서비스가 동시 실행

**✅ 해결 방법:**
```bash
# 충돌하는 프로세스 종료
pkill -f "npm run dev"  # 로컬 Frontend
pkill -f "uvicorn"      # 로컬 Backend
pkill -f "postgres"     # 로컬 PostgreSQL
```

---

### 🔴 4단계: 서비스 접속 테스트

#### ✅ 각 서비스 정상 작동 확인
```bash
# 1. PostgreSQL 연결 테스트
docker exec lotto_postgres psql -U lotto_user -d lotto_db -c "SELECT COUNT(*) FROM lotto_draws;"
# 결과: 1186 (또는 다른 숫자)

# 2. Backend API 테스트
curl http://localhost:8000/docs
# 결과: Swagger UI 페이지 표시

# 3. Frontend 접속 테스트
# 브라우저에서 http://localhost:5173 접속
# 결과: LottoGenius 메인 페이지 표시
```

**❌ 문제 상황:**
- PostgreSQL 연결 실패
- Backend API 응답 없음
- Frontend 페이지 로딩 안됨

---

### 🔴 5단계: 개발 환경 설정 확인

#### ✅ 프로젝트 구조 및 설정
```bash
# 1. 현재 디렉토리 확인
pwd
# 결과: /Users/ip9202/develop/vibe/lotto

# 2. Git 브랜치 확인
git branch
# 결과: 현재 작업 중인 브랜치 표시

# 3. 환경변수 파일 확인
ls -la .env*
# 결과: .env.local 또는 .env 파일 존재
```

---

## 🚨 개발 시작 금지 상황

### ❌ 절대 개발을 시작하면 안 되는 경우:

1. **가상환경이 `base`인 경우**
   - `conda activate py3_12` 실행 필요

2. **Docker 컨테이너가 실행되지 않은 경우**
   - `docker-compose up -d` 실행 필요

3. **포트 충돌이 발생한 경우**
   - 충돌하는 프로세스 종료 필요

4. **PostgreSQL 연결이 안 되는 경우**
   - Docker 컨테이너 상태 확인 필요

5. **Git 브랜치가 잘못된 경우**
   - 올바른 브랜치로 체크아웃 필요

---

## ✅ 개발 시작 승인 체크리스트

### 🟢 모든 항목을 확인하고 체크하세요:

- [ ] **가상환경**: `(py3_12)` 프롬프트 표시
- [ ] **PostgreSQL**: Docker 컨테이너 실행 중, 연결 테스트 성공
- [ ] **Backend**: Docker 컨테이너 실행 중, API 응답 정상
- [ ] **Frontend**: Docker 컨테이너 실행 중, 페이지 로딩 정상
- [ ] **포트**: 5432, 8000, 5173 포트 충돌 없음
- [ ] **Git**: 올바른 브랜치에서 작업 중
- [ ] **디렉토리**: `/Users/ip9202/develop/vibe/lotto` 위치

---

## 🚀 개발 시작 승인 후 작업 순서

### 1. 코드 수정 시작
```bash
# 파일 수정
code frontend/src/pages/Recommendation.tsx
```

### 2. 변경사항 확인
```bash
# Git 상태 확인
git status

# 변경사항 스테이징
git add .
```

### 3. 테스트 및 커밋
```bash
# 로컬 테스트
# 브라우저에서 http://localhost:5173 접속하여 확인

# 커밋
git commit -m "✨ 기능 추가: 탭 기반 추천 시스템"

# 푸시
git push origin feature/tab-based-recommendation
```

---

## 🆘 문제 발생 시 대처 방법

### PostgreSQL 연결 실패
```bash
# 컨테이너 상태 확인
docker ps | grep postgres

# 컨테이너 재시작
docker restart lotto_postgres

# 로그 확인
docker logs lotto_postgres
```

### Backend API 응답 없음
```bash
# 컨테이너 상태 확인
docker ps | grep backend

# 컨테이너 재시작
docker restart lotto_backend

# 로그 확인
docker logs lotto_backend
```

### Frontend 페이지 로딩 안됨
```bash
# 컨테이너 상태 확인
docker ps | grep frontend

# 컨테이너 재시작
docker restart lotto_frontend

# 로그 확인
docker logs lotto_frontend
```

---

## 📞 긴급 상황 연락처

### 문제가 지속되는 경우:
1. **Docker 컨테이너 전체 재시작**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

2. **시스템 재부팅**
   - Docker Desktop 재시작
   - 터미널 재시작

3. **개발팀 문의**
   - 현재 상황 스크린샷 첨부
   - 에러 로그 첨부

---

## 🎯 핵심 요약

**개발 시작 전 필수 확인사항:**
1. **가상환경**: `py3_12` 환경 활성화 ✅
2. **Docker**: 모든 컨테이너 실행 중 ✅
3. **포트**: 충돌 없음 ✅
4. **서비스**: 정상 작동 ✅
5. **Git**: 올바른 브랜치 ✅

**이 체크리스트를 완료하지 않고 개발을 시작하면 안 됩니다!** 🚨

---

*마지막 업데이트: 2024년 12월*
*작성자: LottoGenius 개발팀*
*목적: 개발 시작 전 필수 확인사항 체크*
