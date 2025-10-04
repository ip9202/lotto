from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import pytz
from ..database import get_db
from ..models.lotto import LottoDraw
from ..schemas.lotto import LottoNumber, LottoStatistics
from ..schemas.recommendation import APIResponse
from ..services.lotto_analyzer import LottoAnalyzer

router = APIRouter(prefix="/api/v1/lotto", tags=["lotto"])

def to_kst_string(date_obj):
    """UTC 날짜를 한국시간 문자열로 변환"""
    if not date_obj:
        return None
    
    # date 객체인 경우 그대로 반환 (이미 올바른 날짜)
    if hasattr(date_obj, 'date') and not hasattr(date_obj, 'tzinfo'):
        # datetime.date 객체인 경우 그대로 반환
        return date_obj.strftime('%Y-%m-%d')
    
    # datetime 객체인 경우 시간대 변환
    if hasattr(date_obj, 'tzinfo'):
        utc = pytz.timezone('UTC')
        kst = pytz.timezone('Asia/Seoul')
        
        if date_obj.tzinfo is None:
            # timezone 정보가 없는 경우 UTC로 가정
            utc_date = utc.localize(date_obj)
        else:
            utc_date = date_obj.astimezone(utc)
        
        kst_date = utc_date.astimezone(kst)
        return kst_date.strftime('%Y-%m-%d')
    
    # 기타 경우 그대로 반환
    return date_obj.strftime('%Y-%m-%d')

