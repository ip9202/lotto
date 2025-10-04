from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON, Text, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base
import uuid
from datetime import datetime, timedelta
import pytz

def get_utc_now():
    """현재 UTC 시간 반환 (시스템 내부용)"""
    utc = pytz.timezone('UTC')
    return datetime.now(utc)

class UserSession(Base):
    """사용자 세션 관리 모델"""
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(255), unique=True, nullable=False, index=True)  # 고유 세션 ID
    session_name = Column(String(100), nullable=True)  # 세션 이름 (관리자가 설정)
    is_active = Column(Boolean, default=True, index=True)  # 활성 상태
    is_admin_created = Column(Boolean, default=False)  # 관리자 생성 여부
    created_by = Column(String(100), default="admin")  # 생성자 (기본값: admin)
    
    # 세션 설정
    max_recommendations = Column(Integer, default=10)  # 최대 추천 조합 수
    manual_ratio = Column(Integer, default=30)  # 수동 조합 비율 (%)
    auto_ratio = Column(Integer, default=70)  # AI 추천 비율 (%)
    
    # 포함/제외 번호 설정
    include_numbers = Column(JSON, nullable=True)  # 포함할 번호들 [1, 15, 22]
    exclude_numbers = Column(JSON, nullable=True)  # 제외할 번호들 [7, 13, 28]
    
    # 세션 메타데이터
    description = Column(Text, nullable=True)  # 세션 설명
    tags = Column(JSON, nullable=True)  # 태그 ["테스트", "고급사용자"]
    
    # 시간 관리
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)  # 만료 시간
    
    # UserHistory와의 관계
    histories = relationship("UserHistory", back_populates="session", cascade="all, delete-orphan")
    
    # 인덱스 생성
    __table_args__ = (
        Index('idx_session_active', 'is_active', 'created_at'),
        Index('idx_admin_created', 'is_admin_created', 'created_at'),
        Index('idx_expires_at', 'expires_at'),
    )
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.session_id:
            self.session_id = self.generate_session_id()
        if not self.expires_at:
            self.expires_at = get_utc_now() + timedelta(days=30)  # 기본 30일
    
    @staticmethod
    def generate_session_id():
        """고유 세션 ID 생성"""
        return f"session_{uuid.uuid4().hex[:16]}"
    
    @property
    def is_expired(self):
        """세션이 만료되었는지 확인"""
        if not self.expires_at:
            return False
        return get_utc_now() > self.expires_at
    
    @property
    def days_until_expiry(self):
        """만료까지 남은 일수"""
        if not self.expires_at:
            return None
        delta = self.expires_at - get_utc_now()
        return max(0, delta.days)
    
    @property
    def total_histories(self):
        """이 세션의 총 추천 기록 수"""
        return len(self.histories) if self.histories else 0
    
    @property
    def total_recommendations(self):
        """이 세션의 총 추천 조합 수"""
        total = 0
        for history in self.histories:
            total += history.total_count
        return total
    
    def extend_expiry(self, days=30):
        """세션 만료 시간 연장"""
        if self.expires_at:
            self.expires_at += timedelta(days=days)
        else:
            self.expires_at = get_utc_now() + timedelta(days=days)
    
    def deactivate(self):
        """세션 비활성화"""
        self.is_active = False
        self.updated_at = get_utc_now()
    
    def activate(self):
        """세션 활성화"""
        self.is_active = True
        self.updated_at = get_utc_now()
    
    def __repr__(self):
        return f"<UserSession(id={self.id}, session_id={self.session_id}, name={self.session_name}, active={self.is_active})>"
