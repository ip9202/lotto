# 카카오 소셜 로그인 연동 관리

## 개요
로또리아 AI 프로젝트의 카카오 소셜 로그인 연동 데이터 관리를 위한 SQL 스크립트 모음입니다.

## 🔍 현재 상태 확인

### 카카오 연동된 사용자 조회
```sql
-- 카카오 연동된 모든 사용자 조회
SELECT 
    id, 
    email, 
    social_provider, 
    social_id, 
    linked_social_providers,
    created_at,
    updated_at
FROM users 
WHERE social_provider = 'KAKAO' 
   OR linked_social_providers::text LIKE '%KAKAO%';
```

### 카카오 연동 통계
```sql
-- 카카오 연동 통계
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN social_provider = 'KAKAO' THEN 1 END) as kakao_primary,
    COUNT(CASE WHEN linked_social_providers::text LIKE '%KAKAO%' THEN 1 END) as kakao_linked
FROM users;
```

## 🧹 카카오 연동 데이터 삭제

### 전체 사용자 카카오 연동 삭제 (백업 포함)
```sql
-- 1. 백업용: 삭제 전 현재 상태 저장
CREATE TEMP TABLE kakao_backup AS 
SELECT id, email, social_provider, social_id, linked_social_providers 
FROM users 
WHERE social_provider = 'KAKAO' OR linked_social_providers::text LIKE '%KAKAO%';

-- 2. 모든 카카오 연동 데이터 삭제
UPDATE users 
SET 
    social_provider = NULL,
    social_id = NULL,
    linked_social_providers = '[]',
    updated_at = now()
WHERE social_provider = 'KAKAO' 
   OR linked_social_providers::text LIKE '%KAKAO%';

-- 3. 삭제 결과 확인
SELECT COUNT(*) as updated_count FROM kakao_backup;
```

### 특정 사용자 카카오 연동 삭제
```sql
-- 특정 이메일 사용자의 카카오 연동만 삭제
UPDATE users 
SET 
    social_provider = NULL,
    social_id = NULL,
    linked_social_providers = '[]',
    updated_at = now()
WHERE email = 'user@example.com';  -- 원하는 이메일로 변경
```

### 특정 카카오 소셜 ID 연동 삭제
```sql
-- 특정 카카오 소셜 ID 연동 삭제
UPDATE users 
SET 
    social_provider = NULL,
    social_id = NULL,
    linked_social_providers = '[]',
    updated_at = now()
WHERE social_id = '4434857314';  -- 원하는 카카오 ID로 변경
```

## ✅ 삭제 후 검증

### 삭제 결과 확인
```sql
-- 삭제 후 상태 확인
SELECT 
    id, 
    email, 
    social_provider, 
    social_id, 
    linked_social_providers
FROM users 
WHERE email IN ('ip9202@naver.com', 'ip9202@gmail.com')  -- 확인하고 싶은 이메일들
ORDER BY id;
```

### 카카오 연동 완전 삭제 확인
```sql
-- 카카오 연동이 완전히 삭제되었는지 확인
SELECT COUNT(*) as remaining_kakao_users
FROM users 
WHERE social_provider = 'KAKAO' 
   OR linked_social_providers::text LIKE '%KAKAO%';
-- 결과가 0이면 모든 카카오 연동이 삭제됨
```

## 🔄 복원 (백업이 있을 경우)

### 임시 백업에서 복원
```sql
-- 백업에서 데이터 복원 (TEMP TABLE이 아직 존재할 경우)
UPDATE users 
SET 
    social_provider = b.social_provider,
    social_id = b.social_id,
    linked_social_providers = b.linked_social_providers,
    updated_at = now()
FROM kakao_backup b
WHERE users.id = b.id;
```

## 📊 데이터베이스 접속 정보

### 개발 환경 (Docker)
- **pgAdmin URL**: http://localhost:5050
- **데이터베이스**: lotto_db
- **사용자**: lotto_user
- **비밀번호**: lotto_password

### 프로덕션 환경 (Railway)
- **pgAdmin 사용 불가**: Railway는 관리형 PostgreSQL 서비스로 직접 pgAdmin 설치 불가
- **대안**: 
  1. Railway Dashboard에서 Database 탭 → Query 기능 사용
  2. Railway CLI: `railway connect postgres`
  3. 외부 PostgreSQL 클라이언트 (DBeaver, pgAdmin 로컬 설치)

## 🚀 사용 방법

### pgAdmin에서 실행
1. pgAdmin 접속: http://localhost:5050
2. 데이터베이스 연결
3. Query Tool 열기: 좌측 트리에서 lotto_db 우클릭 → Query Tool
4. 위 SQL 스크립트 복사 후 실행

### Railway에서 실행
1. Railway Dashboard → lotto-backend 프로젝트
2. Database 탭 → Query 기능 사용
3. SQL 스크립트 입력 후 실행

## ⚠️ 주의사항

- **백업 필수**: 중요한 데이터 삭제 전 반드시 백업
- **테스트 환경 우선**: 프로덕션 실행 전 개발환경에서 테스트
- **확인 후 실행**: DELETE/UPDATE 전에 SELECT로 먼저 확인
- **롤백 불가**: UPDATE/DELETE는 TRANSACTION 없이는 되돌릴 수 없음

## 🔧 트러블슈팅

### 카카오 연동 오류 해결
1. **UniqueViolation 에러**: 중복 카카오 ID 연동 시도
   ```sql
   -- 중복 카카오 ID 확인
   SELECT social_id, COUNT(*) 
   FROM users 
   WHERE social_id IS NOT NULL 
   GROUP BY social_id 
   HAVING COUNT(*) > 1;
   ```

2. **연동 데이터 불일치**: social_provider와 linked_social_providers 불일치
   ```sql
   -- 불일치 데이터 확인
   SELECT * FROM users 
   WHERE social_provider = 'KAKAO' 
     AND (linked_social_providers IS NULL 
          OR linked_social_providers::text NOT LIKE '%KAKAO%');
   ```

## 📝 버전 히스토리
- **v1.0** (2025-09-12): 초기 문서 작성, 기본 SQL 스크립트 추가