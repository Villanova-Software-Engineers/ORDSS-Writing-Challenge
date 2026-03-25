from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from ..core import limiter

from ..core import get_db
from ..crud import session as session_crud
from ..schemas import SessionStart, SessionStop, SessionAdminAdjustment, SessionRead

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.post("/start", response_model=SessionRead)
@limiter.limit("10/minute;100/hour")
async def start_session_handler(
    request: Request, data: SessionStart, db: Session = Depends(get_db)):
    try:
        session = session_crud.create_session(data, db)
        return session
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Session for this user on this date already exists")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to start session")


@router.patch("/stop", response_model=SessionRead)
@limiter.limit("5/minute;50/hour")
async def stop_session_handler(
    request: Request, data: SessionStop, db: Session = Depends(get_db)):
    try:
        session = session_crud.stop_session(data.user_id, db)
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active session not found")
        return session
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to stop session")


@router.patch("/admin/adjust", response_model=SessionRead)
@limiter.limit("5/minute;50/hour")
async def admin_adjust_session_handler(
    request: Request, data: SessionAdminAdjustment, db: Session = Depends(get_db)):
    try:
        session = session_crud.adjust_session_admin(data, db)
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        return session
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to adjust session")


@router.get("/user/{user_id}", response_model=List[SessionRead])
@limiter.limit("100/minute;100/hour")
async def get_user_sessions_handler(
    request: Request, user_id: int, db: Session = Depends(get_db)):
    try:
        sessions = session_crud.get_user_sessions(user_id, db)
        return sessions
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve sessions")


@router.get("/current/{user_id}", response_model=Optional[SessionRead])
@limiter.limit("100/minute;100/hour")
async def get_current_session_handler(
    request: Request, user_id: int, db: Session = Depends(get_db)):
    try:
        session = session_crud.get_current_session(user_id, db)
        return session
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve current session")