"""
ML Inference Engine Tests
Tests for lottery number prediction using trained ML models

@TEST:LOTTO-ML-PREDICT-001
"""

import pytest
import numpy as np
from unittest.mock import Mock, MagicMock, patch
from backend.app.services.ml.inference_engine import (
    predict_probabilities,
    generate_combinations,
    calculate_confidence_scores,
    apply_user_preferences
)


class TestPredictProbabilities:
    """Test predict_probabilities function"""

    @pytest.fixture
    def mock_model(self):
        """Mock trained model"""
        model = Mock()
        # Mock predict_proba to return probabilities for 45 numbers
        model.predict_proba = Mock(return_value=np.random.rand(1, 45))
        return model

    @pytest.fixture
    def sample_features(self):
        """Sample feature vector"""
        # 45 features (frequency-based)
        return np.random.rand(1, 45)

    def test_predict_probabilities_returns_45_values(self, mock_model, sample_features):
        """Should return probabilities for all 45 numbers"""
        # @TEST:LOTTO-ML-PREDICT-001
        probabilities = predict_probabilities(mock_model, sample_features)

        assert len(probabilities) == 45
        assert all(0 <= p <= 1 for p in probabilities)

    def test_predict_probabilities_sum_to_one(self, mock_model, sample_features):
        """Probabilities should sum to approximately 1.0"""
        # @TEST:LOTTO-ML-PREDICT-001
        probabilities = predict_probabilities(mock_model, sample_features)

        # Allow small floating point error
        assert 0.99 <= sum(probabilities) <= 1.01

    def test_predict_probabilities_handles_invalid_model(self, sample_features):
        """Should handle invalid model gracefully"""
        # @TEST:LOTTO-ML-PREDICT-001
        invalid_model = None

        with pytest.raises(ValueError, match="Model cannot be None"):
            predict_probabilities(invalid_model, sample_features)

    def test_predict_probabilities_handles_invalid_features(self, mock_model):
        """Should handle invalid features gracefully"""
        # @TEST:LOTTO-ML-PREDICT-001
        invalid_features = np.array([])

        with pytest.raises(ValueError, match="Features must have shape"):
            predict_probabilities(mock_model, invalid_features)


class TestGenerateCombinations:
    """Test generate_combinations function"""

    @pytest.fixture
    def sample_probabilities(self):
        """Sample probability distribution"""
        # Higher probabilities for numbers 1-20
        probs = np.zeros(45)
        probs[:20] = 0.03  # 60% total
        probs[20:] = 0.016  # 40% total
        return probs / probs.sum()  # Normalize

    def test_generate_combinations_returns_requested_count(self, sample_probabilities):
        """Should return exactly the requested number of combinations"""
        # @TEST:LOTTO-ML-PREDICT-001
        count = 5
        combinations = generate_combinations(sample_probabilities, count)

        assert len(combinations) == count

    def test_generate_combinations_each_has_six_numbers(self, sample_probabilities):
        """Each combination should have exactly 6 numbers"""
        # @TEST:LOTTO-ML-PREDICT-001
        combinations = generate_combinations(sample_probabilities, count=5)

        for combo in combinations:
            assert len(combo) == 6

    def test_generate_combinations_numbers_in_valid_range(self, sample_probabilities):
        """All numbers should be in range 1-45"""
        # @TEST:LOTTO-ML-PREDICT-001
        combinations = generate_combinations(sample_probabilities, count=5)

        for combo in combinations:
            assert all(1 <= num <= 45 for num in combo)

    def test_generate_combinations_no_duplicates_within_combo(self, sample_probabilities):
        """Each combination should have unique numbers"""
        # @TEST:LOTTO-ML-PREDICT-001
        combinations = generate_combinations(sample_probabilities, count=5)

        for combo in combinations:
            assert len(combo) == len(set(combo))

    def test_generate_combinations_no_duplicate_combinations(self, sample_probabilities):
        """Should not generate duplicate combinations"""
        # @TEST:LOTTO-ML-PREDICT-001
        combinations = generate_combinations(sample_probabilities, count=10)

        # Convert to tuples for set comparison
        combo_tuples = [tuple(sorted(combo)) for combo in combinations]
        assert len(combo_tuples) == len(set(combo_tuples))

    def test_generate_combinations_weighted_sampling(self, sample_probabilities):
        """Should favor higher probability numbers (weighted sampling)"""
        # @TEST:LOTTO-ML-PREDICT-001
        # Generate many combinations to test distribution
        combinations = generate_combinations(sample_probabilities, count=100)

        # Count how often numbers 1-20 appear (high probability)
        high_prob_count = 0
        low_prob_count = 0

        for combo in combinations:
            high_prob_count += sum(1 for num in combo if 1 <= num <= 20)
            low_prob_count += sum(1 for num in combo if 21 <= num <= 45)

        # High probability numbers should appear more often
        # (60% of probability mass -> expect ~60% of selected numbers)
        total_numbers = high_prob_count + low_prob_count
        high_prob_ratio = high_prob_count / total_numbers

        assert 0.5 <= high_prob_ratio <= 0.7  # Allow some variance


