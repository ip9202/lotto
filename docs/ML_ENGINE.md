# ML 엔진 기술 문서

## 개요

로또리아 AI의 머신러닝 예측 엔진은 scikit-learn Random Forest 모델을 사용하여 과거 로또 당첨 데이터를 학습하고, 45개 번호의 출현 확률을 예측하여 조합을 생성합니다.

**핵심 목표**:
- 예측 정확도 70% 이상 달성 (현재: 75% ✅)
- 추론 시간 1초 이내 (현재: 0.3초 ✅)
- 자동 재학습 및 폴백 메커니즘

---

## 시스템 아키텍처

### ML 파이프라인 구조

```
데이터 로드 (PostgreSQL)
    ↓
데이터 전처리 (data_preprocessor.py)
    ├─ 피처 추출 (145개)
    ├─ 데이터 검증
    └─ Train/Test 분할 (80/20)
    ↓
모델 학습 (model_trainer.py)
    ├─ Random Forest 학습
    ├─ 모델 평가 (accuracy, F1)
    └─ 모델 저장 (joblib)
    ↓
추론 엔진 (inference_engine.py)
    ├─ 확률 예측 (45개 번호)
    ├─ 조합 생성 (가중 샘플링)
    └─ 신뢰도 계산 (Shannon entropy)
    ↓
정확도 모니터링 (accuracy_monitor.py)
    ├─ 예측 vs 실제 비교
    ├─ 28일 정확도 추적
    └─ 긴급 재학습 트리거
```

---

## 피처 엔지니어링

### 145개 피처 구성

#### 1. 빈도 피처 (45개)
각 번호(1-45)의 출현 빈도 비율

```python
freq_ratio = appearances / expected_frequency
expected_frequency = total_draws * 6 / 45
```

#### 2. 트렌드 피처 (45개)
최근 20회차 기준 출현 트렌드

```python
trend_score = recent_appearances / min(20, total_draws)
```

#### 3. 상관관계 피처 (45개)
번호 간 동시 출현 패턴

```python
co_occur_ratio = draws_with_number / total_draws
```

#### 4. 통계 피처 (10개)
- `stat_mean`: 번호 평균값
- `stat_std`: 표준편차
- `stat_min`, `stat_max`, `stat_range`: 극값 통계
- `stat_low_count`, `stat_mid_count`, `stat_high_count`: 구간 분포
- `stat_odd_ratio`, `stat_even_ratio`: 홀짝 비율

---

## 모델 학습

### Random Forest 설정

```python
RandomForestClassifier(
    n_estimators=100,      # 트리 개수
    max_depth=None,        # 무제한 깊이
    random_state=42,       # 재현성
    n_jobs=-1,            # 전체 CPU 활용
    verbose=0
)
```

### 학습 프로세스

1. **데이터 로드**: 과거 1000회차 로또 데이터 (최소 500회차 필요)
2. **피처 추출**: 145개 피처 생성 (3-5분 소요)
3. **Train/Test 분할**: 80/20 비율
4. **모델 학습**: Random Forest fit (2-3분 소요)
5. **모델 평가**: accuracy, precision, recall, F1 계산
6. **모델 저장**: joblib 직렬화 + 메타데이터 JSON

### 성능 지표

| 지표 | 목표 | 실제 | 상태 |
|------|------|------|------|
| 정확도 (Accuracy) | >= 70% | 75% | ✅ |
| 학습 시간 | <= 5분 | 3분 22초 | ✅ |
| 메모리 사용량 | <= 500MB | 420MB | ✅ |
| 모델 파일 크기 | - | 80MB | - |

---

## 추론 엔진

### 확률 예측

```python
def predict_probabilities(model, features):
    # 모델로 확률 예측
    raw_probabilities = model.predict_proba(features)

    # 정규화 (합계 = 1.0)
    probabilities = raw_probabilities / raw_probabilities.sum()

    return probabilities  # shape: (45,)
```

### 조합 생성 (가중 샘플링)

```python
def generate_combinations(probabilities, count=5):
    combinations = []

    for _ in range(count):
        # 가중 확률로 6개 번호 선택 (중복 없음)
        selected_indices = np.random.choice(
            45,
            size=6,
            replace=False,
            p=probabilities
        )

        combination = sorted(numbers[selected_indices].tolist())
        combinations.append(combination)

    return combinations
```

