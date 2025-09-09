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
from ..models.public_recommendation import PublicRecommendation
from ..models.saved_recommendation import SavedRecommendation

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
        
        # 로또 사이트에서 최신 회차 확인 (실제 스크래핑 사용)
        try:
            latest_site_draw = await auto_updater._get_latest_site_draw_number()
            logger.info(f"사이트에서 최신 회차 확인: {latest_site_draw}회차")
        except Exception as e:
            logger.error(f"사이트 스크래핑 실패: {str(e)}")
            # 사이트 접근 실패 시 DB와 동일하게 설정하여 새 데이터 없음으로 처리
            latest_site_draw = latest_db_number
        
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
    """수동으로 최신 데이터 업데이트 실행 (스케줄러와 동일한 로직 사용)"""
    try:
        from ..models.lotto import LottoDraw
        
        # 현재 DB 상태 확인
        latest_db_draw = db.query(LottoDraw.draw_number).order_by(LottoDraw.draw_number.desc()).first()
        latest_db_draw = latest_db_draw.draw_number if latest_db_draw else 0
        
        # 스케줄러와 동일한 방식으로 사이트 최신 회차 확인
        try:
            latest_site_draw = await auto_updater._get_latest_site_draw_number()
            logger.info(f"사이트에서 최신 회차 확인: {latest_site_draw}회차")
        except Exception as e:
            logger.error(f"사이트 스크래핑 실패: {str(e)}")
            # 사이트 접근 실패 시 DB와 동일하게 설정
            latest_site_draw = latest_db_draw
        
        # 새로운 데이터가 있는지 확인
        has_new_data = latest_site_draw > latest_db_draw
        
        # 디버깅을 위한 로그
        logger.info(f"DB 최신: {latest_db_draw}, 사이트 최신: {latest_site_draw}, 새로운 데이터: {has_new_data}")
        
        if has_new_data:
            # 백그라운드에서 업데이트 실행 (스케줄러와 동일한 함수 사용)
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
        config = auto_updater.get_schedule_config()
        
        return {
            "success": True,
            "data": {
                "is_running": config['is_running'],
                "day_of_week": config['day_of_week'],
                "day_name": config['day_name'],
                "hour": config['hour'],
                "minute": config['minute'],
                "next_run": f"매주 {config['day_name']} {config['hour']:02d}:{config['minute']:02d}",
                "status": "활성" if config['is_running'] else "비활성"
            },
            "message": "스케줄러 상태를 확인했습니다."
        }
        
    except Exception as e:
        logger.error(f"스케줄러 상태 확인 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"상태 확인 실패: {str(e)}")

@router.post("/scheduler-config")
async def update_scheduler_config(
    request: dict
) -> Dict[str, Any]:
    """스케줄러 설정 업데이트"""
    try:
        # 요청 데이터 추출
        day_of_week = request.get('day_of_week')
        hour = request.get('hour')
        minute = request.get('minute')
        
        if not day_of_week or hour is None or minute is None:
            raise HTTPException(status_code=400, detail="day_of_week, hour, minute 필드가 필요합니다.")
        
        # 요일 유효성 검사
        valid_days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
        if day_of_week not in valid_days:
            raise HTTPException(
                status_code=400, 
                detail=f"유효하지 않은 요일입니다. 사용 가능한 값: {', '.join(valid_days)}"
            )
        
        # 시간 유효성 검사
        if not (0 <= hour <= 23):
            raise HTTPException(status_code=400, detail="시간은 0-23 사이여야 합니다.")
        
        if not (0 <= minute <= 59):
            raise HTTPException(status_code=400, detail="분은 0-59 사이여야 합니다.")
        
        # 스케줄러 설정 업데이트
        auto_updater.update_schedule(day_of_week, hour, minute)
        
        # 업데이트된 설정 반환
        config = auto_updater.get_schedule_config()
        
        return {
            "success": True,
            "data": {
                "day_of_week": config['day_of_week'],
                "day_name": config['day_name'],
                "hour": config['hour'],
                "minute": config['minute'],
                "is_running": config['is_running'],
                "next_run": f"매주 {config['day_name']} {config['hour']:02d}:{config['minute']:02d}"
            },
            "message": f"스케줄러 설정이 업데이트되었습니다. (매주 {config['day_name']} {config['hour']:02d}:{config['minute']:02d})"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"스케줄러 설정 업데이트 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"설정 업데이트 실패: {str(e)}")

@router.get("/scheduler-config")
async def get_scheduler_config() -> Dict[str, Any]:
    """스케줄러 설정 조회"""
    try:
        config = auto_updater.get_schedule_config()
        
        return {
            "success": True,
            "data": {
                "day_of_week": config['day_of_week'],
                "day_name": config['day_name'],
                "hour": config['hour'],
                "minute": config['minute'],
                "is_running": config['is_running'],
                "next_run": f"매주 {config['day_name']} {config['hour']:02d}:{config['minute']:02d}"
            },
            "message": "스케줄러 설정을 조회했습니다."
        }
        
    except Exception as e:
        logger.error(f"스케줄러 설정 조회 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"설정 조회 실패: {str(e)}")

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

@router.get("/statistics")
async def get_statistics(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """실제 통계 데이터 조회"""
    try:
        # 공공 추천 데이터 통계
        total_public_recommendations = db.query(PublicRecommendation).count()
        ai_recommendations = db.query(PublicRecommendation).filter(
            PublicRecommendation.generation_method == "ai"
        ).count()
        manual_recommendations = db.query(PublicRecommendation).filter(
            PublicRecommendation.generation_method == "manual"
        ).count()
        member_recommendations = db.query(PublicRecommendation).filter(
            PublicRecommendation.user_type == "member"
        ).count()
        guest_recommendations = db.query(PublicRecommendation).filter(
            PublicRecommendation.user_type == "guest"
        ).count()
        
        # 개인 저장 데이터 통계
        total_personal_recommendations = db.query(SavedRecommendation).count()
        
        # 최근 7일간 통계
        from datetime import datetime, timedelta
        week_ago = datetime.now() - timedelta(days=7)
        
        recent_public = db.query(PublicRecommendation).filter(
            PublicRecommendation.created_at >= week_ago
        ).count()
        
        recent_personal = db.query(SavedRecommendation).filter(
            SavedRecommendation.created_at >= week_ago
        ).count()
        
        # 최신 회차 정보
        from ..models.lotto import LottoDraw
        latest_draw = db.query(LottoDraw).order_by(LottoDraw.draw_number.desc()).first()
        latest_draw_number = latest_draw.draw_number if latest_draw else 0
        
        return {
            "success": True,
            "data": {
                "public_recommendations": {
                    "total": total_public_recommendations,
                    "ai": ai_recommendations,
                    "manual": manual_recommendations,
                    "member": member_recommendations,
                    "guest": guest_recommendations,
                    "recent_7days": recent_public
                },
                "personal_recommendations": {
                    "total": total_personal_recommendations,
                    "recent_7days": recent_personal
                },
                "latest_draw": latest_draw_number,
                "total_recommendations": total_public_recommendations + total_personal_recommendations
            },
            "message": "통계 데이터를 조회했습니다."
        }
        
    except Exception as e:
        logger.error(f"통계 데이터 조회 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"통계 데이터 조회 실패: {str(e)}")
