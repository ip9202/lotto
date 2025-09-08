from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from ..models.user import SocialProvider, SubscriptionPlan

class UserBase(BaseModel):
    """사용자 기본 정보"""
    nickname: Optional[str] = Field(None, max_length=100, description="사용자 닉네임")
    profile_image_url: Optional[str] = Field(None, max_length=500, description="프로필 이미지 URL")
    preferences: Optional[Dict[str, Any]] = Field(None, description="사용자 설정")
    notification_settings: Optional[Dict[str, Any]] = Field(None, description="알림 설정")

class UserCreate(BaseModel):
    """사용자 생성 요청"""
    social_provider: SocialProvider = Field(..., description="소셜 로그인 제공자")
    access_token: str = Field(..., min_length=1, description="소셜 로그인 액세스 토큰")

class UserUpdate(BaseModel):
    """사용자 정보 업데이트"""
    nickname: Optional[str] = Field(None, max_length=100)
    preferences: Optional[Dict[str, Any]] = None
    notification_settings: Optional[Dict[str, Any]] = None

class UserResponse(BaseModel):
    """사용자 응답 데이터"""
    user_id: str
    nickname: Optional[str]
    profile_image_url: Optional[str]
    email: Optional[str]
    social_provider: Optional[str]
    linked_social_providers: Optional[List[str]] = []
    role: Optional[str] = None
    subscription_plan: str
    subscription_status: str
    is_premium: bool
    total_wins: int
    total_winnings: int
    daily_recommendation_count: int
    total_saved_numbers: int
    can_generate_recommendation: bool
    can_save_number: bool
    created_at: datetime
    last_login_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    """소셜 로그인 요청"""
    provider: str = Field(..., description="소셜 로그인 제공자 (kakao, naver)")
    access_token: str = Field(..., min_length=1, description="소셜 액세스 토큰")
    
    @validator('provider')
    def validate_provider(cls, v):
        if v.lower() not in ['kakao', 'naver']:
            raise ValueError('지원하지 않는 소셜 로그인 제공자입니다')
        return v.lower()

class LoginResponse(BaseModel):
    """로그인 응답"""
    success: bool = True
    message: str = "로그인 성공"
    data: Dict[str, Any]
    
class TokenResponse(BaseModel):
    """JWT 토큰 응답"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UserStats(BaseModel):
    """사용자 통계"""
    total_recommendations: int = Field(0, description="총 추천 생성 횟수")
    total_saved: int = Field(0, description="총 저장 번호 개수") 
    total_wins: int = Field(0, description="총 당첨 횟수")
    total_winnings: int = Field(0, description="총 당첨금액")
    win_rate: float = Field(0.0, description="당첨률 (%)")
    best_rank: Optional[int] = Field(None, description="최고 당첨 순위")
    
class UserProfile(BaseModel):
    """사용자 프로필 (상세 정보)"""
    user_id: str
    nickname: Optional[str]
    profile_image_url: Optional[str]
    email: Optional[str]
    social_provider: str
    subscription_plan: str
    subscription_status: str
    is_premium: bool
    preferences: Optional[Dict[str, Any]]
    notification_settings: Optional[Dict[str, Any]]
    stats: UserStats
    created_at: datetime
    last_login_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class SubscriptionUpdateRequest(BaseModel):
    """구독 플랜 변경 요청"""
    plan: SubscriptionPlan = Field(..., description="변경할 구독 플랜")
    months: int = Field(1, ge=1, le=12, description="구독 기간 (개월)")

class ApiLimitInfo(BaseModel):
    """API 사용 제한 정보"""
    daily_recommendations: Dict[str, Any] = Field(
        default_factory=lambda: {
            "used": 0,
            "limit": 5,
            "remaining": 5,
            "reset_at": None
        }
    )
    saved_numbers: Dict[str, Any] = Field(
        default_factory=lambda: {
            "used": 0,
            "limit": 10,
            "remaining": 10
        }
    )
    is_premium: bool = False
    
class UserDashboard(BaseModel):
    """사용자 대시보드 데이터"""
    user: UserResponse
    stats: UserStats
    limits: ApiLimitInfo
    recent_recommendations: List[Dict[str, Any]] = []
    recent_winnings: List[Dict[str, Any]] = []