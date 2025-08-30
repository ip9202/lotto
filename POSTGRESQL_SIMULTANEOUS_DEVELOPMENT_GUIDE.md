# 🚨 PostgreSQL 동시 개발 시 주의사항 가이드

## 📋 개요
현재 LottoGenius 프로젝트와 새로운 서비스를 동시에 개발할 때, PostgreSQL 충돌을 방지하기 위한 주의사항들을 정리한 문서입니다.

---

## ⚠️ 주요 충돌 위험 요소

### 1. 포트 충돌 (가장 위험!)
```bash
# 현재 LottoGenius 프로젝트 사용 포트
- PostgreSQL: 5432번 포트 사용 중
- Backend: 8000번 포트 사용 중  
- Frontend: 5174번 포트 사용 중 (로컬 개발)
- Frontend Docker: 5173번 포트 사용 중 (컨테이너)

# ⚠️ 새로운 서비스에서 주의할 점
- PostgreSQL 포트를 5432로 설정하면 즉시 충돌 발생!
- 반드시 다른 포트 사용 필요 (예: 5433, 5434, 5435 등)
```

### 2. 데이터베이스 이름 충돌
```bash
# 현재 LottoGenius 설정
- 데이터베이스명: lotto_db
- 사용자명: lotto_user
- 비밀번호: lotto_password

# ⚠️ 새로운 서비스
- 다른 데이터베이스명 사용 필수 (예: newservice_db, project2_db)
- 다른 사용자명 사용 필수 (예: newservice_user, project2_user)
```

### 3. Docker 컨테이너 이름 충돌
```bash
# 현재 실행 중인 컨테이너들
- lotto_postgres
- lotto_backend
- lotto_frontend

# ⚠️ 새로운 서비스
- 다른 컨테이너명 사용 필수 (예: newservice_postgres, project2_postgres)
```

### 4. 환경변수 충돌
```bash
# 현재 사용 중인 환경변수
- DATABASE_URL
- POSTGRES_DB
- POSTGRES_USER
- POSTGRES_PASSWORD

# ⚠️ 새로운 서비스
- 다른 환경변수명 사용하거나
- 프로젝트별로 prefix 추가 필수
```

---

## ✅ 해결 방법

### 방법 1: 다른 포트 사용 (권장)
```yaml
# docker-compose.yml (새로운 서비스)
services:
  postgres:
    image: postgres:15
    container_name: newservice_postgres  # 다른 컨테이너명
    environment:
      POSTGRES_DB: newservice_db         # 다른 DB명
      POSTGRES_USER: newservice_user     # 다른 사용자명
      POSTGRES_PASSWORD: newservice_pass # 다른 비밀번호
    ports:
      - "5433:5432"  # 호스트 포트를 5433으로 변경
```

### 방법 2: 프로젝트별 네트워크 분리
```yaml
# docker-compose.yml
networks:
  newservice_network:
    name: newservice_network

services:
  postgres:
    networks:
      - newservice_network
    # ... 기타 설정
```

### 방법 3: 프로젝트별 환경변수 prefix
```bash
# .env 파일 (새로운 서비스)
NEWSERVICE_DATABASE_URL=postgresql://newservice_user:newservice_pass@localhost:5433/newservice_db
NEWSERVICE_POSTGRES_DB=newservice_db
NEWSERVICE_POSTGRES_USER=newservice_user
NEWSERVICE_POSTGRES_PASSWORD=newservice_pass
```

---

## 🔍 현재 상태 확인 명령어

### 포트 사용 현황 확인
```bash
# PostgreSQL 포트 확인
lsof -i :5432

# Backend 포트 확인  
lsof -i :8000

# Frontend 포트 확인
lsof -i :5174  # 로컬 개발 서버
lsof -i :5173  # Docker 컨테이너

# 모든 포트 확인
netstat -tulpn | grep LISTEN
```

