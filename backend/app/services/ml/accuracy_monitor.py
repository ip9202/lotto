"""
ML Model Accuracy Monitor

Monitors prediction accuracy and triggers emergency retraining when needed.
@CODE:LOTTO-ML-MONITOR-001
@DOC:LOTTO-ML-MONITOR-001 → .moai/specs/SPEC-LOTTO-ML-MONITOR-001/spec.md
"""

import os
from typing import List, Dict, Any, Optional
from datetime import datetime
import pytz

from .prediction_record import PredictionRecord, LOTTO_NUMBER_COUNT, _get_default_metadata_dir


# ============================================================================
# Constants
# ============================================================================

ACCURACY_THRESHOLD_CRITICAL = 50.0      # Below this: emergency retrain
ACCURACY_THRESHOLD_WARNING = 70.0       # Below this: warning alert
DEFAULT_MONITORING_DAYS = 28            # Default lookback period
FAILURE_MATCH_THRESHOLD = 1             # 0-1 matches = failure
EMERGENCY_RECENT_PREDICTION_COUNT = 10  # Check last N predictions for failures
EMERGENCY_FAILURE_THRESHOLD = 8         # Trigger if N+ failures out of recent predictions


# ============================================================================
# AccuracyMonitor Class
# ============================================================================

class AccuracyMonitor:
    """
    Monitors ML model prediction accuracy and health status.

    Tracks prediction results against actual winning numbers and:
    - Calculates accuracy over configurable time periods
    - Provides accuracy trend analysis
    - Determines model health status (good/warning/critical)
    - Triggers emergency retraining when accuracy drops below thresholds

    Accuracy is calculated as: (average match count / 6) * 100
    """

    def __init__(self, metadata_dir: Optional[str] = None):
        """
        Initialize accuracy monitor.

        Args:
            metadata_dir: Directory to store prediction records.
                         If None, uses default path in models/ml/metadata/predictions/
        """
        self.metadata_dir = metadata_dir or _get_default_metadata_dir()
        self.record_manager = PredictionRecord(metadata_dir=self.metadata_dir)

    def track_prediction(
        self,
        predicted_numbers: List[int],
        actual_numbers: List[int],
        draw_id: int,
        draw_date: str
    ) -> None:
        """
        Track a prediction result.

        Args:
            predicted_numbers: List of predicted numbers (6 numbers)
            actual_numbers: List of actual winning numbers (6 numbers)
            draw_id: Draw number identifier
            draw_date: Draw date in YYYY-MM-DD format

        Note:
            This method saves the prediction record for later accuracy analysis.
        """
        self.record_manager.save_record(
            predicted_numbers,
            actual_numbers,
            draw_id,
            draw_date
        )

    def calculate_accuracy(self, days: int = DEFAULT_MONITORING_DAYS) -> Optional[float]:
        """
        Calculate average accuracy over recent N days.

        Args:
            days: Number of days to analyze (default: 28)

        Returns:
            Average accuracy percentage (0-100), or None if no data available

        Note:
            Accuracy = (average match count / 6) * 100
            Example: If average match count is 3, accuracy = 50%
        """
        records = self.record_manager.load_recent_records(days=days)

        if not records:
            return None

        # Calculate average match count
        total_matches = sum(record['match_count'] for record in records)
        avg_matches = total_matches / len(records)

        # Convert to percentage
        accuracy = (avg_matches / float(LOTTO_NUMBER_COUNT)) * 100.0
        return accuracy

    def get_accuracy_trend(self, days: int = DEFAULT_MONITORING_DAYS) -> List[Dict[str, Any]]:
        """
        Get daily accuracy trend over recent N days.

        Args:
            days: Number of days to analyze (default: 28)

        Returns:
            List of daily accuracy entries, each containing:
            - date: Date string (YYYY-MM-DD)
            - accuracy: Accuracy percentage for that day

        Note:
            If multiple predictions exist for a day, their accuracies are averaged.
        """
        records = self.record_manager.load_recent_records(days=days)

        if not records:
            return []

        # Group by date
        daily_accuracies: Dict[str, List[float]] = {}
        for record in records:
            date = record['draw_date']
            accuracy = record['accuracy']

            if date not in daily_accuracies:
                daily_accuracies[date] = []
            daily_accuracies[date].append(accuracy)

        # Calculate average per day
        trend = []
        for date, accuracies in sorted(daily_accuracies.items(), reverse=True):
            avg_accuracy = sum(accuracies) / len(accuracies)
            trend.append({
                'date': date,
                'accuracy': avg_accuracy
            })

        return trend

    def check_accuracy_health(self) -> str:
        """
        Check model health status based on recent accuracy.

        Returns:
            Health status: 'good', 'warning', or 'critical'

        Health criteria:
        - GOOD: accuracy >= 70%
        - WARNING: 50% <= accuracy < 70%
        - CRITICAL: accuracy < 50%

        Note:
            If no data available, returns 'good' (no evidence of problems).
        """
        accuracy = self.calculate_accuracy()

        if accuracy is None:
            # No data available - assume good (innocent until proven guilty)
            return 'good'

        if accuracy >= ACCURACY_THRESHOLD_WARNING:
            return 'good'
        elif accuracy >= ACCURACY_THRESHOLD_CRITICAL:
            return 'warning'
        else:
            return 'critical'

    def should_trigger_emergency_retrain(self) -> bool:
        """
        Determine if emergency retraining should be triggered.

        Returns:
            True if emergency retrain needed, False otherwise

        Triggers emergency retrain when:
        - Accuracy < 50% (critical threshold)
        - OR: 8+ failures out of last 10 predictions

        Note:
            This is a critical system function that prevents model degradation.
        """
        accuracy = self.calculate_accuracy()

        # Trigger 1: Accuracy below critical threshold
        if accuracy is not None and accuracy < ACCURACY_THRESHOLD_CRITICAL:
            return True

        # Trigger 2: High failure rate in recent predictions
        recent_records = self.record_manager.load_recent_records(days=DEFAULT_MONITORING_DAYS)
        if len(recent_records) >= EMERGENCY_RECENT_PREDICTION_COUNT:
            # Check last N predictions
            recent = recent_records[:EMERGENCY_RECENT_PREDICTION_COUNT]
            failures = sum(
                1 for r in recent
                if r['match_count'] <= FAILURE_MATCH_THRESHOLD
            )

            if failures >= EMERGENCY_FAILURE_THRESHOLD:
                return True

        return False

    def get_monitor_status(self) -> Dict[str, Any]:
        """
        Get comprehensive monitoring status.

        Returns:
            Dictionary containing:
            - accuracy: Current accuracy percentage (or None)
            - status: Health status ('good', 'warning', 'critical')
            - last_update: Timestamp of last prediction record
            - records_count: Number of recent records
            - emergency_retrain: Whether emergency retrain needed

        Note:
            This method provides all information needed for dashboard display.
        """
        kst = pytz.timezone('Asia/Seoul')
        accuracy = self.calculate_accuracy()
        health = self.check_accuracy_health()
        records = self.record_manager.load_recent_records(days=DEFAULT_MONITORING_DAYS)
        emergency = self.should_trigger_emergency_retrain()

        # Find last update time
        last_update = None
        if records:
            last_update = records[0].get('recorded_at')

        return {
            'accuracy': accuracy,
            'status': health,
            'last_update': last_update or datetime.now(kst).isoformat(),
            'records_count': len(records),
            'emergency_retrain': emergency
        }
