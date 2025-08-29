from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime

class SessionBase(BaseModel):
    """세션 기본 스키마"""
    session_name: Optional[str] = Field(None, max_length=100, description="세션 이름")
    max_recommendations: int = Field(10, ge=1, le=100, description="최대 추천 조합 수")
    manual_ratio: int = Field(30, ge=0, le=100, description="수동 조합 비율 (%)")
    auto_ratio: int = Field(70, ge=0, le=100, description="AI 추천 비율 (%)")
    include_numbers: Optional[List[int]] = Field(None, description="포함할 번호들")
    exclude_numbers: Optional[List[int]] = Field(None, description="제외할 번호들")
    description: Optional[str] = Field(None, description="세션 설명")
    tags: Optional[List[str]] = Field(None, description="태그 목록")
    
    @validator('manual_ratio', 'auto_ratio')
    def validate_ratios(cls, v):
        """비율 유효성 검증"""
        if v < 0 or v > 100:
            raise ValueError('비율은 0-100 사이여야 합니다')
        return v
    
    @validator('include_numbers', 'exclude_numbers')
    def validate_numbers(cls, v):
        """번호 유효성 검증"""
        if v is not None:
            for num in v:
                if num < 1 or num > 45:
                    raise ValueError('번호는 1-45 사이여야 합니다')
            if len(set(v)) != len(v):
                raise ValueError('중복된 번호가 있습니다')
        return v
    
    @validator('auto_ratio', always=True)
    def validate_total_ratio(cls, v, values):
        """수동+자동 비율 합계 검증"""
        if 'manual_ratio' in values:
            total = values['manual_ratio'] + v
            if total != 100:
                raise ValueError('수동 비율과 자동 비율의 합이 100%여야 합니다')
        return v

class SessionCreate(SessionBase):
    """세션 생성 스키마"""
    pass

class SessionUpdate(BaseModel):
    """세션 업데이트 스키마"""
    session_name: Optional[str] = Field(None, max_length=100)
    max_recommendations: Optional[int] = Field(None, ge=1, le=100)
    manual_ratio: Optional[int] = Field(None, ge=0, le=100)
    auto_ratio: Optional[int] = Field(None, ge=0, le=100)
    include_numbers: Optional[List[int]] = None
    exclude_numbers: Optional[List[int]] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None

class SessionResponse(SessionBase):
    """세션 응답 스키마"""
    id: int
    session_id: str
    is_active: bool
    is_admin_created: bool
    created_by: str
    created_at: datetime
    updated_at: datetime
    expires_at: Optional[datetime]
    total_histories: int
    total_recommendations: int
    days_until_expiry: Optional[int]
    
    class Config:
        from_attributes = True

class SessionList(BaseModel):
    """세션 목록 응답 스키마"""
    sessions: List[SessionResponse]
    total: int
    active_count: int
    expired_count: int

class SessionStats(BaseModel):
    """세션 통계 스키마"""
    total_sessions: int
    active_sessions: int
    expired_sessions: int
    total_recommendations: int
    avg_recommendations_per_session: float
    most_used_tags: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]

class SessionBulkCreate(BaseModel):
    """세션 일괄 생성 스키마"""
    count: int = Field(1, ge=1, le=50, description="생성할 세션 수")
    base_config: SessionBase = Field(..., description="기본 설정")
    naming_pattern: Optional[str] = Field("테스트 세션 {n}", description="이름 패턴 ({n}은 번호로 대체)")
    
    @validator('count')
    def validate_count(cls, v):
        """생성 수 제한"""
        if v > 50:
            raise ValueError('한 번에 최대 50개 세션만 생성할 수 있습니다')
        return v
