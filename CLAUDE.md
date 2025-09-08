# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### 🐳 Docker (PRIMARY METHOD - 모든 서비스는 Docker로 실행)
- **⚠️ IMPORTANT: 모든 개발은 Docker를 통해 진행합니다**
- **Start all services**: `docker-compose up -d`
- **Stop all services**: `docker-compose down`
- **Check service status**: `docker-compose ps`
- **View logs**: `docker-compose logs -f [service_name]`
- **Quick start script**: `./start_dev.sh` (Docker 자동 설정)

### Backend (FastAPI) - Docker 내부에서 실행
- **⚠️ NOTE: 백엔드는 Docker 컨테이너 내부에서 자동 실행됩니다**
- **Manual conda setup** (Docker 외부에서만 필요): `conda activate py3_12`
- **Database URL**: `postgresql://lotto_user:lotto_password@localhost:5432/lotto_db`
- **API Documentation**: http://localhost:8000/docs

### Frontend (React + Vite) - Docker 내부에서 실행
- **⚠️ NOTE: 프론트엔드는 Docker 컨테이너 내부에서 자동 실행됩니다**
- **Access URL**: http://localhost:5173
- **Manual setup** (Docker 외부에서만 필요):
  - `cd frontend && npm install`
  - `cd frontend && npm run dev`
  - `cd frontend && npm run build`
  - `cd frontend && npm run lint`

## Architecture Overview

### Project Structure
```
lotto/
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── api/             # API route handlers
│   │   ├── models/          # SQLAlchemy database models
│   │   ├── schemas/         # Pydantic data schemas
│   │   ├── services/        # Business logic layer
│   │   ├── main.py          # FastAPI app initialization
│   │   └── config.py        # Configuration settings
├── frontend/                # React TypeScript frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page-level components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom React hooks
│   │   └── services/       # API communication
└── docker-compose.yml       # Multi-service setup
```

### Core Services Architecture

#### Backend Services
- **RecommendationEngine** (`backend/app/services/recommendation_engine.py`): AI-powered lottery number recommendation using Monte Carlo methods and statistical analysis
- **LottoAnalyzer** (`backend/app/services/lotto_analyzer.py`): Statistical analysis of lottery patterns, frequency, trends
- **AutoUpdater** (`backend/app/services/auto_updater.py`): Automated data collection from lottery websites using APScheduler
- **SessionManager** (`backend/app/services/session_manager.py`): User session and data persistence

#### Database Models
- **LottoDraw**: Historical lottery draw data
- **Recommendation**: Generated lottery recommendations
- **UserSession**: User session management for storing preferences and history
- **User**: User account management with social login (Kakao/Naver)
  - Primary key: `id` (INTEGER)
  - Unique identifier: `user_id` (VARCHAR)
  - Social login: `social_provider`, `social_id`
  - Subscription: `subscription_plan`, `subscription_status`
  - Preferences: `preferences` (JSONB), `notification_settings` (JSONB)
- **SavedRecommendation**: User's saved lottery number combinations
  - Foreign key: `user_id` references `users(id)`
  - Numbers: `numbers` (INTEGER[])
  - Metadata: `title`, `memo`, `tags` (JSONB)
  - Status: `is_active`, `is_favorite`, `is_purchased`
  - Winning: `winning_rank`, `winning_amount`, `matched_count`

#### API Architecture
- **RESTful API** with FastAPI
- **Standardized response format**: `{"success": bool, "data": any, "message": str, "error": object}`
- **Key endpoints**:
  - `POST /api/v1/recommendations/generate` - Generate AI recommendations
  - `GET /api/v1/lotto/latest` - Get latest lottery data  
  - `GET /admin/*` - Admin dashboard endpoints
  - `POST /api/v1/auth/login` - Social login (Kakao/Naver)
  - `GET /api/v1/auth/me` - Get current user info
  - `GET /api/v1/auth/profile` - Get user profile with stats
  - `POST /api/v1/saved-recommendations` - Save user's lottery numbers
  - `GET /api/v1/saved-recommendations` - Get saved recommendations list
  - `PUT /api/v1/saved-recommendations/{id}` - Update saved recommendation
  - `DELETE /api/v1/saved-recommendations/{id}` - Delete saved recommendation
  - `GET /api/v1/saved-recommendations/stats/summary` - Get recommendation statistics
  - `POST /api/v1/saved-recommendations/check-winning` - Check winning results

