#!/usr/bin/env python3
"""
Railway 데이터베이스 연결 테스트
"""

import os
import psycopg2

def test_connection():
    """Railway 데이터베이스 연결 테스트"""
    try:
        # 환경변수에서 DATABASE_URL 가져오기
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            print("❌ DATABASE_URL 환경변수가 설정되지 않았습니다")
            return False
            
        print(f"📍 연결 시도: {database_url}")
        
        # 연결 시도
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # 간단한 쿼리 실행
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        
        print(f"✅ 연결 성공!")
        print(f"📊 PostgreSQL 버전: {version[0]}")
        
        # 테이블 목록 확인
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        
        tables = cursor.fetchall()
        print(f"📋 기존 테이블: {len(tables)}개")
        for table in tables:
            print(f"   - {table[0]}")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ 연결 실패: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Railway 데이터베이스 연결 테스트 시작!")
    print("=" * 50)
    
    if test_connection():
        print("\n🎉 연결 테스트 성공!")
    else:
        print("\n❌ 연결 테스트 실패!")
