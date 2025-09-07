# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (FastAPI)
- **⚠️ FIRST: Activate conda environment**: `conda activate py3_12` (MANDATORY!)
- **Check environment**: `echo $CONDA_DEFAULT_ENV` → should show `py3_12`
- **Start development server**: `cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
- **Install dependencies**: `cd backend && pip install -r requirements.txt`
- **Database URL**: `postgresql://lotto_user:lotto_password@localhost:5432/lotto_db`

### Frontend (React + Vite)
- **Development server**: `cd frontend && npm run dev` (runs on http://localhost:5173)
- **Build**: `cd frontend && npm run build`
- **Lint**: `cd frontend && npm run lint`
- **Install dependencies**: `cd frontend && npm install`

### Docker (Recommended)
- **Start all services**: `docker-compose up -d`
- **Stop all services**: `docker-compose down`
- **Check service status**: `docker-compose ps`
- **Quick start script**: `./start_dev.sh` (handles conda activation and Docker setup)

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
- **⚠️ CRITICAL: CONDA ENVIRONMENT**: 
  - **ALL Python/Backend work MUST use `py3_12` conda environment**
  - **NEVER run Python commands without activating conda environment first**
  - **Before ANY backend work**: `conda activate py3_12`
  - **Check environment**: `echo $CONDA_DEFAULT_ENV` should show `py3_12`
  - **If not activated**: Backend development will FAIL

- **🐳 CRITICAL: ALWAYS USE DOCKER**:
  - **Primary development method**: `docker-compose up -d`
  - **NEVER run services individually** unless debugging specific issues
  - **All services containerized**: PostgreSQL + Backend + Frontend
  - **Check service status**: `docker-compose ps`
  - **Stop services**: `docker-compose down`

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
- **Foreign Key Updates**: `saved_recommendations.user_id` now references `users.id` instead of `users.user_id`
- **Enum Values**: All enum values converted to uppercase (KAKAO, NAVER, FREE, PREMIUM, PRO)
- **Authentication Fix**: JWT token now uses `users.id` for authentication instead of `users.user_id`

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