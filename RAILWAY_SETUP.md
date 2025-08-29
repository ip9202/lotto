# Railway 데이터베이스 설정 가이드

## 🚀 Railway PostgreSQL 데이터베이스 초기화

### 1단계: SQL 스크립트 실행

**Railway PostgreSQL 서비스에서 다음 파일을 실행하세요:**

1. **PostgreSQL 서비스** → **Data** 탭 → **Tables** 섹션
2. **"Query" 또는 "SQL Editor"** 찾기
3. **`backend/railway_init.sql`** 파일 내용을 복사하여 붙여넣기
4. **"Run" 또는 "Execute"** 버튼 클릭

### 2단계: 데이터 확인

**실행 후 다음 테이블들이 생성되었는지 확인:**

- ✅ `lotto_draws` - 로또 당첨 번호
- ✅ `user_sessions` - 사용자 세션 관리
- ✅ `user_histories` - 사용자 추천 기록
- ✅ `recommendations` - 추천 엔진 설정

### 3단계: 샘플 데이터 확인

**기본 데이터가 입력되었는지 확인:**

```sql
-- 로또 데이터 확인
SELECT COUNT(*) FROM lotto_draws;

-- 사용자 세션 확인
SELECT * FROM user_sessions;

-- 추천 엔진 설정 확인
SELECT * FROM recommendations;
```

## 📁 파일 설명

### `railway_init.sql`
- 데이터베이스 테이블 생성
- 기본 데이터 입력
- 외래키 제약조건 설정

### `railway_lotto_data.json`
- JSON 형태의 샘플 데이터
- Python 스크립트에서 사용 가능

## 🔧 문제 해결

### 테이블이 생성되지 않는 경우
1. **PostgreSQL 서비스가 실행 중인지 확인**
2. **권한 문제가 없는지 확인**
3. **SQL 문법 오류가 없는지 확인**

### 데이터 입력이 안 되는 경우
1. **테이블 구조 확인**
2. **데이터 타입 일치 여부 확인**
3. **제약조건 위반 여부 확인**

## 📞 지원

**문제가 발생하면 다음을 확인하세요:**
1. **Railway 로그** 확인
2. **PostgreSQL 서비스 상태** 확인
3. **환경변수 설정** 확인

---

**이 가이드를 따라하면 Railway에서 LottoGenius가 완벽하게 작동할 것입니다!** 🎉
