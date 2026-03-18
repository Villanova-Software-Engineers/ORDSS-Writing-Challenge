from dotenv import load_dotenv
import os
from typing import List

load_dotenv()

class Settings:
    def __init__(self):
        self.database_url: str = os.getenv("DATABASE_URL", "")
        self.firebase_cred_path: str = os.getenv("FIREBASE_CRED_PATH", "")
        self.project_name: str = "VIRS-Writing-Challenge"

        self.cors_origins: List[str] = [
            origin.strip()
            for origin in os.getenv("CORS_ORIGINS", "https://localhost:3000").split(",")
        ]

settings = Settings()