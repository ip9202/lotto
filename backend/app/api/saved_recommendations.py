from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
from typing import List, Optional, Dict, Any
import logging
from datetime import datetime, timedelta

from ..database import get_db
from ..api.auth import get_current_user
from ..models.user import User
from ..models.saved_recommendation import SavedRecommendation
from ..models.lotto import LottoDraw
from ..schemas.saved_recommendation import (
    SavedRecommendationCreate, SavedRecommendationUpdate, SavedRecommendationResponse,
    SavedRecommendationList, RecommendationFilter, RecommendationSort,
    BulkActionRequest, WinningCheckRequest, RecommendationStats
)

logger = logging.getLogger(__name__)

def get_current_draw_number(db: Session) -> int:
    """현재 회차 번호 조회 (개인 저장용)"""
    latest = db.query(LottoDraw).order_by(LottoDraw.draw_number.desc()).first()
    if not latest:
        raise HTTPException(status_code=404, detail="로또 데이터가 없습니다")
    return latest.draw_number + 1

router = APIRouter(prefix="/api/v1/saved-recommendations", tags=["저장된 추천번호"])

@router.post("", response_model=SavedRecommendationResponse, summary="추천번호 저장")
async def save_recommendation(
    recommendation_data: SavedRecommendationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """AI 추천번호를 개인 저장소에 저장"""
    
    try:
        logger.info(f"저장 요청 받음 - 사용자: {current_user.id}")
        logger.info(f"요청 데이터 타입: {type(recommendation_data)}")
        logger.info(f"요청 데이터 내용: {recommendation_data}")
        logger.info(f"numbers: {recommendation_data.numbers}")
        logger.info(f"generation_method: {recommendation_data.generation_method}")
        logger.info(f"confidence_score: {recommendation_data.confidence_score}")
        
        # 현재 회차 조회
        current_draw = get_current_draw_number(db)
        logger.info(f"현재 회차: {current_draw}")
        
        # 저장 가능 여부 확인 (주간 10개 제한 - 현재 회차 기준)
        today = datetime.now()
        days_since_monday = today.weekday()
        week_start = today - timedelta(days=days_since_monday)
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # 이번 주 + 현재 회차로 저장된 개수 확인
        weekly_saved_count = db.query(SavedRecommendation).filter(
            SavedRecommendation.user_id == current_user.id,
            SavedRecommendation.created_at >= week_start,
            SavedRecommendation.target_draw_number == current_draw
        ).count()
        
        logger.info(f"주간 저장 개수: {weekly_saved_count}/10")
        
        if weekly_saved_count >= 10:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"주간 저장 한도에 도달했습니다. 이번 주 저장: {weekly_saved_count}/10개"
            )
        # 새 추천 생성
        saved_rec = SavedRecommendation(
            user_id=current_user.id,
            numbers=recommendation_data.numbers,
            confidence_score=recommendation_data.confidence_score,
            generation_method=recommendation_data.generation_method,
            analysis_data=recommendation_data.analysis_data if recommendation_data.analysis_data else None,
            title=recommendation_data.title,
            memo=recommendation_data.memo,
            tags=recommendation_data.tags,
            target_draw_number=current_draw  # 자동으로 현재 회차 설정
        )
        
        db.add(saved_rec)
        
        # 사용자 저장 카운트 증가
        current_user.increment_saved_count()
        
        db.commit()
        db.refresh(saved_rec)
        
        logger.info(f"추천번호 저장 완료 - ID: {saved_rec.id}, 사용자: {current_user.id}")
        
        return SavedRecommendationResponse.model_validate(saved_rec.to_dict())
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Save recommendation error: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="추천번호 저장 중 오류가 발생했습니다"
        )

@router.get("", response_model=SavedRecommendationList, summary="저장된 추천번호 목록")
async def get_saved_recommendations(
    page: int = Query(1, ge=1, description="페이지 번호"),
    per_page: int = Query(20, ge=1, le=100, description="페이지당 항목 수"),
    generation_method: Optional[str] = Query(None, description="생성 방법 필터"),
    is_favorite: Optional[bool] = Query(None, description="즐겨찾기 필터"),
    is_winner: Optional[bool] = Query(None, description="당첨 여부 필터"),
    is_purchased: Optional[bool] = Query(None, description="구매 여부 필터"),
    target_draw: Optional[int] = Query(None, description="목표 회차 필터"),
    sort_field: str = Query("created_at", description="정렬 필드"),
    sort_order: str = Query("desc", description="정렬 순서"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """사용자의 저장된 추천번호 목록 조회"""
    
    try:
        # 기본 쿼리
        query = db.query(SavedRecommendation).filter(
            and_(
                SavedRecommendation.user_id == current_user.id,
                SavedRecommendation.is_active == True
            )
        )
        
        # 필터 적용
        if generation_method:
            query = query.filter(SavedRecommendation.generation_method == generation_method)
        
        if is_favorite is not None:
            query = query.filter(SavedRecommendation.is_favorite == is_favorite)
        
        if is_purchased is not None:
            query = query.filter(SavedRecommendation.is_purchased == is_purchased)
        
        if target_draw:
            query = query.filter(SavedRecommendation.target_draw_number == target_draw)
        
        if is_winner is not None:
            if is_winner:
                query = query.filter(SavedRecommendation.winning_rank.isnot(None))
            else:
                query = query.filter(SavedRecommendation.winning_rank.is_(None))
        
        # 정렬 적용
        sort_column = getattr(SavedRecommendation, sort_field, SavedRecommendation.created_at)
        if sort_order.lower() == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))
        
        # 전체 개수
        total = query.count()
        
        # 페이지네이션 적용
        offset = (page - 1) * per_page
        items = query.offset(offset).limit(per_page).all()
        
        # 응답 데이터 구성
        response_items = [SavedRecommendationResponse.model_validate(item.to_dict()) for item in items]
        
        return SavedRecommendationList(
            items=response_items,
            total=total,
            page=page,
            per_page=per_page,
            has_next=offset + per_page < total,
            has_prev=page > 1
        )
        
    except Exception as e:
        logger.error(f"Get saved recommendations error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="저장된 추천번호 조회 중 오류가 발생했습니다"
        )

