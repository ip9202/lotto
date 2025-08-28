#!/usr/bin/env python3
"""
수동으로 로또 당첨번호 데이터를 입력하는 스크립트
동행복권 사이트에서 복사한 데이터를 쉽게 입력할 수 있음
"""

import sys
import os
from datetime import datetime

# 프로젝트 루트 디렉토리를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.lotto import LottoDraw

def add_lotto_draw(draw_number, numbers, bonus_number, draw_date, first_winners=0, first_amount=0):
    """로또 당첨번호 데이터 추가"""
    db = SessionLocal()
    
    try:
        # 기존 데이터 확인
        existing = db.query(LottoDraw).filter(
            LottoDraw.draw_number == draw_number
        ).first()
        
        if existing:
            print(f"회차 {draw_number} 이미 존재함 - 업데이트")
            existing.numbers = numbers
            existing.bonus_number = bonus_number
            existing.draw_date = draw_date
            existing.first_winners = first_winners
            existing.first_amount = first_amount
        else:
            print(f"회차 {draw_number} 새로 추가")
            new_draw = LottoDraw(
                draw_number=draw_number,
                numbers=numbers,
                bonus_number=bonus_number,
                draw_date=draw_date,
                first_winners=first_winners,
                first_amount=first_amount
            )
            db.add(new_draw)
        
        db.commit()
        print(f"회차 {draw_number} 데이터 저장 완료")
        
    except Exception as e:
        print(f"데이터 저장 실패: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def add_sample_data():
    """샘플 데이터 추가 (테스트용)"""
    print("샘플 로또 데이터 추가 중...")
    
    # 2025년 8월 기준 최근 몇 회차 데이터
    sample_data = [
        {
            'draw_number': 1195,
            'numbers': [3, 7, 12, 15, 28, 45],
            'bonus_number': 13,
            'draw_date': datetime(2025, 8, 23),
            'first_winners': 0,
            'first_amount': 0
        },
        {
            'draw_number': 1194,
            'numbers': [1, 8, 14, 22, 33, 44],
            'bonus_number': 19,
            'draw_date': datetime(2025, 8, 20),
            'first_winners': 0,
            'first_amount': 0
        },
        {
            'draw_number': 1193,
            'numbers': [5, 11, 16, 25, 31, 42],
            'bonus_number': 9,
            'draw_date': datetime(2025, 8, 17),
            'first_winners': 0,
            'first_amount': 0
        },
        {
            'draw_number': 1192,
            'numbers': [2, 6, 13, 21, 29, 38],
            'bonus_number': 17,
            'draw_date': datetime(2025, 8, 14),
            'first_winners': 0,
            'first_amount': 0
        },
        {
            'draw_number': 1191,
            'numbers': [4, 9, 18, 24, 35, 41],
            'bonus_number': 12,
            'draw_date': datetime(2025, 8, 10),
            'first_winners': 0,
            'first_amount': 0
        }
    ]
    
    for data in sample_data:
        add_lotto_draw(**data)
    
    print("샘플 데이터 추가 완료!")

def interactive_input():
    """대화형으로 데이터 입력"""
    print("=== 로또 당첨번호 수동 입력 ===")
    print("동행복권 사이트에서 복사한 데이터를 입력하세요.")
    print("종료하려면 회차 번호에 0을 입력하세요.\n")
    
    while True:
        try:
            # 회차 번호 입력
            draw_number = input("회차 번호 (종료: 0): ").strip()
            if draw_number == '0':
                break
            
            draw_number = int(draw_number)
            
            # 당첨번호 입력
            numbers_input = input("당첨번호 6개 (예: 1,2,3,4,5,6): ").strip()
            numbers = [int(x.strip()) for x in numbers_input.split(',')]
            
            if len(numbers) != 6:
                print("❌ 정확히 6개의 번호를 입력해주세요.")
                continue
            
            # 보너스 번호 입력
            bonus_input = input("보너스 번호: ").strip()
            bonus_number = int(bonus_input) if bonus_input else None
            
            # 당첨일 입력
            date_input = input("당첨일 (YYYY-MM-DD, 빈칸: 오늘): ").strip()
            if date_input:
                draw_date = datetime.strptime(date_input, '%Y-%m-%d')
            else:
                draw_date = datetime.now()
            
            # 당첨자 수 입력
            winners_input = input("1등 당첨자 수 (빈칸: 0): ").strip()
            first_winners = int(winners_input) if winners_input else 0
            
            # 당첨금 입력
            amount_input = input("1등 당첨금 (빈칸: 0): ").strip()
            first_amount = int(amount_input.replace(',', '')) if amount_input else 0
            
            # 데이터 저장
            add_lotto_draw(
                draw_number=draw_number,
                numbers=numbers,
                bonus_number=bonus_number,
                draw_date=draw_date,
                first_winners=first_winners,
                first_amount=first_amount
            )
            
            print(f"✅ 회차 {draw_number} 데이터 저장 완료!\n")
            
        except ValueError as e:
            print(f"❌ 잘못된 입력: {e}")
        except Exception as e:
            print(f"❌ 오류 발생: {e}")

def main():
    """메인 실행 함수"""
    print("로또 당첨번호 데이터 입력 도구")
    print("1. 샘플 데이터 추가")
    print("2. 대화형 데이터 입력")
    print("3. 종료")
    
    choice = input("\n선택하세요 (1-3): ").strip()
    
    if choice == '1':
        add_sample_data()
    elif choice == '2':
        interactive_input()
    elif choice == '3':
        print("프로그램을 종료합니다.")
    else:
        print("잘못된 선택입니다.")

if __name__ == "__main__":
    main()
