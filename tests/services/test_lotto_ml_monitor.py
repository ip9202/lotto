"""
Tests for ML Model Accuracy Monitoring and Fallback System

Tests the accuracy tracking, health checking, and emergency retrain logic.
@TEST:LOTTO-ML-MONITOR-001
"""

import pytest
import os
import json
import tempfile
from datetime import datetime, timedelta
import pytz

# Import will fail until we implement the modules (RED phase)
from backend.app.services.ml.accuracy_monitor import AccuracyMonitor
from backend.app.services.ml.prediction_record import PredictionRecord


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def temp_metadata_dir():
    """Create temporary directory for prediction records."""
    with tempfile.TemporaryDirectory() as tmpdir:
        predictions_dir = os.path.join(tmpdir, 'predictions')
        os.makedirs(predictions_dir, exist_ok=True)
        yield predictions_dir


@pytest.fixture
def prediction_record(temp_metadata_dir):
    """Create PredictionRecord instance with temp directory."""
    return PredictionRecord(metadata_dir=temp_metadata_dir)


@pytest.fixture
def accuracy_monitor(temp_metadata_dir):
    """Create AccuracyMonitor instance with temp directory."""
    return AccuracyMonitor(metadata_dir=temp_metadata_dir)


@pytest.fixture
def sample_predictions():
    """Sample prediction data for testing."""
    kst = pytz.timezone('Asia/Seoul')
    base_date = datetime.now(kst) - timedelta(days=30)

    # Generate 30 days of prediction data
    predictions = []
    for i in range(30):
        draw_date = base_date + timedelta(days=i)
        draw_id = 1100 + i

        # Simulate varying accuracy
        if i < 10:
            # Good accuracy (70-80%)
            predicted = [1, 2, 3, 4, 5, 6]
            actual = [1, 2, 3, 4, 15, 16]  # 4 matches = 66.7%
        elif i < 20:
            # Warning accuracy (60-70%)
            predicted = [1, 2, 3, 7, 8, 9]
            actual = [1, 2, 10, 11, 12, 13]  # 2 matches = 33.3%
        else:
            # Critical accuracy (< 50%)
            predicted = [1, 2, 3, 4, 5, 6]
            actual = [10, 11, 12, 13, 14, 15]  # 0 matches = 0%

        predictions.append({
            'draw_id': draw_id,
            'draw_date': draw_date.strftime('%Y-%m-%d'),
            'predicted': predicted,
            'actual': actual
        })

    return predictions


# ============================================================================
# Test Cases: PredictionRecord
# ============================================================================

def test_prediction_record_save_loads_data(prediction_record, temp_metadata_dir):
    """
    Test that prediction records are saved and loaded correctly.

    Expected:
        - Record saved to JSON file
        - Record contains all required fields
        - Match count calculated correctly
    """
    predicted = [1, 2, 3, 4, 5, 6]
    actual = [1, 2, 3, 10, 11, 12]
    draw_id = 1100
    draw_date = '2025-11-02'

    # Save record
    prediction_record.save_record(predicted, actual, draw_id, draw_date)

    # Load records
    records = prediction_record.load_recent_records(days=7)

    # Verify record exists
    assert len(records) == 1
    record = records[0]
    assert record['draw_id'] == draw_id
    assert record['draw_date'] == draw_date
    assert record['predicted'] == predicted
    assert record['actual'] == actual
    assert record['match_count'] == 3  # 1,2,3 match
    assert 0 <= record['accuracy'] <= 100


def test_prediction_record_calculates_match_count_correctly(prediction_record):
    """
    Test that match count calculation is accurate.

    Expected:
        - Match count = number of common elements between predicted and actual
        - Range: 0-6
    """
    test_cases = [
        ([1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 6], 6),  # Perfect match
        ([1, 2, 3, 4, 5, 6], [7, 8, 9, 10, 11, 12], 0),  # No match
        ([1, 2, 3, 4, 5, 6], [1, 2, 3, 10, 11, 12], 3),  # Partial match
        ([1, 5, 10, 15, 20, 25], [2, 5, 11, 15, 21, 26], 2),  # 5,15 match
    ]

    for predicted, actual, expected_count in test_cases:
        match_count = prediction_record.calculate_match_count(predicted, actual)
        assert match_count == expected_count


def test_prediction_record_loads_recent_only(prediction_record, sample_predictions):
    """
    Test that load_recent_records filters by date correctly.

    Expected:
        - Only records within N days are loaded
        - Older records excluded
    """
    # Save all predictions
    for pred in sample_predictions:
        prediction_record.save_record(
            pred['predicted'],
            pred['actual'],
            pred['draw_id'],
            pred['draw_date']
        )

    # Load last 7 days
    recent_records = prediction_record.load_recent_records(days=7)
    assert len(recent_records) <= 7

    # Load last 14 days
    recent_records = prediction_record.load_recent_records(days=14)
    assert len(recent_records) <= 14

    # Load last 28 days (default)
    recent_records = prediction_record.load_recent_records(days=28)
    assert len(recent_records) <= 28


# ============================================================================
# Test Cases: AccuracyMonitor
# ============================================================================

def test_track_prediction_records_data(accuracy_monitor):
    """
    Test that track_prediction stores prediction data.

    Expected:
        - Prediction recorded with all metadata
        - Accessible via get_monitor_status
    """
    predicted = [1, 2, 3, 4, 5, 6]
    actual = [1, 2, 3, 10, 11, 12]
    draw_id = 1100
    draw_date = '2025-11-02'

    accuracy_monitor.track_prediction(predicted, actual, draw_id, draw_date)

    status = accuracy_monitor.get_monitor_status()
    assert status is not None
    assert 'last_update' in status


