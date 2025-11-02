"""
ML Model Retraining Scheduler

Automatic model retraining scheduler that runs weekly on Tuesday midnight (KST).
@CODE:LOTTO-ML-RETRAIN-001
@DOC:LOTTO-ML-RETRAIN-001 → .moai/specs/SPEC-LOTTO-ML-RETRAIN-001/spec.md
"""

import logging
from typing import Optional
from datetime import datetime
import pytz
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session

from .retrain_metadata import RetrainMetadata
from . import data_preprocessor
from . import model_trainer

# ============================================================================
# Logging
# ============================================================================

logger = logging.getLogger(__name__)


# ============================================================================
# Constants
# ============================================================================

KST_TIMEZONE = pytz.timezone('Asia/Seoul')
MIN_TRAINING_SAMPLES = 500  # Minimum number of draws required for training
TEST_SIZE_RATIO = 0.2  # 20% of data for testing
RANDOM_SEED = 42  # For reproducible train/test splits
N_ESTIMATORS = 100  # Number of trees in Random Forest


# ============================================================================
# RetrainingScheduler Class
# ============================================================================

class RetrainingScheduler:
    """
    Automatic model retraining scheduler.

    Schedules and executes periodic model retraining:
    - Weekly on Tuesday at 00:00 KST (after lottery draw)
    - Can be triggered manually for immediate retraining
    - Handles failures gracefully and maintains previous model
    - Tracks metadata for monitoring and debugging

    Requirements (from SPEC-LOTTO-ML-001):
    - ED-002: Auto retrain when new data added (weekly Tuesday midnight KST)
    - SD-001: Use previous model during training (no service interruption)
    - UB-001: Auto fallback to statistical engine on training failure
    """

    def __init__(self, db_session: Session, metadata_path: Optional[str] = None):
        """
        Initialize retraining scheduler.

        Args:
            db_session: Database session for loading draw data
            metadata_path: Optional custom path for metadata file
        """
        self.db_session = db_session
        self.metadata = RetrainMetadata(metadata_path=metadata_path)
        self._scheduler = BackgroundScheduler(timezone=KST_TIMEZONE)
        self._is_running = False

    # ========================================================================
    # Scheduling
    # ========================================================================

    def schedule_retraining(self) -> None:
        """
        Register automatic retraining job with APScheduler.

        Schedule:
        - Day: Every Tuesday
        - Time: 00:00 (midnight)
        - Timezone: Asia/Seoul (KST)

        The scheduler runs in background and persists across application lifecycle.
        """
        # Create cron trigger for Tuesday midnight KST
        trigger = CronTrigger(
            day_of_week='tue',
            hour=0,
            minute=0,
            timezone=KST_TIMEZONE
        )

        # Add job to scheduler
        self._scheduler.add_job(
            func=self.perform_retraining,
            trigger=trigger,
            id='weekly_retrain',
            name='Weekly Model Retraining',
            replace_existing=True
        )

        logger.info("Scheduled weekly retraining: Every Tuesday 00:00 KST")

    def start(self) -> None:
        """
        Start the scheduler.

        This starts the background scheduler which will trigger jobs
        according to their schedules.
        """
        if not self._is_running:
            self.schedule_retraining()
            self._scheduler.start()
            self._is_running = True
            logger.info("Retraining scheduler started")

    def stop(self) -> None:
        """
        Stop the scheduler.

        Gracefully shuts down the scheduler and waits for running jobs to complete.
        """
        if self._is_running:
            self._scheduler.shutdown(wait=True)
            self._is_running = False
            logger.info("Retraining scheduler stopped")

    # ========================================================================
    # Retraining Execution
    # ========================================================================

    def perform_retraining(self) -> bool:
        """
        Execute complete model retraining cycle.

        Cycle steps:
        1. Check if training already in progress (prevent concurrent runs)
        2. Load lottery draw data from database
        3. Validate data quantity (min 500 draws required)
        4. Extract ML features
        5. Train new model
        6. Evaluate model performance
        7. Save model to disk
        8. Update metadata

        Returns:
            bool: True if retraining succeeded, False otherwise

        Failure handling:
        - On any error, logs details and calls handle_retraining_failure
        - Previous model remains intact (no service interruption)
        - Metadata updated with failure info for monitoring
        """
        # Prevent concurrent retraining
        if self.metadata.get('status') == 'running':
            logger.warning("Retraining already in progress, skipping")
            return False

        try:
            # Mark training start
            self.metadata.mark_training_start()
            logger.info("Starting model retraining cycle")

            # Step 1: Load data
            logger.info("Loading draw data from database")
            draw_data = data_preprocessor.load_draw_data(self.db_session)

            # Step 2: Validate data quantity
            data_count = len(draw_data)
            logger.info(f"Loaded {data_count} draws")

            if data_count < MIN_TRAINING_SAMPLES:
                error_msg = f"Insufficient training data: {data_count} draws (minimum {MIN_TRAINING_SAMPLES} required)"
                raise ValueError(error_msg)

            # Step 3: Extract features
            logger.info("Extracting ML features")
            features = data_preprocessor.extract_features(draw_data)

            # Step 4: Prepare train/test split
            X_train, X_test, y_train, y_test = data_preprocessor.prepare_train_test_split(
                features,
                test_size=TEST_SIZE_RATIO,
                random_state=RANDOM_SEED
            )

            # Step 5: Train model
            logger.info(f"Training model with {len(X_train)} samples, {len(X_test)} test samples")
            model = model_trainer.train_model(
                X_train=X_train,
                y_train=y_train,
                n_estimators=N_ESTIMATORS,
                random_state=RANDOM_SEED
            )

            # Step 6: Evaluate model
            logger.info("Evaluating model performance")
            metrics = model_trainer.evaluate_model(
                model=model,
                X_test=X_test,
                y_test=y_test
            )

            accuracy = metrics.get('accuracy', 0.0)
            logger.info(f"Model accuracy: {accuracy:.2%}")

            # Step 7: Save model
            model_version = f"lotto_model_{datetime.now(KST_TIMEZONE).strftime('%Y%m%d_%H%M%S')}"
            logger.info(f"Saving model: {model_version}")

            save_metadata = {
                'accuracy': accuracy,
                'training_samples': len(X_train),
                'test_samples': len(X_test),
                'model_version': model_version,
                **metrics
            }

            model_path = model_trainer.save_trained_model(
                model=model,
                metadata=save_metadata,
                model_name=model_version
            )

            logger.info(f"Model saved to: {model_path}")

            # Step 8: Update metadata
            self.metadata.mark_training_success(
                model_version=model_version,
                accuracy=accuracy,
                training_samples=len(X_train)
            )

            logger.info("Retraining completed successfully")
            return True

        except Exception as e:
            # Handle any failure
            logger.error(f"Retraining failed: {str(e)}", exc_info=True)
            self.handle_retraining_failure(e)
            return False

    def handle_retraining_failure(self, error: Exception) -> None:
        """
        Handle retraining failure.

        Actions:
        1. Log error with full traceback
        2. Update metadata with failure status
        3. Send notification (if configured)
        4. Preserve previous model (no changes to production model)

        Args:
            error: Exception that caused failure

        Note:
        - Previous model remains active (service continuity)
        - Statistical fallback engine is available if needed
        """
        error_message = f"{type(error).__name__}: {str(error)}"

        logger.error(f"Handling retraining failure: {error_message}")

        # Update metadata with failure info
        self.metadata.mark_training_failure(error_message=error_message)

        # TODO: Send notification to admin (email/Slack)
        # This will be implemented in future phase when notification system is ready

        logger.info("Previous model preserved, service continues with existing model")

    # ========================================================================
    # Status & Control
    # ========================================================================

    def get_retraining_status(self) -> dict:
        """
        Get current retraining status.

        Returns:
            dict: Metadata containing:
                - last_retrain_time: ISO timestamp of last successful retrain
                - status: 'success', 'failed', 'running', or 'never_trained'
                - error_message: Error details (if failed)
                - model_version: Current model identifier
                - accuracy: Model accuracy (0-1)
                - training_samples: Number of samples used

        Example:
            {
                'last_retrain_time': '2025-11-02T00:00:00+09:00',
                'status': 'success',
                'error_message': None,
                'model_version': 'lotto_model_20251102_000000',
                'accuracy': 0.75,
                'training_samples': 800
            }
        """
        return self.metadata.to_dict()

    def trigger_immediate_retrain(self) -> bool:
        """
        Trigger immediate retraining (outside scheduled time).

        Use cases:
        - Manual trigger after data correction
        - Admin-requested retraining
        - Testing and validation

        Returns:
            bool: True if retraining succeeded, False otherwise
        """
        logger.info("Manual retraining triggered")
        return self.perform_retraining()