class TestCalculateConfidenceScores:
    """Test calculate_confidence_scores function"""

    @pytest.fixture
    def sample_probabilities(self):
        """Sample probability distribution"""
        probs = np.random.rand(45)
        return probs / probs.sum()

    def test_calculate_confidence_scores_returns_dict(self, sample_probabilities):
        """Should return dictionary with confidence metrics"""
        # @TEST:LOTTO-ML-PREDICT-001
        scores = calculate_confidence_scores(sample_probabilities)

        assert isinstance(scores, dict)
        assert 'overall_confidence' in scores
        assert 'entropy' in scores
        assert 'top_number_confidence' in scores

    def test_calculate_confidence_scores_in_valid_range(self, sample_probabilities):
        """Confidence scores should be between 0.20 and 0.75 (AC-004)"""
        # @TEST:LOTTO-ML-PREDICT-001
        scores = calculate_confidence_scores(sample_probabilities)

        overall = scores['overall_confidence']
        assert 0.20 <= overall <= 0.75

    def test_calculate_confidence_scores_high_entropy_low_confidence(self):
        """High entropy (uniform distribution) should yield lower confidence"""
        # @TEST:LOTTO-ML-PREDICT-001
        # Uniform distribution (high entropy)
        uniform_probs = np.ones(45) / 45
        scores = calculate_confidence_scores(uniform_probs)

        # Should be on the lower end of confidence range
        assert scores['overall_confidence'] < 0.5

    def test_calculate_confidence_scores_low_entropy_high_confidence(self):
        """Low entropy (peaked distribution) should yield higher confidence"""
        # @TEST:LOTTO-ML-PREDICT-001
        # Highly peaked distribution (low entropy)
        # Top 6 numbers have much higher probabilities
        peaked_probs = np.zeros(45)
        peaked_probs[:6] = 0.15  # Top 6 get 90% of probability
        peaked_probs[6:] = 0.01 / 39  # Rest get 10%
        peaked_probs = peaked_probs / peaked_probs.sum()

        scores = calculate_confidence_scores(peaked_probs)

        # Should be on the higher end of confidence range
        assert scores['overall_confidence'] > 0.5


class TestApplyUserPreferences:
    """Test apply_user_preferences function"""

    @pytest.fixture
    def sample_combinations(self):
        """Sample generated combinations"""
        return [
            [3, 12, 23, 34, 41, 45],
            [7, 15, 22, 28, 35, 42],
            [1, 9, 18, 27, 33, 40],
            [5, 14, 21, 29, 36, 43],
            [2, 11, 20, 30, 38, 44]
        ]

    @pytest.fixture
    def sample_preferences(self):
        """Sample user preferences"""
        return {
            'include_numbers': [7, 23],
            'exclude_numbers': [1, 2, 3]
        }

    def test_apply_user_preferences_includes_required_numbers(self, sample_combinations, sample_preferences):
        """Should filter out combinations without required numbers"""
        # @TEST:LOTTO-ML-PREDICT-001
        filtered = apply_user_preferences(sample_combinations, sample_preferences)

        # Only combinations with 7 or 23 should remain
        for combo in filtered:
            has_required = any(num in combo for num in sample_preferences['include_numbers'])
            assert has_required

    def test_apply_user_preferences_excludes_forbidden_numbers(self, sample_combinations, sample_preferences):
        """Should filter out combinations with excluded numbers"""
        # @TEST:LOTTO-ML-PREDICT-001
        filtered = apply_user_preferences(sample_combinations, sample_preferences)

        # No combination should have excluded numbers
        for combo in filtered:
            has_excluded = any(num in combo for num in sample_preferences['exclude_numbers'])
            assert not has_excluded

    def test_apply_user_preferences_no_preferences_returns_all(self, sample_combinations):
        """Should return all combinations when no preferences given"""
        # @TEST:LOTTO-ML-PREDICT-001
        empty_preferences = {'include_numbers': [], 'exclude_numbers': []}
        filtered = apply_user_preferences(sample_combinations, empty_preferences)

        assert len(filtered) == len(sample_combinations)

    def test_apply_user_preferences_returns_empty_if_no_match(self, sample_combinations):
        """Should return empty list if no combinations match preferences"""
        # @TEST:LOTTO-ML-PREDICT-001
        impossible_preferences = {
            'include_numbers': [99],  # Number outside valid range
            'exclude_numbers': []
        }
        filtered = apply_user_preferences(sample_combinations, impossible_preferences)

        # No existing combination has this number
        assert len(filtered) == 0


class TestInferencePerformance:
    """Test inference performance requirements (AC-004)"""

    @pytest.fixture
    def mock_model(self):
        """Mock trained model"""
        model = Mock()
        model.predict_proba = Mock(return_value=np.random.rand(1, 45))
        return model

    @pytest.fixture
    def sample_features(self):
        """Sample feature vector"""
        return np.random.rand(1, 45)

    def test_inference_completes_within_one_second(self, mock_model, sample_features):
        """Full inference pipeline should complete in < 1 second (AC-004)"""
        # @TEST:LOTTO-ML-PREDICT-001
        import time

        start_time = time.time()

        # Full inference pipeline
        probabilities = predict_probabilities(mock_model, sample_features)
        combinations = generate_combinations(probabilities, count=5)
        scores = calculate_confidence_scores(probabilities)
        preferences = {'include_numbers': [], 'exclude_numbers': []}
        filtered = apply_user_preferences(combinations, preferences)

        elapsed_time = time.time() - start_time

        # Should complete in less than 1 second
        assert elapsed_time < 1.0
