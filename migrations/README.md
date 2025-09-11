# 마이그레이션 파일들

## 📁 디렉토리 구조
- `backups/`: 데이터베이스 백업 파일들 (Git 제외)
- `scripts/`: 마이グ레이션 스크립트들 (Git 포함)

## 🔧 스크립트 설명
- `simple_cleanup.sql`: 사용자 데이터 정리
- `update_lotto_dates.sql`: 로또 추첨일 날짜 수정  
- `verify_migration.sql`: 마이그레이션 검증
- `rollback_migration.sql`: 롤백용 스크립트
- `cleanup_users.sql`: 사용자 계정 정리

## 📋 사용법
1. Railway PostgreSQL 연결
2. 스크립트 순서대로 실행
3. `verify_migration.sql`로 검증