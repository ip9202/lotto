---
id: LOTTO-ML-PREPROCESS-001
version: 1.0.0
status: implemented
created: 2025-11-03
updated: 2025-11-03
author: @ip9202
priority: high
category: component
labels:
  - data-preprocessing
  - feature-engineering
  - machine-learning
parent_spec: LOTTO-ML-001
scope:
  packages:
    - backend/app/services/ml
  files:
    - data_preprocessor.py
---

# @SPEC:LOTTO-ML-PREPROCESS-001: ML 데이터 전처리 파이프라인

## HISTORY

### v1.0.0 (2025-11-03)
- **IMPLEMENTED**: ML 데이터 전처리 파이프라인 구현 완료
- **AUTHOR**: @ip9202
- **PARENT**: @SPEC:LOTTO-ML-001 (머신러닝 기반 예측 알고리즘)
- **SCOPE**: 로또 당첨 데이터 로드, 피처 추출, 데이터 품질 검증
- **CONTEXT**: ML 모델 학습을 위한 데이터 전처리 및 피처 엔지니어링

---

## 개요

ML 모델 학습의 첫 단계로, PostgreSQL 데이터베이스에서 로또 당첨 데이터를 로드하고 ML 피처로 변환하는 전처리 파이프라인입니다.

**핵심 기능**:
- PostgreSQL에서 로또 당첨 데이터 로드
- 145개 피처 추출 (빈도 45개 + 트렌드 45개 + 상관관계 45개 + 통계 10개)
- 데이터 품질 검증 (결측치, 범위, 중복 체크)
- Train/Test 분할 (80/20)

---

## Requirements (요구사항)

### Ubiquitous Requirements (기본 기능)

#### UR-001: 데이터 로드
**The system shall load lottery draw data from PostgreSQL database.**
- PostgreSQL에서 로또 당첨 데이터를 DataFrame으로 로드해야 한다
- 컬럼: draw_number, draw_date, number_1~6, bonus_number, first_winners, first_amount
- 회차 번호 오름차순 정렬

#### UR-002: 피처 추출
**The system shall extract 145 ML features from draw data.**
- 빈도 피처 (45개): 각 번호(1-45)의 출현 빈도 비율
- 트렌드 피처 (45개): 최근 20회차 기준 출현 트렌드
- 상관관계 피처 (45개): 번호 간 동시 출현 패턴
- 통계 피처 (10개): 평균, 표준편차, 구간분포, 홀짝비율 등

#### UR-003: 데이터 품질 검증
**The system shall validate data quality and detect issues.**
- 결측치 검사 (missing values)
- 번호 범위 검사 (1-45 범위 확인)
- 중복 회차 검사
- 검증 실패 시 상세 리포트 반환

#### UR-004: Train/Test 분할
**The system shall split data into train/test sets (80/20 ratio).**
- scikit-learn의 train_test_split 사용
- test_size=0.2 (20% 테스트 데이터)
- random_state=42 (재현성 보장)

---

### State-driven Requirements (상태 기반 요구사항)

#### SD-001: 빈 데이터 처리
**WHILE data is empty, the system shall return empty DataFrame.**
- 데이터가 없을 경우 빈 DataFrame 반환
- 에러를 발생시키지 않고 안전하게 처리

#### SD-002: 첫 회차 기본값
**WHILE processing first draw, the system shall use default feature values.**
- 첫 회차는 이전 데이터가 없으므로 기본값 사용
- 통계 피처: 이론적 평균 23, 표준편차 0, 구간분포 33% 등

---

### Unwanted Behaviors (피해야 할 동작)

#### UB-001: 이상치 자동 제거 금지
**The system shall NOT automatically remove outliers without logging.**
- 이상치 발견 시 자동 제거하지 않고 로그에 기록만 해야 한다
- 데이터 무결성 보장을 위해 원본 데이터 유지

#### UB-002: 메모리 초과 방지
**WHEN data exceeds 10,000 draws, the system shall use chunked processing.**
- 데이터가 10,000회차를 초과할 경우 청크 단위 처리
- 메모리 사용량 500MB 이하 유지

---

## Implementation Details (구현 세부사항)

### 구현된 함수

1. **load_draw_data(db_session)** - 데이터 로드
   - SQLAlchemy 세션으로 LottoDraw 모델 쿼리
   - 회차 번호 오름차순 정렬
   - 반환: pandas DataFrame

2. **extract_features(draw_data)** - 피처 추출
   - 각 회차별 145개 피처 계산
   - 히스토리 데이터 기반 누적 계산
   - 반환: 피처 DataFrame (rows=회차 수, cols=145)

3. **prepare_train_test_split(features, test_size=0.2, random_state=42)** - 데이터 분할
   - scikit-learn train_test_split 래핑
   - 반환: (X_train, X_test, y_train, y_test)

4. **validate_data_quality(data)** - 데이터 검증
   - 결측치, 범위, 중복 체크
   - 반환: (is_valid: bool, report: dict)

5. **prepare_features_for_inference(db_session)** - 추론용 피처 준비
   - 최근 100회차 로드
   - 최신 피처 벡터 추출 (shape: (1, 45))
   - 정규화 (확률 분포로 변환)

### 데이터 구조

```python
# 로드된 데이터 DataFrame
draw_data = pd.DataFrame({
    'draw_number': [1, 2, 3, ...],
    'draw_date': ['2025-01-01', ...],
    'number_1': [3, 7, 12, ...],
    'number_2': [8, 15, 23, ...],
    # ... number_3 ~ number_6
    'bonus_number': [21, 34, 45, ...],
    'first_winners': [4, 2, 8, ...],
    'first_amount': [2000000000, ...]
})

# 피처 DataFrame
features = pd.DataFrame({
    'freq_1': [0.95, 1.02, ...],
    'freq_2': [0.88, 0.91, ...],
    # ... freq_3 ~ freq_45
    'trend_1': [0.05, 0.10, ...],
    # ... trend_2 ~ trend_45
    'co_occur_1': [0.12, 0.15, ...],
    # ... co_occur_2 ~ co_occur_45
    'stat_mean': [23.2, 22.8, ...],
    'stat_std': [12.5, 13.1, ...],
    # ... 통계 피처 10개
})
```

---

## Traceability (@TAG 체인)

### SPEC → CODE 연결
- @SPEC:LOTTO-ML-PREPROCESS-001 → @CODE:LOTTO-ML-PREPROCESS-001
  - `backend/app/services/ml/data_preprocessor.py`: 전체 전처리 파이프라인

### CODE → TEST 연결
- @CODE:LOTTO-ML-PREPROCESS-001 → @TEST:LOTTO-ML-PREPROCESS-001
  - `tests/services/ml/test_data_preprocessor.py`: 데이터 로드, 피처 추출, 검증 테스트

### CODE → DOC 연결
- @CODE:LOTTO-ML-PREPROCESS-001 → @DOC:LOTTO-ML-PREPROCESS-001
  - `docs/ML_ENGINE.md`: 피처 엔지니어링 섹션
  - `docs/ML_OPERATIONS.md`: 데이터 품질 관리 섹션

---

## References

### 기술 문서
- pandas DataFrame API: https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.html
- scikit-learn train_test_split: https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.train_test_split.html

### 관련 SPEC
- @SPEC:LOTTO-ML-001: 머신러닝 기반 예측 알고리즘 (부모 SPEC)
- @SPEC:LOTTO-ML-MODEL-001: 모델 학습 (다음 단계)

---

**문서 상태**: Implemented (v1.0.0)
**구현 완료일**: 2025-11-02
**마지막 검증**: 2025-11-03
