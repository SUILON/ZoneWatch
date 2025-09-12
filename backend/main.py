"""
Zone Watch Backend API
FastAPIを使用したメインアプリケーション
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings


# FastAPIアプリケーションの初期化
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    debug=settings.DEBUG,
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """ルートエンドポイント - アプリケーション情報を返す"""
    return {
        "message": "Zone Watch Backend API",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "debug": settings.DEBUG
    }


@app.get("/health")
async def health_check():
    """ヘルスチェックエンドポイント"""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }


@app.get("/config")
async def get_config():
    """設定情報エンドポイント（デバッグ用）"""
    if not settings.DEBUG:
        return {"message": "Configuration endpoint is only available in debug mode"}
    
    return {
        "database_url": settings.DATABASE_URL.replace(
            settings.DATABASE_URL.split("@")[0].split("://")[1], "***"
        ),  # パスワード部分を隠す
        "mlflow_uri": settings.MLFLOW_TRACKING_URI,
        "cors_origins": settings.CORS_ORIGINS,
        "debug": settings.DEBUG,
        "environment": settings.ENVIRONMENT,
    }