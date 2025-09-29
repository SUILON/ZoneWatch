"""
DAGsHub統合テストスクリプト
実際のモデル読み込みと推論をテストする
"""

import logging
import os

import pytest

# 環境変数を設定（必要に応じて変更）
os.environ.setdefault("ENVIRONMENT", "development")
os.environ.setdefault("MLFLOW_TRACKING_URI", "https://dagshub.com/username/repository.mlflow")
os.environ.setdefault("DAGSHUB_USER_TOKEN", "")  # 実際のトークンが必要

logger = logging.getLogger(__name__)

def test_dagshub_connection():
    """DAGsHub接続をテストする"""
    try:
        import mlflow
        from mlflow.tracking import MlflowClient

        from app.core.config import settings

        logger.info("=== DAGsHub Connection Test ===")
        logger.info(f"MLflow Tracking URI: {settings.MLFLOW_TRACKING_URI}")
        logger.info(f"DAGsHub Token configured: {'Yes' if settings.DAGSHUB_USER_TOKEN else 'No'}")

        # MLflowクライアントの設定
        mlflow.set_tracking_uri(settings.MLFLOW_TRACKING_URI)

        if settings.DAGSHUB_USER_TOKEN:
            os.environ["MLFLOW_TRACKING_USERNAME"] = settings.DAGSHUB_USER_TOKEN
            os.environ["MLFLOW_TRACKING_PASSWORD"] = settings.DAGSHUB_USER_TOKEN

        client = MlflowClient()

        # 登録されたモデルを確認
        models = client.search_registered_models(max_results=10)
        logger.info(f"Found {len(models)} registered models:")
        for model in models:
            logger.info(f"  - {model.name}")

        return True

    except Exception as e:
        logger.error(f"DAGsHub connection failed: {str(e)}")
        return False

def test_model_loading():
    """モデル読み込みをテストする"""
    try:

        from app.services.emergency_prediction import EmergencyPredictionService

        logger.info("=== Model Loading Test ===")

        # ダミーDBセッション（実際の予測では本物のDBが必要）
        class MockDB:
            def rollback(self):
                pass

        mock_db = MockDB()

        # EmergencyPredictionServiceの初期化をテスト
        service = EmergencyPredictionService(mock_db)
        logger.info("Emergency prediction service initialized successfully")

        # モデル検証を実行
        validation_result = service.validate_model()

        logger.info("=== Model Validation Result ===")
        for key, value in validation_result.items():
            logger.info(f"{key}: {value}")

        return validation_result["status"] == "success"

    except Exception as e:
        logger.error(f"Model loading test failed: {str(e)}")
        return False

def test_dagshub_client():
    """DAGsHub Clientライブラリをテストする"""
    try:
        logger.info("=== DAGsHub Client Test ===")

        # DAGsHub Clientの機能をテスト
        try:
            from dagshub.auth import get_token
            token = get_token()
            if token:
                logger.info("DAGsHub token retrieved successfully")
            else:
                logger.warning("No DAGsHub token found")
        except ImportError:
            logger.warning("dagshub library not installed - install with: pip install dagshub")
        except Exception as e:
            logger.warning(f"DAGsHub client test failed: {str(e)}")

        return True

    except Exception as e:
        logger.error(f"DAGsHub client test failed: {str(e)}")
        return False

@pytest.mark.integration
def test_full_dagshub_integration():
    """完全なDAGsHub統合テスト"""
    # 1. DAGsHub接続テスト
    connection_result = test_dagshub_connection()
    assert connection_result, "DAGsHub connection failed"

    # 2. DAGsHub Clientテスト
    client_result = test_dagshub_client()
    assert client_result, "DAGsHub client test failed"

    # 3. モデル読み込みテスト
    if connection_result:
        model_loading_result = test_model_loading()
        assert model_loading_result, "Model loading test failed"


if __name__ == "__main__":
    # 直接実行の場合
    pytest.main([__file__, "-v"])
