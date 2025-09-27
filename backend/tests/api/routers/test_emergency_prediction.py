"""
Emergency prediction API tests
救急出場件数予測APIのテスト
"""
from datetime import date
from unittest.mock import Mock, patch

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


class TestEmergencyPredictionAPI:
    """Emergency prediction API test cases"""

    def test_health_check(self):
        """ヘルスチェックエンドポイントのテスト"""
        response = client.get("/api/v1/emergency-prediction/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "emergency_prediction_api"
        assert "mlflow_available" in data

    @patch("app.services.emergency_prediction.EmergencyPredictionService")
    def test_predict_emergency_dispatch_success(self, mock_service_class):
        """予測エンドポイントの正常系テスト"""
        # Mock service instance and response
        mock_service = Mock()
        mock_service_class.return_value = mock_service

        mock_result = Mock()
        mock_result.id = "test-uuid"
        mock_result.prediction_date = date(2024, 1, 15)
        mock_result.predicted_count = 42
        mock_result.confidence_score = 0.85
        mock_result.model_name = "test_model"
        mock_result.model_version = "1.0"
        mock_result.dagshub_run_id = "test_run"
        mock_result.created_at = "2024-01-15T10:00:00"

        mock_service.predict_emergency_dispatch.return_value = mock_result

        # Test data
        weather_data = {
            "prediction_date": "2024-01-15",
            "avg_temperature": 20.5,
            "max_temperature": 25.0,
            "min_temperature": 15.0
        }

        request_data = {
            "weather_features": weather_data,
            "model_name": "test_model"
        }

        response = client.post("/api/v1/emergency-prediction/predict", json=request_data)

        assert response.status_code == 200
        data = response.json()
        assert data["predicted_count"] == 42
        assert data["model_name"] == "test_model"

    def test_predict_emergency_dispatch_invalid_data(self):
        """予測エンドポイントの異常系テスト（無効なデータ）"""
        invalid_request = {
            "weather_features": {
                "prediction_date": "invalid-date"
            }
        }

        response = client.post("/api/v1/emergency-prediction/predict", json=invalid_request)
        assert response.status_code == 422  # Validation error

    @patch("app.services.emergency_prediction.EmergencyPredictionService")
    def test_get_latest_predictions(self, mock_service_class):
        """最新予測結果取得のテスト"""
        mock_service = Mock()
        mock_service_class.return_value = mock_service

        mock_results = [Mock() for _ in range(3)]
        for i, result in enumerate(mock_results):
            result.id = f"test-uuid-{i}"
            result.prediction_date = date(2024, 1, 15 + i)
            result.predicted_count = 40 + i
            result.confidence_score = 0.8 + i * 0.01
            result.model_name = "test_model"
            result.model_version = "1.0"
            result.dagshub_run_id = f"test_run_{i}"
            result.created_at = f"2024-01-{15+i}T10:00:00"

        mock_service.get_latest_predictions.return_value = mock_results

        response = client.get("/api/v1/emergency-prediction/results?limit=3")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert data[0]["predicted_count"] == 40

    @patch("app.services.emergency_prediction.EmergencyPredictionService")
    def test_get_prediction_by_id_success(self, mock_service_class):
        """ID指定予測結果取得の正常系テスト"""
        mock_service = Mock()
        mock_service_class.return_value = mock_service

        mock_result = Mock()
        mock_result.id = "test-uuid"
        mock_result.prediction_date = date(2024, 1, 15)
        mock_result.predicted_count = 42
        mock_result.confidence_score = 0.85
        mock_result.model_name = "test_model"
        mock_result.model_version = "1.0"
        mock_result.dagshub_run_id = "test_run"
        mock_result.created_at = "2024-01-15T10:00:00"

        mock_service.get_prediction_by_id.return_value = mock_result

        response = client.get("/api/v1/emergency-prediction/results/test-uuid")

        assert response.status_code == 200
        data = response.json()
        assert data["predicted_count"] == 42

    @patch("app.services.emergency_prediction.EmergencyPredictionService")
    def test_get_prediction_by_id_not_found(self, mock_service_class):
        """ID指定予測結果取得の異常系テスト（見つからない）"""
        mock_service = Mock()
        mock_service_class.return_value = mock_service
        mock_service.get_prediction_by_id.return_value = None

        response = client.get("/api/v1/emergency-prediction/results/nonexistent-uuid")

        assert response.status_code == 404

    @patch("app.services.emergency_prediction.EmergencyPredictionService")
    def test_clear_model_cache(self, mock_service_class):
        """モデルキャッシュクリアのテスト"""
        mock_service = Mock()
        mock_service_class.return_value = mock_service

        response = client.post("/api/v1/emergency-prediction/clear-cache")

        assert response.status_code == 200
        data = response.json()
        assert "successfully" in data["message"]
        mock_service.clear_model_cache.assert_called_once()

    @patch("app.services.emergency_prediction.EmergencyPredictionService")
    def test_get_predictions_by_date_range_success(self, mock_service_class):
        """日付範囲指定予測結果取得の正常系テスト"""
        mock_service = Mock()
        mock_service_class.return_value = mock_service

        mock_results = [Mock()]
        mock_results[0].id = "test-uuid"
        mock_results[0].prediction_date = date(2024, 1, 15)
        mock_results[0].predicted_count = 42
        mock_results[0].confidence_score = 0.85
        mock_results[0].model_name = "test_model"
        mock_results[0].model_version = "1.0"
        mock_results[0].dagshub_run_id = "test_run"
        mock_results[0].created_at = "2024-01-15T10:00:00"

        mock_service.get_predictions_by_date_range.return_value = mock_results

        response = client.get(
            "/api/v1/emergency-prediction/results/date-range"
            "?start_date=2024-01-01&end_date=2024-01-31"
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

    def test_get_predictions_by_date_range_invalid_dates(self):
        """日付範囲指定予測結果取得の異常系テスト（無効な日付範囲）"""
        response = client.get(
            "/api/v1/emergency-prediction/results/date-range"
            "?start_date=2024-01-31&end_date=2024-01-01"
        )

        assert response.status_code == 400
        data = response.json()
        expected_message = "Start date must be before or equal to end date"
        assert expected_message in data["detail"]
