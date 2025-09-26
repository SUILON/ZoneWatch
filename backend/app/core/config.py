"""
アプリケーション設定管理
環境変数を使用した設定の一元管理
"""
import os


class Settings:
    """アプリケーション設定クラス"""
    def __init__(self):
        # プロジェクト情報
        self.PROJECT_NAME: str = "Zone Watch"
        self.VERSION: str = "1.0.0"
        self.DESCRIPTION: str = "Zone Watch Backend API"

        # 環境設定
        self.ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
        self.DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
        self.LOG_LEVEL: str = os.getenv("LOG_LEVEL", "DEBUG")

        # サーバー設定
        self.HOST: str = os.getenv("BACKEND_HOST", "0.0.0.0")
        self.PORT: int = int(os.getenv("BACKEND_PORT", "8000"))
        self.RELOAD: bool = os.getenv("BACKEND_RELOAD", "true").lower() == "true"

        # データベース設定
        self.DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@postgres:5432/mydatabase")

        # セキュリティ設定
        self.JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "development-secret-key")
        self.JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
        self.JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

        # CORS設定
        self.ALLOWED_HOSTS: list[str] = self._parse_list_env("ALLOWED_HOSTS", ["localhost", "127.0.0.1", "0.0.0.0"])
        self.CORS_ORIGINS: list[str] = self._parse_list_env("CORS_ORIGINS", ["http://localhost:5173", "http://127.0.0.1:5173"])

        # MLflow設定（DAGsHub用）
        self.MLFLOW_TRACKING_URI: str = os.getenv("MLFLOW_TRACKING_URI", "https://dagshub.com/username/repository.mlflow")
        self.DAGSHUB_USER_TOKEN: str = os.getenv("DAGSHUB_USER_TOKEN", "")

        # MinIO設定
        self.MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "http://minio:9000")
        self.MINIO_ACCESS_KEY: str = os.getenv("MINIO_ROOT_USER", "minioadmin")
        self.MINIO_SECRET_KEY: str = os.getenv("MINIO_ROOT_PASSWORD", "minioadmin")

    def _parse_list_env(self, env_name: str, default: list[str]) -> list[str]:
        """環境変数をリストとして解析する"""
        value = os.getenv(env_name)
        if not value:
            return default
        return [item.strip() for item in value.split(",") if item.strip()]


# グローバル設定インスタンス
settings = Settings()
