-- PostgreSQL 초기화 스크립트
-- 컨테이너 시작 시 자동으로 실행됩니다

-- 데이터베이스가 이미 존재하는지 확인하고 생성
SELECT 'CREATE DATABASE lotto_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'lotto_db')\gexec

-- lotto_db 데이터베이스에 연결
\c lotto_db;

-- 사용자 권한 설정
GRANT ALL PRIVILEGES ON DATABASE lotto_db TO lotto_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO lotto_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO lotto_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO lotto_user;

-- 기본 스키마 설정
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO lotto_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO lotto_user;
