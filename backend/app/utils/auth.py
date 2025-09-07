from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from ..models.user import User, SocialProvider
from ..config import settings
import httpx
import logging

logger = logging.getLogger(__name__)

# 패스워드 해싱 (admin 계정용)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT 설정
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7일

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """JWT 액세스 토큰 생성"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """JWT 토큰 검증"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        logger.error(f"JWT verification failed: {e}")
        return None

def get_user_from_token(db: Session, token: str) -> Optional[User]:
    """토큰에서 사용자 정보 추출"""
    payload = verify_token(token)
    if not payload:
        return None
    
    user_id: str = payload.get("sub")
    if not user_id:
        return None
    
    # user_id가 숫자 문자열이면 id로 조회, 그렇지 않으면 user_id로 조회
    try:
        user_db_id = int(user_id)
        user = db.query(User).filter(User.id == user_db_id).first()
    except ValueError:
        user = db.query(User).filter(User.user_id == user_id).first()
    
    if user:
        user.update_last_login()
        db.commit()
    
    return user

class SocialAuthService:
    """소셜 로그인 서비스"""
    
    @staticmethod
    async def get_kakao_user_info(access_token: str) -> Optional[Dict[str, Any]]:
        """카카오 사용자 정보 가져오기"""
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/x-www-form-urlencoded"
                }
                
                response = await client.get(
                    "https://kapi.kakao.com/v2/user/me",
                    headers=headers
                )
                
                if response.status_code == 200:
                    user_data = response.json()
                    return {
                        "social_id": str(user_data["id"]),
                        "email": user_data.get("kakao_account", {}).get("email"),
                        "nickname": user_data.get("kakao_account", {}).get("profile", {}).get("nickname"),
                        "profile_image_url": user_data.get("kakao_account", {}).get("profile", {}).get("profile_image_url")
                    }
                else:
                    logger.error(f"Kakao API error: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Kakao user info fetch error: {e}")
            return None
    
    @staticmethod
    async def get_naver_user_info(access_token: str) -> Optional[Dict[str, Any]]:
        """네이버 사용자 정보 가져오기"""
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {access_token}",
                }
                
                response = await client.get(
                    "https://openapi.naver.com/v1/nid/me",
                    headers=headers
                )
                
                if response.status_code == 200:
                    user_data = response.json()
                    if user_data["resultcode"] == "00":
                        response_data = user_data["response"]
                        return {
                            "social_id": response_data["id"],
                            "email": response_data.get("email"),
                            "nickname": response_data.get("nickname"),
                            "profile_image_url": response_data.get("profile_image")
                        }
                    else:
                        logger.error(f"Naver API error: {user_data}")
                        return None
                else:
                    logger.error(f"Naver API error: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Naver user info fetch error: {e}")
            return None
    
    @staticmethod
    def create_or_update_user(db: Session, social_provider: SocialProvider, user_info: Dict[str, Any]) -> User:
        """소셜 로그인 사용자 생성 또는 업데이트"""
        # 기존 사용자 확인
        existing_user = db.query(User).filter(
            User.social_provider == social_provider,
            User.social_id == user_info["social_id"]
        ).first()
        
        if existing_user:
            # 기존 사용자 정보 업데이트
            existing_user.email = user_info.get("email") or existing_user.email
            existing_user.nickname = user_info.get("nickname") or existing_user.nickname
            existing_user.profile_image_url = user_info.get("profile_image_url") or existing_user.profile_image_url
            existing_user.update_last_login()
            db.commit()
            db.refresh(existing_user)
            return existing_user
        else:
            # 새 사용자 생성
            new_user = User(
                social_provider=social_provider,
                social_id=user_info["social_id"],
                email=user_info.get("email"),
                nickname=user_info.get("nickname"),
                profile_image_url=user_info.get("profile_image_url"),
                is_active=True
            )
            new_user.update_last_login()
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            return new_user
    
    @staticmethod
    async def authenticate_social_user(
        db: Session, 
        provider: str, 
        access_token: str
    ) -> Optional[Dict[str, Any]]:
        """소셜 로그인 인증 및 JWT 토큰 생성"""
        try:
            # 소셜 제공자별 사용자 정보 가져오기
            if provider == "kakao":
                user_info = await SocialAuthService.get_kakao_user_info(access_token)
                social_provider = SocialProvider.KAKAO
            elif provider == "naver":
                user_info = await SocialAuthService.get_naver_user_info(access_token)
                social_provider = SocialProvider.NAVER
            else:
                logger.error(f"Unsupported social provider: {provider}")
                return None
            
            if not user_info:
                return None
            
            # 사용자 생성/업데이트
            user = SocialAuthService.create_or_update_user(db, social_provider, user_info)
            
            # JWT 토큰 생성
            token_data = {"sub": user.user_id, "type": "access_token"}
            access_token = create_access_token(data=token_data)
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": user.to_dict()
            }
            
        except Exception as e:
            logger.error(f"Social authentication error: {e}")
            return None

def verify_password(plain_password, hashed_password):
    """비밀번호 검증 (admin용)"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """비밀번호 해싱 (admin용)"""
    return pwd_context.hash(password)