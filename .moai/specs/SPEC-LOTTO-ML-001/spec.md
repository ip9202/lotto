---
id: LOTTO-ML-001
version: 0.0.1
status: draft
created: 2025-11-02
updated: 2025-11-02
author: @ip9202
priority: high
category: feature
labels:
  - machine-learning
  - prediction
  - recommendation
scope:
  packages:
    - backend/app/services
    - backend/app/models
  files:
    - recommendation_engine.py
    - ml_predictor.py
    - model_trainer.py
---

# @SPEC:LOTTO-ML-001: 머신러닝 기반 예측 알고리즘 도입

## HISTORY

### v0.0.1 (2025-11-02)
- **INITIAL**: 머신러닝 기반 예측 알고리즘 도입 사양서 초안
- **AUTHOR**: @ip9202
- **SCOPE**: 로또번호 추천 정확도 향상을 위한 ML 모델 도입
- **CONTEXT**: 현재 정적 가중치 시스템의 한계 극복, 예측 정확도 30-40% 향상 목표

---

## 개요

현재 로또 번호 추천 시스템은 통계적 분석(출현 빈도, 최근 트렌드)에 기반한 정적 가중치 방식을 사용하고 있습니다. 이 시스템은 과거 데이터의 패턴을 단순 반영하는 수준에 그치며, 복잡한 상관관계나 숨겨진 패턴을 포착하지 못합니다.

본 SPEC은 scikit-learn 기반 머신러닝 모델을 도입하여 과거 1000회차 당첨 데이터를 학습하고, 번호별 출현 확률을 동적으로 계산하며, 조합별 신뢰도를 보다 정확하게 제공하는 시스템을 구축합니다.

**핵심 목표**:
- 예측 정확도 30-40% 향상
- 동적 모델 재학습을 통한 최신 트렌드 반영
- 신뢰도 기반 추천 제공 (20-75% 범위)

---

## Environment (환경 정의)

### 기술 스택
- **Backend**: Python 3.9+, FastAPI 0.104.1
- **Database**: PostgreSQL (기존 당첨 데이터 1000회차 이상)
- **ML Framework**: scikit-learn 1.3+ (필수), pandas, numpy
- **Optional**: TensorFlow 2.x (LSTM 모델 실험용)

### 데이터 환경
- **학습 데이터**: 과거 1000회차 로또 당첨 번호 (6개 번호 + 보너스 번호)
- **데이터 구조**: `Lotto` 모델 (draw_number, draw_date, numbers, bonus_number)
- **최소 학습 데이터**: 500회차 (500회차 미만 시 폴백 모드)

### 운영 환경
- **모델 저장 위치**: `/backend/app/models/ml/` 디렉토리
- **모델 파일 형식**: `.pkl` (scikit-learn joblib)
- **모델 버전 관리**: 파일명에 학습 날짜 포함 (`lotto_model_YYYYMMDD.pkl`)

### 성능 요구사항
- **학습 시간**: 5분 이내 (1000회차 데이터 기준)
- **추론 시간**: 1초 이내 (조합 5개 생성)
- **메모리 사용량**: 500MB 이하

---

## Assumptions (가정사항)

### 데이터 가정
1. **데이터 무결성**: 과거 당첨 데이터는 정확하고 누락이 없다고 가정
2. **데이터 접근성**: PostgreSQL 데이터베이스에 항상 접근 가능하다고 가정
3. **데이터 일관성**: 당첨 번호는 1-45 범위 내 정수이며, 중복 없이 6개 선택된다고 가정

### 모델 가정
1. **통계적 유의성**: 과거 패턴이 미래 당첨 번호에 일정 수준 영향을 미친다고 가정
2. **모델 수명**: 학습된 모델은 최소 1주일간 유효하다고 가정 (주 1회 재학습)
3. **확률적 접근**: 로또는 확률 게임이므로 100% 정확한 예측은 불가능하다고 가정