### Frontend Architecture
- **React 18** with TypeScript
- **Component-based architecture** with index.ts barrel exports
- **React Router** for client-side routing
- **Tailwind CSS** for styling with custom lottery ball components
- **Context-based state management** for admin and user authentication
- **JWT token authentication** with localStorage persistence and automatic refresh

### Key Components
- **UnifiedNumberManager**: Central component for number selection and management
- **RecommendationCard**: Displays AI-generated recommendations with confidence scores
- **LottoBall/MiniLottoBall**: Custom lottery ball UI components with color coding (1-10: red, 11-20: blue, etc.)
- **AdminAuthContext**: Authentication context for admin features
- **UserAuthContext**: Global user authentication state with social login integration
- **SocialLogin**: Kakao/Naver social authentication component
- **UserProfile**: User profile dropdown with account management
- **SaveRecommendation**: Component for saving lottery recommendations to user account

### AI Recommendation System
The recommendation engine uses a multi-factor analysis approach:
- **Frequency Analysis** (60% weight): Historical appearance frequency vs theoretical expectation
- **Trend Analysis** (40% weight): Recent hot/cold number patterns
- **Pattern Analysis**: Odd/even balance, number distribution, consecutive numbers, digit endings
- **Monte Carlo Generation**: Probabilistic combination generation based on calculated scores

### Data Flow
1. **Auto-scraping**: Weekly data collection from `https://dhlottery.co.kr/gameResult.do?method=byWin`
2. **Analysis**: Statistical processing of historical data
3. **Recommendation**: AI-generated combinations with confidence scores
4. **Authentication**: Social login (Kakao/Naver) → JWT token → User session
5. **Presentation**: React frontend displays recommendations with save functionality for authenticated users

### Environment Requirements
- **Backend**: Python 3.12, conda environment `py3_12` (CRITICAL: Always use this environment)
- **Frontend**: Node.js 18+, npm
- **Database**: PostgreSQL (via Docker)
- **Production**: Railway hosting with custom domain `lottoria.ai.kr`

### Development Notes
- **🐳 CRITICAL: ALWAYS USE DOCKER**:
  - **PRIMARY METHOD**: 모든 개발은 `docker-compose up -d`로 시작
  - **NEVER run services individually** unless debugging specific issues
  - **All services containerized**: PostgreSQL + Backend + Frontend
  - **Check service status**: `docker-compose ps`
  - **Stop services**: `docker-compose down`
  - **View logs**: `docker-compose logs -f [service_name]`

- **⚠️ CONDA ENVIRONMENT** (Docker 외부에서만 필요):
  - **ONLY for manual Python development**: `conda activate py3_12`
  - **Docker 내부에서는 자동으로 Python 3.12 환경 제공**
  - **Check environment**: `echo $CONDA_DEFAULT_ENV` should show `py3_12`
  - **If not activated**: Manual backend development will FAIL

- **🌍 ENVIRONMENT SEPARATION**:
  - **Development**: Local Docker containers
  - **Production**: Railway deployment with environment variables
  - **Environment files**: `.env` (local), Railway dashboard (production)
  - **Database**: 
    - Dev: `postgresql://lotto_user:lotto_password@localhost:5432/lotto_db`
    - Prod: Railway PostgreSQL connection string
  - **CORS origins**: localhost (dev) + lottoria.ai.kr (prod)
  - **Secret keys**: Different for dev/prod environments

