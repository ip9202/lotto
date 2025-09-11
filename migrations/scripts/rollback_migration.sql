-- 롤백 스크립트: 마이그레이션 실패 시 데이터 복원
-- 사용법: docker exec -i lotto_postgres psql -U lotto_user -d lotto_db < rollback_migration.sql

-- 1. 모든 테이블 데이터 삭제 (외래키 제약조건 고려)
DELETE FROM saved_recommendations;
DELETE FROM user_histories;
DELETE FROM user_sessions;
DELETE FROM recommendations;
DELETE FROM public_recommendations;
DELETE FROM users;
DELETE FROM lotto_draws;

-- 2. 백업 파일에서 데이터 복원
-- 이 부분은 수동으로 실행해야 함:
-- docker exec -i lotto_postgres psql -U lotto_user -d lotto_db < backup_before_migration_YYYYMMDD_HHMMSS.sql

-- 3. 시퀀스 리셋 (필요시)
-- ALTER SEQUENCE users_id_seq RESTART WITH 1;
-- ALTER SEQUENCE lotto_draws_id_seq RESTART WITH 1;
-- ALTER SEQUENCE saved_recommendations_id_seq RESTART WITH 1;

-- 4. 인덱스 재구성
REINDEX DATABASE lotto_db;

-- 5. 통계 업데이트
ANALYZE;
