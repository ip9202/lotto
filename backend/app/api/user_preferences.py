from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.orm.attributes import flag_modified
from ..database import get_db
from ..models.user import User
from ..utils.auth import get_current_user
from ..schemas.user import UserResponse
from pydantic import BaseModel
from typing import List, Optional
import json

router = APIRouter()

class UserPreferencesRequest(BaseModel):
    include_numbers: List[int] = []
    exclude_numbers: List[int] = []

class UserPreferencesResponse(BaseModel):
    success: bool
    data: Optional[UserPreferencesRequest] = None
    message: Optional[str] = None

@router.get("/preferences", response_model=UserPreferencesResponse, summary="사용자 설정 조회")
async def get_user_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """사용자의 포함/제외 번호 설정을 조회합니다."""
    try:
        print(f"🔍 사용자 설정 조회 - User ID: {current_user.id}, User ID String: {current_user.user_id}")
        preferences = current_user.preferences or {}
        print(f"📋 현재 설정: {preferences}")
        
        return UserPreferencesResponse(
            success=True,
            data=UserPreferencesRequest(
                include_numbers=preferences.get('include_numbers', []),
                exclude_numbers=preferences.get('exclude_numbers', [])
            ),
            message="사용자 설정을 성공적으로 조회했습니다."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"설정 조회 중 오류가 발생했습니다: {str(e)}")

@router.put("/preferences", response_model=UserPreferencesResponse, summary="사용자 설정 저장")
async def save_user_preferences(
    preferences_data: UserPreferencesRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """사용자의 포함/제외 번호 설정을 저장합니다."""
    import json
    from sqlalchemy import text
    
    try:
        print(f"💾 사용자 설정 저장 - User ID: {current_user.id}")
        print(f"📝 저장할 설정: {preferences_data.dict()}")
        
        # 입력 유효성 검증
        _validate_preferences(preferences_data)
        
        # 새로운 preferences 객체 생성
        new_preferences = {
            'include_numbers': preferences_data.include_numbers,
            'exclude_numbers': preferences_data.exclude_numbers
        }
        
        # 새로운 데이터베이스 세션 사용으로 동시성 문제 해결
        from ..database import SessionLocal
        
        # 별도의 세션에서 업데이트 수행
        with SessionLocal() as fresh_db:
            try:
                # 업데이트 전 현재 상태 확인
                before_result = fresh_db.execute(
                    text("SELECT preferences FROM users WHERE id = :user_id"),
                    {"user_id": current_user.id}
                ).fetchone()
                print(f"🔍 업데이트 전 DB 상태: {before_result[0] if before_result else 'None'}")
                
                # SQLAlchemy ORM 방식으로 업데이트 (더 안전함)
                user_to_update = fresh_db.query(User).filter(User.id == current_user.id).first()
                if not user_to_update:
                    raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
                
                # JSON 필드 직접 업데이트
                user_to_update.preferences = new_preferences
                
                # JSON 필드 변경 강제 감지
                flag_modified(user_to_update, 'preferences')
                
                # 커밋
                fresh_db.commit()
                print(f"✅ 트랜잭션 커밋 완료")
                
                # 업데이트 후 검증
                fresh_db.refresh(user_to_update)
                print(f"🔍 업데이트 후 DB 확인: {user_to_update.preferences}")
                
                # 기존 세션의 사용자 객체도 업데이트 (SQLAlchemy 캐시 동기화)
                db.refresh(current_user)
                
            except Exception as e:
                fresh_db.rollback()
                print(f"❌ 데이터베이스 업데이트 오류: {e}")
                raise HTTPException(status_code=500, detail=f"설정 저장 중 오류가 발생했습니다: {str(e)}")
        
        print(f"✅ 설정 저장 완료 - User ID: {current_user.id}")
        
        return UserPreferencesResponse(
            success=True,
            data=preferences_data,
            message="사용자 설정이 성공적으로 저장되었습니다."
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ 예상치 못한 오류: {e}")
        raise HTTPException(status_code=500, detail=f"설정 저장 중 오류가 발생했습니다: {str(e)}")


def _validate_preferences(preferences_data: UserPreferencesRequest):
    """사용자 설정 유효성 검증"""
    # 포함 번호 검증 (최대 5개)
    if len(preferences_data.include_numbers) > 5:
        raise HTTPException(status_code=400, detail="포함할 번호는 최대 5개까지 가능합니다.")
    
    # 제외 번호 검증 (최대 10개)
    if len(preferences_data.exclude_numbers) > 10:
        raise HTTPException(status_code=400, detail="제외할 번호는 최대 10개까지 가능합니다.")
    
    # 번호 범위 검증 (1-45)
    all_numbers = preferences_data.include_numbers + preferences_data.exclude_numbers
    for number in all_numbers:
        if not (1 <= number <= 45):
            raise HTTPException(status_code=400, detail="번호는 1-45 사이의 값이어야 합니다.")
    
    # 포함 번호와 제외 번호 중복 검증
    if set(preferences_data.include_numbers) & set(preferences_data.exclude_numbers):
        raise HTTPException(status_code=400, detail="포함 번호와 제외 번호에 중복된 번호가 있습니다.")
