#!/usr/bin/env python3
"""
1188회차 현실적인 공공 추천 데이터 생성 스크립트
- 구매 기간: 8월 31일~9월 6일 (7일간)
- 실제 로또 번호 패턴을 반영한 현실적인 번호 조합
- 시간대별 분산 (오전/오후/저녁)
"""

import requests
import json
import random
from datetime import datetime, timedelta
import time

# 1188회차 당첨번호
WINNING_NUMBERS = [3, 4, 12, 19, 22, 27]
BONUS_NUMBER = 9
DRAW_NUMBER = 1188

# API 엔드포인트
API_BASE_URL = "http://localhost:8000"

# 1188회차 구매 기간 (8월 31일~9월 6일)
PURCHASE_START = datetime(2025, 8, 31)  # 8월 31일 0시
PURCHASE_END = datetime(2025, 9, 6, 20)  # 9월 6일 20시 (추첨 전)

def generate_realistic_numbers():
    """현실적인 로또 번호 조합 생성"""
    # 실제 로또 번호 패턴을 반영
    # 1-10: 20%, 11-20: 25%, 21-30: 25%, 31-40: 20%, 41-45: 10%
    ranges = [
        (1, 10, 0.20),
        (11, 20, 0.25), 
        (21, 30, 0.25),
        (31, 40, 0.20),
        (41, 45, 0.10)
    ]
    
    numbers = []
    for start, end, prob in ranges:
        if random.random() < prob:
            numbers.append(random.randint(start, end))
    
    # 6개가 안 되면 랜덤으로 채우기
    while len(numbers) < 6:
        num = random.randint(1, 45)
        if num not in numbers:
            numbers.append(num)
    
    # 6개가 넘으면 자르기
    if len(numbers) > 6:
        numbers = numbers[:6]
    
    return sorted(numbers)

def generate_winning_combination(winning_numbers, bonus_number, grade):
    """특정 등수에 맞는 번호 조합 생성"""
    if grade == 1:  # 1등 - 6개 모두 맞춤
        return winning_numbers.copy()
    elif grade == 2:  # 2등 - 5개 + 보너스
        return winning_numbers[:5] + [bonus_number]
    elif grade == 3:  # 3등 - 5개만 맞춤
        other_numbers = [n for n in range(1, 46) if n not in winning_numbers]
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
            return generate_realistic_numbers()

def generate_realistic_datetime():
    """구매 기간 내에서 현실적인 시간 생성"""
    # 시간대별 가중치 (오후/저녁에 더 많이)
    time_weights = [
        (6, 12, 0.15),   # 오전
        (12, 18, 0.35),  # 오후
        (18, 22, 0.50)   # 저녁
    ]
    
    # 랜덤하게 날짜 선택 (구매 기간 내)
    days_diff = (PURCHASE_END - PURCHASE_START).days
    random_day = random.randint(0, days_diff)
    base_date = PURCHASE_START + timedelta(days=random_day)
    
    # 시간대별 가중치로 시간 선택
    rand = random.random()
    cumulative = 0
    for start_hour, end_hour, weight in time_weights:
        cumulative += weight
        if rand <= cumulative:
            hour = random.randint(start_hour, end_hour - 1)
            minute = random.randint(0, 59)
            second = random.randint(0, 59)
            return base_date.replace(hour=hour, minute=minute, second=second)
    
    # 기본값 (오후 2시)
    return base_date.replace(hour=14, minute=0, second=0)

def create_public_recommendation(numbers, generation_method, user_type, confidence_score=None, created_at=None):
    """공공 추천 데이터 생성"""
    return {
        "numbers": numbers,
        "generation_method": generation_method,
        "confidence_score": confidence_score,
        "analysis_data": None,
        "draw_number": DRAW_NUMBER,
        "user_type": user_type,
        "created_at": created_at.isoformat() if created_at else None
    }

def send_recommendation(data):
    """API로 추천 데이터 전송"""
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/v1/public-recommendations",
            json=data,
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

def clear_existing_data():
    """기존 1188회차 데이터 정리"""
    print("기존 1188회차 데이터 정리 중...")
    try:
        # 공공 추천 데이터 삭제
        response = requests.delete(f"{API_BASE_URL}/api/v1/public-recommendations?draw_number=1188")
        print(f"기존 데이터 정리: {response.status_code}")
    except Exception as e:
        print(f"데이터 정리 실패: {e}")

def main():
    print(f"1188회차 현실적인 공공 추천 데이터 생성 시작...")
    print(f"당첨번호: {WINNING_NUMBERS}, 보너스: {BONUS_NUMBER}")
    print(f"구매 기간: {PURCHASE_START.strftime('%Y-%m-%d')} ~ {PURCHASE_END.strftime('%Y-%m-%d %H:%M')}")
    
    # 기존 데이터 정리
    clear_existing_data()
    time.sleep(2)
    
    # 목표 당첨 통계
    target_stats = {
        1: 1,   # 1등 1개
        2: 1,   # 2등 1개
        3: 5,   # 3등 5개
        4: 87,  # 4등 87개
        5: 134, # 5등 134개
        0: 1772 # 낙첨 1772개 (총 2000개)
    }
    
    total_created = 0
    success_count = 0
    
    # 각 등수별로 데이터 생성
    for grade, count in target_stats.items():
        print(f"\n{grade}등 데이터 {count}개 생성 중...")
        
        for i in range(count):
            if grade > 0:
                # 당첨 번호 생성
                numbers = generate_winning_combination(WINNING_NUMBERS, BONUS_NUMBER, grade)
            else:
                # 낙첨 번호 생성 (현실적인 패턴)
                numbers = generate_realistic_numbers()
            
            # 생성 방법과 사용자 타입 랜덤 선택
            generation_method = random.choice(["ai", "manual"])
            user_type = random.choice(["member", "guest"])
            
            # AI 추천의 경우 신뢰도 설정
            confidence_score = None
            if generation_method == "ai":
                confidence_score = random.randint(60, 95)
            
            # 현실적인 생성 시간
            created_at = generate_realistic_datetime()
            
            # 데이터 생성
            data = create_public_recommendation(
                numbers, generation_method, user_type, confidence_score, created_at
            )
            
            # API 전송
            if send_recommendation(data):
                success_count += 1
                total_created += 1
                
                if total_created % 100 == 0:
                    print(f"진행률: {total_created}/2000 ({total_created/20:.1f}%)")
            
            # API 부하 방지를 위한 짧은 대기
            if total_created % 50 == 0:
                time.sleep(0.1)
    
    print(f"\n데이터 생성 완료!")
    print(f"총 생성: {total_created}개")
    print(f"성공: {success_count}개")
    print(f"실패: {total_created - success_count}개")

if __name__ == "__main__":
    main()
