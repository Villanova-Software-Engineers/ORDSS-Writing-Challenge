from pydantic import BaseModel

class Message(BaseModel):
    author: str
    id: int
    content: str
    timestamp: str| None = None
    reply_to_id: int | None = None

class MessageCreate(Message):
    pass

