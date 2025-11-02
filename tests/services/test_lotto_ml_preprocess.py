"""
Test suite for ML data preprocessing pipeline
@TEST:LOTTO-ML-PREPROCESS-001

Tests follow Given-When-Then pattern for clarity
"""

import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.app.services.ml.data_preprocessor import (
    load_draw_data,
    extract_features,
    prepare_train_test_split,
    validate_data_quality
)
from backend.app.models.lotto import LottoDraw


# ============================================================================
# Test Fixtures
# ============================================================================

@pytest.fixture
def sample_draw_data():
    """Sample lottery draw data for testing"""
    data = []
    base_date = datetime(2024, 1, 1)

    # Generate 1000 sample draws
    for i in range(1, 1001):
        draw_date = base_date + timedelta(days=i*7)  # Weekly draws
        numbers = sorted(np.random.choice(range(1, 46), 6, replace=False))
        bonus = np.random.choice([n for n in range(1, 46) if n not in numbers])

        draw = {
            'draw_number': i,
            'draw_date': draw_date.date(),
            'number_1': numbers[0],
            'number_2': numbers[1],
            'number_3': numbers[2],
            'number_4': numbers[3],
            'number_5': numbers[4],
            'number_6': numbers[5],
            'bonus_number': bonus,
            'first_winners': np.random.randint(0, 20),
            'first_amount': np.random.randint(1000000000, 3000000000)
        }
        data.append(draw)

    return data


@pytest.fixture
def mock_db_session(mocker, sample_draw_data):
    """Mock database session with sample data"""
    mock_session = mocker.Mock(spec=Session)

    # Create mock LottoDraw objects
    mock_draws = []
    for draw_dict in sample_draw_data:
        mock_draw = mocker.Mock(spec=LottoDraw)
        for key, value in draw_dict.items():
            setattr(mock_draw, key, value)
        mock_draw.numbers = [
            draw_dict['number_1'], draw_dict['number_2'], draw_dict['number_3'],
            draw_dict['number_4'], draw_dict['number_5'], draw_dict['number_6']
        ]
        mock_draws.append(mock_draw)

    # Mock query chain
    mock_query = mocker.Mock()
    mock_query.order_by.return_value.all.return_value = mock_draws
    mock_session.query.return_value = mock_query

    return mock_session


# ============================================================================
# Test: load_draw_data
# ============================================================================

def test_load_draw_data_success(mock_db_session):
    """
    GIVEN: A database with 1000 lottery draw records
    WHEN: load_draw_data is called
    THEN: Returns DataFrame with correct shape and columns
    """
    # When
    df = load_draw_data(mock_db_session)

    # Then
    assert df is not None
    assert isinstance(df, pd.DataFrame)
    assert len(df) == 1000  # Should load all 1000 draws
    assert 'draw_number' in df.columns
    assert 'draw_date' in df.columns
    assert all(f'number_{i}' in df.columns for i in range(1, 7))
    assert 'bonus_number' in df.columns


def test_load_draw_data_performance(mock_db_session):
    """
    GIVEN: A database with 1000 lottery draw records
    WHEN: load_draw_data is called
    THEN: Completes within 3 seconds (AC-002 requirement)
    """
    import time

    # When
    start_time = time.time()
    df = load_draw_data(mock_db_session)
    elapsed_time = time.time() - start_time

    # Then
    assert elapsed_time < 3.0, f"Load time {elapsed_time:.2f}s exceeds 3s limit"
    assert len(df) == 1000


def test_load_draw_data_empty_database(mocker):
    """
    GIVEN: An empty database
    WHEN: load_draw_data is called
    THEN: Returns empty DataFrame with correct columns
    """
    # Given
    mock_session = mocker.Mock(spec=Session)
    mock_query = mocker.Mock()
    mock_query.order_by.return_value.all.return_value = []
    mock_session.query.return_value = mock_query

    # When
    df = load_draw_data(mock_session)

    # Then
    assert df is not None
    assert isinstance(df, pd.DataFrame)
    assert len(df) == 0
    assert 'draw_number' in df.columns


# ============================================================================
# Test: extract_features
# ============================================================================

def test_extract_features_success(mock_db_session):
    """
    GIVEN: Draw data loaded from database
    WHEN: extract_features is called
    THEN: Returns feature matrix with at least 100 features
    """
    # Given
    draw_data = load_draw_data(mock_db_session)

    # When
    features = extract_features(draw_data)

    # Then
    assert features is not None
    assert isinstance(features, pd.DataFrame)
    assert features.shape[1] >= 100, f"Expected >= 100 features, got {features.shape[1]}"
    assert len(features) > 0


def test_extract_features_includes_frequency(mock_db_session):
    """
    GIVEN: Draw data loaded from database
    WHEN: extract_features is called
    THEN: Includes frequency features for each number (1-45)
    """
    # Given
    draw_data = load_draw_data(mock_db_session)

    # When
    features = extract_features(draw_data)

    # Then
    frequency_cols = [col for col in features.columns if 'freq' in col.lower()]
    assert len(frequency_cols) >= 45, "Should have frequency features for all 45 numbers"


def test_extract_features_includes_trend(mock_db_session):
    """
    GIVEN: Draw data loaded from database
    WHEN: extract_features is called
    THEN: Includes trend features (recent appearance patterns)
    """
    # Given
    draw_data = load_draw_data(mock_db_session)

    # When
    features = extract_features(draw_data)

    # Then
    trend_cols = [col for col in features.columns if 'trend' in col.lower()]
    assert len(trend_cols) > 0, "Should have trend features"