### 운영 가정
1. **리소스 가용성**: 모델 학습을 위한 CPU/메모리 리소스가 충분히 확보되어 있다고 가정
2. **백그라운드 작업**: 모델 재학습은 사용자 요청과 독립적으로 백그라운드에서 실행된다고 가정
3. **폴백 안정성**: ML 모델 실패 시 기존 통계 엔진이 정상 작동한다고 가정

---

## Requirements (요구사항)

### Ubiquitous Requirements (기본 기능)

#### UR-001: ML 모델 제공
**The system shall provide scikit-learn based machine learning model for lotto number prediction.**
- 시스템은 scikit-learn 기반 머신러닝 모델을 제공해야 한다
- 모델은 Random Forest, Gradient Boosting 등 앙상블 기법을 활용해야 한다
- 모델은 번호별 출현 확률을 0-1 범위로 출력해야 한다

#### UR-002: 과거 데이터 학습
**The system shall train the model using historical 1000 draw winning data.**
- 시스템은 과거 1000회차 당첨 데이터를 학습해야 한다
- 학습 데이터는 번호 출현 빈도, 번호 간 조합 패턴, 시간적 트렌드를 포함해야 한다
- 학습 데이터 전처리: 원-핫 인코딩, 정규화, 피처 엔지니어링 적용

#### UR-003: 동적 확률 계산
**The system shall dynamically calculate probability of each number appearance.**
- 시스템은 번호별 출현 확률을 동적으로 계산해야 한다
- 확률 계산은 최신 학습 모델을 기반으로 수행되어야 한다
- 45개 번호 각각에 대해 확률 벡터를 생성해야 한다

#### UR-004: 신뢰도 범위 제공
**The system shall provide confidence score between 20% and 75% for each combination.**
- 시스템은 조합별 신뢰도를 20-75% 범위로 제공해야 한다
- 신뢰도는 모델의 예측 확률, 과거 패턴 유사도, 통계적 균형도를 종합하여 계산되어야 한다
- 신뢰도는 소수점 첫째 자리까지 표시되어야 한다 (예: 63.2%)

---

### Event-driven Requirements (이벤트 기반 요구사항)

#### ED-001: 추천 요청 시 번호 생성
**WHEN a user requests a recommendation, the system shall generate number combinations using the trained model.**
- 사용자가 추천을 요청할 때, 시스템은 학습된 모델로 번호 조합을 생성해야 한다
- 생성된 조합은 모델 예측 확률 상위 번호를 기반으로 구성되어야 한다
- 사용자 선호도(포함/제외 번호)가 있을 경우 이를 반영해야 한다

#### ED-002: 신규 데이터 추가 시 재학습
**WHEN new winning data is added, the system shall retrain the model.**
- 새로운 당첨 데이터가 추가될 때, 시스템은 모델을 재학습해야 한다
- 재학습은 매주 화요일 자정(KST) 당첨 번호 발표 후 자동 실행되어야 한다
- 재학습 중에는 이전 모델을 사용하여 서비스가 중단되지 않아야 한다

#### ED-003: 정확도 하락 시 알림
**WHEN model accuracy falls below 70%, the system shall notify administrators.**
- 모델 정확도가 기준치(70%) 이하로 떨어질 때, 시스템은 관리자에게 알림을 보내야 한다
- 정확도는 최근 10회차 예측 결과 기준으로 측정되어야 한다
- 알림은 이메일 또는 Slack 웹훅을 통해 전송되어야 한다

---

### State-driven Requirements (상태 기반 요구사항)

#### SD-001: 학습 중 이전 모델 사용
**WHILE the model is training, the system shall provide recommendations using the previous model.**
- 모델 학습 중일 때, 시스템은 이전 모델로 추천을 제공해야 한다
- 이전 모델 파일은 새 모델이 정상 배포될 때까지 유지되어야 한다
- 학습 중임을 나타내는 상태 플래그가 설정되어야 한다

