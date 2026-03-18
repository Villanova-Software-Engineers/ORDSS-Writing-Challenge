from pydantic import BaseModel, ConfigDict, Field
from typing import Any, Dict, List, Optional
from datetime import datetime

class UserBase(BaseModel):
    firebase_uid: str = Field(..., min_length=1)
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    department: str = Field(..., min_length=1)
    is_admin: bool = Field(default=False)

class UserCreate(UserBase):
    ...

class UserUpdate(BaseModel):
    firebase_uid: Optional[str] = Field(None, min_length=1)
    first_name: Optional[str] = Field(None, min_length=1)
    last_name: Optional[str] = Field(None, min_length=1)
    department: Optional[str] = Field(None, min_length=1)
    is_admin: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)