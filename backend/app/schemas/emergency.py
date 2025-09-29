"""
Emergency dispatch prediction schemas for API requests and responses
救急出場件数予測のPydanticスキーマ
"""
from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class WeatherFeatures(BaseModel):
    """推論に使用する気象特徴量（DBには保存されない）"""
    # 日付情報
    prediction_date: date = Field(..., description="予測対象日")

    # 気温データ
    avg_temperature: float | None = Field(None, description="平均気温")
    max_temperature: float | None = Field(None, description="最高気温")
    min_temperature: float | None = Field(None, description="最低気温")

    # 湿度データ
    max_humidity: float | None = Field(None, description="最高湿度", ge=0, le=100)
    min_humidity: float | None = Field(None, description="最低湿度", ge=0, le=100)
    avg_humidity: float | None = Field(None, description="平均湿度", ge=0, le=100)

    # 風速データ
    avg_wind_speed: float | None = Field(None, description="平均風速", ge=0)
    max_wind_speed: float | None = Field(None, description="最高風速", ge=0)
    min_wind_speed: float | None = Field(None, description="最低風速", ge=0)

    # 日照時間データ
    sunshine_hours_0_8: float | None = Field(None, description="日照時間0-8h", ge=0, le=8)
    sunshine_hours_9_16: float | None = Field(None, description="日照時間9-16h", ge=0, le=8)
    sunshine_hours_17_23: float | None = Field(None, description="日照時間17-23h", ge=0, le=7)
    total_sunshine_hours: float | None = Field(None, description="全日照時間", ge=0, le=24)

    # 気圧データ
    avg_pressure: float | None = Field(None, description="平均気圧")
    max_pressure: float | None = Field(None, description="最高気圧")
    min_pressure: float | None = Field(None, description="最低気圧")

    # 降水量データ
    precipitation_0_8: float | None = Field(None, description="降水量0-8h", ge=0)
    precipitation_9_16: float | None = Field(None, description="降水量9-16h", ge=0)
    precipitation_17_23: float | None = Field(None, description="降水量17-23h", ge=0)
    total_precipitation: float | None = Field(None, description="降水量", ge=0)

    # WBGT指数
    s_wbgt: float | None = Field(None, description="s_WBGT")

    # 積算温度
    max_accumulated_temp_10: float | None = Field(None, description="最高積算温度10")
    min_accumulated_temp_10: float | None = Field(None, description="最低積算温度10")

    # 日較差
    daily_temperature_range: float | None = Field(None, description="日較差")

    # 日数カウント（特徴量として0/1で使用）
    summer_day: bool | None = Field(None, description="夏日")
    very_hot_day: bool | None = Field(None, description="真夏日")
    extremely_hot_day: bool | None = Field(None, description="猛暑日")
    extremely_hot_day_40over: bool | None = Field(None, description="猛暑日40over")
    tropical_night: bool | None = Field(None, description="熱帯夜")
    winter_day: bool | None = Field(None, description="冬日")
    very_cold_day: bool | None = Field(None, description="真冬日")

    # その他の特徴量
    last_day: float | None = Field(None, description="last_day")
    mv_avg10: float | None = Field(None, description="mv_avg10")


class EmergencyDispatchPredictionRequest(BaseModel):
    """救急出場件数予測リクエスト用スキーマ"""
    weather_features: WeatherFeatures
    model_name: str | None = Field(default="0926test", description="使用するモデル名")


class EmergencyDispatchPredictionResponse(BaseModel):
    """救急出場件数予測レスポンス用スキーマ"""
    id: UUID
    prediction_date: date
    predicted_count: int
    confidence_score: float | None
    model_name: str
    model_version: str | None
    dagshub_run_id: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class EmergencyDispatchPredictionCreate(BaseModel):
    """救急出場件数予測作成用スキーマ（内部使用）"""
    prediction_date: date
    predicted_count: int
    confidence_score: float | None = None
    model_name: str
    model_version: str | None = None
    dagshub_run_id: str | None = None


class PredictionSummary(BaseModel):
    """予測結果サマリー用スキーマ"""
    date: date
    predicted_count: int
    confidence_score: float | None
    model_name: str

    class Config:
        from_attributes = True
