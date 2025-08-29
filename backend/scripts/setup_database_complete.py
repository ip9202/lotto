#!/usr/bin/env python3
"""
LottoGenius 데이터베이스 완전 설정 스크립트
성공한 설정을 재현할 수 있는 완전한 버전
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import sys
import os

# 프로젝트 루트를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import get_settings

def create_database_and_user():
    """데이터베이스와 사용자 생성"""
    print("🔧 데이터베이스 및 사용자 생성 중...")
    
    # PostgreSQL 기본 연결 (postgres 데이터베이스)
    try:
        conn = psycopg2.connect(
            host="localhost",
            port=5432,
            user="lotto_user",
            password="lotto_password",
            database="lotto_db"
        )
        print("✅ 데이터베이스 연결 성공")
        return conn
    except psycopg2.OperationalError as e:
        print(f"❌ 데이터베이스 연결 실패: {e}")
        print("Docker 서비스가 실행 중인지 확인하세요")
        return None

def setup_user_sessions_table(conn):
    """user_sessions 테이블 설정"""
    print("\n📋 user_sessions 테이블 설정 중...")
    
    try:
        cursor = conn.cursor()
        
        # 테이블이 이미 존재하면 삭제 (깨끗한 상태로 시작)
        cursor.execute("DROP TABLE IF EXISTS user_sessions CASCADE;")
        print("  - 기존 테이블 정리 완료")
        
        # user_sessions 테이블 생성
        create_table_sql = """
        CREATE TABLE user_sessions (
            id SERIAL PRIMARY KEY,
            session_id VARCHAR(255) UNIQUE NOT NULL,
            session_name VARCHAR(255) NOT NULL,
            is_active BOOLEAN DEFAULT true,
            is_admin_created BOOLEAN DEFAULT FALSE,
            created_by VARCHAR(100) DEFAULT 'admin',
            max_recommendations INTEGER DEFAULT 10,
            manual_ratio INTEGER DEFAULT 30,
            auto_ratio INTEGER DEFAULT 70,
            include_numbers INTEGER[],
            exclude_numbers INTEGER[],
            preferred_numbers INTEGER[],
            session_type VARCHAR(50) DEFAULT 'admin',
            description TEXT,
            tags JSONB DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP
        );
        """
        
        cursor.execute(create_table_sql)
        print("  - user_sessions 테이블 생성 완료")
        
        # 인덱스 생성
        indexes = [
            "CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);",
            "CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);",
            "CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);",
            "CREATE INDEX idx_user_sessions_session_type ON user_sessions(session_type);",
            "CREATE INDEX idx_session_active ON user_sessions(is_active, created_at);",
            "CREATE INDEX idx_admin_created ON user_sessions(is_admin_created, created_at);",
            "CREATE INDEX idx_expires_at ON user_sessions(expires_at);"
        ]
        
        for index_sql in indexes:
            cursor.execute(index_sql)
        
        print("  - 인덱스 생성 완료")
        
        conn.commit()
        print("✅ user_sessions 테이블 설정 완료")
        
    except Exception as e:
        print(f"❌ user_sessions 테이블 설정 실패: {e}")
        conn.rollback()
        raise

def setup_user_histories_foreign_key(conn):
    """user_histories 테이블에 외래키 설정"""
    print("\n🔗 user_histories 외래키 설정 중...")
    
    try:
        cursor = conn.cursor()
        
        # 기존 외래키 제약조건이 있다면 제거
        cursor.execute("""
            ALTER TABLE user_histories DROP CONSTRAINT IF EXISTS fk_user_histories_session;
        """)
        print("  - 기존 외래키 제약조건 제거 완료")
        
        # 기존 session_id들을 user_sessions에 추가
        cursor.execute("""
            INSERT INTO user_sessions (session_id, session_name, session_type, description)
            SELECT DISTINCT session_id, 
                   '기존 세션 ' || ROW_NUMBER() OVER (ORDER BY session_id) as session_name,
                   'admin' as session_type,
                   '재시작 전 기존 세션' as description
            FROM user_histories 
            WHERE session_id NOT IN (SELECT session_id FROM user_sessions)
            ON CONFLICT (session_id) DO NOTHING;
        """)
        
        inserted_count = cursor.rowcount
        print(f"  - {inserted_count}개 기존 세션 추가 완료")
        
        # 외래키 제약조건 설정
        cursor.execute("""
            ALTER TABLE user_histories ADD CONSTRAINT fk_user_histories_session 
            FOREIGN KEY (session_id) REFERENCES user_sessions(session_id);
        """)
        print("  - 외래키 제약조건 설정 완료")
        
        conn.commit()
        print("✅ user_histories 외래키 설정 완료")
        
    except Exception as e:
        print(f"❌ user_histories 외래키 설정 실패: {e}")
        conn.rollback()
        raise

def verify_setup(conn):
    """설정 검증"""
    print("\n🔍 설정 검증 중...")
    
    try:
        cursor = conn.cursor()
        
        # 테이블 존재 확인
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        
        tables = [row[0] for row in cursor.fetchall()]
        print(f"  - 생성된 테이블: {', '.join(tables)}")
        
        # user_sessions 테이블 구조 확인
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'user_sessions' 
            ORDER BY ordinal_position;
        """)
        
        columns = cursor.fetchall()
        print(f"  - user_sessions 컬럼 수: {len(columns)}")
        
        # 외래키 제약조건 확인
        cursor.execute("""
            SELECT constraint_name, constraint_type
            FROM information_schema.table_constraints 
            WHERE table_name = 'user_histories' 
            AND constraint_type = 'FOREIGN KEY';
        """)
        
        constraints = cursor.fetchall()
        print(f"  - 외래키 제약조건 수: {len(constraints)}")
        
        # 세션 데이터 수 확인
        cursor.execute("SELECT COUNT(*) FROM user_sessions;")
        session_count = cursor.fetchone()[0]
        print(f"  - 총 세션 수: {session_count}")
        
        # 활성 세션 수 확인
        cursor.execute("SELECT COUNT(*) FROM user_sessions WHERE is_active = true;")
        active_count = cursor.fetchone()[0]
        print(f"  - 활성 세션 수: {active_count}")
        
        print("✅ 설정 검증 완료")
        
    except Exception as e:
        print(f"❌ 설정 검증 실패: {e}")
        raise

def main():
    """메인 실행 함수"""
    print("🚀 LottoGenius 데이터베이스 완전 설정 시작")
    print("=" * 50)
    
    # 데이터베이스 연결
    conn = create_database_and_user()
    if not conn:
        print("❌ 데이터베이스 연결 실패로 종료")
        return
    
    try:
        # 1. user_sessions 테이블 설정
        setup_user_sessions_table(conn)
        
        # 2. user_histories 외래키 설정
        setup_user_histories_foreign_key(conn)
        
        # 3. 설정 검증
        verify_setup(conn)
        
        print("\n" + "=" * 50)
        print("🎉 데이터베이스 설정 완료!")
        print("이제 백엔드 서버를 시작할 수 있습니다.")
        
    except Exception as e:
        print(f"\n❌ 설정 중 오류 발생: {e}")
        print("오류를 수정한 후 다시 실행하세요.")
        
    finally:
        if conn:
            conn.close()
            print("\n🔌 데이터베이스 연결 종료")

if __name__ == "__main__":
    main()
