# 🚂 Railway에서 lottoria.ai.kr 도메인 설정하기

## 📋 현재 상황
- 도메인: **lottoria.ai.kr** 구입 완료 ✅
- Railway 프로젝트: 배포 완료 ✅
- 목표: 커스텀 도메인 연결 🎯

## 🔧 Railway 설정 단계별 가이드

### 1단계: Railway 대시보드 접속
```
1. https://railway.app 로그인
2. LottoGenius 프로젝트 클릭
3. 현재 서비스 확인:
   - Frontend: lotto-frontend-production-xxxx.up.railway.app
   - Backend: lotto-backend-production-xxxx.up.railway.app
```

### 2단계: Frontend 서비스에 도메인 추가
```
1. Frontend 서비스 클릭
2. Settings 탭 → Domains 섹션
3. "Add Domain" 클릭
4. 도메인 입력:
   - lottoria.ai.kr
   - www.lottoria.ai.kr
5. Save 클릭
```

### 3단계: Backend 서비스에 API 도메인 추가
```
1. Backend 서비스 클릭  
2. Settings 탭 → Domains 섹션
3. "Add Domain" 클릭
4. 도메인 입력:
   - api.lottoria.ai.kr
5. Save 클릭
```

### 4단계: Railway 환경 변수 업데이트

**Frontend 서비스 환경 변수**:
```bash
Variables 탭에서 추가/수정:

VITE_API_URL=https://api.lottoria.ai.kr
```

**Backend 서비스 환경 변수**:
```bash
Variables 탭에서 추가/수정:

CORS_ORIGINS=https://lottoria.ai.kr,https://www.lottoria.ai.kr,http://localhost:5173
DATABASE_URL=(기존 PostgreSQL URL 유지)
```

## 🌐 DNS 설정 (도메인 업체에서)

### 가비아/호스팅케이알 등에서 설정
```dns
DNS 관리 → 레코드 추가:

Type: CNAME
Name: @
Value: lotto-frontend-production-xxxx.up.railway.app

Type: CNAME
Name: www  
Value: lotto-frontend-production-xxxx.up.railway.app

Type: CNAME
Name: api
Value: lotto-backend-production-xxxx.up.railway.app
```

**중요**: `xxxx` 부분은 실제 Railway URL로 교체하세요!

## 📱 현재 Railway URL 확인 방법
```
Railway 대시보드에서:
1. Frontend 서비스 → Settings → Domains
2. 현재 URL 복사: lotto-frontend-production-c563.up.railway.app
3. Backend 서비스 → Settings → Domains  
4. 현재 URL 복사: lotto-backend-production-e7f6.up.railway.app
```

## 🔄 배포 후 확인사항

### SSL 인증서 자동 발급 확인
```
Railway에서 도메인 추가 후 5-10분 대기
자동으로 SSL 인증서 발급됨
```

### 테스트 진행
```bash
# 1. 메인 사이트
https://lottoria.ai.kr

# 2. www 리다이렉트
https://www.lottoria.ai.kr

# 3. API 테스트  
https://api.lottoria.ai.kr/docs

# 4. 헬스체크
https://api.lottoria.ai.kr/health
```

## 🚨 문제 해결

### DNS 전파 대기
```
DNS 변경 후 최대 24시간 소요
실시간 확인: https://dnschecker.org
```

### Railway 빌드 오류 시
```
1. Railway 대시보드 → Logs 확인
2. 환경 변수 재확인
3. 다시 배포: git push origin main
```

### CORS 오류 시
```
1. Backend 환경 변수 확인
2. CORS_ORIGINS 값 재확인
3. 브라우저 캐시 제거
```

## 📋 최종 체크리스트

### Railway 설정 ✅
- [ ] Frontend 도메인 추가 (lottoria.ai.kr, www.lottoria.ai.kr)
- [ ] Backend 도메인 추가 (api.lottoria.ai.kr)
- [ ] Frontend 환경 변수 VITE_API_URL 설정
- [ ] Backend 환경 변수 CORS_ORIGINS 설정

### DNS 설정 ✅  
- [ ] @ 레코드 → Frontend Railway URL
- [ ] www 레코드 → Frontend Railway URL
- [ ] api 레코드 → Backend Railway URL
- [ ] DNS 전파 확인

### 코드 배포 ✅
- [ ] Git 커밋 및 푸시
- [ ] Railway 자동 배포 완료
- [ ] 빌드 로그 정상 확인

### 기능 테스트 ✅
- [ ] https://lottoria.ai.kr 접속 성공
- [ ] 번호 추천 기능 동작
- [ ] 기록 보기 기능 동작  
- [ ] API 호출 정상

## 🎯 완료!

모든 설정이 완료되면 **https://lottoria.ai.kr**에서 서비스 이용 가능!

---

**Railway 현재 URL 예시**:
- Frontend: `lotto-frontend-production-c563.up.railway.app`
- Backend: `lotto-backend-production-e7f6.up.railway.app`

**반드시 실제 URL로 교체하여 DNS 설정하세요!** 🚀
