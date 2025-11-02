"""
ML Prediction Record Manager

Manages persistence and retrieval of prediction records for accuracy tracking.
@CODE:LOTTO-ML-MONITOR-001
"""

import json
import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import pytz


# ============================================================================
# Module Logger
# ============================================================================

logger = logging.getLogger(__name__)


# ============================================================================
# Constants
# ============================================================================

LOTTO_NUMBER_COUNT = 6          # Total numbers in a lotto draw
DEFAULT_LOOKBACK_DAYS = 28       # Default number of days to load
DATE_FORMAT = '%Y-%m-%d'        # Standard date format for records


# ============================================================================
# Utility Functions
# ============================================================================

def _get_default_metadata_dir() -> str:
    """
    Get default metadata directory path.

    Returns:
        Absolute path to default predictions metadata directory

    Note:
        This centralizes the path logic to avoid duplication across modules.
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    return os.path.join(base_dir, 'models', 'ml', 'metadata', 'predictions')


# ============================================================================
# PredictionRecord Class
# ============================================================================

class PredictionRecord:
    """
    Manages prediction record persistence.

    Stores and retrieves prediction records including:
    - Predicted numbers
    - Actual winning numbers
    - Draw ID and date
    - Match count
    - Accuracy per prediction

    Records are stored in JSON format for easy inspection and analysis.
    """

    def __init__(self, metadata_dir: Optional[str] = None):
        """
        Initialize prediction record manager.

        Args:
            metadata_dir: Directory to store prediction records.
                         If None, uses default path in models/ml/metadata/predictions/
        """
        self.metadata_dir = metadata_dir or _get_default_metadata_dir()
        os.makedirs(self.metadata_dir, exist_ok=True)

    def calculate_match_count(self, predicted: List[int], actual: List[int]) -> int:
        """
        Calculate number of matching numbers between predicted and actual.

        Args:
            predicted: List of predicted numbers (6 numbers)
            actual: List of actual winning numbers (6 numbers)

        Returns:
            Number of matches (0-6)
        """
        predicted_set = set(predicted)
        actual_set = set(actual)
        return len(predicted_set & actual_set)

    def save_record(
        self,
        predicted: List[int],
        actual: List[int],
        draw_id: int,
        draw_date: str
    ) -> None:
        """
        Save prediction record to disk.

        Args:
            predicted: List of predicted numbers (6 numbers)
            actual: List of actual winning numbers (6 numbers)
            draw_id: Draw number identifier
            draw_date: Draw date in YYYY-MM-DD format

        Note:
            Record is saved as JSON file named by draw_id.
            Match count and accuracy are calculated automatically.
        """
        match_count = self.calculate_match_count(predicted, actual)
        accuracy = (match_count / float(LOTTO_NUMBER_COUNT)) * 100.0

        record = {
            'draw_id': draw_id,
            'draw_date': draw_date,
            'predicted': predicted,
            'actual': actual,
            'match_count': match_count,
            'accuracy': accuracy,
            'recorded_at': datetime.now(pytz.timezone('Asia/Seoul')).isoformat()
        }

        # Save to file
        filename = f"prediction_{draw_id}.json"
        filepath = os.path.join(self.metadata_dir, filename)

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(record, f, indent=2, ensure_ascii=False)

    def load_recent_records(self, days: int = DEFAULT_LOOKBACK_DAYS) -> List[Dict[str, Any]]:
        """
        Load prediction records from recent N days.

        Args:
            days: Number of days to look back (default: 28)

        Returns:
            List of prediction records sorted by date (newest first)

        Note:
            Only records within the specified date range are loaded
            to minimize file I/O operations.
        """
        kst = pytz.timezone('Asia/Seoul')
        cutoff_date = datetime.now(kst) - timedelta(days=days)

        records = []

        # Scan all prediction files
        if not os.path.exists(self.metadata_dir):
            return records

        for filename in os.listdir(self.metadata_dir):
            if not filename.startswith('prediction_') or not filename.endswith('.json'):
                continue

            filepath = os.path.join(self.metadata_dir, filename)

            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    record = json.load(f)

                # Parse draw_date and filter by cutoff
                draw_date = datetime.strptime(record['draw_date'], DATE_FORMAT)
                draw_date = kst.localize(draw_date)

                if draw_date >= cutoff_date:
                    records.append(record)

            except (json.JSONDecodeError, KeyError, ValueError) as e:
                logger.warning(f"Failed to load record from {filename}: {e}")
                continue

        # Sort by date (newest first)
        records.sort(key=lambda r: r['draw_date'], reverse=True)
        return records