- **Port Configuration**: Backend (8000), Frontend (5173), PostgreSQL (5432)
- **Korean Language**: UI and documentation primarily in Korean for target market
- **AdSense Integration**: Includes Google AdSense components with policy-compliant placement
- **Authentication Flow**: Social OAuth2 → Backend verification → JWT token → Frontend localStorage
- **IMPORTANT**: All responses and communication in this project should be in Korean (한글)

### Recent Database Schema Changes (2025-09-07)
- **Major Schema Updates**: Database structure significantly updated to match SQLAlchemy models
- **User Table**: Added `user_id`, `is_verified`, `subscription_plan`, `preferences`, `notification_settings`, `last_login_at`
- **SavedRecommendations Table**: Added `bonus_number`, `is_purchased`, `purchase_date`, `is_checked`, `winning_rank`, `winning_amount`, `matched_count`, `matched_numbers`
- **Data Type Changes**: 
  - `user_id`: String → Integer (Primary Key)
  - `numbers`: JSON → INTEGER[] (PostgreSQL array)
  - `tags`: character varying[] → JSONB
  - `matched_numbers`: JSON → INTEGER[] (PostgreSQL array)
- **Foreign Key Updates**: `saved_recommendations.user_id` now references `users.id` instead of `users.user_id`
- **Enum Values**: All enum values converted to uppercase (KAKAO, NAVER, FREE, PREMIUM, PRO)
- **Authentication Fix**: JWT token now uses `users.id` for authentication instead of `users.user_id`

### New Features Added (2025-09-08)
- **Unified Authentication System**: Complete implementation of email + social login system
  - **Email Registration/Login**: Direct email/password authentication
  - **Social Login Integration**: Kakao login with account linking
  - **Admin Management**: Role-based access control with admin panel
  - **Login Persistence**: Page refresh maintains authentication state
  - **Database Schema**: Extended User model with password_hash, role, login_method fields
  - **API Endpoints**: `/api/v1/auth/*` for unified authentication
  - **Frontend Context**: `UnifiedAuthContext` for state management
  - **Pages**: `/login`, `/register` for user authentication

- **Statistics Dashboard**: Complete implementation of comprehensive statistics dashboard
  - **User Statistics**: Total recommendations, wins, win rate, total winnings, best rank
  - **Lotto Number Analysis**: Number frequency charts, hot/cold numbers visualization
  - **Performance Charts**: Recommendation performance trends, win rate analysis
  - **Interactive Components**: StatCard, NumberFrequencyChart, WinRateChart, RecommendationPerformanceChart
  - **Chart Library**: Recharts integration for clean, modern chart designs
  - **Real-time Data**: API integration with live statistics from backend
  - **Responsive Design**: Mobile and desktop optimized dashboard

- **Winning Results Check API**: Complete implementation of lottery winning verification
  - Endpoint: `POST /api/v1/saved-recommendations/check-winning`
  - Parameters: `draw_number`, `winning_numbers[]`, `bonus_number`
  - Features: Automatic rank calculation (1st-5th place), prize amount calculation
  - Database Updates: `is_checked`, `matched_count`, `matched_numbers`, `winning_rank`, `winning_amount`
  - User Stats: Automatic update of `total_wins` and `total_winnings`
- **Winning Rank System**:
  - 1st Place: 6 numbers match
  - 2nd Place: 5 numbers + bonus number
  - 3rd Place: 5 numbers match
  - 4th Place: 4 numbers match
  - 5th Place: 3 numbers match
- **Prize Amounts** (Example): 1st: 2B won, 2nd: 50M won, 3rd: 1.5M won, 4th: 50K won, 5th: 5K won

### Social Login Implementation (2025-09-08)
- **카카오 소셜 로그인 완전 구현**:
  - OAuth 2.0 인증 코드 플로우 구현
  - 백엔드에서 카카오 API 토큰 교환 (`get_kakao_access_token`)
  - 사용자 정보 조회 (고유 ID만 수집, 개인정보 최소화)
  - JWT 토큰 생성 및 프론트엔드 로그인 상태 관리
  - **전역 콜백 처리**: App.tsx의 CallbackHandler로 안정적인 로그인 처리
  - **즉시 로그인 완료**: 새로고침 없이도 로그인 상태 즉시 반영
