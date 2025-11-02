# 수락 기준: SPEC-LOTTO-ML-001

> **머신러닝 기반 예측 알고리즘 도입 수락 기준 및 검증 시나리오**
>
> **SPEC ID**: LOTTO-ML-001
> **Version**: 0.0.1
> **Last Updated**: 2025-11-02
> **Author**: @ip9202

---

## 📋 목차

1. [개요](#개요)
2. [수락 기준 요약](#수락-기준-요약)
3. [기능 시나리오 (Given-When-Then)](#기능-시나리오-given-when-then)
4. [성능 수락 기준](#성능-수락-기준)
5. [품질 게이트](#품질-게이트)
6. [Definition of Done](#definition-of-done)

---

## 개요

본 문서는 SPEC-LOTTO-ML-001의 구현 완료를 판단하기 위한 수락 기준을 정의합니다. 모든 시나리오는 Given-When-Then 형식으로 작성되었으며, TDD(Test-Driven Development) 원칙에 따라 테스트 코드로 자동 검증됩니다.

**검증 방법**:
- **단위 테스트**: pytest로 개별 함수/클래스 검증
- **통합 테스트**: 모듈 간 상호작용 검증
- **E2E 테스트**: 사용자 시나리오 전체 검증
- **성능 테스트**: pytest-benchmark로 응답 시간, 메모리 측정
- **수동 검증**: 프론트엔드 UI에서 신뢰도 표시 확인

---

## 수락 기준 요약

### 필수 기준 (MUST)
| ID | 기준 | 검증 방법 |
|----|-----|---------|
| AC-001 | ML 모델이 1000회차 데이터로 학습되어야 함 | 단위 테스트 |
| AC-002 | 모델 학습 시간이 5분 이내여야 함 | 성능 테스트 |
| AC-003 | 추론 시간이 1초 이내여야 함 (조합 5개 기준) | 성능 테스트 |
| AC-004 | 신뢰도가 20-75% 범위 내에 있어야 함 | 단위 테스트 |
| AC-005 | ML 실패 시 통계 모드로 자동 폴백되어야 함 | 통합 테스트 |
| AC-006 | 매주 화요일 자정 자동 재학습되어야 함 | 통합 테스트 |
| AC-007 | 정확도 70% 미만 시 관리자 알림이 전송되어야 함 | 통합 테스트 |
| AC-008 | 500회차 미만 시 폴백 모드로 전환되어야 함 | 통합 테스트 |

### 권장 기준 (SHOULD)
| ID | 기준 | 검증 방법 |
|----|-----|---------|
| AC-009 | 교차 검증 정확도가 70% 이상이어야 함 | 단위 테스트 |
| AC-010 | 메모리 사용량이 500MB 이하여야 함 (학습 중) | 성능 테스트 |
| AC-011 | 모델 파일 크기가 50MB 이하여야 함 | 성능 테스트 |
| AC-012 | 사용자 선호도(포함/제외 번호)가 반영되어야 함 | E2E 테스트 |

### 선택 기준 (MAY)
| ID | 기준 | 검증 방법 |
|----|-----|---------|
| AC-013 | 고급 사용자가 모델을 선택할 수 있어야 함 | E2E 테스트 |
| AC-014 | 1500회차 이상 시 LSTM 모델을 사용할 수 있어야 함 | 단위 테스트 |
| AC-015 | 하이퍼파라미터 튜닝이 자동 수행될 수 있어야 함 | 통합 테스트 |

---

## 기능 시나리오 (Given-When-Then)

### 시나리오 1: ML 모델 학습 성공

**@TEST:LOTTO-ML-001-SCENARIO-001**

#### Given (전제 조건)
- PostgreSQL 데이터베이스에 1000회차 이상의 당첨 데이터가 존재함
- 데이터에는 draw_number, draw_date, winning_numbers, bonus_number가 포함됨
- 모든 당첨 번호는 1-45 범위 내 정수이며, 중복 없이 6개 선택됨

#### When (실행)
- `ModelTrainer` 클래스의 `train_random_forest(n_draws=1000)` 메서드를 호출함

#### Then (기대 결과)
- 모델 학습이 성공적으로 완료되어야 함 (`result["success"] == True`)
- 학습 시간이 5분 이내여야 함
- 교차 검증 정확도가 70% 이상이어야 함 (`result["accuracy"] >= 0.70`)
- 모델 파일이 `backend/app/models/ml/trained/` 디렉토리에 생성되어야 함
- 메타데이터 파일이 `backend/app/models/ml/metadata/` 디렉토리에 생성되어야 함
- 메타데이터에 `model_type`, `n_estimators`, `training_draws`, `accuracy`, `trained_at` 필드가 포함되어야 함

#### 검증 코드
```python
def test_ml_model_training_success():
    # Given
    trainer = ModelTrainer(db_session)
    assert db_session.query(LottoModel).count() >= 1000  # 데이터 검증

    # When
    start_time = time.time()
    result = trainer.train_random_forest(n_draws=1000)
    training_time = time.time() - start_time

    # Then
    assert result["success"] is True
    assert training_time <= 300  # 5분 이내
    assert result["accuracy"] >= 0.70
    assert os.path.exists(result["model_path"])

    metadata_path = result["model_path"].replace("trained", "metadata").replace(".pkl", "_metadata.json")
    assert os.path.exists(metadata_path)

    with open(metadata_path, 'r') as f:
        metadata = json.load(f)
        assert "model_type" in metadata
        assert "accuracy" in metadata
        assert metadata["training_draws"] == 1000
```

---

### 시나리오 2: ML 모델 추론 및 조합 생성

**@TEST:LOTTO-ML-001-SCENARIO-002**

#### Given (전제 조건)
- 학습된 ML 모델이 `backend/app/models/ml/trained/` 디렉토리에 존재함
- 모델 파일명이 `lotto_model_YYYYMMDD.pkl` 형식임
- 데이터베이스에 최근 100회차 데이터가 존재함

#### When (실행)
- `MLPredictor` 클래스의 `generate_combinations(count=5, preferences=None)` 메서드를 호출함

#### Then (기대 결과)
- 5개의 번호 조합이 생성되어야 함
- 각 조합은 정확히 6개의 번호를 포함해야 함
- 각 조합의 번호는 1-45 범위 내에 있어야 함
- 각 조합의 번호는 중복이 없어야 함 (정렬된 상태)
- 각 조합에는 신뢰도 점수가 포함되어야 함 (`confidence_score`)
- 신뢰도 점수는 20-75% 범위 내에 있어야 함 (`0.20 <= score <= 0.75`)
- 추론 시간이 1초 이내여야 함

#### 검증 코드
```python
def test_ml_predictor_generate_combinations():
    # Given
    predictor = MLPredictor(db_session)
    assert predictor.model is not None  # 모델 로드 확인

    # When
    start_time = time.time()
    combinations = predictor.generate_combinations(count=5, preferences=None)
    inference_time = time.time() - start_time

    # Then
    assert len(combinations) == 5
    assert inference_time <= 1.0  # 1초 이내

    for combo in combinations:
        assert len(combo.numbers) == 6
        assert all(1 <= num <= 45 for num in combo.numbers)
        assert len(combo.numbers) == len(set(combo.numbers))  # 중복 없음
        assert combo.numbers == sorted(combo.numbers)  # 정렬 확인
        assert 0.20 <= combo.confidence_score <= 0.75  # 신뢰도 범위
```

---

### 시나리오 3: 사용자 선호도 반영

**@TEST:LOTTO-ML-001-SCENARIO-003**

#### Given (전제 조건)
- 학습된 ML 모델이 존재함
- 사용자가 포함하고 싶은 번호를 지정함 (예: [7, 13])
- 사용자가 제외하고 싶은 번호를 지정함 (예: [41, 42])

#### When (실행)
- `MLPredictor.generate_combinations(count=5, preferences=PreferenceSettings(include_numbers=[7, 13], exclude_numbers=[41, 42]))`를 호출함

#### Then (기대 결과)
- 생성된 모든 조합에 7 또는 13이 포함되어야 함
- 생성된 모든 조합에 41, 42가 포함되지 않아야 함
- 나머지 번호는 ML 모델의 예측 확률을 기반으로 선택되어야 함
- 신뢰도 점수가 정상적으로 계산되어야 함

#### 검증 코드
```python
def test_ml_predictor_with_user_preferences():
    # Given
    predictor = MLPredictor(db_session)
    preferences = PreferenceSettings(
        include_numbers=[7, 13],
        exclude_numbers=[41, 42]
    )

    # When
    combinations = predictor.generate_combinations(count=5, preferences=preferences)

    # Then
    for combo in combinations:
        # 포함 번호 중 최소 1개 포함
        assert 7 in combo.numbers or 13 in combo.numbers
        # 제외 번호 미포함
        assert 41 not in combo.numbers
        assert 42 not in combo.numbers
        # 신뢰도 정상 계산
        assert 0.20 <= combo.confidence_score <= 0.75
```

---

### 시나리오 4: ML 실패 시 통계 모드 폴백

**@TEST:LOTTO-ML-001-SCENARIO-004**

#### Given (전제 조건)
- ML 모델 파일이 존재하지 않거나 손상됨
- `RecommendationEngine`이 `use_ml=True`로 초기화됨
- 통계 엔진(기존 가중치 방식)이 정상 작동함

#### When (실행)
- `RecommendationEngine.generate_combinations(count=5)` 메서드를 호출함

#### Then (기대 결과)
- 예외가 발생하지 않아야 함
- 통계 모드로 자동 전환되어야 함
- 5개의 조합이 정상적으로 생성되어야 함
- 로그에 폴백 메시지가 기록되어야 함 ("ML mode failed. Fallback to statistical mode.")
- 반환된 조합은 통계 엔진의 결과여야 함 (신뢰도 없음)

#### 검증 코드
```python
def test_ml_fallback_to_statistical_mode():
    # Given
    # ML 모델 파일 삭제 (의도적 실패)
    model_dir = "backend/app/models/ml/trained/"
    if os.path.exists(model_dir):
        shutil.rmtree(model_dir)

    engine = RecommendationEngine(db_session, use_ml=True)

    # When
    combinations = engine.generate_combinations(count=5)

    # Then
    assert len(combinations) == 5
    assert all(len(combo.numbers) == 6 for combo in combinations)
    # 통계 모드 확인: ML 모델 없음
    assert engine.ml_predictor is None or engine.use_ml is False
```

---

### 시나리오 5: 자동 재학습 스케줄 실행

**@TEST:LOTTO-ML-001-SCENARIO-005**

#### Given (전제 조건)
- `AutoUpdater` 클래스가 초기화됨
- 재학습 스케줄이 등록됨 (매주 화요일 자정)
- 데이터베이스에 신규 당첨 데이터가 추가됨 (최신 회차)

#### When (실행)
- 재학습 작업을 수동으로 트리거함 (`updater.retrain_ml_model()`)

#### Then (기대 결과)
- 모델이 최신 1000회차 데이터로 재학습되어야 함
- 새 모델 파일이 생성되어야 함 (파일명에 오늘 날짜 포함)
- 새 메타데이터 파일이 생성되어야 함
- 이전 모델 파일은 백업되어야 함 (삭제되지 않음)
- 학습 완료 로그가 기록되어야 함 ("ML retraining completed.")

#### 검증 코드
```python
async def test_auto_retraining_scheduler():
    # Given
    updater = AutoUpdater(db_session)
    updater.schedule_ml_retraining()

    before_files = set(os.listdir("backend/app/models/ml/trained/"))

    # When
    await updater.retrain_ml_model()

    # Then
    after_files = set(os.listdir("backend/app/models/ml/trained/"))
    new_files = after_files - before_files

    assert len(new_files) > 0  # 새 모델 파일 생성
    latest_model = max(glob.glob("backend/app/models/ml/trained/lotto_model_*.pkl"))
    assert os.path.exists(latest_model)

    # 오늘 날짜 포함 확인
    today_str = datetime.now().strftime("%Y%m%d")
    assert today_str in latest_model
```

---

### 시나리오 6: 모델 정확도 경고 알림

**@TEST:LOTTO-ML-001-SCENARIO-006**

#### Given (전제 조건)
- 학습된 ML 모델이 존재함
- 모델의 교차 검증 정확도가 65%임 (70% 미만)
- 관리자 알림 시스템이 설정됨 (이메일 또는 Slack)

#### When (실행)
- 재학습 작업이 실행됨 (`updater.retrain_ml_model()`)

#### Then (기대 결과)
- 모델이 정상적으로 학습되어야 함
- 정확도가 70% 미만이므로 관리자 알림이 전송되어야 함
- 알림 제목: "ML Model Accuracy Warning"
- 알림 내용: "Model accuracy dropped to 65.0%. Please review."
- 로그에 경고 메시지가 기록되어야 함

#### 검증 코드
```python
async def test_accuracy_warning_notification(monkeypatch):
    # Given
    updater = AutoUpdater(db_session)
    notification_sent = []

    # Mock 알림 함수
    async def mock_send_notification(subject, message):
        notification_sent.append({"subject": subject, "message": message})

    monkeypatch.setattr(updater, "send_admin_notification", mock_send_notification)

    # When (정확도가 70% 미만인 경우 시뮬레이션)
    # ... 학습 후 정확도 65% 반환하도록 설정

    await updater.retrain_ml_model()

    # Then
    assert len(notification_sent) > 0
    assert "Accuracy Warning" in notification_sent[0]["subject"]
    assert "65" in notification_sent[0]["message"] or "0.65" in notification_sent[0]["message"]
```

---

### 시나리오 7: 데이터 부족 시 폴백 모드

**@TEST:LOTTO-ML-001-SCENARIO-007**

#### Given (전제 조건)
- 데이터베이스에 400회차 데이터만 존재함 (500회차 미만)
- `ModelTrainer`가 초기화됨

#### When (실행)
- `ModelTrainer.train_random_forest(n_draws=1000)` 메서드를 호출함

#### Then (기대 결과)
- 학습이 실패해야 함 또는 경고 로그가 기록되어야 함
- "Insufficient training data" 메시지가 로그에 기록되어야 함
- `RecommendationEngine`이 통계 모드로 자동 전환되어야 함
- 통계 엔진으로 조합 생성이 정상 작동해야 함

#### 검증 코드
```python
def test_insufficient_data_fallback():
    # Given
    # 데이터 400개로 제한 (실제 DB 조작 또는 Mock)
    db_session.query(LottoModel).filter(LottoModel.draw_number > 400).delete()
    db_session.commit()

    trainer = ModelTrainer(db_session)

    # When
    result = trainer.train_random_forest(n_draws=1000)

    # Then
    # 데이터 부족으로 학습 실패 또는 경고
    assert result["success"] is False or "warning" in result

    # 통계 모드 폴백 확인
    engine = RecommendationEngine(db_session, use_ml=True)
    combinations = engine.generate_combinations(count=5)
    assert len(combinations) == 5  # 통계 모드로 정상 생성
```

---

### 시나리오 8: 추론 시간 초과 시 캐시 반환

**@TEST:LOTTO-ML-001-SCENARIO-008**

#### Given (전제 조건)
- ML 모델의 추론 시간이 3초를 초과함 (의도적으로 지연 추가)
- 캐시에 최근 10개 추천 조합이 저장되어 있음

#### When (실행)
- `MLPredictor.generate_combinations(count=5)` 메서드를 호출함

#### Then (기대 결과)
- 추론 시간이 3초를 초과하므로 캐시된 결과가 반환되어야 함
- 반환된 조합은 캐시에 저장된 조합 중 하나여야 함
- 로그에 "Inference timeout. Returning cached results." 메시지가 기록되어야 함
- 응답 시간이 3초를 초과하지 않아야 함 (캐시 반환)

#### 검증 코드
```python
def test_inference_timeout_cache_fallback(monkeypatch):
    # Given
    predictor = MLPredictor(db_session)

    # Mock: 추론 시간 4초로 설정
    def slow_predict(*args, **kwargs):
        time.sleep(4)
        return predictor.predict_probabilities()

    monkeypatch.setattr(predictor, "predict_probabilities", slow_predict)

    # 캐시에 데이터 추가
    predictor._cache = [
        Combination([1, 5, 12, 23, 34, 45], confidence_score=0.50)
        # ... 10개 조합
    ]

    # When
    start_time = time.time()
    combinations = predictor.generate_combinations(count=5)
    response_time = time.time() - start_time

    # Then
    assert response_time < 3.0  # 캐시 반환으로 빠른 응답
    assert len(combinations) > 0
    # 캐시된 조합 반환 확인
    assert combinations[0].numbers in [c.numbers for c in predictor._cache]
```

---

### 시나리오 9: E2E - 사용자 추천 요청 (ML 모드)

**@TEST:LOTTO-ML-001-SCENARIO-009**

#### Given (전제 조건)
- 백엔드 서버가 실행 중임
- ML 모델이 정상적으로 로드됨
- 사용자가 프론트엔드에서 추천 요청을 보냄

#### When (실행)
- `POST /api/recommendations?use_ml=true` 엔드포인트를 호출함
- 요청 본문:
  ```json
  {
    "count": 5,
    "preferences": {
      "include_numbers": [7, 13],
      "exclude_numbers": [41, 42]
    }
  }
  ```

#### Then (기대 결과)
- HTTP 상태 코드가 200이어야 함
- 응답 본문에 `mode` 필드가 "ML"이어야 함
- 응답 본문에 5개의 조합이 포함되어야 함
- 각 조합에 신뢰도 점수가 포함되어야 함
- 각 조합에 7 또는 13이 포함되어야 함
- 각 조합에 41, 42가 포함되지 않아야 함
- 응답 시간이 1.5초 이내여야 함

#### 검증 코드
```python
async def test_e2e_recommendation_api_ml_mode():
    # Given
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        # When
        start_time = time.time()
        response = await client.post(
            "/api/recommendations?use_ml=true",
            json={
                "count": 5,
                "preferences": {
                    "include_numbers": [7, 13],
                    "exclude_numbers": [41, 42]
                }
            }
        )
        response_time = time.time() - start_time

    # Then
    assert response.status_code == 200
    assert response_time <= 1.5

    data = response.json()
    assert data["mode"] == "ML"
    assert len(data["combinations"]) == 5

    for combo in data["combinations"]:
        assert "confidence_score" in combo
        assert 0.20 <= combo["confidence_score"] <= 0.75
        assert 7 in combo["numbers"] or 13 in combo["numbers"]
        assert 41 not in combo["numbers"] and 42 not in combo["numbers"]
```

---

### 시나리오 10: E2E - 사용자 추천 요청 (통계 모드)

**@TEST:LOTTO-ML-001-SCENARIO-010**

#### Given (전제 조건)
- 백엔드 서버가 실행 중임
- 사용자가 통계 모드를 선택함

#### When (실행)
- `POST /api/recommendations?use_ml=false` 엔드포인트를 호출함
- 요청 본문:
  ```json
  {
    "count": 5,
    "preferences": null
  }
  ```

#### Then (기대 결과)
- HTTP 상태 코드가 200이어야 함
- 응답 본문에 `mode` 필드가 "Statistical"이어야 함
- 응답 본문에 5개의 조합이 포함되어야 함
- 각 조합에 신뢰도 점수가 없어야 함 (또는 기본값)
- 응답 시간이 1.5초 이내여야 함

#### 검증 코드
```python
async def test_e2e_recommendation_api_statistical_mode():
    # Given
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        # When
        response = await client.post(
            "/api/recommendations?use_ml=false",
            json={"count": 5, "preferences": None}
        )

    # Then
    assert response.status_code == 200

    data = response.json()
    assert data["mode"] == "Statistical"
    assert len(data["combinations"]) == 5

    for combo in data["combinations"]:
        assert len(combo["numbers"]) == 6
        # 통계 모드에서는 신뢰도 없음 또는 기본값
```

---

## 성능 수락 기준

### 응답 시간 기준

| 작업 | 목표 시간 | 허용 오차 | 측정 방법 |
|-----|---------|---------|---------|
| 모델 학습 (1000회차) | ≤ 5분 | +30초 | pytest-benchmark |
| 모델 로드 | ≤ 500ms | +100ms | pytest-benchmark |
| 추론 (조합 5개) | ≤ 1초 | +200ms | pytest-benchmark |
| API 응답 (전체) | ≤ 1.5초 | +300ms | E2E 테스트 (httpx) |

#### 검증 코드
```python
def test_performance_model_training(benchmark):
    trainer = ModelTrainer(db_session)
    result = benchmark(trainer.train_random_forest, n_draws=1000)
    assert result["success"] is True

def test_performance_inference(benchmark):
    predictor = MLPredictor(db_session)
    combinations = benchmark(predictor.generate_combinations, count=5)
    assert len(combinations) == 5
```

---

### 메모리 사용량 기준

| 컴포넌트 | 목표 메모리 | 허용 오차 | 측정 방법 |
|---------|-----------|---------|---------|
| 학습된 모델 파일 | ≤ 50MB | +10MB | 파일 크기 확인 |
| 학습 중 메모리 | ≤ 500MB | +100MB | memory_profiler |
| 추론 중 메모리 | ≤ 100MB | +50MB | memory_profiler |

#### 검증 코드
```python
def test_model_file_size():
    model_path = "backend/app/models/ml/trained/lotto_model_20251102.pkl"
    file_size = os.path.getsize(model_path) / (1024 * 1024)  # MB
    assert file_size <= 60  # 50MB + 10MB 여유

@memory_profiler.profile
def test_training_memory_usage():
    trainer = ModelTrainer(db_session)
    result = trainer.train_random_forest(n_draws=1000)
    # memory_profiler 출력에서 피크 메모리 확인 (≤ 600MB)
```

---

### 정확도 기준

| 지표 | 목표 | 허용 오차 | 측정 방법 |
|-----|-----|---------|---------|
| 교차 검증 정확도 | ≥ 70% | -5% | 5-fold CV 평균 |
| 실전 예측 정확도 (최근 10회) | ≥ 65% | -5% | 실제 당첨 번호와 비교 |
| 신뢰도 범위 준수율 | 100% | 0% | 모든 조합 검증 |

#### 검증 코드
```python
def test_cross_validation_accuracy():
    trainer = ModelTrainer(db_session)
    result = trainer.train_random_forest(n_draws=1000)
    assert result["accuracy"] >= 0.65  # 70% - 5% 여유

def test_confidence_score_range_compliance():
    predictor = MLPredictor(db_session)
    combinations = predictor.generate_combinations(count=100)  # 대량 테스트

    for combo in combinations:
        assert 0.20 <= combo.confidence_score <= 0.75
```

---

## 품질 게이트

### 코드 품질 기준

| 항목 | 기준 | 도구 | 검증 방법 |
|-----|-----|------|---------|
| 테스트 커버리지 | ≥ 85% | pytest-cov | `pytest --cov=app/services/ml` |
| Linting | 0 errors | pylint | `pylint app/services/ml/` |
| 타입 힌트 | 100% | mypy | `mypy app/services/ml/` |
| 복잡도 | Cyclomatic < 15 | radon | `radon cc app/services/ml/ -a` |

#### 실행 명령
```bash
# 전체 품질 게이트 실행
cd backend
pytest --cov=app/services/ml --cov-report=html tests/
pylint app/services/ml/
mypy app/services/ml/
radon cc app/services/ml/ -a -nb
```

---

### 보안 기준

| 항목 | 기준 | 도구 | 검증 방법 |
|-----|-----|------|---------|
| 의존성 취약점 | 0 high/critical | safety | `safety check` |
| 하드코딩 시크릿 | 0 발견 | bandit | `bandit -r app/services/ml/` |
| SQL Injection | 0 발견 | 수동 검토 | SQLAlchemy ORM 사용 확인 |

---

### 문서화 기준

| 항목 | 기준 | 검증 방법 |
|-----|-----|---------|
| 함수/클래스 docstring | 100% | pylint 검증 |
| API 문서 업데이트 | 완료 | Swagger UI 확인 |
| README 업데이트 | 완료 | ML 모드 사용법 추가 확인 |

---

## Definition of Done

### 기능 완료 조건

#### Phase 1: ML 인프라 구축
- [ ] `services/ml/` 디렉토리 구조 생성 완료
- [ ] `FeatureEngineer` 클래스 구현 및 테스트 통과
- [ ] 모델 저장/로드 유틸리티 구현 및 테스트 통과
- [ ] 단위 테스트 커버리지 90% 이상

#### Phase 2: 기본 ML 모델 구현
- [ ] `ModelTrainer` 클래스 구현 및 테스트 통과
- [ ] `MLPredictor` 클래스 구현 및 테스트 통과
- [ ] Random Forest 모델 학습 성공 (정확도 70% 이상)
- [ ] 추론 시간 1초 이내 달성
- [ ] 신뢰도 계산 로직 구현 및 20-75% 범위 검증

#### Phase 3: 기존 시스템 통합
- [ ] `RecommendationEngine` 확장 완료 (ML/통계 모드 전환)
- [ ] 폴백 메커니즘 구현 및 테스트 통과
- [ ] 추천 API 엔드포인트 수정 완료 (`use_ml` 파라미터)
- [ ] E2E 테스트 통과 (ML 모드, 통계 모드, 폴백)

#### Phase 4: 자동 재학습 시스템
- [ ] 재학습 스케줄러 구현 및 테스트 통과
- [ ] 모델 정확도 모니터링 구현
- [ ] 관리자 알림 시스템 통합
- [ ] 데이터 부족 시 폴백 로직 구현

#### Phase 5: 고급 기능 (선택)
- [ ] 모델 선택 UI 구현 (Optional)
- [ ] LSTM 모델 실험 (Optional)
- [ ] 하이퍼파라미터 튜닝 자동화 (Optional)

---

### 배포 완료 조건

#### 테스트
- [ ] 모든 단위 테스트 통과 (100%)
- [ ] 모든 통합 테스트 통과 (100%)
- [ ] 모든 E2E 테스트 통과 (100%)
- [ ] 성능 테스트 기준 충족 (응답 시간, 메모리)
- [ ] 부하 테스트 통과 (동시 사용자 100명)

#### 품질
- [ ] 코드 리뷰 완료 (2명 이상 승인)
- [ ] Linting 0 errors
- [ ] 타입 힌트 100%
- [ ] 테스트 커버리지 85% 이상
- [ ] 보안 스캔 통과 (0 high/critical 취약점)

#### 문서
- [ ] API 문서 업데이트 (Swagger)
- [ ] README 업데이트 (ML 모드 사용법)
- [ ] 운영 가이드 작성 (모델 재학습, 모니터링)
- [ ] 아키텍처 문서 업데이트

#### 배포
- [ ] 스테이징 환경 배포 완료
- [ ] 스테이징 스모크 테스트 통과
- [ ] 프로덕션 배포 계획 승인
- [ ] 롤백 계획 수립
- [ ] 모니터링 대시보드 설정

---

### 최종 승인 체크리스트

- [ ] **제품 오너 승인**: 모든 필수 기능이 요구사항을 충족함
- [ ] **기술 리드 승인**: 코드 품질 및 아키텍처 기준 충족
- [ ] **QA 승인**: 모든 테스트 시나리오 통과 확인
- [ ] **보안 승인**: 보안 취약점 없음 확인
- [ ] **운영팀 승인**: 배포 준비 완료 확인

---

**문서 버전**: v0.0.1
**작성일**: 2025-11-02
**검토 예정일**: 구현 완료 후 최종 검토
**승인자**: @ip9202 (제품 오너), @tech-lead (기술 리드)
