"""
ML Infrastructure Test Module

Tests for ML infrastructure setup, directory structure, and model utilities.
@TEST:LOTTO-ML-INFRA-001
"""

import os
import pytest
from pathlib import Path

# Get the project root directory (backend directory)
PROJECT_ROOT = Path(__file__).parent.parent.parent


# @TEST:LOTTO-ML-INFRA-001: ML 디렉토리 구조 검증
class TestMLDirectoryStructure:
    """Test ML directory structure creation"""

    def test_ml_base_directory_exists(self):
        """ML 기본 디렉토리가 존재하는지 확인"""
        # Given: ML 서비스 디렉토리 경로
        ml_dir = PROJECT_ROOT / "app" / "services" / "ml"

        # Then: 디렉토리가 존재해야 함
        assert ml_dir.exists(), "ML base directory must exist"
        assert ml_dir.is_dir(), "ML base path must be a directory"

    def test_ml_subdirectories_exist(self):
        """ML 하위 디렉토리들이 존재하는지 확인"""
        # Given: 필수 하위 디렉토리 목록
        required_subdirs = [
            PROJECT_ROOT / "app" / "models" / "ml" / "trained",      # 학습된 모델 저장
            PROJECT_ROOT / "app" / "models" / "ml" / "metadata",     # 모델 메타데이터
            PROJECT_ROOT / "app" / "models" / "ml" / "backups",      # 모델 백업
        ]

        # Then: 모든 디렉토리가 존재해야 함
        for subdir_path in required_subdirs:
            assert subdir_path.exists(), f"Directory {subdir_path} must exist"
            assert subdir_path.is_dir(), f"{subdir_path} must be a directory"

    def test_ml_init_files_exist(self):
        """ML 모듈 __init__.py 파일들이 존재하는지 확인"""
        # Given: 필수 __init__.py 파일 목록
        required_init_files = [
            PROJECT_ROOT / "app" / "services" / "ml" / "__init__.py",
        ]

        # Then: 모든 __init__.py 파일이 존재해야 함
        for init_path in required_init_files:
            assert init_path.exists(), f"Init file {init_path} must exist"
            assert init_path.is_file(), f"{init_path} must be a file"


# @TEST:LOTTO-ML-INFRA-001: 모델 유틸리티 함수 검증
class TestMLModelUtils:
    """Test ML model save/load utilities"""

    def test_model_save_function_exists(self):
        """모델 저장 함수가 존재하는지 확인"""
        # Given: 모델 유틸리티 모듈 임포트
        from app.services.ml.model_utils import save_model

        # Then: 함수가 호출 가능해야 함
        assert callable(save_model), "save_model must be callable"

    def test_model_load_function_exists(self):
        """모델 로드 함수가 존재하는지 확인"""
        # Given: 모델 유틸리티 모듈 임포트
        from app.services.ml.model_utils import load_model

        # Then: 함수가 호출 가능해야 함
        assert callable(load_model), "load_model must be callable"

    def test_get_latest_model_path_function_exists(self):
        """최신 모델 경로 조회 함수가 존재하는지 확인"""
        # Given: 모델 유틸리티 모듈 임포트
        from app.services.ml.model_utils import get_latest_model_path

        # Then: 함수가 호출 가능해야 함
        assert callable(get_latest_model_path), "get_latest_model_path must be callable"


# @TEST:LOTTO-ML-INFRA-001: ML 의존성 설치 검증
class TestMLDependencies:
    """Test ML library installations"""

    def test_sklearn_installed(self):
        """scikit-learn이 설치되어 있는지 확인"""
        # Given: scikit-learn 임포트
        try:
            import sklearn
            sklearn_version = sklearn.__version__
        except ImportError:
            pytest.fail("scikit-learn is not installed")

        # Then: 버전이 1.7.0 이상이어야 함
        major, minor, patch = map(int, sklearn_version.split('.')[:3])
        assert major >= 1 and minor >= 7, f"scikit-learn version must be >= 1.7.0, got {sklearn_version}"

    def test_joblib_installed(self):
        """joblib이 설치되어 있는지 확인"""
        # Given: joblib 임포트
        try:
            import joblib
            joblib_version = joblib.__version__
        except ImportError:
            pytest.fail("joblib is not installed")

        # Then: 버전이 1.5.0 이상이어야 함
        major, minor, patch = map(int, joblib_version.split('.')[:3])
        assert major >= 1 and minor >= 5, f"joblib version must be >= 1.5.0, got {joblib_version}"

    def test_pandas_installed(self):
        """pandas가 설치되어 있는지 확인 (이미 설치됨)"""
        # Given: pandas 임포트
        try:
            import pandas as pd
            pandas_version = pd.__version__
        except ImportError:
            pytest.fail("pandas is not installed")

        # Then: 버전이 2.1.0 이상이어야 함
        major, minor, patch = map(int, pandas_version.split('.')[:3])
        assert major >= 2 and minor >= 1, f"pandas version must be >= 2.1.0, got {pandas_version}"

    def test_numpy_installed(self):
        """numpy가 설치되어 있는지 확인 (이미 설치됨)"""
        # Given: numpy 임포트
        try:
            import numpy as np
            numpy_version = np.__version__
        except ImportError:
            pytest.fail("numpy is not installed")

        # Then: 버전이 1.26.0 이상이어야 함
        major, minor = map(int, numpy_version.split('.')[:2])
        assert (major > 1) or (major == 1 and minor >= 26), f"numpy version must be >= 1.26.0, got {numpy_version}"
