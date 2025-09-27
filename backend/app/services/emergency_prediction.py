"""
Emergency dispatch prediction service for DAGsHub model inference
DAGsHubからモデルを取得して救急出場件数予測を実行するサービス層
"""
import logging
import os
from typing import Any

import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

try:
    import mlflow
    import mlflow.pyfunc
    from mlflow.tracking import MlflowClient
except ImportError:
    mlflow = None
    MlflowClient = None

from app.core.config import settings
from app.models.emergency import EmergencyDispatchPrediction
from app.repositories.emergency import EmergencyDispatchPredictionRepository
from app.schemas.emergency import (
    EmergencyDispatchPredictionCreate,
    WeatherFeatures,
)

logger = logging.getLogger(__name__)


class EmergencyPredictionService:
    """救急出場件数予測サービス"""

    def __init__(self, db: Session):
        self.db = db
        self.prediction_repo = EmergencyDispatchPredictionRepository(db)
        self._model_cache = {}
        self._setup_mlflow()

    def _setup_mlflow(self):
        """MLflowの設定を行う - 最適化版"""
        if mlflow is None:
            raise ImportError("MLflow is required for prediction service. Install with: pip install mlflow")

        # DAGsHub用の設定
        mlflow.set_tracking_uri(settings.MLFLOW_TRACKING_URI)
        logger.info(f"MLflow tracking URI set to: {settings.MLFLOW_TRACKING_URI}")

        # DAGsHubトークンが設定されている場合は環境変数に設定
        if settings.DAGSHUB_USER_TOKEN and settings.DAGSHUB_USERNAME:
            os.environ["MLFLOW_TRACKING_USERNAME"] = settings.DAGSHUB_USERNAME
            os.environ["MLFLOW_TRACKING_PASSWORD"] = settings.DAGSHUB_USER_TOKEN
            logger.info(f"DAGsHub authentication configured for user: {settings.DAGSHUB_USERNAME}")
        else:
            logger.warning("DAGSHUB_USER_TOKEN or DAGSHUB_USERNAME not set - model loading may fail")

        # クライアントを作成するが接続テストはスキップ（遅延読み込み）
        self.client = MlflowClient()
        logger.info("MLflow client initialized successfully")

    def _prepare_features(self, weather_features: WeatherFeatures) -> pd.DataFrame:
        """
        気象特徴量から推論用のDataFrameを準備する
        指定された特徴量の順序に合わせてDataFrameを作成
        """
        # 指定された特徴量の順序
        feature_columns = [
            'year', 'month', 'day', '平均気温', '最高気温', '最低気温', '最高湿度',
            '最低湿度', '平均湿度', '平均風速', '最高風速', '最低風速', '日照時間0-8h', '日照時間9-16h',
            '日照時間17-23h', '全日照時間', '平均気圧', '最高気圧', '最低気圧', '降水量0-8h', '降水量9-16h',
            '降水量17-23h', '降水量', 's_WBGT', '最高積算温度10', '最低積算温度10', '日較差', '夏日',
            '真夏日', '猛暑日', '猛暑日40over', '熱帯夜', '冬日', '真冬日', 'last_day', 'mv_avg10'
        ]

        # データを辞書形式で準備（モデルが期待するデータ型に合わせる）
        feature_data = {
            # 日付データ：float型に変換（モデルの期待通り）
            'year': float(weather_features.prediction_date.year),
            'month': float(weather_features.prediction_date.month),
            'day': float(weather_features.prediction_date.day),

            # 気温データ：float型、Noneの場合は0.0でデフォルト値を設定
            '平均気温': weather_features.avg_temperature if weather_features.avg_temperature is not None else 0.0,
            '最高気温': weather_features.max_temperature if weather_features.max_temperature is not None else 0.0,
            '最低気温': weather_features.min_temperature if weather_features.min_temperature is not None else 0.0,

            # 湿度データ：float型、Noneの場合は適切なデフォルト値を設定
            '最高湿度': weather_features.max_humidity if weather_features.max_humidity is not None else 70.0,
            '最低湿度': weather_features.min_humidity if weather_features.min_humidity is not None else 50.0,
            '平均湿度': weather_features.avg_humidity if weather_features.avg_humidity is not None else 60.0,

            # 風速データ：float型、Noneの場合は適切なデフォルト値を設定
            '平均風速': weather_features.avg_wind_speed if weather_features.avg_wind_speed is not None else 2.0,
            '最高風速': weather_features.max_wind_speed if weather_features.max_wind_speed is not None else 5.0,
            '最低風速': weather_features.min_wind_speed if weather_features.min_wind_speed is not None else 1.0,

            # 日照時間データ：float型、Noneの場合は適切なデフォルト値を設定
            '日照時間0-8h': weather_features.sunshine_hours_0_8 if weather_features.sunshine_hours_0_8 is not None else 3.0,
            '日照時間9-16h': weather_features.sunshine_hours_9_16 if weather_features.sunshine_hours_9_16 is not None else 5.0,
            '日照時間17-23h': weather_features.sunshine_hours_17_23 if weather_features.sunshine_hours_17_23 is not None else 2.0,
            '全日照時間': weather_features.total_sunshine_hours if weather_features.total_sunshine_hours is not None else 10.0,

            # 気圧データ：float型、Noneの場合は適切なデフォルト値を設定
            '平均気圧': weather_features.avg_pressure if weather_features.avg_pressure is not None else 1013.0,
            '最高気圧': weather_features.max_pressure if weather_features.max_pressure is not None else 1015.0,
            '最低気圧': weather_features.min_pressure if weather_features.min_pressure is not None else 1010.0,

            # 降水量データ：float型、Noneの場合は0.0でデフォルト値を設定
            '降水量0-8h': weather_features.precipitation_0_8 if weather_features.precipitation_0_8 is not None else 0.0,
            '降水量9-16h': weather_features.precipitation_9_16 if weather_features.precipitation_9_16 is not None else 0.0,
            '降水量17-23h': weather_features.precipitation_17_23 if weather_features.precipitation_17_23 is not None else 0.0,
            '降水量': weather_features.total_precipitation if weather_features.total_precipitation is not None else 0.0,

            # WBGT指数：float型、Noneの場合は適切なデフォルト値を設定
            's_WBGT': weather_features.s_wbgt if weather_features.s_wbgt is not None else 25.0,

            # 積算温度：float型、Noneの場合は適切なデフォルト値を設定
            '最高積算温度10': weather_features.max_accumulated_temp_10 if weather_features.max_accumulated_temp_10 is not None else 250.0,
            '最低積算温度10': weather_features.min_accumulated_temp_10 if weather_features.min_accumulated_temp_10 is not None else 200.0,

            # 日較差：float型、Noneの場合は適切なデフォルト値を設定
            '日較差': weather_features.daily_temperature_range if weather_features.daily_temperature_range is not None else 10.0,

            # 日数カウント：モデルはlong型（整数）を期待、boolからintに変換
            '夏日': int(weather_features.summer_day) if weather_features.summer_day is not None else 0,
            '真夏日': int(weather_features.very_hot_day) if weather_features.very_hot_day is not None else 0,
            '猛暑日': int(weather_features.extremely_hot_day) if weather_features.extremely_hot_day is not None else 0,
            '猛暑日40over': int(weather_features.extremely_hot_day_40over) if weather_features.extremely_hot_day_40over is not None else 0,
            '熱帯夜': int(weather_features.tropical_night) if weather_features.tropical_night is not None else 0,
            '冬日': int(weather_features.winter_day) if weather_features.winter_day is not None else 0,
            '真冬日': int(weather_features.very_cold_day) if weather_features.very_cold_day is not None else 0,

            # その他の特徴量：float型、Noneの場合は適切なデフォルト値を設定
            'last_day': weather_features.last_day if weather_features.last_day is not None else 30.0,
            'mv_avg10': int(weather_features.mv_avg10) if weather_features.mv_avg10 is not None else 25,
        }

        # DataFrameを作成（指定された列順序で）
        df = pd.DataFrame([feature_data], columns=feature_columns)

        # データ型を明示的に設定してモデルとの互換性を確保
        dtype_mapping = {
            'year': 'float64',
            'month': 'float64',
            'day': 'float64',
            '平均気温': 'float64',
            '最高気温': 'float64',
            '最低気温': 'float64',
            '最高湿度': 'float64',
            '最低湿度': 'float64',
            '平均湿度': 'float64',
            '平均風速': 'float64',
            '最高風速': 'float64',
            '最低風速': 'float64',
            '日照時間0-8h': 'float64',
            '日照時間9-16h': 'float64',
            '日照時間17-23h': 'float64',
            '全日照時間': 'float64',
            '平均気圧': 'float64',
            '最高気圧': 'float64',
            '最低気圧': 'float64',
            '降水量0-8h': 'float64',
            '降水量9-16h': 'float64',
            '降水量17-23h': 'float64',
            '降水量': 'float64',
            's_WBGT': 'float64',
            '最高積算温度10': 'float64',
            '最低積算温度10': 'float64',
            '日較差': 'float64',
            '夏日': 'int64',
            '真夏日': 'int64',
            '猛暑日': 'int64',
            '猛暑日40over': 'int64',
            '熱帯夜': 'int64',
            '冬日': 'int64',
            '真冬日': 'int64',
            'last_day': 'float64',
            'mv_avg10': 'int64'
        }

        df = df.astype(dtype_mapping)

        logger.info(f"Features prepared with shape: {df.shape}")
        logger.info(f"Features dtypes: {df.dtypes.to_dict()}")

        return df

    def _load_model(self, model_name: str, model_version: str | None = None) -> Any:
        """
        DAGsHubからモデルを読み込む - 最適化版
        キャッシュ機能付き、シンプルで高速なロード
        """
        cache_key = f"{model_name}_{model_version or 'latest'}"

        if cache_key in self._model_cache:
            logger.info(f"Using cached model: {cache_key}")
            return self._model_cache[cache_key]

        try:
            # モデルURIを構築（最も効率的な方法）
            if model_version:
                model_uri = f"models:/{model_name}/{model_version}"
            else:
                model_uri = f"models:/{model_name}/latest"

            logger.info(f"Loading model from: {model_uri}")

            # 直接models URIを使用してロード
            model = mlflow.pyfunc.load_model(model_uri)

            # モデルをキャッシュに保存
            self._model_cache[cache_key] = model
            logger.info(f"Successfully loaded and cached model: {cache_key}")

            return model

        except Exception as e:
            logger.error(f"Failed to load MLflow model {model_name}: {str(e)}")

            # より具体的なエラーメッセージ
            if "RESOURCE_DOES_NOT_EXIST" in str(e):
                logger.error(f"Model '{model_name}' version '{model_version or 'latest'}' not found in registry")
                logger.error("Check available models with: mlflow.tracking.MlflowClient().search_registered_models()")
            elif "permission" in str(e).lower() or "auth" in str(e).lower():
                logger.error("Authentication failed. Check DAGSHUB_USER_TOKEN environment variable")

            raise ValueError(f"Failed to load model '{model_name}' version '{model_version or 'latest'}': {str(e)}")

    def validate_model(self, model_name: str = "0926test", model_version: str | None = None) -> dict[str, Any]:
        """
        モデルの読み込みと基本的な推論機能をテストする
        """
        logger.info(f"Validating model: {model_name}")

        try:
            # 1. モデルを直接読み込み（最適化版）
            model = self._load_model(model_name, model_version)
            logger.info(f"Model loaded successfully: {type(model)}")

            # 2. モデル情報を構築
            effective_version = model_version or "latest"
            model_info = {
                "model_name": model_name,
                "model_version": effective_version,
                "run_id": "auto-detected"
            }

            # 3. テスト用のダミーデータで推論を実行
            from datetime import datetime

            from app.schemas.emergency import WeatherFeatures

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

            features_df = self._prepare_features(test_features)
            logger.info(f"Test features prepared: shape={features_df.shape}")

            # 4. 推論を実行
            prediction = model.predict(features_df)
            logger.info(f"Test prediction completed: {prediction}")

            if isinstance(prediction, np.ndarray):
                predicted_value = float(prediction[0])
            else:
                predicted_value = float(prediction)

            validation_result = {
                "status": "success",
                "model_info": model_info,
                "model_type": str(type(model)),
                "test_prediction": predicted_value,
                "features_shape": features_df.shape,
                "message": "Model validation completed successfully"
            }

            logger.info("Model validation completed successfully")
            return validation_result

        except Exception as e:
            logger.error(f"Model validation failed: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "message": "Model validation failed"
            }

    def _get_model_info(self, model_name: str, model_version: str | None = None) -> dict[str, Any]:
        """モデル情報を取得する"""
        try:
            if model_version:
                model_version_info = self.client.get_model_version(model_name, model_version)
                run_id = model_version_info.run_id
                version = model_version
            else:
                # Use search_model_versions instead of deprecated get_latest_versions
                model_versions = self.client.search_model_versions(f"name='{model_name}'")
                if not model_versions:
                    raise ValueError(f"No versions found for model {model_name}")

                # Get the latest version (highest version number)
                model_version_info = max(model_versions, key=lambda x: int(x.version))
                run_id = model_version_info.run_id
                version = model_version_info.version

            return {
                "model_name": model_name,
                "model_version": version,
                "run_id": run_id,
            }
        except Exception as e:
            logger.error(f"Failed to get model info for {model_name}: {str(e)}")
            raise ValueError(f"Failed to get model info for '{model_name}': {str(e)}")

    def predict_emergency_dispatch(
        self,
        weather_features: WeatherFeatures,
        model_name: str = "0926test",
        model_version: str | None = None
    ) -> EmergencyDispatchPrediction:
        """
        気象特徴量から救急出場件数を予測し、結果をデータベースに保存する
        """
        try:
            # 1. 特徴量を準備
            logger.info(f"Preparing features for prediction on date: {weather_features.prediction_date}")
            features_df = self._prepare_features(weather_features)

            # 2. モデルを読み込み
            logger.info(f"Loading model: {model_name}")
            model = self._load_model(model_name, model_version)

            # 3. モデル情報を構築（簡潔版）
            effective_version = model_version or "latest"
            model_info = {
                "model_name": model_name,
                "model_version": effective_version,
                "run_id": "auto-detected"  # 実際のrun_idは不要
            }

            # 4. 推論を実行
            logger.info("Running emergency dispatch prediction")
            prediction = model.predict(features_df)

            # 予測値を取得（配列の場合は最初の要素、整数に変換）
            if isinstance(prediction, np.ndarray):
                predicted_count = int(round(prediction[0]))
            else:
                predicted_count = int(round(prediction))

            # 負の値は0にクリップ
            predicted_count = max(0, predicted_count)

            # 信頼度スコア（モデルによってはproba_があることを想定）
            confidence_score = None
            try:
                if hasattr(model, 'predict_proba'):
                    proba = model.predict_proba(features_df)
                    if proba is not None:
                        confidence_score = float(np.max(proba[0]))
            except Exception as e:
                logger.warning(f"Could not calculate confidence score: {e}")

            # 5. 予測結果をデータベースに保存
            logger.info(f"Saving prediction result: {predicted_count} emergency dispatches")

            prediction_create = EmergencyDispatchPredictionCreate(
                prediction_date=weather_features.prediction_date,
                predicted_count=predicted_count,
                confidence_score=confidence_score,
                model_name=model_info["model_name"],
                model_version=model_info["model_version"],
                dagshub_run_id=model_info["run_id"],
            )

            db_prediction = self.prediction_repo.create(prediction_create)

            logger.info(f"Emergency dispatch prediction completed successfully. Prediction ID: {db_prediction.id}")
            return db_prediction

        except Exception as e:
            logger.error(f"Emergency dispatch prediction failed: {str(e)}")
            # エラーの場合はロールバック
            self.db.rollback()
            raise ValueError(f"Emergency dispatch prediction failed: {str(e)}")

    def get_prediction_by_id(self, prediction_id: str) -> EmergencyDispatchPrediction | None:
        """IDで予測結果を取得する"""
        try:
            from uuid import UUID
            uuid_id = UUID(prediction_id)
            return self.prediction_repo.get_by_id(uuid_id)
        except ValueError:
            return None

    def get_latest_predictions(self, limit: int = 10) -> list:
        """最新の予測結果を取得する"""
        return self.prediction_repo.get_latest_predictions(limit)

    def get_predictions_by_date_range(self, start_date, end_date) -> list:
        """日付範囲で予測結果を取得する"""
        return self.prediction_repo.get_by_date_range(start_date, end_date)

    def clear_model_cache(self):
        """モデルキャッシュをクリアする"""
        self._model_cache.clear()
        logger.info("Model cache cleared")
