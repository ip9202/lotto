#!/usr/bin/env python3
"""
엑셀 파일을 데이터베이스에 자동 입력하는 스크립트
lotto (2).xlsx 파일의 1,186개 회차 데이터를 PostgreSQL에 일괄 저장
"""

import pandas as pd
import sys
import os
from datetime import datetime
from pathlib import Path
import logging

# 프로젝트 루트 디렉토리를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 직접 데이터베이스 연결 설정
import psycopg2
from psycopg2.extras import RealDictCursor

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ExcelToDatabaseImporter:
    """엑셀 파일을 데이터베이스에 입력하는 클래스"""
    
    def __init__(self, excel_file_path):
        self.excel_file_path = excel_file_path
        self.db_config = {
            'host': 'localhost',
            'port': 5432,
            'database': 'lotto_db',
            'user': 'lotto_user',
            'password': 'lotto_password'
        }
        
    def read_excel_file(self):
        """엑셀 파일 읽기"""
        try:
            logger.info(f"엑셀 파일 읽기 시작: {self.excel_file_path}")
            
            # 엑셀 파일 읽기
            df = pd.read_excel(self.excel_file_path)
            
            logger.info(f"✅ 엑셀 파일 읽기 성공!")
            logger.info(f"   - 총 {len(df)}행, {len(df.columns)}열")
            logger.info(f"   - 컬럼: {list(df.columns)}")
            
            return df
            
        except Exception as e:
            logger.error(f"❌ 엑셀 파일 읽기 실패: {e}")
            return None
    
    def validate_data(self, df):
        """데이터 유효성 검사"""
        logger.info("데이터 유효성 검사 시작...")
        
        # 1. 필수 컬럼 확인
        required_columns = ['회차', '번호1', '번호2', '번호3', '번호4', '번호5', '번호6', '보너스']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            logger.error(f"❌ 필수 컬럼 누락: {missing_columns}")
            return False
        
        # 2. 데이터 타입 확인
        for col in ['번호1', '번호2', '번호3', '번호4', '번호5', '번호6', '보너스']:
            if not pd.api.types.is_numeric_dtype(df[col]):
                logger.error(f"❌ {col} 컬럼이 숫자 타입이 아님")
                return False
        
        # 3. 번호 범위 확인 (1-45)
        for col in ['번호1', '번호2', '번호3', '번호4', '번호5', '번호6', '보너스']:
            if df[col].min() < 1 or df[col].max() > 45:
                logger.error(f"❌ {col} 컬럼의 번호가 1-45 범위를 벗어남")
                return False
        
        # 4. 회차 순서 확인
        if df['회차'].min() != 1 or df['회차'].max() != 1186:
            logger.error(f"❌ 회차 범위가 1-1186이 아님 (실제: {df['회차'].min()}-{df['회차'].max()})")
            return False
        
        # 5. 중복 회차 확인
        if df['회차'].duplicated().any():
            logger.error("❌ 중복된 회차가 존재함")
            return False
        
        logger.info("✅ 데이터 유효성 검사 통과!")
        return True
    
    def transform_data(self, df):
        """데이터 변환 및 정제"""
        logger.info("데이터 변환 시작...")
        
        transformed_data = []
        
        for _, row in df.iterrows():
            try:
                # 당첨번호 6개를 리스트로 변환
                numbers = [
                    int(row['번호1']),
                    int(row['번호2']),
                    int(row['번호3']),
                    int(row['번호4']),
                    int(row['번호5']),
                    int(row['번호6'])
                ]
                
                # 번호 정렬 (로또 번호는 정렬된 상태로 저장)
                numbers.sort()
                
                # 보너스 번호
                bonus_number = int(row['보너스'])
                
                # 당첨 정보
                first_winners = int(row['1등 당첨수']) if pd.notna(row['1등 당첨수']) else 0
                first_amount = int(row['1등 당첨금']) if pd.notna(row['1등 당첨금']) else 0
                
                # 날짜 계산 (2002년 12월 7일부터 매주 토요일)
                draw_date = self.calculate_draw_date(int(row['회차']))
                
                transformed_data.append({
                    'draw_number': int(row['회차']),
                    'numbers': numbers,
                    'bonus_number': bonus_number,
                    'draw_date': draw_date,
                    'first_winners': first_winners,
                    'first_amount': first_amount
                })
                
            except Exception as e:
                logger.error(f"행 {row['회차']} 변환 실패: {e}")
                continue
        
        logger.info(f"✅ 데이터 변환 완료: {len(transformed_data)}개")
        return transformed_data
    
    def calculate_draw_date(self, draw_number):
        """회차별 추첨일 계산"""
        # 1회차: 2002년 12월 7일 (토요일)
        base_date = datetime(2002, 12, 7)
        
        # 매주 토요일이므로 7일씩 증가
        days_offset = (draw_number - 1) * 7
        
        draw_date = base_date + pd.Timedelta(days=days_offset)
        return draw_date
    
    def import_to_database(self, transformed_data):
        """데이터베이스에 데이터 입력"""
        logger.info("데이터베이스 입력 시작...")
        
        try:
            # PostgreSQL 연결
            conn = psycopg2.connect(**self.db_config)
            cursor = conn.cursor()
            
            success_count = 0
            update_count = 0
            error_count = 0
            
            for data in transformed_data:
                try:
                    # 기존 데이터 확인
                    cursor.execute(
                        "SELECT id FROM lotto_draws WHERE draw_number = %s",
                        (data['draw_number'],)
                    )
                    existing = cursor.fetchone()
                    
                    if existing:
                        # 기존 데이터 업데이트
                        cursor.execute("""
                            UPDATE lotto_draws 
                            SET number_1 = %s, number_2 = %s, number_3 = %s, 
                                number_4 = %s, number_5 = %s, number_6 = %s,
                                bonus_number = %s, draw_date = %s, 
                                first_winners = %s, first_amount = %s
                            WHERE draw_number = %s
                        """, (
                            data['numbers'][0], data['numbers'][1], data['numbers'][2],
                            data['numbers'][3], data['numbers'][4], data['numbers'][5],
                            data['bonus_number'], data['draw_date'],
                            data['first_winners'], data['first_amount'], data['draw_number']
                        ))
                        update_count += 1
                        
                        if update_count % 100 == 0:
                            logger.info(f"   - {update_count}개 업데이트 완료...")
                    else:
                        # 새 데이터 추가
                        cursor.execute("""
                            INSERT INTO lotto_draws 
                            (draw_number, number_1, number_2, number_3, number_4, number_5, number_6,
                             bonus_number, draw_date, first_winners, first_amount)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """, (
                            data['draw_number'], data['numbers'][0], data['numbers'][1], data['numbers'][2],
                            data['numbers'][3], data['numbers'][4], data['numbers'][5],
                            data['bonus_number'], data['draw_date'],
                            data['first_winners'], data['first_amount']
                        ))
                        success_count += 1
                        
                        if success_count % 100 == 0:
                            logger.info(f"   - {success_count}개 추가 완료...")
                
                except Exception as e:
                    logger.error(f"회차 {data['draw_number']} 입력 실패: {e}")
                    error_count += 1
                    continue
            
            # 변경사항 커밋
            conn.commit()
            cursor.close()
            conn.close()
            
            logger.info("✅ 데이터베이스 입력 완료!")
            logger.info(f"   - 새로 추가: {success_count}개")
            logger.info(f"   - 업데이트: {update_count}개")
            logger.info(f"   - 오류: {error_count}개")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ 데이터베이스 입력 실패: {e}")
            return False
    
    def cleanup(self):
        """리소스 정리"""
        logger.info("리소스 정리 완료")
    
    def run_import(self):
        """전체 임포트 프로세스 실행"""
        logger.info("🚀 엑셀 파일 데이터베이스 임포트 시작!")
        logger.info("=" * 60)
        
        try:
            # 1. 엑셀 파일 읽기
            df = self.read_excel_file()
            if df is None:
                return False
            
            # 2. 데이터 유효성 검사
            if not self.validate_data(df):
                return False
            
            # 3. 데이터 변환
            transformed_data = self.transform_data(df)
            if not transformed_data:
                return False
            
            # 4. 데이터베이스 입력
            if not self.import_to_database(transformed_data):
                return False
            
            logger.info("🎉 모든 작업이 성공적으로 완료되었습니다!")
            return True
            
        except Exception as e:
            logger.error(f"❌ 임포트 프로세스 실패: {e}")
            return False
        finally:
            self.cleanup()

