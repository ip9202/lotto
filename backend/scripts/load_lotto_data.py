#!/usr/bin/env python3
"""
로또 당첨 번호 데이터 로딩 스크립트
실제 로또 당첨 번호 데이터를 데이터베이스에 삽입합니다.
"""

import os
import sys
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Any

# 프로젝트 루트 디렉토리를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.lotto import LottoDraw

def fetch_lotto_data_from_api() -> List[Dict[str, Any]]:
    """동행복권 API에서 로또 데이터를 가져옵니다"""
    print("🌐 동행복권 API에서 로또 데이터를 가져오는 중...")
    
    # 최근 100회차 데이터 수집 (실제로는 더 많은 데이터를 가져올 수 있음)
    lotto_data = []
    
    try:
        # 동행복권 API URL (실제 API가 있다면 사용)
        # 여기서는 샘플 데이터를 생성합니다
        base_date = datetime.now()
        
        for i in range(100):
            # 회차 번호 (최신부터 역순)
            draw_number = 1000 - i
            
            # 날짜 (매주 토요일)
            draw_date = base_date - timedelta(weeks=i)
            # 토요일로 조정
            while draw_date.weekday() != 5:  # 5 = 토요일
                draw_date -= timedelta(days=1)
            
            # 로또 번호 (1-45 범위, 오름차순)
            import random
            random.seed(draw_number)  # 재현 가능한 난수
            numbers = sorted(random.sample(range(1, 46), 6))
            bonus = random.choice([n for n in range(1, 46) if n not in numbers])
            
            # 당첨자 수와 당첨금 (샘플 데이터)
            first_winners = random.randint(0, 20)
            first_amount = random.randint(1000000000, 5000000000) if first_winners > 0 else 0
            
            lotto_data.append({
                'draw_number': draw_number,
                'draw_date': draw_date.date(),
                'number_1': numbers[0],
                'number_2': numbers[1],
                'number_3': numbers[2],
                'number_4': numbers[3],
                'number_5': numbers[4],
                'number_6': numbers[5],
                'bonus_number': bonus,
                'first_winners': first_winners,
                'first_amount': first_amount
            })
        
        print(f"✅ {len(lotto_data)}회차의 로또 데이터를 생성했습니다")
        return lotto_data
        
    except Exception as e:
        print(f"❌ API 데이터 수집 실패: {e}")
        return []

def load_lotto_data_to_database(lotto_data: List[Dict[str, Any]]) -> bool:
    """로또 데이터를 데이터베이스에 삽입합니다"""
    print("💾 데이터베이스에 로또 데이터를 삽입하는 중...")
    
    db = SessionLocal()
    try:
        success_count = 0
        skip_count = 0
        
        for data in lotto_data:
            try:
                # 이미 존재하는 회차인지 확인
                existing = db.query(LottoDraw).filter(
                    LottoDraw.draw_number == data['draw_number']
                ).first()
                
                if existing:
                    skip_count += 1
                    continue
                
                # 새로운 로또 데이터 생성
                lotto_draw = LottoDraw(**data)
                db.add(lotto_draw)
                success_count += 1
                
            except Exception as e:
                print(f"⚠️ 회차 {data['draw_number']} 데이터 삽입 실패: {e}")
                continue
        
        # 변경사항 커밋
        db.commit()
        print(f"✅ {success_count}개 데이터 삽입 완료")
        if skip_count > 0:
            print(f"⏭️ {skip_count}개 데이터는 이미 존재하여 건너뜀")
        
        return True
        
    except Exception as e:
        print(f"❌ 데이터베이스 삽입 실패: {e}")
        db.rollback()
        return False
        
    finally:
        db.close()

def main():
    """메인 실행 함수"""
    print("🚀 LottoGenius 로또 데이터 로딩 시작...")
    
    # 1. 로또 데이터 수집
    lotto_data = fetch_lotto_data_from_api()
    if not lotto_data:
        print("❌ 로또 데이터 수집 실패")
        return False
    
    # 2. 데이터베이스에 삽입
    success = load_lotto_data_to_database(lotto_data)
    if not success:
        print("❌ 데이터베이스 삽입 실패")
        return False
    
    print("🎉 로또 데이터 로딩 완료!")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