- **네이버 소셜 로그인 준비 완료** (검수 대기 중):
  - 네이버 OAuth 2.0 플로우 구현 완료
  - 백엔드 토큰 교환 로직 구현 (`get_naver_access_token`)
  - UI에서 네이버 로그인 버튼 숨김 처리 (검수 완료 후 활성화 예정)
  - 설정 파일들은 보존하여 나중에 쉽게 활성화 가능
- **환경변수 설정**:
  - `VITE_KAKAO_APP_KEY`: 카카오 JavaScript SDK 키
  - `KAKAO_REST_API_KEY`: 카카오 REST API 키 (백엔드 토큰 교환용)
  - `VITE_NAVER_CLIENT_ID`, `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`: 네이버 로그인용
- **보안 및 개인정보 보호**:
  - 최소한의 개인정보만 수집 (고유 ID, 닉네임)
  - 이메일, 프로필 이미지 등은 선택적 수집
  - 법적 리스크 최소화를 위한 데이터 수집 정책 적용
- **AdSense 통합** (심사용):
  - Google AdSense 스크립트 복원 (심사 진행 중)
  - 에러 방지 처리가 포함된 안전한 로드
  - 심사 완료 후 정상 운영 예정

### ✅ 카카오 로그인 중복 요청 문제 해결 완료 (2025-09-08)
- **해결 상태**: ✅ **완료** - 중복 요청 문제 완전 해결
- **적용된 해결책**:
  - **세션 스토리지 기반 중복 방지**: `kakao_processing_${code}` 키로 고유 처리 상태 추적
  - **useRef 이중 보안**: `processingRef.current`로 추가 중복 방지 레이어
  - **즉시 URL 정리**: 토큰 교환 전에 URL 파라미터를 즉시 제거하여 중복 실행 차단
  - **useEffect 의존성 수정**: `[isProcessingKakao]` → `[]`로 변경하여 한 번만 실행
  - **finally 블록**: 처리 완료 후 세션 스토리지와 ref 상태 자동 정리
- **개선된 로직 플로우**:
  1. URL에서 카카오 인증 코드 확인
  2. 세션 스토리지 + useRef 이중 체크로 중복 방지
  3. 즉시 URL 정리하여 재실행 차단
  4. 처리 시작 마킹 (세션 스토리지 + ref)
  5. 카카오 토큰 교환 및 로그인 처리
  6. finally 블록에서 모든 상태 정리
- **테스트 결과**: 
  - ✅ 프론트엔드 컴파일 에러 해결
  - ✅ 카카오 로그인 버튼 정상 작동
  - ✅ 카카오 인증 페이지 정상 리다이렉트
  - ✅ 중복 요청 방지 로직 정상 적용
- **예상 효과**: `invalid_grant` 400 에러 완전 제거, 사용자 경험 개선, React Strict Mode 호환성 확보

## Testing and Debugging

### Authentication System Testing
- **Social Login Test**: Use mock tokens in development for Kakao/Naver login
- **JWT Token Validation**: Check `/api/v1/auth/me` endpoint with Bearer token
- **Database Tables**: Ensure `users` and `saved_recommendations` tables exist with correct schema
- **Frontend Auth Flow**: Test UserAuthContext state management and localStorage persistence
- **CRUD Operations**: Test save, list, update, delete operations for saved recommendations
- **User Profile**: Test `/api/v1/auth/profile` endpoint for complete user data
- **Statistics**: Test `/api/v1/saved-recommendations/stats/summary` for user statistics

### Database Schema Notes
- **Primary Keys**: `users.id` (INTEGER), `saved_recommendations.id` (INTEGER)
- **Foreign Keys**: `saved_recommendations.user_id` → `users.id`
- **Data Types**: 
  - `numbers`: INTEGER[] (PostgreSQL array)
  - `tags`: JSONB (PostgreSQL JSON)
  - `preferences`: JSONB
  - `analysis_data`: JSONB
