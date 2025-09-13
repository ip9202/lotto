from sqlalchemy import Column, Integer, Date, BigInteger, DateTime, CheckConstraint
from sqlalchemy.sql import func
from ..database import Base

class LottoDraw(Base):
    __tablename__ = "lotto_draws"
    
    id = Column(Integer, primary_key=True, index=True)
    draw_number = Column(Integer, unique=True, nullable=False, index=True)  # 회차
    draw_date = Column(Date, nullable=False, index=True)  # 추첨일
    purchase_start_date = Column(Date, nullable=True)  # 구매시작일
    purchase_end_date = Column(Date, nullable=True)  # 구매종료일
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
    
    @property
    def purchase_period(self):
        """구매기간을 문자열로 반환"""
        if self.purchase_start_date and self.purchase_end_date:
            start = self.purchase_start_date.strftime('%m/%d')
            end = self.purchase_end_date.strftime('%m/%d')
            return f"{start} ~ {end}"
        return None
    
    def calculate_purchase_dates(self):
        """추첨일을 기준으로 구매기간 자동 계산 (추첨일 전주 일요일~토요일)"""
        from datetime import timedelta
        # 추첨일(토요일) 기준으로 전주 일요일부터 당일까지
        draw_weekday = self.draw_date.weekday()  # 0=월, 6=일
        
        # 토요일이면 weekday()는 5
        if draw_weekday == 5:  # 토요일
            # 전주 일요일 계산: 토요일에서 6일 빼기
            purchase_start = self.draw_date - timedelta(days=6)
            purchase_end = self.draw_date
        else:
            # 토요일이 아닌 경우 가장 가까운 이전 토요일 찾기
            days_since_saturday = (draw_weekday + 2) % 7
            last_saturday = self.draw_date - timedelta(days=days_since_saturday)
            purchase_start = last_saturday - timedelta(days=6)
            purchase_end = last_saturday
            
        return purchase_start, purchase_end


