# 🎯 로또 당첨번호 데이터 수집 가이드

## 📋 개요
LottoGenius 서비스가 정확한 AI 추천을 제공하기 위해서는 1회차부터 현재까지의 모든 당첨번호 데이터가 필요합니다.

## 🔍 데이터 소스

### **1. 동행복권 공식 사이트**
- **URL**: https://www.dhlottery.co.kr/
- **경로**: 당첨번호 → 회차별 당첨번호
- **데이터**: 1회차부터 현재까지 모든 당첨번호

### **2. 공개 API (비공식)**
- **GitHub**: https://github.com/jojoldu/lotto
- **설명**: 한국 로또 당첨번호 크롤링 및 API 제공
- **장점**: 자동화 가능, 정기 업데이트
- **단점**: 비공식, 안정성 보장 불가

### **3. 수동 데이터 수집**
- **방법**: 동행복권 사이트에서 직접 복사
- **장점**: 정확성 보장, 공식 데이터
- **단점**: 시간 소요, 실수 가능성

## 🛠 데이터 수집 방법

### **방법 1: 자동 크롤링 (fetch_lotto_data.py)**

#### **사용법:**
```bash
cd backend
python scripts/fetch_lotto_data.py
```

#### **특징:**
- 동행복권 사이트에서 자동으로 데이터 수집
- 1회차부터 최신 회차까지 자동 수집
- 서버 부하 방지를 위한 딜레이 포함
- 데이터베이스에 자동 저장

#### **주의사항:**
- 실제 사이트 구조에 맞게 파싱 패턴 수정 필요
- 사이트 정책 변경 시 스크립트 수정 필요
- 과도한 요청으로 인한 IP 차단 가능성

### **방법 2: 수동 데이터 입력 (manual_lotto_data.py)**

#### **사용법:**
```bash
cd backend
python scripts/manual_lotto_data.py
```

#### **옵션:**
1. **샘플 데이터 추가**: 테스트용 샘플 데이터 5개 추가
2. **대화형 데이터 입력**: 회차별로 직접 입력
3. **종료**: 프로그램 종료

#### **입력 형식:**
```
회차 번호: 1195
당첨번호 6개: 3,7,12,15,28,45
보너스 번호: 13
당첨일: 2025-08-23
1등 당첨자 수: 0
1등 당첨금: 0
```

### **방법 3: 엑셀 파일에서 일괄 입력**

#### **준비:**
1. 동행복권 사이트에서 엑셀 파일 다운로드
2. 데이터 형식에 맞게 정리
3. CSV 또는 JSON 형태로 변환

#### **스크립트 실행:**
```bash
cd backend
python scripts/load_lotto_data.py
```

## 📊 데이터 형식

### **필수 필드:**
- `draw_number`: 회차 번호 (정수)
- `numbers`: 당첨번호 6개 (정수 배열)
- `bonus_number`: 보너스 번호 (정수)
- `draw_date`: 당첨일 (날짜)

### **선택 필드:**
- `first_winners`: 1등 당첨자 수 (정수)
- `first_amount`: 1등 당첨금 (정수)

### **예시 데이터:**
```json
{
  "draw_number": 1195,
  "numbers": [3, 7, 12, 15, 28, 45],
  "bonus_number": 13,
  "draw_date": "2025-08-23",
  "first_winners": 0,
  "first_amount": 0
}
```

## 🚀 빠른 시작

### **1. 샘플 데이터로 테스트**
```bash
# conda 환경 활성화
conda activate py3_12

# 데이터베이스 시작
docker-compose up -d postgres

# 샘플 데이터 추가
cd backend
python scripts/manual_lotto_data.py
# 옵션 1 선택 (샘플 데이터 추가)
```

### **2. 실제 데이터 수집**
```bash
# 자동 크롤링 시도
python scripts/fetch_lotto_data.py

# 또는 수동 입력
python scripts/manual_lotto_data.py
# 옵션 2 선택 (대화형 데이터 입력)
```

### **3. 데이터 확인**
```bash
# 데이터베이스 연결 확인
python -c "
from app.database import SessionLocal
from app.models.lotto import LottoDraw
db = SessionLocal()
count = db.query(LottoDraw).count()
print(f'총 {count}개 회차 데이터가 있습니다.')
db.close()
"
```

## ⚠️ 주의사항

### **법적 고려사항:**
- 동행복권 공식 사이트 크롤링 시 이용약관 확인
- 과도한 요청으로 인한 서비스 방해 금지
- 수집된 데이터의 상업적 이용 제한

### **기술적 고려사항:**
- 사이트 구조 변경 시 스크립트 수정 필요
- 데이터 정확성 검증 필수
- 정기적인 데이터 업데이트 필요

### **데이터 품질:**
- 중복 데이터 방지
- 누락된 데이터 확인
- 데이터 형식 검증

## 🔄 정기 업데이트

### **자동화 방안:**
1. **Cron Job**: 주기적으로 스크립트 실행
2. **GitHub Actions**: 정기적인 데이터 수집 및 커밋
3. **Docker Cron**: 컨테이너 내에서 정기 실행

### **수동 업데이트:**
- 매주 새로운 당첨번호 발표 후 수동 입력
- 월 1회 전체 데이터 정합성 검증
- 분기별 데이터 백업

## 📚 참고 자료

### **공식 문서:**
- 동행복권 이용약관
- 로또 6/45 게임 규칙

### **기술 문서:**
- Python requests 라이브러리 문서
- SQLAlchemy ORM 가이드
- PostgreSQL 데이터 타입 참조

### **커뮤니티:**
- GitHub 로또 관련 프로젝트
- Python 웹 스크래핑 커뮤니티
- 로또 분석 커뮤니티

---

**💡 이 가이드를 따라하면 LottoGenius 서비스에 필요한 모든 당첨번호 데이터를 수집할 수 있습니다.**