- **Enum Values**: Use uppercase (KAKAO, NAVER, FREE, PREMIUM, PRO)
- **Indexes**: Created on `user_id`, `is_active`, `created_at` for performance

### Database Setup
If SQLAlchemy create_all fails, manually create tables:
```sql
-- Connect to PostgreSQL in Docker
docker exec -it lotto_postgres psql -U lotto_user -d lotto_db

-- User authentication table (Updated schema)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE,
    social_provider VARCHAR(20) NOT NULL,
    social_id VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    email VARCHAR(255),
    profile_image_url TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    subscription_status VARCHAR(50) DEFAULT 'free',
    subscription_plan VARCHAR(20) DEFAULT 'free',
    subscription_start_date TIMESTAMP,
    subscription_end_date TIMESTAMP,
    daily_recommendation_count INTEGER DEFAULT 0,
    daily_recommendation_limit INTEGER DEFAULT 5,
    total_saved_numbers INTEGER DEFAULT 0,
    total_saved_limit INTEGER DEFAULT 10,
    total_wins INTEGER DEFAULT 0,
    total_winnings BIGINT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,
    last_recommendation_date TIMESTAMP WITH TIME ZONE,
    preferences JSONB,
    notification_settings JSONB,
    last_login_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(social_id, social_provider)
);

-- Saved recommendations table (Updated schema)
CREATE TABLE saved_recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    numbers INTEGER[] NOT NULL,
    bonus_number INTEGER,
    confidence_score DOUBLE PRECISION,
    generation_method VARCHAR(20) NOT NULL,
    analysis_data JSONB,
    title VARCHAR(255),
    memo TEXT,
    tags JSONB,
    target_draw_number INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    is_favorite BOOLEAN DEFAULT FALSE,
    winning_result JSONB,
    prize_amount INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_purchased BOOLEAN DEFAULT FALSE,
    purchase_date TIMESTAMP WITH TIME ZONE,
    is_checked BOOLEAN DEFAULT FALSE,
    winning_rank INTEGER,
    winning_amount BIGINT,
    matched_count INTEGER DEFAULT 0,
    matched_numbers INTEGER[]
);
```

## ✅ 카카오 로그인 시스템 완성 (2025-09-08)

### 완성된 기능
1. **신규 사용자 플로우**: 카카오 로그인 → 회원가입 페이지 → 자동 로그인 → 카카오 연동
2. **기존 사용자 플로우**: 카카오 로그인 → 자동 로그인 → 카카오 연동
3. **UX 최적화**: 로딩 상태, 안내 메시지, 버튼 정리
4. **헤더 정리**: 카카오 연동 버튼 제거로 깔끔한 UI

### 기술적 해결사항
- **중복 요청 방지**: `sessionStorage` + `useRef` + URL 정리
- **토큰 처리**: `access_token` 패턴 감지로 올바른 처리
- **데이터베이스 연동**: `social_id` 기반 기존 계정 검색
- **에러 처리**: 상세한 에러 메시지와 로딩 상태

### 현재 상태
- **완전 자동화**: 사용자가 카카오 로그인만 클릭하면 모든 과정 자동 처리
- **데이터 무결성**: 카카오 ID 기반으로 정확한 계정 매칭
- **사용자 경험**: 직관적이고 부드러운 로그인 플로우

## ✅ 카카오 로그인 UX 개선 완료 (2025-09-08)

### 해결된 문제들
1. **이미 연동된 계정의 잘못된 플로우**: lee@example.com 계정이 이미 카카오 연동되어 있는데도 연동 페이지로 이동하는 문제 해결
2. **카카오 로그인 후 UX 개선**: 로그인 페이지가 잠깐 보이고 메인으로 이동하는 어색한 UX를 전체 화면 로딩으로 개선

