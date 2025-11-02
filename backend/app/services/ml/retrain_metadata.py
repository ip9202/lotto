"""
ML Model Retraining Metadata Manager

Manages persistence and retrieval of retraining metadata.
@CODE:LOTTO-ML-RETRAIN-001
"""

import json
import os
from typing import Dict, Any, Optional
from datetime import datetime
import pytz


# ============================================================================
# Constants
# ============================================================================

DEFAULT_METADATA = {
    'last_retrain_time': None,
    'status': 'never_trained',
    'error_message': None,
    'model_version': None,
    'accuracy': None,
    'training_samples': 0,
    'created_at': None
}


# ============================================================================
# RetrainMetadata Class
# ============================================================================

class RetrainMetadata:
    """
    Manages retraining metadata persistence.

    Stores and retrieves metadata about model retraining sessions including:
    - Last retraining timestamp
    - Training status (success/failed/running)
    - Error messages (if failed)
    - Model version identifier
    - Training metrics (accuracy, sample count)

    Metadata is stored in JSON format for easy inspection and portability.
    """

    def __init__(self, metadata_path: Optional[str] = None):
        """
        Initialize metadata manager.

        Args:
            metadata_path: Path to metadata JSON file.
                          If None, uses default path in models/ml/metadata/
        """
        if metadata_path is None:
            # Use default path relative to this file
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            metadata_dir = os.path.join(base_dir, 'models', 'ml', 'metadata')
            os.makedirs(metadata_dir, exist_ok=True)
            metadata_path = os.path.join(metadata_dir, 'retrain_metadata.json')

        self.metadata_path = metadata_path
        self._metadata = self._load_or_create()

    def _load_or_create(self) -> Dict[str, Any]:
        """
        Load metadata from file or create default if not exists.

        Returns:
            Dict containing metadata

        Note:
            If file is corrupted or unreadable, returns default metadata
            to ensure system stability.
        """
        if os.path.exists(self.metadata_path):
            try:
                with open(self.metadata_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError) as e:
                # Log warning but don't fail - use default metadata
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Failed to load metadata from {self.metadata_path}: {e}")
                return DEFAULT_METADATA.copy()
        else:
            # Create new metadata with timestamp
            metadata = DEFAULT_METADATA.copy()
            metadata['created_at'] = datetime.now(pytz.timezone('Asia/Seoul')).isoformat()
            return metadata

    def load(self) -> Dict[str, Any]:
        """
        Load current metadata.

        Returns:
            Dict containing current metadata
        """
        return self._metadata.copy()

    def update(self, updates: Dict[str, Any]) -> None:
        """
        Update metadata with new values.

        Args:
            updates: Dictionary of fields to update
        """
        self._metadata.update(updates)
        self._metadata['updated_at'] = datetime.now(pytz.timezone('Asia/Seoul')).isoformat()

    def save(self) -> None:
        """
        Save metadata to disk.

        Writes current metadata to JSON file with proper formatting.
        """
        # Ensure directory exists
        os.makedirs(os.path.dirname(self.metadata_path), exist_ok=True)

        # Write to file with indentation for readability
        with open(self.metadata_path, 'w', encoding='utf-8') as f:
            json.dump(self._metadata, f, indent=2, ensure_ascii=False)

    def to_dict(self) -> Dict[str, Any]:
        """
        Get metadata as dictionary.

        Returns:
            Dict containing current metadata
        """
        return self._metadata.copy()

    def get(self, key: str, default: Any = None) -> Any:
        """
        Get specific metadata field.

        Args:
            key: Metadata field name
            default: Default value if key not found

        Returns:
            Value of metadata field or default
        """
        return self._metadata.get(key, default)

    def set_status(self, status: str, error_message: Optional[str] = None) -> None:
        """
        Set training status.

        Args:
            status: Status value ('success', 'failed', 'running', 'never_trained')
            error_message: Optional error message (for 'failed' status)
        """
        self._metadata['status'] = status
        self._metadata['error_message'] = error_message
        self._metadata['updated_at'] = datetime.now(pytz.timezone('Asia/Seoul')).isoformat()

    def mark_training_start(self) -> None:
        """Mark that training has started."""
        self._metadata['status'] = 'running'
        self._metadata['training_started_at'] = datetime.now(pytz.timezone('Asia/Seoul')).isoformat()
        self.save()

    def mark_training_success(self, model_version: str, accuracy: float, training_samples: int) -> None:
        """
        Mark training as successful.

        Args:
            model_version: Identifier of trained model
            accuracy: Model accuracy (0-1)
            training_samples: Number of samples used for training
        """
        kst_now = datetime.now(pytz.timezone('Asia/Seoul')).isoformat()

        self._metadata.update({
            'status': 'success',
            'error_message': None,
            'last_retrain_time': kst_now,
            'model_version': model_version,
            'accuracy': accuracy,
            'training_samples': training_samples
        })
        self.save()

    def mark_training_failure(self, error_message: str) -> None:
        """
        Mark training as failed.

        Args:
            error_message: Description of failure
        """
        kst_now = datetime.now(pytz.timezone('Asia/Seoul')).isoformat()

        self._metadata.update({
            'status': 'failed',
            'error_message': error_message,
            'last_failure_time': kst_now
        })
        self.save()
