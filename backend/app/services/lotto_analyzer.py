from typing import Dict, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..models.lotto import LottoDraw

class LottoAnalyzer:
    def __init__(self, db_session: Session):
        self.db = db_session
    
    def get_total_draws(self) -> int:
        """총 추첨 회수 반환"""
        return self.db.query(LottoDraw).count()
    
    def get_latest_draw_number(self) -> int:
        """최신 회차 번호 반환"""
        latest = self.db.query(LottoDraw).order_by(LottoDraw.draw_number.desc()).first()
        return latest.draw_number if latest else 0
    
    def calculate_frequency_statistics(self) -> Dict[int, dict]:
        """번호별 출현 빈도 통계"""
        query = text("""
        WITH number_frequency AS (
            SELECT 
                number,
                COUNT(*) as total_appearances,
                MAX(draw_number) as last_appearance
            FROM (
                SELECT draw_number, number_1 as number FROM lotto_draws UNION ALL
                SELECT draw_number, number_2 as number FROM lotto_draws UNION ALL
                SELECT draw_number, number_3 as number FROM lotto_draws UNION ALL
                SELECT draw_number, number_4 as number FROM lotto_draws UNION ALL
                SELECT draw_number, number_5 as number FROM lotto_draws UNION ALL
                SELECT draw_number, number_6 as number FROM lotto_draws
            ) all_numbers
            GROUP BY number
        )
        SELECT 
            number,
            total_appearances,
            ROUND(total_appearances * 100.0 / (SELECT COUNT(*) FROM lotto_draws), 2) as frequency_percent,
            last_appearance,
            (SELECT MAX(draw_number) FROM lotto_draws) - last_appearance as gap
        FROM number_frequency
        ORDER BY number
        """)
        
        result = self.db.execute(query).fetchall()
        
        stats = {}
        for row in result:
            stats[row.number] = {
                'total_appearances': row.total_appearances,
                'frequency_percent': row.frequency_percent,
                'last_appearance': row.last_appearance,
                'gap_since_last': row.gap
            }
        
        return stats
    
    def calculate_recent_trends(self, recent_draws: int = 20) -> Dict[int, dict]:
        """최근 트렌드 분석"""
        # 최근 회차 데이터 조회
        recent_query = text(f"""
            SELECT number_1, number_2, number_3, number_4, number_5, number_6
            FROM lotto_draws 
            ORDER BY draw_number DESC 
            LIMIT {recent_draws}
        """)
        
        recent_result = self.db.execute(recent_query).fetchall()
        
        # 번호별 출현 횟수 계산
        number_counts = {}
        for row in recent_result:
            for number in [row.number_1, row.number_2, row.number_3, row.number_4, row.number_5, row.number_6]:
                number_counts[number] = number_counts.get(number, 0) + 1
        
        # 1-45 모든 번호에 대해 트렌드 계산
        trends = {}
        for number in range(1, 46):
            count = number_counts.get(number, 0)
            percent = round(count * 100.0 / recent_draws, 2)
            
            # 핫/콜드 상태 결정
            if count >= 4:
                status = 'HOT'
            elif count <= 1:
                status = 'COLD'
            else:
                status = 'NORMAL'
            
            trends[number] = {
                'recent_appearances': count,
                'recent_percent': percent,
                'status': status
            }
        
        return trends
    
    def get_hot_cold_numbers(self, recent_draws: int = 20) -> Tuple[List[int], List[int]]:
        """핫/콜드 넘버 반환"""
        trends = self.calculate_recent_trends(recent_draws)
        
        hot_numbers = [num for num, data in trends.items() if data['status'] == 'HOT']
        cold_numbers = [num for num, data in trends.items() if data['status'] == 'COLD']
        
        return hot_numbers, cold_numbers
    
    def analyze_combination(self, numbers: List[int]) -> dict:
        """번호 조합 분석"""
        if len(numbers) != 6:
            raise ValueError("정확히 6개의 번호가 필요합니다")
        
        # 홀짝 분석
        odd_count = sum(1 for num in numbers if num % 2 == 1)
        even_count = 6 - odd_count
        odd_numbers = [num for num in numbers if num % 2 == 1]
        even_numbers = [num for num in numbers if num % 2 == 0]
        
        # 구간 분포 분석 (1-15, 16-30, 31-45)
        range_1 = sum(1 for num in numbers if 1 <= num <= 15)
        range_2 = sum(1 for num in numbers if 16 <= num <= 30)
        range_3 = sum(1 for num in numbers if 31 <= num <= 45)
        
        # 연속 번호 분석 (연속된 번호 그룹의 개수)
        consecutive_groups = []
        sorted_numbers = sorted(numbers)
        current_group = [sorted_numbers[0]]
        
        for i in range(1, len(sorted_numbers)):
            if sorted_numbers[i] - sorted_numbers[i-1] == 1:
                current_group.append(sorted_numbers[i])
            else:
                if len(current_group) > 1:
                    consecutive_groups.append(current_group)
                current_group = [sorted_numbers[i]]
        
        # 마지막 그룹 처리
        if len(current_group) > 1:
            consecutive_groups.append(current_group)
        
        consecutive_count = len(consecutive_groups)
        consecutive_numbers = [num for group in consecutive_groups for num in group]
        
        # 핫/콜드 넘버 분석
        hot_numbers, cold_numbers = self.get_hot_cold_numbers()
        hot_count = sum(1 for num in numbers if num in hot_numbers)
        cold_count = sum(1 for num in numbers if num in cold_numbers)
        
        # 추천된 번호 중에서 핫/콜드 넘버만 필터링
        hot_in_combination = [num for num in numbers if num in hot_numbers]
        cold_in_combination = [num for num in numbers if num in cold_numbers]
        
        return {
            'hot_numbers': hot_count,
            'hot_number_list': hot_in_combination,  # 추천된 번호 중 핫 넘버만
            'cold_numbers': cold_count,
            'cold_number_list': cold_in_combination,  # 추천된 번호 중 콜드 넘버만
            'odd_even_ratio': f"{odd_count}:{even_count}",
            'odd_numbers': odd_numbers,  # 홀수 번호 리스트
            'even_numbers': even_numbers,  # 짝수 번호 리스트
            'sum': sum(numbers),
            'consecutive_count': consecutive_count,
            'consecutive_numbers': consecutive_numbers,  # 연속된 번호 리스트
            'range_distribution': f"1-15:{range_1}, 16-30:{range_2}, 31-45:{range_3}"
        }