@router.get("/{recommendation_id}", response_model=SavedRecommendationResponse, summary="저장된 추천번호 상세")
async def get_saved_recommendation(
    recommendation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """특정 저장된 추천번호 상세 정보 조회"""
    
    saved_rec = db.query(SavedRecommendation).filter(
        and_(
            SavedRecommendation.id == recommendation_id,
            SavedRecommendation.user_id == current_user.id
        )
    ).first()
    
    if not saved_rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="저장된 추천번호를 찾을 수 없습니다"
        )
    
    return SavedRecommendationResponse.model_validate(saved_rec.to_dict())

@router.put("/{recommendation_id}", response_model=SavedRecommendationResponse, summary="저장된 추천번호 수정")
async def update_saved_recommendation(
    recommendation_id: int,
    update_data: SavedRecommendationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """저장된 추천번호 정보 수정"""
    
    saved_rec = db.query(SavedRecommendation).filter(
        and_(
            SavedRecommendation.id == recommendation_id,
            SavedRecommendation.user_id == current_user.id
        )
    ).first()
    
    if not saved_rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="저장된 추천번호를 찾을 수 없습니다"
        )
    
    try:
        # 업데이트 가능한 필드들 수정
        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            if hasattr(saved_rec, field):
                setattr(saved_rec, field, value)
        
        # 구매 상태 변경 시 구매일 업데이트
        if update_data.is_purchased is not None and update_data.is_purchased:
            saved_rec.mark_as_purchased(update_data.target_draw_number)
        
        db.commit()
        db.refresh(saved_rec)
        
        return SavedRecommendationResponse.model_validate(saved_rec.to_dict())
        
    except Exception as e:
        logger.error(f"Update saved recommendation error: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="추천번호 수정 중 오류가 발생했습니다"
        )

@router.delete("/{recommendation_id}", summary="저장된 추천번호 삭제")
async def delete_saved_recommendation(
    recommendation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """저장된 추천번호 삭제"""
    
    saved_rec = db.query(SavedRecommendation).filter(
        and_(
            SavedRecommendation.id == recommendation_id,
            SavedRecommendation.user_id == current_user.id
        )
    ).first()
    
    if not saved_rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="저장된 추천번호를 찾을 수 없습니다"
        )
    
    try:
        db.delete(saved_rec)
        current_user.decrement_saved_count()
        db.commit()
        
        return {
            "success": True,
            "message": "추천번호가 삭제되었습니다",
            "data": None
        }
        
    except Exception as e:
        logger.error(f"Delete saved recommendation error: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="추천번호 삭제 중 오류가 발생했습니다"
        )

@router.post("/{recommendation_id}/toggle-favorite", summary="즐겨찾기 토글")
async def toggle_favorite(
    recommendation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """추천번호 즐겨찾기 토글"""
    
    saved_rec = db.query(SavedRecommendation).filter(
        and_(
            SavedRecommendation.id == recommendation_id,
            SavedRecommendation.user_id == current_user.id
        )
    ).first()
    
    if not saved_rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="저장된 추천번호를 찾을 수 없습니다"
        )
    
    try:
        saved_rec.toggle_favorite()
        db.commit()
        
        return {
            "success": True,
            "message": f"즐겨찾기가 {'추가' if saved_rec.is_favorite else '해제'}되었습니다",
            "data": {"is_favorite": saved_rec.is_favorite}
        }
        
    except Exception as e:
        logger.error(f"Toggle favorite error: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="즐겨찾기 변경 중 오류가 발생했습니다"
        )

