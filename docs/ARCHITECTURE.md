# 시스템 아키텍처

## 프로젝트 구조
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

## 핵심 서비스 아키텍처

### Backend Services
- **RecommendationEngine** (`backend/app/services/recommendation_engine.py`): AI-powered lottery number recommendation using Monte Carlo methods, statistical analysis, and ML-based prediction
  - **ML Mode**: scikit-learn Random Forest model for probability prediction
  - **Statistical Mode**: Original Monte Carlo + weighted sampling (fallback)
  - **Lazy Loading**: ML model loaded on first inference request
  - **Auto Fallback**: Switches to statistical mode on ML failure
- **LottoAnalyzer** (`backend/app/services/lotto_analyzer.py`): Statistical analysis of lottery patterns, frequency, trends
- **AutoUpdater** (`backend/app/services/auto_updater.py`): Automated data collection from lottery websites using APScheduler
- **SessionManager** (`backend/app/services/session_manager.py`): User session and data persistence

### ML Services (`backend/app/services/ml/`)
- **DataPreprocessor** (`data_preprocessor.py`):
  - Loads lottery draw data from PostgreSQL
  - Extracts 145 ML features (frequency, trend, correlation, statistics)
  - Validates data quality (missing values, range, duplicates)
  - Prepares train/test splits (80/20)
- **ModelTrainer** (`model_trainer.py`):
  - Trains Random Forest model (n_estimators=100)
  - Evaluates model performance (accuracy, precision, recall, F1)
  - Saves trained models to disk with metadata (joblib)
  - Tracks training metrics in global state
- **InferenceEngine** (`inference_engine.py`):
  - Predicts probability distribution for 45 lottery numbers
  - Generates combinations using weighted sampling
  - Calculates confidence scores (20-75% range) based on Shannon entropy
  - Applies user preferences (include/exclude numbers)
- **AccuracyMonitor** (`accuracy_monitor.py`):
  - Tracks prediction results vs actual winning numbers
  - Calculates accuracy over recent 28 days
  - Determines model health status (good/warning/critical)
  - Triggers emergency retraining when accuracy < 50%
- **RetrainingScheduler** (`retraining_scheduler.py`):
  - Schedules weekly retraining (Tuesday midnight KST)
  - Executes complete retraining pipeline
  - Handles failures gracefully (preserves previous model)
  - Supports manual retraining triggers
- **ModelUtils** (`model_utils.py`):
  - Saves/loads ML models using joblib
  - Manages model file paths and directories
  - Finds latest model for inference
  - Stores model metadata as JSON

### Database Models
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
- **PublicRecommendation**: Public recommendation data for statistics
  - Fields: `draw_number`, `numbers` (INTEGER[]), `winning_rank`, `matched_count`, `bonus_number`
  - Status: `is_dummy` (boolean), `created_at` (timestamp)
  - Purpose: Statistics dashboard and dummy data generation

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
- **UnifiedAuthContext**: Integrated authentication context (replaced AdminAuthContext and UserAuthContext)
- **SocialLogin**: Kakao/Naver social authentication component
- **UserProfile**: User profile dropdown with account management
- **SaveRecommendation**: Component for saving lottery recommendations to user account

### Component Architecture Patterns
- **Index.ts Barrel Exports**: All components use index.ts for clean imports
- **TypeScript Strict Mode**: All components use strict TypeScript with proper typing
- **Hook-Based State Management**: Prefer custom hooks over class components
- **Responsive Design**: Tailwind CSS with mobile-first approach
- **Error Boundaries**: Production-ready error handling in critical components

## AI 추천 시스템
The recommendation engine uses a multi-factor analysis approach:
- **Frequency Analysis** (60% weight): Historical appearance frequency vs theoretical expectation
- **Trend Analysis** (40% weight): Recent hot/cold number patterns
- **Pattern Analysis**: Odd/even balance, number distribution, consecutive numbers, digit endings
- **Monte Carlo Generation**: Probabilistic combination generation based on calculated scores

## 데이터 플로우

### ML 기반 추천 플로우 (신규)
1. **Weekly Auto-Retrain** (Tuesday 00:00 KST):
   - APScheduler triggers RetrainingScheduler
   - Load latest draw data from PostgreSQL
   - Extract 145 features from historical data
   - Train Random Forest model (3-5 minutes)
   - Save model with metadata to disk
   - Update accuracy monitoring

2. **User Recommendation Request**:
   - Frontend sends recommendation request
   - Backend checks `use_ml_model` parameter
   - **ML Mode Path**:
     - Lazy-load ML model (first request only)
     - Prepare features from latest 100 draws
     - Predict probability distribution (45 numbers)
     - Generate combinations via weighted sampling
     - Calculate confidence scores (Shannon entropy)
     - Apply user preferences (include/exclude numbers)
     - Return combinations with 20-75% confidence
   - **Statistical Mode Path** (fallback):
     - Calculate frequency/trend scores
     - Monte Carlo sampling with weighted probabilities
     - Pattern analysis (odd/even, distribution, balance)
     - Return combinations with 15-65% confidence

3. **Accuracy Monitoring** (continuous):
   - Track predictions vs actual winning numbers
   - Calculate accuracy over 28 days
   - Check health status (good/warning/critical)
   - Trigger emergency retrain if accuracy < 50%

### 기존 데이터 플로우
1. **Auto-scraping**: Weekly data collection from `https://dhlottery.co.kr/gameResult.do?method=byWin`
2. **Analysis**: Statistical processing of historical data
3. **Recommendation**: AI-generated combinations with confidence scores
4. **Authentication**: Social login (Kakao/Naver) → JWT token → User session
5. **Presentation**: React frontend displays recommendations with save functionality for authenticated users