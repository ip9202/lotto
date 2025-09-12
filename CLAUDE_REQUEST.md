# 🚨 고급추천 포함/제외 설정 UPDATE 문제 해결 요청

## 🔍 문제 상황

**로또리아 AI 프로젝트**에서 고급추천 기능의 포함/제외 숫자 설정 저장 시 **UPDATE가 작동하지 않는 문제**가 발생하고 있습니다.

### 현재 상황
- **INSERT (첫 번째 저장)**: ✅ 정상 작동
- **UPDATE (두 번째 이후 저장)**: ❌ 작동 안 함
- **API 응답**: ✅ 성공 메시지 반환
- **백엔드 로그**: ✅ 저장 성공 로그 출력
- **실제 데이터베이스**: ❌ 변경사항 반영 안 됨

## 📋 기술 스택 정보

- **Backend**: FastAPI + SQLAlchemy + PostgreSQL
- **Frontend**: React + TypeScript
- **Database**: PostgreSQL (Docker 환경)
- **JSON 필드**: `users.preferences` (JSONB 타입)

## 🧪 테스트 결과

### API 테스트
```bash
# 첫 번째 저장 (INSERT) - 성공
curl -X PUT "http://localhost:8000/api/v1/user/preferences" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN]" \
  -d '{"include_numbers": [1,2,3,4,5], "exclude_numbers": [40,41,42,43,44]}'

# 응답: {"success":true, "message":"사용자 설정이 성공적으로 저장되었습니다."}

# 두 번째 저장 (UPDATE) - 실패
curl -X PUT "http://localhost:8000/api/v1/user/preferences" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN]" \
  -d '{"include_numbers": [6,7,8,9,10], "exclude_numbers": [35,36,37,38,39]}'

# 응답: {"success":true, "message":"사용자 설정이 성공적으로 저장되었습니다."}
# 하지만 실제 DB에는 이전 값이 그대로 남아있음
```

### 데이터베이스 확인
```sql
-- 계속 이전 값이 유지됨
SELECT id, email, preferences FROM users WHERE id = 28;
-- 결과: {"exclude_numbers": [28, 34, 42, 5, 13], "include_numbers": [27, 33, 41, 4, 12]}
```

### 백엔드 로그
```
💾 사용자 설정 저장 - User ID: 28, User ID String: user_6560a0094f1447dc
📝 저장할 설정: {'include_numbers': [16, 17, 18, 19, 20], 'exclude_numbers': [25, 26, 27, 28, 29]}
✅ 설정 저장 완료 - User ID: 28, 저장된 설정: {'exclude_numbers': [25, 26, 27, 28, 29], 'include_numbers': [16, 17, 18, 19, 20]}
INFO: "PUT /api/v1/user/preferences HTTP/1.1" 200 OK
```

## 🔧 시도한 해결 방법들

### 1. `flag_modified()` 사용
```python
from sqlalchemy.orm.attributes import flag_modified

current_user.preferences = new_preferences
flag_modified(current_user, 'preferences')
db.commit()
```
**결과**: ❌ 실패

### 2. 새로운 데이터베이스 세션 사용
```python
from ..database import SessionLocal
new_db = SessionLocal()
try:
    user_to_update = new_db.query(User).filter(User.id == current_user.id).first()
    user_to_update.preferences = new_preferences
    new_db.commit()
finally:
    new_db.close()
```
**결과**: ❌ 실패

### 3. Raw SQL 사용
```python
from sqlalchemy import text
import json

db.execute(
    text("UPDATE users SET preferences = :preferences::jsonb WHERE id = :user_id"),
    {
        "preferences": json.dumps(new_preferences),
        "user_id": current_user.id
    }
)
db.commit()
```
**결과**: ❌ 실패

### 4. 직접 SQL 실행 (터미널)
```sql
-- 이 방법으로는 업데이트 됨
UPDATE users SET preferences = '{"include_numbers": [1,2,3], "exclude_numbers": [4,5,6]}' WHERE id = 28;
```
**결과**: ✅ 성공

## 📁 관련 파일

### 백엔드 API 파일
```
/Users/ip9202/develop/vibe/lotto/backend/app/api/user_preferences.py
```

### 주요 코드 (현재 상태)
```python
@router.put("/preferences", response_model=UserPreferencesResponse, summary="사용자 설정 저장")
async def save_user_preferences(
    preferences_data: UserPreferencesRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # ... 검증 로직 ...
    
    new_preferences = {
        'include_numbers': preferences_data.include_numbers,
        'exclude_numbers': preferences_data.exclude_numbers
    }
    
    # Raw SQL을 사용한 JSON 필드 업데이트 (트랜잭션 명시적 관리)
    import json
    from sqlalchemy import text
    
    try:
        result = db.execute(
            text("UPDATE users SET preferences = :preferences::jsonb WHERE id = :user_id"),
            {
                "preferences": json.dumps(new_preferences),
                "user_id": current_user.id
            }
        )
        db.commit()
        current_user.preferences = new_preferences
        
    except Exception as e:
        db.rollback()
        raise e
```

## 🎯 요청사항

**SQLAlchemy + PostgreSQL 환경에서 JSON 필드 UPDATE가 정상적으로 작동하도록 수정해 주세요.**

### 예상 원인
1. SQLAlchemy 세션 관리 문제
2. JSON 필드 변경 감지 문제  
3. 트랜잭션 격리 수준 문제
4. 데이터베이스 연결 풀 문제

### 요청사항
1. 확실한 UPDATE 로직 구현
2. 트랜잭션 안정성 보장
3. 에러 처리 개선
4. 코드 간소화 (현재 너무 복잡함)

## 🔍 추가 정보

- **Docker 환경**에서 실행 중
- **PostgreSQL 15** 사용
- **사용자 ID 28번**에서 지속적으로 문제 발생
- **사용자 ID 29번**에서는 정상 작동 (새로 생성한 사용자)
- API 응답과 로그는 성공하지만 **실제 DB 반영 안 됨**

---

**문제 해결 후 정상 작동 확인 방법**:
1. 첫 번째 저장 → DB 확인 ✅
2. 두 번째 저장 → DB 확인 ✅ (변경되어야 함)
3. 세 번째 저장 → DB 확인 ✅ (다시 변경되어야 함)
