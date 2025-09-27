/// <reference types="vite/client" />

// 環境変数の型定義
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_MLFLOW_TRACKING_URI: string
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_VERSION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 環境変数設定クラス
export class Config {
  // API設定
  static readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  static readonly MLFLOW_TRACKING_URI = import.meta.env.VITE_MLFLOW_TRACKING_URI || 'http://localhost:5000'

  // アプリケーション情報
  static readonly APP_TITLE = import.meta.env.VITE_APP_TITLE || 'Zone Watch'
  static readonly APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0'

  // 開発モード判定
  static readonly IS_DEV = import.meta.env.DEV
  static readonly IS_PROD = import.meta.env.PROD

  // デバッグ情報表示（開発環境でのみ）
  static logConfig() {
    if (Config.IS_DEV) {
      console.log('🔧 Application Configuration:', {
        apiBaseUrl: Config.API_BASE_URL,
        mlflowUri: Config.MLFLOW_TRACKING_URI,
        title: Config.APP_TITLE,
        version: Config.APP_VERSION,
        isDev: Config.IS_DEV,
      })
    }
  }
}

export default Config