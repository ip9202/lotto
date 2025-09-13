-- 로또 draws 테이블에 구매기간 컬럼 추가
-- 2025-09-14: 구매기간 정보를 데이터베이스에 저장하기 위한 마이그레이션

ALTER TABLE lotto_draws 
ADD COLUMN purchase_start_date DATE,
ADD COLUMN purchase_end_date DATE;

-- 기존 데이터에 대해 구매기간 자동 계산 및 업데이트
-- 로또는 매주 토요일 추첨이므로, 전주 일요일부터 추첨일(토요일)까지가 구매기간

-- 1189회차 (2025-09-13 토요일 추첨)
UPDATE lotto_draws 
SET purchase_start_date = '2025-09-07', 
    purchase_end_date = '2025-09-13'
WHERE draw_number = 1189;

-- 1188회차 (2025-09-06 토요일 추첨)  
UPDATE lotto_draws 
SET purchase_start_date = '2025-08-31', 
    purchase_end_date = '2025-09-06'
WHERE draw_number = 1188;

-- 1187회차 (2025-08-30 토요일 추첨)
UPDATE lotto_draws 
SET purchase_start_date = '2025-08-24', 
    purchase_end_date = '2025-08-30'
WHERE draw_number = 1187;

-- 1186회차 (2025-08-23 토요일 추첨)
UPDATE lotto_draws 
SET purchase_start_date = '2025-08-17', 
    purchase_end_date = '2025-08-23'
WHERE draw_number = 1186;

-- 다른 회차들에 대해서도 자동 계산 (draw_date가 토요일이라고 가정)
UPDATE lotto_draws 
SET purchase_start_date = draw_date - INTERVAL '6 days',
    purchase_end_date = draw_date
WHERE purchase_start_date IS NULL 
  AND purchase_end_date IS NULL
  AND draw_date IS NOT NULL;

-- 업데이트 결과 확인
SELECT draw_number, draw_date, purchase_start_date, purchase_end_date,
       CONCAT(TO_CHAR(purchase_start_date, 'MM/DD'), ' ~ ', TO_CHAR(purchase_end_date, 'MM/DD')) as purchase_period
FROM lotto_draws 
WHERE draw_number >= 1186
ORDER BY draw_number DESC;
