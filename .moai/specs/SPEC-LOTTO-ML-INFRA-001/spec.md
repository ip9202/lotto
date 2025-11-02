---
id: LOTTO-ML-INFRA-001
version: 1.0.0
status: implemented
created: 2025-11-03
updated: 2025-11-03
author: @ip9202
priority: medium
category: infrastructure
labels:
  - model-management
  - utilities
  - infrastructure
parent_spec: LOTTO-ML-001
scope:
  packages:
    - backend/app/services/ml
    - backend/app/models/ml
  files:
    - model_utils.py
    - __init__.py
---

# @SPEC:LOTTO-ML-INFRA-001: ML 인프라 및 모델 관리 유틸리티

## HISTORY

### v1.0.0 (2025-11-03)
- **IMPLEMENTED**: ML 인프라 및 모델 관리 유틸리티 구현 완료
- **AUTHOR**: @ip9202
- **PARENT**: @SPEC:LOTTO-ML-001 (머신러닝 기반 예측 알고리즘)
- **SCOPE**: 모델 저장/로드, 경로 관리, 메타데이터 관리
- **CONTEXT**: ML 모듈의 공통 인프라 및 유틸리티 함수

---

## 개요

ML 모델을 디스크에 저장하고 로드하며, 최신 모델 경로를 조회하고, 메타데이터를 관리하는 인프라 유틸리티입니다.

**핵심 기능**:
- 모델 저장 (joblib 직렬화)
- 모델 로드 (joblib 역직렬화)
- 최신 모델 경로 조회
- 메타데이터 JSON 저장
- 디렉토리 구조 관리

---

## Requirements (요구사항)

### Ubiquitous Requirements (기본 기능)

#### UR-001: 모델 저장
**The system shall save ML model to disk using joblib.**
- joblib.dump()로 모델 직렬화
- 파일 형식: .pkl
- 파일명 규칙: `lotto_model_YYYYMMDD.pkl`
- 저장 위치: `backend/app/models/ml/trained/`

#### UR-002: 모델 로드
**The system shall load ML model from disk using joblib.**
- joblib.load()로 모델 역직렬화
- 파일 존재 확인 (FileNotFoundError)
- 반환: 로드된 모델 객체

#### UR-003: 최신 모델 조회
**The system shall find the most recently saved model.**
- glob으로 `lotto_model_*.pkl` 검색
- 파일 수정 시각 기준 최신 선택
- 모델 없을 시 None 반환

#### UR-004: 메타데이터 저장
**The system shall save model metadata as JSON.**
- JSON 형식으로 메타데이터 저장
- 파일명: `{model_name}_metadata.json`
- 저장 위치: `backend/app/models/ml/metadata/`
- 인코딩: UTF-8, indent=2, ensure_ascii=False

---

### State-driven Requirements (상태 기반 요구사항)

#### SD-001: 디렉토리 자동 생성
**WHILE target directory does not exist, the system shall create it.**
- Path.mkdir(parents=True, exist_ok=True)
- 디렉토리: trained/, metadata/, backups/

#### SD-002: 모델 없을 시 None 반환
**WHILE no model exists, the system shall return None from get_latest_model_path().**
- 빈 리스트일 경우 None 반환
- 에러를 발생시키지 않음

---

### Unwanted Behaviors (피해야 할 동작)

#### UB-001: 덮어쓰기 방지
**The system shall NOT overwrite existing models without backup.**
- 동일 파일명 저장 시 기존 파일 백업
- 백업 위치: `backend/app/models/ml/backups/`

#### UB-002: 메타데이터 손실 방지
**The system shall NOT save model without metadata.**
- 메타데이터 없이 모델 저장 허용
- 하지만 경고 로그 출력

---

## Implementation Details (구현 세부사항)

### 디렉토리 구조

```
backend/app/
├── models/
│   └── ml/
│       ├── trained/          # 학습된 모델 파일 (.pkl)
│       │   ├── lotto_model_20251102.pkl
│       │   └── lotto_model_20251103_000000.pkl
│       ├── metadata/         # 모델 메타데이터 (.json)
│       │   ├── lotto_model_20251102_metadata.json
│       │   ├── lotto_model_20251103_000000_metadata.json
│       │   └── predictions/  # 예측 기록 (accuracy_monitor)
│       └── backups/          # 백업 모델
│           └── lotto_model_20251101.pkl
└── services/
    └── ml/
        ├── __init__.py       # 모듈 초기화
        └── model_utils.py    # 유틸리티 함수
```

