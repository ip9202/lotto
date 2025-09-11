-- 간단한 사용자 데이터 정리 스크립트
-- 관리자 계정(ip9202@gmail.com)만 유지

BEGIN;

-- 1. 관리자 계정 정보 확인
SELECT id, email, role FROM users WHERE email = 'ip9202@gmail.com';

-- 2. 관리자가 아닌 사용자들의 저장된 추천번호 삭제
DELETE FROM saved_recommendations 
WHERE user_id IN (
    SELECT id FROM users 
    WHERE email != 'ip9202@gmail.com'
);

-- 3. 관리자가 아닌 사용자 삭제
DELETE FROM users WHERE email != 'ip9202@gmail.com';

-- 4. 정리 결과 확인
SELECT COUNT(*) as remaining_users FROM users;
SELECT COUNT(*) as remaining_saved_recommendations FROM saved_recommendations;

COMMIT;