#### SD-002: 데이터 부족 시 폴백 모드
**WHILE training data is insufficient (less than 500 draws), the system shall use statistical fallback mode.**
- 학습 데이터가 부족할 때(500회차 미만), 시스템은 통계 기반 폴백 모드를 사용해야 한다
- 폴백 모드는 기존 `RecommendationEngine`의 통계적 가중치 방식을 사용해야 한다
- 폴백 모드 사용 중임을 로그에 기록해야 한다

---

### Optional Features (선택 기능)

#### OF-001: 모델 선택 옵션
**WHERE the user is an advanced user, the system may provide model selection options.**
- 고급 사용자를 위해, 시스템은 모델 선택 옵션을 제공할 수 있다
- 선택 가능한 모델: Random Forest, Gradient Boosting, XGBoost
- 각 모델의 정확도와 특성을 사용자에게 제공해야 한다

#### OF-002: 딥러닝 모델 (LSTM)
**WHERE sufficient data is available, the system may use deep learning model (LSTM).**
- 데이터가 충분할 경우(1500회차 이상), 시스템은 딥러닝 모델(LSTM)을 사용할 수 있다
- LSTM 모델은 시계열 패턴 학습을 통해 최근 트렌드를 더 정교하게 반영해야 한다
- LSTM 모델은 TensorFlow 2.x를 사용하여 구현되어야 한다

#### OF-003: 하이퍼파라미터 튜닝
**WHERE performance optimization is needed, the system may perform hyperparameter tuning.**
- 성능 최적화가 필요할 경우, 시스템은 하이퍼파라미터 튜닝을 수행할 수 있다
- 튜닝은 Grid Search 또는 Random Search 방식을 사용해야 한다
- 튜닝 결과는 모델 메타데이터 파일에 저장되어야 한다

---

### Unwanted Behaviors (피해야 할 동작)

#### UB-001: 학습 실패 시 자동 폴백
**WHEN model training fails, the system shall automatically fallback to statistical engine.**
- 모델 학습이 실패할 때, 시스템은 기존 통계 엔진으로 자동 폴백해야 한다
- 폴백 사유를 로그에 상세히 기록해야 한다 (에러 메시지, 스택 트레이스 포함)
- 관리자에게 학습 실패 알림을 즉시 전송해야 한다

#### UB-002: 추론 시간 초과 시 캐시 반환
**WHEN inference time exceeds 3 seconds, the system shall return cached results.**
- 추론 시간이 3초를 초과할 때, 시스템은 캐시된 결과를 반환해야 한다
- 캐시는 최근 10개 추천 조합을 메모리에 저장해야 한다
- 캐시 적중률을 모니터링하고 로그에 기록해야 한다

#### UB-003: 이상치 자동 제거
**WHEN training data contains outliers, the system shall automatically remove them.**
- 학습 데이터에 이상치가 있을 때, 시스템은 이를 자동으로 제거해야 한다
- 이상치 탐지: IQR(Interquartile Range) 방식 또는 Z-score 방식 사용
- 제거된 이상치 정보를 로그에 기록해야 한다 (회차, 번호 조합)

---

## Implementation Strategy (구현 전략)

### Phase 1: ML 인프라 구축 (우선순위: 최고)
1. **ML 모델 디렉토리 생성**: `backend/app/services/ml/` 구조 정의
2. **모델 클래스 구현**: `MLPredictor`, `ModelTrainer` 클래스 설계
3. **데이터 전처리 파이프라인**: 피처 엔지니어링, 정규화, 인코딩 구현
4. **모델 저장/로드 유틸리티**: joblib 기반 모델 직렬화/역직렬화

### Phase 2: 기본 ML 모델 구현 (우선순위: 최고)
1. **Random Forest 모델**: 앙상블 기반 기본 모델 구현
2. **학습 파이프라인**: 1000회차 데이터 학습, 교차 검증, 정확도 평가
3. **추론 API**: `predict_probabilities()`로 45개 번호 확률 벡터 반환
4. **신뢰도 계산 로직**: 모델 예측 확률 + 통계적 균형도 → 20-75% 신뢰도

