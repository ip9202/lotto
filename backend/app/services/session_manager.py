from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging
import pytz

def get_utc_now():
    """현재 UTC 시간 반환 (시스템 내부용)"""
    utc = pytz.timezone('UTC')
    return datetime.now(utc)

from ..models.session import UserSession
from ..models.user_history import UserHistory
from ..models.recommendation import Recommendation
from ..schemas.session import SessionCreate, SessionUpdate, SessionBulkCreate

logger = logging.getLogger(__name__)

class SessionManager:
    """사용자 세션 관리 서비스"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_session(self, session_data: SessionCreate, created_by: str = "admin") -> UserSession:
        """새로운 세션 생성"""
        try:
            # 자동 비율 계산 (수동 비율이 주어진 경우)
            if session_data.manual_ratio is not None:
                session_data.auto_ratio = 100 - session_data.manual_ratio
            
            session = UserSession(
                session_name=session_data.session_name,
                max_recommendations=session_data.max_recommendations,
                manual_ratio=session_data.manual_ratio,
                auto_ratio=session_data.auto_ratio,
                include_numbers=session_data.include_numbers,
                exclude_numbers=session_data.exclude_numbers,
                description=session_data.description,
                tags=session_data.tags,
                is_admin_created=True,
                created_by=created_by
            )
            
            self.db.add(session)
            self.db.commit()
            self.db.refresh(session)
            
            logger.info(f"새로운 세션 생성: {session.session_id}")
            return session
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"세션 생성 실패: {str(e)}")
            raise
    
    def create_bulk_sessions(self, bulk_data: SessionBulkCreate, created_by: str = "admin") -> List[UserSession]:
        """여러 세션 일괄 생성"""
        sessions = []
        
        try:
            for i in range(bulk_data.count):
                # 이름 패턴 적용
                session_name = bulk_data.naming_pattern.format(n=i + 1)
                
                session_data = SessionCreate(
                    session_name=session_name,
                    max_recommendations=bulk_data.base_config.max_recommendations,
                    manual_ratio=bulk_data.base_config.manual_ratio,
                    auto_ratio=bulk_data.base_config.auto_ratio,
                    include_numbers=bulk_data.base_config.include_numbers,
                    exclude_numbers=bulk_data.base_config.exclude_numbers,
                    description=bulk_data.base_config.description,
                    tags=bulk_data.base_config.tags
                )
                
                session = self.create_session(session_data, created_by)
                sessions.append(session)
            
            logger.info(f"{len(sessions)}개 세션 일괄 생성 완료")
            return sessions
            
        except Exception as e:
            logger.error(f"일괄 세션 생성 실패: {str(e)}")
            raise
    
    def get_session(self, session_id: str) -> Optional[UserSession]:
        """세션 ID로 세션 조회"""
        return self.db.query(UserSession).filter(UserSession.session_id == session_id).first()
    
    def get_session_by_id(self, session_db_id: int) -> Optional[UserSession]:
        """데이터베이스 ID로 세션 조회"""
        return self.db.query(UserSession).filter(UserSession.id == session_db_id).first()
    
    def list_sessions(
        self, 
        skip: int = 0, 
        limit: int = 100,
        active_only: bool = None,
        admin_created: bool = None,
        search: str = None
    ) -> Dict[str, Any]:
        """세션 목록 조회"""
        query = self.db.query(UserSession)
        
        # 필터 적용
        if active_only is not None:
            query = query.filter(UserSession.is_active == active_only)
        
        if admin_created is not None:
            query = query.filter(UserSession.is_admin_created == admin_created)
        
        if search:
            search_filter = or_(
                UserSession.session_name.ilike(f"%{search}%"),
                UserSession.description.ilike(f"%{search}%"),
                UserSession.session_id.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
        
        # 총 개수 계산
        total = query.count()
        
        # 정렬 및 페이징
        sessions = query.order_by(desc(UserSession.created_at)).offset(skip).limit(limit).all()
        
        # 통계 계산
        active_count = self.db.query(UserSession).filter(UserSession.is_active == True).count()
        expired_count = self.db.query(UserSession).filter(UserSession.is_expired == True).count()
        
        return {
            "sessions": sessions,
            "total": total,
            "active_count": active_count,
            "expired_count": expired_count
        }
    
    def update_session(self, session_id: str, update_data: SessionUpdate) -> Optional[UserSession]:
        """세션 정보 업데이트"""
        session = self.get_session(session_id)
        if not session:
            return None
        
        try:
            # 업데이트할 필드들
            update_fields = update_data.dict(exclude_unset=True)
            
            # 비율 업데이트 시 자동 계산
            if 'manual_ratio' in update_fields and 'auto_ratio' not in update_fields:
                update_fields['auto_ratio'] = 100 - update_fields['manual_ratio']
            elif 'auto_ratio' in update_fields and 'manual_ratio' not in update_fields:
                update_fields['manual_ratio'] = 100 - update_fields['auto_ratio']
            
            for field, value in update_fields.items():
                setattr(session, field, value)
            
            session.updated_at = get_utc_now()
            self.db.commit()
            self.db.refresh(session)
            
            logger.info(f"세션 업데이트 완료: {session_id}")
            return session
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"세션 업데이트 실패: {str(e)}")
            raise
    
    def delete_session(self, session_id: str) -> bool:
        """세션 삭제"""
        session = self.get_session(session_id)
        if not session:
            return False
        
        try:
            self.db.delete(session)
            self.db.commit()
            
            logger.info(f"세션 삭제 완료: {session_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"세션 삭제 실패: {str(e)}")
            raise
    
    def deactivate_session(self, session_id: str) -> bool:
        """세션 비활성화"""
        session = self.get_session(session_id)
        if not session:
            return False
        
        session.deactivate()
        self.db.commit()
        
        logger.info(f"세션 비활성화 완료: {session_id}")
        return True
    
    def activate_session(self, session_id: str) -> bool:
        """세션 활성화"""
        session = self.get_session(session_id)
        if not session:
            return False
        
        session.activate()
        self.db.commit()
        
        logger.info(f"세션 활성화 완료: {session_id}")
        return True
    
    def extend_session(self, session_id: str, days: int = 30) -> bool:
        """세션 만료 시간 연장"""
        session = self.get_session(session_id)
        if not session:
            return False
        
        session.extend_expiry(days)
        self.db.commit()
        
        logger.info(f"세션 만료 시간 연장 완료: {session_id}, +{days}일")
        return True
    
    def get_session_stats(self) -> Dict[str, Any]:
        """세션 통계 조회"""
        try:
            # 기본 통계
            total_sessions = self.db.query(UserSession).count()
            active_sessions = self.db.query(UserSession).filter(UserSession.is_active == True).count()
            expired_sessions = self.db.query(UserSession).filter(UserSession.is_expired == True).count()
            
            # 추천 조합 통계
            total_recommendations = self.db.query(func.sum(UserHistory.total_count)).scalar() or 0
            avg_recommendations = total_recommendations / total_sessions if total_sessions > 0 else 0
            
            # 태그 통계
            tag_counts = {}
            sessions = self.db.query(UserSession).filter(UserSession.tags.isnot(None)).all()
            for session in sessions:
                if session.tags:
                    for tag in session.tags:
                        tag_counts[tag] = tag_counts.get(tag, 0) + 1
            
            most_used_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:10]
            
            # 최근 활동
            recent_sessions = self.db.query(UserSession).order_by(desc(UserSession.updated_at)).limit(5).all()
            recent_activity = []
            for session in recent_sessions:
                recent_activity.append({
                    "session_id": session.session_id,
                    "session_name": session.session_name,
                    "updated_at": session.updated_at,
                    "action": "수정" if session.updated_at != session.created_at else "생성"
                })
            
            return {
                "total_sessions": total_sessions,
                "active_sessions": active_sessions,
                "expired_sessions": expired_sessions,
                "total_recommendations": total_recommendations,
                "avg_recommendations_per_session": round(avg_recommendations, 2),
                "most_used_tags": [{"tag": tag, "count": count} for tag, count in most_used_tags],
                "recent_activity": recent_activity
            }
            
        except Exception as e:
            logger.error(f"세션 통계 조회 실패: {str(e)}")
            raise
    
    def cleanup_expired_sessions(self) -> int:
        """만료된 세션 정리"""
        try:
            expired_sessions = self.db.query(UserSession).filter(
                and_(
                    UserSession.expires_at.isnot(None),
                    UserSession.expires_at < get_utc_now()
                )
            ).all()
            
            count = len(expired_sessions)
            for session in expired_sessions:
                session.deactivate()
            
            self.db.commit()
            
            logger.info(f"{count}개 만료된 세션 정리 완료")
            return count
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"만료된 세션 정리 실패: {str(e)}")
            raise
