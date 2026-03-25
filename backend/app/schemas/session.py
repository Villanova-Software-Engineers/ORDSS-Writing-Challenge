from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import Optional


#make session base
#look at quiz for example
class SessionBase(BaseModel):
    semester_id: int
    user_id: int
    description: Optional[str] = None


class SessionStart(SessionBase):
    pass


class SessionStop(SessionBase):
    pass

class SessionAdminAdjustment(SessionBase):
    model_config = ConfigDict(from_attributes=True)
    session_date: date
    duration: int

class SessionRead(SessionBase):
    id: int
    status: str
    start_time: datetime
    end_time: datetime | None
    duration: int | None
    session_date: date
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)