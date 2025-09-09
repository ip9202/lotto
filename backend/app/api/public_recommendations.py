from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.public_recommendation import PublicRecommendation
from ..schemas.public_recommendation import (
    PublicRecommendationCreate, 
    PublicRecommendationResponse, 
    PublicRecommendationList,
    PublicRecommendationStats
)
from ..schemas.recommendation import APIResponse

router = APIRouter(prefix="/api/v1/public-recommendations", tags=["공공 추천 데이터"])

@router.post("/", response_model=APIResponse)
async def create_public_recommendation(
    recommendation: PublicRecommendationCreate,
    db: Session = Depends(get_db)
):
    """공공 추천 데이터 생성 (추천 생성 시 자동 호출)"""
    try:
        # 공공 추천 데이터 생성
        public_rec = PublicRecommendation(
            numbers=recommendation.numbers,
            generation_method=recommendation.generation_method,
            confidence_score=recommendation.confidence_score,
            analysis_data=recommendation.analysis_data,
            draw_number=recommendation.draw_number,
            user_type=recommendation.user_type
        )
        
        db.add(public_rec)
        db.commit()
        db.refresh(public_rec)
        
        return APIResponse(
            success=True,
            data=PublicRecommendationResponse.from_orm(public_rec),
            message="공공 추천 데이터가 저장되었습니다"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"공공 추천 데이터 저장 실패: {str(e)}")

@router.get("/", response_model=PublicRecommendationList)
async def get_public_recommendations(
    draw_number: Optional[int] = Query(None, description="회차 번호"),
    user_type: Optional[str] = Query(None, description="사용자 타입 (member/guest)"),
    generation_method: Optional[str] = Query(None, description="생성 방법 (ai/manual)"),
    limit: int = Query(100, le=1000, description="조회 개수"),
    offset: int = Query(0, ge=0, description="오프셋"),
    db: Session = Depends(get_db)
):
    """공공 추천 데이터 목록 조회"""
    try:
        query = db.query(PublicRecommendation)
        
        # 필터링
        if draw_number:
            query = query.filter(PublicRecommendation.draw_number == draw_number)
        if user_type:
            query = query.filter(PublicRecommendation.user_type == user_type)
        if generation_method:
            query = query.filter(PublicRecommendation.generation_method == generation_method)
        
        # 총 개수 조회
        total = query.count()
        
        # 페이지네이션
        recommendations = query.order_by(PublicRecommendation.created_at.desc()).offset(offset).limit(limit).all()
        
        return PublicRecommendationList(
            success=True,
            data=[PublicRecommendationResponse.from_orm(rec) for rec in recommendations],
            total=total,
            draw_number=draw_number or 0,
            message=f"공공 추천 데이터 {len(recommendations)}개를 조회했습니다"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"공공 추천 데이터 조회 실패: {str(e)}")

@router.get("/stats", response_model=APIResponse)
async def get_public_recommendation_stats(
    draw_number: Optional[int] = Query(None, description="회차 번호"),
    db: Session = Depends(get_db)
):
    """공공 추천 데이터 통계 조회"""
    try:
        query = db.query(PublicRecommendation)
        
        if draw_number:
            query = query.filter(PublicRecommendation.draw_number == draw_number)
        
        # 통계 계산
        total_recommendations = query.count()
        ai_recommendations = query.filter(PublicRecommendation.generation_method == "ai").count()
        manual_recommendations = query.filter(PublicRecommendation.generation_method == "manual").count()
        member_recommendations = query.filter(PublicRecommendation.user_type == "member").count()
        guest_recommendations = query.filter(PublicRecommendation.user_type == "guest").count()
        
        # 최신 회차 조회
        latest_draw = db.query(PublicRecommendation.draw_number).order_by(PublicRecommendation.draw_number.desc()).first()
        current_draw = latest_draw.draw_number if latest_draw else 0
        
        stats = PublicRecommendationStats(
            total_recommendations=total_recommendations,
            ai_recommendations=ai_recommendations,
            manual_recommendations=manual_recommendations,
            member_recommendations=member_recommendations,
            guest_recommendations=guest_recommendations,
            draw_number=current_draw,
            created_at=db.query(PublicRecommendation.created_at).order_by(PublicRecommendation.created_at.desc()).first().created_at if total_recommendations > 0 else None
        )
        
        return APIResponse(
            success=True,
            data=stats,
            message="공공 추천 데이터 통계를 조회했습니다"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"공공 추천 데이터 통계 조회 실패: {str(e)}")