### Docker 상태 확인
```bash
# 실행 중인 컨테이너 확인
docker ps

# Docker 네트워크 확인
docker network ls

# 특정 컨테이너 로그 확인
docker logs lotto_postgres
```

---

## 📋 Claude Code에게 전달할 체크리스트

### 새로운 서비스 개발 시 필수 확인사항

#### 1. 포트 설정 ✅
- [ ] PostgreSQL 포트: 5432 대신 5433, 5434 등 사용
- [ ] Backend 포트: 8000 대신 8001, 8002 등 사용  
- [ ] Frontend 포트: 5174, 5173 대신 5175, 5176 등 사용

#### 2. 데이터베이스 설정 ✅
- [ ] 데이터베이스명: lotto_db 대신 다른 이름 사용
- [ ] 사용자명: lotto_user 대신 다른 이름 사용
- [ ] 비밀번호: lotto_password 대신 다른 비밀번호 사용

#### 3. Docker 설정 ✅
- [ ] 컨테이너명: lotto_ 접두사 대신 다른 접두사 사용
- [ ] 네트워크: 별도 Docker 네트워크 사용
- [ ] 볼륨: 프로젝트별 고유 볼륨명 사용

#### 4. 환경변수 설정 ✅
- [ ] 프로젝트별 prefix 추가 (예: NEWSERVICE_, PROJECT2_)
- [ ] DATABASE_URL 충돌 방지
- [ ] 기타 환경변수명 충돌 방지

---

## 🚀 권장 설정 예시

### 새로운 서비스 A
```yaml
# 포트: 5433, 8001, 5174
# DB: servicea_db, 사용자: servicea_user
# 컨테이너: servicea_postgres, servicea_backend, servicea_frontend
```

### 새로운 서비스 B  
```yaml
# 포트: 5434, 8002, 5175
# DB: serviceb_db, 사용자: serviceb_user
# 컨테이너: serviceb_postgres, serviceb_backend, serviceb_frontend
```

---

## ⚡ 빠른 확인 스크립트

```bash
#!/bin/bash
echo "🔍 PostgreSQL 동시 개발 충돌 확인 스크립트"

echo "📊 현재 사용 중인 포트:"
lsof -i :5432 | grep LISTEN
lsof -i :8000 | grep LISTEN  
lsof -i :5174 | grep LISTEN  # 로컬 개발 서버
lsof -i :5173 | grep LISTEN  # Docker 컨테이너

echo "🐳 현재 실행 중인 Docker 컨테이너:"
docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"

echo "🌐 현재 Docker 네트워크:"
docker network ls

echo "✅ 충돌이 없다면 위 명령어들이 정상적으로 실행됩니다!"
```

---

## 📞 문제 발생 시 대처 방법

### 1. 포트 충돌 발생 시
```bash
# 충돌하는 프로세스 확인
lsof -i :5432

# 프로세스 종료 (필요시)
kill -9 [PID]

# 또는 Docker 컨테이너 중지
docker stop lotto_postgres
```

### 2. 데이터베이스 연결 실패 시
```bash
# PostgreSQL 컨테이너 상태 확인
docker ps | grep postgres

# 로그 확인
docker logs [container_name]

# 컨테이너 재시작
docker restart [container_name]
```

---

## 🎯 핵심 요약

**PostgreSQL 동시 개발 시 가장 중요한 것:**
1. **포트 번호 다르게 설정** (5432 → 5433, 5434 등)
2. **데이터베이스명 다르게 설정** (lotto_db → newservice_db)
3. **사용자명 다르게 설정** (lotto_user → newservice_user)
4. **컨테이너명 다르게 설정** (lotto_ → newservice_)
5. **환경변수 prefix 추가** (NEWSERVICE_, PROJECT2_)

**이렇게 하면 두 프로젝트가 서로 충돌하지 않고 안전하게 개발할 수 있습니다!** 🎉

---

*마지막 업데이트: 2024년 12월*
*작성자: LottoGenius 개발팀*
