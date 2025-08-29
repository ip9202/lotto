import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from .database import engine, Base
from .config import settings
from .api import lotto, recommendations, admin, sessions
from .services.auto_updater import auto_updater

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 생명주기 관리"""
    # 시작 시
    print("🚀 LottoGenius 백엔드 서버 시작 중...")
    
    # 데이터베이스 테이블 생성
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ 데이터베이스 테이블 생성 완료")
    except Exception as e:
        print(f"❌ 데이터베이스 테이블 생성 실패: {e}")
    
    # 자동 업데이트 스케줄러 시작
    try:
        auto_updater.start_scheduler()
        print("✅ 자동 업데이트 스케줄러 시작 완료")
    except Exception as e:
        print(f"❌ 자동 업데이트 스케줄러 시작 실패: {e}")
    
    yield
    
    # 종료 시
    print("🛑 LottoGenius 백엔드 서버 종료 중...")

# FastAPI 앱 생성
app = FastAPI(
    title="LottoGenius API",
    description="AI 로또 번호 추천 서비스 API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록
app.include_router(lotto.router, prefix="")
app.include_router(recommendations.router, prefix="")
app.include_router(admin.router, prefix="")
app.include_router(sessions.router, prefix="")

# 전역 예외 처리
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """전역 예외 처리"""
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "서버 내부 오류가 발생했습니다",
                "details": str(exc) if settings.debug else "서버 오류"
            }
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """HTTP 예외 처리"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": exc.detail,
                "details": None
            }
        }
    )

# 루트 엔드포인트
@app.get("/", tags=["root"])
async def root():
    """루트 엔드포인트"""
    return {
        "success": True,
        "message": "🎯 LottoGenius API에 오신 것을 환영합니다!",
        "data": {
            "service": "LottoGenius Backend",
            "version": "1.0.0",
            "docs": "/docs",
            "health": "/api/v1/recommendations/health"
        }
    }

# 헬스체크 엔드포인트
@app.get("/health", tags=["health"])
async def health_check():
    """시스템 헬스체크"""
    return {
        "success": True,
        "data": {
            "status": "healthy",
            "service": "LottoGenius Backend",
            "version": "1.0.0",
            "timestamp": "2024-01-10T10:30:00Z"
        },
        "message": "시스템이 정상적으로 작동하고 있습니다"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug
    )


