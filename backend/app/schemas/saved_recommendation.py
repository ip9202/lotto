from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime

class SavedRecommendationBase(BaseModel):
    """저장된 추천 기본 정보"""
    numbers: List[int] = Field(..., min_items=6, max_items=6, description="추천 번호 6개")
    title: Optional[str] = Field(None, max_length=100, description="사용자 지정 제목")
    memo: Optional[str] = Field(None, max_length=500, description="사용자 메모")
    tags: Optional[List[str]] = Field(None, description="태그 목록")
    
    @validator('numbers')
    def validate_numbers(cls, v):
        if not all(1 <= num <= 45 for num in v):
            raise ValueError('번호는 1~45 사이여야 합니다')
        if len(set(v)) != len(v):
            raise ValueError('중복된 번호가 있습니다')
        return sorted(v)
    
    @validator('tags')
    def validate_tags(cls, v):
        if v and len(v) > 10:
            raise ValueError('태그는 최대 10개까지 가능합니다')
        return v

class SavedRecommendationCreate(SavedRecommendationBase):
    """추천 번호 저장 요청"""
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="AI 신뢰도 점수")
    generation_method: str = Field(..., description="생성 방법 (ai, manual, hybrid)")
    analysis_data: Optional[Dict[str, Any]] = Field(None, description="분석 데이터")
    target_draw_number: Optional[int] = Field(None, description="목표 회차")
    
    @validator('generation_method')
    def validate_generation_method(cls, v):
        if v not in ['ai', 'manual', 'hybrid']:
            raise ValueError('generation_method는 ai, manual, hybrid 중 하나여야 합니다')
        return v

class SavedRecommendationUpdate(BaseModel):
    """저장된 추천 업데이트"""
    title: Optional[str] = Field(None, max_length=100)
    memo: Optional[str] = Field(None, max_length=500)
    tags: Optional[List[str]] = None
    is_purchased: Optional[bool] = None
    target_draw_number: Optional[int] = None
    
    @validator('tags')
    def validate_tags(cls, v):
        if v and len(v) > 10:
            raise ValueError('태그는 최대 10개까지 가능합니다')
        return v

class SavedRecommendationResponse(BaseModel):
    """저장된 추천 응답"""
    id: int
    user_id: int
    numbers: List[int]
    numbers_string: str
    confidence_score: float
    confidence_percentage: float
    generation_method: str
    title: Optional[str]
    memo: Optional[str]
    tags: Optional[List[str]]
    target_draw_number: Optional[int]
    is_purchased: bool
    purchase_date: Optional[datetime]
    is_checked: bool
    winning_status: str
    is_winner: bool
    winning_rank: Optional[int]
    winning_amount: Optional[int]
    matched_count: int
    matched_numbers: Optional[List[int]]
    is_favorite: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class SavedRecommendationList(BaseModel):
    """저장된 추천 목록"""
    items: List[SavedRecommendationResponse]
    total: int
    page: int
    per_page: int
    has_next: bool
    has_prev: bool

class RecommendationFilter(BaseModel):
    """추천 번호 필터"""
    generation_method: Optional[str] = None
    is_favorite: Optional[bool] = None
    is_winner: Optional[bool] = None
    is_purchased: Optional[bool] = None
    target_draw_number: Optional[int] = None
    tags: Optional[List[str]] = None
    
class RecommendationSort(BaseModel):
    """정렬 옵션"""
    field: str = Field("created_at", description="정렬 필드")
    order: str = Field("desc", description="정렬 순서 (asc, desc)")
    
    @validator('field')
    def validate_field(cls, v):
        allowed_fields = [
            'created_at', 'updated_at', 'confidence_score', 
            'winning_amount', 'matched_count', 'target_draw_number'
        ]
        if v not in allowed_fields:
            raise ValueError(f'정렬 필드는 {", ".join(allowed_fields)} 중 하나여야 합니다')
        return v
    
    @validator('order')
    def validate_order(cls, v):
        if v.lower() not in ['asc', 'desc']:
            raise ValueError('정렬 순서는 asc 또는 desc여야 합니다')
        return v.lower()

class BulkActionRequest(BaseModel):
    """일괄 작업 요청"""
    ids: List[int] = Field(..., min_items=1, description="대상 ID 목록")
    action: str = Field(..., description="작업 타입")
    
    @validator('action')
    def validate_action(cls, v):
        allowed_actions = ['delete', 'archive', 'restore', 'favorite', 'unfavorite']
        if v not in allowed_actions:
            raise ValueError(f'작업은 {", ".join(allowed_actions)} 중 하나여야 합니다')
        return v

class WinningCheckRequest(BaseModel):
    """당첨 확인 요청"""
    draw_number: int = Field(..., description="회차 번호")
    winning_numbers: List[int] = Field(..., min_items=6, max_items=6, description="당첨 번호")
    bonus_number: int = Field(..., description="보너스 번호")
    
    @validator('winning_numbers')
    def validate_winning_numbers(cls, v):
        if not all(1 <= num <= 45 for num in v):
            raise ValueError('번호는 1~45 사이여야 합니다')
        if len(set(v)) != len(v):
            raise ValueError('중복된 번호가 있습니다')
        return v
    
    @validator('bonus_number')
    def validate_bonus_number(cls, v):
        if not 1 <= v <= 45:
            raise ValueError('보너스 번호는 1~45 사이여야 합니다')
        return v

class RecommendationStats(BaseModel):
    """추천 통계"""
    total_saved: int = 0
    total_checked: int = 0
    total_winners: int = 0
    total_winnings: int = 0
    win_rate: float = 0.0
    avg_confidence: float = 0.0
    by_method: Dict[str, int] = {}
    by_rank: Dict[str, int] = {}
    recent_activity: List[Dict[str, Any]] = []

class RecommendationExportRequest(BaseModel):
    """내보내기 요청"""
    format: str = Field("csv", description="내보내기 형식")
    filter: Optional[RecommendationFilter] = None
    
    @validator('format')
    def validate_format(cls, v):
        if v.lower() not in ['csv', 'excel', 'json']:
            raise ValueError('형식은 csv, excel, json 중 하나여야 합니다')
        return v.lower()