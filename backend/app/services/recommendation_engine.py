import random
from typing import Dict, List, Tuple
from sqlalchemy.orm import Session
from .lotto_analyzer import LottoAnalyzer
from ..schemas.recommendation import PreferenceSettings

class Combination:
    """번호 조합 클래스"""
    def __init__(self, numbers: List[int], confidence_score: float = 0.0):
        self.numbers = sorted(numbers)
        self.confidence_score = confidence_score
        self.total_score = 0.0

class RecommendationEngine:
    def __init__(self, db_session: Session):
        self.db = db_session
        self.analyzer = LottoAnalyzer(db_session)
        
        # 가중치 설정
        self.weights = {
            'frequency': 0.25,      # 출현 빈도
            'trend': 0.30,          # 최근 트렌드  
            'gap': 0.20,            # 번호 간격
            'odd_even': 0.10,       # 홀짝 균형
            'range': 0.10,          # 구간 분포
            'consecutive': 0.05     # 연속 번호
        }
    
    def generate_combinations(self, count: int, preferences: PreferenceSettings = None, exclude_combinations: List[List[int]] = None) -> List[Combination]:
        """메인 추천 로직"""
        if exclude_combinations is None:
            exclude_combinations = []
        
        # 1. 각 번호별 기본 점수 계산
        number_scores = self._calculate_base_scores()
        
        # 2. 사용자 선호도 적용
        if preferences:
            number_scores = self._apply_preferences(number_scores, preferences)
        
        # 3. 조합 생성 (몬테카를로 방식)
        combinations = self._generate_candidate_combinations(number_scores, count * 10, preferences)
        
        # 4. 조합 검증 및 점수 계산
        scored_combinations = self._score_combinations(combinations)
        
        # 5. 상위 N개 선택 (중복 제거)
        top_combinations = self._select_top_combinations(scored_combinations, count, exclude_combinations)
        
        return top_combinations
    
    def _calculate_base_scores(self) -> Dict[int, float]:
        """번호별 기본 점수 계산"""
        scores = {}
        total_draws = self.analyzer.get_total_draws()
        current_draw = self.analyzer.get_latest_draw_number()
        
        for number in range(1, 46):
            # 각 요소별 점수 계산
            freq_score = self._calculate_frequency_score(number, total_draws)
            trend_score = self._calculate_trend_score(number)
            gap_score = self._calculate_gap_score(number, current_draw)
            
            # 가중 평균으로 최종 점수
            base_score = (
                freq_score * self.weights['frequency'] +
                trend_score * self.weights['trend'] +
                gap_score * self.weights['gap']
            )
            
            scores[number] = base_score
        
        return scores
    
    def _calculate_frequency_score(self, number: int, total_draws: int) -> float:
        """번호별 출현 빈도 점수 계산"""
        stats = self.analyzer.calculate_frequency_statistics()
        if number not in stats:
            return 1.0
        
        appearances = stats[number]['total_appearances']
        expected_frequency = total_draws * 6 / 45  # 이론적 기댓값
        
        # 실제 빈도와 기댓값의 비율
        frequency_ratio = appearances / expected_frequency if expected_frequency > 0 else 1.0
        
        # 0.5 ~ 1.5 범위로 정규화
        frequency_score = max(0.5, min(1.5, frequency_ratio))
        
        return frequency_score
    
    def _calculate_trend_score(self, number: int) -> float:
        """최근 트렌드 점수 계산"""
        trends = self.analyzer.calculate_recent_trends(20)
        if number not in trends:
            return 1.0
        
        trend_data = trends[number]
        
        # HOT 번호는 더 높은 점수, COLD 번호는 반등 가능성 고려
        if trend_data['status'] == 'HOT':
            trend_score = 1.3
        elif trend_data['status'] == 'COLD':
            trend_score = 1.1  # 반등 가능성
        else:  # NORMAL
            trend_score = 1.0
        
        return trend_score
    
    def _calculate_gap_score(self, number: int, current_draw: int) -> float:
        """번호별 간격 점수 계산"""
        stats = self.analyzer.calculate_frequency_statistics()
        if number not in stats:
            return 1.0
        
        gap = stats[number]['gap_since_last']
        
        # 오래 안 나온 번호일수록 높은 점수 (반등 가능성)
        if gap <= 5:
            gap_score = 0.8  # 최근에 나온 번호
        elif gap <= 20:
            gap_score = 1.0  # 보통
        elif gap <= 50:
            gap_score = 1.2  # 오래 안 나온 번호
        else:
            gap_score = 1.4  # 매우 오래 안 나온 번호
        
        return gap_score
    
    def _apply_preferences(self, scores: Dict[int, float], preferences: PreferenceSettings) -> Dict[int, float]:
        """사용자 선호도 적용"""
        adjusted_scores = scores.copy()
        
        # 포함하고 싶은 번호 - 점수 상승
        for number in preferences.include_numbers:
            if 1 <= number <= 45:
                adjusted_scores[number] *= 1.5
        
        # 제외하고 싶은 번호 - 점수 하락
        for number in preferences.exclude_numbers:
            if 1 <= number <= 45:
                adjusted_scores[number] *= 0.1
        
        return adjusted_scores
    
    def _generate_candidate_combinations(self, scores: Dict[int, float], count: int, preferences: PreferenceSettings = None) -> List[List[int]]:
        """후보 조합 생성 (확률 기반 샘플링)"""
        combinations = []
        
        # 포함할 번호와 제외할 번호 처리
        include_numbers = preferences.include_numbers if preferences else []
        exclude_numbers = preferences.exclude_numbers if preferences else []
        
        # 사용 가능한 번호 목록 (제외할 번호 제거)
        available_numbers = [num for num in range(1, 46) if num not in exclude_numbers]
        available_weights = [scores[num] for num in available_numbers]
        
        attempts = 0
        max_attempts = count * 10  # 포함할 번호가 있을 때 더 많은 시도 필요
        
        while len(combinations) < count and attempts < max_attempts:
            attempts += 1
            
            if include_numbers:
                # 포함할 번호가 있는 경우: 포함할 번호를 먼저 선택하고 나머지 채우기
                combination = include_numbers.copy()
                
                # 나머지 번호를 가중 확률로 선택
                remaining_count = 6 - len(combination)
                if remaining_count > 0:
                    # 사용 가능한 번호에서 포함할 번호 제외
                    remaining_available = [num for num in available_numbers if num not in combination]
                    remaining_weights = [scores[num] for num in remaining_available]
                    
                    if remaining_weights:
                        # 가중 확률로 나머지 번호 선택
                        selected = random.choices(remaining_available, weights=remaining_weights, k=remaining_count)
                        
                        # 중복 제거 및 추가
                        for num in selected:
                            if num not in combination and len(combination) < 6:
                                combination.append(num)
                        
                        # 정확히 6개가 될 때까지 재시도
                        while len(combination) < 6:
                            additional = random.choices(remaining_available, weights=remaining_weights, k=1)[0]
                            if additional not in combination:
                                combination.append(additional)
                else:
                    # 포함할 번호가 이미 6개인 경우
                    pass
            else:
                # 포함할 번호가 없는 경우: 기존 로직
                selected = random.choices(available_numbers, weights=available_weights, k=6)
                
                # 중복 제거 및 정렬
                unique_selected = list(set(selected))
                
                # 정확히 6개가 될 때까지 재시도
                while len(unique_selected) < 6:
                    additional = random.choices(available_numbers, weights=available_weights, k=1)[0]
                    if additional not in unique_selected:
                        unique_selected.append(additional)
                
                combination = unique_selected[:6]
            
            # 정렬 및 중복 조합 방지
            combination = sorted(combination)
            if combination not in combinations:
                combinations.append(combination)
        
        return combinations
    
    def _score_combinations(self, combinations: List[List[int]]) -> List[Combination]:
        """조합별 점수 계산"""
        scored_combinations = []
        
        for combo in combinations:
            combination = Combination(combo)
            
            # 각 요소별 점수 계산
            odd_even_score = self._calculate_odd_even_score(combo)
            range_score = self._calculate_range_score(combo)
            consecutive_score = self._calculate_consecutive_score(combo)
            
            # 가중 평균으로 최종 점수
            total_score = (
                odd_even_score * self.weights['odd_even'] +
                range_score * self.weights['range'] +
                consecutive_score * self.weights['consecutive']
            )
            
            combination.total_score = total_score
            combination.confidence_score = min(1.0, max(0.0, total_score))
            scored_combinations.append(combination)
        
        return scored_combinations
    
    def _calculate_odd_even_score(self, numbers: List[int]) -> float:
        """홀짝 균형 점수"""
        odd_count = sum(1 for num in numbers if num % 2 == 1)
        even_count = 6 - odd_count
        
        # 3:3이 가장 이상적
        if odd_count == 3 and even_count == 3:
            return 1.0
        elif (odd_count == 2 and even_count == 4) or (odd_count == 4 and even_count == 2):
            return 0.8
        else:
            return 0.5
    
    def _calculate_range_score(self, numbers: List[int]) -> float:
        """구간 분포 점수"""
        range_1 = sum(1 for num in numbers if 1 <= num <= 15)
        range_2 = sum(1 for num in numbers if 16 <= num <= 30)
        range_3 = sum(1 for num in numbers if 31 <= num <= 45)
        
        # 균등 분포가 이상적
        if range_1 == 2 and range_2 == 2 and range_3 == 2:
            return 1.0
        elif abs(range_1 - range_2) <= 1 and abs(range_2 - range_3) <= 1 and abs(range_1 - range_3) <= 1:
            return 0.8
        else:
            return 0.6
    
    def _calculate_consecutive_score(self, numbers: List[int]) -> float:
        """연속 번호 점수"""
        sorted_numbers = sorted(numbers)
        consecutive_count = 0
        
        for i in range(len(sorted_numbers) - 1):
            if sorted_numbers[i + 1] - sorted_numbers[i] == 1:
                consecutive_count += 1
        
        # 연속 번호가 적을수록 높은 점수
        if consecutive_count == 0:
            return 1.0
        elif consecutive_count == 1:
            return 0.8
        elif consecutive_count == 2:
            return 0.6
        else:
            return 0.3
    
    def _select_top_combinations(self, combinations: List[Combination], count: int, exclude_combinations: List[List[int]]) -> List[Combination]:
        """상위 조합 선택 (중복 제거)"""
        # 점수순 정렬
        sorted_combinations = sorted(combinations, key=lambda x: x.total_score, reverse=True)
        
        selected = []
        exclude_set = {tuple(sorted(combo)) for combo in exclude_combinations}
        
        for combo in sorted_combinations:
            if len(selected) >= count:
                break
            
            combo_tuple = tuple(combo.numbers)
            if combo_tuple not in exclude_set:
                selected.append(combo)
                exclude_set.add(combo_tuple)
        
        return selected
    
    def check_winning_result(self, combination: List[int], winning_numbers: List[int], bonus_number: int) -> dict:
        """당첨 결과 확인"""
        if len(combination) != 6 or len(winning_numbers) != 6:
            return {'rank': None, 'amount': 0, 'matched': 0}
        
        # 일치하는 번호 개수 계산
        matched = len(set(combination) & set(winning_numbers))
        
        # 당첨 등수 결정
        if matched == 6:
            rank = 1
            amount = 2000000000  # 20억원 (예시)
        elif matched == 5 and bonus_number in combination:
            rank = 2
            amount = 50000000    # 5천만원 (예시)
        elif matched == 5:
            rank = 3
            amount = 1500000     # 150만원 (예시)
        elif matched == 4:
            rank = 4
            amount = 50000       # 5만원 (예시)
        elif matched == 3:
            rank = 5
            amount = 5000        # 5천원 (예시)
        else:
            rank = None
            amount = 0
        
        return {
            'rank': rank,
            'amount': amount,
            'matched': matched
        }


