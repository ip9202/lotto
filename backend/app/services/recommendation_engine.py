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
        self.analysis = None  # 분석 데이터 필드 추가

class RecommendationEngine:
    def __init__(self, db_session: Session):
        self.db = db_session
        self.analyzer = LottoAnalyzer(db_session)
        
        # 단순화된 가중치 설정
        self.weights = {
            'frequency': 0.6,       # 출현 빈도 (60%)
            'trend': 0.4            # 최근 트렌드 (40%)
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
        
        # 6. 각 조합에 대해 분석 수행
        for combination in top_combinations:
            combination.analysis = self.analyzer.analyze_combination(combination.numbers)
        
        return top_combinations
    
    def _calculate_base_scores(self) -> Dict[int, float]:
        """번호별 기본 점수 계산 - 단순화된 버전"""
        scores = {}
        
        for number in range(1, 46):
            # 출현 빈도와 최근 트렌드만 고려
            freq_score = self._calculate_frequency_score(number, 1000)  # 고정값 사용
            trend_score = self._calculate_trend_score(number)
            
            # 단순 가중 평균
            base_score = (
                freq_score * self.weights['frequency'] +
                trend_score * self.weights['trend']
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
    
    # 간격 점수 계산 제거 - 단순화
    
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
        """AI 종합 분석을 통한 조합별 신뢰도 점수 계산"""
        scored_combinations = []
        
        for combo in combinations:
            combination = Combination(combo)
            
            # 1. 번호별 개별 점수 계산 (이미 계산된 base_scores 활용)
            number_scores = self._calculate_base_scores()
            individual_score = sum(number_scores[num] for num in combo) / 6
            
            # 2. 조합 패턴 점수 계산
            pattern_score = self._calculate_pattern_score(combo)
            
            # 3. 통계적 균형 점수 계산
            balance_score = self._calculate_balance_score(combo)
            
            # 4. AI 가중치를 적용한 종합 점수 계산
            total_score = (
                individual_score * 0.40 +      # 개별 번호 점수 (40%)
                pattern_score * 0.35 +         # 조합 패턴 점수 (35%)
                balance_score * 0.25           # 통계적 균형 점수 (25%)
            )
            
            # 5. 신뢰도 점수 정규화 (0.0 ~ 1.0)
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
    
    def _calculate_pattern_score(self, numbers: List[int]) -> float:
        """AI 조합 패턴 분석 점수 (종합적 패턴 평가)"""
        sorted_numbers = sorted(numbers)
        
        # 1. 홀짝 균형 점수
        odd_count = sum(1 for num in numbers if num % 2 == 1)
        even_count = 6 - odd_count
        odd_even_score = self._calculate_odd_even_score(numbers)
        
        # 2. 구간 분포 점수
        range_score = self._calculate_range_score(numbers)
        
        # 3. 연속 번호 점수
        consecutive_score = self._calculate_consecutive_score(numbers)
        
        # 4. 번호 간격 균형 점수
        gap_balance_score = self._calculate_gap_balance_score(sorted_numbers)
        
        # 5. 끝자리 분포 점수
        ending_score = self._calculate_ending_distribution_score(numbers)
        
        # 종합 패턴 점수 (가중 평균)
        pattern_score = (
            odd_even_score * 0.25 +
            range_score * 0.25 +
            consecutive_score * 0.20 +
            gap_balance_score * 0.20 +
            ending_score * 0.10
        )
        
        return pattern_score
    
    def _calculate_balance_score(self, numbers: List[int]) -> float:
        """통계적 균형 및 안정성 점수"""
        sorted_numbers = sorted(numbers)
        
        # 1. 평균값과의 편차 점수
        mean_score = self._calculate_mean_deviation_score(sorted_numbers)
        
        # 2. 분산 점수 (너무 집중되지 않도록)
        variance_score = self._calculate_variance_score(sorted_numbers)
        
        # 3. 극값 분포 점수 (너무 극단적이지 않도록)
        extreme_score = self._calculate_extreme_distribution_score(sorted_numbers)
        
        # 4. 과거 당첨 패턴과의 유사도 점수
        similarity_score = self._calculate_historical_similarity_score(sorted_numbers)
        
        # 종합 균형 점수
        balance_score = (
            mean_score * 0.30 +
            variance_score * 0.25 +
            extreme_score * 0.25 +
            similarity_score * 0.20
        )
        
        return balance_score
    
    def _calculate_gap_balance_score(self, sorted_numbers: List[int]) -> float:
        """번호 간격 균형 점수"""
        if len(sorted_numbers) < 2:
            return 1.0
        
        gaps = []
        for i in range(len(sorted_numbers) - 1):
            gap = sorted_numbers[i + 1] - sorted_numbers[i]
            gaps.append(gap)
        
        # 간격의 표준편차가 작을수록 균형적
        if len(gaps) == 1:
            return 1.0
        
        mean_gap = sum(gaps) / len(gaps)
        variance = sum((gap - mean_gap) ** 2 for gap in gaps) / len(gaps)
        std_dev = variance ** 0.5
        
        # 표준편차가 작을수록 높은 점수
        if std_dev <= 2:
            return 1.0
        elif std_dev <= 4:
            return 0.8
        elif std_dev <= 6:
            return 0.6
        else:
            return 0.4
    
    def _calculate_ending_distribution_score(self, numbers: List[int]) -> float:
        """끝자리 분포 점수 (0-9)"""
        endings = [num % 10 for num in numbers]
        unique_endings = len(set(endings))
        
        # 끝자리가 다양할수록 높은 점수
        if unique_endings == 6:
            return 1.0
        elif unique_endings == 5:
            return 0.8
        elif unique_endings == 4:
            return 0.6
        else:
            return 0.4
    
    def _calculate_mean_deviation_score(self, sorted_numbers: List[int]) -> float:
        """평균값과의 편차 점수"""
        if not sorted_numbers:
            return 1.0
        
        mean = sum(sorted_numbers) / len(sorted_numbers)
        # 이론적 평균 (1+45)/2 = 23
        theoretical_mean = 23
        
        deviation = abs(mean - theoretical_mean)
        
        # 평균이 23에 가까울수록 높은 점수
        if deviation <= 2:
            return 1.0
        elif deviation <= 4:
            return 0.8
        elif deviation <= 6:
            return 0.6
        else:
            return 0.4
    
    def _calculate_variance_score(self, sorted_numbers: List[int]) -> float:
        """분산 점수 (너무 집중되지 않도록)"""
        if not sorted_numbers:
            return 1.0
        
        mean = sum(sorted_numbers) / len(sorted_numbers)
        variance = sum((num - mean) ** 2 for num in sorted_numbers) / len(sorted_numbers)
        
        # 적당한 분산이 이상적 (너무 집중되지도, 너무 분산되지도 않게)
        if 50 <= variance <= 200:
            return 1.0
        elif 30 <= variance <= 250:
            return 0.8
        elif 20 <= variance <= 300:
            return 0.6
        else:
            return 0.4
    
    def _calculate_extreme_distribution_score(self, sorted_numbers: List[int]) -> float:
        """극값 분포 점수"""
        if not sorted_numbers:
            return 1.0
        
        min_num = sorted_numbers[0]
        max_num = sorted_numbers[-1]
        range_size = max_num - min_num
        
        # 적당한 범위가 이상적 (너무 좁지도, 너무 넓지도 않게)
        if 20 <= range_size <= 35:
            return 1.0
        elif 15 <= range_size <= 40:
            return 0.8
        elif 10 <= range_size <= 44:
            return 0.6
        else:
            return 0.4
    
    def _calculate_historical_similarity_score(self, sorted_numbers: List[int]) -> float:
        """과거 당첨 패턴과의 유사도 점수"""
        # 간단한 구현: 과거 데이터가 있다면 더 정교하게 계산 가능
        # 현재는 기본 점수 반환
        return 0.8  # 기본값
    
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