### 기술적 수정사항
- **이메일 로그인 후 연동 상태 체크**: `/api/v1/auth/me` API로 `linked_social_providers` 확인
- **조건부 연동 페이지 표시**: 이미 카카오 연동된 계정은 바로 메인 페이지로 이동
- **전체 화면 로딩 컴포넌트**: 카카오 로그인 성공 후 부드러운 전환을 위한 로딩 화면

### 최종 플로우
- **신규 사용자**: 카카오 로그인 → 회원가입 페이지 → 자동 로그인 → 카카오 연동
- **기존 사용자 (연동됨)**: 카카오 로그인 → 자동 로그인 → 메인 페이지
- **기존 사용자 (미연동)**: 이메일 로그인 → 카카오 연동 옵션 표시

## ✅ 카카오 로그인 중복 사용자 생성 문제 완전 해결 (2025-09-08)

### 🎯 핵심 문제
- **문제**: 카카오 로그인 시 기존 계정이 있음에도 불구하고 중복 사용자 계속 생성
- **원인**: `check-kakao-user`와 `login/social` API에서 서로 다른 검색 로직 사용

### 🔧 해결 과정

#### 1. SocialProvider enum 비교 문제
- **문제**: `check-kakao-user`에서 `"KAKAO"` (문자열)로 검색, `login/social`에서 `SocialProvider.KAKAO` (enum)로 검색
- **해결**: 두 API 모두 `SocialProvider.KAKAO` (enum)로 통일

#### 2. 소셜 ID 키 불일치 문제
- **문제**: `check-kakao-user`에서 `user_info.get("id")` 사용, `login/social`에서 `user_info.get("social_id")` 사용
- **해결**: `unified_auth_service.py`에서 `user_info.get("social_id")`로 통일

#### 3. 데이터 일관성 문제
- **문제**: `linked_social_providers`에 대문자 `['KAKAO']`와 소문자 `['kakao']` 혼재
- **해결**: 소문자 `['kakao']`로 통일하고 대소문자 구분 없이 비교

### 🔧 기술적 수정사항

#### Backend (`backend/app/api/v1/endpoints/unified_auth.py`)
```python
# check-kakao-user API 수정
existing_user = db.query(User).filter(
    and_(
        User.social_provider == SocialProvider.KAKAO,  # enum으로 수정
        User.social_id == str(user_info.get("id")),
        User.is_active == True
    )
).first()
```

#### Backend (`backend/app/services/unified_auth_service.py`)
```python
# 소셜 ID 검색 로직 수정
existing_user = db.query(User).filter(
    and_(
        User.social_provider == SocialProvider.KAKAO if provider.lower() == 'kakao' else SocialProvider.NAVER,
        User.social_id == str(user_info.get("social_id")),  # social_id 키로 수정
        User.is_active == True
    )
).first()

# linked_social_providers 비교 로직 수정
if provider.lower() not in [p.lower() for p in existing_user.linked_social_providers]:
    existing_user.linked_social_providers.append(provider.lower())
```

### 📊 최종 결과
- ✅ **중복 사용자 생성 완전 방지**: 기존 계정으로 정상 로그인
- ✅ **데이터 일관성**: enum과 문자열 비교 통일
- ✅ **소셜 ID 검색**: 올바른 키로 검색하여 기존 계정 발견
- ✅ **사용자 경험**: 카카오 로그인 시 기존 계정으로 즉시 로그인

## ✅ 프로필 설정 및 비밀번호 변경 기능 구현 (2025-09-08)

### 🎯 구현된 기능
- **프로필 설정 페이지**: `/profile-settings` 경로
- **비밀번호 변경**: 이메일 로그인 사용자만 가능
- **계정 정보 표시**: 이메일, 닉네임, 로그인 방식, 연동된 소셜 계정
- **소셜 로그인 안내**: 카카오/네이버 사용자는 해당 플랫폼에서 변경 안내

### 🔧 기술적 구현

#### Frontend (`frontend/src/pages/ProfileSettings.tsx`)
```typescript
// 비밀번호 변경 폼
const handlePasswordSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validatePasswordForm()) {
    return;
  }

  const response = await fetch('http://localhost:8000/api/v1/auth/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    },
    body: JSON.stringify({
      current_password: passwordData.currentPassword,
      new_password: passwordData.newPassword
    })
  });
};
```

