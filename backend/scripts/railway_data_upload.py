#!/usr/bin/env python3
"""
Railway PostgreSQL에 로또 데이터 업로드 스크립트
"""

import os
import sys
import psycopg2
import pandas as pd
from datetime import datetime

# 프로젝트 루트 디렉토리를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def get_railway_db_url():
    """Railway 데이터베이스 URL 반환"""
    # Railway 환경변수에서 가져오거나 기본값 사용
    database_url = os.getenv('DATABASE_URL')
    if database_url:
        print(f"✅ Railway DATABASE_URL을 찾았습니다")
        return database_url
    else:
        print("⚠️  Railway DATABASE_URL을 찾을 수 없습니다")
        print("로컬 데이터베이스를 사용합니다")
        return "postgresql://lotto_user:lotto_password@localhost:5432/lotto_db"

def create_railway_tables(conn):
    """Railway에 테이블 생성"""
    try:
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

        -- 사용자 세션 관리 테이블
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

        -- 사용자 추천 기록 테이블
        CREATE TABLE IF NOT EXISTS user_histories (
            id SERIAL PRIMARY KEY,
            session_id VARCHAR(255) REFERENCES user_sessions(session_id),
            numbers JSONB NOT NULL,
            confidence_score DECIMAL(5,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            recommendation_type VARCHAR(50) DEFAULT 'auto',
            combination_id VARCHAR(255)
        );

        -- 추천 엔진 설정 테이블
        CREATE TABLE IF NOT EXISTS recommendations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            weights JSONB NOT NULL,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        
        cursor.execute(create_tables_sql)
        conn.commit()
        print("✅ Railway 테이블 생성 완료")
        
    except Exception as e:
        print(f"❌ 테이블 생성 실패: {e}")
        conn.rollback()
        raise

def upload_lotto_data(conn):
    """로또 데이터를 Railway에 업로드"""
    try:
        # 엑셀 파일 읽기
        excel_file = "../lotto (2).xlsx"
        if not os.path.exists(excel_file):
            print(f"❌ 엑셀 파일을 찾을 수 없습니다: {excel_file}")
            return False
            
        print(f"📁 엑셀 파일 읽기: {excel_file}")
        df = pd.read_excel(excel_file)
        print(f"✅ 엑셀 파일 읽기 성공: {len(df)}행")
        
        cursor = conn.cursor()
        
        # 기존 데이터 삭제 (선택사항)
        cursor.execute("DELETE FROM lotto_draws")
        print("🗑️  기존 데이터 삭제 완료")
        
        # 데이터 삽입
        for index, row in df.iterrows():
            try:
                cursor.execute("""
                    INSERT INTO lotto_draws (
                        draw_number, draw_date, number_1, number_2, number_3, 
                        number_4, number_5, number_6, bonus_number, 
                        first_winners, first_amount
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    int(row['회차']),
                    datetime.now().date(),  # 임시 날짜
                    int(row['번호1']), int(row['번호2']), int(row['번호3']),
                    int(row['번호4']), int(row['번호5']), int(row['번호6']),
                    int(row['보너스']),
                    int(row['1등 당첨수']) if pd.notna(row['1등 당첨수']) else 0,
                    int(row['1등 당첨금']) if pd.notna(row['1등 당첨금']) else 0
                ))
                
                if (index + 1) % 100 == 0:
                    print(f"   - {index + 1}개 업로드 완료...")
                    
            except Exception as e:
                print(f"❌ 행 {index + 1} 삽입 실패: {e}")
                continue
        
        conn.commit()
        print(f"✅ 로또 데이터 업로드 완료: {len(df)}개")
        return True
        
    except Exception as e:
        print(f"❌ 데이터 업로드 실패: {e}")
        conn.rollback()
        return False

def main():
    """메인 함수"""
    print("🚀 Railway 로또 데이터 업로드 시작!")
    print("=" * 50)
    
    # 데이터베이스 연결
    database_url = get_railway_db_url()
    print(f"📍 연결 대상: {database_url}")
    
    try:
        conn = psycopg2.connect(database_url)
        print("✅ 데이터베이스 연결 성공!")
        
        # 1단계: 테이블 생성
        print("\n1️⃣ 테이블 생성 중...")
        create_railway_tables(conn)
        
        # 2단계: 로또 데이터 업로드
        print("\n2️⃣ 로또 데이터 업로드 중...")
        if upload_lotto_data(conn):
            print("\n🎉 Railway 데이터 업로드 완료!")
        else:
            print("\n❌ 데이터 업로드 실패!")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        sys.exit(1)
    finally:
        if 'conn' in locals():
            conn.close()
            print("🔌 데이터베이스 연결 종료")

if __name__ == "__main__":
    main()
