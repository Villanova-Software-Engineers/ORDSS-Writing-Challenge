from sqlalchemy import Column, Date, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core import Base

class Session(Base):
    __tablename__ = 'sessions'
    __table_args__ = (
        UniqueConstraint("semester_id", "session_date", "user_id"),
        )


    id = Column(Integer, primary_key=True, index=True, foreign_key=True)
    user_id = Column(Integer, nullable=False, foreign_key=True)  #add foreign keys back
    semester_id = Column(Integer, nullable=False, foreign_key=True) #add foreign keys back
    status = Column(String, default="active", nullable=False)
    duration = Column(Integer, nullable=True)  # duration in minutes
    session_date = Column(Date, nullable=False)
    start_time = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