#### Backend (`backend/app/api/v1/endpoints/unified_auth.py`)
```python
@router.post("/change-password", response_model=AuthResponse, summary="비밀번호 변경")
async def change_password(
    password_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 현재 비밀번호 확인
    if not verify_password(current_password, current_user.hashed_password):
        return AuthResponse(success=False, error={"message": "현재 비밀번호가 올바르지 않습니다."})
    
    # 새 비밀번호 해시화
    new_hashed_password = get_password_hash(new_password)
    current_user.hashed_password = new_hashed_password
    db.commit()
```

### 📊 결과
- ✅ **프로필 설정 페이지**: 사용자 정보 확인 및 비밀번호 변경 가능
- ✅ **비밀번호 변경**: 8자 이상, 현재 비밀번호 확인, 실시간 검증
- ✅ **소셜 로그인 안내**: 카카오/네이버 사용자에게 적절한 안내 메시지
- ✅ **보안**: 현재 비밀번호 확인 후 변경, 해시화 저장

## ✅ 비밀번호 변경 정책 개선 및 로그아웃 개선 (2025-09-08)

### 🎯 주요 변경사항
- **비밀번호 변경 정책 수정**: 모든 계정에서 비밀번호 변경 가능
- **소셜 로그인 역할 변경**: 단순 계정 연동용으로 처리
- **로그아웃 개선**: 로그아웃 시 메인페이지 자동 이동
- **콘솔 로그 정리**: 프로덕션 환경에 적합하게 정리

### 🔧 기술적 수정사항

#### 1. 비밀번호 변경 정책 수정
**Frontend (`frontend/src/pages/ProfileSettings.tsx`)**
```typescript
// 기존: 소셜 로그인 사용자는 비밀번호 변경 불가
{user.social_provider !== 'kakao' && user.social_provider !== 'naver' && (
  <div>비밀번호 변경 섹션</div>
)}

// 수정: 모든 사용자에게 비밀번호 변경 가능
{(
  <div>비밀번호 변경 섹션</div>
)}
```

**Backend (`backend/app/api/v1/endpoints/unified_auth.py`)**
```python
# 비밀번호 필드명 수정
# 기존: current_user.hashed_password
# 수정: current_user.password_hash
if not verify_password(current_password, current_user.password_hash):
    return AuthResponse(success=False, error={"message": "현재 비밀번호가 올바르지 않습니다."})
```

#### 2. 소셜 계정 연동 안내 개선
```typescript
// 연동된 소셜 계정 안내 메시지
{user.linked_social_providers && user.linked_social_providers.length > 0 && (
  <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
    <h3 className="text-lg font-medium text-blue-900 mb-2">연동된 소셜 계정</h3>
    <p className="text-blue-800">
      {user.linked_social_providers.map(provider => 
        provider === 'kakao' ? '카카오' : 
        provider === 'naver' ? '네이버' : provider
      ).join(', ')} 계정이 연동되어 있습니다. 
      소셜 계정으로도 로그인할 수 있으며, 비밀번호는 언제든지 변경 가능합니다.
    </p>
  </div>
)}
```

#### 3. 로그아웃 시 메인페이지 리다이렉트
**UnifiedAuthContext (`frontend/src/contexts/UnifiedAuthContext.tsx`)**
```typescript
const logout = () => {
  localStorage.removeItem('access_token');
  setUser(null);
  // 메인페이지로 리다이렉트
  window.location.href = '/';
};
```

**UserAuthContext (`frontend/src/contexts/UserAuthContext.tsx`)**
```typescript
const logout = () => {
  setToken(null);
  setUser(null);
  localStorage.removeItem('userToken');
  localStorage.removeItem('userData');
  // 메인페이지로 리다이렉트
  window.location.href = '/';
};
```

