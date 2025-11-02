from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime

class PreferenceSettings(BaseModel):
    include_numbers: List[int] = Field(default=[], description="포함할 번호 (최대 5개, 추천 조합에 무조건 포함)")
    exclude_numbers: List[int] = Field(default=[], description="제외할 번호 (추천 조합에서 무조건 제외)")
    avoid_consecutive: bool = Field(False, description="연속번호 회피")
    balance_odd_even: bool = Field(False, description="홀짝 균형 고려")
    
    @validator('include_numbers')
    def validate_include_numbers(cls, v):
        """포함할 번호 검증"""
        if len(v) > 5:
            raise ValueError('포함할 번호는 최대 5개까지 가능합니다 (6개면 전체 조합이 정해짐)')
        for num in v:
            if not (1 <= num <= 45):
                raise ValueError(f'번호 {num}는 1-45 사이여야 합니다')
        return v
    
    @validator('exclude_numbers')
    def validate_exclude_numbers(cls, v):
        """제외할 번호 검증"""
        for num in v:
            if not (1 <= num <= 45):
                raise ValueError(f'번호 {num}는 1-45 사이여야 합니다')
        return v
    
    @validator('exclude_numbers')
    def validate_no_overlap(cls, v, values):
        """포함/제외 번호 중복 방지"""
        include = values.get('include_numbers', [])
        overlap = set(v) & set(include)
        if overlap:
            raise ValueError(f'포함과 제외 번호에 중복이 있습니다: {overlap}')
        return v

class ManualCombination(BaseModel):
    numbers: List[int] = Field(..., min_items=6, max_items=6, description="수동 선택 번호")
    
    @validator('numbers')
    def validate_manual_numbers(cls, v):
        """수동 선택 번호 검증"""
        if len(set(v)) != 6:
            raise ValueError('중복된 번호가 있습니다')
        if not all(1 <= num <= 45 for num in v):
            raise ValueError('모든 번호는 1-45 사이여야 합니다')
        if v != sorted(v):
            raise ValueError('번호는 오름차순으로 정렬되어야 합니다')
        return v

class RecommendationRequest(BaseModel):
    session_id: str = Field(..., description="사용자 세션 ID")
    total_count: int = Field(..., ge=1, le=20, description="총 추천 조합 수")
    manual_combinations: List[ManualCombination] = Field(default=[], description="수동 조합")
    preferences: PreferenceSettings = Field(default_factory=PreferenceSettings)
    target_draw: Optional[int] = Field(None, description="대상 회차 (null이면 다음 회차)")
    use_ml_model: bool = Field(default=False, description="ML 모델 사용 여부 (True: AI 예측, False: 통계 분석)")
    
    @validator('total_count')
    def validate_total_count(cls, v, values):
        """총 개수와 수동 조합 개수 검증"""
        manual_count = len(values.get('manual_combinations', []))
        if v < manual_count:
            raise ValueError('총 개수는 수동 조합 개수보다 커야 합니다')
        return v
    
    @validator('manual_combinations')
    def validate_manual_combinations(cls, v):
        """수동 조합 검증"""
        for combo in v:
            if len(combo.numbers) != 6:
                raise ValueError('각 수동 조합은 정확히 6개의 번호를 가져야 합니다')
            if len(set(combo.numbers)) != 6:
                raise ValueError('수동 조합에 중복된 번호가 있습니다')
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "session_id": "sess_abc123",
                "total_count": 10,
                "manual_combinations": [
                    {"numbers": [3, 12, 19, 27, 34, 41]},
                    {"numbers": [7, 13, 21, 29, 36, 43]}
                ],
                "preferences": {
                    "include_numbers": [7, 13],
                    "exclude_numbers": [4, 44],
                    "avoid_consecutive": True,
                    "balance_odd_even": True
                }
            }
        }

class CombinationAnalysis(BaseModel):
    hot_numbers: int = Field(..., description="핫 넘버 개수")
    hot_number_list: List[int] = Field(..., description="핫 넘버 리스트")
    cold_numbers: int = Field(..., description="콜드 넘버 개수")
    cold_number_list: List[int] = Field(..., description="콜드 넘버 리스트")
    odd_even_ratio: str = Field(..., description="홀짝 비율 (예: 3:3)")
    odd_numbers: List[int] = Field(..., description="홀수 번호 리스트")
    even_numbers: List[int] = Field(..., description="짝수 번호 리스트")
    sum: int = Field(..., description="번호 합계")
    consecutive_count: int = Field(..., description="연속 번호 개수")
    consecutive_numbers: List[int] = Field(..., description="연속된 번호 리스트")
    range_distribution: str = Field(..., description="구간 분포 (예: 1-15:2, 16-30:2, 31-45:2)")

class CombinationDetail(BaseModel):
    numbers: List[int] = Field(..., description="번호 조합")
    is_manual: bool = Field(..., description="수동 선택 여부")
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="AI 신뢰도")
    analysis: Optional[CombinationAnalysis] = Field(None, description="조합 분석 결과")

class RecommendationResponse(BaseModel):
    history_id: int = Field(..., description="추천 기록 ID")
    session_id: str = Field(..., description="사용자 세션 ID")
    target_draw: int = Field(..., description="대상 회차")
    total_count: int = Field(..., description="총 추천 조합 수")
    manual_count: int = Field(..., description="수동 선택 개수")
    auto_count: int = Field(..., description="AI 추천 개수")
    combinations: List[CombinationDetail] = Field(..., description="추천 조합 목록")
    created_at: str = Field(..., description="생성 시간")

class APIResponse(BaseModel):
    success: bool = Field(..., description="요청 성공 여부")
    data: Optional[Any] = Field(None, description="응답 데이터")
    error: Optional[Dict[str, Any]] = Field(None, description="에러 정보")
    message: Optional[str] = Field(None, description="응답 메시지")


