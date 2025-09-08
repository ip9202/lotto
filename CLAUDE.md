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