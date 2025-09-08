from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON, Text, Index, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base
import uuid
from datetime import datetime, timedelta
import enum

class SocialProvider(enum.Enum):
    """소셜 로그인 제공자"""
    KAKAO = "kakao"
    NAVER = "naver"
    # 추후 구글, 애플 등 확장 가능

class LoginMethod(enum.Enum):
    """로그인 방식"""
    SOCIAL = "social"
    EMAIL = "email"

class UserRole(enum.Enum):
    """사용자 역할"""
    USER = "user"
    ADMIN = "admin"

class SubscriptionPlan(enum.Enum):
    """구독 플랜"""
    FREE = "free"
    PREMIUM = "premium"
    PRO = "pro"

class User(Base):
    """사용자 모델"""
    __tablename__ = "users"
    
    # 기본 정보
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), unique=True, nullable=False, index=True)  # 고유 사용자 ID
    
    # 인증 정보
    login_method = Column(SQLEnum(LoginMethod), nullable=False, default=LoginMethod.SOCIAL)  # 로그인 방식
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.USER)  # 사용자 역할
    
    # 소셜 로그인 정보 (소셜 로그인인 경우에만 사용)
    social_provider = Column(SQLEnum(SocialProvider), nullable=True)  # 소셜 제공자
    social_id = Column(String(255), nullable=True)  # 카카오/네이버에서 제공하는 ID
    
    # 이메일 로그인 정보 (직접 회원가입인 경우에만 사용)
    password_hash = Column(String(255), nullable=True)  # 비밀번호 해시
    
    # 소셜 연동 정보 (연동된 소셜 제공자들)
    linked_social_providers = Column(JSON, nullable=True, default=list)  # ["kakao", "naver"]
    
    # 프로필 정보
    email = Column(String(255), nullable=True, index=True)  # 이메일 (소셜/직접 모두)
    nickname = Column(String(100), nullable=True)  # 표시용 닉네임
    profile_image_url = Column(String(500), nullable=True)  # 프로필 이미지 URL
    
    # 계정 상태
    is_active = Column(Boolean, default=True, index=True)
    is_verified = Column(Boolean, default=False)  # 이메일 인증 여부
    
    # 구독 정보
    subscription_plan = Column(SQLEnum(SubscriptionPlan), default=SubscriptionPlan.FREE)
    subscription_start_date = Column(DateTime(timezone=True), nullable=True)
    subscription_end_date = Column(DateTime(timezone=True), nullable=True)
    
    # 사용량 제한 (무료 사용자용)
    daily_recommendation_count = Column(Integer, default=0)  # 일일 추천 생성 횟수
    total_saved_numbers = Column(Integer, default=0)  # 저장된 번호 총 개수
    last_recommendation_date = Column(DateTime(timezone=True), nullable=True)  # 마지막 추천 날짜
    
    # 설정 및 선호도
    preferences = Column(JSON, nullable=True)  # 사용자 설정 저장
    notification_settings = Column(JSON, nullable=True)  # 알림 설정
    
    # 통계 정보
    total_wins = Column(Integer, default=0)  # 총 당첨 횟수
    total_winnings = Column(Integer, default=0)  # 총 당첨금액 (원)
    
    # 시간 관리
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    
    # 관계 설정
    saved_recommendations = relationship("SavedRecommendation", back_populates="user", cascade="all, delete-orphan")
    
    # 복합 인덱스
    __table_args__ = (
        Index('idx_social_provider_id', 'social_provider', 'social_id'),  # 소셜 로그인 조회용
        Index('idx_email_login', 'email', 'login_method'),  # 이메일 로그인 조회용
        Index('idx_user_role', 'role', 'is_active'),  # 역할 기반 조회용
        Index('idx_user_active', 'is_active', 'created_at'),
        Index('idx_subscription', 'subscription_plan', 'subscription_end_date'),
        Index('idx_daily_limit', 'last_recommendation_date', 'daily_recommendation_count'),
    )
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.user_id:
            self.user_id = self.generate_user_id()
    
    @staticmethod
    def generate_user_id():
        """고유 사용자 ID 생성"""
        return f"user_{uuid.uuid4().hex[:16]}"
    
    @property
    def is_premium(self):
        """프리미엄 사용자 여부"""
        if self.subscription_plan == SubscriptionPlan.FREE:
            return False
        if not self.subscription_end_date:
            return False
        return datetime.utcnow() < self.subscription_end_date
    
    @property
    def can_generate_recommendation(self):
        """추천 생성 가능 여부 (무료 사용자 제한 체크)"""
        if self.is_premium:
            return True
        
        # 날짜가 바뀌면 카운트 리셋
        today = datetime.utcnow().date()
        if not self.last_recommendation_date or self.last_recommendation_date.date() != today:
            return True
        
        # 무료 사용자는 일일 5개 제한
        return self.daily_recommendation_count < 5
    
    @property
    def can_save_number(self):
        """번호 저장 가능 여부"""
        if self.is_premium:
            return True
        
        # 무료 사용자는 10개 제한
        return self.total_saved_numbers < 10
    
    @property
    def subscription_status(self):
        """구독 상태 반환"""
        if self.subscription_plan == SubscriptionPlan.FREE:
            return "무료"
        
        if not self.subscription_end_date:
            return "구독 정보 오류"
        
        if datetime.utcnow() < self.subscription_end_date:
            days_left = (self.subscription_end_date - datetime.utcnow()).days
            return f"프리미엄 ({days_left}일 남음)"
        else:
            return "구독 만료"
    
    def increment_recommendation_count(self):
        """추천 생성 횟수 증가"""
        today = datetime.utcnow().date()
        
        # 날짜가 바뀌면 카운트 리셋
        if not self.last_recommendation_date or self.last_recommendation_date.date() != today:
            self.daily_recommendation_count = 0
        
        self.daily_recommendation_count += 1
        self.last_recommendation_date = datetime.utcnow()
    
    def increment_saved_count(self):
        """저장된 번호 개수 증가"""
        self.total_saved_numbers += 1
    
    def decrement_saved_count(self):
        """저장된 번호 개수 감소"""
        if self.total_saved_numbers > 0:
            self.total_saved_numbers -= 1
    
    def update_last_login(self):
        """마지막 로그인 시간 업데이트"""
        self.last_login_at = datetime.utcnow()
    
    def extend_subscription(self, plan: SubscriptionPlan, months: int = 1):
        """구독 연장"""
        self.subscription_plan = plan
        
        if not self.subscription_start_date:
            self.subscription_start_date = datetime.utcnow()
        
        if not self.subscription_end_date or datetime.utcnow() > self.subscription_end_date:
            # 구독이 없거나 만료된 경우 현재 시점부터 시작
            self.subscription_end_date = datetime.utcnow() + timedelta(days=30 * months)
        else:
            # 기존 구독에 연장
            self.subscription_end_date += timedelta(days=30 * months)
    
    def cancel_subscription(self):
        """구독 취소 (만료일까지는 유효)"""
        # 실제로는 만료일에 FREE로 변경하는 스케줄링 필요
        pass
    
    def add_winnings(self, amount: int):
        """당첨금액 추가"""
        self.total_wins += 1
        self.total_winnings += amount
    
    def to_dict(self):
        """딕셔너리 변환 (API 응답용)"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "nickname": self.nickname,
            "profile_image_url": self.profile_image_url,
            "email": self.email,
            "login_method": self.login_method.value if self.login_method else None,
            "role": self.role.value if self.role else None,
            "social_provider": self.social_provider.value if self.social_provider else None,
            "linked_social_providers": self.linked_social_providers or [],
            "subscription_plan": self.subscription_plan.value if self.subscription_plan else "free",
            "subscription_status": self.subscription_status,
            "is_premium": self.is_premium,
            "is_verified": self.is_verified,
            "preferences": self.preferences,
            "notification_settings": self.notification_settings,
            "total_wins": self.total_wins,
            "total_winnings": self.total_winnings,
            "daily_recommendation_count": self.daily_recommendation_count,
            "total_saved_numbers": self.total_saved_numbers,
            "can_generate_recommendation": self.can_generate_recommendation,
            "can_save_number": self.can_save_number,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login_at": self.last_login_at.isoformat() if self.last_login_at else None
        }
    
    def __repr__(self):
        return f"<User(user_id={self.user_id}, nickname={self.nickname}, provider={self.social_provider.value if self.social_provider else None}, plan={self.subscription_plan.value if self.subscription_plan else None})>"