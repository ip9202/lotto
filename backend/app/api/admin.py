from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any
import logging
import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime

from ..database import get_db
from ..services.auto_updater import auto_updater

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/check-latest-data")
async def check_latest_data(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """최신 데이터 상태 확인"""
    try:
        # DB에서 최신 회차 확인
        from ..models.lotto import LottoDraw
        latest_db_draw = db.query(LottoDraw).order_by(LottoDraw.draw_number.desc()).first()
        latest_db_number = latest_db_draw.draw_number if latest_db_draw else 0
        
        # 로또 사이트에서 최신 회차 확인 (실제 구현 필요)
        # 테스트용으로 1186회차까지만 발표된 것으로 가정
        latest_site_draw = 1186  # 고정값으로 1186회차까지만
        
        has_new_data = latest_site_draw > latest_db_number
        
        return {
            "success": True,
            "data": {
                "latest_db_draw": latest_db_number,
                "latest_site_draw": latest_site_draw,
                "has_new_data": has_new_data,
                "new_draws_count": latest_site_draw - latest_db_number if has_new_data else 0,
                "scheduler_status": auto_updater.is_running
            },
            "message": "최신 데이터 상태를 확인했습니다."
        }
        
    except Exception as e:
        logger.error(f"최신 데이터 확인 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"데이터 확인 실패: {str(e)}")

@router.get("/update-progress")
async def get_update_progress(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """데이터 업데이트 진행 상황 확인"""
    try:
        from ..models.lotto import LottoDraw
        
        # 현재 DB 상태
        latest_db_draw = db.query(LottoDraw.draw_number).order_by(LottoDraw.draw_number.desc()).first()
        latest_db_draw = latest_db_draw[0] if latest_db_draw else 0
        
        # 사이트 최신 회차 (개선된 스크래핑)
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            }
            
            response = requests.get('https://www.dhlottery.co.kr/gameResult.do?method=byWin', headers=headers, timeout=10)
            response.raise_for_status()
            response.encoding = 'euc-kr'
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # win_result div 안의 h4 > strong에서 회차 추출 (정확한 구조)
            win_result_div = soup.find('div', class_='win_result')
            if win_result_div:
                h4_element = win_result_div.find('h4')
                if h4_element:
                    latest_draw_element = h4_element.find('strong')
                    if latest_draw_element:
                        draw_text = latest_draw_element.text.strip()
                        match = re.search(r'(\d+)', draw_text)
                        if match:
                            latest_site_draw = int(match.group(1))
                            logger.info(f"사이트에서 최신 회차 확인: {latest_site_draw}회차")
                        else:
                            raise ValueError("회차 번호를 찾을 수 없습니다")
                    else:
                        raise ValueError("strong 태그를 찾을 수 없습니다")
                else:
                    raise ValueError("h4 태그를 찾을 수 없습니다")
            else:
                raise ValueError("win_result div를 찾을 수 없습니다")
        except Exception as e:
            logger.error(f"사이트 스크래핑 실패: {str(e)}")
            # 사이트 접근 실패 시 DB와 동일하게 설정
            latest_site_draw = latest_db_draw
        
        # 새로 추가된 데이터 개수
        new_draws_count = latest_site_draw - latest_db_draw if latest_site_draw > latest_db_draw else 0
        
        # 최근 5개 회차 상세 정보
        recent_draws = db.query(LottoDraw).order_by(LottoDraw.draw_number.desc()).limit(5).all()
        recent_draws_data = []
        for draw in recent_draws:
            recent_draws_data.append({
                "draw_number": draw.draw_number,
                "draw_date": draw.draw_date.strftime("%Y-%m-%d") if draw.draw_date else None,
                "numbers": [draw.number_1, draw.number_2, draw.number_3, draw.number_4, draw.number_5, draw.number_6],
                "bonus_number": draw.bonus_number
            })
        
        return {
            "success": True,
            "data": {
                "current_status": {
                    "latest_db_draw": latest_db_draw,
                    "latest_site_draw": latest_site_draw,
                    "new_draws_count": new_draws_count,
                    "has_new_data": new_draws_count > 0
                },
                "recent_draws": recent_draws_data,
                "progress_percentage": 100.0 if new_draws_count == 0 else round((latest_db_draw / latest_site_draw) * 100, 1),
                "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            },
            "message": "업데이트 진행 상황을 확인했습니다."
        }
        
    except Exception as e:
        logger.error(f"업데이트 진행 상황 확인 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"진행 상황 확인 실패: {str(e)}")

@router.post("/update-latest-data")
async def update_latest_data(background_tasks: BackgroundTasks, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """수동으로 최신 데이터 업데이트 실행"""
    try:
        from ..models.lotto import LottoDraw
        
        # 현재 DB 상태 확인
        latest_db_draw = db.query(LottoDraw.draw_number).order_by(LottoDraw.draw_number.desc()).first()
        latest_db_draw = latest_db_draw.draw_number if latest_db_draw else 0
        
        # 사이트 최신 회차 확인 (개선된 스크래핑)
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            }
            
            response = requests.get('https://www.dhlottery.co.kr/gameResult.do?method=byWin', headers=headers, timeout=10)
            response.raise_for_status()
            response.encoding = 'euc-kr'
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # win_result div 안의 h4 > strong에서 회차 추출 (정확한 구조)
            win_result_div = soup.find('div', class_='win_result')
            if win_result_div:
                h4_element = win_result_div.find('h4')
                if h4_element:
                    latest_draw_element = h4_element.find('strong')
                    if latest_draw_element:
                        draw_text = latest_draw_element.text.strip()
                        match = re.search(r'(\d+)', draw_text)
                        if match:
                            latest_site_draw = int(match.group(1))
                            logger.info(f"사이트에서 최신 회차 확인: {latest_site_draw}회차")
                        else:
                            raise ValueError("회차 번호를 찾을 수 없습니다")
                    else:
                        raise ValueError("strong 태그를 찾을 수 없습니다")
                else:
                    raise ValueError("h4 태그를 찾을 수 없습니다")
            else:
                raise ValueError("win_result div를 찾을 수 없습니다")
        except Exception as e:
            logger.error(f"사이트 스크래핑 실패: {str(e)}")
            # 사이트 접근 실패 시 DB와 동일하게 설정
            latest_site_draw = latest_db_draw
        
        # 새로운 데이터가 있는지 확인
        has_new_data = latest_site_draw > latest_db_draw
        
        # 디버깅을 위한 로그
        logger.info(f"DB 최신: {latest_db_draw}, 사이트 최신: {latest_site_draw}, 새로운 데이터: {has_new_data}")
        
        if has_new_data:
            # 백그라운드에서 업데이트 실행
            background_tasks.add_task(auto_updater.check_and_update_latest_data)
            
            return {
                "success": True,
                "data": {
                    "status": "started",
                    "message": f"백그라운드에서 데이터 업데이트를 시작했습니다. ({latest_db_draw + 1}~{latest_site_draw}회차)"
                },
                "message": "데이터 업데이트가 시작되었습니다."
            }
        else:
            # 이미 최신 상태
            return {
                "success": True,
                "data": {
                    "status": "already_updated",
                    "message": "이미 최신 상태입니다. 새로운 데이터가 없습니다."
                },
                "message": "이미 최신 상태입니다."
            }
        
    except Exception as e:
        logger.error(f"데이터 업데이트 시작 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"업데이트 시작 실패: {str(e)}")

@router.get("/scheduler-status")
async def get_scheduler_status() -> Dict[str, Any]:
    """스케줄러 상태 확인"""
    try:
        return {
            "success": True,
            "data": {
                "is_running": auto_updater.is_running,
                "next_run": "매주 일요일 오전 0시 1분",
                "status": "활성" if auto_updater.is_running else "비활성"
            },
            "message": "스케줄러 상태를 확인했습니다."
        }
        
    except Exception as e:
        logger.error(f"스케줄러 상태 확인 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"상태 확인 실패: {str(e)}")

@router.post("/start-scheduler")
async def start_scheduler() -> Dict[str, Any]:
    """스케줄러 시작"""
    try:
        auto_updater.start_scheduler()
        
        return {
            "success": True,
            "data": {
                "status": "started",
                "message": "자동 업데이트 스케줄러가 시작되었습니다."
            },
            "message": "스케줄러가 시작되었습니다."
        }
        
    except Exception as e:
        logger.error(f"스케줄러 시작 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"스케줄러 시작 실패: {str(e)}")

@router.post("/stop-scheduler")
async def stop_scheduler() -> Dict[str, Any]:
    """스케줄러 중지"""
    try:
        auto_updater.stop_scheduler()
        
        return {
            "success": True,
            "data": {
                "status": "stopped",
                "message": "자동 업데이트 스케줄러가 중지되었습니다."
            },
            "message": "스케줄러가 중지되었습니다."
        }
        
    except Exception as e:
        logger.error(f"스케줄러 중지 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"스케줄러 중지 실패: {str(e)}")

@router.delete("/clear-test-data")
async def clear_test_data(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """테스트 데이터 정리 (최근 10개 회차 삭제)"""
    try:
        from ..models.lotto import LottoDraw
        # 최근 10개 회차 번호 조회
        recent_draws = db.query(LottoDraw.draw_number).order_by(LottoDraw.draw_number.desc()).limit(10).all()
        draw_numbers = [draw[0] for draw in recent_draws]
        
        # 해당 회차들 삭제
        deleted_count = db.query(LottoDraw).filter(LottoDraw.draw_number.in_(draw_numbers)).delete(synchronize_session=False)
        db.commit()
        
        return {
            "success": True,
            "data": {
                "deleted_count": deleted_count,
                "message": f"{deleted_count}개 회차가 삭제되었습니다."
            },
            "message": "테스트 데이터가 정리되었습니다."
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"테스트 데이터 정리 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"데이터 정리 실패: {str(e)}")
