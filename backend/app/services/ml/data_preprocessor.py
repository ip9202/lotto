"""
ML Data Preprocessing Pipeline

Provides functions for loading, validating, and preparing lottery data for ML training.
@CODE:LOTTO-ML-PREPROCESS-001
"""

import pandas as pd
import numpy as np
from typing import Tuple, Dict, Any
from sqlalchemy.orm import Session
from ...models.lotto import LottoDraw
from sklearn.model_selection import train_test_split


# ============================================================================
# Constants
# ============================================================================

NUMBER_COLS = ['number_1', 'number_2', 'number_3', 'number_4', 'number_5', 'number_6']
TOTAL_NUMBERS = 45
NUMBERS_PER_DRAW = 6
RECENT_WINDOW_SIZE = 20


# ============================================================================
# Helper Functions
# ============================================================================

def _count_number_appearances(data: pd.DataFrame, number: int) -> int:
    """Count how many times a number appears in the data."""
    appearances = 0
    for col in NUMBER_COLS:
        appearances += (data[col] == number).sum()
    return appearances


def _extract_all_numbers(data: pd.DataFrame) -> list:
    """Extract all numbers from the data as a flat list."""
    all_numbers = []
    for col in NUMBER_COLS:
        all_numbers.extend(data[col].tolist())
    return all_numbers


# ============================================================================
# Data Loading
# ============================================================================

def load_draw_data(db_session: Session) -> pd.DataFrame:
    """
    Load lottery draw data from PostgreSQL database.

    Args:
        db_session: SQLAlchemy database session

    Returns:
        pd.DataFrame: DataFrame containing lottery draw data with columns:
            - draw_number
            - draw_date
            - number_1 through number_6
            - bonus_number
            - first_winners
            - first_amount
    """
    # Query all draws ordered by draw number
    draws = db_session.query(LottoDraw).order_by(LottoDraw.draw_number).all()

    # Convert to list of dictionaries
    data = []
    for draw in draws:
        data.append({
            'draw_number': draw.draw_number,
            'draw_date': draw.draw_date,
            'number_1': draw.number_1,
            'number_2': draw.number_2,
            'number_3': draw.number_3,
            'number_4': draw.number_4,
            'number_5': draw.number_5,
            'number_6': draw.number_6,
            'bonus_number': draw.bonus_number,
            'first_winners': draw.first_winners,
            'first_amount': draw.first_amount
        })

    # Create DataFrame with explicit columns to ensure consistency even when empty
    df = pd.DataFrame(data, columns=[
        'draw_number', 'draw_date', 'number_1', 'number_2', 'number_3',
        'number_4', 'number_5', 'number_6', 'bonus_number',
        'first_winners', 'first_amount'
    ])

    return df


# ============================================================================
# Feature Extraction
# ============================================================================

