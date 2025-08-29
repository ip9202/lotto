from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class UserHistory(Base):
    __tablename__ = "user_histories"
    
    id = Column(Integer, primary_key=True, index=True)
    draw_number = Column(Integer, nullable=True, index=True)  # 대상 회차 (null이면 다음 회차)
    session_id = Column(String(255), ForeignKey("user_sessions.session_id"), nullable=False, index=True)  # 사용자 세션 구분용
    total_count = Column(Integer, nullable=False)  # 총 추천 조합 수
    manual_count = Column(Integer, default=0)  # 수동 선택 개수
    auto_count = Column(Integer, default=0)  # AI 추천 개수
    preferences = Column(JSON, nullable=True)  # 선호 설정 (JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # UserSession과의 관계 추가
    session = relationship("UserSession", back_populates="histories")
    
    # 추천 조합들과의 관계
    recommendations = relationship("Recommendation", back_populates="history", cascade="all, delete-orphan")
    
    # 복합 인덱스 생성
    __table_args__ = (
        Index('idx_session_draw', 'session_id', 'draw_number'),
        Index('idx_created_session', 'created_at', 'session_id'),
    )
    
    def __repr__(self):
        return f"<UserHistory(session_id={self.session_id}, total_count={self.total_count}, manual_count={self.manual_count}, auto_count={self.auto_count})>"
    
    @property
    def is_complete(self):
        """모든 추천 조합이 생성되었는지 확인"""
        return self.manual_count + self.auto_count == self.total_count


