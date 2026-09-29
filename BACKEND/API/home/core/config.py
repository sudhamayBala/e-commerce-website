from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[3]
ENV_PATH = BASE_DIR / ".env"


class Settings(BaseSettings):

    DATABASE_URL: str
    SECRETE_JWT_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_DAYS: int = 7

    FRONTEND_URL: str = "https://e-commerce-website-od8p.onrender.com"
    BACKEND_URL: str = "https://e-commerce-website-od8p.onrender.com"

    model_config = SettingsConfigDict(
        env_file=ENV_PATH,
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()