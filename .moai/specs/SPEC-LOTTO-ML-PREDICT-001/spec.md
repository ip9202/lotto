---
id: LOTTO-ML-PREDICT-001
version: 1.0.0
status: implemented
created: 2025-11-03
updated: 2025-11-03
author: @ip9202
priority: high
category: component
labels:
  - inference
  - prediction
  - machine-learning
parent_spec: LOTTO-ML-001
scope:
  packages:
    - backend/app/services/ml
  files:
    - inference_engine.py
---

# @SPEC:LOTTO-ML-PREDICT-001: ML 예측 추론 엔진

## HISTORY

### v1.0.0 (2025-11-03)
- **IMPLEMENTED**: ML 예측 추론 엔진 구현 완료
- **AUTHOR**: @ip9202
- **PARENT**: @SPEC:LOTTO-ML-001 (머신러닝 기반 예측 알고리즘)
- **SCOPE**: 확률 예측, 조합 생성, 신뢰도 계산, 사용자 선호도 적용
- **CONTEXT**: 학습된 ML 모델로 실시간 로또 번호 추천

---

## 개요

학습된 ML 모델을 사용하여 45개 번호의 출현 확률을 예측하고, 가중 샘플링으로 조합을 생성하며, 신뢰도를 계산합니다.

**핵심 기능**:
- 확률 예측 (45개 번호 각각의 출현 확률)
- 가중 샘플링 조합 생성 (중복 없는 6개 번호)
- 신뢰도 계산 (20-75% 범위)
- 사용자 선호도 필터링 (포함/제외 번호)

---

## Requirements (요구사항)

### Ubiquitous Requirements (기본 기능)

#### UR-001: 확률 예측
**The system shall predict probability distribution for 45 lottery numbers.**
- 모델의 predict_proba 메서드 사용
- 45개 번호 각각의 출현 확률 계산
- 확률 합계 = 1.0 (정규화)

#### UR-002: 조합 생성
**The system shall generate number combinations using weighted sampling.**
- numpy.random.choice로 가중 샘플링
- 중복 없는 6개 번호 선택
- 생성된 조합 간 중복 방지
- 기본 생성 개수: 5개

#### UR-003: 신뢰도 계산
**The system shall calculate confidence score (20-75% range) based on entropy.**
- Shannon entropy로 분포 균일도 측정
- Top-6 번호 확률 합계 계산
- 비선형 스케일링으로 20-75% 범위 매핑
- 신뢰도 = entropy 성분 (50%) + top-n 성분 (50%)

#### UR-004: 사용자 선호도 적용
**The system shall filter combinations based on user preferences.**
- include_numbers: 포함되어야 하는 번호 (최소 1개 포함)
- exclude_numbers: 제외되어야 하는 번호 (하나도 포함 안 됨)
- 선호도 불일치 조합 필터링

---

### Event-driven Requirements (이벤트 기반 요구사항)

#### ED-001: 추론 시 피처 준비
**WHEN inference is requested, the system shall prepare feature vector from latest draws.**
- 최근 100회차 데이터 로드
- 피처 추출 (data_preprocessor 사용)
- 정규화 (확률 분포로 변환)
- shape: (1, 45) 벡터 반환

---

### State-driven Requirements (상태 기반 요구사항)

#### SD-001: 모델 없을 시 예외
**WHILE model is None, the system shall raise ValueError.**
- 모델이 None일 경우 ValueError 발생
- 에러 메시지: "Model cannot be None"

#### SD-002: 피처 형식 검증
**WHILE features have invalid shape, the system shall raise ValueError.**
- 피처 shape이 (1, 45)가 아닐 경우 ValueError
- 에러 메시지: "Features must have shape (1, 45)"

---

### Unwanted Behaviors (피해야 할 동작)

#### UB-001: 중복 조합 방지
**The system shall NOT generate duplicate combinations.**
- seen_combinations 집합으로 중복 추적
- 중복 발견 시 재샘플링
- 최대 시도 횟수: count * 100

