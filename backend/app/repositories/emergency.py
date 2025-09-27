"""
Emergency dispatch prediction repository for database operations
救急出場件数予測結果のデータベース操作レイヤー
"""
from datetime import date
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.emergency import EmergencyDispatchPrediction
from app.schemas.emergency import EmergencyDispatchPredictionCreate


class EmergencyDispatchPredictionRepository:
    """救急出場件数予測結果リポジトリ"""

    def __init__(self, db: Session):
        self.db = db

    def create(self, prediction_data: EmergencyDispatchPredictionCreate) -> EmergencyDispatchPrediction:
        """救急出場件数予測結果を作成する"""
        db_prediction = EmergencyDispatchPrediction(
            prediction_date=prediction_data.prediction_date,
            predicted_count=prediction_data.predicted_count,
            confidence_score=prediction_data.confidence_score,
            model_name=prediction_data.model_name,
            model_version=prediction_data.model_version,
            dagshub_run_id=prediction_data.dagshub_run_id,
        )

        try:
            self.db.add(db_prediction)
            self.db.commit()
            self.db.refresh(db_prediction)
            return db_prediction
        except IntegrityError as e:
            self.db.rollback()
            raise ValueError(f"Failed to create emergency dispatch prediction: {e}")

    def get_by_id(self, prediction_id: UUID) -> EmergencyDispatchPrediction | None:
        """IDで救急出場件数予測結果を取得する"""
        return (
            self.db.query(EmergencyDispatchPrediction)
            .filter(EmergencyDispatchPrediction.id == prediction_id)
            .first()
        )

    def get_by_date(self, target_date: date) -> list[EmergencyDispatchPrediction]:
        """日付で救急出場件数予測結果を取得する（複数の予測が存在する可能性）"""
        return (
            self.db.query(EmergencyDispatchPrediction)
            .filter(EmergencyDispatchPrediction.prediction_date == target_date)
            .order_by(EmergencyDispatchPrediction.created_at.desc())
            .all()
        )

    def get_latest_by_date(self, target_date: date) -> EmergencyDispatchPrediction | None:
        """指定日付の最新の予測結果を取得する"""
        return (
            self.db.query(EmergencyDispatchPrediction)
            .filter(EmergencyDispatchPrediction.prediction_date == target_date)
            .order_by(EmergencyDispatchPrediction.created_at.desc())
            .first()
        )

    def get_by_date_range(
        self, start_date: date, end_date: date
    ) -> list[EmergencyDispatchPrediction]:
        """日付範囲で救急出場件数予測結果を取得する（各日付の最新のみ）"""
        # サブクエリで各日付の最新のcreated_atを取得
        subquery = (
            self.db.query(
                EmergencyDispatchPrediction.prediction_date,
                self.db.query(EmergencyDispatchPrediction.created_at)
                .filter(
                    EmergencyDispatchPrediction.prediction_date == EmergencyDispatchPrediction.prediction_date
                )
                .order_by(EmergencyDispatchPrediction.created_at.desc())
                .limit(1)
                .label("max_created_at")
            )
            .filter(EmergencyDispatchPrediction.prediction_date >= start_date)
            .filter(EmergencyDispatchPrediction.prediction_date <= end_date)
            .group_by(EmergencyDispatchPrediction.prediction_date)
            .subquery()
        )

        # 各日付の最新の予測結果を取得
        return (
            self.db.query(EmergencyDispatchPrediction)
            .join(
                subquery,
                (EmergencyDispatchPrediction.prediction_date == subquery.c.prediction_date)
                & (EmergencyDispatchPrediction.created_at == subquery.c.max_created_at)
            )
            .order_by(EmergencyDispatchPrediction.prediction_date.desc())
            .all()
        )

    def get_latest_predictions(self, limit: int = 10) -> list[EmergencyDispatchPrediction]:
        """最新の予測結果を取得する"""
        return (
            self.db.query(EmergencyDispatchPrediction)
            .order_by(EmergencyDispatchPrediction.created_at.desc())
            .limit(limit)
            .all()
        )

    def get_by_model_name(
        self, model_name: str, limit: int = 100
    ) -> list[EmergencyDispatchPrediction]:
        """モデル名で予測結果を取得する"""
        return (
            self.db.query(EmergencyDispatchPrediction)
            .filter(EmergencyDispatchPrediction.model_name == model_name)
            .order_by(EmergencyDispatchPrediction.created_at.desc())
            .limit(limit)
            .all()
        )

    def delete(self, prediction_id: UUID) -> bool:
        """救急出場件数予測結果を削除する"""
        db_prediction = self.get_by_id(prediction_id)
        if not db_prediction:
            return False

        try:
            self.db.delete(db_prediction)
            self.db.commit()
            return True
        except IntegrityError as e:
            self.db.rollback()
            raise ValueError(f"Failed to delete emergency dispatch prediction: {e}")

    def get_predictions_summary(
        self, start_date: date, end_date: date, model_name: str | None = None
    ) -> list[EmergencyDispatchPrediction]:
        """期間とモデル名で予測結果のサマリーを取得する"""
        query = self.db.query(EmergencyDispatchPrediction).filter(
            EmergencyDispatchPrediction.prediction_date >= start_date,
            EmergencyDispatchPrediction.prediction_date <= end_date
        )

        if model_name:
            query = query.filter(EmergencyDispatchPrediction.model_name == model_name)

        return query.order_by(EmergencyDispatchPrediction.prediction_date.desc()).all()
