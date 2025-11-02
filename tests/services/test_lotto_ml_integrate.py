"""
ML Integration Tests
Tests for integrating ML prediction with existing recommendation_engine

@TEST:LOTTO-ML-INTEGRATE-001
"""

import pytest
from unittest.mock import Mock, MagicMock, patch
from sqlalchemy.orm import Session
from collections import namedtuple
from backend.app.services.recommendation_engine import RecommendationEngine, Combination
from backend.app.schemas.recommendation import PreferenceSettings


# Row-like objects for database query results
FrequencyRow = namedtuple('FrequencyRow', ['number', 'total_appearances', 'frequency_percent', 'last_appearance', 'gap'])
RecentTrendRow = namedtuple('RecentTrendRow', ['number_1', 'number_2', 'number_3', 'number_4', 'number_5', 'number_6'])


class TestMLIntegration:
    """Test ML integration with RecommendationEngine"""

    @pytest.fixture
    def mock_db_session(self):
        """Mock database session with proper query result handling"""
        mock_session = Mock(spec=Session)
        
        # Mock execute() to return different results based on query type
        def mock_execute(query):
            mock_result = Mock()
            query_str = str(query)
            
            if 'number_frequency' in query_str or 'total_appearances' in query_str:
                # Frequency statistics query - return data for all 45 numbers
                frequency_data = [
                    FrequencyRow(
                        number=num,
                        total_appearances=150 + num,
                        frequency_percent=13.5 + (num * 0.1),
                        last_appearance=1100 - num,
                        gap=50 + num
                    )
                    for num in range(1, 46)
                ]
                mock_result.fetchall = Mock(return_value=frequency_data)
            else:
                # Recent trends query (last 20 draws)
                recent_data = [
                    RecentTrendRow(1, 7, 12, 23, 34, 45),
                    RecentTrendRow(3, 9, 15, 22, 28, 42),
                    RecentTrendRow(2, 8, 18, 27, 33, 40),
                    RecentTrendRow(5, 14, 21, 29, 36, 43),
                    RecentTrendRow(11, 20, 30, 31, 38, 44),
                ] * 4  # 20 rows total
                mock_result.fetchall = Mock(return_value=recent_data[:20])
            
            return mock_result
        
        mock_session.execute = Mock(side_effect=mock_execute)
        
        # Mock query() for count and order_by operations
        mock_query = Mock()
        mock_query.count = Mock(return_value=1100)
        mock_query.order_by = Mock(return_value=mock_query)
        mock_draw = Mock(draw_number=1150)
        mock_query.first = Mock(return_value=mock_draw)
        mock_session.query = Mock(return_value=mock_query)
        
        return mock_session

    @pytest.fixture
    def mock_ml_model(self):
        """Mock ML model"""
        import numpy as np
        model = Mock()
        # Return high probabilities for numbers 1-20
        probs = np.zeros(45)
        probs[:20] = 0.04  # 80% total
        probs[20:] = 0.008  # 20% total
        model.predict_proba = Mock(return_value=probs / probs.sum())
        return model

    def test_recommendation_engine_has_use_ml_model_param(self, mock_db_session):
        """RecommendationEngine should accept use_ml_model parameter (AC-005)"""
        # @TEST:LOTTO-ML-INTEGRATE-001
        engine = RecommendationEngine(mock_db_session, use_ml_model=True)

        assert hasattr(engine, 'use_ml_model')
        assert engine.use_ml_model is True

    def test_recommendation_engine_defaults_to_statistical_mode(self, mock_db_session):
        """RecommendationEngine should default to statistical mode (AC-005)"""
        # @TEST:LOTTO-ML-INTEGRATE-001
        engine = RecommendationEngine(mock_db_session)

        # Default should be False (statistical mode)
        assert hasattr(engine, 'use_ml_model')
        assert engine.use_ml_model is False

    def test_recommendation_engine_has_ml_engine_attribute(self, mock_db_session):
        """RecommendationEngine should have ml_engine attribute"""
        # @TEST:LOTTO-ML-INTEGRATE-001
        engine = RecommendationEngine(mock_db_session, use_ml_model=True)

        assert hasattr(engine, 'ml_engine')
        # Initially None (lazy loading)
        assert engine.ml_engine is None

    @patch('backend.app.services.recommendation_engine.get_latest_model_path')
    @patch('backend.app.services.recommendation_engine.os.path.exists')
    @patch('backend.app.services.recommendation_engine.load_model')
    def test_ml_mode_loads_model_on_first_use(
        self,
        mock_load_model,
        mock_exists,
        mock_get_model_path,
        mock_db_session,
        mock_ml_model
    ):
        """ML mode should load model on first use (lazy loading)"""
        # @TEST:LOTTO-ML-INTEGRATE-001
        mock_get_model_path.return_value = '/fake/path/model.pkl'
        mock_exists.return_value = True
        mock_load_model.return_value = mock_ml_model

        engine = RecommendationEngine(mock_db_session, use_ml_model=True)

        # Model not loaded yet
        assert engine.ml_engine is None

        # Generate combinations (triggers model loading)
        combinations = engine.generate_combinations(count=5)

        # Model should now be loaded
        assert engine.ml_engine is not None
        mock_load_model.assert_called_once()

    @patch('backend.app.services.recommendation_engine.get_latest_model_path')
    @patch('backend.app.services.recommendation_engine.os.path.exists')
    def test_ml_mode_falls_back_when_model_not_found(
        self,
        mock_exists,
        mock_get_model_path,
        mock_db_session
    ):
        """Should fall back to statistical mode when model file not found (AC-005)"""
        # @TEST:LOTTO-ML-INTEGRATE-001
        mock_get_model_path.return_value = None
        mock_exists.return_value = False

        engine = RecommendationEngine(mock_db_session, use_ml_model=True)

        # Generate combinations
        combinations = engine.generate_combinations(count=5)

        # Should fall back to statistical mode
        assert len(combinations) == 5
        assert all(len(combo.numbers) == 6 for combo in combinations)

    @patch('backend.app.services.recommendation_engine.get_latest_model_path')
    @patch('backend.app.services.recommendation_engine.os.path.exists')
    @patch('backend.app.services.recommendation_engine.load_model')
    def test_ml_mode_generates_combinations_using_ml(
        self,
        mock_load_model,
        mock_exists,
        mock_get_model_path,
        mock_db_session,
        mock_ml_model
    ):
        """ML mode should use ML inference for combination generation"""
        # @TEST:LOTTO-ML-INTEGRATE-001
        mock_get_model_path.return_value = '/fake/path/model.pkl'
        mock_exists.return_value = True
        mock_load_model.return_value = mock_ml_model

        engine = RecommendationEngine(mock_db_session, use_ml_model=True)
        combinations = engine.generate_combinations(count=5)

        # Should return 5 combinations
        assert len(combinations) == 5

        # Each combination should have 6 numbers
        assert all(len(combo.numbers) == 6 for combo in combinations)

        # Each combination should be Combination object with confidence_score
        assert all(isinstance(combo, Combination) for combo in combinations)
        assert all(hasattr(combo, 'confidence_score') for combo in combinations)

        # Confidence scores should be in valid range (0.20-0.75)
        assert all(0.20 <= combo.confidence_score <= 0.75 for combo in combinations)

    def test_statistical_mode_generates_combinations_using_statistics(
        self,
        mock_db_session
    ):
        """Statistical mode should use existing statistical analysis (AC-005)"""
        # @TEST:LOTTO-ML-INTEGRATE-001
        engine = RecommendationEngine(mock_db_session, use_ml_model=False)

        with patch.object(engine, '_generate_candidate_combinations') as mock_gen:
            mock_gen.return_value = [
                [1, 5, 12, 23, 34, 45],
                [3, 7, 15, 22, 28, 42],
                [2, 9, 18, 27, 33, 40],
                [5, 14, 21, 29, 36, 43],
                [11, 20, 30, 31, 38, 44]
            ]

            combinations = engine.generate_combinations(count=5)

            # Should call statistical generation method
            mock_gen.assert_called_once()

            # Should return 5 combinations
            assert len(combinations) == 5

    @patch('backend.app.services.recommendation_engine.get_latest_model_path')
    @patch('backend.app.services.recommendation_engine.os.path.exists')
    @patch('backend.app.services.recommendation_engine.load_model')
    def test_ml_mode_respects_user_preferences(
        self,
        mock_load_model,
        mock_exists,
        mock_get_model_path,
        mock_db_session,
        mock_ml_model
    ):
        """ML mode should respect user include/exclude preferences"""
        # @TEST:LOTTO-ML-INTEGRATE-001
        mock_get_model_path.return_value = '/fake/path/model.pkl'
        mock_exists.return_value = True
        mock_load_model.return_value = mock_ml_model

        engine = RecommendationEngine(mock_db_session, use_ml_model=True)

        preferences = PreferenceSettings(
            include_numbers=[7, 23],
            exclude_numbers=[1, 2, 3]
        )

        combinations = engine.generate_combinations(count=5, preferences=preferences)

        # All combinations should contain at least one of [7, 23]
        for combo in combinations:
            has_required = any(num in combo.numbers for num in [7, 23])
            assert has_required

        # No combination should contain [1, 2, 3]
        for combo in combinations:
            has_excluded = any(num in combo.numbers for num in [1, 2, 3])
            assert not has_excluded

    @patch('backend.app.services.recommendation_engine.get_latest_model_path')
    @patch('backend.app.services.recommendation_engine.os.path.exists')
    @patch('backend.app.services.recommendation_engine.load_model')
    def test_ml_mode_handles_model_inference_error(
        self,
        mock_load_model,
        mock_exists,
        mock_get_model_path,
        mock_db_session
    ):
        """Should fall back to statistical mode when ML inference fails (AC-005)"""
        # @TEST:LOTTO-ML-INTEGRATE-001
        mock_get_model_path.return_value = '/fake/path/model.pkl'
        mock_exists.return_value = True

        # Mock model that raises error on predict_proba
        error_model = Mock()
        error_model.predict_proba = Mock(side_effect=Exception("Model inference failed"))
        mock_load_model.return_value = error_model

        engine = RecommendationEngine(mock_db_session, use_ml_model=True)

        # Should not raise exception (should fall back)
        combinations = engine.generate_combinations(count=5)

        # Should still return valid combinations (via fallback)
        assert len(combinations) == 5
        assert all(len(combo.numbers) == 6 for combo in combinations)

    def test_has_fallback_to_statistics_method(self, mock_db_session):
        """RecommendationEngine should have fallback_to_statistics method"""
        # @TEST:LOTTO-ML-INTEGRATE-001
        engine = RecommendationEngine(mock_db_session)

        assert hasattr(engine, 'fallback_to_statistics')
        assert callable(engine.fallback_to_statistics)

    def test_fallback_to_statistics_generates_valid_combinations(self, mock_db_session):
        """fallback_to_statistics should generate valid combinations"""
        # @TEST:LOTTO-ML-INTEGRATE-001
        engine = RecommendationEngine(mock_db_session)

        # Pass exclude_combinations explicitly to avoid None
        combinations = engine.fallback_to_statistics(count=5, exclude_combinations=[])

        # Should return 5 combinations
        assert len(combinations) == 5

        # Each should be a Combination object with 6 numbers
        assert all(isinstance(combo, Combination) for combo in combinations)
        assert all(len(combo.numbers) == 6 for combo in combinations)

    def test_existing_api_compatibility(self, mock_db_session):
        """Existing code should work without changes (backward compatibility)"""
        # @TEST:LOTTO-ML-INTEGRATE-001
        # Old code: RecommendationEngine(db_session)
        engine_old = RecommendationEngine(mock_db_session)

        # Should work exactly as before
        combinations = engine_old.generate_combinations(count=3)
        assert len(combinations) == 3

        # New code: RecommendationEngine(db_session, use_ml_model=True)
        with patch('backend.app.services.recommendation_engine.get_latest_model_path') as mock_get_path:
            with patch('backend.app.services.recommendation_engine.os.path.exists') as mock_exists:
                mock_get_path.return_value = None  # Model path not found
                mock_exists.return_value = False  # Model not found
                engine_new = RecommendationEngine(mock_db_session, use_ml_model=True)

                combinations_new = engine_new.generate_combinations(count=3)
                assert len(combinations_new) == 3
