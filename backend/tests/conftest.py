"""
Test configuration and fixtures for Zone Watch backend tests
"""

import os
from datetime import datetime
from unittest.mock import Mock

import pytest

# Set test environment variables
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("MLFLOW_TRACKING_URI", "https://dagshub.com/test/test.mlflow")
os.environ.setdefault("DAGSHUB_USER_TOKEN", "test-token")


@pytest.fixture
def mock_db_session():
    """Mock database session for testing"""
    class MockDBSession:
        def __init__(self):
            self._queries = []

        def query(self, *args, **kwargs):
            mock_query = Mock()
            mock_query.filter.return_value = mock_query
            mock_query.order_by.return_value = mock_query
            mock_query.limit.return_value = mock_query
            mock_query.offset.return_value = mock_query
            mock_query.all.return_value = []
            mock_query.first.return_value = None
            return mock_query

        def add(self, obj):
            self._queries.append(('add', obj))

        def commit(self):
            self._queries.append(('commit',))

        def rollback(self):
            self._queries.append(('rollback',))

        def close(self):
            self._queries.append(('close',))

    return MockDBSession()


@pytest.fixture
def test_weather_features():
    """Test weather features data"""
    from app.schemas.emergency import WeatherFeatures

    return WeatherFeatures(
        prediction_date=datetime(2023, 9, 26).date(),
        avg_temperature=25.0,
        max_temperature=30.0,
        min_temperature=20.0,
        max_humidity=80.0,
        min_humidity=60.0,
        avg_humidity=70.0,
        avg_wind_speed=2.0,
        max_wind_speed=5.0,
        min_wind_speed=1.0,
        sunshine_hours_0_8=3.0,
        sunshine_hours_9_16=5.0,
        sunshine_hours_17_23=2.0,
        total_sunshine_hours=10.0,
        avg_pressure=1013.0,
        max_pressure=1015.0,
        min_pressure=1010.0,
        precipitation_0_8=0.0,
        precipitation_9_16=0.0,
        precipitation_17_23=0.0,
        total_precipitation=0.0,
        s_wbgt=28.0,
        max_accumulated_temp_10=250.0,
        min_accumulated_temp_10=200.0,
        daily_temperature_range=10.0,
        summer_day=True,
        very_hot_day=False,
        extremely_hot_day=False,
        extremely_hot_day_40over=False,
        tropical_night=False,
        winter_day=False,
        very_cold_day=False,
        last_day=30.0,
        mv_avg10=25.0
    )


@pytest.fixture
def mock_mlflow_client():
    """Mock MLflow client for testing"""
    mock_client = Mock()

    # Mock model version info
    mock_version = Mock()
    mock_version.run_id = "test-run-id-123"
    mock_version.version = "1"

    mock_client.search_registered_models.return_value = [Mock(name="test_model")]
    mock_client.get_model_version.return_value = mock_version
    mock_client.get_latest_versions.return_value = [mock_version]

    return mock_client


@pytest.fixture
def mock_mlflow_model():
    """Mock MLflow model for testing"""
    mock_model = Mock()
    mock_model.predict.return_value = [42.0]  # Mock prediction result
    return mock_model


# Pytest markers
def pytest_configure(config):
    """Configure custom pytest markers"""
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests (deselect with '-m \"not integration\"')"
    )
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line(
        "markers", "unit: marks tests as unit tests"
    )
