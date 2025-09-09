from sqlalchemy import Column, Integer, String, DateTime, JSON, Index
from sqlalchemy.sql import func
from ..database import Base

class PublicRecommendation(Base):
    """공공 추천 데이터 모델 (전체 통계용)"""
    __tablename__ = "public_recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    numbers = Column(JSON, nullable=False)  # 추천 번호들 [1, 5, 12, 23, 28, 35]
    generation_method = Column(String(20), nullable=False)  # 'ai' or 'manual'
    confidence_score = Column(Integer)  # 신뢰도 점수 (0-100)
    analysis_data = Column(JSON, nullable=True)  # 분석 데이터
    draw_number = Column(Integer, nullable=False, index=True)  # 추천 생성 시점의 회차
    user_type = Column(String(10), nullable=False)  # 'member' or 'guest'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 인덱스 생성
    __table_args__ = (
        Index('idx_public_draw_number', 'draw_number'),
        Index('idx_public_user_type', 'user_type'),
        Index('idx_public_created_at', 'created_at'),
        Index('idx_public_method', 'generation_method'),
    )
    
    def __repr__(self):
        return f"<PublicRecommendation(id={self.id}, draw_number={self.draw_number}, method={self.generation_method}, user_type={self.user_type})>"