@router.get("/latest", response_model=APIResponse)
async def get_latest_draw(db: Session = Depends(get_db)):
    """최신 로또 당첨번호 조회"""
    try:
        latest = db.query(LottoDraw).order_by(LottoDraw.draw_number.desc()).first()
        if not latest:
            raise HTTPException(status_code=404, detail="당첨번호 데이터가 없습니다")
        
        # 디버깅을 위한 로그
        print(f"DEBUG: latest.draw_date = {latest.draw_date} (type: {type(latest.draw_date)})")
        print(f"DEBUG: latest.numbers = {latest.numbers}")
        
        # 날짜를 한국시간 문자열로 변환
        draw_date_str = to_kst_string(latest.draw_date) if latest.draw_date else "2025-08-23"
        purchase_start_str = to_kst_string(latest.purchase_start_date)
        purchase_end_str = to_kst_string(latest.purchase_end_date)
        purchase_period = latest.purchase_period if hasattr(latest, 'purchase_period') else None
        
        data = LottoNumber(
            draw_number=latest.draw_number,
            draw_date=draw_date_str,
            purchase_start_date=purchase_start_str,
            purchase_end_date=purchase_end_str,
            purchase_period=purchase_period,
            numbers=latest.numbers,
            bonus_number=latest.bonus_number,
            first_winners=latest.first_winners,
            first_amount=latest.first_amount
        )
        
        return APIResponse(
            success=True,
            data=data,
            message="최신 당첨번호를 성공적으로 조회했습니다"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in get_latest_draw: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")

@router.get("/current-draw", response_model=APIResponse)
async def get_current_draw_number(db: Session = Depends(get_db)):
    """현재 회차 번호 조회 (추천 생성용)"""
    try:
        # 최신 회차 조회
        latest = db.query(LottoDraw).order_by(LottoDraw.draw_number.desc()).first()
        if not latest:
            raise HTTPException(status_code=404, detail="로또 데이터가 없습니다")
        
        # 다음 회차는 최신 회차 + 1
        current_draw_number = latest.draw_number + 1
        
        return APIResponse(
            success=True,
            data={"draw_number": current_draw_number},
            message=f"현재 회차: {current_draw_number}회"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in get_current_draw_number: {str(e)}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")

@router.get("/draws", response_model=APIResponse)
async def get_draws(
    limit: int = 10,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """당첨번호 목록 조회"""
    try:
        if limit > 100:
            limit = 100  # 최대 100개로 제한
        
        draws = db.query(LottoDraw)\
            .order_by(LottoDraw.draw_number.desc())\
            .offset(offset)\
            .limit(limit)\
            .all()
        
        data = []
        for draw in draws:
            # 날짜를 한국시간 문자열로 변환
            draw_date_str = to_kst_string(draw.draw_date) if draw.draw_date else "2025-08-23"
            purchase_start_str = to_kst_string(draw.purchase_start_date)
            purchase_end_str = to_kst_string(draw.purchase_end_date)
            purchase_period = draw.purchase_period if hasattr(draw, 'purchase_period') else None
            
            data.append(LottoNumber(
                draw_number=draw.draw_number,
                draw_date=draw_date_str,
                purchase_start_date=purchase_start_str,
                purchase_end_date=purchase_end_str,
                purchase_period=purchase_period,
                numbers=draw.numbers,
                bonus_number=draw.bonus_number,
                first_winners=draw.first_winners,
                first_amount=draw.first_amount
            ))
        
        return APIResponse(
            success=True,
            data=data,
            message=f"{len(data)}개의 당첨번호를 성공적으로 조회했습니다"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")

@router.get("/statistics", response_model=APIResponse)
async def get_statistics(db: Session = Depends(get_db)):
    """로또 통계 정보 조회"""
    try:
        analyzer = LottoAnalyzer(db)
        
        # 기본 통계
        total_draws = analyzer.get_total_draws()
        latest_draw = analyzer.get_latest_draw_number()
        
        # 번호별 출현 빈도
        frequency_stats = analyzer.calculate_frequency_statistics()
        
        # 핫/콜드 넘버
        hot_numbers, cold_numbers = analyzer.get_hot_cold_numbers()
        
        data = LottoStatistics(
            total_draws=total_draws,
            latest_draw=latest_draw,
            number_frequency=frequency_stats,
            hot_numbers=hot_numbers,
            cold_numbers=cold_numbers
        )
        
        return APIResponse(
            success=True,
            data=data,
            message="로또 통계 정보를 성공적으로 조회했습니다"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")

@router.get("/draw/{draw_number}", response_model=APIResponse)
async def get_draw_by_number(
    draw_number: int,
    db: Session = Depends(get_db)
):
    """특정 회차 당첨번호 조회 (구매기간 포함)"""
    try:
        draw = db.query(LottoDraw).filter(LottoDraw.draw_number == draw_number).first()
        if not draw:
            raise HTTPException(status_code=404, detail=f"{draw_number}회차 당첨번호를 찾을 수 없습니다")
        
        # 날짜를 한국시간 문자열로 변환
        draw_date_str = to_kst_string(draw.draw_date) if draw.draw_date else "2025-08-23"
        purchase_start_str = to_kst_string(draw.purchase_start_date)
        purchase_end_str = to_kst_string(draw.purchase_end_date)
        purchase_period = draw.purchase_period if hasattr(draw, 'purchase_period') else None
        
        data = LottoNumber(
            draw_number=draw.draw_number,
            draw_date=draw_date_str,
            purchase_start_date=purchase_start_str,
            purchase_end_date=purchase_end_str,
            purchase_period=purchase_period,
            numbers=draw.numbers,
            bonus_number=draw.bonus_number,
            first_winners=draw.first_winners,
            first_amount=draw.first_amount
        )
        
        return APIResponse(
            success=True,
            data=data,
            message=f"{draw_number}회차 당첨번호를 성공적으로 조회했습니다"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")

@router.get("/recent-draws")
async def get_recent_draws(db: Session = Depends(get_db)):
    """최근 10개 회차의 당첨번호 조회"""
    try:
        recent_draws = db.query(LottoDraw).order_by(LottoDraw.draw_number.desc()).limit(10).all()
        
        draws_data = []
        for draw in recent_draws:
            draws_data.append({
                "draw_number": draw.draw_number,
                "draw_date": draw.draw_date,
                "numbers": [draw.number_1, draw.number_2, draw.number_3, draw.number_4, draw.number_5, draw.number_6],
                "bonus_number": draw.bonus_number
            })
        
        return {
            "success": True,
            "data": {
                "recent_draws": draws_data,
                "total_count": len(draws_data)
            },
            "message": "최근 당첨번호를 성공적으로 조회했습니다"
        }
        
    except Exception as e:
        # logger.error(f"최근 당첨번호 조회 중 오류: {str(e)}") # logger is not defined in this file
        raise HTTPException(status_code=500, detail=f"데이터 조회 실패: {str(e)}")


