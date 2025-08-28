# 🚨 LottoGenius 개발 환경 체크리스트

## ⚠️ **매번 개발 시작 전에 확인하세요!**

### 1. Conda 가상환경 활성화 ✅
```bash
# 반드시 실행!
conda activate py3_12

# 확인: 프롬프트 앞에 (py3_12) 표시되어야 함
(py3_12) ~/develop/vibe/lotto $
```

### 2. 가상환경 상태 확인 ✅
```bash
# 현재 활성화된 환경 확인
conda info --envs

# 환경 변수로 확인
echo $CONDA_DEFAULT_ENV

# Python 경로 확인
which python
# 결과: /Users/ip9202/opt/anaconda3/envs/py3_12/bin/python
```

### 3. 프로젝트 디렉토리 확인 ✅
```bash
# 올바른 디렉토리에 있는지 확인
pwd
# 결과: /Users/ip9202/develop/vibe/lotto

# 프로젝트 구조 확인
ls -la
# backend/, frontend/, docker-compose.yml 등이 보여야 함
```

### 4. Docker 서비스 상태 확인 ✅
```bash
# 컨테이너 상태 확인
docker-compose ps

# 백엔드 로그 확인
docker logs lotto_backend --tail 10

# 데이터베이스 연결 확인
docker logs lotto_postgres --tail 5
```

### 5. 개발 서버 실행 ✅
```bash
# 백엔드 (새 터미널)
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 프론트엔드 (새 터미널)
cd frontend
npm run dev
```

---

## 🚨 **자주 발생하는 문제들**

### 문제 1: "conda: command not found"
```bash
# 해결방법: conda 초기화
source ~/opt/anaconda3/etc/profile.d/conda.sh
conda activate py3_12
```

### 문제 2: 가상환경이 활성화되지 않음
```bash
# 해결방법: 수동 활성화
source ~/opt/anaconda3/envs/py3_12/bin/activate
```

### 문제 3: Python 패키지 import 오류
```bash
# 해결방법: 가상환경 재활성화
conda deactivate
conda activate py3_12
```

### 문제 4: Docker 컨테이너 오류
```bash
# 해결방법: 컨테이너 재시작
docker-compose down
docker-compose up -d
```

---

## 📝 **개발 시작 시 표준 워크플로우**

```bash
# 1. 터미널 열기
# 2. 가상환경 활성화
conda activate py3_12

# 3. 프로젝트 디렉토리로 이동
cd ~/develop/vibe/lotto

# 4. 환경 상태 확인
conda info --envs
docker-compose ps

# 5. 개발 시작! 🚀
```

---

## 🔍 **문제 해결 시 확인할 것들**

1. **가상환경이 활성화되었는가?** `(py3_12)` 표시 확인
2. **올바른 디렉토리에 있는가?** `pwd` 명령어로 확인
3. **Docker가 실행 중인가?** `docker ps` 명령어로 확인
4. **포트가 사용 가능한가?** `lsof -i :8000` 명령어로 확인

---

**💡 팁: 터미널 프로필에 conda activate py3_12를 자동으로 추가하면 더 편리합니다!**
