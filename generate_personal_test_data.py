#!/usr/bin/env python3
"""
lee@example.com 계정용 1188회차 개인 저장 데이터 생성
3,4,5등 당첨 데이터 포함
"""

import requests
import json
import random
from datetime import datetime, timedelta

# API 설정
BASE_URL = "http://localhost:8000"
EMAIL = "lee@example.com"
PASSWORD = "rkdcjfIP"

# 1188회차 당첨 번호 (실제 데이터)
WINNING_NUMBERS = [3, 4, 12, 19, 22, 27]
BONUS_NUMBER = 9
DRAW_NUMBER = 1188

def register_user():
    """사용자 회원가입"""
    register_data = {
        "email": EMAIL,
        "password": PASSWORD,
        "nickname": "Lee Test User",
        "role": "user"
    }
    
    response = requests.post(f"{BASE_URL}/api/v1/auth/register/email", json=register_data)
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            print("✅ 회원가입 성공")
            return data["data"]["access_token"]
        else:
            print(f"회원가입 실패: {data.get('error', {}).get('message', '알 수 없는 오류')}")
            return None
    else:
        print(f"회원가입 실패: {response.status_code}")
        print(response.text)
        return None

def login_user():
    """사용자 로그인 (통합 인증 시스템)"""
    login_data = {
        "email": EMAIL,
        "password": PASSWORD
    }
    
    response = requests.post(f"{BASE_URL}/api/v1/auth/login/email", json=login_data)
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            return data["data"]["access_token"]
        else:
            print(f"로그인 실패: {data.get('error', {}).get('message', '알 수 없는 오류')}")
            return None
    else:
        print(f"로그인 실패: {response.status_code}")
        print(response.text)
        return None

def get_auth_token():
    """인증 토큰 획득 (회원가입 또는 로그인)"""
    # 먼저 로그인 시도
    token = login_user()
    if token:
        return token
    
    # 로그인 실패 시 회원가입 시도
    print("로그인 실패, 회원가입 시도 중...")
    token = register_user()
    if token:
        return token
    
    return None

def create_saved_recommendation(token, numbers, tags=None, is_winner=False, win_rank=None):
    """개인 저장 추천 데이터 생성"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    data = {
        "numbers": numbers,
        "target_draw_number": DRAW_NUMBER,
        "generation_method": "manual",
        "confidence_score": random.uniform(0.1, 0.9),  # 0.1~0.9 사이의 랜덤 신뢰도
        "tags": tags or [],
        "is_favorite": random.choice([True, False]),
        "is_purchased": random.choice([True, False]),
        "is_winner": is_winner,
        "winning_rank": win_rank
    }
    
    response = requests.post(f"{BASE_URL}/api/v1/saved-recommendations", 
                           headers=headers, json=data)
    
    if response.status_code == 200:
        print(f"✅ 저장 성공: {numbers} (당첨: {is_winner}, 등수: {win_rank})")
        return True
    else:
        print(f"❌ 저장 실패: {response.status_code}")
        print(response.text)
        return False

def generate_winning_combination(win_rank):
    """당첨 등수별 번호 조합 생성"""
    if win_rank == 3:  # 3등: 5개 일치
        # 당첨번호 5개 + 다른 번호 1개
        matched = random.sample(WINNING_NUMBERS, 5)
        other_numbers = [n for n in range(1, 46) if n not in WINNING_NUMBERS and n != BONUS_NUMBER]
        unmatched = random.sample(other_numbers, 1)
        return sorted(matched + unmatched)
    
    elif win_rank == 4:  # 4등: 4개 일치
        # 당첨번호 4개 + 다른 번호 2개
        matched = random.sample(WINNING_NUMBERS, 4)
        other_numbers = [n for n in range(1, 46) if n not in WINNING_NUMBERS and n != BONUS_NUMBER]
        unmatched = random.sample(other_numbers, 2)
        return sorted(matched + unmatched)
    
    elif win_rank == 5:  # 5등: 3개 일치
        # 당첨번호 3개 + 다른 번호 3개
        matched = random.sample(WINNING_NUMBERS, 3)
        other_numbers = [n for n in range(1, 46) if n not in WINNING_NUMBERS and n != BONUS_NUMBER]
        unmatched = random.sample(other_numbers, 3)
        return sorted(matched + unmatched)
    
    else:  # 낙첨
        # 당첨번호 0-2개 + 다른 번호
        matched_count = random.randint(0, 2)
        if matched_count > 0:
            matched = random.sample(WINNING_NUMBERS, matched_count)
        else:
            matched = []
        
        other_numbers = [n for n in range(1, 46) if n not in WINNING_NUMBERS and n != BONUS_NUMBER]
        remaining_count = 6 - matched_count
        unmatched = random.sample(other_numbers, remaining_count)
        return sorted(matched + unmatched)

def main():
    print("🎯 lee@example.com 계정용 1188회차 개인 저장 데이터 생성 시작")
    print(f"당첨번호: {WINNING_NUMBERS} + {BONUS_NUMBER}")
    print("-" * 50)
    
    # 인증 토큰 획득 (로그인 또는 회원가입)
    token = get_auth_token()
    if not token:
        print("❌ 인증 실패로 종료")
        return
    
    print("✅ 로그인 성공")
    
    # 기존 1188회차 데이터 삭제 (선택사항)
    print("\n🗑️ 기존 1188회차 데이터 확인 중...")
    
    # 테스트 데이터 생성
    test_data = [
        # 3등 당첨 (2개)
        {"win_rank": 3, "tags": ["행운의 조합", "AI 추천"]},
        {"win_rank": 3, "tags": ["수동 입력", "특별한 날"]},
        
        # 4등 당첨 (3개)
        {"win_rank": 4, "tags": ["패턴 분석", "통계 기반"]},
        {"win_rank": 4, "tags": ["랜덤 조합"]},
        {"win_rank": 4, "tags": ["과거 데이터", "AI 추천"]},
        
        # 5등 당첨 (2개)
        {"win_rank": 5, "tags": ["빈도 분석"]},
        {"win_rank": 5, "tags": ["수동 입력", "직감"]},
        
        # 낙첨 (3개)
        {"win_rank": None, "tags": ["테스트 조합"]},
        {"win_rank": None, "tags": ["랜덤", "실험"]},
        {"win_rank": None, "tags": ["AI 추천", "분석"]},
    ]
    
    success_count = 0
    
    for i, data in enumerate(test_data, 1):
        print(f"\n📝 {i}/10 데이터 생성 중...")
        
        # 번호 생성
        numbers = generate_winning_combination(data["win_rank"])
        
        # 저장
        if create_saved_recommendation(token, numbers, data["tags"], 
                                     is_winner=(data["win_rank"] is not None), 
                                     win_rank=data["win_rank"]):
            success_count += 1
    
    print("\n" + "=" * 50)
    print(f"🎉 데이터 생성 완료!")
    print(f"✅ 성공: {success_count}/10")
    print(f"❌ 실패: {10 - success_count}/10")
    print("\n📊 생성된 데이터:")
    print("- 3등 당첨: 2개")
    print("- 4등 당첨: 3개") 
    print("- 5등 당첨: 2개")
    print("- 낙첨: 3개")
    print(f"\n🔗 당첨 이력 확인: http://localhost:3000/winning-history")

if __name__ == "__main__":
    main()
