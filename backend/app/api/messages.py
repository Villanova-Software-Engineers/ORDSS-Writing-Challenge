from fastapi import APIRouter, Depends, Response, Request, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from ..core import get_db
from ..crud import messages as messages_crud
from ..schemas import MessageCreate

router = APIRouter(prefix="/messages")

@router.get("/")
async def get_messages(request: Request, skip: int, limit: int, db: Session = Depends(get_db)):
    try:
        messages = messages_crud.get_messages(skip, limit, db)
        return messages
    except IntegrityError:
        db.rollback()
        raise HTTPException()
    except Exception:
        raise HTTPException()

@router.get("/{id}")
async def get_message(request: Request, id: int, db: Session = Depends(get_db)):
    try:
        message = messages_crud.get_message(id, db)
        return message
    except IntegrityError:
        db.rollback()
        raise HTTPException()
    except Exception:
        raise HTTPException()

@router.post("/")
async def create_message(request: Request, data: MessageCreate, db: Session = Depends(get_db)):
    try:
        message = messages_crud.create_message(data, db)
        return message
    except IntegrityError:
        db.rollback()
        raise HTTPException()
    except Exception:
        raise HTTPException()

@router.delete("/{message_id}")
async def delete_message(request: Request, id: int, db: Session = Depends(get_db)):
    try:
        message = messages_crud.delete_message(id, db)
        return message
    except IntegrityError:
        db.rollback()
        raise HTTPException()
    except Exception:
        raise HTTPException()