def extract_features(draw_data: pd.DataFrame) -> pd.DataFrame:
    """
    Extract ML features from lottery draw data.

    Features extracted:
    1. Frequency features (45): Appearance frequency for each number 1-45
    2. Trend features (45): Recent appearance trends (last 20 draws)
    3. Correlation features (45): Co-occurrence patterns with other numbers
    4. Statistical features (10+): Mean, std, range, etc.

    Args:
        draw_data: DataFrame with lottery draw history

    Returns:
        pd.DataFrame: Feature matrix with 100+ features per draw
    """
    if len(draw_data) == 0:
        # Return empty DataFrame with expected columns
        return pd.DataFrame()

    features = []

    # Process each draw to create feature vector
    for idx in range(len(draw_data)):
        feature_dict = {}

        # Get historical data up to current draw (excluding current)
        historical_data = draw_data.iloc[:idx] if idx > 0 else pd.DataFrame()

        # 1. FREQUENCY FEATURES (45 features)
        # Calculate appearance frequency for each number 1-45
        for num in range(1, TOTAL_NUMBERS + 1):
            if len(historical_data) > 0:
                appearances = _count_number_appearances(historical_data, num)
                total_draws = len(historical_data)
                expected = total_draws * NUMBERS_PER_DRAW / TOTAL_NUMBERS
                freq_ratio = appearances / expected if expected > 0 else 0
            else:
                freq_ratio = 0

            feature_dict[f'freq_{num}'] = freq_ratio

        # 2. TREND FEATURES (45 features)
        # Calculate recent trend (last N draws) for each number
        recent_data = draw_data.iloc[max(0, idx-RECENT_WINDOW_SIZE):idx] if idx > 0 else pd.DataFrame()

        for num in range(1, TOTAL_NUMBERS + 1):
            if len(recent_data) > 0:
                recent_appearances = _count_number_appearances(recent_data, num)
                trend_score = recent_appearances / min(RECENT_WINDOW_SIZE, len(recent_data))
            else:
                trend_score = 0

            feature_dict[f'trend_{num}'] = trend_score

        # 3. CORRELATION FEATURES (45 features)
        # Calculate co-occurrence patterns for each number
        for num in range(1, TOTAL_NUMBERS + 1):
            if len(historical_data) > 0:
                # Find draws where this number appeared
                draw_mask = False
                for col in NUMBER_COLS:
                    draw_mask = draw_mask | (historical_data[col] == num)

                co_occur_count = draw_mask.sum()
                co_occur_ratio = co_occur_count / len(historical_data)
            else:
                co_occur_ratio = 0

            feature_dict[f'co_occur_{num}'] = co_occur_ratio

        # 4. STATISTICAL FEATURES (10 features)
        if len(historical_data) > 0:
            all_numbers = _extract_all_numbers(historical_data)

            # Calculate statistics
            feature_dict['stat_mean'] = np.mean(all_numbers) if all_numbers else 23
            feature_dict['stat_std'] = np.std(all_numbers) if all_numbers else 0
            feature_dict['stat_min'] = np.min(all_numbers) if all_numbers else 1
            feature_dict['stat_max'] = np.max(all_numbers) if all_numbers else 45
            feature_dict['stat_range'] = feature_dict['stat_max'] - feature_dict['stat_min']

            # Distribution features
            num_count = len(all_numbers)
            feature_dict['stat_low_count'] = sum(1 for n in all_numbers if n <= 15) / num_count
            feature_dict['stat_mid_count'] = sum(1 for n in all_numbers if 16 <= n <= 30) / num_count
            feature_dict['stat_high_count'] = sum(1 for n in all_numbers if n >= 31) / num_count

            # Odd/even ratio
            feature_dict['stat_odd_ratio'] = sum(1 for n in all_numbers if n % 2 == 1) / num_count
            feature_dict['stat_even_ratio'] = 1 - feature_dict['stat_odd_ratio']
        else:
            # Default values for first draw
            feature_dict.update({
                'stat_mean': 23,
                'stat_std': 0,
                'stat_min': 1,
                'stat_max': 45,
                'stat_range': 44,
                'stat_low_count': 0.33,
                'stat_mid_count': 0.33,
                'stat_high_count': 0.34,
                'stat_odd_ratio': 0.5,
                'stat_even_ratio': 0.5
            })

        features.append(feature_dict)

    # Create feature DataFrame
    feature_df = pd.DataFrame(features)

    return feature_df


# ============================================================================
# Train/Test Split
# ============================================================================

def prepare_train_test_split(
    features: pd.DataFrame,
    test_size: float = 0.2,
    random_state: int = 42
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """
    Prepare train/test split for ML training.

    Args:
        features: Feature matrix from extract_features
        test_size: Proportion of data for test set (default 0.2 = 20%)
        random_state: Random seed for reproducibility

    Returns:
        Tuple of (X_train, X_test, y_train, y_test)
    """
    if len(features) == 0:
        return pd.DataFrame(), pd.DataFrame(), pd.Series(dtype=float), pd.Series(dtype=float)

    # For now, create dummy target variable (will be refined in model training)
    # Target: predict if each number (1-45) will appear in next draw
    # Using a simple approach: create binary target for demonstration
    y = pd.Series([1] * len(features))  # Placeholder target

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        features,
        y,
        test_size=test_size,
        random_state=random_state,
        shuffle=True
    )

    return X_train, X_test, y_train, y_test


