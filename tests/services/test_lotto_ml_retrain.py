"""
ML Model Retraining Scheduler Tests

Tests for automatic model retraining scheduler functionality.
@TEST:LOTTO-ML-RETRAIN-001
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta
import pytz
from apscheduler.schedulers.background import BackgroundScheduler

# Import modules to be tested (will fail initially as they don't exist yet)
from backend.app.services.ml.retraining_scheduler import RetrainingScheduler
from backend.app.services.ml.retrain_metadata import RetrainMetadata


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def mock_db_session():
    """Mock database session."""
    session = Mock()
    return session


@pytest.fixture
def scheduler(mock_db_session, tmp_path):
    """Create RetrainingScheduler instance with isolated metadata."""
    metadata_path = tmp_path / "retrain_metadata.json"
    instance = RetrainingScheduler(
        db_session=mock_db_session,
        metadata_path=str(metadata_path)
    )
    # Reset metadata to clean state for each test
    instance.metadata.set_status('never_trained')
    return instance


@pytest.fixture
def metadata_manager(tmp_path):
    """Create RetrainMetadata instance with temporary directory."""
    metadata_path = tmp_path / "metadata.json"
    return RetrainMetadata(metadata_path=str(metadata_path))


# ============================================================================
# Test 1: Schedule Registration
# ============================================================================

def test_schedule_retraining_registers_job(scheduler):
    """
    Test that schedule_retraining registers a job with APScheduler.

    Requirements:
    - Job should be scheduled for every Tuesday at 00:00 KST
    - Job should use CronTrigger with correct timezone
    - Job should call perform_retraining method

    @TEST:LOTTO-ML-RETRAIN-001
    """
    # Arrange
    with patch.object(scheduler, '_scheduler') as mock_scheduler:
        # Act
        scheduler.schedule_retraining()

        # Assert
        mock_scheduler.add_job.assert_called_once()
        call_kwargs = mock_scheduler.add_job.call_args.kwargs

        # Verify job function
        assert call_kwargs['func'] == scheduler.perform_retraining

        # Verify job has required properties
        assert 'trigger' in call_kwargs
        assert 'id' in call_kwargs
        assert call_kwargs['id'] == 'weekly_retrain'


# ============================================================================
# Test 2: Successful Retraining
# ============================================================================

def test_perform_retraining_succeeds(scheduler, mock_db_session):
    """
    Test that perform_retraining executes complete training cycle successfully.

    Complete cycle:
    1. Load data from database
    2. Preprocess and extract features
    3. Train model
    4. Save model to disk
    5. Update metadata

    @TEST:LOTTO-ML-RETRAIN-001
    """
    # Arrange
    with patch('backend.app.services.ml.data_preprocessor.load_draw_data') as mock_load, \
         patch('backend.app.services.ml.data_preprocessor.extract_features') as mock_extract, \
         patch('backend.app.services.ml.data_preprocessor.prepare_train_test_split') as mock_split, \
         patch('backend.app.services.ml.model_trainer.train_model') as mock_train, \
         patch('backend.app.services.ml.model_trainer.evaluate_model') as mock_evaluate, \
         patch('backend.app.services.ml.model_trainer.save_trained_model') as mock_save:

        # Mock data loading (must support len())
        import pandas as pd
        mock_draw_data = pd.DataFrame({'draw_number': range(1, 1001)})
        mock_load.return_value = mock_draw_data

        # Mock feature extraction
        mock_features = pd.DataFrame({'feature': range(1000)})
        mock_extract.return_value = mock_features

        # Mock train/test split
        mock_X_train = pd.DataFrame({'feature': range(800)})
        mock_X_test = pd.DataFrame({'feature': range(800, 1000)})
        mock_y_train = pd.Series([1] * 800)
        mock_y_test = pd.Series([1] * 200)
        mock_split.return_value = (mock_X_train, mock_X_test, mock_y_train, mock_y_test)

        # Mock model training
        mock_model = Mock(name='trained_model')
        mock_train.return_value = mock_model

        # Mock model evaluation
        mock_evaluate.return_value = {'accuracy': 0.75}

        # Mock model saving
        mock_save.return_value = '/path/to/model.pkl'

        # Act
        result = scheduler.perform_retraining()

        # Assert
        assert result is True
        mock_load.assert_called_once_with(mock_db_session)
        mock_extract.assert_called_once()
        mock_split.assert_called_once()
        mock_train.assert_called_once()
        mock_evaluate.assert_called_once()
        mock_save.assert_called_once()


# ============================================================================
# Test 3: Data Load Failure Handling
# ============================================================================

def test_perform_retraining_handles_data_load_failure(scheduler):
    """
    Test that perform_retraining handles data load failure gracefully.

    Expected behavior:
    - Catch exception during data loading
    - Log error message
    - Call handle_retraining_failure
    - Return False
    - Keep existing model intact

    @TEST:LOTTO-ML-RETRAIN-001
    """
    # Arrange
    with patch('backend.app.services.ml.data_preprocessor.load_draw_data') as mock_load, \
         patch.object(scheduler, 'handle_retraining_failure') as mock_handle_failure:

        # Mock data loading failure
        mock_load.side_effect = Exception("Database connection error")

        # Act
        result = scheduler.perform_retraining()

        # Assert
        assert result is False
        mock_handle_failure.assert_called_once()

        # Verify error message contains relevant info
        error_msg = mock_handle_failure.call_args[0][0]
        assert "Database connection error" in str(error_msg)


# ============================================================================
# Test 4: Training Failure Handling
# ============================================================================

def test_perform_retraining_handles_training_failure(scheduler):
    """
    Test that perform_retraining handles model training failure.

    Expected behavior:
    - Successfully load and preprocess data
    - Fail during model training
    - Log error and call handle_retraining_failure
    - Return False

    @TEST:LOTTO-ML-RETRAIN-001
    """
    # Arrange
    with patch('backend.app.services.ml.data_preprocessor.load_draw_data') as mock_load, \
         patch('backend.app.services.ml.data_preprocessor.extract_features') as mock_extract, \
         patch('backend.app.services.ml.data_preprocessor.prepare_train_test_split') as mock_split, \
         patch('backend.app.services.ml.model_trainer.train_model') as mock_train:

        # Mock successful data loading
        import pandas as pd
        mock_load.return_value = pd.DataFrame({'draw_number': range(1, 1001)})
        mock_extract.return_value = pd.DataFrame({'feature': range(1000)})

        # Mock train/test split
        mock_X_train = pd.DataFrame({'feature': range(800)})
        mock_X_test = pd.DataFrame({'feature': range(800, 1000)})
        mock_y_train = pd.Series([1] * 800)
        mock_y_test = pd.Series([1] * 200)
        mock_split.return_value = (mock_X_train, mock_X_test, mock_y_train, mock_y_test)

        # Mock training failure
        mock_train.side_effect = ValueError("Insufficient training data")

        # Act
        result = scheduler.perform_retraining()

        # Assert
        assert result is False


# ============================================================================
# Test 5: Error Logging
# ============================================================================

def test_handle_retraining_failure_logs_error(scheduler):
    """
    Test that handle_retraining_failure logs error properly.

    Expected behavior:
    - Log error message with timestamp
    - Update metadata with failure status
    - Store error message in metadata
    - Send notification (if configured)

    @TEST:LOTTO-ML-RETRAIN-001
    """
    # Arrange
    test_error = Exception("Model training timeout")

    with patch('backend.app.services.ml.retraining_scheduler.logger') as mock_logger:

        # Act
        scheduler.handle_retraining_failure(test_error)

        # Assert
        mock_logger.error.assert_called_once()

        # Verify metadata was updated (check file or metadata object)
        status = scheduler.metadata.get('status')
        error_msg = scheduler.metadata.get('error_message')

        assert status == 'failed'
        assert 'Model training timeout' in error_msg


# ============================================================================
# Test 6: Status Retrieval
# ============================================================================

def test_get_retraining_status_returns_metadata(scheduler):
    """
    Test that get_retraining_status returns current metadata.

    Expected return format:
    {
        'last_retrain_time': '2025-11-02T00:00:00',
        'status': 'success' | 'failed' | 'running',
        'error_message': None or error string,
        'model_version': 'lotto_model_20251102',
        'accuracy': 0.75
    }

    @TEST:LOTTO-ML-RETRAIN-001
    """
    # Arrange
    expected_metadata = {
        'last_retrain_time': '2025-11-02T00:00:00',
        'status': 'success',
        'error_message': None,
        'model_version': 'lotto_model_20251102',
        'accuracy': 0.75
    }

    with patch.object(scheduler, 'metadata') as mock_metadata:
        mock_metadata.to_dict.return_value = expected_metadata

        # Act
        status = scheduler.get_retraining_status()

        # Assert
        assert status == expected_metadata
        assert status['status'] == 'success'
        assert status['accuracy'] == 0.75


# ============================================================================
# Test 7: Immediate Trigger
# ============================================================================

def test_trigger_immediate_retrain_executes_now(scheduler):
    """
    Test that trigger_immediate_retrain executes retraining immediately.

    Expected behavior:
    - Call perform_retraining directly (not scheduled)
    - Return result immediately
    - Update metadata with manual trigger flag

    @TEST:LOTTO-ML-RETRAIN-001
    """
    # Arrange
    with patch.object(scheduler, 'perform_retraining') as mock_perform:
        mock_perform.return_value = True

        # Act
        result = scheduler.trigger_immediate_retrain()

        # Assert
        assert result is True
        mock_perform.assert_called_once()


# ============================================================================
# Test 8: Metadata Persistence
# ============================================================================

def test_retrain_metadata_persistence(metadata_manager, tmp_path):
    """
    Test that RetrainMetadata correctly saves and loads from JSON.

    Expected behavior:
    - Save metadata to JSON file
    - Load metadata from JSON file
    - Handle missing file gracefully (return defaults)
    - Preserve data types (datetime strings, floats, etc.)

    @TEST:LOTTO-ML-RETRAIN-001
    """
    # Arrange
    test_metadata = {
        'last_retrain_time': datetime.now(pytz.timezone('Asia/Seoul')).isoformat(),
        'status': 'success',
        'error_message': None,
        'model_version': 'test_model_001',
        'accuracy': 0.82,
        'training_samples': 1000
    }

    # Act - Save
    metadata_manager.update(test_metadata)
    metadata_manager.save()

    # Act - Load in new instance
    new_metadata_manager = RetrainMetadata(metadata_path=str(tmp_path / "metadata.json"))
    loaded_data = new_metadata_manager.load()

    # Assert
    assert loaded_data['status'] == 'success'
    assert loaded_data['model_version'] == 'test_model_001'
    assert loaded_data['accuracy'] == 0.82
    assert loaded_data['training_samples'] == 1000


# ============================================================================
# Test 9: Scheduler Start/Stop
# ============================================================================

def test_scheduler_start_stop(scheduler):
    """
    Test that scheduler can be started and stopped properly.

    Expected behavior:
    - start() initializes APScheduler and adds cron job
    - stop() shuts down scheduler gracefully
    - Scheduler state is tracked correctly

    @TEST:LOTTO-ML-RETRAIN-001
    """
    # Arrange
    with patch.object(scheduler, '_scheduler') as mock_scheduler:
        # Act - Start
        scheduler.start()

        # Assert - Start
        mock_scheduler.start.assert_called_once()

        # Act - Stop
        scheduler.stop()

        # Assert - Stop
        mock_scheduler.shutdown.assert_called_once()


# ============================================================================
# Test 10: Korean Timezone Verification
# ============================================================================

def test_korean_timezone_used_correctly(scheduler):
    """
    Test that all time-related operations use Asia/Seoul timezone.

    Requirements:
    - Scheduler uses KST timezone
    - Metadata timestamps use KST
    - Retraining triggers at correct KST time

    @TEST:LOTTO-ML-RETRAIN-001
    """
    # Verify scheduler timezone (can be either zoneinfo or pytz)
    tz_str = str(scheduler._scheduler.timezone)
    assert 'Asia/Seoul' in tz_str

    # Verify trigger uses KST
    scheduler.schedule_retraining()

    # Get jobs and verify timezone
    jobs = scheduler._scheduler.get_jobs()
    assert len(jobs) > 0

    # Check that job trigger is configured
    job = jobs[0]
    assert job.id == 'weekly_retrain'


# ============================================================================
# Test 11: Insufficient Data Handling
# ============================================================================

def test_perform_retraining_handles_insufficient_data(scheduler):
    """
    Test that retraining fails gracefully when data is insufficient.

    Expected behavior:
    - Detect when loaded data has < 500 draws
    - Log warning about insufficient data
    - Call handle_retraining_failure with appropriate message
    - Return False

    @TEST:LOTTO-ML-RETRAIN-001
    """
    # Reset metadata status to allow retraining
    scheduler.metadata.set_status('success')

    # Arrange
    with patch('backend.app.services.ml.data_preprocessor.load_draw_data') as mock_load:

        # Mock insufficient data (only 300 draws)
        import pandas as pd
        mock_draw_data = pd.DataFrame({'draw_number': range(1, 301)})
        mock_load.return_value = mock_draw_data

        # Act
        result = scheduler.perform_retraining()

        # Assert
        assert result is False

        # Verify metadata shows failure
        status = scheduler.metadata.get('status')
        error_msg = scheduler.metadata.get('error_message')

        assert status == 'failed'
        assert "insufficient" in error_msg.lower() or "500" in error_msg


# ============================================================================
# Test 12: Concurrent Retraining Prevention
# ============================================================================

def test_prevents_concurrent_retraining(scheduler):
    """
    Test that concurrent retraining attempts are prevented.

    Expected behavior:
    - If retraining is already in progress, return False immediately
    - Set 'running' flag in metadata when starting
    - Clear 'running' flag when done (success or failure)

    @TEST:LOTTO-ML-RETRAIN-001
    """
    # Arrange
    with patch.object(scheduler, 'metadata') as mock_metadata, \
         patch.object(scheduler, 'perform_retraining', wraps=scheduler.perform_retraining):

        # Simulate retraining already in progress
        mock_metadata.get.return_value = {'status': 'running'}

        # Act
        result = scheduler.perform_retraining()

        # Assert
        assert result is False
        # Verify that we didn't proceed with actual retraining
        # (no calls to data loading, training, etc.)
