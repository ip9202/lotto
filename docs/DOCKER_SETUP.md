# 🐳 Docker 설정 가이드

## 📋 개요
이 문서는 로또리아 AI 프로젝트를 Docker로 실행하기 위한 설정 가이드입니다.

## 🚀 Docker Desktop 설치

### Windows 사용자
1. **Docker Desktop 다운로드**: https://www.docker.com/products/docker-desktop/
2. **설치 파일 실행**: `Docker Desktop Installer.exe` 실행
3. **WSL 2 옵션 체크** (권장)
4. **설치 완료 후 재부팅**

### macOS 사용자
1. **Docker Desktop 다운로드**: https://www.docker.com/products/docker-desktop/
2. **DMG 파일 실행**: `Docker.dmg` 파일 실행
3. **Applications 폴더로 드래그**: Docker.app을 Applications 폴더로 이동

### Linux 사용자 (Ubuntu/Debian)
```bash
# Docker 설치
sudo apt update
sudo apt install docker.io docker-compose

# Docker 서비스 시작
sudo systemctl start docker
sudo systemctl enable docker

# 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER
```

## ✅ 설치 확인

```bash
# Docker 버전 확인
docker --version
# 결과: Docker version 24.x.x

# Docker Compose 버전 확인
docker-compose --version
# 결과: docker-compose version 2.x.x

# Docker 서비스 상태 확인
docker ps
# 결과: 빈 테이블이 표시되면 정상
```

## 🔧 프로젝트 실행

```bash
# 프로젝트 디렉토리로 이동
cd lotto

# 모든 서비스 시작
docker-compose up -d

# 서비스 상태 확인
docker-compose ps
```

### 예상 결과
```
NAME                IMAGE                    STATUS              PORTS
lotto_postgres      postgres:15             Up                  0.0.0.0:5432->5432/tcp
lotto_backend       lotto_backend           Up                  0.0.0.0:8000->8000/tcp
lotto_frontend      lotto_frontend          Up                  0.0.0.0:5173->5173/tcp
```

## 🌐 서비스 접속

- **프론트엔드**: http://localhost:5173
- **백엔드 API**: http://localhost:8000/docs
- **관리자**: http://localhost:5173/admin

## 🚨 문제 해결

### Docker Desktop이 실행되지 않음
1. Docker Desktop 재시작
2. 시스템 재부팅
3. Docker Desktop 재설치

### 포트 충돌
```bash
# 포트 사용 현황 확인
lsof -i :5432  # PostgreSQL
lsof -i :8000  # Backend
lsof -i :5173  # Frontend

# 컨테이너 재시작
docker-compose down && docker-compose up -d
```

### 컨테이너가 시작되지 않음
```bash
# 로그 확인
docker-compose logs -f [service_name]

# 컨테이너 재시작
docker-compose down
docker-compose up -d
```

## 🔧 유용한 명령어

```bash
# 실시간 로그 확인
docker-compose logs -f

# 특정 서비스 로그 확인
docker-compose logs -f backend

# 서비스 재시작
docker-compose restart

# 서비스 중지
docker-compose down

# 데이터까지 삭제 (주의!)
docker-compose down -v
```

## 💡 팁

### Docker 리소스 설정
**Docker Desktop → Settings → Resources**
- **Memory**: 최소 4GB 권장
- **CPUs**: 최소 2개 권장
- **Disk**: 최소 20GB 여유 공간

### 자동 시작 설정
- **Windows/macOS**: Docker Desktop 설정에서 "Start Docker Desktop when you log in" 체크

---

**💡 Docker Desktop만 설치하면 바로 개발 시작 가능!**