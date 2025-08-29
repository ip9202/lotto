-- Railway PostgreSQL 완전 초기화 스크립트
-- 테이블 구조 + 1,186개 전체 로또 데이터 포함

-- 1. 로또 당첨 번호 테이블 생성
CREATE TABLE IF NOT EXISTS lotto_draws (
    id SERIAL PRIMARY KEY,
    draw_number INTEGER UNIQUE NOT NULL,
    draw_date DATE NOT NULL,
    number_1 INTEGER NOT NULL CHECK (number_1 BETWEEN 1 AND 45),
    number_2 INTEGER NOT NULL CHECK (number_2 BETWEEN 1 AND 45),
    number_3 INTEGER NOT NULL CHECK (number_3 BETWEEN 1 AND 45),
    number_4 INTEGER NOT NULL CHECK (number_4 BETWEEN 1 AND 45),
    number_5 INTEGER NOT NULL CHECK (number_5 BETWEEN 1 AND 45),
    number_6 INTEGER NOT NULL CHECK (number_6 BETWEEN 1 AND 45),
    bonus_number INTEGER NOT NULL CHECK (bonus_number BETWEEN 1 AND 45),
    first_winners INTEGER DEFAULT 0,
    first_amount BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 사용자 세션 관리 테이블 생성
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    session_name VARCHAR(255),
    include_numbers JSONB DEFAULT '{}',
    exclude_numbers JSONB DEFAULT '{}',
    combination_settings JSONB DEFAULT '{}',
    manual_combinations JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    is_admin_created BOOLEAN DEFAULT false,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    manual_ratio INTEGER DEFAULT 0,
    auto_ratio INTEGER DEFAULT 100,
    tags JSONB DEFAULT '[]'
);

-- 3. 사용자 추천 기록 테이블 생성
CREATE TABLE IF NOT EXISTS user_histories (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) REFERENCES user_sessions(session_id),
    numbers JSONB NOT NULL,
    confidence_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recommendation_type VARCHAR(50) DEFAULT 'auto',
    combination_id VARCHAR(255)
);

-- 4. 추천 엔진 설정 테이블 생성
CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    weights JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. 기본 추천 엔진 설정 입력
INSERT INTO recommendations (name, description, weights) VALUES (
    'AI Lotto Genius',
    'AI 기반 로또 번호 추천 엔진',
    '{"frequency": 0.25, "trend": 0.20, "gap": 0.15, "pattern": 0.20, "balance": 0.20}'
) ON CONFLICT DO NOTHING;

-- 6. 기본 사용자 세션 생성
INSERT INTO user_sessions (session_id, session_name, is_active) VALUES 
('default_session', '기본 세션', true)
ON CONFLICT (session_id) DO NOTHING;

-- 7. 1,186개 전체 로또 데이터 입력
-- 이 부분은 lotto_complete_data.sql 파일의 내용으로 대체됩니다
-- 파일이 너무 커서 여기에 직접 포함하지 않고 별도로 실행합니다

-- 완료 메시지
SELECT 'Railway 데이터베이스 초기화 완료! 테이블 구조 생성됨' as message;
