"""
ML Inference Engine
Prediction engine for lottery number recommendations using trained ML models

@CODE:LOTTO-ML-PREDICT-001
@DOC:LOTTO-ML-PREDICT-001 → .moai/specs/SPEC-LOTTO-ML-PREDICT-001/spec.md
"""

import numpy as np
from typing import List, Dict, Tuple, Optional, Any

# Constants
LOTTO_NUMBER_COUNT = 45  # Total lottery numbers (1-45)
COMBINATION_SIZE = 6  # Numbers per combination
CONFIDENCE_MIN = 0.20  # Minimum confidence score (AC-004)
CONFIDENCE_MAX = 0.75  # Maximum confidence score (AC-004)


def predict_probabilities(model: Any, features: np.ndarray) -> np.ndarray:
    """
    Predict probabilities for each lottery number (1-45)

    Args:
        model: Trained ML model with predict_proba method
        features: Feature vector (shape: (1, LOTTO_NUMBER_COUNT))

    Returns:
        np.ndarray: Probability distribution for LOTTO_NUMBER_COUNT numbers (sum to 1.0)

    Raises:
        ValueError: If model is None or features have invalid shape

    @CODE:LOTTO-ML-PREDICT-001
    """
    # Validation
    if model is None:
        raise ValueError("Model cannot be None")

    if features.size == 0 or features.ndim != 2:
        raise ValueError("Features must be a 2D array with shape (1, n_features)")

    # Get predictions from model
    # MultiOutputClassifier returns list of arrays (one per output)
    raw_probabilities = model.predict_proba(features)

    # Extract probability of class 1 (number appearing) for each of 45 outputs
    # Each output is shape (1, 2) with [prob_class_0, prob_class_1]
    probabilities = np.array([
        output[0, 1]  # Get class 1 probability for each number
        for output in raw_probabilities
    ])

    # Normalize to ensure sum = 1.0 (for weighted sampling)
    probabilities = probabilities / probabilities.sum()

    return probabilities


def generate_combinations(
    probabilities: np.ndarray,
    count: int = 5
) -> List[List[int]]:
    """
    Generate lottery number combinations using weighted sampling

    Uses weighted random sampling based on predicted probabilities.
    Ensures no duplicate numbers within a combination and no duplicate combinations.

    Args:
        probabilities: Probability distribution for 45 numbers (sum to 1.0)
        count: Number of combinations to generate (default: 5)

    Returns:
        List[List[int]]: List of combinations, each with 6 unique numbers (1-45)

    @CODE:LOTTO-ML-PREDICT-001
    """
    combinations = []
    seen_combinations = set()

    # Numbers 1 to LOTTO_NUMBER_COUNT
    numbers = np.arange(1, LOTTO_NUMBER_COUNT + 1)

    # Generate combinations with weighted sampling
    max_attempts = count * 100  # Prevent infinite loop
    attempts = 0

    while len(combinations) < count and attempts < max_attempts:
        attempts += 1

        # Sample COMBINATION_SIZE numbers without replacement using probabilities as weights
        selected_indices = np.random.choice(
            LOTTO_NUMBER_COUNT,
            size=COMBINATION_SIZE,
            replace=False,
            p=probabilities
        )

        # Convert indices to numbers (1-45)
        combination = sorted(numbers[selected_indices].tolist())

        # Check for duplicate combinations
        combo_tuple = tuple(combination)
        if combo_tuple not in seen_combinations:
            combinations.append(combination)
            seen_combinations.add(combo_tuple)

    return combinations


def calculate_confidence_scores(probabilities: np.ndarray) -> Dict[str, float]:
    """
    Calculate confidence scores based on probability distribution

    Confidence is based on entropy of the distribution:
    - Low entropy (peaked distribution) = high confidence
    - High entropy (uniform distribution) = low confidence

    Args:
        probabilities: Probability distribution for 45 numbers

    Returns:
        Dict with confidence metrics:
        - overall_confidence: Overall confidence score (0.20-0.75 range)
        - entropy: Shannon entropy of distribution
        - top_number_confidence: Confidence in top 6 numbers

    @CODE:LOTTO-ML-PREDICT-001
    """
    # Calculate Shannon entropy
    # H = -sum(p * log(p)) for all p > 0
    non_zero_probs = probabilities[probabilities > 0]
    entropy = -np.sum(non_zero_probs * np.log(non_zero_probs))

    # Maximum entropy for LOTTO_NUMBER_COUNT numbers
    max_entropy = np.log(LOTTO_NUMBER_COUNT)

    # Normalize entropy to 0-1 range
    normalized_entropy = entropy / max_entropy

    # Calculate confidence in top COMBINATION_SIZE numbers (primary signal)
    top_n_probs = np.sort(probabilities)[-COMBINATION_SIZE:]
    top_number_confidence = top_n_probs.sum()

    # Combine entropy and top-n confidence for overall score
    # - Peaked distribution (low entropy): weight top-n more
    # - Uniform distribution (high entropy): lower overall confidence
    entropy_component = 1.0 - normalized_entropy

    # Use non-linear scaling to amplify differences
    # Peaked distributions should score higher
    ENTROPY_WEIGHT = 0.5
    TOP_N_WEIGHT = 0.5
    ENTROPY_EXPONENT = 1.5

    raw_score = (entropy_component ** ENTROPY_EXPONENT) * ENTROPY_WEIGHT + \
                top_number_confidence * TOP_N_WEIGHT

    # Scale to CONFIDENCE_MIN-CONFIDENCE_MAX range (AC-004)
    confidence_range = CONFIDENCE_MAX - CONFIDENCE_MIN
    overall_confidence = CONFIDENCE_MIN + (raw_score * confidence_range)

    # Ensure confidence is in valid range
    overall_confidence = max(CONFIDENCE_MIN, min(CONFIDENCE_MAX, overall_confidence))

    return {
        'overall_confidence': overall_confidence,
        'entropy': entropy,
        'top_number_confidence': float(top_number_confidence)
    }


def apply_user_preferences(
    combinations: List[List[int]],
    preferences: Dict[str, List[int]]
) -> List[List[int]]:
    """
    Filter combinations based on user preferences

    Args:
        combinations: List of generated combinations
        preferences: Dict with:
            - 'include_numbers': List of numbers that must be included
            - 'exclude_numbers': List of numbers that must be excluded

    Returns:
        List[List[int]]: Filtered combinations matching preferences

    @CODE:LOTTO-ML-PREDICT-001
    """
    include_numbers = set(preferences.get('include_numbers', []))
    exclude_numbers = set(preferences.get('exclude_numbers', []))

    filtered_combinations = []

    for combo in combinations:
        combo_set = set(combo)

        # Check exclude condition (must not contain any excluded numbers)
        if exclude_numbers and combo_set & exclude_numbers:
            continue

        # Check include condition (must contain at least one included number)
        if include_numbers and not (combo_set & include_numbers):
            continue

        filtered_combinations.append(combo)

    return filtered_combinations