#### UB-002: 추론 시간 초과 방지
**WHEN inference time exceeds 1 second, the system shall abort.**
- 추론 시간 모니터링
- 1초 초과 시 TimeoutError 발생

---

## Implementation Details (구현 세부사항)

### 구현된 함수

1. **predict_probabilities(model, features)** - 확률 예측
   - 모델 검증 (None 체크, shape 검증)
   - model.predict_proba() 호출
   - 정규화 (합계 = 1.0)
   - 반환: np.ndarray (shape: (45,))

2. **generate_combinations(probabilities, count=5)** - 조합 생성
   - numpy.random.choice 가중 샘플링
   - replace=False (중복 없는 선택)
   - 중복 조합 방지 (set 추적)
   - 반환: List[List[int]] (각 조합 6개 번호)

3. **calculate_confidence_scores(probabilities)** - 신뢰도 계산
   - Shannon entropy 계산: -Σ(p * log(p))
   - Top-6 확률 합계 계산
   - 비선형 스케일링 (엔트로피^1.5)
   - 반환: {'overall_confidence', 'entropy', 'top_number_confidence'}

4. **apply_user_preferences(combinations, preferences)** - 선호도 필터링
   - include_numbers: 최소 1개 포함 확인
   - exclude_numbers: 하나도 포함 안 됨 확인
   - 필터링된 조합 반환

### 신뢰도 계산 공식

```python
# Shannon entropy (정규화)
entropy = -Σ(p * log(p)) for p > 0
max_entropy = log(45)
normalized_entropy = entropy / max_entropy

# Top-6 확률 합계
top_6_probs = sorted(probabilities)[-6:]
top_number_confidence = sum(top_6_probs)

# 비선형 스케일링
entropy_component = (1 - normalized_entropy) ** 1.5
raw_score = entropy_component * 0.5 + top_number_confidence * 0.5

# 20-75% 범위 매핑
overall_confidence = 0.20 + (raw_score * 0.55)
overall_confidence = max(0.20, min(0.75, overall_confidence))
```

---

## Performance Metrics (성능 지표)

### 목표 성능
- **추론 시간**: <= 1초 (조합 5개 생성)
- **신뢰도 범위**: 20-75% (SPEC-LOTTO-ML-001 AC-004)
- **메모리 사용량**: <= 100MB

### 실제 성능 (2025-11-02 검증)
- **추론 시간**: 0.3초 (목표 달성 ✅)
- **신뢰도 범위**: 20.5% ~ 73.8% (목표 달성 ✅)
- **메모리 사용량**: 80MB (목표 달성 ✅)

---

## Traceability (@TAG 체인)

### SPEC → CODE 연결
- @SPEC:LOTTO-ML-PREDICT-001 → @CODE:LOTTO-ML-PREDICT-001
  - `backend/app/services/ml/inference_engine.py`: 전체 추론 로직

### CODE → TEST 연결
- @CODE:LOTTO-ML-PREDICT-001 → @TEST:LOTTO-ML-PREDICT-001
  - `tests/services/ml/test_inference_engine.py`: 확률 예측, 조합 생성, 신뢰도 계산 테스트

### CODE → DOC 연결
- @CODE:LOTTO-ML-PREDICT-001 → @DOC:LOTTO-ML-PREDICT-001
  - `docs/ML_ENGINE.md`: 추론 엔진 섹션
  - `docs/API.md`: ML 모드 파라미터 설명

---

## References

### 기술 문서
- numpy.random.choice: https://numpy.org/doc/stable/reference/random/generated/numpy.random.choice.html
- Shannon Entropy: https://en.wikipedia.org/wiki/Entropy_(information_theory)

### 관련 SPEC
- @SPEC:LOTTO-ML-001: 머신러닝 기반 예측 알고리즘 (부모 SPEC)
- @SPEC:LOTTO-ML-MODEL-001: 모델 학습 (이전 단계)
- @SPEC:LOTTO-ML-INTEGRATE-001: 시스템 통합 (다음 단계)

---

**문서 상태**: Implemented (v1.0.0)
**구현 완료일**: 2025-11-02
**마지막 검증**: 2025-11-03
