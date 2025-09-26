import random
from typing import Dict, List, Tuple
from sqlalchemy.orm import Session
from .lotto_analyzer import LottoAnalyzer
from ..schemas.recommendation import PreferenceSettings

class Combination:
    """로또 번호 조합 클래스"""
    def __init__(self, numbers: List[int], confidence_score: float = 0.0):
        self.numbers = sorted(numbers)  # 번호를 오름차순으로 정렬
        self.confidence_score = confidence_score  # AI 신뢰도 점수 (0.0~1.0)
        self.total_score = 0.0  # 종합 점수
        self.analysis = None  # 번호 조합 분석 데이터

class RecommendationEngine:
    """로또 번호 추천 엔진 - 통계적 분석 기반 AI 추천 시스템"""
    def __init__(self, db_session: Session):
        self.db = db_session
        self.analyzer = LottoAnalyzer(db_session)  # 로또 데이터 분석기
        
        # 기본 점수 계산 가중치 설정
        self.weights = {
            'frequency': 0.6,       # 출현 빈도 가중치 (60%)
            'trend': 0.4            # 최근 트렌드 가중치 (40%)
        }
    
    def generate_combinations(self, count: int, preferences: PreferenceSettings = None, exclude_combinations: List[List[int]] = None) -> List[Combination]:
        """메인 추천 로직 - 통계적 분석을 통한 로또 번호 조합 생성"""
        if exclude_combinations is None:
            exclude_combinations = []
        
        # 1단계: 각 번호별 기본 점수 계산 (출현빈도 + 최근트렌드)
        number_scores = self._calculate_base_scores()
        
        # 2단계: 사용자 선호도 적용 (포함/제외 번호 반영)
        if preferences:
            number_scores = self._apply_preferences(number_scores, preferences)
        
        # 3단계: 몬테카를로 샘플링으로 후보 조합 생성 (10배수 생성 후 상위 선별)
        combinations = self._generate_candidate_combinations(number_scores, count * 10, preferences)
        
        # 4단계: 각 조합별 종합 점수 계산 (개별점수 + 패턴점수 + 균형점수)
        scored_combinations = self._score_combinations(combinations)
        
        # 5단계: 상위 N개 조합 선택 (중복 제거)
        top_combinations = self._select_top_combinations(scored_combinations, count, exclude_combinations)
        
        # 6단계: 각 조합에 대한 상세 분석 수행 (홀짝, 구간분포, 연속번호 등)
        for combination in top_combinations:
            combination.analysis = self.analyzer.analyze_combination(combination.numbers)
        
        return top_combinations
    
    def _calculate_base_scores(self) -> Dict[int, float]:
        """번호별 기본 점수 계산 - 출현빈도와 최근트렌드 기반"""
        scores = {}
        
        # 1번부터 45번까지 모든 번호에 대해 점수 계산
        for number in range(1, 46):
            # 출현 빈도 점수 계산 (전체 당첨번호 데이터 기반)
            freq_score = self._calculate_frequency_score(number, 1000)  # 고정값 사용
            # 최근 트렌드 점수 계산 (최근 20회차 데이터 기반)
            trend_score = self._calculate_trend_score(number)
            
            # 가중 평균으로 기본 점수 계산
            base_score = (
                freq_score * self.weights['frequency'] +  # 출현빈도 60%
                trend_score * self.weights['trend']       # 최근트렌드 40%
            )
            
            scores[number] = base_score
        
        return scores
    
    def _calculate_frequency_score(self, number: int, total_draws: int) -> float:
        """번호별 출현 빈도 점수 계산 - 전체 당첨번호 데이터 기반"""
        stats = self.analyzer.calculate_frequency_statistics()
        if number not in stats:
            return 1.0  # 데이터가 없으면 기본값
        
        appearances = stats[number]['total_appearances']  # 실제 출현 횟수
        expected_frequency = total_draws * 6 / 45  # 이론적 기댓값 (6개 번호 / 45개 중 선택)
        
        # 실제 빈도와 기댓값의 비율 계산
        frequency_ratio = appearances / expected_frequency if expected_frequency > 0 else 1.0
        
        # 0.5 ~ 1.5 범위로 정규화 (너무 극단적인 값 방지)
        frequency_score = max(0.5, min(1.5, frequency_ratio))
        
        return frequency_score
    
    def _calculate_trend_score(self, number: int) -> float:
        """최근 트렌드 점수 계산 - 최근 20회차 데이터 기반"""
        trends = self.analyzer.calculate_recent_trends(20)
        if number not in trends:
            return 1.0  # 데이터가 없으면 기본값
        
        trend_data = trends[number]
        
        # 최근 트렌드 상태에 따른 점수 부여
        if trend_data['status'] == 'HOT':
            trend_score = 1.3  # HOT 번호: 최근 4회 이상 출현
        elif trend_data['status'] == 'COLD':
            trend_score = 1.1  # COLD 번호: 반등 가능성 고려 (1회 이하 출현)
        else:  # NORMAL
            trend_score = 1.0  # 일반적인 번호: 2-3회 출현
        
        return trend_score
    
    # 간격 점수 계산 제거 - 단순화
    
    def _apply_preferences(self, scores: Dict[int, float], preferences: PreferenceSettings) -> Dict[int, float]:
        """사용자 선호도 적용 - 포함/제외 번호 반영"""
        adjusted_scores = scores.copy()
        
        # 포함하고 싶은 번호 - 점수 50% 상승 (1.5배)
        for number in preferences.include_numbers:
            if 1 <= number <= 45:
                adjusted_scores[number] *= 1.5
        
        # 제외하고 싶은 번호 - 점수 90% 하락 (0.1배)
        for number in preferences.exclude_numbers:
            if 1 <= number <= 45:
                adjusted_scores[number] *= 0.1
        
        return adjusted_scores
    
    def _generate_candidate_combinations(self, scores: Dict[int, float], count: int, preferences: PreferenceSettings = None) -> List[List[int]]:
        """후보 조합 생성 - 몬테카를로 샘플링 방식"""
        combinations = []
        
        # 사용자 선호도에서 포함/제외 번호 추출
        include_numbers = preferences.include_numbers if preferences else []
        exclude_numbers = preferences.exclude_numbers if preferences else []
        
        # 사용 가능한 번호 목록 생성 (제외할 번호 제거)
        available_numbers = [num for num in range(1, 46) if num not in exclude_numbers]
        available_weights = [scores[num] for num in available_numbers]  # 각 번호의 가중치
        
        attempts = 0
        max_attempts = count * 10  # 포함할 번호가 있을 때 더 많은 시도 필요
        
        # 요청된 개수만큼 조합 생성
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
                # 포함할 번호가 없는 경우: 가중 확률로 6개 번호 선택
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
            
            # 1단계: 번호별 개별 점수 계산 (출현빈도 + 최근트렌드 기반)
            number_scores = self._calculate_base_scores()
            individual_score = sum(number_scores[num] for num in combo) / 6  # 6개 번호의 평균 점수
            
            # 2단계: 조합 패턴 점수 계산 (홀짝, 구간분포, 연속번호 등)
            pattern_score = self._calculate_pattern_score(combo)
            
            # 3단계: 통계적 균형 점수 계산 (평균, 분산, 극값분포 등)
            balance_score = self._calculate_balance_score(combo)
            
            # 4단계: AI 가중치를 적용한 종합 점수 계산
            total_score = (
                individual_score * 0.40 +      # 개별 번호 점수 (40%)
                pattern_score * 0.35 +         # 조합 패턴 점수 (35%)
                balance_score * 0.25           # 통계적 균형 점수 (25%)
            )
            
            # 5단계: 신뢰도 점수 정규화 (15-65% 범위로 현실적 분포)
            combination.total_score = total_score
            
            # 랜덤 요소 추가로 더 다양한 점수 분포 생성 (±10% 변동)
            import random
            random_factor = random.uniform(0.9, 1.1)
            adjusted_score = total_score * random_factor
            
            # 점수 구간별 차등 적용으로 현실적인 분포 생성
            if adjusted_score > 0.85:
                # 매우 우수한 조합 (5%): 55-65%
                normalized_score = 0.55 + (adjusted_score - 0.85) * 0.67
            elif adjusted_score > 0.70:
                # 우수한 조합 (15%): 45-55%
                normalized_score = 0.45 + (adjusted_score - 0.70) * 0.67
            elif adjusted_score > 0.50:
                # 양호한 조합 (30%): 32-45%
                normalized_score = 0.32 + (adjusted_score - 0.50) * 0.65
            elif adjusted_score > 0.30:
                # 보통 조합 (30%): 22-32%
                normalized_score = 0.22 + (adjusted_score - 0.30) * 0.50
            else:
                # 낮은 조합 (20%): 15-22%
                normalized_score = 0.15 + adjusted_score * 0.23
            
            # 최종 신뢰도 점수 (15-65% 범위로 제한)
            combination.confidence_score = min(0.65, max(0.15, normalized_score))
            scored_combinations.append(combination)
        
        return scored_combinations
    
    def _calculate_odd_even_score(self, numbers: List[int]) -> float:
        """홀짝 균형 점수 계산"""
        odd_count = sum(1 for num in numbers if num % 2 == 1)  # 홀수 개수
        even_count = 6 - odd_count  # 짝수 개수
        
        # 3:3이 가장 이상적인 균형
        if odd_count == 3 and even_count == 3:
            return 1.0  # 완벽한 균형
        elif (odd_count == 2 and even_count == 4) or (odd_count == 4 and even_count == 2):
            return 0.8  # 양호한 균형
        else:
            return 0.5  # 불균형
    
    def _calculate_range_score(self, numbers: List[int]) -> float:
        """구간 분포 점수 계산 (1-15, 16-30, 31-45)"""
        range_1 = sum(1 for num in numbers if 1 <= num <= 15)   # 1-15 구간 개수
        range_2 = sum(1 for num in numbers if 16 <= num <= 30)  # 16-30 구간 개수
        range_3 = sum(1 for num in numbers if 31 <= num <= 45)  # 31-45 구간 개수
        
        # 균등 분포가 가장 이상적 (각 구간 2개씩)
        if range_1 == 2 and range_2 == 2 and range_3 == 2:
            return 1.0  # 완벽한 균등 분포
        elif abs(range_1 - range_2) <= 1 and abs(range_2 - range_3) <= 1 and abs(range_1 - range_3) <= 1:
            return 0.8  # 양호한 균등 분포
        else:
            return 0.6  # 불균등 분포
    
    def _calculate_consecutive_score(self, numbers: List[int]) -> float:
        """연속 번호 점수 계산 (연속 번호가 적을수록 높은 점수)"""
        sorted_numbers = sorted(numbers)
        consecutive_count = 0  # 연속된 번호 쌍의 개수
        
        # 인접한 번호가 연속인지 확인
        for i in range(len(sorted_numbers) - 1):
            if sorted_numbers[i + 1] - sorted_numbers[i] == 1:
                consecutive_count += 1
        
        # 연속 번호가 적을수록 높은 점수 (로또에서는 연속 번호가 적을수록 좋음)
        if consecutive_count == 0:
            return 1.0  # 연속 번호 없음 (최고점)
        elif consecutive_count == 1:
            return 0.8  # 연속 번호 1쌍
        elif consecutive_count == 2:
            return 0.6  # 연속 번호 2쌍
        else:
            return 0.3  # 연속 번호 3쌍 이상
    
    def _calculate_pattern_score(self, numbers: List[int]) -> float:
        """AI 조합 패턴 분석 점수 - 종합적 패턴 평가"""
        sorted_numbers = sorted(numbers)
        
        # 1. 홀짝 균형 점수 (3:3이 이상적)
        odd_count = sum(1 for num in numbers if num % 2 == 1)
        even_count = 6 - odd_count
        odd_even_score = self._calculate_odd_even_score(numbers)
        
        # 2. 구간 분포 점수 (1-15, 16-30, 31-45 각 2개씩이 이상적)
        range_score = self._calculate_range_score(numbers)
        
        # 3. 연속 번호 점수 (연속 번호가 적을수록 좋음)
        consecutive_score = self._calculate_consecutive_score(numbers)
        
        # 4. 번호 간격 균형 점수 (간격이 균등할수록 좋음)
        gap_balance_score = self._calculate_gap_balance_score(sorted_numbers)
        
        # 5. 끝자리 분포 점수 (끝자리가 다양할수록 좋음)
        ending_score = self._calculate_ending_distribution_score(numbers)
        
        # 종합 패턴 점수 (가중 평균)
        pattern_score = (
            odd_even_score * 0.25 +      # 홀짝 균형 (25%)
            range_score * 0.25 +         # 구간 분포 (25%)
            consecutive_score * 0.20 +   # 연속 번호 (20%)
            gap_balance_score * 0.20 +   # 간격 균형 (20%)
            ending_score * 0.10          # 끝자리 분포 (10%)
        )
        
        return pattern_score
    
    def _calculate_balance_score(self, numbers: List[int]) -> float:
        """통계적 균형 및 안정성 점수 계산"""
        sorted_numbers = sorted(numbers)
        
        # 1. 평균값과의 편차 점수 (이론적 평균 23에 가까울수록 좋음)
        mean_score = self._calculate_mean_deviation_score(sorted_numbers)
        
        # 2. 분산 점수 (너무 집중되지도, 너무 분산되지도 않게)
        variance_score = self._calculate_variance_score(sorted_numbers)
        
        # 3. 극값 분포 점수 (너무 극단적이지 않도록)
        extreme_score = self._calculate_extreme_distribution_score(sorted_numbers)
        
        # 4. 과거 당첨 패턴과의 유사도 점수
        similarity_score = self._calculate_historical_similarity_score(sorted_numbers)
        
        # 종합 균형 점수 (가중 평균)
        balance_score = (
            mean_score * 0.30 +      # 평균값 편차 (30%)
            variance_score * 0.25 +  # 분산 점수 (25%)
            extreme_score * 0.25 +   # 극값 분포 (25%)
            similarity_score * 0.20  # 과거 패턴 유사도 (20%)
        )
        
        return balance_score
    
    def _calculate_gap_balance_score(self, sorted_numbers: List[int]) -> float:
        """번호 간격 균형 점수 계산 (간격이 균등할수록 높은 점수)"""
        if len(sorted_numbers) < 2:
            return 1.0  # 번호가 1개 이하면 최고점
        
        # 인접한 번호 간의 간격 계산
        gaps = []
        for i in range(len(sorted_numbers) - 1):
            gap = sorted_numbers[i + 1] - sorted_numbers[i]
            gaps.append(gap)
        
        # 간격의 표준편차가 작을수록 균형적
        if len(gaps) == 1:
            return 1.0  # 간격이 1개면 최고점
        
        mean_gap = sum(gaps) / len(gaps)  # 평균 간격
        variance = sum((gap - mean_gap) ** 2 for gap in gaps) / len(gaps)  # 분산
        std_dev = variance ** 0.5  # 표준편차
        
        # 표준편차가 작을수록 높은 점수 (간격이 균등할수록 좋음)
        if std_dev <= 2:
            return 1.0  # 매우 균등한 간격
        elif std_dev <= 4:
            return 0.8  # 양호한 간격
        elif std_dev <= 6:
            return 0.6  # 보통 간격
        else:
            return 0.4  # 불균등한 간격
    
    def _calculate_ending_distribution_score(self, numbers: List[int]) -> float:
        """끝자리 분포 점수 계산 (끝자리가 다양할수록 높은 점수)"""
        endings = [num % 10 for num in numbers]  # 각 번호의 끝자리 추출
        unique_endings = len(set(endings))  # 고유한 끝자리 개수
        
        # 끝자리가 다양할수록 높은 점수 (0-9까지 다양하게 분포될수록 좋음)
        if unique_endings == 6:
            return 1.0  # 모든 끝자리가 다름 (최고점)
        elif unique_endings == 5:
            return 0.8  # 5개 끝자리가 다름
        elif unique_endings == 4:
            return 0.6  # 4개 끝자리가 다름
        else:
            return 0.4  # 3개 이하 끝자리가 다름
    
    def _calculate_mean_deviation_score(self, sorted_numbers: List[int]) -> float:
        """평균값과의 편차 점수 계산 (이론적 평균 23에 가까울수록 높은 점수)"""
        if not sorted_numbers:
            return 1.0  # 빈 리스트면 최고점
        
        mean = sum(sorted_numbers) / len(sorted_numbers)  # 실제 평균값
        # 이론적 평균 (1+45)/2 = 23
        theoretical_mean = 23
        
        deviation = abs(mean - theoretical_mean)  # 이론적 평균과의 편차
        
        # 평균이 23에 가까울수록 높은 점수
        if deviation <= 2:
            return 1.0  # 매우 가까움 (최고점)
        elif deviation <= 4:
            return 0.8  # 가까움
        elif deviation <= 6:
            return 0.6  # 보통
        else:
            return 0.4  # 멀음
    
    def _calculate_variance_score(self, sorted_numbers: List[int]) -> float:
        """분산 점수 계산 (너무 집중되지도, 너무 분산되지도 않게)"""
        if not sorted_numbers:
            return 1.0  # 빈 리스트면 최고점
        
        mean = sum(sorted_numbers) / len(sorted_numbers)  # 평균값
        variance = sum((num - mean) ** 2 for num in sorted_numbers) / len(sorted_numbers)  # 분산
        
        # 적당한 분산이 이상적 (너무 집중되지도, 너무 분산되지도 않게)
        if 50 <= variance <= 200:
            return 1.0  # 이상적인 분산 (최고점)
        elif 30 <= variance <= 250:
            return 0.8  # 양호한 분산
        elif 20 <= variance <= 300:
            return 0.6  # 보통 분산
        else:
            return 0.4  # 부적절한 분산
    
    def _calculate_extreme_distribution_score(self, sorted_numbers: List[int]) -> float:
        """극값 분포 점수 계산 (적당한 범위가 이상적)"""
        if not sorted_numbers:
            return 1.0  # 빈 리스트면 최고점
        
        min_num = sorted_numbers[0]  # 최소값
        max_num = sorted_numbers[-1]  # 최대값
        range_size = max_num - min_num  # 범위 크기
        
        # 적당한 범위가 이상적 (너무 좁지도, 너무 넓지도 않게)
        if 20 <= range_size <= 35:
            return 1.0  # 이상적인 범위 (최고점)
        elif 15 <= range_size <= 40:
            return 0.8  # 양호한 범위
        elif 10 <= range_size <= 44:
            return 0.6  # 보통 범위
        else:
            return 0.4  # 부적절한 범위
    
    def _calculate_historical_similarity_score(self, sorted_numbers: List[int]) -> float:
        """과거 당첨 패턴과의 유사도 점수 계산"""
        # 간단한 구현: 과거 데이터가 있다면 더 정교하게 계산 가능
        # 현재는 기본 점수 반환 (향후 개선 가능)
        return 0.8  # 기본값 (80%)
    
    def _select_top_combinations(self, combinations: List[Combination], count: int, exclude_combinations: List[List[int]]) -> List[Combination]:
        """상위 조합 선택 - 중복 제거 및 점수순 정렬"""
        # 점수순 정렬 (높은 점수부터)
        sorted_combinations = sorted(combinations, key=lambda x: x.total_score, reverse=True)
        
        selected = []
        exclude_set = {tuple(sorted(combo)) for combo in exclude_combinations}  # 제외할 조합들
        
        # 요청된 개수만큼 상위 조합 선택
        for combo in sorted_combinations:
            if len(selected) >= count:
                break  # 요청된 개수만큼 선택 완료
            
            combo_tuple = tuple(combo.numbers)
            if combo_tuple not in exclude_set:  # 제외 목록에 없으면 선택
                selected.append(combo)
                exclude_set.add(combo_tuple)  # 중복 방지를 위해 추가
        
        return selected
    
    def check_winning_result(self, combination: List[int], winning_numbers: List[int], bonus_number: int) -> dict:
        """당첨 결과 확인 - 추천 번호와 당첨 번호 비교"""
        if len(combination) != 6 or len(winning_numbers) != 6:
            return {'rank': None, 'amount': 0, 'matched': 0}  # 잘못된 입력
        
        # 일치하는 번호 개수 계산
        matched = len(set(combination) & set(winning_numbers))
        
        # 당첨 등수 결정 (로또 규칙에 따라)
        if matched == 6:
            rank = 1
            amount = 2000000000  # 1등: 20억원 (예시)
        elif matched == 5 and bonus_number in combination:
            rank = 2
            amount = 50000000    # 2등: 5천만원 (예시)
        elif matched == 5:
            rank = 3
            amount = 1500000     # 3등: 150만원 (예시)
        elif matched == 4:
            rank = 4
            amount = 50000       # 4등: 5만원 (예시)
        elif matched == 3:
            rank = 5
            amount = 5000        # 5등: 5천원 (예시)
        else:
            rank = None
            amount = 0           # 미당첨
        
        return {
            'rank': rank,        # 당첨 등수
            'amount': amount,    # 당첨 금액
            'matched': matched   # 맞춘 번호 개수
        }


