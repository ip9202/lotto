# 회차별 저장 한도 리셋 문제 해결 요청

## 🚨 **현재 상황**
- **문제**: 로그인 패널의 "내가 저장한 번호 세트"가 회차가 바뀌어도 리셋되지 않고 10/10으로 표시됨
- **결과**: 추천번호 저장 시 "한도초과" 오류 발생
- **영향**: 사용자가 새로운 회차에서 추천번호를 저장할 수 없음

## 🔍 **이미 시도한 해결책**

### 1️⃣ **백엔드 수정 완료**
- **User 모델** (`backend/app/models/user.py`):
  - `current_week_saved_count` 속성 추가 (현재 회차 + 주간 기준 동적 계산)
  - `to_dict()` 메서드에서 `total_saved_numbers`를 `current_week_saved_count`로 대체
  - `can_save_number` 속성도 현재 회차 기준으로 수정

- **저장 API** (`backend/app/api/saved_recommendations.py`):
  - 한도 체크 시 `is_active == True` 조건 추가
  - `increment_saved_count()`, `decrement_saved_count()` 호출 제거

### 2️⃣ **프론트엔드 개선 완료**
- **UserProfile 컴포넌트** (`frontend/src/components/UserProfile/UserProfile.tsx`):
  - 새로고침 버튼(🔄) 추가
  - `refreshUser()` 함수로 실시간 데이터 업데이트

### 3️⃣ **데이터베이스 상태 확인**
```sql
-- 사용자 25 (ip9202@naver.com)의 상태
total_saved_numbers (DB 필드): 10
current_week_saved_count (속성): 0
to_dict() 결과: total_saved_numbers: 0
```

## 🐛 **현재 문제점**

### 1️⃣ **API 응답 불일치**
- **백엔드**: `to_dict()`에서 `total_saved_numbers: 0` 반환
- **프론트엔드**: 여전히 10/10으로 표시
- **원인**: 캐시된 데이터 또는 다른 API 엔드포인트 사용 가능성

### 2️⃣ **토큰 인증 문제**
- JWT 토큰 생성/검증에 문제 발생
- API 호출 시 401 Unauthorized 오류
- 실제 사용자 토큰으로 테스트 필요

## 🔧 **해결 방안**

### 1️⃣ **즉시 확인 필요사항**
1. **실제 브라우저에서 로그인한 토큰으로 API 테스트**
2. **프론트엔드에서 호출하는 정확한 API 엔드포인트 확인**
3. **브라우저 캐시/로컬스토리지 초기화**

### 2️⃣ **디버깅 방법**
```bash
# 1. 실제 사용자 토큰으로 API 테스트
curl -H "Authorization: Bearer [실제토큰]" http://localhost:8000/api/v1/auth/me

# 2. 백엔드 로그 확인
docker-compose logs backend --tail=50

# 3. 프론트엔드 네트워크 탭에서 API 호출 확인
```

### 3️⃣ **가능한 추가 수정사항**
1. **UnifiedAuthContext의 사용자 정보 새로고침 로직 개선**
2. **API 응답 구조 확인 및 수정**
3. **캐시 무효화 메커니즘 추가**

## 📋 **파일 목록**
- `backend/app/models/user.py` - User 모델 수정
- `backend/app/api/saved_recommendations.py` - 저장 API 수정
- `frontend/src/components/UserProfile/UserProfile.tsx` - UI 개선
- `frontend/src/contexts/UnifiedAuthContext.tsx` - 인증 컨텍스트

## 🎯 **목표**
- 회차가 바뀌면 저장 개수가 0/10으로 리셋되어야 함
- 새로운 회차에서 10개까지 추천번호 저장 가능해야 함
- 프론트엔드에서 실시간으로 정확한 저장 개수 표시

## ⚠️ **주의사항**
- 현재 백엔드 로직은 정상적으로 작동함 (DB에서 0개 확인)
- 문제는 프론트엔드에서 캐시된 데이터를 사용하거나 잘못된 API를 호출하는 것으로 추정
- 실제 사용자 토큰으로 테스트가 필요함