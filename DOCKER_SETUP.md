# 🐳 Docker 설정 완벽 가이드

## 📋 개요
이 문서는 로또리아 AI 프로젝트를 Docker로 실행하기 위한 완벽한 설정 가이드입니다. Docker를 처음 사용하는 분도 쉽게 따라할 수 있도록 상세히 설명합니다.

## 🎯 Docker란?
Docker는 애플리케이션을 컨테이너라는 가벼운 패키지로 만들어서 어디서든 동일하게 실행할 수 있게 해주는 기술입니다. 
- **장점**: 설치가 간단하고, 환경 설정이 자동화됨
- **단점**: 처음 설치할 때 시간이 걸림

## 🚀 1단계: Docker Desktop 설치

### Windows 사용자
1. **Docker Desktop for Windows 다운로드**
   - https://www.docker.com/products/docker-desktop/
   - "Download for Windows" 클릭

2. **설치 파일 실행**
   - 다운로드된 `Docker Desktop Installer.exe` 실행
   - "Use WSL 2 instead of Hyper-V" 옵션 체크 (권장)
   - 설치 완료 후 재부팅

3. **Docker Desktop 실행**
   - 시작 메뉴에서 "Docker Desktop" 검색 후 실행
   - 시스템 트레이에 Docker 아이콘이 나타나면 성공

### macOS 사용자
1. **Docker Desktop for Mac 다운로드**
   - https://www.docker.com/products/docker-desktop/
   - "Download for Mac" 클릭

2. **설치 파일 실행**
   - 다운로드된 `Docker.dmg` 파일 실행
   - Docker.app을 Applications 폴더로 드래그
   - Applications 폴더에서 Docker.app 실행

3. **Docker Desktop 실행**
   - Launchpad에서 Docker 검색 후 실행
   - 메뉴 바에 Docker 아이콘이 나타나면 성공

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

# 재로그인 후 테스트
docker --version
```

## 🔍 2단계: Docker 설치 확인

### 터미널/명령 프롬프트 열기
- **Windows**: `Win + R` → `cmd` 입력 → Enter
- **macOS**: `Cmd + Space` → "터미널" 검색 → Enter
- **Linux**: `Ctrl + Alt + T`

### Docker 버전 확인
```bash
docker --version
# 결과: Docker version 24.x.x, build xxxxx

docker-compose --version
# 결과: docker-compose version 2.x.x
```

### Docker 서비스 상태 확인
```bash
docker ps
# 결과: 빈 테이블이 표시되면 정상 (아직 컨테이너가 없음)
```

## 📁 3단계: 프로젝트 다운로드

### Git이 설치된 경우
```bash
# 프로젝트 클론
git clone https://github.com/your-username/lotto.git
cd lotto
```

### Git이 없는 경우
1. **GitHub에서 ZIP 다운로드**
   - https://github.com/your-username/lotto
   - "Code" → "Download ZIP" 클릭

2. **압축 해제**
   - 다운로드된 `lotto-main.zip` 파일 압축 해제
   - 원하는 폴더에 압축 해제

3. **폴더로 이동**
   ```bash
   cd lotto-main
   ```

## 🚀 4단계: Docker 서비스 시작

### 모든 서비스 한 번에 시작
```bash
# Docker Compose로 모든 서비스 시작
docker-compose up -d

# 시작 상태 확인
docker-compose ps
```

### 예상 결과
```
NAME                IMAGE                    COMMAND                  SERVICE             CREATED             STATUS              PORTS
lotto_postgres      postgres:15             "docker-entrypoint.s…"   postgres           2 minutes ago       Up 2 minutes        0.0.0.0:5432->5432/tcp
lotto_backend       lotto_backend           "uvicorn app.main:ap…"   backend            2 minutes ago       Up 2 minutes        0.0.0.0:8000->8000/tcp
lotto_frontend      lotto_frontend          "npm run dev"            frontend           2 minutes ago       Up 2 minutes        0.0.0.0:5173->5173/tcp
```

## 🌐 5단계: 서비스 접속 테스트

### 프론트엔드 접속
1. **브라우저 열기**
2. **주소창에 입력**: `http://localhost:5173`
3. **예상 결과**: 로또리아 AI 메인 페이지 표시