def test_extract_features_includes_correlation(mock_db_session):
    """
    GIVEN: Draw data loaded from database
    WHEN: extract_features is called
    THEN: Includes correlation features (number co-occurrence)
    """
    # Given
    draw_data = load_draw_data(mock_db_session)

    # When
    features = extract_features(draw_data)

    # Then
    corr_cols = [col for col in features.columns if 'corr' in col.lower() or 'co_occur' in col.lower()]
    assert len(corr_cols) > 0, "Should have correlation features"


# ============================================================================
# Test: prepare_train_test_split
# ============================================================================

def test_prepare_train_test_split_success(mock_db_session):
    """
    GIVEN: Feature matrix from extract_features
    WHEN: prepare_train_test_split is called with 80/20 split
    THEN: Returns train and test sets with correct proportions
    """
    # Given
    draw_data = load_draw_data(mock_db_session)
    features = extract_features(draw_data)

    # When
    X_train, X_test, y_train, y_test = prepare_train_test_split(features, test_size=0.2)

    # Then
    assert X_train is not None and X_test is not None
    assert y_train is not None and y_test is not None
    assert len(X_train) > len(X_test)

    # Check 80/20 ratio (with some tolerance)
    total = len(X_train) + len(X_test)
    train_ratio = len(X_train) / total
    assert 0.75 <= train_ratio <= 0.85, f"Expected ~80% train ratio, got {train_ratio:.2%}"


def test_prepare_train_test_split_no_data_leakage(mock_db_session):
    """
    GIVEN: Feature matrix from extract_features
    WHEN: prepare_train_test_split is called
    THEN: No data overlap between train and test sets
    """
    # Given
    draw_data = load_draw_data(mock_db_session)
    features = extract_features(draw_data)

    # When
    X_train, X_test, y_train, y_test = prepare_train_test_split(features, test_size=0.2)

    # Then
    # Check no overlap in indices if DataFrame
    if hasattr(X_train, 'index') and hasattr(X_test, 'index'):
        train_indices = set(X_train.index)
        test_indices = set(X_test.index)
        assert len(train_indices & test_indices) == 0, "Found data leakage between train/test"


# ============================================================================
# Test: validate_data_quality
# ============================================================================

def test_validate_data_quality_clean_data(mock_db_session):
    """
    GIVEN: Clean draw data without missing values
    WHEN: validate_data_quality is called
    THEN: Returns True and reports no issues
    """
    # Given
    draw_data = load_draw_data(mock_db_session)

    # When
    is_valid, report = validate_data_quality(draw_data)

    # Then
    assert is_valid is True
    assert 'missing_values' in report
    assert report['missing_values'] == 0


def test_validate_data_quality_detects_missing_values(mocker):
    """
    GIVEN: Draw data with missing values
    WHEN: validate_data_quality is called
    THEN: Returns False and reports missing values
    """
    # Given
    data = pd.DataFrame({
        'draw_number': [1, 2, 3],
        'number_1': [5, None, 10],
        'number_2': [12, 15, None]
    })

    # When
    is_valid, report = validate_data_quality(data)

    # Then
    assert is_valid is False
    assert report['missing_values'] > 0


def test_validate_data_quality_detects_invalid_range(mocker):
    """
    GIVEN: Draw data with numbers outside valid range (1-45)
    WHEN: validate_data_quality is called
    THEN: Returns False and reports invalid values
    """
    # Given
    data = pd.DataFrame({
        'draw_number': [1, 2, 3],
        'number_1': [5, 50, 10],  # 50 is invalid
        'number_2': [12, 15, 0]   # 0 is invalid
    })

    # When
    is_valid, report = validate_data_quality(data)

    # Then
    assert is_valid is False
    assert 'invalid_range' in report
    assert report['invalid_range'] > 0


def test_validate_data_quality_detects_duplicates(mocker):
    """
    GIVEN: Draw data with duplicate draw numbers
    WHEN: validate_data_quality is called
    THEN: Returns False and reports duplicates
    """
    # Given
    data = pd.DataFrame({
        'draw_number': [1, 1, 2],  # Duplicate draw_number
        'number_1': [5, 10, 15],
        'number_2': [12, 18, 22]
    })

    # When
    is_valid, report = validate_data_quality(data)

    # Then
    assert is_valid is False
    assert 'duplicates' in report
    assert report['duplicates'] > 0


# ============================================================================
# Integration Tests
# ============================================================================

def test_full_preprocessing_pipeline(mock_db_session):
    """
    GIVEN: A complete database of lottery draws
    WHEN: Full preprocessing pipeline is executed
    THEN: All steps complete successfully with valid output
    """
    # Step 1: Load data
    draw_data = load_draw_data(mock_db_session)
    assert len(draw_data) == 1000

    # Step 2: Validate quality
    is_valid, report = validate_data_quality(draw_data)
    assert is_valid is True

    # Step 3: Extract features
    features = extract_features(draw_data)
    assert features.shape[1] >= 100

    # Step 4: Train/test split
    X_train, X_test, y_train, y_test = prepare_train_test_split(features, test_size=0.2)
    assert len(X_train) > 0 and len(X_test) > 0

    # Verify end-to-end pipeline integrity
    assert X_train.shape[1] == X_test.shape[1], "Feature dimensions should match"
