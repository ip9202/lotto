import os
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # 데이터베이스 설정
    database_url: str = "postgresql://lotto_user:lotto_password@localhost:5432/lotto_genius"
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "lotto_genius"
    db_user: str = "lotto_user"
    db_password: str = "lotto_password"
    
    # API 설정
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: List[str] = Field(default=["http://localhost:5173", "http://localhost:5174"], exclude=True)
    
    def get_cors_origins(self) -> List[str]:
        """환경 변수에서 CORS origins를 파싱하거나 기본값 사용"""
        # 환경 변수에서 CORS_ORIGINS 확인
        cors_env = os.getenv('CORS_ORIGINS')
        if cors_env:
            # 쉼표로 구분된 문자열을 리스트로 변환
            if ',' in cors_env:
                return [origin.strip() for origin in cors_env.split(',')]
            else:
                return [cors_env.strip()]
        
        return self.cors_origins
    
    # 데이터 소스
    lotto_data_url: str = "https://dhlottery.co.kr/gameResult.do?method=byWin"
    
    # 보안
    secret_key: str = "your-super-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # 개발 모드
    debug: bool = True
    environment: str = "development"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# 전역 설정 인스턴스
settings = Settings()


