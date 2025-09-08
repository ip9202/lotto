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
                access_token = await SocialAuthService.get_kakao_access_token(token_or_code)
                if not access_token:
                    return None
                user_info = await SocialAuthService.get_kakao_user_info(access_token)
            elif provider == "naver":
                access_token = await SocialAuthService.get_naver_access_token(token_or_code)
                if not access_token:
                    return None
                user_info = await SocialAuthService.get_naver_user_info(access_token)
            else:
                return None
            
            if not user_info:
                return None
            
            # 이메일로 기존 계정 찾기
            existing_user = db.query(User).filter(
                and_(
                    User.email == user_info.get("email"),
                    User.is_active == True
                )
            ).first()
            
            if not existing_user:
                return {
                    "success": False,
                    "error": {"message": "연동된 계정이 없습니다. 먼저 이메일로 회원가입해주세요."}
                }
            
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
