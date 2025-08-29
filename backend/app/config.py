import os
from typing import List
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
    
    # CORS 설정은 main.py에서 직접 처리
    
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


