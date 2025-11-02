---
id: LOTTO-ML-MONITOR-001
version: 1.0.0
status: implemented
created: 2025-11-03
updated: 2025-11-03
author: @ip9202
priority: medium
category: component
labels:
  - monitoring
  - accuracy-tracking
  - machine-learning
parent_spec: LOTTO-ML-001
scope:
  packages:
    - backend/app/services/ml
  files:
    - accuracy_monitor.py
    - prediction_record.py
---

# @SPEC:LOTTO-ML-MONITOR-001: ML 모델 정확도 모니터링

## HISTORY

### v1.0.0 (2025-11-03)
- **IMPLEMENTED**: ML 모델 정확도 모니터링 시스템 구현 완료
- **AUTHOR**: @ip9202
- **PARENT**: @SPEC:LOTTO-ML-001 (머신러닝 기반 예측 알고리즘)
- **SCOPE**: 예측 결과 추적, 정확도 계산, 건강 상태 체크, 긴급 재학습 트리거
- **CONTEXT**: 모델 성능 저하 감지 및 자동 대응

---

## 개요

ML 모델의 예측 결과를 실제 당첨 번호와 비교하여 정확도를 추적하고, 성능 저하 시 긴급 재학습을 트리거합니다.

**핵심 기능**:
- 예측 결과 기록 (predicted vs actual)
- 정확도 계산 (최근 28일 기준)
- 건강 상태 체크 (good/warning/critical)
- 긴급 재학습 트리거 (정확도 < 50% 또는 최근 10개 중 8개 실패)

---

## Requirements (요구사항)

### Ubiquitous Requirements (기본 기능)

#### UR-001: 예측 결과 추적
**The system shall track prediction results against actual winning numbers.**
- 예측 번호 (predicted_numbers)
- 실제 당첨 번호 (actual_numbers)
- 일치 개수 (match_count)
- 정확도 (accuracy = match_count / 6 * 100)
- 기록 시각 (recorded_at, KST)

#### UR-002: 정확도 계산
**The system shall calculate average accuracy over recent 28 days.**
- 최근 28일 예측 기록 로드
- 평균 일치 개수 계산
- 백분율 변환: (평균 일치 개수 / 45) * 100
- 데이터 없을 시 None 반환

#### UR-003: 건강 상태 체크
**The system shall determine model health status.**
- **GOOD**: 정확도 >= 70%
- **WARNING**: 50% <= 정확도 < 70%
- **CRITICAL**: 정확도 < 50%
- 데이터 없을 시 'good' (무죄 추정)

#### UR-004: 긴급 재학습 트리거
**The system shall trigger emergency retrain when performance degrades.**
- 트리거 조건 1: 정확도 < 50% (critical threshold)
- 트리거 조건 2: 최근 10개 예측 중 8개 이상 실패 (0-1 일치)
- 두 조건 중 하나라도 만족 시 True 반환

---

### Event-driven Requirements (이벤트 기반 요구사항)

#### ED-001: 당첨 발표 시 기록
**WHEN winning numbers are announced, the system shall compare with prediction and save record.**
- 예측 번호와 실제 번호 비교
- 일치 개수 계산
- JSON 파일로 저장
- 타임스탬프 기록 (KST)

---

### State-driven Requirements (상태 기반 요구사항)

#### SD-001: 기록 없을 시 기본값
**WHILE no records exist, the system shall return None for accuracy.**
- 정확도 계산 시 None 반환
- 건강 상태 'good' 반환 (무죄 추정)
- 긴급 재학습 False 반환

---

### Unwanted Behaviors (피해야 할 동작)

#### UB-001: 과도한 알림 방지
**The system shall NOT trigger retrain more than once per day.**
- 일일 1회 재학습 제한
- 메타데이터로 마지막 재학습 시각 추적
- 24시간 이내 재학습 요청 무시

---

## Implementation Details (구현 세부사항)

### 구현된 클래스: AccuracyMonitor

#### 메서드

1. **track_prediction(predicted_numbers, actual_numbers, draw_id, draw_date)** - 예측 기록
   - PredictionRecord.save_record() 호출
   - JSON 파일로 저장
   - 파일명: `prediction_{draw_id}.json`

2. **calculate_accuracy(days=28)** - 정확도 계산
   - 최근 N일 기록 로드
   - 평균 일치 개수 계산
   - 백분율 변환
   - 반환: float (0-100) 또는 None

3. **get_accuracy_trend(days=28)** - 정확도 트렌드
   - 일별 정확도 계산
   - 날짜별 그룹핑
   - 반환: List[{'date', 'accuracy'}]

4. **check_accuracy_health()** - 건강 상태 체크
   - 정확도 기준 분류
   - 반환: 'good' | 'warning' | 'critical'

5. **should_trigger_emergency_retrain()** - 긴급 재학습 판단
   - 조건 1: 정확도 < 50%
   - 조건 2: 최근 10개 중 8개 실패
   - 반환: bool

6. **get_monitor_status()** - 모니터링 상태 조회
   - 전체 상태 정보 반환
   - 반환: {'accuracy', 'status', 'last_update', 'records_count', 'emergency_retrain'}

### 예측 기록 구조

```json
{
  "draw_id": 1145,
  "draw_date": "2025-11-02",
  "predicted_numbers": [3, 12, 23, 31, 38, 45],
  "actual_numbers": [3, 8, 23, 29, 38, 42],
  "match_count": 3,
  "accuracy": 50.0,
  "recorded_at": "2025-11-03T14:30:00+09:00"
}
```

---

## Performance Metrics (성능 지표)

### 임계값
- **GOOD 임계값**: >= 70%
- **WARNING 임계값**: >= 50%
- **CRITICAL 임계값**: < 50%
- **긴급 재학습 임계값**: < 50% 또는 최근 10개 중 8개 실패

### 모니터링 주기
- **정확도 계산**: 최근 28일 기준
- **긴급 체크**: 최근 10개 예측 기준
- **기록 보관**: 무제한 (디스크 용량 허용 시)

---

## Traceability (@TAG 체인)

### SPEC → CODE 연결
- @SPEC:LOTTO-ML-MONITOR-001 → @CODE:LOTTO-ML-MONITOR-001
  - `backend/app/services/ml/accuracy_monitor.py`: 모니터링 로직
  - `backend/app/services/ml/prediction_record.py`: 기록 저장/로드

### CODE → TEST 연결
- @CODE:LOTTO-ML-MONITOR-001 → @TEST:LOTTO-ML-MONITOR-001
  - `tests/services/ml/test_accuracy_monitor.py`: 정확도 계산, 건강 상태, 긴급 트리거 테스트

### CODE → DOC 연결
- @CODE:LOTTO-ML-MONITOR-001 → @DOC:LOTTO-ML-MONITOR-001
  - `docs/ML_OPERATIONS.md`: 정확도 모니터링 섹션
  - `docs/ARCHITECTURE.md`: 모니터링 시스템 구조

---

## References

### 기술 문서
- pytz Timezone: https://pythonhosted.org/pytz/

### 관련 SPEC
- @SPEC:LOTTO-ML-001: 머신러닝 기반 예측 알고리즘 (부모 SPEC)
- @SPEC:LOTTO-ML-RETRAIN-001: 재학습 스케줄러 (다음 단계)

---

**문서 상태**: Implemented (v1.0.0)
**구현 완료일**: 2025-11-02
**마지막 검증**: 2025-11-03
