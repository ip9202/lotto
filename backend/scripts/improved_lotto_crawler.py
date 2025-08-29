#!/usr/bin/env python3
"""
동행복권 사이트 크롤링 개선 버전
엑셀 다운로드 기능과 JavaScript 렌더링을 고려한 스크립트
"""

import requests
import time
import logging
import re
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import pandas as pd
import sys
import os

# 프로젝트 루트 디렉토리를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.lotto import LottoDraw

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ImprovedLottoCrawler:
    """개선된 로또 크롤러"""
    
    def __init__(self, use_selenium=True):
        self.use_selenium = use_selenium
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        if use_selenium:
            self.setup_selenium()
    
    def setup_selenium(self):
        """Selenium 설정"""
        try:
            chrome_options = Options()
            chrome_options.add_argument('--headless')  # 헤드리스 모드
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            
            self.driver = webdriver.Chrome(options=chrome_options)
            logger.info("Selenium Chrome 드라이버 초기화 성공")
        except Exception as e:
            logger.error(f"Selenium 초기화 실패: {e}")
            self.use_selenium = False
    
    def get_latest_draw_number(self):
        """최신 회차 번호 확인"""
        try:
            if self.use_selenium:
                return self.get_latest_draw_selenium()
            else:
                return self.get_latest_draw_requests()
        except Exception as e:
            logger.error(f"최신 회차 확인 실패: {e}")
            return 1186  # 기본값
    
    def get_latest_draw_selenium(self):
        """Selenium으로 최신 회차 확인"""
        try:
            self.driver.get("https://www.dhlottery.co.kr/")
            time.sleep(3)  # 페이지 로딩 대기
            
            # 회차 관련 텍스트 찾기
            page_source = self.driver.page_source
            draw_pattern = r'(\d+)회'
            matches = re.findall(draw_pattern, page_source)
            
            if matches:
                latest = max([int(x) for x in matches])
                logger.info(f"Selenium으로 최신 회차 확인: {latest}")
                return latest
            
            return 1186
        except Exception as e:
            logger.error(f"Selenium 최신 회차 확인 실패: {e}")
            return 1186
    
    def get_latest_draw_requests(self):
        """requests로 최신 회차 확인"""
        try:
            response = self.session.get("https://www.dhlottery.co.kr/")
            response.raise_for_status()
            
            # 회차 패턴 찾기
            draw_pattern = r'(\d+)회'
            matches = re.findall(draw_pattern, response.text)
            
            if matches:
                latest = max([int(x) for x in matches])
                logger.info(f"requests로 최신 회차 확인: {latest}")
                return latest
            
            return 1186
        except Exception as e:
            logger.error(f"requests 최신 회차 확인 실패: {e}")
            return 1186
    
    def fetch_draw_data_selenium(self, draw_number):
        """Selenium으로 특정 회차 데이터 수집"""
        try:
            # 당첨번호 상세 페이지 URL
            detail_url = f"https://www.dhlottery.co.kr/gameResult.do?method=byWin&drwNo={draw_number}"
            
            self.driver.get(detail_url)
            time.sleep(3)  # 페이지 로딩 대기
            
            # 당첨번호 추출
            numbers = []
            
            # 당첨번호 6개 찾기
            win_numbers = self.driver.find_elements(By.CSS_SELECTOR, ".num.win .ball_645")
            for ball in win_numbers[:6]:
                number_text = ball.text.strip()
                if number_text.isdigit() and 1 <= int(number_text) <= 45:
                    numbers.append(int(number_text))
            
            # 보너스 번호 찾기
            bonus_ball = self.driver.find_element(By.CSS_SELECTOR, ".num.bonus .ball_645")
            bonus_number = int(bonus_ball.text.strip()) if bonus_ball.text.strip().isdigit() else None
            
            # 당첨일 찾기
            try:
                date_element = self.driver.find_element(By.CSS_SELECTOR, ".win_result .desc")
                date_text = date_element.text.strip()
                # 날짜 패턴 추출 (예: "2025년 8월 23일")
                date_match = re.search(r'(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일', date_text)
                if date_match:
                    year, month, day = map(int, date_match.groups())
                    draw_date = datetime(year, month, day)
                else:
                    draw_date = None
            except:
                draw_date = None
            
            if len(numbers) == 6:
                return {
                    'draw_number': draw_number,
                    'numbers': numbers,
                    'bonus_number': bonus_number,
                    'draw_date': draw_date,
                    'first_winners': 0,
                    'first_amount': 0
                }
            
            return None
            
        except Exception as e:
            logger.error(f"회차 {draw_number} Selenium 데이터 수집 실패: {e}")
            return None
    
    def fetch_draw_data_requests(self, draw_number):
        """requests로 특정 회차 데이터 수집 (기본 방법)"""
        try:
            # 당첨번호 상세 페이지 URL
            detail_url = f"https://www.dhlottery.co.kr/gameResult.do?method=byWin&drwNo={draw_number}"
            
            response = self.session.get(detail_url)
            response.raise_for_status()
            
            # HTML에서 번호 추출 (기본적인 방법)
            content = response.text
            
            # 번호 패턴 찾기 (실제 사이트 구조에 맞게 수정 필요)
            number_pattern = r'(\d{1,2})'
            all_numbers = re.findall(number_pattern, content)
            
            # 1-45 범위의 번호만 필터링
            valid_numbers = []
            for num in all_numbers:
                num_int = int(num)
                if 1 <= num_int <= 45 and num_int not in valid_numbers:
                    valid_numbers.append(num_int)
                    if len(valid_numbers) >= 7:  # 6개 + 보너스 1개
                        break
            
            if len(valid_numbers) >= 6:
                main_numbers = valid_numbers[:6]
                bonus_number = valid_numbers[6] if len(valid_numbers) > 6 else None
                
                return {
                    'draw_number': draw_number,
                    'numbers': main_numbers,
                    'bonus_number': bonus_number,
                    'draw_date': None,
                    'first_winners': 0,
                    'first_amount': 0
                }
            
            return None
            
        except Exception as e:
            logger.error(f"회차 {draw_number} requests 데이터 수집 실패: {e}")
            return None
    
    def fetch_all_draws(self, start_draw=1, end_draw=None):
        """지정된 범위의 모든 회차 데이터 수집"""
        if end_draw is None:
            end_draw = self.get_latest_draw_number()
        
        all_draws = []
        
        for draw_number in range(start_draw, end_draw + 1):
            logger.info(f"회차 {draw_number} 데이터 수집 중...")
            
            if self.use_selenium:
                draw_data = self.fetch_draw_data_selenium(draw_number)
            else:
                draw_data = self.fetch_draw_data_requests(draw_number)
            
            if draw_data:
                all_draws.append(draw_data)
                logger.info(f"회차 {draw_number} 수집 완료: {draw_data['numbers']}")
            else:
                logger.warning(f"회차 {draw_number} 데이터 수집 실패")
            
            # 서버 부하 방지를 위한 딜레이
            time.sleep(2)
        
        return all_draws
    
    def download_excel_data(self, start_draw, end_draw):
        """엑셀 다운로드 기능 (향후 구현)"""
        logger.info(f"엑셀 다운로드 기능은 향후 구현 예정")
        logger.info(f"동행복권 사이트에서 {start_draw}회차부터 {end_draw}회차까지 엑셀 다운로드")
        logger.info(f"URL: https://www.dhlottery.co.kr/gameResult.do?method=byWin")
        return None
    
    def cleanup(self):
        """리소스 정리"""
        if self.use_selenium and hasattr(self, 'driver'):
            self.driver.quit()
            logger.info("Selenium 드라이버 종료")

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
                existing.numbers = draw_data['numbers']
                existing.bonus_number = draw_data['bonus_number']
                existing.draw_date = draw_data['draw_date']
                existing.first_winners = draw_data['first_winners']
                existing.first_amount = draw_data['first_amount']
            else:
                logger.info(f"회차 {draw_data['draw_number']} 새로 추가")
                new_draw = LottoDraw(
                    draw_number=draw_data['draw_number'],
                    numbers=draw_data['numbers'],
                    bonus_number=draw_data['bonus_number'],
                    draw_date=draw_data['draw_date'],
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
    logger.info("개선된 로또 크롤러 시작")
    
    # Selenium 사용 여부 확인
    use_selenium = input("Selenium을 사용하시겠습니까? (y/n, 기본: n): ").strip().lower() == 'y'
    
    crawler = None
    try:
        # 크롤러 초기화
        crawler = ImprovedLottoCrawler(use_selenium=use_selenium)
        
        # 최신 회차 확인
        latest_draw = crawler.get_latest_draw_number()
        logger.info(f"최신 회차: {latest_draw}")
        
        # 수집할 회차 범위 입력
        start_draw = input(f"시작 회차 (기본: 1): ").strip()
        start_draw = int(start_draw) if start_draw else 1
        
        end_draw = input(f"종료 회차 (기본: {latest_draw}): ").strip()
        end_draw = int(end_draw) if end_draw else latest_draw
        
        logger.info(f"{start_draw}회차부터 {end_draw}회차까지 데이터 수집 시작...")
        
        # 데이터 수집
        all_draws = crawler.fetch_all_draws(start_draw=start_draw, end_draw=end_draw)
        
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
    finally:
        if crawler:
            crawler.cleanup()

if __name__ == "__main__":
    main()

