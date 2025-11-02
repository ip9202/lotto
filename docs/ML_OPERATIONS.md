# ML 운영 가이드

## 목차
1. [모델 재학습](#모델-재학습)
2. [정확도 모니터링](#정확도-모니터링)
3. [폴백 절차](#폴백-절차)
4. [모델 배포 및 백업](#모델-배포-및-백업)
5. [트러블슈팅](#트러블슈팅)

---

## 모델 재학습

### 자동 재학습

매주 화요일 자정(KST)에 APScheduler가 자동으로 재학습을 실행합니다.

#### 재학습 스케줄 확인

```bash
# 스케줄러 상태 확인
curl http://localhost:8000/admin/scheduler-status

# 다음 재학습 시각 확인
docker exec lotto_backend python -c "
from app.services.ml.retraining_scheduler import RetrainingScheduler
scheduler = RetrainingScheduler(db_session)
print(scheduler.get_retraining_status())
"
```

### 수동 재학습

긴급 상황이나 데이터 수정 후 즉시 재학습이 필요한 경우:

```bash
# 관리자 API로 수동 재학습 트리거
curl -X POST http://localhost:8000/admin/manual-retrain

# Python 스크립트로 직접 실행
docker exec lotto_backend python -c "
from app.services.ml.retraining_scheduler import RetrainingScheduler
from app.database import SessionLocal

db = SessionLocal()
scheduler = RetrainingScheduler(db)
success = scheduler.trigger_immediate_retrain()
print(f'Retraining success: {success}')
db.close()
"
```

### 재학습 로그 확인

```bash
# 재학습 로그 실시간 모니터링
docker logs -f lotto_backend | grep "Retraining"

# 재학습 메타데이터 확인
cat backend/app/models/ml/metadata/retrain_metadata.json
```

---

## 정확도 모니터링

### 정확도 확인

```bash
# 현재 정확도 확인
docker exec lotto_backend python -c "
from app.services.ml.accuracy_monitor import AccuracyMonitor

monitor = AccuracyMonitor()
status = monitor.get_monitor_status()

print(f'Accuracy: {status[\"accuracy\"]}%')
print(f'Health: {status[\"status\"]}')
print(f'Emergency Retrain: {status[\"emergency_retrain\"]}')
"
```

### 정확도 트렌드 분석

```bash
# 최근 28일 정확도 트렌드
docker exec lotto_backend python -c "
from app.services.ml.accuracy_monitor import AccuracyMonitor

monitor = AccuracyMonitor()
trend = monitor.get_accuracy_trend(days=28)

for entry in trend:
    print(f'{entry[\"date\"]}: {entry[\"accuracy\"]:.2f}%')
"
```

### 건강 상태 체크

| 상태 | 정확도 범위 | 액션 |
|------|------------|------|
| GOOD | >= 70% | 정상 운영 |
| WARNING | 50-70% | 모니터링 강화 |
| CRITICAL | < 50% | 긴급 재학습 실행 |

---

## 폴백 절차

### ML 실패 시 자동 폴백

시스템은 다음 상황에서 자동으로 통계 모드로 폴백합니다:

1. **모델 파일 없음**: get_latest_model_path() 반환 None
2. **추론 실패**: predict_probabilities() 예외 발생
3. **데이터 부족**: 학습 데이터 < 500회차
4. **메모리 부족**: MemoryError 발생

### 폴백 로그 확인

```bash
# 폴백 발생 확인
docker logs lotto_backend | grep "Falling back to statistical mode"

# 폴백 발생 빈도 집계
docker logs lotto_backend | grep "Falling back" | wc -l
```

### 수동 통계 모드 강제

```python
# RecommendationEngine 생성 시 use_ml_model=False 설정
recommendation_engine = RecommendationEngine(
    db_session=db,
    use_ml_model=False  # 통계 모드 강제
)
```

---

## 모델 배포 및 백업

### 모델 파일 경로

```
backend/app/models/ml/
├── trained/          # 현재 운영 모델
├── metadata/         # 모델 메타데이터 + 예측 기록
└── backups/          # 백업 모델
```

### 모델 백업

```bash
# 현재 모델 백업
CURRENT_MODEL=$(ls -t backend/app/models/ml/trained/*.pkl | head -n1)
BACKUP_PATH="backend/app/models/ml/backups/$(basename $CURRENT_MODEL)"

cp "$CURRENT_MODEL" "$BACKUP_PATH"
echo "Backed up to: $BACKUP_PATH"
```

### 모델 복원

```bash
# 백업에서 복원
BACKUP_MODEL="backend/app/models/ml/backups/lotto_model_20251101.pkl"
TARGET_PATH="backend/app/models/ml/trained/$(basename $BACKUP_MODEL)"

cp "$BACKUP_MODEL" "$TARGET_PATH"
echo "Restored from: $BACKUP_MODEL"

# 서비스 재시작
docker-compose restart backend
```

### 모델 삭제 (디스크 공간 확보)

```bash
# 30일 이전 모델 삭제
find backend/app/models/ml/trained -name "lotto_model_*.pkl" -mtime +30 -delete
find backend/app/models/ml/metadata -name "lotto_model_*_metadata.json" -mtime +30 -delete

echo "Old models cleaned up"
```

---

## 트러블슈팅

### 문제 1: 재학습 실패

**증상**: 메타데이터 상태 = 'failed'

**진단**:
```bash
# 메타데이터 확인
cat backend/app/models/ml/metadata/retrain_metadata.json

# 에러 로그 확인
docker logs lotto_backend | grep "Retraining failed"
```

**해결**:
1. 데이터 부족 확인 (최소 500회차 필요)
   ```sql
   SELECT COUNT(*) FROM lotto_draws;
   ```
2. 메모리 부족 확인
   ```bash
   docker stats lotto_backend
   ```
3. 수동 재학습 재시도
   ```bash
   curl -X POST http://localhost:8000/admin/manual-retrain
   ```

---

### 문제 2: 정확도 급격히 하락

**증상**: 정확도 < 50%, 건강 상태 = 'critical'

**진단**:
```bash
# 최근 10개 예측 결과 확인
ls -lt backend/app/models/ml/metadata/predictions/*.json | head -10
```

**해결**:
1. 긴급 재학습 자동 트리거 대기 (시스템이 자동 감지)
2. 또는 수동 긴급 재학습 실행
   ```bash
   curl -X POST http://localhost:8000/admin/emergency-retrain
   ```

---

### 문제 3: 추론 시간 초과

**증상**: 추론 시간 > 1초

**진단**:
```python
import time

start = time.time()
# 추론 실행
combinations = inference_engine.predict_probabilities(model, features)
elapsed = time.time() - start

print(f"Inference time: {elapsed:.2f}s")
```

**해결**:
1. 모델 경량화 (n_estimators 감소)
   ```python
   # 100 → 50으로 감소
   model = RandomForestClassifier(n_estimators=50)
   ```
2. 피처 개수 감소 (145 → 100)
   - 상관관계 피처 제거 고려
3. 캐싱 활성화
   ```python
   # 최근 10개 조합 캐시
   cache = {}
   ```

---

### 문제 4: 모델 파일 손상

**증상**: joblib.load() 실패

**진단**:
```python
import joblib

try:
    model = joblib.load("path/to/model.pkl")
except Exception as e:
    print(f"Model file corrupted: {e}")
```

**해결**:
1. 백업에서 복원
   ```bash
   cp backend/app/models/ml/backups/lotto_model_*.pkl backend/app/models/ml/trained/
   ```
2. 또는 긴급 재학습 실행
   ```bash
   curl -X POST http://localhost:8000/admin/manual-retrain
   ```

---

## 성능 튜닝

### 하이퍼파라미터 튜닝

```python
from sklearn.model_selection import GridSearchCV

param_grid = {
    'n_estimators': [50, 100, 200],
    'max_depth': [None, 10, 20, 30],
    'min_samples_split': [2, 5, 10],
    'min_samples_leaf': [1, 2, 4]
}

grid_search = GridSearchCV(
    RandomForestClassifier(),
    param_grid,
    cv=5,
    scoring='accuracy',
    n_jobs=-1
)

grid_search.fit(X_train, y_train)
print(f"Best params: {grid_search.best_params_}")
print(f"Best score: {grid_search.best_score_}")
```

### 메모리 최적화

```python
# 데이터 타입 최적화
features = features.astype('float32')  # float64 → float32

# 증분 학습 (대용량 데이터)
from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier(warm_start=True)
for chunk in data_chunks:
    model.fit(chunk_X, chunk_y)
```

---

## 모니터링 대시보드 (추천)

### Grafana + Prometheus 설정

```yaml
# docker-compose.yml
services:
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - ./grafana:/var/lib/grafana

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

### 메트릭 수집

```python
# ML 메트릭 엑스포트
from prometheus_client import Gauge, Counter

accuracy_gauge = Gauge('ml_accuracy', 'Model accuracy percentage')
inference_time = Gauge('ml_inference_time_seconds', 'Inference time')
retrain_counter = Counter('ml_retrains_total', 'Total retraining count')

# 메트릭 업데이트
accuracy_gauge.set(monitor.calculate_accuracy())
```

---

## 참조 문서

- **ML 엔진**: `docs/ML_ENGINE.md`
- **SPEC**: `.moai/specs/SPEC-LOTTO-ML-001/spec.md`
- **아키텍처**: `docs/ARCHITECTURE.md`
- **API 문서**: `docs/API.md`
