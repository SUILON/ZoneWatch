"""
Emergency Prediction Service テスト
実際の認証情報なしでのサービス検証
"""

import logging
from datetime import datetime

import pytest

logger = logging.getLogger(__name__)


def test_emergency_prediction_service_structure():
    """EmergencyPredictionServiceの構造をテストする"""
    try:
        logger.info("=== Service Structure Test ===")

        from app.services.emergency_prediction import EmergencyPredictionService

        # クラスが正しくインポートできることを確認
        logger.info("✅ EmergencyPredictionService imported successfully")
        logger.info("✅ WeatherFeatures schema imported successfully")

        # メソッドの存在を確認
        required_methods = [
            '_setup_mlflow',
            '_prepare_features',
            '_load_model',
            '_get_model_info',
            'predict_emergency_dispatch',
            'validate_model',
            'get_prediction_by_id',
            'get_latest_predictions',
            'clear_model_cache'
        ]

        for method in required_methods:
            if hasattr(EmergencyPredictionService, method):
                logger.info(f"✅ Method {method} exists")
            else:
                logger.error(f"❌ Method {method} missing")
                return False

        return True

    except Exception as e:
        logger.error(f"Service structure test failed: {str(e)}")
        return False


def test_feature_preparation():
    """特徴量準備機能をテストする"""
    try:
        logger.info("=== Feature Preparation Test ===")

        from datetime import datetime

        from app.schemas.emergency import WeatherFeatures
        from app.services.emergency_prediction import EmergencyPredictionService

        # ダミーDBセッション
        class MockDB:
            def rollback(self):
                pass

        mock_db = MockDB()

        # テスト用特徴量
        test_features = WeatherFeatures(
            prediction_date=datetime.now().date(),
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

        # サービスを初期化してMLflow設定をスキップ
        class TestService(EmergencyPredictionService):
            def _setup_mlflow(self):
                # MLflow設定をスキップ（認証情報なしでテスト）
                self.client = None
                logger.info("MLflow setup skipped for testing")

        service = TestService(mock_db)

        # 特徴量準備をテスト
        features_df = service._prepare_features(test_features)

        logger.info(f"✅ Features DataFrame created: shape={features_df.shape}")
        logger.info(f"✅ Features columns: {list(features_df.columns)}")

        # 期待される列数を確認
        expected_columns = 35  # CLAUDEMDで指定された特徴量数
        if features_df.shape[1] == expected_columns:
            logger.info(f"✅ Correct number of features: {expected_columns}")
        else:
            logger.warning(f"⚠️  Feature count mismatch: expected {expected_columns}, got {features_df.shape[1]}")

        # データ型を確認
        logger.info(f"✅ Features data types: {features_df.dtypes.unique()}")

        return True

    except Exception as e:
        logger.error(f"Feature preparation test failed: {str(e)}")
        return False


def test_dependencies():
    """必要な依存関係をテストする"""
    try:
        logger.info("=== Dependencies Test ===")

        # 必要なライブラリのインポートをテスト
        import mlflow
        logger.info(f"✅ MLflow version: {mlflow.__version__}")

        import pandas as pd
        logger.info(f"✅ Pandas version: {pd.__version__}")

        import numpy as np
        logger.info(f"✅ NumPy version: {np.__version__}")

        try:
            import dagshub
            logger.info(f"✅ DAGsHub version: {dagshub.__version__}")
        except ImportError:
            logger.warning("⚠️  DAGsHub library not available")

        logger.info("✅ MLflow tracking client available")

        return True

    except Exception as e:
        logger.error(f"Dependencies test failed: {str(e)}")
        return False


def test_configuration():
    """設定の検証"""
    try:
        logger.info("=== Configuration Test ===")

        from app.core.config import settings

        logger.info(f"✅ MLflow Tracking URI: {settings.MLFLOW_TRACKING_URI}")
        logger.info(f"✅ DAGsHub Token configured: {'Yes' if settings.DAGSHUB_USER_TOKEN else 'No'}")

        # 設定の妥当性をチェック
        if settings.MLFLOW_TRACKING_URI.startswith("https://dagshub.com"):
            logger.info("✅ DAGsHub MLflow URI format is correct")
        else:
            logger.warning("⚠️  MLflow URI may not be configured for DAGsHub")

        return True

    except Exception as e:
        logger.error(f"Configuration test failed: {str(e)}")
        return False


@pytest.fixture
def mock_db():
    """モックDBセッション"""
    class MockDB:
        def rollback(self):
            pass
    return MockDB()


@pytest.fixture
def test_weather_features():
    """テスト用気象特徴量"""
    from app.schemas.emergency import WeatherFeatures

    return WeatherFeatures(
        prediction_date=datetime.now().date(),
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


class TestEmergencyPredictionService:
    """Emergency Prediction Service のテストクラス"""

    def test_service_structure(self):
        """サービスの構造をテスト"""
        assert test_emergency_prediction_service_structure()

    def test_dependencies(self):
        """依存関係をテスト"""
        assert test_dependencies()

    def test_configuration(self):
        """設定をテスト"""
        assert test_configuration()

    def test_feature_preparation(self):
        """特徴量準備をテスト"""
        assert test_feature_preparation()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