### 백엔드 API 접속
1. **브라우저 새 탭 열기**
2. **주소창에 입력**: `http://localhost:8000/docs`
3. **예상 결과**: Swagger UI API 문서 표시

### 관리자 페이지 접속
1. **브라우저 새 탭 열기**
2. **주소창에 입력**: `http://localhost:5173/admin`
3. **예상 결과**: 관리자 로그인 페이지 표시

## 🚨 문제 해결

### 문제 1: Docker Desktop이 실행되지 않음
**증상**: `docker ps` 명령어 실행 시 오류 발생
**해결방법**:
1. Docker Desktop 재시작
2. 시스템 재부팅
3. Docker Desktop 재설치

### 문제 2: 포트 충돌
**증상**: 컨테이너가 시작되지 않거나 "port already in use" 오류
**해결방법**:
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

### 문제 3: 컨테이너가 시작되지 않음
**증상**: `docker-compose ps`에서 컨테이너 상태가 "Exited"
**해결방법**:
```bash
# 컨테이너 재시작
docker-compose down
docker-compose up -d

# 로그 확인
docker logs lotto_postgres
docker logs lotto_backend
docker logs lotto_frontend
```

### 문제 4: 데이터베이스 연결 실패
**증상**: 백엔드에서 데이터베이스 연결 오류
**해결방법**:
```bash
# PostgreSQL 컨테이너 상태 확인
docker ps | grep postgres

# PostgreSQL 로그 확인
docker logs lotto_postgres

# 데이터베이스 연결 테스트
docker exec lotto_postgres psql -U lotto_user -d lotto_db -c "SELECT COUNT(*) FROM lotto_draws;"
```

## 🔧 고급 설정

### Docker 리소스 설정
**Docker Desktop → Settings → Resources**
- **Memory**: 최소 4GB 권장
- **CPUs**: 최소 2개 권장
- **Disk**: 최소 20GB 여유 공간

### 환경 변수 설정
```bash
# .env 파일 생성 (선택사항)
cp .env.example .env

# 환경 변수 수정
nano .env
```

### 로그 확인
```bash
# 실시간 로그 확인
docker-compose logs -f

# 특정 서비스 로그 확인
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

## 📝 개발 워크플로우

### 1. 개발 시작
```bash
# 1. Docker Desktop 실행 확인
docker ps

# 2. 프로젝트 디렉토리로 이동
cd lotto

# 3. 서비스 시작
docker-compose up -d

# 4. 개발 시작! 🚀
```

### 2. 코드 수정
- 파일을 수정하면 Docker 컨테이너가 자동으로 변경사항을 감지
- 브라우저에서 `http://localhost:5173` 접속하여 확인

### 3. 서비스 중지
```bash
# 모든 서비스 중지
docker-compose down

# 데이터까지 삭제 (주의!)
docker-compose down -v
```

### 4. 서비스 재시작
```bash
# 서비스 재시작
docker-compose restart

# 특정 서비스만 재시작
docker-compose restart backend
```

## 💡 팁과 트릭

### Docker 명령어 단축키
```bash
# 자주 사용하는 명령어들
alias dps='docker ps'
alias dcu='docker-compose up -d'
alias dcd='docker-compose down'
alias dcl='docker-compose logs -f'
```

### 브라우저 북마크
- `http://localhost:5173` - 프론트엔드
- `http://localhost:8000/docs` - API 문서
- `http://localhost:5173/admin` - 관리자

### 시스템 시작 시 Docker 자동 실행
- **Windows**: Docker Desktop 설정에서 "Start Docker Desktop when you log in" 체크
- **macOS**: Docker Desktop 설정에서 "Start Docker Desktop when you log in" 체크

## 🎉 성공 확인

모든 단계가 완료되면 다음이 정상 작동해야 합니다:

1. ✅ **Docker Desktop 실행 중**
2. ✅ **3개 컨테이너 모두 실행 중**
3. ✅ **프론트엔드 접속 가능** (http://localhost:5173)
4. ✅ **백엔드 API 접속 가능** (http://localhost:8000/docs)
5. ✅ **관리자 페이지 접속 가능** (http://localhost:5173/admin)

---

**💡 결론: Docker Desktop만 설치하면 바로 개발 시작 가능!**

**마지막 업데이트**: 2025년 1월 26일  
**상태**: 🐳 **Docker 설정 가이드 완성**  
**다음 단계**: 🚀 **개발 시작**
