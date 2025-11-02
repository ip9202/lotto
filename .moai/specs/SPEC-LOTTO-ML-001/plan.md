# 구현 계획: SPEC-LOTTO-ML-001

> **머신러닝 기반 예측 알고리즘 도입 구현 로드맵**
>
> **SPEC ID**: LOTTO-ML-001
> **Version**: 0.0.1
> **Last Updated**: 2025-11-02
> **Author**: @ip9202

---

## 📋 목차

1. [전체 개요](#전체-개요)
2. [단계별 구현 로드맵](#단계별-구현-로드맵)
3. [기술 스택 및 의존성](#기술-스택-및-의존성)
4. [아키텍처 설계](#아키텍처-설계)
5. [성능 목표](#성능-목표)
6. [위험 및 완화 전략](#위험-및-완화-전략)
7. [테스트 전략](#테스트-전략)
8. [배포 전략](#배포-전략)

---

## 전체 개요

### 구현 범위
현재 통계 기반 추천 엔진(`RecommendationEngine`)을 유지하면서, 머신러닝 기반 예측 모듈을 **추가**하는 방식으로 구현합니다. 두 엔진이 공존하며, ML 실패 시 통계 엔진으로 폴백하는 하이브리드 아키텍처를 채택합니다.

### 핵심 전략
1. **점진적 도입**: 기존 시스템을 유지하면서 ML 모듈을 단계적으로 추가
2. **TDD 원칙**: 각 단계마다 테스트를 먼저 작성 (RED → GREEN → REFACTOR)
3. **폴백 안정성**: ML 실패 시 항상 통계 엔진으로 안전하게 전환
4. **모니터링 우선**: 모델 정확도, 추론 시간, 메모리 사용량 실시간 추적

### 예상 효과
- **정확도 향상**: 기존 대비 30-40% 예측 정확도 개선
- **신뢰도 제공**: 각 추천 조합에 대한 신뢰도 점수 제공 (20-75%)
- **동적 학습**: 매주 자동 재학습으로 최신 트렌드 반영

---

## 단계별 구현 로드맵

### Phase 1: ML 인프라 구축 (Foundation)

**목표**: ML 모듈의 기반 구조를 설정하고, 데이터 전처리 파이프라인을 구축합니다.

#### Step 1.1: 디렉토리 구조 설계
```
backend/app/services/ml/
├── __init__.py
├── ml_predictor.py          # ML 예측 클래스
├── model_trainer.py         # 모델 학습 클래스
├── feature_engineering.py   # 피처 엔지니어링 유틸리티
├── model_evaluator.py       # 모델 평가 클래스
└── utils.py                 # 공통 유틸리티 함수

backend/app/models/ml/
├── trained/                 # 학습된 모델 저장 디렉토리
│   └── lotto_model_YYYYMMDD.pkl
└── metadata/                # 모델 메타데이터
    └── lotto_model_YYYYMMDD_metadata.json
```

**구현 내용**:
- `__init__.py`: 모듈 초기화, 클래스 export
- `utils.py`: 모델 저장/로드, 날짜 포맷 변환, 로깅 헬퍼 함수

**테스트**:
- ✅ 디렉토리 생성 확인
- ✅ 모듈 import 확인

---

#### Step 1.2: 데이터 전처리 파이프라인 구현
**파일**: `feature_engineering.py`

**기능**:
1. **데이터 로드**: PostgreSQL에서 과거 N회차 당첨 데이터 조회
2. **피처 추출**:
   - 번호별 출현 빈도 (frequency)
   - 번호별 최근 트렌드 (recent_trend)
   - 번호 간 조합 패턴 (co-occurrence matrix)
   - 시간적 특성 (time_features: 최근 10회, 50회, 100회 트렌드)
3. **정규화**: MinMaxScaler로 0-1 범위 정규화
4. **인코딩**: 번호를 원-핫 인코딩 (45차원 벡터)

**핵심 함수**:
```python
class FeatureEngineer:
    def __init__(self, db_session: Session):
        self.db = db_session
        self.scaler = MinMaxScaler()

    def extract_features(self, draw_count: int = 1000) -> pd.DataFrame:
        """과거 N회차 데이터에서 피처 추출"""
        pass

    def create_training_dataset(self, features: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """X, y 학습 데이터셋 생성 (X: 피처, y: 다음 회차 당첨 번호)"""
        pass

    def normalize_features(self, X: np.ndarray) -> np.ndarray:
        """피처 정규화"""
        return self.scaler.fit_transform(X)
```

**테스트** (@TEST:LOTTO-ML-001-FEATURE):
- ✅ 1000회차 데이터 로드 확인
- ✅ 피처 추출 결과 shape 확인 (1000 rows, N features)
- ✅ 정규화 결과 범위 확인 (0-1)
- ✅ 원-핫 인코딩 차원 확인 (45차원)

---

#### Step 1.3: 모델 저장/로드 유틸리티
**파일**: `utils.py`

**기능**:
```python
def save_model(model, model_name: str, metadata: dict) -> str:
    """모델과 메타데이터를 파일로 저장"""
    timestamp = datetime.now().strftime("%Y%m%d")
    model_path = f"backend/app/models/ml/trained/{model_name}_{timestamp}.pkl"
    metadata_path = f"backend/app/models/ml/metadata/{model_name}_{timestamp}_metadata.json"

    joblib.dump(model, model_path)
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    return model_path

def load_latest_model(model_name: str) -> Tuple[Any, dict]:
    """가장 최신 모델과 메타데이터를 로드"""
    trained_dir = "backend/app/models/ml/trained/"
    latest_file = max(glob.glob(f"{trained_dir}{model_name}_*.pkl"))

    model = joblib.load(latest_file)
    metadata_file = latest_file.replace("trained", "metadata").replace(".pkl", "_metadata.json")

    with open(metadata_file, 'r') as f:
        metadata = json.load(f)

    return model, metadata
```

**테스트** (@TEST:LOTTO-ML-001-UTILS):
- ✅ 모델 저장 후 파일 존재 확인
- ✅ 메타데이터 저장 확인 (JSON 유효성)
- ✅ 최신 모델 로드 확인 (날짜 기준 정렬)

---

### Phase 2: 기본 ML 모델 구현 (Core Model)

**목표**: Random Forest 기반 기본 ML 모델을 구현하고, 학습/추론 파이프라인을 완성합니다.

#### Step 2.1: 모델 학습 클래스 구현
**파일**: `model_trainer.py`

**기능**:
```python
class ModelTrainer:
    def __init__(self, db_session: Session):
        self.db = db_session
        self.feature_engineer = FeatureEngineer(db_session)
        self.model = None

    def train_random_forest(self, n_draws: int = 1000) -> dict:
        """Random Forest 모델 학습"""
        # 1. 데이터 로드 및 피처 추출
        features = self.feature_engineer.extract_features(n_draws)
        X_train, y_train = self.feature_engineer.create_training_dataset(features)
        X_train = self.feature_engineer.normalize_features(X_train)

        # 2. 모델 학습 (Random Forest Classifier)
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        self.model.fit(X_train, y_train)

        # 3. 교차 검증
        cv_scores = cross_val_score(self.model, X_train, y_train, cv=5)

        # 4. 모델 평가
        accuracy = cv_scores.mean()

        # 5. 메타데이터 생성
        metadata = {
            "model_type": "RandomForestClassifier",
            "n_estimators": 100,
            "training_draws": n_draws,
            "accuracy": float(accuracy),
            "cv_scores": cv_scores.tolist(),
            "trained_at": datetime.now().isoformat()
        }

        # 6. 모델 저장
        model_path = save_model(self.model, "lotto_model", metadata)

        return {
            "success": True,
            "accuracy": accuracy,
            "model_path": model_path,
            "metadata": metadata
        }
```

**테스트** (@TEST:LOTTO-ML-001-TRAIN):
- ✅ 1000회차 데이터로 학습 완료 확인
- ✅ 학습 시간 5분 이내 확인
- ✅ 교차 검증 정확도 70% 이상 확인
- ✅ 모델 파일 생성 확인

---

#### Step 2.2: ML 예측 클래스 구현
**파일**: `ml_predictor.py`

**기능**:
```python
class MLPredictor:
    def __init__(self, db_session: Session):
        self.db = db_session
        self.model, self.metadata = self._load_model()
        self.feature_engineer = FeatureEngineer(db_session)

    def _load_model(self) -> Tuple[Any, dict]:
        """최신 학습 모델 로드"""
        try:
            return load_latest_model("lotto_model")
        except Exception as e:
            logger.warning(f"ML model load failed: {e}. Fallback to None.")
            return None, {}

    def predict_probabilities(self) -> Dict[int, float]:
        """45개 번호 각각의 출현 확률 예측"""
        if self.model is None:
            raise ValueError("ML model is not loaded.")

        # 1. 현재 상태의 피처 추출 (최근 100회차 기반)
        features = self.feature_engineer.extract_features(100)
        X_current = self.feature_engineer.normalize_features(features[-1:])  # 최신 1개 row

        # 2. 모델 예측 (45개 번호별 확률)
        probabilities = self.model.predict_proba(X_current)[0]

        # 3. 번호-확률 딕셔너리 생성 (1-45)
        number_probs = {i+1: float(probabilities[i]) for i in range(45)}

        return number_probs

    def generate_combinations(self, count: int, preferences: PreferenceSettings = None) -> List[Combination]:
        """ML 기반 번호 조합 생성"""
        # 1. 번호별 확률 예측
        number_probs = self.predict_probabilities()

        # 2. 사용자 선호도 적용
        if preferences:
            number_probs = self._apply_preferences(number_probs, preferences)

        # 3. 확률 기반 샘플링으로 조합 생성
        combinations = self._sample_combinations(number_probs, count * 10)

        # 4. 신뢰도 계산 및 상위 N개 선택
        scored_combinations = self._calculate_confidence_scores(combinations, number_probs)
        top_combinations = sorted(scored_combinations, key=lambda x: x.confidence_score, reverse=True)[:count]

        return top_combinations

    def _calculate_confidence_scores(self, combinations: List[List[int]], probs: Dict[int, float]) -> List[Combination]:
        """조합별 신뢰도 계산 (20-75% 범위)"""
        scored = []
        for combo in combinations:
            # 1. 모델 예측 확률 평균
            prob_score = sum(probs[num] for num in combo) / 6

            # 2. 패턴 점수 (홀짝, 구간, 연속번호 등)
            pattern_score = self._calculate_pattern_score(combo)

            # 3. 통계적 균형 점수
            balance_score = self._calculate_balance_score(combo)

            # 4. 종합 점수 (가중 평균)
            total_score = prob_score * 0.50 + pattern_score * 0.30 + balance_score * 0.20

            # 5. 신뢰도 정규화 (20-75% 범위)
            confidence = 0.20 + (total_score * 0.55)  # 0-1 → 20-75%
            confidence = max(0.20, min(0.75, confidence))

            scored.append(Combination(combo, confidence_score=confidence))

        return scored
```

**테스트** (@TEST:LOTTO-ML-001-PREDICT):
- ✅ 45개 번호 확률 벡터 생성 확인
- ✅ 확률 합 = 1.0 확인
- ✅ 조합 생성 1초 이내 확인
- ✅ 신뢰도 20-75% 범위 확인

---

### Phase 3: 기존 시스템 통합 (Integration)

**목표**: ML 예측 모듈을 기존 `RecommendationEngine`과 통합하고, 폴백 메커니즘을 구현합니다.

#### Step 3.1: RecommendationEngine 확장
**파일**: `recommendation_engine.py` (기존 파일 수정)

**변경 내용**:
```python
class RecommendationEngine:
    def __init__(self, db_session: Session, use_ml: bool = True):
        self.db = db_session
        self.analyzer = LottoAnalyzer(db_session)
        self.use_ml = use_ml

        # ML 모드 초기화
        if self.use_ml:
            try:
                self.ml_predictor = MLPredictor(db_session)
                logger.info("ML mode enabled.")
            except Exception as e:
                logger.warning(f"ML initialization failed: {e}. Fallback to statistical mode.")
                self.use_ml = False
                self.ml_predictor = None
        else:
            self.ml_predictor = None

        # 통계 모드 가중치 (폴백용)
        self.weights = {
            'frequency': 0.6,
            'trend': 0.4
        }

    def generate_combinations(self, count: int, preferences: PreferenceSettings = None, exclude_combinations: List[List[int]] = None) -> List[Combination]:
        """번호 조합 생성 - ML 모드 또는 통계 모드"""
        try:
            if self.use_ml and self.ml_predictor is not None:
                # ML 모드: 머신러닝 기반 추천
                return self.ml_predictor.generate_combinations(count, preferences)
            else:
                # 통계 모드: 기존 방식
                return self._generate_statistical_combinations(count, preferences, exclude_combinations)
        except Exception as e:
            logger.error(f"ML mode failed: {e}. Fallback to statistical mode.")
            # 폴백: 통계 모드로 전환
            return self._generate_statistical_combinations(count, preferences, exclude_combinations)

    def _generate_statistical_combinations(self, count: int, preferences: PreferenceSettings = None, exclude_combinations: List[List[int]] = None) -> List[Combination]:
        """통계 기반 조합 생성 (기존 로직)"""
        # 기존 generate_combinations 로직을 이 메서드로 이동
        pass
```

**테스트** (@TEST:LOTTO-ML-001-INTEGRATION):
- ✅ ML 모드 활성화 확인 (`use_ml=True`)
- ✅ ML 실패 시 통계 모드 폴백 확인
- ✅ 통계 모드 직접 호출 확인 (`use_ml=False`)

---

#### Step 3.2: 추천 API 엔드포인트 수정
**파일**: `backend/app/api/recommendations.py`

**변경 내용**:
```python
@router.post("/recommendations", response_model=RecommendationResponse)
async def generate_recommendations(
    request: RecommendationRequest,
    use_ml: bool = Query(True, description="ML 모드 사용 여부"),
    db: Session = Depends(get_db)
):
    """로또 번호 추천 생성 - ML 또는 통계 모드"""
    engine = RecommendationEngine(db, use_ml=use_ml)
    combinations = engine.generate_combinations(
        count=request.count,
        preferences=request.preferences,
        exclude_combinations=request.exclude_combinations
    )

    return RecommendationResponse(
        combinations=[
            CombinationSchema(
                numbers=combo.numbers,
                confidence_score=combo.confidence_score,
                analysis=combo.analysis
            ) for combo in combinations
        ],
        mode="ML" if use_ml else "Statistical"
    )
```

**테스트** (@TEST:LOTTO-ML-001-API):
- ✅ `/api/recommendations?use_ml=true` 호출 확인
- ✅ `/api/recommendations?use_ml=false` 호출 확인
- ✅ 응답 형식 검증 (신뢰도 필드 포함)

---

### Phase 4: 자동 재학습 시스템 (Auto-Retrain)

**목표**: 매주 새로운 당첨 데이터가 추가될 때 모델을 자동으로 재학습합니다.

#### Step 4.1: 재학습 스케줄러 구현
**파일**: `backend/app/services/auto_updater.py` (기존 파일 수정)

**변경 내용**:
```python
from .ml.model_trainer import ModelTrainer

class AutoUpdater:
    def __init__(self, db_session: Session):
        self.db = db_session
        self.trainer = ModelTrainer(db_session)

    def schedule_ml_retraining(self):
        """ML 모델 재학습 스케줄 등록 - 매주 화요일 자정"""
        scheduler = BackgroundScheduler(timezone='Asia/Seoul')

        # 매주 화요일 00:00 재학습
        scheduler.add_job(
            self.retrain_ml_model,
            trigger='cron',
            day_of_week='tue',
            hour=0,
            minute=0,
            id='ml_retrain_job'
        )

        scheduler.start()
        logger.info("ML retraining scheduler started.")

    async def retrain_ml_model(self):
        """ML 모델 재학습 실행"""
        try:
            logger.info("Starting ML model retraining...")

            # 1. 최신 1000회차 데이터로 재학습
            result = self.trainer.train_random_forest(n_draws=1000)

            if result["success"]:
                logger.info(f"ML retraining completed. Accuracy: {result['accuracy']:.2%}")

                # 2. 정확도 검증 (70% 미만 시 알림)
                if result["accuracy"] < 0.70:
                    await self.send_admin_notification(
                        subject="ML Model Accuracy Warning",
                        message=f"Model accuracy dropped to {result['accuracy']:.2%}. Please review."
                    )
            else:
                raise Exception("Training failed.")

        except Exception as e:
            logger.error(f"ML retraining failed: {e}")
            await self.send_admin_notification(
                subject="ML Retraining Failed",
                message=f"Error: {str(e)}"
            )

    async def send_admin_notification(self, subject: str, message: str):
        """관리자 알림 전송 (이메일/Slack)"""
        # 이메일 또는 Slack 웹훅 전송 로직
        pass
```

**테스트** (@TEST:LOTTO-ML-001-SCHEDULER):
- ✅ 스케줄러 등록 확인
- ✅ 재학습 트리거 확인 (수동 실행)
- ✅ 정확도 경고 알림 확인 (< 70%)

---

#### Step 4.2: 모델 정확도 모니터링
**파일**: `backend/app/services/ml/model_evaluator.py` (신규)

**기능**:
```python
class ModelEvaluator:
    def __init__(self, db_session: Session):
        self.db = db_session

    def evaluate_recent_predictions(self, recent_draws: int = 10) -> float:
        """최근 N회차 예측 정확도 평가"""
        # 1. 최근 N회차 실제 당첨 번호 조회
        actual_results = self._get_recent_winning_numbers(recent_draws)

        # 2. 각 회차별로 모델 예측 수행 (과거 시점 기준)
        predicted_results = []
        for i in range(recent_draws):
            # 해당 회차 이전 데이터로 예측
            predicted_probs = self._predict_at_draw(actual_results[i]['draw_number'] - 1)
            predicted_results.append(predicted_probs)

        # 3. 정확도 계산 (Top-6 번호가 실제 당첨 번호와 몇 개 일치하는지)
        total_matches = 0
        for actual, predicted in zip(actual_results, predicted_results):
            top_6_predicted = sorted(predicted, key=predicted.get, reverse=True)[:6]
            matches = len(set(top_6_predicted) & set(actual['winning_numbers']))
            total_matches += matches

        accuracy = total_matches / (recent_draws * 6)  # 정확도 = 맞춘 번호 / 전체 번호
        return accuracy
```

**테스트** (@TEST:LOTTO-ML-001-EVAL):
- ✅ 최근 10회차 예측 정확도 계산 확인
- ✅ 정확도 70% 이상 검증

---

### Phase 5: 고급 기능 (Advanced Features)

**목표**: 선택적 고급 기능을 구현하여 사용자 경험을 개선합니다.

#### Step 5.1: 모델 선택 UI (Optional)
**기능**: 고급 사용자가 Random Forest, Gradient Boosting, XGBoost 중 선택 가능

**구현**:
- API 파라미터 추가: `model_type: str = Query("random_forest")`
- ModelTrainer에 모델 타입별 학습 메서드 추가

#### Step 5.2: LSTM 모델 실험 (Optional)
**조건**: 데이터 1500회차 이상

**구현**:
- TensorFlow/Keras 기반 LSTM 모델 클래스 추가
- 시계열 데이터 전처리 (sequence 생성)

#### Step 5.3: 하이퍼파라미터 튜닝 (Optional)
**기능**: Grid Search 자동화

**구현**:
- scikit-learn의 `GridSearchCV` 사용
- 최적 파라미터 자동 탐색 및 적용

---

## 기술 스택 및 의존성

### 백엔드 의존성 추가 (requirements.txt)
```txt
# 기존 의존성 유지
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
pandas==2.1.4
numpy>=1.26.0

# 신규 ML 의존성 추가
scikit-learn>=1.3.0         # 필수: ML 프레임워크
joblib>=1.3.0               # 필수: 모델 저장/로드
imbalanced-learn>=0.11.0    # 선택: 불균형 데이터 처리

# 선택적 딥러닝 의존성 (LSTM 모델용)
tensorflow>=2.14.0          # 선택: 딥러닝 프레임워크
keras>=2.14.0               # 선택: 고수준 신경망 API
```

### 버전 선택 기준
- **scikit-learn 1.3+**: 최신 안정 버전, Python 3.9+ 호환
- **TensorFlow 2.14+**: 최신 LSTM API 지원, M1/M2 Mac 최적화
- **joblib**: scikit-learn 내장, 별도 설치 불필요 (명시적 추가 권장)

### 설치 방법
```bash
cd backend
pip install -r requirements.txt
```

---

## 아키텍처 설계

### 시스템 컴포넌트 다이어그램
```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (React)                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  추천 요청 UI (ML 모드 토글, 신뢰도 표시)               │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP Request
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Backend (FastAPI)                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/recommendations (use_ml 파라미터)                  │  │
│  └──────────────────┬───────────────────────────────────────┘  │
│                     │                                            │
│  ┌──────────────────▼───────────────────────────────────────┐  │
│  │       RecommendationEngine (통합 레이어)                 │  │
│  │  ┌─────────────────────┬──────────────────────────┐     │  │
│  │  │   ML Mode           │  Statistical Mode        │     │  │
│  │  │  (MLPredictor)      │  (기존 통계 엔진)        │     │  │
│  │  └─────────────────────┴──────────────────────────┘     │  │
│  └──────────────────┬───────────────────────────────────────┘  │
│                     │                                            │
│  ┌──────────────────▼───────────────────────────────────────┐  │
│  │              ML 모듈 (services/ml/)                       │  │
│  │  ┌──────────────────┬──────────────────┬───────────────┐ │  │
│  │  │  MLPredictor     │  ModelTrainer    │  Evaluator    │ │  │
│  │  │  (추론)          │  (학습)          │  (평가)       │ │  │
│  │  └──────────────────┴──────────────────┴───────────────┘ │  │
│  └──────────────────┬───────────────────────────────────────┘  │
│                     │                                            │
│  ┌──────────────────▼───────────────────────────────────────┐  │
│  │          저장된 모델 (models/ml/trained/)                │  │
│  │  - lotto_model_20251102.pkl                              │  │
│  │  - lotto_model_20251102_metadata.json                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                            │
│  - lotto_draws (당첨 번호 데이터)                               │
│  - 1000+ 회차 이력                                               │
└─────────────────────────────────────────────────────────────────┘
```

### 데이터 흐름
1. **학습 단계** (매주 화요일 자정):
   - AutoUpdater → ModelTrainer
   - PostgreSQL에서 1000회차 데이터 로드
   - 피처 엔지니어링 → 모델 학습 → 평가
   - 모델 저장 (`lotto_model_YYYYMMDD.pkl`)

2. **추론 단계** (사용자 요청 시):
   - 사용자 요청 → `/api/recommendations?use_ml=true`
   - RecommendationEngine → MLPredictor
   - 최신 모델 로드 → 번호별 확률 예측
   - 조합 생성 → 신뢰도 계산 → 응답 반환

3. **폴백 단계** (ML 실패 시):
   - MLPredictor 예외 발생
   - RecommendationEngine → 통계 모드 전환
   - 기존 가중치 방식으로 조합 생성

---

## 성능 목표

### 응답 시간
| 작업 | 목표 시간 | 측정 방법 |
|-----|---------|---------|
| 모델 학습 (1000회차) | ≤ 5분 | 학습 시작 ~ 모델 저장 완료 |
| 모델 로드 | ≤ 500ms | 파일 읽기 + 역직렬화 |
| 추론 (조합 5개 생성) | ≤ 1초 | 예측 + 조합 생성 + 신뢰도 계산 |
| API 응답 (전체) | ≤ 1.5초 | 요청 수신 ~ 응답 반환 |

### 메모리 사용량
| 컴포넌트 | 목표 메모리 | 측정 방법 |
|---------|-----------|---------|
| 학습된 모델 | ≤ 50MB | 모델 파일 크기 |
| 학습 중 메모리 | ≤ 500MB | 피크 메모리 사용량 |
| 추론 중 메모리 | ≤ 100MB | 런타임 메모리 증가량 |

### 정확도 목표
| 지표 | 목표 | 측정 방법 |
|-----|-----|---------|
| 교차 검증 정확도 | ≥ 70% | 5-fold CV 평균 |
| 실전 예측 정확도 (최근 10회) | ≥ 65% | Top-6 예측 번호와 실제 일치율 |
| 신뢰도 범위 준수 | 100% | 모든 조합이 20-75% 내에 분포 |

---

## 위험 및 완화 전략

### 위험 1: 모델 정확도 미달 (영향도: 높음)
**증상**: 교차 검증 정확도 < 70%

**원인**:
- 학습 데이터 부족 (500회차 미만)
- 피처 엔지니어링 부적절
- 모델 하이퍼파라미터 최적화 부족

**완화 전략**:
1. **데이터 증강**: 500회차 미만 시 통계 모드로 폴백
2. **피처 최적화**: 상관관계 분석으로 유의미한 피처만 선택
3. **앙상블 기법**: Random Forest + Gradient Boosting 혼합
4. **정기 재학습**: 매주 최신 데이터로 모델 업데이트

---

### 위험 2: 학습 시간 초과 (영향도: 중간)
**증상**: 학습 시간 > 5분

**원인**:
- 데이터 샘플 크기 과도 (1000회차 이상)
- 모델 복잡도 과다 (n_estimators > 100)
- CPU 리소스 부족

**완화 전략**:
1. **데이터 샘플링**: 최근 1000회차로 제한
2. **모델 경량화**: n_estimators=50으로 축소 (정확도 trade-off)
3. **백그라운드 작업**: 재학습을 비동기 작업으로 실행
4. **리소스 확보**: 학습 중 다른 작업 일시 중지

---

### 위험 3: 메모리 부족 (영향도: 중간)
**증상**: OOM (Out of Memory) 에러

**원인**:
- 학습 데이터 전체 메모리 로드
- 모델 크기 과도 (> 100MB)
- 메모리 누수

**완화 전략**:
1. **증분 학습**: 데이터를 배치로 나누어 학습
2. **모델 압축**: joblib 압축 옵션 사용
3. **메모리 프로파일링**: `memory_profiler` 사용하여 누수 탐지
4. **가비지 컬렉션**: 학습 후 명시적 메모리 해제

---

### 위험 4: 폴백 실패 (영향도: 높음)
**증상**: ML 실패 + 통계 모드도 실패 → 서비스 중단

**원인**:
- 통계 엔진 버그
- 데이터베이스 연결 실패
- 예외 처리 누락

**완화 전략**:
1. **다중 폴백 레이어**:
   - Layer 1: ML 모드
   - Layer 2: 통계 모드
   - Layer 3: 하드코딩된 기본 조합 (최후 수단)
2. **상태 검증**: 각 레이어 진입 전 DB 연결, 데이터 유효성 확인
3. **에러 핸들링 강화**: 모든 예외를 캐치하고 로그 기록

---

## 테스트 전략

### 테스트 범위
| 테스트 타입 | 범위 | 도구 | 목표 커버리지 |
|-----------|-----|------|-------------|
| 단위 테스트 | 개별 함수/클래스 | pytest | 90% |
| 통합 테스트 | 모듈 간 상호작용 | pytest | 80% |
| E2E 테스트 | 전체 워크플로우 | pytest + httpx | 70% |
| 성능 테스트 | 응답 시간, 메모리 | pytest-benchmark | N/A |

### 테스트 케이스 예시

#### 단위 테스트 (@TEST:LOTTO-ML-001-UNIT)
```python
def test_feature_extraction():
    """피처 추출 테스트"""
    engineer = FeatureEngineer(db_session)
    features = engineer.extract_features(n_draws=100)

    assert features.shape[0] == 100  # 100개 row
    assert features.shape[1] > 0     # 피처 존재
    assert features.isnull().sum().sum() == 0  # null 없음

def test_model_training():
    """모델 학습 테스트"""
    trainer = ModelTrainer(db_session)
    result = trainer.train_random_forest(n_draws=500)

    assert result["success"] is True
    assert result["accuracy"] >= 0.70  # 70% 이상
    assert os.path.exists(result["model_path"])  # 모델 파일 존재

def test_probability_prediction():
    """확률 예측 테스트"""
    predictor = MLPredictor(db_session)
    probs = predictor.predict_probabilities()

    assert len(probs) == 45  # 45개 번호
    assert all(0 <= p <= 1 for p in probs.values())  # 0-1 범위
    assert abs(sum(probs.values()) - 1.0) < 0.01  # 합 = 1.0

def test_confidence_score_range():
    """신뢰도 범위 테스트"""
    predictor = MLPredictor(db_session)
    combinations = predictor.generate_combinations(count=10)

    for combo in combinations:
        assert 0.20 <= combo.confidence_score <= 0.75  # 20-75%
```

#### 통합 테스트 (@TEST:LOTTO-ML-001-INTEGRATION)
```python
def test_ml_fallback_to_statistical():
    """ML 실패 시 통계 모드 폴백 테스트"""
    # ML 모델 삭제 (의도적 실패)
    os.remove("backend/app/models/ml/trained/lotto_model_20251102.pkl")

    engine = RecommendationEngine(db_session, use_ml=True)
    combinations = engine.generate_combinations(count=5)

    # 폴백 성공 확인
    assert len(combinations) == 5
    assert all(len(combo.numbers) == 6 for combo in combinations)

def test_retraining_scheduler():
    """재학습 스케줄러 테스트"""
    updater = AutoUpdater(db_session)
    updater.schedule_ml_retraining()

    # 수동 트리거
    asyncio.run(updater.retrain_ml_model())

    # 새 모델 파일 생성 확인
    latest_model = max(glob.glob("backend/app/models/ml/trained/lotto_model_*.pkl"))
    assert os.path.exists(latest_model)
```

#### E2E 테스트 (@TEST:LOTTO-ML-001-E2E)
```python
async def test_recommendation_api_ml_mode():
    """추천 API ML 모드 E2E 테스트"""
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
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

    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "ML"
    assert len(data["combinations"]) == 5

    # 신뢰도 검증
    for combo in data["combinations"]:
        assert 0.20 <= combo["confidence_score"] <= 0.75
        assert 7 in combo["numbers"] or 13 in combo["numbers"]  # 포함 번호 반영
        assert 41 not in combo["numbers"] and 42 not in combo["numbers"]  # 제외 번호 반영
```

---

## 배포 전략

### 배포 절차
1. **개발 환경 테스트**: 로컬에서 전체 테스트 스위트 실행 (pytest)
2. **스테이징 배포**: Docker 이미지 빌드 → 스테이징 서버 배포
3. **스모크 테스트**: 스테이징에서 핵심 시나리오 테스트
4. **프로덕션 배포**: Blue-Green 배포 (무중단 배포)
5. **모니터링**: 신규 버전 성능 모니터링 (30분)
6. **롤백 준비**: 문제 발생 시 이전 버전으로 즉시 롤백

### Blue-Green 배포
```bash
# Blue (현재 운영 중): v1.0.0 (통계 모드)
# Green (신규 버전): v1.1.0 (ML 모드)

# 1. Green 배포
docker build -t lotto-backend:v1.1.0 .
docker run -d --name lotto-backend-green -p 8001:8000 lotto-backend:v1.1.0

# 2. Green 테스트 (로드 밸런서에서 트래픽 전환 전)
curl http://localhost:8001/api/recommendations?use_ml=true

# 3. 트래픽 전환 (Nginx)
# Blue (8000) → Green (8001)

# 4. Blue 종료 (30분 후)
docker stop lotto-backend-blue
```

### 롤백 절차
```bash
# 문제 발생 시 즉시 롤백
docker stop lotto-backend-green
# Blue로 트래픽 복구 (Nginx 설정 원복)
```

---

## 다음 단계

### 즉시 착수 (Phase 1)
1. ✅ ML 디렉토리 구조 생성
2. ✅ 데이터 전처리 파이프라인 구현
3. ✅ 모델 저장/로드 유틸리티 구현

### 단기 목표 (Phase 2-3)
1. Random Forest 모델 학습 및 추론 구현
2. 기존 RecommendationEngine 통합
3. 추천 API 엔드포인트 수정

### 중기 목표 (Phase 4)
1. 자동 재학습 스케줄러 구현
2. 모델 정확도 모니터링 시스템 구축
3. 관리자 알림 시스템 통합

### 장기 목표 (Phase 5)
1. 모델 선택 UI 개발 (고급 사용자용)
2. LSTM 딥러닝 모델 실험
3. 하이퍼파라미터 자동 튜닝

---

**문서 버전**: v0.0.1
**작성일**: 2025-11-02
**다음 업데이트**: Phase 1 완료 후 (구현 결과 반영)
