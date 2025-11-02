# 🎯 로또리아 AI - 인공지능 로또 번호 예측 서비스

[![Status](https://img.shields.io/badge/Status-🚀%20프로덕션%20배포%20완료-brightgreen)](https://lottoria.ai.kr)
[![Python](https://img.shields.io/badge/Python-3.12-blue)](https://python.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green)](https://fastapi.tiangolo.com)

**AI 머신러닝으로 로또 당첨번호를 분석하고 예측하는 로또리아. 과거 데이터 기반 통계 분석과 패턴 인식으로 더 스마트한 로또 번호 선택을 도와드립니다!** 🍀

**🌐 라이브 서비스**: https://lottoria.ai.kr

## 🐳 빠른 시작

```bash
# 1. Docker Desktop 설치 및 실행
# https://www.docker.com/products/docker-desktop/

# 2. 프로젝트 클론
git clone https://github.com/your-username/lotto.git
cd lotto

# 3. 모든 서비스 시작 (PostgreSQL + Backend + Frontend)
docker-compose up -d

# 4. 브라우저에서 접속
# 프론트엔드: http://localhost:5173
# 백엔드 API: http://localhost:8000/docs
# 관리자: http://localhost:5173/admin
```

## ✨ 주요 기능

### 🤖 AI 추천 엔진
- **종합 분석**: 출현 빈도, 트렌드, 간격, 패턴, 균형 등 6가지 요소 종합 분석
- **신뢰도 점수**: 0.0 ~ 1.0 범위의 정확한 AI 신뢰도 제공
- **개인화 추천**: 포함/제외 번호 설정을 반영한 맞춤형 추천

### 🔐 통합 인증 시스템
- **소셜 로그인**: 카카오/네이버 OAuth 2.0 로그인
- **계정 관리**: 이메일 회원가입, 비밀번호 변경, 소셜 계정 연결
- **권한 기반 접근**: 사용자/관리자 역할 구분

### 📊 번호 저장 및 당첨 비교
- **번호 저장**: 주간 한도 내에서 추천번호 개인 보관
- **자동 당첨 비교**: 매주 당첨번호 발표 후 자동 비교
- **당첨 통계**: 개인별 당첨률, 총 당첨금, 최고 등수 통계

### 📈 통계 대시보드
- **사용자 통계**: 추천 수, 당첨 수, 당첨률 실시간 표시
- **번호 분석**: 핫/콜드 넘버, 출현 빈도 차트
- **성과 분석**: 등수별 당첨 분포, 시간별 활동 패턴

## 🏗️ 기술 스택

### Backend
- **FastAPI**: Python 웹 프레임워크
- **SQLAlchemy**: PostgreSQL ORM
- **APScheduler**: 백그라운드 작업 스케줄링
- **OAuth2**: 소셜 로그인 인증
- **scikit-learn**: ML 기반 예측 모델 학습 및 추론

### Machine Learning
- **Random Forest**: 앙상블 기반 번호 출현 확률 예측
- **Feature Engineering**: 145개 피처 추출 (빈도, 트렌드, 상관관계, 통계)
- **Automated Retraining**: 매주 화요일 자정 자동 모델 재학습
- **Accuracy Monitoring**: 실시간 모델 성능 추적 및 긴급 재학습 트리거

### Frontend
- **React 18**: TypeScript 기반 현대적 UI
- **Tailwind CSS**: 유틸리티 퍼스트 CSS
- **Recharts**: 인터랙티브 차트 라이브러리

### Infrastructure
- **Docker**: 컨테이너화된 개발/배포 환경
- **Railway**: 클라우드 호스팅 플랫폼
- **PostgreSQL**: 관계형 데이터베이스

## 🔧 개발 환경

### 필수 요구사항
- **Docker Desktop** (필수)
- **Git** (코드 관리용)
- **모던 브라우저** (Chrome, Firefox, Safari)

### 개발 명령어
```bash
# 서비스 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f [service_name]

# 서비스 재시작
docker-compose restart

# 서비스 중지
docker-compose down
```

## 📚 API 문서

### 주요 엔드포인트
- **추천 생성**: `POST /api/v1/recommendations/generate`
- **최신 당첨번호**: `GET /api/v1/lotto/latest`
- **통계 정보**: `GET /api/v1/lotto/statistics`
- **저장된 번호**: `GET /api/v1/saved-recommendations`

### API 문서 접속
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🎯 AI 분석 알고리즘

### 🤖 ML 기반 예측 모드 (신규)
scikit-learn Random Forest 모델을 사용한 머신러닝 기반 번호 추천 시스템

#### 모델 학습 파이프라인
- **학습 데이터**: 과거 1000회차 로또 당첨 번호
- **피처 추출**: 145개 피처 (빈도 45개 + 트렌드 45개 + 상관관계 45개 + 통계 10개)
- **모델**: Random Forest Classifier (n_estimators=100)
- **성능**: 정확도 75% (목표 70% 달성 ✅)

#### 추론 프로세스
1. **확률 예측**: 45개 번호 각각의 출현 확률 계산
2. **가중 샘플링**: 확률 기반 조합 생성 (중복 없는 6개 번호)
3. **신뢰도 계산**: Shannon entropy 기반 20-75% 범위 신뢰도 제공
4. **사용자 선호도 적용**: 포함/제외 번호 필터링

#### 자동 재학습 시스템
- **스케줄**: 매주 화요일 자정(KST) 자동 실행
- **모니터링**: 실시간 정확도 추적 (최근 28일 기준)
- **긴급 재학습**: 정확도 < 50% 시 자동 트리거
- **폴백 메커니즘**: ML 실패 시 통계 모드로 자동 전환

---

### 📊 통계 기반 추천 모드 (기존)

#### 개별 번호 분석 (40%)
- **출현 빈도**: 실제 vs 이론적 기댓값 비교
- **최근 트렌드**: HOT/COLD 번호 분석
- **번호 간격**: 마지막 출현 이후 경과 회차

#### 조합 패턴 분석 (35%)
- **홀짝 균형**: 3:3이 가장 이상적
- **구간 분포**: 1-15, 16-30, 31-45 균등 분포
- **연속 번호**: 연속 번호 최소화
- **끝자리 분포**: 0-9 끝자리 다양성

#### 통계적 균형 분석 (25%)
- **평균값 편차**: 이론적 평균(23)과의 차이 최소화
- **분산 점수**: 적정 분산 유지 (50-200)
- **극값 분포**: 적정 범위 유지 (20-35)

## 🚀 현재 상태

### ✅ 완료된 기능들
- **소셜 로그인**: 카카오/네이버 OAuth 인증 완료
- **번호 저장 시스템**: 개인별 추천번호 저장 및 관리
- **자동 당첨 비교**: 매주 당첨번호 자동 비교 및 통계
- **통계 대시보드**: 실시간 성과 분석 및 차트
- **관리자 시스템**: 사용자 관리 및 데이터 업데이트
- **구매기간 자동 관리**: 회차별 구매기간 자동 계산
- **모바일 최적화**: 반응형 디자인 완료
- **스케줄러 안정화**: 자동 업데이트 시스템 완전 정상화 (2025-09-20)
- **자동 업데이트 시스템 대폭 개선**: 에러 처리, 재시도 메커니즘, 스케줄러 안정성 강화 (2025-09-28)
- **관리 API 추가**: 수동 업데이트, 스케줄러 상태 확인, 재시작 기능 (2025-09-28)
- **ML 기반 추천 엔진**: scikit-learn Random Forest 모델 통합 (2025-11-02)
  - 145개 피처 추출 및 자동 학습 파이프라인
  - 매주 화요일 자정 자동 재학습 스케줄러
  - 실시간 정확도 모니터링 및 긴급 재학습 트리거
  - 통계 모드 자동 폴백 메커니즘

### 🔧 최신 개선사항 (2025-09-28)
- **자동 업데이트 시스템 대폭 개선**: 
  - 강화된 에러 처리 및 상세한 로깅
  - 전체 프로세스 3회 재시도 메커니즘
  - 개별 회차 스크래핑 3회 재시도 (점진적 대기)
  - 스케줄러 안정성 개선 (동시 실행 방지, 누적 작업 합치기)
  - DB 세션 관리 개선 (메모리 누수 방지)
- **새로운 관리 API**:
  - `POST /admin/manual-update`: 수동 업데이트 실행
  - `GET /admin/scheduler-status`: 스케줄러 상태 확인
  - `POST /admin/restart-scheduler`: 스케줄러 재시작
  - `GET /admin/check-latest-data`: 데이터 상태 확인
- **1191회차 업데이트 문제 해결**: 실서버 업데이트 실패 원인 분석 및 수정

### 🎯 개발 예정
- **모바일 앱**: React Native 기반 iOS/Android 앱 개발
- **유료 서비스**: 프리미엄 기능 및 결제 시스템
- **PWA 기능**: 앱 설치 및 오프라인 지원
- **고급 분석**: AI 기반 패턴 분석 고도화

## 📱 모바일 앱 개발

### 현재 진행 상황
- **PRD 완성**: 제품 요구사항 문서 작성 완료
- **개발 계획**: 4주 개발 계획서 작성 완료
- **디자인 가이드**: 2025년 모던·그레이 중심 UI 가이드 완성
- **기술 스택**: React Native + TypeScript + 기존 백엔드 API 공유

### 모바일 앱 문서
- [`docs/mobile-app/`](./docs/mobile-app/) - 모바일 앱 관련 모든 문서
- [`PRD`](./docs/mobile-app/PRD_LottoAI_Mobile_App.md) - 제품 요구사항
- [`개발계획서`](./docs/mobile-app/MOBILE_APP_DEVELOPMENT_PLAN.md) - 상세 개발 계획
- [`디자인가이드`](./docs/mobile-app/LOTTO_APP_DESIGN_GUIDE.md) - UI/UX 디자인 가이드

## 🚨 문제 해결

### Docker 관련
```bash
# Docker Desktop 재시작
# 포트 충돌 확인
lsof -i :5432  # PostgreSQL
lsof -i :8000  # Backend
lsof -i :5173  # Frontend

# 컨테이너 재시작
docker-compose down && docker-compose up -d
```

### 데이터베이스
```bash
# PostgreSQL 연결 테스트
docker exec lotto_postgres psql -U lotto_user -d lotto_db -c "SELECT COUNT(*) FROM lotto_draws;"
```

## 🤝 기여하기

1. Fork the Project
2. Create Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit Changes (`git commit -m 'Add AmazingFeature'`)
4. Push to Branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

**⭐ 이 프로젝트가 도움이 되었다면 스타를 눌러주세요!**