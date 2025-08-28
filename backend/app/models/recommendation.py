from sqlalchemy import Column, Integer, String, Boolean, Numeric, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    history_id = Column(Integer, ForeignKey("user_histories.id", ondelete="CASCADE"), nullable=False, index=True)
    combination_type = Column(String(20), nullable=False, index=True)  # 'manual' 또는 'auto'
    numbers = Column(ARRAY(Integer), nullable=False)  # 번호 배열 [1,15,22,28,35,42]
    is_manual = Column(Boolean, default=False)  # 수동 선택 여부
    confidence_score = Column(Numeric(3, 2), nullable=True)  # AI 신뢰도 (0.00-1.00)
    win_rank = Column(Integer, nullable=True)  # 당첨 등수 (1-5등, null=미당첨)
    win_amount = Column(Integer, default=0)  # 당첨 금액
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # UserHistory와의 관계
    history = relationship("UserHistory", back_populates="recommendations")
    
    # 인덱스 생성
    __table_args__ = (
        Index('idx_history_type', 'history_id', 'combination_type'),
        Index('idx_numbers_gin', 'numbers', postgresql_using='gin'),  # 배열 검색 최적화
    )
    
    def __repr__(self):
        return f"<Recommendation(history_id={self.history_id}, type={self.combination_type}, numbers={self.numbers}, is_manual={self.is_manual})>"
    
    @property
    def is_winner(self):
        """당첨 여부 확인"""
        return self.win_rank is not None and self.win_rank <= 5
    
    @property
    def formatted_numbers(self):
        """포맷된 번호 문자열 반환"""
        return ", ".join(map(str, sorted(self.numbers)))


