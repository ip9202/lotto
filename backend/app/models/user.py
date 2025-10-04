from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON, Text, Index, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base
import uuid
from datetime import datetime, timedelta
import enum
import pytz

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

def get_utc_now():
    """현재 UTC 시간 반환 (시스템 내부용)"""
    utc = pytz.timezone('UTC')
    return datetime.now(utc)

def get_kst_now():
    """현재 한국시간 반환 (사용자 관점용)"""
    kst = pytz.timezone('Asia/Seoul')
    return datetime.now(kst)

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
        return get_utc_now() < self.subscription_end_date
    
    @property
    def can_generate_recommendation(self):
        """추천 생성 가능 여부 (무료 사용자 제한 체크)"""
        if self.is_premium:
            return True
        
        # 날짜가 바뀌면 카운트 리셋
        today = get_utc_now().date()
        if not self.last_recommendation_date or self.last_recommendation_date.date() != today:
            return True
        
        # 무료 사용자는 일일 5개 제한
        return self.daily_recommendation_count < 5
    
    @property
    def current_week_saved_count(self):
        """이번 주 저장 개수 (동적 계산) - 저장 API와 동일한 로직"""
        from sqlalchemy.orm import Session
        from .saved_recommendation import SavedRecommendation
        from datetime import datetime, timedelta

        try:
            from ..database import get_db
            db = next(get_db())

            # 로또 구매 가능 기간과 동일한 주간 계산 로직 (일요일 0시 ~ 토요일 20시, 한국 시간)
            now = get_kst_now()

            # 로또 구매 기간에 따른 주간 계산
            if now.weekday() == 6:  # 일요일
                # 새로운 주: 오늘(일요일)부터
                week_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            elif now.weekday() == 5 and now.hour >= 20:  # 토요일 20시 이후
                # 내일(일요일)부터 새로운 주
                week_start = now + timedelta(days=1)
                week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
            else:  # 월~금, 토요일 20시 이전
                # 현재 주: 가장 최근 일요일부터
                days_back = (now.weekday() + 1) % 7
                if days_back == 0:  # 일요일인 경우 7일 전
                    days_back = 7
                week_start = now - timedelta(days=days_back)
                week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)

            # 로또 구매 종료 시간 (토요일 20시)
            week_end = week_start + timedelta(days=6, hours=20, minutes=0, seconds=0)

            # 이번 주 기준으로 저장된 개수 확인 (활성 상태인 것만)
            # DB의 UTC 시간을 KST로 변환하여 비교
            utc = pytz.timezone('UTC')
            week_start_utc = week_start.astimezone(utc)
            week_end_utc = week_end.astimezone(utc)

            # 현재 회차 조회 (최신 당첨번호 + 1)
            from .lotto import LottoDraw
            latest_draw = db.query(LottoDraw).order_by(LottoDraw.draw_number.desc()).first()
            current_draw = latest_draw.draw_number + 1 if latest_draw else 1

            count = db.query(SavedRecommendation).filter(
                SavedRecommendation.user_id == self.id,
                SavedRecommendation.created_at >= week_start_utc,
                SavedRecommendation.created_at <= week_end_utc,
                SavedRecommendation.is_active == True,
                SavedRecommendation.target_draw_number == current_draw  # 현재 회차만
            ).count()

            return count

        except Exception:
            # 에러 발생 시 기존 값 반환
            return self.total_saved_numbers

    @property
    def can_save_number(self):
        """번호 저장 가능 여부 (주간 제한)"""
        if self.is_premium:
            return True
        
        # 무료 사용자는 현재 회차 기준 주간 10개 제한
        return self.current_week_saved_count < 10
    
    @property
    def subscription_status(self):
        """구독 상태 반환"""
        if self.subscription_plan == SubscriptionPlan.FREE:
            return "무료"
        
        if not self.subscription_end_date:
            return "구독 정보 오류"
        
        if get_utc_now() < self.subscription_end_date:
            days_left = (self.subscription_end_date - get_utc_now()).days
            return f"프리미엄 ({days_left}일 남음)"
        else:
            return "구독 만료"
    
    def increment_recommendation_count(self):
        """추천 생성 횟수 증가"""
        today = get_utc_now().date()
        
        # 날짜가 바뀌면 카운트 리셋
        if not self.last_recommendation_date or self.last_recommendation_date.date() != today:
            self.daily_recommendation_count = 0
        
        self.daily_recommendation_count += 1
        self.last_recommendation_date = get_utc_now()
    
    def increment_saved_count(self):
        """저장된 번호 개수 증가"""
        self.total_saved_numbers += 1
    
    def decrement_saved_count(self):
        """저장된 번호 개수 감소"""
        if self.total_saved_numbers > 0:
            self.total_saved_numbers -= 1
    
    def update_last_login(self):
        """마지막 로그인 시간 업데이트"""
        self.last_login_at = get_utc_now()
    
    def extend_subscription(self, plan: SubscriptionPlan, months: int = 1):
        """구독 연장"""
        self.subscription_plan = plan
        
        if not self.subscription_start_date:
            self.subscription_start_date = get_utc_now()
        
        if not self.subscription_end_date or get_utc_now() > self.subscription_end_date:
            # 구독이 없거나 만료된 경우 현재 시점부터 시작
            self.subscription_end_date = get_utc_now() + timedelta(days=30 * months)
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
            "daily_recommendation_count": self.daily_recommendation_count,
            "total_saved_numbers": self.current_week_saved_count,  # 현재 회차 기준 동적 계산
            "can_generate_recommendation": self.can_generate_recommendation,
            "can_save_number": self.can_save_number,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login_at": self.last_login_at.isoformat() if self.last_login_at else None
        }
    
    def __repr__(self):
        return f"<User(user_id={self.user_id}, nickname={self.nickname}, provider={self.social_provider.value if self.social_provider else None}, plan={self.subscription_plan.value if self.subscription_plan else None})>"