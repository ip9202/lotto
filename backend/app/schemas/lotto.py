from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import date

class LottoNumber(BaseModel):
    draw_number: int = Field(..., description="회차")
    draw_date: str = Field(..., description="추첨일 (YYYY-MM-DD)")
    purchase_start_date: Optional[str] = Field(None, description="구매시작일 (YYYY-MM-DD)")
    purchase_end_date: Optional[str] = Field(None, description="구매종료일 (YYYY-MM-DD)")
    purchase_period: Optional[str] = Field(None, description="구매기간 (MM/DD ~ MM/DD)")
    numbers: List[int] = Field(..., min_items=6, max_items=6, description="당첨번호 1~6")
    bonus_number: int = Field(..., ge=1, le=45, description="보너스번호")
    first_winners: int = Field(0, description="1등 당첨자 수")
    first_amount: int = Field(0, description="1등 당첨금액")
    
    @validator('numbers')
    def validate_numbers(cls, v):
        """번호 유효성 검증"""
        if len(set(v)) != 6:
            raise ValueError('중복된 번호가 있습니다')
        if not all(1 <= num <= 45 for num in v):
            raise ValueError('모든 번호는 1-45 사이여야 합니다')
        if v != sorted(v):
            raise ValueError('번호는 오름차순으로 정렬되어야 합니다')
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "draw_number": 1100,
                "draw_date": "2024-01-06",
                "numbers": [1, 15, 22, 28, 35, 42],
                "bonus_number": 7,
                "first_winners": 3,
                "first_amount": 2500000000
            }
        }

class LottoStatistics(BaseModel):
    total_draws: int = Field(..., description="총 추첨 회수")
    latest_draw: int = Field(..., description="최신 회차")
    number_frequency: dict = Field(..., description="번호별 출현 빈도")
    hot_numbers: List[int] = Field(..., description="최근 자주 나온 번호")
    cold_numbers: List[int] = Field(..., description="최근 안 나온 번호")
    
    class Config:
        schema_extra = {
            "example": {
                "total_draws": 1100,
                "latest_draw": 1100,
                "number_frequency": {"1": 150, "2": 145, "3": 148},
                "hot_numbers": [7, 13, 22, 28, 35],
                "cold_numbers": [4, 11, 19, 26, 44]
            }
        }


