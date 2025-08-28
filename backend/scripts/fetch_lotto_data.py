#!/usr/bin/env python3
"""
동행복권 공식 사이트에서 당첨번호 데이터를 자동으로 수집하는 스크립트
1회차부터 현재까지의 모든 당첨번호를 수집하여 데이터베이스에 저장
"""

import requests
import pandas as pd
import time
import logging
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import sys
import os

# 프로젝트 루트 디렉토리를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, SessionLocal
from app.models.lotto import LottoDraw

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class LottoDataFetcher:
    """동행복권 당첨번호 데이터 수집기"""
    
    def __init__(self):
        self.base_url = "https://www.dhlottery.co.kr/common.do"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
    def fetch_draw_data(self, draw_number):
        """특정 회차의 당첨번호 데이터 수집"""
        try:
            params = {
                'method': 'main',
                'searchType': '1',
                'searchWord': str(draw_number)
            }
            
            response = self.session.get(self.base_url, params=params)
            response.raise_for_status()
            
            # HTML에서 당첨번호 추출 (간단한 파싱)
            # 실제로는 더 정교한 파싱이 필요할 수 있음
            content = response.text
            
            # 당첨번호 패턴 찾기 (실제 사이트 구조에 맞게 수정 필요)
            # 예시: <span class="num">1</span> 형태
            import re
            
            # 번호 추출 패턴 (실제 사이트에 맞게 수정 필요)
            number_pattern = r'<span[^>]*class="[^"]*num[^"]*"[^>]*>(\d+)</span>'
            numbers = re.findall(number_pattern, content)
            
            if len(numbers) >= 6:
                main_numbers = [int(n) for n in numbers[:6]]
                bonus_number = int(numbers[6]) if len(numbers) > 6 else None
                
                # 당첨일 추출 (실제 사이트에 맞게 수정 필요)
                date_pattern = r'(\d{4}-\d{2}-\d{2})'
                date_match = re.search(date_pattern, content)
                draw_date = date_match.group(1) if date_match else None
                
                # 당첨자 수 및 금액 추출 (실제 사이트에 맞게 수정 필요)
                winner_pattern = r'(\d+)명'
                winner_match = re.search(winner_pattern, content)
                first_winners = int(winner_match.group(1)) if winner_match else 0
                
                amount_pattern = r'(\d{1,3}(?:,\d{3})*)원'
                amount_match = re.search(amount_pattern, content)
                first_amount = int(amount_match.group(1).replace(',', '')) if amount_match else 0
                
                return {
                    'draw_number': draw_number,
                    'numbers': main_numbers,
                    'bonus_number': bonus_number,
                    'draw_date': draw_date,
                    'first_winners': first_winners,
                    'first_amount': first_amount
                }
            
            return None
            
        except Exception as e:
            logger.error(f"회차 {draw_number} 데이터 수집 실패: {e}")
            return None
    
    def fetch_all_draws(self, start_draw=1, end_draw=None):
        """지정된 범위의 모든 회차 데이터 수집"""
        if end_draw is None:
            # 현재 회차를 자동으로 찾기 (실제로는 사이트에서 확인 필요)
            end_draw = self.get_latest_draw_number()
        
        all_draws = []
        
        for draw_number in range(start_draw, end_draw + 1):
            logger.info(f"회차 {draw_number} 데이터 수집 중...")
            
            draw_data = self.fetch_draw_data(draw_number)
            if draw_data:
                all_draws.append(draw_data)
                logger.info(f"회차 {draw_number} 수집 완료: {draw_data['numbers']}")
            else:
                logger.warning(f"회차 {draw_number} 데이터 수집 실패")
            
            # 서버 부하 방지를 위한 딜레이
            time.sleep(1)
        
        return all_draws
    
    def get_latest_draw_number(self):
        """최신 회차 번호 확인"""
        try:
            # 동행복권 메인 페이지에서 최신 회차 확인
            response = self.session.get("https://www.dhlottery.co.kr/")
            response.raise_for_status()
            
            # 최신 회차 패턴 찾기 (실제 사이트에 맞게 수정 필요)
            import re
            latest_pattern = r'(\d+)회'
            latest_match = re.search(latest_pattern, response.text)
            
            if latest_match:
                return int(latest_match.group(1))
            else:
                # 기본값 (2025년 8월 기준 대략적인 회차)
                return 1200
                
        except Exception as e:
            logger.error(f"최신 회차 확인 실패: {e}")
            # 기본값 반환
            return 1200

def save_to_database(draws_data):
    """수집된 데이터를 데이터베이스에 저장"""
    db = SessionLocal()
    
    try:
        for draw_data in draws_data:
            # 기존 데이터 확인
            existing = db.query(LottoDraw).filter(
                LottoDraw.draw_number == draw_data['draw_number']
            ).first()
            
            if existing:
                logger.info(f"회차 {draw_data['draw_number']} 이미 존재함 - 업데이트")
                # 기존 데이터 업데이트
                existing.numbers = draw_data['numbers']
                existing.bonus_number = draw_data['bonus_number']
                existing.draw_date = datetime.strptime(draw_data['draw_date'], '%Y-%m-%d') if draw_data['draw_date'] else None
                existing.first_winners = draw_data['first_winners']
                existing.first_amount = draw_data['first_amount']
            else:
                logger.info(f"회차 {draw_data['draw_number']} 새로 추가")
                # 새 데이터 추가
                new_draw = LottoDraw(
                    draw_number=draw_data['draw_number'],
                    numbers=draw_data['numbers'],
                    bonus_number=draw_data['bonus_number'],
                    draw_date=datetime.strptime(draw_data['draw_date'], '%Y-%m-%d') if draw_data['draw_date'] else None,
                    first_winners=draw_data['first_winners'],
                    first_amount=draw_data['first_amount']
                )
                db.add(new_draw)
        
        db.commit()
        logger.info(f"총 {len(draws_data)}개 회차 데이터 저장 완료")
        
    except Exception as e:
        logger.error(f"데이터베이스 저장 실패: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def main():
    """메인 실행 함수"""
    logger.info("동행복권 당첨번호 데이터 수집 시작")
    
    try:
        # 데이터 수집기 초기화
        fetcher = LottoDataFetcher()
        
        # 최신 회차 확인
        latest_draw = fetcher.get_latest_draw_number()
        logger.info(f"최신 회차: {latest_draw}")
        
        # 1회차부터 최신 회차까지 데이터 수집
        logger.info("1회차부터 데이터 수집 시작...")
        all_draws = fetcher.fetch_all_draws(start_draw=1, end_draw=latest_draw)
        
        if all_draws:
            logger.info(f"총 {len(all_draws)}개 회차 데이터 수집 완료")
            
            # 데이터베이스에 저장
            save_to_database(all_draws)
            
            logger.info("데이터 수집 및 저장 완료!")
        else:
            logger.error("수집된 데이터가 없습니다.")
            
    except Exception as e:
        logger.error(f"데이터 수집 실패: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