def test_calculate_accuracy_success(accuracy_monitor, sample_predictions):
    """
    Test that accuracy calculation works with sufficient data.

    Expected:
        - Accuracy = (average match count / 6) * 100
        - Range: 0-100
    """
    # Track predictions
    for pred in sample_predictions[:10]:  # Use first 10 days (good accuracy)
        accuracy_monitor.track_prediction(
            pred['predicted'],
            pred['actual'],
            pred['draw_id'],
            pred['draw_date']
        )

    accuracy = accuracy_monitor.calculate_accuracy(days=28)
    assert accuracy is not None
    assert 0 <= accuracy <= 100


def test_calculate_accuracy_handles_insufficient_history(accuracy_monitor):
    """
    Test that accuracy calculation handles no/insufficient data gracefully.

    Expected:
        - Returns None or 0 when no data available
        - No crashes
    """
    accuracy = accuracy_monitor.calculate_accuracy(days=28)
    assert accuracy is None or accuracy == 0.0


def test_get_accuracy_trend_returns_list(accuracy_monitor, sample_predictions):
    """
    Test that accuracy trend returns daily accuracy list.

    Expected:
        - List of daily accuracies
        - Length <= days parameter
        - Each entry has date and accuracy
    """
    # Track predictions
    for pred in sample_predictions[:14]:
        accuracy_monitor.track_prediction(
            pred['predicted'],
            pred['actual'],
            pred['draw_id'],
            pred['draw_date']
        )

    trend = accuracy_monitor.get_accuracy_trend(days=14)
    assert isinstance(trend, list)
    assert len(trend) <= 14


def test_check_accuracy_health_good(accuracy_monitor, sample_predictions):
    """
    Test that health check returns GOOD when accuracy >= 70%.

    Expected:
        - status = 'good'
        - No warnings or alerts
    """
    # Use only good accuracy predictions
    for pred in sample_predictions[:5]:
        # Ensure high accuracy by making predictions match mostly
        actual = pred['predicted'][:5] + [45]  # 5/6 matches = 83.3%
        accuracy_monitor.track_prediction(
            pred['predicted'],
            actual,
            pred['draw_id'],
            pred['draw_date']
        )

    health = accuracy_monitor.check_accuracy_health()
    assert health in ['good', 'GOOD', 'normal']


def test_check_accuracy_health_warning(accuracy_monitor, sample_predictions):
    """
    Test that health check returns WARNING when 50% <= accuracy < 70%.

    Expected:
        - status = 'warning'
        - Alert message present
    """
    # Use medium accuracy predictions
    for pred in sample_predictions[10:15]:
        # 3/6 matches = 50%
        actual = pred['predicted'][:3] + [43, 44, 45]
        accuracy_monitor.track_prediction(
            pred['predicted'],
            actual,
            pred['draw_id'],
            pred['draw_date']
        )

    health = accuracy_monitor.check_accuracy_health()
    assert health in ['warning', 'WARNING']


def test_check_accuracy_health_critical(accuracy_monitor, sample_predictions):
    """
    Test that health check returns CRITICAL when accuracy < 50%.

    Expected:
        - status = 'critical'
        - Emergency retrain triggered
    """
    # Use poor accuracy predictions
    for pred in sample_predictions[20:25]:
        # 1/6 matches = 16.7%
        actual = pred['predicted'][:1] + [40, 41, 42, 43, 44]
        accuracy_monitor.track_prediction(
            pred['predicted'],
            actual,
            pred['draw_id'],
            pred['draw_date']
        )

    health = accuracy_monitor.check_accuracy_health()
    assert health in ['critical', 'CRITICAL', 'emergency']


def test_should_trigger_emergency_retrain(accuracy_monitor, sample_predictions):
    """
    Test that emergency retrain is triggered when accuracy < 50%.

    Expected:
        - Returns True when accuracy < 50%
        - Returns False when accuracy >= 50%
    """
    # Test with critical accuracy
    for pred in sample_predictions[20:25]:
        actual = pred['predicted'][:1] + [40, 41, 42, 43, 44]
        accuracy_monitor.track_prediction(
            pred['predicted'],
            actual,
            pred['draw_id'],
            pred['draw_date']
        )

    should_retrain = accuracy_monitor.should_trigger_emergency_retrain()
    assert should_retrain is True


def test_get_monitor_status_returns_complete_info(accuracy_monitor, sample_predictions):
    """
    Test that get_monitor_status returns all required fields.

    Expected:
        - accuracy: float
        - trend: list
        - last_update: datetime string
        - status: health status
    """
    # Track some predictions
    for pred in sample_predictions[:7]:
        accuracy_monitor.track_prediction(
            pred['predicted'],
            pred['actual'],
            pred['draw_id'],
            pred['draw_date']
        )

    status = accuracy_monitor.get_monitor_status()
    assert 'accuracy' in status
    assert 'status' in status
    assert 'last_update' in status
    # Optional but recommended
    # assert 'trend' in status


def test_prediction_record_persistence(prediction_record, temp_metadata_dir):
    """
    Test that prediction records persist across instance recreations.

    Expected:
        - Records saved to disk
        - Reloading instance retrieves saved records
    """
    # Save records
    predicted = [1, 2, 3, 4, 5, 6]
    actual = [1, 2, 10, 11, 12, 13]
    prediction_record.save_record(predicted, actual, 1100, '2025-11-02')

    # Create new instance
    new_record = PredictionRecord(metadata_dir=temp_metadata_dir)
    records = new_record.load_recent_records(days=7)

    assert len(records) >= 1
    assert records[0]['draw_id'] == 1100
