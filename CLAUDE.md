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
- **SavedRecommendation**: User's saved lottery number combinations

#### API Architecture
- **RESTful API** with FastAPI
- **Standardized response format**: `{"success": bool, "data": any, "message": str, "error": object}`
- **Key endpoints**:
  - `POST /api/v1/recommendations/generate` - Generate AI recommendations
  - `GET /api/v1/lotto/latest` - Get latest lottery data  
  - `GET /admin/*` - Admin dashboard endpoints
  - `POST /api/v1/auth/login` - Social login (Kakao/Naver)
  - `GET /api/v1/auth/me` - Get current user info
  - `POST /api/v1/saved-recommendations` - Save user's lottery numbers

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

## Testing and Debugging

### Authentication System Testing
- **Social Login Test**: Use mock tokens in development for Kakao/Naver login
- **JWT Token Validation**: Check `/api/v1/auth/me` endpoint with Bearer token
- **Database Tables**: Ensure `users` and `saved_recommendations` tables exist
- **Frontend Auth Flow**: Test UserAuthContext state management and localStorage persistence

### Database Setup
If SQLAlchemy create_all fails, manually create tables:
```sql
-- Connect to PostgreSQL in Docker
docker exec -it lotto-db-1 psql -U lotto_user -d lotto_db

-- User authentication table
CREATE TABLE users (
    user_id VARCHAR PRIMARY KEY,
    nickname VARCHAR,
    profile_image_url VARCHAR,
    email VARCHAR,
    social_provider VARCHAR NOT NULL,
    subscription_plan VARCHAR DEFAULT 'FREE',
    subscription_status VARCHAR DEFAULT 'ACTIVE',
    -- ... other fields as defined in models/user.py
);

-- Saved recommendations table  
CREATE TABLE saved_recommendations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(user_id),
    numbers VARCHAR NOT NULL,
    -- ... other fields as defined in models/saved_recommendation.py
);
```