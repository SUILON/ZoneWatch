"""
Emergency dispatch prediction models for SQLAlchemy
救急出場件数予測結果のデータベースモデル
"""
from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, Date, DateTime, Float, Integer, String
from sqlalchemy.dialects.postgresql import UUID

from app.core.db import Base


class EmergencyDispatchPrediction(Base):
    """救急出場件数予測結果テーブル"""
    __tablename__ = "emergency_dispatch_predictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)

    # 予測対象日
    prediction_date = Column(Date, nullable=False, index=True, comment="予測対象日")

    # 予測結果
    predicted_count = Column(Integer, nullable=False, comment="予測救急出場件数")
    confidence_score = Column(Float, nullable=True, comment="予測の信頼度スコア")

    # モデル情報
    model_name = Column(String(100), nullable=False, comment="使用したモデル名")
    model_version = Column(String(50), nullable=True, comment="モデルバージョン")
    dagshub_run_id = Column(String(100), nullable=True, comment="DAGsHub実行ID")

    # メタデータ
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, comment="予測実行日時")

    def __repr__(self):
        return f"<EmergencyDispatchPrediction(date={self.prediction_date}, count={self.predicted_count})>"
