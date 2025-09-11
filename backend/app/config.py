import os
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # 환경 구분
    environment: str = "development"  # development, production
    debug: bool = True
    
    # 데이터베이스 설정
    database_url: str = "postgresql://lotto_user:lotto_password@postgres:5432/lotto_db"  # Docker 컨테이너명 사용
    
    # API 설정
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    
    # CORS 설정 (환경별) - Railway 환경변수 호환
    cors_origins: Union[str, List[str]] = Field(
        default=[
            "http://localhost:5173",  # 개발환경 프론트엔드
            "https://lottoria.ai.kr",  # 프로덕션 도메인
            "https://www.lottoria.ai.kr",  # www 도메인
            "*"  # 임시 긴급 수정 - 모든 Origin 허용
        ]
    )
    
    # 데이터 소스
    lotto_data_url: str = "https://dhlottery.co.kr/gameResult.do?method=byWin"
    
    # 보안 설정 (환경별 다른 키 사용)
    secret_key: str = "dev-secret-key-change-in-production-2024"  # 개발용 기본값
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7일
    
    # 소셜 로그인 설정 (환경변수에서 로드)
    kakao_rest_api_key: str = ""
    naver_client_id: str = ""
    naver_client_secret: str = ""
    
    # Railway 프로덕션 설정
    railway_environment_name: str = ""
    railway_project_id: str = ""
    
    @property
    def is_production(self) -> bool:
        """프로덕션 환경 여부"""
        return self.environment.lower() == "production"
    
    @property
    def is_development(self) -> bool:
        """개발 환경 여부"""
        return self.environment.lower() == "development"
    
    @property
    def database_url_with_fallback(self) -> str:
        """환경별 데이터베이스 URL"""
        if self.is_production:
            # Railway에서 자동으로 설정하는 DATABASE_URL 사용
            return os.getenv("DATABASE_URL", self.database_url)
        else:
            # 개발환경: Docker 컴포즈의 postgres 컨테이너 사용
            return self.database_url
    
    @property 
    def cors_origins_list(self) -> List[str]:
        """CORS origins를 항상 리스트로 반환"""
        if isinstance(self.cors_origins, str):
            # Railway 환경변수에서 쉼표로 구분된 문자열인 경우
            return [origin.strip() for origin in self.cors_origins.split(",")]
        return self.cors_origins
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        
        # Railway 환경변수 자동 로드
        env_prefix = ""

# 전역 설정 인스턴스
settings = Settings()

# 환경별 로깅
if settings.is_production:
    print("🚀 Production mode: Railway deployment")
else:
    print("🔧 Development mode: Docker containers")


