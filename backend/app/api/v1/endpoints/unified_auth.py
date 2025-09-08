"""
통합 인증 API 엔드포인트
소셜 로그인과 직접 회원가입을 통합 관리
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Dict, Any, Optional
from pydantic import BaseModel, EmailStr
from ....database import get_db
from ....services.unified_auth_service import UnifiedAuthService
from ....utils.auth import get_current_user, verify_password, get_password_hash
from ....models.user import User, SocialProvider
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# 요청 스키마
class EmailLoginRequest(BaseModel):
    email: EmailStr
    password: str

class EmailRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    nickname: str
    role: str = "user"

class SocialLoginRequest(BaseModel):
    provider: str  # "kakao" or "naver"
    access_token: str

class SocialLinkRequest(BaseModel):
    provider: str  # "kakao" or "naver"
    access_token: str

class UserRoleUpdateRequest(BaseModel):
    user_id: int
    new_role: str  # "user" or "admin"

# 응답 스키마
class AuthResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None

@router.post("/login/email", response_model=AuthResponse, summary="이메일 로그인")
async def email_login(
    login_data: EmailLoginRequest,
    db: Session = Depends(get_db)
):
    """이메일과 비밀번호로 로그인"""
    try:
        result = await UnifiedAuthService.authenticate_email_user(
            db=db,
            email=login_data.email,
            password=login_data.password
        )
        
        if result and result.get("success"):
            return AuthResponse(success=True, data=result["data"])
        else:
            return AuthResponse(
                success=False,
                error={"message": "이메일 또는 비밀번호가 올바르지 않습니다."}
            )
            
    except Exception as e:
        logger.error(f"이메일 로그인 오류: {e}")
        return AuthResponse(
            success=False,
            error={"message": "로그인 중 오류가 발생했습니다."}
        )

@router.post("/register/email", response_model=AuthResponse, summary="이메일 회원가입")
async def email_register(
    register_data: EmailRegisterRequest,
    db: Session = Depends(get_db)
):
    """이메일로 회원가입"""
    try:
        result = await UnifiedAuthService.register_email_user(
            db=db,
            email=register_data.email,
            password=register_data.password,
            nickname=register_data.nickname,
            role=register_data.role
        )
        
        return AuthResponse(
            success=result["success"],
            data=result.get("data"),
            error=result.get("error")
        )
        
    except Exception as e:
        logger.error(f"이메일 회원가입 오류: {e}")
        return AuthResponse(
            success=False,
            error={"message": "회원가입 중 오류가 발생했습니다."}
        )

@router.post("/login/social", response_model=AuthResponse, summary="소셜 로그인")
async def social_login(
    login_data: SocialLoginRequest,
    db: Session = Depends(get_db)
):
    """소셜 로그인 (카카오/네이버)"""
    try:
        result = await UnifiedAuthService.authenticate_social_user(
            db=db,
            provider=login_data.provider,
            token_or_code=login_data.access_token
        )
        
        if result and result.get("success"):
            return AuthResponse(success=True, data=result["data"])
        else:
            return AuthResponse(
                success=False,
                error={"message": "소셜 로그인에 실패했습니다."}
            )
            
    except Exception as e:
        logger.error(f"소셜 로그인 오류: {e}")
        return AuthResponse(
            success=False,
            error={"message": "소셜 로그인 중 오류가 발생했습니다."}
        )

@router.get("/me", response_model=AuthResponse, summary="현재 사용자 정보")
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """현재 로그인한 사용자 정보 조회"""
    try:
        return AuthResponse(
            success=True,
            data={"user": current_user.to_dict()}
        )
    except Exception as e:
        logger.error(f"사용자 정보 조회 오류: {e}")
        return AuthResponse(
            success=False,
            error={"message": "사용자 정보 조회 중 오류가 발생했습니다."}
        )

@router.post("/check-kakao-user", response_model=AuthResponse, summary="카카오 사용자 가입 여부 확인")
async def check_kakao_user(
    check_data: SocialLinkRequest,
    db: Session = Depends(get_db)
):
    """카카오 로그인 전 사용자 가입 여부 확인"""
    try:
        # 카카오에서 사용자 정보 가져오기
        result = await UnifiedAuthService.get_social_user_info(
            provider=check_data.provider,
            token_or_code=check_data.access_token
        )
        
        if not result or not result.get("success"):
            return AuthResponse(
                success=False,
                error={"message": "카카오 사용자 정보를 가져올 수 없습니다."}
            )
        
        user_info = result["data"]
        logger.info(f"카카오 사용자 정보: {user_info}")
        logger.info(f"카카오 이메일: {user_info.get('email')}")
        
        # 이메일로 기존 계정 찾기
        existing_user = None
        if user_info.get("email"):
            existing_user = db.query(User).filter(
                and_(
                    User.email == user_info.get("email"),
                    User.is_active == True
                )
            ).first()
        
        # 소셜 ID로 기존 계정 찾기
        if not existing_user:
            logger.info(f"이메일로 계정을 찾지 못함. 소셜 ID로 검색: {user_info.get('id')}")
            existing_user = db.query(User).filter(
                and_(
                    User.social_provider == SocialProvider.KAKAO,
                    User.social_id == str(user_info.get("id")),  # 문자열로 변환
                    User.is_active == True
                )
            ).first()
            logger.info(f"소셜 ID로 찾은 계정: {existing_user}")
        
        if existing_user:
            return AuthResponse(
                success=True,
                data={
                    "is_registered": True,
                    "user": existing_user.to_dict(),
                    "message": "기존 계정이 있습니다. 로그인하시겠어요?"
                }
            )
        else:
            return AuthResponse(
                success=True,
                data={
                    "is_registered": False,
                    "user_info": user_info,
                    "message": "가입된 계정이 없습니다. 먼저 이메일로 회원가입해주세요."
                }
            )
        
    except Exception as e:
        logger.error(f"카카오 사용자 확인 오류: {e}")
        return AuthResponse(
            success=False,
            error={"message": "카카오 사용자 확인 중 오류가 발생했습니다."}
        )

@router.post("/change-password", response_model=AuthResponse, summary="비밀번호 변경")
async def change_password(
    password_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """비밀번호 변경"""
    try:
        current_password = password_data.get("current_password")
        new_password = password_data.get("new_password")
        
        if not current_password or not new_password:
            return AuthResponse(
                success=False,
                error={"message": "현재 비밀번호와 새 비밀번호를 입력해주세요."}
            )
        
        # 현재 비밀번호 확인
        if not verify_password(current_password, current_user.hashed_password):
            return AuthResponse(
                success=False,
                error={"message": "현재 비밀번호가 올바르지 않습니다."}
            )
        
        # 새 비밀번호 해시화
        new_hashed_password = get_password_hash(new_password)
        current_user.hashed_password = new_hashed_password
        
        db.commit()
        
        return AuthResponse(
            success=True,
            data={"message": "비밀번호가 성공적으로 변경되었습니다."}
        )
        
    except Exception as e:
        logger.error(f"비밀번호 변경 오류: {e}")
        return AuthResponse(
            success=False,
            error={"message": "비밀번호 변경 중 오류가 발생했습니다."}
        )

@router.post("/link/kakao", response_model=AuthResponse, summary="카카오 계정 연동")
async def link_kakao_account(
    link_data: SocialLinkRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """로그인된 사용자의 카카오 계정 연동"""
    try:
        # 카카오에서 사용자 정보 가져오기
        result = await UnifiedAuthService.get_social_user_info(
            provider=link_data.provider,
            token_or_code=link_data.access_token
        )
        
        if not result or not result.get("success"):
            return AuthResponse(
                success=False,
                error={"message": "카카오 사용자 정보를 가져올 수 없습니다."}
            )
        
        user_info = result["data"]
        
        # 현재 사용자에게 카카오 계정 연결
        current_user.social_provider = "KAKAO"
        current_user.social_id = user_info.get("id")
        
        if not current_user.linked_social_providers:
            current_user.linked_social_providers = []
        
        if "KAKAO" not in current_user.linked_social_providers:
            current_user.linked_social_providers.append("KAKAO")
        
        db.commit()
        
        return AuthResponse(
            success=True,
            data={"message": "카카오 계정이 연결되었습니다."}
        )
        
    except Exception as e:
        logger.error(f"카카오 연동 오류: {e}")
        return AuthResponse(
            success=False,
            error={"message": "카카오 연동 중 오류가 발생했습니다."}
        )

@router.post("/admin/update-role", response_model=AuthResponse, summary="사용자 역할 업데이트")
async def update_user_role(
    role_data: UserRoleUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """사용자 역할 업데이트 (관리자만 가능)"""
    try:
        # 관리자 권한 확인
        if current_user.role.value != "admin":
            return AuthResponse(
                success=False,
                error={"message": "관리자 권한이 필요합니다."}
            )
        
        success = await UnifiedAuthService.update_user_role(
            db=db,
            user_id=role_data.user_id,
            new_role=role_data.new_role
        )
        
        if success:
            return AuthResponse(success=True, data={"message": "역할이 업데이트되었습니다."})
        else:
            return AuthResponse(
                success=False,
                error={"message": "사용자를 찾을 수 없습니다."}
            )
            
    except Exception as e:
        logger.error(f"사용자 역할 업데이트 오류: {e}")
        return AuthResponse(
            success=False,
            error={"message": "역할 업데이트 중 오류가 발생했습니다."}
        )

@router.get("/admin/users", response_model=AuthResponse, summary="관리자 사용자 목록")
async def get_admin_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """관리자 사용자 목록 조회 (관리자만 가능)"""
    try:
        # 관리자 권한 확인
        if current_user.role.value != "admin":
            return AuthResponse(
                success=False,
                error={"message": "관리자 권한이 필요합니다."}
            )
        
        admin_users = await UnifiedAuthService.get_admin_users(db=db)
        
        return AuthResponse(
            success=True,
            data={"users": [user.to_dict() for user in admin_users]}
        )
        
    except Exception as e:
        logger.error(f"관리자 사용자 목록 조회 오류: {e}")
        return AuthResponse(
            success=False,
            error={"message": "사용자 목록 조회 중 오류가 발생했습니다."}
        )

@router.post("/link/social", response_model=AuthResponse, summary="소셜 계정 연동")
async def link_social_account(
    link_data: SocialLinkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """기존 계정에 소셜 계정 연동"""
    try:
        # 소셜 제공자에서 사용자 정보 조회
        if link_data.provider == "kakao":
            from ....utils.auth import SocialAuthService
            access_token = await SocialAuthService.get_kakao_access_token(link_data.access_token)
            if not access_token:
                return AuthResponse(
                    success=False,
                    error={"message": "카카오 인증에 실패했습니다."}
                )
            user_info = await SocialAuthService.get_kakao_user_info(access_token)
        elif link_data.provider == "naver":
            from ....utils.auth import SocialAuthService
            access_token = await SocialAuthService.get_naver_access_token(link_data.access_token)
            if not access_token:
                return AuthResponse(
                    success=False,
                    error={"message": "네이버 인증에 실패했습니다."}
                )
            user_info = await SocialAuthService.get_naver_user_info(access_token)
        else:
            return AuthResponse(
                success=False,
                error={"message": "지원하지 않는 소셜 제공자입니다."}
            )
        
        if not user_info:
            return AuthResponse(
                success=False,
                error={"message": "소셜 계정 정보를 가져올 수 없습니다."}
            )
        
        # 소셜 연동 정보 업데이트
        if not current_user.linked_social_providers:
            current_user.linked_social_providers = []
        
        if link_data.provider not in current_user.linked_social_providers:
            current_user.linked_social_providers.append(link_data.provider)
            current_user.social_provider = link_data.provider
            current_user.social_id = user_info.get("id")
            
            db.commit()
            
            return AuthResponse(
                success=True,
                data={
                    "message": f"{link_data.provider} 계정이 연동되었습니다.",
                    "user": current_user.to_dict()
                }
            )
        else:
            return AuthResponse(
                success=False,
                error={"message": "이미 연동된 소셜 계정입니다."}
            )
            
    except Exception as e:
        logger.error(f"소셜 계정 연동 오류: {e}")
        return AuthResponse(
            success=False,
            error={"message": "소셜 계정 연동 중 오류가 발생했습니다."}
        )

@router.post("/verify-email", response_model=AuthResponse, summary="이메일 인증")
async def verify_email(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """이메일 인증 (본인만 가능)"""
    try:
        # 본인 확인
        if current_user.id != user_id:
            return AuthResponse(
                success=False,
                error={"message": "본인의 이메일만 인증할 수 있습니다."}
            )
        
        success = await UnifiedAuthService.verify_email(db=db, user_id=user_id)
        
        if success:
            return AuthResponse(success=True, data={"message": "이메일이 인증되었습니다."})
        else:
            return AuthResponse(
                success=False,
                error={"message": "이메일 인증에 실패했습니다."}
            )
            
    except Exception as e:
        logger.error(f"이메일 인증 오류: {e}")
        return AuthResponse(
            success=False,
            error={"message": "이메일 인증 중 오류가 발생했습니다."}
        )