def main():
    """메인 실행 함수"""
    print("🎯 로또 엑셀 파일 데이터베이스 임포트 도구")
    print("=" * 60)
    
    # 엑셀 파일 경로
    excel_file = "../lotto (2).xlsx"
    
    # 파일 존재 확인
    if not os.path.exists(excel_file):
        print(f"❌ 엑셀 파일을 찾을 수 없습니다: {excel_file}")
        return
    
    print(f"📁 엑셀 파일: {excel_file}")
    
    # 사용자 확인
    print("\n⚠️  주의사항:")
    print("   - 기존 데이터가 있다면 업데이트됩니다")
    print("   - 총 1,186개 회차 데이터가 처리됩니다")
    print("   - 데이터베이스 연결이 필요합니다")
    
    confirm = input("\n계속 진행하시겠습니까? (y/n): ").strip().lower()
    if confirm != 'y':
        print("작업이 취소되었습니다.")
        return
    
    # 임포트 실행
    importer = ExcelToDatabaseImporter(excel_file)
    success = importer.run_import()
    
    if success:
        print("\n✅ 임포트 성공!")
        print("이제 로또 추천 시스템에서 실제 당첨번호 데이터를 사용할 수 있습니다!")
    else:
        print("\n❌ 임포트 실패!")
        print("로그를 확인하여 문제를 해결해주세요.")

if __name__ == "__main__":
    main()
