import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import json
from .database import engine, Base
from .config import settings
from .api import lotto, recommendations, admin, sessions, auth, saved_recommendations, public_recommendations, winning_comparison, user_preferences
from .api.v1.endpoints import unified_auth
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
    print("🚀 로또리아 AI 백엔드 서버 시작 중...")
    
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
    print("🛑 로또리아 AI 백엔드 서버 종료 중...")

# FastAPI 앱 생성
app = FastAPI(
    title="로또리아 AI API",
    description="AI 로또 번호 추천 서비스 API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# 요청 로깅 미들웨어
@app.middleware("http")
async def log_requests(request: Request, call_next):
    if request.url.path == "/api/v1/saved-recommendations" and request.method == "POST":
        body = await request.body()
        print(f"🔍 저장 요청 로그:")
        print(f"   URL: {request.url}")
        print(f"   Headers: {dict(request.headers)}")
        print(f"   Body: {body.decode('utf-8') if body else 'Empty'}")
        
        # body를 다시 읽을 수 있도록 설정
        async def receive():
            return {"type": "http.request", "body": body}
        request._receive = receive
    
    response = await call_next(request)
    return response

# CORS 미들웨어 설정 - lottoria.ai.kr 도메인 포함
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # 로컬 개발
        "https://lottoria.ai.kr",  # 메인 도메인
        "https://www.lottoria.ai.kr",  # www 도메인
        "https://lotto-frontend-production-c563.up.railway.app",  # 기존 Railway 도메인
        "*"  # 임시로 모든 도메인 허용 (나중에 제거 가능)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
print("✅ CORS 미들웨어 설정 완료 - lottoria.ai.kr 도메인 포함")

# API 라우터 등록
app.include_router(lotto.router, prefix="")
app.include_router(recommendations.router, prefix="")
app.include_router(admin.router, prefix="")
app.include_router(sessions.router, prefix="")
app.include_router(auth.router, prefix="")  # 인증 API
app.include_router(saved_recommendations.router, prefix="")  # 저장된 추천번호 API
app.include_router(public_recommendations.router, prefix="")  # 공공 추천 데이터 API
app.include_router(winning_comparison.router, prefix="")  # 당첨 비교 API
app.include_router(user_preferences.router, prefix="/api/v1/user")  # 사용자 설정 API
app.include_router(unified_auth.router, prefix="/api/v1/auth")  # 통합 인증 API

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
        "message": "🎯 로또리아 AI API에 오신 것을 환영합니다!",
        "data": {
            "service": "로또리아 AI Backend",
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
            "service": "로또리아 AI Backend",
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


