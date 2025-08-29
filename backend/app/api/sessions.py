from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from ..database import get_db
from ..services.session_manager import SessionManager
from ..schemas.session import (
    SessionCreate, SessionUpdate, SessionResponse, 
    SessionList, SessionStats, SessionBulkCreate
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/sessions", tags=["세션 관리"])

@router.post("/", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(
    session_data: SessionCreate,
    db: Session = Depends(get_db)
):
    """새로운 세션 생성"""
    try:
        session_manager = SessionManager(db)
        session = session_manager.create_session(session_data)
        logger.info(f"새로운 세션 생성됨: {session.session_id}")
        return session
    except Exception as e:
        logger.error(f"세션 생성 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"세션 생성 중 오류가 발생했습니다: {str(e)}"
        )

@router.post("/bulk", response_model=List[SessionResponse], status_code=status.HTTP_201_CREATED)
def create_bulk_sessions(
    bulk_data: SessionBulkCreate,
    db: Session = Depends(get_db)
):
    """여러 세션 일괄 생성"""
    try:
        session_manager = SessionManager(db)
        sessions = session_manager.create_bulk_sessions(bulk_data)
        logger.info(f"{len(sessions)}개 세션 일괄 생성 완료")
        return sessions
    except Exception as e:
        logger.error(f"일괄 세션 생성 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"일괄 세션 생성 중 오류가 발생했습니다: {str(e)}"
        )

@router.get("/", response_model=SessionList)
def list_sessions(
    skip: int = Query(0, ge=0, description="건너뛸 항목 수"),
    limit: int = Query(100, ge=1, le=1000, description="가져올 항목 수"),
    active_only: Optional[bool] = Query(None, description="활성 세션만 조회"),
    admin_created: Optional[bool] = Query(None, description="관리자 생성 세션만 조회"),
    search: Optional[str] = Query(None, description="검색어 (이름, 설명, ID)"),
    db: Session = Depends(get_db)
):
    """세션 목록 조회"""
    try:
        session_manager = SessionManager(db)
        result = session_manager.list_sessions(
            skip=skip,
            limit=limit,
            active_only=active_only,
            admin_created=admin_created,
            search=search
        )
        return result
    except Exception as e:
        logger.error(f"세션 목록 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"세션 목록 조회 중 오류가 발생했습니다: {str(e)}"
        )

@router.get("/stats", response_model=SessionStats)
def get_session_stats(db: Session = Depends(get_db)):
    """세션 통계 조회"""
    try:
        session_manager = SessionManager(db)
        stats = session_manager.get_session_stats()
        return stats
    except Exception as e:
        logger.error(f"세션 통계 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"세션 통계 조회 중 오류가 발생했습니다: {str(e)}"
        )

@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: str, db: Session = Depends(get_db)):
    """특정 세션 상세 조회"""
    try:
        session_manager = SessionManager(db)
        session = session_manager.get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"세션을 찾을 수 없습니다: {session_id}"
            )
        return session
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"세션 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"세션 조회 중 오류가 발생했습니다: {str(e)}"
        )

@router.put("/{session_id}", response_model=SessionResponse)
def update_session(
    session_id: str,
    update_data: SessionUpdate,
    db: Session = Depends(get_db)
):
    """세션 정보 업데이트"""
    try:
        session_manager = SessionManager(db)
        session = session_manager.update_session(session_id, update_data)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"세션을 찾을 수 없습니다: {session_id}"
            )
        logger.info(f"세션 업데이트 완료: {session_id}")
        return session
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"세션 업데이트 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"세션 업데이트 중 오류가 발생했습니다: {str(e)}"
        )

@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(session_id: str, db: Session = Depends(get_db)):
    """세션 삭제"""
    try:
        session_manager = SessionManager(db)
        success = session_manager.delete_session(session_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"세션을 찾을 수 없습니다: {session_id}"
            )
        logger.info(f"세션 삭제 완료: {session_id}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"세션 삭제 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"세션 삭제 중 오류가 발생했습니다: {str(e)}"
        )

@router.patch("/{session_id}/activate", response_model=SessionResponse)
def activate_session(session_id: str, db: Session = Depends(get_db)):
    """세션 활성화"""
    try:
        session_manager = SessionManager(db)
        success = session_manager.activate_session(session_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"세션을 찾을 수 없습니다: {session_id}"
            )
        session = session_manager.get_session(session_id)
        logger.info(f"세션 활성화 완료: {session_id}")
        return session
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"세션 활성화 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"세션 활성화 중 오류가 발생했습니다: {str(e)}"
        )

@router.patch("/{session_id}/deactivate", response_model=SessionResponse)
def deactivate_session(session_id: str, db: Session = Depends(get_db)):
    """세션 비활성화"""
    try:
        session_manager = SessionManager(db)
        success = session_manager.deactivate_session(session_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"세션을 찾을 수 없습니다: {session_id}"
            )
        session = session_manager.get_session(session_id)
        logger.info(f"세션 비활성화 완료: {session_id}")
        return session
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"세션 비활성화 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"세션 비활성화 중 오류가 발생했습니다: {str(e)}"
        )

@router.patch("/{session_id}/extend", response_model=SessionResponse)
def extend_session(
    session_id: str,
    days: int = Query(30, ge=1, le=365, description="연장할 일수"),
    db: Session = Depends(get_db)
):
    """세션 만료 시간 연장"""
    try:
        session_manager = SessionManager(db)
        success = session_manager.extend_session(session_id, days)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"세션을 찾을 수 없습니다: {session_id}"
            )
        session = session_manager.get_session(session_id)
        logger.info(f"세션 만료 시간 연장 완료: {session_id}, +{days}일")
        return session
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"세션 만료 시간 연장 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"세션 만료 시간 연장 중 오류가 발생했습니다: {str(e)}"
        )

@router.post("/cleanup", status_code=status.HTTP_200_OK)
def cleanup_expired_sessions(db: Session = Depends(get_db)):
    """만료된 세션 정리"""
    try:
        session_manager = SessionManager(db)
        count = session_manager.cleanup_expired_sessions()
        logger.info(f"{count}개 만료된 세션 정리 완료")
        return {"message": f"{count}개 만료된 세션이 정리되었습니다.", "cleaned_count": count}
    except Exception as e:
        logger.error(f"만료된 세션 정리 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"만료된 세션 정리 중 오류가 발생했습니다: {str(e)}"
        )
