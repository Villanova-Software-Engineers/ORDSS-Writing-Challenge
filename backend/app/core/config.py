from dotenv import load_dotenv
import os
from typing import List

load_dotenv()

class Settings:
    def __init__(self):
        self.database_url: str = os.getenv("DATABASE_URL", "")
        self.firebase_cred_path: str = os.getenv("FIREBASE_CRED_PATH", "")
        self.project_name: str = "ORDSS-Writing-Challenge"
        self.debug: bool = os.getenv("DEBUG", "false").lower() == "true"

        cors_env = os.getenv("CORS_ORIGINS", "")
        if cors_env:
            self.cors_origins: List[str] = [origin.strip() for origin in cors_env.split(",")]
        else:
            # Default origins for development
            self.cors_origins: List[str] = [
                "https://ordss-writing-challenge.vercel.app"
            ]

settings = Settings()