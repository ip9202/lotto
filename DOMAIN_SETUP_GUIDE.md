# 🌐 lottoria.ai.kr 도메인 설정 가이드

## 📋 개요
lottoria.ai.kr 도메인을 Railway 배포 서비스에 연결하기 위한 완전한 가이드입니다.

## 🚀 1단계: Railway 프로젝트 설정

### Railway에서 커스텀 도메인 설정

1. **Railway 대시보드** 접속
   - [railway.app](https://railway.app) 로그인
   - LottoGenius 프로젝트 선택

2. **Frontend 서비스에 도메인 추가**
   ```
   Frontend 서비스 → Settings → Custom Domain
   - Add Domain: lottoria.ai.kr
   - Add Domain: www.lottoria.ai.kr
   ```

3. **Backend 서비스에 API 도메인 추가**
   ```
   Backend 서비스 → Settings → Custom Domain
   - Add Domain: api.lottoria.ai.kr
   ```

## 🔧 2단계: DNS 설정

### 도메인 업체에서 DNS 레코드 추가

구입하신 도메인 업체(가비아, 호스팅케이알 등)의 DNS 관리 페이지에서:

```dns
# A 레코드 또는 CNAME 레코드 추가
Type: CNAME
Name: @
Value: <railway-frontend-url>.up.railway.app

Type: CNAME  
Name: www
Value: <railway-frontend-url>.up.railway.app

Type: CNAME
Name: api
Value: <railway-backend-url>.up.railway.app
```

**주의**: `<railway-frontend-url>`과 `<railway-backend-url>`은 Railway에서 제공하는 실제 URL로 교체하세요.

## ⚙️ 3단계: 환경 변수 업데이트

### Railway Frontend 환경 변수

```bash
# Railway Frontend 서비스 → Variables
VITE_API_URL=https://api.lottoria.ai.kr
```

### Railway Backend 환경 변수

```bash
# Railway Backend 서비스 → Variables
CORS_ORIGINS=https://lottoria.ai.kr,https://www.lottoria.ai.kr
DATABASE_URL=<railway-postgresql-url>
```

## 🔄 4단계: 코드 수정

### Frontend 설정 업데이트

**frontend/vite.config.ts** 수정:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true
    },
    allowedHosts: [
      'localhost',
      'lottoria.ai.kr',
      'www.lottoria.ai.kr',
      '.up.railway.app'
    ]
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

### Backend CORS 설정 업데이트

**backend/app/main.py** CORS 부분 수정:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # 로컬 개발
        "https://lottoria.ai.kr",  # 메인 도메인
        "https://www.lottoria.ai.kr",  # www 도메인
        "*"  # 임시로 모든 도메인 허용 (나중에 제거)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🚨 5단계: SSL 인증서 자동 설정

Railway는 커스텀 도메인에 대해 **자동으로 SSL 인증서**를 발급합니다.
- 도메인 추가 후 몇 분 내에 자동 설정됨
- https://lottoria.ai.kr로 접근 가능

## 📋 6단계: 배포 및 테스트

### 코드 배포
```bash
# 로컬에서 변경사항 커밋
git add .
git commit -m "🌐 lottoria.ai.kr 도메인 설정 적용"
git push origin main

# Railway가 자동으로 배포
```

### 테스트 확인
```bash
# 1. 메인 사이트 접근
https://lottoria.ai.kr

# 2. www 도메인 접근  
https://www.lottoria.ai.kr

# 3. API 테스트
https://api.lottoria.ai.kr/docs

# 4. 기능 테스트
- 번호 추천 기능
- 기록 보기 기능
- 관리자 기능
```

## 🔍 7단계: 문제 해결

### DNS 전파 확인
```bash
# DNS 전파 상태 확인 (온라인 도구)
https://dnschecker.org

# 검색: lottoria.ai.kr
```

### SSL 인증서 확인
```bash
# 브라우저에서 자물쇠 아이콘 클릭
# 인증서 정보 확인
```

### Railway 로그 확인
```bash
# Railway 대시보드에서
Frontend 서비스 → Logs
Backend 서비스 → Logs
```

## 📊 8단계: 성능 최적화

### CDN 설정 (선택사항)
- Cloudflare 무료 플랜 연동
- 전 세계 빠른 접속 속도

### 모니터링 설정
- Railway 메트릭스 확인
- 사용량 모니터링

## 🎯 체크리스트

### DNS 설정 완료 확인
- [ ] A/CNAME 레코드 추가 완료
- [ ] DNS 전파 확인 (최대 24시간)
- [ ] ping lottoria.ai.kr 응답 확인

### Railway 설정 완료 확인  
- [ ] Frontend 커스텀 도메인 추가
- [ ] Backend API 커스텀 도메인 추가
- [ ] 환경 변수 업데이트
- [ ] SSL 인증서 발급 확인

### 코드 업데이트 완료 확인
- [ ] vite.config.ts allowedHosts 추가
- [ ] main.py CORS origins 추가
- [ ] 코드 커밋 및 푸시
- [ ] Railway 자동 배포 확인

### 기능 테스트 완료 확인
- [ ] https://lottoria.ai.kr 접속 확인
- [ ] 번호 추천 기능 동작 확인
- [ ] 기록 보기 기능 동작 확인
- [ ] API 호출 정상 동작 확인

## 🚀 완료!

모든 설정이 완료되면 **https://lottoria.ai.kr**에서 LottoGenius를 이용하실 수 있습니다!

---

**마지막 업데이트**: 2024년 12월  
**상태**: 🌐 **도메인 설정 가이드**  
**다음 단계**: 🎯 **실서버 배포 완료**