### Phase 3: 기존 시스템 통합 (우선순위: 높음)
1. **RecommendationEngine 확장**: ML 모드와 통계 모드 전환 로직 추가
2. **폴백 메커니즘**: ML 실패 시 통계 엔진 자동 전환
3. **추천 API 수정**: `/api/recommendations` 엔드포인트에 ML 모드 파라미터 추가
4. **신뢰도 표시**: 프론트엔드에 신뢰도 UI 추가

### Phase 4: 자동 재학습 시스템 (우선순위: 중간)
1. **스케줄러 설정**: APScheduler로 매주 화요일 자정 재학습 작업 등록
2. **재학습 로직**: 신규 당첨 데이터 로드 → 모델 재학습 → 새 모델 배포
3. **모델 버전 관리**: 날짜 기반 모델 파일명, 이전 모델 백업
4. **정확도 모니터링**: 최근 10회차 예측 결과 추적, 70% 미만 시 알림

### Phase 5: 고급 기능 (우선순위: 낮음)
1. **모델 선택 UI**: 고급 사용자용 모델 선택 옵션 제공
2. **LSTM 모델 실험**: TensorFlow 기반 딥러닝 모델 구현 (데이터 1500회차 이상 시)
3. **하이퍼파라미터 튜닝**: Grid Search 자동화
4. **A/B 테스트**: ML 모드 vs 통계 모드 성능 비교

### 위험 요소 및 완화 전략
| 위험 요소 | 영향도 | 완화 전략 |
|---------|-------|---------|
| 모델 정확도 미달 | 높음 | 폴백 메커니즘, 정확도 모니터링, 앙상블 기법 적용 |
| 학습 시간 초과 | 중간 | 데이터 샘플링, 경량 모델 사용, 백그라운드 작업 |
| 메모리 부족 | 중간 | 모델 경량화, 증분 학습, 메모리 프로파일링 |
| 폴백 실패 | 높음 | 다중 폴백 레이어, 상태 검증, 에러 핸들링 강화 |

---

## Traceability (@TAG 체인)

### SPEC → TEST 연결
- @SPEC:LOTTO-ML-001 → @TEST:LOTTO-ML-001
  - 단위 테스트: 모델 학습, 추론, 신뢰도 계산
  - 통합 테스트: 추천 API, 폴백 메커니즘, 재학습 스케줄러
  - E2E 테스트: 사용자 추천 요청 → ML 모델 추론 → 결과 반환

### TEST → CODE 연결
- @TEST:LOTTO-ML-001 → @CODE:LOTTO-ML-001
  - `backend/app/services/ml/ml_predictor.py`: ML 예측 로직
  - `backend/app/services/ml/model_trainer.py`: 모델 학습 로직
  - `backend/app/services/recommendation_engine.py`: ML 모드 통합

### CODE → DOC 연결
- @CODE:LOTTO-ML-001 → @DOC:LOTTO-ML-001
  - API 문서: `/api/recommendations` 엔드포인트 ML 모드 파라미터
  - 아키텍처 문서: ML 모듈 구조, 데이터 흐름도
  - 운영 가이드: 모델 재학습, 정확도 모니터링, 폴백 절차

---

## References

### 기술 문서
- scikit-learn Documentation: https://scikit-learn.org/stable/
- TensorFlow LSTM Guide: https://www.tensorflow.org/guide/keras/rnn
- FastAPI Background Tasks: https://fastapi.tiangolo.com/tutorial/background-tasks/

### 프로젝트 문서
- `.moai/project/product.md`: 제품 비전, 핵심 가치
- `.moai/project/structure.md`: 아키텍처 설계, 모듈 구조
- `.moai/project/tech.md`: 기술 스택, 품질 게이트

### 관련 SPEC
- (추후 추가 예정: 예측 정확도 평가 SPEC, 모델 배포 자동화 SPEC)

---

**문서 상태**: Draft (v0.0.1)
**마지막 검토**: 2025-11-02
**다음 리뷰 예정**: 구현 계획 수립 후 (Phase 1 착수 전)
