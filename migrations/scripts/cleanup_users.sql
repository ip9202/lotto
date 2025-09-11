-- 사용자 데이터 정리 스크립트
-- 관리자 계정(ip9202@gmail.com)만 유지하고 나머지 삭제

-- 트랜잭션 시작
BEGIN;

-- 1. 관리자 계정 정보 확인
SELECT id, email, role, created_at FROM users WHERE email = 'ip9202@gmail.com';

-- 2. 관리자가 아닌 사용자들의 저장된 추천번호 삭제
DELETE FROM saved_recommendations 
WHERE user_id IN (
    SELECT id FROM users 
    WHERE email != 'ip9202@gmail.com'
);

-- 3. 관리자가 아닌 사용자들의 세션 데이터 삭제
DELETE FROM user_sessions 
WHERE user_id IN (
    SELECT id FROM users 
    WHERE email != 'ip9202@gmail.com'
);

-- 4. 관리자가 아닌 사용자들의 히스토리 데이터 삭제
DELETE FROM user_histories 
WHERE session_id IN (
    SELECT session_id FROM user_sessions 
    WHERE user_id IN (
        SELECT id FROM users 
        WHERE email != 'ip9202@gmail.com'
    )
);

-- 5. 관리자가 아닌 사용자들의 추천 데이터 삭제
DELETE FROM recommendations 
WHERE history_id IN (
    SELECT id FROM user_histories 
    WHERE session_id IN (
        SELECT session_id FROM user_sessions 
        WHERE user_id IN (
            SELECT id FROM users 
            WHERE email != 'ip9202@gmail.com'
        )
    )
);

-- 6. 관리자가 아닌 사용자 삭제
DELETE FROM users WHERE email != 'ip9202@gmail.com';

-- 7. 정리 결과 확인
SELECT COUNT(*) as remaining_users FROM users;
SELECT COUNT(*) as remaining_saved_recommendations FROM saved_recommendations;
SELECT COUNT(*) as remaining_sessions FROM user_sessions;

-- 트랜잭션 커밋
COMMIT;
