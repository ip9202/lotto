from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..utils.auth import get_current_user
from ..schemas.user import UserResponse
from pydantic import BaseModel
from typing import List, Optional

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
    try:
        print(f"💾 사용자 설정 저장 - User ID: {current_user.id}, User ID String: {current_user.user_id}")
        print(f"📝 저장할 설정: {preferences_data.dict()}")
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
        
        # 기존 preferences 업데이트
        current_preferences = current_user.preferences or {}
        current_preferences.update({
            'include_numbers': preferences_data.include_numbers,
            'exclude_numbers': preferences_data.exclude_numbers
        })
        
        current_user.preferences = current_preferences
        db.commit()
        
        print(f"✅ 설정 저장 완료 - User ID: {current_user.id}, 저장된 설정: {current_preferences}")
        
        return UserPreferencesResponse(
            success=True,
            data=preferences_data,
            message="사용자 설정이 성공적으로 저장되었습니다."
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"설정 저장 중 오류가 발생했습니다: {str(e)}")
