from pydantic import BaseModel, Field
from typing import List, Optional, Any, Literal
from datetime import datetime

class PublicRecommendationBase(BaseModel):
    """공공 추천 기본 스키마"""
    numbers: List[int] = Field(..., min_items=6, max_items=6, description="추천 번호 6개")
    generation_method: Literal["ai", "manual"] = Field(..., description="생성 방법")
    confidence_score: Optional[int] = Field(None, ge=0, le=100, description="신뢰도 점수 (0-100)")
    analysis_data: Optional[dict] = Field(None, description="분석 데이터")
    draw_number: int = Field(..., gt=0, description="회차 번호")
    user_type: Literal["member", "guest"] = Field(..., description="사용자 타입")

class PublicRecommendationCreate(PublicRecommendationBase):
    """공공 추천 생성 스키마"""
    pass

class PublicRecommendationResponse(PublicRecommendationBase):
    """공공 추천 응답 스키마"""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class PublicRecommendationList(BaseModel):
    """공공 추천 목록 응답 스키마"""
    success: bool
    data: List[PublicRecommendationResponse]
    total: int
    draw_number: int
    message: str

class PublicRecommendationStats(BaseModel):
    """공공 추천 통계 스키마"""
    total_recommendations: int
    ai_recommendations: int
    manual_recommendations: int
    member_recommendations: int
    guest_recommendations: int
    draw_number: int
    created_at: datetime
