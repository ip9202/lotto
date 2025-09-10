# 데이터베이스 문서

## Database Schema Notes
- **Primary Keys**: `users.id` (INTEGER), `saved_recommendations.id` (INTEGER)
- **Foreign Keys**: `saved_recommendations.user_id` → `users.id`
- **Data Types**: 
  - `numbers`: INTEGER[] (PostgreSQL array)
  - `tags`: JSONB (PostgreSQL JSON)
  - `preferences`: JSONB
  - `analysis_data`: JSONB
- **Enum Values**: Use uppercase (KAKAO, NAVER, FREE, PREMIUM, PRO)
- **Indexes**: Created on `user_id`, `is_active`, `created_at` for performance

## Database Setup
If SQLAlchemy create_all fails, manually create tables:

### User authentication table (Updated schema)
```sql
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
```

### Saved recommendations table (Updated schema)
```sql
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

## Recent Database Schema Changes (2025-09-07)
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

## 추천번호 저장 시스템 구조

### 핵심 원칙
- **모든 데이터의 회차**: 추천 생성 시점의 회차로 통일
- **공공 데이터**: 추천 버튼 클릭 시 자동 저장
- **개인 데이터**: 저장 버튼 클릭 시 자동 저장
- **회차 정보**: 추천 생성 시점의 회차로 자동 설정

### 1. 공공 추천 데이터 (Public Data)
- **저장 시점**: 회원/비회원이 **추천 버튼**을 누르는 순간
- **용도**: 전체 통계, 시스템 당첨확률 분석
- **저장자**: 시스템 (자동)
- **회차 정보**: 추천 생성 시점의 회차 (자동)

### 공공 추천 데이터 테이블
```sql
CREATE TABLE public_recommendations (
    id SERIAL PRIMARY KEY,
    numbers INTEGER[] NOT NULL,
    generation_method VARCHAR(20) NOT NULL, -- 'ai' or 'manual'
    confidence_score DECIMAL(5,2),
    analysis_data JSONB,
    draw_number INTEGER NOT NULL, -- 추천 생성 시점의 회차
    created_at TIMESTAMP DEFAULT NOW(),
    user_type VARCHAR(10) NOT NULL -- 'member' or 'guest'
);
```

### 2. 개인 저장 데이터 (Personal Data)
- **저장 시점**: 회원이 **저장 버튼**을 누르는 순간
- **용도**: 개인 당첨 유무 확인
- **저장자**: 회원 (수동)
- **회차 정보**: 추천 생성 시점의 회차 (자동)