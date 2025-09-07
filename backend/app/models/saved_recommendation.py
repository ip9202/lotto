from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON, Float, ForeignKey, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base
from datetime import datetime

class SavedRecommendation(Base):
    """저장된 추천 번호 모델"""
    __tablename__ = "saved_recommendations"
    
    # 기본 정보
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), ForeignKey("users.user_id"), nullable=False, index=True)
    
    # 추천 번호 정보
    numbers = Column(JSON, nullable=False)  # [1, 15, 23, 28, 35, 42] 형태
    bonus_number = Column(Integer, nullable=True)  # 보너스 번호 (당첨 시 확인용)
    
    # AI 추천 관련 정보
    confidence_score = Column(Float, nullable=False)  # AI 신뢰도 점수 (0.0 ~ 1.0)
    generation_method = Column(String(50), nullable=False)  # 'ai', 'manual', 'hybrid'
    analysis_data = Column(JSON, nullable=True)  # 당시 분석 데이터 저장
    
    # 메타데이터
    title = Column(String(100), nullable=True)  # 사용자가 지정한 제목
    memo = Column(String(500), nullable=True)  # 사용자 메모
    tags = Column(JSON, nullable=True)  # 태그 배열 ["행운", "생일", "패턴"]
    
    # 당첨 관련 정보
    target_draw_number = Column(Integer, nullable=True, index=True)  # 목표 회차
    is_purchased = Column(Boolean, default=False)  # 실제 구매 여부
    purchase_date = Column(DateTime(timezone=True), nullable=True)  # 구매 일시
    
    # 당첨 결과 (자동 업데이트)
    is_checked = Column(Boolean, default=False)  # 당첨 확인 여부
    winning_rank = Column(Integer, nullable=True)  # 당첨 순위 (1~5등)
    winning_amount = Column(Integer, nullable=True)  # 당첨 금액
    matched_count = Column(Integer, default=0)  # 맞춘 번호 개수
    matched_numbers = Column(JSON, nullable=True)  # 맞춘 번호들
    
    # 즐겨찾기 및 상태
    is_favorite = Column(Boolean, default=False, index=True)  # 즐겨찾기 여부
    is_active = Column(Boolean, default=True, index=True)  # 활성 상태
    
    # 시간 관리
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 관계 설정
    user = relationship("User", back_populates="saved_recommendations")
    
    # 복합 인덱스
    __table_args__ = (
        Index('idx_user_created', 'user_id', 'created_at'),
        Index('idx_user_favorite', 'user_id', 'is_favorite'),
        Index('idx_target_draw', 'target_draw_number', 'is_checked'),
        Index('idx_winning_rank', 'winning_rank', 'winning_amount'),
        Index('idx_user_active', 'user_id', 'is_active'),
    )
    
    @property
    def sorted_numbers(self):
        """정렬된 번호 반환"""
        if isinstance(self.numbers, list):
            return sorted(self.numbers)
        return []
    
    @property
    def numbers_string(self):
        """번호를 문자열로 표시 (예: "1, 15, 23, 28, 35, 42")"""
        return ", ".join(map(str, self.sorted_numbers))
    
    @property
    def is_winner(self):
        """당첨 여부"""
        return self.winning_rank is not None and self.winning_rank <= 5
    
    @property
    def winning_status(self):
        """당첨 상태 문자열"""
        if not self.is_checked:
            return "미확인"
        
        if self.is_winner:
            return f"{self.winning_rank}등 ({self.winning_amount:,}원)"
        elif self.matched_count > 0:
            return f"{self.matched_count}개 맞춤 (낙첨)"
        else:
            return "낙첨"
    
    @property
    def confidence_percentage(self):
        """신뢰도를 퍼센트로 표시"""
        return round(self.confidence_score * 100, 1)
    
    def mark_as_purchased(self, target_draw: int = None):
        """구매 완료 처리"""
        self.is_purchased = True
        self.purchase_date = datetime.utcnow()
        if target_draw:
            self.target_draw_number = target_draw
    
    def update_winning_result(self, winning_numbers: list, bonus_number: int, draw_number: int):
        """당첨 결과 업데이트"""
        if not isinstance(self.numbers, list):
            return
        
        # 맞춘 번호 계산
        user_numbers = set(self.numbers)
        winning_set = set(winning_numbers)
        matched = list(user_numbers.intersection(winning_set))
        matched_count = len(matched)
        
        # 보너스 번호 확인
        bonus_matched = bonus_number in user_numbers
        
        # 순위 결정
        winning_rank = None
        winning_amount = 0
        
        if matched_count == 6:
            winning_rank = 1
            winning_amount = 2000000000  # 20억 (예시)
        elif matched_count == 5 and bonus_matched:
            winning_rank = 2
            winning_amount = 100000000   # 1억 (예시)
        elif matched_count == 5:
            winning_rank = 3
            winning_amount = 2000000     # 200만원 (예시)
        elif matched_count == 4:
            winning_rank = 4
            winning_amount = 50000       # 5만원 (예시)
        elif matched_count == 3:
            winning_rank = 5
            winning_amount = 5000        # 5천원 (예시)
        
        # 결과 저장
        self.target_draw_number = draw_number
        self.matched_count = matched_count
        self.matched_numbers = matched
        self.winning_rank = winning_rank
        self.winning_amount = winning_amount
        self.is_checked = True
        self.bonus_number = bonus_number
    
    def toggle_favorite(self):
        """즐겨찾기 토글"""
        self.is_favorite = not self.is_favorite
    
    def archive(self):
        """보관 처리 (비활성화)"""
        self.is_active = False
    
    def restore(self):
        """복원 처리 (활성화)"""
        self.is_active = True
    
    def to_dict(self):
        """딕셔너리 변환 (API 응답용)"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "numbers": self.sorted_numbers,
            "numbers_string": self.numbers_string,
            "confidence_score": self.confidence_score,
            "confidence_percentage": self.confidence_percentage,
            "generation_method": self.generation_method,
            "title": self.title,
            "memo": self.memo,
            "tags": self.tags,
            "target_draw_number": self.target_draw_number,
            "is_purchased": self.is_purchased,
            "purchase_date": self.purchase_date.isoformat() if self.purchase_date else None,
            "is_checked": self.is_checked,
            "winning_status": self.winning_status,
            "is_winner": self.is_winner,
            "winning_rank": self.winning_rank,
            "winning_amount": self.winning_amount,
            "matched_count": self.matched_count,
            "matched_numbers": self.matched_numbers,
            "is_favorite": self.is_favorite,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        return f"<SavedRecommendation(id={self.id}, user_id={self.user_id}, numbers={self.numbers_string}, confidence={self.confidence_percentage}%)>"