@router.get("/stats/summary", response_model=RecommendationStats, summary="추천번호 통계")
async def get_recommendation_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """사용자의 추천번호 통계 정보"""
    
    try:
        saved_recs = db.query(SavedRecommendation).filter(
            SavedRecommendation.user_id == current_user.id
        ).all()
        
        total_saved = len(saved_recs)
        checked_recs = [rec for rec in saved_recs if rec.is_checked]
        winner_recs = [rec for rec in saved_recs if rec.is_winner]
        
        # 생성 방법별 통계
        by_method = {}
        for rec in saved_recs:
            method = rec.generation_method
            by_method[method] = by_method.get(method, 0) + 1
        
        # 순위별 통계  
        by_rank = {}
        for rec in winner_recs:
            rank = f"{rec.winning_rank}등"
            by_rank[rank] = by_rank.get(rank, 0) + 1
        
        # 최근 활동
        recent_activity = []
        recent_recs = sorted(saved_recs, key=lambda x: x.updated_at, reverse=True)[:5]
        for rec in recent_recs:
            recent_activity.append({
                "id": rec.id,
                "action": "당첨" if rec.is_winner else "저장",
                "numbers": rec.numbers_string,
                "date": rec.updated_at.isoformat()
            })
        
        stats = RecommendationStats(
            total_saved=total_saved,
            total_checked=len(checked_recs),
            total_winners=len(winner_recs),
            total_winnings=sum(rec.winning_amount or 0 for rec in winner_recs),
            win_rate=len(winner_recs) / len(checked_recs) * 100 if checked_recs else 0,
            avg_confidence=sum(rec.confidence_score for rec in saved_recs) / total_saved if total_saved else 0,
            by_method=by_method,
            by_rank=by_rank,
            recent_activity=recent_activity
        )
        
        return stats
        
    except Exception as e:
        logger.error(f"Get recommendation stats error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="통계 조회 중 오류가 발생했습니다"
        )

@router.post("/check-winning", summary="당첨 결과 확인")
async def check_winning_results(
    draw_number: int = Query(..., description="회차 번호"),
    winning_numbers: List[int] = Query(..., min_items=6, max_items=6, description="당첨 번호 6개"),
    bonus_number: int = Query(..., description="보너스 번호"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """저장된 추천번호들의 당첨 결과 확인"""
    
    try:
        # 사용자의 모든 활성 추천번호 조회
        saved_recs = db.query(SavedRecommendation).filter(
            and_(
                SavedRecommendation.user_id == current_user.id,
                SavedRecommendation.is_active == True
            )
        ).all()
        
        if not saved_recs:
            return {
                "success": True,
                "message": "확인할 추천번호가 없습니다",
                "data": {
                    "checked_count": 0,
                    "winners": [],
                    "total_winnings": 0
                }
            }
        
        winners = []
        total_winnings = 0
        
        for rec in saved_recs:
            # 번호 매칭 확인
            matched_numbers = list(set(rec.numbers) & set(winning_numbers))
            matched_count = len(matched_numbers)
            
            # 당첨 등수 계산
            winning_rank = None
            winning_amount = 0
            
            if matched_count == 6:
                # 1등 (6개 모두 일치)
                winning_rank = 1
                winning_amount = 2000000000  # 20억원 (예시)
            elif matched_count == 5 and bonus_number in rec.numbers:
                # 2등 (5개 일치 + 보너스 번호)
                winning_rank = 2
                winning_amount = 50000000  # 5천만원 (예시)
            elif matched_count == 5:
                # 3등 (5개 일치)
                winning_rank = 3
                winning_amount = 1500000  # 150만원 (예시)
            elif matched_count == 4:
                # 4등 (4개 일치)
                winning_rank = 4
                winning_amount = 50000  # 5만원 (예시)
            elif matched_count == 3:
                # 5등 (3개 일치)
                winning_rank = 5
                winning_amount = 5000  # 5천원 (예시)
            
            # 추천번호 업데이트
            rec.is_checked = True
            rec.matched_count = matched_count
            rec.matched_numbers = matched_numbers  # INTEGER[] 타입으로 자동 변환됨
            rec.winning_rank = winning_rank
            rec.winning_amount = winning_amount
            # is_winner는 winning_rank 기반으로 자동 계산됨
            
            if winning_rank:
                winners.append({
                    "id": rec.id,
                    "numbers": rec.numbers,
                    "matched_numbers": matched_numbers,
                    "winning_rank": winning_rank,
                    "winning_amount": winning_amount,
                    "title": rec.title
                })
                total_winnings += winning_amount
        
        # 사용자 통계 업데이트
        if winners:
            current_user.total_wins += len(winners)
            current_user.total_winnings += total_winnings
        
        db.commit()
        
        return {
            "success": True,
            "message": f"당첨 결과 확인 완료: {len(winners)}개 당첨",
            "data": {
                "draw_number": draw_number,
                "winning_numbers": winning_numbers,
                "bonus_number": bonus_number,
                "checked_count": len(saved_recs),
                "winners": winners,
                "total_winnings": total_winnings
            }
        }
        
    except Exception as e:
        logger.error(f"Check winning results error: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="당첨 결과 확인 중 오류가 발생했습니다"
        )