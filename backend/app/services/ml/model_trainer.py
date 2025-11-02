"""
ML Model Training and Evaluation

Provides functions for training, evaluating, and saving lottery prediction models.
@CODE:LOTTO-ML-MODEL-001
@DOC:LOTTO-ML-MODEL-001 → .moai/specs/SPEC-LOTTO-ML-MODEL-001/spec.md
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, Optional
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)
from datetime import datetime
from . import model_utils


# ============================================================================
# Global State (for get_model_metrics)
# ============================================================================

_last_training_metrics = {}


# ============================================================================
# Model Training
# ============================================================================

def train_model(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    n_estimators: int = 100,
    max_depth: Optional[int] = None,
    random_state: int = 42
) -> RandomForestClassifier:
    """
    Train Random Forest model for lottery prediction.

    Args:
        X_train: Training features (DataFrame with 145 features)
        y_train: Training labels (binary classification)
        n_estimators: Number of trees in the forest (default 100)
        max_depth: Maximum depth of trees (default None = unlimited)
        random_state: Random seed for reproducibility

    Returns:
        RandomForestClassifier: Trained model

    Performance:
        - Should complete within 5 minutes for 1000 samples (AC-003)
        - Target accuracy >= 70% (AC-003)
    """
    # Initialize Random Forest model
    model = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        random_state=random_state,
        n_jobs=-1,  # Use all CPU cores
        verbose=0
    )

    # Train the model
    model.fit(X_train, y_train)

    # Store training info in global state
    global _last_training_metrics
    _last_training_metrics['training_samples'] = len(X_train)
    _last_training_metrics['features_count'] = X_train.shape[1]
    _last_training_metrics['trained_at'] = datetime.now().isoformat()

    return model


# ============================================================================
# Model Evaluation
# ============================================================================

def evaluate_model(
    model: RandomForestClassifier,
    X_test: pd.DataFrame,
    y_test: pd.Series
) -> Dict[str, Any]:
    """
    Evaluate trained model on test data.

    Args:
        model: Trained Random Forest model
        X_test: Test features
        y_test: Test labels

    Returns:
        Dict containing:
            - accuracy: Overall accuracy (target >= 0.70)
            - precision: Precision score
            - recall: Recall score
            - f1_score: F1 score
            - confusion_matrix: 2x2 confusion matrix

    Performance Target:
        - Accuracy >= 70% (AC-003)
    """
    # Make predictions
    y_pred = model.predict(X_test)

    # Calculate metrics
    metrics = {
        'accuracy': accuracy_score(y_test, y_pred),
        'precision': precision_score(y_test, y_pred, average='binary', zero_division=0),
        'recall': recall_score(y_test, y_pred, average='binary', zero_division=0),
        'f1_score': f1_score(y_test, y_pred, average='binary', zero_division=0),
        'confusion_matrix': confusion_matrix(y_test, y_pred)
    }

    # Store evaluation metrics in global state
    global _last_training_metrics
    _last_training_metrics.update(metrics)
    _last_training_metrics['evaluated_at'] = datetime.now().isoformat()

    # Convert numpy arrays to lists for JSON serialization
    if 'confusion_matrix' in metrics:
        metrics['confusion_matrix'] = metrics['confusion_matrix'].tolist()

    return metrics


# ============================================================================
# Model Persistence
# ============================================================================

def save_trained_model(
    model: RandomForestClassifier,
    metadata: Dict[str, Any],
    model_name: Optional[str] = None
) -> str:
    """
    Save trained model to disk with metadata.

    Args:
        model: Trained Random Forest model
        metadata: Dictionary with model metadata (accuracy, training info, etc.)
        model_name: Optional custom model name (default: lotto_model_YYYYMMDD)

    Returns:
        str: Path to saved model file

    File Structure:
        - backend/app/models/ml/trained/lotto_model_YYYYMMDD.pkl
        - backend/app/models/ml/metadata/lotto_model_YYYYMMDD_metadata.json
    """
    # Add timestamp to metadata
    if 'saved_at' not in metadata:
        metadata['saved_at'] = datetime.now().isoformat()

    # Add model type info
    metadata['model_type'] = 'RandomForestClassifier'
    metadata['n_estimators'] = model.n_estimators
    metadata['max_depth'] = model.max_depth

    # Save model using model_utils
    save_path = model_utils.save_model(
        model=model,
        model_name=model_name,
        metadata=metadata
    )

    return save_path


# ============================================================================
# Model Metrics Retrieval
# ============================================================================

def get_model_metrics() -> Dict[str, Any]:
    """
    Get latest model training and evaluation metrics.

    Returns:
        Dict containing:
            - training_samples: Number of training samples
            - features_count: Number of features
            - trained_at: Training timestamp
            - accuracy: Model accuracy (if evaluated)
            - precision: Precision score (if evaluated)
            - recall: Recall score (if evaluated)
            - f1_score: F1 score (if evaluated)
            - evaluated_at: Evaluation timestamp (if evaluated)
    """
    global _last_training_metrics

    # Return copy to prevent external modification
    return _last_training_metrics.copy()
