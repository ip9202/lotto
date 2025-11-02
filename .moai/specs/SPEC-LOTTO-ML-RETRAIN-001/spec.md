---
id: LOTTO-ML-RETRAIN-001
version: 1.0.0
status: implemented
created: 2025-11-03
updated: 2025-11-03
author: @ip9202
priority: medium
category: component
labels:
  - retraining
  - scheduler
  - automation
  - machine-learning
parent_spec: LOTTO-ML-001
scope:
  packages:
    - backend/app/services/ml
  files:
    - retraining_scheduler.py
    - retrain_metadata.py
---

# @SPEC:LOTTO-ML-RETRAIN-001: ML 모델 자동 재학습 스케줄러

## HISTORY

### v1.0.0 (2025-11-03)
- **IMPLEMENTED**: ML 모델 자동 재학습 스케줄러 구현 완료
- **AUTHOR**: @ip9202
- **PARENT**: @SPEC:LOTTO-ML-001 (머신러닝 기반 예측 알고리즘)
- **SCOPE**: 주간 자동 재학습, 메타데이터 추적, 실패 처리, 수동 트리거
- **CONTEXT**: 매주 화요일 자정(KST) 신규 당첨 데이터로 모델 업데이트

---

## 개요

APScheduler를 사용하여 매주 화요일 자정(KST)에 자동으로 모델을 재학습하고, 메타데이터를 추적하며, 실패 시 안전하게 폴백합니다.

**핵심 기능**:
- 주간 자동 재학습 (매주 화요일 00:00 KST)
- 재학습 메타데이터 추적 (성공/실패, 정확도, 타임스탬프)
- 실패 시 이전 모델 유지 (서비스 중단 없음)
- 수동 재학습 트리거 (즉시 실행)

---

## Requirements (요구사항)

### Ubiquitous Requirements (기본 기능)

#### UR-001: 주간 재학습 스케줄
**The system shall schedule weekly retraining on Tuesday midnight (KST).**
- APScheduler CronTrigger 사용
- 요일: 화요일 (day_of_week='tue')
- 시각: 00:00 (hour=0, minute=0)
- 타임존: Asia/Seoul (KST)

#### UR-002: 재학습 파이프라인
**The system shall execute complete retraining pipeline.**
- 1단계: 데이터 로드 (data_preprocessor.load_draw_data)
- 2단계: 데이터 검증 (최소 500회차 확인)
- 3단계: 피처 추출 (data_preprocessor.extract_features)
- 4단계: Train/Test 분할 (80/20)
- 5단계: 모델 학습 (model_trainer.train_model)
- 6단계: 모델 평가 (model_trainer.evaluate_model)
- 7단계: 모델 저장 (model_trainer.save_trained_model)
- 8단계: 메타데이터 업데이트

#### UR-003: 메타데이터 추적
**The system shall track retraining metadata.**
- 마지막 재학습 시각 (last_retrain_time)
- 상태 (success/failed/running/never_trained)
- 에러 메시지 (실패 시)
- 모델 버전 (lotto_model_YYYYMMDD_HHMMSS)
- 정확도 (accuracy)
- 학습 샘플 수 (training_samples)

#### UR-004: 실패 처리
**The system shall handle retraining failures gracefully.**
- 에러 로깅 (full traceback)
- 메타데이터에 실패 상태 기록
- 이전 모델 유지 (변경 없음)
- 알림 전송 (TODO: 이메일/Slack)

---

### Event-driven Requirements (이벤트 기반 요구사항)

#### ED-001: 화요일 자정 자동 실행
**WHEN Tuesday midnight (KST) arrives, the system shall trigger retraining.**
- APScheduler 작업 실행
- perform_retraining() 메서드 호출
- 백그라운드 실행 (블로킹 없음)

#### ED-002: 데이터 부족 시 중단
**WHEN training data is less than 500 draws, the system shall abort retraining.**
- ValueError 발생
- 에러 메시지: "Insufficient training data: {count} draws (minimum 500 required)"
- 메타데이터에 실패 기록

---

### State-driven Requirements (상태 기반 요구사항)

#### SD-001: 학습 중 이전 모델 사용
**WHILE retraining is running, the system shall use previous model for inference.**
- 메타데이터 상태 = 'running'
- 추론 요청 시 이전 모델 사용
- 새 모델 배포 후 상태 = 'success'

#### SD-002: 동시 재학습 방지
**WHILE retraining is running, the system shall reject new retraining requests.**
- 메타데이터 상태 체크 (status == 'running')
- 새 요청 거부 및 경고 로그
- 반환: False

---