### 구현된 함수

1. **save_model(model, model_name=None, metadata=None)** - 모델 저장
   - 디렉토리 생성 (TRAINED_DIR, METADATA_DIR)
   - 파일명 생성 (model_name 또는 타임스탬프)
   - joblib.dump() 호출
   - 메타데이터 JSON 저장 (있을 경우)
   - 반환: 저장된 모델 경로 (str)

2. **load_model(model_path)** - 모델 로드
   - 파일 존재 확인 (os.path.exists)
   - joblib.load() 호출
   - 반환: 로드된 모델 객체

3. **get_latest_model_path()** - 최신 모델 조회
   - 디렉토리 생성 (TRAINED_DIR)
   - glob으로 `lotto_model_*.pkl` 검색
   - max(key=os.path.getmtime)로 최신 선택
   - 반환: 최신 모델 경로 (str) 또는 None

### 상수

```python
_CURRENT_FILE = Path(__file__).resolve()
_APP_DIR = _CURRENT_FILE.parent.parent.parent
MODEL_BASE_DIR = _APP_DIR / "models" / "ml"
TRAINED_DIR = MODEL_BASE_DIR / "trained"
METADATA_DIR = MODEL_BASE_DIR / "metadata"
BACKUP_DIR = MODEL_BASE_DIR / "backups"
```

### 메타데이터 예시

```json
{
  "saved_at": "2025-11-03T00:00:00+09:00",
  "model_type": "RandomForestClassifier",
  "n_estimators": 100,
  "max_depth": null,
  "accuracy": 0.75,
  "training_samples": 800,
  "test_samples": 200,
  "model_version": "lotto_model_20251103_000000"
}
```

---

## Performance Metrics (성능 지표)

### 저장/로드 성능
- **저장 시간**: < 1초 (100MB 모델 기준)
- **로드 시간**: < 0.5초 (100MB 모델 기준)
- **디스크 용량**: 50-100MB per model

### 최신 모델 조회 성능
- **조회 시간**: < 0.1초 (파일 100개 이하)
- **glob 오버헤드**: 무시 가능

---

## Error Handling (에러 처리)

### 예외 케이스

1. **모델이 None일 경우**
   - save_model()에서 ValueError 발생
   - 에러 메시지: "Model cannot be None"

2. **모델 파일이 없을 경우**
   - load_model()에서 FileNotFoundError 발생
   - 에러 메시지: "Model file not found: {path}"

3. **저장/로드 실패**
   - save_model()에서 IOError 발생
   - load_model()에서 IOError 발생
   - 원본 예외를 래핑하여 재발생

---

## Traceability (@TAG 체인)

### SPEC → CODE 연결
- @SPEC:LOTTO-ML-INFRA-001 → @CODE:LOTTO-ML-INFRA-001
  - `backend/app/services/ml/model_utils.py`: 모델 유틸리티 함수
  - `backend/app/services/ml/__init__.py`: 모듈 초기화

### CODE → TEST 연결
- @CODE:LOTTO-ML-INFRA-001 → @TEST:LOTTO-ML-INFRA-001
  - `tests/services/ml/test_model_utils.py`: 저장/로드/조회 테스트

### CODE → DOC 연결
- @CODE:LOTTO-ML-INFRA-001 → @DOC:LOTTO-ML-INFRA-001
  - `docs/ML_ENGINE.md`: 모델 관리 섹션
  - `docs/ML_OPERATIONS.md`: 모델 배포 및 백업

---

## References

### 기술 문서
- joblib Documentation: https://joblib.readthedocs.io/
- Python pathlib: https://docs.python.org/3/library/pathlib.html

### 관련 SPEC
- @SPEC:LOTTO-ML-001: 머신러닝 기반 예측 알고리즘 (부모 SPEC)
- @SPEC:LOTTO-ML-MODEL-001: 모델 학습 (사용처)
- @SPEC:LOTTO-ML-RETRAIN-001: 재학습 스케줄러 (사용처)

---

**문서 상태**: Implemented (v1.0.0)
**구현 완료일**: 2025-11-02
**마지막 검증**: 2025-11-03