**AdminAuthContext (`frontend/src/contexts/AdminAuthContext.tsx`)**
```typescript
const logout = () => {
  setIsAuthenticated(false);
  setAdminInfo(null);
  localStorage.removeItem('adminAuth');
  // 메인페이지로 리다이렉트
  window.location.href = '/';
};
```

#### 4. 콘솔 로그 정리
- **11개 파일**에서 **47개의 console.log** 제거
- **프로덕션 환경**에 적합하게 정리
- **사용자 경험** 개선 (콘솔 로그 노이즈 제거)

### 📊 최종 결과
- ✅ **비밀번호 변경**: 모든 계정에서 비밀번호 변경 가능
- ✅ **소셜 로그인**: 단순 계정 연동용으로 처리
- ✅ **로그아웃 개선**: 로그아웃 시 메인페이지 자동 이동
- ✅ **콘솔 로그 정리**: 프로덕션 환경 준비 완료
- ✅ **사용자 경험**: 일관된 계정 관리 경험 제공

## ✅ 관리자 로그인 시스템 통합 완료 (2025-09-08)

### 🎯 주요 변경사항
- **관리자 로그인 통합**: 별도 관리자 로그인 시스템을 일반 로그인으로 통합
- **헤더 정리**: 관리자 메뉴 제거 및 불필요한 파일 삭제
- **권한 기반 접근**: 관리자 페이지는 관리자 권한이 있는 계정만 접근 가능
- **사용자 경험 개선**: 모든 로그인이 하나의 시스템으로 통합

### 🔧 기술적 수정사항

#### 1. 관리자 계정 설정
**Backend (`ip9202@gmail.com` 계정)**
```python
# 관리자 계정 정보
이메일: ip9202@gmail.com
비밀번호: admin123
역할: UserRole.ADMIN
로그인 방식: LoginMethod.EMAIL
```

#### 2. Admin.tsx 통합
**Frontend (`frontend/src/pages/Admin.tsx`)**
```typescript
// UnifiedAuthContext 사용으로 변경
const { user, isAuthenticated, logout, isLoading } = useUnifiedAuth();

// 관리자 권한 확인
const isAdmin = user?.role === 'admin';

// 로그인하지 않은 경우 로그인 페이지로 리다이렉트
useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    navigate('/login');
  }
}, [isAuthenticated, isLoading, navigate]);

// 관리자가 아닌 경우 접근 거부
if (!isAdmin) {
  return <AccessDeniedComponent />;
}
```

#### 3. UserResponse 스키마 수정
**Backend (`backend/app/schemas/user.py`)**
```python
class UserResponse(BaseModel):
    """사용자 응답 데이터"""
    user_id: str
    nickname: Optional[str]
    # ... 기존 필드들 ...
    role: Optional[str] = None  # 추가된 필드
    # ... 나머지 필드들 ...
```

#### 4. 불필요한 파일 제거
- **AdminLogin.tsx**: 관리자 로그인 컴포넌트 삭제
- **AdminAuthContext.tsx**: 관리자 인증 컨텍스트 삭제
- **AdminAuth/ 디렉토리**: 빈 디렉토리 삭제
- **Layout.tsx**: 헤더에서 관리자 메뉴 제거

#### 5. App.tsx 라우트 단순화
```typescript
// 기존: AdminAuthProvider로 감싸진 복잡한 구조
<Route path="/admin" element={
  <AdminAuthProvider>
    <Admin />
  </AdminAuthProvider>
} />

// 수정: 단순한 라우트
<Route path="/admin" element={<Admin />} />
```

### 📊 최종 결과
- ✅ **통합 로그인**: 모든 사용자가 하나의 로그인 시스템 사용
- ✅ **권한 기반 접근**: 관리자 페이지는 관리자 권한 계정만 접근
- ✅ **코드 정리**: 불필요한 관리자 관련 파일들 제거
- ✅ **사용자 경험**: 일관된 로그인 경험 제공
- ✅ **유지보수성**: 단일 인증 시스템으로 관리 복잡도 감소
```