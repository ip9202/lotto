"""
ML Model Utilities

Provides functions for saving, loading, and managing ML models.
@CODE:LOTTO-ML-INFRA-001
@DOC:LOTTO-ML-INFRA-001 → .moai/specs/SPEC-LOTTO-ML-INFRA-001/spec.md
"""

import os
import glob
import json
import joblib
from pathlib import Path
from datetime import datetime
from typing import Any, Optional, Dict


# Constants for model storage paths (using absolute path from file location)
_CURRENT_FILE = Path(__file__).resolve()
_APP_DIR = _CURRENT_FILE.parent.parent.parent
MODEL_BASE_DIR = _APP_DIR / "models" / "ml"
TRAINED_DIR = MODEL_BASE_DIR / "trained"
METADATA_DIR = MODEL_BASE_DIR / "metadata"
BACKUP_DIR = MODEL_BASE_DIR / "backups"


def save_model(model: Any, model_name: str = None, metadata: Dict = None) -> str:
    """
    Save ML model to disk with optional metadata.

    Args:
        model: The trained ML model to save
        model_name: Optional custom model name (default: lotto_model_YYYYMMDD)
        metadata: Optional metadata dictionary

    Returns:
        str: Path to saved model file

    Raises:
        ValueError: If model is None
        IOError: If save operation fails
    """
    if model is None:
        raise ValueError("Model cannot be None")

    # Ensure directories exist
    TRAINED_DIR.mkdir(parents=True, exist_ok=True)
    METADATA_DIR.mkdir(parents=True, exist_ok=True)

    # Generate model filename with timestamp
    if model_name is None:
        timestamp = datetime.now().strftime("%Y%m%d")
        model_name = f"lotto_model_{timestamp}"

    model_path = TRAINED_DIR / f"{model_name}.pkl"

    # Save model using joblib
    try:
        joblib.dump(model, model_path)
    except Exception as e:
        raise IOError(f"Failed to save model: {e}")

    # Save metadata if provided (JSON format for easy inspection)
    if metadata is not None:
        metadata_path = METADATA_DIR / f"{model_name}_metadata.json"
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, default=str, ensure_ascii=False)

    return str(model_path)


def load_model(model_path: str) -> Any:
    """
    Load ML model from disk.

    Args:
        model_path: Path to model file

    Returns:
        Any: Loaded ML model

    Raises:
        FileNotFoundError: If model file doesn't exist
        IOError: If load operation fails
    """
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}")

    try:
        model = joblib.load(model_path)
    except Exception as e:
        raise IOError(f"Failed to load model: {e}")

    return model


def get_latest_model_path() -> Optional[str]:
    """
    Get the path to the most recently saved model.

    Returns:
        Optional[str]: Path to latest model file, or None if no models found
    """
    # Ensure directory exists
    TRAINED_DIR.mkdir(parents=True, exist_ok=True)

    # Find all model files
    model_files = glob.glob(str(TRAINED_DIR / "lotto_model_*.pkl"))

    if not model_files:
        return None

    # Return the most recent file (sorted by filename timestamp)
    latest_model = max(model_files, key=os.path.getmtime)
    return latest_model
