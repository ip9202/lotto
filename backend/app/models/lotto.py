from sqlalchemy import Column, Integer, Date, BigInteger, DateTime, CheckConstraint
from sqlalchemy.sql import func
from ..database import Base

class LottoDraw(Base):
    __tablename__ = "lotto_draws"
    
    id = Column(Integer, primary_key=True, index=True)
    draw_number = Column(Integer, unique=True, nullable=False, index=True)  # 회차
    draw_date = Column(Date, nullable=False, index=True)  # 추첨일
    number_1 = Column(Integer, nullable=False)
    number_2 = Column(Integer, nullable=False)
    number_3 = Column(Integer, nullable=False)
    number_4 = Column(Integer, nullable=False)
    number_5 = Column(Integer, nullable=False)
    number_6 = Column(Integer, nullable=False)
    bonus_number = Column(Integer, nullable=False)
    first_winners = Column(Integer, default=0)  # 1등 당첨자 수
    first_amount = Column(BigInteger, default=0)  # 1등 당첨금액
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 번호 범위 제약조건
    __table_args__ = (
        CheckConstraint('number_1 BETWEEN 1 AND 45', name='check_number_1_range'),
        CheckConstraint('number_2 BETWEEN 1 AND 45', name='check_number_2_range'),
        CheckConstraint('number_3 BETWEEN 1 AND 45', name='check_number_3_range'),
        CheckConstraint('number_4 BETWEEN 1 AND 45', name='check_number_4_range'),
        CheckConstraint('number_5 BETWEEN 1 AND 45', name='check_number_5_range'),
        CheckConstraint('number_6 BETWEEN 1 AND 45', name='check_number_6_range'),
        CheckConstraint('bonus_number BETWEEN 1 AND 45', name='check_bonus_range'),
        # 번호 정렬 순서 제약조건
        CheckConstraint('number_1 < number_2', name='check_order_1_2'),
        CheckConstraint('number_2 < number_3', name='check_order_2_3'),
        CheckConstraint('number_3 < number_4', name='check_order_3_4'),
        CheckConstraint('number_4 < number_5', name='check_order_4_5'),
        CheckConstraint('number_5 < number_6', name='check_order_5_6'),
    )
    
    def __repr__(self):
        return f"<LottoDraw(draw_number={self.draw_number}, numbers={[self.number_1, self.number_2, self.number_3, self.number_4, self.number_5, self.number_6]}, bonus={self.bonus_number})>"
    
    @property
    def numbers(self):
        """당첨 번호 6개를 리스트로 반환"""
        return [self.number_1, self.number_2, self.number_3, self.number_4, self.number_5, self.number_6]


