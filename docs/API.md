# API 문서

## API Architecture
- **RESTful API** with FastAPI
- **Standardized response format**: `{"success": bool, "data": any, "message": str, "error": object}`

## 주요 API 엔드포인트 (총 22개 API)

### 추천 시스템
- `POST /api/v1/recommendations/generate` - AI 추천 생성
  - **Request Body**:
    ```json
    {
      "count": 5,
      "preferences": {
        "include_numbers": [7, 23],
        "exclude_numbers": [13, 39]
      },
      "use_ml_model": true  // ML 모드 활성화 (기본값: false)
    }
    ```
  - **Response**:
    ```json
    {
      "success": true,
      "data": {
        "combinations": [
          {
            "numbers": [3, 12, 23, 31, 38, 45],
            "confidence_score": 0.632,  // ML 모드: 0.20-0.75 / 통계 모드: 0.15-0.65
            "analysis": {
              "odd_even_ratio": "3:3",
              "distribution": [2, 2, 2],
              "consecutive_count": 0
            }
          }
        ],
        "mode": "ml"  // "ml" 또는 "statistical"
      }
    }
    ```
  - **ML 모드 파라미터**:
    - `use_ml_model`: true → ML 추론 엔진 사용, false → 통계 분석 사용 (기본값)
    - **ML 모드 특징**:
      - Random Forest 모델로 45개 번호 출현 확률 예측
      - Shannon entropy 기반 신뢰도 계산 (20-75% 범위)
      - 145개 피처 기반 예측 (빈도, 트렌드, 상관관계, 통계)
      - 자동 폴백: ML 실패 시 통계 모드로 전환
    - **통계 모드 특징**:
      - 기존 Monte Carlo 샘플링 + 가중치 기반 조합 생성
      - 패턴 분석 기반 신뢰도 계산 (15-65% 범위)
      - 출현 빈도(60%) + 최근 트렌드(40%) 가중치

### 로또 데이터
- `GET /api/v1/lotto/latest` - 최신 로또 데이터
- `GET /api/v1/lotto/statistics` - 로또 통계 정보
- `GET /api/v1/lotto/draw/{draw_number}` - 당첨번호 조회

### 통합 인증
- `POST /api/v1/auth/register/email` - 이메일 회원가입
- `POST /api/v1/auth/login/email` - 이메일 로그인
- `POST /api/v1/auth/login/social` - 소셜 로그인 (카카오/네이버)
- `POST /api/v1/auth/link/social` - 소셜 계정 연결
- `GET /api/v1/auth/me` - 현재 사용자 정보
- `GET /api/v1/auth/profile` - 사용자 프로필 및 통계
- `POST /api/v1/auth/change-password` - 비밀번호 변경
- `POST /api/v1/auth/check-kakao-user` - 카카오 사용자 확인

### 관리자
- `GET /api/v1/auth/admin/users` - 사용자 관리
- `PUT /api/v1/auth/admin/update-role` - 사용자 권한 관리

### 추천번호 관리
- `POST /api/v1/saved-recommendations` - 추천번호 저장
- `GET /api/v1/saved-recommendations` - 저장된 추천번호 목록
- `PUT /api/v1/saved-recommendations/{id}` - 추천번호 수정
- `DELETE /api/v1/saved-recommendations/{id}` - 추천번호 삭제
- `GET /api/v1/saved-recommendations/stats/summary` - 추천번호 통계
- `POST /api/v1/saved-recommendations/check-winning` - 당첨 결과 확인

### 관리자 대시보드
- `GET /admin/*` - 관리자 기능
- `POST /admin/dummy-recommendations/generate` - 더미 데이터 생성
- `GET /admin/dummy-recommendations/stats` - 더미 데이터 통계

### 공공 추천 데이터
- `GET /api/v1/winning-comparison/public/{draw_number}` - 공공 추천 데이터 비교
- `GET /api/v1/winning-comparison/public/{draw_number}/stats` - 공공 추천 통계

## 당첨 비교 API
- **Endpoint**: `POST /api/v1/saved-recommendations/check-winning`
- **Parameters**: `draw_number`, `winning_numbers[]`, `bonus_number`
- **Features**: Automatic rank calculation (1st-5th place), prize amount calculation
- **Database Updates**: `is_checked`, `matched_count`, `matched_numbers`, `winning_rank`, `winning_amount`
- **User Stats**: Automatic update of `total_wins` and `total_winnings`

### 당첨 순위 시스템
- 1st Place: 6 numbers match
- 2nd Place: 5 numbers + bonus number
- 3rd Place: 5 numbers match
- 4th Place: 4 numbers match
- 5th Place: 3 numbers match

### Prize Amounts (Example)
- 1st: 2B won, 2nd: 50M won, 3rd: 1.5M won, 4th: 50K won, 5th: 5K won