### Unwanted Behaviors (피해야 할 동작)

#### UB-001: 서비스 중단 방지
**The system shall NOT interrupt service during retraining.**
- 이전 모델 파일 보존
- 새 모델 배포 시에만 교체
- 원자적 파일 교체 (atomic swap)

#### UB-002: 메모리 누수 방지
**The system shall NOT leak memory during retraining.**
- 학습 완료 후 메모리 해제
- 대용량 DataFrame 명시적 삭제
- 가비지 컬렉션 호출

---

## Implementation Details (구현 세부사항)

### 구현된 클래스: RetrainingScheduler

#### 메서드

1. **__init__(db_session, metadata_path=None)** - 초기화
   - 데이터베이스 세션 저장
   - RetrainMetadata 인스턴스 생성
   - APScheduler BackgroundScheduler 초기화 (KST 타임존)

2. **schedule_retraining()** - 스케줄 등록
   - CronTrigger 생성 (화요일 00:00 KST)
   - perform_retraining 작업 등록
   - 작업 ID: 'weekly_retrain'

3. **start()** - 스케줄러 시작
   - schedule_retraining() 호출
   - scheduler.start() 실행
   - _is_running 플래그 True

4. **stop()** - 스케줄러 중지
   - scheduler.shutdown(wait=True)
   - _is_running 플래그 False

5. **perform_retraining()** - 재학습 실행
   - 동시 실행 방지 체크
   - 전체 재학습 파이프라인 실행
   - 성공 시 메타데이터 업데이트 (mark_training_success)
   - 실패 시 에러 핸들링 (handle_retraining_failure)
   - 반환: bool (성공 여부)

6. **handle_retraining_failure(error)** - 실패 처리
   - 에러 로깅 (full traceback)
   - 메타데이터 업데이트 (mark_training_failure)
   - 이전 모델 보존 확인
   - TODO: 관리자 알림

7. **get_retraining_status()** - 상태 조회
   - 메타데이터 딕셔너리 반환
   - 반환: {'last_retrain_time', 'status', 'error_message', 'model_version', 'accuracy', 'training_samples'}

8. **trigger_immediate_retrain()** - 수동 트리거
   - 즉시 perform_retraining() 호출
   - 반환: bool (성공 여부)

### 상수

```python
KST_TIMEZONE = pytz.timezone('Asia/Seoul')
MIN_TRAINING_SAMPLES = 500
TEST_SIZE_RATIO = 0.2
RANDOM_SEED = 42
N_ESTIMATORS = 100
```

### 메타데이터 구조

```json
{
  "last_retrain_time": "2025-11-03T00:00:00+09:00",
  "status": "success",
  "error_message": null,
  "model_version": "lotto_model_20251103_000000",
  "accuracy": 0.75,
  "training_samples": 800
}
```

---

## Performance Metrics (성능 지표)

### 재학습 성능
- **실행 시각**: 매주 화요일 00:00 KST
- **실행 시간**: 3-5분 (1000회차 데이터 기준)
- **최소 데이터**: 500회차
- **성공률**: 95% 이상 (정상 상황)

---

## Traceability (@TAG 체인)

### SPEC → CODE 연결
- @SPEC:LOTTO-ML-RETRAIN-001 → @CODE:LOTTO-ML-RETRAIN-001
  - `backend/app/services/ml/retraining_scheduler.py`: 스케줄러 로직
  - `backend/app/services/ml/retrain_metadata.py`: 메타데이터 관리

### CODE → TEST 연결
- @CODE:LOTTO-ML-RETRAIN-001 → @TEST:LOTTO-ML-RETRAIN-001
  - `tests/services/ml/test_retraining_scheduler.py`: 스케줄링, 재학습, 실패 처리 테스트

### CODE → DOC 연결
- @CODE:LOTTO-ML-RETRAIN-001 → @DOC:LOTTO-ML-RETRAIN-001
  - `docs/ML_OPERATIONS.md`: 재학습 운영 가이드
  - `docs/ARCHITECTURE.md`: 스케줄러 아키텍처

---

## References

### 기술 문서
- APScheduler: https://apscheduler.readthedocs.io/
- pytz Timezone: https://pythonhosted.org/pytz/

### 관련 SPEC
- @SPEC:LOTTO-ML-001: 머신러닝 기반 예측 알고리즘 (부모 SPEC)
- @SPEC:LOTTO-ML-MONITOR-001: 정확도 모니터링 (연계)

---

**문서 상태**: Implemented (v1.0.0)
**구현 완료일**: 2025-11-02
**마지막 검증**: 2025-11-03
