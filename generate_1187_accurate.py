#!/usr/bin/env python3
"""
1187회차 정확한 더미 데이터 생성 스크립트
- 1188회차 스크립트를 기반으로 정확한 당첨번호 조합 생성
- 총 1000개 추천 데이터 생성
- 1등 1개, 2등 2개, 3등 3개, 4등 4개, 5등 5개
- 나머지는 낙첨
"""

import requests
import json
import random
from datetime import datetime, timedelta

# 1187회차 당첨번호
WINNING_NUMBERS = [5, 13, 26, 29, 37, 40]
BONUS_NUMBER = 42
DRAW_NUMBER = 1187

# API 엔드포인트
API_BASE_URL = "http://localhost:8000"

def calculate_grade(numbers, winning_numbers, bonus_number):
    """당첨 등수 계산"""
    matches = len(set(numbers) & set(winning_numbers))
    bonus_match = bonus_number in numbers
    
    if matches == 6:
        return 1, False  # 1등
    elif matches == 5 and bonus_match:
        return 2, True   # 2등
    elif matches == 5:
        return 3, False  # 3등
    elif matches == 4:
        return 4, False  # 4등
    elif matches == 3:
        return 5, False  # 5등
    else:
        return 0, False  # 낙첨

def generate_winning_combination(winning_numbers, bonus_number, grade):
    """특정 등수에 맞는 번호 조합 생성 (정확한 당첨번호 매칭)"""
    if grade == 1:  # 1등 - 6개 모두 맞춤
        return winning_numbers.copy()
    elif grade == 2:  # 2등 - 5개 + 보너스
        # 5개 당첨번호 + 보너스번호 (6개)
        return winning_numbers[:5] + [bonus_number]
    elif grade == 3:  # 3등 - 5개만 맞춤
        other_numbers = [n for n in range(1, 46) if n not in winning_numbers and n != bonus_number]
        return winning_numbers[:5] + [random.choice(other_numbers)]
    elif grade == 4:  # 4등 - 4개 맞춤
        other_numbers = [n for n in range(1, 46) if n not in winning_numbers]
        return winning_numbers[:4] + random.sample(other_numbers, 2)
    elif grade == 5:  # 5등 - 3개 맞춤
        other_numbers = [n for n in range(1, 46) if n not in winning_numbers]
        return winning_numbers[:3] + random.sample(other_numbers, 3)
    else:  # 낙첨 - 0-2개만 맞춤
        matches = random.randint(0, 2)
        if matches > 0:
            selected = random.sample(winning_numbers, matches)
            other_numbers = [n for n in range(1, 46) if n not in winning_numbers]
            return selected + random.sample(other_numbers, 6 - matches)
        else:
            other_numbers = [n for n in range(1, 46) if n not in winning_numbers]
            return random.sample(other_numbers, 6)

def generate_random_combination():
    """랜덤 번호 조합 생성"""
    return sorted(random.sample(range(1, 46), 6))

def create_dummy_recommendation(numbers, grade):
    """더미 데이터 생성 (직접 데이터베이스에 저장)"""
    return {
        "numbers": numbers,
        "generation_method": "ai",
        "confidence_score": random.randint(70, 95),
        "analysis_data": {"is_dummy": True, "rank": grade},
        "draw_number": DRAW_NUMBER,
        "user_type": "member",
        "is_dummy": True,
        "winning_rank": grade,
        "matched_count": 6 if grade == 1 else (5 if grade in [2, 3] else (4 if grade == 4 else (3 if grade == 5 else 0))),
        "matched_numbers": numbers[:6] if grade == 1 else (numbers[:5] if grade in [2, 3] else (numbers[:4] if grade == 4 else (numbers[:3] if grade == 5 else []))),
        "winning_amount": 1000000 if grade == 1 else 0
    }

def send_dummy_recommendation(data):
    """더미 데이터를 관리자 API로 전송"""
    try:
        # 올바른 API 엔드포인트 사용
        response = requests.post(
            f"{API_BASE_URL}/admin/dummy-recommendations/generate",
            json={
                "draw_number": DRAW_NUMBER,
                "total_count": 1,
                "rank_distribution": {str(data["winning_rank"]): 1}
            },
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 200:
            return True
        else:
            print(f"Error: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Request failed: {e}")
        return False

def main():
    print(f"1187회차 정확한 더미 데이터 생성 시작...")
    print(f"당첨번호: {WINNING_NUMBERS}, 보너스: {BONUS_NUMBER}")
    
    # 목표 당첨 통계 (이미지에서 입력한 설정)
    target_stats = {
        1: 1,   # 1등 1개
        2: 2,   # 2등 2개
        3: 3,   # 3등 3개
        4: 4,   # 4등 4개
        5: 5,   # 5등 5개
        0: 985  # 낙첨 985개 (총 1000개)
    }
    
    total_created = 0
    success_count = 0
    
    # 각 등수별로 데이터 생성
    for grade, count in target_stats.items():
        print(f"\n{grade}등 데이터 {count}개 생성 중...")
        
        for i in range(count):
            if grade > 0:
                # 당첨 번호 생성 (정확한 당첨번호 매칭)
                numbers = generate_winning_combination(WINNING_NUMBERS, BONUS_NUMBER, grade)
                
                # 더미 데이터 생성
                dummy_data = create_dummy_recommendation(numbers, grade)
                
                # 관리자 API로 전송
                if send_dummy_recommendation(dummy_data):
                    success_count += 1
                    total_created += 1
                else:
                    print(f"더미 데이터 생성 실패: {grade}등")
            else:
                # 낙첨 번호 생성
                numbers = generate_random_combination()
                
                # 더미 데이터 생성
                dummy_data = create_dummy_recommendation(numbers, grade)
                
                # 관리자 API로 전송
                if send_dummy_recommendation(dummy_data):
                    success_count += 1
                    total_created += 1
                else:
                    print(f"더미 데이터 생성 실패: {grade}등")
            
            if total_created % 100 == 0:
                print(f"진행률: {total_created}/1000 ({total_created/10:.1f}%)")
    
    print(f"\n데이터 생성 완료!")
    print(f"총 생성: {total_created}개")
    print(f"성공: {success_count}개")
    print(f"실패: {total_created - success_count}개")

if __name__ == "__main__":
    main()
