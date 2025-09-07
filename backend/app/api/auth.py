from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Dict, Any
import logging

from ..database import get_db
from ..schemas.user import LoginRequest, LoginResponse, TokenResponse, UserResponse, UserProfile
from ..utils.auth import SocialAuthService, get_user_from_token
from ..models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["인증"])

# JWT 토큰 스키마
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """현재 로그인한 사용자 가져오기"""
    token = credentials.credentials
    user = get_user_from_token(db, token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증이 필요합니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="비활성화된 계정입니다"
        )
    
    return user

@router.post("/login", response_model=LoginResponse, summary="소셜 로그인")
async def social_login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    소셜 로그인 (카카오, 네이버)
    
    - **provider**: kakao 또는 naver
    - **access_token**: 소셜 로그인에서 받은 액세스 토큰
    """
    try:
        # 소셜 로그인 인증 및 JWT 토큰 생성
        auth_result = await SocialAuthService.authenticate_social_user(
            db=db,
            provider=login_data.provider,
            access_token=login_data.access_token
        )
        
        if not auth_result:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="소셜 로그인 인증에 실패했습니다"
            )
        
        return LoginResponse(
            success=True,
            message="로그인 성공",
            data=auth_result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Social login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="로그인 처리 중 오류가 발생했습니다"
        )

@router.get("/me", response_model=UserResponse, summary="내 정보 조회")
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """현재 로그인한 사용자의 기본 정보 조회"""
    return UserResponse.model_validate(current_user.to_dict())

@router.get("/profile", response_model=UserProfile, summary="내 프로필 조회")
async def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """현재 로그인한 사용자의 상세 프로필 조회"""
    
    # 통계 정보 계산
    total_recommendations = len(current_user.saved_recommendations) if current_user.saved_recommendations else 0
    winning_recommendations = [rec for rec in current_user.saved_recommendations if rec.is_winner] if current_user.saved_recommendations else []
    
    stats = {
        "total_recommendations": total_recommendations,
        "total_saved": current_user.total_saved_numbers,
        "total_wins": current_user.total_wins,
        "total_winnings": current_user.total_winnings,
        "win_rate": (len(winning_recommendations) / total_recommendations * 100) if total_recommendations > 0 else 0.0,
        "best_rank": min([rec.winning_rank for rec in winning_recommendations]) if winning_recommendations else None
    }
    
    user_dict = current_user.to_dict()
    user_dict["stats"] = stats
    
    return UserProfile.model_validate(user_dict)

@router.put("/profile", response_model=UserResponse, summary="프로필 업데이트")
async def update_user_profile(
    profile_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """사용자 프로필 정보 업데이트"""
    
    try:
        # 업데이트 가능한 필드들
        allowed_fields = ["nickname", "preferences", "notification_settings"]
        
        for field, value in profile_data.items():
            if field in allowed_fields and hasattr(current_user, field):
                setattr(current_user, field, value)
        
        db.commit()
        db.refresh(current_user)
        
        return UserResponse.model_validate(current_user.to_dict())
        
    except Exception as e:
        logger.error(f"Profile update error: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="프로필 업데이트 중 오류가 발생했습니다"
        )

@router.post("/logout", summary="로그아웃")
async def logout(
    current_user: User = Depends(get_current_user)
):
    """
    로그아웃
    
    Note: JWT는 stateless하므로 실제로는 클라이언트에서 토큰을 삭제해야 함
    """
    return {
        "success": True,
        "message": "로그아웃되었습니다",
        "data": None
    }

@router.delete("/account", summary="계정 삭제")
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """계정 삭제 (비활성화)"""
    
    try:
        # 실제 삭제가 아닌 비활성화
        current_user.is_active = False
        db.commit()
        
        return {
            "success": True,
            "message": "계정이 비활성화되었습니다",
            "data": None
        }
        
    except Exception as e:
        logger.error(f"Account deletion error: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="계정 삭제 중 오류가 발생했습니다"
        )

@router.get("/limits", summary="API 사용량 조회")
async def get_api_limits(
    current_user: User = Depends(get_current_user)
):
    """현재 사용자의 API 사용 제한 정보 조회"""
    
    return {
        "success": True,
        "message": "사용량 정보 조회 성공",
        "data": {
            "daily_recommendations": {
                "used": current_user.daily_recommendation_count,
                "limit": 999 if current_user.is_premium else 5,
                "remaining": 999 if current_user.is_premium else max(0, 5 - current_user.daily_recommendation_count),
                "reset_at": current_user.last_recommendation_date
            },
            "saved_numbers": {
                "used": current_user.total_saved_numbers,
                "limit": 999 if current_user.is_premium else 10,
                "remaining": 999 if current_user.is_premium else max(0, 10 - current_user.total_saved_numbers)
            },
            "is_premium": current_user.is_premium,
            "subscription_status": current_user.subscription_status
        }
    }