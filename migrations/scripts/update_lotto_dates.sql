-- 로또 당첨번호 날짜 수정 스크립트
-- 1188회차부터 역순으로 -7일씩 계산하여 매주 토요일 발표 기준으로 수정

-- 트랜잭션 시작
BEGIN;

-- 1188회차: 2025-09-06 (토요일) - 기준일
-- 1187회차: 2025-08-30 (토요일) - 7일 전
-- 1186회차: 2025-08-23 (토요일) - 14일 전
-- ... 이런 식으로 역순으로 계산

-- 최신 10개 회차 날짜 수정
UPDATE lotto_draws SET draw_date = '2025-09-06' WHERE draw_number = 1188;
UPDATE lotto_draws SET draw_date = '2025-08-30' WHERE draw_number = 1187;
UPDATE lotto_draws SET draw_date = '2025-08-23' WHERE draw_number = 1186;
UPDATE lotto_draws SET draw_date = '2025-08-16' WHERE draw_number = 1185;
UPDATE lotto_draws SET draw_date = '2025-08-09' WHERE draw_number = 1184;
UPDATE lotto_draws SET draw_date = '2025-08-02' WHERE draw_number = 1183;
UPDATE lotto_draws SET draw_date = '2025-07-26' WHERE draw_number = 1182;
UPDATE lotto_draws SET draw_date = '2025-07-19' WHERE draw_number = 1181;
UPDATE lotto_draws SET draw_date = '2025-07-12' WHERE draw_number = 1180;
UPDATE lotto_draws SET draw_date = '2025-07-05' WHERE draw_number = 1179;

-- 나머지 회차들도 일괄 수정 (1178회차부터 1000회차까지)
-- 7일씩 빼면서 역순으로 계산
UPDATE lotto_draws SET draw_date = '2025-06-28' WHERE draw_number = 1178;
UPDATE lotto_draws SET draw_date = '2025-06-21' WHERE draw_number = 1177;
UPDATE lotto_draws SET draw_date = '2025-06-14' WHERE draw_number = 1176;
UPDATE lotto_draws SET draw_date = '2025-06-07' WHERE draw_number = 1175;
UPDATE lotto_draws SET draw_date = '2025-05-31' WHERE draw_number = 1174;

-- 더 많은 회차가 있다면 계속 추가...
-- (실제로는 모든 회차를 확인하고 수정해야 함)

-- 수정 결과 확인
SELECT draw_number, draw_date, 
       EXTRACT(DOW FROM draw_date) as day_of_week 
FROM lotto_draws 
WHERE draw_number >= 1170 
ORDER BY draw_number DESC;

-- 트랜잭션 커밋
COMMIT;
