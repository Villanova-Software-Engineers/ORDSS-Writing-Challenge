from pydantic import BaseModel
from typing import Optional


class StreakResponse(BaseModel):
    count: int
    last_date: Optional[str] = None


class StreakUpdateRequest(BaseModel):
    session_started_at: str  # ISO format datetime string
