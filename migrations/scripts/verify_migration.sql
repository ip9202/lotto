-- 마이그레이션 전 검증 스크립트
-- 데이터 무결성 및 의존성 확인

-- 1. 사용자 데이터 확인
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Admin Users' as table_name, COUNT(*) as count FROM users WHERE role = 'ADMIN'
UNION ALL
SELECT 'Regular Users' as table_name, COUNT(*) as count FROM users WHERE role = 'USER';

-- 2. 저장된 추천번호 확인
SELECT 'Saved Recommendations' as table_name, COUNT(*) as count FROM saved_recommendations;

-- 3. 로또 당첨번호 데이터 확인
SELECT 'Lotto Draws' as table_name, COUNT(*) as count FROM lotto_draws;

-- 4. 최신 회차 날짜 확인
SELECT 'Latest Draw' as info, draw_number, draw_date, 
       EXTRACT(DOW FROM draw_date) as day_of_week 
FROM lotto_draws 
ORDER BY draw_number DESC 
LIMIT 5;

-- 5. 외래키 제약조건 확인
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('saved_recommendations', 'user_sessions', 'user_histories', 'recommendations');

-- 6. 데이터 크기 확인
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
