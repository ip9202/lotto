import logging
from datetime import datetime, time, date, timedelta
from typing import List, Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
import requests
from bs4 import BeautifulSoup
import re

from ..database import get_db
from ..models.lotto import LottoDraw

logger = logging.getLogger(__name__)

class AutoUpdater:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.is_running = False
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        # 기본 스케줄러 설정 (매주 토요일 오후 9시 20분)
        self.schedule_config = {
            'day_of_week': 'sat',  # 0=월요일, 6=일요일
            'hour': 21,
            'minute': 20
        }
        
    def start_scheduler(self):
        """스케줄러 시작 - 개선된 버전"""
        try:
            if not self.is_running:
                # 기존 작업이 있다면 제거
                try:
                    self.scheduler.remove_job('weekly_lotto_update')
                    logger.info("기존 스케줄러 작업을 제거했습니다.")
                except:
                    pass  # 기존 작업이 없을 수 있음
                
                # 매주 토요일 실행되도록 설정
                self.scheduler.add_job(
                    self.check_and_update_latest_data,
                    CronTrigger(
                        day_of_week=self.schedule_config['day_of_week'],
                        hour=self.schedule_config['hour'],
                        minute=self.schedule_config['minute']
                    ),
                    id='weekly_lotto_update',
                    name=f"매주 토요일 {self.schedule_config['hour']:02d}:{self.schedule_config['minute']:02d} 로또 데이터 업데이트",
                    max_instances=1,  # 동시 실행 방지
                    coalesce=True,    # 누적된 작업을 하나로 합치기
                    misfire_grace_time=300  # 5분 내 실행 지연 허용
                )
                
                self.scheduler.start()
                self.is_running = True
                logger.info(f"자동 업데이트 스케줄러가 시작되었습니다. (매주 토요일 {self.schedule_config['hour']:02d}:{self.schedule_config['minute']:02d})")
                
                # 다음 실행 시간 로그
                jobs = self.scheduler.get_jobs()
                for job in jobs:
                    if job.id == 'weekly_lotto_update':
                        logger.info(f"다음 실행 예정 시간: {job.next_run_time}")
            else:
                logger.info("스케줄러가 이미 실행 중입니다.")
                
        except Exception as e:
            logger.error(f"스케줄러 시작 실패: {str(e)}")
            self.is_running = False
            
    def stop_scheduler(self):
        """스케줄러 중지 - 개선된 버전"""
        if self.is_running:
            try:
                self.scheduler.shutdown(wait=False)
                self.is_running = False
                logger.info("자동 업데이트 스케줄러가 중지되었습니다.")
            except Exception as e:
                logger.error(f"스케줄러 중지 실패: {str(e)}")
                self.is_running = False
    
    def _get_day_name(self, day_of_week: str) -> str:
        """요일 코드를 한국어 이름으로 변환"""
        day_names = {
            'mon': '월요일',
            'tue': '화요일', 
            'wed': '수요일',
            'thu': '목요일',
            'fri': '금요일',
            'sat': '토요일',
            'sun': '일요일'
        }
        return day_names.get(day_of_week, '알 수 없음')
    
    def update_schedule(self, day_of_week: str, hour: int, minute: int):
        """스케줄러 설정 업데이트 (매주 토요일 실행)"""
        # 설정 업데이트
        self.schedule_config = {
            'day_of_week': day_of_week,
            'hour': hour,
            'minute': minute
        }
        
        # 실행 중인 경우 기존 작업 제거 후 재시작
        if self.is_running:
            try:
                # 기존 작업 제거
                self.scheduler.remove_job('weekly_lotto_update')
                logger.info("기존 스케줄러 작업을 제거했습니다.")
            except Exception as e:
                logger.warning(f"기존 작업 제거 중 오류 (무시됨): {e}")
            
            # 새 설정으로 작업 추가 (매주 토요일 실행)
            self.scheduler.add_job(
                self.check_and_update_latest_data,
                CronTrigger(
                    day_of_week=day_of_week,
                    hour=hour,
                    minute=minute
                ),
                id='weekly_lotto_update',
                name=f"매주 토요일 {hour:02d}:{minute:02d} 로또 데이터 업데이트"
            )
            logger.info(f"스케줄러 설정이 업데이트되었습니다. (매주 토요일 {hour:02d}:{minute:02d})")
    
    def get_schedule_config(self) -> dict:
        """현재 스케줄러 설정 반환"""
        return {
            'day_of_week': self.schedule_config['day_of_week'],
            'day_name': self._get_day_name(self.schedule_config['day_of_week']),
            'hour': self.schedule_config['hour'],
            'minute': self.schedule_config['minute'],
            'is_running': self.is_running
        }
            
    async def check_and_update_latest_data(self):
        """최신 데이터 확인 및 업데이트 (자동 실행) - 개선된 버전"""
        max_retries = 3
        retry_delay = 5
        
        for attempt in range(max_retries):
            try:
                logger.info(f"자동 데이터 업데이트를 시작합니다... (시도 {attempt + 1}/{max_retries})")
                
                # DB 세션 관리 개선
                db = next(get_db())
                try:
                    # DB에서 최신 회차 확인
                    latest_db_draw = self._get_latest_draw_number(db)
                    logger.info(f"현재 DB 최신 회차: {latest_db_draw}")
                    
                    # 로또 사이트에서 최신 회차 확인
                    latest_site_draw = await self._get_latest_site_draw_number()
                    logger.info(f"사이트 최신 회차: {latest_site_draw}")
                    
                    if latest_site_draw > latest_db_draw:
                        logger.info(f"새로운 데이터가 발견되었습니다. {latest_db_draw + 1}회차부터 {latest_site_draw}회차까지")
                        
                        # 새로운 데이터 스크래핑 및 입력
                        new_draws = await self._scrape_new_draws(latest_db_draw + 1, latest_site_draw)
                        
                        if new_draws:
                            self._insert_new_draws(db, new_draws)
                            logger.info(f"자동 업데이트가 완료되었습니다. {len(new_draws)}개 회차가 추가되었습니다.")
                            
                            # 업데이트 성공 시 즉시 반환
                            return
                        else:
                            logger.warning("스크래핑된 데이터가 없습니다. 재시도합니다...")
                            if attempt < max_retries - 1:
                                import asyncio
                                await asyncio.sleep(retry_delay)
                                continue
                    else:
                        logger.info("새로운 데이터가 없습니다.")
                        return
                        
                finally:
                    # DB 세션 명시적 닫기
                    db.close()
                    
            except Exception as e:
                logger.error(f"자동 업데이트 시도 {attempt + 1} 실패: {str(e)}")
                import traceback
                logger.error(f"상세 오류: {traceback.format_exc()}")
                
                if attempt < max_retries - 1:
                    logger.info(f"{retry_delay}초 후 재시도합니다...")
                    import asyncio
                    await asyncio.sleep(retry_delay)
                else:
                    logger.error("모든 재시도가 실패했습니다. 자동 업데이트를 중단합니다.")
            
    def _get_latest_draw_number(self, db: Session) -> int:
        """DB에서 최신 회차 조회"""
        latest_draw = db.query(LottoDraw).order_by(LottoDraw.draw_number.desc()).first()
        return latest_draw.draw_number if latest_draw else 0
        
    async def _get_latest_site_draw_number(self) -> int:
        """로또 사이트에서 최신 회차 조회 (재시도 메커니즘 포함)"""
        max_retries = 3
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                # 동행복권 당첨번호 페이지에서 최신 회차 확인
                url = "https://www.dhlottery.co.kr/gameResult.do?method=byWin"
                
                # 요청 헤더 강화
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                }
                
                response = self.session.get(url, headers=headers, timeout=15)
                response.raise_for_status()
                
                # EUC-KR 인코딩으로 디코딩
                response.encoding = 'euc-kr'
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # 최신 회차 정보 찾기 (win_result div 안의 h4 > strong)
                win_result_div = soup.find('div', class_='win_result')
                if win_result_div:
                    h4_element = win_result_div.find('h4')
                    if h4_element:
                        latest_draw_element = h4_element.find('strong')
                        if latest_draw_element:
                            # "1186회" 같은 텍스트에서 숫자 추출
                            draw_text = latest_draw_element.text.strip()
                            match = re.search(r'(\d+)', draw_text)
                            if match:
                                latest_draw = int(match.group(1))
                                logger.info(f"사이트에서 최신 회차 확인: {latest_draw}회차")
                                return latest_draw
                
                # 백업 방법: select 옵션에서 최신 회차 확인
                draw_select = soup.find('select', {'id': 'dwrNoList'})
                if draw_select:
                    first_option = draw_select.find('option')
                    if first_option:
                        draw_text = first_option.get('value', '').strip()
                        if draw_text.isdigit():
                            latest_draw = int(draw_text)
                            logger.info(f"select에서 최신 회차 확인: {latest_draw}회차")
                            return latest_draw
                
                logger.warning(f"시도 {attempt + 1}: HTML 구조에서 회차 정보를 찾을 수 없습니다.")
                
            except requests.exceptions.RequestException as e:
                logger.warning(f"시도 {attempt + 1} 네트워크 오류: {str(e)}")
                if attempt < max_retries - 1:
                    import asyncio
                    await asyncio.sleep(retry_delay * (attempt + 1))
                    continue
            except Exception as e:
                logger.warning(f"시도 {attempt + 1} 파싱 오류: {str(e)}")
                if attempt < max_retries - 1:
                    import asyncio
                    await asyncio.sleep(retry_delay * (attempt + 1))
                    continue
        
        # 모든 시도 실패 시 DB 기반으로 추정
        logger.warning("모든 시도가 실패했습니다. DB 기반으로 최신 회차를 추정합니다.")
        db = next(get_db())
        latest_db = self._get_latest_draw_number(db)
        return latest_db  # DB와 동일하게 설정하여 새 데이터 없음으로 처리
        
    async def _scrape_new_draws(self, start_draw: int, end_draw: int) -> List[dict]:
        """새로운 회차 데이터 스크래핑 - 개선된 버전"""
        new_draws = []
        failed_draws = []
        
        for draw_num in range(start_draw, end_draw + 1):
            max_attempts = 3
            success = False
            
            for attempt in range(max_attempts):
                try:
                    logger.info(f"{draw_num}회차 데이터 스크래핑 시작... (시도 {attempt + 1}/{max_attempts})")
                    
                    # 동행복권 당첨번호 페이지에서 데이터 스크래핑
                    draw_data = await self._scrape_single_draw(draw_num)
                    
                    if draw_data:
                        new_draws.append(draw_data)
                        logger.info(f"{draw_num}회차 스크래핑 성공: {draw_data['numbers']} + {draw_data['bonus_number']}")
                        success = True
                        break
                    else:
                        logger.warning(f"{draw_num}회차 시도 {attempt + 1}: 데이터를 찾을 수 없습니다.")
                        
                except Exception as e:
                    logger.error(f"{draw_num}회차 시도 {attempt + 1} 실패: {str(e)}")
                    
                # 재시도 전 대기
                if attempt < max_attempts - 1:
                    import asyncio
                    await asyncio.sleep(2 * (attempt + 1))  # 점진적 대기 시간
            
            if not success:
                failed_draws.append(draw_num)
                logger.error(f"{draw_num}회차: 모든 시도가 실패했습니다.")
        
        # 결과 요약
        if failed_draws:
            logger.warning(f"스크래핑 실패한 회차: {failed_draws}")
        logger.info(f"스크래핑 완료: 성공 {len(new_draws)}개, 실패 {len(failed_draws)}개")
        
        return new_draws
        
    async def _scrape_single_draw(self, draw_number: int) -> Optional[dict]:
        """단일 회차 데이터 스크래핑 (개선된 버전)"""
        max_retries = 3
        retry_delay = 1
        
        for attempt in range(max_retries):
            try:
                # 동행복권 당첨번호 조회 페이지 (POST 방식)
                url = "https://www.dhlottery.co.kr/gameResult.do?method=byWin"
                
                # 강화된 헤더
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Referer': 'https://www.dhlottery.co.kr/gameResult.do?method=byWin',
                }
                
                data = {'drwNo': str(draw_number)}
                response = self.session.post(url, data=data, headers=headers, timeout=15)
                response.raise_for_status()
                
                # EUC-KR 인코딩 처리
                response.encoding = 'euc-kr'
                soup = BeautifulSoup(response.text, 'html.parser')
                
                logger.info(f"{draw_number}회차 스크래핑 시도 {attempt + 1} - 응답 상태: {response.status_code}")
                
                # 회차 확인 (올바른 회차인지 검증)
                win_result_div = soup.find('div', class_='win_result')
                if not win_result_div:
                    logger.warning(f"{draw_number}회차: win_result div를 찾을 수 없습니다.")
                    continue
                    
                h4_element = win_result_div.find('h4')
                if h4_element:
                    strong_element = h4_element.find('strong')
                    if strong_element:
                        draw_text = strong_element.text.strip()
                        current_draw_match = re.search(r'(\d+)', draw_text)
                        if current_draw_match:
                            current_draw = int(current_draw_match.group(1))
                            if current_draw != draw_number:
                                logger.warning(f"요청한 {draw_number}회차와 응답 {current_draw}회차가 다릅니다.")
                                continue
                
                # 당첨번호 추출
                numbers = []
                
                # nums div 내의 win 클래스에서 당첨번호 6개 찾기
                nums_div = win_result_div.find('div', class_='nums')
                if nums_div:
                    win_div = nums_div.find('div', class_='num win')
                    if win_div:
                        # p 태그 안에서 ball_645 클래스를 포함한 span 요소들 찾기
                        p_element = win_div.find('p')
                        ball_spans = []
                        if p_element:
                            ball_spans = p_element.select('span[class*="ball_645"]')
                        
                        if len(ball_spans) >= 6:
                            for i in range(6):
                                try:
                                    number = int(ball_spans[i].text.strip())
                                    numbers.append(number)
                                except ValueError:
                                    logger.error(f"번호 파싱 실패: {ball_spans[i].text}")
                                    continue
                            
                            # 보너스번호 추출
                            bonus_div = nums_div.find('div', class_='num bonus')
                            if bonus_div:
                                bonus_p = bonus_div.find('p')
                                bonus_span = None
                                if bonus_p:
                                    bonus_spans = bonus_p.select('span[class*="ball_645"]')
                                    bonus_span = bonus_spans[0] if bonus_spans else None
                                if bonus_span:
                                    try:
                                        bonus_number = int(bonus_span.text.strip())
                                        
                                        # 추첨일 추출
                                        date_element = win_result_div.find('p', class_='desc')
                                        draw_date = datetime.now().strftime('%Y-%m-%d')  # 기본값
                                        
                                        if date_element:
                                            date_text = date_element.text.strip()
                                            date_match = re.search(r'\((\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일', date_text)
                                            if date_match:
                                                year, month, day = date_match.groups()
                                                draw_date = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                                        
                                        # 1등 당첨 정보 추출
                                        first_winners = 0
                                        first_amount = 0
                                        
                                        prize_table = soup.find('table', class_='tbl_data tbl_data_col')
                                        if prize_table:
                                            rows = prize_table.find_all('tr')
                                            for row in rows[1:]:  # 헤더 제외
                                                cells = row.find_all(['td', 'th'])
                                                if cells and len(cells) >= 4:
                                                    cell_texts = [cell.get_text().strip() for cell in cells]
                                                    # 1등인지 확인
                                                    if '1등' in cell_texts[0]:
                                                        try:
                                                            # 당첨게임 수 (당첨자 수)
                                                            winners_match = re.search(r'(\d+)', cell_texts[2])
                                                            if winners_match:
                                                                first_winners = int(winners_match.group(1))
                                                            
                                                            # 1게임당 당첨금액
                                                            amount_match = re.search(r'([\d,]+)', cell_texts[3])
                                                            if amount_match:
                                                                amount_str = amount_match.group(1).replace(',', '')
                                                                first_amount = int(amount_str)
                                                            
                                                            logger.info(f"{draw_number}회차 1등 정보: {first_winners}명, {first_amount:,}원")
                                                            break
                                                        except (ValueError, IndexError) as e:
                                                            logger.warning(f"{draw_number}회차 1등 정보 파싱 실패: {str(e)}")
                                        
                                        logger.info(f"{draw_number}회차 스크래핑 성공: {numbers} + {bonus_number}, 날짜: {draw_date}, 1등: {first_winners}명/{first_amount:,}원")
                                        
                                        return {
                                            'draw_number': draw_number,
                                            'draw_date': draw_date,
                                            'numbers': numbers,
                                            'bonus_number': bonus_number,
                                            'first_winners': first_winners,
                                            'first_amount': first_amount
                                        }
                                    except ValueError:
                                        logger.error(f"보너스번호 파싱 실패: {bonus_span.text}")
                
                logger.warning(f"{draw_number}회차 시도 {attempt + 1}: 당첨번호를 완전히 추출하지 못했습니다.")
                
            except requests.exceptions.RequestException as e:
                logger.warning(f"{draw_number}회차 시도 {attempt + 1} 네트워크 오류: {str(e)}")
            except Exception as e:
                logger.warning(f"{draw_number}회차 시도 {attempt + 1} 파싱 오류: {str(e)}")
            
            # 재시도 전 대기
            if attempt < max_retries - 1:
                import asyncio
                await asyncio.sleep(retry_delay * (attempt + 1))
        
        logger.error(f"{draw_number}회차: 모든 시도가 실패했습니다.")
        return None
    
    def _calculate_purchase_dates(self, draw_date: date) -> tuple[date, date]:
        """
        추첨일을 기준으로 구매기간 계산
        로또는 매주 토요일 추첨이므로, 전주 일요일부터 추첨일(토요일)까지가 구매기간
        """
        # 추첨일(토요일) 기준으로 해당 주의 일요일 계산
        # 토요일의 weekday()는 5
        if draw_date.weekday() != 5:  # 토요일이 아닌 경우 에러 로그
            logger.warning(f"추첨일이 토요일이 아닙니다: {draw_date} (weekday: {draw_date.weekday()})")
        
        # 이번 주 일요일 계산 (추첨일 - 6일)
        purchase_start = draw_date - timedelta(days=6)
        purchase_end = draw_date
        
        return purchase_start, purchase_end
        
    def _insert_new_draws(self, db: Session, new_draws: List[dict]):
        """새로운 데이터를 DB에 입력 (구매기간 포함)"""
        for draw_data in new_draws:
            try:
                # 추첨일을 기준으로 구매기간 자동 계산
                draw_date = draw_data['draw_date']
                # 문자열인 경우 date 객체로 변환
                if isinstance(draw_date, str):
                    draw_date = datetime.strptime(draw_date, '%Y-%m-%d').date()
                purchase_start, purchase_end = self._calculate_purchase_dates(draw_date)
                
                new_draw = LottoDraw(
                    draw_number=draw_data['draw_number'],
                    draw_date=draw_date,
                    purchase_start_date=purchase_start,
                    purchase_end_date=purchase_end,
                    number_1=draw_data['numbers'][0],
                    number_2=draw_data['numbers'][1],
                    number_3=draw_data['numbers'][2],
                    number_4=draw_data['numbers'][3],
                    number_5=draw_data['numbers'][4],
                    number_6=draw_data['numbers'][5],
                    bonus_number=draw_data['bonus_number'],
                    first_winners=draw_data.get('first_winners', 0),
                    first_amount=draw_data.get('first_amount', 0)
                )
                db.add(new_draw)
                db.commit()
                logger.info(f"{draw_data['draw_number']}회차가 성공적으로 입력되었습니다. (구매기간: {purchase_start} ~ {purchase_end})")
            except Exception as e:
                db.rollback()
                logger.error(f"{draw_data['draw_number']}회차 입력 실패: {str(e)}")

# 전역 인스턴스
auto_updater = AutoUpdater()
