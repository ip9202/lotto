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
from sklearn.multioutput import MultiOutputClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    hamming_loss
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
    y_train: pd.DataFrame,
    n_estimators: int = 100,
    max_depth: Optional[int] = None,
    random_state: int = 42
) -> MultiOutputClassifier:
    """
    Train Random Forest model for multi-label lottery prediction.

    Uses MultiOutputClassifier to train 45 independent binary classifiers
    (one for each lottery number 1-45).

    Args:
        X_train: Training features (DataFrame with 145 features)
        y_train: Multi-label training targets (DataFrame with 45 columns)
        n_estimators: Number of trees in the forest (default 100)
        max_depth: Maximum depth of trees (default None = unlimited)
        random_state: Random seed for reproducibility

    Returns:
        MultiOutputClassifier: Trained multi-output model

    Performance:
        - Should complete within 5 minutes for 1000 samples (AC-003)
        - Target accuracy >= 70% (AC-003)

    @CODE:LOTTO-ML-MODEL-001
    """
    # Initialize base Random Forest model
    base_estimator = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        random_state=random_state,
        n_jobs=-1,  # Use all CPU cores
        verbose=0
    )

    # Wrap with MultiOutputClassifier for 45 binary classifiers
    model = MultiOutputClassifier(base_estimator, n_jobs=-1)

    # Train the model
    model.fit(X_train, y_train)

    # Store training info in global state
    global _last_training_metrics
    _last_training_metrics['training_samples'] = len(X_train)
    _last_training_metrics['features_count'] = X_train.shape[1]
    _last_training_metrics['n_targets'] = y_train.shape[1]
    _last_training_metrics['trained_at'] = datetime.now().isoformat()

    return model


# ============================================================================
# Model Evaluation
# ============================================================================

def evaluate_model(
    model: MultiOutputClassifier,
    X_test: pd.DataFrame,
    y_test: pd.DataFrame
) -> Dict[str, Any]:
    """
    Evaluate trained multi-output model on test data.

    Calculates macro-averaged metrics across all 45 lottery number classifiers.

    Args:
        model: Trained MultiOutputClassifier model
        X_test: Test features
        y_test: Multi-label test targets (DataFrame with 45 columns)

    Returns:
        Dict containing:
            - accuracy: Sample-wise accuracy (exact match rate)
            - hamming_loss: Hamming loss (label-wise error rate)
            - precision: Macro-averaged precision across 45 classifiers
            - recall: Macro-averaged recall across 45 classifiers
            - f1_score: Macro-averaged F1 score across 45 classifiers

    Performance Target:
        - Accuracy >= 70% (AC-003)

    @CODE:LOTTO-ML-MODEL-001
    """
    # Make predictions
    y_pred = model.predict(X_test)

    # Calculate multi-label metrics
    metrics = {
        # Subset accuracy (exact match)
        'accuracy': accuracy_score(y_test, y_pred),

        # Hamming loss (label-wise error rate)
        'hamming_loss': hamming_loss(y_test, y_pred),

        # Macro-averaged metrics (average across all 45 labels)
        'precision': precision_score(y_test, y_pred, average='macro', zero_division=0),
        'recall': recall_score(y_test, y_pred, average='macro', zero_division=0),
        'f1_score': f1_score(y_test, y_pred, average='macro', zero_division=0),

        # Per-label accuracy (for analysis)
        'per_label_accuracy': [
            accuracy_score(y_test.iloc[:, i], y_pred[:, i])
            for i in range(y_test.shape[1])
        ]
    }

    # Store evaluation metrics in global state
    global _last_training_metrics
    _last_training_metrics.update(metrics)
    _last_training_metrics['evaluated_at'] = datetime.now().isoformat()

    # Convert numpy arrays to lists for JSON serialization
    if 'per_label_accuracy' in metrics:
        metrics['per_label_accuracy'] = [float(x) for x in metrics['per_label_accuracy']]

    return metrics


# ============================================================================
# Model Persistence
# ============================================================================

def save_trained_model(
    model: MultiOutputClassifier,
    metadata: Dict[str, Any],
    model_name: Optional[str] = None
) -> str:
    """
    Save trained multi-output model to disk with metadata.

    Args:
        model: Trained MultiOutputClassifier model
        metadata: Dictionary with model metadata (accuracy, training info, etc.)
        model_name: Optional custom model name (default: lotto_model_YYYYMMDD)

    Returns:
        str: Path to saved model file

    File Structure:
        - backend/app/models/ml/trained/lotto_model_YYYYMMDD.pkl
        - backend/app/models/ml/metadata/lotto_model_YYYYMMDD_metadata.json

    @CODE:LOTTO-ML-MODEL-001
    """
    # Add timestamp to metadata
    if 'saved_at' not in metadata:
        metadata['saved_at'] = datetime.now().isoformat()

    # Add model type info
    metadata['model_type'] = 'MultiOutputClassifier'
    metadata['base_estimator'] = 'RandomForestClassifier'
    metadata['n_estimators'] = model.estimators_[0].n_estimators if model.estimators_ else 100
    metadata['max_depth'] = model.estimators_[0].max_depth if model.estimators_ else None

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
