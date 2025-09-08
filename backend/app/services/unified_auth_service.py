"""
통합 인증 서비스
소셜 로그인과 직접 회원가입을 통합 관리
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from ..models.user import User, SocialProvider, LoginMethod, UserRole
from ..utils.auth import SocialAuthService
from passlib.context import CryptContext
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

# 비밀번호 해싱 컨텍스트
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UnifiedAuthService:
    """통합 인증 서비스"""
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """비밀번호 검증"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """비밀번호 해싱"""
        return pwd_context.hash(password)
    
    @staticmethod
    async def authenticate_social_user(
        db: Session,
        provider: str,
        token_or_code: str
    ) -> Optional[Dict[str, Any]]:
        """소셜 로그인 인증 (연동된 계정으로 로그인)"""
        try:
            # 소셜 제공자에서 사용자 정보 조회
            if provider == "kakao":
                # token_or_code가 이미 access_token인 경우 (authorization_code는 보통 더 짧음)
                if len(token_or_code) > 50:  # access_token은 보통 50자 이상
                    access_token = token_or_code
                else:  # authorization_code인 경우
                    access_token = await SocialAuthService.get_kakao_access_token(token_or_code)
                    if not access_token:
                        return None
                user_info = await SocialAuthService.get_kakao_user_info(access_token)
            elif provider == "naver":
                # token_or_code가 이미 access_token인 경우 (authorization_code는 보통 더 짧음)
                if len(token_or_code) > 50:  # access_token은 보통 50자 이상
                    access_token = token_or_code
                else:  # authorization_code인 경우
                    access_token = await SocialAuthService.get_naver_access_token(token_or_code)
                    if not access_token:
                        return None
                user_info = await SocialAuthService.get_naver_user_info(access_token)
            else:
                return None
            
            if not user_info:
                return None
            
            # 이메일이 있는 경우에만 이메일로 기존 계정 찾기
            existing_user = None
            if user_info.get("email"):
                existing_user = db.query(User).filter(
                    and_(
                        User.email == user_info.get("email"),
                        User.is_active == True
                    )
                ).first()
            
            # 이메일로 찾지 못한 경우, 소셜 ID로 기존 계정 찾기
            if not existing_user:
                existing_user = db.query(User).filter(
                    and_(
                        User.social_provider == SocialProvider(provider),
                        User.social_id == user_info.get("id"),
                        User.is_active == True
                    )
                ).first()
            
            # 기존 계정이 없으면 새로 생성
            if not existing_user:
                # 이메일이 없으면 임시 이메일 생성
                email = user_info.get("email") or f"{provider}_{user_info.get('id')}@temp.local"
                
                new_user = User(
                    social_provider=SocialProvider(provider),
                    social_id=user_info.get("id"),
                    email=email,
                    nickname=user_info.get("nickname", f"{provider} 사용자"),
                    profile_image_url=user_info.get("profile_image_url"),
                    login_method=LoginMethod.SOCIAL,
                    role=UserRole.USER,
                    is_active=True
                )
                
                db.add(new_user)
                db.commit()
                db.refresh(new_user)
                existing_user = new_user
            
            # 소셜 연동 정보 업데이트
            if not existing_user.linked_social_providers:
                existing_user.linked_social_providers = []
            
            if provider not in existing_user.linked_social_providers:
                existing_user.linked_social_providers.append(provider)
                existing_user.social_provider = SocialProvider(provider)
                existing_user.social_id = user_info.get("id")
            
            # 로그인 시간 업데이트
            existing_user.update_last_login()
            db.commit()
            
            # JWT 토큰 생성
            from ..utils.auth import create_access_token
            access_token = create_access_token(data={"sub": str(existing_user.id)})
            
            return {
                "success": True,
                "data": {
                    "access_token": access_token,
                    "user": existing_user.to_dict()
                }
            }
            
        except Exception as e:
            logger.error(f"소셜 로그인 인증 오류: {e}")
            return None
    
    @staticmethod
    async def authenticate_email_user(
        db: Session,
        email: str,
        password: str
    ) -> Optional[Dict[str, Any]]:
        """이메일 로그인 인증"""
        try:
            # 이메일로 사용자 조회
            user = db.query(User).filter(
                and_(
                    User.email == email,
                    User.login_method == LoginMethod.EMAIL,
                    User.is_active == True
                )
            ).first()
            
            if not user or not user.password_hash:
                return None
            
            # 비밀번호 검증
            if not UnifiedAuthService.verify_password(password, user.password_hash):
                return None
            
            # 로그인 시간 업데이트
            user.update_last_login()
            db.commit()
            
            # JWT 토큰 생성
            from ..utils.auth import create_access_token
            access_token = create_access_token(data={"sub": str(user.id)})
            
            return {
                "success": True,
                "data": {
                    "access_token": access_token,
                    "user": user.to_dict()
                }
            }
            
        except Exception as e:
            logger.error(f"이메일 로그인 인증 오류: {e}")
            return None
    
    @staticmethod
    async def register_email_user(
        db: Session,
        email: str,
        password: str,
        nickname: str,
        role: str = "user"
    ) -> Optional[Dict[str, Any]]:
        """이메일 회원가입"""
        try:
            # 이메일 중복 확인
            existing_user = db.query(User).filter(
                and_(
                    User.email == email,
                    User.login_method == LoginMethod.EMAIL
                )
            ).first()
            
            if existing_user:
                return {
                    "success": False,
                    "error": {"message": "이미 존재하는 이메일입니다."}
                }
            
            # 새 사용자 생성
            user = User(
                email=email,
                password_hash=UnifiedAuthService.get_password_hash(password),
                nickname=nickname,
                login_method=LoginMethod.EMAIL,
                role=UserRole.ADMIN if role == "admin" else UserRole.USER,
                is_verified=False,  # 이메일 인증 필요
                is_active=True
            )
            
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # JWT 토큰 생성
            from ..utils.auth import create_access_token
            access_token = create_access_token(data={"sub": str(user.id)})
            
            return {
                "success": True,
                "data": {
                    "access_token": access_token,
                    "user": user.to_dict()
                }
            }
            
        except Exception as e:
            logger.error(f"이메일 회원가입 오류: {e}")
            db.rollback()
            return {
                "success": False,
                "error": {"message": "회원가입 중 오류가 발생했습니다."}
            }
    
    @staticmethod
    async def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """사용자 ID로 사용자 조회"""
        try:
            return db.query(User).filter(User.id == user_id).first()
        except Exception as e:
            logger.error(f"사용자 조회 오류: {e}")
            return None
    
    @staticmethod
    async def update_user_role(
        db: Session,
        user_id: int,
        new_role: str
    ) -> bool:
        """사용자 역할 업데이트"""
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return False
            
            user.role = UserRole.ADMIN if new_role == "admin" else UserRole.USER
            db.commit()
            return True
            
        except Exception as e:
            logger.error(f"사용자 역할 업데이트 오류: {e}")
            db.rollback()
            return False
    
    @staticmethod
    async def get_admin_users(db: Session) -> list:
        """관리자 사용자 목록 조회"""
        try:
            return db.query(User).filter(
                and_(
                    User.role == UserRole.ADMIN,
                    User.is_active == True
                )
            ).all()
        except Exception as e:
            logger.error(f"관리자 사용자 조회 오류: {e}")
            return []
    
    @staticmethod
    async def verify_email(db: Session, user_id: int) -> bool:
        """이메일 인증"""
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return False
            
            user.is_verified = True
            db.commit()
            return True
            
        except Exception as e:
            logger.error(f"이메일 인증 오류: {e}")
            db.rollback()
            return False
    
    @staticmethod
    async def get_social_user_info(provider: str, token_or_code: str) -> Dict[str, Any]:
        """소셜 로그인에서 사용자 정보만 가져오기 (계정 생성/로그인 없이)"""
        try:
            # provider에 따라 사용자 정보 가져오기
            if provider == "kakao":
                # 카카오의 경우 token_or_code는 access_token
                user_info = await SocialAuthService.get_kakao_user_info(token_or_code)
            elif provider == "naver":
                # 네이버의 경우 token_or_code는 access_token
                user_info = await SocialAuthService.get_naver_user_info(token_or_code)
            else:
                return {
                    "success": False,
                    "error": "지원하지 않는 소셜 제공자입니다."
                }
            
            if user_info:
                # social_id를 id로 변경하여 통일
                user_info["id"] = user_info.pop("social_id", user_info.get("id"))
                return {
                    "success": True,
                    "data": user_info
                }
            else:
                return {
                    "success": False,
                    "error": "사용자 정보를 가져올 수 없습니다."
                }
                
        except Exception as e:
            logger.error(f"소셜 사용자 정보 조회 오류: {e}")
            return {
                "success": False,
                "error": f"사용자 정보 조회 중 오류가 발생했습니다: {str(e)}"
            }
