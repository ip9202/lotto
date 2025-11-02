"""
Pytest configuration and shared fixtures
"""

import sys
import os
from pathlib import Path
import pytest

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

# Mock database engine to avoid psycopg2 import error
import unittest.mock as mock

# Create mock engine before importing any backend modules
mock_engine = mock.MagicMock()
mock_session_maker = mock.MagicMock()

sys.modules['psycopg2'] = mock.MagicMock()

@pytest.fixture
def mock_env(monkeypatch):
    """Mock environment variables for testing"""
    monkeypatch.setenv("DATABASE_URL", "postgresql://test:test@localhost/test")
    monkeypatch.setenv("SECRET_KEY", "test-secret-key")
    monkeypatch.setenv("FRONTEND_URL", "http://localhost:3000")
