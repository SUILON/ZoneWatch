"""
Emergency dispatch prediction API router
救急出場件数予測APIルーター
"""
import logging
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.emergency import (
    EmergencyDispatchPredictionRequest,
    EmergencyDispatchPredictionResponse,
)
from app.services.emergency_prediction import EmergencyPredictionService

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/emergency-prediction",
    tags=["emergency-prediction"],
    responses={404: {"description": "Not found"}},
)


@router.post("/predict", response_model=EmergencyDispatchPredictionResponse)
async def predict_emergency_dispatch(
    prediction_request: EmergencyDispatchPredictionRequest,
    db: Session = Depends(get_db)
):
    """
    気象データから救急出場件数を予測する

    指定された気象特徴量を使用してDAGsHubのモデルで救急出場件数を予測し、
    結果をデータベースに保存します。

    Args:
        prediction_request: 予測リクエスト（気象特徴量とモデル名）
        db: データベースセッション

    Returns:
        EmergencyDispatchPredictionResponse: 救急出場件数予測結果
    """
    try:
        prediction_service = EmergencyPredictionService(db)

        # 予測を実行
        prediction_result = prediction_service.predict_emergency_dispatch(
            weather_features=prediction_request.weather_features,
            model_name=prediction_request.model_name
        )

        logger.info(
            f"Emergency dispatch prediction completed - "
            f"Prediction ID: {prediction_result.id}, "
            f"Date: {prediction_result.prediction_date}, "
            f"Predicted Count: {prediction_result.predicted_count}"
        )

        # レスポンスを作成
        return EmergencyDispatchPredictionResponse.model_validate(prediction_result)

    except ValueError as e:
        logger.error(f"Emergency dispatch prediction failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error during emergency dispatch prediction: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during prediction"
        )


@router.get("/results/{prediction_id}", response_model=EmergencyDispatchPredictionResponse)
async def get_prediction_result(
    prediction_id: str,
    db: Session = Depends(get_db)
):
    """
    予測結果を取得する

    Args:
        prediction_id: 予測結果のUUID
        db: データベースセッション

    Returns:
        EmergencyDispatchPredictionResponse: 予測結果
    """
    try:
        prediction_service = EmergencyPredictionService(db)
        prediction_result = prediction_service.get_prediction_by_id(prediction_id)

        if not prediction_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Emergency dispatch prediction with ID {prediction_id} not found"
            )

        return EmergencyDispatchPredictionResponse.model_validate(prediction_result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving prediction result {prediction_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/results", response_model=list[EmergencyDispatchPredictionResponse])
async def get_latest_predictions(
    limit: int = Query(default=10, ge=1, le=100, description="取得する結果の上限数"),
    db: Session = Depends(get_db)
):
    """
    最新の予測結果を取得する

    Args:
        limit: 取得する結果の上限数（1-100）
        db: データベースセッション

    Returns:
        List[EmergencyDispatchPredictionResponse]: 予測結果のリスト
    """
    try:
        prediction_service = EmergencyPredictionService(db)
        prediction_results = prediction_service.get_latest_predictions(limit)

        return [EmergencyDispatchPredictionResponse.model_validate(result) for result in prediction_results]

    except Exception as e:
        logger.error(f"Error retrieving latest predictions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/results/date-range", response_model=list[EmergencyDispatchPredictionResponse])
async def get_predictions_by_date_range(
    start_date: date = Query(..., description="開始日"),
    end_date: date = Query(..., description="終了日"),
    db: Session = Depends(get_db)
):
    """
    日付範囲で予測結果を取得する

    Args:
        start_date: 開始日
        end_date: 終了日
        db: データベースセッション

    Returns:
        List[EmergencyDispatchPredictionResponse]: 予測結果のリスト
    """
    try:
        if start_date > end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Start date must be before or equal to end date"
            )

        prediction_service = EmergencyPredictionService(db)
        prediction_results = prediction_service.get_predictions_by_date_range(
            start_date, end_date
        )

        return [EmergencyDispatchPredictionResponse.model_validate(result) for result in prediction_results]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving predictions for date range {start_date} to {end_date}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/clear-cache")
async def clear_model_cache(db: Session = Depends(get_db)):
    """
    モデルキャッシュをクリアする

    メモリ使用量を減らすために、キャッシュされたモデルを削除します。

    Args:
        db: データベースセッション

    Returns:
        dict: 成功メッセージ
    """
    try:
        prediction_service = EmergencyPredictionService(db)
        prediction_service.clear_model_cache()

        logger.info("Emergency prediction model cache cleared successfully")
        return {"message": "Emergency prediction model cache cleared successfully"}

    except Exception as e:
        logger.error(f"Error clearing model cache: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/health")
async def health_check():
    """
    救急出場件数予測APIのヘルスチェック

    Returns:
        dict: ヘルス状態
    """
    try:
        # MLflowが利用可能かチェック
        try:
            __import__('mlflow')
            mlflow_available = True
        except ImportError:
            mlflow_available = False

        return {
            "status": "healthy",
            "service": "emergency_prediction_api",
            "description": "Emergency dispatch count prediction service",
            "mlflow_available": mlflow_available,
            "dagshub_tracking_uri": "configured" if mlflow_available else "not_available"
        }

    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Health check failed"
        )