# ============================================================================
# Data Quality Validation
# ============================================================================

def validate_data_quality(data: pd.DataFrame) -> Tuple[bool, Dict[str, Any]]:
    """
    Validate data quality and detect issues.

    Checks:
    1. Missing values
    2. Invalid number ranges (must be 1-45)
    3. Duplicate draw numbers
    4. Data consistency

    Args:
        data: DataFrame to validate

    Returns:
        Tuple of (is_valid: bool, report: dict)
    """
    report = {
        'missing_values': 0,
        'invalid_range': 0,
        'duplicates': 0,
        'issues': []
    }

    is_valid = True

    # Check 1: Missing values
    missing_count = data.isnull().sum().sum()
    report['missing_values'] = int(missing_count)
    if missing_count > 0:
        is_valid = False
        report['issues'].append(f"Found {missing_count} missing values")

    # Check 2: Invalid range (numbers must be 1-45)
    check_cols = NUMBER_COLS.copy()
    if 'bonus_number' in data.columns:
        check_cols.append('bonus_number')

    invalid_count = 0
    for col in check_cols:
        if col in data.columns:
            invalid_mask = (data[col] < 1) | (data[col] > TOTAL_NUMBERS)
            invalid_count += invalid_mask.sum()

    report['invalid_range'] = int(invalid_count)
    if invalid_count > 0:
        is_valid = False
        report['issues'].append(f"Found {invalid_count} numbers outside valid range (1-45)")

    # Check 3: Duplicate draw numbers
    if 'draw_number' in data.columns:
        duplicate_count = data['draw_number'].duplicated().sum()
        report['duplicates'] = int(duplicate_count)
        if duplicate_count > 0:
            is_valid = False
            report['issues'].append(f"Found {duplicate_count} duplicate draw numbers")

    # Add summary
    if is_valid:
        report['summary'] = "Data quality validation passed"
    else:
        report['summary'] = f"Data quality validation failed with {len(report['issues'])} issues"

    return is_valid, report


# ============================================================================
# Inference Feature Preparation
# ============================================================================

def prepare_features_for_inference(db_session) -> np.ndarray:
    """
    Prepare features for ML inference (real-time prediction).

    Fetches latest draw data from database and extracts features
    in the same format as training data.

    Args:
        db_session: SQLAlchemy database session

    Returns:
        np.ndarray: Feature vector (shape: (1, 45)) for inference

    @CODE:LOTTO-ML-INTEGRATE-001
    """
    # Fetch latest draws for feature extraction
    data = fetch_draws_from_database(db_session, limit=100)

    if len(data) == 0:
        # Return default features if no data available
        return np.ones((1, TOTAL_NUMBERS)) / TOTAL_NUMBERS

    # Extract features (returns DataFrame)
    features_df = extract_features(data)

    if len(features_df) == 0:
        # Return default features if extraction failed
        return np.ones((1, TOTAL_NUMBERS)) / TOTAL_NUMBERS

    # Get the latest feature row (most recent draw)
    latest_features = features_df.iloc[-1]

    # Select frequency features (freq_1 to freq_45)
    freq_cols = [f'freq_{i}' for i in range(1, TOTAL_NUMBERS + 1)]
    feature_vector = latest_features[freq_cols].values

    # Reshape to (1, 45) for model input
    feature_vector = feature_vector.reshape(1, -1)

    # Normalize to ensure sum = 1.0 (probability distribution)
    feature_vector = feature_vector / feature_vector.sum()

    return feature_vector
