from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any, List
import logging
import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime, timedelta
import random
from pydantic import BaseModel

from ..database import get_db
from ..services.auto_updater import auto_updater
from ..models.public_recommendation import PublicRecommendation
from ..models.saved_recommendation import SavedRecommendation
from ..models.lotto import LottoDraw

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])

# 더미 데이터 생성 요청 스키마
class DummyDataRequest(BaseModel):
    draw_number: int
    total_count: int
    rank_distribution: Dict[int, int]  # {1: 2, 2: 15, 3: 150, 4: 2000, 5: 5000}

# 회차 정보 응답 스키마
class DrawNumberResponse(BaseModel):
    draw_number: int
    draw_date: str
    numbers: List[int]
    bonus_number: int

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

@router.get("/draw-numbers")
async def get_draw_numbers(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """회차 목록 조회 (최근 100회차)"""
    try:
        # 최근 100회차 조회
        draws = db.query(LottoDraw).order_by(LottoDraw.draw_number.desc()).limit(100).all()
        
        draw_list = []
        for draw in draws:
            draw_list.append({
                "draw_number": draw.draw_number,
                "draw_date": draw.draw_date.strftime("%Y-%m-%d") if draw.draw_date else None,
                "numbers": [draw.number_1, draw.number_2, draw.number_3, draw.number_4, draw.number_5, draw.number_6],
                "bonus_number": draw.bonus_number
            })
        
        return {
            "success": True,
            "data": {
                "draws": draw_list,
                "total_count": len(draw_list)
            },
            "message": "회차 목록을 조회했습니다."
        }
        
    except Exception as e:
        logger.error(f"회차 목록 조회 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"회차 목록 조회 실패: {str(e)}")

@router.post("/dummy-recommendations/generate")
async def generate_dummy_recommendations(
    request: DummyDataRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """더미 추천 데이터 생성"""
    try:
        # 회차 존재 확인
        draw = db.query(LottoDraw).filter(LottoDraw.draw_number == request.draw_number).first()
        if not draw:
            raise HTTPException(status_code=404, detail=f"회차 {request.draw_number}를 찾을 수 없습니다.")
        
        # 등수별 분포 검증
        total_distributed = sum(request.rank_distribution.values())
        if total_distributed > request.total_count:
            raise HTTPException(status_code=400, detail="등수별 분포 합계가 총 생성 수를 초과합니다.")
        
        # 미당첨 개수 계산
        no_win_count = request.total_count - total_distributed
        
        # 간단한 더미 데이터 생성 (테스트용)
        created_count = 0
        
        # 실제 당첨번호
        winning_numbers = [draw.number_1, draw.number_2, draw.number_3, draw.number_4, draw.number_5, draw.number_6]
        bonus_number = draw.bonus_number
        
        # 등수별 데이터 생성
        for rank, count in request.rank_distribution.items():
            if count > 0:
                for i in range(count):
                    # 간단한 번호 조합 생성
                    if rank == 1:
                        numbers = winning_numbers.copy()
                    elif rank == 2:
                        numbers = winning_numbers[:5] + [bonus_number]
                    else:
                        numbers = random.sample(range(1, 46), 6)
                    
                    # 더미 데이터 저장
                    dummy_data = PublicRecommendation(
                        numbers=numbers,
                        generation_method="ai",
                        confidence_score=random.randint(70, 95),
                        analysis_data={"is_dummy": True, "rank": rank},
                        draw_number=request.draw_number,
                        user_type="member",
                        is_dummy=True,
                        winning_rank=rank,
                        matched_count=rank if rank <= 5 else 0,
                        matched_numbers=numbers[:rank] if rank <= 5 else [],
                        winning_amount=1000000 if rank == 1 else 0
                    )
                    
                    db.add(dummy_data)
                    created_count += 1
        
        # 미당첨 데이터 생성
        for i in range(no_win_count):
            numbers = random.sample(range(1, 46), 6)
            
            dummy_data = PublicRecommendation(
                numbers=numbers,
                generation_method="ai",
                confidence_score=random.randint(50, 85),
                analysis_data={"is_dummy": True, "rank": 0},
                draw_number=request.draw_number,
                user_type="member",
                is_dummy=True,
                winning_rank=None,
                matched_count=0,
                matched_numbers=[],
                winning_amount=0
            )
            
            db.add(dummy_data)
            created_count += 1
        
        db.commit()
        
        return {
            "success": True,
            "data": {
                "created_count": created_count,
                "draw_number": request.draw_number,
                "rank_distribution": request.rank_distribution,
                "no_win_count": no_win_count
            },
            "message": f"{created_count}개의 더미 데이터가 생성되었습니다."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"더미 데이터 생성 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"더미 데이터 생성 실패: {str(e)}")

@router.get("/dummy-recommendations/stats")
async def get_dummy_recommendations_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """더미 데이터 통계 조회"""
    try:
        # 더미 데이터 통계
        total_dummy = db.query(PublicRecommendation).filter(PublicRecommendation.is_dummy == True).count()
        
        # 등수별 통계
        rank_stats = {}
        for rank in range(1, 6):
            count = db.query(PublicRecommendation).filter(
                PublicRecommendation.is_dummy == True,
                PublicRecommendation.winning_rank == rank
            ).count()
            rank_stats[f"rank_{rank}"] = count
        
        # 미당첨 통계
        no_win_count = db.query(PublicRecommendation).filter(
            PublicRecommendation.is_dummy == True,
            PublicRecommendation.winning_rank.is_(None)
        ).count()
        rank_stats["no_win"] = no_win_count
        
        # 회차별 통계
        from sqlalchemy import func
        draw_stats = db.query(
            PublicRecommendation.draw_number,
            func.count(PublicRecommendation.id).label('count')
        ).filter(
            PublicRecommendation.is_dummy == True
        ).group_by(PublicRecommendation.draw_number).all()
        
        return {
            "success": True,
            "data": {
                "total_dummy": total_dummy,
                "rank_distribution": rank_stats,
                "draw_stats": [{"draw_number": stat.draw_number, "count": stat.count} for stat in draw_stats]
            },
            "message": "더미 데이터 통계를 조회했습니다."
        }
        
    except Exception as e:
        logger.error(f"더미 데이터 통계 조회 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"더미 데이터 통계 조회 실패: {str(e)}")

# 헬퍼 함수들
def _distribute_daily_counts(total_count: int, start_date: datetime, end_date: datetime) -> List[int]:
    """일별 랜덤 생성 수 분배"""
    days = 7
    daily_counts = []
    
    remaining = total_count
    for i in range(days - 1):
        max_daily = max(1, remaining // (days - i) * 2)
        daily_count = random.randint(1, min(max_daily, remaining))
        daily_counts.append(daily_count)
        remaining -= daily_count
    
    daily_counts.append(remaining)
    random.shuffle(daily_counts)
    
    return daily_counts

def _random_date_in_week(start_date: datetime, end_date: datetime, daily_counts: List[int]) -> datetime:
    """주간 내 랜덤 날짜 생성"""
    # 일별로 분배된 개수에 따라 날짜 선택
    day_index = random.choices(range(7), weights=daily_counts, k=1)[0]
    target_date = start_date + timedelta(days=day_index)
    
    # 해당 날짜 내 랜덤 시간 (9시 ~ 20시)
    hour = random.randint(9, 20)
    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    
    return datetime(target_date.year, target_date.month, target_date.day, hour, minute, second)

def _generate_winning_combination(winning_numbers: List[int], bonus_number: int, rank: int) -> List[int]:
    """등수별 번호 조합 생성"""
    if rank == 1:  # 1등: 당첨번호와 동일
        return winning_numbers.copy()
    
    elif rank == 2:  # 2등: 5개 일치 + 보너스번호 포함
        return winning_numbers[:5] + [bonus_number]
    
    elif rank == 3:  # 3등: 5개 일치 (보너스번호 제외)
        other_number = random.choice([n for n in range(1, 46) if n not in winning_numbers])
        return winning_numbers[:5] + [other_number]
    
    elif rank == 4:  # 4등: 4개 일치
        other_numbers = random.sample([n for n in range(1, 46) if n not in winning_numbers], 2)
        return winning_numbers[:4] + other_numbers
    
    elif rank == 5:  # 5등: 3개 일치
        other_numbers = random.sample([n for n in range(1, 46) if n not in winning_numbers], 3)
        return winning_numbers[:3] + other_numbers
    
    else:  # 미당첨: 0-2개 일치
        match_count = random.randint(0, 2)
        if match_count == 0:
            return random.sample(range(1, 46), 6)
        else:
            matched = random.sample(winning_numbers, match_count)
            other_numbers = random.sample([n for n in range(1, 46) if n not in winning_numbers], 6 - match_count)
            return matched + other_numbers

def _get_matched_count(rank: int) -> int:
    """등수별 일치 개수"""
    if rank == 1:
        return 6
    elif rank == 2:
        return 5
    elif rank == 3:
        return 5
    elif rank == 4:
        return 4
    elif rank == 5:
        return 3
    else:
        return 0

def _get_matched_numbers(numbers: List[int], winning_numbers: List[int], rank: int) -> List[int]:
    """일치한 번호들"""
    if rank == 0:  # 미당첨
        return []
    
    matched = []
    for num in numbers:
        if num in winning_numbers:
            matched.append(num)
    
    return matched

def _get_winning_amount(rank: int) -> int:
    """등수별 당첨 금액 (예시)"""
    amounts = {
        1: 2000000000,  # 20억
        2: 50000000,    # 5천만
        3: 1500000,     # 150만
        4: 50000,       # 5만
        5: 5000         # 5천
    }
    return amounts.get(rank, 0)
