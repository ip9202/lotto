#!/usr/bin/env python3
"""데이터베이스 연결 테스트 스크립트"""

import sys
import os
sys.path.append('./backend')

try:
    from app.database import engine
    from sqlalchemy import text
    
    print("🔍 데이터베이스 연결 테스트 중...")
    
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print("✅ 데이터베이스 연결 성공!")
        
        # 데이터베이스 이름 확인
        result = conn.execute(text("SELECT current_database()"))
        db_name = result.fetchone()[0]
        print(f"📍 현재 데이터베이스: {db_name}")
        
        # 테이블 목록 확인
        result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
        tables = [row[0] for row in result.fetchall()]
        print(f"📋 테이블 목록: {tables}")
        
except Exception as e:
    print(f"❌ 데이터베이스 연결 실패: {e}")
    sys.exit(1)