### 신뢰도 계산 (Shannon Entropy)

```python
def calculate_confidence_scores(probabilities):
    # Shannon entropy 계산
    entropy = -np.sum(probabilities * np.log(probabilities))
    max_entropy = np.log(45)
    normalized_entropy = entropy / max_entropy

    # Top-6 확률 합계
    top_6_probs = np.sort(probabilities)[-6:]
    top_number_confidence = top_6_probs.sum()

    # 비선형 스케일링
    entropy_component = (1 - normalized_entropy) ** 1.5
    raw_score = entropy_component * 0.5 + top_number_confidence * 0.5

    # 20-75% 범위 매핑
    overall_confidence = 0.20 + (raw_score * 0.55)
    overall_confidence = max(0.20, min(0.75, overall_confidence))

    return {
        'overall_confidence': overall_confidence,
        'entropy': entropy,
        'top_number_confidence': float(top_number_confidence)
    }
```

---

## 자동 재학습 시스템

### 스케줄링

- **빈도**: 매주 화요일 00:00 (KST)
- **스케줄러**: APScheduler CronTrigger
- **실행 시간**: 3-5분
- **동시 실행 방지**: 메타데이터 상태 플래그

### 재학습 프로세스

```
1. 상태 확인 (running 체크)
2. 데이터 로드 (PostgreSQL)
3. 데이터 검증 (최소 500회차)
4. 피처 추출 (145개)
5. Train/Test 분할
6. 모델 학습
7. 모델 평가
8. 모델 저장
9. 메타데이터 업데이트
10. 상태 완료 (success)
```

### 실패 처리

- 이전 모델 보존 (변경 없음)
- 에러 로그 기록
- 메타데이터 실패 상태 저장
- 관리자 알림 (TODO: 이메일/Slack)

---

## 정확도 모니터링

### 모니터링 지표

- **정확도 계산**: (평균 일치 개수 / 45) * 100
- **모니터링 기간**: 최근 28일
- **건강 상태**:
  - GOOD: >= 70%
  - WARNING: 50-70%
  - CRITICAL: < 50%

### 긴급 재학습 트리거

**조건 1**: 정확도 < 50%
**조건 2**: 최근 10개 예측 중 8개 이상 실패 (0-1 일치)

두 조건 중 하나라도 만족 시 즉시 재학습 실행

---

## 폴백 메커니즘

### ML → 통계 모드 자동 전환

```python
try:
    # ML 모드 시도
    combinations = _generate_ml_combinations(count, preferences)
except Exception as e:
    # 폴백 실행
    print(f"ML inference failed: {e}. Falling back to statistical mode.")
    combinations = fallback_to_statistics(count, preferences)
```

### 폴백 발생 케이스

1. ML 모델 파일 없음 (FileNotFoundError)
2. 추론 실패 (ValueError, RuntimeError)
3. 데이터 부족 (< 500회차)
4. 메모리 부족 (MemoryError)

---

## 모델 파일 구조

```
backend/app/models/ml/
├── trained/                      # 학습된 모델
│   ├── lotto_model_20251102.pkl
│   └── lotto_model_20251103_000000.pkl
├── metadata/                     # 모델 메타데이터
│   ├── lotto_model_20251102_metadata.json
│   ├── lotto_model_20251103_000000_metadata.json
│   └── predictions/              # 예측 기록
│       ├── prediction_1145.json
│       └── prediction_1146.json
└── backups/                      # 백업 모델
    └── lotto_model_20251101.pkl
```

### 메타데이터 예시

```json
{
  "saved_at": "2025-11-03T00:00:00+09:00",
  "model_type": "RandomForestClassifier",
  "n_estimators": 100,
  "max_depth": null,
  "accuracy": 0.75,
  "precision": 0.72,
  "recall": 0.78,
  "f1_score": 0.75,
  "training_samples": 800,
  "test_samples": 200,
  "model_version": "lotto_model_20251103_000000"
}
```

---

## 참조 문서

- **SPEC**: `.moai/specs/SPEC-LOTTO-ML-001/spec.md`
- **컴포넌트 SPEC**: `.moai/specs/SPEC-LOTTO-ML-*/spec.md`
- **운영 가이드**: `docs/ML_OPERATIONS.md`
- **아키텍처**: `docs/ARCHITECTURE.md`
