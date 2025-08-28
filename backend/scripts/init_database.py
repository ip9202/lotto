#!/usr/bin/env python3
"""
데이터베이스 초기화 스크립트
PostgreSQL 데이터베이스와 테이블을 생성합니다.
"""

import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# 프로젝트 루트 디렉토리를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings

def create_database():
    """데이터베이스 및 사용자 생성"""
    try:
        # 관리자 권한으로 연결 (기본 postgres 데이터베이스)
        conn = psycopg2.connect(
            host=settings.db_host,
            port=settings.db_port,
            user='postgres',
            password=os.getenv('POSTGRES_PASSWORD', 'postgres'),
            database='postgres'
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # 데이터베이스 존재 여부 확인
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (settings.db_name,))
        if cursor.fetchone():
            print(f"✅ 데이터베이스 '{settings.db_name}'이 이미 존재합니다")
        else:
            # 데이터베이스 생성
            cursor.execute(f"CREATE DATABASE {settings.db_name}")
            print(f"✅ 데이터베이스 '{settings.db_name}'을 생성했습니다")
        
        # 사용자 존재 여부 확인
        cursor.execute("SELECT 1 FROM pg_user WHERE usename = %s", (settings.db_user,))
        if cursor.fetchone():
            print(f"✅ 사용자 '{settings.db_user}'가 이미 존재합니다")
        else:
            # 사용자 생성 및 권한 부여
            cursor.execute(f"CREATE USER {settings.db_user} WITH PASSWORD '{settings.db_password}'")
            print(f"✅ 사용자 '{settings.db_user}'를 생성했습니다")
        
        # 데이터베이스 권한 부여
        cursor.execute(f"GRANT ALL PRIVILEGES ON DATABASE {settings.db_name} TO {settings.db_user}")
        print(f"✅ 사용자 '{settings.db_user}'에게 데이터베이스 권한을 부여했습니다")
        
        cursor.close()
        conn.close()
        
    except psycopg2.OperationalError as e:
        print(f"❌ 데이터베이스 연결 실패: {e}")
        print("PostgreSQL이 실행 중인지 확인하세요")
        return False
    except Exception as e:
        print(f"❌ 데이터베이스 생성 실패: {e}")
        return False
    
    return True

def create_tables():
    """테이블 생성"""
    try:
        # 새로 생성된 데이터베이스에 연결
        conn = psycopg2.connect(
            host=settings.db_host,
            port=settings.db_port,
            database=settings.db_name,
            user=settings.db_user,
            password=settings.db_password
        )
        cursor = conn.cursor()
        
        # 테이블 생성 SQL
        create_tables_sql = """
        -- 로또 당첨 번호 테이블
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

        -- 사용자 추천 기록 테이블
        CREATE TABLE IF NOT EXISTS user_histories (
            id SERIAL PRIMARY KEY,
            draw_number INTEGER,
            session_id VARCHAR(255) NOT NULL,
            total_count INTEGER NOT NULL CHECK (total_count BETWEEN 1 AND 20),
            manual_count INTEGER DEFAULT 0,
            auto_count INTEGER DEFAULT 0,
            preferences JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 추천 번호 조합 테이블
        CREATE TABLE IF NOT EXISTS recommendations (
            id SERIAL PRIMARY KEY,
            history_id INTEGER REFERENCES user_histories(id) ON DELETE CASCADE,
            combination_type VARCHAR(20) NOT NULL,
            numbers INTEGER[] NOT NULL,
            is_manual BOOLEAN DEFAULT FALSE,
            confidence_score DECIMAL(3,2),
            win_rank INTEGER,
            win_amount INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 인덱스 생성
        CREATE INDEX IF NOT EXISTS idx_lotto_draws_number ON lotto_draws(draw_number);
        CREATE INDEX IF NOT EXISTS idx_lotto_draws_date ON lotto_draws(draw_date);
        CREATE INDEX IF NOT EXISTS idx_user_histories_session ON user_histories(session_id);
        CREATE INDEX IF NOT EXISTS idx_user_histories_draw ON user_histories(draw_number);
        CREATE INDEX IF NOT EXISTS idx_user_histories_created ON user_histories(created_at);
        CREATE INDEX IF NOT EXISTS idx_recommendations_history ON recommendations(history_id);
        CREATE INDEX IF NOT EXISTS idx_recommendations_type ON recommendations(combination_type);
        CREATE INDEX IF NOT EXISTS idx_recommendations_numbers ON recommendations USING GIN (numbers);

        -- 복합 인덱스
        CREATE INDEX IF NOT EXISTS idx_session_draw ON user_histories(session_id, draw_number);
        CREATE INDEX IF NOT EXISTS idx_created_session ON user_histories(created_at, session_id);
        CREATE INDEX IF NOT EXISTS idx_history_type ON recommendations(history_id, combination_type);
        """
        
        # SQL 실행
        cursor.execute(create_tables_sql)
        conn.commit()
        
        print("✅ 테이블 생성 완료")
        
        # 테이블 정보 확인
        cursor.execute("""
            SELECT table_name, column_count 
            FROM (
                SELECT 
                    table_name,
                    COUNT(*) as column_count
                FROM information_schema.columns 
                WHERE table_schema = 'public'
                GROUP BY table_name
            ) t
            ORDER BY table_name
        """)
        
        tables = cursor.fetchall()
        print("\n📊 생성된 테이블 정보:")
        for table_name, column_count in tables:
            print(f"  - {table_name}: {column_count}개 컬럼")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ 테이블 생성 실패: {e}")
        return False
    
    return True

def main():
    """메인 함수"""
    print("🚀 LottoGenius 데이터베이스 초기화 시작...")
    print(f"📍 대상 데이터베이스: {settings.db_name}")
    print(f"📍 대상 호스트: {settings.db_host}:{settings.db_port}")
    print()
    
    # 1단계: 데이터베이스 및 사용자 생성
    print("1️⃣ 데이터베이스 및 사용자 생성 중...")
    if not create_database():
        print("❌ 데이터베이스 초기화 실패")
        sys.exit(1)
    
    # 2단계: 테이블 생성
    print("\n2️⃣ 테이블 생성 중...")
    if not create_tables():
        print("❌ 테이블 생성 실패")
        sys.exit(1)
    
    print("\n🎉 데이터베이스 초기화 완료!")
    print(f"📍 데이터베이스: {settings.db_name}")
    print(f"📍 사용자: {settings.db_user}")
    print(f"📍 연결 문자열: postgresql://{settings.db_user}:{settings.db_password}@{settings.db_host}:{settings.db_port}/{settings.db_name}")

if __name__ == "__main__":
    main()


